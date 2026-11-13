"use client";

import { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
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

export function MobileResultsPanel({
  result,
  locked,
  beforeText,
  copied,
  onCopy,
}: Props) {
  const [view, setView] = useState<ResultView>("updated");
  const [openSection, setOpenSection] = useState<SectionKey | null>(
    "profileSummary",
  );

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
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Match score
            </p>
            <p className="mt-1 text-3xl font-bold">{result.matchScore}%</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              result.matchScore >= 75
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : result.matchScore >= 50
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {result.matchScore >= 75
              ? "Strong"
              : result.matchScore >= 50
                ? "Almost there"
                : "Needs work"}
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${result.matchScore}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold">
          Missing keywords{" "}
          <span className="text-xs font-normal text-zinc-500">(ranked)</span>
        </h2>
        {result.missingKeywords.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.missingKeywords.map((keyword, index) => (
              <span
                key={`${keyword}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-1 pr-3 text-xs dark:bg-zinc-800"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                  {index + 1}
                </span>
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No missing keywords found.</p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Optimized resume</h2>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition active:bg-zinc-100 dark:border-zinc-700 dark:active:bg-zinc-800"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 rounded-lg border border-zinc-300 p-1 text-sm dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setView("updated")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === "updated"
                ? "bg-foreground text-background"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Updated
          </button>
          <button
            type="button"
            onClick={() => setView("compare")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === "compare"
                ? "bg-foreground text-background"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Compare
          </button>
        </div>

        {view === "compare" ? (
          <div className="mt-3">
            <DiffView before={beforeText} after={result.updatedResume} />
          </div>
        ) : result.updatedSections ? (
          <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {blocks.map((block) => {
              const open = openSection === block.key;
              return (
                <div key={block.key}>
                  <button
                    type="button"
                    onClick={() => setOpenSection(open ? null : block.key)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {block.title}
                      {locked[block.key] ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Locked
                        </span>
                      ) : null}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-zinc-500 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open ? (
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words px-4 pb-4 text-sm font-normal leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {block.text || "—"}
                    </pre>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm font-normal leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {result.updatedResume || "No updated resume returned."}
          </pre>
        )}
      </div>
    </div>
  );
}
