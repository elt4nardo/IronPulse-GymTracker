import { createClient } from "@/lib/supabase/server";
import { WorkoutSelector } from "@/components/workout-selector";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(*, exercise:exercises(*))")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <WorkoutSelector routines={routines ?? []} />;
}
