import { test } from 'node:test'
import assert from 'node:assert/strict'
import { agregarArea, listarAreas, quitarArea, renombrarArea, areasEnMapa } from '../areas-interes/modelo.mjs'

const cuadrado = (x = 0) => ({ type: 'Polygon', coordinates: [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]] })
const feature = (x = 0) => ({ type: 'Feature', properties: { nombre: 'Área dibujada' }, geometry: cuadrado(x) })
// Sólo se usa para comprobar el contrato de datos de sectores disjuntos. La
// unión geográfica real y el recorte se ejercitan en Chromium con el motor real.
const disjuntas = fc => ({ type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: fc.features.map(f => f.geometry.coordinates) } })
const cinco = () => Array.from({ length: 5 }, (_, i) => feature(i * 2)).reduce((a, f) => agregarArea(a, f, disjuntas), null)

test('abre áreas antiguas: Feature, geometría suelta y colección', () => {
  for (const aoi of [feature(), cuadrado(), { type: 'FeatureCollection', features: [feature(), feature(2)] }]) {
    const antes = JSON.stringify(aoi)
    assert.equal(listarAreas(aoi).length, aoi.type === 'FeatureCollection' ? 2 : 1)
    assert.equal(JSON.stringify(aoi), antes)
  }
})
test('cinco áreas conservan nombres, identidades y contornos al pasar por JSON', () => {
  const aoi = cinco(), vuelta = JSON.parse(JSON.stringify(aoi))
  assert.equal(listarAreas(vuelta).length, 5)
  assert.deepEqual(listarAreas(vuelta), listarAreas(aoi))
  assert.equal(new Set(listarAreas(aoi).map(a => a.id)).size, 5)
  assert.deepEqual(listarAreas(aoi).map(a => a.nombre), [1, 2, 3, 4, 5].map(i => `Área de Interés ${i}`))
  assert.equal(areasEnMapa(vuelta).features.length, 5)
})
test('se puede añadir una sexta sin modificar las cinco anteriores', () => {
  const anterior = cinco(), antes = JSON.stringify(anterior)
  const siguiente = agregarArea(anterior, feature(12), disjuntas)
  assert.equal(listarAreas(siguiente).length, 6)
  assert.equal(JSON.stringify(anterior), antes)
  assert.deepEqual(listarAreas(siguiente).slice(0, 5), listarAreas(anterior))
})
test('quitar una área conserva las otras y sus identidades', () => {
  const aoi = cinco(), areas = listarAreas(aoi)
  const nueva = quitarArea(aoi, areas[2].id, disjuntas)
  assert.deepEqual(listarAreas(nueva), areas.filter(a => a.id !== areas[2].id))
  assert.equal(listarAreas(aoi).length, 5)
  assert.equal(quitarArea(aoi, 'inexistente', disjuntas), aoi)
})
test('renombrar conserva la geometría del análisis y las otras áreas', () => {
  const aoi = cinco(), id = listarAreas(aoi)[1].id
  const nueva = renombrarArea(aoi, id, 'Sector norte')
  assert.equal(nueva.geometry, aoi.geometry)
  assert.equal(listarAreas(nueva)[1].nombre, 'Sector norte')
  assert.equal(listarAreas(aoi)[1].nombre, 'Área de Interés 2')
})
test('quitar la última área deja el análisis vacío', () => {
  const aoi = agregarArea(null, feature(), disjuntas)
  assert.equal(quitarArea(aoi, listarAreas(aoi)[0].id, disjuntas), null)
  assert.deepEqual(areasEnMapa(null).features, [])
})
test('los polígonos inválidos y un fallo de unión no borran las áreas previas', () => {
  const aoi = cinco(), antes = JSON.stringify(aoi)
  for (const geometry of [{ type: 'Point', coordinates: [0, 0] }, { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] },
    { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, NaN], [0, 0]]] }]) {
    assert.throws(() => agregarArea(aoi, { type: 'Feature', geometry }, disjuntas), /polígono|puntos/)
  }
  assert.throws(() => agregarArea(aoi, feature(20), () => { throw new Error('Unión rechazada') }), /Unión rechazada/)
  assert.equal(JSON.stringify(aoi), antes)
})
