// 📂 Abrir un archivo JSON de la Mesa como ejercicio nuevo (12-10-2026).
//
// Lo pidió Sergio con la captura de 📁 Ejercicios y la de su carpeta de Descargas
// (Seleccion_CE-I.json, areas_operaciones (n).json): «no puedo abrir el área que seleccioné
// ni recorté… no se proyecta en el mapa… se está abriendo con Visual Studio Code… en
// 📁 Ejercicios debería haber una opción de abrir un archivo JSON». El JSON que baja la Mesa
// no se abre con doble clic (la computadora lo manda al programa que tenga para .json): se
// abre con «📂 Abrir archivo JSON» de 📁 Ejercicios, como un ejercicio NUEVO con el nombre de
// la selección («CE-I»), y la carta va a su área. El ejercicio que estaba abierto no se toca.
//   · La selección guardada (Seleccion_….json), las áreas (AO_….json, areas_operaciones.json)
//     y el ⬇️ JSON del tablero del Profesor: el área, lo de adentro (límites, puntos, fichas
//     propias y enemigas), el CMOC y, si los trae, los documentos (como «Incorporar al
//     ejercicio» de la aplicación).
//   · El ejercicio entero (EJERCICIO_….json, el ejercicio.json del .zip).
// Lo llama el compilado (index-abrir-20261012.js); acá no hay React ni pantalla.
import { listarAreas } from './modelo.mjs?v=seleccion20261011'
import { fichasDelPaquete, sumarCmoc, resumenContenido } from './recorte.mjs?v=seleccion20261011'
import { recibirPaquete, recibirDocumentos } from './compartir-modelo.mjs?v=seleccion20261011'

export const LIMITE_BYTES = 60 * 1024 * 1024
const copiar = x => JSON.parse(JSON.stringify(x))
const objeto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const esPar = p => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' &&
  Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90
// Los [lng, lat] de cualquier arreglo anidado (contornos, geometrías GeoJSON).
function pares(x, salida = [], prof = 0) {
  if (!Array.isArray(x) || prof > 8) return salida
  if (esPar(x)) salida.push([x[0], x[1]])
  else for (const y of x) pares(y, salida, prof + 1)
  return salida
}

