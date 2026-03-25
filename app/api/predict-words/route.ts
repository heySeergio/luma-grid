import { NextRequest, NextResponse } from 'next/server'

const COMMON_SPANISH_WORDS = [
  'agua', 'casa', 'mama', 'papa', 'bien', 'malo', 'hola', 'adios',
  'quiero', 'necesito', 'ayuda', 'gracias', 'favor', 'comer', 'beber',
  'dormir', 'jugar', 'salir', 'venir', 'tener', 'hacer', 'poder',
  'queso', 'leche', 'pan', 'fruta', 'pasta', 'pollo', 'arroz',
  'colegio', 'parque', 'médico', 'tienda', 'baño', 'cocina',
  'feliz', 'triste', 'cansado', 'enfadado', 'contento', 'dolor',
  'mañana', 'tarde', 'noche', 'hoy', 'ahora', 'después', 'antes',
]

export async function POST(req: NextRequest) {
  try {
    const { prefix } = await req.json()
    if (!prefix || prefix.length < 2) return NextResponse.json({ words: [] })

    const words = COMMON_SPANISH_WORDS
      .filter(w => w.startsWith(prefix.toLowerCase()))
      .slice(0, 8)

    return NextResponse.json({ words })
  } catch {
    return NextResponse.json({ words: [] })
  }
}
