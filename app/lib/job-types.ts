export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_SOURCES = ["manual", "imported"] as const;

export type JobSource = (typeof JOB_SOURCES)[number];

export function toLocalISODate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function todayISODate(): string {
  return toLocalISODate(new Date());
}

export function dateFromTimestamp(timestamp?: string): string {
  if (!timestamp) return todayISODate();
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? todayISODate() : toLocalISODate(date);
}

export type JobApplication = {
  _id: string;
  company: string;
  role: string;
  location: string;
  salaryOffer: string;
  salaryExpected: string;
  platform: string;
  platformUrl: string;
  experienceExpected: string;
  hrContent: string;
  notes: string;
  jobDescription: string;
  status: JobStatus;
  appliedDate: string;
  source?: JobSource;
  importedFrom?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type JobFormValues = {
  company: string;
  role: string;
  location: string;
  salaryOffer: string;
  salaryExpected: string;
  platform: string;
  platformUrl: string;
  experienceExpected: string;
  hrContent: string;
  notes: string;
  jobDescription: string;
  status: JobStatus;
  appliedDate: string;
};

export const JOB_FIELDS = [
  "company",
  "role",
  "location",
  "salaryOffer",
  "salaryExpected",
  "platform",
  "platformUrl",
  "experienceExpected",
  "hrContent",
  "notes",
  "jobDescription",
  "status",
  "appliedDate",
] as const;

export function createEmptyJob(): JobFormValues {
  return {
    company: "",
    role: "",
    location: "",
    salaryOffer: "",
    salaryExpected: "",
    platform: "",
    platformUrl: "",
    experienceExpected: "",
    hrContent: "",
    notes: "",
    jobDescription: "",
    status: "Saved",
    appliedDate: todayISODate(),
  };
}

export function jobToFormValues(job: JobApplication): JobFormValues {
  return {
    company: job.company,
    role: job.role,
    location: job.location,
    salaryOffer: job.salaryOffer,
    salaryExpected: job.salaryExpected,
    platform: job.platform,
    platformUrl: job.platformUrl,
    experienceExpected: job.experienceExpected,
    hrContent: job.hrContent,
    notes: job.notes,
    jobDescription: job.jobDescription,
    status: job.status,
    appliedDate: job.appliedDate || dateFromTimestamp(job.createdAt),
  };
}

export function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    (JOB_STATUSES as readonly string[]).includes(value)
  );
}
