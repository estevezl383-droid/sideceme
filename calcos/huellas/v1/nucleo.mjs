// 🛤️ Huellas y sendas de OpenStreetMap — el núcleo (sin DOM).
//
// Corre igual en el Web Worker (trabajador.mjs) y, si el navegador no deja
// abrir el worker (la app de escritorio con file://), en la página misma,
// cediendo el hilo cada pocos milisegundos (`ceder`).
//
// Lo que hace, en orden:
//   1. arma el pedido a Overpass (por clase: primero las huellas, después las
//      sendas y por último las veredas, cada una con su tope);
//   2. lo pide con un tiempo máximo por servidor y en total (antes esperaba
//      para siempre) y corta la respuesta si pasa de `bytesMax`;
//   3. recorta cada camino al Área de Interés (no al rectángulo que la
//      encierra), con un índice por franjas de los bordes del área;
//   4. le saca los vértices que no se ven (Douglas-Peucker, unos metros);
//   5. si son demasiados para dibujarlos sin trabar la Mesa, deja los más
//      importantes (Vía 3 antes que Vía 4, huella antes que senda, los más
//      largos primero) y lo avisa.

export const SERVIDORES = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

export const LIMITES = {
  ladoMaxGrados: 3, // como antes: un área más grande no se pide
  esperaServidorMs: 60000, // hasta que el servidor empieza a contestar (el pedido le dice a Overpass timeout:50)
  esperaTotalMs: 100000, // los servidores juntos, hasta que alguno empieza a contestar
  esperaSinDatosMs: 20000, // ya contestando: si la descarga se queda quieta este tiempo, se corta
  bytesMax: 120e6, // una respuesta más grande se corta
  rasgosMax: 25000, // caminos en el calco
  puntosMax: 600000, // vértices en el calco
  tramoMs: 12, // fuera del worker: cada cuánto se cede el hilo
}

// Lo que se le pide a Overpass, por clase y en este orden (`max`: tope de la clase).
export const CLASES = [
  { highway: ['track'], max: 20000 },
  { highway: ['path', 'bridleway'], max: 10000 },
  { highway: ['footway', 'cycleway'], max: 5000 },
]
const RANGO_CLASE = { track: 0, bridleway: 1, path: 2, footway: 3, cycleway: 4 }

const AFIRMADA = ['asphalt', 'paved', 'concrete', 'paving_stones']
const COMPACTADA = ['gravel', 'compacted', 'fine_gravel', 'pebblestone', 'metal']
const BLANDA = ['sand', 'mud', 'grass', 'ground', 'dirt', 'earth', 'unpaved']

// La misma clasificación militar de siempre (antes en assets/huellasOSM-*.js).
export function clasificarVia(tags = {}) {
  const sup = String(tags.surface || '').toLowerCase()
  const tipo = String(tags.tracktype || '').toLowerCase()
  const hw = String(tags.highway || '').toLowerCase()
  if (hw === 'path' || hw === 'footway' || hw === 'bridleway' || hw === 'cycleway') return { via: 4, nom: 'Vía 4 — senda', paso: 'A pie o animal; no pasa vehículo.' }
  if (AFIRMADA.includes(sup)) return { via: 2, nom: 'Vía 2 — afirmada', paso: 'Todo tiempo, vehículo pesado.' }
  if (tipo === 'grade1' || COMPACTADA.includes(sup)) return { via: 3, nom: 'Vía 3 — compactada', paso: 'Todo tiempo con precaución; pesado con reservas.' }
  if (tipo === 'grade2') return { via: 3, nom: 'Vía 3 — tierra firme', paso: 'Transitable en seco; dudosa con lluvia.' }
  if (tipo === 'grade3') return { via: 4, nom: 'Vía 4 — rodera', paso: 'Sólo en seco y con vehículo liviano o 4×4.' }
  if (tipo === 'grade4' || tipo === 'grade5' || BLANDA.includes(sup)) return { via: 4, nom: 'Vía 4 — huella', paso: 'Sólo 4×4 y en seco; se pierde con lluvia.' }
  return { via: 4, nom: 'Vía 4 — sin datos de firme', paso: 'Reconocer antes de emplearla.' }
}

