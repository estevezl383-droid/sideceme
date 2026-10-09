// Membrete táctico de los DOCUMENTOS MILITARES de la Mesa del EM.
//
// Lo pidió Sergio (docente). Todos los documentos militares que salen del PMTD llevan,
// en Arial 10 negrilla, debajo de la clasificación:
//
//                                   SECRETO
//   DIV.MEC.-1                          ← escalón superior (la unidad que expidió la orden)
//   RCB-1                   CG. VIACHA D-15 (2300)   ← unidad considerada · CG · hora táctica
//   EMO/SEC-III                         ← Estado Mayor Operativo / sección que lo elabora
//   No. 001/SMM                         ← correlativo de la sección / iniciales del redactor
//
// · «CG. …» empieza justo debajo de la R de SECRETO (la 4.ª letra de la clasificación).
// · El CG es donde está la unidad considerada: el pueblo más cercano a su ficha en el
//   calco, en mayúsculas. La hora es la hora táctica (día D) del documento, sacada de la
//   Línea Inicial de Tiempo del paso 1: cada documento, en el momento del PMTD en que sale.
// · EMO/SEC-I … V: la pestaña (G-1 … G-5) en la que se elabora.
// · El número es correlativo POR SECCIÓN: el primer documento militar que expide la
//   sección es el 001, el siguiente el 002… Las iniciales son las del primer nombre y los
//   dos apellidos del usuario (SERGIO HERNAN MORALES MILLAS → SMM).
// · Las HOJAS DE TRABAJO no son documentos militares: no llevan membrete.
//
// Sin DOM: se prueba en Node (calcos/pruebas/membrete.cjs). El compilado le pasa lo que
// necesita con configurar() (la Línea de Tiempo y el rótulo de las fichas) y, en cada
// cambio del ejercicio, sincronizar() (fichas, capas, hojas de cada sección, la Orden).

export const UNIDAD_CONSIDERADA_POR_DEFECTO = 'RCB-1'
export const CG_SIN_LUGAR = 'CG. ……………'

const limpio = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
// «R.C.B.-1», «RCB-1», «rcb 1» → «RCB1» (para comparar designaciones).
export const claveUnidad = (s) => sinTildes(s).toUpperCase().replace(/[^A-Z0-9]+/g, '')
export const mismaUnidad = (a, b) => !!claveUnidad(a) && claveUnidad(a) === claveUnidad(b)

// ─── Estado que presta el compilado ──────────────────────────────────────────────
let entorno = {}
let estado = {}
export function configurar(v) {
  entorno = { ...entorno, ...(v || {}) }
}
export function sincronizar(v) {
  estado = { ...estado, ...(v || {}) }
}
export function estadoActual() {
  return estado
}
// Para las pruebas.
export function reiniciar() {
  entorno = {}
  estado = {}
}

