// La ORGANIZACIÓN DE LA TAREA en forma gráfica, como el ejemplo de la Escuela: una caja por
// operación (OPERACIÓN DECISIVA, OPERACIÓN DE CONFIGURACIÓN 1…), con la marca del escalón
// arriba, las unidades genéricas adentro y el nombre al costado; y «BAJO CONTROL» con la
// reserva y las unidades que no se reparten. Es HTML con los SVG de las piezas de la Mesa:
// se ve en la hoja y se imprime tal cual.
import { marcaDe } from './modelo.js'
import { svgPieza } from './runtime.js'

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function caja({ escalon, piezas = [], simbolo = null, nombre = '', vacia = 'sin unidades' }, tam = 34) {
  const marca = marcaDe(escalon)
  // Una unidad entera (bajo control): su símbolo con la marca del escalón encima, sin otra caja.
  if (simbolo)
    return `<div style="display:flex;align-items:center;gap:8px;justify-content:center">
<div style="display:flex;flex-direction:column;align-items:center">${marca ? `<div style="font:700 11px Arial,Helvetica,sans-serif;line-height:12px">${esc(marca)}</div>` : ''}<span style="line-height:0">${svgPieza(simbolo, 64, '#000')}</span></div>
${nombre ? `<div style="font:700 12px Arial,Helvetica,sans-serif;max-width:110px;word-break:break-word">${esc(nombre)}</div>` : ''}</div>`
  const dentro = piezas.length
      ? piezas.map((p) => `<span style="line-height:0" title="${esc(p.nom || '')}">${svgPieza(p.simbolo, tam, '#000')}</span>`).join('')
      : `<span style="font-size:10px;color:#666;font-style:italic">${esc(vacia)}</span>`
  return `<div style="display:flex;align-items:center;gap:8px;justify-content:center">
<div style="position:relative;border:2px solid #000;min-width:140px;max-width:250px;padding:7px 6px;margin-top:${marca ? 17 : 0}px;background:#fff">
${marca ? `<div style="position:absolute;top:-17px;left:50%;transform:translateX(-50%);border:2px solid #000;border-bottom:none;background:#fff;padding:0 6px;font:700 11px Arial,Helvetica,sans-serif;line-height:14px;white-space:nowrap">${esc(marca)}</div>` : ''}
<div style="display:flex;flex-wrap:wrap;gap:4px 5px;justify-content:center;align-items:center">${dentro}</div></div>
${nombre ? `<div style="font:700 12px Arial,Helvetica,sans-serif;max-width:110px;word-break:break-word">${esc(nombre)}</div>` : ''}</div>`
}

export function graficaHTML(forma) {
  const bloques = forma.cajas.map(
    (c) => `<div style="break-inside:avoid">
<div style="font:800 14px Arial,Helvetica,sans-serif;text-align:center;margin-bottom:2px">${esc(c.titulo)}</div>
${caja({ escalon: c.escalon, piezas: c.piezas, nombre: c.nombre || '……………' })}
${c.tarea ? `<div style="font:10.5px Arial,Helvetica,sans-serif;text-align:center;margin-top:3px">Tarea: ${esc(c.tarea)}</div>` : ''}</div>`,
  )
  if (forma.bajo.length)
    bloques.push(`<div style="break-inside:avoid">
<div style="font:800 14px Arial,Helvetica,sans-serif;text-align:center;margin-bottom:2px">BAJO CONTROL</div>
<div style="display:flex;flex-direction:column;gap:8px;align-items:center">${forma.bajo.map((c) => caja({ escalon: c.escalon, piezas: c.piezas, simbolo: c.simbolo, nombre: c.nombre }, 28)).join('')}</div></div>`)
  if (!bloques.length) return '<div style="font:12px Arial,Helvetica,sans-serif;color:#555;padding:10px">Todavía no hay tareas con operación (OD / OC) ni unidades repartidas.</div>'
  return `<div style="background:#fff;color:#000;padding:12px 10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px 14px;align-items:start">${bloques.join('')}</div>`
}

