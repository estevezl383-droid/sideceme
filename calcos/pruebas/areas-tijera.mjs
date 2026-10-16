// ✂️ La tijera (16-10-2026): el área por los límites de las unidades y lo que se entrega cortado por
// donde pasó el lazo. FABBLE ficticio armado como el FABBLE 1.1 de Sergio (frontera dentada al oeste,
// franja de la frontera, dos Cuerpos, franja de la FF.TT. al este, brigadas rojas afuera).
//   node calcos/pruebas/areas-tijera.mjs
import assert from 'node:assert/strict'
import { repartir, recortarContenido, resumenContenido, simplificarLazo, capasCmocVisibles, escalonDelBorde, cortarLinea, regionTijera } from '../areas-operaciones/recorte.mjs'
import { recortarArea, guardarSeleccion, paqueteSeleccion, listarAreas, vistaLimpia } from '../areas-operaciones/modelo.mjs'
import { construirPaquete, recibirTerreno, recibirAoi } from '../areas-operaciones/compartir-modelo.mjs'
import { ejercicioDeArchivo } from '../areas-operaciones/abrir-archivo.mjs'

const minLat = c => Math.min(...c.map(p => p[1])), maxLat = c => Math.max(...c.map(p => p[1]))
const casi = (a, b, tol, msj) => assert.ok(Math.abs(a - b) <= tol, `${msj}: ${a} ≠ ${b} (±${tol})`)

const contorno = [[-65.1, -16.975], [-64.99, -16.975], [-64.99, -17.055], [-65.1, -17.055], [-65.106, -17.035], [-65.097, -17.015], [-65.105, -16.995]]
const fabble = { id: 'ao-fabble', nombre: 'FABBLE', coords: contorno, operacion: 'DEFENSA', tipo: 'defensiva' }
const limites = [
  { coords: [[-65.109, -17.012], [-65.07, -17.01], [-65.04, -17.016], [-65.005, -17.012]], escalon: 'cuerpo', tipo: 'magnitud' },
  { coords: [[-65.088, -16.97], [-65.086, -17.0], [-65.083, -17.03], [-65.085, -17.058]], escalon: 'cuerpo', tipo: 'simple' },
  { coords: [[-65.005, -16.97], [-65.006, -17.0], [-65.004, -17.03], [-65.005, -17.058]], escalon: 'cuerpo', tipo: 'simple' },
  { coords: [[-65.06, -16.99], [-65.05, -16.985]], tipo: 'flecha' },
  { coords: [[-65.045, -17.02], [-65.035, -17.02], [-65.035, -17.03], [-65.045, -17.03], [-65.045, -17.02]], tipo: 'punteada', nombre: 'AE-2', origen: 'ogo-ia' },
]
const ops = {
  areaOps: fabble, areasOps: [fabble], limites,
  magnitudes: [{ centro: [-65.055, -17.013], escalon: 'cuerpo', origen: 'limite-0' }, { centro: [-65.0045, -17.04], escalon: 'cuerpo' }],
  coordinacion: [{ centro: [-65.0846, -17.0103] }, { centro: [-65.005, -17.012] }, { centro: [-65.085, -17.055] }],
  objetivos: [{ centro: [-65.12, -16.99], clase: 'final' }], ains: [{ centro: [-65.05, -16.99] }],
}
const unidades = [
  { id: 'ce-arriba', bando: 'propias', lat: -16.99, lng: -65.05 }, { id: 'ce-abajo', bando: 'propias', lat: -17.035, lng: -65.05 },
  { id: 'fftt', bando: 'propias', lat: -17.0, lng: -64.996 }, { id: 'br-iii', bando: 'enemigo', lat: -16.99, lng: -65.125 },
  { id: 'br-vi', bando: 'enemigo', lat: -17.045, lng: -65.125 }, { id: 'atras', bando: 'propias', lat: -16.99, lng: -64.985 },
]
const cmoc = { corredoresClandestinos: [{ coords: [[-65.06, -16.985], [-65.03, -16.99]] }, { coords: [[-65.06, -17.04], [-65.03, -17.045]] }],
  avenidas: [{ nom: 'AA-1', coords: [[-65.13, -16.99], [-65.05, -16.995], [-65.05, -17.04]], poligono: { type: 'Polygon', coordinates: [[[-65.13, -16.985], [-65.045, -16.99], [-65.045, -17.045], [-65.055, -17.045], [-65.055, -17.0], [-65.13, -16.995], [-65.13, -16.985]]] } }],
  ae: [{ centro: [-65.02, -17.012], coords: [[-65.03, -17.0], [-65.01, -17.0], [-65.01, -17.025], [-65.03, -17.025], [-65.03, -17.0]] }] }
