// La plantilla del concepto EN LA CARTA (Leaflet de la Mesa, window.__mapa2d; el 3D la copia sola).
//
//   · Siempre (si está «Ver en la carta»): las marcas que no tienen pieza propia en la Mesa — los
//     rótulos de las zonas, ESFUERZO PRINCIPAL / SECUNDARIO, la RESERVA y el EFECTO de cada zona de
//     obstáculos (bloquear, fijar, canalizar, desviar) con el símbolo de la tarea táctica.
//   · Con «✋ Ajustar en la carta» (la hoja abierta): una manija ✥ en cada pieza del concepto, en
//     cada obstáculo y en cada concentración del plan de fuegos. Arrastrar ✥ la MUEVE (la de una zona
//     de obstáculos mueve TODO su grupo: la zona, sus obstáculos, su efecto, su zona de aniquilamiento
//     y su concentración). La pieza elegida muestra además ⤡ (agrandar / achicar) y ⟳ (girar).
//     Mientras se arrastra se ve en celeste cómo va a quedar; al soltar va al calco (con ↶ Deshacer).
//
// El compilado llama a sincronizarCarta({ ops, g3, plan, unidades, setOps, setG3, setPlan, marcar,
// setModo, … }) cada vez que cambia algo de eso.
import { leaflet, svgTarea, fuegos } from './runtime.js'
import { centroDe, radioDe, moverPieza, objetoDe, CAPAS_OPS, esDelConcepto } from './modelo.mjs'
import * as G from './geo.mjs'

let puente = null
let capa = null
let fantasma = null
let firma = ''
let editor = 0
let ajustando = false
let sel = null // { capa, idx | id }
const oyentes = new Set()
let colocando = null
let teclado = null
let cartel = null
let dblPrevio = null
let cursorPrevio = ''
let oculto = null
let zoomOyente = null

const mapa = () => (typeof window !== 'undefined' && window.__mapa2d) || null
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const AZUL = '#1f5fbf'
const CELESTE = '#00b7ff'

export const datosPuente = () => puente || {}
export const estado = () => ({ ops: puente?.ops || {}, plan: puente?.plan || {}, marcas: puente?.g3?.conceptoCarta?.marcas || [] })
export function sincronizarCarta(d) {
  puente = d || null
  dibujar()
  avisar()
}
export function editorAbierto(on) {
  editor = Math.max(0, editor + (on ? 1 : -1))
  if (!editor) ponerAjuste(false)
  dibujar()
}
export const estaAjustando = () => ajustando
export function ponerAjuste(on) {
  on = !!on && editor > 0
  if (on === ajustando) return
  ajustando = on
  if (!on) sel = null
  puente?.setModo?.(on || !!colocando)
  if (on) encuadrar()
  avisar()
  dibujar()
}
export const seleccion = () => sel
export function elegir(ref) {
  sel = ref || null
  avisar()
  dibujar()
}
export function escucharCambios(f) {
  oyentes.add(f)
  return () => oyentes.delete(f)
}
const avisar = () => oyentes.forEach((f) => { try { f() } catch {} })

// ─── Cambiar el calco: cada estado por su lado (ops, plan de fuegos, marcas del G-3) ───
export function aplicarTransformacion(ref, tr, { grupo = null } = {}) {
  if (!puente) return
  puente.marcar?.()
  const g = grupo || null
  const tocaOps = CAPAS_OPS.includes(ref.capa) || g
  const tocaPlan = ref.capa === 'blancos' || g
  const tocaMarcas = ref.capa === 'marcas' || g
  if (tocaOps) puente.setOps?.((prev) => moverPieza({ ops: prev || {} }, ref, tr, { grupo: g || false }).ops)
  if (tocaPlan) puente.setPlan?.((prev) => moverPieza({ plan: prev || {} }, ref, tr, { grupo: g || false }).plan)
  if (tocaMarcas)
    puente.setG3?.((prev) => {
      const cc = prev?.conceptoCarta || {}
      return { ...prev, conceptoCarta: { ...cc, marcas: moverPieza({ marcas: cc.marcas || [] }, ref, tr, { grupo: g || false }).marcas } }
    })
}

