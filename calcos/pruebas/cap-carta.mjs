// 🤖 La IA desarrolla los dos CAP propios y la Mesa los coloca en la carta (calcos/cap-propios/v1/carta-ia.mjs y la
// acción «colocar» de proponer.mjs), con el ejercicio de prueba del CE-I y una respuesta de IA de ejemplo
// (cap-carta-ejemplo.js): las unidades en su lugar fase por fase, las tareas tácticas, los obstáculos, la F3·P6 de
// cada CAP, lo que no se pudo ubicar; el CAP activo a la vista y el otro guardado.
//   node cap-carta.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as C from '../cap-propios/v1/carta-ia.mjs'
import * as P from '../cap-propios/v1/proponer.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto } = require('./concepto-ejemplo.js')
const X = require('./cap-carta-ejemplo.js')

let n = 0
const caso = async (nombre, fn) => { await fn(); n++; console.log('  ✔ ' + nombre) }

const EJ = ejercicioConcepto()
const CTX = { unidades: EJ.unidades, ops: EJ.ops, cmoc: EJ.cmoc, ordenSup: EJ.ordenSup, g3: EJ.g3, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS }
const pos = (f, id) => { const u = f.unidades.find((x) => x.id === id); return [u.lng, u.lat] }
const km = (a, b) => Math.hypot((a[0] - b[0]) * 105.6, (a[1] - b[1]) * 110.6)

await caso('las piezas de la carta: el nomenclátor del A.O. y las fichas de cada bando', () => {
  const pz = C.piezas(CTX)
  assert.ok(pz.nomenclator.some((l) => l.nom === 'Ungallire'))
  assert.ok(!pz.nomenclator.some((l) => l.nom === 'Putre'), 'Putre queda a más de 30 km del A.O.')
  assert.deepEqual(pz.rojas.map((u) => u.designacion), ['1ª BR. AC. «CORACEROS»', 'GAAP N° 4 «MIRAFLORES»'])
  assert.deepEqual(pz.ubicar('Guata').p, [-68.97, -18.49])
  assert.deepEqual(pz.ubicar('AIN-3').p, [-69.2, -18.5])
})

await caso('el pedido: expediente, propuesta, piezas con nombres exactos, catálogos y el JSON de los dos CAP', () => {
  const r = C.pedidoCarta({ ctx: CTX, P: P.proponer(CTX), expediente: '# EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR\n\n## 1 · LA ORDEN\nEl CE-I defiende…', tareas: X.TAREAS, obstaculos: X.OBSTACULOS })
  const p = r.prompt
  assert.ok(r.ok)
  for (const t of ['# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO', '# EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR', '# TAREA — DESARROLLAR LOS DOS CURSOS DE ACCIÓN PROPIOS Y COLOCARLOS EN LA CARTA', '# LO QUE PROPONE LA MESA PARA ESTE EJERCICIO', '# LAS PIEZAS DE LA CARTA', '# CÓMO CONTESTAR'])
    assert.ok(p.includes(t), t)
  assert.match(p, /- DIV MEC-2 — division mecanizada — hoy en -18\.4200, -68\.7000 \(a 6 km de Macaya\)/)
  assert.match(p, /- Ungallire → -18\.4700, -69\.0200/)
  assert.match(p, /- AIN-3: -18\.5000, -69\.2000/)
  assert.match(p, /bloquear \(Bloquear\)/)
  assert.match(p, /zanja_at \(Zanja antitanque, línea\)/)
  assert.match(p, /Desarrollá LOS DOS CAP en la carta/)
  assert.match(p, /Tu juicio de los dos CAP va en «juicio»/)
  assert.ok(!/← EL ACTIVO/.test(p), 'acá van los dos, no uno activo')
  // La Mesa pone la tarea adelante: el bloque ```json de «CÓMO CONTESTAR» es el último.
  const json = p.slice(p.lastIndexOf('# CÓMO CONTESTAR')).match(/```json\s*\n([\s\S]*?)\n\s*```/)[1]
  assert.ok(JSON.parse(json).caps[0].fases[0].unidades)
  assert.ok(p.indexOf('# LAS PIEZAS') < p.lastIndexOf('# CÓMO CONTESTAR'))
})

