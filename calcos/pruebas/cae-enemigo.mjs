// 🔴 El CAE del G-2 escrito desde el lado del enemigo y sin unidades inventadas (calcos/cae-enemigo/v1). El caso
// de Sergio (24-10-2026, CE-I en el AO LAUCA contra la 1ª Br. Ac. «CORACEROS»): la IA puso en el CAE la misión y
// el estado final PROPIOS e inventó la «VI División de Ejército», que pasó a la F3·P4 y al P.D. 6 de la F4·P4.
//   node cae-enemigo.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as R from '../cae-enemigo/v1/revisar.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto, HOJA } = require('./concepto-ejemplo.js')
const { FILAS_PD } = require('./puntos-decision-ejemplo.js')

let n = 0
const caso = async (nombre, fn) => { await fn(); n++; console.log('  ✔ ' + nombre) }

const EJ = ejercicioConcepto()
const CTX = { unidades: EJ.unidades, ordenSup: EJ.ordenSup, unidad: EJ.ordenSup.unidad }

// Lo que la IA escribió en el CAE de Sergio (las dos casillas con el error, como las copió el handoff).
const CAE_MAL = {
  Misión: 'El CE-I (DIV MEC-2, DIV-1, DIV-6, GALM-1, RAM-4) defiende el AO LAUCA a partir del D (0400) sobre la LF «PUMA» para impedir la penetración enemiga hacia Turco y Huachacalla. [IA — verificar]',
  'Estado final deseado': HOJA['Estado final deseado'],
}
// La misma hoja bien escrita: desde el enemigo.
const CAE_BIEN = {
  Misión: 'La 1ª Br. Ac. «CORACEROS» ataca a partir del D (0400) por el valle del río Lauca (AA-1) para penetrar la defensa del CE-I en el paso Ungallire–Guata y llegar a Turco y Huachacalla.',
  'Intención del Comandante': 'Romper la LPR del CE-I en Ungallire con la masa blindada antes de que la DIV-6 pueda contraatacar.',
  'Estado final deseado': 'La 1ª Brigada Acorazada «CORACEROS» en posesión de Turco, con la defensa del CE-I desarticulada y su reserva (DIV-6) fijada al este de Macaya.',
}

await caso('las fuerzas del ejercicio: la propia, las rojas y el enemigo principal (la brigada)', () => {
  const F = R.fuerzas(CTX)
  assert.equal(F.propia, 'CE-I')
  assert.ok(F.propias.includes('DIV MEC-2'))
  assert.equal(F.enemigo, '1ª BR. AC. «CORACEROS»')
  assert.equal(F.escEnemigo, 'brigada')
  assert.deepEqual([...F.conocidas.rojas], ['br1'])
  for (const k of ['ce1', 'div2', 'div1', 'div6']) assert.ok(F.conocidas.propias.has(k), k)
})

await caso('las grandes unidades que nombra un texto, con sus formas', () => {
  const c = (t) => R.formaciones(t).map((g) => g.clave)
  assert.deepEqual(c('la VI División de Ejército de SATURNO (1ª Brigada Acorazada «CORACEROS»)'), ['div6', 'br1'])
  assert.deepEqual(c('1RA. BRIG. AC. y la DE-VI'), ['br1', 'div6'])
  assert.deepEqual(c('El CE-I (DIV MEC-2, DIV-1, DIV-6) y el CE-II'), ['ce1', 'div2', 'div1', 'div6', 'ce2'])
  assert.deepEqual(c('División Mecanizada 2 (DIV MEC-2) y División 1'), ['div2', 'div2', 'div1'])
  assert.deepEqual(c('las divisiones del Cuerpo de Ejército, a partir del D-3, PC-3, CIE-297, BAT AA-2'), [])
})

