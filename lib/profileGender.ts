import type { Profile, ProfileGender } from '@/lib/supabase/types'

const STORAGE_KEY = 'luma.profile.gender.map.v1'

type GenderMap = Record<string, ProfileGender>

function readMap(): GenderMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as GenderMap
  } catch {
    return {}
  }
}

function writeMap(map: GenderMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getProfileGender(profileId: string): ProfileGender | undefined {
  const map = readMap()
  return map[profileId]
}

export function setProfileGender(profileId: string, gender: ProfileGender) {
  const map = readMap()
  map[profileId] = gender
  writeMap(map)
}

export function applyProfileGenders(profiles: Profile[]): Profile[] {
  const map = readMap()
  return profiles.map(profile => ({
    ...profile,
    communication_gender: map[profile.id] ?? profile.communication_gender,
  }))
}
