'use client'

import dynamic from 'next/dynamic'

const AdminPageClient = dynamic(
  () =>
    import(
      /* webpackChunkName: "admin-panel" */
      '@/components/admin/AdminPageClient'
    ),
  {
    ssr: false,
    loading: () => (
      <div className="theme-page-shell flex min-h-dvh items-center justify-center bg-[var(--app-bg)] px-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Cargando panel de administración…
      </div>
    ),
  },
)

export default function AdminPageDynamic() {
  return <AdminPageClient />
}