// ─── Qué es un documento militar ─────────────────────────────────────────────────
// En el orden del PMTD (y la fase en que sale, para la hora del membrete). Son los
// productos de cada paso que docente enumeró; lo demás son hojas de trabajo.
export const DOCUMENTOS_MILITARES = [
  // Fase I — Recibir la misión
  { id: 'alerta', fase: 1, nom: 'Orden de Alerta al Estado Mayor' },
  { id: 'aprecActivas', fase: 1, nom: 'Evaluación inicial (apreciaciones activas)' },
  { id: 'aprecOps', fase: 1, nom: 'Evaluación inicial (apreciación activa de Operaciones)' },
  { id: 'aprecCmte', fase: 1, nom: 'Evaluación inicial (apreciación activa del Comandante)' },
  { id: 'aprecActiva', fase: 1, nom: 'Evaluación inicial (apreciación activa de la sección)' },
  { id: 'lineaTiempo', fase: 1, nom: 'Asignación del tiempo disponible (Línea Inicial de Tiempo)' },
  { id: 'progPlaneamiento', fase: 1, nom: 'Asignación del tiempo disponible (Programa General de Planeamiento)' },
  { id: 'guiaInicial', fase: 1, nom: 'Guía Inicial del Comandante' },
  { id: 'prep1', fase: 1, nom: 'Orden Preparatoria N° 1' },
  // Fase II — Análisis de la misión
  { id: 'riesgo', fase: 2, nom: 'Matriz de riesgo' },
  { id: 'rcic', fase: 2, nom: 'Requerimientos críticos (RCIC y EEIA)' },
  { id: 'prioridadRcic', fase: 2, nom: 'Requerimientos críticos (prioridad)' },
  { id: 'pbi', fase: 2, nom: 'Plan de búsqueda de información' },
  { id: 'ordenes', fase: 2, nom: 'Órdenes y pedidos de reunión de información' },
  { id: 'ivr', fase: 2, nom: 'Orden de Reconocimiento' },
  { id: 'aprecOrientacion', fase: 2, nom: 'Apreciación de la sección (actualizada)' },
  { id: 'orientacionEM', fase: 2, nom: 'Orientación del análisis de la misión' },
  { id: 'intencion', fase: 2, nom: 'Intención Inicial del Comandante' },
  { id: 'guiaPlanificacion', fase: 2, nom: 'Guía de Planificación del Comandante' },
  { id: 'prep2', fase: 2, nom: 'Orden Preparatoria N° 2' },
  { id: 'bav', fase: 2, nom: 'Lista de blancos de gran valor' },
  { id: 'lucrativos', fase: 2, nom: 'Lista de blancos lucrativos (G-2)' },
  // Fase IV — Juego de guerra
  { id: 'lbl', fase: 4, nom: 'Lista de blancos lucrativos' },
  // Fase VI — Aprobar el curso de acción
  { id: 'decisionCmte', fase: 6, nom: 'Intención del Comandante (decisión)' },
  { id: 'guiaFinal', fase: 6, nom: 'Guía de Planificación Final' },
  { id: 'riesgoFinal', fase: 6, nom: 'Matriz de riesgo (actualización)' },
  { id: 'controlOrden', fase: 6, nom: 'Tipo de ensayo (medidas de control y tipo de orden)' },
  { id: 'prep3', fase: 6, nom: 'Orden Preparatoria N° 3' },
  // Fase VII — Producción de la orden
  { id: 'opord', fase: 7, nom: 'Orden General de Operaciones' },
  { id: 'anexo', fase: 7, nom: 'Anexo a la Orden General de Operaciones' },
  { id: 'anexoF7P1', fase: 7, nom: 'Anexo a la Orden General de Operaciones (plan de la sección)' },
]
const POR_ID = new Map(DOCUMENTOS_MILITARES.map((d, i) => [d.id, { ...d, orden: i }]))
export const esDocumentoMilitar = (id) => POR_ID.has(String(id || ''))

// ─── Sección ─────────────────────────────────────────────────────────────────────
// Siempre EMO (Estado Mayor Operativo); la sección es la pestaña donde se elabora.
const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V']
const DE_ROMANO = { I: 1, II: 2, III: 3, IV: 4, V: 5 }
export function seccionEMO(s) {
  const t = sinTildes(limpio(s)).toUpperCase()
  if (!t) return ''
  let m = t.match(/\bG\s*-?\s*([1-5])\b/) || t.match(/\bSEC(?:CION)?\.?\s*-?\s*G?\s*-?\s*([1-5])\b/)
  if (m) return `EMO/SEC-${ROMANOS[Number(m[1])]}`
  m = t.match(/\bSEC(?:CION)?\.?\s*-?\s*(IV|V|I{1,3})\b/)
  if (m) return `EMO/SEC-${m[1]}`
  if (/\bJEM\b|JEFATURA|JEFE DE ESTADO MAYOR|COMANDO|\bCMTE\b/.test(t)) return 'EMO/JEM'
  if (/ESPECIAL|\bEME\b/.test(t)) return 'EMO/EME'
  return limpio(s)
}
// La clave de la sección para contar sus documentos: 1…5, 'jem', 'eme'.
function claveSeccion(emo) {
  const m = String(emo).match(/SEC-(IV|V|I{1,3})$/)
  if (m) return DE_ROMANO[m[1]]
  if (/JEM$/.test(emo)) return 'jem'
  if (/EME$/.test(emo)) return 'eme'
  return null
}
const PUESTO_A_SECCION = { g1: 'EMO/SEC-I', g2: 'EMO/SEC-II', g3: 'EMO/SEC-III', g4: 'EMO/SEC-IV', g5: 'EMO/SEC-V', jem: 'EMO/JEM', cmte: 'EMO/JEM', eme: 'EMO/EME' }

