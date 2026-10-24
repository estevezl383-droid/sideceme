// 💡 Los dos cursos de acción propios que propone la Mesa (calcos/cap-propios/v1/proponer.mjs), con el ejercicio
// de Sergio (CE-I en el AO LAUCA contra la 1ª Br. Ac. «CORACEROS»): CAP 1 la defensa de área de su F3·P4, CAP 2 la
// defensa móvil; el bloque para la IA; los dos CAP en el mismo ejercicio; llevarlo a la hoja y a las fases.
//   node cap-propios.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as P from '../cap-propios/v1/proponer.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto } = require('./concepto-ejemplo.js')

let n = 0
const caso = async (nombre, fn) => { await fn(); n++; console.log('  ✔ ' + nombre) }

const EJ = ejercicioConcepto()
const CTX = { unidades: EJ.unidades, ops: EJ.ops, cmoc: EJ.cmoc, ordenSup: EJ.ordenSup, g3: EJ.g3 }
const sinTexto = { ...CTX, g3: {} }

await caso('lee el ejercicio: maniobra, reserva, avenidas, la LF «PUMA», la hora D y el enemigo', () => {
  const A = P.analizar(CTX)
  assert.equal(A.tipo, 'defensiva', 'la misión dice «defiende»')
  assert.equal(A.propia, 'CE-I')
  assert.deepEqual(A.maniobra.map((u) => u.designacion), ['DIV MEC-2', 'DIV-1', 'DIV-6'])
  assert.deepEqual(A.moviles.map((u) => u.designacion), ['DIV MEC-2'])
  assert.equal(A.reserva.designacion, 'DIV-6', 'la más lejos del frente')
  assert.deepEqual(A.apoyo.map((u) => u.designacion), ['GALM-1', 'RAM-4'])
  assert.deepEqual(A.avenidas.map((a) => a.nombre), ['AA-1', 'AA-2', 'AA-3'], 'la de división primero')
  assert.equal(A.cercaDe(A.avenidas[0]).designacion, 'DIV MEC-2')
  assert.equal(A.lpr, 'la LPR en la LF «PUMA»')
  assert.deepEqual(A.ldes, ['LDE-1', 'LDE-2'])
  assert.equal(A.horaD, 'D (0400)')
  assert.equal(A.aoNom, 'LAUCA')
  assert.equal(A.enemigo, '1ª BR. AC. «CORACEROS»')
  assert.equal(A.formaHoja, 'area', '«Defensa de área estructurada…» (la «contramovilidad» no es defensa móvil)')
})

await caso('propone CAP 1 = defensa de área (lo de su F3·P4) y CAP 2 = defensa móvil, que se distinguen', () => {
  const R = P.proponer(CTX)
  assert.deepEqual(R.caps.map((c) => c.forma), ['area', 'movil'])
  assert.deepEqual(R.avisos, [])
  const [c1, c2] = R.caps
  const rol = (c, r) => c.roles.find((x) => x.rol.startsWith(r))?.unidades.map((u) => u.nom)
  assert.deepEqual(rol(c1, 'Esfuerzo principal'), ['DIV MEC-2'])
  assert.deepEqual(rol(c1, 'Esfuerzo secundario'), ['DIV-1'])
  assert.deepEqual(rol(c1, 'Reserva'), ['DIV-6'])
  assert.deepEqual(rol(c2, 'Fuerza de retardo'), ['DIV MEC-2'])
  assert.deepEqual(rol(c2, 'Fuerza fijadora'), ['DIV-1'])
  assert.deepEqual(rol(c2, 'Masa de contraataque'), ['DIV-6'])
  assert.match(c1.campos['Denominación del CAP'], /^CAP 1 — Defensa de área \(tenaz\) \(esfuerzo en la AA-1\)$/)
  assert.match(c2.campos['CÓMO (forma de maniobra)'], /Retardar desde la LDE-1 hasta la LPR en la LF «PUMA» sobre la AA-1/)
  assert.match(c1.campos.CUÁNDO, /^A partir del D \(0400\)$/)
  assert.match(c1.campos.DÓNDE, /en el AO LAUCA, sobre la LPR en la LF «PUMA»/)
  assert.match(c1.distingue, /se RETIENE el terreno/)
  assert.match(c2.distingue, /se CEDE terreno/)
  assert.deepEqual(c2.fases.map((f) => f.nombre), ['Concentración', 'Desplazamiento', 'Organización de la defensa móvil', 'Retardo y canalización', 'Contraataque y consolidación'])
  assert.equal(c1.fases[3].porUnidad.divmec2.tarea, 'Detener al enemigo en la AA-1')
  assert.equal(c2.fases[4].porUnidad.div6.tarea, 'Contraatacar y destruir al enemigo')
  for (const c of R.caps) for (const v of Object.values(c.campos)) assert.ok(!/ a el | de el |undefined/.test(v), v)
})

