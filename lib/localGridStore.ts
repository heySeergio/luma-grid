import { DEFAULT_FOLDER_TILES, DEFAULT_SYMBOLS } from '@/lib/data/defaultSymbols'
import type { Profile, Symbol } from '@/lib/supabase/types'

const PROFILES_KEY = 'luma.local.profiles.v1'
const SYMBOLS_KEY = 'luma.local.symbols.v1'

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function buildDefaultSymbols(): Symbol[] {
  const now = new Date().toISOString()
  const base = DEFAULT_SYMBOLS.map((symbol, index) => ({
    ...symbol,
    id: `local-symbol-${index}`,
    grid_id: 'local-grid-1',
    created_at: now,
    updated_at: now,
  }))
  const folders = DEFAULT_FOLDER_TILES.map((symbol, index) => ({
    ...symbol,
    id: `folder-local-${index}-${symbol.label.toLowerCase()}`,
    grid_id: 'local-grid-1',
    created_at: now,
    updated_at: now,
  }))
  return [...base, ...folders]
}

function buildDefaultProfiles(): Profile[] {
  const now = new Date().toISOString()
  return [{
    id: 'local-profile-1',
    name: 'Demo',
    avatar: '🙂',
    color: '#6366f1',
    created_at: now,
    updated_at: now,
    archived: false,
    communication_gender: 'male',
  }]
}

export function initLocalGridStore() {
  if (!readJson<Profile[]>(PROFILES_KEY)) writeJson(PROFILES_KEY, buildDefaultProfiles())
  if (!readJson<Symbol[]>(SYMBOLS_KEY)) writeJson(SYMBOLS_KEY, buildDefaultSymbols())
}

export function getLocalProfiles(): Profile[] {
  initLocalGridStore()
  return readJson<Profile[]>(PROFILES_KEY) ?? buildDefaultProfiles()
}

export function saveLocalProfiles(profiles: Profile[]) {
  writeJson(PROFILES_KEY, profiles)
}

export function getLocalSymbols(): Symbol[] {
  initLocalGridStore()
  return readJson<Symbol[]>(SYMBOLS_KEY) ?? buildDefaultSymbols()
}

export function saveLocalSymbols(symbols: Symbol[]) {
  writeJson(SYMBOLS_KEY, symbols)
}
