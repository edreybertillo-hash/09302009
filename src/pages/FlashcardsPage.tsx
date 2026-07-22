import { useState, useEffect } from 'react'
import { Layers, Plus, Trash2, Loader2, Bookmark } from 'lucide-react'
import { supabase, type Flashcard } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { toast } from 'sonner'

export function FlashcardsPage() {
  const { user } = useAuth()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [showForm, setShowForm] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [deckTitle, setDeckTitle] = useState('General')
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadFlashcards()
  }, [user])

  async function loadFlashcards() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setFlashcards(data || [])
    setLoading(false)
  }

  async function addFlashcard() {
    if (!user) return
    if (!front.trim() || !back.trim()) {
      toast.error('Please fill in both sides of the flashcard')
      return
    }

    const { data, error } = await supabase
      .from('flashcards')
      .insert({ user_id: user.id, front, back, deck_title: deckTitle })
      .select('*')
      .single()

    if (error) {
      toast.error('Failed to create flashcard')
      return
    }

    setFlashcards((prev) => [data, ...prev])
    setFront('')
    setBack('')
    setShowForm(false)
    toast.success('Flashcard created!')
  }

  async function deleteFlashcard(id: string) {
    await supabase.from('flashcards').delete().eq('id', id)
    setFlashcards((prev) => prev.filter((f) => f.id !== id))
    toast.success('Flashcard deleted')
  }

  async function toggleBookmark(card: Flashcard) {
    const { data } = await supabase
      .from('flashcards')
      .update({ is_bookmarked: !card.is_bookmarked })
      .eq('id', card.id)
      .select('*')
      .single()
    if (data) {
      setFlashcards((prev) => prev.map((f) => (f.id === card.id ? data : f)))
    }
  }

  function reviewCard(card: Flashcard) {
    supabase
      .from('flashcards')
      .update({ review_count: card.review_count + 1, last_reviewed: new Date().toISOString() })
      .eq('id', card.id)
      .then()
  }

  const currentCard = flashcards[currentIndex]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <Layers className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Smart Flashcards</h1>
              <p className="text-sm text-muted-foreground">{flashcards.length} cards in your collection</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Card
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-2xl border border-border/60 bg-card p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Deck Title</label>
                <input
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Front (Question)</label>
                  <textarea
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="What is the capital of France?"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Back (Answer)</label>
                  <textarea
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Paris"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addFlashcard}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Create Flashcard
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-border px-6 py-2 text-sm font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : flashcards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No flashcards yet</p>
            <p className="text-sm text-muted-foreground">Create your first flashcard to start studying.</p>
          </div>
        ) : (
          <>
            {/* Study Mode */}
            {currentCard && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Card {currentIndex + 1} of {flashcards.length}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                      className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-accent"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        reviewCard(currentCard)
                        setFlipped(new Set())
                        setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1))
                      }}
                      className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-accent"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div
                  onClick={() => setFlipped((prev) => new Set([...prev, currentCard.id]))}
                  className="mx-auto flex h-64 max-w-2xl cursor-pointer items-center justify-center rounded-2xl border border-border/60 bg-card p-8 shadow-lg transition-all hover:shadow-xl"
                >
                  <div className="text-center">
                    {flipped.has(currentCard.id) ? (
                      <>
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Answer</p>
                        <p className="text-xl font-medium">{currentCard.back}</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Question</p>
                        <p className="text-xl font-medium">{currentCard.front}</p>
                        <p className="mt-4 text-xs text-muted-foreground">Click to reveal answer</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* All Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {flashcards.map((card) => (
                <div key={card.id} className="group rounded-xl border border-border/60 bg-card p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{card.deck_title}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleBookmark(card)}
                        className={`rounded p-1 transition-colors hover:bg-accent ${card.is_bookmarked ? 'text-amber-500' : 'text-muted-foreground'}`}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${card.is_bookmarked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => deleteFlashcard(card.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mb-2 text-sm font-medium">{card.front}</p>
                  <p className="text-sm text-muted-foreground">{card.back}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Reviewed {card.review_count} times
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
