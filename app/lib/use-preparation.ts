"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_TABS,
  type PreparationCheckpoint,
  type PreparationStack,
  type PreparationTab,
  type PreparationTopic,
} from "@/app/lib/preparation-data";
import { getOverallStats } from "@/app/lib/preparation-utils";

const STORAGE_KEY = "job-toolkit-preparation-v1";
const SCHEMA_VERSION = 1;

export type PreparationHistoryPoint = {
  at: string;
  done: number;
  total: number;
  percent: number;
};

type PreparationState = {
  hydrated: boolean;
  tabs: PreparationTab[];
  checked: Record<string, boolean>;
  history: PreparationHistoryPoint[];
};

const serverSnapshot: PreparationState = {
  hydrated: false,
  tabs: DEFAULT_TABS,
  checked: {},
  history: [],
};

let snapshot: PreparationState = serverSnapshot;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function getSnapshot(): PreparationState {
  return snapshot;
}

function getServerSnapshot(): PreparationState {
  return serverSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function currentStats(tabs: PreparationTab[], checked: Record<string, boolean>) {
  return getOverallStats(tabs, checked);
}

function makeHistoryPoint(
  tabs: PreparationTab[],
  checked: Record<string, boolean>,
): PreparationHistoryPoint {
  const stats = currentStats(tabs, checked);
  return {
    at: new Date().toISOString(),
    done: stats.done,
    total: stats.total,
    percent: stats.percent,
  };
}

function persist(next: PreparationState): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION,
        tabs: next.tabs,
        checked: next.checked,
        history: next.history,
      }),
    );
  } catch {
    return;
  }
}

function readStored(): PreparationState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      version?: number;
      tabs?: PreparationTab[];
      checked?: Record<string, boolean>;
      history?: PreparationHistoryPoint[];
    };

    if (
      parsed.version !== SCHEMA_VERSION ||
      !Array.isArray(parsed.tabs) ||
      !parsed.checked ||
      typeof parsed.checked !== "object"
    ) {
      return null;
    }

    return {
      hydrated: true,
      tabs: parsed.tabs,
      checked: parsed.checked,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return null;
  }
}

function hydrate(): void {
  if (snapshot.hydrated || typeof window === "undefined") return;

  const stored = readStored();
  const next: PreparationState = stored ?? {
    hydrated: true,
    tabs: DEFAULT_TABS,
    checked: {},
    history: [makeHistoryPoint(DEFAULT_TABS, {})],
  };

  snapshot = next;
  persist(next);
  emit();
}

function update(updater: (current: PreparationState) => PreparationState): void {
  if (!snapshot.hydrated) return;

  const next = updater(snapshot);
  snapshot = next;
  persist(next);
  emit();
}

function withHistory(next: PreparationState): PreparationState {
  return {
    ...next,
    history: [...next.history, makeHistoryPoint(next.tabs, next.checked)].slice(-160),
  };
}

function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function cleanChecked(
  checked: Record<string, boolean>,
  removedIds: string[],
): Record<string, boolean> {
  if (removedIds.length === 0) return checked;

  const next = { ...checked };
  for (const id of removedIds) delete next[id];
  return next;
}

function allCheckpointIds(tab: PreparationTab): string[] {
  return tab.stacks.flatMap((stack) =>
    stack.topics.flatMap((topic) => topic.checkpoints.map((item) => item.id)),
  );
}

function mapTab(
  tabs: PreparationTab[],
  tabId: string,
  updateTab: (tab: PreparationTab) => PreparationTab,
): PreparationTab[] {
  return tabs.map((tab) => (tab.id === tabId ? updateTab(tab) : tab));
}

function mapStack(
  tab: PreparationTab,
  stackId: string,
  updateStack: (stack: PreparationStack) => PreparationStack,
): PreparationTab {
  return {
    ...tab,
    stacks: tab.stacks.map((stack) =>
      stack.id === stackId ? updateStack(stack) : stack,
    ),
  };
}

function mapTopic(
  stack: PreparationStack,
  topicId: string,
  updateTopic: (topic: PreparationTopic) => PreparationTopic,
): PreparationStack {
  return {
    ...stack,
    topics: stack.topics.map((topic) =>
      topic.id === topicId ? updateTopic(topic) : topic,
    ),
  };
}

