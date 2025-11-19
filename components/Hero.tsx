"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, Zap } from 'lucide-react';
import { Section } from './ui/Section';

const Hero = () => {
  return (
    <Section className="min-h-screen flex items-center pt-32 pb-20 relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,147,221,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric/10 border border-electric/20 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-electric animate-pulse"></span>
            <span className="text-electric text-sm font-medium tracking-wider uppercase">Nova IA v2.0 Disponível</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight text-white">
            Seu restaurante <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric to-cyan-400">nunca dorme</span>.
            <br />
            Seu atendimento não deveria.
          </h1>

          <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
            IA que converte leads em mesas lotadas. 24/7. Automático. Humanizado.
            Pare de perder dinheiro de madrugada.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,147,221,0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-electric hover:bg-electric/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Testar gratuitamente
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-transparent border border-gray-700 hover:border-electric text-white font-bold rounded-xl transition-all"
            >
              Ver demonstração
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-800/50">
            <div>
              <div className="text-3xl font-display font-bold text-white">300+</div>
              <div className="text-sm text-gray-500">msg/dia</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-electric">0.8s</div>
              <div className="text-sm text-gray-500">tempo resp.</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-cyan-400">40%</div>
              <div className="text-sm text-gray-500">↑ reservas</div>
            </div>
          </div>
        </motion.div>

        {/* Right Visual - 3D Chat Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
          animate={{ opacity: 1, scale: 1, rotateY: -5 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative hidden lg:block perspective-1000 group"
        >
          <div className="relative w-[380px] mx-auto h-[700px] bg-deep rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden transform transition-transform duration-700 group-hover:rotate-y-0 group-hover:scale-105">
             {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>
            
            {/* Screen Header */}
            <div className="bg-[#075E54] p-4 pt-10 flex items-center gap-3 z-10 relative shadow-lg">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <MessageCircle size={24} />
              </div>
              <div>
                <div className="text-white font-bold">Restaurante Bot</div>
                <div className="text-green-200 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Online 24/7
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="bg-[#0d141c] h-full p-4 space-y-4 relative">
                <div className="opacity-10 absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>
                
                {/* Messages */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="bg-[#1F2C34] p-3 rounded-lg rounded-tl-none max-w-[85%] self-start ml-0 relative z-10"
                >
                    <p className="text-white text-sm">Olá! Bem-vindo ao <b>Gastrô Tech</b>. Gostaria de ver nosso cardápio ou fazer uma reserva?</p>
                    <span className="text-[10px] text-gray-400 block text-right mt-1">19:42</span>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="bg-[#005C4B] p-3 rounded-lg rounded-tr-none max-w-[85%] ml-auto relative z-10"
                >
                    <p className="text-white text-sm">Quero reservar uma mesa para 2 pessoas hoje.</p>
                    <span className="text-[10px] text-green-200 block text-right mt-1">19:43</span>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 }}
                    className="bg-[#1F2C34] p-3 rounded-lg rounded-tl-none max-w-[85%] self-start ml-0 relative z-10"
                >
                    <p className="text-white text-sm">Perfeito! Tenho horários disponíveis às 20:00 e 20:30. Qual prefere?</p>
                    <span className="text-[10px] text-gray-400 block text-right mt-1">19:43</span>
                </motion.div>

                 {/* Typing Indicator */}
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4, repeat: Infinity, repeatType: "reverse" }}
                    className="bg-[#005C4B] w-16 p-2 rounded-full ml-auto flex gap-1 justify-center items-center relative z-10"
                 >
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-200"></div>
                 </motion.div>
            </div>
          </div>

          {/* Floating Badges */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-10 top-1/3 bg-deep/80 backdrop-blur-md border border-electric/30 p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <Zap className="text-yellow-400 fill-yellow-400" />
            <div>
                <div className="font-bold text-white">Instantâneo</div>
                <div className="text-xs text-gray-400">Resposta em 0.8s</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Section>
  );
};

export default Hero;