await caso('sin la F3·P4, manda la modalidad del A.O.; las formas elegidas se respetan y nunca son iguales', () => {
  assert.deepEqual(P.proponer(sinTexto).caps.map((c) => c.forma), ['area', 'movil'])
  const movil = { ...sinTexto, ops: { ...EJ.ops, areaOps: { ...EJ.ops.areaOps, tipo: 'defensiva', modalidad: 'movil' } } }
  assert.deepEqual(P.proponer(movil).caps.map((c) => c.forma), ['movil', 'area'])
  assert.deepEqual(P.proponer(CTX, { 2: 'area_alterna' }).caps.map((c) => c.forma), ['area', 'area_alterna'])
  assert.match(P.proponer(CTX, { 2: 'area_alterna' }).caps[1].nombre, /esfuerzo en la AA-2/)
  assert.deepEqual(P.proponer(CTX, { 1: 'movil', 2: 'movil' }).caps.map((c) => c.forma), ['movil', 'area'])
  assert.deepEqual(P.proponer(CTX, { 1: 'ruptura' }).caps.map((c) => c.forma), ['area', 'movil'], 'una forma de otro tipo no vale')
})

await caso('ofensiva y retrógrada: otras formas', () => {
  const of = { ...sinTexto, ops: { ...EJ.ops, areaOps: { ...EJ.ops.areaOps, tipo: 'ofensiva', modalidad: 'ruptura' } } }
  const R = P.proponer(of)
  assert.deepEqual(R.caps.map((c) => c.forma), ['ruptura', 'envolvimiento'])
  assert.match(R.caps[0].campos.QUÉ, /^Ataca/)
  assert.equal(R.caps[0].fases[2].nombre, 'Ataque')
  const re = { ...sinTexto, ops: { ...EJ.ops, areaOps: { ...EJ.ops.areaOps, tipo: 'retrograda' } } }
  assert.deepEqual(P.proponer(re).caps.map((c) => c.forma), ['retardatriz', 'repliegue'])
})

await caso('los avisos: sin fichas de maniobra, sin avenidas, defensa móvil sin unidades móviles', () => {
  const R = P.proponer({ ...CTX, unidades: EJ.unidades.filter((u) => u.bando === 'enemigas'), cmoc: {} })
  assert.ok(R.avisos.some((a) => /No hay fichas propias de maniobra/.test(a)))
  assert.ok(R.avisos.some((a) => /No hay avenidas/.test(a)))
  const aPie = EJ.unidades.map((u) => (u.id === 'divmec2' ? { ...u, arma: 'infanteria' } : u))
  assert.ok(P.proponer({ ...CTX, unidades: aPie }).avisos.some((a) => /defensa móvil necesita unidades mecanizadas/.test(a)))
})

const PEDIDO = { ok: true, prompt: 'Encabezado\n\n---\n\n# LA HOJA\n\nF3·P6\n\n---\n\n# CÓMO CONTESTAR\n\n```json\n{}\n```' }

