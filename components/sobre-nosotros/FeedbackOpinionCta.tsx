"use client";

import { useState } from "react";

import { FeedbackModal } from "@/components/sobre-nosotros/FeedbackModal";

export function FeedbackOpinionCta() {
  const [open, setOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const openModal = () => {
    setSessionKey((k) => k + 1);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-full bg-[#FCE855] px-5 py-2.5 text-sm font-extrabold text-black shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCE855] focus-visible:ring-offset-2 focus-visible:ring-offset-[#062C1D]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Dejar opinión
      </button>
      <FeedbackModal
        key={sessionKey}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
