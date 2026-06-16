export const EVALUATION_MODES = ['UNSET', 'NONE', 'SIMPLE', 'FULL'] as const

export type EvaluationMode = (typeof EVALUATION_MODES)[number]

export const SELECTABLE_EVALUATION_MODES = ['NONE', 'SIMPLE', 'FULL'] as const

export type SelectableEvaluationMode = (typeof SELECTABLE_EVALUATION_MODES)[number]

export function isEvaluationMode(value: string): value is EvaluationMode {
  return (EVALUATION_MODES as readonly string[]).includes(value)
}

export function isSelectableEvaluationMode(value: string): value is SelectableEvaluationMode {
  return (SELECTABLE_EVALUATION_MODES as readonly string[]).includes(value)
}

export const EVALUATION_MODE_LABELS: Record<SelectableEvaluationMode, { title: string; subtitle: string }> = {
  NONE: {
    title: 'Solo comunicación',
    subtitle: 'Sin seguimiento',
  },
  SIMPLE: {
    title: 'Evaluación sencilla',
    subtitle: 'Un vistazo rápido',
  },
  FULL: {
    title: 'Evaluación completa',
    subtitle: 'Datos con lectura',
  },
}

/** Perfil con modo NONE: no registrar telemetría de uso. */
export function shouldSkipUsageCaptureForMode(mode: EvaluationMode | string | null | undefined): boolean {
  return mode === 'NONE'
}
