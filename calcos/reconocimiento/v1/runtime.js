// Reutiliza lo que ya trae la versión publicada de la Mesa (sin CDN): React, el panel
// «🤖 Trabajar esta hoja con IA» de las demás hojas, el encabezado de los pedidos a la
// IA, el corrector de terminología, la siembra de la hoja con el calco (los órganos de
// reconocimiento y su alcance) y el formato militar de los documentos (el Word, su vista
// previa y el registro de la hoja). El compilado llama a configurarReconocimiento()
// antes del primer render.
let entorno = {}
export function configurarReconocimiento(v) {
  entorno = v || {}
}
export function useState(...a) {
  return entorno.useState(...a)
}
export function jsx(...a) {
  return entorno.jsx(...a)
}
export function jsxs(...a) {
  return entorno.jsxs(...a)
}
const fn = (k) => (typeof entorno[k] === 'function' ? entorno[k] : null)
export const panelIA = () => entorno.PanelIA || null
export const encabezadoIA = () => entorno.encabezadoIA || ''
export const corregirIA = () => fn('corregirIA')
export const semilla = () => fn('semilla')
// (spec, nombre, { ctx, registro }) → descarga el Word con el formato militar de la Mesa.
export const wordMilitar = () => fn('wordMilitar')
// (hoja, ctx) → el registro del documento (G-3 · F2·P9 · Orden de reconocimiento).
export const registroMilitar = () => fn('registroMilitar')
// (spec, nombre, { ctx, registro }) → { blob } del mismo Word, sin descargarlo.
export const vistaMilitar = () => fn('vistaMilitar')
// (blob, elemento) → dibuja el Word en la pantalla.
export const mostrarDocx = () => fn('mostrarDocx')
