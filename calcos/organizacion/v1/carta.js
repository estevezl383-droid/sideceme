// La F3·P3 sobre el TERRENO (como el calco de la Escuela): junto a cada tarea táctica de la
// carta que tiene operación, su rótulo «OD · T: …» y las unidades genéricas (los
// triángulos y cuadrados) que la cumplen; la reserva (lo que sobra) aparte. Con la hoja
// abierta, los rótulos se arrastran (su lugar se guarda con la tarea) y se ve con una línea
// punteada el enemigo de cada sector.
//
// Se dibuja en el Leaflet de la Mesa (window.__mapa2d): la vista 3D copia sola lo que se
// agrega ahí. El compilado llama a sincronizarCarta({ ops, g3, unidades, setOps, … }) cada
// vez que cambia el calco o las hojas del G-3.
import { balance, oiDe, flujoNormal, CLAVE_FLUJO, RESERVA, cantidad, esManiobra } from './modelo.js'
import { leaflet, simb, svgPieza } from './runtime.js'

let puente = null
let capa = null
let editor = 0
let colocando = null
let teclado = null
let cartel = null
let dblPrevio = null
let cursorPrevio = ''
let oculto = null

const mapa = () => (typeof window !== 'undefined' && window.__mapa2d) || null
const r6 = (x) => Math.round(x * 1e6) / 1e6
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export const datosPuente = () => puente || {}
export function sincronizarCarta(d) {
  puente = d || null
  dibujar()
}
// El editor de la hoja avisa que está abierto (rótulos arrastrables y líneas al enemigo).
export function editorAbierto(on) {
  editor = Math.max(0, editor + (on ? 1 : -1))
  dibujar()
}

function bloqueHTML({ corto, color, texto, piezas, pie, arrastrable }) {
  const simbolos = piezas.length
    ? piezas.map((p) => `<span style="display:inline-block;line-height:0" title="${esc(p.nom || '')}">${svgPieza(p.simbolo, 30, '#000')}</span>`).join('')
    : '<span style="font-size:10px;color:#555;font-style:italic">sin unidades genéricas</span>'
  return `<div class="oi-bloque-caja" style="background:rgba(255,255,255,.88);border:1.5px solid ${color};border-radius:4px;padding:2px 5px 3px;box-shadow:0 1px 4px rgba(0,0,0,.45);font-family:Arial,Helvetica,sans-serif;color:#000;width:max-content;max-width:250px;cursor:${arrastrable ? 'move' : 'default'}">
<div style="display:flex;align-items:flex-start;gap:4px;font-size:11px;font-weight:700;line-height:1.25"><span style="background:${color};color:#fff;border-radius:3px;padding:0 4px;white-space:nowrap">${esc(corto)}</span><span>${esc(texto)}</span></div>
<div style="display:flex;flex-wrap:wrap;gap:1px 2px;margin-top:2px;align-items:center">${simbolos}</div>
${pie ? `<div style="font-size:9.5px;color:#333;margin-top:1px">${esc(pie)}</div>` : ''}</div>`
}

function dibujar() {
  if (capa) {
    try {
      capa.remove()
    } catch {}
    capa = null
  }
  const L = leaflet()
  const m = mapa()
  if (!L || !m || !puente) return
  let b
  try {
    b = balance({ ops: puente.ops || {}, g3: puente.g3 || {}, unidades: puente.unidades || [] }, simb)
  } catch {
    return
  }
  if (!b.flujo.verEnCarta) return
  const abierta = editor > 0
  const g = L.layerGroup()
  const G = b.G
  for (const x of b.tareas) {
    const c = x.t.centro
    const desp = Array.isArray(x.oi.desp) && x.oi.desp.length === 2 ? x.oi.desp : null
    const pos = desp ? [c[0] + desp[0], c[1] + desp[1]] : c
    if (abierta)
      for (const u of [...x.enemigo.maniobra, ...x.enemigo.apoyo])
        L.polyline(
          [
            [c[1], c[0]],
            [u.lat, u.lng],
          ],
          { color: x.op.color, weight: 1.4, dashArray: '2 6', opacity: 0.9, interactive: false },
        ).addTo(g)
    if (desp)
      L.polyline(
        [
          [c[1], c[0]],
          [pos[1], pos[0]],
        ],
        { color: x.op.color, weight: 1.6, dashArray: '5 4', opacity: 0.95, interactive: false },
      ).addTo(g)
    const texto = String(x.oi.texto || '').trim() || simb.nombreTarea(x.t.tarea)
    const pie = x.nivel === 'sin-enemigo' ? `${x.prop.id} · sin enemigo en el sector` : `${x.prop.id} · ${String(Math.round(x.dispuestas * 10) / 10).replace('.', ',')} de ${cantidad(x.requeridas, G, { corto: true })}${x.falta ? ' — FALTAN' : ' ✓'}`
    const piezas = [...x.piezas.filter(esManiobra), ...x.piezas.filter((p) => !esManiobra(p))]
    const icon = L.divIcon({ className: 'oi-bloque', html: bloqueHTML({ corto: x.op.corto, color: x.op.color, texto: `T: ${texto}`, piezas, pie, arrastrable: abierta }), iconSize: null, iconAnchor: desp ? [0, 16] : [-36, 16] })
    const mk = L.marker([pos[1], pos[0]], { icon, draggable: abierta, interactive: abierta, keyboard: false, zIndexOffset: 1400 }).addTo(g)
    if (abierta) {
      mk.bindTooltip('Arrastrá el rótulo adonde se lea mejor', { direction: 'top' })
      const id = x.oi.id
      mk.on('dragend', () => {
        const ll = mk.getLatLng()
        let destino = ll
        if (!desp) {
          // El rótulo estaba corrido a la derecha de la tarea: se guarda dónde quedó su borde.
          const p = m.latLngToContainerPoint(ll)
          destino = m.containerPointToLatLng([p.x + 36, p.y])
        }
        const nuevo = [r6(destino.lng - c[0]), r6(destino.lat - c[1])]
        puente?.setOps?.((o) => ({ ...o, tareas: (o.tareas || []).map((t) => (oiDe(t).id === id ? { ...t, oi: { ...oiDe(t), desp: nuevo } } : t)) }))
      })
    }
  }
  if (b.reserva.length) {
    const pos = b.flujo.reserva.pos || posicionReserva(b)
    if (pos) {
      const peso = b.reserva.reduce((s, p) => s + (esManiobra(p) ? 1 : 0), 0)
      const icon = L.divIcon({ className: 'oi-bloque', html: bloqueHTML({ corto: RESERVA.corto, color: RESERVA.color, texto: 'Reserva (lo que sobra)', piezas: b.reserva, pie: peso ? `${peso} pieza(s) de maniobra` : '', arrastrable: abierta }), iconSize: null, iconAnchor: [0, 16] })
      const mk = L.marker([pos[1], pos[0]], { icon, draggable: abierta, interactive: abierta, keyboard: false, zIndexOffset: 1400 }).addTo(g)
      if (abierta)
        mk.on('dragend', () => {
          const ll = mk.getLatLng()
          puente?.setG3?.((prev) => {
            const f = flujoNormal(prev?.[CLAVE_FLUJO])
            return { ...prev, [CLAVE_FLUJO]: { ...f, reserva: { ...f.reserva, pos: [r6(ll.lng), r6(ll.lat)] } } }
          })
        })
    }
  }
  g.addTo(m)
  capa = g
}

