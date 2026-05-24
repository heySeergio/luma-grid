import { createClient } from '@supabase/supabase-js'

const ALLOWED_AUDIO = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/x-m4a',
])

export const SYMBOL_TAP_AUDIO_MAX_BYTES = 512 * 1024

export function symbolTapAudioBucket(): string {
  return (process.env.SUPABASE_SYMBOL_AUDIO_BUCKET || 'public').replace(/\/$/, '')
}

export function extensionForAudioMime(type: string): string {
  if (type === 'audio/mpeg' || type === 'audio/mp3') return 'mp3'
  if (type === 'audio/wav' || type === 'audio/x-wav') return 'wav'
  if (type === 'audio/ogg') return 'ogg'
  if (type === 'audio/webm') return 'webm'
  if (type === 'audio/mp4' || type === 'audio/x-m4a') return 'm4a'
  return 'mp3'
}

export function isAllowedTapAudioMime(type: string): boolean {
  return ALLOWED_AUDIO.has(type)
}

export function buildSymbolTapAudioObjectPath(
  userId: string,
  profileId: string,
  symbolId: string,
  ext: string,
): string {
  const safeSymbol = symbolId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `symbol-tap-audio/${userId}/${profileId}/${safeSymbol}.${ext}`
}

export async function uploadTapAudioBuffer(params: {
  userId: string
  profileId: string
  symbolId: string
  buf: Buffer
  contentType: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseUrl || !serviceKey) {
    return {
      ok: false,
      error:
        'Almacenamiento no configurado. Añade NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.',
    }
  }

  const bucket = symbolTapAudioBucket()
  const ext = extensionForAudioMime(params.contentType)
  const objectPath = buildSymbolTapAudioObjectPath(
    params.userId,
    params.profileId,
    params.symbolId,
    ext,
  )

  const supabase = createClient(supabaseUrl, serviceKey)
  const { error } = await supabase.storage.from(bucket).upload(objectPath, params.buf, {
    contentType: params.contentType,
    upsert: true,
  })
  if (error) {
    return { ok: false, error: `Supabase: ${error.message}` }
  }

  const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`
  return { ok: true, url: publicUrl }
}
