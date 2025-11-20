import { createClient } from '@/lib/supabase/client';
import { Evento } from '@/types';

export const eventsService = {
  /**
   * Busca todos os eventos da empresa, ordenados por data (mais próximos primeiro)
   */
  async getEvents(empresaId: number): Promise<Evento[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_evento', { ascending: true });

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      throw error;
    }

    return data as Evento[];
  },

  /**
   * Salva um evento (Cria se não tiver ID, Atualiza se tiver)
   */
  async saveEvent(evento: Partial<Evento>): Promise<Evento> {
    const supabase = createClient();
    
    const { id, ...payload } = evento;

    let query = supabase.from('eventos');
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
      console.error('Erro ao salvar evento:', result.error);
      throw result.error;
    }

    return result.data as Evento;
  },

  /**
   * Remove um evento pelo ID
   */
  async deleteEvent(id: number): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    }
  }
};
