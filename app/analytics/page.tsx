'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Clock, TrendingUp, Award, Target, Flame, Zap, Brain,
  Sparkles, BookOpen, CheckCircle2,
} from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', user.id).order('session_date', { ascending: true }).limit(30),
      supabase.from('quizzes').select('*').eq('user_id', user.id).eq('status', 'completed').order('created_at', { ascending: false }).limit(20),
    ]).then(([sessionsRes, quizzesRes]) => {
      setSessions(sessionsRes.data || []);
      setQuizzes(quizzesRes.data || []);
      setLoading(false);
    });
  }, [user]);

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const session = sessions.find((s) => s.session_date === dateStr);
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      minutes: session?.minutes_studied || 0,
    };
  });

  const quizScoreData = quizzes.slice(0, 10).reverse().map((q, i) => ({
    quiz: `Q${i + 1}`,
    score: q.score || 0,
  }));

  const subjectDistribution = [
    { name: 'Math', value: 35 },
    { name: 'Science', value: 25 },
    { name: 'English', value: 15 },
    { name: 'History', value: 10 },
    { name: 'CS', value: 15 },
  ];

  const completionData = [
    { name: 'Completion', value: 68, fill: '#3b82f6' },
  ];

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes_studied, 0);
  const avgScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.score || 0), 0) / quizzes.length)
    : 0;

  const stats = [
    { label: 'Total Study Time', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, icon: Clock, color: 'from-blue-500 to-cyan-500' },
    { label: 'Average Score', value: `${avgScore}%`, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
    { label: 'Current Streak', value: `${profile?.streak_count || 0} days`, icon: Flame, color: 'from-orange-500 to-amber-500' },
    { label: 'Total XP', value: profile?.xp || 0, icon: Zap, color: 'from-violet-500 to-purple-500' },
  ];

  const weakSubjects = [
    { subject: 'Physics', score: 45, recommendation: 'Focus on Newton\'s Laws and energy conservation' },
    { subject: 'Chemistry', score: 52, recommendation: 'Review chemical bonding and reactions' },
  ];

  const strongSubjects = [
    { subject: 'Mathematics', score: 92 },
    { subject: 'Biology', score: 88 },
    { subject: 'English', score: 85 },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Learning Analytics</h1>
          <p className="mt-1 text-muted-foreground">Track your progress and get AI-powered recommendations</p>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-5">
                  <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Study time chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Daily Study Time (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="minutes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz scores chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Quiz Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quizScoreData.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="mb-2 h-10 w-10 opacity-50" />
                    <p>No quiz data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={quizScoreData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="quiz" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-violet-500" />
                  Subject Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={subjectDistribution}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {subjectDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3">
                  {subjectDistribution.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                      {s.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completion */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-blue-500" />
                  Course Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart data={completionData} innerRadius="60%" outerRadius="100%" startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={10} fill="#3b82f6" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="-mt-32 text-center">
                  <div className="text-3xl font-bold">68%</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Weak & Strong subjects */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Weak subjects */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-red-500" />
                  Weak Subjects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weakSubjects.map((s) => (
                  <div key={s.subject}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{s.subject}</span>
                      <span className="text-red-500">{s.score}%</span>
                    </div>
                    <Progress value={s.score} className="h-2 mb-2" />
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{s.recommendation}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Strong subjects */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-green-500" />
                  Strong Subjects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {strongSubjects.map((s) => (
                  <div key={s.subject}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {s.subject}
                      </span>
                      <span className="text-green-500">{s.score}%</span>
                    </div>
                    <Progress value={s.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-blue-500" />
                AI Study Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { text: 'Your Physics scores are trending down. Spend 30 minutes reviewing Newton\'s Laws this week.', priority: 'High' },
                { text: 'You\'re doing great in Math! Try harder problems to push your limits.', priority: 'Medium' },
                { text: 'Consider creating flashcards for Chemistry formulas to boost retention.', priority: 'Low' },
                { text: 'Your study streak is impressive! Try studying at the same time each day for consistency.', priority: 'Tip' },
              ].map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 p-3">
                  <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-950/30' :
                    rec.priority === 'Medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30' :
                    'bg-blue-100 text-blue-600 dark:bg-blue-950/30'
                  }`}>
                    {rec.priority[0]}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">{rec.priority} Priority</div>
                    <p className="text-sm">{rec.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
