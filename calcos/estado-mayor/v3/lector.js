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
function tablaMarkdown(texto, cols = []) {
  const ls = String(texto || '').replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim())
  const celdas = (l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.replace(/\*\*|__/g, '').trim())
  for (let i = 0; i + 1 < ls.length; i++) {
    if (!ls[i].includes('|') || !/^\|?\s*:?-{2,}/.test(ls[i + 1])) continue
    const cab = celdas(ls[i])
    const mapa = cab.map((h) => cols.find((c) => igualCol(c, h)) || null)
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
function dosListas(texto, cols = []) {
  const clave = (c) => norm(c).split(' ').find((w) => w.length > 3) || norm(c)
  const ks = [clave(cols[0] || 'hechos'), clave(cols[1] || 'suposiciones')]
  const out = { a: [], b: [] }
  let lado = null
  for (const r of renglones(texto)) {
    const nr = norm(r.resto)
    const cab = ks.findIndex((k) => nr.startsWith(k) || (r.titular && nr.includes(k) && nr.split(' ').length <= 6))
    if (cab >= 0 && (r.titular || nr.split(' ').length <= 4)) {
      lado = cab ? 'b' : 'a'
      const m = r.resto.match(/^[^:]*:\s*(.+)$/)
      if (m && m[1].trim()) out[lado].push(m[1].trim())
      continue
    }
    if (lado && (r.vineta || r.num)) out[lado].push(r.resto)
  }
  return out.a.length || out.b.length ? out : null
}
function casillas(texto, claves = []) {
  const ts = claves.filter((c) => !c.tipo || c.tipo === 'texto')
  if (!ts.length) return null
  const out = {}
  let cur = null
  for (const r of renglones(texto)) {
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
  for (const k of Object.keys(out)) if (!(out[k] = recortar(out[k]))) delete out[k]
  return Object.keys(out).length ? out : null
}
// Lo que dU del compilado no pudo leer como JSON. `forma` = KS(hoja): { forma, claves, cols }.
export function rescatarHoja(texto, hoja = {}, forma = {}) {
  const j = leerJSON(texto)
  if (j) return j.datos
  const f = forma?.forma
  if (f === 'filas') return tablaMarkdown(texto, hoja?.cols || forma.cols || [])
  if (f === 'dosListas') return dosListas(texto, hoja?.cols || forma.cols || [])
  if (f === 'objeto') return casillas(texto, forma.claves || [])
  return null
}
