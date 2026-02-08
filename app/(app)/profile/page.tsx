import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "@/components/profile-content";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { count: totalWorkouts } = await supabase
    .from("workout_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("status", "completed");

  const { count: totalRoutines } = await supabase
    .from("routines")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  return (
    <ProfileContent
      profile={profile}
      email={user!.email ?? ""}
      totalWorkouts={totalWorkouts ?? 0}
      totalRoutines={totalRoutines ?? 0}
    />
  );
}
