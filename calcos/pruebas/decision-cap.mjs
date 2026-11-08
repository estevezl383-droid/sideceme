// 🎖️ La decisión del Comandante en la F4·P6-7 (calcos/evento-critico/v1/decision.mjs, 08-11-2026): después del Juego
// de Guerra el Comandante decide CAP 1 o CAP 2; la Mesa pasa a ese CAP, la matriz es la de ese CAP y el resto del
// planeamiento (Orden Preparatoria N° 3, OGO, Guía de Planificación Final) va con él.
//   node calcos/pruebas/decision-cap.mjs
import assert from 'node:assert/strict'
import * as D from '../evento-critico/v1/decision.mjs'
import * as M from '../evento-critico/v1/modelo.mjs'
import { cambiarCAP } from '../cap-propios/v1/proponer.mjs'
import { capAprobado } from '../orden-preparatoria/v1/prep.mjs'
import { decisionTexto, entregas } from '../estado-mayor/v8/campos/cmte.js'

let fallos = 0
const caso = async (n, f) => {
  try {
    await f()
    console.log('✓ ' + n)
  } catch (e) {
    fallos++
    console.error('✗ ' + n + '\n  ' + e.message)
  }
}

// Un ejercicio FICTICIO: CAP 1 (activo, 5 fases) y CAP 2 (guardado, 4 fases); la matriz llena con el CAP 1.
const fase = (nombre, tarea) => ({ nombre, tarea, unidades: [], ops: {} })
const fases1 = ['Concentración', 'Desplazamiento', 'Ocupación', 'Conducción de la defensa', 'Contraataque'].map((n) => fase(n, `Tarea ${n} (FICT.)`))
const fases2 = ['Retardo', 'Canalización', 'Fijación', 'Contraataque de la masa'].map((n) => fase(n, ''))
const MATRIZ1 = { _cols: ['FASE 1', 'FASE 2', 'FASE 3', 'FASE 4', 'FASE 5'], 'MANIOBRA|FASE 1': 'La DIV-9 (FICT.) ocupa…', 'INTELIGENCIA|FASE 2': 'Vigilar la AA-1 (FICT.)', _evento: { cap: 1, azul: 3, rojo: 2, coa: 'probable' } }
function ejercicio() {
  return {
    fasesCOA: { propio: fases1, enemigo: [] },
    g3: {
      coa: { 'Denominación del CAP': 'CAP 1 — Defensa de área en el Lauca [IA — verificar]' },
      concepto: { 'Forma de maniobra elegida y por qué': 'Defensa de área (FICT.)' },
      sincro: { ...MATRIZ1 },
      decision: { _marca: { 'CAP-1': 'RECOMENDADO AL COMANDANTE' } },
      _caps: { activo: 1, formas: { 1: 'area', 2: 'movil' }, guardados: { 2: { fases: fases2, coa: { 'Denominación del CAP': 'CAP 2 — Defensa móvil (FICT.)' }, concepto: { 'Forma de maniobra elegida y por qué': 'Defensa móvil (FICT.)' } } } },
    },
  }
}
// Lo que hace la Mesa al tocar «CAP 2» en ② (acción 'cambiar' y, sobre lo que dejó, la decisión): como el panel.
function decidir(ej, n) {
  const antes = M.capActivo(ej.g3)
  const nFases = M.fasesDeCAP(ej, n).length
  let { fasesCOA, g3 } = n !== antes ? cambiarCAP(ej, n) : ej
  g3 = D.conDecision(g3, n, { activoAntes: antes, nFases, t: 'T' })
  return { fasesCOA, g3 }
}

