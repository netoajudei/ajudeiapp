import { createClient } from '@/lib/supabase/client';
import { CreateReservationPayload } from '@/types';

const SUPABASE_BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const VALIDATE_CLIENT_URL = `${SUPABASE_BASE_URL}/functions/v1/validate-and-find-client`;
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
  suggestAnonymous?: boolean;
}

export const manualReservationService = {
  async validateClient(ddd: string, telefone: string, empresaId: number): Promise<ClientValidationResponse> {
    try {
      const response = await fetch(VALIDATE_CLIENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ddd, telefone, empresa_id: empresaId }),
      });

      const result = await response.json();

      if (result.success === false || result.error) {
        const errorMsg = result.error || 'Cliente não encontrado.';
        const isFormatError = errorMsg.includes('Formato') || errorMsg.includes('inválido');
        return { success: false, error: errorMsg, suggestAnonymous: isFormatError };
      }

      if (result.uuid_identificador || result.id || result.nome) {
        return { success: true, data: result };
      }

      return { success: false, error: 'Resposta inesperada do servidor.' };
    } catch (error: any) {
      console.error('[manualReservationService] validateClient:', error);
      return { success: false, error: 'Erro de conexão com o servidor.' };
    }
  },

  async createReservation(payload: CreateReservationPayload & { cliente_id?: number; cliente_uuid?: string }) {
    const supabase = createClient();

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
      console.error('[manualReservationService] createReservation:', error);
      throw error;
    }

    return data;
  },

  async triggerConfirmationMessage(reservaId: number): Promise<boolean> {
    const supabase = createClient();

    const { error } = await supabase.rpc('confirmar_reserva', {
      p_reserva_id: reservaId,
      p_confirmar: false,
    });

    if (error) {
      console.error('[manualReservationService] triggerConfirmationMessage:', error);
      return false;
    }

    return true;
  },
};
