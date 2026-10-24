// 🧩 Leer el JSON que contesta una IA aunque venga con los errores de siempre (calcos/cap-propios/v1/json-tolerante.mjs).
// El caso de Sergio: pegó la respuesta de la IA en «🤖 La IA desarrolla los dos CAP EN LA CARTA» y la Mesa le dijo «No se
// reconoció la respuesta». Acá, cada error típico de las IA y la respuesta de ejemplo con esos errores, colocada igual.
//   node json-tolerante.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { leerJSON, reparar, cerrar } from '../cap-propios/v1/json-tolerante.mjs'
import * as C from '../cap-propios/v1/carta-ia.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto } = require('./concepto-ejemplo.js')
const X = require('./cap-carta-ejemplo.js')

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }
const lee = (t) => {
  const r = leerJSON(t)
  assert.ok(r.ok, `${r.error}\n${t}`)
  return r
}

caso('el JSON bien escrito, con o sin bloque ```json y con texto alrededor', () => {
  assert.deepEqual(lee('{"a":1}').valor, { a: 1 })
  assert.deepEqual(lee('Acá va:\n```json\n{"a":1}\n```\n¿Querés que siga?').valor, { a: 1 })
  assert.deepEqual(lee('Con {llaves} en el texto antes.\n```JSON\n{"a":[1,2]}\n```').valor, { a: [1, 2] })
  assert.equal(lee('{"a":1}').reparado, false)
})

caso('comillas rectas DENTRO de un texto (la designación copiada tal cual)', () => {
  const r = lee('{"unidad": "GAAP N° 4 "MIRAFLORES"", "lugar": "LF "PUMA" norte"}')
  assert.deepEqual(r.valor, { unidad: 'GAAP N° 4 "MIRAFLORES"', lugar: 'LF "PUMA" norte' })
  assert.equal(r.reparado, true)
})

caso('comas de más, comentarios, saltos de línea y tabulaciones dentro de un texto, espacios duros', () => {
  assert.deepEqual(lee('{"a":[1,2,],"b":{"c":3,},}').valor, { a: [1, 2], b: { c: 3 } })
  assert.deepEqual(lee('{\n // la fase 1\n "a": 1, /* otra */ "b": 2\n}').valor, { a: 1, b: 2 })
  assert.deepEqual(lee('{"t": "renglón uno\nrenglón dos\tcon tab"}').valor, { t: 'renglón uno\nrenglón dos\tcon tab' })
  assert.deepEqual(lee('{"a": 1}').valor, { a: 1 })
  assert.deepEqual(lee('{"url": "http://x.y/z"}').valor, { url: 'http://x.y/z' }, 'las // dentro de un texto no son comentarios')
})

caso('comillas tipográficas como delimitadores', () => {
  assert.deepEqual(lee('{“a”: “uno”}').valor, { a: 'uno' })
})

caso('la respuesta CORTADA: se cierra lo que quedó abierto', () => {
  const r = lee('```json\n{"caps":[{"cap":1,"fases":[{"fase":1,"nombre":"Concentración"},{"fase":2,"nombre":"Despl')
  assert.equal(r.cortado, true)
  assert.equal(r.valor.caps[0].fases.length, 2)
  assert.equal(r.valor.caps[0].fases[1].nombre, 'Despl')
  assert.deepEqual(lee('{"a":[1,2,').valor, { a: [1, 2] })
  assert.deepEqual(lee('{"a":1,"b":').valor, { a: 1 })
  assert.equal(cerrar('{"a":[{"b":"x'), '{"a":[{"b":"x"}]}')
})

caso('lo que no se puede leer dice por qué', () => {
  assert.match(leerJSON('').error, /vacía/)
  assert.match(leerJSON('No puedo hacer eso.').error, /No se encontró un JSON/)
  assert.equal(reparar('{"a":1}'), '{"a":1}')
})

caso('la respuesta de ejemplo con TODOS esos errores se coloca igual (los dos CAP, cinco fases cada uno)', () => {
  const EJ = ejercicioConcepto()
  const CTX = { unidades: EJ.unidades, ops: EJ.ops, cmoc: EJ.cmoc, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO, efectos: X.EFECTOS }
  const roto = X.RESPUESTA_TEXTO
    .replace('"unidad": "GALM-1"', '"unidad": "GALM-1 "lanzacohetes""')
    .replace(/\]\n(\s*)\}/, '],\n$1}')
    .replace('"forma": "movil",', '"forma": "movil", // la móvil')
  assert.throws(() => JSON.parse(roto.slice(roto.indexOf('{'), roto.lastIndexOf('}') + 1)))
  const r = C.leerRespuesta(roto, CTX)
  assert.ok(r.ok, r.error)
  assert.equal(r.resumen, 'CAP 1: 5 fases · CAP 2: 5 fases')
  assert.equal(r.reparado, true)
})

caso('los dos CAP en dos bloques ```json separados, o como «CAP 1» / «CAP 2»', () => {
  const EJ = ejercicioConcepto()
  const CTX = { unidades: EJ.unidades, ops: EJ.ops, cmoc: EJ.cmoc, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS }
  const [c1, c2] = X.RESPUESTA_CAP.caps
  const dos = `CAP 1:\n\`\`\`json\n${JSON.stringify(c1)}\n\`\`\`\nCAP 2:\n\`\`\`json\n${JSON.stringify(c2)}\n\`\`\``
  assert.equal(C.leerRespuesta(dos, CTX).resumen, 'CAP 1: 5 fases · CAP 2: 5 fases')
  const nombrados = JSON.stringify({ 'CAP 1': c1, 'CAP 2': c2 })
  assert.equal(C.leerRespuesta(nombrados, CTX).resumen, 'CAP 1: 5 fases · CAP 2: 5 fases')
})

caso('cortada a mitad del CAP 2: se coloca hasta donde llegó y se avisa', () => {
  const EJ = ejercicioConcepto()
  const CTX = { unidades: EJ.unidades, ops: EJ.ops, cmoc: EJ.cmoc, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS }
  const t = X.RESPUESTA_TEXTO
  const corte = t.slice(0, t.indexOf('Retardo y canalización'))
  const r = C.leerRespuesta(corte, CTX)
  assert.ok(r.ok, r.error)
  assert.equal(r.caps[1].fases.length, 5)
  assert.equal(r.caps[2].fases.length, 4, 'la fase 4 del CAP 2 llegó a medias')
  assert.match(r.faltan[0], /venía CORTADA/)
})

console.log(`json-tolerante: ${n} casos ✔`)
