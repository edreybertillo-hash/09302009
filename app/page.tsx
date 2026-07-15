'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Brain, Sparkles, MessageSquare, FileText, Layers, BarChart3,
  BookOpen, Zap, Trophy, Clock, Target, CheckCircle2, Star,
  ChevronDown, GraduationCap, Bot,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

const features = [
  { icon: Bot, title: 'AI Tutor', description: 'Chat with an AI tutor that explains concepts step-by-step, adapts to your level, and answers follow-up questions.', color: 'from-blue-500 to-cyan-500' },
  { icon: FileText, title: 'Quiz Generator', description: 'Upload PDFs, notes, or images and let AI instantly generate multiple choice, identification, true/false, and essay questions.', color: 'from-indigo-500 to-blue-500' },
  { icon: Layers, title: 'Smart Flashcards', description: 'AI creates flashcards from your notes with spaced repetition, shuffle, bookmarks, and progress tracking.', color: 'from-emerald-500 to-teal-500' },
  { icon: BarChart3, title: 'Learning Analytics', description: 'Beautiful charts show your study time, quiz scores, weak subjects, and AI-powered recommendations.', color: 'from-amber-500 to-orange-500' },
  { icon: BookOpen, title: 'Rich Notes', description: 'Write notes with markdown, math formulas, code blocks, and tables. AI can summarize, simplify, rewrite, and translate.', color: 'from-violet-500 to-purple-500' },
  { icon: Trophy, title: 'Gamification', description: 'Earn XP, level up, unlock badges, maintain daily streaks, and complete weekly goals.', color: 'from-rose-500 to-pink-500' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'High School Student', content: 'ReviewAI completely changed how I study. The AI tutor explains things my textbook cant, and the flashcards save me hours of prep time.', rating: 5 },
  { name: 'Marcus Johnson', role: 'College Freshman', content: 'I uploaded my bio notes and got a 20-question quiz in seconds. The explanations for wrong answers are incredibly helpful.', rating: 5 },
  { name: 'Priya Patel', role: 'Graduate Student', content: 'The analytics dashboard helps me see exactly which subjects I need to focus on. My study streak is at 47 days now!', rating: 5 },
  { name: 'David Kim', role: 'Teacher', content: 'I use ReviewAI to create practice exams for my students. The question variety and quality are outstanding.', rating: 5 },
];

const faqs = [
  { q: 'What is ReviewAI?', a: 'ReviewAI is an AI-powered educational platform that provides personalized tutoring, quiz generation, flashcards, and learning analytics to help you study more effectively.' },
  { q: 'How does the AI Tutor work?', a: 'The AI tutor uses advanced language models to understand your questions and provide step-by-step explanations tailored to your grade level. It supports markdown, code formatting, and math equations.' },
  { q: 'Can I upload my own notes?', a: 'Yes! You can upload PDFs, DOCX, PPT, and image files, or paste your notes directly. AI will generate quizzes, flashcards, and study materials from your content.' },
  { q: 'Is there a free plan?', a: 'Yes, the Free plan includes limited AI chats, limited quiz generation, and basic analytics. Upgrade to Premium for unlimited access and advanced features.' },
  { q: 'What subjects are supported?', a: 'We cover Mathematics, Science, English, History, Computer Science, Biology, Chemistry, and Physics with more subjects being added regularly.' },
];

const pricingPlans = [
  {
    name: 'Free', price: '$0', period: 'forever',
    features: ['10 AI chats per day', '3 quiz generations per day', 'Basic analytics', '20 flashcards', 'Community support'],
    cta: 'Get Started', href: '/signup', highlighted: false,
  },
  {
    name: 'Premium', price: '$12', period: 'per month',
    features: ['Unlimited AI Tutor', 'Unlimited quiz generation', 'Advanced analytics', 'Unlimited flashcards', 'AI study planner', 'Priority AI responses', 'Practice exams', 'Email support'],
    cta: 'Start Free Trial', href: '/signup', highlighted: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
              AI-Powered Learning, Reimagined
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Study Smarter with{' '}
              <span className="gradient-text">AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Get personalized AI tutoring, generate quizzes from your notes, create smart flashcards,
              and track your progress with beautiful analytics. Your AI study companion.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/signup">
                  Start Learning
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/ai-tutor">
                  Try AI Tutor
                  <Bot className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No credit card needed
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Free forever plan
              </div>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="glass-card rounded-2xl p-2 shadow-2xl shadow-blue-600/10">
              <div className="rounded-xl bg-card p-6">
                <div className="flex items-center gap-2 border-b border-border pb-4">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Bot className="h-4 w-4 text-blue-500" />
                    AI Tutor
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <div className="flex justify-end">
                    <div className="max-w-md rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                      Can you explain the quadratic formula?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-lg space-y-2 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm">
                      <p className="font-medium">The Quadratic Formula</p>
                      <p>The quadratic formula solves any equation of the form ax² + bx + c = 0:</p>
                      <div className="rounded-lg bg-background p-3 text-center font-mono text-base">
                        x = (-b ± √(b² - 4ac)) / 2a
                      </div>
                      <p>Here&apos;s how to use it step by step:</p>
                      <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
                        <li>Identify a, b, and c from your equation</li>
                        <li>Plug them into the formula</li>
                        <li>Simplify to find x</li>
                      </ol>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Ask a follow-up question...</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: GraduationCap, value: '50K+', label: 'Active Students' },
              { icon: FileText, value: '1M+', label: 'Quizzes Generated' },
              { icon: Layers, value: '500K+', label: 'Flashcards Created' },
              { icon: Star, value: '4.9/5', label: 'User Rating' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                <div className="text-2xl font-bold md:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to ace your studies
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful AI tools designed to help you learn faster, retain more, and stay motivated.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group glass-card rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Loved by students worldwide
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what our community has to say about ReviewAI.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, upgrade when you&apos;re ready.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? 'glass-card border-2 border-blue-500 shadow-2xl shadow-blue-600/10'
                  : 'glass-card'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                size="lg"
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Frequently asked questions
            </h2>
          </motion.div>

          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q} className="glass-card rounded-xl px-6">
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 px-8 py-16 text-center text-white md:py-24"
        >
          <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to study smarter?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Join thousands of students who are learning faster with AI.
            </p>
            <Button size="lg" variant="secondary" className="mt-8 h-12 px-8 text-base" asChild>
              <Link href="/signup">
                Get Started Free
                <Sparkles className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
