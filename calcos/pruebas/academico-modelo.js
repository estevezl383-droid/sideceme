// Organización académica (calcos/academico/academico.js): fuerzas de tarea y
// unidades puras, tipo vs. pertenencia, edición manual, duplicados y
// actividades. Todo con unidades FICTICIAS (ejercicio-ficticio.js).
//
// Las piezas se arman con tN() y js() sacadas TAL CUAL del compilado que carga
// calcos/index.html: son los mismos identificadores que usa la Mesa.
//
//   cd calcos/pruebas && npm install && node academico-modelo.js
const assert = require('assert')
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const M = require('../academico/academico.js')
const { ejercicioFicticio } = require('./ejercicio-ficticio')

const archivo = process.argv[2] || vigente()
const C = cargarConDependencias(archivo, ['tN', 'js', 'pLe', 'T1', 'fl'], (c) => {
  for (const u of [{ id: 'a', arma: 'ingenieria', escalon: 'batallon', designacion: 'X' }, { id: 'b', arma: 'cabmec', escalon: 'regimiento' }]) c.tN(u, c.js(u))
})
console.log(`\nCompilado: ${archivo.replace(/.*calcos\//, 'calcos/')}\n`)

const contexto = (datos) => ({
  unidades: datos.unidades,
  orgTarea: datos.orgTarea,
  piezasDe: (u) => C.tN(u, C.js(u)),
  rotulo: (u) => C.js(u),
  simbolos: { pLe: C.pLe },
})
const piezaDe = (ctx, id) => M.piezasDelCalco(ctx).porId.get(id).pieza
const errores = (ctx) => M.validar(ctx).filter((a) => a.nivel === 'error')
const claves = (ctx) => M.validar(ctx).map((a) => a.clave)

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

caso('Las piezas del ejercicio de prueba son las mismas que arma la Mesa (tN)', () => {
  const d = ejercicioFicticio()
  const ctx = contexto(d)
  // (JSON: los objetos que devuelve el compilado vienen de otro contexto de vm)
  for (const o of d.orgTarea) for (const p of o.piezas) assert.deepStrictEqual(JSON.parse(JSON.stringify(piezaDe(ctx, p.id))), p, `pieza ${p.id}`)
})

caso('La organización existente (sin «clase») se lee igual: FT y agrupación, mismos id, sin errores', () => {
  const d = ejercicioFicticio()
  const ctx = contexto(d)
  assert.deepStrictEqual(d.orgTarea.map((o) => [o.id, M.claseDe(o)]), [
    ['ag-1700000000000-0', 'ft'],
    ['ag-1700000000000-1', 'agrupacion'],
  ])
  assert.deepStrictEqual(errores(ctx), [])
})

caso('Fuerza de tarea y unidad pura conviven (y la agrupación de antes también)', () => {
  const d = ejercicioFicticio()
  let org = d.orgTarea
  const r = M.nuevaOrganizacion(org, { clase: 'pura', nombre: 'ARTILLERÍA «CHARLIE» (FICT.)', arma: 'artilleria' }, 1800000000000)
  org = r.orgTarea
  const ctx0 = contexto({ ...d, orgTarea: org })
  for (const n of [1, 2, 3]) org = M.asignar(org, piezaDe(ctx0, `fict-charlie-${n}`), r.id)
  const ctx = contexto({ ...d, orgTarea: org })
  const res = M.resumen(ctx)
  assert.deepStrictEqual([res.ft, res.puras, res.agrupaciones], [1, 1, 1])
  assert.deepStrictEqual(errores(ctx), [])
  assert.ok(!claves(ctx).includes('pura-mixta'))
  // DELTA (ingenieros) sigue entera con su unidad orgánica: no es obligatorio integrarla.
  assert.deepStrictEqual(res.purasOrganicas.map((u) => u.id), ['fict-delta'])
})

caso('No obliga a integrar: sin organizaciones no hay ni errores ni avisos', () => {
  const d = { ...ejercicioFicticio(), orgTarea: [] }
  const ctx = contexto(d)
  assert.deepStrictEqual(M.validar(ctx), [])
  const res = M.resumen(ctx)
  assert.strictEqual(res.integrados, 0)
  assert.strictEqual(res.conSuUnidad, 12)
  assert.strictEqual(res.purasOrganicas.length, 4)
})

caso('Tipo y pertenencia son cosas distintas: mover un elemento no cambia su tipo', () => {
  const d = ejercicioFicticio()
  const ctx = contexto(d)
  const p = piezaDe(ctx, 'fict-bravo-2')
  const org = M.asignar(d.orgTarea, p, 'ag-1700000000000-0')
  assert.strictEqual(M.pertenencia(org, 'fict-bravo-2'), 'ag-1700000000000-0')
  const movida = org[0].piezas.find((x) => x.id === 'fict-bravo-2')
  assert.deepStrictEqual([movida.simbolo, movida.escalon, movida.de], ['cab_blindada', 'compania', 'fict-bravo'])
  assert.strictEqual(M.armaDePieza(movida, { pLe: C.pLe }), 'caballeria')
})

