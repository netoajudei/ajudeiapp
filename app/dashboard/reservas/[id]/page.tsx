"use client";

import ReservationDetailsPage from '@/components/dashboard/ReservationDetailsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface ReservationDetailsProps {
  params: {
    id: string;
  };
}

export default function ReservationDetails({ params }: ReservationDetailsProps) {
  const { id } = params;
  
  console.log('🔍 [PAGE] ReservationDetails page renderizado com ID:', id);
  
  return (
    <ProtectedRoute>
      <ReservationDetailsPage reservationId={id} />
    </ProtectedRoute>
  );
}

