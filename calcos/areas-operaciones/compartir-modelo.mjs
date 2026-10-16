import { paqueteAreas, importarAreas, listarAreas, vistaLimpia } from './modelo.mjs?v=tijera20261016'
import { fichasDelPaquete, sumarCmoc, recortarContenido, aoiDelLazo, calcosValidos } from './recorte.mjs?v=tijera20261016'

export function construirPaquete(payload, ids, opciones = {}) {
  // opciones.contenido: también lo que está dentro de las áreas (límites, puntos,
  // marcas, tareas y fichas; las enemigas sólo si opciones.enemigo no es false).
  // opciones.cmoc (11-10-2026): también el CMOC de adentro, sólo de las capas de
  // opciones.capasCmoc (las que el profesor tenía a la vista); un cliente viejo no lo pide.
  // opciones.tijera (16-10-2026): { lazo, vista } de una selección hecha con la tijera: lo de adentro
  // va cortado por donde pasó el lazo (también lo de afuera del Área de Operaciones que encierra,
  // como las fichas enemigas) y con los calcos del terreno que se veían, si entran en el envío.
  const cmoc = opciones.contenido && opciones.cmoc && payload.cmoc && typeof payload.cmoc === 'object' ? payload.cmoc : null
  const tijera = opciones.contenido && opciones.tijera && typeof opciones.tijera === 'object' && Array.isArray(ids) && ids.length === 1 ? opciones.tijera : null
  const p = paqueteAreas(payload.ops || {}, ids, payload.nombre,
    opciones.contenido && !tijera ? { unidades: Array.isArray(payload.unidades) ? payload.unidades : [], enemigo: opciones.enemigo !== false,
      cmoc, capasCmoc: Array.isArray(opciones.capasCmoc) ? opciones.capasCmoc.map(String).slice(0, 20) : [] } : null)
  if (tijera) {
    const lazo = Array.isArray(tijera.lazo) ? tijera.lazo.slice(0, 5000) : null
    const areas = listarAreas(payload.ops || {})
    const c = recortarContenido({ area: p.areas[0].coords, lazo, areas: areas.filter(a => a.id !== ids[0]).map(a => a.coords) },
      { ops: payload.ops || {}, unidades: Array.isArray(payload.unidades) ? payload.unidades : [], cmoc, resultados: payload.resultados || null,
        vista: vistaLimpia(tijera.vista), enemigo: opciones.enemigo !== false, conCmoc: !!cmoc })
    p.contenido = { ops: c.ops, unidades: c.unidades }
    if (Object.keys(c.cmoc).length) p.contenido.cmoc = c.cmoc
    if (Object.keys(c.resultados).length) { p.contenido.resultados = c.resultados; p.contenido.calcosVer = Object.keys(c.resultados) }
    const aoi = aoiDelLazo(lazo)
    if (aoi) p.aoi = aoi
  }
  // Lista permitida: nunca copia planes, respuestas ni otras capas por accidente.
  p.areas = p.areas.map(a => Object.fromEntries(
    ['id', 'nombre', 'coords', 'escalon', ...(opciones.unidad ? ['unidad'] : []), ...(opciones.operacion ? ['operacion', 'tipo', 'modalidad', 'ambiente'] : [])]
      .filter(k => a[k] !== undefined).map(k => [k, a[k]])))
  p.documentos = opciones.documentos && Array.isArray(payload.documentos) ? documentosDe(payload.documentos, opciones.documentosNombres) : []
  p.indicaciones = String(opciones.indicaciones || '').slice(0, 4000)
  p.formato = 'SIDE-CEME editable'
  const pesa = () => new TextEncoder().encode(JSON.stringify(p)).length
  // Los calcos del terreno no entran: van sin ellos (el que recibe los genera con ⚡ Generar calcos
  // sobre el Área de Interés que llega, o abre el JSON de la selección, que sí los lleva).
  if (p.contenido?.resultados && pesa() > 2000000) { delete p.contenido.resultados; delete p.contenido.calcosVer; p.calcosFuera = true }
  if (pesa() > 2000000) throw new Error('El envío supera 2 MB. Comparta menos documentos.')
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
// El CMOC del envío (las áreas de empeño, las avenidas… de adentro), una sola vez por envío.
export function recibirCmoc(cmoc, envio) {
  if (!envio?.id || !envio.paquete?.contenido?.cmoc) return cmoc
  return sumarCmoc(cmoc, envio.paquete.contenido.cmoc, envio.id)
}
// ✂️ Los calcos del terreno del envío (16-10-2026): se suman los que el ejercicio no tiene; los suyos
// no se pisan. Y el Área de Interés (el lazo), sólo si el ejercicio no tiene la suya.
export function recibirTerreno(resultados, envio) {
  const llegan = calcosValidos(envio?.paquete?.contenido?.resultados)
  if (!llegan) return resultados
  const previos = resultados && typeof resultados === 'object' ? resultados : {}
  const nuevos = Object.fromEntries(Object.entries(llegan).filter(([id]) => !previos[id]))
  return Object.keys(nuevos).length ? { ...previos, ...nuevos } : resultados
}
export function recibirAoi(aoi, envio) {
  const a = envio?.paquete?.aoi
  return aoi || !(a?.geometry?.type === 'Polygon' && Array.isArray(a.geometry.coordinates?.[0]) && a.geometry.coordinates[0].length >= 4) ? aoi : JSON.parse(JSON.stringify(a))
}
export function recibirDocumentos(documentos, envio) {
  const p = envio.paquete
  return [...documentos, ...(Array.isArray(p.documentos) ? p.documentos : [])
    .map((d, i) => ({ ...d, id: `compartido-${envio.id}-${i}`, _envioArea: `${envio.id}:${i}` }))
    .filter(d => !documentos.some(x => x._envioArea === d._envioArea))]
}
