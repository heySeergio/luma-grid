'use client'

import { Loader2, Pause, Play, Trash2, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  importFreesoundTapAudio,
  searchFreesoundTapAudio,
  uploadSymbolTapAudio,
  type FreesoundSearchHit,
} from '@/app/actions/symbolTapAudio'
import type { TapAudioMeta } from '@/lib/symbolTapAudio'

type Props = {
  profileId: string | null
  symbolId: string
  enabled: boolean
  tapAudioUrl?: string | null
  tapAudioMeta?: TapAudioMeta | null
  onEnabledChange: (enabled: boolean) => void
  onAudioChange: (url: string | null, meta: TapAudioMeta | null) => void
}

function symbolIdPersistable(symbolId: string): boolean {
  const id = symbolId.trim()
  if (!id) return false
  if (id.startsWith('new-')) return false
  if (id.startsWith('template')) return false
  if (id.startsWith('fixed-left')) return false
  return true
}

export default function SymbolTapAudioSection({
  profileId,
  symbolId,
  enabled: enabledProp,
  tapAudioUrl,
  tapAudioMeta,
  onEnabledChange,
  onAudioChange,
}: Props) {
  const [enabled, setEnabled] = useState(enabledProp || Boolean(tapAudioUrl?.trim()))

  useEffect(() => {
    if (enabledProp || tapAudioUrl?.trim()) {
      setEnabled(true)
    }
  }, [enabledProp, tapAudioUrl])

  const [tab, setTab] = useState<'upload' | 'freesound'>('upload')
  const [uploading, setUploading] = useState(false)
  const [importingId, setImportingId] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<FreesoundSearchHit[]>([])
  const previewRef = useRef<HTMLAudioElement | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)

  const canPersist = Boolean(profileId?.trim()) && symbolIdPersistable(symbolId)

  const stopPreview = useCallback(() => {
    if (previewRef.current) {
      previewRef.current.pause()
      previewRef.current = null
    }
    setPreviewPlaying(false)
  }, [])

  useEffect(() => () => stopPreview(), [stopPreview])

  const playPreview = useCallback(
    (url: string) => {
      stopPreview()
      const audio = new Audio(url)
      previewRef.current = audio
      setPreviewPlaying(true)
      audio.addEventListener('ended', () => {
        setPreviewPlaying(false)
        previewRef.current = null
      })
      audio.addEventListener('error', () => {
        setPreviewPlaying(false)
        previewRef.current = null
      })
      void audio.play().catch(() => {
        setPreviewPlaying(false)
        previewRef.current = null
      })
    },
    [stopPreview],
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !profileId || !canPersist) return

    setUploading(true)
    setStatus('')
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await uploadSymbolTapAudio(profileId, symbolId, fd)
      if (!res.ok) {
        setStatus(res.error)
        return
      }
      onAudioChange(res.url, res.meta)
      setStatus('Audio subido. Pulsa «Guardar cambios» en el tablero para persistir el símbolo si aún no lo has hecho.')
    } finally {
      setUploading(false)
    }
  }

  const runSearch = async () => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    setStatus('')
    try {
      const res = await searchFreesoundTapAudio(q)
      if (!res.ok) {
        setStatus(res.error)
        setResults([])
        return
      }
      setResults(res.results)
      if (res.results.length === 0) {
        setStatus('Sin resultados. Prueba otra búsqueda.')
      }
    } finally {
      setSearching(false)
    }
  }

  const selectFreesound = async (hit: FreesoundSearchHit) => {
    if (!profileId || !canPersist) return
    if (!hit.previewUrl) {
      setStatus('Este sonido no tiene vista previa.')
      return
    }
    setImportingId(hit.id)
    setStatus('')
    try {
      const res = await importFreesoundTapAudio(profileId, symbolId, hit.id)
      if (!res.ok) {
        setStatus(res.error)
        return
      }
      onAudioChange(res.url, res.meta)
      setStatus('Sonido importado desde Freesound.')
    } finally {
      setImportingId(null)
    }
  }

  const clearAudio = () => {
    stopPreview()
    onAudioChange(null, null)
    setStatus('')
  }

  return (
    <div className="ui-floating-panel space-y-3 rounded-2xl p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            const on = e.target.checked
            setEnabled(on)
            onEnabledChange(on)
            if (!on) clearAudio()
          }}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent-blue focus:ring-accent-blue"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Audio personalizado
          </span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            Suena al pulsar la tecla en el tablero. Al leer la frase completa se usa la voz normal con la
            palabra del símbolo.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700">
          {!canPersist && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              Guarda el símbolo en el tablero antes de subir o importar audio (necesita un id en la base de
              datos).
            </p>
          )}

          {tapAudioUrl ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-white/60 px-3 py-2 dark:border-slate-600 dark:bg-slate-900/40">
              <Volume2 className="h-4 w-4 shrink-0 text-accent-blue" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                {tapAudioMeta?.soundName ??
                  (tapAudioMeta?.source === 'freesound' ? 'Freesound' : 'Clip personalizado')}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => playPreview(tapAudioUrl)}
              >
                {previewPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                Escuchar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/10"
                onClick={clearAudio}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Quitar
              </button>
            </div>
          ) : null}

          {tapAudioMeta?.source === 'freesound' && (
            <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400">
              Sonido de Freesound
              {tapAudioMeta.author ? ` por ${tapAudioMeta.author}` : ''}
              {tapAudioMeta.license ? ` · ${tapAudioMeta.license}` : ''}
              {tapAudioMeta.sourcePageUrl ? (
                <>
                  {' '}
                  ·{' '}
                  <a
                    href={tapAudioMeta.sourcePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue underline"
                  >
                    Ver en Freesound
                  </a>
                </>
              ) : null}
            </p>
          )}

          <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1 dark:bg-slate-800/80">
            {(['upload', 'freesound'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                  tab === t
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-800 dark:text-slate-400'
                }`}
                onClick={() => setTab(t)}
              >
                {t === 'upload' ? 'Subir archivo' : 'Freesound'}
              </button>
            ))}
          </div>

          {tab === 'upload' ? (
            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800/50 ${
                !canPersist || uploading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-accent-blue" aria-hidden />
              ) : (
                <Volume2 className="h-5 w-5 text-slate-400" aria-hidden />
              )}
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                MP3, WAV, OGG, WebM o M4A (máx. 512 KB, ~5 s)
              </span>
              <input
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,.mp3,.wav,.ogg,.webm,.m4a"
                className="sr-only"
                disabled={!canPersist || uploading}
                onChange={(e) => void handleUpload(e)}
              />
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void runSearch()
                    }
                  }}
                  placeholder="p. ej. perro ladrido"
                  className="app-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={searching || !query.trim()}
                  onClick={() => void runSearch()}
                  className="shrink-0 rounded-xl bg-accent-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                </button>
              </div>
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {results.map((hit) => (
                  <li
                    key={hit.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200/80 px-2 py-1.5 dark:border-slate-700"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                        {hit.name}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">{hit.username}</p>
                    </div>
                    {hit.previewUrl ? (
                      <button
                        type="button"
                        className="shrink-0 rounded-lg border border-slate-200 p-1.5 dark:border-slate-600"
                        aria-label="Vista previa"
                        onClick={() => playPreview(hit.previewUrl!)}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={!canPersist || importingId === hit.id}
                      onClick={() => void selectFreesound(hit)}
                      className="shrink-0 rounded-lg bg-accent-blue/10 px-2 py-1 text-[10px] font-semibold text-accent-blue disabled:opacity-50 dark:text-sky-300"
                    >
                      {importingId === hit.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Usar'
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status ? (
            <p className="text-[11px] text-slate-600 dark:text-slate-400">{status}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
