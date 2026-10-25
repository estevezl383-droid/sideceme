// ⚔️ El evento crítico de la F4·P6-7 (calcos/evento-critico/v1/modelo.mjs): una fase 🔵 del CAP frente a una fase 🔴
// del CAE, medidas, la más crítica, guardada en la hoja, anotada en la matriz y armada para el Juego de Guerra.
//   node calcos/pruebas/evento-critico.mjs
import assert from 'node:assert/strict'
import * as M from '../evento-critico/v1/modelo.mjs'

let fallos = 0
const caso = (n, f) => {
  try {
    f()
    console.log('✓ ' + n)
  } catch (e) {
    fallos++
    console.error('✗ ' + n + '\n  ' + e.message)
  }
}
// Un ejercicio FICTICIO: el CE-I (FICT.) defiende al este; la 1ª BR. AC. (FICT.) ataca del oeste.
const azul = (id, lng, lat, escalon = 'division') => ({ id, designacion: id.toUpperCase(), bando: 'propias', tipo: 'unidad', escalon, lng, lat })
const roja = (id, lng, lat, escalon = 'batallon') => ({ id, designacion: id.toUpperCase(), bando: 'enemigo', tipo: 'unidad', escalon, lng, lat })
const inst = { id: 'asdi', bando: 'propias', tipo: 'instalacion', instalacion: 'asdi', lng: -68.2, lat: -18.6 }
// Fases 🔵: I juntas con el CE (lejos), III en sus puestos (cerca del enemigo).
const fasesAzul = [
  { nombre: 'Concentración', tarea: 'Concentrar', unidades: [azul('div1', -68.4, -18.55), azul('div6', -68.41, -18.56), inst, roja('viejo', -69.5, -18.5)], ops: { tareas: [{ tarea: 'reunir' }] } },
  { nombre: 'Desplazamiento', unidades: [azul('div1', -68.6, -18.55), azul('div6', -68.5, -18.6)], ops: {} },
  { nombre: 'Ocupación', tarea: 'Ocupar las posiciones', proposito: 'para detener al enemigo', unidades: [azul('div1', -68.86, -18.5), azul('div6', -68.8, -18.7)], ops: { tareas: [{ tarea: 'bloquear' }] } },
]
// Fases 🔴 del CAE: 4 del más probable (se acercan) y 2 del más peligroso.
const rojas = (lng) => [azul('div1', -68.4, -18.55), roja('bia1', lng, -18.5), roja('bia2', lng, -18.55), roja('btq1', lng - 0.02, -18.52)]
const enemigo = [
  { coa: 'probable', n: 1, nombre: 'Ramificación', unidades: rojas(-69.9) },
  { coa: 'probable', n: 2, nombre: 'Apresto', unidades: rojas(-69.5) },
  { coa: 'probable', n: 3, nombre: 'Ataque', tarea: 'ATACAR y ROMPER la primera posición', unidades: rojas(-68.95) },
  { coa: 'probable', n: 4, nombre: 'Explotación', unidades: rojas(-68.7) },
  { coa: 'peligroso', n: 1, nombre: 'Ramificación', unidades: rojas(-69.8) },
  { coa: 'peligroso', n: 2, nombre: 'Ataque', unidades: rojas(-68.9) },
]
const ctx = { fasesCOA: { propio: fasesAzul, enemigo }, g3: { _caps: { activo: 1, guardados: { 2: { fases: [fasesAzul[2]] } } } } }

