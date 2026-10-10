// ✂️ Repartir el Área de Operaciones con el lazo y entregar lo que está dentro.
//   node calcos/pruebas/areas-lazo.mjs
import assert from 'node:assert/strict'
import { repartir, contenidoDeAreas, resumenContenido, sumarContenido, fichasDelPaquete } from '../areas-operaciones/recorte.mjs'
import { recortarArea, paqueteAreas, importarAreas, listarAreas } from '../areas-operaciones/modelo.mjs'
import { construirPaquete, recibirUnidades } from '../areas-operaciones/compartir-modelo.mjs'

// Superficie en km² sobre un mismo plano para todas (aprox. local, sobra para comparar).
const km2 = c => {
  const kx = 111.32 * Math.cos(-18.4 * Math.PI / 180), ky = 110.57
  let s = 0
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) s += c[j][0] * kx * c[i][1] * ky - c[i][0] * kx * c[j][1] * ky
  return Math.abs(s / 2)
}
const clave = p => `${p[0].toFixed(7)},${p[1].toFixed(7)}`
const comparten = (a, b) => a.filter(p => b.some(q => clave(q) === clave(p))).length
const casi = (a, b, tol, msj) => assert.ok(Math.abs(a - b) <= tol, `${msj}: ${a} ≠ ${b} (±${tol})`)

// 1 · Cuadrado partido por una vertical (que sobresale) y una horizontal que se queda
//     300 m corta del borde: tres zonas exactas, sin huecos ni encimados.
const ao = { id: 'ff', nombre: 'FF.TT.T.O.', coords: [[-68, -18], [-67, -18], [-67, -19], [-68, -19]], operacion: 'DEFENSA', tipo: 'defensiva' }
const limites = [
  { coords: [[-67.5, -17.95], [-67.5, -19.05]], escalon: 'cuerpo', tipo: 'magnitud' },
  { coords: [[-67.5, -18.5], [-67.003, -18.5]], escalon: 'cuerpo', tipo: 'magnitud' },
]
const oeste = repartir([ao], limites, { punto: [-67.75, -18.5] })
const noreste = repartir([ao], limites, { lazo: [[-67.45, -17.9], [-66.9, -17.9], [-66.95, -18.45], [-67.55, -18.55]] })
const sureste = repartir([ao], limites, { punto: [-67.2, -18.8] })
for (const r of [oeste, noreste, sureste]) assert.equal(r.ok, true, r.error)
casi(km2(oeste.coords) + km2(noreste.coords) + km2(sureste.coords), km2(ao.coords), 0.01, 'las tres zonas cubren el área exacta')
casi(km2(oeste.coords), km2(ao.coords) / 2, 0.01, 'la vertical parte el área en dos')
assert.ok(comparten(noreste.coords, sureste.coords) >= 3, 'los vecinos comparten los vértices del límite (y el cierre al borde)')
assert.ok(noreste.coords.some(p => clave(p) === clave([-67.003, -18.5])), 'se conserva la punta original del límite')
assert.ok(noreste.coords.some(p => clave(p) === clave([-67, -18.5])), 'el límite corto se prolonga hasta el borde')
assert.equal(oeste.base, 'ff')

// 2 · Un lazo tosco que tapa dos zonas: quedan unidas en un solo contorno.
const este = repartir([ao], limites, { lazo: [[-67.55, -17.85], [-66.8, -17.85], [-66.8, -19.2], [-67.6, -19.2]] })
assert.equal(este.ok, true); assert.equal(este.piezas, 2); assert.equal(este.separadas, false)
casi(km2(este.coords), km2(noreste.coords) + km2(sureste.coords), 0.01, 'unión de dos zonas')
assert.ok(!este.coords.some(p => clave(p) === clave([-67.003, -18.5])), 'el límite interno desaparece al unir')

// 3 · Sin límites: se corta por el lazo (lazo libre), dentro del área.
const libre = repartir([ao], [], { lazo: [[-67.8, -18.2], [-66.5, -18.2], [-66.5, -18.8], [-67.8, -18.8]] })
assert.equal(libre.ok, true); assert.equal(libre.libre, true)
casi(km2(libre.coords), km2([[-67.8, -18.2], [-67, -18.2], [-67, -18.8], [-67.8, -18.8]]), 0.01, 'lazo libre recortado al área')
assert.equal(repartir([ao], limites, { punto: [-60, -10] }).ok, false)
assert.equal(repartir([ao], limites, { lazo: [[-60, -10], [-59, -10], [-59, -11]] }).ok, false)
assert.equal(repartir([], limites, { punto: [-67.7, -18.5] }).ok, false)

