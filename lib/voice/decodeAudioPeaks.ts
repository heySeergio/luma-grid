/** Barras normalizadas 0–1 para dibujar una forma de onda aproximada. */
export async function decodeAudioPeaks(arrayBuffer: ArrayBuffer, barCount = 72): Promise<number[]> {
  if (typeof window === 'undefined') {
    return Array.from({ length: barCount }, () => 0.15)
  }
  const AnyCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AnyCtx) {
    return Array.from({ length: barCount }, () => 0.15)
  }
  const ctx = new AnyCtx()
  try {
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
    const data = buffer.getChannelData(0)
    const len = Math.max(1, data.length)
    const step = Math.floor(len / barCount)
    const peaks: number[] = []
    for (let i = 0; i < barCount; i++) {
      let max = 0
      const start = i * step
      const end = Math.min(start + step, len)
      for (let j = start; j < end; j++) {
        const v = Math.abs(data[j])
        if (v > max) max = v
      }
      peaks.push(max)
    }
    const maxPeak = Math.max(...peaks, 1e-6)
    return peaks.map((p) => p / maxPeak)
  } finally {
    await ctx.close().catch(() => {})
  }
}
