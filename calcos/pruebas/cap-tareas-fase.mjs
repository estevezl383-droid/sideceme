// 🎯 Las tareas tácticas de las fases de los CAP, CON SU UNIDAD, y ➜ el itinerario con flechas
// (calcos/cap-propios/v1/tareas-fase.mjs, posiciones.mjs, proponer.mjs, carta-ia.mjs, itinerario.mjs). El caso de
// Sergio, 25-10-2026, con la FASE I del CAP 1 a la vista: «la OC y la OD deben permanecer con su nombre con la unidad…
// están solas ya esperando en un lugar», «las tareas tácticas deben aparecer con la unidad, no solas», «cada fase tiene
// una tarea táctica diferente, y las que se ven sólo aparecerían en la FASE III», «que su desplazamiento quede marcado
// con una línea flecha… violeta y fucsia… en la fase última todo su itinerario» y «el CAP 2 no está funcionando nada».
// Con el ejercicio de prueba del CE-I, sus agrupaciones (OD, OC 1, OC 2, RES) y las tareas de la F3·P3 en la carta.
//   node cap-tareas-fase.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as P from '../cap-propios/v1/proponer.mjs'
import { posicionesCAP } from '../cap-propios/v1/posiciones.mjs'
import * as T from '../cap-propios/v1/tareas-fase.mjs'
import * as C from '../cap-propios/v1/carta-ia.mjs'
import { tramos, COLOR_CAP, capActivo } from '../cap-propios/v1/itinerario.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto } = require('./concepto-ejemplo.js')
const X = require('./cap-carta-ejemplo.js')

let n = 0
const caso = async (nombre, fn) => { await fn(); n++; console.log('  ✔ ' + nombre) }
const RAD = Math.PI / 180
const km = (a, b) => Math.hypot((a[0] - b[0]) * 111.32 * Math.cos(((a[1] + b[1]) / 2) * RAD), (a[1] - b[1]) * 110.574)
const pos = (f, id) => { const u = (f.unidades || []).find((x) => x.id === id); return u ? [u.lng, u.lat] : null }

