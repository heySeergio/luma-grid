import { prisma } from '@/lib/prisma'
import { detectLexemeForLabel } from '@/lib/lexicon/detect'
import { IRREGULAR_VERBS_PRESENT } from '@/lib/lexicon/irregularVerbsPresent'
import { normalizeLooseTextForSearch, normalizeTextForLexicon, stripDiacritics } from '@/lib/lexicon/normalize'
import {
  applySpanishPrepositionContractions,
  destinationPrepositionChunkForIrNoun,
  shouldInsertDestinationArticleAfterIr,
  type SurfaceContextToken,
} from '@/lib/lexicon/phraseSurface'

export type PersonKey = 'yo' | 'tu' | 'el' | 'nosotros' | 'vosotros' | 'ellos'
export type ProfileGender = 'male' | 'female'

/** Tiempo y modo verbal para la frase (por defecto presente indicativo). */
export type ConjugateWordsOptions = {
  /** p. ej. `present`, `imperfect`, `future` (coincide con `LexemeForm.tense` en BD). */
  verbTense?: string
  /** p. ej. `indicative`, `subjunctive`. */
  verbMood?: string
}

export type ConjugationTokenInput = {
  label: string
  lexemeId?: string | null
  posType?: string | null
  normalizedLabel?: string | null
}

type ResolvedToken = {
  original: string
  normalized: string
  lexemeId: string | null
  lemma: string | null
  primaryPos: string | null
  gender: string | null
  number: string | null
}

type LexemeMeta = {
  id: string
  lemma: string
  primaryPos: string
  gender: string | null
  numberBehavior: string | null
}

type LexemeFormMeta = {
  lexemeId: string
  surface: string
  normalizedSurface: string
  formType: string
  person: number | null
  number: string | null
  gender: string | null
  tense: string | null
  mood: string | null
}

const DETERMINER_SURFACES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'mi', 'mis', 'tu', 'tus'])

const SUBJECT_MAP: Record<string, PersonKey> = {
  yo: 'yo',
  tú: 'tu',
  tu: 'tu',
  él: 'el',
  el: 'el',
  ella: 'el',
  eso: 'el',
  nosotros: 'nosotros',
  nosotras: 'nosotros',
  vosotros: 'vosotros',
  vosotras: 'vosotros',
  ellos: 'ellos',
  ellas: 'ellos',
  usted: 'el',
  ustedes: 'ellos',
}

const REGULAR_ENDINGS: Record<'ar' | 'er' | 'ir', Record<PersonKey, string>> = {
  ar: { yo: 'o', tu: 'as', el: 'a', nosotros: 'amos', vosotros: 'ais', ellos: 'an' },
  er: { yo: 'o', tu: 'es', el: 'e', nosotros: 'emos', vosotros: 'eis', ellos: 'en' },
  ir: { yo: 'o', tu: 'es', el: 'e', nosotros: 'imos', vosotros: 'is', ellos: 'en' },
}

const HARD_CODED_IRREGULARS: Record<string, Record<PersonKey, string>> = IRREGULAR_VERBS_PRESENT

const KEEP_AS_INFINITIVE_AFTER = new Set([
  'quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren',
  'puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden',
  'debo', 'debes', 'debe', 'debemos', 'debéis', 'deben',
  'necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitáis', 'necesitan',
  'voy', 'vas', 'va', 'vamos', 'vais', 'van',
  // Perífrasis «acabar de + inf.», «antes de + inf.», «después de + inf.», etc.
  'de',
])

const GENDER_PAIRS: Array<[string, string]> = [
  ['confundido', 'confundida'],
  ['nervioso', 'nerviosa'],
  ['distraído', 'distraída'],
  ['enamorado', 'enamorada'],
  ['enfadado', 'enfadada'],
  ['preocupado', 'preocupada'],
  ['sorprendido', 'sorprendida'],
  ['asqueado', 'asqueada'],
  ['desanimado', 'desanimada'],
  ['mareado', 'mareada'],
  ['cansado', 'cansada'],
  ['incómodo', 'incómoda'],
  ['guapo', 'guapa'],
  ['limpio', 'limpia'],
  ['salado', 'salada'],
  ['rugoso', 'rugosa'],
  ['liso', 'lisa'],
  ['mojado', 'mojada'],
  ['feo', 'fea'],
  ['sucio', 'sucia'],
  ['rápido', 'rápida'],
  ['claro', 'clara'],
  ['seco', 'seca'],
  ['lento', 'lenta'],
  ['oscuro', 'oscura'],
  ['duro', 'dura'],
  ['roto', 'rota'],
  ['blando', 'blanda'],
  ['gordo', 'gorda'],
  ['raro', 'rara'],
  ['contento', 'contenta'],
  ['aburrido', 'aburrida'],
  ['listo', 'lista'],
  ['seguro', 'segura'],
  ['tranquilo', 'tranquila'],
  ['tímido', 'tímida'],
  ['serio', 'seria'],
  ['divertido', 'divertida'],
  ['pesado', 'pesada'],
  ['ligero', 'ligera'],
  ['frío', 'fría'],
  ['caliente', 'caliente'],
  ['pequeño', 'pequeña'],
  ['grande', 'grande'],
  ['alto', 'alta'],
  ['bajo', 'baja'],
]

