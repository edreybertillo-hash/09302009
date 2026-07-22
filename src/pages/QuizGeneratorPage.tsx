import { useState, useEffect } from 'react'
import { FileQuestion, Loader2, Check, X, RotateCcw, Sparkles, BookOpen } from 'lucide-react'
import { supabase, type Subject, type Question } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { toast } from 'sonner'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const questionTypes = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'identification', label: 'Identification' },
  { value: 'essay', label: 'Essay' },
]

export function QuizGeneratorPage() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState('5')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multiple_choice'])
  const [instructions, setInstructions] = useState('')
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  async function loadSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('name')
    setSubjects(data || [])
  }

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !==type) : [...prev, type]
    )
  }

  async function generateQuiz() {
    if (!user) return
    if (!selectedSubject || !topic) {
      toast.error('Please select a subject and a topic')
      return
    }
    if (selectedTypes.length === 0) {
      toast.error('Select at least one question type')
      return
    }

    setGenerating(true)
    setQuestions([])
    setAnswers({})
    setSubmitted(false)

    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          action: 'generate_quiz',
          subject: subjects.find((s) => s.id === selectedSubject)?.name,
          topic,
          numQuestions: parseInt(numQuestions),
          questionTypes: selectedTypes,
          additionalInstructions: instructions,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to generate quiz' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (!data.questions || data.questions.length === 0) {
        throw new Error('AI could not generate questions for this topic. Try a different topic.')
      }

      const typedQuestions: Question[] = data.questions.map((q: Record<string, unknown>, i: number) => ({
        id: `temp-${i}`,
        quiz_id: '',
        question_type: q.question_type as string,
        question_text: q.question_text as string,
        options: (q.options as string[]) || [],
        correct_answer: q.correct_answer as string,
        explanation: (q.explanation as string) || '',
        user_answer: null,
        is_correct: null,
        created_at: new Date().toISOString(),
      }))

      setQuestions(typedQuestions)

      const { data: quizData } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: `${topic} Quiz`,
          subject_id: selectedSubject,
          difficulty: 'medium',
          question_count: typedQuestions.length,
          status: 'draft',
        })
        .select('id')
        .single()

      if (quizData) {
        for (const q of typedQuestions) {
          await supabase.from('questions').insert({
            quiz_id: quizData.id,
            question_type: q.question_type,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
          })
        }
      }

      toast.success(`Generated ${typedQuestions.length} questions!`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  async function submitQuiz() {
    if (!user) return
    setSubmitted(true)

    const correctCount = questions.filter((q, i) => {
      const ans = answers[i]
      return ans && ans.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
    }).length

    const score = Math.round((correctCount / questions.length) * 100)

    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ action: 'grade_quiz', answers, questions }),
      })

    if (response.ok) {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (quizData) {
        await supabase.from('quizzes').update({ score, status: 'completed' }).eq('id', quizData.id)
      }

      await supabase.from('study_sessions').insert({
        user_id: user.id,
        minutes_studied: 10,
        activity_type: 'quiz',
      })

      const { data: profile } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single()
      if (profile) {
        const newXp = profile.xp + score
        const newLevel = Math.floor(newXp / 1000) + 1
        await supabase.from('profiles').update({ xp: newXp, level: newLevel }).eq('id', user.id)
      }
    }

    toast.success(`Quiz complete! You scored ${score}%`)
  }

  function retryIncorrect() {
    const incorrect = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q, i }) => {
        const ans = answers[i]
        return !ans || ans.toLowerCase().trim() !== q.correct_answer.toLowerCase().trim()
      })
      .map(({ i }) => i)

    if (incorrect.length === 0) {
      toast.success('All answers are correct!')
      return
    }

    setAnswers((prev) => {
      const next = { ...prev }
      incorrect.forEach((i) => delete next[i])
      return next
    })
    setSubmitted(false)
    toast.info('Cleared incorrect answers. Try again!')
  }

  const score = submitted
    ? Math.round(
        (questions.filter((q, i) => {
          const ans = answers[i]
          return ans && ans.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
        }).length / questions.length) * 100
      )
    : 0

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <FileQuestion className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Quiz Generator</h1>
            <p className="text-sm text-muted-foreground">Pick a subject and let AI create a quiz instantly</p>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-card p-8">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War II, Derivatives..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Number of Questions</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {[3, 5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Question Types</label>
                <div className="flex flex-wrap gap-2">
                  {questionTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleType(type.value)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                        selectedTypes.includes(type.value)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Additional Instructions (optional)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Focus on application questions, avoid questions about history..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <button
                onClick={generateQuiz}
                disabled={generating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating Quiz...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Quiz</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {submitted && (
              <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
                <div className="mb-2 text-4xl font-extrabold gradient-text">{score}%</div>
                <p className="text-sm text-muted-foreground">
                  {questions.filter((q, i) => {
                    const ans = answers[i]
                    return ans && ans.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
                  }).length} of {questions.length} correct
                </p>
              </div>
            )}

            {questions.map((q, i) => {
              const userAnswer = answers[i]
              const isCorrect = submitted && userAnswer?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
              const isWrong = submitted && userAnswer && userAnswer.toLowerCase().trim() !== q.correct_answer.toLowerCase().trim()

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border bg-card p-6 transition-colors ${
                    isCorrect ? 'border-green-500/50 bg-green-500/5' :
                    isWrong ? 'border-red-500/50 bg-red-500/5' :
                    'border-border/60'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <p className="font-medium">{i + 1}. {q.question_text}</p>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {q.question_type.replace('_', ' ')}
                    </span>
                  </div>

                  {q.question_type === 'multiple_choice' && q.options.length > 0 ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const selected = userAnswer === opt
                        const correct = submitted && opt === q.correct_answer
                        const wrong = submitted && selected && opt !== q.correct_answer
                        return (
                          <button
                            key={opt}
                            onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [i]: opt }))}
                            disabled={submitted}
                            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                              correct ? 'border-green-500 bg-green-500/10' :
                              wrong ? 'border-red-500 bg-red-500/10' :
                              selected ? 'border-primary bg-primary/10' :
                              'border-border hover:bg-accent'
                            } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <span className="flex-1">{opt}</span>
                            {correct && <Check className="h-4 w-4 text-green-500" />}
                            {wrong && <X className="h-4 w-4 text-red-500" />}
                          </button>
                        )
                      })}
                    </div>
                  ) : q.question_type === 'true_false' ? (
                    <div className="flex gap-2">
                      {['True', 'False'].map((opt) => {
                        const selected = userAnswer === opt
                        const correct = submitted && opt === q.correct_answer
                        const wrong = submitted && selected && opt !== q.correct_answer
                        return (
                          <button
                            key={opt}
                            onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [i]: opt }))}
                            disabled={submitted}
                            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                              correct ? 'border-green-500 bg-green-500/10' :
                              wrong ? 'border-red-500 bg-red-500/10' :
                              selected ? 'border-primary bg-primary/10' :
                              'border-border hover:bg-accent'
                            } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      value={userAnswer || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                      disabled={submitted}
                      placeholder="Type your answer..."
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  )}

                  {submitted && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                      <span className="font-medium">Answer: </span>
                      <span className="text-success">{q.correct_answer}</span>
                      {q.explanation && (
                        <p className="mt-1 text-muted-foreground">{q.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="flex gap-3">
              {!submitted ? (
                <button
                  onClick={submitQuiz}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Check className="h-4 w-4" /> Submit Quiz
                </button>
              ) : (
                <button
                  onClick={retryIncorrect}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  <RotateCcw className="h-4 w-4" /> Retry Incorrect
                </button>
              )}
              <button
                onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false) }}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                <BookOpen className="h-4 w-4" /> New Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
