// ➜ El ITINERARIO de cada unidad en las fases de un CAP propio, con flechas. Sergio, 25-10-2026: «que su desplazamiento
// quede marcado con una línea flecha… uno que sea violeta y otro fucsia… cuando se llegue a la fase última debe estar
// marcado todo su itinerario». El CAP 1 en VIOLETA y el CAP 2 en FUCSIA. Con la FASE k a la vista se ven los tramos
// FASE I → II → … → k de cada ficha propia que se movió (en la última, todo el recorrido). Tocando un tramo: quién, de
// qué fase a cuál y cuántos km.
//
// Sergio, 26-10-2026, con el CAP 1 en la FASE IV: «las flechas creo que están muy confusas». Lo eran: cada tramo con su
// punta, todos del mismo trazo, y cada fuerza DOS veces — la agrupación (OD, OC, RES) hace lo de la unidad de la que
// salen sus piezas y posiciones.mjs la pone a 1,5 km para que no se tapen, así que cada maniobra salía con dos flechas
// casi paralelas. Ahora (`trazos`): una sola flecha por fuerza (la agrupación que va con su unidad viaja en el rótulo
// de la unidad: «DIV MEC-2 con la OD»), una sola punta por unidad (donde está en la fase a la vista), el tramo de ESTA
// fase lleno y los de las fases anteriores punteados y más finos, y en cada lugar por donde pasó, el número de la fase
// (II, III…; la FASE I, de donde salen todas, con un punto). Los tramos que coinciden (dos unidades del mismo lugar al
// mismo lugar) se dibujan una vez.
//
// En el Leaflet de la Mesa (window.__mapa2d): el ⛰️ 3D la copia sola. El compilado llama a
// sincronizarItinerario({ fasesCOA, faseActiva, g3, unidades, ver }) cada vez que cambia algo de eso (`unidades`: las
// fichas de la carta, así el tramo de la fase a la vista sigue a la ficha que se arrastra). `tramos` y `trazos` no tocan
// la carta (los usan las pruebas en Node).
import { leaflet } from '../../concepto-operacion/v1/runtime.js'

export const COLOR_CAP = { 1: '#8f00ff', 2: '#ff00ff' }
// Para escribir sobre el fondo oscuro de los paneles.
export const COLOR_CAP_CLARO = { 1: '#c9a6ff', 2: '#ff9cf2' }
export const NOMBRE_COLOR = { 1: 'VIOLETAS', 2: 'FUCSIAS' }
// Un tramo más corto que esto (km) no es un desplazamiento (la ficha corrida para que no tape a otra).
const MIN_KM = 0.3
// La agrupación y la unidad de la que salen sus piezas hacen el MISMO movimiento si salen y llegan a menos de esto
// (posiciones.mjs las separa hasta ~3 km para que una ficha no tape a la otra).
const MISMO_KM = 3.5
// Dos tramos que salen y llegan a menos de esto son el mismo trazo.
const JUNTOS_KM = 0.6
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
      const t = { id, nom: String(u.designacion || antes.designacion || 'Unidad'), de, a, desde: k - 1, hasta: k, km: Math.round(d * 10) / 10 }
      // La agrupación (OD, OC, RES…) y las unidades de las que salen sus piezas.
      if (u.esAgrupacion || u.agrupacion === true) t.madres = [...new Set((u.piezasAg || antes.piezasAg || []).map((x) => x?.de).filter((x) => x != null))]
      out.push(t)
    }
  }
  return out
}

