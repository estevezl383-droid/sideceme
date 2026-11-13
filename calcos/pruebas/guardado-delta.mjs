// 📦 Guardar sólo lo que cambió (calcos/guardado/v1/autoguardado.mjs, 13-11-2026), con un
// servidor simulado que hace lo mismo que calco-ops v12 + calco_guardar_delta:
//   node calcos/pruebas/guardado-delta.mjs
import assert from 'node:assert/strict'
import { crearDelta, crearGuardador, igualJSON, instalarDelta, minEntreAlAzar, MIN_ENTRE } from '../guardado/v1/autoguardado.mjs'

const casos = []
const caso = (n, f) => casos.push([n, f])
const URL_OPS = 'https://x.supabase.co/functions/v1/calco-ops'
const resp = (status, j) => new Response(JSON.stringify(j), { status, headers: { 'Content-Type': 'application/json' } })
// jsonb reordena las claves: se simula devolviéndolas al revés
const reordenar = (v) => Array.isArray(v) ? v.map(reordenar) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).reverse().map((k) => [k, reordenar(v[k])])) : v

function servidor({ viejo = false } = {}) {
  const filas = new Map()
  const pedidos = []
  let caido = 0
  const f = async (u, o) => {
    const b = JSON.parse(o.body)
    pedidos.push({ accion: b.accion, bytes: o.body.length, delta: !!b.delta, claves: b.delta ? Object.keys(b.delta.cambios) : null })
    if (caido) { caido--; return new Response('<html>Error code 520</html>', { status: 520 }) }
    if (b.accion === 'mi_calco' || b.accion === 'abrir_mio') {
      const c = filas.get(b.calco_id || 'A')
      const calco = { id: c.id, nombre: c.nombre, payload: reordenar(c.payload) }
      if (!viejo) calco.rev = c.rev
      return resp(200, { ok: true, calco })
    }
    if (b.accion === 'guardar') {
      if (b.delta && viejo) return resp(404, { ok: false, error: 'El trabajo no existe' }) // calco_id null
      if (b.delta) {
        const c = filas.get(b.delta.calco_id)
        if (c.rev !== b.delta.base_rev) return resp(409, { ok: false, conflicto: true, rev: c.rev })
        for (const k of b.delta.quitar) delete c.payload[k]
        Object.assign(c.payload, JSON.parse(JSON.stringify(b.delta.cambios)))
        c.rev++
        return resp(200, { ok: true, rev: c.rev, delta: true })
      }
      const c = filas.get(b.calco_id)
      c.payload = b.payload ?? {}
      c.rev++
      return resp(200, viejo ? { ok: true, entregado: false } : { ok: true, entregado: false, rev: c.rev })
    }
    if (b.accion === 'entregar') { const c = filas.get(b.calco_id); c.payload = b.payload; c.rev++; return resp(200, { ok: true, entregado: true, rev: c.rev }) }
    return resp(200, { ok: true })
  }
  return { f, filas, pedidos, caer: (n) => (caido = n) }
}

const pesado = () => ({ type: 'FeatureCollection', features: Array.from({ length: 4000 }, (_, i) => ({ type: 'Feature', properties: { n: i, nombre: 'camino ' + i }, geometry: { type: 'LineString', coordinates: [[-63.1 - i / 1e4, -17.8], [-63.2, -17.9 + i / 1e4]] } })) })
const ejercicio = () => ({ version: 1, nombre: 'EXAMEN', guardadoEn: '', resultados: { caminos: { fc: pesado() } }, unidades: [{ id: 'u1', lng: -63, lat: -17 }], ops: { limites: [] }, g3: { h1: 'x' } })
const pedir = (d, accion, extra) => d.fetch(URL_OPS, { method: 'POST', headers: {}, body: JSON.stringify({ accion, token: 't', ...extra }) }).then((r) => r.json())

async function abierto(op) {
  const s = servidor(op)
  s.filas.set('A', { id: 'A', nombre: 'EXAMEN', rev: 7, payload: ejercicio() })
  const d = crearDelta({ fetch0: s.f })
  const r = await pedir(d, 'mi_calco')
  assert.equal(r.ok, true)
  return { s, d, datos: JSON.parse(JSON.stringify(ejercicio())) }
}

caso('igualJSON: el orden de las claves no cuenta, el de las listas sí', () => {
  assert.ok(igualJSON({ a: 1, b: [1, { c: 2, d: null }] }, { b: [1, { d: null, c: 2 }], a: 1 }))
  assert.ok(!igualJSON({ a: [1, 2] }, { a: [2, 1] }))
  assert.ok(!igualJSON({ a: 1 }, { a: 1, b: undefined, c: 0 }))
  assert.ok(!igualJSON({ a: null }, { a: {} }))
  assert.ok(!igualJSON([], {}))
})

