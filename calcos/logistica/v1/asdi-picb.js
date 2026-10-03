// La Mesa PROPONE dónde va el ASDI (o el ARCE) con lo que ya está en el calco:
//
//   · la PICB del G-2 — el CMOC: terreno severo (no-go), terreno restringido (slow-go),
//     avenidas de aproximación y corredores de movilidad, terreno clave —;
//   · el Área de Operaciones y su frente (la LC o la LPR);
//   · las unidades que se apoyan (y el esfuerzo principal, si hay una agrupación OD);
//   · los ejes logísticos (EPA / EPE), el ARCE y las instalaciones del escalón superior;
//   · las fichas enemigas.
//
// Método (el de la Escuela, hecho por la máquina): se recorre el Área de Operaciones con
// una grilla; en cada punto se apoya un rectángulo del tamaño de la norma (orientado al
// frente); se DESCARTA lo que no cumple lo impositivo (distancia de seguridad, distancia
// máxima de apoyo) y lo que el CMOC prohíbe (terreno severo, encima de una avenida de
// aproximación enemiga); a lo que queda se le pone un puntaje por cada aspecto de los
// cuatro factores (maniobra, terreno, seguridad, situación logística) y se eligen las tres
// mejores áreas separadas entre sí (A, B, C). Los pesos son CRITERIO DE LA MESA y se pueden
// cambiar; la decisión es del oficial (paso 4 de la evaluación).
// Sin DOM: se prueba en Node.
import { tamanoDe, seguridadDe, calcularDMA, operacionDeAO, FUENTES } from './doctrina.js'
import { limpiar, plano, centroide, areaKm2 } from './geo.js'
import { frenteDe, parametrosDe, nombreUnidad } from './analisis.js'
import { unidadesQueReciben, posicion } from './planeamiento.js'

export const DIMENSIONES = { asdi: { ancho: 3, fondo: 2.5 }, arce: { ancho: 3.5, fondo: 3 } }
export const ANCHO_AVENIDA = { fino: 1, medio: 2, ancho: 3 }

// Los criterios con su factor de la Escuela, el sentido (menor o mayor es mejor) y el peso.
export const CRITERIOS = [
  { id: 'cerrado', factor: 'maniobra', aspecto: 'm_cerrado', nom: 'Apoyo cerrado al 1er escalón', menor: true, peso: 3, unidad: 'km' },
  { id: 'esfuerzo', factor: 'maniobra', aspecto: 'm_accion', nom: 'Detrás del esfuerzo principal', menor: true, peso: 2, unidad: 'km' },
  { id: 'continuidad', factor: 'maniobra', aspecto: 'm_continuidad', nom: 'Continuidad (el más lejano)', menor: true, peso: 1, unidad: 'km' },
  { id: 'viaria', factor: 'terreno', aspecto: 't_red', nom: 'Red viaria (EPA / corredores)', menor: true, peso: 2.5, unidad: 'km' },
  { id: 'terreno', factor: 'terreno', aspecto: 't_obstaculos', nom: 'Sin terreno restringido (CMOC)', menor: true, peso: 2, unidad: '%' },
  { id: 'responsabilidad', factor: 'terreno', aspecto: 't_responsabilidad', nom: 'Menos responsabilidad territorial', menor: true, peso: 2, unidad: 'km' },
  { id: 'avenidas', factor: 'seguridad', aspecto: 's_puntos', nom: 'Lejos de avenidas enemigas', menor: false, peso: 2, unidad: 'km', tope: 15 },
  { id: 'flancos', factor: 'seguridad', aspecto: 's_flancos', nom: 'Lejos de los flancos', menor: false, peso: 1.5, unidad: 'km', tope: 15 },
  { id: 'enemigo', factor: 'seguridad', aspecto: 's_distSeg', nom: 'Lejos del enemigo (artillería)', menor: false, peso: 1, unidad: 'km', tope: 40 },
  { id: 'amiga', factor: 'seguridad', aspecto: 's_amiga', nom: 'Cerca de tropa amiga', menor: true, peso: 1, unidad: 'km' },
  { id: 'superior', factor: 'situacion', aspecto: 'l_superior', nom: 'Cerca del escalón superior (ARCE)', menor: true, peso: 1, unidad: 'km' },
]
// Pesos según la operación (doctrina.js, «Influencia del tipo de operación»): en el ataque
// el Bat. Log. va «lo más adelante posible» (apoyo cerrado); en la defensa hay «mayor
// necesidad de seguridad contra fuegos e infiltrados» y no se debe interferir con la
// maniobra ante una penetración; en la retrógrada, mínimo despliegue y más atrás.
export const PESOS_OPERACION = {
  ataque: {},
  defensa: { cerrado: 2, responsabilidad: 1, avenidas: 2.5, flancos: 2, enemigo: 2 },
  retrograda: { cerrado: 1.5, responsabilidad: 0.5, avenidas: 2.5, flancos: 2, enemigo: 2.5, viaria: 3 },
}
export const COLOR_FACTOR = { maniobra: '#ff4d4d', terreno: '#2fd36b', seguridad: '#ff9fd3', situacion: '#ffc000' }
export const NOMBRE_FACTOR = { maniobra: 'MANIOBRA', terreno: 'TERRENO', seguridad: 'SEGURIDAD', situacion: 'SIT. LOGÍSTICA' }
export const MOTIVOS = [
  { id: 'fueraAO', nom: 'No entra en el Área de Operaciones' },
  { id: 'seguridad', nom: 'Menos de la distancia de seguridad' },
  { id: 'severo', nom: 'Terreno severo del CMOC (no-go)' },
  { id: 'avenida', nom: 'Sobre una avenida de aproximación enemiga' },
  { id: 'dma', nom: 'Fuera de la distancia máxima de apoyo' },
]
export const FUENTE_PICB = `Impositivos y tamaño: ${FUENTES.dia}, «Datos generales de planeamiento logístico» y «Factores de empleo». Terreno: el CMOC del G-2 (PICB). Pesos de cada aspecto: criterio de la Mesa (editables).`

