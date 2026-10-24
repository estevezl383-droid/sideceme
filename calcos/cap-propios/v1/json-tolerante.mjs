// 🧩 Leer el JSON que contesta una IA aunque venga con los errores de siempre. Sin dependencias.
//
// Sergio, 24-10-2026, pegó la respuesta de la IA en «🤖 La IA desarrolla los dos CAP EN LA CARTA» y la Mesa le dijo «No se
// reconoció la respuesta». Las IA (ChatGPT, Gemini, Claude) escriben a menudo un JSON que JSON.parse rechaza:
//   · comillas rectas DENTRO de un texto: "unidad": "GAAP N° 4 "MIRAFLORES"" (la designación copiada tal cual);
//   · una coma de más antes de } o ]; comentarios // o /* */; saltos de línea o tabulaciones crudos dentro de un texto;
//   · comillas tipográficas “ ” en lugar de " ; espacios duros; texto antes y después; varios bloques ```json;
//   · la respuesta CORTADA (se acabó el largo de la respuesta): faltan las llaves del final.
// `leerJSON(texto)` prueba, en orden, cada bloque ```json, cada objeto {…} balanceado (el más largo primero) y el texto
// entero; a cada uno, tal cual, reparado y reparado + cerrado. Devuelve { ok, valor, reparado, cortado } o
// { ok:false, error } con el lugar donde se rompe.

// Los candidatos: los bloques ``` y los objetos/listas balanceados (respetando los textos entre comillas).
function candidatos(t) {
  const out = []
  for (const m of t.matchAll(/```[a-zA-Z]*\s*\n?([\s\S]*?)```/g)) if (m[1].trim()) out.push(m[1])
  // Un bloque ``` que no se cerró (respuesta cortada).
  const ab = t.lastIndexOf('```')
  if ((t.match(/```/g) || []).length % 2 === 1 && ab >= 0) out.push(t.slice(ab + 3).replace(/^[a-zA-Z]*\s*\n?/, ''))
  const objs = []
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== '{' && t[i] !== '[') continue
    let prof = 0
    let enTexto = false
    let j = i
    for (; j < t.length; j++) {
      const c = t[j]
      if (enTexto) {
        if (c === '\\') j++
        else if (c === '"') enTexto = false
        continue
      }
      if (c === '"') enTexto = true
      else if (c === '{' || c === '[') prof++
      else if (c === '}' || c === ']') {
        prof--
        if (prof === 0) break
      }
    }
    objs.push(t.slice(i, j + 1))
    if (j >= t.length - 1) break
    i = j
  }
  out.push(...objs.sort((a, b) => b.length - a.length))
  const i = t.search(/[{[]/)
  if (i >= 0) out.push(t.slice(i))
  return [...new Set(out)]
}

const FIN_TEXTO = /^\s*(?:[,}\]:]|$)/
// Arregla lo que se puede arreglar sin adivinar el contenido.
export function reparar(s) {
  let t = String(s).replace(/^﻿/, '').replace(/ /g, ' ')
  // Comillas tipográficas como delimitadores (si no hay ninguna recta).
  if (!/"/.test(t) && /[“”]/.test(t)) t = t.replace(/[“”]/g, '"')
  let out = ''
  let enTexto = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (enTexto) {
      if (c === '\\') {
        out += c + (t[i + 1] ?? '')
        i++
      } else if (c === '"') {
        // ¿Cierra el texto o es una comilla de adentro? Cierra si después viene , } ] : o el final.
        if (FIN_TEXTO.test(t.slice(i + 1, i + 40))) {
          enTexto = false
          out += c
        } else out += '\\"'
      } else if (c === '\n') out += '\\n'
      else if (c === '\r') out += ''
      else if (c === '\t') out += '\\t'
      else out += c
      continue
    }
    if (c === '"') {
      enTexto = true
      out += c
    } else if (c === '/' && t[i + 1] === '/') {
      while (i < t.length && t[i] !== '\n') i++
      out += '\n'
    } else if (c === '/' && t[i + 1] === '*') {
      const k = t.indexOf('*/', i + 2)
      i = k < 0 ? t.length : k + 1
    } else out += c
  }
  // Comas de más antes de } o ].
  return out.replace(/,(\s*[}\]])/g, '$1')
}

// Cierra lo que quedó abierto (respuesta cortada): el texto, la coma colgando y las llaves.
export function cerrar(s) {
  const pila = []
  let enTexto = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (enTexto) {
      if (c === '\\') i++
      else if (c === '"') enTexto = false
      continue
    }
    if (c === '"') enTexto = true
    else if (c === '{' || c === '[') pila.push(c === '{' ? '}' : ']')
    else if (c === '}' || c === ']') pila.pop()
  }
  let t = s
  if (enTexto) t += '"'
  // Lo último que quedó a medias: «"clave":» sin valor, una clave suelta o una coma.
  t = t.replace(/,\s*"[^"]*"\s*:\s*$/, '').replace(/,\s*"[^"]*"\s*$/, '').replace(/[,:]\s*$/, '')
  if (/"\s*:\s*$/.test(t)) t += 'null'
  return t + pila.reverse().join('')
}

function intentar(c) {
  try {
    return { valor: JSON.parse(c), reparado: false, cortado: false }
  } catch {}
  const r = reparar(c)
  try {
    return { valor: JSON.parse(r), reparado: true, cortado: false }
  } catch {}
  try {
    return { valor: JSON.parse(cerrar(r)), reparado: true, cortado: true }
  } catch {}
  return null
}

// `quiero(v)`: si se dan, gana el primer candidato que la cumpla (p. ej. «tiene caps»); si no, el primero que se lea.
export function leerJSON(texto, quiero = null) {
  const t = String(texto ?? '')
  if (!t.trim()) return { ok: false, error: 'La caja está vacía: pegá la respuesta de la IA.' }
  // Se leen TODOS los candidatos (los dos CAP pueden venir en dos bloques); sin repetir el mismo valor.
  const leidos = []
  const vistos = new Set()
  for (const c of candidatos(t)) {
    const r = intentar(c)
    if (!r || typeof r.valor !== 'object' || r.valor === null) continue
    const k = JSON.stringify(r.valor)
    if (vistos.has(k)) continue
    vistos.add(k)
    leidos.push(r)
  }
  const elegido = (quiero && leidos.find((r) => quiero(r.valor))) || leidos[0]
  if (elegido) return { ok: true, ...elegido, todos: leidos }
  // No se pudo: decir dónde se rompe (con el bloque más probable).
  const c = candidatos(t)[0]
  if (!c) return { ok: false, error: 'No se encontró un JSON en la respuesta (ni un bloque ```json ni llaves { }).' }
  try {
    JSON.parse(reparar(c))
  } catch (e) {
    const m = /position (\d+)/.exec(String(e?.message || ''))
    const p = m ? Number(m[1]) : -1
    const r = reparar(c)
    const cerca = p >= 0 ? r.slice(Math.max(0, p - 60), p + 60).replace(/\s+/g, ' ') : ''
    return { ok: false, error: `El JSON de la respuesta está roto${cerca ? ` cerca de: «…${cerca}…»` : ''}.` }
  }
  return { ok: false, error: 'No se encontró un JSON en la respuesta.' }
}
