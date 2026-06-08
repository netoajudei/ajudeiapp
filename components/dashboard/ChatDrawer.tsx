"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { chatService, Mensagem } from '@/services/chatService';

function cleanContent(content: string): string {
  return content.replace(/<data>.*?<\/data>\s*/g, '').trim();
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: number;
  chatId: string;
  empresaId: number;
  nome: string;
  telefone?: string;
}

export default function ChatDrawer({ isOpen, onClose, clienteId: initialClienteId, chatId: initialChatId, empresaId, nome, telefone }: ChatDrawerProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [compelitionId, setCompelitionId] = useState<number | null>(null);
  const [resolvedClienteId, setResolvedClienteId] = useState(initialClienteId);
  const [resolvedChatId, setResolvedChatId] = useState(initialChatId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  // Resolver cliente e carregar mensagens do compelition
  useEffect(() => {
    if (!isOpen || !empresaId) return;

    const load = async () => {
      setLoading(true);
      try {
        let cId = initialClienteId;
        let chId = initialChatId;

        // Resolver cliente se necessário
        if ((!cId || !chId) && telefone) {
          const supabase = createClient();
          const { data } = await supabase
            .from('clientes')
            .select('id, chatId, instancia')
            .eq('empresa_id', empresaId)
            .or(`telefone.eq.${telefone},chatId.eq.${telefone},chatId.eq.${telefone}@c.us`)
            .limit(1)
            .maybeSingle();
          if (data) {
            if (!cId) cId = data.id;
            if (!chId) chId = data.chatId;
          }
        }

        setResolvedClienteId(cId);
        setResolvedChatId(chId);

        // Buscar compelition
        if (cId) {
          const comp = await chatService.getCompelitionByCliente(cId, empresaId);
          if (comp) {
            setCompelitionId(comp.id);
            setMensagens(comp.chat);
            scrollToBottom();
          } else {
            setMensagens([]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar chat:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, initialClienteId, initialChatId, telefone, empresaId, scrollToBottom]);

  // Focus
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [isOpen]);

  // Real-time no compelition
  useEffect(() => {
    if (!isOpen || !compelitionId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`drawer-comp-${compelitionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'compelition',
        filter: `id=eq.${compelitionId}`
      }, (payload: any) => {
        const chat = payload.new?.chat || [];
        setMensagens(chat);
        scrollToBottom();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, compelitionId, scrollToBottom]);

  // Bloquear scroll do body
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || sending || !resolvedClienteId) return;
    const texto = input.trim();
    setInput('');
    setSending(true);

    // Otimista
    setMensagens(prev => [...prev, { role: 'operator', content: texto }]);
    scrollToBottom();

    try {
      const supabase = createClient();
      const { data: cliente } = await supabase
        .from('clientes')
        .select('instancia')
        .eq('id', resolvedClienteId)
        .single();

      await chatService.enviarMensagem(resolvedClienteId, resolvedChatId, cliente?.instancia || '', empresaId, texto);
    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Erro ao enviar mensagem.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="absolute inset-0 bg-dark flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 bg-deep flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 -ml-2 rounded-lg">
            <ArrowLeft size={22} />
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{nome.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">{nome}</div>
            <div className="text-gray-500 text-xs flex items-center gap-1">
              <Phone size={10} />
              {telefone || resolvedChatId}
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">Carregando...</div>
          ) : mensagens.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              <div className="text-center">
                <MessageSquare size={36} className="mx-auto mb-2 opacity-20" />
                <p>Nenhuma mensagem</p>
                <p className="text-xs mt-1 text-gray-700">Envie a primeira mensagem</p>
              </div>
            </div>
          ) : (
            mensagens.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isIA = msg.role === 'assistant';
              const content = cleanContent(msg.content);

              return (
                <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
                    isUser
                      ? 'bg-gray-800 text-white rounded-bl-md'
                      : isIA
                        ? 'bg-cyan-900/40 text-cyan-50 rounded-br-md border border-cyan-800/30'
                        : 'bg-electric/90 text-white rounded-br-md'
                  }`}>
                    {!isUser && (
                      <div className={`text-[10px] font-semibold mb-0.5 ${isIA ? 'text-cyan-400' : 'text-blue-200'}`}>
                        {isIA ? 'IA' : 'Operador'}
                      </div>
                    )}
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-800 bg-deep">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Mensagem..."
              disabled={sending}
              className="flex-1 bg-dark border border-gray-700 rounded-full px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-electric hover:bg-electric/80 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
