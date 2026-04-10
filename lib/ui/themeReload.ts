/**
 * Debe coincidir con `storageKey` de ThemeProvider en `components/Providers.tsx`.
 */
export const LUMA_THEME_STORAGE_KEY = 'luma-theme'

export type ThemeReloadValue = 'light' | 'dark' | 'system'

/**
 * Persiste el tema en localStorage (next-themes), muestra un overlay a pantalla completa
 * y recarga la página para evitar parpadeos al alternar claro/oscuro.
 */
export function reloadPageWithTheme(nextTheme: ThemeReloadValue): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LUMA_THEME_STORAGE_KEY, nextTheme)
  } catch {
    /* ignore */
  }

  const overlay = document.createElement('div')
  overlay.setAttribute('role', 'status')
  overlay.setAttribute('aria-live', 'polite')
  overlay.setAttribute('aria-busy', 'true')
  overlay.className =
    'fixed inset-0 z-[2147483647] flex flex-col items-center justify-center gap-5 bg-[var(--app-bg)] px-6 text-center dark:bg-slate-950'
  overlay.innerHTML = `
    <div
      class="h-12 w-12 shrink-0 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-800 dark:border-t-indigo-300"
      aria-hidden="true"
    ></div>
    <p class="text-lg font-semibold tracking-tight text-[var(--app-foreground)]">Aplicando tema…</p>
  `
  document.body.appendChild(overlay)
  void overlay.offsetHeight
  window.setTimeout(() => {
    window.location.reload()
  }, 100)
}
