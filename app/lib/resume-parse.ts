import type {
  ExperienceItem,
  ProjectItem,
  ResumeSections,
} from "@/app/lib/resume-types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeExperience(value: unknown): ExperienceItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
    title: toText(item.title),
    company: toText(item.company),
    dates: toText(item.dates),
    description: toText(item.description),
  }));
}

function normalizeProjects(value: unknown): ProjectItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
    name: toText(item.name),
    description: toText(item.description),
  }));
}

export function normalizeSections(value: unknown): ResumeSections {
  const record = isRecord(value) ? value : {};
  return {
    profileSummary: toText(record.profileSummary),
    skills: toText(record.skills),
    experience: normalizeExperience(record.experience),
    projects: normalizeProjects(record.projects),
    education: toText(record.education),
    certifications: toText(record.certifications),
  };
}
