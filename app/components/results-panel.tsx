"use client";

import { useState } from "react";
import { DiffView } from "@/app/components/diff-view";
import {
  experienceToText,
  projectsToText,
  type AnalyzeResult,
  type LockedSections,
  type SectionKey,
} from "@/app/lib/resume-types";

type Props = {
  result: AnalyzeResult;
  locked: LockedSections;
  beforeText: string;
  copied: boolean;
  onCopy: () => void;
};

type ResultView = "updated" | "compare";

export function ResultsPanel({
  result,
  locked,
  beforeText,
  copied,
  onCopy,
}: Props) {
  const [view, setView] = useState<ResultView>("updated");

  const blocks: { key: SectionKey; title: string; text: string }[] =
    result.updatedSections
      ? [
          {
            key: "profileSummary",
            title: "Profile Summary",
            text: result.updatedSections.profileSummary,
          },
          {
            key: "skills",
            title: "Skills",
            text: result.updatedSections.skills,
          },
          {
            key: "experience",
            title: "Experience",
            text: experienceToText(result.updatedSections.experience),
          },
          {
            key: "projects",
            title: "Projects",
            text: projectsToText(result.updatedSections.projects),
          },
          {
            key: "education",
            title: "Education",
            text: result.updatedSections.education,
          },
          {
            key: "certifications",
            title: "Certifications",
            text: result.updatedSections.certifications,
          },
        ]
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Match Score</h2>
          <span className="text-2xl font-bold">{result.matchScore}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${result.matchScore}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">
          Missing Keywords{" "}
          <span className="text-sm font-normal text-zinc-500">(ranked)</span>
        </h2>
        {result.missingKeywords.length > 0 ? (
          <ol className="mt-3 flex flex-col gap-2">
            {result.missingKeywords.map((keyword, index) => (
              <li
                key={`${keyword}-${index}`}
                className="flex items-center gap-3 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium dark:bg-zinc-800">
                  {index + 1}
                </span>
                <span>{keyword}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No missing keywords found.</p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Resume Result</h2>
            <div className="inline-flex rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setView("updated")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  view === "updated"
                    ? "bg-foreground text-background"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                Updated
              </button>
              <button
                type="button"
                onClick={() => setView("compare")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  view === "compare"
                    ? "bg-foreground text-background"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                Compare
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {copied ? "Copied!" : "Copy full resume"}
          </button>
        </div>

        {view === "compare" ? (
          <div className="mt-3">
            <DiffView before={beforeText} after={result.updatedResume} />
          </div>
        ) : result.updatedSections ? (
          <div className="mt-3 flex flex-col gap-3">
            {blocks.map((block) => (
              <div
                key={block.key}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{block.title}</h3>
                  {locked[block.key] ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      Locked · unchanged
                    </span>
                  ) : null}
                </div>
                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-sm font-normal leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {block.text || "—"}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm font-normal leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {result.updatedResume || "No updated resume returned."}
          </pre>
        )}
      </div>
    </div>
  );
}
