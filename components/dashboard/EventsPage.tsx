"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from './DashboardLayout';
import { eventsService } from '../../services/eventsService';
import { Evento } from '../../types';
import { useAuth } from '@/contexts/AuthContext';
import { 
    Loader2, Plus, Trash2, Edit2, Calendar, 
    PartyPopper, X, AlignLeft, CalendarCheck
} from 'lucide-react';

const EventsPage = () => {
    const { authUser } = useAuth();
    const [events, setEvents] = useState<Evento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Evento | null>(null);

    const { register, handleSubmit, reset } = useForm<Evento>();

    const loadEvents = async () => {
        if (!authUser?.empresa.id) return;

        setIsLoading(true);
        try {
            const data = await eventsService.getEvents(authUser.empresa.id);
            setEvents(data);
        } catch (e) {
            console.error("Erro ao carregar eventos", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [authUser]);

    const handleOpenModal = (evento?: Evento) => {
        if (evento) {
            setEditingEvent(evento);
            reset(evento);
        } else {
            if (!authUser?.empresa.id) return;
            setEditingEvent(null);
            reset({
                empresa_id: authUser.empresa.id,
                titulo: "",
                data_evento: "",
                descricao: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const onSubmit = async (data: Evento) => {
        try {
            if (!authUser?.empresa.id) return;
            
            // Garantir empresa_id
            const payload = {
                ...data,
                empresa_id: authUser.empresa.id
            };
            
            await eventsService.saveEvent(payload);
            await loadEvents();
            handleCloseModal();
        } catch (e) {
            console.error("Erro ao salvar evento", e);
            alert("Erro ao salvar evento.");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Tem certeza que deseja remover este evento?")) {
            try {
                await eventsService.deleteEvent(id);
                await loadEvents();
            } catch (e) {
                alert("Erro ao excluir evento.");
            }
        }
    };

    // Helper para formatar data para exibição
    const getDayAndMonth = (dateString: string) => {
        if (!dateString) return { day: '--', month: '--', year: '----' };
        
        // Criar data considerando timezone local para evitar problemas de dia anterior
        const [yearStr, monthStr, dayStr] = dateString.split('-');
        const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
        
        return {
            day: date.getDate(),
            month: date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
            year: date.getFullYear()
        };
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                            <PartyPopper className="text-electric" /> Eventos
                        </h1>
                        <p className="text-gray-400">Cadastre datas especiais e festivais para promover no atendimento.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-electric hover:bg-electric/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-electric/20 transition-all"
                    >
                        <Plus size={20} />
                        Novo Evento
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-electric" size={40} /></div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {events.length > 0 ? (
                                events.map((event) => {
                                    const { day, month, year } = getDayAndMonth(event.data_evento);
                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            layout
                                            className="bg-deep/60 backdrop-blur-md border border-gray-800 rounded-2xl p-0 overflow-hidden group relative hover:border-electric/30 transition-all"
                                        >
                                            {/* Color Top Bar */}
                                            <div className="h-1 w-full bg-gradient-to-r from-electric to-purple-500"></div>

                                            <div className="p-6 flex gap-6">
                                                {/* Date Box */}
                                                <div className="flex flex-col items-center justify-center bg-dark/50 border border-gray-700 rounded-xl w-20 h-20 shrink-0">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">{month}</span>
                                                    <span className="text-3xl font-display font-bold text-white">{day}</span>
                                                    <span className="text-[10px] text-gray-600">{year}</span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-bold text-white mb-2 truncate pr-8">{event.titulo}</h3>
                                                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                                                        {event.descricao || <span className="italic text-gray-600">Sem descrição.</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions Footer */}
                                            <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-t border-gray-800">
                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                    <CalendarCheck size={14} />
                                                    Data do evento
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleOpenModal(event)}
                                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => event.id && handleDelete(event.id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="col-span-2 text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-dark/30">
                                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                        <PartyPopper size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Nenhum evento cadastrado</h3>
                                    <p className="text-gray-500">Crie eventos especiais para atrair mais clientes.</p>
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
                            className="bg-[#1A2025] border border-gray-800 rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#151a1f]">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {editingEvent ? <Edit2 size={20} className="text-electric"/> : <Plus size={20} className="text-electric"/>}
                                    {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><X size={24}/></button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Título do Evento</label>
                                    <div className="relative">
                                        <PartyPopper size={16} className="absolute left-3 top-3 text-gray-500"/>
                                        <input 
                                            {...register('titulo', { required: true })}
                                            placeholder="Ex: Jantar dos Namorados"
                                            className="w-full bg-dark border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-electric outline-none placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Data do Evento</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-3 text-gray-500"/>
                                        <input 
                                            type="date" 
                                            {...register('data_evento', { required: true })}
                                            className="w-full bg-dark border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-electric outline-none" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição / Detalhes</label>
                                    <div className="relative">
                                        <AlignLeft size={16} className="absolute left-3 top-3 text-gray-500"/>
                                        <textarea 
                                            {...register('descricao')} 
                                            rows={4}
                                            placeholder="Descreva o que haverá de especial (cardápio, música, preço)..."
                                            className="w-full bg-dark border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-electric outline-none resize-none placeholder:text-gray-600" 
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-800 gap-3">
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 text-gray-400 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/5"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-6 py-2.5 bg-electric hover:bg-electric/90 text-white rounded-lg font-bold shadow-lg shadow-electric/20 transition-all"
                                    >
                                        {editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
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

export default EventsPage;
