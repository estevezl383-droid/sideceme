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

// Las medidas de coordinación (líneas de fase, LCAF, áreas de empeñamiento: las que trae la IA
// o una línea con nombre y sin magnitud, o un contorno punteado cerrado) cruzan el área pero NO
// la reparten: el área de un Cuerpo llega hasta su límite, no hasta la línea de fase (11-10-2026:
// «3 zonas unidas» y el clic que se quedaba en la LF). Siguen yendo con el área (contenidoDeAreas).
const cerradaL = c => Array.isArray(c) && c.length > 3 && esPar(c[0]) && esPar(c[c.length - 1]) && +c[0][0] === +c[c.length - 1][0] && +c[0][1] === +c[c.length - 1][1]
export function esMedida(l) {
  if (!l || l.tipo === 'magnitud' || l.escalon) return false
  return l.origen === 'ogo-ia' || !!String(l.nombre || '').trim() || (l.tipo === 'punteada' && cerradaL(l.coords))
}
const corta = l => l && l.tipo !== 'flecha' && Array.isArray(l.coords) && !esMedida(l)

/**
 * Reparte un área: devuelve el contorno del pedazo que encierra el lazo (o el que
 * recibe el clic). `areas`: todas las áreas del ejercicio; `limites`: ops.limites.
 * `seleccion`: { lazo: [[lng, lat]…] } o { punto: [lng, lat] }.
 * Lo que ya es de otra área cortada dentro de la misma (un Cuerpo ya repartido) se deja
 * afuera (`dejadas`); si el lazo no encierra otra cosa, queda y se avisa (`encima`).
 * `seleccion.toques` (16-10-2026, la vista previa de la tijera): cada toque [lng, lat] suma o
 * quita la zona que tiene debajo. Devuelve también `zonas` (todas, con `elegida`) para dibujarlas.
 */
