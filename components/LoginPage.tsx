"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowLeft, AlertCircle, Loader2, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseConnectionTest } from './SupabaseConnectionTest';

type LoginFormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, user, authUser, loading } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirecionar se já estiver logado E tiver dados completos
  useEffect(() => {
    console.log('🔍 [LOGIN_PAGE] Estado:', { loading, hasUser: !!user, hasAuthUser: !!authUser });
    
    if (!loading && user && authUser) {
      console.log('✅ [LOGIN_PAGE] Usuário autenticado com dados completos, redirecionando...');
      console.log('📊 [LOGIN_PAGE] Dados:', {
        userId: user.id,
        profileId: authUser.profile.id,
        empresaId: authUser.empresa.id
      });
      setIsLoading(false); // Parar loading antes de redirecionar
      router.push('/dashboard');
    } else if (!loading && user && !authUser) {
      console.warn('⚠️ [LOGIN_PAGE] Usuário autenticado mas sem dados completos. Aguardando...');
    }
  }, [user, authUser, loading, router]);

  const onSubmit = async (data: LoginFormData) => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsLoading(true);
    setLoginError(null);

    try {
      console.log('📝 [LOGIN_PAGE] Iniciando processo de login...');
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        console.error('❌ [LOGIN_PAGE] Erro retornado do signIn:', error);
        setLoginError(error);
        setIsLoading(false);
      } else {
        console.log('✅ [LOGIN_PAGE] SignIn retornou sucesso. O useEffect vai detectar quando authUser estiver pronto.');
        // Timeout de segurança: se após 20 segundos não tiver authUser, mostrar erro
        timeoutRef.current = setTimeout(() => {
          console.error('⏱️ [LOGIN_PAGE] Timeout: authUser não foi setado após 20 segundos');
          setLoginError('Timeout ao carregar dados do usuário. Verifique o console para mais detalhes.');
          setIsLoading(false);
          timeoutRef.current = null;
        }, 20000);
      }
    } catch (e: any) {
      console.error('💥 [LOGIN_PAGE] Exceção no onSubmit:', e);
      setLoginError(e.message || 'Erro ao fazer login');
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  // Limpar timeout quando componente desmontar ou quando authUser for setado
  useEffect(() => {
    if (authUser && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
  };
  }, [authUser]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,147,221,0.05),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
                <ArrowLeft size={16} /> Voltar para o site
            </Link>
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-electric/10 rounded-2xl flex items-center justify-center border border-electric/20">
                    <Bot size={32} className="text-electric" />
                </div>
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Área do Colaborador</h1>
            <p className="text-gray-400 text-sm">Acesse o painel de controle do RestauranteIA</p>
        </div>

        <div className="bg-deep/80 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {loginError && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm"
                    >
                        <AlertCircle size={16} />
                        {loginError}
                    </motion.div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Email Corporativo</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input 
                            {...register("email", { required: true })}
                            type="email"
                            className="w-full bg-dark border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-all placeholder:text-gray-600"
                            placeholder="seu@email.com"
                        />
                    </div>
                    {errors.email && <span className="text-red-400 text-xs">Email é obrigatório</span>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input 
                            {...register("password", { required: true })}
                            type="password"
                            className="w-full bg-dark border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-all placeholder:text-gray-600"
                            placeholder="sua senha"
                        />
                    </div>
                    {errors.password && <span className="text-red-400 text-xs">Senha é obrigatória</span>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-electric to-cyan-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-electric/25 hover:shadow-electric/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Acessando...
                        </>
                    ) : (
                        "Entrar no Sistema"
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-500">
                    Acesso restrito a colaboradores. <br/>
                    Problemas de acesso? Contate o suporte.
                </p>
            </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-600">
            © 2024 Pastel apps. Todos os direitos reservados.
        </div>
      </motion.div>

      {/* Debug Tool */}
      <SupabaseConnectionTest />
    </div>
  );
};

export default LoginPage;