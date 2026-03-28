import { prisma } from '@/lib/prisma'
import { detectLexemeForLabel } from '@/lib/lexicon/detect'
import { normalizeLooseTextForSearch, normalizeTextForLexicon } from '@/lib/lexicon/normalize'

export type PersonKey = 'yo' | 'tu' | 'el' | 'nosotros' | 'vosotros' | 'ellos'
export type ProfileGender = 'male' | 'female'
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

const HARD_CODED_IRREGULARS: Record<string, Record<PersonKey, string>> = {
  ser: { yo: 'soy', tu: 'eres', el: 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son' },
  estar: { yo: 'estoy', tu: 'estás', el: 'está', nosotros: 'estamos', vosotros: 'estáis', ellos: 'están' },
  ir: { yo: 'voy', tu: 'vas', el: 'va', nosotros: 'vamos', vosotros: 'vais', ellos: 'van' },
  tener: { yo: 'tengo', tu: 'tienes', el: 'tiene', nosotros: 'tenemos', vosotros: 'tenéis', ellos: 'tienen' },
  hacer: { yo: 'hago', tu: 'haces', el: 'hace', nosotros: 'hacemos', vosotros: 'hacéis', ellos: 'hacen' },
  querer: { yo: 'quiero', tu: 'quieres', el: 'quiere', nosotros: 'queremos', vosotros: 'queréis', ellos: 'quieren' },
  poder: { yo: 'puedo', tu: 'puedes', el: 'puede', nosotros: 'podemos', vosotros: 'podéis', ellos: 'pueden' },
  venir: { yo: 'vengo', tu: 'vienes', el: 'viene', nosotros: 'venimos', vosotros: 'venís', ellos: 'vienen' },
  decir: { yo: 'digo', tu: 'dices', el: 'dice', nosotros: 'decimos', vosotros: 'decís', ellos: 'dicen' },
  poner: { yo: 'pongo', tu: 'pones', el: 'pone', nosotros: 'ponemos', vosotros: 'ponéis', ellos: 'ponen' },
  dar: { yo: 'doy', tu: 'das', el: 'da', nosotros: 'damos', vosotros: 'dais', ellos: 'dan' },
  ver: { yo: 'veo', tu: 'ves', el: 've', nosotros: 'vemos', vosotros: 'veis', ellos: 'ven' },
  jugar: { yo: 'juego', tu: 'juegas', el: 'juega', nosotros: 'jugamos', vosotros: 'jugáis', ellos: 'juegan' },
  dormir: { yo: 'duermo', tu: 'duermes', el: 'duerme', nosotros: 'dormimos', vosotros: 'dormís', ellos: 'duermen' },
}

const KEEP_AS_INFINITIVE_AFTER = new Set([
  'quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren',
  'puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden',
  'debo', 'debes', 'debe', 'debemos', 'debéis', 'deben',
  'necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitáis', 'necesitan',
  'voy', 'vas', 'va', 'vamos', 'vais', 'van',
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

function looksLikeInfinitive(word: string) {
  return /(ar|er|ir)$/.test(normalizeTextForLexicon(word))
}

function capitalizeIfNeeded(token: string, shouldCapitalize: boolean) {
  if (!shouldCapitalize || token.length === 0) return token
  return token.charAt(0).toUpperCase() + token.slice(1)
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
  if (normalized.endsWith('a') || normalized.endsWith('as')) return 'fem'
  if (normalized.endsWith('o') || normalized.endsWith('os')) return 'masc'
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

async function getPresentFormsForLexemes(lexemeIds: string[]) {
  if (!hasLexiconPrismaModels()) return new Map<string, Map<PersonKey, string>>()
  if (lexemeIds.length === 0) return new Map<string, Map<PersonKey, string>>()

  const rows = await prisma.lexemeForm.findMany({
    where: {
      lexemeId: { in: lexemeIds },
      formType: 'finite',
      mood: 'indicative',
      tense: 'present',
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

async function conjugateResolvedVerb(
  token: ResolvedToken,
  person: PersonKey,
  formsByLexemeId: Map<string, Map<PersonKey, string>>,
) {
  if (token.lexemeId) {
    const forms = formsByLexemeId.get(token.lexemeId)
    const detectedForm = forms?.get(person)
    if (detectedForm) return detectedForm
  }

  const lemma = token.lemma ?? token.normalized
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
) {
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
    getPresentFormsForLexemes(
      resolvedTokens
        .map(token => token.lexemeId)
        .filter((value): value is string => Boolean(value)),
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

    if ((token.lemma === 'ir' || token.normalized === 'ir') && next && (next.primaryPos === 'verb' || looksLikeInfinitive(next.original))) {
      output.push(capitalizeIfNeeded(await conjugateResolvedVerb({ ...token, lemma: 'ir' }, person, formsByLexemeId), startsSentence))
      output.push('a')
      keepNextInfinitive = true
      continue
    }

    if (isVerb) {
      if (keepNextInfinitive) {
        output.push(capitalizeIfNeeded(token.lemma ?? surfaceOriginal, startsSentence))
        keepNextInfinitive = false
        continue
      }

      const previous = output[output.length - 1]?.toLowerCase() || ''
      if (KEEP_AS_INFINITIVE_AFTER.has(normalizeLooseTextForSearch(previous))) {
        output.push(capitalizeIfNeeded(token.lemma ?? surfaceOriginal, startsSentence))
        continue
      }

      output.push(capitalizeIfNeeded(await conjugateResolvedVerb(token, person, formsByLexemeId), startsSentence))
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

    output.push(capitalizeIfNeeded(surfaceOriginal, startsSentence))
  }

  const phrase = output.join(' ')
  return leadingQuestionToken ? formatAsQuestion(phrase) : phrase
}
