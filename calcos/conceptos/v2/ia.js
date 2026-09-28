// Trabajar la hoja de CONCEPTOS ENTRELAZADOS con IA, igual que las demás hojas de la
// Mesa: se arma un PEDIDO con el expediente completo del ejercicio, el formato de la
// hoja, el nivel elegido y las orientaciones del oficial; la IA contesta con un JSON
// y la Mesa lo vuelca en la hoja (sin DOM: se prueba en Node).
import { normalizarConceptos, ENFOQUES, GRUPOS, ARMAS, CAMPOS, tipoUnidad, limpio, nombreUnidad, antecedentesConceptos, nuevoId, magnitudDeEscalon } from './modelo.js'

const TEXTOS = ['tarea', 'proposito', 'paf', 'efecto', 'pe', 'pt', 'prioridad']
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const clave = (s) => sinTildes(s).toUpperCase().replace(/[«»"'().,\-–—\s]+/g, ' ').trim()

const ENCABEZADO_POR_DEFECTO = `CONTEXTO — ESTO ES UN EJERCICIO ACADÉMICO de la ESCUELA DE COMANDO Y ESTADO MAYOR
DEL EJÉRCITO DE BOLIVIA (ECEME). La situación, las unidades y el «enemigo» son SUPUESTOS
creados por el instructor para enseñar el método.

Sos OFICIAL DE ESTADO MAYOR del Ejército de Bolivia, egresado de la ECEME, y trabajás
dentro del PROCESO MILITAR DE TOMA DE DECISIONES (PMTD 2017).`

// Doctrina de la hoja (PMTD 2017, RO-01-02-06): Cap. II «Analizar la misión», primer
// paso; hoja de trabajo de la pág. 20; ejemplo de las págs. 21-22; enunciado del
// curso de acción (maniobra, apoyo de fuegos, MCS, DAA, sostenimiento).
const DOCTRINA = `QUÉ ES ESTA HOJA (PMTD 2017, Cap. II, Primer paso del Análisis de la Misión):
«Los conceptos entrelazados se realizan con el fin de establecer su posición tanto vertical
como horizontal y no solamente para las operaciones de maniobra; sino también, para todas las
operaciones de Apoyo de Combate y Apoyo de Servicio de Combate.» Garantiza que el Comandante y
el Estado Mayor comprendan, del comando superior, la intención, la misión, las tareas, las
limitaciones, el riesgo, los recursos y el área de operaciones, el concepto de la operación
(incluido el plan de engaño) y la línea de tiempo; y las misiones de las unidades adyacentes
(incluidas las de vanguardia y retaguardia) y su relación con el plan del comando superior.

CÓMO SE ARMA (hoja de trabajo del PMTD, pág. 20):
1.- Tarea y Propósito del Comando dos escalones más arriba.
2.- Tarea y Propósito del Comando inmediato superior.
3.- Tarea y Propósito de la Unidad propia.
4.- Las Unidades de maniobra.
5.- Las UU. de apoyo de combate.
6.- Las UU. SPAC.
Cada gráfico lleva la MAGNITUD, la IDENTIFICACIÓN y la DENOMINACIÓN de la unidad. Las flechas
muestran la relación: LLENA = relación directa (la tarea de una sostiene directamente la de la
otra); DISCONTINUA = relación indirecta. La operación decisiva lleva ☆ (OD); las de configuración
se numeran OC1, OC2, OC3… por su orden de ocurrencia; el esfuerzo principal se marca en la fase
en que lo es (puede cambiar de unidad entre fases).

EJEMPLO DEL PMTD (págs. 21-22) — ése es el estilo:
- CE (XXX) · T: Defiende y derrota al CE. I de ROJO. · P: Proteger VIACHA y Villa BOLÍVAR, evitando
  la captura y conquista de la ciudad de LA PAZ y ejecutar operaciones favorables para iniciar una
  contraofensiva por el Sub Teatro Norte del TO con ROJO.
- Div-1 (XX) · T: Defiende y destruye al RIMEC 6 y a la FT-43. · P: Evitar la ejecución de
  operaciones coordinadas de la DIMEC-3 y DIMEC-5 de ROJO destinadas a la conquista de VIACHA.
- INGAVI (III, OC2) · T F1: Se desplaza por el ITIN. 1, ocupa posiciones al Oeste de PAMPA
  POSTIRI. P: Realizar la posición defensiva en dicho sector. · T F2 (esfuerzo principal): Ataca y
  destruye al RIMEC-6. P: Evitar que esta unidad conquiste las elevaciones en Coord. 8100-4100,
  obligando el desplazamiento de la FT-43. · T F3: Defiende y bloquea por el sector Oeste del
  corredor de movilidad desde la LF. SIERRA hasta la LF. COMBO. P: Impedir que el enemigo eluda el
  AE YUNQUE.
- CALAMA (III, OD ☆) · T F1: Se desplaza por el ITIN 4, ocupa posiciones en el punto de referencia.
  P: Estar en condiciones de ejecutar operaciones con orden en las subsiguientes fases. · T F4
  (esfuerzo principal): Ataca y destruye a las unidades de la FT-43 en el AE «YUNQUE». P: Impedir
  la ejecución del cerco a VIACHA y su posterior conquista por parte de la DIMEC-5.
- B. ING. (II) · FASE I — PE: Contramovilidad mediante la instalación de fajas de minas. PT: OC1 y
  OC2. · FASE II — PE: Contramovilidad. PT: OC2.
- RA-1 (III) · FASE I — TAREA: Suprimir la progresión ofensiva del enemigo. PROPÓSITO: Proporcionar
  la seguridad a los PP A y B durante el recibimiento del GRM-I. PAF: OC2. EFECTO: Ocasionar el
  10 % de daños a los sistemas de armas del enemigo. · FASE IV — TAREA: Destruir a la FT-43 en el
  AE YUNQUE. PROPÓSITO: Evitar que el enemigo prosiga hasta cercar VIACHA. PAF: OD. EFECTO:
  Ocasionar daños de 30 % en los sistemas de armas del enemigo.

CÓMO SE ESCRIBE CADA COSA (PMTD 2017, enunciado del curso de acción):
- TAREA de maniobra: presente, tercera persona, tarea táctica + a quién o qué + dónde:
  «Defiende y bloquea al RIMEC-6 entre Co. X y Co. Y», «Retarda y ataca con fuego…».
- PROPÓSITO: empieza con infinitivo: «Evitar que…», «Impedir…», «Proteger…», «Atraer…». El de la
  OD se liga directamente a la misión de la unidad propia; el de cada OC, a la OD.
- Si la operación tiene FASES, la maniobra lleva T y P POR FASE, y en cada fase UNA sola unidad
  de maniobra es el esfuerzo principal ("esfuerzo": true).
- APOYO DE FUEGOS (artillería, morteros, lanzacohetes), por fase: TAREA (destruir, neutralizar,
  suprimir), PROPÓSITO, PAF (a qué unidad da prioridad de apoyo de fuegos) y EFECTO (qué se espera:
  «ocasionar el 30 % de daños…», «impedir el avance…»).
- INGENIERÍA, por fase: PE (prioridad de esfuerzo: movilidad, contramovilidad o supervivencia, y
  cómo) y PT (prioridad de trabajo: a qué unidades, en orden).
- DEFENSA ANTIAÉREA, comunicaciones y demás apoyo de combate: TAREA, PROPÓSITO y PRIORIDAD DE APOYO.
- SPAC (logística, sanidad, etc.): TAREA, PROPÓSITO y PRIORIDAD DE APOYO («operación de
  sostenimiento»).
- CORTO: es un gráfico. Cada texto, uno a tres renglones (hasta unos 220 caracteres). Sin
  coordenadas salvo que la orden las dé.
- Nombres de unidades, lugares, líneas, áreas y fases EXACTAMENTE como en el expediente. NO
  inventes unidades, cifras, fechas ni lugares: si falta un dato, escribí sólo en ese texto
  «SIN DATO — verificar».
- Terminología de la casa: las operaciones SE EJECUTAN (nunca «se conducen»).
- No escribas «[IA — verificar]»: esta hoja se imprime.`

const NIVEL = {
  subordinadas: (p, s) => `NIVEL QUE ELIGIÓ EL OFICIAL: «${ENFOQUES.subordinadas.nom}» (como el ejemplo del PMTD).
- "superior2" (la caja de arriba) = el COMANDO SUPERIOR de la unidad propia${s ? ` (${s})` : ''}.
- "superior1" (la segunda caja) = la UNIDAD PROPIA${p ? ` (${p})` : ''}, con "propia": true.
- "maniobra" = las unidades de maniobra SUBORDINADAS de la unidad propia (regimientos, batallones,
  fuerzas de tarea o agrupaciones de la organización de la tarea), cada una con su rol (OD, OC1…,
  RES) y su tarea y propósito POR FASE. Entre 2 y 5, las que de verdad existan.
- "apoyo" = las unidades de apoyo de combate de la unidad propia; "spac" = las de apoyo de servicio
  de combate. Cada una con lo suyo por fase.`,
  adyacentes: (p, s) => `NIVEL QUE ELIGIÓ EL OFICIAL: «${ENFOQUES.adyacentes.nom}» (análisis de la orden superior).
- "superior2" (la caja de arriba) = el comando DOS ESCALONES más arriba de la unidad propia.
- "superior1" (la segunda caja) = el comando INMEDIATO SUPERIOR${s ? ` (${s})` : ''}.
- "maniobra" = la UNIDAD PROPIA${p ? ` (${p})` : ''} (con "propia": true) y las unidades de maniobra
  ADYACENTES que ordena el escalón superior (incluidas las de vanguardia y retaguardia), cada una con
  su rol y su tarea y propósito, por fase si la orden superior tiene fases.
- "apoyo" y "spac" = el apoyo de combate y de servicio de combate DEL ESCALÓN SUPERIOR, con su
  relación con las unidades de maniobra.`,
}

const ESQUEMA_JSON = `{
  "fases": [ { "id": "F1", "nombre": "…" } ],
  "unidades": [
    { "id": "…", "grupo": "superior2", "nombre": "…", "rotulo": "…", "magnitud": "XXX", "arma": "", "texto": "CE", "tarea": "…", "proposito": "…" },
    { "id": "…", "grupo": "superior1", "propia": true, "nombre": "…", "magnitud": "XX", "arma": "mecanizada", "numero": "1", "tarea": "…", "proposito": "…" },
    { "id": "…", "grupo": "maniobra", "nombre": "…", "rotulo": "…", "magnitud": "III", "arma": "infanteria", "rol": "OD",
      "fases": [ { "fase": "F1", "tarea": "…", "proposito": "…", "esfuerzo": false } ] },
    { "id": "…", "grupo": "apoyo", "nombre": "…", "magnitud": "III", "arma": "artilleria",
      "fases": [ { "fase": "F1", "tarea": "…", "proposito": "…", "paf": "OD", "efecto": "…" } ] },
    { "id": "…", "grupo": "apoyo", "nombre": "…", "magnitud": "II", "arma": "ingenieria",
      "fases": [ { "fase": "F1", "pe": "…", "pt": "…" } ] },
    { "id": "…", "grupo": "spac", "nombre": "…", "magnitud": "II", "arma": "logistica", "tarea": "…", "proposito": "…", "prioridad": "…" }
  ],
  "relaciones": [ { "desde": "<id>", "hasta": "<id>", "tipo": "directa" } ]
}`

function hojaParaPedido(v) {
  const sinVacios = (o) => Object.fromEntries(Object.entries(o).filter(([k, x]) => !['origen'].includes(k) && x !== '' && x !== false && !(Array.isArray(x) && !x.length)))
  return JSON.stringify(
    {
      fases: v.fases,
      unidades: v.unidades.map((u) => sinVacios({ ...u, fases: u.fases.map(sinVacios) })),
      relaciones: v.relaciones,
    },
    null,
    1,
  )
}

// Arma el pedido. Devuelve { ok, prompt } o { ok: false, error }.
export function pedidoIA(valor, { expediente = '', modo = 'completar', ctx = {}, encabezado = '' } = {}) {
  const v = normalizarConceptos(valor)
  const mejorar = modo === 'completar_mejorar'
  const propia = v.unidades.find((u) => u.propia)
  const nomPropia = limpio(ctx?.ordenSup?.unidad || ctx?.unidad || propia?.nombre)
  const nomSup = limpio(ctx?.ordenSup?.escalonSuperior)
  const hay = v.unidades.length > 0
  const o = v.orientaciones
  const partes = []
  partes.push(limpio(encabezado) ? encabezado : ENCABEZADO_POR_DEFECTO)
  partes.push('Trabajás en la sección EM. Sec. G-3 (Operaciones).')
  partes.push(`# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO\n\n${limpio(expediente) ? expediente : '(el expediente no estaba disponible: trabajá con lo que dicen la hoja y las orientaciones del oficial, y marcá «SIN DATO — verificar» lo que no puedas afirmar)'}`)
  partes.push(`---\n\n# LA HOJA\n\nF2·P1 — CONCEPTOS ENTRELAZADOS (hoja de trabajo GRÁFICA del PMTD 2017, pág. 20; ejemplo en las págs. 21-22).\nENTREGA: NO se difunde. Responsable: el Comandante; participa todo el Estado Mayor.\n\n${DOCTRINA}`)
  partes.push(`---\n\n# ${NIVEL[v.enfoque](nomPropia, nomSup)}`)
  const orient = []
  if (limpio(o.info)) orient.push(`INFORMACIÓN ADICIONAL QUE CARGÓ EL OFICIAL:\n${String(o.info).trim()}`)
  for (const a of o.adjuntos) if (limpio(a.texto)) orient.push(`DOCUMENTO ADJUNTADO A ESTA HOJA — «${a.nombre}»:\n${String(a.texto).trim()}`)
  if (orient.length) partes.push(`---\n\n# ORIENTACIONES E INFORMACIÓN PARA ESTA HOJA\n\nLo cargó el oficial para ESTA hoja. Es tan fuente como el expediente; si lo contradice, manda lo que cargó el oficial.\n\n${orient.join('\n\n')}`)
  const ant = antecedentesConceptos(v)
  if (ant.length) partes.push(`---\n\n# LO QUE SE ESCRIBIÓ ANTES EN ESTA HOJA (formato narrativo viejo)\n\nUsalo como fuente, pero la hoja ahora es GRÁFICA: pasalo a unidades con tarea y propósito.\n\n${ant.map(([k, t]) => `- ${k}: ${limpio(t)}`).join('\n')}`)
  const tarea = !hay
    ? `TAREA — ARMAR LA HOJA COMPLETA.\n\nLa hoja está vacía. Armala ENTERA para esta situación: las dos cajas de arriba, la fila de maniobra, el apoyo de combate y el SPAC, las fases y las relaciones. Ninguna unidad sin tarea y propósito.`
    : mejorar
      ? `TAREA — COMPLETAR **Y** MEJORAR LA HOJA, HASTA DEJARLA COMPLETA.\n\nDevolvé la hoja ENTERA. Lo que está escrito, reescribilo como producto de Estado Mayor (tarea táctica + a quién/qué + dónde; propósito ligado al de arriba) sin perder ningún dato verificable; lo que falta, completalo: unidades de maniobra, de apoyo y SPAC que estén en el expediente y no en la hoja, sus fases, sus textos y las relaciones. Conservá el "id" de cada unidad que ya existe.`
      : `TAREA — COMPLETAR LA HOJA.\n\nNo cambies lo que ya está escrito: eso lo puso el oficial o salió del calco. Devolvé la hoja ENTERA, con lo existente tal cual y lo que falte COMPLETADO: textos vacíos, unidades del expediente que faltan (maniobra, apoyo de combate, SPAC), fases y relaciones. Conservá el "id" de cada unidad que ya existe; a las nuevas poneles un "id" nuevo corto ("n1", "n2"…).`
  partes.push(`---\n\n# ${tarea}\n\nLO QUE HAY HOY EN LA HOJA (JSON):\n\`\`\`json\n${hojaParaPedido(v)}\n\`\`\``)
  const armas = Object.entries(ARMAS).map(([k, a]) => `${k} (${a.nom})`).join(', ')
  partes.push(`---\n\n# CÓMO CONTESTAR\n\nRespondé ÚNICAMENTE con este JSON y nada más:\n\n\`\`\`json\n${ESQUEMA_JSON}\n\`\`\`\n\nValores permitidos:\n- "grupo": superior2 | superior1 | maniobra | apoyo | spac (una sola unidad en superior2 y una sola en superior1).\n- "magnitud": XXXX, XXX, XX, X, III, II, I, ••• (la marca de la magnitud).\n- "arma": ${armas}. Vacío ("") para un comando que se identifica con texto ("texto": "CE", "TO"…).\n- "rol" (sólo maniobra): OD, OC1, OC2, OC3, OC4, RES. Una sola OD.\n- "fase": el "id" de una de las "fases" ("F1", "F2"…). Si la operación no tiene fases, usá "tarea" y "proposito" de la unidad, sin "fases".\n- "relaciones": "desde" y "hasta" son "id" de unidades de la hoja; "tipo": directa | indirecta. De cada unidad de maniobra a la que sostiene (la OD a la unidad propia, las OC a la OD…); de cada unidad de apoyo a las que apoya (directa a la que tiene la prioridad).\n- "rotulo": el nombre corto que va junto al gráfico (ej.: "LANZA", "RA-1"); "numero": el número que va al pie del gráfico (ej.: "1").\nTiene que poder leerse con JSON.parse: sin comentarios y sin texto alrededor.`)
  return { ok: true, prompt: partes.join('\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}

// La idea del oficial va AL FINAL del pedido, donde más pesa (como en las demás hojas).
export function conIndicacion(prompt, idea) {
  const n = String(idea || '').trim()
  return n
    ? `${prompt}\n\n# IDEA E INDICACIÓN DEL OFICIAL QUE PLANIFICA\n\nEsto lo escribió él para ESTE pedido, y es lo último que leés antes de contestar.\nTiene prioridad sobre cualquier criterio propio tuyo. Si contradice algo de la\ndoctrina citada arriba, cumplilo igual y avisá en UNA línea cuál es el reparo\n(fuera del JSON, al final).\n\n${n}`
    : prompt
}

// ─── Lectura de la respuesta ─────────────────────────────────────────────────────
function sacarJSON(texto) {
  const t = String(texto || '')
  const cands = []
  for (const m of t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) cands.push(m[1])
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a >= 0 && b > a) cands.push(t.slice(a, b + 1))
  for (const c of cands) {
    try {
      const j = JSON.parse(c)
      if (j && typeof j === 'object') return j
    } catch {}
  }
  return null
}
const GRUPO_SINONIMOS = {
  superior2: 'superior2', dos_arriba: 'superior2', dosescalones: 'superior2', comando_superior: 'superior2',
  superior1: 'superior1', superior: 'superior1', propia: 'superior1', unidad_propia: 'superior1',
  maniobra: 'maniobra', apoyo: 'apoyo', apoyo_combate: 'apoyo', apoyodecombate: 'apoyo', ac: 'apoyo',
  spac: 'spac', apoyo_servicio: 'spac', servicios: 'spac', asc: 'spac',
}
const MAGNITUD_PALABRA = { teatro: 'XXXXX', ejercito: 'XXXX', cuerpo: 'XXX', division: 'XX', brigada: 'X', regimiento: 'III', batallon: 'II', compania: 'I', escuadron: 'I', bateria: 'I', seccion: '•••' }
function normMagnitud(m) {
  const t = limpio(m).toUpperCase().replace(/\s+/g, '')
  if (!t) return ''
  if (/^(X{1,5}|I{1,3}|•{2,3}|\.{2,3})$/.test(t)) return t.replace(/\./g, '•')
  const w = sinTildes(m).toLowerCase()
  for (const [k, v] of Object.entries(MAGNITUD_PALABRA)) if (w.includes(k)) return v
  return magnitudDeEscalon(w) || t.slice(0, 6)
}
function normArma(a) {
  const t = sinTildes(a).toLowerCase().trim()
  if (!t) return ''
  if (ARMAS[t]) return t
  if (/antiaer|daa|\bada\b/.test(t)) return 'antiaerea'
  if (/cab/.test(t)) return /mec|blind/.test(t) ? 'cabmec' : 'caballeria'
  if (/mec/.test(t)) return 'mecanizada'
  if (/motor/.test(t)) return 'motorizada'
  if (/blind|tanq|acoraz/.test(t)) return 'blindada'
  if (/montan|andin/.test(t)) return 'andina'
  if (/selva/.test(t)) return 'selva'
  if (/paracaid|aerotransp/.test(t)) return 'aerotransportada'
  if (/recon/.test(t)) return 'reconocimiento'
  if (/lanzacoh|cohete/.test(t)) return 'lanzacohetes'
  if (/mortero/.test(t)) return 'morteros'
  if (/artill/.test(t)) return 'artilleria'
  if (/ingen/.test(t)) return 'ingenieria'
  if (/comunic|transmis/.test(t)) return 'comunicaciones'
  if (/antitanq/.test(t)) return 'antitanque'
  if (/aviac|helic/.test(t)) return 'aviacion'
  if (/logist/.test(t)) return 'logistica'
  if (/intend/.test(t)) return 'intendencia'
  if (/material/.test(t)) return 'materialbelico'
  if (/sanid/.test(t)) return 'sanidad'
  if (/transp/.test(t)) return 'transporte'
  if (/manten/.test(t)) return 'mantenimiento'
  if (/veter/.test(t)) return 'veterinaria'
  if (/polic/.test(t)) return 'policiamilitar'
  if (/infan/.test(t)) return 'infanteria'
  return ''
}
function normRol(r) {
  const t = sinTildes(r).toUpperCase().replace(/[\s.\-]+/g, '')
  if (!t) return ''
  if (t.startsWith('OD') || t.includes('DECISIVA')) return 'OD'
  const m = t.match(/^OC(\d)/)
  if (m) return `OC${m[1]}`
  if (t.startsWith('RES')) return 'RES'
  if (t.startsWith('SOST')) return 'SOST'
  return t.slice(0, 6)
}
const verdad = (x) => x === true || /^(s[ií]|true|1|x)$/i.test(String(x ?? '').trim())

// Aplica la respuesta. modo 'completar': sólo llena lo vacío y agrega lo que falta;
// 'completar_mejorar': reescribe con lo que trae la IA (lo que no trae, se conserva).
export function aplicarRespuestaIA(valor, texto, { modo = 'completar', corregir = null } = {}) {
  let j = sacarJSON(texto)
  if (!j) return { ok: false, error: 'No se encontró un JSON válido en lo que pegaste. Pedile a la IA que reenvíe SÓLO el bloque JSON.' }
  if (typeof corregir === 'function') {
    try {
      j = corregir(j)
    } catch {}
  }
  const lista = Array.isArray(j) ? j : Array.isArray(j.unidades) ? j.unidades : null
  if (!lista || !lista.length) return { ok: false, error: 'La respuesta no trae "unidades": la IA tenía que devolver la hoja con { "fases", "unidades", "relaciones" }.' }
  const v = normalizarConceptos(valor)
  const pisar = modo === 'completar_mejorar'
  const unidades = v.unidades.map((u) => ({ ...u, fases: u.fases.map((f) => ({ ...f })) }))
  let fases = v.fases.map((f) => ({ ...f }))
  let n = 0
  let nuevas = 0
  let sinDato = 0
  const cuenta = (s) => {
    n++
    if (/SIN DATO/i.test(s)) sinDato++
  }
  // Fases
  const idFase = {}
  const fasesIA = (Array.isArray(j.fases) ? j.fases : []).filter((f) => f && typeof f === 'object')
  fasesIA.forEach((f, i) => {
    const id = limpio(f.id) || `F${i + 1}`
    const nombre = limpio(f.nombre)
    let e = fases.find((x) => x.id === id) || (nombre && fases.find((x) => clave(x.nombre) === clave(nombre)))
    if (!e) {
      e = { id: fases.some((x) => x.id === id) ? `F${fases.length + 1}` : id, nombre: '' }
      fases.push(e)
    }
    if (nombre && (!e.nombre || pisar)) e.nombre = nombre
    idFase[id] = e.id
  })
  const faseDe = (f, i) => {
    const bruto = limpio(f?.fase ?? f?.id ?? '')
    if (idFase[bruto]) return idFase[bruto]
    if (fases.some((x) => x.id === bruto)) return bruto
    const rom = sinTildes(bruto).toUpperCase().replace(/^FASE\s*/, '')
    const nums = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 }
    const k = nums[rom] || Number(rom.replace(/^F/, '')) || i + 1
    const id = `F${k}`
    if (!fases.some((x) => x.id === id)) fases.push({ id, nombre: '' })
    return id
  }
  // Unidades
  const mapa = {}
  for (const [i, x] of lista.entries()) {
    if (!x || typeof x !== 'object') continue
    const grupo = GRUPO_SINONIMOS[sinTildes(x.grupo).toLowerCase().replace(/[\s-]+/g, '_')] || (x.propia ? 'superior1' : 'maniobra')
    const idIA = limpio(x.id) || `ia${i + 1}`
    const nombre = limpio(x.nombre)
    let e =
      unidades.find((u) => u.id === idIA) ||
      (nombre && unidades.find((u) => clave(u.nombre) === clave(nombre) || (u.rotulo && clave(u.rotulo) === clave(nombre)))) ||
      (grupo.startsWith('superior') && unidades.find((u) => u.grupo === grupo))
    if (!e) {
      e = { id: unidades.some((u) => u.id === idIA) ? nuevoId('u') : idIA, grupo, nombre: '', rotulo: '', magnitud: '', arma: '', texto: '', numero: '', rol: '', propia: false, esfuerzo: false, fases: [] }
      for (const k of TEXTOS) e[k] = ''
      if (grupo.startsWith('superior')) for (const u of unidades) if (u.grupo === grupo) u.grupo = 'maniobra'
      unidades.push(e)
      nuevas++
    }
    mapa[idIA] = e.id
    if (x.id != null) mapa[limpio(x.id)] = e.id
    // Hay IA que en las relaciones pone el nombre o el rótulo en vez del id.
    for (const k of [nombre, limpio(x.rotulo)]) if (k && !mapa[k]) mapa[k] = e.id
    const poner = (k, val) => {
      if (!val) return
      if (!limpio(e[k]) || pisar) {
        if (e[k] !== val) {
          e[k] = val
          if (TEXTOS.includes(k)) cuenta(val)
        }
      }
    }
    if (pisar && grupo !== e.grupo && !(grupo.startsWith('superior') && unidades.some((u) => u !== e && u.grupo === grupo))) e.grupo = grupo
    poner('nombre', nombre.slice(0, 90))
    poner('rotulo', limpio(x.rotulo).slice(0, 30))
    poner('magnitud', normMagnitud(x.magnitud))
    poner('arma', normArma(x.arma))
    poner('texto', limpio(x.texto).slice(0, 12))
    poner('numero', limpio(x.numero).slice(0, 8))
    if (e.grupo === 'maniobra') poner('rol', normRol(x.rol))
    if (x.propia && !unidades.some((u) => u !== e && u.propia)) e.propia = true
    if (x.esfuerzo != null && (pisar || !e.esfuerzo)) e.esfuerzo = verdad(x.esfuerzo)
    for (const k of TEXTOS) poner(k, limpio(x[k]))
    for (const [jf, f] of (Array.isArray(x.fases) ? x.fases : []).entries()) {
      if (!f || typeof f !== 'object') continue
      const id = faseDe(f, jf)
      let ef = e.fases.find((y) => y.fase === id)
      if (!ef) {
        ef = { fase: id, esfuerzo: false }
        for (const k of TEXTOS) ef[k] = ''
        e.fases.push(ef)
      }
      for (const k of TEXTOS) {
        const val = limpio(f[k])
        if (val && (!limpio(ef[k]) || pisar) && ef[k] !== val) {
          ef[k] = val
          cuenta(val)
        }
      }
      if (f.esfuerzo != null && (pisar || !ef.esfuerzo)) ef.esfuerzo = verdad(f.esfuerzo)
    }
  }
  // Relaciones: en «completar» se agregan; en «completar y mejorar» mandan las de la IA.
  const resolver = (x) => {
    const k = limpio(x)
    if (mapa[k]) return mapa[k]
    if (unidades.some((u) => u.id === k)) return k
    const u = unidades.find((u) => clave(u.nombre) === clave(k) || (u.rotulo && clave(u.rotulo) === clave(k)))
    return u ? u.id : k
  }
  const relIA = (Array.isArray(j.relaciones) ? j.relaciones : [])
    .filter((r) => r && typeof r === 'object')
    .map((r) => ({ desde: resolver(r.desde), hasta: resolver(r.hasta), tipo: /indirect/i.test(r.tipo) ? 'indirecta' : 'directa' }))
    .filter((r) => r.desde !== r.hasta && unidades.some((u) => u.id === r.desde) && unidades.some((u) => u.id === r.hasta))
  let relaciones = pisar && relIA.length ? [] : [...v.relaciones]
  let nRel = 0
  for (const r of relIA) {
    const ya = relaciones.find((x) => x.desde === r.desde && x.hasta === r.hasta)
    if (ya) {
      if (pisar) ya.tipo = r.tipo
      continue
    }
    relaciones.push(r)
    nRel++
  }
  // Una sola OD y un solo esfuerzo principal por fase: si la IA puso dos, queda el primero.
  const ods = unidades.filter((u) => u.grupo === 'maniobra' && u.rol === 'OD')
  for (const u of ods.slice(1)) u.rol = ''
  for (const f of fases) {
    const ep = unidades.filter((u) => u.grupo === 'maniobra').flatMap((u) => u.fases.filter((x) => x.fase === f.id && x.esfuerzo))
    for (const x of ep.slice(1)) x.esfuerzo = false
  }
  fases = fases.filter((f, i, a) => a.findIndex((y) => y.id === f.id) === i)
  if (!n && !nuevas && !nRel) return { ok: false, error: pisar ? 'La respuesta no traía nada distinto de lo que ya está en la hoja.' : 'La respuesta no traía nada para completar: todo lo que vino ya estaba escrito. Si querés que REESCRIBA, elegí «Completar y mejorar».' }
  const salida = normalizarConceptos({ ...v, fases, unidades, relaciones, ia: { fecha: new Date().toISOString(), modo } })
  const msg = [
    `Listo: ${n} texto(s) ${pisar ? 'escritos' : 'completados'}`,
    nuevas ? `${nuevas} unidad(es) nueva(s)` : '',
    nRel ? `${nRel} relación(es)` : '',
  ].filter(Boolean).join(', ')
  return {
    ok: true,
    valor: salida,
    n,
    nuevas,
    relaciones: nRel,
    pendientes: sinDato,
    msg: `${msg}. ${sinDato ? `${sinDato === 1 ? 'Uno quedó' : `${sinDato} quedaron`} como «SIN DATO — verificar»: eso es lo que hay que ir a buscar. ` : ''}Mirá la hoja y revisala antes de darla por buena: es una propuesta, no una fuente.`,
  }
}

export { GRUPOS, CAMPOS, tipoUnidad, nombreUnidad }
