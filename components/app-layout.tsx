'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard, BookOpen, FileText, Layers,
  BarChart3, StickyNote, LogOut, Menu, X, Flame, Zap, Shield,
} from 'lucide-react';
import Image from 'next/image';
import { ThinkyChatbot } from '@/components/thinky-chatbot';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/quiz-generator', label: 'Quiz Generator', icon: FileText },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/ChatGPT_Image_Jul_16,_2026,_02_18_07_PM.png"
              alt="Thinky"
              width={40}
              height={40}
              className="rounded-lg ring-2 ring-border/50 shadow-md"
            />
            <span className="text-lg font-bold">Thinky</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
          {navItems.filter((item) => !item.adminOnly || profile?.role === 'admin').map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Streak & XP */}
        {profile && (
          <div className="border-t border-border/40 p-4">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3 dark:from-amber-950/20 dark:to-orange-950/20">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                  <Flame className="h-4 w-4" />
                  {profile.streak_count} day streak
                </span>
                <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                  <Zap className="h-4 w-4" />
                  {profile.xp} XP
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Level {profile.level}
              </div>
            </div>
          </div>
        )}

        {/* User */}
        <div className="border-t border-border/40 p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-medium">
                {profile?.full_name || 'Student'}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/ChatGPT_Image_Jul_16,_2026,_02_18_07_PM.png"
            alt="Thinky"
            width={40}
            height={40}
            className="rounded-lg ring-2 ring-border/50 shadow-md"
          />
          <span className="text-lg font-bold">Thinky</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-card shadow-2xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border/40 px-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                  <Image
                    src="/ChatGPT_Image_Jul_16,_2026,_02_18_07_PM.png"
                    alt="Thinky"
                    width={40}
                    height={40}
                    className="rounded-lg ring-2 ring-border/50 shadow-md"
                  />
                  <span className="text-lg font-bold">Thinky</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {navItems.filter((item) => !item.adminOnly || profile?.role === 'admin').map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-border/40 p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm font-medium">
                      {profile?.full_name || 'Student'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="hidden items-center justify-end gap-2 px-6 py-3 lg:flex">
          <ThemeToggle />
        </div>
        <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </div>
      </main>

      <ThinkyChatbot />
    </div>
  );
}