await caso('sin decisión la matriz está cerrada; con la decisión y ese CAP a la vista, abierta', () => {
  const ej = ejercicio()
  assert.deepEqual(D.estado(ej), { decidido: null, activo: 1, abierta: false, motivo: 'sin-decision' })
  assert.equal(D.matrizAbierta(ej), false)
  const d = decidir(ej, 1)
  assert.deepEqual(D.estado(d), { decidido: 1, activo: 1, abierta: true, motivo: null })
  assert.equal(D.matrizAbierta({ g3: null }), false)
  assert.equal(D.matrizAbierta(undefined), false)
})
await caso('decidir el CAP a la vista: la matriz queda como estaba, ahora del CAP 1', () => {
  const d = decidir(ejercicio(), 1)
  assert.deepEqual(d.g3._caps.decision, { cap: 1, t: 'T' })
  assert.equal(d.g3.sincro['MANIOBRA|FASE 1'], 'La DIV-9 (FICT.) ocupa…')
  assert.deepEqual(d.g3.sincro._cols, MATRIZ1._cols)
  assert.equal(d.g3.sincro._cap, 1)
  assert.ok(!d.g3.sincro._matrices)
  assert.equal(d.g3._caps.activo, 1)
})
await caso('decidir el OTRO CAP: la Mesa pasa a él, la matriz del CAP 1 queda guardada y la del 2 arranca con sus fases', () => {
  const d = decidir(ejercicio(), 2)
  assert.equal(d.g3._caps.activo, 2, 'la Mesa pasó al CAP 2')
  assert.equal(d.fasesCOA.propio.length, 4, 'sus fases 🔵 a la vista')
  assert.equal(d.g3.coa['Denominación del CAP'], 'CAP 2 — Defensa móvil (FICT.)', 'su F3·P6')
  assert.equal(d.g3._caps.guardados[1].fases.length, 5, 'el CAP 1 guardado tal cual')
  assert.deepEqual(d.g3._caps.decision, { cap: 2, t: 'T' })
  assert.equal(D.escritas(d.g3.sincro), 0, 'la matriz del CAP 2, vacía')
  assert.deepEqual(d.g3.sincro._cols, ['FASE 1', 'FASE 2', 'FASE 3', 'FASE 4'], 'con las columnas de sus 4 fases')
  assert.equal(d.g3.sincro._cap, 2)
  assert.deepEqual(d.g3.sincro._matrices[1]['MANIOBRA|FASE 1'], 'La DIV-9 (FICT.) ocupa…', 'la del CAP 1, guardada')
  assert.deepEqual(d.g3.sincro._matrices[1]._cols, MATRIZ1._cols)
  assert.deepEqual(d.g3.sincro._evento, MATRIZ1._evento, 'el evento crítico guardado sigue en la hoja')
  assert.ok(D.estado(d).abierta)
})
await caso('el Comandante cambia de idea: ↺ y CAP 1 de nuevo → vuelve su matriz; la del 2 queda guardada', () => {
  let d = decidir(ejercicio(), 2)
  d.g3 = { ...d.g3, sincro: { ...d.g3.sincro, 'MANIOBRA|FASE 1': 'Retardo desde la LDE-1 (FICT.)' } }
  d = { ...d, g3: D.sinDecision(d.g3) }
  assert.equal(D.estado(d).motivo, 'sin-decision')
  assert.equal(d.g3.sincro['MANIOBRA|FASE 1'], 'Retardo desde la LDE-1 (FICT.)', '↺ no toca la matriz')
  d = decidir(d, 1)
  assert.equal(d.g3._caps.activo, 1)
  assert.equal(d.g3.sincro['MANIOBRA|FASE 1'], 'La DIV-9 (FICT.) ocupa…', 'volvió la del CAP 1')
  assert.equal(d.g3.sincro['INTELIGENCIA|FASE 2'], 'Vigilar la AA-1 (FICT.)')
  assert.equal(d.g3.sincro._matrices[2]['MANIOBRA|FASE 1'], 'Retardo desde la LDE-1 (FICT.)', 'la del CAP 2, guardada')
  assert.ok(!d.g3.sincro._matrices[1])
})
await caso('la decisión sobrevive a los cambios de CAP del F3·P6 y del 🎬; con el otro a la vista la matriz se cierra', () => {
  const d = decidir(ejercicio(), 2)
  const r = cambiarCAP(d, 1)
  assert.deepEqual(r.g3._caps.decision, { cap: 2, t: 'T' })
  assert.deepEqual(D.estado(r), { decidido: 2, activo: 1, abierta: false, motivo: 'otro-cap' })
  const v = cambiarCAP(r, 2)
  assert.ok(D.estado(v).abierta, 'de vuelta en el CAP 2')
})
await caso('capAprobado: manda la decisión (sobre la recomendación de la F5·P1), aunque el otro CAP esté a la vista', () => {
  const ej = ejercicio()
  assert.equal(capAprobado(ej.g3, ej.fasesCOA).n, 1, 'sin decisión: el recomendado')
  assert.equal(capAprobado(ej.g3, ej.fasesCOA).recomendado, true)
  assert.equal(capAprobado(ej.g3, ej.fasesCOA).decidido, false)
  const d = decidir(ejercicio(), 2)
  const C = capAprobado(d.g3, d.fasesCOA)
  assert.deepEqual([C.n, C.decidido, C.recomendado, C.fases.length], [2, true, false, 4])
  // El oficial vuelve a mirar el CAP 1: la Orden igual va con el CAP 2 (el guardado).
  const r = cambiarCAP(d, 1)
  const C2 = capAprobado(r.g3, r.fasesCOA)
  assert.deepEqual([C2.n, C2.fases.length, C2.coa['Denominación del CAP']], [2, 4, 'CAP 2 — Defensa móvil (FICT.)'])
  // Sin _caps ni marcas, como antes: el activo.
  assert.deepEqual([capAprobado({}, {}).n, capAprobado({}, {}).recomendado, capAprobado({}, {}).decidido], [1, false, false])
})
await caso('Guía de Planificación Final: «I.- DECISIÓN» con el CAP decidido si la F6·P1 está vacía', () => {
  const d = decidir(ejercicio(), 2)
  const t = decisionTexto({ calco: { g3: d.g3, fasesCOA: d.fasesCOA }, hojas: {} })
  assert.match(t, /mi decisión es que el Curso de Acción Propio N° 2 «Defensa móvil \(FICT\.\)» es el más adecuado/)
  assert.doesNotMatch(t, /recomendó/, 'el CAP 2 no fue el recomendado')
  // La F6·P1 del Comandante, si está llena, manda.
  assert.match(decisionTexto({ calco: { g3: d.g3 }, hojas: { decisionCmte: { 'Curso de acción aprobado': 'CAP-1' } } }), /N° 1/)
  const e = entregas({ calco: { g3: d.g3, fasesCOA: d.fasesCOA }, hojas: {} })
  const items = e.flatMap((x) => x.items)
  assert.ok(items.some(([k, x]) => /F4·P6-7 CAP decidido/.test(k) && /CAP 2 «Defensa móvil/.test(x)), JSON.stringify(items.map((i) => i[0])))
})
await caso('las hojas que siguen a la F4·P6-7 dicen el CAP decidido (o que falta); las de antes, nada', () => {
  const CAT = [{ id: 3, hojas: [{ id: 'coa' }] }, { id: 4, hojas: [{ id: 'eventos' }, { id: 'sincro' }, { id: 'psd' }] }, { id: 5, hojas: [{ id: 'decision' }] }, { id: 7, hojas: [{ id: 'opord' }] }]
  const ej = ejercicio()
  assert.equal(D.avisoHoja('coa', ej.g3, CAT), null)
  assert.equal(D.avisoHoja('eventos', ej.g3, CAT), null)
  assert.equal(D.avisoHoja('sincro', ej.g3, CAT), null)
  assert.equal(D.avisoHoja('psd', ej.g3, CAT).texto, '⚠️ Falta la decisión del Comandante: CAP 1 o CAP 2 (F4·P6-7).')
  const d = decidir(ejercicio(), 2)
  assert.equal(D.avisoHoja('opord', d.g3, CAT).texto, '🎖️ CAP 2 · Defensa móvil (FICT.) — decidido por el Comandante.')
  assert.equal(D.avisoHoja('decision', cambiarCAP(d, 1).g3, CAT).texto, '⚠️ A la vista está el CAP 1, pero el Comandante decidió el CAP 2 (F4·P6-7).')
  assert.equal(D.avisoHoja('opord', d.g3, null), null)
})
await caso('la F4·P6-7 resaltada en la lista de documentos', () => {
  assert.equal(D.filaDocumento('coa', {}), null)
  assert.equal(D.filaDocumento('sincro', {}).chapa, '🎖️ DECISIÓN')
  assert.equal(D.filaDocumento('sincro', decidir(ejercicio(), 2).g3).chapa, '🎖️ CAP 2')
  assert.match(D.filaDocumento('sincro', {}).estilo.border, /#ffd479/)
})
await caso('el nombre del CAP: su denominación sin «CAP n —» ni marcas; si no, su forma', () => {
  const ej = ejercicio()
  assert.equal(D.nombreCAP(ej.g3, 1), 'Defensa de área en el Lauca')
  assert.equal(D.nombreCAP(ej.g3, 2), 'Defensa móvil (FICT.)')
  assert.equal(D.nombreCAP({ _caps: { formas: { 1: 'area', 2: 'movil' } } }, 2), 'Defensa móvil')
  assert.equal(D.nombreCAP({}, 1), '')
})
await caso('🤖 el pedido de la matriz lleva la decisión y las fases del CAP decidido (antes de «CÓMO CONTESTAR»)', async () => {
  const d = decidir(ejercicio(), 2)
  const ctx = { g3: d.g3, fasesCOA: d.fasesCOA }
  const r = { ok: true, prompt: '# LA HOJA\n\nalgo\n\n---\n\n# CÓMO CONTESTAR\n\n```json' }
  const p = D.pedidoDecision(r, { id: 'sincro' }, ctx)
  assert.ok(p.prompt.indexOf('# DECISIÓN DEL COMANDANTE') < p.prompt.indexOf('# CÓMO CONTESTAR'))
  assert.match(p.prompt, /El Comandante decidió el CAP 2 «Defensa móvil \(FICT\.\)»/)
  assert.match(p.prompt, /- «FASE 1» = FASE I — Retardo/)
  assert.match(p.prompt, /- «FASE 4» = FASE IV — Contraataque de la masa/)
  assert.equal(D.pedidoDecision(r, { id: 'psd' }, ctx), r, 'otra hoja: igual')
  assert.equal(D.pedidoDecision(r, { id: 'sincro' }, ejercicio()), r, 'sin decisión: igual')
  assert.equal(D.pedidoDecision({ ok: false, error: 'x' }, { id: 'sincro' }, ctx).error, 'x')
  const prom = await D.pedidoDecision(Promise.resolve(r), { id: 'sincro' }, ctx)
  assert.match(prom.prompt, /DECISIÓN DEL COMANDANTE/)
  // El evento crítico jugado del CAP decidido.
  const g3e = { ...d.g3, sincro: { ...d.g3.sincro, _evento: { cap: 2, azul: 2, rojo: 1, coa: 'peligroso' } } }
  assert.match(D.bloqueIA({ g3: g3e, fasesCOA: d.fasesCOA }), /Evento crítico jugado: la FASE III del CAP 2 contra el CAE más peligroso/)
})
await caso('la medida en una línea para el panel', () => {
  assert.equal(M.textoCorto({ azules: 3, rojas: 4, enContacto: 0, km: 23.9, relacion: null, par: ['A', 'B'] }), 'sin contacto · la más cerca a 23,9 km')
  assert.equal(M.textoCorto({ azules: 3, rojas: 16, enContacto: 16, km: 1.3, relacion: 0.2, par: ['A', 'B'] }), '🔴 16 a menos de 15 km · la más cerca a 1,3 km · relación 0,2 : 1')
  assert.equal(M.textoCorto({ azules: 3, rojas: 0 }), 'sin fichas rojas en esa fase')
})

console.log(fallos ? `${fallos} FALLO(S)` : 'OK')
process.exit(fallos ? 1 : 0)
