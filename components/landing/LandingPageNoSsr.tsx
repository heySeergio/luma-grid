"use client";

import dynamic from "next/dynamic";

const LandingPage = dynamic(
  () => import("@/components/landing/LandingPage").then((mod) => mod.LandingPage),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[min(50vh,420px)] bg-canvas" aria-hidden />
    ),
  },
);

export function LandingPageNoSsr() {
  return <LandingPage />;
}
