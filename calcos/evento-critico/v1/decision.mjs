// 🎖️ La DECISIÓN DEL COMANDANTE en la F4·P6-7 Matriz de sincronización (Sergio, 08-11-2026: «después de sometido a
// juego de guerra el comandante se decidió por el CAP 1 o CAP 2, para que en base a eso ya se desarrolle el resto del
// planeamiento y recién se rellene» la matriz). Sin dependencias del compilado: se prueba en Node.
//
// Dónde queda: `g3._caps.decision = { cap, t }`. Todos los que escriben `g3._caps` (cap-propios/v1/proponer.mjs)
// copian lo que ya tenía, así que la decisión sobrevive a los cambios de CAP. La lee también `capAprobado`
// (orden-preparatoria/v1/prep.mjs): la Orden Preparatoria N° 3 y la Orden General de Operaciones van con el CAP decidido.
//
// La matriz de la hoja es la del CAP decidido (`g3.sincro._cap`). Se llena sólo con ese CAP a la vista: las columnas,
// 🌱 y la IA salen del CAP activo. Si la hoja tenía la matriz de otro CAP, queda guardada en `g3.sincro._matrices[n]`
// y vuelve si se decide ese CAP. La rejilla sólo lee las casillas «FILA|COLUMNA»: lo que empieza con «_» no se ve ni
// va al Word (como `_cols` y `_evento`).
import { capActivo, fasesDeCAP, romano } from './modelo.mjs?v=decision20261108'

export const HOJA = 'sincro'
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')

export function decisionDe(g3) {
  const d = g3?._caps?.decision
  const n = Number(d?.cap)
  return n === 1 || n === 2 ? { cap: n, t: d.t || null } : null
}

// Las casillas de la matriz («FILA|COLUMNA»); las claves con «_» son de la Mesa.
export const esCasilla = (k) => typeof k === 'string' && !k.startsWith('_') && k.includes('|')
export function escritas(valor) {
  return esObj(valor) ? Object.keys(valor).filter((k) => esCasilla(k) && String(valor[k] ?? '').trim()).length : 0
}

// ¿Se llena la matriz? Sólo con la decisión tomada y ese CAP a la vista.
export function estado(ctx = {}) {
  const g3 = ctx.g3 || {}
  const d = decisionDe(g3)
  const activo = capActivo(g3)
  return { decidido: d ? d.cap : null, activo, abierta: !!d && d.cap === activo, motivo: !d ? 'sin-decision' : d.cap !== activo ? 'otro-cap' : null }
}
// Para el compilado: si algo falla, la matriz se ve (nunca se esconde por un error).
export function matrizAbierta(ctx) {
  try {
    return estado(ctx).abierta
  } catch {
    return true
  }
}

// El nombre corto del CAP: su «Denominación del CAP» (F3·P6) sin «CAP n —» ni las marcas; si no tiene, su forma.
const FORMAS = { area: 'Defensa de área', movil: 'Defensa móvil', area_alterna: 'Defensa de área (otra avenida)', ruptura: 'Ruptura y penetración', envolvimiento: 'Envolvimiento', desbordamiento: 'Desbordamiento', retardatriz: 'Acción retardatriz', repliegue: 'Repliegue' }
export function nombreCAP(g3 = {}, n) {
  const coa = n === capActivo(g3) ? g3?.coa : g3?._caps?.guardados?.[n]?.coa
  const k = esObj(coa) ? Object.keys(coa).find((x) => /^denominacion/i.test(sinTildes(x).trim())) : null
  let t = String((k && coa[k]) || '')
    .replace(/\[(IA|Mesa)[^\]]*\]/gi, '')
    .replace(/^\s*CAP\s*-?\s*(N[°º.]?\s*)?\d+\s*[—–:.-]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) {
    const f = g3?._caps?.formas?.[n]
    t = typeof f === 'string' ? FORMAS[f] || '' : String(f?.nom || '')
  }
  return t.length > 46 ? `${t.slice(0, 44).trim()}…` : t
}