// ─── Iniciales del redactor ──────────────────────────────────────────────────────
// Primer nombre + apellido paterno + apellido materno: SERGIO HERNAN MORALES MILLAS →
// SMM. Se saca el grado y el arma (TCNL. DEM., CAP. INF. …). «MORALES MILLAS, SERGIO
// HERNAN» (apellidos primero, con coma) también da SMM.
const GRADOS = new Set('GRAL GRL CNL TCNL MY CAP TTE SBTTE SUBTTE SGTO SOF SOFM SOFMY SOF1 SOF2 SARG CBO DEM DAEN DIM DIMEC INF CAB ART ING COM LOG INT ADM SAN MUS TOP MEC TRANS AV DR LIC ING. SR SRA'.split(' '))
const PARTICULAS = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'VDA', 'VIUDA'])
export function iniciales(nombre) {
  const t = sinTildes(nombre).toUpperCase().trim()
  if (!t) return ''
  const palabras = (s) =>
    s
      .split(/\s+/)
      .map((p) => p.trim())
      .filter((p) => p && !/\.$/.test(p) && !GRADOS.has(p.replace(/[^A-Z0-9]/g, '')) && /[A-Z]/.test(p))
      .map((p) => p.replace(/[^A-Z]/g, ''))
      .filter((p) => p && !PARTICULAS.has(p))
  if (t.includes(',')) {
    const [ape, nom] = t.split(',')
    const a = palabras(ape)
    const n = palabras(nom || '')
    return [n[0], a[0], a[1]].filter(Boolean).map((p) => p[0]).join('')
  }
  const p = palabras(t)
  if (!p.length) return ''
  if (p.length === 1) return p[0][0]
  if (p.length === 2) return p[0][0] + p[1][0]
  return p[0][0] + p[p.length - 2][0] + p[p.length - 1][0]
}
// El usuario que entró por SIDECEME (su sesión está en el navegador).
export function nombreDelUsuario() {
  try {
    const g = globalThis
    const lee = (k) => (g.sessionStorage && g.sessionStorage.getItem(k)) || (g.localStorage && g.localStorage.getItem(k)) || null
    for (const k of ['sideceme_session', 'sideceme_session_p']) {
      const r = lee(k)
      if (!r) continue
      const u = JSON.parse(r)?.user || {}
      const n = limpio(u.nombre_completo || u.nombre || '')
      if (n) return n
    }
  } catch {
    /* sin almacenamiento (modo privado, Node) */
  }
  return ''
}
export function claveRedactor(os = {}) {
  const escrita = limpio(os.clave).toUpperCase().replace(/[^A-ZÑ]/g, '')
  return escrita || iniciales(estado.usuario || nombreDelUsuario()) || iniciales(estado.autor) || ''
}

// ─── Número correlativo de la sección ────────────────────────────────────────────
const tieneAlgo = (v) =>
  v == null
    ? false
    : typeof v === 'string'
      ? v.trim().length > 0 && !/^SIN\s+DATO/i.test(v.trim())
      : typeof v === 'number' || typeof v === 'boolean'
        ? false
        : Array.isArray(v)
          ? v.some(tieneAlgo)
          : typeof v === 'object'
            ? Object.entries(v).some(([k, x]) => !k.startsWith('_') && !['esquema', 'rotulos', 'membrete', 'firma'].includes(k) && tieneAlgo(x))
            : false
// Las hojas de cada sección, como las guarda la Mesa.
function hojasDeSeccion(clave, e = estado) {
  const g = e.hojasG || {}
  if (clave === 1) return g.g1 || {}
  if (clave === 2) return e.picb || {}
  if (clave === 3) return e.g3 || {}
  if (clave === 4) return g.g4 || {}
  if (clave === 5) return g.g5 || {}
  if (clave === 'jem') return { ...(g.cmte || {}), ...(g.jem || {}) }
  if (clave === 'eme') return g.eme || {}
  return {}
}
// Documentos militares que la sección ya tiene elaborados (con algo escrito), en orden.
export function expedidos(seccion, e = estado) {
  const hojas = hojasDeSeccion(claveSeccion(seccionEMO(seccion)), e)
  return DOCUMENTOS_MILITARES.filter((d) => tieneAlgo(hojas[d.id])).map((d) => d.id)
}
// 1, 2, 3… El documento va después de los que la sección elaboró antes que él en el
// PMTD. Un documento que no está en la lista (una apreciación, la Orden armada desde el
// calco) va después de todos los que ya tiene la sección.
export function correlativo(seccion, hojaId, e = estado) {
  const hechos = expedidos(seccion, e)
  const d = POR_ID.get(String(hojaId || ''))
  if (!d) return hechos.length + 1
  return hechos.filter((id) => POR_ID.get(id).orden < d.orden).length + 1
}
export const numeroConClave = (n, clave) => `${String(n).padStart(3, '0')}${clave ? `/${clave}` : ''}`

