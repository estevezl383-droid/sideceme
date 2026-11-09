// 🌎 PICB del Teatro — paso 2 de la construcción de los datos: juntar lo extraído de OSM
// (extraer-osm.mjs), Natural Earth y el relieve (relieve.py), y GENERALIZARLO a escala
// 1:1.000.000 en un solo archivo liviano: calcos/picb-teatro/v1/datos/teatro-base.json.
//
// Uso:
//   node generalizar.mjs --crudo DIR_CRUDO --ne DIR_NATURAL_EARTH --relieve DIR_RELIEVE \
//        --d3 RUTA/node_modules --salida teatro-base.json
//
// Qué queda (sólo «lo más sobresaliente»):
//   vías       troncal (1), primaria (2), secundaria (3) y terciaria (4: sólo para medir rutas y
//              verla de cerca), partidas en los cruces (la red queda conectada) y simplificadas;
//   ffcc       en servicio / en desuso;  ríos  los de nombre y más de 40 km;
//   poblaciones  capital (1), ciudad (2), pueblo (3), localidad (4: aldeas y las de frontera);
//   aeródromos con código OACI/IATA; pasos fronterizos (OSM + cruces de vías con la frontera);
//   volcanes ≥ 5.000 m; salares y lagos (Natural Earth); fronteras y países (Natural Earth);
//   regiones físicas (rótulos) y relieve restringido / severo (DEM a ~600 m).
import fs from 'node:fs'
import path from 'node:path'
import { leerShapefile } from './leer-shp.mjs'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const CRUDO = arg('crudo'), NE = arg('ne'), RELIEVE = arg('relieve'), D3 = arg('d3'), SALIDA = arg('salida', 'teatro-base.json')
const CAJA = (arg('caja', '-71.6,-25,-57.4,-9.5')).split(',').map(Number)
const [O, S, E, N] = CAJA
const t0 = Date.now()
const log = (...a) => console.error(`[${((Date.now() - t0) / 1000).toFixed(1)} s]`, ...a)

// ── utilidades ───────────────────────────────────────────────────────────────────────────
const R = 6371.0088, rad = (g) => (g * Math.PI) / 180
const km = (a, b) => { const dLa = rad(b[1] - a[1]), dLo = rad(b[0] - a[0]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))) }
const largo = (c) => { let s = 0; for (let i = 1; i < c.length; i++) s += km(c[i - 1], c[i]); return s }
const r4 = (p) => [Math.round(p[0] * 1e4) / 1e4, Math.round(p[1] * 1e4) / 1e4]
const enCaja = (p, m = 0) => p[0] >= O - m && p[0] <= E + m && p[1] >= S - m && p[1] <= N + m
const cajaDe = (c) => { let a = Infinity, b = Infinity, cc = -Infinity, d = -Infinity; for (const p of c) { if (p[0] < a) a = p[0]; if (p[1] < b) b = p[1]; if (p[0] > cc) cc = p[0]; if (p[1] > d) d = p[1] } return [a, b, cc, d] }
const tocaCaja = (c) => { const k = cajaDe(c); return k[0] <= E && k[2] >= O && k[1] <= N && k[3] >= S }
function dp(pts, tol) {   // Douglas-Peucker en grados
  if (pts.length <= 2) return pts.slice()
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1
  const pila = [[0, pts.length - 1]]
  while (pila.length) {
    const [a, b] = pila.pop()
    let max = 0, idx = -1
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]
      let d
      if (L === 0) d = Math.hypot(px - ax, py - ay)
      else { let t = ((px - ax) * dx + (py - ay) * dy) / L; t = Math.max(0, Math.min(1, t)); d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) }
      if (d > max) { max = d; idx = i }
    }
    if (max > tol && idx > 0) { keep[idx] = 1; pila.push([a, idx], [idx, b]) }
  }
  return pts.filter((_, i) => keep[i])
}
const sinRepetidos = (c) => c.filter((p, i) => i === 0 || p[0] !== c[i - 1][0] || p[1] !== c[i - 1][1])
const simplificar = (c, tol) => sinRepetidos(dp(c, tol).map(r4))
function areaKm2(r) { let s = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; s += rad(x2 - x1) * (2 + Math.sin(rad(y1)) + Math.sin(rad(y2))) } return Math.abs((s * R * R) / 2) }

