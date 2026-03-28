import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function makeSurface(surface, extra = {}) {
  return {
    surface,
    normalizedSurface: normalizeText(surface),
    formType: extra.formType ?? 'base',
    person: extra.person ?? null,
    tense: extra.tense ?? null,
    mood: extra.mood ?? null,
    number: extra.number ?? null,
    gender: extra.gender ?? null,
    confidence: extra.confidence ?? 1,
  }
}

function makeLexemeEntry(lemma, primaryPos, extra = {}) {
  return {
    lemma,
    primaryPos,
    aacPriority: extra.aacPriority ?? 40,
    frequencyScore: extra.frequencyScore ?? 0.6,
    ...extra,
    forms: extra.forms ?? [makeSurface(lemma)],
  }
}

const DEFAULT_PANEL_EXTRA_LEXEMES = [
  makeLexemeEntry('ellos', 'pronoun', {
    aacPriority: 68,
    frequencyScore: 0.72,
    forms: [
      makeSurface('ellos', { gender: 'masc', number: 'plural' }),
      makeSurface('ellas', { formType: 'variant', gender: 'fem', number: 'plural' }),
    ],
  }),
  makeLexemeEntry('vosotros', 'pronoun', {
    aacPriority: 62,
    frequencyScore: 0.64,
    forms: [
      makeSurface('vosotros', { gender: 'masc', number: 'plural' }),
      makeSurface('vosotras', { formType: 'variant', gender: 'fem', number: 'plural' }),
    ],
  }),
  makeLexemeEntry('personas', 'noun', {
    gender: 'fem',
    numberBehavior: 'plural',
    aacPriority: 78,
    frequencyScore: 0.74,
    forms: [
      makeSurface('personas', { gender: 'fem', number: 'plural' }),
      makeSurface('persona', { formType: 'singular', gender: 'fem', number: 'singular' }),
    ],
  }),
  makeLexemeEntry('abuelo', 'noun', {
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 62,
    frequencyScore: 0.6,
    forms: [
      makeSurface('abuelo', { gender: 'masc', number: 'singular' }),
      makeSurface('abuelos', { formType: 'plural', gender: 'masc', number: 'plural' }),
    ],
  }),
  makeLexemeEntry('abuela', 'noun', {
    gender: 'fem',
    numberBehavior: 'both',
    aacPriority: 62,
    frequencyScore: 0.6,
    forms: [
      makeSurface('abuela', { gender: 'fem', number: 'singular' }),
      makeSurface('abuelas', { formType: 'plural', gender: 'fem', number: 'plural' }),
    ],
  }),
  makeLexemeEntry('hermano', 'noun', {
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 70,
    frequencyScore: 0.66,
    forms: [
      makeSurface('hermano', { gender: 'masc', number: 'singular' }),
      makeSurface('hermanos', { formType: 'plural', gender: 'masc', number: 'plural' }),
    ],
  }),
  makeLexemeEntry('hermana', 'noun', {
    gender: 'fem',
    numberBehavior: 'both',
    aacPriority: 70,
    frequencyScore: 0.66,
    forms: [
      makeSurface('hermana', { gender: 'fem', number: 'singular' }),
      makeSurface('hermanas', { formType: 'plural', gender: 'fem', number: 'plural' }),
    ],
  }),
  makeLexemeEntry('qué', 'pronoun', {
    aacPriority: 82,
    frequencyScore: 0.86,
    forms: [
      makeSurface('qué'),
      makeSurface('¿qué?', { formType: 'question' }),
      makeSurface('que', { formType: 'variant', confidence: 0.6 }),
    ],
  }),
  makeLexemeEntry('quién', 'pronoun', {
    aacPriority: 80,
    frequencyScore: 0.82,
    forms: [
      makeSurface('quién'),
      makeSurface('¿quién?', { formType: 'question' }),
      makeSurface('quien', { formType: 'variant', confidence: 0.6 }),
    ],
  }),
  makeLexemeEntry('dónde', 'adverb', {
    aacPriority: 78,
    frequencyScore: 0.8,
    forms: [
      makeSurface('dónde'),
      makeSurface('¿dónde?', { formType: 'question' }),
      makeSurface('donde', { formType: 'variant', confidence: 0.6 }),
    ],
  }),
  makeLexemeEntry('cuándo', 'adverb', {
    aacPriority: 78,
    frequencyScore: 0.8,
    forms: [
      makeSurface('cuándo'),
      makeSurface('¿cuándo?', { formType: 'question' }),
      makeSurface('cuando', { formType: 'variant', confidence: 0.6 }),
    ],
  }),
  makeLexemeEntry('cómo', 'adverb', {
    aacPriority: 74,
    frequencyScore: 0.78,
    forms: [
      makeSurface('cómo'),
      makeSurface('¿cómo?', { formType: 'question' }),
      makeSurface('como', { formType: 'variant', confidence: 0.6 }),
    ],
  }),
  makeLexemeEntry('por qué', 'adverb', {
    aacPriority: 74,
    frequencyScore: 0.76,
    forms: [
      makeSurface('por qué'),
      makeSurface('¿por qué?', { formType: 'question' }),
      makeSurface('por que', { formType: 'variant', confidence: 0.6 }),
    ],
  }),
  ...[
    ['dar', 'ir', true, 'transitive', 84, 0.82],
    ['poner', 'er', true, 'transitive', 82, 0.8],
    ['sentir', 'ir', true, 'both', 80, 0.78],
    ['hacer', 'er', true, 'transitive', 88, 0.9],
    ['escuchar', 'ar', false, 'transitive', 72, 0.72],
    ['pensar', 'ar', true, 'transitive', 76, 0.76],
    ['coger', 'er', false, 'transitive', 72, 0.68],
    ['ayudar', 'ar', false, 'transitive', 76, 0.78],
    ['poder', 'er', true, 'both', 86, 0.9],
    ['terminar', 'ar', false, 'transitive', 68, 0.7],
    ['decir', 'ir', true, 'transitive', 86, 0.88],
  ].map(([lemma, verbGroup, isIrregular, transitivity, aacPriority, frequencyScore]) =>
    makeLexemeEntry(lemma, 'verb', {
      verbGroup,
      isIrregular,
      transitivity,
      aacPriority,
      frequencyScore,
      forms: [makeSurface(lemma, { formType: 'infinitive', mood: 'infinitive' })],
    }),
  ),
  ...[
    ['leche', 'fem', 'both', 78, 0.74],
    ['pan', 'masc', 'both', 80, 0.78],
    ['fruta', 'fem', 'both', 72, 0.74],
    ['pasta', 'fem', 'both', 70, 0.7],
    ['pollo', 'masc', 'both', 68, 0.68],
    ['zumo', 'masc', 'both', 66, 0.66],
    ['médico', 'masc', 'both', 66, 0.66],
    ['tienda', 'fem', 'both', 64, 0.68],
    ['cama', 'fem', 'both', 72, 0.74],
    ['mesa', 'fem', 'both', 64, 0.68],
    ['miedo', 'masc', 'singular', 82, 0.8],
    ['teclado', 'masc', 'both', 58, 0.64],
    ['charla rápida', 'fem', 'singular', 40, 0.5],
    ['juegos', 'masc', 'plural', 42, 0.52],
    ['partículas', 'fem', 'plural', 38, 0.46],
    ['alimentos', 'masc', 'plural', 44, 0.54],
    ['lácteos', 'masc', 'plural', 38, 0.48],
    ['objetos', 'masc', 'plural', 40, 0.5],
    ['lugares', 'masc', 'plural', 42, 0.54],
    ['bebidas', 'fem', 'plural', 42, 0.5],
    ['ropa', 'fem', 'singular', 42, 0.52],
    ['cuerpo', 'masc', 'singular', 44, 0.56],
    ['animales', 'masc', 'plural', 42, 0.52],
    ['colores', 'masc', 'plural', 40, 0.5],
    ['tiempo+', 'masc', 'singular', 38, 0.48],
    ['más verbos', 'masc', 'plural', 38, 0.48],
    ['muebles', 'masc', 'plural', 40, 0.5],
    ['complementos', 'masc', 'plural', 40, 0.5],
    ['aparatos', 'masc', 'plural', 40, 0.5],
    ['transportes', 'masc', 'plural', 40, 0.5],
    ['plantas', 'fem', 'plural', 40, 0.5],
    ['fiesta', 'fem', 'singular', 42, 0.56],
    ['conceptos', 'masc', 'plural', 38, 0.48],
    ['actividades', 'fem', 'plural', 40, 0.5],
    ['descripción', 'fem', 'singular', 40, 0.5],
    ['formas y medidas', 'fem', 'plural', 36, 0.44],
    ['números', 'masc', 'plural', 40, 0.48],
    ['aficiones', 'fem', 'plural', 38, 0.46],
    ['frases hechas', 'fem', 'plural', 36, 0.44],
  ].map(([lemma, gender, numberBehavior, aacPriority, frequencyScore]) =>
    makeLexemeEntry(lemma, 'noun', {
      gender,
      numberBehavior,
      aacPriority,
      frequencyScore,
      forms: [makeSurface(lemma, {
        gender,
        number: numberBehavior === 'plural' ? 'plural' : 'singular',
      })],
    }),
  ),
  ...[
    ['feliz', 74, 0.78, [makeSurface('feliz'), makeSurface('felices', { formType: 'plural', number: 'plural' })]],
    [
      'enfadado',
      70,
      0.72,
      [
        makeSurface('enfadado', { gender: 'masc', number: 'singular' }),
        makeSurface('enfadada', { formType: 'variant', gender: 'fem', number: 'singular' }),
        makeSurface('enfadados', { formType: 'plural', gender: 'masc', number: 'plural' }),
        makeSurface('enfadadas', { formType: 'plural', gender: 'fem', number: 'plural' }),
      ],
    ],
    [
      'diferente',
      62,
      0.68,
      [makeSurface('diferente'), makeSurface('diferentes', { formType: 'plural', number: 'plural' })],
    ],
  ].map(([lemma, aacPriority, frequencyScore, forms]) =>
    makeLexemeEntry(lemma, 'adj', {
      aacPriority,
      frequencyScore,
      forms,
    }),
  ),
  ...[
    ['bien', 84, 0.88],
    ['mal', 82, 0.86],
    ['ayer', 72, 0.76],
    ['hoy', 88, 0.9],
    ['mañana', 86, 0.88],
    ['después', 68, 0.72],
    ['antes', 68, 0.72],
    ['siempre', 74, 0.78],
    ['nunca', 74, 0.78],
    ['mucho', 76, 0.8],
    ['muy', 84, 0.9],
    ['también', 74, 0.8],
  ].map(([lemma, aacPriority, frequencyScore]) =>
    makeLexemeEntry(lemma, 'adverb', {
      aacPriority,
      frequencyScore,
      forms: [
        makeSurface(lemma),
        ...(lemma === 'mañana' ? [makeSurface('manana', { formType: 'variant', confidence: 0.6 })] : []),
        ...(lemma === 'después' ? [makeSurface('despues', { formType: 'variant', confidence: 0.6 })] : []),
        ...(lemma === 'también' ? [makeSurface('tambien', { formType: 'variant', confidence: 0.6 })] : []),
      ],
    }),
  ),
  makeLexemeEntry('este', 'det', {
    aacPriority: 56,
    frequencyScore: 0.72,
    forms: [
      makeSurface('este', { gender: 'masc', number: 'singular' }),
      makeSurface('esta', { formType: 'variant', gender: 'fem', number: 'singular' }),
      makeSurface('estos', { formType: 'plural', gender: 'masc', number: 'plural' }),
      makeSurface('estas', { formType: 'plural', gender: 'fem', number: 'plural' }),
    ],
  }),
  makeLexemeEntry('no lo sé', 'interj', {
    aacPriority: 58,
    frequencyScore: 0.68,
    forms: [
      makeSurface('no lo sé'),
      makeSurface('no lo se', { formType: 'variant', confidence: 0.7 }),
    ],
  }),
]

