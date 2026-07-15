'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Flame, Zap, Trophy, Clock, Target, TrendingUp, BookOpen,
  Bot, FileText, Layers, ArrowRight, Sparkles, Award, Brain,
} from 'lucide-react';

type StudySession = { session_date: string; minutes_studied: number };
type Quiz = { id: string; title: string; status: string; score: number | null; created_at: string };
type Achievement = { id: string; name: string; description: string; icon: string; xp_reward: number };

const iconMap: Record<string, any> = {
  footprints: Target, brain: Brain, flame: Flame, shield: Award,
  layers: Layers, sparkles: Sparkles, moon: Clock, zap: Zap,
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!user) return;

    Promise.all([
      supabase.from('study_sessions').select('session_date, minutes_studied').eq('user_id', user.id).order('session_date', { ascending: false }).limit(7),
      supabase.from('quizzes').select('id, title, status, score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('user_achievements').select('achievement_id, achievements(name, description, icon, xp_reward)').eq('user_id', user.id),
    ]).then(([sessionsRes, quizzesRes, achievementsRes]) => {
      setSessions(sessionsRes.data || []);
      setQuizzes(quizzesRes.data || []);
      const ach = (achievementsRes.data || []).map((a: any) => a.achievements).filter(Boolean);
      setAchievements(ach);
      setLoading(false);
    });
  }, [user]);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes_studied, 0);
  const completedQuizzes = quizzes.filter((q) => q.status === 'completed');
  const avgScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuizzes.length)
    : 0;
  const dailyGoal = profile?.daily_goal_minutes || 30;
  const todayMinutes = sessions.find((s) => s.session_date === new Date().toISOString().split('T')[0])?.minutes_studied || 0;
  const goalProgress = Math.min((todayMinutes / dailyGoal) * 100, 100);

  const stats = [
    { label: 'Study Streak', value: `${profile?.streak_count || 0} days`, icon: Flame, color: 'from-orange-500 to-amber-500' },
    { label: 'Total XP', value: profile?.xp || 0, icon: Zap, color: 'from-blue-500 to-indigo-500' },
    { label: 'Quizzes Taken', value: completedQuizzes.length, icon: FileText, color: 'from-emerald-500 to-teal-500' },
    { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'from-violet-500 to-purple-500' },
  ];

  const recommendations = [
    { title: 'Practice Algebra', subject: 'Mathematics', reason: 'Based on your recent quiz performance', icon: 'calculator', href: '/quiz-generator' },
    { title: 'Review Cell Structure', subject: 'Biology', reason: 'You haven\'t reviewed this in 5 days', icon: 'dna', href: '/subjects' },
    { title: 'Try AI Tutor for Physics', subject: 'Physics', reason: 'Newtons Laws needs attention', icon: 'rocket', href: '/ai-tutor' },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold md:text-3xl">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            {todayMinutes > 0
              ? `You've studied ${todayMinutes} minutes today. Keep it up!`
              : 'Ready to start learning today?'}
          </p>
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
              <Card className="glass-card overflow-hidden">
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Daily goal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-blue-500" />
                    Daily Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{todayMinutes} / {dailyGoal} minutes</span>
                    <span className="font-medium">{Math.round(goalProgress)}%</span>
                  </div>
                  <Progress value={goalProgress} className="h-3" />
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {goalProgress >= 100
                      ? 'Daily goal completed! Amazing work!'
                      : `${dailyGoal - todayMinutes} minutes left to reach your goal`}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <Link
                      key={i}
                      href={rec.href}
                      className="flex items-center justify-between rounded-xl border border-border/40 p-3 transition-all hover:bg-accent hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                          <Brain className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium">{rec.title}</div>
                          <div className="text-xs text-muted-foreground">{rec.reason}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
                      ))}
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                      <p>No activity yet. Start by taking a quiz!</p>
                      <Button asChild className="mt-4">
                        <Link href="/quiz-generator">Generate a Quiz</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-border/40 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                              <FileText className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{quiz.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(quiz.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <Badge variant={quiz.status === 'completed' ? 'default' : 'secondary'}>
                            {quiz.status === 'completed' ? `${quiz.score || 0}%` : 'In Progress'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Continue Learning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Continue Learning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, color: 'text-blue-500' },
                    { label: 'Quiz Generator', href: '/quiz-generator', icon: FileText, color: 'text-emerald-500' },
                    { label: 'Flashcards', href: '/flashcards', icon: Layers, color: 'text-amber-500' },
                    { label: 'Browse Subjects', href: '/subjects', icon: BookOpen, color: 'text-violet-500' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button variant="outline" className="w-full justify-start">
                        <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
                        {item.label}
                        <ArrowRight className="ml-auto h-4 w-4" />
                      </Button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievement Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {achievements.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      <Trophy className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>No achievements yet. Complete lessons and quizzes to earn badges!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {achievements.map((ach) => {
                        const Icon = iconMap[ach.icon] || Award;
                        return (
                          <div key={ach.id} className="flex flex-col items-center rounded-xl border border-border/40 p-3 text-center">
                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="text-xs font-medium">{ach.name}</div>
                            <div className="text-[10px] text-muted-foreground">+{ach.xp_reward} XP</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Goal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{totalMinutes} min this week</span>
                    <span className="font-medium">{Math.min(Math.round((totalMinutes / 210) * 100), 100)}%</span>
                  </div>
                  <Progress value={Math.min((totalMinutes / 210) * 100, 100)} className="h-3" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Goal: 210 minutes (30 min/day)
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
