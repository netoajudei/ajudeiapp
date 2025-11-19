
"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import ReservationCard from './dashboard/ReservationCard';
import DateSummaryRow from './dashboard/DateSummaryRow';
import TableSelectionModal from './dashboard/TableSelectionModal';
import { reservationService } from '../services/reservationService';
import { Reserva, DashboardSummary, DateSummary } from '../types';
import { CalendarCheck, Users, Loader2, RefreshCw, Filter, ArrowLeft, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabMode = 'today' | 'all';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('today');
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // Stores 'YYYY-MM-DD' when drilling down
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [todayReservations, setTodayReservations] = useState<Reserva[]>([]);
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [detailedReservations, setDetailedReservations] = useState<Reserva[]>([]);
  
  const [summary, setSummary] = useState<DashboardSummary>({ total_reservas: 0, total_convidados: 0 });

  // Modal State
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [selectedReservaForTable, setSelectedReservaForTable] = useState<Reserva | null>(null);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [todayData, sumData] = await Promise.all([
        reservationService.getReservas('today'),
        reservationService.getSummary('today')
      ]);
      setTodayReservations(todayData);
      setSummary(sumData);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDateSummaries = async () => {
    setIsLoading(true);
    try {
        const data = await reservationService.getDateSummaries();
        setDateSummaries(data);
    } finally {
        setIsLoading(false);
    }
  };

  const loadDetailedReservations = async (date: string) => {
      setIsLoading(true);
      try {
          const data = await reservationService.getReservas(date);
          setDetailedReservations(data);
      } finally {
          setIsLoading(false);
      }
  };

  // Initial Load
  useEffect(() => {
    if (activeTab === 'today') {
        loadInitialData();
    } else if (activeTab === 'all' && !selectedDate) {
        loadDateSummaries();
    }
  }, [activeTab, selectedDate]);

  // Handle Tab Switching
  const handleTabChange = (mode: TabMode) => {
      setActiveTab(mode);
      setSelectedDate(null); // Reset drill-down when switching tabs
      setDetailedReservations([]);
  };

  // Handle Drill Down
  const handleDateClick = (date: string) => {
      setSelectedDate(date);
      loadDetailedReservations(date);
  };

  const handleBackToOverview = () => {
      setSelectedDate(null);
      setDetailedReservations([]);
  };

  const refreshCurrentView = () => {
      if (activeTab === 'today') loadInitialData();
      else if (selectedDate) loadDetailedReservations(selectedDate);
      else loadDateSummaries();
  };

  // Table Assignment Logic
  const handleOpenTableModal = (reserva: Reserva) => {
      setSelectedReservaForTable(reserva);
      setTableModalOpen(true);
  };

  const handleSaveTable = async (tableName: string) => {
      if (!selectedReservaForTable) return;
      
      // Call service
      await reservationService.updateTable(selectedReservaForTable.id, tableName);
      
      // Close modal
      setTableModalOpen(false);
      setSelectedReservaForTable(null);
      
      // Refresh data (Optimistic update or full refresh)
      refreshCurrentView();
  };

  return (
    <DashboardLayout>
      
      {/* Table Selection Modal */}
      <TableSelectionModal 
         isOpen={tableModalOpen}
         onClose={() => setTableModalOpen(false)}
         onSave={handleSaveTable}
         currentTable={selectedReservaForTable?.mesa}
         customerName={selectedReservaForTable?.nome || ''}
      />

      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-3">
               {selectedDate ? (
                   <button onClick={handleBackToOverview} className="hover:bg-white/10 p-2 rounded-full transition-colors -ml-2">
                       <ArrowLeft />
                   </button>
               ) : null}
               {selectedDate 
                 ? `Reservas de ${selectedDate.split('-')[2]}/${selectedDate.split('-')[1]}`
                 : 'Painel de Reservas'
               }
            </h1>
            <p className="text-gray-400">
                {selectedDate 
                 ? 'Detalhes das reservas para esta data específica.' 
                 : 'Gerencie as reservas e atribua mesas para hoje.'
                }
            </p>
          </div>
          
          {!selectedDate && (
            <div className="flex items-center gap-2 bg-deep border border-gray-800 p-1 rounded-xl">
                <button
                onClick={() => handleTabChange('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'today' ? 'bg-electric text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
                >
                Hoje
                </button>
                <button
                onClick={() => handleTabChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'all' ? 'bg-electric text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
                >
                Futuras
                </button>
            </div>
          )}
        </div>

        {/* Stats Cards - Só mostra na visão geral ou hoje, oculta no drill down para focar na lista */}
        {!selectedDate && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-electric/20 to-deep border border-electric/20 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CalendarCheck size={48} />
                </div>
                <div className="text-gray-400 text-sm font-medium mb-1">Total Reservas</div>
                <div className="text-3xl md:text-4xl font-display font-bold text-white">
                {activeTab === 'all' ? dateSummaries.reduce((acc, curr) => acc + curr.total_reservas, 0) : summary.total_reservas}
                </div>
                <div className="text-xs text-electric mt-2 font-medium bg-electric/10 inline-block px-2 py-0.5 rounded">
                {activeTab === 'today' ? 'Para hoje' : 'Próximos dias'}
                </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-deep border border-cyan-500/20 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={48} />
                </div>
                <div className="text-gray-400 text-sm font-medium mb-1">Total Pessoas</div>
                <div className="text-3xl md:text-4xl font-display font-bold text-white">
                {activeTab === 'all' ? dateSummaries.reduce((acc, curr) => acc + curr.total_convidados, 0) : summary.total_convidados}
                </div>
                <div className="text-xs text-cyan-400 mt-2 font-medium bg-cyan-400/10 inline-block px-2 py-0.5 rounded">
                Expectativa de público
                </div>
            </div>
            </div>
        )}

        {/* Content Area */}
        <div className="space-y-6 min-h-[400px]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {activeTab === 'today' && 'Agenda de Hoje'}
              {activeTab === 'all' && !selectedDate && 'Próximas Datas'}
              {selectedDate && 'Lista de Reservas'}
              {isLoading && <Loader2 size={16} className="animate-spin text-gray-500" />}
            </h2>
            <button onClick={refreshCurrentView} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={18} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-6"
                >
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                ))}
                </motion.div>
            ) : (
                <motion.div
                    key={selectedDate ? 'detail' : activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {/* VIEW: HOJE (With Table Action) */}
                    {activeTab === 'today' && todayReservations.length > 0 && (
                        todayReservations.map((reserva, index) => (
                            <ReservationCard 
                                key={reserva.id} 
                                reserva={reserva} 
                                delay={index * 0.05} 
                                showTableAction={true}
                                onAssignTable={handleOpenTableModal}
                            />
                        ))
                    )}

                    {activeTab === 'today' && todayReservations.length === 0 && (
                        <EmptyState message="Nenhuma reserva para hoje." />
                    )}

                    {/* VIEW: TODAS AS DATAS (Lista de Resumos) */}
                    {activeTab === 'all' && !selectedDate && dateSummaries.length > 0 && (
                        dateSummaries.map((summary, index) => (
                            <DateSummaryRow 
                                key={`${summary.date}-${summary.period}`} 
                                summary={summary} 
                                onClick={() => handleDateClick(summary.date)}
                                delay={index * 0.05}
                            />
                        ))
                    )}

                    {activeTab === 'all' && !selectedDate && dateSummaries.length === 0 && (
                         <EmptyState message="Nenhuma data futura encontrada." />
                    )}

                    {/* VIEW: DRILL DOWN (Reservas Específicas - No Table Action here by default, but could add) */}
                    {selectedDate && detailedReservations.length > 0 && (
                        detailedReservations.map((reserva, index) => (
                            <ReservationCard key={reserva.id} reserva={reserva} delay={index * 0.05} />
                        ))
                    )}
                    
                    {selectedDate && detailedReservations.length === 0 && (
                        <EmptyState message="Nenhuma reserva encontrada nesta data." />
                    )}

                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
            <Filter size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Vazio</h3>
        <p className="text-gray-500">{message}</p>
    </div>
);

export default DashboardPage;
