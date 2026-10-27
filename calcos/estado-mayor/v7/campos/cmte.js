// ⭐ EL COMANDANTE — lo que el motor necesita para trabajar su F6·P2 GUÍA DE PLANIFICACIÓN FINAL
// en «📋 Mis hojas» con la forma del modelo del TEXTO PMTD 2017 (Parte Tercera, Capítulo II
// «Guía del Comandante», «Guía de Planificación Final»).
//
// Lo pidió Sergio el 27-10-2026 con el Word que bajó de la F6·P2 del CE-I («lo que me está
// generando la aplicación está muy mal, corregí de acuerdo al modelo»): la hoja era un cuadro
// «Área / Sección · Guía final impartida · Plazo» y el Word salía como una lista de tareas por
// sección (A.- G-1 … I.- Defensa Antiaérea). El modelo del PMTD 2017 es otro: el Comandante, con
// el curso de acción ya decidido, le dice a su Estado Mayor
//
//   I.-   DECISIÓN.
//   II.-  INTENCIÓN DEL COMANDANTE.
//   III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE.
//   IV.-  PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA.
//   V.-   DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES.
//   VI.-  DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.
//
// 🌱 trae lo que ya decidió el Comandante (F6·P1, F2·P14, F2·P8) y lo que preparó el G-3 (la
// Matriz de decisión F5·P1, la Matriz de sincronización F4·P6-7, el tipo de orden y de ensayo de
// la F6·SAL y sus RCIC); la IA completa con todo el expediente; el Word sale con el formato
// militar común (membrete, firma del Comandante). `soloDocumentos`: las demás hojas del
// Comandante siguen como estaban.
//
// Sin DOM: se prueba en Node (calcos/pruebas/guia-final.mjs).
import { limpio, texto, sinMarcaIA, esObj } from '../motor.js'
import { capAprobado, conceptoDelCAP } from '../../../orden-preparatoria/v1/prep.mjs'

export const ID = 'cmte'
export const COLOR = '#dc2626'
export const FUENTE = 'TEXTO PMTD 2017, Parte Tercera, Capítulo II «Guía del Comandante» — Guía de Planificación Final'

// ─── EL DOCUMENTO: la forma del modelo, apartado por apartado y en orden ─────────────
// Las instrucciones del modelo van LITERALES en `ayuda` (así las ve el oficial y la IA).
export const GUIA_FINAL = {
  esquema: 'guia-final-v1',
  titulo: 'GUÍA DE PLANIFICACIÓN FINAL',
  archivo: 'Guia_de_Planificacion_Final',
  plantilla: null,
  fuente: 'modelo de Guía de Planificación Final del TEXTO PMTD 2017',
  modelo: 'Guía de Planificación Final del Comandante — modelo del TEXTO PMTD 2017 (Parte Tercera, Capítulo II), con el formato militar común de la Mesa',
  nivel: 'principal',
  sinNumeroTitulo: true,
  preliminares: [],
  arbol: [
    { id: 'decision', t: 'DECISIÓN.', ayuda: 'El Comandante debe materializar su decisión respecto a qué curso de acción propio es el elegido para articular el Plan u Orden de Operaciones' },
    { id: 'intencion', t: 'INTENCIÓN DEL COMANDANTE.', ayuda: 'El Comandante podrá mejorar su Intención en base a las orientaciones posteriores realizadas o mantener como definitiva su intención inicial; cualquiera sea el caso, el Comandante deberá hacer conocer su Intención' },
    { id: 'rcic', t: 'REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE.', ayuda: 'El Comandante podrá establecer nuevos RCIC. que considere pertinentes para poder llenar los vacíos de información que se puedan presentar durante las etapas de preparación y ejecución de las operaciones; éstos podrán ser Requerimientos Prioritarios de Inteligencia relacionados al enemigo, al terreno y CC.MM. o Requerimientos de Información de las Fuerzas Amigas (RIFA.)' },
    { id: 'prioridades', t: 'PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA.', ayuda: 'Siempre y cuando existan las condiciones y la necesidad, el Comandante podrá determinar algunas prioridades de apoyo de las Unidades de apoyo de combate o de apoyo de servicio de combate hacia las Unidades de maniobra en algunas fases' },
    { id: 'ordenes', t: 'DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES.', ayuda: 'El Comandante dispondrá algunas medidas para la elaboración de los planes u órdenes y sus respectivos anexos, como tipo de orden, cantidad de anexos, plazos en tiempo para su elaboración, etc., siempre y cuando no lo haya hecho en la Guía de Planificación' },
    { id: 'ensayos', t: 'DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.', ayuda: 'El Comandante podrá dar algunas disposiciones respecto al tipo de ensayo y la técnica usada, siempre y cuando no lo haya hecho en su Guía de Planificación' },
  ],
  obligatorios: [
    { id: 'decision', txt: 'I.- Falta la DECISIÓN: qué curso de acción propio eligió el Comandante.', tipo: 'err' },
    { id: 'intencion', txt: 'II.- Falta la INTENCIÓN DEL COMANDANTE (mejorada o la inicial como definitiva).', tipo: 'err' },
    { id: 'rcic', txt: 'III.- Faltan los RCIC. para la preparación y la ejecución.' },
    { id: 'prioridades', txt: 'IV.- Faltan las prioridades para los sistemas operativos del campo de batalla.' },
    { id: 'ordenes', txt: 'V.- Faltan las disposiciones sobre la elaboración de la orden (tipo de orden, anexos, plazo).' },
    { id: 'ensayos', txt: 'VI.- Faltan las disposiciones sobre los ensayos (tipo de ensayo y técnica).' },
  ],
}

