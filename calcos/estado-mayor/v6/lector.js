// El LECTOR de las respuestas de la IA. Sin DOM: se prueba en Node.
//
// Lo pidió Sergio el 03-10-2026: la IA no siempre contesta con el JSON que pide el pedido.
// A veces escribe el DOCUMENTO entero (títulos con «I.- A.- 1.-», negritas de Markdown,
// listas numeradas), a veces un JSON con saltos de línea dentro de los textos, comillas
// tipográficas, comas de más, o cortado por el largo. La Mesa tiene que reconocerlo igual:
//
//   1 · JSON tal cual (dentro de ```json … ``` o suelto);
//   2 · JSON REPARADO: saltos de línea crudos dentro de los textos, comas finales,
//       comillas tipográficas como delimitadores;
//   3 · FRAGMENTOS de un JSON cortado: cada "clave": "texto" que se pueda leer;
//   4 · el DOCUMENTO ESCRITO: se reparte por los títulos del formato (los mismos del
//       pedido), en orden; los CAP y las fases por su número; lo que no es título es
//       el texto del apartado en curso.
//
// Para las hojas de trabajo de siempre (renglones, dos listas, casillas): JSON
// tolerante, la tabla de Markdown, las dos listas debajo de sus títulos y «Casilla: texto».
// v5 (06-10-2026, la F3·P1 Potencia Relativa de Combate del G-3): las hojas de tipo
// «tabla» (filas fijas × columnas) se leen por fila y por columna — ver leerTablaHoja y
// normalizarTabla, más abajo.
// v4 (03-10-2026, la F2·P3 del G-5 con «Completar y mejorar» volvía «No se reconoció la
// respuesta»): también la tabla COPIADA DE LA PANTALLA de la IA (celdas separadas por
// tabuladores), los renglones ROTULADOS («Tipo: Implícita»), las listas numeradas o con
// viñetas (con « — » entre columnas o rótulos en el mismo renglón), los títulos por tipo
// («Tareas específicas»), cada { … } de un JSON cortado, y los nombres de columna
// aproximados («Fuente» → «De dónde sale», sin tildes…).

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
export const norm = (s) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
const recortar = (s) => String(s ?? '').replace(/\n{3,}/g, '\n\n').trim()

// ════════════════════════════════════════════════════════════════════════════════════
// JSON
// ════════════════════════════════════════════════════════════════════════════════════
function candidatos(t) {
  const s = String(t || '')
  const c = []
  for (const m of s.matchAll(/```[a-zA-Z]*\s*([\s\S]*?)```/g)) c.push(m[1])
  // el que abre primero: un [ … ] que contiene objetos no se confunde con su primer { … }
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  const i = s.indexOf('[')
  const j = s.lastIndexOf(']')
  const obj = a >= 0 && b > a ? s.slice(a, b + 1) : ''
  const arr = i >= 0 && j > i ? s.slice(i, j + 1) : ''
  if (arr && (!obj || i < a)) c.push(arr, obj)
  else c.push(obj, arr)
  return [...new Set(c.map((x) => x.trim()).filter(Boolean))]
}
// Escapa los saltos de línea y tabulaciones CRUDOS que quedaron dentro de los textos.
export function escaparEnCadenas(s) {
  let out = ''
  let en = false
  let esc = false
  for (const ch of String(s)) {
    if (en) {
      if (esc) (out += ch), (esc = false)
      else if (ch === '\\') (out += ch), (esc = true)
      else if (ch === '"') (out += ch), (en = false)
      else if (ch === '\n') out += '\\n'
      else if (ch === '\r') continue
      else if (ch === '\t') out += '\\t'
      else out += ch
    } else {
      if (ch === '"') en = true
      out += ch
    }
  }
  return out
}
const sinComasFinales = (s) => s.replace(/,(\s*[}\]])/g, '$1')
const comillasRectas = (s) => s.replace(/[“”„‟″]/g, '"')
const REPARACIONES = [(x) => x, escaparEnCadenas, (x) => sinComasFinales(escaparEnCadenas(x)), (x) => sinComasFinales(escaparEnCadenas(comillasRectas(x)))]

// → { datos, reparado } o null
export function leerJSON(t) {
  for (const c of candidatos(t))
    for (let k = 0; k < REPARACIONES.length; k++) {
      try {
        const d = JSON.parse(REPARACIONES[k](c))
        if (d && typeof d === 'object') return { datos: d, reparado: k > 0 }
      } catch {}
    }
  return null
}
// Un JSON cortado (la IA se quedó sin espacio): cada "clave": "texto" que se pueda leer.
export function fragmentosJSON(t, claves = []) {
  const s = String(t || '')
  if (!/"\s*:/.test(s)) return null
  const d = {}
  for (const k of claves) {
    const m = new RegExp(`"${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(s)
    if (!m) continue
    try {
      d[k] = JSON.parse(`"${escaparEnCadenas(`"${m[1]}"`).slice(1, -1)}"`)
    } catch {
      d[k] = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }
  }
  return Object.keys(d).length ? d : null
}

// ════════════════════════════════════════════════════════════════════════════════════
// TEXTO: renglones, numeración y títulos
// ════════════════════════════════════════════════════════════════════════════════════
// «I.-», «A.-», «1.-», «a.-», «1)», «IV.», «B.» (con espacio o mayúscula después).
const NUM = /^(?:([IVXLC]{1,5})|([A-Za-z])|(\d{1,2}))(?:(\.-|\.–)\s*|[.)]\s+|[.)](?=[A-ZÁÉÍÓÚÑ«"“¿]))/
const VINETA = /^[-•·*▪]\s+/
export function renglones(t) {
  return String(t || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((raw) => {
      const md = /^\s{0,3}#{1,6}\s/.test(raw)
      const negrita = /^\s*(\*\*|__).+(\*\*|__)\s*:?\s*$/.test(raw)
      let s = raw
        .replace(/^\s{0,3}#{1,6}\s*/, '')
        .replace(/^\s*>\s?/, '')
        .replace(/\*\*|__/g, '')
        .replace(/^\s*\|?\s*$/, '')
        .replace(/[ \t]+/g, ' ')
        .trim()
        .normalize('NFC')
      const vineta = VINETA.test(s)
      const m = vineta ? null : NUM.exec(s)
      const resto = m ? s.slice(m[0].length).trim() : vineta ? s.replace(VINETA, '').trim() : s
      return { s, resto, vineta, num: m ? m[0].trim() : '', militar: !!m?.[4], md, negrita, titular: !!m || md || negrita || /:\s*$/.test(s) }
    })
    .filter((r) => r.s)
}
// ¿El renglón empieza con el título? → { contenido } o null. Si después del título viene
// texto sin puntuación, sólo vale si el renglón «parece título» (numerado, # o negrita).
export function coincide(r, titulo, { estricto = false } = {}) {
  const w = norm(String(titulo || '').replace(/\(.*?\)/g, ' ')).split(' ').filter(Boolean)
  if (!w.length) return null
  const base = sinTildes(r.resto).toLowerCase()
  const re = new RegExp(`^[^a-z0-9]*${w.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^a-z0-9]+')}(?![a-z0-9])`)
  const m = re.exec(base)
  if (!m) return null
  let resto = r.resto.slice(m[0].length)
  resto = resto.replace(/^\s*\([^)]*\)/, '')
  const limpio = /^\s*$/.test(resto)
  const puntuado = /^\s*[.:;\-–—)]/.test(resto)
  if (!limpio && !puntuado && (estricto || !r.titular)) return null
  return { contenido: resto.replace(/^[\s.:;\-–—)]+/, '').trim() }
}
const alNumero = (s) => {
  const x = String(s || '').trim()
  if (/^\d+$/.test(x)) return +x
  const R = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  if (/^[IVXLC]+$/i.test(x)) {
    let n = 0
    const u = x.toUpperCase()
    for (let i = 0; i < u.length; i++) n += R[u[i]] < (R[u[i + 1]] || 0) ? -R[u[i]] : R[u[i]]
    return n
  }
  return 0
}
export const numeroCap = (s) => {
  const m = /^\W*(?:cap|curso de acci[oó]n(?: propio)?)\b\.?\s*(?:n(?:[°ºo]|ro|um)?\.?\s*)?(\d+|[ivx]+)\b/i.exec(sinTildes(s))
  return m ? alNumero(m[1]) : 0
}
const numeroFase = (s) => {
  const m = /^\W*fase\s+(\d+|[ivx]+)\b/i.exec(sinTildes(s))
  return m ? alNumero(m[1]) : 0
}
// El ordinal de un «B.-», «2.-», «c.-», «IV.-».
const ordinal = (num) => {
  const x = String(num || '').replace(/[.\-–)\s]+$/g, '')
  if (/^\d+$/.test(x)) return +x
  if (/^[IVXLC]{2,}$/.test(x) || x === 'I' || x === 'V' || x === 'X') return alNumero(x)
  if (/^[A-Za-z]$/.test(x)) return x.toUpperCase().charCodeAt(0) - 64
  return 0
}

