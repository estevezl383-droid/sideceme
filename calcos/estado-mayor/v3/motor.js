// MOTOR de los documentos de Estado Mayor que se TRABAJAN en «📋 Mis hojas» (G-1, G-5, y
// lo que se sume después: EME…). Sin DOM: se prueba en Node.
//
// Un documento se describe con una DEFINICIÓN (`def`), que copia la forma del modelo de
// la Escuela que ya está en el catálogo del formato militar
// (calcos/formato-militar/v1/catalogo.js):
//
//   def = {
//     esquema: 'aprec-personal-v1',          // va guardado en el valor
//     titulo: 'APRECIACIÓN DE SITUACIÓN DE PERSONAL',
//     plantilla: 'aprec-personal',            // la clase del catálogo que copia
//     registro: { id: 'aprecActiva' },        // con qué identidad sale el Word militar
//     preliminares: [{ id: 'objeto', t: 'OBJETO' }, …],
//     arbol: [ nodo, … ],
//     cap: { porFase: [{ id, t }], porCap: [{ id, t }] },   // si hay ANÁLISIS por CAP
//     obligatorios: [{ id, txt, tipo: 'err'|'aviso' }],
//   }
//
//   nodo = { t: 'Tareas.', hijos: [ … ] }          un apartado con subapartados
//        | { id: 'tareasEsp', t: 'Específicas.', ayuda: '…' }   un campo que se escribe
//        | { id: 'fuerzasPropias', t: 'Fuerzas propias.', hijos: [ … ] }   un apartado con
//          texto PROPIO (va debajo del título, antes de sus subapartados) — v3, para el G-5
//        | { caps: true, t: '…' }                   el análisis de cada CAP (y de cada fase)
//        | { ventajas: true, t: '…' }               ventajas y desventajas de cada CAP (si el
//          documento no tiene análisis por CAP —la Apreciación de AC/GM—, los CAP se nombran,
//          se agregan y se quitan acá)
//        | (cualquiera) + { sinNumero: true }       va sin «I.-», como la Organización de la Tarea
//
// El VALOR que se guarda con el ejercicio (hojasG.<g>.<hoja>):
//
//   { esquema, numero, campos: { [id]: texto }, caps: [{ id, nombre, valores: {…},
//     fases: [{ nombre, valores: {…} }], ventajas, desventajas }], ideas, firma, iaCampos }
//
// Lo que escribe el oficial MANDA: 🌱 sólo llena lo vacío; la IA en «Sólo completar»
// también; en «Completar y mejorar» reescribe, y todo lo suyo queda marcado para revisar.
import { limpio, texto, sinMarcaIA, nuevoId, ESC, claveTexto } from '../../riesgo/v1/modelo.js'
import { leerRespuestaDocumento, numeroCap } from './lector.js'

export { limpio, texto, sinMarcaIA, nuevoId, ESC, claveTexto }
export const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
export const vacio = (s) => !limpio(sinMarcaIA(s))
export const PENDIENTE = '[Pendiente de elaboración]'
export const SIN_DATO = '«SIN DATO — verificar»'
export const punto = (s) => (s && !/[.!?:;)]$/.test(s) ? `${s}.` : s)
export function romano(n) {
  let s = ''
  let x = n
  for (const [l, v] of [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]) while (x >= v) (s += l), (x -= v)
  return s
}
export const lista = (xs) => (Array.isArray(xs) ? xs : String(xs ?? '').split('\n')).map((x) => texto(x)).filter(Boolean)
const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const claveDe = (s) => sinTildes(s).toUpperCase().replace(/[^A-Z0-9]+/g, '')

// ─── El árbol ────────────────────────────────────────────────────────────────────────
// Los campos que se escriben, en el orden del documento (preliminares primero).
export function camposDe(def) {
  const out = (def.preliminares || []).map((p) => ({ id: p.id, t: p.t, ayuda: p.ayuda || '', preliminar: true }))
  const recorrer = (ns, ruta) => {
    for (const n of ns || []) {
      if (n.id) out.push({ id: n.id, t: n.t, ayuda: n.ayuda || '', ruta: [...ruta, n.t].join(' / '), ...(n.hijos ? { grupo: true } : {}) })
      if (n.hijos) recorrer(n.hijos, [...ruta, n.t])
    }
  }
  recorrer(def.arbol, [])
  return out
}
const tieneCaps = (def) => !!def.cap
const camposCap = (def) => [...(def.cap?.porCap || [])]
const camposFase = (def) => [...(def.cap?.porFase || [])]
export const nombreCap = (i) => `CAP N° ${i + 1}`
export const nombreFase = (i) => `Fase ${romano(i + 1)}`
const esNombreCap = (s) => /^CAP N° \d+$/.test(limpio(s))
const esNombreFase = (s) => /^Fase [IVX]+$/.test(limpio(s))