const EJ = ejercicioConcepto()
const ag = (id, nom, op, lng, lat, arma, piezas = []) => ({ id, designacion: nom, bando: 'propias', tipo: 'unidad', escalon: 'brigada', arma, lng, lat, agId: 'g-' + id, esAgrupacion: true, agrupacion: true, operacionAg: op, piezasAg: piezas, tareaAg: '', propositoAg: '' })
const AGS = [
  ag('ag-od', 'OD', 'od', -68.75, -18.45, 'mecanizada', [{ id: 'divmec2-1', de: 'divmec2', madre: 'DIV MEC-2' }]),
  ag('ag-oc1', 'OC 1', 'oc1', -68.75, -18.72, 'infanteria', [{ id: 'div1-1', de: 'div1', madre: 'DIV-1' }]),
  ag('ag-oc2', 'OC 2', 'oc2', -68.8, -18.57, 'infanteria'),
  ag('ag-res', 'RES', 'reserva', -68.5, -18.62, 'artilleria', [{ id: 'div6-1', de: 'div6', madre: 'DIV-6' }]),
]
const US = [...EJ.unidades, ...AGS]
// Las tareas de la Formación inicial (F3·P3) en la carta, cada una con su operación y su agrupación.
const T_OD = { centro: [-68.8, -18.44], tarea: 'bloquear', escalon: 'brigada', rot: 270, escala: 1, oi: { id: 'oi-od', operacion: 'od', agId: 'g-ag-od', piezas: [{ id: 'divmec2-1', de: 'divmec2' }] } }
const T_OC1 = { centro: [-68.8, -18.71], tarea: 'fijar', escalon: 'brigada', rot: 270, escala: 1, oi: { id: 'oi-oc1', operacion: 'oc1', agId: 'g-ag-oc1', piezas: [] } }
const T_OC2 = { centro: [-68.84, -18.57], tarea: 'contener', escalon: 'brigada', rot: 270, escala: 1, oi: { id: 'oi-oc2', operacion: 'oc2', agId: 'g-ag-oc2', piezas: [] } }
const OPS = {
  ...EJ.ops,
  limites: [
    { nombre: 'LPR (LF «PUMA»)', coords: [[-68.86, -18.3], [-68.84, -18.9]], co: { id: 'x1', rol: 'lpr' } },
    { nombre: 'LDE-1', coords: [[-69.08, -18.3], [-69.08, -18.9]], co: { id: 'x2', rol: 'linea' } },
    { nombre: 'EJE CA-1', coords: [[-68.5, -18.6], [-68.86, -18.48]], co: { id: 'x3', rol: 'eje-ca' } },
    { nombre: 'LÍM. DIV MEC-2 / DIV-1', coords: [[-68.4, -18.59], [-69.1, -18.59]], co: { id: 'x4', rol: 'limite-sector' } },
  ],
  obstaculos: [{ tipo: 'minado_ac', centro: [-68.9, -18.45] }, { tipo: 'minado_ac', centro: [-68.9, -18.75] }],
  tareas: [T_OD, T_OC1, T_OC2],
}
const MARCAS = [
  { tipo: 'esfuerzo', clase: 'principal', texto: 'ESFUERZO PRINCIPAL · DIV MEC-2', centro: [-68.8, -18.47] },
  { tipo: 'esfuerzo', clase: 'secundario', texto: 'ESFUERZO SECUNDARIO · DIV-1', centro: [-68.8, -18.78] },
  { tipo: 'reserva', texto: 'RES · DIV-6', centro: [-68.55, -18.62] },
]
const CTX = { unidades: US, ops: OPS, cmoc: EJ.cmoc, ordenSup: EJ.ordenSup, g3: { ...EJ.g3, conceptoCarta: { marcas: MARCAS } } }
const PR = P.proponer(CTX)
const [CAP1, CAP2] = PR.caps
const ENEMIGO = [-69.4, -18.425]
// Arma las fases de un CAP como el botón 🎬 del panel (posiciones + cada tarea con su unidad).
const armar = (cap, { us = US, ops = OPS, previas = null } = {}) =>
  T.tareasPorFase(P.armarFases(cap, { unidades: us, ops, posiciones: posicionesCAP(cap, { unidades: us, ops, marcas: MARCAS, A: PR.A, previas }) }), { n: cap.n })
const tareasDe = (f) => (f.ops?.tareas || []).map((t) => `${t.tarea}${t.oi ? `·${t.oi.operacion}` : t.capIA ? `·IA ${t.capIA.unidad}` : ''}`).sort()
// Las tareas pegadas a las fichas en esa fase (la de su rol): «tarea·unidad».
const pegadas = (f) => (f.unidades || []).filter((u) => u.tareaSimbolo).map((u) => `${u.tareaSimbolo}·${u.designacion}`).sort()

await caso('la unidad de cada tarea: su agrupación (agId), la que nombró la IA, la única de su operación, la de sus piezas', () => {
  assert.equal(T.duenoDeTarea(T_OD, US).id, 'ag-od', 'por su agrupación')
  assert.equal(T.duenoDeTarea({ centro: [0, 0], tarea: 'fijar', capIA: { cap: 1, fase: 4, unidad: 'DIV-1' } }, US).id, 'div1', 'la que nombró la IA')
  assert.equal(T.duenoDeTarea({ centro: [0, 0], tarea: 'fijar', oi: { id: 'x', operacion: 'oc2' } }, US).id, 'ag-oc2', 'la única OC 2')
  assert.equal(T.duenoDeTarea({ centro: [0, 0], tarea: 'fijar', oi: { id: 'x', operacion: 'oc3', piezas: [{ de: 'div6' }, { de: 'div6' }, { madre: 'DIV-1' }] } }, US).id, 'div6', 'la de más piezas')
  assert.equal(T.duenoDeTarea({ centro: [0, 0], tarea: 'fijar', oi: { id: 'x', operacion: 'oc3', piezas: [{ madre: 'DIV MEC-2' }] } }, US).id, 'divmec2', 'por la madre de las piezas')
  assert.equal(T.duenoDeTarea({ centro: [0, 0], tarea: 'fijar' }, US), null, 'sin unidad')
  assert.equal(T.duenoDeTarea({ centro: [0, 0], tarea: 'fijar', capIA: { unidad: '1ª BR. AC. «CORACEROS»' } }, US), null, 'una ficha enemiga no cumple tareas propias')
  assert.equal(T.duenoDeReserva({ agId: 'g-ag-res' }, US).id, 'ag-res')
  assert.equal(T.duenoDeReserva({ piezas: [{ de: 'div6' }] }, US.filter((u) => u.id !== 'ag-res')).id, 'div6')
})

