import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">Thinky</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Study smarter with AI-powered personalized learning.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ai-tutor" className="hover:text-foreground">AI Tutor</Link></li>
              <li><Link to="/quiz-generator" className="hover:text-foreground">Quiz Generator</Link></li>
              <li><Link to="/flashcards" className="hover:text-foreground">Flashcards</Link></li>
              <li><Link to="/analytics" className="hover:text-foreground">Analytics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Subjects</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/subjects" className="hover:text-foreground">All Subjects</Link></li>
              <li><span className="hover:text-foreground cursor-pointer">Mathematics</span></li>
              <li><span className="hover:text-foreground cursor-pointer">Science</span></li>
              <li><span className="hover:text-foreground cursor-pointer">History</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/#faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link to="/#pricing" className="hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          &copy; 2026 Thinky. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
