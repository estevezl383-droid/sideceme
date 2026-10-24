// 📍 Dónde va cada unidad en cada fase de un CAP propio (calcos/cap-propios/v1/posiciones.mjs). El caso de Sergio:
// tocaba FASE I… V y «no se ve ninguna diferencia… se supone que en la fase I todos están donde está el CE y de ahí se
// disgregan»; y después, con sus agrupaciones OD, OC 1, OC 2 quietas: «en la fase I deberían todas las unidades estar
// con el cuerpo de ejército… en la fase dos desplazarse hacia los lugares donde hay trabajos (el plan de barreras),
// quienes hacen esos trabajos son ellos dentro de su sector asignado… en la fase 3 donde están ya sus posiciones».
// Con el ejercicio de prueba del CE-I, sus agrupaciones de la organización para el combate, el plan de barreras y lo
// que deja la F3·P4 en la carta (la LPR, la LDE-1, el EJE CA-1, la LÍM. entre sectores y las marcas «ESFUERZO
// PRINCIPAL · DIV MEC-2», «ESFUERZO SECUNDARIO · DIV-1», «RES · DIV-6»).
//   node cap-posiciones.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as P from '../cap-propios/v1/proponer.mjs'
import { posicionesCAP, referencias, trabajos } from '../cap-propios/v1/posiciones.mjs'
import * as C from '../cap-propios/v1/carta-ia.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto } = require('./concepto-ejemplo.js')
const X = require('./cap-carta-ejemplo.js')

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }
const RAD = Math.PI / 180
const km = (a, b) => Math.hypot((a[0] - b[0]) * 111.32 * Math.cos(((a[1] + b[1]) / 2) * RAD), (a[1] - b[1]) * 110.574)
const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

const EJ = ejercicioConcepto()
// Las agrupaciones de la organización para el combate (como las consolida la Mesa): la OD con piezas de la DIV MEC-2,
// la OC 1 con piezas de la DIV-1, la OC 2 sin piezas de las unidades del CAP y la RES (con artillería).
const ag = (id, nom, op, lng, lat, arma, piezas = []) => ({ id, designacion: nom, bando: 'propias', tipo: 'unidad', escalon: 'brigada', arma, lng, lat, agId: 'g-' + id, esAgrupacion: true, agrupacion: true, operacionAg: op, piezasAg: piezas, tareaAg: '', propositoAg: '' })
const AGS = [
  ag('ag-od', 'OD', 'od', -68.75, -18.45, 'mecanizada', [{ id: 'divmec2-1', de: 'divmec2', madre: 'DIV MEC-2' }, { id: 'divmec2-2', de: 'divmec2', madre: 'DIV MEC-2' }]),
  ag('ag-oc1', 'OC 1', 'oc1', -68.75, -18.72, 'infanteria', [{ id: 'div1-1', de: 'div1', madre: 'DIV-1' }]),
  ag('ag-oc2', 'OC 2', 'oc2', -68.8, -18.57, 'infanteria'),
  ag('ag-res', 'RES', 'reserva', -68.5, -18.62, 'artilleria'),
]
const US = [...EJ.unidades, ...AGS]
const OPS = {
  ...EJ.ops,
  limites: [
    { nombre: 'LPR (LF «PUMA»)', coords: [[-68.86, -18.3], [-68.84, -18.9]], co: { id: 'x1', rol: 'lpr' } },
    { nombre: 'LDE-1', coords: [[-69.08, -18.3], [-69.08, -18.9]], co: { id: 'x2', rol: 'linea' } },
    { nombre: 'EJE CA-1', coords: [[-68.5, -18.6], [-68.86, -18.48]], co: { id: 'x3', rol: 'eje-ca' } },
    { nombre: 'LÍM. DIV MEC-2 / DIV-1', coords: [[-68.4, -18.59], [-69.1, -18.59]], co: { id: 'x4', rol: 'limite-sector' } },
  ],
  // El plan de barreras: dos trabajos al norte de la LÍM., uno apenas al sur (más cerca de la OC 2, pero del otro
  // sector) y dos al sur.
  obstaculos: [
    { tipo: 'minado_ac', coords: [[-68.9, -18.44], [-68.9, -18.46]] },
    { tipo: 'zanja_at', centro: [-68.88, -18.4] },
    { tipo: 'concertina', centro: [-68.82, -18.6] },
    { tipo: 'minado_ac', centro: [-68.9, -18.75] },
    { tipo: 'demolicion', centro: [-68.88, -18.8] },
  ],
}
const MARCAS = [
  { tipo: 'esfuerzo', clase: 'principal', texto: 'ESFUERZO PRINCIPAL · DIV MEC-2', centro: [-68.8, -18.47] },
  { tipo: 'esfuerzo', clase: 'secundario', texto: 'ESFUERZO SECUNDARIO · DIV-1', centro: [-68.8, -18.78] },
  { tipo: 'reserva', texto: 'RES · DIV-6', centro: [-68.55, -18.62] },
]
const CTX = { unidades: US, ops: OPS, cmoc: EJ.cmoc, ordenSup: EJ.ordenSup, g3: EJ.g3 }
const PR = P.proponer(CTX)
const [CAP1, CAP2] = PR.caps
const posDe = (cap, us = US, extra = {}) => posicionesCAP(cap, { unidades: us, ops: OPS, marcas: MARCAS, A: PR.A, ...extra })
const pos1 = posDe(CAP1)
const pos2 = posDe(CAP2)
const PC = [-68.4, -18.55] // la ficha del CE-I
const PROPIAS = ['divmec2', 'div1', 'div6', 'ram4', 'galm1', 'ag-od', 'ag-oc1', 'ag-oc2', 'ag-res']