await caso('las tareas de la carta (F3·P3) SÓLO en la FASE III y con su unidad; en las demás, guardadas aparte', () => {
  const fs = armar(CAP1)
  assert.equal(fs.length, 5)
  for (const [i, f] of fs.entries()) {
    const oi = (f.ops.tareas || []).filter((t) => t.oi).map((t) => t.oi.operacion).sort()
    const ocultas = (f.ops.tareasOcultas || []).map((t) => t.oi.operacion).sort()
    if (i === 2) {
      assert.deepEqual(oi, ['oc1', 'oc2', 'od'], 'FASE III: las tres, a la vista')
      assert.deepEqual(ocultas, [])
    } else {
      assert.deepEqual(oi, [], `FASE ${i + 1}: ninguna de la F3·P3 a la vista («no hacen esa tarea todas las fases»)`)
      assert.deepEqual(ocultas, ['oc1', 'oc2', 'od'], `FASE ${i + 1}: guardadas aparte (para el rótulo OD / OC con su unidad)`)
    }
  }
  // En la FASE III cada agrupación está JUNTO A SU TAREA (antes estaba a 5 km).
  assert.ok(km(AGS[0].lng ? [AGS[0].lng, AGS[0].lat] : null, T_OD.centro) > 4, 'la OD estaba lejos de su tarea')
  for (const [id, t] of [['ag-od', T_OD], ['ag-oc1', T_OC1], ['ag-oc2', T_OC2]]) {
    const d = km(pos(fs[2], id), t.centro)
    assert.ok(d <= T.CERCA, `FASE III: ${id} con su tarea (${d.toFixed(2)} km)`)
  }
  // En la FASE I, todas con el CE: la tarea no está «sola esperando».
  assert.ok(km(pos(fs[0], 'ag-od'), [-68.4, -18.55]) <= 6.1)
})

await caso('cada fase con SU tarea táctica, DISTINTA de la anterior y pegada a la ficha que la cumple (CAP 1, defensa de área)', () => {
  const fs = armar(CAP1)
  assert.deepEqual(fs.map(tareasDe), [[], [], ['bloquear·od', 'contener·oc2', 'fijar·oc1'], [], []], 'en la carta, sólo las de la F3·P3 y sólo en la FASE III')
  assert.deepEqual(fs.slice(0, 3).map(pegadas), [[], [], []], 'FASE I y II: todavía no hay tareas; FASE III: las de la carta (no se repiten pegadas)')
  // FASE IV: la OD bloqueó en la III → destruye; la OC 1 fijó → contiene; la OC 2 contuvo → fija. FASE V: la reserva
  // destruye y las demás mantienen. Ninguna repite la tarea de la fase anterior.
  assert.deepEqual(pegadas(fs[3]), ['contener·OC 1', 'destruir·OD', 'fijar·OC 2'])
  assert.deepEqual(pegadas(fs[4]), ['destruir·RES', 'mantener·OC 1', 'mantener·OC 2', 'mantener·OD'])
  // La cumple la agrupación (la OD, la OC…), no también la división de la que sale: no se repite.
  assert.ok(!fs[3].unidades.some((u) => ['divmec2', 'div1', 'div6'].includes(u.id) && u.tareaSimbolo))
  // La agrupación lleva el texto de su rol en cada fase (la tarea que se lee al tocarla).
  assert.equal(fs[3].unidades.find((u) => u.id === 'ag-od').tarea, 'Detener al enemigo en la AA-1')
  assert.equal(fs[0].unidades.find((u) => u.id === 'ag-od').tarea, 'Concentrarse en su zona de reunión')
  // Armar con la FASE IV a la vista: las fichas traen su «destruir», pero la FASE I no lo hereda.
  const otra = armar(CAP1, { us: fs[3].unidades, ops: fs[3].ops, previas: fs })
  assert.deepEqual(otra.map(pegadas), fs.map(pegadas))
})

