// Matriz de administración del riesgo — hoja F2·P7 del G-3 (paso 7 del análisis de la
// misión) y su actualización F6·P3 (sobre el curso de acción aprobado).
//
// Es la HOJA DE TRABAJO del reglamento RO-06-01-04 «Administración del Riesgo»
// (RC-02-103), Anexo «B», con los ejemplos del Anexo «C»: una MATRIZ, no una lista.
//
//   A. Misión o tarea · B. Grupo fecha/hora (empieza / termina) · C. Fecha de preparación
//   D. Preparado por
//   E. Tarea │ F. Obstáculos │ G. Estimarlos │ H. Medidas de control │ I. Riesgo residual │ J. Implementar
//   K. Nivel general de la misión (el MAYOR riesgo residual, encerrado en un círculo)
//
// Con los rótulos del reglamento (A–K) o con los del formato de la Escuela (1–11, como
// la matriz de la DIMEC-1 que dio el docente). Arriba va el membrete táctico (Arial 10
// negrilla) y la clasificación SECRETO arriba y abajo de cada página.
//
// Sin DOM: se prueba en Node.
import { unidadPropiaDelEjercicio, escalonDeNombre } from '../../conceptos/v4/modelo.js'

export const ESQUEMA = 'riesgo-v1'
export const REGLAMENTO = 'RO-06-01-04 «Administración del Riesgo»'

// ─── Paso 2: probabilidad (Cuadro 4), severidad (Cuadro 5) y la Figura 6 ─────────
export const PROBABILIDAD = [
  { id: 'A', nom: 'Frecuente', txt: 'Ocurre muy a menudo; se experimenta continuamente.' },
  { id: 'B', nom: 'Probable', txt: 'Ocurre varias veces; se espera que ocurra durante la misión.' },
  { id: 'C', nom: 'Ocasional', txt: 'Ocurre esporádicamente.' },
  { id: 'D', nom: 'Rara vez', txt: 'Remotamente posible; puede ocurrir en algún momento.' },
  { id: 'E', nom: 'Improbable', txt: 'Puede asumirse que no ocurrirá, pero no es imposible.' },
]
export const SEVERIDAD = [
  { id: 'I', nom: 'Catastrófico', txt: 'Pérdida de la capacidad para cumplir la misión; muertes; pérdida de sistemas esenciales; daño colateral inaceptable.' },
  { id: 'II', nom: 'Crítico', txt: 'Disminución severa de la capacidad para cumplir la misión; incapacidad parcial permanente; daño extenso al equipo.' },
  { id: 'III', nom: 'Marginal', txt: 'Disminución de la capacidad para cumplir la misión; daños menores; bajas que no pasan de 3 meses.' },
  { id: 'IV', nom: 'Sin importancia', txt: 'Poco o ningún impacto sobre la misión; primeros auxilios; daño ligero.' },
]
export const NIVELES = [
  { id: 'B', nom: 'Bajo', rotulo: 'BAJO (B)', color: '#2e8b57' },
  { id: 'M', nom: 'Moderado', rotulo: 'MODERADO (M)', color: '#c9a227' },
  { id: 'A', nom: 'Alto', rotulo: 'ALTO (A)', color: '#e0772e' },
  { id: 'SA', nom: 'Sumamente alto', rotulo: 'SUMAMENTE ALTO (SA)', color: '#d23c3c' },
]
export const NIVEL = Object.fromEntries(NIVELES.map((n, i) => [n.id, { ...n, orden: i + 1 }]))
const LETRAS = 'ABCDE'
// Figura 6 «Modelo para el cálculo aproximado de riesgos»: fila = severidad,
// columna = probabilidad (A … E).
export const FIGURA_6 = {
  I: ['SA', 'SA', 'A', 'A', 'M'],
  II: ['SA', 'A', 'A', 'M', 'B'],
  III: ['A', 'M', 'M', 'B', 'B'],
  IV: ['M', 'B', 'B', 'B', 'B'],
}
export function nivelDe(prob, sev) {
  const fila = FIGURA_6[sev]
  const i = LETRAS.indexOf(prob)
  return fila && prob && i >= 0 ? fila[i] : ''
}
export const ordenNivel = (n) => NIVEL[n]?.orden || 0
export const nivelInicial = (p) => nivelDe(p?.prob, p?.sev)
export const nivelResidual = (p) => nivelDe(p?.probRes, p?.sevRes)

// ─── Paso 1: los factores MATT-TCE con los que se identifican los obstáculos ─────
export const FACTORES = [
  { id: 'mision', nom: 'Misión', ayuda: 'tipo de operación, tareas, complejidad del plan, órdenes parciales' },
  { id: 'enemigo', nom: 'Enemigo (amenaza)', ayuda: 'fuegos, aviación, blindados, reconocimiento, guerra electrónica, operaciones especiales' },
  { id: 'terreno', nom: 'Terreno (COC · CMOC)', ayuda: 'OCOKA, terreno restringido y severamente restringido, ríos, bofedales, pasos obligados' },
  { id: 'meteorologia', nom: 'Condiciones meteorológicas', ayuda: 'lluvias, neblina, heladas, viento, visibilidad, luna' },
  { id: 'tropas', nom: 'Tropas disponibles', ayuda: 'adiestramiento, cansancio, material, abastecimientos, salud, organizaciones nuevas' },
  { id: 'tiempo', nom: 'Tiempo disponible', ayuda: 'regla del tercio y los dos tercios, tiempo de preparación' },
  { id: 'civiles', nom: 'Consideraciones civiles', ayuda: 'población, evacuación, daño colateral, organizaciones, medios' },
]
export const FACTOR = Object.fromEntries(FACTORES.map((f) => [f.id, f]))

