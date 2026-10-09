// COMANDANTE — lo que el motor necesita para trabajar sus hojas en «📋 Mis hojas» (panel ⭐):
//
//   · 🌱 en cada hoja, con LO QUE YA HIZO EL ESTADO MAYOR: la Orden superior, el G-2 (CAE,
//     vacíos), el G-3 (misión reexpresada, tareas, concepto, COA, eventos), los RCIC. y EEIA.
//     de cada sección, las apreciaciones, y lo que dispuso el JEM (línea de tiempo,
//     programa, normas de evaluación, libreto, rol de exposiciones);
//   · la Guía Inicial y los Conceptos Entrelazados SON los del tablero del G-3 (los mismos
//     datos, `compartida: 'g3'`): lo que se escribe en uno está en el otro;
//   · la IA recibe además lo que la Mesa no manda al expediente: las hojas del JEM y las
//     propias, y la doctrina de cada guía.
//
// No hay documento propio de la Escuela (modelo) para estas hojas: son los cuadros del PMTD
// (Visión Horizontal) y se trabajan con su forma (campos, filas) y su Word de hoja.
import { limpio, lista, obj, filasDe, col, g3De, cmteDe, jemDe, unir, lineasDe, cae, fasesCOA, cursosDeAccion, estadoApreciaciones, programa, plazoDe, fila, conContenido, contenidoDe } from './mando.js'

export const ID = 'cmte'
export const COLOR = '#dc2626'
export const SECCION_IA = 'COMANDO — el Comandante (producto del Comandante al Estado Mayor)'

export const DOCTRINA = [
  'LA GUÍA INICIAL DEL COMANDANTE (PMTD 2017; RC-02-101): se imparte ANTES del análisis de la misión, con lo poco que se sabe; orienta al Estado Mayor, no autoriza el planeamiento definitivo. Sus siete partes: I.- Método, II.- Asignación inicial del tiempo, III.- Oficiales de enlace, IV.- Reconocimiento inicial, V.- Movimientos, VI.- Tareas adicionales, VII.- Otros. Habilita la Orden Preparatoria N° 1.',
  'LA LÍNEA DE TIEMPO (RC-02-101): del recibo de la orden al inicio de la operación, un tercio es para el planeamiento del Estado Mayor y dos tercios para la preparación de las unidades subordinadas.',
  'LA INTENCIÓN DEL COMANDANTE tiene tres partes: el PROPÓSITO ampliado (el porqué, más allá de la tarea), las TAREAS CLAVE (lo que sí o sí debe cumplirse) y el ESTADO FINAL DESEADO, que nace en la Fase II y es la referencia contra la que se comparan después los cursos de acción. Es corta y clara: el que no la recuerda no la puede aplicar.',
  'LOS RCIC. y EEIA.: cada campo propone los suyos; el Comandante los PRIORIZA. Los RCIC. deben ser DIEZ O MENOS: cuantos menos, más se concentra el esfuerzo de búsqueda (PMTD 2017).',
  'LA GUÍA DE PLANIFICACIÓN (Fase II) es DISTINTA de la Guía Inicial: sale DESPUÉS del análisis de la misión y con ella el Estado Mayor recién puede desarrollar los cursos de acción. Para la Sección II (Inteligencia) debe cubrir: inteligencia, contrainteligencia, vacíos de inteligencia, CAE., RPI. y enfoque de inteligencia. Habilita la Orden Preparatoria N° 2.',
  'LA SELECCIÓN DE LOS CURSOS DE ACCIÓN (Fase III): después de la exposición de los CAP el Comandante decide cuáles siguen al Juego de Guerra y con qué cambios. Es un filtro, no la decisión final.',
  'LA DECISIÓN (Fase VI): queda constancia de cuál curso de acción se aprobó, por qué y con qué modificaciones. No es un documento formal en el cuadro.',
  'LA GUÍA DE PLANIFICACIÓN FINAL (Fase VI): la última guía; con ella el Estado Mayor escribe la Orden General de Operaciones y sus anexos. Habilita la Orden Preparatoria N° 3.',
  'LA REVISIÓN Y APROBACIÓN DE LAS ÓRDENES (Fase VII): no hay documento; es el acto de revisar y firmar antes de diseminar la Orden.',
]
export const doctrinaParaIA = () => DOCTRINA.map((x) => `- ${x}`).join('\n')

