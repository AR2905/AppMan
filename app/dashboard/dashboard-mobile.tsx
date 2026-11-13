"use client";

import Link from "next/link";
import {
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

function MiniStat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "good" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-bold tracking-tight ${
          tone === "warn"
            ? "text-amber-600 dark:text-amber-400"
            : tone === "good"
              ? "text-emerald-600 dark:text-emerald-400"
              : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{hint}</p>
    </div>
  );
}

export function DashboardMobile() {
  const { loading, error, stats, reload } = useDashboard();

  if (loading || !stats) {
    return (
      <main className="flex w-full flex-1 flex-col px-4 pb-20 pt-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
        <div className="mt-4 h-56 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
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
  const recentDaily = daily.slice(-10);
  const bannerClass =
    todayCount === 0
      ? "from-amber-500 via-orange-500 to-rose-500"
      : "from-emerald-600 via-emerald-600 to-teal-700";

  return (
    <main className="flex w-full flex-1 flex-col px-4 pb-20 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Every application moves the line.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition active:opacity-80"
        >
          <Plus size={16} /> Log
        </Link>
      </header>

      {error ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold dark:border-red-800"
          >
            Retry
          </button>
        </div>
      ) : null}

      <section
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bannerClass} p-5 text-white shadow-lg`}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Flame
                size={20}
                className={streakAtRisk ? "text-amber-300" : "text-white"}
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight">{headline}</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/90">
                {subline}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
              {todayCount}/{DAILY_GOAL} today
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
              {currentStreak}-day streak
            </span>
            {trend !== 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-medium">
                {trend > 0 ? (
                  <TrendingUp size={11} />
                ) : (
                  <TrendingDown size={11} />
                )}
                {Math.abs(trend)} vs yday
              </span>
            ) : null}
          </div>

          <Link
            href="/jobs"
            className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold transition ${
              todayCount === 0
                ? "text-orange-700 active:bg-orange-50"
                : "text-emerald-700 active:bg-emerald-50"
            }`}
          >
            Apply now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-5">
          <GoalRing
            value={todayCount}
            goal={DAILY_GOAL}
            label="Today's goal"
            caption={
              todayCount >= DAILY_GOAL
                ? "Goal smashed — extra is bonus."
                : `${DAILY_GOAL - todayCount} more to hit the target.`
            }
            size={116}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Momentum
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {todayCount > 0
                ? `${todayCount} logged today. ${
                    todayCount >= DAILY_GOAL
                      ? "You showed up — keep stacking wins."
                      : "You're moving. Finish strong."
                  }`
                : "Zero so far. The first application is the hardest — and the most rewarding."}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {weekCount}/{WEEKLY_GOAL} week
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {monthCount}/{MONTHLY_GOAL} month
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat
          label="This week"
          value={String(weekCount)}
          hint={`Goal ${WEEKLY_GOAL}`}
          tone={weekCount >= WEEKLY_GOAL ? "good" : "default"}
        />
        <MiniStat
          label="Streak"
          value={`${currentStreak}d`}
          hint={
            streakAtRisk
              ? "Apply today to keep it"
              : `Best ${longestStreak} days`
          }
          tone={streakAtRisk ? "warn" : currentStreak > 0 ? "good" : "default"}
        />
        <MiniStat
          label="Total tracked"
          value={String(totalJobs)}
          hint={`${activeCount} active`}
        />
        <MiniStat
          label="Best day"
          value={bestDay.count > 0 ? String(bestDay.count) : "0"}
          hint={bestDay.count > 0 ? bestDay.label : "Make today the first"}
          tone={bestDay.count > 0 ? "good" : "warn"}
        />
      </div>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Activity</h2>
            <p className="text-xs text-zinc-500">Last 10 days</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              trend > 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : trend < 0
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp size={11} />
            ) : trend < 0 ? (
              <TrendingDown size={11} />
            ) : (
              <Target size={11} />
            )}
            {trend > 0
              ? `+${trend} vs yesterday`
              : trend < 0
                ? `${trend} vs yesterday`
                : "Flat vs yesterday"}
          </span>
        </div>
        <div className="mt-2">
          <ActivityChart data={recentDaily} goal={DAILY_GOAL} mobile />
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          The green dot is today. No point today means the line can&apos;t
          climb — log one application and make it move.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Pipeline</h2>
          <span className="text-[11px] text-zinc-500">
            {totalJobs} applications
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {JOB_STATUSES.map((status) => {
            const count = statusCounts[status];
            return (
              <div key={status}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    {status}
                  </span>
                  <span className="text-zinc-500">{count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${STATUS_STYLES[status]}`}
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <CalendarCheck size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold">Weekly pace</p>
            <p className="text-xs text-zinc-500">
              {weekCount} in the last 7 days. Target {WEEKLY_GOAL}.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <BriefcaseBusiness size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold">Active pipeline</p>
            <p className="text-xs text-zinc-500">
              {activeCount} applications still in play. Keep them warm.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
