// 📋 La GUÍA INICIAL DEL COMANDANTE (Fase I · Recibir la misión) con la forma del PMTD 2017 (RO-06-01-02,
// Parte Tercera, Capítulo II «Guía del Comandante», III.- Técnica para la elaboración de las guías) y el modelo de
// la Escuela («guia_de_planificacion_inicial.docx»): siete apartados, la firma el Comandante y va SÓLO al Estado
// Mayor.
//
// Lo pidió Sergio el 27-10-2026: «mirá cómo me está desarrollando la guía de planificación inicial, está mal y está
// incompleta». Lo que pasaba:
//   · la F1·P6 del Comandante era una TABLA «Área / Sección · Guía impartida · Para cuándo» (no es la forma del
//     PMTD) y el Word la buscaba con las claves de los siete apartados («I.- MÉTODO»…): salía con todo vacío salvo
//     el tiempo, que se sembraba de la Línea de Tiempo;
//   · la F1·P5 del G-3 (el mismo documento, con otra numeración) tenía los siete apartados, pero la guía del
//     MÉTODO decía «cuántos cursos de acción» (eso es de la Guía de Planificación de la Fase II), y 🌱 sólo traía
//     el tiempo y la lista de los elementos de reconocimiento;
//   · el tiempo no seguía el orden del modelo (faltaban «Tiempo para preparar (2/3)» y «Tiempo disponible para las
//     Unidades subordinadas»);
//   · el Word la distribuía al escalón superior («Original: FF.TT.T.O. · Copia 1-12: UU. DEP.») con un bloque de
//     «Autenticación» que el modelo no tiene (la firma el Comandante y se difunde sólo al Estado Mayor).
//
// Sin dependencias del compilado: lo que necesita de la Mesa llega en `aux` (la Línea de Tiempo ya calculada —MS
// del compilado—, quién es elemento de reconocimiento, cómo se llama una ficha) y React en la prop R.
import { lecturaDelEjercicio, oraciones } from '../../conceptos/v4/modelo.js'

export const CLAVES = {
  metodo: 'I.- MÉTODO',
  tiempo: 'II.- ASIGNACIÓN INICIAL DEL TIEMPO',
  enlace: 'III.- OFICIALES DE ENLACE',
  reconocimiento: 'IV.- RECONOCIMIENTO INICIAL',
  movimientos: 'V.- MOVIMIENTOS',
  tareas: 'VI.- TAREAS ADICIONALES',
  otros: 'VII.- OTROS',
}
export const CAMPOS = Object.values(CLAVES)

// Lo que el PMTD 2017 dice de cada apartado (la instrucción del modelo, literal, y lo que la completa).
export const AYUDA_CAMPOS = {
  [CLAVES.metodo]: 'Se determina la clase y la forma de planeamiento que se va a realizar y se justifica el mismo (PMTD 2017). La CLASE: deliberado o en tiempo restringido; la FORMA: paralela con las unidades subordinadas. Se justifica con el tiempo disponible.',
  [CLAVES.tiempo]: 'La línea de tiempo inicial: tiempo total disponible, emisión y recepción de la Orden superior, inicio de la operación, inicio de los movimientos, tiempo para planear (1/3), para preparar (2/3) y el disponible para las unidades subordinadas. 🌱 la trae de la Línea Inicial de Tiempo.',
  [CLAVES.enlace]: 'Si es necesario contar con oficiales de enlace (de Artillería, Ingeniería o de alguna unidad agregada o BAJO CONTROL) y ante quién: el escalón superior, las unidades adyacentes (PMTD 2017).',
  [CLAVES.reconocimiento]: 'Si están autorizados los reconocimientos en el terreno o sólo en la carta, desde cuándo y con qué elementos (PMTD 2017).',
  [CLAVES.movimientos]: 'Se harán conocer los movimientos que se realizarán, como ser la ocupación de una NZR.: qué unidad, desde cuándo y hacia dónde (PMTD 2017).',
  [CLAVES.tareas]: 'Se asignan tareas a los miembros del Estado o Plana Mayor, si es que existiese la necesidad: quién, qué y para cuándo (PMTD 2017).',
  [CLAVES.otros]: 'Cualquier otro aspecto no mencionado anteriormente y necesario para el cumplimiento de la misión (PMTD 2017).',
}