// 4 · Como la figura del Profesor: borde oeste dentado (frontera), dos líneas casi
//     verticales que sobresalen o se quedan cortas, y una transversal de borde a línea.
const dentado = []
for (let i = 0; i <= 40; i++) dentado.push([-68.6 + (i % 2 ? 0.03 : -0.02) + Math.sin(i / 3) * 0.05, -17.6 - i * 0.04])
const fig = { id: 'fig', nombre: 'FABBLE', coords: [[-68.55, -17.55], [-67.4, -17.5], [-66.9, -17.8], [-66.8, -18.4], [-67.0, -18.8], [-66.95, -19.3], [-67.5, -19.25], [-68.3, -19.22], ...dentado.reverse()] }
const lineas = [
  { coords: [[-68.35, -17.45], [-68.3, -17.9], [-68.25, -18.3], [-68.1, -18.8], [-68.05, -19.21]], escalon: 'cuerpo', tipo: 'simple' }, // se queda ~1 km corta abajo
  { coords: [[-67.25, -17.4], [-67.3, -17.9], [-67.28, -18.4], [-67.32, -19.0], [-67.3, -19.4]], escalon: 'cuerpo', tipo: 'magnitud' }, // sobresale arriba y abajo
  { coords: [[-68.7, -18.35], [-68.25, -18.33], [-67.8, -18.4], [-67.4, -18.36], [-67.29, -18.37]], escalon: 'cuerpo', tipo: 'magnitud' }, // de la frontera a la línea este
]
const t0 = Date.now()
const zonas = [[-68.45, -17.8], [-68.45, -18.9], [-67.8, -17.9], [-67.8, -18.9], [-67.05, -18.4]].map(p => repartir([fig], lineas, { punto: p }))
for (const z of zonas) assert.equal(z.ok, true, z.error)
casi(zonas.reduce((s, z) => s + km2(z.coords), 0), km2(fig.coords), km2(fig.coords) * 1e-6, 'cinco zonas que cubren el área entera')
assert.equal(new Set(zonas.map(z => km2(z.coords).toFixed(3))).size, 5, 'cinco zonas distintas')
const ce = repartir([fig], lineas, { lazo: [[-68.2, -17.5], [-67.35, -17.5], [-67.35, -19.3], [-68.0, -19.3], [-68.15, -18.4]] })
assert.equal(ce.ok, true); assert.equal(ce.piezas, 2)
casi(km2(ce.coords), km2(zonas[2].coords) + km2(zonas[3].coords), 0.05, 'el Cuerpo del centro (norte + sur)')

// 5 · Repartir un Cuerpo en Divisiones: el lazo dentro del Cuerpo corta el Cuerpo.
const conCE = [fig, { id: 'ce1', nombre: 'CE-I', coords: ce.coords }]
const lineasDiv = [...lineas, { coords: [[-67.8, -18.36], [-67.8, -19.3]], escalon: 'division', tipo: 'magnitud' }]
const divClic = repartir(conCE, lineasDiv, { punto: [-67.95, -18.8] })
assert.equal(divClic.ok, true); assert.equal(divClic.base, 'ce1', 'el clic dentro del Cuerpo reparte el Cuerpo')
assert.equal(repartir(conCE, lineasDiv, { lazo: [[-68.15, -18.45], [-67.5, -18.45], [-67.5, -19.15], [-68.1, -19.15]] }).base, 'ce1', 'el lazo dentro del Cuerpo, también')
assert.match(repartir(conCE, lineasDiv, { lazo: [[-68.0, -18.5], [-67.9, -18.5], [-67.9, -18.6]] }).error, /mitad/, 'un lazo que no encierra ni media zona avisa')
// Un lazo que se sale del Cuerpo da la misma División: el contorno del Cuerpo también corta.
const divLazo = repartir(conCE, lineasDiv, { lazo: [[-68.3, -18.38], [-67.82, -18.38], [-67.82, -19.22], [-68.3, -19.22]] })
assert.equal(divLazo.ok, true)
casi(km2(divLazo.coords), km2(divClic.coords), 0.05, 'la misma División con clic o con lazo')
// Lo que queda de la FF.TT.T.O. después de sacar el Cuerpo también sale exacto.
const resto = repartir(conCE, [], { punto: [-67.05, -18.4] })
casi(km2(resto.coords), km2(zonas[4].coords), 0.05, 'el contorno de otra área también corta')
assert.ok(Date.now() - t0 < 5000, 'rápido')

