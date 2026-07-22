/*
# Adapt subjects table for study dashboard

1. Modified Tables
- `subjects`: add `proficiency` (integer 0-100, default 0) and `progress` (integer 0-100, default 0) columns to support weak/strong subject tracking and course progress.
- `recommendations`: drop FK to `courses`, add FK to `subjects` instead so recommendations link to the actual course/subject data.

2. Security
- No RLS changes — existing policies remain in place.

3. Notes
- The `subjects` table already contains seeded course data (Mathematics, Science, English, etc.).
- The `courses` table from the previous migration is unused and left in place (no data, no harm).
*/

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS proficiency integer NOT NULL DEFAULT 0;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;

ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_course_id_fkey;
ALTER TABLE recommendations ADD CONSTRAINT recommendations_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES subjects(id) ON DELETE SET NULL;
