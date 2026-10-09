// COMANDANTE y JEM: lo que comparten (sin DOM, se prueba en Node).
//
// Las hojas del Comandante y del Jefe de Estado Mayor no son de un campo funcional: se
// alimentan de TODO lo que ya hizo el Estado Mayor. Acá está el puente:
//   · leer lo que cada sección ya trabajó (G-1, G-4, G-5, EME. en hojasG; el G-2 en la PICB;
//     el G-3 en su tablero) y lo que ya escribieron el Comandante y el JEM;
//   · volcarlo como texto para el pedido de la IA (la Mesa NO manda al expediente las hojas
//     del Comandante ni las del JEM: se las pasamos acá a ellos y a las demás secciones).
import { limpio, texto, sinMarcaIA, lista, esObj, claveTexto } from '../motor.js'

export const SECCIONES = [
  { id: 'g1', rot: 'G-1 · Personal', corto: 'G-1' },
  { id: 'g2', rot: 'G-2 · Inteligencia', corto: 'G-2' },
  { id: 'g3', rot: 'G-3 · Operaciones', corto: 'G-3' },
  { id: 'g4', rot: 'G-4 · Logística', corto: 'G-4' },
  { id: 'g5', rot: 'G-5 · Asuntos Civiles y Gobierno Militar', corto: 'G-5' },
  { id: 'eme', rot: 'EME. · Estado Mayor Especial', corto: 'EME.' },
]
export const ES_MANDO = (campo) => campo === 'cmte' || campo === 'jem'

export const obj = (x) => (esObj(x) ? x : {})
export const filasDe = (h) => (Array.isArray(h) ? h.filter(esObj) : [])
export const col = (fila, re) => {
  const k = Object.keys(fila || {}).find((x) => re.test(x))
  return k ? limpio(sinMarcaIA(fila[k])) : ''
}
export const g3De = (ctx = {}) => obj(ctx.calco?.g3)
export const hojasDe = (ctx = {}, g) => obj(ctx.calco?.hojasG?.[g])
export const cmteDe = (ctx = {}) => (ctx.campo === 'cmte' && esObj(ctx.hojas) && Object.keys(ctx.hojas).length ? ctx.hojas : hojasDe(ctx, 'cmte'))
export const jemDe = (ctx = {}) => (ctx.campo === 'jem' && esObj(ctx.hojas) && Object.keys(ctx.hojas).length ? ctx.hojas : hojasDe(ctx, 'jem'))
export const unir = (xs, sep = '\n') => xs.map((x) => limpio(x)).filter(Boolean).join(sep)

// ¿Hay algo escrito? (texto en cualquier parte del valor, sin contar marcas ni metadatos)
const META = new Set(['esquema', 'numero', 'ideas', 'firma', 'iaCampos', 'iaFilas', 'nombre'])
export function conContenido(v) {
  if (v == null) return false
  if (typeof v === 'string') return !!limpio(sinMarcaIA(v))
  if (typeof v === 'number') return true
  if (Array.isArray(v)) return v.some(conContenido)
  if (esObj(v)) return Object.entries(v).some(([k, x]) => !k.startsWith('_') && !META.has(k) && conContenido(x))
  return false
}

