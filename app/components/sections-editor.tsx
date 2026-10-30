"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  createExperienceItem,
  createProjectItem,
  type ExperienceItem,
  type LockedSections,
  type ResumeSections,
  type SectionKey,
} from "@/app/lib/resume-types";

type Props = {
  sections: ResumeSections;
  setSections: Dispatch<SetStateAction<ResumeSections>>;
  locked: LockedSections;
  setLocked: Dispatch<SetStateAction<LockedSections>>;
};

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const textareaClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

type SectionCardProps = {
  title: string;
  hint: string;
  locked: boolean;
  onToggleLock: () => void;
  children: ReactNode;
};

function SectionCard({
  title,
  hint,
  locked,
  onToggleLock,
  children,
}: SectionCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        locked
          ? "border-amber-300 bg-amber-50/60 dark:border-amber-700/60 dark:bg-amber-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={locked}
            onChange={onToggleLock}
            className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
          />
          Keep unchanged
        </label>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function SectionsEditor({
  sections,
  setSections,
  locked,
  setLocked,
}: Props) {
  function toggleLock(key: SectionKey) {
    setLocked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateField(
    field: "profileSummary" | "skills" | "education" | "certifications",
    value: string,
  ) {
    setSections((prev) => ({ ...prev, [field]: value }));
  }

  function updateExperience(id: string, patch: Partial<ExperienceItem>) {
    setSections((prev) => ({
      ...prev,
      experience: prev.experience.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function updateProject(id: string, patch: { name?: string; description?: string }) {
    setSections((prev) => ({
      ...prev,
      projects: prev.projects.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Profile Summary"
        hint="A short intro about you and your focus."
        locked={locked.profileSummary}
        onToggleLock={() => toggleLock("profileSummary")}
      >
        <textarea
          value={sections.profileSummary}
          onChange={(event) => updateField("profileSummary", event.target.value)}
          placeholder="e.g. Frontend developer with 4 years of experience building..."
          rows={4}
          className={textareaClass}
        />
      </SectionCard>

      <SectionCard
        title="Skills"
        hint="List your skills, tools, and technologies."
        locked={locked.skills}
        onToggleLock={() => toggleLock("skills")}
      >
        <textarea
          value={sections.skills}
          onChange={(event) => updateField("skills", event.target.value)}
          placeholder="e.g. React, TypeScript, Next.js, Node.js, PostgreSQL..."
          rows={4}
          className={textareaClass}
        />
      </SectionCard>

      <SectionCard
        title="Experience"
        hint="Add each role separately. Only descriptions are rewritten."
        locked={locked.experience}
        onToggleLock={() => toggleLock("experience")}
      >
        <div className="flex flex-col gap-3">
          {sections.experience.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Experience {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSections((prev) => ({
                      ...prev,
                      experience: prev.experience.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    }))
                  }
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <input
                  value={item.title}
                  onChange={(event) =>
                    updateExperience(item.id, { title: event.target.value })
                  }
                  placeholder="Job title"
                  aria-label={`Experience ${index + 1} job title`}
                  className={fieldClass}
                />
                <input
                  value={item.company}
                  onChange={(event) =>
                    updateExperience(item.id, { company: event.target.value })
                  }
                  placeholder="Company"
                  aria-label={`Experience ${index + 1} company`}
                  className={fieldClass}
                />
                <input
                  value={item.dates}
                  onChange={(event) =>
                    updateExperience(item.id, { dates: event.target.value })
                  }
                  placeholder="Dates"
                  aria-label={`Experience ${index + 1} dates`}
                  className={fieldClass}
                />
              </div>
              <textarea
                value={item.description}
                onChange={(event) =>
                  updateExperience(item.id, { description: event.target.value })
                }
                placeholder="Responsibilities and achievements..."
                aria-label={`Experience ${index + 1} description`}
                rows={4}
                className={`${textareaClass} mt-2`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setSections((prev) => ({
                ...prev,
                experience: [...prev.experience, createExperienceItem()],
              }))
            }
            className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + Add experience
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Projects"
        hint="Add each project separately. Only descriptions are rewritten."
        locked={locked.projects}
        onToggleLock={() => toggleLock("projects")}
      >
        <div className="flex flex-col gap-3">
          {sections.projects.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Project {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSections((prev) => ({
                      ...prev,
                      projects: prev.projects.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    }))
                  }
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </div>
              <input
                value={item.name}
                onChange={(event) =>
                  updateProject(item.id, { name: event.target.value })
                }
                placeholder="Project name"
                aria-label={`Project ${index + 1} name`}
                className={`${fieldClass} mt-2`}
              />
              <textarea
                value={item.description}
                onChange={(event) =>
                  updateProject(item.id, { description: event.target.value })
                }
                placeholder="What it does, your role, and the tech used..."
                aria-label={`Project ${index + 1} description`}
                rows={3}
                className={`${textareaClass} mt-2`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setSections((prev) => ({
                ...prev,
                projects: [...prev.projects, createProjectItem()],
              }))
            }
            className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + Add project
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Education"
        hint="Degrees, schools, and dates."
        locked={locked.education}
        onToggleLock={() => toggleLock("education")}
      >
        <textarea
          value={sections.education}
          onChange={(event) => updateField("education", event.target.value)}
          placeholder="e.g. B.Tech in Computer Science, XYZ University, 2019 - 2023"
          rows={3}
          className={textareaClass}
        />
      </SectionCard>

      <SectionCard
        title="Certifications"
        hint="Relevant certifications and licenses."
        locked={locked.certifications}
        onToggleLock={() => toggleLock("certifications")}
      >
        <textarea
          value={sections.certifications}
          onChange={(event) => updateField("certifications", event.target.value)}
          placeholder="e.g. AWS Certified Developer - Associate (2024)"
          rows={3}
          className={textareaClass}
        />
      </SectionCard>
    </div>
  );
}
