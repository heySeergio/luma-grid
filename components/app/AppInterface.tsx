'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import SymbolGrid from './SymbolGrid'
import type { SymbolSelectChoice } from './SymbolCell'
import PhraseBar from './PhraseBar'
import Keyboard from './Keyboard'
import QuickPhrases from './QuickPhrases'
import PhraseCompletionChips from './PhraseCompletionChips'
import ScannerOverlay from './ScannerOverlay'
import PendingSyncStatus from './PendingSyncStatus'
import ProfileSelector from './ProfileSelector'
import { analyzeLexicalTextInput } from '@/app/actions/lexicon'
import { DEFAULT_FOLDER_CONTENTS, computeMainGrid } from '@/lib/data/defaultSymbols'
import { mergeMainGridWithFolderView } from '@/lib/grid/mergeMainGridWithFolderView'
import { detectQuestionType } from '@/lib/lexicon/questions'
import { getAccountSettings } from '@/app/actions/account'
import { pickBoardGlyphForKeyboardToken } from '@/lib/tablero/keyboardPictoAutocomplete'
import { fetchFirstArasaacImage } from '@/lib/arasaac'
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { getProfiles } from '@/app/actions/profiles'
import { getProfileSymbols } from '@/app/actions/symbols'
import { getPinnedPhrases, getFrequentPhrases, saveQuickPhrase } from '@/app/actions/phrases'
import { getPhraseCompletionSuggestions, type PhraseCompletionChip } from '@/app/actions/phraseCompletion'
import { getPredictionCandidates, recordSymbolUsage } from '@/app/actions/predictions'
import {
  clearPendingUsageEvents,
  enqueuePendingNavigationEvent,
  enqueuePendingUsageEvent,
  enqueuePendingUtteranceEvent,
  flushPendingUsageEvents,
  type PendingUsageEventPayload,
} from '@/lib/dexie/usageSyncQueue'
import { recordUtterance } from '@/app/actions/utterances'
import { recordNavigation } from '@/app/actions/navigation'
import type { RecordUtterancePayload } from '@/lib/usageEvaluation/utteranceTypes'
import type { NavigationAction, RecordNavigationPayload } from '@/lib/usageEvaluation/navigationTypes'
import { getVoiceSettings } from '@/app/actions/voiceSettings'
import { applyProfileGenders } from '@/lib/profileGender'
import { playSymbolTapAudio } from '@/lib/voice/playSymbolTapAudio'
import { speakText } from '@/lib/voice/speakClient'
import type { SpeakVoicePrefs } from '@/lib/voice/speakClient'
import type { Symbol, Profile, Phrase, AccessConfig } from '@/lib/supabase/types'
import type { KeyboardThemeColors } from '@/lib/keyboard/theme'
import type { DefaultTableroTab } from '@/lib/account/defaultTableroTab'
import type { TableroInitialPayload } from '@/lib/tablero/loadTableroInitial'

type TabMode = 'grid' | 'keyboard'

type AppInterfaceProps = {
  /** Preferencia de cuenta para la primera pintura (SSR); evita mostrar el grid y luego el teclado. */
  initialDefaultTableroTab?: DefaultTableroTab
  /** Datos precargados en el servidor: evita cascada perfiles → símbolos en el primer pintado. */
  tableroInitial?: TableroInitialPayload | null
}

type LocalProfile = Profile & {
  isDemo?: boolean
  isOpeningProfile?: boolean
  gridCols?: number
  gridRows?: number
  communication_gender?: 'male' | 'female'
  keyboardTheme?: KeyboardThemeColors | null
  /** Null = plantilla por defecto (7 col + fila 0). */
  fixedZoneCellKeys?: string[] | null
  /** Solo demo: celdas de plantilla no reinyectadas tras borrado. */
  demoSuppressedTemplateLabels?: string[]
  /** Solo demo: pictos de contenido de carpeta no reinyectados (`carpeta|etiqueta`). */
  demoSuppressedFolderItems?: string[]
}

type PredictionInputSymbol = {
  id: string
  label: string
  posType: Symbol['posType']
  lexemeId?: string | null
  category?: string | null
  state?: string
}

// Mapeo masculino → femenino para sentimientos con género gramatical variable
const FEELING_FEMININE: Record<string, string> = {
  'confundido': 'confundida',
  'enfermo': 'enferma',
  'nervioso': 'nerviosa',
  'distraído': 'distraída',
  'enamorado': 'enamorada',
  'preocupado': 'preocupada',
  'enfadado': 'enfadada',
  'sorprendido': 'sorprendida',
  'asqueado': 'asqueada',
  'desanimado': 'desanimada',
  'mareado': 'mareada',
  'incómodo': 'incómoda',
  'cansado': 'cansada',
}

// Mapa inverso: femenino → masculino (generado automáticamente desde FEELING_FEMININE)
const FEELING_MASCULINE: Record<string, string> = Object.fromEntries(
  Object.entries(FEELING_FEMININE).map(([m, f]) => [f, m])
)

// Pronombres con género explícito; Yo/Tú se resuelven con communication_gender del perfil
const PRONOUN_GENDER: Record<string, 'male' | 'female'> = {
  'él': 'male', 'ellos': 'male', 'nosotros': 'male', 'vosotros': 'male',
  'ella': 'female', 'ellas': 'female', 'nosotras': 'female', 'vosotras': 'female',
}

