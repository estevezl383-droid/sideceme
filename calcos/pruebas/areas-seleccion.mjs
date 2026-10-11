// 💾 Selecciones guardadas, el CMOC de adentro y el lazo que no corta por las medidas (11-10-2026).
//   node calcos/pruebas/areas-seleccion.mjs
import assert from 'node:assert/strict'
import { repartir, esMedida, cmocDeAreas, sumarCmoc, capasCmocVisibles, resumenContenido } from '../areas-operaciones/recorte.mjs'
import { listarAreas, guardarSeleccion, listarSelecciones, borrarSeleccion, paqueteSeleccion, opsConSeleccion, quitarArea, paqueteAreas } from '../areas-operaciones/modelo.mjs'
import { construirPaquete, recibirCmoc } from '../areas-operaciones/compartir-modelo.mjs'

const km2 = c => {
  const kx = 111.32 * Math.cos(-18.4 * Math.PI / 180), ky = 110.57
  let s = 0
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) s += c[j][0] * kx * c[i][1] * ky - c[i][0] * kx * c[j][1] * ky
  return Math.abs(s / 2)
}
const casi = (a, b, tol, msj) => assert.ok(Math.abs(a - b) <= tol, `${msj}: ${a} ≠ ${b} (±${tol})`)

// FABBLE en tres Cuerpos, cruzada por una línea de fase de la IA y con un AE-1 de la IA en el este.
const F = { id: 'f', nombre: 'FABBLE', coords: [[-68, -18], [-67, -18], [-67, -19], [-68, -19]], operacion: 'DEFENSA' }
const limites = [
  { coords: [[-67.66, -17.95], [-67.66, -19.05]], escalon: 'cuerpo', tipo: 'magnitud' },
  { coords: [[-67.33, -17.95], [-67.33, -19.05]], escalon: 'cuerpo', tipo: 'magnitud' },
  { coords: [[-68, -18.3], [-67, -18.3]], tipo: 'simple', nombre: 'LF ALFA', origen: 'ogo-ia' },
  { coords: [[-67.25, -18.6], [-67.1, -18.6], [-67.1, -18.75], [-67.25, -18.75], [-67.25, -18.6]], tipo: 'punteada', nombre: 'AE-1', origen: 'ogo-ia' },
]

// 1 · Las medidas de coordinación no reparten el área.
assert.equal(esMedida(limites[0]), false, 'un límite con magnitud corta')
assert.equal(esMedida(limites[2]), true, 'la línea de fase de la IA no corta')
assert.equal(esMedida(limites[3]), true, 'el AE de la IA no corta')
assert.equal(esMedida({ coords: [[0, 0], [1, 1]], tipo: 'simple' }), false, 'una línea simple sin nombre sigue cortando (como antes)')
assert.equal(esMedida({ coords: [[0, 0], [1, 0], [1, 1], [0, 0]], tipo: 'punteada' }), true, 'un contorno punteado cerrado no corta')
const tercio = km2([[-68, -18], [-67.66, -18], [-67.66, -19], [-68, -19]])
const oeste = repartir([F], limites, { punto: [-67.8, -18.5] })
assert.equal(oeste.ok, true); assert.equal(oeste.piezas, 1)
casi(km2(oeste.coords), tercio, 1, 'el clic toma la zona del Cuerpo entera, no hasta la línea de fase')
const este = repartir([F], limites, { lazo: [[-67.4, -17.9], [-66.9, -17.9], [-66.9, -19.1], [-67.4, -19.1]] })
assert.equal(este.piezas, 1, 'una sola zona («3 zonas unidas» era la LF y el AE cortando)')

