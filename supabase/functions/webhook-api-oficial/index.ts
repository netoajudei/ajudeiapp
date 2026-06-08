// Webhook para WhatsApp Business API Oficial (Meta/Facebook)
// Este webhook faz TUDO: busca empresa, busca/cria cliente, insere completo no chatsZap
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const isDebugMode = Deno.env.get('DEBUG_MODE') === 'true';
  try {
    // ============================================
    // GET: Verificação do Webhook
    // ============================================
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
      if (!VERIFY_TOKEN) {
        console.error('❌ WHATSAPP_VERIFY_TOKEN não configurado nos secrets da função.');
        return new Response('Forbidden', { status: 403 });
      }
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.warn('✅ Webhook verificado com sucesso!');
        return new Response(challenge, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      } else {
        console.error('❌ Falha na verificação do webhook');
        return new Response('Forbidden', {
          status: 403
        });
      }
    }
    // ============================================
    // POST: Recebimento de Mensagens
    // ============================================
    const body = await req.json();
    if (isDebugMode) {
      console.warn("▶️ [Webhook API Oficial] Payload recebido:", JSON.stringify(body, null, 2));
    }
    if (!body.entry || body.entry.length === 0) {
      console.warn("⚠️ Webhook sem entradas");
      return new Response('ok: no entries', {
        headers: corsHeaders
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, serviceKey);
    // Processa cada entrada
    for (const entry of body.entry){
      if (!entry.changes || entry.changes.length === 0) continue;
      for (const change of entry.changes){
        if (change.field !== 'messages') continue;
        const value = change.value;
        const metadata = value.metadata;
        // Phone Number ID = instancia
        const instancia = metadata?.phone_number_id;
        console.warn(`\n🔑 [Webhook] Phone Number ID (instancia): ${instancia}`);
        if (!instancia) {
          console.error('❌ [Webhook] Phone Number ID não encontrado');
          continue;
        }
        // --- 1. BUSCA A EMPRESA PELA INSTANCIA ---
        console.warn(`🔍 [Webhook] Buscando empresa com instanciaChat = ${instancia}`);
        const { data: empresaData, error: empresaError } = await supabaseClient.from('empresa').select('id, fantasia, instanciaChat, api_provider').eq('instanciaChat', instancia).single();
        if (empresaError || !empresaData) {
          console.error(`❌ [Webhook] Empresa NÃO encontrada para instancia: ${instancia}`);
          console.error(`   Erro: ${empresaError?.message || 'Não encontrada'}`);
          console.error(`   SOLUÇÃO: Execute o SQL abaixo:`);
          console.error(`   UPDATE empresa SET instanciaChat = '${instancia}', api_provider = 'api_oficial' WHERE id = SUA_EMPRESA_ID;`);
          continue;
        }
        const empresa_id = empresaData.id;
        const empresa_nome = empresaData.fantasia;
        console.warn(`✅ [Webhook] Empresa encontrada!`);
        console.warn(`   - ID: ${empresa_id}`);
        console.warn(`   - Nome: ${empresa_nome}`);
        // Processa mensagens
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages){
            console.warn(`\n📩 [Webhook] === PROCESSANDO MENSAGEM ===`);
            console.warn(`   From: ${message.from}`);
            console.warn(`   Type: ${message.type}`);
            // --- FILTRO DE GRUPOS ---
            if (message.from && message.from.includes('@g.us')) {
              console.warn("👥 [Webhook] Mensagem de grupo ignorada");
              continue;
            }
            const remoteJid = message.from;
            if (!remoteJid) {
              console.error('❌ [Webhook] remoteJid não encontrado');
              continue;
            }
            // Formata chatId (padrão @c.us)
            const chatId = remoteJid.replace('@s.whatsapp.net', '') + '@c.us';
            console.warn(`   chatId: ${chatId}`);
            // Extrai nome do contato
            const contact = value.contacts?.find((c)=>c.wa_id === remoteJid);
            const notfyName = contact?.profile?.name || '';
            console.warn(`   Nome: ${notfyName}`);
            // --- 2. BUSCA OU CRIA O CLIENTE ---
            console.warn(`🔍 [Webhook] Buscando cliente: chatId=${chatId}, empresa_id=${empresa_id}`);
            let { data: clienteData, error: clienteError } = await supabaseClient.from('clientes').select('id, nome, chatId, empresa_id').eq('chatId', chatId).eq('empresa_id', empresa_id).single();
            let clientes_id = null;
            if (clienteError || !clienteData) {
              // Cliente não existe - CRIAR
              console.warn(`➕ [Webhook] Cliente não existe - criando novo cliente`);
              const { data: novoCliente, error: criarClienteError } = await supabaseClient.from('clientes').insert({
                instancia: instancia,
                chatId: chatId,
                nome: notfyName || '',
                empresa: empresa_nome,
                empresa_id: empresa_id,
                agendado: false,
                mensagemAgregada: '',
                created_at: new Date().toISOString(),
                modifyed_at: new Date().toISOString()
              }).select().single();
              if (criarClienteError) {
                console.error(`❌ [Webhook] Erro ao criar cliente:`, criarClienteError);
                continue;
              }
              clientes_id = novoCliente.id;
              console.warn(`✅ [Webhook] Cliente criado com sucesso! ID: ${clientes_id}`);
            } else {
              // Cliente já existe
              clientes_id = clienteData.id;
              console.warn(`✅ [Webhook] Cliente encontrado! ID: ${clientes_id}`);
            }
            // --- 3. TRIAGEM DO TIPO DE MENSAGEM ---
            let pergunta_cliente = '';
            let hasAudio = false;
            let type = 'chat';
            switch(message.type){
              case 'text':
                pergunta_cliente = message.text?.body || '';
                console.warn(`   💬 Texto: "${pergunta_cliente}"`);
                break;
              case 'audio':
                {
                  console.warn(`   🎤 Áudio detectado - ID: ${message.audio?.id}`);
                  console.warn(`   📤 Disparando transcrição assíncrona (não cria chatsZap agora)`);
                  // Busca token para transcrever
                  const { data: apiKeyData } = await supabaseClient.from('api_keys').select('whatsapp_access_token, openai_api_key').eq('empresa_id', empresa_id).single();
                  if (apiKeyData?.whatsapp_access_token && apiKeyData?.openai_api_key) {
                    // Dispara transcrição (fire and forget)
                    fetch(`${supabaseUrl}/functions/v1/transcrever-audio`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${serviceKey}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        audio_id: message.audio.id,
                        phone_number_id: instancia,
                        empresa_id: empresa_id,
                        chatId: chatId,
                        notfyName: notfyName,
                        timestamp: message.timestamp
                      })
                    }).catch((err)=>console.error('Erro ao disparar transcrição:', err));
                    console.warn(`   ✅ Transcrição disparada! A função vai criar o chatsZap depois`);
                  } else {
                    console.error(`   ❌ Credenciais faltando - não é possível transcrever`);
                  }
                  continue; // NÃO cria chatsZap aqui
                }
              case 'image':
              case 'video':
                {
                  const mediaType = message.type === 'image' ? 'imagens' : 'vídeos';
                  console.warn(`   🖼️ Mídia (${message.type}) - respondendo e ignorando`);
                  // Busca token e envia resposta automática
                  const { data: apiKeyData } = await supabaseClient.from('api_keys').select('whatsapp_access_token').eq('whatsapp_phone_number_id', instancia).single();
                  if (apiKeyData?.whatsapp_access_token) {
                    const numeroCliente = remoteJid.replace('@s.whatsapp.net', '');
                    const responseMessage = `Desculpe, ainda não consigo processar mídias como ${mediaType}. Por favor, envie sua pergunta em texto. 😊`;
                    const apiUrl = `https://graph.facebook.com/v21.0/${instancia}/messages`;
                    const accessToken = apiKeyData.whatsapp_access_token;
                    // 1. Envia "digitando..."
                    fetch(apiUrl, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: numeroCliente,
                        type: 'typing',
                        typing: {
                          status: 'typing'
                        }
                      })
                    }).catch((err)=>console.warn('Erro ao enviar typing:', err));
                    // 2. Aguarda 1 segundo e envia a mensagem
                    setTimeout(()=>{
                      fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${accessToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          messaging_product: 'whatsapp',
                          to: numeroCliente,
                          type: 'text',
                          text: {
                            body: responseMessage
                          }
                        })
                      }).catch((err)=>console.error('Erro ao enviar resposta:', err));
                    }, 1000);
                  }
                  continue; // Não salva
                }
              case 'button':
                pergunta_cliente = message.button?.text || '';
                console.warn(`   🔘 Botão: "${pergunta_cliente}"`);
                break;
              case 'interactive':
                if (message.interactive?.type === 'button_reply') {
                  pergunta_cliente = message.interactive.button_reply?.title || '';
                } else if (message.interactive?.type === 'list_reply') {
                  pergunta_cliente = message.interactive.list_reply?.title || '';
                }
                console.warn(`   🎯 Interativo: "${pergunta_cliente}"`);
                break;
              default:
                console.warn(`   ⚠️ Tipo não suportado: ${message.type}`);
                continue;
            }
            if (!pergunta_cliente) {
              console.warn("   📖 Mensagem vazia - ignorando");
              continue;
            }
            // --- 4. INSERIR NO CHATSZAP COM TUDO PREENCHIDO ---
            const timestampMs = parseInt(message.timestamp) * 1000;
            const tsData = new Date(timestampMs).toISOString();
            const dataToInsert = {
              instancia: instancia,
              chatId: chatId,
              tsData: tsData,
              mensagem: pergunta_cliente,
              type: type,
              temAudio: hasAudio,
              agregado: false,
              menuEstatico: false,
              notfyName: notfyName,
              empresa_id: empresa_id,
              clientes_id: clientes_id // ✅ CLIENTE JÁ PREENCHIDO
            };
            console.warn(`\n💾 [Webhook] Inserindo em chatsZap:`);
            console.warn(`   - instancia: ${instancia}`);
            console.warn(`   - chatId: ${chatId}`);
            console.warn(`   - empresa_id: ${empresa_id}`);
            console.warn(`   - clientes_id: ${clientes_id}`);
            console.warn(`   - mensagem: "${pergunta_cliente}"`);
            const { data: insertData, error: insertError } = await supabaseClient.from('chatsZap').insert(dataToInsert).select();
            if (insertError) {
              console.error(`❌ [Webhook] ERRO ao inserir em chatsZap:`);
              console.error(`   Message: ${insertError.message}`);
              console.error(`   Details: ${insertError.details}`);
              console.error(`   Code: ${insertError.code}`);
              continue;
            }
            console.warn(`✅ [Webhook] Mensagem inserida no chatsZap com SUCESSO!`);
            console.warn(`   ID do registro: ${insertData?.[0]?.id}`);
            console.warn(`🎯 [Webhook] Trigger 'agregar_mensagem_chatszap' vai apenas agregar a mensagem agora`);
            console.warn(`   (empresa e cliente já estão prontos!)\n`);
          }
        }
        // Log de status (opcional)
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses){
            console.warn(`📬 [Webhook] Status: ${status.status} - Message ID: ${status.id}`);
          }
        }
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Mensagem recebida e processada com sucesso."
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('🔥 [Webhook] ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
