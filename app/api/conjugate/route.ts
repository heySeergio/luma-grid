import { NextRequest, NextResponse } from 'next/server'

type PersonKey = 'yo' | 'tu' | 'el' | 'nosotros' | 'vosotros' | 'ellos'
type ProfileGender = 'male' | 'female'

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

const IRREGULARS: Record<string, Record<PersonKey, string>> = {
  ser: { yo: 'soy', tu: 'eres', el: 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son' },
  estar: { yo: 'estoy', tu: 'estas', el: 'esta', nosotros: 'estamos', vosotros: 'estais', ellos: 'estan' },
  ir: { yo: 'voy', tu: 'vas', el: 'va', nosotros: 'vamos', vosotros: 'vais', ellos: 'van' },
  tener: { yo: 'tengo', tu: 'tienes', el: 'tiene', nosotros: 'tenemos', vosotros: 'teneis', ellos: 'tienen' },
  hacer: { yo: 'hago', tu: 'haces', el: 'hace', nosotros: 'hacemos', vosotros: 'haceis', ellos: 'hacen' },
  querer: { yo: 'quiero', tu: 'quieres', el: 'quiere', nosotros: 'queremos', vosotros: 'queréis', ellos: 'quieren' },
  poder: { yo: 'puedo', tu: 'puedes', el: 'puede', nosotros: 'podemos', vosotros: 'podeis', ellos: 'pueden' },
  venir: { yo: 'vengo', tu: 'vienes', el: 'viene', nosotros: 'venimos', vosotros: 'venis', ellos: 'vienen' },
  decir: { yo: 'digo', tu: 'dices', el: 'dice', nosotros: 'decimos', vosotros: 'decis', ellos: 'dicen' },
  poner: { yo: 'pongo', tu: 'pones', el: 'pone', nosotros: 'ponemos', vosotros: 'poneis', ellos: 'ponen' },
  dar: { yo: 'doy', tu: 'das', el: 'da', nosotros: 'damos', vosotros: 'dais', ellos: 'dan' },
  ver: { yo: 'veo', tu: 'ves', el: 've', nosotros: 'vemos', vosotros: 'veis', ellos: 'ven' },
}

const KEEP_AS_INFINITIVE_AFTER = new Set([
  'quiero', 'quieres', 'quiere', 'queremos', 'quereis', 'quieren',
  'puedo', 'puedes', 'puede', 'podemos', 'podeis', 'pueden',
  'debo', 'debes', 'debe', 'debemos', 'debeis', 'deben',
  'necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitais', 'necesitan',
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
]

function applyGender(token: string, gender: ProfileGender): string {
  const lower = token.toLowerCase()
  for (const [male, female] of GENDER_PAIRS) {
    if (lower === male || lower === female) {
      return gender === 'female' ? female : male
    }
  }
  return token
}

function normalizeWord(word: string) {
  return word.trim().replace(/\s+/g, ' ')
}

function looksLikeInfinitive(word: string) {
  return /(ar|er|ir)$/.test(word)
}

function conjugateVerb(infinitive: string, person: PersonKey) {
  const irregular = IRREGULARS[infinitive]
  if (irregular) return irregular[person]

  const ending = infinitive.slice(-2) as 'ar' | 'er' | 'ir'
  const stem = infinitive.slice(0, -2)
  const endingSet = REGULAR_ENDINGS[ending]
  if (!endingSet) return infinitive
  return `${stem}${endingSet[person]}`
}

function capitalizeIfNeeded(token: string, shouldCapitalize: boolean) {
  if (!shouldCapitalize || token.length === 0) return token
  return token.charAt(0).toUpperCase() + token.slice(1)
}

function conjugateWords(rawWords: string[], gender: ProfileGender) {
  const words = rawWords.map(normalizeWord).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]

  const normalized = words.map(word => word.toLowerCase())
  const subjectIndex = normalized.findIndex(word => SUBJECT_MAP[word])
  const person: PersonKey = subjectIndex >= 0 ? SUBJECT_MAP[normalized[subjectIndex]] : 'yo'
  const output: string[] = []

  let keepNextInfinitive = false

  for (let i = 0; i < normalized.length; i += 1) {
    const token = normalized[i]
    const next = normalized[i + 1]
    const startsSentence = output.length === 0

    if (token === 'ir' && next && looksLikeInfinitive(next)) {
      output.push(capitalizeIfNeeded(conjugateVerb('ir', person), startsSentence))
      output.push('a')
      keepNextInfinitive = true
      continue
    }

    if (looksLikeInfinitive(token)) {
      if (keepNextInfinitive) {
        output.push(capitalizeIfNeeded(token, startsSentence))
        keepNextInfinitive = false
        continue
      }

      const previous = output[output.length - 1]?.toLowerCase() || ''
      if (KEEP_AS_INFINITIVE_AFTER.has(previous)) {
        output.push(capitalizeIfNeeded(token, startsSentence))
        continue
      }

      output.push(capitalizeIfNeeded(conjugateVerb(token, person), startsSentence))
      continue
    }

    output.push(capitalizeIfNeeded(applyGender(token, gender), startsSentence))
  }

  return output.join(' ')
}

export async function POST(req: NextRequest) {
  let words: string[] = []
  let gender: ProfileGender = 'male'
  try {
    const body = await req.json()
    words = body.words || []
    gender = body.gender === 'female' ? 'female' : 'male'

    const phrase = conjugateWords(words, gender)
    return NextResponse.json({ phrase })
  } catch (err) {
    console.error('Conjugate error:', err)
    return NextResponse.json({ phrase: conjugateWords(words, gender) || words.join(' ') })
  }
}
