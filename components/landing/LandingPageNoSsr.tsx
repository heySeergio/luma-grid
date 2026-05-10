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

type LandingPageNoSsrProps = {
  comingSoon?: boolean;
};

/** Carga la landing solo en cliente (evita avisos de hidratación por atributos inyectados en el DOM). */
export function LandingPageNoSsr({ comingSoon = true }: LandingPageNoSsrProps) {
  return <LandingPage comingSoon={comingSoon} />;
}
