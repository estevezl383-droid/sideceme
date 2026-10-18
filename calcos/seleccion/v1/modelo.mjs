// ⬚ Seleccionar — la parte sin pantalla: qué se puede seleccionar en el calco, dónde está
// cada cosa en la carta (en píxeles) y cómo queda el calco cuando se borra lo seleccionado.
// No toca Leaflet ni React: se prueba con node (calcos/pruebas/seleccion.mjs).

// Las figuras del calco (ops) que se seleccionan, con la capa de «👁 Qué se ve en el calco»
// que las prende y apaga (la misma tabla que usa la vista 3D del compilado). El Área de
// Operaciones, el Área de Interés y el Área de Influencia NO entran: son el marco del
// ejercicio y se borran como siempre (clic derecho).
export const CATEGORIAS = [
  { cat: 'tareas', nom: 'tarea táctica', capa: null },
  { cat: 'limites', nom: 'línea o límite', capa: 'areaOps' },
  { cat: 'magnitudes', nom: 'marca de magnitud', capa: 'areaOps' },
  { cat: 'coordinacion', nom: 'punto de coordinación', capa: 'areaOps' },
  { cat: 'pasaje', nom: 'punto de pasaje', capa: 'areaOps' },
  { cat: 'flechasZona', nom: 'flecha', capa: 'areaOps' },
  { cat: 'zonasLog', nom: 'área logística', capa: 'zonasLog', cerrada: true },
  { cat: 'sectoresLog', nom: 'sector logístico', capa: 'zonasLog', cerrada: true },
  { cat: 'ejesLog', nom: 'eje', capa: 'zonasLog' },
  { cat: 'lineasEM', nom: 'línea del EM', capa: 'zonasLog' },
  { cat: 'obstaculos', nom: 'obstáculo', capa: null },
  { cat: 'posDef', nom: 'posición defensiva', capa: 'posDef' },
  { cat: 'objetivos', nom: 'objetivo', capa: 'objetivos' },
  { cat: 'maniobra', nom: 'flecha de maniobra', capa: 'maniobra' },
]
const POR_CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.cat, c]))

const esPar = (p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1])
function pares(x, out = []) {
  if (esPar(x)) out.push([x[0], x[1]])
  else if (Array.isArray(x)) for (const y of x) pares(y, out)
  return out
}

// Los puntos [lng, lat] de una figura: su contorno o su trazo (`coords`) y su centro.
export function puntosDe(item) {
  if (!item || typeof item !== 'object') return []
  const out = pares(item.coords)
  if (esPar(item.centro)) out.push([item.centro[0], item.centro[1]])
  return out
}

const visible = (verCapa, capa, item, cat) => {
  if (!verCapa) return true
  if (capa && verCapa[capa] === false) return false
  if (cat === 'maniobra' && item?.forma && verCapa[`maniobra:${item.forma}`] === false) return false
  return true
}

// Lo que se ve en la carta y se puede seleccionar. `ops` es el calco entero (el que se
// guarda); `opsVisibles` lo que la carta muestra (con un puesto elegido trae menos: otras
// categorías vacías, las líneas del EM de ese puesto). Sólo entra lo que la carta muestra
// (el MISMO objeto) y el índice es el del calco entero: el que sirve para borrar.
export function figuras(ops, { opsVisibles = ops, verCapa = null } = {}) {
  const out = []
  for (const { cat, capa, cerrada } of CATEGORIAS) {
    const todas = Array.isArray(ops?.[cat]) ? ops[cat] : []
    const vistas = new Set(Array.isArray(opsVisibles?.[cat]) ? opsVisibles[cat] : [])
    todas.forEach((item, idx) => {
      if (!item || !vistas.has(item) || !visible(verCapa, capa, item, cat)) return
      const puntos = puntosDe(item)
      if (!puntos.length) return
      const conTrazo = pares(item.coords).length >= 2
      const primero = puntos[0]
      const ultimo = puntos[puntos.length - 1]
      const cierra = !!cerrada || (conTrazo && puntos.length >= 4 && primero[0] === ultimo[0] && primero[1] === ultimo[1])
      out.push({ cat, idx, item, puntos, tipo: !conTrazo ? 'punto' : cierra ? 'area' : 'linea' })
    })
  }
  return out
}

export const claveFigura = (f) => `${f.cat}#${f.idx}`

// ─── Geometría en píxeles de la carta ──────────────────────────────────────────────
export function distSegmento(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}
export function distTrazo(p, pts, cerrada = false) {
  if (pts.length === 1) return Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1])
  let d = Infinity
  for (let i = 1; i < pts.length; i++) d = Math.min(d, distSegmento(p, pts[i - 1], pts[i]))
  if (cerrada && pts.length > 2) d = Math.min(d, distSegmento(p, pts[pts.length - 1], pts[0]))
  return d
}
export function dentroPoligono(p, pts) {
  let adentro = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) adentro = !adentro
  }
  return adentro
}
export function areaPx(pts) {
  let s = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1])
  return Math.abs(s / 2)
}
// Recuadro {x1, y1, x2, y2} en cualquier orden.
export function normalizarRecuadro(r) {
  return { x1: Math.min(r.x1, r.x2), y1: Math.min(r.y1, r.y2), x2: Math.max(r.x1, r.x2), y2: Math.max(r.y1, r.y2) }
}
export const enRecuadro = (p, r) => p[0] >= r.x1 && p[0] <= r.x2 && p[1] >= r.y1 && p[1] <= r.y2

