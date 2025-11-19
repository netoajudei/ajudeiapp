
import { Cliente } from '../types';

// Mock Database de Clientes
const MOCK_CUSTOMERS: Cliente[] = [
  {
    id: 1,
    nome: "Carlos Silva",
    foto: null,
    empresa_id: 101,
    chatId: "5511999998888", // Format: DDI + DDD + Number
    uuid_identificador: "uuid-1"
  },
  {
    id: 2,
    nome: "Ana Pereira",
    foto: null,
    empresa_id: 101,
    chatId: "5511999997777",
    uuid_identificador: "uuid-2"
  },
  {
    id: 3,
    nome: "Roberto Tanaka",
    foto: null,
    empresa_id: 101,
    chatId: "5511988881111",
    uuid_identificador: "uuid-3"
  }
];

export const customerService = {
  searchByPhone: async (ddd: string, number: string): Promise<Cliente | null> => {
    await new Promise(resolve => setTimeout(resolve, 800)); // Network delay
    
    // Normaliza a busca (remove caracteres não numéricos)
    const cleanNumber = number.replace(/\D/g, '');
    const cleanDDD = ddd.replace(/\D/g, '');
    
    // Tenta encontrar correspondência exata (considerando que o banco guarda com 55)
    // Na vida real faríamos uma query SQL mais robusta
    const found = MOCK_CUSTOMERS.find(c => 
      c.chatId?.includes(`${cleanDDD}${cleanNumber}`)
    );

    return found || null;
  }
};