caso('lo que hay en la carta: la LPR, la LDE-1, el EJE CA-1, la LÍM. entre sectores, las marcas, el plan de barreras y el PC', () => {
  const R = referencias({ unidades: US, ops: OPS, marcas: MARCAS, A: PR.A })
  assert.ok(R.lpr && R.lde && R.ejeCA)
  assert.equal(R.sectores.length, 1, 'la LÍM. DIV MEC-2 / DIV-1')
  assert.equal(R.principal.texto, 'ESFUERZO PRINCIPAL · DIV MEC-2')
  assert.equal(R.reserva.texto, 'RES · DIV-6')
  assert.deepEqual(R.pc, PC)
  assert.equal(trabajos(OPS).length, 5)
  assert.deepEqual(trabajos(OPS)[0], [-68.9, -18.45], 'el trabajo trazado como línea: su centro')
})

caso('las agrupaciones no son unidades del CAP (la RES no es «apoyo de fuegos»); sin otras fichas, sí', () => {
  const todas = CAP1.roles.flatMap((r) => r.unidades.map((u) => u.id))
  assert.ok(!todas.some((id) => id.startsWith('ag-')), todas.join(', '))
  assert.deepEqual(CAP1.roles.find((r) => r.rol === 'Apoyo de fuegos').unidades.map((u) => u.nom), ['GALM-1', 'RAM-4'])
  const soloAg = P.proponer({ ...CTX, unidades: [EJ.unidades[0], ...AGS.map((a) => ({ ...a, escalon: 'division' })), ...EJ.unidades.filter((u) => u.bando === 'enemigas')] })
  assert.ok(soloAg.caps[0].roles.some((r) => r.unidades.some((u) => u.id === 'ag-od')))
})

caso('FASE I: TODAS las fichas propias (también la OD, las OC y la RES) juntas con el CE; el CE y el enemigo no se tocan', () => {
  for (const p of [pos1, pos2]) for (const id of PROPIAS) assert.ok(km(p[0][id], PC) <= 6.1, `${id} a ${km(p[0][id], PC).toFixed(1)} km`)
  assert.ok(km(pos1[0].divmec2, pos1[0].div1) > 1, 'no encimadas')
  assert.ok(!('pc-ce' in pos1[0]), 'la ficha del CE es la referencia')
  assert.ok(!('e-br1' in pos1[0]), 'el enemigo no se toca')
})

