import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type Profile = {
  id: string
  email: string
  full_name: string
  avatar_url: string
  xp: number
  level: number
  streak_count: number
  last_study_date: string | null
  daily_goal_minutes: number
  created_at: string
  updated_at: string
  role: string
}

export type Subject = {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  created_at: string
  proficiency: number
  progress: number
}

export type Lesson = {
  id: string
  subject_id: string
  title: string
  slug: string
  content: string
  video_url: string
  order_index: number
  created_at: string
}

export type Quiz = {
  id: string
  user_id: string
  title: string
  subject_id: string
  difficulty: string
  question_count: number
  score: number | null
  status: string
  created_at: string
}

export type Question = {
  id: string
  quiz_id: string
  question_type: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
  user_answer: string | null
  is_correct: boolean | null
  created_at: string
}

export type Flashcard = {
  id: string
  user_id: string
  deck_title: string
  front: string
  back: string
  is_bookmarked: boolean
  is_favorite: boolean
  review_count: number
  last_reviewed: string | null
  created_at: string
}

export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  subject_id: string
  created_at: string
  updated_at: string
}

export type AIConversation = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export type AIMessage = {
  id: string
  conversation_id: string
  role: string
  content: string
  created_at: string
}

export type StudySession = {
  id: string
  user_id: string
  session_date: string
  minutes_studied: number
  activity_type: string
  created_at: string
}

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  xp_reward: number
  created_at: string
}

export type UserAchievement = {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
}

export type Subscription = {
  id: string
  user_id: string
  plan: string
  status: string
  started_at: string
  expires_at: string | null
  created_at: string
}

export type Recommendation = {
  id: string
  title: string
  description: string
  course_id: string
  priority: string
  created_at: string
}
