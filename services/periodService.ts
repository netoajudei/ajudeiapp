
import { OperatingPeriod } from '../types';

// Mock Data
// SQL Constraint: dia_semana (1=Dom, 2=Seg, 3=Ter, 4=Qua, 5=Qui, 6=Sex, 7=Sab)
let MOCK_PERIODS: OperatingPeriod[] = [
  {
    id: 1,
    empresa_id: 101,
    dia_semana: 2, // Segunda
    nome_periodo: "Almoço Executivo",
    horario_inicio: "11:30",
    horario_fim: "15:00",
    promocao: "Prato do dia: Parmegiana por R$ 29,90",
    atracao: null,
    cardapio: "Menu Executivo v2",
    ativo: true,
    data_especial: false
  },
  {
    id: 2,
    empresa_id: 101,
    dia_semana: 6, // Sexta
    nome_periodo: "Happy Hour",
    horario_inicio: "17:00",
    horario_fim: "20:00",
    promocao: "Chopp em dobro",
    atracao: "Música ao vivo: Voz e Violão",
    cardapio: "Porções e Bebidas",
    ativo: true,
    data_especial: false
  },
  {
    id: 3,
    empresa_id: 101,
    dia_semana: 6, // Sexta
    nome_periodo: "Jantar",
    horario_inicio: "20:00",
    horario_fim: "23:30",
    promocao: null,
    atracao: null,
    cardapio: "Menu Completo",
    ativo: true,
    data_especial: false
  }
];

export const periodService = {
  getPeriods: async (): Promise<OperatingPeriod[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [...MOCK_PERIODS];
  },

  savePeriod: async (period: OperatingPeriod): Promise<OperatingPeriod> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (period.id) {
      // Update
      const index = MOCK_PERIODS.findIndex(p => p.id === period.id);
      if (index !== -1) {
        MOCK_PERIODS[index] = period;
      }
      return period;
    } else {
      // Create
      const newPeriod = { ...period, id: Date.now() };
      MOCK_PERIODS.push(newPeriod);
      return newPeriod;
    }
  },

  deletePeriod: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    MOCK_PERIODS = MOCK_PERIODS.filter(p => p.id !== id);
  }
};
