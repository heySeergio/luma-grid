'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { Check, Columns2, Download, Eye, Folder, Keyboard, LayoutGrid, Layers, List, Loader2, LockKeyhole, LogOut, Mail, Mic, Minus, Monitor, Moon, Pencil, Play, Plus, RotateCcw, Rows, Settings, ShieldAlert, Square, Sun, Trash2, Volume2, X, FolderOpen, ArrowLeft, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { getAccountSettings, updateAccountSettings } from '@/app/actions/account'
import { getSubscriptionGateState } from '@/app/actions/plan'
import { getVoiceSettings, updateVoiceSettings } from '@/app/actions/voiceSettings'
import { ensureVoicePreviewSamples } from '@/app/actions/voicePreviewSamples'
import { getProfileLexiconObservability, previewLexemeDetection } from '@/app/actions/lexicon'
import { computeMainGrid, DEFAULT_FOLDER_CONTENTS, shouldShowFolderBadge } from '@/lib/data/defaultSymbols'
import {
  createProfile,
  deleteProfile,
  duplicateProfile,
  getProfiles,
  setDefaultOpeningProfile,
  updateProfile,
  updateProfileGender,
  updateProfileGridSize,
  updateProfileKeyboardTheme,
} from '@/app/actions/profiles'
import { resetDemoProfilePositionsToTemplate } from '@/app/actions/demoRepair'
import { exportProfileBoardJson } from '@/app/actions/profileExport'
import { getProfileSymbols, saveSymbols, deleteSymbolAction } from '@/app/actions/symbols'
import { setProfileGender } from '@/lib/profileGender'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { snapTopLeftToCursor } from '@/lib/dnd/snapTopLeftToCursor'
import Link from 'next/link'
import AdminFreePlanUpsellModal from '@/components/plan/AdminFreePlanUpsellModal'
import PlanPickerModal from '@/components/plan/PlanPickerModal'
import VoicePlanRequiredModal from '@/components/plan/VoicePlanRequiredModal'
import AdminAccessBoardDemo from '@/components/admin/AdminAccessBoardDemo'
import { VoiceCloneLiveWaveform, VoiceCloneSamplePreview } from '@/components/admin/VoiceCloneAudioStrip'
import {
  ProfileGridDimensionPicker,
  PROFILE_GRID_PICKER_MAX_COLS,
  PROFILE_GRID_PICKER_MAX_ROWS,
} from '@/components/admin/ProfileGridDimensionPicker'
import { SymbolColorPicker } from '@/components/admin/SymbolColorPicker'
import BrandLockup from '@/components/site/BrandLockup'
import KeyboardThemeModal from '@/components/app/KeyboardThemeModal'
import type { SubscriptionPlan } from '@/lib/subscription/plans'
import type { Symbol as BoardSymbol } from '@/lib/supabase/types'
import {
  adminEditToMenuConfig,
  EMPTY_WORD_VARIANTS_EDIT,
  symbolHasVariantMenu,
  type WordVariantsEdit,
} from '@/lib/symbolWordVariants'
import {
  DEFAULT_SYMBOL_COLOR,
  getSymbolTextColor,
  normalizeSymbolColor,
  resolveSymbolColor,
} from '@/lib/ui/symbolColors'
import type { KeyboardThemeColors } from '@/lib/keyboard/theme'
import { getSpanishPosLabel } from '@/lib/lexicon/posLabels'
import { closeAudioContextSafe, connectAudioElementGain } from '@/lib/voice/audioGain'
import { femaleVoices, getPresetPlaybackGain, maleVoices } from '@/lib/voice/elevenlabsPresets'
import type { TtsMode } from '@/lib/tts/types'
import {
  blobToCloneFile,
  CLONE_RECORD_MAX_MS,
  CLONE_RECORD_MIN_MS,
  pickRecorderMimeType,
} from '@/lib/voice/cloneRecording'

const VOICE_CLONE_DISCLAIMER_STORAGE_KEY = 'luma_voice_clone_disclaimer_v1'
const MAX_VOICE_CLONE_BYTES = 25 * 1024 * 1024
/** Última vez que se mostró el upsell de plan Libre (ms); no volver a mostrar hasta 24 h. */
const ADMIN_FREE_PLAN_UPSELL_LAST_MS_KEY = 'luma_admin_free_plan_upsell_last_ms'
const ADMIN_FREE_PLAN_UPSELL_COOLDOWN_MS = 24 * 60 * 60 * 1000

function readAdminFreePlanUpsellLastMs(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ADMIN_FREE_PLAN_UPSELL_LAST_MS_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeAdminFreePlanUpsellLastMs(ts: number) {
  try {
    localStorage.setItem(ADMIN_FREE_PLAN_UPSELL_LAST_MS_KEY, String(ts))
  } catch {
    /* privado / storage lleno */
  }
}

const ADMIN_GRID_DIM_MIN = 1
const ADMIN_GRID_DIM_MAX = 20
/** Ancho fijo de celda en vista previa admin; la altura sigue aspect-video (16/9). */
const ADMIN_PREVIEW_CELL_COL_WIDTH = '7.25rem'

const COVERAGE_REVIEW_REASON_LABEL = {
  sin_lexema: 'Sin lexema',
  baja_confianza: 'Baja confianza',
  tipo_generico: 'Tipo genérico',
  normalizacion_pendiente: 'Normalización pendiente',
} as const

/** No auto-ocultar: si la operación tarda >7s el usuario seguiría viendo el aviso. */
const ADMIN_STATUS_SKIP_AUTO_DISMISS = new Set(['Cargando...'])

function subscriptionPlanLabel(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'free':
      return 'Libre'
    case 'voice':
      return 'Voz'
    case 'identity':
      return 'Identidad'
    default:
      return 'Libre'
  }
}

type AdminProfile = {
  id: string
  userId?: string
  name: string
  gender?: string
  communication_gender?: string
  isDemo?: boolean
  /** Tablero que abre al entrar en /tablero (campo `users.default_profile_id`). */
  isOpeningProfile?: boolean
  gridRows?: number
  gridCols?: number
  keyboardTheme?: KeyboardThemeColors | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

type AdminSymbol = {
  id: string
  gridId?: string | null
  grid_id?: string | null
  profileId?: string
  sourceSymbolId?: string
  label: string
  normalizedLabel?: string | null
  emoji?: string | null
  imageUrl?: string | null
  image_url?: string | null
  category: string
  posType: string
  pos_type?: string | null
  posConfidence?: number | null
  manualGrammarOverride?: boolean
  lexemeId?: string | null
  lexeme_id?: string | null
  positionX?: number | null
  positionY?: number | null
  position_x?: number | null
  position_y?: number | null
  color: string
  hidden?: boolean
  state?: string | null
  /** En /tablero, abre la pestaña teclado al pulsar. */
  opensKeyboard?: boolean
  /** Variantes de palabra (hasta 4) para el tablero. */
  wordVariants?: WordVariantsEdit
  /** Solo modal admin: pestaña «Opciones avanzadas»; no se persiste en BD. */
  advancedUnlockedForEdit?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
  created_at?: string
  updated_at?: string
}

function stripAdminSymbolClientFields(symbol: AdminSymbol): AdminSymbol {
  const { advancedUnlockedForEdit: _u, ...rest } = symbol
  return rest
}

const STATE_OPTIONS = [
  { value: 'visible', label: 'Visible (Normal)' },
  { value: 'locked', label: 'Bloqueado (No clickeable)' },
  { value: 'hidden', label: 'Oculto (Invisible)' },
]

const SYMBOL_POS_OPTIONS = [
  { value: 'pronoun', label: 'Pronombre' },
  { value: 'verb', label: 'Verbo' },
  { value: 'noun', label: 'Sustantivo' },
  { value: 'adj', label: 'Adjetivo' },
  { value: 'adverb', label: 'Adverbio' },
  { value: 'prep', label: 'Preposición' },
  { value: 'other', label: 'Otro' },
] as const

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Seguir sistema', icon: Monitor },
] as const

const DYSLEXIA_FONT_OPTIONS = [
  { value: false, label: 'Desactivado' },
  { value: true, label: 'Activado' },
] as const

type ThemePreference = 'light' | 'dark' | 'system'

const EMOJI_OPTIONS = [
  '😀', '😊', '😍', '😢', '😡', '👍', '👎', '✅',
  '❌', '➕', '💬', '❤️', '💙', '⭐', '🏠', '🏫',
  '🛏️', '🚽', '🌳', '🍎', '🥤', '🍞', '🍪', '🍽️',
  '🎮', '🧩', '📚', '🧍', '👨', '👩', '👤', '👥',
  '🚗', '🚌', '✈️', '⏰', '📅', '🎨', '🐶', '🐱',
]

const EMPTY_SYMBOL: Omit<AdminSymbol, 'id' | 'createdAt' | 'updatedAt' | 'gridId' | 'hidden'> = {
  label: '',
  emoji: '',
  imageUrl: '',
  category: 'General',
  posType: 'noun',
  posConfidence: null,
  manualGrammarOverride: false,
  lexemeId: null,
  positionX: 0,
  positionY: 0,
  color: DEFAULT_SYMBOL_COLOR,
  state: 'visible',
  opensKeyboard: false,
  wordVariants: { ...EMPTY_WORD_VARIANTS_EDIT },
}

function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

type LexemeAlternative = {
  lexemeId: string
  lemma: string
  primaryPos: string
  symbolPosType: string
  confidence: number
  method: string
}

type LexemePreview = {
  lexemeId: string | null
  detectedLemma: string | null
  primaryPos: string | null
  symbolPosType: string
  confidence: number
  method: string
  normalizedLabel: string
  matchedForm?: {
    surface: string
    formType: string
    person: number | null
    tense: string | null
    mood: string | null
    number: string | null
    gender: string | null
  } | null
  alternatives: LexemeAlternative[]
}

function getSymbolPosition(symbol: Pick<AdminSymbol, 'positionX' | 'positionY' | 'position_x' | 'position_y'>) {
  return {
    x: symbol.positionX ?? symbol.position_x ?? 0,
    y: symbol.positionY ?? symbol.position_y ?? 0,
  }
}

function symbolImageDisplayUrl(symbol: Pick<AdminSymbol, 'imageUrl' | 'image_url'>): string | undefined {
  const u = symbol.imageUrl ?? symbol.image_url
  return typeof u === 'string' && u.length > 0 ? u : undefined
}

function isMovableSymbol(symbol: Pick<AdminSymbol, 'id'> | null | undefined) {
  return Boolean(
    symbol?.id &&
    !String(symbol.id).startsWith('fixed-left') &&
    !String(symbol.id).startsWith('template') &&
    !String(symbol.id).startsWith('folder-item-')
  )
}

function updateSymbolCoordinates(symbol: AdminSymbol, x: number, y: number): AdminSymbol {
  return {
    ...symbol,
    positionX: x,
    positionY: y,
    position_x: x,
    position_y: y,
  }
}

/** Firma estable del grid para detectar cambios sin guardar (mismos campos que importan al persistir). */
function stableGridSnapshot(symbols: AdminSymbol[]): string {
  const rows = [...symbols]
    .map((s) => {
      const pos = getSymbolPosition(s)
      return {
        id: s.id,
        label: typeof s.label === 'string' ? s.label.trim() : '',
        normalizedLabel: typeof s.normalizedLabel === 'string' ? s.normalizedLabel.trim() : '',
        emoji: s.emoji ?? null,
        imageUrl: s.imageUrl ?? s.image_url ?? null,
        category: s.category ?? '',
        posType: s.posType ?? s.pos_type ?? 'other',
        posConfidence: s.posConfidence ?? null,
        manualGrammarOverride: Boolean(s.manualGrammarOverride),
        lexemeId: s.lexemeId ?? s.lexeme_id ?? null,
        positionX: pos.x,
        positionY: pos.y,
        color: normalizeSymbolColor(s.color ?? DEFAULT_SYMBOL_COLOR),
        state: s.state ?? 'visible',
        gridId: s.gridId ?? s.grid_id ?? 'main',
        hidden: Boolean(s.hidden),
        opensKeyboard: Boolean(s.opensKeyboard),
        wordVariants: JSON.parse(
          JSON.stringify(s.wordVariants ?? EMPTY_WORD_VARIANTS_EDIT),
        ) as WordVariantsEdit,
      }
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
  return JSON.stringify(rows)
}

function adminSymbolFromBoard(s: BoardSymbol): AdminSymbol {
  return {
    ...s,
    wordVariants: s.wordVariants
      ? {
          enabled: true,
          defaultIndex: s.wordVariants.defaultIndex,
          variants: [...s.wordVariants.variants] as [string, string, string, string],
        }
      : { ...EMPTY_WORD_VARIANTS_EDIT },
  }
}

function sortSymbolsByPosition(a: AdminSymbol, b: AdminSymbol) {
  const aPos = getSymbolPosition(a)
  const bPos = getSymbolPosition(b)
  if (aPos.y !== bPos.y) return aPos.y - bPos.y
  return aPos.x - bPos.x
}

function DroppableGridCell({
  cellId,
  className,
  style,
  children,
}: {
  cellId: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id: cellId })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className ?? ''} ${isOver ? 'rounded-lg ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50' : ''}`.trim()}
    >
      {children}
    </div>
  )
}

function DraggableGridItem({
  symbol,
  children,
}: {
  symbol: AdminSymbol
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: symbol.id,
    disabled: !isMovableSymbol(symbol),
  })

  // No aplicar `transform` aquí: con <DragOverlay> el overlay sigue el puntero; sumar ambos
  // desincroniza la posición (muy visible con overflow-x-auto en el grid).
  const style = {
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex min-h-0 min-w-0 h-full w-full ${isMovableSymbol(symbol) ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`.trim()}
    >
      {children}
    </div>
  )
}

const DEBUG_CREATE_PROFILE_STEP_EMAIL = 'sergio.tdc.tdc@gmail.com'

