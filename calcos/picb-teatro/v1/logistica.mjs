// 🚚 LOGÍSTICA Y REEMPLAZOS DEL TEATRO (15-11-2026): el apoyo de las FF.TT.T.O. fase por fase. Sin DOM: lo usan
// panel.mjs (paso 6), la impresión por fases, el .json del Juego de Guerra y las pruebas.
//
// Pedido: «habilitá lo que es logística… a nivel FF.TT.T.O.… base logística, sección base, sección especial…
// investigá bien y conceptualo para que en la ficha hagamos jugar… todos los calcos se deben poder imprimir… la
// logística y los reemplazos también, cómo se manejarían… integrar en el planeamiento y en el juego de guerra».
//
// DOCTRINA (UU. CMDO. LOG.: texto CL FF.TT.T.O. 2016 y clase 2022 · Reglamento 02-20 SPAC, cap. XVII · ECEM 15-35
// SPAC · Tema Base DIAMANTE, Anexo «C» Personal y Anexo «E» Logística):
//   ZONA DEL INTERIOR → BASE LOGÍSTICA (Anexo E: COCHABAMBA) → ZONA DE ETAPAS, a cargo del CL FF.TT.T.O.:
//     · SECCIÓN BASE (CLSB): instalaciones pesadas, sujeta a las terminales de trasbordo y descarga; recibe de la
//       ZI y de la Base Logística, acumula y provee a pedido a las Secciones Avanzadas.
//     · SECCIÓN ESPECIAL (CLSE): organización TEMPORAL entre la SB y la SA cuando el TO es extenso, para mantener la
//       continuidad de los abastecimientos.
//     · SECCIÓN AVANZADA (CLSA): UNA POR CADA C.E.; casi todo móvil; relación permanente con la primera línea.
//   → ZONA DE COMBATE: los órganos de primera línea de cada GU (sus dotaciones = días de abastecimiento).
//   Distancia máxima de apoyo (DMA) = (horas del conductor − carga y descarga) × velocidad ÷ 2
//     = (10 − 2) × 20 km/h ÷ 2 = 80 km (GU ↔ su apoyo) · con 30 km/h entre secciones = 120 km.
//   Niveles: operativo (entre dos provisiones) + de seguridad = máximo; en días, convertidos a toneladas.
//   REEMPLAZOS (SPAC, cap. XVII): dependen del Cmte. de las FF.TT.T.O.; el Ayudante General los contabiliza con
//   partes diarios bajo la supervisión del G-1; el G-3 fija la prioridad; Batallón de Reemplazos de 3 a 7 Cías de
//   ~400 hombres junto a la terminal de entrada al TO; vuelven por el mismo sistema los heridos recuperados dentro
//   del nivel de evacuación (Anexo E: 15 días). Anexo C: refuerzos desde el D+3; reemplazos cada 30 días a pedido.
// Consumos, capacidades y porcentajes de bajas son REFERENCIAS editables: el Anexo E dice que «deben ajustarse a
// las tablas de planeamiento logístico vigentes».
import { distKm, enPoligono, sinTildes, fmtDia, redondeo } from './modelo.mjs'
import { ruta } from './red.mjs'
import { puntoEnLinea } from './doctrina.mjs'

