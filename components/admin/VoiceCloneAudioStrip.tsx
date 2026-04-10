'use client'

import { Mic, Pause, Play, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeAudioPeaks } from '@/lib/voice/decodeAudioPeaks'

/** Mismo número de barras que `decodeAudioPeaks` (vista previa tras grabar/subir). */
const WAVEFORM_BARS = 72

type LiveWaveformProps = {
  stream: MediaStream | null
  active: boolean
}

function makeSilentPeaks(): number[] {
  return Array.from({ length: WAVEFORM_BARS }, () => 0.08)
}

/** Mismas barras que la vista previa, alimentadas en vivo por el micrófono. */
export function VoiceCloneLiveWaveform({ stream, active }: LiveWaveformProps) {
  const [peaks, setPeaks] = useState<number[]>(() => makeSilentPeaks())
  const rafRef = useRef<number>(0)
  const timeDataRef = useRef<Float32Array | null>(null)
  const smoothedRef = useRef<number[]>(makeSilentPeaks())
  const ctxRef = useRef<{
    context: AudioContext
    source: MediaStreamAudioSourceNode
    analyser: AnalyserNode
  } | null>(null)

  useEffect(() => {
    if (!active || !stream) return

    const AnyCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AnyCtx) return

    const context = new AnyCtx()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.35
    source.connect(analyser)

    smoothedRef.current = makeSilentPeaks()
    const ab = new ArrayBuffer(analyser.fftSize * 4)
    timeDataRef.current = new Float32Array(ab)

    const tick = () => {
      if (!ctxRef.current) return
      const { analyser: an } = ctxRef.current
      const buf = timeDataRef.current
      if (!buf || buf.length !== an.fftSize) return
      an.getFloatTimeDomainData(buf as Float32Array<ArrayBuffer>)
      const n = buf.length
      const seg = Math.max(1, Math.floor(n / WAVEFORM_BARS))
      const next = smoothedRef.current
      for (let i = 0; i < WAVEFORM_BARS; i++) {
        let max = 0
        const start = i * seg
        const end = Math.min(start + seg, n)
        for (let j = start; j < end; j++) {
          const v = Math.abs(buf[j]!)
          if (v > max) max = v
        }
        next[i] = next[i]! * 0.45 + max * 0.55
      }
      let hi = 1e-6
      for (let i = 0; i < WAVEFORM_BARS; i++) {
        if (next[i]! > hi) hi = next[i]!
      }
      const out: number[] = new Array(WAVEFORM_BARS)
      for (let i = 0; i < WAVEFORM_BARS; i++) {
        out[i] = hi > 1e-5 ? next[i]! / hi : next[i]!
      }
      setPeaks(out)
      rafRef.current = requestAnimationFrame(tick)
    }

    ctxRef.current = { context, source, analyser }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ctxRef.current = null
      try {
        source.disconnect()
        analyser.disconnect()
      } catch {
        /* ignore */
      }
      void context.close().catch(() => {})
      timeDataRef.current = null
      setPeaks(makeSilentPeaks())
    }
  }, [active, stream])

  if (!active || !stream) return null

  return (
    <div className="flex items-stretch gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2 pl-3">
      <div
        className="grid h-11 w-11 shrink-0 place-items-center self-center rounded-xl border border-[var(--app-border)] text-indigo-600 dark:text-indigo-300"
        aria-hidden
      >
        <Mic className="h-5 w-5" />
      </div>

      <div className="flex h-12 min-w-0 flex-1 items-end gap-px rounded-xl bg-slate-100/90 px-1.5 py-1.5 dark:bg-slate-800/80">
        {peaks.map((p, i) => (
          <div
            key={i}
            className="min-w-[2px] flex-1 rounded-sm bg-indigo-500/85 dark:bg-indigo-400/80"
            style={{ height: `${Math.max(10, p * 100)}%` }}
          />
        ))}
      </div>

      <div className="h-11 w-11 shrink-0 self-center" aria-hidden />
    </div>
  )
}

type SamplePreviewProps = {
  file: File
  onRemove: () => void
  disabled?: boolean
}

/** Forma de onda estática + reproducción para una muestra ya grabada o subida. */
export function VoiceCloneSamplePreview({ file, onRemove, disabled }: SamplePreviewProps) {
  const [peaks, setPeaks] = useState<number[] | null>(null)
  const [decodeError, setDecodeError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    setPeaks(null)
    setDecodeError(false)
    setPlaying(false)
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    const url = URL.createObjectURL(file)
    urlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio
    audio.onended = () => setPlaying(false)
    audio.onpause = () => setPlaying(false)
    audio.onplay = () => setPlaying(true)

    let cancelled = false
    void (async () => {
      try {
        const ab = await file.arrayBuffer()
        const next = await decodeAudioPeaks(ab, WAVEFORM_BARS)
        if (!cancelled) setPeaks(next)
      } catch {
        if (!cancelled) {
          setDecodeError(true)
          setPeaks(null)
        }
      }
    })()

    return () => {
      cancelled = true
      audio.pause()
      audio.src = ''
      audioRef.current = null
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [file])

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a || disabled) return
    if (a.paused) {
      void a.play().catch(() => setPlaying(false))
    } else {
      a.pause()
    }
  }, [disabled])

  return (
    <div className="flex items-stretch gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2 pl-3">
      <button
        type="button"
        onClick={togglePlay}
        disabled={disabled || decodeError}
        className={`grid h-11 w-11 shrink-0 place-items-center self-center rounded-xl border transition ${
          playing
            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/20 dark:text-indigo-100'
            : 'border-[var(--app-border)] text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        } disabled:opacity-50`}
        aria-label={playing ? 'Pausar' : 'Reproducir muestra'}
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>

      <div className="flex h-12 min-w-0 flex-1 items-end gap-px rounded-xl bg-slate-100/90 px-1.5 py-1.5 dark:bg-slate-800/80">
        {peaks ? (
          peaks.map((p, i) => (
            <div
              key={i}
              className="min-w-[2px] flex-1 rounded-sm bg-indigo-500/85 dark:bg-indigo-400/80"
              style={{ height: `${Math.max(10, p * 100)}%` }}
            />
          ))
        ) : decodeError ? (
          <span className="self-center px-2 text-xs text-slate-500 dark:text-slate-400">
            Vista de onda no disponible; puedes reproducir la muestra.
          </span>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-slate-400">Analizando audio…</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="grid h-11 w-11 shrink-0 place-items-center self-center rounded-xl border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-50"
        aria-label="Quitar muestra"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
