/**
 * Copia un usuario y sus datos desde la base SQLite local (prisma/dev.db)
 * hacia PostgreSQL (Neon) usando DATABASE_URL.
 *
 * Uso (en la raíz del proyecto, con .env que apunte a Neon):
 *   MIGRATE_EMAIL=sergio.tdc.tdc@gmail.com npm run migrate:sqlite-user
 *
 * Opcional:
 *   SQLITE_PATH=prisma/dev.db          — ruta al fichero SQLite antiguo
 *   MIGRATE_REPLACE=1                  — si el usuario ya existe en Neon, borrarlo y volver a insertar desde SQLite
 *
 * Requiere tener el archivo dev.db (o el que sea) de antes de migrar a Neon.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function bool(v) {
  if (v === true || v === 1 || v === '1') return true
  if (v === false || v === 0 || v === '0') return false
  return Boolean(v)
}

function date(v) {
  if (v == null) return new Date()
  if (v instanceof Date) return v
  return new Date(v)
}

function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Falta la variable de entorno ${name} (usa la URL de Neon en DATABASE_URL).`)
    process.exit(1)
  }
  return v
}

const emailRaw = process.env.MIGRATE_EMAIL || 'sergio.tdc.tdc@gmail.com'
const email = emailRaw.trim().toLowerCase()
const sqliteRelative = process.env.SQLITE_PATH || 'prisma/dev.db'
const sqlitePath = path.isAbsolute(sqliteRelative) ? sqliteRelative : path.join(root, sqliteRelative)
const replace = process.env.MIGRATE_REPLACE === '1' || process.env.MIGRATE_REPLACE === 'true'

async function main() {
  requireEnv('DATABASE_URL')

  if (!fs.existsSync(sqlitePath)) {
    console.error(`No se encuentra la base SQLite: ${sqlitePath}`)
    console.error('Copia aquí tu dev.db antiguo o indica SQLITE_PATH con la ruta correcta.')
    process.exit(1)
  }

  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true })
  const prisma = new PrismaClient()

  try {
    const userRow = sqlite
      .prepare('SELECT * FROM User WHERE LOWER(email) = ?')
      .get(email)

    if (!userRow) {
      console.error(`No hay usuario con email "${email}" en ${sqlitePath}`)
      process.exit(1)
    }

    const mapUser = (row) => ({
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name ?? null,
      preferredTheme: row.preferred_theme ?? row.preferredTheme ?? 'system',
      preferredDyslexiaFont: bool(row.preferred_dyslexia_font ?? row.preferredDyslexiaFont),
      createdAt: date(row.createdAt ?? row.created_at),
      updatedAt: date(row.updatedAt ?? row.updated_at),
    })

    const profileRows = sqlite.prepare('SELECT * FROM profiles WHERE user_id = ?').all(userRow.id)

    const profileIds = profileRows.map((p) => p.id)

    /** @type {Set<string>} */
    const lexemeIds = new Set()

    if (profileIds.length) {
      const placeholders = profileIds.map(() => '?').join(',')
      const symStmt = sqlite.prepare(
        `SELECT lexeme_id FROM symbols WHERE profile_id IN (${placeholders}) AND lexeme_id IS NOT NULL`,
      )
      for (const row of symStmt.all(...profileIds)) {
        if (row.lexeme_id) lexemeIds.add(row.lexeme_id)
      }
      const trStmt = sqlite.prepare(
        `SELECT from_lexeme_id, to_lexeme_id FROM prediction_transitions WHERE profile_id IN (${placeholders})`,
      )
      for (const row of trStmt.all(...profileIds)) {
        if (row.from_lexeme_id) lexemeIds.add(row.from_lexeme_id)
        if (row.to_lexeme_id) lexemeIds.add(row.to_lexeme_id)
      }
      const evStmt = sqlite.prepare(
        `SELECT lexeme_id FROM symbol_usage_events WHERE profile_id IN (${placeholders}) AND lexeme_id IS NOT NULL`,
      )
      for (const row of evStmt.all(...profileIds)) {
        if (row.lexeme_id) lexemeIds.add(row.lexeme_id)
      }
    }

    const mapLexeme = (row) => ({
      id: row.id,
      lemma: row.lemma,
      normalizedLemma: row.normalized_lemma,
      primaryPos: row.primary_pos,
      secondaryPos: row.secondary_pos ?? null,
      gender: row.gender ?? null,
      numberBehavior: row.number_behavior ?? null,
      verbGroup: row.verb_group ?? null,
      isIrregular: bool(row.is_irregular),
      isReflexive: bool(row.is_reflexive),
      transitivity: row.transitivity ?? null,
      frequencyScore: row.frequency_score != null ? Number(row.frequency_score) : null,
      aacPriority: row.aac_priority != null ? Number(row.aac_priority) : null,
      source: row.source ?? 'seed',
      createdAt: date(row.created_at),
      updatedAt: date(row.updated_at),
    })

    const mapLexemeForm = (row) => ({
      id: row.id,
      lexemeId: row.lexeme_id,
      surface: row.surface,
      normalizedSurface: row.normalized_surface,
      formType: row.form_type,
      person: row.person != null ? Number(row.person) : null,
      tense: row.tense ?? null,
      mood: row.mood ?? null,
      number: row.number ?? null,
      gender: row.gender ?? null,
      confidence: row.confidence != null ? Number(row.confidence) : null,
      createdAt: date(row.created_at),
    })

    const mapLexemeAlias = (row) => ({
      id: row.id,
      lexemeId: row.lexeme_id,
      alias: row.alias,
      normalizedAlias: row.normalized_alias,
      aliasType: row.alias_type,
      createdAt: date(row.created_at),
    })

    const mapProfile = (row) => ({
      id: row.id,
      name: row.name,
      userId: row.user_id,
      gender: row.gender ?? 'male',
      isDemo: bool(row.is_demo),
      gridRows: Number(row.grid_rows ?? 8),
      gridCols: Number(row.grid_cols ?? 14),
      createdAt: date(row.created_at),
      updatedAt: date(row.updated_at),
    })

    const mapSymbol = (row) => ({
      id: row.id,
      profileId: row.profile_id,
      gridId: row.grid_id,
      label: row.label,
      normalizedLabel: row.normalized_label ?? '',
      emoji: row.emoji ?? null,
      imageUrl: row.image_url ?? null,
      category: row.category,
      posType: row.pos_type,
      posConfidence: row.pos_confidence != null ? Number(row.pos_confidence) : null,
      manualGrammarOverride: bool(row.manual_grammar_override),
      lexemeId: row.lexeme_id ?? null,
      positionX: Number(row.position_x),
      positionY: Number(row.position_y),
      color: row.color,
      hidden: bool(row.hidden),
      state: row.state ?? 'visible',
      createdAt: date(row.created_at),
      updatedAt: date(row.updated_at),
    })

    const mapPhrase = (row) => ({
      id: row.id,
      profileId: row.profile_id,
      text: row.text,
      symbolsUsed: row.symbols_used,
      isPinned: bool(row.is_pinned),
      useCount: Number(row.use_count ?? 0),
      createdAt: date(row.created_at),
    })

    const mapTransition = (row) => ({
      id: row.id,
      profileId: row.profile_id,
      fromLexemeId: row.from_lexeme_id ?? null,
      toLexemeId: row.to_lexeme_id ?? null,
      fromSymbolLabel: row.from_symbol_label ?? null,
      toSymbolLabel: row.to_symbol_label ?? null,
      count: Number(row.count ?? 0),
      lastUsedAt: date(row.last_used_at),
      createdAt: date(row.created_at),
      updatedAt: date(row.updated_at),
    })

    const mapUsageEvent = (row) => ({
      id: row.id,
      profileId: row.profile_id,
      symbolId: row.symbol_id ?? null,
      lexemeId: row.lexeme_id ?? null,
      phraseSessionId: row.phrase_session_id,
      sequenceIndex: Number(row.sequence_index),
      createdAt: date(row.created_at),
    })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && !replace) {
      console.error(
        `Ya existe "${email}" en Neon. Si quieres sustituirlo por los datos del SQLite, ejecuta con MIGRATE_REPLACE=1`,
      )
      process.exit(1)
    }

    await prisma.$transaction(async (tx) => {
      if (existing && replace) {
        const profiles = await tx.profile.findMany({ where: { userId: existing.id }, select: { id: true } })
        const pids = profiles.map((p) => p.id)
        if (pids.length) {
          await tx.phrase.deleteMany({ where: { profileId: { in: pids } } })
        }
        await tx.user.delete({ where: { id: existing.id } })
      }

      for (const lid of lexemeIds) {
        const row = sqlite.prepare('SELECT * FROM lexemes WHERE id = ?').get(lid)
        if (!row) continue
        const data = mapLexeme(row)
        await tx.lexeme.upsert({
          where: { id: data.id },
          create: data,
          update: { updatedAt: data.updatedAt },
        })
      }

      const formRows = []
      const aliasRows = []
      for (const lid of lexemeIds) {
        formRows.push(...sqlite.prepare('SELECT * FROM lexeme_forms WHERE lexeme_id = ?').all(lid))
        aliasRows.push(...sqlite.prepare('SELECT * FROM lexeme_aliases WHERE lexeme_id = ?').all(lid))
      }

      for (const row of formRows) {
        const data = mapLexemeForm(row)
        await tx.lexemeForm.upsert({
          where: { id: data.id },
          create: data,
          update: { surface: data.surface },
        })
      }
      for (const row of aliasRows) {
        const data = mapLexemeAlias(row)
        await tx.lexemeAlias.upsert({
          where: { id: data.id },
          create: data,
          update: { alias: data.alias },
        })
      }

      const u = mapUser(userRow)
      await tx.user.upsert({
        where: { id: u.id },
        create: u,
        update: {
          email: u.email,
          password: u.password,
          name: u.name,
          preferredTheme: u.preferredTheme,
          preferredDyslexiaFont: u.preferredDyslexiaFont,
          updatedAt: u.updatedAt,
        },
      })

      for (const row of profileRows) {
        const p = mapProfile(row)
        await tx.profile.upsert({
          where: { id: p.id },
          create: p,
          update: {
            name: p.name,
            gender: p.gender,
            isDemo: p.isDemo,
            gridRows: p.gridRows,
            gridCols: p.gridCols,
            updatedAt: p.updatedAt,
          },
        })
      }

      const symbolRows =
        profileIds.length === 0
          ? []
          : sqlite
              .prepare(
                `SELECT * FROM symbols WHERE profile_id IN (${profileIds.map(() => '?').join(',')})`,
              )
              .all(...profileIds)

      for (const row of symbolRows) {
        const s = mapSymbol(row)
        await tx.symbol.upsert({
          where: { id: s.id },
          create: s,
          update: {
            label: s.label,
            normalizedLabel: s.normalizedLabel,
            emoji: s.emoji,
            imageUrl: s.imageUrl,
            category: s.category,
            posType: s.posType,
            posConfidence: s.posConfidence,
            manualGrammarOverride: s.manualGrammarOverride,
            lexemeId: s.lexemeId,
            positionX: s.positionX,
            positionY: s.positionY,
            color: s.color,
            hidden: s.hidden,
            state: s.state,
            updatedAt: s.updatedAt,
          },
        })
      }

      for (const pid of profileIds) {
        const phraseRows = sqlite.prepare('SELECT * FROM phrases WHERE profile_id = ?').all(pid)
        for (const row of phraseRows) {
          const ph = mapPhrase(row)
          await tx.phrase.upsert({
            where: { id: ph.id },
            create: ph,
            update: {
              text: ph.text,
              symbolsUsed: ph.symbolsUsed,
              isPinned: ph.isPinned,
              useCount: ph.useCount,
            },
          })
        }
      }

      for (const pid of profileIds) {
        const trRows = sqlite.prepare('SELECT * FROM prediction_transitions WHERE profile_id = ?').all(pid)
        for (const row of trRows) {
          const t = mapTransition(row)
          await tx.predictionTransition.upsert({
            where: { id: t.id },
            create: t,
            update: {
              count: t.count,
              lastUsedAt: t.lastUsedAt,
              updatedAt: t.updatedAt,
            },
          })
        }
      }

      for (const pid of profileIds) {
        const evRows = sqlite.prepare('SELECT * FROM symbol_usage_events WHERE profile_id = ?').all(pid)
        for (const row of evRows) {
          const e = mapUsageEvent(row)
          await tx.symbolUsageEvent.upsert({
            where: { id: e.id },
            create: e,
            update: {
              symbolId: e.symbolId,
              lexemeId: e.lexemeId,
              sequenceIndex: e.sequenceIndex,
            },
          })
        }
      }
    })

    console.log(`OK: usuario "${email}" migrado desde SQLite a Neon (${profileRows.length} perfil(es)).`)
  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