// Qué cae ENTERO adentro del recuadro (como en PowerPoint). Las fichas, por su centro.
//   fichas: [{ id, caja: {x, y, w, h} }] · figurasPx: [{ clave, tipo, px: [[x, y]…] }]
export function enElRecuadro(recuadro, { fichas = [], figurasPx = [] }) {
  const r = normalizarRecuadro(recuadro)
  return {
    fichas: fichas.filter((f) => enRecuadro([f.caja.x + f.caja.w / 2, f.caja.y + f.caja.h / 2], r)).map((f) => f.id),
    figuras: figurasPx.filter((f) => f.px.length && f.px.every((p) => enRecuadro(p, r))).map((f) => f.clave),
  }
}

// Qué se toca con un clic en `p`: primero una ficha (su dibujo), después un punto (tarea,
// marca, posición…), después una línea o el borde de un área y, si no, el área más chica
// que tenga el clic adentro. Devuelve { ficha: id } o { figura: clave } o null.
export function tocado(p, { fichas = [], figurasPx = [] }, { margenFicha = 3, radioPunto = 16, radioLinea = 8 } = {}) {
  let mejor = null
  for (const f of fichas) {
    const c = f.caja
    if (p[0] < c.x - margenFicha || p[0] > c.x + c.w + margenFicha || p[1] < c.y - margenFicha || p[1] > c.y + c.h + margenFicha) continue
    const d = Math.hypot(p[0] - (c.x + c.w / 2), p[1] - (c.y + c.h / 2))
    if (!mejor || d < mejor.d) mejor = { d, id: f.id }
  }
  if (mejor) return { ficha: mejor.id }
  let cerca = null
  for (const f of figurasPx) {
    if (f.tipo !== 'punto') continue
    const d = distTrazo(p, f.px)
    if (d <= radioPunto && (!cerca || d < cerca.d)) cerca = { d, clave: f.clave }
  }
  if (cerca) return { figura: cerca.clave }
  for (const f of figurasPx) {
    if (f.tipo === 'punto') continue
    const d = distTrazo(p, f.px, f.tipo === 'area')
    if (d <= radioLinea && (!cerca || d < cerca.d)) cerca = { d, clave: f.clave }
  }
  if (cerca) return { figura: cerca.clave }
  let chica = null
  for (const f of figurasPx) {
    if (f.tipo !== 'area' || f.px.length < 3 || !dentroPoligono(p, f.px)) continue
    const a = areaPx(f.px)
    if (!chica || a < chica.a) chica = { a, clave: f.clave }
  }
  return chica ? { figura: chica.clave } : null
}

// ─── Borrar ──────────────────────────────────────────────────────────────────────────
// Igual que el clic derecho de la Mesa (GN del compilado), pero todo junto: al borrar un
// límite se va su marca de magnitud (y las de los límites siguientes se renumeran), y al
// borrar un área logística se van las marcas de su borde.
function magSinLimite(m, i) {
  return (m || [])
    .filter((x) => x.origen !== 'limite-' + i)
    .map((x) => {
      const r = /^limite-(\d+)$/.exec(x.origen || '')
      return r && +r[1] > i ? { ...x, origen: 'limite-' + (+r[1] - 1) } : x
    })
}
const magSinZona = (m, z) => (z && z.clave ? (m || []).filter((x) => x.origen !== 'zona-' + z.clave) : m)

// items: [{ cat, idx }] (índices del calco entero). Devuelve el calco nuevo (no toca el que llega).
export function quitarDeOps(ops, items) {
  const porCat = new Map()
  for (const { cat, idx } of items || []) {
    if (!POR_CAT[cat] || !Number.isInteger(idx)) continue
    if (!porCat.has(cat)) porCat.set(cat, new Set())
    porCat.get(cat).add(idx)
  }
  if (!porCat.size) return ops
  const nuevo = { ...ops }
  for (const [cat, set] of porCat) nuevo[cat] = (ops[cat] || []).filter((_, i) => !set.has(i))
  const limites = [...(porCat.get('limites') || [])].filter((i) => i < (ops.limites || []).length).sort((a, b) => b - a)
  for (const i of limites) nuevo.magnitudes = magSinLimite(nuevo.magnitudes, i)
  for (const i of porCat.get('zonasLog') || []) nuevo.magnitudes = magSinZona(nuevo.magnitudes, (ops.zonasLog || [])[i])
  return nuevo
}

// «3 fichas y 2 figuras».
export function resumen(nFichas, figs) {
  const partes = []
  if (nFichas) partes.push(`${nFichas} ficha${nFichas === 1 ? '' : 's'}`)
  if (figs.length) partes.push(`${figs.length} figura${figs.length === 1 ? '' : 's'}`)
  return partes.join(' y ') || 'nada'
}