// ─── Doctrina (va a la IA) ───────────────────────────────────────────────────────────
export const DOCTRINA = [
  `${FUENTE}: «En la fase que corresponde a la Aprobación de los Cursos de Acción, el Comandante arriba a una decisión respecto a las recomendaciones realizadas por su Estado Mayor o Plana Mayor, sobre el curso de acción que se convertirá en el articulador del Plan o de la Orden de Operaciones; para materializar esta información y otra existente el Comandante emite en forma verbal o escrita la Guía de Planificación Final.»`,
  'La Guía de Planificación Final incluye (PMTD 2017): la decisión sobre el curso de acción propio seleccionado; la intención del Comandante mejorada (si es necesario); nuevos requerimientos críticos de información para apoyar la ejecución; asesoramiento adicional o prioridades para actividades del sistema operativo del campo de batalla; la preparación de órdenes y ensayos.',
  'Fase VI del PMTD — Aprobación del curso de acción: 1.° paso, decisión del Comandante; 2.° paso, Guía de Planificación Final; 3.° paso, determinar el nivel de riesgo residual (RO-06-01-04); 4.° paso, Orden Preparatoria N° 3, que el Estado Mayor emite «basado en la decisión del Comandante y en la Guía de Planificación Final».',
  'El curso de acción propio por el cual se decide el Comandante constituye la base sobre la cual se redactará el concepto de la operación en la siguiente fase del PMTD (elaborar planes y órdenes).',
  'Ejemplo del modelo para la DECISIÓN: «Señores miembros de la Plana Mayor, mi decisión es que el Curso de Acción Propio No. 2 es el más adecuado para cumplir con la misión asignada.»',
  'Ejemplo del modelo para la ELABORACIÓN DE LA ORDEN: «La orden a elaborar será una Orden de Operaciones con todos sus Anexos, no deseo que exista un Anexo sobre la Organización de la Tarea, esta información deberá encontrarse en el documento principal, el documento deberá encontrarse listo para su emisión el D-3 (0800).»',
  'RCIC (PMTD 2017): deben ser DIEZ O MENOS; van solamente en el párrafo de información esencial de la Orden. Pueden ser Requerimientos Prioritarios de Inteligencia (enemigo, terreno y CC.MM.) o Requerimientos de Información de las Fuerzas Amigas (RIFA.).',
  'Sistemas operativos del campo de batalla (Matriz de sincronización del PMTD 2017): inteligencia, maniobra, apoyo de fuegos, defensa antiaérea, movilidad / contramovilidad / supervivencia (ingeniería), apoyo de servicio de combate y comando y control.',
  'Encabezado del modelo: (CLASIFICACIÓN DE SEGURIDAD) · Unidad Superior · Unidad Considerada, PC., lugar, fecha y hora · Cmte. · No. / Clave · GUÍA DE PLANIFICACIÓN FINAL · …párrafos I a VI… · EL COMANDANTE DE UNIDAD · Distribución. La Mesa pone el membrete y la firma.',
]
export const doctrinaParaIA = () => DOCTRINA.map((x) => `- ${x}`).join('\n')

