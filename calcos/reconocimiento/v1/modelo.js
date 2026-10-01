// Orden de Reconocimiento — hoja F2·P9 del G-3 (con el G-2), en el análisis de la misión.
//
// Es la ORDEN completa, con la forma de la Escuela (el ejemplo «06. ORDEN DE
// RECONOCIMIENTO» de la DIV.MEC.-2), y con el membrete de los demás documentos de la Mesa:
//
//   membrete · ORDEN DE RECONOCIMIENTO No. 01
//   OBJETO · CARTA · ANEXOS
//   ORGANIZACIÓN DE LA TAREA: cuadro, una columna por equipo («EQ. ZULU») con sus elementos
//   I.-   SITUACIÓN.            A.- Enemiga.  B.- Propia.
//   II.-  MISIÓN.
//   III.- EJECUCIÓN.            A.- Plan de Reconocimiento (1.- Objetivo general, 2.- Método)
//                               B.- Tareas para los equipos de reconocimiento
//                                   (1.- Forma de llegar: a.- b.- c.-; 2.- Tareas: a.- Equipo
//                                   ZULU «Obtener información referente a:» - …; 3.- Plazos)
//                               C.- Instrucciones de coordinación (1.- 2.- …)
//   IV.-  APOYO DE SERVICIO.    A.- Abastecimientos (1.- …)  B.- Transporte.
//   V.-   COMANDO Y COMUNICACIONES.  A.- Comando (1.- …)  B.- Comunicaciones (1.- …)
//   firma del Comandante · Autenticación · Distribución
//
// Antes la hoja era una matriz de renglones (Órgano · Tarea · Área · Alcance · No antes de ·
// No después de · Dónde informa). Esa matriz se lee sola: cada renglón pasa a ser un
// EQUIPO con su órgano como elemento, y no se pierde ningún dato.
//
// Sin DOM: se prueba en Node.
import { limpio, texto, claveTexto, sinMarcaIA, nuevoId, items, articuloDe } from '../../riesgo/v1/modelo.js'
import { unidadPropiaDelEjercicio } from '../../conceptos/v4/modelo.js'

export { limpio, texto, claveTexto, sinMarcaIA, nuevoId, items }

export const ESQUEMA = 'reconocimiento-v1'
export const TITULO = 'ORDEN DE RECONOCIMIENTO'
export const MODELO = 'Orden de Reconocimiento — formato de la Escuela (ejemplo DIV.MEC.-2)'

// Las columnas de la hoja de antes (y de lo que otros pedidos a la IA todavía traen).
export const COLS_ANTES = ['Órgano de reconocimiento', 'Tarea', 'Área / objetivo a reconocer', 'Alcance del medio', 'No antes de', 'No después de', 'Dónde informa']

// Nombres clave de los equipos (alfabeto fonético), como ZULU, TANGO y VICTOR del ejemplo.
export const FONETICO = ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIETT', 'KILO', 'LIMA', 'MIKE', 'NOVIEMBRE', 'OSCAR', 'PAPA', 'QUEBEC', 'ROMEO', 'SIERRA', 'TANGO', 'UNIFORME', 'VICTOR', 'WHISKEY', 'X-RAY', 'YANKEE', 'ZULU']

// Los campos de texto y de lista de la orden (fuera de los equipos), con su rótulo.
export const TEXTOS = [
  ['objeto', 'OBJETO'],
  ['carta', 'CARTA'],
  ['anexos', 'ANEXOS'],
  ['enemiga', 'I.- SITUACIÓN · A.- Enemiga'],
  ['propia', 'I.- SITUACIÓN · B.- Propia'],
  ['mision', 'II.- MISIÓN'],
  ['objetivo', 'III.- A.- 1.- Objetivo general del reconocimiento'],
  ['metodo', 'III.- A.- 2.- Método del reconocimiento'],
  ['formaIntro', 'III.- B.- 1.- Forma de llegar a la zona de reconocimiento'],
  ['plazos', 'III.- B.- 3.- Plazos en tiempo'],
  ['transporte', 'IV.- B.- Transporte'],
]
export const LISTAS = [
  ['medios', 'III.- B.- 1.- Medios para llegar (a.- b.- c.-)'],
  ['coordinacion', 'III.- C.- Instrucciones de coordinación'],
  ['abastecimientos', 'IV.- A.- Abastecimientos'],
  ['comando', 'V.- A.- Comando'],
  ['comunicaciones', 'V.- B.- Comunicaciones'],
]
export const CAMPOS_EQUIPO = ['nombre', 'tarea', 'area', 'alcance', 'noAntes', 'noDespues', 'informa']
export const FORMA_INTRO = 'Para el reconocimiento se emplearán los siguientes medios:'
export const OBTENER = 'Obtener información referente a:'

