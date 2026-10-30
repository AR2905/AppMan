import type { NextRequest } from "next/server";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import {
  getChatCompletion,
  OpenRouterError,
  parseJsonObject,
} from "@/app/lib/openrouter";
import { normalizeSections } from "@/app/lib/resume-parse";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const EXTRACT_SYSTEM_PROMPT = `You are a resume parser. You will receive raw text extracted from a candidate's resume.

Convert it into structured sections.

Rules:
- Never invent employers, dates, degrees, certifications, projects, or skills.
- If a value is not present in the raw text, use an empty string or an empty array.
- "profileSummary": use the existing summary/objective if present. Otherwise write a brief summary using ONLY facts from the resume.
- "skills": a comma-separated list of skills found in the resume.
- "experience": one item per role, in resume order.
- "projects": one item per project, in resume order.
- "education" and "certifications" are plain text blocks.
- Keep descriptions close to the original wording; do not over-rewrite.

Return ONLY valid JSON with this exact shape, no markdown fences and no commentary:
{
  "sections": {
    "profileSummary": "text",
    "skills": "text",
    "experience": [
      {
        "title": "job title",
        "company": "company",
        "dates": "start - end",
        "description": "responsibilities and achievements"
      }
    ],
    "projects": [
      {
        "name": "project name",
        "description": "what it does, role, and tech used"
      }
    ],
    "education": "text",
    "certifications": "text"
  }
}`;

async function extractFileText(file: File, isPdf: boolean): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());

  if (isPdf) {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value;
}

export async function POST(request: NextRequest) {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  const mode = form.get("mode") === "sections" ? "sections" : "single";

  if (!(file instanceof File)) {
    return Response.json({ error: "No file was uploaded." }, { status: 400 });
  }

  if (file.size === 0) {
    return Response.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "The file is too large. Maximum size is 8 MB." },
      { status: 413 },
    );
  }

  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf");
  const isDocx = name.endsWith(".docx");

  if (!isPdf && !isDocx) {
    return Response.json(
      { error: "Only PDF and DOCX files are supported." },
      { status: 400 },
    );
  }

  let text: string;

  try {
    text = (await extractFileText(file, isPdf)).trim();
  } catch (error) {
    console.error("File extraction error:", error);
    return Response.json(
      {
        error:
          "Could not read text from that file. Make sure it is a valid PDF or DOCX.",
      },
      { status: 422 },
    );
  }

  if (!text) {
    return Response.json(
      {
        error:
          "No readable text was found. If this is a scanned PDF, try a text-based PDF or DOCX.",
      },
      { status: 422 },
    );
  }

  if (mode === "single") {
    return Response.json({ text });
  }

  try {
    const content = await getChatCompletion(
      EXTRACT_SYSTEM_PROMPT,
      `RAW RESUME TEXT:\n${text}`,
      request.nextUrl.origin,
    );
    const parsed = parseJsonObject(content);
    const sections = normalizeSections(parsed.sections);

    return Response.json({ text, sections });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("Resume parsing error:", error);
    return Response.json(
      { error: "Failed to parse the resume into sections. Please try again." },
      { status: 500 },
    );
  }
}
