"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'confirmar' | 'cancelar';
}

export function SuccessDialog({
  isOpen,
  onClose,
  action
}: SuccessDialogProps) {
  if (!isOpen) return null;

  const isConfirmar = action === 'confirmar';
  const title = isConfirmar ? 'Reserva Confirmada!' : 'Reserva Cancelada!';
  const message = isConfirmar 
    ? 'A reserva foi confirmada com sucesso. Uma mensagem foi enviada ao cliente.'
    : 'A reserva foi cancelada com sucesso. Uma mensagem foi enviada ao cliente.';

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

              {/* Action Button */}
              <button
                onClick={onClose}
                className={`w-full font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isConfirmar
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