export const NOTA =
  'Formato de siete apartados del PMTD 2017 (Parte Tercera, Cap. II). Sale en la Fase I, después de la evaluación inicial y la asignación del tiempo, con lo poco que se sabe: dicta las disposiciones para que el Estado Mayor inicie el Análisis de la Misión. Es la MISMA hoja en el Comandante (F1·P6) y en el Tablero del G-3. No es la Guía de Planificación (F2·P15) ni la Final (F6·P2).'

// 📘 La guía de la hoja (la ve el oficial y va al pedido de la IA).
export const GUIA = {
  para: 'Es lo primero que dispone el Comandante después de la evaluación inicial y la asignación del tiempo (Fase I · Recibir la misión). Va dirigida SÓLO a su Estado Mayor y su finalidad es «dictar algunas disposiciones necesarias al EM o Pl.My. para iniciar el Análisis de la Misión» (PMTD 2017, Parte Tercera, Cap. II). A las unidades subordinadas no va esta guía: a ellas va la Orden Preparatoria N° 1, que el G-3 elabora con ella.',
  como: [
    'I.- MÉTODO: la CLASE de planeamiento (deliberado o en tiempo restringido) y la FORMA (paralela con las unidades subordinadas), JUSTIFICADA con el tiempo disponible; puede decir cómo participará el Comandante. NO va acá cuántos cursos de acción se desarrollan: eso es de la Guía de Planificación (Fase II).',
    'II.- ASIGNACIÓN INICIAL DEL TIEMPO: «La línea de tiempo inicial para la operación es la siguiente:» y, en este orden, el tiempo total disponible, la emisión y la recepción de la Orden superior, el inicio de la operación, el inicio de los movimientos, el tiempo para planear (1/3), para preparar (2/3) y el disponible para las unidades subordinadas. Sale de la Línea Inicial de Tiempo (🌱).',
    'III.- OFICIALES DE ENLACE: si hacen falta y ante quién — el escalón superior, las adyacentes, las unidades agregadas o BAJO CONTROL, la Artillería o la Ingeniería que apoyan.',
    'IV.- RECONOCIMIENTO INICIAL: si está autorizado el reconocimiento en el terreno o sólo en la carta, desde cuándo y con qué elementos.',
    'V.- MOVIMIENTOS: los que se harán ya, aunque el plan no esté cerrado (la ocupación de una Zona de Reunión, NZR.): qué unidad, desde cuándo y hacia dónde.',
    'VI.- TAREAS ADICIONALES: tareas concretas a los miembros del Estado Mayor (JEM., G-1 a G-5), con su plazo. Una por renglón: el Word las letra A.-, B.-, C.-…',
    'VII.- OTROS: cualquier otro aspecto necesario para el cumplimiento de la misión.',
    'Lo firma «EL COMANDANTE DE …» y se distribuye sólo al Estado Mayor.',
  ],
  ejemplo:
    '«Disponemos de tiempo limitado para realizar el proceso de planeamiento, por lo que consideraremos realizar una clase de planeamiento en tiempo restringido y de forma paralela, sin que ello implique omitir alguna fase del proceso. Mi participación durante el proceso será asidua…» (PMTD 2017, I.- MÉTODO).',
}

// La definición de la hoja: la del Comandante (F1·P6, compartida con el Tablero del G-3) y la del G-3.
const COMUN = { nom: 'Guía Inicial del Comandante', tipo: 'campos', campos: CAMPOS, ayudaCampos: AYUDA_CAMPOS, autollena: 'guiaInicial', nota: NOTA }
export const HOJA_CMTE = { ...COMUN, entrega: 'SE DIFUNDE SÓLO AL ESTADO MAYOR', compartida: 'g3' }
export const HOJA_G3 = { ...COMUN, entrega: 'Se difunde sólo al Estado Mayor — la firma el Comandante', responsable: 'Cmte.' }

// Por debajo de este tiempo para el planeamiento del Estado Mayor (el 1/3) la clase de planeamiento es EN TIEMPO
// RESTRINGIDO. El PMTD 2017 no da una cifra: es criterio de la Mesa (el oficial lo cambia en la hoja).
export const HORAS_RESTRINGIDO = 48