function capVacio(def, i, id = nuevoId('cap'), nFases = 1) {
  return {
    id,
    nombre: nombreCap(i),
    valores: Object.fromEntries(camposCap(def).map((c) => [c.id, ''])),
    fases: Array.from({ length: camposFase(def).length ? Math.max(1, nFases) : 0 }, (_, k) => ({ nombre: nombreFase(k), valores: Object.fromEntries(camposFase(def).map((c) => [c.id, ''])) })),
    ventajas: '',
    desventajas: '',
  }
}

export function normalizar(def, valor) {
  const o = esObj(valor) ? valor : {}
  const campos = {}
  for (const c of camposDe(def)) campos[c.id] = texto(o.campos?.[c.id] ?? o[c.id])
  let caps = []
  if (tieneCaps(def)) {
    caps = (Array.isArray(o.caps) ? o.caps.filter(esObj) : []).map((c, i) => ({
      id: limpio(c.id) || nuevoId('cap'),
      nombre: limpio(c.nombre) || nombreCap(i),
      valores: Object.fromEntries(camposCap(def).map((k) => [k.id, texto(c.valores?.[k.id])])),
      fases: camposFase(def).length
        ? (Array.isArray(c.fases) ? c.fases.filter(esObj) : []).map((f, k) => ({ nombre: limpio(f.nombre) || nombreFase(k), valores: Object.fromEntries(camposFase(def).map((x) => [x.id, texto(f.valores?.[x.id])])) }))
        : [],
      ventajas: texto(c.ventajas),
      desventajas: texto(c.desventajas),
    }))
    for (const c of caps) if (camposFase(def).length && !c.fases.length) c.fases = capVacio(def, 0).fases
    if (!caps.length) caps = [capVacio(def, 0, 'cap-1'), capVacio(def, 1, 'cap-2')]
  }
  return {
    esquema: def.esquema,
    numero: limpio(o.numero),
    campos,
    caps,
    ideas: texto(o.ideas),
    firma: limpio(o.firma),
    iaCampos: Array.isArray(o.iaCampos) ? [...new Set(o.iaCampos.map(String))] : [],
  }
}
export const esDe = (def, v) => esObj(v) && v.esquema === def.esquema
const capConTexto = (c) => Object.values(c.valores || {}).some(limpio) || (c.fases || []).some((f) => Object.values(f.valores).some(limpio)) || !!limpio(c.ventajas) || !!limpio(c.desventajas)
export function tiene(def, valor) {
  if (!esDe(def, valor)) return false
  const v = normalizar(def, valor)
  return Object.values(v.campos).some(limpio) || v.caps.some(capConTexto)
}
export const nuevoCap = (def, v, nFases = 1) => capVacio(def, normalizar(def, v).caps.length, nuevoId('cap'), nFases)
export const faseVacia = (def, k) => ({ nombre: nombreFase(k), valores: Object.fromEntries(camposFase(def).map((x) => [x.id, ''])) })

// Cuántas fases muestra cada CAP: las del COA del calco, o las que ya tenga escritas.
export function conFases(def, v, nombres = []) {
  if (!camposFase(def).length) return v
  const n = Math.max(1, nombres.length)
  return {
    ...v,
    caps: v.caps.map((c) => {
      const fases = c.fases.map((f) => ({ ...f, valores: { ...f.valores } }))
      while (fases.length < n) fases.push(faseVacia(def, fases.length))
      nombres.forEach((nom, k) => {
        if (limpio(nom) && fases[k] && esNombreFase(fases[k].nombre)) fases[k].nombre = `Fase ${romano(k + 1)} — ${limpio(nom)}`
      })
      return { ...c, fases }
    }),
  }
}

