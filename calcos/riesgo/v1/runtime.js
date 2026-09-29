// Reutiliza lo que ya trae la versión publicada de la Mesa (sin CDN): React, el panel
// «🤖 Trabajar esta hoja con IA» de las demás hojas, el encabezado de los pedidos a la
// IA, el corrector de terminología y el cálculo de la Línea Inicial de Tiempo. El
// compilado llama a configurarRiesgo() antes del primer render.
let entorno = {}
export function configurarRiesgo(v) {
  entorno = v || {}
}
export function useState(...a) {
  return entorno.useState(...a)
}
export function useMemo(...a) {
  return entorno.useMemo ? entorno.useMemo(...a) : a[0]()
}
export function jsx(...a) {
  return entorno.jsx(...a)
}
export function jsxs(...a) {
  return entorno.jsxs(...a)
}
export const panelIA = () => entorno.PanelIA || null
export const encabezadoIA = () => entorno.encabezadoIA || ''
export const corregirIA = () => (typeof entorno.corregirIA === 'function' ? entorno.corregirIA : null)
export const lineaDeTiempo = () => (typeof entorno.lineaDeTiempo === 'function' ? entorno.lineaDeTiempo : null)
