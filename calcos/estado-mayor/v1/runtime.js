// Lo que la Mesa (el compilado) le presta al motor de documentos de Estado Mayor, y el
// PUENTE con el calco:
//
//   · configurarEM(): React, el panel «🤖 Trabajar esta hoja con IA» (hU), el encabezado
//     de los pedidos (Qq), el corrector de terminología (uU), el formato militar (Word,
//     vista previa y registro), el catálogo de instalaciones (Ni), la coordenada de la
//     Mesa (Sc), la cuenta de bajas del G-1 (iC) y el resumen de lo que entregó el G-2 (voe);
//   · sincronizarEM(): en cada cambio la Mesa pasa el estado vivo (calco, fichas, fases,
//     bajas por fase, concepto de apoyo, evacuación, la Orden superior, las hojas de todas
//     las secciones) y las ACCIONES para acostar sobre el calco (la herramienta de trazar,
//     colocar una instalación).
//
// Las pantallas se suscriben con useCalco() y se redibujan solas.
let entorno = {}
export function configurarEM(v) {
  entorno = v || {}
}
export const useState = (...a) => entorno.useState(...a)
export const useEffect = (...a) => entorno.useEffect(...a)
export const jsx = (...a) => entorno.jsx(...a)
export const jsxs = (...a) => entorno.jsxs(...a)
const fn = (k) => (typeof entorno[k] === 'function' ? entorno[k] : null)
export const panelIA = () => entorno.PanelIA || null
export const encabezadoIA = () => entorno.encabezadoIA || ''
export const corregirIA = () => fn('corregirIA')
export const wordMilitar = () => fn('wordMilitar')
export const registroMilitar = () => fn('registroMilitar')
export const vistaMilitar = () => fn('vistaMilitar')
export const mostrarDocx = () => fn('mostrarDocx')

// ─── El calco vivo ──────────────────────────────────────────────────────────────────
let calco = { ops: {}, unidades: [], fasesCOA: {}, bajasPorFase: [], conceptoApoyo: [], misionLog: '', estadosRecursos: {}, evacuacion: {}, orgTarea: [], ordenSup: {}, hojasG: {}, g3: {}, picb: {} }
let acciones = {}
const subs = new Set()
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {})
const arr = (x) => (Array.isArray(x) ? x : [])
export function sincronizarEM(d = {}) {
  calco = {
    ops: obj(d.ops),
    unidades: arr(d.unidades),
    fasesCOA: obj(d.fasesCOA),
    bajasPorFase: arr(d.bajasPorFase),
    conceptoApoyo: arr(d.conceptoApoyo),
    misionLog: d.misionLog || '',
    estadosRecursos: obj(d.estadosRecursos),
    evacuacion: obj(d.evacuacion),
    orgTarea: arr(d.orgTarea),
    ordenSup: obj(d.ordenSup),
    hojasG: obj(d.hojasG),
    g3: obj(d.g3),
    picb: obj(d.picb),
  }
  acciones = d.acciones || {}
  for (const f of [...subs]) {
    try {
      f()
    } catch {}
  }
}
export const calcoActual = () => calco
export function useCalco() {
  const [, set] = useState(0)
  useEffect(() => {
    const f = () => set((x) => x + 1)
    subs.add(f)
    return () => subs.delete(f)
  }, [])
  return calco
}
export const accion = (k) => (typeof acciones[k] === 'function' ? acciones[k] : null)

// El contexto que reciben las configuraciones de cada sección (propuestas, datos, IA).
export function contexto({ campo = '', hojas = null, ctxDoc = {}, vivo = calco } = {}) {
  const ordenSup = ctxDoc?.ordenSup && Object.keys(ctxDoc.ordenSup).length ? ctxDoc.ordenSup : vivo.ordenSup || {}
  return {
    ...ctxDoc,
    campo,
    ordenSup,
    unidad: ctxDoc?.unidad || ordenSup.unidad || '',
    calco: vivo,
    hojas: hojas || vivo.hojasG?.[campo] || {},
    catalogo: fn('catalogo'),
    bajas: fn('bajas'),
    coordenada: fn('coordenada'),
    resumenG2: fn('resumenG2'),
  }
}

// ─── Ver en la carta ────────────────────────────────────────────────────────────────
const mapa = () => (typeof window !== 'undefined' ? window.__mapa2d || null : null)
export function verEnCarta(listas = []) {
  const m = mapa()
  const pts = listas.flatMap((x) => (Array.isArray(x) ? x : [])).filter((p) => Array.isArray(p) && Number.isFinite(+p[0]) && Number.isFinite(+p[1]))
  if (!m || !pts.length) return false
  const lat = pts.map((p) => +p[1])
  const lng = pts.map((p) => +p[0])
  try {
    m.fitBounds([[Math.min(...lat), Math.min(...lng)], [Math.max(...lat), Math.max(...lng)]], { padding: [50, 50], maxZoom: 13 })
    return true
  } catch {
    return false
  }
}
