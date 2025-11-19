
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  X, Search, User, Phone, Calendar, Clock, 
  Users, MessageSquare, Loader2, CheckCircle2, AlertCircle, Cake
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { reservationService } from '../../services/reservationService';
import { Cliente, CreateReservationPayload } from '../../types';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'search' | 'form' | 'success';

interface SearchFormData {
  ddd: string;
  phone: string;
}

interface ReservationFormData {
  date: string;
  time: string;
  adults: number;
  children: number;
  name: string;
  observations: string;
  isBirthday: boolean;
}

const NewReservationModal: React.FC<NewReservationModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [foundClient, setFoundClient] = useState<Cliente | null>(null);
  const [searchError, setSearchError] = useState(false);
  
  // Forms
  const searchForm = useForm<SearchFormData>();
  const reservationForm = useForm<ReservationFormData>({
    defaultValues: {
      adults: 2,
      children: 0,
      date: new Date().toISOString().split('T')[0], // Hoje
      isBirthday: false
    }
  });

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep('search');
      setFoundClient(null);
      setSearchError(false);
      searchForm.reset();
      reservationForm.reset({
        adults: 2,
        children: 0,
        date: new Date().toISOString().split('T')[0],
        isBirthday: false,
        name: "",
        observations: "",
        time: ""
      });
    }
  }, [isOpen]);

  const handleSearch = async (data: SearchFormData) => {
    setIsLoading(true);
    setSearchError(false);
    try {
      const client = await customerService.searchByPhone(data.ddd, data.phone);
      if (client) {
        setFoundClient(client);
        // Pre-fill name
        reservationForm.setValue('name', client.nome || '');
      } else {
        setFoundClient(null);
        setSearchError(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToForm = (mode: 'found' | 'anonymous') => {
    if (mode === 'anonymous') {
        setFoundClient(null);
        reservationForm.setValue('name', '');
    }
    setStep('form');
  };

  const handleSubmitReservation = async (data: ReservationFormData) => {
    setIsLoading(true);
    try {
      const payload: CreateReservationPayload = {
        empresa_id: 101, // Mock ID
        nome: data.name,
        data_reserva: data.date,
        horario: data.time,
        adultos: Number(data.adults),
        criancas: Number(data.children),
        observacoes: data.observations,
        aniversario: data.isBirthday,
        telefone: foundClient ? foundClient.chatId || undefined : undefined
      };

      await reservationService.createReservation(payload);
      setStep('success');
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error(error);
      alert("Erro ao criar reserva");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1A2025] border border-gray-800 rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#151a1f]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-electric" size={20} />
            Nova Reserva
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
            <X size={24}/>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SEARCH */}
            {step === 'search' && (
              <motion.div 
                key="search"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-4 text-electric border border-electric/20">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Buscar Cliente</h3>
                  <p className="text-gray-400 text-sm">Digite o telefone para encontrar o cadastro.</p>
                </div>

                <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-20">
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">DDD</label>
                      <input 
                        {...searchForm.register('ddd', { required: true, maxLength: 2 })}
                        className="w-full bg-dark border border-gray-700 rounded-xl px-3 py-3 text-center text-white focus:border-electric outline-none"
                        placeholder="11"
                        maxLength={2}
                        autoFocus
                      />
                    </div>
                    <div className="flex-1">
                       <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Celular</label>
                       <input 
                        {...searchForm.register('phone', { required: true })}
                        className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                        placeholder="99999-9999"
                       />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-electric hover:bg-electric/90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Buscar Cliente'}
                  </button>
                </form>

                {/* Results Area */}
                {foundClient && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                        {foundClient.nome?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-bold">{foundClient.nome}</div>
                        <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 size={10}/> Cliente Encontrado</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleProceedToForm('found')}
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                    >
                      Selecionar
                    </button>
                  </motion.div>
                )}

                {searchError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                      <AlertCircle size={18} /> Cliente não encontrado
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Nenhum cadastro com este número.</p>
                    <button 
                      onClick={() => handleProceedToForm('anonymous')}
                      className="w-full bg-dark border border-gray-600 hover:border-gray-400 text-white py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      Criar Reserva Anônima / Novo Cliente
                    </button>
                  </motion.div>
                )}
                
                {!foundClient && !searchError && (
                   <div className="pt-4 border-t border-gray-800 text-center">
                      <button 
                         onClick={() => handleProceedToForm('anonymous')}
                         className="text-sm text-gray-500 hover:text-white underline decoration-gray-700 hover:decoration-white transition-all"
                      >
                         Pular busca (Reserva Rápida)
                      </button>
                   </div>
                )}

              </motion.div>
            )}

            {/* STEP 2: FORM */}
            {step === 'form' && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                 <form onSubmit={reservationForm.handleSubmit(handleSubmitReservation)} className="space-y-5">
                    
                    {/* Nome (Se foundClient, readonly ou prefilled) */}
                    <div>
                       <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Nome do Cliente</label>
                       <div className="relative">
                          <User size={18} className="absolute left-3 top-3 text-gray-500" />
                          <input 
                            {...reservationForm.register('name', { required: true })}
                            className="w-full bg-dark border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-electric outline-none"
                            placeholder="Nome completo"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Data</label>
                          <div className="relative">
                            <Calendar size={18} className="absolute left-3 top-3 text-gray-500" />
                            <input 
                              type="date"
                              {...reservationForm.register('date', { required: true })}
                              className="w-full bg-dark border border-gray-700 rounded-xl pl-10 pr-2 py-3 text-white focus:border-electric outline-none text-sm"
                            />
                          </div>
                       </div>
                       <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Horário</label>
                          <div className="relative">
                            <Clock size={18} className="absolute left-3 top-3 text-gray-500" />
                            <input 
                              type="time"
                              {...reservationForm.register('time', { required: true })}
                              className="w-full bg-dark border border-gray-700 rounded-xl pl-10 pr-2 py-3 text-white focus:border-electric outline-none text-sm"
                            />
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5 flex items-center gap-2"><Users size={14}/> Adultos</label>
                          <input 
                            type="number"
                            {...reservationForm.register('adults', { required: true, min: 1 })}
                            className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5 flex items-center gap-2">Crianças</label>
                          <input 
                            type="number"
                            {...reservationForm.register('children')}
                            className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                          />
                       </div>
                    </div>

                    {/* Checkbox Birthday */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-dark/50 border border-gray-700">
                        <input 
                            type="checkbox" 
                            id="bday"
                            {...reservationForm.register('isBirthday')}
                            className="w-5 h-5 rounded bg-dark border-gray-600 text-pink-500 focus:ring-0"
                        />
                        <label htmlFor="bday" className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                            <Cake size={16} className="text-pink-500"/> É aniversário?
                        </label>
                    </div>

                    <div>
                       <label className="block text-xs font-medium text-gray-500 uppercase mb-1.5">Observações</label>
                       <div className="relative">
                          <MessageSquare size={18} className="absolute left-3 top-3 text-gray-500" />
                          <textarea 
                            {...reservationForm.register('observations')}
                            rows={2}
                            className="w-full bg-dark border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-electric outline-none resize-none"
                            placeholder="Ex: Mesa canto, cadeira alta..."
                          />
                       </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                       <button 
                         type="button"
                         onClick={() => setStep('search')}
                         className="px-4 py-3 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                       >
                         Voltar
                       </button>
                       <button 
                         type="submit"
                         disabled={isLoading}
                         className="flex-1 bg-electric hover:bg-electric/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-electric/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}
                       </button>
                    </div>
                 </form>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 text-green-400 border border-green-500/40">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Sucesso!</h2>
                <p className="text-gray-400">A reserva foi criada e já consta no painel.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default NewReservationModal;
