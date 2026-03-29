/**
 * Conecta un elemento de audio a la salida con ganancia (p. ej. >1 para voces preset más bajas).
 * `HTMLAudioElement.volume` solo llega a 1; para amplificar hace falta GainNode.
 */
export function connectAudioElementGain(
  audio: HTMLAudioElement,
  gain: number,
): AudioContext | null {
  if (typeof window === 'undefined' || gain === 1) {
    return null
  }
  const ctx = new AudioContext()
  const source = ctx.createMediaElementSource(audio)
  const gainNode = ctx.createGain()
  gainNode.gain.value = gain
  source.connect(gainNode)
  gainNode.connect(ctx.destination)
  void ctx.resume().catch(() => {})
  return ctx
}

export function closeAudioContextSafe(ctx: AudioContext | null | undefined): void {
  if (!ctx) return
  try {
    void ctx.close()
  } catch {
    /* ignore */
  }
}
