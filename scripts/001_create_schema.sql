-- Profiles table (auto-created on signup via trigger)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Exercises library
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_select" ON public.exercises FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "exercises_insert_own" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "exercises_update_own" ON public.exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "exercises_delete_own" ON public.exercises FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Workout routines (templates)
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routines_select_own" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "routines_insert_own" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "routines_update_own" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "routines_delete_own" ON public.routines FOR DELETE USING (auth.uid() = user_id);

-- Routine exercises (exercise order within a routine)
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routine_exercises_select" ON public.routine_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_exercises_insert" ON public.routine_exercises FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_exercises_update" ON public.routine_exercises FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "routine_exercises_delete" ON public.routine_exercises FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.routines WHERE routines.id = routine_exercises.routine_id AND routines.user_id = auth.uid()));

-- Workout sessions (completed workouts)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
  routine_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Session exercises (exercises done within a session)
CREATE TABLE IF NOT EXISTS public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps INTEGER NOT NULL,
  completed_sets INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_exercises_select" ON public.session_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = session_exercises.session_id AND workout_sessions.user_id = auth.uid()));
CREATE POLICY "session_exercises_insert" ON public.session_exercises FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = session_exercises.session_id AND workout_sessions.user_id = auth.uid()));
CREATE POLICY "session_exercises_update" ON public.session_exercises FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = session_exercises.session_id AND workout_sessions.user_id = auth.uid()));
CREATE POLICY "session_exercises_delete" ON public.session_exercises FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = session_exercises.session_id AND workout_sessions.user_id = auth.uid()));
