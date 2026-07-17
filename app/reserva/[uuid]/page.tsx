"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { publicService } from '@/services/publicService';
import { supabaseReservationService } from '@/services/supabaseReservationService';
import ReservationFlow from '@/components/reservation/ReservationFlow';
import { ClientReservationDetails } from '@/components/reservation/ClientReservationDetails';
import { Empresa, Cliente, PublicReservationData } from '@/types';

type PublicEmpresa = PublicReservationData['empresa'];
type PublicCliente = PublicReservationData['cliente'];

interface ReservationFlowPageProps {
  params: {
    uuid: string;
  };
}

export default function ReservationFlowPage({ params }: ReservationFlowPageProps) {
  const { uuid } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [empresa, setEmpresa] = useState<PublicEmpresa | null>(null);
  const [cliente, setCliente] = useState<PublicCliente | null>(null);
  const [activeReservation, setActiveReservation] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    if (!uuid) {
      setError("Link inválido.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 1. Buscar dados básicos (Empresa + Cliente) via Public Service
      const publicData = await publicService.getDataByUuid(uuid);
      
      // Logs para debug
      console.log('📦 [ReservationPage] Dados públicos carregados:', {
        empresa: publicData.empresa?.fantasia,
        cliente: publicData.cliente?.nome,
        uuid_cliente: publicData.cliente?.uuid_identificador
      });

      setEmpresa(publicData.empresa);
      setCliente(publicData.cliente);

      // 2. Verificar se existe reserva ativa para este cliente
      console.log('🔍 [ReservationPage] Verificando reserva ativa para:', uuid);
      try {
        const rpcResponse = await supabaseReservationService.buscarReservaAtivaCliente(uuid);
        
        console.log('📦 [ReservationPage] Retorno da RPC de busca de reserva:', rpcResponse);

        // Ajuste para lidar com a estrutura { reserva: {...}, reserva_encontrada: boolean }
        if (rpcResponse && rpcResponse.reserva_encontrada === true && rpcResponse.reserva) {
          console.log('✅ [ReservationPage] Reserva ativa confirmada:', rpcResponse.reserva.id);
          setActiveReservation(rpcResponse.reserva);
        } else {
          console.log('ℹ️ [ReservationPage] Nenhuma reserva ativa encontrada (reserva_encontrada = false ou nulo).');
          setActiveReservation(null);
        }
      } catch (reservaError) {
        console.warn('⚠️ [ReservationPage] Erro ao verificar reserva ativa (assumindo nova reserva):', reservaError);
        setActiveReservation(null);
      }

    } catch (err: any) {
      console.error('❌ [ReservationPage] Erro fatal:', err);
      setError("Não foi possível carregar os dados. Verifique se o link está correto.");
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tela de Carregamento (Splash)
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center shadow-xl border border-gray-100 overflow-hidden">
            {empresa?.logo ? (
               <img src={empresa.logo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
               <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            )}
          </div>
        </motion.div>
        <h2 className="text-gray-400 text-sm font-medium tracking-widest uppercase animate-pulse">
          Carregando informações...
        </h2>
      </div>
    );
  }

  // Tela de Erro
  if (error || !empresa || !cliente) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
          <User size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Link Inválido ou Expirado</h2>
        <p className="text-gray-500 max-w-xs mx-auto">{error || "Não foi possível identificar o cliente."}</p>
      </div>
    );
  }

  // Decisão de Renderização
  if (activeReservation) {
    // Fluxo 1: Cliente JÁ TEM reserva ativa -> Mostrar Detalhes
    return (
      <ClientReservationDetails 
        empresa={empresa} 
        cliente={cliente} 
        reserva={activeReservation}
        onRefresh={loadData}
      />
    );
  } else {
    // Fluxo 2: Cliente NÃO TEM reserva -> Mostrar Fluxo de Criação
    // Passamos initialData para evitar recarregamento e garantir estilização imediata
    return (
      <ReservationFlow 
        uuid={uuid} 
        initialData={{ empresa, cliente }} 
      />
    );
  }
}
