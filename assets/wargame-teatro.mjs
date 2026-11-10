// Escala de videojuego: parámetros abstractos, sin interpretación predictiva.
import { abrirBase, areasDelEjercicio, recortarBase, areaDeInteres } from '../calcos/picb-teatro/v1/modelo.mjs'
import { armarRed, ruta } from '../calcos/picb-teatro/v1/red.mjs'

export const VELOCIDADES = [[2880, '1 día = 30 s'], [1440, '1 día = 1 min'], [720, '1 día = 2 min'], [360, '1 día = 4 min']]
export const FRENTES = { brigada: 8, division: 14, cuerpo: 22, ejercito: 4 }
const OBS = { brigada: 30, division: 45, cuerpo: 60, ejercito: 40 }
const PODER = { brigada: 40, division: 80, cuerpo: 150, ejercito: 10 }
let carta, red

export function detectar(d) {
  if (d?.escala === 'teatro') return true
  if (d?.resultados?.picbTeatro) return true
  const unidad = String(d?.ordenSup?.unidad || d?.ops?.unidadConsiderada?.nombre || d?.unidadAnalisis?.nombre || '')
  if (/FF\s*\.?\s*TT\s*\.?\s*T?\s*\.?\s*O\b|FUERZAS?\s+TERRESTRES?\s+DEL\s+TEATRO/i.test(unidad)) return true
  return areasDelEjercicio(d).some(a => a.tipo === 'teatro' || a.tipo === 'subteatro')
}

export async function cargarCarta() {
  if (!carta) carta = fetch(new URL('../calcos/picb-teatro/v1/datos/teatro-base.json', import.meta.url))
    .then(r => { if (!r.ok) throw Error('No se pudo cargar la carta de teatro (' + r.status + ').'); return r.json() })
    .then(abrirBase).catch(e => { carta = null; throw e })
  return carta
}

