// Edge Function: cron-confirmar-reservas
// Chamada por pg_cron 3x ao dia (10h, 13h, 16h BRT).
// Envia lembretes para clientes confirmarem presença no dia da reserva.
// Registra cada mensagem enviada no compelition para visibilidade no chat do app.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { tipo } = await req.json();
    // tipo: 'manha' | 'almoco' | 'urgente'

    if (!tipo || !['manha', 'almoco', 'urgente'].includes(tipo)) {
      throw new Error("O parâmetro 'tipo' é obrigatório (manha, almoco, urgente).");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // Data de hoje no timezone de São Paulo
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD

    // Buscar reservas de HOJE: NÃO confirmadas no dia E NÃO canceladas
    const { data: reservas, error: errReservas } = await supabase
      .from('reservas')
      .select(`
        id, nome, data_reserva, horario, adultos, criancas, empresa_id,
        clientes_id, confirmada_dia_reserva, cancelada_cliente, cancelada_casa
      `)
      .eq('data_reserva', hoje)
      .eq('confirmada_dia_reserva', false)
      .eq('cancelada_cliente', false)
      .eq('cancelada_casa', false);

    if (errReservas) throw new Error(`Erro ao buscar reservas: ${errReservas.message}`);
    if (!reservas || reservas.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma reserva pendente de confirmação para hoje.',
        processadas: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar clientes associados
    const clienteIds = [...new Set(reservas.map(r => r.clientes_id).filter(Boolean))];

    let clientesMap = new Map<number, any>();
    if (clienteIds.length > 0) {
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, uuid_identificador, nome')
        .in('id', clienteIds);

      if (clientes) {
        clientes.forEach((c: any) => clientesMap.set(c.id, c));
      }
    }

    // Buscar nomes das empresas
    const empresaIds = [...new Set(reservas.map(r => r.empresa_id))];
    let empresasMap = new Map<number, any>();
    if (empresaIds.length > 0) {
      const { data: empresas } = await supabase
        .from('empresa')
        .select('id, fantasia')
        .in('id', empresaIds);

      if (empresas) {
        empresas.forEach((e: any) => empresasMap.set(e.id, e));
      }
    }

    let processadas = 0;
    let erros = 0;

    for (const reserva of reservas) {
      try {
        const cliente = clientesMap.get(reserva.clientes_id);
        if (!cliente?.uuid_identificador) {
          console.warn(`Reserva #${reserva.id}: Cliente sem UUID, pulando.`);
          continue;
        }

        const empresa = empresasMap.get(reserva.empresa_id);
        const nomeEmpresa = empresa?.fantasia || 'nosso restaurante';
        const link = `https://www.ajudei.app/reserva/${cliente.uuid_identificador}`;
        const nomeCliente = reserva.nome || cliente.nome || 'Cliente';
        const totalPessoas = (reserva.adultos || 0) + (reserva.criancas || 0);

        let mensagem = '';

        switch (tipo) {
          case 'manha':
            mensagem = `Bom dia, ${nomeCliente}! ☀️\n\n` +
              `Passando para lembrar da sua reserva de hoje no ${nomeEmpresa}.\n\n` +
              `📅 *Hoje* às *${reserva.horario}*\n` +
              `👤 *${totalPessoas} pessoas*\n\n` +
              `Para garantir sua mesa, por favor confirme sua presença pelo link abaixo:\n` +
              `👉 ${link}\n\n` +
              `Aguardamos você! 😊`;
            break;

          case 'almoco':
            mensagem = `Olá, ${nomeCliente}.\n\n` +
              `Sua reserva no ${nomeEmpresa} é para *hoje*.\n\n` +
              `📅 *${reserva.horario}* — *${totalPessoas} pessoas*\n\n` +
              `Ainda não recebemos a confirmação da sua presença. ` +
              `Por favor, confirme pelo link:\n` +
              `👉 ${link}\n\n` +
              `⚠️ _Reservas não confirmadas até às 17h poderão ser canceladas._`;
            break;

          case 'urgente':
            mensagem = `${nomeCliente}, atenção!\n\n` +
              `Sua reserva no ${nomeEmpresa} para hoje às *${reserva.horario}* (${totalPessoas} pessoas) ` +
              `*ainda não foi confirmada*.\n\n` +
              `⏰ *Você tem até às 17h para confirmar*, caso contrário sua reserva poderá ser *cancelada*.\n\n` +
              `Confirme agora:\n👉 ${link}\n\n` +
              `Caso não possa comparecer, pedimos que cancele para liberarmos a mesa.`;
            break;
        }

        if (!mensagem || !reserva.clientes_id) continue;

        // 1. Enviar mensagem via WhatsApp
        await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-gateway`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            cliente_id: reserva.clientes_id,
            message: mensagem
          })
        });

        // 2. Registrar no compelition para ficar visível no chat do app
        const assistantMsg = { role: 'assistant', content: mensagem };

        const { data: compExistente } = await supabase
          .from('compelition')
          .select('id, chat')
          .eq('cliente', reserva.clientes_id)
          .eq('empresa', reserva.empresa_id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (compExistente) {
          await supabase
            .from('compelition')
            .update({
              chat: [...(compExistente.chat || []), assistantMsg],
              modificadoEm: new Date().toISOString()
            })
            .eq('id', compExistente.id);
        } else {
          await supabase
            .from('compelition')
            .insert({
              cliente: reserva.clientes_id,
              empresa: reserva.empresa_id,
              chat: [assistantMsg],
              modificadoEm: new Date().toISOString()
            });
        }

        processadas++;
      } catch (err: any) {
        console.error(`Erro ao processar reserva #${reserva.id}:`, err.message);
        erros++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tipo,
      data: hoje,
      total_reservas: reservas.length,
      processadas,
      erros
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro no cron-confirmar-reservas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