// ── 1. OSM crudo ─────────────────────────────────────────────────────────────────────────
const crudos = fs.readdirSync(CRUDO).filter((f) => f.endsWith('.json')).sort()
const vias = new Map(), puntos = new Map()
for (const f of crudos) {
  const d = JSON.parse(fs.readFileSync(path.join(CRUDO, f), 'utf8'))
  for (const v of d.vias) if (!vias.has(v.id)) vias.set(v.id, v)
  for (const p of d.puntos) if (!puntos.has(p.id)) puntos.set(p.id, p)
  log(`${f}: ${d.vias.length} vías, ${d.puntos.length} puntos`)
}
log(`total sin repetir: ${vias.size} vías, ${puntos.size} puntos`)

// ── 2. la red vial: cadenas entre cruces, por clase ──────────────────────────────────────
const CLASE = { motorway: 1, trunk: 1, primary: 2, secondary: 3, tertiary: 4 }
const TOL = { 1: 0.0012, 2: 0.0012, 3: 0.0018, 4: 0.0025 }
const k6 = (p) => `${p[0]},${p[1]}`
const caminos = [...vias.values()].filter((v) => v.que === 'via' && CLASE[v.e.highway] && tocaCaja(v.c))
const grado = new Map()
for (const v of caminos) v.c.forEach((p, i) => { const k = k6(p); grado.set(k, (grado.get(k) || 0) + (i === 0 || i === v.c.length - 1 ? 1 : 2)) })
// trozos entre nodos de cruce (grado ≥ 3) o extremos
const trozos = []
for (const v of caminos) {
  let ini = 0
  for (let i = 1; i < v.c.length; i++) {
    if (i === v.c.length - 1 || grado.get(k6(v.c[i])) >= 3) {
      trozos.push({ clase: CLASE[v.e.highway], ref: (v.e.ref || '').slice(0, 24), nombre: (v.e.name || '').slice(0, 60), c: v.c.slice(ini, i + 1), pav: /paved|asphalt|concrete/.test(v.e.surface || '') })
      ini = i
    }
  }
}
// unir trozos consecutivos de la misma clase y ref donde el nodo es de paso (grado 2)
const porExtremo = new Map()
trozos.forEach((t, i) => { for (const k of [k6(t.c[0]), k6(t.c[t.c.length - 1])]) { if (!porExtremo.has(k)) porExtremo.set(k, []); porExtremo.get(k).push(i) } })
const usado = new Uint8Array(trozos.length), cadenas = []
const mismo = (a, b) => a.clase === b.clase && a.ref === b.ref
for (let i = 0; i < trozos.length; i++) {
  if (usado[i]) continue
  usado[i] = 1
  let c = trozos[i].c.slice(); const t = trozos[i]
  for (const lado of [1, 0]) {
    for (;;) {
      const ext = lado ? c[c.length - 1] : c[0], k = k6(ext)
      const cand = (porExtremo.get(k) || []).filter((j) => !usado[j] && mismo(trozos[j], t))
      if ((porExtremo.get(k) || []).length !== 2 || cand.length !== 1) break
      const j = cand[0]; usado[j] = 1
      let cj = trozos[j].c
      if (lado) { if (k6(cj[0]) !== k) cj = cj.slice().reverse(); c = c.concat(cj.slice(1)) }
      else { if (k6(cj[cj.length - 1]) !== k) cj = cj.slice().reverse(); c = cj.slice(0, -1).concat(c) }
    }
  }
  cadenas.push({ ...t, c })
}
let viasOut = []
for (const t of cadenas) {
  const c = simplificar(t.c, TOL[t.clase])
  if (c.length < 2) continue
  if (!c.some((p) => enCaja(p, 0.05))) continue
  viasOut.push([t.clase, t.ref, t.nombre, c])
}
// Poda de ramales sin salida (calles, accesos a una casa): una secundaria o terciaria de menos de
// 1,5 km con un extremo suelto no une nada a escala teatro. Dos vueltas.
for (let vuelta = 0; vuelta < 2; vuelta++) {
  const g = new Map()
  for (const v of viasOut) for (const p of [v[3][0], v[3][v[3].length - 1]]) { const k = k6(p); g.set(k, (g.get(k) || 0) + 1) }
  const antes = viasOut.length
  viasOut = viasOut.filter((v) => {
    if (v[0] < 3) return true
    const suelto = g.get(k6(v[3][0])) === 1 || g.get(k6(v[3][v[3].length - 1])) === 1
    return !(suelto && largo(v[3]) < 1.5)
  })
  log(`poda ${vuelta + 1}: ${antes - viasOut.length} ramales sin salida`)
}
log(`vías: ${caminos.length} caminos → ${trozos.length} trozos → ${cadenas.length} cadenas → ${viasOut.length} (${viasOut.reduce((s, v) => s + v[3].length, 0)} vértices)`)