// ─── Lo que ya está en el ejercicio ──────────────────────────────────────────────────
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const filasDe = (h) => (Array.isArray(h) ? h.filter((f) => esObj(f) && Object.entries(f).some(([k, x]) => !k.startsWith('_') && limpio(sinMarcaIA(x)))) : [])
// El valor de la casilla cuyo rótulo EMPIEZA con alguno de `claves` (sin tildes ni mayúsculas).
export function casilla(obj, ...claves) {
  if (!esObj(obj)) return ''
  for (const k of claves) {
    const hit = Object.keys(obj).find((x) => !x.startsWith('_') && norm(x).startsWith(norm(k)))
    if (hit && limpio(sinMarcaIA(obj[hit]))) return texto(sinMarcaIA(obj[hit]))
  }
  return ''
}
const plano = (s) => limpio(String(s ?? '').replace(/\s*\n\s*/g, ' '))
const punto = (s) => (s && !/[.:;!?…»]$/.test(s) ? `${s}.` : s)
const g3De = (ctx = {}) => (esObj(ctx.calco?.g3) ? ctx.calco.g3 : {})
const hojasCmte = (ctx = {}) => (esObj(ctx.hojas) ? ctx.hojas : {})
export const unidadDe = (ctx = {}) => limpio(ctx?.ordenSup?.unidadPropia || ctx?.unidad || ctx?.ordenSup?.unidad || '')

// El nombre del CAP n (F3·P6 del activo o del guardado de cap-propios).
function nombreCap(g3, n) {
  const c = g3?._caps || {}
  const activo = c.activo === 2 ? 2 : 1
  const coa = n === activo ? g3?.coa : c.guardados?.[n]?.coa
  return plano(casilla(coa, 'Denominación del CAP')).replace(/^CAP\s*-?\s*N?°?\s*\d+\s*[—–:-]?\s*/i, '')
}
// El número del CAP en un texto («CAP-2», «Curso de Acción Propio N° 2», «el 2»).
export function numeroDeCap(s) {
  const t = sinTildes(String(s ?? '')).toUpperCase()
  const m = t.match(/\bCAP\s*-?\s*(?:N[°ºO]?\.?\s*)?(\d+)/) || t.match(/\bPROPIO\s*(?:N[°ºO]?\.?\s*)?(\d+)/) || t.match(/^\s*(\d+)\s*$/)
  return m ? Number(m[1]) : null
}

// I.- DECISIÓN: la F6·P1 del Comandante; si no la llenó, el CAP que el Estado Mayor le
// recomendó en la Matriz de decisión (F5·P1).
export function decisionTexto(ctx = {}) {
  const h = hojasCmte(ctx)
  const g3 = g3De(ctx)
  const elegido = casilla(h.decisionCmte, 'Curso de acción aprobado')
  const razon = casilla(h.decisionCmte, 'Razón de la decisión')
  const mods = casilla(h.decisionCmte, 'Modificaciones que ordena')
  const C = capAprobado(g3, ctx.calco?.fasesCOA || {})
  const n = numeroDeCap(elegido) || (!elegido && C.recomendado ? C.n : null)
  if (!elegido && !n) return ''
  const nom = n ? nombreCap(g3, n) : ''
  const cual = n ? `el Curso de Acción Propio N° ${n}${nom ? ` «${nom}»` : ''}` : `el curso de acción ${plano(elegido)}`
  const L = [`Señores miembros del Estado Mayor, mi decisión es que ${cual}${!elegido && C.recomendado ? ', el que me recomendó el Estado Mayor en la Matriz de decisión,' : ''} es el más adecuado para cumplir con la misión asignada; será el que articule la Orden de Operaciones.`]
  if (elegido && n && plano(elegido).length > 12 && !/^\s*CAP\s*-?\s*N?°?\s*\d+\s*\.?\s*$/i.test(elegido)) L.push(punto(plano(elegido)))
  if (razon) L.push(`Lo decido porque ${punto(plano(razon).replace(/^(porque|por que)\s+/i, '').replace(/^./, (x) => x.toLowerCase()))}`)
  if (mods) L.push(`Ordeno las siguientes modificaciones al curso de acción: ${punto(plano(mods).replace(/^./, (x) => x.toLowerCase()))}`)
  return L.join('\n')
}

