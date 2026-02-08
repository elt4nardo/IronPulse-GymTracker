"use client";

import type { Profile, Routine, WorkoutSession, StreakInfo } from "@/lib/types";
import Link from "next/link";
import { useMemo } from "react";

function calculateStreaks(sessions: WorkoutSession[]): StreakInfo {
  const now = new Date();
  const completedDates = sessions
    .filter((s) => s.status === "completed" && s.started_at)
    .map((s) => {
      const d = new Date(s.started_at);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    });

  const uniqueDates = [...new Set(completedDates)].sort((a, b) => b - a);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 86400000;

  if (uniqueDates.length > 0) {
    const lastWorkout = uniqueDates[0];
    const daysSinceLast = Math.floor((today - lastWorkout) / oneDayMs);

    if (daysSinceLast <= 1) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = uniqueDates[i - 1] - uniqueDates[i];
        if (diff === oneDayMs) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = uniqueDates[i - 1] - uniqueDates[i];
      if (diff === oneDayMs) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalWorkouts: sessions.length,
    workoutsThisWeek: sessions.filter(
      (s) => new Date(s.started_at) >= startOfWeek
    ).length,
    workoutsThisMonth: sessions.filter(
      (s) => new Date(s.started_at) >= startOfMonth
    ).length,
    workoutsThisYear: sessions.filter(
      (s) => new Date(s.started_at) >= startOfYear
    ).length,
  };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardContent({
  profile,
  sessions,
  routines,
}: {
  profile: Profile | null;
  sessions: WorkoutSession[];
  routines: Routine[];
}) {
  const streaks = useMemo(() => calculateStreaks(sessions), [sessions]);
  const recentSessions = sessions.slice(0, 5);
  const displayName = profile?.display_name || "Athlete";

  return (
    <main className="mx-auto max-w-lg px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
      </div>

      {/* Streak Card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-4xl font-bold text-primary">
              {streaks.currentStreak}
              <span className="text-lg text-muted-foreground ml-1">days</span>
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47.27.68.5 1.43.5 2.22A7.5 7.5 0 0112 23z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="flex-1 rounded-xl bg-secondary p-3 text-center">
            <p className="text-lg font-bold text-foreground">{streaks.longestStreak}</p>
            <p className="text-[11px] text-muted-foreground">Best Streak</p>
          </div>
          <div className="flex-1 rounded-xl bg-secondary p-3 text-center">
            <p className="text-lg font-bold text-foreground">{streaks.totalWorkouts}</p>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </div>
          <div className="flex-1 rounded-xl bg-secondary p-3 text-center">
            <p className="text-lg font-bold text-foreground">{streaks.workoutsThisWeek}</p>
            <p className="text-[11px] text-muted-foreground">This Week</p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      {routines.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Start
          </h2>
          <div className="flex flex-col gap-2">
            {routines.slice(0, 3).map((routine) => (
              <Link
                key={routine.id}
                href={`/workout?routine=${routine.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
              >
                <div>
                  <p className="font-medium text-foreground">{routine.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {routine.description || "Tap to start workout"}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No routines CTA */}
      {routines.length === 0 && (
        <div className="mb-6 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Create your first workout routine to get started
          </p>
          <Link
            href="/routines/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Routine
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </h2>
          {sessions.length > 0 && (
            <Link href="/stats" className="text-xs text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
        {recentSessions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No workouts yet. Start your first session!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {session.routine?.name || "Workout"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(session.started_at)}
                    {session.duration_seconds
                      ? ` - ${formatDuration(session.duration_seconds)}`
                      : ""}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--success))]/10">
                  <svg className="h-4 w-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
