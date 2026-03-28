import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Luma Grid',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  )
}