// II.- INTENCIÓN: la Intención Inicial del Comandante (F2·P14); si no la llenó, la que ya
// escribió el G-3 en la Orden Preparatoria N° 3.
export function intencionTexto(ctx = {}) {
  const h = hojasCmte(ctx)
  const prop = casilla(h.intencion, 'Propósito')
  const tareas = casilla(h.intencion, 'Tareas clave')
  const fin = casilla(h.intencion, 'Estado Final')
  if (prop || tareas || fin) {
    const L = []
    if (prop) L.push(`Propósito: ${punto(plano(prop))}`)
    if (tareas) L.push(`Tareas clave: ${punto(plano(tareas))}`)
    if (fin) L.push(`Estado final deseado: ${punto(plano(fin))}`)
    return L.join('\n')
  }
  return casilla(g3De(ctx).prep3, 'III.- EJECUCIÓN · Intención', 'III.- EJECUCION · Intencion')
}

// III.- RCIC: los que el Comandante priorizó (F2·P8); si no, los RCIC del G-3 (F2·P8).
export function rcicTexto(ctx = {}) {
  const h = hojasCmte(ctx)
  const prior = filasDe(h.prioridadRcic)
    .map((f, i) => ({ req: casilla(f, 'Requerimiento'), quien: casilla(f, 'Quién lo propone', 'Quien'), p: casilla(f, 'Prioridad'), i }))
    .filter((x) => x.req)
  if (prior.length) {
    const num = (x) => (Number.isFinite(parseFloat(x.p)) ? parseFloat(x.p) : 99)
    return prior
      .sort((a, b) => num(a) - num(b) || a.i - b.i)
      .map((x) => `- ${plano(x.req)}${x.p || x.quien ? ` (${[x.p ? `prioridad ${plano(x.p)}` : '', x.quien ? `lo propuso ${plano(x.quien)}` : ''].filter(Boolean).join('; ')})` : ''}`)
      .join('\n')
  }
  const g3 = filasDe(g3De(ctx).rcic)
    .map((f) => ({ tipo: casilla(f, 'Tipo'), req: casilla(f, 'Requerimiento'), dec: casilla(f, '¿Qué decisión', 'Que decision'), plazo: casilla(f, 'Plazo') }))
    .filter((x) => x.req && !/EEIA/i.test(x.tipo))
  return g3.map((x) => `- ${plano(x.req)}${x.dec || x.plazo ? ` (${[x.dec ? `sostiene: ${plano(x.dec)}` : '', x.plazo ? `no después de ${plano(x.plazo)}` : ''].filter(Boolean).join('; ')})` : ''}`).join('\n')
}

// IV.- PRIORIDADES: lo que el G-3 dejó en la Matriz de sincronización (F4·P6-7) para los
// sistemas de apoyo, fase por fase; si no, los fuegos y la ingeniería del concepto del CAP.
const NOMBRE_SOCB = { INTELIGENCIA: 'Inteligencia', 'APOYO DE FUEGOS': 'Apoyo de fuegos', 'ADA.': 'Defensa antiaérea', 'MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA (ING.)': 'Movilidad, contramovilidad y supervivencia (ingeniería)', 'APOYO DE SERVICIO DE COMBATE': 'Apoyo de servicio de combate', C2: 'Comando y control' }
export function prioridadesTexto(ctx = {}) {
  const g3 = g3De(ctx)
  const s = esObj(g3.sincro) ? g3.sincro : {}
  const cols = Array.isArray(s._cols) && s._cols.length ? s._cols : ['FASE I', 'FASE II', 'FASE III', 'FASE IV']
  const L = []
  for (const [fila, nom] of Object.entries(NOMBRE_SOCB)) {
    const xs = cols.map((c) => [c, plano(sinMarcaIA(s[`${fila}|${c}`]))]).filter(([, x]) => x)
    if (xs.length) L.push(`- ${nom}: ${xs.map(([c, x]) => `${plano(c)}: ${x.replace(/[.;]$/, '')}`).join('; ')}.`)
  }
  if (L.length) return L.join('\n')
  const C = capAprobado(g3, ctx.calco?.fasesCOA || {})
  const fuegos = casilla(C.concepto, 'Fuegos')
  const ing = casilla(C.concepto, 'Movilidad')
  if (fuegos) L.push(`- Apoyo de fuegos: ${punto(plano(fuegos))}`)
  if (ing) L.push(`- Movilidad, contramovilidad y supervivencia (ingeniería): ${punto(plano(ing))}`)
  return L.join('\n')
}

