// ✂️ Repartir un Área de Operaciones con los límites ya trazados, sin redibujar.
//
// El área se corta por sus límites (y por el contorno de las otras áreas) y se
// queda con los pedazos que el lazo encierra, o con el que recibió el clic. Así
// el borde nuevo es EXACTAMENTE el límite trazado: las áreas de dos Cuerpos
// vecinos comparten los mismos vértices y encajan sin huecos ni encimados.
//
// También decide qué está dentro de un área (límites, puntos, marcas, tareas,
// fichas…) para entregárselo al escalón subordinado.
//
// Coordenadas [lng, lat], como en el resto de la Mesa. Se calcula en metros
// sobre un plano local (equirectangular), de sobra para un Teatro de Operaciones.
// Sin dependencias: lo usan el navegador y el servidor.

const RT = 6371008.8, GR = Math.PI / 180

// Mismo orden que la lista de escalones de la Mesa (de menor a mayor).
export const ESCALONES = [
  { id: 'equipo', nombre: 'Equipo', corto: 'EQ' }, { id: 'escuadra', nombre: 'Escuadra', corto: 'ESC' },
  { id: 'seccion', nombre: 'Sección', corto: 'SECC' }, { id: 'compania', nombre: 'Compañía', corto: 'CIA' },
  { id: 'batallon', nombre: 'Batallón', corto: 'BTN' }, { id: 'regimiento', nombre: 'Regimiento', corto: 'RGTO' },
  { id: 'brigada', nombre: 'Brigada', corto: 'BRIG' }, { id: 'division', nombre: 'División', corto: 'DIV' },
  { id: 'cuerpo', nombre: 'Cuerpo de Ejército', corto: 'CE' }, { id: 'ejercito', nombre: 'Ejército', corto: 'EJ' },
]
const rango = e => ESCALONES.findIndex(x => x.id === e)

// Capas de `ops` que se reparten. `punto`: tienen `centro`; `linea`/`area`: tienen `coords`.
export const CAPAS = {
  limites: 'linea', coordinacion: 'punto', pasaje: 'punto', tareas: 'punto', magnitudes: 'punto',
  zonasLog: 'area', sectoresLog: 'area', ejesLog: 'linea', lineasEM: 'linea', flechasZona: 'linea',
  obstaculos: 'mixta', posDef: 'punto', ains: 'punto', objetivos: 'punto', maniobra: 'area',
}

const esPar = p => Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1])
const limitar = (x, a, b) => Math.min(b, Math.max(a, x))
const redondear = x => Math.round(x * 1e7) / 1e7

function plano(puntos) {
  let lng0 = 0, lat0 = 0
  for (const p of puntos) { lng0 += +p[0]; lat0 += +p[1] }
  lng0 /= puntos.length; lat0 /= puntos.length
  const kx = Math.cos(lat0 * GR) * RT * GR, ky = RT * GR
  return { a: p => [(+p[0] - lng0) * kx, (+p[1] - lat0) * ky], de: q => [redondear(q[0] / kx + lng0), redondear(q[1] / ky + lat0)] }
}

// Par-impar: sirve también para lazos que se cruzan a sí mismos.
function dentro(p, anillo) {
  let c = false
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const a = anillo[i], b = anillo[j]
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c
  }
  return c
}
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy
  const t = l ? limitar(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l, 0, 1) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}
