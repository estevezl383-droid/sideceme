// 📍 Dónde va cada unidad en cada fase de un CAP propio (calcos/cap-propios/v1/posiciones.mjs). El caso de Sergio:
// tocaba FASE I… V y «no se ve ninguna diferencia… se supone que en la fase I todos están donde está el CE y de ahí se
// disgregan». Con el ejercicio de prueba del CE-I y lo que deja la F3·P4 en la carta (la LPR, la LDE-1, el EJE CA-1 y
// las marcas «ESFUERZO PRINCIPAL · DIV MEC-2», «ESFUERZO SECUNDARIO · DIV-1», «RES · DIV-6»).
//   node cap-posiciones.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as P from '../cap-propios/v1/proponer.mjs'
import { posicionesCAP, referencias } from '../cap-propios/v1/posiciones.mjs'
import * as C from '../cap-propios/v1/carta-ia.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto } = require('./concepto-ejemplo.js')
const X = require('./cap-carta-ejemplo.js')

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }
const RAD = Math.PI / 180
const km = (a, b) => Math.hypot((a[0] - b[0]) * 111.32 * Math.cos(((a[1] + b[1]) / 2) * RAD), (a[1] - b[1]) * 110.574)

const EJ = ejercicioConcepto()
const OPS = {
  ...EJ.ops,
  limites: [
    { nombre: 'LPR (LF «PUMA»)', coords: [[-68.86, -18.3], [-68.84, -18.9]], co: { id: 'x1', rol: 'lpr' } },
    { nombre: 'LDE-1', coords: [[-69.08, -18.3], [-69.08, -18.9]], co: { id: 'x2', rol: 'linea' } },
    { nombre: 'EJE CA-1', coords: [[-68.5, -18.6], [-68.86, -18.48]], co: { id: 'x3', rol: 'eje-ca' } },
  ],
}
const MARCAS = [
  { tipo: 'esfuerzo', clase: 'principal', texto: 'ESFUERZO PRINCIPAL · DIV MEC-2', centro: [-68.8, -18.47] },
  { tipo: 'esfuerzo', clase: 'secundario', texto: 'ESFUERZO SECUNDARIO · DIV-1', centro: [-68.8, -18.78] },
  { tipo: 'reserva', texto: 'RES · DIV-6', centro: [-68.55, -18.62] },
]
const CTX = { unidades: EJ.unidades, ops: OPS, cmoc: EJ.cmoc, ordenSup: EJ.ordenSup, g3: EJ.g3 }
const PR = P.proponer(CTX)
const [CAP1, CAP2] = PR.caps
const pos1 = posicionesCAP(CAP1, { unidades: EJ.unidades, ops: OPS, marcas: MARCAS, A: PR.A })
const pos2 = posicionesCAP(CAP2, { unidades: EJ.unidades, ops: OPS, marcas: MARCAS, A: PR.A })
const PC = [-68.4, -18.55] // la ficha del CE-I

caso('lo que hay en la carta: la LPR, la LDE-1, el EJE CA-1, las marcas de la F3·P4 y el PC del CE', () => {
  const R = referencias({ unidades: EJ.unidades, ops: OPS, marcas: MARCAS, A: PR.A })
  assert.ok(R.lpr && R.lde && R.ejeCA)
  assert.equal(R.principal.texto, 'ESFUERZO PRINCIPAL · DIV MEC-2')
  assert.equal(R.reserva.texto, 'RES · DIV-6')
  assert.deepEqual(R.pc, PC)
})

caso('FASE I: todas concentradas junto al CE (a menos de 6 km del PC)', () => {
  for (const id of ['divmec2', 'div1', 'div6', 'ram4', 'galm1']) assert.ok(km(pos1[0][id], PC) <= 6.1, `${id} a ${km(pos1[0][id], PC).toFixed(1)} km`)
  assert.ok(km(pos1[0].divmec2, pos1[0].div1) > 1, 'no encimadas')
  assert.ok(!('e-br1' in pos1[0]), 'el enemigo no se toca')
})

caso('CAP 1 (defensa de área): cada una se disgrega a su lugar de la F3·P4 y la reserva contraataca por el EJE CA-1', () => {
  assert.deepEqual(pos1[2].divmec2, [-68.8, -18.47], 'FASE III: el esfuerzo principal en su marca')
  assert.deepEqual(pos1[2].div1, [-68.8, -18.78], 'el secundario en la suya')
  assert.deepEqual(pos1[2].div6, [-68.55, -18.62], 'la reserva en la suya')
  const mitad = [(pos1[0].divmec2[0] + pos1[2].divmec2[0]) / 2, (pos1[0].divmec2[1] + pos1[2].divmec2[1]) / 2]
  assert.ok(km(pos1[1].divmec2, mitad) < 0.01, 'FASE II: a mitad de camino')
  assert.deepEqual(pos1[3].div6, [-68.55, -18.62], 'FASE IV: la reserva espera')
  assert.deepEqual(pos1[4].div6, [-68.86, -18.48], 'FASE V: al final del EJE CA-1')
  assert.ok(km(pos1[3].ram4, PC) < km(pos1[3].ram4, [-68.8, -18.47]) + 30, 'el apoyo de fuegos detrás del esfuerzo principal')
  assert.ok(pos1[3].ram4[0] > -68.8 && pos1[3].ram4[0] < -68.4)
})

