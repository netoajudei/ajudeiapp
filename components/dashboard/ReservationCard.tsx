
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Cake, CheckCircle2, MessageSquare, AlertCircle, ChevronRight, MapPin, Edit3 } from 'lucide-react';
import { Reserva } from '../../types';

interface ReservationCardProps {
  reserva: Reserva;
  delay?: number;
  onAssignTable?: (reserva: Reserva) => void;
  showTableAction?: boolean;
}

const ReservationCard: React.FC<ReservationCardProps> = ({ reserva, delay = 0, onAssignTable, showTableAction = false }) => {
  const totalPessoas = reserva.adultos + reserva.criancas;
  
  // Logic for status icon
  const isConfirmed = reserva.confirmada_dia_reserva;
  const isCanceled = reserva.status === 'cancelada';
  
  return (
    <Link to={`/dashboard/reservas/${reserva.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ scale: 1.01, x: 4 }}
        className={`
          bg-deep/60 backdrop-blur-md border rounded-2xl p-5 transition-all group relative overflow-hidden cursor-pointer
          ${isCanceled ? 'border-red-900/30 opacity-60' : 'border-gray-800 hover:border-electric/30 hover:bg-deep/80'}
        `}
      >
        {/* Status Indicator Strip */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCanceled ? 'bg-red-500' : isConfirmed ? 'bg-green-500' : 'bg-yellow-500'}`} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
          {/* Left: Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className={`font-bold text-lg truncate ${isCanceled ? 'text-gray-500 line-through' : 'text-white'}`}>{reserva.nome}</h3>
              {reserva.aniversario && (
                <span className="bg-pink-500/10 text-pink-400 p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium border border-pink-500/20" title="Aniversariante">
                  <Cake size={14} />
                </span>
              )}
              {isConfirmed ? (
                <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-green-500/20">
                  <CheckCircle2 size={12} /> Confirmada
                </span>
              ) : isCanceled ? (
                 <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-red-500/20">
                  <AlertCircle size={12} /> Cancelada
                </span>
              ) : (
                <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-yellow-500/20">
                  <Clock size={12} /> Pendente
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-electric" />
                  <span className="font-semibold text-white bg-white/5 px-1.5 py-0.5 rounded">{reserva.horario}</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-electric" />
                  <span>{totalPessoas} ({reserva.adultos}A + {reserva.criancas}C)</span>
              </div>
            </div>
          </div>

          {/* Middle: Special Table Action for Today */}
          {showTableAction && (
              <div className="flex items-center md:justify-center my-2 md:my-0">
                  <button
                     onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if(onAssignTable) onAssignTable(reserva);
                     }}
                     className={`
                        w-full md:w-auto flex items-center justify-center gap-3 px-4 py-2.5 md:py-2 rounded-xl border transition-all group/table
                        ${reserva.mesa 
                           ? 'bg-electric/10 border-electric/30 text-electric hover:bg-electric/20' 
                           : 'bg-dark/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                        }
                     `}
                  >
                      <div className="flex flex-col items-start">
                          <span className="text-[10px] uppercase font-bold opacity-70">Mesa</span>
                          <div className="flex items-center gap-2">
                              <MapPin size={16} />
                              <span className="font-bold text-sm">
                                  {reserva.mesa || 'Definir'}
                              </span>
                          </div>
                      </div>
                      <div className="h-6 w-[1px] bg-current opacity-20 mx-1 hidden md:block"></div>
                      <Edit3 size={14} className="opacity-50 group-hover/table:opacity-100 ml-auto md:ml-0" />
                  </button>
              </div>
          )}

          {/* Right: Obs & Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between md:justify-end gap-4 mt-1 md:mt-0 w-full md:w-auto">
            {reserva.observacoes && (
              <div className="bg-dark/50 p-3 rounded-lg border border-gray-800 w-full md:w-auto md:max-w-xs">
                  <div className="flex items-start gap-2">
                      <MessageSquare size={14} className="text-electric mt-0.5 shrink-0" />
                      <p className="text-gray-300 text-xs italic line-clamp-2 md:line-clamp-1">
                          {reserva.observacoes}
                      </p>
                  </div>
              </div>
            )}
            
            {/* Chevron hidden on mobile to save space, usually card click is implied */}
            <div className="text-gray-500 group-hover:text-white transition-colors ml-auto hidden md:block">
               <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ReservationCard;
