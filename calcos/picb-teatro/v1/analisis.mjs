// 🌎 PICB del Teatro — el análisis: DEOP medidas sobre la red vial, tiempos D+n, nudos y pasos
// (terreno decisivo), A.I.N. operacionales, poder relativo por DEOP, CAE más probable y más
// peligroso, el texto para la Apreciación de Inteligencia y el KML para Google Earth.
// Sin DOM: se prueba en Node. «La máquina propone, el G-2 dispone»: todo lo que sale de acá es
// una propuesta que el G-2 corrige en el panel.
import {
  distKm, largoKm, masCercanoEnLinea, enPoligono, cajaDe, redondeo, fmtKm, fmtKm2, fmtDia, sinTildes,
  poblacionMasCercana, CLASE_VIA, RANGO_POBLACION, NOM_ESCALON, areaKm2,
} from './modelo.mjs'
import { ruta, mejorClase } from './red.mjs'

// Ritmo de avance EN CONTACTO por arma (km/día). REFERENCIA a validar con las tablas de la Escuela.
export const RITMO_KM_DIA = { blindada: 30, mecanizada: 25, cabmec: 28, motorizada: 20, caballeria: 20, infanteria: 10, andina: 10, aerotransportada: 15 }
export const NOM_ARMA = { blindada: 'Acorazada', mecanizada: 'Mecanizada', cabmec: 'Caballería mecanizada', motorizada: 'Motorizada', caballeria: 'Caballería', infanteria: 'Infantería', andina: 'Andina', aerotransportada: 'FF.EE. / paracaidista', aviacion: 'Aviación', artilleria: 'Artillería', ingenieria: 'Ingeniería', logistica: 'Logística' }
// Magnitud de corredor que sostiene la mejor vía del eje (la tabla de la app: corredoresVias.js),
// subida un escalón a nivel teatro porque el altiplano abierto deja desplegar a los costados.
export const MAGNITUD_POR_CLASE = { 1: 'División (XX)', 2: 'Brigada (X)', 3: 'Brigada (X) con limitaciones', 4: 'Regimiento (III)', 0: 'Regimiento (III) campo traviesa' }
export const COLOR_DEOP = ['#e74c3c', '#2489db', '#19b978', '#ffa51f', '#b36ae2', '#e84393']

const enChile = (p) => /\(\s*CHILE\s*\)|\(\s*PERU\s*\)|\(\s*ARGENTINA\s*\)/i.test(sinTildes(p.nombre))

// ── cada DEOP sobre la red vial ─────────────────────────────────────────────────────────
// Las unidades enemigas que la recorren: las que la nombran en su descripción del KMZ o, si
// ninguna, la brigada más cercana a su punto de inicio (≤ 80 km).
export function unidadesDeDeop(d, unidades) {
  let enemigas = unidades.enemigas.filter((u) => u.deop === d.n && u.rol !== 'comando' && u.rol !== 'reserva')
  const inicio = [d.puntos[0].lng, d.puntos[0].lat]
  if (!enemigas.length) {
    const cand = unidades.enemigas.filter((u) => u.deop == null && !['reserva', 'apoyo', 'comando'].includes(u.rol) && ['brigada', 'division'].includes(u.escalon))
      .map((u) => ({ u, d: distKm(inicio, [u.lng, u.lat]) })).filter((x) => x.d <= 80).sort((a, b) => a.d - b.d)
    if (cand.length) enemigas = [cand[0].u]
  }
  let propias = unidades.propias.filter((u) => u.deop === d.n && u.escalon !== 'ejercito')
  if (!propias.length) {
    const cand = unidades.propias.filter((u) => u.deop == null && u.rol !== 'reserva' && ['cuerpo', 'division', 'brigada'].includes(u.escalon))
      .map((u) => ({ u, d: masCercanoEnLinea([u.lng, u.lat], d.linea).d })).filter((x) => x.d <= 120).sort((a, b) => a.d - b.d)
    if (cand.length) propias = [cand[0].u]
  }
  return { enemigas, propias }
}
export function ritmoDe(enemigas, porDefecto = 20) {
  const r = enemigas.map((u) => RITMO_KM_DIA[u.arma]).filter(Boolean)
  return r.length ? Math.min(...r) : porDefecto
}