// ─── 🌱 Traer lo que falte (sin pisar) ──────────────────────────────────────────────
// P = { campos: { [id]: texto }, fases: ['nombre', …], caps: [{ nombre, valores, fases: [{ valores }], ventajas, desventajas }] }
export function armar(def, valor, P = {}) {
  let v = normalizar(def, valor)
  const titulos = Object.fromEntries(camposDe(def).map((c) => [c.id, c.t]))
  const cambios = []
  const campos = { ...v.campos }
  for (const [id, t] of Object.entries(P.campos || {})) {
    if (!(id in campos) || !limpio(t) || !vacio(campos[id])) continue
    campos[id] = texto(t)
    cambios.push(String(titulos[id] || id).replace(/\.-?$/, ''))
  }
  v = { ...v, campos }
  if (tieneCaps(def)) {
    v = conFases(def, v, P.fases || [])
    const caps = v.caps.map((c) => ({ ...c, valores: { ...c.valores }, fases: c.fases.map((f) => ({ ...f, valores: { ...f.valores } })) }))
    ;(P.caps || []).forEach((p, i) => {
      if (!esObj(p)) return
      if (!caps[i]) {
        if (!limpio(p.nombre)) return
        caps.push(conFases(def, { caps: [capVacio(def, i)] }, P.fases || []).caps[0])
      }
      const c = caps[i]
      if (limpio(p.nombre) && esNombreCap(c.nombre)) c.nombre = limpio(p.nombre)
      for (const k of camposCap(def)) if (limpio(p.valores?.[k.id]) && vacio(c.valores[k.id])) (c.valores[k.id] = texto(p.valores[k.id])), cambios.push(`${k.t.replace(/\.$/, '')} del ${c.nombre}`)
      ;(p.fases || []).forEach((pf, k) => {
        if (!esObj(pf)) return
        while (c.fases.length <= k) c.fases.push(faseVacia(def, c.fases.length))
        for (const x of camposFase(def)) if (limpio(pf.valores?.[x.id]) && vacio(c.fases[k].valores[x.id])) (c.fases[k].valores[x.id] = texto(pf.valores[x.id])), cambios.push(`${c.nombre} · ${c.fases[k].nombre}`)
      })
      if (limpio(p.ventajas) && vacio(c.ventajas)) (c.ventajas = texto(p.ventajas)), cambios.push(`ventajas del ${c.nombre}`)
      if (limpio(p.desventajas) && vacio(c.desventajas)) (c.desventajas = texto(p.desventajas)), cambios.push(`desventajas del ${c.nombre}`)
    })
    v = { ...v, caps }
  }
  return { valor: v, cambios: [...new Set(cambios)] }
}

// La versión actualizada (F2·P13) parte de la de la fase 1 (F1·P3), sin pisar.
export function partirDe(def, valor, base) {
  const v = normalizar(def, valor)
  const b = normalizar(def, base)
  const campos = { ...v.campos }
  for (const id of Object.keys(campos)) if (vacio(campos[id]) && !vacio(b.campos[id])) campos[id] = b.campos[id]
  const caps = v.caps.some(capConTexto) ? v.caps : b.caps
  return { ...v, campos, caps, ideas: v.ideas || b.ideas, numero: v.numero || b.numero }
}

export function revisar(def, valor) {
  const v = normalizar(def, valor)
  const R = []
  for (const o of def.obligatorios || []) if (vacio(v.campos[o.id])) R.push({ tipo: o.tipo || 'aviso', txt: o.txt })
  if (tieneCaps(def))
    for (const c of v.caps) {
      if (camposFase(def).length && !c.fases.some((f) => Object.values(f.valores).some(limpio))) R.push({ tipo: 'aviso', txt: `ANÁLISIS — ${c.nombre}: falta analizarlo fase por fase.` })
      if (def.arbol.some(function busca(n) { return n.ventajas || (n.hijos || []).some(busca) }) && vacio(c.ventajas) && vacio(c.desventajas)) R.push({ tipo: 'aviso', txt: `COMPARACIÓN — ${c.nombre}: faltan las ventajas y desventajas.` })
    }
  return R
}
export function resumen(def, valor) {
  const v = normalizar(def, valor)
  const cs = camposDe(def)
  const llenos = cs.filter((c) => !vacio(v.campos[c.id])).length
  return `${llenos} de ${cs.length} apartados${tieneCaps(def) ? ` · ${v.caps.length} CAP` : ''}`
}

// El texto llano (para el expediente que reciben las demás hojas con IA).
export function textoDe(def, valor) {
  if (!tiene(def, valor)) return ''
  const v = normalizar(def, valor)
  const L = [def.titulo]
  for (const c of camposDe(def)) if (!vacio(v.campos[c.id])) L.push(`${c.preliminar ? `${c.t}:` : c.t} ${sinMarcaIA(v.campos[c.id]).replace(/\n+/g, ' / ')}`)
  for (const c of v.caps) {
    const a = [
      ...camposCap(def).filter((k) => !vacio(c.valores[k.id])).map((k) => `${k.t} ${sinMarcaIA(c.valores[k.id])}`),
      ...c.fases.flatMap((f) => camposFase(def).filter((x) => !vacio(f.valores[x.id])).map((x) => `${f.nombre} — ${x.t} ${sinMarcaIA(f.valores[x.id])}`)),
    ]
    if (a.length) L.push(`ANÁLISIS ${c.nombre}: ${a.join(' · ').replace(/\n+/g, ' / ')}`)
    if (!vacio(c.ventajas)) L.push(`${c.nombre} — ventajas: ${sinMarcaIA(c.ventajas).replace(/\n+/g, ' / ')}`)
    if (!vacio(c.desventajas)) L.push(`${c.nombre} — desventajas: ${sinMarcaIA(c.desventajas).replace(/\n+/g, ' / ')}`)
  }
  return L.join('\n')
}

