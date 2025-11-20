import { createClient } from '@/lib/supabase/client';
import { OperatingPeriod } from '@/types';

export const operatingHoursService = {
  /**
   * Busca todos os períodos de funcionamento de uma empresa (regulares e especiais)
   */
  async getPeriodos(empresaId: number) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('periodos_funcionamento')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('dia_semana', { ascending: true })
      .order('horario_inicio', { ascending: true });

    if (error) {
      console.error('Erro ao buscar períodos:', error);
      throw error;
    }

    return data as OperatingPeriod[];
  },

  /**
   * Busca apenas os períodos regulares (não especiais)
   */
  async getPeriodosRegulares(empresaId: number) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('periodos_funcionamento')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('data_especial', false) // Ignora feriados/datas específicas
      .order('dia_semana', { ascending: true })
      .order('horario_inicio', { ascending: true });

    if (error) {
      console.error('Erro ao buscar períodos regulares:', error);
      throw error;
    }

    return data as OperatingPeriod[];
  },

  /**
   * Cria ou atualiza um período
   */
  async savePeriodo(periodo: Partial<OperatingPeriod>) {
    const supabase = createClient();
    
    // Remover ID se for undefined para permitir insert
    const { id, ...payload } = periodo;
    
    let query = supabase.from('periodos_funcionamento');

    if (id) {
      // Update
      const { data, error } = await query
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await query
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  /**
   * Exclui um período pelo ID
   */
  async deletePeriodo(id: number) {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('periodos_funcionamento')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir período:', error);
      throw error;
    }
    
    return true;
  }
};

