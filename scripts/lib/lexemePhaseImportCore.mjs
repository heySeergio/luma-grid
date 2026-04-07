/**
 * Lógica compartida para import idempotente de lemas (Fase 1, 2, …).
 * No ejecuta main; los scripts por fase importan estas funciones.
 */

export function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function makeSurface(surface, extra = {}) {
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

export function inferSemanticLayer(lemma, primaryPos) {
  const l = lemma.trim().toLowerCase()
  if (primaryPos === 'verb') return 'actions'
  if (primaryPos === 'pronoun') return 'core'
  if (['no', 'sí', 'más', 'menos', 'aquí', 'ahí', 'bien', 'mal'].includes(l)) return 'core'
  if (primaryPos === 'adverb') {
    if (/^(cuándo|cómo|dónde|por qué)$/i.test(l)) return 'time'
    return 'other'
  }
  if (primaryPos === 'noun') {
    const people = ['mamá', 'papá', 'abuelo', 'abuela', 'hermano', 'hermana', 'personas', 'persona', 'amigo', 'amiga', 'profesor', 'profesora', 'médico', 'médica', 'doctor', 'doctora']
    if (people.some((p) => l === p || l.startsWith(p))) return 'people'
    const places = ['casa', 'cole', 'hospital', 'baño', 'cocina', 'parque', 'escuela']
    if (places.some((p) => l.includes(p))) return 'places'
    const emotions = ['alegría', 'miedo', 'rabia', 'tristeza', 'calma']
    if (emotions.some((p) => l.includes(p))) return 'emotions'
    const time = ['hoy', 'mañana', 'ayer', 'ahora', 'tiempo', 'hora']
    if (time.some((p) => l === p || l.includes(p))) return 'time'
    return 'objects'
  }
  if (primaryPos === 'adj') return 'other'
  return 'other'
}

export function inferIsCore(lemma, primaryPos, aacPriority) {
  const l = lemma.trim().toLowerCase()
  if (['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'vosotros', 'vosotras'].includes(l)) return true
  if (['no', 'sí', 'más'].includes(l)) return true
  if (primaryPos === 'pronoun') return true
  if (typeof aacPriority === 'number' && aacPriority >= 78) return true
  return false
}

export function spanishPlural(lemma) {
  const lower = lemma.trim().toLowerCase()
  if (lower.includes(' ')) return lower
  if (lower.endsWith('ión')) return lower.slice(0, -3) + 'iones'
  if (lower.endsWith('z')) return lower.slice(0, -1) + 'ces'
  if (/[aeiouáéíóú]$/i.test(lower)) return lower + 's'
  return lower + 'es'
}

export function nounEntry(lemma, genderShort, semanticLayerOverride, source, aacPriority = 46, frequencyScore = 0.58) {
  const gender = genderShort === 'm' ? 'masc' : 'fem'
  const semanticLayer = semanticLayerOverride || inferSemanticLayer(lemma, 'noun')
  const hasSpace = lemma.includes(' ')
  const forms = hasSpace
    ? [makeSurface(lemma, { number: 'singular', gender })]
    : [
        makeSurface(lemma, { number: 'singular', gender }),
        makeSurface(spanishPlural(lemma), {
          formType: 'plural',
          number: 'plural',
          gender,
        }),
      ]
  return {
    lemma,
    primaryPos: 'noun',
    gender,
    numberBehavior: 'both',
    aacPriority,
    frequencyScore,
    semanticLayer,
    isCore: inferIsCore(lemma, 'noun', aacPriority),
    source,
    forms,
  }
}

export function verbEntry(lemma, verbGroup, isIrregular, transitivity, source, aacPriority = 58, frequencyScore = 0.62) {
  return {
    lemma,
    primaryPos: 'verb',
    verbGroup,
    isIrregular,
    transitivity,
    aacPriority,
    frequencyScore,
    semanticLayer: 'actions',
    isCore: false,
    source,
    forms: [makeSurface(lemma, { formType: 'infinitive', mood: 'infinitive' })],
  }
}

export function adjEntry(lemma, semanticLayer, source, aacPriority = 52, frequencyScore = 0.6) {
  return {
    lemma,
    primaryPos: 'adj',
    aacPriority,
    frequencyScore,
    semanticLayer: semanticLayer || 'other',
    isCore: false,
    source,
    forms: [makeSurface(lemma)],
  }
}

export async function createLexemeFull(prisma, entry) {
  const normalizedLemma = normalizeText(entry.lemma)
  const lexeme = await prisma.lexeme.create({
    data: {
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
      semanticLayer: entry.semanticLayer ?? inferSemanticLayer(entry.lemma, entry.primaryPos),
      isCore: entry.isCore ?? inferIsCore(entry.lemma, entry.primaryPos, entry.aacPriority ?? null),
      pictogramSource: entry.pictogramSource ?? null,
      pictogramKey: entry.pictogramKey ?? null,
      source: entry.source ?? 'import',
      lexemeTier: entry.lexemeTier ?? 'curated',
    },
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

export async function mergeAliasesOnly(prisma, lexemeId, aliases) {
  for (const a of aliases) {
    const normalizedAlias = normalizeText(a.alias)
    await prisma.lexemeAlias.upsert({
      where: {
        lexemeId_normalizedAlias_aliasType: {
          lexemeId,
          normalizedAlias,
          aliasType: a.aliasType,
        },
      },
      create: {
        lexemeId,
        alias: a.alias,
        normalizedAlias,
        aliasType: a.aliasType,
      },
      update: {},
    })
  }
}

export async function importLexemeIfMissing(prisma, entry) {
  const nl = normalizeText(entry.lemma)
  const existing = await prisma.lexeme.findUnique({
    where: {
      normalizedLemma_primaryPos: { normalizedLemma: nl, primaryPos: entry.primaryPos },
    },
  })

  if (existing) {
    if (entry.aliases?.length) {
      await mergeAliasesOnly(prisma, existing.id, entry.aliases)
    }
    return { created: false, id: existing.id }
  }

  await createLexemeFull(prisma, entry)
  return { created: true }
}

export async function importAliasSupplement(prisma, { targetLemma, targetPrimaryPos, aliases }, logPrefix = '') {
  const nl = normalizeText(targetLemma)
  const lexeme = await prisma.lexeme.findUnique({
    where: {
      normalizedLemma_primaryPos: { normalizedLemma: nl, primaryPos: targetPrimaryPos },
    },
  })
  if (!lexeme) {
    console.warn(`${logPrefix} Sin lema objetivo para alias: ${targetLemma} (${targetPrimaryPos})`)
    return
  }
  await mergeAliasesOnly(prisma, lexeme.id, aliases)
}

export function dedupeKey(lemma, pos) {
  return `${normalizeText(lemma)}|${pos}`
}
