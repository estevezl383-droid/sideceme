// 🚚 PICB del Teatro · paso 6 LOGÍSTICA Y REEMPLAZOS (15-11-2026). Sin navegador.
//   node calcos/pruebas/picb-teatro-logistica.mjs                       (teatro chico)
//   CARPETA_KMZ="…/KMZ DIAMANTE" node calcos/pruebas/picb-teatro-logistica.mjs   (DIAMANTE + los CE azules)
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as M from '../picb-teatro/v1/modelo.mjs'
import * as A from '../picb-teatro/v1/analisis.mjs'
import * as D from '../picb-teatro/v1/doctrina.mjs'
import * as CA from '../picb-teatro/v1/cap-azul.mjs'
import * as LG from '../picb-teatro/v1/logistica.mjs'
import { armarRed } from '../picb-teatro/v1/red.mjs'
import { archivosDelZip, leerXml, placemarks, paqueteDeKml, bandosDeImagenes, bandoDeIcono } from '../areas-operaciones/abrir-kmz.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const base = M.abrirBase(JSON.parse(fs.readFileSync(path.join(AQUI, '..', 'picb-teatro', 'v1', 'datos', 'teatro-base.json'), 'utf8')))
const red = armarRed(base.vias)
let fallas = 0
const caso = async (nombre, fn) => { try { await fn(); console.log('  ✓ ' + nombre) } catch (e) { fallas++; console.log('  ✗ ' + nombre + '\n    ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n    ')) } }
const AZULES = [['CE-I', -68.4, -17.85, 'Curahuara de Carangas'], ['CE-II', -68.37, -19.0, 'Sabaya'], ['CE-III', -66.83, -20.46, 'Uyuni'], ['CE-IV', -65.72, -21.44, 'Tupiza'], ['CE-V (reserva)', -66.78, -18.9, 'Challapata']]
  .map(([d, lng, lat, l]) => ({ designacion: d, bando: 'propias', escalon: 'cuerpo', arma: 'infanteria', lng, lat, nombreKmz: `${d} – ${l}`, descripcionKmz: d.includes('reserva') ? 'Reserva de las FF.TT.T.O.' : '' }))

