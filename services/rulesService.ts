
import { ReservationRules } from '../types';

const MOCK_RULES: ReservationRules = {
  id: 1,
  empresa_id: 101,
  dias_semana_indisponiveis: [1], // Segunda-feira fechado (0=Dom, 1=Seg...)
  horario_limite_reserva_mesmo_dia: "18:00",
  limite_minimo_pessoas_reserva: 2,
  limite_maximo_pessoas_reserva: 20,
  limites_por_periodo: {
    "almoco": 40,
    "jantar": 80
  }
};

export const rulesService = {
  getRules: async (): Promise<ReservationRules> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return { ...MOCK_RULES };
  },

  saveRules: async (rules: ReservationRules): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Rules saved to DB:", rules);
    Object.assign(MOCK_RULES, rules);
    return true;
  }
};