// ════════════════════════════════════════════════════════════════════════════════════
// EL DOCUMENTO ESCRITO → { campos, caps }
// ════════════════════════════════════════════════════════════════════════════════════
const ALIAS_PRE = { OBJETO: ['OBJETO'], CARTAS: ['CARTAS', 'CARTA'], CARTA: ['CARTA', 'CARTAS'], ANEXOS: ['ANEXOS', 'ANEXO'], ANEXO: ['ANEXO', 'ANEXOS'], 'APÉNDICE': ['APÉNDICE', 'APÉNDICES'], 'APÉNDICES': ['APÉNDICES', 'APÉNDICE'] }
// Si el modelo da una INSTRUCCIÓN («Estimar el número de…»), la IA suele repetirla como
// título: vale entera (v3: su primera oración) o empezada (de 8 a 4 palabras; antes, 6).
const fraseAyuda = (a) => String(a || '').split(/(?<=\.)\s+/)[0].replace(/\.$/, '')
const inicioAyuda = (a) => {
  if (!a || !/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+r\b/.test(a)) return []
  const frase = fraseAyuda(a)
  const w = frase.split(/\s+/)
  const out = [frase]
  for (let n = Math.min(w.length - 1, 8); n >= 4; n--) out.push(w.slice(0, n).join(' '))
  return [...new Set(out)]
}
function ranuras(def) {
  const S = []
  for (const p of def.preliminares || []) S.push({ tipo: 'campo', id: p.id, titulos: ALIAS_PRE[p.t] || [p.t], alias: [], nivel: -1, padre: -1, hijos: [] })
  const rec = (ns, nivel, padre) => {
    for (const n of ns) {
      if (n.caps) {
        S.push({ tipo: 'caps', titulos: [], alias: [], nivel, padre, hijos: [] })
        continue
      }
      const k = S.length
      if (n.ventajas) S.push({ tipo: 'ventajas', titulos: [n.t], alias: inicioAyuda(n.ayuda), nivel, padre, hijos: [] })
      else if (n.hijos) {
        // (v3) un apartado con texto propio y subapartados: lo que sigue a su título es su texto
        S.push({ tipo: 'grupo', id: n.id || null, titulos: [n.t], alias: inicioAyuda(n.ayuda), nivel, padre, hijos: [] })
        rec(n.hijos, nivel + 1, k)
      } else S.push({ tipo: 'campo', id: n.id, titulos: [n.t], alias: inicioAyuda(n.ayuda), instr: fraseAyuda(n.ayuda), nivel, padre, hijos: [] })
    }
  }
  rec(def.arbol || [], 0, -1)
  S.forEach((s, k) => s.padre >= 0 && S[s.padre].hijos.push(k))
  return S
}

