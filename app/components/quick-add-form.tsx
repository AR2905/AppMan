"use client";

import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Combobox } from "@/app/components/combobox";
import {
  JOB_STATUSES,
  createEmptyJob,
  type JobApplication,
  type JobFormValues,
  type JobStatus,
} from "@/app/lib/job-types";

type Props = {
  locationOptions: string[];
  platformOptions: string[];
  onAdded: (job: JobApplication) => void;
  onError: (message: string) => void;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const labelClass = "flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`${labelClass} ${className ?? ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function createQuickJob(): JobFormValues {
  return { ...createEmptyJob(), status: "Applied" };
}

export function QuickAddForm({
  locationOptions,
  platformOptions,
  onAdded,
  onError,
}: Props) {
  const [values, setValues] = useState<JobFormValues>(createQuickJob);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const companyRef = useRef<HTMLInputElement>(null);

  function setValue<K extends keyof JobFormValues>(
    key: K,
    value: JobFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.defaultPrevented) return;

    const target = event.target as HTMLElement;

    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;

    event.preventDefault();

    const focusables = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])',
      ),
    );
    const index = focusables.indexOf(target);
    focusables[index + 1]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!values.company.trim() || !values.role.trim()) {
      onError("Company and job role are required.");
      companyRef.current?.focus();
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add the application.");
      }

      onAdded(data.job as JobApplication);
      setValues(createQuickJob());
      setMessage("Application added. Keep going.");
      companyRef.current?.focus();
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Could not add the application.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Quick add</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Type, press Tab to move, Enter to pick a suggestion. Add with the
            button (or Tab to it and hit Enter).
          </p>
        </div>
        {message ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {message}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Company *">
          <input
            ref={companyRef}
            value={values.company}
            onChange={(event) => setValue("company", event.target.value)}
            placeholder="Acme Inc."
            className={inputClass}
            aria-label="Company"
            autoComplete="off"
          />
        </Field>

        <Field label="Role *">
          <input
            value={values.role}
            onChange={(event) => setValue("role", event.target.value)}
            placeholder="Frontend Developer"
            className={inputClass}
            aria-label="Job role"
            autoComplete="off"
          />
        </Field>

        <Field label="Applied on">
          <input
            type="date"
            value={values.appliedDate}
            onChange={(event) => setValue("appliedDate", event.target.value)}
            className={inputClass}
            aria-label="Applied on"
            suppressHydrationWarning
          />
        </Field>

        <Field label="Location">
          <Combobox
            value={values.location}
            onChange={(value) => setValue("location", value)}
            options={locationOptions}
            placeholder="Bengaluru, Pune, or type your own"
            ariaLabel="Location"
            className={inputClass}
          />
        </Field>

        <Field label="Salary offer">
          <input
            value={values.salaryOffer}
            onChange={(event) => setValue("salaryOffer", event.target.value)}
            placeholder="₹12 LPA"
            className={inputClass}
            aria-label="Salary offer"
            autoComplete="off"
          />
        </Field>

        <Field label="Salary expected">
          <input
            value={values.salaryExpected}
            onChange={(event) => setValue("salaryExpected", event.target.value)}
            placeholder="₹15 LPA"
            className={inputClass}
            aria-label="Salary expected"
            autoComplete="off"
          />
        </Field>

        <Field label="Platform">
          <Combobox
            value={values.platform}
            onChange={(value) => setValue("platform", value)}
            options={platformOptions}
            placeholder="LinkedIn, Naukri, or type your own"
            ariaLabel="Application platform"
            className={inputClass}
          />
        </Field>

        <Field label="Platform URL">
          <input
            value={values.platformUrl}
            onChange={(event) => setValue("platformUrl", event.target.value)}
            placeholder="https://..."
            className={inputClass}
            aria-label="Platform URL"
            autoComplete="off"
          />
        </Field>

        <Field label="Experience expected">
          <input
            value={values.experienceExpected}
            onChange={(event) =>
              setValue("experienceExpected", event.target.value)
            }
            placeholder="2-4 years"
            className={inputClass}
            aria-label="Experience expected"
            autoComplete="off"
          />
        </Field>

        <Field label="HR content">
          <input
            value={values.hrContent}
            onChange={(event) => setValue("hrContent", event.target.value)}
            placeholder="HR name, email, phone..."
            className={inputClass}
            aria-label="HR content"
            autoComplete="off"
          />
        </Field>

        <Field label="Notes">
          <input
            value={values.notes}
            onChange={(event) => setValue("notes", event.target.value)}
            placeholder="Anything to remember"
            className={inputClass}
            aria-label="Notes"
            autoComplete="off"
          />
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValue("status", event.target.value as JobStatus)
            }
            className={inputClass}
            aria-label="Status"
          >
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add application"}
        </button>
      </div>
    </form>
  );
}
