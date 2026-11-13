"use client";

import { JobsDesktop } from "@/app/jobs/jobs-desktop";
import { JobsMobile } from "@/app/jobs/jobs-mobile";
import { useIsMobile } from "@/app/lib/use-is-mobile";

export function JobsView() {
  const isMobile = useIsMobile();

  return isMobile ? <JobsMobile /> : <JobsDesktop />;
}
