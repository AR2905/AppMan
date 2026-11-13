"use client";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
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
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const textareaClass = `${fieldClass} resize-y`;

type AccordionProps = {
  title: string;
  hint: string;
  locked: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onToggleLock: () => void;
  children: ReactNode;
};

function Accordion({
  title,
  hint,
  locked,
  open,
  onToggleOpen,
  onToggleLock,
  children,
}: AccordionProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition ${
        locked
          ? "border-amber-300 bg-amber-50/60 dark:border-amber-700/60 dark:bg-amber-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block truncate text-xs text-zinc-500">
            {hint}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
          <label className="mb-3 flex cursor-pointer items-center justify-between gap-2 text-xs font-medium">
            <span>Keep unchanged</span>
            <span className="relative inline-flex">
              <input
                type="checkbox"
                checked={locked}
                onChange={onToggleLock}
                className="peer sr-only"
              />
              <span className="h-6 w-10 rounded-full bg-zinc-300 transition peer-checked:bg-amber-500 dark:bg-zinc-700" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-4" />
            </span>
          </label>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MobileSectionsEditor({
  sections,
  setSections,
  locked,
  setLocked,
}: Props) {
  const [open, setOpen] = useState<SectionKey | null>("profileSummary");

  function toggleOpen(key: SectionKey) {
    setOpen((current) => (current === key ? null : key));
  }

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

  function updateProject(
    id: string,
    patch: { name?: string; description?: string },
  ) {
    setSections((prev) => ({
      ...prev,
      projects: prev.projects.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-3">
      <Accordion
        title="Profile Summary"
        hint="A short intro about you and your focus."
        locked={locked.profileSummary}
        open={open === "profileSummary"}
        onToggleOpen={() => toggleOpen("profileSummary")}
        onToggleLock={() => toggleLock("profileSummary")}
      >
        <textarea
          value={sections.profileSummary}
          onChange={(event) =>
            updateField("profileSummary", event.target.value)
          }
          placeholder="e.g. Frontend developer with 4 years of experience building..."
          rows={4}
          className={textareaClass}
        />
      </Accordion>

      <Accordion
        title="Skills"
        hint="List your skills, tools, and technologies."
        locked={locked.skills}
        open={open === "skills"}
        onToggleOpen={() => toggleOpen("skills")}
        onToggleLock={() => toggleLock("skills")}
      >
        <textarea
          value={sections.skills}
          onChange={(event) => updateField("skills", event.target.value)}
          placeholder="e.g. React, TypeScript, Next.js, Node.js, PostgreSQL..."
          rows={4}
          className={textareaClass}
        />
      </Accordion>

      <Accordion
        title="Experience"
        hint="Add each role separately. Only descriptions are rewritten."
        locked={locked.experience}
        open={open === "experience"}
        onToggleOpen={() => toggleOpen("experience")}
        onToggleLock={() => toggleLock("experience")}
      >
        <div className="flex flex-col gap-3">
          {sections.experience.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
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
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
                  aria-label={`Remove experience ${index + 1}`}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
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
                <textarea
                  value={item.description}
                  onChange={(event) =>
                    updateExperience(item.id, {
                      description: event.target.value,
                    })
                  }
                  placeholder="Responsibilities and achievements..."
                  aria-label={`Experience ${index + 1} description`}
                  rows={4}
                  className={textareaClass}
                />
              </div>
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
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            <Plus size={15} /> Add experience
          </button>
        </div>
      </Accordion>

      <Accordion
        title="Projects"
        hint="Add each project separately. Only descriptions are rewritten."
        locked={locked.projects}
        open={open === "projects"}
        onToggleOpen={() => toggleOpen("projects")}
        onToggleLock={() => toggleLock("projects")}
      >
        <div className="flex flex-col gap-3">
          {sections.projects.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
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
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
                  aria-label={`Remove project ${index + 1}`}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <input
                  value={item.name}
                  onChange={(event) =>
                    updateProject(item.id, { name: event.target.value })
                  }
                  placeholder="Project name"
                  aria-label={`Project ${index + 1} name`}
                  className={fieldClass}
                />
                <textarea
                  value={item.description}
                  onChange={(event) =>
                    updateProject(item.id, { description: event.target.value })
                  }
                  placeholder="What it does, your role, and the tech used..."
                  aria-label={`Project ${index + 1} description`}
                  rows={3}
                  className={textareaClass}
                />
              </div>
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
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            <Plus size={15} /> Add project
          </button>
        </div>
      </Accordion>

      <Accordion
        title="Education"
        hint="Degrees, schools, and dates."
        locked={locked.education}
        open={open === "education"}
        onToggleOpen={() => toggleOpen("education")}
        onToggleLock={() => toggleLock("education")}
      >
        <textarea
          value={sections.education}
          onChange={(event) => updateField("education", event.target.value)}
          placeholder="e.g. B.Tech in Computer Science, XYZ University, 2019 - 2023"
          rows={3}
          className={textareaClass}
        />
      </Accordion>

      <Accordion
        title="Certifications"
        hint="Relevant certifications and licenses."
        locked={locked.certifications}
        open={open === "certifications"}
        onToggleOpen={() => toggleOpen("certifications")}
        onToggleLock={() => toggleLock("certifications")}
      >
        <textarea
          value={sections.certifications}
          onChange={(event) =>
            updateField("certifications", event.target.value)
          }
          placeholder="e.g. AWS Certified Developer - Associate (2024)"
          rows={3}
          className={textareaClass}
        />
      </Accordion>
    </div>
  );
}
