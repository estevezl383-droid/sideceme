// Lo que la plantilla del concepto toma prestado de la Mesa (sin CDN): React, el nombre de cada
// unidad (js), el dibujo de las tareas tácticas (cb: bloquear, fijar, canalizar, desviar), el
// catálogo de obstáculos (Nm) y Leaflet. El compilado llama a configurarConcepto() antes del primer
// render; el plan de fuegos (window.MesaFuegos) y sus cálculos (window.__mesaFuegos) ya están.
let entorno = {}
export function configurarConcepto(v) {
  entorno = { ...entorno, ...(v || {}) }
}
export const useState = (...a) => entorno.useState(...a)
export const useEffect = (...a) => entorno.useEffect(...a)
export const useMemo = (...a) => entorno.useMemo(...a)
export const jsx = (...a) => entorno.jsx(...a)
export const jsxs = (...a) => entorno.jsxs(...a)
export const leaflet = () => entorno.leaflet || (typeof window !== 'undefined' && window.L) || null
export const rotulo = (u) => (entorno.js ? entorno.js(u) : String(u?.designacion || 'Unidad'))
export const svgTarea = (id, tam = 40, color = '#000', rot = 0) => (entorno.cb ? entorno.cb(id, tam, color, rot) : '')
export const catalogoObstaculos = () => entorno.Nm || {}
export const nomObstaculo = (t) => catalogoObstaculos()[t]?.nom || String(t || '').replace(/_/g, ' ')
// El modelo del plan de fuegos (calcos/fuegos/plan-fuegos.js) y los medios con su alcance.
export const fuegos = () => (typeof window !== 'undefined' && window.MesaFuegos && window.MesaFuegos.modelo) || null
export function mediosDeApoyo({ unidades = [], todas = [], orgTarea = [], plan = {} } = {}) {
  const F = fuegos()
  if (!F) return []
  try {
    return F.mediosDeApoyo({ unidades, todas: todas.length ? todas : unidades, orgTarea, plan, mesa: (typeof window !== 'undefined' && window.__mesaFuegos) || {} }).medios
  } catch {
    return []
  }
}
