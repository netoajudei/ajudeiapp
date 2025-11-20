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
    // outros campos que a function retornar
    [key: string]: any; 
  };
  error?: string;
}

export const manualReservationService = {
  /**
   * Valida e busca cliente na Edge Function
   */
  async validateClient(ddd: string, telefone: string, empresaId: number): Promise<ClientValidationResponse> {
    try {
      console.log('🚀 [ManualReserva] Validando cliente:', { ddd, telefone, empresaId });
      
      const response = await fetch(VALIDATE_CLIENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ddd,
          telefone,
          empresa_id: empresaId
        }),
      });

      console.log('📡 [ManualReserva] Status HTTP:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ManualReserva] Erro na requisição:', errorText);
        return {
          success: false,
          error: `Erro HTTP: ${response.status}`
        };
      }

      const result = await response.json();
      console.log('✅ [ManualReserva] Resposta JSON:', result);

      // Verifica se houve erro explícito no corpo da resposta
      if (result.success === false || result.error) {
         return {
           success: false,
           error: result.error || 'Cliente não encontrado.'
         };
      }

      // Se a resposta não tem um campo "success" explícito mas retornou dados (como o exemplo do usuário sugere),
      // consideramos sucesso. O exemplo de sucesso era: { "ddd": "...", "telefone": "...", "empresa_id": ... }
      // Vamos assumir que isso é o objeto do cliente.
      
      return {
        success: true,
        data: result
      };

    } catch (error: any) {
      console.error('❌ [ManualReserva] Exceção ao validar cliente:', error);
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
        // cliente_uuid: payload.cliente_uuid || null // Descomentar se a coluna existir
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
    
    // Se o RPC retornar algo que indique sucesso (ex: 200 ou true)
    return true;
  }
};