// Las piezas que tienen manija: todo lo del concepto, más los obstáculos y las concentraciones.
export function piezasAjustables(est = estado()) {
  const out = []
  for (const k of CAPAS_OPS)
    (est.ops[k] || []).forEach((x, idx) => {
      if (k === 'obstaculos' || esDelConcepto(x)) out.push({ ref: { capa: k, idx }, obj: x })
    })
  for (const b of est.plan.blancos || []) out.push({ ref: { capa: 'blancos', id: b.id }, obj: b })
  for (const m of est.marcas || []) out.push({ ref: { capa: 'marcas', id: m.id }, obj: m })
  return out
}
const mismo = (a, b) => !!a && !!b && a.capa === b.capa && (a.id != null ? a.id === b.id : a.idx === b.idx)
export const nombrePieza = (capa, o) => {
  if (!o) return ''
  if (capa === 'blancos') return `${o.num || 'Concentración'}${o.descripcion ? ` · ${o.descripcion}` : ''}`
  if (capa === 'marcas') return o.texto || 'Marca'
  if (capa === 'obstaculos') return `${String(o.tipo || 'obstáculo').replace(/_/g, ' ')}${o.co?.grupo ? ` (${o.co.grupo})` : ''}`
  return o.nombre || (capa === 'coordinacion' ? 'Punto' : 'Línea')
}
const puedeGirar = (capa, o) => (capa === 'blancos' ? o.forma === 'rectangular' || o.forma === 'lineal' : capa === 'marcas' ? o.tipo === 'efecto' : Array.isArray(o.coords) && o.coords.length >= 2)
const puedeEscalar = (capa, o) => (capa === 'blancos' ? o.forma !== 'puntual' : capa === 'marcas' ? o.tipo === 'efecto' : Array.isArray(o.coords) && o.coords.length >= 2)
const esGrupo = (o) => o?.co?.rol === 'zo' && o.co.grupo

// ─── Dibujo ───
function marcaHTML(m) {
  if (m.tipo === 'rotulo') return `<div class="co-rotulo" style="font:800 12px/1.1 Arial,Helvetica,sans-serif;color:#0d2a55;letter-spacing:1px;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 4px #fff;white-space:nowrap;transform:translate(-50%,-50%);opacity:.85">${esc(m.texto)}</div>`
  if (m.tipo === 'esfuerzo') {
    const ppal = m.clase === 'principal'
    return `<div style="transform:translate(-50%,-50%);background:${ppal ? AZUL : '#fff'};color:${ppal ? '#fff' : AZUL};border:${ppal ? 3 : 2}px solid ${AZUL};border-radius:4px;padding:1px 6px;font:800 11px/1.3 Arial,Helvetica,sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.45)">${ppal ? '⮕ ' : ''}${esc(m.texto)}</div>`
  }
  if (m.tipo === 'reserva') return `<div style="transform:translate(-50%,-50%);background:#fff;color:${AZUL};border:2px dashed ${AZUL};border-radius:14px;padding:2px 9px;font:800 12px/1.3 Arial,Helvetica,sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.45)">${esc(m.texto)}</div>`
  if (m.tipo === 'efecto') {
    const tam = Math.round(42 * (m.escala || 1))
    return `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:0"><span style="line-height:0;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff)">${svgTarea(m.tarea, tam, '#0d2a55', m.rot || 0)}</span><span style="font:800 10px/1.1 Arial,Helvetica,sans-serif;color:#0d2a55;text-shadow:0 0 3px #fff,0 0 3px #fff;white-space:nowrap">${esc(m.texto || '')}</span></div>`
  }
  return ''
}
function manija(L, ll, { html, titulo, z = 1800, arrastrable = true }) {
  return L.marker(ll, { draggable: arrastrable, keyboard: false, zIndexOffset: z, icon: L.divIcon({ className: 'co-manija', html, iconSize: [1, 1], iconAnchor: [0, 0] }), title: titulo || '' })
}
const bola = (txt, { fondo = '#fff', color = AZUL, tam = 22, borde = AZUL } = {}) =>
  `<div style="transform:translate(-50%,-50%);width:${tam}px;height:${tam}px;border-radius:50%;background:${fondo};color:${color};border:2px solid ${borde};display:flex;align-items:center;justify-content:center;font:800 ${Math.round(tam * 0.6)}px/1 Arial,sans-serif;box-shadow:0 1px 5px rgba(0,0,0,.55);cursor:grab;user-select:none">${txt}</div>`

