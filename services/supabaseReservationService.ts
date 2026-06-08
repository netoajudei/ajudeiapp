import { createClient } from '@/lib/supabase/client';
import { ResumoReservaDiaria } from '@/lib/supabase/types';

const toLocalDateStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const supabaseReservationService = {
  /**
   * Busca o resumo de reservas por data e empresa
   */
  async getResumoReservasDiarias(empresaId: number, dataInicio?: string, dataFim?: string) {
    const supabase = createClient();
    
    let query = supabase
      .from('resumo_reservas_diarias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('date', { ascending: true });

    if (dataInicio) {
      query = query.gte('date', dataInicio);
    }

    if (dataFim) {
      query = query.lte('date', dataFim);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar resumo de reservas:', error);
      throw error;
    }

    return data as ResumoReservaDiaria[];
  },

  /**
   * Busca o resumo para hoje
   */
  async getResumoHoje(empresaId: number) {
    const hoje = toLocalDateStr(new Date());
    return this.getResumoReservasDiarias(empresaId, hoje, hoje);
  },

  /**
   * Busca o resumo para os próximos 30 dias
   */
  async getResumoProximos30Dias(empresaId: number) {
    const hoje = new Date();
    const daquiA30Dias = new Date(hoje);
    daquiA30Dias.setDate(hoje.getDate() + 30);

    return this.getResumoReservasDiarias(
      empresaId,
      toLocalDateStr(hoje),
      toLocalDateStr(daquiA30Dias)
    );
  },

  /**
   * Busca reservas detalhadas de uma data específica
   */
  async getReservasDetalhadas(empresaId: number, data: string) {
    const supabase = createClient();

    const { data: reservas, error } = await supabase
      .from('reservas')
      .select(`
        *,
        clientes:clientes_id (
          nome,
          chatId,
          foto,
          aniversario,
          telefone,
          uuid_identificador
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('data_reserva', data)
      .order('horario', { ascending: true });

    if (error) {
      console.error('Erro ao buscar reservas detalhadas:', error);
      throw error;
    }

    return reservas;
  },

  /**
   * Busca reservas de hoje (apenas confirmadas)
   */
  async getReservasHoje(empresaId: number) {
    const supabase = createClient();
    const hoje = toLocalDateStr(new Date());

    const { data: reservas, error } = await supabase
      .from('reservas')
      .select(`
        *,
        clientes:clientes_id (
          nome,
          chatId,
          foto,
          aniversario,
          telefone,
          uuid_identificador
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('data_reserva', hoje)
      .eq('confirmada', true)
      .order('horario', { ascending: true });

    if (error) {
      console.error('Erro ao buscar reservas de hoje:', error);
      throw error;
    }

    return reservas;
  },

  /**
   * Atualiza o status de uma reserva
   */
  async updateReservaStatus(reservaId: number, confirmada: boolean, cancelada: boolean = false) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservas')
      .update({
        confirmada_dia_reserva: confirmada,
        cancelada_cliente: cancelada,
        confirmada: confirmada && !cancelada
      })
      .eq('id', reservaId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status da reserva:', error);
      throw error;
    }

    return data;
  },

  /**
   * Busca uma reserva específica por ID
   */
  async getReservaById(empresaId: number, reservaId: number) {
    console.log('🚀 [getReservaById] Iniciando busca:', { empresaId, reservaId });
    const supabase = createClient();

    console.log('📡 [getReservaById] Executando query no Supabase...');
    const { data: reserva, error } = await supabase
      .from('reservas')
      .select(`
        *,
        clientes:clientes_id (
          nome,
          chatId,
          foto,
          aniversario,
          telefone,
          uuid_identificador
        )
      `)
      .eq('id', reservaId)
      .eq('empresa_id', empresaId)
      .single();

    console.log('📦 [getReservaById] Resposta recebida:', {
      hasData: !!reserva,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message
    });

    if (error) {
      console.error('❌ [getReservaById] Erro ao buscar reserva por ID:', error);
      console.error('❌ [getReservaById] Detalhes completos:', {
        reservaId,
        empresaId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!reserva) {
      console.error('❌ [getReservaById] Reserva não encontrada (data é null)');
      throw new Error(`Reserva com ID ${reservaId} não encontrada para a empresa ${empresaId}`);
    }

    console.log('✅ [getReservaById] Reserva encontrada:', {
      id: reserva.id,
      nome: reserva.nome,
      empresa_id: reserva.empresa_id
    });

    return reserva;
  },

  /**
   * Atualiza a mesa de uma reserva
   */
  async updateReservaMesa(reservaId: number, mesa: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservas')
      .update({ mesa })
      .eq('id', reservaId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar mesa da reserva:', error);
      throw error;
    }

    return data;
  },

  /**
   * Busca o ID numérico de um cliente pelo número de telefone (chatId)
   */
  async getClienteIdByTelefone(telefone: string, empresaId: number): Promise<number | null> {
    const supabase = createClient();
    const numero = telefone.replace(/\D/g, '');

    const { data } = await supabase
      .from('clientes')
      .select('id')
      .eq('empresa_id', empresaId)
      .ilike('chatId', `%${numero}%`)
      .limit(1)
      .maybeSingle();

    return data?.id ?? null;
  },

  /**
   * Busca a reserva ativa do cliente pelo UUID
   */
  async buscarReservaAtivaCliente(clienteUuid: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('buscar_reserva_ativa_cliente', {
      p_cliente_uuid: clienteUuid
    });

    if (error) {
      console.error('Erro ao buscar reserva ativa do cliente:', error);
      throw error;
    }

    return data;
  },

  /**
   * Verifica a disponibilidade para uma nova reserva
   */
  async verificarDisponibilidade(params: {
    p_cliente_uuid: string;
    p_data_desejada: string;
    p_nome_periodo: string;
    p_numero_de_pessoas: number;
  }) {
    const supabase = createClient();

    console.log('🔍 [verificarDisponibilidade] Chamando RPC com:', params);

    const { data, error } = await supabase.rpc('verificar_disponibilidade', params);

    if (error) {
      console.error('❌ [verificarDisponibilidade] Erro na RPC:', error);
      throw error;
    }

    console.log('✅ [verificarDisponibilidade] Retorno da RPC:', data);
    return data;
  }
};