export const DISTRIBUCION = 'Original : JEM.\nCopia 1-5 : G-1, G-2, G-3, G-4 y G-5\nCopia 6 : ARCHIVO'

const limpio = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const multilinea = (s) => String(s ?? '').split('\n').map((x) => x.trim()).filter(Boolean)
const sinMarca = (s) => String(s ?? '').replace(/\s*[[(]\s*IA\s*[—–-]\s*verificar\s*[\])]/gi, '')
const esObj = (x) => x && typeof x === 'object' && !Array.isArray(x)
const vacio = (x) => !limpio(sinMarca(x))
const lista = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)
// Hasta n nombres; si hay más, «A, B, C y las demás».
const algunas = (xs, n) => (xs.length > n ? `${xs.slice(0, n).join(', ')} y las demás` : lista(xs))
// La Mesa calcula las fechas en el navegador; en las pruebas llegan de otro contexto: no se usa instanceof.
const esFecha = (d) => !!d && typeof d.getTime === 'function' && Number.isFinite(d.getTime())
const recorte = (s, n = 260) => {
  const t = limpio(s)
  return t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : t
}
// El artículo de una unidad: «el CE-I», «el RIM-8», «las FF.TT.T.O.», «la DIV.MEC.-1».
const art = (u) => {
  const t = limpio(u).replace(/^(?:el|la|los|las)\s+/i, '')
  if (/^(FF\.?\s?TT\.?|FUERZAS)/i.test(t)) return 'las'
  return /\bCUERPO\b|^(R|B|CE\b|CE[-.]|GRUPO|BAT|ESCUADR|DESTACAMENTO|COMANDO|REGIMIENTO)/i.test(t) ? 'el' : 'la'
}
const del = (u) => ({ el: 'del', la: 'de la', las: 'de las' })[art(u)]
// «D-44 (0900)» y, si hay calendario, «D-44 (0900) — 01/09/2026 09:00».
const momento = (d, txt) => (d && txt && d !== txt ? `${d} — ${txt}` : d || txt || '')

// ─── Lo que la Mesa ya sabe ──────────────────────────────────────────────────────────
// La unidad propia, la cadena de mando, las subordinadas (las BAJO CONTROL aparte) y las adyacentes: las mismas
// cuentas que la hoja de Conceptos Entrelazados (conceptos/v4/modelo.js).
export function lecturaUnidades(ctx = {}) {
  let r = null
  try {
    r = lecturaDelEjercicio({ ...ctx, ordenSup: ctx.ordenSup || {}, unidades: ctx.unidades || [], documentos: ctx.documentos || [], orgTarea: ctx.orgTarea || [], g3: ctx.g3 || {} }, 'puras')
  } catch {
    r = null
  }
  const os = ctx.ordenSup || {}
  const propia = limpio(ctx.unidad) || limpio(os.unidad) || limpio(r?.propia?.nombre)
  const cadena = r?.cadena || []
  const superior = limpio(os.escalonSuperior) || limpio(cadena[cadena.length - 1]?.nombre)
  const subs = (r?.subordinadas || []).map((u) => ({ nombre: limpio(u.nombre), arma: u.arma || '', grupo: u.grupo || '', bajoControl: /BAJO CONTROL/i.test(u.mando || '') }))
  return {
    propia,
    superior,
    subordinadas: subs.filter((u) => !u.bajoControl).map((u) => u.nombre),
    bajoControl: subs.filter((u) => u.bajoControl).map((u) => u.nombre),
    subs,
    adyacentes: (r?.adyacentes || []).map((a) => limpio(a.nombre)).filter(Boolean),
  }
}

// Las oraciones de la Orden del escalón superior que tratan un tema (reconocimientos, movimientos, enlace).
const TEMAS = {
  reconocimiento: /\breconoc/i,
  movimientos: /\b(NZR|N\.?\s?Z\.?\s?R\.?|zona(?:s)? de reuni[oó]n|movimiento|desplaza|marcha)\b/i,
  enlace: /\benlace\b/i,
}
export function delaOrden(ctx = {}, tema) {
  const re = TEMAS[tema]
  if (!re) return []
  const os = ctx.ordenSup || {}
  const textos = [os.coordinacion, os.tareas, os.mision, os.concepto, os.comando, os.comunicaciones, os.limitePosterior]
  const doc = (ctx.documentos || []).find((d) => /orden/i.test(`${d?.categoria || ''} ${d?.nombre || ''}`))
  if (doc?.texto) textos.push(String(doc.texto).slice(0, 60000))
  const out = []
  for (const t of textos) for (const o of oraciones(t)) if (re.test(o) && o.length > 12 && !out.some((x) => x === limpio(o))) out.push(limpio(o))
  return out.slice(0, 3).map((o) => recorte(o, 300))
}

