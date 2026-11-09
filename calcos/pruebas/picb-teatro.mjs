// 🌎 PICB del Teatro (09-11-2026) — el modelo y el análisis, sin navegador.
//   node calcos/pruebas/picb-teatro.mjs
//   CARPETA_KMZ="$HOME/Desktop/FF.TT.T.O." node calcos/pruebas/picb-teatro.mjs   (con los KMZ reales de DIAMANTE)
// Sin CARPETA_KMZ usa un teatro chico armado acá (dos subteatros, dos DEOP, cuatro GG.UU.).
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as M from '../picb-teatro/v1/modelo.mjs'
import * as A from '../picb-teatro/v1/analisis.mjs'
import { armarRed, ruta, nodoCercano } from '../picb-teatro/v1/red.mjs'
import { archivosDelZip, leerXml, placemarks, paqueteDeKml, bandosDeImagenes, bandoDeIcono } from '../areas-operaciones/abrir-kmz.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const base = M.abrirBase(JSON.parse(fs.readFileSync(path.join(AQUI, '..', 'picb-teatro', 'v1', 'datos', 'teatro-base.json'), 'utf8')))
let fallas = 0
const caso = async (nombre, fn) => { try { await fn(); console.log('  ✓ ' + nombre) } catch (e) { fallas++; console.log('  ✗ ' + nombre + '\n    ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n    ')) } }

// ── el archivo de datos ──────────────────────────────────────────────────────────────────
console.log('datos del teatro')
await caso('abre y trae las capas a escala teatro', () => {
  for (const k of ['vias', 'ffcc', 'rios', 'fronteras', 'paises', 'salares', 'lagos', 'relieve', 'poblaciones', 'aerodromos', 'pasos', 'volcanes', 'regiones']) assert.ok(Array.isArray(base[k]) && base[k].length, k)
  assert.ok(base.vias[0][3].length >= 2 && Number.isFinite(base.vias[0][3][0][0]))
  assert.ok(base.salares.some((s) => /Uyuni/.test(s[0])), 'Salar de Uyuni')
  assert.ok(base.lagos.some((s) => /Titicaca/.test(s[0])) && base.lagos.some((s) => /Poop/.test(s[0])), 'Titicaca y Poopó')
  assert.ok(base.pasos.some((p) => /Chungar/.test(p[0])), 'paso Chungará')
  assert.ok(base.poblaciones.some((p) => p[0] === 'Oruro' && p[1] <= 2), 'Oruro ciudad')
  assert.ok(base.regiones.some((r) => /Altiplano/i.test(r[0])), 'región Altiplano')
})
const red = armarRed(base.vias)
await caso('la red vial queda conectada: Oruro → Potosí por la ruta, no en línea recta', () => {
  const oruro = [-67.1148, -17.9698], potosi = [-65.7535, -19.5893]
  const r = ruta(red, oruro, potosi)
  assert.ok(r.porRed, r.motivo)
  assert.ok(r.km > M.distKm(oruro, potosi) * 1.05 && r.km < 420, `${Math.round(r.km)} km`)
})
await caso('Arica → Tambo Quemado cruza la frontera por Chungará (ruta 11 / F4)', () => {
  const r = ruta(red, [-70.3126, -18.4783], [-69.0056, -18.2793])
  assert.ok(r.porRed, r.motivo)
  assert.ok(r.km > 170 && r.km < 260, `${Math.round(r.km)} km`)
})

