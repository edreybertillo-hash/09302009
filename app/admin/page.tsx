'use client';

import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Users, BookOpen, FileText, BarChart3, Shield, Plus, Trash2,
  TrendingUp, Brain, Layers, CreditCard, Search, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  xp: number;
  streak_count: number;
  created_at: string;
};

type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
};

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalQuizzes: 0, totalFlashcards: 0, totalNotes: 0, premiumUsers: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', slug: '', description: '', icon: 'book-open', color: 'blue' });
  const [creatingSubject, setCreatingSubject] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    fetchAll();
  }, [user, profile]);

  const fetchAll = async () => {
    setDataLoading(true);
    const [usersRes, subjectsRes, quizzesRes, flashcardsRes, notesRes, subsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }),
      supabase.from('flashcards').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('plan').eq('plan', 'premium'),
    ]);

    setUsers(usersRes.data || []);
    setSubjects(subjectsRes.data || []);
    setStats({
      totalUsers: usersRes.data?.length || 0,
      totalQuizzes: quizzesRes.count || 0,
      totalFlashcards: flashcardsRes.count || 0,
      totalNotes: notesRes.count || 0,
      premiumUsers: subsRes.data?.length || 0,
    });
    setDataLoading(false);
  };

  const updateUserRole = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
      toast.error('Failed to update role');
    } else {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      toast.success('User role updated');
    }
  };

  const addSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    setCreatingSubject(true);
    const { data, error } = await supabase
      .from('subjects')
      .insert(newSubject)
      .select('*')
      .single();
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setSubjects((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Subject created');
      setNewSubject({ name: '', slug: '', description: '', icon: 'book-open', color: 'blue' });
      setShowAddSubject(false);
    }
    setCreatingSubject(false);
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      toast.error('Cannot delete subject with existing lessons');
    } else {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success('Subject deleted');
    }
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

  if (profile?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Shield className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: CreditCard, color: 'from-amber-500 to-orange-500' },
    { label: 'Quizzes Created', value: stats.totalQuizzes, icon: FileText, color: 'from-emerald-500 to-teal-500' },
    { label: 'Flashcards', value: stats.totalFlashcards, icon: Layers, color: 'from-violet-500 to-purple-500' },
    { label: 'Notes', value: stats.totalNotes, icon: BookOpen, color: 'from-rose-500 to-pink-500' },
    { label: 'Subjects', value: subjects.length, icon: Brain, color: 'from-indigo-500 to-blue-500' },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users, content, and platform analytics</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
          </TabsList>

          {/* Users tab */}
          <TabsContent value="users">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    User Management
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">User</th>
                          <th className="pb-3 pr-4 font-medium">Role</th>
                          <th className="pb-3 pr-4 font-medium">XP</th>
                          <th className="pb-3 pr-4 font-medium">Streak</th>
                          <th className="pb-3 pr-4 font-medium">Joined</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-border/40">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-semibold text-white">
                                  {(u.full_name || u.email || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">{u.full_name || 'Unnamed'}</div>
                                  <div className="text-xs text-muted-foreground">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">{u.xp}</td>
                            <td className="py-3 pr-4">{u.streak_count} days</td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {format(new Date(u.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="py-3">
                              <Select
                                value={u.role}
                                onValueChange={(v) => updateUserRole(u.id, v)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects tab */}
          <TabsContent value="subjects">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Subject Management
                  </CardTitle>
                  <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Subject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Subject</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="subj-name">Name</Label>
                          <Input
                            id="subj-name"
                            value={newSubject.name}
                            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                            placeholder="e.g. Geography"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subj-slug">Slug</Label>
                          <Input
                            id="subj-slug"
                            value={newSubject.slug}
                            onChange={(e) => setNewSubject({ ...newSubject, slug: e.target.value })}
                            placeholder="e.g. geography"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subj-desc">Description</Label>
                          <Textarea
                            id="subj-desc"
                            value={newSubject.description}
                            onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                            placeholder="Brief description of the subject"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="subj-icon">Icon (lucide name)</Label>
                            <Input
                              id="subj-icon"
                              value={newSubject.icon}
                              onChange={(e) => setNewSubject({ ...newSubject, icon: e.target.value })}
                              placeholder="book-open"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subj-color">Color</Label>
                            <Select
                              value={newSubject.color}
                              onValueChange={(v) => setNewSubject({ ...newSubject, color: v })}
                            >
                              <SelectTrigger id="subj-color">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['blue', 'green', 'amber', 'orange', 'cyan', 'emerald', 'violet', 'red'].map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button onClick={addSubject} disabled={creatingSubject} className="w-full">
                          {creatingSubject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                          Create Subject
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{subject.name}</div>
                          <div className="text-sm text-muted-foreground">{subject.description}</div>
                          <div className="mt-2 flex gap-2">
                            <Badge variant="secondary">{subject.slug}</Badge>
                            <Badge variant="outline">{subject.color}</Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSubject(subject.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="text-xl font-bold">{stats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <span className="text-sm text-muted-foreground">Premium Conversion</span>
                    <span className="text-xl font-bold">
                      {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <span className="text-sm text-muted-foreground">Total Content Items</span>
                    <span className="text-xl font-bold">{stats.totalQuizzes + stats.totalFlashcards + stats.totalNotes}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <span className="text-sm text-muted-foreground">Avg Items Per User</span>
                    <span className="text-xl font-bold">
                      {stats.totalUsers > 0
                        ? Math.round((stats.totalQuizzes + stats.totalFlashcards + stats.totalNotes) / stats.totalUsers)
                        : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    Content Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">Quizzes</span>
                    </div>
                    <span className="text-xl font-bold">{stats.totalQuizzes}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-violet-500" />
                      <span className="text-sm">Flashcards</span>
                    </div>
                    <span className="text-xl font-bold">{stats.totalFlashcards}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-rose-500" />
                      <span className="text-sm">Notes</span>
                    </div>
                    <span className="text-xl font-bold">{stats.totalNotes}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm">Subjects</span>
                    </div>
                    <span className="text-xl font-bold">{subjects.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions tab */}
          <TabsContent value="subscriptions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Subscription Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="glass-card rounded-xl p-5 text-center">
                    <div className="text-3xl font-bold text-blue-500">{stats.totalUsers - stats.premiumUsers}</div>
                    <div className="text-sm text-muted-foreground">Free Plan</div>
                  </div>
                  <div className="glass-card rounded-xl p-5 text-center">
                    <div className="text-3xl font-bold text-amber-500">{stats.premiumUsers}</div>
                    <div className="text-sm text-muted-foreground">Premium Plan</div>
                  </div>
                  <div className="glass-card rounded-xl p-5 text-center">
                    <div className="text-3xl font-bold text-emerald-500">
                      {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