function distBorde(p, anillo) {
  let d = Infinity
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) d = Math.min(d, distSeg(p, anillo[j], anillo[i]))
  return d
}
function superficie(anillo) {
  let s = 0
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) s += anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1]
  return s / 2
}
function caja(puntos) {
  const c = [Infinity, Infinity, -Infinity, -Infinity]
  for (const p of puntos) { c[0] = Math.min(c[0], p[0]); c[1] = Math.min(c[1], p[1]); c[2] = Math.max(c[2], p[0]); c[3] = Math.max(c[3], p[1]) }
  return c
}
const diagonal = c => Math.hypot(c[2] - c[0], c[3] - c[1])
function centroide(anillo) {
  let x = 0, y = 0, s = 0
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const f = anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1]
    x += (anillo[j][0] + anillo[i][0]) * f; y += (anillo[j][1] + anillo[i][1]) * f; s += f
  }
  if (Math.abs(s) < 1e-9) return anillo.reduce((m, p) => [m[0] + p[0] / anillo.length, m[1] + p[1] / anillo.length], [0, 0])
  return [x / (3 * s), y / (3 * s)]
}
// Puntos de muestra regulares dentro de un anillo (para medir cuánto de una zona encierra el lazo).
function muestras(anillo, n = 24) {
  const c = caja(anillo), r = []
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const p = [c[0] + (i + 0.5) * (c[2] - c[0]) / n, c[1] + (j + 0.5) * (c[3] - c[1]) / n]
    if (dentro(p, anillo)) r.push(p)
  }
  return r
}