// ── 3. ferrocarriles y ríos ──────────────────────────────────────────────────────────────
function encadenar(lista, clave) {
  const pe = new Map()
  lista.forEach((t, i) => { for (const k of [k6(t.c[0]), k6(t.c[t.c.length - 1])]) { if (!pe.has(k)) pe.set(k, []); pe.get(k).push(i) } })
  const us = new Uint8Array(lista.length), out = []
  for (let i = 0; i < lista.length; i++) {
    if (us[i]) continue
    us[i] = 1; let c = lista[i].c.slice()
    for (const lado of [1, 0]) for (;;) {
      const k = k6(lado ? c[c.length - 1] : c[0])
      const cand = (pe.get(k) || []).filter((j) => !us[j] && clave(lista[j]) === clave(lista[i]))
      if (cand.length !== 1) break
      const j = cand[0]; us[j] = 1; let cj = lista[j].c
      if (lado) { if (k6(cj[0]) !== k) cj = cj.slice().reverse(); c = c.concat(cj.slice(1)) }
      else { if (k6(cj[cj.length - 1]) !== k) cj = cj.slice().reverse(); c = cj.slice(0, -1).concat(c) }
    }
    out.push({ ...lista[i], c })
  }
  return out
}
const vias2 = [...vias.values()]
const ffccOut = encadenar(vias2.filter((v) => v.que === 'ffcc' && tocaCaja(v.c)).map((v) => ({ uso: v.e.railway === 'disused' ? 'desuso' : 'activo', nombre: (v.e.name || '').slice(0, 60), c: v.c })), (t) => t.uso)
  .map((t) => [t.uso, t.nombre, simplificar(t.c, 0.0018)]).filter((t) => t[2].length >= 2 && largo(t[2]) >= 2)
const riosOut = encadenar(vias2.filter((v) => v.que === 'rio' && v.e.name && tocaCaja(v.c)).map((v) => ({ nombre: v.e.name.slice(0, 50), c: v.c })), (t) => t.nombre)
  .filter((t) => largo(t.c) >= 50).map((t) => [t.nombre, simplificar(t.c, 0.004)]).filter((t) => t[1].length >= 2)
log(`ffcc: ${ffccOut.length} · ríos: ${riosOut.length}`)

// ── 4. Natural Earth ─────────────────────────────────────────────────────────────────────
const ne = (n) => leerShapefile(path.join(NE, n, n)).features
const anillosDe = (g) => g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
const lineasDe = (g) => g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []
const poligonos = (feats, nombre) => feats.filter((f) => anillosDe(f.geometry).some((p) => tocaCaja(p[0])))
  .map((f) => [nombre(f), anillosDe(f.geometry).filter((p) => tocaCaja(p[0])).map((p) => p.map((r) => simplificar(r, 0.0015))).filter((p) => p[0].length >= 4)])
  .filter((x) => x[1].length)
const salares = poligonos(ne('ne_10m_playas'), (f) => f.properties.name || f.properties.NAME || 'Salar')
const lagos = poligonos(ne('ne_10m_lakes'), (f) => f.properties.name || f.properties.NAME || '')
  .filter((l) => l[1].some((p) => areaKm2(p[0]) >= 20))
