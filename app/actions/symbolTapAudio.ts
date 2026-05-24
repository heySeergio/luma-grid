'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { TapAudioMeta } from '@/lib/symbolTapAudio'
import {
  isAllowedTapAudioMime,
  SYMBOL_TAP_AUDIO_MAX_BYTES,
  uploadTapAudioBuffer,
} from '@/lib/symbolTapAudioStorage'

export type TapAudioUploadResult =
  | { ok: true; url: string; meta: TapAudioMeta }
  | { ok: false; error: string }

async function assertSymbolOwnership(
  profileId: string,
  symbolId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.symbol.findFirst({
    where: {
      id: symbolId,
      profileId,
      profile: { userId },
    },
    select: { id: true },
  })
  if (!row) return { ok: false, error: 'Símbolo o tablero no encontrado.' }
  return { ok: true }
}

export async function uploadSymbolTapAudio(
  profileId: string,
  symbolId: string,
  formData: FormData,
): Promise<TapAudioUploadResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autorizado' }

  const trimmedProfile = profileId.trim()
  const trimmedSymbol = symbolId.trim()
  if (!trimmedProfile || !trimmedSymbol) {
    return { ok: false, error: 'Tablero o símbolo no válido.' }
  }

  const owned = await assertSymbolOwnership(trimmedProfile, trimmedSymbol, session.user.id)
  if (!owned.ok) return owned

  const file = formData.get('file')
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: 'Selecciona un archivo de audio.' }
  }
  if (file.size > SYMBOL_TAP_AUDIO_MAX_BYTES) {
    return { ok: false, error: 'Máximo 512 KB por clip.' }
  }

  const type = (file as File).type || 'audio/mpeg'
  if (!isAllowedTapAudioMime(type)) {
    return {
      ok: false,
      error: 'Formato no permitido. Usa MP3, WAV, OGG, WebM o M4A.',
    }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const uploaded = await uploadTapAudioBuffer({
    userId: session.user.id,
    profileId: trimmedProfile,
    symbolId: trimmedSymbol,
    buf,
    contentType: type,
  })
  if (!uploaded.ok) return uploaded

  return {
    ok: true,
    url: uploaded.url,
    meta: { source: 'upload' },
  }
}

type FreesoundPreview = {
  'preview-hq-mp3'?: string
  'preview-lq-mp3'?: string
}

export type FreesoundSearchHit = {
  id: number
  name: string
  username: string
  license: string
  url: string
  previewUrl: string | null
}

export async function searchFreesoundTapAudio(query: string): Promise<
  | { ok: true; results: FreesoundSearchHit[] }
  | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autorizado' }

  const apiKey = process.env.FREESOUND_API_KEY?.trim()
  if (!apiKey) {
    return {
      ok: false,
      error: 'Búsqueda en Freesound no configurada (FREESOUND_API_KEY).',
    }
  }

  const q = query.trim()
  if (!q) return { ok: true, results: [] }

  const params = new URLSearchParams({
    query: q,
    page_size: '12',
    fields: 'id,name,username,license,previews,url',
    filter: 'duration:[0 TO 5]',
  })

  const res = await fetch(`https://freesound.org/apiv2/search/text/?${params.toString()}`, {
    headers: { Authorization: `Token ${apiKey}` },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    return { ok: false, error: `Freesound: error ${res.status}` }
  }

  const data = (await res.json()) as {
    results?: Array<{
      id: number
      name: string
      username: string
      license: string
      url: string
      previews?: FreesoundPreview
    }>
  }

  const results: FreesoundSearchHit[] = (data.results ?? []).map((r) => {
    const previews = r.previews ?? {}
    const previewUrl =
      previews['preview-hq-mp3'] ?? previews['preview-lq-mp3'] ?? null
    return {
      id: r.id,
      name: r.name,
      username: r.username,
      license: r.license,
      url: r.url,
      previewUrl,
    }
  })

  return { ok: true, results }
}

export async function importFreesoundTapAudio(
  profileId: string,
  symbolId: string,
  freesoundId: number,
): Promise<TapAudioUploadResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autorizado' }

  const trimmedProfile = profileId.trim()
  const trimmedSymbol = symbolId.trim()
  if (!trimmedProfile || !trimmedSymbol) {
    return { ok: false, error: 'Tablero o símbolo no válido.' }
  }

  const owned = await assertSymbolOwnership(trimmedProfile, trimmedSymbol, session.user.id)
  if (!owned.ok) return owned

  const apiKey = process.env.FREESOUND_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'Freesound no configurado (FREESOUND_API_KEY).' }
  }

  const detailRes = await fetch(
    `https://freesound.org/apiv2/sounds/${freesoundId}/?token=${encodeURIComponent(apiKey)}&fields=id,name,username,license,url,previews`,
    { next: { revalidate: 0 } },
  )
  if (!detailRes.ok) {
    return { ok: false, error: 'No se pudo obtener el sonido de Freesound.' }
  }

  const sound = (await detailRes.json()) as {
    id: number
    name: string
    username: string
    license: string
    url: string
    previews?: FreesoundPreview
  }

  const previewUrl =
    sound.previews?.['preview-hq-mp3'] ?? sound.previews?.['preview-lq-mp3'] ?? null
  if (!previewUrl) {
    return { ok: false, error: 'Este sonido no tiene vista previa disponible.' }
  }

  const audioRes = await fetch(previewUrl, { next: { revalidate: 0 } })
  if (!audioRes.ok) {
    return { ok: false, error: 'No se pudo descargar la vista previa.' }
  }

  const buf = Buffer.from(await audioRes.arrayBuffer())
  if (buf.length === 0) {
    return { ok: false, error: 'Archivo de audio vacío.' }
  }
  if (buf.length > SYMBOL_TAP_AUDIO_MAX_BYTES) {
    return { ok: false, error: 'El clip es demasiado grande (máx. 512 KB).' }
  }

  const contentType = audioRes.headers.get('content-type') || 'audio/mpeg'
  const uploaded = await uploadTapAudioBuffer({
    userId: session.user.id,
    profileId: trimmedProfile,
    symbolId: trimmedSymbol,
    buf,
    contentType: isAllowedTapAudioMime(contentType) ? contentType : 'audio/mpeg',
  })
  if (!uploaded.ok) return uploaded

  const meta: TapAudioMeta = {
    source: 'freesound',
    freesoundId: sound.id,
    author: sound.username,
    license: sound.license,
    sourcePageUrl: sound.url,
    soundName: sound.name,
  }

  return { ok: true, url: uploaded.url, meta }
}
