/** Comunidades autónomas (ISO 3166-2:ES) para mapa y agregación. */
export type SpainCcaaId =
  | 'ES-AN'
  | 'ES-AR'
  | 'ES-AS'
  | 'ES-CB'
  | 'ES-CL'
  | 'ES-CM'
  | 'ES-CT'
  | 'ES-EX'
  | 'ES-GA'
  | 'ES-IB'
  | 'ES-MC'
  | 'ES-MD'
  | 'ES-NC'
  | 'ES-PV'
  | 'ES-RI'
  | 'ES-VC'
  | 'ES-CN'
  | 'ES-CE'
  | 'ES-ML'

export const SPAIN_CCAA: Record<
  SpainCcaaId,
  { name: string; x: number; y: number }
> = {
  'ES-GA': { name: 'Galicia', x: 12, y: 22 },
  'ES-AS': { name: 'Asturias', x: 22, y: 18 },
  'ES-CB': { name: 'Cantabria', x: 30, y: 20 },
  'ES-PV': { name: 'País Vasco', x: 38, y: 24 },
  'ES-RI': { name: 'La Rioja', x: 42, y: 30 },
  'ES-NC': { name: 'Navarra', x: 48, y: 28 },
  'ES-AR': { name: 'Aragón', x: 54, y: 34 },
  'ES-CT': { name: 'Cataluña', x: 72, y: 32 },
  'ES-IB': { name: 'Baleares', x: 82, y: 48 },
  'ES-CL': { name: 'Castilla y León', x: 36, y: 38 },
  'ES-MD': { name: 'Madrid', x: 44, y: 44 },
  'ES-CM': { name: 'Castilla-La Mancha', x: 46, y: 52 },
  'ES-EX': { name: 'Extremadura', x: 28, y: 52 },
  'ES-VC': { name: 'Comunitat Valenciana', x: 58, y: 54 },
  'ES-MC': { name: 'Murcia', x: 56, y: 62 },
  'ES-AN': { name: 'Andalucía', x: 38, y: 72 },
  'ES-CN': { name: 'Canarias', x: 18, y: 88 },
  'ES-CE': { name: 'Ceuta', x: 32, y: 82 },
  'ES-ML': { name: 'Melilla', x: 48, y: 82 },
}

const REGION_ALIASES: Record<string, SpainCcaaId> = {
  AN: 'ES-AN',
  AND: 'ES-AN',
  AR: 'ES-AR',
  ARA: 'ES-AR',
  AS: 'ES-AS',
  AST: 'ES-AS',
  CB: 'ES-CB',
  S: 'ES-CB',
  CL: 'ES-CL',
  CLC: 'ES-CL',
  CM: 'ES-CM',
  CT: 'ES-CT',
  CAT: 'ES-CT',
  EX: 'ES-EX',
  EXC: 'ES-EX',
  GA: 'ES-GA',
  GAL: 'ES-GA',
  IB: 'ES-IB',
  PM: 'ES-IB',
  MC: 'ES-MC',
  MUR: 'ES-MC',
  MD: 'ES-MD',
  MAD: 'ES-MD',
  M: 'ES-MD',
  NC: 'ES-NC',
  NAV: 'ES-NC',
  PV: 'ES-PV',
  PVK: 'ES-PV',
  RI: 'ES-RI',
  LO: 'ES-RI',
  VC: 'ES-VC',
  VAL: 'ES-VC',
  CN: 'ES-CN',
  GC: 'ES-CN',
  CE: 'ES-CE',
  ML: 'ES-ML',
}

export function normalizeSpainRegionCode(raw: string | null | undefined): SpainCcaaId | null {
  if (!raw?.trim()) return null
  let code = raw.trim().toUpperCase()
  if (code.startsWith('ES-')) code = code.slice(3)
  const id = REGION_ALIASES[code]
  return id ?? null
}

export function spainRegionName(code: SpainCcaaId | null): string | null {
  if (!code) return null
  return SPAIN_CCAA[code]?.name ?? code
}