// ─── Rótulos de las casillas ─────────────────────────────────────────────────────
// «reglamento»: tal cual el Anexo «B» / «C» del RO-06-01-04 (letras A–K).
// «eceme»: los del formato de la Escuela (números 1–11, como la matriz de la DIMEC-1).
export const ROTULOS = {
  reglamento: {
    nom: 'A – K · como el reglamento (RO-06-01-04, Anexo «B»)',
    corto: 'A–K (reglamento)',
    A: 'A. Misión o tarea:',
    B: 'B. Grupo fecha/hora',
    empieza: 'Empieza:',
    termina: 'Termina:',
    C: 'C. Fecha de preparación',
    D: 'D. Preparado por:',
    E: 'E. Tarea',
    F: 'F. Identificar los obstáculos',
    G: 'G. Estimar los obstáculos',
    H: 'H. Determinar las medidas de control',
    I: 'I. Determinar el riesgo residual',
    J: 'J. Implementar las medidas de control (como hacerlo)',
    K: 'K. Determinar el nivel general de la misión/tarea después que se implementan las medidas de control (encerrar uno en un círculo)',
    vinetaH: 'check',
    vinetaJ: '',
    tareaMayusculas: false,
    alinear: 'top',
  },
  eceme: {
    nom: '1 – 11 · formato de la Escuela (matriz de la DIMEC-1)',
    corto: '1–11 (Escuela)',
    A: '1. MISIÓN O TAREA',
    B: '2. GRUPO FECHA/HORA',
    empieza: 'INICIA:',
    termina: 'TERMINA:',
    C: '3. FECHA DE PREPARACIÓN:',
    D: '4. PREPARADO POR:',
    E: '5. TAREA',
    F: '6. IDENTIFICAR PELIGROS/OBSTÁCULOS',
    G: '7. Evaluación de peligros/obstáculos',
    H: '8. Desarrollar controles',
    I: '9. Determinar el riesgo residual',
    J: '10. Implementar controles (como)',
    K: '11. DETERMINAR EL NIVEL DE RIESGO GLOBAL DE LA MISIÓN O TAREAS DESPUÉS DE LA IMPLEMENTACIÓN DE LOS CONTROLES (ENCERRAR EN UN CÍRCULO)',
    vinetaH: 'guion',
    vinetaJ: 'guion',
    tareaMayusculas: true,
    alinear: 'center',
  },
}
export const rotulosDe = (v) => ROTULOS[v?.rotulos] || ROTULOS.reglamento

// Lo que va en las casillas G e I: «Moderado (M)» y el código severidad-probabilidad
// («IIC»: severidad II, probabilidad C), que muestra cómo se llegó al nivel.
export function textoNivel(nivel, prob, sev, rotulos = 'reglamento') {
  const n = NIVEL[nivel]
  if (!n) return ''
  const cod = `${sev || ''}${prob || ''}`
  return rotulos === 'eceme' ? `${nivel} (${cod})` : `${n.nom} (${nivel})\n(${cod})`
}

// ─── Utilidades ──────────────────────────────────────────────────────────────────
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
export const limpio = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
// Texto de un campo: sin espacios de más, pero con sus saltos de línea.
export const texto = (s) =>
  String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