export function leerDocumento(def, texto) {
  const S = ranuras(def)
  const R = renglones(texto)
  const porFase = def.cap?.porFase || []
  const porCap = def.cap?.porCap || []
  const out = { campos: {}, caps: [] }
  const grupoCaps = S.findIndex((s) => s.tipo === 'caps')
  const padreCaps = grupoCaps >= 0 ? S[grupoCaps].padre : -1
  let pos = 0
  let grupo = -1
  let region = null
  let cap = -1
  let fase = -1
  let destino = null
  let n = 0
  const capDe = (k) => (out.caps[k] = out.caps[k] || { nombre: '', valores: {}, fases: [], ventajas: '', desventajas: '' })
  const faseDe = (c, k) => (c.fases[k] = c.fases[k] || { nombre: '', valores: {} })
  const agregar = (t) => {
    if (!destino || !String(t || '').trim()) return
    const d = destino
    const add = (o, k) => (o[k] = o[k] ? `${o[k]}\n${t}` : t)
    if (d.campo) add(out.campos, d.campo)
    else if (d.ventaja) add(capDe(d.cap), d.ventaja)
    else if (d.porFase) add(faseDe(capDe(d.cap), d.fase).valores, d.porFase)
    else if (d.porCap) add(capDe(d.cap).valores, d.porCap)
  }
  const tit = (s) => [...(s.titulos || []), ...(s.alias || [])]
  const sinEco = (r, s) => {
    const eco = tit(s).map((t) => coincide(r, t)).find(Boolean)
    if (eco) return eco.contenido
    const w = String(s.instr || '').split(/\s+/).filter(Boolean)
    for (let n = w.length; n >= 2; n--) {
      const m = coincide(r, w.slice(0, n).join(' '), { estricto: true })
      if (m) return m.contenido
    }
    return r.resto
  }
  const buscar = (r) => {
    const probar = (k, estricto) => {
      for (const t of tit(S[k])) {
        const m = coincide(r, t, { estricto })
        if (m) return { k, m }
      }
      return null
    }
    for (let k = pos; k < S.length; k++) {
      if (S[k].tipo === 'caps') continue
      const x = probar(k, false)
      if (x) return x
    }
    if (!r.titular) return null
    for (let k = 0; k < pos && k < S.length; k++) {
      if (S[k].tipo === 'caps') continue
      const x = probar(k, true)
      if (x) return x
    }
    return null
  }
  for (const r of R) {
    // (v3) «- Ventajas: …» / «- Desventajas: …» como viñeta debajo de cada CAP
    if (r.vineta && region === 'ventajas' && cap >= 0) {
      const mv = coincide(r, 'Ventajas')
      const md = !mv && coincide(r, 'Desventajas')
      if (mv || md) {
        destino = { cap, ventaja: mv ? 'ventajas' : 'desventajas' }
        agregar((mv || md).contenido)
        n++
        continue
      }
    }
    if (!r.vineta) {
      // ── el análisis por CAP y por fase; las ventajas de cada CAP ──
      if (region === 'analisis' || region === 'ventajas') {
        const nc = numeroCap(r.resto)
        if (nc > 0) {
          cap = nc - 1
          fase = -1
          const c = capDe(cap)
          if (!c.nombre) c.nombre = r.resto.replace(/[.:]\s*$/, '').trim()
          destino = null
          continue
        }
      }
      if (region === 'analisis') {
        const nf = numeroFase(r.resto)
        if (nf > 0 && porFase.length) {
          if (cap < 0) cap = 0
          fase = nf - 1
          const f = faseDe(capDe(cap), fase)
          if (!f.nombre) f.nombre = r.resto.replace(/[.:]\s*$/, '').trim()
          destino = null
          continue
        }
        let hecho = false
        for (const x of porFase) {
          const m = coincide(r, x.t)
          if (m) {
            if (cap < 0) cap = 0
            if (fase < 0) fase = 0
            destino = { cap, fase, porFase: x.id }
            agregar(m.contenido)
            hecho = true
            break
          }
        }
        if (!hecho)
          for (const x of porCap) {
            const m = coincide(r, x.t)
            if (m) {
              if (cap < 0) cap = 0
              destino = { cap, porCap: x.id }
              agregar(m.contenido)
              hecho = true
              break
            }
          }
        if (hecho) {
          n++
          continue
        }
      }
      if (region === 'ventajas' && cap >= 0) {
        const mv = coincide(r, 'Ventajas')
        const md = !mv && coincide(r, 'Desventajas')
        if (mv || md) {
          destino = { cap, ventaja: mv ? 'ventajas' : 'desventajas' }
          agregar((mv || md).contenido)
          n++
          continue
        }
      }
      // ── un título del formato ──
      const x = buscar(r)
      if (x) {
        const s = S[x.k]
        pos = x.k + 1
        cap = -1
        fase = -1
        region = x.k === padreCaps ? 'analisis' : s.tipo === 'ventajas' ? 'ventajas' : null
        n++
        if (s.tipo === 'grupo') {
          grupo = x.k
          destino = s.id ? { campo: s.id } : null
          if (s.id) agregar(x.m.contenido)
        } else if (s.tipo === 'ventajas') {
          grupo = s.padre
          destino = null
        } else {
          grupo = s.padre
          destino = { campo: s.id }
          agregar(x.m.contenido)
        }
        continue
      }
      // ── «B.-» sin título conocido: el apartado que le toca por su orden ──
      if (r.militar && grupo >= 0) {
        const hijo = S[grupo].hijos[ordinal(r.num) - 1]
        if (hijo !== undefined && S[hijo].tipo !== 'caps') {
          const s = S[hijo]
          pos = hijo + 1
          n++
          if (s.tipo === 'campo') {
            destino = { campo: s.id }
            // (v3) si repite el título o la instrucción del modelo (aunque sea empezada:
            // «D.- Exponer las recomendaciones:»), va sólo lo que sigue
            agregar(sinEco(r, s))
          } else {
            grupo = hijo
            destino = s.tipo === 'grupo' && s.id ? { campo: s.id } : null
            region = hijo === padreCaps ? 'analisis' : s.tipo === 'ventajas' ? 'ventajas' : null
          }
          continue
        }
      }
    }
    // ── texto del apartado en curso ──
    agregar(r.vineta ? `- ${r.resto}` : r.s)
  }
  for (const k of Object.keys(out.campos)) {
    out.campos[k] = recortar(out.campos[k])
    if (!out.campos[k]) delete out.campos[k]
  }
  out.caps = Array.from(out.caps, (c) => c || { nombre: '', valores: {}, fases: [], ventajas: '', desventajas: '' }).map((c) => ({
    ...c,
    ventajas: recortar(c.ventajas),
    desventajas: recortar(c.desventajas),
    fases: Array.from(c.fases, (f) => f || { nombre: '', valores: {} }),
  }))
  const hay = Object.keys(out.campos).length || out.caps.some((c) => c.ventajas || c.desventajas || Object.values(c.valores).some(Boolean) || c.fases.some((f) => Object.values(f.valores).some(Boolean)))
  return hay ? { ...out, _titulos: n } : null
}

// La respuesta de un DOCUMENTO → { datos, como } o null.
//   como: 'json' | 'json-reparado' | 'fragmentos' | 'documento'
export function leerRespuestaDocumento(def, texto, claves = []) {
  const j = leerJSON(texto)
  if (j && esObj(j.datos) && (esObj(j.datos.campos) || Array.isArray(j.datos.caps) || claves.some((k) => k in j.datos))) return { datos: j.datos, como: j.reparado ? 'json-reparado' : 'json' }
  const f = fragmentosJSON(texto, claves)
  if (f) return { datos: { campos: f }, como: 'fragmentos' }
  const d = leerDocumento(def, texto)
  if (d) return { datos: d, como: 'documento' }
  return null
}

