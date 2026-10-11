import { paqueteAreas, importarAreas } from './modelo.mjs?v=lazo20261010'
import { fichasDelPaquete } from './recorte.mjs?v=lazo20261010'

export function construirPaquete(payload, ids, opciones = {}) {
  // opciones.contenido: también lo que está dentro de las áreas (límites, puntos,
  // marcas, tareas y fichas; las enemigas sólo si opciones.enemigo no es false).
  const p = paqueteAreas(payload.ops || {}, ids, payload.nombre,
    opciones.contenido ? { unidades: Array.isArray(payload.unidades) ? payload.unidades : [], enemigo: opciones.enemigo !== false } : null)
  // Lista permitida: nunca copia planes, respuestas ni otras capas por accidente.
  p.areas = p.areas.map(a => Object.fromEntries(
    ['id', 'nombre', 'coords', 'escalon', ...(opciones.unidad ? ['unidad'] : []), ...(opciones.operacion ? ['operacion', 'tipo', 'modalidad', 'ambiente'] : [])]
      .filter(k => a[k] !== undefined).map(k => [k, a[k]])))
  p.documentos = opciones.documentos && Array.isArray(payload.documentos) ? documentosDe(payload.documentos, opciones.documentosNombres) : []
  p.indicaciones = String(opciones.indicaciones || '').slice(0, 4000)
  p.formato = 'SIDE-CEME editable'
  if (new TextEncoder().encode(JSON.stringify(p)).length > 2000000) throw new Error('El envío supera 2 MB. Comparta menos documentos.')
  return p
}
// Los documentos que viajan: sólo los campos que la Mesa usa (texto o imagen), y si se eligieron
// por nombre (la OGO consolidada del profesor), sólo esos.
const CAMPOS_DOC = ['nombre', 'mime', 'tipo', 'texto', 'base64', 'paginas', 'categoria']
function documentosDe(documentos, nombres) {
  const elegidos = Array.isArray(nombres) ? new Set(nombres.map(String)) : null
  return documentos.filter(d => d && typeof d === 'object' && typeof d.nombre === 'string' && (!elegidos || elegidos.has(d.nombre)))
    .map(d => Object.fromEntries(CAMPOS_DOC.filter(k => d[k] !== undefined && d[k] !== null).map(k => [k, typeof d[k] === 'number' ? d[k] : String(d[k])])))
}
export function recibirPaquete(ops, envio) {
  if (!envio?.id || !envio.paquete) throw new Error('Envío inválido.')
  if ((ops.entregasAreas || []).some(e => e.id === envio.id)) return ops
  const next = importarAreas(ops, envio.paquete)
  return { ...next, entregasAreas: [...(ops.entregasAreas || []), {
    id: envio.id, nombre: envio.nombre, origen: envio.paquete.ejercicioOrigen,
    indicaciones: envio.paquete.indicaciones || '', recibidoEn: new Date().toISOString()
  }] }
}
// Las fichas del envío, una sola vez por envío (las marca con su id).
export function recibirUnidades(unidades, envio) {
  const previas = Array.isArray(unidades) ? unidades : []
  if (!envio?.id || previas.some(u => u?.envioAreas === envio.id)) return previas
  const nuevas = fichasDelPaquete(envio.paquete, envio.id)
  return nuevas.length ? [...previas, ...nuevas] : previas
}
export function recibirDocumentos(documentos, envio) {
  const p = envio.paquete
  return [...documentos, ...(Array.isArray(p.documentos) ? p.documentos : [])
    .map((d, i) => ({ ...d, id: `compartido-${envio.id}-${i}`, _envioArea: `${envio.id}:${i}` }))
    .filter(d => !documentos.some(x => x._envioArea === d._envioArea))]
}