// Dónde va la reserva si nadie la movió: a retaguardia, en el centro de las unidades propias.
function posicionReserva(b) {
  const propias = (puente?.unidades || []).filter((u) => u && !u.esAgrupacion && (u.tipo || 'unidad') === 'unidad' && !['enemigo', 'enemigas', 'rojo'].includes(String(u.bando || '').toLowerCase()) && Number.isFinite(u.lat))
  if (propias.length) return [r6(propias.reduce((s, u) => s + u.lng, 0) / propias.length), r6(propias.reduce((s, u) => s + u.lat, 0) / propias.length)]
  const od = b.tareas[0]?.t?.centro
  if (od) return [od[0], od[1] - 0.045]
  const v = puente?.centro?.()
  return v ? [v.lng, v.lat] : null
}

// Dónde va la ficha de una agrupación al llevarla al calco (desde el panel 🧩): junto a la
// tarea táctica que cumple, sobre el terreno; la reserva, donde está su rótulo.
export function posicionAgrupacion(ag) {
  if (!puente || !ag) return null
  const t = (puente.ops?.tareas || []).find((x) => x && x.centro && oiDe(x).agId === ag.id)
  if (t) return { lat: r6(t.centro[1] - 0.006), lng: r6(t.centro[0]) }
  const f = flujoNormal(puente.g3?.[CLAVE_FLUJO])
  if (ag.id && ag.id === f.reserva.agId) {
    const pos = f.reserva.pos || posicionReserva({ tareas: [] })
    if (pos) return { lat: pos[1], lng: pos[0] }
  }
  return null
}

// ─── Colocar una tarea tocando la carta ─────────────────────────────────────────────
export const estaColocando = () => !!colocando
export function colocar({ texto = 'Tocá la carta donde va la tarea táctica.', al } = {}) {
  const m = mapa()
  if (!m) {
    if (typeof window !== 'undefined') window.alert('La carta todavía no está lista.')
    return false
  }
  cancelarColocar()
  colocando = al
  m.on('preclick', alTocar)
  const cont = m.getContainer()
  cursorPrevio = cont.style.cursor
  cont.style.cursor = 'crosshair'
  dblPrevio = m.doubleClickZoom && m.doubleClickZoom.enabled()
  if (dblPrevio) m.doubleClickZoom.disable()
  puente?.setModo?.(true)
  teclado = (e) => {
    if (e.key === 'Escape') cancelarColocar()
  }
  document.addEventListener('keydown', teclado)
  // En una pantalla angosta (teléfono, tableta parada) el panel tapa la carta: se esconde
  // mientras se elige el lugar y vuelve solo.
  if (window.innerWidth < 900) {
    let el = document.querySelector('.oi-editor')
    while (el && el !== document.body && !['fixed', 'absolute'].includes(getComputedStyle(el).position)) el = el.parentElement
    if (el && el !== document.body) {
      oculto = { el, vis: el.style.visibility }
      el.style.visibility = 'hidden'
    }
  }
  cartel = document.createElement('div')
  cartel.className = 'oi-cartel'
  cartel.setAttribute('role', 'status')
  cartel.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:99999;background:#10202a;color:#e6eef6;border:1px solid #7dffb0;border-radius:8px;padding:8px 12px;font:13px system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5);display:flex;gap:10px;align-items:center;max-width:92vw'
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
  const t = o && o.target
  if (t && t.closest && t.closest('.oi-bloque')) return
  const f = colocando
  cancelarColocar()
  f([r6(e.latlng.lng), r6(e.latlng.lat)])
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
  if (habia) puente?.setModo?.(false)
}
