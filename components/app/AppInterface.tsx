'use client'

import { useState, useEffect, useCallback } from 'react'
import SymbolGrid from './SymbolGrid'
import PhraseBar from './PhraseBar'
import Keyboard from './Keyboard'
import QuickPhrases from './QuickPhrases'
import ScannerOverlay from './ScannerOverlay'
import ProfileSelector from './ProfileSelector'
import { db } from '@/lib/dexie/db'
import { DEFAULT_FOLDER_CONTENTS, DEFAULT_FOLDER_TILES, DEFAULT_SYMBOLS } from '@/lib/data/defaultSymbols'
import { getLocalProfiles, getLocalSymbols } from '@/lib/localGridStore'
import { applyProfileGenders } from '@/lib/profileGender'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'
import type { Symbol, Profile, Phrase, AccessConfig } from '@/lib/supabase/types'

type TabMode = 'grid' | 'keyboard'

const MAIN_LAYOUT_ORDER = [
  // Banda izquierda tipo pronombres/personas
  'Yo', 'Tú', 'Él', 'Ella', 'Nosotros', 'Vosotros', 'Personas',
  'Sí', 'No', 'No lo sé', 'Bien', 'Mal',
  // Núcleo verbal
  'Querer', 'Gustar', 'Ir', 'Dar', 'Poner', 'Necesitar', 'Ser', 'Sentir',
  'Hacer', 'Escuchar', 'Pensar', 'Coger', 'Ver', 'Estar', 'Jugar', 'Tener',
  'Ayudar', 'Ahora', 'Comer', 'Beber', 'Poder', 'Terminar', 'Decir', 'Más verbos',
  // Conectores / funcionales
  'Y', 'A', 'DE', 'CON', 'UN', 'Más palabras', 'Aquí', 'Ayer', 'Hoy', 'Mañana', 'Muy', 'También',
  // Carpetas semánticas tipo Grid 3
  'Alimentos', 'Lácteos', 'Objetos', 'Lugares', 'Cuerpo', 'Bebidas', 'Muebles', 'Ropa',
  'Juegos', 'Sentimientos', 'Tiempo', 'Complementos', 'Aparatos', 'Animales', 'Colores',
  'Transportes', 'Plantas', 'Fiesta', 'Conceptos', 'Actividades', 'Descripción', 'Formas y medidas',
  'Aficiones', 'Frases hechas', 'Teclado', 'Números',
]

const MAIN_GRID_TEMPLATE: string[][] = [
  ['Yo', 'Tú', 'Querer', 'Gustar', 'Ir', 'Dar', 'Charla rápida', '¿Qué?', '¿Quién?', '¿Dónde?', '¿Cuándo?', '¿Cómo?', '¿Por qué?', ''],
  ['Él', 'Ella', 'Poner', 'Necesitar', 'Ser', 'Sentir', 'Y', 'Alimentos', '', 'Objetos', '', 'Lugares', '', 'Cuerpo'],
  ['Nosotros', 'Ellos', 'Hacer', 'Escuchar', 'Pensar', 'Coger', 'A', '', 'Bebidas', '', 'Muebles', '', 'Ropa', ''],
  ['Vosotros', 'Este', 'Ver', 'Estar', 'Jugar', 'Tener', 'DE', 'Juegos', '', 'Sentimientos', '', 'Tiempo', '', 'Complementos'],
  ['Personas', 'Ayudar', 'Ahora', 'Comer', 'Beber', 'Poder', 'CON', '', 'Aparatos', '', 'Animales', '', 'Colores', ''],
  ['Sí', 'No', 'Después', 'Terminar', 'Decir', 'Más verbos', 'UN', 'Transportes', '', 'Plantas', '', 'Fiesta', '', 'Conceptos'],
  ['Más', 'No lo sé', 'Aquí', 'Ayer', 'Hoy', 'Mañana', 'Partículas', '', 'Actividades', '', 'Descripción', '', 'Formas y medidas', ''],
  ['Bien', 'Mal', 'Mucho', 'Diferente', 'Muy', 'También', 'Teclado', 'Números', '', 'Aficiones', '', 'Frases hechas', '', 'Más'],
]
const FIXED_COLUMNS = 7
const TOTAL_COLUMNS = 14

