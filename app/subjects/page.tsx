'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calculator, Atom, BookOpen, Landmark, Code, Dna,
  FlaskConical, Rocket, ArrowRight, FileText, Layers, Video,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  'calculator': Calculator, 'atom': Atom, 'book-open': BookOpen,
  'landmark': Landmark, 'code': Code, 'dna': Dna,
  'flask-conical': FlaskConical, 'rocket': Rocket,
};

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-emerald-600',
  amber: 'from-amber-500 to-orange-500',
  orange: 'from-orange-500 to-red-500',
  cyan: 'from-cyan-500 to-blue-500',
  emerald: 'from-emerald-500 to-teal-600',
  violet: 'from-violet-500 to-purple-600',
  red: 'from-red-500 to-rose-600',
};

type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
};

type Lesson = {
  id: string;
  subject_id: string;
  title: string;
  slug: string;
  content: string;
  order_index: number;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('lessons').select('*').order('order_index'),
    ]).then(([subjectsRes, lessonsRes]) => {
      setSubjects(subjectsRes.data || []);
      const lessonMap: Record<string, Lesson[]> = {};
      (lessonsRes.data || []).forEach((lesson: Lesson) => {
        if (!lessonMap[lesson.subject_id]) lessonMap[lesson.subject_id] = [];
        lessonMap[lesson.subject_id].push(lesson);
      });
      setLessons(lessonMap);
      setLoading(false);
    });
  }, []);

  if (selectedSubject) {
    const subjectLessons = lessons[selectedSubject.id] || [];
    const Icon = iconMap[selectedSubject.icon] || BookOpen;

    return (
      <AppLayout>
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedSubject(null)}
            className="mb-6"
          >
            ← Back to Subjects
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-4"
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${colorMap[selectedSubject.color]} text-white shadow-lg`}>
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{selectedSubject.name}</h1>
              <p className="text-muted-foreground">{selectedSubject.description}</p>
            </div>
          </motion.div>

          {/* Quick actions */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Link href="/ai-tutor">
              <Card className="glass-card cursor-pointer p-4 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium">Practice Questions</div>
                    <div className="text-xs text-muted-foreground">AI-generated</div>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/flashcards">
              <Card className="glass-card cursor-pointer p-4 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <Layers className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-medium">Flashcards</div>
                    <div className="text-xs text-muted-foreground">Smart review</div>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/ai-tutor">
              <Card className="glass-card cursor-pointer p-4 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                    <Video className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <div className="font-medium">AI Explanation</div>
                    <div className="text-xs text-muted-foreground">Ask anything</div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Lessons */}
          <h2 className="mb-4 text-xl font-bold">Lessons</h2>
          {subjectLessons.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>No lessons available yet for this subject.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjectLessons.map((lesson, i) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <CardContent className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium">{lesson.title}</div>
                          {lesson.content && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {lesson.content}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Lesson</Badge>
                        <Link href="/ai-tutor">
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold md:text-3xl">Subjects</h1>
          <p className="mt-1 text-muted-foreground">Explore subjects and start learning</p>
        </motion.div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {subjects.map((subject, i) => {
              const Icon = iconMap[subject.icon] || BookOpen;
              const lessonCount = (lessons[subject.id] || []).length;
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedSubject(subject)}
                >
                  <Card className="glass-card group h-full cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colorMap[subject.color]} text-white shadow-lg transition-transform group-hover:scale-110`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mb-1 text-lg font-semibold">{subject.name}</h3>
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{lessonCount} lessons</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
