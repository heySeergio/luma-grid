'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  presetToRange,
  USAGE_EVAL_MAX_RANGE_MS,
  type UsageRangePreset,
} from '@/lib/usageEvaluation/ranges'

type UseUsageReportPeriodOptions = {
  profileId: string
  /** Si false, no dispara fetch automático en preset. */
  enabled?: boolean
}

export function useUsageReportPeriod(
  fetchWithRange: (start: Date, end: Date) => Promise<void>,
  { profileId, enabled = true }: UseUsageReportPeriodOptions,
) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [preset, setPreset] = useState<UsageRangePreset>('last7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runFetch = useCallback(
    async (start: Date, end: Date) => {
      if (!profileId) return
      setLoading(true)
      setError(null)
      try {
        await fetchWithRange(start, end)
      } catch {
        setError('Error al cargar el informe.')
      } finally {
        setLoading(false)
      }
    },
    [profileId, fetchWithRange],
  )

  const loadPreset = useCallback(async () => {
    const { start, end } = presetToRange(preset, new Date())
    await runFetch(start, end)
  }, [preset, runFetch])

  const loadCustom = useCallback(async () => {
    const s = customStart ? new Date(customStart) : null
    const e = customEnd ? new Date(customEnd) : null
    if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      setError('Indica fecha y hora de inicio y fin válidas.')
      return
    }
    if (s >= e) {
      setError('El inicio debe ser anterior al fin.')
      return
    }
    if (e.getTime() - s.getTime() > USAGE_EVAL_MAX_RANGE_MS) {
      setError('El periodo no puede superar 90 días.')
      return
    }
    setError(null)
    await runFetch(s, e)
  }, [customStart, customEnd, runFetch])

  useEffect(() => {
    if (!enabled || mode !== 'preset' || !profileId) return
    void loadPreset()
  }, [profileId, mode, preset, loadPreset, enabled])

  return {
    mode,
    setMode,
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    loading,
    error,
    setError,
    loadCustom,
  }
}