export function abrirParaImprimir(forma, { titulo = 'Organización de la Tarea (forma gráfica)', unidad = '' } = {}) {
  const w = window.open('', '_blank')
  if (!w) {
    window.alert('El navegador no dejó abrir la ventana para imprimir (ventanas emergentes bloqueadas).')
    return
  }
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
<style>body{margin:16mm 12mm;font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff}h1{font-size:15px;margin:0 0 10px}@media print{button{display:none}}</style></head><body>
<h1>${esc(titulo)}${unidad ? ` — ${esc(unidad)}` : ''}</h1>${graficaHTML(forma)}
<p><button onclick="print()">🖨️ Imprimir</button></p></body></html>`)
  w.document.close()
}

// ─── La misma forma gráfica como SVG puro (sin HTML adentro), para el Word y la vista previa ───
// El Word la convierte en imagen (la Mesa dibuja el SVG en un canvas): por eso no lleva
// foreignObject ni CSS, sólo rectángulos, textos y los SVG de las piezas.
const ANCHO_COL = 330
const SEP = 22
const MARGEN = 12
const PIEZA = [32, 19]
const xml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
function partir(texto, max) {
  const out = []
  let linea = ''
  for (const p of String(texto || '').split(/\s+/).filter(Boolean)) {
    if ((linea + ' ' + p).trim().length > max && linea) {
      out.push(linea)
      linea = p
    } else linea = (linea + ' ' + p).trim()
  }
  if (linea) out.push(linea)
  return out
}
const texto = (x, y, t, { tam = 12, negrita = false, ancla = 'start' } = {}) =>
  `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${tam}"${negrita ? ' font-weight="bold"' : ''} text-anchor="${ancla}" fill="#000">${xml(t)}</text>`
const pieza = (x, y, simbolo, ancho = PIEZA[0]) => `<g transform="translate(${x},${y})">${svgPieza(simbolo, ancho, '#000')}</g>`

// Una caja (agrupación o reserva) con la marca del escalón arriba y el nombre al costado.
function cajaSVG(x0, y0, { escalon, piezas = [], nombre = '' }) {
  const marca = marcaDe(escalon)
  const porFila = 5
  const filas = Math.max(1, Math.ceil(piezas.length / porFila))
  const bw = 12 + Math.min(porFila, Math.max(piezas.length, 4)) * (PIEZA[0] + 4)
  const bh = 10 + filas * (PIEZA[1] + 6)
  const nombreL = partir(nombre, 15).slice(0, 3)
  const total = bw + (nombreL.length ? 8 + 112 : 0)
  const bx = x0 + Math.max(0, (ANCHO_COL - total) / 2)
  const by = y0 + (marca ? 16 : 0)
  const partes = []
  if (marca) {
    const tw = 12 + marca.length * 8
    partes.push(`<rect x="${bx + bw / 2 - tw / 2}" y="${y0}" width="${tw}" height="16" fill="#fff" stroke="#000" stroke-width="2"/>`, texto(bx + bw / 2, y0 + 12.5, marca, { tam: 11, negrita: true, ancla: 'middle' }))
  }
  partes.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#fff" stroke="#000" stroke-width="2"/>`)
  if (!piezas.length) partes.push(texto(bx + bw / 2, by + bh / 2 + 4, 'sin unidades', { tam: 10, ancla: 'middle' }))
  piezas.forEach((p, i) => {
    const fila = Math.floor(i / porFila)
    const enFila = Math.min(porFila, piezas.length - fila * porFila)
    const ancho = enFila * (PIEZA[0] + 4) - 4
    partes.push(pieza(bx + (bw - ancho) / 2 + (i % porFila) * (PIEZA[0] + 4), by + 8 + fila * (PIEZA[1] + 6), p.simbolo))
  })
  nombreL.forEach((l, i) => partes.push(texto(bx + bw + 8, by + bh / 2 + 4 + (i - (nombreL.length - 1) / 2) * 14, l, { tam: 12, negrita: true })))
  return { svg: partes.join(''), alto: (by - y0) + bh }
}
// Una unidad entera bajo control: su símbolo con la marca del escalón encima.
function unidadSVG(x0, y0, { escalon, simbolo, nombre }) {
  const marca = marcaDe(escalon)
  const w = 58
  const nombreL = partir(nombre, 18).slice(0, 3)
  const total = w + 8 + 130
  const bx = x0 + Math.max(0, (ANCHO_COL - total) / 2)
  const partes = []
  if (marca) partes.push(texto(bx + w / 2, y0 + 11, marca, { tam: 11, negrita: true, ancla: 'middle' }))
  partes.push(pieza(bx, y0 + (marca ? 14 : 0), simbolo, w))
  const h = (marca ? 14 : 0) + Math.round(w * 0.6)
  nombreL.forEach((l, i) => partes.push(texto(bx + w + 8, y0 + h / 2 + 8 + (i - (nombreL.length - 1) / 2) * 14, l, { tam: 12, negrita: true })))
  return { svg: partes.join(''), alto: h }
}
function bloqueSVG(x0, y0, b) {
  const partes = [texto(x0 + ANCHO_COL / 2, y0 + 15, b.titulo, { tam: 14, negrita: true, ancla: 'middle' })]
  let y = y0 + 26
  for (const it of b.items) {
    const r = it.simbolo ? unidadSVG(x0, y, it) : cajaSVG(x0, y, it)
    partes.push(r.svg)
    y += r.alto + 4
    if (it.tarea) {
      partes.push(texto(x0 + ANCHO_COL / 2, y + 10, `Tarea: ${it.tarea}`, { tam: 10.5, ancla: 'middle' }))
      y += 14
    }
    y += 8
  }
  return { svg: partes.join(''), alto: y - y0 }
}
export function graficaSVG(forma) {
  const bloques = forma.cajas.map((c) => ({ titulo: c.titulo, items: [{ escalon: c.escalon, piezas: c.piezas, nombre: c.nombre || '……………', tarea: c.tarea }] }))
  if (forma.bajo.length) bloques.push({ titulo: 'BAJO CONTROL', items: forma.bajo.map((c) => (c.simbolo ? { escalon: c.escalon, simbolo: c.simbolo, nombre: c.nombre } : { escalon: c.escalon, piezas: c.piezas, nombre: c.nombre })) })
  if (!bloques.length) return ''
  const partes = []
  let y = MARGEN
  for (let i = 0; i < bloques.length; i += 2) {
    const a = bloqueSVG(MARGEN, y, bloques[i])
    const b = bloques[i + 1] ? bloqueSVG(MARGEN + ANCHO_COL + SEP, y, bloques[i + 1]) : { svg: '', alto: 0 }
    partes.push(a.svg, b.svg)
    y += Math.max(a.alto, b.alto) + 14
  }
  const W = MARGEN * 2 + ANCHO_COL * 2 + SEP
  const H = Math.ceil(y + MARGEN - 14)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${partes.join('')}</svg>`
}
