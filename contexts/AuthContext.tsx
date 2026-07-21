"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  // Guarda o id do usuario ja carregado para evitar rebuscar profile+empresa a
  // cada evento de auth (TOKEN_REFRESHED, re-foco da aba, etc.).
  const loadedUserIdRef = useRef<string | null>(null);

  const fetchUserData = async (userId: string): Promise<AuthUser> => {
    const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> =>
      Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout (${ms / 1000}s) ao buscar ${label}`)), ms)
        ),
      ]);

    // Uma unica ida ao banco: profile + empresa via embed (FK profiles.empresa_id -> empresa).
    // Antes eram 2 queries sequenciais; isso reduz pela metade a latencia ate o app
    // liberar o carregamento das reservas.
    const { data, error: profileError } = await withTimeout(
      supabase.from('profiles').select('*, empresa:empresa_id(*)').eq('id', userId).single(),
      10000,
      'profile+empresa'
    ) as any;

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        throw new Error(`Profile não encontrado para o usuário ${userId}.`);
      } else if (profileError.code === '42501') {
        throw new Error('Permissão negada ao buscar profile. Verifique as políticas RLS.');
      }
      throw new Error(`Erro ao buscar profile: ${profileError.message}`);
    }

    if (!data) throw new Error('Profile não existe para este usuário.');

    const { empresa, ...profile } = data as any;
    if (!profile.empresa_id) throw new Error('Usuário sem empresa vinculada. Entre em contato com o administrador.');
    if (!empresa) throw new Error(`Empresa com ID ${profile.empresa_id} não existe.`);

    return { profile: profile as Profile, empresa: empresa as Empresa };
  };

  const refreshUserData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const userData = await fetchUserData(currentUser.id);
      setAuthUser(userData);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Timeout de seguranca: se getSession() travar (ex.: lock preso em
        // webview/PWA), nao deixa o app eternamente no spinner. onAuthStateChange
        // ainda dispara depois e popula a sessao real, se existir.
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 8000)
          ),
        ]);
        if (session?.user) {
          setUser(session.user);
          const userData = await fetchUserData(session.user.id);
          loadedUserIdRef.current = session.user.id;
          setAuthUser(userData);
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Ja temos os dados desse usuario? Nao rebusca (evita idas ao banco em
        // TOKEN_REFRESHED / re-foco da aba).
        if (loadedUserIdRef.current === session.user.id) {
          setLoading(false);
          return;
        }
        try {
          const userData = await fetchUserData(session.user.id);
          loadedUserIdRef.current = session.user.id;
          setAuthUser(userData);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário após mudança de auth:', error);
        }
      } else {
        loadedUserIdRef.current = null;
        setAuthUser(null);
      }

      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { error: error.message };
      if (!data.user) return { error: 'Usuário não retornado do Supabase Auth' };

      try {
        const userData = await Promise.race([
          fetchUserData(data.user.id),
          new Promise<AuthUser>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout ao buscar dados (15s)')), 15000)
          ),
        ]);

        setUser(data.user);
        setAuthUser(userData);
        return { error: null };
      } catch (fetchError: any) {
        console.error('Erro ao carregar dados do usuário após login:', fetchError);
        await supabase.auth.signOut();
        setUser(null);
        setAuthUser(null);
        return { error: `Erro ao carregar dados: ${fetchError.message}` };
      }
    } catch (error: any) {
      console.error('Erro inesperado no login:', error);
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