// ─── Dónde está la unidad considerada: el pueblo más cercano a su ficha ─────────
const esPropia = (u) => !!u && ['unidad', 'pc'].includes(u.tipo || 'unidad') && !/enem|rojo|amenaza/i.test(String(u.bando || '')) && Number.isFinite(u.lat) && Number.isFinite(u.lng)
function rotuloDe(u) {
  const r = typeof entorno.rotular === 'function' ? entorno.rotular : null
  const out = []
  try {
    if (r) out.push(r(u))
  } catch {
    /* ficha rara */
  }
  out.push(u.designacion, u.nombre, u.rotulo, u.etiqueta)
  return out.map(limpio).filter(Boolean)
}
export function fichaDeUnidad(nombre, unidades = estado.unidades || []) {
  const k = claveUnidad(nombre)
  if (!k) return null
  // Primero el puesto de comando de la unidad (si se colocó), después su ficha.
  const todas = (unidades || []).filter(esPropia)
  const pcs = todas.filter((u) => u.tipo === 'pc')
  const unid = todas.filter((u) => u.tipo !== 'pc')
  const de = (propias) => propias.find((u) => rotuloDe(u).some((r) => claveUnidad(r) === k)) || propias.find((u) => rotuloDe(u).some((r) => claveUnidad(r).startsWith(k) && !/^\d/.test(claveUnidad(r).slice(k.length)))) || null
  // El PC suele rotularse «PC RCB-1» / «PC/RCB-1».
  const enPC = pcs.find((u) => rotuloDe(u).some((r) => { const c = claveUnidad(r), i = c.indexOf(k); return i >= 0 && !/^\d/.test(c.slice(i + k.length)) }))
  return de(pcs) || enPC || de(unid)
}
const nombreLugar = (f) => {
  const p = f?.properties || {}
  return limpio(p.nombre || p.name || p.Nombre || p.NOMBRE || p['name:es'] || f?.nom || '')
}
const metros = (lng1, lat1, lng2, lat2) => {
  const c = Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180) || 1
  return Math.hypot((lng2 - lng1) * 111320 * c, (lat2 - lat1) * 110574)
}
export function lugarMasCercano(lng, lat, poblaciones) {
  const fs = poblaciones?.features || (Array.isArray(poblaciones) ? poblaciones : [])
  let mejor = null
  for (const f of fs) {
    const g = f?.geometry
    if (!g || g.type !== 'Point' || !Array.isArray(g.coordinates)) continue
    const n = nombreLugar(f)
    if (!n) continue
    const d = metros(lng, lat, g.coordinates[0], g.coordinates[1])
    if (!mejor || d < mejor.d) mejor = { nombre: n, d }
  }
  return mejor
}
export const conCG = (s) => {
  const t = limpio(s).replace(/^(?:C\.?\s?G\.?|P\.?\s?C\.?|CMDO\.?|COMANDO)\s*/i, '').trim()
  return t ? `CG. ${t.toUpperCase()}` : ''
}
export function puestoDeLaUnidad(nombre, os = {}, e = estado) {
  if (limpio(os.puestoPropio)) return { cg: conCG(os.puestoPropio), fuente: 'escrito en la Orden («CG de la unidad considerada»)' }
  const f = fichaDeUnidad(nombre, e.unidades || [])
  if (f) {
    const l = lugarMasCercano(f.lng, f.lat, e.capas?.poblaciones_puntos)
    if (l) return { cg: conCG(l.nombre), fuente: `el pueblo más cercano a la ficha de la ${limpio(nombre)} en el calco (${(l.d / 1000).toFixed(1).replace('.', ',')} km)` }
  }
  return { cg: '', fuente: '' }
}