// ── un ejercicio de teatro (DIAMANTE o uno chico) ───────────────────────────────────────
const dir = process.env.CARPETA_KMZ
let foto, teatro
if (dir) {
  const todos = []
  const deopLista = []
  for (const n of fs.readdirSync(dir).filter((x) => /\.kmz$/i.test(x)).sort()) {
    const z = await archivosDelZip(new Uint8Array(fs.readFileSync(path.join(dir, n))))
    const bandos = await bandosDeImagenes(z.imagenes)
    for (const k of z.kmls) {
      const pms = placemarks(leerXml(k.texto), { conLineas: true })
      deopLista.push(...pms)
      for (const pm of pms) { const b = bandoDeIcono(pm.icono, bandos, ''); todos.push(b ? { ...pm, bandoIcono: b } : pm) }
    }
  }
  const pk = paqueteDeKml(todos.filter((p) => p.tipo !== 'linea'), { nombre: 'DIAMANTE' })
  const areas = pk.areas
  foto = { nombre: 'DIAMANTE', ops: { areaOps: areas[areas.length - 1], areasOps: areas.slice(0, -1), unidadConsiderada: { nombre: 'FF.TT.T.O.', escalon: 'ejercito', confirmada: true } }, unidades: pk.unidades }
  teatro = M.teatroDeKml(deopLista)
} else {
  const sub = (nombre, o, s, e, n) => ({ id: nombre, nombre, coords: [[o, s], [e, s], [e, n], [o, n]] })
  foto = {
    nombre: 'TEATRO CHICO', ops: { areaOps: sub('SUB TEATRO SUR', -68.6, -22.2, -65.6, -19.6), areasOps: [sub('SUBTEATRO NORTE', -69.4, -19.6, -66.6, -16.6)] },
    ordenSup: { unidad: 'FF.TT.T.O.' },
    unidades: [
      { designacion: '1ª Brig. Acor.', bando: 'enemigo', escalon: 'brigada', arma: 'blindada', lat: -18.2839, lng: -69.0759, descripcionKmz: 'DEOP 1' },
      { designacion: '3ª Brig. Acor.', bando: 'enemigo', escalon: 'brigada', arma: 'blindada', lat: -21.2278, lng: -68.2533, descripcionKmz: 'DEOP 2' },
      { designacion: 'CE-I', bando: 'propias', escalon: 'cuerpo', arma: 'infanteria', lat: -17.8667, lng: -68.4329, descripcionKmz: 'DEOP que enfrenta: DEOP 1' },
      { designacion: 'FF.TT.T.O.', bando: 'propias', escalon: 'ejercito', arma: 'infanteria', lat: -18.8922, lng: -66.7899, nombreKmz: 'FF.TT.T.O. – Challapata' },
    ],
  }
  teatro = { deop: [
    { n: 1, nombre: 'DEOP 1 · Chungará → La Paz', corredor: null, linea: [[-69.076, -18.284], [-68.409, -17.843], [-68.15, -16.5]], puntos: [{ n: 1, nombre: 'Chungará (Chile)', lng: -69.076, lat: -18.284, rol: 'inicio' }, { n: 2, nombre: 'Tambo Quemado (Bolivia)', lng: -69.0056, lat: -18.2793, rol: 'intermedio' }, { n: 3, nombre: 'Curahuara de Carangas', lng: -68.409, lat: -17.843, rol: 'intermedio' }, { n: 4, nombre: 'La Paz', lng: -68.15, lat: -16.5, rol: 'destino' }] },
    { n: 2, nombre: 'DEOP 2 · Ollagüe → Potosí', corredor: null, linea: [[-68.253, -21.224], [-66.824, -20.463], [-65.754, -19.589]], puntos: [{ n: 1, nombre: 'Ollagüe (Chile)', lng: -68.253, lat: -21.224, rol: 'inicio' }, { n: 2, nombre: 'Uyuni', lng: -66.824, lat: -20.463, rol: 'intermedio' }, { n: 3, nombre: 'Potosí', lng: -65.754, lat: -19.589, rol: 'destino' }] },
  ], ejes: [], origenes: [] }
}

