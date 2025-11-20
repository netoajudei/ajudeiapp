"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Plus, Edit2, Trash2, Save, X, 
  Calendar as CalendarIcon, Loader2, Check, ChevronRight,
  Music, Utensils, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { operatingHoursService } from '@/services/operatingHoursService';
import { OperatingPeriod } from '@/types';
import DashboardLayout from './DashboardLayout';

const DAYS_MAP: Record<number, string> = {
  1: 'Domingo',
  2: 'Segunda-feira',
  3: 'Terça-feira',
  4: 'Quarta-feira',
  5: 'Quinta-feira',
  6: 'Sexta-feira',
  7: 'Sábado'
};

export default function OperatingPeriodsPage() {
  const { authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [periods, setPeriods] = useState<OperatingPeriod[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Partial<OperatingPeriod> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    dia_semana: 2,
    nome_periodo: 'Jantar',
    horario_inicio: '19:00',
    horario_fim: '23:00',
    atracao: '',
    cardapio: '',
    ativo: true
  });

  useEffect(() => {
    fetchPeriods();
  }, [authUser]);

  const fetchPeriods = async () => {
    if (!authUser?.empresa.id) return;
    
    setIsLoading(true);
    try {
      const data = await operatingHoursService.getPeriodosRegulares(authUser.empresa.id);
      setPeriods(data);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (period?: OperatingPeriod, dayDefault?: number) => {
    if (period) {
      setEditingPeriod(period);
      setFormData({
        dia_semana: period.dia_semana,
        nome_periodo: period.nome_periodo,
        horario_inicio: period.horario_inicio.substring(0, 5),
        horario_fim: period.horario_fim.substring(0, 5),
        atracao: period.atracao || '',
        cardapio: period.cardapio || '',
        ativo: period.ativo
      });
    } else {
      setEditingPeriod(null);
      setFormData({
        dia_semana: dayDefault || 2,
        nome_periodo: 'Jantar',
        horario_inicio: '19:00',
        horario_fim: '23:00',
        atracao: '',
        cardapio: '',
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!authUser?.empresa.id) return;
    setIsSaving(true);
    
    try {
      const payload: Partial<OperatingPeriod> = {
        ...editingPeriod,
        empresa_id: authUser.empresa.id,
        dia_semana: formData.dia_semana,
        nome_periodo: formData.nome_periodo,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        atracao: formData.atracao,
        cardapio: formData.cardapio,
        ativo: formData.ativo,
        data_especial: false
      };
      
      await operatingHoursService.savePeriodo(payload);
      await fetchPeriods();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar horário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este horário?")) return;
    
    try {
      await operatingHoursService.deletePeriodo(id);
      setPeriods(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert("Erro ao excluir.");
    }
  };

  // Group periods
  const groupedPeriods: Record<number, OperatingPeriod[]> = {};
  for (let i = 1; i <= 7; i++) {
    groupedPeriods[i] = [];
  }
  periods.forEach(p => {
    if (groupedPeriods[p.dia_semana]) {
      groupedPeriods[p.dia_semana].push(p);
    }
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-20 pt-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Clock className="text-electric" />
              Horários e Agenda
            </h1>
            <p className="text-gray-400 text-sm">Configure turnos, atrações e cardápios especiais da semana.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-electric hover:bg-electric/90 text-white text-sm font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-electric/20 hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            Novo Horário
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-electric w-10 h-10" />
          </div>
        ) : (
          <div className="bg-deep border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {[2, 3, 4, 5, 6, 7, 1].map((dayNum, index) => { // Começando na Segunda (2) até Domingo (1)
              const dayPeriods = groupedPeriods[dayNum];
              const hasPeriods = dayPeriods.length > 0;
              const isLast = index === 6;

              // Highlight weekends
              const isWeekend = dayNum === 1 || dayNum === 7 || dayNum === 6;

              return (
                <div 
                  key={dayNum} 
                  className={`
                    flex flex-col md:flex-row md:items-start gap-6 p-6 
                    ${!isLast ? 'border-b border-white/5' : ''}
                    ${isWeekend ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'} 
                    transition-colors relative
                  `}
                >
                  {/* Dia da Semana */}
                  <div className="md:w-40 shrink-0 flex items-center md:items-start gap-4 pt-1">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg
                      ${hasPeriods 
                        ? 'bg-gradient-to-br from-electric to-blue-600 text-white shadow-electric/20' 
                        : 'bg-gray-800/50 text-gray-600 border border-white/5'}
                    `}>
                      {DAYS_MAP[dayNum].substring(0, 3)}
                    </div>
                    <div className="md:pt-1">
                      <span className={`font-bold block text-lg ${hasPeriods ? 'text-white' : 'text-gray-500'}`}>
                        {DAYS_MAP[dayNum]}
                      </span>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {hasPeriods ? `${dayPeriods.length} Turno(s)` : 'Fechado'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Horários */}
                  <div className="flex-1 grid gap-3">
                    {hasPeriods ? (
                      dayPeriods.map((period) => (
                        <div 
                          key={period.id} 
                          className="relative group overflow-hidden bg-dark/60 border border-white/5 hover:border-white/10 rounded-xl transition-all hover:shadow-lg hover:shadow-black/20"
                        >
                          {/* Faixa lateral de status */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${period.ativo ? 'bg-electric' : 'bg-red-500/50'}`} />

                          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 pl-5 gap-4">
                            
                            {/* Info Principal */}
                            <div className="flex items-center gap-4 min-w-[200px]">
                              <div className="bg-gray-800/50 p-2.5 rounded-lg text-gray-300 border border-white/5">
                                <Clock size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-bold text-base">{period.nome_periodo}</span>
                                  {!period.ativo && (
                                    <span className="text-[10px] font-bold uppercase bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                      Inativo
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-400 text-sm font-mono mt-0.5">
                                  {period.horario_inicio.substring(0, 5)} - {period.horario_fim.substring(0, 5)}
                                </div>
                              </div>
                            </div>

                            {/* Detalhes Extras (Atração / Cardápio) */}
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                              {period.atracao && (
                                <div className="flex items-center gap-2 bg-purple-500/10 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/20 text-xs font-medium">
                                  <Music size={14} />
                                  {period.atracao}
                                </div>
                              )}
                              {period.cardapio && (
                                <div className="flex items-center gap-2 bg-orange-500/10 text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/20 text-xs font-medium">
                                  <Utensils size={14} />
                                  {period.cardapio}
                                </div>
                              )}
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 md:static bg-dark/80 md:bg-transparent backdrop-blur-sm md:backdrop-filter-none rounded-lg p-1">
                              <button 
                                onClick={() => handleOpenModal(period)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => period.id && handleDelete(period.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 py-2 opacity-50 hover:opacity-100 transition-opacity">
                         <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                         <button 
                           onClick={() => handleOpenModal(undefined, dayNum)}
                           className="text-gray-500 text-xs font-medium hover:text-electric flex items-center gap-1 group"
                         >
                           <Plus size={14} className="group-hover:scale-110 transition-transform" /> Adicionar Horário
                         </button>
                         <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    )}
                    
                    {hasPeriods && (
                      <button 
                        onClick={() => handleOpenModal(undefined, dayNum)}
                        className="text-xs text-gray-600 hover:text-electric flex items-center gap-1 mt-1 ml-1 transition-colors w-fit px-2 py-1 rounded hover:bg-white/5"
                      >
                        <Plus size={12} /> Adicionar outro turno
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit/Create Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-deep border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center bg-white/5">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {editingPeriod ? 'Editar Turno' : 'Novo Turno'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Defina os detalhes de funcionamento</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                  
                  {/* Linha 1: Dia e Nome */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Dia da Semana</label>
                      <div className="relative">
                        <select
                          value={formData.dia_semana}
                          onChange={(e) => setFormData({...formData, dia_semana: Number(e.target.value)})}
                          className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-electric focus:border-transparent outline-none appearance-none font-medium"
                        >
                          {[2, 3, 4, 5, 6, 7, 1].map(d => (
                            <option key={d} value={d}>{DAYS_MAP[d]}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nome do Período</label>
                      <input 
                        type="text"
                        value={formData.nome_periodo}
                        onChange={(e) => setFormData({...formData, nome_periodo: e.target.value})}
                        placeholder="Ex: Almoço Executivo"
                        className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-electric focus:border-transparent outline-none placeholder:text-gray-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* Linha 2: Horários */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                      <Clock size={14} /> Horário de Funcionamento
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 mb-1 block ml-1">Abertura</span>
                        <input 
                          type="time"
                          value={formData.horario_inicio}
                          onChange={(e) => setFormData({...formData, horario_inicio: e.target.value})}
                          className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-electric focus:border-transparent outline-none font-mono text-center"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 mb-1 block ml-1">Fechamento</span>
                        <input 
                          type="time"
                          value={formData.horario_fim}
                          onChange={(e) => setFormData({...formData, horario_fim: e.target.value})}
                          className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-electric focus:border-transparent outline-none font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Linha 3: Detalhes Extras */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-2">
                        <Music size={14} className="text-purple-400" /> Atração / Entretenimento <span className="text-gray-600 normal-case font-normal">(Opcional)</span>
                      </label>
                      <input 
                        type="text"
                        value={formData.atracao}
                        onChange={(e) => setFormData({...formData, atracao: e.target.value})}
                        placeholder="Ex: Música ao vivo, DJ convidado..."
                        className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none placeholder:text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-2">
                        <Utensils size={14} className="text-orange-400" /> Cardápio / Promoção <span className="text-gray-600 normal-case font-normal">(Opcional)</span>
                      </label>
                      <input 
                        type="text"
                        value={formData.cardapio}
                        onChange={(e) => setFormData({...formData, cardapio: e.target.value})}
                        placeholder="Ex: Rodízio Completo, Feijoada..."
                        className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-transparent outline-none placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  <div 
                    onClick={() => setFormData({...formData, ativo: !formData.ativo})}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all mt-2
                      ${formData.ativo ? 'bg-electric/10 border-electric/30' : 'bg-dark border-gray-700 hover:bg-gray-800'}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded flex items-center justify-center border transition-colors
                      ${formData.ativo ? 'bg-electric border-electric' : 'border-gray-500'}
                    `}>
                      {formData.ativo && <Check size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm font-medium ${formData.ativo ? 'text-white' : 'text-gray-400'}`}>
                      Este turno está ativo e aceitando reservas
                    </span>
                  </div>

                </div>

                <div className="p-6 border-t border-gray-700 bg-white/5 flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-300 bg-transparent border border-gray-600 hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-electric hover:bg-electric/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-electric/20 hover:shadow-electric/30 hover:-translate-y-0.5"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Configurações'}
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
