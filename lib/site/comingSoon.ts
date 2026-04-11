/**
 * Landing pública (`/`): CTAs a tablero/admin/registro, precios activos, JSON-LD y guías PWA.
 *
 * Establece `NEXT_PUBLIC_COMING_SOON=false` en el entorno (p. ej. `.env.local` o Vercel) para
 * mostrar el servicio como abierto en la portada. Cualquier otro valor o variable ausente
 * mantiene el modo «próximamente» (comportamiento por defecto).
 */
export function isLandingComingSoon(): boolean {
  return process.env.NEXT_PUBLIC_COMING_SOON !== 'false'
}