caso('recién abierto, el primer guardado NO sube los calcos del terreno', async () => {
  const { s, d, datos } = await abierto()
  datos.guardadoEn = '2026-11-13T12:00:00Z'
  const r = await pedir(d, 'guardar', { calco_id: 'A', nombre: 'EXAMEN', pais: 'bolivia', payload: datos })
  assert.equal(r.ok, true)
  const p = s.pedidos.at(-1)
  assert.equal(p.delta, true)
  assert.deepEqual(p.claves, ['guardadoEn'])
  assert.ok(p.bytes < 400, 'pesa ' + p.bytes)
  assert.deepEqual(s.filas.get('A').payload, datos)
  assert.equal(s.filas.get('A').rev, 8)
})

caso('mover una ficha manda sólo las fichas; borrar una clave la quita; el servidor queda igual a la Mesa', async () => {
  const { s, d, datos } = await abierto()
  await pedir(d, 'guardar', { calco_id: 'A', nombre: 'EXAMEN', payload: datos })
  datos.unidades[0].lng = -64
  await pedir(d, 'guardar', { calco_id: 'A', nombre: 'EXAMEN', payload: datos })
  assert.deepEqual(s.pedidos.at(-1).claves, ['unidades'])
  delete datos.g3
  datos.picb = { ht17: 'CAE-1' }
  await pedir(d, 'guardar', { calco_id: 'A', nombre: 'EXAMEN', payload: datos })
  assert.deepEqual(s.pedidos.at(-1).claves, ['picb'])
  assert.deepEqual(s.filas.get('A').payload, datos)
  assert.ok(!('g3' in s.filas.get('A').payload))
  const e = d.estado()
  assert.equal(e.sueltos, 3)
  assert.equal(e.enteros, 0)
  assert.ok(e.bytesAhorrados > 1_000_000)
})

caso('si cambian los calcos del terreno, van enteros una vez y después otra vez sólo los cambios', async () => {
  const { s, d, datos } = await abierto()
  datos.resultados.caminos.fc.features.pop()
  await pedir(d, 'guardar', { calco_id: 'A', payload: datos })
  assert.equal(s.pedidos.at(-1).delta, false) // lo que cambió es casi todo: entero
  datos.ops.limites.push({ id: 1 })
  await pedir(d, 'guardar', { calco_id: 'A', payload: datos })
  assert.deepEqual(s.pedidos.at(-1).claves, ['ops'])
  assert.deepEqual(s.filas.get('A').payload, datos)
})

caso('otro guardó en el medio (409): se manda entero y gana la Mesa, como antes', async () => {
  const { s, d, datos } = await abierto()
  s.filas.get('A').rev = 20 // otra pestaña / otro integrante
  s.filas.get('A').payload.ops = { limites: ['de otro'] }
  datos.unidades[0].lat = -18
  const r = await pedir(d, 'guardar', { calco_id: 'A', payload: datos })
  assert.equal(r.ok, true)
  assert.deepEqual(s.pedidos.slice(-2).map((p) => p.delta), [true, false])
  assert.deepEqual(s.filas.get('A').payload, datos)
  datos.unidades[0].lat = -19
  await pedir(d, 'guardar', { calco_id: 'A', payload: datos })
  assert.equal(s.pedidos.at(-1).delta, true) // y vuelve a los cambios sueltos
  assert.equal(d.estado().conflictos, 1)
})

caso('con la función vieja (sin rev) todo va entero: nunca un cambio suelto', async () => {
  const { s, d, datos } = await abierto({ viejo: true })
  for (let i = 0; i < 3; i++) {
    datos.unidades[0].lng -= 1
    const r = await pedir(d, 'guardar', { calco_id: 'A', payload: datos })
    assert.equal(r.ok, true)
  }
  assert.ok(s.pedidos.filter((p) => p.accion === 'guardar').every((p) => !p.delta))
  assert.deepEqual(s.filas.get('A').payload, datos)
})

caso('servidor caído: el error vuelve tal cual, NO se reintenta entero, y el siguiente guardado sale bien', async () => {
  const { s, d, datos } = await abierto()
  await pedir(d, 'guardar', { calco_id: 'A', payload: datos })
  const antes = s.pedidos.length
  s.caer(1)
  datos.unidades[0].lng = -70
  const r = await d.fetch(URL_OPS, { method: 'POST', body: JSON.stringify({ accion: 'guardar', token: 't', calco_id: 'A', payload: datos }) })
  assert.equal(r.status, 520)
  assert.equal(s.pedidos.length, antes + 1)
  const r2 = await pedir(d, 'guardar', { calco_id: 'A', payload: datos })
  assert.equal(r2.ok, true)
  assert.equal(s.pedidos.at(-1).delta, true)
  assert.deepEqual(s.filas.get('A').payload, datos)
})

caso('un ejercicio sin abrir (Guardar como) va entero la primera vez; después de entregar, también', async () => {
  const { s, d, datos } = await abierto()
  s.filas.set('B', { id: 'B', nombre: 'COPIA', rev: 0, payload: {} })
  await pedir(d, 'guardar', { calco_id: 'B', nombre: 'COPIA', payload: datos })
  assert.equal(s.pedidos.at(-1).delta, false)
  datos.ops.x = 1
  await pedir(d, 'guardar', { calco_id: 'B', nombre: 'COPIA', payload: datos })
  assert.equal(s.pedidos.at(-1).delta, true)
  await pedir(d, 'entregar', { calco_id: 'B', payload: datos })
  datos.ops.x = 2
  await pedir(d, 'guardar', { calco_id: 'B', nombre: 'COPIA', payload: datos })
  assert.equal(s.pedidos.at(-1).delta, false)
  assert.deepEqual(s.filas.get('B').payload, datos)
})

