import { Link } from 'react-router-dom'
import {
  Zap, Brain, FileQuestion, Layers, BarChart3, StickyNote, Trophy,
  Check, ChevronDown, Sparkles, ArrowRight, Star,
} from 'lucide-react'
import { useState } from 'react'

const features = [
  {
    icon: Brain,
    title: 'AI Tutor',
    description: 'Chat with an AI tutor that explains concepts step-by-step, adapts to your level, and answers follow-up questions.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: FileQuestion,
    title: 'Quiz Generator',
    description: 'Upload PDFs, notes, or images and let AI instantly generate multiple choice, identification, true/false, and essay questions.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Layers,
    title: 'Smart Flashcards',
    description: 'AI creates flashcards from your notes with spaced repetition, shuffle, bookmarks, and progress tracking.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: BarChart3,
    title: 'Learning Analytics',
    description: 'Beautiful charts show your study time, quiz scores, weak subjects, and AI-powered recommendations.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: StickyNote,
    title: 'Rich Notes',
    description: 'Write notes with markdown, math formulas, code blocks, and tables. AI can summarize, simplify, rewrite, and translate.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Earn XP, level up, unlock badges, maintain daily streaks, and complete weekly goals.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
]

const testimonials = [
  {
    content: 'Thinky completely changed how I study. The AI tutor explains things my textbook cant, and the flashcards save me hours of prep time.',
    author: 'Sarah K.',
    role: 'Pre-Med Student',
  },
  {
    content: 'I uploaded my bio notes and got a 20-question quiz in seconds. The explanations for wrong answers are incredibly helpful.',
    author: 'Marcus T.',
    role: 'Biology Major',
  },
  {
    content: 'The analytics dashboard helps me see exactly which subjects I need to focus on. My study streak is at 47 days now!',
    author: 'Emily R.',
    role: 'High School Senior',
  },
  {
    content: 'I use Thinky to create practice exams for my students. The question variety and quality are outstanding.',
    author: 'Dr. James L.',
    role: 'Professor',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    features: ['10 AI chats per day', '3 quiz generations per day', 'Basic analytics', '20 flashcards'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$12',
    features: ['Unlimited AI Tutor', 'Unlimited quiz generation', 'Advanced analytics', 'Unlimited flashcards', 'Priority support', 'Export notes to PDF'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
]

const faqs = [
  {
    q: 'What is Thinky?',
    a: 'Thinky is an AI-powered educational platform that provides personalized tutoring, quiz generation, flashcards, and learning analytics to help you study more effectively.',
  },
  {
    q: 'How does the AI Tutor work?',
    a: 'The AI tutor uses advanced language models to understand your questions and provide step-by-step explanations tailored to your grade level. It supports markdown, math formulas, and code blocks.',
  },
  {
    q: 'Can I upload my own notes?',
    a: 'Yes! You can upload PDFs, images, or paste your notes directly. AI will generate quizzes, flashcards, and summaries from your materials.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes, the free plan includes 10 AI chats per day, 3 quiz generations per day, limited flashcards, and basic analytics. Upgrade to Premium for unlimited access and advanced features.',
  },
  {
    q: 'What subjects are supported?',
    a: 'Thinky supports all subjects including Mathematics, Science, History, English, Computer Science, Biology, Chemistry, Physics, and more.',
  },
]

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-powered learning, personalized for you
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              Study Smarter with <span className="gradient-text">AI</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Get personalized AI tutoring, generate quizzes from your notes, create smart flashcards, and track your progress with beautiful analytics. Your AI study companion.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/ai-tutor"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-8 py-3 text-base font-semibold backdrop-blur-sm transition-all hover:bg-accent"
              >
                Try AI Tutor
              </Link>
            </div>
          </div>

          {/* Demo card */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="glass-card rounded-2xl p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">AI Tutor Demo</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                  Explain the quadratic formula with examples
                </div>
                <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm">
                  The quadratic formula solves any equation of the form ax² + bx + c = 0:
                  <br />
                  <span className="mt-2 block font-mono text-primary">x = (-b ± √(b² - 4ac)) / 2a</span>
                  <br />
                  Here's how to use it step by step:
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to ace your studies
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful AI tools designed to help you learn faster, retain more, and stay motivated.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Loved by students worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our community has to say about Thinky.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <div key={t.author} className="rounded-2xl border border-border/60 bg-card p-6">
                <p className="mb-4 text-muted-foreground">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {t.author[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-primary bg-card shadow-xl ring-2 ring-primary/20'
                    : 'border-border/60 bg-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </div>
                )}
                <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border hover:bg-accent'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="mx-auto max-w-2xl space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-muted-foreground">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center">
            <Zap className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Ready to study smarter?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of students who are learning faster with AI.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
