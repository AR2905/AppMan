"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  JOB_STATUSES,
  createEmptyJob,
  jobToFormValues,
  type JobApplication,
  type JobFormValues,
  type JobStatus,
} from "@/app/lib/job-types";

type Props = {
  job: JobApplication | null;
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const textareaClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

type FieldProps = {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

function Field({ label, required, className, children }: FieldProps) {
  return (
    <label
      className={`flex flex-col gap-1 text-sm font-medium ${className ?? ""}`}
    >
      <span>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

export function JobFormDialog({ job, onClose, onSaved }: Props) {
  const [values, setValues] = useState<JobFormValues>(() =>
    job ? jobToFormValues(job) : createEmptyJob(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setValue<K extends keyof JobFormValues>(
    key: K,
    value: JobFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.company.trim() || !values.role.trim()) {
      setError("Company and job role are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        job ? `/api/jobs/${job._id}` : "/api/jobs",
        {
          method: job ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the application.");
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the application.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {job ? "Edit application" : "Add application"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Track the details of this job application.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Company" required>
            <input
              value={values.company}
              onChange={(event) => setValue("company", event.target.value)}
              placeholder="Acme Inc."
              className={inputClass}
            />
          </Field>

          <Field label="Job Role" required>
            <input
              value={values.role}
              onChange={(event) => setValue("role", event.target.value)}
              placeholder="Frontend Developer"
              className={inputClass}
            />
          </Field>

          <Field label="Location">
            <input
              value={values.location}
              onChange={(event) => setValue("location", event.target.value)}
              placeholder="Remote / Bengaluru"
              className={inputClass}
            />
          </Field>

          <Field label="Experience Expected">
            <input
              value={values.experienceExpected}
              onChange={(event) =>
                setValue("experienceExpected", event.target.value)
              }
              placeholder="2-4 years"
              className={inputClass}
            />
          </Field>

          <Field label="Salary Offer">
            <input
              value={values.salaryOffer}
              onChange={(event) => setValue("salaryOffer", event.target.value)}
              placeholder="₹12 LPA"
              className={inputClass}
            />
          </Field>

          <Field label="My Expected Salary">
            <input
              value={values.salaryExpected}
              onChange={(event) =>
                setValue("salaryExpected", event.target.value)
              }
              placeholder="₹15 LPA"
              className={inputClass}
            />
          </Field>

          <Field label="Application Platform">
            <input
              value={values.platform}
              onChange={(event) => setValue("platform", event.target.value)}
              placeholder="LinkedIn / Naukri / Company site"
              className={inputClass}
            />
          </Field>

          <Field label="Platform URL">
            <input
              value={values.platformUrl}
              onChange={(event) => setValue("platformUrl", event.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <select
              value={values.status}
              onChange={(event) =>
                setValue("status", event.target.value as JobStatus)
              }
              className={inputClass}
            >
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>

          <Field label="HR Content" className="sm:col-span-2">
            <textarea
              value={values.hrContent}
              onChange={(event) => setValue("hrContent", event.target.value)}
              placeholder="HR name, email, phone, or conversation notes..."
              rows={3}
              className={textareaClass}
            />
          </Field>

          <Field label="Notes" className="sm:col-span-2">
            <textarea
              value={values.notes}
              onChange={(event) => setValue("notes", event.target.value)}
              placeholder="Anything you want to remember about this application..."
              rows={3}
              className={textareaClass}
            />
          </Field>

          <Field label="Job Description" className="sm:col-span-2">
            <textarea
              value={values.jobDescription}
              onChange={(event) =>
                setValue("jobDescription", event.target.value)
              }
              placeholder="Paste the full job description here..."
              rows={8}
              className={textareaClass}
            />
          </Field>

          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : job ? "Save changes" : "Add job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
