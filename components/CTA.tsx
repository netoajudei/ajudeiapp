"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, Zap } from 'lucide-react';
import { Section } from './ui/Section';

type FormData = {
  name: string;
  whatsapp: string;
  restaurantName: string;
  type: string;
  consent: boolean;
};

const FinalCTA = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
    alert("Obrigado! Em breve entraremos em contato.");
  };

  return (
    <Section className="bg-gradient-to-t from-electric/20 to-dark relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
      
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        
        {/* Text Side */}
        <div>
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
            Pare de perder clientes enquanto <span className="text-electric">dorme</span>.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se aos restaurantes que já atendem 24/7, reduzem o no-show e faturam mais. Configuração em 48h.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-200">
              <div className="p-1 rounded-full bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
              <span>Sem contrato de fidelidade</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200">
               <div className="p-1 rounded-full bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
              <span>Suporte 100% em português</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200">
               <div className="p-1 rounded-full bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
              <span>Setup rápido em 48h</span>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative"
        >
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full text-sm shadow-lg transform rotate-3 flex items-center gap-1">
                <Zap size={16} /> Setup Expresso
            </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
              <input 
                {...register("name", { required: true })}
                className="w-full bg-dark/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-all"
                placeholder="Seu nome"
              />
              {errors.name && <span className="text-red-400 text-xs">Campo obrigatório</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
              <input 
                {...register("whatsapp", { required: true })}
                className="w-full bg-dark/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-all"
                placeholder="(00) 00000-0000"
              />
              {errors.whatsapp && <span className="text-red-400 text-xs">Campo obrigatório</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Restaurante</label>
              <input 
                {...register("restaurantName", { required: true })}
                className="w-full bg-dark/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-all"
                placeholder="Ex: Restaurante Sabor"
              />
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Restaurante</label>
               <select 
                {...register("type")}
                className="w-full bg-dark/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-all"
               >
                   <option value="alacarte">À la carte</option>
                   <option value="rodizio">Rodízio</option>
                   <option value="fastfood">Fast Food</option>
                   <option value="delivery">Delivery</option>
                   <option value="other">Outro</option>
               </select>
            </div>

            <div className="flex items-start gap-3 pt-2">
                <input 
                  type="checkbox" 
                  {...register("consent")}
                  className="mt-1 rounded bg-dark border-gray-700 text-electric focus:ring-offset-0"
                />
                <span className="text-xs text-gray-400">Aceito receber informações e propostas via WhatsApp.</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-electric to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-electric/25 hover:shadow-electric/40 transition-all"
            >
              Quero aumentar minhas vendas agora
            </motion.button>

            <div className="flex justify-center items-center gap-2 text-xs text-gray-500 mt-4">
                <Lock size={12} /> Seus dados estão seguros.
            </div>
          </form>
        </motion.div>
      </div>
    </Section>
  );
};

export default FinalCTA;