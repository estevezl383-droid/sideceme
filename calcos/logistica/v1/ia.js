// La IA en las hojas de logística del G-4: el PEDIDO (lo que se copia a la IA) y la
// APLICACIÓN de su respuesta (JSON). Sin DOM.
//
// Cada pedido lleva: el encabezado de la Mesa (contexto académico), el EXPEDIENTE ENTERO
// del ejercicio, lo que la Mesa MIDIÓ en el calco (áreas, distancias, DMA, ejes), la
// DOCTRINA de la Escuela (los tres textos de logística), las IDEAS DEL OFICIAL y la hoja
// como está hoy. «Sólo completar» no toca lo escrito; «Completar y mejorar» lo reescribe.
// Lo que pone la IA queda marcado para revisar (no se imprime).
import { doctrinaParaIA, ASPECTOS, FACTORES, FILAS_MATRIZ, NIVELES_AMENAZA, EJEMPLO_CONCLUSION } from './doctrina.js'
import { textoAnalisis } from './analisis.js'
import {
  limpio,
  texto,
  sinMarcaIA,
  esObj,
  normalizarEval,
  celdaEval,
  normalizarASL,
  tieneASL,
  CAMPOS_ASL,
  ANALISIS_CAP,
  TITULO_ASL,
  normalizarMatriz,
  tieneMatriz,
  TITULO_MATRIZ,
  unidadDe,
  textoEval,
  textoASL,
  textoMatriz,
  nuevoId,
  normalizarAnexo,
  CAMPOS_ANEXO,
  TITULO_ANEXO,
} from './modelo.js'

export const MODOS = [
  { id: 'completar', nom: 'Sólo completar', ayuda: 'Llena únicamente lo que falta. No toca una coma de lo que ya escribiste (ni lo que decidiste vos en la matriz).' },
  { id: 'completar_mejorar', nom: 'Completar y mejorar', ayuda: 'Llena lo que falta Y reescribe lo que ya está como producto de Estado Mayor, siguiendo tus ideas. REEMPLAZA lo escrito (salvo lo que marcaste vos en la matriz de evaluación).' },
]
const mejorarDe = (modo) => modo === 'completar_mejorar' || modo === 'mejorar'

const SIN_DATO = '«SIN DATO — verificar»'
const REGLAS_COMUNES = `- Lo que no esté en el expediente ni en lo que midió la Mesa va exactamente como ${SIN_DATO}. No inventes unidades, cifras, coordenadas, lugares ni distancias.
- Las distancias y superficies que midió la Mesa en el calco SON DATOS: usalas tal cual (no las recalcules ni las redondees distinto).
- NO escribas «[IA — verificar]»: la Mesa marca sola lo que pusiste.
- Tiene que poder leerse con JSON.parse: sin comentarios y sin texto alrededor.`

function base(partes, { encabezado = '', expediente = '', analisis = null, seccion = 'SECCIÓN IV — LOGÍSTICA (G-4)', producto = '' }) {
  if (encabezado) partes.push(encabezado)
  partes.push(`Trabajás en la ${seccion}. ${producto}`)
  partes.push(`# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO\n\n${limpio(expediente) ? expediente : '(el expediente no estaba disponible: trabajá con lo que midió la Mesa y marcá ' + SIN_DATO + ' lo que no puedas afirmar)'}`)
  if (analisis) partes.push(`# LO QUE LA MESA MIDIÓ EN EL CALCO (son datos: usalos)\n\n${textoAnalisis(analisis)}`)
}
function ideas(partes, v, que) {
  if (limpio(v.ideas)) partes.push(`# CÓMO LO QUIERE EL OFICIAL (${que}) — respetalo al pie de la letra\n\n${sinMarcaIA(v.ideas)}\n\nSi una idea choca con el expediente, con lo medido o con la doctrina, seguila igual y avisalo en el texto que corresponda con ${SIN_DATO}.`)
}
function leerJSON(t) {
  const s = String(t || '')
  const cand = []
  for (const m of s.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) cand.push(m[1])
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a >= 0 && b > a) cand.push(s.slice(a, b + 1))
  for (const x of cand) {
    try {
      return JSON.parse(x)
    } catch {}
  }
  return null
}
const textoIA = (x) => (typeof x === 'string' ? sinMarcaIA(x) : Array.isArray(x) ? sinMarcaIA(x.map((y) => (typeof y === 'string' ? `- ${y}` : '')).filter(Boolean).join('\n')) : '')
const vacio = (s) => !limpio(sinMarcaIA(s))
const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const claveDe = (s) => sinTildes(s).toUpperCase().replace(/[^A-Z0-9]+/g, '')
function corregirCon(d, corregir) {
  if (typeof corregir !== 'function') return d
  try {
    return corregir(d)
  } catch {
    return d
  }
}
const noJSON = { ok: false, error: 'No se encontró un JSON válido en lo que pegaste. Pedile a la IA que reenvíe SÓLO el JSON (entre ```json y ```).' }

