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
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { getProfiles } from '@/app/actions/profiles'
import { getProfileSymbols } from '@/app/actions/symbols'
import { getPinnedPhrases, getFrequentPhrases, saveQuickPhrase } from '@/app/actions/phrases'
import { getPhraseCompletionSuggestions, type PhraseCompletionChip } from '@/app/actions/phraseCompletion'
import { getPredictionCandidates, recordSymbolUsage } from '@/app/actions/predictions'
import {
  clearPendingUsageEvents,
  enqueuePendingUsageEvent,
  flushPendingUsageEvents,
  type PendingUsageEventPayload,
} from '@/lib/dexie/usageSyncQueue'
import { getVoiceSettings } from '@/app/actions/voiceSettings'
import { applyProfileGenders } from '@/lib/profileGender'
import { speakText } from '@/lib/voice/speakClient'
import type { SpeakVoicePrefs } from '@/lib/voice/speakClient'
import type { Symbol, Profile, Phrase, AccessConfig } from '@/lib/supabase/types'
import type { KeyboardThemeColors } from '@/lib/keyboard/theme'
import type { DefaultTableroTab } from '@/lib/account/defaultTableroTab'

type TabMode = 'grid' | 'keyboard'

type AppInterfaceProps = {
  /** Preferencia de cuenta para la primera pintura (SSR); evita mostrar el grid y luego el teclado. */
  initialDefaultTableroTab?: DefaultTableroTab
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
}

type PredictionInputSymbol = {
  id: string
  label: string
  posType: Symbol['posType']
  lexemeId?: string | null
  category?: string | null
  state?: string
}


