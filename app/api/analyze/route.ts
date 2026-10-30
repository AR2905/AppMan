import type { NextRequest } from "next/server";
import {
  getChatCompletion,
  OpenRouterError,
  parseJsonObject,
} from "@/app/lib/openrouter";
import {
  isRecord,
  normalizeSections,
  toText,
} from "@/app/lib/resume-parse";
import {
  SECTION_KEYS,
  sectionsToText,
  type ResumeSections,
  type SectionKey,
} from "@/app/lib/resume-types";

const SINGLE_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume optimizer.

You will receive a JOB DESCRIPTION and a RESUME written as plain text.

Tasks:
1. Extract the most important keywords, skills, tools, technologies, certifications, and qualifications from the JOB DESCRIPTION that are missing from the RESUME.
2. Rank those missing keywords from most important to least important.
3. Rewrite the resume so it naturally includes as many of those keywords as possible while staying truthful to the candidate's real experience. Do not invent employers, dates, degrees, or certifications. Keep the same general structure and tone, and improve wording where helpful.
4. Give a match score from 0 to 100 based on how well the original resume matches the job description.

Return ONLY valid JSON with this exact shape, no markdown fences and no commentary:
{
  "matchScore": 0,
  "missingKeywords": ["most important keyword", "next keyword"],
  "updatedResume": "the full updated resume text"
}`;

const SECTIONS_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume optimizer.

You will receive a JOB DESCRIPTION and a RESUME split into sections as JSON. The JSON also contains a "lockedSections" array.

Tasks:
1. Extract the most important keywords, skills, tools, technologies, certifications, and qualifications from the JOB DESCRIPTION that are missing from the RESUME.
2. Rank those missing keywords from most important to least important.
3. Rewrite each section so it naturally includes as many missing keywords as possible while staying truthful to the candidate's real experience. Do not invent employers, dates, degrees, certifications, or projects. Improve wording where helpful.
4. Give a match score from 0 to 100 based on how well the original resume matches the job description.

Rules for experience and projects:
- Return EXACTLY the same number of items, in the same order, as the input.
- For experience items, return only the "description" field. Do not change job titles, companies, or dates.
- For projects, return only the "description" field. Do not change project names.

Rules for locked sections:
- Any section listed in "lockedSections" must be returned EXACTLY as provided, character for character.
- Still use locked section content as context, but never rewrite it.

Return ONLY valid JSON with this exact shape, no markdown fences and no commentary:
{
  "matchScore": 0,
  "missingKeywords": ["most important keyword", "next keyword"],
  "sections": {
    "profileSummary": "text",
    "skills": "text",
    "experience": [{ "description": "text" }],
    "projects": [{ "description": "text" }],
    "education": "text",
    "certifications": "text"
  }
}`;

type AnalyzeBody = {
  mode?: unknown;
  jobDescription?: unknown;
  resume?: unknown;
  sections?: unknown;
  lockedSections?: unknown;
};

function extractResultMeta(parsed: Record<string, unknown>) {
  const missingKeywords = Array.isArray(parsed.missingKeywords)
    ? parsed.missingKeywords
        .filter((keyword): keyword is string => typeof keyword === "string")
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    : [];

  const score = Number(parsed.matchScore);

  return {
    matchScore: Number.isFinite(score)
      ? Math.min(100, Math.max(0, Math.round(score)))
      : 0,
    missingKeywords,
  };
}

function normalizeKeywordList(value: unknown): SectionKey[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (key): key is SectionKey =>
      typeof key === "string" && SECTION_KEYS.includes(key as SectionKey),
  );
}

function asText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function mergeSections(
  original: ResumeSections,
  aiValue: unknown,
  locked: SectionKey[],
): ResumeSections {
  const ai = isRecord(aiValue) ? aiValue : {};
  const isLocked = (key: SectionKey) => locked.includes(key);

  const aiExperience = Array.isArray(ai.experience) ? ai.experience : [];
  const aiProjects = Array.isArray(ai.projects) ? ai.projects : [];

  return {
    profileSummary: isLocked("profileSummary")
      ? original.profileSummary
      : asText(ai.profileSummary, original.profileSummary),
    skills: isLocked("skills")
      ? original.skills
      : asText(ai.skills, original.skills),
    experience: original.experience.map((item, index) => {
      if (isLocked("experience")) return { ...item };
      const aiItem = isRecord(aiExperience[index]) ? aiExperience[index] : {};
      return {
        ...item,
        description: asText(aiItem.description, item.description),
      };
    }),
    projects: original.projects.map((item, index) => {
      if (isLocked("projects")) return { ...item };
      const aiItem = isRecord(aiProjects[index]) ? aiProjects[index] : {};
      return {
        ...item,
        description: asText(aiItem.description, item.description),
      };
    }),
    education: isLocked("education")
      ? original.education
      : asText(ai.education, original.education),
    certifications: isLocked("certifications")
      ? original.certifications
      : asText(ai.certifications, original.certifications),
  };
}

export async function POST(request: NextRequest) {
  let body: AnalyzeBody;

  try {
    body = (await request.json()) as AnalyzeBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const jobDescription = toText(body.jobDescription).trim();
  const mode = body.mode === "sections" ? "sections" : "single";
  const resume = toText(body.resume).trim();
  const sections = normalizeSections(body.sections);
  const locked = normalizeKeywordList(body.lockedSections);

  if (!jobDescription) {
    return Response.json(
      { error: "The job description is required." },
      { status: 400 },
    );
  }

  if (mode === "single" && !resume) {
    return Response.json(
      { error: "The resume content is required." },
      { status: 400 },
    );
  }

  if (mode === "sections" && !sectionsToText(sections).trim()) {
    return Response.json(
      { error: "Add content to at least one resume section." },
      { status: 400 },
    );
  }

  const systemPrompt =
    mode === "sections" ? SECTIONS_SYSTEM_PROMPT : SINGLE_SYSTEM_PROMPT;

  const userContent =
    mode === "sections"
      ? JSON.stringify(
          { jobDescription, lockedSections: locked, sections },
          null,
          2,
        )
      : `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resume}`;

  try {
    const content = await getChatCompletion(
      systemPrompt,
      userContent,
      request.nextUrl.origin,
    );
    const parsed = parseJsonObject(content);
    const meta = extractResultMeta(parsed);

    if (mode === "sections") {
      const updatedSections = mergeSections(sections, parsed.sections, locked);
      return Response.json({
        ...meta,
        updatedSections,
        updatedResume: sectionsToText(updatedSections),
      });
    }

    return Response.json({
      ...meta,
      updatedResume:
        typeof parsed.updatedResume === "string"
          ? parsed.updatedResume.trim()
          : "",
    });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      return Response.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Analyze route error:", error);
    return Response.json(
      { error: "Failed to analyze the resume. Please try again." },
      { status: 500 },
    );
  }
}
