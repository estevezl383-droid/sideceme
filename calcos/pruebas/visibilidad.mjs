import { test } from 'node:test'
import assert from 'node:assert/strict'
import { establecerGrupo, alternarArea, sumarAviso } from '../visibilidad/v1/panel.mjs'
import { areasEnMapa } from '../areas-interes/modelo.mjs'

test('el ojo de grupo cambia todas las capas y sus subcapas, conservando las demás', () => {
  const anterior = { plantilla: true, 'plantilla:ejes': false, maniobra: false, 'maniobra:ataque': false, clave: true }
  const oculto = establecerGrupo(anterior, ['plantilla', 'maniobra'], false)
  for (const k of ['plantilla', 'plantilla:ejes', 'maniobra', 'maniobra:ataque']) assert.equal(oculto[k], false)
  const visible = establecerGrupo(oculto, ['plantilla', 'maniobra'], true)
  for (const k of ['plantilla', 'plantilla:ejes', 'maniobra', 'maniobra:ataque']) assert.equal(visible[k], true)
  assert.equal(visible.clave, true)
  assert.equal(anterior['plantilla:ejes'], false)
})
test('activar un área con todo apagado muestra sólo la elegida', () => {
  const areas = [{ id: 'uno' }, { id: 'dos' }, { id: 'tres' }]
  const estado = alternarArea({ areaInteres: false }, areas, 'dos')
  assert.equal(estado.areaInteres, true)
  assert.equal(estado['areaInteres:uno'], false)
  assert.equal(estado['areaInteres:dos'], true)
  assert.equal(estado['areaInteres:tres'], false)
  assert.equal(alternarArea(estado, areas, 'dos').areaInteres, false)
})
test('los ojos no modifican la geometría usada para generar calcos', () => {
  const geometry = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
  const aoi = { type: 'Feature', properties: { areasInteres: [{ id: 'uno', nombre: 'Uno', geometry }, { id: 'dos', nombre: 'Dos', geometry }] }, geometry }
  const antes = JSON.stringify(aoi)
  assert.equal(areasEnMapa(aoi, { 'areaInteres:uno': false }).features.length, 1)
  assert.equal(areasEnMapa(aoi, { areaInteres: false }).features.length, 0)
  assert.equal(areasEnMapa(aoi).features.length, 2)
  assert.equal(JSON.stringify(aoi), antes)
})
test('un aviso repetido por varias capas aparece una sola vez', () => {
  assert.equal(sumarAviso('A · B · A', 'B'), 'A · B')
  assert.equal(sumarAviso('', 'Falta una zona'), 'Falta una zona')
  assert.equal(sumarAviso('Falta una zona', 'Otro problema'), 'Falta una zona · Otro problema')
})
