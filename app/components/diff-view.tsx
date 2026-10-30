"use client";

import { useMemo } from "react";
import { diffWordsWithSpace } from "diff";

type Props = {
  before: string;
  after: string;
};

export function DiffView({ before, after }: Props) {
  const parts = useMemo(
    () => diffWordsWithSpace(before, after),
    [before, after],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-200 dark:bg-red-900/60" />
          Removed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-900/60" />
          Added
        </span>
      </div>

      <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm font-normal leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        {parts.map((part, index) => {
          if (part.added) {
            return (
              <ins
                key={index}
                className="rounded bg-emerald-200 px-0.5 text-emerald-950 no-underline dark:bg-emerald-900/60 dark:text-emerald-100"
              >
                {part.value}
              </ins>
            );
          }

          if (part.removed) {
            return (
              <del
                key={index}
                className="rounded bg-red-200 px-0.5 text-red-950 dark:bg-red-900/60 dark:text-red-100"
              >
                {part.value}
              </del>
            );
          }

          return <span key={index}>{part.value}</span>;
        })}
      </pre>

      <p className="mt-2 text-xs text-zinc-500">
        Word-level changes between your original resume and the enhanced result.
      </p>
    </div>
  );
}