// ── El área cortada por las líneas: grafo plano y sus caras ───────────────────
// base: anillo de vértices {x, y, ll}; lineas: listas de vértices (abiertas o `cerrada`).
// S: cuánto se prolonga cada extremo de línea para que alcance el borde o la otra
// línea aunque se haya quedado corta; lo que sobra se poda después.
function caras(base, lineas, S) {
  const M = 0.5 // metros: dos puntos más cerca que esto son el mismo vértice
  const segs = []
  for (let i = 0; i < base.length; i++) segs.push({ a: base[i], b: base[(i + 1) % base.length], base: true })
  for (const l of lineas) {
    const pts = l.slice()
    if (pts.length < 2) continue
    if (l.cerrada) pts.push(pts[0])
    else if (S > 0) {
      const alargar = (p, q) => {
        const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy)
        return d ? { x: p.x + dx / d * S, y: p.y + dy / d * S, ll: null } : null
      }
      const ini = alargar(pts[0], pts[1]), fin = alargar(pts[pts.length - 1], pts[pts.length - 2])
      if (ini) pts.unshift(ini)
      if (fin) pts.push(fin)
    }
    for (let i = 0; i + 1 < pts.length; i++) {
      if (Math.hypot(pts[i].x - pts[i + 1].x, pts[i].y - pts[i + 1].y) > M) segs.push({ a: pts[i], b: pts[i + 1], base: false })
    }
  }
  const cortes = segs.map(s => [{ t: 0, p: s.a }, { t: 1, p: s.b }])
  const cajas = segs.map(s => [Math.min(s.a.x, s.b.x) - M, Math.min(s.a.y, s.b.y) - M, Math.max(s.a.x, s.b.x) + M, Math.max(s.a.y, s.b.y) + M])
  const sobre = (e, s, i) => { // extremo e de otro segmento apoyado sobre s
    const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, l = dx * dx + dy * dy
    if (!l) return
    const t = ((e.x - s.a.x) * dx + (e.y - s.a.y) * dy) / l
    if (t <= 0 || t >= 1) return
    if (Math.hypot(s.a.x + t * dx - e.x, s.a.y + t * dy - e.y) < M) cortes[i].push({ t, p: e })
  }
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i], ci = cajas[i]
    for (let j = i + 1; j < segs.length; j++) {
      const cj = cajas[j]
      if (ci[0] > cj[2] || cj[0] > ci[2] || ci[1] > cj[3] || cj[1] > ci[3]) continue
      const u = segs[j]
      sobre(u.a, s, i); sobre(u.b, s, i); sobre(s.a, u, j); sobre(s.b, u, j)
      const rx = s.b.x - s.a.x, ry = s.b.y - s.a.y, qx = u.b.x - u.a.x, qy = u.b.y - u.a.y
      const den = rx * qy - ry * qx
      if (Math.abs(den) <= 1e-12 * Math.hypot(rx, ry) * Math.hypot(qx, qy)) continue
      const wx = u.a.x - s.a.x, wy = u.a.y - s.a.y
      const t = (wx * qy - wy * qx) / den, v = (wx * ry - wy * rx) / den
      const e = 1e-9
      if (t < -e || t > 1 + e || v < -e || v > 1 + e) continue
      const p = { x: s.a.x + t * rx, y: s.a.y + t * ry, ll: null }
      cortes[i].push({ t: limitar(t, 0, 1), p }); cortes[j].push({ t: limitar(v, 0, 1), p })
    }
  }
  // Vértices únicos (rejilla de M metros); se conserva la coordenada original si la hay.
  const vert = [], rejilla = new Map()
  const idDe = p => {
    const gx = Math.floor(p.x / M), gy = Math.floor(p.y / M)
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      for (const k of rejilla.get(`${gx + a},${gy + b}`) || []) {
        const v = vert[k]
        if (Math.hypot(v.x - p.x, v.y - p.y) < M) { if (!v.ll && p.ll) v.ll = p.ll; return k }
      }
    }
    vert.push({ x: p.x, y: p.y, ll: p.ll })
    const clave = `${gx},${gy}`
    rejilla.set(clave, [...(rejilla.get(clave) || []), vert.length - 1])
    return vert.length - 1
  }
  const aristas = new Map()
  segs.forEach((s, i) => {
    const ids = cortes[i].sort((a, b) => a.t - b.t).map(c => idDe(c.p))
    for (let k = 0; k + 1 < ids.length; k++) {
      const u = ids[k], v = ids[k + 1]
      if (u === v) continue
      const clave = u < v ? `${u}-${v}` : `${v}-${u}`
      const previa = aristas.get(clave)
      if (previa) previa.base ||= s.base
      else aristas.set(clave, { u, v, base: s.base })
    }
  })
  // Fuera del área no se corta nada; lo que queda colgando (sobrantes) se poda.
  const anilloBase = base.map(p => [p.x, p.y])
  let lista = [...aristas.values()].filter(e => {
    if (e.base) return true
    const m = [(vert[e.u].x + vert[e.v].x) / 2, (vert[e.u].y + vert[e.v].y) / 2]
    return dentro(m, anilloBase) && distBorde(m, anilloBase) >= M
  })
  for (let cambio = true; cambio;) {
    const grado = new Map()
    for (const e of lista) { grado.set(e.u, (grado.get(e.u) || 0) + 1); grado.set(e.v, (grado.get(e.v) || 0) + 1) }
    const antes = lista.length
    lista = lista.filter(e => grado.get(e.u) > 1 && grado.get(e.v) > 1)
    cambio = lista.length !== antes
  }
  // Medias aristas: 2k = u→v, 2k+1 = v→u. La siguiente de u→v es la que sale de v
  // justo antes de v→u en sentido antihorario: cada cara queda a la izquierda.
  const origen = [], salidas = new Map()
  lista.forEach((e, k) => {
    origen[2 * k] = e.u; origen[2 * k + 1] = e.v
    for (const [h, de, a] of [[2 * k, e.u, e.v], [2 * k + 1, e.v, e.u]]) {
      const ang = Math.atan2(vert[a].y - vert[de].y, vert[a].x - vert[de].x)
      salidas.set(de, [...(salidas.get(de) || []), { h, ang }])
    }
  })
  const pos = []
  for (const l of salidas.values()) { l.sort((a, b) => a.ang - b.ang); l.forEach((s, i) => { pos[s.h] = i }) }
  const gemela = h => h ^ 1
  const siguiente = h => { const l = salidas.get(origen[gemela(h)]); return l[(pos[gemela(h)] - 1 + l.length) % l.length].h }
  // -1: cara exterior (o descartada por diminuta); las demás llevan su número.
  const caraDe = new Array(origen.length).fill(-1), recorrida = new Array(origen.length).fill(false), lasCaras = []
  const areaBase = Math.abs(superficie(anilloBase))
  for (let h0 = 0; h0 < origen.length; h0++) {
    if (recorrida[h0]) continue
    const hs = []
    for (let h = h0, n = 0; n <= origen.length; n++) {
      hs.push(h); recorrida[h] = true
      h = siguiente(h)
      if (h === h0) break
    }
    const anillo = hs.map(h => [vert[origen[h]].x, vert[origen[h]].y])
    const sup = superficie(anillo)
    if (sup > areaBase * 1e-7) {
      const id = lasCaras.length
      hs.forEach(h => { caraDe[h] = id })
      lasCaras.push({ id, hs, anillo, sup })
    }
  }
  return { vert, origen, siguiente, gemela, caraDe, caras: lasCaras }
}

