import type { WordVariantsConfig } from '@/lib/symbolWordVariants'
import type { PosType, Symbol } from '@/lib/supabase/types'
import { BASE_FIXED_LEFT_COLUMN_COUNT } from '@/lib/grid/baseFixedZone'
import { effectiveSymbolGridId } from '@/lib/grid/gridCellOverlap'
import {
  DEFAULT_FIXED_CELL_COLOR,
  DEFAULT_FOLDER_COLOR,
  DEFAULT_SYMBOL_COLOR,
  DEFAULT_TEMPLATE_COLOR,
} from '@/lib/ui/symbolColors'

/** URL pública para archivos en `public/DEMO ICONS/` (espacio en carpeta + nombres con tildes). */
export function demoIconsAssetUrl(filename: string): string {
  return `/DEMO%20ICONS/${encodeURIComponent(filename)}`
}

/** Campos mínimos para sembrar símbolos por defecto (registro / plantilla). */
type PartialSymbol = Pick<
  Symbol,
  'label' | 'category' | 'posType' | 'positionX' | 'positionY' | 'color' | 'hidden'
> & { emoji?: Symbol['emoji']; imageUrl?: string; wordVariants?: Symbol['wordVariants'] }

/**
 * Variantes del tablero base para estos pronombres. Si en BD `word_variants` es null (filas creadas antes),
 * el servidor las aplica al mapear a cliente (`mapPrismaSymbolToClient`).
 */
export const DEFAULT_BOARD_WORD_VARIANTS_BY_LABEL: Readonly<Record<string, WordVariantsConfig>> = {
  Nosotros: { enabled: true, defaultIndex: 0, variants: ['Nosotros', 'Nosotras', '', ''] },
  Ellos: { enabled: true, defaultIndex: 0, variants: ['Ellos', 'Ellas', '', ''] },
  Vosotros: { enabled: true, defaultIndex: 0, variants: ['Vosotros', 'Vosotras', '', ''] },
}

