import assert from 'node:assert/strict'
import { conLimite, leerJSON } from '../pedido/v1/fiabilidad.mjs'

assert.equal(await conLimite(() => 'texto'), 'texto')
await assert.rejects(conLimite(() => { throw Error('dato inválido') }), /dato inválido/)
await assert.rejects(conLimite(() => new Promise(() => {}), { ms: 15 }), /tardó demasiado/)
let senal
await assert.rejects(leerJSON('/capa', {}, { ms: 15, fetcher: (_u, o) => { senal = o.signal; return new Promise(() => {}) } }), /no respondieron a tiempo/)
assert.equal(senal.aborted, true, 'se aborta la solicitud que no contesta')
await assert.rejects(leerJSON('/capa', {}, { ms: 15, fetcher: async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) }) }), /no respondieron a tiempo/, 'el límite también cubre el cuerpo de la respuesta')
await assert.rejects(leerJSON('/capa', {}, { fetcher: async () => ({ ok: false, status: 403, json: async () => ({ error: 'Sesión vencida' }) }) }), /Sesión vencida/)
await assert.rejects(leerJSON('/capa', {}, { fetcher: async () => ({ ok: true, status: 200, json: async () => { throw Error('HTML inesperado') } }) }), /datos no válidos/)
assert.deepEqual(await leerJSON('/capa', {}, { fetcher: async () => ({ ok: true, status: 200, json: async () => ({ capas: { prueba: [] } }) }) }), { capas: { prueba: [] } })
const resultados = await Promise.all(Array.from({ length: 5 }, (_, n) => conLimite(async () => `alumno ${n}`)))
assert.equal(new Set(resultados).size, 5)
console.log('OK: límites de preparación y lectura JSON, cancelación de red, errores de sesión y cinco tareas independientes.')
