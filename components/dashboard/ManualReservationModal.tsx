"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  X, Search, User, Calendar, Clock, Users, 
  MessageSquare, Loader2, CheckCircle2, AlertTriangle, Phone 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { manualReservationService } from '../../services/manualReservationService';
import { CreateReservationPayload } from '@/types';

interface ManualReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ManualReservationModal = ({ isOpen, onClose, onSuccess }: ManualReservationModalProps) => {
  const { authUser } = useAuth();
  const [step, setStep] = useState<'search' | 'form' | 'success'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [searchError, setSearchError] = useState("");

  // Form da Busca
  const [searchPhone, setSearchPhone] = useState({ ddd: '', number: '' });

  // Form da Reserva
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateReservationPayload>();

  if (!isOpen) return null;

  const handleSearchClient = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault(); // Prevenir submit se houver form
    
    console.log("🖱️ [ManualReserva] Botão Buscar Cliente clicado!");
    console.log("📊 [ManualReserva] Estado atual:", { 
        ddd: searchPhone.ddd, 
        numero: searchPhone.number, 
        empresaId: authUser?.empresa?.id 
    });

    if (!searchPhone.ddd || !searchPhone.number) {
      console.warn("⚠️ [ManualReserva] Campos incompletos");
      setSearchError("Preencha DDD e Telefone.");
      return;
    }

    if (!authUser?.empresa.id) {
      console.error("❌ [ManualReserva] ID da empresa não encontrado no contexto de auth");
      setSearchError("Erro: Empresa não identificada no sistema. Tente recarregar.");
      return;
    }

    setIsLoading(true);
    setSearchError("");

    try {
      console.log("🚀 [ManualReserva] Iniciando chamada ao serviço...");
      const response = await manualReservationService.validateClient(
        searchPhone.ddd, 
        searchPhone.number, 
        authUser.empresa.id
      );

      console.log("✅ [ManualReserva] Retorno do serviço:", response);

      if (response.success && response.data) {
        setClientData(response.data);
        // Pre-fill name if available
        if (response.data.nome) setValue('nome', response.data.nome);
        setValue('telefone', `${searchPhone.ddd}${searchPhone.number}`);
        setStep('form');
      } else {
        setSearchError(response.error || "Cliente não encontrado.");
      }
    } catch (err) {
      console.error("❌ [ManualReserva] Erro no catch:", err);
      setSearchError("Erro ao buscar cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipSearch = () => {
    setIsAnonymous(true);
    setStep('form');
  };

  const onSubmit = async (data: CreateReservationPayload) => {
    if (!authUser?.empresa.id) return;
    
    setIsLoading(true);

    try {
      // 1. Criar Reserva
      const reservationPayload = {
        ...data,
        empresa_id: authUser.empresa.id,
        telefone: isAnonymous ? (data.telefone || '') : `${searchPhone.ddd}${searchPhone.number}`,
        cliente_id: clientData?.id, // Se tiver
        cliente_uuid: clientData?.uuid_identificador // Se tiver
      };

      const newReservation = await manualReservationService.createReservation(reservationPayload);

      // 2. Enviar Mensagem (se não for anônima)
      let messageStatus = "Reserva criada com sucesso.";
      
      if (!isAnonymous && newReservation?.id) {
         const messageSent = await manualReservationService.triggerConfirmationMessage(newReservation.id);
         if (messageSent) {
            messageStatus = "Reserva feita e mensagem enviada ao cliente.";
         } else {
            messageStatus = "Reserva feita, porém falha ao enviar mensagem.";
         }
      } else {
          messageStatus = "Reserva anônima criada com sucesso.";
      }

      setFeedbackMessage(messageStatus);
      setStep('success');
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error(error);
      alert("Erro ao criar reserva. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('search');
    setIsAnonymous(false);
    setClientData(null);
    setSearchPhone({ ddd: '', number: '' });
    setSearchError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-deep border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-white/5">
          <h3 className="font-bold text-white text-lg">Nova Reserva Manual</h3>
          <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {step === 'search' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-4 text-electric">
                  <Search size={32} />
                </div>
                <h4 className="text-white font-bold text-lg">Buscar Cliente</h4>
                <p className="text-gray-400 text-sm">Identifique o cliente pelo WhatsApp para vincular a reserva.</p>
              </div>

              <div className="bg-dark/50 p-6 rounded-xl border border-gray-700">
                <div className="flex gap-4">
                  <div className="w-20">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">DDD</label>
                    <input 
                      type="text" maxLength={2} placeholder="11"
                      value={searchPhone.ddd}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g,'');
                        setSearchPhone(prev => ({...prev, ddd: val}));
                      }}
                      className="w-full bg-deep border border-gray-600 rounded-lg p-3 text-white text-center focus:border-electric outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Telefone</label>
                    <input 
                      type="text" maxLength={9} placeholder="99999-9999"
                      value={searchPhone.number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g,'');
                        setSearchPhone(prev => ({...prev, number: val}));
                      }}
                      className="w-full bg-deep border border-gray-600 rounded-lg p-3 text-white focus:border-electric outline-none"
                    />
                  </div>
                </div>
                
