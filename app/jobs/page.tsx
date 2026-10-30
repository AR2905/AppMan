"use client";

import { useCallback, useEffect, useState } from "react";
import { JobDescriptionDialog } from "@/app/components/job-description-dialog";
import { JobFormDialog } from "@/app/components/job-form-dialog";
import {
  JOB_STATUSES,
  type JobApplication,
  type JobStatus,
} from "@/app/lib/job-types";

const STATUS_STYLES: Record<JobStatus, string> = {
  Saved: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Applied: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Interview:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Offer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  Withdrawn:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const headerCell =
  "whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500";
const bodyCell = "px-3 py-3";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [viewingJob, setViewingJob] = useState<JobApplication | null>(null);

  const [resumeContent, setResumeContent] = useState("");
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [defaultResume, SetDefaultResume] = useState(false)
  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load job applications.");
      }

      setJobs(data.jobs as JobApplication[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load job applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/jobs")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load job applications.");
        }

        if (!cancelled) {
          setJobs(data.jobs as JobApplication[]);
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

    fetch("/api/resume")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load the default resume.");
        }

        if (!cancelled) {
          setResumeContent(data.content as string);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load the default resume.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResumeLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveResume() {
    setResumeSaving(true);
    setResumeMessage("");
    setError("");

    try {
      const response = await fetch("/api/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: resumeContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the default resume.");
      }

      setResumeMessage("Default resume saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the default resume.",
      );
    } finally {
      setResumeSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: JobStatus) {
    const previous = jobs;
    setJobs((prev) =>
      prev.map((job) => (job._id === id ? { ...job, status } : job)),
    );

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update the status.");
      }
    } catch (err) {
      setJobs(previous);
      setError(
        err instanceof Error ? err.message : "Could not update the status.",
      );
    }
  }

  async function handleDelete(job: JobApplication) {
    if (!window.confirm(`Delete the application at ${job.company}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${job._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete the application.");
      }

      setJobs((prev) => prev.filter((item) => item._id !== job._id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the application.",
      );
    }
  }

  return (
    <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Job Store</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Track every job you apply to, from the JD to the final status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingJob(null);
            setFormOpen(true);
          }}
          className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          + Add application
        </button>
      </header>

      {error ? (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}



      <section>
        {loading ? (
          <p className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
            Loading applications...
          </p>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="text-sm font-medium">No applications yet.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Add the first job you applied to and start tracking it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full w-[1500px] text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className={headerCell}>Company</th>
                  <th className={headerCell}>Role</th>
                  <th className={headerCell}>Location</th>
                  <th className={headerCell}>Salary</th>
                  <th className={headerCell}>Platform</th>
                  <th className={headerCell}>Experience</th>
                  <th className={headerCell}>HR Content</th>
                  <th className={headerCell}>Notes</th>
                  <th className={headerCell}>JD</th>
                  <th className={headerCell}>Status</th>
                  <th className={`${headerCell} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {jobs.map((job) => (
                  <tr
                    key={job._id}
                    className="align-top transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className={`${bodyCell} font-medium`}>{job.company}</td>
                    <td className={bodyCell}>{job.role}</td>
                    <td className={bodyCell}>{job.location || "—"}</td>
                    <td className={bodyCell}>
                      <div className="text-xs text-zinc-500">Offer</div>
                      <div>{job.salaryOffer || "—"}</div>
                      <div className="mt-1 text-xs text-zinc-500">Expected</div>
                      <div>{job.salaryExpected || "—"}</div>
                    </td>
                    <td className={bodyCell}>
                      {job.platform || job.platformUrl ? (
                        <div className="flex flex-col">
                          {job.platformUrl ? (
                            <a
                              href={job.platformUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {job.platform || "Open link"}
                            </a>
                          ) : (
                            <span>{job.platform}</span>
                          )}
                          {job.platformUrl ? (
                            <span
                              className="mt-0.5 block max-w-[180px] truncate text-xs text-zinc-500"
                              title={job.platformUrl}
                            >
                              {job.platformUrl}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={bodyCell}>
                      {job.experienceExpected || "—"}
                    </td>
                    <td className={bodyCell}>
                      <span
                        className="block max-w-[180px] truncate"
                        title={job.hrContent}
                      >
                        {job.hrContent || "—"}
                      </span>
                    </td>
                    <td className={bodyCell}>
                      <span
                        className="block max-w-[180px] truncate"
                        title={job.notes}
                      >
                        {job.notes || "—"}
                      </span>
                    </td>
                    <td className={bodyCell}>
                      <button
                        type="button"
                        onClick={() => setViewingJob(job)}
                        className="whitespace-nowrap rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        View JD
                      </button>
                    </td>
                    <td className={bodyCell}>
                      <select
                        value={job.status}
                        onChange={(event) =>
                          handleStatusChange(
                            job._id,
                            event.target.value as JobStatus,
                          )
                        }
                        className={`rounded-full px-2.5 py-1 text-xs font-medium outline-none ${STATUS_STYLES[job.status]}`}
                      >
                        {JOB_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${bodyCell} whitespace-nowrap text-right`}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingJob(job);
                          setFormOpen(true);
                        }}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(job)}
                        className="ml-3 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>


      <button
        type="button"
        onClick={() => SetDefaultResume(prev => !prev)}
        className="rounded-sm mt-10 cursor-pointer bg-white px-2 py-1 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Default Resume ⬇
      </button>
      {
        defaultResume && <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Default Resume</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Saved in MongoDB and available from the matcher with one click.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveResume}
              disabled={resumeSaving || resumeLoading}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resumeSaving ? "Saving..." : "Save resume"}
            </button>
          </div>
          <textarea
            value={resumeContent}
            onChange={(event) => setResumeContent(event.target.value)}
            placeholder="Paste your default resume text here..."
            rows={8}
            disabled={resumeLoading}
            className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {resumeMessage ? (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              {resumeMessage}
            </p>
          ) : null}
        </section>
      }

      {formOpen ? (
        <JobFormDialog
          job={editingJob}
          onClose={() => {
            setFormOpen(false);
            setEditingJob(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditingJob(null);
            void loadJobs();
          }}
        />
      ) : null}

      {viewingJob ? (
        <JobDescriptionDialog
          job={viewingJob}
          onClose={() => setViewingJob(null)}
        />
      ) : null}
    </main>
  );
}
