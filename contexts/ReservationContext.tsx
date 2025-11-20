"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Reserva } from '../types';

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
  };
}

interface ReservationContextType {
  selectedReservation: ExtendedReserva | null;
  setSelectedReservation: (reserva: ExtendedReserva | null) => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [selectedReservation, setSelectedReservation] = useState<ExtendedReserva | null>(null);

  return (
    <ReservationContext.Provider value={{ selectedReservation, setSelectedReservation }}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation deve ser usado dentro de um ReservationProvider');
  }
  return context;
}

