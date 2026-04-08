/**
 * Restaura posiciones del tablero DEMO (plantilla MAIN_GRID_TEMPLATE) y fija grid 14×8.
 *
 * Uso (raíz del proyecto, con DATABASE_URL en .env o .env.local):
 *   node scripts/repair-demo-by-email.mjs
 *   REPAIR_EMAIL=otro@correo.com node scripts/repair-demo-by-email.mjs
 *
 * Mantener MAIN_GRID_TEMPLATE alineado con lib/data/defaultSymbols.ts
 */
import './load-env-database.mjs'
import { PrismaClient } from '@prisma/client'

const MAIN_GRID_TEMPLATE = [
  ['Yo', 'Tú', 'Querer', 'Gustar', 'Ir', 'Dar', 'Charla rápida', '¿Qué?', '¿Quién?', '¿Dónde?', '¿Cuándo?', '¿Cómo?', '¿Por qué?', ''],
  ['Él', 'Ella', 'Poner', 'Necesitar', 'Ser', 'Sentir', 'Y', 'Alimentos', '', 'Objetos', '', 'Lugares', '', 'Cuerpo'],
  ['Nosotros', 'Ellos', 'Hacer', 'Escuchar', 'Pensar', 'Coger', 'A', '', 'Bebidas', '', 'Muebles', '', 'Ropa', ''],
  ['Vosotros', 'Este', 'Ver', 'Estar', 'Jugar', 'Tener', 'DE', 'Juegos', '', 'Sentimientos', '', 'Tiempo', '', 'Complementos'],
  ['Personas', 'Ayudar', 'Ahora', 'Comer', 'Beber', 'Poder', 'CON', '', 'Aparatos', '', 'Animales', '', 'Colores', ''],
  ['Sí', 'No', 'Después', 'Terminar', 'Decir', 'Más verbos', 'UN', 'Transportes', '', 'Plantas', '', 'Fiesta', '', 'Conceptos'],
  ['Más', 'No lo sé', 'Aquí', 'Ayer', 'Hoy', 'Mañana', 'Partículas', '', 'Actividades', '', 'Descripción', '', 'Formas y medidas', ''],
  ['Bien', 'Mal', 'Mucho', 'Diferente', 'Muy', 'También', 'Teclado', 'Números', '', 'Aficiones', '', 'Frases hechas', '', 'Más'],
]

function getDemoTemplatePositionMap() {
  const m = new Map()
  MAIN_GRID_TEMPLATE.forEach((row, y) => {
    row.forEach((label, x) => {
      if (!label || !String(label).trim()) return
      const k = String(label).trim().toLowerCase()
      if (!m.has(k)) m.set(k, { x, y })
    })
  })
  return m
}

const email = (process.env.REPAIR_EMAIL || 'sergio.tdc.tdc@gmail.com').trim().toLowerCase()

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL (.env o .env.local).')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No existe usuario con email: ${email}`)
    process.exit(1)
  }

  const profile = await prisma.profile.findFirst({
    where: { userId: user.id, isDemo: true },
  })
  if (!profile) {
    console.error(`El usuario ${email} no tiene perfil con isDemo=true`)
    process.exit(1)
  }

  const posMap = getDemoTemplatePositionMap()
  const symbols = await prisma.symbol.findMany({ where: { profileId: profile.id } })

  let realigned = 0
  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profile.id },
      data: { gridRows: 8, gridCols: 14 },
    })
    for (const s of symbols) {
      const pos = posMap.get(s.label.trim().toLowerCase())
      if (!pos) continue
      if (s.positionX === pos.x && s.positionY === pos.y) continue
      await tx.symbol.update({
        where: { id: s.id },
        data: { positionX: pos.x, positionY: pos.y },
      })
      realigned += 1
    }
  })

  console.log(`OK — usuario ${email}`)
  console.log(`Perfil demo: ${profile.id} (${profile.name})`)
  console.log(`Celdas realineadas: ${realigned} (símbolos en plantilla: ${symbols.length})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
