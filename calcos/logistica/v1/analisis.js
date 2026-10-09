// Lo que la Mesa MIDE en el calco para el G-4: cada área logística trazada (ASDI, ARCE,
// áreas propuestas A, B…) contra los datos generales de planeamiento y los factores de
// la Escuela. Es lo que permite «acostar» el análisis sobre la carta y volver de la
// carta al análisis: todo lo que se mide dice contra qué se midió.
//
// Lo que la doctrina fija (tamaño, distancia de seguridad, DMA) se verifica contra la
// norma. Lo que es relativo («más cerrado», «más cerca de tropa amiga») se compara entre
// las áreas propuestas: es CRITERIO DE LA MESA y se dice así. El resto lo decide el
// oficial (o la IA, como propuesta). Sin DOM.
import {
  nivelDeZona,
  tamanoDe,
  seguridadDe,
  calcularDMA,
  DMA_BASE,
  TONELAJE_BATALLON,
  TONELAJE_DIVISION,
  OBS_SEGURIDAD,
} from './doctrina.js'
import {
  limpiar,
  esPunto,
  areaKm2,
  perimetroKm,
  centroide,
  distKm,
  distPuntoLinea,
  distPuntoPoligono,
  distPoligonoLinea,
  distPoligonos,
  puntoEnPoligono,
  parMasCercano,
  largoKm,
  fmtKm,
  fmtKm2,
} from './geo.js'

export const LETRAS = 'ABCDEFGH'
export const FACTOR_CARRETERA = 1.3

const esEnemiga = (u) => /^enem/i.test(String(u?.bando || ''))
const esUnidad = (u) => !u?.tipo || u.tipo === 'unidad'
const ARMAS_SERVICIO = /log|intend|sanid|servic|policia|comunic/i
const posicion = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
export const nombreUnidad = (u) => String(u?.designacion || u?.nombre || u?.nom || u?.etiqueta || u?.id || 'unidad').trim()

const ABREV_ZONA = { asdi: 'ASDI', arce: 'ARCE', atcomb: 'ATComb', atcamp: 'ATCamp', at: 'AT', atsu: 'ATSU' }
const TRENES = ['at', 'atcamp', 'atcomb', 'atsu']
const AREAS_GU = ['asdi', 'arce']

// El nombre con el que se habla del área (en la pantalla, la IA y los Word).
export function nombreArea(z, i = 0) {
  if (z?.propuesta) return `Área ${z.propuesta}`
  const ab = ABREV_ZONA[z?.zona] || 'Área'
  return `${ab}${Number.isFinite(+z?.division) ? ` ${+z.division}` : i ? ` ${i + 1}` : ''}`
}
export const claveArea = (z, i) => z?.clave || `${z?.zona || 'area'}-${i}`

// ─── El frente: la LC o la LPR (desde dónde se mide la distancia de seguridad) ───────
export function frenteDe(ops = {}, unidades = []) {
  const ao = ops?.areaOps
  const ofensiva = /ofens|ataq/i.test(String(ao?.tipo || ''))
  const rot = ofensiva ? 'LC' : 'LPR'
  const f = limpiar(ao?.frente)
  if (f.length >= 2) return { linea: f, rot, fuente: `el frente del Área de Operaciones (${rot}, el primer lado que se trazó)`, ofensiva }
  const c = limpiar(ao?.coords)
  if (c.length >= 3) return { linea: [c[0], c[1]], rot, fuente: `el primer lado del Área de Operaciones (${rot})`, ofensiva }
  const enem = (unidades || []).filter((u) => esEnemiga(u) && esUnidad(u)).map(posicion).filter(Boolean)
  if (enem.length) return { linea: enem, rot: 'ENEMIGO', fuente: 'las fichas enemigas del calco (no hay Área de Operaciones trazada)', puntos: true, ofensiva }
  return null
}

// Los lados del AO que NO son el frente: los flancos y la retaguardia.
function ladosNoFrente(ops = {}) {
  const c = limpiar(ops?.areaOps?.coords)
  if (c.length < 3) return []
  const ring = [...c, c[0]]
  // el primer lado es el frente: quedan los demás
  const lados = []
  for (let i = 2; i < ring.length; i++) lados.push([ring[i - 1], ring[i]])
  // el último lado (que vuelve al primer vértice) y el segundo son los flancos; los del
  // medio, la retaguardia. Para la exposición del flanco sirven los que tocan el frente.
  return lados.length >= 2 ? [lados[0], lados[lados.length - 1]] : lados
}

