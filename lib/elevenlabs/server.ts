const ELEVEN_BASE = 'https://api.elevenlabs.io/v1'

export type TextToSpeechOptions = {
  voiceId: string
  text: string
  /** Por defecto 0.7 (recomendado para voz natural estable). */
  stability?: number
  /** Por defecto 0.8 (recomendado; mapea a `similarity_boost` en la API). */
  similarityBoost?: number
}

export async function elevenLabsTextToSpeech(
  apiKey: string,
  options: TextToSpeechOptions,
): Promise<ArrayBuffer> {
  const { voiceId, text, stability = 0.7, similarityBoost = 0.8 } = options

  const response = await fetch(`${ELEVEN_BASE}/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`ElevenLabs TTS ${response.status}: ${errText.slice(0, 200)}`)
  }

  return response.arrayBuffer()
}

export async function elevenLabsAddVoiceFromFiles(
  apiKey: string,
  name: string,
  files: File[],
): Promise<{ voiceId: string }> {
  const form = new FormData()
  form.append('name', name)

  for (const file of files) {
    form.append('files', file, file.name || 'sample.mp3')
  }

  const response = await fetch(`${ELEVEN_BASE}/voices/add`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: form,
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`ElevenLabs clone ${response.status}: ${errText.slice(0, 300)}`)
  }

  const data = (await response.json()) as { voice_id?: string; voiceId?: string }
  const voiceId = data.voice_id ?? data.voiceId
  if (!voiceId) {
    throw new Error('Respuesta de ElevenLabs sin voice_id')
  }

  return { voiceId }
}
