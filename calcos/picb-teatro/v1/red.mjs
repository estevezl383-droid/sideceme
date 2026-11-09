// 🌎 PICB del Teatro — la red vial del teatro como grafo, para medir las DEOP sobre las rutas
// reales (las DEOP de Google Earth son rectas por tramos: «No sigue carreteras»).
// Sin DOM: se prueba en Node.
import { distKm, masCercanoEnLinea } from './modelo.mjs'

// Costo relativo por clase de vía (1 troncal … 4 terciaria): una columna prefiere la mejor vía.
export const COSTO_CLASE = { 1: 1, 2: 1.12, 3: 1.35, 4: 1.7 }
const clave = (p) => `${Math.round(p[0] * 1e5)},${Math.round(p[1] * 1e5)}`

// vias: [[clase, ref, nombre, coords], …] (formato del archivo del teatro)
export function armarRed(vias) {
  const id = new Map(), coords = [], ady = []
  const nodo = (p) => {
    const k = clave(p)
    let i = id.get(k)
    if (i === undefined) { i = coords.length; id.set(k, i); coords.push([p[0], p[1]]); ady.push([]) }
    return i
  }
  const tramos = []   // para «el tramo de vía más cercano a un punto»
  for (let v = 0; v < (vias || []).length; v++) {
    const [clase, ref, nombre, c] = vias[v]
    if (!Array.isArray(c) || c.length < 2) continue
    let prev = nodo(c[0])
    for (let k = 1; k < c.length; k++) {
      const cur = nodo(c[k])
      if (cur === prev) continue
      const km = distKm(coords[prev], coords[cur])
      const costo = km * (COSTO_CLASE[clase] || 2)
      ady[prev].push([cur, km, costo, v])
      ady[cur].push([prev, km, costo, v])
      prev = cur
    }
    tramos.push(v)
  }
  // Grilla de 0,25° para encontrar rápido el nodo más cercano.
  const grilla = new Map()
  for (let i = 0; i < coords.length; i++) {
    const g = `${Math.floor(coords[i][0] * 4)},${Math.floor(coords[i][1] * 4)}`
    if (!grilla.has(g)) grilla.set(g, [])
    grilla.get(g).push(i)
  }
  // Componentes conexas: el tramo de un pueblo que sólo se une a la red por un camino vecinal
  // (fuera de esta red de teatro) es una isla; las rutas se enganchan a la red grande.
  const comp = new Int32Array(coords.length).fill(-1), tam = []
  for (let i = 0; i < coords.length; i++) {
    if (comp[i] >= 0) continue
    const c = tam.length
    let n = 0
    const pila = [i]; comp[i] = c
    while (pila.length) { const u = pila.pop(); n++; for (const [w] of ady[u]) if (comp[w] < 0) { comp[w] = c; pila.push(w) } }
    tam.push(n)
  }
  const grande = Math.max(50, Math.max(...tam, 0) * 0.02)
  return { coords, ady, vias, grilla, nNodos: coords.length, comp, tam, grande }
}

// El nodo de la red más cercano: primero en la red grande (no en una isla), si no, cualquiera.
export function nodoCercano(red, p, maxKm = 30) {
  if (red.tam) { const r = buscarNodo(red, p, maxKm, (i) => red.tam[red.comp[i]] >= red.grande); if (r) return r }
  return buscarNodo(red, p, maxKm, null)
}
function buscarNodo(red, p, maxKm, filtro) {
  let mejor = -1, dm = Infinity
  const gx = Math.floor(p[0] * 4), gy = Math.floor(p[1] * 4)
  const anillos = Math.ceil(maxKm / 25) + 1
  for (let dx = -anillos; dx <= anillos; dx++) for (let dy = -anillos; dy <= anillos; dy++) {
    for (const i of red.grilla.get(`${gx + dx},${gy + dy}`) || []) {
      // Se prefieren nodos con salida (no los sueltos) y bien conectados.
      if (!red.ady[i].length || (filtro && !filtro(i))) continue
      const d = distKm(p, red.coords[i])
      if (d < dm) { dm = d; mejor = i }
    }
  }
  return dm <= maxKm ? { i: mejor, km: dm } : null
}

// Montículo binario mínimo (Dijkstra).
class Monticulo {
  constructor() { this.k = []; this.v = [] }
  get size() { return this.k.length }
  push(costo, nodo) {
    const k = this.k, v = this.v
    let i = k.length
    k.push(costo); v.push(nodo)
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= k[i]) break;[k[p], k[i]] = [k[i], k[p]];[v[p], v[i]] = [v[i], v[p]]; i = p }
  }
  pop() {
    const k = this.k, v = this.v, top = v[0], c0 = k[0]
    const lk = k.pop(), lv = v.pop()
    if (k.length) {
      k[0] = lk; v[0] = lv
      let i = 0
      for (;;) {
        const l = 2 * i + 1, r = l + 1
        let m = i
        if (l < k.length && k[l] < k[m]) m = l
        if (r < k.length && k[r] < k[m]) m = r
        if (m === i) break;[k[m], k[i]] = [k[i], k[m]];[v[m], v[i]] = [v[i], v[m]]; i = m
      }
    }
    return [c0, top]
  }
}

