/**
 * Índice de búsqueda de la documentación (términos en español, sin acentos en la lógica de match).
 * Ampliar `keywords` cuando añadas secciones nuevas.
 */
export type DocsSearchEntry = {
  href: string
  title: string
  section: string
  keywords: string
}

export const DOCS_SEARCH_INDEX: DocsSearchEntry[] = [
  {
    href: '/',
    title: 'Bienvenida y guía Luma Grid',
    section: 'Inicio',
    keywords:
      'inicio bienvenida caa comunicacion aumentativa alternativa pictos tablero frase voz familia profesional animacion demo funciones principal admin arrastrar ordenar rejilla feedback stats',
  },
  {
    href: '/empieza-aqui',
    title: 'Recorrido completo desde cero',
    section: 'Empieza aquí',
    keywords:
      'registro register login primeros pasos tablero admin administracion panel configurar editar simbolo celda pictograma base fija zona fija carpeta variante lexico lexema privacidad cuenta preferencias lumagrid.app arrastrar ordenar rejilla guardar cifrado tls https',
  },
  {
    href: '/guia',
    title: 'Resumen de funciones',
    section: 'Guía',
    keywords:
      'resumen funciones pilares voz ia arasaac variantes teclado lexico evaluacion pictos barra frase comunicar conjugar conjugacion autocompletar leer frase voz sin ia no ia reglas lenguaje',
  },
  {
    href: '/voz-ia',
    title: 'Voz con inteligencia artificial',
    section: 'Funciones',
    keywords:
      'voz leer frase alta hablar sintesis tts sugerencias chips prediccion ia inteligencia artificial conjugar natural sistema clonar elevenlabs',
  },
  {
    href: '/arasaac',
    title: 'Pictogramas ARASAAC',
    section: 'Funciones',
    keywords:
      'arasaac pictograma picto simbolo zaragoza licencia cc colegio terapia estandar imagen Sergio Palao',
  },
  {
    href: '/variantes',
    title: 'Variantes de palabra',
    section: 'Funciones',
    keywords:
      'variante palabra conjugacion yo tu ayer mañana genero circular menu sin duplicar boton',
  },
  {
    href: '/teclado-complementativo',
    title: 'Teclado complementativo',
    section: 'Funciones',
    keywords:
      'teclado letras qwerty comunicador modo tablero complemento misma frase barra escribir',
  },
  {
    href: '/lexico-y-evaluacion',
    title: 'Léxico y evaluación de uso',
    section: 'Funciones',
    keywords:
      'lexico vocabulario sugerencia habito informe panel administracion periodo pdf estadistica privado cuenta prediccion datos anonimos cifrado tls https privacidad trafico',
  },
  {
    href: '/preguntas',
    title: 'Preguntas frecuentes',
    section: 'Ayuda',
    keywords:
      'faq duda instalar navegador pwa voz picto sugerencia ia cuenta lumagrid.app feedback contacto escribir stats panel cifrado tls https seguridad privacidad',
  },
  {
    href: '/changelog',
    title: 'Novedades y cambios',
    section: 'Novedades',
    keywords:
      'changelog actualizacion mejora mayo 2026 guia animacion ayuda',
  },
]