export function repartir(areas, limites, seleccion = {}) {
  const lazo = Array.isArray(seleccion.lazo) ? seleccion.lazo.filter(esPar) : null
  const punto = esPar(seleccion.punto) ? seleccion.punto : null
  const toques = Array.isArray(seleccion.toques) ? seleccion.toques.filter(esPar) : []
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
    ...(limites || []).filter(corta).map(l => vertices(l.coords)).filter(l => l.length >= 2),
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
  if (!elegidas.length && !toques.length) return { ok: false, error: punto ? 'El clic quedó fuera del área.' : 'El lazo no encierra ninguna zona completa: encierre por lo menos la mitad de la zona.' }
  // Las otras áreas ya cortadas DENTRO de la base (los Cuerpos ya repartidos): sus zonas no se repiten.
  const anilloB = baseXY.map(p => [p.x, p.y])
  const hermanas = validas.filter(a => a !== base).map(a => ({ a, r: anillo(a) })).filter(({ r }) => {
    const m = muestras(r, 12), pts = m.length ? m : r
    return pts.filter(p => dentro(p, anilloB)).length > pts.length / 2
  })
  const adentro = c => { const m = muestras(c.anillo, 8); return m.length ? m[Math.floor(m.length / 2)] : centroide(c.anillo) }
  const duenas = id => { const c = g.caras[id], p = adentro(c); return hermanas.filter(h => dentro(p, h.r)).map(h => h.a.nombre || 'otra área') }
  const libres = elegidas.filter(id => !duenas(id).length)
  const ajenas = [...new Set(elegidas.flatMap(duenas))]
  let dejadas = [], encima = []
  if (libres.length && libres.length < elegidas.length) { dejadas = ajenas; elegidas = libres }
  else if (!libres.length) encima = ajenas
  // Los toques de la vista previa mandan sobre lo que eligió el lazo: suman o quitan la zona de abajo.
  for (const t of toques) {
    const q = P.a(t), c = g.caras.filter(c => dentro(q, c.anillo)).sort((a, b) => a.sup - b.sup)[0]
    if (c) elegidas = elegidas.includes(c.id) ? elegidas.filter(id => id !== c.id) : [...elegidas, c.id]
  }
  const aLL = i => g.vert[i].ll ? [...g.vert[i].ll] : P.de([g.vert[i].x, g.vert[i].y])
  const zonas = () => g.caras.map(c => ({ id: c.id, coords: c.hs.map(h => aLL(g.origen[h])), elegida: elegidas.includes(c.id) }))
  if (!elegidas.length) return { ok: false, error: 'No quedó ninguna zona elegida: toque una zona para sumarla.', zonas: zonas() }
  const anillos = union(g, elegidas)
  if (!anillos.length) return { ok: false, error: 'No se pudo armar el contorno de la zona elegida.' }
  const coords = anillos[0].a.map(aLL)
  return {
    ok: true, coords, base: base.id, baseNombre: base.nombre || '', piezas: elegidas.length, libre,
    separadas: anillos.length > 1, toda: elegidas.length === g.caras.length && !libre && g.caras.length > 1,
    dejadas, encima, baseCoords: baseLL.map(p => [+p[0], +p[1]]), zonas: zonas(),
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

// Los límites que bordean o cruzan el área y el escalón del área: el menor de los límites con
// magnitud de su borde. `fuera`: los del borde de un escalón MAYOR (los de la FF.TT.T.O. cuando
// se reparte en Cuerpos), que no van con el área.
function topeDelArea(areaLL, todos) {
  const P = plano(areaLL), anillo = areaLL.map(P.a)
  const T = limitar(diagonal(caja(anillo)) * 0.012, 100, 5000)
  const conMagnitud = el => (el?.tipo || 'magnitud') === 'magnitud' && rango(el?.escalon) >= 0
  const limites = (Array.isArray(todos) ? todos : []).map((el, i) => {
    const geo = geometria(el, 'linea')
    return { i, el, ...(geo ? incluye(geo, anillo, P, T) : { si: false }) }
  }).filter(x => x.si)
  const delBorde = limites.filter(x => x.borde && conMagnitud(x.el)).map(x => rango(x.el.escalon))
  const tope = delBorde.length ? Math.min(...delBorde) : -1
  const mayor = el => tope >= 0 && rango(el?.escalon) > tope
  return { limites, mayor, tope, fuera: new Set(limites.filter(x => x.borde && conMagnitud(x.el) && mayor(x.el)).map(x => x.i)) }
}
// El escalón de un área por los límites con magnitud que la bordean (el menor): «cuerpo» si la
// rodean límites de Cuerpo. '' si no hay ninguno.
export function escalonDelBorde(areaLL, limites) {
  const c = (Array.isArray(areaLL) ? areaLL : []).filter(esPar)
  if (c.length < 3) return ''
  const { tope } = topeDelArea(c, limites)
  return tope >= 0 ? ESCALONES[tope].id : ''
}

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
    const { limites, mayor, fuera } = topeDelArea(area.coords.filter(esPar), ops.limites)
    for (const x of limites) if (!fuera.has(x.i)) elegidos.limites.add(x.i)
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

// ── El CMOC que está dentro (sólo las capas a la vista: «todo lo que está activo») ──
// Lo pidió Sergio (11-10-2026): la selección guardada lleva todo lo que está activo en la carta,
// también el terreno ya juzgado (las áreas de empeño, las avenidas…) que está prendido.
// `vis`: la clave de «Qué se ve en el calco» (verCapa); `forma`: punto (centro), linea, area
// (coords) o geo (GeoJSON: las zonas restringidas que arma la Mesa).
export const CAPAS_CMOC = [
  { capa: 'ae', vis: 'ae', forma: 'area', nombre: 'área(s) de empeño' },
  { capa: 'restringido', vis: 'restringido', forma: 'geo', nombre: 'zona(s) restringida(s)' },
  { capa: 'severo', vis: 'severo', forma: 'geo', nombre: 'zona(s) sev. restringida(s)' },
  { capa: 'defensivo', vis: 'defensivo', forma: 'linea', nombre: 'terreno(s) defensivo(s)' },
  { capa: 'avenidas', vis: 'avenidas', forma: 'linea', nombre: 'avenida(s) de aproximación' },
  { capa: 'corredores', vis: 'corredores', forma: 'linea', nombre: 'corredor(es) de movilidad' },
  { capa: 'corredoresClandestinos', vis: 'corredoresClandestinos', forma: 'linea', nombre: 'corredor(es) clandestino(s)' },
  { capa: 'clave', vis: 'clave', forma: 'punto', nombre: 'terreno(s) clave' },
]
// Las capas del CMOC que están prendidas y tienen algo dibujado. `clandestinos`: el botón
// «🟥 Clandestinos» de la barra (si está en false, los corredores clandestinos no se ven).
export function capasCmocVisibles(cmoc, verCapa = {}, { clandestinos = true } = {}) {
  return CAPAS_CMOC.filter(c => verCapa?.[c.vis] !== false && (c.capa !== 'corredoresClandestinos' || clandestinos !== false) &&
    Array.isArray(cmoc?.[c.capa]) && cmoc[c.capa].length).map(c => c.capa)
}
function anillosGeo(g) {
  if (!g || typeof g !== 'object') return []
  if (g.type === 'FeatureCollection') return (g.features || []).flatMap(anillosGeo)
  if (g.type === 'Feature' || g.geometry) return anillosGeo(g.geometry)
  if (g.type === 'Polygon') return [g.coordinates?.[0]].filter(Array.isArray)
  if (g.type === 'MultiPolygon') return (g.coordinates || []).map(p => p?.[0]).filter(Array.isArray)
  return []
}
function geometriasCmoc(el, forma) {
  if (!el || typeof el !== 'object') return []
  if (forma === 'punto') return esPar(el.centro) ? [{ punto: el.centro }] : []
  if (forma === 'geo') return anillosGeo(el).map(r => r.filter(esPar)).filter(r => r.length >= 3).map(r => ({ linea: r, cerrada: true }))
  const c = Array.isArray(el.coords) ? el.coords.filter(esPar) : []
  const g = c.length >= 2 ? [{ linea: c, cerrada: forma === 'area' && c.length >= 3 }] : []
  return el.poligono ? g.concat(anillosGeo(el.poligono).map(r => ({ linea: r.filter(esPar), cerrada: true })).filter(x => x.linea.length >= 3)) : g
}
export function cmocDeAreas(areas, cmoc = {}, capas = null) {
  const lista = (areas || []).filter(a => Array.isArray(a?.coords) && a.coords.filter(esPar).length >= 3)
  const salida = {}
  for (const c of CAPAS_CMOC) {
    if (capas && !capas.includes(c.capa)) continue
    const fuente = Array.isArray(cmoc?.[c.capa]) ? cmoc[c.capa] : []
    const van = fuente.filter(el => lista.some(area => {
      const P = plano(area.coords.filter(esPar)), anillo = area.coords.filter(esPar).map(P.a)
      const T = limitar(diagonal(caja(anillo)) * 0.012, 100, 5000)
      return geometriasCmoc(el, c.forma).some(geo => incluye(geo, anillo, P, T).si)
    }))
    if (van.length) salida[c.capa] = van.map(copiar)
  }
  return salida
}
// Valida lo que llega y lo suma al CMOC del que recibe. `marca`: el envío (una sola vez por envío).
export function sumarCmoc(cmoc, llegan, marca = '') {
  if (!llegan || typeof llegan !== 'object') return cmoc
  const previo = cmoc && typeof cmoc === 'object' ? cmoc : {}
  if (marca && CAPAS_CMOC.some(c => (previo[c.capa] || []).some(x => x?.envioAreas === marca))) return previo
  const next = { ...previo }
  let suma = 0
  for (const c of CAPAS_CMOC) {
    const van = (Array.isArray(llegan[c.capa]) ? llegan[c.capa] : []).slice(0, 2000)
      .filter(el => el && typeof el === 'object' && !Array.isArray(el) && geometriasCmoc(el, c.forma).length)
      .map(el => ({ ...copiar(el), ...(marca ? { envioAreas: marca } : {}) }))
    if (!van.length) continue
    next[c.capa] = [...(Array.isArray(previo[c.capa]) ? previo[c.capa] : []), ...van]
    suma += van.length
  }
  return suma ? next : previo
}

export function resumenContenido(contenido) {
  const o = contenido?.ops || {}, u = contenido?.unidades || [], cm = contenido?.cmoc || {}
  const n = k => (o[k] || []).length
  const partes = [
    [n('limites'), 'límite(s) y línea(s)'], [n('coordinacion'), 'punto(s) de coordinación'], [n('pasaje'), 'punto(s) de pasaje'],
    [n('magnitudes'), 'marca(s) de magnitud'], [n('tareas'), 'tarea(s)'], [n('obstaculos') + n('posDef'), 'obstáculo(s) y posición(es)'],
    [n('objetivos') + n('ains'), 'objetivo(s) y A.I.N.'], [n('zonasLog') + n('sectoresLog') + n('ejesLog') + n('lineasEM'), 'zona(s), sector(es) y eje(s) log.'],
    [n('maniobra') + n('flechasZona'), 'flecha(s)'],
    [u.filter(x => !enemiga(x)).length, 'ficha(s) propia(s)'], [u.filter(enemiga).length, 'ficha(s) enemiga(s)'],
    ...CAPAS_CMOC.map(c => [(cm[c.capa] || []).length, c.nombre + ' (CMOC)']),
    ...Object.entries(contenido?.resultados || {}).map(([id, r]) => [(r?.fc?.features || []).length, `elemento(s) del calco ${NOMBRES_CALCOS[id] || id}`]),
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

// ── ✂️ La tijera (16-10-2026) ────────────────────────────────────────────────────
// Lo pidió Sergio con las capturas de FABBLE 1.1 (cortó el Cuerpo de arriba y en el ejercicio que
// recibió seguían las líneas enteras hasta el fondo del Cuerpo de abajo y no estaban las brigadas
// rojas): «debe cortar la línea por donde pasa el lazo… no seleccionás las unidades enemigas… debe
// seleccionar todo lo que esté activado y se vea en la mesa, pero cortado por donde pasó la tijera».
// Al preguntarle, eligió:
//   · las líneas se cortan DONDE PASÓ EL LAZO (no se entregan enteras);
//   · fuera de las Áreas de Operaciones del ejercicio (el frente enemigo, el área de interés) va todo
//     lo activado que encierre el lazo; dentro de ellas, sólo lo del área recortada: no se mezcla con
//     el Cuerpo vecino aunque el lazo lo tape;
//   · todo lo que está a la vista: medidas, fichas propias y enemigas, el CMOC prendido y los calcos
//     del terreno prendidos (hidrografía, curvas de nivel, caminos…), cortados por el lazo.
// Sin lazo (un toque dentro de la zona), la región es el área recortada.

export const NOMBRES_CALCOS = {
  hidrografico: 'hidrográfico', elevaciones: 'de elevaciones', comunicaciones: 'de comunicaciones',
  poblaciones: 'de poblaciones', vegetacion: 'de vegetación', jurisdicciones: 'de jurisdicciones militares',
}
// Qué tecla de «Qué se ve en el calco» prende o apaga cada capa de `ops` (las demás —límites,
// puntos, marcas, tareas, obstáculos— son las medidas y se ven siempre).
const VIS_OPS = { zonasLog: 'zonasLog', sectoresLog: 'zonasLog', ejesLog: 'zonasLog', posDef: 'posDef', objetivos: 'objetivos', maniobra: 'maniobra', ains: 'ains' }
const MARGEN = 0.5 // metros

// Índice en grilla de los bordes que cortan (el área, el lazo y las Áreas de Operaciones).
function indiceBordes(anillos) {
  const bordes = []
  for (const r of anillos) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if (r[j][0] !== r[i][0] || r[j][1] !== r[i][1]) bordes.push([r[j], r[i]])
  }
  if (!bordes.length) return { enCaja: () => [] }
  const c = caja(bordes.flat())
  const n = Math.max(1, Math.min(96, Math.ceil(Math.sqrt(bordes.length))))
  const w = Math.max((c[2] - c[0]) / n, 1e-6), alto = Math.max((c[3] - c[1]) / n, 1e-6)
  const celdas = new Map()
  const recorrer = (x0, y0, x1, y1, fn) => {
    const celda = (v, o, t) => Math.min(n - 1, Math.max(0, Math.floor((v - o) / t)))
    const i0 = celda(x0, c[0], w), i1 = celda(x1, c[0], w), j0 = celda(y0, c[1], alto), j1 = celda(y1, c[1], alto)
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) fn(i * n + j)
  }
  bordes.forEach(([a, b], k) => recorrer(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]),
    id => { const l = celdas.get(id); if (l) l.push(k); else celdas.set(id, [k]) }))
  const visto = new Uint32Array(bordes.length)
  let sello = 0
  return {
    enCaja(x0, y0, x1, y1) {
      if (x1 < c[0] - MARGEN || x0 > c[2] + MARGEN || y1 < c[1] - MARGEN || y0 > c[3] + MARGEN) return []
      sello++
      const r = []
      recorrer(x0, y0, x1, y1, id => { for (const k of celdas.get(id) || []) if (visto[k] !== sello) { visto[k] = sello; r.push(bordes[k]) } })
      return r
    },
  }
}

