import { createClient } from '@/lib/supabase/client';

export interface Conversa {
  compelition_id: number;
  cliente_id: number;
  nome: string;
  chatId: string;
  telefone: string;
  empresa_id: number;
  instancia: string;
  ultima_mensagem: string;
  ultimo_role: string;
  modificadoEm: string;
}

export interface Mensagem {
  role: 'user' | 'assistant' | 'operator';
  content: string;
}

export const chatService = {
  // Lista conversas recentes (compelition por cliente)
  // Usa a RPC conversas_recentes: a ultima mensagem e extraida no banco, entao
  // trafega ~5kB em vez de baixar o chat inteiro (JSONB) de 50 conversas (~154kB).
  async getConversas(empresaId: number): Promise<Conversa[]> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('conversas_recentes', {
      p_empresa_id: empresaId,
    });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return (data as any[]).map((r) => ({
      compelition_id: r.compelition_id,
      cliente_id: r.cliente_id,
      nome: r.nome || 'Desconhecido',
      chatId: r.chatId || '',
      telefone: r.telefone || '',
      empresa_id: empresaId,
      instancia: r.instancia || '',
      ultima_mensagem: r.ultima_mensagem || '',
      ultimo_role: r.ultimo_role || '',
      modificadoEm: r.modificadoEm || '',
    }));
  },

  // Busca mensagens de uma conversa (compelition.chat)
  async getMensagens(compelitionId: number): Promise<Mensagem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('compelition')
      .select('chat')
      .eq('id', compelitionId)
      .single();

    if (error) throw error;
    return (data?.chat || []) as Mensagem[];
  },

  // Busca compelition por cliente_id
  async getCompelitionByCliente(clienteId: number, empresaId: number): Promise<{ id: number; chat: Mensagem[] } | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('compelition')
      .select('id, chat')
      .eq('cliente', clienteId)
      .eq('empresa', empresaId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { id: data.id, chat: (data.chat || []) as Mensagem[] };
  },

  // Enviar mensagem do operador
  async enviarMensagem(
    clienteId: number,
    chatId: string,
    instancia: string,
    empresaId: number,
    mensagem: string
  ): Promise<void> {
    const supabase = createClient();

    // 1. Adicionar no compelition
    const comp = await this.getCompelitionByCliente(clienteId, empresaId);
    const operatorMsg: Mensagem = { role: 'operator', content: mensagem };

    if (comp) {
      await supabase
        .from('compelition')
        .update({
          chat: [...comp.chat, operatorMsg],
          modificadoEm: new Date().toISOString()
        })
        .eq('id', comp.id);
    } else {
      await supabase
        .from('compelition')
        .insert({
          cliente: clienteId,
          empresa: empresaId,
          chat: [operatorMsg],
          modificadoEm: new Date().toISOString()
        });
    }

    // 2. Enviar via WhatsApp
    const { error: sendError } = await supabase.functions.invoke('send-whatsapp-gateway', {
      body: { cliente_id: clienteId, message: mensagem }
    });
    if (sendError) throw sendError;
  }
};
