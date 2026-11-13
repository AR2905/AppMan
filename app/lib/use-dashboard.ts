"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  JOB_STATUSES,
  type JobApplication,
  type JobStatus,
} from "@/app/lib/job-types";
import { isoDateDaysAgo, jobAppliedDate } from "@/app/lib/job-utils";

export const DAILY_GOAL = 3;
export const WEEKLY_GOAL = 15;
export const MONTHLY_GOAL = 60;

export type ActivityDay = {
  date: string;
  count: number;
  label: string;
};

const dayLabelFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

function labelFor(date: string): string {
  return dayLabelFormat.format(new Date(`${date}T00:00:00`));
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  const offset = next.getTimezoneOffset() * 60000;
  return new Date(next.getTime() - offset).toISOString().slice(0, 10);
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const subscribeToHydration = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

export function useDashboard() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hydrated = useHydrated();

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/jobs");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load job applications.");
    }

    return data.jobs as JobApplication[];
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadJobs()
      .then((nextJobs) => {
        if (!cancelled) {
          setJobs(nextJobs);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load job applications.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadJobs]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setJobs(await loadJobs());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load job applications.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadJobs]);

  const stats = useMemo(() => {
    if (!hydrated) return null;

    const counts = new Map<string, number>();

    for (const job of jobs) {
      const day = jobAppliedDate(job);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }

    const countFor = (offset: number) =>
      counts.get(isoDateDaysAgo(offset)) ?? 0;

    const daily: ActivityDay[] = Array.from({ length: 30 }, (_, index) => {
      const date = isoDateDaysAgo(29 - index);
      return { date, count: counts.get(date) ?? 0, label: labelFor(date) };
    });

    const todayCount = countFor(0);
    const yesterdayCount = countFor(1);
    const weekCount = Array.from({ length: 7 }).reduce<number>(
      (total, _, index) => total + countFor(index),
      0,
    );
    const monthCount = daily.reduce((total, day) => total + day.count, 0);

    function streakFrom(startOffset: number): number {
      let streak = 0;
      for (let offset = startOffset; offset < 3660; offset += 1) {
        if (countFor(offset) > 0) {
          streak += 1;
        } else {
          break;
        }
      }
      return streak;
    }

    const currentStreak =
      todayCount > 0 ? streakFrom(0) : streakFrom(1);
    const streakAtRisk = todayCount === 0 && currentStreak > 0;

    const uniqueDays = Array.from(counts.keys()).sort();
    let longestStreak = 0;
    let run = 0;
    let previous: string | null = null;

    for (const day of uniqueDays) {
      if (previous && addDays(previous, 1) === day) {
        run += 1;
      } else {
        run = 1;
      }

      longestStreak = Math.max(longestStreak, run);
      previous = day;
    }

    const bestDay = daily.reduce(
      (best, day) => (day.count > best.count ? day : best),
      { date: "", count: 0, label: "—" },
    );

    const statusCounts = JOB_STATUSES.reduce(
      (acc, status) => {
        acc[status] = jobs.filter((job) => job.status === status).length;
        return acc;
      },
      {} as Record<JobStatus, number>,
    );

    const activeCount =
      statusCounts.Applied + statusCounts.Interview + statusCounts.Offer;

    const todayProgress = Math.min(todayCount / DAILY_GOAL, 1);
    const weekProgress = Math.min(weekCount / WEEKLY_GOAL, 1);
    const monthProgress = Math.min(monthCount / MONTHLY_GOAL, 1);
    const trend = todayCount - yesterdayCount;
    const remainingToday = Math.max(DAILY_GOAL - todayCount, 0);
    const timeOfDay = timeOfDayGreeting();

    let headline: string;
    let subline: string;

    if (todayCount === 0 && streakAtRisk) {
      headline = "Don't break the streak";
      subline = `You're on a ${currentStreak}-day run. One application today keeps it alive — the graph wants to go up.`;
    } else if (todayCount === 0) {
      headline = "Today's graph is flat";
      subline = `Send your first application of the ${timeOfDay} and turn today's point green.`;
    } else if (todayCount >= DAILY_GOAL) {
      headline = "Daily goal cleared";
      subline = `${todayCount} applications today — the line is climbing. Keep the momentum going.`;
    } else {
      headline = "Keep the line climbing";
      subline = `${remainingToday} more ${remainingToday === 1 ? "application" : "applications"} to hit today's goal of ${DAILY_GOAL}.`;
    }

    if (trend > 0 && todayCount > 0 && todayCount < DAILY_GOAL) {
      subline = `You're already ${trend} ahead of yesterday. ${remainingToday} more to finish the day strong.`;
    }

    return {
      daily,
      todayCount,
      yesterdayCount,
      weekCount,
      monthCount,
      totalJobs: jobs.length,
      activeCount,
      currentStreak,
      longestStreak,
      streakAtRisk,
      bestDay,
      statusCounts,
      todayProgress,
      weekProgress,
      monthProgress,
      trend,
      remainingToday,
      headline,
      subline,
      timeOfDay,
    };
  }, [jobs, hydrated]);

  return { jobs, loading, error, stats, reload };
}

export type DashboardStats = ReturnType<typeof useDashboard>["stats"];
