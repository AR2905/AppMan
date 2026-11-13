"use client";

import { useEffect, useRef } from "react";
import { FileText, Sparkles, Upload, Wand2 } from "lucide-react";
import { MobileResultsPanel } from "@/app/components/mobile-results-panel";
import { MobileSectionsEditor } from "@/app/components/mobile-sections-editor";
import { useResumeMatcher } from "@/app/lib/use-resume-matcher";

export function HomeMobile() {
  const {
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
  } = useResumeMatcher();

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  return (
    <main className="flex w-full flex-1 flex-col px-4 pb-28 pt-6">
      <header className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <Sparkles size={12} /> Mobile workspace
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Resume &amp; JD Matcher
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          Fill in the job description and your resume. We&apos;ll show missing
          keywords and an optimized version.
        </p>
      </header>

      <div className="grid grid-cols-2 rounded-xl border border-zinc-300 p-1 text-sm dark:border-zinc-700">
        <button
          type="button"
          onClick={() => switchMode("single")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            mode === "single"
              ? "bg-foreground text-background"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Single resume
        </button>
        <button
          type="button"
          onClick={() => switchMode("sections")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            mode === "sections"
              ? "bg-foreground text-background"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Separate sections
        </button>
      </div>
      <p className="mt-2 px-1 text-xs text-zinc-500">
        {mode === "sections"
          ? `${lockedCount} section${lockedCount === 1 ? "" : "s"} locked — sent as context but kept unchanged.`
          : "Paste your full resume as one block of text."}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-900">
              1
            </span>
            <h2 className="text-sm font-semibold">Job description</h2>
          </div>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the job description here..."
            rows={8}
            className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-900">
              2
            </span>
            <h2 className="text-sm font-semibold">Your resume</h2>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            {mode === "single" ? (
              <button
                type="button"
                onClick={handleUseDefaultResume}
                disabled={defaultResumeLoading || uploading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2.5 text-xs font-medium transition active:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:active:bg-zinc-800"
              >
                <FileText size={14} />
                {defaultResumeLoading ? "Loading..." : "Default resume"}
              </button>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-xs font-medium text-zinc-500 dark:border-zinc-700">
                <FileText size={14} /> Sections mode
              </span>
            )}
            <label
              className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2.5 text-xs font-medium transition active:bg-zinc-100 dark:border-zinc-700 dark:active:bg-zinc-800 ${
                uploading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <Upload size={14} />
              {uploading ? "Reading..." : "Upload file"}
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
                disabled={uploading}
                className="sr-only"
              />
            </label>
          </div>
          <p className="mb-3 text-[11px] text-zinc-500">
            PDF or DOCX, up to 8 MB.{" "}
            {mode === "sections"
              ? "We'll extract the text and autofill the sections."
              : "We'll extract the text into the box below."}
          </p>

          {uploadMessage ? (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {uploadMessage}
            </p>
          ) : null}

          {mode === "single" ? (
            <textarea
              value={resume}
              onChange={(event) => setResume(event.target.value)}
              placeholder="Paste your resume text here..."
              rows={12}
              className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          ) : (
            <MobileSectionsEditor
              sections={sections}
              setSections={setSections}
              locked={locked}
              setLocked={setLocked}
            />
          )}
        </section>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {result ? (
          <div ref={resultsRef} className="scroll-mt-4">
            <MobileResultsPanel
              result={result}
              locked={locked}
              beforeText={beforeText}
              copied={copied}
              onCopy={handleCopy}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Results will appear here after you run the analysis.
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || uploading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-semibold text-background transition active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 size={16} />
          {loading ? "Analyzing..." : "Analyze & Optimize"}
        </button>
      </div>
    </main>
  );
}
