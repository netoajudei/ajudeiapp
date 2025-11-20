import { createClient } from '@/lib/supabase/client';
import { CreateReservationPayload } from '@/types';

const VALIDATE_CLIENT_URL = 'https://ctsvfluufyfhkqlonqio.supabase.co/functions/v1/validate-and-find-client';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface ClientValidationResponse {
  success: boolean;
  data?: {
    id?: number;
    uuid_identificador?: string;
    nome?: string;
    telefone?: string;
    ddd?: string;
    empresa_id?: number;
    [key: string]: any; 
  };
  error?: string;
  suggestAnonymous?: boolean; // Flag para sugerir reserva anônima
}

export const manualReservationService = {
  /**
   * Valida e busca cliente na Edge Function
   */
  async validateClient(ddd: string, telefone: string, empresaId: number): Promise<ClientValidationResponse> {
    try {
      console.log('🚀 [ManualReserva] Validando cliente:', { ddd, telefone, empresaId });
      
      const payload = {
        ddd,
        telefone,
        empresa_id: empresaId
      };
      
      console.log('📤 [ManualReserva] Payload enviado:', payload);
      
      const response = await fetch(VALIDATE_CLIENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 [ManualReserva] Status HTTP:', response.status);
      console.log('📡 [ManualReserva] Headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('✅ [ManualReserva] Resposta JSON completa:', JSON.stringify(result, null, 2));

      // CASO 1: Erro explícito (success: false ou campo error)
      if (result.success === false || result.error) {
        const errorMsg = result.error || 'Cliente não encontrado.';
        console.warn('⚠️ [ManualReserva] Cliente não encontrado:', errorMsg);
        
        // Se for erro de formato, sugerir reserva anônima
        const isFormatError = errorMsg.includes('Formato') || errorMsg.includes('inválido');
        
        return {
          success: false,
          error: errorMsg,
          suggestAnonymous: isFormatError
        };
      }

      // CASO 2: Cliente encontrado (resposta tem uuid_identificador ou outros campos do cliente)
      // Baseado no exemplo do usuário, quando encontra vem um objeto com uuid_identificador, etc.
      if (result.uuid_identificador || result.id || result.nome) {
        console.log('✅ [ManualReserva] Cliente encontrado!', result);
        return {
          success: true,
          data: result
        };
      }

      // CASO 3: Resposta inesperada
      console.warn('⚠️ [ManualReserva] Resposta não reconhecida:', result);
      return {
        success: false,
        error: 'Resposta inesperada do servidor.'
      };

    } catch (error: any) {
      console.error('❌ [ManualReserva] Exceção ao validar cliente:', error);
      console.error('❌ [ManualReserva] Stack:', error.stack);
      return {
        success: false,
        error: 'Erro de conexão com o servidor.'
      };
    }
  },

  /**
   * Cria a reserva diretamente no banco de dados
   */
  async createReservation(payload: CreateReservationPayload & { cliente_id?: number, cliente_uuid?: string }) {
    const supabase = createClient();

    console.log('🚀 [ManualReserva] Criando reserva no DB:', payload);

    const { data, error } = await supabase
      .from('reservas')
      .insert({
        empresa_id: payload.empresa_id,
        nome: payload.nome,
        telefone: payload.telefone,
        data_reserva: payload.data_reserva,
        horario: payload.horario,
        adultos: payload.adultos,
        criancas: payload.criancas,
        observacoes: payload.observacoes,
        aniversario: payload.aniversario,
        status: 'confirmada',
        confirmada_dia_reserva: true,
        origem: 'manual',
        cliente_id: payload.cliente_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [ManualReserva] Erro ao inserir reserva:', error);
      throw error;
    }

    console.log('✅ [ManualReserva] Reserva criada:', data);
    return data;
  },

  /**
   * Dispara a mensagem de confirmação via RPC
   */
  async triggerConfirmationMessage(reservaId: number): Promise<boolean> {
    const supabase = createClient();

    console.log('🚀 [ManualReserva] Disparando mensagem para reserva:', reservaId);

    const { data, error } = await supabase.rpc('confirmar_reserva', {
      p_reserva_id: reservaId,
      p_confirmar: false 
    });

    if (error) {
      console.error('❌ [ManualReserva] Erro no RPC confirmar_reserva:', error);
      return false;
    }

    console.log('✅ [ManualReserva] Resultado RPC:', data);
    
    return true;
  }
};