console.log(`ejercicio: ${foto.nombre}`)
const nivel = M.nivelDelEjercicio(foto)
await caso('se reconoce como ejercicio de nivel teatro', () => { assert.ok(nivel.teatro, JSON.stringify(nivel)); assert.ok(nivel.motivo) })
await caso('un ejercicio de DIVISIÓN no se toca (no es teatro)', () => {
  const div = { nombre: 'ARMAS', ops: { unidadConsiderada: { nombre: 'DIV.MEC.-1', escalon: 'division', confirmada: true }, areaOps: { id: 'a', nombre: 'AO DIV MEC-1', coords: [[-68, -18], [-67.8, -18], [-67.8, -17.8], [-68, -17.8]] } }, unidades: [] }
  assert.equal(M.nivelDelEjercicio(div).teatro, false)
  assert.equal(M.nivelDelEjercicio({}).teatro, false)
  assert.equal(M.nivelDelEjercicio(null).teatro, false)
})
const areas = M.areasDelEjercicio(foto)
const resumen = M.resumenTeatro(areas)
const unidades = M.unidadesDelEjercicio(foto)
await caso('áreas del teatro y GG.UU. de los dos bandos', () => {
  assert.ok(resumen.subteatros.length >= 2, resumen.subteatros.map((s) => s.nombre).join(','))
  assert.ok(resumen.km2 > 50000, M.fmtKm2(resumen.km2))
  assert.ok(unidades.enemigas.length >= 2 && unidades.propias.length >= 2)
  if (dir) {
    assert.equal(resumen.subteatros.length + resumen.teatro.length, 3)
    assert.ok(Math.abs(resumen.km2 - 186391) < 3000, M.fmtKm2(resumen.km2))
    assert.ok(unidades.enemigas.find((u) => /Coraceros/.test(u.designacion))?.deop === 1)
    assert.ok(unidades.propias.find((u) => /CE-I$/.test(u.designacion))?.deop === 1)
    assert.equal(unidades.enemigas.find((u) => /DE-II/.test(u.designacion))?.rol, 'reserva')
  }
})
const ai = M.areaDeInteres({ areas, unidades, teatro })
await caso('Área de Interés: el TO + las bases del enemigo, sin estirarse a Santiago', () => {
  assert.ok(ai.anillo && ai.km2 > resumen.km2, M.fmtKm2(ai.km2))
  if (dir) {
    assert.ok(M.enPoligono([-70.3126, -18.4783], ai.anillo), 'Arica adentro')
    assert.ok(M.enPoligono([-70.4, -23.65], ai.anillo), 'Antofagasta adentro')
    assert.ok(ai.fuera.some((f) => /Rancagua|BAVE|Santiago/.test(f.nombre)), 'Rancagua/Santiago afuera')
  }
})
const capas = M.recortarBase(base, ai.anillo)
await caso('las capas se recortan al Área de Interés', () => {
  assert.ok(capas.vias.length > 100 && capas.vias.length < base.vias.length)
  assert.ok(capas.poblaciones.every((p) => M.enPoligono([p[2], p[3]], ai.anillo)))
})
await caso('el KMZ del teatro: DEOP con sus puntos numerados', () => {
  assert.ok(teatro.deop.length >= 2)
  for (const d of teatro.deop) assert.ok(d.puntos.length >= 3 && d.puntos[0].rol === 'inicio' && d.puntos[d.puntos.length - 1].rol === 'destino', d.nombre)
  if (dir) {
    assert.equal(teatro.deop.length, 4)
    assert.ok(teatro.deop.every((d) => d.corredor && d.corredor.length > 10), 'los 4 corredores')
    assert.ok(teatro.ejes.length >= 5, 'ejes de aproximación')
    assert.ok(teatro.origenes.some((o) => /Arica/.test(o.nombre)))
    assert.match(teatro.deop[0].nombre, /Chungar/)
  }
})
const analisis = teatro.deop.map((d) => A.analizarDeop(d, red, unidades))
await caso('cada DEOP medida sobre la red vial, con D+n en cada punto', () => {
  for (const a of analisis) {
    assert.ok(a.kmRuta >= a.kmRecta * 0.98, `${a.nombre}: ${Math.round(a.kmRuta)} vs ${Math.round(a.kmRecta)}`)
    assert.ok(a.puntos.every((p, i) => i === 0 || p.dia > a.puntos[i - 1].dia))
    assert.ok(a.ritmo > 0 && a.dias > 0)
    console.log(`    ${a.nombre}: ${Math.round(a.kmRuta)} km por vía (${Math.round(a.kmRecta)} recta), ${a.via}, admite ${a.magnitud}, ${a.ritmo} km/día → ${M.fmtDia(a.dias)} · ${a.enemigas.map((u) => u.designacion).join(', ')} vs ${a.propias.map((u) => u.designacion).join(', ')}`)
    console.log(`      ${a.puntos.map((p) => `${p.nombre} ${M.fmtDia(p.dia)}`).join(' → ')}${a.tramos.some((t) => !t.porRed) ? '  [tramos rectos: ' + a.tramos.filter((t) => !t.porRed).map((t) => `${t.de}→${t.a} (${t.motivo})`).join('; ') + ']' : ''}`)
  }
})
const nds = A.nudos(red, capas, ai.anillo)
await caso('nudos de comunicaciones (terreno decisivo)', () => {
  assert.ok(nds.length >= 3, nds.map((n) => n.nombre).join(', '))
  console.log('    ' + nds.map((n) => `${n.nombre}(${n.salidas})`).join(', '))
  if (dir) assert.ok(nds.some((n) => /Oruro|Challapata|Uyuni|Patacamaya|Potos/.test(n.nombre)))
})
const ains = A.ainsDelTeatro(analisis)
await caso('A.I.N. en pasos, OEM y OEN, numeradas por orden de tiempo', () => {
  assert.ok(ains.length >= analisis.length * 2)
  assert.ok(ains.every((a, i) => a.id === `AIN-${i + 1}` && a.nlt >= a.net))
  assert.ok(ains.some((a) => a.tipo === 'paso'))
  console.log('    ' + ains.slice(0, 8).map((a) => `${a.id} ${a.nombre} (DEOP ${a.deop.join('/')}, ${M.fmtDia(a.net)}–${M.fmtDia(a.nlt)})`).join(' · '))
})
const prc = A.prcPorDeop(analisis)
const cae = A.caeOperacionales(analisis, prc, unidades, capas, { objetivo: dir ? 'Salar de Uyuni' : '' })
await caso('poder relativo por DEOP y los dos CAE propuestos', () => {
  assert.equal(prc.length, analisis.length)
  assert.ok(cae && cae.probable.texto.length > 40 && cae.peligroso.texto.length > 40)
  console.log('    PRC: ' + prc.map((r) => `DEOP ${r.n} ${A.fmtRelacion(r.relacion)}`).join(' · '))
  console.log('    + probable: ' + cae.probable.texto)
  console.log('    + peligroso: ' + cae.peligroso.texto)
  if (dir) assert.equal(cae.probable.n, 4, 'con objetivo «Salar de Uyuni» el esfuerzo principal va por la DEOP 4')
})
const efectos = A.resumenEfectos(capas, red, ai.anillo)
await caso('texto para la Apreciación y KML para Google Earth', () => {
  const html = A.textoApreciacion({ ejercicio: foto.nombre, resumen, efectos, analisis, nudos: nds, ains, prc, cae, unidades })
  assert.match(html, /CARACTERÍSTICAS DEL ÁREA DE OPERACIONES/)
  assert.match(html, /CAE más probable/)
  const kml = A.kmlDelTeatro({ ejercicio: foto.nombre, anillo: ai.anillo, analisis, teatro, ains, nudos: nds, unidades, capas })
  assert.match(kml, /^<\?xml/)
  assert.equal((kml.match(/<Placemark>/g) || []).length > 20, true)
  const ar = leerXml(kml)
  const pms = placemarks(ar, { conLineas: true })
  assert.ok(pms.length > 20, 'el KML se vuelve a leer con el lector de la Mesa')
  if (process.env.SALIDA_KML) fs.writeFileSync(process.env.SALIDA_KML, kml)
  console.log(`    efectos: ${Math.round(efectos.kmPor[1] || 0)} km troncales, ${Math.round(efectos.kmPor[2] || 0)} primarias, ${efectos.nFfcc} FF.CC., ${efectos.ciudades.length} ciudades, salares ${efectos.salares.map((s) => s.nombre).join(', ')}, severo ${M.fmtKm2(efectos.severoKm2)}`)
})
console.log(fallas ? `picb-teatro: ${fallas} FALLAS` : 'picb-teatro: OK')
process.exit(fallas ? 1 : 0)