// ════════════════════════════════════════════════════════════════════════════════════
// EVALUACIÓN DE LAS ÁREAS PROPUESTAS
// ════════════════════════════════════════════════════════════════════════════════════
// Cómo se llama cada área en el pedido: la letra si es propuesta; si no, su nombre.
export const idArea = (a) => a.propuesta || a.nombre
export function pedidoEval(valor, { analisis, expediente = '', ctx = {}, modo = 'completar', encabezado = '' } = {}) {
  const v = normalizarEval(valor)
  const areas = analisis?.areas || []
  if (!areas.length) return { ok: false, error: 'Primero trazá las áreas a evaluar (paso 2): sin áreas no hay nada que comparar.' }
  const mejorar = mejorarDe(modo)
  const partes = []
  base(partes, {
    encabezado,
    expediente,
    analisis,
    producto: `Tu producto es la EVALUACIÓN DE LAS ÁREAS PROPUESTAS para el área de apoyo logístico${unidadDe(ctx) ? ` ${unidadDe(ctx)}` : ''} (ASDI / ARCE), con el método de la Escuela: cada aspecto de los cuatro factores (MANIOBRA, TERRENO, SEGURIDAD y SITUACIÓN LOGÍSTICA) se evalúa por área — «si» = el área REÚNE el aspecto, «no» = no lo reúne — y se concluye qué áreas tienen condiciones y cuál tiene ventaja, y por qué aspectos.`,
  })
  partes.push(doctrinaParaIA({ conFactores: true }))
  const tabla = []
  for (const f of FACTORES)
    for (const a of f.aspectos) {
      const cs = areas.map((ar) => {
        const c = celdaEval(v, analisis.sugerencias, a.id, ar.clave)
        const quien = c.fuente === 'oficial' ? 'DECIDIDO POR EL OFICIAL (no lo cambies)' : c.fuente === 'calco' ? `MEDIDO EN EL CALCO${c.regla === 'impositivo' ? ' — impositivo, no lo cambies' : ''}` : c.fuente === 'ia' ? 'propuesto antes por la IA' : 'SIN EVALUAR'
        return `${idArea(ar)}: ${c.estado || '—'} (${quien}${c.motivo ? `: ${c.motivo}` : ''})`
      })
      tabla.push(`- [${a.id}] ${f.nom} · ${a.nom}: ${cs.join(' · ')}`)
    }
  partes.push(`# LA MATRIZ HOY (áreas: ${areas.map((a) => `«${idArea(a)}» = ${a.nombre}`).join(', ')})\n\n${tabla.join('\n')}${limpio(v.conclusion) ? `\n\nConclusión escrita por el oficial: «${sinMarcaIA(v.conclusion)}»` : ''}`)
  ideas(partes, v, 'qué áreas prefiere y por qué')
  partes.push(
    mejorar
      ? '# TAREA — COMPLETAR Y MEJORAR LA EVALUACIÓN\n\nDevolvé TODOS los aspectos de TODAS las áreas, con un motivo concreto del terreno y del ejercicio para cada uno (lo que se ve en la carta: rutas, ríos, poblaciones, alturas, cubiertas, el enemigo y sus posibilidades). Respetá lo DECIDIDO POR EL OFICIAL y lo IMPOSITIVO medido en el calco (devolvelo igual). Escribí la conclusión con la forma del ejemplo de la Escuela.'
      : '# TAREA — COMPLETAR LO QUE FALTA\n\nDevolvé SOLAMENTE los aspectos SIN EVALUAR de cada área, con su motivo concreto (lo del terreno y del ejercicio). Lo demás ya está: no lo cambies. Si la conclusión no está escrita, escribila con la forma del ejemplo de la Escuela.',
  )
  partes.push(`# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON y nada más:

\`\`\`json
{
  "evaluacion": {
    "m_cerrado": { "${idArea(areas[0])}": { "estado": "si", "motivo": "…" }${areas[1] ? `, "${idArea(areas[1])}": { "estado": "no", "motivo": "…" }` : ''} },
    "t_red": { … }
  },
  "conclusion": "LAS ÁREAS … TIENEN CONDICIONES DE …, MIENTRAS QUE EL ÁREA … TIENE LA VENTAJA …, CONSIDERANDO LOS ASPECTOS …",
  "elegida": "${idArea(areas[0])}"
}
\`\`\`

REGLAS DEL FORMATO:
- Las claves de "evaluacion" son los id entre corchetes de la matriz (${ASPECTOS.slice(0, 4).map((a) => a.id).join(', ')}…). Las de cada aspecto, los nombres de las áreas: ${areas.map((a) => `"${idArea(a)}"`).join(', ')}.
- "estado": "si" (reúne el aspecto) o "no" (no lo reúne). "motivo": una frase concreta, del terreno y del ejercicio.
- "conclusion": en MAYÚSCULAS, con la forma de este ejemplo: «${EJEMPLO_CONCLUSION}». Un área que no cumple un aspecto IMPOSITIVO (distancia de seguridad, distancia máxima de apoyo) NO tiene condiciones: decilo.
- "elegida": el área que recomendás.
${REGLAS_COMUNES}`)
  partes.push(`# VERIFICACIÓN FINAL — hacela antes de contestar

1. ¿Respetaste lo DECIDIDO POR EL OFICIAL y lo IMPOSITIVO medido en el calco?
2. ¿Cada motivo es concreto (un río, una ruta, una población, una altura, una unidad del ejercicio) y no una generalidad?
3. ¿La conclusión dice qué áreas tienen condiciones, cuál tiene ventaja y por qué aspectos, igual que la matriz?
4. ¿Seguiste las ideas del oficial?`)
  return { ok: true, prompt: partes.join('\n\n---\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}

const estadoDe = (x) => {
  const s = claveDe(typeof x === 'object' && x ? x.estado ?? x.reune ?? x.valor : x)
  if (x === true || ['SI', 'REUNE', 'CUMPLE', 'FAVORABLE', 'X', 'OK'].includes(s)) return 'si'
  if (x === false || ['NO', 'NOREUNE', 'NOCUMPLE', 'DESFAVORABLE'].includes(s)) return 'no'
  return ''
}
export function aplicarRespuestaEval(respuesta, valor, { analisis, modo = 'completar', corregir = null } = {}) {
  let d = leerJSON(respuesta)
  if (!esObj(d)) return noJSON
  d = corregirCon(d, corregir)
  const v = normalizarEval(valor)
  const areas = analisis?.areas || []
  const mejorar = mejorarDe(modo)
  const porId = new Map(areas.flatMap((a) => [[claveDe(idArea(a)), a], [claveDe(a.nombre), a], [claveDe(`AREA${a.propuesta || ''}`), a]]))
  const ev = esObj(d.evaluacion) ? d.evaluacion : esObj(d.matriz) ? d.matriz : {}
  const notas = Object.fromEntries(Object.entries(v.notas).map(([k, x]) => [k, { ...x }]))
  let n = 0
  for (const [aspId, porArea] of Object.entries(ev)) {
    const asp = ASPECTOS.find((a) => a.id === aspId) || ASPECTOS.find((a) => claveDe(a.nom) === claveDe(aspId))
    if (!asp || !esObj(porArea)) continue
    for (const [k, x] of Object.entries(porArea)) {
      const ar = porId.get(claveDe(k))
      const estado = estadoDe(x)
      if (!ar || !estado) continue
      const c = celdaEval(v, analisis?.sugerencias, asp.id, ar.clave)
      if (c.fuente === 'oficial') continue // lo del oficial manda
      if (c.fuente === 'calco' && c.regla === 'impositivo') continue // lo impositivo medido manda
      if (!mejorar && c.estado) continue // sólo completar: no se toca lo ya evaluado
      notas[asp.id] = notas[asp.id] || {}
      notas[asp.id][ar.clave] = { estado, por: 'ia', motivo: texto(esObj(x) ? x.motivo || x.justificacion || '' : '') }
      n++
    }
  }
  let { conclusion, conclusionIA, elegida } = v
  const conc = typeof d.conclusion === 'string' ? sinMarcaIA(d.conclusion) : ''
  if (conc && (mejorar || vacio(conclusion))) {
    conclusion = conc
    conclusionIA = true
  }
  const el = porId.get(claveDe(d.elegida || d.recomendada || ''))
  const sugerida = el ? el.nombre : ''
  if (!n && !conc) return { ok: false, error: 'La respuesta no traía ningún aspecto nuevo para las áreas de esta matriz (o todo ya estaba decidido). Revisá que use los id de los aspectos y los nombres de las áreas.' }
  return { ok: true, valor: { ...v, notas, conclusion, conclusionIA, elegida }, n, sugerida, msg: `${n} casilla(s) evaluada(s) por la IA${conc ? ' y la conclusión' : ''}.${sugerida ? ` La IA recomienda el ${sugerida}: elegilo vos en el paso 5 si estás de acuerdo.` : ''} Lo de la IA queda marcado 🤖: revisalo.` }
}

// ════════════════════════════════════════════════════════════════════════════════════
// APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA
// ════════════════════════════════════════════════════════════════════════════════════
function aslJSON(v) {
  return JSON.stringify(
    {
      objeto: sinMarcaIA(v.objeto),
      cartas: sinMarcaIA(v.cartas),
      anexos: sinMarcaIA(v.anexos),
      campos: Object.fromEntries(CAMPOS_ASL.map((c) => [c.id, sinMarcaIA(v.campos[c.id])])),
      caps: v.caps.map((c) => ({ id: c.id, nombre: c.nombre, analisis: Object.fromEntries(ANALISIS_CAP.map(([k]) => [k, sinMarcaIA(c.analisis[k])])), ventajas: sinMarcaIA(c.ventajas), desventajas: sinMarcaIA(c.desventajas) })),
    },
    null,
    1,
  )
}
export function pedidoASL(valor, { analisis = null, evaluacion = null, expediente = '', ctx = {}, hoja = null, modo = 'completar', encabezado = '' } = {}) {
  const v = normalizarASL(valor)
  const mejorar = mejorarDe(modo)
  const partes = []
  base(partes, {
    encabezado,
    expediente,
    analisis: analisis?.areas?.length ? analisis : null,
    producto: `Tu producto es la ${TITULO_ASL} (hoja ${hoja?.num || 'F1·P3'} del PMTD${hoja?.id === 'aprecOrientacion' ? ', la apreciación ACTUALIZADA con el análisis de la misión, la que se expone en la orientación al Comandante' : ''}) de ${unidadDe(ctx) || 'la unidad'}: I.- MISIÓN, II.- SITUACIÓN Y CONSIDERACIONES LOGÍSTICAS, III.- ANÁLISIS (la elección del área de apoyo logístico y, por cada Curso de Acción Propio, abastecimientos, mantenimiento, evacuación y hospitalización, transportes, diversos y conclusiones), IV.- COMPARACIÓN y V.- CONCLUSIONES Y RECOMENDACIONES. El membrete, la numeración y la firma los pone la Mesa.`,
  })
  if (evaluacion && analisis?.areas?.length) {
    const t = textoEval(evaluacion, analisis, ctx)
    if (t) partes.push(`# LA EVALUACIÓN DE LAS ÁREAS QUE YA HIZO EL G-4\n\n${t}`)
  }
  partes.push(doctrinaParaIA({ conFactores: false }))
  partes.push(`# LA APRECIACIÓN HOY\n\n${tieneASL(v) ? `\`\`\`json\n${aslJSON(v)}\n\`\`\`` : '(vacía: armala entera)'}`)
  ideas(partes, v, 'qué quiere apreciar, qué le preocupa, qué CAP prefiere')
  partes.push(
    mejorar
      ? '# TAREA — COMPLETAR Y MEJORAR LA APRECIACIÓN\n\nDevolvé la apreciación ENTERA: reescribí lo que está como producto de Estado Mayor (concreto, con el efecto sobre la operación, sin conteos sueltos) y completá lo que falta. Conservá los datos verificables y los "id" de los CAP. Lo que devuelvas REEMPLAZA lo escrito.'
      : `# TAREA — ${tieneASL(v) ? 'COMPLETAR LO QUE FALTA' : 'ARMAR LA APRECIACIÓN ENTERA'}\n\n${tieneASL(v) ? 'No toques lo que ya está escrito. Devolvé los apartados VACÍOS completos (y los CAP con su mismo "id"). Lo que ya tiene contenido no se va a cambiar aunque lo devuelvas distinto.' : 'Armala completa con lo del expediente y lo que midió la Mesa.'}`,
  )
  partes.push(`# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON (las claves de "campos" son exactamente éstas):

\`\`\`json
{
  "objeto": "…",
  "cartas": "…",
  "anexos": "“A” Calco de apoyo logístico.",
  "campos": {
${CAMPOS_ASL.map((c) => `    "${c.id}": "…"`).join(',\n')}
  },
  "caps": [
    { "id": "${v.caps[0]?.id || 'cap-1'}", "nombre": "CAP N° 1", "analisis": { ${ANALISIS_CAP.map(([k]) => `"${k}": "…"`).join(', ')} }, "ventajas": "…", "desventajas": "…" }
  ]
}
\`\`\`

QUÉ VA EN CADA CLAVE:
${CAMPOS_ASL.map((c) => `- "${c.id}": ${c.titulo}`).join('\n')}
${ANALISIS_CAP.map(([k, t]) => `- caps[].analisis."${k}": ${t}`).join('\n')}

REGLAS DEL FORMATO:
- Texto corrido; si un apartado es una lista, un renglón por ítem empezando con «- ». Sin numerar los apartados (la numeración la pone la Mesa).
- "caps": uno por Curso de Acción Propio del expediente (respetá el "id" de los que ya están; los nuevos sin "id").
- "eleccionArea": la elección del área de apoyo logístico con los datos medidos (tamaño, distancia de seguridad, DMA) y la conclusión de la evaluación de las áreas.
- "conclusiones" de cada CAP: el ENFOQUE y la PRIORIDAD de apoyo por FASE.
${REGLAS_COMUNES}`)
  partes.push(`# VERIFICACIÓN FINAL — hacela antes de contestar

1. ¿La misión de logística incluye la tarea esencial y dice quién, qué, cuándo, dónde y para qué?
2. ¿La elección del área usa lo que midió la Mesa (km², km de seguridad, DMA) y la conclusión de la evaluación?
3. ¿Cada CAP tiene sus funciones analizadas y su enfoque y prioridad por fase?
4. ¿V.- dice si la operación puede ser apoyada y cuál CAP se apoya mejor, y por qué?
5. ¿Seguiste las ideas del oficial?`)
  return { ok: true, prompt: partes.join('\n\n---\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}
export function aplicarRespuestaASL(respuesta, valor, { modo = 'completar', corregir = null } = {}) {
  let d = leerJSON(respuesta)
  if (!esObj(d)) return noJSON
  d = corregirCon(d, corregir)
  const v = normalizarASL(valor)
  const mejorar = mejorarDe(modo)
  const ia = new Set(v.iaCampos)
  let n = 0
  const poner = (actual, nuevo, clave) => {
    const t = textoIA(nuevo)
    if (!t || (!mejorar && !vacio(actual))) return actual
    ia.add(clave)
    n++
    return t
  }
  const objeto = poner(v.objeto, d.objeto, 'objeto')
  const cartas = poner(v.cartas, d.cartas, 'cartas')
  const anexos = poner(v.anexos, d.anexos, 'anexos')
  const campos = { ...v.campos }
  const dc = esObj(d.campos) ? d.campos : d
  for (const c of CAMPOS_ASL) if (dc[c.id] != null) campos[c.id] = poner(campos[c.id], dc[c.id], `campo:${c.id}`)
  let caps = v.caps.map((c) => ({ ...c, analisis: { ...c.analisis } }))
  const dcaps = Array.isArray(d.caps) ? d.caps.filter(esObj) : []
  dcaps.forEach((x, i) => {
    let c = caps.find((y) => y.id === limpio(x.id)) || (!limpio(x.id) ? caps.find((y) => claveDe(y.nombre) === claveDe(x.nombre)) : null)
    if (!c && !limpio(x.id) && caps[i] && !Object.values(caps[i].analisis).some(limpio)) c = caps[i]
    if (!c) {
      c = { id: nuevoId('cap'), nombre: limpio(x.nombre) || `CAP N° ${caps.length + 1}`, analisis: Object.fromEntries(ANALISIS_CAP.map(([k]) => [k, ''])), ventajas: '', desventajas: '' }
      caps.push(c)
    }
    if (limpio(x.nombre) && (mejorar || /^CAP N° \d+$/.test(c.nombre))) c.nombre = limpio(x.nombre)
    const an = esObj(x.analisis) ? x.analisis : x
    for (const [k] of ANALISIS_CAP) if (an[k] != null) c.analisis[k] = poner(c.analisis[k], an[k], `cap:${c.id}:${k}`)
    c.ventajas = poner(c.ventajas, x.ventajas, `cap:${c.id}:ventajas`)
    c.desventajas = poner(c.desventajas, x.desventajas, `cap:${c.id}:desventajas`)
  })
  if (!n) return { ok: false, error: mejorar ? 'La respuesta no traía apartados de la apreciación.' : 'No había nada vacío que la respuesta completara (lo escrito no se pisa). Si querés que reescriba, elegí «Completar y mejorar».' }
  return { ok: true, valor: { ...v, objeto, cartas, anexos, campos, caps, iaCampos: [...ia] }, n, msg: `${n} apartado(s) ${mejorar ? 'escritos' : 'completados'} por la IA. Quedan marcados 🤖: revisalos antes de darlos por buenos.` }
}

// ════════════════════════════════════════════════════════════════════════════════════
// MATRIZ DE SINCRONIZACIÓN LOGÍSTICA
// ════════════════════════════════════════════════════════════════════════════════════
function matrizJSON(v) {
  return JSON.stringify({ fases: v.fases, celdas: Object.fromEntries(FILAS_MATRIZ.map((f) => [f.id, Object.fromEntries(v.fases.map((fa) => [fa.id, sinMarcaIA(v.celdas[f.id][fa.id])]))])) }, null, 1)
}
export function pedidoMatriz(valor, { analisis = null, otras = '', expediente = '', ctx = {}, hoja = null, modo = 'completar', encabezado = '' } = {}) {
  const v = normalizarMatriz(valor)
  const mejorar = mejorarDe(modo)
  const partes = []
  base(partes, {
    encabezado,
    expediente,
    analisis: analisis?.areas?.length ? analisis : null,
    producto: `Tu producto es la ${TITULO_MATRIZ} (hoja ${hoja?.num || 'F7·P2'} del PMTD) de ${unidadDe(ctx) || 'la unidad'}: el producto final del G-4, que sincroniza CADA FUNCIÓN LOGÍSTICA con CADA FASE de la operación (desde — hasta), con la forma de la lámina de la Escuela.`,
  })
  if (limpio(otras)) partes.push(`# LO QUE YA RESOLVIÓ EL G-4 EN SUS OTRAS HOJAS\n\n${otras}`)
  partes.push(doctrinaParaIA({ conFactores: false, conMatriz: true }))
  partes.push(`# LA MATRIZ HOY\n\n\`\`\`json\n${matrizJSON(v)}\n\`\`\``)
  ideas(partes, v, 'cómo quiere sincronizar el apoyo')
  partes.push(
    mejorar
      ? '# TAREA — COMPLETAR Y MEJORAR LA MATRIZ\n\nDevolvé la matriz ENTERA, cada renglón en cada fase, concreta y del ejercicio (lugares, ejes, instalaciones y horas). Conservá los "id" de las fases. Lo que devuelvas REEMPLAZA lo escrito.'
      : '# TAREA — COMPLETAR LO QUE FALTA\n\nDevolvé SOLAMENTE las casillas vacías (y el «desde — hasta» de las fases que no lo tengan). Lo escrito no se toca.',
  )
  partes.push(`# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON:

\`\`\`json
{
  "fases": [ { "id": "${v.fases[0].id}", "nombre": "${v.fases[0].nombre}", "desde": "D-1 (1800)", "hasta": "D (0500)" } ],
  "celdas": {
${FILAS_MATRIZ.map((f) => `    "${f.id}": { "${v.fases[0].id}": "…" }`).join(',\n')}
  }
}
\`\`\`

REGLAS DEL FORMATO:
- Las claves de "celdas" son los id de los renglones (${FILAS_MATRIZ.map((f) => f.id).join(', ')}); dentro, los "id" de las fases (${v.fases.map((f) => f.id).join(', ')}).
- "abast_ejes": «EPA: …» y «ESA: …»; "evac_ejes": «EPE: …» y «ESE: …»; "evac_hosp": «Hospitales: …», «Norma de evacuación: …» y «PA: …»; "transporte": «Prioridad de movimiento: …» y «PA: …»; "mantenimiento": «Centros de mantenimiento de … en …» y «Prioridad de mantenimiento a …»; "recuperacion": «Centro de recolección en …».
- "amenaza": el nivel (${NIVELES_AMENAZA.map((n) => n.nom).join(', ')}) según el CAE que expone el G-2, con su razón en pocas palabras.
- Un renglón por dato (separados con salto de línea). Si en una fase no cambia nada respecto de la anterior, escribí «Ídem fase anterior».
${REGLAS_COMUNES}`)
  partes.push(`# VERIFICACIÓN FINAL — hacela antes de contestar

1. ¿Cada fase tiene su enfoque de apoyo y su prioridad, coherentes con la maniobra del G-3 en esa fase?
2. ¿Las ubicaciones y los ejes son los del calco (los que midió la Mesa) o los que el expediente ordena?
3. ¿El nivel de amenaza sale del CAE del G-2?
4. ¿Seguiste las ideas del oficial?`)
  return { ok: true, prompt: partes.join('\n\n---\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}
export function aplicarRespuestaMatriz(respuesta, valor, { modo = 'completar', corregir = null } = {}) {
  let d = leerJSON(respuesta)
  if (!esObj(d)) return noJSON
  d = corregirCon(d, corregir)
  const v = normalizarMatriz(valor)
  const mejorar = mejorarDe(modo)
  const ia = new Set(v.iaCampos)
  let n = 0
  const fases = v.fases.map((f) => ({ ...f }))
  for (const x of Array.isArray(d.fases) ? d.fases.filter(esObj) : []) {
    let f = fases.find((y) => y.id === limpio(x.id))
    if (!f && !limpio(x.id)) continue
    if (!f) {
      f = { id: limpio(x.id), nombre: limpio(x.nombre) || limpio(x.id), desde: '', hasta: '' }
      fases.push(f)
    }
    for (const k of ['desde', 'hasta']) if (limpio(x[k]) && (mejorar || !f[k])) (f[k] = limpio(x[k])), n++
    if (limpio(x.nombre) && mejorar) f.nombre = limpio(x.nombre)
  }
  const celdas = Object.fromEntries(FILAS_MATRIZ.map((f) => [f.id, Object.fromEntries(fases.map((fa) => [fa.id, v.celdas[f.id]?.[fa.id] || '']))]))
  const dc = esObj(d.celdas) ? d.celdas : {}
  for (const f of FILAS_MATRIZ) {
    const r = esObj(dc[f.id]) ? dc[f.id] : null
    if (!r) continue
    for (const fa of fases) {
      const t = textoIA(r[fa.id])
      if (!t || (!mejorar && !vacio(celdas[f.id][fa.id]))) continue
      celdas[f.id][fa.id] = t
      ia.add(`${f.id}|${fa.id}`)
      n++
    }
  }
  if (!n) return { ok: false, error: mejorar ? 'La respuesta no traía casillas de la matriz.' : 'No había casillas vacías que la respuesta completara (lo escrito no se pisa).' }
  return { ok: true, valor: { ...v, fases, celdas, iaCampos: [...ia] }, n, msg: `${n} casilla(s) ${mejorar ? 'escritas' : 'completadas'} por la IA. Quedan marcadas 🤖: revisalas.` }
}

// Lo que las otras hojas del G-4 ya dicen (para el pedido de la matriz).
export function otrasHojasG4({ evaluacion = null, analisis = null, asl = null, ctx = {} } = {}) {
  const L = []
  if (evaluacion && analisis?.areas?.length) L.push(textoEval(evaluacion, analisis, ctx))
  const a = asl ? textoASL(asl) : ''
  if (a) L.push(a)
  return L.filter(Boolean).join('\n\n')
}
export { textoMatriz }

// ════════════════════════════════════════════════════════════════════════════════════
// ANEXO DE APOYO DE SERVICIO DE COMBATE (F7·P1)
// ════════════════════════════════════════════════════════════════════════════════════
export function pedidoAnexo(valor, { analisis = null, otras = '', expediente = '', ctx = {}, hoja = null, modo = 'completar', encabezado = '' } = {}) {
  const v = normalizarAnexo(valor)
  const mejorar = mejorarDe(modo)
  const partes = []
  base(partes, { encabezado, expediente, analisis: analisis?.areas?.length ? analisis : null, producto: `Tu producto es el ${TITULO_ANEXO} a la Orden General de Operaciones (hoja ${hoja?.num || 'F7·P1'} del PMTD) de ${unidadDe(ctx) || 'la unidad'}: OBJETO, CARTA y APÉNDICES; ORGANIZACIÓN DE LA TAREA; I.- SITUACIÓN, II.- MISIÓN, III.- EJECUCIÓN (A.- Logística: concepto de apoyo por fase y funciones; B.- Personal; C.- Asuntos Civiles; D.- Instrucciones de coordinación: EPA, EPE, control de tránsito y SEGAR) y IV.- COMANDO Y COMUNICACIONES.` })
  if (limpio(otras)) partes.push(`# LO QUE YA RESOLVIÓ EL G-4 EN SUS OTRAS HOJAS (la apreciación, la evaluación del área y la matriz de sincronización)\n\n${otras}`)
  partes.push(doctrinaParaIA({ conFactores: false, conMatriz: true }))
  partes.push(`# EL ANEXO HOY\n\n\`\`\`json\n${JSON.stringify({ objeto: sinMarcaIA(v.objeto), carta: sinMarcaIA(v.carta), apendices: sinMarcaIA(v.apendices), campos: Object.fromEntries(CAMPOS_ANEXO.map((c) => [c.id, sinMarcaIA(v.campos[c.id])])) }, null, 1)}\n\`\`\``)
  ideas(partes, v, 'cómo quiere el apoyo')
  partes.push(mejorar ? '# TAREA — COMPLETAR Y MEJORAR EL ANEXO\n\nDevolvelo ENTERO, concreto y coherente con la matriz de sincronización y la apreciación. REEMPLAZA lo escrito.' : '# TAREA — COMPLETAR LO QUE FALTA\n\nDevolvé SOLAMENTE los apartados vacíos. Lo escrito no se toca.')
  partes.push(`# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON:

\`\`\`json
{ "objeto": "…", "carta": "…", "apendices": "…", "campos": {
${CAMPOS_ANEXO.map((c) => `  "${c.id}": "…"`).join(',\n')}
} }
\`\`\`

QUÉ VA EN CADA CLAVE:
${CAMPOS_ANEXO.map((c) => `- "${c.id}": ${c.titulo}`).join('\n')}

REGLAS:
- "concepto": un renglón por FASE con el enfoque y la prioridad de apoyo («- Fase I: …»).
- "segar": el nivel de amenaza (I, II o III) y la fuerza de reacción designada.
- Listas con «- » al principio de cada renglón. Sin numerar los apartados.
${REGLAS_COMUNES}`)
  partes.push('# VERIFICACIÓN FINAL\n\n1. ¿El concepto de apoyo corresponde a las fases de la operación?\n2. ¿Los ejes, las instalaciones y el área son los del calco?\n3. ¿La SEGAR sale del nivel de amenaza de la matriz?\n4. ¿Seguiste las ideas del oficial?')
  return { ok: true, prompt: partes.join('\n\n---\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}
export function aplicarRespuestaAnexo(respuesta, valor, { modo = 'completar', corregir = null } = {}) {
  let d = leerJSON(respuesta)
  if (!esObj(d)) return noJSON
  d = corregirCon(d, corregir)
  const v = normalizarAnexo(valor)
  const mejorar = mejorarDe(modo)
  const ia = new Set(v.iaCampos)
  let n = 0
  const poner = (actual, nuevo, clave) => {
    const t = textoIA(nuevo)
    if (!t || (!mejorar && !vacio(actual))) return actual
    ia.add(clave)
    n++
    return t
  }
  const objeto = poner(v.objeto, d.objeto, 'objeto')
  const carta = poner(v.carta, d.carta, 'carta')
  const apendices = poner(v.apendices, d.apendices, 'apendices')
  const campos = { ...v.campos }
  const dc = esObj(d.campos) ? d.campos : d
  for (const c of CAMPOS_ANEXO) if (dc[c.id] != null) campos[c.id] = poner(campos[c.id], dc[c.id], `campo:${c.id}`)
  if (!n) return { ok: false, error: 'No había nada vacío que la respuesta completara (lo escrito no se pisa).' }
  return { ok: true, valor: { ...v, objeto, carta, apendices, campos, iaCampos: [...ia] }, n, msg: `${n} apartado(s) ${mejorar ? 'escritos' : 'completados'} por la IA. Quedan marcados 🤖: revisalos.` }
}
