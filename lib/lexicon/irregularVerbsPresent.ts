/**
 * Presente de indicativo para verbos que no siguen la regla -ar/-er/-ir simple
 * (irregulares, cambio vocálico, -zco, -go, -yo, ortografía).
 * Las claves deben coincidir con el infinitivo normalizado (minúsculas, con tilde si aplica).
 */
export type IrregularVerbPerson = 'yo' | 'tu' | 'el' | 'nosotros' | 'vosotros' | 'ellos'

export const IRREGULAR_VERBS_PRESENT: Record<string, Record<IrregularVerbPerson, string>> = {
  // --- Muy frecuentes (auxiliares y básicos) ---
  ser: { yo: 'soy', tu: 'eres', el: 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son' },
  estar: { yo: 'estoy', tu: 'estás', el: 'está', nosotros: 'estamos', vosotros: 'estáis', ellos: 'están' },
  ir: { yo: 'voy', tu: 'vas', el: 'va', nosotros: 'vamos', vosotros: 'vais', ellos: 'van' },
  haber: { yo: 'he', tu: 'has', el: 'ha', nosotros: 'hemos', vosotros: 'habéis', ellos: 'han' },
  tener: { yo: 'tengo', tu: 'tienes', el: 'tiene', nosotros: 'tenemos', vosotros: 'tenéis', ellos: 'tienen' },
  hacer: { yo: 'hago', tu: 'haces', el: 'hace', nosotros: 'hacemos', vosotros: 'hacéis', ellos: 'hacen' },
  querer: { yo: 'quiero', tu: 'quieres', el: 'quiere', nosotros: 'queremos', vosotros: 'queréis', ellos: 'quieren' },
  poder: { yo: 'puedo', tu: 'puedes', el: 'puede', nosotros: 'podemos', vosotros: 'podéis', ellos: 'pueden' },
  venir: { yo: 'vengo', tu: 'vienes', el: 'viene', nosotros: 'venimos', vosotros: 'venís', ellos: 'vienen' },
  decir: { yo: 'digo', tu: 'dices', el: 'dice', nosotros: 'decimos', vosotros: 'decís', ellos: 'dicen' },
  poner: { yo: 'pongo', tu: 'pones', el: 'pone', nosotros: 'ponemos', vosotros: 'ponéis', ellos: 'ponen' },
  dar: { yo: 'doy', tu: 'das', el: 'da', nosotros: 'damos', vosotros: 'dais', ellos: 'dan' },
  ver: { yo: 'veo', tu: 'ves', el: 've', nosotros: 'vemos', vosotros: 'veis', ellos: 'ven' },
  saber: { yo: 'sé', tu: 'sabes', el: 'sabe', nosotros: 'sabemos', vosotros: 'sabéis', ellos: 'saben' },
  caber: { yo: 'quepo', tu: 'cabes', el: 'cabe', nosotros: 'cabemos', vosotros: 'cabéis', ellos: 'caben' },
  valer: { yo: 'valgo', tu: 'vales', el: 'vale', nosotros: 'valemos', vosotros: 'valéis', ellos: 'valen' },

  // --- -zco (c conocer, conducir, etc.) ---
  conocer: { yo: 'conozco', tu: 'conoces', el: 'conoce', nosotros: 'conocemos', vosotros: 'conocéis', ellos: 'conocen' },
  conducir: { yo: 'conduzco', tu: 'conduces', el: 'conduce', nosotros: 'conducimos', vosotros: 'conducís', ellos: 'conducen' },
  traducir: { yo: 'traduzco', tu: 'traduces', el: 'traduce', nosotros: 'traducimos', vosotros: 'traducís', ellos: 'traducen' },
  introducir: { yo: 'introduzco', tu: 'introduces', el: 'introduce', nosotros: 'introducimos', vosotros: 'introducís', ellos: 'introducen' },
  producir: { yo: 'produzco', tu: 'produces', el: 'produce', nosotros: 'producimos', vosotros: 'producís', ellos: 'producen' },
  reducir: { yo: 'reduzco', tu: 'reduces', el: 'reduce', nosotros: 'reducimos', vosotros: 'reducís', ellos: 'reducen' },
  lucir: { yo: 'luzco', tu: 'luces', el: 'luce', nosotros: 'lucimos', vosotros: 'lucís', ellos: 'lucen' },

  // --- -go (salir, traer, caer, oír, seguir, etc.) ---
  salir: { yo: 'salgo', tu: 'sales', el: 'sale', nosotros: 'salimos', vosotros: 'salís', ellos: 'salen' },
  traer: { yo: 'traigo', tu: 'traes', el: 'trae', nosotros: 'traemos', vosotros: 'traéis', ellos: 'traen' },
  atraer: { yo: 'atraigo', tu: 'atraes', el: 'atrae', nosotros: 'atraemos', vosotros: 'atraéis', ellos: 'atraen' },
  caer: { yo: 'caigo', tu: 'caes', el: 'cae', nosotros: 'caemos', vosotros: 'caéis', ellos: 'caen' },
  oír: { yo: 'oigo', tu: 'oyes', el: 'oye', nosotros: 'oímos', vosotros: 'oís', ellos: 'oyen' },
  seguir: { yo: 'sigo', tu: 'sigues', el: 'sigue', nosotros: 'seguimos', vosotros: 'seguís', ellos: 'siguen' },
  conseguir: { yo: 'consigo', tu: 'consigues', el: 'consigue', nosotros: 'conseguimos', vosotros: 'conseguís', ellos: 'consiguen' },
  proseguir: { yo: 'prosigo', tu: 'prosigues', el: 'prosigue', nosotros: 'proseguimos', vosotros: 'proseguís', ellos: 'prosiguen' },
  elegir: { yo: 'elijo', tu: 'eliges', el: 'elige', nosotros: 'elegimos', vosotros: 'elegís', ellos: 'eligen' },
  recoger: { yo: 'recojo', tu: 'recoges', el: 'recoge', nosotros: 'recogemos', vosotros: 'recogéis', ellos: 'recogen' },
  proteger: { yo: 'protejo', tu: 'proteges', el: 'protege', nosotros: 'protegemos', vosotros: 'protegéis', ellos: 'protegen' },
  escoger: { yo: 'escojo', tu: 'escoges', el: 'escoge', nosotros: 'escogemos', vosotros: 'escogéis', ellos: 'escogen' },
  dirigir: { yo: 'dirijo', tu: 'diriges', el: 'dirige', nosotros: 'dirigimos', vosotros: 'dirigís', ellos: 'dirigen' },
  exigir: { yo: 'exijo', tu: 'exiges', el: 'exige', nosotros: 'exigimos', vosotros: 'exigís', ellos: 'exigen' },
  fingir: { yo: 'finjo', tu: 'finges', el: 'finge', nosotros: 'fingimos', vosotros: 'fingís', ellos: 'fingen' },
  regir: { yo: 'rijo', tu: 'riges', el: 'rige', nosotros: 'regimos', vosotros: 'regís', ellos: 'rigen' },

  // --- i + vocal (huir, construir, oír ya arriba) ---
  huir: { yo: 'huyo', tu: 'huyes', el: 'huye', nosotros: 'huimos', vosotros: 'huís', ellos: 'huyen' },
  construir: { yo: 'construyo', tu: 'construyes', el: 'construye', nosotros: 'construimos', vosotros: 'construís', ellos: 'construyen' },
  destruir: { yo: 'destruyo', tu: 'destruyes', el: 'destruye', nosotros: 'destruimos', vosotros: 'destruís', ellos: 'destruyen' },
  incluir: { yo: 'incluyo', tu: 'incluyes', el: 'incluye', nosotros: 'incluimos', vosotros: 'incluís', ellos: 'incluyen' },
  influir: { yo: 'influyo', tu: 'influyes', el: 'influye', nosotros: 'influimos', vosotros: 'influís', ellos: 'influyen' },
  reunir: { yo: 'reúno', tu: 'reúnes', el: 'reúne', nosotros: 'reunimos', vosotros: 'reunís', ellos: 'reúnen' },

  // --- Reír / freír ---
  reír: { yo: 'río', tu: 'ríes', el: 'ríe', nosotros: 'reímos', vosotros: 'reís', ellos: 'ríen' },
  sonreír: { yo: 'sonrío', tu: 'sonríes', el: 'sonríe', nosotros: 'sonreímos', vosotros: 'sonreís', ellos: 'sonríen' },
  freír: { yo: 'frío', tu: 'fríes', el: 'fríe', nosotros: 'freímos', vosotros: 'freís', ellos: 'fríen' },

  // --- Cambio e → ie (presente) ---
  pensar: { yo: 'pienso', tu: 'piensas', el: 'piensa', nosotros: 'pensamos', vosotros: 'pensáis', ellos: 'piensan' },
  empezar: { yo: 'empiezo', tu: 'empiezas', el: 'empieza', nosotros: 'empezamos', vosotros: 'empezáis', ellos: 'empiezan' },
  cerrar: { yo: 'cierro', tu: 'cierras', el: 'cierra', nosotros: 'cerramos', vosotros: 'cerráis', ellos: 'cierran' },
  encerrar: { yo: 'encierro', tu: 'encierras', el: 'encierra', nosotros: 'encerramos', vosotros: 'encerráis', ellos: 'encierran' },
  negar: { yo: 'niego', tu: 'niegas', el: 'niega', nosotros: 'negamos', vosotros: 'negáis', ellos: 'niegan' },
  calentar: { yo: 'caliento', tu: 'calientas', el: 'calienta', nosotros: 'calentamos', vosotros: 'calentáis', ellos: 'calientan' },
  despertar: { yo: 'despierto', tu: 'despiertas', el: 'despierta', nosotros: 'despertamos', vosotros: 'despertáis', ellos: 'despiertan' },
  contar: { yo: 'cuento', tu: 'cuentas', el: 'cuenta', nosotros: 'contamos', vosotros: 'contáis', ellos: 'cuentan' },
  encontrar: { yo: 'encuentro', tu: 'encuentras', el: 'encuentra', nosotros: 'encontramos', vosotros: 'encontráis', ellos: 'encuentran' },
  volver: { yo: 'vuelvo', tu: 'vuelves', el: 'vuelve', nosotros: 'volvemos', vosotros: 'volvéis', ellos: 'vuelven' },
  devolver: { yo: 'devuelvo', tu: 'devuelves', el: 'devuelve', nosotros: 'devolvemos', vosotros: 'devolvéis', ellos: 'devuelven' },
  resolver: { yo: 'resuelvo', tu: 'resuelves', el: 'resuelve', nosotros: 'resolvemos', vosotros: 'resolvéis', ellos: 'resuelven' },
  recordar: { yo: 'recuerdo', tu: 'recuerdas', el: 'recuerda', nosotros: 'recordamos', vosotros: 'recordáis', ellos: 'recuerdan' },
  acordar: { yo: 'acuerdo', tu: 'acuerdas', el: 'acuerda', nosotros: 'acordamos', vosotros: 'acordáis', ellos: 'acuerdan' },
  costar: { yo: 'cuesto', tu: 'cuestas', el: 'cuesta', nosotros: 'costamos', vosotros: 'costáis', ellos: 'cuestan' },
  mostrar: { yo: 'muestro', tu: 'muestras', el: 'muestra', nosotros: 'mostramos', vosotros: 'mostráis', ellos: 'muestran' },
  probar: { yo: 'pruebo', tu: 'pruebas', el: 'prueba', nosotros: 'probamos', vosotros: 'probáis', ellos: 'prueban' },
  almorzar: { yo: 'almuerzo', tu: 'almuerzas', el: 'almuerza', nosotros: 'almorzamos', vosotros: 'almorzáis', ellos: 'almuerzan' },
  colgar: { yo: 'cuelgo', tu: 'cuelgas', el: 'cuelga', nosotros: 'colgamos', vosotros: 'colgáis', ellos: 'cuelgan' },
  forzar: { yo: 'fuerzo', tu: 'fuerzas', el: 'fuerza', nosotros: 'forzamos', vosotros: 'forzáis', ellos: 'fuerzan' },
  rogar: { yo: 'ruego', tu: 'ruegas', el: 'ruega', nosotros: 'rogamos', vosotros: 'rogáis', ellos: 'ruegan' },
  entender: { yo: 'entiendo', tu: 'entiendes', el: 'entiende', nosotros: 'entendemos', vosotros: 'entendéis', ellos: 'entienden' },
  perder: { yo: 'pierdo', tu: 'pierdes', el: 'pierde', nosotros: 'perdemos', vosotros: 'perdéis', ellos: 'pierden' },
  doler: { yo: 'duelo', tu: 'dueles', el: 'duele', nosotros: 'dolemos', vosotros: 'doléis', ellos: 'duelen' },
  preferir: { yo: 'prefiero', tu: 'prefieres', el: 'prefiere', nosotros: 'preferimos', vosotros: 'preferís', ellos: 'prefieren' },
  mentir: { yo: 'miento', tu: 'mientes', el: 'miente', nosotros: 'mentimos', vosotros: 'mentís', ellos: 'mienten' },
  sentir: { yo: 'siento', tu: 'sientes', el: 'siente', nosotros: 'sentimos', vosotros: 'sentís', ellos: 'sienten' },
  advertir: { yo: 'advierto', tu: 'adviertes', el: 'advierte', nosotros: 'advertimos', vosotros: 'advertís', ellos: 'advierten' },
  convertir: { yo: 'convierto', tu: 'conviertes', el: 'convierte', nosotros: 'convertimos', vosotros: 'convertís', ellos: 'convierten' },
  divertir: { yo: 'divierto', tu: 'diviertes', el: 'divierte', nosotros: 'divertimos', vosotros: 'divertís', ellos: 'divierten' },
  herir: { yo: 'hiero', tu: 'hieres', el: 'hiere', nosotros: 'herimos', vosotros: 'herís', ellos: 'hieren' },

  // --- Cambio o → ue (poder/volver/devolver ya listados arriba con e→ie / frecuentes) ---
  dormir: { yo: 'duermo', tu: 'duermes', el: 'duerme', nosotros: 'dormimos', vosotros: 'dormís', ellos: 'duermen' },
  morir: { yo: 'muero', tu: 'mueres', el: 'muere', nosotros: 'morimos', vosotros: 'morís', ellos: 'mueren' },
  llover: { yo: 'lluevo', tu: 'llueves', el: 'llueve', nosotros: 'llovemos', vosotros: 'llovéis', ellos: 'llueven' },

  // --- Cambio e → i (presente, 1ª-3ª plural distinto) ---
  pedir: { yo: 'pido', tu: 'pides', el: 'pide', nosotros: 'pedimos', vosotros: 'pedís', ellos: 'piden' },
  repetir: { yo: 'repito', tu: 'repites', el: 'repite', nosotros: 'repetimos', vosotros: 'repetís', ellos: 'repiten' },
  servir: { yo: 'sirvo', tu: 'sirves', el: 'sirve', nosotros: 'servimos', vosotros: 'servís', ellos: 'sirven' },
  vestir: { yo: 'visto', tu: 'vistes', el: 'viste', nosotros: 'vestimos', vosotros: 'vestís', ellos: 'visten' },
  medir: { yo: 'mido', tu: 'mides', el: 'mide', nosotros: 'medimos', vosotros: 'medís', ellos: 'miden' },
  despedir: { yo: 'despido', tu: 'despides', el: 'despide', nosotros: 'despedimos', vosotros: 'despedís', ellos: 'despiden' },
  impedir: { yo: 'impido', tu: 'impides', el: 'impide', nosotros: 'impedimos', vosotros: 'impedís', ellos: 'impiden' },

  // --- u → ue (jugar) ---
  jugar: { yo: 'juego', tu: 'juegas', el: 'juega', nosotros: 'jugamos', vosotros: 'jugáis', ellos: 'juegan' },

  // --- Ortografía / tilde (continuar, actuar, enviar) ---
  actuar: { yo: 'actúo', tu: 'actúas', el: 'actúa', nosotros: 'actuamos', vosotros: 'actuáis', ellos: 'actúan' },
  continuar: { yo: 'continúo', tu: 'continúas', el: 'continúa', nosotros: 'continuamos', vosotros: 'continuáis', ellos: 'continúan' },
  evaluar: { yo: 'evalúo', tu: 'evalúas', el: 'evalúa', nosotros: 'evaluamos', vosotros: 'evaluáis', ellos: 'evalúan' },
  enviar: { yo: 'envío', tu: 'envías', el: 'envía', nosotros: 'enviamos', vosotros: 'enviáis', ellos: 'envían' },
  esquiar: { yo: 'esquío', tu: 'esquías', el: 'esquía', nosotros: 'esquiamos', vosotros: 'esquiáis', ellos: 'esquían' },

  // --- Satisfacer (como hacer) ---
  satisfacer: { yo: 'satisfago', tu: 'satisfaces', el: 'satisface', nosotros: 'satisfacemos', vosotros: 'satisfacéis', ellos: 'satisfacen' },
}
