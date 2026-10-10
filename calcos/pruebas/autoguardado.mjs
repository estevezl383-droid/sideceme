// 💾 Motor del autoguardado (calcos/guardado/v1/autoguardado.mjs) con un reloj falso:
// guarda 2,5 s después del último cambio y, si los cambios no paran, cada 15 s; no guarda lo
// que no cambió (salvo al tocar el sello); reintenta si falla (no con el candado de «vacío»);
// si cambia algo mientras guarda, guarda otra vez; la red de seguridad encuentra cambios que no
// avisaron; al salir guarda lo pendiente; el sello dice el estado.
//   node calcos/pruebas/autoguardado.mjs
import assert from 'node:assert/strict'
import { crearGuardador, sello, ESPERA, ESPERA_MAX, REINTENTOS } from '../guardado/v1/autoguardado.mjs'

const casos = []
const caso = (nombre, fn) => casos.push([nombre, fn])
const vuelta = () => new Promise((ok) => setImmediate(ok))

// Reloj y temporizadores falsos.
function banco({ respuestas = [], demora = 0 } = {}) {
  let ahora = 1_000_000
  let timers = []
  let id = 0
  const guardados = []
  const avisos = []
  const estados = []
  const datos = { ops: { limites: [] }, unidades: [], nombre: 'FABBLE 1.0' }
  const ultimo = { current: '' }
  const g = crearGuardador({
    foto: () => JSON.parse(JSON.stringify(datos)),
    guardar: async (d) => {
      guardados.push(d)
      if (demora) await new Promise((ok) => timers.push({ id: ++id, t: ahora + demora, f: ok }))
      return respuestas.length ? respuestas.shift() : { ok: true }
    },
    ultimo,
    alCambiar: (e) => estados.push(e.fase),
    avisar: (r) => avisos.push(r),
    reloj: () => ahora,
    programar: (f, ms) => {
      timers.push({ id: ++id, t: ahora + ms, f })
      return id
    },
    cancelar: (t) => {
      timers = timers.filter((x) => x.id !== t)
    },
  })
  async function avanzar(ms) {
    const fin = ahora + ms
    for (;;) {
      await vuelta()
      timers.sort((a, b) => a.t - b.t)
      const x = timers[0]
      if (!x || x.t > fin) break
      timers.shift()
      ahora = x.t
      x.f()
    }
    ahora = fin
    await vuelta()
    await vuelta()
  }
  return { g, datos, ultimo, guardados, avisos, estados, avanzar, pendientes: () => timers.length }
}

caso('recién abierto: se guarda, pero el sello no dice «sin guardar»', async () => {
  const b = banco()
  b.g.activar(true)
  b.g.cambio()
  assert.equal(b.g.estado.fase, 'inactivo')
  assert.ok(!b.g.sinGuardar(), 'cerrar recién abierto no pregunta')
  await b.avanzar(ESPERA)
  assert.equal(b.guardados.length, 1)
  assert.equal(b.g.estado.fase, 'al-dia')
})

caso('guarda 2,5 s después del último cambio, una sola vez', async () => {
  const b = banco()
  b.ultimo.current = '{"ya":"guardado"}'
  b.g.activar(true)
  b.g.cambio()
  assert.equal(b.g.estado.fase, 'pendiente')
  assert.ok(b.g.sinGuardar())
  await b.avanzar(ESPERA - 100)
  assert.equal(b.guardados.length, 0)
  b.datos.unidades.push({ id: 'u1' })
  b.g.cambio() // otro cambio antes de los 2,5 s: vuelve a esperar
  await b.avanzar(ESPERA - 100)
  assert.equal(b.guardados.length, 0)
  await b.avanzar(200)
  assert.equal(b.guardados.length, 1)
  assert.equal(b.guardados[0].unidades.length, 1)
  assert.equal(b.g.estado.fase, 'al-dia')
  assert.match(b.g.estado.hora, /\d\d:\d\d:\d\d/, 'la hora con segundos')
  assert.ok(!b.g.sinGuardar())
  assert.ok(b.ultimo.current.includes('"u1"'), 'recuerda lo último guardado')
})

