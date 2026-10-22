// Cuentas planas para la plantilla del concepto (equirectangular local, en km): sobran para un Área
// de Operaciones de Cuerpo de Ejército (100-150 km). Todo lo que entra y sale es [lng, lat].

const KM_LAT = 110.574
const RAD = Math.PI / 180
export const kmLng = (lat) => 111.32 * Math.cos(lat * RAD) || 1e-9
export const valido = (c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(+c[0]) && Number.isFinite(+c[1])
export const r6 = (x) => Math.round(x * 1e6) / 1e6
export const redondo = (p) => [r6(+p[0]), r6(+p[1])]

export function proyeccion(lng0, lat0) {
  const kx = kmLng(lat0)
  return {
    a: ([lng, lat]) => [(lng - lng0) * kx, (lat - lat0) * KM_LAT],
    de: ([x, y]) => redondo([lng0 + x / kx, lat0 + y / KM_LAT]),
  }
}
export const km = (a, b) => {
  const kx = kmLng((a[1] + b[1]) / 2)
  return Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * KM_LAT)
}
// Rumbo (grados desde el norte, horario) de a hacia b.
export function rumbo(a, b) {
  const kx = kmLng((a[1] + b[1]) / 2)
  const x = (b[0] - a[0]) * kx, y = (b[1] - a[1]) * KM_LAT
  return ((Math.atan2(x, y) / RAD) % 360 + 360) % 360
}
export const rumboDe = ([x, y]) => ((Math.atan2(x, y) / RAD) % 360 + 360) % 360
export const vectorDe = (grados) => [Math.sin(grados * RAD), Math.cos(grados * RAD)]
export const unitario = ([x, y]) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n] }
export const centroide = (pts) => {
  const c = (pts || []).filter(valido)
  if (!c.length) return null
  return [c.reduce((s, p) => s + +p[0], 0) / c.length, c.reduce((s, p) => s + +p[1], 0) / c.length]
}
export function anilloDe(coords) {
  let c = Array.isArray(coords) && Array.isArray(coords[0]?.[0]) ? coords[0] : coords
  c = (c || []).filter(valido).map((p) => [+p[0], +p[1]])
  if (c.length > 1 && c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1]) c = c.slice(0, -1)
  return c
}
export function dentro([x, y], poli) {
  let d = false
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i], [xj, yj] = poli[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi) d = !d
  }
  return d
}
// Largo de una polilínea en km.
export const largo = (coords) => {
  let s = 0
  for (let i = 1; i < (coords || []).length; i++) s += km(coords[i - 1], coords[i])
  return s
}
// Punto a una fracción del largo de una polilínea.
export function puntoEn(coords, frac = 0.5) {
  const c = (coords || []).filter(valido)
  if (c.length < 2) return c[0] ? c[0].slice(0, 2) : null
  const total = largo(c)
  let falta = total * Math.min(1, Math.max(0, frac))
  for (let i = 1; i < c.length; i++) {
    const d = km(c[i - 1], c[i])
    if (falta <= d || i === c.length - 1) {
      const t = d ? Math.min(1, falta / d) : 0
      return [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * t, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * t]
    }
    falta -= d
  }
  return c[c.length - 1].slice(0, 2)
}
// Cruce de dos segmentos en el plano (o null).
export function cruce(p1, p2, q1, q2) {
  const r = [p2[0] - p1[0], p2[1] - p1[1]], s = [q2[0] - q1[0], q2[1] - q1[1]]
  const den = r[0] * s[1] - r[1] * s[0]
  if (Math.abs(den) < 1e-12) return null
  const t = ((q1[0] - p1[0]) * s[1] - (q1[1] - p1[1]) * s[0]) / den
  const u = ((q1[0] - p1[0]) * r[1] - (q1[1] - p1[1]) * r[0]) / den
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { p: [p1[0] + t * r[0], p1[1] + t * r[1]], t, u }
}
// ¿Se cruzan dos polilíneas (en [lng, lat])? Devuelve el primer cruce o null.
export function crucePolilineas(a, b) {
  if (!a?.length || !b?.length) return null
  const P = proyeccion(a[0][0], a[0][1])
  const A = a.map(P.a), B = b.map(P.a)
  for (let i = 1; i < A.length; i++)
    for (let j = 1; j < B.length; j++) {
      const c = cruce(A[i - 1], A[i], B[j - 1], B[j])
      if (c) return P.de(c.p)
    }
  return null
}
// Rectángulo (anillo) de `largoKm` × `anchoKm` centrado en c con el lado largo a `az` grados.
export function rectangulo(c, largoKm, anchoKm, az) {
  const P = proyeccion(c[0], c[1])
  const [ux, uy] = vectorDe(az), [vx, vy] = [uy, -ux]
  const l = largoKm / 2, w = anchoKm / 2
  return [[l, w], [l, -w], [-l, -w], [-l, w]].map(([a, b]) => P.de([ux * a + vx * b, uy * a + vy * b]))
}
// Segmento de `largoKm` centrado en c con rumbo `az`.
export function segmento(c, largoKm, az) {
  const P = proyeccion(c[0], c[1])
  const [ux, uy] = vectorDe(az), l = largoKm / 2
  return [P.de([-ux * l, -uy * l]), P.de([ux * l, uy * l])]
}
// Corre c `dKm` en el rumbo `az`.
export function desplazar(c, dKm, az) {
  const P = proyeccion(c[0], c[1])
  const [ux, uy] = vectorDe(az)
  return P.de([ux * dKm, uy * dKm])
}
// Mueve, escala y gira un punto alrededor de un pivote (todo en el plano local del pivote).
export function transformarPunto(p, { piv, dx = 0, dy = 0, escala = 1, giro = 0 }) {
  const P = proyeccion(piv[0], piv[1])
  const [x, y] = P.a(p)
  const t = -giro * RAD, cs = Math.cos(t), sn = Math.sin(t)
  const xs = x * escala, ys = y * escala
  return P.de([xs * cs - ys * sn + dx, xs * sn + ys * cs + dy])
}
// El punto de una polilínea más cercano a p, con su fracción del largo.
export function masCercano(coords, p) {
  const c = (coords || []).filter(valido)
  if (!c.length || !valido(p)) return null
  const P = proyeccion(p[0], p[1])
  const xy = c.map(P.a)
  let mejor = null, acum = 0
  const total = largo(c) || 1
  for (let i = 1; i < xy.length; i++) {
    const [ax, ay] = xy[i - 1], [bx, by] = xy[i]
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-12
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2))
    const q = [ax + t * dx, ay + t * dy], d = Math.hypot(q[0], q[1]), seg = Math.sqrt(L2)
    if (!mejor || d < mejor.d) mejor = { d, p: P.de(q), frac: (acum + t * seg) / total, az: rumboDe([dx, dy]) }
    acum += seg
  }
  return mejor
}
