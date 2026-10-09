// La matriz de administración del riesgo con IA: el pedido y la aplicación de su
// respuesta (JSON). Sin DOM.
//
// El pedido lleva el EXPEDIENTE ENTERO del ejercicio (la orden del escalón superior o
// tema base, los documentos aportados, el terreno con el COC y el CMOC, la
// meteorología, el enemigo, las fases del COA y las hojas de trabajo de todo el Estado
// Mayor), lo que la Mesa ya leyó (unidad, misión, grupo fecha/hora, tareas de la
// F2·P3), el MÉTODO del RO-06-01-04 (pasos 1 a 4, Cuadros 4 y 5, Figura 6), el ejemplo
// del reglamento y la matriz como está hoy. La IA devuelve letras (probabilidad A–E,
// severidad I–IV): el nivel lo calcula la Mesa con la Figura 6.
import {
  REGLAMENTO,
  FACTORES,
  NIVEL,
  normalizarRiesgo,
  lecturaDelEjercicio,
  tituloDe,
  esActualizacion,
  nivelInicial,
  nivelResidual,
  ordenNivel,
  leerProbabilidad,
  leerSeveridad,
  leerFactor,
  sinMarcaIA,
  desdeFilas,
  esMatriz,
  serializar,
  claveTexto,
  limpio,
  texto,
  items,
  nuevoId,
  tieneRiesgo,
} from './modelo.js'

export const MODOS = [
  { id: 'completar', nom: 'Sólo completar', ayuda: 'Llena lo que falta —tareas, obstáculos, estimación, controles, riesgo residual y cómo se implementan— sin tocar una coma de lo que ya escribiste. Con la matriz vacía, la arma entera.' },
  { id: 'completar_mejorar', nom: 'Completar y mejorar', ayuda: 'Hace las dos cosas: llena lo que falta Y reescribe lo que ya está como producto de Estado Mayor (obstáculos concretos del ejercicio, controles con quién, qué, dónde, cuándo y cómo). REEMPLAZA la matriz.' },
]