// V.- ELABORACIÓN DE LA ORDEN y VI.- ENSAYOS: la F6·SAL del G-3 (tipo de orden, tipo de
// ensayo y quiénes participan).
export function ordenesTexto(ctx = {}) {
  const tipo = casilla(g3De(ctx).controlOrden, 'Tipo de orden')
  return tipo ? `La orden a elaborar será: ${punto(plano(tipo))}` : ''
}
export function ensayosTexto(ctx = {}) {
  const co = g3De(ctx).controlOrden
  const tipo = casilla(co, 'Tipo de ensayo')
  const quien = casilla(co, 'Quiénes participan', 'Quienes participan')
  const L = []
  if (tipo) L.push(`Tipo de ensayo: ${punto(plano(tipo))}`)
  if (quien) L.push(`Participantes y momento: ${punto(plano(quien))}`)
  return L.join('\n')
}

export function propuestas(ctx = {}) {
  const campos = {}
  const poner = (id, f) => {
    try {
      const t = f(ctx)
      if (limpio(t)) campos[id] = t
    } catch {}
  }
  poner('decision', decisionTexto)
  poner('intencion', intencionTexto)
  poner('rcic', rcicTexto)
  poner('prioridades', prioridadesTexto)
  poner('ordenes', ordenesTexto)
  poner('ensayos', ensayosTexto)
  return { campos }
}

// ─── Lo que ya entregaron el Comandante y el Estado Mayor ────────────────────────────
export function entregas(ctx = {}) {
  const E = []
  const h = hojasCmte(ctx)
  const g3 = g3De(ctx)
  const cmte = [
    ['F6·P1 Curso de acción aprobado', casilla(h.decisionCmte, 'Curso de acción aprobado')],
    ['F6·P1 Razón de la decisión', casilla(h.decisionCmte, 'Razón de la decisión')],
    ['F6·P1 Modificaciones que ordena', casilla(h.decisionCmte, 'Modificaciones que ordena')],
    ['F2·P14 Intención inicial', intencionTexto({ ...ctx, calco: { ...(ctx.calco || {}), g3: {} } })],
    ['F2·P8 RCIC. priorizados', rcicTexto({ ...ctx, calco: { ...(ctx.calco || {}), g3: {} } })],
  ].filter(([, x]) => limpio(x))
  if (cmte.length) E.push({ de: 'El Comandante (sus hojas)', items: cmte })
  const C = capAprobado(g3, ctx.calco?.fasesCOA || {})
  let concepto = ''
  try {
    concepto = conceptoDelCAP({ g3, fasesCOA: ctx.calco?.fasesCOA || {} })
  } catch {}
  const de3 = [
    ['F5·P1 Recomendado al Comandante', C.recomendado ? `CAP ${C.n}${nombreCap(g3, C.n) ? ` «${nombreCap(g3, C.n)}»` : ''}` : ''],
    ['Concepto del CAP', concepto],
    ['F4·P6-7 Matriz de sincronización (sistemas de apoyo)', prioridadesTexto({ ...ctx, calco: { ...(ctx.calco || {}), g3: { sincro: g3.sincro } } })],
    ['F6·SAL Tipo de orden', casilla(g3.controlOrden, 'Tipo de orden')],
    ['F6·SAL Tipo de ensayo', casilla(g3.controlOrden, 'Tipo de ensayo')],
    ['F6·SAL Quiénes participan del ensayo', casilla(g3.controlOrden, 'Quiénes participan', 'Quienes participan')],
    ['F2·P8 RCIC. de Operaciones', rcicTexto({ ...ctx, hojas: {} })],
  ].filter(([, x]) => limpio(x))
  if (de3.length) E.push({ de: 'El G-3', items: de3 })
  return E
}
export function entregasTexto(ctx = {}) {
  return entregas(ctx)
    .map((e) => `## ${e.de}\n${e.items.map(([k, x]) => `- ${k}: ${sinMarcaIA(x).replace(/\n+/g, ' / ')}`).join('\n')}`)
    .join('\n\n')
}
// Para la IA: lo que la Mesa ya tiene para cada párrafo de la guía (lo mismo que trae 🌱).
export function datosCalco(ctx = {}) {
  const P = propuestas(ctx).campos
  const rot = Object.fromEntries(GUIA_FINAL.arbol.map((n, i) => [n.id, `${['I', 'II', 'III', 'IV', 'V', 'VI'][i]}.- ${n.t}`]))
  return Object.entries(P)
    .map(([k, x]) => `${rot[k]}\n${x}`)
    .join('\n\n')
}

