'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Loader2, CheckCircle2, XCircle, RefreshCw,
  Sparkles, Award, ChevronRight, Lightbulb,
  FlaskConical, Calculator, BookOpen, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Question = {
  question_type: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

const questionTypeOptions = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'identification', label: 'Identification' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'essay', label: 'Essay' },
];

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

export default function QuizGeneratorPage() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState('10');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multiple_choice', 'true_false']);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const supabase = createClient();

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId === selectedSubject ? null : subjectId);
    setSelectedTopic(null);
  };

  const generateQuiz = async () => {
    if (!selectedSubject || !selectedTopic) {
      toast.error('Please select a subject and a topic');
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error('Select at least one question type');
      return;
    }
    setLoading(true);
    setSubmitted(false);
    setAnswers({});

    const subjectLabel = subjects.find((s) => s.id === selectedSubject)?.label ?? selectedSubject;

    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          action: 'generate_quiz',
          subject: subjectLabel,
          topic: selectedTopic,
          difficulty,
          numQuestions: parseInt(numQuestions),
          questionTypes: selectedTypes,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to generate quiz' }));
        throw new Error(err.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('AI could not generate questions for this topic. Try a different topic.');
      }

      setQuestions(data.questions);

      // Save quiz to database
      const { data: quiz } = await supabase.from('quizzes').insert({
        user_id: user!.id,
        title: `${subjectLabel}: ${selectedTopic}`,
        difficulty,
        question_count: data.questions.length,
        status: 'in_progress',
      }).select('id').single();

      if (quiz) {
        setQuizId(quiz.id);
        for (const q of data.questions) {
          await supabase.from('questions').insert({
            quiz_id: quiz.id,
            question_type: q.question_type,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
          });
        }
      }

      toast.success(`Generated ${data.questions.length} questions!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    setSubmitted(true);
    let correct = 0;
    questions.forEach((q, i) => {
      const userAnswer = answers[i];
      if (userAnswer && userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
        correct++;
      }
    });
    const score = Math.round((correct / questions.length) * 100);

    if (quizId) {
      await supabase.from('quizzes').update({ score, status: 'completed' }).eq('id', quizId);
    }

    // Award XP
    if (user) {
      await supabase.from('study_sessions').insert({
        user_id: user.id,
        minutes_studied: 10,
        activity_type: 'quiz',
      });
      const { data: profile } = await supabase.from('profiles').select('xp, streak_count, last_study_date').eq('id', user.id).maybeSingle();
      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        const wasYesterday = profile.last_study_date === new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = profile.last_study_date === today ? profile.streak_count : (wasYesterday ? profile.streak_count + 1 : 1);
        await supabase.from('profiles').update({
          xp: profile.xp + correct * 10,
          streak_count: newStreak,
          last_study_date: today,
        }).eq('id', user.id);
      }
    }

    toast.success(`Quiz complete! You scored ${score}%`);
  };

  const retryIncorrect = () => {
    const incorrectIndices = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => answers[i]?.toLowerCase().trim() !== q.correct_answer.toLowerCase().trim())
      .map(({ i }) => i);

    if (incorrectIndices.length === 0) {
      toast.success('All answers are correct!');
      return;
    }

    setAnswers((prev) => {
      const updated = { ...prev };
      incorrectIndices.forEach((i) => delete updated[i]);
      return updated;
    });
    setSubmitted(false);
    toast.info('Cleared incorrect answers. Try again!');
  };

  const score = submitted
    ? Math.round(
        (questions.filter((q, i) => answers[i]?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()).length /
          questions.length) *
          100
      )
    : 0;

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">AI Quiz Generator</h1>
          <p className="mt-1 text-muted-foreground">Choose a subject and topic, and let AI create a quiz instantly</p>
        </motion.div>

        {questions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="glass-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Choose a Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subject selection */}
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

                {/* Topic selection - animated reveal */}
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

                {/* Difficulty & question count */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Number of Questions</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Question types */}
                <div>
                  <Label>Question Types</Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {questionTypeOptions.map((type) => (
                      <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedTypes.includes(type.value)}
                          onCheckedChange={() => toggleType(type.value)}
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={generateQuiz}
                  disabled={loading || !selectedSubject || !selectedTopic}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div>
            {/* Score banner */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <Card className={cn(
                  'glass-card border-2',
                  score >= 70 ? 'border-green-500' : score >= 40 ? 'border-amber-500' : 'border-red-500'
                )}>
                  <CardContent className="p-6 text-center">
                    <Award className={cn(
                      'mx-auto mb-3 h-12 w-12',
                      score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'
                    )} />
                    <div className="text-3xl font-bold">{score}%</div>
                    <p className="mt-1 text-muted-foreground">
                      {questions.filter((q, i) => answers[i]?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()).length} / {questions.length} correct
                    </p>
                    <div className="mt-4 flex justify-center gap-3">
                      <Button variant="outline" onClick={retryIncorrect}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Incorrect
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setQuestions([]);
                        setAnswers({});
                        setSubmitted(false);
                        setQuizId(null);
                      }}>
                        New Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Questions */}
            <div className="space-y-4">
              {questions.map((q, i) => {
                const userAnswer = answers[i];
                const isCorrect = submitted && userAnswer?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
                const isWrong = submitted && userAnswer && !isCorrect;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={cn(
                      'glass-card',
                      isCorrect && 'border-green-500/50',
                      isWrong && 'border-red-500/50'
                    )}>
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start gap-3">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <Badge variant="secondary" className="mb-2">
                              {q.question_type.replace('_', ' ')}
                            </Badge>
                            <p className="font-medium">{q.question_text}</p>
                          </div>
                          {submitted && (isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : isWrong ? (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          ) : null)}
                        </div>

                        {/* Answer input based on type */}
                        {q.question_type === 'multiple_choice' ? (
                          <div className="ml-10 space-y-2">
                            {q.options.map((opt) => (
                              <label
                                key={opt}
                                className={cn(
                                  'flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors',
                                  userAnswer === opt
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                    : 'border-border hover:bg-accent',
                                  submitted && opt === q.correct_answer && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                                  submitted && userAnswer === opt && opt !== q.correct_answer && 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`q-${i}`}
                                  value={opt}
                                  checked={userAnswer === opt}
                                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                                  disabled={submitted}
                                  className="accent-blue-600"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : q.question_type === 'true_false' ? (
                          <div className="ml-10 flex gap-3">
                            {['True', 'False'].map((opt) => (
                              <label
                                key={opt}
                                className={cn(
                                  'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
                                  userAnswer === opt
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                    : 'border-border hover:bg-accent',
                                  submitted && opt === q.correct_answer && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                                  submitted && userAnswer === opt && opt !== q.correct_answer && 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`q-${i}`}
                                  value={opt}
                                  checked={userAnswer === opt}
                                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                                  disabled={submitted}
                                  className="accent-blue-600"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-10">
                            <Textarea
                              value={userAnswer || ''}
                              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                              disabled={submitted}
                              placeholder="Type your answer..."
                              className="min-h-[60px]"
                            />
                          </div>
                        )}

                        {/* Explanation */}
                        {submitted && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 ml-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3"
                          >
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium">Answer: </span>
                                <span className="text-green-600 dark:text-green-400">{q.correct_answer}</span>
                                {q.explanation && (
                                  <p className="mt-1 text-muted-foreground">{q.explanation}</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {!submitted && (
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setQuestions([]);
                  setAnswers({});
                  setQuizId(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={submitQuiz} size="lg">
                  Submit Quiz
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
