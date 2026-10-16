// 🛤️ Huellas y sendas de OSM (16-10-2026): la Mesa se colgaba con «⚙️ Huellas y sendas (OSM al día —
// Vía 3/4)…», sobre todo con áreas grandes (OSM sin contestar = espera para siempre; OSM con decenas de
// miles de caminos = la página trabada recortándolos uno por uno).
//   node calcos/pruebas/huellas-osm.mjs
// Sin red: OSM se contesta acá. Sin Worker (Node): se prueba también el camino «en la página».
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { clasificarVia as viaVieja } from '../assets/huellasOSM-B2eaicIK.js'
import { clasificarVia, recortador, recortarLinea, simplificar, procesar, descargar, consultaOverpass, cajaDe, CLASES, LIMITES } from '../huellas/v1/nucleo.mjs?v=huellas20261016'
import { traerHuellas, alAvisar } from '../huellas/v1/huellas-osm.mjs?v=huellas20261016'

const require = createRequire(import.meta.url)
const { cargar, vigente } = require('./extraer')

let semilla = 7
const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647
const casi = (a, b, tol, msj) => assert.ok(Math.abs(a - b) <= tol, `${msj}: ${a} ≠ ${b} (±${tol})`)
const largo = (partes) => partes.reduce((s, p) => s + p.slice(1).reduce((t, q, i) => t + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), 0)
const partesDe = (g) => (g.type === 'LineString' ? [g.coordinates] : g.coordinates)

// Un área como las que se dibujan a mano: cóncava, con un hueco, y otra parte suelta.
const exterior = []
for (let i = 0; i < 60; i++) {
  const a = (i / 60) * 2 * Math.PI, r = 0.5 * (0.75 + 0.25 * Math.sin(5 * a))
  exterior.push([-67.5 + r * Math.cos(a), -18.5 + r * Math.sin(a)])
}
exterior.push(exterior[0])
const hueco = [[-67.55, -18.55], [-67.45, -18.55], [-67.45, -18.45], [-67.55, -18.45], [-67.55, -18.55]]
const AOI = { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [[exterior, hueco], [[[-66.8, -18.1], [-66.7, -18.1], [-66.7, -18.0], [-66.8, -18.0], [-66.8, -18.1]]]] } }
const caminoAlAzar = (n = 25, paso = 0.02) => {
  let x = -67.5 - 0.65 + azar() * 1.6, y = -18.5 - 0.65 + azar() * 1.3
  const c = []
  for (let k = 0; k < n; k++) {
    c.push([x, y])
    x += (azar() - 0.5) * paso
    y += (azar() - 0.5) * paso
  }
  return c
}

// 1 · La clasificación militar es la de siempre.
for (const tags of [{}, { highway: 'path' }, { highway: 'footway' }, { highway: 'track', surface: 'asphalt' }, { highway: 'track', tracktype: 'grade1' }, { highway: 'track', surface: 'gravel' }, { highway: 'track', tracktype: 'grade2' }, { highway: 'track', tracktype: 'grade3' }, { highway: 'track', tracktype: 'grade5' }, { highway: 'track', surface: 'dirt' }, { highway: 'track', tracktype: 'GRADE4' }]) {
  assert.deepEqual(clasificarVia(tags), viaVieja(tags), JSON.stringify(tags))
}

