import { connection } from "next/server";
import { buildJobPayload, JobPayloadError } from "@/app/lib/job-payload";
import { JobApplication } from "@/app/lib/models/job-application";
import { connectToDatabase } from "@/app/lib/mongodb";

function databaseError(error: unknown) {
  if (error instanceof Error && error.message.includes("MONGODB_URI")) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.error("Job store GET error:", error);
  return Response.json(
    { error: "Could not load job applications." },
    { status: 500 },
  );
}

export async function GET() {
  await connection();

  try {
    await connectToDatabase();
    const jobs = await JobApplication.find().sort({ createdAt: -1 }).lean();
    return Response.json({ jobs });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  await connection();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let payload: Record<string, string>;

  try {
    payload = buildJobPayload(body, false);
  } catch (error) {
    if (error instanceof JobPayloadError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  if (!payload.company || !payload.role) {
    return Response.json(
      { error: "Company and job role are required." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const job = await JobApplication.create(payload);
    return Response.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.error("Job store POST error:", error);
    return Response.json(
      { error: "Could not save the job application." },
      { status: 500 },
    );
  }
}
