// Los datos de las hojas de logística del G-4 y cómo se arman con lo que ya tiene el
// ejercicio (el calco y las demás hojas del G-4), SIN PISAR lo que escribió el oficial:
//
//   · EVALUACIÓN DE LAS ÁREAS PROPUESTAS (hojasG.g4.evalAreas): la matriz de la Escuela
//     (factor · aspecto · área A · área B…), la conclusión y el área elegida;
//   · APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA (hojasG.g4.aprecActiva — F1·P3 — y
//     hojasG.g4.aprecOrientacion — F2·P13, la misma actualizada);
//   · MATRIZ DE SINCRONIZACIÓN LOGÍSTICA (hojasG.g4.matrizSinc — F7·P2).
//
// Sin DOM: se prueba en Node.
import { limpio, texto, sinMarcaIA, articuloDe, nuevoId, claveTexto } from '../../riesgo/v1/modelo.js'
import { ASPECTOS, FACTORES, FILAS_MATRIZ, ENFOQUES, nombreEnfoque, NIVELES_AMENAZA, operacionDeAO, operacion } from './doctrina.js'
import { parametrosDe, nombreArea, textoAnalisis, LETRAS } from './analisis.js'
import { centroide, largoKm, limpiar, fmtKm } from './geo.js'

export { limpio, texto, sinMarcaIA, nuevoId }
export const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const lista = (xs) => (Array.isArray(xs) ? xs : String(xs ?? '').split('\n')).map((x) => texto(x)).filter(Boolean)
const vacio = (s) => !limpio(sinMarcaIA(s))

// ─── Identidad del ejercicio ─────────────────────────────────────────────────────────
export function unidadDe(ctx = {}) {
  return limpio(ctx?.ordenSup?.unidad || ctx?.orden?.unidad || ctx?.unidad || '')
}
export function firmaG4(ctx = {}, firma = '') {
  if (limpio(firma)) return limpio(firma)
  const u = unidadDe(ctx)
  return u ? `EL G-4 ${articuloDe(u)} ${u}` : 'EL G-4 DE LA UNIDAD'
}
// Coordenada legible: la de la Mesa si está (configurada), si no grados decimales.
let formatoCoordenada = null
export function configurarCoordenadas(f) {
  formatoCoordenada = typeof f === 'function' ? f : null
}
export function coordenada(p) {
  if (!Array.isArray(p) || !Number.isFinite(+p[0]) || !Number.isFinite(+p[1])) return ''
  if (formatoCoordenada) {
    try {
      const s = formatoCoordenada(+p[1], +p[0])
      if (s) return String(s)
    } catch {}
  }
  return `${(+p[1]).toFixed(4)}, ${(+p[0]).toFixed(4)}`
}

// ════════════════════════════════════════════════════════════════════════════════════
// EVALUACIÓN DE LAS ÁREAS PROPUESTAS
// ════════════════════════════════════════════════════════════════════════════════════
export const ESQ_EVAL = 'eval-areas-v1'
export const CLAVE_EVAL = 'evalAreas'
const ESTADOS = ['si', 'no']

export function normalizarEval(valor) {
  const o = esObj(valor) ? valor : {}
  const notas = {}
  for (const [asp, porArea] of Object.entries(esObj(o.notas) ? o.notas : {})) {
    if (!ASPECTOS.some((a) => a.id === asp) || !esObj(porArea)) continue
    for (const [clave, n] of Object.entries(porArea)) {
      if (!esObj(n) || !ESTADOS.includes(n.estado)) continue
      notas[asp] = notas[asp] || {}
      notas[asp][clave] = { estado: n.estado, por: n.por === 'ia' ? 'ia' : 'oficial', motivo: texto(n.motivo) }
    }
  }
  const tropas = {}
  for (const [k, n] of Object.entries(esObj(o.tropas) ? o.tropas : {})) if (Number.isFinite(+n) && +n >= 0) tropas[k] = Math.round(+n)
  return {
    esquema: ESQ_EVAL,
    parametros: parametrosDe(o.parametros),
    notas,
    conclusion: texto(o.conclusion),
    conclusionIA: !!o.conclusionIA,
    elegida: limpio(o.elegida),
    ideas: texto(o.ideas),
    tropas,
    tipoDivision: ['motorizada', 'mecanizada', 'blindada'].includes(o.tipoDivision) ? o.tipoDivision : '',
  }
}
export const tieneEval = (v) => {
  const e = normalizarEval(v)
  return !!(Object.keys(e.notas).length || e.conclusion || e.elegida)
}

