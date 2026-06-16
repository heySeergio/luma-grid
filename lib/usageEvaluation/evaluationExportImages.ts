export type ExportBrandImage = {
  dataUrl: string
  width: number
  height: number
}

export type ExportBrandImages = {
  casaNuma: ExportBrandImage
  lumaGrid: ExportBrandImage
}

let cache: Promise<ExportBrandImages> | null = null

function loadImage(src: string): Promise<ExportBrandImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo preparar el logo para el PDF.'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    img.src = src
  })
}

/** Logos de marca para informes (cache en memoria durante la sesión). */
export function loadExportBrandImages(): Promise<ExportBrandImages> {
  if (!cache) {
    cache = Promise.all([loadImage('/casa-numa-logo.png'), loadImage('/logo-luma-grid.png')]).then(
      ([casaNuma, lumaGrid]) => ({ casaNuma, lumaGrid }),
    )
  }
  return cache
}