// La línea de tiempo con el ORDEN DEL MODELO (cada renglón «Rótulo: valor»). `lt` es lo que calcula la Línea
// Inicial de Tiempo (MS del compilado).
export function lineasTiempo(lt, unidad = '') {
  if (!lt?.ok) return []
  const u = limpio(unidad)
  const out = []
  if (lt.teMs != null && lt.ttdTxt && lt.ttdTxt !== '—') out.push(`Tiempo total disponible${u ? ` ${del(u)} ${u}` : ''}: ${lt.ttdTxt} (de la recepción de la Orden al fin de las operaciones)`)
  if (lt.emisionD || lt.emisionTxt) out.push(`Emisión de la Orden Superior: ${momento(lt.emisionD, lt.emisionTxt)}`)
  out.push(`Recepción de la Orden Superior: ${momento(lt.recepcionD, lt.recepcionTxt)}`)
  out.push(`Inicio de la Operación: ${momento(lt.inicioOperacionD, lt.inicioOperacionTxt)}`)
  if (lt.teMs != null && lt.finOperacionesD && lt.finOperacionesD !== '—') out.push(`Fin de las Operaciones: ${momento(lt.finOperacionesD, lt.finOperacionesTxt)}`)
  if (lt.inicioMovimientosD || lt.inicioMovimientosTxt) out.push(`Inicio de los movimientos: ${momento(lt.inicioMovimientosD, lt.inicioMovimientosTxt)}`)
  out.push(`Tiempo disponible (TD): ${lt.tdTxt} (de la recepción de la Orden al inicio de la operación)`)
  if (lt.teMs != null && lt.teTxt && lt.teTxt !== '—') out.push(`Tiempo para la ejecución (TE): ${lt.teTxt}`)
  const limite = momento(lt.limitePlaneamientoD, lt.sinCalendario ? '' : lt.limitePlaneamientoTxt)
  out.push(`Tiempo para planear (1/3): ${lt.tPlanTxt}, hasta el ${limite}`)
  out.push(`Tiempo para preparar (2/3): ${lt.tSubTxt}, del ${lt.limitePlaneamientoD} al ${lt.inicioOperacionD}`)
  out.push(`Tiempo disponible para las Unidades subordinadas: ${lt.tSubTxt} como mínimo (2/3 del TD), hasta el inicio de la operación`)
  return out
}

// El fin del ANÁLISIS DE LA MISIÓN según el reparto del 1/3 de la Línea de Tiempo (la primera fase del cuadro).
function finAnalisis(lt) {
  try {
    const f = (lt.fases || [])[0]
    if (!f || !esFecha(lt.recepcion) || !Number.isFinite(f.ms) || typeof lt.enDiaD !== 'function') return ''
    return lt.enDiaD(new Date(lt.recepcion.getTime() + f.ms))
  } catch {
    return ''
  }
}

// Los renglones que el Comandante cargó cuando la F1·P6 era una tabla (Área / Sección · Guía impartida · Para
// cuándo): pasan a TAREAS ADICIONALES, uno por renglón, para no perderlos.
export function filasViejas(filas) {
  if (!Array.isArray(filas)) return []
  return filas
    .filter((f) => esObj(f))
    .map((f) => {
      const a = limpio(sinMarca(f['Área / Sección']))
      const g = limpio(sinMarca(f['Guía impartida'])).replace(/[.;]+$/, '')
      const c = limpio(sinMarca(f['Para cuándo'])).replace(/^(?:para\s+)?(?:el\s+)?/i, '')
      if (!g) return ''
      return `${a ? `${a}: ` : ''}${g}${c ? ` (para el ${c})` : ''}.`
    })
    .filter(Boolean)
}