// ─── El documento militar ───────────────────────────────────────────────────────────
// Un texto de la hoja → { texto, vinetas }: los renglones que empiezan con «- » van como
// guiones debajo del texto (igual que en la apreciación del G-4).
export function partir(t) {
  const ls = sinMarcaIA(t).split('\n').map((x) => x.trim()).filter(Boolean)
  const vin = []
  const txt = []
  for (const l of ls) (/^[-•·]\s+/.test(l) ? vin : txt).push(l.replace(/^[-•·]\s+/, ''))
  return { texto: txt.join('\n'), vinetas: vin.map(punto) }
}
export function apartado(titulo, valor = '', hijos = [], extra = {}) {
  const { texto: t, vinetas } = partir(valor)
  const n = { titulo, texto: t, hijos, ...extra }
  if (vinetas.length) n.vinetas = vinetas
  if (!t && !hijos.length && !vinetas.length && !extra.tabla) n.texto = PENDIENTE
  return n
}
// `tablas` = { [idDelCampo]: { cabecera: [...], filas: [[...]] } }: cuadros que arma la
// Mesa con lo calculado (p. ej. las bajas por fase) y van debajo del texto del apartado.
export function secciones(def, valor, tablas = {}) {
  const v = normalizar(def, valor)
  const capsAnalisis = () =>
    v.caps.map((c) =>
      apartado(punto(c.nombre), '', [
        ...camposCap(def).map((k) => apartado(k.t, c.valores[k.id])),
        ...c.fases.map((f) => apartado(punto(f.nombre), '', camposFase(def).map((x) => apartado(x.t, f.valores[x.id])))),
      ]),
    )
  const nodo = (n) => {
    const extra = n.sinNumero ? { sinRotulo: true } : {}
    if (n.caps) return n.t ? [{ titulo: n.t, texto: '', hijos: capsAnalisis(), ...extra }] : capsAnalisis()
    if (n.ventajas) return [apartado(n.t, '', v.caps.map((c) => apartado(punto(c.nombre), '', [apartado('Ventajas.', c.ventajas), apartado('Desventajas.', c.desventajas)])), extra)]
    const conTabla = n.id && tablas?.[n.id]?.filas?.length ? { ...extra, tabla: tablas[n.id] } : extra
    if (n.hijos) return n.id ? [apartado(n.t, v.campos[n.id], n.hijos.flatMap(nodo), conTabla)] : [{ titulo: n.t, texto: '', hijos: n.hijos.flatMap(nodo), ...extra }]
    return [apartado(n.t, v.campos[n.id], [], conTabla)]
  }
  return def.arbol.flatMap(nodo)
}
export function especificacion(def, valor, { firma = '', modelo = '', tablas = {} } = {}) {
  const v = normalizar(def, valor)
  const s = {
    titulo: def.titulo,
    numero: limpio(v.numero) || (def.nivel === 'anexo' ? '' : '01'),
    estructuraPropia: true,
    modelo: modelo || def.modelo || `${def.titulo} — forma de la Mesa del Estado Mayor`,
    preliminares: (def.preliminares || []).map((p) => ({ rotulo: p.t, texto: sinMarcaIA(v.campos[p.id]) })),
    secciones: secciones(def, v, tablas),
  }
  const f = limpio(v.firma) || limpio(firma)
  if (f) s.firma = f
  return s
}

