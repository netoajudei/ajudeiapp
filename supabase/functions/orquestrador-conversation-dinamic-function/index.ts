/**
 * ===========================================================================
 * Edge Function: orquestrador-conversation-dinamic-function
 * ===========================================================================
 * 
 * @version 3.0.0
 * @author Neto - Anchieta Financeira
 * @date 2024-12-26
 * 
 * @description
 * Orquestrador inteligente para atendimento via WhatsApp usando OpenAI 
 * Conversation API com sistema de tools TOTALMENTE DINÂMICO.
 * 
 * @features
 * - ✅ Tools carregadas dinamicamente do banco (tabela: prompt.tools)
 * - ✅ Functions mapeadas dinamicamente (tabela: functions)
 * - ✅ Execução automática via RPC ou Edge Function (campo: is_rpc)
 * - ✅ Finalização correta de tool calls (mantém mesma conversation)
 * - ✅ Histórico gerenciado pela OpenAI (Conversation API)
 * - ✅ Multi-tenant (cada empresa tem seu prompt/tools/API key)
 * - ✅ Modo teste (não envia WhatsApp se em_teste=true)
 * - ✅ Debug detalhado via RAISE WARNING
 * 
 * @workflow
 * 
 * ENTRADA:
 * {
 *   "cliente_id": 123
 * }
 * 
 * FLUXO:
 * 1. Busca cliente + empresa + mensagemAgregada
 * 2. Busca prompt + tools + API key da empresa
 * 3. Gerencia conversation_id (cria se não existir)
 * 4. Envia mensagem para OpenAI Responses API
 * 5. Detecta se tem tool call:
 *    
 *    ROTA A (Com Tool Call):
 *    - Busca função na tabela functions
 *    - Executa via RPC ou Edge Function
 *    - Finaliza tool call enviando resultado
 *    - OpenAI gera resposta considerando resultado
 *    - Retorna mensagem para n8n enviar
 *    
 *    ROTA B (Sem Tool Call):
 *    - Extrai resposta da IA
 *    - Retorna mensagem para n8n enviar
 * 
 * 6. Limpa estado do cliente (mensagemAgregada, agendado)
 * 7. Retorna resposta JSON
 * 
 * SAÍDA:
 * {
 *   "success": true,
 *   "rota": "A" | "B",
 *   "mensagem": "Resposta da IA...",
 *   "response_id": "resp_xxx",
 *   "conversation_id": "conv_xxx"
 * }
 * 
 * @changelog
 * v3.0.0 (2024-12-26):
 * - Reescrito do zero
 * - Implementação correta de finalização de tool calls
 * - Usa function_call_output em vez de criar nova conversation
 * - Mantém contexto completo da conversa
 * - Sistema totalmente dinâmico
 * 
 * @dependencies
 * - Supabase: clientes, empresa, prompt, api_keys, functions
 * - OpenAI: Conversation API, Responses API
 * - Edge Functions: conforme mapeamento na tabela functions
 */ import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
