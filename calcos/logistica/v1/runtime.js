// Lo que la Mesa (el compilado) le presta al módulo de logística del G-4, y el PUENTE
// con el calco:
//
//   · configurarLogistica(): React, el panel «🤖 Trabajar esta hoja con IA» (hU), el
//     encabezado de los pedidos (Qq), el corrector de terminología (uU), el formato
//     militar (Word, vista previa y registro), el catálogo de instalaciones (Ni), la
//     coordenada de la Mesa (Sc) y Leaflet (para dibujar las medidas en la carta);
//   · sincronizarLogistica(): en cada cambio del calco la Mesa pasa el estado vivo
//     (ops, fichas, fases del COA, concepto de apoyo, misión de logística) y las
//     ACCIONES que permiten «acostar» sobre el calco (trazar un área o un eje, marcar
//     un área como propuesta o elegida, desplegar el Batallón Logístico).
//
// Las pantallas se suscriben con useCalco() y se redibujan solas.
import { configurarCoordenadas } from './modelo.js'
import { limpiar, centroide, circulo, paralela, parMasCercano, fmtKm } from './geo.js'
import { frenteDe } from './analisis.js'

let entorno = {}
export function configurarLogistica(v) {
  entorno = v || {}
  configurarCoordenadas(entorno.coordenada)
}
export const useState = (...a) => entorno.useState(...a)
export const useEffect = (...a) => entorno.useEffect(...a)
export const jsx = (...a) => entorno.jsx(...a)
export const jsxs = (...a) => entorno.jsxs(...a)
const fn = (k) => (typeof entorno[k] === 'function' ? entorno[k] : null)
export const panelIA = () => entorno.PanelIA || null
// Un elemento de React montado en <body> (si la Mesa presta createPortal); si no, en el lugar.
export const enBody = (el) => (typeof entorno.portal === 'function' && typeof document !== 'undefined' ? entorno.portal(el, document.body) : el)
export const encabezadoIA = () => entorno.encabezadoIA || ''
export const corregirIA = () => fn('corregirIA')
export const wordMilitar = () => fn('wordMilitar')
export const registroMilitar = () => fn('registroMilitar')
export const vistaMilitar = () => fn('vistaMilitar')
export const mostrarDocx = () => fn('mostrarDocx')
export const catalogo = () => fn('catalogo')

