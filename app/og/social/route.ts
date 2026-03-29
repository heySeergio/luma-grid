import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Archivos en la raíz de `public/` (p. ej. `public/og.jpg`). */
const ROOT_CANDIDATES: { name: string; contentType: string }[] = [
  { name: 'og.jpg', contentType: 'image/jpeg' },
  { name: 'OG.jpg', contentType: 'image/jpeg' },
  { name: 'og.jpeg', contentType: 'image/jpeg' },
  { name: 'og.png', contentType: 'image/png' },
  { name: 'og.webp', contentType: 'image/webp' },
]

/** Archivos en `public/og/`. */
const SUBDIR_CANDIDATES: { name: string; contentType: string }[] = [
  { name: 'og.png', contentType: 'image/png' },
  { name: 'og.jpg', contentType: 'image/jpeg' },
  { name: 'og.jpeg', contentType: 'image/jpeg' },
  { name: 'og.webp', contentType: 'image/webp' },
]

export async function GET() {
  const publicDir = join(process.cwd(), 'public')

  for (const { name, contentType } of ROOT_CANDIDATES) {
    try {
      const buf = await readFile(join(publicDir, name))
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      })
    } catch {
      /* siguiente */
    }
  }

  const ogDir = join(publicDir, 'og')
  for (const { name, contentType } of SUBDIR_CANDIDATES) {
    try {
      const buf = await readFile(join(ogDir, name))
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      })
    } catch {
      /* siguiente */
    }
  }

  try {
    const buf = await readFile(join(process.cwd(), 'public', 'icons', 'apple-touch-icon.png'))
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=600',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
