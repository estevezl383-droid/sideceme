// La Orden de Reconocimiento con IA: el pedido y la aplicación de su respuesta (JSON).
// Sin DOM.
//
// El pedido lleva el EXPEDIENTE ENTERO del ejercicio, lo que la Mesa ya leyó (unidad,
// misión, órganos de reconocimiento del calco con su alcance), la DOCTRINA de la orden,
// el EJEMPLO de la Escuela (DIV.MEC.-2), las IDEAS DEL OFICIAL sobre cómo quiere el
// reconocimiento y la orden como está hoy. La IA devuelve la orden en JSON:
//   · «Sólo completar» llena lo vacío y no toca una coma de lo escrito;
//   · «Completar y mejorar» reescribe la orden como producto de Estado Mayor.
import {
  TITULO,
  FORMA_INTRO,
  OBTENER,
  TEXTOS,
  LISTAS,
  FONETICO,
  normalizarOrden,
  serializar,
  desdeFilas,
  esOrden,
  tieneOrden,
  lecturaDelEjercicio,
  equipoVacio,
  nombreEquipo,
  sinMarcaIA,
  limpio,
  lista,
  claveTexto,
  nuevoId,
} from './modelo.js'

export const MODOS = [
  { id: 'completar', nom: 'Sólo completar', ayuda: 'Llena lo que falta —equipos, situación, misión, plan, tareas, plazos, coordinación, apoyo y comunicaciones— sin tocar una coma de lo que ya escribiste. Con la hoja vacía, arma la orden entera.' },
  { id: 'completar_mejorar', nom: 'Completar y mejorar', ayuda: 'Hace las dos cosas: llena lo que falta Y reescribe lo que ya está como producto de Estado Mayor, siguiendo tus ideas. REEMPLAZA lo escrito (los equipos se conservan por su «id»).' },
]

const DOCTRINA = `# LA ORDEN DE RECONOCIMIENTO — QUÉ ES Y CÓMO SE ESCRIBE

Es la orden que pone los ojos donde hacen falta ANTES de decidir. La elabora el G-3 en coordinación con el G-2 durante el análisis de la misión (hoja F2·P9 del PMTD) y se va actualizando. Cada equipo de reconocimiento sale a buscar información que llena un VACÍO DE INTELIGENCIA o responde un RCIC / EEIA del Estado Mayor.

- ORGANIZACIÓN DE LA TAREA: los EQUIPOS de reconocimiento, cada uno con un NOMBRE CLAVE del alfabeto fonético (ZULU, TANGO, VICTOR…) y sus ELEMENTOS (secciones, patrullas, observadores avanzados, drones, radares, equipos de comunicaciones o de ingenieros). Los elementos salen de los órganos de reconocimiento que la unidad TIENE (el calco y el expediente): no inventes unidades.
- ALCANCE: cada medio llega hasta donde llega. Según el RC-02-107, las tropas de reconocimiento del Regimiento obtienen información entre 25 y 30 km adelante de la línea de contacto; las de nivel División, a unos 20 km. Si el área a reconocer queda más lejos que el alcance del medio, cambiá de medio o adelantalo. Estos grupos TRATAN DE EVITAR EL COMBATE: el área es hasta dónde ven, no hasta dónde pelean.
- Cada equipo dice QUÉ información tiene que obtener («Obtener información referente a:»): del ENEMIGO (actividades, dispositivo, composición, fuerza, apoyo de fuegos, comunicaciones, radares, reconocimiento), del TERRENO (OCOKA: observación, cubiertas, obstáculos, terreno clave, avenidas; cursos de agua, vados, pasos obligados, transitabilidad de los caminos, pendientes) y de las CONSIDERACIONES CIVILES (población, poblaciones, capacidad de sostenimiento). Concreto y del ejercicio.
- PLAZOS: no antes de / no después de, y dónde informa cada equipo; la duración total del reconocimiento.
- Las operaciones se EJECUTAN (no «se conducen»).`

