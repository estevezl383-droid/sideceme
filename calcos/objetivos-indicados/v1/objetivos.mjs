// 🎯 Los objetivos del enemigo van donde el G-2 los INDICA (20-10-2026).
//
// Lo pidió Sergio con la captura de la H.T. 16: apretó «🎯 Acostar los OBJETIVOS sobre el calco», no le
// convenció dónde cayeron, escribió en «Tu indicación para esta hoja» «EL TERRENO C 13 ES EL OBJETIVO
// UNO, OSEA EL TERRENO CLAVE 13», volvió a Acostar… y los objetivos cayeron en el mismo lugar.
//
// Qué pasaba: Acostar (sK en el compilado) mide los objetivos SÓLO desde la plantilla situacional
// (media profundidad del A.O. por unidad de primer escalón, el final en profundidad) y se pega al
// terreno clave que quede a ≤ 6-8 km. La indicación vivía únicamente dentro de la caja de la IA (ni
// siquiera se guardaba) y la H.T. 16 escrita tampoco se miraba.
//
// Qué hace este módulo: lee lo que el G-2 escribió —su indicación para la H.T. 16 y las celdas
// «Objetivo intermedio» / «Objetivo final» de la hoja— y, cuando nombra un terreno clave del CMOC,
// pone ESE objetivo sobre ESE terreno clave. Lo indicado manda sobre lo calculado.
//
//   · «C 13», «C13», «C-13», «terreno clave 13», «clave 13», «T.C. 13» o el nombre del terreno clave;
//   · «objetivo final», «objetivo 1 / uno / primero», «O1» → el OBJETIVO FINAL (rótulo O1);
//   · «objetivo intermedio a / b…», «Oa», «Ob», «objetivo 2 / dos…» → los intermedios Oa, Ob…;
//   · un terreno clave nombrado sin decir cuál objetivo es → el FINAL si está libre, si no el
//     próximo intermedio libre. En la celda «Objetivo intermedio» es un intermedio, en «Objetivo
//     final» el final.

const norm = (t) =>
  String(t || '')
    .replace(/\s*\[IA\s*[—–-]\s*verificar\]\s*/gi, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()

const LETRAS = 'abcdefgh'
const NUMEROS = { UNO: 1, PRIMERO: 1, PRIMER: 1, DOS: 2, SEGUNDO: 2, TRES: 3, TERCERO: 3, TERCER: 3, CUATRO: 4, CUARTO: 4, CINCO: 5, QUINTO: 5 }

// El rótulo que se ve en la carta: el del CMOC o «C<n>» por su orden (igual que el dibujo del CMOC).
export const rotuloClave = (c, i) => String(c?.etiqueta || `C${i + 1}`).trim()

// Los terrenos clave que nombra un texto, en el orden en que aparecen.
export function clavesNombradas(texto, claves = []) {
  const t = norm(texto)
  const hallados = []
  const lista = claves.map((c, i) => ({ c, rot: rotuloClave(c, i) })).filter((x) => Array.isArray(x.c?.centro) || Array.isArray(x.c?.coords?.[0]))
  const re = /(?:^|[^A-Z0-9])(?:TERRENO\s+CLAVE|T\s*\.?\s*C\s*\.?|CLAVE|C|K)\s*(?:N\s*[°º.]?\s*)?-?\s*(\d{1,3})(?![0-9])/g
  let m
  while ((m = re.exec(t))) {
    const num = m[1]
    const x = lista.find((y) => norm(y.rot).replace(/[\s-]/g, '') === `C${num}`) || lista.find((y) => norm(y.rot).replace(/[\s-]/g, '') === `K${num}`)
    hallados.push({ pos: m.index, ref: `C${num}`, clave: x ? x.c : null, rot: x ? x.rot : `C${num}` })
  }
  // Por nombre (p. ej. «Cerro Chico»), si el rótulo no es del tipo C<n>.
  for (const x of lista) {
    const r = norm(x.rot)
    if (r.length < 4 || /^[CK]\s*-?\s*\d+$/.test(r)) continue
    const p = t.indexOf(r)
    if (p >= 0 && !hallados.some((h) => h.clave === x.c)) hallados.push({ pos: p, ref: x.rot, clave: x.c, rot: x.rot })
  }
  return hallados.sort((a, b) => a.pos - b.pos)
}

// Cuál objetivo nombra una frase: {final:true} | {intermedio:índice|null} | null.
export function objetivoNombrado(frase) {
  const t = norm(frase)
  if (/\bOBJETIVO\s+FINAL\b/.test(t) || /(?:^|[^A-Z0-9])O-?1(?![0-9A-Z])/.test(t)) return { final: true }
  let m = /\bOBJETIVOS?\s+(?:N\s*[°º.]?\s*)?(\d{1,2}|UNO|PRIMERO|PRIMER|DOS|SEGUNDO|TRES|TERCERO|TERCER|CUATRO|CUARTO|CINCO|QUINTO)\b/.exec(t)
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMEROS[m[1]]
    return n === 1 ? { final: true } : { intermedio: n - 2 }
  }
  if (/\bPRIMER\s+OBJETIVO\b/.test(t)) return { final: true }
  m = /\bOBJETIVO\s+INTERMEDIO\s*(?:\(?\s*O?\s*([A-H])\s*\)?)?(?![A-Z])/.exec(t)
  if (m) return { intermedio: m[1] ? LETRAS.indexOf(m[1].toLowerCase()) : null }
  m = /\bOBJETIVO\s+([A-H])\b/.exec(t) || /(?:^|[^A-Z0-9])O([A-H])(?![A-Z0-9])/.exec(t)
  if (m) return { intermedio: LETRAS.indexOf(m[1].toLowerCase()) }
  if (/\bOBJETIVOS?\s+INTERMEDIOS?\b/.test(t)) return { intermedio: null }
  return null
}

