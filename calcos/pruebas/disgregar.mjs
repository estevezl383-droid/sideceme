// ⊞ Disgregar una gran unidad en sus dependientes (calcos/disgregar/v1/disgregar.mjs).
// El caso de Sergio: el CE-I es una sola ficha en la carta, el GALM-1 (en refuerzo) ya está puesto, y
// quiere que el CE-I quede como Puesto Comando con DIV MEC-2, DIV-1 y DIV-6 alrededor.
//   node disgregar.mjs
import assert from 'node:assert/strict'
import { leerDependientes, inmediatas, fuenteDependientes, disgregar, reagrupar, accionDisgregar, puedeDisgregarse, clasificar, mismaUnidad, filasMovimientos } from '../disgregar/v1/disgregar.mjs'

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }

const ce = { id: 1, bando: 'propias', tipo: 'unidad', escalon: 'cuerpo', arma: 'infanteria', designacion: 'CE-I', lat: -18.5, lng: -68.9 }
const galm = { id: 2, bando: 'propias', tipo: 'unidad', escalon: 'batallon', arma: 'artilleria', designacion: 'GALM-1', lat: -18.6, lng: -68.8 }
const enemigo = { id: 3, bando: 'enemigo', tipo: 'unidad', escalon: 'division', arma: 'blindada', designacion: 'DIV-1', lat: -18.2, lng: -69.1 }
const carta = [ce, galm, enemigo]
const ordenSup = { organizacionTarea: 'CE-I: DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo' }

caso('lee la organización de la Orden (una línea)', () => {
  const l = leerDependientes(ordenSup.organizacionTarea, 'CE-I')
  assert.deepEqual(l.map((u) => u.designacion), ['DIV MEC-2', 'DIV-1', 'DIV-6', 'GALM-1'])
  assert.deepEqual(l.map((u) => u.escalon), ['division', 'division', 'division', 'batallon'])
  assert.equal(l[0].arma, 'mecanizada')
  assert.equal(l[1].arma, 'infanteria')
  assert.equal(l[3].arma, 'artilleria')
  assert.equal(l[3].relacion, 'en refuerzo')
})

caso('lee la lista una por renglón, como la escribió Sergio', () => {
  const l = leerDependientes('DIV MEC-2\n-\tDIV-1\n-\tDIV-6\n-\tGALM-1 (en refuerzo)', 'CE-I')
  assert.deepEqual(l.map((u) => u.designacion), ['DIV MEC-2', 'DIV-1', 'DIV-6', 'GALM-1'])
  assert.equal(l[3].relacion, 'en refuerzo')
})

caso('la sigla: DIV-1 no es DIV-12 ni DIV MEC-1; DIV.MEC.-2 = DIV MEC-2', () => {
  assert.ok(mismaUnidad('DIV.MEC.-2', 'DIV MEC-2'))
  assert.ok(!mismaUnidad('DIV-1', 'DIV-12'))
  assert.ok(!mismaUnidad('DIV-1', 'DIV MEC-1'))
  assert.equal(clasificar('CE-I').escalon, 'cuerpo')
  assert.equal(clasificar('BRIG MEC-1').escalon, 'brigada')
  assert.equal(clasificar('RIM-8').arma, 'mecanizada')
})

caso('sólo las inmediatas: los regimientos de una división no son del CE (los apoyos sí)', () => {
  const l = leerDependientes('DIV MEC-2, DIV-1, RIM-8, BAT ING-3, GALM-1 (en refuerzo)', 'CE-I')
  assert.deepEqual(inmediatas(l, 'cuerpo').map((u) => u.designacion), ['DIV MEC-2', 'DIV-1', 'BAT ING-3', 'GALM-1'])
})

caso('de dónde: MESA EM; si no, el bloque de la unidad en los documentos', () => {
  assert.equal(fuenteDependientes({ madre: ce, ordenSup }).lista.length, 4)
  const docs = [{ nombre: 'Orden de Operaciones 01', texto: 'II.- MISIÓN\n...\nCE-I\n- DIV MEC-2\n- DIV-1\n- DIV-6\n- GALM-1 (en refuerzo)\n\nIII.- EJECUCIÓN' }]
  const f = fuenteDependientes({ madre: ce, ordenSup: {}, documentos: docs })
  assert.deepEqual(f.lista.map((u) => u.designacion), ['DIV MEC-2', 'DIV-1', 'DIV-6', 'GALM-1'])
  assert.match(f.de, /Orden de Operaciones 01/)
  // La organización de OTRA unidad en MESA EM no se toma para el CE-I.
  assert.equal(fuenteDependientes({ madre: ce, ordenSup: { organizacionTarea: 'DIV MEC-1: RIM-8, RIM-23' } }).lista.length, 0)
})

