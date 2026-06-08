// Edge Function: orquestrador-simples
// Recebe cliente_id, usa Responses API com conversation_id, retorna a resposta.
// NAO envia WhatsApp. NAO limpa mensagemAgregada. Seta agendado = false.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function extractAssistantText(resp: any): string {
  for (const item of resp.output || []) {
    if (item.type === 'message' && item.role === 'assistant') {
      const textPart = item.content?.find((c: any) => c.type === 'output_text');
      if (textPart?.text) return textPart.text;
    }
  }
  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cliente_id } = await req.json();
    if (!cliente_id) throw new Error("O 'cliente_id' é obrigatório.");

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // =============================================
    // 1) BUSCAR CLIENTE
    // =============================================
    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('id, chatId, instancia, conversation_id, empresa_id, mensagemAgregada, uuid_identificador, telefone')
      .eq('id', cliente_id)
      .single();

    if (errCliente || !cliente) throw new Error(`Cliente não encontrado: ${errCliente?.message}`);

    const mensagem = (cliente.mensagemAgregada || '').trim();
    if (!mensagem) throw new Error('Mensagem agregada vazia.');

    // =============================================
    // 2) BUSCAR PROMPT + API KEY
    // =============================================
    const { data: promptData, error: errPrompt } = await supabase
      .from('prompt')
      .select('prompt, tools, modelo_ia')
      .eq('empresa', cliente.empresa_id)
      .eq('tipo_prompt', 'principal')
      .single();

    if (errPrompt) throw new Error(`Prompt não encontrado: ${errPrompt.message}`);

    const { data: apiKeyData, error: errKey } = await supabase
      .from('api_keys')
      .select('openai_api_key')
      .eq('empresa_id', cliente.empresa_id)
      .single();

    if (errKey || !apiKeyData?.openai_api_key) throw new Error('API Key da OpenAI não encontrada.');

    const openaiKey = apiKeyData.openai_api_key;
    const modelo = promptData.modelo_ia || 'gpt-4.1-mini';

    // =============================================
    // 3) TOOLS (formato Responses API)
    // =============================================
    let tools: any[] = [];
    if (promptData.tools && Array.isArray(promptData.tools)) {
      tools = promptData.tools.map((t: any) => ({
        type: 'function',
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }));
    }

    // =============================================
    // 4) INSTRUCTIONS (system prompt + link reserva)
    // =============================================
    const dataAtual = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const linkReserva = `https://www.ajudei.app/reserva/${cliente.uuid_identificador}`;

    const instructions = `<data>${dataAtual}</data>
${promptData.prompt}

INSTRUÇÃO ADICIONAL: O link de reserva exclusivo para este cliente é: ${linkReserva}. Forneça apenas se o cliente perguntar sobre reserva.`.trim();

    // =============================================
    // 5) CONVERSATION ID (criar se não existir)
    // =============================================
    let conversationId = cliente.conversation_id;

    if (!conversationId) {
      const createRes = await fetch('https://api.openai.com/v1/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!createRes.ok) throw new Error(`Erro ao criar conversation: ${await createRes.text()}`);
      const convData = await createRes.json();
      conversationId = convData.id;

      await supabase
        .from('clientes')
        .update({ conversation_id: conversationId })
        .eq('id', cliente_id);
    }

    // =============================================
    // 6) CHAMAR RESPONSES API
    // =============================================
    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelo,
        conversation: conversationId,
        store: true,
        instructions,
        input: mensagem,
        tools: tools.length > 0 ? tools : undefined,
        reasoning: {
          effort: 'medium',
          summary: 'detailed'
        }
      })
    });

    if (!openaiRes.ok) throw new Error(`Erro OpenAI: ${await openaiRes.text()}`);
    const responseData = await openaiRes.json();

    // =============================================
    // 7) PROCESSAR RESPOSTA
    // =============================================
    let resposta = '';
    let toolExecuted: string | null = null;

    // Verifica se tem tool call
    let toolCallItem: any = null;
    for (const item of responseData.output || []) {
      if (item.type === 'function_call') {
        toolCallItem = item;
        break;
      }
    }

    if (toolCallItem) {
      // --- ROTA A: TOOL CALL ---
      const toolArgs = typeof toolCallItem.arguments === 'string'
        ? JSON.parse(toolCallItem.arguments)
        : toolCallItem.arguments;

      const lower = (toolCallItem.name || '').toLowerCase();
      let functionToCall = toolCallItem.name;

      // Mapeamento de nomes
      if (lower === 'aciona_fluxo_reserva' || lower === 'acionar_funcao_reserva') {
        functionToCall = 'enviar-link-reserva';
      } else if (lower === 'parceirosfornecedores') {
        functionToCall = 'novos-parceiros';
      } else if (lower === 'vagasdeemprego') {
        functionToCall = 'recrutamento';
      }

      // Executa a tool
      const toolPayload = {
        args: toolArgs,
        clientes_id: cliente_id,
        tool_call_id: toolCallItem.call_id || toolCallItem.id,
        chatId: cliente.chatId,
        instancia: cliente.instancia
      };

      const toolResp = await fetch(`${supabaseUrl}/functions/v1/${functionToCall}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify(toolPayload)
      });

      let toolResult = 'Executado com sucesso.';
      if (toolResp.ok) {
        try { toolResult = JSON.stringify(await toolResp.json()); } catch { /* ignora */ }
      }

      toolExecuted = functionToCall;

      // Submete resultado da tool de volta para a conversation
      const followUpRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelo,
          conversation: conversationId,
          store: true,
          instructions,
          input: [{
            type: 'function_call_output',
            call_id: toolCallItem.call_id || toolCallItem.id,
            output: toolResult
          }],
          tools: tools.length > 0 ? tools : undefined,
          reasoning: {
            effort: 'medium',
            summary: 'detailed'
          }
        })
      });

      if (!followUpRes.ok) throw new Error(`Erro ao submeter resultado da tool: ${await followUpRes.text()}`);
      const followUpData = await followUpRes.json();

      resposta = extractAssistantText(followUpData) || `Função ${functionToCall} executada com sucesso.`;
    } else {
      // --- ROTA B: RESPOSTA DIRETA ---
      resposta = extractAssistantText(responseData);
    }

    if (!resposta) throw new Error('Resposta vazia da IA.');

    // =============================================
    // 8) SALVAR PERGUNTA + RESPOSTA NO COMPELITION
    // =============================================
    const dataAtualMsg = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const userMsg = { role: 'user', content: `<data>${dataAtualMsg}</data> ${mensagem}` };
    const assistantMsg = { role: 'assistant', content: resposta };

    // Buscar compelition existente ou criar
    const { data: compExistente } = await supabase
      .from('compelition')
      .select('id, chat')
      .eq('cliente', cliente_id)
      .eq('empresa', cliente.empresa_id)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (compExistente) {
      const chatAtual = compExistente.chat || [];
      await supabase
        .from('compelition')
        .update({
          chat: [...chatAtual, userMsg, assistantMsg],
          modificadoEm: new Date().toISOString()
        })
        .eq('id', compExistente.id);
    } else {
      await supabase
        .from('compelition')
        .insert({
          cliente: cliente_id,
          empresa: cliente.empresa_id,
          chat: [userMsg, assistantMsg],
          modificadoEm: new Date().toISOString()
        });
    }

    // =============================================
    // 9) SETA AGENDADO = FALSE (nao limpa mensagemAgregada)
    // =============================================
    await supabase
      .from('clientes')
      .update({ agendado: false })
      .eq('id', cliente_id);

    // =============================================
    // 10) RETORNA A RESPOSTA
    // =============================================
    return new Response(JSON.stringify({
      success: true,
      resposta,
      conversation_id: conversationId,
      cliente_id: cliente.id,
      chatId: cliente.chatId,
      telefone: cliente.telefone || null,
      tool_executed: toolExecuted
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro no orquestrador-simples:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
