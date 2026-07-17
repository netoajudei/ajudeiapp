"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, ArrowLeft, Phone, MessageSquare, AlertCircle, BotOff, Bot, Clock, Timer, Infinity as InfinityIcon, X } from 'lucide-react';
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

const SILENCE_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '2 horas', minutes: 120 },
  { label: '6 horas', minutes: 360 },
  { label: 'Indefinido', minutes: 0 },
];

export default function ChatDrawer({ isOpen, onClose, clienteId: initialClienteId, chatId: initialChatId, empresaId, nome, telefone }: ChatDrawerProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [compelitionId, setCompelitionId] = useState<number | null>(null);
  const [resolvedClienteId, setResolvedClienteId] = useState(initialClienteId);
  const [resolvedChatId, setResolvedChatId] = useState(initialChatId);
  const [mounted, setMounted] = useState(false);
  const [clienteNotFound, setClienteNotFound] = useState(false);

  // Bot silencer state
  const [botAtivo, setBotAtivo] = useState(true);
  const [botPausadoAte, setBotPausadoAte] = useState<string | null>(null);
  const [showSilenceMenu, setShowSilenceMenu] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  // Resolver cliente, carregar mensagens e status do bot
  useEffect(() => {
    if (!isOpen || !empresaId) return;

    const load = async () => {
      setLoading(true);
      setClienteNotFound(false);
      try {
        let cId = initialClienteId;
        let chId = initialChatId;

        if ((!cId || !chId) && telefone) {
          const supabase = createClient();
          const numero = telefone.replace(/\D/g, '');
          const { data } = await supabase
            .from('clientes')
            .select('id, chatId, instancia')
            .eq('empresa_id', empresaId)
            .or(`telefone.eq.${numero},chatId.eq.${numero},chatId.eq.${numero}@c.us,chatId.eq.${numero}@lid`)
            .limit(1)
            .maybeSingle();
          if (data) {
            if (!cId) cId = data.id;
            if (!chId) chId = data.chatId;
          }
        }

        setResolvedClienteId(cId);
        setResolvedChatId(chId);

        if (!cId) {
          setClienteNotFound(true);
          setMensagens([]);
          return;
        }

        // Buscar status do bot
        const supabase = createClient();
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('bot_ativo, bot_pausado_ate')
          .eq('id', cId)
          .single();

        if (clienteData) {
          setBotAtivo(clienteData.bot_ativo ?? true);
          setBotPausadoAte(clienteData.bot_pausado_ate ?? null);
        }

        // Buscar compelition
        const comp = await chatService.getCompelitionByCliente(cId, empresaId);
        if (comp) {
          setCompelitionId(comp.id);
          setMensagens(comp.chat);
          scrollToBottom();
        } else {
          setCompelitionId(null);
          setMensagens([]);
        }
      } catch (err) {
        console.error('Erro ao carregar chat:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, initialClienteId, initialChatId, telefone, empresaId, scrollToBottom]);

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

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSilenceBot = async (minutes: number) => {
    if (!resolvedClienteId || togglingBot) return;
    setTogglingBot(true);
    setShowSilenceMenu(false);

    try {
      const supabase = createClient();
      const pausadoAte = minutes > 0
        ? new Date(Date.now() + minutes * 60 * 1000).toISOString()
        : null;

      await supabase
        .from('clientes')
        .update({ bot_ativo: false, bot_pausado_ate: pausadoAte })
        .eq('id', resolvedClienteId);

      setBotAtivo(false);
      setBotPausadoAte(pausadoAte);
    } catch (err) {
      console.error('Erro ao silenciar bot:', err);
      alert('Erro ao silenciar o bot.');
    } finally {
      setTogglingBot(false);
    }
  };

  const handleReactivateBot = async () => {
    if (!resolvedClienteId || togglingBot) return;
    setTogglingBot(true);

    try {
      const supabase = createClient();
      await supabase
        .from('clientes')
        .update({ bot_ativo: true, bot_pausado_ate: null })
        .eq('id', resolvedClienteId);

      setBotAtivo(true);
      setBotPausadoAte(null);
    } catch (err) {
      console.error('Erro ao reativar bot:', err);
      alert('Erro ao reativar o bot.');
    } finally {
      setTogglingBot(false);
    }
  };

  const formatTimeRemaining = () => {
    if (!botPausadoAte) return 'Indefinido';
    const diff = new Date(botPausadoAte).getTime() - Date.now();
    if (diff <= 0) return 'Expirando...';
    const mins = Math.ceil(diff / 60000);
    if (mins < 60) return `${mins}min restantes`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h${remainMins > 0 ? `${remainMins}min` : ''} restantes`;
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !resolvedClienteId) return;
    const texto = input.trim();
    setInput('');
    setSending(true);

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

      if (!compelitionId) {
        const comp = await chatService.getCompelitionByCliente(resolvedClienteId, empresaId);
        if (comp) {
          setCompelitionId(comp.id);
        }
      }
    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Erro ao enviar mensagem.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen || !mounted) return null;

  const drawerContent = (
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

          {/* Bot Toggle Button */}
          {!clienteNotFound && resolvedClienteId > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  if (!botAtivo) {
                    handleReactivateBot();
                  } else {
                    setShowSilenceMenu(!showSilenceMenu);
                  }
                }}
                disabled={togglingBot}
                className={`p-2 rounded-lg transition-all ${
                  botAtivo
                    ? 'text-green-400 hover:bg-green-500/10 border border-green-500/30'
                    : 'text-orange-400 hover:bg-orange-500/10 border border-orange-500/30'
                }`}
                title={botAtivo ? 'Bot ativo - clique para silenciar' : 'Bot silenciado - clique para reativar'}
              >
                {togglingBot ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : botAtivo ? (
                  <Bot size={20} />
                ) : (
                  <BotOff size={20} />
                )}
              </button>

              {/* Silence Options Dropdown */}
              <AnimatePresence>
                {showSilenceMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-12 bg-deep border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-48"
                    style={{ zIndex: 10000 }}
                  >
                    <div className="px-3 py-2 border-b border-gray-700">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Silenciar Bot</p>
                    </div>
                    {SILENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => handleSilenceBot(opt.minutes)}
                        className="w-full px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        {opt.minutes > 0 ? <Timer size={14} className="text-orange-400" /> : <InfinityIcon size={14} className="text-red-400" />}
                        {opt.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowSilenceMenu(false)}
                      className="w-full px-3 py-2 text-left text-xs text-gray-500 hover:bg-white/5 border-t border-gray-700 flex items-center gap-2"
                    >
                      <X size={12} /> Cancelar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bot Status Banner */}
        {!botAtivo && !clienteNotFound && (
          <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400 text-xs">
              <BotOff size={14} />
              <span className="font-medium">Bot silenciado</span>
              <span className="text-orange-300/70">- {formatTimeRemaining()}</span>
            </div>
            <button
              onClick={handleReactivateBot}
              disabled={togglingBot}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 px-2 py-1 rounded hover:bg-orange-500/10 transition-colors"
            >
              Reativar
            </button>
          </div>
        )}

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">Carregando...</div>
          ) : clienteNotFound ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              <div className="text-center">
                <AlertCircle size={36} className="mx-auto mb-2 opacity-40 text-yellow-500" />
                <p className="text-yellow-500 font-medium">Cliente não encontrado</p>
                <p className="text-xs mt-1 text-gray-700">Não foi possível localizar este cliente no sistema.</p>
              </div>
            </div>
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
              placeholder={clienteNotFound ? "Cliente não encontrado..." : "Mensagem..."}
              disabled={sending || clienteNotFound}
              className="flex-1 bg-dark border border-gray-700 rounded-full px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || clienteNotFound}
              className="bg-electric hover:bg-electric/80 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
