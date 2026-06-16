import { Resend } from 'resend'

import {
  defaultOuterFooterHtml,
  EMAIL_HERO,
  lumaEmailLayout,
} from '@/lib/email/template'

const DEFAULT_FROM = 'Luma Grid <mailing@lumagrid.app>'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function getFrom(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM
}

function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[email:dev]', opts.subject, '→', opts.to, opts.html.slice(0, 200))
      return { ok: true }
    }
    return { ok: false, error: 'RESEND_API_KEY no configurada' }
  }
  const { error } = await resend.emails.send({
    from: getFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export function verificationEmailHtml(verifyUrl: string): string {
  return lumaEmailLayout({
    preheader: 'Confirma tu correo para activar tu cuenta en Luma Grid.',
    title: 'Verifica tu correo',
    introHtml: `
      <p style="margin:0 0 12px"><strong>¡Gracias por registrarte en Luma Grid!</strong></p>
      <p style="margin:0">Solo falta confirmar tu correo para activar tu cuenta y personalizar tu tablero a tu manera.</p>
    `,
    heroImageUrl: EMAIL_HERO.verify,
    heroImageAlt: 'Tablero de pictogramas con sobre y confirmación',
    cta: {
      label: '✉&nbsp; Verificar correo',
      href: verifyUrl,
      color: '#22C55E',
    },
    expiryHtml: '🕐&nbsp; Este enlace caduca en <strong>24 horas</strong>.',
    bottomHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="36" valign="top" style="padding-right:12px;font-size:20px;line-height:1">💗</td>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#64748b">
            Si no creaste esta cuenta, puedes ignorar este mensaje. Tu información estará segura.
          </td>
        </tr>
      </table>`,
    outerFooterHtml: defaultOuterFooterHtml(),
  })
}

export function passwordResetEmailHtml(resetUrl: string): string {
  const faqUrl = 'https://docs.lumagrid.app/preguntas'
  return lumaEmailLayout({
    preheader: 'Solicitud para restablecer la contraseña de tu cuenta Luma Grid.',
    title: 'Restablecer contraseña',
    introHtml: `
      <p style="margin:0 0 14px">Alguien solicitó restablecer la contraseña de tu cuenta de Luma Grid.</p>
      <p style="margin:0 0 14px">Si fuiste tú, usa el botón de abajo para elegir una nueva contraseña. El enlace es seguro y <strong>caduca en 1 hora</strong>.</p>
      <p style="margin:0">Si no fuiste tú, puedes ignorar este mensaje. Tu contraseña actual seguirá siendo válida.</p>
    `,
    heroImageUrl: EMAIL_HERO.resetPassword,
    heroImageAlt: 'Tablero protegido con candado y llave',
    cta: {
      label: 'Elegir nueva contraseña',
      href: resetUrl,
      color: '#3A7CEC',
    },
    bottomHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="40" valign="top" style="padding-right:12px">
            <img src="https://lumagrid.app/logo-luma-grid.png" alt="" width="32" height="32" style="display:block;border:0;border-radius:0" />
          </td>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#4A5F55">
            <strong style="color:#1C2B24">¿Necesitas ayuda?</strong><br />
            Consulta nuestras preguntas frecuentes en
            <a href="${faqUrl}" style="color:#3A7CEC;text-decoration:none;font-weight:600">docs.lumagrid.app/preguntas</a>.
          </td>
        </tr>
      </table>`,
    outerFooterHtml: defaultOuterFooterHtml(),
  })
}

export function buildVerifyEmailUrl(token: string): string {
  return `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`
}

export function buildResetPasswordUrl(token: string): string {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`
}

export async function sendVerificationEmail(email: string, token: string) {
  return sendEmail({
    to: email,
    subject: 'Verifica tu correo — Luma Grid',
    html: verificationEmailHtml(buildVerifyEmailUrl(token)),
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  return sendEmail({
    to: email,
    subject: 'Restablecer contraseña — Luma Grid',
    html: passwordResetEmailHtml(buildResetPasswordUrl(token)),
  })
}