function normalizeWord(word: string) {
  return word.trim().replace(/\s+/g, ' ')
}

function extractLeadingQuestionToken(word: string) {
  const trimmed = normalizeWord(word)
  const match = trimmed.match(/^¿\s*(.+?)\s*\?$/)
  return match ? match[1] : null
}

function stripTrailingSentencePunctuation(value: string) {
  return value.trim().replace(/[.!?]+$/g, '').trim()
}

function formatAsQuestion(value: string) {
  const core = stripTrailingSentencePunctuation(value)
  if (!core) return ''
  return `¿${core}?`
}

/** Palabras que acaban en -ar/-er/-ir pero no son infinitivos (p. ej. «bar» → «al bar», no «a bar»). */
const SURFACE_NOT_INFINITIVE = new Set(['bar', 'mar', 'cal', 'col', 'fin', 'mal', 'tal', 'par'])

function looksLikeInfinitive(word: string) {
  const n = normalizeTextForLexicon(word)
  if (SURFACE_NOT_INFINITIVE.has(n)) return false
  return /(ar|er|ir)$/.test(n)
}

function capitalizeIfNeeded(token: string, shouldCapitalize: boolean) {
  if (!shouldCapitalize || token.length === 0) return token
  return token.charAt(0).toUpperCase() + token.slice(1)
}

/** Partículas del tablero (DE, A, Y…) en minúscula dentro de la frase. */
function normalizeConnectorSurface(surface: string, startsSentence: boolean) {
  const t = surface.trim()
  if (startsSentence || t.length === 0) return t
  const key = normalizeLooseTextForSearch(t)
  if (key === 'de' || key === 'a' || key === 'y' || key === 'o') return t.toLowerCase()
  return t
}

function fallbackConjugateVerb(infinitive: string, person: PersonKey) {
  const normalized = normalizeTextForLexicon(infinitive)
  const irregular = HARD_CODED_IRREGULARS[normalized]
  if (irregular) return irregular[person]

  const ending = normalized.slice(-2) as 'ar' | 'er' | 'ir'
  const stem = normalized.slice(0, -2)
  const endingSet = REGULAR_ENDINGS[ending]
  if (!endingSet) return infinitive
  return `${stem}${endingSet[person]}`
}

const IMPERFECT_INDICATIVE_IRREGULAR: Record<string, Record<PersonKey, string>> = {
  ser: { yo: 'era', tu: 'eras', el: 'era', nosotros: 'éramos', vosotros: 'erais', ellos: 'eran' },
  ir: { yo: 'iba', tu: 'ibas', el: 'iba', nosotros: 'íbamos', vosotros: 'ibais', ellos: 'iban' },
  ver: { yo: 'veía', tu: 'veías', el: 'veía', nosotros: 'veíamos', vosotros: 'veíais', ellos: 'veían' },
}

/** Pretérito imperfecto indicativo regular (-aba / -ía). */
function fallbackImperfectIndicative(infinitive: string, person: PersonKey) {
  const normalized = normalizeTextForLexicon(infinitive)
  const irr = IMPERFECT_INDICATIVE_IRREGULAR[normalized]
  if (irr) return irr[person]

  const ending = normalized.slice(-2) as 'ar' | 'er' | 'ir'
  const stem = normalized.slice(0, -2)
  const endings =
    ending === 'ar'
      ? ({ yo: 'aba', tu: 'abas', el: 'aba', nosotros: 'ábamos', vosotros: 'abais', ellos: 'aban' } as const)
      : ({ yo: 'ía', tu: 'ías', el: 'ía', nosotros: 'íamos', vosotros: 'íais', ellos: 'ían' } as const)
  return `${stem}${endings[person]}`
}

