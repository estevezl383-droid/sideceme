// Geometría sobre la carta para medir el calco del G-4. Coordenadas como las guarda la
// Mesa: [lng, lat] en grados (WGS-84). Las áreas y distancias se calculan en un plano
// local (equirrectangular centrado en la zona): para áreas de unos km² y distancias de
// decenas de km el error es despreciable frente a lo que pide la doctrina (km enteros).
// Sin DOM.
const KM_LAT = 110.574
const KM_LNG = 111.32
const R = 6371.0088

export const esPunto = (p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1])
export const limpiar = (xs) => (Array.isArray(xs) ? xs.filter(esPunto).map((p) => [+p[0], +p[1]]) : [])

// Gran círculo (km).
export function distKm(a, b) {
  if (!esPunto(a) || !esPunto(b)) return NaN
  const r = Math.PI / 180
  const dLat = (b[1] - a[1]) * r
  const dLng = (b[0] - a[0]) * r
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

// Plano local en km alrededor de `ref`.
export function plano(ref) {
  const c = Math.cos(((ref?.[1] || 0) * Math.PI) / 180)
  return {
    a: (p) => [(p[0] - ref[0]) * KM_LNG * c, (p[1] - ref[1]) * KM_LAT],
    de: (q) => [ref[0] + q[0] / (KM_LNG * c), ref[1] + q[1] / KM_LAT],
  }
}

export function centroide(coords) {
  const xs = limpiar(coords)
  if (!xs.length) return null
  const ref = xs[0]
  const P = plano(ref)
  const q = xs.map(P.a)
  if (q.length >= 3) {
    let A = 0
    let cx = 0
    let cy = 0
    for (let i = 0; i < q.length; i++) {
      const [x1, y1] = q[i]
      const [x2, y2] = q[(i + 1) % q.length]
      const f = x1 * y2 - x2 * y1
      A += f
      cx += (x1 + x2) * f
      cy += (y1 + y2) * f
    }
    if (Math.abs(A) > 1e-9) return P.de([cx / (3 * A), cy / (3 * A)])
  }
  const m = q.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0])
  return P.de([m[0] / q.length, m[1] / q.length])
}

// Área de un polígono (km²). Acepta el anillo cerrado o abierto.
export function areaKm2(coords) {
  const xs = abierto(limpiar(coords))
  if (xs.length < 3) return 0
  const P = plano(xs[0])
  const q = xs.map(P.a)
  let A = 0
  for (let i = 0; i < q.length; i++) {
    const [x1, y1] = q[i]
    const [x2, y2] = q[(i + 1) % q.length]
    A += x1 * y2 - x2 * y1
  }
  return Math.abs(A) / 2
}
const abierto = (xs) => (xs.length > 1 && xs[0][0] === xs[xs.length - 1][0] && xs[0][1] === xs[xs.length - 1][1] ? xs.slice(0, -1) : xs)

export function largoKm(linea) {
  const xs = limpiar(linea)
  let s = 0
  for (let i = 1; i < xs.length; i++) s += distKm(xs[i - 1], xs[i])
  return s
}
export function perimetroKm(coords) {
  const xs = abierto(limpiar(coords))
  return xs.length < 2 ? 0 : largoKm([...xs, xs[0]])
}

// Distancia (km) de un punto a un segmento, en el plano local del punto.
function distPS(p, a, b) {
  const P = plano(p)
  const [ax, ay] = P.a(a)
  const [bx, by] = P.a(b)
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy
  let t = l2 ? -(ax * dx + ay * dy) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(ax + t * dx, ay + t * dy)
}
export function distPuntoLinea(p, linea) {
  const xs = limpiar(linea)
  if (!esPunto(p) || !xs.length) return NaN
  if (xs.length === 1) return distKm(p, xs[0])
  let m = Infinity
  for (let i = 1; i < xs.length; i++) m = Math.min(m, distPS(p, xs[i - 1], xs[i]))
  return m
}

export function puntoEnPoligono(p, coords) {
  const xs = abierto(limpiar(coords))
  if (!esPunto(p) || xs.length < 3) return false
  let dentro = false
  for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) {
    const [xi, yi] = xs[i]
    const [xj, yj] = xs[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) dentro = !dentro
  }
  return dentro
}
const anillo = (coords) => {
  const xs = abierto(limpiar(coords))
  return xs.length ? [...xs, xs[0]] : []
}
// 0 si el punto está adentro.
export function distPuntoPoligono(p, coords) {
  if (puntoEnPoligono(p, coords)) return 0
  return distPuntoLinea(p, anillo(coords))
}

