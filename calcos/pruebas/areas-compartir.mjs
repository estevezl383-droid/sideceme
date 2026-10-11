import assert from 'node:assert/strict'
import { construirPaquete, recibirPaquete, recibirDocumentos } from '../areas-operaciones/compartir-modelo.mjs'
import { compartir } from '../../supabase/espejo-ge/calco-ops/compartir.mjs'
const area = { id: 'uno', nombre: 'Zona Uno', coords: [[1,1],[2,1],[2,2]], unidad: 'Unidad', operacion: 'Práctica', datoPrivado: 'oculto' }
const payload = { nombre: 'Origen', ops: { areaOps: area }, documentos: [{ id: 'd', nombre: 'Guía' }], planFuegos: { secreto: true }, picb: { respuesta: true } }
const paquete = construirPaquete(payload, ['uno'], { unidad: false })
assert.deepEqual(Object.keys(paquete.areas[0]).sort(), ['coords','id','nombre'])
assert.deepEqual(paquete.documentos, [])
assert.equal(paquete.planFuegos, undefined)
assert.equal(paquete.picb, undefined)
const envio = { id: 'envio', nombre: 'Tarea', paquete: construirPaquete(payload, ['uno'], { documentos: true }) }
const previo = { areaOps: { ...area, id: 'previa' }, limites: [{ id: 'l' }] }
const recibido = recibirPaquete(previo, envio)
assert.equal(recibido.areasOps.length, 2)
assert.deepEqual(recibido.limites, previo.limites)
assert.equal(recibirPaquete(recibido, envio), recibido)
const docs = recibirDocumentos([{ nombre: 'Trabajo previo' }], envio)
assert.deepEqual(recibirDocumentos(docs, envio), docs)

const docente = { id: 'p1', tabla: 'profesores' }, alumno = { id: 'c1', tabla: 'cursantes' }
const tablas = { calcos: [{ id: 'origen', nombre: 'Origen', creado_por: 'p1', grupo_id: null, ejercicio_id: null, payload },
  { id: 'propio', nombre: 'Destino', creado_por: 'p1', grupo_id: null, ejercicio_id: null, payload: {} },
  { id: 'ajeno', creado_por: 'p2', grupo_id: null, ejercicio_id: null, payload: {} },
  { id: 'grupo', creado_por: 'c1', grupo_id: 'g1', ejercicio_id: 'e1', payload: {} },
  { id: 'otrogrupo', grupo_id: 'g2', ejercicio_id: 'e2', payload: {} }],
  ejercicio_grupos: [{ id: 'g1', nombre: 'Grupo 1', ejercicio_id: 'e1', activo: true, ejercicios: { nombre: 'Curso', estado: 'abierto' } }],
  calco_compartidos: [],
  cursantes: [{ id: 'c1', ciclo: '1ER CICLO', paralelo: 'A', activo: true }, { id: 'c2', ciclo: '1ER CICLO', paralelo: 'B', activo: true },
    { id: 'c3', ciclo: '2DO CICLO', paralelo: 'A', activo: null }, { id: 'c4', ciclo: '2DO CICLO', paralelo: 'C', activo: false }] }
class Consulta {
  constructor(tabla) { this.tabla = tabla; this.filtros = []; this.uno = false }
  select(c, op) { if (op && op.head) this.contar = true; return this }
  or(f) { if (/activo\.is\.null,activo\.eq\.true/.test(f)) this.filtros.push(x => x.activo == null || x.activo === true); return this }
  eq(k,v) { this.filtros.push(x => x[k] === v); return this }
  neq(k,v) { this.filtros.push(x => x[k] !== v); return this }
  is(k,v) { return this.eq(k,v) }
  order() { return this }
  limit() { return this }
  maybeSingle() { this.uno = true; return this }
  single() { this.uno = true; return this }
  insert(d) { this.d = d; return this }
  then(resolve,reject) {
    if (this.d) tablas[this.tabla].push({ ...this.d, id: 'nuevo-envio-' + tablas[this.tabla].length, creado_en: '2026-10-11T12:0' + tablas[this.tabla].length + ':00Z' })
    const filas = tablas[this.tabla].filter(x => this.filtros.every(f => f(x)))
    if (this.contar) return Promise.resolve({ count: filas.length, error: null }).then(resolve,reject)
    return Promise.resolve({ data: this.uno ? filas.at(-1) || null : filas, error: null }).then(resolve,reject)
  }
}
const deps = { sb: { from: t => new Consulta(t) }, esDocente: s => s.tabla === 'profesores',
  puedeTocar: async(s,c) => s.tabla === 'profesores' ? (!c.grupo_id && c.creado_por !== s.id ? 'Ajeno' : null) : (c.grupo_id === 'g1' && c.ejercicio_id === 'e1' ? null : 'Ajeno'),
  ventanaAbierta: async e => e === 'e1' ? null : 'Cerrado', ok: x => ({ ok: true, ...x }), err: (error,status=400) => ({ ok: false,error,status }) }
