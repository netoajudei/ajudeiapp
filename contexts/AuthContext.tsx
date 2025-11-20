"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthUser, Profile, Empresa } from '@/lib/supabase/types';

interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUserData = async (userId: string) => {
    console.log('🔍 [1/4] Iniciando fetchUserData para userId:', userId);
    
    try {
      // Teste de conexão primeiro
      console.log('🔍 [1.5/4] Testando conexão com Supabase...');
      const testConnection = await Promise.race([
        supabase.from('profiles').select('count').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout no teste de conexão')), 5000))
      ]) as any;
      
      if (testConnection.error) {
        console.error('❌ Erro no teste de conexão:', testConnection.error);
        throw new Error(`Erro de conexão com Supabase: ${testConnection.error.message}`);
      }
      
      console.log('✅ Conexão com Supabase OK');
      
      console.log('🔍 [2/4] Buscando profile na tabela profiles...');
      
      // 1. Buscar profile do usuário com timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('⏳ Aguardando resposta da query de profile...');
      
      // Adicionar timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Query de profile demorou mais de 10 segundos')), 10000)
      );

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
      console.log('📦 Resposta recebida!');
      console.log('Profile data:', profile);
      console.log('Profile error:', profileError);

      if (profileError) {
        console.error('❌ Erro ao buscar profile:', profileError);
        console.error('Detalhes do erro:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        // Mensagem mais específica baseada no código de erro
        if (profileError.code === 'PGRST116') {
          throw new Error(`Profile não encontrado para o usuário ${userId}. Verifique se o profile foi criado na tabela profiles.`);
        } else if (profileError.code === '42501') {
          throw new Error(`Permissão negada. Verifique as políticas RLS (Row Level Security) da tabela profiles.`);
        } else {
          throw new Error(`Erro ao buscar profile: ${profileError.message} (code: ${profileError.code})`);
        }
      }

      if (!profile) {
        console.error('❌ Profile retornou null/undefined');
        throw new Error('Profile não existe para este usuário. Verifique se o profile foi criado na tabela profiles.');
      }

      console.log('✅ Profile encontrado:', {
        id: profile.id,
        email: profile.email,
        empresa_id: profile.empresa_id,
        role: profile.role
      });

      if (!profile.empresa_id) {
        console.error('❌ Profile sem empresa vinculada. Profile:', profile);
        throw new Error('Usuário sem empresa vinculada. Entre em contato com o administrador.');
      }

      // 2. Buscar dados da empresa
      console.log('🔍 [3/4] Buscando empresa com ID:', profile.empresa_id);
      
      const empresaPromise = supabase
        .from('empresa')
        .select('*')
        .eq('id', profile.empresa_id)
        .single();

      console.log('⏳ Aguardando resposta da query de empresa...');
      
      // Adicionar timeout de 10 segundos
      const empresaTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Query de empresa demorou mais de 10 segundos')), 10000)
      );

      const { data: empresa, error: empresaError } = await Promise.race([
        empresaPromise,
        empresaTimeoutPromise
      ]) as any;
      
      console.log('📦 Resposta recebida!');
      console.log('Empresa data:', empresa);
      console.log('Empresa error:', empresaError);

      if (empresaError) {
        console.error('❌ Erro ao buscar empresa:', empresaError);
        throw new Error(`Empresa não encontrada: ${empresaError.message} (code: ${empresaError.code})`);
      }

      if (!empresa) {
        console.error('❌ Empresa retornou null/undefined');
        throw new Error(`Empresa com ID ${profile.empresa_id} não existe.`);
      }

      console.log('✅ Empresa encontrada:', {
        id: empresa.id,
        fantasia: empresa.fantasia,
        razaoSocial: empresa.razaoSocial
      });

      console.log('🎉 [4/4] Todos os dados carregados com sucesso!');

      return {
        profile: profile as Profile,
        empresa: empresa as Empresa
      };
    } catch (error: any) {
      console.error('💥 Erro crítico em fetchUserData:', error);
      console.error('Tipo do erro:', typeof error);
      console.error('Mensagem:', error?.message);
      console.error('Stack trace:', error?.stack);
      
      // Se for timeout, dar mensagem mais clara
      if (error?.message?.includes('Timeout')) {
        console.error('⏱️ TIMEOUT DETECTADO - A query do Supabase não retornou em tempo hábil');
        console.error('Possíveis causas:');
        console.error('1. RLS (Row Level Security) bloqueando a query');
        console.error('2. Tabela não existe ou nome incorreto');
        console.error('3. Problema de conexão com Supabase');
        console.error('4. Query muito lenta');
      }
      
      throw error;
    }
  };

  const refreshUserData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const userData = await fetchUserData(currentUser.id);
      setAuthUser(userData);
    }
  };

  useEffect(() => {
    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const userData = await fetchUserData(session.user.id);
          setAuthUser(userData);
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AUTH_STATE_CHANGE] Evento:', event, 'User:', session?.user?.id);
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('🔍 [AUTH_STATE_CHANGE] Buscando dados do usuário...');
        try {
          const userData = await fetchUserData(session.user.id);
          setAuthUser(userData);
          console.log('✅ [AUTH_STATE_CHANGE] Dados carregados com sucesso!');
        } catch (error: any) {
          console.error('❌ [AUTH_STATE_CHANGE] Erro ao buscar dados:', error);
          // Não limpar authUser aqui - deixar o signIn fazer isso se necessário
          // setAuthUser(null);
        }
      } else {
        console.log('🚪 [AUTH_STATE_CHANGE] Sessão removida, limpando dados');
        setAuthUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [SIGNIN] Tentando login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [SIGNIN] Erro no login:', error);
        return { error: error.message };
      }

      console.log('✅ [SIGNIN] Login no Supabase Auth bem-sucedido!', data.user?.id);

      if (!data.user) {
        console.error('❌ [SIGNIN] data.user é null/undefined');
        return { error: 'Usuário não retornado do Supabase Auth' };
      }

      console.log('🔍 [SIGNIN] Iniciando busca de dados do usuário...');
      
      try {
        // Buscar dados com timeout
        const userData = await Promise.race([
          fetchUserData(data.user.id),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao buscar dados (15s)')), 15000)
          )
        ]) as AuthUser;
        
        console.log('✅ [SIGNIN] Dados recebidos, setando authUser...');
        
        // Garantir que o estado seja atualizado
        setUser(data.user);
        setAuthUser(userData);
        
        // Aguardar um tick para garantir que o estado foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ [SIGNIN] authUser setado com sucesso!', {
          profileId: userData.profile.id,
          empresaId: userData.empresa.id
        });
        
        return { error: null };
      } catch (fetchError: any) {
        console.error('❌ [SIGNIN] Erro ao carregar dados do usuário:', fetchError);
        console.error('Stack:', fetchError.stack);
        
        // Fazer logout para limpar sessão inválida
        await supabase.auth.signOut();
        setUser(null);
        setAuthUser(null);
        
        return { 
          error: `Erro ao carregar dados: ${fetchError.message}. Verifique se o usuário tem profile e empresa cadastrados.` 
        };
      }
    } catch (error: any) {
      console.error('❌ [SIGNIN] Erro inesperado no login:', error);
      return { error: error.message || 'Erro ao fazer login' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authUser, loading, signIn, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

