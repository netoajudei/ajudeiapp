"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import { ReservationProvider } from '@/contexts/ReservationContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReservationProvider>
        {children}
      </ReservationProvider>
    </AuthProvider>
  );
}

