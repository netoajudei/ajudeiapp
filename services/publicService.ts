import { PublicReservationData, Empresa, Cliente } from '../types';

// Mock Database
const MOCK_EMPRESAS: Record<number, Empresa> = {
  101: {
    id: 101,
    created_at: new Date().toISOString(),
    razaoSocial: "Restaurante Exemplo Ltda",
    fantasia: "Gastrô Lounge",
    contatoPrincipal: "11999999999",
    logo: "https://cdn-icons-png.flaticon.com/512/1996/1996068.png", // Generic food icon
    cor: "#2293DD", // Electric Blue (Padrão)
    LimiteDeReservasPorDia: 20,
    LimiteDeConvidadosPorReserva: 10,
    api_provider: 'wappi',
    modo_ia: 'prompt_unico'
  },
  102: {
    id: 102,
    created_at: new Date().toISOString(),
    razaoSocial: "Cantina Italiana Ltda",
    fantasia: "La Nonna",
    contatoPrincipal: "11888888888",
    logo: "https://cdn-icons-png.flaticon.com/512/3448/3448609.png", // Pasta icon
    cor: "#D32F2F", // Red
    LimiteDeReservasPorDia: 15,
    LimiteDeConvidadosPorReserva: 8,
    api_provider: 'wappi',
    modo_ia: 'prompt_unico'
  },
  103: {
    id: 103,
    created_at: new Date().toISOString(),
    razaoSocial: "Sushi House Ltda",
    fantasia: "Sushi Zen",
    contatoPrincipal: "11777777777",
    logo: "https://cdn-icons-png.flaticon.com/512/2252/2252075.png", // Sushi icon
    cor: "#F57C00", // Orange
    LimiteDeReservasPorDia: 30,
    LimiteDeConvidadosPorReserva: 6,
    api_provider: 'wappi',
    modo_ia: 'prompt_unico'
  }
};

const MOCK_CLIENTES: Record<string, Cliente> = {
  "e5002036-ec86-401a-9741-d3557c823f87": {
    id: 500,
    nome: "Carlos Silva",
    foto: "",
    empresa_id: 102, // Vínculo com La Nonna (Vermelho)
    chatId: "5511999998888",
    uuid_identificador: "e5002036-ec86-401a-9741-d3557c823f87"
  },
  "test-blue": {
    id: 501,
    nome: "Ana Pereira",
    foto: "",
    empresa_id: 101, // Vínculo com Gastrô Lounge (Azul)
    chatId: "5511999997777",
    uuid_identificador: "test-blue"
  },
  "test-orange": {
    id: 502,
    nome: "Roberto Tanaka",
    foto: "",
    empresa_id: 103, // Vínculo com Sushi Zen (Laranja)
    chatId: "5511999996666",
    uuid_identificador: "test-orange"
  }
};

export const publicService = {
  getDataByUuid: async (uuid: string): Promise<PublicReservationData> => {
    // Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const cliente = MOCK_CLIENTES[uuid];
    
    if (!cliente || !cliente.empresa_id) {
      throw new Error("Link inválido ou expirado.");
    }

    const empresa = MOCK_EMPRESAS[cliente.empresa_id];

    if (!empresa) {
        throw new Error("Empresa não encontrada.");
    }

    return {
      empresa,
      cliente
    };
  },

  submitReservation: async (data: any): Promise<boolean> => {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    return true;
  }
};