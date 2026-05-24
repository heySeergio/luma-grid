/**
 * Vercel (Next.js 16) puede hacer lstat de `.next/routes-manifest-deterministic.json`
 * en la finalización del deploy. Next solo escribe `routes-manifest.json`; este script
 * genera la copia determinista (sin headers ni deploymentId) que espera la plataforma.
 */
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const nextDir = path.join(projectRoot, '.next')
const src = path.join(nextDir, 'routes-manifest.json')
const dest = path.join(nextDir, 'routes-manifest-deterministic.json')

if (!fs.existsSync(src)) {
  console.error(
    `[postbuild] No existe ${path.relative(projectRoot, src)}. El build de Next no terminó correctamente.`,
  )
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(src, 'utf8'))
manifest.headers = []
delete manifest.deploymentId

fs.writeFileSync(dest, JSON.stringify(manifest))
console.log(`[postbuild] Escrito ${path.relative(projectRoot, dest)}`)