export function analizarDeop(d, red, unidades, { ritmo = null } = {}) {
  const asignadas = unidadesDeDeop(d, unidades)
  const v = Number(ritmo) > 0 ? Number(ritmo) : ritmoDe(asignadas.enemigas)
  const tramos = []
  let acum = 0
  const puntos = [{ ...d.puntos[0], km: 0, dia: 0 }]
  const porClase = {}
  for (let i = 1; i < d.puntos.length; i++) {
    const a = d.puntos[i - 1], b = d.puntos[i]
    const r = red ? ruta(red, [a.lng, a.lat], [b.lng, b.lat]) : { km: distKm([a.lng, a.lat], [b.lng, b.lat]), coords: [[a.lng, a.lat], [b.lng, b.lat]], porClase: { 0: distKm([a.lng, a.lat], [b.lng, b.lat]) }, porRed: false, motivo: 'sin red vial' }
    acum += r.km
    for (const [cl, km] of Object.entries(r.porClase)) porClase[cl] = (porClase[cl] || 0) + km
    tramos.push({ de: a.nombre, a: b.nombre, km: r.km, coords: r.coords, porRed: r.porRed, motivo: r.motivo, clase: mejorClase(r.porClase) })
    puntos.push({ ...b, km: acum, dia: acum / v })
  }
  const cl = mejorClase(porClase)
  const ruta1 = tramos.flatMap((t, i) => (i ? t.coords.slice(1) : t.coords))
  const anchoKm = d.corredor ? anchoMedioKm(d.corredor, d.linea) : null
  return {
    n: d.n, nombre: d.nombre, kmRuta: acum, kmRecta: largoKm(d.linea), ritmo: v, dias: acum / v, puntos, tramos, porClase,
    mejorClase: cl, via: CLASE_VIA[cl] || 'campo traviesa', magnitud: MAGNITUD_POR_CLASE[cl] || MAGNITUD_POR_CLASE[0],
    anchoKm, coords: ruta1, enemigas: asignadas.enemigas, propias: asignadas.propias,
  }
}
// Ancho medio de un corredor: su área dividida por el largo de su eje.
function anchoMedioKm(corredor, linea) {
  const largo = largoKm(linea)
  return largo > 0 ? areaKm2(corredor) / largo : null
}

// ── terreno decisivo: nudos de comunicaciones y pasos ───────────────────────────────────
// Nudo = población principal donde se juntan 3 o más vías troncales/primarias/secundarias, o un
// empalme ferroviario. Se ordenan por la cantidad y la clase de las vías que se juntan.
export function nudos(red, base, anillo, { max = 14 } = {}) {
  if (!red) return []
  const puntaje = new Map()
  for (let i = 0; i < red.coords.length; i++) {
    const salidas = red.ady[i].filter(([, , , v]) => red.vias[v][0] <= 3)
    if (salidas.length < 3) continue
    const p = red.coords[i]
    if (anillo && !enPoligono(p, anillo)) continue
    const pob = poblacionMasCercana(base, p, 6, 3)
    if (!pob) continue
    const pts = salidas.reduce((s, [, , , v]) => s + (5 - red.vias[v][0]), 0)
    const k = pob.nombre
    const x = puntaje.get(k)
    if (!x || pts > x.puntos) puntaje.set(k, { nombre: pob.nombre, lng: pob.lng, lat: pob.lat, puntos: pts, rango: pob.rango, salidas: salidas.length })
  }
  const lista = [...puntaje.values()].sort((a, b) => a.rango - b.rango || b.puntos - a.puntos)
  const elegidos = []
  for (const x of lista) if (!elegidos.some((y) => distKm([x.lng, x.lat], [y.lng, y.lat]) < 18)) elegidos.push(x)
  return elegidos.sort((a, b) => b.puntos - a.puntos || a.rango - b.rango).slice(0, max)
    .map((x) => ({ ...x, tipo: 'nudo', porque: `nudo de comunicaciones (${x.salidas} vías se juntan)` }))
}
export function pasosDelArea(base, anillo) {
  return (base?.pasos || []).filter((p) => !anillo || enPoligono([p[2], p[3]], anillo))
    .map((p) => ({ nombre: p[0], tipo: p[1], lng: p[2], lat: p[3], ele: p[4] || null }))
}

