'use server'

import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { setFixedZoneCellsForProfile } from '@/lib/prisma/profileFixedZoneSql'
import {
  isKeyboardThemeEmpty,
  sanitizeKeyboardThemeInput,
  type KeyboardThemeColors,
} from '@/lib/keyboard/theme'
import { effectiveSubscriptionPlan, getMaxProfiles } from '@/lib/subscription/plans'
import { revalidatePath } from 'next/cache'

const LUMA_EXPORT_VERSION = 2 as const

type LumaPhraseIn = {
  text: string
  symbolsUsed: unknown
  isPinned?: boolean
  useCount?: number
}

function clampDim(n: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback
  return Math.min(20, Math.max(1, Math.floor(n)))
}

function parseSymbolsUsed(raw: unknown): Array<{ id: string; label: string }> {
  if (!Array.isArray(raw)) return []
  const out: Array<{ id: string; label: string }> = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.label !== 'string') continue
    out.push({ id: o.id, label: o.label })
  }
  return out
}

function remapPhraseSymbolsUsed(
  arr: Array<{ id: string; label: string }>,
  idMap: Map<string, string>,
): Array<{ id: string; label: string }> {
  return arr
    .map((e) => {
      const nid = idMap.get(e.id)
      if (!nid) return null
      return { id: nid, label: e.label }
    })
    .filter((x): x is { id: string; label: string } => x !== null)
}

