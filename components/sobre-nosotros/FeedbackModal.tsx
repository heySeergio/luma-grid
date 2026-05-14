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

type FeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  /** Si se define, al elegir «Notificarme» se usa este correo (solo lectura), p. ej. sesión admin. */
  lockedNotifyEmail?: string | null;
};

type FeedbackMode = "anonymous" | "notify";

const noopSubscribe = () => () => {};

export function FeedbackModal({
  open,
  onClose,
  lockedNotifyEmail,
}: FeedbackModalProps) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const modeGroupId = useId();
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<FeedbackMode | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const lockedEmail = lockedNotifyEmail?.trim() ?? "";

  useEffect(() => {
    if (!open) {
      setMode(null);
      setMessage("");
      setEmail("");
      setStatus("idle");
      setErrorMessage("");
      return;
    }
    if (lockedEmail) {
      setEmail(lockedEmail);
    }
    const t = requestAnimationFrame(() => firstRadioRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open, lockedEmail]);

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
    setErrorMessage("");

    if (mode === null) {
      setStatus("error");
      setErrorMessage("Elige si prefieres enviar tu opinión de forma anónima o con notificaciones.");
      return;
    }

    const anonymous = mode === "anonymous";
    const notifyEmail = lockedEmail || email.trim();
    if (!anonymous && !notifyEmail) {
      setStatus("error");
      setErrorMessage("Falta un correo para poder notificarte.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous,
          message: message.trim(),
          email: anonymous ? undefined : notifyEmail!,
        }),
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

  const successAnonymous = mode === "anonymous";
  const trimmedEmail = (lockedEmail || email).trim();

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          key="feedback-modal"
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
            className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-[28px] border border-neutral-200/95 bg-[#FDF8EF] shadow-[0_24px_64px_-12px_rgba(28,43,36,0.16),0_8px_24px_-6px_rgba(0,0,0,0.08)]"
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
                  Tu opinión
                </h2>
                <p
                  id={descId}
                  className="mt-2 text-sm font-normal leading-relaxed text-neutral-600"
                >
                  Cuéntanos qué piensas. Puedes hacerlo sin dejar datos o pedir
                  que te avisemos cuando haya novedades.
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
                  ¡Gracias por tu tiempo!
                </p>
                {successAnonymous ? (
                  <p className="mt-3 text-sm font-normal leading-relaxed text-neutral-600">
                    Hemos recibido tu mensaje de forma anónima.
                  </p>
                ) : (
                  <p className="mt-3 text-sm font-normal leading-relaxed text-neutral-600">
                    Te escribiremos a{" "}
                    <span className="font-semibold text-neutral-900">{trimmedEmail}</span>{" "}
                    cuando tengamos mejoras o novedades que te puedan interesar.
                  </p>
                )}
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
                <fieldset className="space-y-3">
                  <legend
                    id={modeGroupId}
                    className="text-sm font-bold text-neutral-950"
                  >
                    ¿Cómo quieres enviarla?
                  </legend>
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#3A7CEC]/35 has-[:focus-visible]:ring-offset-2 ${
                        mode === "anonymous"
                          ? "border-[#3A7CEC]/45 shadow-sm"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <input
                        ref={firstRadioRef}
                        type="radio"
                        name="feedback-mode"
                        value="anonymous"
                        checked={mode === "anonymous"}
                        onChange={() => setMode("anonymous")}
                        className="mt-1 size-4 shrink-0 border-neutral-300 text-[#FF6B4A] focus:ring-[#3A7CEC]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-neutral-950">
                          Anónima
                        </span>
                        <span className="mt-0.5 block text-xs font-normal leading-snug text-neutral-600">
                          Solo tu mensaje, sin correo ni identidad.
                        </span>
                      </span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#3A7CEC]/35 has-[:focus-visible]:ring-offset-2 ${
                        mode === "notify"
                          ? "border-[#3A7CEC]/45 shadow-sm"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedback-mode"
                        value="notify"
                        checked={mode === "notify"}
                        onChange={() => setMode("notify")}
                        className="mt-1 size-4 shrink-0 border-neutral-300 text-[#FF6B4A] focus:ring-[#3A7CEC]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-neutral-950">
                          Notificarme
                        </span>
                        <span className="mt-0.5 block text-xs font-normal leading-snug text-neutral-600">
                          {lockedEmail
                            ? "Te avisamos cuando haya mejoras; usaremos el correo de tu cuenta."
                            : "Te avisamos cuando haya mejoras; necesitamos tu correo."}
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <label
                    htmlFor="feedback-message"
                    className="block text-sm font-bold text-neutral-950"
                  >
                    Tu feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    name="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3A7CEC] focus:ring-4 focus:ring-[#3A7CEC]/18"
                    placeholder="Ideas, dudas, lo que echas de menos…"
                  />
                </div>

                {mode === "notify" ? (
                  <div className="space-y-2">
                    {lockedEmail ? (
                      <>
                        <p className="text-sm font-bold text-neutral-950">
                          Correo de tu cuenta
                        </p>
                        <p className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm font-semibold text-neutral-800">
                          {lockedEmail}
                        </p>
                        <p className="text-xs font-normal leading-snug text-neutral-600">
                          Este es el correo registrado en tu cuenta; lo enviaremos con tu
                          mensaje para poder responderte.
                        </p>
                      </>
                    ) : (
                      <>
                        <label
                          htmlFor="feedback-email"
                          className="block text-sm font-bold text-neutral-950"
                        >
                          Correo electrónico
                        </label>
                        <input
                          id="feedback-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3A7CEC] focus:ring-4 focus:ring-[#3A7CEC]/18"
                          placeholder="tu@correo.com"
                        />
                      </>
                    )}
                  </div>
                ) : null}

                {status === "error" && errorMessage ? (
                  <p role="alert" className="text-sm font-semibold text-[#E8583E]">
                    {errorMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-full bg-[#FF6B4A] py-4 text-sm font-bold text-white shadow-[0_4px_14px_-2px_rgba(255,107,74,0.45)] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70"
                >
                  {status === "loading" ? "Enviando…" : "Enviar opinión"}
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
