import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { JOB_SOURCES, JOB_STATUSES } from "@/app/lib/job-types";

const jobApplicationSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    salaryOffer: { type: String, default: "", trim: true },
    salaryExpected: { type: String, default: "", trim: true },
    platform: { type: String, default: "", trim: true },
    platformUrl: { type: String, default: "", trim: true },
    experienceExpected: { type: String, default: "", trim: true },
    hrContent: { type: String, default: "" },
    notes: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    appliedDate: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "Saved",
    },
    source: {
      type: String,
      enum: JOB_SOURCES,
      default: "manual",
    },
    importedFrom: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export type JobApplicationDocument = InferSchemaType<
  typeof jobApplicationSchema
>;

export const JobApplication =
  (models.JobApplication as Model<JobApplicationDocument>) ||
  model<JobApplicationDocument>("JobApplication", jobApplicationSchema);