const geometriaDe = (t) => (t && t.type === 'Feature' ? t.geometry : t)

// [oeste, sur, este, norte] de cualquier geometría (sin Math.min(...lista): con
// listas enormes eso revienta la pila).
export function cajaDe(aoi) {
  const caja = [Infinity, Infinity, -Infinity, -Infinity]
  const ver = (c) => {
    if (!Array.isArray(c)) return
    if (typeof c[0] === 'number') {
      if (c[0] < caja[0]) caja[0] = c[0]
      if (c[1] < caja[1]) caja[1] = c[1]
      if (c[0] > caja[2]) caja[2] = c[0]
      if (c[1] > caja[3]) caja[3] = c[1]
      return
    }
    for (const x of c) ver(x)
  }
  const recorrer = (g) => {
    if (!g) return
    if (g.type === 'FeatureCollection') for (const f of g.features || []) recorrer(geometriaDe(f))
    else if (g.type === 'GeometryCollection') for (const x of g.geometries || []) recorrer(x)
    else ver(g.coordinates)
  }
  recorrer(geometriaDe(aoi))
  return Number.isFinite(caja[0]) ? caja : null
}

// Todos los anillos (exteriores y huecos) de los polígonos del área.
function anillosDe(aoi) {
  const anillos = []
  const recorrer = (g) => {
    if (!g) return
    if (g.type === 'FeatureCollection') for (const f of g.features || []) recorrer(geometriaDe(f))
    else if (g.type === 'GeometryCollection') for (const x of g.geometries || []) recorrer(x)
    else if (g.type === 'Polygon') for (const r of g.coordinates || []) anillos.push(r)
    else if (g.type === 'MultiPolygon') for (const p of g.coordinates || []) for (const r of p || []) anillos.push(r)
  }
  recorrer(geometriaDe(aoi))
  return anillos.filter((r) => Array.isArray(r) && r.length >= 3)
}

// El área como índice: los bordes repartidos en franjas horizontales. Saber si
// un punto está adentro o dónde un tramo cruza el borde mira sólo los bordes
// de su franja (antes, cada camino se comparaba con TODO el contorno, varias
// veces, y en el hilo de la página).
export function recortador(aoi) {
  const anillos = anillosDe(aoi)
  if (!anillos.length) return null
  const xy = []
  for (const r of anillos) {
    for (let i = 0; i < r.length; i++) {
      const a = r[i]
      const b = r[(i + 1) % r.length]
      if (!a || !b || (a[0] === b[0] && a[1] === b[1])) continue
      xy.push(a[0], a[1], b[0], b[1])
    }
  }
  const bordes = Float64Array.from(xy)
  const n = bordes.length / 4
  if (!n) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < bordes.length; i += 2) {
    const x = bordes[i], y = bordes[i + 1]
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  const S = Math.max(8, Math.min(2048, Math.ceil(n / 4)))
  const alto = (y1 - y0) / S || 1
  const franjaDe = (y) => Math.max(0, Math.min(S - 1, Math.floor((y - y0) / alto)))
  const franjas = Array.from({ length: S }, () => [])
  for (let e = 0; e < n; e++) {
    const ya = bordes[e * 4 + 1], yb = bordes[e * 4 + 3]
    const k1 = franjaDe(Math.max(ya, yb))
    for (let k = franjaDe(Math.min(ya, yb)); k <= k1; k++) franjas[k].push(e)
  }
  const sello = new Int32Array(n)
  let vuelta = 0

  // Par-impar: los huecos y las partes de un MultiPolygon salen solos.
  const dentro = (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false
    let c = false
    for (const e of franjas[franjaDe(y)]) {
      const ax = bordes[e * 4], ay = bordes[e * 4 + 1], bx = bordes[e * 4 + 2], by = bordes[e * 4 + 3]
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c
    }
    return c
  }

  // Dónde (0 < t < 1) el tramo a→b cruza algún borde.
  const cortes = (ax, ay, bx, by) => {
    const t = []
    if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) return t
    vuelta++
    const dx = bx - ax, dy = by - ay
    const xmin = Math.min(ax, bx), xmax = Math.max(ax, bx)
    const k1 = franjaDe(Math.max(ay, by))
    for (let k = franjaDe(Math.min(ay, by)); k <= k1; k++) {
      for (const e of franjas[k]) {
        if (sello[e] === vuelta) continue
        sello[e] = vuelta
        const cx = bordes[e * 4], cy = bordes[e * 4 + 1], ex = bordes[e * 4 + 2] - cx, ey = bordes[e * 4 + 3] - cy
        if (Math.max(cx, cx + ex) < xmin || Math.min(cx, cx + ex) > xmax) continue
        const den = dx * ey - dy * ex
        if (den === 0) continue // paralelos: el punto medio de cada pedazo decide
        const qx = cx - ax, qy = cy - ay
        const s = (qx * ey - qy * ex) / den
        const u = (qx * dy - qy * dx) / den
        if (s > 0 && s < 1 && u >= 0 && u <= 1) t.push(s)
      }
    }
    return t.sort((p, q) => p - q)
  }

  return { dentro, cortes, caja: [x0, y0, x1, y1] }
}

