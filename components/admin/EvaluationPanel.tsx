'use client'

import { useCallback, useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { getProfileEvaluationMode, canActorUseFullEvaluation } from '@/app/actions/evaluationMode'
import AllBoardsEvaluationView from '@/components/admin/AllBoardsEvaluationView'
import EvaluationBoardScopePicker, {
  type EvaluationScope,
} from '@/components/admin/EvaluationBoardScopePicker'
import EvaluationExportMenu from '@/components/admin/EvaluationExportMenu'
import EvaluationModePicker from '@/components/admin/EvaluationModePicker'
import FullEvaluationView from '@/components/admin/FullEvaluationView'
import NoneEvaluationView from '@/components/admin/NoneEvaluationView'
import SimpleEvaluationView from '@/components/admin/SimpleEvaluationView'
import type { AdminNavProfile } from '@/components/admin/AdminPanelNav'
import {
  EVALUATION_MODE_LABELS,
  type EvaluationMode,
  type SelectableEvaluationMode,
} from '@/lib/evaluation/mode'
import type { EvaluationExportPayload } from '@/lib/usageEvaluation/evaluationExportTypes'

type Props = {
  profileId: string | null
  profileName?: string | null
  profiles: AdminNavProfile[]
  evaluationScope: EvaluationScope
  onSelectEvaluationProfile: (id: string) => void
  onSelectAllBoards: () => void
  initialMode?: EvaluationMode | null
  onOpenAccountSettings: () => void
  /** Ocupa el alto disponible del panel admin (selector a pantalla completa). */
  fillViewport?: boolean
  /** Actualiza el modo en el listado de perfiles (quita el resaltado del nav). */
  onEvaluationModeChange?: (mode: SelectableEvaluationMode) => void
}

export default function EvaluationPanel({
  profileId,
  profileName = null,
  profiles,
  evaluationScope,
  onSelectEvaluationProfile,
  onSelectAllBoards,
  initialMode = null,
  onOpenAccountSettings,
  fillViewport = false,
  onEvaluationModeChange,
}: Props) {
  const [mode, setMode] = useState<EvaluationMode | null>(initialMode)
  const [changingMode, setChangingMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportPayload, setExportPayload] = useState<EvaluationExportPayload | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [allowFullMode, setAllowFullMode] = useState(true)

  const isAllBoards = evaluationScope === 'all'

  useEffect(() => {
    void canActorUseFullEvaluation().then(setAllowFullMode)
  }, [profileId])

  useEffect(() => {
    setExportPayload(null)
    setExportLoading(false)
  }, [profileId, mode, evaluationScope])

  const handleExportReady = useCallback(
    (payload: EvaluationExportPayload | null, reportLoading: boolean) => {
      setExportPayload(payload)
      setExportLoading(reportLoading)
    },
    [],
  )

  useEffect(() => {
    if (isAllBoards || !profileId) {
      setMode(null)
      return
    }
    if (initialMode != null) {
      setMode(initialMode)
      return
    }
    setLoading(true)
    void getProfileEvaluationMode(profileId)
      .then((m) => setMode(m))
      .finally(() => setLoading(false))
  }, [profileId, initialMode, isAllBoards])

  const handleModeSelected = useCallback(
    (selected: SelectableEvaluationMode) => {
      setMode(selected)
      setChangingMode(false)
      onEvaluationModeChange?.(selected)
    },
    [onEvaluationModeChange],
  )

  const modeUnset = mode === 'UNSET'
  const showPicker =
    !isAllBoards && Boolean(profileId) && !loading && (changingMode || mode === 'UNSET' || mode === null)
  const useViewportLayout = fillViewport

  const subtitle = isAllBoards
    ? 'Resumen comparativo de todos los tableros.'
    : modeUnset || changingMode
      ? 'Configura el nivel de análisis para este tablero.'
      : mode === 'NONE' || mode === 'SIMPLE' || mode === 'FULL'
        ? EVALUATION_MODE_LABELS[mode].title
        : 'Seguimiento del uso del tablero'

  return (
    <div
      className={`mx-auto flex w-full max-w-[1600px] flex-col rounded-2xl border border-slate-200/80 bg-[var(--app-surface)] p-4 shadow-sm dark:border-slate-700/80 sm:p-6 ${
        useViewportLayout ? 'flex min-h-0 flex-1 flex-col' : ''
      }`}
    >
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="admin-evaluation-panel-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Evaluación
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted-foreground)]">{subtitle}</p>
          {profiles.length > 0 ? (
            <EvaluationBoardScopePicker
              profiles={profiles}
              selectedProfileId={profileId}
              scope={evaluationScope}
              onSelectProfile={onSelectEvaluationProfile}
              onSelectAllBoards={onSelectAllBoards}
            />
          ) : null}
        </div>
        {!isAllBoards && mode && mode !== 'UNSET' && !changingMode ? (
          <div className="flex flex-wrap items-center gap-2">
            {(mode === 'SIMPLE' || mode === 'FULL') && (
              <EvaluationExportMenu payload={exportPayload} loading={exportLoading} />
            )}
            <button
              type="button"
              onClick={() => setChangingMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[var(--app-hover)] dark:border-slate-600/60 dark:text-slate-300"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Cambiar modo
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={
          useViewportLayout || showPicker
            ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'
            : 'min-h-0 overflow-y-auto overscroll-contain'
        }
      >
        {isAllBoards ? (
          <AllBoardsEvaluationView
            profiles={profiles}
            onOpenAccountSettings={onOpenAccountSettings}
            onSelectProfile={onSelectEvaluationProfile}
          />
        ) : !profileId ? (
          <p className="text-sm text-[var(--app-muted-foreground)]">
            Elige un tablero con <span className="font-semibold text-violet-600">cambiar</span> para ver su evaluación.
          </p>
        ) : loading ? (
          <p className="text-sm text-[var(--app-muted-foreground)]">Cargando…</p>
        ) : showPicker ? (
          <EvaluationModePicker
            profileId={profileId}
            onModeSelected={handleModeSelected}
            allowFullMode={allowFullMode}
          />
        ) : mode === 'NONE' ? (
          <NoneEvaluationView />
        ) : mode === 'SIMPLE' ? (
          <SimpleEvaluationView
            profileId={profileId}
            profileName={profileName}
            onOpenAccountSettings={onOpenAccountSettings}
            evaluationMode="SIMPLE"
            onExportReady={handleExportReady}
          />
        ) : (
          <FullEvaluationView
            profileId={profileId}
            profileName={profileName}
            onOpenAccountSettings={onOpenAccountSettings}
            onExportReady={handleExportReady}
          />
        )}
      </div>
    </div>
  )
}