// ════════════════════════════════════════════════════════════════════════════════════
// LAS HOJAS DE TRABAJO DE SIEMPRE (las lee dU en el compilado)
// ════════════════════════════════════════════════════════════════════════════════════
const igualCol = (a, b) => {
  const x = norm(a)
  const y = norm(b)
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x))
}
// Palabras que la IA usa en lugar del nombre de la columna (grupos de equivalentes).
const SINONIMOS = [
  ['de donde sale', 'origen', 'fuente', 'procedencia', 'referencia', 'sale de', 'base'],
  ['quien la ejecuta', 'quien lo busca', 'responsable', 'ejecuta', 'ejecutor', 'encargado', 'organo', 'quien'],
  ['para cuando', 'plazo', 'cuando', 'fecha', 'momento', 'hora', 'hasta cuando'],
  ['por que es critico', 'por que', 'justificacion', 'importancia', 'criticidad', 'motivo', 'para que'],
  ['efecto sobre la operacion', 'efecto', 'impacto', 'consecuencia', 'incidencia'],
  ['medida de control', 'medida', 'control', 'mitigacion'],
  ['tipo', 'clase', 'categoria', 'naturaleza', 'clasificacion'],
  ['a quien va dirigido', 'a quien', 'destinatario', 'destinatarios', 'publico', 'dirigido', 'audiencia'],
  ['por que medio', 'medio', 'medios', 'canal', 'via'],
  ['curso de accion', 'cap', 'curso', 'coa'],
  ['se puede apoyar', 'apoyable', 'factible', 'factibilidad', 'puede apoyar'],
  ['tema o mensaje', 'tema', 'mensaje'],
  ['requerimiento', 'pregunta', 'rcic', 'eeia', 'necesidad'],
  ['limitacion', 'restriccion', 'prohibicion'],
]
const POCO = new Set(['sobre', 'para', 'esta', 'este', 'como', 'cada', 'desde', 'hasta', 'entre', 'tiene', 'debe', 'puede', 'cual', 'cuales', 'donde', 'quien'])
const significativas = (s) => norm(s).split(' ').filter((w) => w.length >= 4 && !POCO.has(w))
const contienePalabra = (texto, frase) => (` ${texto} `).includes(` ${frase} `)
// El rótulo que usó la IA → la columna de la hoja (o null).
export function columnaDe(rotulo, cols = []) {
  const r = norm(String(rotulo || '').replace(/\*\*|__/g, ''))
  if (!r || !cols.length) return null
  let c = cols.find((x) => norm(x) === r)
  if (c) return c
  // una contiene a la otra, como palabras enteras («Tarea 1» → «Tarea»; «N°» no es nada)
  c = cols.find((x) => {
    const n = norm(x)
    return (r.length >= 3 && contienePalabra(n, r)) || (n.length >= 3 && contienePalabra(r, n))
  })
  if (c) return c
  const corto = r.split(' ').length <= 4
  for (const g of SINONIMOS)
    if (g.some((t) => r === t || (corto && contienePalabra(r, t)))) {
      c = cols.find((x) => g.some((t) => norm(x) === t || contienePalabra(norm(x), t)))
      if (c) return c
    }
  if (!corto) return null
  const w = new Set(significativas(r))
  let mejor = null
  let puntos = 0
  for (const x of cols) {
    const p = significativas(x).filter((y) => w.has(y)).length
    if (p > puntos) (mejor = x), (puntos = p)
  }
  return mejor
}
// Un renglón con las claves de la IA → con los nombres de las columnas de la hoja.
function aColumnas(obj, cols) {
  const f = {}
  for (const [k, v] of Object.entries(obj || {})) {
    const c = columnaDe(k, cols)
    const t = typeof v === 'string' ? v.trim() : v == null ? '' : typeof v === 'object' ? '' : String(v)
    if (c && t) f[c] = f[c] ? `${f[c]}\n${t}` : t
  }
  return f
}
const conDatos = (filas) => {
  const xs = (filas || []).filter((f) => f && Object.values(f).some((x) => String(x || '').trim()))
  return xs.length ? xs : null
}