const EJEMPLO = `# EL EJEMPLO DE LA ESCUELA (la FORMA que se espera; los datos son de otro ejercicio)

ORDEN DE RECONOCIMIENTO N° 01
ORGANIZACIÓN DE LA TAREA: EQ. ZULU (SECC. AV 2 · SECC. IM-2) · EQ. TANGO (OA. REAM-3 · OA. RAAM-7 · EQ. COMP. ING.-3) · EQ. VICTOR (ERM/8 · ERM/9)

I.- SITUACIÓN.
  A.- Enemiga. Ver Orden Preparatoria 01/21 y Anexo de ICIA.
  B.- Propia. La DIV.MEC-2 se encuentra en su actual ZR «ORURO» realizando actividades de alistamiento y preparación para conducir operaciones defensivas, con sus efectivos al completo.
II.- MISIÓN.
  Los EQUIPOS «ZULU», «TANGO» y «VICTOR» de la DIMEC-2 CE-I, ejecutarán un reconocimiento a partir del día D-90 (1000) hasta el día D-89 (1800) en el AO de la DIMEC-2, entre la LF. «TRUENO» y la LS, con el propósito de obtener información sobre el enemigo, terreno y CC.MM. a fin de coadyuvar a las actividades de planeamiento del CE-I.
III.- EJECUCIÓN.
  A.- Plan de Reconocimiento.
    1.- Objetivo General del Reconocimiento. Obtener información sobre las características del terreno y CC.MM., entre la LF. «TRUENO» y la LS; así como información sobre las actividades, dispositivo, composición y fuerza de las fuerzas de la DE-II de ROJO.
    2.- Método del Reconocimiento. El reconocimiento a realizarse será a través de la técnica de Observación y Vigilancia a Corto y Largo Alcance, asimismo la indagación; el tipo de reconocimiento será de ruta, zona y área.
  B.- Tareas para los equipos de reconocimiento.
    1.- Forma de llegar a la zona de reconocimiento. Para el reconocimiento se emplearán los siguientes medios:
        a.- Movimiento motorizado.
        b.- Movimiento helitransportado, previa coordinación con el G.C.Ae.
        c.- Movimiento a pie sobre las áreas críticas y áreas posibles a ser empleadas como empeño.
    2.- Tareas.
        a.- Equipo ZULU. Obtener información referente a:
              - Actividades de reconocimiento por parte de elementos de ROJO. Estado de transitabilidad y sostenimiento de los caminos.
              - Unidades de apoyo de fuegos.
              - Posibles zonas de emplazamiento de ROJO.
              - Detalle de los equipos de comunicación y/o radares de vigilancia.
        b.- Equipo TANGO. Obtener información referente a:
              - Profundidad, ancho y cauce de los cursos de agua.
              - Terreno favorable para la instalación de obstáculos de contramovilidad.
              - Zonas favorables para la organización de las posiciones defensivas.
              - Identificación de terrenos claves, defendibles y áreas de empeño.
        c.- Equipo VICTOR. Obtener información referente a:
              - Zonas favorables para la maniobra de las UU. mecanizadas y blindadas.
              - Puntos de vadeo y pasaje para las RCB, RCM.
              - Población civil y principales poblaciones dentro de la zona; su capacidad de sostenimiento (agua, infraestructura, evacuados, PP.GG.).
              - Pasos obligados y áreas con características para áreas de empeño.
    3.- Plazos en tiempo. Duración del reconocimiento 32 hrs.
  C.- Instrucciones de coordinación.
    1.- Máxima coordinación durante el desplazamiento entre los equipos.
    2.- En caso de ataque dar parte inmediatamente al PC.
    3.- Coordinar con el G.C.Ae. para el reconocimiento aéreo.
    4.- Se deberá dar parte por radio sobre las novedades existentes.
    5.- Se deberá hacer llegar el Informe de Reconocimiento escrito al Comando de la DIVMEC-2 el D-89 (2330).
IV.- APOYO DE SERVICIO.
  A.- Abastecimientos. 1.- Al completo en las diferentes clases. 2.- Clase I para 2 días de operación.
  B.- Transporte. Se emplearán los medios orgánicos de la DIMEC-2 para ejecutar la operación.
V.- COMANDO Y COMUNICACIONES.
  A.- Comando. 1.- PCI: ORURO.
  B.- Comunicaciones. 1.- IEC «CORRE CAMINOS» en vigor. 2.- Máximo empleo de medios radio de los vehículos. 3.- Está autorizado el empleo de telefonía fija y móvil existente en la zona.

Tu orden tiene que ser IGUAL DE COMPLETA y MÁS CONCRETA: con las unidades, los lugares, las líneas de control y las horas de ESTE ejercicio.`