caso('FASE II: cada una a los trabajos del plan de barreras de SU sector (la LÍM. manda); la que no tiene, a mitad de camino', () => {
  assert.deepEqual(pos1[1]['ag-od'], [-68.89, -18.425], 'la OD: los dos trabajos del norte')
  const sur = [[-68.82, -18.6], [-68.9, -18.75], [-68.88, -18.8]]
  const cSur = [sur.reduce((s, p) => s + p[0], 0) / 3, sur.reduce((s, p) => s + p[1], 0) / 3]
  assert.ok(km(pos1[1]['ag-oc1'], cSur) < 0.01, 'la OC 1: los del sur, con la concertina apenas al sur de la LÍM.')
  assert.ok(km(pos1[1]['ag-oc2'], medio(pos1[0]['ag-oc2'], [-68.8, -18.57])) < 0.01, 'la OC 2 está más cerca de la concertina, pero es del otro sector: va a mitad de camino')
  assert.ok(km(pos1[1].div6, medio(pos1[0].div6, [-68.45, -18.6])) < 0.01, 'la reserva no hace obras')
  assert.ok(km(pos1[1]['ag-od'], pos1[0]['ag-od']) > 20 && km(pos1[1]['ag-od'], pos1[2]['ag-od']) > 5, 'se ve el movimiento: del CE a las obras y de las obras a su puesto')
})

caso('CAP 1 (defensa de área): FASE III cada una en su puesto; la ficha que sigue junto al CE va a su marca; la reserva contraataca por el EJE CA-1', () => {
  assert.deepEqual(pos1[2].divmec2, [-68.7, -18.42], 'la DIV MEC-2, donde la puso el oficial')
  assert.deepEqual(pos1[2]['ag-od'], [-68.75, -18.45], 'la OD en su puesto')
  assert.deepEqual(pos1[2]['ag-oc2'], [-68.8, -18.57])
  assert.deepEqual(pos1[3]['ag-oc1'], [-68.75, -18.72], 'FASE IV: conduce la defensa desde su puesto')
  // Si la ficha todavía está junto al CE (no la desplegaron), la Mesa la lleva a la marca de la F3·P4.
  const junto = US.map((u) => (u.id === 'divmec2' ? { ...u, lng: -68.42, lat: -18.53 } : u.id === 'div1' ? { ...u, lng: -68.43, lat: -18.57 } : u))
  const pj = posDe(CAP1, junto)
  assert.deepEqual(pj[2].divmec2, [-68.8, -18.47], 'a la marca del esfuerzo principal')
  assert.deepEqual(pj[2].div1, [-68.8, -18.78], 'a la del secundario')
  assert.deepEqual(pos1[4].div6, [-68.86, -18.48], 'FASE V: la DIV-6 al final del EJE CA-1')
  assert.ok(km(pos1[4]['ag-res'], [-68.86, -18.48]) <= 1.6, 'la RES con ella (al lado, no encima)')
  assert.ok(km(pos1[4]['ag-res'], pos1[4].div6) >= 0.5)
})

caso('CAP 2 (defensa móvil): el retardo (con la OD, que sale de la DIV MEC-2) va de la LDE-1 a la LPR y la masa contraataca entre las dos', () => {
  assert.ok(Math.abs(pos2[2].divmec2[0] - -69.08) < 0.01, 'FASE III: la fuerza de retardo sobre la LDE-1 (aunque su ficha esté desplegada)')
  assert.ok(Math.abs(pos2[2]['ag-od'][0] - -69.08) < 0.03, 'la OD con ella')
  assert.ok(pos2[3].divmec2[0] > -68.86, 'FASE IV: pasó detrás de la LPR')
  assert.deepEqual(pos2[2].div6, [-68.55, -18.62], 'la masa oculta en la zona de reserva')
  assert.ok(pos2[4].div6[0] < -68.86 && pos2[4].div6[0] > -69.08, 'FASE V: la masa contraataca en la zona de destrucción')
  assert.ok(pos2[4]['ag-res'][0] < -68.86, 'la RES con la masa')
  assert.deepEqual(pos2[2].div1, [-68.7, -18.76], 'la fijadora en su puesto')
})

