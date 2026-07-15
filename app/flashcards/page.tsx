'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Layers, Loader2, Sparkles, Shuffle, Bookmark, BookmarkCheck,
  Star, ChevronLeft, ChevronRight, RotateCcw, Trash2, Plus,
  FlaskConical, Calculator, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Flashcard = {
  id: string;
  deck_title: string;
  front: string;
  back: string;
  is_bookmarked: boolean;
  is_favorite: boolean;
  review_count: number;
};

const subjects = [
  {
    id: 'science',
    label: 'Science',
    icon: FlaskConical,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    topics: [
      'Biology',
      'Chemistry',
      'Physics',
      'Earth Science',
      'Environmental Science',
      'Astronomy',
      'Anatomy & Physiology',
      'Microbiology',
      'Genetics',
      'Forensic Science',
    ],
  },
  {
    id: 'math',
    label: 'Math',
    icon: Calculator,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    topics: [
      'Algebra',
      'Geometry',
      'Trigonometry',
      'Calculus',
      'Statistics',
      'Probability',
      'Linear Algebra',
      'Differential Equations',
      'Discrete Mathematics',
      'Number Theory',
    ],
  },
  {
    id: 'grammar',
    label: 'Grammar / English',
    icon: BookOpen,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    topics: [
      'Parts of Speech',
      'Tenses',
      'Sentence Structure',
      'Punctuation',
      'Subject-Verb Agreement',
      'Active & Passive Voice',
      'Direct & Indirect Speech',
      'Vocabulary',
      'Reading Comprehension',
      'Essay Writing',
    ],
  },
];

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studied, setStudied] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCards(data || []);
        setLoading(false);
      });
  }, [user]);

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId === selectedSubject ? null : subjectId);
    setSelectedTopic(null);
  };

  const generateFlashcards = async () => {
    if (!selectedSubject || !selectedTopic) {
      toast.error('Please select a subject and a topic');
      return;
    }
    setGenerating(true);
    try {
      const subjectLabel = subjects.find((s) => s.id === selectedSubject)?.label ?? selectedSubject;
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          action: 'generate_flashcards',
          subject: subjectLabel,
          topic: selectedTopic,
          additionalInstructions,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate flashcards');
      const data = await response.json();

      if (data.flashcards && data.flashcards.length > 0) {
        const deckTitle = `${subjectLabel}: ${selectedTopic}`;
        const inserts = data.flashcards.map((c: any) => ({
          user_id: user!.id,
          deck_title: deckTitle,
          front: c.front,
          back: c.back,
        }));
        const { data: inserted } = await supabase.from('flashcards').insert(inserts).select('*');
        if (inserted) {
          setCards((prev) => [...inserted, ...prev]);
        }
        toast.success(`Generated ${data.flashcards.length} flashcards!`);
        setSelectedSubject(null);
        setSelectedTopic(null);
        setAdditionalInstructions('');
        setShowGenerator(false);
      } else {
        toast.error('Could not generate flashcards for this topic');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleBookmark = async (id: string, current: boolean) => {
    await supabase.from('flashcards').update({ is_bookmarked: !current }).eq('id', id);
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_bookmarked: !current } : c));
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from('flashcards').update({ is_favorite: !current }).eq('id', id);
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_favorite: !current } : c));
  };

  const reviewCard = async (id: string) => {
    await supabase.from('flashcards').update({
      review_count: (cards[currentIndex]?.review_count || 0) + 1,
      last_reviewed: new Date().toISOString(),
    }).eq('id', id);
    setStudied((prev) => prev + 1);
  };

  const nextCard = () => {
    setFlipped(false);
    if (cards[currentIndex]) reviewCard(cards[currentIndex].id);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const shuffleCards = () => {
    setFlipped(false);
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    toast.success('Cards shuffled!');
  };

  const deleteCard = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (currentIndex >= cards.length - 1) setCurrentIndex(0);
    toast.success('Card deleted');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Flashcards</h1>
            <p className="mt-1 text-muted-foreground">AI-generated smart flashcards with spaced repetition</p>
          </div>
          <Button onClick={() => setShowGenerator(!showGenerator)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </motion.div>

        {/* Generator */}
        <AnimatePresence>
          {showGenerator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="glass-card mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    Generate Flashcards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subject selection */}
                  <div>
                    <Label className="mb-3 block">Choose a Subject</Label>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {subjects.map((subject) => {
                        const Icon = subject.icon;
                        const isSelected = selectedSubject === subject.id;
                        return (
                          <button
                            key={subject.id}
                            onClick={() => handleSubjectSelect(subject.id)}
                            className={cn(
                              'flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all hover:scale-[1.02]',
                              isSelected
                                ? cn(subject.borderColor, subject.bgColor)
                                : 'border-border hover:border-muted-foreground/30'
                            )}
                          >
                            <Icon className={cn('h-8 w-8', subject.color)} />
                            <span className="font-medium">{subject.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topic selection */}
                  <AnimatePresence>
                    {selectedSubject && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Label className="mb-3 block">Select a Topic</Label>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {subjects
                            .find((s) => s.id === selectedSubject)
                            ?.topics.map((topic) => (
                              <button
                                key={topic}
                                onClick={() => setSelectedTopic(topic === selectedTopic ? null : topic)}
                                className={cn(
                                  'rounded-lg border px-4 py-2.5 text-left text-sm transition-all hover:scale-[1.02]',
                                  selectedTopic === topic
                                    ? 'border-blue-500 bg-blue-500/10 font-medium'
                                    : 'border-border hover:border-muted-foreground/30'
                                )}
                              >
                                {topic}
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Additional instructions */}
                  <div>
                    <Label>Additional Instructions (optional)</Label>
                    <Textarea
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="e.g. Focus on definitions, include examples, make cards harder..."
                      className="mt-2 min-h-[80px]"
                    />
                  </div>

                  <Button onClick={generateFlashcards} disabled={generating || !selectedSubject || !selectedTopic} className="w-full">
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Flashcards
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flashcard study area */}
        {cards.length === 0 ? (
          <div className="py-20 text-center">
            <Layers className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h2 className="mb-2 text-xl font-semibold">No flashcards yet</h2>
            <p className="mb-6 text-muted-foreground">Choose a subject and topic to generate flashcards.</p>
            <Button onClick={() => setShowGenerator(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Flashcards
            </Button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Card {currentIndex + 1} of {cards.length}
                </span>
                <span className="text-muted-foreground">{studied} studied this session</span>
              </div>
              <Progress value={((currentIndex + 1) / cards.length) * 100} className="h-2" />
            </div>

            {/* Flashcard */}
            <div className="mb-6 flex justify-center">
              <div className="flashcard-container group h-80 w-full max-w-2xl cursor-pointer" onClick={() => setFlipped(!flipped)}>
                <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
                  {/* Front */}
                  <div className="flashcard-face flashcard-front glass-card absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8">
                    <div className="absolute right-4 top-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(cards[currentIndex].id, cards[currentIndex].is_bookmarked);
                        }}
                        className="text-muted-foreground hover:text-blue-500"
                      >
                        {cards[currentIndex].is_bookmarked ? (
                          <BookmarkCheck className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(cards[currentIndex].id, cards[currentIndex].is_favorite);
                        }}
                        className="text-muted-foreground hover:text-amber-500"
                      >
                        <Star className={cn('h-5 w-5', cards[currentIndex].is_favorite && 'fill-amber-400 text-amber-400')} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCard(cards[currentIndex].id);
                        }}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mb-4 text-xs font-medium uppercase tracking-wider text-blue-500">
                      Question
                    </div>
                    <p className="text-center text-xl font-medium">{cards[currentIndex].front}</p>
                    <p className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</p>
                  </div>

                  {/* Back */}
                  <div className="flashcard-face flashcard-back glass-card absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8">
                    <div className="mb-4 text-xs font-medium uppercase tracking-wider text-green-500">
                      Answer
                    </div>
                    <p className="text-center text-lg">{cards[currentIndex].back}</p>
                    <p className="absolute bottom-4 text-xs text-muted-foreground">Click to flip back</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" onClick={prevCard}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={shuffleCards}>
                <Shuffle className="mr-2 h-4 w-4" />
                Shuffle
              </Button>
              <Button variant="outline" onClick={() => { setFlipped(false); setCurrentIndex(0); }}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart
              </Button>
              <Button variant="outline" size="icon" onClick={nextCard}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Deck info */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{cards.length}</div>
                  <div className="text-xs text-muted-foreground">Total Cards</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{cards.filter(c => c.is_bookmarked).length}</div>
                  <div className="text-xs text-muted-foreground">Bookmarked</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{cards.filter(c => c.is_favorite).length}</div>
                  <div className="text-xs text-muted-foreground">Favorites</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{cards.reduce((sum, c) => sum + c.review_count, 0)}</div>
                  <div className="text-xs text-muted-foreground">Total Reviews</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
