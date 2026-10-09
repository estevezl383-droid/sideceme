// Reutiliza las bibliotecas ya incluidas en la versión publicada (React y los
// constructores de Word del compilado); sin CDN. El compilado llama a
// configurarConceptos() antes del primer render.
let entorno = {}
export let Document, Packer, Paragraph, ImageRun, PageOrientation
export function configurarConceptos(v) {
  entorno = v || {}
  ;({ Document, Packer, Paragraph, ImageRun, PageOrientation } = entorno)
}
export function useState(...a) { return entorno.useState(...a) }
export function useMemo(...a) { return entorno.useMemo ? entorno.useMemo(...a) : a[0]() }
export function useRef(...a) { return entorno.useRef ? entorno.useRef(...a) : { current: a[0] } }
export function jsx(...a) { return entorno.jsx(...a) }
export function jsxs(...a) { return entorno.jsxs(...a) }
// Lo que la Mesa usa en todos los pedidos a la IA: el encabezado (contexto académico y
// el rol de oficial de Estado Mayor) y el corrector de terminología («se ejecuta»).
export const encabezadoIA = () => entorno.encabezadoIA || ''
export const corregirIA = () => (typeof entorno.corregirIA === 'function' ? entorno.corregirIA : null)