// 2 · El recorte da lo mismo que el de la Mesa (turf, sacado textualmente del compilado).
const T = cargar(vigente(), ['ld', 'Qn', 'Qa', 'fi', 'g8', 'y8', 'v8', 'RI', 'Rp', 'AY', 'RR', 'cd', 'wu', 'P1', 'jI', 'As', 'Hl', 'Gr', 'ud', 'O1', 'ub', 'ime', 'Fg', 'db', 'CY', 'ome', 'er', 'mme', 'gme', 'ls', 'bme', 'OY', 'DI', '_me', 'hE', 'NI', 'zI', 'w8', 'jR', 'Ame', 'Sme', 'E8', 'LR', 'pE', 'jY', 'A8', 'LY', 'kme', 'Tme', 'Mme', 'Pme', 'Ome', 'Rme', 'NY', 'Lme', 'Dme', 'FY', 'zme', 'Fme', '$me', 'R1', 'FI', 'j1', '$I', 'Yme', 'qY', 'S8', 'Xme', 'Kme', 'UY', 'GY', 'C8', 'VY', 'I8', 'k8', 'Jme', 'WY', 'ege', 'tge', 'XY', 'BI', 'oge', 'hge', 'pge', 'KY', 'mge', 'cs', 'b5', 'Nye', 'rF', '_u', 'wY', 'oy', 'dme', 'RY', 'Ime', 'DY', 'zY', 'DR', 'NR', 'zR', 'Nme', 'Bme', 'Ume', 'Gme', '$Y', 'Vme', 'BY', 'Hme', 'Zme'], { console })
const R = recortador(AOI)
const lineas = Array.from({ length: 400 }, () => caminoAlAzar(30, 0.05))
let dentroTurf = 0, dentroNuevo = 0, cortadas = 0
for (const c of lineas) {
  const turf = T.rF({ features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } }] }, AOI).features
  const nuevo = recortarLinea(c, R)
  const lt = turf.reduce((s, f) => s + largo(partesDe(f.geometry)), 0)
  const ln = largo(nuevo)
  casi(ln, lt, 1e-6, 'largo adentro') // turf corta con 7 decimales: ~1 cm
  if (ln > 0 && ln < largo([c]) - 1e-9) cortadas++
  dentroTurf += lt
  dentroNuevo += ln
  // Cada pedazo, de a dos puntos, adentro (el punto medio de cada tramo).
  for (const p of nuevo) for (let i = 1; i < p.length; i++) assert.ok(R.dentro((p[i][0] + p[i - 1][0]) / 2, (p[i][1] + p[i - 1][1]) / 2))
}
assert.ok(cortadas > 50, `hay caminos que cruzan el borde (${cortadas})`)
casi(dentroNuevo, dentroTurf, 1e-5, 'largo total')
assert.equal(R.dentro(-67.5, -18.5), false, 'el hueco queda afuera')
assert.equal(R.dentro(-66.75, -18.05), true, 'la parte suelta queda adentro')
assert.equal(R.dentro(-66.0, -18.05), false)
assert.deepEqual(recortarLinea([[-66.75, -18.05], [-66.72, -18.05]], R), [[[-66.75, -18.05], [-66.72, -18.05]]], 'adentro entero: el mismo camino')
assert.deepEqual(recortarLinea([[-66.0, -18.0], [-65.9, -18.0]], R), [], 'afuera: nada')
// Sobre el borde y por un vértice del área.
const sq = recortador({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] })
assert.deepEqual(recortarLinea([[-1, 0.5], [2, 0.5]], sq), [[[-1 + 3 * (1 / 3), 0.5], [-1 + 3 * (2 / 3), 0.5]]])
assert.deepEqual(recortarLinea([[-1, -1], [2, 2]], sq), [[[0, 0], [1, 1]]], 'por la diagonal, de esquina a esquina')
assert.equal(largo(recortarLinea([[0.5, -1], [0.5, 0.5], [2, 0.5], [2, 0.7], [0.5, 0.7]], sq)), 0.5 + 0.5 + 0.5, 'entra, sale y vuelve a entrar')
assert.equal(recortarLinea([[0.5, -1], [0.5, 0.5], [2, 0.5], [2, 0.7], [0.5, 0.7]], sq).length, 2)

// 3 · Simplificar: quedan las puntas y nada se corre más que la tolerancia.
const zig = Array.from({ length: 1000 }, (_, i) => [i * 0.0001, (i % 2) * 0.00001])
const s = simplificar(zig, 0.00003)
assert.deepEqual([s[0], s[s.length - 1]], [zig[0], zig[999]])
assert.ok(s.length < 10, `${s.length} vértices`)
assert.deepEqual(simplificar(zig.slice(0, 2), 1), zig.slice(0, 2))
const curva = Array.from({ length: 200 }, (_, i) => [Math.cos(i / 40), Math.sin(i / 40)])
assert.ok(simplificar(curva, 0.0001).length > 20, 'una curva de verdad conserva su forma')

// 4 · Procesar: recortado, sin huecos de `out geom`, con topes y en orden de importancia.
const elementos = lineas.map((c, i) => ({ type: 'way', id: i + 1, tags: { highway: ['track', 'path', 'footway'][i % 3], tracktype: i % 6 === 0 ? 'grade2' : 'grade3' }, geometry: c.map(([lon, lat]) => ({ lat, lon })) }))
elementos[0].geometry.splice(5, 0, null)
const todo = await procesar({ elements: elementos }, AOI)
assert.equal(todo.recortada, true)
assert.equal(todo.topado, false)
assert.equal(todo.total, todo.features.length)
assert.ok(todo.features.length > 100 && todo.features.length <= 400)
const caja = cajaDe(AOI)
for (const f of todo.features) {
  for (const p of partesDe(f.geometry)) for (const [x, y] of p) assert.ok(x >= caja[0] - 1e-9 && x <= caja[2] + 1e-9 && y >= caja[1] - 1e-9 && y <= caja[3] + 1e-9)
  assert.equal(f.properties.fuente, 'OSM en vivo')
}
const pocos = await procesar({ elements: elementos }, AOI, { limites: { ...LIMITES, rasgosMax: 20 } })
assert.equal(pocos.features.length, 20)
assert.equal(pocos.total, todo.total)
assert.ok(pocos.features.every((f) => f.properties.via_militar === 3), 'primero las Vía 3')
const largos = pocos.features.map((f) => largo(partesDe(f.geometry)))
assert.ok(largos.every((l, i) => !i || l <= largos[i - 1] * 1.001 + 1e-4), 'los más largos primero')
const conPuntos = await procesar({ elements: elementos }, AOI, { limites: { ...LIMITES, puntosMax: 500 } })
assert.ok(conPuntos.features.reduce((n, f) => n + partesDe(f.geometry).reduce((m, p) => m + p.length, 0), 0) <= 500)
const topada = await procesar({ elements: Array.from({ length: CLASES[0].max }, () => ({ tags: { highway: 'track' } })) }, AOI)
assert.equal(topada.topado, true, 'Overpass devolvió el tope de la clase: hay más')