const METODO = `# EL MÉTODO — ${REGLAMENTO} (RC-02-103). Respetalo al pie de la letra.

PASO 1 — IDENTIFICAR LOS OBSTÁCULOS (casilla F). Un obstáculo (peligro) es una condición actual o posible que puede causar lesión, enfermedad o muerte del personal; daño o pérdida de equipo y propiedad; o degradación de la misión. Se identifican con los factores MATT-TCE, y SÓLO con lo que dice el expediente:
- MISIÓN — tipo de operación; tareas específicas, implícitas y esenciales; complejidad del plan; órdenes parciales. → §1 (Orden del escalón superior / tema base), §2, §9 (fases del COA), §11 (hojas del G-3).
- ENEMIGO (amenaza) — qué puede hacer para hacer fracasar la operación: artillería y fuegos de largo alcance, aviación, blindados, reconocimiento, guerra electrónica, operaciones especiales, terrorismo; sus cursos de acción. → §1, §6, §10 (PICB del G-2), §13 (documentos aportados: Anexo de Inteligencia), §15 (plantilla doctrinal).
- TERRENO — OCOKA: observación y campos de tiro, cubierta y encubrimiento, obstáculos (ríos, bofedales, campos minados, áreas urbanas), terreno clave y decisivo, avenidas de aproximación; el COC (terreno restringido y severamente restringido) y el CMOC (corredores, avenidas, terreno clave, pasos obligados). → §3, §4, §7, §8.
- CONDICIONES METEOROLÓGICAS — lluvias, neblina, heladas, temperatura, viento, nubosidad, luna e iluminación: su efecto sobre el personal (frío, calor, cansancio), el material (mantenimiento), el terreno (transitabilidad) y la observación. → §4 (clima y época del año).
- TROPAS DISPONIBLES — adiestramiento, efectivos, estado del material y los vehículos, moral, abastecimientos y servicios, salud; organizaciones de la tarea que no trabajaron juntas. → §6, §11 bis (G-1, G-4, G-5), §12.
- TIEMPO DISPONIBLE — la falta de tiempo para planificar, preparar y ejecutar (regla del tercio y los dos tercios). → Línea Inicial de Tiempo (en §11).
- CONSIDERACIONES CIVILES — población en el AO, evacuación, daño colateral, organizaciones, medios, adversarios que no son el enemigo. → §4 (poblaciones), §12 (asuntos civiles), §13.
Hay riesgos TÁCTICOS (los causa el enemigo) y riesgos DE ACCIDENTE (todos los demás: movimientos y tránsito, munición y explosivos, combustible, vadeo, frío, trabajos de OT, fuego amigo). Las dos clases van en la matriz.

PASO 2 — ESTIMAR LOS OBSTÁCULOS (casilla G): probabilidad × severidad → nivel de riesgo.
- Probabilidad (Cuadro 4): A Frecuente · B Probable · C Ocasional · D Rara vez · E Improbable.
- Severidad (Cuadro 5): I Catastrófico (pérdida de la capacidad para cumplir la misión, muertes, pérdida de sistemas esenciales, daño colateral inaceptable) · II Crítico (disminución severa de la capacidad, incapacidad parcial permanente, daño extenso al equipo) · III Marginal (disminución de la capacidad, daños menores) · IV Sin importancia (poco o ningún impacto).
- Nivel (Figura 6) — LO CALCULA LA MESA. Vos das SÓLO la letra y el número romano:
            A    B    C    D    E
     I     SA   SA    A    A    M
     II    SA    A    A    M    B
     III    A    M    M    B    B
     IV     M    B    B    B    B
  (SA sumamente alto · A alto · M moderado · B bajo)

PASO 3 — MEDIDAS DE CONTROL (casilla H) y RIESGO RESIDUAL (casilla I).
- Controles educacionales (adiestramiento, instrucción, ensayos), físicos (barreras, protecciones, señalización, controladores) y de anulación (evitar el contacto con el obstáculo: otro itinerario, otra hora, otro curso de acción).
- Cada control cumple: COMPATIBILIDAD (elimina el obstáculo o baja el riesgo a un nivel aceptable), FACTIBILIDAD (la unidad lo puede ejecutar con sus medios) y ACEPTABILIDAD (el beneficio justifica el costo en recursos y tiempo).
- LA CLAVE: cada control dice QUIÉN, QUÉ, DÓNDE, CUÁNDO y CÓMO, con las unidades, los lugares y las horas del expediente.
- Riesgo residual: se vuelve a estimar la probabilidad y la severidad CON el control puesto. Nunca queda más alto que el inicial: si el control baja la probabilidad, la letra avanza hacia la E; si baja la severidad, el romano avanza hacia el IV.

PASO 4 — IMPLEMENTAR LAS MEDIDAS DE CONTROL (casilla J): cómo se pone en efecto cada control o cómo se le comunica al personal que lo ejecuta — en qué párrafo o anexo de la Orden (instrucciones de coordinación, anexos de operaciones, de inteligencia, de personal, logístico, de asuntos civiles…), PON de la unidad, orden verbal, ensayo, instrucción; y con quién se coordina (unidades superiores, contiguas y subordinadas).

CASILLA K — El nivel general de la misión es el MAYOR riesgo residual de toda la matriz (no un promedio). Lo calcula la Mesa; el Comandante decide si lo acepta.`

const EJEMPLO = `# LOS EJEMPLOS (la forma que se espera)

Reglamento, Anexo «C», División / Cuerpo de Ejército — E. Tarea «Ocupar un área de operaciones»:
- F «Atacar las instalaciones» · G Moderado · H ✓ Identificar y aislar a los combatientes terroristas, partidarios. ✓ Blancos terroristas potencialmente difíciles. · I Bajo · J Coordinar con las agencias de orden público locales.
- F «Emboscada» · G Moderado · H ✓ Usar los cascos kevlar y chalecos a prueba de metralla fuera del campamento. ✓ Mínimo 4 vehículos por movimiento. ✓ Dos conductores capacitados por vehículo. · I Bajo · J Practicar los ejercicios de reacción inmediata.
- F «Minas» · G Moderado · H ✓ Entrenamiento de concientización de minas. ✓ Desminado. · I Moderado · J Operaciones de minas/contraminas. Lecciones aprendidas.

Matriz de la Escuela (una División en la defensa): tareas «MANTENIMIENTO DE EFECTIVOS» (bajas ocasionadas por el fuego enemigo), «RECONOCIMIENTOS EN EL TERRENO» (accidentes durante los reconocimientos), «SEGURIDAD EN LOS DEPÓSITOS DE CLASE III-V» (incendios por material inflamable), «EVACUACIÓN DE LA POBLACIÓN CIVIL» (civiles en el área de operaciones), «TRABAJOS DE OT» (accidentes en los trabajos de las posiciones defensivas).

Tu matriz tiene que ser MÁS CONCRETA que esos ejemplos: con los nombres del terreno, las unidades, los fenómenos y las horas de ESTE ejercicio.`