const dir = process.env.CARPETA_KMZ
let foto, teatro
const sub = (nombre, o, s, e, n) => ({ id: nombre, nombre, coords: [[o, s], [e, s], [e, n], [o, n]] })
if (dir) {
  const todos = [], lineas = []
  for (const n of fs.readdirSync(dir).filter((x) => /\.kmz$/i.test(x) && /^0[0-2]/.test(x)).sort()) {
    const z = await archivosDelZip(new Uint8Array(fs.readFileSync(path.join(dir, n))))
    const bandos = await bandosDeImagenes(z.imagenes)
    for (const k of z.kmls) {
      const pms = placemarks(leerXml(k.texto), { conLineas: true })
      lineas.push(...pms)
      for (const pm of pms) { const b = bandoDeIcono(pm.icono, bandos, ''); todos.push(b ? { ...pm, bandoIcono: b } : pm) }
    }
  }
  const pk = paqueteDeKml(todos.filter((p) => p.tipo !== 'linea'), { nombre: 'DIAMANTE' })
  const areas = pk.areas.length ? pk.areas : [sub('SUB TEATRO SUR', -68.9, -22.9, -65.6, -19.6), sub('SUB TEATRO CENTRAL', -69.1, -19.6, -66.6, -18.2), sub('SUBTEATRO NORTE', -69.6, -18.2, -67.0, -16.4)]
  foto = { nombre: 'DIAMANTE', ops: { areaOps: areas[areas.length - 1], areasOps: areas.slice(0, -1), unidadConsiderada: { nombre: 'FF.TT.T.O.', escalon: 'ejercito', confirmada: true } },
    anexos: { E: 'ANEXO “E” (Resumen de Logística) … 11.- Base Logística: COCHABAMBA. 12.- Sección especial y avanzada: A elegir y comunicar.' },
    unidades: [...pk.unidades.filter((u) => !/propia|azul/i.test(u.bando || '')), ...AZULES] }
  teatro = M.teatroDeKml(lineas)
} else {
  foto = {
    nombre: 'TEATRO CHICO', ops: { areaOps: sub('SUB TEATRO SUR', -68.6, -22.2, -65.6, -19.6), areasOps: [sub('SUBTEATRO NORTE', -69.4, -19.6, -66.6, -16.6)] }, ordenSup: { unidad: 'FF.TT.T.O.' },
    unidades: [
      { designacion: '1ª Brig. Acor.', bando: 'enemigo', escalon: 'brigada', arma: 'blindada', lat: -18.2839, lng: -69.0759, descripcionKmz: 'DEOP 1.' },
      { designacion: '3ª Brig. Acor.', bando: 'enemigo', escalon: 'brigada', arma: 'blindada', lat: -21.2278, lng: -68.2533, descripcionKmz: 'DEOP 2.' },
      { ...AZULES[0], descripcionKmz: 'DEOP que enfrenta: DEOP 1' }, { ...AZULES[2], descripcionKmz: 'DEOP que enfrenta: DEOP 2' }, AZULES[4],
    ],
  }
  teatro = { deop: [
    { n: 1, nombre: 'DEOP 1 · Chungará → La Paz', linea: [[-69.09, -18.28], [-68.409, -17.843], [-67.92, -17.233], [-68.15, -16.5]], puntos: [{ n: 1, nombre: 'Chungará (Chile)', lng: -69.09, lat: -18.28 }, { n: 2, nombre: 'Curahuara de Carangas', lng: -68.409, lat: -17.843 }, { n: 3, nombre: 'Patacamaya', lng: -67.92, lat: -17.233 }, { n: 4, nombre: 'La Paz', lng: -68.15, lat: -16.5 }] },
    { n: 2, nombre: 'DEOP 2 · Ollagüe → Uyuni', linea: [[-68.254, -21.224], [-67.556, -20.927], [-66.824, -20.463]], puntos: [{ n: 1, nombre: 'Ollagüe (Chile)', lng: -68.254, lat: -21.224 }, { n: 2, nombre: 'San Pedro de Quemes', lng: -67.556, lat: -20.927 }, { n: 3, nombre: 'Uyuni', lng: -66.824, lat: -20.463 }] },
  ], ejes: [], origenes: [{ nombre: 'Arica', lng: -70.32, lat: -18.48 }, { nombre: 'Calama', lng: -68.93, lat: -22.46 }] }
  for (const d of teatro.deop) d.puntos.forEach((p, i) => { p.rol = i === 0 ? 'inicio' : i === d.puntos.length - 1 ? 'destino' : 'intermedio' })
}
const areas = M.areasDelEjercicio(foto)
const unidades = M.unidadesDelEjercicio(foto)
const ai = M.areaDeInteres({ areas, unidades, teatro })
const capas = M.recortarBase(base, ai.anillo)
const analisis = teatro.deop.map((d) => A.analizarDeop(d, red, unidades))
const prc = A.prcPorDeop(analisis)
const cae = A.caeOperacionales(analisis, prc, unidades, capas, {})
const ctx = { analisis, prc, cae, unidades, ains: A.ainsDelTeatro(analisis), nudos: A.nudos(red, capas, ai.anillo), capas, teatro, fuera: ai.fuera, cruce: 5, objetivo: '' }
const caes = D.caePorFases(ctx)
const cap = CA.capAzul({ analisis, caes, unidades, frente: 'probable', ediciones: {} })
const enf = CA.enfrentamientos(caes.probable, cap, analisis)
console.log(`ejercicio: ${foto.nombre} · ${analisis.length} DEOP · azules ${unidades.propias.map((u) => u.designacion).join(', ')}`)

const t0 = performance.now()
const plan = LG.planLogistico({ base, red, analisis, cap, enf, unidades, teatro, foto, ed: {} })
console.log(`  (plan en ${Math.round(performance.now() - t0)} ms)`)