export const VERSION = '20261115'
const r5 = (x) => (Number.isFinite(x) ? Math.round(x * 1e5) / 1e5 : null)
const norm = (s) => sinTildes(String(s || '')).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export const miles = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('es-BO') : '—')
const lista = (l, y = 'y') => { const a = [...new Set(l.filter(Boolean))]; return a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} ${y} ${a[a.length - 1]}` }

// ── REFERENCIAS (se corrigen en el paso 6 y viajan al Juego de Guerra) ─────────────────────────────────────────────
// Clases del Anexo E: período de provisión (= nivel operativo, días) y kg por hombre y día en combate (referencia).
export const CLASES = [
  { id: 'I', nombre: 'Subsistencia (ración de combate de 4.000–4.500 kcal)', nivel: 10, kg: 1.8 },
  { id: 'Agua', nombre: 'Agua potable (rubro crítico: 6 a 10 l)', nivel: 3, kg: 8 },
  { id: 'II', nombre: 'Vestuario y equipo (invierno y altura)', nivel: 30, kg: 0.4 },
  { id: 'III', nombre: 'Carburantes y lubricantes (según arma)', nivel: 10, kg: null },
  { id: 'IV', nombre: 'Materiales de construcción (organización del terreno)', nivel: 30, kg: 1.5 },
  { id: 'V', nombre: 'Munición (según arma)', nivel: 15, kg: null },
  { id: 'VI', nombre: 'Artículos de uso personal', nivel: 30, kg: 0.1 },
  { id: 'VII', nombre: 'Artículos mayores acabados (vehículos)', nivel: 90, kg: 0.6 },
  { id: 'VIII', nombre: 'Sanidad (oxígeno, mal de altura, hipotermia)', nivel: 15, kg: 0.4 },
  { id: 'IX', nombre: 'Repuestos', nivel: 30, kg: 0.8 },
  { id: 'X', nombre: 'Material de uso no militar', nivel: 15, kg: 0.1 },
]
export const KG_ARMA = {
  III: { infanteria: 2, andina: 1.5, motorizada: 7, caballeria: 5, cabmec: 12, mecanizada: 14, blindada: 20, artilleria: 8, aerotransportada: 3 },
  V: { infanteria: 3, andina: 2.5, motorizada: 4, caballeria: 3, cabmec: 5, mecanizada: 6, blindada: 8, artilleria: 12, aerotransportada: 3 },
}
export const EFECTIVOS = { regimiento: 1200, brigada: 3500, division: 9000, cuerpo: 20000, ejercito: 1500 }
// Fracción del consumo de un día de combate según lo que hace la GU en la fase.
export const POSTURA = { ataque: 1, defensa: 0.85, cobertura: 0.6, reserva: 0.35 }
export const DMA = { conductorH: 10, cargaH: 2, velGu: 20, velSecciones: 30 }
// Capacidad de transporte de cada instalación: toneladas por día puestas a la DMA (Cías de transporte asignadas).
export const CAPACIDAD = { BL: 4000, SB: 2400, SE: 1500, SA: 900 }
export const NIVEL_DIAS = { BL: 30, SB: 15, SE: 7, SA: 4, GU: 5 }
export const SEGURIDAD_KM = { SA: 25, SE: 100, SB: 150, BL: 250 }
// Tablas de porcentaje de bajas (por día, sobre los efectivos) y su composición.
export const BAJAS = { defensa: 0.008, ataque: 0.015, sinContacto: 0.0005, muertos: 0.2, heridos: 0.65, desaparecidos: 0.15, recuperables: 0.4, diasRecuperacion: 10 }
export const REEMPLAZOS = { porCompania: 400, procesaPorCompania: 200, ciasMin: 3, ciasMax: 7, emergenciaDias: 3, emergenciaHombres: 800 }
export const NOMBRE_TIPO = {
  BL: 'Base Logística', SB: 'Sección Base (CLSB)', SE: 'Sección Especial (CLSE)', SA: 'Sección Avanzada (CLSA)',
  BR: 'Batallón de Reemplazos', H: 'Hospital (3er nivel)',
}
export const COLOR_TIPO = { BL: '#6d4c41', SB: '#2e7d32', SE: '#ef6c00', SA: '#1565c0', BR: '#6a1b9a', H: '#c62828' }

export const dmaKm = (vel, d = DMA) => Math.round(((d.conductorH - d.cargaH) * vel) / 2)
const papelDe = (p) => (/contraataq|contraofens|ataq/i.test(p || '') ? 'ataque' : /defens/i.test(p || '') ? 'defensa' : /cobertura/i.test(p || '') ? 'cobertura' : /reserva/i.test(p || '') ? 'reserva' : 'defensa')

// kg por hombre y día de una GU (todas las clases, día de combate). `clases`: las correcciones del paso 6.
export function kgHombreDia(arma, clases = {}) {
  const a = String(arma || 'infanteria')
  let total = 0
  const det = {}
  for (const c of CLASES) {
    const ed = Number(clases[c.id]?.kg)
    const kg = Number.isFinite(ed) && ed >= 0 && clases[c.id]?.kg !== '' && clases[c.id]?.kg != null ? ed : c.kg ?? KG_ARMA[c.id]?.[a] ?? KG_ARMA[c.id]?.motorizada ?? 0
    det[c.id] = kg; total += kg
  }
  return { total: redondeo(total, 1), det }
}

// ── geometría y lugares ──
function paisIso(base, p) {
  for (const [, iso, partes] of base.paises || []) if (partes.some((q) => enPoligono(p, q[0]))) return iso
  return ''
}
function buscarPoblacion(base, nombre, rangoMax = 3) {
  const n = norm(nombre)
  if (!n) return null
  let m = null
  for (const q of base.poblaciones || []) if (q[1] <= rangoMax && norm(q[0]) === n && (!m || q[1] < m[1])) m = q
  return m ? { nombre: m[0], rango: m[1], lng: m[2], lat: m[3], hab: m[4] || 0 } : null
}
// «Base Logística: COCHABAMBA» en el texto del ejercicio (Anexo E del Tema Base).
export function blDelTexto(foto) {
  let t = ''
  try { t = JSON.stringify(foto || {}) } catch (e) { return '' }
  const m = t.match(/Base\s+Log[ií]stica\s*[:\-–]\s*([A-ZÁÉÍÓÚÑa-záéíóúñ][A-ZÁÉÍÓÚÑa-záéíóúñ .]{2,30})/)
  return m ? m[1].replace(/\s*\.$/, '').trim() : ''
}
// «proximidades de X»: el poblado más cercano (para nombrar un punto del camino).
function cercaDeEn(base, p, maxKm = 30) {
  let m = null
  for (const q of base.poblaciones || []) { if (q[1] > 5) continue; const d = distKm(p, [q[2], q[3]]); if (d <= maxKm && (!m || d + q[1] * 3 < m.s)) m = { n: q[0], s: d + q[1] * 3 } }
  return m ? `proximidades de ${m.n}` : ''
}
// km acumulados de cada vértice de una línea.
function acumulado(coords) { const k = [0]; for (let i = 1; i < coords.length; i++) k.push(k[i - 1] + distKm(coords[i - 1], coords[i])); return k }
// Poblaciones a menos de `maxKm` de la línea, con el km del itinerario donde quedan.
function poblacionesEnRuta(base, coords, kmDesde, kmHasta, maxKm = 8, rangoMax = 4) {
  if (!coords?.length) return []
  const acc = acumulado(coords)
  const xs = coords.map((p) => p[0]), ys = coords.map((p) => p[1])
  const g = maxKm / 90
  const caja = [Math.min(...xs) - g, Math.min(...ys) - g, Math.max(...xs) + g, Math.max(...ys) + g]
  const out = []
  for (const q of base.poblaciones || []) {
    if (q[1] > rangoMax || q[2] < caja[0] || q[2] > caja[2] || q[3] < caja[1] || q[3] > caja[3]) continue
    let mejor = { d: Infinity, km: 0 }
    for (let i = 0; i < coords.length; i++) { const d = distKm(coords[i], [q[2], q[3]]); if (d < mejor.d) mejor = { d, km: acc[i] } }
    if (mejor.d <= maxKm && mejor.km >= kmDesde && mejor.km <= kmHasta) out.push({ nombre: q[0], rango: q[1], lng: q[2], lat: q[3], hab: q[4] || 0, km: mejor.km, d: mejor.d })
  }
  return out
}
// Fracción de un itinerario que corre junto a un ferrocarril ACTIVO (Anexo E: Oruro–Uyuni–Villazón y Uyuni–Avaroa).
function fraccionFerroviaria(base, coords) {
  const lineas = (base.ffcc || []).filter((f) => f[0] === 'activo' && f[2]?.length > 1)
  if (!lineas.length || !coords?.length) return 0
  const cajas = lineas.map((f) => { const xs = f[2].map((p) => p[0]), ys = f[2].map((p) => p[1]); return [Math.min(...xs) - 0.07, Math.min(...ys) - 0.07, Math.max(...xs) + 0.07, Math.max(...ys) + 0.07] })
  const total = acumulado(coords).at(-1)
  if (total < 5) return 0
  let si = 0, n = 0
  for (let km = 0; km <= total; km += Math.max(5, total / 40)) {
    const p = puntoEnLinea(coords, km); n++
    let cerca = false
    for (let j = 0; j < lineas.length && !cerca; j++) {
      const c = cajas[j]
      if (p[0] < c[0] || p[0] > c[2] || p[1] < c[1] || p[1] > c[3]) continue
      for (const q of lineas[j][2]) if (distKm(p, q) <= 6) { cerca = true; break }
    }
    if (cerca) si++
  }
  return n ? si / n : 0
}

// ── EL PLAN ─────────────────────────────────────────────────────────────────────────────────────────────────────
// ctx: { base, red, analisis, cap (FASES AZUL), enf (enfrentamientos), unidades, teatro, foto, ed }
// ed = resultados.picbTeatro.logistica: { bl, clases:{I:{nivel,seg,kg}}, ef:{CE-I:n}, kg:{CE-I:n}, cap:{SB:n,'SA CE-I':n},
//   vel:{gu,secciones}, se:'auto'|'no', rojo:true|false, br:{cias,reserva}, pos:{'F-II|SA CE-I':[lng,lat], 'SB':[…]} }
export function planLogistico({ base, red, analisis = [], cap = null, enf = [], unidades = { propias: [], enemigas: [] }, teatro = {}, foto = null, ed = {} } = {}) {
  if (!base || !red || !cap?.fases?.length) return null
  const avisos = []
  const dmaGu = dmaKm(Number(ed.vel?.gu) > 0 ? Number(ed.vel.gu) : DMA.velGu)
  const dmaSec = dmaKm(Number(ed.vel?.secciones) > 0 ? Number(ed.vel.secciones) : DMA.velSecciones)
  const pos = ed.pos || {}
  const capDe = (id, tipo) => (Number(ed.cap?.[id]) > 0 ? Number(ed.cap[id]) : CAPACIDAD[tipo] || 900)
  const camino = (a, b) => distKm(a, b) * 1.3   // Anexo E: «factor referencial de 1,3» de la recta al camino
  const cercaDe = (p) => cercaDeEn(base, p)

  // 1) GG.UU. propias del CAP: efectivos y consumo.
  const gus = new Map()
  for (const f of cap.fases) for (const a of f.acciones) if (!gus.has(a.designacion)) {
    const u = (unidades.propias || []).find((x) => x.designacion === a.designacion) || a
    const esc = u.escalon || a.escalon || 'division'
    const ef = Number(ed.ef?.[a.designacion]) > 0 ? Number(ed.ef[a.designacion]) : EFECTIVOS[esc] || 9000
    const kgAuto = kgHombreDia(u.arma || a.arma, ed.clases || {}).total
    const kg = Number(ed.kg?.[a.designacion]) > 0 ? Number(ed.kg[a.designacion]) : kgAuto
    gus.set(a.designacion, { designacion: a.designacion, escalon: esc, arma: u.arma || a.arma || 'infanteria', ef, kg, kgAuto })
  }
  const efTotal = [...gus.values()].reduce((s, g) => s + g.ef, 0)
  const pasos = analisis.filter((a) => a.puntos?.length).map((a) => [a.puntos[0].lng, a.puntos[0].lat])
  const lejos = (p) => (pasos.length ? Math.min(...pasos.map((q) => distKm(p, q))) : Infinity)
  const f0 = cap.fases[0]
  const frenteF1 = f0.acciones.filter((a) => a.deop != null && Number.isFinite(a.lng))
  const todasF1 = f0.acciones.filter((a) => Number.isFinite(a.lng))
  if (!todasF1.length) return null
  const centro = (l) => [l.reduce((s, a) => s + a.lng, 0) / l.length, l.reduce((s, a) => s + a.lat, 0) / l.length]
  const cFrente = centro(frenteF1.length ? frenteF1 : todasF1)
  const isoPropio = (() => { const c = {}; for (const a of todasF1) { const i = paisIso(base, [a.lng, a.lat]); if (i) c[i] = (c[i] || 0) + 1 } return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || '' })()
  const propio = (p) => !isoPropio || paisIso(base, p) === isoPropio

  // 2) BASE LOGÍSTICA: la del ejercicio (Anexo E), la elegida en el paso 6 o la capital propia mejor ubicada.
  let bl = null, fuenteBl = ''
  const elegida = ed.bl ? buscarPoblacion(base, ed.bl, 2) : null
  const delTexto = !elegida ? buscarPoblacion(base, blDelTexto(foto), 2) : null
  if (elegida) { bl = elegida; fuenteBl = 'elegida por el G-4' }
  else if (delTexto) { bl = delTexto; fuenteBl = 'del Tema Base (Anexo «E»)' }
  else {
    const cand = (base.poblaciones || []).filter((q) => q[1] === 1 && propio([q[2], q[3]]) && lejos([q[2], q[3]]) >= SEGURIDAD_KM.BL)
      .filter((q) => distKm(cFrente, [q[2], q[3]]) <= 700)
      .map((q) => ({ nombre: q[0], rango: 1, lng: q[2], lat: q[3], hab: q[4] || 0, s: Math.sqrt(q[4] || 1) / Math.max(50, distKm(cFrente, [q[2], q[3]])) ** 1.5 }))
      .sort((a, b) => b.s - a.s)
    bl = cand[0] || null; fuenteBl = 'propuesta: capital propia a más de 250 km del enemigo, mejor comunicada con el frente'
  }
  if (!bl) return null

  // 3) SECCIÓN BASE: la primera capital (o ciudad) sobre el camino de la BL al frente, fuera del alcance enemigo.
  const rBlFrente = ruta(red, [bl.lng, bl.lat], cFrente)
  const kmBF = rBlFrente.km || distKm([bl.lng, bl.lat], cFrente)
  const candSB = poblacionesEnRuta(base, rBlFrente.coords, 40, kmBF, 12, 2).filter((q) => propio([q.lng, q.lat]) && lejos([q.lng, q.lat]) >= SEGURIDAD_KM.SB)
  const sbAuto = candSB.filter((q) => q.rango === 1).sort((a, b) => a.km - b.km)[0] || candSB.sort((a, b) => (b.hab || 0) - (a.hab || 0))[0] || { nombre: bl.nombre, lng: bl.lng + 0.05, lat: bl.lat - 0.04 }

  const I = []   // instalaciones
  const nueva = (x) => { I.push(x); return x }
  const pt = (id, auto) => (pos[id] ? { lng: pos[id][0], lat: pos[id][1], movida: true } : { lng: auto.lng, lat: auto.lat, movida: false })
  const BL = nueva({ id: 'BL', tipo: 'BL', bando: 'azul', nombre: `Base Logística ${bl.nombre}`, lugar: bl.nombre, ...pt('BL', bl), fuente: fuenteBl, cap: capDe('BL', 'BL'), de: null })
  const SB = nueva({ id: 'SB', tipo: 'SB', bando: 'azul', nombre: `CLSB – Sección Base ${sbAuto.nombre}`, lugar: sbAuto.nombre, ...pt('SB', sbAuto), cap: capDe('SB', 'SB'), de: 'BL' })

  // 4) SECCIÓN AVANZADA: una por cada CE (o DIV) del frente, 30 a 65 km detrás de él por el camino (seguridad ≥ 25 km,
  //    dentro de la DMA de 80 km). En cada fase se queda donde está mientras la GU siga entre 20 km y la DMA.
  const ubicarSA = (desde, p) => {
    const r = ruta(red, desde, p)
    const total = r.km || distKm(desde, p)
    if (total <= 45) { const q = [desde[0] + (p[0] - desde[0]) * 0.3, desde[1] + (p[1] - desde[1]) * 0.3]; return { lng: q[0], lat: q[1], lugar: cercaDe(q) } }
    const cand = poblacionesEnRuta(base, r.coords, total - 65, total - 28, 8, 4).filter((q) => propio([q.lng, q.lat]))
      .map((q) => ({ ...q, s: Math.abs(total - q.km - 42) + q.rango * 4 + q.d })).sort((a, b) => a.s - b.s)
    if (cand[0]) return { lng: cand[0].lng, lat: cand[0].lat, lugar: cand[0].nombre }
    const q = puntoEnLinea(r.coords, Math.max(0, total - 42))
    return { lng: q[0], lat: q[1], lugar: cercaDe(q) }
  }
  // Una SA por cada CE (también el de reserva); sin CE, una por DIV; sin DIV, una por GU del frente.
  const deEsc = (e) => todasF1.filter((a) => gus.get(a.designacion)?.escalon === e)
  const conSA = deEsc('cuerpo').length ? deEsc('cuerpo') : deEsc('division').length ? deEsc('division') : frenteF1.length ? frenteF1 : todasF1
  const SAs = []
  for (const a of conSA) {
    const id = `SA ${a.designacion}`
    const p1 = ubicarSA([SB.lng, SB.lat], [a.lng, a.lat])
    const x = nueva({ id, tipo: 'SA', bando: 'azul', nombre: `CLSA – Sección Avanzada ${a.designacion}`, lugar: p1.lugar, ...pt(`${f0.id}|${id}`, p1), cap: capDe(id, 'SA'), de: 'SB', apoya: [a.designacion] })
    SAs.push(x)
  }

  // 5) SECCIÓN ESPECIAL: si una SA queda a más de 2 DMA de la SB por camino (TO extenso), un nudo intermedio
  //    (con ferrocarril si lo hay) toma a las SA lejanas. Hasta dos.
  const SEs = []
  const umbralSE = Number(ed.umbralSE) > 0 ? Number(ed.umbralSE) : 2 * dmaSec
  if (ed.se !== 'no') {
    const rutasSA = new Map(SAs.map((s) => [s.id, ruta(red, [SB.lng, SB.lat], [s.lng, s.lat])]))
    let lejanas = SAs.filter((s) => (rutasSA.get(s.id).km || camino([SB.lng, SB.lat], [s.lng, s.lat])) > umbralSE)
    for (let k = 0; k < 2 && lejanas.length; k++) {
      const votos = new Map()
      for (const s of lejanas) {
        const r = rutasSA.get(s.id), tot = r.km || 1
        for (const q of poblacionesEnRuta(base, r.coords, tot * 0.3, tot * 0.75, 10, 3)) {
          if (!propio([q.lng, q.lat]) || lejos([q.lng, q.lat]) < SEGURIDAD_KM.SE) continue
          const v = votos.get(q.nombre) || { ...q, sas: new Set() }
          v.sas.add(s.id); votos.set(q.nombre, v)
        }
      }
      const orden = [...votos.values()].map((v) => ({ ...v, ferro: fraccionFerroviaria(base, ruta(red, [SB.lng, SB.lat], [v.lng, v.lat]).coords) > 0.5 }))
        .sort((a, b) => (b.sas.size - a.sas.size) || ((b.ferro ? 1 : 0) - (a.ferro ? 1 : 0)) || (a.rango - b.rango) || ((b.hab || 0) - (a.hab || 0)))
      const elegido = orden[0]
      if (!elegido) { avisos.push(`Las SA de ${lista(lejanas.map((s) => s.apoya[0]))} quedan a más de ${umbralSE} km de la SB y no encontré un nudo intermedio para una Sección Especial: ubicála a mano.`); break }
      const id = `SE${k + 1}`
      const se = nueva({ id, tipo: 'SE', bando: 'azul', nombre: `CLSE – Sección Especial ${elegido.nombre}`, lugar: elegido.nombre, ...pt(id, elegido), cap: capDe(id, 'SE'), de: 'SB', apoya: [] })
      for (const s of lejanas) if (elegido.sas.has(s.id)) { s.de = id; se.apoya.push(s.apoya[0]) }
      SEs.push(se)
      lejanas = lejanas.filter((s) => !elegido.sas.has(s.id))
    }
  }

  // 6) BATALLÓN DE REEMPLAZOS junto a la terminal de entrada (la Sección Base) y los hospitales de 3er nivel.
  const BR = nueva({ id: 'BR', tipo: 'BR', bando: 'azul', nombre: `Batallón de Reemplazos ${SB.lugar}`, lugar: SB.lugar, ...pt('BR', { lng: SB.lng + 0.12, lat: SB.lat + 0.06 }), cap: 0, de: null })
  const hosp = (base.poblaciones || []).filter((q) => q[1] === 1 && propio([q[2], q[3]]) && distKm(cFrente, [q[2], q[3]]) <= 700)
    .map((q) => ({ nombre: q[0], lng: q[2], lat: q[3], km: Math.round(camino([q[2], q[3]], cFrente)) })).sort((a, b) => a.km - b.km).slice(0, 5)

  // 7) EPA: los caminos BL → SB → SE → SA (por la red vial; ferroviario si corre junto a un ferrocarril activo).
  const porId = new Map(I.map((x) => [x.id, x]))
  const epa = (x) => {
    const d = porId.get(x.de)
    if (!d) return null
    const r = ruta(red, [d.lng, d.lat], [x.lng, x.lat])
    const ferro = fraccionFerroviaria(base, r.coords) >= 0.6
    return { de: d.id, a: x.id, km: Math.round(r.km || camino([d.lng, d.lat], [x.lng, x.lat])), coords: r.coords.map((p) => [r5(p[0]), r5(p[1])]), ferro, porRed: r.porRed }
  }
  for (const x of I) { const e = epa(x); if (e) { x.km = e.km; x.ferro = e.ferro; x.epa = e } }

  // 8) FASE POR FASE: dónde está cada SA, quién apoya a quién, consumo, flujo y personal.
  const contactoDe = new Map()   // 'F-II|CE-I' → true
  for (const e of enf || []) if (e.contacto) for (const z of e.azul || []) contactoDe.set(`${e.fase}|${z}`, true)
  const clases = ed.clases || {}
  const nivelDe = (c) => (Number(clases[c.id]?.nivel) > 0 ? Number(clases[c.id].nivel) : c.nivel)
  const segDe = (c) => (Number(clases[c.id]?.seg) >= 0 && clases[c.id]?.seg !== '' && clases[c.id]?.seg != null ? Number(clases[c.id].seg) : Math.max(1, Math.ceil(nivelDe(c) / 3)))
  const ultimaSA = new Map(SAs.map((s) => [s.id, { lng: s.lng, lat: s.lat, lugar: s.lugar }]))
  const fases = cap.fases.map((f, i) => {
    const dias = Math.max(1, (Number(f.a) || 0) - (Number(f.de) || 0))
    const at = new Map(f.acciones.filter((a) => Number.isFinite(a.lng)).map((a) => [a.designacion, a]))
    const posF = {}
    for (const x of I) if (x.tipo !== 'SA') posF[x.id] = { lng: x.lng, lat: x.lat, lugar: x.lugar, desplaza: false }
    for (const s of SAs) {
      const a = at.get(s.apoya[0]), k = `${f.id}|${s.id}`
      let p = ultimaSA.get(s.id), desplaza = false
      if (pos[k]) { p = { lng: pos[k][0], lat: pos[k][1], lugar: p.lugar }; desplaza = i > 0 }
      else if (i > 0 && a) {
        const d = camino([p.lng, p.lat], [a.lng, a.lat])
        if (d > dmaGu || d < 15) { const sup = porId.get(s.de); p = ubicarSA([sup.lng, sup.lat], [a.lng, a.lat]); desplaza = true }
      }
      ultimaSA.set(s.id, p)
      posF[s.id] = { lng: r5(p.lng), lat: r5(p.lat), lugar: p.lugar, desplaza, movida: !!pos[k] }
    }
    // Cada GU se apoya en la instalación más cercana (SA, si no SE, si no SB) por camino.
    const gu = []
    for (const a of at.values()) {
      const g = gus.get(a.designacion)
      if (!g) continue
      const papel = papelDe(a.papel)
      const contacto = !!contactoDe.get(`${f.id}|${a.designacion}`)
      const fac = contacto ? (papel === 'ataque' ? POSTURA.ataque : POSTURA.defensa) : papel === 'reserva' ? POSTURA.reserva : papel === 'ataque' ? 0.8 : POSTURA.cobertura
      const tDia = (g.ef * g.kg * fac) / 1000
      let mejor = null
      for (const x of I) {
        if (!['SA', 'SE', 'SB'].includes(x.tipo)) continue
        const p = posF[x.id], d = camino([p.lng, p.lat], [a.lng, a.lat])
        const prefiere = x.tipo === 'SA' && x.apoya?.includes(a.designacion) ? 0.75 : x.tipo === 'SA' ? 1 : 1.15
        if (!mejor || d * prefiere < mejor.s) mejor = { x, d, s: d * prefiere }
      }
      const tasa = contacto ? (papel === 'ataque' ? BAJAS.ataque : BAJAS.defensa) : BAJAS.sinContacto
      const bajas = g.ef * tasa * dias
      gu.push({ designacion: a.designacion, papel, contacto, ef: g.ef, kg: g.kg, tDia, apoyo: mejor?.x.id || null, km: mejor ? Math.round(mejor.d) : null,
        dentroDma: !!mejor && mejor.d <= dmaGu, bajas })
    }
    // Demanda por instalación (t/día) y uso de su transporte: cada cliente pide su demanda × (1 si está a la DMA o
    // menos; si no, km/DMA: más vueltas largas).
    const demanda = new Map(I.map((x) => [x.id, 0]))
    for (const g of gu) if (g.apoyo) demanda.set(g.apoyo, demanda.get(g.apoyo) + g.tDia)
    for (const tipo of ['SA', 'SE', 'SB']) for (const x of I.filter((y) => y.tipo === tipo)) if (x.de) demanda.set(x.de, demanda.get(x.de) + demanda.get(x.id))
    const flujo = []
    for (const x of I) {
      if (!['BL', 'SB', 'SE', 'SA'].includes(x.tipo)) continue
      const clientes = [...I.filter((y) => y.de === x.id).map((y) => ({ t: demanda.get(y.id), km: kmEntre(x, y, posF), ferro: y.ferro })),
        ...gu.filter((g) => g.apoyo === x.id).map((g) => ({ t: g.tDia, km: g.km || 0, ferro: false }))]
      let uso = 0
      for (const c of clientes) uso += (c.t / (x.cap * (c.ferro ? 2 : 1))) * Math.max(1, c.km / (x.tipo === 'SA' ? dmaGu : dmaSec))
      const pct = Math.round(uso * 100)
      flujo.push({ id: x.id, tDia: Math.round(demanda.get(x.id)), cap: x.cap, pct, estado: pct <= 85 ? 'ok' : pct <= 100 ? 'limite' : 'insuficiente' })
    }
    const tot = gu.reduce((s, g) => s + g.bajas, 0)
    const personal = { bajas: Math.round(tot), muertos: Math.round(tot * BAJAS.muertos), heridos: Math.round(tot * BAJAS.heridos), desaparecidos: Math.round(tot * BAJAS.desaparecidos),
      recuperan: Math.round(tot * BAJAS.heridos * BAJAS.recuperables) }
    personal.reemplazos = Math.max(0, personal.bajas - personal.recuperan)
    return { id: f.id, nombre: f.nombre, ventana: f.ventana, de: f.de, a: f.a, dias, pos: posF, gu, flujo, personal, tDia: Math.round(gu.reduce((s, g) => s + g.tDia, 0)) }
  })

  // 9) Niveles por clase para toda la fuerza (Anexo E) y el Batallón de Reemplazos.
  const kgPromedio = efTotal ? [...gus.values()].reduce((s, g) => s + g.kg * g.ef, 0) / efTotal : 0
  const nivelesClase = CLASES.map((c) => {
    const kg = [...gus.values()].reduce((s, g) => s + kgHombreDia(g.arma, clases).det[c.id] * g.ef, 0) / Math.max(1, efTotal)
    const op = nivelDe(c), seg = segDe(c)
    return { id: c.id, nombre: c.nombre, operativo: op, seguridad: seg, maximo: op + seg, kg: redondeo(kg, 2), tDia: Math.round((kg * efTotal) / 1000), tMax: Math.round((kg * efTotal * (op + seg)) / 1000), editado: !!clases[c.id] }
  })
  const reempTot = fases.reduce((s, f) => s + f.personal.reemplazos, 0)
  const diasTot = fases.reduce((s, f) => s + f.dias, 0)
  const pico10 = Math.max(...fases.map((f) => (f.personal.bajas / f.dias) * 10))
  const ciasAuto = Math.max(REEMPLAZOS.ciasMin, Math.min(REEMPLAZOS.ciasMax, Math.ceil(pico10 / REEMPLAZOS.porCompania)))
  const cias = Number(ed.br?.cias) > 0 ? Math.max(1, Math.min(9, Number(ed.br.cias))) : ciasAuto
  // La reserva limitada del BR al D: lo que alojan sus compañías (el primer nivel mensual, pedido con anticipación).
  const reserva = Number(ed.br?.reserva) >= 0 && ed.br?.reserva !== '' && ed.br?.reserva != null ? Number(ed.br.reserva) : cias * REEMPLAZOS.porCompania
  Object.assign(BR, { cias, ciasAuto, reserva, procesa: cias * REEMPLAZOS.procesaPorCompania, nivelMensual: Math.round((reempTot / Math.max(1, diasTot)) * 30) })
  // ¿Cuándo hace falta un pedido de emergencia? cuando lo acumulado supera la reserva del BR.
  let acum = 0, emergencia = null
  for (const f of fases) { acum += f.personal.reemplazos; if (!emergencia && acum > reserva) emergencia = { fase: f.id, pedirEn: Math.max(0, (Number(f.de) || 0) - REEMPLAZOS.emergenciaDias), hombres: Math.ceil((acum - reserva) / REEMPLAZOS.porCompania) * REEMPLAZOS.porCompania } }
  BR.emergencia = emergencia

  // 10) Stocks iniciales y máximos (t) que llevan al juego: nivel en días × lo que apoya en la F-II (la fase del choque).
  const fRef = fases[Math.min(1, fases.length - 1)]
  for (const x of I) {
    if (x.tipo === 'BR') continue
    const d = x.tipo === 'BL' ? fRef.tDia : fRef.flujo.find((y) => y.id === x.id)?.tDia || 0
    const dias = Number(ed.niveles?.[x.tipo]) > 0 ? Number(ed.niveles[x.tipo]) : NIVEL_DIAS[x.tipo]
    x.nivelDias = dias
    x.tMax = Math.max(200, Math.round(d * dias))
  }

  // 11) Logística probable del enemigo (para el G-2 y como blancos): un área de apoyo por DEOP, detrás de su paso,
  //     y su base en el origen más a retaguardia.
  let rojo = null
  if (ed.rojo !== false && analisis.length) {
    const origenes = (teatro.origenes || []).filter((o) => Number.isFinite(o.lng))
    const aal = []
    for (const a of analisis) {
      if (!a.puntos?.length || !(a.enemigas || []).length) continue
      const paso = [a.puntos[0].lng, a.puntos[0].lat]
      const o = origenes.slice().sort((x, y) => distKm(paso, [x.lng, x.lat]) - distKm(paso, [y.lng, y.lat]))[0]
      const hacia = o ? [o.lng, o.lat] : [paso[0] - 0.5, paso[1]]
      const d = distKm(paso, hacia), f = d > 1 ? Math.min(1, 35 / d) : 0
      const id = `AAL DEOP ${a.n}`, k = `${f0.id}|${id}`
      const p = pos[k] ? { lng: pos[k][0], lat: pos[k][1] } : { lng: paso[0] + (hacia[0] - paso[0]) * f, lat: paso[1] + (hacia[1] - paso[1]) * f }
      aal.push({ id, tipo: 'SA', bando: 'rojo', nombre: `Área de apoyo logístico (enemiga) DEOP ${a.n}`, lugar: o?.nombre || '', lng: r5(p.lng), lat: r5(p.lat), cap: capDe(id, 'SA'), de: 'BL rojo',
        apoya: (a.enemigas || []).map((u) => u.designacion), tMax: Math.round(((a.enemigas || []).reduce((s, u) => s + (EFECTIVOS[u.escalon] || 3500) * kgHombreDia(u.arma, clases).total, 0) / 1000) * NIVEL_DIAS.SA) })
    }
    if (aal.length) {
      const atras = origenes.slice().sort((x, y) => Math.min(...pasos.map((q) => distKm(q, [y.lng, y.lat]))) - Math.min(...pasos.map((q) => distKm(q, [x.lng, x.lat]))))[0]
      const p = pos['BL rojo'] ? { lng: pos['BL rojo'][0], lat: pos['BL rojo'][1] } : atras ? { lng: atras.lng, lat: atras.lat } : { lng: aal[0].lng - 1, lat: aal[0].lat }
      rojo = { bl: { id: 'BL rojo', tipo: 'BL', bando: 'rojo', nombre: `Base logística (enemiga) ${atras?.nombre || ''}`.trim(), lugar: atras?.nombre || '', lng: r5(p.lng), lat: r5(p.lat), cap: CAPACIDAD.BL, de: null, tMax: Math.round(aal.reduce((s, x) => s + x.tMax, 0) * 4) }, aal }
      for (const x of aal) x.km = Math.round(camino([x.lng, x.lat], [rojo.bl.lng, rojo.bl.lat]))
    }
  }

  // 12) Avisos que el G-4 tiene que ver.
  for (const f of fases) {
    for (const x of f.flujo) if (x.estado === 'insuficiente') avisos.push(`${f.id}: ${porId.get(x.id)?.nombre || x.id} no alcanza (${x.pct} % de su transporte): reforzarla con Cías de transporte, acercarla o abrir una Sección Especial.`)
    for (const g of f.gu) if (!g.dentroDma) avisos.push(`${f.id}: ${g.designacion} queda a ${g.km} km de su apoyo (${porId.get(g.apoyo)?.nombre || '—'}), más que la DMA de ${dmaGu} km: desplazar la SA.`)
  }
  if (emergencia) avisos.push(`Reemplazos: en la ${emergencia.fase} se acaba la reserva del BR (${miles(reserva)}). Elevar un PEDIDO DE EMERGENCIA a la ZI hacia el ${fmtDia(emergencia.pedirEn)} por ${miles(emergencia.hombres)} hombres (llegan en ${REEMPLAZOS.emergenciaDias} días).`)

  const plan = { version: VERSION, dmaGu, dmaSec, umbralSE, bl: BL, sb: SB, se: SEs, sa: SAs, br: BR, hosp, instalaciones: I, porId, fases, gus: [...gus.values()], efTotal, kgPromedio: redondeo(kgPromedio, 1),
    nivelesClase, rojo, avisos: [...new Set(avisos)], ep: cap.ep }
  plan.concepto = concepto(plan, cap)
  return plan
}
function kmEntre(x, y, posF) {
  const a = posF[x.id] || x, b = posF[y.id] || y
  if (y.epa && !posF[y.id]?.desplaza && !posF[y.id]?.movida) return y.epa.km
  return Math.round(distKm([a.lng, a.lat], [b.lng, b.lat]) * 1.3)
}

// ── EL CONCEPTO DE APOYO LOGÍSTICO (párrafo IV, «apoyo por fases») ──
function concepto(p, cap) {
  const sa = (s) => `${s.apoya[0]} en ${p.fases[0].pos[s.id]?.lugar || s.lugar || 'su zona'}`
  const ep = cap?.ep != null ? (cap.fases[0].acciones.find((a) => a.deop === cap.ep)?.designacion || null) : null
  const general = [
    `La FF.TT.T.O. se apoya en la ${p.bl.nombre} (${p.bl.fuente}). El CL FF.TT.T.O. organiza la Zona de Etapas con la ${p.sb.nombre}` +
      ` (a ${miles(p.sb.km)} km de la BL por ${p.sb.ferro ? 'ferrocarril y carretera' : 'carretera'})` +
      (p.se.length ? `, ${p.se.map((s) => `la ${s.nombre} (${s.ferro ? 'ferrocarril' : 'carretera'}, ${miles(s.km)} km) que apoya a las SA de ${lista(s.apoya)}`).join(' y ')}` : '') +
      ` y ${p.sa.length === 1 ? 'una Sección Avanzada' : `${p.sa.length} Secciones Avanzadas, una por cada CE`}: ${lista(p.sa.map(sa))}.`,
    `Distancia máxima de apoyo: ${p.dmaGu} km entre cada GU y su apoyo y ${p.dmaSec} km entre secciones ((10 h − 2 h) × velocidad ÷ 2). Niveles: ${p.nivelesClase.filter((c) => ['I', 'III', 'V'].includes(c.id)).map((c) => `Cl. ${c.id} ${c.operativo}+${c.seguridad} días`).join(', ')}; consumo de referencia ${p.kgPromedio} kg por hombre y día (${miles(p.efTotal)} hombres).`,
    `Prioridad del apoyo: ${ep ? `${ep}, que enfrenta al esfuerzo principal enemigo (DEOP ${cap.ep})` : 'la GU que enfrente al esfuerzo principal enemigo'}; después, la reserva que contraataca.`,
    `Reemplazos: el ${p.br.nombre} (${p.br.cias} Cías, procesa unos ${miles(p.br.procesa)} hombres por día) junto a la terminal de entrada; reserva inicial ${miles(p.br.reserva)} hombres; nivel de reemplazos a pedir a la ZI cada 30 días: ${miles(p.br.nivelMensual)}. Los heridos que se recuperan en menos de 15 días (nivel de evacuación) vuelven al servicio por el BR. Prioridad de reemplazos: la que fije el G-3.`,
  ]
  const porFase = p.fases.map((f) => {
    const desp = p.sa.filter((s) => f.pos[s.id]?.desplaza).map((s) => `la SA ${s.apoya[0]} se desplaza a ${f.pos[s.id].lugar || 'su nueva zona'}`)
    const malas = f.flujo.filter((x) => x.estado !== 'ok').map((x) => `${p.porId.get(x.id)?.nombre.split(' – ')[0] || x.id} al ${x.pct} %`)
    const fuera = f.gu.filter((g) => !g.dentroDma).map((g) => g.designacion)
    return `${f.id} (${f.ventana || fmtDia(f.de)}) ${f.nombre}: ${miles(f.tDia)} t por día` +
      (desp.length ? `; ${lista(desp)}` : '; las SA mantienen su posición') +
      (malas.length ? `; transporte exigido: ${malas.join(', ')}` : '') +
      (fuera.length ? `; fuera de la DMA: ${lista(fuera)}` : '') +
      `. Bajas estimadas ${miles(f.personal.bajas)} (${miles(f.personal.muertos)} muertos, ${miles(f.personal.heridos)} heridos, ${miles(f.personal.desaparecidos)} desaparecidos); vuelven ${miles(f.personal.recuperan)}; reemplazos necesarios ${miles(f.personal.reemplazos)}.`
  })
  return { general, porFase }
}

// ── al Juego de Guerra: las instalaciones como FICHAS y los datos de cada GU ──
// Las instalaciones se nombran por su designación: el motor encadena el abastecimiento por el campo «de».
export function paraJuego(plan) {
  if (!plan) return null
  const f0 = plan.fases[0]
  const ESC = { BL: 'division', SB: 'brigada', SE: 'brigada', SA: 'brigada', BR: 'batallon' }
  const des = new Map(plan.instalaciones.map((x) => [x.id, designacion(x)]))
  const inst = plan.instalaciones.map((x) => {
    const p = f0.pos[x.id] || x
    const o = { bando: 'azul', designacion: des.get(x.id), tipo: x.tipo, escalon: ESC[x.tipo] || 'brigada', lugar: x.lugar || '', lng: r5(p.lng), lat: r5(p.lat), de: x.de ? des.get(x.de) : null }
    if (x.tipo === 'BR') return { ...o, hombres: x.reserva, procesa: x.procesa, cias: x.cias, emergencia: REEMPLAZOS.emergenciaHombres, emergenciaDias: REEMPLAZOS.emergenciaDias }
    return { ...o, cap: x.cap, t: x.tMax, max: x.tMax, ferro: !!x.ferro, apoya: x.apoya || [] }
  })
  if (plan.rojo) {
    inst.push({ bando: 'rojo', designacion: plan.rojo.bl.nombre, tipo: 'BL', escalon: 'division', lugar: plan.rojo.bl.lugar, lng: plan.rojo.bl.lng, lat: plan.rojo.bl.lat, de: null, cap: plan.rojo.bl.cap, t: plan.rojo.bl.tMax, max: plan.rojo.bl.tMax, apoya: [] })
    for (const x of plan.rojo.aal) inst.push({ bando: 'rojo', designacion: x.nombre, tipo: 'SA', escalon: 'brigada', lugar: x.lugar, lng: x.lng, lat: x.lat, de: plan.rojo.bl.nombre, cap: x.cap, t: x.tMax, max: x.tMax, apoya: x.apoya })
  }
  return {
    formato: 'sideceme/logistica-teatro', version: 1,
    comoLeerlo: 'Cada instalación es una ficha: «de» es quién la abastece (por su designación), «t» lo que tiene y «max» su nivel máximo, en toneladas; «cap» las toneladas por día que mueve a la DMA. Cada GU consume por día efectivos × kg ÷ 1000 (más en combate). El Batallón de Reemplazos tiene «hombres» y procesa «procesa» por día.',
    ref: { dmaGuKm: plan.dmaGu, dmaSeccionesKm: plan.dmaSec, factorCamino: 1.3, bajas: BAJAS, reemplazos: REEMPLAZOS, nivelGuDias: NIVEL_DIAS.GU },
    instalaciones: inst,
    gu: Object.fromEntries(plan.gus.map((g) => [g.designacion, { ef: g.ef, kg: g.kg }])),
    fases: plan.fases.map((f) => ({ id: f.id, de: f.de, a: f.a, pos: Object.fromEntries(Object.entries(f.pos).filter(([, p]) => p.desplaza || p.movida).map(([id, p]) => [des.get(id), [p.lng, p.lat]])) })),
  }
}
export function designacion(x) {
  if (x.tipo === 'BL') return `BL ${x.lugar}`.trim()
  if (x.tipo === 'SB') return `CLSB ${x.lugar}`.trim()
  if (x.tipo === 'SE') return `CLSE ${x.lugar}`.trim()
  if (x.tipo === 'SA') return `CLSA ${x.apoya?.[0] || x.lugar}`.trim()
  if (x.tipo === 'BR') return `B. Reemp. ${x.lugar}`.trim()
  return x.nombre
}

// ── KML del calco de apoyo logístico (Google Earth): instalaciones y EPA de cada fase ──
const xe = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
export function kmlLogistica(plan, ejercicio = '') {
  if (!plan) return ''
  const pm = (nom, desc, estilo, p) => `<Placemark><name>${xe(nom)}</name><description>${xe(desc)}</description><styleUrl>#${estilo}</styleUrl><Point><coordinates>${p.lng},${p.lat},0</coordinates></Point></Placemark>`
  const ln = (nom, estilo, coords) => `<Placemark><name>${xe(nom)}</name><styleUrl>#${estilo}</styleUrl><LineString><tessellate>1</tessellate><coordinates>${coords.map((c) => `${c[0]},${c[1]},0`).join(' ')}</coordinates></LineString></Placemark>`
  const carpetas = plan.fases.map((f) => {
    const pts = plan.instalaciones.map((x) => pm(designacion(x), `${x.nombre}${x.cap ? ` · ${miles(x.cap)} t/día` : ''}${x.tipo === 'BR' ? ` · ${x.cias} Cías` : ''}`, `l${x.tipo}`, f.pos[x.id] || x))
    const lineas = plan.instalaciones.filter((x) => x.de).map((x) => {
      const a = f.pos[x.de] || plan.porId.get(x.de), b = f.pos[x.id] || x
      return ln(`EPA ${designacion(plan.porId.get(x.de))} → ${designacion(x)}`, x.ferro ? 'lFerro' : 'lEpa', !f.pos[x.id]?.desplaza && x.epa ? x.epa.coords : [[a.lng, a.lat], [b.lng, b.lat]])
    })
    const rojo = plan.rojo ? [pm(plan.rojo.bl.nombre, 'Logística probable del enemigo', 'lRojo', plan.rojo.bl), ...plan.rojo.aal.map((x) => pm(x.nombre, `Apoya a ${x.apoya.join(', ')}`, 'lRojo', x))] : []
    return `<Folder><name>${xe(`🚚 Apoyo logístico ${f.id} · ${f.nombre}`)}</name>${pts.join('')}${lineas.join('')}${rojo.join('')}</Folder>`
  })
  const est = Object.entries(COLOR_TIPO).map(([k, c]) => `<Style id="l${k}"><IconStyle><color>ff${c.slice(5, 7)}${c.slice(3, 5)}${c.slice(1, 3)}</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/square.png</href></Icon></IconStyle></Style>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xe(`Calco de apoyo logístico · ${ejercicio}`)}</name>${est}` +
    '<Style id="lEpa"><LineStyle><color>ff2e7d32</color><width>3</width></LineStyle></Style><Style id="lFerro"><LineStyle><color>ff000000</color><width>4</width></LineStyle></Style>' +
    '<Style id="lRojo"><IconStyle><color>ff2828c6</color><Icon><href>http://maps.google.com/mapfiles/kml/shapes/triangle.png</href></Icon></IconStyle></Style>' +
    carpetas.join('') + '</Document></kml>'
}

