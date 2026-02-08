import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*, routine:routines(name)")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .order("started_at", { ascending: false });

  const { data: routines } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardContent
      profile={profile}
      sessions={sessions ?? []}
      routines={routines ?? []}
    />
  );
}