// ===========================================================================
// CONFIGURAÇÕES
// ===========================================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// ===========================================================================
// HELPER: FETCH OPENAI COM RETRY PARA conversation_locked
// ===========================================================================
async function fetchOpenAIWithRetry(url: string, options: RequestInit, maxRetries = 5): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    const body = await response.text();
    if (body.includes('conversation_locked') && attempt < maxRetries) {
      const baseDelay = (attempt + 1) * 2000;
      const jitter = Math.floor(Math.random() * 2000);
      const delay = baseDelay + jitter;
      console.warn(`[Retry] conversation_locked. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    throw new Error(`Erro OpenAI: ${body}`);
  }
  throw new Error('Máximo de tentativas excedido para conversation_locked');
}
// ===========================================================================
// HELPER: EXTRAIR TEXTO DA RESPOSTA
// ===========================================================================
/**
 * Extrai o texto de resposta do assistant do output da OpenAI
 * @param responseData - Resposta da OpenAI Responses API
 * @returns Texto da resposta ou string vazia
 */ function extractAssistantText(responseData) {
  for (const item of responseData.output || []){
    if (item.type === "message" && item.role === "assistant") {
      const textPart = item.content?.find((c)=>c.type === "output_text");
      if (textPart?.text) return textPart.text;
    }
  }
  return "";
}
// ===========================================================================
// HELPER: FINALIZAR TOOL CALL (MÉTODO CORRETO)
// ===========================================================================
/**
 * Finaliza um tool call enviando o resultado para a mesma conversation
 * Usa o tipo "function_call_output" que mantém o contexto da conversa
 * 
 * @param openaiKey - API Key da OpenAI
 * @param modelo - Modelo a usar (ex: gpt-4o-mini)
 * @param conversationId - ID da conversation (MESMA, não cria nova!)
 * @param toolCallId - ID do tool call a finalizar
 * @param resultado - Resultado da execução da tool (será stringificado)
 * @param instructions - Instructions/prompt para contexto
 * @param tools - Tools disponíveis (opcional)
 * @returns Resposta da OpenAI com mensagem da IA
 */ async function finalizarToolCall(openaiKey, modelo, conversationId, toolCallId, resultado, instructions, tools) {
  console.warn("[finalizarToolCall] 🔄 Finalizando tool call...");
  console.warn(`   Tool Call ID: ${toolCallId}`);
  console.warn(`   Conversation: ${conversationId}`);
  console.warn(`   Resultado:`, resultado);
  const payload = {
    model: modelo,
    conversation: conversationId,
    store: true,
    instructions: instructions,
    tool_choice: "none",
    input: [
      {
        type: "function_call_output",
        call_id: toolCallId,
        output: JSON.stringify(resultado)
      }
    ],
    tools: tools && tools.length > 0 ? tools : undefined
  };
  console.warn("[finalizarToolCall] 📤 Enviando para OpenAI...");
  const response = await fetchOpenAIWithRetry("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  console.warn("[finalizarToolCall] ✅ Tool call finalizado com sucesso");
  console.warn(`   Response ID: ${data.id}`);
  console.warn(`   Tokens: Input=${data.usage?.input_tokens}, Output=${data.usage?.output_tokens}`);
  return data;
}
// ===========================================================================
// SERVIDOR HTTP PRINCIPAL
// ===========================================================================
serve(async (req)=>{
  // =========================================================================
  // PREFLIGHT (OPTIONS)
  // =========================================================================
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  const isDebugMode = Deno.env.get("DEBUG_MODE") === "true";
  try {
    // =======================================================================
    // 1. VALIDAR PAYLOAD
    // =======================================================================
    const body = await req.json();
    const { cliente_id } = body || {};
    if (!cliente_id) {
      throw new Error("O campo 'cliente_id' é obrigatório.");
    }
    if (isDebugMode) {
      console.warn("=".repeat(70));
      console.warn("[Orquestrador v3.0.0] 🚀 INICIANDO");
      console.warn(`   cliente_id: ${cliente_id}`);
      console.warn("=".repeat(70));
    }
    // =======================================================================
    // 2. INICIALIZAR SUPABASE CLIENT
    // =======================================================================
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);
    // =======================================================================
    // 3. BUSCAR CLIENTE + EMPRESA
    // =======================================================================
    if (isDebugMode) console.warn("\n[Orquestrador] 📊 Buscando dados do cliente...");
    const { data: cliente, error: errCliente } = await supabase.from("clientes").select(`
        id, 
        chatId, 
        instancia, 
        conversation_id, 
        empresa_id, 
        mensagemAgregada,
        empresa(id, em_teste)
      `).eq("id", cliente_id).single();
    if (errCliente || !cliente) {
      throw new Error(`Cliente não encontrado: ${errCliente?.message}`);
    }
    const { conversation_id, empresa_id, chatId, instancia, mensagemAgregada } = cliente;
    const em_teste = cliente.empresa?.em_teste ?? false;
    if (isDebugMode) {
      console.warn(`   ✅ Cliente encontrado`);
      console.warn(`   empresa_id: ${empresa_id}`);
      console.warn(`   em_teste: ${em_teste}`);
      console.warn(`   conversation_id: ${conversation_id || "NULL (criar novo)"}`);
    }
    // =======================================================================
    // 4. VALIDAR MENSAGEM AGREGADA
    // =======================================================================
    const mensagemUsuario = (mensagemAgregada ?? "").trim();
    if (!mensagemUsuario) {
      throw new Error("Nenhuma mensagem do usuário encontrada em mensagemAgregada.");
    }
    if (isDebugMode) {
      console.warn(`   mensagem: "${mensagemUsuario.substring(0, 80)}..."`);
    }
    // =======================================================================
    // 5. BUSCAR PROMPT + API KEY
    // =======================================================================
    if (isDebugMode) console.warn("\n[Orquestrador] 📝 Buscando prompt e API key...");
    const { data: promptRow, error: errPrompt } = await supabase.from("prompt").select("prompt, tools, modelo_ia").eq("empresa", empresa_id).eq("tipo_prompt", "principal").order("created_at", {
      ascending: false
    }).limit(1).maybeSingle();
    if (errPrompt) {
      throw new Error(`Erro ao buscar prompt: ${errPrompt.message}`);
    }
    if (!promptRow) {
      throw new Error(`Nenhum prompt do tipo 'principal' encontrado para empresa ${empresa_id}`);
    }
    const { data: apiKeyRow, error: errKey } = await supabase.from("api_keys").select("openai_api_key").eq("empresa_id", empresa_id).single();
    if (errKey || !apiKeyRow?.openai_api_key) {
      throw new Error(`API Key da OpenAI não encontrada para empresa ${empresa_id}`);
    }
    const openaiKey = apiKeyRow.openai_api_key;
    const modelo = promptRow.modelo_ia || "gpt-4o-mini";
    // =======================================================================
    // 6. FORMATAR TOOLS PARA OPENAI
    // =======================================================================
    let tools = [];
    if (promptRow.tools && Array.isArray(promptRow.tools)) {
      tools = promptRow.tools.map((t)=>({
          type: "function",
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }));
    }
    if (isDebugMode) {
      console.warn(`   ✅ Prompt carregado (${promptRow.prompt.length} chars)`);
      console.warn(`   modelo: ${modelo}`);
      console.warn(`   tools: ${tools.length}`);
      if (tools.length > 0) {
        console.warn(`   tools names: ${tools.map((t)=>t.name).join(", ")}`);
      }
    }
    // =======================================================================
    // 7. GERENCIAR CONVERSATION ID
    // =======================================================================
    let currentConversationId = conversation_id;
    if (!currentConversationId) {
      if (isDebugMode) console.warn("\n[Orquestrador] 🆕 Criando nova conversation...");
      const createConvRes = await fetchOpenAIWithRetry("https://api.openai.com/v1/conversations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          metadata: {
            cliente_id: String(cliente_id),
            empresa_id: String(empresa_id),
            tipo: "atendimento_financeiro"
          }
        })
      });
      const convData = await createConvRes.json();
      currentConversationId = convData.id;
      await supabase.from("clientes").update({
        conversation_id: currentConversationId
      }).eq("id", cliente_id);
      if (isDebugMode) console.warn(`   ✅ Conversation criada: ${currentConversationId}`);
    }
    // =======================================================================
    // 8. MONTAR INSTRUCTIONS
    // =======================================================================
    const dataAtual = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo"
    });
    const instructions = `
<data>${dataAtual}</data>

${promptRow.prompt}
`.trim();
    // =======================================================================
    // 9. CHAMAR OPENAI RESPONSES API
    // =======================================================================
    if (isDebugMode) console.warn("\n[Orquestrador] 📤 Enviando para OpenAI...");
    const responsesPayload = {
      model: modelo,
      conversation: currentConversationId,
      store: true,
      instructions,
      input: mensagemUsuario,
      tools: tools.length > 0 ? tools : undefined
    };
    const openaiRes = await fetchOpenAIWithRetry("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(responsesPayload)
    });
    const responseData = await openaiRes.json();
    if (isDebugMode) {
      console.warn(`   ✅ Response ID: ${responseData.id}`);
      console.warn(`   📊 Tokens: Input=${responseData.usage?.input_tokens ?? "?"}, Output=${responseData.usage?.output_tokens ?? "?"}`);
    }
    // =======================================================================
    // 10. DETECTAR TOOL CALL
    // =======================================================================
    let toolCallItem = null;
    for (const item of responseData.output || []){
      if (item.type === "function_call") {
        toolCallItem = item;
        if (isDebugMode) console.warn(`\n[Orquestrador] 🔧 Tool detectada: ${item.name}`);
        break;
      }
    }
    // =======================================================================
    // ROTA A: COM TOOL CALL
    // =======================================================================
    if (toolCallItem) {
      if (isDebugMode) console.warn("\n" + "=".repeat(70));
      if (isDebugMode) console.warn("[Orquestrador] 🔴 ROTA A: PROCESSANDO TOOL CALL");
      if (isDebugMode) console.warn("=".repeat(70));
      // Parse dos argumentos
      const toolArgs = typeof toolCallItem.arguments === "string" ? JSON.parse(toolCallItem.arguments) : toolCallItem.arguments;
      if (isDebugMode) {
        console.warn(`   Tool name: ${toolCallItem.name}`);
        console.warn(`   Tool call ID: ${toolCallItem.call_id || toolCallItem.id}`);
        console.warn("   Argumentos:", toolArgs);
      }
      const tool_call_id = toolCallItem.call_id ?? toolCallItem.id ?? crypto.randomUUID?.() ?? String(Date.now());
      // =====================================================================
      // A.1) BUSCAR FUNÇÃO NO BANCO
      // =====================================================================
      if (isDebugMode) console.warn(`\n[Orquestrador] 🔍 Buscando função: ${toolCallItem.name}`);
      const { data: funcao, error: errFunc } = await supabase.from("functions").select("*").eq("nome", toolCallItem.name).single();
      if (errFunc || !funcao) {
        throw new Error(`Função "${toolCallItem.name}" não encontrada na tabela functions: ${errFunc?.message}`);
      }
      if (isDebugMode) {
        console.warn(`   ✅ Função encontrada`);
        console.warn(`   endpoint: ${funcao.edge_function_name}`);
        console.warn(`   tipo: ${funcao.is_rpc ? "RPC" : "Edge Function"}`);
      }
      // =====================================================================
      // A.2) EXECUTAR: RPC OU EDGE FUNCTION
      // =====================================================================
      let resultadoExecucao = null;
      if (funcao.is_rpc) {
        // ───────────────────────────────────────────────────────────────────
        // EXECUÇÃO VIA RPC (PostgreSQL Function)
        // ───────────────────────────────────────────────────────────────────
        if (isDebugMode) console.warn(`\n[Orquestrador] 🗄️  Executando RPC: ${funcao.edge_function_name}`);
        const { data: rpcData, error: rpcError } = await supabase.rpc(funcao.edge_function_name, {
          args: toolArgs,
          cliente_id: cliente_id
        });
        if (rpcError) {
          throw new Error(`Erro ao executar RPC "${funcao.edge_function_name}": ${rpcError.message}`);
        }
        resultadoExecucao = rpcData;
        if (isDebugMode) {
          console.warn(`   ✅ RPC executada com sucesso`);
          console.warn(`   Resultado:`, resultadoExecucao);
        }
      } else {
        // ───────────────────────────────────────────────────────────────────
        // EXECUÇÃO VIA EDGE FUNCTION (HTTP)
        // ───────────────────────────────────────────────────────────────────
        if (isDebugMode) console.warn(`\n[Orquestrador] 🌐 Executando Edge Function: ${funcao.edge_function_name}`);
        const toolPayload = {
          args: toolArgs,
          clientes_id: cliente_id,
          tool_call_id,
          chatId,
          instancia
        };
        const edgeFuncRes = await fetch(`${supabaseUrl}/functions/v1/${funcao.edge_function_name}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`
          },
          body: JSON.stringify(toolPayload)
        });
        if (!edgeFuncRes.ok) {
          const errText = await edgeFuncRes.text().catch(()=>"(no body)");
          throw new Error(`Erro ao executar Edge Function "${funcao.edge_function_name}": HTTP ${edgeFuncRes.status} - ${errText}`);
        }
        resultadoExecucao = await edgeFuncRes.json();
        if (isDebugMode) {
          console.warn(`   ✅ Edge Function executada com sucesso`);
          console.warn(`   Resultado:`, resultadoExecucao);
        }
      }
      // =====================================================================
      // A.3) FINALIZAR TOOL CALL (MÉTODO CORRETO!)
      // =====================================================================
      if (isDebugMode) console.warn(`\n[Orquestrador] 🔄 Finalizando tool call...`);
      const confirmData = await finalizarToolCall(openaiKey, modelo, currentConversationId, tool_call_id, resultadoExecucao, instructions, tools);
      // =====================================================================
      // A.4) EXTRAIR RESPOSTA FINAL DA IA
      // =====================================================================
      const respostaFinal = extractAssistantText(confirmData) || `✅ ${resultadoExecucao?.message || "Operação concluída com sucesso!"}`;
      if (isDebugMode) {
        console.warn(`\n[Orquestrador] 💬 Resposta final da IA:`);
        console.warn(`   "${respostaFinal.substring(0, 150)}..."`);
      }
      // =====================================================================
      // A.5) LIMPAR ESTADO DO CLIENTE
      // =====================================================================
      await supabase.from("clientes").update({
        mensagemAgregada: "",
        agendado: false
      }).eq("id", cliente_id);
      if (isDebugMode) {
        console.warn("\n" + "=".repeat(70));
        console.warn("[Orquestrador] ✅ CONCLUÍDO (ROTA A)");
        console.warn("=".repeat(70));
      }
      // =====================================================================
      // A.6) RETORNAR RESPOSTA
      // =====================================================================
      const successResponse = {
        success: true,
        rota: "A",
        mensagem: respostaFinal,
        response_id: confirmData.id,
        conversation_id: currentConversationId
      };
      return new Response(JSON.stringify(successResponse), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    // =======================================================================
    // ROTA B: SEM TOOL CALL
    // =======================================================================
    if (isDebugMode) console.warn("\n" + "=".repeat(70));
    if (isDebugMode) console.warn("[Orquestrador] 🟢 ROTA B: RESPOSTA NORMAL");
    if (isDebugMode) console.warn("=".repeat(70));
    const respostaIA = extractAssistantText(responseData);
    if (!respostaIA) {
      throw new Error("Resposta vazia da IA");
    }
    if (isDebugMode) {
      console.warn(`   💬 Resposta: "${respostaIA.substring(0, 150)}..."`);
    }
    // =======================================================================
    // B.1) LIMPAR ESTADO DO CLIENTE
    // =======================================================================
    await supabase.from("clientes").update({
      mensagemAgregada: "",
      agendado: false
    }).eq("id", cliente_id);
    if (isDebugMode) {
      console.warn("\n" + "=".repeat(70));
      console.warn("[Orquestrador] ✅ CONCLUÍDO (ROTA B)");
      console.warn("=".repeat(70));
    }
    // =======================================================================
    // B.2) RETORNAR RESPOSTA
    // =======================================================================
    const successResponse = {
      success: true,
      rota: "B",
      mensagem: respostaIA,
      response_id: responseData.id,
      conversation_id: currentConversationId
    };
    return new Response(JSON.stringify(successResponse), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    // =========================================================================
    // TRATAMENTO DE ERROS
    // =========================================================================
    console.error("🔥 [Orquestrador] ERRO:", error);
    console.error("Stack:", error.stack);
    const errorResponse = {
      success: false,
      error: error.message || "Erro desconhecido"
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