// ─── 🌱 Lo que trae del ejercicio ────────────────────────────────────────────────────
// ctx: { ordenSup, unidades (fichas), ops, documentos, orgTarea, g3, unidad, cmte (las hojas del Comandante) }
// aux: { lt (MS de la Línea de Tiempo), esReco(ficha) → bool, nombre(ficha) → texto }
export function semillaGuia(ctx = {}, aux = {}) {
  const os = ctx.ordenSup || {}
  const lt = aux.lt?.ok ? aux.lt : null
  const L = lecturaUnidades(ctx)
  const U = L.propia || 'la Unidad'
  const out = {}

  // I.- MÉTODO — la clase y la forma, justificadas con el tiempo.
  if (lt) {
    const restringido = Number.isFinite(lt.tPlanMs) && lt.tPlanMs < HORAS_RESTRINGIDO * 36e5
    const subs = L.subordinadas.length ? ` (${algunas(L.subordinadas, 8)})` : ''
    out[CLAVES.metodo] = [
      `Disponemos de ${lt.tdTxt} desde la recepción de la Orden del escalón superior (${lt.recepcionD}) hasta el inicio de la operación (${lt.inicioOperacionD}). El Estado Mayor empleará un tercio de ese tiempo (${lt.tPlanTxt}, hasta el ${lt.limitePlaneamientoD}) y los dos tercios restantes (${lt.tSubTxt}) quedan para que las unidades subordinadas planifiquen y se preparen.`,
      restringido
        ? 'Por disponer de tiempo limitado, se realizará una clase de planeamiento EN TIEMPO RESTRINGIDO y de forma PARALELA, sin que ello implique omitir alguna fase del Proceso Militar de Toma de Decisiones: se abreviarán los pasos que lo permitan y se decidirá con la información disponible.'
        : 'El tiempo disponible permite realizar un planeamiento DELIBERADO, cumpliendo todas las fases del Proceso Militar de Toma de Decisiones, y de forma PARALELA con las unidades subordinadas: con la Orden Preparatoria N° 1 iniciarán su propio planeamiento sin esperar la Orden de Operaciones.',
      `Mi participación durante el proceso será asidua; el intercambio de información con los comandantes subordinados${subs} será frecuente, en beneficio de un buen entendimiento de la operación.`,
    ].join(' ')
  }

  // II.- ASIGNACIÓN INICIAL DEL TIEMPO — la línea de tiempo con el orden del modelo.
  const tiempo = lineasTiempo(lt, L.propia)
  if (tiempo.length) out[CLAVES.tiempo] = ['La línea de tiempo inicial para la operación es la siguiente:', ...tiempo.map((x) => `- ${x}.`)].join('\n')

  // III.- OFICIALES DE ENLACE — el escalón superior, las adyacentes y las que llegan BAJO CONTROL o en refuerzo.
  const enlace = []
  if (L.superior) enlace.push(`Ante ${art(L.superior)} ${L.superior}: un oficial de enlace, para recibir las actualizaciones de la Orden y coordinar el planeamiento paralelo con el escalón superior.`)
  if (L.adyacentes.length) enlace.push(`Ante ${L.adyacentes.length > 1 ? 'las unidades adyacentes' : 'la unidad adyacente'} ${lista(L.adyacentes)}: un oficial de enlace, para coordinar límites, puntos de coordinación y apoyo mutuo.`)
  if (L.bajoControl.length) enlace.push(`${L.bajoControl.length > 1 ? `De las unidades BAJO CONTROL (${lista(L.bajoControl)})` : `${del(L.bajoControl[0]).replace(/^d/, 'D')} ${L.bajoControl[0]} (BAJO CONTROL)`}: su oficial de enlace se presenta en el PC. ${del(U)} ${U} para integrarse al planeamiento.`)
  if (limpio(os.refuerzos)) enlace.push(`De las unidades que la Orden asigna en refuerzo («${recorte(os.refuerzos, 200)}»): un oficial de enlace de cada una se presenta en el PC. ${del(U)} ${U}.`)
  for (const o of delaOrden(ctx, 'enlace')) enlace.push(`La Orden del escalón superior dispone: «${o}»`)
  if (enlace.length) out[CLAVES.enlace] = enlace.join('\n')

  // IV.- RECONOCIMIENTO INICIAL — la carta ya; el terreno con la Orden Preparatoria N° 1 y con qué elementos.
  const esReco = typeof aux.esReco === 'function' ? aux.esReco : (f) => /recon|explor/i.test(f?.arma || '')
  const nombre = typeof aux.nombre === 'function' ? aux.nombre : (f) => limpio(f?.designacion) || 'Unidad'
  const fichas = (ctx.unidades || []).filter((f) => (f?.tipo || 'unidad') === 'unidad' && String(f?.bando || '').toLowerCase() !== 'enemigo')
  const recos = [...new Set([...fichas.filter(esReco).map(nombre), ...L.subs.filter((u) => /reconoc|inteligencia|explor/.test(u.arma)).map((u) => u.nombre)])].filter(Boolean)
  const reco = []
  if (lt || recos.length || ctx.ops?.areaOps) {
    reco.push(`Por el momento sólo está autorizado el reconocimiento en la carta y sobre las imágenes del Área de Operaciones${ctx.ops?.areaOps ? ' trazada en el calco' : ''}.`)
    reco.push(
      recos.length
        ? `A partir de la emisión de la Orden Preparatoria N° 1 queda autorizado el reconocimiento en el terreno, dentro del Área de Operaciones asignada, a: ${lista(recos)}.`
        : 'El reconocimiento en el terreno se autorizará con la Orden Preparatoria N° 1, con los elementos que designe el G-3.',
    )
  }
  for (const o of delaOrden(ctx, 'reconocimiento')) reco.push(`La Orden del escalón superior dispone: «${o}»`)
  if (reco.length) out[CLAVES.reconocimiento] = reco.join('\n')

  // V.- MOVIMIENTOS — lo que dice la Orden, el inicio de los movimientos y las unidades que llegan a la NZR.
  const mov = []
  const inicioMov = lt?.inicioMovimientosD ? momento(lt.inicioMovimientosD, lt.sinCalendario ? '' : lt.inicioMovimientosTxt) : ''
  if (L.bajoControl.length) mov.push(`Se prevé el movimiento ${L.bajoControl.length > 1 ? `de ${lista(L.bajoControl)}` : `${del(L.bajoControl[0])} ${L.bajoControl[0]}`} ${inicioMov ? `a partir del ${inicioMov} ` : ''}a la Zona de Reunión (NZR.) que fije el G-3, para la materialización de la Organización para la Tarea.`)
  else if (inicioMov) mov.push(`Los movimientos se inician el ${inicioMov}, según la Línea Inicial de Tiempo.`)
  if (esFecha(lt?.inicioMovimientos) && esFecha(lt.limitePlaneamiento) && lt.inicioMovimientos.getTime() < lt.limitePlaneamiento.getTime())
    mov.push(`Los movimientos empiezan antes de que termine el tiempo de planeamiento del Estado Mayor (${lt.limitePlaneamientoD}): las unidades se moverán con la Orden Preparatoria N° 1, sin esperar la Orden de Operaciones.`)
  for (const o of delaOrden(ctx, 'movimientos')) mov.push(`La Orden del escalón superior dispone: «${o}»`)
  if (mov.length) out[CLAVES.movimientos] = mov.join('\n')

  // VI.- TAREAS ADICIONALES — lo que cada miembro del Estado Mayor hace para el Análisis de la Misión, con plazo.
  const tareas = []
  if (lt) {
    const fin = finAnalisis(lt)
    tareas.push(`El JEM. elaborará el Programa General de Planeamiento con esta línea de tiempo y dirigirá el Análisis de la Misión; la Orientación del Análisis de la Misión se me presentará no más tarde del ${fin || lt.limitePlaneamientoD}.`)
  }
  const destinos = [...L.subordinadas, ...L.bajoControl]
  tareas.push(
    `El G-3 enviará la Orden Preparatoria N° 1 a las unidades subordinadas${destinos.length ? ` (${algunas(destinos, 10)})` : ''} inmediatamente después de esta Guía${L.bajoControl.length ? `, y coordinará por canal técnico con ${L.bajoControl.length > 1 ? lista(L.bajoControl) : `${art(L.bajoControl[0])} ${L.bajoControl[0]}`} para que ${L.bajoControl.length > 1 ? 'se encuentren' : 'se encuentre'} en la Zona de Reunión ${inicioMov ? `no más tarde del ${inicioMov}` : 'en el plazo que fije la Orden Preparatoria N° 1'}` : ''}.`,
  )
  tareas.push('El G-2 iniciará de inmediato la Preparación de Inteligencia del Campo de Batalla (PICB): definirá el ambiente del campo de batalla (Áreas de Operaciones y de Interés), describirá sus efectos y presentará los cursos de acción del enemigo más probable y más peligroso en el Análisis de la Misión.')
  tareas.push('El G-1, el G-4 y el G-5 actualizarán sus Apreciaciones de Situación y determinarán sus tareas, limitaciones, hechos y suposiciones para el Análisis de la Misión.')
  for (const f of filasViejas(ctx.cmte?.guiaInicial)) tareas.push(f)
  out[CLAVES.tareas] = tareas.join('\n')

  // VII.- OTROS — dónde trabaja el Estado Mayor y la clasificación de los documentos.
  const otros = []
  const lugar = limpio(ctx.g3?.alerta?.['VI.- LUGAR, FECHA Y HORA DE REUNIÓN'])
  if (lugar) otros.push(`El Estado Mayor trabajará en: ${lugar.replace(/\.$/, '')}.`)
  if (limpio(os.clasificacion)) otros.push(`Los documentos del planeamiento llevarán la clasificación ${limpio(os.clasificacion).toUpperCase()}.`)
  if (otros.length) out[CLAVES.otros] = otros.join('\n')
  return out
}

