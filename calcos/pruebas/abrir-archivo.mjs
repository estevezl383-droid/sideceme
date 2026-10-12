// 📂 Abrir el JSON de la Mesa como ejercicio nuevo (12-10-2026).
//   node calcos/pruebas/abrir-archivo.mjs
import assert from 'node:assert/strict'
import { ejercicioDeArchivo, nombreLibre, nombreDeArchivo, encuadrar } from '../areas-operaciones/abrir-archivo.mjs'
import { paqueteAreas } from '../areas-operaciones/modelo.mjs'

const Vt = { limites: [], coordinacion: [], pasaje: [], tareas: [], magnitudes: [], areaOps: null }
const an = { restringido: [], severo: [], clave: [], defensivo: [], ae: [], corredores: [], avenidas: [], desplazamientos: [] }
const area = { id: 'ao-ce1', nombre: 'CE-I', coords: [[-65.1, -16.98], [-65.0, -16.98], [-65.0, -17.05], [-65.1, -17.05]] }
const ops = { ...Vt, areaOps: area, limites: [{ coords: [[-65.06, -16.97], [-65.06, -17.06]], tipo: 'magnitud' }], coordinacion: [{ centro: [-65.06, -16.99] }] }
const unidades = [{ id: 'u1', bando: 'propias', lat: -17.0, lng: -65.05 }, { id: 'u2', bando: 'enemigo', lat: -17.01, lng: -65.02 }, { id: 'fuera', bando: 'propias', lat: -18, lng: -66 }]
const cmoc = { ae: [{ coords: [[-65.02, -17.0], [-65.01, -17.0], [-65.01, -17.01]], centro: [-65.015, -17.005] }] }
const p = paqueteAreas(ops, ['ao-ce1'], 'FABBLE', { unidades, enemigo: true, cmoc, capasCmoc: ['ae'] })
p.seleccion = { nombre: 'CE-I', guardada: '2026-10-11T23:48:04.825Z' }
p.documentos = [{ nombre: 'OGO.docx', texto: 'ORDEN' }, 'basura']

// 1 · La selección: ejercicio nuevo con el área, lo de adentro, el CMOC y los documentos.
const r = ejercicioDeArchivo(JSON.parse(JSON.stringify(p)), { archivo: 'Seleccion_CE-I.json', opsVacias: Vt, cmocVacio: an, sello: 't' })
assert.equal(r.ok, true); assert.equal(r.tipo, 'areas'); assert.equal(r.nombre, 'CE-I')
assert.equal(r.datos.ops.areaOps.nombre, 'CE-I'); assert.deepEqual(r.datos.ops.areaOps.coords, area.coords)
assert.equal(r.datos.ops.limites.length, 1); assert.equal(r.datos.ops.coordinacion.length, 1)
assert.deepEqual(r.datos.unidades.map(u => u.bando).sort(), ['enemigo', 'propias'], 'sólo las fichas de adentro')
assert.equal(r.datos.cmoc.ae.length, 1); assert.equal(r.datos.cmoc.restringido.length, 0)
assert.deepEqual(r.datos.documentos.map(d => d.nombre), ['OGO.docx'])
assert.equal(r.coords.length, 4); assert.match(r.resumen, /el área «CE-I» · .*1 documento\(s\)/)
assert.deepEqual(Vt.limites, [], 'no toca los vacíos de la Mesa')

// 2 · El ejercicio entero: sin candado; la carta va al Área de interés.
const aoi = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-65.2, -16.9], [-64.9, -16.9], [-64.9, -17.1], [-65.2, -16.9]]] } }
const e = ejercicioDeArchivo({ version: 1, nombre: 'DIAMANTE', ops, unidades, aoi, finalizado: true }, { archivo: 'EJERCICIO_DIAMANTE_2026-10-11_1948.json' })
assert.equal(e.ok, true); assert.equal(e.tipo, 'ejercicio'); assert.equal(e.nombre, 'DIAMANTE')
assert.equal(e.datos.finalizado, undefined); assert.equal(e.coords.length, 4)

// 3 · Lo que no se abre, con el aviso de dónde va.
assert.match(ejercicioDeArchivo({ hola: 1 }, { archivo: 'x.json' }).error, /no es de la Mesa/)
assert.match(ejercicioDeArchivo({ tipoArchivo: 'capa-em' }).error, /Integrar capa/)
assert.match(ejercicioDeArchivo({ tipoArchivo: 'base-pmtd' }).error, /BASE del G-3/)
assert.match(ejercicioDeArchivo({ tipoArchivo: 'sideceme-areas-operaciones', version: 1, areas: [] }, { archivo: 'a.json' }).error, /no contiene áreas/)
assert.equal(ejercicioDeArchivo([1, 2]).ok, false)

// 4 · Nombres.
assert.equal(nombreDeArchivo('Seleccion_CE-I (3).json'), 'CE-I')
assert.equal(nombreDeArchivo('EJERCICIO_FABBLE 1.1_2026-10-11_1948.json'), 'FABBLE 1.1')
assert.equal(nombreDeArchivo('Seleccion CE-II - para los alumnos.json'), 'CE-II')
assert.equal(nombreLibre('CE-I', ['ce-i']), 'CE-I (2)'); assert.equal(nombreLibre('A/B', []), 'A-B'); assert.equal(nombreLibre('', []), 'Ejercicio abierto')

// 5 · La carta 2D y la 3D van al área.
const llamadas = []
assert.equal(encuadrar(area.coords, { __mapa2d: { fitBounds: b => llamadas.push(['2d', b]) }, __map3d: { fitBounds: b => llamadas.push(['3d', b]) } }), true)
assert.deepEqual(llamadas, [['2d', [[-17.05, -65.1], [-16.98, -65.0]]], ['3d', [[-65.1, -17.05], [-65.0, -16.98]]]])
assert.equal(encuadrar([], {}), false)
console.log('abrir-archivo: la selección y el ejercicio entero se abren como ejercicio nuevo; lo ajeno avisa adónde va.')
