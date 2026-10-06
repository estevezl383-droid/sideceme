// La F3·P3 en el Word y en la vista previa: el CUADRO (una tabla de verdad, apaisada, no
// renglones de texto) y la ORGANIZACIÓN DE LA TAREA EN FORMA GRÁFICA (el SVG de grafica.js,
// que la Mesa convierte en imagen al armar el .docx).
import { balance, formaGrafica, COLUMNAS } from './modelo.js'
import { simb } from './runtime.js'
import { graficaSVG } from './grafica.js'

export const TITULO_GRAFICA = 'ORGANIZACIÓN DE LA TAREA (FORMA GRÁFICA)'
const ANCHOS = [14, 20, 22, 18, 18, 10]

export function formaDe(ctx = {}, g3 = {}) {
  const unidades = ctx.SIDdn || ctx.unidades || []
  const bal = balance({ ops: ctx.ops || {}, g3: g3 || {}, unidades }, simb)
  return formaGrafica(bal, { unidades, orgTarea: ctx.orgTarea || [] }, simb)
}

// Las secciones del Word: el cuadro con sus columnas y, si hay organización, la forma gráfica.
// `filas` son los renglones de la hoja; `antes`, lo que la Mesa armaba sola (por si no hay cuadro).
export function seccionesWord(filas, ctx, g3, antes) {
  const lista = (Array.isArray(filas) ? filas : []).filter((f) => f && Object.values(f).some((v) => String(v ?? '').trim()))
  const out = []
  if (lista.length) {
    const cols = COLUMNAS.filter((c) => lista.some((f) => String(f[c] ?? '').trim())).length ? COLUMNAS : Object.keys(lista[0])
    const usadas = cols.filter((c) => lista.some((f) => String(f[c] ?? '').trim()))
    out.push({ titulo: 'CUADRO DE LA FORMACIÓN INICIAL', tabla: { cabecera: usadas.map((c) => c.toUpperCase()), filas: lista.map((f) => usadas.map((c) => String(f[c] ?? ''))), anchos: usadas.map((c) => ANCHOS[COLUMNAS.indexOf(c)] || 15) } })
  } else if (antes) out.push(...antes)
  const svg = graficaSVG(formaDe(ctx, g3))
  if (svg) out.push({ titulo: TITULO_GRAFICA, svg })
  return out
}
export function especificacionWord(base, filas, ctx, g3, antes) {
  const secciones = seccionesWord(filas, ctx, g3, antes)
  return secciones.length ? { ...base, orientacion: 'apaisada', secciones } : null
}

// La vista previa: la forma gráfica debajo del cuadro (como imagen, así el .doc no la rompe).
export function previaConGrafica(hoja, html, ctx, g3) {
  if (hoja?.id !== 'organizacion' || typeof html !== 'string') return html
  const svg = graficaSVG(formaDe(ctx, g3))
  if (!svg) return html
  let bin = ''
  for (const b of new TextEncoder().encode(svg)) bin += String.fromCharCode(b)
  const b64 = btoa(bin)
  const bloque = `<h2 style="text-align:center;font-size:13pt;margin-top:18pt">${TITULO_GRAFICA}</h2><p style="text-align:center"><img alt="${TITULO_GRAFICA}" style="max-width:100%" src="data:image/svg+xml;base64,${b64}"></p>`
  const i = html.indexOf('<p class="pie">')
  return i >= 0 ? html.slice(0, i) + bloque + html.slice(i) : html.replace('</body>', bloque + '</body>')
}