// ─── Utilidades ──────────────────────────────────────────────────────────────────
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
// El texto tal cual (la hoja se guarda en cada tecla): sólo se limpia al imprimir.
const cadena = (s) => (s == null ? '' : String(s))
const cadenas = (xs) => (Array.isArray(xs) ? xs.map(cadena) : typeof xs === 'string' && xs.trim() ? xs.split(/\n+/) : [])
const MARCA_IA = /\[\s*IA\s*[—–-]+\s*verificar\s*\]/i
const tieneMarca = (s) => MARCA_IA.test(String(s ?? ''))
// «- Movimiento motorizado.», «a.- …», «1.- …», «•», «✓»: la viñeta o el número sobran.
export const sinVineta = (s) => String(s ?? '').replace(/^\s*(?:[-–•✓·*]|[a-z]\s*[.)]-?|\d+\s*[.)]-?)\s*/i, '')
export const lista = (xs) => cadenas(xs).map((x) => sinMarcaIA(sinVineta(x))).filter(Boolean)
// «EQ. ZULU», «Equipo “Zulu”», «zulu» → «ZULU».
export const nombreEquipo = (s) =>
  sinMarcaIA(s)
    .replace(/^\s*(?:EQ(?:UIPO)?\.?\s*)/i, '')
    .replace(/[“”"«»]/g, '')
    .replace(/\.$/, '')
    .trim()
    .toUpperCase()

export function equipoVacio(id = nuevoId('e')) {
  return { id, nombre: '', elementos: [], tarea: '', area: '', alcance: '', noAntes: '', noDespues: '', informa: '', obtener: [], ia: false }
}
export function ordenVacia() {
  const v = { esquema: ESQUEMA, numero: '', equipos: [], ideas: '', firma: '', distribucion: '', iaCampos: [] }
  for (const [k] of TEXTOS) v[k] = ''
  for (const [k] of LISTAS) v[k] = []
  return v
}

function normEquipo(e, i = 0) {
  const x = esObj(e) ? e : {}
  const out = {
    id: limpio(x.id) || `e${i + 1}`,
    nombre: cadena(x.nombre),
    elementos: cadenas(x.elementos),
    tarea: cadena(x.tarea),
    area: cadena(x.area),
    alcance: cadena(x.alcance),
    noAntes: cadena(x.noAntes),
    noDespues: cadena(x.noDespues),
    informa: cadena(x.informa),
    obtener: cadenas(x.obtener),
    ia: !!x.ia,
  }
  if (esObj(x.antes) && Object.keys(x.antes).length) out.antes = Object.fromEntries(Object.entries(x.antes).map(([k, v]) => [k, limpio(v)]).filter(([, v]) => v))
  return out
}

// ─── La hoja de antes: la matriz de renglones ────────────────────────────────────
// Cada renglón es un ÓRGANO de reconocimiento → un equipo con ese órgano como elemento.
// El nombre clave del equipo lo pone el oficial (o la IA); mientras tanto el cuadro dice
// «EQUIPO 1». Lo que la IA había escrito con «[IA — verificar]» queda marcado para revisar.
export function equipoDeRenglon(f, i = 0) {
  const x = esObj(f) ? f : {}
  const val = (...ks) => {
    for (const k of ks) if (limpio(x[k])) return sinMarcaIA(x[k])
    return ''
  }
  const organo = val('Órgano de reconocimiento', 'Organo de reconocimiento', 'organo', 'órgano', 'Órgano')
  const e = {
    ...equipoVacio(`e-antes-${i + 1}`),
    elementos: organo ? [organo] : [],
    tarea: val('Tarea', 'tarea'),
    area: val('Área / objetivo a reconocer', 'Área', 'area', 'área'),
    alcance: val('Alcance del medio', 'Alcance', 'alcance'),
    noAntes: val('No antes de', 'noAntes'),
    noDespues: val('No después de', 'No despues de', 'noDespues'),
    informa: val('Dónde informa', 'Donde informa', 'informa'),
    ia: Object.values(x).some(tieneMarca),
  }
  const conocidas = new Set([...COLS_ANTES, 'Organo de reconocimiento', 'organo', 'órgano', 'Órgano', 'tarea', 'Área', 'area', 'área', 'Alcance', 'alcance', 'noAntes', 'noDespues', 'No despues de', 'Donde informa', 'informa'])
  const resto = Object.entries(x).filter(([k, v]) => !conocidas.has(k) && limpio(v))
  if (resto.length) e.antes = Object.fromEntries(resto.map(([k, v]) => [k, sinMarcaIA(v)]))
  return e
}
const renglonConContenido = (f) => esObj(f) && Object.values(f).some((x) => limpio(sinMarcaIA(x)))
export function desdeFilas(filas) {
  const v = ordenVacia()
  v.equipos = (filas || []).filter(renglonConContenido).map(equipoDeRenglon)
  if (v.equipos.length) v.legado = true
  return v
}

export function normalizarOrden(valor) {
  if (Array.isArray(valor)) return desdeFilas(valor)
  const x = esObj(valor) ? valor : {}
  const v = ordenVacia()
  v.numero = cadena(x.numero)
  for (const [k] of TEXTOS) v[k] = cadena(x[k])
  for (const [k] of LISTAS) v[k] = cadenas(x[k])
  v.equipos = (Array.isArray(x.equipos) ? x.equipos : []).filter(esObj).map(normEquipo)
  v.ideas = cadena(x.ideas)
  v.firma = cadena(x.firma)
  v.distribucion = cadena(x.distribucion)
  v.iaCampos = (Array.isArray(x.iaCampos) ? x.iaCampos : []).filter((k) => typeof k === 'string')
  if (x.legado) v.legado = true
  return v
}
export const esOrden = (v) => esObj(v) && v.esquema === ESQUEMA

// Lo que se guarda: la orden normalizada, con el texto tal cual.
export function serializar(v) {
  const n = normalizarOrden(v)
  const out = { ...n, equipos: n.equipos.map((e) => ({ ...e, elementos: [...e.elementos], obtener: [...e.obtener] })) }
  for (const [k] of LISTAS) out[k] = [...n[k]]
  out.iaCampos = [...new Set(n.iaCampos)]
  return out
}

const equipoConContenido = (e) => !!(limpio(e.nombre) || lista(e.elementos).length || lista(e.obtener).length || ['tarea', 'area', 'alcance', 'noAntes', 'noDespues', 'informa'].some((k) => limpio(e[k])))
// ¿La hoja tiene contenido? (para el «✅» y el conteo de documentos del G-3).
export function tieneOrden(valor) {
  if (Array.isArray(valor)) return valor.some(renglonConContenido)
  if (!esObj(valor)) return false
  const v = normalizarOrden(valor)
  return TEXTOS.some(([k]) => limpio(v[k])) || LISTAS.some(([k]) => lista(v[k]).length) || v.equipos.some(equipoConContenido)
}

// ─── Lo que se imprime ───────────────────────────────────────────────────────────
// El nombre de la columna del cuadro: «EQ. ZULU» (o «EQUIPO 2» si todavía no tiene).
export function rotuloEquipo(e, i = 0) {
  const n = nombreEquipo(e?.nombre)
  return n ? `EQ. ${n}` : `EQUIPO ${i + 1}`
}
// El inciso de «2.- Tareas.»: «Equipo ZULU.»
export function incisoEquipo(e, i = 0) {
  const n = nombreEquipo(e?.nombre)
  return n ? `Equipo ${n}.` : `Equipo ${i + 1}.`
}
const punto = (s) => (s && !/[.!?:;]$/.test(s) ? `${s}.` : s)
// Los plazos de cada equipo, para «3.- Plazos en tiempo.» (sólo los que los tienen).
export function plazosDeEquipos(v) {
  return normalizarOrden(v)
    .equipos.map((e, i) => {
      const na = sinMarcaIA(e.noAntes)
      const nd = sinMarcaIA(e.noDespues)
      const inf = sinMarcaIA(e.informa)
      if (!na && !nd && !inf) return ''
      const partes = []
      if (na) partes.push(`no antes de ${na}`)
      if (nd) partes.push(`no después de ${nd}`)
      let t = `${incisoEquipo(e, i).replace(/\.$/, '')}: ${partes.join(', ')}`
      if (inf) t += `${partes.length ? '; ' : ''}informa en ${inf.replace(/^(?:en|al|a)\s+/i, '')}`
      return punto(t.replace(/: $/, ''))
    })
    .filter(Boolean)
}
// Lo que va debajo de «a.- Equipo ZULU.»: la tarea y el área (si las hay) y la lista.
export function cuerpoEquipo(e) {
  const tarea = sinMarcaIA(e.tarea)
  const area = sinMarcaIA(e.area)
  const lineas = []
  if (tarea) lineas.push(punto(tarea))
  if (area && !(tarea && claveTexto(tarea).includes(claveTexto(area)))) lineas.push(punto(`Área a reconocer: ${area}`))
  const obtener = lista(e.obtener)
  if (obtener.length) lineas.push(OBTENER)
  return { lineas, obtener }
}

// ─── Unidad, firma y distribución ────────────────────────────────────────────────
export function unidadDe(ctx = {}) {
  const c = ctx || {}
  return limpio(c.ops?.unidadConsiderada?.nombre) || unidadPropiaDelEjercicio(c).nombre || limpio(c.unidad) || ''
}
export function firmaDe(valor, ctx = {}) {
  const v = normalizarOrden(valor)
  if (limpio(v.firma)) return limpio(v.firma)
  if (limpio(ctx?.firmaCmte)) return limpio(ctx.firmaCmte)
  const u = unidadDe(ctx)
  return u ? `EL COMANDANTE ${articuloDe(u)} ${u}` : ''
}
// Como el ejemplo: el original queda en la unidad, una copia a la Sec. III y una a cada equipo.
export function distribucionDe(valor, ctx = {}) {
  const v = normalizarOrden(valor)
  if (limpio(v.distribucion)) return texto(v.distribucion)
  const u = unidadDe(ctx)
  const eqs = v.equipos.filter(equipoConContenido)
  const lineas = [`Original: ${u || '[Unidad pendiente]'}`, 'Copia 1: SEC-III']
  if (eqs.length) {
    const ini = eqs.map((e, i) => nombreEquipo(e.nombre).slice(0, 1) || String(i + 1)).join('-')
    lineas.push(`Copia ${eqs.length > 1 ? `2-${eqs.length + 1}` : '2'}: EQ. ${ini}`)
  }
  return lineas.join('\n')
}

// ─── Lo que se lee del ejercicio ─────────────────────────────────────────────────
// Los órganos de reconocimiento del calco con su alcance del reglamento: los da la Mesa
// (la misma siembra que tenía la hoja de antes: «Órgano de reconocimiento» y «Alcance»).
export function organosDelCalco(ctx = {}, semilla = null) {
  let filas = []
  try {
    filas = typeof semilla === 'function' ? semilla('ivr', ctx || {}) : []
  } catch {
    filas = []
  }
  return (Array.isArray(filas) ? filas : [])
    .map((f) => ({ organo: sinMarcaIA(f?.['Órgano de reconocimiento']), alcance: sinMarcaIA(f?.['Alcance del medio']) }))
    .filter((o) => o.organo)
}
export function lecturaDelEjercicio(ctx = {}, { semilla = null } = {}) {
  const c = ctx || {}
  const os = c.ordenSup || {}
  const unidad = unidadDe(c)
  const misionG3 = sinMarcaIA(c.g3?.mision?.['ENUNCIADO COMPLETO DE LA MISIÓN'])
  const mision = misionG3 ? { texto: misionG3, fuente: 'Reexpresión de la misión (F2·P12)' } : limpio(os.mision) ? { texto: sinMarcaIA(os.mision), fuente: 'Orden del escalón superior («MISIÓN»)' } : { texto: '', fuente: '' }
  const g3 = c.g3 || {}
  const conPrep = (k) => !!g3[k] && Object.values(g3[k]).some((x) => limpio(x))
  return {
    unidad,
    superior: limpio(os.escalonSuperior),
    mision,
    carta: sinMarcaIA(os.carta),
    puestoMando: sinMarcaIA(os.puestoMando),
    organos: organosDelCalco(c, semilla),
    preparatorias: ['prep1', 'prep2', 'prep3'].filter(conPrep).map((k) => ({ prep1: '01', prep2: '02', prep3: '03' })[k]),
  }
}

// 🌱 Trae del calco y del ejercicio lo que falte. Sólo llena lo VACÍO: no toca una coma
// de lo que el oficial (o la IA) ya escribió.
//   · cada órgano de reconocimiento del calco que no esté en ningún equipo → un equipo
//     nuevo con ese órgano como elemento y su alcance;
//   · la carta de la Orden del escalón superior;
//   · «Enemiga»: la referencia a la última Orden Preparatoria emitida (como el ejemplo).
export function armarDesdeEjercicio(valor, ctx = {}, op = {}) {
  const v = normalizarOrden(valor)
  const l = lecturaDelEjercicio(ctx, op)
  const cambios = []
  const yaEsta = (organo) => v.equipos.find((e) => e.elementos.some((x) => claveTexto(x) === claveTexto(organo)))
  let nuevos = 0
  let alcances = 0
  for (const o of l.organos) {
    const e = yaEsta(o.organo)
    if (e) {
      if (!limpio(e.alcance) && o.alcance) {
        e.alcance = o.alcance
        alcances++
      }
      continue
    }
    v.equipos.push({ ...equipoVacio(nuevoId('e')), elementos: [o.organo], alcance: o.alcance })
    nuevos++
  }
  if (nuevos) cambios.push(`${nuevos} equipo(s) con los órganos de reconocimiento del calco`)
  if (alcances) cambios.push(`el alcance de ${alcances} órgano(s)`)
  if (!limpio(v.carta) && l.carta) {
    v.carta = l.carta
    cambios.push('la CARTA (Orden del escalón superior)')
  }
  if (!limpio(v.enemiga) && l.preparatorias.length) {
    v.enemiga = `Ver Orden Preparatoria No. ${l.preparatorias.at(-1)} y Anexo de Inteligencia.`
    cambios.push('la situación enemiga (referencia a la Orden Preparatoria)')
  }
  return { valor: v, cambios, lectura: l }
}

// ─── Revisión: lo que le falta para estar completa ───────────────────────────────
export function revisarOrden(valor) {
  const v = normalizarOrden(valor)
  const out = []
  const falta = (k, txt) => !limpio(v[k]) && out.push({ tipo: 'aviso', txt })
  falta('objeto', 'Falta el OBJETO (una sola frase: de qué se trata el reconocimiento).')
  falta('carta', 'Falta la CARTA (nombre y escala).')
  falta('anexos', 'Faltan los ANEXOS (p. ej. “A” Calco de reconocimiento).')
  if (!v.equipos.length) out.push({ tipo: 'err', txt: 'No hay equipos: sin ORGANIZACIÓN DE LA TAREA la orden no tiene a quién ordenar. 🌱 Traelos del calco, pedíselos a la IA o agregalos.' })
  v.equipos.forEach((e, i) => {
    const r = rotuloEquipo(e, i)
    if (!nombreEquipo(e.nombre)) out.push({ tipo: 'aviso', txt: `${r}: falta el nombre clave (ZULU, TANGO, VICTOR…).` })
    if (!lista(e.elementos).length) out.push({ tipo: 'aviso', txt: `${r}: falta con qué elementos se arma (secciones, patrullas, drones, observadores).` })
    if (!lista(e.obtener).length) out.push({ tipo: 'err', txt: `${r}: falta qué información tiene que obtener («Obtener información referente a:»).` })
  })
  falta('enemiga', 'Falta la situación enemiga (I.- A.-).')
  falta('propia', 'Falta la situación propia (I.- B.-).')
  falta('mision', 'Falta la MISIÓN del reconocimiento (quién, qué, cuándo, dónde y para qué).')
  falta('objetivo', 'Falta el objetivo general del reconocimiento (III.- A.- 1.-).')
  falta('metodo', 'Falta el método del reconocimiento (III.- A.- 2.-).')
  if (!lista(v.medios).length) out.push({ tipo: 'aviso', txt: 'Falta la forma de llegar a la zona de reconocimiento (III.- B.- 1.-).' })
  if (!limpio(v.plazos) && !plazosDeEquipos(v).length) out.push({ tipo: 'aviso', txt: 'Faltan los plazos en tiempo (III.- B.- 3.-).' })
  if (!lista(v.coordinacion).length) out.push({ tipo: 'aviso', txt: 'Faltan las instrucciones de coordinación (III.- C.-).' })
  if (!lista(v.abastecimientos).length && !limpio(v.transporte)) out.push({ tipo: 'aviso', txt: 'Falta el apoyo de servicio (IV.-).' })
  if (!lista(v.comando).length && !lista(v.comunicaciones).length) out.push({ tipo: 'aviso', txt: 'Faltan comando y comunicaciones (V.-).' })
  return out
}

// ─── Texto para el expediente (y para los pedidos de las otras hojas) ────────────
export function textoOrden(valor) {
  const v = normalizarOrden(valor)
  const L = []
  const t = (rot, x) => limpio(x) && L.push(`  - ${rot}: ${sinMarcaIA(x).replace(/\s*\n\s*/g, ' / ')}`)
  const ls = (rot, xs) => lista(xs).length && L.push(`  - ${rot}: ${lista(xs).join(' · ')}`)
  t('Número', v.numero)
  t('OBJETO', v.objeto)
  t('CARTA', v.carta)
  t('ANEXOS', v.anexos)
  v.equipos.forEach((e, i) => {
    const partes = [
      lista(e.elementos).length ? `elementos: ${lista(e.elementos).join(', ')}` : '',
      limpio(e.tarea) ? `tarea: ${sinMarcaIA(e.tarea)}` : '',
      limpio(e.area) ? `área: ${sinMarcaIA(e.area)}` : '',
      limpio(e.alcance) ? `alcance: ${sinMarcaIA(e.alcance)}` : '',
      limpio(e.noAntes) ? `no antes de: ${sinMarcaIA(e.noAntes)}` : '',
      limpio(e.noDespues) ? `no después de: ${sinMarcaIA(e.noDespues)}` : '',
      limpio(e.informa) ? `informa en: ${sinMarcaIA(e.informa)}` : '',
      lista(e.obtener).length ? `obtener información referente a: ${lista(e.obtener).join(' / ')}` : '',
    ].filter(Boolean)
    L.push(`  - ${rotuloEquipo(e, i)}${partes.length ? ` — ${partes.join(' · ')}` : ''}`)
  })
  for (const [k, rot] of TEXTOS.slice(3)) t(rot, v[k])
  for (const [k, rot] of LISTAS) ls(rot, v[k])
  return L.join('\n')
}

export function resumenOrden(valor) {
  const v = normalizarOrden(valor)
  const llenos = TEXTOS.filter(([k]) => limpio(v[k])).length + LISTAS.filter(([k]) => lista(v[k]).length).length
  const total = TEXTOS.length + LISTAS.length
  return `${v.equipos.length} equipo(s) · ${llenos} de ${total} apartados escritos`
}
