import { useState, useRef, useEffect } from 'react'
import { Send, Plus, Trash2, Brain, Loader2, MessageSquare, AlertCircle } from 'lucide-react'
import { supabase, type AIConversation, type AIMessage } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { toast } from 'sonner'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const suggestedPrompts = [
  'Explain the quadratic formula with examples',
  'How do I solve a system of linear equations?',
  "Explain Newton's three laws of motion",
]

export function AITutorPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) loadConversations()
  }, [user])

  useEffect(() => {
    if (activeConversation) loadMessages(activeConversation)
  }, [activeConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  async function loadConversations() {
    if (!user) return
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setConversations(data || [])
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('ai_messages')
      .select('id, conversation_id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function createConversation(title: string): Promise<string | null> {
    if (!user) return null
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title: title.slice(0, 50) || 'New Chat' })
      .select('*')
      .single()
    if (error) {
      toast.error('Failed to create conversation')
      return null
    }
    setConversations((prev) => [data, ...prev])
    return data.id
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    if (!user) return

    let conversationId = activeConversation
    if (!conversationId) {
      conversationId = await createConversation(text.slice(0, 50))
      if (!conversationId) return
      setActiveConversation(conversationId)
    }

    const userMessage: AIMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: conversationId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setStreaming(true)
    setStreamingContent('')

    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: text,
    })

    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          action: 'chat',
          messages: [...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: text }],
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const decoded = new TextDecoder().decode(value)
        for (const line of decoded.split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.choices?.[0]?.delta?.content) {
                accumulated += parsed.choices[0].delta.content
                setStreamingContent(accumulated)
              }
            } catch {
              // skip
            }
          }
        }
      }

      if (accumulated) {
        const aiMessage: AIMessage = {
          id: 'temp-ai-' + Date.now(),
          conversation_id: conversationId,
          role: 'assistant',
          content: accumulated,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMessage])
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: accumulated,
        })
        await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to get AI response')
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }

  async function deleteConversation(id: string) {
    await supabase.from('ai_conversations').delete().eq('id', id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConversation === id) {
      setActiveConversation(null)
      setMessages([])
    }
    toast.success('Conversation deleted')
  }

  function newChat() {
    setActiveConversation(null)
    setMessages([])
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-border/40 bg-muted/30 md:flex md:flex-col">
        <div className="p-4">
          <button
            onClick={newChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeConversation === conv.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <button
                  onClick={() => setActiveConversation(conv.id)}
                  className="flex flex-1 items-center gap-2 truncate text-left"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{conv.title}</span>
                </button>
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="ml-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-error" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">AI Tutor</h1>
          </div>
          <p className="text-sm text-muted-foreground">Your personal AI study companion</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 && !streaming ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <p className="mb-6 text-center text-muted-foreground">
                I can explain concepts, solve problems, and help you study.
                <br />What would you like to learn today?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border/60'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-card border border-border/60 px-4 py-3">
                    {streamingContent ? (
                      <p className="whitespace-pre-wrap text-sm">{streamingContent}</p>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> AI is thinking...
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border/40 px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
              placeholder="Ask anything..."
              disabled={streaming}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={streaming || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
            <AlertCircle className="mr-1 inline h-3 w-3" />
            AI may produce inaccurate information. Verify important facts.
          </p>
        </div>
      </div>
    </div>
  )
}