function cruzan(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]))
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b)
}
// La menor distancia entre un polígono y una línea (0 si se tocan o la línea entra).
export function distPoligonoLinea(coords, linea) {
  const P = abierto(limpiar(coords))
  const L = limpiar(linea)
  if (P.length < 3 || !L.length) return NaN
  if (L.some((p) => puntoEnPoligono(p, P))) return 0
  const ring = [...P, P[0]]
  for (let i = 1; i < ring.length; i++) for (let j = 1; j < L.length; j++) if (cruzan(ring[i - 1], ring[i], L[j - 1], L[j])) return 0
  let m = Infinity
  for (const p of P) m = Math.min(m, distPuntoLinea(p, L))
  for (const p of L) m = Math.min(m, distPuntoLinea(p, ring))
  return m
}
// Entre dos polígonos.
export function distPoligonos(a, b) {
  const A = abierto(limpiar(a))
  const B = abierto(limpiar(b))
  if (A.length < 3 || B.length < 3) return NaN
  if (A.some((p) => puntoEnPoligono(p, B)) || B.some((p) => puntoEnPoligono(p, A))) return 0
  return distPoligonoLinea(A, [...B, B[0]])
}

// El punto de `linea` más cercano a `p` (para dibujar la medida sobre la carta).
export function masCercano(p, linea) {
  const xs = limpiar(linea)
  if (!esPunto(p) || !xs.length) return null
  if (xs.length === 1) return xs[0]
  const P = plano(p)
  let mejor = null
  let m = Infinity
  for (let i = 1; i < xs.length; i++) {
    const [ax, ay] = P.a(xs[i - 1])
    const [bx, by] = P.a(xs[i])
    const dx = bx - ax
    const dy = by - ay
    const l2 = dx * dx + dy * dy
    const t = Math.max(0, Math.min(1, l2 ? -(ax * dx + ay * dy) / l2 : 0))
    const q = [ax + t * dx, ay + t * dy]
    const d = Math.hypot(q[0], q[1])
    if (d < m) {
      m = d
      mejor = P.de(q)
    }
  }
  return mejor
}
// El par de puntos (uno del polígono, otro de la línea) de la menor distancia.
export function parMasCercano(coords, linea) {
  const P = abierto(limpiar(coords))
  const L = limpiar(linea)
  if (!P.length || !L.length) return null
  let best = null
  for (const p of P) {
    const q = masCercano(p, L)
    const d = distKm(p, q)
    if (!best || d < best.d) best = { a: p, b: q, d }
  }
  const ring = [...P, P[0]]
  for (const q of L) {
    const p = masCercano(q, ring)
    const d = distKm(p, q)
    if (!best || d < best.d) best = { a: p, b: q, d }
  }
  return best
}

// Círculo aproximado (para dibujar la DMA alrededor del área).
export function circulo(centro, km, n = 72) {
  if (!esPunto(centro) || !(km > 0)) return []
  const P = plano(centro)
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (2 * Math.PI * i) / n
    return P.de([Math.cos(a) * km, Math.sin(a) * km])
  })
}

// Una línea paralela al frente, a `km` hacia nuestra retaguardia (el lado de `ladoPropio`).
export function paralela(linea, km, ladoPropio) {
  const xs = limpiar(linea)
  if (xs.length < 2 || !esPunto(ladoPropio)) return []
  const ref = xs[0]
  const P = plano(ref)
  const q = xs.map(P.a)
  const s = P.a(ladoPropio)
  // normal de cada tramo, hacia el lado propio
  const sal = []
  for (let i = 0; i < q.length; i++) {
    const a = q[Math.max(0, i - 1)]
    const b = q[Math.min(q.length - 1, i + 1)]
    let nx = -(b[1] - a[1])
    let ny = b[0] - a[0]
    const l = Math.hypot(nx, ny) || 1
    nx /= l
    ny /= l
    if ((s[0] - q[i][0]) * nx + (s[1] - q[i][1]) * ny < 0) {
      nx = -nx
      ny = -ny
    }
    sal.push(P.de([q[i][0] + nx * km, q[i][1] + ny * km]))
  }
  return sal
}

export const fmtKm = (x, dec = 1) => (Number.isFinite(x) ? `${(Math.round(x * 10 ** dec) / 10 ** dec).toLocaleString('es')} km` : '—')
export const fmtKm2 = (x) => (Number.isFinite(x) ? `${(Math.round(x * 10) / 10).toLocaleString('es')} km²` : '—')