caso('🎬 armar las fases: cada fase con su dispositivo, el puesto queda en la ficha y armar de nuevo da lo mismo', () => {
  const fases = P.armarFases(CAP1, { unidades: US, ops: OPS, posiciones: pos1 })
  const de = (i, id) => { const u = fases[i].unidades.find((x) => x.id === id); return [u.lng, u.lat] }
  assert.ok(km(de(0, 'ag-oc1'), PC) <= 6.1)
  assert.deepEqual(de(2, 'ag-oc1'), [-68.75, -18.72])
  assert.equal(fases[2].unidades.find((x) => x.id === 'divmec2').tarea, 'Ocupar y organizar su sector (posiciones y obstáculos)')
  assert.deepEqual(fases[0].unidades.find((x) => x.id === 'ag-oc1').puesto, [-68.75, -18.72], 'el puesto, en la ficha')
  const br = fases[4].unidades.find((x) => x.id === 'e-br1')
  assert.deepEqual([br.lng, br.lat], [-69.35, -18.45], 'el enemigo queda donde está')
  // Otra vez, con la FASE I a la vista (las fichas junto al CE): sale lo mismo.
  const otra = posDe(CAP1, fases[0].unidades, { previas: fases })
  assert.deepEqual(otra[2], pos1[2])
  // Lo que el oficial corrigió en la FASE III es el puesto nuevo.
  const corregidas = fases.map((f, i) => (i !== 2 ? f : { ...f, unidades: f.unidades.map((u) => (u.id === 'ag-oc2' ? { ...u, lng: -68.79, lat: -18.52 } : u)) }))
  assert.deepEqual(posDe(CAP1, fases[0].unidades, { previas: corregidas })[2]['ag-oc2'], [-68.79, -18.52])
  // La acción «fases» de la Mesa usa las posiciones (función con las fichas, el calco y las fases que ya tiene el CAP).
  let puestas = null
  let recibio = null
  P.accion('fases', { cap: CAP1, posiciones: (us, ops, x) => ((recibio = x), posDe(CAP1, us, { previas: x?.previas })) }, { fasesCOA: { propio: corregidas }, unidades: fases[0].unidades, ops: OPS, confirmar: () => true, setFases: (f) => { puestas = typeof f === 'function' ? f({ propio: [] }).propio : f.propio }, setActiva: () => {}, setUnidades: () => {}, setOps: () => {}, aviso: () => {} })
  assert.equal(recibio.previas, corregidas)
  assert.equal(puestas[2].unidades.find((x) => x.id === 'ag-oc2').lng, -68.79)
  assert.equal(puestas[4].unidades.find((x) => x.id === 'div6').lng, -68.86)
})

caso('sin LPR ni marcas ni barreras: la FASE I igual se concentra junto al PC y después cada una a su puesto', () => {
  const p = posicionesCAP(CAP1, { unidades: US, ops: EJ.ops, marcas: [], A: PR.A })
  assert.ok(km(p[0].divmec2, PC) <= 6.1 && km(p[0]['ag-od'], PC) <= 6.1)
  assert.deepEqual(p[2].divmec2, [-68.7, -18.42])
  assert.deepEqual(p[2]['ag-od'], [-68.75, -18.45])
})

caso('🤖 la IA: lo que no nombra sigue a la Mesa fase por fase; el lugar que no está en la carta, donde lo pone la Mesa', () => {
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
  // La OD, la OC 1… no las nombra nunca: en cada fase, donde las pone la Mesa (junto al CE, a sus obras, a su puesto).
  for (let i = 0; i < 5; i++) {
    const oc1 = r.caps[1].fases[i].unidades.find((u) => u.id === 'ag-oc1')
    assert.deepEqual([oc1.lng, oc1.lat], pos1[i]['ag-oc1'], `CAP 1 · fase ${i + 1}`)
  }
  assert.deepEqual(r.caps[1].fases[0].unidades.find((u) => u.id === 'ag-oc1').puesto, [-68.75, -18.72], 'con su puesto')
})

console.log(`cap-posiciones: ${n} casos ✔`)