// Contorno de la unión de varias caras: las aristas entre dos caras elegidas se
// borran y lo que queda se recorre girando alrededor de cada vértice.
function union(g, elegidas) {
  const sel = new Set(elegidas)
  const esBorde = h => sel.has(g.caraDe[h]) && !sel.has(g.caraDe[g.gemela(h)])
  const visto = new Set(), anillos = []
  for (let h0 = 0; h0 < g.origen.length; h0++) {
    if (!esBorde(h0) || visto.has(h0)) continue
    const anillo = []
    let h = h0, vueltas = 0
    do {
      visto.add(h); anillo.push(g.origen[h])
      let e = g.siguiente(h), giro = 0
      while (!esBorde(e) && giro++ < g.origen.length) e = g.siguiente(g.gemela(e))
      h = e
    } while (h !== h0 && vueltas++ < g.origen.length)
    anillos.push(anillo)
  }
  return anillos
    .map(a => ({ a, sup: superficie(a.map(i => [g.vert[i].x, g.vert[i].y])) }))
    .filter(x => x.sup > 0).sort((x, y) => y.sup - x.sup)
}

/**
 * Reparte un área: devuelve el contorno del pedazo que encierra el lazo (o el que
 * recibe el clic). `areas`: todas las áreas del ejercicio; `limites`: ops.limites.
 * `seleccion`: { lazo: [[lng, lat]…] } o { punto: [lng, lat] }.
 */