// De los textos a la lista de pedidos {cual, clave, rot, de}. `fuentes`: [{texto, clase?, de}] — clase
// 'final' / 'intermedio' cuando el texto es la celda de esa columna de la H.T. 16.
export function leerIndicados(fuentes = [], claves = []) {
  const pedidos = []
  const faltan = []
  for (const f of fuentes) {
    const frases = String(f?.texto || '').split(/[.;\n]+|,(?=\s*\D)|\s+(?:Y|E)\s+(?=(?:EL\s+|LA\s+)?(?:TERRENO|CLAVE|C\s*-?\s*\d|T\.?\s*C|OBJETIVO|O[A-H1](?![A-Z])))/i)
    for (const frase of frases) {
      const nombradas = clavesNombradas(frase, claves)
      if (!nombradas.length) continue
      const obj = objetivoNombrado(frase)
      nombradas.forEach((h, k) => {
        if (!h.clave) { faltan.push(h.ref); return }
        let cual = obj && k === 0 ? obj : null
        if (!cual && f.clase === 'final') cual = { final: true }
        if (!cual && f.clase === 'intermedio') cual = { intermedio: null }
        pedidos.push({ cual, clave: h.clave, rot: h.rot, de: f.de || '' })
      })
    }
  }
  // Una clave nombrada dos veces («C 13… o sea el terreno clave 13») vale una: gana la que dice cuál objetivo es.
  const unicos = []
  for (const p of pedidos.sort((a, b) => (b.cual ? 1 : 0) - (a.cual ? 1 : 0))) {
    if (unicos.some((u) => u.clave === p.clave)) continue
    unicos.push(p)
  }
  return { pedidos: unicos, faltan: [...new Set(faltan)].filter((r) => !unicos.some((u) => norm(u.rot).replace(/[\s-]/g, '') === r)) }
}

const centroDe = (c) => (Array.isArray(c?.centro) ? c.centro : c?.coords?.[0]) || null

