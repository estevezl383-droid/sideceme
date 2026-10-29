import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cursosEnemigos, cursosPropios, vistaDelCurso } from '../visibilidad/v1/cursos.mjs'

test('los dos CAE mantienen los índices originales y las fases antiguas sin coa', () => {
  const fases = { enemigo: [{ nombre: 'Antigua' }, { coa: 'peligroso', n: 4, nombre: 'Peligrosa' }, { coa: 'probable', nombre: 'Probable II' }] }
  const cursos = cursosEnemigos(fases)
  assert.deepEqual(cursos.map(c => c.id), ['probable', 'peligroso'])
  assert.deepEqual(cursos[0].fases.map(f => f.idx), [0, 2])
  assert.deepEqual(cursos[1].fases.map(f => f.idx), [1])
  assert.deepEqual(cursos[0].fases.map(f => f.numero), [1, 2])
  assert.equal(cursos[1].fases[0].numero, 4, 'se conserva la numeración explícita del ejercicio')
})
test('muestra las fases del CAP activo y las del otro CAP guardado', () => {
  const fc = { propio: [{ nombre: 'CAP 2 vivo' }] }
  const g3 = { _caps: { activo: 2, guardados: { 1: { fases: [{ nombre: 'CAP 1 guardado' }] } } } }
  const cursos = cursosPropios(g3, fc)
  assert.equal(cursos[0].activo, false)
  assert.equal(cursos[0].fases[0].nombre, 'CAP 1 guardado')
  assert.equal(cursos[1].activo, true)
  assert.equal(cursos[1].fases, fc.propio)
})
const vista = () => ({ unidades: [{ id: 'azul', bando: 'propias' }, { id: 'rojo', bando: 'enemigo' }],
  ops: { areaOps: { coords: [[0, 0], [1, 0], [1, 1]] }, tareas: [{ id: 1 }], limites: [{ id: 2 }], obstaculos: [{ id: 3 }], posDef: [{ id: 4 }] },
  cmoc: { clave: [{ id: 5 }], desplazamientos: [{ id: 6 }] } })
test('ocultar el CAE sólo cambia la representación y conserva el AO y el terreno', () => {
  const original = vista(), antes = JSON.stringify(original)
  const oculta = vistaDelCurso(original, { bando: 'enemigo', idx: 0 }, { cae: false })
  assert.deepEqual(oculta.unidades.map(u => u.id), ['azul'])
  assert.deepEqual(oculta.ops.tareas, [])
  assert.deepEqual(oculta.ops.obstaculos, [])
  assert.equal(oculta.ops.areaOps, original.ops.areaOps)
  assert.equal(oculta.cmoc.clave, original.cmoc.clave)
  assert.equal(JSON.stringify(original), antes)
})
test('el CAP y el plan de barreras se pueden ocultar por separado', () => {
  const original = vista()
  const cap = vistaDelCurso(original, { bando: 'propio', idx: 0 }, { cap: false })
  assert.deepEqual(cap.unidades.map(u => u.id), ['rojo'])
  assert.deepEqual(cap.ops.tareas, [])
  assert.equal(cap.ops.obstaculos, original.ops.obstaculos)
  const barreras = vistaDelCurso(original, { bando: 'propio', idx: 0 }, { planBarreras: false })
  assert.deepEqual(barreras.ops.obstaculos, [])
  assert.deepEqual(barreras.ops.posDef, [])
  assert.deepEqual(barreras.unidades, original.unidades)
})
test('la referencia enemiga se oculta sin borrar las fuerzas propias', () => {
  const original = vista()
  const v = vistaDelCurso(original, { bando: 'propio', idx: 0 }, { cae: false })
  assert.deepEqual(v.unidades.map(u => u.id), ['azul'])
  assert.equal(v.ops, original.ops)
})
test('los cursos apagados no borran las fichas de trabajo que no pertenecen a una fase', () => {
  const original = vista()
  const v = vistaDelCurso(original, null, { cap: false, cae: false })
  assert.deepEqual(v.unidades, original.unidades)
  assert.equal(v.ops, original.ops)
})
