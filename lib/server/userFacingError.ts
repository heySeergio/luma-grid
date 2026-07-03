import { CONTACT_EMAIL } from '@/lib/site/contact'

export function isDevServerEnvironment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/** Mensaje detallado solo en desarrollo; genérico y seguro en producción. */
export function userFacingErrorMessage(devDetail: string, userMessage?: string): string {
  if (isDevServerEnvironment()) return devDetail
  return userMessage ?? defaultUserFacingErrorMessage()
}

export function defaultUserFacingErrorMessage(): string {
  return `No se pudo completar la operación. Inténtalo de nuevo en unos minutos o escríbenos a ${CONTACT_EMAIL}.`
}

export function checkoutUnavailableMessage(): string {
  return `El pago no está disponible en este momento. Puedes elegir el plan gratuito o escribirnos a ${CONTACT_EMAIL}.`
}