// Lo que se DIBUJA hasta la fase `idx` (Sergio, 26-10-2026: «las flechas… muy confusas»):
//   · lineas: { de, a, desde, hasta, actual, nombres, km } — una por movimiento, sin la agrupación que va con su
//     unidad (queda en `nombres`: «DIV MEC-2 con la OD») y sin repetir los tramos que coinciden; `actual` = el de la
//     fase a la vista (lleno); los demás, de fases anteriores (punteados);
//   · puntas: { p, rumbo, actual } — UNA por unidad, donde termina su itinerario;
//   · estaciones: { p, fase } — por dónde pasó en cada fase anterior (el número de la fase; la FASE I, un punto), sin
//     repetir las de la misma fase en el mismo lugar.
export function trazos({ fases = [], idx = 0, actuales = null } = {}) {
  const ts = tramos({ fases, idx, actuales })
  const hasta = ts.reduce((m, t) => Math.max(m, t.hasta), 0)
  // La agrupación que hace lo mismo que su unidad (sale y llega con ella): se va con ella.
  const con = new Map()
  const quedan = []
  for (const t of ts) {
    const madre = t.madres?.length
      ? ts.find((o) => o !== t && !o.madres && o.hasta === t.hasta && t.madres.some((m) => String(m) === String(o.id)) && km(o.de, t.de) <= MISMO_KM && km(o.a, t.a) <= MISMO_KM)
      : null
    if (madre) con.set(madre, [...(con.get(madre) || []), t])
    else quedan.push(t)
  }
  // Los tramos que coinciden, una vez (con todos los nombres).
  const lineas = []
  const ultimo = new Map()
  for (const t of quedan) {
    const ags = con.get(t) || []
    const nom = t.nom + (ags.length ? ` con la ${ags.map((x) => x.nom).join(' y la ')}` : '')
    let l = lineas.find((x) => x.hasta === t.hasta && km(x.de, t.de) <= JUNTOS_KM && km(x.a, t.a) <= JUNTOS_KM)
    if (l) l.nombres.push(nom)
    else lineas.push((l = { de: t.de, a: t.a, desde: t.desde, hasta: t.hasta, actual: t.hasta === Number(idx), nombres: [nom], km: t.km }))
    // La punta va en el último tramo de cada unidad (y de la agrupación que va con ella).
    for (const x of [t, ...ags]) {
      const prev = ultimo.get(x.id)
      if (!prev || prev.hasta <= l.hasta) ultimo.set(x.id, l)
    }
  }
  const conPunta = new Set(ultimo.values())
  const puntas = lineas.filter((l) => conPunta.has(l)).map((l) => ({ p: l.a, rumbo: rumbo(l.de, l.a), actual: l.actual }))
  const estaciones = []
  for (const l of lineas) if (!estaciones.some((e) => e.fase === l.desde && km(e.p, l.de) <= 1.2)) estaciones.push({ p: l.de, fase: l.desde })
  return { lineas, puntas, estaciones, hasta }
}

// ─── Prender / apagar las flechas ────────────────────────────────────────────────────────────────────────────
// Sergio, 25-10-2026: «necesito un botón que desactive las flechas de los itinerarios». Lo tocan el panel de los
// CAP y el 🎬 C.A. por fases; queda para la próxima vez (localStorage `sid-iti-flechas`). Va por window.SIDItinerario
// (no por un import) para que un panel.js o un itinerario.mjs que el navegador tenga guardado de antes no rompa nada:
// sin esto, el botón no aparece.
const CLAVE_VER = 'sid-iti-flechas'
let verFlechas = (() => {
  try {
    return localStorage.getItem(CLAVE_VER) !== '0'
  } catch {
    return true
  }
})()
export const flechasVisibles = () => verFlechas
export function ponerFlechas(v) {
  verFlechas = !!v
  try {
    localStorage.setItem(CLAVE_VER, verFlechas ? '1' : '0')
  } catch {}
  dibujar()
  if (typeof document !== 'undefined') {
    for (const b of document.querySelectorAll('[data-iti-flechas]')) {
      b.textContent = textoBotonFlechas(verFlechas)
      b.setAttribute('aria-pressed', String(verFlechas))
    }
  }
  return verFlechas
}
export const textoBotonFlechas = (v) => (v ? '➜ Ocultar las flechas del itinerario' : '➜ Mostrar las flechas del itinerario')
if (typeof window !== 'undefined') window.SIDItinerario = { visibles: flechasVisibles, poner: ponerFlechas, alternar: () => ponerFlechas(!verFlechas), texto: textoBotonFlechas }

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
// ficha que llegó). El ícono gira alrededor de su centro, que es el final del tramo. La de una unidad que se quedó en
// una fase anterior, más chica y más tenue.
function punta(color, grados, antes = false) {
  const T = 64
  const k = antes ? 0.72 : 1
  const y0 = T / 2 + 13 * k
  const y1 = T / 2 + 29 * k
  return `<div style="width:${T}px;height:${T}px;transform:rotate(${grados.toFixed(1)}deg);pointer-events:none"><svg width="${T}" height="${T}" viewBox="0 0 ${T} ${T}" style="display:block;overflow:visible"><polygon points="${T / 2},${y0} ${T / 2 - 8 * k},${y1} ${T / 2 + 8 * k},${y1}" fill="${color}" fill-opacity="${antes ? 0.75 : 1}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`
}

