"use client";

import type { JobApplication } from "@/app/lib/job-types";

type Props = {
  job: JobApplication;
  onClose: () => void;
};

export function JobDescriptionDialog({ job, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{job.role}</h2>
            <p className="mt-1 text-sm text-zinc-500">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <h3 className="mt-5 text-sm font-semibold">Job Description</h3>
        <pre className="mt-2 max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-4 text-sm font-normal leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {job.jobDescription || "No job description saved."}
        </pre>
      </div>
    </div>
  );
}
