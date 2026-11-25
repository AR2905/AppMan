"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  PreparationRing,
  ProgressBar,
} from "@/app/components/preparation-progress";
import { getTabStats, type StackStats } from "@/app/lib/preparation-utils";
import { usePreparation } from "@/app/lib/use-preparation";

function InlineAdd({
  label,
  placeholder,
  onAdd,
}: {
  label: string;
  placeholder: string;
  onAdd: (value: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onAdd(value)) {
      setValue("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Plus size={13} /> {label}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="w-48 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
      >
        Add
      </button>
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => {
          setValue("");
          setOpen(false);
        }}
        className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <X size={14} />
      </button>
    </form>
  );
}

function EditableText({
  value,
  onSave,
  className = "",
  ariaLabel,
}: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const [edit, setEdit] = useState<{ source: string; draft: string } | null>(
    null,
  );
  const isEditing = edit !== null && edit.source === value;
  const draft = edit !== null && edit.source === value ? edit.draft : value;

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEdit(null);
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setEdit({ source: value, draft: event.target.value })}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setEdit(null);
        }}
        className={`min-w-0 rounded-md border border-emerald-500 bg-white px-1.5 py-0.5 outline-none dark:bg-zinc-900 ${className}`}
      />
    );
  }

  return (
    <span className={`group/edit inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <span className="min-w-0 break-words">{value}</span>
      <button
        type="button"
        aria-label={ariaLabel ?? `Rename ${value}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setEdit({ source: value, draft: value });
        }}
        className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition hover:bg-zinc-200 hover:text-zinc-700 focus:opacity-100 group-hover/edit:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
      >
        <Pencil size={11} />
      </button>
    </span>
  );
}

