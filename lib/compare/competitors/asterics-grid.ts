import { getBaseFeatureRows, LUMA_TIER_IDENTIDAD, LUMA_TIER_LIBRE, LUMA_TIER_TERAPEUTA, LUMA_TIER_VOZ } from '@/lib/compare/lumaGrid'
import type { ComparePageData } from '@/lib/compare/types'

const SLUG = 'luma-grid-vs-asterics-grid'
const COMPETITOR = 'Asterics Grid'
const VENDOR = 'UAS Technikum Wien (colaboración ARASAAC)'

const baseRows = getBaseFeatureRows(COMPETITOR)

const featureRows = baseRows.map(row => {
  switch (row.feature) {
    case 'Plataforma e instalación':
      return {
        ...row,
        competitor:
          '100% web, open source. Funciona en cualquier dispositivo con navegador. Instalable como PWA con modo offline.',
        winner: 'both' as const,
      }
    case 'Precio de entrada':
      return {
        ...row,
        competitor: 'Gratuito al 100%, sin límites de uso ni suscripción. Licencia open source.',
        winner: 'competitor' as const,
      }
    case 'Voces naturales con IA':
      return {
        ...row,
        competitor:
          'Voces TTS del sistema operativo (robóticas). Sin voces naturales con IA ni clonación de voz.',
        winner: 'luma' as const,
      }
    case 'Conjugación automática de verbos':
      return {
        ...row,
        competitor: 'Sin conjugación automática al leer orientada a comprensión auditiva.',
        winner: 'luma' as const,
      }
    case 'Predicción / autocompletado de frases':
      return {
        ...row,
        competitor: 'Funcionalidad básica de composición de frases. Sin predicción con IA.',
        winner: 'luma' as const,
      }
    case 'Pictogramas ARASAAC':
      return {
        ...row,
        competitor: 'ARASAAC integrado (proyecto desarrollado con colaboración ARASAAC). Referente open source.',
        winner: 'both' as const,
      }
    case 'Gestión multi-alumno para centros':
      return {
        ...row,
        competitor:
          'Software gratuito por usuario final; sin panel ni gestión multi-alumno para centros.',
        winner: 'luma' as const,
      }
    case 'Módulo de evaluación':
      return {
        ...row,
        competitor: 'Sin módulo de evaluación AAC integrado.',
        winner: 'luma' as const,
      }
    case 'Zona Fija / Zona Variable':
      return {
        ...row,
        competitor: 'Grids configurables, sin el modelo Zona Fija/Variable específico de Luma Grid.',
        winner: 'luma' as const,
      }
    case 'Modo offline / PWA':
      return {
        ...row,
        competitor: 'Modo offline disponible. PWA instalable.',
        winner: 'both' as const,
      }
    case 'Soporte comercial en español':
      return {
        ...row,
        competitor: 'Comunidad open source y documentación. Sin soporte comercial ni SLA en español.',
        winner: 'luma' as const,
      }
    case 'Métodos de acceso avanzados':
      return {
        ...row,
        competitor: 'Selección táctil y accesos básicos. Sin eye-tracking ni domótica integrada.',
        winner: 'neither' as const,
      }
    default:
      return row
  }
})