// HTML (vista previa sin el Word, y carpeta del EM).
const FORM = ['I', 'A', '1', 'a', '1', 'a']
const SUF = ['.-', '.-', '.-', '.-', ')', ')']
export function rotNum(nivel, n) {
  const f = FORM[Math.min(nivel, 5)]
  let s
  if (f === 'I') s = romano(n)
  else if (f === 'A' || f === 'a') {
    s = String.fromCharCode(65 + ((n - 1) % 26))
    if (f === 'a') s = s.toLowerCase()
  } else s = String(n)
  return s + SUF[Math.min(nivel, 5)]
}
function tablaHTML(tab, nivel) {
  const td = 'border:1px solid #555;padding:2px 4px;font-size:11px'
  const cab = (tab.cabecera || []).map((c) => `<th style="${td};background:#eee">${ESC(c)}</th>`).join('')
  const filas = (tab.filas || []).map((f) => `<tr>${f.map((c) => `<td style="${td}">${ESC(typeof c === 'object' && c ? c.t : c)}</td>`).join('')}</tr>`).join('')
  return `<table style="border-collapse:collapse;margin:4px 0 6px ${(nivel + 1) * 14}px"><thead><tr>${cab}</tr></thead><tbody>${filas}</tbody></table>`
}
function nodosHTML(ns, nivel = 0) {
  let i = 0
  return (ns || [])
    .filter(Boolean)
    .map((n) => {
      const pend = n.texto === PENDIENTE
      const t = n.texto ? `<span${pend ? ' style="color:#888;font-style:italic"' : ''}> ${ESC(n.texto).replace(/\n/g, '<br>')}</span>` : ''
      const vin = (n.vinetas || []).map((x) => `<div style="margin-left:${(nivel + 2) * 14}px">- ${ESC(x)}</div>`).join('')
      const num = n.sinRotulo ? '' : `${rotNum(nivel, ++i)} `
      const tab = n.tabla ? tablaHTML(n.tabla, nivel) : ''
      return `<div style="margin:3px 0 3px ${nivel * 14}px"><b>${num}${ESC(n.titulo)}</b>${t}</div>${vin}${tab}${nodosHTML(n.hijos, n.sinRotulo ? nivel : nivel + 1)}`
    })
    .join('')
}
export function html(def, valor, { firma = '', tablas = {} } = {}) {
  const s = especificacion(def, valor, { firma, tablas })
  const pre = s.preliminares.map((p) => `<div><b>${ESC(p.rotulo)}:</b> ${ESC(p.texto).replace(/\n/g, '<br>') || `<i style="color:#888">${PENDIENTE}</i>`}</div>`).join('')
  return `<div style="font-family:Arial,sans-serif;font-size:12px;color:#111"><h3 style="text-align:center;margin:4px 0">${ESC(s.titulo)}${s.numero ? ` No. ${ESC(s.numero)}` : ''}</h3>${pre}<hr>${nodosHTML(s.secciones)}<p style="text-align:center;margin-top:24px"><b>${ESC(s.firma || firma || '')}</b></p></div>`
}

// ─── La IA ───────────────────────────────────────────────────────────────────────────
export const MODOS = [
  { id: 'completar', nom: 'Sólo completar', ayuda: 'Llena únicamente los apartados vacíos. No toca una coma de lo que ya escribiste.' },
  { id: 'completar_mejorar', nom: 'Completar y mejorar', ayuda: 'Llena lo que falta Y reescribe lo que ya está como producto de Estado Mayor, siguiendo tus ideas. REEMPLAZA lo escrito.' },
]
export const mejorarDe = (modo) => modo === 'completar_mejorar' || modo === 'mejorar'
export const REGLAS_COMUNES = `- Lo que no esté en el expediente, en lo que calculó la Mesa ni en la doctrina va exactamente como ${SIN_DATO}. No inventes unidades, cifras, nombres, coordenadas, lugares ni plazos.
- Las cifras que calculó la Mesa (bajas, reemplazos, distancias, efectivos) SON DATOS: usalas tal cual, sin recalcularlas ni redondearlas distinto.
- NO escribas «[IA — verificar]»: la Mesa marca sola lo que pusiste.
- Tiene que poder leerse con JSON.parse: sin comentarios y sin texto alrededor.`

