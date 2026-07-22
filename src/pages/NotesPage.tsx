import { useState, useEffect } from 'react'
import { StickyNote, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { supabase, type Note, type Subject } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { toast } from 'sonner'

export function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadNotes()
    loadSubjects()
  }, [user])

  async function loadNotes() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  async function loadSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('name')
    setSubjects(data || [])
  }

  async function createNote() {
    if (!user) return
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title,
        content,
        subject_id: subjectId || null,
      })
      .select('*')
      .single()

    if (error) {
      toast.error('Failed to create note')
      return
    }

    setNotes((prev) => [data, ...prev])
    setTitle('')
    setContent('')
    setSubjectId('')
    setShowForm(false)
    setSelectedNote(data)
    toast.success('Note created!')
  }

  async function updateNote(note: Note) {
    const { data } = await supabase
      .from('notes')
      .update({ title: note.title, content: note.content, updated_at: new Date().toISOString() })
      .eq('id', note.id)
      .select('*')
      .single()
    if (data) {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? data : n)))
      toast.success('Note saved')
    }
  }

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (selectedNote?.id === id) setSelectedNote(null)
    toast.success('Note deleted')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Notes list */}
      <div className="w-72 shrink-0 border-r border-border/40 bg-muted/30 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-rose-500" />
            <h1 className="text-lg font-semibold">Notes</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New Note
          </button>

          {showForm && (
            <div className="mb-4 space-y-3 rounded-lg border border-border/60 bg-card p-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              >
                <option value="">No subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={createNote}
                className="w-full rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet. Create one to get started!</p>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`group rounded-lg border p-3 transition-colors cursor-pointer ${
                    selectedNote?.id === note.id ? 'border-primary bg-primary/5' : 'border-border/60 hover:bg-accent'
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium line-clamp-1">{note.title}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                      className="ml-2 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-error" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {note.content || 'Empty note'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-3">
              <input
                value={selectedNote.title}
                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                className="flex-1 bg-transparent text-lg font-semibold outline-none"
              />
              <button
                onClick={() => updateNote(selectedNote)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
            <textarea
              value={selectedNote.content}
              onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
              placeholder="Start writing... Supports markdown, math formulas ($...$), and code blocks."
              className="flex-1 resize-none bg-background p-6 text-sm outline-none"
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <StickyNote className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Select a note to edit</p>
              <p className="text-sm text-muted-foreground">Or create a new note to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
