"use client";

import { createClient } from "@/lib/supabase/client";
import type { Exercise, Routine, RoutineExercise } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string;
  category: string;
  sets: number;
  reps: number;
}

export function RoutineForm({
  exercises,
  routine,
  routineExercises,
}: {
  exercises: Exercise[];
  routine?: Routine;
  routineExercises?: (RoutineExercise & { exercise: Exercise })[];
}) {
  const router = useRouter();
  const [name, setName] = useState(routine?.name ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [entries, setEntries] = useState<ExerciseEntry[]>(
    routineExercises?.map((re) => ({
      exerciseId: re.exercise_id,
      exerciseName: re.exercise?.name ?? "",
      category: re.exercise?.category ?? "",
      sets: re.sets,
      reps: re.reps,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", ...new Set(exercises.map((e) => e.category))];

  const filteredExercises =
    filterCategory === "All"
      ? exercises
      : exercises.filter((e) => e.category === filterCategory);

  function addExercise(exercise: Exercise) {
    setEntries([
      ...entries,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        sets: 3,
        reps: 10,
      },
    ]);
    setShowExercisePicker(false);
  }

  function removeExercise(index: number) {
    setEntries(entries.filter((_, i) => i !== index));
  }

  function moveExercise(index: number, direction: "up" | "down") {
    const newEntries = [...entries];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newEntries.length) return;
    [newEntries[index], newEntries[targetIndex]] = [newEntries[targetIndex], newEntries[index]];
    setEntries(newEntries);
  }

  function updateEntry(index: number, field: "sets" | "reps", value: number) {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: Math.max(1, value) };
    setEntries(newEntries);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Routine name is required");
      return;
    }
    if (entries.length === 0) {
      setError("Add at least one exercise");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      let routineId = routine?.id;

      if (routine) {
        await supabase
          .from("routines")
          .update({ name: name.trim(), description: description.trim() || null, updated_at: new Date().toISOString() })
          .eq("id", routine.id);

        await supabase.from("routine_exercises").delete().eq("routine_id", routine.id);
      } else {
        const { data, error: insertError } = await supabase
          .from("routines")
          .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null })
          .select("id")
          .single();

        if (insertError) throw insertError;
        routineId = data.id;
      }

      const exerciseRows = entries.map((entry, i) => ({
        routine_id: routineId!,
        exercise_id: entry.exerciseId,
        sets: entry.sets,
        reps: entry.reps,
        order_index: i,
      }));

      const { error: exError } = await supabase
        .from("routine_exercises")
        .insert(exerciseRows);

      if (exError) throw exError;

      router.push("/routines");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save routine");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Go back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-foreground">
          {routine ? "Edit Routine" : "New Routine"}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Name & Description */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Routine Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day, Leg Day"
            className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Exercises ({entries.length})
        </h2>
        <button
          onClick={() => setShowExercisePicker(true)}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Exercise
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center mb-6">
          <p className="text-sm text-muted-foreground">
            No exercises added yet. Tap &quot;Add Exercise&quot; to begin.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {entries.map((entry, index) => (
            <div
              key={`${entry.exerciseId}-${index}`}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground text-sm">{entry.exerciseName}</p>
                  <p className="text-[11px] text-muted-foreground">{entry.category}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveExercise(index, "up")}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
                    aria-label="Move up"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveExercise(index, "down")}
                    disabled={index === entries.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
                    aria-label="Move down"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeExercise(index)}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label="Remove exercise"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-muted-foreground mb-1 block">Sets</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateEntry(index, "sets", entry.sets - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-muted transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-foreground">
                      {entry.sets}
                    </span>
                    <button
                      onClick={() => updateEntry(index, "sets", entry.sets + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-muted-foreground mb-1 block">Reps</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateEntry(index, "reps", entry.reps - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-muted transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-foreground">
                      {entry.reps}
                    </span>
                    <button
                      onClick={() => updateEntry(index, "reps", entry.reps + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Add Exercise</h3>
              <button
                onClick={() => setShowExercisePicker(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto flex-1 -mx-1 px-1">
              <div className="flex flex-col gap-1">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                      <p className="text-[11px] text-muted-foreground">{exercise.category}</p>
                    </div>
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