export const DEFAULT_SYMBOLS: PartialSymbol[] = [
  // Pronombres
  {
    label: 'Yo',
    imageUrl: demoIconsAssetUrl('Yo.png'),
    category: 'Yo/Tú',
    posType: 'pronoun',
    positionX: 0,
    positionY: 0,
    color: 'preset:sky',
    hidden: false,
  },
  {
    label: 'Tú',
    imageUrl: demoIconsAssetUrl('Tú.png'),
    category: 'Yo/Tú',
    posType: 'pronoun',
    positionX: 1,
    positionY: 0,
    color: 'preset:sky',
    hidden: false,
  },
  { label: 'Él', emoji: '🧑', category: 'Yo/Tú', posType: 'pronoun', positionX: 2, positionY: 0, color: 'preset:sky', hidden: false },
  { label: 'Ella', emoji: '👩', category: 'Yo/Tú', posType: 'pronoun', positionX: 3, positionY: 0, color: 'preset:sky', hidden: false },
  {
    label: 'Nosotros',
    emoji: '👨‍👩‍👧',
    category: 'Yo/Tú',
    posType: 'pronoun',
    positionX: 4,
    positionY: 0,
    color: 'preset:sky',
    hidden: false,
    wordVariants: DEFAULT_BOARD_WORD_VARIANTS_BY_LABEL.Nosotros,
  },
  {
    label: 'Ellos',
    emoji: '👥',
    category: 'Yo/Tú',
    posType: 'pronoun',
    positionX: 1,
    positionY: 2,
    color: 'preset:sky',
    hidden: false,
    wordVariants: DEFAULT_BOARD_WORD_VARIANTS_BY_LABEL.Ellos,
  },
  {
    label: 'Vosotros',
    emoji: '👥',
    category: 'Yo/Tú',
    posType: 'pronoun',
    positionX: 0,
    positionY: 3,
    color: 'preset:sky',
    hidden: false,
    wordVariants: DEFAULT_BOARD_WORD_VARIANTS_BY_LABEL.Vosotros,
  },
  { label: 'No', emoji: '❌', category: 'Yo/Tú', posType: 'adverb', positionX: 5, positionY: 0, color: 'preset:rose', hidden: false },
  { label: 'Sí', emoji: '✅', category: 'Yo/Tú', posType: 'adverb', positionX: 6, positionY: 0, color: 'preset:green', hidden: false },
  { label: 'Más', emoji: '➕', category: 'Yo/Tú', posType: 'adverb', positionX: 7, positionY: 0, color: 'preset:yellow', hidden: false },
  { label: 'Personas', emoji: '👨‍👩‍👧‍👦', category: 'Yo/Tú', posType: 'noun', positionX: 0, positionY: 4, color: 'preset:sky', hidden: false },
  { label: 'Papá', emoji: '👨', category: 'Yo/Tú', posType: 'noun', positionX: 0, positionY: 1, color: 'preset:amber', hidden: false },
  { label: 'Mamá', emoji: '👩', category: 'Yo/Tú', posType: 'noun', positionX: 1, positionY: 1, color: 'preset:amber', hidden: false },
  { label: 'Abuelo', emoji: '👴', category: 'Yo/Tú', posType: 'noun', positionX: 2, positionY: 1, color: 'preset:amber', hidden: false },
  { label: 'Abuela', emoji: '👵', category: 'Yo/Tú', posType: 'noun', positionX: 3, positionY: 1, color: 'preset:amber', hidden: false },
  { label: 'Hermano', emoji: '🧑', category: 'Yo/Tú', posType: 'noun', positionX: 4, positionY: 1, color: 'preset:amber', hidden: false },
  { label: 'Hermana', emoji: '👧', category: 'Yo/Tú', posType: 'noun', positionX: 5, positionY: 1, color: 'preset:amber', hidden: false },
  { label: '¿Qué?', emoji: '🤔', category: 'Preguntas', posType: 'other', positionX: 7, positionY: 0, color: 'preset:pink', hidden: false },
  { label: '¿Quién?', emoji: '🧑', category: 'Preguntas', posType: 'other', positionX: 8, positionY: 0, color: 'preset:pink', hidden: false },
  { label: '¿Dónde?', emoji: '📍', category: 'Preguntas', posType: 'other', positionX: 9, positionY: 0, color: 'preset:pink', hidden: false },
  { label: '¿Cuándo?', emoji: '🕒', category: 'Preguntas', posType: 'other', positionX: 10, positionY: 0, color: 'preset:pink', hidden: false },
  { label: '¿Cómo?', emoji: '⚙️', category: 'Preguntas', posType: 'other', positionX: 11, positionY: 0, color: 'preset:pink', hidden: false },
  { label: '¿Por qué?', emoji: '🧠', category: 'Preguntas', posType: 'other', positionX: 12, positionY: 0, color: 'preset:pink', hidden: false },

  // Acciones
  { label: 'Querer', emoji: '💙', category: 'Acciones', posType: 'verb', positionX: 0, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Gustar', emoji: '💚', category: 'Acciones', posType: 'verb', positionX: 3, positionY: 0, color: 'preset:violet', hidden: false },
  { label: 'Dar', emoji: '🤲', category: 'Acciones', posType: 'verb', positionX: 5, positionY: 0, color: 'preset:violet', hidden: false },
  { label: 'Poner', emoji: '📌', category: 'Acciones', posType: 'verb', positionX: 2, positionY: 1, color: 'preset:violet', hidden: false },
  { label: 'Necesitar', emoji: '🙏', category: 'Acciones', posType: 'verb', positionX: 3, positionY: 1, color: 'preset:violet', hidden: false },
  { label: 'Ser', emoji: '✨', category: 'Acciones', posType: 'verb', positionX: 4, positionY: 1, color: 'preset:violet', hidden: false },
  { label: 'Sentir', emoji: '❤️', category: 'Acciones', posType: 'verb', positionX: 5, positionY: 1, color: 'preset:violet', hidden: false },
  { label: 'Hacer', emoji: '🛠️', category: 'Acciones', posType: 'verb', positionX: 2, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Escuchar', emoji: '👂', category: 'Acciones', posType: 'verb', positionX: 3, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Pensar', emoji: '💭', category: 'Acciones', posType: 'verb', positionX: 4, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Coger', emoji: '✋', category: 'Acciones', posType: 'verb', positionX: 5, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Comer', emoji: '🍽️', category: 'Acciones', posType: 'verb', positionX: 1, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Beber', emoji: '🥤', category: 'Acciones', posType: 'verb', positionX: 2, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Ir', emoji: '🚶', category: 'Acciones', posType: 'verb', positionX: 3, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Ver', emoji: '👁️', category: 'Acciones', posType: 'verb', positionX: 4, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Jugar', emoji: '🎮', category: 'Acciones', posType: 'verb', positionX: 5, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Dormir', emoji: '😴', category: 'Acciones', posType: 'verb', positionX: 6, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Ayudar', emoji: '🤝', category: 'Acciones', posType: 'verb', positionX: 7, positionY: 2, color: 'preset:violet', hidden: false },
  { label: 'Estar', emoji: '🧍', category: 'Acciones', posType: 'verb', positionX: 3, positionY: 3, color: 'preset:violet', hidden: false },
  { label: 'Tener', emoji: '🫶', category: 'Acciones', posType: 'verb', positionX: 5, positionY: 3, color: 'preset:violet', hidden: false },
  { label: 'Poder', emoji: '⚡', category: 'Acciones', posType: 'verb', positionX: 5, positionY: 4, color: 'preset:violet', hidden: false },
  { label: 'Terminar', emoji: '🏁', category: 'Acciones', posType: 'verb', positionX: 3, positionY: 5, color: 'preset:violet', hidden: false },
  { label: 'Decir', emoji: '🗣️', category: 'Acciones', posType: 'verb', positionX: 4, positionY: 5, color: 'preset:violet', hidden: false },

  // Comida
  { label: 'Agua', emoji: '💧', category: 'Comida', posType: 'noun', positionX: 0, positionY: 2, color: 'preset:cyan', hidden: false },
  { label: 'Leche', emoji: '🥛', category: 'Comida', posType: 'noun', positionX: 1, positionY: 2, color: 'preset:cyan', hidden: false },
  { label: 'Pan', emoji: '🍞', category: 'Comida', posType: 'noun', positionX: 2, positionY: 2, color: 'preset:cyan', hidden: false },
  { label: 'Fruta', emoji: '🍎', category: 'Comida', posType: 'noun', positionX: 3, positionY: 2, color: 'preset:cyan', hidden: false },
  { label: 'Pasta', emoji: '🍝', category: 'Comida', posType: 'noun', positionX: 4, positionY: 2, color: 'preset:cyan', hidden: false },
  { label: 'Pollo', emoji: '🍗', category: 'Comida', posType: 'noun', positionX: 5, positionY: 2, color: 'preset:cyan', hidden: false },
  { label: 'Galleta', emoji: '🍪', category: 'Comida', posType: 'noun', positionX: 6, positionY: 2, color: 'preset:cyan', hidden: false },
  { label: 'Zumo', emoji: '🧃', category: 'Comida', posType: 'noun', positionX: 7, positionY: 2, color: 'preset:cyan', hidden: false },

  // Lugares
  { label: 'Casa', emoji: '🏠', category: 'Lugares', posType: 'noun', positionX: 0, positionY: 3, color: 'preset:yellow', hidden: false },
  { label: 'Colegio', emoji: '🏫', category: 'Lugares', posType: 'noun', positionX: 1, positionY: 3, color: 'preset:yellow', hidden: false },
  { label: 'Baño', emoji: '🚽', category: 'Lugares', posType: 'noun', positionX: 2, positionY: 3, color: 'preset:yellow', hidden: false },
  { label: 'Parque', emoji: '🌳', category: 'Lugares', posType: 'noun', positionX: 3, positionY: 3, color: 'preset:yellow', hidden: false },
  { label: 'Médico', emoji: '🏥', category: 'Lugares', posType: 'noun', positionX: 4, positionY: 3, color: 'preset:yellow', hidden: false },
  { label: 'Tienda', emoji: '🏪', category: 'Lugares', posType: 'noun', positionX: 5, positionY: 3, color: 'preset:yellow', hidden: false },
  { label: 'Cama', emoji: '🛏️', category: 'Lugares', posType: 'noun', positionX: 6, positionY: 3, color: 'preset:yellow', hidden: false },
  { label: 'Mesa', emoji: '🪑', category: 'Lugares', posType: 'noun', positionX: 7, positionY: 3, color: 'preset:yellow', hidden: false },

  // Sentimientos
  { label: 'Feliz', emoji: '😊', category: 'Sentimientos', posType: 'adj', positionX: 0, positionY: 4, color: 'preset:green', hidden: false },
  { label: 'Triste', emoji: '😢', category: 'Sentimientos', posType: 'adj', positionX: 1, positionY: 4, color: 'preset:green', hidden: false },
  { label: 'Enfadado', emoji: '😠', category: 'Sentimientos', posType: 'adj', positionX: 2, positionY: 4, color: 'preset:green', hidden: false },
  { label: 'Cansado', emoji: '😪', category: 'Sentimientos', posType: 'adj', positionX: 3, positionY: 4, color: 'preset:green', hidden: false },
  { label: 'Dolor', emoji: '🤕', category: 'Sentimientos', posType: 'noun', positionX: 4, positionY: 4, color: 'preset:green', hidden: false },
  { label: 'Miedo', emoji: '😨', category: 'Sentimientos', posType: 'noun', positionX: 5, positionY: 4, color: 'preset:green', hidden: false },
  { label: 'Bien', emoji: '👍', category: 'Sentimientos', posType: 'adverb', positionX: 6, positionY: 4, color: 'preset:green', hidden: false },
  { label: 'Mal', emoji: '👎', category: 'Sentimientos', posType: 'adverb', positionX: 7, positionY: 4, color: 'preset:green', hidden: false },

  // Tiempo
  { label: 'Ahora', emoji: '⏰', category: 'Tiempo', posType: 'adverb', positionX: 0, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Ayer', emoji: '📆', category: 'Tiempo', posType: 'adverb', positionX: 3, positionY: 6, color: 'preset:time', hidden: false },
  { label: 'Hoy', emoji: '📅', category: 'Tiempo', posType: 'adverb', positionX: 1, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Mañana', emoji: '🌅', category: 'Tiempo', posType: 'adverb', positionX: 2, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Después', emoji: '⏭️', category: 'Tiempo', posType: 'adverb', positionX: 3, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Antes', emoji: '⏮️', category: 'Tiempo', posType: 'adverb', positionX: 4, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Siempre', emoji: '♾️', category: 'Tiempo', posType: 'adverb', positionX: 5, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Nunca', emoji: '🚫', category: 'Tiempo', posType: 'adverb', positionX: 6, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Mucho', emoji: '💯', category: 'Tiempo', posType: 'adverb', positionX: 7, positionY: 5, color: 'preset:time', hidden: false },
  { label: 'Teclado', emoji: '⌨️', category: 'Fijo', posType: 'other', positionX: 6, positionY: 7, color: DEFAULT_TEMPLATE_COLOR, hidden: false },

  // Partículas y conectores
  { label: 'Y', emoji: '🔗', category: 'Partículas', posType: 'other', positionX: 6, positionY: 1, color: 'preset:mint', hidden: false },
  { label: 'A', emoji: '➡️', category: 'Partículas', posType: 'other', positionX: 6, positionY: 2, color: 'preset:mint', hidden: false },
  { label: 'DE', emoji: '↘️', category: 'Partículas', posType: 'other', positionX: 6, positionY: 3, color: 'preset:mint', hidden: false },
  { label: 'CON', emoji: '🤝', category: 'Partículas', posType: 'other', positionX: 6, positionY: 4, color: 'preset:mint', hidden: false },
  { label: 'UN', emoji: '1️⃣', category: 'Partículas', posType: 'other', positionX: 6, positionY: 5, color: 'preset:mint', hidden: false },
  { label: 'Este', emoji: '👈', category: 'Partículas', posType: 'other', positionX: 1, positionY: 3, color: 'preset:mint', hidden: false },
  { label: 'No lo sé', emoji: '🤷', category: 'Partículas', posType: 'other', positionX: 1, positionY: 6, color: 'preset:mint', hidden: false },
  { label: 'Aquí', emoji: '📍', category: 'Partículas', posType: 'adverb', positionX: 2, positionY: 6, color: 'preset:mint', hidden: false },
  { label: 'Diferente', emoji: '🔀', category: 'Descripción', posType: 'adj', positionX: 3, positionY: 7, color: 'preset:green', hidden: false },
  { label: 'Muy', emoji: '🔥', category: 'Partículas', posType: 'adverb', positionX: 4, positionY: 7, color: 'preset:mint', hidden: false },
  { label: 'También', emoji: '➕', category: 'Partículas', posType: 'adverb', positionX: 5, positionY: 7, color: 'preset:mint', hidden: false },

  // Ropa (léxico carpeta; posiciones fuera del grid principal — solo emoji por etiqueta)
  { label: 'Camiseta', emoji: '👕', category: 'Ropa', posType: 'noun', positionX: 0, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Camiseta de tirantes', emoji: '🎽', category: 'Ropa', posType: 'noun', positionX: 1, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Jersey', emoji: '🧶', category: 'Ropa', posType: 'noun', positionX: 2, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Pantalón', emoji: '👖', category: 'Ropa', posType: 'noun', positionX: 3, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Pantalón corto', emoji: '🩳', category: 'Ropa', posType: 'noun', positionX: 4, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Falda', emoji: '👗', category: 'Ropa', posType: 'noun', positionX: 5, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Vestido', emoji: '👗', category: 'Ropa', posType: 'noun', positionX: 6, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Peto', emoji: '🦺', category: 'Ropa', posType: 'noun', positionX: 7, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Camisa', emoji: '👔', category: 'Ropa', posType: 'noun', positionX: 8, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Chaleco', emoji: '🦺', category: 'Ropa', posType: 'noun', positionX: 9, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Chaqueta', emoji: '🧥', category: 'Ropa', posType: 'noun', positionX: 10, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Americana', emoji: '🧥', category: 'Ropa', posType: 'noun', positionX: 11, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Chándal', emoji: '👕', category: 'Ropa', posType: 'noun', positionX: 12, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Chaquetón', emoji: '🧥', category: 'Ropa', posType: 'noun', positionX: 13, positionY: 20, color: 'preset:pink', hidden: false },
  { label: 'Abrigo', emoji: '🧥', category: 'Ropa', posType: 'noun', positionX: 0, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Impermeable', emoji: '🧥', category: 'Ropa', posType: 'noun', positionX: 1, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Bufanda', emoji: '🧣', category: 'Ropa', posType: 'noun', positionX: 2, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Gorro', emoji: '🧢', category: 'Ropa', posType: 'noun', positionX: 3, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Guantes', emoji: '🧤', category: 'Ropa', posType: 'noun', positionX: 4, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Zapatos', emoji: '👞', category: 'Ropa', posType: 'noun', positionX: 5, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Zapatillas', emoji: '👟', category: 'Ropa', posType: 'noun', positionX: 6, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Botas', emoji: '🥾', category: 'Ropa', posType: 'noun', positionX: 7, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Chanclas', emoji: '🩴', category: 'Ropa', posType: 'noun', positionX: 8, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Pijama', emoji: '👘', category: 'Ropa', posType: 'noun', positionX: 9, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Calcetines', emoji: '🧦', category: 'Ropa', posType: 'noun', positionX: 10, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Bañador', emoji: '🩱', category: 'Ropa', posType: 'noun', positionX: 11, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Babero', emoji: '👶', category: 'Ropa', posType: 'noun', positionX: 12, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Pañal', emoji: '🍼', category: 'Ropa', posType: 'noun', positionX: 13, positionY: 21, color: 'preset:pink', hidden: false },
  { label: 'Bragas', emoji: '🩲', category: 'Ropa', posType: 'noun', positionX: 0, positionY: 22, color: 'preset:pink', hidden: false },
  { label: 'Calzoncillos', emoji: '🩲', category: 'Ropa', posType: 'noun', positionX: 1, positionY: 22, color: 'preset:pink', hidden: false },
  { label: 'Sujetador', emoji: '👙', category: 'Ropa', posType: 'noun', positionX: 2, positionY: 22, color: 'preset:pink', hidden: false },
  { label: 'Corbata', emoji: '👔', category: 'Ropa', posType: 'noun', positionX: 3, positionY: 22, color: 'preset:pink', hidden: false },
  { label: 'Bolsillo', emoji: '👖', category: 'Ropa', posType: 'noun', positionX: 4, positionY: 22, color: 'preset:pink', hidden: false },
  { label: 'Cremallera', emoji: '🧵', category: 'Ropa', posType: 'noun', positionX: 5, positionY: 22, color: 'preset:pink', hidden: false },
  { label: 'Botón', emoji: '🔘', category: 'Ropa', posType: 'noun', positionX: 6, positionY: 22, color: 'preset:pink', hidden: false },

  // Animales (léxico carpeta; posiciones fuera del grid principal)
  { label: 'Animal', emoji: '🐾', category: 'Animales', posType: 'noun', positionX: 0, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Perro', emoji: '🐕', category: 'Animales', posType: 'noun', positionX: 1, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Gato', emoji: '🐈', category: 'Animales', posType: 'noun', positionX: 2, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Pollito', emoji: '🐤', category: 'Animales', posType: 'noun', positionX: 3, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Gallo', emoji: '🐓', category: 'Animales', posType: 'noun', positionX: 4, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Gallina', emoji: '🐔', category: 'Animales', posType: 'noun', positionX: 5, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Pato', emoji: '🦆', category: 'Animales', posType: 'noun', positionX: 6, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Conejo', emoji: '🐰', category: 'Animales', posType: 'noun', positionX: 7, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Vaca', emoji: '🐄', category: 'Animales', posType: 'noun', positionX: 8, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Oveja', emoji: '🐑', category: 'Animales', posType: 'noun', positionX: 9, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Cabra', emoji: '🐐', category: 'Animales', posType: 'noun', positionX: 10, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Burro', emoji: '🫏', category: 'Animales', posType: 'noun', positionX: 11, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Caballo', emoji: '🐴', category: 'Animales', posType: 'noun', positionX: 12, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Cerdo', emoji: '🐷', category: 'Animales', posType: 'noun', positionX: 13, positionY: 23, color: 'preset:green', hidden: false },
  { label: 'Pájaro', emoji: '🐦', category: 'Animales', posType: 'noun', positionX: 0, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Mosca', emoji: '🪰', category: 'Animales', posType: 'noun', positionX: 1, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Mosquito', emoji: '🦟', category: 'Animales', posType: 'noun', positionX: 2, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Araña', emoji: '🕷️', category: 'Animales', posType: 'noun', positionX: 3, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Caracol', emoji: '🐌', category: 'Animales', posType: 'noun', positionX: 4, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Abeja', emoji: '🐝', category: 'Animales', posType: 'noun', positionX: 5, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Mariposa', emoji: '🦋', category: 'Animales', posType: 'noun', positionX: 6, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Ratón', emoji: '🐭', category: 'Animales', posType: 'noun', positionX: 7, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Bicho', emoji: '🐛', category: 'Animales', posType: 'noun', positionX: 8, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Lagartija', emoji: '🦎', category: 'Animales', posType: 'noun', positionX: 9, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Ardilla', emoji: '🐿️', category: 'Animales', posType: 'noun', positionX: 10, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Tortuga', emoji: '🐢', category: 'Animales', posType: 'noun', positionX: 11, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Rana', emoji: '🐸', category: 'Animales', posType: 'noun', positionX: 12, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Gusano', emoji: '🪱', category: 'Animales', posType: 'noun', positionX: 13, positionY: 24, color: 'preset:green', hidden: false },
  { label: 'Jabalí', emoji: '🐗', category: 'Animales', posType: 'noun', positionX: 0, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Lobo', emoji: '🐺', category: 'Animales', posType: 'noun', positionX: 1, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Oso', emoji: '🐻', category: 'Animales', posType: 'noun', positionX: 2, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Búho', emoji: '🦉', category: 'Animales', posType: 'noun', positionX: 3, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Mono', emoji: '🐵', category: 'Animales', posType: 'noun', positionX: 4, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Zorro', emoji: '🦊', category: 'Animales', posType: 'noun', positionX: 5, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'León', emoji: '🦁', category: 'Animales', posType: 'noun', positionX: 6, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Tigre', emoji: '🐯', category: 'Animales', posType: 'noun', positionX: 7, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Elefante', emoji: '🐘', category: 'Animales', posType: 'noun', positionX: 8, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Cebra', emoji: '🦓', category: 'Animales', posType: 'noun', positionX: 9, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Jirafa', emoji: '🦒', category: 'Animales', posType: 'noun', positionX: 10, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Canguro', emoji: '🦘', category: 'Animales', posType: 'noun', positionX: 11, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Camello', emoji: '🐪', category: 'Animales', posType: 'noun', positionX: 12, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Hipopótamo', emoji: '🦛', category: 'Animales', posType: 'noun', positionX: 13, positionY: 25, color: 'preset:green', hidden: false },
  { label: 'Pez', emoji: '🐟', category: 'Animales', posType: 'noun', positionX: 0, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Ballena', emoji: '🐋', category: 'Animales', posType: 'noun', positionX: 1, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Delfín', emoji: '🐬', category: 'Animales', posType: 'noun', positionX: 2, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Tiburón', emoji: '🦈', category: 'Animales', posType: 'noun', positionX: 3, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Foca', emoji: '🦭', category: 'Animales', posType: 'noun', positionX: 4, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Pingüino', emoji: '🐧', category: 'Animales', posType: 'noun', positionX: 5, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Serpiente', emoji: '🐍', category: 'Animales', posType: 'noun', positionX: 6, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Cangrejo', emoji: '🦀', category: 'Animales', posType: 'noun', positionX: 7, positionY: 26, color: 'preset:green', hidden: false },
  { label: 'Dinosaurio', emoji: '🦖', category: 'Animales', posType: 'noun', positionX: 8, positionY: 26, color: 'preset:green', hidden: false },

  // Aficiones (léxico carpeta; posiciones fuera del grid principal)
  { label: 'Me gusta', emoji: '👍', category: 'Aficiones', posType: 'verb', positionX: 0, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'No me gusta', emoji: '👎', category: 'Aficiones', posType: 'verb', positionX: 1, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Escuchar música', emoji: '🎧', category: 'Aficiones', posType: 'verb', positionX: 2, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Jugar basket', emoji: '🏀', category: 'Aficiones', posType: 'verb', positionX: 3, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Hacer puzzles', emoji: '🧩', category: 'Aficiones', posType: 'verb', positionX: 4, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Jugar al fútbol', emoji: '⚽', category: 'Aficiones', posType: 'verb', positionX: 5, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Pintar', emoji: '🎨', category: 'Aficiones', posType: 'verb', positionX: 6, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Bailar', emoji: '💃', category: 'Aficiones', posType: 'verb', positionX: 7, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Cantar', emoji: '🎤', category: 'Aficiones', posType: 'verb', positionX: 8, positionY: 27, color: 'preset:violet', hidden: false },
  { label: 'Leer', emoji: '📖', category: 'Aficiones', posType: 'verb', positionX: 9, positionY: 27, color: 'preset:violet', hidden: false },

  // Transportes (léxico carpeta; posiciones fuera del grid principal)
  { label: 'Vehículo', emoji: '🚙', category: 'Transportes', posType: 'noun', positionX: 0, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Coche', emoji: '🚗', category: 'Transportes', posType: 'noun', positionX: 1, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Bici', emoji: '🚲', category: 'Transportes', posType: 'noun', positionX: 2, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Moto', emoji: '🏍️', category: 'Transportes', posType: 'noun', positionX: 3, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Taxi', emoji: '🚕', category: 'Transportes', posType: 'noun', positionX: 4, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Autobús', emoji: '🚌', category: 'Transportes', posType: 'noun', positionX: 5, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Tranvía', emoji: '🚊', category: 'Transportes', posType: 'noun', positionX: 6, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Patinete', emoji: '🛴', category: 'Transportes', posType: 'noun', positionX: 7, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Skate', emoji: '🛹', category: 'Transportes', posType: 'noun', positionX: 8, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Tren', emoji: '🚆', category: 'Transportes', posType: 'noun', positionX: 9, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Furgoneta', emoji: '🚐', category: 'Transportes', posType: 'noun', positionX: 10, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Metro', emoji: '🚇', category: 'Transportes', posType: 'noun', positionX: 11, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Camión', emoji: '🚚', category: 'Transportes', posType: 'noun', positionX: 12, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Tractor', emoji: '🚜', category: 'Transportes', posType: 'noun', positionX: 13, positionY: 28, color: 'preset:yellow', hidden: false },
  { label: 'Silla de ruedas con motor', emoji: '🦼', category: 'Transportes', posType: 'noun', positionX: 0, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Silla de ruedas', emoji: '🦽', category: 'Transportes', posType: 'noun', positionX: 1, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Helicóptero', emoji: '🚁', category: 'Transportes', posType: 'noun', positionX: 2, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Barco', emoji: '🚢', category: 'Transportes', posType: 'noun', positionX: 3, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Caravana', emoji: '🚙', category: 'Transportes', posType: 'noun', positionX: 4, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Avión', emoji: '✈️', category: 'Transportes', posType: 'noun', positionX: 5, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Rueda', emoji: '🛞', category: 'Transportes', posType: 'noun', positionX: 6, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Volante', emoji: '⭕', category: 'Transportes', posType: 'noun', positionX: 7, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Claxon', emoji: '🔊', category: 'Transportes', posType: 'noun', positionX: 8, positionY: 29, color: 'preset:yellow', hidden: false },
  { label: 'Limpiaparabrisas', emoji: '🪟', category: 'Transportes', posType: 'noun', positionX: 9, positionY: 29, color: 'preset:yellow', hidden: false },

  // Alimentos (léxico carpeta; posiciones fuera del grid principal). Pasta, Pollo y «Más» ya están arriba.
  { label: 'Desayuno', emoji: '🍳', category: 'Alimentos', posType: 'noun', positionX: 0, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Almuerzo', emoji: '🍽️', category: 'Alimentos', posType: 'noun', positionX: 1, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Aperitivo', emoji: '🫒', category: 'Alimentos', posType: 'noun', positionX: 2, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Comida', emoji: '🍽️', category: 'Alimentos', posType: 'noun', positionX: 3, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Merienda', emoji: '🍪', category: 'Alimentos', posType: 'noun', positionX: 4, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Cena', emoji: '🌙', category: 'Alimentos', posType: 'noun', positionX: 5, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Primer plato', emoji: '🥘', category: 'Alimentos', posType: 'noun', positionX: 6, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Segundo plato', emoji: '🍖', category: 'Alimentos', posType: 'noun', positionX: 7, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Postre', emoji: '🍰', category: 'Alimentos', posType: 'noun', positionX: 8, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Menú', emoji: '📋', category: 'Alimentos', posType: 'noun', positionX: 9, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Frutas', emoji: '🍎', category: 'Alimentos', posType: 'noun', positionX: 10, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Dulces', emoji: '🍬', category: 'Alimentos', posType: 'noun', positionX: 11, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Lácteos', emoji: '🥛', category: 'Alimentos', posType: 'noun', positionX: 12, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Verduras', emoji: '🥬', category: 'Alimentos', posType: 'noun', positionX: 13, positionY: 30, color: 'preset:cyan', hidden: false },
  { label: 'Lechuga', emoji: '🥬', category: 'Alimentos', posType: 'noun', positionX: 0, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Acelga', emoji: '🥬', category: 'Alimentos', posType: 'noun', positionX: 1, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Judías', emoji: '🫘', category: 'Alimentos', posType: 'noun', positionX: 2, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Borraja', emoji: '🌿', category: 'Alimentos', posType: 'noun', positionX: 3, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Espinacas', emoji: '🥬', category: 'Alimentos', posType: 'noun', positionX: 4, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Brócoli', emoji: '🥦', category: 'Alimentos', posType: 'noun', positionX: 5, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Menestra', emoji: '🍲', category: 'Alimentos', posType: 'noun', positionX: 6, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Legumbres', emoji: '🫘', category: 'Alimentos', posType: 'noun', positionX: 7, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Sopa', emoji: '🍲', category: 'Alimentos', posType: 'noun', positionX: 8, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Puré', emoji: '🥔', category: 'Alimentos', posType: 'noun', positionX: 9, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Arroz', emoji: '🍚', category: 'Alimentos', posType: 'noun', positionX: 10, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Paella', emoji: '🥘', category: 'Alimentos', posType: 'noun', positionX: 11, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Lentejas', emoji: '🍲', category: 'Alimentos', posType: 'noun', positionX: 12, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Garbanzos', emoji: '🫘', category: 'Alimentos', posType: 'noun', positionX: 13, positionY: 31, color: 'preset:cyan', hidden: false },
  { label: 'Ensaladilla rusa', emoji: '🥗', category: 'Alimentos', posType: 'noun', positionX: 0, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Guisantes', emoji: '🫛', category: 'Alimentos', posType: 'noun', positionX: 1, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Macarrones', emoji: '🍝', category: 'Alimentos', posType: 'noun', positionX: 2, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Espagueti', emoji: '🍝', category: 'Alimentos', posType: 'noun', positionX: 3, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Ensalada', emoji: '🥗', category: 'Alimentos', posType: 'noun', positionX: 4, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Carne', emoji: '🥩', category: 'Alimentos', posType: 'noun', positionX: 5, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Pescado', emoji: '🐟', category: 'Alimentos', posType: 'noun', positionX: 6, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Albóndigas', emoji: '🍖', category: 'Alimentos', posType: 'noun', positionX: 7, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Carne guisada', emoji: '🥘', category: 'Alimentos', posType: 'noun', positionX: 8, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Huevos', emoji: '🥚', category: 'Alimentos', posType: 'noun', positionX: 9, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Tortilla', emoji: '🍳', category: 'Alimentos', posType: 'noun', positionX: 10, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Huevo frito', emoji: '🍳', category: 'Alimentos', posType: 'noun', positionX: 11, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Huevo duro', emoji: '🥚', category: 'Alimentos', posType: 'noun', positionX: 12, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Patatas', emoji: '🥔', category: 'Alimentos', posType: 'noun', positionX: 13, positionY: 32, color: 'preset:cyan', hidden: false },
  { label: 'Patatas fritas', emoji: '🍟', category: 'Alimentos', posType: 'noun', positionX: 0, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Lasaña', emoji: '🍝', category: 'Alimentos', posType: 'noun', positionX: 1, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Canelones', emoji: '🍝', category: 'Alimentos', posType: 'noun', positionX: 2, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Pescado rebozado', emoji: '🐟', category: 'Alimentos', posType: 'noun', positionX: 3, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Pescado en salsa', emoji: '🐟', category: 'Alimentos', posType: 'noun', positionX: 4, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Baritas de pescado', emoji: '🍤', category: 'Alimentos', posType: 'noun', positionX: 5, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Salchichas', emoji: '🌭', category: 'Alimentos', posType: 'noun', positionX: 6, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Croquetas', emoji: '🧆', category: 'Alimentos', posType: 'noun', positionX: 7, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Pizza', emoji: '🍕', category: 'Alimentos', posType: 'noun', positionX: 8, positionY: 33, color: 'preset:cyan', hidden: false },
  { label: 'Hamburguesa', emoji: '🍔', category: 'Alimentos', posType: 'noun', positionX: 9, positionY: 33, color: 'preset:cyan', hidden: false },

  // Cuerpo (léxico carpeta; posiciones fuera del grid principal)
  { label: 'Cuerpo', emoji: '🧍', category: 'Cuerpo', posType: 'noun', positionX: 0, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Cabeza', emoji: '👤', category: 'Cuerpo', posType: 'noun', positionX: 1, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Cara', emoji: '😊', category: 'Cuerpo', posType: 'noun', positionX: 2, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Ojos', emoji: '👀', category: 'Cuerpo', posType: 'noun', positionX: 3, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Nariz', emoji: '👃', category: 'Cuerpo', posType: 'noun', positionX: 4, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Oreja', emoji: '👂', category: 'Cuerpo', posType: 'noun', positionX: 5, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Boca', emoji: '👄', category: 'Cuerpo', posType: 'noun', positionX: 6, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Dientes', emoji: '🦷', category: 'Cuerpo', posType: 'noun', positionX: 7, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Lengua', emoji: '👅', category: 'Cuerpo', posType: 'noun', positionX: 8, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Pelo', emoji: '💇', category: 'Cuerpo', posType: 'noun', positionX: 9, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Cuello', emoji: '👔', category: 'Cuerpo', posType: 'noun', positionX: 10, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Pecho', emoji: '🫀', category: 'Cuerpo', posType: 'noun', positionX: 11, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Espalda', emoji: '🩻', category: 'Cuerpo', posType: 'noun', positionX: 12, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Barriga', emoji: '🫃', category: 'Cuerpo', posType: 'noun', positionX: 13, positionY: 34, color: 'preset:rose', hidden: false },
  { label: 'Cadera', emoji: '👖', category: 'Cuerpo', posType: 'noun', positionX: 0, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Brazo', emoji: '💪', category: 'Cuerpo', posType: 'noun', positionX: 1, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Codo', emoji: '🦴', category: 'Cuerpo', posType: 'noun', positionX: 2, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Mano', emoji: '✋', category: 'Cuerpo', posType: 'noun', positionX: 3, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Dedo', emoji: '☝️', category: 'Cuerpo', posType: 'noun', positionX: 4, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Uña', emoji: '💅', category: 'Cuerpo', posType: 'noun', positionX: 5, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Pierna', emoji: '🦵', category: 'Cuerpo', posType: 'noun', positionX: 6, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Rodilla', emoji: '🦵', category: 'Cuerpo', posType: 'noun', positionX: 7, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Muñeca', emoji: '⌚', category: 'Cuerpo', posType: 'noun', positionX: 8, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Pie', emoji: '🦶', category: 'Cuerpo', posType: 'noun', positionX: 9, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Tobillo', emoji: '🦶', category: 'Cuerpo', posType: 'noun', positionX: 10, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Huesos', emoji: '🦴', category: 'Cuerpo', posType: 'noun', positionX: 11, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Piel', emoji: '🧴', category: 'Cuerpo', posType: 'noun', positionX: 12, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Hombro', emoji: '🤷', category: 'Cuerpo', posType: 'noun', positionX: 13, positionY: 35, color: 'preset:rose', hidden: false },
  { label: 'Cejas', emoji: '🤨', category: 'Cuerpo', posType: 'noun', positionX: 0, positionY: 36, color: 'preset:rose', hidden: false },
  { label: 'Pestañas', emoji: '💄', category: 'Cuerpo', posType: 'noun', positionX: 1, positionY: 36, color: 'preset:rose', hidden: false },

  // Colores (léxico carpeta; círculos 🟠🔴… donde hay emoji; tonos sin círculo: 🩵 celeste, 🩷 rosa, 🩶 gris…)
  { label: 'Colores', emoji: '🎨', category: 'Colores', posType: 'noun', positionX: 2, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Rojo', emoji: '🔴', category: 'Colores', posType: 'noun', positionX: 3, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Azul', emoji: '🔵', category: 'Colores', posType: 'noun', positionX: 4, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Celeste', emoji: '🩵', category: 'Colores', posType: 'noun', positionX: 5, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Verde', emoji: '🟢', category: 'Colores', posType: 'noun', positionX: 6, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Amarillo', emoji: '🟡', category: 'Colores', posType: 'noun', positionX: 7, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Naranja', emoji: '🟠', category: 'Colores', posType: 'noun', positionX: 8, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Rosa', emoji: '🩷', category: 'Colores', posType: 'noun', positionX: 9, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Negro', emoji: '⚫', category: 'Colores', posType: 'noun', positionX: 10, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Blanco', emoji: '⚪', category: 'Colores', posType: 'noun', positionX: 11, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Morado', emoji: '🟣', category: 'Colores', posType: 'noun', positionX: 12, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Lila', emoji: '🟪', category: 'Colores', posType: 'noun', positionX: 13, positionY: 36, color: 'preset:pink', hidden: false },
  { label: 'Marrón', emoji: '🟤', category: 'Colores', posType: 'noun', positionX: 0, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Granate', emoji: '🟥', category: 'Colores', posType: 'noun', positionX: 1, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Gris', emoji: '🔘', category: 'Colores', posType: 'noun', positionX: 2, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Dorado', emoji: '🥇', category: 'Colores', posType: 'noun', positionX: 3, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Beige', emoji: '🟫', category: 'Colores', posType: 'noun', positionX: 4, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Plateado', emoji: '🥈', category: 'Colores', posType: 'noun', positionX: 5, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Mostaza', emoji: '🍯', category: 'Colores', posType: 'noun', positionX: 6, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Rayas', emoji: '🦓', category: 'Colores', posType: 'noun', positionX: 7, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Topos', emoji: '🍪', category: 'Colores', posType: 'noun', positionX: 8, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Cuadros', emoji: '🏁', category: 'Colores', posType: 'noun', positionX: 9, positionY: 37, color: 'preset:pink', hidden: false },
  { label: 'Floreado', emoji: '🌸', category: 'Colores', posType: 'noun', positionX: 10, positionY: 37, color: 'preset:pink', hidden: false },

  // Sentimientos (carpeta) — solo formas base (masculino); la femenina se auto-conjuga en AppInterface
  { label: 'Estoy bien', emoji: '😊', category: 'Sentimientos', posType: 'adj', positionX: 0, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estoy mal', emoji: '😔', category: 'Sentimientos', posType: 'adj', positionX: 1, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estoy regular', emoji: '😐', category: 'Sentimientos', posType: 'adj', positionX: 2, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Alegre', emoji: '😄', category: 'Sentimientos', posType: 'adj', positionX: 3, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Confundido', emoji: '😕', category: 'Sentimientos', posType: 'adj', positionX: 4, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Enfermo', emoji: '🤒', category: 'Sentimientos', posType: 'adj', positionX: 5, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Nervioso', emoji: '😰', category: 'Sentimientos', posType: 'adj', positionX: 6, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sueño', emoji: '😴', category: 'Sentimientos', posType: 'noun', positionX: 7, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Frío', emoji: '🥶', category: 'Sentimientos', posType: 'noun', positionX: 8, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Distraído', emoji: '🙃', category: 'Sentimientos', posType: 'adj', positionX: 9, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Enamorado', emoji: '😍', category: 'Sentimientos', posType: 'adj', positionX: 10, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Hambre', emoji: '😋', category: 'Sentimientos', posType: 'noun', positionX: 11, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sed', emoji: '🥤', category: 'Sentimientos', posType: 'noun', positionX: 12, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Preocupado', emoji: '😟', category: 'Sentimientos', posType: 'adj', positionX: 13, positionY: 38, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Picor', emoji: '🤧', category: 'Sentimientos', posType: 'noun', positionX: 0, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Temblor', emoji: '😬', category: 'Sentimientos', posType: 'noun', positionX: 1, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sorprendido', emoji: '😲', category: 'Sentimientos', posType: 'adj', positionX: 2, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Asqueado', emoji: '🤢', category: 'Sentimientos', posType: 'adj', positionX: 3, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Desanimado', emoji: '😞', category: 'Sentimientos', posType: 'adj', positionX: 4, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mareado', emoji: '🥴', category: 'Sentimientos', posType: 'adj', positionX: 5, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Incómodo', emoji: '😣', category: 'Sentimientos', posType: 'adj', positionX: 6, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Paciencia', emoji: '🙏', category: 'Sentimientos', posType: 'noun', positionX: 7, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Calor', emoji: '🥵', category: 'Sentimientos', posType: 'noun', positionX: 8, positionY: 39, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Bebidas (carpeta)
  { label: 'Refresco', emoji: '🥤', category: 'Bebidas', posType: 'noun', positionX: 0, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Coca cola', emoji: '🥤', category: 'Bebidas', posType: 'noun', positionX: 1, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Limonada', emoji: '🍋', category: 'Bebidas', posType: 'noun', positionX: 2, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Naranjada', emoji: '🍊', category: 'Bebidas', posType: 'noun', positionX: 3, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cola cao', emoji: '☕', category: 'Bebidas', posType: 'noun', positionX: 4, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Café', emoji: '☕', category: 'Bebidas', posType: 'noun', positionX: 5, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Infusión', emoji: '🫖', category: 'Bebidas', posType: 'noun', positionX: 6, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Chocolate', emoji: '🍫', category: 'Bebidas', posType: 'noun', positionX: 7, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bebida isotónica', emoji: '💧', category: 'Bebidas', posType: 'noun', positionX: 8, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Yogur', emoji: '🥛', category: 'Bebidas', posType: 'noun', positionX: 9, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Yogur bebible', emoji: '🥛', category: 'Bebidas', posType: 'noun', positionX: 10, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Batido', emoji: '🥤', category: 'Bebidas', posType: 'noun', positionX: 11, positionY: 41, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Muebles (carpeta)
  { label: 'Muebles', emoji: '🛋️', category: 'Muebles', posType: 'noun', positionX: 0, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Silla', emoji: '🪑', category: 'Muebles', posType: 'noun', positionX: 1, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Armario', emoji: '🗄️', category: 'Muebles', posType: 'noun', positionX: 2, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sofá', emoji: '🛋️', category: 'Muebles', posType: 'noun', positionX: 3, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lámpara', emoji: '💡', category: 'Muebles', posType: 'noun', positionX: 4, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ventana', emoji: '🪟', category: 'Muebles', posType: 'noun', positionX: 5, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Puerta', emoji: '🚪', category: 'Muebles', posType: 'noun', positionX: 6, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estantería', emoji: '📚', category: 'Muebles', posType: 'noun', positionX: 7, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Taburete', emoji: '🪑', category: 'Muebles', posType: 'noun', positionX: 8, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sillón', emoji: '🛋️', category: 'Muebles', posType: 'noun', positionX: 9, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Escritorio', emoji: '🖥️', category: 'Muebles', posType: 'noun', positionX: 10, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estante', emoji: '📚', category: 'Muebles', posType: 'noun', positionX: 11, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Perchero', emoji: '🪝', category: 'Muebles', posType: 'noun', positionX: 12, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cómoda', emoji: '🗄️', category: 'Muebles', posType: 'noun', positionX: 13, positionY: 42, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cajón', emoji: '📦', category: 'Muebles', posType: 'noun', positionX: 0, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cuna', emoji: '👶', category: 'Muebles', posType: 'noun', positionX: 1, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Percha', emoji: '🪝', category: 'Muebles', posType: 'noun', positionX: 2, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mantel', emoji: '🍽️', category: 'Muebles', posType: 'noun', positionX: 3, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Espejo', emoji: '🪞', category: 'Muebles', posType: 'noun', positionX: 4, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Vaso', emoji: '🥛', category: 'Muebles', posType: 'noun', positionX: 5, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Plato', emoji: '🍽️', category: 'Muebles', posType: 'noun', positionX: 6, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Taza', emoji: '☕', category: 'Muebles', posType: 'noun', positionX: 7, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Servilleta', emoji: '🧻', category: 'Muebles', posType: 'noun', positionX: 8, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cubiertos', emoji: '🍴', category: 'Muebles', posType: 'noun', positionX: 9, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cuchara', emoji: '🥄', category: 'Muebles', posType: 'noun', positionX: 10, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tenedor', emoji: '🍴', category: 'Muebles', posType: 'noun', positionX: 11, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cuchillo', emoji: '🔪', category: 'Muebles', posType: 'noun', positionX: 12, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Jarra', emoji: '🫙', category: 'Muebles', posType: 'noun', positionX: 13, positionY: 43, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Escoba', emoji: '🧹', category: 'Muebles', posType: 'noun', positionX: 0, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Luz', emoji: '💡', category: 'Muebles', posType: 'noun', positionX: 1, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Complementos (carpeta)
  { label: 'Cinturón', emoji: '🔗', category: 'Complementos', posType: 'noun', positionX: 2, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tirantes', emoji: '👔', category: 'Complementos', posType: 'noun', positionX: 3, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pañuelo', emoji: '🧣', category: 'Complementos', posType: 'noun', positionX: 4, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mochila', emoji: '🎒', category: 'Complementos', posType: 'noun', positionX: 5, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Collar', emoji: '📿', category: 'Complementos', posType: 'noun', positionX: 6, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Monedero', emoji: '👛', category: 'Complementos', posType: 'noun', positionX: 7, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pulsera', emoji: '💍', category: 'Complementos', posType: 'noun', positionX: 8, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pendientes', emoji: '💎', category: 'Complementos', posType: 'noun', positionX: 9, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Reloj', emoji: '⌚', category: 'Complementos', posType: 'noun', positionX: 10, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bolso', emoji: '👜', category: 'Complementos', posType: 'noun', positionX: 11, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bolsa deporte', emoji: '🎒', category: 'Complementos', posType: 'noun', positionX: 12, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Paraguas', emoji: '☂️', category: 'Complementos', posType: 'noun', positionX: 13, positionY: 44, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cartera', emoji: '👛', category: 'Complementos', posType: 'noun', positionX: 0, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bolso de mano', emoji: '👜', category: 'Complementos', posType: 'noun', positionX: 1, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Anillo', emoji: '💍', category: 'Complementos', posType: 'noun', positionX: 2, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Lugares (carpeta)
  { label: 'Lugar', emoji: '📍', category: 'Lugares', posType: 'noun', positionX: 3, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Calle', emoji: '🛣️', category: 'Lugares', posType: 'noun', positionX: 4, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Plaza', emoji: '🏛️', category: 'Lugares', posType: 'noun', positionX: 5, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Taller', emoji: '🔧', category: 'Lugares', posType: 'noun', positionX: 6, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Residencia', emoji: '🏘️', category: 'Lugares', posType: 'noun', positionX: 7, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Panadería', emoji: '🍞', category: 'Lugares', posType: 'noun', positionX: 8, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bar', emoji: '🍺', category: 'Lugares', posType: 'noun', positionX: 9, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mercado', emoji: '🛒', category: 'Lugares', posType: 'noun', positionX: 10, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Farmacia', emoji: '💊', category: 'Lugares', posType: 'noun', positionX: 11, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Gasolinera', emoji: '⛽', category: 'Lugares', posType: 'noun', positionX: 12, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Restaurante', emoji: '🍽️', category: 'Lugares', posType: 'noun', positionX: 13, positionY: 45, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Biblioteca', emoji: '📚', category: 'Lugares', posType: 'noun', positionX: 0, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Museo', emoji: '🏛️', category: 'Lugares', posType: 'noun', positionX: 1, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cine', emoji: '🎬', category: 'Lugares', posType: 'noun', positionX: 2, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Circo', emoji: '🎪', category: 'Lugares', posType: 'noun', positionX: 3, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Teatro', emoji: '🎭', category: 'Lugares', posType: 'noun', positionX: 4, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Zoo', emoji: '🦁', category: 'Lugares', posType: 'noun', positionX: 5, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pueblo', emoji: '🏘️', category: 'Lugares', posType: 'noun', positionX: 6, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ciudad', emoji: '🌆', category: 'Lugares', posType: 'noun', positionX: 7, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Hospital', emoji: '🏥', category: 'Lugares', posType: 'noun', positionX: 8, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Hotel', emoji: '🏨', category: 'Lugares', posType: 'noun', positionX: 9, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estación', emoji: '🚉', category: 'Lugares', posType: 'noun', positionX: 10, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Aeropuerto', emoji: '✈️', category: 'Lugares', posType: 'noun', positionX: 11, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Iglesia', emoji: '⛪', category: 'Lugares', posType: 'noun', positionX: 12, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Correos', emoji: '📮', category: 'Lugares', posType: 'noun', positionX: 13, positionY: 46, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Comisaría', emoji: '👮', category: 'Lugares', posType: 'noun', positionX: 0, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Parking', emoji: '🅿️', category: 'Lugares', posType: 'noun', positionX: 1, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Playa', emoji: '🏖️', category: 'Lugares', posType: 'noun', positionX: 2, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mar', emoji: '🌊', category: 'Lugares', posType: 'noun', positionX: 3, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Piscina', emoji: '🏊', category: 'Lugares', posType: 'noun', positionX: 4, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Campo', emoji: '🌾', category: 'Lugares', posType: 'noun', positionX: 5, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Montaña', emoji: '🏔️', category: 'Lugares', posType: 'noun', positionX: 6, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Camping', emoji: '🏕️', category: 'Lugares', posType: 'noun', positionX: 7, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Granja', emoji: '🐄', category: 'Lugares', posType: 'noun', positionX: 8, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bosque', emoji: '🌲', category: 'Lugares', posType: 'noun', positionX: 9, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Huerto', emoji: '🥦', category: 'Lugares', posType: 'noun', positionX: 10, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Puente', emoji: '🌉', category: 'Lugares', posType: 'noun', positionX: 11, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Río', emoji: '🏞️', category: 'Lugares', posType: 'noun', positionX: 12, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Europa', emoji: '🌍', category: 'Lugares', posType: 'noun', positionX: 13, positionY: 47, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Asia', emoji: '🌏', category: 'Lugares', posType: 'noun', positionX: 0, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Oceanía', emoji: '🏝️', category: 'Lugares', posType: 'noun', positionX: 1, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'América', emoji: '🌎', category: 'Lugares', posType: 'noun', positionX: 2, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'África', emoji: '🦁', category: 'Lugares', posType: 'noun', positionX: 3, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Aparatos (carpeta)
  { label: 'Aparatos', emoji: '📱', category: 'Aparatos', posType: 'noun', positionX: 4, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Móvil', emoji: '📱', category: 'Aparatos', posType: 'noun', positionX: 5, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tablet', emoji: '📱', category: 'Aparatos', posType: 'noun', positionX: 6, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ordenador', emoji: '🖥️', category: 'Aparatos', posType: 'noun', positionX: 7, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Portátil', emoji: '💻', category: 'Aparatos', posType: 'noun', positionX: 8, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Radio', emoji: '📻', category: 'Aparatos', posType: 'noun', positionX: 9, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pulsador', emoji: '🔘', category: 'Aparatos', posType: 'noun', positionX: 10, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Comunicador', emoji: '📟', category: 'Aparatos', posType: 'noun', positionX: 11, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tele', emoji: '📺', category: 'Aparatos', posType: 'noun', positionX: 12, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mando a distancia', emoji: '🎮', category: 'Aparatos', posType: 'noun', positionX: 13, positionY: 48, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Impresora', emoji: '🖨️', category: 'Aparatos', posType: 'noun', positionX: 0, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Internet', emoji: '🌐', category: 'Aparatos', posType: 'noun', positionX: 1, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Timbre', emoji: '🔔', category: 'Aparatos', posType: 'noun', positionX: 2, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cámara', emoji: '📷', category: 'Aparatos', posType: 'noun', positionX: 3, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Actividades (carpeta)
  { label: 'Cuentos', emoji: '📖', category: 'Actividades', posType: 'noun', positionX: 4, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Música', emoji: '🎵', category: 'Actividades', posType: 'noun', positionX: 5, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sala snoezelen', emoji: '💫', category: 'Actividades', posType: 'noun', positionX: 6, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Manualidades', emoji: '✂️', category: 'Actividades', posType: 'noun', positionX: 7, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Relajación', emoji: '🧘', category: 'Actividades', posType: 'noun', positionX: 8, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pasear', emoji: '🚶', category: 'Actividades', posType: 'verb', positionX: 9, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Descansar', emoji: '💤', category: 'Actividades', posType: 'verb', positionX: 10, positionY: 49, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Descripción (carpeta) — speech bubbles
  { label: 'Fuerte', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 0, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Débil', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 1, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Guapo', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 2, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Limpio', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 3, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Guapa', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 4, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Limpia', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 5, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Salado', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 6, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rugoso', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 7, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Liso', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 8, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Salada', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 9, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rugosa', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 10, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lisa', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 11, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mojado', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 12, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Feo', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 13, positionY: 50, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Dulce', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 0, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mojada', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 1, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Fea', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 2, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sucia', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 3, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rápido', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 4, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Claro', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 5, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rápida', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 6, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Clara', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 7, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Seco', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 8, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lento', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 9, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Oscuro', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 10, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Seca', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 11, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lenta', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 12, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Oscura', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 13, positionY: 51, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Duro', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 0, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Delgado', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 1, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Roto', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 2, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Dura', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 3, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rota', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 4, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Blando', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 5, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Gordo', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 6, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Raro', emoji: '💭', category: 'Descripción', posType: 'adj', positionX: 7, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Blanda', emoji: '💬', category: 'Descripción', posType: 'adj', positionX: 8, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Gorda', emoji: '🗨️', category: 'Descripción', posType: 'adj', positionX: 9, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rara', emoji: '🗯️', category: 'Descripción', posType: 'adj', positionX: 10, positionY: 52, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Formas y medidas (carpeta)
  { label: 'Forma', emoji: '🔷', category: 'Formas y medidas', posType: 'noun', positionX: 0, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rombo', emoji: '🔷', category: 'Formas y medidas', posType: 'noun', positionX: 1, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Círculo', emoji: '⭕', category: 'Formas y medidas', posType: 'noun', positionX: 2, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rectángulo', emoji: '🟦', category: 'Formas y medidas', posType: 'noun', positionX: 3, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estrella', emoji: '⭐', category: 'Formas y medidas', posType: 'noun', positionX: 4, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cuadrado', emoji: '🟦', category: 'Formas y medidas', posType: 'noun', positionX: 5, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Triángulo', emoji: '🔺', category: 'Formas y medidas', posType: 'noun', positionX: 6, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Corazón', emoji: '❤️', category: 'Formas y medidas', posType: 'noun', positionX: 7, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Medida', emoji: '📏', category: 'Formas y medidas', posType: 'noun', positionX: 8, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Nada', emoji: '🚫', category: 'Formas y medidas', posType: 'adverb', positionX: 9, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Alto', emoji: '⬆️', category: 'Formas y medidas', posType: 'adj', positionX: 10, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bajo', emoji: '⬇️', category: 'Formas y medidas', posType: 'adj', positionX: 11, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Menos', emoji: '➖', category: 'Formas y medidas', posType: 'adverb', positionX: 12, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Largo', emoji: '↔️', category: 'Formas y medidas', posType: 'adj', positionX: 13, positionY: 53, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Corto', emoji: '↕️', category: 'Formas y medidas', posType: 'adj', positionX: 0, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Conceptos (carpeta)
  { label: 'Algunos', emoji: '👆', category: 'Conceptos', posType: 'other', positionX: 1, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Poco', emoji: '🤏', category: 'Conceptos', posType: 'other', positionX: 2, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ninguno', emoji: '🚫', category: 'Conceptos', posType: 'other', positionX: 3, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Último', emoji: '🏁', category: 'Conceptos', posType: 'other', positionX: 4, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Fila', emoji: '📋', category: 'Conceptos', posType: 'noun', positionX: 5, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Primero', emoji: '🥇', category: 'Conceptos', posType: 'other', positionX: 6, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Dentro', emoji: '📥', category: 'Conceptos', posType: 'adverb', positionX: 7, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Todos', emoji: '👥', category: 'Conceptos', posType: 'other', positionX: 8, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lejos', emoji: '🔭', category: 'Conceptos', posType: 'adverb', positionX: 9, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lleno', emoji: '🔴', category: 'Conceptos', posType: 'adj', positionX: 10, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cerca', emoji: '📍', category: 'Conceptos', posType: 'adverb', positionX: 11, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Vacío', emoji: '⭕', category: 'Conceptos', posType: 'adj', positionX: 12, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Grande', emoji: '🔵', category: 'Conceptos', posType: 'adj', positionX: 13, positionY: 54, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Izquierda', emoji: '⬅️', category: 'Conceptos', posType: 'adverb', positionX: 0, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pequeño', emoji: '🔸', category: 'Conceptos', posType: 'adj', positionX: 1, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Delante', emoji: '⏩', category: 'Conceptos', posType: 'adverb', positionX: 2, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Debajo', emoji: '⬇️', category: 'Conceptos', posType: 'adverb', positionX: 3, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Fuera', emoji: '📤', category: 'Conceptos', posType: 'adverb', positionX: 4, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Derecha', emoji: '➡️', category: 'Conceptos', posType: 'adverb', positionX: 5, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Encima', emoji: '⬆️', category: 'Conceptos', posType: 'adverb', positionX: 6, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Detrás', emoji: '⏪', category: 'Conceptos', posType: 'adverb', positionX: 7, positionY: 55, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Tiempo (carpeta)
  { label: 'Tiempo', emoji: '🕒', category: 'Tiempo', posType: 'noun', positionX: 0, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Día', emoji: '🌞', category: 'Tiempo', posType: 'noun', positionX: 1, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Semana', emoji: '📅', category: 'Tiempo', posType: 'noun', positionX: 2, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mes', emoji: '🗓️', category: 'Tiempo', posType: 'noun', positionX: 3, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Año', emoji: '🎉', category: 'Tiempo', posType: 'noun', positionX: 4, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Hora', emoji: '🕐', category: 'Tiempo', posType: 'noun', positionX: 5, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Minuto', emoji: '⏱️', category: 'Tiempo', posType: 'noun', positionX: 6, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lunes', emoji: '😴', category: 'Tiempo', posType: 'noun', positionX: 7, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Martes', emoji: '💼', category: 'Tiempo', posType: 'noun', positionX: 8, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Miércoles', emoji: '📚', category: 'Tiempo', posType: 'noun', positionX: 9, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Jueves', emoji: '🏃', category: 'Tiempo', posType: 'noun', positionX: 10, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Viernes', emoji: '🎉', category: 'Tiempo', posType: 'noun', positionX: 11, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sábado', emoji: '⚽', category: 'Tiempo', posType: 'noun', positionX: 12, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Domingo', emoji: '🏠', category: 'Tiempo', posType: 'noun', positionX: 13, positionY: 56, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Enero', emoji: '❄️', category: 'Tiempo', posType: 'noun', positionX: 0, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Febrero', emoji: '❤️', category: 'Tiempo', posType: 'noun', positionX: 1, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Marzo', emoji: '🌱', category: 'Tiempo', posType: 'noun', positionX: 2, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Abril', emoji: '🌸', category: 'Tiempo', posType: 'noun', positionX: 3, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Mayo', emoji: '🌼', category: 'Tiempo', posType: 'noun', positionX: 4, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Junio', emoji: '☀️', category: 'Tiempo', posType: 'noun', positionX: 5, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Julio', emoji: '🌞', category: 'Tiempo', posType: 'noun', positionX: 6, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Agosto', emoji: '🏖️', category: 'Tiempo', posType: 'noun', positionX: 7, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Septiembre', emoji: '🍂', category: 'Tiempo', posType: 'noun', positionX: 8, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Octubre', emoji: '🎃', category: 'Tiempo', posType: 'noun', positionX: 9, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Noviembre', emoji: '🍁', category: 'Tiempo', posType: 'noun', positionX: 10, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Diciembre', emoji: '⛄', category: 'Tiempo', posType: 'noun', positionX: 11, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Amanecer', emoji: '🌅', category: 'Tiempo', posType: 'noun', positionX: 12, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tarde', emoji: '🌆', category: 'Tiempo', posType: 'noun', positionX: 13, positionY: 57, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Noche', emoji: '🌙', category: 'Tiempo', posType: 'noun', positionX: 0, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Anochecer', emoji: '🌇', category: 'Tiempo', posType: 'noun', positionX: 1, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Fin de semana', emoji: '🎊', category: 'Tiempo', posType: 'noun', positionX: 2, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tiempo atmosférico', emoji: '⛅', category: 'Tiempo', posType: 'noun', positionX: 3, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sol', emoji: '☀️', category: 'Tiempo', posType: 'noun', positionX: 4, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lluvia', emoji: '🌧️', category: 'Tiempo', posType: 'noun', positionX: 5, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Nubes', emoji: '☁️', category: 'Tiempo', posType: 'noun', positionX: 6, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Viento', emoji: '💨', category: 'Tiempo', posType: 'noun', positionX: 7, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Nieve', emoji: '❄️', category: 'Tiempo', posType: 'noun', positionX: 8, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Niebla', emoji: '🌫️', category: 'Tiempo', posType: 'noun', positionX: 9, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tormenta', emoji: '⛈️', category: 'Tiempo', posType: 'noun', positionX: 10, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Trueno', emoji: '⚡', category: 'Tiempo', posType: 'noun', positionX: 11, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Luna', emoji: '🌙', category: 'Tiempo', posType: 'noun', positionX: 12, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Relámpago', emoji: '⚡', category: 'Tiempo', posType: 'noun', positionX: 13, positionY: 58, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estrellas', emoji: '⭐', category: 'Tiempo', posType: 'noun', positionX: 0, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Casa (carpeta — subcarpeta de Lugares)
  { label: 'Dormitorio', emoji: '🛏️', category: 'Casa', posType: 'noun', positionX: 1, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cocina', emoji: '🍳', category: 'Casa', posType: 'noun', positionX: 2, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Salón', emoji: '🛋️', category: 'Casa', posType: 'noun', positionX: 3, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pasillo', emoji: '🚶', category: 'Casa', posType: 'noun', positionX: 4, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estudio', emoji: '💻', category: 'Casa', posType: 'noun', positionX: 5, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Flexo', emoji: '💡', category: 'Casa', posType: 'noun', positionX: 6, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Armario de cocina', emoji: '🗄️', category: 'Casa', posType: 'noun', positionX: 7, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Nevera', emoji: '🧊', category: 'Casa', posType: 'noun', positionX: 8, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lavadora', emoji: '🫧', category: 'Casa', posType: 'noun', positionX: 9, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lavavajillas', emoji: '🍽️', category: 'Casa', posType: 'noun', positionX: 10, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Horno', emoji: '🔥', category: 'Casa', posType: 'noun', positionX: 11, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Microondas', emoji: '🍽️', category: 'Casa', posType: 'noun', positionX: 12, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lavabo', emoji: '🚰', category: 'Casa', posType: 'noun', positionX: 13, positionY: 59, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Water', emoji: '🚽', category: 'Casa', posType: 'noun', positionX: 0, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ducha', emoji: '🚿', category: 'Casa', posType: 'noun', positionX: 1, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bañera', emoji: '🛁', category: 'Casa', posType: 'noun', positionX: 2, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ascensor', emoji: '🛗', category: 'Casa', posType: 'noun', positionX: 3, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Salida emergencia', emoji: '🚨', category: 'Casa', posType: 'noun', positionX: 4, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Puerta de entrada', emoji: '🚪', category: 'Casa', posType: 'noun', positionX: 5, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Escaleras', emoji: '🪜', category: 'Casa', posType: 'noun', positionX: 6, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rampa', emoji: '♿', category: 'Casa', posType: 'noun', positionX: 7, positionY: 60, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Colegio (carpeta — subcarpeta de Lugares)
  { label: 'Libro', emoji: '📚', category: 'Colegio', posType: 'noun', positionX: 0, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cuaderno', emoji: '📓', category: 'Colegio', posType: 'noun', positionX: 1, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lápiz', emoji: '✏️', category: 'Colegio', posType: 'noun', positionX: 2, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pinturas', emoji: '🖍️', category: 'Colegio', posType: 'noun', positionX: 3, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Bolígrafo', emoji: '🖊️', category: 'Colegio', posType: 'noun', positionX: 4, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Papel', emoji: '📄', category: 'Colegio', posType: 'noun', positionX: 5, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sacapuntas', emoji: '✏️', category: 'Colegio', posType: 'noun', positionX: 6, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pizarra', emoji: '📋', category: 'Colegio', posType: 'noun', positionX: 7, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Carpeta', emoji: '📁', category: 'Colegio', posType: 'noun', positionX: 8, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Estuche', emoji: '🖊️', category: 'Colegio', posType: 'noun', positionX: 9, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cartulinas', emoji: '📄', category: 'Colegio', posType: 'noun', positionX: 10, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pegamento', emoji: '🩹', category: 'Colegio', posType: 'noun', positionX: 11, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tijeras', emoji: '✂️', category: 'Colegio', posType: 'noun', positionX: 12, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Gomets', emoji: '🔴', category: 'Colegio', posType: 'noun', positionX: 13, positionY: 61, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Plastilina', emoji: '🟡', category: 'Colegio', posType: 'noun', positionX: 0, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pintura', emoji: '🎨', category: 'Colegio', posType: 'noun', positionX: 1, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pincel', emoji: '🖌️', category: 'Colegio', posType: 'noun', positionX: 2, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pizarra digital', emoji: '💻', category: 'Colegio', posType: 'noun', positionX: 3, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Deberes', emoji: '📝', category: 'Colegio', posType: 'noun', positionX: 4, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Punzón', emoji: '📌', category: 'Colegio', posType: 'noun', positionX: 5, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Fichas', emoji: '🗂️', category: 'Colegio', posType: 'noun', positionX: 6, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Agenda', emoji: '📅', category: 'Colegio', posType: 'noun', positionX: 7, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cuento', emoji: '📖', category: 'Colegio', posType: 'noun', positionX: 8, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Lengua', emoji: '📝', category: 'Colegio', posType: 'noun', positionX: 9, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Matemáticas', emoji: '➕', category: 'Colegio', posType: 'noun', positionX: 10, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Naturales', emoji: '🌿', category: 'Colegio', posType: 'noun', positionX: 11, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sociales', emoji: '🌍', category: 'Colegio', posType: 'noun', positionX: 12, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Educación física', emoji: '🏃', category: 'Colegio', posType: 'noun', positionX: 13, positionY: 62, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Logopedia', emoji: '🗣️', category: 'Colegio', posType: 'noun', positionX: 0, positionY: 63, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Fisioterapia', emoji: '💪', category: 'Colegio', posType: 'noun', positionX: 1, positionY: 63, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Talleres', emoji: '🔧', category: 'Colegio', posType: 'noun', positionX: 2, positionY: 63, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Recreo', emoji: '⚽', category: 'Colegio', posType: 'noun', positionX: 3, positionY: 63, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Aula', emoji: '🏫', category: 'Colegio', posType: 'noun', positionX: 4, positionY: 63, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Gimnasio', emoji: '🏋️', category: 'Colegio', posType: 'noun', positionX: 5, positionY: 63, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Comedor', emoji: '🍽️', category: 'Colegio', posType: 'noun', positionX: 6, positionY: 63, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Juegos (carpeta)
  { label: 'Pelota', emoji: '⚽', category: 'Juegos', posType: 'noun', positionX: 0, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Muñeca', emoji: '🪆', category: 'Juegos', posType: 'noun', positionX: 1, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Piezas', emoji: '🧩', category: 'Juegos', posType: 'noun', positionX: 2, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cocinita', emoji: '👩‍🍳', category: 'Juegos', posType: 'noun', positionX: 3, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Construcciones', emoji: '🏗️', category: 'Juegos', posType: 'noun', positionX: 4, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cromos', emoji: '🃏', category: 'Juegos', posType: 'noun', positionX: 5, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pompas', emoji: '🫧', category: 'Juegos', posType: 'noun', positionX: 6, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Puzzle', emoji: '🧩', category: 'Juegos', posType: 'noun', positionX: 7, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Globos', emoji: '🎈', category: 'Juegos', posType: 'noun', positionX: 8, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Veo, veo', emoji: '👀', category: 'Juegos', posType: 'noun', positionX: 9, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Aro', emoji: '⭕', category: 'Juegos', posType: 'noun', positionX: 10, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Canicas', emoji: '🔵', category: 'Juegos', posType: 'noun', positionX: 11, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Marionetas', emoji: '🎭', category: 'Juegos', posType: 'noun', positionX: 12, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Columpios', emoji: '🛝', category: 'Juegos', posType: 'noun', positionX: 13, positionY: 64, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pala', emoji: '🪣', category: 'Juegos', posType: 'noun', positionX: 0, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tobogán', emoji: '🛝', category: 'Juegos', posType: 'noun', positionX: 1, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cubo', emoji: '🪣', category: 'Juegos', posType: 'noun', positionX: 2, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Juegos de mesa', emoji: '♟️', category: 'Juegos', posType: 'noun', positionX: 3, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Parchís', emoji: '🎲', category: 'Juegos', posType: 'noun', positionX: 4, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Oca', emoji: '🎲', category: 'Juegos', posType: 'noun', positionX: 5, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Damas', emoji: '♟️', category: 'Juegos', posType: 'noun', positionX: 6, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Dado', emoji: '🎲', category: 'Juegos', posType: 'noun', positionX: 7, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ajedrez', emoji: '♟️', category: 'Juegos', posType: 'noun', positionX: 8, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cartas', emoji: '🃏', category: 'Juegos', posType: 'noun', positionX: 9, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Deportes', emoji: '🏅', category: 'Juegos', posType: 'noun', positionX: 10, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Basket', emoji: '🏀', category: 'Juegos', posType: 'noun', positionX: 11, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Fútbol', emoji: '⚽', category: 'Juegos', posType: 'noun', positionX: 12, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Slalom', emoji: '⛷️', category: 'Juegos', posType: 'noun', positionX: 13, positionY: 65, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Natación', emoji: '🏊', category: 'Juegos', posType: 'noun', positionX: 0, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Fiesta (carpeta)
  { label: 'Fiestas', emoji: '🎉', category: 'Fiesta', posType: 'noun', positionX: 1, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Vacaciones', emoji: '🏖️', category: 'Fiesta', posType: 'noun', positionX: 2, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cumpleaños', emoji: '🎂', category: 'Fiesta', posType: 'noun', positionX: 3, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Navidad', emoji: '🎄', category: 'Fiesta', posType: 'noun', positionX: 4, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Nochevieja', emoji: '🥂', category: 'Fiesta', posType: 'noun', positionX: 5, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Papá Noel', emoji: '🎅', category: 'Fiesta', posType: 'noun', positionX: 6, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Reyes Magos', emoji: '🤴', category: 'Fiesta', posType: 'noun', positionX: 7, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Halloween', emoji: '🎃', category: 'Fiesta', posType: 'noun', positionX: 8, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Carnaval', emoji: '🎭', category: 'Fiesta', posType: 'noun', positionX: 9, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'San Jorge', emoji: '🐉', category: 'Fiesta', posType: 'noun', positionX: 10, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Semana Santa', emoji: '✝️', category: 'Fiesta', posType: 'noun', positionX: 11, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pascua', emoji: '🐣', category: 'Fiesta', posType: 'noun', positionX: 12, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Boda', emoji: '💍', category: 'Fiesta', posType: 'noun', positionX: 13, positionY: 66, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Premio', emoji: '🏆', category: 'Fiesta', posType: 'noun', positionX: 0, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },

  // Plantas (carpeta)
  { label: 'Hoja', emoji: '🍃', category: 'Plantas', posType: 'noun', positionX: 1, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rama', emoji: '🌿', category: 'Plantas', posType: 'noun', positionX: 2, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tallo', emoji: '🌱', category: 'Plantas', posType: 'noun', positionX: 3, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Raíz', emoji: '🪴', category: 'Plantas', posType: 'noun', positionX: 4, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Semilla', emoji: '🌱', category: 'Plantas', posType: 'noun', positionX: 5, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Planta', emoji: '🪴', category: 'Plantas', posType: 'noun', positionX: 6, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Maceta', emoji: '🪴', category: 'Plantas', posType: 'noun', positionX: 7, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Hierba', emoji: '🌿', category: 'Plantas', posType: 'noun', positionX: 8, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Árbol', emoji: '🌳', category: 'Plantas', posType: 'noun', positionX: 9, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Arboleda', emoji: '🌳', category: 'Plantas', posType: 'noun', positionX: 10, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Sauce', emoji: '🌿', category: 'Plantas', posType: 'noun', positionX: 11, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Ciprés', emoji: '🌲', category: 'Plantas', posType: 'noun', positionX: 12, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Pino', emoji: '🌲', category: 'Plantas', posType: 'noun', positionX: 13, positionY: 67, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Olivo', emoji: '🫒', category: 'Plantas', posType: 'noun', positionX: 0, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Palmera', emoji: '🌴', category: 'Plantas', posType: 'noun', positionX: 1, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Cactus', emoji: '🌵', category: 'Plantas', posType: 'noun', positionX: 2, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Trigo', emoji: '🌾', category: 'Plantas', posType: 'noun', positionX: 3, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Seta', emoji: '🍄', category: 'Plantas', posType: 'noun', positionX: 4, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Huerta', emoji: '🥬', category: 'Plantas', posType: 'noun', positionX: 5, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Tronco', emoji: '🪵', category: 'Plantas', posType: 'noun', positionX: 6, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Flores', emoji: '💐', category: 'Plantas', posType: 'noun', positionX: 7, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Flor', emoji: '🌸', category: 'Plantas', posType: 'noun', positionX: 8, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Rosa', emoji: '🌹', category: 'Plantas', posType: 'noun', positionX: 9, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Margarita', emoji: '🌼', category: 'Plantas', posType: 'noun', positionX: 10, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Clavel', emoji: '🌺', category: 'Plantas', posType: 'noun', positionX: 11, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
  { label: 'Muérdago', emoji: '☘️', category: 'Plantas', posType: 'noun', positionX: 12, positionY: 68, color: DEFAULT_SYMBOL_COLOR, hidden: false },
]

export const CATEGORIES = ['Yo/Tú', 'Acciones', 'Comida', 'Lugares', 'Sentimientos', 'Tiempo']

export const CATEGORY_COLORS: Record<string, string> = {
  'Yo/Tú': 'preset:sky',
  'Acciones': 'preset:violet',
  'Comida': 'preset:cyan',
  'Lugares': 'preset:yellow',
  'Sentimientos': 'preset:green',
  'Tiempo': 'preset:time',
}

export const DEFAULT_FOLDER_TILES: PartialSymbol[] = [
  { label: 'Charla rápida', emoji: '💬', category: 'Carpetas', posType: 'other', positionX: 4, positionY: 2, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Juegos', emoji: '🧩', category: 'Carpetas', posType: 'other', positionX: 6, positionY: 5, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Partículas', emoji: '➕', category: 'Carpetas', posType: 'other', positionX: 5, positionY: 5, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Alimentos', emoji: '🍎', category: 'Carpetas', posType: 'other', positionX: 5, positionY: 2, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Lácteos', emoji: '🥛', category: 'Carpetas', posType: 'other', positionX: 6, positionY: 2, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Objetos', emoji: '🪑', category: 'Carpetas', posType: 'other', positionX: 6, positionY: 2, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Lugares', emoji: '🏫', category: 'Carpetas', posType: 'other', positionX: 7, positionY: 2, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Bebidas', emoji: '🥤', category: 'Carpetas', posType: 'other', positionX: 5, positionY: 3, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Ropa', emoji: '👕', category: 'Carpetas', posType: 'other', positionX: 6, positionY: 3, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Cuerpo', emoji: '🧍', category: 'Carpetas', posType: 'other', positionX: 7, positionY: 3, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Animales', emoji: '🐴', category: 'Carpetas', posType: 'other', positionX: 5, positionY: 4, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Colores', emoji: '🎨', category: 'Carpetas', posType: 'other', positionX: 6, positionY: 4, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Sentimientos', emoji: '💖', category: 'Carpetas', posType: 'other', positionX: 10, positionY: 3, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Tiempo', emoji: '⏰', category: 'Carpetas', posType: 'other', positionX: 12, positionY: 3, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Más verbos', emoji: '🗂️', category: 'Carpetas', posType: 'other', positionX: 5, positionY: 5, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Muebles', emoji: '🛋️', category: 'Carpetas', posType: 'other', positionX: 10, positionY: 2, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Complementos', emoji: '🧰', category: 'Carpetas', posType: 'other', positionX: 13, positionY: 3, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Aparatos', emoji: '📱', category: 'Carpetas', posType: 'other', positionX: 8, positionY: 4, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Transportes', emoji: '🚗', category: 'Carpetas', posType: 'other', positionX: 7, positionY: 5, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Plantas', emoji: '🌿', category: 'Carpetas', posType: 'other', positionX: 9, positionY: 5, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Fiesta', emoji: '🎉', category: 'Carpetas', posType: 'other', positionX: 11, positionY: 5, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Conceptos', emoji: '🧠', category: 'Carpetas', posType: 'other', positionX: 13, positionY: 5, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Actividades', emoji: '🏃', category: 'Carpetas', posType: 'other', positionX: 8, positionY: 6, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Descripción', emoji: '📝', category: 'Carpetas', posType: 'other', positionX: 10, positionY: 6, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Formas y medidas', emoji: '📏', category: 'Carpetas', posType: 'other', positionX: 12, positionY: 6, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Números', emoji: '🔢', category: 'Carpetas', posType: 'other', positionX: 7, positionY: 7, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Aficiones', emoji: '🎯', category: 'Carpetas', posType: 'other', positionX: 9, positionY: 7, color: DEFAULT_FOLDER_COLOR, hidden: false },
  { label: 'Frases hechas', emoji: '🗨️', category: 'Carpetas', posType: 'other', positionX: 11, positionY: 7, color: DEFAULT_FOLDER_COLOR, hidden: false },
]

/** Pictos de carpeta retirados de la plantilla; se ignoran al componer el grid y se borran al cargar el perfil demo. */
export const OBSOLETE_DEMO_FOLDER_LABELS_LOWER = new Set(['tiempo+'])

export function withoutObsoleteDemoFolderSymbols<T extends { label: string }>(symbols: readonly T[]): T[] {
  return symbols.filter((s) => !OBSOLETE_DEMO_FOLDER_LABELS_LOWER.has(s.label.trim().toLowerCase()))
}

export const DEFAULT_FOLDER_CONTENTS: Record<string, string[]> = {
  'Charla rápida': [
    '¡Hola!',
    '¡Buenos días!',
    '¡Buenas tardes!',
    '¡Buenas noches!',
    'Adiós',
    '¿Qué tal?',
    '¿Cómo estás?',
    '¿Cómo te llamas?',
    'Es gracias',
    'Estoy bien',
    'Muy guay',
    'Genial',
    'Horrible',
    'Gracias',
    'Me gusta',
    'Fantástico',
    'Te quiero',
    'Por favor',
    'Yo también',
    'Equivocado',
    'Lo siento',
    'No lo entiendo',
    '¡Felicidades!',
    'A mí tampoco',
    'Es una tontería',
    'Buen provecho',
    'No me gusta',
    'No quiero',
    'Mala suerte',
    'No toques',
    'De acuerdo',
    '¡Vaya tontería!',
    '¡Estás loco!',
    '¡Estás loca!',
  ],
  Alimentos: [
    'Desayuno',
    'Almuerzo',
    'Aperitivo',
    'Comida',
    'Merienda',
    'Cena',
    'Primer plato',
    'Segundo plato',
    'Postre',
    'Menú',
    'Frutas',
    'Dulces',
    'Lácteos',
    'Verduras',
    'Lechuga',
    'Acelga',
    'Judías',
    'Borraja',
    'Espinacas',
    'Brócoli',
    'Menestra',
    'Legumbres',
    'Sopa',
    'Puré',
    'Arroz',
    'Paella',
    'Lentejas',
    'Garbanzos',
    'Ensaladilla rusa',
    'Guisantes',
    'Pasta',
    'Macarrones',
    'Espagueti',
    'Ensalada',
    'Carne',
    'Pescado',
    'Albóndigas',
    'Carne guisada',
    'Pollo',
    'Más',
  ],
  'Alimentos · página 2': [
    'Huevos',
    'Tortilla',
    'Huevo frito',
    'Huevo duro',
    'Patatas',
    'Patatas fritas',
    'Lasaña',
    'Canelones',
    'Pescado rebozado',
    'Pescado en salsa',
    'Baritas de pescado',
    'Salchichas',
    'Croquetas',
    'Pizza',
    'Hamburguesa',
  ],
  Frutas: [
    'Frutas',
    'Manzana',
    'Pera',
    'Plátano',
    'Naranja',
    'Uva',
    'Melocotón',
    'Melón',
    'Fresas',
    'Mandarina',
    'Sandía',
    'Cerezas',
    'Albaricoque',
    'Kiwi',
    'Arándanos',
    'Piña',
    'Frambuesas',
  ],
  Dulces: [
    'Dulces',
    'Galletas',
    'Bizcocho',
    'Croissant',
    'Pasteles',
    'Tarta',
    'Bombones',
    'Galleta',
    'Cookies',
    'Magdalena',
    'Torta',
    'Tortitas',
    'Muffin',
    'Churros',
    'Napolitana',
    'Donut',
    'Ensaimada',
    'Roscón',
    'Oreo',
    'Palmera',
    'Chocolate',
    'Nata',
    'Chocolate blanco',
    'Azúcar',
    'Mermelada',
    'Nocilla',
    'Crema de cacahuete',
    'Crema',
    'Mantequilla',
  ],
  'Lácteos': [
    'Yogur',
    'Natillas',
    'Flan',
    'Arroz con leche',
    'Cuajada',
    'Gelatina',
    'Helado',
    'Yogur bebible',
    'Cucurucho',
    'Tarrina',
  ],
  Muebles: [
    'Muebles',
    'Silla',
    'Mesa',
    'Armario',
    'Sofá',
    'Cama',
    'Lámpara',
    'Ventana',
    'Puerta',
    'Estantería',
    'Taburete',
    'Sillón',
    'Escritorio',
    'Estante',
    'Perchero',
    'Cómoda',
    'Cajón',
    'Cuna',
    'Percha',
    'Mantel',
    'Espejo',
    'Vaso',
    'Plato',
    'Taza',
    'Servilleta',
    'Cubiertos',
    'Cuchara',
    'Tenedor',
    'Cuchillo',
    'Jarra',
    'Escoba',
    'Luz',
  ],
  'Partículas': [
    'el',
    'la',
    'los',
    'las',
    'un',
    'una',
    'unos',
    'unas',
    'a',
    'con',
    'de',
    'en',
    'para',
    'por',
    'que',
    'o',
    'y',
    'pero',
    'porque',
    'al',
    'sin',
  ],
  Juegos: [
    'Juegos',
    'Pelota',
    'Muñeca',
    'Piezas',
    'Cocinita',
    'Construcciones',
    'Cromos',
    'Pompas',
    'Puzzle',
    'Globos',
    'Veo, veo',
    'Aro',
    'Canicas',
    'Marionetas',
    'Columpios',
    'Pala',
    'Tobogán',
    'Cubo',
    'Juegos de mesa',
    'Parchís',
    'Oca',
    'Damas',
    'Dado',
    'Ajedrez',
    'Cartas',
    'Deportes',
    'Basket',
    'Fútbol',
    'Slalom',
    'Natación',
  ],
  Sentimientos: [
    'Estoy bien',
    'Estoy mal',
    'Estoy regular',
    'Triste',
    'Alegre',
    'Miedo',
    'Dolor',
    'Confundido',
    'Enfermo',
    'Nervioso',
    'Sueño',
    'Frío',
    'Distraído',
    'Enamorado',
    'Hambre',
    'Sed',
    'Enfadado',
    'Preocupado',
    'Picor',
    'Temblor',
    'Sorprendido',
    'Asqueado',
    'Desanimado',
    'Mareado',
    'Cansado',
    'Incómodo',
    'Paciencia',
    'Calor',
  ],
  Tiempo: [
    'Tiempo',
    'Día',
    'Semana',
    'Mes',
    'Año',
    'Hora',
    'Minuto',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
    'Siempre',
    'Nunca',
    'Amanecer',
    'Mañana',
    'Tarde',
    'Noche',
    'Anochecer',
    'Fin de semana',
    'Tiempo atmosférico',
    'Sol',
    'Lluvia',
    'Nubes',
    'Viento',
    'Nieve',
    'Niebla',
    'Tormenta',
    'Trueno',
    'Luna',
    'Relámpago',
    'Estrellas',
  ],
  Complementos: [
    'Cinturón',
    'Tirantes',
    'Pañuelo',
    'Mochila',
    'Collar',
    'Monedero',
    'Pulsera',
    'Pendientes',
    'Reloj',
    'Bolso',
    'Bolsa deporte',
    'Paraguas',
    'Cartera',
    'Bolso de mano',
    'Anillo',
  ],
  Aparatos: [
    'Aparatos',
    'Móvil',
    'Tablet',
    'Ordenador',
    'Portátil',
    'Radio',
    'Pulsador',
    'Comunicador',
    'Tele',
    'Mando a distancia',
    'Impresora',
    'Internet',
    'Timbre',
    'Cámara',
  ],
  Animales: [
    'Animal',
    'Perro',
    'Gato',
    'Pollito',
    'Gallo',
    'Gallina',
    'Pato',
    'Conejo',
    'Vaca',
    'Oveja',
    'Cabra',
    'Burro',
    'Caballo',
    'Cerdo',
    'Pájaro',
    'Mosca',
    'Mosquito',
    'Araña',
    'Caracol',
    'Abeja',
    'Mariposa',
    'Ratón',
    'Bicho',
    'Lagartija',
    'Ardilla',
    'Tortuga',
    'Rana',
    'Gusano',
    'Más',
  ],
  'Animales · página 2': [
    'Jabalí',
    'Lobo',
    'Oso',
    'Búho',
    'Mono',
    'Zorro',
    'León',
    'Tigre',
    'Elefante',
    'Cebra',
    'Jirafa',
    'Canguro',
    'Camello',
    'Hipopótamo',
    'Pez',
    'Ballena',
    'Delfín',
    'Tiburón',
    'Foca',
    'Pingüino',
    'Serpiente',
    'Cangrejo',
    'Dinosaurio',
  ],
  Colores: [
    'Colores',
    'Rojo',
    'Azul',
    'Celeste',
    'Verde',
    'Amarillo',
    'Naranja',
    'Rosa',
    'Negro',
    'Blanco',
    'Morado',
    'Lila',
    'Marrón',
    'Granate',
    'Gris',
    'Dorado',
    'Beige',
    'Plateado',
    'Mostaza',
    'Rayas',
    'Topos',
    'Cuadros',
    'Floreado',
  ],
  Transportes: [
    'Vehículo',
    'Coche',
    'Bici',
    'Moto',
    'Taxi',
    'Autobús',
    'Tranvía',
    'Patinete',
    'Skate',
    'Tren',
    'Furgoneta',
    'Metro',
    'Camión',
    'Tractor',
    'Silla de ruedas con motor',
    'Silla de ruedas',
    'Helicóptero',
    'Barco',
    'Caravana',
    'Avión',
    'Rueda',
    'Volante',
    'Claxon',
    'Limpiaparabrisas',
  ],
  Plantas: [
    'Hoja',
    'Rama',
    'Tallo',
    'Raíz',
    'Semilla',
    'Planta',
    'Maceta',
    'Hierba',
    'Árbol',
    'Arboleda',
    'Sauce',
    'Ciprés',
    'Pino',
    'Olivo',
    'Palmera',
    'Cactus',
    'Campo',
    'Trigo',
    'Seta',
    'Huerta',
    'Bosque',
    'Tronco',
    'Flores',
    'Flor',
    'Rosa',
    'Margarita',
    'Clavel',
    'Muérdago',
  ],
  Fiesta: [
    'Fiestas',
    'Vacaciones',
    'Cumpleaños',
    'Navidad',
    'Nochevieja',
    'Papá Noel',
    'Reyes Magos',
    'Halloween',
    'Carnaval',
    'San Jorge',
    'Semana Santa',
    'Pascua',
    'Boda',
    'Premio',
    'Fiesta',
  ],
  Conceptos: [
    'Algunos',
    'Poco',
    'Ninguno',
    'Último',
    'Fila',
    'Primero',
    'Dentro',
    'Todos',
    'Lejos',
    'Lleno',
    'Cerca',
    'Vacío',
    'Grande',
    'Izquierda',
    'Pequeño',
    'Delante',
    'Debajo',
    'Fuera',
    'Derecha',
    'Encima',
    'Detrás',
  ],
  Actividades: [
    'Cuentos',
    'Música',
    'Sala snoezelen',
    'Manualidades',
    'Relajación',
    'Pintar',
    'Bailar',
    'Cantar',
    'Leer',
    'Jugar',
    'Pasear',
    'Descansar',
  ],
  'Descripción': [
    'Fuerte',
    'Débil',
    'Guapo',
    'Limpio',
    'Guapa',
    'Limpia',
    'Salado',
    'Rugoso',
    'Liso',
    'Salada',
    'Rugosa',
    'Lisa',
    'Mojado',
    'Feo',
    'Dulce',
    'Mojada',
    'Fea',
    'Sucia',
    'Rápido',
    'Claro',
    'Rápida',
    'Clara',
    'Seco',
    'Lento',
    'Oscuro',
    'Seca',
    'Lenta',
    'Oscura',
    'Duro',
    'Delgado',
    'Roto',
    'Dura',
    'Rota',
    'Blando',
    'Gordo',
    'Raro',
    'Blanda',
    'Gorda',
    'Rara',
  ],
  'Formas y medidas': [
    'Forma',
    'Rombo',
    'Círculo',
    'Rectángulo',
    'Estrella',
    'Cuadrado',
    'Triángulo',
    'Corazón',
    'Medida',
    'Mucho',
    'Nada',
    'Alto',
    'Bajo',
    'Menos',
    'Largo',
    'Corto',
  ],
  'Frases hechas': [
    'Me importa un pepino',
    '¡Me he puesto morado!',
    'He metido la pata',
    'Estoy de mala leche',
    'No me importa',
    'Estás empanao',
    'Se te ve el plumero',
    'Estás como una cabra',
    'Se ha liado parda',
    '¡Es la pera!',
    '¡Tela marinera!',
    '¡Tiene narices!',
    'Esto es pan comido',
    'No hay mal que por bien no venga',
    'A palabras necias, oídos sordos',
    'Más vale tarde que nunca',
    'Estar en las nubes',
    'Tener la cabeza en otro sitio',
  ],
  'Más verbos': [
    'Morder',
    'Comer',
    'Beber',
    'Mirar',
    'Tocar',
    'Tirar',
    'Venir',
    'Acabar',
    'Visitar',
    'Estar',
    'Jugar',
    'Comprar',
    'Pelear',
    'Volver',
    'Vestir',
    'Hablar con',
    'Pensar',
    'Llorar',
    'Celebrar',
    'Enseñar',
    'Haber',
    'Oler',
    'Dormir',
    'Bañar',
    'Desvestir',
    'Viajar',
    'Vestir',
    'Esperar',
    'Venir',
    'Cocinar',
    'Sentarse',
    'Aparcar',
    'Caer',
    'Secar',
    'Mojar',
    'Más',
  ],
  'Más verbos · página 2': [
    'Hablar',
    'Pintar',
    'Enseñar',
    'Tostar',
    'Andar',
    'Pasear',
    'Subir',
    'Comprar',
    'Hacer pipí',
    'Trabajar',
    'Contar',
    'Fotocopiar',
    'Correr',
    'Nadar',
    'Guardar',
    'Hacer caca',
    'Escribir',
    'Estudiar',
    'Rasgar',
    'Bailar',
    'Saltar',
    'Esconderse',
    'Vender',
    'Pegar',
    'Leer',
    'Explicar',
    'Cambiar',
    'Tumbarse',
    'Esquiar',
    'Volar',
    'Bajar',
    'Peinar',
    'Limpiar',
    'Cantar',
    'Fumar',
    'Más',
  ],
  'Más verbos · página 3': [
    'Dibujar',
    'Clasificar',
    'Ensartar',
    'Cortar',
    'Romper',
    'Pinchar',
    'Abrir',
    'Cerrar',
    'Plantar',
    'Regar',
    'Coser',
    'Amar',
    'Besar',
    'Olvidar',
    'Telefonear',
    'Aprender',
    'Saber',
    'Pelearse',
    'Rascar',
    'Descansar',
    'Perder',
    'Llevar',
    'Abrazar',
    'Invitar',
    'Molestar',
    'Chillar',
    'Ganar',
    'Recordar',
    'Empezar',
    'Terminar',
    'Buscar',
    'Parar',
    'Quitar',
    'Perderse',
    'Salir',
  ],
  Aficiones: [
    'Me gusta',
    'No me gusta',
    'Escuchar música',
    'Jugar basket',
    'Hacer puzzles',
    'Jugar al fútbol',
    'Pintar',
    'Bailar',
    'Cantar',
    'Leer',
  ],
  Ropa: [
    'Ropa',
    'Camiseta',
    'Camiseta de tirantes',
    'Jersey',
    'Pantalón',
    'Pantalón corto',
    'Falda',
    'Vestido',
    'Peto',
    'Camisa',
    'Chaleco',
    'Chaqueta',
    'Americana',
    'Chándal',
    'Chaquetón',
    'Abrigo',
    'Impermeable',
    'Bufanda',
    'Gorro',
    'Guantes',
    'Zapatos',
    'Zapatillas',
    'Botas',
    'Chanclas',
    'Pijama',
    'Calcetines',
    'Bañador',
    'Babero',
    'Pañal',
    'Bragas',
    'Calzoncillos',
    'Sujetador',
    'Corbata',
    'Bolsillo',
    'Cremallera',
    'Botón',
  ],
  Objetos: [
    'Objeto',
    'Libro',
    'Lápiz',
    'Pinturas',
    'Papel',
    'Dibujo',
    'Cómic',
    'Letras',
    'Calendario',
    'Pizarra',
    'Carpeta',
    'Revista',
    'Foto',
    'Periódico',
    'Pegamento',
    'Tijeras',
    'Gomets',
    'Plastilina',
    'Luz',
    'Pincel',
    'Caja',
    'Bolsa',
    'Agenda',
    'Cuento',
    'Monedero',
    'Billetes',
    'Euro',
    'Céntimo',
    'Monedas',
    'Espejo',
    'Piedra',
    'Palo',
    'Cesta',
    'Fuego',
    'Paraguas',
    'Reloj',
    'Basura',
    'Llave',
    'Ventilador',
  ],
  Lugares: [
    'Lugar',
    'Casa',
    'Colegio',
    'Parque',
    'Tienda',
    'Calle',
    'Plaza',
    'Taller',
    'Residencia',
    'Panadería',
    'Bar',
    'Mercado',
    'Farmacia',
    'Gasolinera',
    'Restaurante',
    'Biblioteca',
    'Museo',
    'Cine',
    'Circo',
    'Teatro',
    'Zoo',
    'Pueblo',
    'Ciudad',
    'Hospital',
    'Hotel',
    'Estación',
    'Aeropuerto',
    'Iglesia',
    'Correos',
    'Comisaría',
    'Parking',
    'Playa',
    'Mar',
    'Piscina',
    'Campo',
    'Montaña',
    'Camping',
    'Granja',
    'Bosque',
    'Huerto',
    'Puente',
    'Río',
    'Europa',
    'Asia',
    'Oceanía',
    'América',
    'África',
  ],
  Casa: [
    'Dormitorio',
    'Cocina',
    'Salón',
    'Baño',
    'Pasillo',
    'Estudio',
    'Cama',
    'Armario',
    'Escritorio',
    'Silla',
    'Flexo',
    'Armario de cocina',
    'Nevera',
    'Lavadora',
    'Lavavajillas',
    'Horno',
    'Microondas',
    'Lavabo',
    'Water',
    'Ducha',
    'Bañera',
    'Ascensor',
    'Salida emergencia',
    'Puerta de entrada',
    'Escaleras',
    'Rampa',
  ],
  Colegio: [
    'Libro',
    'Cuaderno',
    'Lápiz',
    'Pinturas',
    'Bolígrafo',
    'Papel',
    'Sacapuntas',
    'Mesa',
    'Silla',
    'Pizarra',
    'Carpeta',
    'Estuche',
    'Mochila',
    'Cartulinas',
    'Pegamento',
    'Tijeras',
    'Gomets',
    'Plastilina',
    'Pintura',
    'Pincel',
    'Pizarra digital',
    'Deberes',
    'Punzón',
    'Fichas',
    'Agenda',
    'Cuento',
    'Lengua',
    'Matemáticas',
    'Naturales',
    'Sociales',
    'Educación física',
    'Logopedia',
    'Fisioterapia',
    'Música',
    'Talleres',
    'Recreo',
    'Aula',
    'Gimnasio',
    'Comedor',
  ],
  Bebidas: [
    'Agua',
    'Leche',
    'Zumo',
    'Refresco',
    'Coca cola',
    'Limonada',
    'Naranjada',
    'Cola cao',
    'Café',
    'Infusión',
    'Chocolate',
    'Bebida isotónica',
    'Yogur',
    'Yogur bebible',
    'Batido',
  ],
  Cuerpo: [
    'Cuerpo',
    'Cabeza',
    'Cara',
    'Ojos',
    'Nariz',
    'Oreja',
    'Boca',
    'Dientes',
    'Lengua',
    'Pelo',
    'Cuello',
    'Pecho',
    'Espalda',
    'Barriga',
    'Cadera',
    'Brazo',
    'Codo',
    'Mano',
    'Dedo',
    'Uña',
    'Pierna',
    'Rodilla',
    'Muñeca',
    'Pie',
    'Tobillo',
    'Huesos',
    'Piel',
    'Hombro',
    'Cejas',
    'Pestañas',
  ],
}

const DEMO_FOLDER_LABEL_KEYS_LOWER = new Set(
  Object.keys(DEFAULT_FOLDER_CONTENTS).map((k) => k.toLowerCase()),
)

/** Celda que abre una carpeta en la demo (p. ej. «Más verbos»): icono y estilo carpeta en el tablero principal. */
export function isDemoFolderLabel(label: string): boolean {
  return DEMO_FOLDER_LABEL_KEYS_LOWER.has(label.trim().toLowerCase())
}

/**
 * Indica si la celda debe mostrar el icono de carpeta (esquina): solo al abrir otra carpeta,
 * no para pictos normales dentro de una carpeta (`folder-item-`), salvo que el propio picto sea
 * una carpeta anidada (etiqueta en `DEFAULT_FOLDER_CONTENTS`) o «Más» que abre la 2.ª página
 * en Alimentos / Animales / Más verbos.
 * Si la etiqueta coincide con la carpeta abierta (p. ej. «Ropa» / «Cuerpo»), es picto léxico:
 * sin distintivo (en demo `category` es el nombre de la carpeta activa).
 */
export function shouldShowFolderBadge(symbol: Symbol): boolean {
  const id = String(symbol.id)
  if (id.startsWith('folder-item-')) {
    const lab = symbol.label.trim().toLowerCase()
    const cat =
      typeof symbol.category === 'string' ? symbol.category.trim().toLowerCase() : ''
    if (cat && lab === cat) {
      return false
    }
    if (isDemoFolderLabel(symbol.label)) return true
    if (
      lab === 'más' &&
      (id.startsWith('folder-item-Alimentos-') ||
        id.startsWith('folder-item-Animales-') ||
        id.startsWith('folder-item-Más verbos'))
    ) {
      return true
    }
    return false
  }
  if (id.startsWith('folder-')) {
    return true
  }
  return isDemoFolderLabel(symbol.label)
}

export const MAIN_GRID_TEMPLATE: string[][] = [
  ['Yo', 'Tú', 'Querer', 'Gustar', 'Ir', 'Dar', 'Charla rápida', '¿Qué?', '¿Quién?', '¿Dónde?', '¿Cuándo?', '¿Cómo?', '¿Por qué?', ''],
  ['Él', 'Ella', 'Poner', 'Necesitar', 'Ser', 'Sentir', 'Y', 'Alimentos', '', 'Objetos', '', 'Lugares', '', 'Cuerpo'],
  ['Nosotros', 'Ellos', 'Hacer', 'Escuchar', 'Pensar', 'Coger', 'A', '', 'Bebidas', '', 'Muebles', '', 'Ropa', ''],
  ['Vosotros', 'Este', 'Ver', 'Estar', 'Jugar', 'Tener', 'DE', 'Juegos', '', 'Sentimientos', '', 'Tiempo', '', 'Complementos'],
  ['Personas', 'Ayudar', 'Ahora', 'Comer', 'Beber', 'Poder', 'CON', '', 'Aparatos', '', 'Animales', '', 'Colores', ''],
  ['Sí', 'No', 'Después', 'Terminar', 'Decir', 'Más verbos', 'UN', 'Transportes', '', 'Plantas', '', 'Fiesta', '', 'Conceptos'],
  ['Más', 'No lo sé', 'Aquí', 'Ayer', 'Hoy', 'Mañana', 'Partículas', '', 'Actividades', '', 'Descripción', '', 'Formas y medidas', ''],
  ['Bien', 'Mal', 'Mucho', 'Diferente', 'Muy', 'También', 'Teclado', 'Números', '', 'Aficiones', '', 'Frases hechas', '', ''],
]

/**
 * Tras borrar en BD un picto del grid `main` en una celda exacta de MAIN_GRID_TEMPLATE,
 * persistimos la etiqueta para no volver a inyectar el fallback de plantilla (ids default-* / fixed-left-*).
 */
export function shouldRecordDemoTemplateSuppressionOnDelete(symbol: {
  label: string
  positionX: number
  positionY: number
  gridId?: string | null
  grid_id?: string | null
}): boolean {
  if (effectiveSymbolGridId(symbol) !== 'main') return false
  const cellLabel = MAIN_GRID_TEMPLATE[symbol.positionY]?.[symbol.positionX]
  if (!cellLabel || !String(cellLabel).trim()) return false
  return cellLabel.trim().toLowerCase() === symbol.label.trim().toLowerCase()
}

/**
 * Primera aparición de cada etiqueta en la plantilla demo (MAIN_GRID_TEMPLATE).
 * Sirve para resetear posiciones en BD cuando el tablero queda descolocado.
 */
export function getDemoTemplatePositionMap(): Map<string, { x: number; y: number }> {
  const m = new Map<string, { x: number; y: number }>()
  MAIN_GRID_TEMPLATE.forEach((row, y) => {
    row.forEach((label, x) => {
      if (!label || !String(label).trim()) return
      const k = String(label).trim().toLowerCase()
      if (!m.has(k)) m.set(k, { x, y })
    })
  })
  return m
}

export function parseDemoSuppressedTemplateLabelsJson(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  for (const v of input) {
    if (typeof v !== 'string') continue
    const k = v.trim().toLowerCase()
    if (k) out.push(k)
  }
  return out
}

/**
 * Pictos de la plantilla demo generados en cliente (`computeMainGrid`) sin fila propia en BD.
 * Al «eliminar» hay que persistir la etiqueta en `demoSuppressedTemplateLabels`, no solo filtrar estado React.
 */
export function isDemoVirtualGridSymbolId(id: string): boolean {
  const s = String(id)
  if (s.startsWith('template-')) return true
  if (s.startsWith('fixed-left-')) return true
  if (s.startsWith('default-left-')) return true
  if (s.startsWith('default-') && !s.startsWith('default-left-')) return true
  return false
}

/** Clave estable `carpeta|etiqueta` (minúsculas) para suprimir un picto del contenido demo de una carpeta. */
export function demoFolderSuppressionKey(folderKey: string, label: string): string {
  return `${folderKey.trim().toLowerCase()}|${label.trim().toLowerCase()}`
}

export function parseDemoSuppressedFolderItemsJson(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  for (const v of input) {
    if (typeof v !== 'string') continue
    const k = v.trim().toLowerCase()
    if (k.includes('|')) out.push(k)
  }
  return out
}

/**
 * Interpreta ids `folder-item-<carpeta>-<índice>` generados en esta base (índice en `DEFAULT_FOLDER_CONTENTS[carpeta]`).
 */
export function parseDemoFolderItemId(id: string): { folderKey: string; index: number } | null {
  const m = String(id).match(/^folder-item-(.+)-(\d+)$/)
  if (!m) return null
  const index = Number(m[2])
  if (!Number.isFinite(index) || index < 0) return null
  return { folderKey: m[1], index }
}

export function clearDemoSuppressedKeysRestoredBySymbols(
  symbols: Array<{
    label?: string | null
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
    gridId?: string | null
    grid_id?: string | null
  }>,
  suppressed: readonly string[],
): string[] {
  const posMap = getDemoTemplatePositionMap()
  return suppressed.filter((key) => {
    for (const s of symbols) {
      if (effectiveSymbolGridId(s) !== 'main') continue
      const lab = typeof s.label === 'string' ? s.label.trim().toLowerCase() : ''
      if (lab !== key) continue
      const px = Number(s.positionX ?? s.position_x ?? 0)
      const py = Number(s.positionY ?? s.position_y ?? 0)
      const expected = posMap.get(key)
      if (expected && expected.x === px && expected.y === py) return false
    }
    return true
  })
}

/** Columnas fijas por la izquierda (tablero base; coincide con zona fija geométrica). */
export const FIXED_COLUMNS = BASE_FIXED_LEFT_COLUMN_COUNT
export const TOTAL_COLUMNS = 14

const DEFAULT_POSITION_BY_LABEL = new Map(
  [...DEFAULT_SYMBOLS, ...DEFAULT_FOLDER_TILES].map((symbol) => [
    symbol.label.toLowerCase(),
    { x: symbol.positionX, y: symbol.positionY },
  ])
)

const DEFAULT_SYMBOL_BY_LABEL = new Map(
  [...DEFAULT_SYMBOLS, ...DEFAULT_FOLDER_TILES].map((symbol) => [
    symbol.label.toLowerCase(),
    symbol,
  ])
)

function getStoredPosition(symbol: Symbol) {
  return {
    x: Number(symbol.positionX ?? 0),
    y: Number(symbol.positionY ?? 0),
  }
}

function isCustomPosition(symbol: Symbol) {
  const defaultPosition = DEFAULT_POSITION_BY_LABEL.get(symbol.label.toLowerCase())
  if (!defaultPosition) return true

  const storedPosition = getStoredPosition(symbol)
  return storedPosition.x !== defaultPosition.x || storedPosition.y !== defaultPosition.y
}

/** Rellena imagen/emoji de la plantilla DEMO cuando la fila en BD no los tiene (p. ej. Yo / Tú). */
function mergeDefaultVisualsForLabel(label: string, existing: Symbol) {
  const def = DEFAULT_SYMBOL_BY_LABEL.get(label.toLowerCase())
  return {
    imageUrl: existing.imageUrl || def?.imageUrl,
    emoji: existing.emoji ?? def?.emoji,
  }
}

export function computeMainGrid(
  symbols: Symbol[],
  activeFolder: string | null,
  suppressedTemplateLabels: ReadonlySet<string> | null = null,
  suppressedFolderItems: ReadonlySet<string> | null = null,
): Symbol[] {
  symbols = withoutObsoleteDemoFolderSymbols(symbols)
  const byLabel = new Map(symbols.map(symbol => [symbol.label.toLowerCase(), symbol]))
  const customSymbols = symbols
    .filter((symbol) => isCustomPosition(symbol))
    .map((symbol) => {
      const storedPosition = getStoredPosition(symbol)
      return {
        ...symbol,
        positionX: storedPosition.x,
        positionY: storedPosition.y,
        ...mergeDefaultVisualsForLabel(symbol.label, symbol),
      }
    })

  const mainGridRowCount = MAIN_GRID_TEMPLATE.length

  const occupiedCells = new Set<string>()
  for (const symbol of symbols) {
    if (effectiveSymbolGridId(symbol) !== 'main') continue
    const px = Number(symbol.positionX ?? 0)
    const py = Number(symbol.positionY ?? 0)
    if (px < 0 || py < 0 || px >= TOTAL_COLUMNS || py >= mainGridRowCount) continue
    occupiedCells.add(`${px}:${py}`)
  }

  const defaultPositionMainSymbols: Symbol[] = symbols
    .filter((symbol) => effectiveSymbolGridId(symbol) === 'main' && !isCustomPosition(symbol))
    .filter((symbol) => {
      const px = Number(symbol.positionX ?? 0)
      const py = Number(symbol.positionY ?? 0)
      return px >= 0 && py >= 0 && px < TOTAL_COLUMNS && py < mainGridRowCount
    })
    .map((symbol) => {
      const px = Number(symbol.positionX ?? 0)
      const py = Number(symbol.positionY ?? 0)
      return {
        ...symbol,
        positionX: px,
        positionY: py,
        ...mergeDefaultVisualsForLabel(symbol.label, symbol),
      }
    })

  /** Columnas a la derecha de la franja fija; filas desde la 2.ª (la 1.ª fila entera es zona fija). */
  const VARIABLE_COL_COUNT = TOTAL_COLUMNS - FIXED_COLUMNS
  const VARIABLE_ROW_START = 1

  const addRightTemplateCell = (x: number, y: number, into: Symbol[]) => {
    const label = MAIN_GRID_TEMPLATE[y]?.[x]
    if (!label || x < FIXED_COLUMNS) return
    if (suppressedTemplateLabels?.has(label.trim().toLowerCase())) return
    const existing = byLabel.get(label.toLowerCase())
    if (occupiedCells.has(`${x}:${y}`)) return
    if (existing && !isCustomPosition(existing)) {
      into.push({
        ...existing,
        positionX: x,
        positionY: y,
        ...mergeDefaultVisualsForLabel(label, existing),
      })
      return
    }

    if (existing) return

    const fallbackSymbol = DEFAULT_SYMBOL_BY_LABEL.get(label.toLowerCase())
    if (fallbackSymbol) {
      into.push({
        id: `default-${label.toLowerCase().replace(/\s+/g, '-')}`,
        gridId: 'default',
        label: fallbackSymbol.label,
        emoji: fallbackSymbol.emoji,
        category: fallbackSymbol.category,
        posType: fallbackSymbol.posType,
        positionX: x,
        positionY: y,
        color: fallbackSymbol.color,
        hidden: fallbackSymbol.hidden,
        imageUrl: fallbackSymbol.imageUrl,
        state: 'visible',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      return
    }

    into.push({
      id: `template-${label.toLowerCase().replace(/\s+/g, '-')}`,
      gridId: 'template',
      label,
      emoji: '❔',
      category: 'Carpetas',
      posType: 'other',
      positionX: x,
      positionY: y,
      color: DEFAULT_TEMPLATE_COLOR,
      hidden: false,
      imageUrl: undefined,
      state: 'visible',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  const folderSymbols: Symbol[] = activeFolder
    ? (DEFAULT_FOLDER_CONTENTS[activeFolder] || []).flatMap((label, i) => {
      if (suppressedFolderItems?.has(demoFolderSuppressionKey(activeFolder, label))) {
        return []
      }
      const match = symbols.find((s) => s.label.toLowerCase() === label.toLowerCase())
      const folderDef = DEFAULT_SYMBOL_BY_LABEL.get(label.toLowerCase())
      const posType: PosType =
        match?.posType
        ?? folderDef?.posType
        ?? (activeFolder === 'Más verbos' || activeFolder.startsWith('Más verbos ·')
          ? 'verb'
          : 'noun')
      const defaultFolderItemEmoji =
        activeFolder === 'Charla rápida'
          ? '💬'
          : activeFolder === 'Frases hechas'
            ? undefined
            : '🧩'
      return [
        {
          id: `folder-item-${activeFolder}-${i}`,
          gridId: 'demo',
          label,
          emoji: match?.emoji ?? folderDef?.emoji ?? defaultFolderItemEmoji,
          category: activeFolder,
          posType,
          positionX: (i % VARIABLE_COL_COUNT) + FIXED_COLUMNS,
          positionY: VARIABLE_ROW_START + Math.floor(i / VARIABLE_COL_COUNT),
          color: DEFAULT_SYMBOL_COLOR,
          hidden: false,
          imageUrl: match?.imageUrl || folderDef?.imageUrl,
          state: 'visible',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    })
    : []

  const fixedLeftPanel: Symbol[] = []
  MAIN_GRID_TEMPLATE.forEach((row, y) => {
    row.forEach((label, x) => {
      if (!label || x >= FIXED_COLUMNS) return
      if (suppressedTemplateLabels?.has(label.trim().toLowerCase())) return
      const existing = byLabel.get(label.toLowerCase())
      if (occupiedCells.has(`${x}:${y}`)) return
      if (existing && !isCustomPosition(existing)) {
        fixedLeftPanel.push({
          ...existing,
          positionX: x,
          positionY: y,
          ...mergeDefaultVisualsForLabel(label, existing),
        })
        return
      }

      if (existing) return

      const fallbackSymbol = DEFAULT_SYMBOL_BY_LABEL.get(label.toLowerCase())
      if (fallbackSymbol) {
        fixedLeftPanel.push({
          id: `default-left-${label.toLowerCase().replace(/\s+/g, '-')}`,
          gridId: 'default-left',
          label: fallbackSymbol.label,
          emoji: fallbackSymbol.emoji,
          category: fallbackSymbol.category,
          posType: fallbackSymbol.posType,
          positionX: x,
          positionY: y,
          color: fallbackSymbol.color,
          hidden: fallbackSymbol.hidden,
          imageUrl: fallbackSymbol.imageUrl,
          state: 'visible',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        return
      }

      fixedLeftPanel.push({
        id: `fixed-left-${label.toLowerCase().replace(/\s+/g, '-')}`,
        gridId: 'template-left',
        label,
        emoji: x === FIXED_COLUMNS - 1 ? undefined : '❔',
        category: 'Fijo',
        posType: 'other',
        positionX: x,
        positionY: y,
        color: x === FIXED_COLUMNS - 1 ? DEFAULT_TEMPLATE_COLOR : DEFAULT_FIXED_CELL_COLOR,
        hidden: false,
        imageUrl: undefined,
        state: 'visible',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
  })

  if (activeFolder) {
    const fixedTopRowRest: Symbol[] = []
    MAIN_GRID_TEMPLATE[0].forEach((_, x) => {
      addRightTemplateCell(x, 0, fixedTopRowRest)
    })
    return [...fixedLeftPanel, ...fixedTopRowRest, ...folderSymbols]
  }

  const rightPanelFromTemplate: Symbol[] = []
  MAIN_GRID_TEMPLATE.forEach((row, y) => {
    row.forEach((label, x) => {
      if (!label) return
      addRightTemplateCell(x, y, rightPanelFromTemplate)
    })
  })

  return [...customSymbols, ...defaultPositionMainSymbols, ...fixedLeftPanel, ...rightPanelFromTemplate]
}