export const astericsGridComparePage: ComparePageData = {
  slug: SLUG,
  competitorName: COMPETITOR,
  competitorShortName: 'Asterics',
  competitorVendor: VENDOR,
  heroTitle: 'Luma Grid vs Asterics Grid: ¿cuál elegir?',
  heroVerdict:
    'Asterics Grid es la opción si la prioridad absoluta es coste cero y software libre; Luma Grid compensa si importa que cada alumno suene distinto con voces IA, conjugación automática y un panel para centros.',
  heroSubtitle:
    'Dos soluciones web con ARASAAC, enfoques distintos: open source gratuito vs SaaS con voces naturales y gestión profesional. Luma Grid también ofrece plan gratis (AGPL-3.0).',
  seo: {
    title: 'Luma Grid vs Asterics Grid: alternativa AAC con voces naturales IA',
    description:
      'Compara Luma Grid y Asterics Grid: ambos web y con ARASAAC, pero Luma añade voces naturales con IA, conjugación automática, predicción de frases y panel multi-alumno. Alternativa open source AAC en español.',
    keywords: [
      'alternativa Asterics Grid',
      'Asterics Grid voces naturales',
      'AAC open source alternativa español',
      'Luma Grid vs Asterics Grid',
      'Asterics Grid comparativa',
      'comunicador ARASAAC web',
      'CAA gratuito alternativa',
      'voces IA comunicación aumentativa',
      'conjugación automática AAC',
      'Asterics Grid limitaciones',
      'comunicador open source España',
    ],
  },
  featureRows,
  useCases: [
    {
      title: 'Centro con 30 alumnos',
      scenario:
        'Un centro quiere desplegar CAA en varios dispositivos con perfiles individuales, seguimiento y soporte ante incidencias.',
      recommendation:
        'Luma Grid: panel multi-alumno, evaluación integrada y soporte en español. Asterics es viable técnicamente, pero requiere autogestión IT y no ofrece administración centralizada.',
      pick: 'luma',
    },
    {
      title: 'Logopeda autónoma',
      scenario:
        'Profesional que valora que las frases suenen naturales al leerlas en voz alta, con verbos conjugados correctamente.',
      recommendation:
        'Luma Grid: voces ElevenLabs y conjugación automática marcan diferencia en sesiones. Asterics funciona, pero las voces del sistema dificultan la conexión emocional con la voz del comunicador.',
      pick: 'luma',
    },
    {
      title: 'Familia en casa',
      scenario:
        'Familia con presupuesto ajustado que busca CAA con ARASAAC sin pagar suscripción.',
      recommendation:
        'Depende: Asterics es 100% gratis sin límites. Luma Grid también tiene Plan Libre gratuito con conjugación y predicción IA — prueba ambos y decide según la importancia de las voces naturales.',
      pick: 'depends',
    },
  ],
  whenCompetitor: {
    title: 'Cuándo elegir Asterics Grid',
    intro:
      'Asterics Grid es un proyecto open source sólido con ARASAAC. Estas son situaciones donde puede ser la mejor opción:',
    bullets: [
      'El presupuesto es cero y no puedes asumir ninguna suscripción, ni siquiera opcional.',
      'Prefieres software libre sin dependencia de un proveedor comercial.',
      'Tu equipo técnico puede autogestionar instalación, actualizaciones y soporte.',
      'Valoras la comunidad open source y la transparencia del código fuente.',
      'Las voces TTS del sistema son suficientes para las necesidades actuales del usuario.',
    ],
  },
  competitorPricing: {
    summary: 'Asterics Grid — gratuito por usuario final, open source. Un solo tier sin planes de pago.',
    pairs: [
      {
        luma: LUMA_TIER_LIBRE,
        competitor: {
          name: 'Licencia completa',
          price: '0 €',
          note: 'Open source, sin límites de uso. Equivalente funcional al acceso gratuito.',
        },
      },
      {
        luma: LUMA_TIER_VOZ,
      },
      {
        luma: LUMA_TIER_IDENTIDAD,
      },
      {
        luma: LUMA_TIER_TERAPEUTA,
        competitor: {
          name: 'Gestión multi-alumno / centro',
          price: 'No existe',
          note: 'Software gratuito individual; sin panel ni licencias para varios pacientes.',
          unavailable: true,
        },
      },
    ],
    footnote:
      'Luma Grid también ofrece Plan Libre gratuito (AGPL-3.0) con conjugación y predicción IA. Los planes de pago (Voz 9 €/mes, Identidad 24 €/mes, Terapeuta 69 €/mes) añaden voces naturales IA, más tableros, evaluación avanzada y gestión multi-paciente.',
  },
  faq: [
    {
      question: '¿Es Luma Grid una alternativa a Asterics Grid?',
      answer:
        'Sí. Ambos son comunicadores AAC web con ARASAAC. Luma Grid añade voces naturales con IA, conjugación automática, predicción de frases y panel para centros. Asterics gana en gratuidad total sin límites y en independencia de proveedor.',
    },
    {
      question: '¿Asterics Grid tiene voces naturales?',
      answer:
        'No. Asterics Grid usa las voces TTS del sistema operativo, que suenan más robóticas. Luma Grid ofrece voces naturales con IA (ElevenLabs) en planes de pago, con entonación expresiva que facilita la comprensión auditiva.',
    },
    {
      question: '¿Cuál es gratis, Luma Grid o Asterics Grid?',
      answer:
        'Ambos tienen opción gratuita. Asterics es 100% gratis sin límites. Luma Grid ofrece un Plan Libre gratuito (sin tarjeta) con funciones básicas, conjugación y predicción IA. Los planes de pago de Luma añaden voces naturales y gestión avanzada.',
    },
    {
      question: '¿Por qué pagar Luma Grid si Asterics es gratis?',
      answer:
        'Por voces naturales con IA (cada alumno puede sonar distinto), conjugación automática de verbos al leer, panel multi-alumno para centros, módulo de evaluación y soporte comercial en español. Si esas funciones no son prioritarias, Asterics es una excelente opción.',
    },
    {
      question: '¿Ambos usan pictogramas ARASAAC?',
      answer:
        'Sí. Asterics Grid se desarrolló en colaboración con ARASAAC. Luma Grid también usa ARASAAC como estándar predeterminado para centros educativos españoles.',
    },
  ],
  hubTeaser:
    'Open source y 100% gratuito con ARASAAC. Compara voces IA, conjugación automática y panel de centro frente a independencia de proveedor.',
}