// La matriz de la hoja pasa a ser la del CAP n. `dueno`: de qué CAP es la que tiene (`_cap`; si no lo dice, la que se
// llenó con el CAP que estaba a la vista). `nFases`: las fases del CAP n (columnas de una matriz vacía, como 🌱).
export function matrizPara(valor, n, { dueno, nFases = 0 } = {}) {
  const v = esObj(valor) ? valor : {}
  const de = v._cap === 1 || v._cap === 2 ? v._cap : dueno === 1 || dueno === 2 ? dueno : null
  let out
  if (de === n || de == null) out = { ...v }
  else {
    // Lo del CAP dueño (las casillas y sus columnas) se guarda aparte; lo demás de la hoja (_evento…) queda.
    const suya = {}
    const resto = {}
    for (const [k, x] of Object.entries(v)) (esCasilla(k) || k === '_cols' ? suya : resto)[k] = x
    const matrices = esObj(v._matrices) ? { ...v._matrices } : {}
    if (escritas(suya)) matrices[de] = suya
    const vuelve = esObj(matrices[n]) ? matrices[n] : {}
    delete matrices[n]
    out = { ...resto, ...vuelve }
    delete out._matrices
    if (Object.keys(matrices).length) out._matrices = matrices
  }
  // Una matriz vacía arranca con las columnas del CAP decidido (las mismas que pone 🌱: «FASE 1»…).
  if (!escritas(out) && nFases > 0) out._cols = Array.from({ length: nFases }, (_, i) => `FASE ${i + 1}`)
  out._cap = n
  return out
}

// 🎖️ Decidir. `activoAntes`: el CAP a la vista ANTES de pasar al decidido (de él es la matriz sin dueño).
export function conDecision(g3 = {}, n, { activoAntes, nFases = 0, t = new Date().toISOString() } = {}) {
  if (n !== 1 && n !== 2) return g3
  const sincro = matrizPara(g3?.sincro, n, { dueno: activoAntes ?? capActivo(g3), nFases })
  return { ...g3, _caps: { ...(g3?._caps || {}), decision: { cap: n, t } }, sincro }
}
// ↺ Cambiar la decisión: se borra; la matriz queda como está (es del CAP que estaba decidido, `_cap`).
export function sinDecision(g3 = {}) {
  if (!g3?._caps?.decision) return g3
  const caps = { ...g3._caps }
  delete caps.decision
  return { ...g3, _caps: caps }
}

// Lo que la matriz del otro CAP tiene guardado (para avisarlo).
export function guardadaDe(valor, n) {
  return escritas(valor?._matrices?.[n])
}

// ─── El resto del planeamiento ─────────────────────────────────────────────────────────────────────────────────
const VERDE = { fontSize: 13, color: '#bfffd9', background: 'rgba(125,255,176,0.10)', border: '1px solid rgba(125,255,176,0.45)', borderRadius: 7, padding: '7px 9px', lineHeight: 1.4, fontWeight: 700 }
const AMARILLO = { fontSize: 13, color: '#ffe3a3', background: 'rgba(255,212,121,0.12)', border: '1px solid rgba(255,212,121,0.5)', borderRadius: 7, padding: '7px 9px', lineHeight: 1.4, fontWeight: 700 }
// Las hojas que vienen DESPUÉS de la F4·P6-7 en el catálogo del G-3 (F4·P7, F5, F6, F7): una línea con el CAP decidido.
export function avisoHoja(id, g3 = {}, catalogo = []) {
  try {
    const ids = (Array.isArray(catalogo) ? catalogo : []).flatMap((f) => (f?.hojas || []).map((h) => h?.id))
    const i = ids.indexOf(HOJA)
    const j = ids.indexOf(id)
    if (i < 0 || j <= i) return null
    const e = estado({ g3 })
    if (!e.decidido) return { texto: '⚠️ Falta la decisión del Comandante: CAP 1 o CAP 2 (F4·P6-7).', estilo: AMARILLO }
    if (e.motivo === 'otro-cap') return { texto: `⚠️ A la vista está el CAP ${e.activo}, pero el Comandante decidió el CAP ${e.decidido} (F4·P6-7).`, estilo: AMARILLO }
    const nom = nombreCAP(g3, e.decidido)
    return { texto: `🎖️ CAP ${e.decidido}${nom ? ` · ${nom}` : ''} — decidido por el Comandante.`, estilo: VERDE }
  } catch {
    return null
  }
}

