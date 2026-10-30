import { isJobStatus } from "@/app/lib/job-types";

const TEXT_FIELDS = [
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
] as const;

export class JobPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobPayloadError";
  }
}

export function buildJobPayload(
  value: unknown,
  partial: boolean,
): Record<string, string> {
  const record =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const payload: Record<string, string> = {};

  for (const field of TEXT_FIELDS) {
    if (partial && !(field in record)) continue;
    const raw = record[field];
    payload[field] = typeof raw === "string" ? raw.trim() : "";
  }

  if ("status" in record) {
    if (!isJobStatus(record.status)) {
      throw new JobPayloadError("Invalid status value.");
    }
    payload.status = record.status;
  } else if (!partial) {
    payload.status = "Saved";
  }

  return payload;
}
