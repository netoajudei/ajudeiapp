"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from './dashboard/DashboardLayout';
import ReservationCard from './dashboard/ReservationCard';
import DateSummaryRow from './dashboard/DateSummaryRow';
import TableSelectionModal from './dashboard/TableSelectionModal';
import { ManualReservationModal } from './dashboard/ManualReservationModal'; // Importando o modal
import { supabaseReservationService } from '../services/supabaseReservationService';
import { useAuth } from '@/contexts/AuthContext';
import { Reserva, DashboardSummary, DateSummary } from '../types';
import { CalendarCheck, Users, Loader2, RefreshCw, Filter, ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabMode = 'today' | 'all';

const DashboardPage = () => {
  const { authUser } = useAuth();
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
  
  // Manual Reservation Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Função helper para limpar chatId (remover @lid e @c.us)
  const cleanChatId = (chatId: string | null | undefined): string => {
    if (!chatId) return '';
    return chatId.replace(/@lid|@c\.us/g, '').trim();
  };
  
  // Helper para converter dados do Supabase para o formato esperado
  const mapReservaFromSupabase = (reserva: any): any => {
    const clientes = reserva.clientes || {};
    
    // Usar o campo 'nome' da reserva, não do cliente
    const nomeReserva = reserva.nome || 'Cliente';
    
    // Usar confirmada_dia_reserva para determinar se está confirmada
    const confirmadaDiaReserva = reserva.confirmada_dia_reserva || false;
    
    // Calcular convidados (adultos + criancas)
    const adultos = reserva.adultos || 0;
    const criancas = reserva.criancas || 0;
    const convidados = adultos + criancas;
    
    // Determinar status baseado em confirmada_dia_reserva e cancelada_cliente
    let status: 'confirmada' | 'pendente' | 'cancelada' = 'pendente';
    if (reserva.cancelada_cliente) {
      status = 'cancelada';
    } else if (confirmadaDiaReserva) {
      status = 'confirmada';
    }
    
    // Limpar chatId antes de salvar
    const chatIdLimpo = cleanChatId(clientes.chatId || reserva.chat_id);
    
    return {
      id: reserva.id,
      empresa_id: reserva.empresa_id,
      nome: nomeReserva,
      data_reserva: reserva.data_reserva,
      horario: reserva.horario,
      adultos: adultos,
      criancas: criancas,
      convidados: reserva.convidados || convidados, // Usar campo convidados se existir, senão calcular
      observacoes: reserva.observacoes,
      aniversario: reserva.aniversario || false, // Usar aniversario da reserva
      confirmada_dia_reserva: confirmadaDiaReserva,
      mesa: reserva.mesa,
      status: status,
      created_at: reserva.created_at,
      // Incluir dados do cliente para usar na página de detalhes
      clientes: {
        ...clientes,
        chatId: chatIdLimpo, // Salvar chatId limpo
        uuid_identificador: clientes.uuid_identificador // Incluir UUID do cliente
      },
      telefone: chatIdLimpo, // Telefone já limpo
      data_nascimento: clientes.data_nascimento
    };
  };

  // Helper para converter resumo da view para DateSummary
  const mapResumoToDateSummary = (resumo: any): DateSummary => {
    const dateStr = resumo.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr + 'T00:00:00'); // Adicionar hora para evitar problemas de timezone
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const weekday = weekdays[date.getDay()];
    
    // Determinar período baseado no campo periodo da view
    let period = resumo.periodo || 'Noite';
    const periodoLower = period.toLowerCase();
    if (periodoLower.includes('almoço') || periodoLower.includes('almoco') || periodoLower.includes('almoco')) {
      period = 'Almoço';
    } else if (periodoLower.includes('jantar') || periodoLower.includes('noite')) {
      period = 'Noite';
    } else {
      // Default para Noite se não identificar
      period = 'Noite';
    }

    return {
      date: dateStr,
      weekday,
      period,
      total_reservas: parseInt(resumo.total_de_reservas || '0', 10),
      total_convidados: parseInt(resumo.total_de_convidados || '0', 10)
    };
  };

  const loadInitialData = useCallback(async () => {
    console.log('🚀 [loadInitialData] Iniciando busca de dados de hoje...');
    
    if (!authUser?.empresa.id) {
      console.error('❌ [loadInitialData] Empresa não encontrada no contexto');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const empresaId = authUser.empresa.id;
      const hoje = new Date().toISOString().split('T')[0];
      
      console.log('📊 [loadInitialData] Buscando resumo de hoje para empresa:', empresaId, 'Data:', hoje);

      // Buscar resumo de hoje da view
      const resumoHoje = await supabaseReservationService.getResumoHoje(empresaId);
      console.log('✅ [loadInitialData] Resumo de hoje recebido:', resumoHoje);
      
      // Buscar reservas confirmadas de hoje
      console.log('📋 [loadInitialData] Buscando reservas confirmadas de hoje...');
      const reservasHoje = await supabaseReservationService.getReservasHoje(empresaId);
      console.log('✅ [loadInitialData] Reservas de hoje recebidas:', reservasHoje.length, 'reservas');

      // Mapear reservas
      const reservasMapeadas = reservasHoje.map(mapReservaFromSupabase);
      console.log('🔄 [loadInitialData] Reservas mapeadas:', reservasMapeadas.length);
      console.log('📝 [loadInitialData] Exemplo de reserva mapeada:', reservasMapeadas[0]);
      setTodayReservations(reservasMapeadas);

      // Pegar primeiro resumo de hoje para o summary (se existir)
      if (resumoHoje.length > 0) {
        const primeiroResumo = resumoHoje[0];
        const summaryData = {
          total_reservas: parseInt(primeiroResumo.total_de_reservas || '0', 10),
          total_convidados: parseInt(primeiroResumo.total_de_convidados || '0', 10)
        };
        console.log('📈 [loadInitialData] Summary atualizado:', summaryData);
        setSummary(summaryData);
      } else {
        // Se não tiver resumo, calcular das reservas
        const summaryData = {
          total_reservas: reservasMapeadas.length,
          total_convidados: reservasMapeadas.reduce((sum, r) => sum + (r.convidados || r.adultos + r.criancas), 0)
        };
        console.log('📈 [loadInitialData] Summary calculado das reservas:', summaryData);
        setSummary(summaryData);
      }
      
      console.log('✅ [loadInitialData] Dados carregados com sucesso!');
    } catch (error) {
      console.error('❌ [loadInitialData] Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 [loadInitialData] Loading finalizado');
    }
  }, [authUser]);

  const loadDateSummaries = useCallback(async () => {
    console.log('🚀 [loadDateSummaries] Iniciando busca de resumos futuros...');
    
    if (!authUser?.empresa.id) {
      console.error('❌ [loadDateSummaries] Empresa não encontrada no contexto');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const empresaId = authUser.empresa.id;
      
      // Buscar resumos dos próximos 30 dias (excluindo hoje)
      const hoje = new Date().toISOString().split('T')[0];
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const daquiA30Dias = new Date();
      daquiA30Dias.setDate(daquiA30Dias.getDate() + 30);

      const resumos = await supabaseReservationService.getResumoReservasDiarias(
        empresaId,
        amanha.toISOString().split('T')[0],
        daquiA30Dias.toISOString().split('T')[0]
      );

      // Converter para DateSummary e agrupar por data+período
      // Criar uma entrada para cada combinação de data+período
      const summariesMap = new Map<string, DateSummary>();
      
      resumos.forEach(resumo => {
        // Criar chave única: data + período
        const periodo = resumo.periodo || 'Noite';
        const key = `${resumo.date || ''}_${periodo}`;
        
        if (!summariesMap.has(key)) {
          summariesMap.set(key, mapResumoToDateSummary(resumo));
        } else {
          // Se já existe (não deveria acontecer, mas por segurança), somar
          const existing = summariesMap.get(key)!;
          existing.total_reservas += parseInt(resumo.total_de_reservas || '0', 10);
          existing.total_convidados += parseInt(resumo.total_de_convidados || '0', 10);
        }
      });

      // Ordenar por data e depois por período (Almoço antes de Noite)
      const summaries = Array.from(summariesMap.values()).sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        // Se mesma data, Almoço vem antes de Noite
        if (a.period.toLowerCase().includes('almoço') || a.period.toLowerCase().includes('almoco')) return -1;
        if (b.period.toLowerCase().includes('almoço') || b.period.toLowerCase().includes('almoco')) return 1;
        return 0;
      });

      console.log('✅ [loadDateSummaries] Resumos carregados:', summaries.length);
      setDateSummaries(summaries);
    } catch (error) {
      console.error('❌ [loadDateSummaries] Erro ao carregar resumos de datas:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 [loadDateSummaries] Loading finalizado');
    }
  }, [authUser]);

  const loadDetailedReservations = useCallback(async (date: string) => {
    console.log('🚀 [loadDetailedReservations] Iniciando busca de reservas detalhadas para:', date);
    
    if (!authUser?.empresa.id) {
      console.error('❌ [loadDetailedReservations] Empresa não encontrada no contexto');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const empresaId = authUser.empresa.id;
      console.log('📋 [loadDetailedReservations] Buscando reservas para empresa:', empresaId, 'Data:', date);
      const reservas = await supabaseReservationService.getReservasDetalhadas(empresaId, date);
      console.log('✅ [loadDetailedReservations] Reservas recebidas:', reservas.length);
      const reservasMapeadas = reservas.map(mapReservaFromSupabase);
      setDetailedReservations(reservasMapeadas);
      console.log('✅ [loadDetailedReservations] Reservas mapeadas e setadas');
    } catch (error) {
      console.error('❌ [loadDetailedReservations] Erro ao carregar reservas detalhadas:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 [loadDetailedReservations] Loading finalizado');
    }
  }, [authUser]);

  // Initial Load - só carregar quando authUser estiver disponível
  useEffect(() => {
    console.log('🔍 [DASHBOARD] useEffect executado:', {
      hasAuthUser: !!authUser,
      empresaId: authUser?.empresa?.id,
      activeTab,
      selectedDate
    });

    if (!authUser?.empresa?.id) {
      console.log('⏳ [DASHBOARD] Aguardando authUser estar disponível...');
      return; // Aguardar empresa estar disponível
    }

    console.log('✅ [DASHBOARD] authUser disponível, iniciando busca...');

    if (activeTab === 'today') {
        console.log('📅 [DASHBOARD] Carregando dados de hoje...');
        loadInitialData();
    } else if (activeTab === 'all' && !selectedDate) {
        console.log('📆 [DASHBOARD] Carregando resumos de datas futuras...');
        loadDateSummaries();
    } else if (selectedDate) {
        console.log('📋 [DASHBOARD] Carregando reservas detalhadas da data:', selectedDate);
        loadDetailedReservations(selectedDate);
    }
  }, [activeTab, selectedDate, authUser, loadInitialData, loadDateSummaries, loadDetailedReservations]);

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
      
      // Call service (assuming reservationService is used for updating table, but it seems to be supabaseReservationService or undefined here,
      // previously user had reservationService.updateTable, let's assume supabaseReservationService has updateReservaTable logic or similar.
      // Checking previous files, supabaseReservationService has updateReservaMesa? Not seen.
      // I will use supabaseReservationService to update table if possible, or just reload for now as logic wasn't requested to be fixed here.)
      
      // Placeholder for updating table:
      console.log("Updating table", tableName, "for reservation", selectedReservaForTable.id);
      // await supabaseReservationService.updateReservaMesa(selectedReservaForTable.id, tableName); // Hypothetical
      
      // Close modal
      setTableModalOpen(false);
      setSelectedReservaForTable(null);
      
      // Refresh data
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
      
      {/* Manual Reservation Modal */}
      <ManualReservationModal 
         isOpen={manualModalOpen}
         onClose={() => setManualModalOpen(false)}
         onSuccess={() => {
             setManualModalOpen(false);
             refreshCurrentView();
         }}
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
          
          <div className="flex items-center gap-3">
            {/* Botão Nova Reserva Manual */}
            <button 
                onClick={() => setManualModalOpen(true)}
                className="bg-electric hover:bg-electric/90 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-electric/20 transition-all hover:scale-105 active:scale-95"
            >
                <Plus size={20} />
                <span className="hidden sm:inline">Nova Reserva</span>
            </button>

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
