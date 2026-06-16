import { shouldSkipUsageCaptureForMode } from '@/lib/evaluation/mode'

type ProfileCaptureRow = {
  evaluationMode: string
}

/** Perfil NONE o cuenta sin consentimiento: no registrar telemetría de uso. */
export function shouldSkipProfileUsageCapture(
  profile: ProfileCaptureRow | null | undefined,
  shareUsageForPredictions: boolean | undefined,
): boolean {
  if (shareUsageForPredictions === false) return true
  if (!profile) return true
  return shouldSkipUsageCaptureForMode(profile.evaluationMode)
}