await caso('CAP 2 (defensa móvil): el retardo canaliza, la fijadora cambia de tarea, la masa destruye; la OD del retardo no está con su tarea de la F3·P3', () => {
  const fs = armar(CAP2)
  assert.deepEqual(pegadas(fs[3]), ['canalizar·OD', 'contener·OC 1', 'fijar·OC 2'])
  assert.deepEqual(pegadas(fs[4]), ['destruir·RES', 'mantener·OC 1', 'mantener·OC 2'])
  // En la FASE III la OD (la del retardo) está sobre la LDE-1, lejos de su «bloquear»: esa tarea no se ve sola.
  assert.ok(Math.abs(pos(fs[2], 'ag-od')[0] - -69.08) < 0.03, 'la OD con el retardo sobre la LDE-1')
  assert.deepEqual(tareasDe(fs[2]), ['contener·oc2', 'fijar·oc1'])
  assert.ok(fs[2].ops.tareasOcultas.some((t) => t.oi.id === 'oi-od'))
})

await caso('armar de nuevo desde una fase a la vista da lo mismo (sin repetir tareas) y no trae las del otro CAP', () => {
  const fs = armar(CAP1)
  // Desde la FASE IV a la vista (su calco: las tareas de la Mesa de esa fase + las de la F3·P3 guardadas aparte).
  const otra = armar(CAP1, { us: fs[3].unidades, ops: fs[3].ops, previas: fs })
  assert.deepEqual(otra.map(tareasDe), fs.map(tareasDe))
  assert.deepEqual(otra.map((f) => (f.ops.tareasOcultas || []).length), fs.map((f) => (f.ops.tareasOcultas || []).length))
  // Con el calco del CAP 1 a la vista, armar el CAP 2 no trae las tareas ni los obstáculos que la IA puso para el CAP 1.
  const ops = { ...fs[3].ops, tareas: [...fs[3].ops.tareas, { centro: [-68.9, -18.5], tarea: 'fijar', capIA: { cap: 1, fase: 4, unidad: 'DIV-1' } }], obstaculos: [...fs[3].ops.obstaculos, { tipo: 'minado_ac', centro: [-68.9, -18.6], capIA: { cap: 1, fase: 3 } }] }
  const c2 = armar(CAP2, { us: fs[3].unidades, ops })
  assert.ok(c2.every((f) => !(f.ops.tareas || []).some((t) => t.capIA)))
  assert.ok(c2.every((f) => !f.ops.obstaculos.some((o) => o.capIA?.cap === 1)))
  // Aplicarlo dos veces da lo mismo.
  assert.deepEqual(T.tareasPorFase(fs, { n: 1 }), fs)
})

