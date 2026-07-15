/*
# ReviewAI Core Schema

Creates the full database schema for ReviewAI, an AI-powered educational platform.

## New Tables

1. `profiles` — extends auth.users with display name, avatar, XP, level, streak data
2. `subjects` — catalog of subjects (Math, Science, etc.) — public/shared
3. `lessons` — lessons within a subject — public/shared
4. `quizzes` — quizzes created by users or system
5. `questions` — questions within quizzes
6. `flashcards` — AI-generated flashcard decks and cards
7. `notes` — user notes with rich text
8. `ai_conversations` — saved AI chat conversations
9. `ai_messages` — messages within AI conversations
10. `study_sessions` — tracks study time and activity per day
11. `achievements` — catalog of badges/achievements — public/shared
12. `user_achievements` — which achievements each user has earned
13. `subscriptions` — premium/free subscription state per user

## Security

- RLS enabled on every table
- Owner-scoped CRUD on user-data tables (profiles, quizzes, questions, flashcards, notes, ai_conversations, ai_messages, study_sessions, user_achievements, subscriptions)
- Public read on catalog tables (subjects, lessons, achievements)
- All owner columns default to auth.uid()
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_count integer NOT NULL DEFAULT 0,
  last_study_date date,
  daily_goal_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- SUBJECTS (public catalog)
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '',
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_subjects" ON subjects;
CREATE POLICY "read_subjects" ON subjects FOR SELECT TO anon, authenticated USING (true);

-- LESSONS (public catalog)
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  content text DEFAULT '',
  video_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_lessons" ON lessons;
CREATE POLICY "read_lessons" ON lessons FOR SELECT TO anon, authenticated USING (true);

-- QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  difficulty text DEFAULT 'medium',
  question_count integer DEFAULT 0,
  score integer,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_quizzes" ON quizzes;
CREATE POLICY "select_own_quizzes" ON quizzes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_quizzes" ON quizzes;
CREATE POLICY "insert_own_quizzes" ON quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_quizzes" ON quizzes;
CREATE POLICY "update_own_quizzes" ON quizzes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_quizzes" ON quizzes;
CREATE POLICY "delete_own_quizzes" ON quizzes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  question_text text NOT NULL,
  options jsonb DEFAULT '[]',
  correct_answer text NOT NULL,
  explanation text DEFAULT '',
  user_answer text,
  is_correct boolean,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_questions" ON questions;
CREATE POLICY "select_own_questions" ON questions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.user_id = auth.uid())
);
DROP POLICY IF EXISTS "insert_own_questions" ON questions;
CREATE POLICY "insert_own_questions" ON questions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.user_id = auth.uid())
);
DROP POLICY IF EXISTS "update_own_questions" ON questions;
CREATE POLICY "update_own_questions" ON questions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.user_id = auth.uid())
);
DROP POLICY IF EXISTS "delete_own_questions" ON questions;
CREATE POLICY "delete_own_questions" ON questions FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.user_id = auth.uid())
);

-- FLASHCARDS
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_title text NOT NULL DEFAULT 'Untitled Deck',
  front text NOT NULL,
  back text NOT NULL,
  is_bookmarked boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  review_count integer DEFAULT 0,
  last_reviewed timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_flashcards" ON flashcards;
CREATE POLICY "select_own_flashcards" ON flashcards FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_flashcards" ON flashcards;
CREATE POLICY "insert_own_flashcards" ON flashcards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_flashcards" ON flashcards;
CREATE POLICY "update_own_flashcards" ON flashcards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_flashcards" ON flashcards;
CREATE POLICY "delete_own_flashcards" ON flashcards FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- NOTES
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_conversations" ON ai_conversations;
CREATE POLICY "select_own_ai_conversations" ON ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_own_ai_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_conversations" ON ai_conversations;
CREATE POLICY "update_own_ai_conversations" ON ai_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_own_ai_conversations" ON ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI MESSAGES
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_messages" ON ai_messages;
CREATE POLICY "select_own_ai_messages" ON ai_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid())
);
DROP POLICY IF EXISTS "insert_own_ai_messages" ON ai_messages;
CREATE POLICY "insert_own_ai_messages" ON ai_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid())
);
DROP POLICY IF EXISTS "delete_own_ai_messages" ON ai_messages;
CREATE POLICY "delete_own_ai_messages" ON ai_messages FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid())
);

-- STUDY SESSIONS
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  minutes_studied integer NOT NULL DEFAULT 0,
  activity_type text DEFAULT 'study',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_study_sessions" ON study_sessions;
CREATE POLICY "select_own_study_sessions" ON study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_study_sessions" ON study_sessions;
CREATE POLICY "insert_own_study_sessions" ON study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_study_sessions" ON study_sessions;
CREATE POLICY "update_own_study_sessions" ON study_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_study_sessions" ON study_sessions;
CREATE POLICY "delete_own_study_sessions" ON study_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ACHIEVEMENTS (public catalog)
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'award',
  xp_reward integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_achievements" ON achievements;
CREATE POLICY "read_achievements" ON achievements FOR SELECT TO anon, authenticated USING (true);

-- USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_user_achievements" ON user_achievements;
CREATE POLICY "select_own_user_achievements" ON user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_user_achievements" ON user_achievements;
CREATE POLICY "insert_own_user_achievements" ON user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_achievements" ON user_achievements;
CREATE POLICY "delete_own_user_achievements" ON user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED SUBJECTS
INSERT INTO subjects (name, slug, description, icon, color) VALUES
  ('Mathematics', 'mathematics', 'Algebra, geometry, calculus and more', 'calculator', 'blue'),
  ('Science', 'science', 'General science concepts and principles', 'atom', 'green'),
  ('English', 'english', 'Grammar, literature, and writing skills', 'book-open', 'amber'),
  ('History', 'history', 'World history, events, and civilizations', 'landmark', 'orange'),
  ('Computer Science', 'computer-science', 'Programming, algorithms, and data structures', 'code', 'cyan'),
  ('Biology', 'biology', 'Cells, genetics, ecosystems, and life sciences', 'dna', 'emerald'),
  ('Chemistry', 'chemistry', 'Elements, reactions, and molecular science', 'flask-conical', 'violet'),
  ('Physics', 'physics', 'Mechanics, energy, waves, and quantum physics', 'rocket', 'red')
ON CONFLICT (slug) DO NOTHING;

-- SEED ACHIEVEMENTS
INSERT INTO achievements (name, description, icon, xp_reward) VALUES
  ('First Steps', 'Complete your first lesson', 'footprints', 50),
  ('Quiz Master', 'Complete 10 quizzes', 'brain', 200),
  ('Streak Starter', 'Study 3 days in a row', 'flame', 100),
  ('Week Warrior', 'Study 7 days in a row', 'shield', 300),
  ('Flashcard Pro', 'Create 50 flashcards', 'layers', 150),
  ('AI Explorer', 'Have 10 AI conversations', 'sparkles', 150),
  ('Night Owl', 'Study after 10 PM', 'moon', 75),
  ('Speed Learner', 'Complete a quiz in under 5 minutes', 'zap', 100)
ON CONFLICT DO NOTHING;

-- SEED SOME LESSONS
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'Introduction to Algebra', 'intro-algebra', 'Learn the basics of algebraic expressions and equations.', 1 FROM subjects WHERE slug = 'mathematics'
ON CONFLICT DO NOTHING;
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'Linear Equations', 'linear-equations', 'Understanding and solving linear equations.', 2 FROM subjects WHERE slug = 'mathematics'
ON CONFLICT DO NOTHING;
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'Cell Structure', 'cell-structure', 'Explore the building blocks of life.', 1 FROM subjects WHERE slug = 'biology'
ON CONFLICT DO NOTHING;
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'Introduction to Programming', 'intro-programming', 'Learn fundamental programming concepts.', 1 FROM subjects WHERE slug = 'computer-science'
ON CONFLICT DO NOTHING;
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'Chemical Bonds', 'chemical-bonds', 'Understanding ionic, covalent, and metallic bonds.', 1 FROM subjects WHERE slug = 'chemistry'
ON CONFLICT DO NOTHING;
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'Newton''s Laws of Motion', 'newtons-laws', 'The three fundamental laws of classical mechanics.', 1 FROM subjects WHERE slug = 'physics'
ON CONFLICT DO NOTHING;
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'Essay Writing', 'essay-writing', 'Master the art of writing compelling essays.', 1 FROM subjects WHERE slug = 'english'
ON CONFLICT DO NOTHING;
INSERT INTO lessons (subject_id, title, slug, content, order_index)
SELECT id, 'World War II', 'world-war-2', 'A comprehensive overview of WWII.', 1 FROM subjects WHERE slug = 'history'
ON CONFLICT DO NOTHING;
