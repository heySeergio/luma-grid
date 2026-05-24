import type { Metadata } from 'next'

import { HeroComposition } from '@/components/landing/HeroComposition'

export const metadata: Metadata = {
  title: 'Compo',
  robots: { index: false, follow: false },
}

export default function CompoPage() {
  return (
    <main className="min-h-[100dvh] bg-white p-4">
      <HeroComposition className="max-w-[512px]" />
    </main>
  )
}
