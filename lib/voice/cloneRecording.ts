/** MIME preferido para MediaRecorder (navegador). */
export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export const CLONE_RECORD_MIN_MS = 5_000
export const CLONE_RECORD_MAX_MS = 5 * 60 * 1000

export function blobToCloneFile(blob: Blob): File {
  const type = blob.type || 'audio/webm'
  const ext = type.includes('webm')
    ? 'webm'
    : type.includes('mp4') || type.includes('m4a')
      ? 'm4a'
      : type.includes('ogg')
        ? 'ogg'
        : 'webm'
  return new File([blob], `grabacion.${ext}`, { type })
}