// El estado de una casilla: la nota del oficial (o de la IA) manda; si no hay, lo que
// midió la Mesa en el calco.
export function celdaEval(ev, sug, asp, clave) {
  const n = ev?.notas?.[asp]?.[clave]
  const s = sug?.[asp]?.[clave] || null
  if (n) return { estado: n.estado, fuente: n.por, motivo: n.motivo || '', sugerida: s }
  if (s) return { estado: s.estado, fuente: 'calco', motivo: s.motivo, regla: s.regla, sugerida: s }
  return { estado: '', fuente: '', motivo: '', sugerida: null }
}
// Un toque en la casilla: (calco) → reúne → no reúne → vuelve a lo del calco.
export function ciclarCelda(ev, sug, asp, clave) {
  const e = normalizarEval(ev)
  const n = e.notas[asp]?.[clave]
  const notas = { ...e.notas, [asp]: { ...(e.notas[asp] || {}) } }
  if (!n) notas[asp][clave] = { estado: 'si', por: 'oficial', motivo: '' }
  else if (n.estado === 'si') notas[asp][clave] = { estado: 'no', por: 'oficial', motivo: '' }
  else delete notas[asp][clave]
  if (!Object.keys(notas[asp]).length) delete notas[asp]
  return { ...e, notas }
}
export function fijarCelda(ev, asp, clave, estado, { por = 'oficial', motivo = '' } = {}) {
  const e = normalizarEval(ev)
  const notas = { ...e.notas, [asp]: { ...(e.notas[asp] || {}) } }
  if (ESTADOS.includes(estado)) notas[asp][clave] = { estado, por, motivo: texto(motivo) }
  else delete notas[asp][clave]
  if (!Object.keys(notas[asp]).length) delete notas[asp]
  return { ...e, notas }
}

// Cuenta por área: favorables, desfavorables, sin evaluar, impositivos que no cumple.
export function resumenEval(ev, areas = [], sug = {}) {
  return areas.map((a) => {
    let si = 0
    let no = 0
    let sin = 0
    const imp = []
    const favorables = []
    for (const asp of ASPECTOS) {
      const c = celdaEval(ev, sug, asp.id, a.clave)
      if (c.estado === 'si') {
        si++
        favorables.push(asp.id)
      } else if (c.estado === 'no') {
        no++
        if (asp.impositivo) imp.push(asp.nom)
      } else sin++
    }
    return { clave: a.clave, nombre: a.nombre, si, no, sin, impositivosNo: imp, descartada: imp.length > 0, favorables }
  })
}

