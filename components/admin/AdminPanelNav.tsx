'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Download,
  Eye,
  FlaskConical,
  Keyboard,
  LayoutGrid,
  Loader2,
  Mic,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
} from 'lucide-react'
import AdminPreviewBoardToolbar from '@/components/admin/AdminPreviewBoardToolbar'
import {
  ADMIN_PRIMARY_NAV_HREFS,
  parseAdminPathname,
} from '@/lib/admin/adminNav'
import type { AdminSettingsView } from '@/lib/admin/adminNav'

export type AdminNavProfile = {
  id: string
  name: string
  isDemo?: boolean
  isOpeningProfile?: boolean
}

export type AdminPreviewTab = 'grid' | 'keyboard'

type AdminPanelNavProps = {
  pathname: string
  profiles: AdminNavProfile[]
  selectedProfileId: string
  adminPreviewTab: AdminPreviewTab
  loadingData: boolean
  blockProfileHeaderActions: boolean
  settingDefaultProfileId: string
  deletingProfileId: string
  isSelectedDemoProfile: boolean
  selectedProfile: AdminNavProfile | null | undefined
  previewGridRows: number
  previewGridCols: number
  canDecDimRows: boolean
  canIncDimRows: boolean
  canDecDimCols: boolean
  canIncDimCols: boolean
  repairingDemoLayout: boolean
  restoringKeyboardTheme: boolean
  savingSymbols: boolean
  symbolsLoadPending: boolean
  activeFolder: string | null
  adminFeedbackOpen: boolean
  onSelectProfile: (id: string) => void
  onSelectPreviewTab: (tab: AdminPreviewTab) => void
  onCreateProfile: () => void
  onSetDefaultProfile: (profile: AdminNavProfile) => void | Promise<void>
  onEditProfile: (profile: AdminNavProfile) => void
  onDeleteProfile: (profile: AdminNavProfile) => void
  onExportBoard: () => void | Promise<void>
  exportBoardBusy: boolean
  onRepairDemoLayout: () => void | Promise<void>
  onRestoreKeyboardTheme: () => void | Promise<void>
  onGridSizeUpdate: (rows: number, cols: number) => void | Promise<void>
  onFeedbackOpen: () => void
  demoFolderNames?: string[]
  fixedZoneEditMode?: boolean
  fixedZoneToolbarActionsDisabled?: boolean
  onFolderChange?: (folder: string | null) => void
  onEnterFixedZoneEdit?: () => void
  onExitFixedZoneEdit?: () => void
  onSaveFixedZoneDraft?: () => void | Promise<void>
  onApplyDefaultFixedZoneDraft?: () => void
  /** Tablero seleccionado con evaluationMode UNSET → resaltar pestaña Evaluación. */
  evaluationNavHighlight?: boolean
}

const PRIMARY_ITEMS: {
  view: AdminSettingsView | null
  href: string
  label: string
  icon: LucideIcon
}[] = [
  { view: null, href: ADMIN_PRIMARY_NAV_HREFS.preview, label: 'Vista previa', icon: LayoutGrid },
  { view: 'account', href: ADMIN_PRIMARY_NAV_HREFS.account, label: 'Cuenta', icon: Settings },
  { view: 'luma', href: ADMIN_PRIMARY_NAV_HREFS.voice, label: 'Voz', icon: Mic },
  { view: 'evaluation', href: ADMIN_PRIMARY_NAV_HREFS.evaluation, label: 'Evaluación', icon: BarChart3 },
]

function closeBoardMenu(event: React.MouseEvent<HTMLElement>) {
  const root = event.currentTarget.closest('[data-board-menu-root]')
  root?.dispatchEvent(new CustomEvent('board-menu-close', { bubbles: false }))
}