// Dónde corta el borde [c, d] al tramo [a, b] (t entre 0 y 1). También las puntas del borde que se
// apoyan sobre el tramo: así un límite que corre por encima del borde del área se parte en sus vértices.
function cortesTramo(a, b, c, d, salida) {
  const rx = b[0] - a[0], ry = b[1] - a[1], qx = d[0] - c[0], qy = d[1] - c[1]
  const l2 = rx * rx + ry * ry
  if (!l2) return
  const den = rx * qy - ry * qx
  if (Math.abs(den) > 1e-12 * Math.sqrt(l2) * Math.hypot(qx, qy)) {
    const wx = c[0] - a[0], wy = c[1] - a[1]
    const t = (wx * qy - wy * qx) / den, v = (wx * ry - wy * rx) / den
    if (t > 1e-9 && t < 1 - 1e-9 && v >= -1e-9 && v <= 1 + 1e-9) salida.push(t)
  }
  for (const e of [c, d]) {
    const t = ((e[0] - a[0]) * rx + (e[1] - a[1]) * ry) / l2
    if (t > 1e-9 && t < 1 - 1e-9 && Math.hypot(a[0] + t * rx - e[0], a[1] + t * ry - e[1]) < MARGEN) salida.push(t)
  }
}

// Un punto que seguro está dentro del anillo: el medio del tramo más ancho de una horizontal.
function puntoInterior(anillo) {
  const c = caja(anillo)
  let mejor = null, ancho = -1
  for (const f of [0.5, 0.31, 0.69, 0.17, 0.83, 0.06, 0.94]) {
    const y = c[1] + (c[3] - c[1]) * f, xs = []
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
      const a = anillo[i], b = anillo[j]
      if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
    }
    xs.sort((p, q) => p - q)
    for (let k = 0; k + 1 < xs.length; k += 2) if (xs[k + 1] - xs[k] > ancho) { ancho = xs[k + 1] - xs[k]; mejor = [(xs[k] + xs[k + 1]) / 2, y] }
    if (mejor && ancho > (c[2] - c[0]) * 0.05) break
  }
  return mejor || centroide(anillo)
}

