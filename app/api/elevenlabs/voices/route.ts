import { NextRequest, NextResponse } from 'next/server'

type ElevenLabsVoice = {
  voice_id: string
  name: string
  preview_url?: string
}

type ElevenLabsVoicesResponse = {
  voices?: ElevenLabsVoice[]
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-elevenlabs-key')
  if (!apiKey) return NextResponse.json({ voices: [] }, { status: 401 })

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })

    if (!response.ok) throw new Error('ElevenLabs API error')

    const data = await response.json() as ElevenLabsVoicesResponse
    const voices = (data.voices || []).map((voice) => ({
      id: voice.voice_id,
      name: voice.name,
      preview_url: voice.preview_url,
    }))

    return NextResponse.json({ voices })
  } catch (err) {
    console.error('ElevenLabs voices error:', err)
    return NextResponse.json({ voices: [] })
  }
}
