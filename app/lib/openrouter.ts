const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export class OpenRouterError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}

export async function getChatCompletion(
  system: string,
  user: string,
  referer?: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not configured on the server.",
      500,
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Title": "Resume JD Matcher",
  };

  if (referer) {
    headers["HTTP-Referer"] = referer;
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("OpenRouter error:", response.status, details);
    throw new OpenRouterError(
      `OpenRouter request failed (${response.status}).`,
      502,
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new OpenRouterError("The AI model returned an empty response.", 502);
  }

  return content;
}

export function parseJsonObject(content: string): Record<string, unknown> {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new OpenRouterError("The AI response did not contain valid JSON.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<
    string,
    unknown
  >;
}
