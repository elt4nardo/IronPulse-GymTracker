export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  is_default: boolean;
  user_id: string | null;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  order_index: number;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: "in_progress" | "completed" | "cancelled";
  routine?: Routine;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight: number | null;
  completed: boolean;
  exercise?: Exercise;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  workoutsThisYear: number;
}

export interface WeeklyData {
  day: string;
  workouts: number;
}

export interface MonthlyData {
  month: string;
  workouts: number;
}