                {searchError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle size={16} /> {searchError}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={handleSearchClient}
                  disabled={isLoading}
                  className="w-full mt-6 bg-electric hover:bg-electric/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Buscar Cliente'}
                </button>
              </div>

              <div className="relative py-2">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                 <div className="relative flex justify-center text-sm"><span className="px-2 bg-deep text-gray-500">ou</span></div>
              </div>

              <button 
                type="button"
                onClick={handleSkipSearch}
                className="w-full bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 font-medium py-3 rounded-xl transition-all"
              >
                Criar Reserva Anônima / Presencial
              </button>
            </div>
          )}

          {step === 'form' && (
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Info Cliente */}
                {!isAnonymous && clientData && (
                  <div className="flex items-center gap-3 p-3 bg-electric/10 border border-electric/20 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-electric text-white flex items-center justify-center font-bold">
                      {clientData.nome ? clientData.nome.charAt(0) : <User size={20} />}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{clientData.nome || 'Cliente Identificado'}</p>
                      <p className="text-electric text-xs">{searchPhone.ddd} {searchPhone.number}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/20 uppercase font-bold">Vinculado</span>
                    </div>
                  </div>
                )}

                {/* Nome (Editável se anônimo) */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Nome na Reserva</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                      {...register('nome', { required: true })}
                      placeholder="Nome do cliente"
                      className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                    />
                  </div>
                </div>

                {/* Telefone (Se anônimo) */}
                {isAnonymous && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Telefone (Opcional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-500" size={18} />
                      <input 
                        {...register('telefone')}
                        placeholder="Para contato (opcional)"
                        className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Data</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-gray-500" size={18} />
                      <input 
                        type="date"
                        {...register('data_reserva', { required: true })}
                        className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Horário</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 text-gray-500" size={18} />
                      <input 
                        type="time"
                        {...register('horario', { required: true })}
                        className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pessoas */}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Adultos</label>
                     <div className="relative">
                       <Users className="absolute left-3 top-3 text-gray-500" size={18} />
                       <input 
                         type="number" min={1}
                         {...register('adultos', { required: true, min: 1 })}
                         defaultValue={2}
                         className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Crianças</label>
                     <input 
                       type="number" min={0}
                       {...register('criancas')}
                       defaultValue={0}
                       className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:border-electric outline-none"
                     />
                   </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Observações</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 text-gray-500" size={18} />
                    <textarea 
                      {...register('observacoes')}
                      rows={2}
                      placeholder="Alergias, mesa preferida..."
                      className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                   <button type="button" onClick={() => setStep('search')} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5">
                     Voltar
                   </button>
                   <button 
                     type="submit" 
                     disabled={isLoading}
                     className="flex-[2] bg-electric hover:bg-electric/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-electric/20 flex items-center justify-center gap-2"
                   >
                     {isLoading ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}
                   </button>
                </div>
             </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30"
              >
                <CheckCircle2 size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Reserva Realizada!</h3>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                {feedbackMessage}
              </p>
              <button 
                onClick={handleReset}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
