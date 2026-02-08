import { createClient } from "@/lib/supabase/server";
import { RoutineForm } from "@/components/routine-form";
import { notFound } from "next/navigation";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: routine } = await supabase
    .from("routines")
    .select("*")
    .eq("id", id)
    .single();

  if (!routine) notFound();

  const { data: routineExercises } = await supabase
    .from("routine_exercises")
    .select("*, exercise:exercises(*)")
    .eq("routine_id", id)
    .order("order_index", { ascending: true });

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return (
    <RoutineForm
      exercises={exercises ?? []}
      routine={routine}
      routineExercises={routineExercises ?? []}
    />
  );
}