caso('Edición manual: el docente mueve un elemento de una organización a otra y lo devuelve a su unidad', () => {
  const d = ejercicioFicticio()
  const ctx = contexto(d)
  const inf3 = piezaDe(ctx, 'fict-alfa-3')
  let org = M.asignar(d.orgTarea, inf3, 'ag-1700000000000-0') // de CÓNDOR a ÁGUILA
  assert.strictEqual(M.pertenencia(org, 'fict-alfa-3'), 'ag-1700000000000-0')
  assert.strictEqual(M.ocurrencias(org).get('fict-alfa-3').length, 1, 'quedó en dos lados')
  org = M.asignar(org, inf3, null) // con su unidad orgánica
  assert.strictEqual(M.pertenencia(org, 'fict-alfa-3'), null)
  assert.deepStrictEqual(errores(contexto({ ...d, orgTarea: org })), [])
})

caso('Conserva identificadores y campos que no se tocan (consolidada, tarea, propósito…)', () => {
  const d = ejercicioFicticio()
  d.orgTarea[0] = { ...d.orgTarea[0], consolidada: true, tarea: 'fijar', proposito: 'texto', otroCampo: 42 }
  const ctx = contexto(d)
  let org = M.asignar(d.orgTarea, piezaDe(ctx, 'fict-bravo-3'), 'ag-1700000000000-0')
  org = M.actualizarOrganizacion(org, 'ag-1700000000000-0', { nombre: 'FT «ÁGUILA» (FICT.) *', id: 'no-se-cambia', piezas: [] })
  org = M.cambiarClase(org, 'ag-1700000000000-1', 'pura', 'caballeria')
  assert.deepStrictEqual(org.map((o) => o.id), ['ag-1700000000000-0', 'ag-1700000000000-1'])
  const a = org[0]
  assert.deepStrictEqual([a.consolidada, a.tarea, a.proposito, a.otroCampo, a.operacion, a.escalon], [true, 'fijar', 'texto', 42, 'od', 'batallon'])
  assert.strictEqual(a.piezas.length, 4, 'actualizarOrganizacion no puede tocar las piezas')
  assert.strictEqual(org[1].operacion, 'oc1')
  // Lo que no cambió sigue siendo el MISMO objeto (no se reescribe de gusto).
  const sinCambio = M.asignar(d.orgTarea, piezaDe(ctx, 'fict-alfa-1'), 'ag-1700000000000-0')
  assert.strictEqual(sinCambio, d.orgTarea)
})

caso('Cambiar la clase: pura lleva arma y no es FT; FT no lleva arma', () => {
  const d = ejercicioFicticio()
  let org = M.cambiarClase(d.orgTarea, 'ag-1700000000000-1', 'pura', 'ingenieria')
  assert.deepStrictEqual([org[1].clase, org[1].ft, org[1].arma], ['pura', false, 'ingenieria'])
  org = M.cambiarClase(org, 'ag-1700000000000-1', 'ft')
  assert.deepStrictEqual([org[1].clase, org[1].ft, 'arma' in org[1]], ['ft', true, false])
  assert.strictEqual(M.claseDe({ clase: 'pura', ft: true }), 'ft', '«Convertir en Fuerza de Tarea» del panel de siempre manda')
})

caso('Un elemento repetido (datos viejos) se detecta y se corrige con «Dejarla sólo en…»', () => {
  const d = ejercicioFicticio()
  const inf1 = d.orgTarea[0].piezas[0]
  d.orgTarea[1] = { ...d.orgTarea[1], piezas: [...d.orgTarea[1].piezas, inf1, inf1] } // dos veces en CÓNDOR y una en ÁGUILA
  const ctx = contexto(d)
  const dup = M.validar(ctx).find((a) => a.clave === 'duplicada')
  assert.ok(dup, 'no avisó el repetido')
  assert.strictEqual(dup.nivel, 'error')
  assert.deepStrictEqual(dup.acciones.map((x) => x.orgId), ['ag-1700000000000-0', 'ag-1700000000000-1'])
  const arreglado = M.dejarSoloEn(d.orgTarea, inf1.id, 'ag-1700000000000-1')
  assert.deepStrictEqual(M.ocurrencias(arreglado).get(inf1.id), ['ag-1700000000000-1'])
  assert.deepStrictEqual(errores(contexto({ ...d, orgTarea: arreglado })), [])
})

caso('Una unidad pura con elementos de otra arma avisa (no bloquea)', () => {
  const d = ejercicioFicticio()
  const ctx = contexto(d)
  const r = M.nuevaOrganizacion(d.orgTarea, { clase: 'pura', nombre: 'PURA', arma: 'ingenieria' }, 1)
  let org = M.asignar(r.orgTarea, piezaDe(ctx, 'fict-delta-1'), r.id)
  assert.ok(!claves({ ...ctx, orgTarea: org }).includes('pura-mixta'))
  org = M.asignar(org, piezaDe(ctx, 'fict-alfa-1'), r.id)
  const a = M.validar({ ...ctx, orgTarea: org }).find((x) => x.clave === 'pura-mixta')
  assert.ok(a && a.nivel === 'aviso', 'no avisó la mezcla de armas')
})