export const GUIAS = {
  guiaFinal: {
    para: 'Es la última guía del Comandante en el PMTD (Fase VI, 2.° paso): con el curso de acción ya decidido, le dice a su Estado Mayor cuál eligió, cuál es su intención definitiva, qué información crítica necesita, qué prioridades de apoyo fija y cómo quiere la orden y los ensayos. Con ella el G-3 emite la Orden Preparatoria N° 3 y el Estado Mayor escribe la Orden de Operaciones. NO es una lista de tareas por sección (G-1, G-2…): tiene los seis párrafos del modelo del PMTD 2017.',
    como: [
      'I.- DECISIÓN: el curso de acción propio elegido, dicho por el Comandante («Señores miembros del Estado Mayor, mi decisión es que el CAP N° 2 es el más adecuado…»), con la razón y las modificaciones que ordena (F6·P1).',
      'II.- INTENCIÓN: la inicial (F2·P14) como definitiva o mejorada con lo que dejaron el juego de guerra y las orientaciones: propósito, tareas clave y estado final deseado.',
      'III.- RCIC.: los que quedan vigentes y los NUEVOS para la preparación y la ejecución (RPI sobre el enemigo, el terreno y CC.MM.; RIFA.). Diez o menos.',
      'IV.- PRIORIDADES: a quién apoyan los fuegos, la ingeniería, la defensa antiaérea y el apoyo de servicio de combate, y en qué fases (sale de la Matriz de sincronización).',
      'V.- ELABORACIÓN DE LA ORDEN: tipo de orden, anexos que lleva (o que no quiere), y para cuándo tiene que estar lista (hora táctica).',
      'VI.- ENSAYOS: tipo de ensayo y técnica, quiénes participan, cuándo y dónde.',
      '🌱 trae lo que ya decidiste y lo que preparó el G-3; la IA completa con TODO el expediente. Lo escrito por vos manda.',
    ],
    ejemplo: '«V.- La orden a elaborar será una Orden de Operaciones con todos sus Anexos; no deseo un Anexo de Organización de la Tarea: va en el documento principal. Lista para su emisión el D-3 (0800).» (PMTD 2017)',
  },
}

export const PRODUCTO = (ctx, hoja) =>
  `Tu producto es la GUÍA DE PLANIFICACIÓN FINAL del Comandante${unidadDe(ctx) ? ` de la ${unidadDe(ctx)}` : ''} (hoja ${hoja?.num || 'F6·P2'} del PMTD, Fase VI «Aprobar el curso de acción», 2.° paso). La escribe el COMANDANTE, en primera persona, dirigida a su Estado Mayor, con el curso de acción YA decidido. Respetá el modelo del TEXTO PMTD 2017, que tiene EXACTAMENTE seis párrafos: I.- DECISIÓN; II.- INTENCIÓN DEL COMANDANTE; III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE; IV.- PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA; V.- DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES; VI.- DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS. NO la armes como una lista de tareas por sección del Estado Mayor (A.- G-1, B.- G-2…, con «Área / Sección», «Guía impartida» y «Plazo»): ésa NO es la forma de este documento. El membrete, la clasificación y la firma los pone la Mesa.`

