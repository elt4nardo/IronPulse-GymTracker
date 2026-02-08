import { createClient } from "@/lib/supabase/server";
import { RoutineForm } from "@/components/routine-form";

export default async function NewRoutinePage() {
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return <RoutineForm exercises={exercises ?? []} />;
}
