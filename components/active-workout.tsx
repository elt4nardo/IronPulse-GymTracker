"use client";

import { createClient } from "@/lib/supabase/client";
import type { Exercise, Routine, RoutineExercise } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface RoutineWithExercises extends Routine {
  routine_exercises: (RoutineExercise & { exercise: Exercise })[];
}

interface SetState {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export function ActiveWorkout({
  routine,
  onFinish,
}: {
  routine: RoutineWithExercises;
  onFinish: () => void;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sets, setSets] = useState<SetState[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const startTimeRef = useRef<Date>(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize sets from routine
  useEffect(() => {
    const initialSets: SetState[] = [];
    routine.routine_exercises
      .sort((a, b) => a.order_index - b.order_index)
      .forEach((re) => {
        for (let s = 1; s <= re.sets; s++) {
          initialSets.push({
            exerciseId: re.exercise_id,
            exerciseName: re.exercise?.name ?? "Unknown",
            setNumber: s,
            reps: re.reps,
            weight: 0,
            completed: false,
          });
        }
      });
    setSets(initialSets);
  }, [routine]);

  // Create session in DB
  useEffect(() => {
    async function createSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          routine_id: routine.id,
          started_at: new Date().toISOString(),
          status: "in_progress",
        })
        .select("id")
        .single();

      if (data) setSessionId(data.id);
    }
    createSession();
  }, [routine.id]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function toggleSet(index: number) {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], completed: !newSets[index].completed };
    setSets(newSets);
  }

  function updateSetField(index: number, field: "reps" | "weight", value: number) {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: Math.max(0, value) };
    setSets(newSets);
  }

  const completedSets = sets.filter((s) => s.completed).length;
  const totalSets = sets.length;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const handleFinish = useCallback(async () => {
    if (!sessionId) return;
    setSaving(true);
    const supabase = createClient();

    try {
      // Save all session exercises
      const exerciseRows = sets.map((s) => ({
        session_id: sessionId,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        reps_completed: s.completed ? s.reps : null,
        weight: s.weight > 0 ? s.weight : null,
        completed: s.completed,
      }));

      await supabase.from("session_exercises").insert(exerciseRows);

      // Update session
      const endTime = new Date();
      await supabase
        .from("workout_sessions")
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: Math.floor(
            (endTime.getTime() - startTimeRef.current.getTime()) / 1000
          ),
          status: "completed",
        })
        .eq("id", sessionId);

      router.push("/dashboard");
      router.refresh();
    } catch {
      setSaving(false);
    }
  }, [sessionId, sets, router]);

  const handleCancel = useCallback(async () => {
    if (!confirm("Cancel this workout? Progress will be lost.")) return;
    if (sessionId) {
      const supabase = createClient();
      await supabase
        .from("workout_sessions")
        .update({ status: "cancelled", ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }
    onFinish();
  }, [sessionId, onFinish]);

  // Group sets by exercise
  const exerciseGroups: { exerciseName: string; sets: (SetState & { globalIndex: number })[] }[] = [];
  let currentGroup: { exerciseName: string; sets: (SetState & { globalIndex: number })[] } | null = null;

  sets.forEach((set, index) => {
    if (!currentGroup || currentGroup.exerciseName !== set.exerciseName) {
      currentGroup = { exerciseName: set.exerciseName, sets: [] };
      exerciseGroups.push(currentGroup);
    }
    currentGroup.sets.push({ ...set, globalIndex: index });
  });

  return (
    <main className="mx-auto max-w-lg px-4 pt-4">
      {/* Workout header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-foreground">{routine.name}</h1>
          <span className="text-2xl font-mono font-bold text-primary tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {completedSets} of {totalSets} sets completed
        </p>
      </div>

      {/* Exercise groups */}
      <div className="flex flex-col gap-4 mb-6">
        {exerciseGroups.map((group) => (
          <div key={group.exerciseName} className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-3">{group.exerciseName}</h3>

            {/* Header row */}
            <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 mb-2 px-1">
              <span className="text-[10px] font-medium text-muted-foreground text-center">SET</span>
              <span className="text-[10px] font-medium text-muted-foreground text-center">REPS</span>
              <span className="text-[10px] font-medium text-muted-foreground text-center">KG</span>
              <span className="sr-only">Done</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {group.sets.map((set) => (
                <div
                  key={set.globalIndex}
                  className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center rounded-lg px-1 py-2 transition-colors ${
                    set.completed ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="text-xs font-medium text-muted-foreground text-center">
                    {set.setNumber}
                  </span>
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) =>
                      updateSetField(set.globalIndex, "reps", parseInt(e.target.value) || 0)
                    }
                    className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-center text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) =>
                      updateSetField(set.globalIndex, "weight", parseFloat(e.target.value) || 0)
                    }
                    className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-center text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => toggleSet(set.globalIndex)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                      set.completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-muted-foreground hover:border-primary"
                    }`}
                    aria-label={set.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {set.completed && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleCancel}
          className="flex-1 rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={handleFinish}
          disabled={saving || completedSets === 0}
          className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Finish Workout"}
        </button>
      </div>
    </main>
  );
}