// Por dónde pasó: el número de la fase en una pastilla blanca con el borde del color del CAP.
const anchoEstacion = (txt) => 10 + 6.5 * String(txt).length
function estacion(color, txt) {
  const w = anchoEstacion(txt)
  return `<svg width="${w}" height="15" viewBox="0 0 ${w} 15" style="display:block;pointer-events:none"><rect x="0.8" y="0.8" width="${w - 1.6}" height="13.4" rx="6.7" fill="#ffffff" fill-opacity="0.92" stroke="${color}" stroke-width="1.6"/><text x="${w / 2}" y="11" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="700" fill="${color}">${txt}</text></svg>`
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
  if (puente.ver === false || !verFlechas || fa?.bando !== 'propio' || !fases.length) return quitar()
  const n = capActivo(puente.g3)
  const color = COLOR_CAP[n]
  const tz = trazos({ fases, idx: fa.idx, actuales: puente.unidades })
  const nueva = JSON.stringify([n, fa.idx, tz.lineas.map((l) => [l.de, l.a, l.hasta, l.nombres]), tz.puntas.length, tz.estaciones.length])
  if (capa && capa._map === m && nueva === firma) return
  quitar()
  if (!tz.lineas.length) return
  const g = L.layerGroup()
  // Abajo lo de las fases anteriores (punteado, fino); arriba el movimiento de la fase a la vista (lleno).
  const orden = [...tz.lineas].sort((a, b) => Number(a.actual) - Number(b.actual) || a.hasta - b.hasta)
  for (const l of orden) {
    const ll = [
      [l.de[1], l.de[0]],
      [l.a[1], l.a[0]],
    ]
    const texto = `<b>➜ ${l.nombres.map(esc).join('<br>➜ ')}</b><br>CAP ${n} · FASE ${romano(l.desde)} → FASE ${romano(l.hasta)} · ${String(l.km).replace('.', ',')} km${l.actual ? '' : ' (fase anterior)'}`
    // Un halo blanco abajo para que se lea sobre cualquier fondo.
    L.polyline(ll, { color: '#ffffff', weight: l.actual ? 7 : 4.6, opacity: l.actual ? 0.55 : 0.35, interactive: false, className: 'cap-iti-halo' }).addTo(g)
    L.polyline(ll, { color, weight: l.actual ? 3.6 : 2.2, opacity: l.actual ? 0.95 : 0.6, dashArray: l.actual ? null : '7 6', className: `cap-iti cap-iti-${n}${l.actual ? '' : ' cap-iti-antes'}` })
      .bindTooltip(texto, { sticky: true, direction: 'top' })
      .addTo(g)
  }
  // Dónde estaba en cada fase anterior: el número de la fase (la FASE I, de donde salen todos, con un punto).
  for (const e of tz.estaciones) {
    if (!e.fase) {
      L.circleMarker([e.p[1], e.p[0]], { radius: 3.4, color: '#ffffff', weight: 1.4, fillColor: color, fillOpacity: 1, interactive: false }).addTo(g)
      continue
    }
    const txt = romano(e.fase)
    const w = anchoEstacion(txt)
    L.marker([e.p[1], e.p[0]], { icon: L.divIcon({ className: 'cap-iti-fase', html: estacion(color, txt), iconSize: [w, 15], iconAnchor: [w / 2, 7.5] }), interactive: false, keyboard: false, zIndexOffset: 240 }).addTo(g)
  }
  // Una punta por unidad, donde termina su itinerario.
  for (const p of tz.puntas) {
    L.marker([p.p[1], p.p[0]], { icon: L.divIcon({ className: 'cap-iti-punta', html: punta(color, p.rumbo, !p.actual), iconSize: [64, 64], iconAnchor: [32, 32] }), interactive: false, keyboard: false, zIndexOffset: 250 }).addTo(g)
  }
  g.addTo(m)
  capa = g
  firma = nueva
}