// ─── Las firmas y los datos de siempre ────────────────────────────────────────────
const SECCIONES_GUIA = ['G-1 Personal', 'G-2 Inteligencia', 'G-3 Operaciones', 'G-4 Logística', 'G-5 Asuntos Civiles y Gobierno Militar', 'EME. Estado Mayor Especial']
const COBERTURA_G2 = 'Debe cubrir: inteligencia, contrainteligencia, vacíos de inteligencia, CAE., RPI. y enfoque de inteligencia.'

// Los RCIC. / EEIA. que propuso cada sección, con quién los propone.
export function requerimientos(ctx = {}) {
  const R = []
  const g3 = g3De(ctx)
  for (const f of filasDe(g3.rcic)) {
    const r = col(f, /^requerimiento/i)
    if (r) R.push({ req: r, de: `G-3${col(f, /^tipo/i) ? ` (${col(f, /^tipo/i)})` : ''}`, plazo: col(f, /^plazo/i) })
  }
  for (const [g, rot] of [['g1', 'G-1'], ['g4', 'G-4'], ['g5', 'G-5'], ['eme', 'EME.']]) {
    for (const f of filasDe(obj(ctx.calco?.hojasG?.[g]).rcic)) {
      const r = col(f, /^requerimiento/i)
      if (r) R.push({ req: r, de: rot, plazo: col(f, /^para cu|^plazo/i) })
    }
  }
  for (const v of lista(obj(ctx.calco?.picb?.ht4).a)) R.push({ req: `Vacío de inteligencia: ${v}`, de: 'G-2', plazo: '' })
  return R
}

// ═══════════════════════════════════════════════════════════════════════════════════
// LO QUE LA MESA SABE (va al pedido de la IA)
// ═══════════════════════════════════════════════════════════════════════════════════
export function datosCalco(ctx = {}) {
  const L = []
  const os = ctx.ordenSup || {}
  const orden = [['Unidad', os.unidad], ['Misión recibida', os.mision], ['Intención del Comandante superior', os.intencion], ['Tareas asignadas', os.tareas], ['Limitaciones y restricciones', os.limitaciones], ['Momento de la ejecución', os.cuando || os.vigencia]].filter(([, x]) => limpio(x))
  if (orden.length) L.push(`LA ORDEN DEL ESCALÓN SUPERIOR\n${orden.map(([k, x]) => `- ${k}: ${limpio(x)}`).join('\n')}`)
  const g2 = cae(ctx)
  if (g2.hay) L.push(`EL G-2 (PICB)\n${[['CAE más probable', g2.probable], ['CAE más peligroso', g2.peligroso], ['Misión estimada del enemigo', g2.mision], ['Estado final deseado del enemigo', g2.estadoFinal]].filter(([, x]) => limpio(x)).map(([k, x]) => `- ${k}: ${x}`).join('\n')}`)
  const P = programa(ctx).filter((p) => p.plazos)
  if (P.length) L.push(`PROGRAMA GENERAL DE PLANEAMIENTO (sale de la Línea Inicial de Tiempo del JEM; plazos en notación de día D)\n${P.map((p) => `- ${p.evento} — ${p.responsable}: ${p.plazos}`).join('\n')}`)
  const fs = fasesCOA(ctx)
  if (fs.length) L.push(`FASES DEL CURSO DE ACCIÓN PROPIO EN EL CALCO\n${fs.map((n, i) => `- Fase ${i + 1}: ${n}`).join('\n')}`)
  const cs = cursosDeAccion(ctx)
  if (cs.length) L.push(`CURSOS DE ACCIÓN PROPIOS QUE YA NOMBRÓ EL ESTADO MAYOR\n${cs.map((n) => `- ${n}`).join('\n')}`)
  const rq = requerimientos(ctx)
  if (rq.length) L.push(`RCIC. Y EEIA. PROPUESTOS POR LAS SECCIONES (${rq.length})\n${rq.map((r) => `- ${r.req} (${r.de}${r.plazo ? `, ${r.plazo}` : ''})`).join('\n')}`)
  const ap = estadoApreciaciones(ctx)
  L.push(`APRECIACIONES DEL ESTADO MAYOR\n${ap.map((a) => `- ${a.rot}: ${a.actual ? 'actualizada (F2·P13)' : a.activa ? 'abierta (F1·P3)' : 'sin trabajar'}`).join('\n')}`)
  return L.join('\n\n')
}
// Lo que ya hicieron los demás (el JEM y cada sección): la Mesa no lo manda al expediente.
export const entregasTexto = (ctx) => contenidoDe(ctx, ['jem', 'g3', 'g1', 'g2', 'g4', 'g5', 'eme'], [], 800)
export const otrasHojas = (ctx, sin = []) => contenidoDe(ctx, ['cmte'], sin, 900)
export const entregas = () => []

