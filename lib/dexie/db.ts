import Dexie, { type Table } from 'dexie'
import type { Symbol, Phrase, AccessConfig } from '@/lib/supabase/types'

export interface AudioCacheEntry {
  id?: number
  hash: string
  voiceId: string
  profileId: string
  blob: Blob
  text: string
  sizeBytes: number
  lastUsedAt: number
  createdAt: number
}

export interface PendingSync {
  id?: number
  type: 'phrase' | 'usage_event'
  data: Record<string, unknown>
  createdAt: number
}

export class LumaGridDB extends Dexie {
  symbols!: Table<Symbol>
  phrases!: Table<Phrase>
  audioCache!: Table<AudioCacheEntry>
  pendingSync!: Table<PendingSync>
  accessConfig!: Table<AccessConfig & { profileId: string }>

  constructor() {
    super('LumaGridDB')
    this.version(1).stores({
      symbols: 'id, grid_id, category, pos_type, label',
      phrases: 'id, profile_id, is_pinned, created_at',
      audioCache: '++id, hash, voiceId, profileId, lastUsedAt',
      pendingSync: '++id, type, createdAt',
      accessConfig: 'id, profileId',
    })
  }
}

export const db = new LumaGridDB()

export async function cleanOldAudioCache(profileId: string, maxSizeBytes = 100 * 1024 * 1024) {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000

  // Remove entries older than 90 days
  await db.audioCache
    .where('profileId').equals(profileId)
    .and(entry => entry.lastUsedAt < ninetyDaysAgo)
    .delete()

  // Check total size and remove oldest if over limit
  const entries = await db.audioCache
    .where('profileId').equals(profileId)
    .toArray()

  const totalSize = entries.reduce((sum, e) => sum + e.sizeBytes, 0)

  if (totalSize > maxSizeBytes) {
    const sorted = entries.sort((a, b) => a.lastUsedAt - b.lastUsedAt)
    let currentSize = totalSize
    for (const entry of sorted) {
      if (currentSize <= maxSizeBytes) break
      await db.audioCache.delete(entry.id!)
      currentSize -= entry.sizeBytes
    }
  }
}
