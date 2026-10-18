// ⬚ Seleccionar en la carta, como en PowerPoint (lo pidió Sergio el 18-10-2026 con la
// captura del tablero del G-4: «no encuentro cómo borrar esos símbolos… una herramienta que me
// permita dibujar un área, seleccionar, y hacer clic otra vez para deseleccionar uno por uno»).
//
//   · arrastrar un recuadro = se suman a la selección las fichas (por su centro) y las figuras
//     del calco que quedan ENTERAS adentro; con Alt o Ctrl, el recuadro las QUITA;
//   · clic en una ficha o figura = la suma o la quita (de a una);
//   · Supr / Retroceso o «🗑 Borrar» = borra lo seleccionado de una vez, y «↶ Deshacer» de la
//     barra lo devuelve todo de un toque; Ctrl+A = todo lo que se ve; Esc = suelta la selección
//     (otro Esc sale de la herramienta);
//   · con la herramienta puesta, la carta no se arrastra con el botón izquierdo: se mueve con el
//     botón derecho o la rueda apretada, y la rueda acerca y aleja como siempre.
//
// Sólo en la carta 2D (window.__mapa2d). El compilado pone la herramienta («seleccionar», el
// mismo estado que la 📏 Regla) y llama a sincronizarSeleccion({…}) en cada cambio; borra con
// `aplicar`, que guarda UNA foto para el deshacer. Las fichas se reconocen por el atributo
// data-sid-unidad que el compilado pone en su dibujo.
import { figuras, claveFigura, enElRecuadro, tocado, quitarDeOps, resumen } from './modelo.mjs'

export const HERRAMIENTA = 'seleccionar'

let puente = null
let activa = false
let mapa = null
let velo = null
let caja = null
let barra = null
let resalte = null
let observador = null
let arrastre = null
const selFichas = new Set()
const selFiguras = new Set()
const filtro = { fichas: true, figuras: true }

const mapa2d = () => (typeof window !== 'undefined' && window.__mapa2d) || null
const leaflet = () => puente?.leaflet || (typeof window !== 'undefined' && window.L) || null

export function sincronizarSeleccion(d) {
  puente = d || null
  if (d?.activa && d?.es3D) {
    d.salir?.()
    d.avisar?.('⬚ Seleccionar funciona en la carta 2D.')
  }
  const debe = !!d?.activa && !d?.es3D && !!mapa2d()
  if (debe && (!activa || mapa !== mapa2d())) encender()
  else if (!debe && activa) apagar()
  if (activa) {
    podar()
    refrescar()
  }
}

// Para las pruebas y para quien quiera mirar.
export function estado() {
  return { activa, fichas: [...selFichas], figuras: visibles().filter((f) => selFiguras.has(f.item)).map(claveFigura), filtro: { ...filtro } }
}
if (typeof window !== 'undefined') window.SIDSeleccion = { estado }

// ─── Lo que hay en la carta ─────────────────────────────────────────────────────────
function visibles() {
  if (!puente) return []
  return figuras(puente.ops || {}, { opsVisibles: puente.opsVisibles || puente.ops || {}, verCapa: puente.verCapa || null })
}
function fichasPx() {
  if (!mapa) return []
  const cont = mapa.getContainer()
  const rc = cont.getBoundingClientRect()
  return [...cont.querySelectorAll('.leaflet-marker-pane [data-sid-unidad]')]
    .map((el) => {
      const r = el.getBoundingClientRect()
      return { id: el.getAttribute('data-sid-unidad'), el, caja: { x: r.left - rc.left, y: r.top - rc.top, w: r.width, h: r.height } }
    })
    .filter((f) => f.id && f.caja.w > 0 && f.caja.h > 0)
}
function figurasPx(lista) {
  return lista.map((f) => ({
    clave: claveFigura(f),
    tipo: f.tipo,
    item: f.item,
    px: f.puntos.map(([lng, lat]) => {
      const p = mapa.latLngToContainerPoint([lat, lng])
      return [p.x, p.y]
    }),
  }))
}
function datosPx() {
  const lista = visibles()
  return { lista, fichas: filtro.fichas ? fichasPx() : [], figurasPx: filtro.figuras ? figurasPx(lista) : [] }
}

// Lo seleccionado que ya no está (se borró, se deshizo, se apagó su capa) se suelta.
function podar() {
  const ids = new Set((puente?.unidades || []).map((u) => String(u?.id)))
  for (const id of [...selFichas]) if (!ids.has(id)) selFichas.delete(id)
  const vivas = new Set(visibles().map((f) => f.item))
  for (const it of [...selFiguras]) if (!vivas.has(it)) selFiguras.delete(it)
}

