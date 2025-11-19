
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, X, Armchair } from 'lucide-react';

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tableName: string) => void;
  currentTable?: string | null;
  customerName?: string;
}

const TableSelectionModal: React.FC<TableSelectionModalProps> = ({ 
    isOpen, onClose, onSave, currentTable, customerName 
}) => {
  const [tableName, setTableName] = useState('');

  useEffect(() => {
    if (isOpen) {
        setTableName(currentTable || '');
    }
  }, [isOpen, currentTable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tableName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
       <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
       />

       <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#1A2025] border border-gray-800 rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-2xl"
       >
           <div className="p-5 border-b border-gray-800 bg-[#151a1f] flex justify-between items-center">
               <h3 className="font-bold text-white flex items-center gap-2">
                   <MapPin size={18} className="text-electric"/> Selecionar Mesa
               </h3>
               <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
           </div>

           <form onSubmit={handleSubmit} className="p-6">
               <p className="text-sm text-gray-400 mb-4">
                   Defina onde <strong className="text-white">{customerName || 'o cliente'}</strong> irá se sentar.
               </p>

               <div className="relative mb-6">
                   <Armchair size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                   <input 
                      autoFocus
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="Ex: Mesa 04 ou VIP-2"
                      className="w-full bg-dark border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-lg text-white focus:border-electric outline-none font-bold"
                   />
               </div>

               <div className="flex gap-3">
                   <button 
                      type="button"
                      onClick={onClose}
                      className="px-4 py-3 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors font-medium"
                   >
                      Cancelar
                   </button>
                   <button 
                      type="submit"
                      disabled={!tableName.trim()}
                      className="flex-1 bg-electric hover:bg-electric/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-electric/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      Salvar Mesa
                   </button>
               </div>
           </form>
       </motion.div>
    </div>
  );
};

export default TableSelectionModal;