await caso('el CAE de Sergio: la Misión propia, el estado final propio y la «VI División» inventada', () => {
  const av = R.revisarCAE(CAE_MAL, CTX)
  const tipos = av.map((a) => `${a.campo}:${a.tipo}`)
  assert.ok(tipos.includes('Misión:propia'), tipos.join(' · '))
  assert.ok(tipos.includes('Estado final deseado:final'), tipos.join(' · '))
  const inv = av.filter((a) => a.tipo === 'inventada')
  assert.equal(inv.length, 1)
  assert.match(inv[0].txt, /VI División de Ejército/)
  const t = R.textoAvisos(av, CTX)
  assert.match(t, /^• «Misión» es la misión PROPIA \(«El CE-I/)
  assert.match(t, /qué hace 1ª BR\. AC\. «CORACEROS» \(una brigada\)/)
  assert.equal(t.split('\n').length, 3, 'un renglón por problema')
  assert.match(t, /VI División de Ejército/)
})

await caso('un CAE bien escrito (desde la 1ª Br. Ac.) no da ningún aviso', () => {
  assert.deepEqual(R.revisarCAE(CAE_BIEN, CTX), [])
  assert.equal(R.avisoG2({ cae: CAE_BIEN }, CTX), '')
  // «El enemigo ataca para destruir al CE-I»: el CE-I no es el sujeto.
  assert.deepEqual(R.revisarCAE({ Misión: 'El enemigo ataca el D para destruir al CE-I en la LF «PUMA».' }, CTX), [])
  assert.deepEqual(R.revisarCAE({}, CTX), [])
  assert.deepEqual(R.revisarCAE(null, CTX), [])
})

await caso('las hojas del G-3 que copiaron la «VI División»: la F3·P4 y el P.D. 6 de la F4·P4', () => {
  const c = R.unidadesInventadas(HOJA, CTX)
  assert.equal(c.length, 1)
  assert.match(c[0].unidad, /VI División de Ejército/)
  assert.equal(c[0].campo, 'Estado final deseado')
  const e = R.unidadesInventadas(FILAS_PD, CTX)
  assert.equal(e.length, 1)
  assert.match(e[0].unidad, /VI División de Ejército/)
  assert.equal(e[0].campo, 'P.D. 6')
  assert.equal(R.avisoHoja({ id: 'eventos' }, FILAS_PD, CTX), '⚠️ Revisar esta hoja:\n• «VI División de Ejército» (en «P.D. 6») no está en las fichas ni en la Orden superior: el enemigo es 1ª BR. AC. «CORACEROS» (una brigada).')
  // Un adyacente sin ficha («el enlace con la DIV MEC-1») no es del enemigo: no se avisa.
  assert.deepEqual(R.unidadesInventadas({ x: 'PC-5 con la DIV MEC-1; PC-3 y PC-4 con el CE-II.' }, CTX), [])
  // La DIV-6 propia junto al enemigo, o aclarada entre paréntesis, no es una unidad inventada.
  assert.deepEqual(R.unidadesInventadas({ x: 'La DIV-6 contraataca a la 1ª Br. Ac. «CORACEROS» desde Turco.', y: 'La División 6 (DIV-6) bloquea a la brigada enemiga.' }, CTX), [])
  // Corregido («1ª Br. Ac. «CORACEROS»»), ya no avisa.
  const corregidas = FILAS_PD.map((f) => ({ ...f, 'Evento crítico': String(f['Evento crítico']).replace('la VI División de Ejército enemiga', 'la 1ª Br. Ac. «CORACEROS»') }))
  assert.deepEqual(R.unidadesInventadas(corregidas, CTX), [])
})

await caso('🔎 Lo que entregó el G-2: el aviso si el CAE tiene la misión propia', () => {
  const a = R.avisoG2({ cae: CAE_MAL }, CTX)
  assert.match(a, /^⚠️ Este CAE tiene errores .*\n• «Misión» es la misión PROPIA/)
  assert.match(a, /no lo copies a esta hoja/)
})

await caso('✓ Aplicar en el CAE: el mensaje suma el aviso; en otra hoja del G-2, nada', () => {
  assert.match(R.avisoAplicar({ id: 'cae' }, CAE_MAL, CTX), /^ ⚠️ OJO, el CAE tiene errores: • «Misión» es la misión PROPIA.*Corregilos antes de seguir\.$/)
  assert.equal(R.avisoAplicar({ id: 'cae' }, CAE_BIEN, CTX), '')
  assert.equal(R.avisoHoja({ id: 'cae' }, CAE_BIEN, CTX), '')
})

const PEDIDO = { ok: true, prompt: 'Encabezado\n\n---\n\n# LA HOJA\n\nCAE\n\n---\n\n# CÓMO CONTESTAR\n\n```json\n{}\n```', forma: 'objeto' }

await caso('el pedido del CAE dice quién es quién, antes de «CÓMO CONTESTAR»', () => {
  const r = R.pedidoCAE(PEDIDO, { id: 'cae' }, CTX)
  const i = r.prompt.indexOf('# QUIÉN ES QUIÉN EN ESTA HOJA')
  assert.ok(i > 0 && i < r.prompt.indexOf('# CÓMO CONTESTAR'))
  assert.match(r.prompt, /el ENEMIGO: 1ª BR\. AC\. «CORACEROS» \(es una BRIGADA\)/)
  assert.match(r.prompt, /NOSOTROS somos CE-I \(DIV MEC-2/)
  assert.match(r.prompt, /NO inventes unidades/)
  assert.equal(r.forma, 'objeto')
  // Otras hojas del G-2, y los pedidos con error, salen como venían.
  assert.equal(R.pedidoCAE(PEDIDO, { id: 'ht20' }, CTX), PEDIDO)
  const err = { ok: false, error: 'x' }
  assert.equal(R.pedidoCAE(err, { id: 'cae' }, CTX), err)
})

await caso('el pedido de las hojas del G-3: la regla de no inventar y, si el CAE está mal, que no lo copie', async () => {
  const bien = R.pedidoG3(PEDIDO, { ...CTX, picb: { cae: CAE_BIEN } })
  assert.match(bien.prompt, /# EL ENEMIGO ES EL DEL EJERCICIO/)
  assert.match(bien.prompt, /NO inventes unidades/)
  assert.ok(!/El CAE del G-2 tiene errores/.test(bien.prompt))
  const mal = R.pedidoG3(PEDIDO, { ...CTX, picb: { cae: CAE_MAL } })
  assert.match(mal.prompt, /⚠️ El CAE del G-2 tiene errores:\n  • «Misión» es la misión PROPIA[\s\S]*NO copies esas frases/)
  assert.ok(mal.prompt.indexOf('# EL ENEMIGO') < mal.prompt.indexOf('# CÓMO CONTESTAR'))
  // Sin «CÓMO CONTESTAR» (otro armado del pedido): al final. Y si llega una promesa, también.
  assert.match(R.pedidoG3({ ok: true, prompt: 'X' }, CTX).prompt, /^X\n\n---\n\n# EL ENEMIGO/)
  const p = await R.pedidoG3(Promise.resolve(PEDIDO), CTX)
  assert.match(p.prompt, /# EL ENEMIGO/)
})

await caso('la caja de la IA: «despues» retoca el pedido sólo si la hoja lo pasa', async () => {
  assert.equal(R.despues(PEDIDO, null), PEDIDO)
  const r = await R.despues(Promise.resolve(PEDIDO), (x) => R.pedidoG3(x, CTX))
  assert.match(r.prompt, /# EL ENEMIGO ES EL DEL EJERCICIO/)
  assert.equal(await R.despues(PEDIDO, () => { throw new Error('x') }), PEDIDO)
})

await caso('nunca rompe: sin fichas ni Orden', () => {
  assert.deepEqual(R.revisarCAE(CAE_MAL, {}), R.revisarCAE(CAE_MAL, {}))
  assert.equal(typeof R.avisoG2({ cae: CAE_MAL }, {}), 'string')
  assert.match(R.pedidoG3(PEDIDO, {}).prompt, /la unidad de las fichas rojas/)
  assert.deepEqual(R.unidadesInventadas(undefined, {}), [])
})

console.log(`cae-enemigo: ${n} casos ✔`)
