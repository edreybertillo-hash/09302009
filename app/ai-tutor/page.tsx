'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  Bot, Send, Plus, MessageSquare, Trash2, Sparkles, Loader2,
  Mic, Paperclip, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

const suggestedQuestions = [
  'Explain the quadratic formula with examples',
  'What is photosynthesis and why is it important?',
  'How do I solve a system of linear equations?',
  'Explain Newton\'s three laws of motion',
  'What are the differences between mitosis and meiosis?',
  'How does the water cycle work?',
];

export default function AITutorPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('ai_conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setConversations(data || []);
        setLoadingConvs(false);
      });
  }, [user]);

  useEffect(() => {
    if (activeConvId) {
      supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', activeConvId)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          setMessages((data || []).map((m: any) => ({ role: m.role, content: m.content })));
        });
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createConversation = async (title: string) => {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user!.id, title })
      .select('id, title, created_at')
      .single();
    if (error) {
      toast.error('Failed to create conversation');
      return null;
    }
    setConversations((prev) => [data, ...prev]);
    return data.id;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation(text.slice(0, 50));
      if (!convId) return;
      setActiveConvId(convId);
    }

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreaming(true);

    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: text,
    });

    const allMessages = [...messages, userMessage];

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || apiKey}`,
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

      if (assistantContent) {
        await supabase.from('ai_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: assistantContent,
        });
        await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get AI response');
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setStreaming(false);
    }
  };

  const deleteConversation = async (id: string) => {
    await supabase.from('ai_conversations').delete().eq('id', id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
    toast.success('Conversation deleted');
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
        {/* Sidebar - conversations */}
        <div className="hidden w-72 flex-col border-r border-border/40 bg-card/30 md:flex">
          <div className="p-4">
            <Button
              className="w-full"
              onClick={() => {
                setActiveConvId(null);
                setMessages([]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 px-2">
            {loadingConvs ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer',
                      activeConvId === conv.id
                        ? 'bg-blue-600 text-white'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                    onClick={() => setActiveConvId(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-semibold">AI Tutor</h1>
                <p className="text-xs text-muted-foreground">Your personal AI study companion</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-600/20"
                >
                  <Bot className="h-10 w-10" />
                </motion.div>
                <h2 className="mb-2 text-2xl font-bold">Ask me anything</h2>
                <p className="mb-8 text-center text-muted-foreground">
                  I can explain concepts, solve problems, generate quizzes, and help you study.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedQuestions.map((q, i) => (
                    <motion.button
                      key={q}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => sendMessage(q)}
                      className="glass-card rounded-xl p-4 text-left text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Sparkles className="mb-2 h-4 w-4 text-blue-500" />
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
                    >
                      <div className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                      )}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'glass-card'
                      )}>
                        {msg.role === 'assistant' ? (
                          <MarkdownRenderer content={msg.content || '...'} />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {streaming && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is thinking...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/40 p-4">
            <div className="mx-auto max-w-3xl">
              <div className="glass-card flex items-end gap-2 rounded-2xl p-2">
                <Button variant="ghost" size="icon" className="flex-shrink-0" aria-label="Attach file">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask a question..."
                  className="min-h-[44px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0"
                  rows={1}
                />
                <Button variant="ghost" size="icon" className="flex-shrink-0" aria-label="Voice input">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                AI may produce inaccurate information. Verify important facts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