// ── el texto para el Word del PICB (concepto, niveles, instalaciones, fases, reemplazos) ──
export function textoLogistica(plan) {
  if (!plan) return ''
  const e = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
  const tabla = (cab, filas) => `<table border="1" cellspacing="0" cellpadding="3" style="border-collapse:collapse;font-size:9pt"><tr>${cab.map((c) => `<th>${e(c)}</th>`).join('')}</tr>${filas.map((f) => `<tr>${f.map((c) => `<td>${e(c)}</td>`).join('')}</tr>`).join('')}</table>`
  return `<h3>APOYO LOGÍSTICO Y DE PERSONAL DE LAS FF.TT.T.O. (concepto por fases)</h3>` +
    plan.concepto.general.map((t) => `<p>${e(t)}</p>`).join('') +
    `<p><b>Por fases:</b></p>` + plan.concepto.porFase.map((t) => `<p>${e(t)}</p>`).join('') +
    `<p><b>Instalaciones (calco de apoyo logístico):</b></p>` +
    tabla(['Instalación', 'Lugar', 'Abastecida por', 'Km por camino', 'Medio', 'Transporte t/día', 'Nivel'], plan.instalaciones.map((x) => [x.nombre, x.lugar, x.de ? plan.porId.get(x.de)?.nombre : (x.tipo === 'BL' ? 'Zona del Interior' : '—'), x.km ?? '—', x.ferro ? 'ferrocarril' : x.de ? 'carretera' : '—', x.cap ? miles(x.cap) : '—', x.tipo === 'BR' ? `${x.cias} Cías · reserva ${miles(x.reserva)}` : x.nivelDias ? `${x.nivelDias} días · ${miles(x.tMax)} t` : '—'])) +
    `<p><b>Niveles de abastecimiento (Anexo E) para ${miles(plan.efTotal)} hombres:</b></p>` +
    tabla(['Clase', 'Nivel operativo (días)', 'Seguridad', 'Máximo', 'kg/h/día', 't/día', 't nivel máximo'], plan.nivelesClase.map((c) => [`${c.id} · ${c.nombre}`, c.operativo, c.seguridad, c.maximo, c.kg, miles(c.tDia), miles(c.tMax)])) +
    `<p><b>Personal y reemplazos por fase (tablas de bajas de referencia):</b></p>` +
    tabla(['Fase', 'Bajas', 'Muertos', 'Heridos', 'Desaparecidos', 'Vuelven (<15 días)', 'Reemplazos'], plan.fases.map((f) => [f.id, miles(f.personal.bajas), miles(f.personal.muertos), miles(f.personal.heridos), miles(f.personal.desaparecidos), miles(f.personal.recuperan), miles(f.personal.reemplazos)])) +
    (plan.avisos.length ? `<p><b>Puntos a resolver:</b></p>${plan.avisos.map((t) => `<p>• ${e(t)}</p>`).join('')}` : '')
}