/**
 * La región que entrega la tijera. `area`: el contorno recortado; `lazo`: el trazo a mano alzada
 * (o null si fue un toque); `areas`: los contornos de las Áreas de Operaciones del ejercicio (sin
 * el área recortada). Adentro: lo que está dentro del lazo y, si cae dentro de alguna Área de
 * Operaciones, sólo si es del área recortada (o corre por su borde).
 */
export function regionTijera({ area, lazo = null, areas = [] } = {}) {
  const A0 = (Array.isArray(area) ? area : []).filter(esPar).map(p => [+p[0], +p[1]])
  if (A0.length < 3) return null
  const P = plano(A0)
  const A = A0.map(P.a)
  const lz = (Array.isArray(lazo) ? lazo : []).filter(esPar)
  const L = lz.length >= 3 ? lz.map(P.a) : null
  const vistos = new Set([JSON.stringify(A0)])
  const otras = !L ? [] : (Array.isArray(areas) ? areas : []).map(c => (Array.isArray(c) ? c : []).filter(esPar).map(p => [+p[0], +p[1]])).filter(c => {
    if (c.length < 3) return false
    const k = JSON.stringify(c)
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  }).map(c => c.map(P.a))
  const d = diagonal(caja(A))
  const eps = limitar(d * 2e-4, 2, 30), tolPunto = limitar(d * 0.012, 100, 5000)
  const en = (q, tol) => (!L || dentro(q, L)) && (dentro(q, A) || distBorde(q, A) <= tol || (!!L && !otras.some(r => dentro(q, r))))
  return {
    P, A, L, eps, tolPunto, indice: indiceBordes([A, ...(L ? [L] : []), ...otras]),
    enLinea: q => en(q, eps), enPunto: q => en(q, tolPunto),
  }
}