// El valor de una hoja como renglones de texto (para el pedido de la IA y para mirar).
export function volcar(v, max = 900) {
  const cortar = (s) => (s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s)
  const out = []
  if (Array.isArray(v)) {
    for (const f of v.filter(esObj)) {
      const x = Object.entries(f).filter(([k, y]) => !k.startsWith('_') && limpio(sinMarcaIA(y))).map(([k, y]) => `${k}: ${sinMarcaIA(y).replace(/\s*\n+\s*/g, ' / ')}`)
      if (x.length) out.push(`- ${x.join(' · ')}`)
    }
  } else if (esObj(v) && v.esquema) {
    for (const [k, y] of Object.entries(obj(v.campos))) if (limpio(sinMarcaIA(y))) out.push(`- ${k}: ${sinMarcaIA(y).replace(/\s*\n+\s*/g, ' / ')}`)
    for (const c of Array.isArray(v.caps) ? v.caps : []) {
      for (const k of ['ventajas', 'desventajas']) if (limpio(sinMarcaIA(c?.[k]))) out.push(`- ${c.nombre || 'CAP'} · ${k}: ${sinMarcaIA(c[k]).replace(/\s*\n+\s*/g, ' / ')}`)
    }
  } else if (esObj(v) && (Array.isArray(v.a) || Array.isArray(v.b))) {
    for (const x of lista(v.a)) out.push(`- ${x}`)
    for (const x of lista(v.b)) out.push(`- (b) ${x}`)
  } else if (esObj(v)) {
    for (const [k, y] of Object.entries(v)) {
      if (k.startsWith('_') || META.has(k)) continue
      if (typeof y === 'string' && limpio(sinMarcaIA(y))) out.push(`- ${k}: ${sinMarcaIA(y).replace(/\s*\n+\s*/g, ' / ')}`)
      else if (esObj(y) || Array.isArray(y)) {
        const t = volcar(y, max)
        if (t) out.push(`- ${k}:\n${t.split('\n').map((l) => `  ${l}`).join('\n')}`)
      }
    }
  }
  return cortar(out.join('\n'))
}

