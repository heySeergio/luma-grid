import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-elevenlabs-key')
  if (!apiKey) return NextResponse.json({ voices: [] }, { status: 401 })

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })

    if (!response.ok) throw new Error('ElevenLabs API error')

    const data = await response.json()
    const voices = (data.voices || []).map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      preview_url: v.preview_url,
    }))

    return NextResponse.json({ voices })
  } catch (err) {
    console.error('ElevenLabs voices error:', err)
    return NextResponse.json({ voices: [] })
  }
}
