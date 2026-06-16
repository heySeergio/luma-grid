export type AdminSettingsView = 'account' | 'luma' | 'evaluation'

export const ADMIN_PATHS = {
  preview: '/admin',
  account: '/admin/cuenta',
  voice: '/admin/voz',
  evaluation: '/admin/evaluacion',
  /** @deprecated Usar ADMIN_PATHS.evaluation; conservado para redirects. */
  lexicon: {
    coverage: '/admin/lexico',
    vocabulary: '/admin/lexico/vocabulario',
    usage: '/admin/lexico/evaluacion',
    efficiency: '/admin/lexico/eficiencia',
  },
} as const

/** Rutas del nav principal del panel (evita referencias sueltas a ADMIN_PATHS en client bundles). */
export const ADMIN_PRIMARY_NAV_HREFS = {
  preview: ADMIN_PATHS.preview,
  account: ADMIN_PATHS.account,
  voice: ADMIN_PATHS.voice,
  evaluation: ADMIN_PATHS.evaluation,
  lexicon: ADMIN_PATHS.lexicon.coverage,
} as const

/** @deprecated Léxico unificado en Evaluación; conservado para nav legacy y redirects. */
export type LexiconSubTab = 'coverage' | 'vocabulary' | 'usage' | 'efficiency'

/** @deprecated Subpestañas léxicas antiguas; enlazan a la sección Evaluación. */
export const ADMIN_LEXICON_SUB_ITEMS: { tab: LexiconSubTab; href: string; label: string }[] = [
  { tab: 'coverage', href: ADMIN_PATHS.evaluation, label: 'Cobertura' },
  { tab: 'vocabulary', href: ADMIN_PATHS.evaluation, label: 'Vocabulario' },
  { tab: 'usage', href: ADMIN_PATHS.evaluation, label: 'Evaluación' },
  { tab: 'efficiency', href: ADMIN_PATHS.evaluation, label: 'Eficiencia' },
]

export const ADMIN_REVALIDATE_PATHS = [
  ADMIN_PATHS.preview,
  ADMIN_PATHS.account,
  ADMIN_PATHS.voice,
  ADMIN_PATHS.evaluation,
] as const

export function isValidAdminSegments(segments: string[]): boolean {
  if (segments.length === 0) return false
  const [first] = segments
  if (first === 'cuenta' || first === 'voz') return segments.length === 1
  if (first === 'evaluacion') return segments.length === 1
  return false
}

export function isValidAdminPathname(pathname: string): boolean {
  if (pathname === '/admin' || pathname === '/admin/') return true
  const rest = pathname.replace(/^\/admin\/?/, '')
  if (!rest) return true
  return isValidAdminSegments(rest.split('/').filter(Boolean))
}

export function parseAdminPathname(pathname: string): {
  view: AdminSettingsView | null
} {
  if (pathname === '/admin' || pathname === '/admin/') {
    return { view: null }
  }

  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)
  const [first] = segments

  if (first === 'cuenta') return { view: 'account' }
  if (first === 'voz') return { view: 'luma' }
  if (first === 'evaluacion') return { view: 'evaluation' }

  return { view: null }
}

export function adminPathForView(view: AdminSettingsView | null): string {
  if (view === null) return ADMIN_PATHS.preview
  if (view === 'account') return ADMIN_PATHS.account
  if (view === 'luma') return ADMIN_PATHS.voice
  return ADMIN_PATHS.evaluation
}

export function revalidateAdminPaths(revalidatePath: (path: string) => void): void {
  for (const path of ADMIN_REVALIDATE_PATHS) {
    revalidatePath(path)
  }
}

/** Rutas léxicas antiguas → nueva sección Evaluación. */
export function isLegacyLexiconAdminPath(segments: string[]): boolean {
  return segments[0] === 'lexico'
}

export function legacyLexiconRedirectTarget(segments: string[]): string {
  void segments
  return ADMIN_PATHS.evaluation
}