// 2 · Lo que ya es de otro Cuerpo cortado no se repite.
const centro = repartir([F], limites, { punto: [-67.5, -18.5] })
const areas = [F, { id: 'a1', nombre: 'CE-I', coords: oeste.coords }, { id: 'a2', nombre: 'CE-II', coords: centro.coords }]
const tosco = repartir(areas, limites, { lazo: [[-67.6, -17.9], [-66.9, -17.9], [-66.9, -19.1], [-67.6, -19.1]] })
assert.equal(tosco.ok, true); assert.deepEqual(tosco.dejadas, ['CE-II']); assert.deepEqual(tosco.encima, [])
casi(km2(tosco.coords), km2(este.coords), 1, 'el lazo tosco que tapa el CE-II deja afuera lo del CE-II')
const sobre = repartir([F, { id: 'a1', nombre: 'CE-I', coords: oeste.coords }], limites, { lazo: [[-68.1, -17.9], [-67.7, -17.9], [-67.7, -19.1], [-68.1, -19.1]] })
assert.equal(sobre.baseNombre, 'CE-I', 'el lazo dentro del CE-I lo reparte a él (en Divisiones)')

// 3 · El CMOC de adentro, sólo de las capas a la vista.
const cmoc = {
  ae: [{ coords: [[-67.2, -18.4], [-67.1, -18.4], [-67.1, -18.5], [-67.2, -18.5]], centro: [-67.15, -18.45] }, { coords: [[-67.9, -18.4], [-67.8, -18.4], [-67.8, -18.5]], centro: [-67.85, -18.45] }],
  clave: [{ centro: [-67.2, -18.2], etiqueta: 'C1' }, { centro: [-67.9, -18.2] }],
  avenidas: [{ coords: [[-66.5, -18.5], [-67.2, -18.5]], nombre: 'AA-1' }],
  restringido: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-67.3, -18.8], [-67.05, -18.8], [-67.05, -18.95], [-67.3, -18.95], [-67.3, -18.8]]] } }],
  severo: [],
}
const areaEste = { id: 'e', nombre: 'CE-III', coords: este.coords }
const todo = cmocDeAreas([areaEste], cmoc)
assert.deepEqual(Object.keys(todo).sort(), ['ae', 'avenidas', 'clave', 'restringido'])
assert.equal(todo.ae.length, 1); assert.equal(todo.clave[0].etiqueta, 'C1')
assert.deepEqual(Object.keys(cmocDeAreas([areaEste], cmoc, ['ae'])), ['ae'], 'sólo las capas pedidas')
assert.deepEqual(capasCmocVisibles(cmoc, { restringido: false, avenidas: false }), ['ae', 'clave'], 'lo apagado en «Qué se ve en el calco» no va')
assert.match(resumenContenido({ ops: {}, unidades: [], cmoc: todo }), /1 área\(s\) de empeño \(CMOC\).*1 zona\(s\) restringida\(s\) \(CMOC\)/)
const recibido = sumarCmoc({ ae: [{ coords: [[0, 0], [1, 0], [1, 1]] }] }, todo, 'envio-1')
assert.equal(recibido.ae.length, 2); assert.equal(recibido.ae[1].envioAreas, 'envio-1')
assert.equal(sumarCmoc(recibido, todo, 'envio-1'), recibido, 'una sola vez por envío')
assert.equal(sumarCmoc({}, { ae: [{ coords: 'mal' }, null, 7] }).ae, undefined, 'lo inválido no entra')

// 4 · 💾 Guardar selección como área: el nombre, el contorno idéntico y lo que estaba activo.
const ops = { areaOps: { ...F }, areasOps: [{ ...F }, { id: 'ao-3', nombre: 'Área 2', coords: este.coords, escalon: 'cuerpo', origen: { recorte: 'f' } }], limites, entregasAreas: [] }
const unidades = [{ id: 'u1', lat: -18.5, lng: -67.2, bando: 'propias' }, { id: 'r1', lat: -18.6, lng: -67.15, bando: 'enemigo' }, { id: 'u2', lat: -18.5, lng: -67.8, bando: 'propias' }]
assert.throws(() => guardarSeleccion(ops, { areaId: 'no-esta', nombre: 'X' }), /ya no está/)
assert.throws(() => guardarSeleccion(ops, { areaId: 'ao-3', nombre: '  ' }), /nombre/)
const g = guardarSeleccion(ops, { areaId: 'ao-3', nombre: 'CE-III', opciones: { contenido: true, enemigo: true, cmoc: true }, capasCmoc: ['ae', 'clave'], id: 'sel-1', ahora: '2026-10-11T22:00:00.000Z' })
assert.equal(listarAreas(g.ops).find(a => a.id === 'ao-3').nombre, 'CE-III', 'el área toma el nombre')
assert.equal(listarAreas(g.ops).find(a => a.id === 'ao-3').unidad, 'CE-III')
assert.deepEqual(g.seleccion.coords, este.coords, 'idéntica a lo que se recortó')
assert.deepEqual(listarSelecciones(g.ops).map(s => s.nombre), ['CE-III'])
const otra = guardarSeleccion(g.ops, { areaId: 'ao-3', nombre: 'CE-III', opciones: { enemigo: false }, id: 'sel-2' })
assert.deepEqual(listarSelecciones(otra.ops).map(s => s.id), ['sel-2'], 'guardar otra vez la misma la reemplaza')
assert.deepEqual(borrarSeleccion(g.ops, 'sel-1').selecciones, [])