// recorte de un anillo a la caja (Sutherland–Hodgman)
function recortarAnillo(r) {
  const bordes = [[(p) => p[0] >= O, (a, b) => [O, a[1] + ((b[1] - a[1]) * (O - a[0])) / (b[0] - a[0])]], [(p) => p[0] <= E, (a, b) => [E, a[1] + ((b[1] - a[1]) * (E - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= S, (a, b) => [a[0] + ((b[0] - a[0]) * (S - a[1])) / (b[1] - a[1]), S]], [(p) => p[1] <= N, (a, b) => [a[0] + ((b[0] - a[0]) * (N - a[1])) / (b[1] - a[1]), N]]]
  let out = r.slice(0, -1)
  for (const [dentro, cruce] of bordes) {
    const inp = out; out = []
    for (let i = 0; i < inp.length; i++) {
      const a = inp[(i + inp.length - 1) % inp.length], b = inp[i]
      if (dentro(b)) { if (!dentro(a)) out.push(cruce(a, b)); out.push(b) } else if (dentro(a)) out.push(cruce(a, b))
    }
    if (!out.length) return null
  }
  out.push(out[0])
  return out
}
const paisesNE = ne('ne_10m_admin_0_countries')
const NOMBRE_PAIS = { BOL: 'Bolivia', CHL: 'Chile', PER: 'Perú', ARG: 'Argentina', PRY: 'Paraguay', BRA: 'Brasil' }
const paises = []
for (const f of paisesNE) {
  const iso = f.properties.ADM0_A3 || f.properties.ISO_A3
  if (!NOMBRE_PAIS[iso]) continue
  const partes = anillosDe(f.geometry).map((p) => p.map((r) => recortarAnillo(r)).filter(Boolean)).filter((p) => p.length && p[0].length >= 4)
    .map((p) => p.map((r) => simplificar(r, 0.006))).filter((p) => p[0].length >= 4)
  if (partes.length) paises.push([NOMBRE_PAIS[iso], iso, partes])
}
const fronteras = ne('ne_10m_admin_0_boundary_lines_land').flatMap((f) => lineasDe(f.geometry)).filter(tocaCaja).map((c) => simplificar(c, 0.002)).filter((c) => c.length >= 2)
const RE_REGION = /ALTIPLANO|CORDILLERA|CORD\.|DESIERTO|CHACO|YUNGAS|PANTANAL|SALAR|PUNA|LLANOS|ANDES/i
const nomRegion = (f) => String(f.properties.NAME || f.properties.name || '')
const centroide = (r) => { let a = 0, cx = 0, cy = 0; for (let i = 0; i < r.length - 1; i++) { const [x1, y1] = r[i], [x2, y2] = r[i + 1], k = x1 * y2 - x2 * y1; a += k; cx += (x1 + x2) * k; cy += (y1 + y2) * k } return a ? [cx / (3 * a), cy / (3 * a)] : r[0] }
const regiones = ne('ne_10m_geography_regions_polys').filter((f) => RE_REGION.test(nomRegion(f)) && !/^(ANDES|SOUTH AMERICA)$/i.test(nomRegion(f)))
  .map((f) => {
    const pol = anillosDe(f.geometry).sort((a, b) => areaKm2(b[0]) - areaKm2(a[0]))[0]
    if (!pol) return null
    const c = centroide(pol[0])
    const nom = (f.properties.NAME_ES || nomRegion(f)).replace(/\s+/g, ' ').replace(/^CORD\.\s*/i, 'CORDILLERA ').trim()
    const bonito = nom === nom.toUpperCase() ? nom.charAt(0) + nom.slice(1).toLowerCase() : nom
    return enCaja(c) ? [bonito, +c[0].toFixed(3), +c[1].toFixed(3)] : null
  }).filter(Boolean)
const aeropuertosNE = ne('ne_10m_airports').filter((f) => enCaja(f.geometry.coordinates))
log(`NE: ${salares.length} salares, ${lagos.length} lagos, ${paises.length} países, ${fronteras.length} tramos de frontera, ${regiones.length} regiones, ${aeropuertosNE.length} aeropuertos`)

// ── 5. pasos fronterizos: OSM + cruces de las vías con la frontera ───────────────────────
const segFrontera = []
for (const c of fronteras) for (let i = 1; i < c.length; i++) segFrontera.push([c[i - 1], c[i]])
const cruzan = (p1, p2, p3, p4) => {
  const d = (p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1])
  if (d === 0) return null
  const ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / d
  const ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / d
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1 ? [p1[0] + ua * (p2[0] - p1[0]), p1[1] + ua * (p2[1] - p1[1])] : null
}
const grillaF = new Map()
segFrontera.forEach((s, i) => { const k = cajaDe(s); for (let x = Math.floor(k[0] * 2); x <= Math.floor(k[2] * 2); x++) for (let y = Math.floor(k[1] * 2); y <= Math.floor(k[3] * 2); y++) { const g = `${x},${y}`; if (!grillaF.has(g)) grillaF.set(g, []); grillaF.get(g).push(i) } })
const cruces = []
for (const v of viasOut) {
  if (v[0] > 3) continue
  const c = v[3]
  for (let i = 1; i < c.length; i++) {
    const k = cajaDe([c[i - 1], c[i]]), vistos = new Set()
    for (let x = Math.floor(k[0] * 2); x <= Math.floor(k[2] * 2); x++) for (let y = Math.floor(k[1] * 2); y <= Math.floor(k[3] * 2); y++) for (const j of grillaF.get(`${x},${y}`) || []) {
      if (vistos.has(j)) continue
      vistos.add(j)
      const p = cruzan(c[i - 1], c[i], segFrontera[j][0], segFrontera[j][1])
      if (p) cruces.push({ p, clase: v[0], ref: v[1], c, i, j })
    }
  }
}
const osmPasos = [...puntos.values()].filter((p) => (p.que === 'frontera' || p.que === 'paso') && p.e.name && enCaja([p.lon, p.lat]))
const distFrontera = (p) => { let m = Infinity; for (const [a, b] of segFrontera) { const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) || 1))); const q = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; const d = km(p, q); if (d < m) m = d } return m }
const lugares = [...puntos.values()].filter((p) => p.que === 'lugar' && enCaja([p.lon, p.lat], 0.5))
const pasos = []
// El punto a `dist` km del cruce, siguiendo la vía hacia adelante (+1) o hacia atrás (−1).
function aLoLargo(c, i, p, dist, sentido) {
  let prev = p, k = sentido > 0 ? i : i - 1, falta = dist
  while (k >= 0 && k < c.length) {
    const d = km(prev, c[k])
    if (d >= falta) { const t = falta / d; return [prev[0] + t * (c[k][0] - prev[0]), prev[1] + t * (c[k][1] - prev[1])] }
    falta -= d; prev = c[k]; k += sentido
  }
  return prev
}
for (const x of cruces) {
  if (pasos.some((p) => km([p[2], p[3]], x.p) < 8)) continue
  // Transversal: a 4 km del cruce, de cada lado, la vía ya se alejó del límite. Una ruta que corre
  // pegada al límite (generalizado) lo «cruza» varias veces y no es un paso.
  const lejos = [aLoLargo(x.c, x.i, x.p, 4, -1), aLoLargo(x.c, x.i, x.p, 4, 1)].map(distFrontera)
  // … o la cruza de frente: más de 35° entre la vía y el límite (una paralela lo corta casi de costado).
  const [a, b] = [x.c[x.i - 1], x.c[x.i]], [f1, f2] = segFrontera[x.j]
  const cl = Math.cos((x.p[1] * Math.PI) / 180)
  const u1 = [(b[0] - a[0]) * cl, b[1] - a[1]], u2 = [(f2[0] - f1[0]) * cl, f2[1] - f1[1]]
  const angulo = (Math.acos(Math.min(1, Math.abs(u1[0] * u2[0] + u1[1] * u2[1]) / ((Math.hypot(...u1) * Math.hypot(...u2)) || 1))) * 180) / Math.PI
  // Una ruta que va pegada al límite lo corta muchas veces seguidas: 3 o más cortes de la misma ruta
  // en 35 km no son pasos.
  const vecinos = cruces.filter((y) => y !== x && (y.c === x.c || (x.ref && y.ref === x.ref)) && km(y.p, x.p) <= 35).length
  const transversal = vecinos < 2 && ((lejos[0] >= 1.5 && lejos[1] >= 1.5) || (angulo >= 35 && x.clase === 1))
  const cerca = osmPasos.map((p) => ({ p, d: km([p.lon, p.lat], x.p) })).filter((y) => y.d <= 9)
    .sort((a, b) => (/^(Paso|Complejo|Hito|Recinto)/i.test(b.p.e.name) - /^(Paso|Complejo|Hito|Recinto)/i.test(a.p.e.name)) || a.d - b.d)
  let nombre = cerca.length ? cerca[0].p.e.name : ''
  // Sin un puesto de frontera o paso con nombre en OSM, sólo cuenta si lo cruza una troncal o primaria
  // (la frontera de Natural Earth es generalizada: un camino vecinal que la bordea la «cruza» varias veces).
  if (!nombre && (x.clase > 2 || !transversal)) continue
  if (!nombre) {
    const pueblos = lugares.map((q) => ({ q, d: km([q.lon, q.lat], x.p) })).filter((y) => y.d <= 15).sort((a, b) => a.d - b.d).slice(0, 2)
    nombre = pueblos.length ? pueblos.map((y) => y.q.e.name).join(' – ') : `Cruce ruta ${x.ref || ''}`.trim()
  }
  // Nombres genéricos de OSM («Frontera Argentina - Bolivia», «Control de Aduanas»): mejor los pueblos de cada lado.
  const generico = /^(Frontera\s+(Argentina|Bolivia|Chile|Per[uú]|Paraguay|Brasil)\b.*(Argentina|Bolivia|Chile|Per[uú]|Paraguay|Brasil)|Control de Aduanas?|Aduana|Paso fronterizo|Frontera)$/i
  if (generico.test(nombre.trim())) {
    const pueblos = lugares.filter((q) => ['city', 'town', 'village'].includes(q.e.place)).map((q) => ({ q, d: km([q.lon, q.lat], x.p) })).filter((y) => y.d <= 12).sort((a, b) => a.d - b.d)
    const dos = []
    for (const y of pueblos) if (!dos.some((z) => z.q.e.name === y.q.e.name) && dos.length < 2) dos.push(y)
    if (dos.length) nombre = 'Paso ' + dos.map((y) => y.q.e.name).join(' – ')
  }
  nombre = nombre.replace(/^(Complejo Fronterizo|Recinto Multiprop[oó]sito de Frontera|Puesto de Control Fronterizo( de)?|Control Fronterizo( de)?)\s+/i, 'Paso ')
    .replace(/^Frontera\s+(.+?)\s+(Chile|Bolivia|Per[uú]|Argentina)$/i, 'Paso $1')
  nombre = nombre.replace(/^(Control aduanero|Migraciones)\s+/i, '').replace(/^(?!Paso\b|Abra\b|Portezuelo\b|Hito\b|Tripartito\b|Cruce\b)/i, 'Paso ')
  pasos.push([nombre.slice(0, 60), 'frontera', +x.p[0].toFixed(4), +x.p[1].toFixed(4), null, x.clase])
}
// pasos de montaña con nombre «Paso …» junto a la frontera que no quedaron (sin vía principal)
for (const p of osmPasos) {
  if (p.que !== 'paso' || !/^Paso\b/i.test(p.e.name)) continue
  if (pasos.some((q) => km([q[2], q[3]], [p.lon, p.lat]) < 10)) continue
  if (distFrontera([p.lon, p.lat]) > 6) continue
  pasos.push([p.e.name.slice(0, 60), 'montaña', +p.lon.toFixed(4), +p.lat.toFixed(4), Number(p.e.ele) || null, 4])
}
log(`pasos fronterizos: ${pasos.length} (de ${cruces.length} cruces de vía con la frontera)`)