function tablaMarkdown(texto, cols = []) {
  const ls = String(texto || '').replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim())
  const celdas = (l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.replace(/\*\*|__/g, '').trim())
  for (let i = 0; i + 1 < ls.length; i++) {
    if (!ls[i].includes('|') || !/^\|?\s*:?-{2,}/.test(ls[i + 1])) continue
    const cab = celdas(ls[i])
    const mapa = cab.map((h) => columnaDe(h, cols))
    if (!mapa.some(Boolean)) continue
    const filas = []
    for (let j = i + 2; j < ls.length && ls[j].includes('|'); j++) {
      const cs = celdas(ls[j])
      const f = {}
      cs.forEach((v, k) => mapa[k] && v && v !== '-' && (f[mapa[k]] = v.replace(/<br\s*\/?>/gi, '\n')))
      if (Object.keys(f).length) filas.push(f)
    }
    if (filas.length) return filas
  }
  return null
}
// La tabla copiada de la PANTALLA de la IA (ChatGPT, Gemini, Claude): celdas separadas por
// tabuladores, la cabecera en el primer renglón.
function tablaTabulada(texto, cols = []) {
  const ls = String(texto || '').replace(/\r\n?/g, '\n').split('\n').filter((l) => l.includes('\t'))
  if (!ls.length || !cols.length) return null
  const celdas = (l) => l.split('\t').map((c) => c.replace(/\*\*|__/g, '').trim())
  let mapa = null
  let desde = 0
  for (let i = 0; i < ls.length && !mapa; i++) {
    const m = celdas(ls[i]).map((h) => (h.length <= 60 ? columnaDe(h, cols) : null))
    if (m.filter(Boolean).length >= Math.min(2, cols.length)) (mapa = m), (desde = i + 1)
  }
  if (!mapa) {
    // sin cabecera: por el orden, si los renglones tienen tantas celdas como columnas
    if (!ls.every((l) => celdas(l).length >= Math.min(2, cols.length))) return null
    mapa = cols
    desde = 0
  }
  const filas = ls.slice(desde).map((l) => {
    const f = {}
    celdas(l).forEach((v, k) => {
      const c = mapa[k] || (k >= mapa.length ? mapa[mapa.length - 1] : null)
      if (c && v && v !== '-') f[c] = f[c] ? `${f[c]} ${v}` : v
    })
    return f
  })
  return conDatos(filas)
}
// Cada { … } suelto que se pueda leer (un JSON cortado por el largo, o varios objetos).
function objetosJSON(texto, cols = []) {
  const s = String(texto || '')
  const out = []
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '{') continue
    let prof = 0
    let en = false
    let esc = false
    for (let j = i; j < s.length; j++) {
      const ch = s[j]
      if (en) {
        if (esc) esc = false
        else if (ch === '\\') esc = true
        else if (ch === '"' || ch === '”') en = false
        continue
      }
      if (ch === '"' || ch === '“') en = true
      else if (ch === '{') prof++
      else if (ch === '}' && --prof === 0) {
        const j2 = leerJSON(s.slice(i, j + 1))
        if (j2 && j2.datos && typeof j2.datos === 'object' && !Array.isArray(j2.datos)) {
          const f = aColumnas(j2.datos, cols)
          if (Object.keys(f).length) {
            out.push(f)
            i = j
          }
        }
        break
      }
    }
  }
  return conDatos(out)
}
// «Tareas específicas», «Restricciones»…: el título dice el TIPO de lo que sigue.
const TIPOS = [
  [/\bespecific/, 'Específica'],
  [/\bimplicit/, 'Implícita'],
  [/\besencial/, 'Esencial'],
  [/\brestricci/, 'Restricción'],
  [/\bprohibici/, 'Prohibición'],
]
const tipoDe = (s) => (TIPOS.find(([re]) => re.test(norm(s))) || [])[1] || ''
const colTipo = (cols) => cols.find((c) => norm(c) === 'tipo') || null
const RELLENO = /^(claro|aca|aqui|a continuacion|te dejo|listo|espero|perfecto|por supuesto|de acuerdo|nota|notas|observacion|observaciones|resumen|en resumen|si queres|si quieres|lo siento|no puedo|disculp)/
// «Rótulo: valor» dentro de un texto, con el rótulo de una columna de la hoja.
function rotulados(texto, cols) {
  const s = String(texto || '')
  const re = /(^|[\s(;,.—–|]|\s-\s)([A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿?][A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿? ]{1,40}?)\s*:\s+/g
  const marcas = []
  let m
  while ((m = re.exec(s))) {
    const c = columnaDe(m[2], cols)
    if (c) marcas.push({ c, desde: m.index + m[1].length, valor: m.index + m[0].length })
  }
  if (!marcas.length) return null
  const f = {}
  const antes = s.slice(0, marcas[0].desde).replace(/[\s(—–|-]+$/, '').trim()
  if (antes && !marcas.some((x) => x.c === cols[0])) f[cols[0]] = antes
  marcas.forEach((x, k) => {
    const v = s.slice(x.valor, k + 1 < marcas.length ? marcas[k + 1].desde : s.length).replace(/^[\s)]+|[\s(;,—–|-]+$/g, '').replace(/\)\s*$/, '').trim()
    if (v) f[x.c] = f[x.c] ? `${f[x.c]} ${v}` : v
  })
  return f
}
// « — », « – », « | », « - » separan columnas, pero no dentro de un paréntesis ni en
// «SIN DATO — verificar».
function partirFuera(t) {
  const s = String(t || '').replace(/SIN DATO\s*[—–-]\s*verificar/gi, (x) => x.replace(/[—–-]/, '\u0001'))
  const out = []
  let desde = 0
  const re = /\s+(?:—|–|\|)\s+|\s+-\s+/g
  let m
  while ((m = re.exec(s))) {
    const antes = s.slice(0, m.index)
    if ((antes.match(/\(/g) || []).length > (antes.match(/\)/g) || []).length) continue
    out.push(s.slice(desde, m.index))
    desde = m.index + m[0].length
  }
  out.push(s.slice(desde))
  return out.map((x) => x.replace(/\u0001/g, '—').trim()).filter(Boolean)
}
// Un renglón escrito en una línea: rótulos, o columnas separadas por « — », « | »… El
// TIPO puede venir del título que agrupa (tipo0) o entre paréntesis («(Implícita)»): entonces
// las demás partes van a las otras columnas.
function renglonDe(texto, cols, tipo0 = '') {
  let t = String(texto || '').replace(/\*\*|__/g, '').trim()
  const ct = colTipo(cols)
  let tipo = ct ? tipo0 : ''
  if (ct) {
    const m = /\s*\(\s*([^()]{3,24}?)\s*\)\s*/.exec(t)
    if (m && m[1].split(/\s+/).length <= 2 && tipoDe(m[1])) {
      tipo = tipoDe(m[1])
      t = `${t.slice(0, m.index)} ${t.slice(m.index + m[0].length)}`.replace(/\s+([.,;:])/g, '$1').trim()
    }
  }
  const libres = tipo ? cols.filter((c) => c !== ct) : cols
  const r = rotulados(t, cols)
  if (r && Object.keys(r).length >= 2) {
    if (tipo && !r[ct]) r[ct] = tipo
    return r
  }
  let partes = partirFuera(t)
  // un párrafo de prosa (más de una oración antes del primer « — ») no se parte
  if (partes.length > 1 && (partes[0].match(/[.!?](\s|$)/g) || []).length > 1) partes = [t]
  if (partes.length === 1) {
    // «Evacuar X (Orden N° 3 — G-5)»
    const m = /^(.*?)\s*\(([^()]*(?:—|–|\||;)[^()]*)\)\s*[.:]?\s*(.*)$/.exec(t)
    if (m) partes = [`${m[1]}${m[3] ? ` ${m[3]}` : ''}`.trim(), ...m[2].split(/\s*(?:—|–|\||;)\s*/).filter(Boolean)]
  }
  const f = {}
  partes.forEach((p, k) => {
    const c = libres[Math.min(k, libres.length - 1)]
    f[c] = f[c] ? `${f[c]} — ${p}` : p
  })
  if (r) for (const [c, v] of Object.entries(r)) if (c !== cols[0] || !f[c]) f[c] = v
  if (tipo && !f[ct]) f[ct] = tipo
  return f
}
// Renglones ROTULADOS, uno debajo del otro («**Tarea:** …», «- Tipo: Implícita»…). Un
// título numerado o en negrita sin rótulo, antes de los rótulos, es la primera columna.
function filasRotuladas(texto, cols = []) {
  const R = renglones(texto)
  const filas = []
  let cur = null
  let ultimo = null
  let titulo = null
  let tipo = ''
  let rotulos = 0
  const ct = colTipo(cols)
  const cierra = () => {
    if (cur && ct && !cur[ct] && tipo) cur[ct] = tipo
  }
  for (const r of R) {
    const txt = r.resto.replace(/\*\*|__/g, '').trim()
    const m = /^([^:.]{1,60}?)\s*:\s*(.*)$/.exec(txt)
    const c = m && m[1].trim().split(/\s+/).length <= 5 ? columnaDe(m[1], cols) : null
    if (c) {
      rotulos++
      if (!cur || String(cur[c] || '').trim()) {
        cierra()
        cur = {}
        filas.push(cur)
        if (titulo && c !== cols[0]) cur[cols[0]] = titulo
      }
      titulo = null
      cur[c] = m[2].trim()
      ultimo = c
      continue
    }
    const t = tipoDe(txt)
    if ((r.md || r.negrita) && t && txt.split(' ').length <= 5) {
      cierra()
      tipo = t
      cur = null
      titulo = null
      continue
    }
    if (r.titular && !r.vineta && !/:\s*$/.test(txt)) {
      cierra()
      cur = null
      titulo = txt.replace(/^(?:tarea|renglon|fila|item)\s*(?:n[°º.]?\s*)?\d*\s*[.:—–-]?\s*/i, '').replace(/[.:]\s*$/, '').trim() || null
      continue
    }
    if (cur && ultimo) cur[ultimo] = `${cur[ultimo]}${cur[ultimo] ? '\n' : ''}${r.vineta ? `- ${r.resto}` : txt}`
  }
  cierra()
  return rotulos >= 2 ? conDatos(filas) : null
}
// Una LISTA (numerada o con viñetas): cada ítem es un renglón; lo que sigue debajo de un
// ítem sin ser otro ítem es parte de él.
function filasLista(texto, cols = []) {
  const R = renglones(texto)
  const items = []
  let tipo = ''
  let cur = null
  for (const r of R) {
    const txt = r.resto.replace(/\*\*|__/g, '').trim()
    const t = tipoDe(txt)
    if (!r.vineta && !/^\d/.test(r.num || '') && (r.md || r.negrita || /:\s*$/.test(txt)) && t && txt.split(' ').length <= 6) {
      tipo = t
      cur = null
      continue
    }
    if (r.vineta || /^\d/.test(r.num || '')) {
      cur = { texto: txt, tipo }
      items.push(cur)
    } else if (cur && !r.md) cur.texto += ` ${txt}`
    else cur = null
  }
  if (!items.length) return null
  return conDatos(items.map((it) => renglonDe(it.texto, cols, it.tipo)))
}
// Último recurso: cada PÁRRAFO con contenido es un renglón (sin saludos ni notas).
function filasParrafos(texto, cols = []) {
  const ps = String(texto || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^#+\s*/gm, '').replace(/\*\*|__/g, '').replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p.split(/\s+/).length >= 6 && !RELLENO.test(norm(p)) && !/:\s*$/.test(p))
  return conDatos(ps.map((p) => renglonDe(p, cols)))
}

function dosListas(texto, cols = []) {
  const clave = (c) => norm(c).split(' ').find((w) => w.length > 3) || norm(c)
  const ks = [clave(cols[0] || 'hechos'), clave(cols[1] || 'suposiciones')]
  const raiz = (k) => k.replace(/(es|s)$/, '')
  const out = { a: [], b: [] }
  let lado = null
  for (const r of renglones(texto)) {
    const nr = norm(r.resto)
    // «- HECHO: …» / «Suposición: …» en el mismo renglón
    const pre = ks.findIndex((k) => new RegExp(`^${raiz(k)}(es|s)?\\s*\\d*\\s*$`).test(norm(r.resto.split(':')[0])) && r.resto.includes(':'))
    const resto = r.resto.slice(r.resto.indexOf(':') + 1).trim()
    if (pre >= 0 && resto) {
      out[pre ? 'b' : 'a'].push(resto.replace(/\*\*|__/g, '').trim())
      continue
    }
    const cab = ks.findIndex((k) => nr.startsWith(k) || (r.titular && nr.includes(k) && nr.split(' ').length <= 6))
    if (cab >= 0 && (r.titular || nr.split(' ').length <= 4)) {
      lado = cab ? 'b' : 'a'
      const m = r.resto.match(/^[^:]*:\s*(.+)$/)
      if (m && m[1].trim()) out[lado].push(m[1].trim())
      continue
    }
    if (lado && (r.vineta || r.num)) out[lado].push(r.resto)
  }
  if (!out.a.length && !out.b.length) {
    // la tabla de dos columnas (Markdown o copiada de la pantalla)
    const t = tablaMarkdown(texto, cols) || tablaTabulada(texto, cols)
    if (t) for (const f of t) for (const [k, lado2] of [[cols[0], 'a'], [cols[1], 'b']]) if (f[k]) out[lado2].push(f[k])
  }
  return out.a.length || out.b.length ? out : null
}
function casillas(texto, claves = []) {
  const ts = claves.filter((c) => !c.tipo || c.tipo === 'texto')
  if (!ts.length) return null
  const out = {}
  let cur = null
  // «Casilla<TAB>texto» (copiado de la pantalla) se lee como «Casilla: texto»
  const limpio = String(texto || '').replace(/^([^\t\n]{2,120})\t+/gm, '$1: ')
  for (const r of renglones(limpio)) {
    let hecho = false
    if (!r.vineta)
      for (const c of ts) {
        const m = coincide(r, c.k) || (c.rot && c.rot !== c.k ? coincide(r, c.rot) : null)
        if (m) {
          cur = c.k
          if (m.contenido) out[cur] = out[cur] ? `${out[cur]}\n${m.contenido}` : m.contenido
          hecho = true
          break
        }
      }
    if (!hecho && cur) out[cur] = out[cur] ? `${out[cur]}\n${r.vineta ? `- ${r.resto}` : r.s}` : r.vineta ? `- ${r.resto}` : r.s
  }
  if (!Object.keys(out).length) {
    // la tabla «Casilla | Texto» en Markdown
    const ls = String(texto || '').split('\n').filter((l) => /\|/.test(l) && !/^\s*\|?\s*:?-{2,}/.test(l))
    for (const l of ls) {
      const cs = l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.replace(/\*\*|__/g, '').trim())
      if (cs.length < 2) continue
      const c = ts.find((x) => norm(x.k) === norm(cs[0]) || norm(x.rot) === norm(cs[0]))
      if (c && cs.slice(1).join(' ').trim()) out[c.k] = cs.slice(1).join(' ').trim()
    }
  }
  for (const k of Object.keys(out)) if (!(out[k] = recortar(out[k]))) delete out[k]
  return Object.keys(out).length ? out : null
}
// ════════════════════════════════════════════════════════════════════════════════════
// v5 (06-10-2026) — LAS HOJAS DE TIPO «tabla» (filas FIJAS × columnas), como la F3·P1
// Potencia Relativa de Combate del G-3. La Mesa las guarda como casillas: la primera
// columna de datos con la clave de la fila («MANIOBRA») y las demás «FILA|Columna»
// («MANIOBRA|Deducciones»). La IA las devuelve como le sale: la tabla de Markdown con la
// cabecera, la tabla copiada de la pantalla, un título por fila con «Columna: …» debajo,
// un JSON por fila ({ "MANIOBRA": { "enemigas": "…" } }) o una lista de renglones. Antes
// esto terminaba en «No se reconoció la respuesta» o con todas las columnas en la primera.
// ════════════════════════════════════════════════════════════════════════════════════
export const claveTabla = (hoja, fila, col) => ((hoja?.cols || []).indexOf(col) === 1 ? fila : `${fila}|${col}`)
const raizPalabra = (w) => w.replace(/(es|s)$/, '')
const palabrasDe = (s) =>
  norm(String(s || '').replace(/\([^)]*\)/g, ' '))
    .split(' ')
    .filter((w) => w.length >= 3 && !['las', 'los', 'del', 'por', 'con', 'una', 'para'].includes(w))
    .map(raizPalabra)