const LEXEME_SEED = [
  {
    lemma: 'yo',
    primaryPos: 'pronoun',
    aacPriority: 100,
    frequencyScore: 0.99,
    forms: [makeSurface('yo')],
  },
  {
    lemma: 'tú',
    primaryPos: 'pronoun',
    aacPriority: 100,
    frequencyScore: 0.99,
    forms: [makeSurface('tú'), makeSurface('tu', { formType: 'variant', confidence: 0.7 })],
  },
  {
    lemma: 'él',
    primaryPos: 'pronoun',
    aacPriority: 72,
    frequencyScore: 0.78,
    forms: [makeSurface('él')],
  },
  {
    lemma: 'ella',
    primaryPos: 'pronoun',
    aacPriority: 72,
    frequencyScore: 0.78,
    forms: [makeSurface('ella')],
  },
  {
    lemma: 'nosotros',
    primaryPos: 'pronoun',
    aacPriority: 68,
    frequencyScore: 0.72,
    forms: [makeSurface('nosotros'), makeSurface('nosotras', { formType: 'variant', gender: 'fem' })],
  },
  {
    lemma: 'me',
    primaryPos: 'pronoun',
    aacPriority: 74,
    frequencyScore: 0.83,
    forms: [makeSurface('me')],
  },
  {
    lemma: 'te',
    primaryPos: 'pronoun',
    aacPriority: 74,
    frequencyScore: 0.83,
    forms: [makeSurface('te')],
  },
  {
    lemma: 'el',
    primaryPos: 'det',
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 60,
    frequencyScore: 0.95,
    forms: [
      makeSurface('el', { gender: 'masc', number: 'singular' }),
      makeSurface('los', { formType: 'plural', gender: 'masc', number: 'plural' }),
    ],
  },
  {
    lemma: 'la',
    primaryPos: 'det',
    gender: 'fem',
    numberBehavior: 'both',
    aacPriority: 60,
    frequencyScore: 0.95,
    forms: [
      makeSurface('la', { gender: 'fem', number: 'singular' }),
      makeSurface('las', { formType: 'plural', gender: 'fem', number: 'plural' }),
    ],
  },
  {
    lemma: 'un',
    primaryPos: 'det',
    gender: 'masc',
    aacPriority: 52,
    frequencyScore: 0.88,
    forms: [
      makeSurface('un', { gender: 'masc', number: 'singular' }),
      makeSurface('una', { formType: 'variant', gender: 'fem', number: 'singular' }),
    ],
  },
  {
    lemma: 'mi',
    primaryPos: 'det',
    aacPriority: 58,
    frequencyScore: 0.82,
    forms: [makeSurface('mi'), makeSurface('mis', { formType: 'plural', number: 'plural' })],
  },
  {
    lemma: 'tu',
    primaryPos: 'det',
    aacPriority: 58,
    frequencyScore: 0.82,
    forms: [makeSurface('tu'), makeSurface('tus', { formType: 'plural', number: 'plural' })],
  },
  {
    lemma: 'a',
    primaryPos: 'prep',
    aacPriority: 36,
    frequencyScore: 0.91,
    forms: [makeSurface('a')],
  },
  {
    lemma: 'de',
    primaryPos: 'prep',
    aacPriority: 36,
    frequencyScore: 0.91,
    forms: [makeSurface('de')],
  },
  {
    lemma: 'en',
    primaryPos: 'prep',
    aacPriority: 46,
    frequencyScore: 0.9,
    forms: [makeSurface('en')],
  },
  {
    lemma: 'con',
    primaryPos: 'prep',
    aacPriority: 52,
    frequencyScore: 0.84,
    forms: [makeSurface('con')],
  },
  {
    lemma: 'sin',
    primaryPos: 'prep',
    aacPriority: 50,
    frequencyScore: 0.76,
    forms: [makeSurface('sin')],
  },
  {
    lemma: 'para',
    primaryPos: 'prep',
    aacPriority: 54,
    frequencyScore: 0.8,
    forms: [makeSurface('para')],
  },
  {
    lemma: 'y',
    primaryPos: 'conj',
    aacPriority: 48,
    frequencyScore: 0.95,
    forms: [makeSurface('y')],
  },
  {
    lemma: 'o',
    primaryPos: 'conj',
    aacPriority: 44,
    frequencyScore: 0.86,
    forms: [makeSurface('o')],
  },
  {
    lemma: 'pero',
    primaryPos: 'conj',
    aacPriority: 40,
    frequencyScore: 0.82,
    forms: [makeSurface('pero')],
  },
  {
    lemma: 'no',
    primaryPos: 'adv',
    aacPriority: 96,
    frequencyScore: 0.97,
    forms: [makeSurface('no')],
  },
  {
    lemma: 'sí',
    primaryPos: 'adv',
    aacPriority: 94,
    frequencyScore: 0.96,
    forms: [makeSurface('sí'), makeSurface('si', { formType: 'variant', confidence: 0.65 })],
  },
  {
    lemma: 'más',
    primaryPos: 'adv',
    aacPriority: 86,
    frequencyScore: 0.88,
    forms: [makeSurface('más'), makeSurface('mas', { formType: 'variant', confidence: 0.6 })],
  },
  {
    lemma: 'aquí',
    primaryPos: 'adv',
    aacPriority: 72,
    frequencyScore: 0.7,
    forms: [makeSurface('aquí'), makeSurface('aqui', { formType: 'variant', confidence: 0.7 })],
  },
  {
    lemma: 'ahora',
    primaryPos: 'adv',
    aacPriority: 88,
    frequencyScore: 0.89,
    forms: [makeSurface('ahora')],
  },
  {
    lemma: 'querer',
    primaryPos: 'verb',
    verbGroup: 'er',
    isIrregular: true,
    transitivity: 'both',
    aacPriority: 100,
    frequencyScore: 0.98,
    forms: [
      makeSurface('querer', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('quiero', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('quieres', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('quiere', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('queremos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('quieren', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('queriendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('querido', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'ir',
    primaryPos: 'verb',
    verbGroup: 'ir',
    isIrregular: true,
    transitivity: 'intransitive',
    aacPriority: 98,
    frequencyScore: 0.95,
    forms: [
      makeSurface('ir', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('voy', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('vas', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('va', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('vamos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('van', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('yendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('ido', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'comer',
    primaryPos: 'verb',
    verbGroup: 'er',
    transitivity: 'transitive',
    aacPriority: 96,
    frequencyScore: 0.92,
    forms: [
      makeSurface('comer', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('como', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('comes', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('come', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('comemos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('comen', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('comiendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('comido', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'beber',
    primaryPos: 'verb',
    verbGroup: 'er',
    transitivity: 'transitive',
    aacPriority: 92,
    frequencyScore: 0.86,
    forms: [
      makeSurface('beber', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('bebo', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('bebes', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('bebe', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('bebemos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('beben', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('bebiendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('bebido', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'tener',
    primaryPos: 'verb',
    verbGroup: 'er',
    isIrregular: true,
    transitivity: 'transitive',
    aacPriority: 90,
    frequencyScore: 0.93,
    forms: [
      makeSurface('tener', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('tengo', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('tienes', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('tiene', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('tenemos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('tienen', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('teniendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('tenido', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'gustar',
    primaryPos: 'verb',
    verbGroup: 'ar',
    transitivity: 'transitive',
    aacPriority: 86,
    frequencyScore: 0.82,
    forms: [
      makeSurface('gustar', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('gusta', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('gustan', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('gustando', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('gustado', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'necesitar',
    primaryPos: 'verb',
    verbGroup: 'ar',
    transitivity: 'transitive',
    aacPriority: 94,
    frequencyScore: 0.87,
    forms: [
      makeSurface('necesitar', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('necesito', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('necesitas', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('necesita', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('necesitamos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('necesitan', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('necesitando', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('necesitado', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'dormir',
    primaryPos: 'verb',
    verbGroup: 'ir',
    isIrregular: true,
    transitivity: 'intransitive',
    aacPriority: 84,
    frequencyScore: 0.8,
    forms: [
      makeSurface('dormir', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('duermo', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('duermes', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('duerme', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('dormimos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('duermen', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('durmiendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('dormido', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'jugar',
    primaryPos: 'verb',
    verbGroup: 'ar',
    isIrregular: true,
    transitivity: 'both',
    aacPriority: 82,
    frequencyScore: 0.79,
    forms: [
      makeSurface('jugar', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('juego', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('juegas', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('juega', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('jugamos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('juegan', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('jugando', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('jugado', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'ver',
    primaryPos: 'verb',
    verbGroup: 'er',
    isIrregular: true,
    transitivity: 'transitive',
    aacPriority: 78,
    frequencyScore: 0.82,
    forms: [
      makeSurface('ver', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('veo', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('ves', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('ve', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('vemos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('ven', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('viendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('visto', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'estar',
    primaryPos: 'verb',
    verbGroup: 'ar',
    isIrregular: true,
    transitivity: 'intransitive',
    aacPriority: 70,
    frequencyScore: 0.84,
    forms: [
      makeSurface('estar', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('estoy', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('estás', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('está', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('estamos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('están', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('estando', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('estado', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'ser',
    primaryPos: 'verb',
    verbGroup: 'er',
    isIrregular: true,
    transitivity: 'intransitive',
    aacPriority: 62,
    frequencyScore: 0.9,
    forms: [
      makeSurface('ser', { formType: 'infinitive', mood: 'infinitive' }),
      makeSurface('soy', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'singular' }),
      makeSurface('eres', { formType: 'finite', mood: 'indicative', tense: 'present', person: 2, number: 'singular' }),
      makeSurface('es', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'singular' }),
      makeSurface('somos', { formType: 'finite', mood: 'indicative', tense: 'present', person: 1, number: 'plural' }),
      makeSurface('son', { formType: 'finite', mood: 'indicative', tense: 'present', person: 3, number: 'plural' }),
      makeSurface('siendo', { formType: 'gerund', mood: 'gerund' }),
      makeSurface('sido', { formType: 'participle', mood: 'participle', gender: 'masc' }),
    ],
  },
  {
    lemma: 'agua',
    primaryPos: 'noun',
    gender: 'fem',
    numberBehavior: 'both',
    aacPriority: 100,
    frequencyScore: 0.98,
    forms: [makeSurface('agua', { number: 'singular', gender: 'fem' }), makeSurface('aguas', { formType: 'plural', number: 'plural', gender: 'fem' })],
  },
  {
    lemma: 'baño',
    primaryPos: 'noun',
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 96,
    frequencyScore: 0.9,
    aliases: [{ alias: 'wc', aliasType: 'aac-shortcut' }, { alias: 'aseo', aliasType: 'synonym' }],
    forms: [makeSurface('baño', { number: 'singular', gender: 'masc' }), makeSurface('baños', { formType: 'plural', number: 'plural', gender: 'masc' })],
  },
  {
    lemma: 'casa',
    primaryPos: 'noun',
    gender: 'fem',
    numberBehavior: 'both',
    aacPriority: 90,
    frequencyScore: 0.9,
    forms: [makeSurface('casa', { number: 'singular', gender: 'fem' }), makeSurface('casas', { formType: 'plural', number: 'plural', gender: 'fem' })],
  },
  {
    lemma: 'colegio',
    primaryPos: 'noun',
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 82,
    frequencyScore: 0.75,
    aliases: [{ alias: 'cole', aliasType: 'aac-shortcut' }],
    forms: [makeSurface('colegio', { number: 'singular', gender: 'masc' }), makeSurface('colegios', { formType: 'plural', number: 'plural', gender: 'masc' })],
  },
  {
    lemma: 'parque',
    primaryPos: 'noun',
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 76,
    frequencyScore: 0.72,
    forms: [makeSurface('parque', { number: 'singular', gender: 'masc' }), makeSurface('parques', { formType: 'plural', number: 'plural', gender: 'masc' })],
  },
  {
    lemma: 'galleta',
    primaryPos: 'noun',
    gender: 'fem',
    numberBehavior: 'both',
    aacPriority: 74,
    frequencyScore: 0.68,
    forms: [makeSurface('galleta', { number: 'singular', gender: 'fem' }), makeSurface('galletas', { formType: 'plural', number: 'plural', gender: 'fem' })],
  },
  {
    lemma: 'dolor',
    primaryPos: 'noun',
    gender: 'masc',
    numberBehavior: 'singular',
    aacPriority: 92,
    frequencyScore: 0.81,
    forms: [makeSurface('dolor', { number: 'singular', gender: 'masc' })],
  },
  {
    lemma: 'ayuda',
    primaryPos: 'noun',
    gender: 'fem',
    numberBehavior: 'singular',
    aacPriority: 98,
    frequencyScore: 0.91,
    forms: [makeSurface('ayuda', { number: 'singular', gender: 'fem' })],
  },
  {
    lemma: 'mamá',
    primaryPos: 'noun',
    gender: 'fem',
    numberBehavior: 'singular',
    aacPriority: 88,
    frequencyScore: 0.86,
    aliases: [{ alias: 'mami', aliasType: 'nickname' }],
    forms: [makeSurface('mamá', { number: 'singular', gender: 'fem' }), makeSurface('mama', { formType: 'variant', confidence: 0.75 })],
  },
  {
    lemma: 'papá',
    primaryPos: 'noun',
    gender: 'masc',
    numberBehavior: 'singular',
    aacPriority: 88,
    frequencyScore: 0.86,
    aliases: [{ alias: 'papi', aliasType: 'nickname' }],
    forms: [makeSurface('papá', { number: 'singular', gender: 'masc' }), makeSurface('papa', { formType: 'variant', confidence: 0.6 })],
  },
  {
    lemma: 'grande',
    primaryPos: 'adj',
    numberBehavior: 'both',
    aacPriority: 58,
    frequencyScore: 0.78,
    forms: [makeSurface('grande'), makeSurface('grandes', { formType: 'plural', number: 'plural' })],
  },
  {
    lemma: 'pequeño',
    primaryPos: 'adj',
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 58,
    frequencyScore: 0.75,
    forms: [
      makeSurface('pequeño', { gender: 'masc', number: 'singular' }),
      makeSurface('pequeña', { formType: 'variant', gender: 'fem', number: 'singular' }),
      makeSurface('pequeños', { formType: 'plural', gender: 'masc', number: 'plural' }),
      makeSurface('pequeñas', { formType: 'plural', gender: 'fem', number: 'plural' }),
    ],
  },
  {
    lemma: 'cansado',
    primaryPos: 'adj',
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 64,
    frequencyScore: 0.7,
    forms: [
      makeSurface('cansado', { gender: 'masc', number: 'singular' }),
      makeSurface('cansada', { formType: 'variant', gender: 'fem', number: 'singular' }),
      makeSurface('cansados', { formType: 'plural', gender: 'masc', number: 'plural' }),
      makeSurface('cansadas', { formType: 'plural', gender: 'fem', number: 'plural' }),
    ],
  },
  {
    lemma: 'contento',
    primaryPos: 'adj',
    gender: 'masc',
    numberBehavior: 'both',
    aacPriority: 66,
    frequencyScore: 0.7,
    forms: [
      makeSurface('contento', { gender: 'masc', number: 'singular' }),
      makeSurface('contenta', { formType: 'variant', gender: 'fem', number: 'singular' }),
      makeSurface('contentos', { formType: 'plural', gender: 'masc', number: 'plural' }),
      makeSurface('contentas', { formType: 'plural', gender: 'fem', number: 'plural' }),
    ],
  },
  {
    lemma: 'triste',
    primaryPos: 'adj',
    numberBehavior: 'both',
    aacPriority: 70,
    frequencyScore: 0.74,
    forms: [makeSurface('triste'), makeSurface('tristes', { formType: 'plural', number: 'plural' })],
  },
  ...DEFAULT_PANEL_EXTRA_LEXEMES,
]

async function upsertLexeme(entry) {
  const normalizedLemma = normalizeText(entry.lemma)
  const lexeme = await prisma.lexeme.upsert({
    where: {
      normalizedLemma_primaryPos: {
        normalizedLemma,
        primaryPos: entry.primaryPos,
      },
    },
    update: {
      lemma: entry.lemma,
      normalizedLemma,
      primaryPos: entry.primaryPos,
      secondaryPos: entry.secondaryPos ?? null,
      gender: entry.gender ?? null,
      numberBehavior: entry.numberBehavior ?? null,
      verbGroup: entry.verbGroup ?? null,
      isIrregular: entry.isIrregular ?? false,
      isReflexive: entry.isReflexive ?? false,
      transitivity: entry.transitivity ?? null,
      frequencyScore: entry.frequencyScore ?? null,
      aacPriority: entry.aacPriority ?? null,
      source: entry.source ?? 'seed',
    },
    create: {
      lemma: entry.lemma,
      normalizedLemma,
      primaryPos: entry.primaryPos,
      secondaryPos: entry.secondaryPos ?? null,
      gender: entry.gender ?? null,
      numberBehavior: entry.numberBehavior ?? null,
      verbGroup: entry.verbGroup ?? null,
      isIrregular: entry.isIrregular ?? false,
      isReflexive: entry.isReflexive ?? false,
      transitivity: entry.transitivity ?? null,
      frequencyScore: entry.frequencyScore ?? null,
      aacPriority: entry.aacPriority ?? null,
      source: entry.source ?? 'seed',
    },
  })

  await prisma.lexemeForm.deleteMany({
    where: { lexemeId: lexeme.id },
  })

  await prisma.lexemeAlias.deleteMany({
    where: { lexemeId: lexeme.id },
  })

  if (entry.forms?.length) {
    await prisma.lexemeForm.createMany({
      data: entry.forms.map((form) => ({
        lexemeId: lexeme.id,
        surface: form.surface,
        normalizedSurface: form.normalizedSurface,
        formType: form.formType,
        person: form.person,
        tense: form.tense,
        mood: form.mood,
        number: form.number,
        gender: form.gender,
        confidence: form.confidence,
      })),
    })
  }

  if (entry.aliases?.length) {
    await prisma.lexemeAlias.createMany({
      data: entry.aliases.map((alias) => ({
        lexemeId: lexeme.id,
        alias: alias.alias,
        normalizedAlias: normalizeText(alias.alias),
        aliasType: alias.aliasType,
      })),
    })
  }

  return lexeme
}

async function main() {
  let lexemeCount = 0
  let formCount = 0
  let aliasCount = 0

  for (const entry of LEXEME_SEED) {
    await upsertLexeme(entry)
    lexemeCount += 1
    formCount += entry.forms?.length ?? 0
    aliasCount += entry.aliases?.length ?? 0
  }

  console.log(`Banco léxico inicial preparado: ${lexemeCount} lexemas, ${formCount} formas y ${aliasCount} alias.`)
}

main()
  .catch((error) => {
    console.error('Error sembrando el banco léxico inicial:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
