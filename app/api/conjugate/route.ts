import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let words: string[] = []
  let tokens: import('@/lib/lexicon/conjugation').ConjugationTokenInput[] = []
  let gender: import('@/lib/lexicon/conjugation').ProfileGender = 'male'
  try {
    const body = await req.json()
    words = body.words || []
    tokens = Array.isArray(body.tokens) ? body.tokens : []
    gender = body.gender === 'female' ? 'female' : 'male'

    const { conjugateWords } = await import('@/lib/lexicon/conjugation')
    const phrase = await conjugateWords(tokens.length > 0 ? tokens : words, gender)
    return NextResponse.json({ phrase })
  } catch (err) {
    console.error('Conjugate error:', err)
    try {
      const { conjugateWords } = await import('@/lib/lexicon/conjugation')
      return NextResponse.json({
        phrase: await conjugateWords(tokens.length > 0 ? tokens : words, gender) || words.join(' '),
      })
    } catch {
      return NextResponse.json({ phrase: words.join(' ') })
    }
  }
}