export const claveTexto = (s) => sinTildes(limpio(s)).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()
const MARCA_IA = /\s*\[\s*IA\s*[—–-]+\s*verificar\s*\]\s*/gi
export const sinMarcaIA = (s) => texto(String(s ?? '').replace(MARCA_IA, ' '))
const tieneMarcaIA = (s) => /\[\s*IA\s*[—–-]+\s*verificar\s*\]/i.test(String(s ?? ''))
let serie = 0
export function nuevoId(prefijo = 'r') {
  const r = globalThis.crypto?.randomUUID?.()
  return r ? `${prefijo}-${r.slice(0, 8)}` : `${prefijo}-${Date.now().toString(36)}-${(serie++).toString(36)}`
}
export const ESC = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Probabilidad, severidad y nivel escritos con palabras («Alta», «Crítica», «Medio»):
// los usaba la hoja de antes y a veces la IA.
export function leerProbabilidad(s) {
  const t = sinTildes(limpio(s)).toLowerCase()
  if (!t) return ''
  const letra = t.match(/^\(?([a-e])\)?(?:\s|$|[.,;])/)
  if (letra) return letra[1].toUpperCase()
  if (/improbable|muy\s+baja|casi\s+nunca|remota/.test(t)) return /remota/.test(t) && !/improbable/.test(t) ? 'D' : 'E'
  if (/poco\s+probable/.test(t)) return 'D'
  if (/frecuente|muy\s+alta|siempre|continua/.test(t)) return 'A'
  if (/probable|razonable|alta|alto/.test(t)) return 'B'
  if (/ocasional|media|medio|moderad/.test(t)) return 'C'
  if (/rara|baja|bajo/.test(t)) return 'D'
  return ''
}
export function leerSeveridad(s) {
  const t = sinTildes(limpio(s)).toLowerCase()
  if (!t) return ''
  const rom = t.match(/^\(?(iv|iii|ii|i)\)?(?:\s|$|[.,;])/)
  if (rom) return rom[1].toUpperCase()
  const num = t.match(/^([1-4])(?:\s|$|[.,;])/)
  if (num) return ['I', 'II', 'III', 'IV'][Number(num[1]) - 1]
  if (/catastrof|muy\s+alta|extrema/.test(t)) return 'I'
  if (/sin\s+importancia|despreciable|insignificante|leve|menor|baja|bajo/.test(t)) return 'IV'
  if (/critic|grave|severa|alta|alto/.test(t)) return 'II'
  if (/marginal|media|medio|moderad/.test(t)) return 'III'
  return ''
}
export function leerNivel(s) {
  const t = sinTildes(limpio(s)).toLowerCase()
  if (!t) return ''
  if (/^\(?sa\)?(?:\s|$)|sumamente|extrem|muy\s+alt/.test(t)) return 'SA'
  if (/^\(?a\)?(?:\s|$)|alt[oa]/.test(t)) return 'A'
  if (/^\(?m\)?(?:\s|$)|moderad|medi[oa]/.test(t)) return 'M'
  if (/^\(?b\)?(?:\s|$)|baj[oa]/.test(t)) return 'B'
  return ''
}
// El factor MATT-TCE escrito con palabras («Terreno», «Condiciones meteorológicas»…).
export function leerFactor(s) {
  const t = sinTildes(limpio(s)).toLowerCase()
  if (!t) return ''
  if (FACTOR[t]) return t
  if (/meteor|clima|estado del tiempo|lluvia|neblina|helada/.test(t)) return 'meteorologia'
  if (/enemig|amenaza/.test(t)) return 'enemigo'
  if (/terreno|coc|cmoc|ocoka/.test(t)) return 'terreno'
  if (/civil|poblac/.test(t)) return 'civiles'
  if (/tropa|propia|personal/.test(t)) return 'tropas'
  if (/tiempo/.test(t)) return 'tiempo'
  if (/mision/.test(t)) return 'mision'
  return ''
}
const PROB_IDS = new Set(PROBABILIDAD.map((p) => p.id))
const SEV_IDS = new Set(SEVERIDAD.map((s) => s.id))
const letraProb = (s) => (PROB_IDS.has(String(s ?? '').trim().toUpperCase()) ? String(s).trim().toUpperCase() : leerProbabilidad(s))
const letraSev = (s) => (SEV_IDS.has(String(s ?? '').trim().toUpperCase()) ? String(s).trim().toUpperCase() : leerSeveridad(s))

// ─── Esquema ─────────────────────────────────────────────────────────────────────
export const CAMPOS_MEMBRETE = [
  ['clasificacion', 'Clasificación'],
  ['superior', 'Escalón superior (1.ª línea)'],
  ['unidad', 'Unidad considerada (2.ª línea)'],
  ['puesto', 'Puesto de comando'],
  ['fechaHora', 'Fecha y hora (del membrete)'],
  ['seccion', 'Sección (3.ª línea)'],
  ['numero', 'Número (4.ª línea)'],
]
export const CLASIFICACIONES = ['SECRETO', 'RESERVADO', 'CONFIDENCIAL']

export function peligroVacio(id = nuevoId('p')) {
  return { id, peligro: '', factor: '', prob: '', sev: '', controles: [], probRes: '', sevRes: '', implementar: [], fuente: '', ia: false }
}
export function tareaVacia(id = nuevoId('t')) {
  return { id, tarea: '', peligros: [] }
}
export function matrizVacia() {
  return { esquema: ESQUEMA, rotulos: 'reglamento', mision: '', empieza: '', termina: '', preparacion: '', preparadoPor: '', tareas: [], membrete: {}, firma: '' }
}

// El texto se guarda TAL CUAL lo escribe el oficial (la hoja se guarda en cada tecla:
// si se recortara acá, no se podría escribir un espacio al final de una palabra). Se
// limpia al imprimir, al bajar el Word y al armar el pedido a la IA.
const cadena = (s) => (s == null ? '' : typeof s === 'string' ? s : String(s))
const cadenas = (x) => (Array.isArray(x) ? x.map((s) => (s && typeof s === 'object' ? cadena(s.texto || s.control || s.medida || '') : cadena(s))) : typeof x === 'string' && x ? [x] : [])
export const items = (xs) => (xs || []).map((x) => texto(x)).filter(Boolean)
// Sin id guardado, uno que no cambia de un dibujo al otro (la pantalla los usa de clave).
function normPeligro(p, i = 0, tid = 't') {
  const x = esObj(p) ? p : {}
  const out = {
    id: limpio(x.id) || `${tid}-p${i + 1}`,
    peligro: cadena(x.peligro),
    factor: leerFactor(x.factor),
    prob: letraProb(x.prob),
    sev: letraSev(x.sev),
    controles: cadenas(x.controles),
    probRes: letraProb(x.probRes),
    sevRes: letraSev(x.sevRes),
    implementar: cadenas(x.implementar),
    fuente: cadena(x.fuente),
    ia: !!x.ia,
  }
  if (esObj(x.antes) && Object.keys(x.antes).length) out.antes = Object.fromEntries(Object.entries(x.antes).map(([k, v]) => [k, limpio(v)]).filter(([, v]) => v))
  return out
}
function normTarea(t, i = 0) {
  const x = esObj(t) ? t : {}
  const id = limpio(x.id) || `t${i + 1}`
  return { id, tarea: cadena(x.tarea), peligros: (Array.isArray(x.peligros) ? x.peligros : []).filter(esObj).map((p, j) => normPeligro(p, j, id)) }
}
function normMembrete(m) {
  const out = {}
  for (const [k] of CAMPOS_MEMBRETE) if (esObj(m) && limpio(m[k])) out[k] = cadena(m[k])
  return out
}