/** Importa un tablero desde JSON (.luma). No aplica voz ni preferencias de cuenta. */
export async function importProfileBoardFromLuma(
  jsonText: string,
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autorizado' }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText) as unknown
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido.' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Formato de archivo no reconocido.' }
  }

  const root = parsed as Record<string, unknown>
  const version = root.version
  if (version !== 1 && version !== LUMA_EXPORT_VERSION) {
    return { ok: false, error: 'Versión de archivo no compatible.' }
  }

  const profRaw = root.profile
  if (!profRaw || typeof profRaw !== 'object' || Array.isArray(profRaw)) {
    return { ok: false, error: 'Falta el bloque «profile» en el archivo.' }
  }
  const prof = profRaw as Record<string, unknown>

  const nameRaw = typeof prof.name === 'string' ? prof.name.trim() : ''
  if (!nameRaw) return { ok: false, error: 'El tablero no tiene nombre válido.' }

  const gender = prof.gender === 'female' ? 'female' : prof.gender === 'male' ? 'male' : ''
  if (!gender) return { ok: false, error: 'Género del tablero no válido (male/female).' }

  const gridRows = clampDim(Number(prof.gridRows), 8)
  const gridCols = clampDim(Number(prof.gridCols), 14)

  let keyboardThemeJson: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull
  if ('keyboardTheme' in prof && prof.keyboardTheme !== undefined && prof.keyboardTheme !== null) {
    const sanitized = sanitizeKeyboardThemeInput(prof.keyboardTheme) as KeyboardThemeColors
    keyboardThemeJson = isKeyboardThemeEmpty(sanitized)
      ? Prisma.JsonNull
      : (sanitized as unknown as Prisma.InputJsonValue)
  }

  let fixedZoneJson: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull
  if ('fixedZoneCells' in prof && prof.fixedZoneCells !== undefined && prof.fixedZoneCells !== null) {
    fixedZoneJson = prof.fixedZoneCells as Prisma.InputJsonValue
  }

  const symbolsRaw = root.symbols
  if (!Array.isArray(symbolsRaw)) {
    return { ok: false, error: 'Falta la lista de símbolos.' }
  }

  const owner = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, plan: true },
  })
  const plan = effectiveSubscriptionPlan(owner?.email, owner?.plan)
  const maxP = getMaxProfiles(plan)
  const existingNonDemo = await prisma.profile.count({
    where: { userId: session.user.id, isDemo: false },
  })
  if (existingNonDemo >= maxP) {
    return {
      ok: false,
      error: `Tu plan permite hasta ${maxP} tablero(s) personalizado(s); el tablero DEMO no cuenta.`,
    }
  }

  const phrasesIn: LumaPhraseIn[] = []
  if (Array.isArray(root.phrases)) {
    for (const p of root.phrases) {
      if (!p || typeof p !== 'object') continue
      const o = p as Record<string, unknown>
      if (typeof o.text !== 'string' || !o.text.trim()) continue
      phrasesIn.push({
        text: o.text.trim(),
        symbolsUsed: o.symbolsUsed,
        isPinned: typeof o.isPinned === 'boolean' ? o.isPinned : false,
        useCount: typeof o.useCount === 'number' && Number.isFinite(o.useCount) ? Math.max(0, Math.floor(o.useCount)) : 0,
      })
    }
  }

  const idMap = new Map<string, string>()
  const symbolRows: Prisma.SymbolCreateManyInput[] = []

  for (const item of symbolsRaw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const s = item as Record<string, unknown>
    const oldId = typeof s.id === 'string' ? s.id : ''
    const newId = randomUUID()
    if (oldId) idMap.set(oldId, newId)

    const gridId = typeof s.gridId === 'string' && s.gridId ? s.gridId : 'main'
    const label = typeof s.label === 'string' ? s.label : ''
    if (!label.trim()) continue

    const normalizedLabel =
      typeof s.normalizedLabel === 'string' ? s.normalizedLabel : label.trim().toLowerCase()
    const category = typeof s.category === 'string' ? s.category : 'other'
    const posType = typeof s.posType === 'string' ? s.posType : 'other'
    const posConfidence =
      typeof s.posConfidence === 'number' && Number.isFinite(s.posConfidence) ? s.posConfidence : null
    const manualGrammarOverride = Boolean(s.manualGrammarOverride)
    const positionX = Number(s.positionX)
    const positionY = Number(s.positionY)
    if (!Number.isFinite(positionX) || !Number.isFinite(positionY)) continue
    const color = typeof s.color === 'string' && s.color ? s.color : '#6366f1'
    const hidden = Boolean(s.hidden)
    const state =
      s.state === 'visible' || s.state === 'locked' || s.state === 'hidden' ? s.state : 'visible'
    const opensKeyboard = Boolean(s.opensKeyboard)
    const fixedCell = Boolean(s.fixedCell)
    const emoji = s.emoji === null || typeof s.emoji === 'string' ? s.emoji : null
    const imageUrl = s.imageUrl === null || typeof s.imageUrl === 'string' ? s.imageUrl : null

    let wordVariants: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull
    if (s.wordVariants !== undefined && s.wordVariants !== null) {
      wordVariants = s.wordVariants as Prisma.InputJsonValue
    }

    symbolRows.push({
      id: newId,
      profileId: '', // se rellena en transacción
      gridId,
      label,
      normalizedLabel,
      emoji,
      imageUrl,
      category,
      posType,
      posConfidence,
      manualGrammarOverride,
      lexemeId: null,
      positionX: Math.floor(positionX),
      positionY: Math.floor(positionY),
      color,
      hidden,
      state,
      opensKeyboard,
      fixedCell,
      wordVariants,
    })
  }

  for (const row of symbolRows) {
    const oldGid = typeof row.gridId === 'string' ? row.gridId : 'main'
    const newGid =
      oldGid === 'main' ? 'main' : idMap.has(oldGid) ? idMap.get(oldGid)! : 'main'
    row.gridId = newGid
  }

  try {
    const newProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          name: nameRaw.slice(0, 200),
          gender,
          userId: session.user.id,
          isDemo: false,
          gridRows,
          gridCols,
          keyboardTheme: keyboardThemeJson,
        },
        select: { id: true },
      })

      if (symbolRows.length > 0) {
        const data = symbolRows.map((r) => ({
          ...r,
          profileId: profile.id,
        }))
        await tx.symbol.createMany({ data })
      }

      if (phrasesIn.length > 0) {
        const phraseData = phrasesIn.map((ph) => {
          const used = parseSymbolsUsed(ph.symbolsUsed)
          const remapped = remapPhraseSymbolsUsed(used, idMap)
          return {
            profileId: profile.id,
            text: ph.text.slice(0, 2000),
            symbolsUsed: JSON.stringify(remapped),
            isPinned: ph.isPinned,
            useCount: ph.useCount,
          }
        })
        await tx.phrase.createMany({ data: phraseData })
      }

      return profile
    })

    if (fixedZoneJson !== Prisma.JsonNull) {
      await setFixedZoneCellsForProfile(
        newProfile.id,
        session.user.id,
        fixedZoneJson as Prisma.InputJsonValue,
      )
    }

    revalidatePath('/admin')
    revalidatePath('/tablero')

    return { ok: true, profileId: newProfile.id }
  } catch (e) {
    console.error('importProfileBoardFromLuma', e)
    return { ok: false, error: 'No se pudo importar el tablero.' }
  }
}
