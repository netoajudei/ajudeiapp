import SettingsPage from '@/components/dashboard/SettingsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}

