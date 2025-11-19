
export interface ChartDataPoint {
  name: string; // Label (Dia, Mês)
  reservas?: number;
  convidados?: number;
  mensagens?: number;
  novos_clientes?: number;
  total_clientes?: number;
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
  }
}

// Helpers
const generateLastDays = (days: number): string[] => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
  }
  return result;
};

const generateMonths = (): string[] => {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const currentMonth = new Date().getMonth();
  // Rotaciona para terminar no mês atual
  const result = [];
  for (let i = 0; i < 12; i++) {
     result.push(months[(currentMonth + i + 1) % 12]);
  }
  return result;
};

export const metricsService = {
  getMetrics: async (): Promise<MetricsResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate calculation delay

    const days7 = generateLastDays(7);
    const days30 = generateLastDays(30);
    const months12 = generateMonths();

    return {
      kpis: {
        total_clientes: 1458,
        novos_clientes_7d: 32,
        novos_clientes_30d: 145,
        mensagens_hoje: 284
      },
      last7Days: days7.map(day => ({
        name: day,
        reservas: Math.floor(Math.random() * 20) + 10,
        convidados: Math.floor(Math.random() * 60) + 25,
        mensagens: Math.floor(Math.random() * 200) + 150,
        novos_clientes: Math.floor(Math.random() * 8)
      })),
      last30Days: days30.map(day => ({
        name: day,
        reservas: Math.floor(Math.random() * 25) + 5,
        convidados: Math.floor(Math.random() * 80) + 15,
        mensagens: Math.floor(Math.random() * 250) + 100,
        novos_clientes: Math.floor(Math.random() * 10)
      })),
      last12Months: months12.map((month, i) => ({
        name: month,
        reservas: 300 + (i * 20) + Math.floor(Math.random() * 100), // Trend up
        convidados: 900 + (i * 60) + Math.floor(Math.random() * 300),
        mensagens: 5000 + (i * 500) + Math.floor(Math.random() * 1000),
        novos_clientes: 50 + (i * 5) + Math.floor(Math.random() * 20)
      }))
    };
  }
};
