"use client";

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ChatPage from '@/components/dashboard/ChatPage';

export default function ChatRoute() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ChatPage />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
