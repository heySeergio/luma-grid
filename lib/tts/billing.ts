/** Devuelve el periodo YYYY-MM actual (UTC). */
export function currentBillingMonth(): string {
  return new Date().toISOString().slice(0, 7)
}
