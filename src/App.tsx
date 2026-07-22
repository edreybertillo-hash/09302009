import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './lib/auth'
import { useTheme } from './lib/theme'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { AITutorPage } from './pages/AITutorPage'
import { QuizGeneratorPage } from './pages/QuizGeneratorPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { DashboardPage } from './pages/DashboardPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { NotesPage } from './pages/NotesPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function AppContent() {
  useTheme()
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/ai-tutor" element={<ProtectedRoute><AITutorPage /></ProtectedRoute>} />
        <Route path="/quiz-generator" element={<ProtectedRoute><QuizGeneratorPage /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  )
}
