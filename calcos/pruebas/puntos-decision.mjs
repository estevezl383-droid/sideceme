// ⭐ Los puntos de decisión de la F4·P4 en la carta (calcos/puntos-decision/v1) y 🌱 la siembra de la hoja desde
// las A.I.N. (l3e del compilado vigente). El caso de Sergio: la F4·P4 que le escribió la IA (seis P.D. sobre la
// AIN-1, 2, 3 y 5, todos «[IA — verificar]») y «🌱 Traer del calco» diciendo que no había nada para sembrar.
//   node puntos-decision.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { puntosDeDecision, ainsNombradas, limpiar } from '../puntos-decision/v1/modelo.mjs'

const require = createRequire(import.meta.url)
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { FILAS_PD } = require('./puntos-decision-ejemplo.js')

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }

const ains = [
  { n: 1, nom: 'AIN-1', centro: [-69.1, -18.2] },
  { n: 2, nom: 'AIN-2', centro: [-69.3, -18.45] },
  { n: 3, nom: 'AIN-3', centro: [-69.2, -18.5], noAntes: 'D-3 (0600)', noDespues: 'D (0400)', indicador: 'Despliegue del Pel. Rec. Blindado en los vados.' },
  { n: 5, nom: 'AIN-5', centro: [-69.0, -18.8] },
]

caso('las A.I.N. que nombra una celda, con o sin puntos y con la marca de la IA', () => {
  assert.deepEqual(ainsNombradas('AIN-3 [IA — verificar]'), ['AIN3'])
  assert.deepEqual(ainsNombradas('A.I.N. 5 / AIN-3'), ['AIN5', 'AIN3'])
  assert.deepEqual(ainsNombradas('sin A.I.N.'), [])
  assert.equal(limpiar('P.D. 1 [IA — verificar]'), 'P.D. 1')
})

caso('los seis P.D. de la IA van a la carta, cada uno junto a su A.I.N.; los que comparten A.I.N., uno al lado del otro', () => {
  const { puntos, sinAIN } = puntosDeDecision(FILAS_PD, ains)
  assert.deepEqual(sinAIN, [])
  assert.deepEqual(puntos.map((p) => [p.num, p.ain, p.k]), [[1, 'AIN-3', 0], [2, 'AIN-3', 1], [3, 'AIN-5', 0], [4, 'AIN-1', 0], [5, 'AIN-3', 2], [6, 'AIN-2', 0]])
  assert.deepEqual(puntos[0].centro, [-69.2, -18.5])
  assert.equal(puntos[0].noAntes, 'D-3 (0600)')
  assert.equal(puntos[0].noDespues, 'D (0400)')
  assert.ok(puntos[0].ia, 'marcado como propuesta de la IA')
  assert.ok(!/verificar/.test(puntos[0].decision), 'sin la marca en el texto')
  assert.match(puntos[0].decision, /Contrabatería/)
})

caso('un P.D. arrastrado queda donde se lo dejó y los demás de su A.I.N. se corren', () => {
  const { puntos } = puntosDeDecision(FILAS_PD, ains, { 2: [-69.05, -18.55] })
  const p2 = puntos.find((p) => p.num === 2)
  assert.deepEqual(p2.centro, [-69.05, -18.55])
  assert.equal(p2.movido, true)
  assert.equal(puntos.find((p) => p.num === 5).k, 1)
})

caso('sin la A.I.N. en la carta no se inventa un lugar; un renglón vacío no cuenta', () => {
  const { puntos, sinAIN } = puntosDeDecision([...FILAS_PD, {}, { 'N° P.D.': '9', 'Evento crítico': 'x', 'A.I.N. asociada': 'AIN-9' }], ains.filter((a) => a.n !== 1))
  assert.deepEqual(sinAIN, [4, 9])
  assert.equal(puntos.length, 5)
})

// 🌱 la siembra del compilado
const VIG = vigente()
const mesa0 = cargarConDependencias(VIG, ['l3e'], (c) => c.l3e('alerta', {}))
// Lo que devuelve el compilado (otro contexto de vm) pasado a objetos de acá, para compararlo.
const mesa = { l3e: (...a) => JSON.parse(JSON.stringify(mesa0.l3e(...a))) }

caso('🌱 sin fases propias: un renglón por A.I.N. de la carta, con su ventana y su indicador', () => {
  const filas = mesa.l3e('eventos', { ops: { ains }, fasesCOA: { enemigo: [{}, {}], propio: [] }, g3: {} })
  assert.deepEqual(filas.map((f) => [f['N° P.D.'], f['A.I.N. asociada']]), [['1', 'AIN-1'], ['2', 'AIN-2'], ['3', 'AIN-3'], ['4', 'AIN-5']])
  const f3 = filas[2]
  assert.equal(f3['No antes de'], 'D-3 (0600)')
  assert.equal(f3['No después de'], 'D (0400)')
  assert.equal(f3['Criterio que activa la decisión'], 'Despliegue del Pel. Rec. Blindado en los vados.')
  assert.equal(f3['Decisión que se toma'], '')
})

caso('🌱 con la hoja ya escrita por la IA: no repite las A.I.N. que ya tienen P.D. y numera después', () => {
  const conAIN4 = [...ains, { n: 4, nom: 'AIN-4', centro: [-68.9, -18.6] }]
  const filas = mesa.l3e('eventos', { ops: { ains: conAIN4 }, fasesCOA: {}, g3: { eventos: FILAS_PD } })
  assert.deepEqual(filas.map((f) => [f['N° P.D.'], f['A.I.N. asociada']]), [['7', 'AIN-4']])
  assert.deepEqual(mesa.l3e('eventos', { ops: { ains }, fasesCOA: {}, g3: { eventos: FILAS_PD } }), [], 'todas tienen su P.D.: no hay nada que sembrar')
})

caso('🌱 con fases propias siguen las transiciones de fase, y después las A.I.N.', () => {
  const filas = mesa.l3e('eventos', { ops: { ains: ains.slice(0, 1) }, fasesCOA: { propio: [{}, {}, {}] }, g3: {} })
  assert.deepEqual(filas.map((f) => f['N° P.D.']), ['1', '2', '3', '4'])
  assert.match(filas[0]['Evento crítico'], /Transición a la fase 2 del COA propio/)
  assert.equal(filas[3]['A.I.N. asociada'], 'AIN-1')
})

console.log(`\n${n} casos pasan (puntos de decisión).`)
