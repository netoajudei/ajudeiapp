

"use client";

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bot,
  ExternalLink,
  PlayCircle,
  ScrollText,
  Clock,
  PartyPopper,
  PlusCircle,
  BarChart3
} from 'lucide-react';
import { authService } from '../../services/authService';
import NewReservationModal from './NewReservationModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const SidebarItem = ({ icon: Icon, label, path, isActive, onClick }: any) => (
  <Link 
    to={path} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
      isActive 
        ? 'bg-electric text-white shadow-lg shadow-electric/20 font-medium' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: CalendarDays, label: 'Reservas do Dia', path: '/dashboard' }, // Reservas agora é a home do dashboard
    { icon: BarChart3, label: 'Métricas', path: '/dashboard/metrics' },
    { icon: Users, label: 'Clientes', path: '/dashboard/clientes' },
    { icon: Clock, label: 'Horários', path: '/dashboard/horarios' },
    { icon: PartyPopper, label: 'Eventos', path: '/dashboard/eventos' },
    { icon: ScrollText, label: 'Regras de Reserva', path: '/dashboard/regras' },
    { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
  ];

  // UUID de teste fixo do MOCK_CLIENTES no publicService
  const testUuid = "e5002036-ec86-401a-9741-d3557c823f87"; 

  return (
    <div className="min-h-screen bg-dark flex">
      
      {/* Modal de Nova Reserva (Global) */}
      <NewReservationModal 
        isOpen={isNewReservationModalOpen} 
        onClose={() => setIsNewReservationModalOpen(false)} 
      />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-deep border-r border-gray-800 z-50 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-display font-bold text-xl">
            <div className="w-8 h-8 bg-electric rounded-lg flex items-center justify-center">
              <Bot size={20} />
            </div>
            Restaurante<span className="text-electric">IA</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Quick Action Button */}
          <button
            onClick={() => {
                setIsNewReservationModalOpen(true);
                setIsSidebarOpen(false);
            }}
            className="w-full mb-6 bg-gradient-to-r from-electric to-cyan-500 hover:shadow-[0_0_20px_rgba(34,147,221,0.3)] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all group"
          >
             <PlusCircle className="group-hover:rotate-90 transition-transform duration-300" size={20} />
             Nova Reserva
          </button>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu</div>
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}

          {/* Botão Temporário de Teste */}
          <div className="mt-8 px-2">
             <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dev Tools</div>
             <Link 
                to={`/reserva/${testUuid}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-blue-300 hover:bg-white/10 hover:text-blue-200 transition-all border border-blue-500/20"
             >
                <PlayCircle size={18} />
                <span className="text-sm">Simular Reserva</span>
             </Link>
          </div>

        </div>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full"
          >
            <LogOut size={20} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-deep border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-30">
           <div className="font-bold text-white">Painel</div>
           <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2">
             <Menu size={24} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 max-w-7xl mx-auto">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;