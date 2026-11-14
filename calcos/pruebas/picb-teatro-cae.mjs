// 🌎 PICB del Teatro · pasos 3 y 4 a fondo (14-11-2026): plantilla doctrinal, CAE por fases, matriz,
// RPI, prompt para la IA y lectura de su respuesta. Sin navegador.
//   node calcos/pruebas/picb-teatro-cae.mjs
//   CARPETA_KMZ="…/KMZ DIAMANTE" node calcos/pruebas/picb-teatro-cae.mjs   (con los KMZ generados para DIAMANTE)
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as M from '../picb-teatro/v1/modelo.mjs'
import * as A from '../picb-teatro/v1/analisis.mjs'
import * as D from '../picb-teatro/v1/doctrina.mjs'
import { armarRed } from '../picb-teatro/v1/red.mjs'
import { archivosDelZip, leerXml, placemarks, paqueteDeKml, bandosDeImagenes, bandoDeIcono } from '../areas-operaciones/abrir-kmz.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const base = M.abrirBase(JSON.parse(fs.readFileSync(path.join(AQUI, '..', 'picb-teatro', 'v1', 'datos', 'teatro-base.json'), 'utf8')))
const red = armarRed(base.vias)
let fallas = 0
const caso = async (nombre, fn) => { try { await fn(); console.log('  ✓ ' + nombre) } catch (e) { fallas++; console.log('  ✗ ' + nombre + '\n    ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n    ')) } }

