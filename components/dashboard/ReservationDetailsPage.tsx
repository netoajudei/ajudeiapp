
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from './DashboardLayout';
import { ConfirmReservationDialog } from './ConfirmReservationDialog';
import { SuccessDialog } from './SuccessDialog';
import { supabaseReservationService } from '../../services/supabaseReservationService';
import { reservationApiService } from '../../services/reservationApiService';
import { useAuth } from '@/contexts/AuthContext';
import { useReservation } from '@/contexts/ReservationContext';
import { Reserva } from '../../types';
import { 
  Loader2, ArrowLeft, Phone, Calendar, Clock, Users, 
  MessageSquare, CheckCircle2, XCircle, MessageCircle, 
  Cake, MapPin
} from 'lucide-react';

interface ReservationDetailsPageProps {
  reservationId: string;
}

// Tipo estendido para incluir campos do cliente
interface ExtendedReserva extends Reserva {
  telefone?: string;
  data_nascimento?: string;
  clientes?: {
    nome?: string;
    chatId?: string;
    foto?: string;
    aniversario?: boolean;
    telefone?: string;
    data_nascimento?: string;
    uuid_identificador?: string;
  };
}

const ReservationDetailsPage = ({ reservationId }: ReservationDetailsPageProps) => {
  const router = useRouter();
  const { authUser } = useAuth();
  const { selectedReservation, setSelectedReservation } = useReservation();
  
  const [reserva, setReserva] = useState<ExtendedReserva | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'confirmar' | 'cancelar' | null>(null);

  // Função helper para limpar chatId (remover @lid e @c.us)
  const cleanChatId = (chatId: string | null | undefined): string => {
    if (!chatId) return '';
    return chatId.replace(/@lid|@c\.us/g, '').trim();
  };

  // Função para mapear dados do Supabase ou contexto para o formato esperado
  const mapReservaFromSupabase = (reservaData: any): ExtendedReserva => {
    const clientes = reservaData.clientes || {};
    
    // Se já tiver os dados mapeados (vindo do contexto), retornar direto
    if (reservaData.status && reservaData.convidados !== undefined) {
      return reservaData as ExtendedReserva;
    }
    
    // Calcular convidados
    const adultos = reservaData.adultos || 0;
    const criancas = reservaData.criancas || 0;
    const convidados = reservaData.convidados || (adultos + criancas);
    
    // Determinar status
    let status: 'confirmada' | 'pendente' | 'cancelada' = 'pendente';
    if (reservaData.cancelada_cliente) {
      status = 'cancelada';
    } else if (reservaData.confirmada_dia_reserva) {
      status = 'confirmada';
    }
    
    return {
      id: reservaData.id,
      empresa_id: reservaData.empresa_id,
      nome: reservaData.nome || 'Cliente',
      data_reserva: reservaData.data_reserva,
      horario: reservaData.horario,
      adultos: adultos,
      criancas: criancas,
      convidados: convidados,
      observacoes: reservaData.observacoes,
      aniversario: reservaData.aniversario || false,
      confirmada_dia_reserva: reservaData.confirmada_dia_reserva || false,
      mesa: reservaData.mesa,
      status: status,
      created_at: reservaData.created_at,
      telefone: cleanChatId(clientes.chatId || reservaData.chat_id || reservaData.telefone), // Usar chatId do cliente ou chat_id da reserva ou telefone já mapeado (limpo)
      data_nascimento: clientes.data_nascimento || reservaData.data_nascimento,
      // Incluir dados completos do cliente incluindo uuid_identificador
      clientes: {
        ...clientes,
        uuid_identificador: clientes.uuid_identificador || reservaData.clientes?.uuid_identificador
      }
    };
  };

  useEffect(() => {
    console.log('🔄 [ReservationDetails] useEffect executado:', {
      reservationId,
      hasAuthUser: !!authUser,
      empresaId: authUser?.empresa?.id,
      hasSelectedReservation: !!selectedReservation,
      selectedReservationId: selectedReservation?.id
    });

    const load = async () => {
      if (!reservationId) {
        console.error('❌ [ReservationDetails] reservationId não fornecido');
        setIsLoading(false);
        return;
      }

      // PRIMEIRO: Verificar se já temos os dados no contexto
      if (selectedReservation && selectedReservation.id === Number(reservationId)) {
        console.log('✅ [ReservationDetails] Usando dados do contexto (já temos tudo!)');
        const reservaCompleta = mapReservaFromSupabase({
          ...selectedReservation,
          clientes: selectedReservation.clientes || {}
        });
        setReserva(reservaCompleta);
        setIsLoading(false);
        return;
      }

      // SEGUNDO: Se não tiver no contexto, buscar do Supabase
      if (!authUser?.empresa.id) {
        console.log('⏳ [ReservationDetails] Aguardando authUser estar disponível...');
        setIsLoading(false);
        return;
      }

      console.log('🔍 [ReservationDetails] Dados não estão no contexto, buscando do Supabase...');

      try {
        const empresaId = authUser.empresa.id;
        const reservaIdNum = Number(reservationId);
        
        console.log('🔍 [ReservationDetails] Iniciando busca no Supabase:', {
          reservationId,
          reservaIdNum,
          empresaId
        });

        const data = await supabaseReservationService.getReservaById(
          empresaId,
          reservaIdNum
        );
        
        console.log('✅ [ReservationDetails] Dados recebidos do Supabase:', data);
        
        if (!data) {
          console.error('❌ [ReservationDetails] Dados retornados são null/undefined');
          setReserva(null);
          return;
        }

        const reservaMapeada = mapReservaFromSupabase(data);
        console.log('✅ [ReservationDetails] Reserva mapeada com sucesso:', reservaMapeada);
        setReserva(reservaMapeada);
        
        // Salvar no contexto para próxima vez
        setSelectedReservation(reservaMapeada as any);
      } catch (e: any) {
        console.error('❌ [ReservationDetails] Erro ao buscar reserva:', e);
        console.error('❌ [ReservationDetails] Detalhes do erro:', {
          message: e.message,
          code: e.code,
          details: e.details,
          hint: e.hint,
          stack: e.stack
        });
        setReserva(null);
      } finally {
        setIsLoading(false);
        console.log('🏁 [ReservationDetails] Loading finalizado');
      }
    };
    
    load();
  }, [reservationId, authUser, selectedReservation, setSelectedReservation]);

  const handleStatusChangeClick = (status: 'confirmada' | 'cancelada') => {
    const acao = status === 'confirmada' ? 'confirmar' : 'cancelar';
    setPendingAction(acao);
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!reserva || !authUser?.empresa.id || !pendingAction) return;

    setIsProcessing(true);
    setDialogOpen(false);

    try {
      // Obter uuid_identificador do cliente
      const clienteUuid = reserva.clientes?.uuid_identificador;
      
      if (!clienteUuid) {
        throw new Error('UUID do cliente não encontrado. Não é possível processar a ação.');
      }

      console.log('🔄 [ReservationDetails] Processando ação:', {
        acao: pendingAction,
        clienteUuid,
        reservaId: reserva.id
      });

      // Chamar API externa
      // Se confirmar -> "confirmar_dia_reserva"
      // Se cancelar -> "cancelar"
      const acaoApi = pendingAction === 'confirmar' ? 'confirmar_dia_reserva' : 'cancelar';

      console.log('📤 [ReservationDetails] Enviando para API:', {
        cliente_uuid: clienteUuid,
        acao: acaoApi
      });

      const apiResult = await reservationApiService.gerenciarReservaLink({
        cliente_uuid: clienteUuid,
        acao: acaoApi
      });

      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Erro ao processar ação na API');
      }

      console.log('✅ [ReservationDetails] API chamada com sucesso:', apiResult);

      // Atualizar status no Supabase também
      const confirmada = pendingAction === 'confirmar';
      const cancelada = pendingAction === 'cancelar';
      
      await supabaseReservationService.updateReservaStatus(reserva.id, confirmada, cancelada);
      
      // Atualizar estado localmente sem buscar do servidor
      const reservaAtualizada: ExtendedReserva = {
        ...reserva,
        confirmada_dia_reserva: confirmada,
        status: cancelada ? 'cancelada' : (confirmada ? 'confirmada' : 'pendente')
      };
      
      setReserva(reservaAtualizada);
      
      // Atualizar no contexto também
      setSelectedReservation(reservaAtualizada as any);
      
      console.log('✅ [ReservationDetails] Status atualizado localmente com sucesso');
      
      // Mostrar diálogo de sucesso (não limpar pendingAction aqui, será limpo quando fechar o diálogo)
      setSuccessDialogOpen(true);
    } catch (error: any) {
      console.error('❌ [ReservationDetails] Erro ao processar ação:', error);
      setDialogOpen(false); // Fechar diálogo de confirmação em caso de erro
      alert(`Erro ao ${pendingAction === 'confirmar' ? 'confirmar' : 'cancelar'} reserva: ${error.message}`);
      setPendingAction(null); // Limpar apenas em caso de erro
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsApp = () => {
    if (!reserva?.telefone) return;
    // O telefone já está limpo (sem @lid e @c.us), só remover caracteres não numéricos
    const cleanPhone = reserva.telefone.replace(/\D/g, '');
    const message = `Olá ${reserva.nome.split(' ')[0]}, aqui é do restaurante. Sobre sua reserva para hoje às ${reserva.horario}...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="animate-spin text-electric w-12 h-12" />
        </div>
      </DashboardLayout>
    );
  }

  if (!reserva) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-white text-xl font-bold">Reserva não encontrada</h2>
          <button onClick={() => router.push('/dashboard')} className="mt-4 text-electric hover:underline">Voltar</button>
        </div>
      </DashboardLayout>
    );
  }

  const isConfirmed = reserva.status === 'confirmada';
  const isCanceled = reserva.status === 'cancelada';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-deep border border-gray-800 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
               Detalhes da Reserva
               <span className={`text-xs px-2 py-1 rounded-full border ${
                 isConfirmed ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                 isCanceled ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
               }`}>
                 {isConfirmed ? 'Confirmada' : isCanceled ? 'Cancelada' : 'Pendente'}
               </span>
             </h1>
             <p className="text-gray-400 text-sm">ID: #{reserva.id}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Left Column: Customer Profile */}
          <div className="md:col-span-1 space-y-6">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-deep/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-electric to-cyan-500"></div>
                
                <div className="w-24 h-24 rounded-full bg-dark border-2 border-electric p-1 mb-4">
                   <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-400">
                      {reserva.nome.charAt(0)}
                   </div>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-1">{reserva.nome}</h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                   <Phone size={14} /> {reserva.telefone}
                </div>

                {reserva.aniversario && (
                   <div className="w-full bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 mb-6 flex items-center justify-center gap-2 text-pink-400 text-sm">
                      <Cake size={16} /> Aniversariante
                      {reserva.data_nascimento && <span className="text-xs opacity-70">({new Date(reserva.data_nascimento).toLocaleDateString('pt-BR').slice(0,5)})</span>}
                   </div>
                )}

                <button 
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                >
                   <MessageCircle size={20} />
                   WhatsApp
                </button>
             </motion.div>

             {/* Stats Placeholder */}
             <div className="bg-deep/40 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Histórico</h3>
                <div className="flex justify-between text-sm border-b border-gray-800 pb-3 mb-3">
                   <span className="text-gray-500">Visitas</span>
                   <span className="text-white font-mono">12</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-800 pb-3 mb-3">
                   <span className="text-gray-500">Ticket Médio</span>
                   <span className="text-white font-mono">R$ 145</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-500">No-Shows</span>
                   <span className="text-white font-mono">0</span>
                </div>
             </div>
          </div>

          {/* Right Column: Reservation Details */}
          <div className="md:col-span-2 space-y-6">
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-deep/60 backdrop-blur-md border border-gray-800 rounded-2xl p-8"
             >
                <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-gray-800">Dados da Reserva</h3>
                
                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2"><Calendar size={14}/> Data</label>
                      <div className="text-xl text-white font-medium">
                         {new Date(reserva.data_reserva).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2"><Clock size={14}/> Horário</label>
                      <div className="text-xl text-white font-medium">
                         {reserva.horario}
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2"><Users size={14}/> Pessoas</label>
                      <div className="text-xl text-white font-medium">
                         {reserva.adultos + reserva.criancas} <span className="text-sm text-gray-500">({reserva.adultos}A + {reserva.criancas}C)</span>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2"><MapPin size={14}/> Mesa</label>
                      <div className="text-xl text-white font-medium">
                         {reserva.mesa || <span className="text-gray-600 italic">Automático</span>}
                      </div>
                   </div>
                </div>

                {reserva.observacoes && (
                   <div className="bg-dark/50 border border-gray-700 rounded-xl p-4">
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2"><MessageSquare size={14}/> Observações</label>
                      <p className="text-gray-300 italic">"{reserva.observacoes}"</p>
                   </div>
                )}
             </motion.div>

             {/* Actions Bar */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-4"
             >
                 {!isConfirmed && !isCanceled && (
                    <>
                       <button 
                          onClick={() => handleStatusChangeClick('confirmada')}
                          disabled={isProcessing}
                          className="bg-electric hover:bg-electric/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-electric/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                       >
                          {isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={20} />}
                          Confirmar Reserva
                       </button>
                       <button 
                          onClick={() => handleStatusChangeClick('cancelada')}
                          disabled={isProcessing}
                          className="bg-dark border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                       >
                          {isProcessing ? <Loader2 className="animate-spin"/> : <XCircle size={20} />}
                          Cancelar
                       </button>
                    </>
                 )}

                 {isConfirmed && (
                    <button 
                       onClick={() => handleStatusChangeClick('cancelada')}
                       disabled={isProcessing}
                       className="col-span-2 bg-dark border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                       <XCircle size={20} /> Cancelar Reserva Confirmada
                    </button>
                 )}
                 
                 {isCanceled && (
                    <button 
                       onClick={() => handleStatusChangeClick('confirmada')}
                       disabled={isProcessing}
                       className="col-span-2 bg-dark border border-electric/30 text-electric hover:bg-electric/10 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                       <CheckCircle2 size={20} /> Reativar Reserva
                    </button>
                 )}

             </motion.div>
          </div>

        </div>
      </div>

      {/* Dialog de Confirmação */}
      <ConfirmReservationDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmAction}
        action={pendingAction || 'confirmar'}
        isLoading={isProcessing}
      />

      {/* Dialog de Sucesso */}
      <SuccessDialog
        isOpen={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setPendingAction(null); // Limpar ação quando fechar o diálogo
          router.back(); // Navegar de volta para a página anterior
        }}
        action={pendingAction || 'confirmar'}
      />
    </DashboardLayout>
  );
};

export default ReservationDetailsPage;