// ── A.I.N. operacionales ────────────────────────────────────────────────────────────────
// En cada DEOP: el paso de origen (los dos primeros puntos si están a menos de 15 km, uno de cada
// lado), cada objetivo intermedio (OEM) y el destino (OEN). Las DEOP que comparten un lugar
// comparten la A.I.N.
export function ainsDelTeatro(analisis) {
  const ains = []
  const buscar = (p) => ains.find((a) => distKm([a.lng, a.lat], [p.lng, p.lat]) <= 12)
  for (const a of analisis) {
    const u = a.enemigas.map((x) => x.designacion).join(' y ') || 'el enemigo'
    const pts = a.puntos
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      let nombre = p.nombre.replace(/\s*\((Chile|Bolivia|Per[uú]|Argentina)\)\s*/gi, '').trim()
      let tipo = i === 0 ? 'paso' : p.rol === 'destino' ? 'oen' : 'oem'
      if (i === 0 && pts[1] && distKm([p.lng, p.lat], [pts[1].lng, pts[1].lat]) <= 15) {
        nombre = `${nombre} – ${pts[1].nombre.replace(/\s*\((Chile|Bolivia|Per[uú]|Argentina)\)\s*/gi, '').trim()}`
        i++
      } else if (i === 0 && enChile(p)) continue
      const q = pts[i]
      const dia = q.dia
      const ya = buscar(q)
      if (ya) { if (!ya.deop.includes(a.n)) { ya.deop.push(a.n); ya.confirma += ` · DEOP ${a.n}` } continue }
      const indicador = tipo === 'paso'
        ? `Columnas de ${u} cruzando el paso; reconocimiento adelantado e ingenieros de franqueo`
        : tipo === 'oen'
          ? `Fuerzas de ${u} en las afueras de ${nombre}; fuegos y aviación sobre la ciudad`
          : `Vanguardia de ${u} en ${nombre}; ingenieros en puentes y movimiento logístico por la ruta`
      ains.push({
        id: '', nombre, lng: q.lng, lat: q.lat, tipo, deop: [a.n], dia, net: Math.max(0, dia * 0.75), nlt: dia * 1.25 + (tipo === 'paso' ? 0.5 : 0),
        indicador, confirma: `Confirma el CAE por la DEOP ${a.n}`,
      })
    }
  }
  ains.sort((x, y) => x.dia - y.dia || x.deop[0] - y.deop[0])
  ains.forEach((a, i) => { a.id = `AIN-${i + 1}` })
  return ains
}

// ── poder relativo por DEOP ─────────────────────────────────────────────────────────────
export function prcPorDeop(analisis, ajustes = {}) {
  const poder = (u) => Number(ajustes[u.designacion]) > 0 ? Number(ajustes[u.designacion]) : u.poder
  return analisis.map((a) => {
    const e = a.enemigas.reduce((s, u) => s + poder(u), 0), p = a.propias.reduce((s, u) => s + poder(u), 0)
    return { n: a.n, nombre: a.nombre, enemigas: a.enemigas, propias: a.propias, poderE: e, poderP: p, relacion: p > 0 ? e / p : e > 0 ? Infinity : 0 }
  })
}
export const fmtRelacion = (r) => (!Number.isFinite(r) ? 'sin oposición' : r >= 1 ? `${redondeo(r, 1).toLocaleString('es-BO')} : 1` : `1 : ${redondeo(1 / r, 1).toLocaleString('es-BO')}`)