const fc = features => ({ type: 'FeatureCollection', features })
const resultados = {
  comunicaciones: { fc: fc([{ type: 'Feature', _capaId: 'comunicaciones_vias', geometry: { type: 'LineString', coordinates: [[-65.06, -16.98], [-65.06, -17.05]] }, properties: {} }]), total: 1, porCapa: { comunicaciones_vias: 1, comunicaciones_ffcc: 0 }, _googleEarth: { n: 1 } },
  poblaciones: { fc: fc([
    { type: 'Feature', _capaId: 'poblaciones_puntos', geometry: { type: 'Point', coordinates: [-65.045, -16.995] }, properties: {} },
    { type: 'Feature', _capaId: 'poblaciones_puntos', geometry: { type: 'Point', coordinates: [-65.045, -17.04] }, properties: {} },
    { type: 'Feature', _capaId: 'poblaciones_areas', geometry: { type: 'MultiPolygon', coordinates: [[[[-65.07, -16.98], [-65.068, -16.98], [-65.068, -16.982], [-65.07, -16.982], [-65.07, -16.98]]], [[[-65.07, -17.05], [-65.068, -17.05], [-65.068, -17.048], [-65.07, -17.048], [-65.07, -17.05]]]] }, properties: {} },
  ]), total: 3, porCapa: { poblaciones_puntos: 2, poblaciones_areas: 1 } },
  hidrografico: { fc: fc([{ type: 'Feature', _capaId: 'hidro_lineas', geometry: { type: 'LineString', coordinates: [[-65.06, -16.98], [-65.06, -16.99]] }, properties: {} }]), total: 1, porCapa: { hidro_lineas: 1 } },
}
// Un lazo tosco: el Cuerpo de arriba, pasándose 3 km al de abajo, hasta la Br. III (afuera, al oeste).
const lazo = [[-65.135, -16.97], [-64.998, -16.97], [-64.998, -17.025], [-65.135, -17.025]]

// 1 · El área: por los límites, con la franja de la frontera; un toque la saca y otro la vuelve a sumar.
const r = repartir([fabble], limites, { lazo })
assert.equal(r.ok, true, r.error); assert.equal(r.piezas, 2)
casi(minLat(r.coords), -17.016, 1e-9, 'llega hasta el límite entre los Cuerpos')
assert.equal(r.zonas.length, 5, 'las cinco zonas para la vista previa'); assert.equal(r.zonas.filter(z => z.elegida).length, 2)
const sinFranja = repartir([fabble], limites, { lazo, toques: [[-65.095, -16.99]] })
assert.equal(sinFranja.piezas, 1, 'el toque saca la franja')
assert.equal(repartir([fabble], limites, { lazo, toques: [[-65.095, -16.99], [-65.095, -16.99]] }).piezas, 2, 'otro toque la vuelve a sumar')
assert.equal(repartir([fabble], limites, { lazo, toques: [[-65.05, -17.04]] }).piezas, 3, 'un toque suma el Cuerpo de abajo')
const vacio = repartir([fabble], limites, { lazo, toques: [[-65.095, -16.99], [-65.05, -16.99]] })
assert.equal(vacio.ok, false); assert.equal(vacio.zonas.length, 5, 'sin zonas elegidas se siguen viendo las zonas para volver a tocar')
assert.equal(escalonDelBorde(r.coords, limites), 'cuerpo', 'el escalón sale de los límites que la rodean')
assert.equal(recortarArea(ops, { lazo }, { escalon: 'division' }).area.nombre, 'CE-I', 'y el nombre también (no la magnitud del panel)')

