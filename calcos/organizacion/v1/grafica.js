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