// ── 6. poblaciones, aeródromos, volcanes ─────────────────────────────────────────────────
const pobNum = (e) => { const n = Number(String(e.population || '').replace(/[^\d]/g, '')); return Number.isFinite(n) && n > 0 ? n : null }
const poblaciones = []
for (const p of puntos.values()) {
  if (p.que !== 'lugar' || !enCaja([p.lon, p.lat])) continue
  const e = p.e, pob = pobNum(e)
  let rango = 0
  if (['yes', '2', '3', '4'].includes(String(e.capital)) && (e.place === 'city' || e.place === 'town')) rango = 1
  else if (e.place === 'city' || (e.place === 'town' && pob >= 15000)) rango = 2
  else if (e.place === 'town') rango = 3
  else if (e.place === 'village' && (pob >= 800 || pasos.some((q) => km([q[2], q[3]], [p.lon, p.lat]) <= 12))) rango = 4
  else if (e.place === 'village') rango = 5
  else if (e.place === 'hamlet' && pasos.some((q) => km([q[2], q[3]], [p.lon, p.lat]) <= 8)) rango = 4
  if (!rango) continue
  poblaciones.push([(e['name:es'] || e.name).slice(0, 50), rango, +p.lon.toFixed(4), +p.lat.toFixed(4), pob])
}
poblaciones.sort((a, b) => a[1] - b[1] || (b[4] || 0) - (a[4] || 0))
const aerodromos = []
const NEcod = new Map(aeropuertosNE.map((f) => [f.properties.iata_code || f.properties.IATA_CODE, f.properties.type || '']))
const aeroOsm = [...puntos.values()].filter((p) => p.que === 'aerodromo').concat([...vias.values()].filter((v) => v.que === 'aerodromo').map((v) => { const k = cajaDe(v.c); return { e: v.e, lon: (k[0] + k[2]) / 2, lat: (k[1] + k[3]) / 2 } }))
for (const a of aeroOsm) {
  if (!enCaja([a.lon, a.lat])) continue
  const iata = a.e.iata || '', icao = a.e.icao || ''
  if (!iata && !icao) continue
  if (aerodromos.some((q) => km([q[3], q[4]], [a.lon, a.lat]) < 3)) continue
  const rango = iata && (NEcod.has(iata) || /international|internacional/i.test(a.e['aerodrome:type'] || a.e.name || '')) ? 1 : iata ? 2 : 3
  aerodromos.push([(a.e.name || iata || icao).slice(0, 60), iata || icao, rango, +a.lon.toFixed(4), +a.lat.toFixed(4)])
}
const volcanes = [...puntos.values()].filter((p) => (p.que === 'volcan' && Number(p.e.ele) >= 5000 || p.que === 'pico' && Number(p.e.ele) >= 5800) && enCaja([p.lon, p.lat]))
  .sort((a, b) => Number(b.e.ele) - Number(a.e.ele))
  .filter((p, i, l) => !l.slice(0, i).some((q) => km([q.lon, q.lat], [p.lon, p.lat]) < 8))
  .map((p) => [p.e.name.slice(0, 40), Math.round(Number(p.e.ele)), +p.lon.toFixed(4), +p.lat.toFixed(4)])