// Las unidades que se apoyan: propias, de combate o apoyo de combate (sin las de servicio).
export function unidadesApoyadas(unidades = []) {
  return (unidades || []).filter((u) => !esEnemiga(u) && esUnidad(u) && posicion(u) && !ARMAS_SERVICIO.test(String(u.arma || '')))
}

// Áreas de trenes de los elementos apoyados (si están trazadas).
const trenesDe = (ops) => (ops?.zonasLog || []).filter((z) => TRENES.includes(z.zona) && limpiar(z.coords).length >= 3)

// Instalaciones del escalón superior: ARCE (para el ASDI), Base Log., depósitos,
// puestos de abastecimiento y los avanzados de Clase III y V.
const INST_SUPERIOR = ['baselog', 'deposito', 'p_abast']
const INST_AVANZADAS = ['pd_cl3_avz', 'pd_cl5_avz']

export function parametrosDe(p = {}) {
  return {
    td: Number.isFinite(+p.td) ? +p.td : DMA_BASE.td,
    tc: Number.isFinite(+p.tc) ? +p.tc : DMA_BASE.tc,
    v: Number.isFinite(+p.v) ? +p.v : DMA_BASE.v,
    factor: Number.isFinite(+p.factor) && +p.factor >= 1 ? +p.factor : FACTOR_CARRETERA,
  }
}