caso('si los cambios no paran, igual guarda cada 15 s', async () => {
  const b = banco()
  b.g.activar(true)
  for (let i = 0; i < 40; i++) {
    b.datos.unidades.push({ id: 'u' + i })
    b.g.cambio()
    await b.avanzar(1000)
  }
  assert.ok(b.guardados.length >= 2, `guardó ${b.guardados.length} veces en 40 s de cambios seguidos`)
  assert.ok(b.guardados[0].unidades.length <= ESPERA_MAX / 1000 + 1, 'el primero, a los 15 s como mucho')
})

caso('lo que no cambió no se guarda; tocar el sello guarda igual', async () => {
  const b = banco()
  b.g.activar(true)
  b.g.cambio()
  await b.avanzar(ESPERA)
  assert.equal(b.guardados.length, 1)
  b.g.cambio() // la Mesa avisó, pero el ejercicio es el mismo
  await b.avanzar(ESPERA)
  assert.equal(b.guardados.length, 1)
  assert.equal(b.g.estado.fase, 'al-dia')
  await b.g.guardarYa({ forzar: true })
  assert.equal(b.guardados.length, 2, 'el clic guarda aunque no haya cambios')
  assert.equal(b.g.estado.fase, 'al-dia')
})

caso('al abrir o crear un ejercicio la Mesa vacía `ultimo`: se guarda otra vez', async () => {
  const b = banco()
  b.g.activar(true)
  b.g.cambio()
  await b.avanzar(ESPERA)
  assert.ok(b.g.estado.hora)
  b.ultimo.current = '' // se abrió otro ejercicio
  b.g.cambio()
  assert.equal(b.g.estado.hora, '', 'el sello no muestra la hora del ejercicio de antes')
  assert.equal(b.g.estado.fase, 'inactivo')
  await b.avanzar(ESPERA)
  assert.equal(b.guardados.length, 2)
  assert.equal(b.g.estado.fase, 'al-dia')
})

caso('si falla: el sello lo dice, avisa y reintenta solo', async () => {
  const b = banco({ respuestas: [{ ok: false, error: 'sin red' }, { ok: false, error: 'sin red' }] })
  b.g.activar(true)
  b.g.cambio()
  await b.avanzar(ESPERA)
  assert.equal(b.g.estado.fase, 'error')
  assert.equal(b.g.estado.error, 'sin red')
  assert.equal(b.avisos.length, 1)
  assert.ok(b.g.sinGuardar(), 'cerrar ahora perdería el trabajo')
  b.g.cambio() // un cambio no adelanta el reintento
  await b.avanzar(REINTENTOS[0] - 10)
  assert.equal(b.guardados.length, 1)
  await b.avanzar(20)
  assert.equal(b.guardados.length, 2, 'primer reintento a los 10 s')
  await b.avanzar(REINTENTOS[1])
  assert.equal(b.guardados.length, 3, 'segundo reintento a los 30 s')
  assert.equal(b.g.estado.fase, 'al-dia')
  assert.equal(b.g.estado.error, '')
})

caso('si guardar lanza una excepción, cuenta como error', async () => {
  const b = banco()
  const g = crearGuardador({ foto: () => ({ a: 1 }), guardar: () => Promise.reject(new Error('Failed to fetch')), programar: () => 1, cancelar: () => {} })
  g.activar(true)
  const r = await g.guardarYa()
  assert.equal(r.ok, false)
  assert.equal(g.estado.fase, 'error')
  assert.equal(g.estado.error, 'Failed to fetch')
  void b
})

caso('con el candado de «vacío» no reintenta (hay que abrir el ejercicio de nuevo)', async () => {
  const b = banco({ respuestas: [{ ok: false, vacio: true, error: 'tiene trabajo guardado' }] })
  b.g.activar(true)
  b.g.cambio()
  await b.avanzar(ESPERA)
  assert.equal(b.g.estado.fase, 'error')
  assert.equal(b.g.estado.vacio, true)
  await b.avanzar(120000)
  assert.equal(b.guardados.length, 1)
  assert.ok(!b.g.sinGuardar(), 'la pantalla está en blanco: no se pierde nada al salir')
})