// ─── Geometría en el plano local (km) ───────────────────────────────────────────────
// Polígono con su recuadro (para descartar rápido los puntos lejanos).
function conCaja(poly) {
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  poly.caja = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  return poly
}
function pip(p, poly) {
  const c = poly.caja
  if (c && (p[0] < c[0] || p[0] > c[2] || p[1] < c[1] || p[1] > c[3])) return false
  let d = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) d = !d
  }
  return d
}
function dPS(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0
  return Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1])
}
function dPL(p, linea) {
  if (!linea.length) return Infinity
  if (linea.length === 1) return Math.hypot(p[0] - linea[0][0], p[1] - linea[0][1])
  let m = Infinity
  for (let i = 1; i < linea.length; i++) m = Math.min(m, dPS(p, linea[i - 1], linea[i]))
  return m
}
const cerrar = (poly) => (poly.length ? [...poly, poly[0]] : [])
// Menor distancia entre un polígono convexo chico (el rectángulo) y una línea.
function dPolyLinea(poly, linea) {
  if (linea.some((q) => pip(q, poly))) return 0
  let m = Infinity
  for (const p of poly) m = Math.min(m, dPL(p, linea))
  const ring = cerrar(poly)
  for (const q of linea) m = Math.min(m, dPL(q, ring))
  return m
}
function dPPoly(p, poly) {
  return pip(p, poly) ? 0 : dPL(p, cerrar(poly))
}

// Los anillos exteriores de lo que guarde el CMOC (Feature, geometría, {coords} o anillo).
export function anillosDe(x) {
  if (!x) return []
  const g = x.geometry || (x.type && x.coordinates ? x : null)
  if (g?.type === 'Polygon') return [limpiar(g.coordinates?.[0])]
  if (g?.type === 'MultiPolygon') return (g.coordinates || []).map((p) => limpiar(p?.[0]))
  if (Array.isArray(x.coords)) return [limpiar(x.coords)]
  if (Array.isArray(x) && Array.isArray(x[0])) return [limpiar(x)]
  return []
}
const lineaDe = (x) => limpiar(x?.coords || (x?.geometry?.type === 'LineString' ? x.geometry.coordinates : []))
const esEnemigo = (x) => !/^prop/i.test(String(x?.bando || 'enemigo'))