// ─── Medir un área ──────────────────────────────────────────────────────────────────
export function medirArea(z, i, calco = {}, parametros = {}) {
  const ops = calco.ops || {}
  const unidades = calco.unidades || []
  const P = parametrosDe(parametros)
  const coords = limpiar(z?.coords)
  const nivel = nivelDeZona(z?.zona)
  const T = tamanoDe(nivel)
  const S = seguridadDe(nivel)
  const km2 = areaKm2(coords)
  const centro = centroide(coords)
  const m = { clave: claveArea(z, i), idx: i, zona: z?.zona || 'asdi', propuesta: z?.propuesta || '', nombre: nombreArea(z, i), nivel, km2, perimetro: perimetroKm(coords), centro, coords }

  m.tamano = { km2, min: T.min, max: T.max, ok: km2 >= T.min && km2 <= T.max, chica: km2 < T.min, grande: km2 > T.max, norma: T.nota }
  m.tamano.txt = coords.length < 3 ? 'sin polígono' : m.tamano.ok ? `${fmtKm2(km2)} — dentro de la norma (${T.nota})` : m.tamano.chica ? `${fmtKm2(km2)} — MENOR que la norma (${T.nota}): las instalaciones no se pueden dispersar` : `${fmtKm2(km2)} — mayor que la norma (${T.nota}): más difícil de defender y de recorrer`

  // Distancia de seguridad
  const fr = frenteDe(ops, unidades)
  if (fr && coords.length >= 3) {
    const km = fr.puntos ? Math.min(...fr.linea.map((p) => distPuntoPoligono(p, coords))) : distPoligonoLinea(coords, fr.linea)
    const par = fr.puntos ? null : parMasCercano(coords, fr.linea)
    m.seguridad = { km, min: S.min, ok: km >= S.min, ref: fr.rot, fuente: fr.fuente, par, norma: S.nota }
    m.seguridad.txt = `${fmtKm(km)} hasta ${fr.puntos ? 'la ficha enemiga más cercana' : `la ${fr.rot}`} — ${km >= S.min ? 'CUMPLE' : 'NO CUMPLE'} el mínimo de ${S.min} km`
    if (!fr.puntos && centro) m.profundidad = distPuntoLinea(centro, fr.linea)
  } else m.seguridad = { km: NaN, min: S.min, ok: null, txt: 'Sin Área de Operaciones ni fichas enemigas: no hay desde dónde medir. Trazá el AO (el primer lado es el frente).' }

  // La ficha enemiga más cercana (alcance de su artillería: lo dice el G-2)
  const enem = unidades.filter((u) => esEnemiga(u) && esUnidad(u) && posicion(u))
  if (enem.length && coords.length >= 3) {
    const d = enem.map((u) => ({ u, km: distPuntoPoligono(posicion(u), coords) })).sort((a, b) => a.km - b.km)[0]
    m.enemigo = { km: d.km, nombre: nombreUnidad(d.u), artilleria: /art|cohete|morter/i.test(String(d.u.arma || '')) }
  }

  // Elementos apoyados: áreas de trenes si están; si no, las fichas de las unidades.
  const trenes = trenesDe(ops)
  const apoy = unidadesApoyadas(unidades)
  const destinos = trenes.length
    ? trenes.map((t, k) => ({ nombre: nombreArea(t, k), p: centroide(t.coords) }))
    : apoy.map((u) => ({ nombre: nombreUnidad(u), p: posicion(u), u }))
  if (destinos.length && coords.length >= 3) {
    const ds = destinos.map((d) => ({ ...d, km: distPuntoPoligono(d.p, coords) }))
    const max = ds.reduce((a, b) => (b.km > a.km ? b : a))
    const media = ds.reduce((s, d) => s + d.km, 0) / ds.length
    // 1er escalón: las unidades más cerca del frente (la mitad delantera)
    let primer = ds
    if (fr && !fr.puntos && !trenes.length && ds.length > 1) {
      const conFrente = ds.map((d) => ({ ...d, kf: distPuntoLinea(d.p, fr.linea) })).sort((a, b) => a.kf - b.kf)
      primer = conFrente.slice(0, Math.ceil(conFrente.length / 2))
    }
    const mediaPrimer = primer.reduce((s, d) => s + d.km, 0) / primer.length
    m.apoyados = { n: ds.length, fuente: trenes.length ? 'las áreas de trenes trazadas' : 'las fichas de las unidades apoyadas (no hay áreas de trenes trazadas)', media, max: max.km, lejano: max.nombre, mediaPrimer, primer: primer.map((d) => d.nombre) }
    const dma = calcularDMA(P)
    const carretera = max.km * P.factor
    m.dma = { km: dma.km, formula: dma.texto, carretera, factor: P.factor, ok: dma.ok ? carretera <= dma.km : null, lejano: max.nombre }
    m.dma.txt = dma.ok ? `${max.nombre} queda a ${fmtKm(max.km)} en línea recta (≈ ${fmtKm(carretera)} por carretera, ×${P.factor.toLocaleString('es')}) — ${carretera <= dma.km ? 'DENTRO' : 'FUERA'} de la DMA de ${fmtKm(dma.km, 0)}` : dma.error
  } else {
    m.apoyados = { n: 0, fuente: 'no hay unidades apoyadas ni áreas de trenes en el calco' }
    m.dma = { ok: null, txt: 'Colocá las fichas de las unidades apoyadas (o trazá sus áreas de trenes) para medir la DMA.' }
  }

  // Tropa amiga más cercana (cualquier unidad propia de combate)
  if (apoy.length && coords.length >= 3) {
    const d = apoy.map((u) => ({ u, km: distPuntoPoligono(posicion(u), coords) })).sort((a, b) => a.km - b.km)[0]
    m.amiga = { km: d.km, nombre: nombreUnidad(d.u) }
  }

  // Flancos del AO
  const lados = ladosNoFrente(ops)
  if (lados.length && coords.length >= 3) m.flancos = { km: Math.min(...lados.map((l) => distPoligonoLinea(coords, l))) }

  // EPA / EPE
  const ejes = ops.ejesLog || []
  const epas = ejes.filter((e) => e.tipo === 'epa' && limpiar(e.coords).length >= 2)
  const epes = ejes.filter((e) => e.tipo === 'epe' && limpiar(e.coords).length >= 2)
  if (epas.length && coords.length >= 3) {
    const d = Math.min(...epas.map((e) => distPoligonoLinea(coords, e.coords)))
    m.epa = { km: d, toca: d <= 1, largo: Math.max(...epas.map((e) => largoKm(e.coords))) }
    if (m.epa.toca && lados.length) m.epaFlancos = { km: Math.min(...epas.flatMap((e) => lados.map((l) => minLineas(e.coords, l)))) }
  }
  if (epes.length && coords.length >= 3) m.epe = { km: Math.min(...epes.map((e) => distPoligonoLinea(coords, e.coords))) }

  // Escalón superior: el ARCE (si el área es un ASDI) y las instalaciones de la base
  const sup = []
  if (nivel === 'div') for (const [k, a] of (ops.zonasLog || []).entries()) if (a.zona === 'arce' && a !== z && limpiar(a.coords).length >= 3) sup.push({ nombre: nombreArea(a, k), km: distPoligonos(coords, a.coords) })
  const inst = (unidades || []).filter((u) => u.tipo === 'instalacion' && posicion(u))
  for (const u of inst.filter((u) => INST_SUPERIOR.includes(u.instalacion))) sup.push({ nombre: nombreUnidad(u), km: distPuntoPoligono(posicion(u), coords) })
  if (sup.length && coords.length >= 3) m.superior = sup.sort((a, b) => a.km - b.km)[0]
  const avz = inst.filter((u) => INST_AVANZADAS.includes(u.instalacion)).map((u) => ({ nombre: nombreUnidad(u), km: distPuntoPoligono(posicion(u), coords) }))
  if (avz.length && coords.length >= 3) m.avanzadas = avz.sort((a, b) => a.km - b.km)[0]

  // ¿El Batallón Logístico ya está desplegado en el área?
  const propios = inst.filter((u) => (u.areaLog && u.areaLog === m.clave) || (coords.length >= 3 && puntoEnPoligono(posicion(u), coords)))
  m.bonlog = { n: propios.length }

  // Áreas de trenes (para «localización de las áreas de trenes»)
  if (trenes.length && coords.length >= 3) m.trenes = { media: trenes.reduce((s, t) => s + distPoligonos(coords, t.coords), 0) / trenes.length, n: trenes.length }
  return m
}
function minLineas(a, b) {
  const A = limpiar(a)
  const B = limpiar(b)
  let x = Infinity
  for (const p of A) x = Math.min(x, distPuntoLinea(p, B))
  for (const p of B) x = Math.min(x, distPuntoLinea(p, A))
  return x
}

