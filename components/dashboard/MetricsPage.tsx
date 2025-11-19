
"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { metricsService, MetricsResponse } from '../../services/metricsService';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Loader2, TrendingUp, Users, MessageSquare, CalendarCheck, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricsPage = () => {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await metricsService.getMetrics();
        setData(result);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="animate-spin text-electric w-12 h-12" />
        </div>
      </DashboardLayout>
    );
  }

  // Custom Tooltip Style for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-deep/90 backdrop-blur border border-gray-700 p-4 rounded-xl shadow-xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                    <BarChart3 className="text-electric" />
                    Métricas de Desempenho
                </h1>
                <p className="text-gray-400">Análise detalhada de conversão, reservas e atendimento.</p>
            </div>
            <div className="bg-deep border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-500">
                Última atualização: Agora
            </div>
        </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard 
                title="Novos Clientes (7d)" 
                value={data.kpis.novos_clientes_7d} 
                icon={Users} 
                trend="+12%" 
                color="text-cyan-400"
                bg="bg-cyan-500/10"
            />
            <MetricCard 
                title="Total da Base" 
                value={data.kpis.total_clientes} 
                icon={Users} 
                trend="Total" 
                color="text-blue-400"
                bg="bg-blue-500/10"
            />
            <MetricCard 
                title="Mensagens Hoje" 
                value={data.kpis.mensagens_hoje} 
                icon={MessageSquare} 
                trend="+5%" 
                color="text-green-400"
                bg="bg-green-500/10"
            />
            <MetricCard 
                title="Reservas Hoje" 
                value={data.last7Days[data.last7Days.length-1].reservas || 0} 
                icon={CalendarCheck} 
                trend="--%" 
                color="text-electric"
                bg="bg-electric/10"
            />
        </div>

        {/* ROW 1: Last 7 Days (Bar Chart) */}
        <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <CalendarCheck size={20} className="text-electric"/>
                Reservas & Convidados (Últimos 7 dias)
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.last7Days}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                        <YAxis stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="reservas" name="Reservas" fill="#2293DD" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="convidados" name="Convidados" fill="#00D4FF" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* ROW 2: Last 30 Days (Wide Bar Chart) */}
        <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-cyan-400"/>
                Fluxo Mensal (Últimos 30 dias)
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.last30Days}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" tick={{fill: '#999', fontSize: 10}} interval={2} axisLine={false} />
                        <YAxis stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Bar dataKey="reservas" stackId="a" name="Reservas" fill="#2293DD" />
                        <Bar dataKey="convidados" stackId="a" name="Convidados" fill="#00D4FF" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* ROW 3: 12 Month Trends (Line Chart) */}
        <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <CalendarCheck size={20} className="text-purple-400"/>
                    Crescimento Anual (Reservas)
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.last12Months}>
                            <defs>
                                <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                            <YAxis stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="reservas" stroke="#8884d8" fillOpacity={1} fill="url(#colorReservas)" />
                            <Area type="monotone" dataKey="convidados" stroke="#82ca9d" fillOpacity={0.1} fill="#82ca9d" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <MessageSquare size={20} className="text-green-400"/>
                    Volume de Mensagens (12 Meses)
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.last12Months}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                            <YAxis stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="mensagens" stroke="#4ade80" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>

        {/* ROW 4: Customer Acquisition & Messages (7 days) */}
        <div className="grid lg:grid-cols-2 gap-6">
             <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Users size={20} className="text-pink-400"/>
                    Aquisição de Clientes (7 Dias)
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.last7Days}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                            <YAxis stroke="#666" tick={{fill: '#999'}} axisLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="novos_clientes" name="Novos Clientes" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </section>

             <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6">
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <MessageSquare size={20} className="text-yellow-400"/>
                    Mensagens Trocadas (7 Dias)
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.last7Days} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                            <XAxis type="number" stroke="#666" tick={{fill: '#999'}} axisLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#666" tick={{fill: '#999'}} axisLine={false} width={40} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="mensagens" name="Mensagens" fill="#facc15" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </section>
        </div>

      </div>
    </DashboardLayout>
  );
};

const MetricCard = ({ title, value, icon: Icon, trend, color, bg }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-deep/60 border border-gray-800 p-6 rounded-2xl relative overflow-hidden"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>
                <Icon size={20} />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded bg-white/5 ${color}`}>{trend}</span>
        </div>
        <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
    </motion.div>
);

export default MetricsPage;