// Corta una línea [[lng, lat]…]: devuelve los tramos que quedan dentro de la región.
export function cortarLinea(R, coords) {
  const ll = (Array.isArray(coords) ? coords : []).filter(esPar).map(p => [+p[0], +p[1]])
  if (ll.length < 2) return []
  const xy = ll.map(R.P.a)
  const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const c = caja(xy)
  if (!R.indice.enCaja(c[0] - MARGEN, c[1] - MARGEN, c[2] + MARGEN, c[3] + MARGEN).length) {
    // Ningún borde cerca: queda entera o no va.
    let k = 0
    while (k + 2 < xy.length && xy[k][0] === xy[k + 1][0] && xy[k][1] === xy[k + 1][1]) k++
    return R.enLinea(medio(xy[k], xy[k + 1])) ? [ll] : []
  }
  // Los vértices y, entre ellos, los puntos donde cruza un borde (corte).
  const nodos = [{ q: xy[0], ll: ll[0], corte: false }]
  for (let i = 0; i + 1 < xy.length; i++) {
    const a = xy[i], b = xy[i + 1], ts = []
    for (const [p, q] of R.indice.enCaja(Math.min(a[0], b[0]) - MARGEN, Math.min(a[1], b[1]) - MARGEN, Math.max(a[0], b[0]) + MARGEN, Math.max(a[1], b[1]) + MARGEN)) cortesTramo(a, b, p, q, ts)
    ts.sort((x, y) => x - y)
    let previo = 0
    for (const t of ts) {
      if (t - previo < 1e-9) continue
      previo = t
      const q = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
      nodos.push({ q, ll: R.P.de(q), corte: true })
    }
    nodos.push({ q: b, ll: ll[i + 1], corte: false })
  }
  // Entre dos cortes la línea está toda adentro o toda afuera: se mira el medio de su tramo más largo.
  const tramos = []
  let ini = 0, abierto = null
  for (let k = 1; k < nodos.length; k++) {
    if (!nodos[k].corte && k < nodos.length - 1) continue
    let mejor = -1, largo = 0
    for (let m = ini; m < k; m++) {
      const l = Math.hypot(nodos[m + 1].q[0] - nodos[m].q[0], nodos[m + 1].q[1] - nodos[m].q[1])
      if (l > largo) { largo = l; mejor = m }
    }
    const adentro = mejor >= 0 && R.enLinea(medio(nodos[mejor].q, nodos[mejor + 1].q))
    if (adentro) {
      const parte = nodos.slice(ini, k + 1).map(n => n.ll)
      if (abierto) abierto.push(...parte.slice(1))
      else { abierto = parte; tramos.push(abierto) }
    } else abierto = null
    ini = k
  }
  return tramos.map(t => t.filter((p, i) => !i || p[0] !== t[i - 1][0] || p[1] !== t[i - 1][1])).filter(t => t.length >= 2)
}

// Corta un polígono (su anillo exterior): devuelve los anillos que quedan y si quedó entero.
export function cortarPoligono(R, coords) {
  let ll = (Array.isArray(coords) ? coords : []).filter(esPar).map(p => [+p[0], +p[1]])
  if (ll.length > 3 && ll[0][0] === ll[ll.length - 1][0] && ll[0][1] === ll[ll.length - 1][1]) ll = ll.slice(0, -1)
  if (ll.length < 3) return { anillos: [], entero: false }
  const xy = ll.map(R.P.a)
  const c = caja(xy)
  const cerca = R.indice.enCaja(c[0] - MARGEN, c[1] - MARGEN, c[2] + MARGEN, c[3] + MARGEN)
  const entero = () => R.enLinea(puntoInterior(xy)) ? { anillos: [ll], entero: true } : { anillos: [], entero: false }
  if (!cerca.length) return entero()
  const base = xy.map((q, i) => ({ x: q[0], y: q[1], ll: ll[i] }))
  if (superficie(xy) < 0) base.reverse()
  const g = caras(base, cerca.map(([p, q]) => [{ x: p[0], y: p[1], ll: null }, { x: q[0], y: q[1], ll: null }]), 0)
  if (g.caras.length <= 1) return entero()
  const elegidas = g.caras.filter(f => R.enLinea(puntoInterior(f.anillo))).map(f => f.id)
  if (!elegidas.length) return { anillos: [], entero: false }
  if (elegidas.length === g.caras.length) return { anillos: [ll], entero: true }
  const anillos = union(g, elegidas).map(x => x.a.map(i => g.vert[i].ll ? [...g.vert[i].ll] : R.P.de([g.vert[i].x, g.vert[i].y])))
  return { anillos: anillos.filter(a => a.length >= 3), entero: false }
}
const cerrar = a => a.length && (a[0][0] !== a[a.length - 1][0] || a[0][1] !== a[a.length - 1][1]) ? [...a, [...a[0]]] : a