// Un área grande: 30.000 caminos se recortan en poco tiempo y cediendo el hilo seguido.
const muchos = Array.from({ length: 30000 }, (_, i) => ({ type: 'way', id: i, tags: { highway: 'track' }, geometry: caminoAlAzar(25, 0.004).map(([lon, lat]) => ({ lat, lon })) }))
let cedidas = 0, maxTramo = 0, t = performance.now()
const t0 = t
const grande = await procesar({ elements: muchos }, AOI, {
  ceder: async () => {
    maxTramo = Math.max(maxTramo, performance.now() - t)
    cedidas++
    await new Promise((r) => setTimeout(r, 0))
    t = performance.now()
  },
})
const ms = performance.now() - t0
assert.ok(grande.features.length > 5000, `${grande.features.length} caminos adentro`)
assert.ok(cedidas > 5, `cedió el hilo ${cedidas} veces`)
assert.ok(maxTramo < 250, `el tramo más largo sin ceder: ${Math.round(maxTramo)} ms`)
assert.ok(ms < 20000, `${Math.round(ms)} ms`)

// 5 · La consulta: por clase, con su tope, y el rectángulo del área.
const q = consultaOverpass([-68, -19, -67, -18])
assert.match(q, /^\[out:json\]\[timeout:50\];/)
assert.match(q, /way\["highway"~"\^\(track\)\$"\]\(-19\.00000,-68\.00000,-18\.00000,-67\.00000\);out geom 20000;/)
assert.match(q, /\(path\|bridleway\).*out geom 10000;/)
assert.match(q, /\(footway\|cycleway\).*out geom 5000;/)

// 6 · Descargar: nunca espera para siempre y prueba el otro servidor.
const L = { ...LIMITES, esperaServidorMs: 200, esperaTotalMs: 1000 }
const respuesta = (cuerpo, status = 200) => new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), { status })
const colgado = (_, { signal }) => new Promise((_, mal) => signal.addEventListener('abort', () => mal(new Error('abortado'))))
const pidio = []
const avisos = []
const r1 = await descargar('q', {
  limites: L,
  servidores: ['uno', 'dos'],
  aviso: (x) => avisos.push(x),
  pedir: (u, o) => (pidio.push(u), u === 'uno' ? colgado(u, o) : respuesta({ elements: [{ id: 1 }] })),
})
assert.deepEqual(pidio, ['uno', 'dos'])
assert.deepEqual(r1.datos.elements, [{ id: 1 }])
assert.ok(avisos.some((a) => /otro servidor/.test(a)))
await assert.rejects(descargar('q', { limites: L, servidores: ['uno', 'dos'], pedir: colgado }), /OSM no contestó en 0 s|OSM no contestó/)
await assert.rejects(descargar('q', { limites: L, servidores: ['uno'], pedir: () => respuesta('', 429) }), /saturado \(429\)/)
const r2 = await descargar('q', { limites: L, servidores: ['uno', 'dos'], pedir: (u) => respuesta(u === 'uno' ? { elements: [], remark: 'runtime error: Query timed out in "query" at line 2' } : { elements: [{ id: 2 }] }) })
assert.deepEqual(r2.datos.elements, [{ id: 2 }], 'Overpass sin terminar: el otro servidor')
const r3 = await descargar('q', { limites: L, servidores: ['uno'], pedir: () => respuesta({ elements: [{ id: 3 }], remark: 'runtime error: Query run out of memory' }) })
assert.equal(r3.parcial, true, 'lo que llegó antes del corte sirve, avisando')
await assert.rejects(descargar('q', { limites: { ...L, bytesMax: 1000 }, servidores: ['uno'], pedir: () => respuesta({ elements: Array.from({ length: 100 }, (_, i) => ({ id: i })) }) }), /pasa de 0 MB/)
const t1 = Date.now()
await assert.rejects(descargar('q', { limites: L, servidores: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], pedir: colgado }))
assert.ok(Date.now() - t1 < 1500, 'el total también tiene tope')
// Ya contestando: una descarga lenta pero viva no se corta; una que se queda quieta, sí.
const flujo = (signal, trozos, cadaMs, colgar) => new Response(new ReadableStream({
  async start(c) {
    signal.addEventListener('abort', () => { try { c.error(new Error('abortado')) } catch {} })
    for (const t of trozos) {
      await new Promise((r) => setTimeout(r, cadaMs))
      try { c.enqueue(new TextEncoder().encode(t)) } catch { return }
    }
    if (!colgar) c.close()
  },
}))
const Lq = { ...LIMITES, esperaServidorMs: 200, esperaTotalMs: 400, esperaSinDatosMs: 150 }
const tl = Date.now()
const r4 = await descargar('q', { limites: Lq, servidores: ['uno'], pedir: (u, { signal }) => flujo(signal, JSON.stringify({ elements: [{ id: 9 }] }).match(/.{1,4}/g), 80, false) })
assert.deepEqual(r4.datos.elements, [{ id: 9 }])
assert.ok(Date.now() - tl > 400, 'tardó más que la espera del servidor y del total, y no se cortó')
await assert.rejects(descargar('q', { limites: Lq, servidores: ['uno'], pedir: (u, { signal }) => flujo(signal, ['{"elem'], 10, true) }), /la descarga de OSM se quedó quieta 0 s/)