export function repartir(areas, limites, seleccion = {}) {
  const lazo = Array.isArray(seleccion.lazo) ? seleccion.lazo.filter(esPar) : null
  const punto = esPar(seleccion.punto) ? seleccion.punto : null
  const validas = (areas || []).filter(a => Array.isArray(a?.coords) && a.coords.filter(esPar).length >= 3)
  if (!validas.length) return { ok: false, error: 'Primero trace el Área de Operaciones que va a repartir.' }
  if (!punto && (!lazo || lazo.length < 3)) return { ok: false, error: 'Encierre la zona con el lazo o haga clic dentro de ella.' }
  const P = plano(validas[0].coords)
  const anillo = a => a.coords.filter(esPar).map(P.a)
  const lazoXY = lazo && lazo.map(P.a)
  // Área a repartir: la que contiene el clic, o la que más tapa el lazo; entre
  // varias parecidas, la más chica (así se puede repartir un Cuerpo en Divisiones).
  const enLazo = lazoXY && (m => m.length ? m : lazoXY)(muestras(lazoXY, 20))
  const puntaje = validas.map(a => {
    const r = anillo(a), sup = Math.abs(superficie(r))
    if (punto) return { a, sup, n: dentro(P.a(punto), r) ? 1 : 0 }
    return { a, sup, n: enLazo.filter(p => dentro(p, r)).length }
  })
  const mejor = Math.max(...puntaje.map(x => x.n))
  if (!mejor) return { ok: false, error: punto ? 'El clic quedó fuera de las Áreas de Operaciones.' : 'El lazo no toca ninguna Área de Operaciones.' }
  const base = puntaje.filter(x => x.n >= mejor * 0.9).sort((x, y) => x.sup - y.sup)[0].a
  const baseLL = base.coords.filter(esPar)
  const baseXY = baseLL.map(p => { const [x, y] = P.a(p); return { x, y, ll: [+p[0], +p[1]] } })
  if (superficie(baseXY.map(p => [p.x, p.y])) < 0) baseXY.reverse()
  // Un clic impreciso deja el límite corto o pasado: hasta el 3 % del área se cierra solo.
  const S = limitar(diagonal(caja(baseXY.map(p => [p.x, p.y]))) * 0.03, 150, 5000)
  const vertices = coords => coords.filter(esPar).map(p => { const [x, y] = P.a(p); return { x, y, ll: [+p[0], +p[1]] } })
  const cortes = [
    ...(limites || []).filter(l => l && l.tipo !== 'flecha' && Array.isArray(l.coords)).map(l => vertices(l.coords)).filter(l => l.length >= 2),
    ...validas.filter(a => a !== base).map(a => Object.assign(vertices(a.coords), { cerrada: true })),
  ]
  let g = caras(baseXY, cortes, S)
  let libre = false
  if (g.caras.length <= 1 && lazo) {
    // Nada divide el área: se corta por el lazo mismo (lazo libre).
    g = caras(baseXY, [...cortes, Object.assign(vertices(lazo), { cerrada: true })], S)
    libre = true
  }
  if (!g.caras.length) return { ok: false, error: 'No se pudo reconocer el contorno del área. Revise que no se cruce a sí mismo.' }
  let elegidas
  if (punto) {
    const p = P.a(punto)
    const c = g.caras.filter(c => dentro(p, c.anillo)).sort((a, b) => a.sup - b.sup)[0]
    elegidas = c ? [c.id] : []
  } else {
    elegidas = g.caras.filter(c => {
      const m = muestras(c.anillo)
      const pts = m.length >= 4 ? m : c.anillo
      return pts.filter(p => dentro(p, lazoXY)).length >= pts.length / 2
    }).map(c => c.id)
  }
  if (!elegidas.length) return { ok: false, error: punto ? 'El clic quedó fuera del área.' : 'El lazo no encierra ninguna zona completa: encierre por lo menos la mitad de la zona.' }
  const anillos = union(g, elegidas)
  if (!anillos.length) return { ok: false, error: 'No se pudo armar el contorno de la zona elegida.' }
  const coords = anillos[0].a.map(i => g.vert[i].ll ? [...g.vert[i].ll] : P.de([g.vert[i].x, g.vert[i].y]))
  return {
    ok: true, coords, base: base.id, baseNombre: base.nombre || '', piezas: elegidas.length, libre,
    separadas: anillos.length > 1, toda: elegidas.length === g.caras.length && !libre && g.caras.length > 1,
  }
}

// ── Qué está dentro de un área ──────────────────────────────────────────────

function geometria(el, tipo) {
  if (!el || typeof el !== 'object') return null
  if (esPar(el.centro) && (tipo === 'punto' || tipo === 'mixta')) return { punto: el.centro }
  if (Array.isArray(el.coords) && tipo !== 'punto') {
    const c = el.coords.filter(esPar)
    if (c.length >= 2) return { linea: c, cerrada: tipo === 'area' && c.length >= 3 }
  }
  return null
}

// Cuánto de una línea cae dentro del área o sobre su borde (en metros).
function tramo(lineaXY, cerrada, anillo, T) {
  const pts = cerrada ? [...lineaXY, lineaXY[0]] : lineaXY
  let total = 0, adentro = 0, borde = 0
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (!l) continue
    const n = Math.min(200, Math.max(1, Math.ceil(l / (T / 2))))
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, m = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
      if (distBorde(m, anillo) <= T) borde += l / n
      else if (dentro(m, anillo)) adentro += l / n
    }
    total += l
  }
  return { total, adentro, borde }
}