caso('las fases 🔵 de los dos CAP y las 🔴 de los dos CAE, con nombre', () => {
  const az = M.fasesAzules(ctx)
  assert.deepEqual(az.map((a) => a.nombre), ['CAP 1 · FASE I — Concentración', 'CAP 1 · FASE II — Desplazamiento', 'CAP 1 · FASE III — Ocupación', 'CAP 2 · FASE I — Ocupación'])
  const ro = M.fasesRojas(ctx.fasesCOA)
  assert.equal(ro[2].nombre, 'CAE más probable · FASE III — Ataque')
  assert.equal(ro[5].nombre, 'CAE más peligroso · FASE II — Ataque')
})
caso('enfrentar: las azules de la fase 🔵 (sin sus rojas) + las rojas de la fase 🔴 (sin sus azules), el calco de la propia', () => {
  const e = M.enfrentar(fasesAzul[0], enemigo[2])
  assert.deepEqual(e.unidades.map((u) => u.id), ['div1', 'div6', 'asdi', 'bia1', 'bia2', 'btq1'])
  assert.equal(e.unidades.find((u) => u.id === 'div1').lng, -68.4)
  assert.deepEqual(e.ops, fasesAzul[0].ops)
  // Las rojas que la Mesa puso a la vista con `contra` (deFaseEnemiga) no cuentan como de la fase 🔵.
  const conVista = { unidades: [...fasesAzul[2].unidades, { ...roja('x', -68.9, -18.5), deFaseEnemiga: 2 }] }
  assert.ok(!M.enfrentar(conVista, enemigo[0]).unidades.some((u) => u.id === 'x'))
})
caso('medir: contacto a menos de 15 km, el poder y el par más cercano', () => {
  const lejos = M.medir(fasesAzul[0], enemigo[0])
  assert.equal(lejos.enContacto, 0)
  const cerca = M.medir(fasesAzul[2], enemigo[2])
  assert.equal(cerca.rojas, 3)
  assert.equal(cerca.enContacto, 3)
  assert.deepEqual(cerca.par, ['DIV1', 'BIA1'])
  assert.ok(cerca.km < 10)
  assert.ok(cerca.puntaje > lejos.puntaje)
  assert.match(M.textoMedida(cerca), /^3 unidad\(es\) enemiga\(s\) a menos de 15 km; las más cercanas: DIV1 y BIA1 a \d+,\d km; relación/)
})
caso('cada fase 🔵 con su 🔴 alineadas por el final (o la de `contra`), y ⭐ la más crítica', () => {
  const e = M.encuentros(ctx, { cap: 1 })
  assert.deepEqual(e.filas.map((f) => f.roja.idx), [0, 1, 2])
  assert.equal(e.critico.azul.idx, 2)
  assert.deepEqual(e.coas, ['probable', 'peligroso'])
  // Contra el más peligroso (2 fases): alineadas por el final, la FASE III 🔵 con su última (la II), la I y la II con la I.
  assert.deepEqual(M.encuentros(ctx, { cap: 1, coa: 'peligroso' }).filas.map((f) => f.roja.idx), [4, 4, 5])
  // Sergio (25-10-2026): 5 fases 🔵 de la defensa contra 4 🔴 del ataque → «fase IV de azul contra fase III de rojo».
  const cinco = { ...ctx, fasesCOA: { ...ctx.fasesCOA, propio: [...fasesAzul, fasesAzul[2], fasesAzul[2]] } }
  const e5 = M.encuentros(cinco, { cap: 1 })
  assert.deepEqual(e5.filas.map((f) => `${f.azul.nombre.split(' — ')[0]} ↔ ${f.roja.nombre.split(' — ')[0]}`), [
    'CAP 1 · FASE I ↔ CAE más probable · FASE I',
    'CAP 1 · FASE II ↔ CAE más probable · FASE I',
    'CAP 1 · FASE III ↔ CAE más probable · FASE II',
    'CAP 1 · FASE IV ↔ CAE más probable · FASE III',
    'CAP 1 · FASE V ↔ CAE más probable · FASE IV',
  ])
  // `contra` del 🎬 C.A. por fases manda; y lo elegido en el panel, también.
  const c2 = { ...ctx, fasesCOA: { ...ctx.fasesCOA, propio: [{ ...fasesAzul[0], contra: 3 }, ...fasesAzul.slice(1)] } }
  assert.equal(M.encuentros(c2, { cap: 1 }).filas[0].roja.idx, 3)
  assert.equal(M.encuentros(ctx, { cap: 1, elegidas: { 0: 3 } }).filas[0].roja.idx, 3)
  // El CAP guardado se mide con sus fases.
  assert.equal(M.encuentros(ctx, { cap: 2 }).filas.length, 1)
})
caso('guardar en la hoja: `_evento`, sin tocar las casillas', () => {
  const v = M.conEvento({ 'MANIOBRA|FASE 1': 'lo del oficial', _cols: ['FASE 1', 'FASE 2', 'FASE 3'] }, { cap: 1, azul: 2, rojo: 2, coa: 'probable' })
  assert.equal(v['MANIOBRA|FASE 1'], 'lo del oficial')
  assert.deepEqual({ ...v._evento, t: 0 }, { cap: 1, azul: 2, rojo: 2, coa: 'probable', t: 0 })
  assert.equal(M.resolver(ctx, v._evento).nombre, 'CAP 1 · FASE III — Ocupación contra CAE más probable · FASE III — Ataque')
  assert.equal(M.resolver(ctx, { cap: 1, azul: 9, rojo: 2 }), null)
})
caso('anotar en la matriz: la columna de la fase, sólo lo vacío, sin emojis, con la marca', () => {
  const r = M.resolver(ctx, { cap: 1, azul: 2, rojo: 2 })
  const hoja = { colsDefecto: ['FASE I', 'FASE II', 'FASE III', 'FASE IV'] }
  const a = M.anotar({ 'INTELIGENCIA|FASE III': 'ya escrito' }, hoja, r)
  assert.equal(a.n, 1)
  assert.equal(a.col, 'FASE III')
  assert.equal(a.valor['INTELIGENCIA|FASE III'], 'ya escrito')
  assert.match(a.valor['MANIOBRA|FASE III'], /^EVENTO CRÍTICO: CAP 1 · FASE III — Ocupación contra CAE más probable · FASE III — Ataque\. Tarea: Ocupar las posiciones, para detener al enemigo\. 3 unidad/)
  assert.ok(a.valor['MANIOBRA|FASE III'].endsWith('[Mesa — verificar]'))
  assert.ok(!/\p{Extended_Pictographic}/u.test(a.valor['MANIOBRA|FASE III']))
  const b = M.anotar({}, hoja, M.resolver(ctx, { cap: 1, azul: 2, rojo: 2 }))
  assert.match(b.valor['INTELIGENCIA|FASE III'], /ATACAR y ROMPER la primera posición con BIA1, BIA2, BTQ1/)
  // El CAP guardado no tiene columnas en la matriz (son las del activo).
  assert.equal(M.anotar({}, hoja, M.resolver(ctx, { cap: 2, azul: 0, rojo: 2 })).n, 0)
})
caso('para el Juego de Guerra: el ejercicio entero con el evento guardado y `eventoCritico` armado', () => {
  const ej = { nombre: 'CE-I (FICT.)', unidades: fasesAzul[0].unidades, ops: { x: 1 }, cmoc: { restringido: [] }, ...ctx, g3: { ...ctx.g3, coa: { a: 1 } } }
  const d = M.paraElJuego(ej, { 'MANIOBRA|FASE I': 'x' }, { cap: 1, azul: 2, rojo: 2, coa: 'probable' })
  assert.equal(d.unidades, ej.unidades)
  assert.deepEqual(d.cmoc, ej.cmoc)
  assert.equal(d.g3.coa.a, 1)
  assert.equal(d.g3.sincro['MANIOBRA|FASE I'], 'x')
  assert.equal(d.g3.sincro._evento.rojo, 2)
  assert.equal(d.eventoCritico.nombre, 'EVENTO CRÍTICO — CAP 1 · FASE III — Ocupación contra CAE más probable · FASE III — Ataque')
  assert.deepEqual(d.eventoCritico.unidades.map((u) => `${u.id}:${u.lng}`), ['div1:-68.86', 'div6:-68.8', 'bia1:-68.95', 'bia2:-68.95', 'btq1:-68.97'])
  assert.deepEqual(d.eventoCritico.ops, fasesAzul[2].ops)
  assert.equal(M.paraElJuego(ej, {}, { cap: 1, azul: 7, rojo: 2 }), null)
  assert.match(M.nombreArchivo('CE-I «LAUCA» (FICT.)', Date.UTC(2026, 9, 25, 15, 4)), /^JUEGO_GUERRA_CE-I_LAUCA_FICT_evento_critico_20261025_\d{4}\.json$/)
})
console.log(fallos ? `${fallos} FALLO(S)` : 'OK')
process.exit(fallos ? 1 : 0)