// Mueve los objetivos acostados a los terrenos clave indicados.
export function aplicarIndicados(objetivos = [], { pedidos = [] } = {}, { coa = 'probable' } = {}) {
  const out = objetivos.map((o) => ({ ...o }))
  const puestos = []
  const inter = () => out.filter((o) => o.clase === 'intermedio')
  const tomados = new Set()
  const poner = (o, p) => {
    const c = centroDe(p.clave)
    if (!c) return
    o.centro = [+Number(c[0]).toFixed(6), +Number(c[1]).toFixed(6)]
    o.apoyadoEn = p.rot
    o.nom = o.clase === 'final' ? `OBJETIVO FINAL · terreno clave ${p.rot}` : `Terreno clave ${p.rot}`
    o.indicado = true
    o.porQue = p.de ? `lo indicó el G-2 (${p.de})` : 'lo indicó el G-2'
    tomados.add(o)
    puestos.push({ etiqueta: o.etiqueta, clave: p.rot, final: o.clase === 'final' })
  }
  const nuevoIntermedio = (i) => {
    const o = { id: `obj-${coa}-i${i}-ind`, centro: [0, 0], etiqueta: `O${LETRAS[i] || i + 1}`, nom: 'Objetivo intermedio', clase: 'intermedio', deId: '', de: '', apoyadoEn: '', coa }
    const fin = out.findIndex((x) => x.clase === 'final')
    fin >= 0 ? out.splice(fin, 0, o) : out.push(o)
    return o
  }
  const elFinal = () => {
    let f = out.find((o) => o.clase === 'final')
    if (!f) { f = { id: `obj-${coa}-final`, centro: [0, 0], etiqueta: 'O1', nom: 'OBJETIVO FINAL', clase: 'final', de: '', apoyadoEn: '', coa }; out.push(f) }
    return f
  }
  // Primero los que dicen cuál objetivo son; después los sueltos ocupan lo que quede libre.
  const conCual = pedidos.filter((p) => p.cual && (p.cual.final || p.cual.intermedio != null))
  const sinCual = pedidos.filter((p) => !(p.cual && (p.cual.final || p.cual.intermedio != null)))
  for (const p of conCual) {
    if (p.cual.final) { const f = elFinal(); if (!tomados.has(f)) poner(f, p); continue }
    const i = Math.max(0, p.cual.intermedio)
    let o = inter()[i]
    while (!o) { nuevoIntermedio(inter().length); o = inter()[i] }
    if (!tomados.has(o)) poner(o, p)
  }
  for (const p of sinCual) {
    const soloInter = p.cual && p.cual.intermedio === null
    const f = out.find((o) => o.clase === 'final')
    if (!soloInter && (!f || !tomados.has(f))) { poner(elFinal(), p); continue }
    const o = inter().find((x) => !tomados.has(x)) || nuevoIntermedio(inter().length)
    poner(o, p)
  }
  return { objetivos: out, puestos }
}

// Lo que se lee para la H.T. 16: la indicación guardada (picb._indic.ht16) y las celdas de objetivos.
export function fuentesHT16(picb = {}) {
  const f = []
  const ind = picb?._indic?.ht16
  if (ind && String(ind).trim()) f.push({ texto: ind, de: 'tu indicación' })
  for (const fila of Array.isArray(picb?.ht16) ? picb.ht16 : []) {
    if (!fila) continue
    const fase = String(fila.Fase || '').trim()
    if (fila['Objetivo intermedio']) f.push({ texto: fila['Objetivo intermedio'], clase: 'intermedio', de: `H.T. 16${fase ? ' · ' + fase : ''}` })
    if (fila['Objetivo final']) f.push({ texto: fila['Objetivo final'], clase: 'final', de: `H.T. 16${fase ? ' · ' + fase : ''}` })
  }
  return f
}

// Lo que usa el botón Acostar: el resultado de sK con los objetivos indicados encima.
export function objetivosIndicados(ot, picb, cmoc, opciones) {
  if (!ot?.ok) return { ...ot, indicados: [], faltan: [] }
  const claves = cmoc?.clave || []
  const leidos = leerIndicados(fuentesHT16(picb), claves)
  if (!leidos.pedidos.length) return { ...ot, indicados: [], faltan: leidos.faltan }
  const { objetivos, puestos } = aplicarIndicados(ot.objetivos, leidos, opciones)
  return {
    ...ot,
    objetivos,
    indicados: puestos,
    faltan: leidos.faltan,
    resumen: { ...ot.resumen, intermedios: objetivos.filter((o) => o.clase === 'intermedio').length, final: objetivos.some((o) => o.clase === 'final'), apoyadosEnClave: objetivos.filter((o) => o.apoyadoEn).length },
  }
}

// El texto que se suma al aviso de Acostar.
export function avisoIndicados(r) {
  let t = ''
  if (r?.indicados?.length) t += ` 📌 Por lo que indicaste: ${r.indicados.map((p) => `${p.final ? 'el OBJETIVO FINAL (O1)' : p.etiqueta} en ${p.clave}`).join(', ')}.`
  if (r?.faltan?.length) t += ` ⚠️ No hay terreno clave ${r.faltan.join(', ')} en el CMOC: revisá el número en la carta.`
  return t
}