// { si: va con el área, borde: corre por el borde más que por adentro }.
function incluye(geo, anillo, P, T) {
  if (geo.punto) { const p = P.a(geo.punto); return { si: dentro(p, anillo) || distBorde(p, anillo) <= T, borde: false } }
  const l = geo.linea.map(P.a)
  if (geo.cerrada && dentro(centroide(l), anillo)) return { si: true, borde: false }
  const { total, adentro, borde } = tramo(l, geo.cerrada, anillo, T)
  const minimo = Math.min(3 * T, total / 2)
  // Entra de verdad en el área, o corre por su borde (el límite del propio Cuerpo).
  // Si sólo la toca con una punta (el límite entre los dos Cuerpos vecinos) no va.
  return { si: adentro >= minimo || (adentro + borde >= total / 4 && adentro + borde >= minimo), borde: borde > adentro }
}

const enemiga = u => ['enemigo', 'enemigas', 'enemiga'].includes(String(u?.bando || '').toLowerCase())
const copiar = x => JSON.parse(JSON.stringify(x))

/**
 * Lo que va con las áreas al escalón subordinado: los límites que la bordean o la
 * cruzan (completos), los puntos de coordinación y de pasaje (también los de su
 * borde), marcas, tareas, obstáculos, objetivos, A.I.N. y las fichas que están
 * dentro. Los límites y marcas de un escalón MAYOR que el del área (los de la
 * FF.TT.T.O. cuando se reparte en Cuerpos) no van. El escalón del área se deduce
 * del menor de los límites con magnitud que la bordean, no de lo elegido en el panel.
 */
export function contenidoDeAreas(areas, ops = {}, unidades = [], { enemigo = true } = {}) {
  const lista = (areas || []).filter(a => Array.isArray(a?.coords) && a.coords.filter(esPar).length >= 3)
  const elegidos = Object.fromEntries(Object.keys(CAPAS).map(k => [k, new Set()]))
  const fichas = new Set()
  for (const area of lista) {
    const P = plano(area.coords.filter(esPar))
    const anillo = area.coords.filter(esPar).map(P.a)
    const T = limitar(diagonal(caja(anillo)) * 0.012, 100, 5000)
    const conMagnitud = el => (el?.tipo || 'magnitud') === 'magnitud' && rango(el?.escalon) >= 0
    const limites = (Array.isArray(ops.limites) ? ops.limites : []).map((el, i) => {
      const geo = geometria(el, 'linea')
      return { i, el, ...(geo ? incluye(geo, anillo, P, T) : { si: false }) }
    }).filter(x => x.si)
    const delBorde = limites.filter(x => x.borde && conMagnitud(x.el)).map(x => rango(x.el.escalon))
    const tope = delBorde.length ? Math.min(...delBorde) : -1
    const mayor = el => tope >= 0 && rango(el?.escalon) > tope
    for (const x of limites) if (!(x.borde && conMagnitud(x.el) && mayor(x.el))) elegidos.limites.add(x.i)
    for (const [capa, tipo] of Object.entries(CAPAS)) {
      if (capa === 'limites') continue
      ;(Array.isArray(ops[capa]) ? ops[capa] : []).forEach((el, i) => {
        if (capa === 'magnitudes' && /^(limite|zona)-/.test(el?.origen || '')) return // siguen a su línea o zona
        if (capa === 'magnitudes' && mayor(el)) return
        const geo = geometria(el, tipo)
        if (geo && incluye(geo, anillo, P, T).si) elegidos[capa].add(i)
      })
    }
    ;(Array.isArray(unidades) ? unidades : []).forEach((u, i) => {
      if (!u || !Number.isFinite(+u.lat) || !Number.isFinite(+u.lng)) return
      if (!enemigo && enemiga(u)) return
      if (dentro(P.a([+u.lng, +u.lat]), anillo)) fichas.add(i)
    })
  }
  const salida = {}
  const nuevoIndice = new Map()
  for (const capa of Object.keys(CAPAS)) {
    const fuente = Array.isArray(ops[capa]) ? ops[capa] : []
    if (capa === 'magnitudes') continue
    salida[capa] = [...elegidos[capa]].sort((a, b) => a - b).map((i, j) => { if (capa === 'limites') nuevoIndice.set(i, j); return copiar(fuente[i]) })
  }
  const claves = new Set((salida.zonasLog || []).map(z => z?.clave).filter(Boolean))
  salida.magnitudes = (Array.isArray(ops.magnitudes) ? ops.magnitudes : []).flatMap((m, i) => {
    const r = /^limite-(\d+)$/.exec(m?.origen || ''), z = /^zona-(.+)$/.exec(m?.origen || '')
    if (r) return nuevoIndice.has(+r[1]) ? [{ ...copiar(m), origen: `limite-${nuevoIndice.get(+r[1])}` }] : []
    if (z) return claves.has(z[1]) ? [copiar(m)] : []
    return elegidos.magnitudes.has(i) ? [copiar(m)] : []
  })
  const uni = [...fichas].sort((a, b) => a - b).map(i => copiar(unidades[i]))
  return { ops: salida, unidades: uni }
}