// «Seleccion_CE-I.json» → «CE-I»; «EJERCICIO_FABBLE_2026-10-11_1948.json» → «FABBLE».
export function nombreDeArchivo(archivo) {
  return String(archivo || '').replace(/\.json$/i, '').replace(/\s*\(\d+\)$/, '').replace(/ - para los alumnos$/i, '')
    .replace(/^(Seleccion|AO|EJERCICIO|Ejercicio)[_ ]/, '').replace(/_\d{4}-\d{2}-\d{2}_\d{4}$/, '')
    .replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

// El nombre que propone para el ejercicio nuevo: si ya hay uno igual, «CE-I (2)».
// Limpia como el compilado (tm): sin \ / : * ? " < > |.
export function nombreLibre(base, existentes = []) {
  const limpio = String(base || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 70) || 'Ejercicio abierto'
  const usados = new Set(existentes.map(n => String(n || '').trim().toLowerCase()))
  if (!usados.has(limpio.toLowerCase())) return limpio
  for (let i = 2; i < 1000; i++) if (!usados.has(`${limpio} (${i})`.toLowerCase())) return `${limpio} (${i})`
  return `${limpio} ${Date.now()}`
}

const esEjercicio = j => !j.tipoArchivo && (objeto(j.ops) || Array.isArray(j.unidades) || objeto(j.aoi))

// Qué es el archivo y el ejercicio que arma:
//   { ok: true, tipo: 'areas' | 'ejercicio', nombre, datos, resumen, coords }  (coords: a dónde va la carta)
//   { ok: false, error }
// opsVacias / cmocVacio: los vacíos de la Mesa (Vt y an del compilado).
export function ejercicioDeArchivo(j, { archivo = '', opsVacias = {}, cmocVacio = {}, ahora = new Date().toISOString(), sello = Date.now().toString(36) } = {}) {
  const cual = archivo ? `«${archivo}»` : 'El archivo'
  if (!objeto(j)) return { ok: false, error: `${cual} no es un archivo de la Mesa.` }
  if (j.tipoArchivo === 'sideceme-areas-operaciones') return deAreas(j, { archivo, opsVacias, cmocVacio, ahora, sello })
  if (j.tipoArchivo === 'capa-em') return { ok: false, error: `${cual} es una capa del Estado Mayor (G-1, G-4 o G-5): no se abre, se suma al ejercicio abierto con «📥 Integrar capa del Estado Mayor» (📁 Ejercicios → Abrir guardados).` }
  if (j.tipoArchivo === 'base-pmtd') return { ok: false, error: `${cual} es una BASE del G-3: se abre en el tablero de la Mesa con «📂 Abrir la BASE que repartió el G-3».` }
  if (esEjercicio(j)) return deEjercicio(j, { archivo })
  return { ok: false, error: `${cual} no es de la Mesa: se abren la selección guardada (Seleccion_….json), las áreas (AO_….json, areas_operaciones.json) y el ejercicio (EJERCICIO_….json).` }
}

function deAreas(j, { archivo, opsVacias, cmocVacio, ahora, sello }) {
  const envio = { id: `archivo-${sello}`, nombre: archivo, paquete: j }
  let ops
  // Valida (importarAreas) y anota de dónde vino, con las indicaciones del Profesor si las trae.
  try { ops = recibirPaquete(copiar(opsVacias), envio) } catch (e) { return { ok: false, error: `${archivo ? `«${archivo}»: ` : ''}${e.message}` } }
  const unidades = fichasDelPaquete(j)
  const cmoc = sumarCmoc(copiar(cmocVacio), j.contenido?.cmoc)
  const docs = (Array.isArray(j.documentos) ? j.documentos : []).filter(d => objeto(d) && typeof d.nombre === 'string')
  const documentos = recibirDocumentos([], { ...envio, paquete: { documentos: docs } })
  const areas = j.areas.map(a => String(a.nombre || '').trim()).filter(Boolean)
  const nombre = String(j.seleccion?.nombre || '').trim() || (j.areas.length === 1 ? areas[0] : '') || nombreDeArchivo(archivo) || String(j.ejercicioOrigen || '').trim()
  const partes = [
    j.areas.length === 1 ? `el área${areas[0] ? ` «${areas[0]}»` : ''}` : `${j.areas.length} áreas`,
    j.contenido ? resumenContenido({ ops: j.contenido.ops, unidades, cmoc: j.contenido.cmoc ? cmoc : {} }) : 'sólo el contorno',
    documentos.length ? `${documentos.length} documento(s)` : '',
  ].filter(Boolean)
  return {
    ok: true, tipo: 'areas', nombre,
    datos: { version: 1, nombre, guardadoEn: ahora, ops, unidades, cmoc, ...(documentos.length ? { documentos } : {}) },
    resumen: partes.join(' · '),
    coords: pares(listarAreas(ops).map(a => a.coords)),
  }
}

function deEjercicio(j, { archivo }) {
  const datos = copiar(j)
  // Se abre para seguir trabajando: sin el candado de «finalizado» y sin los KML viejos.
  delete datos.finalizado; delete datos.calcosKml
  const nombre = String(j.nombre || '').trim() || nombreDeArchivo(archivo)
  const areas = listarAreas(objeto(datos.ops) ? datos.ops : {})
  const unidades = Array.isArray(datos.unidades) ? datos.unidades : []
  // La carta va al Área de interés (como al abrir un guardado); sin ella, a las áreas o a las fichas.
  let coords = pares(datos.aoi?.geometry?.coordinates)
  if (!coords.length) coords = pares(areas.map(a => a.coords))
  if (!coords.length) coords = pares(unidades.map(u => [+u?.lng, +u?.lat]))
  const partes = ['el ejercicio entero', areas.length ? `${areas.length} área(s)` : '', unidades.length ? `${unidades.length} ficha(s)` : ''].filter(Boolean)
  return { ok: true, tipo: 'ejercicio', nombre, datos, resumen: partes.join(' · '), coords }
}

// Lleva la carta (2D y, si está abierta, 3D) a lo que se abrió.
export function encuadrar(coords, w = globalThis) {
  const p = pares(coords)
  if (!p.length) return false
  let o = Infinity, e = -Infinity, s = Infinity, n = -Infinity
  for (const [lng, lat] of p) { o = Math.min(o, lng); e = Math.max(e, lng); s = Math.min(s, lat); n = Math.max(n, lat) }
  let hecho = false
  try { if (w.__mapa2d?.fitBounds) { w.__mapa2d.fitBounds([[s, o], [n, e]], { padding: [40, 40], maxZoom: 14, animate: false }); hecho = true } } catch {}
  try { if (w.__map3d?.fitBounds) { w.__map3d.fitBounds([[o, s], [e, n]], { padding: 60, maxZoom: 14, duration: 0 }); hecho = true } } catch {}
  return hecho
}
