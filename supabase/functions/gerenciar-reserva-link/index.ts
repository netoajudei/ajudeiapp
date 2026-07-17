// Esta Edge Function é pública e serve para um cliente gerenciar sua própria
// reserva (confirmar, confirmar no dia, ou cancelar) a partir de um link seguro.
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
    // 1. Recebe o payload do site com a ação e o UUID do CLIENTE.
    const { cliente_uuid, acao } = await req.json();
    if (!cliente_uuid || !acao) {
      throw new Error("Dados incompletos. É necessário fornecer o UUID do cliente e a ação desejada.");
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, serviceKey);
    // 2. Busca o cliente de forma segura usando o UUID para obter o ID interno.
    const { data: cliente, error: clienteError } = await supabaseClient.from('clientes').select('id').eq('uuid_identificador', cliente_uuid).single();
    if (clienteError || !cliente) {
      throw new Error('Identificador de cliente inválido ou não encontrado.');
    }
    const cliente_id = cliente.id;
    // 3. Busca a reserva ativa mais recente para este cliente.
    const { data: reserva, error: findError } = await supabaseClient.from('reservas').select('*') // Busca todos os dados para a construção da mensagem
    .eq('clientes_id', cliente_id).eq('cancelada_cliente', false).eq('cancelada_casa', false).gte('data_reserva', new Date().toISOString().split('T')[0]).order('created_at', {
      ascending: false
    }).limit(1).single();
    if (findError || !reserva) {
      throw new Error(`Nenhuma reserva ativa encontrada para este cliente.`);
    }
    let updateData = {};
    let messageForClient = '';
    let messageForTeam = '';
    const dataFormatada = new Date(reserva.data_reserva).toLocaleDateString('pt-BR', {
      timeZone: 'UTC'
    });
    // 4. Define a ação a ser executada com base no parâmetro 'acao'.
    switch(acao){
      case 'confirmar':
        // Lógica de confirmação de uma nova reserva ou de uma edição.
        updateData = {
          nome: reserva.novo_nome || reserva.nome,
          adultos: reserva.novo_adultos || reserva.adultos,
          criancas: reserva.novo_crianca || reserva.criancas,
          observacoes: reserva.nova_observacao || reserva.observacoes,
          editar: false,
          confirmada: true,
          novo_nome: null,
          novo_adultos: null,
          novo_crianca: null,
          nova_observacao: null
        };
        const { data: promptData } = await supabaseClient.from('prompt_reserva').select('prompt_texto').eq('empresa_id', reserva.empresa_id).single();
        const regulamento = promptData?.prompt_texto || '';
        // Decide se a mensagem é de "Atualizada" ou "Confirmada"
        if (reserva.editar) {
          messageForClient = `🔄 *Sua Reserva foi Atualizada!* 🔄\n\n` + `Olá, ${updateData.nome}!\n` + `Sua solicitação de alteração foi aprovada com sucesso.\n\n` + `*Novos Detalhes da Reserva:*\n` + `-----------------\n` + `📅 *Data:* ${dataFormatada}\n` + `👤 *Convidados:* ${updateData.adultos} adultos e ${updateData.criancas || 0} crianças\n` + `📝 *Observações:* ${updateData.observacoes || 'Nenhuma'}\n` + `-----------------\n\n` + `_Atenção: Por favor, desconsidere qualquer confirmação anterior._\n\n` + `${regulamento}`;
        } else {
          messageForClient = `🎉 *Reserva Confirmada!* 🎉\n\n` + `Olá, ${reserva.nome}!\n` + `Sua reserva foi confirmada com sucesso. Estamos ansiosos para recebê-lo(a)!\n\n` + `*Resumo da sua Reserva:*\n` + `-----------------\n` + `📅 *Data:* ${dataFormatada}\n` + `👤 *Convidados:* ${reserva.adultos} adultos e ${reserva.criancas || 0} crianças\n` + `📝 *Observações:* ${reserva.observacoes || 'Nenhuma'}\n` + `-----------------\n\n` + `${regulamento}`;
        }
        messageForTeam = `✅ *Reserva Confirmada (Cliente)*\n\nA reserva em nome de *${reserva.nome}* para o dia ${dataFormatada} foi confirmada pelo cliente.`;
        break;
      case 'confirmar_dia_reserva':
        // Verificar se hoje é o dia da reserva (timezone São Paulo)
        const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
        if (reserva.data_reserva !== hoje) {
          throw new Error('A confirmação de presença só está disponível no dia da reserva.');
        }
        updateData = {
          confirmada_dia_reserva: true
        };
        messageForClient = `✅ Olá, ${reserva.nome}! Sua presença na reserva para hoje, ${dataFormatada}, foi confirmada com sucesso. Estamos ansiosos para recebê-lo(a)!`;
        messageForTeam = `👍 *Presença Confirmada (Cliente)*\n\nA reserva em nome de *${reserva.nome}* para hoje, ${dataFormatada}, foi confirmada pelo cliente.`;
        break;
      case 'cancelar':
        updateData = {
          cancelada_cliente: true
        };
        messageForClient = `Sua reserva para o dia ${dataFormatada} foi cancelada, conforme solicitado. Sentimos muito por não poder recebê-lo(a) desta vez, mas esperamos que não faltem oportunidades para você retornar à nossa casa!`;
        messageForTeam = `❌ *Reserva Cancelada (Cliente)*\n\nA reserva em nome de *${reserva.nome}* para o dia ${dataFormatada} foi cancelada pelo próprio cliente.`;
        break;
      default:
        throw new Error("Ação inválida. As ações permitidas são 'confirmar', 'confirmar_dia_reserva' ou 'cancelar'.");
    }
    // 5. Executa a atualização no banco de dados.
    const { error: updateError } = await supabaseClient.from('reservas').update(updateData).eq('id', reserva.id);
    if (updateError) {
      throw new Error(`Ocorreu um erro ao atualizar sua reserva: ${updateError.message}`);
    }
    // 6. Envia as notificações de segurança para o cliente e para a equipe.
    fetch(`${supabaseUrl}/functions/v1/send-whatsapp-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        cliente_id: cliente_id,
        message: messageForClient
      })
    }).catch(console.error);
    fetch(`${supabaseUrl}/functions/v1/feedback-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        empresa_id: reserva.empresa_id,
        feedback_type: 'contatoSoReserva',
        message: messageForTeam
      })
    }).catch(console.error);
    // 7. Retorna uma resposta de sucesso para o site.
    return new Response(JSON.stringify({
      success: true,
      message: `Ação '${acao}' executada com sucesso.`
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('🔥 Erro na Edge Function gerenciar-reserva-link:', error);
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
