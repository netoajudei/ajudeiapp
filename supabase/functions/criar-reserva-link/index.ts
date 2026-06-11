// Esta Edge Function é pública e serve para criar e confirmar uma reserva a partir de um link.
// Ela valida, cria o registro, e notifica o cliente e a equipe.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  try {
    // 1. Recebe o payload do site com os dados da reserva.
    const { cliente_uuid, nome, data_reserva, horario, adultos, criancas, observacoes, aniversario } = await req.json();
    if (!cliente_uuid || !nome || !data_reserva || !horario || !adultos) {
      throw new Error("Dados da reserva incompletos.");
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, serviceKey);
    // 2. "Traduz" o UUID seguro para o ID interno do cliente.
    const { data: clienteData, error: clienteError } = await supabaseClient.from('clientes').select('id, empresa_id, chatId, instancia').eq('uuid_identificador', cliente_uuid).single();
    if (clienteError || !clienteData) {
      throw new Error(`Cliente com o identificador fornecido não foi encontrado.`);
    }
    const { id: clientes_id, empresa_id, chatId, instancia } = clienteData;
    // 3. Insere a nova reserva no banco de dados, já como confirmada.
    const instanciaValue = instancia && String(instancia).trim() !== '' ? instancia : null;
    const { data: novaReserva, error: insertError } = await supabaseClient.from('reservas').insert({
      nome,
      data_reserva,
      horario,
      adultos,
      criancas: criancas || 0,
      observacoes,
      aniversario: aniversario || false,
      clientes_id,
      empresa_id,
      chat_id: chatId,
      instancia: instanciaValue,
      confirmada: true,
      confirmada_automaticamente: true,
      reserva_anonima: false
    }).select('id').single();
    if (insertError) {
      throw new Error(`Ocorreu um erro ao criar sua reserva: ${insertError.message}`);
    }
    // 4. Busca o regulamento da empresa para incluir na mensagem.
    let regulamento = 'Consulte as regras da casa no local.';
    try {
      const { data: promptReservaData } = await supabaseClient.from('prompt_reserva').select('prompt_texto').eq('empresa_id', empresa_id).single();
      if (promptReservaData?.prompt_texto) {
        regulamento = promptReservaData.prompt_texto;
      }
    } catch (e) {
      console.warn("Aviso: Não foi possível buscar o regulamento da reserva.");
    }
    // 5. Constrói a mensagem de confirmação para o cliente.
    const mensagem_cliente = `🎉 *Reserva Confirmada!* 🎉\n\n` + `Olá, ${nome}!\n` + `Sua reserva foi confirmada com sucesso. Estamos ansiosos para recebê-lo(a)!\n\n` + `*Resumo da sua Reserva:*\n` + `-----------------\n` + `📅 *Data:* ${new Date(data_reserva).toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    })}\n` + `👤 *Convidados:* ${adultos} adultos e ${criancas || 0} crianças\n` + `📝 *Observações:* ${observacoes || 'Nenhuma'}\n` + `-----------------\n\n` + `${regulamento}`;
    // 6. Envia a notificação para o cliente através do gateway.
    fetch(`${supabaseUrl}/functions/v1/send-whatsapp-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        cliente_id: clientes_id,
        message: mensagem_cliente
      })
    }).catch(console.error);
    // 7. Envia a notificação para a equipe através do gateway de feedback.
    const messageForTeam = `✅ *Nova Reserva (Site)* ✅\n\nUma nova reserva foi criada e confirmada automaticamente pelo site.\n\n*Nome:* ${nome}\n*Data:* ${data_reserva}\n*Convidados:* ${adultos} adultos e ${criancas || 0} crianças.`;
    fetch(`${supabaseUrl}/functions/v1/feedback-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        empresa_id: empresa_id,
        feedback_type: 'contatoSoReserva',
        message: messageForTeam
      })
    }).catch(console.error);
    // 8. Retorna uma resposta de sucesso para o site.
    return new Response(JSON.stringify({
      success: true,
      message: "Sua reserva foi criada e confirmada com sucesso! Enviamos os detalhes para o seu WhatsApp.",
      id: novaReserva.id
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('🔥 Erro na Edge Function criar-reserva-link:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