// ─── La propuesta ─────────────────────────────────────────────────────────────────────
export function proponerASDI(calco = {}, { nivel = 'asdi', parametros = {}, pesos = {}, operacion = '', maxGrilla = 1400 } = {}) {
  const ops = calco.ops || {}
  const cmoc = calco.cmoc || {}
  const unidades = calco.unidades || []
  const ao = limpiar(ops.areaOps?.coords)
  if (ao.length < 3) return { ok: false, error: 'Falta el Área de Operaciones: trazala (▧ Área de Ops — el primer lado ES el frente) y la Mesa propone el área.' }
  const fr = frenteDe(ops, unidades)
  if (!fr || fr.puntos) return { ok: false, error: 'Falta el frente (la LC / LPR): es el primer lado del Área de Operaciones.' }
  const op = operacion || operacionDeAO(ops.areaOps) || 'defensa'
  const pesosOp = PESOS_OPERACION[op] || {}
  const T = tamanoDe(nivel === 'arce' ? 'ce' : 'div')
  const S = seguridadDe(nivel === 'arce' ? 'ce' : 'div')
  const P = parametrosDe(parametros)
  const dma = calcularDMA(P)
  const dim = DIMENSIONES[nivel] || DIMENSIONES.asdi

  const ref = centroide(ao)
  const PL = plano(ref)
  const A = conCaja(ao.map(PL.a))
  const FR = limpiar(fr.linea).map(PL.a)
  // Dirección del frente y la normal hacia nuestro lado.
  const u0 = [FR[FR.length - 1][0] - FR[0][0], FR[FR.length - 1][1] - FR[0][1]]
  const lu = Math.hypot(u0[0], u0[1]) || 1
  const U = [u0[0] / lu, u0[1] / lu]
  let N = [-U[1], U[0]]
  const medio = [(FR[0][0] + FR[FR.length - 1][0]) / 2, (FR[0][1] + FR[FR.length - 1][1]) / 2]
  if (N[0] * (0 - medio[0]) + N[1] * (0 - medio[1]) < 0) N = [-N[0], -N[1]]
  // Los flancos: los lados del AO que tocan el frente (sin el frente).
  const ring = cerrar(A)
  const lados = []
  for (let i = 2; i < ring.length; i++) lados.push([ring[i - 1], ring[i]])
  const flancos = lados.length >= 2 ? [lados[0], lados[lados.length - 1]] : lados

  // Lo del CMOC y del calco, en el plano.
  const severo = (cmoc.severo || []).flatMap(anillosDe).filter((r) => r.length >= 3).map((r) => conCaja(r.map(PL.a)))
  const restringido = (cmoc.restringido || []).flatMap(anillosDe).filter((r) => r.length >= 3).map((r) => conCaja(r.map(PL.a)))
  const avenidas = (cmoc.avenidas || []).filter(esEnemigo).map((a) => ({ l: lineaDe(a).map(PL.a), media: ANCHO_AVENIDA[a.ancho] || ANCHO_AVENIDA.medio })).filter((a) => a.l.length >= 2)
  const corrPropios = (cmoc.corredores || []).filter((c) => !esEnemigo(c)).map((c) => lineaDe(c).map(PL.a)).filter((l) => l.length >= 2)
  const ejes = (ops.ejesLog || []).filter((e) => ['epa', 'esa'].includes(e.tipo)).map((e) => limpiar(e.coords).map(PL.a)).filter((l) => l.length >= 2)
  const viarias = [...ejes, ...corrPropios]
  const amigas = unidadesQueReciben(unidades)
  const pos = (u) => PL.a(posicion(u))
  const ptsAmigas = amigas.map((u) => ({ u, p: pos(u), kf: dPL(pos(u), FR) })).sort((a, b) => a.kf - b.kf)
  const primer = ptsAmigas.slice(0, Math.max(1, Math.ceil(ptsAmigas.length / 2)))
  const od = ptsAmigas.filter(({ u }) => u.operacionAg === 'od')
  const enemigos = unidades.filter((u) => /^enem/i.test(String(u?.bando || '')) && (!u.tipo || u.tipo === 'unidad') && posicion(u)).map(pos)
  const superiores = [
    ...(ops.zonasLog || []).filter((z) => z.zona === 'arce' && nivel !== 'arce' && limpiar(z.coords).length >= 3).map((z) => ({ poly: limpiar(z.coords).map(PL.a) })),
    ...unidades.filter((u) => u.tipo === 'instalacion' && ['baselog', 'deposito', 'p_abast'].includes(u.instalacion) && posicion(u)).map((u) => ({ p: pos(u) })),
  ]

  // En la defensa la distancia de seguridad se mide desde las ÚLTIMAS POSICIONES DE BLOQUEO
  // del escalón (lámina «Datos generales…», observación): si hay posiciones defensivas en
  // el calco, la más profunda corre el mínimo hacia atrás.
  const bloqueos = op === 'defensa' ? (ops.posDef || []).map((p) => limpiar([p?.centro])[0]).filter(Boolean).map((p) => dPL(PL.a(p), FR)) : []
  const fondoBloqueo = bloqueos.length ? Math.max(...bloqueos) : 0
  const minSeg = S.min + fondoBloqueo

  // La grilla.
  const xs = A.map((p) => p[0])
  const ys = A.map((p) => p[1])
  const sup = Math.max(1, areaKm2(ao))
  const paso = Math.max(0.6, Math.sqrt(sup / maxGrilla))
  const embudo = { evaluados: 0, fueraAO: 0, seguridad: 0, severo: 0, avenida: 0, dma: 0, validos: 0 }
  const validos = []
  const rect = (c) => [
    [c[0] - U[0] * dim.ancho / 2 - N[0] * dim.fondo / 2, c[1] - U[1] * dim.ancho / 2 - N[1] * dim.fondo / 2],
    [c[0] + U[0] * dim.ancho / 2 - N[0] * dim.fondo / 2, c[1] + U[1] * dim.ancho / 2 - N[1] * dim.fondo / 2],
    [c[0] + U[0] * dim.ancho / 2 + N[0] * dim.fondo / 2, c[1] + U[1] * dim.ancho / 2 + N[1] * dim.fondo / 2],
    [c[0] - U[0] * dim.ancho / 2 + N[0] * dim.fondo / 2, c[1] - U[1] * dim.ancho / 2 + N[1] * dim.fondo / 2],
  ]
  for (let x = Math.min(...xs) + paso / 2; x < Math.max(...xs); x += paso) {
    for (let y = Math.min(...ys) + paso / 2; y < Math.max(...ys); y += paso) {
      const c = [x, y]
      if (!pip(c, A)) continue
      embudo.evaluados++
      const R = rect(c)
      if (!R.every((p) => pip(p, A))) {
        embudo.fueraAO++
        continue
      }
      const dSeg = dPolyLinea(R, FR)
      if (dSeg < minSeg) {
        embudo.seguridad++
        continue
      }
      const muestras = [c, ...R, ...R.map((p, i) => [(p[0] + R[(i + 1) % 4][0]) / 2, (p[1] + R[(i + 1) % 4][1]) / 2])]
      if (severo.some((poly) => muestras.some((m) => pip(m, poly)))) {
        embudo.severo++
        continue
      }
      const dAv = avenidas.length ? Math.min(...avenidas.map((a) => dPL(c, a.l) - a.media)) : Infinity
      if (dAv < dim.fondo / 2) {
        embudo.avenida++
        continue
      }
      const dists = ptsAmigas.map((x) => dPPoly(x.p, R))
      const lejos = dists.length ? Math.max(...dists) : 0
      if (dma.ok && dists.length && lejos * P.factor > dma.km) {
        embudo.dma++
        continue
      }
      embudo.validos++
      const media = (xs2) => (xs2.length ? xs2.reduce((s, v) => s + v, 0) / xs2.length : NaN)
      const v = {
        cerrado: primer.length ? media(primer.map((x) => dPPoly(x.p, R))) : NaN,
        esfuerzo: od.length ? media(od.map((x) => dPPoly(x.p, R))) : NaN,
        continuidad: dists.length ? lejos : NaN,
        viaria: viarias.length ? Math.min(...viarias.map((l) => dPolyLinea(R, l))) : NaN,
        terreno: restringido.length ? (100 * muestras.filter((m) => restringido.some((poly) => pip(m, poly))).length) / muestras.length : NaN,
        responsabilidad: dSeg,
        avenidas: avenidas.length ? Math.max(0, dAv) : NaN,
        flancos: flancos.length ? Math.min(...flancos.map((l) => dPolyLinea(R, l))) : NaN,
        enemigo: enemigos.length ? Math.min(...enemigos.map((p) => dPPoly(p, R))) : NaN,
        amiga: dists.length ? Math.min(...dists) : NaN,
        superior: superiores.length ? Math.min(...superiores.map((s) => (s.poly ? dPolyLinea(R, cerrar(s.poly)) : dPPoly(s.p, R)))) : NaN,
      }
      validos.push({ c, R, v, dSeg, dist: dists })
    }
  }

  // Puntajes 0-1 por criterio (comparando los lugares válidos entre sí).
  const usados = CRITERIOS.filter((k) => validos.some((x) => Number.isFinite(x.v[k.id]))).map((k) => ({ ...k, pesoOp: pesosOp[k.id] ?? k.peso, peso: Number.isFinite(+pesos[k.id]) && +pesos[k.id] >= 0 && pesos[k.id] !== '' ? +pesos[k.id] : pesosOp[k.id] ?? k.peso }))
  const rango = {}
  for (const k of usados) {
    const vals = validos.map((x) => x.v[k.id]).filter(Number.isFinite).map((v) => (k.tope ? Math.min(v, k.tope) : v))
    rango[k.id] = [Math.min(...vals), Math.max(...vals)]
  }
  const puntaje = (k, v) => {
    if (!Number.isFinite(v)) return null
    const [a, b] = rango[k.id]
    const w = k.tope ? Math.min(v, k.tope) : v
    if (b - a < 1e-9) return 1
    const s = (w - a) / (b - a)
    return k.menor ? 1 - s : s
  }
  for (const x of validos) {
    let s = 0
    let w = 0
    x.s = {}
    for (const k of usados) {
      const p = puntaje(k, x.v[k.id])
      x.s[k.id] = p
      if (p == null || !k.peso) continue
      s += p * k.peso
      w += k.peso
    }
    x.total = w ? s / w : 0
  }
  validos.sort((a, b) => b.total - a.total)

  // Las tres mejores, separadas (no se pisan).
  const sep = Math.max(5, 2 * Math.max(dim.ancho, dim.fondo))
  const elegidos = []
  for (const x of validos) {
    if (elegidos.every((e) => Math.hypot(e.c[0] - x.c[0], e.c[1] - x.c[1]) >= sep)) elegidos.push(x)
    if (elegidos.length >= 3) break
  }
  const aLL = (p) => {
    const q = PL.de(p)
    return [Math.round(q[0] * 1e6) / 1e6, Math.round(q[1] * 1e6) / 1e6]
  }
  const nombres = (lista, k) => lista.slice(0, k).map((x) => nombreUnidad(x.u)).join(', ')
  const candidatos = elegidos.map((x, i) => {
    const criterios = usados.map((k) => ({ id: k.id, nom: k.nom, factor: k.factor, aspecto: k.aspecto, peso: k.peso, valor: x.v[k.id], unidad: k.unidad, puntaje: x.s[k.id] }))
    const porFactor = {}
    for (const f of Object.keys(COLOR_FACTOR)) {
      const cs = criterios.filter((c) => c.factor === f && c.puntaje != null && c.peso)
      porFactor[f] = cs.length ? cs.reduce((s, c) => s + c.puntaje * c.peso, 0) / cs.reduce((s, c) => s + c.peso, 0) : null
    }
    const coords = x.R.map(aLL)
    return {
      letra: 'ABC'[i],
      coords,
      centro: aLL(x.c),
      km2: areaKm2(coords),
      total: x.total,
      criterios,
      porFactor,
      dSeg: x.dSeg,
      motivos: [
        `A ${x.dSeg.toFixed(1)} km de la ${fr.rot} (mínimo ${S.min} km${fondoBloqueo ? ` desde las últimas posiciones de bloqueo, que están a ${fondoBloqueo.toFixed(1)} km` : ''}).`,
        Number.isFinite(x.v.cerrado) ? `A ${x.v.cerrado.toFixed(1)} km en promedio del 1er escalón (${nombres(primer, 3)}).` : '',
        Number.isFinite(x.v.continuidad) ? `El más lejano a ${x.v.continuidad.toFixed(1)} km (≈ ${(x.v.continuidad * P.factor).toFixed(0)} km por carretera; DMA ${dma.km} km).` : '',
        Number.isFinite(x.v.viaria) ? (x.v.viaria < 0.5 ? 'El EPA / un corredor propio pasa por el área.' : `El EPA / corredor propio más cercano a ${x.v.viaria.toFixed(1)} km.`) : '',
        Number.isFinite(x.v.terreno) ? (x.v.terreno ? `${x.v.terreno.toFixed(0)} % en terreno restringido.` : 'Sin terreno restringido.') : '',
        Number.isFinite(x.v.avenidas) ? `Avenida enemiga más cercana a ${x.v.avenidas.toFixed(1)} km.` : '',
      ].filter(Boolean),
    }
  })
  const avisos = []
  if (!severo.length && !restringido.length && !avenidas.length) avisos.push('El CMOC está vacío: la propuesta no ve el terreno. Marcá en el tablero del G-2 el terreno severo, el restringido y las avenidas de aproximación (o generalos) y volvé a calcular.')
  if (!amigas.length) avisos.push('No hay fichas de unidades propias: no se pudo medir el apoyo cerrado ni la DMA.')
  if (!viarias.length) avisos.push('No hay EPA ni corredores de movilidad propios: la red viaria no entró en la cuenta. Trazá el EPA para que la tenga en cuenta.')
  if (!candidatos.length) avisos.push('Ningún lugar del Área de Operaciones cumple a la vez la distancia de seguridad, la DMA y el CMOC. Revisá el AO, el frente o la DMA (TD, TC, V).')
  const grilla = validos.map((x) => ({ c: aLL(x.c), s: x.total }))
  return {
    ok: true,
    nivel,
    norma: { tamano: T.nota, seguridad: S.min, seguridadDesdeFrente: minSeg, fondoBloqueo, dma: dma.km },
    operacion: op,
    dim,
    paso,
    frente: { rot: fr.rot, linea: limpiar(fr.linea) },
    candidatos,
    embudo,
    criterios: usados,
    grilla,
    cmoc: { severo: severo.length, restringido: restringido.length, avenidas: avenidas.length, corredores: corrPropios.length },
    avisos,
  }
}