export function resumenContenido(contenido) {
  const o = contenido?.ops || {}, u = contenido?.unidades || []
  const n = k => (o[k] || []).length
  const partes = [
    [n('limites'), 'límite(s) y línea(s)'], [n('coordinacion'), 'punto(s) de coordinación'], [n('pasaje'), 'punto(s) de pasaje'],
    [n('magnitudes'), 'marca(s) de magnitud'], [n('tareas'), 'tarea(s)'], [n('obstaculos') + n('posDef'), 'obstáculo(s) y posición(es)'],
    [n('objetivos') + n('ains'), 'objetivo(s) y A.I.N.'], [n('zonasLog') + n('sectoresLog') + n('ejesLog') + n('lineasEM'), 'zona(s), sector(es) y eje(s) log.'],
    [n('maniobra') + n('flechasZona'), 'flecha(s)'],
    [u.filter(x => !enemiga(x)).length, 'ficha(s) propia(s)'], [u.filter(enemiga).length, 'ficha(s) enemiga(s)'],
  ].filter(([c]) => c > 0)
  return partes.length ? partes.map(([c, t]) => `${c} ${t}`).join(' · ') : 'nada más que el contorno'
}

// Valida y suma al ejercicio lo que llegó con las áreas. Las marcas que siguen a un
// límite se renumeran detrás de los límites que el ejercicio ya tenía.
const elementoValido = (el, tipo) => {
  if (!el || typeof el !== 'object' || Array.isArray(el)) return false
  if (el.centro !== undefined && !esPar(el.centro)) return false
  if (el.coords !== undefined && !(Array.isArray(el.coords) && el.coords.length >= 2 && el.coords.every(esPar))) return false
  return tipo === 'punto' ? esPar(el.centro) : (esPar(el.centro) || Array.isArray(el.coords))
}
export function sumarContenido(ops, capas) {
  if (!capas || typeof capas !== 'object') return ops
  const previos = (ops.limites || []).length
  const next = { ...ops }
  for (const [capa, tipo] of Object.entries(CAPAS)) {
    const llegan = (Array.isArray(capas[capa]) ? capas[capa] : []).slice(0, 5000).filter(el => elementoValido(el, tipo)).map(copiar)
    if (!llegan.length) continue
    const listos = capa === 'magnitudes' ? llegan.map(m => {
      const r = /^limite-(\d+)$/.exec(m.origen || '')
      return r ? { ...m, origen: `limite-${previos + +r[1]}` } : m
    }) : llegan
    next[capa] = [...(Array.isArray(ops[capa]) ? ops[capa] : []), ...listos]
  }
  return next
}
export function fichasDelPaquete(paquete, marca = '') {
  const u = paquete?.contenido?.unidades
  if (!Array.isArray(u)) return []
  return u.slice(0, 3000).filter(x => x && typeof x === 'object' && Number.isFinite(+x.lat) && Number.isFinite(+x.lng))
    .map((x, i) => ({ ...copiar(x), id: Date.now() + i + Math.random(), ...(marca ? { envioAreas: marca } : {}) }))
}
