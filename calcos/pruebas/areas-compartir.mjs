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
  calco_compartidos: [] }
class Consulta {
  constructor(tabla) { this.tabla = tabla; this.filtros = []; this.uno = false }
  select() { return this }
  eq(k,v) { this.filtros.push(x => x[k] === v); return this }
  neq(k,v) { this.filtros.push(x => x[k] !== v); return this }
  is(k,v) { return this.eq(k,v) }
  order() { return this }
  limit() { return this }
  maybeSingle() { this.uno = true; return this }
  single() { this.uno = true; return this }
  insert(d) { this.d = d; return this }
  then(resolve,reject) {
    if (this.d) tablas[this.tabla].push({ ...this.d, id: 'nuevo-envio' })
    const filas = tablas[this.tabla].filter(x => this.filtros.every(f => f(x)))
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
console.log('Compartir: selección, privacidad, conservación, idempotencia y permisos de origen/destino OK.')
