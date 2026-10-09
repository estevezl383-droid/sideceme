// El REGISTRO de las secciones que trabajan sus documentos con este motor, y los ganchos
// que llama el compilado de la Mesa (los nombres SIDEM… del compilado apuntan acá).
//
// Para sumar una sección (p. ej. el EME): escribir campos/<g>.js con la misma forma que
// campos/g1.js y agregarla a CAMPOS. Los ganchos del compilado ya son genéricos: no hace
// falta tocarlos (salvo que la sección necesite algo nuevo del calco: el G-5 necesitó las
// capas, que llegan por sincronizarExtraEM, y las cuentas de su panel, por configurarEM).
import * as M from './motor.js'
import G1 from './campos/g1.js'
import G5 from './campos/g5.js'
import CMTE from './campos/cmte.js'
import JEM from './campos/jem.js'
import { ordenesDelMando, ES_MANDO } from './campos/mando.js'
import { calcoActual, contexto } from './runtime.js'
import { rescatarHoja as rescatar, filasDe as filas_, celdaFila as celda_, listasDe as listas_, claveCasilla as clave_, normalizarTabla } from './lector.js'
import { esPRC, pedidoPRC, migrarG3 as migrar_, errorRespuesta as error_, bajarWordPRC } from './prc.js'

export const CAMPOS = { g1: G1, g5: G5, cmte: CMTE, jem: JEM }
export const TIPO = 'docEM'
export const configDe = (campo) => CAMPOS[campo] || null

// ─── Las hojas de cada fase (uN del compilado) ──────────────────────────────────────
// Las hojas que la sección trabaja con el motor pasan a tipo «docEM» (con la sección y el
// documento); las demás quedan como estaban.
export function fasesConDocumentos(g, fases) {
  const c = configDe(g?.id)
  if (!c || !Array.isArray(fases)) return fases
  return fases.map((f) => ({
    ...f,
    hojas: [
      ...(f.hojas || []).map((h) => {
        const d = c.documentos?.[h.id]
        if (!d) return h
        return { ...h, tipo: TIPO, campoEM: g.id, docEM: h.id, nom: typeof d.nom === 'function' ? d.nom(h) : d.nom || h.nom, nota: d.nota || h.nota }
      }),
      ...((c.nuevas || {})[f.id] || []).map((h) => ({ ...h, tipo: TIPO, campoEM: g.id, docEM: h.id })),
    ],
  }))
}
export function docDe(hoja) {
  const c = configDe(hoja?.campoEM)
  const d = c?.documentos?.[hoja?.docEM]
  return d ? { campo: c, doc: d } : null
}
export const esDocumento = (h) => h?.tipo === TIPO && !!docDe(h)
// La identidad del Word (registroHoja del formato militar). Un documento SIN modelo dedicado
// en el catálogo (el Anexo de AC/GM) sale igual con el formato militar común —membrete,
// OCA, firma— y su estructura propia, como el que ya bajaba la Mesa: `registro.militar`.
export const registroWord = (doc, r) => (r && doc?.registro?.militar ? { ...r, militar: true } : r)
export function tieneDocumento(h, v) {
  const d = docDe(h)
  return d ? M.tiene(d.doc.def, v) : false
}
export function textoDocumento(h, v) {
  const d = docDe(h)
  return d ? M.textoDe(d.doc.def, v) : ''
}