// Una geometría GeoJSON cortada por la región (null si no queda nada).
export function cortarGeometria(R, g) {
  if (!g || typeof g !== 'object') return null
  const punto = p => esPar(p) && R.enPunto(R.P.a(p))
  switch (g.type) {
    case 'Point': return punto(g.coordinates) ? copiar(g) : null
    case 'MultiPoint': {
      const c = (g.coordinates || []).filter(punto)
      return c.length ? { type: 'MultiPoint', coordinates: copiar(c) } : null
    }
    case 'LineString': case 'MultiLineString': {
      const lineas = g.type === 'LineString' ? [g.coordinates] : (g.coordinates || [])
      const t = lineas.flatMap(l => cortarLinea(R, l))
      return !t.length ? null : t.length === 1 ? { type: 'LineString', coordinates: t[0] } : { type: 'MultiLineString', coordinates: t }
    }
    case 'Polygon': case 'MultiPolygon': {
      const polis = g.type === 'Polygon' ? [g.coordinates] : (g.coordinates || [])
      const salida = polis.flatMap(p => {
        if (!Array.isArray(p) || !Array.isArray(p[0])) return []
        const r = cortarPoligono(R, p[0])
        // Si quedó entero se conservan sus huecos; si se cortó, sólo el contorno.
        return r.entero ? [copiar(p)] : r.anillos.map(a => [cerrar(a)])
      })
      return !salida.length ? null : salida.length === 1 ? { type: 'Polygon', coordinates: salida[0] } : { type: 'MultiPolygon', coordinates: salida }
    }
    case 'GeometryCollection': {
      const gs = (g.geometries || []).map(x => cortarGeometria(R, x)).filter(Boolean)
      return gs.length ? { type: 'GeometryCollection', geometries: gs } : null
    }
    default: return null
  }
}
function cortarGeo(R, x) {
  if (!x || typeof x !== 'object') return null
  if (x.type === 'FeatureCollection') {
    const features = (x.features || []).map(f => cortarGeo(R, f)).filter(Boolean)
    return features.length ? { ...x, features } : null
  }
  if (x.type === 'Feature') {
    const geometry = cortarGeometria(R, x.geometry)
    return geometry ? { ...copiar(x), geometry } : null
  }
  return cortarGeometria(R, x)
}
// Largo de una línea en el plano y el punto a la mitad de su recorrido.
function mitadDeLinea(xy) {
  let total = 0
  for (let i = 0; i + 1 < xy.length; i++) total += Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1])
  let falta = total / 2
  for (let i = 0; i + 1 < xy.length; i++) {
    const l = Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1])
    if (l >= falta && l > 0) return [xy[i][0] + (xy[i + 1][0] - xy[i][0]) * falta / l, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * falta / l]
    falta -= l
  }
  return xy[0]
}
const distLinea = (q, xy) => { let d = Infinity; for (let i = 0; i + 1 < xy.length; i++) d = Math.min(d, distSeg(q, xy[i], xy[i + 1])); return d }

/**
 * Lo que entrega la tijera, cortado por donde pasó: { ops, unidades, cmoc, resultados }.
 * `tijera`: { area, lazo, areas } (ver regionTijera). `vista`: lo que estaba a la vista al cortar:
 *   verCapa (las teclas de «Qué se ve en el calco»), clandestinos (el botón de la barra) y
 *   calcos (los calcos del terreno prendidos: ids de `resultados`).
 * `enemigo: false` deja afuera las fichas enemigas (la casilla «También las fichas enemigas»).
 */