function pickInitialProfile(list: LocalProfile[], activeId: string | null): LocalProfile | null {
  if (!activeId || list.length === 0) return null
  return list.find((p) => p.id === activeId) ?? null
}


export default function AppInterface({
  initialDefaultTableroTab = 'grid',
  tableroInitial = null,
}: AppInterfaceProps = {}) {
  const [profiles, setProfiles] = useState<LocalProfile[]>(() => {
    if (!tableroInitial) return []
    return applyProfileGenders(tableroInitial.profiles as Profile[]) as LocalProfile[]
  })
  const [profile, setProfile] = useState<LocalProfile | null>(() => {
    if (!tableroInitial) return null
    const list = applyProfileGenders(tableroInitial.profiles as Profile[]) as LocalProfile[]
    return pickInitialProfile(list, tableroInitial.activeProfileId)
  })
  const [symbols, setSymbols] = useState<Symbol[]>(() => tableroInitial?.symbols ?? [])
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([])
  const [pinnedPhrases, setPinnedPhrases] = useState<Phrase[]>(
    () => tableroInitial?.pinnedPhrases ?? [],
  )
  const [frequentPhrases, setFrequentPhrases] = useState<Phrase[]>(
    () => tableroInitial?.frequentPhrases ?? [],
  )
  /** Fila «Frecuentes» en /tablero; preferencia de cuenta (por defecto visible). */
  const [showFrequentPhrasesSection, setShowFrequentPhrasesSection] = useState(
    () => tableroInitial?.accountSettings?.showFrequentPhrasesSection ?? true,
  )
  /** Franja «Siguiente» (chips bajo la barra); no afecta a predicciones en celdas. */
  const [showPhraseCompletionSection, setShowPhraseCompletionSection] = useState(
    () => tableroInitial?.accountSettings?.showPhraseCompletionSection ?? true,
  )
  const [showRestModeButton, setShowRestModeButton] = useState(
    () => tableroInitial?.accountSettings?.showRestModeButton ?? true,
  )
  /** Iluminación predictiva en celdas del grid (independiente de la franja «Siguiente»). */
  const [showGridCellPredictions, setShowGridCellPredictions] = useState(
    () => tableroInitial?.accountSettings?.showGridCellPredictions ?? true,
  )
  /** Guardar pulsaciones para aprendizaje de predicciones (preferencia de privacidad en cuenta). */
  const [shareUsageForPredictions, setShareUsageForPredictions] = useState(
    () => tableroInitial?.accountSettings?.shareUsageForPredictions !== false,
  )
  /** Si la palabra del teclado coincide con un símbolo del tablero, mostrar su picto (por defecto activo). */
  const [keyboardPictoAutocomplete, setKeyboardPictoAutocomplete] = useState(
    () => tableroInitial?.accountSettings?.keyboardPictoAutocomplete ?? true,
  )
  /** Pictograma ARASAAC por palabra escrita con teclado (búsqueda vía API, con caché). */
  const [keyboardArasaacPictograms, setKeyboardArasaacPictograms] = useState(
    () => tableroInitial?.accountSettings?.keyboardArasaacPictograms ?? true,
  )
  /** Incrementa al inyectar una frase rápida/frecuente para limpiar conjugación en PhraseBar. */
  const [phraseCompositionReset, setPhraseCompositionReset] = useState(0)
  /** Pausa selección en el grid (mirada / descanso sin borrar la frase). */
  const [restMode, setRestMode] = useState(false)
  const [completionChips, setCompletionChips] = useState<PhraseCompletionChip[]>([])
  const [accessConfig, setAccessConfig] = useState<AccessConfig | null>(null)
  const [activeTab, setActiveTab] = useState<TabMode>(initialDefaultTableroTab)
  const [isOnline, setIsOnline] = useState(true)
  const [predictedIds, setPredictedIds] = useState<string[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [folderHistory, setFolderHistory] = useState<string[]>([])
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  const phraseSessionIdRef = useRef<string | null>(null)
  const phraseSequenceRef = useRef(0)
  /** Timestamp del primer tap de la composición actual (para durationMs en UtteranceEvent). */
  const compositionStartedAtRef = useRef<number | null>(null)
  /** Snapshot SSR para omitir la primera recarga; el cleanup restaura en Strict Mode. */
  const tableroBootstrapRef = useRef(tableroInitial)
  const [voicePrefs, setVoicePrefs] = useState<SpeakVoicePrefs>({ ttsMode: 'browser', voiceId: null })
  const profileId = profile?.id ?? ''

  const shouldUseDefaultGridTemplate = Boolean(profile?.isDemo)
  const demoSuppressedTemplateLabelSet = useMemo(() => {
    const raw = profile?.demoSuppressedTemplateLabels
    if (!raw?.length) return null
    return new Set(raw.map((s) => s.trim().toLowerCase()).filter(Boolean))
  }, [profile?.demoSuppressedTemplateLabels])

  const demoSuppressedFolderItemSet = useMemo(() => {
    const raw = profile?.demoSuppressedFolderItems
    if (!raw?.length) return null
    return new Set(raw.map((s) => s.trim().toLowerCase()).filter(Boolean))
  }, [profile?.demoSuppressedFolderItems])

  /** Zona fija personalizada del perfil. `null`/`undefined` = usar plantilla geométrica por defecto (7 col + fila 0); `[]` = zona fija vacía explícita. */
  const fixedZoneKeySet = useMemo(() => {
    const k = profile?.fixedZoneCellKeys
    if (k === null || k === undefined) return null
    return new Set(k)
  }, [profile?.fixedZoneCellKeys])

  const mainOrderedSymbols = useMemo(() => {
    if (shouldUseDefaultGridTemplate) {
      return computeMainGrid(
        symbols,
        activeFolder,
        demoSuppressedTemplateLabelSet,
        demoSuppressedFolderItemSet,
        fixedZoneKeySet,
      )
    }
    const cols = Math.max(1, profile?.gridCols ?? 14)
    const rows = Math.max(1, profile?.gridRows ?? 8)
    return mergeMainGridWithFolderView(symbols, activeFolder, cols, rows, fixedZoneKeySet)
  }, [
    shouldUseDefaultGridTemplate,
    symbols,
    activeFolder,
    profile?.gridCols,
    profile?.gridRows,
    demoSuppressedTemplateLabelSet,
    demoSuppressedFolderItemSet,
    fixedZoneKeySet,
  ])

  // Muestra la forma femenina en las celdas cuando el género de comunicación es femenino
  const displayedSymbols = useMemo(() => {
    if (profile?.communication_gender !== 'female') return mainOrderedSymbols
    return mainOrderedSymbols.map(sym => {
      const feminine = FEELING_FEMININE[sym.label.toLowerCase()]
      if (!feminine) return sym
      const displayLabel = sym.label[0] === sym.label[0].toUpperCase()
        ? feminine[0].toUpperCase() + feminine.slice(1)
        : feminine
      return { ...sym, label: displayLabel }
    })
  }, [mainOrderedSymbols, profile?.communication_gender])

  const speakSelectedWord = useCallback((text: string) => {
    if (!text.trim()) return
    void speakText(text, profile?.id ?? '', voicePrefs).catch(() => { })
  }, [profile?.id, voicePrefs])

  useEffect(() => {
    const loadVoice = () => {
      void getVoiceSettings().then((s) => {
        if (!s) return
        setVoicePrefs({ ttsMode: s.ttsMode, voiceId: s.voiceId })
      })
    }
    loadVoice()
    const onVis = () => {
      if (document.visibilityState === 'visible') loadVoice()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const resetPhraseTracking = useCallback(() => {
    phraseSessionIdRef.current = null
    phraseSequenceRef.current = 0
    compositionStartedAtRef.current = null
  }, [])

  const ensurePhraseSessionId = useCallback((profileId: string) => {
    if (!phraseSessionIdRef.current) {
      phraseSessionIdRef.current = `${profileId}:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`}`
    }

    return phraseSessionIdRef.current
  }, [])

  const toPredictionInput = useCallback((symbol: Pick<Symbol, 'id' | 'label' | 'posType' | 'lexemeId' | 'category' | 'state'>): PredictionInputSymbol => ({
    id: symbol.id,
    label: symbol.label,
    posType: symbol.posType,
    lexemeId: symbol.lexemeId ?? null,
    category: symbol.category ?? null,
    state: symbol.state,
  }), [])

  const toPredictionFromPhraseSelection = useCallback(
    (symbol: Symbol & { sourceSymbolId?: string }): PredictionInputSymbol => ({
      id: symbol.sourceSymbolId ?? symbol.id,
      label: symbol.label,
      posType: symbol.posType,
      lexemeId: symbol.lexemeId ?? null,
      category: symbol.category ?? null,
      state: symbol.state,
    }),
    [],
  )

  const persistSymbolUsage = useCallback((payload: PendingUsageEventPayload) => {
    if (!shareUsageForPredictions) return
    void (async () => {
      try {
        await recordSymbolUsage(payload)
      } catch {
        try {
          await enqueuePendingUsageEvent(payload)
        } catch {
          /* sin red o Dexie no disponible */
        }
      }
    })()
  }, [shareUsageForPredictions])

  const persistUtterance = useCallback((payload: RecordUtterancePayload) => {
    if (!shareUsageForPredictions) return
    void (async () => {
      try {
        await recordUtterance(payload)
      } catch {
        try {
          await enqueuePendingUtteranceEvent(payload)
        } catch {
          /* sin red o Dexie no disponible */
        }
      }
    })()
  }, [shareUsageForPredictions])

  const persistNavigation = useCallback((payload: RecordNavigationPayload) => {
    if (!shareUsageForPredictions) return
    void (async () => {
      try {
        await recordNavigation(payload)
      } catch {
        try {
          await enqueuePendingNavigationEvent(payload)
        } catch {
          /* sin red o Dexie no disponible */
        }
      }
    })()
  }, [shareUsageForPredictions])

  const recordNav = useCallback(
    (action: NavigationAction, opts?: { folderTarget?: string | null }) => {
      if (!profile?.id) return
      const folderDepth = folderHistory.length + (activeFolder ? 1 : 0)
      persistNavigation({
        profileId: profile.id,
        action,
        folderTarget: opts?.folderTarget ?? null,
        phraseLength: selectedSymbols.length,
        folderDepth,
      })
    },
    [profile, persistNavigation, activeFolder, folderHistory, selectedSymbols.length],
  )

  const enterFolder = useCallback(
    (target: string, pushHistoryFrom: string | null) => {
      recordNav('folder_enter', { folderTarget: target })
      setFolderHistory((prev) => (pushHistoryFrom ? [...prev, pushHistoryFrom] : prev))
      setActiveFolder(target)
      setPredictedIds([])
    },
    [recordNav],
  )

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const run = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void flushPendingUsageEvents()
      }
    }
    run()
    window.addEventListener('online', run)
    const onVis = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('online', run)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const loadProfiles = useCallback(async () => {
    try {
      const dbProfiles = await getProfiles() as LocalProfile[]
      const profilesWithGender = applyProfileGenders(dbProfiles) as LocalProfile[]
      setProfiles(profilesWithGender)
      setProfile((prev) => {
        if (profilesWithGender.length === 0) return null
        if (prev) {
          const match = profilesWithGender.find((p) => p.id === prev.id)
          if (match) return match
        }
        const opening = profilesWithGender.find((p) => p.isOpeningProfile)
        return opening ?? profilesWithGender[0] ?? null
      })
    } catch (err) {
      console.error('Error fetching profiles', err)
    }
  }, [])

  const loadSymbols = useCallback(async () => {
    if (!profileId) return
    try {
      const dbSymbols = await getProfileSymbols(profileId) as Symbol[]
      setSymbols(dbSymbols)
    } catch (err) {
      console.error('Error fetching symbols', err)
    }
  }, [profileId])

  const loadPinnedPhrases = useCallback(async () => {
    if (!profileId) return
    try {
      const phrases = await getPinnedPhrases(profileId) as Phrase[]
      setPinnedPhrases(phrases)
    } catch (err) {
      console.error('Error fetching pinned phrases', err)
    }
  }, [profileId])

  const loadFrequentPhrases = useCallback(async () => {
    if (!profileId) return
    try {
      const rows = (await getFrequentPhrases(profileId, 5)) as Phrase[]
      setFrequentPhrases(rows)
    } catch (err) {
      console.error('Error fetching frequent phrases', err)
    }
  }, [profileId])

  const loadAccessConfig = useCallback(async () => {
    setAccessConfig(null)
  }, [])

  const hydratedFromServer = tableroInitial != null

  const applyAccountSettings = useCallback((s: NonNullable<Awaited<ReturnType<typeof getAccountSettings>>>) => {
    if (typeof s.showFrequentPhrasesSection === 'boolean') {
      setShowFrequentPhrasesSection(s.showFrequentPhrasesSection)
    }
    if (typeof s.showPhraseCompletionSection === 'boolean') {
      setShowPhraseCompletionSection(s.showPhraseCompletionSection)
    }
    if (typeof s.showRestModeButton === 'boolean') {
      setShowRestModeButton(s.showRestModeButton)
    }
    if (typeof s.showGridCellPredictions === 'boolean') {
      setShowGridCellPredictions(s.showGridCellPredictions)
    }
    setActiveTab(parseDefaultTableroTab(s.defaultTableroTab))
    const share = s.shareUsageForPredictions !== false
    setShareUsageForPredictions(share)
    if (!share) void clearPendingUsageEvents()
    if (typeof s.keyboardPictoAutocomplete === 'boolean') {
      setKeyboardPictoAutocomplete(s.keyboardPictoAutocomplete)
    }
    if (typeof s.keyboardArasaacPictograms === 'boolean') {
      setKeyboardArasaacPictograms(s.keyboardArasaacPictograms)
    }
  }, [])

  const loadAccountSettings = useCallback(() => {
    void getAccountSettings().then((s) => {
      if (!s) return
      applyAccountSettings(s)
    })
  }, [applyAccountSettings])

  const subscribeToChanges = useCallback(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'luma.account.sync') {
        loadAccountSettings()
      }
      if (e.key === 'luma.grid.sync') {
        void loadProfiles()
        void loadSymbols()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [loadAccountSettings, loadProfiles, loadSymbols])

  useEffect(() => {
    if (hydratedFromServer) return
    loadAccountSettings()
  }, [hydratedFromServer, loadAccountSettings])

  useEffect(() => {
    if (!hydratedFromServer) return
    if (tableroInitial?.accountSettings?.shareUsageForPredictions === false) {
      void clearPendingUsageEvents()
    }
  }, [hydratedFromServer, tableroInitial?.accountSettings?.shareUsageForPredictions])

  useEffect(() => {
    if (!showRestModeButton) setRestMode(false)
  }, [showRestModeButton])

  useEffect(() => {
    if (!showGridCellPredictions) {
      setPredictedIds([])
    }
  }, [showGridCellPredictions])

  useEffect(() => {
    if (!profileId) return

    const bootstrap = tableroBootstrapRef.current
    const useServerBundle =
      bootstrap &&
      profileId === bootstrap.activeProfileId &&
      bootstrap.activeProfileId !== null

    if (useServerBundle) {
      const snapshot = bootstrap
      tableroBootstrapRef.current = null
      const unsubStorage = subscribeToChanges()
      return () => {
        tableroBootstrapRef.current = snapshot
        unsubStorage()
      }
    }

    resetPhraseTracking()
    setSymbols([])
    setPredictedIds([])
    setSelectedSymbols([])
    setCompletionChips([])
    setActiveFolder(null)
    setFolderHistory([])
    void loadSymbols()
    void loadPinnedPhrases()
    if (showFrequentPhrasesSection) {
      void loadFrequentPhrases()
    } else {
      setFrequentPhrases([])
    }
    void loadAccessConfig()

    return subscribeToChanges()
  }, [
    profileId,
    showFrequentPhrasesSection,
    resetPhraseTracking,
    loadSymbols,
    loadPinnedPhrases,
    loadFrequentPhrases,
    loadAccessConfig,
    subscribeToChanges,
  ])

  const handleSymbolSelect = useCallback(async (symbol: Symbol, choice?: SymbolSelectChoice) => {
    if (showRestModeButton && restMode) return

    const normalizedLabel = symbol.label.toLowerCase()

    if (shouldUseDefaultGridTemplate) {
      if (activeFolder === 'Más verbos' && normalizedLabel === 'más') {
        enterFolder('Más verbos · página 2', 'Más verbos')
        return
      }
      if (activeFolder === 'Más verbos · página 2' && normalizedLabel === 'más') {
        enterFolder('Más verbos · página 3', 'Más verbos · página 2')
        return
      }
      if (activeFolder === 'Alimentos' && normalizedLabel === 'más') {
        enterFolder('Alimentos · página 2', 'Alimentos')
        return
      }
      if (activeFolder === 'Animales' && normalizedLabel === 'más') {
        enterFolder('Animales · página 2', 'Animales')
        return
      }
      if (DEFAULT_FOLDER_CONTENTS[symbol.label] && symbol.label !== activeFolder) {
        enterFolder(symbol.label, activeFolder)
        return
      }
    } else if (
      symbol.category === 'Carpetas' &&
      symbol.id &&
      !String(symbol.id).startsWith('folder-')
    ) {
      enterFolder(symbol.id, activeFolder)
      return
    }

    if (
      symbol.opensKeyboard ||
      normalizedLabel === 'números' ||
      normalizedLabel === 'numeros' ||
      normalizedLabel === 'teclado'
    ) {
      setActiveTab('keyboard')
      setActiveFolder(null)
      setFolderHistory([])
      return
    }

    // Normalizar al masculino canónico (la celda puede mostrar ya la forma femenina)
    const canonicalMasc = FEELING_MASCULINE[symbol.label.toLowerCase()]
    const canonicalLabel = canonicalMasc
      ? (symbol.label[0] === symbol.label[0].toUpperCase()
        ? canonicalMasc[0].toUpperCase() + canonicalMasc.slice(1)
        : canonicalMasc)
      : symbol.label
    const feminineForm = FEELING_FEMININE[canonicalLabel.toLowerCase()]
    const rawPhraseLabel = (() => {
      if (!feminineForm) return choice?.phraseLabel ?? symbol.label
      const lastPronoun = [...selectedSymbols].reverse().find(s => s.posType === 'pronoun')
      const genderFromPronoun = lastPronoun
        ? (PRONOUN_GENDER[lastPronoun.label.toLowerCase()] ?? null)
        : null
      const gender = genderFromPronoun ?? (profile?.communication_gender ?? 'male')
      if (gender !== 'female') return canonicalLabel
      // Preservar capitalización del label original
      return canonicalLabel[0] === canonicalLabel[0].toUpperCase()
        ? feminineForm[0].toUpperCase() + feminineForm.slice(1)
        : feminineForm
    })()
    const normalizedTokenLabel =
      rawPhraseLabel === 'Y' ? 'y' : rawPhraseLabel === 'A' ? 'a' : rawPhraseLabel
    const currentPhraseSymbols = [...selectedSymbols, {
      id: symbol.id,
      label: normalizedTokenLabel,
      posType: symbol.posType,
      lexemeId: symbol.lexemeId ?? null,
      category: symbol.category ?? null,
      state: symbol.state,
    }]
    const phraseQuestionType = detectQuestionType(currentPhraseSymbols[0]?.label ?? '')

    setSelectedSymbols(prev => [
      ...prev,
      {
        ...symbol,
        label: normalizedTokenLabel,
        sourceSymbolId: symbol.id,
        // Cada pulsación crea una entrada única para permitir repetición consecutiva.
        id: `${symbol.id}-sel-${Date.now()}-${prev.length}`,
      },
    ])
    const sourceSymbol = symbols.find((s) => s.id === symbol.id) ?? symbol
    const tapUrl = sourceSymbol.tapAudioUrl?.trim()
    if (tapUrl) {
      void playSymbolTapAudio(tapUrl).catch(() => {
        speakSelectedWord(normalizedTokenLabel)
      })
    } else {
      speakSelectedWord(normalizedTokenLabel)
    }

    if (!profile || !symbol.id || String(symbol.id).startsWith('folder-')) {
      setPredictedIds([])
      return
    }

    const previousSelectedSymbol = selectedSymbols[selectedSymbols.length - 1]
    const previousSourceId = previousSelectedSymbol?.sourceSymbolId ?? previousSelectedSymbol?.id
    const previousSourceSymbol = previousSourceId
      ? symbols.find(candidate => candidate.id === previousSourceId) ?? null
      : null
    const phraseSessionId = ensurePhraseSessionId(profile.id)
    const sequenceIndex = phraseSequenceRef.current
    if (sequenceIndex === 0) {
      compositionStartedAtRef.current = Date.now()
    }
    phraseSequenceRef.current += 1

    persistSymbolUsage({
      profileId: profile.id,
      currentSymbol: {
        id: symbol.id,
        label: normalizedTokenLabel,
        posType: symbol.posType,
        lexemeId: symbol.lexemeId ?? null,
        category: symbol.category ?? null,
        state: symbol.state,
      },
      previousSymbol: previousSourceSymbol
        ? {
            id: previousSourceSymbol.id,
            label: previousSourceSymbol.label,
            posType: previousSourceSymbol.posType,
            lexemeId: previousSourceSymbol.lexemeId ?? null,
            category: previousSourceSymbol.category ?? null,
            state: previousSourceSymbol.state,
          }
        : null,
      phraseSessionId,
      sequenceIndex,
    })

    if (!showGridCellPredictions) {
      setPredictedIds([])
      return
    }

    try {
      const recentSymbols = [...selectedSymbols, {
        id: symbol.id,
        label: normalizedTokenLabel,
        posType: symbol.posType,
        lexemeId: symbol.lexemeId ?? null,
        category: symbol.category ?? null,
        state: symbol.state,
      }].slice(-3).map(item => ({
        id: item.id,
        label: item.label,
        posType: item.posType,
        lexemeId: item.lexemeId ?? null,
        category: item.category ?? null,
        state: item.state,
      }))

      const prioritized = await getPredictionCandidates({
        profileId: profile.id,
        currentSymbol: {
          id: symbol.id,
          label: normalizedTokenLabel,
          posType: symbol.posType,
          lexemeId: symbol.lexemeId ?? null,
          category: symbol.category ?? null,
          state: symbol.state,
        },
        recentSymbols,
        phraseQuestionType,
        candidateSymbols: mainOrderedSymbols.map(candidate => ({
          id: candidate.id,
          label: candidate.label,
          posType: candidate.posType,
          lexemeId: candidate.lexemeId ?? null,
          category: candidate.category ?? null,
          state: candidate.state,
        })),
      })
      setPredictedIds(prioritized)
    } catch (err) {
      console.error('Error calculating predictions', err)
      setPredictedIds([])
    }
  }, [
    activeFolder,
    enterFolder,
    ensurePhraseSessionId,
    mainOrderedSymbols,
    persistSymbolUsage,
    profile,
    restMode,
    showRestModeButton,
    selectedSymbols,
    shouldUseDefaultGridTemplate,
    showGridCellPredictions,
    speakSelectedWord,
    symbols,
  ])

  useEffect(() => {
    if (!profile) {
      setCompletionChips((prev) => {
        const safe = prev ?? []
        return safe.length === 0 ? safe : []
      })
      return
    }

    if (activeTab === 'keyboard') {
      setCompletionChips([])
      return
    }

    const candidates = mainOrderedSymbols.map((c) => ({
      id: c.id,
      label: c.label,
      posType: c.posType,
      lexemeId: c.lexemeId ?? null,
      category: c.category ?? null,
      state: c.state,
    }))

    /** Frase vacía: sin iluminar celdas por predicción hasta la primera pulsación en el tablero; «Siguiente» vacío hasta que haya al menos un símbolo. */
    if (selectedSymbols.length === 0) {
      if (showPhraseCompletionSection) {
        setCompletionChips([])
      } else {
        setCompletionChips((prev) => {
          const safe = prev ?? []
          return safe.length === 0 ? safe : []
        })
      }
      setPredictedIds([])
      return
    }

    if (!showPhraseCompletionSection) {
      setCompletionChips((prev) => {
        const safe = prev ?? []
        return safe.length === 0 ? safe : []
      })
      return
    }

    const inputs = selectedSymbols.map((s) =>
      toPredictionFromPhraseSelection(s as Symbol & { sourceSymbolId?: string }),
    )
    let cancelled = false
    void getPhraseCompletionSuggestions(profile.id, inputs, candidates).then((chips) => {
      if (!cancelled) setCompletionChips(chips)
    })
    return () => {
      cancelled = true
    }
  }, [
    profile,
    selectedSymbols,
    mainOrderedSymbols,
    toPredictionFromPhraseSelection,
    showPhraseCompletionSection,
    activeTab,
  ])

  const handleDeleteLast = () => {
    recordNav('delete_last')
    setSelectedSymbols(prev => prev.slice(0, -1))
    setPredictedIds([])
    if (selectedSymbols.length <= 1) {
      resetPhraseTracking()
    }
  }

  const handleClearAll = () => {
    recordNav('clear_phrase')
    setSelectedSymbols([])
    setPredictedIds([])
    resetPhraseTracking()
  }

  const handleRemoveSymbol = useCallback((phraseEntryId: string) => {
    setSelectedSymbols((prev) => prev.filter((s) => s.id !== phraseEntryId))
    setPredictedIds([])
  }, [])

  const handleCompletionChipPick = useCallback(
    (symbolId: string) => {
      if (showRestModeButton && restMode) return
      const sym = mainOrderedSymbols.find((s) => s.id === symbolId)
      if (sym) void handleSymbolSelect(sym)
    },
    [mainOrderedSymbols, handleSymbolSelect, restMode, showRestModeButton],
  )

  const handleAfterSpeak = useCallback(
    async (payload: { text: string; symbolsUsed: { id: string; label: string }[] }) => {
      if (!profile) return
      const startedAt = compositionStartedAtRef.current
      const durationMs = startedAt != null ? Date.now() - startedAt : null

      persistUtterance({
        profileId: profile.id,
        text: payload.text,
        symbolCount: payload.symbolsUsed.length,
        durationMs,
        source: 'speak',
        symbolsUsed: payload.symbolsUsed.map((s) => ({ id: s.id, label: s.label })),
      })
      resetPhraseTracking()

      try {
        await saveQuickPhrase(profile.id, payload.text, payload.symbolsUsed)
        if (showFrequentPhrasesSection) {
          await loadFrequentPhrases()
        }
      } catch (err) {
        console.error('Error saving phrase after speak', err)
      }
    },
    [profile, loadFrequentPhrases, showFrequentPhrasesSection, persistUtterance, resetPhraseTracking],
  )

  const buildSelectionFromPhrase = useCallback(
    (phrase: Phrase): Symbol[] => {
      if (!profile) return []
      const gridIdFallback = symbols[0]?.gridId ?? `grid-${profile.id}`
      return phrase.symbolsUsed.map((used, i) => {
        const gridSym = symbols.find((s) => s.id === used.id)
        if (gridSym) {
          return {
            ...gridSym,
            label: used.label,
            sourceSymbolId: gridSym.id,
            id: `${gridSym.id}-quick-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
          } as Symbol
        }
        return {
          id: `orphan-${used.id}-${Date.now()}-${i}`,
          gridId: gridIdFallback,
          label: used.label,
          category: 'General',
          posType: 'other',
          positionX: 0,
          positionY: 0,
          color: '#94a3b8',
          hidden: false,
          state: 'visible',
          sourceSymbolId: used.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Symbol
      })
    },
    [profile, symbols],
  )

  const handleQuickPhraseTap = useCallback(
    async (phrase: Phrase) => {
      if (!profile) return
      const t = phrase.text?.trim()
      if (!t) return
      setSelectedSymbols(buildSelectionFromPhrase(phrase))
      setPredictedIds([])
      resetPhraseTracking()
      setPhraseCompositionReset((k) => k + 1)
      try {
        await speakText(t, profile.id, voicePrefs)
        persistUtterance({
          profileId: profile.id,
          text: t,
          symbolCount: phrase.symbolsUsed?.length ?? 0,
          durationMs: null,
          source: 'quick_phrase',
          symbolsUsed: (phrase.symbolsUsed ?? []).map((s) => ({ id: s.id, label: s.label })),
        })
        resetPhraseTracking()
        await saveQuickPhrase(profile.id, phrase.text, phrase.symbolsUsed)
        if (showFrequentPhrasesSection) {
          await loadFrequentPhrases()
        }
      } catch (err) {
        console.error('Error en frase rápida/frecuente:', err)
      }
    },
    [
      profile,
      buildSelectionFromPhrase,
      voicePrefs,
      loadFrequentPhrases,
      resetPhraseTracking,
      persistUtterance,
      showFrequentPhrasesSection,
    ],
  )

  const cellSize = accessConfig?.grid_cell_size || 'medium'
  const showScanner = accessConfig?.show_scanner || false
  /** `cell` = recorrido celda a celda (comportamiento clásico lineal). `row` / `quadrant` = escaneo en dos pasos. */
  const scannerPattern = accessConfig?.scanner_pattern || 'cell'
  const scannerSpeed = accessConfig?.scanner_speed || 2.0

  return (
    <div className="theme-page-shell flex min-h-0 flex-1 flex-col overflow-hidden text-[var(--app-foreground)] dark:text-slate-100">
      <PendingSyncStatus isOnline={isOnline} shareUsageForPredictions={shareUsageForPredictions} />
      {/* Quick phrases */}
      {pinnedPhrases.length > 0 && (
        <QuickPhrases phrases={pinnedPhrases} onSpeak={handleQuickPhraseTap} />
      )}

      {showFrequentPhrasesSection && frequentPhrases.length > 0 && (
        <QuickPhrases title="Frecuentes" phrases={frequentPhrases} onSpeak={handleQuickPhraseTap} />
      )}

      {/* Phrase bar + sugerencias */}
      <div className="flex min-h-0 shrink-0 flex-col">
        <PhraseBar
          symbols={selectedSymbols}
          profile={profile}
          voiceConfig={null}
          canGoBackFolder={activeFolder !== null}
          onGoBackFolder={() => {
            recordNav('folder_back', { folderTarget: activeFolder })
            setFolderHistory(prev => {
              const stack = prev ?? []
              if (stack.length === 0) {
                setActiveFolder(null)
                return stack
              }
              const next = [...stack]
              const previousFolder = next.pop() || null
              setActiveFolder(previousFolder)
              return next
            })
          }}
          onGoHome={() => {
            recordNav('home', { folderTarget: activeFolder })
            setActiveFolder(null)
            setFolderHistory([])
            setActiveTab('grid')
          }}
          onDeleteLast={handleDeleteLast}
          onClearAll={handleClearAll}
          onPhraseSaved={loadPinnedPhrases}
          onRemoveSymbol={handleRemoveSymbol}
          onAfterSpeak={handleAfterSpeak}
          speakPhrase={(phrase) => speakText(phrase, profile?.id ?? '', voicePrefs)}
          externalCompositionReset={phraseCompositionReset}
          restMode={restMode}
          onRestModeToggle={
            showRestModeButton ? () => setRestMode((prev) => !prev) : undefined
          }
        />
        {showPhraseCompletionSection && activeTab !== 'keyboard' ? (
          <PhraseCompletionChips chips={completionChips} onPick={handleCompletionChipPick} />
        ) : null}
      </div>

      {/* Main content */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {activeTab === 'grid' ? (
          <SymbolGrid
            symbols={displayedSymbols}
            predictedIds={showGridCellPredictions ? predictedIds : []}
            cellSize={cellSize}
            onSymbolSelect={handleSymbolSelect}
            folders={[]}
            gridCols={profile?.gridCols || 14}
            gridRows={profile?.gridRows || 8}
            symbolsPaused={showRestModeButton && restMode}
          />
        ) : (
          <Keyboard
            theme={profile?.keyboardTheme ?? null}
            onTextAdd={async (text) => {
              if (showRestModeButton && restMode) return
              const analyzedTokens = await analyzeLexicalTextInput(text)
              if (analyzedTokens.length === 0) return

              const batchId = Date.now()
              const timestamp = new Date().toISOString()
              const pseudoSymbols = await Promise.all(
                analyzedTokens.map(async (token, index) => {
                  const id = `text-${batchId}-${index}`
                  const glyph =
                    keyboardPictoAutocomplete && symbols.length > 0
                      ? pickBoardGlyphForKeyboardToken(symbols, {
                          label: token.label,
                          normalizedLabel: token.normalizedLabel,
                          lexemeId: token.lexemeId ?? null,
                          detectedLemma: token.detectedLemma,
                        })
                      : null

                  let imageUrl: string | undefined = glyph?.imageUrl
                  let emoji: string | undefined = glyph?.emoji
                  let sourceSymbolId = glyph?.sourceSymbolId ?? id
                  let category: string = glyph?.category ?? 'Texto'

                  if (keyboardArasaacPictograms) {
                    const arUrl = await fetchFirstArasaacImage(token.label, {
                      detectedLemma: token.detectedLemma,
                    })
                    if (arUrl) {
                      imageUrl = arUrl
                      emoji = undefined
                      sourceSymbolId = id
                      category = 'Texto'
                    }
                  }

                  return {
                    id,
                    sourceSymbolId,
                    gridId: '',
                    label: token.label,
                    normalizedLabel: token.normalizedLabel,
                    emoji,
                    imageUrl,
                    category,
                    posType: token.symbolPosType,
                    posConfidence: token.confidence,
                    manualGrammarOverride: false,
                    lexemeId: token.lexemeId ?? null,
                    positionX: 0,
                    positionY: 0,
                    color: '#f3f4f6',
                    hidden: false,
                    state: 'visible',
                    createdAt: timestamp,
                    updatedAt: timestamp,
                  } as Symbol
                }),
              )

              setSelectedSymbols(prev => [...prev, ...pseudoSymbols])

              speakSelectedWord(text)

              if (!profile) {
                setPredictedIds([])
                return
              }

              const phraseSessionId = ensurePhraseSessionId(profile.id)
              const existingSequenceStart = phraseSequenceRef.current

              pseudoSymbols.forEach((pseudoSymbol, index) => {
                const previous =
                  index > 0
                    ? pseudoSymbols[index - 1]
                    : selectedSymbols[selectedSymbols.length - 1]

                persistSymbolUsage({
                  profileId: profile.id,
                  currentSymbol: toPredictionInput(pseudoSymbol),
                  previousSymbol: previous ? toPredictionInput(previous) : null,
                  phraseSessionId,
                  sequenceIndex: existingSequenceStart + index,
                })
              })

              phraseSequenceRef.current += pseudoSymbols.length

              const updatedRecentSymbols = [...selectedSymbols, ...pseudoSymbols]
                .slice(-3)
                .map(toPredictionInput)
              const phraseQuestionType = detectQuestionType(
                [...selectedSymbols, ...pseudoSymbols][0]?.label ?? '',
              )

              const lastPseudoSymbol = pseudoSymbols[pseudoSymbols.length - 1]

              if (!showGridCellPredictions) {
                setPredictedIds([])
                return
              }

              try {
                const prioritized = await getPredictionCandidates({
                  profileId: profile.id,
                  currentSymbol: toPredictionInput(lastPseudoSymbol),
                  recentSymbols: updatedRecentSymbols,
                  phraseQuestionType,
                  candidateSymbols: mainOrderedSymbols.map(toPredictionInput),
                })
                setPredictedIds(prioritized)
              } catch (err) {
                console.error('Error calculating predictions from keyboard input', err)
                setPredictedIds([])
              }
            }}
          />
        )}

        {/* Scanner overlay */}
        {showScanner && (
          <ScannerOverlay
            symbols={displayedSymbols}
            pattern={scannerPattern}
            speed={scannerSpeed}
            scanKey={accessConfig?.scan_key || 'Space'}
            onSelect={(symbol) => {
              if (!(showRestModeButton && restMode)) handleSymbolSelect(symbol)
            }}
          />
        )}
      </div>

      {/* Profile selector modal */}
      {showProfileSelector && (
        <ProfileSelector
          profiles={profiles}
          currentProfile={profile}
          onSelect={(p) => { setProfile(p); setShowProfileSelector(false) }}
          onClose={() => setShowProfileSelector(false)}
        />
      )}
    </div>
  )
}
