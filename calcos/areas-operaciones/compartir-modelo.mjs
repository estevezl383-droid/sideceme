import { paqueteAreas, importarAreas } from './modelo.mjs'

export function construirPaquete(payload, ids, opciones = {}) {
  const p = paqueteAreas(payload.ops || {}, ids, payload.nombre)
  // Lista permitida: nunca copia planes, respuestas ni otras capas por accidente.
  p.areas = p.areas.map(a => Object.fromEntries(
    ['id', 'nombre', 'coords', ...(opciones.unidad ? ['unidad'] : []), ...(opciones.operacion ? ['operacion'] : [])]
      .filter(k => a[k] !== undefined).map(k => [k, a[k]])))
  p.documentos = opciones.documentos && Array.isArray(payload.documentos) ? payload.documentos : []
  p.indicaciones = String(opciones.indicaciones || '').slice(0, 4000)
  p.formato = 'SIDE-CEME editable'
  if (new TextEncoder().encode(JSON.stringify(p)).length > 2000000) throw new Error('El envío supera 2 MB. Comparta menos documentos.')
  return p
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
export function recibirDocumentos(documentos, envio) {
  const p = envio.paquete
  return [...documentos, ...(Array.isArray(p.documentos) ? p.documentos : [])
    .map((d, i) => ({ ...d, id: `compartido-${envio.id}-${i}`, _envioArea: `${envio.id}:${i}` }))
    .filter(d => !documentos.some(x => x._envioArea === d._envioArea))]
}