// El formato del documento como lo ve la IA: la numeración, el título, la instrucción del
// modelo de la Escuela y la clave del JSON donde va.
export function formatoParaIA(def) {
  const L = []
  for (const p of def.preliminares || []) L.push(`${p.t}  →  "campos"."${p.id}"${p.ayuda ? `  (${p.ayuda})` : ''}`)
  const rec = (ns, nivel) => {
    let i = 0
    for (const n of ns) {
      const num = n.sinNumero ? '' : `${rotNum(nivel, ++i)} `
      const pre = '  '.repeat(nivel)
      if (n.caps) {
        L.push(`${pre}${num}${n.t || 'POR CADA CURSO DE ACCIÓN PROPIO'}  →  "caps"[] (uno por CAP)`)
        for (const k of camposCap(def)) L.push(`${pre}  · ${k.t}  →  "caps"[]."valores"."${k.id}"${k.ayuda ? `  (${k.ayuda})` : ''}`)
        if (camposFase(def).length) {
          L.push(`${pre}  · Fase por fase  →  "caps"[]."fases"[] (una por fase del COA, en orden)`)
          for (const x of camposFase(def)) L.push(`${pre}      · ${x.t}  →  "caps"[]."fases"[]."valores"."${x.id}"${x.ayuda ? `  (${x.ayuda})` : ''}`)
        }
      } else if (n.ventajas) L.push(`${pre}${num}${n.t}  →  "caps"[]."ventajas" y "caps"[]."desventajas"`)
      else if (n.hijos) {
        L.push(`${pre}${num}${n.t}${n.id ? `  →  "campos"."${n.id}" (su texto propio, antes de los subapartados)` : ''}${n.ayuda ? `  (${n.ayuda})` : ''}`)
        rec(n.hijos, nivel + 1)
      } else L.push(`${pre}${num}${n.t}  →  "campos"."${n.id}"${n.ayuda ? `  (${n.ayuda})` : ''}`)
    }
  }
  rec(def.arbol, 0)
  return L.join('\n')
}
export function valorParaIA(def, valor) {
  const v = normalizar(def, valor)
  const o = { campos: Object.fromEntries(Object.entries(v.campos).map(([k, x]) => [k, sinMarcaIA(x)])) }
  if (tieneCaps(def))
    o.caps = v.caps.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      ...(camposCap(def).length ? { valores: Object.fromEntries(Object.entries(c.valores).map(([k, x]) => [k, sinMarcaIA(x)])) } : {}),
      ...(camposFase(def).length ? { fases: c.fases.map((f) => ({ nombre: f.nombre, valores: Object.fromEntries(Object.entries(f.valores).map(([k, x]) => [k, sinMarcaIA(x)])) })) } : {}),
      ventajas: sinMarcaIA(c.ventajas),
      desventajas: sinMarcaIA(c.desventajas),
    }))
  return JSON.stringify(o, null, 1)
}
function esqueletoJSON(def, v) {
  const campos = camposDe(def).map((c) => `    "${c.id}": "…"`).join(',\n')
  if (!tieneCaps(def)) return `{\n  "campos": {\n${campos}\n  }\n}`
  const vals = (xs) => `{ ${xs.map((x) => `"${x.id}": "…"`).join(', ')} }`
  const cap = [`"id": "${v.caps[0]?.id || 'cap-1'}"`, `"nombre": "CAP N° 1"`]
  if (camposCap(def).length) cap.push(`"valores": ${vals(camposCap(def))}`)
  if (camposFase(def).length) cap.push(`"fases": [ { "nombre": "Fase I — …", "valores": ${vals(camposFase(def))} } ]`)
  cap.push('"ventajas": "…"', '"desventajas": "…"')
  return `{\n  "campos": {\n${campos}\n  },\n  "caps": [\n    { ${cap.join(', ')} }\n  ]\n}`
}

// El PEDIDO a la IA. `bloques` = [{ titulo, texto }] con lo que la Mesa ya sabe (lo
// calculado en el calco, las otras hojas, lo que entregaron las otras secciones).
// Lo último que lee la IA (después sólo va la indicación del oficial): cómo contestar.
// Si igual escribe el documento, la Mesa lo lee por sus títulos (lector.js).
export const FORMATO_RESPUESTA = `# FORMATO DE TU RESPUESTA — lo más importante

Tu respuesta es SÓLO el bloque de código \`\`\`json con el objeto de «CÓMO CONTESTAR»: empieza con \`\`\`json y termina con \`\`\`. Nada antes ni después: ni saludo, ni resumen, ni el documento redactado aparte.
- Dentro de cada texto, los saltos de línea se escriben \\n (no un Enter) y las comillas dobles como \\".
- Si el JSON no te entra entero, devolvé primero los apartados vacíos o los más importantes, y cerrá bien el JSON.
- Si NO podés contestar en JSON, escribí el documento con los MISMOS títulos y la MISMA numeración del formato (I.- MISIÓN. / A.- Tareas. / 1.- Específicas. …, y en el análisis «CAP N° 1» y «Fase I»), un título por renglón y su texto debajo: la Mesa también lo lee.`

