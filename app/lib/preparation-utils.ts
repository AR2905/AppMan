import type { PreparationTab } from "@/app/lib/preparation-data";

export type StackStats = {
  id: string;
  name: string;
  done: number;
  total: number;
  percent: number;
};

export type TabStats = {
  id: string;
  name: string;
  done: number;
  total: number;
  percent: number;
  stacks: StackStats[];
};

export type OverallStats = {
  done: number;
  total: number;
  remaining: number;
  percent: number;
  tabs: TabStats[];
};

function percentOf(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function countChecked(
  tab: PreparationTab,
  checked: Record<string, boolean>,
): number {
  let count = 0;

  for (const stack of tab.stacks) {
    for (const topic of stack.topics) {
      for (const checkpoint of topic.checkpoints) {
        if (checked[checkpoint.id]) count += 1;
      }
    }
  }

  return count;
}

export function getTabStats(
  tab: PreparationTab,
  checked: Record<string, boolean>,
): TabStats {
  const stacks = tab.stacks.map((stack) => {
    const total = stack.topics.reduce(
      (sum, topic) => sum + topic.checkpoints.length,
      0,
    );
    const done = stack.topics.reduce(
      (sum, topic) =>
        sum + topic.checkpoints.filter((checkpoint) => checked[checkpoint.id]).length,
      0,
    );

    return {
      id: stack.id,
      name: stack.name,
      done,
      total,
      percent: percentOf(done, total),
    };
  });

  const done = stacks.reduce((sum, stack) => sum + stack.done, 0);
  const total = stacks.reduce((sum, stack) => sum + stack.total, 0);

  return {
    id: tab.id,
    name: tab.name,
    done,
    total,
    percent: percentOf(done, total),
    stacks,
  };
}

export function getOverallStats(
  tabs: PreparationTab[],
  checked: Record<string, boolean>,
): OverallStats {
  const tabStats = tabs.map((tab) => getTabStats(tab, checked));
  const done = tabStats.reduce((sum, tab) => sum + tab.done, 0);
  const total = tabStats.reduce((sum, tab) => sum + tab.total, 0);

  return {
    done,
    total,
    remaining: Math.max(total - done, 0),
    percent: percentOf(done, total),
    tabs: tabStats,
  };
}
