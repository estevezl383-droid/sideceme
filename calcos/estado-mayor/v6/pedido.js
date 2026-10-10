// (v6, 10-10-2026) EL PEDIDO FINAL A LA IA — lo último que pasa antes de copiarlo o bajarlo
// (Boe del compilado → registro.cierreIndicacion), para TODAS las hojas y documentos de
// «🤖 Trabajar esta hoja con IA».
//
// Lo pidió Sergio con capturas de la F1·P3 Apreciación Activa del Comandante: «Pedido copiado
// (456.419 caracteres)», y la IA contestó «La información se cortó detallando la maniobra del
// RIAT-30 "MURILLO" en la Fase III. ¿Cuál es el producto de Estado Mayor … que requiere que
// elabore?», u otro documento en prosa que cerraba con «Want me to generate…?». El pedido
// tenía el EXPEDIENTE ENTERO adelante y la tarea, el JSON y la indicación del oficial al
// final: ChatGPT y Gemini cortan un texto así de largo y la IA nunca veía qué hoja llenar ni
// en qué formato.
//
// Ahora:
//   1. Lo PRIMERO que lee la IA es la tarea: qué hoja, el bloque ```json con sus claves
//      exactas, qué NO escribir, «si el texto te llega cortado, contestá igual» y la
//      indicación del oficial (que se repite al final, como siempre).
//   2. El expediente se RECORTA al tamaño elegido (Corto / Normal / Completo), apartado por
//      apartado y sin sacar ninguno: ceden primero los largos que menos pesan para escribir
//      una hoja (los documentos aportados, el terreno, el calco con sus coordenadas); las
//      hojas del Estado Mayor, la Orden, la situación y las fases, lo último. Adentro de cada
//      apartado se reparte por documento, por hoja y por párrafo (nunca se corta uno solo y
//      se deja el resto).
//   3. Al final queda lo de siempre (CÓMO CONTESTAR, FORMATO, la indicación y el
//      recordatorio).

export const MARCA_EXPEDIENTE = '# EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR'
export const TITULO_PEDIDO = '# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO'

// ─── El tamaño del pedido ───────────────────────────────────────────────────────────
// Caracteres del pedido ENTERO (≈ 3,5 caracteres por token en español). «Normal» es lo que
// entra sin cortarse en ChatGPT, Gemini y Claude; «Completo» manda el expediente sin recortar.
export const TAMANOS = [
  { id: 'corto', nom: 'Corto', limite: 60000, ayuda: 'para ChatGPT o Gemini gratis (≈ 60 mil caracteres)' },
  { id: 'normal', nom: 'Normal', limite: 120000, ayuda: 'entra entero en ChatGPT, Gemini y Claude (≈ 120 mil caracteres)' },
  { id: 'completo', nom: 'Completo', limite: Infinity, ayuda: 'el expediente sin recortar: sólo para Claude o Gemini pagos (puede pasar los 400 mil caracteres)' },
]
const CLAVE = 'sidem-tamano-pedido'
let tamanoActual = null
export function tamanoPedido() {
  if (tamanoActual) return tamanoActual
  try {
    const t = globalThis.localStorage?.getItem(CLAVE)
    if (TAMANOS.some((x) => x.id === t)) return (tamanoActual = t)
  } catch {}
  return 'normal'
}
export function elegirTamano(id) {
  if (!TAMANOS.some((x) => x.id === id)) return tamanoPedido()
  tamanoActual = id
  try {
    globalThis.localStorage?.setItem(CLAVE, id)
  } catch {}
  return id
}
export const limiteDe = (id) => (TAMANOS.find((x) => x.id === id) || TAMANOS[1]).limite