// 2 · Lo que entrega: cortado por donde pasó el lazo; dentro de FABBLE sólo lo del Cuerpo.
const tijera = { area: r.coords, lazo, areas: [contorno] }
const c = recortarContenido(tijera, { ops, unidades, cmoc, resultados, vista: { calcos: ['comunicaciones', 'poblaciones'] } })
const L = c.ops.limites
const oeste = L.find(l => l.tipo === 'simple' && l.coords[0][0] < -65.08), este = L.find(l => l.tipo === 'simple' && l.coords[0][0] > -65.01)
casi(minLat(oeste.coords), -17.01081, 5e-5, 'la línea del oeste se corta en el límite entre los Cuerpos (no sigue al de abajo)')
casi(maxLat(oeste.coords), -16.97, 1e-9, 'afuera de FABBLE, hasta donde llega el lazo')
casi(minLat(este.coords), -17.012, 5e-5, 'la del este, también')
const lim0 = L.find(l => l.tipo === 'magnitud')
casi(Math.min(...lim0.coords.map(p => p[0])), -65.109, 1e-9, 'el límite entre los Cuerpos entero (corre por el borde y sale al frente enemigo dentro del lazo)')
assert.ok(L.some(l => l.tipo === 'flecha'), 'la flecha de adentro, entera')
assert.ok(!L.some(l => l.nombre === 'AE-2'), 'el AE de la IA del Cuerpo de abajo no va')
assert.deepEqual(c.unidades.map(u => u.id).sort(), ['br-iii', 'ce-arriba'], 'el Cuerpo de arriba y la brigada roja del lazo')
assert.deepEqual(c.ops.magnitudes.map(m => m.origen), ['limite-0'], 'la marca del límite sigue a su pedazo; la del fondo de la línea del este no va')
assert.equal(c.ops.magnitudes[0].origen, `limite-${L.indexOf(lim0)}`)
assert.deepEqual(c.ops.coordinacion.map(p => p.centro[1]).sort((a, b) => a - b), [-17.012, -17.0103], 'los puntos del borde, no el del fondo')
assert.equal(c.ops.objetivos.length, 1, 'el objetivo del frente enemigo que encierra el lazo')
assert.equal(c.cmoc.corredoresClandestinos.length, 1, 'sólo el clandestino de arriba')
const aa = c.cmoc.avenidas
assert.equal(aa.length, 1, 'la avenida, cortada en un pedazo (de afuera hasta el límite)')
casi(minLat(aa[0].coords), -17.014, 5e-5, 'la avenida se corta en el límite de los Cuerpos')
assert.ok(aa[0].poligono && aa[0].poligono.type === 'Polygon', 'con su polígono cortado')
assert.ok(minLat(aa[0].poligono.coordinates[0]) > -17.017, 'que no entra al Cuerpo de abajo')
assert.equal(c.cmoc.ae.length, 1); casi(minLat(c.cmoc.ae[0].coords), -17.01486, 5e-5, 'el área de empeño que cruza el límite, cortada')
casi(minLat(c.resultados.comunicaciones.fc.features[0].geometry.coordinates), -17.012, 5e-5, 'el camino se corta en el límite')
assert.deepEqual(c.resultados.comunicaciones.porCapa, { comunicaciones_vias: 1, comunicaciones_ffcc: 0 })
assert.deepEqual(c.resultados.comunicaciones._googleEarth, { n: 1 }, 'lo demás del calco se conserva')
assert.equal(c.resultados.poblaciones.total, 2, 'la población de arriba y el área poblada de arriba')
assert.equal(c.resultados.poblaciones.fc.features.find(f => f._capaId === 'poblaciones_areas').geometry.type, 'Polygon', 'del MultiPolygon queda el de arriba')
assert.deepEqual(c.resultados.poblaciones.porCapa, { poblaciones_puntos: 1, poblaciones_areas: 1 })
assert.equal(c.resultados.hidrografico, undefined, 'un calco apagado no va')
assert.match(resumenContenido(c), /1 ficha\(s\) enemiga\(s\)[\s\S]*1 elemento\(s\) del calco de comunicaciones · 2 elemento\(s\) del calco de poblaciones/)

