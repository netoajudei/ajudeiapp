// Gateway de Envio de Mensagens - Redireciona para n8n webhook
// Todos os chamadores enviam { cliente_id, message }
// Este gateway busca o chatId do cliente e encaminha para o n8n
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const N8N_WEBHOOK_URL = 'https://vmi2994109.contaboserver.net/webhook/5084c501-a40a-4ca1-8906-dd1f69e5c44b';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cliente_id, message } = await req.json();
    if (!cliente_id || !message) {
      throw new Error("Dados incompletos. É necessário fornecer 'cliente_id' e 'message'.");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, serviceKey);

    // Busca chatId do cliente
    const { data: clienteData, error: clienteError } = await supabaseClient
      .from('clientes')
      .select('chatId, instancia, empresa_id')
      .eq('id', cliente_id)
      .single();

    if (clienteError || !clienteData) {
      throw new Error(`Cliente não encontrado para o ID: ${cliente_id}.`);
    }

    const { chatId, instancia, empresa_id } = clienteData;

    // Busca o api_provider configurado da empresa (para expor no retorno)
    let api_provider = null;
    if (empresa_id != null) {
      const { data: empresaData, error: empresaError } = await supabaseClient
        .from('empresa')
        .select('api_provider')
        .eq('id', empresa_id)
        .single();
      if (empresaError) {
        console.warn(`⚠️ Não foi possível buscar api_provider da empresa ${empresa_id}:`, empresaError.message);
      } else {
        api_provider = empresaData?.api_provider ?? null;
      }
    }

    // Limpa sufixos @c.us e @s.whatsapp.net, mantém @lid
    const telefone = String(chatId)
      .replace('@c.us', '')
      .replace('@s.whatsapp.net', '');

    console.log(`📤 Encaminhando mensagem para n8n - cliente ${cliente_id}, chatId: ${chatId}, telefone: ${telefone}`);

    // Encaminha para o webhook do n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone,
        mensagem: message,
        api: api_provider
      })
    });

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error(`❌ Erro no n8n webhook:`, errorBody);
      throw new Error(`Erro ao enviar mensagem via n8n: ${n8nResponse.status} - ${errorBody}`);
    }

    let responseData = {};
    try { responseData = await n8nResponse.json(); } catch { /* resposta pode não ser JSON */ }

    console.log(`✅ Mensagem encaminhada com sucesso via n8n`);

    return new Response(JSON.stringify({
      success: true,
      provider: 'n8n',
      api_provider,
      empresa_id,
      detail: responseData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔥 Erro no Gateway de Envio de Mensagens:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
