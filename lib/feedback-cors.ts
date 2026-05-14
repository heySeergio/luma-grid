/**
 * Orígenes del sitio de documentación (y local) permitidos para POST /api/feedback
 * desde el navegador. Lista separada por comas en FEEDBACK_ALLOWED_ORIGINS.
 */
const DEFAULT_ALLOWED = ['https://docs.lumagrid.app', 'http://localhost:3001', 'http://127.0.0.1:3001']

export function feedbackCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin')
  const raw = process.env.FEEDBACK_ALLOWED_ORIGINS
  const allowed = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_ALLOWED

  if (!origin || !allowed.includes(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}
