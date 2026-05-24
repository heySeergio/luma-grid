let currentTapAudio: HTMLAudioElement | null = null

export function stopTapAudioElement(): void {
  if (!currentTapAudio) return
  try {
    currentTapAudio.pause()
    currentTapAudio.src = ''
  } catch {
    /* ignore */
  }
  currentTapAudio = null
}

export function playTapAudioElement(url: string): Promise<void> {
  const trimmed = url.trim()
  if (!trimmed) return Promise.resolve()

  stopTapAudioElement()

  const audio = new Audio(trimmed)
  currentTapAudio = audio

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
    const onEnded = () => {
      cleanup()
      if (currentTapAudio === audio) currentTapAudio = null
      resolve()
    }
    const onError = () => {
      cleanup()
      if (currentTapAudio === audio) currentTapAudio = null
      reject(new Error('tap_audio_playback_failed'))
    }
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    void audio.play().catch((err) => {
      cleanup()
      if (currentTapAudio === audio) currentTapAudio = null
      reject(err)
    })
  })
}
