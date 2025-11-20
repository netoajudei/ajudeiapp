import { createClient } from '@/lib/supabase/client';
import { PublicReservationData, Empresa, Cliente } from '../types';

export const publicService = {
  getDataByUuid: async (uuid: string): Promise<PublicReservationData> => {
    const supabase = createClient();

    // 1. Buscar Cliente pelo UUID
    const { data: cliente, error: clientError } = await supabase
      .from('clientes')
      .select('*')
      .eq('uuid_identificador', uuid)
      .single();

    if (clientError || !cliente) {
      console.error('Erro ao buscar cliente:', clientError);
      throw new Error("Link inválido ou expirado.");
    }

    // 2. Buscar Empresa vinculada ao Cliente
    const { data: empresa, error: empresaError } = await supabase
      .from('empresa')
      .select('*')
      .eq('id', cliente.empresa_id)
      .single();

    if (empresaError || !empresa) {
      console.error('Erro ao buscar empresa:', empresaError);
      throw new Error("Empresa não encontrada.");
    }

    return {
      empresa,
      cliente
    };
  },

  submitReservation: async (data: any): Promise<boolean> => {
    // TODO: Implementar envio real da reserva se necessário
    // Por enquanto, o fluxo de criação pode usar outra lógica ou este endpoint
    await new Promise(resolve => setTimeout(resolve, 2500));
    return true;
  }
};