// 6 · Qué va con el área: sus límites completos (no los de la FF.TT.T.O.), los puntos
//     de su borde, las marcas de sus límites y las fichas de adentro.
const ops = {
  areaOps: ao, limites: [...limites,
    { coords: [[-68, -18], [-67, -18]], escalon: 'ejercito', tipo: 'magnitud' }, // límite de la FF.TT.T.O.
    { coords: [[-67.9, -18.6], [-67.6, -18.9]], tipo: 'punteada' }, // línea en la zona oeste
  ],
  coordinacion: [{ centro: [-67.5, -18.0] }, { centro: [-67.5005, -18.5] }, { centro: [-67.75, -18.75] }, { centro: [-67.001, -18.5] }],
  pasaje: [{ centro: [-67.2, -18.2], etiqueta: 'A' }],
  magnitudes: [
    { centro: [-67.5, -18.2], escalon: 'cuerpo', origen: 'limite-0' }, { centro: [-67.25, -18.5], escalon: 'cuerpo', origen: 'limite-1' },
    { centro: [-67.5, -18], escalon: 'ejercito', origen: 'limite-2' }, { centro: [-67.3, -18.3], escalon: 'ejercito' }, { centro: [-67.3, -18.25], escalon: 'cuerpo' },
  ],
  zonasLog: [{ coords: [[-67.3, -18.1], [-67.1, -18.1], [-67.1, -18.3]], zona: 'zrb', clave: 'zrb-1' }],
  tareas: [{ centro: [-67.4, -18.4], tarea: 'bloquear' }], obstaculos: [{ coords: [[-67.4, -18.3], [-67.2, -18.31]], tipo: 'faja' }],
  planFuegos: { secreto: true },
}
ops.magnitudes.push({ centro: [-67.2, -18.1], origen: 'zona-zrb-1' })
const unidades = [{ id: 1, lat: -18.2, lng: -67.2, bando: 'propias', designacion: 'R.I.-1' }, { id: 2, lat: -18.3, lng: -67.3, bando: 'enemigo' }, { id: 3, lat: -18.8, lng: -67.2, bando: 'propias' }, { id: 4, lat: -18.5, lng: -67.8, bando: 'propias' }]
const area = { id: 'ce', coords: noreste.coords, escalon: 'cuerpo' }
const c = contenidoDeAreas([area], ops, unidades)
assert.deepEqual(c.ops.limites.map(l => l.coords[0]), [[-67.5, -17.95], [-67.5, -18.5]], 'sus dos límites, completos; ni el de la FF.TT.T.O. ni la línea del vecino')
assert.equal(c.ops.coordinacion.length, 3, 'los tres puntos de su borde')
assert.equal(c.ops.pasaje.length, 1); assert.equal(c.ops.tareas.length, 1); assert.equal(c.ops.obstaculos.length, 1); assert.equal(c.ops.zonasLog.length, 1)
assert.deepEqual(c.ops.magnitudes.map(m => m.origen || m.escalon), ['limite-0', 'limite-1', 'cuerpo', 'zona-zrb-1'], 'marcas de sus límites (renumeradas), la suelta del Cuerpo y la de su zona')
assert.deepEqual(c.unidades.map(u => u.id), [1, 2], 'fichas de adentro, propias y enemigas')
assert.deepEqual(contenidoDeAreas([area], ops, unidades, { enemigo: false }).unidades.map(u => u.id), [1])
// La magnitud elegida en el panel no cambia nada: el escalón sale de los límites del borde.
assert.equal(contenidoDeAreas([{ ...area, escalon: 'brigada' }], ops, unidades).ops.limites.length, 2, 'con «Brigada» en el panel, sus límites de Cuerpo igual van')
// Los límites de un escalón menor DENTRO del área (sus Divisiones) también van.
const conDiv = { ...ops, limites: [...ops.limites, { coords: [[-67.25, -18.0], [-67.25, -18.5]], escalon: 'division', tipo: 'magnitud' }] }
assert.equal(contenidoDeAreas([area], conDiv, []).ops.limites.length, 3)
assert.equal(c.planFuegos, undefined); assert.equal(c.ops.planFuegos, undefined)
const cOeste = contenidoDeAreas([{ coords: oeste.coords, escalon: 'cuerpo' }], ops, unidades)
assert.deepEqual(cOeste.ops.limites.map(l => l.tipo), ['magnitud', 'punteada'], 'al oeste: la vertical y su línea; la horizontal sólo lo toca con la punta')
assert.deepEqual(cOeste.unidades.map(u => u.id), [4])
// Dos áreas juntas: lo del borde común va una sola vez.
const ambos = contenidoDeAreas([area, { coords: sureste.coords, escalon: 'cuerpo' }], ops, unidades)
assert.equal(ambos.ops.limites.length, 2); assert.equal(ambos.ops.coordinacion.length, 3)
assert.match(resumenContenido(c), /2 límite\(s\).*3 punto\(s\) de coordinación.*1 ficha\(s\) propia\(s\) · 1 ficha\(s\) enemiga\(s\)/)