const FORMATO = `# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON y nada más:

\`\`\`json
{
  "numero": "01",
  "objeto": "UNA sola frase: de qué se trata el reconocimiento.",
  "carta": "Nombre de la carta, Esc. 1:250.000",
  "anexos": "“A” Calco de reconocimiento.",
  "equipos": [
    {
      "id": "…",
      "nombre": "ZULU",
      "elementos": ["SECC. AV 2", "SECC. IM-2"],
      "tarea": "Qué hace y dónde, en una frase (opcional).",
      "area": "Área u objetivo a reconocer.",
      "alcance": "30 km — escuadrón de reconocimiento",
      "noAntes": "D-13 (0600)",
      "noDespues": "D (0100)",
      "informa": "PC de la DIV.MEC.-1 (G-2)",
      "obtener": ["…", "…", "…"]
    }
  ],
  "situacion": { "enemiga": "…", "propia": "…" },
  "mision": "…",
  "plan": { "objetivo": "…", "metodo": "…" },
  "formaDeLlegar": { "intro": "${FORMA_INTRO}", "medios": ["Movimiento motorizado.", "…"] },
  "plazos": "Duración del reconocimiento … hrs.",
  "coordinacion": ["…", "…"],
  "apoyo": { "abastecimientos": ["…"], "transporte": "…" },
  "comando": ["PC: …"],
  "comunicaciones": ["…", "…"]
}
\`\`\`

REGLAS DEL FORMATO:
- "equipos": entre 2 y 6, con nombre clave del alfabeto fonético (${FONETICO.slice(0, 6).join(', ')}… o los del ejemplo: ZULU, TANGO, VICTOR) y sin repetir. Los "elementos" son los órganos de reconocimiento de la unidad (los del calco que leyó la Mesa y los del expediente), escritos como en la organización de la tarea. Respetá el "id" de los equipos que ya están en la hoja; los nuevos, sin "id".
- "obtener": 3 a 8 renglones por equipo, cada uno UNA información concreta del ejercicio (sin «Obtener información referente a:», sin viñetas ni números: eso lo pone la Mesa).
- "mision": quién (los equipos), qué (ejecutarán un reconocimiento), cuándo (desde / hasta, en términos de D), dónde (entre qué líneas o en qué zona del AO) y para qué (con el propósito de…).
- "objeto": UNA frase. "carta": nombre y escala. "anexos": uno por renglón, como “A” Calco de reconocimiento.
- "medios", "coordinacion", "abastecimientos", "comando", "comunicaciones": listas, un renglón por inciso, sin números ni letras (los pone la Mesa).
- Lo que no esté en el expediente va exactamente como «SIN DATO — verificar». No inventes unidades, cifras, lugares, frecuencias ni autoridades.
- NO escribas «[IA — verificar]»: esta orden se imprime y la firma el Comandante.
- Tiene que poder leerse con JSON.parse: sin comentarios y sin texto alrededor.`

const VERIFICACION = `# VERIFICACIÓN FINAL — hacela antes de contestar

1. ¿Seguiste las IDEAS DEL OFICIAL (si las hay) al pie de la letra?
2. ¿Cada equipo tiene nombre clave, elementos reales de la unidad, plazos y entre 3 y 8 informaciones concretas que obtener, atadas a los vacíos de inteligencia y a los RCIC del expediente?
3. ¿El área de cada equipo queda dentro del alcance de sus medios?
4. ¿La misión dice quién, qué, cuándo, dónde y para qué, y coincide con los plazos de los equipos?
5. ¿Están los cinco párrafos completos (situación, misión, ejecución con A, B y C, apoyo de servicio, comando y comunicaciones) y el OBJETO, la CARTA y los ANEXOS?
6. ¿Respetaste los "id" de los equipos que ya estaban?`

