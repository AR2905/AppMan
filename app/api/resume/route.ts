import { connection } from "next/server";
import { Resume } from "@/app/lib/models/resume";
import { connectToDatabase } from "@/app/lib/mongodb";

function databaseError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.includes("MONGODB_URI")) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}

export async function GET() {
  await connection();

  try {
    await connectToDatabase();
    const resume = await Resume.findOne({ isDefault: true }).lean();
    return Response.json({ content: resume?.content ?? "" });
  } catch (error) {
    return databaseError(error, "Could not load the default resume.");
  }
}

export async function PUT(request: Request) {
  await connection();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const content =
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    typeof (body as Record<string, unknown>).content === "string"
      ? ((body as Record<string, unknown>).content as string)
      : null;

  if (content === null) {
    return Response.json(
      { error: "Resume content must be a string." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const resume = await Resume.findOneAndUpdate(
      { isDefault: true },
      { $set: { content, isDefault: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return Response.json({ content: resume?.content ?? content });
  } catch (error) {
    return databaseError(error, "Could not save the default resume.");
  }
}
