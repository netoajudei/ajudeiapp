"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { Section } from './ui/Section';
import { ChatMessage, RestaurantType } from '../types';

const SCRIPTS = {
  alacarte: [
    { sender: 'bot', text: 'Olá! Bem-vindo ao Le Gourmet. Como posso ajudar hoje?' },
    { sender: 'user', text: 'Vocês têm opções veganas no cardápio?' },
    { sender: 'bot', text: 'Sim! Temos um risoto de cogumelos trufado e uma lasanha de berinjela que são sucessos da casa. Gostaria de ver o menu completo?' },
    { sender: 'user', text: 'Quero reservar para 2 pessoas às 20h.' },
    { sender: 'bot', text: 'Verificando disponibilidade... ✅ Confirmado! Mesa para 2 pessoas às 20h hoje. Enviei os detalhes para seu email.' }
  ],
  rodizio: [
    { sender: 'bot', text: 'E aí! Tudo bem? Aqui é da Churrascaria Fogo Forte. 🍖' },
    { sender: 'user', text: 'Quanto custa o rodízio hoje?' },
    { sender: 'bot', text: 'Hoje (Sábado) o rodízio está R$ 89,90 por pessoa, incluindo buffet de saladas e sobremesa.' },
    { sender: 'user', text: 'Tem fila de espera?' },
    { sender: 'bot', text: 'No momento estamos com espera de 15 minutos. Quer entrar na fila virtual agora?' }
  ]
};

const ChatDemo = () => {
  const [activeType, setActiveType] = useState<RestaurantType>('alacarte');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setStep(0);
  }, [activeType]);

  useEffect(() => {
    const script = activeType === 'alacarte' ? SCRIPTS.alacarte : SCRIPTS.rodizio;
    
    if (step < script.length) {
      const currentMsg = script[step];
      let delay = 1000;
      
      if (currentMsg.sender === 'bot') {
        setIsTyping(true);
        delay = 2000; // Bot thinks longer
      } else {
        setIsTyping(false);
      }

      const timer = setTimeout(() => {
        setIsTyping(false);
        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: currentMsg.sender as 'bot' | 'user',
          text: currentMsg.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newMsg]);
        setStep(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [step, activeType]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <Section className="bg-gradient-to-b from-dark to-deep">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
          Veja a <span className="text-electric">mágica</span> acontecer
        </h2>
        <p className="text-gray-400">Escolha um tipo de restaurante e teste o atendimento</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => setActiveType('alacarte')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeType === 'alacarte' 
              ? 'bg-electric text-white shadow-lg shadow-electric/30' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Restaurante À La Carte
        </button>
        <button
          onClick={() => setActiveType('rodizio')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            activeType === 'rodizio' 
              ? 'bg-electric text-white shadow-lg shadow-electric/30' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Churrascaria / Rodízio
        </button>
      </div>

      {/* Phone Interface */}
      <div className="max-w-md mx-auto bg-white rounded-[40px] overflow-hidden shadow-2xl border-[10px] border-gray-900 relative h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-[#075E54] p-4 pt-8 flex items-center justify-between text-white shadow-md z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                <img src={`https://picsum.photos/seed/${activeType}/200`} alt="Avatar" />
             </div>
             <div>
               <div className="font-semibold text-sm truncate w-32">
                 {activeType === 'alacarte' ? 'Le Gourmet Bot' : 'Fogo Forte Bot'}
               </div>
               <div className="text-xs opacity-80">online</div>
             </div>
          </div>
          <div className="flex gap-4">
            <Video size={20} />
            <Phone size={20} />
            <MoreVertical size={20} />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#efe7dd] p-4 overflow-y-auto relative">
             <div className="absolute inset-0 opacity-5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>
             
             <div className="space-y-4 relative z-10">
               <div className="text-center text-xs bg-[#e1f3fb] text-gray-500 py-1 px-3 rounded-lg inline-block mx-auto w-fit shadow-sm mb-4">
                  As mensagens são protegidas com criptografia de ponta a ponta.
               </div>

               <AnimatePresence>
                 {messages.map((msg) => (
                   <motion.div
                     key={msg.id}
                     initial={{ opacity: 0, y: 10, scale: 0.9 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                     <div
                       className={`max-w-[80%] p-2 px-3 rounded-lg shadow-sm text-sm relative ${
                         msg.sender === 'user' 
                           ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' 
                           : 'bg-white text-gray-800 rounded-tl-none'
                       }`}
                     >
                       {msg.text}
                       <div className="text-[10px] text-gray-400 text-right mt-1 flex justify-end gap-1 items-center">
                         {msg.timestamp}
                         {msg.sender === 'user' && <span className="text-blue-500">✓✓</span>}
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>

               {isTyping && (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                 >
                    <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm">
                       <div className="flex gap-1">
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                         <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                       </div>
                    </div>
                 </motion.div>
               )}
               <div ref={chatEndRef} />
             </div>
        </div>

        {/* Input Area */}
        <div className="bg-[#f0f2f5] p-2 px-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer">
            <span className="text-xl">+</span>
          </div>
          <div className="flex-1 bg-white rounded-full py-2 px-4 text-sm text-gray-400 shadow-sm border border-gray-100">
            {isTyping ? 'Digitando...' : 'Mensagem'}
          </div>
          <div className="w-10 h-10 rounded-full bg-[#005C4B] flex items-center justify-center text-white cursor-pointer shadow-sm hover:scale-105 transition-transform">
            <Send size={18} />
          </div>
        </div>
      </div>
      
      <p className="text-center text-gray-500 text-xs mt-8 italic">
        *Demonstração com dados fictícios. Seu chatbot será personalizado 100% para seu restaurante.
      </p>
    </Section>
  );
};

export default ChatDemo;