// Las hojas que cada sección ya trabajó, con su nombre del PMTD.
const ROT_G = {
  aprecActiva: 'F1·P3 Apreciación activa',
  aprecOrientacion: 'F2·P13 Apreciación actualizada',
  tareas: 'F2·P3 Tareas',
  limitaciones: 'F2·P5 Limitaciones',
  hechos: 'F2·P6 Hechos y suposiciones',
  rcic: 'F2·P8 RCIC. y EEIA.',
  potencia: 'F3·P1 Potencia relativa de combate',
  decision: 'F5·P1 Ventajas y desventajas',
  riesgo: 'F6·P3 Riesgos',
  anexo: 'F7·P1 Anexo',
}
const ROT_G3 = {
  guiaInicial: 'F1·P5 Guía Inicial del Comandante',
  entrelazados: 'F2·P1 Conceptos entrelazados',
  tareas: 'F2·P3 Tareas específicas, implícitas y esenciales',
  limitaciones: 'F2·P5 Limitaciones',
  hechos: 'F2·P6 Hechos y suposiciones',
  rcic: 'F2·P8 RCIC. y EEIA.',
  mision: 'F2·P12 Reexpresión de la misión',
  prep1: 'F1·P7 Orden Preparatoria N° 1',
  prep2: 'F2·P17 Orden Preparatoria N° 2',
  prep3: 'F6·P4 Orden Preparatoria N° 3',
  potencia: 'F3·P1 Potencia relativa de combate',
  concepto: 'F3·P4 Concepto amplio de la operación',
  coa: 'F3·P6 Curso de acción propio',
  eventos: 'F4·P4 Eventos críticos y puntos de decisión',
  metodo: 'F4·P5 Método del Juego de Guerra',
  decision: 'F5·P1 Matriz de decisión',
  opord: 'F7·P1 Orden General de Operaciones',
}
const ROT_CMTE = {
  aprecCmte: 'F1·P3 Apreciación activa del Comandante',
  guiaInicial: 'F1·P6 Guía Inicial del Comandante',
  prioridadRcic: 'F2·P8 Prioridad a los RCIC. y EEIA.',
  intencion: 'F2·P14 Intención Inicial del Comandante',
  guiaPlanificacion: 'F2·P15 Guía de Planificación del Comandante',
  seleccionCoa: 'F3·P8 Cursos de acción que pasan al Juego de Guerra',
  decisionCmte: 'F6·P1 Decisión del Comandante',
  guiaFinal: 'F6·P2 Guía de Planificación Final',
  aprobacionOgo: 'F7·P2 Revisión y aprobación de las órdenes',
}
const ROT_JEM = {
  lineaTiempoAct: 'F2·P10 Línea de Tiempo actualizada',
  orientacionEM: 'F2·P13 Orientación del Estado Mayor del Análisis de la Misión',
  normasEval: 'F2·P16 Normas de Evaluación de los Cursos de Acción',
  libreto: 'F4·P1 Libreto del JEM. para el Juego de Guerra',
  rolExposiciones: 'F5·P3 Rol de exposiciones para la toma de decisiones',
}
const BLOQUES = (ctx) => {
  const picb = obj(ctx.calco?.picb)
  const g3 = g3De(ctx)
  const G = (g) => hojasDe(ctx, g)
  return {
    cmte: { rot: 'EL COMANDANTE', datos: { ...obj(cmteDe(ctx)), guiaInicial: g3.guiaInicial, entrelazados: undefined }, nombres: ROT_CMTE },
    jem: { rot: 'EL JEFE DE ESTADO MAYOR', datos: obj(jemDe(ctx)), nombres: ROT_JEM },
    g1: { rot: 'G-1 PERSONAL', datos: G('g1'), nombres: ROT_G },
    g2: { rot: 'G-2 INTELIGENCIA (PICB)', datos: { vacios: picb.ht4, opciones: picb.ht15, objetivos: picb.ht16, prioridadCAE: picb.ht18 }, nombres: { vacios: 'H.T. 4 Vacíos de inteligencia y suposiciones', opciones: 'H.T. 15 Opciones del enemigo', objetivos: 'H.T. 16 Objetivos y estado final del enemigo', prioridadCAE: 'H.T. 18 Prioridad de los CC.AA. del enemigo' } },
    g3: { rot: 'G-3 OPERACIONES', datos: g3, nombres: ROT_G3 },
    g4: { rot: 'G-4 LOGÍSTICA', datos: G('g4'), nombres: ROT_G },
    g5: { rot: 'G-5 ASUNTOS CIVILES Y GOBIERNO MILITAR', datos: G('g5'), nombres: ROT_G },
    eme: { rot: 'EME. ESTADO MAYOR ESPECIAL', datos: G('eme'), nombres: ROT_G },
  }
}
// Lo que ya hicieron los demás, como texto (para la IA). `quienes`: qué bloques; `sin`: ids a no repetir.
export function contenidoDe(ctx = {}, quienes = ['cmte', 'jem', 'g1', 'g2', 'g3', 'g4', 'g5', 'eme'], sin = [], max = 700) {
  const B = BLOQUES(ctx)
  const out = []
  for (const q of quienes) {
    const b = B[q]
    if (!b) continue
    const L = []
    for (const [id, v] of Object.entries(obj(b.datos))) {
      if (sin.includes(id) || id.startsWith('_') || !conContenido(v)) continue
      if (['lineaTiempo', 'progPlaneamiento'].includes(id)) continue
      const t = volcar(v, max)
      if (t) L.push(`${b.nombres?.[id] || id}:\n${t}`)
    }
    if (L.length) out.push(`${b.rot}\n${L.join('\n')}`)
  }
  return out.join('\n\n')
}

// El resumen de lo que ordenó el Comandante y de lo que dispuso el JEM, para TODAS las demás
// secciones (va al pedido de su IA: la Intención y las guías son lo primero que lee un G).
export function ordenesDelMando(ctx = {}) {
  const c = cmteDe(ctx)
  const j = jemDe(ctx)
  const g3 = g3De(ctx)
  const L = []
  const una = (rot, v) => {
    if (!conContenido(v)) return
    const t = volcar(v, 1200)
    if (t) L.push(`${rot}:\n${t}`)
  }
  una(ROT_CMTE.intencion, c.intencion)
  una(ROT_CMTE.aprecCmte, c.aprecCmte)
  una(ROT_CMTE.guiaInicial, g3.guiaInicial)
  una(ROT_CMTE.prioridadRcic, c.prioridadRcic)
  una(ROT_CMTE.guiaPlanificacion, c.guiaPlanificacion)
  una(ROT_CMTE.seleccionCoa, c.seleccionCoa)
  una(ROT_CMTE.decisionCmte, c.decisionCmte)
  una(ROT_CMTE.guiaFinal, c.guiaFinal)
  una(ROT_JEM.normasEval, j.normasEval)
  una(ROT_JEM.lineaTiempoAct, j.lineaTiempoAct)
  una(ROT_JEM.orientacionEM, j.orientacionEM)
  una(ROT_JEM.libreto, j.libreto)
  una(ROT_JEM.rolExposiciones, j.rolExposiciones)
  return L.join('\n\n')
}