export default function AppInterface({
  initialDefaultTableroTab = 'grid',
}: AppInterfaceProps = {}) {
  const [profile, setProfile] = useState<LocalProfile | null>(null)
  const [profiles, setProfiles] = useState<LocalProfile[]>([])
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([])
  const [pinnedPhrases, setPinnedPhrases] = useState<Phrase[]>([])
  const [frequentPhrases, setFrequentPhrases] = useState<Phrase[]>([])
  /** Fila «Frecuentes» en /tablero; preferencia de cuenta (por defecto visible). */
  const [showFrequentPhrasesSection, setShowFrequentPhrasesSection] = useState(true)
  /** Franja «Siguiente» (chips bajo la barra); no afecta a predicciones en celdas. */
  const [showPhraseCompletionSection, setShowPhraseCompletionSection] = useState(true)
  /** Iluminación predictiva en celdas del grid (independiente de la franja «Siguiente»). */
  const [showGridCellPredictions, setShowGridCellPredictions] = useState(true)
  /** Guardar pulsaciones para aprendizaje de predicciones (preferencia de privacidad en cuenta). */
  const [shareUsageForPredictions, setShareUsageForPredictions] = useState(true)
  /** Incrementa al inyectar una frase rápida/frecuente para limpiar conjugación en PhraseBar. */
  const [phraseCompositionReset, setPhraseCompositionReset] = useState(0)
  const [completionChips, setCompletionChips] = useState<PhraseCompletionChip[]>([])
  const [accessConfig, setAccessConfig] = useState<AccessConfig | null>(null)
  const [activeTab, setActiveTab] = useState<TabMode>(initialDefaultTableroTab)
  const [isOnline, setIsOnline] = useState(true)
  const [predictedIds, setPredictedIds] = useState<string[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [, setFolderHistory] = useState<string[]>([])
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  const phraseSessionIdRef = useRef<string | null>(null)
  const phraseSequenceRef = useRef(0)
  const [voicePrefs, setVoicePrefs] = useState<SpeakVoicePrefs>({ ttsMode: 'browser', voiceId: null })
  const profileId = profile?.id ?? ''

  const shouldUseDefaultGridTemplate = Boolean(profile?.isDemo)
  const fixedZoneKeySet = useMemo(() => {
    if (profile?.fixedZoneCellKeys === undefined || profile?.fixedZoneCellKeys === null) {
      return null
    }
    return new Set(profile.fixedZoneCellKeys)
  }, [profile?.fixedZoneCellKeys])

  const mainOrderedSymbols = useMemo(() => {
    if (shouldUseDefaultGridTemplate) {
      return computeMainGrid(symbols, activeFolder)
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
    fixedZoneKeySet,
  ])

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

  const subscribeToChanges = useCallback(() => {
    const onStorage = () => {
      void loadProfiles()
      void loadSymbols()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [loadProfiles, loadSymbols])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  useEffect(() => {
    void getAccountSettings().then((s) => {
      if (!s) return
      if (typeof s.showFrequentPhrasesSection === 'boolean') {
        setShowFrequentPhrasesSection(s.showFrequentPhrasesSection)
      }
      if (typeof s.showPhraseCompletionSection === 'boolean') {
        setShowPhraseCompletionSection(s.showPhraseCompletionSection)
      }
      if (typeof s.showGridCellPredictions === 'boolean') {
        setShowGridCellPredictions(s.showGridCellPredictions)
      }
      setActiveTab(parseDefaultTableroTab(s.defaultTableroTab))
      const share = s.shareUsageForPredictions !== false
      setShareUsageForPredictions(share)
      if (!share) void clearPendingUsageEvents()
    })
  }, [])

  useEffect(() => {
    if (!showGridCellPredictions) {
      setPredictedIds([])
    }
  }, [showGridCellPredictions])

  useEffect(() => {
    if (!profileId) return

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
    const normalizedLabel = symbol.label.toLowerCase()

    if (shouldUseDefaultGridTemplate) {
      if (activeFolder === 'Más verbos' && normalizedLabel === 'más') {
        setFolderHistory(prev => [...(prev ?? []), 'Más verbos'])
        setActiveFolder('Más verbos · página 2')
        setPredictedIds([])
        return
      }
      if (DEFAULT_FOLDER_CONTENTS[symbol.label] && symbol.label !== activeFolder) {
        setFolderHistory(prev => (activeFolder ? [...(prev ?? []), activeFolder] : (prev ?? [])))
        setActiveFolder(symbol.label)
        setPredictedIds([])
        return
      }
    } else if (
      symbol.category === 'Carpetas' &&
      symbol.id &&
      !String(symbol.id).startsWith('folder-')
    ) {
      setFolderHistory((prev) => (activeFolder ? [...(prev ?? []), activeFolder] : (prev ?? [])))
      setActiveFolder(symbol.id)
      setPredictedIds([])
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

    const rawPhraseLabel = choice?.phraseLabel ?? symbol.label
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
    speakSelectedWord(normalizedTokenLabel)

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
    ensurePhraseSessionId,
    mainOrderedSymbols,
    persistSymbolUsage,
    profile,
    selectedSymbols,
    shouldUseDefaultGridTemplate,
    showGridCellPredictions,
    speakSelectedWord,
    symbols,
  ])

  useEffect(() => {
    if (!showPhraseCompletionSection) {
      setCompletionChips((prev) => {
        const safe = prev ?? []
        return safe.length === 0 ? safe : []
      })
      return
    }
    if (!profile || selectedSymbols.length === 0) {
      // Evitar setState con [] en cada render: nuevo [] dispara re-render y bucle infinito en el efecto.
      setCompletionChips((prev) => {
        const safe = prev ?? []
        return safe.length === 0 ? safe : []
      })
      return
    }
    const inputs = selectedSymbols.map((s) =>
      toPredictionFromPhraseSelection(s as Symbol & { sourceSymbolId?: string }),
    )
    const candidates = mainOrderedSymbols.map((c) => ({
      id: c.id,
      label: c.label,
      posType: c.posType,
      lexemeId: c.lexemeId ?? null,
      category: c.category ?? null,
      state: c.state,
    }))
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
  ])

  const handleDeleteLast = () => {
    setSelectedSymbols(prev => prev.slice(0, -1))
    setPredictedIds([])
    if (selectedSymbols.length <= 1) {
      resetPhraseTracking()
    }
  }

  const handleClearAll = () => {
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
      const sym = mainOrderedSymbols.find((s) => s.id === symbolId)
      if (sym) void handleSymbolSelect(sym)
    },
    [mainOrderedSymbols, handleSymbolSelect],
  )

  const handleAfterSpeak = useCallback(
    async (payload: { text: string; symbolsUsed: { id: string; label: string }[] }) => {
      if (!profile) return
      try {
        await saveQuickPhrase(profile.id, payload.text, payload.symbolsUsed)
        if (showFrequentPhrasesSection) {
          await loadFrequentPhrases()
        }
      } catch (err) {
        console.error('Error saving phrase after speak', err)
      }
    },
    [profile, loadFrequentPhrases, showFrequentPhrasesSection],
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
      showFrequentPhrasesSection,
    ],
  )

  const cellSize = accessConfig?.grid_cell_size || 'medium'
  const showScanner = accessConfig?.show_scanner || false
  /** `cell` = recorrido celda a celda (comportamiento clásico lineal). `row` / `quadrant` = escaneo en dos pasos. */
  const scannerPattern = accessConfig?.scanner_pattern || 'cell'
  const scannerSpeed = accessConfig?.scanner_speed || 2.0

  return (
    <div className="theme-page-shell flex h-screen min-h-0 flex-col overflow-hidden text-slate-900 dark:text-slate-100">
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
        />
        {showPhraseCompletionSection ? (
          <PhraseCompletionChips chips={completionChips} onPick={handleCompletionChipPick} />
        ) : null}
      </div>

      {/* Main content */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {activeTab === 'grid' ? (
          <SymbolGrid
            symbols={mainOrderedSymbols}
            predictedIds={showGridCellPredictions ? predictedIds : []}
            cellSize={cellSize}
            onSymbolSelect={handleSymbolSelect}
            folders={[]}
            gridCols={profile?.gridCols || 14}
            gridRows={profile?.gridRows || 8}
          />
        ) : (
          <Keyboard
            theme={profile?.keyboardTheme ?? null}
            onTextAdd={async (text) => {
              const analyzedTokens = await analyzeLexicalTextInput(text)
              if (analyzedTokens.length === 0) return

              const batchId = Date.now()
              const timestamp = new Date().toISOString()
              const pseudoSymbols = analyzedTokens.map((token, index) => ({
                id: `text-${batchId}-${index}`,
                sourceSymbolId: `text-${batchId}-${index}`,
                gridId: '',
                label: token.label,
                normalizedLabel: token.normalizedLabel,
                emoji: undefined,
                imageUrl: undefined,
                category: 'Texto',
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
              } as Symbol))

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
            symbols={mainOrderedSymbols}
            pattern={scannerPattern}
            speed={scannerSpeed}
            scanKey={accessConfig?.scan_key || 'Space'}
            onSelect={handleSymbolSelect}
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
