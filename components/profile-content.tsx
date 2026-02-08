"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileContent({
  profile,
  email,
  totalWorkouts,
  totalRoutines,
}: {
  profile: Profile | null;
  email: string;
  totalWorkouts: number;
  totalRoutines: number;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null })
        .eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary mb-3">
          <span className="text-2xl font-bold">
            {(displayName || email || "U").charAt(0).toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      {/* Edit name */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalWorkouts}</p>
          <p className="text-[11px] text-muted-foreground">Workouts</p>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalRoutines}</p>
          <p className="text-[11px] text-muted-foreground">Routines</p>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {profile?.created_at
              ? Math.floor(
                  (Date.now() - new Date(profile.created_at).getTime()) / 86400000
                )
              : 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Days Active</p>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        Sign Out
      </button>
    </main>
  );
}