// 7 · recortarArea la agrega activa, con nombre por magnitud y la operación del área madre.
const r = recortarArea({ areaOps: ao, limites }, { punto: [-67.2, -18.2] }, { escalon: 'cuerpo', id: 'ao-nueva' })
assert.equal(r.ops.areaOps.id, 'ao-nueva'); assert.equal(r.ops.areaOps.nombre, 'CE-I'); assert.equal(r.ops.areaOps.operacion, 'DEFENSA')
assert.equal(listarAreas(r.ops).length, 2)
const r2 = recortarArea(r.ops, { punto: [-67.2, -18.8] }, { escalon: 'cuerpo' })
assert.equal(r2.ops.areaOps.nombre, 'CE-II')
assert.equal(listarAreas(r2.ops).length, 3)
assert.throws(() => recortarArea(r.ops, { punto: [-60, -10] }), /fuera/)

// 8 · El paquete JSON y su importación en el ejercicio del escalón subordinado.
const ops2 = { ...ops, areaOps: { ...area, nombre: 'CE-I', id: 'ce' }, areasOps: [ao] }
const p = paqueteAreas(ops2, ['ce'], 'FABBLE', { unidades, enemigo: true })
assert.equal(p.areas.length, 1); assert.equal(p.contenido.unidades.length, 2); assert.equal(p.planFuegos, undefined)
assert.equal(paqueteAreas(ops2, ['ce'], 'FABBLE').contenido, undefined, 'sin pedirlo, sólo contornos (como antes)')
const destino = { limites: [{ coords: [[0, 0], [1, 1]], tipo: 'simple' }], magnitudes: [], coordinacion: [] }
const recibido = importarAreas(destino, JSON.parse(JSON.stringify(p)))
assert.equal(recibido.areaOps.nombre, 'CE-I')
assert.equal(recibido.limites.length, 3)
assert.deepEqual(recibido.magnitudes.filter(m => /^limite/.test(m.origen || '')).map(m => m.origen), ['limite-1', 'limite-2'], 'marcas renumeradas detrás de los límites previos')
assert.equal(recibido.coordinacion.length, 3)
const fichas = fichasDelPaquete(p)
assert.equal(fichas.length, 2); assert.notEqual(fichas[0].id, 1, 'id nuevo para no chocar'); assert.equal(fichas[0].designacion, 'R.I.-1')
assert.deepEqual(sumarContenido(destino, { limites: [{ coords: 'mal' }, { centro: [1] }], coordinacion: [{ centro: ['x', 1] }] }), destino, 'lo inválido no entra')
const envio = { id: 'env-1', paquete: p }
const conFichas = recibirUnidades([{ id: 9, lat: 0, lng: 0 }], envio)
assert.equal(conFichas.length, 3); assert.equal(recibirUnidades(conFichas, envio), conFichas, 'una sola vez por envío')

// 9 · El servidor arma el envío con el contenido sólo si se lo piden.
const payload = { nombre: 'FABBLE', ops: ops2, unidades, documentos: [], planFuegos: { secreto: true } }
const env = construirPaquete(payload, ['ce'], { contenido: true, enemigo: false, operacion: true })
assert.equal(env.contenido.unidades.length, 1); assert.equal(env.contenido.ops.limites.length, 2)
assert.equal(env.planFuegos, undefined); assert.equal(env.areas[0].escalon, 'cuerpo')
assert.equal(construirPaquete(payload, ['ce'], {}).contenido, undefined)

console.log('Lazo: zonas exactas por los límites (sin huecos), lazo tosco y libre, Cuerpo → Divisiones, contenido del área, paquete, importación y servidor OK.')