// 5 · Su JSON: el contorno guardado aunque el área de la carta se haya movido, con lo de adentro y el CMOC.
const movida = { ...g.ops, areasOps: listarAreas(g.ops).map(a => a.id === 'ao-3' ? { ...a, coords: a.coords.map(([x, y]) => [x - 0.2, y]) } : a) }
const p = paqueteSeleccion(movida, g.seleccion, 'FABBLE', { unidades, cmoc })
assert.deepEqual(p.areas[0].coords, este.coords, 'va el contorno guardado')
assert.equal(p.seleccion.nombre, 'CE-III')
assert.deepEqual(p.contenido.unidades.map(u => u.id).sort(), ['r1', 'u1'])
assert.deepEqual(Object.keys(p.contenido.cmoc).sort(), ['ae', 'clave'], 'el CMOC de las capas que estaban a la vista')
assert.ok(p.contenido.ops.limites.some(l => l.nombre === 'AE-1') && p.contenido.ops.limites.some(l => l.nombre === 'LF ALFA'), 'las medidas de adentro van')
const sinArea = quitarArea(g.ops, 'ao-3')
assert.equal(listarAreas(sinArea).some(a => a.id === 'ao-3'), false)
assert.ok(listarAreas(opsConSeleccion(sinArea, g.seleccion)).some(a => a.id === 'ao-3'), 'si el área se borró, la selección la repone con su contorno')
assert.equal(paqueteAreas(g.ops, ['ao-3'], 'x', { unidades, enemigo: false, cmoc: null }).contenido.cmoc, undefined, 'sin CMOC si no se pide')

// 6 · El servidor (construirPaquete): el CMOC sólo si lo pide el cliente nuevo, y de las capas que dice.
const payload = { ops: opsConSeleccion(g.ops, g.seleccion), unidades, cmoc, nombre: 'FABBLE' }
assert.equal(construirPaquete(payload, ['ao-3'], { contenido: true }).contenido.cmoc, undefined, 'un cliente viejo no recibe el CMOC')
const conCmoc = construirPaquete(payload, ['ao-3'], { contenido: true, cmoc: true, capasCmoc: ['ae'] })
assert.deepEqual(Object.keys(conCmoc.contenido.cmoc), ['ae'])
assert.equal(construirPaquete(payload, ['ao-3'], { contenido: true, cmoc: true }).contenido.cmoc, undefined, 'sin capas, nada del CMOC')
assert.equal(conCmoc.selecciones, undefined); assert.equal(JSON.stringify(conCmoc).includes('"selecciones"'), false, 'las selecciones del profesor no viajan')
const envio = { id: 'e-1', paquete: conCmoc }
const c1 = recibirCmoc({ ae: [] }, envio)
assert.equal(c1.ae.length, 1); assert.equal(recibirCmoc(c1, envio), c1, 'recibirCmoc una sola vez por envío')

console.log('Selecciones: el lazo no corta por la LF ni el AE de la IA, no se encima con los Cuerpos ya cortados, el CMOC a la vista va con el área, «Guardar selección» la deja idéntica con su nombre y lo activo, su JSON y el servidor OK.')
