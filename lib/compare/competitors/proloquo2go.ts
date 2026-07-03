import { getBaseFeatureRows, LUMA_TIER_IDENTIDAD, LUMA_TIER_LIBRE, LUMA_TIER_TERAPEUTA, LUMA_TIER_VOZ } from '@/lib/compare/lumaGrid'
import type { ComparePageData } from '@/lib/compare/types'

const SLUG = 'luma-grid-vs-proloquo2go'
const COMPETITOR = 'Proloquo2Go'
const VENDOR = 'AssistiveWare (Países Bajos)'

const baseRows = getBaseFeatureRows(COMPETITOR)

const featureRows = baseRows.map(row => {
  switch (row.feature) {
    case 'Plataforma e instalación':
      return {
        ...row,
        competitor:
          'Solo ecosistema Apple: iPad, iPhone, Mac y Apple Watch. Requiere App Store. No disponible en Android ni Windows.',
        winner: 'luma' as const,
      }
    case 'Precio de entrada':
      return {
        ...row,
        competitor: '~300 € pago único en iOS. ~150 € en Mac. Sin plan gratuito permanente.',
        winner: 'luma' as const,
      }
    case 'Voces naturales con IA':
      return {
        ...row,
        competitor:
          'Más de 100 voces naturales (Acapela Neural). Referente en calidad de voz en el ecosistema Apple.',
        winner: 'both' as const,
      }
    case 'Conjugación automática de verbos':
      return {
        ...row,
        competitor:
          'Gramática y morphología configurables, pero sin conjugación automática al leer orientada a comprensión auditiva en español.',
        winner: 'luma' as const,
      }
    case 'Predicción / autocompletado de frases':
      return {
        ...row,
        competitor:
          'Vocabulario Crescendo basado en investigación con predicción contextual madura. Referente mundial.',
        winner: 'competitor' as const,
      }
    case 'Pictogramas ARASAAC':
      return {
        ...row,
        competitor:
          'Más de 27.000 símbolos SymbolStix (no ARASAAC). Estándar internacional, no alineado con centros españoles.',
        winner: 'luma' as const,
      }
    case 'Gestión multi-alumno para centros':
      return {
        ...row,
        competitor:
          'No existe plan orientado a profesionales. Licencia por usuario final: una compra por dispositivo Apple (iPad/iPhone/Mac) y usuario.',
        winner: 'luma' as const,
      }
    case 'Módulo de evaluación':
      return {
        ...row,
        competitor: 'Sin módulo de evaluación AAC integrado equivalente al de Luma Grid.',
        winner: 'luma' as const,
      }
    case 'Zona Fija / Zona Variable':
      return {
        ...row,
        competitor: 'Layouts configurables con vocabulario Crescendo, sin modelo Zona Fija/Variable.',
        winner: 'luma' as const,
      }
    case 'Modo offline / PWA':
      return {
        ...row,
        competitor: 'Funciona offline en dispositivos Apple una vez instalada la app nativa.',
        winner: 'both' as const,
      }
    case 'Soporte comercial en español':
      return {
        ...row,
        competitor: 'Soporte de AssistiveWare en varios idiomas. Comunidad global amplia.',
        winner: 'both' as const,
      }
    case 'Métodos de acceso avanzados':
      return {
        ...row,
        competitor: 'Switch scanning, Touch Accommodations de iOS. Sin eye-tracking dedicado como Grid 3.',
        winner: 'both' as const,
      }
    default:
      return row
  }
})

