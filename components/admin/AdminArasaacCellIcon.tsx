'use client'

import { useEffect, useState } from 'react'
import PictoEmoji from '@/components/ui/PictoEmoji'
import { shouldAutoloadArasaacForSymbol, fetchFirstArasaacImage } from '@/lib/arasaac'

interface Props {
  symbol: {
    id?: string | null
    gridId?: string | null
    imageUrl?: string | null
    image_url?: string | null
    label: string
    emoji?: string | null
  }
  className?: string
}

/**
 * Icono de celda del grid de admin: muestra imagen (imageUrl o ARASAAC autocargado)
 * o el emoji/fallback si no hay imagen disponible. Replica la lógica de SymbolCell
 * para que el panel de admin muestre los mismos pictogramas que el tablero base.
 */
export default function AdminArasaacCellIcon({ symbol, className = 'h-8 w-8 object-contain' }: Props) {
  const [arasaacUrl, setArasaacUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setArasaacUrl(null)
    if (!shouldAutoloadArasaacForSymbol(symbol)) return
    void fetchFirstArasaacImage(symbol.label).then((url) => {
      if (!cancelled) setArasaacUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [symbol.id, symbol.gridId, symbol.imageUrl, symbol.image_url, symbol.label])

  const resolvedUrl =
    (typeof symbol.imageUrl === 'string' && symbol.imageUrl.trim()) ||
    (typeof symbol.image_url === 'string' && symbol.image_url.trim()) ||
    arasaacUrl ||
    ''

  if (resolvedUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={resolvedUrl}
        alt={symbol.label}
        className={className}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
    )
  }

  return <PictoEmoji emoji={symbol.emoji || '❓'} aria-hidden />
}
