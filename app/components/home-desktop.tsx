"use client";

import { ResultsPanel } from "@/app/components/results-panel";
import { SectionsEditor } from "@/app/components/sections-editor";
import { useResumeMatcher } from "@/app/lib/use-resume-matcher";

export function HomeDesktop() {
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

  return (
    <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Resume &amp; JD Matcher
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Paste a job description and your resume to see the missing keywords
          and an optimized resume.
        </p>
      </header>

      <section className="mb-6">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Job Description
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the job description here..."
            rows={10}
            className="rounded-xl border border-zinc-300 bg-white p-4 text-sm font-normal text-zinc-900 outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
      </section>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-zinc-300 p-1 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => switchMode("single")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${mode === "single"
                ? "bg-foreground text-background"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
          >
            Single resume
          </button>
          <button
            type="button"
            onClick={() => switchMode("sections")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${mode === "sections"
                ? "bg-foreground text-background"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
          >
            Separate sections
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          {mode === "sections"
            ? `${lockedCount} section${lockedCount === 1 ? "" : "s"} locked — sent as context but kept unchanged.`
            : "Paste your full resume as one block of text."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Upload resume</p>
                <p className="text-xs text-zinc-500">
                  PDF or DOCX, up to 8 MB.{" "}
                  {mode === "sections"
                    ? "We'll extract the text and autofill the sections."
                    : "We'll extract the text into the box below."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mode === "single" ? (
                  <button
                    type="button"
                    onClick={handleUseDefaultResume}
                    disabled={defaultResumeLoading || uploading}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {defaultResumeLoading
                      ? "Loading..."
                      : "Use default resume"}
                  </button>
                ) : null}
                <label
                  className={`cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition dark:border-zinc-700 ${uploading
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                >
                  {uploading ? "Reading file..." : "Choose file"}
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
            {uploadMessage ? (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                {uploadMessage}
              </p>
            ) : null}
          </div>

          {mode === "single" ? (
            <label className="flex flex-col gap-2 text-sm font-medium">
              Your Resume
              <textarea
                value={resume}
                onChange={(event) => setResume(event.target.value)}
                placeholder="Paste your resume text here..."
                rows={18}
                className="rounded-xl border border-zinc-300 bg-white p-4 text-sm font-normal text-zinc-900 outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
          ) : (
            <SectionsEditor
              sections={sections}
              setSections={setSections}
              locked={locked}
              setLocked={setLocked}
            />
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || uploading}
            className="h-12 rounded-xl bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze & Optimize"}
          </button>

          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
        </section>

        <section className="lg:sticky lg:top-6 lg:self-start">
          {result ? (
            <ResultsPanel
              result={result}
              locked={locked}
              beforeText={beforeText}
              copied={copied}
              onCopy={handleCopy}
            />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Results will appear here after you run the analysis.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
