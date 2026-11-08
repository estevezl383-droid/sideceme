// ⊞ Disgregar una gran unidad en sus dependientes (calcos/disgregar/v1/disgregar.mjs).
// El caso de Sergio: el CE-I es una sola ficha en la carta, el GALM-1 (en refuerzo) ya está puesto, y
// quiere que el CE-I quede como Puesto Comando con DIV MEC-2, DIV-1 y DIV-6 alrededor.
//   node disgregar.mjs
import assert from 'node:assert/strict'
import { leerDependientes, inmediatas, fuenteDependientes, disgregar, reagrupar, accionDisgregar, puedeDisgregarse, clasificar, mismaUnidad, filasMovimientos, sinSuperior, mismaUnidadOSuperior, organizacionDeDocumentos } from '../disgregar/v1/disgregar.mjs'

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

caso('fichas de Google Earth con el superior pegado («DIV MEC-2 – CE-I»): no se duplican (08-11-2026)', () => {
  // Sergio pasó sus fichas del KMZ al ejercicio y después disgrega el CE-I.
  const kmz = [
    ce, galm, enemigo,
    { id: 10, bando: 'propias', tipo: 'unidad', escalon: 'division', arma: 'mecanizada', designacion: 'DIV MEC -2 – CE-I', lat: -18.4, lng: -68.7 },
    { id: 11, bando: 'propias', tipo: 'unidad', escalon: 'division', arma: 'infanteria', designacion: 'DIV-1 – CE-II', lat: -18.3, lng: -68.6 },
  ]
  const r = disgregar(kmz, 1, leerDependientes(ordenSup.organizacionTarea, 'CE-I'))
  // DIV MEC-2 ya estaba (con «– CE-I»): queda vinculada; la DIV-1 del CE-II NO es la del CE-I.
  assert.deepEqual(r.yaEstaban.map((u) => u.id).sort(), [10, 2])
  assert.deepEqual(r.nuevas.map((u) => u.designacion), ['DIV-1', 'DIV-6'])
  assert.equal(r.unidades.find((u) => u.id === 10).dependeDe, 1)
  assert.equal(r.unidades.find((u) => u.id === 11).dependeDe, undefined)
  assert.equal(sinSuperior('DIV MEC -1 – CE-I', 'CE-I'), 'DIV MEC -1')
  assert.equal(sinSuperior('1ª Brig. «X» – Chungará'), '1ª Brig. «X» – Chungará')
  assert.ok(mismaUnidadOSuperior('AGRP. LOG. – CE-I', 'AGRP LOG'))
  assert.ok(!mismaUnidadOSuperior('DIV-1', 'DIV-12'))
})

caso('los apéndices de un tema base: COE con «Dependencia orgánica», «Dependencias del…», «… comprenden …» (08-11-2026)', () => {
  const docs = [
    { nombre: 'APENDICE_01.docx', texto: 'APÉNDICE “1” (Organigrama del CTO) AL ANEXO “C”\nDependencias del CTO: FF.TT.TO., CATO (FAB), CNTO (Armada) y DIV. VANTS. «Cóndor».' },
    { nombre: 'APENDICE_02.docx', texto: 'APÉNDICE “2” (Organigrama de las FF.TT.TO.)\nLas FF.TT.TO. comprenden los CE-I, CE-II, CE-III y CE-IV, y las UU.FF.EE. Cada cuerpo de ejército comprende tres divisiones.' },
    { nombre: 'APENDICE_03.docx', texto: 'APÉNDICE “3” (Organigrama del CE-I)\nI.- ORGANIGRAMA DEL CE-I.\nLa agrupación logística depende del cuerpo de ejército.' }, // el organigrama era una imagen
    { nombre: 'APENDICE_08.docx', texto: 'APÉNDICE “8” (COE de la DIV-3) AL ANEXO “C”\nDependencia orgánica: CE-I.  Dotación del modelo.\nGRUPO\nCLASE\nCMDO.\nCOMP. CYS\nRI-A/3 *\nERM-3\nRAC-3\nSECC. AA-3\nTOTAL\nPERSONAL' },
    { nombre: 'APENDICE_09.docx', texto: 'APÉNDICE “9” (COE de la DIV-9)\nDependencia orgánica: CE-I.\nGRUPO\nCLASE\nCMDO.\nRI-33\nTOTAL' },
  ]
  const org = Object.fromEntries(organizacionDeDocumentos(docs).map((o) => [o.de, o.hijos]))
  assert.deepEqual(org['CE-I'], ['DIV-3', 'DIV-9'])
  assert.deepEqual(org['FF.TT.TO'], ['CE-I', 'CE-II', 'CE-III', 'CE-IV', 'UU.FF.EE'])
  assert.deepEqual(org['DIV-3'], ['COMP. CYS', 'RI-A/3 *', 'ERM-3', 'RAC-3', 'SECC. AA-3'])
  assert.ok(org.CTO.includes('CATO'))
  // CE-I: los COE + la ficha de Google Earth que dice depender de él («AGRP. LOG. – CE-I», sin número).
  const carta = [ce, { id: 20, bando: 'propias', tipo: 'unidad', escalon: 'division', arma: 'logistica', designacion: 'AGRP. LOG. – CE-I', lat: -18, lng: -68 }]
  const f = fuenteDependientes({ madre: ce, ordenSup: {}, documentos: docs, unidades: carta })
  assert.deepEqual(f.lista.map((u) => u.designacion), ['DIV-3', 'DIV-9', 'AGRP. LOG. – CE-I'])
  assert.match(f.de, /2 documentos del ejercicio .* y las fichas de la carta/)
  // DIV-3 (como viene de Google Earth): su COE, con compañías, escuadrón y sección clasificados.
  const d3 = { id: 21, bando: 'propias', tipo: 'unidad', escalon: 'division', arma: 'infanteria', designacion: 'DIV-3 – CE-I', lat: -18, lng: -68 }
  const g = fuenteDependientes({ madre: d3, documentos: docs, unidades: [d3] })
  assert.deepEqual(g.lista.map((u) => `${u.designacion}:${u.escalon}`), ['RI-A/3:regimiento', 'ERM-3:compania', 'RAC-3:regimiento', 'SECC. AA-3:seccion'])
  // Sin nada que leer, el aviso explica lo del organigrama como imagen.
  let msg = ''
  accionDisgregar({ unidades: [ce], id: 1, documentos: [docs[2]], preguntar: (m) => { msg = m; return null } })
  assert.match(msg, /IMAGEN en el Word/)
})

console.log(`disgregar: ${n} casos ✔`)
