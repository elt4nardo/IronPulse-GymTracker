import { createClient } from "@/lib/supabase/server";
import { StatsContent } from "@/components/stats-content";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*, routine:routines(name)")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .order("started_at", { ascending: false });

  return <StatsContent sessions={sessions ?? []} />;
}
