import { Suspense } from "react";
import { JobsView } from "@/app/jobs/jobs-view";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <p className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
            Loading applications...
          </p>
        </main>
      }
    >
      <JobsView />
    </Suspense>
  );
}
