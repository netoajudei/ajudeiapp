"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, MessageSquare, User, Bot, ArrowLeft, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { chatService, Conversa, Mensagem } from '@/services/chatService';

function cleanContent(content: string): string {
  return content.replace(/<data>.*?<\/data>\s*/g, '').trim();
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function ChatPage() {
  const { authUser } = useAuth();
  const empresaId = authUser?.empresa?.id;

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [selected, setSelected] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConversas, setLoadingConversas] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  // Carregar conversas
  const loadConversas = useCallback(async () => {
    if (!empresaId) return;
    setLoadingConversas(true);
    setErrorMsg(null);
    try {
      const data = await chatService.getConversas(empresaId);
      setConversas(data);
    } catch (err: any) {
      console.error('[ChatPage] Erro ao carregar conversas:', err);
      setErrorMsg(err?.message || 'Erro desconhecido ao carregar conversas');
    } finally {
      setLoadingConversas(false);
    }
  }, [empresaId]);

  useEffect(() => { loadConversas(); }, [loadConversas]);

  // Carregar mensagens ao selecionar conversa
  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    chatService.getMensagens(selected.compelition_id)
      .then(data => { setMensagens(data); scrollToBottom(); })
      .catch(err => console.error('Erro ao carregar mensagens:', err))
      .finally(() => setLoadingMsgs(false));
  }, [selected, scrollToBottom]);

  // Real-time: atualizar quando compelition muda
  useEffect(() => {
    if (!selected) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`comp-${selected.compelition_id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'compelition',
        filter: `id=eq.${selected.compelition_id}`
      }, (payload: any) => {
        const chat = payload.new?.chat || [];
        setMensagens(chat);
        scrollToBottom();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected, scrollToBottom]);

  // Enviar mensagem
  const handleSend = async () => {
    if (!input.trim() || !selected || !empresaId || sending) return;
    const texto = input.trim();
    setInput('');
    setSending(true);

    // Otimista
    setMensagens(prev => [...prev, { role: 'operator', content: texto }]);
    scrollToBottom();

    try {
      await chatService.enviarMensagem(
        selected.cliente_id,
        selected.chatId,
        selected.instancia,
        empresaId,
        texto
      );
    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Erro ao enviar mensagem.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Filtrar
  const conversasFiltradas = conversas.filter(c => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.nome.toLowerCase().includes(s) || c.telefone.includes(s);
  });

  // Mobile
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const selectConversa = (c: Conversa) => { setSelected(c); setMobileShowChat(true); };

  return (
    <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-deep rounded-2xl overflow-hidden border border-gray-800">

      {/* LISTA DE CONVERSAS */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-800 flex flex-col bg-deep ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-display font-bold text-lg mb-3 flex items-center gap-2">
            <MessageSquare size={20} className="text-electric" />
            Conversas
          </h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {errorMsg ? (
            <div className="flex flex-col items-center justify-center h-32 text-red-400 text-sm px-4 text-center">
              <p>{errorMsg}</p>
              <button onClick={loadConversas} className="mt-2 px-3 py-1 bg-electric/20 text-electric rounded text-xs hover:bg-electric/30">
                Tentar novamente
              </button>
            </div>
          ) : loadingConversas ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Carregando...</div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
              <p>Nenhuma conversa</p>
              <p className="text-xs text-gray-600 mt-1">empresa: {empresaId || 'N/A'}</p>
              <button onClick={loadConversas} className="mt-2 px-3 py-1 bg-gray-800 text-gray-400 rounded text-xs hover:bg-gray-700">
                Recarregar
              </button>
            </div>
          ) : (
            conversasFiltradas.map(c => (
              <button
                key={c.compelition_id}
                onClick={() => selectConversa(c)}
                className={`w-full text-left p-4 border-b border-gray-800/50 hover:bg-white/5 transition-colors ${
                  selected?.compelition_id === c.compelition_id ? 'bg-electric/10 border-l-2 border-l-electric' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{c.nome.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm truncate">{c.nome}</span>
                      <span className="text-gray-500 text-xs flex-shrink-0 ml-2">{formatTime(c.modificadoEm)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {c.ultimo_role === 'assistant' && <Bot size={12} className="text-cyan-400 flex-shrink-0" />}
                      {c.ultimo_role === 'operator' && <User size={12} className="text-green-400 flex-shrink-0" />}
                      <span className="text-gray-400 text-xs truncate">{c.ultima_mensagem.slice(0, 60)}</span>
                    </div>
                    {c.telefone && <span className="text-gray-600 text-xs">{c.telefone}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CHAT */}
      <div className={`flex-1 flex flex-col bg-dark ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p>Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 bg-deep flex items-center gap-3">
              <button onClick={() => setMobileShowChat(false)} className="md:hidden text-gray-400 hover:text-white">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{selected.nome.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">{selected.nome}</div>
                <div className="text-gray-500 text-xs flex items-center gap-1">
                  <Phone size={10} />
                  {selected.telefone || selected.chatId}
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">Carregando...</div>
              ) : mensagens.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">Nenhuma mensagem</div>
              ) : (
                mensagens.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isIA = msg.role === 'assistant';
                  const content = cleanContent(msg.content);

                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] lg:max-w-[65%] rounded-2xl px-4 py-2 ${
                        isUser
                          ? 'bg-gray-800 text-white rounded-bl-md'
                          : isIA
                            ? 'bg-cyan-900/40 text-cyan-50 rounded-br-md border border-cyan-800/30'
                            : 'bg-electric/90 text-white rounded-br-md'
                      }`}>
                        {!isUser && (
                          <div className={`text-xs font-medium mb-1 ${isIA ? 'text-cyan-400' : 'text-blue-200'}`}>
                            {isIA ? 'IA' : 'Operador'}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
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
                  placeholder="Digite uma mensagem..."
                  disabled={sending}
                  className="flex-1 bg-dark border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="bg-electric hover:bg-electric/80 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