// Los pedazos de la línea que quedan adentro del área (cada uno, una lista de [lon, lat]).
export function recortarLinea(coords, R) {
  const partes = []
  let actual = null
  for (let i = 0; i + 1 < coords.length; i++) {
    const a = coords[i], b = coords[i + 1]
    const ts = R.cortes(a[0], a[1], b[0], b[1])
    let p = a
    for (let j = 0; j <= ts.length; j++) {
      const q = j < ts.length ? [a[0] + (b[0] - a[0]) * ts[j], a[1] + (b[1] - a[1]) * ts[j]] : b
      if (p[0] === q[0] && p[1] === q[1]) continue
      if (R.dentro((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)) {
        if (actual && actual[actual.length - 1] === p) actual.push(q)
        else partes.push((actual = [p, q]))
      } else actual = null
      p = q
    }
  }
  return partes
}

// Douglas-Peucker sin recursión (una línea de miles de vértices no revienta la pila).
export function simplificar(pts, tol) {
  if (pts.length <= 2 || !(tol > 0)) return pts
  const quedan = new Uint8Array(pts.length)
  quedan[0] = quedan[pts.length - 1] = 1
  const pila = [0, pts.length - 1]
  const tol2 = tol * tol
  while (pila.length) {
    const fin = pila.pop(), ini = pila.pop()
    const [ax, ay] = pts[ini], [bx, by] = pts[fin]
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy
    let peor = -1, dmax = tol2
    for (let i = ini + 1; i < fin; i++) {
      const [px, py] = pts[i]
      let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const ex = px - (ax + t * dx), ey = py - (ay + t * dy)
      const d = ex * ex + ey * ey
      if (d > dmax) {
        dmax = d
        peor = i
      }
    }
    if (peor > 0) {
      quedan[peor] = 1
      pila.push(ini, peor, peor, fin)
    }
  }
  return pts.filter((_, i) => quedan[i])
}

function largoKm(partes) {
  let s = 0
  for (const p of partes) {
    for (let i = 1; i < p.length; i++) {
      const k = Math.cos((((p[i][1] + p[i - 1][1]) / 2) * Math.PI) / 180)
      const dx = (p[i][0] - p[i - 1][0]) * k, dy = p[i][1] - p[i - 1][1]
      s += Math.sqrt(dx * dx + dy * dy) * 111.32
    }
  }
  return s
}

export function consultaOverpass(caja, clases = CLASES) {
  const [w, s, e, n] = caja
  const bb = `${s.toFixed(5)},${w.toFixed(5)},${n.toFixed(5)},${e.toFixed(5)}`
  const partes = clases.map((c) => `way["highway"~"^(${c.highway.join('|')})$"](${bb});out geom ${c.max};`)
  return `[out:json][timeout:50];\n${partes.join('\n')}`
}

const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
const miles = (x) => Math.round(x).toLocaleString('es-BO')

// El cuerpo de la respuesta, de a trozos: avisa cuánto lleva, corta si pasa de
// `bytesMax` y llama a `latido()` con cada trozo (la descarga sigue viva).
async function leerTexto(r, bytesMax, aviso, latido) {
  if (!r.body || typeof r.body.getReader !== 'function') return r.text()
  const lector = r.body.getReader()
  const dec = new TextDecoder()
  const trozos = []
  let bytes = 0, ult = 0
  for (;;) {
    const { done, value } = await lector.read()
    if (done) break
    latido()
    bytes += value.byteLength
    if (bytes > bytesMax) {
      try {
        await lector.cancel()
      } catch {}
      throw new Error(`la respuesta pasa de ${Math.round(bytesMax / 1e6)} MB`)
    }
    trozos.push(dec.decode(value, { stream: true }))
    if (bytes - ult > 2e6) {
      ult = bytes
      aviso(`🛤️ Descargando de OpenStreetMap… ${(bytes / 1e6).toFixed(1)} MB`)
    }
  }
  trozos.push(dec.decode())
  return trozos.join('')
}

// Pide `consulta` a los servidores, de a uno, sin esperar nunca más de lo que
// dicen los límites: `esperaServidorMs` (y `esperaTotalMs` entre todos) hasta
// que el servidor empieza a contestar; después, mientras lleguen datos, sigue
// (una descarga grande con internet lenta no se corta), pero si se queda
// quieta `esperaSinDatosMs`, se corta. Devuelve el JSON de Overpass o tira el
// último error.
export async function descargar(consulta, { aviso = () => {}, limites = LIMITES, servidores = SERVIDORES, pedir = (...a) => fetch(...a) } = {}) {
  const inicio = Date.now()
  let ultimo = null
  for (let i = 0; i < servidores.length; i++) {
    const restante = limites.esperaTotalMs - (Date.now() - inicio)
    if (restante < 100) break
    const espera = Math.min(limites.esperaServidorMs, restante)
    const ctl = new AbortController()
    let vencido = null
    let reloj = setTimeout(() => {
      vencido = `OSM no contestó en ${Math.round(espera / 1000)} s`
      ctl.abort()
    }, espera)
    const latido = () => {
      clearTimeout(reloj)
      reloj = setTimeout(() => {
        vencido = `la descarga de OSM se quedó quieta ${Math.round(limites.esperaSinDatosMs / 1000)} s`
        ctl.abort()
      }, limites.esperaSinDatosMs)
    }
    const t0 = Date.now()
    const otro = i ? ' (otro servidor)' : ''
    aviso(`🛤️ Consultando OpenStreetMap${otro}…`)
    const tic = setInterval(() => aviso(`🛤️ Consultando OpenStreetMap${otro}… ${Math.round((Date.now() - t0) / 1000)} s`), 1000)
    try {
      const r = await pedir(servidores[i], { method: 'POST', body: consulta, signal: ctl.signal })
      if (!r.ok) {
        ultimo = new Error(r.status === 429 ? 'OSM está saturado (429)' : `OSM respondió ${r.status}`)
        continue
      }
      clearInterval(tic)
      latido()
      const datos = JSON.parse(await leerTexto(r, limites.bytesMax, aviso, latido))
      const nota = String(datos.remark || '')
      if (!(datos.elements || []).length && /error|timed out|memory/i.test(nota)) {
        ultimo = new Error(`OSM no terminó la consulta (${nota.slice(0, 120)})`)
        continue
      }
      return { datos, parcial: /error|timed out|memory/i.test(nota) }
    } catch (e) {
      ultimo = vencido ? new Error(vencido) : e
    } finally {
      clearTimeout(reloj)
      clearInterval(tic)
    }
  }
  throw ultimo || new Error('sin respuesta')
}

// Los caminos de Overpass recortados al área, simplificados y dentro de los topes.
export async function procesar(datos, aoi, { aviso = () => {}, ceder = async () => {}, limites = LIMITES } = {}) {
  const R = recortador(aoi)
  const caja = cajaDe(aoi)
  const diag = caja ? Math.hypot(caja[2] - caja[0], caja[3] - caja[1]) : 0
  // ~4 m en un área de medio grado, ~25 m en una de tres: no se ve a escala de calco.
  const tol = Math.max(0.00003, diag / 20000)
  const elementos = datos?.elements || []
  const porClase = {}
  const candidatos = []
  let puntos = 0
  let t0 = ahora()
  for (let i = 0; i < elementos.length; i++) {
    const d = elementos[i]
    const tags = d?.tags || {}
    porClase[tags.highway] = (porClase[tags.highway] || 0) + 1
    const geom = d?.geometry
    if (Array.isArray(geom) && geom.length >= 2) {
      // `out geom` puede dejar huecos (null): cada tramo sin huecos va aparte.
      const tramos = [[]]
      for (const h of geom) {
        if (h && Number.isFinite(h.lon) && Number.isFinite(h.lat)) tramos[tramos.length - 1].push([h.lon, h.lat])
        else if (tramos[tramos.length - 1].length) tramos.push([])
      }
      const partes = []
      for (const t of tramos) {
        if (t.length < 2) continue
        for (const p of R ? recortarLinea(t, R) : [t]) {
          const s = simplificar(p, tol)
          if (s.length >= 2) partes.push(s)
        }
      }
      if (partes.length) {
        const f = clasificarVia(tags)
        const n = partes.reduce((s, p) => s + p.length, 0)
        puntos += n
        candidatos.push({
          rango: (f.via <= 3 ? 0 : 10) + (RANGO_CLASE[tags.highway] ?? 5),
          largo: largoKm(partes),
          n,
          f: {
            type: 'Feature',
            properties: {
              osm_id: d.id,
              name: tags.name || '',
              fclass: tags.highway || 'track',
              tracktype: tags.tracktype || '',
              surface: tags.surface || '',
              smoothness: tags.smoothness || '',
              via_militar: f.via,
              via_nom: f.nom,
              via_paso: f.paso,
              fuente: 'OSM en vivo',
            },
            geometry: partes.length === 1 ? { type: 'LineString', coordinates: partes[0] } : { type: 'MultiLineString', coordinates: partes },
          },
        })
      }
    }
    if (ahora() - t0 > limites.tramoMs) {
      aviso(`🛤️ Recortando ${miles(elementos.length)} caminos al área… ${Math.round((100 * i) / elementos.length)} %`)
      await ceder()
      t0 = ahora()
    }
  }
  const total = candidatos.length
  let elegidos = candidatos
  if (total > limites.rasgosMax || puntos > limites.puntosMax) {
    elegidos = []
    let n = 0
    for (const c of [...candidatos].sort((a, b) => a.rango - b.rango || b.largo - a.largo)) {
      if (elegidos.length >= limites.rasgosMax) break
      if (n + c.n > limites.puntosMax) continue
      elegidos.push(c)
      n += c.n
    }
  }
  // Una clase que llegó a su tope en Overpass: había más en el área.
  const topado = CLASES.some((c) => c.highway.reduce((s, h) => s + (porClase[h] || 0), 0) >= c.max)
  return { features: elegidos.map((c) => c.f), total, recortada: !!R, topado }
}

// Todo junto: devuelve { features, total, recortada, topado, parcial } o tira el error.
export async function traer(aoi, { aviso = () => {}, ceder, limites = LIMITES, pedir, servidores } = {}) {
  const caja = cajaDe(aoi)
  if (!caja) throw new Error('El área de interés no tiene geometría.')
  const [w, s, e, n] = caja
  if (e - w > limites.ladoMaxGrados || n - s > limites.ladoMaxGrados) {
    const err = new Error(`el área pasa de ${limites.ladoMaxGrados}° de lado: achicala para traer las huellas de OSM`)
    err.definitivo = true
    throw err
  }
  const { datos, parcial } = await descargar(consultaOverpass(caja), { aviso, limites, pedir, servidores })
  aviso(`🛤️ Recortando ${miles((datos.elements || []).length)} caminos al área…`)
  const r = await procesar(datos, aoi, { aviso, ceder, limites })
  return { ...r, parcial }
}