// Las áreas que se analizan: las propuestas (A, B…) si hay; si no, todos los ASDI/ARCE.
export function areasAnalizables(ops = {}) {
  const zs = (ops?.zonasLog || []).map((z, i) => ({ z, i })).filter(({ z }) => AREAS_GU.includes(z.zona) && limpiar(z.coords).length >= 3)
  const prop = zs.filter(({ z }) => z.propuesta && !z.descartada)
  return prop.length ? prop.sort((a, b) => String(a.z.propuesta).localeCompare(String(b.z.propuesta))) : zs.filter(({ z }) => !z.descartada)
}

export function analizarCalco(calco = {}, parametros = {}) {
  const ops = calco.ops || {}
  const areas = areasAnalizables(ops).map(({ z, i }) => medirArea(z, i, calco, parametros))
  const fr = frenteDe(ops, calco.unidades || [])
  const dma = calcularDMA(parametrosDe(parametros))
  return { areas, frente: fr ? { rot: fr.rot, fuente: fr.fuente } : null, dma, parametros: parametrosDe(parametros), obsSeguridad: OBS_SEGURIDAD, sugerencias: sugerencias(areas) }
}

// ─── Sugerencias por aspecto (para la matriz de evaluación) ─────────────────────────
// { [aspectoId]: { [clave]: { estado: 'si' | 'no', motivo, regla } } }
const cmpMenor = (xs, tol = 0.1) => {
  const vals = xs.filter((x) => Number.isFinite(x.v))
  if (vals.length < 2) return null
  const best = Math.min(...vals.map((x) => x.v))
  return Object.fromEntries(vals.map((x) => [x.clave, x.v - best <= Math.max(0.5, best * tol)]))
}
const cmpMayor = (xs, tol = 0.1) => {
  const vals = xs.filter((x) => Number.isFinite(x.v))
  if (vals.length < 2) return null
  const best = Math.max(...vals.map((x) => x.v))
  return Object.fromEntries(vals.map((x) => [x.clave, best - x.v <= Math.max(0.5, best * tol)]))
}
export function sugerencias(areas = []) {
  const S = {}
  const put = (asp, clave, estado, motivo, regla) => {
    S[asp] = S[asp] || {}
    S[asp][clave] = { estado: estado ? 'si' : 'no', motivo, regla }
  }
  for (const a of areas) {
    if (a.dma?.ok != null) put('m_dma', a.clave, a.dma.ok, a.dma.txt, 'impositivo')
    if (a.seguridad?.ok != null) put('s_distSeg', a.clave, a.seguridad.ok, a.seguridad.txt, 'impositivo')
    if (a.coords?.length >= 3) put('s_dispersion', a.clave, !a.tamano.chica, a.tamano.txt, 'norma')
    if (a.epa) put('l_epa', a.clave, a.epa.toca, a.epa.toca ? (a.epa.km < 0.05 ? 'El EPA llega al área (la toca o la atraviesa).' : `El EPA llega al área (pasa a ${fmtKm(a.epa.km)}).`) : `El EPA más cercano pasa a ${fmtKm(a.epa.km)} del área: habría que prolongarlo o trazar otro.`, 'calco')
    if (a.bonlog) put('l_bonlog', a.clave, a.bonlog.n > 0, a.bonlog.n ? `Ya hay ${a.bonlog.n} instalación(es) logística(s) desplegada(s) en el área.` : 'El Batallón Logístico no tiene nada desplegado en esta área.', 'calco')
  }
  const rel = (asp, f, menor, txt) => {
    const xs = areas.map((a) => ({ clave: a.clave, v: f(a), a }))
    const r = (menor ? cmpMenor : cmpMayor)(xs)
    if (!r) return
    for (const x of xs) if (x.clave in r) put(asp, x.clave, r[x.clave], txt(x.a, r[x.clave]), 'comparacion')
  }
  rel('m_cerrado', (a) => a.apoyados?.mediaPrimer, true, (a, ok) => `En promedio a ${fmtKm(a.apoyados.mediaPrimer)} del 1er escalón (${(a.apoyados.primer || []).slice(0, 4).join(', ')})${ok ? ': el apoyo más cerrado de las propuestas' : ': más lejos que otra propuesta'}.`)
  rel('m_continuidad', (a) => a.apoyados?.max, true, (a, ok) => `El elemento más lejano (${a.apoyados.lejano}) queda a ${fmtKm(a.apoyados.max)}${ok ? ': alcanza a todos con menos cambios de posición' : ''}.`)
  rel('s_distEne', (a) => a.apoyados?.media, true, (a, ok) => `Recorrido medio de apoyo ${fmtKm(a.apoyados.media)}${ok ? ': menos exposición del flujo' : ': flujo más largo y más expuesto'}.`)
  rel('t_responsabilidad', (a) => (a.seguridad?.ok === false ? NaN : a.profundidad), true, (a, ok) => `A ${fmtKm(a.profundidad)} del frente${ok ? ': lo más adelante que permite la seguridad (menos responsabilidad territorial)' : ': más a retaguardia, aumenta la responsabilidad territorial'}.`)
  rel('s_amiga', (a) => a.amiga?.km, true, (a, ok) => `${a.amiga.nombre} a ${fmtKm(a.amiga.km)}${ok ? '' : ': más lejos de tropa amiga que otra propuesta'}.`)
  rel('s_flancos', (a) => a.flancos?.km, false, (a, ok) => `A ${fmtKm(a.flancos.km)} del flanco más cercano del AO${ok ? ': la más alejada de los flancos' : ': más cerca de un flanco'}.`)
  rel('s_epaFlancos', (a) => a.epaFlancos?.km, false, (a, ok) => `Su EPA pasa a ${fmtKm(a.epaFlancos.km)} del flanco más cercano${ok ? '' : ': más expuesto'}.`)
  rel('l_superior', (a) => a.superior?.km, true, (a) => `${a.superior.nombre} a ${fmtKm(a.superior.km)}.`)
  rel('l_avanzadas', (a) => a.avanzadas?.km, true, (a) => `${a.avanzadas.nombre} a ${fmtKm(a.avanzadas.km)}.`)
  rel('l_trenes', (a) => a.trenes?.media, true, (a) => `Las áreas de trenes quedan en promedio a ${fmtKm(a.trenes.media)}.`)
  return S
}
export const REGLAS = {
  impositivo: 'impositivo: lo fija la doctrina (si no cumple, el área se descarta)',
  norma: 'contra la norma de la Escuela',
  calco: 'leído del calco',
  comparacion: 'comparando las áreas propuestas entre sí (criterio de la Mesa)',
}