export function recortarContenido(tijera, { ops = {}, unidades = [], cmoc = null, resultados = null, vista = {}, enemigo = true, conCmoc = true } = {}) {
  const R = regionTijera(tijera || {})
  if (!R) throw new Error('El área recortada no tiene un contorno válido.')
  const ver = vista?.verCapa || {}
  const visible = k => ver[k] !== false
  const enPunto = p => esPar(p) && R.enPunto(R.P.a(p))
  const salida = { ops: {}, unidades: [], cmoc: {}, resultados: {} }
  const areaLL = tijera.area.filter(esPar).map(p => [+p[0], +p[1]])
  const { mayor, fuera } = topeDelArea(areaLL, ops.limites)

  // Límites y líneas: cortados donde pasó el lazo. Las flechas van enteras (o no van) por su mitad.
  const piezas = new Map() // índice viejo → [{ j, xy }]
  salida.ops.limites = []
  ;(Array.isArray(ops.limites) ? ops.limites : []).forEach((el, i) => {
    if (!el || !Array.isArray(el.coords) || fuera.has(i)) return
    const ll = el.coords.filter(esPar)
    if (ll.length < 2) return
    let partes
    if (el.tipo === 'flecha') partes = R.enLinea(mitadDeLinea(ll.map(R.P.a))) ? [ll.map(p => [+p[0], +p[1]])] : []
    else if (cerradaL(ll)) partes = cortarPoligono(R, ll).anillos.map(cerrar)
    else partes = cortarLinea(R, ll)
    for (const coords of partes) {
      const j = salida.ops.limites.length
      salida.ops.limites.push({ ...copiar(el), coords })
      piezas.set(i, [...(piezas.get(i) || []), { j, xy: coords.map(R.P.a) }])
    }
  })
  for (const [capa, tipo] of Object.entries(CAPAS)) {
    if (capa === 'limites' || capa === 'magnitudes') continue
    if (VIS_OPS[capa] && !visible(VIS_OPS[capa])) { salida.ops[capa] = []; continue }
    const lista = []
    for (const el of Array.isArray(ops[capa]) ? ops[capa] : []) {
      if (!el || typeof el !== 'object') continue
      if (esPar(el.centro) && (tipo === 'punto' || tipo === 'mixta')) { if (enPunto(el.centro)) lista.push(copiar(el)); continue }
      if (tipo === 'punto') continue
      const ll = Array.isArray(el.coords) ? el.coords.filter(esPar) : []
      if (ll.length < 2) continue
      if (capa === 'flechasZona' || capa === 'maniobra') {
        const xy = ll.map(R.P.a)
        if (R.enLinea(capa === 'maniobra' && xy.length >= 3 ? puntoInterior(xy) : mitadDeLinea(xy))) lista.push(copiar(el))
      } else if (tipo === 'area' && ll.length >= 3) {
        // Una zona logística cortada queda en su pedazo más grande (la clave no se repite).
        const r = cortarPoligono(R, ll)
        if (!r.anillos.length) continue
        const mayorAnillo = r.entero ? null : r.anillos.map(a => ({ a, s: Math.abs(superficie(a.map(R.P.a))) })).sort((x, y) => y.s - x.s)[0].a
        lista.push(r.entero ? copiar(el) : { ...copiar(el), coords: mayorAnillo })
      } else {
        for (const coords of cortarLinea(R, ll)) lista.push({ ...copiar(el), coords })
      }
    }
    salida.ops[capa] = lista
  }
  // Marcas de magnitud: las de un límite siguen al pedazo que tienen al lado; las de una zona, a su zona.
  const claves = new Set((salida.ops.zonasLog || []).map(z => z?.clave).filter(Boolean))
  salida.ops.magnitudes = []
  for (const m of Array.isArray(ops.magnitudes) ? ops.magnitudes : []) {
    if (!m || !esPar(m.centro)) continue
    const rl = /^limite-(\d+)$/.exec(m.origen || ''), rz = /^zona-(.+)$/.exec(m.origen || '')
    if (rl) {
      const ps = piezas.get(+rl[1])
      if (!ps || !enPunto(m.centro)) continue
      const q = R.P.a(m.centro)
      const p = ps.map(x => ({ j: x.j, d: distLinea(q, x.xy) })).sort((a, b) => a.d - b.d)[0]
      salida.ops.magnitudes.push({ ...copiar(m), origen: `limite-${p.j}` })
    } else if (rz) { if (claves.has(rz[1])) salida.ops.magnitudes.push(copiar(m)) }
    else if (!mayor(m) && enPunto(m.centro)) salida.ops.magnitudes.push(copiar(m))
  }

  // Las fichas que se ven: propias y enemigas (con su tecla y la casilla de las enemigas).
  salida.unidades = (Array.isArray(unidades) ? unidades : []).filter(u => {
    if (!u || !Number.isFinite(+u.lat) || !Number.isFinite(+u.lng)) return false
    if (enemiga(u) ? !(enemigo && visible('unidadesRojo')) : !visible('unidadesAzul')) return false
    return R.enLinea(R.P.a([+u.lng, +u.lat]))
  }).map(copiar)

  // El CMOC prendido.
  if (conCmoc && cmoc && typeof cmoc === 'object') {
    for (const capa of capasCmocVisibles(cmoc, ver, { clandestinos: vista?.clandestinos })) {
      const c = CAPAS_CMOC.find(x => x.capa === capa), lista = []
      for (const el of cmoc[capa]) {
        if (!el || typeof el !== 'object') continue
        if (c.forma === 'punto') { if (enPunto(el.centro)) lista.push(copiar(el)); continue }
        if (c.forma === 'geo') { const g = cortarGeo(R, el); if (g) lista.push(g); continue }
        const ll = Array.isArray(el.coords) ? el.coords.filter(esPar) : []
        if (c.forma === 'area' && ll.length >= 3) {
          for (const a of cortarPoligono(R, ll).anillos) {
            const ring = cerrar(a)
            lista.push({ ...copiar(el), coords: ring, ...(esPar(el.centro) ? { centro: R.P.de(puntoInterior(a.map(R.P.a))) } : {}) })
          }
          continue
        }
        const partes = ll.length >= 2 ? cortarLinea(R, ll) : []
        const poligono = el.poligono ? cortarGeo(R, el.poligono) : null
        if (!partes.length && !poligono) continue
        if (!partes.length) { lista.push({ ...copiar(el), poligono }); continue }
        // El polígono del corredor (si lo tiene) va con el pedazo más largo.
        const largo = xy => { let s = 0; for (let i = 0; i + 1 < xy.length; i++) s += Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1]); return s }
        const orden = partes.map((coords, k) => ({ coords, k, l: largo(coords.map(R.P.a)) })).sort((a, b) => b.l - a.l)
        for (const p of orden) {
          const nuevo = { ...copiar(el), coords: p.coords }
          if (el.poligono) { if (p === orden[0] && poligono) nuevo.poligono = poligono; else delete nuevo.poligono }
          lista.push(nuevo)
        }
      }
      if (lista.length) salida.cmoc[capa] = lista
    }
  }

  // Los calcos del terreno prendidos (hidrografía, curvas de nivel, caminos…).
  const calcos = Array.isArray(vista?.calcos) ? vista.calcos : []
  for (const id of calcos) {
    const r = resultados && resultados[id]
    if (!r || !r.fc || !Array.isArray(r.fc.features)) continue
    const features = r.fc.features.map(f => cortarGeo(R, f)).filter(Boolean)
    if (!features.length) continue
    const porCapa = {}, vistos = new Set(r.fc.features.map(f => f?._capaId).filter(Boolean))
    for (const [k, v] of Object.entries(r.porCapa || {})) porCapa[k] = vistos.has(k) ? 0 : v
    for (const f of features) if (f._capaId) porCapa[f._capaId] = (porCapa[f._capaId] || 0) + 1
    const { fc, total, porCapa: _p, ...resto } = r
    salida.resultados[id] = { ...copiar(resto), fc: { ...fc, features }, total: features.length, porCapa }
  }
  return salida
}

