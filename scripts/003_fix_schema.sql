-- Fix exercises table: rename muscle_group to category
ALTER TABLE public.exercises RENAME COLUMN muscle_group TO category;

-- Fix workout_sessions: rename completed_at to ended_at, make routine_name optional
ALTER TABLE public.workout_sessions RENAME COLUMN completed_at TO ended_at;
ALTER TABLE public.workout_sessions ALTER COLUMN routine_name DROP NOT NULL;
ALTER TABLE public.workout_sessions ALTER COLUMN routine_name DROP DEFAULT;

-- Fix session_exercises: align columns with what the app expects
-- Drop old columns and add new ones
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS exercise_name;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS target_sets;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS target_reps;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS completed_sets;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS is_completed;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS order_index;

-- Add new columns
ALTER TABLE public.session_exercises ADD COLUMN IF NOT EXISTS set_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.session_exercises ADD COLUMN IF NOT EXISTS reps_completed INTEGER;
ALTER TABLE public.session_exercises ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE public.session_exercises ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