function quitar() {
  if (capa) { try { capa.remove() } catch {} capa = null }
  firma = ''
}
function dibujar() {
  const L = leaflet()
  const m = mapa()
  if (!L || !m || !puente) return quitar()
  const est = estado()
  const cc = puente.g3?.conceptoCarta || {}
  const ver = cc.verEnCarta !== false
  const piezas = ajustando ? piezasAjustables(est) : []
  const nueva = JSON.stringify([ver, ajustando, sel, m.getZoom(), est.marcas, ajustando ? piezas.map((p) => [p.ref, centroDe(p.ref.capa, p.obj), radioDe(p.ref.capa, p.obj), p.obj.co?.grupo]) : 0])
  if (capa && capa._map === m && nueva === firma) return
  quitar()
  if (ajustando && !zoomOyente) { zoomOyente = () => dibujar(); m.on('zoomend', zoomOyente) }
  if (!ajustando && zoomOyente) { m.off('zoomend', zoomOyente); zoomOyente = null }
  const g = L.layerGroup()
  if (ver || ajustando)
    for (const mc of est.marcas) {
      if (!G.valido(mc.centro)) continue
      L.marker([mc.centro[1], mc.centro[0]], { interactive: false, keyboard: false, zIndexOffset: 700, icon: L.divIcon({ className: 'co-marca', html: marcaHTML(mc), iconSize: [0, 0], iconAnchor: [0, 0] }) }).addTo(g)
    }
  if (ajustando) for (const p of piezas) manijas(L, m, g, p)
  g.addTo(m)
  capa = g
  firma = nueva
}

// Las manijas de una pieza: ✥ siempre; ⤡ y ⟳ si es la elegida.
function manijas(L, m, g, { ref, obj }) {
  const c = centroDe(ref.capa, obj)
  if (!G.valido(c)) return
  const elegida = mismo(sel, ref)
  const grupo = esGrupo(obj)
  const etiqueta = grupo ? `${obj.co.grupo} ✥` : '✥'
  const html = grupo
    ? `<div style="transform:translate(-50%,-50%);background:${elegida ? CELESTE : AZUL};color:#fff;border:2px solid #fff;border-radius:11px;padding:2px 7px;font:800 11px/1.2 Arial,sans-serif;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,.6);cursor:grab">${esc(etiqueta)}</div>`
    : bola('✥', { tam: elegida ? 24 : 18, fondo: elegida ? CELESTE : '#fff', color: elegida ? '#fff' : AZUL })
  const titulo = `${nombrePieza(ref.capa, obj)} — ${grupo ? 'arrastrá para mover TODO el grupo' : 'arrastrá para mover'}; tocá para elegir`
  const mk = manija(L, [c[1], c[0]], { html, titulo, z: grupo ? 1900 : elegida ? 1850 : 1800 }).addTo(g)
  mk.on('click', (e) => { L.DomEvent.stop(e); elegir(ref) })
  arrastre(mk, m, (ll0, ll) => ({ piv: c, dx: 0, dy: 0, mov: [ll.lng - ll0.lng, ll.lat - ll0.lat] }), ref, grupo ? obj.co.grupo : null, c)
  if (!elegida) return
  // ⤡ y ⟳ a una distancia en píxeles de la pieza (que no se encimen en las chicas).
  const pc = m.latLngToContainerPoint([c[1], c[0]])
  const borde = G.desplazar(c, radioDe(ref.capa, obj), 90)
  const rpx = Math.max(30, Math.abs(m.latLngToContainerPoint([borde[1], borde[0]]).x - pc.x))
  if (puedeEscalar(ref.capa, obj)) {
    const p0 = m.containerPointToLatLng([pc.x + rpx * 0.75, pc.y + rpx * 0.75])
    const mz = manija(L, p0, { html: bola('⤡', { fondo: '#ffd400', color: '#10202a', borde: '#10202a' }), titulo: 'Agrandar / achicar (arrastrá)', z: 1950 }).addTo(g)
    arrastre(mz, m, (ll0, ll) => {
      const a = m.latLngToContainerPoint(ll0), b = m.latLngToContainerPoint(ll)
      const k = Math.hypot(b.x - pc.x, b.y - pc.y) / (Math.hypot(a.x - pc.x, a.y - pc.y) || 1)
      return { piv: c, escala: Math.max(0.1, Math.min(10, k)) }
    }, ref, grupo ? obj.co.grupo : null, c)
  }
  if (puedeGirar(ref.capa, obj)) {
    const p0 = m.containerPointToLatLng([pc.x, pc.y - rpx - 16])
    const mr = manija(L, p0, { html: bola('⟳', { fondo: '#7dffb0', color: '#10202a', borde: '#10202a' }), titulo: 'Girar (arrastrá alrededor)', z: 1950 }).addTo(g)
    arrastre(mr, m, (ll0, ll) => {
      const a = m.latLngToContainerPoint(ll0), b = m.latLngToContainerPoint(ll)
      const az = (p) => (Math.atan2(p.x - pc.x, -(p.y - pc.y)) * 180) / Math.PI
      return { piv: c, giro: az(b) - az(a) }
    }, ref, grupo ? obj.co.grupo : null, c)
  }
}