// El contorno del lazo en una Área de Interés (GeoJSON) para el ejercicio que recibe la selección:
// de ahí puede volver a ⚡ Generar calcos del mismo pedazo de terreno.
export function aoiDelLazo(lazo) {
  const c = (Array.isArray(lazo) ? lazo : []).filter(esPar).map(p => [+p[0], +p[1]])
  if (c.length < 3) return null
  return { type: 'Feature', properties: { origen: 'tijera' }, geometry: { type: 'Polygon', coordinates: [cerrar(c)] } }
}

// Simplifica el trazo del lazo (Douglas-Peucker en metros): mismo dibujo, muchos menos puntos.
export function simplificarLazo(lazo, tolM = null) {
  const c = (Array.isArray(lazo) ? lazo : []).filter(esPar).map(p => [+p[0], +p[1]])
  if (c.length < 4) return c
  const P = plano(c), xy = c.map(P.a)
  const tol = tolM ?? limitar(diagonal(caja(xy)) * 0.002, 5, 400)
  const marca = new Uint8Array(xy.length); marca[0] = marca[xy.length - 1] = 1
  const pila = [[0, xy.length - 1]]
  while (pila.length) {
    const [i, j] = pila.pop()
    let k = -1, dmax = tol
    for (let m = i + 1; m < j; m++) { const d = distSeg(xy[m], xy[i], xy[j]); if (d > dmax) { dmax = d; k = m } }
    if (k >= 0) { marca[k] = 1; pila.push([i, k], [k, j]) }
  }
  const r = c.filter((_, i) => marca[i]).map(p => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6])
  return r.length >= 3 ? r : c
}

// Los calcos del terreno que trae el archivo: { id: { fc: FeatureCollection, total, porCapa } }.
const GEOS = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection']
export function calcosValidos(r) {
  const objeto = x => !!x && typeof x === 'object' && !Array.isArray(x)
  if (!objeto(r)) return null
  const salida = {}
  let n = 0
  for (const [id, c] of Object.entries(r).slice(0, 30)) {
    if (!/^[\w-]{1,40}$/.test(id) || !objeto(c) || !objeto(c.fc) || !Array.isArray(c.fc.features)) continue
    const features = c.fc.features.filter(f => objeto(f) && objeto(f.geometry) && GEOS.includes(f.geometry.type)).slice(0, 200000 - n)
    if (!features.length) continue
    n += features.length
    salida[id] = { ...copiar(c), fc: { type: 'FeatureCollection', features: copiar(features) }, total: features.length }
  }
  return Object.keys(salida).length ? salida : null
}