// ─── Las hojas de trabajo de siempre (filas, dos listas, campos) ────────────────────
export function guiaHoja(campo, hoja) {
  return configDe(campo)?.guias?.[hoja?.id] || null
}
// La guía que va al pedido de la IA de la hoja (cU del compilado la escribe en el pedido).
export function guiaIA(campo, hoja) {
  const c = configDe(campo)
  if (!c || esDocumento(hoja)) return null
  return typeof c.guiaIA === 'function' ? c.guiaIA(hoja?.id) : c.guias?.[hoja?.id] || null
}
// Al pedido genérico de la hoja (el de TODAS las secciones):
//   · si la sección está registrada, lo que la Mesa calculó para ella, lo que entregaron
//     las demás y la doctrina, justo antes de «CÓMO CONTESTAR»;
//   · (v4) y SIEMPRE, al final, «FORMATO DE TU RESPUESTA»: el bloque ```json o, si no
//     puede, la tabla con su cabecera exacta / las dos listas / «Casilla: texto». Antes iba
//     antes de «CÓMO CONTESTAR» y sólo en el G-1 y el G-5; la IA terminaba leyendo «hacelo
//     corto, con el efecto» y redactaba la hoja en párrafos.
export function pedidoHoja(campo, hoja, r) {
  if (!r?.ok || typeof r.prompt !== 'string') return r
  const c = configDe(campo)
  let prompt = r.prompt
  if (c) {
    const ctx = contexto({ campo, vivo: calcoActual() })
    const bloques = []
    const datos = typeof c.datosCalco === 'function' ? c.datosCalco(ctx) : ''
    if (M.limpio(datos)) bloques.push(`# LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA ${c.nombre.toUpperCase()} (son datos: usalos tal cual)\n\n${datos}`)
    const ent = typeof c.entregasTexto === 'function' ? c.entregasTexto(ctx) : ''
    if (M.limpio(ent)) bloques.push(`# LO QUE YA ENTREGARON LAS OTRAS SECCIONES\n\n${ent}`)
    // (v6) lo que ordenó el Comandante y dispuso el JEM llega a TODAS las secciones
    const mando = ES_MANDO(campo) ? '' : ordenesDelMando(ctx)
    if (M.limpio(mando)) bloques.push(`# LO QUE ORDENÓ EL COMANDANTE Y DISPUSO EL JEM (manda sobre tu trabajo)\n\n${mando}`)
    const doc = typeof c.doctrina === 'function' ? c.doctrina() : ''
    if (M.limpio(doc)) bloques.push(`# DOCTRINA Y REGLAMENTOS DEL CAMPO (${c.nombre})\n\n${doc}`)
    const marca = '# CÓMO CONTESTAR'
    const i = prompt.indexOf(marca)
    const extra = bloques.join('\n\n---\n\n')
    if (extra) prompt = i >= 0 ? `${prompt.slice(0, i)}${extra}\n\n---\n\n${prompt.slice(i)}` : `${prompt}\n\n---\n\n${extra}`
  }
  if (!c) prompt = conMando(prompt, campo)
  return { ...r, prompt: `${prompt}\n\n---\n\n${formatoHoja(hoja, r)}` }
}
// (v6) Lo que ordenó el Comandante y dispuso el JEM, antes de «CÓMO CONTESTAR» (secciones sin registro y G-3).
function conMando(prompt, campo) {
  try {
    if (ES_MANDO(campo)) return prompt
    const t = ordenesDelMando(contexto({ campo, vivo: calcoActual() }))
    if (!M.limpio(t)) return prompt
    const bloque = `# LO QUE ORDENÓ EL COMANDANTE Y DISPUSO EL JEM (manda sobre tu trabajo)\n\n${t}`
    const i = prompt.indexOf('# CÓMO CONTESTAR')
    return i >= 0 ? `${prompt.slice(0, i)}${bloque}\n\n---\n\n${prompt.slice(i)}` : `${prompt}\n\n---\n\n${bloque}`
  } catch {
    return prompt
  }
}
// Lo que la IA de las hojas de siempre devuelve sin JSON (lo llama dU del compilado, para
// TODAS las secciones): JSON reparado, tabla de Markdown, dos listas o «Casilla: texto».
export function rescatarHoja(texto, hoja, forma) {
  try {
    return rescatar(texto, hoja, forma)
  } catch {
    return null
  }
}
// Lo ÚLTIMO del pedido de una hoja de trabajo: cómo contestar, con la cabecera exacta.
export function formatoHoja(hoja, r = {}) {
  const cols = (Array.isArray(hoja?.cols) ? hoja.cols : []).filter(Boolean)
  const forma = r.forma || { filas: 'filas', dosListas: 'dosListas', campos: 'objeto' }[hoja?.tipo] || ''
  let otra = ''
  if (forma === 'filas' && cols.length)
    otra = `una TABLA de Markdown con EXACTAMENTE esta cabecera (copiala) y un renglón por fila; nada de párrafos sueltos ni de listas:\n\n| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|`
  else if (forma === 'dosListas' && cols.length >= 2) otra = `los dos títulos «${cols[0]}» y «${cols[1]}», y debajo de cada uno un ítem por renglón empezando con «- ».`
  else if (forma === 'objeto' && hoja?.tipo === 'tabla' && cols.length && (hoja.filas || []).length)
    otra = `una TABLA de Markdown con EXACTAMENTE esta cabecera (copiala), un renglón por fila en este orden (${hoja.filas.join(' · ')}) y <br> entre renglón y renglón dentro de cada celda:\n\n| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|`
  else if (forma === 'objeto') otra = '«Nombre EXACTO de la casilla: texto», una casilla por párrafo.'
  return `# FORMATO DE TU RESPUESTA — lo último y lo más importante

Tu respuesta es SÓLO el bloque de código \`\`\`json de «CÓMO CONTESTAR»: empieza con \`\`\`json y termina con \`\`\`. Nada antes ni después: ni saludo, ni explicación, ni la hoja redactada aparte.
- Lo que se te pida sobre el ESTILO (más corto, «para exponer», con el efecto sobre la operación) va DENTRO de los textos del JSON: no cambia el formato.
- Dentro de cada texto, los saltos de línea se escriben \\n y las comillas dobles \\".${otra ? `\n- Si NO podés contestar en JSON: ${otra}` : ''}
- La Mesa lee el JSON${otra ? ' y, si no viene, eso' : ''}. Párrafos sueltos o cualquier otra forma pueden no entrar.`
}
// (v5) Las hojas del G-3 (wLe del compilado): la F3·P1 Potencia Relativa de Combate tiene
// SU pedido (prc.js: la doctrina, el método, el ejemplo de la Escuela, lo que contó la Mesa,
// lo del G-2 y los aportes de las secciones); las demás suman al final «FORMATO DE TU
// RESPUESTA», como las de las otras secciones desde la v4 (el G-3 había quedado afuera).
export function pedidoG3(hoja, valor, r, op = {}) {
  if (!r?.ok || typeof r.prompt !== 'string') return r
  try {
    if (esPRC(hoja)) return pedidoPRC(hoja, valor, r, op)
    return { ...r, prompt: `${conMando(r.prompt, 'g3')}\n\n---\n\n${formatoHoja(hoja, r)}` }
  } catch {
    return r
  }
}
// (v5) El JSON de una hoja «tabla» con la forma que venga (dU del compilado): por fila
// ({ "MANIOBRA": { "enemigas": "…" } }), en lista de renglones, con «FILA|Columna» o
// «FILA — Columna»; los renglones en lista se juntan con saltos de línea.
export function tablaDeRespuesta(g, hoja) {
  try {
    return normalizarTabla(g, hoja)
  } catch {
    return g
  }
}
// (v5) Lo escrito en la PRC con la forma vieja (los ocho sistemas operativos) pasa a la
// forma de la Escuela al abrir el panel del G-3; el mismo objeto si no hay nada que migrar.
export function migrarG3(g3) {
  try {
    return migrar_(g3)
  } catch {
    return g3
  }
}
// (v5) El error de «✓ Aplicar» (hU del compilado, TODAS las hojas y documentos): si lo
// pegado es sólo el final de la respuesta («¿Desea que profundicemos…?»), lo dice.
export function errorRespuesta(error, texto) {
  try {
    return error_(error, texto)
  } catch {
    return error
  }
}
// (v5) «📄 Word (hoja de trabajo)» de la PRC (Aoe del compilado): el .docx de la Escuela.
export function wordPRC(v) {
  return bajarWordPRC(v)
}
// (v4) La indicación del oficial va al final del pedido («es lo último que leés»): después
// de ella, un recordatorio de que cambia el ESTILO, no el FORMATO (lo llama Boe del
// compilado, para TODAS las hojas y los documentos).
export const RECORDATORIO_FORMATO = `# EL FORMATO DE TU RESPUESTA NO CAMBIA

La indicación del oficial cambia QUÉ escribís y CÓMO lo redactás (el tono, el largo, lo que priorizás). NO cambia el FORMATO: contestá exactamente como dicen «CÓMO CONTESTAR» y «FORMATO DE TU RESPUESTA», con el bloque \`\`\`json (o, si no podés, la tabla o los títulos que se indican ahí). Si te pide un texto «para exponer», ese estilo va DENTRO de los textos.`
export function cierreIndicacion(prompt, indicacion) {
  const p = String(prompt ?? '')
  if (!String(indicacion ?? '').trim()) return p
  return `${p}\n\n---\n\n${RECORDATORIO_FORMATO}`
}
// (v4) El JSON que se leyó con otra forma (dU del compilado): los renglones en otra clave,
// las columnas sin tildes o con otro nombre, las dos listas con sus nombres, las casillas
// con el rótulo largo. Nunca rompen: ante cualquier cosa rara, lo de antes.
export function filasDeRespuesta(g) {
  try {
    return filas_(g)
  } catch {
    return null
  }
}
export function celdaFila(fila, col) {
  try {
    return celda_(fila, col)
  } catch {
    return fila?.[col]
  }
}
export function listasDe(g, cols) {
  try {
    return listas_(g, cols)
  } catch {
    return { a: g?.a || g?.A || [], b: g?.b || g?.B || [] }
  }
}
export function claveCasilla(k, claves) {
  try {
    return clave_(k, claves)
  } catch {
    return undefined
  }
}

