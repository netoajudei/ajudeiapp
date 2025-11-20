"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ConfirmReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'confirmar' | 'cancelar';
  isLoading?: boolean;
}

export function ConfirmReservationDialog({
  isOpen,
  onClose,
  onConfirm,
  action,
  isLoading = false
}: ConfirmReservationDialogProps) {
  if (!isOpen) return null;

  const isConfirmar = action === 'confirmar';
  const title = isConfirmar ? 'Confirmar Reserva' : 'Cancelar Reserva';
  const message = isConfirmar 
    ? 'Tem certeza que deseja confirmar esta reserva? Uma mensagem será enviada ao cliente.'
    : 'Tem certeza que deseja cancelar esta reserva? Uma mensagem será enviada ao cliente.';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-deep border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isConfirmar 
                    ? 'bg-green-500/10 border-2 border-green-500/30' 
                    : 'bg-red-500/10 border-2 border-red-500/30'
                }`}>
                  {isConfirmar ? (
                    <CheckCircle2 size={32} className="text-green-400" />
                  ) : (
                    <XCircle size={32} className="text-red-400" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-gray-400 text-center mb-6">
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 bg-dark border border-gray-700 text-gray-300 hover:bg-gray-800 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isConfirmar
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processando...
                    </>
                  ) : (
                    <>
                      {isConfirmar ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      {isConfirmar ? 'Confirmar' : 'Cancelar'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