export default function AppInterface() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([])
  const [pinnedPhrases, setPinnedPhrases] = useState<Phrase[]>([])
  const [accessConfig, setAccessConfig] = useState<AccessConfig | null>(null)
  const [activeTab, setActiveTab] = useState<TabMode>('grid')
  const [isOnline, setIsOnline] = useState(true)
  const [predictedIds, setPredictedIds] = useState<string[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [folderHistory, setFolderHistory] = useState<string[]>([])
  const [showProfileSelector, setShowProfileSelector] = useState(false)

  const speakSelectedWord = useCallback((text: string) => {
    if (!text.trim()) return
    const adapter = new WebSpeechAdapter(undefined, 1.0, 1.0)
    adapter.speak(text, profile?.id || '').catch(() => {})
  }, [profile])

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
    loadProfiles()
  }, [])

  useEffect(() => {
    if (profile) {
      setActiveFolder(null)
      setFolderHistory([])
      loadSymbols()
      loadPinnedPhrases()
      loadAccessConfig()
      subscribeToChanges()
    }
  }, [profile])

  const loadProfiles = async () => {
    const localProfiles = applyProfileGenders(getLocalProfiles())
    setProfiles(localProfiles)
    setProfile(localProfiles[0] ?? null)
  }

  const loadSymbols = async () => {
    const local = getLocalSymbols()
    setSymbols(local)
    await db.symbols.bulkPut(local)
  }

  const loadPinnedPhrases = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('phrases')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('is_pinned', true)
        .order('use_count', { ascending: false })
        .limit(10)

      if (data) setPinnedPhrases(data)
    } catch {
      const local = await db.phrases
        .where('profile_id').equals(profile.id)
        .and(p => p.is_pinned)
        .limit(10)
        .toArray()
      setPinnedPhrases(local)
    }
  }

  const loadAccessConfig = async () => {
    setAccessConfig(null)
  }

  const subscribeToChanges = () => {
    const onStorage = () => {
      loadProfiles()
      loadSymbols()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }

  const handleSymbolSelect = useCallback((symbol: Symbol) => {
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

    setSelectedSymbols(prev => [
      ...prev,
      {
        ...symbol,
        label: normalizedTokenLabel,
        // Cada pulsación crea una entrada única para permitir repetición consecutiva.
        id: `${symbol.id}-sel-${Date.now()}-${prev.length}`,
      },
    ])
    speakSelectedWord(normalizedTokenLabel)

    // Local prediction
    const posType = symbol.pos_type
    let prioritized: string[] = []
    if (posType === 'pronoun') {
      prioritized = symbols.filter(s => s.pos_type === 'verb').map(s => s.id).slice(0, 8)
    } else if (posType === 'verb') {
      prioritized = symbols.filter(s => s.pos_type === 'noun' || s.pos_type === 'adj').map(s => s.id).slice(0, 8)
    } else if (symbol.label.toLowerCase() === 'no') {
      prioritized = symbols.filter(s => s.pos_type === 'verb').map(s => s.id).slice(0, 8)
    }
    setPredictedIds(prioritized)

    // Track usage
    if (profile) {
      void profile.id
    }
  }, [symbols, profile, speakSelectedWord])

  const handleDeleteLast = () => {
    setSelectedSymbols(prev => prev.slice(0, -1))
  }

  const handleClearAll = () => {
    setSelectedSymbols([])
    setPredictedIds([])
  }

  const handleQuickPhrase = async (phrase: Phrase) => {
    if (!profile) return
    await db.phrases.put({ ...phrase, use_count: phrase.use_count + 1 })
  }

  const folderSymbols = activeFolder
    ? (DEFAULT_FOLDER_CONTENTS[activeFolder] || []).map((label, i) => ({
      id: `folder-item-${activeFolder}-${i}`,
      grid_id: 'demo',
      label,
      emoji: symbols.find(s => s.label.toLowerCase() === label.toLowerCase())?.emoji || '🧩',
      category: activeFolder,
      pos_type: 'noun' as const,
      position_x: (i % (TOTAL_COLUMNS - FIXED_COLUMNS)) + FIXED_COLUMNS,
      position_y: Math.floor(i / (TOTAL_COLUMNS - FIXED_COLUMNS)),
      color: '#f8fafc',
      hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    : []

  const mainOrderedSymbols = (() => {
    const byLabel = new Map(symbols.map(symbol => [symbol.label.toLowerCase(), symbol]))

    const fixedLeftPanel: Symbol[] = []
    MAIN_GRID_TEMPLATE.forEach((row, y) => {
      row.forEach((label, x) => {
        if (!label || x >= FIXED_COLUMNS) return
        const existing = byLabel.get(label.toLowerCase())
        if (existing) {
          fixedLeftPanel.push({
            ...existing,
            position_x: x,
            position_y: y,
          })
          return
        }

        // Siempre mantener visible la columna fija izquierda.
        fixedLeftPanel.push({
          id: `fixed-left-${label.toLowerCase().replace(/\s+/g, '-')}`,
          grid_id: 'template-left',
          label,
          emoji: x === FIXED_COLUMNS - 1 ? undefined : '❔',
          category: 'Fijo',
          pos_type: 'other',
          position_x: x,
          position_y: y,
          color: x === FIXED_COLUMNS - 1 ? '#f3f4f6' : '#e5f6e6',
          hidden: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      })
    })

    if (activeFolder) {
      return [...fixedLeftPanel, ...folderSymbols]
    }

    const rightPanelFromTemplate: Symbol[] = []
    MAIN_GRID_TEMPLATE.forEach((row, y) => {
      row.forEach((label, x) => {
        if (!label || x < FIXED_COLUMNS) return
        const existing = byLabel.get(label.toLowerCase())
        if (existing) {
          rightPanelFromTemplate.push({
            ...existing,
            position_x: x,
            position_y: y,
          })
          return
        }

        rightPanelFromTemplate.push({
          id: `template-${label.toLowerCase().replace(/\s+/g, '-')}`,
          grid_id: 'template',
          label,
          emoji: '❔',
          category: 'Carpetas',
          pos_type: 'other',
          position_x: x,
          position_y: y,
          color: '#f3f4f6',
          hidden: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      })
    })

    return [...fixedLeftPanel, ...rightPanelFromTemplate]
  })()

  const cellSize = accessConfig?.grid_cell_size || 'medium'
  const showKeyboard = accessConfig?.show_keyboard !== false
  const showScanner = accessConfig?.show_scanner || false
  const scannerPattern = accessConfig?.scanner_pattern || 'row'
  const scannerSpeed = accessConfig?.scanner_speed || 2.0

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#e7ebf3]">
      {/* Quick phrases */}
      {pinnedPhrases.length > 0 && (
        <QuickPhrases
          phrases={pinnedPhrases}
          profile={profile}
          onSpeak={handleQuickPhrase}
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
          />
        ) : (
          <Keyboard
            onTextAdd={(text) => {
              // Add text as a pseudo-symbol
              const pseudoSymbol: Symbol = {
                id: `text-${Date.now()}`,
                grid_id: '',
                label: text,
                emoji: undefined,
                category: 'Texto',
                pos_type: 'noun',
                position_x: 0,
                position_y: 0,
                color: '#f3f4f6',
                hidden: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              setSelectedSymbols(prev => [...prev, pseudoSymbol])
              speakSelectedWord(text)
            }}
          />
        )}

        {/* Scanner overlay */}
        {showScanner && (
          <ScannerOverlay
            symbols={filteredSymbols}
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