export const VERIFICACION = [
  'Tiene los seis párrafos del modelo, en este orden y con su contenido: decisión, intención, RCIC., prioridades de los sistemas operativos, elaboración de la orden y ensayos. Ninguno está organizado por sección (G-1, G-2…).',
  'La DECISIÓN nombra UN curso de acción propio (el que figura en la F6·P1 o el recomendado en la F5·P1 del expediente), dicha por el Comandante.',
  'La INTENCIÓN tiene propósito, tareas clave y estado final deseado, y es coherente con la misión y con el curso de acción elegido.',
  'Los RCIC. son diez o menos, cada uno con lo que se necesita saber; los nuevos dicen si son RPI (enemigo, terreno, CC.MM.) o RIFA.',
  'Las PRIORIDADES dicen qué sistema apoya a qué unidad de maniobra y en qué fase; las unidades y fases existen en el expediente.',
  'La ELABORACIÓN DE LA ORDEN dice el tipo de orden, los anexos y el plazo (hora táctica). Los ENSAYOS dicen el tipo, la técnica, quiénes, cuándo y dónde.',
  'Nada inventado: lo que no está en el expediente va como «SIN DATO — verificar».',
]

export function firmaCmte(ctx = {}) {
  const u = unidadDe(ctx)
  return u ? `EL COMANDANTE ${/^(R|B|CE\b|CUERPO)/i.test(u) ? 'DEL' : 'DE LA'} ${u}` : 'EL COMANDANTE'
}

export default {
  id: ID,
  nombre: 'Comandante',
  color: COLOR,
  seccionIA: 'COMANDO de la unidad: escribís como el COMANDANTE (o como su oficial de Estado Mayor que le redacta el documento para que lo firme)',
  // la línea de la sección en el membrete: la de las hojas del Comandante y del JEM (membrete/v1)
  seccionWord: 'EMO/JEM',
  soloDocumentos: true,
  doctrina: doctrinaParaIA,
  datosCalco,
  entregas,
  entregasTexto,
  guias: GUIAS,
  documentos: {
    guiaFinal: {
      def: GUIA_FINAL,
      nota: 'La Guía de Planificación Final se trabaja acá con la forma del modelo del TEXTO PMTD 2017: I.- DECISIÓN, II.- INTENCIÓN DEL COMANDANTE, III.- RCIC., IV.- PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA, V.- ELABORACIÓN DE LOS PLANES U ÓRDENES y VI.- ENSAYOS. 🌱 trae tu decisión (F6·P1), tu intención (F2·P14), tus RCIC. (F2·P8) y lo del G-3 (Matriz de decisión, Matriz de sincronización, tipo de orden y de ensayo); 💡 tus ideas van a la IA; 🤖 la IA la completa con TODO el expediente; y sale en Word con el formato militar. Habilita la Orden Preparatoria N° 3 del G-3.',
      registro: { id: 'guiaFinal', militar: true },
      firma: firmaCmte,
      propuestas,
      producto: PRODUCTO,
      verificacion: VERIFICACION,
      ideasQue: 'qué decidió, qué cambió en su intención, qué quiere saber y cómo quiere la orden y los ensayos',
      ideasEjemplo: 'Ej.: «Decido el CAP 2 con la reserva más al norte» · «Nuevo RCIC: ¿el enemigo emplea el paso Ungallire antes del D+1?» · «Prioridad de fuegos a la DIV MEC-2 en la fase II» · «Orden lista el D-3 (0800), ensayo de comandantes sobre maqueta en el PC».',
      sembrarAyuda: 'Trae tu decisión (F6·P1: el CAP, la razón y las modificaciones; si no la llenaste, el CAP que el G-3 marcó «RECOMENDADO AL COMANDANTE» en la F5·P1), tu intención (F2·P14), tus RCIC. priorizados (F2·P8; si no, los del G-3), las prioridades de la Matriz de sincronización del G-3 (fuegos, defensa antiaérea, ingeniería, apoyo de servicio de combate, inteligencia y C2, fase por fase) y el tipo de orden y de ensayo de la F6·SAL. No pisa lo escrito.',
    },
  },
}
