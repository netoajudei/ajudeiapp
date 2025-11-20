import OperatingPeriodsPage from '@/components/dashboard/OperatingPeriodsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function OperatingPeriods() {
  return (
    <ProtectedRoute>
      <OperatingPeriodsPage />
    </ProtectedRoute>
  );
}
