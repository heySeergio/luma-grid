import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intranet',
  robots: { index: false, follow: false },
}

export default function IntranetRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