log(`poblaciones: ${poblaciones.length} (${[1, 2, 3, 4, 5].map((r) => poblaciones.filter((p) => p[1] === r).length).join('/')}) · aeródromos ${aerodromos.length} · volcanes ${volcanes.length}`)

// ── 7. relieve: grilla clasificada → polígonos (d3-contour) ──────────────────────────────
let relieve = []
if (RELIEVE && D3) {
  const { contours } = await import(path.join(D3, 'd3-contour', 'src', 'index.js'))
  const meta = JSON.parse(fs.readFileSync(path.join(RELIEVE, 'relieve.json'), 'utf8'))
  const W = meta.ancho, H = meta.alto, cl = fs.readFileSync(path.join(RELIEVE, 'relieve-clases.bin'))
  const desenfocar = (m, r) => {   // dos pasadas de caja (≈ gaussiano)
    let a = m
    for (let pasada = 0; pasada < 2; pasada++) {
      const b = new Float32Array(W * H), c = new Float32Array(W * H)
      for (let y = 0; y < H; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { b[y * W + x] = s / (2 * r + 1); s += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)] } }
      for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y <= r; y++) s += b[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { c[y * W + x] = s / (2 * r + 1); s += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x] } }
      a = c
    }
    return a
  }
  const interp = (arr, v) => { const i = Math.max(0, Math.min(arr.length - 1.001, v - 0.5)), i0 = Math.floor(i); return arr[i0] + (arr[i0 + 1] - arr[i0]) * (i - i0) }
  for (const [clase, umbral] of [[1, 1], [2, 2]]) {
    const m = new Float32Array(W * H)
    for (let i = 0; i < W * H; i++) m[i] = cl[i] >= umbral ? 1 : 0
    const s = desenfocar(m, 2)
    const [mp] = contours().size([W, H]).smooth(true).thresholds([0.5])(s)
    const polis = []
    for (const pol of mp.coordinates) {
      const anillos = pol.map((r) => simplificar(r.map(([x, y]) => [interp(meta.lons, x), interp(meta.lats, y)]), 0.004)).filter((r) => r.length >= 4)
      if (!anillos.length || areaKm2(anillos[0]) < (clase === 2 ? 40 : 80)) continue
      polis.push([anillos[0], ...anillos.slice(1).filter((r) => areaKm2(r) >= 40)])
    }
    relieve.push([clase, polis])
    log(`relieve clase ${clase}: ${polis.length} polígonos, ${polis.reduce((t, p) => t + p.reduce((u, r) => u + r.length, 0), 0)} vértices`)
  }
}

