export type SectionKey =
  | "profileSummary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications";

export type ExperienceItem = {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  description: string;
};

export type ResumeSections = {
  profileSummary: string;
  skills: string;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: string;
  certifications: string;
};

export type LockedSections = Record<SectionKey, boolean>;

export type AnalyzeMode = "single" | "sections";

export type AnalyzeResult = {
  matchScore: number;
  missingKeywords: string[];
  updatedResume: string;
  updatedSections?: ResumeSections;
};

export const SECTION_KEYS: SectionKey[] = [
  "profileSummary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
];

export function createEmptySections(): ResumeSections {
  return {
    profileSummary: "",
    skills: "",
    experience: [],
    projects: [],
    education: "",
    certifications: "",
  };
}

export function createEmptyLocked(): LockedSections {
  return {
    profileSummary: false,
    skills: false,
    experience: false,
    projects: false,
    education: false,
    certifications: false,
  };
}

export function createExperienceItem(): ExperienceItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    company: "",
    dates: "",
    description: "",
  };
}

export function createProjectItem(): ProjectItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
  };
}

export function experienceToText(items: ExperienceItem[]): string {
  return items
    .map((item) => {
      const heading = [item.title, item.company].filter(Boolean).join(" — ");
      const meta = [heading, item.dates].filter(Boolean).join(" | ");
      return [meta, item.description].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function projectsToText(items: ProjectItem[]): string {
  return items
    .map((item) => [item.name, item.description].filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

export function sectionsToText(sections: ResumeSections): string {
  const parts: string[] = [];

  if (sections.profileSummary.trim()) {
    parts.push(`PROFILE SUMMARY\n${sections.profileSummary.trim()}`);
  }

  if (sections.skills.trim()) {
    parts.push(`SKILLS\n${sections.skills.trim()}`);
  }

  const experience = experienceToText(sections.experience);
  if (experience) {
    parts.push(`EXPERIENCE\n${experience}`);
  }

  const projects = projectsToText(sections.projects);
  if (projects) {
    parts.push(`PROJECTS\n${projects}`);
  }

  if (sections.education.trim()) {
    parts.push(`EDUCATION\n${sections.education.trim()}`);
  }

  if (sections.certifications.trim()) {
    parts.push(`CERTIFICATIONS\n${sections.certifications.trim()}`);
  }

  return parts.join("\n\n");
}

export function hasSectionContent(sections: ResumeSections): boolean {
  return sectionsToText(sections).trim().length > 0;
}
