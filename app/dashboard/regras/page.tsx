import RulesPage from '@/components/dashboard/RulesPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Regras() {
  return (
    <ProtectedRoute>
      <RulesPage />
    </ProtectedRoute>
  );
}

