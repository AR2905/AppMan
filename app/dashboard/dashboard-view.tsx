"use client";

import { DashboardDesktop } from "@/app/dashboard/dashboard-desktop";
import { DashboardMobile } from "@/app/dashboard/dashboard-mobile";
import { useIsMobile } from "@/app/lib/use-is-mobile";

export function DashboardView() {
  const isMobile = useIsMobile();

  return isMobile ? <DashboardMobile /> : <DashboardDesktop />;
}
