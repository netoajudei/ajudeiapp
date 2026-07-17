import { createClient } from '@/lib/supabase/client';
import { CreateReservationPayload } from '@/types';

const SUPABASE_BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface ClientValidationResponse {
  success: boolean;
  data?: {
    id?: number;
    uuid_identificador?: string;
    nome?: string;
    chatId?: string;
    empresa_id?: number;
    [key: string]: any;
  };
  error?: string;
}

/**
 * Gera todas as variações possíveis de chatId para um DDD+telefone
 */
function buildChatIdVariants(ddd: string, telefone: string): string[] {
  const numero = telefone.replace(/\D/g, '');

  // Gerar variantes com e sem o nono dígito
  let numero8: string, numero9: string;
  if (numero.length === 9 && numero.startsWith('9')) {
    numero9 = numero;
    numero8 = numero.substring(1);
  } else if (numero.length === 8) {
    numero8 = numero;
    numero9 = '9' + numero;
  } else {
    numero8 = numero;
    numero9 = numero;
  }

  const fmt8 = `55${ddd}${numero8}`;
  const fmt9 = `55${ddd}${numero9}`;

  // Todas as combinações possíveis de formato
  return [
    `${fmt8}@c.us`,
    `${fmt9}@c.us`,
    `${fmt8}@lid`,
    `${fmt9}@lid`,
    `${fmt8}@s.whatsapp.net`,
    `${fmt9}@s.whatsapp.net`,
    fmt8,
    fmt9,
  ];
}

export const manualReservationService = {
  /**
   * Busca cliente direto no banco de dados (sem edge function)
   * Cobre todos os formatos de chatId: @c.us, @lid, @s.whatsapp.net, número puro
   */
  async searchClientByPhone(ddd: string, telefone: string, empresaId: number): Promise<ClientValidationResponse> {
    try {
      const supabase = createClient();
      const variants = buildChatIdVariants(ddd, telefone);

      // Buscar com OR de todas as variantes
      const orFilter = variants.map(v => `chatId.eq.${v}`).join(',');

      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, chatId, uuid_identificador, empresa_id')
        .eq('empresa_id', empresaId)
        .or(orFilter)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[manualReservationService] searchClientByPhone:', error);
        return { success: false, error: 'Erro ao buscar cliente.' };
      }

      if (data) {
        return { success: true, data };
      }

      return { success: false, error: 'Cliente não encontrado.' };
    } catch (error: any) {
      console.error('[manualReservationService] searchClientByPhone:', error);
      return { success: false, error: 'Erro ao buscar cliente.' };
    }
  },

  /**
   * Cria um cliente a partir de uma reserva anônima (quando telefone é fornecido)
   */
  async createClientFromAnonymous(params: {
    nome: string;
    telefone: string; // DDD+number (ex: "11999998888")
    empresa_id: number;
  }): Promise<{ id: number; uuid_identificador: string } | null> {
    const supabase = createClient();

    let numero = params.telefone.replace(/\D/g, '');
    if (!numero.startsWith('55')) {
      numero = `55${numero}`;
    }
    const chatId = `${numero}@c.us`;

    // Verificar se já existe com qualquer formato
    // Extrair ddd e numero local para usar buildChatIdVariants
    const ddd = numero.substring(2, 4);
    const localNum = numero.substring(4);
    const variants = buildChatIdVariants(ddd, localNum);
    const orFilter = variants.map(v => `chatId.eq.${v}`).join(',');

    const { data: existing } = await supabase
      .from('clientes')
      .select('id, uuid_identificador')
      .eq('empresa_id', params.empresa_id)
      .or(orFilter)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Atualizar nome se tinha nome genérico
      if (existing.id && params.nome) {
        await supabase
          .from('clientes')
          .update({ nome: params.nome })
          .eq('id', existing.id);
      }
      return existing;
    }

    // Criar novo cliente
    const { data: newClient, error } = await supabase
      .from('clientes')
      .insert({
        nome: params.nome,
        chatId: chatId,
        empresa_id: params.empresa_id,
      })
      .select('id, uuid_identificador')
      .single();

    if (error) {
      console.error('[manualReservationService] createClientFromAnonymous:', error);
      throw error;
    }

    return newClient;
  },

  /**
   * Verifica disponibilidade para uma data/período usando a RPC do banco
   */
  async checkAvailability(
    empresaId: number,
    date: string,
    periodo: string,
    numPessoas: number
  ): Promise<{ disponivel: boolean; motivo?: string }> {
    const supabase = createClient();

    try {
      const { data: anyClient } = await supabase
        .from('clientes')
        .select('uuid_identificador')
        .eq('empresa_id', empresaId)
        .not('uuid_identificador', 'is', null)
        .limit(1)
        .maybeSingle();

      if (anyClient?.uuid_identificador) {
        const { data, error } = await supabase.rpc('verificar_disponibilidade', {
          p_cliente_uuid: anyClient.uuid_identificador,
          p_data_desejada: date,
          p_nome_periodo: periodo,
          p_numero_de_pessoas: numPessoas,
        });

        if (error) throw error;
        return data || { disponivel: true };
      }

      return { disponivel: true };
    } catch (error) {
      console.warn('[manualReservationService] checkAvailability:', error);
      return { disponivel: true };
    }
  },

  async createReservation(payload: CreateReservationPayload & { cliente_id?: number; cliente_uuid?: string }) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservas')
      .insert({
        empresa_id: payload.empresa_id,
        nome: payload.nome,
        data_reserva: payload.data_reserva,
        horario: payload.horario,
        adultos: payload.adultos,
        criancas: payload.criancas || 0,
        convidados: (payload.adultos || 0) + (payload.criancas || 0),
        observacoes: payload.observacoes || null,
        aniversario: payload.aniversario || false,
        confirmada: true,
        confirmada_dia_reserva: true,
        reserva_anonima: !payload.cliente_id,
        clientes_id: payload.cliente_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[manualReservationService] createReservation:', error);
      throw error;
    }

    return data;
  },

  async triggerConfirmationMessage(clienteId: number, reserva: { nome: string; data_reserva: string; adultos: number; criancas: number }): Promise<boolean> {
    try {
      const GATEWAY_URL = `${SUPABASE_BASE_URL}/functions/v1/send-whatsapp-gateway`;
      const dataFmt = new Date(reserva.data_reserva + 'T12:00:00').toLocaleDateString('pt-BR');
      const mensagem = `✅ *Reserva Confirmada!*\n\nOlá, ${reserva.nome}!\nSua reserva foi registrada com sucesso.\n\n📅 *Data:* ${dataFmt}\n👤 *Convidados:* ${reserva.adultos} adultos e ${reserva.criancas || 0} crianças\n\nAguardamos você!`;

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ cliente_id: clienteId, message: mensagem }),
      });

      return response.ok;
    } catch (error) {
      console.error('[manualReservationService] triggerConfirmationMessage:', error);
      return false;
    }
  },
};
