"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Empresa, Cliente, Reserva } from '../../types';
import { 
  Calendar, Clock, Users, CheckCircle2, XCircle, 
  MapPin, Edit2, AlertTriangle, Loader2, HelpCircle
} from 'lucide-react';
import { reservationApiService } from '../../services/reservationApiService';
import { EditReservationModal } from './EditReservationModal';

interface ClientReservationDetailsProps {
  empresa: Empresa;
  cliente: Cliente;
  reserva: any; // Usando any pois o retorno do RPC pode variar ligeiramente do tipo Reserva estrito
  onRefresh: () => void; // Callback para recarregar os dados após ação
}

export const ClientReservationDetails = ({ 
  empresa, 
  cliente, 
  reserva,
  onRefresh
}: ClientReservationDetailsProps) => {
  const [loadingAction, setLoadingAction] = useState<'confirmar' | 'cancelar' | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const themeColor = empresa.cor || '#3B82F6'; // Fallback blue

  const handleAction = async (acao: 'confirmar_dia_reserva' | 'cancelar') => {
    setLoadingAction(acao === 'confirmar_dia_reserva' ? 'confirmar' : 'cancelar');
    
    try {
      // Usar o serviço existente para chamar a Edge Function
      const result = await reservationApiService.gerenciarReservaLink({
        cliente_uuid: cliente.uuid_identificador || reserva.cliente_uuid, // Fallback se não vier no cliente
        acao: acao
      });

      if (result.success) {
        alert(acao === 'cancelar' ? 'Reserva cancelada com sucesso.' : 'Presença confirmada com sucesso!');
        onRefresh(); // Recarrega a tela para atualizar o status
      } else {
        throw new Error(result.error || 'Erro ao processar solicitação.');
      }
    } catch (error: any) {
      console.error(`Erro ao ${acao}:`, error);
      alert(`Não foi possível completar a ação: ${error.message}`);
    } finally {
      setLoadingAction(null);
      setShowCancelConfirm(false);
      setShowConfirmDialog(false);
    }
  };

  const isConfirmed = reserva.confirmada_dia_reserva === true;
  const isCanceled = reserva.status === 'cancelada' || reserva.cancelada_cliente === true;

  // Formatação de data
  const dataFormatada = new Date(reserva.data_reserva).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Define cores baseadas no status ou no tema
  const statusColor = isCanceled ? '#EF4444' : isConfirmed ? '#22C55E' : themeColor;

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
              <p className="text-xs text-gray-400">Minha Reserva</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              {cliente.nome?.charAt(0)}
            </div>
            <span className="text-xs font-medium text-gray-600 hidden sm:block">Olá, {cliente.nome?.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 pb-20">
        
        {/* Status Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center p-6 rounded-2xl border"
          style={{ 
            backgroundColor: `${statusColor}10`, // 10% opacity
            borderColor: `${statusColor}30`      // 30% opacity
          }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg bg-white"
            style={{ color: statusColor }}
          >
            {isCanceled ? <XCircle size={32} /> : isConfirmed ? <CheckCircle2 size={32} /> : <Calendar size={32} />}
          </div>
          
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: statusColor }}
          >
            {isCanceled 
              ? 'Reserva Cancelada' 
              : isConfirmed 
                ? 'Presença Confirmada!' 
                : 'Reserva Agendada'}
          </h2>
          
          <p className="text-gray-600 text-sm max-w-[250px] mx-auto">
            {isCanceled 
              ? 'Esta reserva foi cancelada.' 
              : isConfirmed 
                ? 'Aguardamos você na data e horário marcados.' 
                : 'Sua reserva está ativa. Por favor, confirme sua presença no dia.'}
          </p>
        </motion.div>

        {/* Details Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden mb-8"
        >
          <div className="p-6 space-y-6">
            
            {/* Data e Hora */}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0"
                style={{ color: themeColor }} // Ícone com a cor da marca
              >
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Quando</p>
                <p className="font-bold text-gray-900 capitalize">{dataFormatada}</p>
                <p className="text-sm text-gray-500">
                  {reserva.horario} • {parseInt(reserva.horario) < 18 ? 'Almoço' : 'Jantar'}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Pessoas */}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0"
                style={{ color: themeColor }}
              >
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Mesa para</p>
                <p className="font-bold text-gray-900">
                  {reserva.adultos + (reserva.criancas || 0)} Pessoas
                </p>
                <p className="text-sm text-gray-500">
                  {reserva.adultos} Adultos
                  {reserva.criancas > 0 && `, ${reserva.criancas} Crianças`}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Local */}
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0"
                style={{ color: themeColor }}
              >
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Onde</p>
                <p className="font-bold text-gray-900">{empresa.fantasia}</p>
                <p className="text-sm text-gray-500">Ver localização no mapa</p>
              </div>
            </div>

          </div>
          
          {/* Footer com ID */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400 font-mono">ID: #{reserva.id}</span>
            <span 
              className="text-xs font-medium px-2 py-1 rounded bg-white border"
              style={{ 
                borderColor: `${statusColor}40`,
                color: statusColor,
                backgroundColor: `${statusColor}10`
              }}
            >
              {isConfirmed ? 'Confirmado' : 'Pendente'}
            </span>
          </div>
        </motion.div>

        {/* Actions Buttons */}
        {!isCanceled && (
          <div className="space-y-3">
            
            {!isConfirmed && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowConfirmDialog(true)}
                disabled={loadingAction !== null}
                className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: '#22C55E', // Verde fixo para confirmar sucesso
                  boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)' 
                }}
              >
                {loadingAction === 'confirmar' ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                Confirmar Presença Agora
              </motion.button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowEditModal(true)}
                className="py-3 px-4 rounded-xl border border-gray-200 font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={18} />
                Editar
              </button>

              <button 
                onClick={() => setShowCancelConfirm(true)}
                disabled={loadingAction !== null}
                className="py-3 px-4 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle size={18} />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Confirm Presence Modal */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4 mx-auto">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Confirmar Presença?</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                Ao confirmar, garantimos sua mesa. Caso não possa comparecer, por favor nos avise.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => handleAction('confirmar_dia_reserva')}
                  disabled={loadingAction !== null}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                   {loadingAction === 'confirmar' ? <Loader2 className="animate-spin" size={18} /> : 'Sim, Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Cancelar Reserva?</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                Tem certeza que deseja cancelar sua reserva? Essa ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => handleAction('cancelar')}
                  disabled={loadingAction !== null}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                   {loadingAction === 'cancelar' ? <Loader2 className="animate-spin" size={18} /> : 'Sim, Cancelar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Modal */}
        <EditReservationModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentReservation={reserva}
          clienteUuid={cliente.uuid_identificador || reserva.cliente_uuid}
          empresaId={empresa.id}
          onSuccess={() => {
            setShowEditModal(false);
            onRefresh();
          }}
        />

      </main>
    </div>
  );
};
