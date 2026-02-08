"use client";

import type { Exercise, Routine, RoutineExercise } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ActiveWorkout } from "@/components/active-workout";
import Link from "next/link";

interface RoutineWithExercises extends Routine {
  routine_exercises: (RoutineExercise & { exercise: Exercise })[];
}

function WorkoutSelectorInner({ routines }: { routines: RoutineWithExercises[] }) {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("routine");

  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(
    routines.find((r) => r.id === preselectedId) ?? null
  );
  const [isActive, setIsActive] = useState(!!preselectedId);

  if (isActive && selectedRoutine) {
    return (
      <ActiveWorkout
        routine={selectedRoutine}
        onFinish={() => {
          setIsActive(false);
          setSelectedRoutine(null);
        }}
      />
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">Start Workout</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Choose a routine to begin your session
      </p>

      {routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm text-muted-foreground mb-4">
            Create a routine first to start a workout
          </p>
          <Link
            href="/routines/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Create Routine
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {routines.map((routine) => (
            <button
              key={routine.id}
              onClick={() => {
                setSelectedRoutine(routine);
                setIsActive(true);
              }}
              className="w-full text-left rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{routine.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {routine.routine_exercises.length} exercises
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {routine.routine_exercises
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((re) => (
                    <span
                      key={re.id}
                      className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {re.exercise?.name}
                    </span>
                  ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

export function WorkoutSelector({ routines }: { routines: RoutineWithExercises[] }) {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-lg px-4 pt-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-secondary mb-6" />
          <div className="h-24 rounded-xl bg-secondary" />
        </div>
      </main>
    }>
      <WorkoutSelectorInner routines={routines} />
    </Suspense>
  );
}
