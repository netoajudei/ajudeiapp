"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Loader2, AlertTriangle, CheckCircle2, X, ChevronLeft, ChevronRight, User, MessageSquare } from 'lucide-react';
import { supabaseReservationService } from '../../services/supabaseReservationService';
import { reservationApiService } from '../../services/reservationApiService';

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentReservation: any;
  clienteUuid: string;
  empresaId: number;
  onSuccess: () => void;
}

// Helper for calendar generation
const generateCalendarDays = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < firstDayIndex; x++) {
        days.push({ day: null, active: false });
    }

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

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const EditReservationModal = ({ 
  isOpen, 
  onClose, 
  currentReservation, 
  clienteUuid,
  onSuccess 
}: EditReservationModalProps) => {
  
  // Form State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [childrenCount, setChildrenCount] = useState(0);
  const [observations, setObservations] = useState("");
  const [reservationName, setReservationName] = useState("");

  // UI State
  const [step, setStep] = useState(1); // 1: Edit Form, 2: Confirmation Warning
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Initialize form with current data
  useEffect(() => {
    if (isOpen && currentReservation) {
      // Parse date string (YYYY-MM-DD) safely considering timezone
      const [year, month, day] = currentReservation.data_reserva.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      setSelectedDate(date);
      setCalendarMonth(date); // Show the month of the reservation
      setGuestCount(String(currentReservation.adultos));
      setChildrenCount(currentReservation.criancas || 0);
      setPeriod(currentReservation.horario); // "A noite" or "Almoço"
      setObservations(currentReservation.observacoes || "");
      setReservationName(currentReservation.nome || "");
      
      setStep(1);
      setError(null);
    }
  }, [isOpen, currentReservation]);

  if (!isOpen) return null;

  const currentMonthDays = generateCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth());

  const handlePrevMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    // Don't go back past current month if it's the current month
    const today = new Date();
    if (newDate.getMonth() < today.getMonth() && newDate.getFullYear() === today.getFullYear()) return;
    setCalendarMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarMonth(newDate);
  };

  const handleValidate = async () => {
    if (!selectedDate || !guestCount || !period || !reservationName) return;

    setIsValidating(true);
    setError(null);

    try {
       const year = selectedDate.getFullYear();
       const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
       const day = String(selectedDate.getDate()).padStart(2, '0');
       const dateString = `${year}-${month}-${day}`;

       // Verifica disponibilidade
       const response = await supabaseReservationService.verificarDisponibilidade({
          p_cliente_uuid: clienteUuid,
          p_data_desejada: dateString,
          p_nome_periodo: period,
          p_numero_de_pessoas: parseInt(guestCount) + childrenCount 
       });

       if (response.disponivel) {
         setStep(2); // Move to confirmation warning
       } else {
         setError(response.motivo || "Não há disponibilidade para os novos dados selecionados.");
       }

    } catch (err: any) {
       console.error("Erro na validação:", err);
       setError("Não foi possível verificar a disponibilidade. Tente novamente.");
    } finally {
       setIsValidating(false);
    }
  };

  const handleConfirmEdit = async () => {
    setIsSaving(true);
    try {
       if (!selectedDate) throw new Error("Data não selecionada.");

       const year = selectedDate.getFullYear();
       const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
       const day = String(selectedDate.getDate()).padStart(2, '0');
       const dateString = `${year}-${month}-${day}`;
       
       console.log("🚀 Enviando solicitação de edição...", {
          cliente_uuid: clienteUuid,
          novo_nome: reservationName,
          nova_data_reserva: dateString,
          novos_adultos: parseInt(guestCount),
          novas_criancas: childrenCount,
          nova_observacao: observations,
          novo_horario: period
       });
       
       const result = await reservationApiService.solicitarEdicaoReservaLink({
          cliente_uuid: clienteUuid,
          novo_nome: reservationName,
          nova_data_reserva: dateString,
          novos_adultos: parseInt(guestCount),
          novas_criancas: childrenCount,
          nova_observacao: observations,
          novo_horario: period
       });
       
       if (result.success) {
         onSuccess(); // Recarrega a página pai
         onClose();
       } else {
         throw new Error(result.error || "Erro ao processar edição.");
       }

    } catch (err: any) {
       console.error("Erro na edição:", err);
       setError(err.message || "Erro ao salvar alterações. Por favor entre em contato com o restaurante.");
    } finally {
       setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Editar Reserva</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Reservation Name */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} /> Nome na Reserva
                </label>
                <input 
                  type="text" 
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Calendar */}
              <div>
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                     <Calendar size={16} /> Data
                   </h4>
                   <div className="flex gap-2">
                     <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={16}/></button>
                     <span className="text-sm font-medium capitalize">{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</span>
                     <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={16}/></button>
                   </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-400">
                  <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {currentMonthDays.map((d, i) => (
                    <button
                      key={i}
                      disabled={!d.active}
                      onClick={() => d.date && setSelectedDate(d.date)}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm transition-all
                        ${!d.day ? 'invisible' : ''}
                        ${!d.active ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 text-gray-700'}
                        ${selectedDate && d.date && selectedDate.toDateString() === d.date.toDateString() 
                          ? 'bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700' 
                          : ''}
                      `}
                    >
                      {d.day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Users size={16} /> Pessoas
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="text-xs text-gray-400 mb-1 block">Adultos</span>
                    <input 
                      type="number" 
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-400 mb-1 block">Crianças</span>
                    <input 
                      type="number" 
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Period */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock size={16} /> Período
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPeriod('Almoço')}
                    className={`p-3 rounded-xl border transition-all font-medium text-sm ${
                      period === 'Almoço' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Almoço
                  </button>
                  <button
                    onClick={() => setPeriod('A noite')}
                    className={`p-3 rounded-xl border transition-all font-medium text-sm ${
                      period === 'A noite' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Jantar
                  </button>
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} /> Observações
                </label>
                <textarea 
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Aniversário, alergias, cadeira de rodas..."
                  rows={3}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>
              
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 items-start"
                >
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-red-800 font-medium">Indisponível</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-red-100">
                      Dica: Tente outro horário ou entre em contato com o restaurante.
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          )}

          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-100 text-yellow-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Alteração?</h3>
              <p className="text-gray-500 text-sm mb-6 px-4">
                Ao confirmar, sua reserva atual será <b>substituída</b> pelos novos dados. 
                <br/><br/>
                Caso queira voltar aos dados anteriores depois, você estará sujeito à disponibilidade do momento.
              </p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left mb-6 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Novo Nome:</span>
                  <span className="font-bold text-gray-800 text-right truncate max-w-[150px]">{reservationName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Nova Data:</span>
                  <span className="font-bold text-gray-800">{selectedDate?.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Novo Horário:</span>
                  <span className="font-bold text-gray-800">{period}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Total Pessoas:</span>
                  <span className="font-bold text-gray-800">{parseInt(guestCount) + childrenCount}</span>
                </div>
                {observations && (
                    <div className="flex flex-col mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-500 text-xs uppercase font-bold mb-1">Observações:</span>
                        <span className="text-gray-800 italic text-xs">{observations}</span>
                    </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          {step === 1 ? (
             <button
               onClick={handleValidate}
               disabled={isValidating || !selectedDate || !guestCount || !period || !reservationName}
               className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
             >
               {isValidating ? <Loader2 className="animate-spin" /> : "Verificar Disponibilidade"}
             </button>
          ) : (
             <div className="flex gap-3">
               <button
                 onClick={() => setStep(1)}
                 className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
               >
                 Voltar
               </button>
               <button
                 onClick={handleConfirmEdit}
                 disabled={isSaving}
                 className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
               >
                 {isSaving ? <Loader2 className="animate-spin" /> : "Confirmar Alteração"}
               </button>
             </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};
