'use client'

import { ArrowLeft, Loader2, Pin } from 'lucide-react'
import LumaSelect from '@/components/ui/LumaSelect'

type Props = {
  isSelectedDemoProfile: boolean
  activeFolder: string | null
  demoFolderNames: string[]
  symbolsLoadPending: boolean
  fixedZoneEditMode: boolean
  fixedZoneToolbarActionsDisabled: boolean
  onFolderChange: (folder: string | null) => void
  onEnterFixedZoneEdit: () => void
  onExitFixedZoneEdit: () => void
  onSaveFixedZoneDraft: () => void
  onApplyDefaultFixedZoneDraft: () => void
}

export default function AdminPreviewBoardToolbar({
  isSelectedDemoProfile,
  activeFolder,
  demoFolderNames,
  symbolsLoadPending,
  fixedZoneEditMode,
  fixedZoneToolbarActionsDisabled,
  onFolderChange,
  onEnterFixedZoneEdit,
  onExitFixedZoneEdit,
  onSaveFixedZoneDraft,
  onApplyDefaultFixedZoneDraft,
}: Props) {
  if (symbolsLoadPending) {
    return <Loader2 size={14} className="shrink-0 animate-spin text-accent-blue" aria-label="Cargando" />
  }

  if (fixedZoneEditMode) {
    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        <span className="hidden text-xs font-medium text-violet-800 dark:text-violet-200 lg:inline">
          Editando base fija
        </span>
        {isSelectedDemoProfile ? (
          <button
            type="button"
            onClick={onApplyDefaultFixedZoneDraft}
            className="ui-secondary-button shrink-0 rounded-lg px-2 py-1 text-xs font-semibold"
          >
            Plantilla
          </button>
        ) : null}
        <button
          type="button"
          onClick={onExitFixedZoneEdit}
          className="ui-secondary-button shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void onSaveFixedZoneDraft()}
          disabled={fixedZoneToolbarActionsDisabled}
          className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-violet-500 dark:hover:bg-violet-400"
        >
          Guardar
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
      {activeFolder ? (
        <button
          type="button"
          onClick={() => onFolderChange(null)}
          className="ui-secondary-button inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
          title="Volver al tablero principal"
        >
          <ArrowLeft size={12} aria-hidden />
          <span className="hidden sm:inline">Principal</span>
        </button>
      ) : null}
      {isSelectedDemoProfile ? (
        <LumaSelect
          id="admin-demo-folder-picker"
          label="Carpeta a editar"
          value={activeFolder ?? ''}
          onChange={(next) => onFolderChange(next ? next : null)}
          options={[
            { value: '', label: 'Contenido' },
            ...demoFolderNames.map((name) => ({ value: name, label: name })),
          ]}
          className="max-w-[9rem] shrink-0 sm:max-w-[11rem]"
        />
      ) : (
        <span className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 sm:inline">
          Contenido
        </span>
      )}
      <button
        type="button"
        onClick={onEnterFixedZoneEdit}
        disabled={fixedZoneToolbarActionsDisabled}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-300/90 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-500/45 dark:bg-violet-950/80 dark:text-violet-50 dark:hover:bg-violet-900/80"
        title="Editar base fija"
      >
        <Pin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Editar base fija</span>
        <span className="sm:hidden">Base fija</span>
      </button>
    </div>
  )
}