// La fila de la hoja que nombra el texto («Fuegos» → POTENCIA DE FUEGO; «Inteligencia» →
// INFORMACIÓN E INTELIGENCIA; «Potencia relativa de combate» → ninguna).
export function filaDeTabla(texto, filas = []) {
  const t = norm(String(texto || '').replace(/\*\*|__/g, '').replace(/^\s*(?:\d+|[ivx]+|[a-z])\s*[.)\-–]+\s*/i, ''))
  if (!t) return null
  const exacta = filas.find((f) => norm(f) === t)
  if (exacta) return exacta
  const w = palabrasDe(t)
  if (!w.length || w.length > 7) return null
  let mejor = null
  let puntos = 0
  let empate = false
  for (const f of filas) {
    const fw = palabrasDe(f)
    if (!fw.length) continue
    const comunes = fw.filter((x) => w.includes(x)).length
    if (!comunes) continue
    if (comunes < fw.length && w.some((x) => !fw.includes(x))) continue
    if (comunes > puntos) (mejor = f), (puntos = comunes), (empate = false)
    else if (comunes === puntos) empate = true
  }
  return empate ? null : mejor
}
// La columna de la hoja que nombra el rótulo («Enemigo» → «Fuerzas enemigas», «TTP» →
// «Tácticas, técnicas y procedimientos (TTP.)», «Deducción» → «Deducciones»).
export function columnaDeTabla(rotulo, cols = []) {
  const r = String(rotulo || '').replace(/\*\*|__/g, '').trim()
  if (!r || r.length > 70) return null
  const c = columnaDe(r, cols)
  if (c) return c
  const pre = (s) => palabrasDe(s).filter((w) => w.length >= 4).map((w) => w.slice(0, 5))
  const w = pre(r)
  if (!w.length) return null
  let mejor = null
  let puntos = 0
  for (const x of cols) {
    const p = pre(x).filter((y) => w.includes(y)).length
    if (p > puntos) (mejor = x), (puntos = p)
  }
  return mejor
}
const textoCelda = (v) =>
  (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x == null ? '' : String(x))).join('\n') : typeof v === 'string' ? v : v == null || typeof v === 'object' ? '' : String(v))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
