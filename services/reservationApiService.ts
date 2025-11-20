/**
 * Serviço para chamar Edge Functions do Supabase relacionadas a reservas
 */

const EDGE_FUNCTION_URL = 'https://ctsvfluufyfhkqlonqio.supabase.co/functions/v1/gerenciar-reserva-link';
const CREATE_RESERVATION_URL = 'https://ctsvfluufyfhkqlonqio.supabase.co/functions/v1/criar-reserva-link';
const EDIT_RESERVATION_URL = 'https://ctsvfluufyfhkqlonqio.supabase.co/functions/v1/solicitar-edicao-reserva-link';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface GerenciarReservaRequest {
  cliente_uuid: string;
  acao: 'confirmar_dia_reserva' | 'cancelar';
}

export interface GerenciarReservaResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CriarReservaRequest {
  nome: string;
  adultos: number;
  data_reserva: string; // YYYY-MM-DD
  horario: string;
  criancas: number;
  observacoes?: string;
  cliente_uuid: string;
  aniversario: boolean;
}

export interface CriarReservaResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface EditarReservaRequest {
  cliente_uuid: string;
  novo_nome: string;
  nova_data_reserva: string;
  novos_adultos: number;
  novas_criancas: number;
  nova_observacao: string;
  novo_horario?: string; // Campo opcional, mas recomendado se a API suportar mudança de turno
}

export interface EditarReservaResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export const reservationApiService = {
  /**
   * Chama a Edge Function do Supabase para gerenciar reserva (confirmar ou cancelar)
   */
  async gerenciarReservaLink(data: GerenciarReservaRequest): Promise<GerenciarReservaResponse> {
    try {
      console.log('🚀 [API] Chamando Edge Function (Gerenciar):', EDGE_FUNCTION_URL, data);

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [API] Resposta recebida (Gerenciar):', result);

      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('❌ [API] Erro ao chamar Edge Function (Gerenciar):', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar requisição'
      };
    }
  },

  /**
   * Chama a Edge Function para CRIAR uma nova reserva
   */
  async criarReservaLink(data: CriarReservaRequest): Promise<CriarReservaResponse> {
    try {
      console.log('🚀 [API] Chamando Edge Function (Criar):', CREATE_RESERVATION_URL, data);

      const response = await fetch(CREATE_RESERVATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [API] Resposta recebida (Criar):', result);

      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('❌ [API] Erro ao chamar Edge Function (Criar):', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar requisição'
      };
    }
  },

  /**
   * Chama a Edge Function para EDITAR uma reserva existente
   */
  async solicitarEdicaoReservaLink(data: EditarReservaRequest): Promise<EditarReservaResponse> {
    try {
      console.log('🚀 [API] Chamando Edge Function (Editar):', EDIT_RESERVATION_URL, data);

      const response = await fetch(EDIT_RESERVATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [API] Resposta recebida (Editar):', result);

      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('❌ [API] Erro ao chamar Edge Function (Editar):', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar requisição'
      };
    }
  }
};
