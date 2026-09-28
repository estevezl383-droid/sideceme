import { Document, Packer, Paragraph, ImageRun, PageOrientation } from './runtime.js'
import { laminasConceptos } from './modelo.js'

// Una misma composición para la vista previa y Word. Las láminas son imágenes
// en Word; sus datos siguen siendo editables en el formulario de la aplicación.
export async function svgAPng(svg) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    await new Promise((resolve,reject)=>{ img.onload=resolve; img.onerror=()=>reject(new Error('No se pudo renderizar la lámina.')); img.src=url })
    const canvas=document.createElement('canvas'); canvas.width=2200; canvas.height=1600
    const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Canvas no disponible.')
    ctx.drawImage(img,0,0,2200,1600)
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'))
    if(!blob) throw new Error('No se pudo generar la imagen de la lámina.')
    return new Uint8Array(await blob.arrayBuffer())
  } finally { URL.revokeObjectURL(url) }
}
export async function crearWordConceptos(valor, rasterizar = svgAPng) {
  const secciones=[]
  for(const svg of laminasConceptos(valor)) {
    const data=await rasterizar(svg)
    secciones.push({ properties:{ page:{ size:{ width:12240,height:15840,orientation:PageOrientation.LANDSCAPE }, margin:{top:540,bottom:540,left:540,right:540} } },
      children:[new Paragraph({ spacing:{before:0,after:0}, children:[new ImageRun({data,type:'png',transformation:{width:980,height:713},altText:{title:'Conceptos entrelazados',description:'Hoja gráfica. Editar los datos en SIDE-CEME.'}})] })] })
  }
  return Packer.toBlob(new Document({sections:secciones}))
}
export async function descargarConceptosWord(valor) {
  const blob=await crearWordConceptos(valor), url=URL.createObjectURL(blob), a=document.createElement('a')
  a.href=url; a.download='F2P1_Conceptos_entrelazados.docx'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