await caso('🤖 la IA: cada tarea con su unidad (si la dejó lejos, va junto a ella y ahí se queda); las de la F3·P3, sólo en la fase 3', () => {
  const mesaPos = {}
  for (const c of PR.caps) mesaPos[c.n] = (forma) => posicionesCAP(forma && forma !== c.forma ? P.armarCAP(c.n, forma, PR.A) : c, { unidades: US, ops: OPS, marcas: MARCAS, A: PR.A })
  const r = C.leerRespuesta(X.RESPUESTA_TEXTO, { ...CTX, lugares: [], mesaPos, tareas: X.TAREAS, obstaculos: X.OBSTACULOS })
  assert.ok(r.ok, r.error)
  const f = r.caps[1].fases
  // Fase 4: la DIV-1 estaba en Julo y su «Fijar» en la AIN-5 (a 7 km): va junto a la AIN-5 y en la fase 5 sigue ahí.
  const ain5 = [-69.0, -18.8]
  assert.ok(km(pos(f[3], 'div1'), ain5) <= T.CERCA, `fase 4: la DIV-1 junto a su tarea (${km(pos(f[3], 'div1'), ain5).toFixed(1)} km)`)
  assert.deepEqual(pos(f[4], 'div1'), pos(f[3], 'div1'), 'fase 5: se queda ahí')
  assert.ok(km(pos(f[2], 'div1'), ain5) > 5, 'en la fase 3 estaba en Julo')
  // Las de la F3·P3: sólo en la fase 3 (y con su unidad); en las otras, guardadas aparte.
  assert.deepEqual(f.map((x) => (x.ops.tareas || []).filter((t) => t.oi).length), [0, 0, 3, 0, 0])
  assert.deepEqual(f.map((x) => (x.ops.tareasOcultas || []).length), [3, 3, 0, 3, 3])
  for (const [id, t] of [['ag-od', T_OD], ['ag-oc1', T_OC1], ['ag-oc2', T_OC2]]) assert.ok(km(pos(f[2], id), t.centro) <= T.CERCA, `fase 3: ${id} con su tarea`)
  // Las de la IA, sólo en su fase.
  assert.deepEqual(f.map((x) => (x.ops.tareas || []).filter((t) => t.capIA).map((t) => t.tarea)), [[], [], [], ['bloquear', 'fijar'], ['destruir']])
})

