import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectar, escenario, calcularRuta, simplificar, hora } from '../assets/wargame-teatro.mjs'

const base = () => ({ tipo: 'sideceme-teatro-base', cod: 'abierto', vias: [[1, 'V1', 'Camino del juego', [[1,1],[1.1,1],[1.2,1],[1.3,1]]]],
  relieve: [], lagos: [], salares: [], fronteras: [], poblaciones: [['Pueblo ficticio', 2, 1.1, 1]], rios: [] })
const ficha = (extra = {}) => ({ designacion: 'FICHA A', tipo: 'unidad', escalon: 'brigada', arma: 'motorizada', bando: 'propias', lng: 1, lat: 1, ...extra })

test('la detección no convierte un escenario pequeño por la duración de su jornada', () => {
  assert.equal(detectar({ duracion_turno_horas: 24, unidades: [ficha()] }), false)
  assert.equal(detectar({ escala: 'teatro' }), true)
  assert.equal(detectar({ resultados: { picbTeatro: {} } }), true)
  assert.equal(detectar({ ordenSup: { unidad: 'FF.TT.T.O. FICTICIAS' } }), true)
  assert.equal(detectar({ ops: { areaOps: { nombre: 'SUBTEATRO FICTICIO', coords: [[0,0],[2,0],[2,2],[0,0]] } } }), true)
})

test('el importador filtra fichas pequeñas, respeta bandos y no fabrica sistemas de armas', async () => {
  const d = { nombre: 'JUEGO FICTICIO', escala: 'teatro', unidades: [ficha(), ficha({ designacion: 'FICHA B', escalon: 'cuerpo', bando: 'enemigas' }),
    ficha({ designacion: 'FICHA MENOR', escalon: 'batallon' }), ficha({ designacion: 'PC FICTICIO', tipo: 'pc', escalon: 'ejercito' }),
    ficha({ designacion: 'SIN POSICION', lat: null })] }
  const before = JSON.stringify(d), result = await escenario(d, null, base())
  assert.equal(result.escala, 'teatro'); assert.equal(result.unidades.length, 3)
  assert.deepEqual(result.unidades.map(u => u.bando), ['azul', 'rojo', 'azul'])
  assert.equal(result.unidades[2].poder_max, 10)
  assert.ok(result.unidades.every(u => !u.medios && !u.municion))
  assert.ok(result.terreno.some(t => t.tipo === 'poblado'))
  assert.equal(result.terreno.some(t => t.tipo === 'via'), false, 'No se sube la red completa al servidor')
  assert.equal(JSON.stringify(d), before)
})

test('la fase elegida determina las posiciones del escenario de teatro', async () => {
  const d = { unidades: [ficha()] }, fase = { nombre: 'Fase de juego B', unidades: [ficha({ lng: 1.3 })] }
  assert.equal((await escenario(d, fase, base())).unidades[0].lng, 1.3)
})

test('el recorte descarta terreno ajeno al tablero y acepta itinerarios sin puntos auxiliares', async () => {
  const b = base(), pol = (x,y) => [[[x,y],[x+.1,y],[x+.1,y+.1],[x,y]]]
  b.relieve = [[2, [pol(1,1), pol(30,30)]]]
  const d = { unidades: [ficha()], resultados: { picbTeatro: { teatro: { deop: [{ n: 1, linea: [[1,1],[1.3,1]] }] } } } }
  const result = await escenario(d, null, b)
  assert.equal(result.terreno.filter(t => t.tipo === 'severo').length, 1)
  assert.equal(result.terreno.filter(t => t.tipo === 'via').length, 1)
})

test('una ruta sobre la red conserva sus extremos y un máximo de sesenta puntos', async () => {
  const result = await calcularRuta([1,1], [[1.3,1]], base())
  assert.equal(result.mision, 'marcada')
  assert.deepEqual(result.ruta[0], [1,1]); assert.deepEqual(result.ruta.at(-1), [1.3,1])
  assert.ok(result.ruta.length <= 60)
})

test('sin cobertura, el movimiento se declara libre y no recibe la marca de carretera', async () => {
  const result = await calcularRuta([20,20], [[20.1,20.1]], base())
  assert.equal(result.porRed, false); assert.equal(result.mision, null)
  await assert.rejects(calcularRuta([null,1], [[1,1]], base()), /posición válida/)
})

test('la simplificación conserva los extremos de una ruta muy larga', () => {
  const input = Array.from({ length: 2000 }, (_,i) => [i / 10000, Math.sin(i / 10) / 10000])
  const result = simplificar(input)
  assert.ok(result.length <= 60)
  assert.deepEqual(result[0], input[0]); assert.deepEqual(result.at(-1), input.at(-1))
})

test('la hora del juego cambia de día y evita horas 24:00', () => {
  assert.equal(hora(0), 'D+0 00:00'); assert.equal(hora(24), 'D+1 00:00'); assert.equal(hora(49.5), 'D+2 01:30')
})
