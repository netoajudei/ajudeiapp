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
  async getConversas(empresaId: number): Promise<Conversa[]> {
    console.log('[chatService] getConversas chamado com empresaId:', empresaId);
    const supabase = createClient();

    // Buscar compelitions com chat
    const { data: compData, error: compError } = await supabase
      .from('compelition')
      .select('id, cliente, empresa, chat, modificadoEm')
      .eq('empresa', empresaId)
      .not('chat', 'is', null)
      .order('modificadoEm', { ascending: false })
      .limit(50);

    console.log('[chatService] compelitions:', { count: compData?.length, error: compError?.message });
    if (compError) throw compError;
    if (!compData || compData.length === 0) return [];

    // Buscar clientes associados
    const clienteIds = [...new Set(compData.map((c: any) => c.cliente).filter(Boolean))];
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, chatId, telefone, instancia')
      .in('id', clienteIds);

    console.log('[chatService] clientes:', { count: clientesData?.length, error: clientesError?.message });
    if (clientesError) throw clientesError;

    // Mapear clientes por id
    const clientesMap = new Map<number, any>();
    (clientesData || []).forEach((cl: any) => clientesMap.set(cl.id, cl));

    return compData.map((c: any) => {
      const chat = c.chat || [];
      const ultima = chat[chat.length - 1];
      const cl = clientesMap.get(c.cliente);
      return {
        compelition_id: c.id,
        cliente_id: cl?.id || c.cliente,
        nome: cl?.nome || 'Desconhecido',
        chatId: cl?.chatId || '',
        telefone: cl?.telefone || '',
        empresa_id: empresaId,
        instancia: cl?.instancia || '',
        ultima_mensagem: ultima?.content?.replace(/<data>.*?<\/data>\s*/g, '') || '',
        ultimo_role: ultima?.role || '',
        modificadoEm: c.modificadoEm || c.created_at || ''
      };
    });
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