// ── CAE operacionales (propuesta) ───────────────────────────────────────────────────────
// Más probable: la DEOP con más poder enemigo relativo; si el G-2 escribió el objetivo estratégico
// (p. ej. «Salar de Uyuni»), pesa la DEOP que pasa por él. Más peligroso: la DEOP que llega antes
// al Puesto de Comando de las FF.TT.T.O. (o a la ficha XXXX) y le corta la ruta principal.
export function caeOperacionales(analisis, prc, unidades, base, { objetivo = '' } = {}) {
  if (!analisis.length) return null
  const obj = sinTildes(objetivo).toUpperCase().trim()
  const lugarObj = obj ? buscarLugar(base, obj) : null
  const limpio = (t) => sinTildes(String(t).replace(/\s*\((Chile|Bolivia|Per[uú]|Argentina)\)\s*/gi, '')).toUpperCase().trim()
  const puntos = analisis.map((a) => {
    const r = prc.find((x) => x.n === a.n)
    let s = Math.min(Number.isFinite(r?.relacion) ? r.relacion : 5, 5)
    // El objetivo nombra un punto de su itinerario («Uyuni» en «Salar de Uyuni»): esa DEOP va a él.
    const nombra = obj && a.puntos.slice(1).some((p) => { const n = limpio(p.nombre); return n.length >= 4 && obj.includes(n) })
    if (nombra) s += 4
    if (lugarObj) { const d = masCercanoEnLinea(lugarObj.p, a.coords).d; if (d <= 40) s += 2; else if (d <= 90) s += 0.5 }
    return { a, s, r, nombra }
  }).sort((x, y) => y.s - x.s)
  const probable = puntos[0]
  const cg = unidades.propias.find((u) => u.escalon === 'ejercito') || null
  let peligroso = null
  if (cg) {
    const c = analisis.map((a) => {
      const m = masCercanoEnLinea([cg.lng, cg.lat], a.coords)
      // el día en que la DEOP pasa más cerca del CG: lo recorrido hasta ese tramo, a su ritmo
      const kmHasta = largoKm(a.coords.slice(0, m.i + 1))
      return { a, d: m.d, dia: kmHasta / a.ritmo }
    })
    const cerca = c.filter((y) => y.d <= 40).sort((p, q) => p.dia - q.dia)
    peligroso = cerca[0] || c.sort((p, q) => p.d - q.d)[0]
  } else peligroso = { a: [...analisis].sort((p, q) => p.dias - q.dias)[0], d: null, dia: null }
  const reserva = unidades.enemigas.filter((u) => u.rol === 'reserva')
  const resTxt = reserva.length ? ` y comprometería su reserva (${reserva.map((u) => u.designacion).join(', ')})` : ''
  const todas = analisis.map((a) => `DEOP ${a.n}`).join(', ')
  const pa = probable.a
  const textoProbable = `Ataque simultáneo por las ${analisis.length} DEOP (${todas}) con el ESFUERZO PRINCIPAL en la DEOP ${pa.n}` +
    ` (${pa.nombre.replace(/^DEOP \d+\s*·?\s*/, '')}) con ${pa.enemigas.map((u) => u.designacion).join(' y ') || 'su primer escalón'}${resTxt}` +
    `, para alcanzar ${pa.puntos[pa.puntos.length - 1].nombre} hacia ${fmtDia(pa.dias)}` +
    (probable.nombra ? `; su itinerario lleva al objetivo estratégico declarado (${objetivo.trim()}).` : lugarObj ? `; su eje pasa cerca de ${lugarObj.nombre}, objetivo estratégico declarado.` : '.') +
    (probable.r ? ` Relación de poder en esa DEOP: ${fmtRelacion(probable.r.relacion)} (referencia).` : '')
  const pe = peligroso.a
  const textoPeligroso = `Concentrar el esfuerzo en la DEOP ${pe.n} (${pe.nombre.replace(/^DEOP \d+\s*·?\s*/, '')})` +
    (cg && peligroso.d != null && peligroso.d <= 40
      ? `, que pasa a ${Math.round(peligroso.d)} km del Puesto de Comando de las ${cg.designacion} (${cg.lugar || 'su CG'}) hacia ${fmtDia(peligroso.dia)}: cortaría la ruta principal del teatro y desarticularía el mando`
      : `, la que llega antes a su objetivo (${fmtDia(pe.dias)})`) +
    `${resTxt}. Obliga a mantener la reserva de las FF.TT.T.O. en condiciones de intervenir en esa DEOP.`
  return { probable: { n: pa.n, texto: textoProbable }, peligroso: { n: pe.n, texto: textoPeligroso }, objetivo: lugarObj }
}
function buscarLugar(base, obj) {
  for (const s of [...(base?.salares || []), ...(base?.lagos || [])]) if (sinTildes(s[0]).toUpperCase().includes(obj) || obj.includes(sinTildes(s[0]).toUpperCase())) { const c = cajaDe(s[1]); return { nombre: s[0], p: [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2] } }
  for (const p of base?.poblaciones || []) if (sinTildes(p[0]).toUpperCase() === obj || obj.includes(sinTildes(p[0]).toUpperCase())) return { nombre: p[0], p: [p[2], p[3]] }
  return null
}

