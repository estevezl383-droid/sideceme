// ➜ El ITINERARIO de cada unidad en las fases de un CAP propio, con flechas. Sergio, 25-10-2026: «que su desplazamiento
// quede marcado con una línea flecha… uno que sea violeta y otro fucsia… cuando se llegue a la fase última debe estar
// marcado todo su itinerario». El CAP 1 en VIOLETA y el CAP 2 en FUCSIA. Con la FASE k a la vista se ven los tramos
// FASE I → II → … → k de cada ficha propia que se movió (en la última, todo el recorrido), cada uno con su punta de
// flecha y un punto donde estaba la unidad en cada fase anterior. Tocando un tramo: quién, de qué fase a cuál y cuántos km.
//
// En el Leaflet de la Mesa (window.__mapa2d): el ⛰️ 3D la copia sola. El compilado llama a
// sincronizarItinerario({ fasesCOA, faseActiva, g3, unidades, ver }) cada vez que cambia algo de eso (`unidades`: las
// fichas de la carta, así el tramo de la fase a la vista sigue a la ficha que se arrastra). `tramos` no toca la carta
// (lo usan las pruebas en Node).
import { leaflet } from '../../concepto-operacion/v1/runtime.js'

export const COLOR_CAP = { 1: '#8f00ff', 2: '#ff00ff' }
// Para escribir sobre el fondo oscuro de los paneles.
export const COLOR_CAP_CLARO = { 1: '#c9a6ff', 2: '#ff9cf2' }
export const NOMBRE_COLOR = { 1: 'VIOLETAS', 2: 'FUCSIAS' }
// Un tramo más corto que esto (km) no es un desplazamiento (la ficha corrida para que no tape a otra).
const MIN_KM = 0.3
const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
export const romano = (i) => ROM[i] || String(i + 1)

const RAD = Math.PI / 180
const kmLng = (lat) => 111.32 * Math.cos(lat * RAD) || 1e-9
const km = (a, b) => Math.hypot((a[0] - b[0]) * kmLng((a[1] + b[1]) / 2), (a[1] - b[1]) * 110.574)
export const rumbo = (a, b) => ((Math.atan2((b[0] - a[0]) * kmLng((a[1] + b[1]) / 2), (b[1] - a[1]) * 110.574) / RAD) % 360 + 360) % 360
const esEnemiga = (u) => /^(enemig|rojo)/i.test(String(u?.bando || ''))
const pos = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
export const capActivo = (g3) => (g3?._caps?.activo === 2 ? 2 : 1)

// Las fichas propias de unidad de una fase, por id.
function propiasDe(unidades) {
  const m = new Map()
  for (const u of unidades || []) if (u && u.id != null && !esEnemiga(u) && (u.tipo || 'unidad') === 'unidad' && u.deFaseEnemiga == null && pos(u)) m.set(u.id, u)
  return m
}

// Los tramos del itinerario hasta la fase `idx` (0 = FASE I: todavía ninguno). `actuales`: las fichas de la carta, que
// valen para la fase a la vista. Cada tramo: { id, nom, de, a, desde, hasta, km }.
export function tramos({ fases = [], idx = 0, actuales = null } = {}) {
  const hasta = Math.min(Number(idx) || 0, (fases || []).length - 1)
  if (hasta < 1) return []
  const por = (fases || []).slice(0, hasta + 1).map((f, k) => propiasDe(k === hasta && actuales ? actuales : f?.unidades))
  const out = []
  for (let k = 1; k <= hasta; k++) {
    for (const [id, u] of por[k]) {
      const antes = por[k - 1].get(id)
      if (!antes) continue
      const de = pos(antes)
      const a = pos(u)
      const d = km(de, a)
      if (d < MIN_KM) continue
      out.push({ id, nom: String(u.designacion || antes.designacion || 'Unidad'), de, a, desde: k - 1, hasta: k, km: Math.round(d * 10) / 10 })
    }
  }
  return out
}

// ─── En la carta ─────────────────────────────────────────────────────────────────────────────────────────────
let puente = null
let capa = null
let firma = ''
let reintentos = 0
const mapa = () => (typeof window !== 'undefined' && window.__mapa2d) || null

export function sincronizarItinerario(d) {
  puente = d || null
  dibujar()
}

function quitar() {
  if (capa) {
    try {
      capa.remove()
    } catch {}
    capa = null
  }
  firma = ''
}

// La punta de la flecha: un triángulo que apunta al rumbo del tramo, un poco antes del final (así no queda debajo de la
// ficha que llegó). El ícono gira alrededor de su centro, que es el final del tramo.
function punta(color, grados) {
  const T = 64
  return `<div style="width:${T}px;height:${T}px;transform:rotate(${grados.toFixed(1)}deg);pointer-events:none"><svg width="${T}" height="${T}" viewBox="0 0 ${T} ${T}" style="display:block;overflow:visible"><polygon points="${T / 2},${T / 2 + 13} ${T / 2 - 8},${T / 2 + 29} ${T / 2 + 8},${T / 2 + 29}" fill="${color}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`
}

export function dibujar() {
  const L = leaflet()
  const m = mapa()
  if (!puente) return quitar()
  if (!L || !m) {
    // La carta todavía no está: se prueba de nuevo un rato (la primera sincronización llega antes que el mapa).
    if (reintentos++ < 40) setTimeout(dibujar, 500)
    return
  }
  reintentos = 0
  const fa = puente.faseActiva
  const fases = puente.fasesCOA?.propio || []
  if (puente.ver === false || fa?.bando !== 'propio' || !fases.length) return quitar()
  const n = capActivo(puente.g3)
  const color = COLOR_CAP[n]
  const ts = tramos({ fases, idx: fa.idx, actuales: puente.unidades })
  const nueva = JSON.stringify([n, fa.idx, ts.map((t) => [t.id, t.de, t.a, t.hasta])])
  if (capa && capa._map === m && nueva === firma) return
  quitar()
  if (!ts.length) return
  const g = L.layerGroup()
  for (const t of ts) {
    const ll = [
      [t.de[1], t.de[0]],
      [t.a[1], t.a[0]],
    ]
    const texto = `<b>➜ ${esc(t.nom)}</b><br>CAP ${n} · FASE ${romano(t.desde)} → FASE ${romano(t.hasta)} · ${String(t.km).replace('.', ',')} km`
    // Un halo blanco abajo para que se lea sobre cualquier fondo.
    L.polyline(ll, { color: '#ffffff', weight: 6.5, opacity: 0.5, interactive: false, className: 'cap-iti-halo' }).addTo(g)
    L.polyline(ll, { color, weight: 3.4, opacity: 0.95, className: `cap-iti cap-iti-${n}` })
      .bindTooltip(texto, { sticky: true, direction: 'top' })
      .addTo(g)
    // Donde estaba la unidad al empezar el tramo.
    L.circleMarker(ll[0], { radius: 3.6, color: '#ffffff', weight: 1.4, fillColor: color, fillOpacity: 1, interactive: false }).addTo(g)
    L.marker(ll[1], { icon: L.divIcon({ className: 'cap-iti-punta', html: punta(color, rumbo(t.de, t.a)), iconSize: [64, 64], iconAnchor: [32, 32] }), interactive: false, keyboard: false, zIndexOffset: 250 }).addTo(g)
  }
  g.addTo(m)
  capa = g
  firma = nueva
}
