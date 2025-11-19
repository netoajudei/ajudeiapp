import { AuthResponse, UserProfile } from '../types';

// Simulação da camada de serviço que futuramente usará o Supabase client
// import { supabase } from '../lib/supabase';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // TODO: Substituir por chamada real do Supabase
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Simulating network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (email === 'admin@restauranteia.com' && password === '123456') {
      const mockProfile: UserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        empresa_id: 101,
        role: 'admin',
        nome: 'Admin Pastel Apps',
        email: 'admin@restauranteia.com',
        foto_url: 'https://github.com/shadcn.png',
        telefone: '11999999999',
        chat_id: null,
        ativo: true,
        cadastro_concluido: true,
        ddd: '11',
        updated_at: new Date().toISOString()
      };
      
      return {
        user: mockProfile,
        error: null,
        token: 'mock-jwt-token-123'
      };
    }

    return {
      user: null,
      error: 'Credenciais inválidas ou usuário inativo.'
    };
  },

  logout: async () => {
    // await supabase.auth.signOut();
    console.log('User logged out');
  },

  getSession: async () => {
    // return await supabase.auth.getSession();
    return null;
  }
};