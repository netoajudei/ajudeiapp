
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from './DashboardLayout';
import { periodService } from '../../services/periodService';
import { OperatingPeriod } from '../../types';
import { 
    Loader2, Plus, Trash2, Edit2, Clock, Calendar, 
    Zap, Music, FileText, CheckCircle2, XCircle, X 
} from 'lucide-react';

// SQL MAPPING: 1=Domingo ... 7=Sábado
const DAYS_MAP = [
    { id: 1, label: 'Dom', full: 'Domingo' },
    { id: 2, label: 'Seg', full: 'Segunda-feira' },
    { id: 3, label: 'Ter', full: 'Terça-feira' },
    { id: 4, label: 'Qua', full: 'Quarta-feira' },
    { id: 5, label: 'Qui', full: 'Quinta-feira' },
    { id: 6, label: 'Sex', full: 'Sexta-feira' },
    { id: 7, label: 'Sáb', full: 'Sábado' },
];

const OperatingPeriodsPage = () => {
    const [periods, setPeriods] = useState<OperatingPeriod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<number>(2); // Começa na Segunda (2) por padrão
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<OperatingPeriod | null>(null);

    // Form Handlers
    const { register, handleSubmit, reset, setValue, watch } = useForm<OperatingPeriod>();

    const loadPeriods = async () => {
        setIsLoading(true);
        try {
            const data = await periodService.getPeriods();
            setPeriods(data);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPeriods();
    }, []);

    const handleOpenModal = (period?: OperatingPeriod) => {
        if (period) {
            setEditingPeriod(period);
            reset(period);
        } else {
            setEditingPeriod(null);
            reset({
                empresa_id: 101,
                ativo: true,
                data_especial: false,
                dia_semana: activeDay,
                nome_periodo: "",
                horario_inicio: "",
                horario_fim: "",
                promocao: "",
                atracao: "",
                cardapio: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPeriod(null);
    };

    const onSubmit = async (data: OperatingPeriod) => {
        try {
            // Forçar conversão de números
            const payload = {
                ...data,
                dia_semana: Number(data.dia_semana),
                // data_especial toggle logic if strictly needed
            };

            await periodService.savePeriod(payload);
            await loadPeriods(); // Refresh list
            handleCloseModal();
        } catch (e) {
            console.error("Erro ao salvar", e);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Tem certeza que deseja remover este período?")) {
            await periodService.deletePeriod(id);
            await loadPeriods();
        }
    };

    // Filter periods for the current active tab
    const currentPeriods = periods.filter(p => {
        // Se for aba normal (1-7), mostra períodos recorrentes daquele dia
        if (activeDay <= 7) {
            return p.dia_semana === activeDay && !p.data_especial;
        } 
        // Se for aba 'Especial' (8), mostra apenas datas especiais
        return p.data_especial;
    });

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-2">Horários & Promoções</h1>
                        <p className="text-gray-400">Gerencie o funcionamento, cardápio e atrações do dia.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-electric hover:bg-electric/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-electric/20 transition-all"
                    >
                        <Plus size={20} />
                        Novo Período
                    </button>
                </div>

                {/* Tabs Days */}
                <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-hide">
                    {DAYS_MAP.map((day) => (
                        <button
                            key={day.id}
                            onClick={() => setActiveDay(day.id)}
                            className={`
                                px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all border
                                ${activeDay === day.id 
                                    ? 'bg-electric text-white border-electric shadow-lg shadow-electric/20' 
                                    : 'bg-deep border-gray-800 text-gray-400 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            {day.full}
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveDay(8)}
                        className={`
                             px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all border ml-2
                             ${activeDay === 8
                                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20' 
                                : 'bg-deep border-gray-800 text-purple-400 hover:text-purple-300 hover:bg-white/5'
                            }
                        `}
                    >
                        Datas Especiais
                    </button>
                </div>

                {/* List Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-electric" size={40} /></div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {currentPeriods.length > 0 ? (
                                currentPeriods.map((period) => (
                                    <motion.div
                                        key={period.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                        className={`bg-deep/60 backdrop-blur-md border rounded-2xl p-6 relative group ${period.ativo ? 'border-gray-800' : 'border-gray-800 opacity-60'}`}
                                    >
                                        {/* Active Status Badge */}
                                        <div className="absolute top-6 right-6 flex gap-2">
                                            <button onClick={() => handleOpenModal(period)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(period.id!)} className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Left: Time & Name */}
                                            <div className="md:w-1/4 border-r border-gray-800 pr-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`w-2 h-2 rounded-full ${period.ativo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    <h3 className="font-bold text-xl text-white">{period.nome_periodo}</h3>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400 bg-dark/50 px-3 py-2 rounded-lg w-fit border border-gray-800">
                                                    <Clock size={16} className="text-electric" />
                                                    <span className="font-mono text-sm">{period.horario_inicio.slice(0,5)} - {period.horario_fim.slice(0,5)}</span>
                                                </div>
                                                {period.data_especial && (
                                                    <div className="mt-2 flex items-center gap-2 text-purple-400 text-sm">
                                                        <Calendar size={14} />
                                                        <span>{new Date(period.data_evento_especial!).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Details */}
                                            <div className="flex-1 grid md:grid-cols-3 gap-6">
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                                        <Zap size={12} /> Promoção
                                                    </div>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {period.promocao || <span className="text-gray-600 italic">Nenhuma cadastrada</span>}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                                        <Music size={12} /> Atração
                                                    </div>
                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                        {period.atracao || <span className="text-gray-600 italic">Nenhuma cadastrada</span>}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                                        <FileText size={12} /> Cardápio
                                                    </div>
                                                    <p className="text-sm text-gray-300 leading-relaxed truncate">
                                                        {period.cardapio || <span className="text-gray-600 italic">Padrão</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
                                    <p className="text-gray-500">Nenhum horário configurado para este dia.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1A2025] border border-gray-800 rounded-2xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#151a1f]">
                                <h2 className="text-xl font-bold text-white">
                                    {editingPeriod ? 'Editar Período' : 'Novo Período'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><X size={24}/></button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                                {/* Top Row: Name & Active */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome do Período</label>
                                        <input 
                                            {...register('nome_periodo', { required: true })}
                                            placeholder="Ex: Almoço de Domingo"
                                            className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-electric outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                                        <select {...register('ativo')} className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-electric outline-none">
                                            <option value="true">Ativo</option>
                                            <option value="false">Inativo</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Date/Day Logic */}
                                <div className="grid grid-cols-2 gap-4 bg-dark/30 p-4 rounded-xl border border-gray-800">
                                    <div className="col-span-2 flex items-center gap-2 mb-2">
                                        <input type="checkbox" {...register('data_especial')} id="specialCheck" className="rounded bg-dark border-gray-600 text-electric focus:ring-0" />
                                        <label htmlFor="specialCheck" className="text-sm text-white font-medium">É uma data especial/feriado?</label>
                                    </div>
                                    
                                    <div className={watch('data_especial') ? 'opacity-50 pointer-events-none' : ''}>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Dia da Semana Recorrente</label>
                                        <select {...register('dia_semana')} className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-electric outline-none">
                                            {DAYS_MAP.map(d => (
                                                <option key={d.id} value={d.id}>{d.full}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={!watch('data_especial') ? 'opacity-50 pointer-events-none' : ''}>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Data Específica</label>
                                        <input 
                                            type="date" 
                                            {...register('data_evento_especial')}
                                            className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-electric outline-none" 
                                        />
                                    </div>
                                </div>

                                {/* Times */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Horário Início</label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-500"/>
                                            <input type="time" {...register('horario_inicio', { required: true })} className="w-full bg-dark border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-electric outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Horário Fim</label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-500"/>
                                            <input type="time" {...register('horario_fim', { required: true })} className="w-full bg-dark border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-electric outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Details Text Areas */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Promoção do Dia</label>
                                        <textarea 
                                            {...register('promocao')} 
                                            rows={2}
                                            placeholder="Ex: Caipirinha em dobro até as 20h"
                                            className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-electric outline-none resize-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Atrações / Música</label>
                                        <textarea 
                                            {...register('atracao')} 
                                            rows={2}
                                            placeholder="Ex: Música ao vivo com Fulano"
                                            className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-electric outline-none resize-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Link ou Texto do Cardápio</label>
                                        <input 
                                            {...register('cardapio')} 
                                            placeholder="Ex: https://meucardapio.com/almoco ou 'Menu Executivo'"
                                            className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-electric outline-none" 
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-800">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 text-gray-400 hover:text-white font-medium transition-colors mr-2"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-6 py-2.5 bg-electric hover:bg-electric/90 text-white rounded-lg font-bold shadow-lg shadow-electric/20 transition-all"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default OperatingPeriodsPage;
