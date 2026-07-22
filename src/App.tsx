import { useEffect, useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calculator,
  Atom,
  BookOpen,
  FlaskConical,
  Dna,
  Rocket,
  Code,
  Landmark,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import type { Subject, Recommendation } from './types'

const iconMap: Record<string, LucideIcon> = {
  calculator: Calculator,
  atom: Atom,
  'book-open': BookOpen,
  'flask-conical': FlaskConical,
  dna: Dna,
  rocket: Rocket,
  code: Code,
  landmark: Landmark,
}

const colorMap: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'ring-blue-500' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', ring: 'ring-violet-500' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', ring: 'ring-cyan-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', ring: 'ring-orange-500' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', ring: 'ring-red-500' },
}

const priorityConfig = {
  high: { label: 'High Priority', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  medium: { label: 'Medium Priority', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { label: 'Low Priority', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

function App() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [subjectsRes, recsRes] = await Promise.all([
          supabase.from('subjects').select('*').order('name'),
          supabase.from('recommendations').select('*').order('created_at', { ascending: false }),
        ])

        if (subjectsRes.error) throw subjectsRes.error
        if (recsRes.error) throw recsRes.error

        setSubjects(subjectsRes.data || [])
        setRecommendations(recsRes.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const weakSubjects = subjects.filter((s) => s.proficiency < 50).sort((a, b) => a.proficiency - b.proficiency)
  const strongSubjects = subjects.filter((s) => s.proficiency >= 70).sort((a, b) => b.proficiency - a.proficiency)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
          <p className="text-sm font-medium text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">Something went wrong</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Study Dashboard</h1>
              <p className="text-xs text-slate-500">Your personalized learning overview</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* AI Study Recommendations */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">AI Study Recommendations</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => {
              const config = priorityConfig[rec.priority]
              const linkedSubject = subjects.find((s) => s.id === rec.course_id)
              return (
                <div
                  key={rec.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                    {linkedSubject && (
                      <span className="text-xs font-medium text-slate-400">{linkedSubject.name}</span>
                    )}
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-slate-900">{rec.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{rec.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Weak & Strong Subjects */}
        <section className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Weak Subjects */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Weak Subjects</h2>
              <span className="ml-auto text-xs font-medium text-slate-400">{weakSubjects.length} areas</span>
            </div>
            <div className="space-y-3">
              {weakSubjects.length === 0 ? (
                <p className="text-sm text-slate-400">No weak subjects — great job!</p>
              ) : (
                weakSubjects.map((subject) => {
                  const colors = colorMap[subject.color] || colorMap.blue
                  const Icon = iconMap[subject.icon] || BookOpen
                  return (
                    <div key={subject.id} className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                        <Icon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-700">{subject.name}</span>
                          <span className="text-xs font-bold text-red-600">{subject.proficiency}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-red-500 transition-all duration-500"
                            style={{ width: `${subject.proficiency}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Strong Subjects */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Strong Subjects</h2>
              <span className="ml-auto text-xs font-medium text-slate-400">{strongSubjects.length} areas</span>
            </div>
            <div className="space-y-3">
              {strongSubjects.length === 0 ? (
                <p className="text-sm text-slate-400">No strong subjects yet — keep studying!</p>
              ) : (
                strongSubjects.map((subject) => {
                  const colors = colorMap[subject.color] || colorMap.blue
                  const Icon = iconMap[subject.icon] || BookOpen
                  return (
                    <div key={subject.id} className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                        <Icon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-700">{subject.name}</span>
                          <span className="text-xs font-bold text-emerald-600">{subject.proficiency}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${subject.proficiency}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

        {/* Courses */}
        <section>
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-700" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">Your Courses</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const colors = colorMap[subject.color] || colorMap.blue
              const Icon = iconMap[subject.icon] || BookOpen
              return (
                <div
                  key={subject.id}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg}`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-slate-500" />
                  </div>
                  <h3 className="mb-1 text-base font-bold text-slate-900">{subject.name}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-500">{subject.description}</p>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Progress</span>
                    <span className="text-xs font-bold text-slate-700">{subject.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colors.text.replace('text-', 'bg-')}`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
