import {
  JOB_STATUSES,
  dateFromTimestamp,
  type JobApplication,
  type JobStatus,
} from "@/app/lib/job-types";

export const DEFAULT_LOCATIONS = [
  "Bengaluru",
  "Pune",
  "Ahmedabad",
  "Vadodara",
  "Remote",
  "Hyderabad",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
];

export const DEFAULT_PLATFORMS = [
  "LinkedIn",
  "Naukri",
  "Indeed",
  "Wellfound",
  "Foundit",
  "Internshala",
  "Company site",
  "Referral",
];

export type SortKey =
  | "date-desc"
  | "date-asc"
  | "company-asc"
  | "company-desc"
  | "status";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Newest applied first" },
  { value: "date-asc", label: "Oldest applied first" },
  { value: "company-asc", label: "Company (A–Z)" },
  { value: "company-desc", label: "Company (Z–A)" },
  { value: "status", label: "Status" },
];

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function jobAppliedDate(job: JobApplication): string {
  return job.appliedDate || dateFromTimestamp(job.createdAt);
}

export function formatAppliedDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value || "Unknown date";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function isoDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function sortWithinGroup(
  jobs: JobApplication[],
  sort: SortKey,
): JobApplication[] {
  const copy = [...jobs];

  if (sort === "company-asc") {
    return copy.sort((a, b) => a.company.localeCompare(b.company));
  }

  if (sort === "company-desc") {
    return copy.sort((a, b) => b.company.localeCompare(a.company));
  }

  if (sort === "status") {
    return copy.sort(
      (a, b) =>
        statusRank(a.status) - statusRank(b.status) ||
        a.company.localeCompare(b.company),
    );
  }

  return copy.sort((a, b) => {
    const aTime = a.createdAt ?? "";
    const bTime = b.createdAt ?? "";
    return sort === "date-asc"
      ? aTime.localeCompare(bTime)
      : bTime.localeCompare(aTime);
  });
}

function statusRank(status: JobStatus): number {
  return JOB_STATUSES.indexOf(status);
}