// La hoja de ANTES era una lista de renglones («filas»): F2·P7 con «Peligro
// identificado · Probabilidad · Severidad · Nivel de riesgo inicial · Medida de
// control · Quién la ejecuta · Riesgo residual», y F6·P3 con «Peligro · Riesgo
// residual tras el juego de guerra · Medida de control final · ¿Quién acepta el
// riesgo?». Cada renglón pasa a ser un peligro de una tarea sin nombre; lo que no
// tiene casilla en la matriz queda en «antes» (se ve en la pantalla, no se pierde).
export function desdeFilas(filas) {
  const peligros = []
  for (const f of filas || []) {
    if (!esObj(f)) continue
    const val = (...ks) => {
      for (const k of ks) if (limpio(f[k])) return f[k]
      return ''
    }
    const peligro = val('Peligro identificado', 'Peligro', 'Riesgo', 'Obstáculo', 'Peligro / obstáculo')
    const medida = val('Medida de control', 'Medida de control final', 'Medidas de control')
    const quien = val('Quién la ejecuta', 'Responsable')
    const prob = val('Probabilidad')
    const sev = val('Severidad', 'Gravedad')
    const ini = val('Nivel de riesgo inicial')
    const res = val('Riesgo residual', 'Riesgo residual tras el juego de guerra')
    const acepta = val('¿Quién acepta el riesgo?')
    if (!limpio([peligro, medida, quien, prob, sev, ini, res, acepta].join(''))) continue
    const ia = Object.values(f).some(tieneMarcaIA)
    const control = sinMarcaIA(medida)
    const ejecuta = sinMarcaIA(quien)
    const p = normPeligro({
      id: `t-antes-p${peligros.length + 1}`,
      peligro: sinMarcaIA(peligro),
      prob: leerProbabilidad(sinMarcaIA(prob)),
      sev: leerSeveridad(sinMarcaIA(sev)),
      controles: control ? [ejecuta ? `${control.replace(/\.$/, '')}. Ejecuta: ${ejecuta.replace(/\.$/, '')}.` : control] : ejecuta ? [`Ejecuta: ${ejecuta}`] : [],
      ia,
    })
    const antes = {}
    if (limpio(prob)) antes.Probabilidad = sinMarcaIA(prob)
    if (limpio(sev)) antes.Severidad = sinMarcaIA(sev)
    if (limpio(ini)) antes['Nivel inicial'] = sinMarcaIA(ini)
    if (limpio(res)) antes['Riesgo residual'] = sinMarcaIA(res)
    if (limpio(acepta)) antes['Quién acepta el riesgo'] = sinMarcaIA(acepta)
    if (Object.keys(antes).length) p.antes = antes
    peligros.push(p)
  }
  const v = matrizVacia()
  if (peligros.length) v.tareas = [{ id: 't-antes', tarea: '', peligros }]
  v.legado = true
  return v
}

export function normalizarRiesgo(valor) {
  if (Array.isArray(valor)) return desdeFilas(valor)
  const x = esObj(valor) ? valor : {}
  const v = {
    esquema: ESQUEMA,
    rotulos: ROTULOS[x.rotulos] ? x.rotulos : 'reglamento',
    mision: cadena(x.mision),
    empieza: cadena(x.empieza),
    termina: cadena(x.termina),
    preparacion: cadena(x.preparacion),
    preparadoPor: cadena(x.preparadoPor),
    tareas: (Array.isArray(x.tareas) ? x.tareas : []).filter(esObj).map((t, i) => normTarea(t, i)),
    membrete: normMembrete(x.membrete),
    firma: cadena(x.firma),
  }
  if (x.legado) v.legado = true
  return v
}
export const esMatriz = (v) => esObj(v) && v.esquema === ESQUEMA

// Lo que se guarda: la matriz normalizada, con el texto tal cual (también las casillas
// que el oficial acaba de agregar y todavía están vacías); sin membrete ni firma
// propios si no los escribió (así siguen a la Orden del escalón superior).
export function serializar(v) {
  const n = normalizarRiesgo(v)
  const out = { ...n, tareas: n.tareas.map((t) => ({ ...t, peligros: t.peligros.map((p) => ({ ...p })) })) }
  if (!Object.keys(out.membrete).length) delete out.membrete
  if (!limpio(out.firma)) delete out.firma
  return out
}