// ─── Hora táctica del documento (Línea Inicial de Tiempo) ────────────────────────
// Fase I: la recepción de la orden. Fases II a VII: el fin de esa fase en el reparto
// del tiempo de planeamiento (análisis de la misión = fase II … elaborar la orden =
// fase VII). Sin fase (una apreciación, la Orden armada desde el calco): ahora mismo, si
// cae dentro del planeamiento; si no, el fin del planeamiento.
export function lineaDeTiempo(e = estado) {
  const lt = e.g3?.lineaTiempo || e.hojasG?.jem?.lineaTiempo || null
  const ms = typeof entorno.lineaDeTiempo === 'function' ? entorno.lineaDeTiempo : null
  if (!lt || !ms) return null
  try {
    const r = ms(lt)
    return r && r.ok ? r : null
  } catch {
    return null
  }
}
export function momentoDelDocumento(hojaId, lt, ahora = new Date()) {
  if (!lt || !lt.recepcion) return null
  const d = POR_ID.get(String(hojaId || ''))
  const recepcion = lt.recepcion.getTime()
  if (d) {
    if (d.fase <= 1) return new Date(recepcion)
    let t = recepcion
    for (const [i, f] of (lt.fases || []).entries()) {
      t += f.ms || 0
      if (i + 2 >= d.fase) break
    }
    return new Date(t)
  }
  const ya = ahora instanceof Date ? ahora.getTime() : Number(ahora)
  const fin = lt.limitePlaneamiento ? lt.limitePlaneamiento.getTime() : lt.inicioOperacion?.getTime()
  if (Number.isFinite(ya) && ya >= recepcion && (!fin || ya <= (lt.inicioOperacion?.getTime() ?? fin))) return new Date(ya)
  return new Date(fin || recepcion)
}
export function horaTactica(hojaId, e = estado, ahora = new Date()) {
  const lt = lineaDeTiempo(e)
  if (!lt || typeof lt.enDiaD !== 'function') return ''
  const m = momentoDelDocumento(hojaId, lt, ahora)
  return m ? limpio(lt.enDiaD(m)) : ''
}

// ─── Los campos del membrete ─────────────────────────────────────────────────────
// `ctx`: { unidad, seccion, hoja, puesto, unidadPropia, numero } (lo que ya pasaba la Mesa
// al armar un documento). `os`: la Orden del escalón superior (o la parte que llegó).
// La Orden describe a la unidad QUE LA EXPIDIÓ: su «unidad» es nuestro escalón superior
// cuando la unidad considerada es otra (RCB-1 recibe la orden de la DIV.MEC.-1).
const noVacios = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => limpio(v)))
export function unidadConsiderada(os = {}, e = estado) {
  return limpio(os.unidadPropia) || limpio(e.unidadPropia) || UNIDAD_CONSIDERADA_POR_DEFECTO
}
export function campos(ctx = {}, osParcial = null, e = estado, ahora = new Date()) {
  const os = { ...noVacios(e.ordenSup), ...noVacios(ctx.ordenSup), ...noVacios(osParcial) }
  const emisor = limpio(ctx.unidad) || limpio(os.unidad)
  const unidad = unidadConsiderada(os, e)
  const somosElEmisor = !emisor || mismaUnidad(unidad, emisor)
  const superior = somosElEmisor ? limpio(os.escalonSuperior) : emisor
  const puesto = somosElEmisor && !limpio(os.puestoPropio) ? { cg: conCG(os.puestoMando), fuente: 'Orden del escalón superior («Puesto de Mando»)' } : puestoDeLaUnidad(unidad, os, e)
  const hora = horaTactica(ctx.hoja, e, ahora) || (somosElEmisor ? limpio(os.vigencia) : '')
  const seccion = seccionEMO(ctx.seccion) || PUESTO_A_SECCION[String(ctx.puesto || e.puesto || '').toLowerCase()] || 'EMO/SEC-III'
  const clave = claveRedactor(os)
  const numero = numeroConClave(correlativo(seccion, ctx.hoja, e), clave)
  return {
    superior,
    unidad,
    cg: puesto.cg || CG_SIN_LUGAR,
    hora,
    seccion,
    numero,
    fuentes: {
      superior: somosElEmisor ? 'Orden del escalón superior («Escalón superior»)' : `la unidad que expidió la Orden (${emisor})`,
      unidad: limpio(os.unidadPropia) || limpio(e.unidadPropia) ? 'la unidad considerada del ejercicio' : `unidad considerada por defecto (${UNIDAD_CONSIDERADA_POR_DEFECTO})`,
      cg: puesto.fuente || 'falta: no hay ficha de la unidad considerada en el calco ni «CG de la unidad considerada» en la Orden',
      hora: hora ? 'Línea Inicial de Tiempo (paso 1)' : 'falta la Línea Inicial de Tiempo',
      seccion: 'la pestaña donde se elabora',
      numero: clave ? `correlativo de la sección y las iniciales del redactor (${clave})` : 'correlativo de la sección (faltan las iniciales del redactor)',
    },
  }
}
// Las cuatro líneas: la segunda lleva «CG. LUGAR HORA» a la derecha (tabulación).
export function lineas(c) {
  const der = [c.cg, c.hora].map(limpio).filter(Boolean).join(' ')
  return [{ izq: limpio(c.superior) }, { izq: limpio(c.unidad), der }, { izq: limpio(c.seccion) }, { izq: limpio(c.numero) ? `No. ${limpio(c.numero)}` : '' }].filter((l) => l.izq || l.der)
}
// Como las usa el Word de la Mesa: «UNIDAD\tCG. LUGAR HORA».
export const lineasTexto = (c) => lineas(c).map((l) => (l.der ? `${l.izq}\t${l.der}` : l.izq))

