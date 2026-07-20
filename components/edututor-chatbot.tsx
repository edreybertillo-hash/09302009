'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, X, Minus, GraduationCap, Sparkles, Paperclip, Mic, Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string; ts?: number };

const SUGGESTED_QUESTIONS = [
  'Explain the quadratic formula with examples',
  'What is photosynthesis?',
  "Explain Newton's laws of motion",
  'How do I solve linear equations?',
  'What caused World War I?',
  'Explain recursion in programming',
];

const GREETING: Message = {
  role: 'assistant',
  content:
    "Hi there! I'm **EduTutor AI**, your personal learning assistant. I can help you understand concepts step-by-step across Math, Science, English, History, Computer Science, Economics, Geography, and more.\n\nInstead of just giving answers, I'll guide you with hints and questions so you truly learn. What would you like to explore today?",
  ts: Date.now(),
};

export function EduTutorChatbot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;
      setHasInteracted(true);

      const userMessage: Message = { role: 'user', content: text, ts: Date.now() };
      const allMessages = [...messages, userMessage];
      setMessages(allMessages);
      setInput('');
      setStreaming(true);

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const session = (await supabase.auth.getSession()).data.session;
        const response = await fetch(`${supabaseUrl}/functions/v1/ai-tutor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || apiKey}`,
            apikey: apiKey,
          },
          body: JSON.stringify({
            action: 'chat',
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || `HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        setMessages((prev) => [...prev, { role: 'assistant', content: '', ts: Date.now() }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.choices?.[0]?.delta?.content) {
                  assistantContent += json.choices[0].delta.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: 'assistant',
                      content: assistantContent,
                      ts: Date.now(),
                    };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev.filter((m) => m.content !== ''),
          {
            role: 'assistant',
            content: "I'm sorry, I had trouble responding just now. Could you try asking again?",
            ts: Date.now(),
          },
        ]);
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, supabase]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            role="dialog"
            aria-label="EduTutor AI chat"
            className="fixed bottom-24 right-6 z-[100] flex h-[min(640px,calc(100vh-8rem))] w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-[20px] border border-white/40 bg-white/70 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70 sm:right-6"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold leading-tight">
                    EduTutor AI
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                    </span>
                    Your Personal Learning Assistant
                  </div>
                </div>
              </div>
              <div className="relative flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setMinimized(true)}
                  aria-label="Minimize chat"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-transparent to-slate-50/40 dark:to-slate-950/30"
            >
              {!hasInteracted ? (
                <div className="flex h-full flex-col items-center justify-center px-4 py-6">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                    <Bot className="h-8 w-8" />
                  </div>
                  <div className="mb-4 max-w-[90%] rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-slate-800/80">
                    <MarkdownRenderer content={GREETING.content} />
                  </div>
                  <div className="grid w-full gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="flex items-start gap-2 rounded-xl border border-slate-200/70 bg-white/60 p-2.5 text-left text-xs transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-800/60"
                      >
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 px-3 py-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}
                    >
                      {msg.role === 'assistant' && (
                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                          msg.role === 'user'
                            ? 'rounded-br-md bg-blue-600 text-white'
                            : 'rounded-bl-md bg-white/90 text-slate-800 dark:bg-slate-800/90 dark:text-slate-100'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          msg.content ? (
                            <MarkdownRenderer content={msg.content} />
                          ) : (
                            <TypingDots />
                          )
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {streaming &&
                    messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex items-center gap-2 pl-9 text-xs text-muted-foreground">
                        <TypingDots />
                        EduTutor is thinking...
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-200/60 bg-white/60 p-2.5 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60">
              <div className="flex items-end gap-1.5 rounded-xl bg-slate-100/80 p-1.5 dark:bg-slate-800/60">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground"
                  aria-label="Attach file"
                  type="button"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask EduTutor anything..."
                  aria-label="Message EduTutor AI"
                  className="min-h-[36px] flex-1 resize-none border-0 bg-transparent text-sm focus-visible:ring-0"
                  rows={1}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground"
                  aria-label="Voice input"
                  type="button"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 bg-gradient-to-br from-blue-600 to-purple-600"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized bar */}
      <AnimatePresence>
        {open && minimized && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setMinimized(false)}
            className="fixed bottom-24 right-6 z-[100] flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-2xl"
            aria-label="Restore EduTutor chat"
          >
            <GraduationCap className="h-4 w-4" />
            EduTutor AI
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          setOpen(!open);
          setMinimized(false);
        }}
        className={cn(
          'fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-600/30 ring-2 ring-white/30 transition-shadow',
          !open && !hasInteracted && 'animate-pulse-slow'
        )}
        aria-label={open ? 'Close EduTutor AI chat' : 'Open EduTutor AI chat'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="cap"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <GraduationCap className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="EduTutor is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
