import { crearDelta, ABRIR_REINTENTOS } from '../guardado/v1/autoguardado.mjs'
const U = 'https://x.supabase.co/functions/v1/calco-ops'
const resp = (status, j) => new Response(JSON.stringify(j), { status, headers: { 'Content-Type': 'application/json' } })
const cuerpo = (accion) => ({ method: 'POST', body: JSON.stringify({ accion, token: 't', calco_id: 'abc' }) })
let pausas = []
// 1) 503 ocupado dos veces, después el ejercicio: la Mesa lo recibe sin enterarse
let n = 0
let d = crearDelta({ fetch0: async () => (++n <= 2 ? resp(503, { ok: false, codigo: 'ocupado', error: 'ocupado' }) : resp(200, { ok: true, calco: { id: 'abc', rev: 3, payload: { a: 1 } } })), pausa: async (ms) => { pausas.push(ms) } })
let r = await d.fetch(U, cuerpo('abrir_mio'))
let j = await r.json()
if (!(r.status === 200 && j.calco.rev === 3 && pausas.length === 2 && pausas.every((p) => p >= 4000 && p <= 10000) && d.estado().reintentosAbrir === 2)) throw new Error('1: ' + JSON.stringify({ st: r.status, pausas }))
await new Promise((z) => setTimeout(z, 10))
if (!(d.estado().abiertos.length === 1 && d.estado().abiertos[0].rev === 3)) throw new Error('1b: base no anotada')
// 2) ocupado para siempre: tras 3 reintentos devuelve el 503 tal cual (la Mesa muestra el mensaje)
pausas = []
d = crearDelta({ fetch0: async () => resp(503, { ok: false, codigo: 'ocupado', error: 'Ocupado.' }), pausa: async (ms) => { pausas.push(ms) } })
r = await d.fetch(U, cuerpo('mi_calco'))
if (!(r.status === 503 && pausas.length === ABRIR_REINTENTOS)) throw new Error('2: ' + r.status + ' ' + pausas.length)
// 3) 404 de verdad: no se reintenta
pausas = []
d = crearDelta({ fetch0: async () => resp(404, { ok: false, error: 'El ejercicio no existe' }), pausa: async (ms) => { pausas.push(ms) } })
r = await d.fetch(U, cuerpo('abrir_mio'))
if (!(r.status === 404 && pausas.length === 0)) throw new Error('3')
// 4) guardar no pasa por el reintento de abrir (sigue igual que antes)
pausas = []
d = crearDelta({ fetch0: async () => resp(503, { ok: false, error: 'x' }), pausa: async (ms) => { pausas.push(ms) } })
r = await d.fetch(U, { method: 'POST', body: JSON.stringify({ accion: 'guardar', token: 't', calco_id: 'abc', payload: { a: 1 } }) })
if (!(r.status === 503 && pausas.length === 0)) throw new Error('4')
console.log('abrir-reintento: 4 pruebas OK')