// ── resumen de los efectos del teatro (paso 2) ──────────────────────────────────────────
export function resumenEfectos(capas, red, anillo) {
  const kmPor = {}
  for (const v of capas?.vias || []) {
    const c = v[3]
    let km = 0
    for (let i = 1; i < c.length; i++) if (!anillo || enPoligono(c[i], anillo)) km += distKm(c[i - 1], c[i])
    kmPor[v[0]] = (kmPor[v[0]] || 0) + km
  }
  const ffcc = (capas?.ffcc || []).filter((f) => f[0] === 'activo')
  const kmFfcc = ffcc.reduce((s, f) => s + largoKm(f[2]), 0)
  const ciudades = (capas?.poblaciones || []).filter((p) => p[1] <= 2).sort((a, b) => a[1] - b[1] || (b[4] || 0) - (a[4] || 0))
  const salares = (capas?.salares || []).map((s) => ({ nombre: s[0], km2: s[1].reduce((t, r) => t + areaKm2(r[0] || r), 0) }))
  const lagos = (capas?.lagos || []).map((s) => ({ nombre: s[0], km2: s[1].reduce((t, r) => t + areaKm2(r[0] || r), 0) }))
  // El relieve viene en dos capas: «restringido o más» (1) y «severo» (2), una encima de la otra.
  // Sólo cuenta lo que cae dentro del Área de Interés (se mide por el centro de cada polígono).
  const sup = (c) => (capas?.relieve || []).filter((r) => r[0] === c)
    .reduce((t, r) => t + r[1].reduce((u, pol) => { const k = cajaDe(pol[0]); const m = [(k[0] + k[2]) / 2, (k[1] + k[3]) / 2]; return u + (!anillo || enPoligono(m, anillo) ? areaKm2(pol[0]) - pol.slice(1).reduce((h, r2) => h + areaKm2(r2), 0) : 0) }, 0), 0)
  const severoKm2 = sup(2)
  const restrKm2 = Math.max(0, sup(1) - severoKm2)
  return { kmPor, kmFfcc, nFfcc: ffcc.length, ciudades, salares, lagos, severoKm2, restrKm2, aerodromos: capas?.aerodromos || [], pasos: capas?.pasos || [], regiones: capas?.regiones || [] }
}

