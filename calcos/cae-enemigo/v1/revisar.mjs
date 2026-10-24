// El CAE del G-2 escrito desde el lado del ENEMIGO, y sin unidades inventadas. Sin dependencias: lo usan el
// compilado de la Mesa (hojas del G-2 y del G-3) y las pruebas (en Node).
//
// Sergio, 24-10-2026, ejercicio CE-I (AO LAUCA) contra la 1ª Br. Ac. «CORACEROS»: la IA escribió en la hoja del
// G-2 «CAE — Enunciado del curso de acción más probable»
//   · en «Misión» (del enemigo) la misión PROPIA: «El CE-I (DIV MEC-2…) defiende el AO LAUCA…»;
//   · en «Estado final deseado» (del enemigo) el estado final PROPIO, y con una unidad que nunca existió en el
//     ejercicio: «El primer escalón de la VI División de Ejército de SATURNO (1ª Brigada Acorazada «CORACEROS»)
//     detenido y desgastado…».
// Las hojas del G-3 lo muestran en «🔎 Lo que entregó el G-2» y se lo mandan a la IA, así que la «VI División»
// pasó a la F3·P4 y al P.D. 6 de la F4·P4. Esto:
//   · revisa el CAE (`revisarCAE`) y cualquier hoja (`unidadesInventadas`) y dice qué está mal (`textoAvisos`);
//   · le agrega al pedido del CAE (`pedidoCAE`) y al de las hojas del G-3 (`pedidoG3`) quién es quién y la regla
//     de no inventar unidades.
// Nunca rompe: ante cualquier cosa rara, no avisa y el pedido sale como venía.

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toUpperCase()
const TAG = /\s*\[IA\s*[—–-]\s*verificar\]\s*/gi
const limpio = (s) => String(s ?? '').replace(TAG, ' ').replace(/\s+/g, ' ').trim()
const esEnemiga = (u) => /^enemig/i.test(String(u?.bando || ''))
const esUnidad = (u) => (u?.tipo || 'unidad') === 'unidad'
const ESC = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
const NOM_ESC = { brigada: 'brigada', division: 'división', cuerpo: 'cuerpo de ejército', ejercito: 'ejército' }

