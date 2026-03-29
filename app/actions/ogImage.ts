'use server'

import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_BYTES = 2 * 1024 * 1024

const SUPABASE_OBJECT = 'og/luma-social'

export type UploadOgImageResult =
  | { ok: true; url: string; hint?: string }
  | { ok: false; error: string }

export async function uploadOgImage(formData: FormData): Promise<UploadOgImageResult> {
  const secret = process.env.OG_UPLOAD_SECRET?.trim()
  const token = String(formData.get('token') ?? '').trim()
  if (!secret || token !== secret) {
    return { ok: false, error: 'Token incorrecto o OG_UPLOAD_SECRET no configurado en el servidor.' }
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: 'Selecciona un archivo de imagen.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Máximo 2 MB.' }
  }
  const type = (file as File).type
  if (!ALLOWED.has(type)) {
    return { ok: false, error: 'Formato no permitido. Usa PNG, JPG o WebP.' }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png'
  const objectPath = `${SUPABASE_OBJECT}.${ext}`

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (supabaseUrl && serviceKey) {
    const bucket = (process.env.SUPABASE_OG_BUCKET || 'public').replace(/\/$/, '')
    const supabase = createClient(supabaseUrl, serviceKey)
    const { error } = await supabase.storage.from(bucket).upload(objectPath, buf, {
      contentType: type,
      upsert: true,
    })
    if (error) {
      return { ok: false, error: `Supabase: ${error.message}` }
    }
    const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`
    return {
      ok: true,
      url: publicUrl,
      hint: 'Añade en Vercel (o .env) NEXT_PUBLIC_OG_IMAGE_URL con esta URL para que meta tags y redes usen la imagen nueva sin depender de /og/social.',
    }
  }

  if (process.env.VERCEL === '1') {
    return {
      ok: false,
      error:
        'En Vercel hace falta Supabase: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY y un bucket público (p. ej. SUPABASE_OG_BUCKET=public). O despliega un archivo en public/og/og.png en el repo.',
    }
  }

  const dir = join(process.cwd(), 'public', 'og')
  await mkdir(dir, { recursive: true })
  const localName = ext === 'png' ? 'og.png' : `og.${ext}`
  await writeFile(join(dir, localName), buf)
  return {
    ok: true,
    url: '/og/social',
    hint: 'Imagen guardada en public/og/. La ruta /og/social la servirá al reiniciar el servidor.',
  }
}