// ── 8. salida ────────────────────────────────────────────────────────────────────────────
// Coordenadas en delta de 1e-4° (≈ 11 m): [x0, y0, dx1, dy1, …] en enteros. La Mesa las abre con
// abrirBase() de v1/modelo.mjs. Baja el archivo a menos de la mitad.
const cod = (c) => { const out = []; let px = 0, py = 0; for (const [x, y] of c) { const X = Math.round(x * 1e4), Y = Math.round(y * 1e4); out.push(X - px, Y - py); px = X; py = Y } return out }
const codPol = (pol) => pol.map(cod)
// Los nombres de calle no hacen falta a escala teatro: las terciarias van sólo con su ruta (ref).
viasOut = viasOut.map((v) => [v[0], v[1], v[0] >= 4 || /^(Calle|Avenida|Av\.?|Pasaje|Jir[oó]n)\b/i.test(v[2]) ? '' : v[2], cod(v[3])])
const ffccC = ffccOut.map((f) => [f[0], f[1], cod(f[2])]), riosC = riosOut.map((r) => [r[0], cod(r[1])])
const frontC = fronteras.map(cod), paisesC = paises.map((p) => [p[0], p[1], p[2].map(codPol)])
const salC = salares.map((x) => [x[0], x[1].map(codPol)]), lagC = lagos.map((x) => [x[0], x[1].map(codPol)])
relieve = relieve.map(([c, polis]) => [c, polis.map(codPol)])
const salida = {
  tipo: 'sideceme-teatro-base', version: 1, cod: 'delta-1e4', hecho: new Date().toISOString().slice(0, 10), caja: CAJA,
  escala: '1:1.000.000',
  fuentes: [
    'Vías, FF.CC., ríos, poblaciones, aeródromos, pasos y volcanes: © colaboradores de OpenStreetMap (ODbL), extractos Geofabrik y openstreetmap.fr',
    'Salares, lagos, fronteras, países y regiones físicas: Natural Earth (dominio público)',
    'Relieve: Terrain Tiles en AWS (Mapzen/Tilezen), pendiente media a ~600 m',
  ],
  cobertura: crudos.map((f) => f.replace(/\.json$/, '')),
  vias: viasOut, ffcc: ffccC, rios: riosC, fronteras: frontC, paises: paisesC, salares: salC, lagos: lagC,
  relieve, regiones, poblaciones, aerodromos, pasos, volcanes,
}
fs.writeFileSync(SALIDA, JSON.stringify(salida))
const tam = fs.statSync(SALIDA).size
log(`listo → ${SALIDA} (${(tam / 1e6).toFixed(2)} MB)`)
for (const k of Object.keys(salida)) if (Array.isArray(salida[k])) log(`  ${k}: ${salida[k].length} · ${(JSON.stringify(salida[k]).length / 1e3).toFixed(0)} KB`)