// ═══════════════════════════════════════════════════════════════════════════════════
// LA GUÍA QUE VA AL PEDIDO DE LA IA (no se muestra)
// ═══════════════════════════════════════════════════════════════════════════════════
const GUIAS_IA = {
  aprecCmte: { para: 'La apreciación activa del Comandante: cómo ve la situación ANTES de que el Estado Mayor arranque. Es la que ordena todo lo demás.', como: ['Primera persona, directa, sin relleno.', 'Se apoya en la Orden superior, la CAE del G-2 y lo que ya sabe el Estado Mayor.', 'No se difunde.'] },
  guiaInicial: { para: 'La Guía Inicial del Comandante (PMTD 2017, siete partes). Orienta al Estado Mayor ANTES del análisis de la misión.', como: ['II.- ASIGNACIÓN INICIAL DEL TIEMPO sale de la Línea Inicial de Tiempo del JEM: usá sus cifras.', 'No autoriza el planeamiento definitivo.', 'Cada parte con su número romano, como el PMTD.'] },
  prioridadRcic: { para: 'Prioriza los RCIC. y EEIA. que propusieron las secciones.', como: ['Un renglón por requerimiento; no inventes los que no propuso nadie.', 'Prioridad 1, 2, 3…: el que sostiene la decisión más cercana va primero.', 'Los RCIC. no pasan de diez.'] },
  intencion: { para: 'La Intención Inicial del Comandante: propósito ampliado, tareas clave y estado final deseado.', como: ['Corta y clara.', 'El propósito va más allá de la tarea; el estado final deseado es lo que se comparará con cada curso de acción.', 'Contribuye a la intención del escalón superior.'] },
  guiaPlanificacion: { para: 'La Guía de Planificación (Fase II): distinta de la Guía Inicial; con ella el Estado Mayor desarrolla los cursos de acción.', como: ['Un renglón por sección.', `Para el G-2: ${COBERTURA_G2}`, 'La guía sale del análisis de la misión ya hecho.'] },
  seleccionCoa: { para: 'Selección de los cursos de acción que pasan al Juego de Guerra.', como: ['Un renglón por curso de acción propio ya nombrado.', '¿Pasa? Sí o No, con la modificación que ordena.', 'Es un filtro, no la decisión.'] },
  decisionCmte: { para: 'La decisión del Comandante (Fase VI): curso aprobado, razón y modificaciones.', como: ['Se apoya en la recomendación del Estado Mayor, el Juego de Guerra y la matriz de decisión.', 'Dice POR QUÉ: es lo que después se evalúa.'] },
  guiaFinal: { para: 'La Guía de Planificación Final (Fase VI): con ella el Estado Mayor escribe la Orden General de Operaciones y los anexos.', como: ['Un renglón por sección, con su plazo del Programa General.', 'Se apoya en el curso de acción aprobado.'] },
  aprobacionOgo: { para: 'Revisión y aprobación de las órdenes antes de diseminarlas.', como: ['Un renglón por orden o anexo: quién lo hizo, en qué estado está y si el Comandante lo revisó.'] },
}
export function guiaIA(hojaId) {
  const g = GUIAS_IA[hojaId]
  return g ? { ...g, como: [...g.como, 'Trabajás como el COMANDANTE: lo que decidís manda sobre el Estado Mayor. Usá lo que ya hicieron el JEM y cada sección (están en «LO QUE YA ENTREGARON LAS OTRAS SECCIONES») y la doctrina.'] } : null
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 🌱 LAS SEMILLAS (sólo lo que sale del ejercicio, sin pisar lo escrito)
// ═══════════════════════════════════════════════════════════════════════════════════
const campo = (ctx, id) => obj(g3De(ctx)[id])
export const SEMILLAS = {
  aprecCmte: (ctx) => {
    const os = ctx.ordenSup || {}
    const g2 = cae(ctx)
    const g3 = g3De(ctx)
    const vac = lista(obj(ctx.calco?.picb?.ht4).a)
    const proh = lista(obj(g3.limitaciones).a)
    const P = {}
    P['Situación como la veo hoy'] = unir([os.mision && `Misión recibida: ${limpio(os.mision)}`, os.intencion && `Intención del Comandante superior: ${limpio(os.intencion)}`, os.enemigo && `Enemigo: ${limpio(os.enemigo)}`, g2.probable && `CAE más probable (G-2): ${g2.probable}.`])
    P['Lo que más me preocupa'] = unir([g2.peligroso && `CAE más peligroso (G-2): ${g2.peligroso}.`, vac.length && `Vacíos de inteligencia: ${vac.join('; ')}.`, os.limitaciones && `Limitaciones impuestas: ${limpio(os.limitaciones)}`])
    P['Lo que no estoy dispuesto a arriesgar'] = proh.length ? `Prohibiciones que el Estado Mayor ya identificó: ${proh.join('; ')}.` : lineasDe(os.limitaciones).filter((x) => /\bno\b|prohib/i.test(x)).join('\n')
    P['Hacia dónde creo que va esto'] = unir([campo(ctx, 'concepto')['Forma de maniobra elegida y por qué'], campo(ctx, 'mision')['ENUNCIADO COMPLETO DE LA MISIÓN'], fasesCOA(ctx).length && `El calco tiene ${fasesCOA(ctx).length} fase(s): ${fasesCOA(ctx).join('; ')}.`])
    return P
  },
  guiaInicial: (ctx, hoja) => {
    const f = ctx.semillaG3
    if (typeof f !== 'function') return {}
    try {
      return f('guiaInicial', { unidades: ctx.calco?.unidades || [], ops: ctx.calco?.ops || {}, fasesCOA: ctx.calco?.fasesCOA || {}, picb: ctx.calco?.picb || {}, ordenSup: ctx.ordenSup || {}, ejercicio: ctx.ejercicio || '', unidad: ctx.unidad || '', g3: g3De(ctx) }) || {}
    } catch {
      return {}
    }
  },
  prioridadRcic: (ctx, hoja) => {
    const cols = hoja?.cols || ['Requerimiento propuesto', 'Quién lo propone', 'Prioridad que asigna el Cmte.']
    return requerimientos(ctx).map((r) => fila(cols, [r.req, r.de, '']))
  },
  intencion: (ctx) => {
    const os = ctx.ordenSup || {}
    const m = campo(ctx, 'mision')
    const tareas = filasDe(g3De(ctx).tareas)
    const esenciales = tareas.filter((f) => /^s[ií]|esencial/i.test(col(f, /esencial/i))).map((f) => col(f, /espec[ií]fica/i) || col(f, /impl[ií]cita/i)).filter(Boolean)
    const P = {}
    P['Propósito ampliado'] = unir([m['PROPÓSITO (el porqué de la operación)'] || (os.intencion && `Contribuir a la intención del escalón superior: ${limpio(os.intencion)}`)])
    P['Tareas clave'] = unir([...esenciales.map((t) => `- ${t}`), !esenciales.length && m['QUÉ (tipo de operación + tarea esencial, como tarea táctica)'] && `- ${m['QUÉ (tipo de operación + tarea esencial, como tarea táctica)']}`, !esenciales.length && !m['QUÉ (tipo de operación + tarea esencial, como tarea táctica)'] && lineasDe(os.tareas).slice(0, 5).map((t) => `- ${t}`).join('\n')])
    P['Estado Final Deseado'] = unir([campo(ctx, 'concepto')['Estado final deseado'] || cae(ctx).estadoFinal && `Frente al estado final del enemigo (${cae(ctx).estadoFinal}).`])
    return P
  },
  guiaPlanificacion: (ctx, hoja) => {
    const cols = hoja?.cols || ['Área / Sección', 'Guía impartida', 'Observación']
    const ap = estadoApreciaciones(ctx)
    return SECCIONES_GUIA.map((n, i) => fila(cols, [n, i === 1 ? COBERTURA_G2 : '', ap[i]?.actual ? 'Apreciación actualizada (F2·P13).' : ap[i]?.activa ? 'Apreciación abierta, falta actualizarla.' : 'Sin apreciación trabajada.']))
  },
  seleccionCoa: (ctx, hoja) => {
    const cols = hoja?.cols || ['Curso de acción', '¿Pasa al Juego de Guerra?', 'Modificación que ordena el Cmte.']
    return cursosDeAccion(ctx).map((n) => fila(cols, [n, '', '']))
  },
  decisionCmte: (ctx) => {
    const j = jemDe(ctx)
    const sel = filasDe(cmteDe(ctx).seleccionCoa)
    const pasan = sel.filter((f) => /^s[ií]/i.test(col(f, /pasa/i)))
    const rec = filasDe(j.rolExposiciones).map((f) => col(f, /recomendaci/i)).filter(Boolean)
    const P = {}
    if (pasan.length === 1) P['Curso de acción aprobado'] = col(pasan[0], /^curso/i)
    P['Razón de la decisión'] = rec.length ? `Recomendación del Estado Mayor (rol de exposiciones del JEM.): ${rec.join('; ')}.` : ''
    P['Modificaciones que ordena'] = unir(sel.map((f) => (col(f, /modific/i) ? `${col(f, /^curso/i)}: ${col(f, /modific/i)}` : '')))
    return P
  },
  guiaFinal: (ctx, hoja) => {
    const cols = hoja?.cols || ['Área / Sección', 'Guía final impartida', 'Plazo']
    const plazo = plazoDe(ctx, /Plan u Orden|Aprobaci/i)
    return SECCIONES_GUIA.map((n) => fila(cols, [n, '', plazo]))
  },
  aprobacionOgo: (ctx, hoja) => {
    const cols = hoja?.cols || ['Orden o anexo', 'Responsable', 'Estado', 'Revisión del Cmte.']
    const g3 = g3De(ctx)
    const R = []
    for (const [id, nom] of [['prep1', 'Orden Preparatoria N° 1'], ['prep2', 'Orden Preparatoria N° 2'], ['prep3', 'Orden Preparatoria N° 3'], ['opord', 'Orden General de Operaciones']]) R.push(fila(cols, [nom, 'G-3', conContenido(g3[id]) ? 'Con contenido' : 'Falta', '']))
    for (const [g, rot] of [['g1', 'G-1'], ['g4', 'G-4'], ['g5', 'G-5'], ['eme', 'EME.']]) {
      const h = obj(ctx.calco?.hojasG?.[g])
      const id = ['anexo', 'anexoF7P1', 'anexoLog'].find((k) => h[k] !== undefined)
      R.push(fila(cols, [`Anexo de ${rot}`, rot, id && conContenido(h[id]) ? 'Con contenido' : 'Falta', '']))
    }
    return R
  },
}

export default {
  id: ID,
  nombre: 'Comandante',
  color: COLOR,
  seccionIA: SECCION_IA,
  seccionWord: 'COMANDO',
  doctrina: doctrinaParaIA,
  datosCalco,
  entregas,
  entregasTexto,
  otrasHojas,
  guiaIA,
  semillas: SEMILLAS,
  sinNadaHoja: 'No había nada nuevo que traer: falta lo que el Estado Mayor todavía no hizo o ya está todo en la hoja.',
  documentos: {},
}