caso('dos guardados a la vez salen en orden (no se pisan)', async () => {
  const { s, d, datos } = await abierto()
  const d1 = JSON.parse(JSON.stringify(datos)); d1.ops.a = 1
  const d2 = JSON.parse(JSON.stringify(d1)); d2.ops.b = 2
  const [r1, r2] = await Promise.all([pedir(d, 'guardar', { calco_id: 'A', payload: d1 }), pedir(d, 'guardar', { calco_id: 'A', payload: d2 })])
  assert.ok(r1.ok && r2.ok)
  assert.deepEqual(s.filas.get('A').payload, d2)
  assert.equal(d.estado().conflictos, 0)
})

caso('lo que no es calco-ops no se toca; instalarDelta se engancha una sola vez y se puede apagar', async () => {
  const vistos = []
  const w = { fetch: async (u, o) => (vistos.push(u), resp(200, { ok: true })), localStorage: { getItem: () => null } }
  w.fetch.__sidResguardo = true
  assert.ok(instalarDelta(w))
  assert.equal(instalarDelta(w), null)
  assert.ok(w.fetch.__sidDelta && w.fetch.__sidResguardo && w.SIDGuardadoDelta)
  await w.fetch('https://otro/sitio', { method: 'POST', body: '{"accion":"guardar"}' })
  await w.fetch(URL_OPS)
  assert.equal(vistos.length, 2)
  const w2 = { fetch: async () => resp(200, {}), localStorage: { getItem: (k) => (k === 'sidDelta' ? '0' : null) } }
  assert.equal(instalarDelta(w2), null)
  assert.ok(!w2.fetch.__sidDelta)
})

// ── los guardados automáticos, espaciados ──
function banco(minEntre) {
  let ahora = 1_000_000, timers = [], id = 0
  const guardados = [], datos = { n: 0 }, ultimo = { current: '' }
  const g = crearGuardador({
    foto: () => ({ ...datos }), guardar: async (x) => (guardados.push(x.n), { ok: true }), ultimo, minEntre,
    reloj: () => ahora, programar: (f, ms) => (timers.push({ id: ++id, t: ahora + ms, f }), id), cancelar: (t) => (timers = timers.filter((x) => x.id !== t)),
  })
  const pasar = async (ms) => {
    const fin = ahora + ms
    for (;;) {
      const sig = timers.filter((x) => x.t <= fin).sort((a, b) => a.t - b.t)[0]
      if (!sig) break
      ahora = sig.t; timers = timers.filter((x) => x !== sig); sig.f()
      for (let i = 0; i < 6; i++) await new Promise((ok) => setImmediate(ok))
    }
    ahora = fin
  }
  g.activar(true)
  return { g, datos, guardados, pasar, cambiar: () => (datos.n++, g.cambio()) }
}

caso('espaciado: el primero sale a los 2,5 s; los siguientes automáticos, no antes de 60 s', async () => {
  const b = banco(60000)
  b.cambiar(); await b.pasar(2500)
  assert.deepEqual(b.guardados, [1])
  for (let i = 0; i < 10; i++) { b.cambiar(); await b.pasar(3000) } // 30 s de cambios seguidos
  assert.deepEqual(b.guardados, [1])
  assert.equal(b.g.estado.fase, 'pendiente')
  b.g.revisar(); await b.pasar(1) // la red de seguridad tampoco se adelanta
  assert.deepEqual(b.guardados, [1])
  await b.pasar(31000)
  assert.deepEqual(b.guardados, [1, 11]) // uno solo, con todo
  assert.equal(b.g.estado.fase, 'al-dia')
})

caso('espaciado: tocar el sello y salir de la pestaña guardan EN EL MOMENTO', async () => {
  const b = banco(60000)
  b.cambiar(); await b.pasar(2500)
  b.cambiar(); await b.pasar(1000)
  await b.g.guardarYa({ forzar: true })
  assert.deepEqual(b.guardados, [1, 2])
  b.cambiar(); await b.pasar(500)
  b.g.alSalir(); for (let i = 0; i < 6; i++) await new Promise((ok) => setImmediate(ok))
  assert.deepEqual(b.guardados, [1, 2, 3])
  assert.equal(b.g.sinGuardar(), false)
})

caso('el azar reparte a los equipos entre 45 y 75 s', () => {
  assert.equal(minEntreAlAzar(() => 0), MIN_ENTRE[0])
  assert.equal(minEntreAlAzar(() => 1), MIN_ENTRE[1])
  const v = minEntreAlAzar()
  assert.ok(v >= 45000 && v <= 75000)
})

let mal = 0
for (const [n, f] of casos) {
  try { await f(); console.log('  ✔ ' + n) } catch (e) { mal++; console.log('  ✘ ' + n + '\n    ' + ((e && e.stack) || e)) }
}
console.log(mal ? `\n${mal} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(mal ? 1 : 0)