await caso('la respuesta: los dos CAP con cinco fases, cada unidad donde dijo la IA y las demás donde estaban', () => {
  const r = C.leerRespuesta(X.RESPUESTA_TEXTO, CTX)
  assert.ok(r.ok, r.error)
  assert.equal(r.resumen, 'CAP 1: 5 fases · CAP 2: 5 fases')
  const c1 = r.caps[1].fases
  assert.deepEqual(c1.map((f) => f.nombre), ['Concentración', 'Desplazamiento', 'Ocupación y organización', 'Conducción de la defensa', 'Contraataque y consolidación'])
  assert.equal(c1[0].origen, 'IA · CAP 1 · D-10 a D-8')
  assert.deepEqual(pos(c1[0], 'divmec2'), [-68.3, -18.5], 'fase 1: Turco')
  assert.deepEqual(pos(c1[2], 'divmec2'), [-68.86, -18.36], 'fase 3: Estancia Esmeralda')
  assert.deepEqual(pos(c1[3], 'divmec2'), [-68.97, -18.49], 'fase 4: Guata')
  assert.deepEqual(pos(c1[4], 'divmec2'), [-68.97, -18.49], 'fase 5: no se movió, queda en Guata')
  assert.deepEqual(pos(c1[3], 'div6'), [-68.5, -18.55], 'la DIV-6 sigue en Estancia Ticanani en la fase 4')
  assert.equal(c1[3].unidades.find((u) => u.id === 'divmec2').tarea, 'Detener al enemigo en la AA-1')
  assert.deepEqual(pos(c1[0], 'e-br1'), [-69.35, -18.45], 'el enemigo no se toca')
  // La IA puso la DIV-6 en unas coordenadas y su «destruir» en Macaya, a 13 km: va junto a su tarea (25-10-2026).
  assert.ok(km(pos(r.caps[2].fases[4], 'div6'), [-68.68, -18.47]) <= 1, 'CAP 2 · fase 5: la DIV-6 junto a su tarea en Macaya')
  // Sin tarea lejos, la unidad queda en las coordenadas «lat, lng» que dio la IA.
  const sinTarea = JSON.parse(JSON.stringify(X.RESPUESTA_CAP))
  sinTarea.caps[1].fases[4].tareas = []
  assert.deepEqual(pos(C.leerRespuesta(JSON.stringify(sinTarea), CTX).caps[2].fases[4], 'div6'), [-68.8, -18.49], 'coordenadas «lat, lng»')
})

await caso('las tareas tácticas (sólo en su fase, apuntando a donde dijo) y los obstáculos (se acumulan)', () => {
  const r = C.leerRespuesta(X.RESPUESTA_TEXTO, CTX)
  const c1 = r.caps[1].fases
  assert.equal(c1[2].ops.tareas.length, 0)
  const [bloq, fijar] = c1[3].ops.tareas
  assert.deepEqual({ ...bloq, capIA: undefined }, { centro: [-68.97, -18.49], tarea: 'bloquear', escalon: 'division', rot: 293, escala: 1, capIA: undefined })
  assert.equal(fijar.tarea, 'fijar', '«Fijar» por su nombre')
  assert.deepEqual(fijar.centro, [-69, -18.8], 'en la AIN-5')
  assert.deepEqual(c1[4].ops.tareas.map((t) => t.tarea), ['destruir'], 'las de la fase 4 no siguen en la 5')
  assert.equal(c1[1].ops.obstaculos.length, 0)
  assert.deepEqual(c1[2].ops.obstaculos.map((o) => o.tipo), ['minado_ac', 'zanja_at'])
  assert.deepEqual(c1[4].ops.obstaculos.map((o) => o.tipo), ['minado_ac', 'zanja_at'], 'lo construido queda')
  assert.equal(c1[2].ops.obstaculos[0].coords.length, 5, 'el campo minado es un área')
  assert.deepEqual(c1[2].ops.obstaculos[1].coords, [[-69.02, -18.47], [-68.97, -18.49]], 'la zanja va de Ungallire a Guata')
  assert.equal(r.caps[2].fases[4].ops.obstaculos.length, 1, 'cada CAP con sus obstáculos')
  assert.ok(!('ains' in c1[0].ops), 'las A.I.N. no van en la fase (son de la carta)')
})

await caso('lo que no se pudo: la unidad que no existe y el lugar que no está en la carta (queda donde estaba)', () => {
  const r = C.leerRespuesta(X.RESPUESTA_TEXTO, CTX)
  assert.deepEqual(r.faltan, ['CAP 1 · fase 2: la unidad «DIV-7» no está en las fichas', 'CAP 2 · fase 3: «Cerro Comanchi» (DIV-6) no está en la carta; quedó donde estaba', 'CAP 2 · fase 4: el lugar del fuego «apoyo» («Pampa Inexistente») no está en la carta'])
  assert.deepEqual(pos(r.caps[2].fases[2], 'div6'), pos(r.caps[2].fases[1], 'div6'))
})