// ─── Los nombres de las fichas, para encontrarlos en un texto ────────────────────────────────────────────────
// «DIV MEC-2» encuentra «DIV. MEC. 2» y «Div Mec-2»; «CE-I» no encuentra «CE-II». El apodo entre comillas
// («CORACEROS») vale solo. Se descartan los nombres muy cortos (una letra suelta encontraría cualquier cosa).
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function patrones(nombre) {
  const n = norm(nombre)
  const out = []
  const sinApodo = n.replace(/[«"“][^»"”]*[»"”]/g, ' ')
  const tok = sinApodo.match(/[A-Z0-9ªº°]+/g) || []
  if (tok.join('').length >= 3) out.push(new RegExp(`(?<![A-Z0-9])${tok.map(esc).join('[\\s.\\-–/]*')}(?![A-Z0-9])`))
  for (const m of n.matchAll(/[«"“]\s*([^»"”]{3,})\s*[»"”]/g)) {
    const a = m[1].trim()
    if (a.replace(/[^A-Z0-9]/g, '').length >= 4) out.push(new RegExp(`(?<![A-Z0-9])${esc(a)}(?![A-Z0-9])`))
  }
  return out
}
const apodos = (nombre) => [...norm(nombre).matchAll(/[«"“]\s*([^»"”]{3,})\s*[»"”]/g)].map((m) => m[1].trim())

// Las fuerzas del ejercicio: la unidad propia (la de la Orden superior), las fichas azules y las rojas, y la
// ficha roja de mayor escalón (el enemigo «principal»: el sujeto de la Misión del CAE).
export function fuerzas({ unidades = [], ordenSup = {}, unidad = '' } = {}) {
  const us = (Array.isArray(unidades) ? unidades : []).filter((u) => u && esUnidad(u))
  const nom = (u) => String(u?.designacion || '').trim()
  const propia = String(unidad || ordenSup?.unidad || '').trim()
  const propias = [...new Set([propia, ...us.filter((u) => !esEnemiga(u)).map(nom)].filter(Boolean))]
  const rojas = us.filter(esEnemiga)
  const enemigas = [...new Set(rojas.map(nom).filter(Boolean))]
  const rango = (u) => ESC.indexOf(String(u?.escalon || ''))
  const mayor = rojas.slice().sort((a, b) => rango(b) - rango(a))[0] || null
  const enemigo = mayor ? nom(mayor) || (NOM_ESC[mayor.escalon] ? `la ${NOM_ESC[mayor.escalon]} enemiga` : '') : ''
  const escEnemigo = mayor && NOM_ESC[mayor.escalon] ? NOM_ESC[mayor.escalon] : ''
  // Lo que «existe» en el ejercicio: las fichas de los dos bandos y todo lo escrito en la Orden superior.
  const textos = []
  const juntar = (x, p = 0) => {
    if (p > 4 || x == null) return
    if (typeof x === 'string') textos.push(x)
    else if (Array.isArray(x)) x.forEach((y) => juntar(y, p + 1))
    else if (typeof x === 'object') Object.values(x).forEach((y) => juntar(y, p + 1))
  }
  juntar(ordenSup)
  const claves = (xs) => new Set(xs.flatMap((t) => formaciones(t).map((g) => g.clave)))
  const conocidas = { rojas: claves(enemigas), propias: claves(propias), orden: claves(textos) }
  return {
    propia,
    propias,
    enemigas,
    enemigo,
    escEnemigo,
    conocidas,
    apodos: new Set(us.flatMap((u) => apodos(nom(u)))),
    rePropias: propias.flatMap(patrones),
    reEnemigas: enemigas.flatMap(patrones),
  }
}

// ─── Las grandes unidades que nombra un texto ────────────────────────────────────────────────────────────────
// «VI División de Ejército», «1ª Brigada Acorazada», «1RA. BRIG. AC.», «DE-VI», «DIV MEC-2», «CE-I», «II Cuerpo
// de Ejército» → { clave: 'div6' | 'br1' | 'div2' | 'ce1' …, texto, i, f } (i y f: dónde está, en el texto en
// MAYÚSCULAS y sin tildes, que tiene el mismo largo que el original salvo los signos combinados).
const ROM = { I: 1, V: 5, X: 10 }
function numero(s) {
  const t = String(s).toUpperCase()
  if (/^\d+$/.test(t)) return Number(t)
  if (!/^[IVX]+$/.test(t)) return null
  let n = 0
  for (let k = 0; k < t.length; k++) {
    const v = ROM[t[k]]
    const sig = ROM[t[k + 1]] || 0
    n += v < sig ? -v : v
  }
  return n > 0 && n < 40 ? n : null
}
const TIPO = [
  [/^CUERPO DE EJERCITO|^CE$/, 'ce'],
  [/^DIVISION|^DIV$|^DE$/, 'div'],
  [/^BRIGADA|^BRIG$|^BR$/, 'br'],
  [/^EJERCITO/, 'ej'],
]
const tipoDe = (s) => (TIPO.find(([re]) => re.test(s.replace(/\.$/, '').trim())) || [])[1] || null
const ORD = '(\\d{1,2}|[IVX]{1,5})'
const SUF = '(?:\\s*[ªº°]|\\s*(?:RA|ER|DA|DO|TA|TO|A|O)\\b)?\\.?'
const GRAN = '(CUERPO DE EJERCITO|DIVISION(?! *ES)(?: DE EJERCITO)?|BRIGADA|BRIG\\b\\.?|BR\\b\\.?|DIV\\b\\.?|EJERCITO)'
const CALIF = '(?:\\s+(?:MEC|AC|BLIN|MOT|INF|CAB|ART|ACORAZADA|MECANIZADA|BLINDADA|MOTORIZADA|DE INFANTERIA|DE CABALLERIA|DE MONTANA)\\b\\.?)?'
const RE_ORD_TIPO = new RegExp(`(?<![A-Z0-9])${ORD}${SUF}\\s*${GRAN}`, 'g')
const RE_TIPO_ORD = new RegExp(`(?<![A-Z0-9])(CUERPO DE EJERCITO|DIVISION(?: DE EJERCITO)?|BRIGADA|BRIG\\.?|BR\\.?|DIV\\.?|CE(?=[\\s-–])|DE(?=[-–]))${CALIF}\\s*(?:N\\s*[°ºO]\\.?\\s*)?[-–]?\\s*${ORD}(?![A-Z0-9])`, 'g')
export function formaciones(texto) {
  const t = norm(texto)
  const out = []
  const meter = (m, ord, tipo) => {
    const n = numero(ord)
    const k = tipoDe(tipo)
    if (n == null || !k) return
    if (out.some((o) => m.index < o.f && m.index + m[0].length > o.i)) return
    out.push({ clave: `${k}${n}`, texto: String(texto).slice(m.index, m.index + m[0].length), i: m.index, f: m.index + m[0].length })
  }
  for (const m of t.matchAll(RE_ORD_TIPO)) meter(m, m[1], m[2])
  for (const m of t.matchAll(RE_TIPO_ORD)) meter(m, m[2], m[1])
  return out.sort((a, b) => a.i - b.i)
}

// ─── ¿Unidades que no están en el ejercicio? ────────────────────────────────────────────────────────────────
// Se avisa una gran unidad que el texto pone del lado del ENEMIGO (cerca dice «enemigo/a», o el nombre o el apodo
// de una ficha roja) y que no es ninguna ficha roja ni algo que nombre la Orden superior (salvo que sea una de
// las nuestras). Así se avisa la «VI División de Ejército de SATURNO (1ª Brigada Acorazada «CORACEROS»)» aunque
// la DIV-6 propia exista, y no se avisa «el enlace con la DIV MEC-1» (un adyacente que no está del lado
// enemigo), ni «la DIV-6 contraataca a la 1ª Br. Ac.» (la nombra por su designación), ni «1ª Br. Ac.
// «CORACEROS»» (la sigue el apodo de una ficha), ni «División 6 (DIV-6)» (la aclara entre paréntesis).
function inventadasEn(texto, F) {
  const t = norm(texto)
  const C = F.conocidas
  const out = []
  const gs = formaciones(texto)
  gs.forEach((g, k) => {
    if (C.rojas.has(g.clave) || (C.orden.has(g.clave) && !C.propias.has(g.clave))) return
    const cerca = t.slice(Math.max(0, g.i - 40), g.f + 70)
    const roja = /ENEMIG|ADVERSARI|HOSTIL/.test(cerca) || F.reEnemigas.some((re) => re.test(cerca))
    if (!roja) return
    const propio = t.slice(g.i, g.f)
    if (F.rePropias.some((re) => re.test(propio))) return
    const sig = gs[k + 1]
    const tras = t.slice(g.f, Math.min(sig ? sig.i : t.length, g.f + 40))
    if ([...F.apodos].some((a) => new RegExp(`^[^«"“]*[«"“]\\s*${esc(a)}`).test(tras))) return
    if (sig && sig.clave === g.clave && /^\s*\(\s*$/.test(t.slice(g.f, sig.i))) return
    out.push(g.texto.replace(/\s+/g, ' ').trim())
  })
  return out
}

// Todas las unidades inventadas de una hoja (cualquier forma: casillas, filas, tablas), con la casilla donde
// están: [{ unidad: 'VI División de Ejército', campo: 'Estado final deseado' }].
export function unidadesInventadas(valor, ctx = {}) {
  try {
    const F = ctx.conocidas ? ctx : fuerzas(ctx)
    const out = []
    const visto = new Set()
    const recorrer = (x, campo, p = 0) => {
      if (p > 6 || x == null) return
      if (typeof x === 'string') {
        for (const u of inventadasEn(x, F)) {
          const k = norm(u)
          if (!visto.has(k)) visto.add(k), out.push({ unidad: u, campo })
        }
      } else if (Array.isArray(x))
        x.forEach((y, i) => {
          // El renglón por su primera casilla si es corta («P.D. 6»); si no, por su número.
          const prim = y && typeof y === 'object' && !Array.isArray(y) ? limpio(Object.values(y).find((v) => typeof v === 'string')) : ''
          recorrer(y, campo || (prim && prim.length <= 12 ? prim : `renglón ${i + 1}`), p + 1)
        })
      else if (typeof x === 'object')
        for (const [k, y] of Object.entries(x)) if (!String(k).startsWith('_')) recorrer(y, campo || String(k).split('|')[0], p + 1)
    }
    recorrer(valor, '')
    return out
  } catch {
    return []
  }
}

// ─── ¿El CAE está escrito desde el lado propio? ──────────────────────────────────────────────────────────────
// La primera unidad que nombra el texto es la PROPIA y es el sujeto: «El CE-I (DIV MEC-2…) defiende el AO LAUCA».
// No cuenta si antes dice «enemigo», «contra», «sobre»… («El enemigo ataca para destruir al CE-I»).
function primera(t, F) {
  let mejor = null
  for (const [lado, res] of [['propia', F.rePropias], ['enemiga', F.reEnemigas]])
    for (const re of res) {
      const m = re.exec(t)
      if (m && (!mejor || m.index < mejor.i)) mejor = { lado, i: m.index, f: m.index + m[0].length, txt: m[0] }
    }
  return mejor
}
function sujetoPropio(texto, F) {
  const t = norm(limpio(texto))
  const p = primera(t, F)
  if (!p || p.lado !== 'propia') return null
  const antes = t.slice(0, p.i).replace(/^[\s"'«“]*(MISION|INTENCION DEL COMANDANTE|ESTADO FINAL DESEADO)?\s*:?\s*[«"“]?/, '')
  if (/ENEMIG|CONTRA|SOBRE|FRENTE|ATAC|DESTRU|DE LA$|DEL$|AL$|A LA$/.test(antes.trim())) return null
  if ((antes.match(/[A-Z]+/g) || []).length > 4) return null
  return p.txt
}
// El estado final PROPIO escrito como del enemigo: el enemigo (o su primer escalón) «detenido, desgastado,
// destruido, rechazado…» sin que haya una unidad propia en el medio («la defensa del CE-I desarticulada» es
// del enemigo y está bien).
const DERROTA = /\b(DETENID|DESGASTAD|DESTRUID|RECHAZAD|NEUTRALIZAD|ANIQUILAD|DERROTAD|BATID|CANALIZAD|FIJAD|DESORGANIZAD|DESARTICULAD|DIEZMAD)[OA]S?\b/
function derrotaEnemiga(texto, F) {
  const t = norm(limpio(texto)).slice(0, 260)
  const d = DERROTA.exec(t)
  if (!d) return false
  const antes = t.slice(0, d.index)
  const roja = /ENEMIG|PRIMER ESCALON|SEGUNDO ESCALON/.test(antes) || F.reEnemigas.some((re) => re.test(antes))
  if (!roja) return false
  return !F.rePropias.some((re) => re.test(antes))
}

const CAMPOS_SUJETO = ['Misión', 'Intención del Comandante', 'Concepto de la operación', 'Estado final deseado']
const corto = (s, n = 110) => {
  const x = limpio(s)
  return x.length > n ? `${x.slice(0, n).replace(/\s+\S*$/, '')}…` : x
}

// Los avisos del CAE: [{ campo, tipo: 'propia' | 'final' | 'inventada', txt }].
export function revisarCAE(cae, ctx = {}) {
  try {
    if (!cae || typeof cae !== 'object') return []
    const F = ctx.conocidas ? ctx : fuerzas(ctx)
    const out = []
    for (const campo of CAMPOS_SUJETO) {
      const v = cae[campo]
      if (typeof v !== 'string' || !limpio(v)) continue
      const s = sujetoPropio(v, F)
      if (s) out.push({ campo, tipo: 'propia', txt: corto(v) })
      else if (campo === 'Estado final deseado' && derrotaEnemiga(v, F)) out.push({ campo, tipo: 'final', txt: corto(v) })
    }
    for (const { unidad, campo } of unidadesInventadas(cae, F)) out.push({ campo, tipo: 'inventada', txt: unidad })
    return out
  } catch {
    return []
  }
}

// El aviso en palabras, un renglón por problema («• …»). Corto: es para leerlo de un vistazo en la pantalla.
export function textoAvisos(avisos, ctx = {}) {
  if (!Array.isArray(avisos) || !avisos.length) return ''
  const F = ctx.conocidas ? ctx : fuerzas(ctx)
  const enemigo = F.enemigo ? `${F.enemigo}${F.escEnemigo ? ` (una ${F.escEnemigo})` : ''}` : 'la unidad de las fichas rojas'
  const L = []
  for (const a of avisos) {
    if (a.tipo === 'propia') L.push(`«${a.campo}» es la misión PROPIA («${corto(a.txt, 60)}»): tiene que decir qué hace ${enemigo}.`)
    else if (a.tipo === 'final') L.push(`«${a.campo}» es lo que queremos NOSOTROS (el enemigo detenido o desgastado), no lo que quiere el enemigo.`)
    else L.push(`«${a.txt}»${a.campo ? ` (en «${a.campo}»)` : ''} no está en las fichas ni en la Orden superior: el enemigo es ${enemigo}.`)
  }
  return L.map((x) => `• ${x}`).join('\n')
}

// ─── Lo que se le agrega al pedido de la IA ─────────────────────────────────────────────────────────────────
// Va justo antes de «# CÓMO CONTESTAR» (lo último, donde más pesa, y antes del formato); si no está, al final.
function insertar(prompt, bloque) {
  const marca = '\n\n---\n\n# CÓMO CONTESTAR'
  const i = prompt.lastIndexOf(marca)
  return i >= 0 ? `${prompt.slice(0, i)}\n\n---\n\n${bloque}${prompt.slice(i)}` : `${prompt}\n\n---\n\n${bloque}`
}
const lista = (xs, n = 8) => (xs.length > n ? `${xs.slice(0, n).join(', ')}…` : xs.join(', '))
const conPedido = (r, f) => {
  if (r && typeof r.then === 'function') return r.then((x) => conPedido(x, f))
  if (!r?.ok || typeof r.prompt !== 'string') return r
  try {
    const b = f()
    return b ? { ...r, prompt: insertar(r.prompt, b) } : r
  } catch {
    return r
  }
}

export function bloqueCAE(ctx = {}) {
  const F = ctx.conocidas ? ctx : fuerzas(ctx)
  const enemigo = F.enemigo || 'la unidad enemiga de las fichas rojas'
  return `# QUIÉN ES QUIÉN EN ESTA HOJA — LEELO ANTES DE ESCRIBIR

Esta hoja es el curso de acción del ENEMIGO, escrito como si fuera SU orden.
- El sujeto de «Misión», «Intención del Comandante», «Concepto de la operación» y «Estado final deseado» es el ENEMIGO: ${enemigo}${F.escEnemigo ? ` (es una ${F.escEnemigo.toUpperCase()})` : ''}${F.enemigas.length > 1 ? `, con ${lista(F.enemigas.filter((x) => x !== F.enemigo))}` : ''}.
- NOSOTROS somos ${F.propia || 'la unidad propia'}${F.propias.length > 1 ? ` (${lista(F.propias.filter((x) => x !== F.propia))})` : ''}: somos a quien el enemigo ataca. No somos el sujeto de ninguna casilla. NO copies la misión propia de la Orden («${F.propia || 'la unidad propia'} defiende…»).
- «Misión»: «${enemigo} ataca (o lo que haga) a partir de … por … para …».
- «Estado final deseado»: lo que quiere lograr EL ENEMIGO (sus objetivos tomados, nuestra defensa desarticulada), NO lo que queremos nosotros (el enemigo detenido, desgastado o rechazado).
- NO inventes unidades, escalones ni comandos superiores: usá sólo las unidades de las fichas, de la Orden y del expediente. Si el enemigo es una brigada, no lo pongas dentro de una división, un cuerpo o un ejército que no estén en el ejercicio.`
}

export function bloqueG3(ctx = {}) {
  const F = ctx.conocidas ? ctx : fuerzas(ctx)
  const enemigo = F.enemigo ? `${F.enemigo}${F.escEnemigo ? ` (una ${F.escEnemigo})` : ''}` : 'la unidad de las fichas rojas'
  const av = revisarCAE(ctx.picb?.cae, F)
  return `# EL ENEMIGO ES EL DEL EJERCICIO

- El enemigo es ${enemigo}${F.enemigas.length > 1 ? `, con ${lista(F.enemigas.filter((x) => x !== F.enemigo))}` : ''}: el de las fichas rojas y la plantilla situacional. NO inventes unidades, escalones ni comandos superiores que no estén en el ejercicio (si es una brigada, no la pongas dentro de una división que no existe).
- La unidad propia es ${F.propia || 'la de la Orden superior'}.${av.length ? `\n- ⚠️ El CAE del G-2 tiene errores:\n${textoAvisos(av, F).replace(/^• /gm, '  • ')}\n  NO copies esas frases a esta hoja: para el enemigo usá las fichas rojas, la plantilla situacional y el resto del PICB.` : ''}`
}

// El pedido del CAE (hoja `cae` del G-2) y el de las hojas del G-3, con su bloque. Las demás hojas, igual.
export function pedidoCAE(r, hoja, ctx = {}) {
  if (hoja?.id !== 'cae') return r
  return conPedido(r, () => bloqueCAE(ctx))
}
export function pedidoG3(r, ctx = {}) {
  return conPedido(r, () => bloqueG3(ctx))
}

const avisosDe = (hoja, valor, ctx) =>
  hoja?.id === 'cae' ? revisarCAE(valor, ctx) : unidadesInventadas(valor, ctx).map((x) => ({ ...x, tipo: 'inventada', txt: x.unidad }))

// Lo que se suma al mensaje de «✓ Aplicar» (con un espacio adelante) o ''.
export function avisoAplicar(hoja, valor, ctx = {}) {
  try {
    const t = textoAvisos(avisosDe(hoja, valor, ctx), ctx)
    return t ? ` ⚠️ OJO, ${hoja?.id === 'cae' ? 'el CAE' : 'esta hoja'} tiene errores: ${t.replace(/\n/g, ' ')} Corregilos antes de seguir.` : ''
  } catch {
    return ''
  }
}
// El aviso fijo arriba de la hoja (el CAE en el G-2, o la hoja del G-3 que se está viendo), o ''.
export function avisoHoja(hoja, valor, ctx = {}) {
  try {
    const t = textoAvisos(avisosDe(hoja, valor, ctx), ctx)
    return t ? `⚠️ Revisar ${hoja?.id === 'cae' ? 'el CAE: está escrito desde NUESTRO lado o con unidades que no existen' : 'esta hoja'}:\n${t}` : ''
  } catch {
    return ''
  }
}
// Para «🔎 Lo que entregó el G-2» (hojas del G-3): qué tiene mal el CAE, o ''.
export function avisoG2(picb, ctx = {}) {
  try {
    const t = textoAvisos(revisarCAE(picb?.cae, ctx), ctx)
    return t ? `⚠️ Este CAE tiene errores (que lo corrija el G-2 en Documentos → CAE; mientras tanto no lo copies a esta hoja):\n${t}` : ''
  } catch {
    return ''
  }
}

// Para la caja de la IA (hU del compilado): el pedido ya armado, retocado por `f` si la hoja la pasa.
export function despues(r, f) {
  if (typeof f !== 'function') return r
  return Promise.resolve(r).then((x) => {
    try {
      return f(x)
    } catch {
      return x
    }
  })
}