// ── el texto para la Apreciación de Inteligencia ────────────────────────────────────────
const e = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
export function textoApreciacion({ ejercicio = '', resumen, efectos, analisis = [], nudos: nds = [], ains = [], prc = [], cae = null, unidades = { enemigas: [], propias: [] }, notas = {} }) {
  const L = []
  const p = (t, nivel = 0) => L.push(`<p style="margin:3px 0 3px ${nivel * 24}px">${t}</p>`)
  L.push(`<h3 style="margin:0 0 6px">PICB A NIVEL FF.TT.T.O. — ${e(ejercicio)}</h3>`)
  p('<b>II.- CARACTERÍSTICAS DEL ÁREA DE OPERACIONES (escala 1:1.000.000).</b>')
  p('<b>A.- Delimitación.</b>', 1)
  if (resumen) p(`Teatro de Operaciones de ${fmtKm2(resumen.km2)} (${Math.round(resumen.anchoKm)} × ${Math.round(resumen.altoKm)} km)` +
    (resumen.subteatros.length ? `, en ${resumen.subteatros.length} subteatros: ${resumen.subteatros.map((s) => `${e(s.nombre)} (${fmtKm2(s.km2)})`).join(', ')}` : '') +
    (resumen.aos.length ? `. Áreas de operaciones de los CE: ${resumen.aos.map((s) => e(s.nombre)).join(', ')}` : '') + '.', 2)
  if (notas.paso1) p(e(notas.paso1), 2)
  p('<b>B.- Terreno.</b>', 1)
  if (efectos) {
    const kp = efectos.kmPor
    p(`<b>1.- Comunicaciones.</b> ${fmtKm(kp[1] || 0)} de vías troncales, ${fmtKm(kp[2] || 0)} de primarias y ${fmtKm(kp[3] || 0)} de secundarias dentro del Área de Interés; ${efectos.nFfcc ? `${fmtKm(efectos.kmFfcc)} de ferrocarril en servicio` : 'sin ferrocarril en servicio'}; ${efectos.aerodromos.length} aeródromos principales; pasos fronterizos: ${efectos.pasos.map((x) => e(x[0])).join(', ') || '—'}.`, 2)
    p(`<b>2.- Poblaciones.</b> ${efectos.ciudades.map((c) => `${e(c[0])} (${RANGO_POBLACION[c[1]].toLowerCase()})`).join(', ') || '—'}.`, 2)
    p(`<b>3.- Grandes obstáculos.</b> ${[...efectos.salares.map((s) => `${e(s.nombre)} (${fmtKm2(s.km2)})`), ...efectos.lagos.filter((l) => l.km2 > 50).map((s) => `${e(s.nombre)} (${fmtKm2(s.km2)})`)].join(', ') || '—'}; terreno severamente restringido por relieve: ${fmtKm2(efectos.severoKm2)}; restringido: ${fmtKm2(efectos.restrKm2)}.`, 2)
  }
  if (nds.length) p(`<b>4.- Terreno decisivo (nivel operacional).</b> ${nds.map((n) => `${e(n.nombre)} (${n.porque})`).join('; ')}.`, 2)
  if (analisis.length) {
    p('<b>5.- Direcciones estratégicas operativas (avenidas de aproximación a nivel teatro).</b>', 2)
    for (const a of analisis) p(`<b>${e(a.nombre)}:</b> ${fmtKm(a.kmRuta)} por la red vial (${fmtKm(a.kmRecta)} en línea recta); mejor vía: ${e(a.via)}; admite ${e(a.magnitud)}${a.anchoKm ? `; corredor de ${Math.round(a.anchoKm)} km de ancho medio` : ''}. Itinerario: ${a.puntos.map((x) => `${e(x.nombre)} ${fmtDia(x.dia)}`).join(' → ')} (a ${a.ritmo} km/día).`, 3)
  }
  if (notas.paso2) p(e(notas.paso2), 2)
  p('<b>III.- SITUACIÓN DEL ENEMIGO (GG.UU.).</b>')
  for (const u of unidades.enemigas) p(`${e(u.designacion)} — ${NOM_ESCALON[u.escalon] || u.escalon}, ${NOM_ARMA[u.arma] || u.arma}${u.lugar ? `, en ${e(u.lugar)}` : ''}${u.rol ? ` (${u.rol})` : ''}${u.deop ? `, DEOP ${u.deop}` : ''}.`, 1)
  if (prc.length) p(`Relación de poder por DEOP (referencia por escalón y arma): ${prc.map((r) => `DEOP ${r.n} ${fmtRelacion(r.relacion)}`).join('; ')}.`, 1)
  if (notas.paso3) p(e(notas.paso3), 1)
  p('<b>IV.- POSIBILIDADES DEL ENEMIGO (CAE a nivel operacional).</b>')
  if (cae) {
    p(`<b>CAE más probable:</b> ${e(notas.caeProbable || cae.probable.texto)}`, 1)
    p(`<b>CAE más peligroso:</b> ${e(notas.caePeligroso || cae.peligroso.texto)}`, 1)
  }
  if (ains.length) p(`<b>Áreas de Interés Nombradas:</b> ${ains.map((a) => `${a.id} ${e(a.nombre)} (DEOP ${a.deop.join('/')}, entre ${fmtDia(a.net)} y ${fmtDia(a.nlt)})`).join('; ')}.`, 1)
  p('<i style="color:#666">Fuente del terreno: OpenStreetMap, Natural Earth y modelo de elevación AWS, generalizados a escala 1:1.000.000. Poder y ritmos: valores de referencia a validar.</i>')
  return L.join('\n')
}

