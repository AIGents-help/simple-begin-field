import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { sectionService } from '@/services/sectionService';
import { healthScoreService, HealthScore } from '@/services/healthScoreService';
import { HavenOwlSvg } from './HavenOwlSvg';
import { isDemoMode } from '@/demo/demoMode';
import { DEMO_HAVEN_GREETING } from '@/demo/morganFamilyData';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Map view/tab to section label
function getCurrentSection(view: string, activeTab: string): string {
  if (view === 'dashboard') return 'dashboard';
  if (view === 'profile') return 'profile';
  if (view === 'sections') return activeTab || 'info';
  return view;
}

export const HavenAssistant = () => {
  const { view, activeTab, currentPacket, activeScope } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasIncomplete, setHasIncomplete] = useState(false);
  const [initialSent, setInitialSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSectionRef = useRef('');

  const section = getCurrentSection(view, activeTab);

  // Check for incomplete fields in current section
  useEffect(() => {
    const checkCompletion = async () => {
      if (!currentPacket || view !== 'sections') {
        setHasIncomplete(false);
        return;
      }
      try {
        const { data } = await sectionService.getRecords(currentPacket.id, activeTab, activeScope);
        setHasIncomplete(!data || data.length === 0);
      } catch {
        setHasIncomplete(false);
      }
    };
    checkCompletion();
  }, [currentPacket, activeTab, activeScope, view]);

  // Reset conversation when section changes
  useEffect(() => {
    if (section !== lastSectionRef.current) {
      lastSectionRef.current = section;
      setMessages([]);
      setInitialSent(false);
    }
  }, [section]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial analysis when drawer opens
  useEffect(() => {
    if (isOpen && !initialSent && !loading) {
      sendInitialMessage();
    }
  }, [isOpen, initialSent]);

  const fetchSectionData = async () => {
    if (!currentPacket || view !== 'sections') return {};
    try {
      const { data } = await sectionService.getRecords(currentPacket.id, activeTab, activeScope);
      return data || [];
    } catch {
      return [];
    }
  };

  const fetchHealthScore = async (): Promise<HealthScore | null> => {
    if (!currentPacket) return null;
    try {
      return await healthScoreService.getCurrent(currentPacket.id);
    } catch {
      return null;
    }
  };

  const sendInitialMessage = async () => {
    setInitialSent(true);
    // Demo mode: skip the live edge function call and show the canned greeting
    if (isDemoMode()) {
      setMessages([{ role: 'assistant', content: DEMO_HAVEN_GREETING }]);
      return;
    }
    setLoading(true);
    try {
      const [sectionData, healthScore] = await Promise.all([fetchSectionData(), fetchHealthScore()]);
      const { data, error } = await supabase.functions.invoke('haven-chat', {
        body: {
          messages: [{ role: 'user', content: `I just opened the ${section} section. What should I work on?` }],
          section,
          sectionData,
          healthScore,
        },
      });
      if (error) throw error;
      setMessages([{ role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Haven initial message error:', err);
      setMessages([{ role: 'assistant', content: `Welcome to your ${section} section! I'm here to help you complete it. What would you like to work on?` }]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTED_PROMPTS = [
    'What should I add next?',
    'What are my biggest gaps?',
    'Help me understand why this matters',
    'What would happen if I died today?',
    'What documents should I upload?',
  ];

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    if (!overrideText) setInput('');

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const [sectionData, healthScore] = await Promise.all([fetchSectionData(), fetchHealthScore()]);
      const { data, error } = await supabase.functions.invoke('haven-chat', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          section,
          sectionData,
          healthScore,
        },
      });
      if (error) throw error;
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Haven chat error:', err);
      setMessages([...newMessages, { role: 'assistant', content: "I'm having trouble connecting right now. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-24 right-4 z-40 md:bottom-8 md:right-8 group">
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform relative"
          aria-label="Ask Haven"
        >
          <HavenOwlSvg size={64} />
          {/* Gold pulsing badge */}
          {hasIncomplete && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#c9a84c] border-2 border-[#fdfaf3] animate-pulse" />
          )}
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Ask Haven
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full md:w-[360px]`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 bg-stone-50 flex-shrink-0">
          <HavenOwlSvg size={80} />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Haven
            </h2>
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Your Packet guide</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-navy-muted text-white rounded-br-md'
                    : 'bg-stone-100 text-stone-800 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-100 text-stone-400 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Haven is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts (only when chat is empty and not loading) */}
        {messages.length === 0 && !loading && (
          <div className="px-4 pb-2 flex-shrink-0">
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-2">
              Try asking
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full px-3 py-1.5 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-stone-100 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Haven anything..."
              className="flex-1 px-4 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 placeholder:text-stone-400"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-navy-muted text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-stone-800 transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