export const proloquo2goComparePage: ComparePageData = {
  slug: SLUG,
  competitorName: COMPETITOR,
  competitorShortName: 'Proloquo2Go',
  competitorVendor: VENDOR,
  heroTitle: 'Luma Grid vs Proloquo2Go: ¿cuál elegir?',
  heroVerdict:
    'Proloquo2Go sigue siendo referencia en ecosistema Apple y vocabulario Crescendo; Luma Grid encaja mejor si el centro no puede comprar iPads, necesita ARASAAC y gestión multi-alumno desde un panel web.',
  heroSubtitle:
    'Comparativa entre el comunicador AAC líder en iOS y la alternativa web en español con ARASAAC. Sin afiliación con AssistiveWare.',
  seo: {
    title: 'Luma Grid vs Proloquo2Go: alternativa AAC sin iPad con ARASAAC',
    description:
      'Compara Luma Grid y Proloquo2Go: funciona en cualquier dispositivo (desde 0 €) vs solo Apple (~300 €), ARASAAC vs SymbolStix, voces IA, conjugación automática y gestión multi-alumno para centros.',
    keywords: [
      'alternativa Proloquo2Go',
      'Proloquo2Go Android alternativa',
      'Proloquo2Go precio alternativa',
      'Proloquo2Go ARASAAC alternativa',
      'Luma Grid vs Proloquo2Go',
      'Proloquo2Go comparativa',
      'comunicador AAC español',
      'Proloquo2Go iPad alternativa',
      'CAA sin iPad',
      'voces naturales AAC español',
      'comunicador multiplataforma',
      'AssistiveWare alternativa',
    ],
  },
  featureRows,
  useCases: [
    {
      title: 'Centro con 30 alumnos',
      scenario:
        'Centro educativo con Chromebooks, portátiles Windows y algunos iPads. Necesita desplegar CAA homogéneo y gestionar perfiles centralizadamente.',
      recommendation:
        'Luma Grid: funciona en todos los dispositivos del centro, ARASAAC nativo y panel multi-alumno. Proloquo2Go exige iPad por alumno (~300 € cada uno) sin gestión centralizada.',
      pick: 'luma',
    },
    {
      title: 'Logopeda autónoma',
      scenario:
        'Profesional que valora informes de evaluación, conjugación automática al leer y voces expresivas en español.',
      recommendation:
        'Luma Grid: evaluación integrada, conjugación al leer y voces IA en español. Proloquo2Go destaca si tus pacientes ya usan iPad y el vocabulario Crescendo en inglés/español bilingüe.',
      pick: 'depends',
    },
    {
      title: 'Familia en casa',
      scenario:
        'Familia con Android o Windows en casa, sin iPad, que quiere empezar con CAA sin gran inversión.',
      recommendation:
        'Luma Grid Plan Libre (gratis, sin tarjeta) en cualquier dispositivo. Proloquo2Go requiere comprar un iPad y la app (~300 € mínimo).',
      pick: 'luma',
    },
  ],
  whenCompetitor: {
    title: 'Cuándo elegir Proloquo2Go',
    intro:
      'Proloquo2Go es el comunicador AAC más conocido del mundo en dispositivos Apple. Estas son situaciones donde tiene sentido priorizarlo:',
    bullets: [
      'El alumno ya usa iPad como dispositivo principal y la familia está invertida en el ecosistema Apple.',
      'Necesitas el vocabulario Crescendo basado en investigación, referente en diseño de vocabulario AAC.',
      'Buscas más de 100 voces Acapela Neural de alta calidad dentro del ecosistema iOS.',
      'Requieres modo bilingüe maduro (p. ej. inglés/español) con SymbolStix.',
      'Valoras la trayectoria y comunidad global de AssistiveWare como respaldo.',
    ],
  },
  competitorPricing: {
    summary: 'Proloquo2Go — licencia por usuario final / dispositivo Apple. Sin plan para profesionales ni centros.',
    pairs: [
      {
        luma: LUMA_TIER_LIBRE,
        competitor: {
          name: 'Plan gratuito / prueba',
          price: 'No existe',
          note: 'Sin plan gratuito permanente ni periodo de prueba equivalente al Plan Libre de Luma Grid.',
          unavailable: true,
        },
      },
      {
        luma: LUMA_TIER_VOZ,
        competitor: {
          name: 'Proloquo2Go (Mac)',
          price: '~150 €',
          note: 'Pago único en Mac App Store. Opción de licencia más económica del ecosistema Apple.',
        },
      },
      {
        luma: LUMA_TIER_IDENTIDAD,
        competitor: {
          name: 'Proloquo2Go (iOS)',
          price: '~300 €',
          note: 'Pago único en App Store. Por iPad/iPhone — la licencia más costosa del producto.',
        },
      },
      {
        luma: LUMA_TIER_TERAPEUTA,
        competitor: {
          name: 'Plan orientado a profesionales',
          price: 'No existe',
          note: 'Modelo por licencia de usuario final: cada iPad, iPhone o Mac requiere su propia compra en App Store.',
          unavailable: true,
        },
      },
    ],
    footnote:
      'Precios orientativos (2026). Sin plan gratuito permanente. Luma Grid: Plan Libre 0 € · Voz 9 €/mes o 79 €/año · Identidad 24 €/mes o 199 €/año · Terapeuta 69 €/mes o 690 €/año.',
  },
  faq: [
    {
      question: '¿Es Luma Grid una alternativa a Proloquo2Go?',
      answer:
        'Sí, especialmente para centros y familias en España que necesitan AAC en cualquier dispositivo (no solo iPad), con ARASAAC y gestión multi-alumno. Proloquo2Go sigue siendo superior en vocabulario Crescendo y ecosistema Apple.',
    },
    {
      question: '¿Proloquo2Go funciona en Android o Windows?',
      answer:
        'No. Proloquo2Go solo está disponible en dispositivos Apple (iPad, iPhone, Mac, Apple Watch). Luma Grid funciona en cualquier navegador moderno: Windows, Mac, Chromebook, iPad, Android.',
    },
    {
      question: '¿Cuál usa ARASAAC, Luma Grid o Proloquo2Go?',
      answer:
        'Luma Grid usa ARASAAC como estándar predeterminado, alineado con centros educativos españoles. Proloquo2Go usa SymbolStix (+27.000 símbolos), un estándar internacional diferente.',
    },
    {
      question: '¿Cuál tiene mejores voces naturales?',
      answer:
        'Ambos ofrecen voces naturales de alta calidad en planes de pago: Proloquo2Go con Acapela Neural (+100 voces) y Luma Grid con ElevenLabs. Luma Grid destaca además en conjugación automática al leer, lo que mejora la comprensión auditiva de las frases.',
    },
    {
      question: '¿Cuánto cuesta Proloquo2Go frente a Luma Grid?',
      answer:
        'Proloquo2Go cuesta ~300 € pago único por iPad (sin plan gratis). Luma Grid ofrece Plan Libre gratuito y planes desde 9 €/mes o 79 €/año (Plan Voz con voces naturales IA).',
    },
  ],
  hubTeaser:
    'Referente mundial en iOS con vocabulario Crescendo. Compara multiplataforma web, ARASAAC y gestión de centro frente al ecosistema Apple.',
}
