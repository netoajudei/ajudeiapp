import MetricsPage from '@/components/dashboard/MetricsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Metrics() {
  return (
    <ProtectedRoute>
      <MetricsPage />
    </ProtectedRoute>
  );
}