await caso('🤖 el pedido: cada fase con su tarea, la unidad con su tarea, y las que ya están en la carta (de la fase 3)', () => {
  const p = C.pedidoCarta({ ctx: CTX, P: PR, tareas: X.TAREAS, obstaculos: X.OBSTACULOS }).prompt
  assert.match(p, /CADA FASE TIENE SU TAREA TÁCTICA: una unidad no hace la misma tarea todas las fases/)
  assert.match(p, /Cada TAREA TÁCTICA va con SU UNIDAD/)
  assert.match(p, /## Tareas tácticas que ya están en la carta \(Formación inicial, F3·P3\) — son de la FASE 3, con su unidad\n- OD · Bloquear — OD — en /)
  assert.match(p, /- OC 1 · Fijar — OC 1 — en /)
})

await caso('🎬 el CAP guardado se arma desde su tarjeta: sus fases quedan guardadas y la Mesa pasa a él con la fase pedida', async () => {
  const copiadas = ['a', 'b', 'c', 'd', 'e'].map((nombre) => ({ nombre, unidades: US, ops: OPS, desplazamientos: [] }))
  const ll = []
  const M = {
    fasesCOA: { propio: armar(CAP1), enemigo: [] },
    g3: { coa: { QUÉ: 'del CAP 1' }, _caps: { activo: 1, formas: { 1: 'area', 2: 'movil' }, guardados: { 2: { fases: copiadas, coa: { QUÉ: 'del CAP 2' } } } } },
    unidades: US,
    ops: OPS,
    activa: { bando: 'propio', idx: 0 },
    setFases: (v) => ll.push(['fases', typeof v === 'function' ? v(M.fasesCOA) : v]),
    setG3: (v) => ll.push(['g3', typeof v === 'function' ? v(M.g3) : v]),
    setActiva: (v) => ll.push(['activa', v]),
    activarFase: (b, i) => ll.push(['tocar', b, i]),
    confirmar: (t) => (ll.push(['confirmar', t]), true),
    aviso: (t) => ll.push(['aviso', t]),
  }
  const d = { cap: CAP2, formas: { 1: 'area', 2: 'movil' }, posiciones: (us, ops, x) => posicionesCAP(CAP2, { unidades: us, ops, marcas: MARCAS, A: PR.A, previas: x?.previas }), conTareas: (fs) => T.tareasPorFase(fs, { n: 2 }), ver: 2 }
  assert.equal(P.accion('fases', d, M), true)
  assert.match(ll.find((x) => x[0] === 'confirmar')[1], /El CAP 2 ya tiene 5 fase\(s\) 🔵 \(guardado\)[\s\S]*muestra su FASE III/)
  const fases = ll.find((x) => x[0] === 'fases')[1]
  assert.equal(fases.propio.length, 5, 'las fases nuevas del CAP 2 a la vista')
  assert.ok(Math.abs(pos(fases.propio[2], 'ag-od')[0] - -69.08) < 0.03, 'FASE III del CAP 2: la OD con el retardo en la LDE-1 (antes, todas iguales)')
  assert.notDeepEqual(pos(fases.propio[0], 'divmec2'), pos(fases.propio[2], 'divmec2'), 'ya no son copias')
  const g3 = ll.find((x) => x[0] === 'g3')[1]
  assert.equal(g3._caps.activo, 2)
  assert.equal(g3.coa.QUÉ, 'del CAP 2', 'la F3·P6 del CAP 2')
  assert.equal(g3._caps.guardados[1].coa.QUÉ, 'del CAP 1', 'el CAP 1 quedó guardado')
  assert.equal(g3._caps.guardados[1].fases.length, 5)
  assert.ok(!g3._caps.guardados[2], 'el CAP 2 ya no está guardado: está a la vista')
  assert.deepEqual(ll.find((x) => x[0] === 'activa'), ['activa', null])
  await new Promise((ok) => setTimeout(ok, 200))
  assert.deepEqual(ll.find((x) => x[0] === 'tocar'), ['tocar', 'propio', 2], 'muestra la FASE III del CAP 2')
  // Desde el aviso de las fases copiadas (ya confirmó): no pregunta otra vez.
  ll.length = 0
  assert.equal(P.accion('fases', { ...d, sinPreguntar: true, ver: 0 }, M), true)
  assert.ok(!ll.some((x) => x[0] === 'confirmar'))
  // Con candado, nada.
  ll.length = 0
  assert.equal(P.accion('fases', d, { ...M, bloqueado: true, avisoBloqueo: () => ll.push(['candado']) }), false)
  assert.deepEqual(ll, [['candado']])
})

await caso('➜ el itinerario: los tramos de la FASE I a la que está a la vista (en la última, todo); CAP 1 violeta, CAP 2 fucsia', () => {
  const fs = armar(CAP1)
  assert.deepEqual(tramos({ fases: fs, idx: 0 }), [], 'FASE I: todavía ninguno')
  const t2 = tramos({ fases: fs, idx: 2 })
  assert.ok(t2.length > 0)
  assert.ok(t2.every((t) => t.hasta <= 2 && t.km >= 0.3))
  const od = t2.filter((t) => t.id === 'ag-od')
  assert.deepEqual(od.map((t) => [t.desde, t.hasta]), [[0, 1], [1, 2]], 'la OD: I→II y II→III')
  assert.deepEqual(od[1].a, pos(fs[2], 'ag-od'))
  assert.ok(!t2.some((t) => /^e-/.test(t.id)), 'las enemigas no')
  assert.ok(!t2.some((t) => t.id === 'pc-ce'), 'el CE no se mueve')
  const todo = tramos({ fases: fs, idx: 4 })
  assert.ok(todo.some((t) => t.id === 'ag-res' && t.hasta === 4), 'en la FASE V, el contraataque de la reserva')
  assert.ok(todo.length > t2.length)
  // La ficha que se arrastra en la fase a la vista: su tramo la sigue.
  const movida = fs[2].unidades.map((u) => (u.id === 'ag-od' ? { ...u, lng: u.lng + 0.1 } : u))
  assert.equal(tramos({ fases: fs, idx: 2, actuales: movida }).find((t) => t.id === 'ag-od' && t.hasta === 2).a[0], pos(fs[2], 'ag-od')[0] + 0.1)
  assert.equal(COLOR_CAP[1], '#8f00ff')
  assert.equal(COLOR_CAP[2], '#ff00ff')
  assert.equal(capActivo({ _caps: { activo: 2 } }), 2)
  assert.equal(capActivo({}), 1)
})

console.log(`cap-tareas-fase: ${n} casos ✔`)
