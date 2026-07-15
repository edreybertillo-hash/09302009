'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  StickyNote, Plus, Trash2, Loader2, Sparkles, FileText,
  Minimize2, RefreshCw, Languages, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Note = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewNote, setShowNewNote] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setNotes(data || []);
        setLoading(false);
      });
  }, [user]);

  const createNote = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: user!.id, title, content })
      .select('*')
      .single();
    if (error) {
      toast.error('Failed to create note');
    } else if (data) {
      setNotes((prev) => [data, ...prev]);
      setSelectedNote(data);
      setShowNewNote(false);
      toast.success('Note created');
    }
    setSaving(false);
  };

  const updateNote = async (id: string, updates: { title?: string; content?: string }) => {
    setSaving(true);
    const { data } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (data) {
      setNotes((prev) => prev.map((n) => (n.id === id ? data : n)));
      setSelectedNote(data);
    }
    setSaving(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    toast.success('Note deleted');
  };

  const runAI = async (action: string, label: string) => {
    if (!content.trim()) {
      toast.error('Write some content first');
      return;
    }
    setAiLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ action, content }),
      });
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      if (data.result) {
        setContent(data.result);
        if (selectedNote) await updateNote(selectedNote.id, { content: data.result });
        toast.success(`${label} applied!`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Notes</h1>
            <p className="mt-1 text-muted-foreground">Write notes with markdown and AI-powered editing</p>
          </div>
          <Button onClick={() => { setShowNewNote(true); setTitle(''); setContent(''); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Notes list */}
          <div className="lg:col-span-1">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <AnimatePresence>
              {showNewNote && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <Card className="glass-card">
                    <CardContent className="p-4 space-y-3">
                      <Input
                        placeholder="Note title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Start writing..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button onClick={createNote} disabled={saving} size="sm" className="flex-1">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowNewNote(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <StickyNote className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>No notes yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`glass-card cursor-pointer transition-all hover:shadow-lg ${
                      selectedNote?.id === note.id ? 'border-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedNote(note);
                      setTitle(note.title);
                      setContent(note.content);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium truncate">{note.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(note.updated_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Editor / Preview */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        updateNote(selectedNote.id, { title: e.target.value });
                      }}
                      className="border-0 text-lg font-bold focus-visible:ring-0"
                    />
                    <span className="text-xs text-muted-foreground">
                      {saving ? 'Saving...' : 'Saved'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* AI toolbar */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => runAI('summarize', 'Summarize')} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
                      Summarize
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => runAI('simplify', 'Simplify')} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Minimize2 className="mr-1.5 h-3.5 w-3.5" />}
                      Simplify
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => runAI('rewrite', 'Rewrite')} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                      Rewrite
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => runAI('translate', 'Translate')} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Languages className="mr-1.5 h-3.5 w-3.5" />}
                      Translate
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Editor */}
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-muted-foreground">Editor (Markdown)</Label>
                      <Textarea
                        value={content}
                        onChange={(e) => {
                          setContent(e.target.value);
                          updateNote(selectedNote.id, { content: e.target.value });
                        }}
                        placeholder="Write in markdown... # Headers, **bold**, $math$, ```code```"
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                    {/* Preview */}
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-muted-foreground">Preview</Label>
                      <div className="min-h-[400px] rounded-lg border border-border p-4 overflow-y-auto scrollbar-thin">
                        {content ? (
                          <MarkdownRenderer content={content} />
                        ) : (
                          <p className="text-sm text-muted-foreground">Preview will appear here...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center text-muted-foreground">
                <FileText className="mb-3 h-12 w-12 opacity-50" />
                <p>Select a note or create a new one to start writing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
