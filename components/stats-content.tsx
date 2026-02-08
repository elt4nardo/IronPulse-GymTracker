"use client";

import type { WorkoutSession, StreakInfo, WeeklyData, MonthlyData } from "@/lib/types";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
        if (uniqueDates[i - 1] - uniqueDates[i] === oneDayMs) {
          currentStreak++;
        } else break;
      }
    }
    tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i - 1] - uniqueDates[i] === oneDayMs) {
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
    workoutsThisWeek: sessions.filter((s) => new Date(s.started_at) >= startOfWeek).length,
    workoutsThisMonth: sessions.filter((s) => new Date(s.started_at) >= startOfMonth).length,
    workoutsThisYear: sessions.filter((s) => new Date(s.started_at) >= startOfYear).length,
  };
}

function getWeeklyData(sessions: WorkoutSession[]): WeeklyData[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return days.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const count = sessions.filter((s) => {
      const d = new Date(s.started_at);
      return d >= date && d < nextDate;
    }).length;

    return { day, workouts: count };
  });
}

function getMonthlyData(sessions: WorkoutSession[]): MonthlyData[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = new Date().getFullYear();

  return months.map((month, i) => {
    const count = sessions.filter((s) => {
      const d = new Date(s.started_at);
      return d.getFullYear() === year && d.getMonth() === i;
    }).length;
    return { month, workouts: count };
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function StatsContent({ sessions }: { sessions: WorkoutSession[] }) {
  const streaks = useMemo(() => calculateStreaks(sessions), [sessions]);
  const weeklyData = useMemo(() => getWeeklyData(sessions), [sessions]);
  const monthlyData = useMemo(() => getMonthlyData(sessions), [sessions]);

  const avgDuration = useMemo(() => {
    const withDuration = sessions.filter((s) => s.duration_seconds);
    if (withDuration.length === 0) return 0;
    return Math.floor(
      withDuration.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / withDuration.length
    );
  }, [sessions]);

  return (
    <main className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Statistics</h1>

      {/* Streak & Overview */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
          <p className="text-3xl font-bold text-primary">{streaks.currentStreak}</p>
          <p className="text-[11px] text-muted-foreground">days</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Best Streak</p>
          <p className="text-3xl font-bold text-foreground">{streaks.longestStreak}</p>
          <p className="text-[11px] text-muted-foreground">days</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Workouts</p>
          <p className="text-3xl font-bold text-foreground">{streaks.totalWorkouts}</p>
          <p className="text-[11px] text-muted-foreground">sessions</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Duration</p>
          <p className="text-3xl font-bold text-foreground">
            {avgDuration > 0 ? formatDuration(avgDuration) : "--"}
          </p>
          <p className="text-[11px] text-muted-foreground">per session</p>
        </div>
      </div>

      {/* Period stats */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{streaks.workoutsThisWeek}</p>
          <p className="text-[11px] text-muted-foreground">This Week</p>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{streaks.workoutsThisMonth}</p>
          <p className="text-[11px] text-muted-foreground">This Month</p>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{streaks.workoutsThisYear}</p>
          <p className="text-[11px] text-muted-foreground">This Year</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">This Week</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 15%, 18%)" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(260, 10%, 55%)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(260, 10%, 55%)", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(260, 20%, 9%)",
                  border: "1px solid hsl(260, 15%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(260, 10%, 95%)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="workouts"
                fill="hsl(263, 70%, 58%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">This Year</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(260, 15%, 18%)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(260, 10%, 55%)", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(260, 10%, 55%)", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(260, 20%, 9%)",
                  border: "1px solid hsl(260, 15%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(260, 10%, 95%)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="workouts"
                fill="hsl(280, 60%, 55%)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All sessions */}
      {sessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            All Sessions
          </h2>
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {session.routine?.name || "Workout"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(session.started_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {session.duration_seconds
                      ? ` - ${formatDuration(session.duration_seconds)}`
                      : ""}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