function NavTabLink({
  href,
  active,
  icon: Icon,
  label,
  compact = false,
  highlightUnset = false,
}: {
  href: string
  active: boolean
  icon: LucideIcon
  label: string
  compact?: boolean
  /** Borde morado: falta elegir modo de evaluación para el tablero activo. */
  highlightUnset?: boolean
}) {
  const sizeClass = compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  const stateClass = highlightUnset
    ? active
      ? 'border-2 border-violet-500 bg-[var(--app-surface-strong)] text-forest dark:border-violet-400 dark:text-sky-100'
      : 'border-2 border-violet-500 text-slate-700 hover:bg-violet-50/60 dark:border-violet-400 dark:text-slate-200 dark:hover:bg-violet-950/30'
    : active
      ? 'border border-[var(--app-predicted-border)] bg-[var(--app-surface-strong)] text-forest dark:text-sky-100'
      : 'border border-transparent text-slate-600 hover:bg-[var(--app-hover)] dark:text-slate-300'

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={highlightUnset ? 'Elige un modo de evaluación para este tablero' : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold transition ${sizeClass} ${stateClass}`}
    >
      <Icon size={compact ? 14 : 15} className="shrink-0 opacity-80" aria-hidden />
      <span>{label}</span>
    </Link>
  )
}

function BoardActionsMenu({
  adminPreviewTab,
  selectedProfile,
  blockProfileHeaderActions,
  settingDefaultProfileId,
  isSelectedDemoProfile,
  previewGridRows,
  previewGridCols,
  canDecDimRows,
  canIncDimRows,
  canDecDimCols,
  canIncDimCols,
  repairingDemoLayout,
  restoringKeyboardTheme,
  savingSymbols,
  symbolsLoadPending,
  activeFolder,
  onSetDefaultProfile,
  onEditProfile,
  onDeleteProfile,
  onExportBoard,
  exportBoardBusy,
  onRepairDemoLayout,
  onRestoreKeyboardTheme,
  onGridSizeUpdate,
}: {
  adminPreviewTab: AdminPreviewTab
  selectedProfile: AdminNavProfile
  blockProfileHeaderActions: boolean
  settingDefaultProfileId: string
  isSelectedDemoProfile: boolean
  previewGridRows: number
  previewGridCols: number
  canDecDimRows: boolean
  canIncDimRows: boolean
  canDecDimCols: boolean
  canIncDimCols: boolean
  repairingDemoLayout: boolean
  restoringKeyboardTheme: boolean
  savingSymbols: boolean
  symbolsLoadPending: boolean
  activeFolder: string | null
  onSetDefaultProfile: (profile: AdminNavProfile) => void | Promise<void>
  onEditProfile: (profile: AdminNavProfile) => void
  onDeleteProfile: (profile: AdminNavProfile) => void
  onExportBoard: () => void | Promise<void>
  exportBoardBusy: boolean
  onRepairDemoLayout: () => void | Promise<void>
  onRestoreKeyboardTheme: () => void | Promise<void>
  onGridSizeUpdate: (rows: number, cols: number) => void | Promise<void>
}) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onClose = () => setOpen(false)
    root.addEventListener('board-menu-close', onClose)
    return () => root.removeEventListener('board-menu-close', onClose)
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} data-board-menu-root className="relative shrink-0">
      <button
        type="button"
        className="ui-secondary-button flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold"
        aria-label={`Opciones de ${selectedProfile.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={15} aria-hidden />
        <span className="hidden sm:inline">Opciones</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+4px)] z-[60] min-w-[13.5rem] overflow-hidden rounded-xl border border-slate-200/90 bg-[var(--app-bg)] py-1 shadow-lg dark:border-slate-700/90"
        >
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-[var(--app-hover)] dark:text-slate-200"
          onClick={(e) => {
            onEditProfile(selectedProfile)
            closeBoardMenu(e)
          }}
        >
          <Pencil size={15} aria-hidden />
          Editar tablero
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-[var(--app-hover)] disabled:opacity-45 dark:text-slate-200"
          disabled={Boolean(blockProfileHeaderActions) || exportBoardBusy}
          onClick={(e) => {
            void onExportBoard()
            closeBoardMenu(e)
          }}
        >
          {exportBoardBusy ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <Download size={15} aria-hidden />
          )}
          {exportBoardBusy ? 'Exportando…' : 'Exportar tablero'}
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-[var(--app-hover)] disabled:opacity-45 dark:text-slate-200"
          disabled={Boolean(selectedProfile.isOpeningProfile) || Boolean(settingDefaultProfileId)}
          onClick={(e) => {
            void onSetDefaultProfile(selectedProfile)
            closeBoardMenu(e)
          }}
        >
          {settingDefaultProfileId === selectedProfile.id ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <Eye size={15} aria-hidden />
          )}
          {selectedProfile.isOpeningProfile ? 'Tablero al abrir' : 'Usar al abrir el tablero'}
        </button>

        {!isSelectedDemoProfile ? (
          <div className="border-t border-slate-200/80 px-3 py-2 dark:border-slate-700/80">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tamaño del grid
            </p>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Filas</span>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Restar fila"
                  disabled={!canDecDimRows}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--app-hover)] disabled:opacity-35"
                  onClick={() => void onGridSizeUpdate(previewGridRows - 1, previewGridCols)}
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[1.5ch] text-center font-semibold tabular-nums">{previewGridRows}</span>
                <button
                  type="button"
                  aria-label="Sumar fila"
                  disabled={!canIncDimRows}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--app-hover)] disabled:opacity-35"
                  onClick={() => void onGridSizeUpdate(previewGridRows + 1, previewGridCols)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-600 dark:text-slate-300">Columnas</span>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Restar columna"
                  disabled={!canDecDimCols}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--app-hover)] disabled:opacity-35"
                  onClick={() => void onGridSizeUpdate(previewGridRows, previewGridCols - 1)}
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[1.5ch] text-center font-semibold tabular-nums">{previewGridCols}</span>
                <button
                  type="button"
                  aria-label="Sumar columna"
                  disabled={!canIncDimCols}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--app-hover)] disabled:opacity-35"
                  onClick={() => void onGridSizeUpdate(previewGridRows, previewGridCols + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {adminPreviewTab === 'keyboard' || isSelectedDemoProfile ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-slate-200/80 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-[var(--app-hover)] disabled:opacity-45 dark:border-slate-700/80 dark:text-slate-200"
            disabled={
              adminPreviewTab === 'keyboard'
                ? restoringKeyboardTheme
                : repairingDemoLayout || savingSymbols || symbolsLoadPending || Boolean(activeFolder)
            }
            onClick={(e) => {
              if (adminPreviewTab === 'keyboard') {
                void onRestoreKeyboardTheme()
              } else {
                void onRepairDemoLayout()
              }
              closeBoardMenu(e)
            }}
          >
            {adminPreviewTab === 'keyboard' ? (
              restoringKeyboardTheme ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <RotateCcw size={15} aria-hidden />
              )
            ) : repairingDemoLayout ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : (
              <RotateCcw size={15} aria-hidden />
            )}
            Restaurar plantilla
          </button>
        ) : null}

        {!selectedProfile.isDemo ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-slate-200/80 px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-45 dark:border-slate-700/80 dark:text-rose-300 dark:hover:bg-rose-950/30"
            onClick={(e) => {
              onDeleteProfile(selectedProfile)
              closeBoardMenu(e)
            }}
          >
            <Trash2 size={15} aria-hidden />
            Eliminar tablero
          </button>
        ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function AdminPanelNav({
  pathname,
  profiles,
  selectedProfileId,
  adminPreviewTab,
  loadingData,
  blockProfileHeaderActions,
  settingDefaultProfileId,
  deletingProfileId,
  isSelectedDemoProfile,
  selectedProfile,
  previewGridRows,
  previewGridCols,
  canDecDimRows,
  canIncDimRows,
  canDecDimCols,
  canIncDimCols,
  repairingDemoLayout,
  restoringKeyboardTheme,
  savingSymbols,
  symbolsLoadPending,
  activeFolder,
  adminFeedbackOpen,
  onSelectProfile,
  onSelectPreviewTab,
  onCreateProfile,
  onSetDefaultProfile,
  onEditProfile,
  onDeleteProfile,
  onExportBoard,
  exportBoardBusy,
  onRepairDemoLayout,
  onRestoreKeyboardTheme,
  onGridSizeUpdate,
  onFeedbackOpen,
  demoFolderNames = [],
  fixedZoneEditMode = false,
  fixedZoneToolbarActionsDisabled = false,
  onFolderChange,
  onEnterFixedZoneEdit,
  onExitFixedZoneEdit,
  onSaveFixedZoneDraft,
  onApplyDefaultFixedZoneDraft,
  evaluationNavHighlight = false,
}: AdminPanelNavProps) {
  const { view: adminSettingsView } = parseAdminPathname(pathname)
  const isPreviewRoute = adminSettingsView === null
  const showBoardPicker = isPreviewRoute

  return (
    <div
      id="admin-panel-nav"
      className="admin-panel-nav sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-[var(--app-bg)] dark:border-slate-700/80"
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6 lg:px-8">
        <nav
          aria-label="Secciones del panel"
          className="admin-panel-nav__primary flex items-center gap-1 overflow-x-auto"
        >
          {PRIMARY_ITEMS.map((item) => {
            const active =
              item.view === null ? isPreviewRoute : adminSettingsView === item.view
            return (
              <NavTabLink
                key={item.href}
                href={item.href}
                active={active}
                icon={item.icon}
                label={item.label}
                highlightUnset={item.view === 'evaluation' && evaluationNavHighlight}
              />
            )
          })}

          <button
            type="button"
            onClick={onFeedbackOpen}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1 text-xs font-semibold text-amber-950 transition hover:brightness-105 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100"
            aria-haspopup="dialog"
            aria-expanded={adminFeedbackOpen}
          >
            <FlaskConical size={14} aria-hidden />
            <span className="hidden sm:inline">Beta</span>
          </button>
        </nav>

        {showBoardPicker ? (
          <div className="admin-panel-nav__boards mt-1.5 flex items-center gap-1.5 border-t border-slate-200/60 pt-1.5 dark:border-slate-700/70">
            <div className="admin-panel-nav__boards-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
              <button
                onClick={onCreateProfile}
                className="ui-soft-badge inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                type="button"
              >
                <Plus size={12} aria-hidden />
                Crear
              </button>
              {loadingData ? (
                <Loader2 size={14} className="shrink-0 animate-spin text-accent-blue" aria-label="Cargando" />
              ) : null}
              {profiles.map((p) => {
                const selected = selectedProfileId === p.id && adminPreviewTab === 'grid'
                const keyboardContext = selectedProfileId === p.id && adminPreviewTab === 'keyboard'
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProfile(p.id)}
                    className={`inline-flex max-w-[10rem] shrink-0 items-center gap-1 truncate rounded-full border px-2.5 py-1 text-xs font-semibold transition sm:max-w-[12rem] sm:text-sm ${
                      selected
                        ? 'border-[var(--app-predicted-border)] bg-accent-blue/12 text-accent-blue dark:text-sky-200'
                        : keyboardContext
                          ? 'border-accent-blue/35 bg-[var(--app-surface-muted)] text-slate-700 dark:text-slate-200'
                          : 'border-transparent bg-[var(--app-surface-muted)] text-slate-700 hover:brightness-[1.02] dark:text-slate-200'
                    }`}
                    type="button"
                    title={p.name}
                  >
                    {p.isOpeningProfile ? <Eye size={12} className="shrink-0 opacity-70" aria-hidden /> : null}
                    <span className="truncate">{p.name}</span>
                    {deletingProfileId === p.id ? (
                      <Loader2 size={12} className="shrink-0 animate-spin" aria-hidden />
                    ) : null}
                  </button>
                )
              })}
              {isPreviewRoute ? (
                <button
                  type="button"
                  onClick={() => onSelectPreviewTab('keyboard')}
                  disabled={!selectedProfileId || loadingData}
                  title={
                    !selectedProfileId
                      ? 'Selecciona un tablero'
                      : 'Vista previa y colores del teclado'
                  }
                  className={`inline-flex max-w-[10rem] shrink-0 items-center gap-1 truncate rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 sm:max-w-[12rem] sm:text-sm ${
                    adminPreviewTab === 'keyboard'
                      ? 'border-[var(--app-predicted-border)] bg-accent-blue/12 text-accent-blue dark:text-sky-200'
                      : 'border-transparent bg-[var(--app-surface-muted)] text-slate-700 hover:brightness-[1.02] dark:text-slate-200'
                  }`}
                >
                  <Keyboard size={12} className="shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">Teclado</span>
                </button>
              ) : null}
            </div>

            {isPreviewRoute && adminPreviewTab === 'grid' && selectedProfileId && onEnterFixedZoneEdit && onExitFixedZoneEdit && onSaveFixedZoneDraft && onApplyDefaultFixedZoneDraft && onFolderChange ? (
              <>
                <span className="hidden h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden />
                <AdminPreviewBoardToolbar
                  isSelectedDemoProfile={isSelectedDemoProfile}
                  activeFolder={activeFolder}
                  demoFolderNames={demoFolderNames}
                  symbolsLoadPending={symbolsLoadPending}
                  fixedZoneEditMode={fixedZoneEditMode}
                  fixedZoneToolbarActionsDisabled={fixedZoneToolbarActionsDisabled}
                  onFolderChange={onFolderChange}
                  onEnterFixedZoneEdit={onEnterFixedZoneEdit}
                  onExitFixedZoneEdit={onExitFixedZoneEdit}
                  onSaveFixedZoneDraft={() => void onSaveFixedZoneDraft()}
                  onApplyDefaultFixedZoneDraft={onApplyDefaultFixedZoneDraft}
                />
              </>
            ) : null}

            {selectedProfile ? (
              <BoardActionsMenu
                adminPreviewTab={adminPreviewTab}
                selectedProfile={selectedProfile}
                blockProfileHeaderActions={blockProfileHeaderActions}
                settingDefaultProfileId={settingDefaultProfileId}
                isSelectedDemoProfile={isSelectedDemoProfile}
                previewGridRows={previewGridRows}
                previewGridCols={previewGridCols}
                canDecDimRows={canDecDimRows}
                canIncDimRows={canIncDimRows}
                canDecDimCols={canDecDimCols}
                canIncDimCols={canIncDimCols}
                repairingDemoLayout={repairingDemoLayout}
                restoringKeyboardTheme={restoringKeyboardTheme}
                savingSymbols={savingSymbols}
                symbolsLoadPending={symbolsLoadPending}
                activeFolder={activeFolder}
                onSetDefaultProfile={onSetDefaultProfile}
                onEditProfile={onEditProfile}
                onDeleteProfile={onDeleteProfile}
                onExportBoard={onExportBoard}
                exportBoardBusy={exportBoardBusy}
                onRepairDemoLayout={onRepairDemoLayout}
                onRestoreKeyboardTheme={onRestoreKeyboardTheme}
                onGridSizeUpdate={onGridSizeUpdate}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
