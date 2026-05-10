'use client'

import { useEffect, useState } from 'react'
import {
  FRASES_HECHAS_CATEGORY,
  fetchFirstArasaacImage,
  shouldAutoloadArasaacForSymbol,
} from '@/lib/arasaac'

type GlyphSymbolInput = {
  id?: string | null
  gridId?: string | null
  imageUrl?: string | null
  category?: string | null
  label: string
  emoji?: string | null
}

/** Imagen resuelta (URL propia o autocarga ARASAAC) y emoji de respaldo — misma lógica que SymbolCell y PhraseBar. */
export function useResolvedSymbolGlyph(symbol: GlyphSymbolInput) {
  const [arasaacImageUrl, setArasaacImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setArasaacImageUrl(null)
    if (
      !shouldAutoloadArasaacForSymbol({
        id: symbol.id,
        gridId: symbol.gridId,
        imageUrl: symbol.imageUrl,
        category: symbol.category,
      })
    )
      return
    void fetchFirstArasaacImage(symbol.label).then((url) => {
      if (!cancelled) setArasaacImageUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [symbol.id, symbol.gridId, symbol.imageUrl, symbol.label, symbol.category])

  const isFrasesHechasCategory =
    typeof symbol.category === 'string' && symbol.category.trim() === FRASES_HECHAS_CATEGORY

  const resolvedImageUrl = isFrasesHechasCategory
    ? ''
    : (typeof symbol.imageUrl === 'string' && symbol.imageUrl.trim()) || arasaacImageUrl || ''

  const displayEmoji =
    isFrasesHechasCategory ? '' : typeof symbol.emoji === 'string' ? symbol.emoji : ''

  return { resolvedImageUrl, displayEmoji }
}
