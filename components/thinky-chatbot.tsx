'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string };

const suggestedQuestions = [
  'Explain the quadratic formula with examples',
  'What is photosynthesis?',
  'How do I solve linear equations?',
  "Explain Newton's laws of motion",
];

export function ThinkyChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMessage: Message = { role: 'user', content: text };
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
          'Authorization': `Bearer ${session?.access_token || apiKey}`,
          'apikey': apiKey,
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

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

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
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
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
        { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Floating chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-6 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl lg:bottom-6 lg:left-72"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Image
                  src="/ChatGPT_Image_Jul_16,_2026,_03_38_44_PM.png"
                  alt="Thinky"
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-white/30"
                />
                <div>
                  <div className="text-sm font-semibold">Thinky</div>
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    Online
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4">
                  <Image
                    src="/ChatGPT_Image_Jul_16,_2026,_03_38_44_PM.png"
                    alt="Thinky"
                    width={56}
                    height={56}
                    className="mb-3 rounded-full ring-2 ring-border/50 shadow-md"
                  />
                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    Hi! I&apos;m Thinky. Ask me anything about your studies.
                  </p>
                  <div className="grid w-full gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/50 p-2.5 text-left text-xs transition-all hover:shadow-md hover:-translate-y-0.5"
                      >
                        <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-blue-500" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 px-3 py-3">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}
                    >
                      {msg.role === 'assistant' && (
                        <Image
                          src="/ChatGPT_Image_Jul_16,_2026,_03_38_44_PM.png"
                          alt="Thinky"
                          width={24}
                          height={24}
                          className="mt-0.5 flex-shrink-0 rounded-full"
                        />
                      )}
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <MarkdownRenderer content={msg.content || '...'} />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {streaming && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Thinky is thinking...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-2">
              <div className="flex items-end gap-1.5 rounded-xl bg-muted/50 p-1.5">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask Thinky..."
                  className="min-h-[36px] flex-1 resize-none border-0 bg-transparent text-sm focus-visible:ring-0"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating avatar button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-card p-1.5 shadow-xl ring-2 ring-border/50 transition-all hover:shadow-2xl lg:left-72"
        aria-label="Chat with Thinky"
      >
        <Image
          src="/ChatGPT_Image_Jul_16,_2026,_03_38_44_PM.png"
          alt="Thinky"
          width={48}
          height={48}
          className="rounded-full"
        />
        {!open && (
          <span className="pr-3 text-sm font-semibold text-foreground">
            Chat with Thinky
          </span>
        )}
      </motion.button>
    </>
  );
}
