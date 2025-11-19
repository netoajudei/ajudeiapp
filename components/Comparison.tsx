import React from 'react';
import { Section } from './ui/Section';
import { Check, X } from 'lucide-react';

const Comparison = () => {
  return (
    <Section className="bg-dark">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
          Atendimento Tradicional vs <span className="text-electric">RestauranteIA</span>
        </h2>
      </div>

      <div className="max-w-5xl mx-auto bg-deep rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
        <div className="grid grid-cols-2">
          {/* Header */}
          <div className="p-8 border-b border-gray-800 bg-red-500/5 text-center">
            <h3 className="text-xl font-bold text-red-400">Sem nossa IA</h3>
          </div>
          <div className="p-8 border-b border-gray-800 bg-electric/5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-electric text-xs font-bold text-white px-3 py-1 rounded-bl-lg">RECOMENDADO</div>
            <h3 className="text-xl font-bold text-electric">Com nossa IA</h3>
          </div>

          {/* Row 1 */}
          <div className="p-6 border-r border-b border-gray-800 flex items-center gap-4 text-gray-400">
            <X className="text-red-500 shrink-0" /> Resposta em horas
          </div>
          <div className="p-6 border-b border-gray-800 flex items-center gap-4 text-white bg-electric/5 font-medium">
            <Check className="text-electric shrink-0" /> Resposta em segundos
          </div>

          {/* Row 2 */}
          <div className="p-6 border-r border-b border-gray-800 flex items-center gap-4 text-gray-400">
            <X className="text-red-500 shrink-0" /> Perde leads de madrugada
          </div>
          <div className="p-6 border-b border-gray-800 flex items-center gap-4 text-white bg-electric/5 font-medium">
            <Check className="text-electric shrink-0" /> Converte 24/7
          </div>

          {/* Row 3 */}
          <div className="p-6 border-r border-b border-gray-800 flex items-center gap-4 text-gray-400">
             <X className="text-red-500 shrink-0" /> Reservas no caderno
          </div>
          <div className="p-6 border-b border-gray-800 flex items-center gap-4 text-white bg-electric/5 font-medium">
             <Check className="text-electric shrink-0" /> Sistema digital + confirmação
          </div>

           {/* Row 4 */}
           <div className="p-6 border-r border-gray-800 flex items-center gap-4 text-gray-400">
             <X className="text-red-500 shrink-0" /> Custo de funcionário
          </div>
          <div className="p-6 flex items-center gap-4 text-white bg-electric/5 font-medium">
             <Check className="text-electric shrink-0" /> 1/10 do custo
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Comparison;