// ── el ejercicio: los KMZ de DIAMANTE si están, si no el teatro chico ──
const dir = process.env.CARPETA_KMZ
let foto, teatro
const sub = (nombre, o, s, e, n) => ({ id: nombre, nombre, coords: [[o, s], [e, s], [e, n], [o, n]] })
if (dir) {
  const todos = [], lineas = []
  for (const n of fs.readdirSync(dir).filter((x) => /\.kmz$/i.test(x)).sort()) {
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
  foto = { nombre: 'DIAMANTE', ops: { areaOps: areas[areas.length - 1], areasOps: areas.slice(0, -1), unidadConsiderada: { nombre: 'FF.TT.T.O.', escalon: 'ejercito', confirmada: true } }, unidades: [...pk.unidades, { designacion: 'FF.TT.T.O.', bando: 'propias', escalon: 'ejercito', arma: 'infanteria', lat: -17.967, lng: -67.107, nombreKmz: 'FF.TT.T.O. – Oruro' }] }
  teatro = M.teatroDeKml(lineas)
} else {
  foto = {
    nombre: 'TEATRO CHICO', ops: { areaOps: sub('SUB TEATRO SUR', -68.6, -22.2, -65.6, -19.6), areasOps: [sub('SUBTEATRO NORTE', -69.4, -19.6, -66.6, -16.6)] },
    ordenSup: { unidad: 'FF.TT.T.O.' },
    unidades: [
      { designacion: '1ª Brig. Acor.', bando: 'enemigo', escalon: 'brigada', arma: 'blindada', lat: -18.2839, lng: -69.0759, descripcionKmz: 'DEOP 1.' },
      { designacion: 'Brig. Mot. 4', bando: 'enemigo', escalon: 'brigada', arma: 'motorizada', lat: -18.25, lng: -69.1, descripcionKmz: 'DEOP 1. Primer escalón.' },
      { designacion: '3ª Brig. Acor.', bando: 'enemigo', escalon: 'brigada', arma: 'blindada', lat: -21.2278, lng: -68.2533, descripcionKmz: 'DEOP 2.' },
      { designacion: '2ª Brig. Acor.', bando: 'enemigo', escalon: 'brigada', arma: 'blindada', lat: -20.26, lng: -69.786, nombreKmz: '2ª Brig. Acor. – Pozo Almonte', descripcionKmz: 'Reserva operativa de la fuerza terrestre.' },
      { designacion: 'Brig. Aviación', bando: 'enemigo', escalon: 'brigada', arma: 'aviacion', lat: -18.48, lng: -70.32, nombreKmz: 'Brig. Aviación – Arica', descripcionKmz: 'Apoyo: helicópteros.' },
      { designacion: 'CE-I', bando: 'propias', escalon: 'cuerpo', arma: 'infanteria', lat: -17.8667, lng: -68.4329, descripcionKmz: 'DEOP que enfrenta: DEOP 1' },
      { designacion: 'CE-IV', bando: 'propias', escalon: 'cuerpo', arma: 'infanteria', lat: -20.46, lng: -66.82, descripcionKmz: 'DEOP que enfrenta: DEOP 2' },
      { designacion: 'FF.TT.T.O.', bando: 'propias', escalon: 'ejercito', arma: 'infanteria', lat: -17.967, lng: -67.107, nombreKmz: 'FF.TT.T.O. – Oruro' },
    ],
  }
  teatro = { deop: [
    { n: 1, nombre: 'DEOP 1 · Chungará → La Paz', corredor: null, linea: [[-69.09, -18.28], [-68.409, -17.843], [-67.92, -17.233], [-68.15, -16.5]], puntos: [{ n: 1, nombre: 'Chungará (Chile)', lng: -69.09, lat: -18.28, rol: 'inicio' }, { n: 2, nombre: 'Tambo Quemado (Bolivia)', lng: -69.08, lat: -18.27, rol: 'intermedio' }, { n: 3, nombre: 'Curahuara de Carangas', lng: -68.409, lat: -17.843, rol: 'intermedio' }, { n: 4, nombre: 'Patacamaya', lng: -67.92, lat: -17.233, rol: 'intermedio' }, { n: 5, nombre: 'La Paz', lng: -68.133, lat: -16.496, rol: 'destino' }], descripcion: '' },
    { n: 2, nombre: 'DEOP 2 · Ollagüe → Uyuni', corredor: null, linea: [[-68.254, -21.224], [-67.556, -20.927], [-66.824, -20.463]], puntos: [{ n: 1, nombre: 'Ollagüe (Chile)', lng: -68.254, lat: -21.224, rol: 'inicio' }, { n: 2, nombre: 'Avaroa (Bolivia)', lng: -68.212, lat: -21.205, rol: 'intermedio' }, { n: 3, nombre: 'Julaca', lng: -67.556, lat: -20.927, rol: 'intermedio' }, { n: 4, nombre: 'Uyuni', lng: -66.824, lat: -20.463, rol: 'destino' }], descripcion: '' },
  ], ejes: [{ nombre: 'EJE Arica – Putre – Chungará', linea: [[-70.32, -18.48], [-69.09, -18.28]], de: 'DE-VI desde Arica' }], origenes: [{ nombre: 'Arica', lng: -70.32, lat: -18.48 }] }
  for (const d of teatro.deop) d.puntos.forEach((p, i) => { p.rol = i === 0 ? 'inicio' : i === d.puntos.length - 1 ? 'destino' : 'intermedio' })
}
console.log(`ejercicio: ${foto.nombre} (${teatro.deop.length} DEOP)`)
const areas = M.areasDelEjercicio(foto)
const unidades = M.unidadesDelEjercicio(foto)
const ai = M.areaDeInteres({ areas, unidades, teatro })
const capas = M.recortarBase(base, ai.anillo)
const analisis = teatro.deop.map((d) => A.analizarDeop(d, red, unidades))
const nudos = A.nudos(red, capas, ai.anillo)
const ains = A.ainsDelTeatro(analisis)
const prc = A.prcPorDeop(analisis)
const cae = A.caeOperacionales(analisis, prc, unidades, capas, { objetivo: 'Salar de Uyuni' })
const ctx = { analisis, prc, cae, unidades, ains, nudos, capas, teatro, fuera: ai.fuera, cruce: 5, objetivo: 'Salar de Uyuni' }

console.log('paso 3 · modelo de la amenaza')
const art = D.articular(ctx)
await caso('articula la fuerza enemiga: esfuerzo principal, secundarios/engaño, reserva, apoyos', () => {
  assert.ok(art.ep, 'hay esfuerzo principal')
  assert.ok(art.reserva.length >= 1, 'reserva identificada por su descripción')
  assert.ok(art.apoyos.length >= 1 || dir, 'apoyos')
  console.log(`    EP DEOP ${art.ep.n} (${art.ep.enemigas.map((u) => u.designacion).join(', ')}) · secundarias ${art.es.map((a) => a.n).join(',') || '—'} · engaño ${art.engano ? 'DEOP ' + art.engano.n : '—'} · reserva ${art.reserva.map((u) => u.designacion).join(', ')}`)
})
const modelo = D.modeloAmenaza(ctx)
await caso('plantilla doctrinal: descripción, BAV, decisiones del enemigo con ventana y lugar', () => {
  assert.ok(modelo && modelo.descripcion.length > 200, 'descripción')
  assert.ok(modelo.bav.length >= 5 && modelo.decisiones.length >= 3)
  assert.ok(modelo.decisiones.every((d) => /^PD-E\d$/.test(d.id) && d.ventana && d.donde))
  assert.ok(modelo.normas.length >= 10 && modelo.articulacion.length >= 4)
  assert.match(modelo.descripcion, /esfuerzo principal/)
  console.log('    ' + modelo.decisiones.map((d) => `${d.id} ${d.ventana}`).join(' · '))
})

console.log('paso 4 · CAE por fases')
const caes = D.caePorFases(ctx)
await caso('dos CAE con enunciado, cuatro fases, acciones con posición y D+n, y reserva', () => {
  assert.ok(caes && caes.probable && caes.peligroso)
  assert.notEqual(caes.probable.n, caes.peligroso.n, 'probable y peligroso en DEOP distintas')
  for (const c of [caes.probable, caes.peligroso]) {
    assert.equal(c.fases.length, 4)
    assert.match(c.enunciado, /ESFUERZO PRINCIPAL/)
    assert.ok(c.fases.every((f) => f.acciones.length >= 1 && f.acciones.every((a) => Number.isFinite(a.lng) && Number.isFinite(a.lat) && a.que && Number.isFinite(a.dia))))
    assert.ok(c.fases.every((f, i) => i === 0 || f.de >= c.fases[i - 1].a - 0.01), 'las fases van en orden')
    assert.ok(c.reserva && c.reserva.direcciones.length >= 1 && /D\+\d/.test(c.fases[2].acciones.find((a) => a.papel === 'reserva')?.que || ''), 'la reserva se empeña en la F-III con día')
    assert.ok(c.porque.length === 3)
  }
  // el esfuerzo principal avanza por su itinerario: en la F-III está más lejos del paso que en la F-II
  const ep = (c, f) => c.fases[f].acciones.find((a) => a.papel === 'esfuerzo principal')
  assert.ok(ep(caes.probable, 2).km >= ep(caes.probable, 1).km, 'avanza')
  console.log(`    ${caes.probable.id} DEOP ${caes.probable.n} → ${caes.probable.oen}; ${caes.peligroso.id} DEOP ${caes.peligroso.n} → ${caes.peligroso.oen} (${caes.peligroso.criterio})`)
  console.log(`    ${caes.probable.enunciado.slice(0, 220)}…`)
})
await caso('más peligroso = la DEOP que llega a una capital (La Paz), aunque el poder esté en otra', () => {
  if (dir) {
    // la decisión de la clase con los KMZ entregados: probable por la DEOP 2, peligroso por la DEOP 1 (La Paz), engaño en la DEOP 1
    assert.equal(teatro.deop.length, 5)
    assert.equal(caes.probable.n, 2); assert.equal(caes.peligroso.n, 1); assert.match(caes.peligroso.criterio, /La Paz/)
    assert.equal(art.engano?.n, 1); assert.ok(art.reserva.some((u) => /Acor/.test(u.designacion)) && art.reservaLejana.some((u) => /REM/.test(u.designacion)))
    assert.ok(unidades.enemigas.filter((u) => u.arma === 'blindada').length >= 3, 'las tres Brigadas Acorazadas')
    assert.ok(analisis.every((a) => a.kmRuta < 700), analisis.map((a) => `${a.n}:${Math.round(a.kmRuta)}`).join(' '))
    return
  }
  assert.equal(caes.probable.n, 2, 'probable: la DEOP con más poder y hacia el objetivo (Uyuni)')
  assert.equal(caes.peligroso.n, 1, 'peligroso: la que va a La Paz')
  assert.match(caes.peligroso.criterio, /La Paz/)
})
await caso('matriz de eventos, RPI y puntos de decisión propios', () => {
  assert.ok(caes.matriz.length >= ains.length && caes.matriz[0].ain === 'AIN-R', 'la A.I.N. de la reserva va primera')
  assert.ok(caes.matriz.every((m) => m.ventana && m.indicador && m.confirma))
  assert.ok(caes.matriz.some((m) => m.confirma === 'CAE-1') && caes.matriz.some((m) => m.confirma === 'CAE-2'))
  assert.equal(caes.rpi.length, 5); assert.equal(caes.propias.length, 5)
  assert.ok(caes.rpi.every((r) => r.pregunta.endsWith('?') && r.deSerAsi && r.atencion))
})
await caso('el cruce de los pasos corre todos los D+n', () => {
  const c8 = D.caePorFases({ ...ctx, cruce: 8 })
  assert.equal(c8.probable.fases[0].acciones[0].dia, 8)
  assert.ok(Math.abs(c8.probable.dEmpeno - (caes.probable.dEmpeno + 3)) < 1e-6, `${c8.probable.dEmpeno} vs ${caes.probable.dEmpeno + 3}`)
})

console.log('la IA')
const prompt = D.promptIA({ ejercicio: foto.nombre, resumen: M.resumenTeatro(areas), analisis, prc, unidades, ains, nudos, modelo, caes, cruce: 5, objetivo: 'Salar de Uyuni', notas: { paso3: 'tropa no aclimatada' } })
await caso('el prompt lleva el teatro, las DEOP con D+n, las GG.UU., las A.I.N., la doctrina y el formato JSON', () => {
  assert.ok(prompt.length > 4000, `${prompt.length} caracteres`)
  for (const s of ['## 1. Teatro', '## 2. Direcciones', 'DEOP 1', 'DEOP 2', '## 3. Grandes Unidades', 'ENEMIGO', 'PROPIO', '## 4. Áreas de Interés Nombradas', 'AIN-1', '## 5. Doctrina', 'RDO Arts. 804', '## 7.', '```json', '"decisionesPropias"', 'tropa no aclimatada', 'Salar de Uyuni']) assert.ok(prompt.includes(s), 'falta: ' + s)
  assert.ok(!/undefined|NaN|\[object/.test(prompt), 'sin undefined/NaN')
})
await caso('lee la respuesta de la IA (JSON solo o en ```json), la valida y la monta sobre el motor', () => {
  const malo = D.leerRespuestaIA('hola'); assert.equal(malo.ok, false)
  const sinCae = D.leerRespuestaIA('{"modelo":{}}'); assert.equal(sinCae.ok, false)
  const resp = '```json\n' + JSON.stringify({
    modelo: { descripcion: 'SATURNO ataca con la DE-I por Pisiga.', bav: ['PC de la DE-I'], decisiones: [{ id: 'PD-E1', decision: 'Empeñar la reserva', ventana: 'D+10 a D+12', donde: 'Huachacalla' }] },
    cae: [
      { id: 'CAE-1', tipo: 'probable', deop: 2, enunciado: 'Enunciado IA del probable.', fases: [{ id: 'F-I', ventana: 'D a D+5', acciones: [{ quien: '3ª Brig. Acor.', que: 'apresto', lugar: 'Ollagüe', dia: 'D+5' }, 'Brig. Aviación: superioridad aérea'] }], reserva: { magnitud: '2ª Brig. Acor.', ubicacion: 'Pozo Almonte', empeno: 'D+11 por Julaca', direcciones: ['a) Julaca'], condicion: 'brecha abierta' }, porque: ['porque sí'] },
      { id: 'CAE-2', tipo: 'peligroso', deop: 1, enunciado: 'Enunciado IA del peligroso.', fases: [], reserva: {}, porque: [] },
    ],
    matriz: [{ ain: 'AIN-1', lugar: 'Chungará', indicador: 'tanques', ventana: 'D+5 a D+7', confirma: 'CAE-2' }],
    rpi: [{ id: 'RPI-1', pregunta: '¿Dónde está la 2ª Brig. Acor.?', deSerAsi: 'CAE-2', atencion: 'Pozo Almonte' }],
    decisionesPropias: [{ id: 'PD-1', decision: 'Mover la reserva', aMasTardar: 'D+6', ain: 'AIN-R', ais: 'Patacamaya' }],
  }) + '\n```'
  const r = D.leerRespuestaIA(resp)
  assert.ok(r.ok, r.error)
  assert.equal(r.datos.cae.length, 2); assert.equal(r.datos.cae[1].tipo, 'peligroso')
  assert.equal(r.datos.cae[0].fases[0].acciones.length, 2); assert.equal(r.datos.cae[0].fases[0].acciones[1].que, 'Brig. Aviación: superioridad aérea')
  const v = D.vista(modelo, caes, r.datos)
  assert.equal(v.fuente, 'IA'); assert.equal(v.caes.probable.enunciado, 'Enunciado IA del probable.'); assert.equal(v.caes.probable.fuente, 'IA')
  assert.ok(v.caes.probable.fases.length === 4, 'las posiciones del motor siguen para la carta')
  assert.equal(v.caes.probable.fasesIA.length, 1); assert.equal(v.caes.matriz.length, 1); assert.equal(v.modelo.descripcion, 'SATURNO ataca con la DE-I por Pisiga.')
  const sinIA = D.vista(modelo, caes, null); assert.equal(sinIA.fuente, 'motor'); assert.equal(sinIA.caes.probable.enunciado, caes.probable.enunciado)
  // texto peligroso en la respuesta: queda escapado en el Word y el KML
  const r2 = D.leerRespuestaIA(JSON.stringify({ cae: [{ id: 'CAE-1', enunciado: '<script>alert(1)</script> & co' }] }))
  const html = D.textoCaes({ caes: D.vista(modelo, caes, r2.datos).caes })
  assert.ok(!html.includes('<script>') && html.includes('&lt;script&gt;'))
})

console.log('salidas')
await caso('KML: carpetas 10–12 con fichas por fase, recorridos y matriz; el KML del teatro las incluye', () => {
  const carpetas = D.kmlCaes(caes)
  assert.ok(carpetas.length >= 2 && carpetas.join('').includes('<Folder><name>10 CAE-1') && carpetas.join('').includes('11 CAE-2') && carpetas.join('').includes('12 Matriz'))
  const kml = A.kmlDelTeatro({ ejercicio: foto.nombre, anillo: ai.anillo, analisis, teatro, ains, nudos, unidades, capas, carpetasExtra: carpetas, estilosExtra: D.ESTILOS_KML_CAE })
  assert.ok(kml.includes('id="reserva"') && kml.includes('recorrido por fases') && kml.endsWith('</Document></kml>'))
  const abre = (kml.match(/<Folder>/g) || []).length, cierra = (kml.match(/<\/Folder>/g) || []).length
  assert.equal(abre, cierra, 'carpetas balanceadas')
  // lo lee el mismo lector de KMZ de la Mesa
  const pms = placemarks(leerXml(kml), { conLineas: true })
  assert.ok(pms.some((p) => /CAE-1/.test(p.camino.join('/')) && p.tipo === 'punto'))
})
await caso('Word: la plantilla doctrinal y los CAE por fases se suman al párrafo de la Apreciación', () => {
  const extras = D.textoCaes({ modelo, caes, cruce: 5 })
  assert.ok(extras.includes('MODELO DE LA AMENAZA') && extras.includes('CURSOS DE ACCIÓN DEL ENEMIGO POR FASES') && extras.includes('Matriz de eventos') && extras.includes('RPI-1'))
  const todo = A.textoApreciacion({ ejercicio: foto.nombre, resumen: M.resumenTeatro(areas), efectos: A.resumenEfectos(capas, red, ai.anillo), analisis, nudos, ains, prc, cae, unidades, notas: {}, extras })
  assert.ok(todo.indexOf('POSIBILIDADES DEL ENEMIGO') < todo.indexOf('MODELO DE LA AMENAZA') && todo.indexOf('CURSOS DE ACCIÓN DEL ENEMIGO POR FASES') < todo.indexOf('Fuente del terreno'))
})
await caso('sin DEOP no rompe nada', () => {
  assert.equal(D.modeloAmenaza({ ...ctx, analisis: [], prc: [], cae: null }), null)
  assert.equal(D.caePorFases({ ...ctx, analisis: [], prc: [], cae: null }), null)
  assert.equal(D.kmlCaes(null).length, 0)
  assert.equal(D.textoCaes({}), '')
  const v = D.vista(null, null, null); assert.equal(v.fuente, 'motor')
})

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\ntodo bien')
process.exit(fallas ? 1 : 0)