// ─── Tonelaje para el EPA ───────────────────────────────────────────────────────────
// Batallones (o regimientos, que en el cuadro del PMTD valen un batallón) por tipo de tropa.
export function tipoTropa(u) {
  const a = String(u?.arma || '').toLowerCase()
  if (/blind|tanq/.test(a)) return 'blindada'
  if (/mecan|cabmec/.test(a)) return 'mecanizada'
  if (/motor/.test(a)) return 'motorizada'
  if (/art/.test(a) && /155/.test(nombreUnidad(u))) return 'art155'
  return 'otras'
}
export function batallonesDelCalco(unidades = []) {
  const c = Object.fromEntries(TONELAJE_BATALLON.map((x) => [x.id, 0]))
  for (const u of unidadesApoyadas(unidades)) if (['batallon', 'regimiento'].includes(String(u.escalon || ''))) c[tipoTropa(u)]++
  return c
}
export function tonelaje(conteo = {}) {
  const filas = TONELAJE_BATALLON.map((x) => ({ ...x, n: Math.max(0, Math.round(+conteo[x.id] || 0)) })).map((x) => ({ ...x, total: x.n * x.t }))
  const total = filas.reduce((s, x) => s + x.total, 0)
  return { filas, total, texto: filas.filter((x) => x.n).map((x) => `${x.n} × ${x.t} t (${x.nom.toLowerCase()})`).join(' + ') + (total ? ` = ${total} t/día` : '') }
}
export const tonelajeDivision = (tipo) => TONELAJE_DIVISION.find((x) => x.id === tipo) || null

