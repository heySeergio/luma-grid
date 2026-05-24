/** Lienzo fijo (px @ 16px/rem). Solo escala el conjunto en responsive. */
export const HERO_COMPOSITION_ARTBOARD = {
  width: 512,
  height: 440,
} as const

export const HERO_COMPOSITION_LAYOUT = {
  tablet: { left: 32, top: 24, width: 416 },
  speech: { left: 0, top: 240, width: 151 },
  cara: { left: 384, top: 0, width: 96 },
  nina: { left: 288, top: 208, width: 208 },
} as const

export const HERO_COMPOSITION_Z_INDEX = {
  tablet: 0,
  speech: 10,
  cara: 20,
  nina: 30,
} as const
