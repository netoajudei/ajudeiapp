"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  X, Search, User, Calendar, Clock, Users,
  MessageSquare, Loader2, CheckCircle2, AlertTriangle, Phone, Cake, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { manualReservationService } from '../../services/manualReservationService';
import { supabaseReservationService } from '../../services/supabaseReservationService';
import { CreateReservationPayload } from '@/types';

interface ManualReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const ManualReservationModal = ({ isOpen, onClose, onSuccess }: ManualReservationModalProps) => {
  const { authUser } = useAuth();
  const [step, setStep] = useState<'search' | 'form' | 'success'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [searchError, setSearchError] = useState("");

  // Availability
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Phone from search (to pre-fill in anonymous form)
  const [searchPhone, setSearchPhone] = useState({ ddd: '', number: '' });

  // Form da Reserva
  const { register, handleSubmit, setValue, watch, reset: resetForm, formState: { errors } } = useForm<CreateReservationPayload>({
    defaultValues: {
      adultos: 2,
      criancas: 0,
      data_reserva: localToday(),
      aniversario: false,
    }
  });

  const watchDate = watch('data_reserva');
  const watchPeriodo = watch('horario');
  const watchAdultos = watch('adultos');
  const watchCriancas = watch('criancas');

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setIsAnonymous(false);
      setClientData(null);
      setSearchPhone({ ddd: '', number: '' });
      setSearchError("");
      setAvailabilityError("");
      setFeedbackMessage("");
      resetForm({
        adultos: 2,
        criancas: 0,
        data_reserva: localToday(),
        aniversario: false,
        nome: '',
        observacoes: '',
        horario: '',
        telefone: '',
      });
    }
  }, [isOpen]);

  // Availability check when date + period + guests change
  useEffect(() => {
    if (step !== 'form' || !watchDate || !watchPeriodo || !watchAdultos) return;
    if (!authUser?.empresa?.id) return;

    const totalPessoas = (Number(watchAdultos) || 0) + (Number(watchCriancas) || 0);
    if (totalPessoas <= 0) return;

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      setAvailabilityError("");
      try {
        const result = await manualReservationService.checkAvailability(
          authUser.empresa.id,
          watchDate,
          watchPeriodo,
          totalPessoas
        );
        if (result && result.disponivel === false) {
          setAvailabilityError(result.motivo || 'Data/período indisponível.');
        }
      } catch (err) {
        console.warn('Erro ao verificar disponibilidade:', err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timeout = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeout);
  }, [step, watchDate, watchPeriodo, watchAdultos, watchCriancas, authUser]);

  if (!isOpen) return null;

  const handleSearchClient = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!searchPhone.ddd || !searchPhone.number) {
      setSearchError("Preencha DDD e Telefone.");
      return;
    }

    if (!authUser?.empresa.id) {
      setSearchError("Erro: Empresa não identificada.");
      return;
    }

    if (searchPhone.ddd.length !== 2) {
      setSearchError("DDD deve ter 2 dígitos.");
      return;
    }

    if (searchPhone.number.length < 8 || searchPhone.number.length > 9) {
      setSearchError("Telefone deve ter 8 ou 9 dígitos.");
      return;
    }

    setIsLoading(true);
    setSearchError("");

    try {
      // Busca direto no banco (sem edge function) — cobre @c.us, @lid, etc.
      const response = await manualReservationService.searchClientByPhone(
        searchPhone.ddd,
        searchPhone.number,
        authUser.empresa.id
      );

      if (response.success && response.data) {
        setClientData(response.data);
        setIsAnonymous(false);
        if (response.data.nome) {
          setValue('nome', response.data.nome);
        }
        setValue('telefone', `${searchPhone.ddd}${searchPhone.number}`);
        setStep('form');
      } else {
        // Não encontrado — abrir form anônimo com telefone preenchido
        setSearchError("Cliente não encontrado.");
        setIsAnonymous(true);
        setValue('telefone', `${searchPhone.ddd}${searchPhone.number}`);
        setTimeout(() => {
          setStep('form');
        }, 800);
      }
    } catch (err) {
      console.error("[ManualReserva] Erro:", err);
      setSearchError("Erro ao buscar. Criando reserva anônima...");
      setIsAnonymous(true);
      setValue('telefone', `${searchPhone.ddd}${searchPhone.number}`);
      setTimeout(() => {
        setStep('form');
      }, 800);
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
    if (availabilityError) return; // Block if date unavailable

    setIsLoading(true);

    try {
      let clienteId = clientData?.id || null;
      let clienteUuid = clientData?.uuid_identificador || null;
      const telefone = data.telefone?.replace(/\D/g, '') || '';

      // If anonymous + has phone → create client first
      if (!clienteId && telefone && data.nome) {
        try {
          const newClient = await manualReservationService.createClientFromAnonymous({
            nome: data.nome,
            telefone: telefone,
            empresa_id: authUser.empresa.id,
          });
          if (newClient) {
            clienteId = newClient.id;
            clienteUuid = newClient.uuid_identificador;
          }
        } catch (err) {
          console.warn('Erro ao criar cliente, prosseguindo como anônimo:', err);
        }
      }

      // Create reservation
      const reservationPayload = {
        ...data,
        empresa_id: authUser.empresa.id,
        adultos: Number(data.adultos),
        criancas: Number(data.criancas) || 0,
        cliente_id: clienteId,
        cliente_uuid: clienteUuid,
      };

      const newReservation = await manualReservationService.createReservation(reservationPayload);

      // Send WhatsApp confirmation (if client linked)
      let messageStatus = "";

      if (clienteId && newReservation?.id) {
        const messageSent = await manualReservationService.triggerConfirmationMessage(clienteId, {
          nome: data.nome,
          data_reserva: data.data_reserva,
          adultos: Number(data.adultos),
          criancas: Number(data.criancas) || 0,
        });
        messageStatus = messageSent
          ? "Reserva feita e mensagem enviada ao cliente."
          : "Reserva feita, porém falha ao enviar mensagem.";
      } else {
        messageStatus = telefone
          ? "Reserva criada e cliente cadastrado com sucesso."
          : "Reserva anônima criada com sucesso.";
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
    setAvailabilityError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-deep border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
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

          {/* STEP: SEARCH */}
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
                        setSearchError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchClient();
                        }
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
                        setSearchError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchClient();
                        }
                      }}
                      className="w-full bg-deep border border-gray-600 rounded-lg p-3 text-white focus:border-electric outline-none"
                    />
                  </div>
                </div>

                {searchError && (
                  <div className="mt-4 p-3 rounded-lg flex items-start gap-2 text-sm bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearchClient(e);
                  }}
                  disabled={isLoading || !searchPhone.ddd || !searchPhone.number}
                  className="w-full mt-6 bg-electric hover:bg-electric/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      <span>Buscar Cliente</span>
                    </>
                  )}
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
                Criar Reserva sem cliente
              </button>
            </div>
          )}

          {/* STEP: FORM */}
          {step === 'form' && (
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Info Cliente vinculado */}
                {!isAnonymous && clientData && (
                  <div className="flex items-center gap-3 p-3 bg-electric/10 border border-electric/20 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-electric text-white flex items-center justify-center font-bold">
                      {clientData.nome ? clientData.nome.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{clientData.nome || 'Cliente Identificado'}</p>
                      <p className="text-electric text-xs">{searchPhone.ddd} {searchPhone.number}</p>
                    </div>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/20 uppercase font-bold">Vinculado</span>
                  </div>
                )}

                {/* Badge anonymous com telefone */}
                {isAnonymous && searchPhone.ddd && searchPhone.number && (
                  <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                    <AlertCircle size={18} className="text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-amber-300 font-bold text-sm">Cliente n&atilde;o encontrado</p>
                      <p className="text-amber-400/70 text-xs">Telefone ({searchPhone.ddd}) {searchPhone.number} ser&aacute; cadastrado ao confirmar.</p>
                    </div>
                  </div>
                )}

                {/* Nome */}
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

                {/* Telefone (visible when anonymous and no phone from search) */}
                {isAnonymous && !searchPhone.number && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Telefone (Opcional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-500" size={18} />
                      <input
                        {...register('telefone')}
                        placeholder="DDD + Número (ex: 11999999999)"
                        className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Se informado, o cliente será cadastrado automaticamente.</p>
                  </div>
                )}

                {/* Data e Período */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Data</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-gray-500" size={18} />
                      <input
                        type="date"
                        min={localToday()}
                        {...register('data_reserva', { required: true })}
                        className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Período</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 text-gray-500 pointer-events-none" size={18} />
                      <select
                        {...register('horario', { required: true })}
                        className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Selecione...</option>
                        <option value="Almoço">Almoço (12h - 15h)</option>
                        <option value="A noite">Jantar (19h - 23h)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Availability feedback */}
                {checkingAvailability && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verificando disponibilidade...</span>
                  </div>
                )}
                {availabilityError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                    <span className="text-red-400 text-sm font-medium">{availabilityError}</span>
                  </div>
                )}

                {/* Pessoas */}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Adultos</label>
                     <div className="relative">
                       <Users className="absolute left-3 top-3 text-gray-500" size={18} />
                       <input
                         type="number" min={1}
                         {...register('adultos', { required: true, min: 1, valueAsNumber: true })}
                         className="w-full bg-dark border border-gray-700 rounded-xl pl-10 p-3 text-white focus:border-electric outline-none"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Crianças</label>
                     <input
                       type="number" min={0}
                       {...register('criancas', { valueAsNumber: true })}
                       className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white focus:border-electric outline-none"
                     />
                   </div>
                </div>

                {/* Aniversário */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark/50 border border-gray-700">
                    <input
                        type="checkbox"
                        id="bday-manual"
                        {...register('aniversario')}
                        className="w-5 h-5 rounded bg-dark border-gray-600 text-pink-500 focus:ring-0"
                    />
                    <label htmlFor="bday-manual" className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                        <Cake size={16} className="text-pink-500"/> É aniversário?
                    </label>
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
                   <button type="button" onClick={() => { setStep('search'); setAvailabilityError(""); }} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5">
                     Voltar
                   </button>
                   <button
                     type="submit"
                     disabled={isLoading || !!availabilityError || checkingAvailability}
                     className="flex-[2] bg-electric hover:bg-electric/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-electric/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isLoading ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}
                   </button>
                </div>
             </form>
          )}

          {/* STEP: SUCCESS */}
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
