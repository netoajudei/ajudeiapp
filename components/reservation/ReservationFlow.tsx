"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicService } from '../../services/publicService';
import { supabaseReservationService } from '../../services/supabaseReservationService';
import { reservationApiService } from '../../services/reservationApiService';
import { Empresa, Cliente } from '../../types';
import { Loader2, Calendar, Users, Clock, User, Check, ChevronRight, Cake, MessageSquare, Minus, Plus, Sparkles, AlertTriangle } from 'lucide-react';

// Helper for calendar generation
const generateCalendarDays = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Previous month placeholders
    for (let x = 0; x < firstDayIndex; x++) {
        days.push({ day: null, active: false });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= lastDay; i++) {
        const currentDate = new Date(year, month, i);
        days.push({
            day: i,
            active: currentDate >= today,
            date: currentDate
        });
    }
    return days;
};

interface ReservationFlowProps {
    uuid: string;
    initialData?: {
        empresa: Empresa;
        cliente: Cliente;
    };
}

const ReservationFlow = ({ uuid, initialData }: ReservationFlowProps) => {

    // Data State
    const [isLoading, setIsLoading] = useState(!initialData);
    const [empresa, setEmpresa] = useState<Empresa | null>(initialData?.empresa || null);
    const [cliente, setCliente] = useState<Cliente | null>(initialData?.cliente || null);
    const [error, setError] = useState<string | null>(null);

    // Flow State: 0=Splash, 1=SelectDate, 2=Details, 3=Processing, 4=Success
    const [step, setStep] = useState(initialData ? 1 : 0);

    // Form State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [guestCount, setGuestCount] = useState<string>("");
    const [period, setPeriod] = useState<string>("");
    const [validatingAvailability, setValidatingAvailability] = useState(false);
    const [unavailabilityError, setUnavailabilityError] = useState<string | null>(null);

    // Details State
    const [childrenCount, setChildrenCount] = useState(0);
    const [reservationName, setReservationName] = useState(initialData?.cliente?.nome || "");
    const [observations, setObservations] = useState("");
    const [isBirthday, setIsBirthday] = useState(false);

    // Debug Log for Theme
    useEffect(() => {
        if (empresa) {
            console.log('🎨 [ReservationFlow] Tema carregado:', {
                cor: empresa.cor,
                logo: empresa.logo,
                fantasia: empresa.fantasia
            });
        }
    }, [empresa]);

    // Sincronizar estado com initialData se mudar (ex: recarregamento do pai)
    useEffect(() => {
        if (initialData?.empresa) {
            console.log('🔄 [ReservationFlow] Atualizando empresa via initialData:', initialData.empresa.fantasia);
            setEmpresa(initialData.empresa);
        }
        if (initialData?.cliente) {
            console.log('🔄 [ReservationFlow] Atualizando cliente via initialData:', initialData.cliente.nome);
            setCliente(initialData.cliente);
            if (!reservationName) {
                setReservationName(initialData.cliente.nome || "");
            }
        }
        // Se tivermos dados suficientes e estivermos no step 0, avançar
        if (initialData?.empresa && step === 0) {
             setStep(1);
             setIsLoading(false);
        }
    }, [initialData]);

    useEffect(() => {
        const loadData = async () => {
            // Se já temos os dados iniciais via props (e eles são válidos), não buscamos novamente
            if (initialData?.empresa) {
                return;
            }

            if (!uuid) {
                setError("Link de reserva inválido ou expirado.");
                setIsLoading(false);
                return;
            }
            try {
                const data = await publicService.getDataByUuid(uuid);
                setEmpresa(data.empresa);
                setCliente(data.cliente);
                setReservationName(data.cliente.nome || ""); // Pre-fill name
                setStep(1); // Move from Splash to Selection
            } catch (err) {
                setError("Link de reserva inválido ou expirado.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [uuid, initialData]);

    // Chain Reactions - Validation
    useEffect(() => {
        if (selectedDate && guestCount && period && (cliente || initialData?.cliente)) {
            const clientToUse = cliente || initialData?.cliente;
            
            // Validate availability via RPC
            const validate = async () => {
                setValidatingAvailability(true);
                try {
                    // Converter data local para string YYYY-MM-DD sem conversão de fuso
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    const dateString = `${year}-${month}-${day}`;

                    const response = await supabaseReservationService.verificarDisponibilidade({
                        p_cliente_uuid: clientToUse?.uuid_identificador || uuid,
                        p_data_desejada: dateString,
                        p_nome_periodo: period,
                        p_numero_de_pessoas: parseInt(guestCount)
                    });

                    if (response.disponivel) {
                         setStep(2); // Go to details
                    } else {
                        setUnavailabilityError(response.motivo || "Não há disponibilidade para esta data/horário.");
                        setPeriod(""); // Reset period to allow selection again
                    }
                } catch (err) {
                    console.error("Erro ao verificar disponibilidade:", err);
                    // Em caso de erro técnico, talvez permitir passar ou mostrar erro?
                    // Vamos assumir indisponível por segurança
                    setUnavailabilityError("Erro ao verificar disponibilidade. Tente novamente.");
                    setPeriod("");
                } finally {
                    setValidatingAvailability(false);
                }
            };
            validate();
        }
    }, [period, selectedDate, guestCount, cliente, initialData, uuid]);

    const handleConfirmReservation = async () => {
        if (!reservationName || !selectedDate || !period || !guestCount) return;
        
        setStep(3); // Processing

        try {
            const clientToUse = cliente || initialData?.cliente;
            const clienteUuid = clientToUse?.uuid_identificador || uuid;

            // Formatar data para YYYY-MM-DD
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            const payload = {
                nome: reservationName,
                adultos: parseInt(guestCount),
                data_reserva: dateString,
                horario: period, // "A noite" ou "Almoço"
                criancas: childrenCount,
                observacoes: observations,
                cliente_uuid: clienteUuid,
                aniversario: isBirthday
            };

            const result = await reservationApiService.criarReservaLink(payload);

            if (result.success) {
                 setStep(4); // Success
            } else {
                throw new Error(result.error || "Erro ao criar reserva.");
            }
        } catch (error: any) {
            console.error("Erro ao criar reserva:", error);
            setError(error.message || "Não foi possível confirmar a reserva. Tente novamente.");
            setStep(2); // Volta para detalhes
        }
    };

    const today = new Date();
    const currentMonthDays = generateCalendarDays(today.getFullYear(), today.getMonth());
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Loading Splash
    if (isLoading || step === 0) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    className="mb-8"
                >
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center shadow-xl border border-gray-100 overflow-hidden">
                      {empresa?.logo ? (
                         <img src={empresa.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                         <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                      )}
                   </div>
                </motion.div>
                <h2 className="text-gray-400 text-sm font-medium tracking-widest uppercase">Carregando Reserva</h2>
            </div>
        );
    }

    if (error || !empresa) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="text-red-500 mb-4"><User size={48} /></div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Algo deu errado.</h2>
                <p className="text-gray-500">{error || "Não foi possível carregar os dados."}</p>
            </div>
        );
    }

    // Dynamic Theme Color
    const themeColor = empresa?.cor || '#3B82F6';
    
    console.log('🎨 [ReservationFlow] Renderizando com cor:', themeColor, 'Empresa:', empresa?.fantasia);

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden selection:bg-gray-200">
            {/* Header with Logo */}
            <header className="bg-white sticky top-0 z-20 border-b border-gray-100 shadow-sm">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                            <img src={empresa.logo || ""} alt="Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-gray-900 leading-tight">{empresa.fantasia}</h1>
                            <p className="text-xs text-gray-400">Nova Reserva</p>
                        </div>
                    </div>
                    {cliente && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                {cliente.nome?.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-gray-600 hidden sm:block">Olá, {cliente.nome?.split(' ')[0]}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 pb-20">
                <AnimatePresence mode="wait">
                    {/* STEP 1: DATE SELECTION & BASIC INFO */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Calendar Section */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" style={{ color: themeColor }} />
                                    Escolha uma data
                                </h2>
                                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6">
                                    <div className="text-center mb-6">
                                        <span className="text-gray-900 font-bold text-lg capitalize">
                                            {monthNames[today.getMonth()]} {today.getFullYear()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400 mb-2">
                                        <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {currentMonthDays.map((d, i) => (
                                            <button
                                                key={i}
                                                disabled={!d.active}
                                                onClick={() => d.date && setSelectedDate(d.date)}
                                                className={`
                                                    aspect-square rounded-full flex items-center justify-center text-sm transition-all
                                                    ${!d.day ? 'invisible' : ''}
                                                    ${!d.active ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 cursor-pointer font-medium'}
                                                    ${selectedDate && d.date && selectedDate.toDateString() === d.date.toDateString() ? 'text-white shadow-lg scale-110' : ''}
                                                `}
                                                style={
                                                    selectedDate && d.date && selectedDate.toDateString() === d.date.toDateString()
                                                    ? { backgroundColor: themeColor }
                                                    : {}
                                                }
                                            >
                                                {d.day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Guest Input - Appears after Date */}
                            <AnimatePresence>
                                {selectedDate && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Users className="w-4 h-4" style={{ color: themeColor }} />
                                            Quantas pessoas?
                                        </label>
                                        <input
                                            type="number"
                                            value={guestCount}
                                            onChange={(e) => setGuestCount(e.target.value)}
                                            placeholder="Ex: 2"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-lg font-medium text-gray-900 outline-none focus:ring-2 focus:border-transparent transition-all"
                                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                        />
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            {/* Period Select - Appears after Guests */}
                            <AnimatePresence>
                                {selectedDate && guestCount && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4" style={{ color: themeColor }} />
                                            Qual período?
                                        </label>
                                        <select
                                            value={period}
                                            onChange={(e) => setPeriod(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-lg font-medium text-gray-900 outline-none focus:ring-2 focus:border-transparent transition-all appearance-none"
                                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            <option value="Almoço">Almoço (12h - 15h)</option>
                                            <option value="A noite">Jantar (19h - 23h)</option>
                                        </select>
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            {/* Validation Loader */}
                            {validatingAvailability && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center gap-3 py-4 bg-gray-50 rounded-xl border border-gray-100"
                                >
                                    <Loader2 className="animate-spin text-gray-400" />
                                    <span className="text-sm text-gray-500">Verificando disponibilidade...</span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 2: DETAILS */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Data Selecionada</p>
                                    <p className="font-bold text-gray-800">
                                        {selectedDate?.toLocaleDateString('pt-BR')} • {period}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => { setStep(1); setPeriod(""); }} 
                                    className="text-xs underline font-medium hover:opacity-70 transition-opacity"
                                    style={{ color: themeColor }}
                                >
                                    Alterar
                                </button>
                            </div>

                            {/* Children Counter */}
                            <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center" style={{ color: themeColor, backgroundColor: `${themeColor}20` }}>
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">Crianças</div>
                                        <div className="text-xs text-gray-500">Menores de 10 anos</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-bold text-lg w-4 text-center">{childrenCount}</span>
                                    <button 
                                        onClick={() => setChildrenCount(childrenCount + 1)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md"
                                        style={{ backgroundColor: themeColor }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Reserva</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={reservationName}
                                            onChange={(e) => setReservationName(e.target.value)}
                                            placeholder="Nome completo"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 font-medium text-gray-900 outline-none focus:ring-2 focus:border-transparent transition-all"
                                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Observações (Opcional)</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                        <textarea
                                            value={observations}
                                            onChange={(e) => setObservations(e.target.value)}
                                            placeholder="Ex: Cadeira de rodas, alergias..."
                                            rows={3}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 font-medium text-gray-900 outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                                        />
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setIsBirthday(!isBirthday)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isBirthday ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-200'}`}
                                >
                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isBirthday ? 'bg-pink-500 border-pink-500' : 'border-gray-300 bg-white'}`}>
                                        {isBirthday && <Check size={14} className="text-white" />}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <Cake className={`w-5 h-5 ${isBirthday ? 'text-pink-500' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${isBirthday ? 'text-pink-700' : 'text-gray-600'}`}>Alguém faz aniversário?</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleConfirmReservation}
                                disabled={!reservationName.trim()}
                                className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-xl shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                                style={{ backgroundColor: themeColor }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Confirmar Reserva
                                <ChevronRight />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* STEP 3: PROCESSING */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="relative mb-6">
                                <div className="w-20 h-20 rounded-full border-4 border-gray-100"></div>
                                <div className="w-20 h-20 rounded-full border-4 border-t-transparent absolute top-0 left-0 animate-spin" style={{ borderColor: `${themeColor} transparent transparent transparent` }}></div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Processando...</h3>
                            <p className="text-gray-500">Estamos confirmando sua mesa.</p>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-10 relative"
                        >
                            {/* Simple CSS Confetti Particles */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: -20, x: Math.random() * 300 - 150, rotate: 0, opacity: 1 }}
                                        animate={{ y: 400, rotate: 360, opacity: 0 }}
                                        transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: "linear" }}
                                        className="absolute top-0 left-1/2 w-2 h-2 sm:w-3 sm:h-3 rounded-sm"
                                        style={{ 
                                            backgroundColor: ['#FFC107', '#FF5722', '#4CAF50', '#2196F3'][Math.floor(Math.random() * 4)] 
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 text-green-500 shadow-green-200 shadow-xl">
                                <Check size={48} strokeWidth={4} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Reserva Confirmada!</h2>
                            <p className="text-gray-600 mb-8 px-8">
                                Tudo certo, <b>{reservationName.split(' ')[0]}</b>. Enviamos os detalhes para o seu WhatsApp.
                            </p>

                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 inline-block w-full text-left mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Data</p>
                                        <p className="font-bold text-gray-800">{selectedDate?.toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Horário</p>
                                        <p className="font-bold text-gray-800">{period === 'Almoço' ? 'Almoço' : 'Jantar'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Pessoas</p>
                                        <p className="font-bold text-gray-800">{parseInt(guestCount) + childrenCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Protocolo</p>
                                        <p className="font-bold text-gray-800">#RES-{Math.floor(Math.random() * 10000)}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 mt-4">Você pode fechar esta janela.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Unavailability Dialog */}
                <AnimatePresence>
                    {unavailabilityError && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto border-4 border-red-100">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Ops! Indisponível</h3>
                                <p className="text-gray-500 text-center text-sm mb-6 px-2">
                                    {unavailabilityError}
                                </p>
                                
                                <button 
                                    onClick={() => setUnavailabilityError(null)}
                                    className="w-full py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    Tentar Outra Data
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default ReservationFlow;