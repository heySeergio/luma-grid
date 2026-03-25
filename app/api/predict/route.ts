import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  let selectedWords: string[] = []
  let availableSymbols: Array<{ id: string; label: string }> = []

  try {
    const body = await req.json()
    selectedWords = body.selectedWords || []
    availableSymbols = body.availableSymbols || []

    if (selectedWords.length === 0 || availableSymbols.length === 0) {
      return NextResponse.json({ ids: [] })
    }

    const symbolList = availableSymbols.map(s => `${s.id}:${s.label}`).join(', ')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `El usuario de una app AAC ha seleccionado: ${selectedWords.join(', ')}. De esta lista de símbolos disponibles: ${symbolList}. Devuelve SOLO los IDs de los 8 más probables a continuación, separados por comas, sin explicación.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const ids = text.split(',').map(id => id.trim()).filter(id => id.length > 0).slice(0, 8)

    return NextResponse.json({ ids })
  } catch (err) {
    console.error('Predict error:', err)
    return NextResponse.json({ ids: [] })
  }
}
