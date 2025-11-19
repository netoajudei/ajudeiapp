
import { Empresa } from '../types';

let MOCK_EMPRESA: Empresa = {
  id: 101,
  created_at: new Date().toISOString(),
  razaoSocial: "Restaurante Exemplo Ltda",
  fantasia: "Gastrô Lounge",
  contatoPrincipal: "11999999999",
  logo: "https://cdn-icons-png.flaticon.com/512/1996/1996068.png",
  cor: "#2293DD",
  instanciaChat: "instance_x9s8d7",
  senhaWiFi: "gastro@2024",
  LimiteDeReservasPorDia: 50,
  LimiteDeConvidadosPorReserva: 12,
  reservasAutomaticas: 1,
  prompt: "Você é um assistente virtual de um restaurante sofisticado. Seja cordial, use emojis e tente vender vinhos da casa.",
  api_provider: 'wappi',
  modo_ia: 'prompt_unico',
  em_teste: false,
  contatoSoReserva: ["11999991111", "11999992222"],
  contato_vagas_de_emprego: ["11988887777"],
  contato_fornecedores: [],
  respostas_prontas: ["Cardápio", "Horários", "Localização"]
};

export const companyService = {
  getCompany: async (): Promise<Empresa> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { ...MOCK_EMPRESA };
  },

  updateCompany: async (data: Empresa): Promise<Empresa> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    MOCK_EMPRESA = { ...data, modificadoDia: new Date().toISOString() };
    return MOCK_EMPRESA;
  },

  changePassword: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock password change logic
  }
};
