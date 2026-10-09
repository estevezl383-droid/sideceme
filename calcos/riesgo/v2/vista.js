// La matriz en HTML: la vista previa de la pantalla y la carpeta del G-3. Con estilos
// en línea (la carpeta se baja como .doc y Word no lee hojas de estilo sueltas).
// Misma forma que el Word: membrete, título, A–D, E–J por tarea y obstáculo, K con el
// nivel general encerrado en un círculo, firma.
import { normalizarRiesgo, rotulosDe, membreteDe, lineasMembrete, firmaDe, tituloDe, nivelInicial, nivelResidual, textoNivel, nivelGeneral, NIVELES, limpio, texto, ESC, porcentajeTab } from './modelo.js'
import { PROPORCION, ANCHO_UTIL } from './word.js'

const F = 'font-family:Arial,Helvetica,sans-serif;'
const TD = `${F}border:1px solid #000;padding:3px 5px;font-size:10pt;line-height:1.25;`
const html = (t) => ESC(texto(t)).replace(/\n/g, '<br>')
const B = (t) => `<b>${html(t)}</b>`

function lista(items, vineta) {
  const xs = (items || []).map(limpio).filter(Boolean)
  if (!xs.length) return ''
  if (!vineta) return xs.map((x) => `<div style="margin:0 0 2px">${html(x)}</div>`).join('')
  return xs.map((x) => `<div style="margin:0 0 2px;padding-left:13px;text-indent:-13px">${vineta}&nbsp;${html(x)}</div>`).join('')
}
function nivel(n, prob, sev, rot) {
  const t = textoNivel(n, prob, sev, rot)
  return t ? `<b>${html(t)}</b>` : ''
}