await caso('la IA recibe la propuesta en la F3·P6 y la F3·P4 (antes de «CÓMO CONTESTAR»), y tiene que juzgarla', () => {
  const r = P.pedido(PEDIDO, { id: 'coa' }, CTX)
  const i = r.prompt.indexOf('# LO QUE PROPONE LA MESA PARA ESTE EJERCICIO')
  assert.ok(i > 0 && i < r.prompt.indexOf('# CÓMO CONTESTAR'))
  assert.match(r.prompt, /## CAP 1 — Defensa de área \(tenaz\) \(esfuerzo en la AA-1\) ← EL ACTIVO/)
  assert.match(r.prompt, /## CAP 2 — Defensa móvil\n/)
  assert.match(r.prompt, /SIRVE o NO SIRVE para ESTE ejercicio, con las cinco pruebas del PMTD/)
  assert.match(r.prompt, /al principio de «Razón fundamental \(por qué este CAP\)»/)
  assert.match(P.pedido(PEDIDO, { id: 'concepto' }, CTX).prompt, /al principio de «Forma de maniobra elegida y por qué»/)
  assert.equal(P.pedido(PEDIDO, { id: 'eventos' }, CTX), PEDIDO, 'las otras hojas, igual')
  const g3con2 = { ...EJ.g3, _caps: { activo: 2 } }
  assert.match(P.pedido(PEDIDO, { id: 'coa' }, { ...CTX, g3: g3con2 }).prompt, /## CAP 2 — Defensa móvil ← EL ACTIVO/)
})

await caso('el pedido que llega como promesa o con error', async () => {
  assert.match((await P.pedido(Promise.resolve(PEDIDO), { id: 'coa' }, CTX)).prompt, /LO QUE PROPONE LA MESA/)
  const err = { ok: false, error: 'x' }
  assert.equal(P.pedido(err, { id: 'coa' }, CTX), err)
})

await caso('los dos CAP en el mismo ejercicio: ida y vuelta sin perder nada', () => {
  const f1 = [{ nombre: 'F1 del CAP 1' }, { nombre: 'F2 del CAP 1' }]
  const g3 = { coa: { QUIÉN: 'cap 1' }, concepto: { x: 'concepto 1' }, eventos: [{ a: 1 }] }
  const fc = { enemigo: [{ nombre: 'E1' }], propio: f1 }
  const a = P.cambiarCAP({ fasesCOA: fc, g3 }, 2)
  assert.ok(a.cambio)
  assert.deepEqual(a.fasesCOA.propio, [])
  assert.deepEqual(a.fasesCOA.enemigo, fc.enemigo, 'las enemigas no se tocan')
  assert.ok(!('coa' in a.g3) && !('concepto' in a.g3))
  assert.deepEqual(a.g3.eventos, g3.eventos, 'las otras hojas no se tocan')
  assert.equal(a.g3._caps.activo, 2)
  // Se trabaja el CAP 2 y se vuelve al 1.
  const fc2 = { ...a.fasesCOA, propio: [{ nombre: 'F1 del CAP 2' }] }
  const g32 = { ...a.g3, coa: { QUIÉN: 'cap 2' } }
  const b = P.cambiarCAP({ fasesCOA: fc2, g3: g32 }, 1)
  assert.deepEqual(b.fasesCOA.propio, f1)
  assert.deepEqual(b.g3.coa, g3.coa)
  assert.deepEqual(b.g3.concepto, g3.concepto)
  assert.equal(b.g3._caps.activo, 1)
  assert.deepEqual(b.g3._caps.guardados[2].fases, [{ nombre: 'F1 del CAP 2' }])
  assert.deepEqual(P.fasesPorCAP(b.g3, b.fasesCOA), { 1: 2, 2: 1 })
  const c = P.cambiarCAP({ fasesCOA: b.fasesCOA, g3: b.g3 }, 2)
  assert.deepEqual(c.fasesCOA.propio, [{ nombre: 'F1 del CAP 2' }])
  assert.deepEqual(c.g3.coa, { QUIÉN: 'cap 2' })
  assert.equal(P.cambiarCAP({ fasesCOA: c.fasesCOA, g3: c.g3 }, 2).cambio, false, 'el mismo CAP: nada')
  assert.deepEqual(P.conFormas(c.g3, { 1: 'area', 2: 'movil' })._caps.formas, { 1: 'area', 2: 'movil' })
  const elegida = P.conForma(c.g3, 2, 'area_alterna')
  assert.deepEqual(P.conFormas(elegida, { 1: 'area', 2: 'movil' })._caps.formas, { 1: 'area', 2: 'area_alterna' }, 'lo elegido manda')
  assert.equal(P.conFormas(P.conFormas(c.g3, { 1: 'area' }), { 1: 'area' })._caps.formas[1], 'area')
  assert.equal(P.cambiarCAP({ fasesCOA: fc, g3 }, 3).cambio, false)
  assert.deepEqual(P.conForma(c.g3, 1, 'movil')._caps.formas, { 1: 'movil' })
  assert.equal(P.conForma(c.g3, 1, 'movil')._caps.activo, 2)
})

await caso('🌱 llevar el CAP a la F3·P6: sólo lo vacío, marcado «[Mesa — verificar]»', () => {
  const cap = P.proponer(CTX).caps[1]
  const r = P.llevarAHoja({ QUIÉN: 'Lo escribió el oficial', QUÉ: '  ' }, cap)
  assert.equal(r.n, 9)
  assert.equal(r.valor.QUIÉN, 'Lo escribió el oficial')
  assert.equal(r.valor.QUÉ, 'Defiende — defensa móvil [Mesa — verificar]')
  assert.equal(P.llevarAHoja(r.valor, cap).n, 0)
})

await caso('🎬 armar las fases 🔵: el dispositivo de ahora, con la tarea de cada unidad y la ★ del esfuerzo principal', () => {
  const cap = P.proponer(CTX).caps[1]
  const fases = P.armarFases(cap, { unidades: EJ.unidades, ops: { limites: [1] } })
  assert.equal(fases.length, 5)
  assert.equal(fases[0].origen, 'Mesa · CAP 2 · antes del D (0400)')
  const div6 = fases[4].unidades.find((u) => u.id === 'div6')
  assert.equal(div6.tarea, 'Contraatacar y destruir al enemigo')
  assert.equal(div6.principal, true, 'la masa de contraataque es el esfuerzo principal')
  assert.equal(div6.lat, EJ.unidades.find((u) => u.id === 'div6').lat, 'no se mueve: la Mesa no inventa lugares')
  assert.equal(fases[4].unidades.find((u) => u.id === 'e-br1').tarea, undefined, 'el enemigo no recibe tarea')
  assert.deepEqual(fases[2].ops, { limites: [1] })
})

await caso('los botones de la Mesa: cambiar, la forma, armar las fases, con candado y sin confirmar', () => {
  const llamadas = []
  const M = {
    fasesCOA: { propio: [{ nombre: 'vieja' }], enemigo: [] },
    g3: { coa: { QUIÉN: 'x' } },
    setFases: (v) => llamadas.push(['fases', typeof v === 'function' ? v(M.fasesCOA) : v]),
    setG3: (v) => llamadas.push(['g3', v]),
    flush: (fc) => fc,
    unidades: EJ.unidades,
    ops: {},
    activa: { bando: 'propio', idx: 0 },
    setActiva: (v) => llamadas.push(['activa', v]),
    setUnidades: () => llamadas.push(['unidades']),
    aviso: (t) => llamadas.push(['aviso', t]),
  }
  assert.ok(P.accion('cambiar', { n: 2, formas: { 1: 'area', 2: 'movil' } }, M))
  assert.deepEqual(llamadas.map((l) => l[0]), ['fases', 'g3', 'activa', 'aviso'])
  assert.deepEqual(llamadas[1][1]._caps.formas, { 1: 'area', 2: 'movil' }, 'quedan guardadas las formas que se veían')
  assert.equal(llamadas[2][1], null, 'se suelta la fase propia activa')
  assert.match(llamadas[3][1], /Ahora trabajás el CAP 2 \(todavía sin fases 🔵\)/)
  llamadas.length = 0
  assert.ok(P.accion('forma', { n: 2, forma: 'area_alterna' }, M))
  assert.deepEqual(llamadas[0][1]._caps.formas, { 2: 'area_alterna' })
  llamadas.length = 0
  const cap = P.proponer(CTX).caps[0]
  assert.equal(P.accion('fases', { cap }, { ...M, confirmar: () => false }), false, 'ya hay fases y no confirmó')
  assert.equal(llamadas.length, 0)
  assert.ok(P.accion('fases', { cap }, { ...M, confirmar: () => true }))
  assert.equal(llamadas[0][1].propio.length, 5)
  assert.deepEqual(llamadas[1], ['activa', { bando: 'propio', idx: 0 }])
  llamadas.length = 0
  let candado = 0
  assert.equal(P.accion('cambiar', { n: 2 }, { ...M, bloqueado: true, avisoBloqueo: () => candado++ }), false)
  assert.equal(candado, 1)
  assert.equal(llamadas.length, 0)
})

await caso('🎬 ver una fase de un CAP: la del activo se toca; la del guardado cambia de CAP y después se toca', async () => {
  const tocadas = []
  const ll = []
  const M = {
    fasesCOA: { propio: [{ nombre: 'F1 CAP 1' }], enemigo: [] },
    g3: { _caps: { activo: 1, guardados: { 2: { fases: [{ nombre: 'F1 CAP 2' }, { nombre: 'F2 CAP 2' }] } } } },
    flush: (fc) => fc,
    setFases: (v) => ll.push(['fases', v]),
    setG3: (v) => ll.push(['g3', v]),
    setActiva: () => {},
    aviso: () => {},
    activarFase: (b, i) => tocadas.push([b, i]),
  }
  assert.ok(P.accion('fase', { n: 1, idx: 0 }, M))
  assert.deepEqual(tocadas, [['propio', 0]])
  assert.equal(ll.length, 0, 'el mismo CAP: no cambia nada más')
  assert.ok(P.accion('fase', { n: 2, idx: 1 }, M))
  assert.equal(ll.find((x) => x[0] === 'g3')[1]._caps.activo, 2, 'cambió al CAP 2')
  assert.equal(ll.find((x) => x[0] === 'fases')[1].propio[1].nombre, 'F2 CAP 2')
  await new Promise((r) => setTimeout(r, 200))
  assert.deepEqual(tocadas, [['propio', 0], ['propio', 1]], 'después de dibujar, la FASE 2 del CAP 2')
  // Con candado: se puede MIRAR una fase del CAP activo, no cambiar de CAP.
  tocadas.length = 0
  assert.ok(P.accion('fase', { n: 1, idx: 0 }, { ...M, bloqueado: true }))
  assert.equal(P.accion('fase', { n: 2, idx: 0 }, { ...M, bloqueado: true, avisoBloqueo: () => {} }), false)
  assert.deepEqual(tocadas, [['propio', 0]])
})

console.log(`cap-propios: ${n} casos ✔`)