caso('disgregar: el CE-I pasa a PC, aparecen las 3 divisiones y el GALM-1 no se duplica', () => {
  const r = disgregar(carta, 1, leerDependientes(ordenSup.organizacionTarea, 'CE-I'))
  const pc = r.unidades.find((u) => u.id === 1)
  assert.equal(pc.tipo, 'pc')
  assert.equal(pc.designacion, 'CE-I')
  assert.deepEqual(r.nuevas.map((u) => u.designacion), ['DIV MEC-2', 'DIV-1', 'DIV-6'])
  assert.ok(r.nuevas.every((u) => u.dependeDe === 1 && u.bando === 'propias' && u.tipo === 'unidad' && u.escalon === 'division'))
  assert.equal(r.unidades.filter((u) => /GALM/.test(u.designacion)).length, 1)
  const g = r.unidades.find((u) => u.id === 2)
  assert.equal(g.dependeDe, 1)
  assert.equal(g.relacion, 'en refuerzo')
  // La DIV-1 enemiga no cuenta como «ya está»: la propia se pone igual.
  assert.ok(r.nuevas.some((u) => u.designacion === 'DIV-1'))
  assert.equal(r.unidades.length, 6)
  // Alrededor del PC, todas en lugares distintos.
  assert.equal(new Set(r.nuevas.map((u) => `${u.lat},${u.lng}`)).size, 3)
  assert.ok(r.nuevas.every((u) => Math.abs(u.lat - ce.lat) < 0.1 && Math.abs(u.lng - ce.lng) < 0.1))
})

caso('reagrupar: vuelve todo como estaba (el GALM-1 se queda, sin dependeDe)', () => {
  const r = disgregar(carta, 1, leerDependientes(ordenSup.organizacionTarea, 'CE-I'))
  const v = reagrupar(r.unidades, 1)
  assert.equal(v.quitadas.length, 3)
  assert.deepEqual(v.unidades, carta.map((u) => (u.id === 2 ? { ...u, relacion: 'en refuerzo' } : u)))
})

caso('el botón: propone la lista, el oficial la corrige y se disgrega; con la madre hecha PC, reagrupa', () => {
  let visto = ''
  const r = accionDisgregar({ unidades: carta, id: 1, ordenSup, preguntar: (m, v) => ((visto = v), 'DIV MEC-2, DIV-1, DIV-6, GALM-1 (en refuerzo)') })
  assert.equal(visto, 'DIV MEC-2, DIV-1, DIV-6, GALM-1 (en refuerzo)')
  assert.equal(r.unidades.length, 6)
  assert.match(r.aviso, /Puesto Comando/)
  assert.match(r.aviso, /GALM-1/)
  assert.equal(accionDisgregar({ unidades: carta, id: 1, ordenSup, preguntar: () => null }), null)
  const v = accionDisgregar({ unidades: r.unidades, id: 1, confirmar: () => true })
  assert.equal(v.unidades.length, 3)
  assert.ok(puedeDisgregarse(r.unidades.find((u) => u.id === 1)))
  assert.ok(!puedeDisgregarse(galm))
  assert.ok(!puedeDisgregarse(enemigo))
})

caso('F2·SAL Movimientos iniciales: un renglón por dependiente, sin repetir los que ya puso la Mesa', () => {
  const r = disgregar(carta, 1, leerDependientes(ordenSup.organizacionTarea, 'CE-I'))
  const f = filasMovimientos(r.unidades, [{ Unidad: 'GALM-1' }])
  assert.deepEqual(f.map((x) => x.Unidad), ['DIV MEC-2', 'DIV-1', 'DIV-6'])
  assert.match(f[0].Observaciones, /Dependiente de CE-I/)
})

console.log(`disgregar: ${n} casos ✔`)