// ─── Encender y apagar ──────────────────────────────────────────────────────────────
function estilos() {
  if (document.getElementById('sid-sel-estilos')) return
  const st = document.createElement('style')
  st.id = 'sid-sel-estilos'
  st.textContent = `
.sid-sel-velo{position:absolute;inset:0;z-index:640;cursor:crosshair;touch-action:none;-webkit-user-select:none;user-select:none}
.sid-sel-caja{position:absolute;border:1.5px dashed #22d3ee;background:rgba(34,211,238,.12);pointer-events:none}
.sid-sel-caja.quitar{border-color:#fb7185;background:rgba(251,113,133,.12)}
.leaflet-marker-icon.sid-sel-ficha{outline:2px dashed #22d3ee;outline-offset:3px;background:rgba(34,211,238,.25);border-radius:4px}
.sid-sel-barra{position:fixed;z-index:1500;display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);box-sizing:border-box;background:rgba(10,18,30,.94);border:1px solid #22d3ee;border-radius:10px;padding:6px 8px;box-shadow:0 6px 22px rgba(0,0,0,.5);font:12px system-ui,sans-serif;color:#e6f6fb;transform:translateX(-50%)}
.sid-sel-barra b{color:#67e8f9;letter-spacing:.4px}
.sid-sel-barra .sid-sel-n{min-width:110px;text-align:center}
.sid-sel-barra button{background:rgba(255,255,255,.08);color:#e6f6fb;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:5px 9px;cursor:pointer;font:inherit}
.sid-sel-barra button[aria-pressed=true]{background:rgba(34,211,238,.22);border-color:#22d3ee;color:#cffafe}
.sid-sel-barra button.sid-sel-borrar{background:#a71936;border-color:#e11d48;color:#fff;font-weight:700}
.sid-sel-barra button:disabled{opacity:.45;cursor:default}
@media (max-width:1599px){.btn-seleccionar .sid-sel-txt{display:none}}`
  document.head.appendChild(st)
}
// El botón de la barra es del compilado: en pantallas angostas muestra sólo «⬚» (el texto le
// sumaría una fila a la barra y taparía más carta). Por eso los estilos van desde que se carga.
if (typeof document !== 'undefined') {
  if (document.head) estilos()
  else document.addEventListener('DOMContentLoaded', estilos)
}

const PARAR = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchmove', 'touchend', 'contextmenu']

function encender() {
  if (activa) apagar()
  mapa = mapa2d()
  if (!mapa) return
  estilos()
  activa = true
  const cont = mapa.getContainer()
  velo = document.createElement('div')
  velo.className = 'sid-sel-velo'
  velo.setAttribute('data-sid-seleccion', 'velo')
  // Nada de lo que pasa en el velo llega a la carta (ni arrastrar, ni clic, ni menú); la rueda sí.
  for (const t of PARAR) velo.addEventListener(t, (e) => e.stopPropagation())
  velo.addEventListener('contextmenu', (e) => e.preventDefault())
  velo.addEventListener('pointerdown', abajo)
  velo.addEventListener('pointermove', mover)
  velo.addEventListener('pointerup', arriba)
  velo.addEventListener('pointercancel', cancelarArrastre)
  cont.appendChild(velo)

  const L = leaflet()
  if (L) {
    if (!mapa.getPane('sidSeleccion')) {
      const p = mapa.createPane('sidSeleccion')
      p.style.zIndex = '450'
      p.style.pointerEvents = 'none'
    }
    resalte = L.layerGroup().addTo(mapa)
  }
  const panel = cont.querySelector('.leaflet-marker-pane')
  if (panel && typeof MutationObserver !== 'undefined') {
    observador = new MutationObserver(() => marcarFichas())
    observador.observe(panel, { childList: true })
  }
  armarBarra()
  window.addEventListener('keydown', tecla, true)
  window.addEventListener('resize', ubicarBarra)
}

function apagar() {
  activa = false
  cancelarArrastre()
  window.removeEventListener('keydown', tecla, true)
  window.removeEventListener('resize', ubicarBarra)
  observador?.disconnect()
  observador = null
  try {
    resalte?.remove()
  } catch {}
  resalte = null
  velo?.remove()
  velo = null
  barra?.remove()
  barra = null
  selFichas.clear()
  selFiguras.clear()
  marcarFichas()
  mapa = null
}