caso('si cambia algo mientras guarda, guarda otra vez lo último', async () => {
  const b = banco({ demora: 1000 })
  b.g.activar(true)
  b.g.cambio()
  await b.avanzar(ESPERA + 100) // guardando
  assert.equal(b.g.estado.fase, 'guardando')
  b.datos.unidades.push({ id: 'durante' })
  b.g.guardarYa({ forzar: true }) // el clic mientras guarda
  await b.avanzar(5000)
  assert.equal(b.guardados.length, 2)
  assert.equal(b.guardados[1].unidades[0].id, 'durante')
  assert.equal(b.g.estado.fase, 'al-dia')
})

caso('la red de seguridad encuentra un cambio que no avisó', async () => {
  const b = banco()
  b.g.activar(true)
  b.g.cambio()
  await b.avanzar(ESPERA)
  b.datos.ops.limites.push({ coords: [] }) // nadie llamó a cambio()
  b.g.revisar()
  await b.avanzar(10)
  assert.equal(b.guardados.length, 2)
  b.g.revisar() // sin cambios: nada
  await b.avanzar(10)
  assert.equal(b.guardados.length, 2)
})

caso('al salir de la pestaña guarda lo pendiente ya', async () => {
  const b = banco()
  b.g.activar(true)
  b.datos.unidades.push({ id: 'x' })
  b.g.cambio()
  await b.avanzar(200)
  b.g.alSalir()
  await b.avanzar(10)
  assert.equal(b.guardados.length, 1)
  assert.equal(b.pendientes(), 0, 'no queda el temporizador')
})

caso('sin ejercicio (o finalizado) no guarda nada', async () => {
  const b = banco()
  b.g.cambio()
  await b.avanzar(ESPERA * 4)
  assert.equal(b.guardados.length, 0)
  b.g.activar(true)
  b.g.cambio()
  b.g.activar(false) // se finalizó antes de los 2,5 s
  await b.avanzar(ESPERA * 4)
  assert.equal(b.guardados.length, 0)
  assert.equal((await b.g.guardarYa({ forzar: true })).inactivo, true)
  assert.ok(!b.g.sinGuardar())
})

caso('si no se puede armar la foto, el sello lo dice', async () => {
  const g = crearGuardador({ foto: () => { throw new Error('estructura circular') }, guardar: async () => ({ ok: true }), programar: () => 1, cancelar: () => {} })
  g.activar(true)
  await g.guardarYa()
  assert.equal(g.estado.fase, 'error')
  assert.match(g.estado.error, /estructura circular/)
})

caso('el sello: un botón con el estado a la vista', async () => {
  const llamadas = []
  const ag = (e) => ({ fase: 'inactivo', hora: '', error: '', vacio: false, ...e, guardarYa: (o) => llamadas.push(o) })
  assert.deepEqual([sello(ag({}), true)['data-estado'], sello(ag({}), true).disabled, sello(ag({}), true).children], ['finalizado', true, '🔒 finalizado'])
  assert.equal(sello(ag({}), false).children, '💾 autoguardado activo')
  assert.equal(sello(ag({ fase: 'pendiente' })).children, '● sin guardar · guardar')
  assert.equal(sello(ag({ fase: 'guardando' })).children, '💾 guardando…', 'el aviso de versión espera mientras dice «guardando»')
  const ok = sello(ag({ fase: 'al-dia', hora: '10:34:12' }))
  assert.equal(ok.children, '✓ guardado 10:34:12')
  assert.equal(ok['data-estado'], 'al-dia')
  const mal = sello(ag({ fase: 'error', error: 'sin red' }))
  assert.equal(mal.children, '⚠️ no se guardó · reintentar')
  assert.match(mal.title, /sin red/)
  ok.onClick()
  assert.deepEqual(llamadas, [{ forzar: true }], 'tocarlo guarda todo, aunque no haya cambios')
})

let fallas = 0
for (const [nombre, fn] of casos) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e && e.stack).split('\n').slice(0, 4).join('\n      ')}`)
  }
}
console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