// Camino de menor costo entre dos nodos: { km, coords, porClase: {1: km, …}, vias: Set(índices) }
export function caminoEntre(red, a, b) {
  if (a === b) return { km: 0, coords: [red.coords[a]], porClase: {}, vias: new Set() }
  const n = red.coords.length
  const dist = new Float64Array(n).fill(Infinity), previo = new Int32Array(n).fill(-1), porVia = new Int32Array(n).fill(-1)
  const h = new Monticulo()
  dist[a] = 0; h.push(0, a)
  while (h.size) {
    const [c, u] = h.pop()
    if (c > dist[u]) continue
    if (u === b) break
    for (const [w, , costo, via] of red.ady[u]) {
      const nc = c + costo
      if (nc < dist[w]) { dist[w] = nc; previo[w] = u; porVia[w] = via; h.push(nc, w) }
    }
  }
  if (!Number.isFinite(dist[b])) return null
  const camino = [], vias = new Set(), porClase = {}
  let km = 0
  for (let u = b; u !== -1; u = previo[u]) {
    camino.push(red.coords[u])
    if (previo[u] !== -1) {
      const d = distKm(red.coords[u], red.coords[previo[u]])
      km += d
      const via = porVia[u]
      vias.add(via)
      const cl = red.vias[via][0]
      porClase[cl] = (porClase[cl] || 0) + d
    }
  }
  return { km, coords: camino.reverse(), porClase, vias }
}

// Ruta entre dos puntos cualesquiera: tramo campo traviesa hasta la red, la red y tramo final.
// Si la red da una vuelta mucho más larga que la recta (≥ 2,6×) o no hay red cerca, va recta y se avisa.
export function ruta(red, desde, hasta, opciones = {}) {
  // Se recuerda: el panel vuelve a pedir las mismas rutas cada vez que cambia el ejercicio.
  const k = `${desde[0].toFixed(5)},${desde[1].toFixed(5)}>${hasta[0].toFixed(5)},${hasta[1].toFixed(5)}`
  if (!red.memoria) red.memoria = new Map()
  if (red.memoria.has(k)) return red.memoria.get(k)
  const r = rutaSinMemoria(red, desde, hasta, opciones)
  if (red.memoria.size > 400) red.memoria.clear()
  red.memoria.set(k, r)
  return r
}
function rutaSinMemoria(red, desde, hasta, { maxAcceso = 30, vueltaMax = 2.6 } = {}) {
  const recta = distKm(desde, hasta)
  const a = nodoCercano(red, desde, maxAcceso), b = nodoCercano(red, hasta, maxAcceso)
  const directa = (motivo) => ({ km: recta, coords: [desde, hasta], porClase: { 0: recta }, porRed: false, motivo, recta, vias: [] })
  if (!a || !b) return directa('sin red vial cerca')
  const c = caminoEntre(red, a.i, b.i)
  if (!c) return directa('la red vial no une estos puntos')
  const km = c.km + a.km + b.km
  if (recta > 5 && km > recta * vueltaMax) return directa(`por vía serían ${Math.round(km)} km (${(km / recta).toFixed(1)}× la recta)`)
  const coords = [desde, ...c.coords, hasta]
  const porClase = { ...c.porClase, 0: (c.porClase[0] || 0) + a.km + b.km }
  return { km, coords, porClase, porRed: true, motivo: '', recta, vias: [...c.vias] }
}

// La vía de mejor clase que lleva la ruta (con al menos 15 % del recorrido).
export function mejorClase(porClase) {
  const total = Object.values(porClase).reduce((s, x) => s + x, 0) || 1
  for (const cl of [1, 2, 3, 4]) if ((porClase[cl] || 0) / total >= 0.15) return cl
  return 0
}

// ¿Cuánto se apoya una línea en la red? (para describir un eje recto con vías reales)
export function viasCerca(red, linea, maxKm = 3) {
  const usadas = new Map()
  for (let v = 0; v < red.vias.length; v++) {
    const c = red.vias[v][3]
    const medio = c[Math.floor(c.length / 2)]
    if (masCercanoEnLinea(medio, linea).d <= maxKm) usadas.set(v, red.vias[v])
  }
  return [...usadas.values()]
}
