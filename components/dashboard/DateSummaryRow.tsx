import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Users, Sun, Moon } from 'lucide-react';
import { DateSummary } from '../../types';

interface DateSummaryRowProps {
  summary: DateSummary;
  onClick: () => void;
  delay?: number;
}

const DateSummaryRow: React.FC<DateSummaryRowProps> = ({ summary, onClick, delay = 0 }) => {
  const isNight = summary.period.toLowerCase() === 'noite' || summary.period.toLowerCase() === 'jantar';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="group bg-deep/40 backdrop-blur-sm border border-gray-800/50 hover:bg-deep/80 hover:border-electric/50 rounded-xl p-4 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
    >
      {/* Hover Effect Background */}
      <div className="absolute inset-0 bg-electric/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-4 relative z-10">
        {/* Date Badge */}
        <div className="bg-dark/50 border border-gray-700 rounded-lg p-2 text-center min-w-[60px]">
            <div className="text-xs text-gray-400 uppercase font-bold">{summary.date.split('-')[1]}/{summary.date.split('-')[0].slice(2)}</div>
            <div className="text-xl font-bold text-white">{summary.date.split('-')[2]}</div>
        </div>

        <div>
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{summary.weekday}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isNight 
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                    : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                }`}>
                    {isNight ? <Moon size={10} /> : <Sun size={10} />}
                    {summary.period}
                </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
                Visão geral do dia
            </p>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 relative z-10">
        <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Reservas</div>
            <div className="font-display font-bold text-xl text-white flex items-center justify-end gap-2">
                {summary.total_reservas}
            </div>
        </div>

        <div className="text-right">
             <div className="text-xs text-gray-500 mb-1">Pessoas</div>
             <div className="font-display font-bold text-xl text-white flex items-center justify-end gap-2">
                <Users size={16} className="text-electric" />
                {summary.total_convidados}
             </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-electric group-hover:text-white transition-colors">
            <ChevronRight size={18} />
        </div>
      </div>
    </motion.div>
  );
};

export default DateSummaryRow;