// 🌱 en una hoja de trabajo: agrega los renglones / ítems / campos que falten, sin pisar.
export function sembrarHoja(campo, hoja, valor, ctx) {
  const c = configDe(campo)
  const f = c?.semillas?.[hoja?.id]
  if (typeof f !== 'function') return { valor, n: 0 }
  const P = f(ctx, hoja)
  return fusionarHoja(hoja, valor, P)
}
export const tieneSemilla = (campo, hoja) => typeof configDe(campo)?.semillas?.[hoja?.id] === 'function'
const clave = (x) => M.claveTexto(M.sinMarcaIA(x))
export function fusionarHoja(hoja, valor, P) {
  let n = 0
  if (hoja?.tipo === 'dosListas') {
    const v = M.esObj(valor) ? valor : {}
    const out = { ...v }
    for (const k of ['a', 'b']) {
      const xs = Array.isArray(v[k]) ? [...v[k]] : []
      const hay = new Set(xs.map(clave))
      for (const x of P?.[k] || []) if (M.limpio(x) && !hay.has(clave(x))) xs.push(x), hay.add(clave(x)), n++
      out[k] = xs
    }
    return { valor: out, n }
  }
  if (hoja?.tipo === 'campos') {
    const v = M.esObj(valor) ? { ...valor } : {}
    for (const [k, x] of Object.entries(P || {})) if (M.limpio(x) && M.vacio(v[k])) (v[k] = x), n++
    return { valor: v, n }
  }
  // filas: un renglón nuevo si su primera columna no está ya
  const cols = hoja?.cols || []
  const xs = Array.isArray(valor) ? valor.filter((f) => Object.values(f || {}).some(M.limpio)) : []
  const k0 = (f) => clave(f?.[cols[0]] ?? Object.values(f || {})[0])
  const hay = new Set(xs.map(k0))
  const out = [...xs]
  for (const f of Array.isArray(P) ? P : []) if (M.esObj(f) && M.limpio(k0(f)) && !hay.has(k0(f))) out.push(f), hay.add(k0(f)), n++
  return { valor: out, n }
}