// Lo que pasó con el último pedido armado (el panel lo muestra junto a «Pedido copiado»).
let ultimo = null
export const ultimoPedido = () => ultimo
const miles = (n) => Math.round(n).toLocaleString('es')
export function avisoPedido() {
  const u = ultimo
  if (!u) return ''
  if (u.recortado) return ` El expediente va RECORTADO (de ${miles(u.expedienteAntes)} a ${miles(u.expedienteDespues)} caracteres) para que la IA lo reciba entero; con Claude o Gemini pagos podés elegir «Completo».`
  if (u.total > limiteDe('normal')) return ' Es largo: si la IA contesta que se cortó o pregunta qué hacer, elegí «Normal» y copiá de nuevo.'
  return ''
}

// ─── Dónde está el expediente dentro del pedido ─────────────────────────────────────
// Lo arma la Mesa (_6e del compilado) y empieza siempre con MARCA_EXPEDIENTE; sus apartados
// son «## N · TÍTULO». Termina donde empieza el bloque que sigue: «---» + «# …» (las hojas
// de siempre, los documentos del motor, el riesgo, el reconocimiento, la logística…) o la
// marca de fin de la PRC.
export function ubicarExpediente(p) {
  const i = p.indexOf(MARCA_EXPEDIENTE)
  if (i < 0) return null
  const desde = i + MARCA_EXPEDIENTE.length
  const fins = ['\n---\n\n# ', '\n===== FIN DEL EXPEDIENTE'].map((m) => p.indexOf(m, desde)).filter((x) => x > 0)
  const f = fins.length ? Math.min(...fins) : p.length
  return { i, f }
}

