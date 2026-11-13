"use client";

import { useState, type ChangeEvent } from "react";
import {
  SECTION_KEYS,
  createEmptyLocked,
  createEmptySections,
  hasSectionContent,
  sectionsToText,
  type AnalyzeMode,
  type AnalyzeResult,
  type LockedSections,
  type ResumeSections,
} from "@/app/lib/resume-types";

export function useResumeMatcher() {
  const [mode, setMode] = useState<AnalyzeMode>("single");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [sections, setSections] = useState<ResumeSections>(createEmptySections);
  const [locked, setLocked] = useState<LockedSections>(createEmptyLocked);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [beforeText, setBeforeText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [defaultResumeLoading, setDefaultResumeLoading] = useState(false);

  const lockedCount = SECTION_KEYS.filter((key) => locked[key]).length;

  function switchMode(next: AnalyzeMode) {
    setMode(next);
    setResult(null);
    setError("");
    setCopied(false);
    setUploadMessage("");
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadMessage("");
    setError("");
    setResult(null);
    setCopied(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not read that file.");
      }

      if (mode === "single") {
        setResume(data.text as string);
        setUploadMessage(
          "Resume loaded from file. Review it, then click Analyze.",
        );
      } else {
        setSections(data.sections as ResumeSections);
        setUploadMessage(
          "Sections autofilled from file. Review, lock what should stay unchanged, then Analyze.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleUseDefaultResume() {
    setDefaultResumeLoading(true);
    setError("");
    setUploadMessage("");

    try {
      const response = await fetch("/api/resume");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load the default resume.");
      }

      const content = typeof data.content === "string" ? data.content : "";

      if (!content.trim()) {
        setError(
          "No default resume saved yet. Add one on the Job Store page.",
        );
        return;
      }

      setResume(content);
      setUploadMessage("Default resume loaded from Job Store.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load the default resume.",
      );
    } finally {
      setDefaultResumeLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    if (mode === "single" && !resume.trim()) {
      setError("Please paste your resume text.");
      return;
    }

    if (mode === "sections" && !hasSectionContent(sections)) {
      setError("Add content to at least one resume section.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);
    setUploadMessage("");

    const lockedSections = SECTION_KEYS.filter((key) => locked[key]);
    const originalText =
      mode === "single" ? resume : sectionsToText(sections);

    const payload =
      mode === "single"
        ? { mode, jobDescription, resume }
        : { mode, jobDescription, sections, lockedSections };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data as AnalyzeResult);
      setBeforeText(originalText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.updatedResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return {
    mode,
    jobDescription,
    setJobDescription,
    resume,
    setResume,
    sections,
    setSections,
    locked,
    setLocked,
    result,
    beforeText,
    error,
    loading,
    copied,
    uploading,
    uploadMessage,
    defaultResumeLoading,
    lockedCount,
    switchMode,
    handleFileUpload,
    handleUseDefaultResume,
    handleAnalyze,
    handleCopy,
  };
}

export type ResumeMatcher = ReturnType<typeof useResumeMatcher>;
