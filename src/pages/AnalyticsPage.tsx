import { useState, useEffect } from 'react'
import { BarChart3, Clock, TrendingUp, Award, Flame } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase, type Subject, type StudySession, type Achievement } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export function AnalyticsPage() {
  const { user, profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<string[]>([])

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    const [subjectsRes, sessionsRes, achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('study_sessions').select('*').order('created_at', { ascending: true }),
      supabase.from('achievements').select('*'),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', user!.id),
    ])

    setSubjects(subjectsRes.data || [])
    setSessions(sessionsRes.data || [])
    setAchievements(achievementsRes.data || [])
    setUserAchievements((userAchievementsRes.data || []).map((ua) => ua.achievement_id))
  }

  const subjectData = subjects.map((s) => ({
    name: s.name,
    proficiency: s.proficiency,
  }))

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const daySessions = sessions.filter((s) => s.session_date === dateStr)
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      minutes: daySessions.reduce((sum, s) => sum + s.minutes_studied, 0),
    }
  })

  const activityTypes = ['study', 'quiz', 'flashcard'].map((type) => {
    const count = sessions.filter((s) => s.activity_type === type).length
    return { name: type, value: count }
  }).filter((d) => d.value > 0)

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes_studied, 0)
  const earnedAchievements = achievements.filter((a) => userAchievements.includes(a.id))

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
            <BarChart3 className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Learning Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your progress and stay motivated</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <Clock className="mb-2 h-5 w-5 text-blue-500" />
            <div className="text-2xl font-extrabold">{totalMinutes}</div>
            <div className="text-xs text-muted-foreground">Total Minutes</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <Flame className="mb-2 h-5 w-5 text-orange-500" />
            <div className="text-2xl font-extrabold">{profile?.streak_count || 0}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <TrendingUp className="mb-2 h-5 w-5 text-emerald-500" />
            <div className="text-2xl font-extrabold">{profile?.level || 1}</div>
            <div className="text-xs text-muted-foreground">Current Level</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <Award className="mb-2 h-5 w-5 text-amber-500" />
            <div className="text-2xl font-extrabold">{earnedAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Badges Earned</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Subject Proficiency */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Subject Proficiency</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="proficiency" radius={[4, 4, 0, 0]}>
                  {subjectData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Study Time - Last 7 Days */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Study Time — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-primary)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          {activityTypes.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Activity Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activityTypes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4">
                {activityTypes.map((type, i) => (
                  <div key={type.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="capitalize text-muted-foreground">{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Achievements</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {achievements.map((a) => {
                const earned = userAchievements.includes(a.id)
                return (
                  <div
                    key={a.id}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center ${
                      earned ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/60 opacity-50'
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      earned ? 'bg-amber-500/10' : 'bg-muted'
                    }`}>
                      <Award className={`h-5 w-5 ${earned ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.xp_reward} XP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
