import EventsPage from '@/components/dashboard/EventsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Eventos() {
  return (
    <ProtectedRoute>
      <EventsPage />
    </ProtectedRoute>
  );
}

