export function escapeCsvCell(value: string): string {
  const s = value.replace(/\r\n/g, '\n')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([`\ufeff${text}`], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type FeedbackCsvRow = {
  id: string
  anonymous: boolean
  email: string | null
  message: string
  createdAt: string
  type?: string | null
  rating?: number | null
}

export function toFeedbackCsv(rows: FeedbackCsvRow[]): string {
  const header = ['id', 'fecha', 'anonimo', 'email', 'tipo', 'rating', 'mensaje']
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.createdAt,
        r.anonymous ? 'si' : 'no',
        r.email ?? '',
        r.type ?? '',
        r.rating != null ? String(r.rating) : '',
        r.message,
      ]
        .map((c) => escapeCsvCell(c))
        .join(','),
    ),
  ]
  return lines.join('\n')
}

export type WaitlistCsvRow = {
  id: string
  name: string
  email: string
  createdAt: string
}

export function toWaitlistCsv(rows: WaitlistCsvRow[]): string {
  const header = ['id', 'fecha', 'nombre', 'email']
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [r.id, r.createdAt, r.name, r.email].map((c) => escapeCsvCell(c)).join(','),
    ),
  ]
  return lines.join('\n')
}
