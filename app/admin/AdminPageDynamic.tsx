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
      <div className="luma-product-shell font-bricolage theme-page-shell flex min-h-dvh items-center justify-center px-4 text-center text-sm text-[var(--app-muted-foreground)] antialiased">
        Cargando panel de administración…
      </div>
    ),
  },
)

export default function AdminPageDynamic() {
  return <AdminPageClient />
}
