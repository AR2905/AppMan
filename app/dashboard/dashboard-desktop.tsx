"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  Flame,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { ActivityChart } from "@/app/components/activity-chart";
import { GoalRing } from "@/app/components/goal-ring";
import {
  DAILY_GOAL,
  MONTHLY_GOAL,
  WEEKLY_GOAL,
  useDashboard,
} from "@/app/lib/use-dashboard";
import { JOB_STATUSES, type JobStatus } from "@/app/lib/job-types";

const STATUS_STYLES: Record<JobStatus, string> = {
  Saved: "bg-zinc-400",
  Applied: "bg-blue-500",
  Interview: "bg-violet-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-amber-500",
};

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            tone === "good"
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              : tone === "warn"
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export function DashboardDesktop() {
  const { loading, error, stats, reload } = useDashboard();

  if (loading || !stats) {
    return (
      <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </main>
    );
  }

  const {
    daily,
    todayCount,
    weekCount,
    monthCount,
    totalJobs,
    activeCount,
    currentStreak,
    longestStreak,
    streakAtRisk,
    bestDay,
    statusCounts,
    headline,
    subline,
    trend,
  } = stats;

  const maxStatus = Math.max(1, ...JOB_STATUSES.map((s) => statusCounts[s]));
  const todayHint =
    todayCount >= DAILY_GOAL
      ? "Daily goal reached"
      : `${DAILY_GOAL - todayCount} to reach your daily goal`;
  const bannerClass =
    todayCount === 0
      ? "from-amber-500 via-orange-500 to-rose-500"
      : "from-emerald-600 via-emerald-600 to-teal-700";

  return (
    <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Every application moves the line. Keep showing up.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          <Plus size={16} /> Log an application
        </Link>
      </header>

      {error ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold dark:border-red-800"
          >
            Retry
          </button>
        </div>
      ) : null}

      <section
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bannerClass} p-6 text-white shadow-lg`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                todayCount === 0 ? "bg-white/15" : "bg-white/20"
              }`}
            >
              <Flame
                size={24}
                className={streakAtRisk ? "text-amber-300" : "text-white"}
              />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{headline}</h2>
              <p className="mt-1 max-w-xl text-sm text-white/90">{subline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
                  {todayCount}/{DAILY_GOAL} today
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
                  {currentStreak}-day streak
                </span>
                {trend !== 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-medium">
                    {trend > 0 ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {Math.abs(trend)} vs yesterday
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <Link
            href="/jobs"
            className={`inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold transition ${
              todayCount === 0
                ? "text-orange-700 hover:bg-orange-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            Apply now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={String(todayCount)}
          hint={todayHint}
          tone={todayCount > 0 ? "good" : "warn"}
          icon={<Target size={16} />}
        />
        <StatCard
          label="This week"
          value={String(weekCount)}
          hint={`${Math.min(weekCount, WEEKLY_GOAL)}/${WEEKLY_GOAL} weekly goal`}
          tone={weekCount >= WEEKLY_GOAL ? "good" : "default"}
          icon={<CalendarCheck size={16} />}
        />
        <StatCard
          label="Current streak"
          value={`${currentStreak}d`}
          hint={
            streakAtRisk
              ? "Apply today to keep it alive"
              : currentStreak > 0
                ? `Best streak: ${longestStreak} days`
                : `Start a streak today`
          }
          tone={
            streakAtRisk ? "warn" : currentStreak > 0 ? "good" : "default"
          }
          icon={<Flame size={16} />}
        />
        <StatCard
          label="Total tracked"
          value={String(totalJobs)}
          hint={`${activeCount} active applications`}
          icon={<BriefcaseBusiness size={16} />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Application activity</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Last 30 days — one point per day
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Month: {monthCount}/{MONTHLY_GOAL}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
                  trend > 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : trend < 0
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp size={12} />
                ) : trend < 0 ? (
                  <TrendingDown size={12} />
                ) : (
                  <Activity size={12} />
                )}
                {trend > 0
                  ? `+${trend} vs yesterday`
                  : trend < 0
                    ? `${trend} vs yesterday`
                    : "Same as yesterday"}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <ActivityChart data={daily} goal={DAILY_GOAL} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            The green dot is today. A flat line today is a missed opportunity —
            log one application to lift the curve.
          </p>
        </section>

        <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Today&apos;s goal</h2>
          <GoalRing
            value={todayCount}
            goal={DAILY_GOAL}
            label={todayCount >= DAILY_GOAL ? "Goal smashed" : "In progress"}
            caption={
              todayCount >= DAILY_GOAL
                ? "Anything extra is bonus momentum."
                : `${DAILY_GOAL - todayCount} more to hit today's target.`
            }
            size={148}
          />
          <Link
            href="/jobs"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Plus size={16} /> Add application
          </Link>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pipeline breakdown</h2>
            <span className="text-xs text-zinc-500">
              {totalJobs} total applications
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {JOB_STATUSES.map((status) => {
              const count = statusCounts[status];
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">
                      {status}
                    </span>
                    <span className="text-zinc-500">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${STATUS_STYLES[status]} transition-all`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Highlights</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Trophy size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">Best day this month</p>
                <p className="text-xs text-zinc-500">
                  {bestDay.count > 0
                    ? `${bestDay.count} applications on ${bestDay.label}`
                    : "No applications yet — today could be the first."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Flame size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">Longest streak</p>
                <p className="text-xs text-zinc-500">
                  {longestStreak} {longestStreak === 1 ? "day" : "days"} in a
                  row. Your record to beat.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <CalendarCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">Weekly pace</p>
                <p className="text-xs text-zinc-500">
                  {weekCount} applications in the last 7 days. Target is{" "}
                  {WEEKLY_GOAL}.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