await caso('organiza la Zona de Etapas: BL, SB, SA por CE, BR (y SE si el TO es extenso)', () => {
  assert.ok(plan, 'hay plan')
  for (const x of plan.instalaciones) console.log(`    ${x.tipo.padEnd(2)} ${x.nombre.padEnd(46)} ${String(x.lng).slice(0, 8)},${String(x.lat).slice(0, 8)} de ${x.de || '—'} ${x.km != null ? x.km + ' km' : ''}${x.ferro ? ' 🚆' : ''} cap ${x.cap || '—'} ${x.tMax ? x.tMax + ' t' : ''}`)
  assert.equal(plan.bl.tipo, 'BL')
  if (dir) assert.match(plan.bl.lugar, /Cochabamba/, 'la BL del Anexo E')
  assert.ok(plan.sb && plan.sb.de === 'BL')
  assert.equal(plan.sa.length, unidades.propias.filter((u) => u.escalon === 'cuerpo').length, 'una SA por cada CE (también la reserva)')
  for (const s of plan.sa) assert.ok(['SB', ...plan.se.map((x) => x.id)].includes(s.de))
  assert.ok(plan.br.cias >= 3 && plan.br.cias <= 7, 'BR de 3 a 7 compañías')
  if (dir) { assert.match(plan.sb.lugar, /Oruro/, 'SB en Oruro (terminal, ZR del CTO)'); assert.ok(plan.se.length >= 1, 'TO extenso: hay Sección Especial'); console.log(`    SE: ${plan.se.map((s) => `${s.lugar} → ${s.apoya.join(', ')}`).join(' · ')}`) }
})
await caso('las SA quedan detrás de su CE, entre la seguridad (≥ 25 km) y la DMA (80 km)', () => {
  const f = plan.fases[0]
  for (const s of plan.sa) {
    const a = cap.fases[0].acciones.find((x) => x.designacion === s.apoya[0])
    const d = M.distKm([f.pos[s.id].lng, f.pos[s.id].lat], [a.lng, a.lat]) * 1.3
    console.log(`    ${s.id}: ${f.pos[s.id].lugar || '(en el camino)'} a ${Math.round(d)} km de ${a.designacion}`)
    assert.ok(d >= 15 && d <= plan.dmaGu + 15, `${s.id} a ${d} km`)
  }
})
await caso('fase por fase: consumo, flujo, apoyo de cada GU, bajas y reemplazos', () => {
  assert.equal(plan.fases.length, cap.fases.length)
  for (const f of plan.fases) {
    console.log(`    ${f.id} ${f.dias} d · ${f.tDia} t/día · ${f.flujo.map((x) => `${x.id} ${x.pct}%`).join(' ')} · bajas ${f.personal.bajas} reemp ${f.personal.reemplazos}`)
    assert.ok(f.tDia > 0)
    for (const g of f.gu) assert.ok(g.apoyo, `${g.designacion} tiene apoyo`)
  }
  assert.ok(plan.fases[1].personal.bajas > plan.fases[0].personal.bajas, 'en la F-II (contacto) hay más bajas que en la cobertura')
  assert.equal(plan.nivelesClase.length, LG.CLASES.length)
  assert.ok(plan.concepto.general.length >= 4 && plan.concepto.porFase.length === plan.fases.length)
  console.log('    ' + plan.concepto.general[0].slice(0, 400))
  for (const t of plan.avisos.slice(0, 6)) console.log('    ⚠ ' + t)
})
await caso('las correcciones del G-4 mandan: BL elegida, SA movida, capacidad, sin SE', () => {
  const sa = plan.sa[0]
  const p2 = LG.planLogistico({ base, red, analisis, cap, enf, unidades, teatro, foto, ed: { bl: 'Oruro', se: 'no', cap: { SB: 5000 }, pos: { [`F-I|${sa.id}`]: [-67.9, -18.2] }, ef: { [sa.apoya[0]]: 15000 } } })
  assert.match(p2.bl.lugar, /Oruro/)
  assert.equal(p2.se.length, 0)
  assert.equal(p2.sb.cap, 5000)
  assert.equal(p2.fases[0].pos[sa.id].lng, -67.9)
  assert.equal(p2.gus.find((g) => g.designacion === sa.apoya[0]).ef, 15000)
})
await caso('al Juego de Guerra: fichas de logística encadenadas y datos de cada GU; KML y Word', () => {
  const j = LG.paraJuego(plan)
  assert.equal(j.formato, 'sideceme/logistica-teatro')
  const des = new Set(j.instalaciones.map((x) => x.designacion))
  for (const x of j.instalaciones) { if (x.de) assert.ok(des.has(x.de), `${x.designacion} ← ${x.de}`); assert.ok(Number.isFinite(x.lng) && Number.isFinite(x.lat)) }
  assert.ok(j.instalaciones.some((x) => x.tipo === 'BR' && x.hombres >= 0))
  for (const g of unidades.propias) assert.ok(j.gu[g.designacion]?.ef > 0, g.designacion)
  console.log(`    ${j.instalaciones.length} fichas (${j.instalaciones.filter((x) => x.bando === 'rojo').length} rojas): ${j.instalaciones.map((x) => x.designacion).join(' · ')}`)
  const kml = LG.kmlLogistica(plan, foto.nombre)
  assert.ok(kml.includes('<kml') && kml.includes('Apoyo logístico F-I'))
  const html = LG.textoLogistica(plan)
  assert.ok(html.includes('Niveles de abastecimiento') && html.includes('Personal y reemplazos'))
  if (process.env.SALIDA) { fs.writeFileSync(path.join(process.env.SALIDA, 'logistica.json'), JSON.stringify(j, null, 2)); fs.writeFileSync(path.join(process.env.SALIDA, 'logistica.kml'), kml); fs.writeFileSync(path.join(process.env.SALIDA, 'logistica.html'), html) }
})
console.log(fallas ? `\n${fallas} FALLA(S)` : '\nTodo bien.')
process.exit(fallas ? 1 : 0)