const peligroConContenido = (p) => !!(limpio(p.peligro) || p.prob || p.sev || items(p.controles).length || p.probRes || p.sevRes || items(p.implementar).length)
// ¿La hoja tiene contenido? (para el «✅» y el conteo de documentos del G-3).
export function tieneRiesgo(valor) {
  if (Array.isArray(valor)) return valor.some((f) => esObj(f) && Object.values(f).some((x) => limpio(x)))
  if (!esObj(valor)) return false
  const v = normalizarRiesgo(valor)
  return !!([v.mision, v.empieza, v.termina, v.preparacion, v.preparadoPor].some((x) => limpio(x)) || v.tareas.some((t) => limpio(t.tarea) || t.peligros.some(peligroConContenido)))
}

// ─── K: el nivel general ─────────────────────────────────────────────────────────
// «El riesgo residual total de la misión se debe determinar basado en el incidente
// que presente el mayor riesgo residual. No es válido … obtener un promedio.»
// (RO-06-01-04, Paso 3). Si a un obstáculo todavía le falta el residual, cuenta su
// nivel inicial (lo que se sabe hasta ahora) y se avisa.
export function nivelGeneral(valor) {
  const v = normalizarRiesgo(valor)
  let mayor = ''
  let conInicial = 0
  const desde = []
  for (const t of v.tareas)
    for (const p of t.peligros) {
      let n = nivelResidual(p)
      if (!n) {
        n = nivelInicial(p)
        if (n) conInicial++
      }
      if (!n) continue
      if (ordenNivel(n) > ordenNivel(mayor)) {
        mayor = n
        desde.length = 0
      }
      if (n === mayor) desde.push(limpio(p.peligro) || '(sin nombre)')
    }
  return { nivel: mayor, desde, conInicial }
}

// ─── Membrete táctico ────────────────────────────────────────────────────────────
// Como el de los demás documentos de la Mesa (y el que enseñó el docente):
//   DIV.MEC.-1                             ← escalón superior
//   RCB-1                 CG. VIACHA D-15 (2300)   ← unidad considerada · PC · fecha y hora
//   EMO/SEC-III                            ← sección
//   No. 001/XYZ                            ← número / clave del redactor
// Sale de la Orden del escalón superior; lo que el oficial escribe en la hoja manda.
export function articuloDe(nombre) {
  const e = escalonDeNombre(nombre)
  return ['cuerpo', 'regimiento', 'batallon', 'ejercito', 'fftt', 'teatro'].includes(e) ? 'DEL' : 'DE LA'
}
export function membreteDe(valor, ctx = {}) {
  const v = normalizarRiesgo(valor)
  const os = ctx?.ordenSup || {}
  const prop = unidadPropiaDelEjercicio(ctx || {})
  const clave = limpio(os.clave).toUpperCase()
  const def = {
    clasificacion: 'SECRETO',
    superior: limpio(os.escalonSuperior),
    unidad: prop.nombre || limpio(ctx?.unidad),
    puesto: limpio(os.puestoMando),
    fechaHora: limpio(os.vigencia),
    seccion: 'EMO/SEC-III',
    numero: clave ? `001/${clave}` : '001',
  }
  const fuentes = {
    clasificacion: 'la matriz se clasifica SECRETO',
    superior: def.superior ? 'Orden del escalón superior («Escalón superior»)' : '',
    unidad: prop.fuente || (def.unidad ? 'el ejercicio' : ''),
    puesto: def.puesto ? 'Orden del escalón superior («Puesto de Mando»)' : '',
    fechaHora: def.fechaHora ? 'Orden del escalón superior (hora del membrete)' : '',
    seccion: 'Sección III — Operaciones',
    numero: clave ? `correlativo y clave del redactor (${clave})` : 'correlativo (falta la clave del redactor en la Orden del escalón superior)',
  }
  const m = { ...def, ...v.membrete }
  return { ...m, defecto: def, fuentes }
}
// Las líneas tal como se imprimen. La segunda lleva el puesto de comando y la hora a
// la derecha (en el Word, después de una tabulación).
export function lineasMembrete(m) {
  const derecha = [m.puesto, m.fechaHora].map(limpio).filter(Boolean).join(' ')
  return [
    { izq: limpio(m.superior) },
    { izq: limpio(m.unidad), der: derecha },
    { izq: limpio(m.seccion) },
    { izq: limpio(m.numero) ? `No. ${limpio(m.numero).replace(/^N[oº°.]*\s*\.?\s*/i, '')}` : '' },
  ].filter((l) => l.izq || l.der)
}
export function firmaDe(valor, ctx = {}) {
  const v = normalizarRiesgo(valor)
  if (limpio(v.firma)) return limpio(v.firma)
  const u = membreteDe(v, ctx).unidad
  return u ? `EL COMANDANTE ${articuloDe(u)} ${u}` : 'EL COMANDANTE DE LA UNIDAD'
}
export function tituloDe(hoja = null) {
  return esActualizacion(hoja) ? 'MATRIZ DE ADMINISTRACIÓN DEL RIESGO (ACTUALIZACIÓN)' : 'MATRIZ DE ADMINISTRACIÓN DEL RIESGO'
}
export const esActualizacion = (hoja) => !!hoja && (hoja.actualiza === 'riesgo' || hoja.id === 'riesgoFinal')