export default function AdminPage() {
  const { data: session, update: updateSession } = useSession()
  const { setTheme } = useTheme()
  /** Solo desactiva animaciones elaboradas cuando el SO pide reducir movimiento. */
  const prefersReducedMotion = useReducedMotion() === true
  const [accountSettings, setAccountSettings] = useState<{
    id: string
    name: string | null
    email: string
    preferredTheme: ThemePreference
    preferredDyslexiaFont: boolean
    hasLocalPassword?: boolean
  } | null>(null)
  const [accountName, setAccountName] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPreferredTheme, setAccountPreferredTheme] = useState<ThemePreference>('system')
  const [accountPreferredDyslexiaFont, setAccountPreferredDyslexiaFont] = useState(false)
  const [showChangePasswordFields, setShowChangePasswordFields] = useState(false)
  const [accountCurrentPassword, setAccountCurrentPassword] = useState('')
  const [accountNewPassword, setAccountNewPassword] = useState('')
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('')
  const [accountGender, setAccountGender] = useState<'male' | 'female'>('male')
  const [savingAccountSettings, setSavingAccountSettings] = useState(false)
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [lexiconObservability, setLexiconObservability] = useState<Awaited<ReturnType<typeof getProfileLexiconObservability>>>(null)
  const [lexiconObservabilityLoading, setLexiconObservabilityLoading] = useState(false)
  const [symbols, setSymbols] = useState<AdminSymbol[]>([])
  const [symbolsBaselineJson, setSymbolsBaselineJson] = useState('')
  const symbolsProfileLoadGen = useRef(0)
  const [savingSymbols, setSavingSymbols] = useState(false)
  const [gridSaveFeedback, setGridSaveFeedback] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [status, setStatus] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [symbolsLoadPending, setSymbolsLoadPending] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  /** Filas/columnas pendientes hasta pulsar «Guardar cambios» (no tablero demo). */
  const [pendingGridDimensions, setPendingGridDimensions] = useState<{ rows: number; cols: number } | null>(null)
  const [editingSymbol, setEditingSymbol] = useState<AdminSymbol | null>(null)
  const symbolEditFingerprintRef = useRef<string | null>(null)
  const [lexemePreview, setLexemePreview] = useState<LexemePreview | null>(null)
  const [detectingLexeme, setDetectingLexeme] = useState(false)
  const [listSearch, setListSearch] = useState('')
  const [listStateFilter, setListStateFilter] = useState<'all' | 'visible' | 'locked' | 'hidden'>('all')

  // Nested Folder state
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false)
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false)
  const [showLumaGridSettingsModal, setShowLumaGridSettingsModal] = useState(false)
  const [keyboardThemeModalOpen, setKeyboardThemeModalOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileGender, setNewProfileGender] = useState<'male' | 'female'>('male')
  const [createProfileStep, setCreateProfileStep] = useState<1 | 2 | 3>(1)
  const [newProfileGridCols, setNewProfileGridCols] = useState(14)
  const [newProfileGridRows, setNewProfileGridRows] = useState(8)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [profileBeingEdited, setProfileBeingEdited] = useState<AdminProfile | null>(null)
  const [editProfileName, setEditProfileName] = useState('')
  const [profileDuplicateBusy, setProfileDuplicateBusy] = useState(false)
  const [savingProfileChanges, setSavingProfileChanges] = useState(false)
  const [deletingProfileId, setDeletingProfileId] = useState('')
  const [settingDefaultProfileId, setSettingDefaultProfileId] = useState('')
  const [repairingDemoLayout, setRepairingDemoLayout] = useState(false)
  /** Celda vacía en la que el usuario abrió el menú crear botón / crear carpeta */
  const [splitEmptyCell, setSplitEmptyCell] = useState<{ x: number; y: number } | null>(null)
  /** Modal nativo: nombre de carpeta nueva (sustituye window.prompt) */
  const [createFolderModal, setCreateFolderModal] = useState<{ x: number; y: number } | null>(null)
  const [createFolderName, setCreateFolderName] = useState('')
  const [profilePendingDeletion, setProfilePendingDeletion] = useState<AdminProfile | null>(null)
  const [deleteProfileNameConfirmation, setDeleteProfileNameConfirmation] = useState('')
  const [activeDraggedSymbolId, setActiveDraggedSymbolId] = useState<string | null>(null)
  /** Evita mismatch de hidratación en botones que dependen de estado cargado tras mount (SSR vs cliente). */
  const [adminHydrated, setAdminHydrated] = useState(false)

  const [voiceTtsMode, setVoiceTtsMode] = useState<TtsMode>('browser')
  const [voicePresetElevenId, setVoicePresetElevenId] = useState<string>('')
  const [voiceCharsUsed, setVoiceCharsUsed] = useState(0)
  const [voiceMonthlyLimit, setVoiceMonthlyLimit] = useState(10_000)
  const [voicePlan, setVoicePlan] = useState<SubscriptionPlan>('free')
  const [voiceSubscriptionActive, setVoiceSubscriptionActive] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [showPlanPickerModal, setShowPlanPickerModal] = useState(false)
  const [showFreePlanUpsell, setShowFreePlanUpsell] = useState(false)
  const [showVoicePlanRequiredModal, setShowVoicePlanRequiredModal] = useState(false)
  const [voiceCloneDisclaimerOpen, setVoiceCloneDisclaimerOpen] = useState(false)
  const [subscriptionPortalBusy, setSubscriptionPortalBusy] = useState(false)
  const [complimentaryUnlimited, setComplimentaryUnlimited] = useState(false)
  const [voiceCloneBusy, setVoiceCloneBusy] = useState(false)
  const [cloneVoiceName, setCloneVoiceName] = useState('Mi voz AAC')
  const [cloneRecording, setCloneRecording] = useState(false)
  const [cloneLiveStream, setCloneLiveStream] = useState<MediaStream | null>(null)
  const [clonePreviewFile, setClonePreviewFile] = useState<File | null>(null)
  const [recordElapsedSec, setRecordElapsedSec] = useState(0)
  const cloneFileRef = useRef<HTMLInputElement | null>(null)
  const cloneMediaRecorderRef = useRef<MediaRecorder | null>(null)
  const cloneMediaStreamRef = useRef<MediaStream | null>(null)
  const cloneRecordChunksRef = useRef<Blob[]>([])
  const cloneRecordStartedAtRef = useRef<number>(0)
  const [voicePreviewBusy, setVoicePreviewBusy] = useState(false)
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null)
  const [previewPlayingVoiceId, setPreviewPlayingVoiceId] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const previewAudioContextRef = useRef<AudioContext | null>(null)
  const previewBlobUrlRef = useRef<string | null>(null)

  const canUsePresetVoices = voiceSubscriptionActive && (voicePlan === 'voice' || voicePlan === 'identity')
  const canUseCustomVoice = voiceSubscriptionActive && voicePlan === 'identity'

  const voiceTtsQuotaExceeded = useMemo(
    () =>
      voiceSubscriptionActive &&
      voiceMonthlyLimit > 0 &&
      voiceCharsUsed > voiceMonthlyLimit,
    [voiceSubscriptionActive, voiceMonthlyLimit, voiceCharsUsed],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const selectedProfileIdRef = useRef(selectedProfileId)
  selectedProfileIdRef.current = selectedProfileId
  const symbolsRef = useRef(symbols)
  symbolsRef.current = symbols

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [fetchedProfiles, fetchedAccountSettings, voiceSettings, gateState] = await Promise.all([
        getProfiles(),
        getAccountSettings(),
        getVoiceSettings(),
        getSubscriptionGateState(),
      ])
      const normalizedAccountSettings = fetchedAccountSettings
        ? {
            ...fetchedAccountSettings,
            preferredTheme: normalizeThemePreference(fetchedAccountSettings.preferredTheme),
            hasLocalPassword: Boolean(fetchedAccountSettings.hasLocalPassword),
          }
        : null
      if (gateState.signedIn) {
        setStripeCustomerId(gateState.stripeCustomerId)
      }

      setProfiles(fetchedProfiles)
      setAccountSettings(normalizedAccountSettings)
      setAccountName(normalizedAccountSettings?.name ?? '')
      setAccountEmail(normalizedAccountSettings?.email ?? '')
      setAccountPreferredTheme(normalizedAccountSettings?.preferredTheme ?? 'system')
      setAccountPreferredDyslexiaFont(Boolean(normalizedAccountSettings?.preferredDyslexiaFont))

      const currentPid = selectedProfileIdRef.current
      let effectiveProfileId = currentPid
      if (fetchedProfiles.length === 0) {
        effectiveProfileId = ''
        setSelectedProfileId('')
      } else if (!currentPid || !fetchedProfiles.some((profile) => profile.id === currentPid)) {
        const opening = fetchedProfiles.find((p) => p.isOpeningProfile)
        effectiveProfileId = opening?.id ?? fetchedProfiles[0].id
        setSelectedProfileId(effectiveProfileId)
      }

      if (voiceSettings) {
        setVoiceTtsMode(voiceSettings.ttsMode)
        const profilesList = fetchedProfiles
        const activePid =
          effectiveProfileId && profilesList.some((p) => p.id === effectiveProfileId)
            ? effectiveProfileId
            : profilesList[0]?.id ?? ''
        const profileForVoice = profilesList.find((p) => p.id === activePid)
        const genderForVoice = profileForVoice?.gender === 'female' ? 'female' : 'male'
        const voicesForGender = genderForVoice === 'male' ? maleVoices : femaleVoices
        const defaultPreset = voicesForGender[0]?.voiceId ?? ''
        if (voiceSettings.ttsMode === 'preset' && voiceSettings.voiceId) {
          const inList = voicesForGender.some((v) => v.voiceId === voiceSettings.voiceId)
          setVoicePresetElevenId(inList ? voiceSettings.voiceId : defaultPreset)
        } else {
          setVoicePresetElevenId(defaultPreset)
        }
        setVoiceCharsUsed(voiceSettings.charactersUsed)
        setVoiceMonthlyLimit(voiceSettings.monthlyCharLimit)
        setVoicePlan(voiceSettings.plan)
        setVoiceSubscriptionActive(voiceSettings.hasActivePaidSubscription)
        setComplimentaryUnlimited(voiceSettings.complimentaryUnlimited)
      }
    } catch (error) {
      console.error(error)
      setStatus('Error al cargar tableros')
    }
    setLoadingData(false)
  }, [])

  const resetPasswordFields = useCallback(() => {
    setShowChangePasswordFields(false)
    setAccountCurrentPassword('')
    setAccountNewPassword('')
    setAccountConfirmPassword('')
  }, [])

  const abortCloneRecording = useCallback(() => {
    const mr = cloneMediaRecorderRef.current
    const stream = cloneMediaStreamRef.current
    if (mr && mr.state !== 'inactive') {
      mr.onstop = null
      try {
        mr.stop()
      } catch {
        /* ignore */
      }
    }
    stream?.getTracks().forEach((t) => t.stop())
    cloneMediaRecorderRef.current = null
    cloneMediaStreamRef.current = null
    cloneRecordChunksRef.current = []
    setCloneLiveStream(null)
    setCloneRecording(false)
    setRecordElapsedSec(0)
  }, [])

  const openCustomVoiceMode = useCallback(() => {
    if (!voiceSubscriptionActive) return
    if (voicePlan !== 'identity') {
      setVoiceTtsMode('custom')
      return
    }
    if (typeof window !== 'undefined') {
      try {
        if (window.localStorage.getItem(VOICE_CLONE_DISCLAIMER_STORAGE_KEY) === '1') {
          setVoiceTtsMode('custom')
          return
        }
      } catch {
        /* private mode / storage blocked */
      }
    }
    setVoiceCloneDisclaimerOpen(true)
  }, [voicePlan, voiceSubscriptionActive])

  const acceptVoiceCloneDisclaimer = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(VOICE_CLONE_DISCLAIMER_STORAGE_KEY, '1')
      }
    } catch {
      /* ignore */
    }
    setVoiceCloneDisclaimerOpen(false)
    setVoiceTtsMode('custom')
  }, [])

  const cancelVoiceCloneDisclaimer = useCallback(() => {
    setVoiceCloneDisclaimerOpen(false)
  }, [])

  const openSubscriptionPortal = useCallback(async () => {
    setSubscriptionPortalBusy(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', credentials: 'include' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        if (data.error === 'no_customer') {
          setShowPlanPickerModal(true)
        }
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setSubscriptionPortalBusy(false)
    }
  }, [])

  const handleSubscriptionClick = useCallback(() => {
    if (stripeCustomerId) {
      void openSubscriptionPortal()
    } else {
      setShowPlanPickerModal(true)
    }
  }, [stripeCustomerId, openSubscriptionPortal])

  const stopVoicePreviewAndCloneCleanup = useCallback(() => {
    abortCloneRecording()
    closeAudioContextSafe(previewAudioContextRef.current)
    previewAudioContextRef.current = null
    previewAudioRef.current?.pause()
    previewAudioRef.current = null
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = null
    }
    setPreviewPlayingVoiceId(null)
  }, [abortCloneRecording])

  const closeAccountSettingsModal = useCallback(() => {
    stopVoicePreviewAndCloneCleanup()
    resetPasswordFields()
    setShowAccountSettingsModal(false)
  }, [stopVoicePreviewAndCloneCleanup, resetPasswordFields])

  const closeLumaGridSettingsModal = useCallback(() => {
    stopVoicePreviewAndCloneCleanup()
    setShowLumaGridSettingsModal(false)
  }, [stopVoicePreviewAndCloneCleanup])

  useEffect(() => {
    if (voiceTtsMode !== 'preset') return
    const list = accountGender === 'male' ? maleVoices : femaleVoices
    setVoicePresetElevenId((prev) => {
      if (list.some((v) => v.voiceId === prev)) return prev
      return list[0]?.voiceId ?? ''
    })
  }, [accountGender, voiceTtsMode])

  const voiceSettingsModalOpen = showAccountSettingsModal || showLumaGridSettingsModal

  useEffect(() => {
    if (!voiceSettingsModalOpen || voiceTtsMode !== 'preset') return
    let cancelled = false
    setVoicePreviewError(null)
    setVoicePreviewBusy(true)
    void ensureVoicePreviewSamples()
      .then((r) => {
        if (cancelled) return
        if (!r.ok) setVoicePreviewError(r.error)
      })
      .finally(() => {
        if (!cancelled) setVoicePreviewBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [voiceSettingsModalOpen, voiceTtsMode])

  const playPresetPreview = useCallback(async (voiceId: string) => {
    try {
      closeAudioContextSafe(previewAudioContextRef.current)
      previewAudioContextRef.current = null
      previewAudioRef.current?.pause()
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current)
        previewBlobUrlRef.current = null
      }
      setVoicePreviewError(null)
      const res = await fetch(`/api/voice/preview/${encodeURIComponent(voiceId)}`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string }
        setPreviewPlayingVoiceId(null)
        setVoicePreviewError(
          errJson.error ?? (res.status === 404 ? 'Muestra aún no generada. Espera a que termine la preparación.' : `Error ${res.status}`),
        )
        return
      }
      const blob = await res.blob()
      if (!blob.size) {
        setPreviewPlayingVoiceId(null)
        setVoicePreviewError('No se recibió audio.')
        return
      }
      const url = URL.createObjectURL(blob)
      previewBlobUrlRef.current = url
      const audio = new Audio(url)
      previewAudioRef.current = audio
      previewAudioContextRef.current = connectAudioElementGain(audio, getPresetPlaybackGain(voiceId))
      setPreviewPlayingVoiceId(voiceId)
      audio.onended = () => {
        closeAudioContextSafe(previewAudioContextRef.current)
        previewAudioContextRef.current = null
        URL.revokeObjectURL(url)
        previewBlobUrlRef.current = null
        previewAudioRef.current = null
        setPreviewPlayingVoiceId((cur) => (cur === voiceId ? null : cur))
      }
      audio.onerror = () => {
        closeAudioContextSafe(previewAudioContextRef.current)
        previewAudioContextRef.current = null
        URL.revokeObjectURL(url)
        previewBlobUrlRef.current = null
        previewAudioRef.current = null
        setPreviewPlayingVoiceId(null)
        setVoicePreviewError('No se pudo reproducir la muestra.')
      }
      await audio.play()
    } catch {
      setPreviewPlayingVoiceId(null)
      setVoicePreviewError('No se pudo reproducir la muestra.')
    }
  }, [])

  const submitVoiceClone = useCallback(
    async (file: File) => {
      if (voicePlan !== 'identity' || !voiceSubscriptionActive) return
      setVoiceCloneBusy(true)
      setStatus('')
      try {
        const fd = new FormData()
        fd.append('name', cloneVoiceName || 'Mi voz AAC')
        fd.append('file', file)
        const res = await fetch('/api/voice/clone', { method: 'POST', body: fd })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) throw new Error(data.error || 'Error al clonar voz')
        setVoiceTtsMode('custom')
        setClonePreviewFile(null)
        setStatus('✅ Voz clonada. Ya puedes usarla en el tablero.')
        await loadData()
      } catch (err) {
        setStatus(err instanceof Error ? `❌ ${err.message}` : '❌ Error al clonar')
      } finally {
        setVoiceCloneBusy(false)
      }
    },
    [cloneVoiceName, voicePlan, voiceSubscriptionActive, loadData],
  )

  const handleVoiceCloneUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || voicePlan !== 'identity' || !voiceSubscriptionActive) return
      if (file.size > MAX_VOICE_CLONE_BYTES) {
        setStatus('❌ Archivo demasiado grande (máx. 25 MB).')
        return
      }
      setStatus('')
      setClonePreviewFile(file)
    },
    [voicePlan, voiceSubscriptionActive],
  )

  const clearClonePreview = useCallback(() => {
    setClonePreviewFile(null)
  }, [])

  const startCloneRecording = useCallback(async () => {
    if (voicePlan !== 'identity' || !voiceSubscriptionActive) return
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('❌ Tu navegador no permite grabar audio. Usa «Subir archivo».')
      return
    }
    setStatus('')
    setClonePreviewFile(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      cloneMediaStreamRef.current = stream
      setCloneLiveStream(stream)
      cloneRecordChunksRef.current = []
      const mime = pickRecorderMimeType()
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      cloneMediaRecorderRef.current = mr
      mr.ondataavailable = (ev) => {
        if (ev.data.size) cloneRecordChunksRef.current.push(ev.data)
      }
      mr.onerror = () => setStatus('❌ Error al grabar.')
      cloneRecordStartedAtRef.current = Date.now()
      mr.start(200)
      setCloneRecording(true)
      setRecordElapsedSec(0)
    } catch {
      setStatus('❌ No se pudo usar el micrófono. Permite el permiso o usa «Subir archivo».')
    }
  }, [voicePlan, voiceSubscriptionActive])

  const stopCloneRecordingAndUpload = useCallback(async () => {
    const mr = cloneMediaRecorderRef.current
    const stream = cloneMediaStreamRef.current
    if (!mr || mr.state === 'inactive') {
      stream?.getTracks().forEach((t) => t.stop())
      cloneMediaRecorderRef.current = null
      cloneMediaStreamRef.current = null
      setCloneLiveStream(null)
      setCloneRecording(false)
      return
    }
    const duration = Date.now() - cloneRecordStartedAtRef.current

    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve()
      mr.stop()
    })
    stream?.getTracks().forEach((t) => t.stop())
    cloneMediaRecorderRef.current = null
    cloneMediaStreamRef.current = null
    setCloneLiveStream(null)
    setCloneRecording(false)
    setRecordElapsedSec(0)

    if (duration < CLONE_RECORD_MIN_MS) {
      cloneRecordChunksRef.current = []
      setStatus('❌ Graba al menos 5 segundos (habla con claridad).')
      return
    }
    if (duration > CLONE_RECORD_MAX_MS) {
      cloneRecordChunksRef.current = []
      setStatus('❌ Grabación demasiado larga (máx. 5 min).')
      return
    }
    const chunks = cloneRecordChunksRef.current
    cloneRecordChunksRef.current = []
    const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
    if (blob.size < 500) {
      setStatus('❌ Grabación demasiado corta.')
      return
    }
    const file = blobToCloneFile(blob)
    setClonePreviewFile(file)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setAdminHydrated(true)
  }, [])

  useEffect(() => {
    if (!status) return
    if (ADMIN_STATUS_SKIP_AUTO_DISMISS.has(status)) return
    const id = window.setTimeout(() => setStatus(''), 7000)
    return () => window.clearTimeout(id)
  }, [status])

  const dismissFreePlanUpsell = useCallback(() => {
    setShowFreePlanUpsell(false)
  }, [])

  useEffect(() => {
    if (loadingData) return
    if (voicePlan !== 'free') {
      setShowFreePlanUpsell(false)
      return
    }
    if (typeof window === 'undefined') return
    const last = readAdminFreePlanUpsellLastMs()
    if (last !== null && Date.now() - last < ADMIN_FREE_PLAN_UPSELL_COOLDOWN_MS) {
      setShowFreePlanUpsell(false)
      return
    }
    setShowFreePlanUpsell(true)
  }, [loadingData, voicePlan])

  useEffect(() => {
    if (!showFreePlanUpsell) return
    if (typeof window === 'undefined') return
    writeAdminFreePlanUpsellLastMs(Date.now())
  }, [showFreePlanUpsell])

  useEffect(() => {
    if (!cloneRecording) return
    const id = window.setInterval(() => {
      setRecordElapsedSec(Math.floor((Date.now() - cloneRecordStartedAtRef.current) / 1000))
    }, 500)
    return () => window.clearInterval(id)
  }, [cloneRecording])

  useEffect(() => {
    if (!selectedProfileId) {
      setSymbols([])
      setSymbolsBaselineJson('')
      setSymbolsLoadPending(false)
      return
    }
    const gen = ++symbolsProfileLoadGen.current
    setSymbolsLoadPending(true)
    setSymbols([])
    setSymbolsBaselineJson('')
    setStatus('Cargando...')
    const fetchSymbols = async () => {
      try {
        const syms = await getProfileSymbols(selectedProfileId)
        if (symbolsProfileLoadGen.current !== gen) return
        const mapped = syms.map(adminSymbolFromBoard)
        setSymbols(mapped)
        setSymbolsBaselineJson(stableGridSnapshot(mapped))
        setSymbolsLoadPending(false)
        setStatus('Datos cargados.')
      } catch (error) {
        console.error(error)
        if (symbolsProfileLoadGen.current === gen) {
          setSymbolsLoadPending(false)
          setStatus('Error al cargar datos léxicos del tablero.')
        }
      }
    }
    void fetchSymbols()
  }, [selectedProfileId])

  useEffect(() => {
    setActiveFolder(null)
    setEditingSymbol(null)
    setActiveDraggedSymbolId(null)
    setSplitEmptyCell(null)
    setPendingGridDimensions(null)
  }, [selectedProfileId])

  useEffect(() => {
    setSplitEmptyCell(null)
  }, [activeFolder])

  useEffect(() => {
    if (editingSymbol) setSplitEmptyCell(null)
  }, [editingSymbol])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (createFolderModal) {
          setCreateFolderModal(null)
          setCreateFolderName('')
        } else {
          setSplitEmptyCell(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createFolderModal])

  const selectedProfile = profiles.find(p => p.id === selectedProfileId)

  /** Solo el tablero marcado en BD como demo (`isDemo === true`), no otro tablero aunque se llame igual. */
  const isSelectedDemoProfile = useMemo(
    () =>
      Boolean(
        selectedProfileId &&
          profiles.some((p) => p.id === selectedProfileId && p.isDemo === true),
      ),
    [profiles, selectedProfileId],
  )

  useEffect(() => {
    if (!selectedProfile) return
    setAccountGender(selectedProfile.gender === 'female' ? 'female' : 'male')
  }, [selectedProfile])

  useEffect(() => {
    if (!selectedProfileId) {
      setLexiconObservability(null)
      return
    }
    let cancelled = false
    setLexiconObservabilityLoading(true)
    void getProfileLexiconObservability(selectedProfileId)
      .then((data) => {
        if (!cancelled) setLexiconObservability(data)
      })
      .finally(() => {
        if (!cancelled) setLexiconObservabilityLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedProfileId])

  useEffect(() => {
    if (!editingSymbol) {
      setLexemePreview(null)
      setDetectingLexeme(false)
      return
    }

    const label = typeof editingSymbol.label === 'string' ? editingSymbol.label.trim() : ''
    if (!label) {
      setLexemePreview(null)
      setDetectingLexeme(false)
      return
    }

    let isCancelled = false
    setDetectingLexeme(true)

    const timeoutId = setTimeout(async () => {
      try {
        const detection = await previewLexemeDetection(label)
        if (!isCancelled) {
          setLexemePreview(detection)
        }
      } catch {
        if (!isCancelled) {
          setLexemePreview(null)
        }
      } finally {
        if (!isCancelled) {
          setDetectingLexeme(false)
        }
      }
    }, 250)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [editingSymbol])

  const handleGridSizeUpdate = (rows: number, cols: number) => {
    if (!selectedProfile || isSelectedDemoProfile) return
    const r = Math.min(ADMIN_GRID_DIM_MAX, Math.max(ADMIN_GRID_DIM_MIN, Math.floor(rows)))
    const c = Math.min(ADMIN_GRID_DIM_MAX, Math.max(ADMIN_GRID_DIM_MIN, Math.floor(cols)))
    const pr = selectedProfile.gridRows ?? 8
    const pc = selectedProfile.gridCols ?? 14
    if (r === pr && c === pc) {
      setPendingGridDimensions(null)
    } else {
      setPendingGridDimensions({ rows: r, cols: c })
    }
  }

  const handleSaveAccountSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const settingsModalTarget =
      (e.currentTarget.dataset.settingsModal as 'account' | 'luma' | undefined) ?? 'account'

    if (!accountName.trim() || !accountEmail.trim()) {
      setStatus('❌ El nombre y el correo electrónico son obligatorios.')
      return
    }

    if (accountNewPassword && accountNewPassword !== accountConfirmPassword) {
      setStatus('❌ La nueva contraseña y su confirmación no coinciden.')
      return
    }

    if (voiceTtsMode === 'custom' && voicePlan !== 'identity') {
      setStatus('❌ La voz clonada requiere plan Pro. Elige otro modo de voz o actualiza tu plan.')
      return
    }

    setSavingAccountSettings(true)
    setStatus('')
    try {
      const updatedAccount = await updateAccountSettings({
        name: accountName,
        email: accountEmail,
        preferredTheme: accountPreferredTheme,
        preferredDyslexiaFont: accountPreferredDyslexiaFont,
        currentPassword: accountCurrentPassword,
        newPassword: accountNewPassword,
      })

      await updateVoiceSettings({
        ttsMode: voiceTtsMode,
        voiceId:
          voiceTtsMode === 'browser'
            ? null
            : voiceTtsMode === 'preset'
              ? voicePresetElevenId
              : undefined,
      })

      if (selectedProfile) {
        await updateProfileGender(selectedProfile.id, accountGender)
        setProfileGender(selectedProfile.id, accountGender)
      }

      const normalizedPreferredTheme = normalizeThemePreference(updatedAccount.preferredTheme)
      setAccountSettings({
        ...updatedAccount,
        preferredTheme: normalizedPreferredTheme,
        hasLocalPassword: Boolean(updatedAccount.hasLocalPassword),
      })
      setAccountName(updatedAccount.name ?? '')
      setAccountEmail(updatedAccount.email)
      setAccountPreferredTheme(normalizedPreferredTheme)
      setAccountPreferredDyslexiaFont(Boolean(updatedAccount.preferredDyslexiaFont))
      resetPasswordFields()
      setTheme(normalizedPreferredTheme)
      await updateSession({
        user: {
          name: updatedAccount.name ?? '',
          email: updatedAccount.email,
          preferredTheme: normalizedPreferredTheme,
          preferredDyslexiaFont: Boolean(updatedAccount.preferredDyslexiaFont),
        },
      })
      await loadData()
      if (settingsModalTarget === 'luma') {
        closeLumaGridSettingsModal()
        setStatus('✅ Voz y género de comunicación actualizados.')
      } else {
        closeAccountSettingsModal()
        setStatus('✅ Configuración de la cuenta actualizada correctamente.')
      }
    } catch (error) {
      console.error(error)
      setStatus(error instanceof Error ? `❌ ${error.message}` : '❌ No se pudo actualizar la cuenta.')
    } finally {
      setSavingAccountSettings(false)
    }
  }

  const handleExportBoard = useCallback(async () => {
    if (!selectedProfileId) return
    try {
      const res = await exportProfileBoardJson(selectedProfileId)
      if (!res.ok) {
        setStatus(`❌ ${res.error}`)
        return
      }
      const blob = new Blob([res.data], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus('✅ Tablero exportado (JSON).')
    } catch (err) {
      console.error(err)
      setStatus('❌ Error al exportar el tablero.')
    }
  }, [selectedProfileId])

  const handleSaveAll = async () => {
    if (!selectedProfileId || savingSymbols || !selectedProfile) return
    const dimsDirty =
      !isSelectedDemoProfile &&
      pendingGridDimensions !== null &&
      (pendingGridDimensions.rows !== (selectedProfile.gridRows ?? 8) ||
        pendingGridDimensions.cols !== (selectedProfile.gridCols ?? 14))
    const symbolsDirty =
      symbolsBaselineJson !== '' && stableGridSnapshot(symbols) !== symbolsBaselineJson
    if (!dimsDirty && !symbolsDirty) return

    setSavingSymbols(true)
    setGridSaveFeedback('saving')
    setStatus('')
    try {
      if (dimsDirty && pendingGridDimensions) {
        await updateProfileGridSize(selectedProfileId, pendingGridDimensions.rows, pendingGridDimensions.cols)
        const data = await getProfiles()
        setProfiles(data)
        setPendingGridDimensions(null)
      }
      if (symbolsDirty) {
        await saveSymbols(selectedProfileId, symbols)
        const freshSymbols = await getProfileSymbols(selectedProfileId)
        const mappedFresh = freshSymbols.map(adminSymbolFromBoard)
        setSymbols(mappedFresh)
        setSymbolsBaselineJson(stableGridSnapshot(mappedFresh))
      }
      setStatus(
        dimsDirty && symbolsDirty
          ? '✅ Dimensiones del grid y símbolos guardados.'
          : dimsDirty
            ? '✅ Dimensiones del grid guardadas.'
            : '✅ Cambios guardados correctamente.',
      )
      setGridSaveFeedback('saved')
    } catch (err) {
      console.error(err)
      setStatus('❌ Error al guardar.')
      setGridSaveFeedback('idle')
    } finally {
      setSavingSymbols(false)
    }
  }

  const deleteSymbol = async (symbolId: string) => {
    if (symbolId.startsWith('new-') || symbolId.startsWith('fixed-') || symbolId.startsWith('template-')) {
      setSymbols((prev) => prev.filter((s) => s.id !== symbolId && s.gridId !== symbolId))
      return
    }
    try {
      await deleteSymbolAction(selectedProfileId, symbolId)
      setSymbols((prev) => {
        const next = prev.filter((s) => s.id !== symbolId && s.gridId !== symbolId)
        setSymbolsBaselineJson(stableGridSnapshot(next))
        return next
      })
      setStatus('Símbolo eliminado.')
    } catch {
      setStatus('Error al eliminar símbolo.')
    }
  }

  const closeEditingSymbolModal = useCallback(() => {
    setEditingSymbol(null)
    setLexemePreview(null)
    setDetectingLexeme(false)
  }, [])

  useEffect(() => {
    if (!editingSymbol) {
      symbolEditFingerprintRef.current = null
      return
    }
    const pos = getSymbolPosition(editingSymbol)
    const fp = editingSymbol.id
      ? String(editingSymbol.id)
      : `draft:${pos.x},${pos.y}`
    if (symbolEditFingerprintRef.current !== fp) {
      symbolEditFingerprintRef.current = fp
    }
  }, [editingSymbol])

  const handleEditSave = () => {
    if (!editingSymbol) return
    const cleaned = stripAdminSymbolClientFields(editingSymbol)
    const wv = cleaned.wordVariants
    if (wv?.enabled) {
      const filled = wv.variants.filter((t) => t.trim()).length
      if (filled < 2) {
        setStatus('Variantes: rellena al menos dos textos o desactiva la opción.')
        return
      }
    }
    setSymbols(prev => {
      const existing = prev.find(s => s.id === cleaned.id)
      if (existing) {
        return prev.map((s) =>
          s.id === cleaned.id
            ? { ...cleaned, gridId: cleaned.gridId ?? s.gridId ?? 'main' }
            : s,
        )
      } else {
        // Create new
        const newSym = {
          ...cleaned,
          id: `new-${Date.now()}`,
          gridId: cleaned.gridId ?? 'main',
        }
        return [...prev, newSym]
      }
    })
    closeEditingSymbolModal()
  }

  const handleDeleteEditingSymbol = async () => {
    if (!editingSymbol) return

    const symbolId = String(editingSymbol.id ?? '')
    if (!symbolId) return

    if (symbolId.startsWith('new-') || symbolId.startsWith('fixed-') || symbolId.startsWith('template-')) {
      setSymbols((prev) =>
        prev.filter((s) => s.id !== editingSymbol.id && s.gridId !== editingSymbol.id),
      )
      closeEditingSymbolModal()
      setStatus('Símbolo eliminado.')
      return
    }

    try {
      await deleteSymbolAction(selectedProfileId, symbolId)
      setSymbols((prev) => {
        const next = prev.filter((s) => s.id !== symbolId && s.gridId !== symbolId)
        setSymbolsBaselineJson(stableGridSnapshot(next))
        return next
      })
      closeEditingSymbolModal()
      setStatus('Símbolo eliminado.')
    } catch (error) {
      console.error(error)
      setStatus('Error al eliminar símbolo.')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingSymbol) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Prioridad a la imagen: evita guardar emoji + imagen a la vez y estados incoherentes tras el POST.
        setEditingSymbol({ ...editingSymbol, imageUrl: reader.result, emoji: null })
      }
    }
    reader.readAsDataURL(file)
  }

  const resetCreateProfileModal = useCallback(() => {
    setNewProfileName('')
    setNewProfileGender('male')
    setCreateProfileStep(1)
    setNewProfileGridCols(14)
    setNewProfileGridRows(8)
  }, [])

  const handleNewProfileGridSize = useCallback((c: number, r: number) => {
    setNewProfileGridCols(c)
    setNewProfileGridRows(r)
  }, [])

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfileName.trim()) return

    setCreatingProfile(true)
    setStatus('')
    try {
      const profile = await createProfile({
        name: newProfileName,
        gender: newProfileGender,
        gridCols: newProfileGridCols,
        gridRows: newProfileGridRows,
      })
      await loadData()
      setSelectedProfileId(profile.id)
      setShowCreateProfileModal(false)
      resetCreateProfileModal()
      setStatus('✅ Tablero creado correctamente.')
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo crear el tablero.')
    } finally {
      setCreatingProfile(false)
    }
  }

  const openEditProfileModal = (profile: AdminProfile) => {
    setProfileBeingEdited(profile)
    setEditProfileName(profile.name)
  }

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileBeingEdited || !editProfileName.trim()) return

    setSavingProfileChanges(true)
    setStatus('')
    try {
      await updateProfile({
        profileId: profileBeingEdited.id,
        name: editProfileName,
      })
      await loadData()
      setProfileBeingEdited(null)
      setEditProfileName('')
      setStatus('✅ Tablero actualizado correctamente.')
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo actualizar el tablero.')
    } finally {
      setSavingProfileChanges(false)
    }
  }

  const handleDuplicateProfile = async () => {
    if (!profileBeingEdited || profileDuplicateBusy) return
    setProfileDuplicateBusy(true)
    setStatus('')
    try {
      await duplicateProfile(profileBeingEdited.id)
      await loadData()
      setProfileBeingEdited(null)
      setEditProfileName('')
      setStatus('✅ Tablero duplicado correctamente.')
    } catch (error) {
      console.error(error)
      setStatus(
        error instanceof Error ? `❌ ${error.message}` : '❌ No se pudo duplicar el tablero.',
      )
    } finally {
      setProfileDuplicateBusy(false)
    }
  }

  const handleDeleteProfile = async (profile: AdminProfile) => {
    if (profile.isDemo) return

    setProfilePendingDeletion(profile)
    setDeleteProfileNameConfirmation('')
  }

  const confirmDeleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profilePendingDeletion) return
    if (deleteProfileNameConfirmation.trim() !== profilePendingDeletion.name) return

    setDeletingProfileId(profilePendingDeletion.id)
    setStatus('')
    try {
      await deleteProfile(profilePendingDeletion.id)
      await loadData()
      setProfilePendingDeletion(null)
      setDeleteProfileNameConfirmation('')
      setStatus('✅ Tablero eliminado correctamente.')
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo eliminar el tablero.')
    } finally {
      setDeletingProfileId('')
    }
  }

  const handleSetDefaultProfile = async (profile: AdminProfile) => {
    if (profile.isOpeningProfile || settingDefaultProfileId) return
    setSettingDefaultProfileId(profile.id)
    setStatus('')
    try {
      await setDefaultOpeningProfile(profile.id)
      await loadData()
      setStatus('✅ Tablero seleccionado actualizado.')
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo establecer el tablero seleccionado.')
    } finally {
      setSettingDefaultProfileId('')
    }
  }

  const handleRepairDemoLayout = useCallback(async () => {
    if (!selectedProfileId || !isSelectedDemoProfile || repairingDemoLayout) return
    setRepairingDemoLayout(true)
    setStatus('')
    try {
      const { realigned } = await resetDemoProfilePositionsToTemplate(selectedProfileId)
      const syms = await getProfileSymbols(selectedProfileId)
      const mapped = syms.map(adminSymbolFromBoard)
      setSymbols(mapped)
      setSymbolsBaselineJson(stableGridSnapshot(mapped))
      setGridSaveFeedback('idle')
      setStatus(
        realigned > 0
          ? `✅ Tablero demo alineado (${realigned} celda(s) corregidas).`
          : '✅ Las posiciones del demo ya coincidían con la plantilla.',
      )
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo restaurar la plantilla del demo.')
    } finally {
      setRepairingDemoLayout(false)
    }
  }, [selectedProfileId, isSelectedDemoProfile, repairingDemoLayout])

  const shouldUseDefaultGridTemplate = isSelectedDemoProfile
  /** En tableros propios, `activeFolder` es el id del símbolo carpeta (no la etiqueta). En demo, el nombre de plantilla. */
  const activeFolderTitle = useMemo(() => {
    if (!activeFolder) return null
    if (shouldUseDefaultGridTemplate) return activeFolder
    const folderSym = symbols.find((s) => s.id === activeFolder)
    return folderSym?.label ?? activeFolder
  }, [activeFolder, shouldUseDefaultGridTemplate, symbols])

  const mainGridSymbols = shouldUseDefaultGridTemplate
    ? computeMainGrid(symbols as unknown as BoardSymbol[], activeFolder) as AdminSymbol[]
    : activeFolder
      ? symbols.filter((s) => s.gridId === activeFolder)
      : symbols.filter((s) => (s.gridId ?? 'main') === 'main')
  const draggableSymbolsById = useMemo(() => {
    return new Map(mainGridSymbols.filter((symbol) => isMovableSymbol(symbol)).map((symbol) => [symbol.id, symbol]))
  }, [mainGridSymbols])
  const activeDraggedSymbol = activeDraggedSymbolId ? draggableSymbolsById.get(activeDraggedSymbolId) ?? null : null
  const listSymbols = useMemo(() => {
    const normalizedQuery = listSearch.trim().toLowerCase()

    return [...mainGridSymbols]
      .sort(sortSymbolsByPosition)
      .filter((symbol) => {
        if (listStateFilter !== 'all' && (symbol.state ?? 'visible') !== listStateFilter) {
          return false
        }

        if (!normalizedQuery) return true

        const searchableText = [
          symbol.label,
          symbol.category,
          symbol.posType,
          symbol.emoji,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(normalizedQuery)
      })
  }, [listSearch, listStateFilter, mainGridSymbols])

  const demoFolderNames = useMemo(
    () => Object.keys(DEFAULT_FOLDER_CONTENTS).sort((a, b) => a.localeCompare(b, 'es')),
    [],
  )

  const findNextEmptyGridPosition = useCallback(() => {
    const gridCols = pendingGridDimensions?.cols ?? selectedProfile?.gridCols ?? 14
    const gridRows = pendingGridDimensions?.rows ?? selectedProfile?.gridRows ?? 8
    for (let y = 0; y < gridRows; y += 1) {
      for (let x = 0; x < gridCols; x += 1) {
        const occupied = mainGridSymbols.some((symbol) => {
          const position = getSymbolPosition(symbol)
          return position.x === x && position.y === y
        })
        if (!occupied) return { x, y }
      }
    }
    const sortedSymbols = [...mainGridSymbols].sort(sortSymbolsByPosition)
    const lastSymbol = sortedSymbols[sortedSymbols.length - 1]
    const lastPosition = lastSymbol ? getSymbolPosition(lastSymbol) : { x: 0, y: 0 }
    const nextIndex = lastPosition.y * gridCols + lastPosition.x + 1
    return {
      x: nextIndex % gridCols,
      y: Math.floor(nextIndex / gridCols),
    }
  }, [mainGridSymbols, selectedProfile?.gridCols, selectedProfile?.gridRows, pendingGridDimensions])

  const openSymbolReviewFromCoverageItem = useCallback(
    (symbolId: string) => {
      const symbol = symbols.find((s) => String(s.id) === String(symbolId))
      if (!symbol) {
        setStatus('No se encontró el símbolo en el tablero cargado. Recarga o vuelve a seleccionar el tablero.')
        return
      }
      const gid = symbol.gridId ?? symbol.grid_id ?? 'main'
      setActiveFolder(gid === 'main' ? null : gid)
      setViewMode('grid')
      const position = getSymbolPosition(symbol)
      setEditingSymbol({
        ...symbol,
        color: normalizeSymbolColor(symbol.color),
        positionX: position.x,
        positionY: position.y,
        state: symbol.state || 'visible',
      })
    },
    [symbols],
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (activeFolder) return
    setActiveDraggedSymbolId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDraggedSymbolId(null)
    if (activeFolder) return

    const overRaw = event.over?.id
    if (overRaw === undefined || overRaw === null) return
    const overId = String(overRaw)

    const draggedSymbol = draggableSymbolsById.get(String(event.active.id))
    if (!draggedSymbol || !isMovableSymbol(draggedSymbol)) return

    let x: number
    let y: number

    if (overId.startsWith('cell-')) {
      const [, targetX, targetY] = overId.split('-')
      x = Number(targetX)
      y = Number(targetY)
    } else {
      // Soltar encima de otro símbolo: `over` suele ser el id del draggable, no el de la celda.
      const droppedOn = mainGridSymbols.find((s) => String(s.id) === overId)
      if (!droppedOn) return
      const pos = getSymbolPosition(droppedOn)
      x = pos.x
      y = pos.y
    }

    if (Number.isNaN(x) || Number.isNaN(y)) return

    const sourcePosition = getSymbolPosition(draggedSymbol)
    if (sourcePosition.x === x && sourcePosition.y === y) return

    const targetSymbol = mainGridSymbols.find((symbol) => {
      if (!isMovableSymbol(symbol) || symbol.id === draggedSymbol.id) return false
      const position = getSymbolPosition(symbol)
      return position.x === x && position.y === y
    })

    setSymbols((prev) => prev.map((symbol) => {
      if (symbol.id === draggedSymbol.id) {
        return updateSymbolCoordinates(symbol, x, y)
      }

      if (targetSymbol && symbol.id === targetSymbol.id) {
        return updateSymbolCoordinates(symbol, sourcePosition.x, sourcePosition.y)
      }

      return symbol
    }))
  }

  const handleCreateSymbolFromList = () => {
    const nextPosition = findNextEmptyGridPosition()
    setEditingSymbol({
      id: `draft-${Date.now()}`,
      ...EMPTY_SYMBOL,
      gridId: !shouldUseDefaultGridTemplate && activeFolder ? activeFolder : 'main',
      positionX: nextPosition.x,
      positionY: nextPosition.y,
    })
  }

  const openCreateFolderModal = (x: number, y: number) => {
    if (!selectedProfileId || symbolsLoadPending) return
    if (isSelectedDemoProfile) {
      setStatus('En el tablero demo no se pueden crear carpetas nuevas.')
      setSplitEmptyCell(null)
      return
    }
    setCreateFolderName('')
    setCreateFolderModal({ x, y })
  }

  const closeCreateFolderModal = () => {
    setCreateFolderModal(null)
    setCreateFolderName('')
  }

  const confirmCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createFolderModal) return
    const trimmed = createFolderName.trim()
    if (!trimmed) {
      setStatus('El nombre de la carpeta no puede estar vacío.')
      return
    }
    const { x, y } = createFolderModal
    setEditingSymbol({
      id: `draft-${Date.now()}`,
      ...EMPTY_SYMBOL,
      label: trimmed,
      category: 'Carpetas',
      emoji: '📁',
      posType: 'noun',
      gridId: 'main',
      positionX: x,
      positionY: y,
    })
    closeCreateFolderModal()
    setSplitEmptyCell(null)
    setViewMode('grid')
    setStatus('')
  }

  const applyLexemeAlternative = (alternative: LexemeAlternative) => {
    if (!editingSymbol) return

    setEditingSymbol({
      ...editingSymbol,
      color: normalizeSymbolColor(editingSymbol.color),
      posType: alternative.symbolPosType,
      lexemeId: alternative.lexemeId,
      posConfidence: alternative.confidence,
      manualGrammarOverride: true,
    })
  }

  const hasUnsavedGridChanges = useMemo(() => {
    if (!selectedProfileId || !selectedProfile) return false
    const dimsDirty =
      !isSelectedDemoProfile &&
      pendingGridDimensions !== null &&
      (pendingGridDimensions.rows !== (selectedProfile.gridRows ?? 8) ||
        pendingGridDimensions.cols !== (selectedProfile.gridCols ?? 14))
    const symbolsDirty =
      symbolsBaselineJson !== '' && stableGridSnapshot(symbols) !== symbolsBaselineJson
    return dimsDirty || symbolsDirty
  }, [symbols, symbolsBaselineJson, selectedProfileId, selectedProfile, isSelectedDemoProfile, pendingGridDimensions])

  useEffect(() => {
    if (gridSaveFeedback !== 'saved') return
    const t = setTimeout(() => setGridSaveFeedback('idle'), 2600)
    return () => clearTimeout(t)
  }, [gridSaveFeedback])

  useEffect(() => {
    if (hasUnsavedGridChanges && gridSaveFeedback === 'saved') {
      setGridSaveFeedback('idle')
    }
  }, [hasUnsavedGridChanges, gridSaveFeedback])

  useEffect(() => {
    setGridSaveFeedback('idle')
  }, [selectedProfileId])

  const gridSavePhase: 'idle' | 'saving' | 'saved' = savingSymbols ? 'saving' : gridSaveFeedback

  const showCreateProfileStepDebug =
    session?.user?.email?.toLowerCase() === DEBUG_CREATE_PROFILE_STEP_EMAIL

  const previewGridCols =
    pendingGridDimensions?.cols ?? selectedProfile?.gridCols ?? 14
  const previewGridRows =
    pendingGridDimensions?.rows ?? selectedProfile?.gridRows ?? 8
  const canAddPreviewColumn = (previewGridCols < ADMIN_GRID_DIM_MAX)
  const canAddPreviewRow = (previewGridRows < ADMIN_GRID_DIM_MAX)
  const canDecDimRows =
    previewGridRows > ADMIN_GRID_DIM_MIN && !savingSymbols && !symbolsLoadPending
  const canIncDimRows =
    previewGridRows < ADMIN_GRID_DIM_MAX && !savingSymbols && !symbolsLoadPending
  const canDecDimCols =
    previewGridCols > ADMIN_GRID_DIM_MIN && !savingSymbols && !symbolsLoadPending
  const canIncDimCols =
    previewGridCols < ADMIN_GRID_DIM_MAX && !savingSymbols && !symbolsLoadPending
  const dimStepperBtnClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-35'

  const blockProfileHeaderActions =
    !adminHydrated || !selectedProfileId || loadingData || symbolsLoadPending
  const blockGridResizeChrome =
    !adminHydrated ||
    !selectedProfile ||
    isSelectedDemoProfile ||
    savingSymbols ||
    symbolsLoadPending ||
    Boolean(activeFolder)

  return (
    <div className="theme-page-shell min-h-screen min-w-0 overflow-x-hidden p-3 text-slate-900 dark:text-slate-100 sm:p-4 md:p-8">
      <div className="mx-auto min-w-0 max-w-7xl">
        <div className="mb-6 min-w-0 sm:mb-8">
          <header className="app-panel min-w-0 rounded-2xl p-4 sm:p-6">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-start lg:gap-x-6 lg:gap-y-3">
              <div className="flex min-w-0 flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center lg:col-span-1">
                <BrandLockup
                  href="/"
                  iconSize={44}
                  wordmarkWidth={156}
                  priority
                />
                <div
                  aria-hidden="true"
                  className="hidden h-12 w-px bg-slate-200/80 dark:bg-slate-700/80 sm:block"
                />
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Panel de Administración</h1>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">Personaliza el comunicador para cada tablero.</p>
                </div>
              </div>

              <Link
                href="/tablero"
                className="ui-secondary-button inline-flex w-full items-center justify-center self-center rounded-full px-4 py-2 text-sm font-medium text-[var(--app-foreground)] transition lg:col-start-2 lg:row-start-1 lg:w-[min(100%,11rem)] lg:max-w-full lg:justify-self-end"
              >
                <ArrowLeft className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Volver al tablero
              </Link>
              <button
                type="button"
                onClick={() => void handleExportBoard()}
                disabled={blockProfileHeaderActions}
                title={!selectedProfileId ? 'Selecciona un tablero' : 'Descargar copia del tablero en JSON'}
                className="ui-secondary-button inline-flex w-full items-center justify-center self-center rounded-full px-4 py-2 text-sm font-medium text-[var(--app-foreground)] transition disabled:pointer-events-none disabled:opacity-45 lg:col-start-3 lg:row-start-1 lg:w-[min(100%,11rem)] lg:max-w-full lg:justify-self-end"
              >
                <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAll()}
                disabled={
                  blockProfileHeaderActions || !hasUnsavedGridChanges || savingSymbols
                }
                title={
                  !selectedProfileId
                    ? 'Selecciona un tablero'
                    : !hasUnsavedGridChanges
                      ? 'No hay cambios (símbolos o tamaño del grid) en el tablero seleccionado'
                      : undefined
                }
                className={[
                  'relative inline-flex w-full items-center justify-center self-center overflow-visible rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-45 sm:col-span-2 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:w-[min(100%,11rem)] lg:max-w-full lg:justify-self-end',
                  gridSavePhase === 'idle'
                    ? hasUnsavedGridChanges
                      ? 'ui-primary-button shadow-sm'
                      : 'bg-slate-200 text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                    : 'bg-slate-900 text-white shadow-sm dark:bg-slate-950',
                ].join(' ')}
              >
                {gridSavePhase === 'saving' && (
                  <span
                    className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full border border-slate-600 bg-slate-800 shadow-sm"
                    aria-hidden
                  >
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-white" />
                  </span>
                )}
                {gridSavePhase === 'saved' && (
                  <span
                    className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-white shadow-sm"
                    aria-hidden
                  >
                    <Check className="h-2.5 w-2.5 text-slate-900" strokeWidth={3} />
                  </span>
                )}
                <span className="tabular-nums">
                  {gridSavePhase === 'saving'
                    ? 'Guardando…'
                    : gridSavePhase === 'saved'
                      ? 'Guardado'
                      : 'Guardar cambios'}
                </span>
              </button>
            </div>
          </header>
        </div>

        <AnimatePresence initial={false}>
          {status ? (
            <motion.div
              key="admin-status-banner"
              layout
              initial={{ opacity: 0, y: -28, scale: 0.94, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                y: -14,
                scale: 0.97,
                filter: 'blur(4px)',
                transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.72 }}
              className="mb-6 flex origin-top items-start gap-3 overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/90 p-3 pl-4 text-sm font-medium text-emerald-800 shadow-[0_12px_40px_-18px_rgba(16,185,129,0.35)] dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:shadow-[0_14px_44px_-16px_rgba(16,185,129,0.25)] sm:items-center sm:p-4"
            >
              <motion.p
                className="min-w-0 flex-1 leading-relaxed"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {status}
              </motion.p>
              <motion.button
                type="button"
                onClick={() => setStatus('')}
                className="ui-icon-button -mr-1 -mt-0.5 shrink-0 rounded-lg p-1.5 text-emerald-700/80 hover:bg-emerald-700/10 hover:text-emerald-900 dark:text-emerald-200/90 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-100"
                aria-label="Cerrar aviso"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="min-w-0 space-y-6 lg:col-span-1">
              <div className="app-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <User size={16} /> Tableros
                    {loadingData ? (
                      <span
                        className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-800 dark:border-t-indigo-300"
                        aria-hidden
                      />
                    ) : null}
                  </h2>
                  <button
                    onClick={() => setShowCreateProfileModal(true)}
                    className="ui-soft-badge inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:brightness-105"
                    type="button"
                  >
                    <Plus size={14} />
                    Crear
                  </button>
                </div>
                <div className="space-y-2">
                  {profiles.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-2xl p-2 transition"
                      style={{
                        background: selectedProfileId === p.id ? 'var(--app-predicted)' : 'var(--app-surface-muted)',
                        boxShadow: selectedProfileId === p.id ? '0 0 0 1px var(--app-predicted-border)' : 'none',
                      }}
                    >
                      <button
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm font-semibold ${selectedProfileId === p.id ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}
                        type="button"
                      >
                        {p.name}
                      </button>
                      <button
                        onClick={() => void handleSetDefaultProfile(p)}
                        disabled={Boolean(p.isOpeningProfile) || Boolean(settingDefaultProfileId)}
                        className={`ui-icon-button inline-flex h-8 w-8 items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-50 ${
                          p.isOpeningProfile
                            ? 'text-indigo-600 dark:text-indigo-300'
                            : 'text-slate-500 dark:text-slate-300'
                        }`}
                        type="button"
                        aria-label={
                          p.isOpeningProfile
                            ? `Tablero seleccionado al abrir el tablero: ${p.name}`
                            : `Establecer ${p.name} como tablero al abrir el tablero`
                        }
                        title={
                          p.isOpeningProfile
                            ? 'Este tablero se abre al entrar al tablero'
                            : 'Usar este tablero al abrir el tablero'
                        }
                      >
                        {settingDefaultProfileId === p.id ? (
                          <Loader2 size={14} className="animate-spin" aria-hidden />
                        ) : (
                          <Eye size={14} aria-hidden />
                        )}
                      </button>
                      <button
                        onClick={() => openEditProfileModal(p)}
                        className="ui-icon-button inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 dark:text-slate-300"
                        type="button"
                        aria-label={`Editar tablero ${p.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(p)}
                        disabled={p.isDemo || deletingProfileId === p.id}
                        className="ui-icon-button inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"
                        type="button"
                        aria-label={`Eliminar tablero ${p.name}`}
                        title={p.isDemo ? 'El tablero demo fijo no se puede eliminar' : 'Eliminar tablero'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 border-t border-slate-200/80 pt-2 dark:border-slate-700/80">
                  <div
                    className="flex items-center gap-2 rounded-2xl p-2 transition"
                    style={{ background: 'var(--app-surface-muted)' }}
                  >
                    <Keyboard className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                    <span className="min-w-0 flex-1 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Teclado
                    </span>
                    <button
                      type="button"
                      onClick={() => setKeyboardThemeModalOpen(true)}
                      disabled={!selectedProfileId}
                      className="ui-icon-button inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-300"
                      aria-label="Editar colores del teclado"
                      title={
                        selectedProfileId
                          ? 'Colores del teclado en el tablero'
                          : 'Selecciona un tablero'
                      }
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                  </div>
                </div>

                {isSelectedDemoProfile ? (
                  <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-700/80">
                    <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Tablero de demostración fijo: si las celdas se descolocan, restablece la plantilla.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleRepairDemoLayout()}
                      disabled={repairingDemoLayout || savingSymbols || symbolsLoadPending || Boolean(activeFolder)}
                      className="ui-secondary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50"
                    >
                      {repairingDemoLayout ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                      Restaurar plantilla demo
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="app-panel rounded-2xl p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--app-muted-foreground)]">
                  <Settings size={16} /> Configuración
                </h2>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowAccountSettingsModal(true)}
                    className="ui-secondary-button flex w-full rounded-2xl px-4 py-3 text-left transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--app-foreground)]">Configuración de la cuenta</p>
                      <p className="mt-1 text-xs text-[var(--app-muted-foreground)]">
                        Nombre, correo, contraseña, suscripción, tema y tipografía.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLumaGridSettingsModal(true)}
                    className="ui-secondary-button flex w-full rounded-2xl px-4 py-3 text-left transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--app-foreground)]">Configuración de Luma Grid</p>
                      <p className="mt-1 text-xs text-[var(--app-muted-foreground)]">
                        Personaliza la voz y el género de tus tableros.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {selectedProfile && !isSelectedDemoProfile && (
                <div className="app-panel rounded-2xl p-5">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dimensiones</h2>
                  <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                    Ajusta filas y columnas y pulsa <span className="font-semibold text-slate-600 dark:text-slate-300">Guardar cambios</span> arriba para aplicarlas en el servidor.
                  </p>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-zinc-950 text-white shadow-inner dark:border-slate-700/90">
                    <div className="border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Tamaño del grid
                    </div>
                    <div className="divide-y divide-white/10">
                      <div className="flex items-stretch gap-2 px-1 py-1 sm:px-2">
                        <span className="flex w-20 shrink-0 items-center pl-2 text-xs font-medium text-slate-400">Filas</span>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 py-2 pr-1">
                          <button
                            type="button"
                            aria-label="Restar una fila"
                            title="Restar una fila"
                            disabled={!canDecDimRows}
                            className={dimStepperBtnClass}
                            onClick={() => void handleGridSizeUpdate(previewGridRows - 1, previewGridCols)}
                          >
                            <Minus size={18} strokeWidth={2.25} />
                          </button>
                          <span className="min-w-[2.5ch] text-center text-lg font-semibold tabular-nums tracking-tight">{previewGridRows}</span>
                          <button
                            type="button"
                            aria-label="Sumar una fila"
                            title="Sumar una fila"
                            disabled={!canIncDimRows}
                            className={dimStepperBtnClass}
                            onClick={() => void handleGridSizeUpdate(previewGridRows + 1, previewGridCols)}
                          >
                            <Plus size={18} strokeWidth={2.25} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-stretch gap-2 px-1 py-1 sm:px-2">
                        <span className="flex w-20 shrink-0 items-center pl-2 text-xs font-medium text-slate-400">Columnas</span>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 py-2 pr-1">
                          <button
                            type="button"
                            aria-label="Restar una columna"
                            title="Restar una columna"
                            disabled={!canDecDimCols}
                            className={dimStepperBtnClass}
                            onClick={() => void handleGridSizeUpdate(previewGridRows, previewGridCols - 1)}
                          >
                            <Minus size={18} strokeWidth={2.25} />
                          </button>
                          <span className="min-w-[2.5ch] text-center text-lg font-semibold tabular-nums tracking-tight">{previewGridCols}</span>
                          <button
                            type="button"
                            aria-label="Sumar una columna"
                            title="Sumar una columna"
                            disabled={!canIncDimCols}
                            className={dimStepperBtnClass}
                            onClick={() => void handleGridSizeUpdate(previewGridRows, previewGridCols + 1)}
                          >
                            <Plus size={18} strokeWidth={2.25} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="app-panel rounded-2xl p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Léxico
                </h2>
                {!selectedProfileId ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona un tablero para ver el estado del léxico.</p>
                ) : lexiconObservabilityLoading ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cargando…</p>
                ) : !lexiconObservability?.coverage ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sin datos de cobertura.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5">
                      <div>
                        <span className="text-[var(--app-muted-foreground)]">Cobertura resuelta</span>
                        <span className="ml-1.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                          {Math.round(lexiconObservability.coverage.coverageRatio * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--app-muted-foreground)]">Pendientes de revisión</span>
                        <span className="ml-1.5 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                          {lexiconObservability.coverage.reviewNeededCount}
                        </span>
                      </div>
                    </div>
                    {lexiconObservability.coverage.reviewItems.length > 0 ? (
                      <div className="border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
                        <p className="mb-2 text-[11px] font-medium text-[var(--app-muted-foreground)]">
                          Primeros símbolos a revisar
                          {lexiconObservability.coverage.reviewNeededCount > lexiconObservability.coverage.reviewItems.length ? (
                            <span className="font-normal text-[var(--app-muted-foreground)]">
                              {' '}
                              (muestra de {lexiconObservability.coverage.reviewItems.length} de {lexiconObservability.coverage.reviewNeededCount})
                            </span>
                          ) : null}
                        </p>
                        <ul className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200/60 bg-white/40 p-2 dark:border-slate-600/60 dark:bg-slate-900/35">
                          {lexiconObservability.coverage.reviewItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex flex-col gap-2 border-b border-slate-100/90 pb-2 text-[11px] leading-snug last:border-b-0 last:pb-0 dark:border-slate-700/50 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-2 sm:gap-y-0.5 sm:pb-1.5"
                            >
                              <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">&ldquo;{item.label}&rdquo;</span>
                                <span className="rounded bg-amber-100/90 px-1 py-0 text-[10px] font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                                  {COVERAGE_REVIEW_REASON_LABEL[item.reason]}
                                </span>
                                {item.suggestedLemma ? (
                                  <span className="text-[var(--app-muted-foreground)]">
                                    Sugerido: <span className="font-medium text-slate-700 dark:text-slate-300">{item.suggestedLemma}</span>
                                    {' '}
                                    ({getSpanishPosLabel(item.suggestedPosType)})
                                  </span>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => openSymbolReviewFromCoverageItem(item.id)}
                                className="ui-secondary-button shrink-0 self-start rounded-lg px-2.5 py-1 text-[10px] font-semibold sm:self-baseline"
                              >
                                Revisar
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="app-panel rounded-2xl p-5">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vista</h2>
                <div className="ui-floating-panel flex overflow-hidden rounded-2xl p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${viewMode === 'grid' ? 'ui-secondary-button text-indigo-600 shadow-sm dark:text-indigo-300' : 'text-slate-600 hover:bg-[var(--app-hover)] dark:text-slate-300'
                      }`}
                  >
                    <LayoutGrid size={16} /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${viewMode === 'table' ? 'ui-secondary-button text-indigo-600 shadow-sm dark:text-indigo-300' : 'text-slate-600 hover:bg-[var(--app-hover)] dark:text-slate-300'
                      }`}
                  >
                    <List size={16} /> Lista
                  </button>
                </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="min-w-0 lg:col-span-3">
              {viewMode === 'grid' ? (
                <div className="app-panel min-w-0 overflow-hidden rounded-2xl p-4 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {activeFolderTitle ? `Editando carpeta: ${activeFolderTitle}` : 'Vista Previa del Grid'}
                        </h2>
                        {activeFolder ? (
                          <button
                            type="button"
                            onClick={() => setActiveFolder(null)}
                            className="mt-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                          >
                            &larr; Volver al grid principal
                          </button>
                        ) : null}
                      </div>
                      {!symbolsLoadPending && isSelectedDemoProfile && !activeFolder ? (
                        <button
                          type="button"
                          onClick={() => void handleRepairDemoLayout()}
                          disabled={repairingDemoLayout || savingSymbols}
                          className="ui-secondary-button inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold sm:w-auto disabled:pointer-events-none disabled:opacity-50"
                          title="Corrige el tablero si las celdas quedaron descolocadas tras editar o arrastrar"
                        >
                          {repairingDemoLayout ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          ) : (
                            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
                          )}
                          Restaurar plantilla demo
                        </button>
                      ) : null}
                    </div>

                    {!symbolsLoadPending && isSelectedDemoProfile && !activeFolder ? (
                      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-slate-600/60 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:gap-3">
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Editar contenido
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                          <label htmlFor="admin-demo-folder-picker" className="sr-only">
                            Elegir carpeta del tablero demo para editar su contenido
                          </label>
                          <select
                            id="admin-demo-folder-picker"
                            key={`${selectedProfileId}-demo-folder`}
                            defaultValue=""
                            className="app-input min-h-[44px] min-w-0 max-w-full flex-1 rounded-xl py-2 pl-3 pr-10 text-sm"
                            onChange={(e) => {
                              const v = e.target.value
                              if (v) setActiveFolder(v)
                            }}
                          >
                            <option value="">Carpeta del tablero demo…</option>
                            {demoFolderNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <DndContext
                    sensors={sensors}
                    modifiers={[snapTopLeftToCursor]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid w-full max-w-full grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:grid-rows-[auto_auto]">
                      <div className="min-w-0 overflow-x-auto overflow-y-visible rounded-[1.8rem] pb-1 md:col-start-1 md:row-start-1">
                      <div
                        className={`aac-grid-surface grid w-max max-w-none content-start gap-4 p-4 sm:p-6 ${symbolsLoadPending ? 'pointer-events-none' : ''}`}
                        style={{
                          gridTemplateColumns: `repeat(${previewGridCols}, ${ADMIN_PREVIEW_CELL_COL_WIDTH})`,
                          gridAutoRows: 'auto',
                        }}
                      >
                      {Array.from({ length: previewGridCols * previewGridRows }).map((_, index) => {
                        const gridCols = previewGridCols
                        const x = index % gridCols
                        const y = Math.floor(index / gridCols)

                        if (symbolsLoadPending) {
                          return (
                            <div
                              key={`sk-${x}-${y}`}
                              className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-300/50 bg-gradient-to-br from-slate-200/50 via-slate-200/30 to-slate-300/40 animate-pulse dark:border-slate-600/55 dark:from-slate-700/50 dark:via-slate-800/35 dark:to-slate-700/45"
                              style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                              aria-hidden
                            />
                          )
                        }

                        const symbol = mainGridSymbols.find((s) => (s.positionX === x && s.positionY === y) || (s.position_x === x && s.position_y === y))

                        if (symbol) {
                          const gridCellImageSrc = symbolImageDisplayUrl(symbol)
                          return (
                            <DroppableGridCell
                              key={`cell-${x}-${y}`}
                              cellId={`cell-${x}-${y}`}
                              className="flex min-h-0 min-w-0 w-full"
                              style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                            >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative flex aspect-video w-full min-h-0 min-w-0 flex-col overflow-visible"
                              >
                                <DraggableGridItem symbol={symbol}>
                                  <button
                                    onClick={() => setEditingSymbol({
                                      ...symbol,
                                      color: normalizeSymbolColor(symbol.color),
                                      positionX: x,
                                      positionY: y,
                                      state: symbol.state || 'visible'
                                    })}
                                    type="button"
                                    className={`symbol-cell relative flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center rounded-xl border border-solid p-1.5 transition ${symbol.state === 'locked' ? 'opacity-50 grayscale' : ''} ${symbol.state === 'hidden' ? 'opacity-20 striping-bg' : ''}`}
                                    style={{
                                      backgroundColor: resolveSymbolColor(symbol.color),
                                      borderColor: 'var(--app-border)',
                                      color: getSymbolTextColor(symbol.color),
                                    }}
                                  >
                                    {shouldShowFolderBadge(symbol as BoardSymbol) ? (
                                      <span
                                        className="ui-chip pointer-events-none absolute right-1.5 top-1.5 z-[1] rounded-lg p-1"
                                        style={{ color: getSymbolTextColor(symbol.color) }}
                                        aria-hidden
                                      >
                                        <Folder size={12} strokeWidth={2} />
                                      </span>
                                    ) : null}
                                    <div className="text-xl mb-1">
                                      {gridCellImageSrc ? (
                                        <img src={gridCellImageSrc} alt={symbol.label} className="h-8 w-8 object-contain" />
                                      ) : (
                                        symbol.emoji || '❓'
                                      )}
                                    </div>
                                    <span className="text-center text-[10px] font-bold leading-tight line-clamp-1">
                                      {symbol.label}
                                    </span>
                                    {symbolHasVariantMenu(adminEditToMenuConfig(symbol.wordVariants)) && (
                                      <span
                                        className="ui-chip pointer-events-none absolute bottom-1.5 right-1.5 z-[1] rounded-lg p-1"
                                        style={{ color: getSymbolTextColor(symbol.color) }}
                                        title="Tiene variantes de palabra"
                                        aria-hidden
                                      >
                                        <Layers size={12} strokeWidth={2} />
                                      </span>
                                    )}
                                  </button>
                                </DraggableGridItem>
                                {isMovableSymbol(symbol) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteSymbol(symbol.id)
                                    }}
                                    type="button"
                                    className="absolute right-1 top-1 z-10 hidden h-5 w-5 place-items-center rounded-full bg-rose-500 text-white shadow-sm group-hover:grid"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </motion.div>
                            </DroppableGridCell>
                          )
                        }

                        const isSplitHere = splitEmptyCell?.x === x && splitEmptyCell?.y === y

                        return (
                          <DroppableGridCell
                            key={`cell-${x}-${y}`}
                            cellId={`cell-${x}-${y}`}
                            className="flex min-h-0 min-w-0 w-full"
                            style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                          >
                            {isSplitHere ? (
                              <div
                                className="flex aspect-video w-full min-w-0 overflow-hidden rounded-xl border-2 border-dashed border-slate-500/50 bg-slate-900/35 dark:border-slate-500/60 dark:bg-slate-950/45"
                                role="group"
                                aria-label="Crear contenido en celda vacía"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSymbol({
                                      id: `draft-${Date.now()}`,
                                      ...EMPTY_SYMBOL,
                                      gridId:
                                        !shouldUseDefaultGridTemplate && activeFolder ? activeFolder : 'main',
                                      positionX: x,
                                      positionY: y,
                                    })
                                    setSplitEmptyCell(null)
                                  }}
                                  className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-1 border-r border-slate-500/40 px-1 py-1.5 text-slate-100 transition hover:bg-white/10 dark:border-slate-500/50 dark:text-slate-100"
                                >
                                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 border-slate-200/90 bg-transparent dark:border-white/40">
                                    <Plus size={14} strokeWidth={2.5} className="text-white dark:text-white" aria-hidden />
                                  </span>
                                  <span className="text-center text-[8px] font-bold uppercase leading-tight tracking-tight text-white/95 sm:text-[9px]">
                                    CREAR BOTÓN
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openCreateFolderModal(x, y)}
                                  disabled={isSelectedDemoProfile}
                                  className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-100"
                                  title={isSelectedDemoProfile ? 'No disponible en el tablero demo' : undefined}
                                >
                                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 border-slate-200/90 bg-transparent dark:border-white/40">
                                    <FolderOpen size={15} strokeWidth={2.25} className="text-white dark:text-white" aria-hidden />
                                  </span>
                                  <span className="text-center text-[8px] font-bold uppercase leading-tight tracking-tight text-white/95 sm:text-[9px]">
                                    CREAR CARPETA
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSplitEmptyCell({ x, y })}
                                type="button"
                                className="group flex aspect-video w-full min-w-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-500/50 bg-slate-900/35 transition hover:border-indigo-400/70 hover:bg-indigo-500/10 dark:border-slate-500/60 dark:bg-slate-950/45 dark:hover:border-indigo-400/60 dark:hover:bg-indigo-500/15"
                                aria-label="Añadir en celda vacía"
                              >
                                <Plus size={16} strokeWidth={2} className="text-slate-400 transition group-hover:text-indigo-400 dark:text-slate-500" />
                              </button>
                            )}
                          </DroppableGridCell>
                        )
                      })}
                      </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleGridSizeUpdate(previewGridRows, previewGridCols + 1)}
                        disabled={blockGridResizeChrome || !canAddPreviewColumn}
                        title={
                          symbolsLoadPending
                            ? 'Cargando tablero…'
                            : !canAddPreviewColumn
                              ? 'Máximo 20 columnas'
                              : activeFolder
                                ? 'Sal de la carpeta para cambiar el tamaño del tablero'
                                : 'Añadir una columna a la derecha'
                        }
                        className="flex min-h-[10rem] w-full flex-row items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-400/45 bg-indigo-500/[0.08] px-4 py-3 text-sm font-bold text-indigo-800 transition hover:border-indigo-500/70 hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-40 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200 md:col-start-2 md:row-start-1 md:min-h-0 md:w-14 md:max-w-[4.5rem] md:flex-col md:justify-center md:gap-2 md:self-stretch md:px-2 md:py-6 md:text-xs"
                      >
                        <Columns2 className="h-7 w-7 shrink-0 md:h-8 md:w-8" aria-hidden />
                        <span className="max-w-[10rem] text-center leading-tight md:max-w-none md:[writing-mode:vertical-rl] md:rotate-180">
                          Añadir columna
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleGridSizeUpdate(previewGridRows + 1, previewGridCols)}
                        disabled={blockGridResizeChrome || !canAddPreviewRow}
                        title={
                          symbolsLoadPending
                            ? 'Cargando tablero…'
                            : !canAddPreviewRow
                              ? 'Máximo 20 filas'
                              : activeFolder
                                ? 'Sal de la carpeta para cambiar el tamaño del tablero'
                                : 'Añadir una fila abajo'
                        }
                        className="col-span-1 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-400/45 bg-indigo-500/[0.08] px-4 py-4 text-sm font-bold text-indigo-800 transition hover:border-indigo-500/70 hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-40 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200 md:col-span-2 md:col-start-1 md:row-start-2 md:py-5"
                      >
                        <Rows className="h-7 w-7 shrink-0" aria-hidden />
                        <span>Añadir fila</span>
                      </button>
                    </div>

                    <DragOverlay>
                      {activeDraggedSymbol
                        ? (() => {
                            const sym = activeDraggedSymbol
                            const dragImgSrc = symbolImageDisplayUrl(sym)
                            return (
                              <div
                                className="ui-floating-panel flex h-20 w-20 flex-col items-center justify-center rounded-[1.35rem] p-1"
                                style={{
                                  backgroundColor: resolveSymbolColor(sym.color),
                                  color: getSymbolTextColor(sym.color),
                                }}
                              >
                                <div className="text-xl mb-1">
                                  {dragImgSrc ? (
                                    <img src={dragImgSrc} alt={sym.label} className="h-8 w-8 object-contain" />
                                  ) : (
                                    sym.emoji || '❓'
                                  )}
                                </div>
                                <span className="text-center text-[10px] font-bold leading-tight line-clamp-1">
                                  {sym.label}
                                </span>
                              </div>
                            )
                          })()
                        : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              ) : (
                <div className="app-panel min-w-0 overflow-hidden rounded-2xl">
                  <div className="border-b border-[var(--app-border)] px-6 py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Vista de Lista</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Edita y revisa los símbolos del tablero en formato tabla.
                        </p>
                        {activeFolder && (
                          <button
                            onClick={() => setActiveFolder(null)}
                            className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                            type="button"
                          >
                            &larr; Volver al grid principal
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ui-chip rounded-full px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {symbolsLoadPending ? '…' : `${listSymbols.length} símbolo${listSymbols.length === 1 ? '' : 's'}`}
                        </span>
                        <button
                          type="button"
                          onClick={handleCreateSymbolFromList}
                          disabled={symbolsLoadPending}
                          className="ui-primary-button inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-45"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir símbolo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 border-b border-[var(--app-border)] px-6 py-4 md:grid-cols-[minmax(0,1fr)_220px]">
                    <input
                      type="text"
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="Buscar por etiqueta, categoría, tipo o emoji..."
                      className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                    />

                    <select
                      value={listStateFilter}
                      onChange={(e) => setListStateFilter(e.target.value as 'all' | 'visible' | 'locked' | 'hidden')}
                      className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="visible">Visible</option>
                      <option value="locked">Bloqueado</option>
                      <option value="hidden">Oculto</option>
                    </select>
                  </div>

                  {symbolsLoadPending ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16">
                      <div
                        className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-800 dark:border-t-indigo-300"
                        aria-hidden
                      />
                      <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Cargando símbolos del tablero…</p>
                    </div>
                  ) : listSymbols.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                        No hay símbolos que coincidan con los filtros actuales.
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Ajusta la búsqueda, cambia el filtro de estado o crea un símbolo nuevo.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-[var(--app-surface-muted)]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Símbolo</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Categoría</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Posición</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {listSymbols.map((symbol) => {
                            const position = getSymbolPosition(symbol)
                            return (
                              <tr key={`row-${symbol.id}`} className="bg-[color-mix(in_srgb,var(--app-surface-elevated)_55%,transparent)]">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="ui-floating-panel grid h-11 w-11 place-items-center rounded-2xl text-lg"
                                      style={{ backgroundColor: resolveSymbolColor(symbol.color) }}
                                    >
                                      {symbolImageDisplayUrl(symbol) ? '🖼️' : symbol.emoji || '❓'}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 dark:text-slate-100">{symbol.label || 'Sin etiqueta'}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{getSpanishPosLabel(symbol.posType)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{symbol.category || 'General'}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    symbol.state === 'hidden'
                                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                      : symbol.state === 'locked'
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                                  }`}>
                                    {symbol.state || 'visible'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{position.x + 1}, {position.y + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSymbol({
                                        ...symbol,
                                        color: normalizeSymbolColor(symbol.color),
                                        positionX: position.x,
                                        positionY: position.y,
                                        state: symbol.state || 'visible',
                                      })}
                                      className="ui-secondary-button inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-semibold text-slate-700 transition dark:text-slate-200"
                                    >
                                      Editar
                                    </button>
                                    {isMovableSymbol(symbol) && (
                                      <button
                                        type="button"
                                        onClick={() => deleteSymbol(symbol.id)}
                                        className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                                      >
                                        Eliminar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      </div>

      <AnimatePresence>
        {showAccountSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => {
                if (!savingAccountSettings) {
                  closeAccountSettingsModal()
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="ui-modal-panel relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] sm:max-h-[min(92dvh,920px)] sm:rounded-[2rem]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200/70 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuración de la cuenta</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Gestiona tus datos, la suscripción y la preferencia visual.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAccountSettingsModal}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  disabled={savingAccountSettings}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                data-settings-modal="account"
                onSubmit={handleSaveAccountSettings}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 sm:p-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2 flex flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Suscripción</p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Plan actual:{' '}
                        <span className="text-indigo-600 dark:text-indigo-400">
                          Plan {subscriptionPlanLabel(voicePlan)}
                        </span>
                        {voiceSubscriptionActive ? (
                          <span className="ml-2 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Activo
                          </span>
                        ) : voicePlan !== 'free' ? (
                          <span className="ml-2 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                            Sin pago activo
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {complimentaryUnlimited
                          ? 'Tienes acceso completo a Identidad por cortesía. No necesitas gestionar facturación aquí.'
                          : voicePlan === 'free'
                            ? (
                              <>
                                {accountEmail ? (
                                  <span className="block font-medium text-slate-700 dark:text-slate-300">
                                    Correo en plan Libre:{' '}
                                    <span className="font-mono text-slate-900 dark:text-slate-100">{accountEmail}</span>
                                  </span>
                                ) : (
                                  <span className="block font-medium text-slate-700 dark:text-slate-300">Tu cuenta está en el plan Libre.</span>
                                )}
                                <span className="mt-1 block">
                                  Activa un plan de pago o continúa con el plan Libre. Puedes revisar opciones en /plan.
                                </span>
                              </>
                            )
                            : stripeCustomerId
                              ? 'Cambia de plan, método de pago o consulta facturas en el portal de Stripe.'
                              : 'Completa el pago o elige un plan desde el selector para activar las prestaciones.'}
                      </p>
                    </div>
                    {complimentaryUnlimited ? (
                      <p className="shrink-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        ¡Disfruta sin límites!
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={subscriptionPortalBusy}
                        onClick={() => handleSubscriptionClick()}
                        className="shrink-0 rounded-2xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
                      >
                        {subscriptionPortalBusy
                          ? 'Abriendo…'
                          : voicePlan === 'voice' || voicePlan === 'identity'
                            ? 'Gestionar suscripción'
                            : 'Actualizar plan'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <Mail size={14} /> Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="tu@email.com"
                      />
                    </div>

                    {accountSettings?.hasLocalPassword ? (
                      !showChangePasswordFields ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setShowChangePasswordFields(true)}
                            className="ui-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition dark:text-slate-200"
                          >
                            <LockKeyhole size={14} />
                            Cambiar contraseña
                          </button>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Solo se mostrará el formulario de contraseña cuando quieras modificarla.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                              <LockKeyhole size={14} />
                              Cambiar contraseña
                            </p>
                            <button
                              type="button"
                              onClick={resetPasswordFields}
                              className="text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              Cancelar cambio
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña actual</label>
                            <input
                              type="password"
                              value={accountCurrentPassword}
                              onChange={(e) => setAccountCurrentPassword(e.target.value)}
                              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                              placeholder="Tu contraseña actual"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nueva contraseña</label>
                            <input
                              type="password"
                              value={accountNewPassword}
                              onChange={(e) => setAccountNewPassword(e.target.value)}
                              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                              placeholder="Mínimo 8 caracteres"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Confirmar nueva contraseña</label>
                            <input
                              type="password"
                              value={accountConfirmPassword}
                              onChange={(e) => setAccountConfirmPassword(e.target.value)}
                              className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                              placeholder="Repite la nueva contraseña"
                            />
                          </div>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tu cuenta usa solo inicio de sesión con Google; no hay contraseña local que gestionar aquí.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => void signOut({ callbackUrl: '/' })}
                      className="dyslexia-comfort-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:w-auto"
                    >
                      <LogOut size={16} aria-hidden />
                      Cerrar sesión
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</label>
                      <div className="dyslexia-settings-option-grid dyslexia-theme-options grid gap-2 sm:grid-cols-3">
                        {THEME_OPTIONS.map((option) => {
                          const Icon = option.icon
                          const isActive = accountPreferredTheme === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setAccountPreferredTheme(option.value)}
                              className={`rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                              style={{ borderColor: isActive ? 'var(--app-predicted-border)' : undefined }}
                            >
                              <div className="flex items-center gap-2">
                                <Icon size={16} />
                                <span className="text-sm font-semibold">{option.label}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">La preferencia se guarda en tu cuenta y se aplica en toda la app.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Tipografía adaptada a dislexia
                      </label>
                      <div className="dyslexia-settings-option-grid grid gap-2 sm:grid-cols-2">
                        {DYSLEXIA_FONT_OPTIONS.map((option) => {
                          const isActive = accountPreferredDyslexiaFont === option.value
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => setAccountPreferredDyslexiaFont(option.value)}
                              className={`rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                              style={{ borderColor: isActive ? 'var(--app-predicted-border)' : undefined }}
                            >
                              <div className="text-sm font-semibold">
                                {option.value ? (
                                  <span className="font-dyslexia-preview">Activado</span>
                                ) : (
                                  'Desactivado'
                                )}
                              </div>
                              <p className={`mt-1 text-xs ${option.value ? 'font-dyslexia-preview' : ''}`}>
                                {option.value ? 'Usar OpenDyslexic en toda la interfaz.' : 'Mantener la tipografía actual de Luma Grid.'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Por defecto está desactivada. Si la activas, la app completa utilizará OpenDyslexic.
                      </p>
                    </div>

                  </div>
                </div>

                <div className="mt-6 flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--app-border)] pt-6 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={closeAccountSettingsModal}
                    className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:w-auto dark:text-slate-300"
                    disabled={savingAccountSettings}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAccountSettings || !accountSettings}
                    className="ui-primary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-70 sm:w-auto"
                  >
                    {savingAccountSettings ? 'Guardando...' : 'Guardar configuración'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLumaGridSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => {
                if (!savingAccountSettings) {
                  closeLumaGridSettingsModal()
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="ui-modal-panel relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] sm:max-h-[min(92dvh,920px)] sm:rounded-[2rem]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200/70 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuración de Luma Grid</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Personaliza la voz y el género de tus tableros.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeLumaGridSettingsModal}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  disabled={savingAccountSettings}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                data-settings-modal="luma"
                onSubmit={handleSaveAccountSettings}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 sm:p-6"
              >
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Género de comunicación</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountGender('male')}
                        className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${accountGender === 'male' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                        style={{ borderColor: accountGender === 'male' ? 'var(--app-predicted-border)' : undefined }}
                      >
                        Masculino
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountGender('female')}
                        className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${accountGender === 'female' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                        style={{ borderColor: accountGender === 'female' ? 'var(--app-predicted-border)' : undefined }}
                      >
                        Femenino
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Se aplica al tablero seleccionado{selectedProfile ? `: ${selectedProfile.name}` : ''}.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <Volume2 size={16} className="shrink-0" />
                      Voz (texto a voz)
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {!voiceSubscriptionActive ? (
                        <span className="font-medium text-amber-800 dark:text-amber-200">
                          Sin suscripción activa: solo se usa la voz del navegador hasta que tengas un plan de pago vigente.
                        </span>
                      ) : (
                        <>
                          Plan {subscriptionPlanLabel(voicePlan)} · Uso ElevenLabs este mes:{' '}
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                            {voiceCharsUsed.toLocaleString('es-ES')} / {voiceMonthlyLimit.toLocaleString('es-ES')} caracteres
                          </span>
                          {voiceTtsMode === 'browser' ? ' (solo cuenta al usar voces ElevenLabs).' : null}
                        </>
                      )}
                    </p>

                    {voiceSubscriptionActive && voiceTtsQuotaExceeded ? (
                      <div
                        role="status"
                        className="rounded-xl border border-amber-300/90 bg-amber-50/95 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
                      >
                        <p className="font-medium">Has superado la referencia mensual de caracteres de voz de tu plan.</p>
                        <p className="mt-1.5 text-amber-900/90 dark:text-amber-200/95">
                          Considera ampliar el plan en{' '}
                          <Link href="/plan" className="font-semibold underline underline-offset-2">
                            Planes y precios
                          </Link>
                          . Si el uso de ElevenLabs queda limitado, se puede pasar a voz del navegador; el contador sigue registrando el consumo.
                        </p>
                      </div>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setVoiceTtsMode('browser')}
                        className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${voiceTtsMode === 'browser' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                        style={{ borderColor: voiceTtsMode === 'browser' ? 'var(--app-predicted-border)' : undefined }}
                      >
                        Voz del sistema
                        <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">Gratis, sin límite en el navegador</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!canUsePresetVoices) {
                            setShowVoicePlanRequiredModal(true)
                            return
                          }
                          setVoiceTtsMode('preset')
                        }}
                        className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${voiceTtsMode === 'preset' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                        style={{ borderColor: voiceTtsMode === 'preset' ? 'var(--app-predicted-border)' : undefined }}
                      >
                        Voces naturales
                        <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">ElevenLabs (presets)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!canUseCustomVoice) {
                            setShowVoicePlanRequiredModal(true)
                            return
                          }
                          openCustomVoiceMode()
                        }}
                        className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${voiceTtsMode === 'custom' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                        style={{ borderColor: voiceTtsMode === 'custom' ? 'var(--app-predicted-border)' : undefined }}
                      >
                        Crear mi voz
                        <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                          {voicePlan === 'identity' ? 'Plan Identidad · clonación' : 'Requiere plan Identidad'}
                        </span>
                      </button>
                    </div>

                    {voiceTtsMode === 'preset' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Voces naturales
                          </label>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Se muestran las 5 voces según el género de comunicación del tablero (
                            {accountGender === 'male' ? 'masculino' : 'femenino'}). Pulsa play para escuchar la
                            muestra generada una sola vez y guardada en el servidor.
                          </p>
                        </div>
                        {voicePreviewBusy ? (
                          <p className="text-xs text-slate-600 dark:text-slate-300">Preparando muestras de audio…</p>
                        ) : null}
                        {voicePreviewError ? (
                          <p className="text-xs text-red-600 dark:text-red-400">{voicePreviewError}</p>
                        ) : null}
                        <div className="flex flex-col gap-2">
                          {(accountGender === 'male' ? maleVoices : femaleVoices).map((v) => {
                            const selected = voicePresetElevenId === v.voiceId
                            const playing = previewPlayingVoiceId === v.voiceId
                            return (
                              <div
                                key={v.voiceId}
                                className="flex items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2 pl-3"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setVoicePresetElevenId(v.voiceId)
                                  }}
                                  className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                                    selected
                                      ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-100'
                                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80'
                                  }`}
                                >
                                  {v.name}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    void playPresetPreview(v.voiceId)
                                  }}
                                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${
                                    playing
                                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/20 dark:text-indigo-100'
                                      : 'border-[var(--app-border)] text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                  } disabled:opacity-50`}
                                  aria-label={`Escuchar muestra de ${v.name}`}
                                >
                                  <Play className="h-5 w-5" fill={playing ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {voiceTtsMode === 'custom' && voicePlan !== 'identity' ? (
                      <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                        <p className="font-semibold">Plan Identidad necesario</p>
                        <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-100/90">
                          La clonación de voz con ElevenLabs está incluida en el plan Identidad. Mientras tanto puedes usar «Voces naturales» (plan
                          Voz o superior) o «Voz del sistema». Si ya tienes Identidad y ves este mensaje, comprueba tu suscripción o contacta con
                          soporte.
                        </p>
                      </div>
                    ) : null}

                    {voiceTtsMode === 'custom' && voicePlan === 'identity' ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre de la voz clonada</label>
                          <input
                            type="text"
                            value={cloneVoiceName}
                            onChange={(e) => setCloneVoiceName(e.target.value)}
                            className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                            placeholder="Mi voz AAC"
                          />
                        </div>

                        {cloneRecording && cloneLiveStream ? (
                          <VoiceCloneLiveWaveform stream={cloneLiveStream} active={cloneRecording} />
                        ) : null}
                        {!cloneRecording && clonePreviewFile ? (
                          <VoiceCloneSamplePreview
                            file={clonePreviewFile}
                            onRemove={clearClonePreview}
                            disabled={voiceCloneBusy}
                          />
                        ) : null}
                        {!cloneRecording && clonePreviewFile ? (
                          <button
                            type="button"
                            disabled={voiceCloneBusy}
                            onClick={() => void submitVoiceClone(clonePreviewFile)}
                            className="ui-primary-button w-full rounded-2xl px-4 py-2.5 text-sm font-semibold"
                          >
                            {voiceCloneBusy ? 'Creando voz…' : 'Crear voz con esta muestra'}
                          </button>
                        ) : null}

                        <input
                          ref={cloneFileRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={handleVoiceCloneUpload}
                        />
                        <div className="flex flex-wrap gap-2">
                          {!cloneRecording ? (
                            <>
                              <button
                                type="button"
                                disabled={voiceCloneBusy}
                                onClick={() => void startCloneRecording()}
                                className="ui-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                              >
                                <Mic className="h-4 w-4" />
                                {voiceCloneBusy ? 'Creando voz…' : 'Grabar con el micrófono'}
                              </button>
                              <button
                                type="button"
                                disabled={voiceCloneBusy}
                                onClick={() => cloneFileRef.current?.click()}
                                className="ui-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                              >
                                <FolderOpen className="h-4 w-4" />
                                Subir archivo
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="flex min-w-[8rem] items-center gap-2 rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-200">
                                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden />
                                Grabando {recordElapsedSec}s
                              </div>
                              <button
                                type="button"
                                onClick={() => void stopCloneRecordingAndUpload()}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                              >
                                <Square className="h-4 w-4 fill-current" />
                                Detener grabación
                              </button>
                              <button
                                type="button"
                                onClick={abortCloneRecording}
                                className="ui-secondary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Grabación: mínimo 5 segundos, máximo 5 minutos. Habla en un sitio silencioso. Tras grabar o subir audio, revisa la forma
                          de onda, escucha la muestra y pulsa &quot;Crear voz con esta muestra&quot;. También puedes subir MP3/WAV. Cuando la voz
                          esté creada, pulsa &quot;Guardar cambios&quot; si cambias el modo.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--app-border)] pt-6 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={closeLumaGridSettingsModal}
                    className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:w-auto dark:text-slate-300"
                    disabled={savingAccountSettings}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAccountSettings || !accountSettings}
                    className="ui-primary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-70 sm:w-auto"
                  >
                    {savingAccountSettings ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Editing Modal */}
      <AnimatePresence>
        {editingSymbol && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => closeEditingSymbolModal()}
            />
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                layout: prefersReducedMotion
                  ? { duration: 0.2 }
                  : { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 },
              }}
              className="ui-modal-panel relative flex max-h-[100dvh] w-full max-w-full flex-col overflow-hidden rounded-t-[1.75rem] sm:max-h-[min(90dvh,880px)] sm:max-w-[min(96vw,80rem)] sm:rounded-[2rem] lg:flex-row"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
                  <h2
                    id="symbol-edit-title"
                    className="min-w-0 text-lg font-bold text-slate-800 sm:text-xl dark:text-slate-100"
                  >
                    {editingSymbol.id ? 'Editar Símbolo' : 'Nuevo Símbolo'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => closeEditingSymbolModal()}
                    className="ui-icon-button shrink-0 rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Cerrar"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Columna 1 — texto y gramática */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Etiqueta</label>
                      <input
                        type="text"
                        value={editingSymbol.label}
                        onChange={e => setEditingSymbol({
                          ...editingSymbol,
                          label: e.target.value,
                          manualGrammarOverride: false,
                          lexemeId: null,
                          posConfidence: null,
                        })}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="Ej. Comer"
                      />
                      <div className="ui-floating-panel mt-3 rounded-2xl px-4 py-3">
                        {detectingLexeme ? (
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Analizando palabra...
                          </p>
                        ) : lexemePreview ? (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                                {getSpanishPosLabel(lexemePreview.primaryPos ?? lexemePreview.symbolPosType)}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {Math.round(lexemePreview.confidence * 100)}%
                              </span>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                                {lexemePreview.method}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Lema detectado: <span className="font-semibold">{lexemePreview.detectedLemma ?? 'sin coincidencia'}</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Normalizado: {lexemePreview.normalizedLabel || 'sin texto'}
                            </p>
                            {lexemePreview.matchedForm && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Forma detectada: <span className="font-semibold">{lexemePreview.matchedForm.surface}</span>
                                {' · '}
                                {lexemePreview.matchedForm.formType}
                                {lexemePreview.matchedForm.tense ? ` · ${lexemePreview.matchedForm.tense}` : ''}
                                {lexemePreview.matchedForm.number ? ` · ${lexemePreview.matchedForm.number}` : ''}
                              </p>
                            )}
                            {lexemePreview.alternatives.length > 1 && (
                              <div className="pt-1">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Alternativas detectadas
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {lexemePreview.alternatives.slice(0, 4).map((alternative) => (
                                    <button
                                      key={`${alternative.lexemeId || alternative.lemma}-${alternative.method}`}
                                      type="button"
                                      onClick={() => applyLexemeAlternative(alternative)}
                                      className="ui-chip rounded-full px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:text-indigo-700 dark:text-slate-200 dark:hover:text-indigo-200"
                                    >
                                      {alternative.lemma} · {getSpanishPosLabel(alternative.primaryPos)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            El sistema intentará detectar automáticamente el tipo de palabra al guardar.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Categoría</label>
                      <input
                        type="text"
                        value={editingSymbol.category || ''}
                        onChange={e => setEditingSymbol({ ...editingSymbol, category: e.target.value })}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>

                    <div className="ui-floating-panel space-y-3 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Control gramatical</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Usa la detección automática o fija manualmente el tipo de palabra.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingSymbol({
                            ...editingSymbol,
                            manualGrammarOverride: !editingSymbol.manualGrammarOverride,
                            ...(editingSymbol.manualGrammarOverride
                              ? {
                                  lexemeId: null,
                                  posConfidence: null,
                                }
                              : {}),
                          })}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            editingSymbol.manualGrammarOverride
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                          }`}
                        >
                          {editingSymbol.manualGrammarOverride ? 'Manual' : 'Automático'}
                        </button>
                      </div>

                      {editingSymbol.manualGrammarOverride ? (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Tipo de palabra
                          </label>
                          <select
                            value={editingSymbol.posType || 'other'}
                            onChange={(e) => setEditingSymbol({
                              ...editingSymbol,
                              posType: e.target.value,
                              lexemeId: null,
                              posConfidence: 1,
                              manualGrammarOverride: true,
                            })}
                            className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                          >
                            {SYMBOL_POS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            El override manual tendrá prioridad sobre la detección automática al guardar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Tipo actual: <span className="font-semibold">{getSpanishPosLabel(lexemePreview?.symbolPosType ?? editingSymbol.posType ?? 'other')}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {lexemePreview
                              ? `El sistema usará el lema ${lexemePreview.detectedLemma ?? 'sin coincidencia'} y la confianza ${Math.round(lexemePreview.confidence * 100)}%.`
                              : 'Cuando haya una detección válida se aplicará automáticamente al guardar.'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ui-floating-panel space-y-2 rounded-2xl p-4">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={
                            Boolean(editingSymbol.wordVariants?.enabled) ||
                            Boolean(editingSymbol.advancedUnlockedForEdit)
                          }
                          onChange={(e) => {
                            const on = e.target.checked
                            if (!on) {
                              setEditingSymbol({
                                ...editingSymbol,
                                advancedUnlockedForEdit: false,
                                wordVariants: { ...EMPTY_WORD_VARIANTS_EDIT },
                              })
                            } else {
                              setEditingSymbol({
                                ...editingSymbol,
                                advancedUnlockedForEdit: true,
                              })
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Opciones Avanzadas
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            Al activarlo se abre el panel «Opciones avanzadas» a la derecha del editor; ahí podrás
                            configurar variantes de palabra y, más adelante, otras opciones.
                          </span>
                        </span>
                      </label>
                    </div>

                    {/* Nested Folder Action */}
                    {editingSymbol.category === 'Carpetas' && (
                      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={savingSymbols}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void (async () => {
                              const sym = editingSymbol
                              if (!sym) return
                              const sid = String(sym.id ?? '')
                              if (sid.startsWith('draft-')) {
                                setStatus(
                                  'Pulsa «Guardar en Grid» abajo para añadir la carpeta al tablero; luego podrás editar su contenido.',
                                )
                                return
                              }
                              if (sid.startsWith('new-')) {
                                if (!selectedProfileId) return
                                setSavingSymbols(true)
                                setStatus('')
                                try {
                                  await saveSymbols(selectedProfileId, symbolsRef.current)
                                  const fresh = await getProfileSymbols(selectedProfileId)
                                  const px = sym.positionX ?? sym.position_x ?? 0
                                  const py = sym.positionY ?? sym.position_y ?? 0
                                  const labelNorm = typeof sym.label === 'string' ? sym.label.trim() : ''
                                  const match = fresh.find(
                                    (s) =>
                                      s.category === 'Carpetas' &&
                                      typeof s.label === 'string' &&
                                      s.label.trim() === labelNorm &&
                                      (s.positionX ?? 0) === px &&
                                      (s.positionY ?? 0) === py,
                                  )
                                  if (!match) {
                                    setStatus(
                                      '❌ No se localizó la carpeta tras guardar. Pulsa «Guardar cambios» arriba y vuelve a intentarlo.',
                                    )
                                    return
                                  }
                                  const mappedFresh = fresh.map(adminSymbolFromBoard)
                                  setSymbols(mappedFresh)
                                  setSymbolsBaselineJson(stableGridSnapshot(mappedFresh))
                                  const folderKey = isSelectedDemoProfile ? match.label : match.id
                                  closeEditingSymbolModal()
                                  startTransition(() => {
                                    setActiveFolder(String(folderKey))
                                  })
                                  setGridSaveFeedback('idle')
                                } catch (err) {
                                  console.error(err)
                                  setStatus(
                                    '❌ No se pudo guardar la carpeta. Revisa la conexión o los límites del plan e inténtalo de nuevo.',
                                  )
                                } finally {
                                  setSavingSymbols(false)
                                }
                                return
                              }
                              const folderKey = isSelectedDemoProfile ? sym.label : sym.id
                              closeEditingSymbolModal()
                              startTransition(() => {
                                setActiveFolder(String(folderKey))
                              })
                            })()
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-100 px-4 py-3 font-semibold text-orange-700 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-500/15 dark:text-orange-200 dark:hover:bg-orange-500/25"
                        >
                          <FolderOpen size={18} /> Editar contenido de la carpeta
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Columna 2 — emoji e imagen */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Emoji / Icono texto</label>
                      <input
                        type="text"
                        value={editingSymbol.emoji || ''}
                        onChange={e => setEditingSymbol({ ...editingSymbol, emoji: e.target.value })}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="🍎"
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Selector de emoji</span>
                        <button
                          type="button"
                          onClick={() => setEditingSymbol({ ...editingSymbol, emoji: '' })}
                          className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Quitar emoji
                        </button>
                      </div>
                      <div className="ui-floating-panel mt-2 grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-2xl p-3 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setEditingSymbol({ ...editingSymbol, emoji })}
                            className={`grid h-10 w-full place-items-center rounded-lg border text-xl leading-none transition ${
                              editingSymbol.emoji === emoji
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'ui-icon-button border-transparent'
                            }`}
                            aria-label={`Seleccionar emoji ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Imagen Personalizada</label>
                      <div className="ui-floating-panel flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition hover:border-indigo-400">
                        {editingSymbol.imageUrl ? (
                          <img src={editingSymbol.imageUrl} alt="Preview" className="h-16 w-16 object-contain" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <Plus size={24} />
                          </div>
                        )}
                        <label className="ui-secondary-button cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm dark:text-indigo-300">
                          Subir imagen
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Columna 3 — color y estado en tablero */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Color de fondo</label>
                      <SymbolColorPicker
                        color={editingSymbol.color ?? DEFAULT_SYMBOL_COLOR}
                        onChange={(next) => setEditingSymbol({ ...editingSymbol, color: next })}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Estado en Tablero</label>
                      <div className="space-y-2">
                        {STATE_OPTIONS.map(opt => (
                          <label key={opt.value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${editingSymbol.state === opt.value ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : 'ui-secondary-button'}`} style={{ borderColor: editingSymbol.state === opt.value ? 'var(--app-predicted-border)' : undefined }}>
                            <input
                              type="radio"
                              name="state"
                              value={opt.value}
                              checked={editingSymbol.state === opt.value}
                              onChange={() => setEditingSymbol({ ...editingSymbol, state: opt.value })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-600/60 dark:bg-slate-900/30">
                      <input
                        type="checkbox"
                        checked={Boolean(editingSymbol.opensKeyboard)}
                        onChange={(e) =>
                          setEditingSymbol({ ...editingSymbol, opensKeyboard: e.target.checked })
                        }
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Abre el teclado al pulsar
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          En el tablero, esta celda cambia a la pestaña teclado en lugar de añadir la etiqueta a la frase.
                          Sigue aplicando también si la etiqueta es «Teclado» o «Números».
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-[var(--app-surface-muted)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 sm:p-6 dark:border-slate-800">
                {editingSymbol.id && !String(editingSymbol.id).startsWith('folder-item-') && (
                  <button
                    onClick={handleDeleteEditingSymbol}
                    type="button"
                    className="order-3 w-full rounded-2xl bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 sm:order-none sm:mr-auto sm:w-auto dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                  >
                    Eliminar símbolo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => closeEditingSymbolModal()}
                  className="ui-secondary-button order-2 w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:order-none sm:w-auto dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  className="ui-primary-button order-1 w-full rounded-2xl px-6 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:order-none sm:w-auto"
                >
                  Guardar en Grid
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {(Boolean(editingSymbol.wordVariants?.enabled) || Boolean(editingSymbol.advancedUnlockedForEdit)) && (
                <motion.aside
                  key="symbol-edit-advanced-aside"
                  role="complementary"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: 44, y: 12, scale: 0.96 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, x: 0, y: 0, scale: 1 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: 28, y: 8, scale: 0.97 }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                      : { type: 'spring', stiffness: 460, damping: 34, mass: 0.82 }
                  }
                  className="flex max-h-[min(420px,45vh)] w-full shrink-0 flex-col overflow-hidden border-t border-slate-200/90 bg-[var(--app-surface)] will-change-transform lg:max-h-none lg:min-h-0 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0 xl:w-96 dark:border-slate-700"
                  aria-label="Opciones avanzadas del símbolo"
                >
                <div className="shrink-0 border-b border-slate-100/80 bg-[var(--app-surface-muted)] px-4 py-3 sm:px-5 dark:border-slate-800">
                  <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
                    Opciones avanzadas
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
                  <div className="space-y-6">
                    <div className="ui-floating-panel space-y-3 rounded-2xl p-4">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(editingSymbol.wordVariants?.enabled)}
                          onChange={(e) => {
                            const on = e.target.checked
                            setEditingSymbol({
                              ...editingSymbol,
                              wordVariants: on
                                ? {
                                    ...(editingSymbol.wordVariants ?? EMPTY_WORD_VARIANTS_EDIT),
                                    enabled: true,
                                  }
                                : { ...EMPTY_WORD_VARIANTS_EDIT },
                            })
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Variantes de palabra
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            Hasta cuatro formas (plural, género, etc.). En el tablero, un toque corto usa la variante
                            marcada con el círculo; mantén pulsado la celda o pulsa el botón con icono de capas para
                            abrir el menú. Útil también con escáner si no puedes mantener pulsado.
                          </span>
                        </span>
                      </label>
                      <AnimatePresence initial={false}>
                        {editingSymbol.wordVariants?.enabled && (
                          <motion.div
                            key="symbol-edit-word-variants-fields"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden border-t border-slate-100 pt-3 dark:border-slate-700"
                          >
                            <div className="space-y-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Textos (mínimo 2) · predeterminada al pulsar rápido
                              </p>
                              {([0, 1, 2, 3] as const).map((slot) => {
                                const wv = editingSymbol.wordVariants!
                                const variants = [...wv.variants] as [string, string, string, string]
                                return (
                                  <div key={slot} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`variant-default-aside-${editingSymbol.id ?? 'new'}`}
                                      checked={wv.defaultIndex === slot}
                                      onChange={() =>
                                        setEditingSymbol({
                                          ...editingSymbol,
                                          wordVariants: { ...wv, defaultIndex: slot },
                                        })
                                      }
                                      className="h-4 w-4 shrink-0 text-indigo-600 focus:ring-indigo-600"
                                      aria-label={`Variante ${slot + 1} como predeterminada al toque corto`}
                                    />
                                    <input
                                      type="text"
                                      value={variants[slot]}
                                      onChange={(e) => {
                                        const next: [string, string, string, string] = [...variants]
                                        next[slot] = e.target.value
                                        setEditingSymbol({
                                          ...editingSymbol,
                                          wordVariants: { ...wv, variants: next },
                                        })
                                      }}
                                      className="app-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm"
                                      placeholder={`Variante ${slot + 1}`}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex min-h-[min(160px,28vh)] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/40 px-4 py-6 dark:border-slate-700 dark:bg-slate-900/25">
                      <p className="max-w-sm text-center text-xs text-slate-500 dark:text-slate-400">
                        Espacio reservado para más opciones avanzadas.
                      </p>
                    </div>
                  </div>
                </div>
                </motion.aside>
              )}
            </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createFolderModal ? (
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={closeCreateFolderModal}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-folder-modal-title"
              className="ui-modal-panel relative z-[1] w-full max-w-md rounded-t-[1.75rem] sm:rounded-[2rem]"
            >
              <form onSubmit={confirmCreateFolder} className="flex flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-4 sm:p-5 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200">
                      <FolderOpen size={20} aria-hidden />
                    </span>
                    <div>
                      <h3 id="create-folder-modal-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        Nueva carpeta
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        El nombre aparecerá en el tablero como picto carpeta.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateFolderModal}
                    className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Cerrar"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4 p-4 sm:p-5">
                  <div>
                    <label htmlFor="create-folder-name" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Nombre de la carpeta
                    </label>
                    <input
                      id="create-folder-name"
                      type="text"
                      value={createFolderName}
                      onChange={(e) => setCreateFolderName(e.target.value)}
                      className="app-input w-full rounded-xl px-4 py-3 text-sm"
                      placeholder="Ej. Mi rutina"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeCreateFolderModal}
                      className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="ui-primary-button rounded-2xl px-5 py-2.5 text-sm font-semibold">
                      Crear carpeta
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateProfileModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => {
                if (!creatingProfile) {
                  setShowCreateProfileModal(false)
                  resetCreateProfileModal()
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ui-modal-panel relative flex max-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] sm:max-h-[min(92dvh,720px)] sm:rounded-[2rem]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Crear tablero</h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">Paso {createProfileStep} de 3</p>
                  {showCreateProfileStepDebug ? (
                    <p className="mt-1.5 rounded-lg bg-amber-100/90 px-2 py-1 font-mono text-[11px] font-semibold text-amber-950 dark:bg-amber-500/20 dark:text-amber-100">
                      createProfileStep = {createProfileStep}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => {
                    if (!creatingProfile) {
                      setShowCreateProfileModal(false)
                      resetCreateProfileModal()
                    }
                  }}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (createProfileStep === 3) void handleCreateProfile(e)
                }}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-6 sm:pb-8"
              >
                {createProfileStep === 1 ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Nombre del tablero
                      </label>
                      <input
                        type="text"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="Ej. María"
                        autoFocus
                        required
                      />
                    </div>

                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Se creará un tablero nuevo vacío para personalizar su grid desde este panel.
                    </p>

                    <div className="mt-5 rounded-2xl border border-slate-200/80 bg-[var(--app-surface-muted)] p-4 dark:border-slate-700">
                      <ProfileGridDimensionPicker
                        cols={newProfileGridCols}
                        rows={newProfileGridRows}
                        onChange={handleNewProfileGridSize}
                      />
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Hasta {PROFILE_GRID_PICKER_MAX_COLS} columnas y {PROFILE_GRID_PICKER_MAX_ROWS} filas aquí; si necesitas
                        más, ajústalas después en Dimensiones (hasta 20×20).
                      </p>
                    </div>
                  </>
                ) : null}

                {createProfileStep === 2 ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Género de comunicación</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Se usa para conjugar frases y filtrar voces en este tablero.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewProfileGender('male')}
                        className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                          newProfileGender === 'male'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-100'
                            : 'ui-secondary-button text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Masculino
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProfileGender('female')}
                        className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                          newProfileGender === 'female'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-100'
                            : 'ui-secondary-button text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Femenino
                      </button>
                    </div>
                  </div>
                ) : null}

                {createProfileStep === 3 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cómo volver a este panel</p>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        Desde el <span className="font-semibold">tablero</span> (ruta{' '}
                        <span className="rounded bg-slate-200/90 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-700">/tablero</span>
                        ), toca <span className="font-semibold">cinco veces seguidas</span> el icono de la casa en la barra inferior.
                        Se abrirá un aviso para ir al panel de administración (<span className="font-mono text-xs">/admin</span>).
                      </p>
                    </div>
                    <AdminAccessBoardDemo />
                    <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">Animación de ejemplo; en el tablero real el gesto es el mismo.</p>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  {createProfileStep === 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateProfileModal(false)
                          resetCreateProfileModal()
                        }}
                        className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:w-auto dark:text-slate-300"
                        disabled={creatingProfile}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="ui-primary-button w-full rounded-2xl px-6 py-2.5 text-sm font-semibold transition disabled:opacity-70 sm:w-auto"
                        disabled={creatingProfile || !newProfileName.trim()}
                        onClick={() => {
                          if (newProfileName.trim()) setCreateProfileStep(2)
                        }}
                      >
                        Siguiente
                      </button>
                    </>
                  ) : null}

                  {createProfileStep === 2 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCreateProfileStep(1)}
                        className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:w-auto dark:text-slate-300"
                        disabled={creatingProfile}
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        className="ui-primary-button w-full rounded-2xl px-6 py-2.5 text-sm font-semibold transition sm:w-auto"
                        disabled={creatingProfile}
                        onClick={() => setCreateProfileStep(3)}
                      >
                        Siguiente
                      </button>
                    </>
                  ) : null}

                  {createProfileStep === 3 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCreateProfileStep(2)}
                        className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:w-auto dark:text-slate-300"
                        disabled={creatingProfile}
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        className="ui-primary-button w-full rounded-2xl px-6 py-2.5 text-sm font-semibold transition disabled:opacity-70 sm:w-auto"
                        disabled={creatingProfile || !newProfileName.trim()}
                      >
                        {creatingProfile ? 'Creando...' : 'Crear tablero'}
                      </button>
                    </>
                  ) : null}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileBeingEdited && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => {
                if (!savingProfileChanges && !profileDuplicateBusy) {
                  setProfileBeingEdited(null)
                  setEditProfileName('')
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ui-modal-panel relative max-h-[100dvh] w-full max-w-md overflow-hidden rounded-t-[1.75rem] sm:max-h-[min(90dvh,720px)] sm:rounded-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar tablero</h3>
                <button
                  onClick={() => {
                    if (!savingProfileChanges && !profileDuplicateBusy) {
                      setProfileBeingEdited(null)
                      setEditProfileName('')
                    }
                  }}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditProfile} className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain p-4 sm:max-h-none sm:overflow-visible sm:p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre del tablero</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Nombre del tablero"
                    autoFocus
                    required
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void handleDuplicateProfile()}
                    disabled={savingProfileChanges || profileDuplicateBusy}
                    className="ui-secondary-button w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200"
                  >
                    {profileDuplicateBusy ? 'Duplicando…' : 'Duplicar tablero'}
                  </button>
                </div>
                {profileBeingEdited.isDemo ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Este tablero es el tablero demo fijo (plantilla); no se puede eliminar.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileBeingEdited(null)
                      setEditProfileName('')
                    }}
                    className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:w-auto dark:text-slate-300"
                    disabled={savingProfileChanges || profileDuplicateBusy}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="ui-primary-button w-full rounded-2xl px-6 py-2.5 text-sm font-semibold transition disabled:opacity-70 sm:w-auto"
                    disabled={savingProfileChanges || profileDuplicateBusy || !editProfileName.trim()}
                  >
                    {savingProfileChanges ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profilePendingDeletion && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => {
                if (!deletingProfileId) {
                  setProfilePendingDeletion(null)
                  setDeleteProfileNameConfirmation('')
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ui-modal-panel relative max-h-[100dvh] w-full max-w-md overflow-hidden rounded-t-[1.75rem] sm:max-h-[min(90dvh,720px)] sm:rounded-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Eliminar tablero</h3>
                <button
                  onClick={() => {
                    if (!deletingProfileId) {
                      setProfilePendingDeletion(null)
                      setDeleteProfileNameConfirmation('')
                    }
                  }}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={confirmDeleteProfile} className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain p-4 sm:max-h-none sm:overflow-visible sm:p-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Esta acción eliminará el tablero y sus símbolos. Para confirmar, escribe exactamente:
                </p>
                <p className="mt-2 break-words rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                  {profilePendingDeletion.name}
                </p>

                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre del tablero</label>
                  <input
                    type="text"
                    value={deleteProfileNameConfirmation}
                    onChange={(e) => setDeleteProfileNameConfirmation(e.target.value)}
                    className="app-input w-full rounded-xl px-4 py-2.5 text-sm focus:border-rose-500 focus:ring-rose-500"
                    placeholder="Escribe el nombre exacto"
                    autoFocus
                    required
                  />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePendingDeletion(null)
                      setDeleteProfileNameConfirmation('')
                    }}
                    className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition sm:w-auto dark:text-slate-300"
                    disabled={Boolean(deletingProfileId)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-70 sm:w-auto"
                    disabled={Boolean(deletingProfileId) || deleteProfileNameConfirmation.trim() !== profilePendingDeletion.name}
                  >
                    {deletingProfileId ? 'Eliminando...' : 'Eliminar tablero'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voiceCloneDisclaimerOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={cancelVoiceCloneDisclaimer}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="ui-modal-panel relative max-h-[100dvh] w-full max-w-md overflow-hidden rounded-t-[1.75rem] border border-slate-200 sm:max-h-[min(90dvh,720px)] sm:rounded-[2rem] dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-200 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    <ShieldAlert className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Clonación de voz con ElevenLabs</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Solo se muestra la primera vez</p>
                  </div>
                </div>
              </div>
              <div className="max-h-[calc(100dvh-8rem)] space-y-4 overflow-y-auto overscroll-contain p-4 text-sm leading-relaxed text-slate-700 sm:max-h-none sm:overflow-visible sm:p-6 dark:text-slate-300">
                <p>
                  Para crear tu voz personalizada, las <strong className="text-slate-900 dark:text-slate-100">grabaciones o archivos de audio</strong>{' '}
                  que envíes se envían de forma segura a <strong className="text-slate-900 dark:text-slate-100">ElevenLabs</strong>, que los utiliza
                  para entrenar y generar tu modelo de voz.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Al continuar confirmas que has leído este aviso. El tratamiento de datos por parte de ElevenLabs se rige por sus condiciones y
                  política de privacidad.
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelVoiceCloneDisclaimer}
                    className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={acceptVoiceCloneDisclaimer}
                    className="rounded-2xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-400"
                  >
                    Entendido, continuar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showFreePlanUpsell ? (
        <AdminFreePlanUpsellModal open={showFreePlanUpsell} onDismiss={dismissFreePlanUpsell} />
      ) : null}

      {showVoicePlanRequiredModal ? (
        <VoicePlanRequiredModal open onDismiss={() => setShowVoicePlanRequiredModal(false)} />
      ) : null}

      <PlanPickerModal
        open={showPlanPickerModal}
        dismissable
        onClose={() => setShowPlanPickerModal(false)}
        onCompleted={() => {
          setShowPlanPickerModal(false)
          void loadData()
        }}
      />

      <KeyboardThemeModal
        open={keyboardThemeModalOpen}
        initialTheme={selectedProfile?.keyboardTheme ?? null}
        profileName={selectedProfile?.name ?? ''}
        onClose={() => setKeyboardThemeModalOpen(false)}
        onSave={async (theme) => {
          if (!selectedProfileId) return { ok: false as const, error: 'Sin tablero' }
          const result = await updateProfileKeyboardTheme(selectedProfileId, theme)
          if (result.ok) {
            setProfiles((prev) =>
              prev.map((p) =>
                p.id === selectedProfileId ? { ...p, keyboardTheme: result.theme } : p,
              ),
            )
            return { ok: true as const }
          }
          return { ok: false as const, error: result.error }
        }}
      />
    </div>
  )
}
