/*
# Add admin role support

1. Modified Tables
- `profiles`: adds `role` column (text, default 'student') to distinguish admin users from students
2. Security
- No RLS policy changes needed; existing owner-scoped policies still apply
3. Notes
- The role column defaults to 'student' for all existing and new users
- Admin users will have role = 'admin'
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
