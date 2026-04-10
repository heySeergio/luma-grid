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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl" style={{ background: 'var(--app-modal-backdrop)' }}>
      <div className="ui-modal-panel w-full max-w-sm rounded-[2rem]">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Seleccionar tablero</h2>
          <button onClick={onClose} className="ui-icon-button rounded-xl p-2 dark:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-2 p-4">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile)}
              className={`flex w-full items-center gap-3 rounded-[1.35rem] border p-3 transition-all ${
                currentProfile?.id === profile.id
                  ? 'bg-indigo-50/80 shadow-sm dark:bg-indigo-500/15'
                  : 'hover:translate-y-[-1px]'
              }`}
              style={{
                borderColor: currentProfile?.id === profile.id ? 'var(--app-predicted-border)' : 'var(--app-border)',
                background: currentProfile?.id === profile.id ? 'var(--app-predicted)' : 'var(--app-surface)',
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ backgroundColor: profile.color }}
              >
                {profile.avatar || profile.name[0]}
              </div>
              <span className="text-lg font-semibold text-gray-800 dark:text-slate-100">{profile.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