// ─── Ratón y dedo ───────────────────────────────────────────────────────────────────
function punto(e) {
  const r = mapa.getContainer().getBoundingClientRect()
  return [e.clientX - r.left, e.clientY - r.top]
}
function abajo(e) {
  if (!mapa) return
  e.preventDefault()
  if (e.button === 1 || e.button === 2) arrastre = { modo: 'mover', x: e.clientX, y: e.clientY }
  else if (e.button === 0) {
    const [x, y] = punto(e)
    arrastre = { modo: 'recuadro', x0: x, y0: y, x1: x, y1: y, quitar: e.altKey || e.ctrlKey || e.metaKey, movido: false }
  } else return
  try {
    velo.setPointerCapture(e.pointerId)
  } catch {}
}
function mover(e) {
  if (!arrastre || !mapa) return
  if (arrastre.modo === 'mover') {
    const dx = e.clientX - arrastre.x
    const dy = e.clientY - arrastre.y
    arrastre.x = e.clientX
    arrastre.y = e.clientY
    if (dx || dy) mapa.panBy([-dx, -dy], { animate: false })
    return
  }
  const [x, y] = punto(e)
  arrastre.x1 = x
  arrastre.y1 = y
  if (!arrastre.movido && Math.hypot(x - arrastre.x0, y - arrastre.y0) > 4) arrastre.movido = true
  if (arrastre.movido) dibujarCaja()
}
function arriba() {
  const a = arrastre
  cancelarArrastre()
  if (!a || a.modo !== 'recuadro' || !mapa) return
  const d = datosPx()
  const porClave = new Map(d.figurasPx.map((f) => [f.clave, f.item]))
  if (a.movido) {
    const r = enElRecuadro({ x1: a.x0, y1: a.y0, x2: a.x1, y2: a.y1 }, d)
    for (const id of r.fichas) a.quitar ? selFichas.delete(id) : selFichas.add(id)
    for (const c of r.figuras) a.quitar ? selFiguras.delete(porClave.get(c)) : selFiguras.add(porClave.get(c))
  } else {
    const t = tocado([a.x1, a.y1], d)
    if (t?.ficha) selFichas.has(t.ficha) ? selFichas.delete(t.ficha) : selFichas.add(t.ficha)
    else if (t?.figura) {
      const it = porClave.get(t.figura)
      selFiguras.has(it) ? selFiguras.delete(it) : selFiguras.add(it)
    }
  }
  refrescar()
}
function cancelarArrastre() {
  arrastre = null
  caja?.remove()
  caja = null
}
function dibujarCaja() {
  if (!velo) return
  if (!caja) {
    caja = document.createElement('div')
    caja.className = 'sid-sel-caja'
    velo.appendChild(caja)
  }
  const a = arrastre
  caja.classList.toggle('quitar', !!a.quitar)
  Object.assign(caja.style, { left: `${Math.min(a.x0, a.x1)}px`, top: `${Math.min(a.y0, a.y1)}px`, width: `${Math.abs(a.x1 - a.x0)}px`, height: `${Math.abs(a.y1 - a.y0)}px` })
}

function tecla(e) {
  if (!activa) return
  const t = e.target
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
  const hay = selFichas.size + selFiguras.size > 0
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    e.stopPropagation()
    borrar()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    if (hay) ninguno()
    else puente?.salir?.()
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
    e.preventDefault()
    e.stopPropagation()
    todo()
  }
}

// ─── Acciones ───────────────────────────────────────────────────────────────────────
function ninguno() {
  selFichas.clear()
  selFiguras.clear()
  refrescar()
}
function todo() {
  if (!mapa) return
  const s = mapa.getSize()
  const d = datosPx()
  const porClave = new Map(d.figurasPx.map((f) => [f.clave, f.item]))
  const r = enElRecuadro({ x1: 0, y1: 0, x2: s.x, y2: s.y }, d)
  for (const id of r.fichas) selFichas.add(id)
  for (const c of r.figuras) selFiguras.add(porClave.get(c))
  refrescar()
}
function borrar() {
  if (!puente) return
  const ids = [...selFichas]
  const figs = visibles().filter((f) => selFiguras.has(f.item))
  if (!ids.length && !figs.length) return
  const ops = figs.length ? quitarDeOps(puente.ops || {}, figs) : null
  if (puente.aplicar?.({ unidades: ids, ops }) === false) return
  puente.avisar?.(`🗑 Se borró ${resumen(ids.length, figs)}. «↶ Deshacer» lo devuelve.`)
  selFichas.clear()
  selFiguras.clear()
  refrescar()
}

