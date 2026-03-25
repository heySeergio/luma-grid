'use client'

import { X } from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'

interface Props {
  profiles: Profile[]
  currentProfile: Profile | null
  onSelect: (profile: Profile) => void
  onClose: () => void
}

export default function ProfileSelector({ profiles, currentProfile, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Seleccionar perfil</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                currentProfile?.id === profile.id
                  ? 'bg-indigo-50 border-2 border-indigo-400'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ backgroundColor: profile.color }}
              >
                {profile.avatar || profile.name[0]}
              </div>
              <span className="text-lg font-semibold text-gray-800">{profile.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
