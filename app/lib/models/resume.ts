import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const resumeSchema = new Schema(
  {
    content: { type: String, default: "" },
    isDefault: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ResumeDocument = InferSchemaType<typeof resumeSchema>;

export const Resume =
  (models.Resume as Model<ResumeDocument>) ||
  model<ResumeDocument>("Resume", resumeSchema);
