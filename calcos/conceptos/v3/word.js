import { Document, Packer, Paragraph, ImageRun, PageOrientation } from './runtime.js'
import { laminasConceptos, ANCHO, ALTO } from './laminas.js'

// El Word lleva las MISMAS láminas que se ven en la aplicación, una por hoja apaisada
// (carta), como imagen de alta resolución: la forma del ejemplo del PMTD no se
// desarma al abrirlo en otra computadora. El contenido se edita en la Mesa y se
// vuelve a bajar.
const ESCALA = 2.6 // 2860 × 2210 px: ~290 ppp sobre la hoja carta
export async function svgAPng(svg, escala = ESCALA) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('No se pudo dibujar la lámina.'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(ANCHO * escala)
    canvas.height = Math.round(ALTO * escala)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Este navegador no permite dibujar la lámina (canvas).')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('No se pudo generar la imagen de la lámina.')
    return new Uint8Array(await blob.arrayBuffer())
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Hoja carta apaisada: 11 × 8,5 pulgadas. La lámina ocupa 9,84 × 7,6 pulgadas.
const IMG_W = 944
const IMG_H = Math.round((IMG_W * ALTO) / ANCHO)
export async function crearWordConceptos(valor, op = {}, rasterizar = svgAPng) {
  const laminas = laminasConceptos(valor, op)
  const secciones = []
  for (const [i, svg] of laminas.entries()) {
    const data = await rasterizar(svg)
    secciones.push({
      properties: { page: { size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE }, margin: { top: 560, bottom: 480, left: 800, right: 700 } } },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              data,
              type: 'png',
              transformation: { width: IMG_W, height: IMG_H },
              altText: { id: i + 1, name: `Conceptos entrelazados hoja ${i + 1}`, title: 'Conceptos entrelazados', description: `Hoja ${i + 1} de ${laminas.length}. Editar los datos en la Mesa del Estado Mayor (SIDECEME).` },
            }),
          ],
        }),
      ],
    })
  }
  return Packer.toBlob(new Document({ creator: 'SIDECEME — Mesa del Estado Mayor', title: 'F2·P1 Conceptos entrelazados', sections: secciones }))
}
export async function descargarConceptosWord(valor, op = {}) {
  const blob = await crearWordConceptos(valor, op)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'F2P1_Conceptos_entrelazados.docx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