const FACTORES_JSON = FACTORES.map((f) => f.id).join(' | ')
const FORMATO = `# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON y nada más:

\`\`\`json
{
  "mision": "…",
  "empieza": "D (0500)",
  "termina": "D+1 (1800)",
  "preparacion": "D-6 (0900)",
  "preparadoPor": "…",
  "tareas": [
    {
      "id": "…",
      "tarea": "…",
      "peligros": [
        {
          "id": "…",
          "peligro": "…",
          "factor": "enemigo",
          "probabilidad": "B",
          "severidad": "II",
          "controles": ["QUIÉN hace QUÉ, DÓNDE, CUÁNDO y CÓMO", "…"],
          "probabilidadResidual": "D",
          "severidadResidual": "II",
          "implementar": ["…"],
          "fuente": "§4 del expediente — neblina de 04:30 a 07:30 h (visibilidad 150 a 200 m)"
        }
      ]
    }
  ]
}
\`\`\`

REGLAS DEL FORMATO:
- "tareas": entre 4 y 8. Primero las de la misión (las de la F2·P3 que la Mesa leyó: respetá su "id" si ya están en la matriz); después las tareas funcionales del Estado Mayor que tienen peligros concretos (reconocimientos, trabajos de OT, movimientos y desplazamientos, depósitos de Cl. III y V, evacuación de civiles, mantenimiento de efectivos…).
- "peligros": 1 a 3 por tarea (entre 8 y 16 en toda la matriz). Cada uno es UN hecho concreto de este ejercicio —qué pasa, dónde, a quién, cuándo—, no una categoría («accidentes varios» NO sirve).
- "factor": uno de ${FACTORES_JSON}. Entre todos los obstáculos tienen que estar los siete.
- "probabilidad": A, B, C, D o E. "severidad": I, II, III o IV. Igual para la residual. NO escribas el nivel: lo calcula la Mesa.
- "controles": 1 a 3 por obstáculo, cada uno con quién, qué, dónde, cuándo y cómo.
- "implementar": 1 a 3 por obstáculo: el párrafo o anexo de la orden, el PON, el ensayo o la instrucción, y la coordinación.
- "fuente": la sección del expediente o el documento de donde sale el obstáculo.
- "id": el que ya tienen las tareas y los obstáculos de la matriz de hoy; los nuevos, sin "id".
- "preparadoPor": grado, apellido y cargo si están en el expediente; si no, el cargo («G-3 DE LA …»).
- Lo que no esté en el expediente va exactamente como «SIN DATO — verificar». No inventes unidades, cifras, lugares ni autoridades.
- NO escribas «[IA — verificar]»: esta matriz se imprime y la firma el Comandante.
- Terminología de la casa: las operaciones se EJECUTAN (no «se conducen»).
- Tiene que poder leerse con JSON.parse: sin comentarios y sin texto alrededor.`

const VERIFICACION = `# VERIFICACIÓN FINAL — hacela antes de contestar

1. ¿Cada obstáculo es un hecho concreto de ESTE ejercicio (lugar, unidad, fenómeno, momento) y dice su "fuente"?
2. ¿Están los siete factores MATT-TCE entre todos los obstáculos? ¿Hay riesgos tácticos y de accidente?
3. ¿Cada obstáculo tiene probabilidad (A–E) y severidad (I–IV), y la residual con el control puesto, nunca más alta que la inicial?
4. ¿Cada control dice quién, qué, dónde, cuándo y cómo, y la unidad lo puede ejecutar con sus medios?
5. ¿Cada obstáculo dice cómo se implementan sus controles?
6. ¿Respetaste los "id" de lo que ya estaba?`

