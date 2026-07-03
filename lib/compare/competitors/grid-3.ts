import { getBaseFeatureRows, LUMA_TIER_IDENTIDAD, LUMA_TIER_LIBRE, LUMA_TIER_TERAPEUTA, LUMA_TIER_VOZ } from '@/lib/compare/lumaGrid'
import type { ComparePageData } from '@/lib/compare/types'

const SLUG = 'luma-grid-vs-grid-3'
const COMPETITOR = 'Grid 3'
const VENDOR = 'Smartbox (Reino Unido)'

const baseRows = getBaseFeatureRows(COMPETITOR)

const featureRows = baseRows.map(row => {
  switch (row.feature) {
    case 'Plataforma e instalación':
      return {
        ...row,
        competitor:
          'Principalmente Windows (licencia de escritorio). Grid for iPad es producto aparte. Requiere instalación nativa en cada dispositivo.',
        winner: 'luma' as const,
      }
    case 'Precio de entrada':
      return {
        ...row,
        competitor:
          'Prueba gratuita 60 días. Licencia Windows ~650–680 € pago único en España (distribuidores como BJ-Adaptaciones o Qinera/Irisbond). Grid for iPad: ~300–450 € adicionales o suscripción.',
        winner: 'luma' as const,
      }
    case 'Voces naturales con IA':
      return {
        ...row,
        competitor:
          'Voces de sistema y sintetizadores integrados. Calidad funcional, pero sin el nivel expresivo de voces IA dedicadas como ElevenLabs.',
        winner: 'luma' as const,
      }
    case 'Conjugación automática de verbos':
      return {
        ...row,
        competitor:
          'Teclado predictivo y gramática configurable, pero sin conjugación automática al leer orientada a comprensión auditiva en español.',
        winner: 'luma' as const,
      }
    case 'Predicción / autocompletado de frases':
      return {
        ...row,
        competitor: 'Teclado predictivo maduro y ampliamente configurable. Referente en accesibilidad de entrada.',
        winner: 'both' as const,
      }
    case 'Pictogramas ARASAAC':
      return {
        ...row,
        competitor:
          'Múltiples bibliotecas de símbolos (Widgit, SymbolStix, etc.). ARASAAC disponible, pero no es el estándar predeterminado en el ecosistema UK.',
        winner: 'luma' as const,
      }
    case 'Gestión multi-alumno para centros':
      return {
        ...row,
        competitor:
          'No existe plan orientado a profesionales. Licencia por usuario final / puesto Windows; cada alumno o dispositivo requiere su propia licencia.',
        winner: 'luma' as const,
      }
    case 'Módulo de evaluación':
      return {
        ...row,
        competitor: 'Herramientas de seguimiento y personalización avanzada, sin módulo de evaluación AAC integrado equivalente.',
        winner: 'luma' as const,
      }
    case 'Zona Fija / Zona Variable':
      return {
        ...row,
        competitor: 'Grids altamente configurables con múltiples layouts, pero sin el modelo Zona Fija/Variable de Luma Grid.',
        winner: 'luma' as const,
      }
    case 'Modo offline / PWA':
      return {
        ...row,
        competitor: 'Funciona offline en Windows una vez instalado. No es una PWA web multiplataforma.',
        winner: 'both' as const,
      }
    case 'Soporte comercial en español':
      return {
        ...row,
        competitor:
          'Soporte a través de distribuidores españoles (BJ-Adaptaciones, Qinera). Documentación principalmente en inglés.',
        winner: 'both' as const,
      }
    case 'Métodos de acceso avanzados':
      return {
        ...row,
        competitor:
          'Referente del sector: eye-tracking, pulsadores, switches, control de entorno (domótica), acceso por mirada. Ecosistema hardware Grid Pad.',
        winner: 'competitor' as const,
      }
    default:
      return row
  }
})

