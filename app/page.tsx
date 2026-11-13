"use client";

import { HomeDesktop } from "@/app/components/home-desktop";
import { HomeMobile } from "@/app/components/home-mobile";
import { useIsMobile } from "@/app/lib/use-is-mobile";

export default function Home() {
  const isMobile = useIsMobile();

  return isMobile ? <HomeMobile /> : <HomeDesktop />;
}