/** Futuro simple indicativo: infinitivo + terminación. */
function fallbackFutureIndicative(infinitive: string, person: PersonKey) {
  const normalized = normalizeTextForLexicon(infinitive)
  const endings: Record<PersonKey, string> = {
    yo: 'é', tu: 'ás', el: 'á', nosotros: 'emos', vosotros: 'éis', ellos: 'án',
  }
  const irregularFuture: Record<string, Record<PersonKey, string>> = {
    ir: { yo: 'iré', tu: 'irás', el: 'irá', nosotros: 'iremos', vosotros: 'iréis', ellos: 'irán' },
    tener: { yo: 'tendré', tu: 'tendrás', el: 'tendrá', nosotros: 'tendremos', vosotros: 'tendréis', ellos: 'tendrán' },
    hacer: { yo: 'haré', tu: 'harás', el: 'hará', nosotros: 'haremos', vosotros: 'haréis', ellos: 'harán' },
    decir: { yo: 'diré', tu: 'dirás', el: 'dirá', nosotros: 'diremos', vosotros: 'diréis', ellos: 'dirán' },
    poder: { yo: 'podré', tu: 'podrás', el: 'podrá', nosotros: 'podremos', vosotros: 'podréis', ellos: 'podrán' },
    poner: { yo: 'pondré', tu: 'pondrás', el: 'pondrá', nosotros: 'pondremos', vosotros: 'pondréis', ellos: 'pondrán' },
    venir: { yo: 'vendré', tu: 'vendrás', el: 'vendrá', nosotros: 'vendremos', vosotros: 'vendréis', ellos: 'vendrán' },
    salir: { yo: 'saldré', tu: 'saldrás', el: 'saldrá', nosotros: 'saldremos', vosotros: 'saldréis', ellos: 'saldrán' },
    querer: { yo: 'querré', tu: 'querrás', el: 'querrá', nosotros: 'querremos', vosotros: 'querréis', ellos: 'querrán' },
    saber: { yo: 'sabré', tu: 'sabrás', el: 'sabrá', nosotros: 'sabremos', vosotros: 'sabréis', ellos: 'sabrán' },
    caber: { yo: 'cabré', tu: 'cabrás', el: 'cabrá', nosotros: 'cabremos', vosotros: 'cabréis', ellos: 'cabrán' },
    haber: { yo: 'habré', tu: 'habrás', el: 'habrá', nosotros: 'habremos', vosotros: 'habréis', ellos: 'habrán' },
  }
  const irr = irregularFuture[normalized]
  if (irr) return irr[person]
  return `${normalized}${endings[person]}`
}

/** Presente de subjuntivo regular (-e/-a). */
function fallbackPresentSubjunctive(infinitive: string, person: PersonKey) {
  const normalized = normalizeTextForLexicon(infinitive)
  const subjIrreg: Record<string, Record<PersonKey, string>> = {
    ser: { yo: 'sea', tu: 'seas', el: 'sea', nosotros: 'seamos', vosotros: 'seáis', ellos: 'sean' },
    estar: { yo: 'esté', tu: 'estés', el: 'esté', nosotros: 'estemos', vosotros: 'estéis', ellos: 'estén' },
    ir: { yo: 'vaya', tu: 'vayas', el: 'vaya', nosotros: 'vayamos', vosotros: 'vayáis', ellos: 'vayan' },
    dar: { yo: 'dé', tu: 'des', el: 'dé', nosotros: 'demos', vosotros: 'deis', ellos: 'den' },
    saber: { yo: 'sepa', tu: 'sepas', el: 'sepa', nosotros: 'sepamos', vosotros: 'sepáis', ellos: 'sepan' },
    haber: { yo: 'haya', tu: 'hayas', el: 'haya', nosotros: 'hayamos', vosotros: 'hayáis', ellos: 'hayan' },
    tener: { yo: 'tenga', tu: 'tengas', el: 'tenga', nosotros: 'tengamos', vosotros: 'tengáis', ellos: 'tengan' },
    hacer: { yo: 'haga', tu: 'hagas', el: 'haga', nosotros: 'hagamos', vosotros: 'hagáis', ellos: 'hagan' },
    decir: { yo: 'diga', tu: 'digas', el: 'diga', nosotros: 'digamos', vosotros: 'digáis', ellos: 'digan' },
    venir: { yo: 'venga', tu: 'vengas', el: 'venga', nosotros: 'vengamos', vosotros: 'vengáis', ellos: 'vengan' },
    poner: { yo: 'ponga', tu: 'pongas', el: 'ponga', nosotros: 'pongamos', vosotros: 'pongáis', ellos: 'pongan' },
    salir: { yo: 'salga', tu: 'salgas', el: 'salga', nosotros: 'salgamos', vosotros: 'salgáis', ellos: 'salgan' },
    traer: { yo: 'traiga', tu: 'traigas', el: 'traiga', nosotros: 'traigamos', vosotros: 'traigáis', ellos: 'traigan' },
    poder: { yo: 'pueda', tu: 'puedas', el: 'pueda', nosotros: 'podamos', vosotros: 'podáis', ellos: 'puedan' },
    querer: { yo: 'quiera', tu: 'quieras', el: 'quiera', nosotros: 'queramos', vosotros: 'queráis', ellos: 'quieran' },
    conocer: { yo: 'conozca', tu: 'conozcas', el: 'conozca', nosotros: 'conozcamos', vosotros: 'conozcáis', ellos: 'conozcan' },
    caber: { yo: 'quepa', tu: 'quepas', el: 'quepa', nosotros: 'quepamos', vosotros: 'quepáis', ellos: 'quepan' },
    valer: { yo: 'valga', tu: 'valgas', el: 'valga', nosotros: 'valgamos', vosotros: 'valgáis', ellos: 'valgan' },
  }
  const si = subjIrreg[normalized]
  if (si) return si[person]

  const ending = normalized.slice(-2) as 'ar' | 'er' | 'ir'
  const stem = normalized.slice(0, -2)
  if (ending === 'ar') {
    const e: Record<PersonKey, string> = {
      yo: 'e', tu: 'es', el: 'e', nosotros: 'emos', vosotros: 'éis', ellos: 'en',
    }
    return `${stem}${e[person]}`
  }
  const a: Record<PersonKey, string> = {
    yo: 'a', tu: 'as', el: 'a', nosotros: 'amos', vosotros: 'áis', ellos: 'an',
  }
  return `${stem}${a[person]}`
}