function confirmRemove(name: string): boolean {
  return window.confirm(`Remove "${name}"? This cannot be undone.`);
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function StackProgressMap({
  stacks,
  onSelect,
}: {
  stacks: StackStats[];
  onSelect: (stackId: string) => void;
}) {
  const currentStackId = stacks.find(
    (stack) => stack.total === 0 || stack.percent < 100,
  )?.id;
  const completedStacks = stacks.filter(
    (stack) => stack.total > 0 && stack.percent === 100,
  ).length;

  return (
    <div className="mt-3 pb-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Tech stack roadmap
        </p>
        <p className="text-[11px] text-zinc-500">
          {completedStacks}/{stacks.length} stacks complete
        </p>
      </div>

      {stacks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700">
          Add a stack to start your roadmap.
        </p>
      ) : (
        <ol aria-label="Tech stack progress" className="flex flex-wrap gap-2">
          {stacks.map((stack, index) => {
            const isComplete = stack.total > 0 && stack.percent === 100;
            const isCurrent = stack.id === currentStackId;
            const isStarted = stack.done > 0 && !isComplete;

            return (
              <li key={stack.id} className="flex min-w-0 grow basis-40">
                <button
                  type="button"
                  onClick={() => onSelect(stack.id)}
                  title={`${stack.name}: ${stack.done}/${stack.total} checkpoints complete. Click to view.`}
                  aria-label={`Scroll to ${stack.name}`}
                  className={`flex w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 ${isComplete
                    ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-600"
                    : isCurrent
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100"
                      : isStarted
                        ? "border-emerald-200 bg-white text-zinc-800 dark:border-emerald-800 dark:bg-zinc-900 dark:text-zinc-100"
                        : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isComplete
                      ? "bg-white/25 text-white"
                      : isCurrent
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                  >
                    {isComplete ? <Check size={12} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[11px] font-semibold leading-tight">
                      {stack.name}
                    </span>
                    <span
                      className={`mt-1.5 block h-1 w-full overflow-hidden rounded-full ${isComplete
                        ? "bg-white/30"
                        : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                    >
                      <span
                        className={`block h-full rounded-full transition-all duration-500 ${isComplete ? "bg-white" : "bg-emerald-500"
                          }`}
                        style={{ width: `${stack.percent}%` }}
                      />
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-medium ${isComplete ? "text-white/80" : "text-zinc-400"
                      }`}
                  >
                    {stack.percent}%
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function PreparationView() {
  const { hydrated, tabs, checked, stats, actions } = usePreparation();
  const [activeTabId, setActiveTabId] = useState("frontend");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const tabStats = useMemo(
    () => (activeTab ? getTabStats(activeTab, checked) : null),
    [activeTab, checked],
  );

  function scrollToStack(stackId: string) {
    const targetId = `preparation-stack-${stackId}`;

    setQuery("");
    setCollapsed((current) => ({ ...current, [stackId]: false }));

    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const visibleStacks = useMemo(() => {
    if (!activeTab) return [];
    const search = query.trim().toLowerCase();
    if (!search) return activeTab.stacks;

    return activeTab.stacks
      .map((stack) => ({
        ...stack,
        topics: stack.topics
          .map((topic) => ({
            ...topic,
            checkpoints: topic.checkpoints.filter(
              (checkpoint) =>
                checkpoint.label.toLowerCase().includes(search) ||
                topic.title.toLowerCase().includes(search) ||
                stack.name.toLowerCase().includes(search),
            ),
          }))
          .filter(
            (topic) =>
              topic.checkpoints.length > 0 ||
              topic.title.toLowerCase().includes(search) ||
              stack.name.toLowerCase().includes(search),
          ),
      }))
      .filter((stack) => stack.topics.length > 0);
  }, [activeTab, query]);

  if (!hydrated || !activeTab || !tabStats) {
    return (
      <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </main>
    );
  }

  const frontendStats = stats.tabs.find((tab) => tab.id === "frontend");
  const backendStats = stats.tabs.find((tab) => tab.id === "backend");

  return (
    <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
      {/* <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks size={24} className="text-emerald-600" />
            <h1 className="text-3xl font-semibold tracking-tight">
              Interview Preparation
            </h1>
          </div>

        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/preparation/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            <BarChart3 size={16} /> Progress dashboard
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
      </header> */}





      <section className=" ">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className=" border-b border-zinc-200 pb-2 dark:border-zinc-800">

              <div className="row-1 flex flex-wrap items-center  gap-2">

                {tabs.map((tab) => {
                  const tabStat = stats.tabs.find((item) => item.id === tab.id);
                  const selected = tab.id === activeTab.id;
                  return (
                    <div
                      key={tab.id}
                      className={`flex items-center rounded-t-lg border ${selected
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                        : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveTabId(tab.id)}
                        className={`px-3 py-2 text-sm font-semibold ${selected ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {tab.name}
                        <span className="ml-2 text-xs font-medium text-zinc-500">
                          {tabStat?.percent ?? 0}%
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${tab.name} tab`}
                        onClick={() => {
                          if (confirmRemove(tab.name)) actions.removeTab(tab.id);
                        }}
                        disabled={tabs.length <= 1}
                        className="pr-2 text-zinc-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}


                <InlineAdd
                  label="Add tab"
                  placeholder="New tab name"
                  onAdd={(value) => {
                    const id = actions.addTab(value);
                    if (id) setActiveTabId(id);
                    return Boolean(id);
                  }}
                />
              </div>


              <div className="row-2 tech-stack-progress">
                <StackProgressMap
                  stacks={tabStats.stacks}
                  onSelect={scrollToStack}
                />
              </div>



            </div>
          </div>

        </div>



      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Tech stacks
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {visibleStacks.length} shown
          </span>
        </h2>
        <InlineAdd
          label="Add stack"
          placeholder="Stack name"
          onAdd={(value) => Boolean(actions.addStack(activeTab.id, value))}
        />
      </div>

      <div className="mt-3 space-y-3">
        {visibleStacks.map((stack) => {
          const stackStat = tabStats.stacks.find((item) => item.id === stack.id);
          const isCollapsed = query.trim() ? false : (collapsed[stack.id] ?? false);

          return (
            <section
              key={stack.id}
              id={`preparation-stack-${stack.id}`}
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  aria-label={isCollapsed ? `Expand ${stack.name}` : `Collapse ${stack.name}`}
                  onClick={() =>
                    setCollapsed((current) => ({
                      ...current,
                      [stack.id]: !isCollapsed,
                    }))
                  }
                  className="mt-0.5 rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <EditableText
                      value={stack.name}
                      onSave={(value) =>
                        actions.renameStack(activeTab.id, stack.id, value)
                      }
                      className="text-base font-semibold"
                      ariaLabel={`Rename ${stack.name}`}
                    />
                    <span className="text-xs text-zinc-500">
                      {stackStat?.done ?? 0}/{stackStat?.total ?? 0} checked
                    </span>
                    {stackStat?.percent === 100 && stackStat.total > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Complete
                      </span>
                    ) : null}
                  </div>
                  {stack.description ? (
                    <p className="mt-1 text-xs text-zinc-500">{stack.description}</p>
                  ) : null}
                  <div className="mt-2 max-w-xl">
                    <ProgressBar value={stackStat?.done ?? 0} total={stackStat?.total ?? 0} />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${stack.name}`}
                  onClick={() => {
                    if (confirmRemove(stack.name)) {
                      actions.removeStack(activeTab.id, stack.id);
                    }
                  }}
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {!isCollapsed ? (
                <div className="space-y-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
                  {stack.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/40">
                        <EditableText
                          value={topic.title}
                          onSave={(value) =>
                            actions.renameTopic(activeTab.id, stack.id, topic.id, value)
                          }
                          className="text-sm font-semibold"
                          ariaLabel={`Rename ${topic.title}`}
                        />
                        <button
                          type="button"
                          aria-label={`Remove ${topic.title}`}
                          onClick={() => {
                            if (confirmRemove(topic.title)) {
                              actions.removeTopic(activeTab.id, stack.id, topic.id);
                            }
                          }}
                          className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="grid gap-0.5 p-2 sm:grid-cols-2">
                        {topic.checkpoints.map((checkpoint) => (
                          <label
                            key={checkpoint.id}
                            className="group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(checked[checkpoint.id])}
                              onChange={() => actions.toggleCheckpoint(checkpoint.id)}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                            />
                            <span
                              className={`min-w-0 flex-1 text-sm leading-snug ${checked[checkpoint.id]
                                ? "text-zinc-400 line-through dark:text-zinc-500"
                                : "text-zinc-700 dark:text-zinc-200"
                                }`}
                            >
                              <EditableText
                                value={checkpoint.label}
                                onSave={(value) =>
                                  actions.renameCheckpoint(
                                    activeTab.id,
                                    stack.id,
                                    topic.id,
                                    checkpoint.id,
                                    value,
                                  )
                                }
                                ariaLabel={`Rename ${checkpoint.label}`}
                              />
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${checkpoint.label}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                actions.removeCheckpoint(
                                  activeTab.id,
                                  stack.id,
                                  topic.id,
                                  checkpoint.id,
                                );
                              }}
                              className="shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:text-zinc-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </label>
                        ))}
                        {topic.checkpoints.length === 0 ? (
                          <p className="px-2 py-1.5 text-xs text-zinc-500">
                            No checkpoints yet. Add one below.
                          </p>
                        ) : null}
                      </div>
                      <div className="border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
                        <InlineAdd
                          label="Add checkpoint"
                          placeholder="New checkpoint"
                          onAdd={(value) => {
                            actions.addCheckpoint(
                              activeTab.id,
                              stack.id,
                              topic.id,
                              value,
                            );
                            return true;
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <InlineAdd
                    label="Add topic"
                    placeholder="Topic name"
                    onAdd={(value) =>
                      Boolean(actions.addTopic(activeTab.id, stack.id, value))
                    }
                  />
                </div>
              ) : null}
            </section>
          );
        })}
        {visibleStacks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No stacks match your search. Add a stack or clear the search.
          </div>
        ) : null}
      </div>
    </main>
  );
}