// La conclusión con la forma del ejemplo de la Escuela.
export function conclusionAuto(ev, areas = [], sug = {}, ctx = {}) {
  if (!areas.length) return ''
  const R = resumenEval(ev, areas, sug)
  const aptas = R.filter((r) => !r.descartada)
  const descartadas = R.filter((r) => r.descartada)
  const unidad = unidadDe(ctx)
  const maniobra = unidad ? `A LA MANIOBRA ${articuloDe(unidad)} ${unidad}` : 'A LA MANIOBRA'
  const up = (s) => String(s).toUpperCase()
  const nombres = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).map((x) => up(x.nombre)).join(', ')} Y ${up(xs[xs.length - 1].nombre)}` : up(xs[0].nombre))
  const partes = []
  if (aptas.length) {
    partes.push(`${aptas.length > 1 ? `LAS ÁREAS ${nombres(aptas).replace(/ÁREA /g, '')} TIENEN` : `EL ${up(aptas[0].nombre)} TIENE`} CONDICIONES DE REALIZAR EL APOYO LOGÍSTICO ${maniobra}`)
    if (aptas.length > 1) {
      const orden = [...aptas].sort((a, b) => b.si - a.si || a.no - b.no)
      const mejor = orden[0]
      const otros = orden.slice(1)
      const ventajas = ASPECTOS.filter((asp) => celdaEval(ev, sug, asp.id, mejor.clave).estado === 'si' && otros.some((o) => celdaEval(ev, sug, asp.id, o.clave).estado !== 'si')).map((a) => up(a.nom))
      if (mejor.si > otros[0].si && ventajas.length)
        partes.push(`, MIENTRAS QUE EL ${up(mejor.nombre)} TIENE LA VENTAJA EN RELACIÓN ${otros.length > 1 ? 'A LAS DEMÁS' : `AL ${up(otros[0].nombre)}`}, CONSIDERANDO LOS ASPECTOS ${ventajas.length > 1 ? `${ventajas.slice(0, -1).join(', ')} Y ${ventajas[ventajas.length - 1]}` : ventajas[0]}`)
      else partes.push(', SIN QUE NINGUNA TENGA UNA VENTAJA DECISIVA SOBRE LA OTRA EN LOS ASPECTOS EVALUADOS')
    }
    partes.push('.')
  }
  if (descartadas.length) partes.push(`${partes.length ? ' ' : ''}${descartadas.map((d) => `EL ${up(d.nombre)} NO TIENE CONDICIONES: NO CUMPLE ${d.impositivosNo.map(up).join(' NI ')} (ASPECTO IMPOSITIVO)`).join('. ')}.`)
  return partes.join('')
}
export const conclusionDe = (ev, areas, sug, ctx) => (limpio(ev?.conclusion) ? texto(ev.conclusion) : conclusionAuto(ev, areas, sug, ctx))

// La mejor área según la matriz (si una sola tiene más favorables y no está descartada).
export function mejorArea(ev, areas = [], sug = {}) {
  const R = resumenEval(ev, areas, sug).filter((r) => !r.descartada)
  if (!R.length) return null
  const o = [...R].sort((a, b) => b.si - a.si || a.no - b.no)
  return o.length === 1 || o[0].si > o[1].si ? o[0] : null
}

export function textoEval(ev, an, ctx = {}) {
  const e = normalizarEval(ev)
  const areas = an?.areas || []
  if (!areas.length) return ''
  const L = ['EVALUACIÓN DE LAS ÁREAS PROPUESTAS (G-4)']
  L.push(textoAnalisis(an))
  for (const f of FACTORES) {
    L.push(`${f.nom}:`)
    for (const a of f.aspectos) {
      const cs = areas.map((ar) => {
        const c = celdaEval(e, an.sugerencias, a.id, ar.clave)
        return `${ar.nombre}: ${c.estado === 'si' ? 'REÚNE' : c.estado === 'no' ? 'NO REÚNE' : 'sin evaluar'}${c.fuente === 'calco' ? ' (medido en el calco)' : c.fuente === 'ia' ? ' (IA)' : ''}`
      })
      L.push(`  - ${a.nom}: ${cs.join(' · ')}`)
    }
  }
  const concl = conclusionDe(e, areas, an.sugerencias, ctx)
  if (concl) L.push(`CONCLUSIÓN: ${concl}`)
  const el = areas.find((a) => a.clave === e.elegida)
  if (el) L.push(`ÁREA ELEGIDA: ${el.nombre}.`)
  return L.join('\n')
}

// ════════════════════════════════════════════════════════════════════════════════════
// APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA
// ════════════════════════════════════════════════════════════════════════════════════
export const ESQ_ASL = 'aprec-log-v1'
export const TITULO_ASL = 'APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA'
// El árbol de la apreciación: [id, título, hijos]. Las hojas (sin hijos) son campos.
// «III.- ANÁLISIS» y «IV.- B.-» se completan por CAP.
export const ARBOL_ASL = [
  ['I', 'MISIÓN.', [
    ['A', 'Tareas.', [['tareasEsp', 'Específicas.'], ['tareasImp', 'Implícitas.'], ['tareasEse', 'Esenciales.']]],
    ['recursos', 'Recursos.'],
    ['limitaciones', 'Limitaciones.'],
    ['mision', 'Misión de Logística.'],
  ]],
  ['II', 'SITUACIÓN Y CONSIDERACIONES LOGÍSTICAS.', [
    ['caracteristicas', 'Características del área de operaciones.'],
    ['B', 'Situación táctica.', [['dispositivo', 'Dispositivo actual.'], ['refuerzos', 'Refuerzos.'], ['capsTexto', 'Cursos de acción propios.'], ['proyectadas', 'Operaciones proyectadas.']]],
    ['C', 'Situación de personal.', [['persDispositivo', 'Dispositivo de las instalaciones de personal.'], ['efectivos', 'Efectivos por apoyar.'], ['persProyectos', 'Proyectos del campo de personal.'], ['bajas', 'Bajas, reemplazos y PP.GG.']]],
    ['ac', 'Situación de Asuntos Civiles.'],
    ['hipotesis', 'Hipótesis.'],
    ['F', 'Situación logística.', [['situacionFunciones', 'Estado actual por función.'], ['areasEjes', 'Áreas de apoyo logístico y ejes.']]],
    ['especiales', 'Factores especiales.'],
  ]],
  ['III', 'ANÁLISIS.', [['eleccionArea', 'Elección del área de apoyo logístico.'], ['CAPS', '']]],
  ['IV', 'COMPARACIÓN.', [['factores', 'Factores determinantes.'], ['VENTAJAS', 'Ventajas y desventajas de cada Curso de Acción Propio.'], ['superar', 'Medios o procedimientos para superar las limitaciones.']]],
  ['V', 'CONCLUSIONES Y RECOMENDACIONES.', [['factibilidad', 'Factibilidad del apoyo.'], ['mejorCap', 'Curso de acción mejor apoyado.'], ['desventajasRestantes', 'Desventajas de los CAP restantes.'], ['problemas', 'Problemas y deficiencias.'], ['estadoFinal', 'Estado final logístico.']]],
]
export const ANALISIS_CAP = [
  ['abastDisp', 'Abastecimientos — Disponibilidades.'],
  ['abastNiveles', 'Abastecimientos — Niveles prescritos.'],
  ['abastNecesidades', 'Abastecimientos — Necesidades (consumo, tonelaje y volumen a abastecer y a evacuar).'],
  ['abastLimitaciones', 'Abastecimientos — Limitaciones.'],
  ['abastRequerimientos', 'Abastecimientos — Requerimientos a efectuar.'],
  ['mantenimiento', 'Mantenimiento.'],
  ['evacuacion', 'Evacuación y hospitalización.'],
  ['transportes', 'Transportes.'],
  ['diversos', 'Diversos.'],
  ['conclusiones', 'Conclusiones (enfoque y prioridad de apoyo por fase).'],
]
export const CAMPOS_ASL = []
;(function recorrer(ns) {
  for (const [id, t, h] of ns) {
    if (h) recorrer(h)
    else if (!['CAPS', 'VENTAJAS'].includes(id)) CAMPOS_ASL.push({ id, titulo: t })
  }
})(ARBOL_ASL)

const capVacio = (i, id = nuevoId('cap')) => ({ id, nombre: `CAP N° ${i + 1}`, analisis: {}, ventajas: '', desventajas: '' })
export function normalizarASL(valor) {
  const o = esObj(valor) ? valor : {}
  const campos = {}
  for (const c of CAMPOS_ASL) campos[c.id] = texto(o.campos?.[c.id])
  let caps = Array.isArray(o.caps) ? o.caps.filter(esObj) : []
  caps = caps.map((c, i) => ({
    id: limpio(c.id) || nuevoId('cap'),
    nombre: limpio(c.nombre) || `CAP N° ${i + 1}`,
    analisis: Object.fromEntries(ANALISIS_CAP.map(([k]) => [k, texto(c.analisis?.[k])])),
    ventajas: texto(c.ventajas),
    desventajas: texto(c.desventajas),
  }))
  if (!caps.length) caps = [capVacio(0, 'cap-1'), capVacio(1, 'cap-2')].map((c) => ({ ...c, analisis: Object.fromEntries(ANALISIS_CAP.map(([k]) => [k, ''])) }))
  return {
    esquema: ESQ_ASL,
    numero: limpio(o.numero),
    objeto: texto(o.objeto),
    cartas: texto(o.cartas),
    anexos: texto(o.anexos),
    campos,
    caps,
    ideas: texto(o.ideas),
    firma: limpio(o.firma),
    iaCampos: Array.isArray(o.iaCampos) ? [...new Set(o.iaCampos.map(String))] : [],
  }
}
export const esASL = (v) => esObj(v) && v.esquema === ESQ_ASL
export function tieneASL(valor) {
  if (!esASL(valor)) return false
  const v = normalizarASL(valor)
  return !!(limpio(v.objeto) || Object.values(v.campos).some(limpio) || v.caps.some((c) => Object.values(c.analisis).some(limpio) || limpio(c.ventajas) || limpio(c.desventajas)))
}
export const nuevoCap = (v) => capVacio(normalizarASL(v).caps.length)

// Filas de las otras hojas del G-4 (son listas de objetos con los nombres de columna).
const filasDe = (h) => (Array.isArray(h) ? h.filter(esObj) : [])
const col = (fila, re) => {
  const k = Object.keys(fila).find((x) => re.test(x))
  return k ? sinMarcaIA(fila[k]) : ''
}

// Lo que se puede decir de la situación logística desde el calco.
export function instalacionesPorFuncion(unidades = [], catalogo = null) {
  const inst = (unidades || []).filter((u) => u?.tipo === 'instalacion')
  const grupoDe = (u) => (catalogo ? catalogo(u.instalacion)?.grupo : null) || grupoPorId(u.instalacion)
  const nombre = (u) => (catalogo ? catalogo(u.instalacion)?.abrev : null) || limpio(u.designacion || u.nombre || u.instalacion)
  const F = [
    ['Abastecimientos', ['abast', 'agua', 'base']],
    ['Mantenimiento', ['mant']],
    ['Evacuación y hospitalización', ['sanidad']],
    ['Transportes', ['transp']],
    ['Personal', ['personal']],
  ]
  return F.map(([nom, gs]) => ({ nom, items: inst.filter((u) => gs.includes(grupoDe(u))).map((u) => ({ nombre: nombre(u), p: [+u.lng, +u.lat], u })) }))
}
// Si la Mesa no presta su catálogo: el grupo por el prefijo del id.
function grupoPorId(id = '') {
  const s = String(id)
  if (/^(pd_|pcm|area_cocina)/.test(s)) return 'abast'
  if (/^(p_puri|pd_agua)/.test(s)) return 'agua'
  if (/^(prcp|ptec|pmant|area_mant|pcol|prec)/.test(s)) return 'mant'
  if (/^(pced|p_socorro|lug_heridos|p_amb|p_quir|p_farm|p_lab|p_vet)/.test(s)) return 'sanidad'
  if (/^(p_transp|p_ctrl_tran|area_est)/.test(s)) return 'transp'
  if (/^(baselog|deposito|p_abast)$/.test(s)) return 'base'
  if (/^(prm|p_|dpg|crpg|ccpg|pce|a_descanso)/.test(s)) return 'personal'
  return ''
}

const ejesTexto = (ops = {}, tipo, sigla) => {
  const xs = (ops.ejesLog || []).filter((e) => e.tipo === tipo && limpiar(e.coords).length >= 2)
  if (!xs.length) return ''
  return xs
    .map((e, i) => {
      const c = limpiar(e.coords)
      return `${sigla}${xs.length > 1 ? ` ${i + 1}` : ''}: ${fmtKm(largoKm(c), 0)}, desde ${coordenada(c[0])} hasta ${coordenada(c[c.length - 1])}`
    })
    .join('; ')
}
const areasTexto = (ops = {}) =>
  (ops.zonasLog || [])
    .map((z, i) => ({ z, i }))
    .filter(({ z }) => limpiar(z.coords).length >= 3 && !z.descartada)
    .map(({ z, i }) => `${nombreCalco(z, i)}${z.propuesta && !z.elegida ? ' (propuesta)' : ''} en ${coordenada(centroide(z.coords))}`)
    .join('; ')

// Lo que la Mesa puede escribir sola en la apreciación (una propuesta por campo).
export function propuestasASL(ctx = {}) {
  const P = {}
  const calco = ctx.calco || {}
  const ops = calco.ops || {}
  const g4 = ctx.hojasG4 || {}
  const unidad = unidadDe(ctx)
  const tareas = filasDe(g4.tareas)
  const porTipo = (re) => tareas.filter((f) => re.test(claveTexto(col(f, /tipo/i)))).map((f) => col(f, /^tarea/i)).filter(Boolean)
  const esp = porTipo(/ESPEC/)
  const imp = porTipo(/IMPL/)
  const ese = porTipo(/ESENC/)
  if (esp.length) P.tareasEsp = esp.map((x) => `- ${x}`).join('\n')
  if (imp.length) P.tareasImp = imp.map((x) => `- ${x}`).join('\n')
  if (ese.length) P.tareasEse = ese.map((x) => `- ${x}`).join('\n')
  const lim = filasDe(g4.limitaciones).map((f) => [col(f, /^limitaci/i), col(f, /tipo/i)].filter(Boolean).join(' — ')).filter(Boolean)
  if (lim.length) P.limitaciones = lim.map((x) => `- ${x}`).join('\n')
  if (limpio(calco.misionLog)) P.mision = texto(calco.misionLog)
  const sup = esObj(g4.hechos) ? lista(g4.hechos.b) : []
  if (sup.length) P.hipotesis = sup.map((x) => `- ${x}`).join('\n')
  const fun = instalacionesPorFuncion(calco.unidades, ctx.catalogo)
  const conInst = fun.filter((f) => f.items.length)
  if (conInst.length) {
    P.situacionFunciones = conInst.map((f) => `${f.nom}: ${f.items.map((x) => `${x.nombre} (${coordenada(x.p)})`).join('; ')}.`).join('\n')
    const n = conInst.reduce((s, f) => s + f.items.length, 0)
    P.recursos = `Batallón Logístico${unidad ? ` ${articuloDe(unidad)} ${unidad}` : ''} con ${n} instalación(es) logística(s) desplegada(s) en el calco.`
  }
  const ar = areasTexto(ops)
  const epa = ejesTexto(ops, 'epa', 'EPA')
  const epe = ejesTexto(ops, 'epe', 'EPE')
  const ae = [ar && `Áreas: ${ar}.`, epa && `${epa}.`, epe && `${epe}.`].filter(Boolean)
  if (ae.length) P.areasEjes = ae.join('\n')
  if (ctx.analisis?.areas?.length) P.caracteristicas = `Lugares aptos para el área de apoyo logístico (medidos en el calco):\n${textoAnalisis(ctx.analisis)}`
  const evTxt = ctx.evaluacion && ctx.analisis ? conclusionDe(normalizarEval(ctx.evaluacion), ctx.analisis.areas, ctx.analisis.sugerencias, ctx) : ''
  if (evTxt) {
    const el = ctx.analisis.areas.find((a) => a.clave === normalizarEval(ctx.evaluacion).elegida)
    P.eleccionArea = `${evTxt}${el ? `\nSe elige el ${el.nombre}: ${el.tamano.txt}; distancia de seguridad ${el.seguridad.txt}; ${el.dma.txt}.` : '\n[Falta elegir el área: pestaña ▣ ASDI, paso 5.]'}`
  }
  const fases = calco.fasesCOA?.propio || []
  if (fases.length) P.capsTexto = `Curso de acción propio en ${fases.length} fase(s): ${fases.map((f, i) => `FASE ${romano(i + 1)}${limpio(f?.nombre) ? ` — ${limpio(f.nombre)}` : ''}`).join('; ')}.`
  const op = operacion(operacionDeAO(ops.areaOps))
  if (op) P.proyectadas = `${op.nom}: ${op.despliegue}${op.clases ? ` ${op.clases}` : ''}`
  return P
}
// Lo que va en cada CAP (de la F5·P1 del G-4 y del concepto de apoyo por fase).
export function propuestasCaps(ctx = {}) {
  const g4 = ctx.hojasG4 || {}
  const dec = filasDe(g4.decision)
  const concepto = Array.isArray(ctx.calco?.conceptoApoyo) ? ctx.calco.conceptoApoyo : []
  const fases = ctx.calco?.fasesCOA?.propio || []
  const conclusiones = concepto
    .map((c, i) => {
      if (!esObj(c)) return ''
      const enf = (c.enfoque || []).map(nombreEnfoque)
      if (!enf.length && !limpio(c.prioridad)) return ''
      return `Fase ${romano(i + 1)}${limpio(c.nombre || fases[i]?.nombre) ? ` (${limpio(c.nombre || fases[i]?.nombre)})` : ''}: enfoque de apoyo en ${enf.length ? enf.join(', ') : '[definir]'}; prioridad de apoyo: ${limpio(c.prioridad) || '[definir]'}.`
    })
    .filter(Boolean)
    .join('\n')
  return dec.map((f) => ({
    nombre: col(f, /curso/i),
    ventajas: col(f, /^ventaja/i),
    desventajas: col(f, /^desventaja/i),
    apoyable: col(f, /apoyar/i),
    conclusiones,
  })).concat(dec.length ? [] : conclusiones ? [{ conclusiones }] : [])
}

// 🌱 Traer lo que falte: sólo campos vacíos. Devuelve { valor, cambios }.
export function armarASL(valor, ctx = {}) {
  const v = normalizarASL(valor)
  const P = propuestasASL(ctx)
  const cambios = []
  const campos = { ...v.campos }
  for (const c of CAMPOS_ASL) if (P[c.id] && vacio(campos[c.id])) {
    campos[c.id] = P[c.id]
    cambios.push(c.titulo.replace(/\.$/, ''))
  }
  let caps = v.caps.map((c) => ({ ...c, analisis: { ...c.analisis } }))
  const pc = propuestasCaps(ctx)
  pc.forEach((p, i) => {
    if (!p) return
    if (!caps[i] && limpio(p.nombre)) caps.push({ ...capVacio(i), analisis: Object.fromEntries(ANALISIS_CAP.map(([k]) => [k, ''])) })
    const c = caps[i]
    if (!c) return
    if (limpio(p.nombre) && /^CAP N° \d+$/.test(c.nombre)) c.nombre = limpio(p.nombre)
    if (p.ventajas && vacio(c.ventajas)) (c.ventajas = p.ventajas), cambios.push(`ventajas del ${c.nombre}`)
    if (p.desventajas && vacio(c.desventajas)) (c.desventajas = p.desventajas), cambios.push(`desventajas del ${c.nombre}`)
    if (p.conclusiones && vacio(c.analisis.conclusiones)) (c.analisis.conclusiones = p.conclusiones), cambios.push(`conclusiones del ${c.nombre}`)
  })
  // la conclusión por fase vale para todos los CAP si sólo hay concepto
  const conc = pc.find((p) => p?.conclusiones)?.conclusiones
  if (conc) for (const c of caps) if (vacio(c.analisis.conclusiones)) (c.analisis.conclusiones = conc), cambios.push(`conclusiones del ${c.nombre}`)
  const dec = pc.filter((p) => limpio(p?.apoyable))
  if (dec.length && vacio(campos.factibilidad)) {
    campos.factibilidad = dec.map((p) => `${p.nombre || 'CAP'}: ${p.apoyable}`).join('\n')
    cambios.push('Factibilidad del apoyo')
  }
  let { objeto, cartas, anexos } = v
  const unidad = unidadDe(ctx)
  if (vacio(objeto)) (objeto = `Determinar si la operación ${unidad ? `${articuloDe(unidad)} ${unidad} ` : ''}puede ser apoyada logísticamente y cuál es el curso de acción mejor apoyado.`), cambios.push('OBJETO')
  const carta = limpio(ctx.ordenSup?.carta)
  if (vacio(cartas) && carta) (cartas = carta), cambios.push('CARTAS')
  if (vacio(anexos)) {
    anexos = ['“A” Calco de apoyo logístico (áreas, ejes e instalaciones).', ctx.analisis?.areas?.length ? '“B” Evaluación de las áreas propuestas.' : ''].filter(Boolean).join('\n')
    cambios.push('ANEXOS')
  }
  return { valor: { ...v, objeto, cartas, anexos, campos, caps }, cambios: [...new Set(cambios)] }
}
// La F2·P13 parte de la F1·P3 (sin pisar lo que ya tenga).
export function partirDe(valor, base) {
  const v = normalizarASL(valor)
  const b = normalizarASL(base)
  const campos = { ...v.campos }
  for (const c of CAMPOS_ASL) if (vacio(campos[c.id]) && !vacio(b.campos[c.id])) campos[c.id] = b.campos[c.id]
  const caps = tieneASL(valor) ? v.caps : b.caps
  return { ...v, objeto: v.objeto || b.objeto, cartas: v.cartas || b.cartas, anexos: v.anexos || b.anexos, campos, caps, ideas: v.ideas || b.ideas }
}

export function revisarASL(valor) {
  const v = normalizarASL(valor)
  const R = []
  const falta = (id, txt, tipo = 'aviso') => vacio(v.campos[id]) && R.push({ tipo, txt })
  falta('mision', 'I.- D.- Falta la MISIÓN DE LOGÍSTICA (con la tarea esencial).', 'err')
  falta('tareasEsp', 'I.- A.- 1.- Faltan las tareas específicas (la F2·P3 del G-4 las trae).')
  falta('caracteristicas', 'II.- A.- Faltan las características del área de operaciones (lugares aptos para el área de servicios, EPA y EPE posibles).')
  falta('situacionFunciones', 'II.- F.- Falta el estado actual por función (despliegue el Batallón Logístico en el calco).')
  falta('eleccionArea', 'III.- Falta la elección del área de apoyo logístico (pestaña ▣ ASDI → paso a paso).', 'err')
  v.caps.forEach((c) => {
    if (vacio(c.analisis.conclusiones)) R.push({ tipo: 'aviso', txt: `III.- ${c.nombre}: faltan las conclusiones (enfoque y prioridad por fase — pestaña 🎬 Concepto).` })
    if (vacio(c.ventajas) && vacio(c.desventajas)) R.push({ tipo: 'aviso', txt: `IV.- B.- ${c.nombre}: faltan ventajas y desventajas (la F5·P1 del G-4 las trae).` })
  })
  falta('factibilidad', 'V.- A.- Falta decir si la operación puede ser apoyada.', 'err')
  falta('mejorCap', 'V.- B.- Falta el curso de acción mejor apoyado.', 'err')
  return R
}

export function textoASL(valor) {
  const v = normalizarASL(valor)
  if (!tieneASL(v)) return ''
  const L = [TITULO_ASL]
  if (limpio(v.objeto)) L.push(`OBJETO: ${sinMarcaIA(v.objeto)}`)
  for (const c of CAMPOS_ASL) if (!vacio(v.campos[c.id])) L.push(`${c.titulo} ${sinMarcaIA(v.campos[c.id])}`)
  for (const c of v.caps) {
    const a = ANALISIS_CAP.filter(([k]) => !vacio(c.analisis[k])).map(([k, t]) => `${t} ${sinMarcaIA(c.analisis[k])}`)
    if (a.length) L.push(`ANÁLISIS ${c.nombre}: ${a.join(' ')}`)
    if (!vacio(c.ventajas)) L.push(`${c.nombre} — ventajas: ${sinMarcaIA(c.ventajas)}`)
    if (!vacio(c.desventajas)) L.push(`${c.nombre} — desventajas: ${sinMarcaIA(c.desventajas)}`)
  }
  return L.join('\n')
}
export function resumenASL(valor) {
  const v = normalizarASL(valor)
  const llenos = CAMPOS_ASL.filter((c) => !vacio(v.campos[c.id])).length
  return `${llenos} de ${CAMPOS_ASL.length} apartados · ${v.caps.length} CAP`
}

// ════════════════════════════════════════════════════════════════════════════════════
// MATRIZ DE SINCRONIZACIÓN LOGÍSTICA
// ════════════════════════════════════════════════════════════════════════════════════
export const ESQ_MATRIZ = 'matriz-sinc-log-v1'
export const TITULO_MATRIZ = 'MATRIZ DE SINCRONIZACIÓN LOGÍSTICA'
export const romano = (n) => {
  const r = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]
  let s = ''
  let x = n
  for (const [l, v] of r) while (x >= v) (s += l), (x -= v)
  return s
}
const faseVacia = (i, id = `f${i + 1}`) => ({ id, nombre: `FASE ${romano(i + 1)}`, desde: '', hasta: '' })
export function normalizarMatriz(valor) {
  const o = esObj(valor) ? valor : {}
  let fases = (Array.isArray(o.fases) ? o.fases : []).filter(esObj).map((f, i) => ({ id: limpio(f.id) || `f${i + 1}`, nombre: limpio(f.nombre) || `FASE ${romano(i + 1)}`, desde: limpio(f.desde), hasta: limpio(f.hasta) }))
  const ids = new Set()
  fases = fases.filter((f) => !ids.has(f.id) && ids.add(f.id))
  if (!fases.length) fases = [0, 1, 2].map((i) => faseVacia(i))
  const celdas = {}
  for (const f of FILAS_MATRIZ) {
    celdas[f.id] = {}
    for (const fa of fases) celdas[f.id][fa.id] = texto(o.celdas?.[f.id]?.[fa.id])
  }
  return {
    esquema: ESQ_MATRIZ,
    numero: limpio(o.numero),
    fases,
    celdas,
    ideas: texto(o.ideas),
    firma: limpio(o.firma),
    iaCampos: Array.isArray(o.iaCampos) ? [...new Set(o.iaCampos.map(String))] : [],
  }
}
export const esMatrizLog = (v) => esObj(v) && v.esquema === ESQ_MATRIZ
export const tieneMatriz = (v) => esMatrizLog(v) && Object.values(normalizarMatriz(v).celdas).some((r) => Object.values(r).some(limpio))
export const nuevaFase = (v) => {
  const m = normalizarMatriz(v)
  let i = m.fases.length
  while (m.fases.some((f) => f.id === `f${i + 1}`)) i++
  return faseVacia(m.fases.length, `f${i + 1}`)
}

// Lo que el calco y el concepto de apoyo dicen de cada fase.
export function propuestasMatriz(ctx = {}, fases = []) {
  const calco = ctx.calco || {}
  const ops = calco.ops || {}
  const concepto = Array.isArray(calco.conceptoApoyo) ? calco.conceptoApoyo : []
  const P = {}
  const put = (fila, fase, t) => {
    if (!t) return
    P[fila] = P[fila] || {}
    P[fila][fase] = t
  }
  const fun = instalacionesPorFuncion(calco.unidades, ctx.catalogo)
  const items = (nom) => fun.find((f) => f.nom === nom)?.items || []
  const cerca = (xs) => xs.map((x) => `${x.nombre} (${coordenada(x.p)})`).join('; ')
  const zs = (ops.zonasLog || []).map((z, i) => ({ z, i })).filter(({ z }) => limpiar(z.coords).length >= 3 && !z.descartada && (!z.propuesta || z.elegida))
  const arce = zs.filter(({ z }) => z.zona === 'arce').map(({ z, i }) => `${nombreCalco(z, i)} en ${coordenada(centroide(z.coords))}`)
  const asdi = zs.filter(({ z }) => z.zona === 'asdi').map(({ z, i }) => `${nombreCalco(z, i)} en ${coordenada(centroide(z.coords))}`)
  const base = items('Abastecimientos').filter((x) => /baselog|deposito|p_abast/.test(x.u.instalacion))
  const pd = items('Abastecimientos').filter((x) => /^pd_|^pcm/.test(x.u.instalacion))
  const sani = items('Evacuación y hospitalización')
  const mant = items('Mantenimiento')
  const recup = mant.filter((x) => /pcol|prec/.test(x.u.instalacion))
  const epa = ejesTexto(ops, 'epa', 'EPA')
  const epe = ejesTexto(ops, 'epe', 'EPE')
  fases.forEach((fa, i) => {
    const c = esObj(concepto[i]) ? concepto[i] : null
    if (c?.enfoque?.length) put('enfoque', fa.id, c.enfoque.map(nombreEnfoque).join(', '))
    if (limpio(c?.prioridad)) put('prioridad', fa.id, limpio(c.prioridad))
    if (i > 0) return // lo que está en el calco es la situación de la primera fase
    if (arce.length || base.length) put('secciones', fa.id, [arce.length && arce.join('; '), base.length && cerca(base)].filter(Boolean).join('\n'))
    if (asdi.length || pd.length) put('abast_centros', fa.id, [asdi.join('; '), pd.length && `Puestos de distribución: ${pd.map((x) => x.nombre).join(', ')}`].filter(Boolean).join('\n'))
    if (epa) put('abast_ejes', fa.id, `${epa}\nESA: [definir]`)
    if (sani.length) put('evac_hosp', fa.id, `${cerca(sani.filter((x) => /pced|p_quir/.test(x.u.instalacion))) || cerca(sani.slice(0, 2))}\nNorma de evacuación: [definir]${limpio(c?.prioridad) ? `\nPA: ${limpio(c.prioridad)}` : ''}`)
    if (epe) put('evac_ejes', fa.id, `${epe}\nESE: [definir]`)
    if (mant.length) put('mantenimiento', fa.id, `Centros de mantenimiento: ${cerca(mant.filter((x) => !/pcol|prec/.test(x.u.instalacion)))}`)
    if (recup.length) put('recuperacion', fa.id, `Centro de recolección en ${cerca(recup)}`)
  })
  return P
}
export function armarMatriz(valor, ctx = {}) {
  const v = normalizarMatriz(valor)
  const cambios = []
  let fases = v.fases
  const fCOA = ctx.calco?.fasesCOA?.propio || []
  const sinTocar = !tieneMatriz(valor) && fases.every((f, i) => f.nombre === `FASE ${romano(i + 1)}` && !f.desde && !f.hasta)
  if (fCOA.length && sinTocar) {
    fases = fCOA.map((f, i) => ({ ...faseVacia(i), nombre: `FASE ${romano(i + 1)}${limpio(f?.nombre) ? ` — ${limpio(f.nombre)}` : ''}` }))
    cambios.push(`${fases.length} fase(s) del curso de acción propio`)
  }
  const celdas = Object.fromEntries(Object.entries(v.celdas).map(([k, r]) => [k, { ...r }]))
  for (const f of FILAS_MATRIZ) for (const fa of fases) celdas[f.id][fa.id] = celdas[f.id][fa.id] || ''
  const P = propuestasMatriz(ctx, fases)
  for (const [fila, porFase] of Object.entries(P))
    for (const [fase, t] of Object.entries(porFase))
      if (vacio(celdas[fila]?.[fase])) {
        celdas[fila][fase] = t
        cambios.push(FILAS_MATRIZ.find((x) => x.id === fila)?.rot.toLowerCase() || fila)
      }
  return { valor: { ...v, fases, celdas }, cambios: [...new Set(cambios)] }
}
export function copiarFaseAnterior(valor, faseId) {
  const v = normalizarMatriz(valor)
  const i = v.fases.findIndex((f) => f.id === faseId)
  if (i < 1) return v
  const prev = v.fases[i - 1].id
  const celdas = Object.fromEntries(Object.entries(v.celdas).map(([k, r]) => [k, { ...r, [faseId]: vacio(r[faseId]) ? r[prev] : r[faseId] }]))
  return { ...v, celdas }
}
export function textoMatriz(valor) {
  const v = normalizarMatriz(valor)
  if (!tieneMatriz(v)) return ''
  const L = [TITULO_MATRIZ]
  for (const f of FILAS_MATRIZ) {
    const xs = v.fases.map((fa) => (vacio(v.celdas[f.id][fa.id]) ? '' : `${fa.nombre}: ${sinMarcaIA(v.celdas[f.id][fa.id]).replace(/\n/g, ' · ')}`)).filter(Boolean)
    if (xs.length) L.push(`${f.grupo ? `${f.grupo} — ` : ''}${f.rot}: ${xs.join(' | ')}`)
  }
  return L.join('\n')
}
export function revisarMatriz(valor) {
  const v = normalizarMatriz(valor)
  const R = []
  for (const f of FILAS_MATRIZ) {
    const vacias = v.fases.filter((fa) => vacio(v.celdas[f.id][fa.id])).map((fa) => fa.nombre.split(' — ')[0])
    if (vacias.length === v.fases.length) R.push({ tipo: ['enfoque', 'prioridad', 'amenaza'].includes(f.id) ? 'err' : 'aviso', txt: `${f.grupo ? `${f.grupo} — ` : ''}${f.rot}: vacío en todas las fases.` })
    else if (vacias.length) R.push({ tipo: 'aviso', txt: `${f.grupo ? `${f.grupo} — ` : ''}${f.rot}: falta en ${vacias.join(', ')}.` })
  }
  return R
}
export const NIVELES = NIVELES_AMENAZA
export { ENFOQUES, LETRAS }

// ─── Para el compilado: las hojas de logística del G-4 ──────────────────────────────
export const TIPOS_LOG = ['aprecLog', 'matrizLog']
export const esHojaLog = (h) => !!h && TIPOS_LOG.includes(h.tipo)
export function tieneHojaLog(h, v) {
  if (h?.tipo === 'aprecLog') return tieneASL(v)
  if (h?.tipo === 'matrizLog') return tieneMatriz(v)
  return false
}
export function textoHojaLog(h, v) {
  if (h?.tipo === 'aprecLog') return textoASL(v)
  if (h?.tipo === 'matrizLog') return textoMatriz(v)
  return ''
}
// El nombre con el que el área figura en los documentos (la elegida, como ASDI/ARCE).
export function nombreCalco(z, i = 0) {
  if (z?.propuesta && z?.elegida) return `${String(z.zona || 'asdi').toUpperCase()}${Number.isFinite(+z.division) ? ` ${+z.division}` : ''} (Área ${z.propuesta}, elegida)`
  return nombreArea(z, i)
}
