"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

type WaitlistModalProps = {
  open: boolean;
  onClose: () => void;
};

const noopSubscribe = () => () => {};

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "No se pudo enviar. Inténtalo de nuevo.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Error de conexión. Inténtalo más tarde.");
    }
  };

  if (!isClient) return null;

  const backdropTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
  const panelTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          key="waitlist-modal"
          className="luma-marketing-portal tk-bricolage-grotesque-extralig fixed inset-0 z-[200] flex items-end justify-center p-4 font-bricolage sm:items-center sm:p-6"
        >
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/45 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-[28px] border border-neutral-200/95 bg-[#FDF8EF] shadow-[0_24px_64px_-12px_rgba(28,43,36,0.16),0_8px_24px_-6px_rgba(0,0,0,0.08)]"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.96 }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={panelTransition}
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-7 pb-6 pt-8 sm:px-10 sm:pb-7 sm:pt-10">
              <div className="min-w-0 pr-2">
                <h2
                  id={titleId}
                  className="text-2xl font-bold tracking-tight text-neutral-950"
                >
                  Lista de espera
                </h2>
                <p
                  id={descId}
                  className="mt-2 text-sm font-normal leading-relaxed text-neutral-600"
                >
                  Déjanos tu nombre y correo y te avisamos cuando Luma Grid esté
                  disponible.
                </p>
                <p className="mt-3 text-xs font-medium leading-relaxed text-neutral-500">
                  *Tranquilo, no te enviaremos correos de spam, solo te
                  notificaremos para que seas el primero en utilizarla!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A7CEC]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDF8EF]"
                aria-label="Cerrar ventana"
              >
                <X className="size-5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            {status === "success" ? (
              <div className="px-7 py-10 text-center sm:px-10 sm:py-12">
                <p className="text-lg font-bold text-neutral-950">
                  ¡Gracias, {name.trim()}!
                </p>
                <p className="mt-3 text-sm font-normal leading-relaxed text-neutral-600">
                  Te escribiremos a{" "}
                  <span className="font-semibold text-neutral-900">{email.trim()}</span>{" "}
                  cuando podamos darte acceso.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 inline-flex rounded-full bg-[#FF6B4A] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_-2px_rgba(255,107,74,0.45)] transition hover:brightness-95"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-6 px-7 py-7 sm:px-10 sm:py-8"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="waitlist-name"
                    className="block text-sm font-bold text-neutral-950"
                  >
                    Nombre
                  </label>
                  <input
                    ref={nameRef}
                    id="waitlist-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3A7CEC] focus:ring-4 focus:ring-[#3A7CEC]/18"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="waitlist-email"
                    className="block text-sm font-bold text-neutral-950"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3A7CEC] focus:ring-4 focus:ring-[#3A7CEC]/18"
                    placeholder="tu@correo.com"
                  />
                </div>
                {status === "error" && errorMessage ? (
                  <p
                    role="alert"
                    className="text-sm font-semibold text-[#E8583E]"
                  >
                    {errorMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-full bg-[#FF6B4A] py-4 text-sm font-bold text-white shadow-[0_4px_14px_-2px_rgba(255,107,74,0.45)] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
                >
                  {status === "loading" ? "Enviando…" : "Enviar"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