// ─── El calco vivo ──────────────────────────────────────────────────────────────────
let calco = { ops: {}, unidades: [], cmoc: {}, fasesCOA: {}, conceptoApoyo: [], misionLog: '', herramienta: null, zonaLogTipo: 'asdi' }
let acciones = {}
const subs = new Set()
export function sincronizarLogistica(d = {}) {
  calco = {
    ops: d.ops || {},
    unidades: Array.isArray(d.unidades) ? d.unidades : [],
    cmoc: d.cmoc && typeof d.cmoc === 'object' ? d.cmoc : {},
    fasesCOA: d.fasesCOA || {},
    conceptoApoyo: Array.isArray(d.conceptoApoyo) ? d.conceptoApoyo : [],
    misionLog: d.misionLog || '',
    herramienta: d.herramienta || null,
    zonaLogTipo: d.zonaLogTipo || 'asdi',
  }
  acciones = d.acciones || {}
  if (typeof d.portal === 'function') entorno.portal = d.portal
  for (const f of [...subs]) {
    try {
      f()
    } catch {}
  }
}
export const calcoActual = () => calco
export function useCalco() {
  const [, set] = useState(0)
  useEffect(() => {
    const f = () => set((x) => x + 1)
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  return calco
}
// La acción de la Mesa (o null si esta versión no la tiene).
export const accion = (k) => (typeof acciones[k] === 'function' ? acciones[k] : null)
export const hayPuente = () => Object.keys(acciones).length > 0

// ─── Ver en la carta ────────────────────────────────────────────────────────────────
const mapa = () => (typeof window !== 'undefined' ? window.__mapa2d || null : null)
export function verEnCarta(listas = []) {
  const m = mapa()
  const pts = listas.flatMap((x) => limpiar(x))
  if (!m || !pts.length) return false
  const lat = pts.map((p) => p[1])
  const lng = pts.map((p) => p[0])
  try {
    m.fitBounds([[Math.min(...lat), Math.min(...lng)], [Math.max(...lat), Math.max(...lng)]], { padding: [50, 50], maxZoom: 13 })
    return true
  } catch {
    return false
  }
}

// ─── Acostar el análisis: las medidas dibujadas sobre la carta ──────────────────────
let capaMedidas = null
export const medidasVisibles = () => !!capaMedidas
export function ocultarMedidas() {
  try {
    capaMedidas?.remove()
  } catch {}
  capaMedidas = null
}
// La línea de la distancia de seguridad, el anillo de la DMA de cada área y el tramo
// de la menor distancia al frente, con sus rótulos.
export function mostrarMedidas(analisis) {
  ocultarMedidas()
  const L = entorno.leaflet
  const m = mapa()
  if (!L || !m || !analisis?.areas?.length) return false
  const g = L.layerGroup()
  const ll = (xs) => limpiar(xs).map(([x, y]) => [y, x])
  const rotulo = (p, html, color) => L.marker([p[1], p[0]], { interactive: false, icon: L.divIcon({ className: '', html: `<div style="white-space:nowrap;font:700 11px Arial;color:${color};text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff">${html}</div>`, iconSize: [10, 10], iconAnchor: [0, 0] }) }).addTo(g)
  const fr = frenteDe(calco.ops, calco.unidades)
  const ao = limpiar(calco.ops?.areaOps?.coords)
  const lado = ao.length >= 3 ? centroide(ao) : centroide(analisis.areas[0].coords)
  if (fr && !fr.puntos && lado) {
    const mins = [...new Set(analisis.areas.map((a) => a.seguridad?.min).filter(Boolean))]
    for (const km of mins) {
      const lin = paralela(fr.linea, km, lado)
      if (lin.length >= 2) {
        L.polyline(ll(lin), { color: '#d4006a', weight: 2.5, dashArray: '10 6', interactive: false }).addTo(g)
        rotulo(lin[0], `${km} km de la ${fr.rot} — distancia de seguridad mínima`, '#d4006a')
      }
    }
  }
  for (const a of analisis.areas) {
    if (a.dma?.km > 0 && a.centro) {
      const r = a.dma.km / (a.dma.factor || 1)
      L.polyline(ll(circulo(a.centro, r)), { color: '#1f6dff', weight: 1.6, dashArray: '4 6', interactive: false }).addTo(g)
      rotulo(circulo(a.centro, r)[18], `DMA ${a.nombre}: ${fmtKm(a.dma.km, 0)} por carretera (≈ ${fmtKm(r, 0)} en línea recta)`, '#1f6dff')
    }
    if (fr && !fr.puntos) {
      const par = parMasCercano(a.coords, fr.linea)
      if (par) {
        L.polyline(ll([par.a, par.b]), { color: a.seguridad?.ok === false ? '#e00000' : '#008a3e', weight: 3, interactive: false }).addTo(g)
        rotulo([(par.a[0] + par.b[0]) / 2, (par.a[1] + par.b[1]) / 2], `${a.nombre}: ${fmtKm(par.d)} ${a.seguridad?.ok === false ? '✗' : '✓'}`, a.seguridad?.ok === false ? '#e00000' : '#008a3e')
      }
    }
    if (a.centro) rotulo(a.centro, `${a.nombre} · ${fmtKm2(a.km2)}`, '#5a3d00')
  }
  g.addTo(m)
  capaMedidas = g
  verEnCarta([...analisis.areas.map((a) => a.coords), fr && !fr.puntos ? fr.linea : []])
  return true
}
const fmtKm2 = (x) => `${(Math.round(x * 10) / 10).toLocaleString('es')} km²`

// ─── Tablero de la instalación: los flujos de apoyo acostados en la carta ──────────
// Una flecha de la instalación a cada unidad apoyada, con el grosor por las t/día y el
// rótulo «t/día · km · viajes».
let capaFlujos = null
export const flujosVisibles = () => !!capaFlujos
export function ocultarFlujos() {
  try {
    capaFlujos?.remove()
  } catch {}
  capaFlujos = null
}
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
export function mostrarFlujos(origen, destinos = []) {
  ocultarFlujos()
  const L = entorno.leaflet
  const m = mapa()
  if (!L || !m || !origen || !destinos.length) return false
  const g = L.layerGroup()
  const max = Math.max(1e-9, ...destinos.map((d) => d.peso || 0))
  for (const d of destinos) {
    if (!d.p) continue
    const w = 2 + (6 * (d.peso || 0)) / max
    L.polyline([[origen[1], origen[0]], [d.p[1], d.p[0]]], { color: d.color || '#ffb020', weight: w, opacity: 0.9, interactive: false }).addTo(g)
    const mid = [(origen[1] + d.p[1]) / 2, (origen[0] + d.p[0]) / 2]
    L.marker(mid, { interactive: false, icon: L.divIcon({ className: '', html: `<div style="white-space:nowrap;font:700 11px Arial;color:#1b1405;background:#ffc278;border:1px solid #1b1405;border-radius:4px;padding:1px 5px;transform:translate(-50%,-50%);display:inline-block">${esc(d.rot)}</div>`, iconSize: [0, 0] }) }).addTo(g)
  }
  g.addTo(m)
  capaFlujos = g
  verEnCarta([[origen], destinos.map((d) => d.p).filter(Boolean)])
  return true
}

// ─── Propuesta del ASDI con la PICB: las áreas A, B, C acostadas en la carta ────────
let capaPropuesta = null
export const propuestaVisible = () => !!capaPropuesta
export function ocultarPropuesta() {
  try {
    capaPropuesta?.remove()
  } catch {}
  capaPropuesta = null
}
export function mostrarPropuesta(pr, colores = {}) {
  ocultarPropuesta()
  const L = entorno.leaflet
  const m = mapa()
  if (!L || !m || !pr?.candidatos?.length) return false
  const g = L.layerGroup()
  for (const c of pr.candidatos) {
    const color = colores[c.letra] || '#ffb020'
    L.polygon(c.coords.map(([x, y]) => [y, x]), { color, weight: 3, dashArray: '8 5', fillColor: color, fillOpacity: 0.18, interactive: false }).addTo(g)
    L.marker([c.centro[1], c.centro[0]], { interactive: false, icon: L.divIcon({ className: '', html: `<div style="white-space:nowrap;font:800 13px Arial;color:#fff;background:${color};border:2px solid #0b111a;border-radius:5px;padding:2px 6px;transform:translate(-50%,-50%);display:inline-block">ÁREA ${esc(c.letra)} · ${Math.round(c.total * 100)}</div>`, iconSize: [0, 0] }) }).addTo(g)
  }
  g.addTo(m)
  capaPropuesta = g
  verEnCarta(pr.candidatos.map((c) => c.coords))
  return true
}