// Lo que 🌱 escribe: SÓLO lo vacío (lo del oficial o de la IA no se toca). { valor, n, falta }
export function sembrarGuia(valor, propuesta, aux = {}) {
  const v = esObj(valor) ? { ...valor } : {}
  let n = 0
  for (const k of CAMPOS) if (!vacio(propuesta?.[k]) && vacio(v[k])) (v[k] = propuesta[k]), n++
  const falta = []
  if (!aux.lt?.ok) falta.push('la Línea Inicial de Tiempo (recepción de la Orden e inicio de la operación): sin ella no salen el MÉTODO ni la ASIGNACIÓN INICIAL DEL TIEMPO')
  return { valor: v, n, falta }
}

// ─── 📄 El Word (formato militar) ────────────────────────────────────────────────────
// base: { membrete, clasificacion } del productor del compilado (f3e). op: { lt, unidad, firma }
const SANGRIA = /^\s*(?:[-–•·]|[A-Z]\.-|[A-Z][.)]|\d{1,2}[.)]-?)\s+/
const renglones = (s) => multilinea(sinMarca(s)).map((x) => x.replace(SANGRIA, '').trim()).filter(Boolean)
const items = (s) => renglones(s).map((x) => ({ titulo: x, item: true }))
const parrafos = (s) => {
  const r = renglones(s)
  return r.length > 1 ? { hijos: r.map((x) => ({ titulo: x, item: true })) } : { texto: r[0] || '' }
}
export function firmaGuia(unidad, firma = '') {
  if (limpio(firma)) return limpio(firma)
  const u = limpio(unidad)
  return u ? `EL COMANDANTE ${del(u).toUpperCase()} ${u}` : 'EL COMANDANTE DE LA UNIDAD'
}
export function wordGuia(valor = {}, base = {}, op = {}) {
  const v = esObj(valor) ? valor : {}
  const tiempo = lineasTiempo(op.lt, op.unidad)
  const hojaTiempo = multilinea(sinMarca(v[CLAVES.tiempo]))
  const vin = hojaTiempo.filter((x) => /^\s*[-–•·]\s+/.test(x)).map((x) => x.replace(SANGRIA, '').replace(/\.$/, ''))
  const intro = hojaTiempo.filter((x) => !/^\s*[-–•·]\s+/.test(x)).join('\n')
  const secTiempo = tiempo.length
    ? { titulo: 'ASIGNACIÓN INICIAL DEL TIEMPO.', texto: 'La línea de tiempo inicial para la operación es la siguiente:', vinetas: tiempo }
    : { titulo: 'ASIGNACIÓN INICIAL DEL TIEMPO.', texto: intro, ...(vin.length ? { vinetas: vin } : {}) }
  return {
    ...base,
    titulo: 'GUÍA INICIAL DEL COMANDANTE',
    secciones: [
      { titulo: 'MÉTODO.', ...parrafos(v[CLAVES.metodo]) },
      secTiempo,
      { titulo: 'OFICIALES DE ENLACE.', hijos: items(v[CLAVES.enlace]) },
      { titulo: 'RECONOCIMIENTO INICIAL.', ...parrafos(v[CLAVES.reconocimiento]) },
      { titulo: 'MOVIMIENTOS.', ...parrafos(v[CLAVES.movimientos]) },
      { titulo: 'TAREAS ADICIONALES.', hijos: items(v[CLAVES.tareas]) },
      { titulo: 'OTROS.', ...parrafos(v[CLAVES.otros]) },
    ],
    firma: firmaGuia(op.unidad, op.firma),
    // Se difunde sólo al Estado Mayor y la firma el Comandante: sin autenticación (modelo del PMTD 2017).
    distribucion: DISTRIBUCION,
    sinAutenticacion: true,
    // El modelo no numera la Guía Inicial (hay una sola): sin «No. 01» en el título.
    sinNumero: true,
    estructuraPropia: true,
  }
}

