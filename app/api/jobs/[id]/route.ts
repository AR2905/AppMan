import { isValidObjectId } from "mongoose";
import { connection } from "next/server";
import { buildJobPayload, JobPayloadError } from "@/app/lib/job-payload";
import { JobApplication } from "@/app/lib/models/job-application";
import { connectToDatabase } from "@/app/lib/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function databaseError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.includes("MONGODB_URI")) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}

export async function PATCH(request: Request, context: RouteContext) {
  await connection();

  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return Response.json({ error: "Invalid job id." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let payload: Record<string, string>;

  try {
    payload = buildJobPayload(body, true);
  } catch (error) {
    if (error instanceof JobPayloadError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  if (Object.keys(payload).length === 0) {
    return Response.json({ error: "No fields to update." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const job = await JobApplication.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true },
    ).lean();

    if (!job) {
      return Response.json(
        { error: "Job application not found." },
        { status: 404 },
      );
    }

    return Response.json({ job });
  } catch (error) {
    return databaseError(error, "Could not update the job application.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  await connection();

  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return Response.json({ error: "Invalid job id." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const job = await JobApplication.findByIdAndDelete(id).lean();

    if (!job) {
      return Response.json(
        { error: "Job application not found." },
        { status: 404 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return databaseError(error, "Could not delete the job application.");
  }
}
