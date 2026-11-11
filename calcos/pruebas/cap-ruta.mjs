// 🔵 El recorrido de cada CAP (11-11-2026): CAP 1 completo (F3·P3 → F3·P6, fuegos, barrera, fases) y recién después
// «➕ Generar el CAP 2» desde el principio; el plan de fuegos de cada CAP lo dispara la artillería.
//   node calcos/pruebas/cap-ruta.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { accion, cambiarCAP, pasosCAP, existeCAP, cerradoCAP, vistaDe } from '../cap-propios/v1/proponer.mjs'
import { planFuegosCAP, artilleriaDe } from '../cap-propios/v1/fuegos-cap.mjs'

const require = createRequire(import.meta.url)
const modelo = require('../fuegos/plan-fuegos.js')
let n = 0
const caso = (t, f) => {
  f()
  n++
  console.log(`  ✔ ${t}`)
}

// Una Mesa de mentira: guarda lo que le ponen (con la función o con el valor, como React).
function mesa(inicial) {
  const S = { ...inicial, avisos: [], errores: [] }
  const set = (k) => (v) => (S[k] = typeof v === 'function' ? v(S[k]) : v)
  const M = () => ({
    fasesCOA: S.fasesCOA, g3: S.g3, unidades: S.unidades, ops: S.ops, plan: S.plan, activa: S.activa,
    setFases: set('fasesCOA'), setG3: set('g3'), setUnidades: set('unidades'), setOps: set('ops'), setPlan: set('plan'), setActiva: set('activa'),
    aviso: (t) => S.avisos.push(t), error: (t) => S.errores.push(t), confirmar: () => true,
  })
  return { S, M }
}
const U = [
  { id: 'd1', designacion: 'DIV-1', bando: 'propias', tipo: 'unidad', lng: -68.0, lat: -17.0 },
  { id: 'd2', designacion: 'DIV MEC-2', bando: 'propias', tipo: 'unidad', lng: -68.1, lat: -17.0 },
  { id: 'e1', designacion: 'DIV-MEC-1 (E)', bando: 'enemigo', tipo: 'unidad', lng: -68.05, lat: -16.85 },
]
const base = () => ({
  fasesCOA: { propio: [{ nombre: 'FASE I', unidades: U.map((u) => (u.bando === 'enemigo' ? u : { ...u, lng: -68.3, lat: -17.2 })), ops: {} }, { nombre: 'FASE II', unidades: U, ops: {} }], enemigo: [] },
  g3: { organizacion: { 'Unidad|1': 'DIV-1 en la OD' }, concepto: { forma: 'Defensa de área' }, comandos: { 'x|1': 'Cte DIV-1' }, coa: { quien: 'CE-I' }, conceptoCarta: { marcas: [1] }, potencia: { a: 'PRC' } },
  unidades: U,
  ops: { tareas: [{ id: 't1' }], obstaculos: [{ centro: [-68.05, -16.95] }], posDef: [], limites: [{ id: 'L' }] },
  plan: { medios: { x: 1 }, blancos: [{ id: 'b1', lng: -68.05, lat: -16.9 }] },
  activa: null,
})

caso('pasos del CAP: las cuatro hojas, los fuegos con su unidad, la barrera y las fases', () => {
  const S = base()
  const p = pasosCAP(S.g3, { ops: S.ops, plan: S.plan, fases: 2 })
  assert.deepEqual(p.map((x) => x.id), ['organizacion', 'concepto', 'comandos', 'coa', 'fuegos', 'barrera', 'fases'])
  assert.deepEqual(p.map((x) => x.hecho), [true, true, true, true, false, true, true]) // el blanco no tiene unidad
  const p2 = pasosCAP({ coa: { quien: 'algo [Mesa — verificar]'.replace('algo ', '') } }, { plan: { blancos: [{ medio: 'ficha:a' }] } })
  assert.equal(p2[3].hecho, false, 'sólo la marca de la Mesa no cuenta como escrito')
  assert.equal(p2[4].hecho, true)
})

caso('el CAP 2 no existe hasta generarlo; ✓ terminar marca el CAP 1', () => {
  const { S, M } = mesa(base())
  assert.equal(existeCAP(S.g3, 2), false)
  assert.equal(accion('cerrar', {}, M()), true)
  assert.equal(cerradoCAP(S.g3, 1), true)
  assert.equal(accion('reabrir', {}, M()), true)
  assert.equal(cerradoCAP(S.g3, 1), false)
  accion('cerrar', {}, M())
  assert.equal(cerradoCAP(S.g3, 1), true)
})

