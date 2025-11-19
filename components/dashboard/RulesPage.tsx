
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import DashboardLayout from './DashboardLayout';
import { rulesService } from '../../services/rulesService';
import { ReservationRules } from '../../types';
import { Loader2, Save, Clock, Users, CalendarOff, AlertCircle, Sun, Moon } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom', full: 'Domingo' },
  { id: 1, label: 'Seg', full: 'Segunda-feira' },
  { id: 2, label: 'Ter', full: 'Terça-feira' },
  { id: 3, label: 'Qua', full: 'Quarta-feira' },
  { id: 4, label: 'Qui', full: 'Quinta-feira' },
  { id: 5, label: 'Sex', full: 'Sexta-feira' },
  { id: 6, label: 'Sáb', full: 'Sábado' },
];

const RulesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rules, setRules] = useState<ReservationRules | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReservationRules>();
  
  // Watch unavailable days to update UI state locally
  const diasIndisponiveis = watch('dias_semana_indisponiveis') || [];

  useEffect(() => {
    const loadRules = async () => {
      try {
        const data = await rulesService.getRules();
        setRules(data);
        // Set form values
        setValue('id', data.id);
        setValue('empresa_id', data.empresa_id);
        setValue('limite_minimo_pessoas_reserva', data.limite_minimo_pessoas_reserva);
        setValue('limite_maximo_pessoas_reserva', data.limite_maximo_pessoas_reserva);
        setValue('horario_limite_reserva_mesmo_dia', data.horario_limite_reserva_mesmo_dia);
        setValue('dias_semana_indisponiveis', data.dias_semana_indisponiveis);
        setValue('limites_por_periodo', data.limites_por_periodo);
      } finally {
        setIsLoading(false);
      }
    };
    loadRules();
  }, [setValue]);

  const onSubmit = async (data: ReservationRules) => {
    setIsSaving(true);
    try {
      // Ensure numeric conversions
      const formattedData: ReservationRules = {
        ...data,
        limite_minimo_pessoas_reserva: Number(data.limite_minimo_pessoas_reserva),
        limite_maximo_pessoas_reserva: Number(data.limite_maximo_pessoas_reserva),
        limites_por_periodo: {
            almoco: Number(data.limites_por_periodo.almoco),
            jantar: Number(data.limites_por_periodo.jantar)
        }
      };

      await rulesService.saveRules(formattedData);
      // Optional: Show toast success
    } catch (error) {
      console.error("Erro ao salvar", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (dayId: number) => {
    const current = diasIndisponiveis;
    // Lógica invertida para UX: Se está no array "indisponiveis", o dia está FECHADO.
    // O usuário clica para ABRIR (remover do array) ou FECHAR (adicionar no array).
    // Vamos assumir que o botão iluminado significa "DIA ABERTO".
    
    const isClosed = current.includes(dayId);
    
    if (isClosed) {
      // Se estava fechado, remove do array (fica aberto)
      setValue('dias_semana_indisponiveis', current.filter(id => id !== dayId));
    } else {
      // Se estava aberto, adiciona no array (fica fechado)
      setValue('dias_semana_indisponiveis', [...current, dayId]);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-electric" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Regras de Reserva</h1>
          <p className="text-gray-400">Defina os limites e restrições para o agendamento automático.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Seção 1: Limites Gerais */}
          <section className="grid md:grid-cols-2 gap-6">
             <div className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center text-electric">
                      <Users size={20} />
                   </div>
                   <h3 className="text-lg font-bold text-white">Limites de Pessoas</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Mínimo</label>
                      <input 
                        {...register('limite_minimo_pessoas_reserva', { required: true, min: 1 })}
                        type="number"
                        className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition-all"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Máximo</label>
                      <input 
                        {...register('limite_maximo_pessoas_reserva', { required: true })}
                        type="number"
                        className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition-all"
                      />
                   </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                   <AlertCircle size={12} />
                   Define o tamanho das mesas aceitas pelo bot.
                </p>
             </div>

             <div className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                      <Clock size={20} />
                   </div>
                   <h3 className="text-lg font-bold text-white">Corte de Horário</h3>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Horário Limite (Mesmo Dia)</label>
                    <input 
                    {...register('horario_limite_reserva_mesmo_dia', { required: true })}
                    type="time"
                    className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition-all"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-4">
                   Reservas para "hoje" só serão aceitas se solicitadas antes deste horário.
                </p>
             </div>
          </section>

          {/* Seção 2: Dias de Funcionamento */}
          <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                    <CalendarOff size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Dias de Funcionamento</h3>
                    <p className="text-xs text-gray-500">Selecione os dias que o restaurante <span className="text-green-400 font-bold">ABRE</span> para reservas.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                  {DAYS_OF_WEEK.map((day) => {
                      const isAvailable = !diasIndisponiveis.includes(day.id);
                      return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(day.id)}
                            className={`
                                px-4 py-3 rounded-xl font-medium text-sm transition-all border
                                ${isAvailable 
                                    ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]' 
                                    : 'bg-dark border-gray-800 text-gray-600 hover:border-gray-600'
                                }
                            `}
                          >
                              {day.full}
                          </button>
                      )
                  })}
              </div>
          </section>

          {/* Seção 3: Capacidade por Período (JSONB) */}
          <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
             <h3 className="text-lg font-bold text-white mb-6">Capacidade por Período</h3>
             <div className="grid md:grid-cols-2 gap-6">
                {/* Almoço */}
                <div className="bg-dark/50 rounded-xl p-4 border border-gray-700/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Sun size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-white mb-1">Almoço</div>
                        <div className="text-xs text-gray-500">Capacidade máxima</div>
                    </div>
                    <div className="w-24">
                         <input 
                            {...register('limites_por_periodo.almoco')}
                            type="number"
                            className="w-full bg-deep border border-gray-700 rounded-lg px-3 py-2 text-right text-white focus:border-electric outline-none"
                         />
                    </div>
                </div>

                {/* Jantar */}
                <div className="bg-dark/50 rounded-xl p-4 border border-gray-700/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Moon size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-white mb-1">Jantar</div>
                        <div className="text-xs text-gray-500">Capacidade máxima</div>
                    </div>
                    <div className="w-24">
                         <input 
                            {...register('limites_por_periodo.jantar')}
                            type="number"
                            className="w-full bg-deep border border-gray-700 rounded-lg px-3 py-2 text-right text-white focus:border-electric outline-none"
                         />
                    </div>
                </div>
             </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
              <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 disabled={isSaving}
                 type="submit"
                 className="bg-electric hover:bg-electric/90 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-electric/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                 Salvar Regras
              </motion.button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
};

export default RulesPage;