const vacio = (x) => !limpio(x)
function lecturaTexto(l) {
  const L = []
  L.push(`- Unidad considerada: ${l.unidad.nombre || 'SIN DATO — la Mesa no tiene su denominación (sacala del OBJETO o de la MISIÓN de la orden)'}${l.unidad.fuente ? ` — salió de: ${l.unidad.fuente}` : ''}.`)
  L.push(`- Escalón superior: ${l.superior || 'SIN DATO'}.`)
  L.push(`- Misión: ${l.mision.texto ? `«${l.mision.texto}» — ${l.mision.fuente}` : 'SIN DATO (sacala del expediente: reexpresión de la misión o la orden del escalón superior)'}.`)
  L.push(`- Grupo fecha/hora: empieza ${l.empieza || 'SIN DATO'} · termina ${l.termina || 'SIN DATO'}${l.fuenteHoras ? ` — salió de: ${l.fuenteHoras}` : ''}.`)
  L.push(`- Fecha de preparación: ${l.preparacion ? `${l.preparacion} (Línea Inicial de Tiempo: ${l.actualizacion ? 'al aprobar el curso de acción' : 'al terminar el análisis de la misión'})` : 'SIN DATO'}.`)
  L.push(`- Membrete: ${[l.membrete.superior, [l.membrete.unidad, l.membrete.puesto, l.membrete.fechaHora].filter(Boolean).join(' '), l.membrete.seccion, `No. ${l.membrete.numero}`].filter(Boolean).join(' · ')} — clasificación ${l.membrete.clasificacion}.`)
  if (l.tareas.length) {
    L.push('- Tareas de la F2·P3 (Tareas específicas, implícitas y esenciales):')
    l.tareas.forEach((t, i) => L.push(`  ${i + 1}. ${t.tarea} (${t.tipo}${t.esencial ? ', ESENCIAL' : ''})`))
  } else L.push('- Tareas de la F2·P3: la hoja todavía está vacía; deducilas de la misión y de la orden del escalón superior.')
  L.push(
    l.actualizacion
      ? '- Esta hoja es la ACTUALIZACIÓN (fase VI, paso 3): se trabaja sobre el CURSO DE ACCIÓN APROBADO y lo que dejó el juego de guerra. La matriz de la fase II (F2·P7) está en el expediente, entre los documentos del G-3.'
      : '- Esta hoja es la F2·P7: fase II «Analizar la misión», paso «Evaluación de riesgos» (la hacen el G-2 y el G-3). Se ACTUALIZA en la fase VI con el curso de acción aprobado.',
  )
  return L.join('\n')
}

// La matriz como está hoy, en el mismo JSON que se pide (con sus "id").
function matrizJSON(v) {
  return JSON.stringify(
    {
      mision: texto(v.mision),
      empieza: limpio(v.empieza),
      termina: limpio(v.termina),
      preparacion: limpio(v.preparacion),
      preparadoPor: limpio(v.preparadoPor),
      tareas: v.tareas.map((t) => ({
        id: t.id,
        tarea: limpio(t.tarea),
        peligros: t.peligros.map((p) => ({
          id: p.id,
          peligro: texto(p.peligro),
          factor: p.factor,
          probabilidad: p.prob,
          severidad: p.sev,
          controles: items(p.controles),
          probabilidadResidual: p.probRes,
          severidadResidual: p.sevRes,
          implementar: items(p.implementar),
          fuente: limpio(p.fuente),
          ...(p.antes ? { antes: p.antes } : {}),
        })),
      })),
    },
    null,
    1,
  )
}