// ─── 📘 + 🌱 en el panel del Comandante (en el Tablero del G-3 ya están) ────────────
const E = {
  caja: { background: 'rgba(255,214,102,0.06)', border: '1px solid rgba(255,214,102,0.35)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, color: '#e6eef6' },
  tit: { background: 'none', border: 'none', color: '#ffd666', font: '700 12px Arial', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' },
  para: { margin: '0 0 5px', fontSize: 12, color: '#e6dcc0', lineHeight: 1.45 },
  li: { fontSize: 11.5, color: '#cfc5ab', lineHeight: 1.45, marginBottom: 2 },
  ej: { margin: 0, fontSize: 11.5, color: '#b8d8c0', lineHeight: 1.45 },
  sembrar: { background: 'rgba(52,211,153,0.10)', color: '#9ff0c8', border: '1px solid rgba(52,211,153,0.5)', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, width: '100%' },
  msg: { fontSize: 11.5, color: '#7dffb0', lineHeight: 1.4 },
  falta: { fontSize: 11.5, color: '#ffd479', lineHeight: 1.4 },
}
export function AyudaGuia({ R, valor, onValor, semilla, aux = {} }) {
  const [abierta, setAbierta] = R.useState(false)
  const [msg, setMsg] = R.useState(null)
  const h = (t, p, ...c) => {
    const hs = c.flat().filter((x) => x !== null && x !== undefined && x !== false && x !== '')
    const { key, ...q } = p || {}
    return hs.length > 1 ? R.jsxs(t, { ...q, children: hs }, key) : R.jsx(t, hs.length ? { ...q, children: hs[0] } : q, key)
  }
  const sembrar = () => {
    let r
    try {
      r = sembrarGuia(valor, semilla(), aux)
    } catch (e) {
      setMsg({ n: 0, falta: [`no se pudo leer el ejercicio (${e?.message || e})`] })
      return
    }
    if (r.n) onValor(r.valor)
    setMsg({ n: r.n, falta: r.falta })
  }
  return h(
    'div',
    { style: E.caja },
    h('button', { style: E.tit, onClick: () => setAbierta(!abierta) }, `📘 ¿Para qué es y cómo se llena? ${abierta ? '▾' : '▸'}`),
    abierta &&
      h(
        'div',
        null,
        h('p', { style: E.para }, GUIA.para),
        h('ul', { style: { margin: '0 0 5px 15px', padding: 0 } }, GUIA.como.map((x, i) => h('li', { key: i, style: E.li }, x))),
        h('p', { style: E.ej }, `Ejemplo: ${GUIA.ejemplo}`),
      ),
    h('button', { style: E.sembrar, onClick: sembrar }, '🌱 Traer del calco y de la Línea de Tiempo lo que falte'),
    msg && h('div', { style: E.msg }, msg.n ? `${msg.n} ${msg.n === 1 ? 'apartado llenado' : 'apartados llenados'} (sólo los que estaban vacíos). Revisalos: son la propuesta de la Mesa, el Comandante decide.` : 'No había apartados vacíos que la Mesa pudiera llenar.'),
    msg?.falta?.length > 0 && h('div', { style: E.falta }, `Falta ${msg.falta.join('; ')}.`),
  )
}