// ─── El recorte ─────────────────────────────────────────────────────────────────────
// Qué cede primero: C (los largos que sirven de consulta), después B, y lo último A (lo que
// hace falta para escribir cualquier hoja). Un título que no está acá cuenta como B.
const NIVEL = [
  [/^## (0|1|2|5|9|10|11|11 bis|12) ·/, 'A'],
  [/^## (4|7|13) ·/, 'C'],
]
const nivelDe = (s) => (NIVEL.find(([re]) => re.test(s)) || [null, 'B'])[1]
// Los apartados del expediente son «## N · TÍTULO» (Td del compilado: 0 a 15 y «11 bis»). Un
// documento aportado convertido a .md trae sus propios títulos («## Tabla 1», «### …»): ésos NO
// abren un apartado (el 10-10 la OGO de Sergio partía el 13 en «## Tabla 1»).
const APARTADO = /\n(?=## \d+(?: bis)? · )/
const MINIMO_APARTADO = 1200
// Cómo se parte un bloque para repartir el espacio: por documento (### …), por hoja
// («- **F1·P3 — …**»), por párrafo y por renglón.
const CORTES = [
  { re: /\n(?=### )/, junta: '\n' },
  { re: /\n\n(?=- \*\*)/, junta: '\n\n' },
  { re: /\n{2,}/, junta: '\n\n' },
  { re: /\n/, junta: '\n' },
]
const MARCA_CORTE = ' …[recortado]'

// Corta en el último fin de oración, renglón o palabra antes del límite.
function cortarTexto(t, n) {
  if (t.length <= n) return t
  const lim = Math.max(0, n - MARCA_CORTE.length)
  const s = t.slice(0, lim)
  const k = Math.max(s.lastIndexOf('. '), s.lastIndexOf('\n'))
  const corte = k > lim * 0.6 ? k + 1 : Math.max(s.lastIndexOf(' '), Math.floor(lim * 0.8))
  return `${t.slice(0, corte).trimEnd()}${MARCA_CORTE}`
}

// El tope parejo: el mayor c con Σ min(tamaño, c) ≤ presupuesto.
function topeParejo(tamanos, presupuesto) {
  const xs = [...tamanos].sort((a, b) => a - b)
  let resto = presupuesto
  for (let k = 0; k < xs.length; k++) {
    const c = resto / (xs.length - k)
    if (xs[k] >= c) return Math.floor(c)
    resto -= xs[k]
  }
  return Infinity
}

// Achica un bloque a `n` caracteres repartiendo entre sus partes: las chicas quedan enteras,
// las grandes ceden parejo. Si hay tantas partes que a cada una le tocaría un renglón, se
// conservan las primeras y se dice cuántas quedaron afuera.
export function compactarBloque(t, n) {
  t = String(t ?? '')
  if (t.length <= n) return t
  if (n < 200) return cortarTexto(t, n)
  for (const { re, junta } of CORTES) {
    const partes = t.split(re)
    if (partes.length < 2) continue
    const disp = n - junta.length * (partes.length - 1)
    const c = topeParejo(partes.map((x) => x.length), disp)
    if (c >= 160) return partes.map((x) => (x.length > c ? compactarBloque(x, c) : x)).join(junta)
    // demasiadas partes: las primeras, enteras o recortadas, hasta llenar
    const out = []
    let usado = 0
    for (const x of partes) {
      const libre = n - usado - 80
      if (libre < 160) break
      const y = x.length > libre ? compactarBloque(x, libre) : x
      out.push(y)
      usado += y.length + junta.length
    }
    const fuera = partes.length - out.length
    return `${out.join(junta)}${fuera ? `${junta}…[${fuera} parte(s) más, recortadas para que el pedido entre en la IA]` : ''}`
  }
  return cortarTexto(t, n)
}

// ─── Los documentos aportados (apartado 13) ─────────────────────────────────────────
// (10-10-2026, segunda captura de Sergio: Gemini otra vez «la OGO 01-35 se cortó en la Fase III
// (RIAT-30 "MURILLO")… indique cuál es el producto».) La Mesa arma cada documento como
// «### nombre» + «_rótulo de su categoría_» + el texto (Y4e del compilado). En ese ejercicio la
// OGO entró DOS veces —«….docx.md» (rotulada ORDEN) y «….docx» (sin categoría)— y, como todo el
// apartado 13 cedía primero, con «Normal» la Orden quedaba en un párrafo de sesenta mientras las
// hojas del G-2 entraban enteras. Ahora:
//   · un documento repetido (mismo nombre con o sin «.md» y el mismo texto) va una sola vez;
//   · la ORDEN y las BASES del ejercicio («lo que dispone se cumple», «lo que digan MANDA») ceden
//     junto con las hojas del Estado Mayor (nivel A), el anexo de inteligencia y los medios en
//     el B, y los demás documentos, como antes, primero (C).
const TITULO_DOCS = /^## 13 ·/
const ROTULO_A = /^_(ORDEN DE OPERACIONES|BASES DEL EJERCICIO)\b/
const ROTULO_B = /^_(ANEXO DE INTELIGENCIA|MEDIOS DISPONIBLES)\b/
const ORDEN_NIVEL = { A: 0, B: 1, C: 2 }
// Dónde empieza un documento: «### nombre» y, en el renglón siguiente, el rótulo de su categoría
// (Tle del compilado). Un «### …» dentro del texto de un documento no lo parte.
const ROTULOS = '_(?:BASES DEL EJERCICIO|ORDEN DE OPERACIONES|ANEXO DE INTELIGENCIA|MEDIOS DISPONIBLES|Documento aportado por el oficial)'
const DOCUMENTO = new RegExp(`\\n(?=### [^\\n]*\\n${ROTULOS})`)
const INICIO_DOC = new RegExp(`^### [^\\n]*\\n${ROTULOS}`)

// Parte el apartado 13 en su título, lo que va antes del primer documento y los documentos.
function documentosDe(t) {
  const k = t.indexOf('\n')
  const titulo = k > 0 ? t.slice(0, k) : t
  const piezas = (k > 0 ? t.slice(k + 1) : '').split(DOCUMENTO)
  const intro = INICIO_DOC.test(piezas[0]) ? '' : piezas.shift()
  const docs = piezas.map((d) => {
    const nombre = d.slice(4, (d.indexOf('\n') + 1 || d.length + 1) - 1).trim()
    const rotulo = (d.split('\n')[1] || '').trim()
    return { d, nombre, nivel: ROTULO_A.test(rotulo) ? 'A' : ROTULO_B.test(rotulo) ? 'B' : 'C' }
  })
  return { titulo, intro, docs }
}
const baseNombre = (n) => n.replace(/\.md$/i, '').trim().toLowerCase()
const plano = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9ñ]+/g, ' ').trim()
// ¿El texto de `a` está en `b`? Los renglones largos de `a` (hasta 40), casi todos en `b`. Las
// tablas cambian de forma entre el .docx y el .md: por eso se mira renglón por renglón.
function mismoTexto(a, b) {
  const enB = ` ${plano(b)} `
  const muestras = a.split('\n').slice(2).map(plano).filter((x) => x.length >= 50)
  const m = muestras.filter((_, i) => i % Math.max(1, Math.ceil(muestras.length / 40)) === 0)
  if (m.length < 3) return false
  return m.filter((x) => enB.includes(` ${x} `)).length / m.length >= 0.8
}
export function depurarDocumentos(md) {
  md = String(md ?? '')
  const partes = md.split(APARTADO)
  const i = partes.findIndex((t) => TITULO_DOCS.test(t))
  if (i < 0) return md
  const { titulo, intro, docs } = documentosDe(partes[i])
  if (docs.length < 2) return md
  let cambio = false
  for (const x of docs) {
    if (x.repetido) continue
    for (const y of docs) {
      if (y === x || y.repetido || baseNombre(y.nombre) !== baseNombre(x.nombre)) continue
      // queda el de categoría más alta; a igual categoría, el .md (trae las tablas armadas)
      const quedaX = ORDEN_NIVEL[x.nivel] < ORDEN_NIVEL[y.nivel] || (x.nivel === y.nivel && /\.md$/i.test(x.nombre))
      const [queda, va] = quedaX ? [x, y] : [y, x]
      if (!mismoTexto(va.d, queda.d)) continue
      va.repetido = true
      va.d = `### ${va.nombre}\n_(Es el mismo documento que «${queda.nombre}»: va una sola vez.)_`
      cambio = true
      if (va === x) break
    }
  }
  if (!cambio) return md
  partes[i] = [titulo, ...(intro ? [intro] : []), ...docs.map((x) => x.d)].join('\n')
  return partes.join('\n')
}
// El apartado 13 se reparte en un apartado por nivel (la Orden y las Bases, A; el anexo de
// inteligencia y los medios, B; los demás, C). El primero conserva el título; los otros dicen
// «(continúa)». Si todos sus documentos son del mismo nivel, queda entero en ese nivel.
function partirDocumentos(t) {
  const { titulo, intro, docs } = documentosDe(t)
  const niveles = ['A', 'B', 'C'].filter((n) => docs.some((x) => x.nivel === n))
  if (niveles.length < 2) return [{ t, nivel: niveles[0] || 'C' }]
  return niveles.map((n, k) => ({
    t: [k ? `${titulo} (continúa)` : titulo, ...(k === 0 && intro ? [intro] : []), ...docs.filter((x) => x.nivel === n).map((x) => x.d)].join('\n'),
    nivel: n,
  }))
}

// El expediente al presupuesto: los apartados de nivel C ceden primero, después B y A.
export function compactarExpediente(md, presupuesto) {
  md = String(md ?? '')
  if (!(presupuesto < md.length)) return { texto: md, recortado: false }
  const partes = md.split(APARTADO)
  const cab = partes.shift()
  const ap = partes.flatMap((t) => (TITULO_DOCS.test(t) ? partirDocumentos(t) : [{ t, nivel: nivelDe(t) }])).map((x) => ({ ...x, orig: x.t.length }))
  const total = () => cab.length + ap.reduce((s, x) => s + x.t.length + 1, 0)
  for (const nivel of ['C', 'B', 'A']) {
    const exceso = total() - presupuesto
    if (exceso <= 0) break
    const del = ap.filter((x) => x.nivel === nivel)
    if (!del.length) continue
    const suyo = del.reduce((s, x) => s + x.t.length, 0)
    const disp = Math.max(suyo - exceso, del.length * MINIMO_APARTADO)
    const c = topeParejo(del.map((x) => x.t.length), disp)
    for (const x of del) if (x.t.length > c) x.t = recortarApartado(x.t, c)
  }
  const texto = [cab, ...ap.map((x) => x.t)].join('\n')
  return { texto, recortado: texto.length < md.length }
}
// Un apartado recortado conserva su título y dice cuánto quedó.
function recortarApartado(t, n) {
  const k = t.indexOf('\n')
  const titulo = k > 0 ? t.slice(0, k) : t
  const cuerpo = k > 0 ? t.slice(k + 1) : ''
  const nota = `\n\n_(Apartado recortado para que el pedido entre en la IA: quedan ${miles(Math.max(0, n))} de ${miles(t.length)} caracteres. Lo que no está acá, no lo inventes.)_\n`
  return `${titulo}\n${compactarBloque(cuerpo, Math.max(200, n - titulo.length - nota.length))}${nota}`
}

// ─── Lo que la IA tiene que leer PRIMERO ────────────────────────────────────────────
const lineaDe = (p, re) => (p.match(re)?.[1] || '').trim()
export function hojaDelPedido(p) {
  return (
    lineaDe(p, /\n# LA HOJA\n\n([^\n]+)/) || // las hojas de siempre (cU): «F1·P3 — Apreciación Activa del Comandante»
    lineaDe(p, /\n# LA HOJA — ([^\n]+)/) || // la PRC
    lineaDe(p, /\n# EL FORMATO DEL DOCUMENTO — ([^\n(]+)/) // los documentos del motor (la Apreciación, el Anexo…)
  )
}
// El bloque ```json de «CÓMO CONTESTAR» (el último, que es el de la hoja).
export function jsonDelPedido(p) {
  const i = p.lastIndexOf('# CÓMO CONTESTAR')
  if (i < 0) return ''
  const m = p.slice(i).match(/```json\s*\n([\s\S]*?)\n\s*```/)
  return m ? m[1].trim() : ''
}
export function tareaDelPedido(p) {
  const t = lineaDe(p, /\n# (TAREA — [^\n]+)/).replace(/\*\*/g, '')
  return t.replace(/^TAREA — /, '').replace(/\.$/, '')
}

export function encabezado(p, indicacion = '') {
  const hoja = hojaDelPedido(p)
  const json = jsonDelPedido(p)
  const tarea = tareaDelPedido(p)
  const ind = String(indicacion ?? '').trim()
  const que = hoja ? `la hoja «${hoja}» de la Mesa del Estado Mayor` : 'la hoja de la Mesa del Estado Mayor que se describe en este pedido'
  return `${TITULO_PEDIDO}

ESTO ES UN PEDIDO DE TRABAJO, NO UN DOCUMENTO PARA ANALIZAR, RESUMIR NI COMENTAR.

TU ÚNICA TAREA: llenar ${que}${tarea ? ` (${tarea.toLowerCase()})` : ''}. Todo lo que viene después —el expediente del ejercicio, las hojas que ya hicieron las otras secciones del Estado Mayor, lo que calculó la Mesa, la doctrina— son DATOS para llenarla.

${json ? `TU RESPUESTA ES SÓLO ESTE BLOQUE, con estas claves EXACTAS (cada «…» lo reemplazás por el texto):

\`\`\`json
${json}
\`\`\`` : 'TU RESPUESTA ES SÓLO EL BLOQUE ```json DE «CÓMO CONTESTAR», al final de este pedido, con sus claves exactas.'}

- Empezá con \`\`\`json y terminá con \`\`\`. Nada antes ni después: ni saludo, ni resumen, ni la hoja redactada aparte. La Mesa pega ese bloque directo en la hoja.
- NO escribas: un análisis METT-TC u OCOKA suelto, «conclusiones», la Orden de Operaciones, una matriz de sincronización, un resumen del expediente, ni preguntas («¿Cuál es el producto que requiere?», «¿Querés que…?», «Want me to…?»). La tarea ya está dicha: hacela.
- Si el texto te llega CORTADO (no ves la sección «CÓMO CONTESTAR» del final), contestá IGUAL con este bloque y con lo que llegó. No preguntes qué hacer.
- Las instrucciones detalladas (cómo se escribe la hoja, qué va en cada casilla, la doctrina) están más abajo: seguilas.${ind ? `

INDICACIÓN DEL OFICIAL PARA ESTA HOJA (manda sobre todo lo demás; se repite al final):
«${ind}»
Cambia QUÉ escribís y en qué te basás, no el formato: va DENTRO de los textos del JSON.` : ''}`
}

// ─── El pedido final ────────────────────────────────────────────────────────────────
// `p` es el pedido como lo armó la Mesa (con la indicación y el recordatorio al final).
export function armarPedidoFinal(p, indicacion = '', { tamano = tamanoPedido() } = {}) {
  p = String(p ?? '')
  if (!p.trim()) return p
  let cuerpo = p
  let exp = null
  const u = ubicarExpediente(p)
  if (u) {
    const original = p.slice(u.i, u.f)
    // un documento aportado dos veces (el .docx y su .md) va una sola vez, en todos los tamaños
    const md = depurarDocumentos(original)
    // la PRC ya empieza con su tarea («ESTO ES UN PEDIDO…»): no se le pone otra
    const ya = p.startsWith(TITULO_PEDIDO) || /ESTO ES UN PEDIDO/.test(p.slice(0, 2000))
    const cab = ya ? '' : encabezado(p, indicacion)
    const resto = p.length - original.length + (cab ? cab.length + 7 : 0)
    const limite = limiteDe(tamano)
    // 600 de margen para el aviso del recorte; si igual se pasa (las notas de cada apartado),
    // se vuelve a recortar con lo que sobró
    let presupuesto = Number.isFinite(limite) ? Math.max(15000, limite - resto - 600) : Infinity
    let r = compactarExpediente(md, presupuesto)
    for (let k = 0; k < 4 && Number.isFinite(limite) && presupuesto > 15000 && resto + r.texto.length + 600 > limite; k++) {
      presupuesto = Math.max(15000, presupuesto - (resto + r.texto.length + 600 - limite) - 200)
      r = compactarExpediente(md, presupuesto)
    }
    let texto = r.texto
    const despues = r.texto.length
    if (r.recortado) {
      const k = texto.indexOf('\n')
      const aviso = `\n\n> Este expediente va RECORTADO (de ${miles(original.length)} a ${miles(despues)} caracteres) para que el pedido te llegue entero. Están todos sus apartados; los largos (terreno, calco, documentos aportados) van resumidos; la Orden y las Bases, lo último. Lo que no está acá no lo inventes: «SIN DATO — verificar».`
      texto = k > 0 ? `${texto.slice(0, k)}${aviso}${texto.slice(k)}` : `${texto}${aviso}`
    }
    exp = { expedienteAntes: original.length, expedienteDespues: despues, recortado: r.recortado }
    cuerpo = `${p.slice(0, u.i)}${texto}${p.slice(u.f)}`
    if (cab) cuerpo = `${cab}\n\n---\n\n${cuerpo}`
  } else if (!p.startsWith(TITULO_PEDIDO) && jsonDelPedido(p) && p.length > 20000) {
    // sin el expediente de la Mesa pero largo: igual, la tarea adelante
    cuerpo = `${encabezado(p, indicacion)}\n\n---\n\n${p}`
  }
  ultimo = { total: cuerpo.length, tamano, recortado: false, ...(exp || {}) }
  return cuerpo
}
