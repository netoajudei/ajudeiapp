import { createClient } from '@/lib/supabase/client';

export interface ChartDataPoint {
  name: string;
  reservas?: number;
  convidados?: number;
  mensagens?: number;
  novos_clientes?: number;
}

export interface MetricsResponse {
  last7Days: ChartDataPoint[];
  last30Days: ChartDataPoint[];
  last12Months: ChartDataPoint[];
  kpis: {
    total_clientes: number;
    novos_clientes_7d: number;
    novos_clientes_30d: number;
    mensagens_hoje: number;
  };
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function monthLabel(yyyyMM: string): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[Number(yyyyMM.split('-')[1]) - 1];
}

function daysAgoStr(today: Date, n: number): string {
  const d = new Date(today);
  d.setDate(today.getDate() - n);
  return toDateStr(d);
}

function daysAgoIso(today: Date, n: number): string {
  const d = new Date(today);
  d.setDate(today.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const metricsService = {
  async getMetrics(empresaId: number): Promise<MetricsResponse> {
    const supabase = createClient();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [dailyMetrics, agentMetrics, totalClientes, novos7d, novos30d, mensagensHoje] =
      await Promise.all([
        // reservas + convidados + novos_clientes por dia (últimos 365 dias)
        supabase
          .from('daily_metrics_by_company')
          .select('metrica_dia, total_reservas, total_convidados, total_conversas')
          .eq('empresa_id', empresaId)
          .gte('metrica_dia', daysAgoStr(today, 364))
          .order('metrica_dia'),

        // invocações de agentes por dia como proxy de mensagens processadas
        supabase
          .from('analytics_aggregates')
          .select('periodo_inicio, total_invocacoes')
          .eq('empresa_id', empresaId)
          .eq('periodo_tipo', 'daily')
          .gte('periodo_inicio', daysAgoStr(today, 364))
          .order('periodo_inicio'),

        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId),

        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .gte('created_at', daysAgoIso(today, 7)),

        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .gte('created_at', daysAgoIso(today, 30)),

        supabase
          .from('chatsZap')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .gte('created_at', todayStart.toISOString()),
      ]);

    // Indexar métricas diárias por data
    const dailyMap: Record<string, { reservas: number; convidados: number; novos_clientes: number }> = {};
    for (const row of dailyMetrics.data ?? []) {
      dailyMap[row.metrica_dia] = {
        reservas: row.total_reservas ?? 0,
        convidados: row.total_convidados ?? 0,
        novos_clientes: row.total_conversas ?? 0,
      };
    }

    // Indexar invocações de agentes por data (somar todos os agentes do dia)
    const agentMap: Record<string, number> = {};
    for (const row of agentMetrics.data ?? []) {
      agentMap[row.periodo_inicio] = (agentMap[row.periodo_inicio] ?? 0) + row.total_invocacoes;
    }

    // Construir arrays de dias
    const buildDays = (count: number): ChartDataPoint[] =>
      Array.from({ length: count }, (_, i) => {
        const dateStr = daysAgoStr(today, count - 1 - i);
        const d = dailyMap[dateStr] ?? { reservas: 0, convidados: 0, novos_clientes: 0 };
        return {
          name: dayLabel(dateStr),
          reservas: d.reservas,
          convidados: d.convidados,
          mensagens: agentMap[dateStr] ?? 0,
          novos_clientes: d.novos_clientes,
        };
      });

    // Construir array mensal agregando os dados diários
    const monthlyMap: Record<string, { reservas: number; convidados: number; mensagens: number; novos_clientes: number }> = {};

    for (const [dateStr, vals] of Object.entries(dailyMap)) {
      const key = dateStr.substring(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { reservas: 0, convidados: 0, mensagens: 0, novos_clientes: 0 };
      monthlyMap[key].reservas += vals.reservas;
      monthlyMap[key].convidados += vals.convidados;
      monthlyMap[key].novos_clientes += vals.novos_clientes;
    }
    for (const [dateStr, count] of Object.entries(agentMap)) {
      const key = dateStr.substring(0, 7);
      if (!monthlyMap[key]) monthlyMap[key] = { reservas: 0, convidados: 0, mensagens: 0, novos_clientes: 0 };
      monthlyMap[key].mensagens += count;
    }

    const last12Months: ChartDataPoint[] = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = monthlyMap[key] ?? { reservas: 0, convidados: 0, mensagens: 0, novos_clientes: 0 };
      return { name: monthLabel(key), ...m };
    });

    return {
      kpis: {
        total_clientes: totalClientes.count ?? 0,
        novos_clientes_7d: novos7d.count ?? 0,
        novos_clientes_30d: novos30d.count ?? 0,
        mensagens_hoje: mensagensHoje.count ?? 0,
      },
      last7Days: buildDays(7),
      last30Days: buildDays(30),
      last12Months,
    };
  },
};