const sumar = (out, k, v) => {
  const t = textoCelda(v)
  if (!t || /^[-—–]$/.test(t)) return
  out[k] = out[k] ? `${out[k]}\n${t}` : t
}
// El JSON de una hoja «tabla», con la forma que venga → las casillas de la Mesa. A una hoja
// que no es «tabla» no la toca.
export function normalizarTabla(g, hoja = {}) {
  if (hoja?.tipo !== 'tabla' || !g || typeof g !== 'object') return g
  const filas = hoja.filas || []
  const cols = hoja.cols || []
  const datos = cols.slice(1)
  const claves = new Set(filas.flatMap((f) => datos.map((c) => claveTabla(hoja, f, c))))
  const out = {}
  const renglon = (fila, obj) => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (columnaDeTabla(k, [cols[0]]) === cols[0] && !columnaDeTabla(k, datos)) continue
      const c = columnaDeTabla(k, datos)
      if (c) sumar(out, claveTabla(hoja, fila, c), v)
    }
  }
  const filaDelRenglon = (obj) => {
    for (const [k, v] of Object.entries(obj || {}))
      if (typeof v === 'string' && (columnaDeTabla(k, cols) === cols[0] || /^(fila|sistema|elemento|dinamica|factor|potencia)$/.test(norm(k)))) {
        const f = filaDeTabla(v, filas)
        if (f) return f
      }
    return null
  }
  const lista = Array.isArray(g) ? g : Array.isArray(g.filas) ? g.filas : null
  if (lista) {
    for (const o of lista) if (esObj(o)) {
      const f = filaDelRenglon(o)
      if (f) renglon(f, o)
    }
    return Object.keys(out).length ? out : g
  }
  for (const [k, v] of Object.entries(g)) {
    const f = filaDeTabla(k, filas)
    // { "MANIOBRA": { "enemigas": … } } antes que «MANIOBRA» como casilla
    if (f && esObj(v)) {
      renglon(f, v)
      continue
    }
    if (claves.has(k)) {
      sumar(out, k, v)
      continue
    }
    // «MANIOBRA|Deducciones», «Maniobra — Deducciones», «MANIOBRA · TTP» (antes que la fila
    // sola: «Información e inteligencia — TTP» también nombra la fila entera)
    const m = /^(.*?)\s*(?:\||—|–|·|›|>|:|\/)\s*(.+)$/.exec(k)
    const f2 = m && filaDeTabla(m[1], filas)
    const c2 = f2 && columnaDeTabla(m[2], datos)
    if (f2 && c2) sumar(out, claveTabla(hoja, f2, c2), v)
    else if (f && (typeof v === 'string' || Array.isArray(v))) sumar(out, claveTabla(hoja, f, datos[0]), v)
    else out[k] = v
  }
  return out
}
// La hoja «tabla» ESCRITA (sin JSON): la tabla de Markdown, la copiada de la pantalla (con
// tabuladores) o un título por fila con «Columna: …» y sus renglones debajo.
export function leerTablaHoja(texto, hoja = {}) {
  if (hoja?.tipo !== 'tabla') return null
  return tablaMarkdownFilas(texto, hoja) || tablaTabuladaFilas(texto, hoja) || tablaPorTitulos(texto, hoja)
}
function mapaCabecera(celdas, hoja) {
  const cols = hoja.cols || []
  const m = celdas.map((h, k) => {
    const c = columnaDeTabla(h, cols.slice(1))
    if (c && !(k === 0 && columnaDeTabla(h, [cols[0]]))) return c
    return columnaDeTabla(h, [cols[0]]) || k === 0 ? cols[0] : null // (el rótulo de la fila)
  })
  return m.filter((c) => c && c !== cols[0]).length ? m : null
}
function filasConMapa(renglonesCeldas, mapa, hoja) {
  const out = {}
  const i0 = Math.max(0, mapa.indexOf((hoja.cols || [])[0]))
  for (const cs of renglonesCeldas) {
    const f = filaDeTabla(cs[i0], hoja.filas || [])
    if (!f) continue
    cs.forEach((v, k) => mapa[k] && mapa[k] !== hoja.cols[0] && sumar(out, claveTabla(hoja, f, mapa[k]), v))
  }
  return Object.keys(out).length ? out : null
}
function tablaMarkdownFilas(texto, hoja) {
  const ls = String(texto || '').replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim())
  const celdas = (l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.replace(/\*\*|__/g, '').trim())
  for (let i = 0; i + 1 < ls.length; i++) {
    if (!ls[i].includes('|') || !/^\|?\s*:?-{2,}/.test(ls[i + 1])) continue
    const mapa = mapaCabecera(celdas(ls[i]), hoja)
    if (!mapa) continue
    const rs = []
    for (let j = i + 2; j < ls.length && ls[j].includes('|'); j++) rs.push(celdas(ls[j]))
    const r = filasConMapa(rs, mapa, hoja)
    if (r) return r
  }
  return null
}
// Copiada de la pantalla: cada renglón de la tabla con tabuladores entre celdas. Si una celda
// tenía varios renglones, lo que sigue sin tabuladores es parte de la última celda.
function tablaTabuladaFilas(texto, hoja) {
  const ls = String(texto || '').replace(/\r\n?/g, '\n').split('\n')
  if (!ls.some((l) => l.includes('\t'))) return null
  const celdas = (l) => l.split('\t').map((c) => c.replace(/\*\*|__/g, '').trim())
  let mapa = null
  const rs = []
  for (const l of ls) {
    if (!l.trim()) continue
    if (!l.includes('\t')) {
      if (rs.length) rs[rs.length - 1][rs[rs.length - 1].length - 1] += `\n${l.trim()}`
      continue
    }
    const cs = celdas(l)
    if (!mapa) {
      const m = mapaCabecera(cs, hoja)
      if (m && m.filter(Boolean).length >= 3) {
        mapa = m
        continue
      }
    }
    if (filaDeTabla(cs[0], hoja.filas || [])) rs.push(cs)
    else if (rs.length) {
      const u = rs[rs.length - 1]
      u[u.length - 1] += `\n${cs[0]}`
      u.push(...cs.slice(1))
    }
  }
  if (!rs.length) return null
  return filasConMapa(rs, mapa || hoja.cols, hoja)
}
function tablaPorTitulos(texto, hoja) {
  const cols = hoja.cols || []
  const datos = cols.slice(1)
  const out = {}
  let fila = null
  let col = null
  let n = 0
  for (const raw of String(texto || '').replace(/\r\n?/g, '\n').split('\n')) {
    const s = raw.replace(/^\s{0,3}#{1,6}\s*/, '').replace(/^\s*>\s?/, '').replace(/\*\*|__/g, '').trim()
    if (!s) continue
    const corto = s.replace(/[:.]\s*$/, '')
    // un título: con #, en negrita, numerado, con «:» al final, en MAYÚSCULAS, o el nombre
    // exacto de la fila (así «Liderazgo enemigo rígido», dentro de una celda, no cambia de fila)
    const titulo =
      /^\s{0,3}#{1,6}\s/.test(raw) || /^\s*(\*\*|__)/.test(raw) || /^(?:\d+|[IVX]+|[a-zA-Z])\s*[.)\-–]/.test(s) || /:\s*$/.test(s) || (corto === corto.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(corto)) || (hoja.filas || []).some((x) => norm(x) === norm(corto))
    const f = titulo && !/^[+\-−–•*]/.test(s) && corto.split(/\s+/).length <= 6 ? filaDeTabla(corto, hoja.filas || []) : null
    if (f) {
      fila = f
      col = null
      continue
    }
    const m = /^(?:[-•*]\s+)?([^:]{2,70}?)\s*:\s*(.*)$/.exec(s)
    const c = m && m[1].split(/\s+/).length <= 7 ? columnaDeTabla(m[1], datos) : null
    if (fila && c) {
      col = c
      n++
      if (m[2].trim()) sumar(out, claveTabla(hoja, fila, col), m[2])
      continue
    }
    // en DEDUCCIONES y TTP no hay «+»/«-»: la viñeta es sólo viñeta
    if (fila && col) sumar(out, claveTabla(hoja, fila, col), datos.indexOf(col) >= 2 ? s.replace(/^[-•*]\s+/, '') : s.replace(/^[•*]\s+/, '- '))
  }
  return n >= 2 && Object.keys(out).length ? out : null
}

// Lo que dU del compilado no pudo leer como JSON. `forma` = KS(hoja): { forma, claves, cols }.
export function rescatarHoja(texto, hoja = {}, forma = {}) {
  const j = leerJSON(texto)
  if (j) return j.datos
  const f = forma?.forma
  const cols = hoja?.cols || forma?.cols || []
  if (f === 'filas') return tablaMarkdown(texto, cols) || objetosJSON(texto, cols) || tablaTabulada(texto, cols) || filasRotuladas(texto, cols) || filasLista(texto, cols) || filasParrafos(texto, cols)
  if (f === 'dosListas') return dosListas(texto, cols)
  if (f === 'objeto' && hoja?.tipo === 'tabla') return leerTablaHoja(texto, hoja) || casillas(texto, forma.claves || [])
  if (f === 'objeto') return casillas(texto, forma.claves || [])
  return null
}

// ─── El JSON que SÍ se leyó pero con otra forma (los llama dU del compilado) ─────────
// Los renglones: la lista, o { "filas": […] }, o { "tareas": […] } (la primera lista de
// objetos), o un solo renglón suelto.
export function filasDe(g) {
  if (Array.isArray(g)) return g
  if (!esObj(g)) return null
  if (Array.isArray(g.filas)) return g.filas
  for (const v of Object.values(g)) if (Array.isArray(v) && v.some(esObj)) return v
  return Object.values(g).some((v) => typeof v === 'string') ? [g] : null
}
// La celda de una columna aunque la clave venga sin tildes, en minúsculas o con otro nombre.
export function celdaFila(fila, col) {
  if (!esObj(fila)) return ''
  if (fila[col] != null) return fila[col]
  const n = norm(col)
  for (const [k, v] of Object.entries(fila)) if (norm(k) === n) return v
  for (const [k, v] of Object.entries(fila)) if (columnaDe(k, [col]) === col && !Object.keys(fila).some((x) => norm(x) === norm(k) && x !== k)) return v
  return ''
}
// Las dos listas: { a, b }, o con los nombres de las columnas («hechos», «suposiciones»).
export function listasDe(g, cols = []) {
  if (!esObj(g)) return { a: [], b: [] }
  const lista = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map((x) => (typeof x === 'string' ? x.replace(/^[-•·*]\s+/, '') : '')).filter((x) => x.trim())
  const out = { a: lista(g.a || g.A), b: lista(g.b || g.B) }
  if (out.a.length || out.b.length) return out
  const clave = (c) => norm(c).split(' ').find((w) => w.length > 3) || norm(c)
  const ks = [clave(cols[0] || 'hechos'), clave(cols[1] || 'suposiciones')].map((k) => k.replace(/(es|s)$/, ''))
  for (const [k, v] of Object.entries(g)) {
    const nk = norm(k)
    if (nk.startsWith(ks[0])) out.a.push(...lista(v))
    else if (nk.startsWith(ks[1])) out.b.push(...lista(v))
  }
  return out
}
// La casilla aunque la clave venga sin tildes o con el rótulo largo.
export function claveCasilla(k, claves = []) {
  const n = norm(k)
  if (!n) return undefined
  const c = claves.find((x) => norm(x.k) === n || norm(x.rot) === n)
  if (c) return c.k
  const cs = claves.filter((x) => norm(x.k).includes(n) || n.includes(norm(x.k)))
  return cs.length === 1 ? cs[0].k : undefined
}
