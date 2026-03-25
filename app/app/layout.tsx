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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {children}
    </div>
  )
}
