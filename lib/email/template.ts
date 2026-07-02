/** Colores de marca (tailwind: canvas, forest, accent-blue). */
import { CONTACT_EMAIL } from '@/lib/site/contact'

const BRAND = {
  canvas: '#FDF8F1',
  surface: '#FFFFFF',
  forest: '#1C2B24',
  muted: '#4A5F55',
  subtle: '#64748b',
  border: 'rgba(28, 43, 36, 0.1)',
  accentBlue: '#3A7CEC',
  successGreen: '#22C55E',
  link: '#3A7CEC',
} as const

const SITE_URL = 'https://lumagrid.app'
const DOCS_URL = 'https://docs.lumagrid.app'
const LOGO_URL = `${SITE_URL}/logo-luma-grid.png`

export const EMAIL_HERO = {
  verify: `${SITE_URL}/email/verify-hero.png`,
  resetPassword: `${SITE_URL}/email/reset-password-hero.png`,
} as const

const FONT = 'Arial,Helvetica,sans-serif'

export type LumaEmailCta = {
  label: string
  href: string
  /** Color de fondo del botón. */
  color: string
}

export type LumaEmailLayoutOptions = {
  preheader?: string
  title: string
  /** Texto encima de la ilustración. */
  introHtml: string
  heroImageUrl: string
  heroImageAlt: string
  cta: LumaEmailCta
  /** Nota de caducidad bajo el CTA (p. ej. reloj + 24 h). */
  expiryHtml?: string
  /** Bloque final dentro de la tarjeta (disclaimer o ayuda). */
  bottomHtml?: string
  /** Pie fuera de la tarjeta blanca. */
  outerFooterHtml?: string
}

function logoHeaderHtml(): string {
  return `
    <tr>
      <td align="center" style="padding:32px 24px 8px">
        <a href="${SITE_URL}" target="_blank" style="text-decoration:none;display:inline-block">
          <img src="${LOGO_URL}" alt="Luma Grid" width="44" height="44" style="display:inline-block;border:0;border-radius:0;vertical-align:middle;margin-right:10px" />
          <span style="font-family:${FONT};font-size:22px;font-weight:800;letter-spacing:-0.03em;color:${BRAND.forest};vertical-align:middle">luma grid</span>
        </a>
      </td>
    </tr>`
}

function heroBlock(url: string, alt: string): string {
  return `
    <tr>
      <td align="center" style="padding:8px 24px 20px">
        <img src="${url}" alt="${alt}" width="480" style="display:block;width:100%;max-width:480px;height:auto;border:0;border-radius:16px" />
      </td>
    </tr>`
}

function ctaBlock(cta: LumaEmailCta): string {
  return `
    <tr>
      <td align="center" style="padding:4px 32px 16px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="border-radius:999px;background:${cta.color}">
              <a href="${cta.href}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;min-width:200px;text-align:center">
                ${cta.label}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

/** Plantilla HTML transaccional con marca Luma Grid (tablas + estilos inline). */
export function lumaEmailLayout(opts: LumaEmailLayoutOptions): string {
  const preheader = opts.preheader ?? opts.title

  const expiryBlock = opts.expiryHtml
    ? `
      <tr>
        <td align="center" style="padding:0 32px 24px;font-family:${FONT};font-size:14px;line-height:1.5;color:${BRAND.subtle}">
          ${opts.expiryHtml}
        </td>
      </tr>`
    : ''

  const bottomBlock = opts.bottomHtml
    ? `
      <tr>
        <td style="padding:20px 28px 28px;border-top:1px solid ${BRAND.border}">
          ${opts.bottomHtml}
        </td>
      </tr>`
    : ''

  const outerFooter = opts.outerFooterHtml
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin-top:20px">
        <tr>
          <td align="center" style="padding:0 16px;font-family:${FONT};font-size:12px;line-height:1.7;color:${BRAND.subtle}">
            ${opts.outerFooterHtml}
          </td>
        </tr>
      </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.canvas};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.canvas};padding:24px 16px 32px">
    ${logoHeaderHtml()}
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${BRAND.surface};border-radius:24px;border:1px solid ${BRAND.border};overflow:hidden;box-shadow:0 12px 40px rgba(28,43,36,0.07)">
          <tr>
            <td align="center" style="padding:24px 32px 8px;font-family:${FONT};font-size:28px;font-weight:800;line-height:1.2;letter-spacing:-0.03em;color:${BRAND.forest}">
              ${opts.title}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 4px;font-family:${FONT};font-size:16px;line-height:1.65;color:${BRAND.muted};text-align:center">
              ${opts.introHtml}
            </td>
          </tr>
          ${heroBlock(opts.heroImageUrl, opts.heroImageAlt)}
          ${ctaBlock(opts.cta)}
          ${expiryBlock}
          ${bottomBlock}
        </table>
        ${outerFooter}
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function defaultOuterFooterHtml(): string {
  const year = new Date().getFullYear()
  return `
    Si tienes dudas o necesitas ayuda, escríbenos a
    <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.link};text-decoration:none;font-weight:600">${CONTACT_EMAIL}</a>
    <br />
    © ${year} Luma Grid. Todos los derechos reservados.
    <br />
    <a href="${DOCS_URL}" style="color:${BRAND.link};text-decoration:none">Documentación</a>
    ·
    <a href="${SITE_URL}/privacidad" style="color:${BRAND.link};text-decoration:none">Privacidad</a>
    ·
    <a href="${SITE_URL}/terminos" style="color:${BRAND.link};text-decoration:none">Términos</a>`
}
