"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Combobox } from "@/app/components/combobox";
import { JobDescriptionDialog } from "@/app/components/job-description-dialog";
import { JobFormDialog } from "@/app/components/job-form-dialog";
import {
  JOB_STATUSES,
  createEmptyJob,
  type JobApplication,
  type JobFormValues,
  type JobSource,
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

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const labelClass =
  "flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400";

type DateFilter = "all" | "today" | "7" | "30";

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

type SourceFilter = "All" | JobSource;

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: "All", label: "All sources" },
  { value: "manual", label: "Added manually" },
  { value: "imported", label: "Imported" },
];

function createQuickJob(): JobFormValues {
  return { ...createEmptyJob(), status: "Applied" };
}

export function JobsMobile() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [viewingJob, setViewingJob] = useState<JobApplication | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | JobStatus>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickValues, setQuickValues] = useState<JobFormValues>(createQuickJob);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const quickCompanyRef = useRef<HTMLInputElement>(null);

  const [resumeContent, setResumeContent] = useState("");
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeOpen, setResumeOpen] = useState(false);

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

      if (
        sourceFilter !== "All" &&
        (job.source ?? "manual") !== sourceFilter
      ) {
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
    sourceFilter,
    locationFilter,
    platformFilter,
    dateFilter,
    sort,
  ]);

  const filteredCount = useMemo(
    () => groups.reduce((total, group) => total + group.items.length, 0),
    [groups],
  );

  const activeFilterCount =
    (statusFilter !== "All" ? 1 : 0) +
    (sourceFilter !== "All" ? 1 : 0) +
    (locationFilter !== "All" ? 1 : 0) +
    (platformFilter !== "All" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0);

  const hasFilters = activeFilterCount > 0 || search.trim() !== "";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setSourceFilter("All");
    setLocationFilter("All");
    setPlatformFilter("All");
    setDateFilter("all");
  }

  function handleAdded(job: JobApplication) {
    setError("");
    setJobs((prev) => [job, ...prev]);
  }

  async function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuickMessage("");

    if (!quickValues.company.trim() || !quickValues.role.trim()) {
      setError("Company and job role are required.");
      quickCompanyRef.current?.focus();
      return;
    }

    setQuickSaving(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickValues),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add the application.");
      }

      handleAdded(data.job as JobApplication);
      setQuickValues(createQuickJob());
      setQuickMessage("Application added.");
      setQuickOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add the application.",
      );
    } finally {
      setQuickSaving(false);
    }
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
    <main className="flex w-full flex-1 flex-col px-4 pb-16 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Store</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Track every job you apply
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingJob(null);
            setFormOpen(true);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition active:opacity-80"
        >
          <Plus size={16} /> Add
        </button>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <section className="mb-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40">
        <button
          type="button"
          onClick={() => setQuickOpen((prev) => !prev)}
          aria-expanded={quickOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Plus size={16} /> Quick add
          </span>
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform ${
              quickOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {quickOpen ? (
          <form onSubmit={handleQuickAdd} className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <label className={labelClass}>
                <span>Company *</span>
                <input
                  ref={quickCompanyRef}
                  value={quickValues.company}
                  onChange={(event) =>
                    setQuickValues((prev) => ({
                      ...prev,
                      company: event.target.value,
                    }))
                  }
                  placeholder="Acme Inc."
                  autoComplete="off"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span>Role *</span>
                <input
                  value={quickValues.role}
                  onChange={(event) =>
                    setQuickValues((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                  placeholder="Frontend Developer"
                  autoComplete="off"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span>Location</span>
                <Combobox
                  value={quickValues.location}
                  onChange={(value) =>
                    setQuickValues((prev) => ({ ...prev, location: value }))
                  }
                  options={locationOptions}
                  placeholder="Bengaluru, Pune, or type your own"
                  ariaLabel="Location"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span>Platform</span>
                <Combobox
                  value={quickValues.platform}
                  onChange={(value) =>
                    setQuickValues((prev) => ({ ...prev, platform: value }))
                  }
                  options={platformOptions}
                  placeholder="LinkedIn, Naukri, or type your own"
                  ariaLabel="Application platform"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span>Status</span>
                <select
                  value={quickValues.status}
                  onChange={(event) =>
                    setQuickValues((prev) => ({
                      ...prev,
                      status: event.target.value as JobStatus,
                    }))
                  }
                  className={inputClass}
                >
                  {JOB_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {quickMessage ? (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                {quickMessage}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={quickSaving}
                className="h-11 flex-1 rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition active:opacity-80 disabled:opacity-50"
              >
                {quickSaving ? "Adding..." : "Add application"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingJob(null);
                  setFormOpen(true);
                }}
                className="h-11 rounded-xl border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
              >
                Full details
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company..."
            className={`${inputClass} pl-9`}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-expanded={filtersOpen}
          className="relative inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl border border-zinc-300 px-3 text-sm font-medium dark:border-zinc-700"
        >
          <SlidersHorizontal size={15} /> Filters
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {filtersOpen ? (
        <section className="mb-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 flex flex-wrap gap-2">
            {(["All", ...JOB_STATUSES] as ("All" | JobStatus)[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === status
                      ? "bg-foreground text-background"
                      : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {status === "All" ? "All statuses" : status}
                </button>
              ),
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className={labelClass}>
              <span>Source</span>
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as SourceFilter)
                }
                className={inputClass}
              >
                {SOURCE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              <span>Date</span>
              <select
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value as DateFilter)
                }
                className={inputClass}
              >
                {DATE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              <span>Location</span>
              <select
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
                className={inputClass}
              >
                <option value="All">All locations</option>
                {usedLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              <span>Platform</span>
              <select
                value={platformFilter}
                onChange={(event) => setPlatformFilter(event.target.value)}
                className={inputClass}
              >
                <option value="All">All platforms</option>
                {usedPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>

            <label className={`${labelClass} col-span-2`}>
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className={inputClass}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-medium dark:border-zinc-700"
            >
              Clear filters
            </button>
          ) : null}
        </section>
      ) : null}

      <section>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm font-medium">No applications yet.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Add the first job you applied to and start tracking it.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingJob(null);
                setFormOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
            >
              <Plus size={15} /> Add application
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm font-medium">
              No applications match your filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-zinc-500">
              Showing {filteredCount} of {jobs.length} applications across{" "}
              {groups.length} {groups.length === 1 ? "day" : "days"}.
            </p>
            {groups.map((group) => (
              <div key={group.day}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    {formatAppliedDate(group.day)}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {group.items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {group.items.map((job) => {
                    const expanded = expandedId === job._id;
                    return (
                      <article
                        key={job._id}
                        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="truncate text-base font-semibold">
                                {job.company}
                              </h2>
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  job.source === "imported"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                }`}
                                title={
                                  job.source === "imported"
                                    ? `Imported from ${job.importedFrom || "spreadsheet"}`
                                    : "Added manually"
                                }
                              >
                                {job.source === "imported" ? "Imp" : "Manual"}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                              {job.role || "—"}
                            </p>
                          </div>
                          <select
                            value={job.status}
                            onChange={(event) =>
                              handleStatusChange(
                                job._id,
                                event.target.value as JobStatus,
                              )
                            }
                            aria-label={`Status for ${job.company}`}
                            className={`shrink-0 rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold outline-none ${STATUS_STYLES[job.status]}`}
                          >
                            {JOB_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex min-w-0 items-start gap-1.5">
                            <MapPin
                              size={13}
                              className="mt-0.5 shrink-0 text-zinc-400"
                            />
                            <span className="truncate text-zinc-600 dark:text-zinc-300">
                              {job.location || "—"}
                            </span>
                          </div>
                          <div className="min-w-0 text-zinc-600 dark:text-zinc-300">
                            <span className="text-zinc-400">Exp: </span>
                            <span className="truncate">
                              {job.experienceExpected || "—"}
                            </span>
                          </div>
                          <div className="min-w-0 text-zinc-600 dark:text-zinc-300">
                            <span className="text-zinc-400">Offer: </span>
                            <span className="truncate">
                              {job.salaryOffer || "—"}
                            </span>
                          </div>
                          <div className="min-w-0 text-zinc-600 dark:text-zinc-300">
                            <span className="text-zinc-400">Expected: </span>
                            <span className="truncate">
                              {job.salaryExpected || "—"}
                            </span>
                          </div>
                        </div>

                        {job.platform || job.platformUrl ? (
                          <div className="mt-2 text-xs">
                            {job.platformUrl ? (
                              <a
                                href={job.platformUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1 text-blue-600 dark:text-blue-400"
                              >
                                <ExternalLink size={12} className="shrink-0" />
                                <span className="truncate">
                                  {job.platform || job.platformUrl}
                                </span>
                              </a>
                            ) : (
                              <span className="text-zinc-600 dark:text-zinc-300">
                                {job.platform}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {expanded ? (
                          <div className="mt-3 flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-950/60">
                            <div>
                              <p className="font-semibold text-zinc-500">
                                HR content
                              </p>
                              <p className="mt-0.5 whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-200">
                                {job.hrContent || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-500">
                                Notes
                              </p>
                              <p className="mt-0.5 whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-200">
                                {job.notes || "—"}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingJob(job)}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 text-xs font-medium dark:border-zinc-700"
                          >
                            <FileText size={14} /> View JD
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : job._id)
                            }
                            aria-expanded={expanded}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-zinc-300 px-2.5 text-xs font-medium dark:border-zinc-700"
                          >
                            <ChevronDown
                              size={14}
                              className={`transition-transform ${
                                expanded ? "rotate-180" : ""
                              }`}
                            />
                            {expanded ? "Less" : "More"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJob(job);
                              setFormOpen(true);
                            }}
                            aria-label={`Edit application at ${job.company}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-blue-600 dark:border-zinc-700 dark:text-blue-400"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(job)}
                            aria-label={`Delete application at ${job.company}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-red-600 dark:border-zinc-700 dark:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setResumeOpen((prev) => !prev)}
          aria-expanded={resumeOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold">Default resume</span>
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform ${
              resumeOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {resumeOpen ? (
          <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <p className="mb-2 text-xs text-zinc-500">
              Saved in MongoDB and available from the matcher with one click.
            </p>
            <textarea
              value={resumeContent}
              onChange={(event) => setResumeContent(event.target.value)}
              placeholder="Paste your default resume text here..."
              rows={8}
              disabled={resumeLoading}
              className={`${inputClass} resize-y disabled:opacity-60`}
            />
            {resumeMessage ? (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                {resumeMessage}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleSaveResume}
              disabled={resumeSaving || resumeLoading}
              className="mt-3 h-11 w-full rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition active:opacity-80 disabled:opacity-50"
            >
              {resumeSaving ? "Saving..." : "Save resume"}
            </button>
          </div>
        ) : null}
      </section>

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
