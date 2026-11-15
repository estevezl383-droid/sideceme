import { leerJSON, RECORTE_LIMITE_MS, esRecorte } from './fiabilidad.mjs'
const URL = 'https://x.supabase.co/functions/v1/calcos-datos'
const REC = { method: 'POST', body: JSON.stringify({ accion: 'recortar', token: 't', pais: 'bolivia', capas: ['a'], aoi: {} }) }
const PER = { method: 'POST', body: JSON.stringify({ accion: 'permiso', token: 't' }) }
const resp = (status, j) => ({ ok: status >= 200 && status < 300, status, json: async () => j })
let n = 0
const fallan2 = async () => (++n <= 2 ? resp(503, { ok: false, error: 'Hay muchos compañeros…', codigo: 'ocupado' }) : resp(200, { ok: true, capas: { a: 1 } }))
const pausas = []; const pausa = (t) => { pausas.push(t); return Promise.resolve() }
// 1) recorte: dos «ocupado» y después datos → vuelve con datos, 2 pausas de 8–15 s
const r1 = await leerJSON(URL, REC, { fetcher: fallan2, pausa })
if (!(r1.ok && r1.capas.a === 1 && pausas.length === 2 && pausas.every((t) => t >= 8000 && t <= 15000))) throw new Error('1 falló ' + JSON.stringify({ r1, pausas }))
// 2) recorte: ocupado para siempre → tras 3 reintentos, error con el mensaje del servidor
n = -1000; let e2 = null; pausas.length = 0
try { await leerJSON(URL, REC, { fetcher: async () => resp(503, { ok: false, error: 'Hay muchos compañeros generando su área…', codigo: 'ocupado' }), pausa }) } catch (e) { e2 = e }
if (!(e2 && /muchos compañeros/.test(e2.message) && pausas.length === 3)) throw new Error('2 falló ' + (e2 && e2.message) + ' pausas ' + pausas.length)
// 3) permiso (no recorte) con 503: NO reintenta
pausas.length = 0; let e3 = null
try { await leerJSON(URL, PER, { fetcher: async () => resp(503, { ok: false, error: 'x', codigo: 'ocupado' }), pausa }) } catch (e) { e3 = e }
if (!(e3 && pausas.length === 0)) throw new Error('3 falló')
// 4) límites: el recorte tiene 5 min; lo demás 20 s (medido por el tiempo que tarda en cortar un fetch que no vuelve)
if (RECORTE_LIMITE_MS !== 300000) throw new Error('4 límite')
if (!esRecorte(URL, REC) || esRecorte(URL, PER) || esRecorte('https://x/otra', REC)) throw new Error('4 esRecorte')
const cuelga = (signal) => new Promise((_, rej) => { if (signal.aborted) return rej(new Error('abort')); signal.addEventListener('abort', () => rej(new Error('abort'))) })
let t = Date.now(), e5 = null
try { await leerJSON('https://x/censo.json', {}, { ms: 60, fetcher: (u, o) => cuelga(o.signal) }) } catch (e) { e5 = e }
if (!(e5 && /no respondieron a tiempo/.test(e5.message) && Date.now() - t < 1000)) throw new Error('5 timeout general')
// 6) un error que no es «ocupado» en el recorte: se informa, sin reintentar
pausas.length = 0; let e6 = null
try { await leerJSON(URL, REC, { fetcher: async () => resp(403, { ok: false, error: 'Tu curso todavía no está habilitado' }), pausa }) } catch (e) { e6 = e }
if (!(e6 && /no está habilitado/.test(e6.message) && pausas.length === 0)) throw new Error('6 falló')
// 7) la señal externa de cancelación sigue cortando
const ac = new AbortController(); let e7 = null; ac.abort()
try { await leerJSON(URL, { ...REC, signal: ac.signal }, { fetcher: (u, o) => cuelga(o.signal), pausa }) } catch (e) { e7 = e }
if (!e7) throw new Error('7 señal externa')
console.log('fiabilidad.mjs: 7 pruebas OK')