await caso('la F3·P6 de cada CAP y el juicio en «Razón fundamental»', () => {
  const r = C.leerRespuesta(X.RESPUESTA_TEXTO, CTX)
  assert.equal(r.caps[1].f3p6.QUÉ, 'Defiende. [IA — verificar]')
  assert.match(r.caps[1].f3p6['Razón fundamental (por qué este CAP)'], /^CAP 1: SIRVE — adecuado: retiene la LF «PUMA».*\nCAP 2: SIRVE/s)
  assert.equal(r.caps[2].f3p6['Denominación del CAP'], 'CAP 2 — Defensa móvil [IA — verificar]')
  assert.match(r.juicio, /^CAP 1: SIRVE/)
})

await caso('respuestas que no sirven', () => {
  assert.match(C.leerRespuesta('No puedo hacer eso.', CTX).error, /No se pudo leer la respuesta de la IA\. No se encontró un JSON/)
  assert.match(C.leerRespuesta('```json\n{"juicio":"x"}\n```', CTX).error, /no trae «caps»/)
  assert.match(C.leerRespuesta('{"caps":[{"cap":1,"fases":[]}]}', CTX).error, /sin «fases»/)
  // Sin bloque ```json, el JSON suelto también se lee.
  assert.ok(C.leerRespuesta(JSON.stringify(X.RESPUESTA_CAP), CTX).ok)
})

await caso('colocar: el CAP activo a la vista (fases y calco de la fase 1), el otro guardado, la F3·P6 sin pisar al oficial', () => {
  const r = C.leerRespuesta(X.RESPUESTA_TEXTO, CTX)
  const ll = []
  const M = {
    fasesCOA: { propio: [], enemigo: [] },
    g3: { coa: { QUÉ: 'Lo escribió el oficial', QUIÉN: `Algo de la Mesa ${P.MARCA}` }, concepto: { a: 1 } },
    setFases: (v) => ll.push(['fases', typeof v === 'function' ? v(M.fasesCOA) : v]),
    setG3: (v) => ll.push(['g3', v]),
    setActiva: (v) => ll.push(['activa', v]),
    setUnidades: (v) => ll.push(['unidades', v]),
    setOps: (v) => ll.push(['ops', typeof v === 'function' ? v({ ains: [{ n: 9 }] }) : v]),
    aviso: (t) => ll.push(['aviso', t]),
  }
  assert.ok(P.accion('colocar', { resultado: r }, M))
  const de = (k) => ll.find((x) => x[0] === k)?.[1]
  assert.equal(de('fases').propio.length, 5)
  assert.equal(de('fases').propio[2].nombre, 'Ocupación y organización')
  const g = de('g3')
  assert.equal(g.coa.QUÉ, 'Lo escribió el oficial', 'lo del oficial no se toca')
  assert.equal(g.coa.QUIÉN, 'El CE-I (DIV MEC-2, DIV-1, DIV-6). [IA — verificar]', 'lo de la Mesa lo reemplaza la IA')
  assert.equal(g._caps.activo, 1)
  assert.deepEqual(g._caps.formas, { 1: 'area', 2: 'movil' })
  assert.equal(g._caps.guardados[2].fases.length, 5)
  assert.equal(g._caps.guardados[2].coa['Denominación del CAP'], 'CAP 2 — Defensa móvil [IA — verificar]')
  assert.deepEqual(g.concepto, { a: 1 })
  assert.deepEqual(de('activa'), { bando: 'propio', idx: 0 })
  assert.deepEqual(de('ops').ains, [{ n: 9 }], 'las A.I.N. de la carta se conservan')
  assert.match(de('aviso'), /CAP 1 \(5 fases, a la vista\) y CAP 2 \(5 fases, guardado\)/)
  // Con el CAP 2 activo, el 2 va a la vista y el 1 se guarda.
  ll.length = 0
  assert.ok(P.accion('colocar', { resultado: r }, { ...M, g3: { _caps: { activo: 2 } } }))
  assert.equal(de('fases').propio[2].nombre, 'Organización de la defensa móvil')
  assert.equal(de('g3')._caps.guardados[1].fases.length, 5)
  // Si ya hay fases y no confirma, nada.
  ll.length = 0
  assert.equal(P.accion('colocar', { resultado: r }, { ...M, fasesCOA: { propio: [{}], enemigo: [] }, confirmar: () => false }), false)
  assert.equal(ll.length, 0)
})

console.log(`cap-carta: ${n} casos ✔`)