function fallbackFiniteVerb(
  infinitive: string,
  person: PersonKey,
  tense: string,
  mood: string,
): string | null {
  if (mood === 'indicative' && tense === 'imperfect') {
    return fallbackImperfectIndicative(infinitive, person)
  }
  if (mood === 'indicative' && tense === 'future') {
    return fallbackFutureIndicative(infinitive, person)
  }
  if (mood === 'subjunctive' && tense === 'present') {
    return fallbackPresentSubjunctive(infinitive, person)
  }
  return null
}

function hasLexiconPrismaModels() {
  const prismaRecord = prisma as unknown as Record<string, unknown>
  return Boolean(prismaRecord.lexeme && prismaRecord.lexemeForm && prismaRecord.lexemeAlias)
}

function resolveIrregularLemmaFromSurface(surface: string) {
  const normalized = normalizeTextForLexicon(surface)
  for (const [lemma, forms] of Object.entries(HARD_CODED_IRREGULARS)) {
    if (Object.values(forms).some(form => normalizeTextForLexicon(form) === normalized)) {
      return lemma
    }
  }
  return null
}

function inferHeuristicNumber(normalized: string) {
  return normalized.endsWith('s') ? 'plural' : 'singular'
}

function inferHeuristicGender(normalized: string) {
  const n = normalizeTextForLexicon(normalized)
  if (n.endsWith('a') || n.endsWith('as')) return 'fem'
  if (n.endsWith('o') || n.endsWith('os')) return 'masc'
  const strip = stripDiacritics(n)
  if (/(?:cion|sion|dad|tud|umbre)$/.test(strip)) return 'fem'
  return null
}