// Arrastrar una manija: vista previa en celeste y, al soltar, el cambio en el calco.
function arrastre(mk, m, calcular, ref, grupo, piv) {
  let ll0 = null
  let rAF = 0
  const tr = (ll) => {
    const t = calcular(ll0, ll)
    if (t.mov) {
      // Correr en grados → en km sobre el pivote.
      const P = G.proyeccion(piv[0], piv[1])
      const [dx, dy] = P.a([piv[0] + t.mov[0], piv[1] + t.mov[1]])
      return { piv, dx, dy }
    }
    return t
  }
  mk.on('dragstart', () => { ll0 = mk.getLatLng(); elegirSinDibujar(ref) })
  mk.on('drag', () => {
    if (rAF) return
    rAF = requestAnimationFrame(() => { rAF = 0; previa(tr(mk.getLatLng()), ref, grupo) })
  })
  mk.on('dragend', () => {
    if (rAF) cancelAnimationFrame(rAF), (rAF = 0)
    const t = tr(mk.getLatLng())
    quitarFantasma()
    if (!ll0) return
    aplicarTransformacion(ref, t, { grupo })
  })
}
function elegirSinDibujar(ref) {
  sel = ref
  avisar()
}
function quitarFantasma() {
  if (fantasma) { try { fantasma.remove() } catch {} fantasma = null }
}
// Cómo va a quedar (en celeste) lo que se está arrastrando.
function previa(tr, ref, grupo) {
  const L = leaflet()
  const m = mapa()
  if (!L || !m) return
  quitarFantasma()
  const nuevo = moverPieza(estado(), ref, tr, { grupo: grupo || false })
  const antes = estado()
  const g = L.layerGroup()
  const est = { color: CELESTE, weight: 3, dashArray: '6 4', fill: false, interactive: false }
  const F = fuegos()
  const dibujarObj = (capaObj, o) => {
    if (capaObj === 'blancos') {
      const geo = F?.geometria ? F.geometria(o) : null
      if (geo?.tipo === 'circulo') L.circle([o.lat, o.lng], { ...est, radius: geo.radio }).addTo(g)
      else if (geo?.puntos) (geo.tipo === 'poligono' ? L.polygon : L.polyline)(geo.puntos.map(([x, y]) => [y, x]), est).addTo(g)
      L.circleMarker([o.lat, o.lng], { radius: 5, color: CELESTE, weight: 3, fill: false, interactive: false }).addTo(g)
      return
    }
    if (Array.isArray(o.coords) && o.coords.length >= 2) {
      const ll = o.coords.map(([x, y]) => [y, x])
      ;(capaObj === 'obstaculos' && o.coords.length >= 3 && /minado/.test(o.tipo) ? L.polygon : L.polyline)(ll, est).addTo(g)
    } else if (G.valido(o.centro)) L.circleMarker([o.centro[1], o.centro[0]], { radius: 9, color: CELESTE, weight: 3, fill: false, interactive: false }).addTo(g)
  }
  for (const k of CAPAS_OPS) (nuevo.ops[k] || []).forEach((o, i) => { if (o !== (antes.ops[k] || [])[i]) dibujarObj(k, o) })
  ;(nuevo.plan.blancos || []).forEach((o, i) => { if (o !== (antes.plan.blancos || [])[i]) dibujarObj('blancos', o) })
  ;(nuevo.marcas || []).forEach((o, i) => { if (o !== (antes.marcas || [])[i]) dibujarObj('marcas', o) })
  g.addTo(m)
  fantasma = g
}

