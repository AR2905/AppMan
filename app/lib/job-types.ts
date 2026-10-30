export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

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
  };
}

export function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    (JOB_STATUSES as readonly string[]).includes(value)
  );
}
