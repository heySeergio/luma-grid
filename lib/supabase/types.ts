export type PosType = 'pronoun' | 'verb' | 'noun' | 'adj' | 'adverb' | 'prep' | 'other'
export type VoiceEngine = 'webspeech' | 'elevenlabs'
export type ScannerPattern = 'row' | 'cell' | 'quadrant'
export type GridCellSize = 'small' | 'medium' | 'large'
export type EventType = 'symbol_tap' | 'phrase_spoken' | 'quick_phrase' | 'scanner_select'
export type ProfileGender = 'male' | 'female'

export interface Profile {
  id: string
  name: string
  avatar?: string
  color: string
  communicationGender?: ProfileGender
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface Grid {
  id: string
  profileId: string
  name: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

export interface Symbol {
  id: string
  gridId: string
  sourceSymbolId?: string
  label: string
  normalizedLabel?: string
  emoji?: string
  imageUrl?: string
  category: string
  posType: PosType
  posConfidence?: number | null
  manualGrammarOverride?: boolean
  lexemeId?: string | null
  positionX: number
  positionY: number
  color: string
  hidden: boolean
  state: string
  arasaacId?: number
  createdAt: string
  updatedAt: string
}

export interface Phrase {
  id: string
  profileId: string
  text: string
  symbolsUsed: Array<{ id: string; label: string }>
  createdAt: string
  isPinned: boolean
  useCount: number
}

export interface VoiceConfig {
  id: string
  profile_id: string
  engine: VoiceEngine
  system_voice_id?: string
  system_rate: number
  system_pitch: number
  elevenlabs_key_encrypted?: string
  elevenlabs_voice_id?: string
  elevenlabs_rate: number
  elevenlabs_stability: number
}

export interface AudioCacheMeta {
  id: string
  profile_id: string
  text_hash: string
  voice_id: string
  size_bytes: number
  last_used_at: string
  created_at: string
}

export interface UsageEvent {
  id: string
  profile_id: string
  symbol_id?: string
  phrase_id?: string
  event_type: EventType
  created_at: string
}

export interface AccessConfig {
  id: string
  profile_id: string
  kiosk_pin?: string
  show_grid_editor: boolean
  show_keyboard: boolean
  show_scanner: boolean
  scanner_pattern: ScannerPattern
  scanner_speed: number
  scan_key: string
  grid_cell_size: GridCellSize
  prediction_enabled: boolean
}
