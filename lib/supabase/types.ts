export type PosType = 'pronoun' | 'verb' | 'noun' | 'adj' | 'adverb' | 'other'
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
  communication_gender?: ProfileGender
  created_at: string
  updated_at: string
  archived: boolean
}

export interface Grid {
  id: string
  profile_id: string
  name: string
  is_shared: boolean
  created_at: string
  updated_at: string
}

export interface Symbol {
  id: string
  grid_id: string
  label: string
  emoji?: string
  image_url?: string
  category: string
  pos_type: PosType
  position_x: number
  position_y: number
  color: string
  hidden: boolean
  arasaac_id?: number
  created_at: string
  updated_at: string
}

export interface Phrase {
  id: string
  profile_id: string
  text: string
  symbols_used: Array<{ id: string; label: string }>
  created_at: string
  is_pinned: boolean
  use_count: number
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