// Fragmento: membrete, título, matriz y firma (o sólo la matriz, para la carpeta del
// G-3, que ya lleva su membrete arriba y un título por hoja).
export function matrizHTML(valor, { ctx = {}, hoja = null, soloMatriz = false } = {}) {
  const v = normalizarRiesgo(valor)
  const R = rotulosDe(v)
  const m = membreteDe(v, ctx)
  const va = R.alinear === 'center' ? 'middle' : 'top'
  const vinH = R.vinetaH === 'check' ? '✓' : '-'
  const vinJ = R.vinetaJ === 'guion' ? '-' : ''
  const suma = PROPORCION.reduce((s, x) => s + x, 0)
  const pct = PROPORCION.map((x) => ((x / suma) * 100).toFixed(2))
  // «CG. …» debajo de la R de SECRETO, como en el Word.
  const tab = porcentajeTab({ clasificacion: limpio(m.clasificacion) || 'SECRETO', anchoTexto: ANCHO_UTIL }).toFixed(1)
  const memb = lineasMembrete(m)
    .map((l) => `<div style="${F}font-size:10pt;font-weight:bold;display:flex;margin:0;line-height:1.2"><span style="flex:0 0 ${tab}%">${ESC(l.izq)}</span>${l.der ? `<span>${ESC(l.der)}</span>` : ''}</div>`)
    .join('')
  const filas = []
  filas.push(
    `<tr><td colspan="3" style="${TD}">${B(R.A)}<div style="text-align:justify">${html(v.mision)}</div></td><td style="${TD}">${B(R.B)}<div><b>${ESC(R.empieza)}</b> ${html(v.empieza)}</div><div><b>${ESC(R.termina)}</b> ${html(v.termina)}</div></td><td colspan="2" style="${TD}">${B(R.C)}<div>${html(v.preparacion)}</div></td></tr>`,
  )
  filas.push(`<tr><td colspan="6" style="${TD}"><b>${ESC(R.D)}</b> ${html(v.preparadoPor)}</td></tr>`)
  filas.push(`<tr>${['E', 'F', 'G', 'H', 'I', 'J'].map((k) => `<td style="${TD}text-align:center;vertical-align:middle;font-weight:bold">${ESC(R[k]).replace(/\//g, '/<wbr>')}</td>`).join('')}</tr>`)
  const tareas = v.tareas.length ? v.tareas : [{ tarea: '', peligros: [] }, { tarea: '', peligros: [] }, { tarea: '', peligros: [] }]
  for (const t of tareas) {
    const ps = t.peligros.length ? t.peligros : [{ peligro: '', controles: [], implementar: [] }]
    ps.forEach((p, j) => {
      const tt = R.tareaMayusculas ? `<b>${html(limpio(t.tarea).toUpperCase())}</b>` : html(t.tarea)
      filas.push(
        `<tr style="page-break-inside:avoid">${j === 0 ? `<td rowspan="${ps.length}" style="${TD}text-align:center;vertical-align:${va}">${tt || '&nbsp;'}</td>` : ''}<td style="${TD}text-align:center;vertical-align:${va}">${html(p.peligro) || '&nbsp;'}</td><td style="${TD}text-align:center;vertical-align:${va}">${nivel(nivelInicial(p), p.prob, p.sev, v.rotulos)}</td><td style="${TD}vertical-align:${va}">${lista(p.controles, vinH)}</td><td style="${TD}text-align:center;vertical-align:${va}">${nivel(nivelResidual(p), p.probRes, p.sevRes, v.rotulos)}</td><td style="${TD}vertical-align:${va}">${lista(p.implementar, vinJ)}</td></tr>`,
      )
    })
  }
  const g = nivelGeneral(v).nivel
  const niveles = NIVELES.map((n) => `<td style="${F}font-size:10pt;font-weight:bold;text-align:center;border:none;padding:6px 2px">${n.id === g ? `<span style="border:1.5px solid #000;border-radius:50%;padding:4px 12px;white-space:nowrap">${ESC(n.rotulo)}</span>` : `<span style="white-space:nowrap">${ESC(n.rotulo)}</span>`}</td>`).join('')
  filas.push(`<tr><td colspan="6" style="${TD}"><b>${ESC(R.K)}</b><table style="width:100%;border-collapse:collapse;margin:4px 0 2px"><tr>${niveles}</tr></table></td></tr>`)
  const tabla = `<table style="${F}border-collapse:collapse;width:100%;table-layout:fixed;font-size:10pt"><colgroup>${pct.map((p) => `<col style="width:${p}%">`).join('')}</colgroup>${filas.join('\n')}</table>`
  if (soloMatriz) return `<div style="${F}color:#000">${tabla}</div>`
  return `<div style="${F}color:#000">
${memb}
<div style="${F}text-align:center;font-weight:bold;font-size:16pt;margin:14px 0 10px">${ESC(tituloDe(hoja))}</div>
${tabla}
<div style="${F}text-align:center;font-weight:bold;font-size:12pt;margin:52px 0 8px">${ESC(firmaDe(v, ctx))}</div>
</div>`
}
export const matrizCarpetaHTML = (valor, op = {}) => matrizHTML(valor, { ...op, soloMatriz: true })

// La hoja entera (carta apaisada) para el visor: con la clasificación arriba y abajo.
export function paginaRiesgoHTML(valor, op = {}) {
  const m = membreteDe(normalizarRiesgo(valor), op.ctx || {})
  const clas = ESC(limpio(m.clasificacion) || 'SECRETO')
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${ESC(tituloDe(op.hoja))}</title>
<style>html,body{margin:0;background:#5d6470}body{padding:14px 10px 30px;font-family:Arial,Helvetica,sans-serif}.hoja{background:#fff;color:#000;width:1056px;margin:0 auto;padding:26px 44px 22px 52px;box-shadow:0 4px 18px rgba(0,0,0,.45);box-sizing:border-box}.clas{text-align:center;font-weight:bold;font-size:12pt;margin:0 0 12px}.pie{text-align:center;font-weight:bold;font-size:12pt;margin-top:18px}.nota{max-width:1056px;margin:8px auto 0;color:#e6eef6;font-size:12px;text-align:center}</style></head>
<body><div class="hoja"><div class="clas">${clas}</div>${matrizHTML(valor, op)}<div class="pie">${clas}</div></div>
<div class="nota">Vista previa. El Word (formato militar) va en hoja carta apaisada, con ${clas} arriba y abajo de cada página y la numeración «1 - 2» al pie.</div>
<script>(function(){function ajustar(){var h=document.querySelector('.hoja');if(!h)return;var a=document.documentElement.clientWidth-20;h.style.zoom=a<1056?String(a/1056):'';}ajustar();addEventListener('resize',ajustar);})()</script></body></html>`
}