// ─── Lo que se ve ───────────────────────────────────────────────────────────────────
function marcarFichas() {
  const cont = mapa?.getContainer?.() || mapa2d()?.getContainer?.()
  if (!cont) return
  for (const el of cont.querySelectorAll('.leaflet-marker-pane [data-sid-unidad]')) {
    const on = activa && selFichas.has(el.getAttribute('data-sid-unidad'))
    if (el.classList.contains('sid-sel-ficha') !== on) el.classList.toggle('sid-sel-ficha', on)
  }
}
function dibujarFiguras() {
  const L = leaflet()
  if (!resalte || !L) return
  resalte.clearLayers()
  const base = { pane: 'sidSeleccion', interactive: false, color: '#22d3ee' }
  for (const f of visibles()) {
    if (!selFiguras.has(f.item)) continue
    const ll = f.puntos.map(([lng, lat]) => [lat, lng])
    if (f.tipo === 'punto') L.circleMarker(ll[0], { ...base, radius: 15, weight: 3, dashArray: '4 3', fillColor: '#22d3ee', fillOpacity: 0.15 }).addTo(resalte)
    else if (f.tipo === 'area') L.polygon(ll, { ...base, weight: 4, dashArray: '8 6', fillColor: '#22d3ee', fillOpacity: 0.14 }).addTo(resalte)
    else L.polyline(ll, { ...base, weight: 8, opacity: 0.55 }).addTo(resalte)
  }
}
function refrescar() {
  if (!activa) return
  marcarFichas()
  dibujarFiguras()
  pintarBarra()
}

function boton(texto, titulo, f, clase = '') {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = texto
  b.title = titulo
  if (clase) b.className = clase
  b.addEventListener('click', f)
  return b
}
function armarBarra() {
  barra = document.createElement('div')
  barra.className = 'sid-sel-barra'
  barra.setAttribute('role', 'toolbar')
  barra.setAttribute('aria-label', 'Selección en la carta')
  const tit = document.createElement('b')
  tit.textContent = '⬚ SELECCIONAR'
  const n = document.createElement('span')
  n.className = 'sid-sel-n'
  n.setAttribute('role', 'status')
  const fichas = boton('🪖 Fichas', 'El recuadro y el clic toman las fichas (unidades e instalaciones)', () => {
    filtro.fichas = !filtro.fichas
    if (!filtro.fichas) selFichas.clear()
    refrescar()
  })
  fichas.dataset.filtro = 'fichas'
  const figs = boton('📐 Figuras', 'El recuadro y el clic toman las figuras del calco (áreas, líneas, ejes, marcas, tareas…)', () => {
    filtro.figuras = !filtro.figuras
    if (!filtro.figuras) selFiguras.clear()
    refrescar()
  })
  figs.dataset.filtro = 'figuras'
  barra.append(
    tit,
    n,
    fichas,
    figs,
    boton('🗑 Borrar', 'Borrar lo seleccionado (Supr). «↶ Deshacer» lo devuelve.', borrar, 'sid-sel-borrar'),
    boton('Ninguno', 'Soltar la selección (Esc)', ninguno),
    boton('✕ Salir', 'Salir de la herramienta', () => puente?.salir?.()),
  )
  document.body.appendChild(barra)
  ubicarBarra()
}
function ubicarBarra() {
  if (!barra || !mapa) return
  const rm = mapa.getContainer().getBoundingClientRect()
  const tb = document.querySelector('.botones-mapa')?.getBoundingClientRect()
  const top = Math.max(rm.top, tb && tb.bottom > rm.top && tb.bottom < rm.bottom - 60 ? tb.bottom : rm.top) + 8
  barra.style.top = `${Math.round(top)}px`
  barra.style.left = `${Math.round(rm.left + rm.width / 2)}px`
}
function pintarBarra() {
  if (!barra) return
  const figs = visibles().filter((f) => selFiguras.has(f.item))
  const n = selFichas.size + figs.length
  barra.querySelector('.sid-sel-n').textContent = n ? `${resumen(selFichas.size, figs)}` : 'nada seleccionado'
  for (const b of barra.querySelectorAll('[data-filtro]')) b.setAttribute('aria-pressed', filtro[b.dataset.filtro] ? 'true' : 'false')
  barra.querySelector('.sid-sel-borrar').disabled = !n
  ubicarBarra()
}
