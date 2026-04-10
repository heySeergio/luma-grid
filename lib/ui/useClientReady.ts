import { useSyncExternalStore } from 'react'

function subscribe(notify: () => void) {
  if (typeof window === 'undefined') return () => {}
  queueMicrotask(notify)
  return () => {}
}

function getSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

/**
 * Un solo hook interno (`useSyncExternalStore`) para no romper el orden de hooks al hacer HMR.
 * `false` en servidor y en el paso de hidratación; `true` tras la microtarea en el cliente.
 */
export function useClientReady() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
