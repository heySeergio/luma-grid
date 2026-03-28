import { conjugateWords, type ConjugationTokenInput, type ProfileGender } from '@/lib/lexicon/conjugation'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let words: string[] = []
  let tokens: ConjugationTokenInput[] = []
  let gender: ProfileGender = 'male'
  try {
    const body = await req.json()
    words = body.words || []
    tokens = Array.isArray(body.tokens) ? body.tokens : []
    gender = body.gender === 'female' ? 'female' : 'male'

    const phrase = await conjugateWords(tokens.length > 0 ? tokens : words, gender)
    return NextResponse.json({ phrase })
  } catch (err) {
    console.error('Conjugate error:', err)
    try {
      return NextResponse.json({
        phrase: await conjugateWords(tokens.length > 0 ? tokens : words, gender) || words.join(' '),
      })
    } catch {
      return NextResponse.json({ phrase: words.join(' ') })
    }
  }
}
