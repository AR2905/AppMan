"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import {
  PreparationRing,
  PreparationTimeline,
  ProgressBar,
} from "@/app/components/preparation-progress";
import { usePreparation } from "@/app/lib/use-preparation";

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function PreparationDashboardView() {
  const { hydrated, history, stats, actions } = usePreparation();

  if (!hydrated) {
    return (
      <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </main>
    );
  }

  const stacks = stats.tabs.flatMap((tab) =>
    tab.stacks.map((stack) => ({
      ...stack,
      tabId: tab.id,
      tabName: tab.name,
    })),
  );
  const focusStacks = [...stacks]
    .sort((a, b) => b.total - b.done - (a.total - a.done))
    .slice(0, 6);
  const completedStacks = stacks.filter(
    (stack) => stack.total > 0 && stack.done === stack.total,
  ).length;
  const recent = history.slice(-8).reverse();
  const bannerClass =
    stats.percent >= 75
      ? "from-emerald-600 via-teal-600 to-cyan-700"
      : stats.percent >= 30
        ? "from-blue-600 via-indigo-600 to-violet-700"
        : "from-amber-500 via-orange-500 to-rose-500";

  let headline = "The checklist is waiting";
  let subline = "Tick your first topic and watch the graph move.";
  if (stats.percent >= 100) {
    headline = "Checklist cleared";
    subline = "Every checkpoint is done. Time to revise and practice explaining.";
  } else if (stats.percent >= 75) {
    headline = "Final stretch";
    subline = `Only ${stats.remaining} checkpoints left. Finish strong and close the loop.`;
  } else if (stats.percent >= 30) {
    headline = "Real momentum";
    subline = `${stats.done} checkpoints prepared. Keep clearing the stacks one by one.`;
  } else if (stats.done > 0) {
    headline = "You have started";
    subline = `${stats.done} down, ${stats.remaining} to go. Small ticks add up fast.`;
  }

  return (
    <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={24} className="text-emerald-600" />
            <h1 className="text-3xl font-semibold tracking-tight">
              Preparation Dashboard
            </h1>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Prepared, remaining, and what to tackle next.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/preparation"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={16} /> Back to checklist
          </Link>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all ticks and start again?")) {
                actions.resetProgress();
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </header>

      <section
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bannerClass} p-6 text-white shadow-lg`}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Sparkles size={24} />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{headline}</h2>
              <p className="mt-1 max-w-xl text-sm text-white/90">{subline}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
                  {stats.done}/{stats.total} checkpoints
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
                  {completedStacks} stacks complete
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium">
                  {stats.remaining} remaining
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold leading-none">{stats.percent}%</p>
            <p className="mt-1 text-xs text-white/80">overall coverage</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Prepared",
            value: String(stats.done),
            hint: "Checkpoints ticked",
            icon: <CheckCircle2 size={16} />,
          },
          {
            label: "Remaining",
            value: String(stats.remaining),
            hint: "Still to cover",
            icon: <Target size={16} />,
          },
          {
            label: "Stacks complete",
            value: String(completedStacks),
            hint: `Out of ${stacks.length} stacks`,
            icon: <ListChecks size={16} />,
          },
          {
            label: "Progress entries",
            value: String(history.length),
            hint: "Recorded checkpoints",
            icon: <BarChart3 size={16} />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {card.label}
              </p>
              <span className="text-zinc-400">{card.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Preparation momentum</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Overall coverage after each checkpoint update
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {stats.percent}% now
            </span>
          </div>
          <div className="mt-4">
            <PreparationTimeline history={history} />
          </div>
        </section>

        <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Overall coverage</h2>
          <PreparationRing
            value={stats.done}
            total={stats.total}
            label={stats.percent >= 100 ? "Ready to revise" : "In progress"}
            caption={
              stats.percent >= 100
                ? "All checkpoints covered."
                : `${stats.remaining} checkpoints left.`
            }
            size={148}
          />
          <Link
            href="/preparation"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <ListChecks size={16} /> Open checklist
          </Link>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Frontend vs Backend</h2>
          <p className="mt-1 text-sm text-zinc-500">Where you stand today</p>
          <div className="mt-5 space-y-5">
            {stats.tabs.map((tab) => (
              <div key={tab.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{tab.name}</span>
                  <span className="text-zinc-500">
                    {tab.done}/{tab.total} · {tab.percent}%
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={tab.done} total={tab.total} />
                </div>
              </div>
            ))}
            {stats.tabs.length === 0 ? (
              <p className="text-sm text-zinc-500">No tabs yet.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Focus next</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Stacks with the most checkpoints left
          </p>
          <div className="mt-4 space-y-3">
            {focusStacks.map((stack) => (
              <div key={stack.id}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-medium text-zinc-700 dark:text-zinc-200">
                    {stack.name}
                    <span className="ml-1.5 text-zinc-400">· {stack.tabName}</span>
                  </span>
                  <span className="shrink-0 text-zinc-500">
                    {stack.total - stack.done} left
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={stack.done} total={stack.total} color="#6366f1" />
                </div>
              </div>
            ))}
            {focusStacks.length === 0 ? (
              <p className="text-sm text-zinc-500">Add a stack to get started.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Recent moves</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Every tick is a step forward. Here are your latest updates
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((point, index) => {
            const previous = history[history.length - index - 2];
            const delta = previous ? point.done - previous.done : point.done;
            return (
              <div
                key={`${point.at}-${index}`}
                className="rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      delta > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : delta < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta < 0 ? delta : "0"}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {point.percent}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {timeFormat.format(new Date(point.at))}
                </p>
              </div>
            );
          })}
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">No updates recorded yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
