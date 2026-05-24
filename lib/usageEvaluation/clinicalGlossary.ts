/** Definiciones para informes clínicos (UI y PDF). */
export const CLINICAL_GLOSSARY = [
  {
    term: 'Enunciado',
    definition: 'Pulsación de «Hablar» o reproducción de frase rápida con voz.',
  },
  {
    term: 'LME',
    definition: 'Longitud media del enunciado: media de símbolos por mensaje hablado.',
  },
  {
    term: 'Vocabulario activo',
    definition: 'Términos o pictogramas con al menos un uso registrado en el periodo.',
  },
  {
    term: 'Adoptado',
    definition: 'Símbolo añadido al tablero en el periodo con al menos un uso en los 14 días siguientes.',
  },
  {
    term: 'Función comunicativa',
    definition: 'Clasificación heurística automática; no sustituye evaluación profesional.',
  },
  {
    term: 'Ratio retirada',
    definition: 'Proporción de acciones atrás o inicio respecto a entradas en carpeta; indicador orientativo de fricción al buscar pictogramas.',
  },
  {
    term: 'Corrección de composición',
    definition: 'Borrar el último símbolo o vaciar la frase antes de hablar.',
  },
  {
    term: 'Núcleo',
    definition: 'Lexema marcado como núcleo AAC estándar en el catálogo (isCore).',
  },
] as const

export const DEMO_CLINICAL_DISCLAIMER =
  'Tablero de demostración: este informe no debe usarse como historial clínico. Usa un tablero personal del usuario para seguimiento terapéutico.'

export const PRIVACY_PDF_FOOTER =
  'Datos recogidos con consentimiento del titular de la cuenta (compartir uso para predicciones e informes).'