// ── KML para Google Earth ───────────────────────────────────────────────────────────────
const x = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const kmlColor = (hex, alfa = 'ff') => { const h = hex.replace('#', ''); return alfa + h.slice(4, 6) + h.slice(2, 4) + h.slice(0, 2) }
const cs = (c) => c.map((p) => `${redondeo(p[0], 5)},${redondeo(p[1], 5)},0`).join(' ')
export function kmlDelTeatro({ ejercicio = '', anillo, analisis = [], teatro = {}, ains = [], nudos: nds = [], unidades = { enemigas: [], propias: [] }, capas = null }) {
  const K = []
  const pm = (nombre, desc, estilo, geom) => K.push(`<Placemark><name>${x(nombre)}</name>${desc ? `<description>${x(desc)}</description>` : ''}<styleUrl>#${estilo}</styleUrl>${geom}</Placemark>`)
  const pt = (p) => `<Point><coordinates>${redondeo(p[0], 5)},${redondeo(p[1], 5)},0</coordinates></Point>`
  const ln = (c) => `<LineString><tessellate>1</tessellate><coordinates>${cs(c)}</coordinates></LineString>`
  const pg = (r) => `<Polygon><tessellate>1</tessellate><outerBoundaryIs><LinearRing><coordinates>${cs(r)}</coordinates></LinearRing></outerBoundaryIs></Polygon>`
  const estilos = [
    `<Style id="ai"><LineStyle><color>ff00d7ff</color><width>2</width></LineStyle><PolyStyle><color>1400d7ff</color></PolyStyle></Style>`,
    ...COLOR_DEOP.map((c, i) => `<Style id="deop${i + 1}"><LineStyle><color>${kmlColor(c)}</color><width>5</width></LineStyle><PolyStyle><color>${kmlColor(c, '40')}</color></PolyStyle><IconStyle><color>${kmlColor(c)}</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/wht-circle.png</href></Icon></IconStyle></Style>`),
    `<Style id="eje"><LineStyle><color>ff2222ff</color><width>2.5</width></LineStyle></Style>`,
    `<Style id="ain"><IconStyle><color>ff00ffff</color><Icon><href>http://maps.google.com/mapfiles/kml/shapes/target.png</href></Icon></IconStyle></Style>`,
    `<Style id="nudo"><IconStyle><color>ff00a5ff</color><Icon><href>http://maps.google.com/mapfiles/kml/shapes/star.png</href></Icon></IconStyle></Style>`,
    `<Style id="rojo"><IconStyle><color>ff0000ff</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-diamond.png</href></Icon></IconStyle></Style>`,
    `<Style id="azul"><IconStyle><color>ffff0000</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-square.png</href></Icon></IconStyle></Style>`,
    `<Style id="via1"><LineStyle><color>ff1c1ce8</color><width>3</width></LineStyle></Style>`,
    `<Style id="via2"><LineStyle><color>ff2a8cf0</color><width>2</width></LineStyle></Style>`,
    `<Style id="ffcc"><LineStyle><color>ff333333</color><width>2</width></LineStyle></Style>`,
    `<Style id="pob"><IconStyle><scale>0.8</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon></IconStyle></Style>`,
  ]
  K.push(`<Folder><name>01 Área de Interés del TO</name>`)
  if (anillo) pm('Área de Interés del Teatro de Operaciones', `${fmtKm2(areaKm2(anillo))}`, 'ai', pg(anillo))
  K.push('</Folder>')
  K.push(`<Folder><name>02 DEOP sobre la red vial (tiempos D+n)</name>`)
  for (const a of analisis) {
    const est = `deop${((a.n - 1) % COLOR_DEOP.length) + 1}`
    K.push(`<Folder><name>${x(a.nombre)} — ${fmtKm(a.kmRuta)}, ${fmtDia(a.dias)}</name>`)
    const d = (teatro.deop || []).find((y) => y.n === a.n)
    if (d?.corredor) pm(`${a.nombre} — corredor`, `Admite ${a.magnitud}`, est, pg([...d.corredor, d.corredor[0]]))
    pm(`${a.nombre} — itinerario por la red vial`, `${fmtKm(a.kmRuta)} · mejor vía: ${a.via} · ${a.ritmo} km/día · ${a.enemigas.map((u) => u.designacion).join(', ')}`, est, ln(a.coords))
    for (const p of a.puntos) pm(`${p.nombre} · ${fmtDia(p.dia)}`, `${a.nombre} · ${fmtKm(p.km)} desde el paso de origen`, est, pt([p.lng, p.lat]))
    K.push('</Folder>')
  }
  K.push('</Folder>')
  if ((teatro.ejes || []).length) {
    K.push(`<Folder><name>03 Ejes de aproximación del enemigo</name>`)
    for (const j of teatro.ejes) pm(j.nombre, j.de, 'eje', ln(j.linea))
    K.push('</Folder>')
  }
  K.push(`<Folder><name>04 Áreas de Interés Nombradas (A.I.N.)</name>`)
  for (const a of ains) pm(`${a.id} ${a.nombre}`, `DEOP ${a.deop.join('/')} · entre ${fmtDia(a.net)} y ${fmtDia(a.nlt)} · Indicador: ${a.indicador} · ${a.confirma}`, 'ain', pt([a.lng, a.lat]))
  K.push('</Folder>')
  K.push(`<Folder><name>05 Terreno decisivo (nudos y pasos)</name>`)
  for (const n of nds) pm(n.nombre, n.porque, 'nudo', pt([n.lng, n.lat]))
  K.push('</Folder>')
  K.push(`<Folder><name>06 GG.UU. enemigas</name>`)
  for (const u of unidades.enemigas) pm(u.designacion, `${NOM_ESCALON[u.escalon] || u.escalon} · ${NOM_ARMA[u.arma] || u.arma}${u.deop ? ` · DEOP ${u.deop}` : ''}${u.rol ? ` · ${u.rol}` : ''}`, 'rojo', pt([u.lng, u.lat]))
  K.push('</Folder>')
  K.push(`<Folder><name>07 GG.UU. propias</name>`)
  for (const u of unidades.propias) pm(u.designacion, `${NOM_ESCALON[u.escalon] || u.escalon}${u.deop ? ` · DEOP ${u.deop}` : ''}`, 'azul', pt([u.lng, u.lat]))
  K.push('</Folder>')
  if (capas) {
    K.push(`<Folder><name>08 Comunicaciones principales</name><visibility>0</visibility>`)
    for (const v of capas.vias || []) if (v[0] <= 2) pm(v[2] || v[1] || CLASE_VIA[v[0]], CLASE_VIA[v[0]] + (v[1] ? ` · ruta ${v[1]}` : ''), `via${v[0]}`, ln(v[3]))
    for (const f of capas.ffcc || []) if (f[0] === 'activo') pm(f[1] || 'Ferrocarril', 'Ferrocarril en servicio', 'ffcc', ln(f[2]))
    K.push('</Folder>')
    K.push(`<Folder><name>09 Poblaciones principales</name><visibility>0</visibility>`)
    for (const q of capas.poblaciones || []) if (q[1] <= 3) pm(q[0], RANGO_POBLACION[q[1]], 'pob', pt([q[2], q[3]]))
    K.push('</Folder>')
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>PICB TEATRO — ${x(ejercicio)}</name>${estilos.join('')}${K.join('\n')}</Document></kml>`
}