function lecturaTexto(l, v) {
  const L = []
  L.push(`- Unidad considerada: ${l.unidad || 'SIN DATO — la Mesa no tiene su denominación (sacala del OBJETO o de la MISIÓN de la orden)'}.`)
  L.push(`- Escalón superior: ${l.superior || 'SIN DATO'}.`)
  L.push(`- Misión de la unidad: ${l.mision.texto ? `«${l.mision.texto}» — ${l.mision.fuente}` : 'SIN DATO (sacala del expediente)'}.`)
  if (l.carta) L.push(`- Carta de la Orden del escalón superior: ${l.carta}.`)
  if (l.puestoMando) L.push(`- Puesto de Mando (Orden del escalón superior): ${l.puestoMando}.`)
  if (l.organos.length) {
    L.push('- Órganos de reconocimiento que la unidad tiene en el calco (con el alcance de su medio, del reglamento):')
    l.organos.forEach((o) => L.push(`  · ${o.organo}${o.alcance ? ` — alcance ${o.alcance}` : ''}`))
  } else L.push('- Órganos de reconocimiento en el calco: ninguno colocado todavía; sacalos de la organización de la tarea del expediente.')
  if (l.preparatorias.length) L.push(`- Órdenes Preparatorias ya elaboradas: No. ${l.preparatorias.join(', No. ')}.`)
  L.push(`- Esta hoja es la F2·P9 (fase II «Analizar la misión»): ${v.equipos.length ? `ya tiene ${v.equipos.length} equipo(s)` : 'todavía no tiene equipos'}.`)
  return L.join('\n')
}

// La orden como está hoy, en el mismo JSON que se pide (con los "id" de los equipos).
function ordenJSON(v) {
  return JSON.stringify(
    {
      numero: limpio(v.numero),
      objeto: sinMarcaIA(v.objeto),
      carta: sinMarcaIA(v.carta),
      anexos: sinMarcaIA(v.anexos),
      equipos: v.equipos.map((e) => ({
        id: e.id,
        nombre: nombreEquipo(e.nombre),
        elementos: lista(e.elementos),
        tarea: sinMarcaIA(e.tarea),
        area: sinMarcaIA(e.area),
        alcance: sinMarcaIA(e.alcance),
        noAntes: sinMarcaIA(e.noAntes),
        noDespues: sinMarcaIA(e.noDespues),
        informa: sinMarcaIA(e.informa),
        obtener: lista(e.obtener),
        ...(e.antes ? { antes: e.antes } : {}),
      })),
      situacion: { enemiga: sinMarcaIA(v.enemiga), propia: sinMarcaIA(v.propia) },
      mision: sinMarcaIA(v.mision),
      plan: { objetivo: sinMarcaIA(v.objetivo), metodo: sinMarcaIA(v.metodo) },
      formaDeLlegar: { intro: sinMarcaIA(v.formaIntro), medios: lista(v.medios) },
      plazos: sinMarcaIA(v.plazos),
      coordinacion: lista(v.coordinacion),
      apoyo: { abastecimientos: lista(v.abastecimientos), transporte: sinMarcaIA(v.transporte) },
      comando: lista(v.comando),
      comunicaciones: lista(v.comunicaciones),
    },
    null,
    1,
  )
}