// La F4·P6-7 resaltada en la lista de documentos del G-3.
export function filaDocumento(id, g3 = {}) {
  if (id !== HOJA) return null
  let d = null
  try {
    d = decisionDe(g3)
  } catch {
    d = null
  }
  return {
    estilo: { background: 'rgba(255,212,121,0.16)', border: '1.5px solid #ffd479', borderLeft: '5px solid #ffd479', borderRadius: 7, color: '#fff', fontWeight: 700 },
    chapa: d ? `🎖️ CAP ${d.cap}` : '🎖️ DECISIÓN',
    chapaEstilo: { flex: '0 0 auto', background: d ? '#7dffb0' : '#ffd479', color: '#1a1405', borderRadius: 5, padding: '2px 7px', font: '800 11.5px Arial', whiteSpace: 'nowrap' },
    titulo: d ? `El Comandante decidió el CAP ${d.cap}` : 'Acá el Comandante decide el CAP (después del Juego de Guerra)',
  }
}

// 🤖 El pedido de la IA de la F4·P6-7 lleva la decisión y las fases del CAP decidido (las columnas de la matriz).
export function bloqueIA(ctx = {}) {
  const e = estado(ctx)
  if (!e.decidido) return ''
  const g3 = ctx.g3 || {}
  const nom = nombreCAP(g3, e.decidido)
  const L = [
    '# DECISIÓN DEL COMANDANTE (después del Juego de Guerra)',
    '',
    `El Comandante decidió el CAP ${e.decidido}${nom ? ` «${nom}»` : ''}. Esta matriz es la de ESE curso de acción: cada columna es una de sus fases y cada casilla, lo que hace ese sistema operativo en esa fase del CAP ${e.decidido} (no del otro CAP). Aprobada, pasa a ser la MATRIZ DE EJECUCIÓN.`,
  ]
  const fases = fasesDeCAP(ctx, e.decidido)
  const cols = Array.isArray(g3.sincro?._cols) && g3.sincro._cols.length ? g3.sincro._cols : null
  if (fases.length) {
    L.push('', 'Sus fases (en este orden, una por columna):')
    fases.forEach((f, k) => {
      const q = [f?.tarea, f?.proposito].filter((x) => String(x || '').trim()).join(', ')
      L.push(`- ${cols?.[k] ? `«${cols[k]}» = ` : ''}FASE ${romano(k + 1)}${f?.nombre ? ` — ${f.nombre}` : ''}${q ? `: ${q}` : ''}`)
    })
  }
  const ev = g3.sincro?._evento
  if (ev && Number(ev.cap) === e.decidido && Number.isInteger(ev.azul)) L.push('', `Evento crítico jugado: la FASE ${romano(ev.azul + 1)} del CAP ${e.decidido} contra el ${ev.coa === 'peligroso' ? 'CAE más peligroso' : 'CAE más probable'}.`)
  return L.join('\n')
}
export function pedidoDecision(r, hoja, ctx = {}) {
  if (r && typeof r.then === 'function') return r.then((x) => pedidoDecision(x, hoja, ctx))
  try {
    if (hoja?.id !== HOJA || !r?.ok || typeof r.prompt !== 'string') return r
    const b = bloqueIA(ctx)
    if (!b) return r
    const marca = '\n\n---\n\n# CÓMO CONTESTAR'
    const i = r.prompt.lastIndexOf(marca)
    return { ...r, prompt: i >= 0 ? `${r.prompt.slice(0, i)}\n\n---\n\n${b}${r.prompt.slice(i)}` : `${r.prompt}\n\n---\n\n${b}` }
  } catch {
    return r
  }
}