caso('CAP 2 (defensa móvil): el retardo va de la LDE-1 a la LPR y la masa contraataca entre las dos', () => {
  assert.ok(Math.abs(pos2[2].divmec2[0] - -69.08) < 0.01, 'FASE III: la fuerza de retardo sobre la LDE-1')
  assert.ok(pos2[3].divmec2[0] > -68.86, 'FASE IV: pasó detrás de la LPR')
  assert.deepEqual(pos2[2].div6, [-68.55, -18.62], 'la masa oculta en la zona de reserva')
  assert.ok(pos2[4].div6[0] < -68.86 && pos2[4].div6[0] > -69.08, 'FASE V: la masa contraataca en la zona de destrucción, entre la LDE-1 y la LPR')
  assert.ok(km(pos2[2].div1, [-68.8, -18.78]) < 0.01, 'la fijadora en la marca del secundario')
})

caso('🎬 armar las fases: cada fase con su dispositivo (ya no todas iguales)', () => {
  const fases = P.armarFases(CAP1, { unidades: EJ.unidades, ops: OPS, posiciones: pos1 })
  const dm = (i) => { const u = fases[i].unidades.find((x) => x.id === 'divmec2'); return [u.lng, u.lat] }
  assert.ok(km(dm(0), PC) <= 6.1)
  assert.deepEqual(dm(2), [-68.8, -18.47])
  assert.notDeepEqual(dm(0), dm(2))
  assert.equal(fases[2].unidades.find((x) => x.id === 'divmec2').tarea, 'Ocupar y organizar su sector (posiciones y obstáculos)')
  const br = (i) => fases[i].unidades.find((x) => x.id === 'e-br1')
  assert.deepEqual([br(4).lng, br(4).lat], [-69.35, -18.45], 'el enemigo queda donde está')
  // La acción «fases» de la Mesa usa las posiciones (como función, con las unidades y el calco de la Mesa).
  let puestas = null
  P.accion('fases', { cap: CAP1, posiciones: (us, ops) => posicionesCAP(CAP1, { unidades: us, ops, marcas: MARCAS, A: PR.A }) }, { fasesCOA: { propio: [] }, unidades: EJ.unidades, ops: OPS, setFases: (f) => { puestas = typeof f === 'function' ? f({ propio: [] }).propio : f.propio }, setActiva: () => {}, setUnidades: () => {}, setOps: () => {}, aviso: () => {} })
  assert.deepEqual(puestas[2].unidades.find((x) => x.id === 'div6').lng, -68.55)
})

caso('sin LPR ni marcas: la FASE I igual se concentra junto al PC y lo demás queda donde está', () => {
  const p = posicionesCAP(CAP1, { unidades: EJ.unidades, ops: EJ.ops, marcas: [], A: PR.A })
  assert.ok(km(p[0].divmec2, PC) <= 6.1)
  assert.deepEqual(p[2].divmec2, [-68.7, -18.42], 'sin la LPR, en su lugar de ahora')
})

caso('🤖 la IA: el lugar que no está en la carta y las unidades que no nombra en la FASE I van donde las pone la Mesa', () => {
  const mesaPos = { 1: () => pos1, 2: () => pos2 }
  const ctx = { ...CTX, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS, mesaPos }
  const r = C.leerRespuesta(X.RESPUESTA_TEXTO, ctx)
  // CAP 2, fase 3: «Cerro Comanchi» (DIV-6) no está → donde la Mesa pone la masa en la FASE III.
  const div6 = r.caps[2].fases[2].unidades.find((u) => u.id === 'div6')
  assert.deepEqual([div6.lng, div6.lat], [-68.55, -18.62])
  assert.match(r.faltan.find((f) => /Cerro Comanchi/.test(f)), /quedó donde la pone la Mesa en esa fase/)
  // CAP 2, FASE I: la IA no nombra a la DIV-1 → concentrada junto al PC.
  const div1 = r.caps[2].fases[0].unidades.find((u) => u.id === 'div1')
  assert.ok(km([div1.lng, div1.lat], PC) <= 6.1)
})

console.log(`cap-posiciones: ${n} casos ✔`)