const enviar = { accion: 'areas_enviar', calco_id: 'origen', nombre: 'Paquete', areas: ['uno'], destino: { calco_id: 'propio' }, opciones: {} }
assert.equal((await compartir(enviar, docente, deps)).ok, true)
assert.equal(tablas.calcos[1].payload.ops, undefined, 'Enviar no modifica el destino')
assert.equal((await compartir({ ...enviar, destino: { calco_id: 'ajeno' } }, docente, deps)).status, 403)
assert.equal((await compartir({ ...enviar, calco_id: 'ajeno' }, docente, deps)).status, 403)
assert.equal((await compartir({ ...enviar, calco_id: 'grupo' }, alumno, deps)).status, 403)
assert.equal((await compartir({ ...enviar, areas: ['inexistente'] }, docente, deps)).ok, false)
assert.equal((await compartir({ ...enviar, destino: { grupo_id: 'g1', ejercicio_id: 'e2' } }, docente, deps)).status, 403)
assert.equal((await compartir({ ...enviar, destino: { grupo_id: 'g1', ejercicio_id: 'e1' } }, docente, deps)).ok, true)
assert.equal((await compartir({ accion: 'areas_recibidos', calco_id: 'grupo' }, alumno, deps)).envios.length, 1)
assert.equal((await compartir({ accion: 'areas_recibidos', calco_id: 'otrogrupo' }, alumno, deps)).status, 403)
assert.equal((await compartir({ accion: 'areas_recibidos', calco_id: 'propio' }, docente, deps)).envios.length, 1)
assert.equal(await compartir({ accion: 'guardar' }, docente, deps), null)

// ── 11-10-2026: por CICLO o por PARALELO, y el ejercicio tal como está en la Mesa del profesor ──
const dest = (await compartir({ accion: 'areas_destinos', calco_id: 'origen' }, docente, deps)).destinos
assert.deepEqual(dest.filter(d => d.tipo === 'ciclo').map(d => d.nombre), ['Todo el 1ER CICLO (2 cursantes)', 'Todo el 2DO CICLO (1 cursantes)'], 'los ciclos de los cursantes activos (el inactivo no cuenta)')
assert.deepEqual(dest.filter(d => d.tipo === 'paralelo').map(d => d.clave), ['paralelo:1ER CICLO|A', 'paralelo:1ER CICLO|B', 'paralelo:2DO CICLO|A'])
assert.ok(dest.some(d => d.calco_id === 'propio') && dest.some(d => d.grupo_id === 'g1'), 'siguen los ejercicios propios y los grupos')
assert.equal((await compartir({ ...enviar, destino: { ciclo: '3ER CICLO' } }, docente, deps)).ok, false, 'un ciclo sin cursantes no')
const foto = { ops: { areaOps: { ...area, id: 'uno' }, limites: [] }, unidades: [{ id: 'u', bando: 'propias', designacion: 'BAT. LOG. FF.TT.', lat: 1.5, lng: 1.5 }],
  documentos: [{ nombre: 'Anexo A - Calco de Operaciones.png', tipo: 'imagen', mime: 'image/png', base64: 'iVBOR', extra: 'no viaja' }, { nombre: 'ORDEN DE OPERACIONES No 01.md', tipo: 'texto', texto: 'I.- SITUACIÓN.' }, { nombre: 'Otro', tipo: 'texto', texto: 'x' }] }
const rc = await compartir({ accion: 'ejercicio_enviar', calco_id: 'origen', nombre: 'OGO FABBLE', areas: ['uno'], destino: { ciclo: '1ER CICLO', paralelo: 'A' }, foto,
  opciones: { documentos: true, documentosNombres: ['Anexo A - Calco de Operaciones.png', 'ORDEN DE OPERACIONES No 01.md'], contenido: true } }, docente, deps)
assert.equal(rc.ok, true)
const fila = tablas.calco_compartidos.at(-1)
assert.equal(fila.destino_ciclo, '1ER CICLO'); assert.equal(fila.destino_paralelo, 'A'); assert.equal(fila.destino_grupo_id, null)
assert.deepEqual(fila.paquete.documentos.map(d => d.nombre), ['Anexo A - Calco de Operaciones.png', 'ORDEN DE OPERACIONES No 01.md'], 'sólo los documentos elegidos')
assert.equal(fila.paquete.documentos[0].extra, undefined, 'sólo los campos de un documento')
assert.equal(fila.paquete.contenido.unidades[0].designacion, 'BAT. LOG. FF.TT.', 'lo de adentro sale de la Mesa del profesor (foto)')
assert.equal((await compartir({ accion: 'ejercicio_enviar', calco_id: 'origen', nombre: 'X', areas: ['uno'], destino: { ciclo: '1ER CICLO' }, foto }, alumno, deps)).status, 403, 'un cursante no envía')
await compartir({ accion: 'ejercicio_enviar', calco_id: 'origen', nombre: 'Al 2do', areas: ['uno'], destino: { ciclo: '2DO CICLO' }, foto, opciones: {} }, docente, deps)
await compartir({ accion: 'ejercicio_enviar', calco_id: 'origen', nombre: 'Al 1ro B', areas: ['uno'], destino: { ciclo: '1ER CICLO', paralelo: 'B' }, foto, opciones: {} }, docente, deps)
await compartir({ accion: 'ejercicio_enviar', calco_id: 'origen', nombre: 'Todo el 1ro', areas: ['uno'], destino: { ciclo: '1ER CICLO' }, foto, opciones: {} }, docente, deps)
const rec = (await compartir({ accion: 'areas_recibidos', calco_id: 'grupo' }, alumno, deps)).envios.map(e => e.nombre)
assert.ok(rec.includes('OGO FABBLE') && rec.includes('Todo el 1ro'), 'el cursante del 1ER CICLO «A» recibe lo de su paralelo y lo de todo su ciclo')
assert.ok(!rec.includes('Al 2do') && !rec.includes('Al 1ro B'), 'y no lo de otro ciclo ni de otro paralelo')
assert.equal(rec[0], 'Todo el 1ro', 'lo más nuevo primero')
console.log('Compartir: selección, privacidad, conservación, idempotencia, permisos de origen/destino y envío por ciclo y paralelo OK.')