export function usePreparation() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrate();
  }, []);

  const stats = useMemo(
    () => getOverallStats(state.tabs, state.checked),
    [state.tabs, state.checked],
  );

  const actions = useMemo(
    () => ({
      toggleCheckpoint(id: string) {
        update((current) => {
          const checked = { ...current.checked };
          if (checked[id]) delete checked[id];
          else checked[id] = true;
          return withHistory({ ...current, checked });
        });
      },

      setTabComplete(tabId: string, done: boolean) {
        update((current) => {
          const tab = current.tabs.find((item) => item.id === tabId);
          if (!tab) return current;

          const checked = { ...current.checked };
          for (const id of allCheckpointIds(tab)) {
            if (done) checked[id] = true;
            else delete checked[id];
          }
          return withHistory({ ...current, checked });
        });
      },

      resetProgress() {
        update((current) => ({
          ...current,
          checked: {},
          history: [makeHistoryPoint(current.tabs, {})],
        }));
      },

      restoreDefaults() {
        update((current) => ({
          ...current,
          tabs: DEFAULT_TABS,
          checked: {},
          history: [makeHistoryPoint(DEFAULT_TABS, {})],
        }));
      },

      addTab(name: string): string | null {
        const trimmed = name.trim();
        if (!trimmed) return null;

        const id = createId("tab");
        update((current) => ({
          ...current,
          tabs: [
            ...current.tabs,
            {
              id,
              name: trimmed,
              tagline: "Custom preparation track",
              note: "",
              priorities: [],
              stacks: [],
            },
          ],
        }));
        return id;
      },

      renameTab(tabId: string, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) => ({
            ...tab,
            name: trimmed,
          })),
        }));
      },

      removeTab(tabId: string) {
        update((current) => {
          const tab = current.tabs.find((item) => item.id === tabId);
          if (!tab || current.tabs.length <= 1) return current;

          return {
            ...current,
            tabs: current.tabs.filter((item) => item.id !== tabId),
            checked: cleanChecked(current.checked, allCheckpointIds(tab)),
            history: [...current.history, makeHistoryPoint(current.tabs.filter((item) => item.id !== tabId), cleanChecked(current.checked, allCheckpointIds(tab)))].slice(-160),
          };
        });
      },

      addStack(tabId: string, name: string): string | null {
        const trimmed = name.trim();
        if (!trimmed) return null;

        const id = createId("stack");
        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) => ({
            ...tab,
            stacks: [
              ...tab.stacks,
              { id, name: trimmed, topics: [] },
            ],
          })),
        }));
        return id;
      },

      renameStack(tabId: string, stackId: string, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) =>
            mapStack(tab, stackId, (stack) => ({
              ...stack,
              name: trimmed,
            })),
          ),
        }));
      },

      removeStack(tabId: string, stackId: string) {
        update((current) => {
          const tab = current.tabs.find((item) => item.id === tabId);
          const stack = tab?.stacks.find((item) => item.id === stackId);
          if (!stack) return current;

          const removedIds = stack.topics.flatMap((topic) =>
            topic.checkpoints.map((item) => item.id),
          );
          return {
            ...current,
            tabs: mapTab(current.tabs, tabId, (item) => ({
              ...item,
              stacks: item.stacks.filter((candidate) => candidate.id !== stackId),
            })),
            checked: cleanChecked(current.checked, removedIds),
          };
        });
      },

      addTopic(tabId: string, stackId: string, title: string): string | null {
        const trimmed = title.trim();
        if (!trimmed) return null;

        const id = createId("topic");
        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) =>
            mapStack(tab, stackId, (stack) => ({
              ...stack,
              topics: [
                ...stack.topics,
                { id, title: trimmed, checkpoints: [] },
              ],
            })),
          ),
        }));
        return id;
      },

      renameTopic(
        tabId: string,
        stackId: string,
        topicId: string,
        title: string,
      ) {
        const trimmed = title.trim();
        if (!trimmed) return;
        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) =>
            mapStack(tab, stackId, (stack) =>
              mapTopic(stack, topicId, (topic) => ({
                ...topic,
                title: trimmed,
              })),
            ),
          ),
        }));
      },

      removeTopic(tabId: string, stackId: string, topicId: string) {
        update((current) => {
          const tab = current.tabs.find((item) => item.id === tabId);
          const stack = tab?.stacks.find((item) => item.id === stackId);
          const topic = stack?.topics.find((item) => item.id === topicId);
          if (!topic) return current;

          const removedIds = topic.checkpoints.map((item) => item.id);
          return {
            ...current,
            tabs: mapTab(current.tabs, tabId, (item) =>
              mapStack(item, stackId, (candidate) => ({
                ...candidate,
                topics: candidate.topics.filter((entry) => entry.id !== topicId),
              })),
            ),
            checked: cleanChecked(current.checked, removedIds),
          };
        });
      },

      addCheckpoint(
        tabId: string,
        stackId: string,
        topicId: string,
        label: string,
      ) {
        const trimmed = label.trim();
        if (!trimmed) return;

        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) =>
            mapStack(tab, stackId, (stack) =>
              mapTopic(stack, topicId, (topic) => ({
                ...topic,
                checkpoints: [
                  ...topic.checkpoints,
                  { id: createId("checkpoint"), label: trimmed },
                ] satisfies PreparationCheckpoint[],
              })),
            ),
          ),
        }));
      },

      renameCheckpoint(
        tabId: string,
        stackId: string,
        topicId: string,
        checkpointId: string,
        label: string,
      ) {
        const trimmed = label.trim();
        if (!trimmed) return;
        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) =>
            mapStack(tab, stackId, (stack) =>
              mapTopic(stack, topicId, (topic) => ({
                ...topic,
                checkpoints: topic.checkpoints.map((item) =>
                  item.id === checkpointId ? { ...item, label: trimmed } : item,
                ),
              })),
            ),
          ),
        }));
      },

      removeCheckpoint(
        tabId: string,
        stackId: string,
        topicId: string,
        checkpointId: string,
      ) {
        update((current) => ({
          ...current,
          tabs: mapTab(current.tabs, tabId, (tab) =>
            mapStack(tab, stackId, (stack) =>
              mapTopic(stack, topicId, (topic) => ({
                ...topic,
                checkpoints: topic.checkpoints.filter(
                  (item) => item.id !== checkpointId,
                ),
              })),
            ),
          ),
          checked: cleanChecked(current.checked, [checkpointId]),
        }));
      },
    }),
    [],
  );

  return {
    hydrated: state.hydrated,
    tabs: state.tabs,
    checked: state.checked,
    history: state.history,
    stats,
    actions,
  };
}

export type PreparationActions = ReturnType<typeof usePreparation>["actions"];