export function pedido(def, valor, { encabezado = '', expediente = '', seccion = '', producto = '', bloques = [], doctrina = '', ideasQue = 'cómo quiere el documento', tarea = '', reglas = [], verificacion = [], modo = 'completar', fasesCOA = [] } = {}) {
  const v = normalizar(def, valor)
  const mejorar = mejorarDe(modo)
  const hay = tiene(def, v)
  const P = []
  if (encabezado) P.push(encabezado)
  P.push(`Trabajás en la ${seccion}. ${producto}`)
  P.push(`# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO\n\nLeé TODO el expediente antes de escribir: la orden del escalón superior, los DOCUMENTOS APORTADOS POR EL OFICIAL (órdenes, anexos, manuales, reglamentos: tomá de ahí las cifras, nombres y normas que correspondan a esta sección), el calco, el CMOC, la PICB del G-2, los documentos del G-3 y las hojas de las demás secciones.\n\n${limpio(expediente) ? expediente : `(el expediente no estaba disponible: trabajá con lo que calculó la Mesa y marcá ${SIN_DATO} lo que no puedas afirmar)`}`)
  for (const b of bloques) if (b && limpio(b.texto)) P.push(`# ${b.titulo}\n\n${b.texto}`)
  if (limpio(doctrina)) P.push(`# DOCTRINA Y REGLAMENTOS QUE RIGEN ESTE DOCUMENTO\n\n${doctrina}`)
  P.push(`# EL FORMATO DEL DOCUMENTO — ${def.titulo}${def.fuente ? ` (modelo de la Escuela: «${def.fuente}»)` : ''}\n\nRespetá este orden y estos apartados al pie de la letra (la numeración, el membrete y la firma los pone la Mesa). Entre paréntesis, lo que pide el modelo en cada uno:\n\n${formatoParaIA(def)}`)
  P.push(`# EL DOCUMENTO HOY\n\n${hay ? `\`\`\`json\n${valorParaIA(def, v)}\n\`\`\`` : '(vacío: armalo entero)'}`)
  if (limpio(v.ideas)) P.push(`# CÓMO LO QUIERE EL OFICIAL (${ideasQue}) — respetalo al pie de la letra\n\n${sinMarcaIA(v.ideas)}\n\nSi una idea choca con el expediente, con lo calculado o con la doctrina, seguila igual y avisalo en el apartado que corresponda con ${SIN_DATO}.`)
  P.push(
    mejorar
      ? `# TAREA — COMPLETAR Y MEJORAR EL DOCUMENTO\n\nDevolvelo ENTERO: reescribí lo que está como producto de Estado Mayor (concreto, de ESTA situación, con el efecto sobre la operación, sin conteos sueltos) y completá lo que falta. Conservá los datos verificables${tieneCaps(def) ? ' y los "id" de los CAP' : ''}. Lo que devuelvas REEMPLAZA lo escrito.${tarea ? `\n\n${tarea}` : ''}`
      : `# TAREA — ${hay ? 'COMPLETAR LO QUE FALTA' : 'ARMAR EL DOCUMENTO ENTERO'}\n\n${hay ? `No toques lo que ya está escrito. Devolvé los apartados VACÍOS completos${tieneCaps(def) ? ' (y los CAP con su mismo "id")' : ''}. Lo que ya tiene contenido no se va a cambiar aunque lo devuelvas distinto.` : 'Armalo completo con lo del expediente, lo que calculó la Mesa y la doctrina.'}${tarea ? `\n\n${tarea}` : ''}`,
  )
  const fasesTxt = tieneCaps(def) && camposFase(def).length ? `\n- "fases" de cada CAP: una por fase del curso de acción, en orden${fasesCOA.length ? ` (${fasesCOA.length}: ${fasesCOA.map((f, i) => `Fase ${romano(i + 1)}${limpio(f) ? ` — ${limpio(f)}` : ''}`).join('; ')})` : ''}.` : ''
  P.push(`# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON (las claves de "campos" son exactamente éstas):

\`\`\`json
${esqueletoJSON(def, v)}
\`\`\`

QUÉ VA EN CADA CLAVE: la de cada apartado del formato de arriba («→»).

REGLAS DEL FORMATO:
- Texto corrido; si un apartado es una lista, un renglón por ítem empezando con «- ». Sin numerar los apartados (la numeración la pone la Mesa).${tieneCaps(def) ? '\n- "caps": uno por Curso de Acción Propio del expediente (respetá el "id" de los que ya están; los nuevos sin "id").' : ''}${fasesTxt}
${reglas.map((r) => `- ${r}`).join('\n')}${reglas.length ? '\n' : ''}${REGLAS_COMUNES}`)
  if (verificacion.length) P.push(`# VERIFICACIÓN FINAL — hacela antes de contestar\n\n${verificacion.map((x, i) => `${i + 1}. ${x}`).join('\n')}`)
  P.push(FORMATO_RESPUESTA)
  return { ok: true, prompt: P.join('\n\n---\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}

export { leerJSON } from './lector.js'
const textoIA = (x) => (typeof x === 'string' ? sinMarcaIA(x) : Array.isArray(x) ? sinMarcaIA(x.map((y) => (typeof y === 'string' ? `- ${y.replace(/^[-•·]\s+/, '')}` : '')).filter(Boolean).join('\n')) : '')
export const NO_JSON = { ok: false, error: 'No se reconoció la respuesta: no trae el JSON ni los títulos del documento (I.- MISIÓN., A.- Tareas., 1.- Específicas.…). Pegá la respuesta COMPLETA de la IA, desde el principio hasta el final, o pedile que la reenvíe en el bloque ```json.' }
const COMO = { 'json-reparado': ' (el JSON venía con errores de formato: se reparó)', fragmentos: ' (el JSON venía cortado: se tomó lo que se pudo leer; pedile a la IA que reenvíe lo que falte)', documento: ' (la IA no contestó en JSON: se leyó el documento por sus títulos; fijate que cada parte haya caído en su apartado)' }

export function aplicarRespuesta(def, respuesta, valor, { modo = 'completar', corregir = null } = {}) {
  const lectura = leerRespuestaDocumento(def, respuesta, camposDe(def).map((c) => c.id))
  if (!lectura) return NO_JSON
  let d = lectura.datos
  if (typeof corregir === 'function') {
    try {
      d = corregir(d) || d
    } catch {}
  }
  const v = normalizar(def, valor)
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
  const campos = { ...v.campos }
  const dc = esObj(d.campos) ? d.campos : d
  for (const c of camposDe(def)) if (dc[c.id] != null) campos[c.id] = poner(campos[c.id], dc[c.id], `campo:${c.id}`)
  const caps = v.caps.map((c) => ({ ...c, valores: { ...c.valores }, fases: c.fases.map((f) => ({ ...f, valores: { ...f.valores } })) }))
  if (tieneCaps(def) && Array.isArray(d.caps))
    d.caps.filter(esObj).forEach((x, i) => {
      // por su "id"; si no, por su nombre; si no, por su número («CAP N° 2»); si no, por el orden
      const nx = numeroCap(x.nombre)
      let c = (limpio(x.id) && caps.find((y) => y.id === limpio(x.id))) || (limpio(x.nombre) ? caps.find((y) => claveDe(y.nombre) === claveDe(x.nombre)) : null) || (nx ? caps.find((y, j) => (numeroCap(y.nombre) || j + 1) === nx) : null)
      if (!c && !limpio(x.id) && caps[i] && (!capConTexto(caps[i]) || lectura.como === 'documento')) c = caps[i]
      if (!c) {
        c = capVacio(def, caps.length, nuevoId('cap'), Array.isArray(x.fases) ? x.fases.length : 1)
        if (limpio(x.nombre)) c.nombre = limpio(x.nombre)
        caps.push(c)
      }
      if (limpio(x.nombre) && (mejorar || esNombreCap(c.nombre))) c.nombre = limpio(x.nombre)
      const xv = esObj(x.valores) ? x.valores : x
      for (const k of camposCap(def)) if (xv[k.id] != null) c.valores[k.id] = poner(c.valores[k.id], xv[k.id], `cap:${c.id}:${k.id}`)
      if (camposFase(def).length && Array.isArray(x.fases))
        x.fases.filter(esObj).forEach((xf, k) => {
          while (c.fases.length <= k) c.fases.push(faseVacia(def, c.fases.length))
          const f = c.fases[k]
          if (limpio(xf.nombre) && esNombreFase(f.nombre)) f.nombre = limpio(xf.nombre)
          const fv = esObj(xf.valores) ? xf.valores : xf
          for (const y of camposFase(def)) if (fv[y.id] != null) f.valores[y.id] = poner(f.valores[y.id], fv[y.id], `cap:${c.id}:f${k}:${y.id}`)
        })
      c.ventajas = poner(c.ventajas, x.ventajas, `cap:${c.id}:ventajas`)
      c.desventajas = poner(c.desventajas, x.desventajas, `cap:${c.id}:desventajas`)
    })
  if (!n) return { ok: false, error: mejorar ? 'La respuesta no traía apartados del documento.' : 'No había nada vacío que la respuesta completara (lo escrito no se pisa). Si querés que reescriba, elegí «Completar y mejorar».' }
  return { ok: true, valor: { ...v, campos, caps, iaCampos: [...ia] }, n, como: lectura.como, msg: `${n} apartado(s) ${mejorar ? 'escritos' : 'completados'} por la IA${COMO[lectura.como] || ''}. Quedan marcados 🤖: revisalos antes de darlos por buenos.` }
}
