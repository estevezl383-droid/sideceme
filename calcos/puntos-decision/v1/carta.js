// Los puntos de decisión de la F4·P4 EN LA CARTA (Leaflet de la Mesa, window.__mapa2d; el ⛰️ 3D la copia sola).
//
//   · Cada renglón de la hoja «Eventos críticos y puntos de decisión» (g3.eventos) que nombra una A.I.N. del
//     calco va como una ⭐ con su número, al lado de esa A.I.N. (si varios P.D. comparten A.I.N., uno al lado
//     del otro). Nada más escrito en la carta: tocando la estrella se ven la ventana de tiempo, el evento, el
//     criterio y la decisión.
//   · La estrella se arrastra a donde el Comandante tiene que decidir; queda en g3.pdCarta.pos[número].
//     «↺ Volver junto a su A.I.N.» (en su recuadro) la devuelve: el ↶ Deshacer de la Mesa guarda el calco (ops),
//     no las hojas del G-3.
//   · Se esconden con «Ver A.I.N.» (los P.D. viven sobre sus A.I.N.).
//
// El compilado llama a sincronizarCarta({ ops, g3, ver, setG3 }) cada vez que cambia algo de eso (setG3 nulo:
// no se puede editar, las estrellas no se arrastran).
import { leaflet } from '../../concepto-operacion/v1/runtime.js'
import { puntosDeDecision } from './modelo.mjs'

let puente = null
let capa = null
let firma = ''
let reintentos = 0

const mapa = () => (typeof window !== 'undefined' && window.__mapa2d) || null
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const TAM = 20

export function sincronizarCarta(d) {
  puente = d || null
  dibujar()
}

// La estrella del punto de decisión (FM 1-02.2 / RC: estrella de cinco puntas con su número).
function estrella(num) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 4.9 : 11.2
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12.6 + r * Math.sin(a)).toFixed(2)}`)
  }
  const t = String(num).length > 1 ? 6.4 : 7.6
  return `<svg width="${TAM}" height="${TAM}" viewBox="0 0 24 24" style="display:block;overflow:visible;filter:drop-shadow(0 0 1.5px #fff) drop-shadow(0 1px 2px rgba(0,0,0,.6))"><polygon points="${pts.join(' ')}" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/><text x="12" y="15.4" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${t}" fill="#111">${esc(num)}</text></svg>`
}

// Dónde va el centro de la estrella respecto del punto del marcador (px): al lado de su A.I.N., o justo ahí si se arrastró.
const desvio = (p) => (p.movido ? [0, 0] : [12 + TAM / 2 + p.k * (TAM + 2), -10])

function contenido(p) {
  const ventana = [p.noAntes && `No antes de <b>${esc(p.noAntes)}</b>`, p.noDespues && `no después de <b>${esc(p.noDespues)}</b>`].filter(Boolean).join(' · ')
  const fila = (t, v) => (v ? `<div style="margin-top:4px"><b>${t}</b> ${esc(v)}</div>` : '')
  return `<div class="pd-tt" style="font:11px/1.35 Arial,Helvetica,sans-serif;width:300px;max-width:300px">
<div style="font-weight:800;font-size:12px">⭐ P.D. ${esc(p.num)}${p.ain ? ` · ${esc(p.ain)}` : ''}</div>
${ventana ? `<div style="margin-top:2px">⏱️ ${ventana}</div>` : ''}
${fila('Evento crítico:', p.evento)}${fila('Se decide cuando:', p.criterio)}${fila('Decisión:', p.decision)}
${p.ia ? '<div style="margin-top:4px;opacity:.7">[IA — verificar] · Hoja F4·P4</div>' : '<div style="margin-top:4px;opacity:.7">Hoja F4·P4</div>'}
${p.movido ? `<button data-pd-volver style="margin-top:6px;padding:3px 8px;cursor:pointer">↺ Volver junto a su A.I.N.</button>` : ''}
<div style="margin-top:4px;font-size:10px;opacity:.65">Arrastrá la estrella a donde se decide.</div></div>`
}

function guardarPos(num, c) {
  if (!puente?.setG3) return
  puente.setG3((prev) => {
    const pc = prev?.pdCarta || {}
    const pos = { ...(pc.pos || {}) }
    if (c) pos[num] = c
    else delete pos[num]
    return { ...prev, pdCarta: { ...pc, pos } }
  })
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
  const g3 = puente.g3 || {}
  const ver = puente.ver !== false
  const { puntos } = ver ? puntosDeDecision(g3.eventos, puente.ops?.ains, g3.pdCarta?.pos) : { puntos: [] }
  const nueva = JSON.stringify([puntos, !!puente.setG3])
  if (capa && capa._map === m && nueva === firma) return
  quitar()
  if (!puntos.length) return
  const g = L.layerGroup()
  for (const p of puntos) {
    const [ox, oy] = desvio(p)
    const html = `<div class="pd-estrella" data-pd="${esc(p.num)}" style="position:absolute;left:${ox - TAM / 2}px;top:${oy - TAM / 2}px;width:${TAM}px;height:${TAM}px;cursor:pointer">${estrella(p.num)}</div>`
    const mk = L.marker([p.centro[1], p.centro[0]], {
      draggable: !!puente.setG3,
      keyboard: false,
      zIndexOffset: 1500,
      title: `P.D. ${p.num}${p.evento ? ` — ${p.evento}` : ''}`,
      icon: L.divIcon({ className: 'pd-marca', html, iconSize: [0, 0], iconAnchor: [0, 0] }),
    })
    const div = L.DomUtil.create('div')
    div.innerHTML = contenido(p)
    ;['click', 'dblclick', 'mousedown', 'pointerdown', 'touchstart', 'wheel', 'contextmenu'].forEach((ev) => div.addEventListener(ev, (e) => e.stopPropagation()))
    div.querySelector('[data-pd-volver]')?.addEventListener('click', () => {
      mk.closePopup()
      guardarPos(p.num, null)
    })
    mk.bindPopup(div, { minWidth: 300, maxWidth: 320, className: 'pd-pop', offset: [ox, oy - TAM / 2 + 6], autoPanPaddingTopLeft: [20, 260], autoPanPaddingBottomRight: [20, 80] })
    mk.on('dragstart', () => mk.closePopup())
    mk.on('dragend', () => {
      const mp = mk._map || m
      // Se guarda donde quedó la ESTRELLA (no el punto de su A.I.N., que está al lado).
      const pt = mp.latLngToContainerPoint(mk.getLatLng())
      const ll = mp.containerPointToLatLng([pt.x + ox, pt.y + oy])
      guardarPos(p.num, [Math.round(ll.lng * 1e6) / 1e6, Math.round(ll.lat * 1e6) / 1e6])
    })
    mk.addTo(g)
  }
  g.addTo(m)
  capa = g
  firma = nueva
}