// ─── Lo que se lee del ejercicio ─────────────────────────────────────────────────
// «a partir del D (0500) hasta el D+1 (1800)», «entre el D (0500) y el D+2 (1800)».
const HORA_D = String.raw`D\s*[+-]?\s*\d{0,3}\s*\(\s*\d{2}[:.]?\d{2}\s*\)`
export const prolijoD = (s) =>
  limpio(s)
    .replace(/D\s*([+-])\s*(\d+)/i, 'D$1$2')
    .replace(/\s*\(\s*(\d{2})[:.]?(\d{2})\s*\)/, ' ($1$2)')
    .toUpperCase()
export function horasDeMision(mision) {
  const t = limpio(mision)
  const re = new RegExp(String.raw`(?:a\s+partir\s+del?|desde\s+(?:el\s+)?|entre\s+(?:el\s+)?)\s*(${HORA_D})\s*(?:,\s*)?(?:hasta|y)\s+(?:el\s+)?(${HORA_D})`, 'i')
  const m = t.match(re)
  return m ? { empieza: prolijoD(m[1]), termina: prolijoD(m[2]) } : null
}
const COL_ESP = 'Tarea ESPECÍFICA (impuesta por el escalón superior)'
const COL_IMP = 'Tarea IMPLÍCITA (necesaria para poder ejecutarla)'
// Las tareas de la F2·P3 (específicas, implícitas y la esencial), en su orden.
export function tareasDelEjercicio(ctx = {}) {
  const filas = Array.isArray(ctx?.g3?.tareas) ? ctx.g3.tareas : []
  const out = []
  const visto = new Set()
  const poner = (t, tipo, esencial) => {
    const x = sinMarcaIA(t).replace(/\n+/g, ' ').replace(/\.$/, '')
    const k = claveTexto(x)
    if (!x || /^SIN DATO/i.test(x) || visto.has(k)) return
    visto.add(k)
    out.push({ tarea: x, tipo, esencial })
  }
  for (const f of filas) {
    if (!esObj(f)) continue
    const esencial = /^(s[ií]|x|esencial)/i.test(limpio(f['¿ESENCIAL?']))
    poner(f[COL_ESP] ?? f.Tarea ?? f['Tarea específica'], 'específica', esencial)
    poner(f[COL_IMP] ?? f['Tarea implícita'], 'implícita', false)
  }
  return out
}
// Línea de Tiempo (F1·P4) → grupo fecha/hora y fecha de preparación: la F2·P7 se
// prepara al terminar el análisis de la misión; la actualización, al aprobar el CA.
export function tiemposDeLinea(lt, { actualizacion = false } = {}) {
  if (!lt || !lt.ok) return null
  const out = { empieza: '', termina: '', preparacion: '' }
  if (lt.inicioOperacionD) out.empieza = lt.inicioOperacionD
  if (lt.finOperacionesD && lt.finOperacionesD !== '—') out.termina = lt.finOperacionesD
  try {
    const fases = Array.isArray(lt.fases) ? lt.fases : []
    const hasta = actualizacion ? 5 : 1
    const ms = fases.slice(0, hasta).reduce((s, f) => s + (Number(f?.ms) || 0), 0)
    if (typeof lt.recepcion?.getTime === 'function' && typeof lt.enDiaD === 'function' && ms > 0) out.preparacion = lt.enDiaD(new Date(lt.recepcion.getTime() + ms))
  } catch {}
  return out
}
export function lecturaDelEjercicio(ctx = {}, { lineaDeTiempo = null, hoja = null } = {}) {
  const c = ctx || {}
  const os = c.ordenSup || {}
  const act = esActualizacion(hoja)
  const m = membreteDe(null, c)
  const misionG3 = sinMarcaIA(c.g3?.mision?.['ENUNCIADO COMPLETO DE LA MISIÓN'])
  const mision = misionG3 ? { texto: misionG3, fuente: 'Reexpresión de la misión (F2·P12)' } : limpio(os.mision) ? { texto: sinMarcaIA(os.mision), fuente: 'Orden del escalón superior («MISIÓN»): reemplazala por la misión reexpresada cuando la tengas' } : { texto: '', fuente: '' }
  let lt = null
  try {
    lt = typeof lineaDeTiempo === 'function' && c.g3?.lineaTiempo ? lineaDeTiempo(c.g3.lineaTiempo) : null
  } catch {}
  const tl = tiemposDeLinea(lt, { actualizacion: act })
  const hm = horasDeMision(mision.texto) || horasDeMision(c.g3?.mision?.['CUÁNDO (desde / hasta, en términos de tiempo)']) || horasDeMision(os.mision)
  const empieza = tl?.empieza || hm?.empieza || ''
  const termina = tl?.termina || hm?.termina || ''
  const autor = limpio(c.autor)
  const unidad = m.unidad
  return {
    unidad: { nombre: unidad, fuente: m.fuentes.unidad },
    superior: m.superior,
    membrete: m,
    mision,
    empieza,
    termina,
    fuenteHoras: tl?.empieza ? 'Línea Inicial de Tiempo (F1·P4)' : hm ? 'la misión' : '',
    preparacion: tl?.preparacion || '',
    preparadoPor: unidad ? `${autor ? `${autor}, ` : ''}G-3 ${articuloDe(unidad)} ${unidad}` : autor ? `${autor}, G-3` : '',
    tareas: tareasDelEjercicio(c),
    actualizacion: act,
  }
}