caso('➕ generar el CAP 2: F3·P3 a F3·P6 en blanco, carta sin tareas/barrera/fuegos, las fichas quietas', () => {
  const { S, M } = mesa(base())
  accion('cerrar', {}, M())
  assert.equal(accion('nuevo', { n: 2 }, M()), true)
  assert.equal(S.g3._caps.activo, 2)
  for (const h of ['organizacion', 'concepto', 'comandos', 'coa', 'conceptoCarta']) assert.equal(S.g3[h], undefined, h)
  assert.deepEqual(S.g3.potencia, { a: 'PRC' }, 'la F3·P1 es una sola para los dos')
  assert.deepEqual(S.fasesCOA.propio, [])
  assert.deepEqual([S.ops.tareas, S.ops.obstaculos, S.ops.posDef], [[], [], []])
  assert.deepEqual(S.ops.limites, [{ id: 'L' }], 'lo que no es del CAP queda')
  assert.deepEqual(S.plan, { medios: { x: 1 }, blancos: [] })
  assert.equal(S.unidades.find((u) => u.id === 'd1').lng, -68.0, 'las fichas no se mueven (la reserva se lee de dónde está cada una)')
  const g1 = S.g3._caps.guardados[1]
  assert.equal(g1.v, 2)
  assert.deepEqual(g1.organizacion, { 'Unidad|1': 'DIV-1 en la OD' })
  assert.equal(g1.fases.length, 2)
  assert.deepEqual(g1.vista.ops.obstaculos, [{ centro: [-68.05, -16.95] }])
  assert.equal(existeCAP(S.g3, 1), true)
})

caso('volver al CAP 1: sus hojas, su carta (tareas, barrera, fuegos) y sus fichas; el CAP 2 queda guardado', () => {
  const { S, M } = mesa(base())
  accion('cerrar', {}, M())
  accion('nuevo', { n: 2 }, M())
  S.g3 = { ...S.g3, organizacion: { 'Unidad|1': 'DIV MEC-2 en la OD' } }
  S.ops = { ...S.ops, obstaculos: [{ centro: [1, 1] }, { centro: [2, 2] }] }
  assert.equal(accion('cambiar', { n: 1 }, M()), true)
  assert.equal(S.g3._caps.activo, 1)
  assert.deepEqual(S.g3.organizacion, { 'Unidad|1': 'DIV-1 en la OD' })
  assert.equal(S.ops.obstaculos.length, 1)
  assert.deepEqual(S.ops.tareas, [{ id: 't1' }])
  assert.equal(S.plan.blancos.length, 1)
  assert.equal(S.fasesCOA.propio.length, 2)
  assert.deepEqual(S.g3._caps.guardados[2].organizacion, { 'Unidad|1': 'DIV MEC-2 en la OD' })
  assert.equal(S.g3._caps.guardados[2].vista.ops.obstaculos.length, 2)
  assert.equal(existeCAP(S.g3, 2), true, 'el CAP 2 generado existe aunque no tenga hojas: «nuevo» no lo vuelve a limpiar')
  accion('nuevo', { n: 2 }, M())
  assert.equal(S.ops.obstaculos.length, 2, 'volvió su barrera (no se limpió)')
  accion('cambiar', { n: 1 }, M())
  // y otra vez al 2
  accion('cambiar', { n: 2 }, M())
  assert.deepEqual(S.g3.organizacion, { 'Unidad|1': 'DIV MEC-2 en la OD' })
  assert.equal(S.ops.obstaculos.length, 2)
})

caso('un CAP 2 guardado ANTES (sin v: 2) no borra la F3·P3 ni la F3·P5 ni la carta al volver a él', () => {
  const S = base()
  const g3 = { ...S.g3, _caps: { activo: 1, guardados: { 2: { fases: [{}, {}], coa: { quien: 'viejo' } } } } }
  const r = cambiarCAP({ fasesCOA: S.fasesCOA, g3 }, 2, { vista: vistaDe(S) })
  assert.deepEqual(r.g3.organizacion, S.g3.organizacion)
  assert.deepEqual(r.g3.comandos, S.g3.comandos)
  assert.deepEqual(r.g3.coa, { quien: 'viejo' })
  assert.equal(r.g3.concepto, undefined, 'la F3·P4 ya era de cada CAP')
  assert.equal(r.vista, null, 'sin carta guardada: la carta no se toca')
  assert.equal(existeCAP(g3, 2), true)
})

