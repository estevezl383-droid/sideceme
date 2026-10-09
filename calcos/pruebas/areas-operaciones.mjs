import assert from 'node:assert/strict'
import fs from 'node:fs'
import { listarAreas, agregarArea, seleccionarArea, editarArea, borrarAreaActiva, paqueteAreas, importarAreas } from '../areas-operaciones/modelo.mjs'
const area = { coords: [[0, 0], [1, 0], [1, 1]], nombre: 'Primera' }
const original = { areaOps: area, tareas: [{ id: 'no-tocar' }] }
const antes = JSON.stringify(original)
const dos = agregarArea(original, { ...area, nombre: 'Segunda' })
assert.equal(listarAreas(dos).length, 2)
assert.equal(JSON.stringify(original), antes)
const primera = seleccionarArea(dos, 'ao-original')
const editada = { ...primera, areaOps: { ...primera.areaOps, coords: [[0, 0], [2, 0], [2, 2]] } }
const vuelta = seleccionarArea(seleccionarArea(editada, dos.areaOps.id), 'ao-original')
assert.deepEqual(vuelta.areaOps.coords, editada.areaOps.coords)
assert.equal(listarAreas(vuelta).length, 2)
const nombrada = editarArea(vuelta, 'ao-original', { unidad: 'Unidad docente', operacion: 'Ejercicio B' })
const p = paqueteAreas(nombrada, ['ao-original'], 'Ejercicio A')
assert.equal(p.areas.length, 1)
assert.equal(p.planFuegos, undefined)
const destino = { areaOps: area, planFuegos: { blancos: [{ id: 'propio' }] }, tareas: [{ id: 'propia' }] }
const transferida = importarAreas(destino, p)
assert.equal(listarAreas(transferida).length, 2)
assert.equal(transferida.planFuegos, destino.planFuegos)
assert.equal(transferida.tareas, destino.tareas)
assert.equal(transferida.areaOps.origen.ejercicio, 'Ejercicio A')
assert.equal(listarAreas(borrarAreaActiva(transferida)).length, 1)
assert.throws(() => importarAreas(destino, { ...p, areas: [area, { coords: [[NaN, 0], [0, 0], [0, 1]] }] }))
const src = fs.readFileSync(new URL('../assets/index-areas-20261009.js', import.meta.url), 'utf8')
const reset = src.slice(src.indexOf('Av=je.useCallback'), src.indexOf('xC=je.useCallback'))
assert.ok(reset.includes('setPlanFuegos(null)'))
assert.ok(reset.includes('setAcadMesa(null)'))
assert.ok(src.includes('setPlanFuegos(Ee.planFuegos||null)'))
console.log('Áreas: conservación, selección, edición, transferencia parcial, borrado individual y validación OK; reset de ejercicio OK.')
