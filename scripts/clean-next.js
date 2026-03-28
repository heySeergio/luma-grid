/**
 * Elimina la carpeta .next (build y caché de Webpack).
 * Detén antes `npm run dev` para evitar archivos bloqueados en Windows.
 */
const fs = require('fs')
const path = require('path')

const target = path.join(__dirname, '..', '.next')

try {
  fs.rmSync(target, { recursive: true, force: true })
  console.log('[clean-next] Carpeta .next eliminada.')
} catch (e) {
  if (e && e.code === 'ENOENT') {
    console.log('[clean-next] No había carpeta .next.')
  } else {
    console.error('[clean-next]', e.message)
    process.exit(1)
  }
}