// ─── Dónde cae la R de SECRETO ───────────────────────────────────────────────────
// La clasificación va centrada en el encabezado (Arial 12 negrilla). La tabulación de la
// segunda línea se pone donde empieza su 4.ª letra (la R de SECRETO). Anchos de Arial
// negrilla en milésimas de em.
const ANCHO_ARIAL_NEGRILLA = { A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 556, K: 722, L: 611, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611, ' ': 278, '(': 333, ')': 333, '.': 278, '-': 333 }
const anchoLetra = (ch) => ANCHO_ARIAL_NEGRILLA[sinTildes(ch).toUpperCase()] ?? 667
export function tabulacion({ clasificacion = 'SECRETO', anchoTexto = 9407, puntos = 12 } = {}) {
  const t = limpio(clasificacion) || 'SECRETO'
  const em = puntos * 20 // twips por em
  const total = [...t].reduce((s, ch) => s + anchoLetra(ch), 0)
  const antes = [...t.slice(0, 3)].reduce((s, ch) => s + anchoLetra(ch), 0)
  return Math.round(((anchoTexto - (total * em) / 1000) / 2) + (antes * em) / 1000)
}
// Hoja carta de la Mesa: vertical (izq. 3 cm, der. 2 cm) y apaisada (2 y 2 cm).
export const ANCHO_VERTICAL = 12242 - 3 * 567 - 2 * 567
export const ANCHO_APAISADA = 13574
// Lo mismo en porcentaje del ancho, para la vista previa en HTML.
export const porcentajeTab = (op = {}) => (100 * tabulacion(op)) / (op.anchoTexto || ANCHO_VERTICAL)

// ─── HTML (vista previa y los documentos que se arman en HTML) ───────────────────
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export function html(c, op = {}) {
  const pct = porcentajeTab(op).toFixed(1)
  const est = 'font-family:Arial,Helvetica,sans-serif;font-size:10pt;font-weight:bold;margin:0'
  return (
    '<style>p.enc span.der{float:none!important;text-align:left!important}</style>\n' +
    lineas(c)
      .map((l) => (l.der ? `<p class="enc" style="${est}"><span class="izq" style="display:inline-block;width:${pct}%">${esc(l.izq)}</span><span class="der">${esc(l.der)}</span></p>` : `<p class="enc" style="${est}">${esc(l.izq)}</p>`))
      .join('\n')
  )
}

// Para el compilado (sin import) y los módulos de la Mesa.
const API = { UNIDAD_CONSIDERADA_POR_DEFECTO, CG_SIN_LUGAR, DOCUMENTOS_MILITARES, configurar, sincronizar, estadoActual, esDocumentoMilitar, seccionEMO, iniciales, claveRedactor, correlativo, expedidos, lugarMasCercano, fichaDeUnidad, puestoDeLaUnidad, horaTactica, momentoDelDocumento, unidadConsiderada, campos, lineas, lineasTexto, tabulacion, porcentajeTab, html, ANCHO_VERTICAL, ANCHO_APAISADA }
try {
  globalThis.SIDMembrete = API
} catch {
  /* nada */
}
export default API
