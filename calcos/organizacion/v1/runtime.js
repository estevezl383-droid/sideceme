// Reutiliza lo que ya trae la versión publicada de la Mesa (sin CDN): React, los dibujos de
// los símbolos (las piezas de la Figura 6 del EAA-15-29 y las tareas tácticas), cómo se
// disgrega cada unidad en piezas, el nombre de cada unidad y Leaflet. El compilado llama a
// configurarOrgInicial() antes del primer render.
import { filasCuadro } from './modelo.js'

let entorno = {}
export function configurarOrgInicial(v) {
  entorno = { ...entorno, ...(v || {}) }
}
export const useState = (...a) => entorno.useState(...a)
export const useEffect = (...a) => entorno.useEffect(...a)
export const useMemo = (...a) => entorno.useMemo(...a)
export const jsx = (...a) => entorno.jsx(...a)
export const jsxs = (...a) => entorno.jsxs(...a)
export const leaflet = () => entorno.leaflet || (typeof window !== 'undefined' && window.L) || null

// Lo que el modelo necesita de la Mesa (ver modelo.js).
export const simb = {
  piezasDe: (u) => (entorno.tN ? entorno.tN(u, entorno.js ? entorno.js(u) : '') : []),
  grupoDe: (s) => (entorno.lP && entorno.lP(s)?.grupo) || '',
  cortoDe: (s) => (entorno.lP && entorno.lP(s)?.corto) || '',
  rotulo: (u) => (entorno.js ? entorno.js(u) : String(u?.designacion || 'Unidad')),
  nombreTarea: (id) => (entorno.zg || []).find((t) => t.id === id)?.nombre || id || '',
  catTarea: (id) => (entorno.zg || []).find((t) => t.id === id)?.cat || '',
  nomDe: (s) => (entorno.lP && entorno.lP(s)?.nom) || '',
}
// Las armas de la ficha de unidad (para las unidades que se traen de la Orden).
export const armas = () => entorno.T1 || []
export const svgPieza = (simbolo, tam = 40, color = '#000') => (entorno.eN ? entorno.eN(simbolo, tam, color) : '')
export const svgTarea = (id, tam = 40, color = '#000', rot = 0) => (entorno.cb ? entorno.cb(id, tam, color, rot) : '')
export const catalogoTareas = () => entorno.zg || []

// Para la siembra 🌱 de la hoja (l3e del compilado): el cuadro sale de la carta.
export function filasDeLaHoja(ctx) {
  try {
    return filasCuadro({ ops: ctx?.ops || {}, g3: ctx?.g3 || {}, unidades: ctx?.unidades || [] }, simb)
  } catch {
    return []
  }
}
