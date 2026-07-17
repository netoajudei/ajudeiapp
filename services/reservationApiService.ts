/**
 * Serviço para chamar Edge Functions do Supabase relacionadas a reservas
 */

const SUPABASE_BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const EDGE_FUNCTION_URL = `${SUPABASE_BASE_URL}/functions/v1/gerenciar-reserva-link`;
const CREATE_RESERVATION_URL = `${SUPABASE_BASE_URL}/functions/v1/criar-reserva-link`;
const EDIT_RESERVATION_URL = `${SUPABASE_BASE_URL}/functions/v1/solicitar-edicao-reserva-link`;
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


export interface SendWhatsAppRequest {
  cliente_id: number;
  message: string;
}

export interface SendWhatsAppResponse {
  success: boolean;
  provider?: string;
  error?: string;
}

export const reservationApiService = {
  /**
   * Envia mensagem WhatsApp via gateway para um cliente pelo ID numérico
   */
  async sendWhatsAppMessage(data: SendWhatsAppRequest): Promise<SendWhatsAppResponse> {
    try {
      const SEND_WHATSAPP_URL = `${SUPABASE_BASE_URL}/functions/v1/send-whatsapp-gateway`;
      const response = await fetch(SEND_WHATSAPP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || `Erro HTTP: ${response.status}` };
      }

      return { success: true, provider: result.provider };
    } catch (error: any) {
      console.error('[reservationApiService] sendWhatsAppMessage:', error);
      return { success: false, error: error.message || 'Erro de conexão' };
    }
  },
  /**
   * Chama a Edge Function do Supabase para gerenciar reserva (confirmar ou cancelar)
   */
  async gerenciarReservaLink(data: GerenciarReservaRequest): Promise<GerenciarReservaResponse> {
    try {
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
      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('[reservationApiService] gerenciarReservaLink:', error);
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
      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('[reservationApiService] criarReservaLink:', error);
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
      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error('[reservationApiService] solicitarEdicaoReservaLink:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar requisição'
      };
    }
  }
};
