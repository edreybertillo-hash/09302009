import { useState, useEffect } from 'react'
import { ChevronRight, BookOpen, ArrowLeft, Clock } from 'lucide-react'
import { supabase, type Subject, type Lesson } from '../lib/supabase'

const iconMap: Record<string, string> = {
  'dna': '🧬',
  'flask-conical': '⚗️',
  'code': '💻',
  'book-open': '📚',
  'landmark': '🏛️',
  'calculator': '🔢',
  'rocket': '🚀',
  'atom': '⚛️',
}

const colorMap: Record<string, string> = {
  blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400',
  emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400',
  violet: 'from-violet-500/20 to-violet-600/5 text-violet-600 dark:text-violet-400',
  cyan: 'from-cyan-500/20 to-cyan-600/5 text-cyan-600 dark:text-cyan-400',
  amber: 'from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400',
  orange: 'from-orange-500/20 to-orange-600/5 text-orange-600 dark:text-orange-400',
  red: 'from-red-500/20 to-red-600/5 text-red-600 dark:text-red-400',
  green: 'from-green-500/20 to-green-600/5 text-green-600 dark:text-green-400',
}

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({})
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [subjectsRes, lessonsRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('lessons').select('*').order('order_index'),
    ])

    const subjectsData = subjectsRes.data || []
    setSubjects(subjectsData)

    const lessonsMap: Record<string, Lesson[]> = {}
    ;(lessonsRes.data || []).forEach((lesson) => {
      if (!lessonsMap[lesson.subject_id]) lessonsMap[lesson.subject_id] = []
      lessonsMap[lesson.subject_id].push(lesson)
    })
    setLessons(lessonsMap)
  }

  if (selectedLesson) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => setSelectedLesson(null)}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {selectedSubject?.name}
          </button>
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-8">
            <h1 className="mb-4 text-2xl font-bold">{selectedLesson.title}</h1>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.content || 'Lesson content coming soon.'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedSubject) {
    const subjectLessons = lessons[selectedSubject.id] || []
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => setSelectedSubject(null)}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Subjects
          </button>

          <div className="mb-8 flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colorMap[selectedSubject.color] || colorMap.blue}`}>
              <span className="text-2xl">{iconMap[selectedSubject.icon] || '📖'}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedSubject.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedSubject.description}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">Proficiency</span>
              <span className="text-muted-foreground">{selectedSubject.proficiency}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${selectedSubject.proficiency}%` }}
              />
            </div>
          </div>

          <h2 className="mb-4 text-lg font-semibold">Lessons</h2>
          {subjectLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons available yet for this subject.</p>
          ) : (
            <div className="space-y-3">
              {subjectLessons.map((lesson, i) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-xs text-muted-foreground">Lesson {lesson.order_index}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Subjects</h1>
            <p className="text-sm text-muted-foreground">Explore subjects and start learning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const lessonCount = (lessons[subject.id] || []).length
            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className="group rounded-2xl border border-border/60 bg-card p-6 text-left transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colorMap[subject.color] || colorMap.blue}`}>
                  <span className="text-2xl">{iconMap[subject.icon] || '📖'}</span>
                </div>
                <h3 className="mb-1 font-semibold">{subject.name}</h3>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {lessonCount} lessons
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">{subject.proficiency}%</div>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${subject.proficiency}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