// 7 · traerHuellas (lo que llama la Mesa): no tira errores, avisa y no pide dos veces la misma área.
globalThis.SIDECEME_HUELLAS_LIMITES = { esperaServidorMs: 200, esperaTotalMs: 500, esperaSinDatosMs: 200 }
const pedidos = []
let contestar = () => respuesta({ elements: elementos })
globalThis.fetch = async (u, o) => (pedidos.push(u), contestar(u, o))
const oidos = []
const soltar = alAvisar((x) => oidos.push(x))
const [a, b] = await Promise.all([traerHuellas(AOI), traerHuellas(AOI)])
assert.equal(pedidos.length, 1, 'la misma área, un solo pedido')
assert.equal(a._recortada, true)
assert.equal(a.features.length, todo.features.length)
assert.notEqual(a.features, b.features, 'cada uno con su lista')
assert.equal(a._aviso, undefined)
assert.ok(oidos.some((x) => /caminos traídos de OSM/.test(x)))
soltar()

const otra = { type: 'Polygon', coordinates: [[[-67, -18], [-66.9, -18], [-66.9, -17.9], [-67, -18]]] }
contestar = colgado
const mal = await traerHuellas(otra)
assert.deepEqual(mal.features, [])
assert.match(mal._aviso, /no se pudieron traer de OpenStreetMap \(OSM no contestó/)
assert.equal(mal._reintentar, true, 'la Mesa no la guarda: se puede volver a intentar')
contestar = () => respuesta({ elements: elementos })
const bien = await traerHuellas(otra)
assert.equal(bien._reintentar, undefined, 'al reintentar, pide de nuevo')
assert.ok(pedidos.length >= 4)

const enorme = { type: 'Polygon', coordinates: [[[-69, -22], [-64, -22], [-64, -17], [-69, -22]]] }
const n0 = pedidos.length
const grandota = await traerHuellas(enorme)
assert.equal(pedidos.length, n0, 'un área de más de 3° ni se pide')
assert.match(grandota._aviso, /pasa de 3°/)
assert.equal(grandota._reintentar, false)

globalThis.SIDECEME_HUELLAS_LIMITES = { rasgosMax: 10 }
const tope = await traerHuellas({ type: 'Feature', geometry: AOI.geometry, properties: { otra: 1 } }) // misma área: de la caché
assert.equal(tope.features.length, todo.features.length)
const tope2 = await traerHuellas({ type: 'Polygon', coordinates: AOI.geometry.coordinates[0] })
assert.equal(tope2.features.length, 10)
assert.match(tope2._aviso, /van los 10 caminos más importantes de/)

console.log(`Huellas de OSM: la clasificación de siempre, el recorte igual al de la Mesa (${cortadas} de 400 caminos cortados en el borde, con hueco y parte suelta), simplificado, topes en orden de importancia, ${muchos.length.toLocaleString('es-BO')} caminos en ${Math.round(ms)} ms cediendo el hilo, nunca espera para siempre, otro servidor, no tira errores y no pide dos veces la misma área: OK.`)
