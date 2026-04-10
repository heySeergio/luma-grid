import { useEffect, useState, useSyncExternalStore } from 'react'

/**
 * `true` solo en el cliente tras el primer commit post-hidratación.
 * Evita `queueMicrotask` u otros disparadores tempranos que pueden actualizar
 * el árbol antes de terminar la hidratación y provocar mismatch en atributos
 * (p. ej. `disabled` en la barra de frase).
 */
export function useClientReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return ready
}

/**
 * `false` en SSR y en el primer render de hidratación (alineado con `getServerSnapshot`);
 * `true` en el cliente ya hidratado. Sirve para que `disabled`/`title` del primer paint
 * coincidan con el HTML del servidor y evitar advertencias de hidratación.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}