export function textoPropuesta(pr) {
  if (!pr?.ok) return pr?.error || 'Sin propuesta.'
  const L = []
  L.push(`Propuesta de la Mesa para el ${pr.nivel === 'arce' ? 'ARCE' : 'ASDI'} (rectángulos de ${pr.dim.ancho} × ${pr.dim.fondo} km, grilla cada ${pr.paso.toFixed(1)} km dentro del AO). Operación: ${pr.operacion}. Distancia de seguridad: ${pr.norma.seguridad} km${pr.norma.fondoBloqueo ? ` desde las últimas posiciones de bloqueo (a ${pr.norma.fondoBloqueo.toFixed(1)} km de la ${pr.frente.rot}: ${pr.norma.seguridadDesdeFrente.toFixed(1)} km desde la ${pr.frente.rot})` : ''}. Pesos: ${pr.criterios.map((k) => `${k.nom} ${k.peso}`).join(', ')}.`)
  L.push(`Lugares evaluados: ${pr.embudo.evaluados}; descartados: ${MOTIVOS.map((m) => `${m.nom.toLowerCase()} ${pr.embudo[m.id]}`).join(', ')}; válidos: ${pr.embudo.validos}.`)
  L.push(`CMOC usado: ${pr.cmoc.severo} zona(s) de terreno severo, ${pr.cmoc.restringido} de restringido, ${pr.cmoc.avenidas} avenida(s) enemiga(s), ${pr.cmoc.corredores} corredor(es) propio(s).`)
  for (const c of pr.candidatos) {
    L.push(`- Área ${c.letra}: puntaje ${(c.total * 100).toFixed(0)}/100 · ${Object.entries(c.porFactor).filter(([, v]) => v != null).map(([f, v]) => `${NOMBRE_FACTOR[f]} ${(v * 100).toFixed(0)}`).join(' · ')}. Centro ${c.centro[1].toFixed(5)}, ${c.centro[0].toFixed(5)}.`)
    for (const m of c.motivos) L.push(`  · ${m}`)
  }
  for (const a of pr.avisos) L.push(`AVISO: ${a}`)
  return L.join('\n')
}