// 🌱 Arma la hoja con lo del ejercicio. Sólo llena lo VACÍO: no toca una coma de lo que
// el oficial (o la IA) ya escribió. Las tareas de la F2·P3 que no estén se agregan
// (sin peligros: ésos los identifica el oficial o la IA con el expediente).
export function armarDesdeEjercicio(valor, ctx = {}, op = {}) {
  const v = normalizarRiesgo(valor)
  const l = lecturaDelEjercicio(ctx, op)
  const cambios = []
  const poner = (k, x, rot) => {
    if (!limpio(v[k]) && limpio(x)) {
      v[k] = x
      cambios.push(rot)
    }
  }
  poner('mision', l.mision.texto, `${rotulosDe(v).A.replace(/:$/, '')} (${l.mision.fuente.split(':')[0]})`)
  poner('empieza', l.empieza, `grupo fecha/hora: empieza (${l.fuenteHoras})`)
  poner('termina', l.termina, `grupo fecha/hora: termina (${l.fuenteHoras})`)
  poner('preparacion', l.preparacion, 'fecha de preparación (Línea Inicial de Tiempo)')
  poner('preparadoPor', l.preparadoPor, 'preparado por')
  const hay = new Set(v.tareas.map((t) => claveTexto(t.tarea)).filter(Boolean))
  let nuevas = 0
  for (const t of l.tareas) {
    const k = claveTexto(t.tarea)
    if (hay.has(k)) continue
    hay.add(k)
    v.tareas.push({ ...tareaVacia(), tarea: t.tarea })
    nuevas++
  }
  if (nuevas) cambios.push(`${nuevas} tarea(s) de la F2·P3`)
  return { valor: v, cambios, lectura: l }
}

// F6·P3: parte de la matriz de la fase II (F2·P7). Sin pisar: sólo si la
// actualización está vacía, o agregando las tareas que no tenga.
export function partirDeFaseII(valor, faseII) {
  const v = normalizarRiesgo(valor)
  const b = normalizarRiesgo(faseII)
  if (!tieneRiesgo(b)) return { valor: v, n: 0 }
  for (const k of ['mision', 'empieza', 'termina', 'preparadoPor']) if (!limpio(v[k]) && limpio(b[k])) v[k] = b[k]
  if (!Object.keys(v.membrete).length) v.membrete = { ...b.membrete }
  if (v.rotulos === 'reglamento' && b.rotulos !== 'reglamento') v.rotulos = b.rotulos
  const hay = new Set(v.tareas.map((t) => claveTexto(t.tarea)))
  let n = 0
  for (const t of b.tareas) {
    const k = claveTexto(t.tarea)
    if (k && hay.has(k)) continue
    hay.add(k)
    v.tareas.push({ id: nuevoId('t'), tarea: t.tarea, peligros: t.peligros.map((p) => ({ ...p, id: nuevoId('p'), controles: items(p.controles), implementar: items(p.implementar) })) })
    n++
  }
  return { valor: v, n }
}