// ─── Texto (para el expediente y los pedidos a la IA) ──────────────────────────────
export function textoAnalisis(an) {
  if (!an?.areas?.length) return 'No hay áreas logísticas (ASDI / ARCE / propuestas) trazadas en el calco.'
  const L = []
  L.push(`Referencia para la distancia de seguridad: ${an.frente ? an.frente.fuente : 'NO HAY (sin AO ni fichas enemigas)'}.`)
  if (an.dma?.ok) L.push(`Distancia máxima de apoyo: ${an.dma.texto} (las distancias por carretera se estiman: línea recta × ${an.parametros.factor.toLocaleString('es')}).`)
  for (const a of an.areas) {
    L.push(`- ${a.nombre} (${ABREV_ZONA[a.zona] || a.zona}${a.propuesta ? ', propuesta' : ''}):`)
    L.push(`  · Tamaño: ${a.tamano.txt}.`)
    L.push(`  · Distancia de seguridad: ${a.seguridad.txt}.`)
    if (a.enemigo) L.push(`  · Ficha enemiga más cercana: ${a.enemigo.nombre} a ${fmtKm(a.enemigo.km)}.`)
    L.push(`  · DMA: ${a.dma.txt}.`)
    if (a.apoyados?.n) L.push(`  · Apoyados (${a.apoyados.fuente}): ${a.apoyados.n}; distancia media ${fmtKm(a.apoyados.media)}; al 1er escalón ${fmtKm(a.apoyados.mediaPrimer)}.`)
    if (a.amiga) L.push(`  · Tropa amiga más cercana: ${a.amiga.nombre} a ${fmtKm(a.amiga.km)}.`)
    if (a.flancos) L.push(`  · Flanco del AO más cercano a ${fmtKm(a.flancos.km)}.`)
    if (a.epa) L.push(`  · EPA: ${a.epa.toca ? 'llega al área' : `pasa a ${fmtKm(a.epa.km)}`}; el EPA mide ${fmtKm(a.epa.largo, 0)}.`)
    if (a.superior) L.push(`  · Escalón superior: ${a.superior.nombre} a ${fmtKm(a.superior.km)}.`)
    if (a.avanzadas) L.push(`  · Instalación avanzada del escalón superior: ${a.avanzadas.nombre} a ${fmtKm(a.avanzadas.km)}.`)
    L.push(`  · Batallón Logístico desplegado en el área: ${a.bonlog.n ? `${a.bonlog.n} instalación(es)` : 'no'}.`)
  }
  return L.join('\n')
}

export { esPunto, distKm }
