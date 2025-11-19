

"use client";

import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import ReservationFlow from './components/reservation/ReservationFlow';
import RulesPage from './components/dashboard/RulesPage';
import OperatingPeriodsPage from './components/dashboard/OperatingPeriodsPage';
import EventsPage from './components/dashboard/EventsPage';
import SettingsPage from './components/dashboard/SettingsPage';
import MetricsPage from './components/dashboard/MetricsPage';
import ReservationDetailsPage from './components/dashboard/ReservationDetailsPage';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Default Dashboard agora é Reservas (DashboardPage) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Métricas agora em rota específica */}
        <Route path="/dashboard/metrics" element={<MetricsPage />} />
        
        {/* Sub-rotas */}
        <Route path="/dashboard/reservas/:id" element={<ReservationDetailsPage />} />
        <Route path="/dashboard/clientes" element={<DashboardPage />} />
        
        {/* Rotas Dedicadas */}
        <Route path="/dashboard/regras" element={<RulesPage />} />
        <Route path="/dashboard/horarios" element={<OperatingPeriodsPage />} />
        <Route path="/dashboard/eventos" element={<EventsPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />

        {/* Rota Pública de Reserva */}
        <Route path="/reserva/:uuid" element={<ReservationFlow />} />
      </Routes>
    </HashRouter>
  );
};

export default App;