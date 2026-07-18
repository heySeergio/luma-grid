'use client'

import { signOut } from 'next-auth/react'

export function ForbiddenSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/stats/login' })}
      className="mt-8 w-full rounded-xl bg-[#042D22] py-3 text-sm font-bold text-white transition hover:brightness-110"
    >
      Cerrar sesión
    </button>
  )
}
