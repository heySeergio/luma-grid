import { NextResponse } from 'next/server'
import { ELEVENLABS_PRESET_VOICES } from '@/lib/voice/elevenlabsPresets'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ presets: ELEVENLABS_PRESET_VOICES })
}
