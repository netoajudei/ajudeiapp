import { createClient } from '@/lib/supabase/client';
import { ReservationRules } from '@/types';

export const reservationRulesService = {
  /**
   * Busca as regras de reserva da empresa
   */
  async getRules(empresaId: number): Promise<ReservationRules | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('regras_de_reserva')
      .select('*')
      .eq('empresa_id', empresaId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - retorna null para indicar que precisa criar
        return null;
      }
      console.error('Erro ao buscar regras de reserva:', error);
      throw error;
    }

    return data as ReservationRules;
  },

  /**
   * Salva (cria ou atualiza) as regras
   */
  async saveRules(rules: Partial<ReservationRules>): Promise<ReservationRules> {
    const supabase = createClient();
    
    // Se tiver ID, atualiza. Se não, cria.
    // Mas como é 1:1 com empresa, podemos usar upsert baseando no ID se existir, 
    // ou melhor, verificar antes se já existe registro para a empresa (ou confiar no ID vindo do form).
    
    const { id, ...payload } = rules;

    let query = supabase.from('regras_de_reserva');
    let result;

    if (id) {
        // Update
        result = await query
            .update(payload)
            .eq('id', id)
            .select()
            .single();
    } else {
        // Insert
        result = await query
            .insert(payload)
            .select()
            .single();
    }

    if (result.error) {
      console.error('Erro ao salvar regras de reserva:', result.error);
      throw result.error;
    }

    return result.data as ReservationRules;
  }
};