function fallbackResolveToken(word: string): ResolvedToken {
  const normalized = normalizeTextForLexicon(word)
  const irregularLemma = resolveIrregularLemmaFromSurface(word)

  if (SUBJECT_MAP[normalized]) {
    return {
      original: word,
      normalized,
      lexemeId: null,
      lemma: normalized,
      primaryPos: 'pronoun',
      gender: normalized === 'ella' ? 'fem' : normalized === 'él' || normalized === 'el' ? 'masc' : null,
      number: ['nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes'].includes(normalized) ? 'plural' : 'singular',
    }
  }

  if (['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'mi', 'mis', 'tu', 'tus'].includes(normalized)) {
    return {
      original: word,
      normalized,
      lexemeId: null,
      lemma: normalized,
      primaryPos: 'det',
      gender: inferHeuristicGender(normalized),
      number: inferHeuristicNumber(normalized),
    }
  }

  if (irregularLemma || looksLikeInfinitive(word)) {
    return {
      original: word,
      normalized,
      lexemeId: null,
      lemma: irregularLemma ?? normalized,
      primaryPos: 'verb',
      gender: null,
      number: null,
    }
  }

  if (GENDER_PAIRS.some(([male, female]) => normalized === male || normalized === female)) {
    return {
      original: word,
      normalized,
      lexemeId: null,
      lemma: normalized,
      primaryPos: 'adj',
      gender: normalized.endsWith('a') ? 'fem' : normalized.endsWith('o') ? 'masc' : null,
      number: normalized.endsWith('s') ? 'plural' : 'singular',
    }
  }

  if (!['y', 'o', 'pero', 'con', 'sin', 'para', 'de', 'en', 'a'].includes(normalized)) {
    return {
      original: word,
      normalized,
      lexemeId: null,
      lemma: normalized.endsWith('s') ? normalized.slice(0, -1) : normalized,
      primaryPos: 'noun',
      gender: inferHeuristicGender(normalized),
      number: inferHeuristicNumber(normalized),
    }
  }

  return {
    original: word,
    normalized,
    lexemeId: null,
    lemma: null,
    primaryPos: null,
    gender: null,
    number: null,
  }
}

async function getLexemeMetaMap(lexemeIds: string[]) {
  if (!hasLexiconPrismaModels() || lexemeIds.length === 0) return new Map<string, LexemeMeta>()

  const lexemes = await prisma.lexeme.findMany({
    where: { id: { in: lexemeIds } },
    select: {
      id: true,
      lemma: true,
      primaryPos: true,
      gender: true,
      numberBehavior: true,
    },
  })

  return new Map(lexemes.map(lexeme => [lexeme.id, lexeme]))
}

async function getLexemeFormsMap(lexemeIds: string[]) {
  if (!hasLexiconPrismaModels() || lexemeIds.length === 0) return new Map<string, LexemeFormMeta[]>()

  const forms = await prisma.lexemeForm.findMany({
    where: { lexemeId: { in: lexemeIds } },
    select: {
      lexemeId: true,
      surface: true,
      normalizedSurface: true,
      formType: true,
      person: true,
      number: true,
      gender: true,
      tense: true,
      mood: true,
    },
  })

  const formsByLexemeId = new Map<string, LexemeFormMeta[]>()
  for (const form of forms) {
    const bucket = formsByLexemeId.get(form.lexemeId) ?? []
    bucket.push(form)
    formsByLexemeId.set(form.lexemeId, bucket)
  }

  return formsByLexemeId
}

function inferPrimaryPosFromToken(posType?: string | null) {
  switch (posType) {
    case 'pronoun':
    case 'verb':
    case 'noun':
    case 'adj':
      return posType
    case 'adverb':
      return 'adverb'
    default:
      return null
  }
}

async function resolveTokens(tokensOrWords: Array<ConjugationTokenInput | string>) {
  const tokens = tokensOrWords.map(item => typeof item === 'string' ? { label: item } : item)

  if (!hasLexiconPrismaModels()) {
    return tokens.map(token => {
      const fallback = fallbackResolveToken(token.label)
      return {
        ...fallback,
        lexemeId: token.lexemeId ?? fallback.lexemeId,
        primaryPos: inferPrimaryPosFromToken(token.posType) ?? fallback.primaryPos,
      }
    })
  }

  return Promise.all(tokens.map(async (token): Promise<ResolvedToken> => {
    const detection = token.lexemeId || token.posType ? null : await detectLexemeForLabel(token.label)
    return {
      original: token.label,
      normalized: token.normalizedLabel ? normalizeTextForLexicon(token.normalizedLabel) : normalizeTextForLexicon(token.label),
      lexemeId: token.lexemeId ?? detection?.lexemeId ?? null,
      lemma: detection?.detectedLemma ?? null,
      primaryPos: inferPrimaryPosFromToken(token.posType) ?? detection?.primaryPos ?? null,
      gender: detection?.matchedForm?.gender ?? null,
      number: detection?.matchedForm?.number ?? null,
    }
  }))
}

function applyContextualPosAdjustments(tokens: ResolvedToken[]) {
  return tokens.map((token, index) => {
    const next = tokens[index + 1]

    if (token.normalized === 'el' && next?.primaryPos === 'noun') {
      return { ...token, primaryPos: 'det', gender: 'masc', number: 'singular' }
    }

    if (DETERMINER_SURFACES.has(token.normalized) && next?.primaryPos === 'noun') {
      return {
        ...token,
        primaryPos: 'det',
        gender: token.gender ?? inferHeuristicGender(token.normalized),
        number: token.number ?? inferHeuristicNumber(token.normalized),
      }
    }

    return token
  })
}

async function getFiniteFormsForLexemes(lexemeIds: string[], tense: string, mood: string) {
  if (!hasLexiconPrismaModels()) return new Map<string, Map<PersonKey, string>>()
  if (lexemeIds.length === 0) return new Map<string, Map<PersonKey, string>>()

  const rows = await prisma.lexemeForm.findMany({
    where: {
      lexemeId: { in: lexemeIds },
      formType: 'finite',
      mood,
      tense,
      person: { in: [1, 2, 3] },
    },
    select: {
      lexemeId: true,
      surface: true,
      person: true,
      number: true,
    },
  })

  const formsByLexemeId = new Map<string, Map<PersonKey, string>>()

  for (const row of rows) {
    const personKey = row.person === 1
      ? (row.number === 'plural' ? 'nosotros' : 'yo')
      : row.person === 2
        ? (row.number === 'plural' ? 'vosotros' : 'tu')
        : (row.number === 'plural' ? 'ellos' : 'el')

    const bucket = formsByLexemeId.get(row.lexemeId) ?? new Map<PersonKey, string>()
    bucket.set(personKey, row.surface)
    formsByLexemeId.set(row.lexemeId, bucket)
  }

  return formsByLexemeId
}

async function getGenderVariantMap(lexemeIds: string[]) {
  if (!hasLexiconPrismaModels()) return new Map<string, { masc?: string; fem?: string }>()
  if (lexemeIds.length === 0) return new Map<string, { masc?: string; fem?: string }>()

  const rows = await prisma.lexemeForm.findMany({
    where: {
      lexemeId: { in: lexemeIds },
      gender: { in: ['masc', 'fem'] },
    },
    select: {
      lexemeId: true,
      surface: true,
      gender: true,
      number: true,
    },
  })

  const variants = new Map<string, { masc?: string; fem?: string }>()

  for (const row of rows) {
    if (row.number && row.number !== 'singular') continue
    const bucket = variants.get(row.lexemeId) ?? {}
    if (row.gender === 'masc') bucket.masc = row.surface
    if (row.gender === 'fem') bucket.fem = row.surface
    variants.set(row.lexemeId, bucket)
  }

  return variants
}

function findExactForm(token: ResolvedToken, formsByLexemeId: Map<string, LexemeFormMeta[]>) {
  if (!token.lexemeId) return null
  const forms = formsByLexemeId.get(token.lexemeId) ?? []
  return forms.find(form => form.normalizedSurface === normalizeLooseTextForSearch(token.original)) ?? null
}

function enrichResolvedTokens(
  resolvedTokens: ResolvedToken[],
  lexemeMetaById: Map<string, LexemeMeta>,
  formsByLexemeId: Map<string, LexemeFormMeta[]>,
) {
  return resolvedTokens.map((token) => {
    const lexeme = token.lexemeId ? lexemeMetaById.get(token.lexemeId) : null
    const exactForm = findExactForm(token, formsByLexemeId)

    return {
      ...token,
      lemma: token.lemma ?? lexeme?.lemma ?? token.lemma,
      primaryPos: token.primaryPos ?? lexeme?.primaryPos ?? token.primaryPos,
      gender: exactForm?.gender ?? lexeme?.gender ?? token.gender,
      number: exactForm?.number ?? (lexeme?.numberBehavior === 'singular' ? 'singular' : token.number),
    }
  })
}

type FiniteVerbTarget = { tense: string; mood: string }

async function conjugateResolvedVerb(
  token: ResolvedToken,
  person: PersonKey,
  formsByLexemeId: Map<string, Map<PersonKey, string>>,
  finiteTarget: FiniteVerbTarget,
) {
  if (token.lexemeId) {
    const forms = formsByLexemeId.get(token.lexemeId)
    const detectedForm = forms?.get(person)
    if (detectedForm) return detectedForm
  }

  const lemma = token.lemma ?? token.normalized
  const finite = fallbackFiniteVerb(lemma, person, finiteTarget.tense, finiteTarget.mood)
  if (finite) return finite
  return fallbackConjugateVerb(lemma, person)
}

function applyFallbackGender(token: string, gender: ProfileGender) {
  const lower = normalizeTextForLexicon(token)
  for (const [male, female] of GENDER_PAIRS) {
    if (lower === male || lower === female) {
      return gender === 'female' ? female : male
    }
  }
  return token
}

async function applyGenderToResolvedToken(
  token: ResolvedToken,
  gender: ProfileGender,
  genderVariantMap: Map<string, { masc?: string; fem?: string }>,
) {
  if (token.lexemeId) {
    const variants = genderVariantMap.get(token.lexemeId)
    if (variants?.masc || variants?.fem) {
      if (gender === 'female' && variants.fem) return variants.fem
      if (gender === 'male' && variants.masc) return variants.masc
    }
  }

  return applyFallbackGender(token.original, gender)
}

function resolveAgreementFromSubject(tokens: ResolvedToken[], profileGender: ProfileGender) {
  const subject = tokens.find(token => SUBJECT_MAP[token.normalized])
  if (!subject) {
    return {
      gender: profileGender === 'female' ? 'fem' : 'masc',
      number: 'singular',
    }
  }

  if (['nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes'].includes(subject.normalized)) {
    return {
      gender: ['nosotras', 'vosotras', 'ellas'].includes(subject.normalized) ? 'fem' : 'masc',
      number: 'plural',
    }
  }

  return {
    gender: subject.normalized === 'ella' ? 'fem' : 'masc',
    number: 'singular',
  }
}

function agreeDeterminerSurface(token: ResolvedToken, targetGender: string | null, targetNumber: string | null) {
  const normalized = normalizeLooseTextForSearch(token.original)

  if (['el', 'la', 'los', 'las'].includes(normalized)) {
    if (targetNumber === 'plural') return targetGender === 'fem' ? 'las' : 'los'
    return targetGender === 'fem' ? 'la' : 'el'
  }

  if (['un', 'una', 'unos', 'unas'].includes(normalized)) {
    if (targetNumber === 'plural') return targetGender === 'fem' ? 'unas' : 'unos'
    return targetGender === 'fem' ? 'una' : 'un'
  }

  if (['mi', 'mis'].includes(normalized)) {
    return targetNumber === 'plural' ? 'mis' : 'mi'
  }

  if (['tu', 'tus'].includes(normalized)) {
    return targetNumber === 'plural' ? 'tus' : 'tu'
  }

  return token.original
}

function getClosestNounAgreement(tokens: ResolvedToken[], index: number) {
  const next = tokens[index + 1]
  const previous = tokens[index - 1]
  const beforePrevious = tokens[index - 2]

  if (next?.primaryPos === 'noun') {
    return { gender: next.gender, number: next.number ?? 'singular' }
  }

  if (previous?.primaryPos === 'noun') {
    return { gender: previous.gender, number: previous.number ?? 'singular' }
  }

  if (previous?.primaryPos === 'noun' || (previous?.primaryPos === 'det' && beforePrevious?.primaryPos === 'noun')) {
    const noun = previous?.primaryPos === 'noun' ? previous : beforePrevious
    return { gender: noun?.gender ?? null, number: noun?.number ?? 'singular' }
  }

  return null
}

function getAdjectiveAgreementTarget(tokens: ResolvedToken[], index: number, fallbackGender: string, fallbackNumber: string) {
  const previous = tokens[index - 1]
  const previous2 = tokens[index - 2]

  if (previous?.primaryPos === 'noun') {
    return {
      gender: previous.gender ?? fallbackGender,
      number: previous.number ?? fallbackNumber,
    }
  }

  if (previous?.primaryPos === 'verb' && ['ser', 'estar'].includes(previous.lemma ?? '')) {
    return { gender: fallbackGender, number: fallbackNumber }
  }

  if (previous?.primaryPos === 'noun' || (previous?.primaryPos === 'det' && previous2?.primaryPos === 'noun')) {
    const noun = previous?.primaryPos === 'noun' ? previous : previous2
    return {
      gender: noun?.gender ?? fallbackGender,
      number: noun?.number ?? fallbackNumber,
    }
  }

  return { gender: fallbackGender, number: fallbackNumber }
}

function selectAdjectiveForm(
  token: ResolvedToken,
  agreement: { gender: string; number: string },
  formsByLexemeId: Map<string, LexemeFormMeta[]>,
) {
  if (token.lexemeId) {
    const forms = formsByLexemeId.get(token.lexemeId) ?? []
    const exact = forms.find(form =>
      (form.gender === agreement.gender || form.gender === null) &&
      (form.number === agreement.number || form.number === null),
    )

    if (exact?.surface) return exact.surface
  }

  const surface = agreement.gender === 'fem'
    ? applyFallbackGender(token.original, 'female')
    : applyFallbackGender(token.original, 'male')
  if (agreement.number === 'plural' && !surface.endsWith('s')) {
    if (surface.endsWith('z')) return `${surface.slice(0, -1)}ces`
    return `${surface}s`
  }
  return surface
}

export async function conjugateWords(
  rawTokensOrWords: Array<ConjugationTokenInput | string>,
  gender: ProfileGender,
  options?: ConjugateWordsOptions,
) {
  const finiteTarget: FiniteVerbTarget = {
    tense: options?.verbTense ?? 'present',
    mood: options?.verbMood ?? 'indicative',
  }
  const words = rawTokensOrWords
    .map(item => typeof item === 'string' ? normalizeWord(item) : normalizeWord(item.label))
    .filter(Boolean)
  if (words.length === 0) return ''

  const leadingQuestionToken = extractLeadingQuestionToken(words[0] ?? '')
  if (words.length === 1) {
    return leadingQuestionToken ? formatAsQuestion(leadingQuestionToken) : words[0]
  }

  const initiallyResolvedTokens = await resolveTokens(rawTokensOrWords)
  const rawResolvedTokens = applyContextualPosAdjustments(initiallyResolvedTokens)
  const lexemeIds = rawResolvedTokens
    .map(token => token.lexemeId)
    .filter((value): value is string => Boolean(value))
  const [lexemeMetaById, allFormsByLexemeId] = await Promise.all([
    getLexemeMetaMap(lexemeIds),
    getLexemeFormsMap(lexemeIds),
  ])
  const resolvedTokens = enrichResolvedTokens(rawResolvedTokens, lexemeMetaById, allFormsByLexemeId)
  const person = (() => {
    const subjectToken = resolvedTokens.find(token => SUBJECT_MAP[token.normalized])
    return subjectToken ? SUBJECT_MAP[subjectToken.normalized] : 'yo'
  })()

  const [formsByLexemeId, genderVariantMap] = await Promise.all([
    getFiniteFormsForLexemes(
      resolvedTokens
        .map(token => token.lexemeId)
        .filter((value): value is string => Boolean(value)),
      finiteTarget.tense,
      finiteTarget.mood,
    ),
    getGenderVariantMap(
      resolvedTokens
        .filter(token => token.primaryPos === 'adj')
        .map(token => token.lexemeId)
        .filter((value): value is string => Boolean(value)),
    ),
  ])
  const phraseAgreement = resolveAgreementFromSubject(resolvedTokens, gender)

  const output: string[] = []
  let keepNextInfinitive = false

  for (let index = 0; index < resolvedTokens.length; index += 1) {
    const token = resolvedTokens[index]
    const next = resolvedTokens[index + 1]
    const startsSentence = output.length === 0
    const surfaceOriginal = index === 0 && leadingQuestionToken ? leadingQuestionToken : token.original
    const isVerb = token.primaryPos === 'verb' || looksLikeInfinitive(token.original)

    // «Ir al mercado» / «ir a mercado» sin sujeto: infinitivo «ir», no «voy» (sigue «ir a comer» → voy a comer).
    if (
      index === 0 &&
      (token.lemma === 'ir' || token.normalized === 'ir') &&
      next &&
      !looksLikeInfinitive(next.original)
    ) {
      output.push(capitalizeIfNeeded('ir', startsSentence))
      continue
    }

    // «Ir a + infinitivo» como perífrasis de movimiento (voy a comer), no «quiero ir a comer».
    if ((token.lemma === 'ir' || token.normalized === 'ir') && next && looksLikeInfinitive(next.original)) {
      const prevOut = output[output.length - 1]?.toLowerCase() || ''
      if (!KEEP_AS_INFINITIVE_AFTER.has(normalizeLooseTextForSearch(prevOut))) {
        output.push(capitalizeIfNeeded(await conjugateResolvedVerb({ ...token, lemma: 'ir' }, person, formsByLexemeId, finiteTarget), startsSentence))
        output.push('a')
        keepNextInfinitive = true
        continue
      }
    }

    if (isVerb) {
      if (keepNextInfinitive) {
        output.push(capitalizeIfNeeded(token.lemma ?? surfaceOriginal, startsSentence))
        keepNextInfinitive = false
        continue
      }

      const previous = output[output.length - 1]?.toLowerCase() || ''
      const prevKey = normalizeLooseTextForSearch(previous)

      // Tras «ir» en infinitivo: «a» + siguiente infinitivo (querer ir a comer).
      if (prevKey === 'ir' && looksLikeInfinitive(token.original)) {
        output.push('a')
        output.push(capitalizeIfNeeded(token.lemma ?? surfaceOriginal, startsSentence))
        continue
      }

      // Tras «ir» en infinitivo: destino nominal; el léxico a veces marca «Bar» como verbo.
      if (prevKey === 'ir' && !looksLikeInfinitive(token.original)) {
        const forcedNoun = {
          ...token,
          primaryPos: 'noun' as const,
          gender: token.gender ?? inferHeuristicGender(token.normalized),
          number: token.number ?? inferHeuristicNumber(token.normalized),
        }
        const tokensForSurface: SurfaceContextToken[] = resolvedTokens.map((t, i) =>
          i === index ? forcedNoun : t,
        )
        if (shouldInsertDestinationArticleAfterIr(tokensForSurface, index)) {
          output.push(destinationPrepositionChunkForIrNoun(tokensForSurface, index, forcedNoun))
        }
        output.push(surfaceOriginal.trim().toLowerCase())
        continue
      }

      if (KEEP_AS_INFINITIVE_AFTER.has(prevKey)) {
        output.push(capitalizeIfNeeded(token.lemma ?? surfaceOriginal, startsSentence))
        continue
      }

      output.push(capitalizeIfNeeded(await conjugateResolvedVerb(token, person, formsByLexemeId, finiteTarget), startsSentence))
      continue
    }

    if (token.primaryPos === 'adj') {
      const agreement = getAdjectiveAgreementTarget(
        resolvedTokens,
        index,
        phraseAgreement.gender,
        phraseAgreement.number,
      )
      const adjective =
        selectAdjectiveForm(token, agreement, allFormsByLexemeId) ||
        await applyGenderToResolvedToken(token, gender, genderVariantMap)
      output.push(capitalizeIfNeeded(adjective, startsSentence))
      continue
    }

    if (token.primaryPos === 'det') {
      const agreement = getClosestNounAgreement(resolvedTokens, index)
      const determiner = agreement
        ? agreeDeterminerSurface(token, agreement.gender, agreement.number)
        : surfaceOriginal
      output.push(capitalizeIfNeeded(determiner, startsSentence))
      continue
    }

    if (token.primaryPos === 'noun' && shouldInsertDestinationArticleAfterIr(resolvedTokens, index)) {
      output.push(destinationPrepositionChunkForIrNoun(resolvedTokens, index, token))
      const lowerNoun = surfaceOriginal.trim().toLowerCase()
      output.push(startsSentence ? capitalizeIfNeeded(lowerNoun, true) : lowerNoun)
      continue
    }

    output.push(capitalizeIfNeeded(normalizeConnectorSurface(surfaceOriginal, startsSentence), startsSentence))
  }

  const raw = output.join(' ')
  const phrase = applySpanishPrepositionContractions(
    leadingQuestionToken ? formatAsQuestion(raw) : raw,
  )
  return phrase
}