export function pedidoOrden(valor, { expediente = '', ctx = {}, hoja = null, modo = 'completar', encabezado = '', semilla = null } = {}) {
  const v = normalizarOrden(valor)
  const l = lecturaDelEjercicio(ctx, { semilla })
  const mejorar = modo === 'completar_mejorar' || modo === 'mejorar'
  const hay = tieneOrden(v)
  const partes = []
  if (encabezado) partes.push(encabezado)
  partes.push(
    `Trabajás en la SECCIÓN III — OPERACIONES (G-3), en coordinación con el G-2. Tu producto es la ${TITULO} de la unidad (hoja ${hoja?.num || 'F2·P9'} del PMTD), con la forma de la Escuela: OBJETO, CARTA y ANEXOS; el cuadro de ORGANIZACIÓN DE LA TAREA (los equipos y sus elementos) y los cinco párrafos —I.- SITUACIÓN, II.- MISIÓN, III.- EJECUCIÓN, IV.- APOYO DE SERVICIO y V.- COMANDO Y COMUNICACIONES—. El membrete, la numeración, la firma, la autenticación y la distribución los pone la Mesa.`,
  )
  partes.push(`# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO\n\n${limpio(expediente) ? expediente : '(el expediente no estaba disponible: trabajá con lo que dice la hoja y lo que leyó la Mesa, y marcá «SIN DATO — verificar» lo que no puedas afirmar)'}`)
  partes.push(`# LO QUE LA MESA YA LEYÓ DEL EJERCICIO (verificalo contra el expediente)\n\n${lecturaTexto(l, v)}`)
  partes.push(DOCTRINA)
  partes.push(EJEMPLO)
  partes.push(`# LA ORDEN HOY\n\n${hay ? `\`\`\`json\n${ordenJSON(v)}\n\`\`\`${v.legado ? '\n\nOJO: los equipos vienen de la hoja anterior (una matriz con un órgano por renglón). Dales nombre clave, juntá en un mismo equipo los órganos que trabajan juntos (respetando un "id") y completá lo que tienen que obtener.' : ''}` : '(vacía: armala entera)'}`)
  if (limpio(v.ideas))
    partes.push(`# CÓMO QUIERE EL OFICIAL QUE SE HAGA EL RECONOCIMIENTO — respetalo al pie de la letra\n\n${sinMarcaIA(v.ideas)}\n\nSi una idea choca con el expediente o con la doctrina, seguila igual y avisalo en el texto del apartado que corresponde con «SIN DATO — verificar».`)
  partes.push(
    mejorar
      ? `# TAREA — COMPLETAR **Y** MEJORAR LA ORDEN, HASTA DEJARLA COMPLETA\n\nDevolvé la orden ENTERA:\nA) LO QUE ESTÁ ESCRITO — reescribilo como producto de Estado Mayor, concreto y anclado en el expediente${limpio(v.ideas) ? ' y en las ideas del oficial' : ''}. Conservá los datos verificables y los "id" de los equipos.\nB) LO QUE FALTA — completalo: ningún apartado puede quedar vacío.\nLo que devuelvas REEMPLAZA la orden.`
      : `# TAREA — ${hay ? 'COMPLETAR LO QUE FALTA EN LA ORDEN' : 'ARMAR LA ORDEN ENTERA'}\n\n${hay ? 'No toques lo que ya está escrito: eso lo puso el oficial. Devolvé la orden con los equipos que ya existen (mismo "id"), completando SOLAMENTE lo vacío, y los equipos nuevos (sin "id") que hagan falta. Lo que ya tiene contenido no se va a cambiar aunque lo devuelvas distinto.' : 'Armá la orden completa con lo del expediente.'}`,
  )
  partes.push(FORMATO)
  partes.push(VERIFICACION)
  return { ok: true, prompt: partes.join('\n\n---\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}

// ─── La respuesta ───────────────────────────────────────────────────────────────
function leerJSON(t) {
  const s = String(t || '')
  const cand = []
  for (const m of s.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) cand.push(m[1])
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a >= 0 && b > a) cand.push(s.slice(a, b + 1))
  const c = s.indexOf('[')
  const d = s.lastIndexOf(']')
  if (c >= 0 && d > c) cand.push(s.slice(c, d + 1))
  for (const x of cand) {
    try {
      return JSON.parse(x)
    } catch {}
  }
  return null
}
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const primero = (o, ...ks) => {
  for (const k of ks) if (o && o[k] != null && o[k] !== '') return o[k]
  return undefined
}
const textoIA = (x) => (typeof x === 'string' ? sinMarcaIA(x) : Array.isArray(x) ? sinMarcaIA(x.join('\n')) : '')
const listaIA = (x) => lista(Array.isArray(x) ? x.map((s) => (esObj(s) ? s.texto || s.item || '' : s)) : typeof x === 'string' ? x : [])
const sinEncabezado = (xs) => xs.filter((x) => claveTexto(x) !== claveTexto(OBTENER))

// La respuesta de la IA (o de otro pedido) en los campos de la hoja.
export function leerOrdenIA(d) {
  const o = esObj(d) ? d : {}
  const sit = esObj(o.situacion) ? o.situacion : {}
  const plan = esObj(o.plan) ? o.plan : {}
  const forma = esObj(o.formaDeLlegar) ? o.formaDeLlegar : esObj(o.forma) ? o.forma : {}
  const apoyo = esObj(o.apoyo) ? o.apoyo : esObj(o.apoyoDeServicio) ? o.apoyoDeServicio : {}
  const cyc = esObj(o.comandoYComunicaciones) ? o.comandoYComunicaciones : {}
  const equipos = (Array.isArray(o.equipos) ? o.equipos : Array.isArray(o.organizacion) ? o.organizacion : []).filter(esObj).map((e) => ({
    id: limpio(e.id),
    nombre: nombreEquipo(primero(e, 'nombre', 'equipo', 'nombreClave')),
    elementos: listaIA(primero(e, 'elementos', 'integrantes', 'organos', 'órganos')),
    tarea: textoIA(primero(e, 'tarea', 'mision', 'misión')),
    area: textoIA(primero(e, 'area', 'área', 'zona')),
    alcance: textoIA(primero(e, 'alcance')),
    noAntes: textoIA(primero(e, 'noAntes', 'noAntesDe', 'desde')),
    noDespues: textoIA(primero(e, 'noDespues', 'noDespuesDe', 'hasta')),
    informa: textoIA(primero(e, 'informa', 'dondeInforma', 'dóndeInforma')),
    obtener: sinEncabezado(listaIA(primero(e, 'obtener', 'informacion', 'información', 'tareas'))),
  }))
  return {
    numero: limpio(o.numero),
    objeto: textoIA(o.objeto),
    carta: textoIA(o.carta),
    anexos: textoIA(o.anexos),
    enemiga: textoIA(primero(sit, 'enemiga', 'enemigo') ?? o.enemiga),
    propia: textoIA(primero(sit, 'propia', 'propias') ?? o.propia),
    mision: textoIA(o.mision ?? o.misión),
    objetivo: textoIA(primero(plan, 'objetivo', 'objetivoGeneral') ?? o.objetivo),
    metodo: textoIA(primero(plan, 'metodo', 'método') ?? o.metodo),
    formaIntro: textoIA(primero(forma, 'intro', 'texto') ?? o.formaIntro),
    medios: listaIA(primero(forma, 'medios', 'lista') ?? o.medios),
    plazos: textoIA(o.plazos),
    coordinacion: listaIA(o.coordinacion ?? o.instruccionesDeCoordinacion),
    abastecimientos: listaIA(primero(apoyo, 'abastecimientos') ?? o.abastecimientos),
    transporte: textoIA(primero(apoyo, 'transporte') ?? o.transporte),
    comando: listaIA(primero(cyc, 'comando') ?? o.comando),
    comunicaciones: listaIA(primero(cyc, 'comunicaciones') ?? o.comunicaciones),
    equipos,
  }
}

const vacio = (x) => (Array.isArray(x) ? !lista(x).length : !limpio(x))
const CAMPOS_E = ['nombre', 'tarea', 'area', 'alcance', 'noAntes', 'noDespues', 'informa']
// El equipo de la hoja que corresponde a uno de la IA: por "id", por nombre clave o por
// un elemento en común.
function buscarEquipo(v, ei, usados) {
  const libres = v.equipos.filter((e) => !usados.has(e.id))
  return (
    libres.find((e) => ei.id && e.id === ei.id) ||
    libres.find((e) => ei.nombre && nombreEquipo(e.nombre) === ei.nombre) ||
    libres.find((e) => ei.elementos.some((x) => e.elementos.some((y) => claveTexto(y) && claveTexto(y) === claveTexto(x)))) ||
    null
  )
}

// Aplica lo leído sobre la hoja. Sin pisar: sólo lo vacío. Pisando: todo lo que trae.
export function fusionarLeido(valor, d, { pisar = false } = {}) {
  const v = normalizarOrden(valor)
  const ia = new Set(v.iaCampos)
  let n = 0
  let nuevos = 0
  for (const [k] of [['numero'], ...TEXTOS, ...LISTAS]) {
    const x = d[k]
    if (vacio(x)) continue
    if (pisar || vacio(v[k])) {
      v[k] = x
      if (k !== 'numero') ia.add(k)
      n++
    }
  }
  const usados = new Set()
  const salida = []
  for (const ei of d.equipos) {
    if (!ei.nombre && !ei.elementos.length && !ei.obtener.length && !ei.tarea) continue
    const e = buscarEquipo(v, ei, usados)
    if (!e) {
      const nuevo = { ...equipoVacio(nuevoId('e')), ...ei, id: nuevoId('e'), ia: true }
      salida.push(nuevo)
      nuevos++
      continue
    }
    usados.add(e.id)
    let tocado = false
    for (const k of CAMPOS_E)
      if (ei[k] && (pisar || vacio(e[k]))) {
        e[k] = ei[k]
        tocado = true
        n++
      }
    for (const k of ['elementos', 'obtener'])
      if (ei[k].length && (pisar || vacio(e[k]))) {
        e[k] = ei[k]
        tocado = true
        n++
      }
    if (tocado) e.ia = true
    salida.push(e)
  }
  // Pisando, la orden queda con los equipos que trajo la IA (en su orden); sin pisar, los
  // de la hoja siguen todos (en su orden) y los nuevos van al final.
  if (pisar && d.equipos.length) v.equipos = salida
  else v.equipos = [...v.equipos, ...salida.filter((e) => !v.equipos.includes(e))]
  if ((pisar && d.equipos.length) || nuevos) delete v.legado
  v.iaCampos = [...ia]
  return { valor: v, n, nuevos }
}

export function aplicarRespuestaOrden(respuesta, valor, { modo = 'completar', corregir = null } = {}) {
  let d = leerJSON(respuesta)
  if (d == null) return { ok: false, error: 'No se encontró un JSON válido en lo que pegaste. Pedile a la IA que reenvíe SÓLO el bloque JSON.' }
  if (typeof corregir === 'function') {
    try {
      d = corregir(d)
    } catch {}
  }
  if (Array.isArray(d)) d = d.some((x) => esObj(x) && ('obtener' in x || 'elementos' in x || 'nombre' in x)) ? { equipos: d } : { equipos: desdeFilas(d).equipos }
  if (!esObj(d)) return { ok: false, error: 'La respuesta no es la orden: la IA tenía que devolver { "equipos": [ … ], "mision": … }.' }
  const leido = leerOrdenIA(d)
  const hayAlgo = leido.equipos.length || [...TEXTOS, ...LISTAS].some(([k]) => !vacio(leido[k]))
  if (!hayAlgo) return { ok: false, error: 'La respuesta no traía equipos ni apartados de la orden. Pedile que use el formato EXACTO del pedido.' }
  const mejorar = modo === 'completar_mejorar' || modo === 'mejorar'
  const r = fusionarLeido(valor, leido, { pisar: mejorar })
  if (!r.n && !r.nuevos) return { ok: false, error: mejorar ? 'La respuesta no traía nada para escribir.' : 'No había nada que completar con esa respuesta: lo que trajo ya estaba escrito. Si querés que la reescriba, elegí «Completar y mejorar».' }
  const partes = [mejorar ? `Orden reescrita: ${r.n} apartado(s) y ${r.valor.equipos.length} equipo(s).` : `${r.nuevos ? `${r.nuevos} equipo(s) nuevo(s) y ` : ''}${r.n} apartado(s) completados.`]
  partes.push('Lo que puso la IA queda marcado «🤖 revisar» hasta que lo des por revisado: es una propuesta, no una fuente.')
  return { ok: true, valor: serializar(r.valor), msg: partes.join(' '), n: r.n, nuevos: r.nuevos }
}

// Otros pedidos a la IA (p. ej. la OPORD o los cursos de acción) pueden traer contenido
// para esta hoja entre sus «hojas_g3», todavía con la forma de la matriz de antes (una
// lista de renglones). La función general de la Mesa reemplazaría la orden por esa lista:
// acá se agrega a la orden.
export function fusionable(clave, actual, entrante) {
  if (clave !== 'ivr') return false
  return esOrden(actual) || (!!entrante && typeof entrante === 'object')
}
export function fusionarOrden(actual, entrante, { pisar = false } = {}) {
  let d = entrante
  if (Array.isArray(d)) d = d.some((x) => esObj(x) && ('obtener' in x || 'elementos' in x)) ? { equipos: d } : { equipos: desdeFilas(d).equipos }
  if (!esObj(d)) return { valor: actual, n: 0 }
  const r = fusionarLeido(actual, leerOrdenIA(d), { pisar })
  return { valor: serializar(r.valor), n: r.n + r.nuevos }
}
