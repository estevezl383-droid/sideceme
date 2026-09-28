// Reutiliza las bibliotecas ya incluidas en la versión publicada; sin CDN.
let entorno
export let Document, Packer, Paragraph, ImageRun, PageOrientation
export function configurarConceptos(v) {
  entorno=v
  ;({Document,Packer,Paragraph,ImageRun,PageOrientation}=v)
}
export function useState(...a) { return entorno.useState(...a) }
export function jsx(...a) { return entorno.jsx(...a) }
export function jsxs(...a) { return entorno.jsxs(...a) }