export function pedidoRiesgo(valor, { expediente = '', ctx = {}, hoja = null, modo = 'completar', encabezado = '', lineaDeTiempo = null } = {}) {
  const v = normalizarRiesgo(valor)
  const l = lecturaDelEjercicio(ctx, { lineaDeTiempo, hoja })
  const mejorar = modo === 'completar_mejorar' || modo === 'mejorar'
  const hay = tieneRiesgo(v)
  const partes = []
  if (encabezado) partes.push(encabezado)
  partes.push(
    `Trabajás en la SECCIÓN III — OPERACIONES (G-3), en coordinación con el G-2 y con todo el Estado Mayor. Tu producto es la ${tituloDe(hoja)} de la unidad (hoja ${hoja?.num || 'F2·P7'} del PMTD), con el formato de la HOJA DE TRABAJO del reglamento ${REGLAMENTO} (RC-02-103), Anexo «B», y sus ejemplos del Anexo «C».\n\nEs una MATRIZ, no una lista: cada TAREA (E) con sus OBSTÁCULOS (F), y de cada obstáculo su estimación (G), sus medidas de control (H), el riesgo residual (I) y cómo se implementan (J). Arriba van la misión o tarea (A), el grupo fecha/hora (B), la fecha de preparación (C) y quién la prepara (D); abajo, el nivel general (K).`,
  )
  partes.push(`# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO\n\n${limpio(expediente) ? expediente : '(el expediente no estaba disponible: trabajá con lo que dice la matriz y lo que leyó la Mesa, y marcá «SIN DATO — verificar» lo que no puedas afirmar)'}`)
  partes.push(`# LO QUE LA MESA YA LEYÓ DEL EJERCICIO (verificalo contra el expediente)\n\n${lecturaTexto(l)}`)
  partes.push(METODO)
  partes.push(EJEMPLO)
  partes.push(`# LA MATRIZ HOY\n\n${hay ? `\`\`\`json\n${matrizJSON(v)}\n\`\`\`${v.legado ? '\n\nOJO: los obstáculos que tienen "antes" vienen de la hoja anterior (una lista sin tareas). Ubicalos en la tarea que corresponde y completá su estimación con letras.' : ''}` : '(vacía: armala entera)'}`)
  partes.push(
    mejorar
      ? `# TAREA — COMPLETAR **Y** MEJORAR LA MATRIZ, HASTA DEJARLA COMPLETA\n\nDevolvé la matriz ENTERA:\nA) LO QUE ESTÁ ESCRITO — reescribilo como producto de Estado Mayor: obstáculos concretos y anclados en el expediente, controles con quién, qué, dónde, cuándo y cómo, y el residual reevaluado. Conservá los datos verificables y los "id" de lo que ya estaba.\nB) LO QUE FALTA — completalo: ninguna casilla puede quedar vacía.\nLo que devuelvas REEMPLAZA la matriz.`
      : `# TAREA — ${hay ? 'COMPLETAR LO QUE FALTA EN LA MATRIZ' : 'ARMAR LA MATRIZ ENTERA'}\n\n${hay ? 'No toques lo que ya está escrito: eso lo puso el oficial. Devolvé las tareas que ya existen con su mismo "id", completando SOLAMENTE lo vacío (y agregándoles obstáculos si les faltan), y las tareas nuevas (sin "id") que hagan falta. Lo que ya tiene contenido no se va a cambiar aunque lo devuelvas distinto.' : 'Armá la matriz completa con lo del expediente.'}`,
  )
  partes.push(FORMATO)
  partes.push(VERIFICACION)
  return { ok: true, prompt: partes.join('\n\n---\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}

// ─── La respuesta ───────────────────────────────────────────────────────────────
// Dos tareas con el mismo nombre (p. ej. la IA le puso a la tarea sin nombre de la hoja
// anterior el de una tarea que 🌱 ya había traído de la F2·P3): queda la primera, con
// los obstáculos de las dos.
export function juntarTareasRepetidas(v) {
  const vistas = new Map()
  const out = []
  let n = 0
  for (const t of v.tareas) {
    const k = claveTexto(t.tarea)
    if (k && vistas.has(k)) {
      vistas.get(k).peligros.push(...t.peligros)
      n++
      continue
    }
    if (k) vistas.set(k, t)
    out.push(t)
  }
  v.tareas = out
  return n
}
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
const primero = (o, ...ks) => {
  for (const k of ks) if (o && o[k] != null && o[k] !== '') return o[k]
  return undefined
}
const listaIA = (x) =>
  (Array.isArray(x) ? x : typeof x === 'string' ? x.split(/\n+/) : [])
    .map((s) => sinMarcaIA(typeof s === 'object' && s ? s.texto || s.control || s.medida || s.como || '' : s).replace(/^[-–•✓·*]\s*/, ''))
    .filter(Boolean)
function peligroIA(p) {
  const res = typeof p.residual === 'object' && p.residual ? p.residual : {}
  return {
    id: limpio(p.id),
    peligro: sinMarcaIA(primero(p, 'peligro', 'obstaculo', 'obstáculo', 'F')),
    factor: leerFactor(primero(p, 'factor', 'factorMATT', 'mattTce')),
    prob: leerProbabilidad(primero(p, 'probabilidad', 'prob', 'P')),
    sev: leerSeveridad(primero(p, 'severidad', 'sev', 'S')),
    controles: listaIA(primero(p, 'controles', 'medidas', 'medidasDeControl', 'H')),
    probRes: leerProbabilidad(primero(p, 'probabilidadResidual', 'probRes') ?? res.probabilidad),
    sevRes: leerSeveridad(primero(p, 'severidadResidual', 'sevRes') ?? res.severidad),
    implementar: listaIA(primero(p, 'implementar', 'implementacion', 'implementación', 'como', 'J')),
    fuente: sinMarcaIA(primero(p, 'fuente', 'fuentes')),
  }
}
const CAMPOS_P = ['peligro', 'factor', 'prob', 'sev', 'probRes', 'sevRes', 'fuente']

export function aplicarRespuestaRiesgo(respuesta, valor, { modo = 'completar', corregir = null } = {}) {
  let d = leerJSON(respuesta)
  if (d == null) return { ok: false, error: 'No se encontró un JSON válido en lo que pegaste. Pedile a la IA que reenvíe SÓLO el bloque JSON.' }
  if (typeof corregir === 'function') d = corregir(d)
  if (Array.isArray(d)) d = { tareas: d }
  if (!d || typeof d !== 'object') return { ok: false, error: 'La respuesta no es la matriz: la IA tenía que devolver { "tareas": [ … ] }.' }
  const tareasIA = (Array.isArray(d.tareas) ? d.tareas : Array.isArray(d.matriz) ? d.matriz : []).filter((t) => t && typeof t === 'object')
  const cab = { mision: sinMarcaIA(d.mision), empieza: limpio(d.empieza), termina: limpio(d.termina), preparacion: limpio(d.preparacion), preparadoPor: sinMarcaIA(d.preparadoPor) }
  if (!tareasIA.length && !Object.values(cab).some(Boolean)) return { ok: false, error: 'La respuesta no traía tareas ni casillas de la matriz. Pedile que use el formato EXACTO del pedido.' }
  const mejorar = modo === 'completar_mejorar' || modo === 'mejorar'
  const v = normalizarRiesgo(valor)
  const idsT = new Map(v.tareas.map((t) => [t.id, t]))
  const idsP = new Map(v.tareas.flatMap((t) => t.peligros.map((p) => [p.id, p])))
  let llenas = 0
  let nuevasT = 0
  let nuevosP = 0
  let sinEstimar = 0
  let subeResidual = 0
  const contar = (p) => {
    if (!p.prob || !p.sev) sinEstimar++
    const ni = nivelInicial(p)
    const nr = nivelResidual(p)
    if (ni && nr && ordenNivel(nr) > ordenNivel(ni)) subeResidual++
  }
  const nuevoPeligro = (pi, idPrevio = '') => {
    const p = { id: idPrevio || nuevoId('p'), peligro: pi.peligro, factor: pi.factor, prob: pi.prob, sev: pi.sev, controles: pi.controles, probRes: pi.probRes, sevRes: pi.sevRes, implementar: pi.implementar, fuente: pi.fuente, ia: true }
    contar(p)
    return p
  }

  if (mejorar) {
    for (const [k, x] of Object.entries(cab)) if (x) v[k] = x
    if (tareasIA.length) {
      v.tareas = tareasIA.map((ti) => {
        const previa = idsT.get(limpio(ti.id))
        const ps = (Array.isArray(ti.peligros) ? ti.peligros : []).filter((p) => p && typeof p === 'object').map(peligroIA)
        nuevosP += ps.length
        return { id: previa ? previa.id : nuevoId('t'), tarea: sinMarcaIA(ti.tarea) || previa?.tarea || '', peligros: ps.map((pi) => nuevoPeligro(pi, idsP.has(pi.id) ? pi.id : '')) }
      })
      nuevasT = v.tareas.length
      delete v.legado
    }
  } else {
    for (const [k, x] of Object.entries(cab))
      if (x && vacio(v[k])) {
        v[k] = x
        llenas++
      }
    for (const ti of tareasIA) {
      const nombre = sinMarcaIA(ti.tarea)
      let t = idsT.get(limpio(ti.id)) || (nombre ? v.tareas.find((x) => claveTexto(x.tarea) && claveTexto(x.tarea) === claveTexto(nombre)) : null)
      const ps = (Array.isArray(ti.peligros) ? ti.peligros : []).filter((p) => p && typeof p === 'object').map(peligroIA)
      if (!t) {
        if (!nombre && !ps.length) continue
        t = { id: nuevoId('t'), tarea: nombre, peligros: [] }
        v.tareas.push(t)
        idsT.set(t.id, t)
        nuevasT++
      } else if (vacio(t.tarea) && nombre) {
        t.tarea = nombre
        llenas++
      }
      for (const pi of ps) {
        const previo = idsP.get(pi.id) || (pi.peligro ? t.peligros.find((x) => claveTexto(x.peligro) && claveTexto(x.peligro) === claveTexto(pi.peligro)) : null)
        if (!previo) {
          if (!pi.peligro && !pi.controles.length) continue
          t.peligros.push(nuevoPeligro(pi))
          nuevosP++
          continue
        }
        let tocado = false
        for (const k of CAMPOS_P)
          if (vacio(previo[k]) && pi[k]) {
            previo[k] = pi[k]
            tocado = true
            llenas++
          }
        for (const k of ['controles', 'implementar'])
          if (!items(previo[k]).length && pi[k].length) {
            previo[k] = pi[k]
            tocado = true
            llenas++
          }
        if (tocado) {
          previo.ia = true
          contar(previo)
        }
      }
    }
  }
  if (!nuevasT && !nuevosP && !llenas) return { ok: false, error: mejorar ? 'La respuesta no traía ninguna tarea con obstáculos.' : 'No había nada que completar con esa respuesta: lo que trajo ya estaba escrito. Si querés que la reescriba, elegí «Completar y mejorar».' }
  const juntadas = juntarTareasRepetidas(v)
  const partes = []
  if (mejorar) partes.push(`Matriz reescrita: ${nuevasT} tarea(s) y ${nuevosP} obstáculo(s).`)
  else partes.push(`${nuevasT ? `${nuevasT} tarea(s) nueva(s), ` : ''}${nuevosP ? `${nuevosP} obstáculo(s) nuevo(s), ` : ''}${llenas} casilla(s) completadas.`.replace(/, (\d+ casilla\(s\) completadas\.)$/, ' y $1'))
  if (juntadas) partes.push(`Se ${juntadas === 1 ? 'juntó una tarea que quedó repetida' : `juntaron ${juntadas} tareas que quedaron repetidas`} (mismo nombre) con sus obstáculos.`)
  if (sinEstimar) partes.push(`${sinEstimar === 1 ? 'Un obstáculo vino' : `${sinEstimar} obstáculos vinieron`} sin la probabilidad o la severidad con letras: estimalos vos.`)
  if (subeResidual) partes.push(`⚠️ En ${subeResidual === 1 ? 'un obstáculo' : `${subeResidual} obstáculos`} la IA dejó el residual MÁS ALTO que el inicial: corregilo.`)
  partes.push('Lo que puso la IA queda marcado «🤖 revisar» hasta que lo des por revisado: es una propuesta, no una fuente.')
  return { ok: true, valor: v, msg: partes.join(' '), nuevasT, nuevosP, llenas }
}

export const nivelTexto = (n) => (NIVEL[n] ? NIVEL[n].rotulo : '—')
export { esActualizacion }

// Otros pedidos a la IA (p. ej. «Orden de operaciones» o «Cursos de acción») pueden
// traer contenido para esta hoja entre sus «hojas_g3». La Mesa lo junta con su función
// general, que para una hoja de renglones REEMPLAZA lo que no es una lista: con la
// matriz, se juntaría una lista vieja encima y se perdería. Acá se agrega a la matriz.
export function fusionable(clave, actual, entrante) {
  if (esMatriz(actual)) return true
  return (clave === 'riesgo' || clave === 'riesgoFinal') && !!entrante && typeof entrante === 'object' && !Array.isArray(entrante) && Array.isArray(entrante.tareas)
}
export function fusionarRiesgo(actual, entrante, { pisar = false } = {}) {
  let e = entrante
  if (Array.isArray(e)) e = e.some((x) => x && Array.isArray(x.peligros)) ? { tareas: e } : desdeFilas(e)
  if (!e || typeof e !== 'object') return { valor: actual, n: 0 }
  const r = aplicarRespuestaRiesgo(JSON.stringify(e), actual, { modo: pisar ? 'completar_mejorar' : 'completar' })
  return r.ok ? { valor: serializar(r.valor), n: (r.nuevosP || 0) + (r.llenas || 0) } : { valor: actual, n: 0 }
}