// ─── Revisión doctrinaria (lo que la pantalla le avisa al oficial) ──────────────
export function revisarRiesgo(valor, { hoja = null } = {}) {
  const v = normalizarRiesgo(valor)
  const R = rotulosDe(v)
  const out = []
  const err = (txt) => out.push({ tipo: 'err', txt })
  const aviso = (txt) => out.push({ tipo: 'aviso', txt })
  const info = (txt) => out.push({ tipo: 'info', txt })
  if (!tieneRiesgo(v)) return [{ tipo: 'info', txt: 'La matriz está vacía: 🌱 armala con lo del ejercicio y 🤖 trabajala con la IA, o escribila a mano.' }]
  if (!limpio(v.mision)) aviso(`Falta la casilla ${R.A.replace(/:$/, '')}.`)
  if (!limpio(v.empieza) || !limpio(v.termina)) aviso(`Falta el ${R.B.toLowerCase().replace(/^[a-z0-9]+\.\s*/, '')} (${R.empieza.replace(/:$/, '').toLowerCase()} / ${R.termina.replace(/:$/, '').toLowerCase()}).`)
  if (!limpio(v.preparacion)) aviso(`Falta la ${R.C.replace(/:$/, '').replace(/^[A-Z0-9]+\.\s*/, '').toLowerCase()}.`)
  if (!limpio(v.preparadoPor)) aviso('Falta quién la prepara (grado, apellido y cargo).')
  if (!v.tareas.length) err('No hay ninguna tarea: la matriz se ordena por las tareas de la misión.')
  const factores = new Set()
  const nombres = new Map()
  for (const t of v.tareas) if (claveTexto(t.tarea)) nombres.set(claveTexto(t.tarea), (nombres.get(claveTexto(t.tarea)) || 0) + 1)
  for (const [k, n] of nombres) if (n > 1) aviso(`Hay ${n} tareas con el mismo nombre («${limpio(v.tareas.find((t) => claveTexto(t.tarea) === k).tarea)}»): juntá sus obstáculos en una sola.`)
  v.tareas.forEach((t, i) => {
    const nt = limpio(t.tarea) || `la tarea ${i + 1}`
    if (!limpio(t.tarea)) aviso(`La tarea ${i + 1} no tiene nombre${t.peligros.length ? ' (viene de la hoja anterior)' : ''}: escribí qué tarea de la misión es.`)
    if (!t.peligros.length) aviso(`«${nt}» no tiene ningún obstáculo identificado.`)
    t.peligros.forEach((p, j) => {
      const np = limpio(p.peligro) || `el obstáculo ${j + 1} de «${nt}»`
      if (p.factor) factores.add(p.factor)
      if (!limpio(p.peligro)) err(`${np}: falta decir cuál es el obstáculo (peligro).`)
      const ni = nivelInicial(p)
      const nr = nivelResidual(p)
      if (!ni) err(`«${np}»: falta estimarlo (probabilidad y severidad → nivel, Figura 6).`)
      if (!items(p.controles).length) err(`«${np}»: no tiene medidas de control. Sin control, el riesgo es sólo una preocupación.`)
      if (!nr) aviso(`«${np}»: falta el riesgo residual (probabilidad y severidad con el control puesto).`)
      if (!items(p.implementar).length) aviso(`«${np}»: falta cómo se implementan los controles (orden, anexo, PON, ensayo, instrucción).`)
      if (ni && nr && ordenNivel(nr) > ordenNivel(ni)) err(`«${np}»: el riesgo residual (${NIVEL[nr].nom}) quedó MÁS ALTO que el inicial (${NIVEL[ni].nom}). Un control no puede aumentar el riesgo.`)
      if (ni && nr && items(p.controles).length && p.probRes === p.prob && p.sevRes === p.sev) aviso(`«${np}»: con los controles, la probabilidad y la severidad quedaron iguales. ¿Los controles no reducen nada?`)
      if (nr === 'SA') err(`«${np}»: el riesgo residual es SUMAMENTE ALTO. Agregá controles o cambiá el curso de acción; sólo el Comandante puede aceptarlo (RO-06-01-04, Paso 3 B).`)
      if (p.ia) info(`«${np}»: lo propuso la IA; revisalo y marcalo como revisado.`)
    })
  })
  const faltan = FACTORES.filter((f) => !factores.has(f.id))
  const conFactor = v.tareas.some((t) => t.peligros.some((p) => p.factor))
  if (conFactor && faltan.length) info(`Factores MATT-TCE sin ningún obstáculo: ${faltan.map((f) => f.nom).join(' · ')}. El Paso 1 pide revisarlos todos.`)
  const g = nivelGeneral(v)
  if (g.conInicial) aviso(`${g.conInicial === 1 ? 'Un obstáculo todavía no tiene' : `${g.conInicial} obstáculos todavía no tienen`} riesgo residual: para el nivel general se tomó su nivel inicial.`)
  if (esActualizacion(hoja)) info('Es la ACTUALIZACIÓN: reevaluá cada obstáculo con el curso de acción aprobado y lo que dejó el juego de guerra.')
  return out
}

// ─── Texto para el expediente (y para los pedidos de las otras hojas) ───────────
export function textoRiesgo(valor) {
  if (!valor || (Array.isArray(valor) && !valor.length)) return ''
  const v = normalizarRiesgo(valor)
  if (!tieneRiesgo(v)) return ''
  const R = rotulosDe(v)
  const L = []
  const campo = (rot, x) => limpio(x) && L.push(`  - ${rot.replace(/:$/, '')}: ${limpio(x)}`)
  campo(R.A, v.mision)
  if (limpio(v.empieza) || limpio(v.termina)) L.push(`  - ${R.B}: ${R.empieza} ${limpio(v.empieza) || '—'} · ${R.termina} ${limpio(v.termina) || '—'}`)
  campo(R.C, v.preparacion)
  campo(R.D, v.preparadoPor)
  v.tareas.forEach((t, i) => {
    L.push(`  - ${R.E} ${i + 1}: ${limpio(t.tarea) || '(sin nombre)'}`)
    for (const p of t.peligros) {
      const ni = nivelInicial(p)
      const nr = nivelResidual(p)
      const partes = [
        `${R.F.replace(/^[A-Z0-9]+\.\s*/, '')}: ${limpio(p.peligro) || '—'}${p.factor ? ` (${FACTOR[p.factor].nom})` : ''}`,
        `evaluación: ${ni ? `${NIVEL[ni].rotulo} — ${p.sev}${p.prob}` : '—'}`,
        `controles: ${items(p.controles).length ? items(p.controles).map(limpio).join('; ') : '—'}`,
        `residual: ${nr ? `${NIVEL[nr].rotulo} — ${p.sevRes}${p.probRes}` : '—'}`,
        `implementar: ${items(p.implementar).length ? items(p.implementar).map(limpio).join('; ') : '—'}`,
      ]
      L.push(`    · ${partes.join(' · ')}`)
    }
  })
  const g = nivelGeneral(v)
  if (g.nivel) L.push(`  - Nivel general de la misión después de los controles: ${NIVEL[g.nivel].rotulo}`)
  return L.join('\n')
}
export function resumenRiesgo(valor) {
  const v = normalizarRiesgo(valor)
  const n = v.tareas.reduce((s, t) => s + t.peligros.length, 0)
  const g = nivelGeneral(v)
  return `${v.tareas.length} tarea(s) · ${n} obstáculo(s)${g.nivel ? ` · nivel general ${NIVEL[g.nivel].rotulo}` : ''}`
}