// ─── Colocar una ficha de la paleta tocando la carta ───
export const estaColocando = () => !!colocando
export function centroVista() {
  const m = mapa()
  if (!m) return null
  try { const c = m.getCenter(); return [G.r6(c.lng), G.r6(c.lat)] } catch { return null }
}
// Encuadra la carta en lo que puso la plantilla (al ponerla y al empezar a ajustar).
export function encuadrar() {
  const L = leaflet()
  const m = mapa()
  if (!L || !m || !puente) return
  const pts = []
  const est = estado()
  for (const k of CAPAS_OPS) for (const x of est.ops[k] || []) if (esDelConcepto(x)) { const c = centroDe(k, x); if (c) pts.push(c); for (const q of x.coords || []) if (G.valido(q)) pts.push(q) }
  for (const b of est.plan.blancos || []) if (esDelConcepto(b)) pts.push([b.lng, b.lat])
  for (const mc of est.marcas || []) if (G.valido(mc.centro)) pts.push(mc.centro)
  if (pts.length < 2) return
  try {
    const bb = L.latLngBounds(pts.map(([x, y]) => [y, x]))
    // Lo que tapa la carta: el tablero de la derecha (donde está la hoja) y la barra de arriba.
    const cont = m.getContainer().getBoundingClientRect()
    let der = 0
    let el = document.querySelector('.co-editor')
    while (el && el !== document.body && getComputedStyle(el).position !== 'fixed') el = el.parentElement
    if (el && el !== document.body) { const r = el.getBoundingClientRect(); if (r.left > cont.left + cont.width * 0.4) der = Math.max(0, cont.right - r.left) }
    const barra = document.querySelector('.botones-mapa')
    const arriba = barra ? Math.max(0, barra.getBoundingClientRect().bottom - cont.top) : 0
    m.fitBounds(bb, { animate: false, paddingTopLeft: [24, arriba + 16], paddingBottomRight: [der + 24, 70] })
  } catch {}
}
export function irA(p, zoom = null) {
  const m = mapa()
  if (!m || !G.valido(p)) return
  try { m.setView([p[1], p[0]], zoom || Math.max(m.getZoom(), 11)) } catch {}
}
export function colocar({ texto = 'Tocá la carta donde va.', al } = {}) {
  const m = mapa()
  if (!m) { if (typeof window !== 'undefined') window.alert('La carta todavía no está lista.'); return false }
  cancelarColocar()
  colocando = al
  m.on('preclick', alTocar)
  const cont = m.getContainer()
  cursorPrevio = cont.style.cursor
  cont.style.cursor = 'crosshair'
  dblPrevio = m.doubleClickZoom && m.doubleClickZoom.enabled()
  if (dblPrevio) m.doubleClickZoom.disable()
  puente?.setModo?.(true)
  teclado = (e) => { if (e.key === 'Escape') cancelarColocar() }
  document.addEventListener('keydown', teclado)
  if (window.innerWidth < 900) {
    let el = document.querySelector('.co-editor')
    while (el && el !== document.body && !['fixed', 'absolute'].includes(getComputedStyle(el).position)) el = el.parentElement
    if (el && el !== document.body) { oculto = { el, vis: el.style.visibility }; el.style.visibility = 'hidden' }
  }
  cartel = document.createElement('div')
  cartel.className = 'co-cartel'
  cartel.setAttribute('role', 'status')
  cartel.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:99999;background:#10202a;color:#e6eef6;border:1px solid #5ce1ff;border-radius:8px;padding:8px 12px;font:13px system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5);display:flex;gap:10px;align-items:center;max-width:92vw'
  cartel.innerHTML = `<span>📍 ${esc(texto)} <b>Esc</b> cancela.</span>`
  const x = document.createElement('button')
  x.textContent = '✕ Cancelar'
  x.style.cssText = 'background:transparent;color:#ffb35c;border:1px solid #ffb35c;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px'
  x.onclick = () => cancelarColocar()
  cartel.appendChild(x)
  document.body.appendChild(cartel)
  return true
}
function alTocar(e) {
  const o = e && e.originalEvent
  if (!colocando || !e || !e.latlng || (o && o.button === 2)) return
  const f = colocando
  cancelarColocar()
  f([G.r6(e.latlng.lng), G.r6(e.latlng.lat)])
}
export function cancelarColocar() {
  const m = mapa()
  if (m) {
    m.off('preclick', alTocar)
    if (colocando) m.getContainer().style.cursor = cursorPrevio || ''
    if (dblPrevio && m.doubleClickZoom) m.doubleClickZoom.enable()
  }
  const habia = !!colocando
  colocando = null
  dblPrevio = null
  if (teclado) document.removeEventListener('keydown', teclado)
  teclado = null
  if (cartel) cartel.remove()
  cartel = null
  if (oculto) oculto.el.style.visibility = oculto.vis
  oculto = null
  if (habia) puente?.setModo?.(ajustando)
}

export { objetoDe }
