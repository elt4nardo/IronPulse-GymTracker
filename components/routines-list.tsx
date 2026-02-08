"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface RoutineWithExercises {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  routine_exercises: {
    id: string;
    sets: number;
    reps: number;
    order_index: number;
    exercise: { name: string; category: string } | null;
  }[];
}

export function RoutinesList({ routines }: { routines: RoutineWithExercises[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this routine?")) return;
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("routine_exercises").delete().eq("routine_id", id);
    await supabase.from("routines").delete().eq("id", id);
    router.refresh();
    setDeleting(null);
  }

  return (
    <main className="mx-auto max-w-lg px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Routines</h1>
        <Link
          href="/routines/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm text-muted-foreground mb-4">
            No routines yet. Create your first workout routine!
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
            <div
              key={routine.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {routine.name}
                  </h3>
                  {routine.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {routine.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Link
                    href={`/routines/${routine.id}/edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    aria-label="Edit routine"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(routine.id)}
                    disabled={deleting === routine.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    aria-label="Delete routine"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {routine.routine_exercises
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((re) => (
                    <span
                      key={re.id}
                      className="rounded-md bg-secondary px-2 py-1 text-[11px] text-muted-foreground"
                    >
                      {re.exercise?.name} ({re.sets}x{re.reps})
                    </span>
                  ))}
              </div>

              <Link
                href={`/workout?routine=${routine.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Start Workout
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