// 3 · Lo que está apagado no va: las fichas rojas, los objetivos, un calco, los clandestinos de la barra.
const apagado = recortarContenido(tijera, { ops, unidades, cmoc, resultados, vista: { verCapa: { unidadesRojo: false, objetivos: false, avenidas: false }, clandestinos: false, calcos: [] } })
assert.deepEqual(apagado.unidades.map(u => u.id), ['ce-arriba'])
assert.equal(apagado.ops.objetivos.length, 0); assert.equal(apagado.cmoc.avenidas, undefined); assert.equal(apagado.cmoc.corredoresClandestinos, undefined)
assert.deepEqual(apagado.resultados, {})
assert.deepEqual(capasCmocVisibles(cmoc, { corredoresClandestinos: false }), ['ae', 'avenidas'], 'la tecla de los clandestinos de «Qué se ve»')
assert.equal(recortarContenido(tijera, { ops, unidades, vista: {}, enemigo: false }).unidades.some(u => u.id === 'br-iii'), false, 'sin «También las fichas enemigas»')

// 4 · Un toque (sin lazo): la región es el área, nada de afuera.
const toque = repartir([fabble], limites, { punto: [-65.05, -16.99] })
const ct = recortarContenido({ area: toque.coords, lazo: null, areas: [contorno] }, { ops, unidades, cmoc, vista: {} })
assert.deepEqual(ct.unidades.map(u => u.id), ['ce-arriba'], 'sin lazo no entra la brigada de afuera')
casi(maxLat(ct.ops.limites.find(l => l.tipo === 'simple' && l.coords[0][0] < -65.08).coords), -16.975, 1e-6, 'la línea se corta en el borde de FABBLE')

// 5 · Cortar una línea que entra y sale del área varias veces: un pedazo por cada tramo adentro.
const R = regionTijera({ area: [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1]], lazo: null })
const zigzag = cortarLinea(R, [[-0.05, 0.02], [0.05, 0.02], [0.15, 0.04], [0.05, 0.06], [-0.05, 0.08]])
assert.equal(zigzag.length, 2, 'dos tramos adentro')
assert.equal(simplificarLazo(Array.from({ length: 400 }, (_, i) => [Math.cos(i / 400 * 2 * Math.PI) * 0.3, Math.sin(i / 400 * 2 * Math.PI) * 0.15])).length < 80, true, 'el trazo se simplifica')

// 6 · La selección guardada con la tijera y su JSON: lo cortado, los calcos y el lazo como Área de Interés.
const corte = recortarArea(ops, { lazo }, { id: 'ao-ce1' })
const g = guardarSeleccion(corte.ops, { areaId: 'ao-ce1', nombre: 'CE-I', opciones: {}, tijera: { lazo, vista: { verCapa: { unidadesRojo: true, avenidas: false, 'x y': false }, calcos: 'comunicaciones' } }, id: 'sel-1', ahora: '2026-10-16T12:00:00.000Z' })
assert.deepEqual(g.seleccion.tijera.vista, { verCapa: { avenidas: false }, clandestinos: true, calcos: ['comunicaciones'] }, 'sólo lo apagado y los calcos prendidos')
assert.deepEqual(vistaLimpia({ calcos: ['a', '<x>'] }).calcos, ['a'])
const pq = paqueteSeleccion(g.ops, g.seleccion, 'FABBLE', { unidades, cmoc, resultados })
assert.equal(pq.seleccion.tijera, true); assert.equal(pq.areas[0].nombre, 'CE-I')
assert.deepEqual(pq.contenido.unidades.map(u => u.id).sort(), ['br-iii', 'ce-arriba'])
assert.deepEqual(Object.keys(pq.contenido.resultados), ['comunicaciones']); assert.deepEqual(pq.contenido.calcosVer, ['comunicaciones'])
assert.equal(pq.contenido.cmoc.avenidas, undefined, 'la tecla apagada al cortar')
assert.deepEqual(pq.aoi.geometry.coordinates[0][0], pq.aoi.geometry.coordinates[0].at(-1), 'el Área de Interés cerrada')
// Lo de adentro se toma como está AHORA: una ficha nueva del Cuerpo de arriba también va.
assert.ok(paqueteSeleccion(g.ops, g.seleccion, 'FABBLE', { unidades: [...unidades, { id: 'nueva', bando: 'propias', lat: -16.98, lng: -65.04 }] }).contenido.unidades.some(u => u.id === 'nueva'))

