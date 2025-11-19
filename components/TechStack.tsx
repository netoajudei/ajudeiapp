"use client";

import React from 'react';
import { TECH_STACK } from '../constants';
import { Link2 } from 'lucide-react';

const Integrations = () => {
  return (
    <div className="py-10 bg-deep border-y border-gray-800 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-6 text-center">
         <div className="inline-flex items-center gap-2 text-gray-500 text-sm font-mono uppercase tracking-widest">
            <Link2 size={14} /> Integração total com suas plataformas
         </div>
      </div>
      
      <div className="flex relative w-full overflow-hidden">
         <div className="flex animate-infinite-scroll whitespace-nowrap gap-12 px-6">
             {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((tech, i) => (
                 <div key={i} className="flex items-center gap-2 text-gray-400 font-mono text-lg">
                     <span className="w-2 h-2 bg-electric rounded-full"></span>
                     {tech}
                 </div>
             ))}
         </div>
      </div>
      
      {/* Tailwind hack for infinite scroll animation */}
      <style>{`
        @keyframes infinite-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-33.33%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Integrations;