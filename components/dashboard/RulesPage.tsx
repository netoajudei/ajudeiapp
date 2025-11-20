"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from './DashboardLayout';
import { reservationRulesService } from '../../services/reservationRulesService';
import { ReservationRules, PeriodoLimiteDB } from '../../types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Clock, Users, CalendarOff, AlertCircle, Sun, Moon, AlertTriangle, Check } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Dom', full: 'Domingo' },
  { id: 2, label: 'Seg', full: 'Segunda-feira' },
  { id: 3, label: 'Ter', full: 'Terça-feira' },
  { id: 4, label: 'Qua', full: 'Quarta-feira' },
  { id: 5, label: 'Qui', full: 'Quinta-feira' },
  { id: 6, label: 'Sex', full: 'Sexta-feira' },
  { id: 7, label: 'Sáb', full: 'Sábado' },
];

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  newValue?: any;
}

const RulesPage = () => {
  const { authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rules, setRules] = useState<ReservationRules | null>(null);
  
  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Local state to manage inputs before saving
  const [localValues, setLocalValues] = useState({
    minPeople: 0,
    maxPeople: 0,
    cutoffTime: '',
    almocoLimit: 0,
    jantarLimit: 0
  });

  const loadRules = async () => {
    if (!authUser?.empresa.id) return;
    setIsLoading(true);
    try {
      const data = await reservationRulesService.getRules(authUser.empresa.id);
      
      if (data) {
        setRules(data);
        // Inicializar valores locais
        const dbLimits = data.limites_por_periodo || [];
        const almocoLimit = dbLimits.find(l => l.nome_periodo === 'Almoço')?.limite_convidados || 50;
        const jantarLimit = dbLimits.find(l => l.nome_periodo === 'A noite')?.limite_convidados || 50;

        setLocalValues({
            minPeople: data.limite_minimo_pessoas_reserva,
            maxPeople: data.limite_maximo_pessoas_reserva,
            cutoffTime: data.horario_limite_reserva_mesmo_dia,
            almocoLimit,
            jantarLimit
        });
      } else {
         // Defaults
         const defaultRules = {
            id: 0, // Placeholder
            empresa_id: authUser.empresa.id,
            limite_minimo_pessoas_reserva: 2,
            limite_maximo_pessoas_reserva: 20,
            horario_limite_reserva_mesmo_dia: '18:00:00',
            dias_semana_indisponiveis: [],
            limites_por_periodo: [
                { nome_periodo: 'Almoço', limite_convidados: 50 },
                { nome_periodo: 'A noite', limite_convidados: 50 }
            ]
         };
         setRules(defaultRules);
         setLocalValues({
            minPeople: 2,
            maxPeople: 20,
            cutoffTime: '18:00',
            almocoLimit: 50,
            jantarLimit: 50
         });
      }
    } catch (err) {
      console.error("Erro ao carregar regras:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [authUser]);

  const handleSave = async (updatedFields: Partial<ReservationRules>) => {
    if (!rules || !authUser?.empresa.id) return;
    
    setIsUpdating(true);
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    try {
      const payload = {
        ...rules,
        ...updatedFields
      };
      
      const saved = await reservationRulesService.saveRules(payload);
      setRules(saved);
      
      // Atualizar valores locais para refletir o salvo
      const dbLimits = saved.limites_por_periodo || [];
      const almocoLimit = dbLimits.find(l => l.nome_periodo === 'Almoço')?.limite_convidados || 0;
      const jantarLimit = dbLimits.find(l => l.nome_periodo === 'A noite')?.limite_convidados || 0;
      
      setLocalValues({
          minPeople: saved.limite_minimo_pessoas_reserva,
          maxPeople: saved.limite_maximo_pessoas_reserva,
          cutoffTime: saved.horario_limite_reserva_mesmo_dia,
          almocoLimit,
          jantarLimit
      });

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar alteração.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handlers para cada tipo de mudança

  const onPeopleLimitChange = (type: 'min' | 'max', newValue: number) => {
     if (!rules) return;
     const oldValue = type === 'min' ? rules.limite_minimo_pessoas_reserva : rules.limite_maximo_pessoas_reserva;
     
     if (newValue === oldValue) return;

     setConfirmDialog({
         isOpen: true,
         title: 'Alterar Limites de Pessoas?',
         message: `Deseja alterar o limite ${type === 'min' ? 'mínimo' : 'máximo'} de ${oldValue} para ${newValue} pessoas?`,
         onConfirm: async () => {
             await handleSave(type === 'min' 
                 ? { limite_minimo_pessoas_reserva: newValue } 
                 : { limite_maximo_pessoas_reserva: newValue }
             );
         }
     });
  };

  const onTimeLimitChange = (newTime: string) => {
      if (!rules) return;
      // Comparar apenas HH:MM
      const oldTime = rules.horario_limite_reserva_mesmo_dia.substring(0, 5);
      if (newTime === oldTime) return;

      setConfirmDialog({
          isOpen: true,
          title: 'Alterar Horário Limite?',
          message: `Deseja alterar o horário limite de reservas para o mesmo dia de ${oldTime} para ${newTime}?`,
          onConfirm: async () => {
              await handleSave({ horario_limite_reserva_mesmo_dia: newTime });
          }
      });
  };

  const onDayToggle = (dayId: number) => {
      if (!rules) return;
      const isCurrentlyClosed = rules.dias_semana_indisponiveis.includes(dayId);
      const action = isCurrentlyClosed ? 'ABRIR' : 'FECHAR';
      const dayName = DAYS_OF_WEEK.find(d => d.id === dayId)?.full;

      setConfirmDialog({
          isOpen: true,
          title: `${action} ${dayName}?`,
          message: `Tem certeza que deseja ${action.toLowerCase()} o agendamento para ${dayName}?`,
          onConfirm: async () => {
              let newDays;
              if (isCurrentlyClosed) {
                  // Remove from array (Open)
                  newDays = rules.dias_semana_indisponiveis.filter(id => id !== dayId);
              } else {
                  // Add to array (Close)
                  newDays = [...rules.dias_semana_indisponiveis, dayId];
              }
              await handleSave({ dias_semana_indisponiveis: newDays });
          }
      });
  };

  const onPeriodCapacityChange = (period: 'Almoço' | 'A noite', newValue: number) => {
      if (!rules) return;
      
      const currentArray = [...rules.limites_por_periodo];
      const index = currentArray.findIndex(p => p.nome_periodo === period);
      const oldValue = index >= 0 ? currentArray[index].limite_convidados : 0;

      if (newValue === oldValue) return;

      setConfirmDialog({
          isOpen: true,
          title: `Alterar Capacidade - ${period}?`,
          message: `Deseja alterar a capacidade do ${period} de ${oldValue} para ${newValue} pessoas?`,
          onConfirm: async () => {
             const newArray = [...currentArray];
             if (index >= 0) {
                 newArray[index] = { ...newArray[index], limite_convidados: newValue };
             } else {
                 newArray.push({ nome_periodo: period, limite_convidados: newValue });
             }
             await handleSave({ limites_por_periodo: newArray });
          }
      });
  };

  if (isLoading || !rules) {
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
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Regras de Reserva</h1>
          <p className="text-gray-400">Defina os limites e restrições para o agendamento automático.</p>
        </div>

        <div className="space-y-8">
          
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
                        type="number"
                        value={localValues.minPeople}
                        onChange={(e) => setLocalValues(prev => ({...prev, minPeople: Number(e.target.value)}))}
                        onBlur={() => onPeopleLimitChange('min', localValues.minPeople)}
                        className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition-all"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Máximo</label>
                      <input 
                        type="number"
                        value={localValues.maxPeople}
                        onChange={(e) => setLocalValues(prev => ({...prev, maxPeople: Number(e.target.value)}))}
                        onBlur={() => onPeopleLimitChange('max', localValues.maxPeople)}
                        className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition-all"
                      />
                   </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                   <AlertCircle size={12} />
                   Alterações requerem confirmação ao sair do campo.
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
                        type="time"
                        value={localValues.cutoffTime.substring(0, 5)}
                        onChange={(e) => {
                            const val = e.target.value;
                            setLocalValues(prev => ({...prev, cutoffTime: val}));
                        }}
                        onBlur={() => onTimeLimitChange(localValues.cutoffTime)}
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
                    <h3 className="text-lg font-bold text-white">Dias Disponíveis</h3>
                    <p className="text-xs text-gray-500">Clique para <span className="text-green-400 font-bold">ABRIR</span> ou <span className="text-gray-500 font-bold">FECHAR</span> um dia.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                  {DAYS_OF_WEEK.map((day) => {
                      const isAvailable = !rules.dias_semana_indisponiveis.includes(day.id);
                      return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => onDayToggle(day.id)}
                            className={`
                                px-4 py-3 rounded-xl font-medium text-sm transition-all border flex items-center gap-2
                                ${isAvailable 
                                    ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]' 
                                    : 'bg-dark border-gray-800 text-gray-600 hover:border-gray-600 opacity-60'
                                }
                            `}
                          >
                              {isAvailable && <Check size={14} />}
                              {day.full}
                          </button>
                      )
                  })}
              </div>
          </section>

          {/* Seção 3: Capacidade por Período */}
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
                            type="number"
                            value={localValues.almocoLimit}
                            onChange={(e) => setLocalValues(prev => ({...prev, almocoLimit: Number(e.target.value)}))}
                            onBlur={() => onPeriodCapacityChange('Almoço', localValues.almocoLimit)}
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
                        <div className="text-sm font-bold text-white mb-1">Jantar (A noite)</div>
                        <div className="text-xs text-gray-500">Capacidade máxima</div>
                    </div>
                    <div className="w-24">
                         <input 
                            type="number"
                            value={localValues.jantarLimit}
                            onChange={(e) => setLocalValues(prev => ({...prev, jantarLimit: Number(e.target.value)}))}
                            onBlur={() => onPeriodCapacityChange('A noite', localValues.jantarLimit)}
                            className="w-full bg-deep border border-gray-700 rounded-lg px-3 py-2 text-right text-white focus:border-electric outline-none"
                         />
                    </div>
                </div>
             </div>
          </section>

        </div>

        {/* Confirmation Dialog */}
        <AnimatePresence>
           {confirmDialog.isOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                   <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-deep border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl p-6"
                   >
                       <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 rounded-full bg-electric/10 flex items-center justify-center text-electric shrink-0">
                               <AlertTriangle size={24} />
                           </div>
                           <div>
                               <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
                           </div>
                       </div>
                       
                       <p className="text-gray-400 mb-6 ml-16 text-sm">
                           {confirmDialog.message}
                       </p>

                       <div className="flex gap-3 justify-end">
                           <button
                             onClick={() => {
                                 setConfirmDialog(prev => ({...prev, isOpen: false}));
                                 // Reverter valor local para o valor salvo (cancel)
                                 const dbLimits = rules.limites_por_periodo || [];
                                 setLocalValues({
                                    minPeople: rules.limite_minimo_pessoas_reserva,
                                    maxPeople: rules.limite_maximo_pessoas_reserva,
                                    cutoffTime: rules.horario_limite_reserva_mesmo_dia,
                                    almocoLimit: dbLimits.find(l => l.nome_periodo === 'Almoço')?.limite_convidados || 50,
                                    jantarLimit: dbLimits.find(l => l.nome_periodo === 'A noite')?.limite_convidados || 50
                                 });
                             }}
                             className="px-4 py-2 rounded-lg font-bold text-gray-400 hover:bg-white/5 transition-all text-sm"
                           >
                             Cancelar
                           </button>
                           <button
                             onClick={confirmDialog.onConfirm}
                             disabled={isUpdating}
                             className="px-4 py-2 rounded-lg font-bold text-white bg-electric hover:bg-electric/90 transition-all flex items-center gap-2 shadow-lg shadow-electric/20 text-sm"
                           >
                             {isUpdating ? <Loader2 className="animate-spin" size={16} /> : 'Sim, Confirmar'}
                           </button>
                       </div>
                   </motion.div>
               </div>
           )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
};

export default RulesPage;
