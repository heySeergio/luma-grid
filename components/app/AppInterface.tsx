'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import SymbolGrid from './SymbolGrid'
import PhraseBar from './PhraseBar'
import Keyboard from './Keyboard'
import QuickPhrases from './QuickPhrases'
import ScannerOverlay from './ScannerOverlay'
import ProfileSelector from './ProfileSelector'
import { analyzeLexicalTextInput } from '@/app/actions/lexicon'
import { DEFAULT_FOLDER_CONTENTS, computeMainGrid } from '@/lib/data/defaultSymbols'
import { detectQuestionType } from '@/lib/lexicon/questions'
import { getProfiles } from '@/app/actions/profiles'
import { getProfileSymbols } from '@/app/actions/symbols'
import { getPinnedPhrases, saveQuickPhrase } from '@/app/actions/phrases'
import { getPredictionCandidates, recordSymbolUsage } from '@/app/actions/predictions'
import {
  enqueuePendingUsageEvent,
  flushPendingUsageEvents,
  type PendingUsageEventPayload,
} from '@/lib/dexie/usageSyncQueue'
import { getVoiceSettings } from '@/app/actions/voiceSettings'
import { applyProfileGenders } from '@/lib/profileGender'
import { speakText } from '@/lib/voice/speakClient'
import type { SpeakVoicePrefs } from '@/lib/voice/speakClient'
import type { Symbol, Profile, Phrase, AccessConfig } from '@/lib/supabase/types'

type TabMode = 'grid' | 'keyboard'

type LocalProfile = Profile & {
  isDemo?: boolean
  gridCols?: number
  gridRows?: number
  communication_gender?: 'male' | 'female'
}

type PredictionInputSymbol = {
  id: string
  label: string
  posType: Symbol['posType']
  lexemeId?: string | null
  category?: string | null
  state?: string
}


export default function AppInterface() {
  const [profile, setProfile] = useState<LocalProfile | null>(null)
  const [profiles, setProfiles] = useState<LocalProfile[]>([])
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([])
  const [pinnedPhrases, setPinnedPhrases] = useState<Phrase[]>([])
  const [accessConfig, setAccessConfig] = useState<AccessConfig | null>(null)
  const [activeTab, setActiveTab] = useState<TabMode>('grid')
  const [, setIsOnline] = useState(true)
  const [predictedIds, setPredictedIds] = useState<string[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [, setFolderHistory] = useState<string[]>([])
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  const phraseSessionIdRef = useRef<string | null>(null)
  const phraseSequenceRef = useRef(0)
  const [voicePrefs, setVoicePrefs] = useState<SpeakVoicePrefs>({ ttsMode: 'browser', voiceId: null })

  const shouldUseDefaultGridTemplate = Boolean(profile?.isDemo)
  const mainOrderedSymbols = shouldUseDefaultGridTemplate
    ? computeMainGrid(symbols, activeFolder)
    : symbols

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

  const persistSymbolUsage = useCallback((payload: PendingUsageEventPayload) => {
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
  }, [])

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
      setProfile(profilesWithGender[0] ?? null)
    } catch (err) {
      console.error('Error fetching profiles', err)
    }
  }, [])

  const loadSymbols = useCallback(async () => {
    if (!profile) return
    try {
      const dbSymbols = await getProfileSymbols(profile.id) as Symbol[]
      setSymbols(dbSymbols)
    } catch (err) {
      console.error('Error fetching symbols', err)
    }
  }, [profile])

  const loadPinnedPhrases = useCallback(async () => {
    if (!profile) return
    try {
      const phrases = await getPinnedPhrases(profile.id) as Phrase[]
      setPinnedPhrases(phrases)
    } catch (err) {
      console.error('Error fetching pinned phrases', err)
    }
  }, [profile])

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
    if (!profile) return

    resetPhraseTracking()
    setActiveFolder(null)
    setFolderHistory([])
    void loadSymbols()
    void loadPinnedPhrases()
    void loadAccessConfig()

    return subscribeToChanges()
  }, [profile, resetPhraseTracking, loadSymbols, loadPinnedPhrases, loadAccessConfig, subscribeToChanges])

  const handleSymbolSelect = useCallback(async (symbol: Symbol) => {
    const normalizedLabel = symbol.label.toLowerCase()
    if (activeFolder === 'Más verbos' && normalizedLabel === 'más') {
      setFolderHistory(prev => [...prev, 'Más verbos'])
      setActiveFolder('Más verbos · página 2')
      setPredictedIds([])
      return
    }

    if (DEFAULT_FOLDER_CONTENTS[symbol.label] && symbol.label !== activeFolder) {
      setFolderHistory(prev => (activeFolder ? [...prev, activeFolder] : prev))
      setActiveFolder(symbol.label)
      setPredictedIds([])
      return
    }

    if (normalizedLabel === 'números' || normalizedLabel === 'numeros' || normalizedLabel === 'teclado') {
      setActiveTab('keyboard')
      setActiveFolder(null)
      setFolderHistory([])
      return
    }

    const normalizedTokenLabel =
      symbol.label === 'Y' ? 'y' : symbol.label === 'A' ? 'a' : symbol.label
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
  }, [activeFolder, ensurePhraseSessionId, mainOrderedSymbols, persistSymbolUsage, profile, selectedSymbols, setFolderHistory, speakSelectedWord, symbols])

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

  const handleQuickPhrase = async (phrase: Phrase) => {
    if (!profile) return
    try {
      await saveQuickPhrase(profile.id, phrase.text, phrase.symbolsUsed)
    } catch (err) {
      console.error('Error saving quick phrase', err)
    }
  }

  const cellSize = accessConfig?.grid_cell_size || 'medium'
  const showScanner = accessConfig?.show_scanner || false
  const scannerPattern = accessConfig?.scanner_pattern || 'row'
  const scannerSpeed = accessConfig?.scanner_speed || 2.0

  return (
    <div className="theme-page-shell flex h-screen flex-col overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Quick phrases */}
      {pinnedPhrases.length > 0 && (
        <QuickPhrases
          phrases={pinnedPhrases}
          profile={profile}
          onSpeak={handleQuickPhrase}
          speakText={(text) => speakText(text, profile?.id ?? '', voicePrefs)}
        />
      )}

      {/* Phrase bar */}
      <PhraseBar
        symbols={selectedSymbols}
        profile={profile}
        voiceConfig={null}
        canGoBackFolder={activeFolder !== null}
        onGoBackFolder={() => {
          setFolderHistory(prev => {
            if (prev.length === 0) {
              setActiveFolder(null)
              return prev
            }
            const next = [...prev]
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
        speakPhrase={(phrase) => speakText(phrase, profile?.id ?? '', voicePrefs)}
      />

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'grid' ? (
          <SymbolGrid
            symbols={mainOrderedSymbols}
            predictedIds={predictedIds}
            cellSize={cellSize}
            onSymbolSelect={handleSymbolSelect}
            folders={[]}
            gridCols={profile?.gridCols || 14}
            gridRows={profile?.gridRows || 8}
          />
        ) : (
          <Keyboard
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