caso('Elementos que ya no están en el calco y fichas o unidades repetidas', () => {
  const d = ejercicioFicticio()
  const sinAlfa = { ...d, unidades: d.unidades.filter((u) => u.id !== 'fict-alfa') }
  const h = M.validar(contexto(sinAlfa)).filter((a) => a.clave === 'huerfana')
  assert.strictEqual(h.length, 3)
  assert.ok(h.every((a) => a.nivel === 'aviso' && a.acciones[0].acc === 'quitarDe'))
  const repetida = { ...d, unidades: [...d.unidades, { ...d.unidades[0] }] }
  assert.ok(claves(contexto(repetida)).includes('unidad-id-repetido'))
  const mismaDesig = { ...d, unidades: [...d.unidades, { ...d.unidades[0], id: 'otra' }] }
  assert.ok(claves(contexto(mismaDesig)).includes('designacion-repetida'))
  const fichas = { ...d, unidades: [...d.unidades, { id: 'f1', agId: 'ag-1700000000000-0', esAgrupacion: true }, { id: 'f2', agId: 'ag-1700000000000-0', esAgrupacion: true }] }
  assert.ok(claves(contexto(fichas)).includes('ficha-repetida'))
})

caso('Identificador nuevo con el formato de siempre y sin chocar', () => {
  const org = [{ id: 'ag-5-2', piezas: [] }, { id: 'ag-5-3', piezas: [] }]
  const r = M.nuevaOrganizacion(org, { clase: 'ft' }, 5)
  assert.strictEqual(r.id, 'ag-5-4')
  assert.deepStrictEqual(r.orgTarea.map((o) => o.id), ['ag-5-2', 'ag-5-3', 'ag-5-4'])
  assert.throws(() => M.nuevaOrganizacion(org, { clase: 'pura', arma: 'infanteria' }), /Arma no prevista/)
  assert.throws(() => M.asignar(org, { id: 'p' }, 'no-existe'), /No existe/)
})

caso('Actividades: validación, alta, edición y baja, vinculadas a mano', () => {
  const d = ejercicioFicticio()
  const ctx = contexto(d)
  const el = M.elementosVinculables(ctx)
  assert.ok(el.some((e) => e.clave === 'unidad:fict-charlie'))
  assert.ok(el.some((e) => e.clave === 'org:ag-1700000000000-0' && e.nom === 'FT «ÁGUILA» (FICT.)'))
  assert.deepStrictEqual(M.validarActividad({ vinculo: '', tipo: 'x', titulo: ' ' }, el).length, 3)
  const datos = { vinculo: 'unidad:fict-charlie', tipo: 'pregunta', titulo: '¿Qué tipo de unidad es?', texto: 'Respondé.', referencia: '' }
  assert.deepStrictEqual(M.validarActividad(datos, el), [])
  let a = M.agregarActividad(null, datos, 1800000000000, () => 0.5)
  assert.strictEqual(a.actividades.length, 1)
  assert.deepStrictEqual(a.actividades[0].vinculo, { tipo: 'unidad', id: 'fict-charlie' })
  a = M.editarActividad(a, a.actividades[0].id, { ...datos, tipo: 'lectura', titulo: 'Leer' }, 1800000000001)
  assert.deepStrictEqual([a.actividades[0].tipo, a.actividades[0].titulo, !!a.actividades[0].editada], ['lectura', 'Leer', true])
  a = M.borrarActividad(a, a.actividades[0].id)
  assert.deepStrictEqual(a.actividades, [])
  assert.deepStrictEqual(M.normalizarAcad(undefined), { version: 1, actividades: [] })
})

caso('Las actividades son de estudio: no llevan tarea, misión, fuego ni objetivo', () => {
  const a = M.agregarActividad(null, { vinculo: 'org:x', tipo: 'analisis', titulo: 'T', texto: 'x' }, 1, () => 0)
  assert.deepStrictEqual(Object.keys(a.actividades[0]).sort(), ['creada', 'id', 'referencia', 'texto', 'tipo', 'titulo', 'vinculo'])
})

caso('Ejemplo con unidades ficticias: FT, unidad pura y una unidad sin integrar, sin errores', () => {
  const ej = M.ejemploFicticio({ centro: { lat: -17, lng: -65 }, piezasDe: (u) => C.tN(u, C.js(u)), ahora: 1234 })
  assert.ok(ej.unidades.every((u) => u.ficticia && /\(FICT\.\)$/.test(u.designacion)))
  const ctx = contexto({ unidades: ej.unidades, orgTarea: ej.orgTarea })
  assert.deepStrictEqual(M.validar(ctx), [])
  const r = M.resumen(ctx)
  assert.deepStrictEqual([r.ft, r.puras, r.integrados, r.purasOrganicas.length], [1, 1, 6, 1])
  const claveAct = new Set(M.elementosVinculables(ctx).map((e) => e.clave))
  assert.ok(ej.academico.actividades.every((a) => claveAct.has(M.claveDe(a.vinculo))), 'actividad sin elemento')
})

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