export const grid3ComparePage: ComparePageData = {
  slug: SLUG,
  competitorName: COMPETITOR,
  competitorShortName: 'Grid 3',
  competitorVendor: VENDOR,
  heroTitle: 'Luma Grid vs Grid 3: ¿cuál elegir?',
  heroVerdict:
    'Luma Grid encaja mejor en centros que buscan precio accesible, acceso web multiplataforma y voces naturales con IA; Grid 3 sigue siendo la opción segura si el alumno ya depende de eye-tracking o hardware Smartbox.',
  heroSubtitle:
    'Comparativa honesta entre el comunicador AAC web en español y el gigante del sector para Windows. Sin afiliación con Smartbox ni sus distribuidores.',
  seo: {
    title: 'Luma Grid vs Grid 3 (2026): alternativa AAC en español con voces IA',
    description:
      'Compara Luma Grid y Grid 3 (Smartbox): precios (desde 0 € vs ~650 €), voces naturales con IA, conjugación automática, ARASAAC y gestión multi-alumno. Alternativa AAC para centros educativos en España.',
    keywords: [
      'alternativa a Grid 3',
      'Grid 3 precio España',
      'Smartbox Grid 3 alternativa',
      'comunicador AAC Windows alternativa',
      'Luma Grid vs Grid 3',
      'Grid 3 comparativa',
      'AAC español',
      'comunicación aumentativa alternativa',
      'voces naturales AAC',
      'ARASAAC comunicador',
      'Grid 3 BJ-Adaptaciones',
      'comunicador eye tracking alternativa',
    ],
  },
  featureRows,
  useCases: [
    {
      title: 'Centro con 30 alumnos',
      scenario:
        'Un CEIP o centro de educación especial necesita equipar varios alumnos con CAA, gestionar perfiles desde un panel y controlar el presupuesto anual.',
      recommendation:
        'Luma Grid: Plan Identidad a 199 €/año por alumno frente a ~650 € por licencia Grid 3 por puesto. Panel multi-alumno, ARASAAC nativo y voces IA sin comprar hardware específico.',
      pick: 'luma',
    },
    {
      title: 'Logopeda autónoma',
      scenario:
        'Profesional que valora voces expresivas, conjugación automática para sesiones más fluidas y un informe de evaluación exportable.',
      recommendation:
        'Luma Grid: voces ElevenLabs, conjugación al leer y módulo de evaluación integrado. Grid 3 solo compensa si tus pacientes ya usan eye-tracking o pulsadores específicos.',
      pick: 'luma',
    },
    {
      title: 'Familia en casa',
      scenario:
        'Familia que quiere probar CAA en el portátil o tablet del hijo sin invertir cientos de euros de entrada.',
      recommendation:
        'Luma Grid Plan Libre (gratis, sin tarjeta) para empezar. Grid 3 ofrece 60 días de prueba, pero la licencia completa supone un desembolso considerable.',
      pick: 'luma',
    },
  ],
  whenCompetitor: {
    title: 'Cuándo elegir Grid 3',
    intro:
      'Grid 3 lleva décadas en el mercado y sigue siendo la referencia en accesibilidad avanzada. Estas son situaciones donde tiene sentido priorizarlo:',
    bullets: [
      'El alumno ya usa eye-tracking (seguimiento ocular) como método principal de acceso.',
      'Necesitas pulsadores, switches o control de entorno (domótica) integrado de forma nativa.',
      'El centro ya tiene hardware Smartbox (Grid Pad) y ecosistema Grid configurado.',
      'Requieres la máxima madurez en teclado predictivo y personalización de acceso físico.',
      'Tu presupuesto contempla licencias de pago único por puesto (~650 €) y posible iPad adicional.',
    ],
  },
  competitorPricing: {
    summary: 'Grid 3 — licencia por usuario final / puesto. Sin plan para profesionales ni centros.',
    pairs: [
      {
        luma: LUMA_TIER_LIBRE,
        competitor: {
          name: 'Prueba gratuita',
          price: '60 días',
          note: 'Periodo de evaluación antes de comprar la licencia. No es un plan permanente.',
        },
      },
      {
        luma: LUMA_TIER_VOZ,
        competitor: {
          name: 'Grid for iPad',
          price: '~300–450 €',
          note: 'Producto separado o suscripción. Opción de pago más económica que la licencia Windows.',
        },
      },
      {
        luma: LUMA_TIER_IDENTIDAD,
        competitor: {
          name: 'Grid 3 (Windows)',
          price: '~650–680 €',
          note: 'Pago único por licencia. Distribuidores: BJ-Adaptaciones, Qinera/Irisbond.',
        },
      },
      {
        luma: LUMA_TIER_TERAPEUTA,
        competitor: {
          name: 'Plan orientado a profesionales',
          price: 'No existe',
          note: 'Modelo por licencia de usuario final: cada puesto Windows (y opcionalmente iPad) se paga aparte.',
          unavailable: true,
        },
      },
    ],
    footnote:
      'Precios orientativos en España (2026). Consultar distribuidor oficial para cotización exacta. Luma Grid: Plan Libre 0 € · Voz 9 €/mes o 79 €/año · Identidad 24 €/mes o 199 €/año · Terapeuta 69 €/mes o 690 €/año.',
  },
  faq: [
    {
      question: '¿Es Luma Grid una alternativa a Grid 3?',
      answer:
        'Sí, especialmente para centros educativos españoles que buscan AAC web multiplataforma con ARASAAC, voces naturales con IA y precio accesible. Grid 3 sigue siendo superior si el alumno necesita eye-tracking, pulsadores o control de entorno integrado.',
    },
    {
      question: '¿Cuánto cuesta Grid 3 frente a Luma Grid en España?',
      answer:
        'Grid 3 cuesta aproximadamente 650–680 € por licencia Windows (pago único), más posible licencia iPad aparte. Luma Grid ofrece un Plan Libre gratuito y planes de pago desde 9 €/mes o 79 €/año (Plan Voz).',
    },
    {
      question: '¿Cuál tiene mejores voces para comunicación AAC?',
      answer:
        'Luma Grid usa voces naturales con IA (ElevenLabs) con entonación expresiva en planes de pago. Grid 3 ofrece voces de sistema funcionales. Para que cada alumno suene distinto y las frases conjugadas se comprendan mejor al escuchar, Luma Grid destaca.',
    },
    {
      question: '¿Grid 3 funciona en iPad o Chromebook?',
      answer:
        'Grid 3 principal es para Windows. Existe Grid for iPad como producto separado (~300–450 €). Luma Grid funciona en cualquier navegador moderno, incluidos iPad, Chromebook y Android, sin licencia adicional por plataforma.',
    },
    {
      question: '¿Puedo usar ARASAAC con Grid 3?',
      answer:
        'Grid 3 soporta múltiples bibliotecas de símbolos, incluida ARASAAC entre otras. Luma Grid usa ARASAAC como estándar predeterminado, alineado con el sistema educativo español.',
    },
  ],
  hubTeaser:
    'El gigante del sector AAC para Windows. Compara precio, voces IA y gestión multi-alumno frente a eye-tracking y hardware Smartbox.',
}
