"use client";

import { io } from "next/cache";
import {
  Fragment,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { JobDescriptionDialog } from "@/app/components/job-description-dialog";
import { JobFormDialog } from "@/app/components/job-form-dialog";
import { QuickAddForm } from "@/app/components/quick-add-form";
import {
  JOB_STATUSES,
  type JobApplication,
  type JobStatus,
} from "@/app/lib/job-types";
import {
  DEFAULT_LOCATIONS,
  DEFAULT_PLATFORMS,
  SORT_OPTIONS,
  formatAppliedDate,
  isoDateDaysAgo,
  jobAppliedDate,
  sortWithinGroup,
  uniqueSorted,
  type SortKey,
} from "@/app/lib/job-utils";
import { Edit2, Trash } from "lucide-react";

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

const COLUMN_COUNT = 11;

const headerCell =
  "whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500";
const bodyCell = "px-3 py-3";
const filterLabel =
  "flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400";
const filterControl =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

type DateFilter = "all" | "today" | "7" | "30";

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export function JobsView() {
  use(io());

  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [viewingJob, setViewingJob] = useState<JobApplication | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | JobStatus>("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sort, setSort] = useState<SortKey>("date-desc");

  const [resumeContent, setResumeContent] = useState("");
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [defaultResume, SetDefaultResume] = useState(false);

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

  const locationOptions = useMemo(
    () => uniqueSorted([...DEFAULT_LOCATIONS, ...jobs.map((job) => job.location)]),
    [jobs],
  );

  const platformOptions = useMemo(
    () => uniqueSorted([...DEFAULT_PLATFORMS, ...jobs.map((job) => job.platform)]),
    [jobs],
  );

  const usedLocations = useMemo(
    () => uniqueSorted(jobs.map((job) => job.location)),
    [jobs],
  );

  const usedPlatforms = useMemo(
    () => uniqueSorted(jobs.map((job) => job.platform)),
    [jobs],
  );

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = isoDateDaysAgo(0);
    const weekAgo = isoDateDaysAgo(7);
    const monthAgo = isoDateDaysAgo(30);

    const filtered = jobs.filter((job) => {
      if (query && !job.company.toLowerCase().includes(query)) {
        return false;
      }

      if (statusFilter !== "All" && job.status !== statusFilter) {
        return false;
      }

      if (locationFilter !== "All" && job.location !== locationFilter) {
        return false;
      }

      if (platformFilter !== "All" && job.platform !== platformFilter) {
        return false;
      }

      if (dateFilter !== "all") {
        const day = jobAppliedDate(job);
        if (dateFilter === "today" && day !== today) return false;
        if (dateFilter === "7" && day < weekAgo) return false;
        if (dateFilter === "30" && day < monthAgo) return false;
      }

      return true;
    });

    const byDay = new Map<string, JobApplication[]>();

    for (const job of filtered) {
      const day = jobAppliedDate(job);
      const bucket = byDay.get(day) ?? [];
      bucket.push(job);
      byDay.set(day, bucket);
    }

    const result = Array.from(byDay.entries()).map(([day, items]) => ({
      day,
      items: sortWithinGroup(items, sort),
    }));

    result.sort((a, b) =>
      sort === "date-asc"
        ? a.day.localeCompare(b.day)
        : b.day.localeCompare(a.day),
    );

    return result;
  }, [
    jobs,
    search,
    statusFilter,
    locationFilter,
    platformFilter,
    dateFilter,
    sort,
  ]);

  const filteredCount = useMemo(
    () => groups.reduce((total, group) => total + group.items.length, 0),
    [groups],
  );

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    locationFilter !== "All" ||
    platformFilter !== "All" ||
    dateFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setLocationFilter("All");
    setPlatformFilter("All");
    setDateFilter("all");
  }

  function handleAdded(job: JobApplication) {
    setError("");
    setJobs((prev) => [job, ...prev]);
  }

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
            Track every job you apply
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
          + Add New
        </button>
      </header>

      {error ? (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <QuickAddForm
        locationOptions={locationOptions}
        platformOptions={platformOptions}
        onAdded={handleAdded}
        onError={setError}
      />

      <section className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <label className={`${filterLabel} min-w-[220px] flex-1`}>
          <span>Search company</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company name..."
            className={filterControl}
          />
        </label>

        <label className={filterLabel}>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "All" | JobStatus)
            }
            className={filterControl}
          >
            <option value="All">All statuses</option>
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className={filterLabel}>
          <span>Location</span>
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className={filterControl}
          >
            <option value="All">All locations</option>
            {usedLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <label className={filterLabel}>
          <span>Platform</span>
          <select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value)}
            className={filterControl}
          >
            <option value="All">All platforms</option>
            {usedPlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>

        <label className={filterLabel}>
          <span>Date</span>
          <select
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value as DateFilter)
            }
            className={filterControl}
          >
            {DATE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={filterLabel}>
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className={filterControl}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Clear filters
          </button>
        ) : null}
      </section>

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
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="text-sm font-medium">
              No applications match your filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs text-zinc-500">
              Showing {filteredCount} of {jobs.length} applications across{" "}
              {groups.length} {groups.length === 1 ? "day" : "days"}.
            </p>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[1400px] text-left text-sm">
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
                  {groups.map((group) => (
                    <Fragment key={group.day}>
                      <tr className="bg-zinc-100 dark:bg-zinc-900">
                        <td colSpan={COLUMN_COUNT} className="px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                              {formatAppliedDate(group.day)}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {group.items.length}{" "}
                              {group.items.length === 1
                                ? "application"
                                : "applications"}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {group.items.map((job) => (
                        <tr
                          key={job._id}
                          className="align-top transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                          <td className={`${bodyCell} font-medium`}>
                            {job.company}
                          </td>
                          <td className={bodyCell}>{job.role}</td>
                          <td className={bodyCell}>{job.location || "—"}</td>
                          <td className={bodyCell}>
                            <div className="text-xs text-zinc-500">Offer</div>
                            <div>{job.salaryOffer || "—"}</div>
                            <div className="mt-1 text-xs text-zinc-500">
                              Expected
                            </div>
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
                          <td
                            className={`${bodyCell} whitespace-nowrap text-right`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditingJob(job);
                                setFormOpen(true);
                              }}
                              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                              aria-label={`Edit application at ${job.company}`}
                            >
                              <Edit2 size={14}></Edit2>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(job)}
                              className="ml-3 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                              aria-label={`Delete application at ${job.company}`}
                            >
                              <Trash size={14}></Trash>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <button
        type="button"
        onClick={() => SetDefaultResume((prev) => !prev)}
        className="rounded-sm mt-10 cursor-pointer bg-white px-2 py-1 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Default Resume ⬇
      </button>
      {defaultResume && (
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
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
      )}

      {formOpen ? (
        <JobFormDialog
          job={editingJob}
          locationOptions={locationOptions}
          platformOptions={platformOptions}
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
