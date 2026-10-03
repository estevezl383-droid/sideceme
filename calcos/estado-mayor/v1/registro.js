// El REGISTRO de las secciones que trabajan sus documentos con este motor, y los ganchos
// que llama el compilado de la Mesa (los nombres SIDEM… del compilado apuntan acá).
//
// Para sumar una sección (p. ej. el G-5): escribir campos/g5.js con la misma forma que
// campos/g1.js y agregarla a CAMPOS. Los ganchos del compilado ya son genéricos: no hace
// falta tocarlos (salvo que la sección necesite algo nuevo del calco en sincronizarEM).
import * as M from './motor.js'
import G1 from './campos/g1.js'
import { calcoActual, contexto } from './runtime.js'

export const CAMPOS = { g1: G1 }
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
// Al pedido genérico de la hoja le agrega lo que la Mesa calculó para esta sección, lo que
// entregaron las demás y la doctrina, justo antes de «CÓMO CONTESTAR».
export function pedidoHoja(campo, hoja, r) {
  const c = configDe(campo)
  if (!c || !r?.ok || typeof r.prompt !== 'string') return r
  const ctx = contexto({ campo, vivo: calcoActual() })
  const bloques = []
  const datos = typeof c.datosCalco === 'function' ? c.datosCalco(ctx) : ''
  if (M.limpio(datos)) bloques.push(`# LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA ${c.nombre.toUpperCase()} (son datos: usalos tal cual)\n\n${datos}`)
  const ent = typeof c.entregasTexto === 'function' ? c.entregasTexto(ctx) : ''
  if (M.limpio(ent)) bloques.push(`# LO QUE YA ENTREGARON LAS OTRAS SECCIONES\n\n${ent}`)
  const doc = typeof c.doctrina === 'function' ? c.doctrina() : ''
  if (M.limpio(doc)) bloques.push(`# DOCTRINA Y REGLAMENTOS DEL CAMPO (${c.nombre})\n\n${doc}`)
  if (!bloques.length) return r
  const marca = '# CÓMO CONTESTAR'
  const i = r.prompt.indexOf(marca)
  const extra = bloques.join('\n\n---\n\n')
  return { ...r, prompt: i >= 0 ? `${r.prompt.slice(0, i)}${extra}\n\n---\n\n${r.prompt.slice(i)}` : `${r.prompt}\n\n---\n\n${extra}` }
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