// ─── Lo que viene de la Orden superior y de las hojas del G-3 ────────────────────────
export const lineasDe = (s) => lista(String(s || '').replace(/;\s*/g, '\n'))
export function cae(ctx = {}) {
  try {
    return (typeof ctx.resumenG2 === 'function' && ctx.resumenG2(obj(ctx.calco?.picb))) || {}
  } catch {
    return {}
  }
}
export function fasesCOA(ctx = {}) {
  return (Array.isArray(ctx.calco?.fasesCOA?.propio) ? ctx.calco.fasesCOA.propio : []).map((f) => limpio(f?.nombre)).filter(Boolean)
}
// Los cursos de acción propios que ya tiene el Estado Mayor: los que nombraron las secciones en
// «Ventajas y desventajas» (F5·P1) y el que enunció el G-3 (F3·P6).
export function cursosDeAccion(ctx = {}) {
  const vistos = new Map()
  const suma = (n) => {
    const t = limpio(sinMarcaIA(n))
    if (t && !vistos.has(claveTexto(t))) vistos.set(claveTexto(t), t)
  }
  const g3 = g3De(ctx)
  suma(obj(g3.coa)['Denominación del CAP'])
  for (const g of ['g1', 'g4', 'g5', 'eme']) for (const f of filasDe(hojasDe(ctx, g).decision)) suma(col(f, /^curso/i))
  for (const f of filasDe(g3.decision)) suma(col(f, /^curso/i))
  return [...vistos.values()]
}
// ¿Cada sección ya presentó su apreciación? (F2·P13 y, si no, la F1·P3)
export function estadoApreciaciones(ctx = {}) {
  const picb = obj(ctx.calco?.picb)
  const g3 = g3De(ctx)
  const de = (g) => {
    const h = hojasDe(ctx, g)
    return { aprecOrientacion: conContenido(h.aprecOrientacion), aprecActiva: conContenido(h.aprecActiva) }
  }
  return SECCIONES.map((s) => {
    let act = false
    let ori = false
    if (s.id === 'g2') ori = act = conContenido(picb.ht4) || conContenido(picb.ht15) || conContenido(picb.ht18)
    else if (s.id === 'g3') ori = act = conContenido(g3.mision) || conContenido(g3.tareas)
    else {
      const x = de(s.id)
      act = x.aprecActiva
      ori = x.aprecOrientacion
      if (s.id === 'g4') act = act || conContenido(hojasDe(ctx, 'g4').aprecActiva)
    }
    return { ...s, actual: ori, activa: act }
  })
}

// ─── El Programa General de Planeamiento (de la Línea Inicial de Tiempo) ─────────────
export function programa(ctx = {}) {
  const lt = obj(g3De(ctx).lineaTiempo)
  const eventos = typeof ctx.eventosPrograma?.length === 'number' ? ctx.eventosPrograma : []
  let plazos = {}
  try {
    plazos = (typeof ctx.plazosPrograma === 'function' && ctx.plazosPrograma(lt)) || {}
  } catch {
    plazos = {}
  }
  const resp = obj(ctx.responsablesPrograma)
  const ev = eventos.length ? eventos : Object.keys(resp)
  return ev.map((e) => ({ evento: e, responsable: resp[e] || '', plazos: String(plazos[e] || '').replace(/\s*\n+\s*/g, '  →  ') }))
}
export const plazoDe = (ctx, re) => programa(ctx).find((p) => re.test(p.evento))?.plazos || ''
export const fila = (cols, valores) => Object.fromEntries(cols.map((c, i) => [c, valores[i] ?? '']))
export { limpio, texto, sinMarcaIA, lista, esObj }
