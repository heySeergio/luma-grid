import type { CompareFeatureRow, ComparePricingTier } from '@/lib/compare/types'

/** Importes numéricos (€) — mismas cifras que en PricingCards. */
export const LUMA_VOICE_MONTH_EUR = 9
export const LUMA_VOICE_YEAR_EUR = 79
export const LUMA_IDENTITY_MONTH_EUR = 24
export const LUMA_IDENTITY_YEAR_EUR = 199
export const LUMA_THERAPIST_MONTH_EUR = 69
export const LUMA_THERAPIST_YEAR_EUR = 690

export const LUMA_DIFFERENTIALS = {
  voices:
    'Voces naturales con IA (ElevenLabs): entonación expresiva, cercana a una voz humana — no voces robóticas del sistema.',
  conjugation:
    'Conjugación automática de verbos al leer: la frase suena gramaticalmente correcta y facilita la comprensión auditiva.',
  prediction:
    'Predicción y autocompletado de frases con IA: menos pulsaciones y frases más fluidas para quien escucha.',
  arasaac: 'Pictogramas ARASAAC — el estándar en centros educativos españoles.',
  multiStudent: 'Gestión multi-alumno con panel de administración para centros y logopedas.',
  evaluation: 'Módulo de Evaluación con 3 modos: Solo comunicación, Evaluación sencilla y Evaluación completa.',
  zones: 'Zona Fija y Zona Variable en los tableros para adaptar la interfaz al nivel del usuario.',
  offline: '100% web (PWA) con modo offline: funciona en cualquier dispositivo sin instalación nativa.',
  spanish: 'Español-first, pensado para el sistema educativo español.',
} as const

export const LUMA_TIER_LIBRE: ComparePricingTier = {
  name: 'Plan Libre',
  price: '0 €',
  note: 'Gratis, sin tarjeta. Incluye conjugación y predicción con IA.',
}

export const LUMA_TIER_VOZ: ComparePricingTier = {
  name: 'Plan Voz',
  price: `${LUMA_VOICE_MONTH_EUR} €/mes · ${LUMA_VOICE_YEAR_EUR} €/año`,
  note: 'Voces naturales IA, 5 tableros, evaluaciones básicas.',
}

export const LUMA_TIER_IDENTIDAD: ComparePricingTier = {
  name: 'Plan Identidad',
  price: `${LUMA_IDENTITY_MONTH_EUR} €/mes · ${LUMA_IDENTITY_YEAR_EUR} €/año`,
  note: 'Clonación de voz, 20 tableros, evaluaciones avanzadas e informes.',
}

export const LUMA_TIER_TERAPEUTA: ComparePricingTier = {
  name: 'Plan Terapeuta',
  price: `${LUMA_THERAPIST_MONTH_EUR} €/mes · ${LUMA_THERAPIST_YEAR_EUR} €/año`,
  note: 'Hasta 10 pacientes, dashboard clínico, plantillas del centro e informes. Add-ons: +6 €/paciente · +39 €/terapeuta al mes.',
}

/** Orden legacy (Libre → Terapeuta); en comparativas usar `pairs` alineados. */
export const LUMA_PRICING_TIERS: ComparePricingTier[] = [
  LUMA_TIER_LIBRE,
  LUMA_TIER_VOZ,
  LUMA_TIER_IDENTIDAD,
  LUMA_TIER_TERAPEUTA,
]

/** Filas base compartidas por todas las comparativas. */
export function getBaseFeatureRows(competitorName: string): CompareFeatureRow[] {
  return [
    {
      feature: 'Plataforma e instalación',
      luma: 'Web (PWA) en cualquier dispositivo: Windows, Mac, Chromebook, iPad, Android. Sin instalación nativa obligatoria.',
      competitor: '',
      winner: 'luma',
    },
    {
      feature: 'Precio de entrada',
      luma: 'Plan Libre gratuito (0 €, sin tarjeta). Planes de pago desde 9 €/mes.',
      competitor: '',
      winner: 'luma',
    },
    {
      feature: 'Voces naturales con IA',
      luma: LUMA_DIFFERENTIALS.voices,
      competitor: '',
      winner: 'luma',
      highlight: true,
    },
    {
      feature: 'Conjugación automática de verbos',
      luma: LUMA_DIFFERENTIALS.conjugation,
      competitor: '',
      winner: 'luma',
      highlight: true,
    },
    {
      feature: 'Predicción / autocompletado de frases',
      luma: LUMA_DIFFERENTIALS.prediction,
      competitor: '',
      winner: 'luma',
      highlight: true,
    },
    {
      feature: 'Pictogramas ARASAAC',
      luma: LUMA_DIFFERENTIALS.arasaac,
      competitor: '',
      winner: 'luma',
    },
    {
      feature: 'Gestión multi-alumno para centros',
      luma: LUMA_DIFFERENTIALS.multiStudent,
      competitor: '',
      winner: 'luma',
    },
    {
      feature: 'Módulo de evaluación',
      luma: LUMA_DIFFERENTIALS.evaluation,
      competitor: '',
      winner: 'luma',
    },
    {
      feature: 'Zona Fija / Zona Variable',
      luma: LUMA_DIFFERENTIALS.zones,
      competitor: '',
      winner: 'luma',
    },
    {
      feature: 'Modo offline / PWA',
      luma: LUMA_DIFFERENTIALS.offline,
      competitor: '',
      winner: 'both',
    },
    {
      feature: 'Soporte comercial en español',
      luma: 'Soporte por email en español; formación incluida en plan profesional.',
      competitor: '',
      winner: 'luma',
    },
    {
      feature: 'Métodos de acceso avanzados',
      luma: 'Selección táctil, escáner y teclado predictivo. Sin eye-tracking ni domótica integrada.',
      competitor: '',
      winner: 'competitor',
    },
  ].map(row => ({
    ...row,
    competitor: row.competitor || `Consultar documentación de ${competitorName}.`,
  })) as CompareFeatureRow[]
}
