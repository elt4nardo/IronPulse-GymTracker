import { createClient } from "@/lib/supabase/server";
import { RoutinesList } from "@/components/routines-list";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(id, sets, reps, order_index, exercise:exercises(name, category))")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <RoutinesList routines={routines ?? []} />;
}