export function hora(h) {
  const m = Math.max(0, Math.floor((Number(h) || 0) * 60 + 1e-6))
  return `D+${Math.floor(m / 1440)} ${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const punto = p => Array.isArray(p) && p.length >= 2 && p[0] != null && p[1] != null && p[0] !== '' && p[1] !== ''
  && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]))
  && Math.abs(Number(p[0])) <= 180 && Math.abs(Number(p[1])) <= 90
const limpiar = lista => (Array.isArray(lista) ? lista : []).filter(punto).map(p => [Number(p[0]), Number(p[1])])
function distanciaSegmento(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
  return (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2
}
export function simplificar(lista, max = 60) {
  max = Math.max(2, Math.floor(Number(max) || 60))
  const pts = limpiar(lista)
  if (pts.length <= max) return pts
  function reducir(tol) {
    const indices = new Set([0, pts.length - 1]), pila = [[0, pts.length - 1]]
    while (pila.length) {
      const [a, b] = pila.pop()
      let mayor = tol * tol, iMayor = -1
      for (let i = a + 1; i < b; i++) {
        const d = distanciaSegmento(pts[i], pts[a], pts[b])
        if (d > mayor) { mayor = d; iMayor = i }
      }
      if (iMayor >= 0) { indices.add(iMayor); pila.push([a, iMayor], [iMayor, b]) }
    }
    return [...indices].sort((a, b) => a - b).map(i => pts[i])
  }
  let tol = 0.00001, res = pts
  for (let i = 0; i < 40 && res.length > max; i++, tol *= 1.6) res = reducir(tol)
  return res
}

// Un cálculo genérico de caminos para las fichas del juego, fuera del servidor.
export async function calcularRuta(origen, destinos, base) {
  if (!punto(origen)) throw Error('La ficha no tiene una posición válida.')
  const pasos = limpiar(destinos)
  if (!pasos.length) throw Error('La ruta no tiene un destino válido.')
  let grafo
  if (base) grafo = armarRed(base.vias || [])
  else { if (!red) red = cargarCarta().then(b => armarRed(b.vias || [])).catch(e => { red = null; throw e }); grafo = await red }
  let desde = [Number(origen[0]), Number(origen[1])], coords = [desde], porRed = true
  for (const hasta of pasos) {
    const r = ruta(grafo, desde, hasta)
    if (!r.porRed) porRed = false
    coords.push(...(r.coords || [desde, hasta]).slice(1)); desde = hasta
  }
  // Si falta cobertura, todo el recorrido se declara libre: nunca se aplica
  // el beneficio de carretera a un tramo que no pertenece a la red.
  return { ruta: simplificar(coords), mision: porRed ? 'marcada' : null, porRed }
}

export async function escenario(d, fase, base) {
  const fuente = (fase?.unidades || d?.unidades || [])
  const unidades = fuente.filter(u => u && u.tipo !== 'instalacion' && Object.hasOwn(PODER, u.escalon) && punto([u.lng, u.lat])).map(u => {
    const arma = String(u.arma || 'infanteria'), pc = u.tipo === 'pc' || u.escalon === 'ejercito'
    const factor = /blindada/.test(arma) ? 1.3 : /mecanizada|cabmec/.test(arma) ? 1.2 : /infanteria|andina/.test(arma) ? .9 : 1
    return { bando: /enemig|rojo/i.test(u.bando || '') ? 'rojo' : 'azul', designacion: String(u.designacion || u.nombreKmz || 'Ficha').slice(0, 120),
      escalon: pc ? 'ejercito' : u.escalon, arma, medio: /andina/.test(arma) ? 'pie' : /blindada|mecanizada|cabmec/.test(arma) ? 'oruga' : 'motor',
      lng: Number(u.lng), lat: Number(u.lat), poder_max: pc ? 10 : Math.round(PODER[u.escalon] * factor), obs_km: OBS[pc ? 'ejercito' : u.escalon] }
  })
  const areas = areasDelEjercicio(d), original = d?.resultados?.picbTeatro?.teatro || {}
  const t = { ...original, deop: (original.deop || []).map(x => ({ ...x, puntos: x.puntos || [] })),
    ejes: (original.ejes || []).filter(x => punto(x.linea?.[0])) }
  const propias = unidades.filter(u => u.bando === 'azul'), enemigas = unidades.filter(u => u.bando === 'rojo')
  const interes = areaDeInteres({ areas, unidades: { propias, enemigas }, teatro: t, margenKm: 40 })
  let anillo = interes.anillo
  if (!anillo && unidades.length) {
    const xs = unidades.map(u => u.lng), ys = unidades.map(u => u.lat)
    const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1
    anillo = [[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]
  }
  const b = recortarBase(base || await cargarCarta(), anillo)
  const terreno = []
  const agregar = (tipo, type, coordinates, nom) => terreno.push({ tipo, geojson: { type, coordinates, ...(nom ? { nom: String(nom).slice(0, 160) } : {}) } })
  for (const [clase, polis] of b.relieve || []) for (const pol of polis) agregar(clase === 2 ? 'severo' : 'restringido', 'Polygon', pol)
  for (const [nom, polis] of b.lagos || []) for (const pol of polis) agregar('severo', 'Polygon', pol, nom)
  for (const [nom, polis] of b.salares || []) for (const pol of polis) agregar('restringido', 'Polygon', pol, nom)
  for (const [nom, rango, lng, lat] of b.poblaciones || []) if (rango <= 3) agregar('poblado', 'Point', [lng, lat], nom)
  for (const coords of b.fronteras || []) agregar('jurisdiccion', 'LineString', coords)
  for (const a of areas) agregar('jurisdiccion', 'Polygon', [a.anillo], a.nombre)
  for (const deop of t.deop || []) {
    const coords = limpiar(deop.linea || [])
    if (coords.length > 1) agregar('via', 'LineString', coords, deop.nombre || `DEOP ${deop.n}`)
  }
  return { escala: 'teatro', nombre: d?.nombre || 'Escenario ficticio', fase: fase?.nombre || null,
    unidades, terreno, visuales: terreno.filter(t => t.tipo !== 'severo' && t.tipo !== 'restringido').length,
    instalaciones: [], sinEfecto: [], agrupaciones: [], ejes: 0, obstaculos: 0, obsMecanicos: 0,
    medios: { porFuente: {}, pcs: [], plan: null, nCoe: 0, fichas: [] } }
}

const capas = new WeakMap()
export async function renderizar(map, L, unidades, sigueVigente = () => true, base) {
  const b = base || await cargarCarta()
  if (!sigueVigente()) return
  let c = capas.get(map)
  if (!c) {
    c = { carta: L.layerGroup().addTo(map), frentes: L.layerGroup().addTo(map) }; capas.set(map, c)
    map.on('unload', () => capas.delete(map))
    // Se dibuja una vez. Las fichas y sus círculos cambian en otra capa.
    for (const [clase, , , coords] of b.vias || []) if (clase <= 2) L.polyline(coords.map(p => [p[1], p[0]]), {
      color: clase === 1 ? '#ddc48c' : '#8e997f', weight: clase === 1 ? 2 : 1, opacity: .5, interactive: false, pane: 'overlayPane',
    }).addTo(c.carta)
    for (const [, coords] of b.rios || []) L.polyline(coords.map(p => [p[1], p[0]]), { color: '#67b9e5', weight: 1, opacity: .45, interactive: false }).addTo(c.carta)
    for (const [nom, rango, lng, lat] of b.poblaciones || []) if (rango <= 3) {
      const texto = document.createElement('span'); texto.textContent = nom
      L.circleMarker([lat, lng], { radius: rango <= 2 ? 4 : 2, color: '#e4d5b7', weight: 1, fillOpacity: .65 }).bindTooltip(texto).addTo(c.carta)
    }
  }
  c.frentes.clearLayers()
  for (const u of unidades || []) if (u.estado !== 'fuera_combate' && punto([u.lng, u.lat])) L.circle([u.lat, u.lng], {
    radius: (FRENTES[u.escalon] || 6) * 1000, color: u.bando === 'rojo' ? '#f47768' : '#73b5ff',
    weight: 1.2, dashArray: '6 6', fillOpacity: .025, opacity: .65, interactive: false,
  }).addTo(c.frentes)
}

export function ocultar(map) {
  const c = capas.get(map)
  if (c) { map.removeLayer(c.carta); map.removeLayer(c.frentes); capas.delete(map) }
}
