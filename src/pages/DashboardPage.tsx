import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Trophy, Zap, TrendingUp, Brain, FileQuestion, Layers, StickyNote, BarChart3, BookOpen, Target } from 'lucide-react'
import { supabase, type Subject, type StudySession, type Recommendation } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export function DashboardPage() {
  const { user, profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [quizCount, setQuizCount] = useState(0)
  void quizCount

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    const [subjectsRes, sessionsRes, recsRes, quizRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('study_sessions').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('recommendations').select('*, subjects(name)').order('priority'),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }),
    ])

    setSubjects(subjectsRes.data || [])
    setSessions(sessionsRes.data || [])
    setRecommendations(recsRes.data || [])
    setQuizCount(quizRes.count || 0)
  }

  const avgProficiency = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + s.proficiency, 0) / subjects.length)
    : 0

  const stats = [
    { icon: Flame, label: 'Day Streak', value: profile?.streak_count || 0, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Trophy, label: 'Level', value: profile?.level || 1, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Zap, label: 'Total XP', value: profile?.xp || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: TrendingUp, label: 'Avg. Score', value: `${avgProficiency}%`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ]

  const quickActions = [
    { icon: Brain, label: 'AI Tutor', href: '/ai-tutor', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: FileQuestion, label: 'Quiz Generator', href: '/quiz-generator', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Layers, label: 'Flashcards', href: '/flashcards', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: StickyNote, label: 'Notes', href: '/notes', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { icon: BookOpen, label: 'Subjects', href: '/subjects', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ]

  const priorityColors: Record<string, string> = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-amber-500/30 bg-amber-500/5',
    low: 'border-blue-500/30 bg-blue-500/5',
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">Here's your learning progress.</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-extrabold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.bg} transition-transform group-hover:scale-110`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Subjects Progress */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Subject Progress</h2>
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div key={subject.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{subject.name}</span>
                    <span className="text-muted-foreground">{subject.proficiency}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${subject.proficiency}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI Recommendations</h2>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-xl border p-4 ${priorityColors[rec.priority] || priorityColors.medium}`}
                >
                  <h3 className="text-sm font-semibold">{rec.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{rec.description}</p>
                  <div className="mt-2">
                    <span className={`text-xs font-medium uppercase ${
                      rec.priority === 'high' ? 'text-red-500' :
                      rec.priority === 'medium' ? 'text-amber-500' :
                      'text-blue-500'
                    }`}>
                      {rec.priority} priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity. Start studying to see your progress here!</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      {session.activity_type === 'quiz' ? <FileQuestion className="h-4 w-4 text-primary" /> :
                       session.activity_type === 'flashcard' ? <Layers className="h-4 w-4 text-primary" /> :
                       <BookOpen className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="font-medium capitalize">{session.activity_type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{session.minutes_studied} min</span>
                    <span>{new Date(session.session_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