caso('➕ con el CAP 2 ya existente, «nuevo» sólo cambia (no lo borra)', () => {
  const { S, M } = mesa(base())
  S.g3 = { ...S.g3, _caps: { activo: 1, guardados: { 2: { v: 2, fases: [{}], coa: { quien: 'CAP 2' } } } } }
  accion('nuevo', { n: 2 }, M())
  assert.deepEqual(S.g3.coa, { quien: 'CAP 2' })
  assert.equal(S.fasesCOA.propio.length, 1)
})

// ─── 🔥 Fuegos con la artillería ───
const art = (id, lng, lat, m = 20000) => ({ id, arma: 'artilleria', nombre: id, nombreCompleto: id, corto: id, pos: [lng, lat], alcance: { m } })
const cap = { n: 1, roles: [{ rol: 'Esfuerzo principal', principal: true, unidades: [{ id: 'd2', nom: 'DIV MEC-2' }] }, { rol: 'Esfuerzo secundario', unidades: [{ id: 'd1', nom: 'DIV-1' }] }, { rol: 'Reserva', unidades: [{ id: 'd3', nom: 'DIV-6' }] }] }

caso('🔥 cada concentración con la unidad de artillería que la dispara; repartidas; lo manual queda', () => {
  const medios = [art('ficha:ram4', -68.05, -17.1), art('ficha:galm1', -68.0, -17.12), { id: 'organica:d1', arma: 'morteros', pos: [-68, -17], alcance: { m: 5000 } }]
  assert.equal(artilleriaDe(medios).length, 2, 'los morteros orgánicos no entran')
  const plan = { medios: {}, blancos: [{ id: 'mano', num: 'AB-010', lng: -68, lat: -16.9 }, { id: 'viejo', auto: 'cap', lng: 0, lat: 0 }] }
  const r = planFuegosCAP({ plan, medios, unidades: U, ops: base().ops, cap, tipo: 'defensiva', modelo })
  assert.ok(!r.error, r.error)
  const auto = r.plan.blancos.filter((b) => b.auto === 'cap')
  assert.equal(auto.length, 4, '2 FPF (primera línea) + 1 enemigo + 1 obstáculo')
  assert.ok(auto.every((b) => ['ficha:ram4', 'ficha:galm1'].includes(b.medio)))
  assert.ok(r.plan.blancos.some((b) => b.id === 'mano'))
  assert.ok(!r.plan.blancos.some((b) => b.id === 'viejo'))
  assert.equal(auto[0].tipo, 'proteccion')
  assert.match(auto[0].proposito, /DIV MEC-2.*esfuerzo principal/)
  assert.ok(auto.some((b) => b.tipo === 'contrapreparacion'))
  assert.ok(auto.some((b) => /obstáculo/.test(b.proposito)))
  assert.deepEqual(Object.values(r.asignados).sort(), [2, 2])
  assert.equal(new Set(auto.map((b) => b.num)).size, 4)
  assert.match(r.msg, /CAP 1/)
})

caso('🔥 en el ataque: preparación; fuera de alcance → la más cercana y se avisa; sin artillería → error claro', () => {
  const r = planFuegosCAP({ plan: null, medios: [art('ficha:ga', -68.05, -17.1, 3000)], unidades: U, ops: {}, cap, tipo: 'ofensiva', modelo })
  assert.equal(r.plan.blancos.length, 1)
  assert.equal(r.plan.blancos[0].tipo, 'preparacion')
  assert.equal(r.plan.blancos[0].medio, 'ficha:ga')
  assert.equal(r.fuera, 1)
  assert.match(r.msg, /FUCSIA/)
  assert.match(planFuegosCAP({ medios: [], unidades: U, cap, modelo }).error, /ARTILLERÍA/)
  assert.match(planFuegosCAP({ medios: [{ id: 'x', arma: 'artilleria', alcance: { m: 1 } }], unidades: U, cap, modelo }).error, /posición/)
})

caso('🔥 la acción de la Mesa pone el plan armado (y con candado no)', () => {
  const { S, M } = mesa(base())
  const ok = accion('fuegosCAP', { armar: (p) => planFuegosCAP({ plan: p, medios: [art('ficha:ram4', -68.05, -17.1)], unidades: U, ops: S.ops, cap, modelo }) }, M())
  assert.equal(ok, true)
  assert.ok(S.plan.blancos.filter((b) => b.auto === 'cap').length >= 3)
  assert.ok(S.plan.blancos.some((b) => b.id === 'b1'))
  assert.equal(accion('fuegosCAP', { armar: () => ({ error: 'x' }) }, M()), false)
  assert.deepEqual(S.errores, ['x'])
  assert.equal(accion('nuevo', { n: 2 }, { ...M(), bloqueado: true }), false)
})

console.log(`cap-ruta: ${n} casos ✔`)
