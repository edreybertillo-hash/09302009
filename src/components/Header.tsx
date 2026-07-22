import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, Sun, Moon, LogOut, LayoutDashboard, Zap } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { toggleTheme } from '../lib/theme'
import { toast } from 'sonner'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const isLanding = location.pathname === '/'
  const showHeader = !['/login', '/signup'].includes(location.pathname)

  if (!showHeader) return null

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border/40 transition-all duration-300 ${
        scrolled || !isLanding ? 'bg-background/80 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Thinky</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {isLanding && (
            <>
              <Link to="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</Link>
              <Link to="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
              <Link to="/#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">FAQ</Link>
            </>
          )}
          {user && (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
              <Link to="/ai-tutor" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">AI Tutor</Link>
              <Link to="/quiz-generator" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Quizzes</Link>
              <Link to="/subjects" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Subjects</Link>
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium">{profile?.full_name || 'Account'}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                Sign In
              </Link>
              <Link to="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link to="/ai-tutor" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">AI Tutor</Link>
                <Link to="/quiz-generator" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Quizzes</Link>
                <Link to="/subjects" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Subjects</Link>
                <Link to="/flashcards" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Flashcards</Link>
                <Link to="/notes" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Notes</Link>
                <Link to="/analytics" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Analytics</Link>
                <button onClick={handleSignOut} className="rounded-md px-3 py-2 text-left text-sm font-medium text-error hover:bg-accent">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Sign In</Link>
                <Link to="/signup" className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