// 7 · 📂 Abrir archivo JSON: ejercicio nuevo con los calcos, el Área de Interés y qué calcos prender.
const ab = ejercicioDeArchivo(JSON.parse(JSON.stringify(pq)), { archivo: 'Seleccion_CE-I.json', opsVacias: { limites: [], areaOps: null }, cmocVacio: { ae: [] } })
assert.equal(ab.ok, true, ab.error)
assert.deepEqual(Object.keys(ab.datos.resultados), ['comunicaciones']); assert.deepEqual(ab.calcosVer, ['comunicaciones'])
assert.equal(ab.datos.aoi.geometry.type, 'Polygon'); assert.equal(ab.datos.aoPuntos.length, lazo.length)
assert.match(ab.resumen, /calco de comunicaciones/)
const roto = ejercicioDeArchivo({ ...JSON.parse(JSON.stringify(pq)), aoi: { geometry: { type: 'Polygon', coordinates: [[[0, 0]]] } }, contenido: { ...pq.contenido, resultados: { '<x>': {}, malo: { fc: { features: [{ geometry: { type: 'Nada' } }] } } } } }, { opsVacias: { limites: [], areaOps: null }, cmocVacio: {} })
assert.equal(roto.ok, true); assert.equal(roto.datos.resultados, undefined, 'calcos inválidos no entran'); assert.equal(roto.datos.aoi, undefined)

// 8 · El servidor (compartir al ciclo o al paralelo) corta igual, y si los calcos no entran en 2 MB van sin ellos.
const payload = { ops: g.ops, unidades, cmoc, resultados, nombre: 'FABBLE' }
const srv = construirPaquete(payload, ['ao-ce1'], { contenido: true, enemigo: true, cmoc: true, tijera: g.seleccion.tijera })
assert.deepEqual(srv.contenido.unidades.map(u => u.id).sort(), ['br-iii', 'ce-arriba'])
casi(minLat(srv.contenido.ops.limites.find(l => l.tipo === 'simple' && l.coords[0][0] < -65.08).coords), -17.01081, 5e-5, 'el servidor corta las líneas igual')
assert.deepEqual(Object.keys(srv.contenido.resultados), ['comunicaciones']); assert.ok(srv.aoi)
const enorme = { ...resultados, comunicaciones: { ...resultados.comunicaciones, fc: fc(Array.from({ length: 4000 }, (_, i) => ({ type: 'Feature', _capaId: 'comunicaciones_vias', geometry: { type: 'LineString', coordinates: Array.from({ length: 30 }, (_, k) => [-65.08 + k * 0.001, -16.98 - i * 0.000005]) }, properties: { relleno: 'x'.repeat(40) } }))) } }
const grande = construirPaquete({ ...payload, resultados: enorme }, ['ao-ce1'], { contenido: true, tijera: g.seleccion.tijera })
assert.equal(grande.calcosFuera, true); assert.equal(grande.contenido.resultados, undefined, 'sin los calcos, pero con lo demás')
assert.ok(grande.contenido.unidades.length)
const viejo = construirPaquete(payload, ['ao-ce1'], { contenido: true, enemigo: true })
assert.ok(!viejo.contenido.unidades.some(u => u.id === 'br-iii'), 'sin la tijera, como antes (sólo lo de adentro del área)')

// 9 · Incorporar al ejercicio: los calcos que no tiene y el Área de Interés si no tiene la suya.
const envio = { id: 'e1', paquete: srv }
assert.deepEqual(Object.keys(recibirTerreno(null, envio)), ['comunicaciones'])
const suyos = { comunicaciones: { fc: fc([]), total: 0 } }
assert.equal(recibirTerreno(suyos, envio), suyos, 'no pisa los calcos que ya tiene')
assert.equal(recibirAoi(null, envio).geometry.type, 'Polygon')
const mia = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } }
assert.equal(recibirAoi(mia, envio), mia, 'no pisa su Área de Interés')

console.log('Tijera: el área por los límites (con toques para sumar o quitar zonas y el nombre por los límites), lo de adentro cortado por donde pasó el lazo sin mezclarse con el Cuerpo vecino, la brigada roja y el objetivo de afuera del lazo, sólo lo que se ve (fichas, CMOC, clandestinos, calcos del terreno), el JSON con los calcos y el lazo como Área de Interés, el servidor y la recepción OK.')
