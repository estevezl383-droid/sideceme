// Lee el TEXTO de la F3·P4 (los nueve campos de la hoja «Concepto amplio de la operación») y saca lo
// que se puede llevar a la carta: la forma de maniobra, quién es el esfuerzo principal y por qué
// avenidas, las líneas con nombre (LF «PUMA», LPR, LDE-2…) y sus lugares, los puntos de contacto con
// coordenadas, las zonas de obstáculos (ZO-1 en Ungallire – Guata), la reserva, sus ejes y las A.I.N.
// que nombran los fuegos. No adivina: lo que no está escrito lo pone la doctrina (modelo.mjs).

export const CAMPOS = {
  forma: 'Forma de maniobra elegida y por qué',
  principal: 'Esfuerzo principal (quién, dónde, con qué)',
  secundarios: 'Esfuerzos secundarios',
  reserva: 'Reserva: composición, ubicación y plazo de empleo',
  fuegos: 'Fuegos: tarea esencial de apoyo de fuegos',
  barreras: 'Movilidad / contramovilidad / supervivencia (plan de barreras)',
  medidas: 'Medidas de control gráficas que se imponen',
  riesgo: 'Riesgo aceptado',
  estadoFinal: 'Estado final deseado',
}

export const norm = (t) =>
  String(t || '')
    .replace(/\s*\[IA\s*[—–-]\s*verificar\]\s*/gi, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()

export const FORMAS = [
  { id: 'defensa_area', nom: 'Defensa de área', tipo: 'defensiva', re: /DEFENSA\s+(DE\s+AREA|EN\s+POSICION|DE\s+POSICION|ESTATICA|DE\s+ZONA)/ },
  { id: 'defensa_movil', nom: 'Defensa móvil', tipo: 'defensiva', re: /DEFENSA\s+MOVIL/ },
  { id: 'retardo', nom: 'Acción retardatriz', tipo: 'retrograda', re: /RETARD|RETROGRAD|REPLIEGUE/ },
  { id: 'ataque', nom: 'Ataque (penetración / desbordamiento / envolvimiento)', tipo: 'ofensiva', re: /PENETRACI|ENVOLVIM|DESBORD|ATAQUE\s+(FRONTAL|PRINCIPAL|DE\s+)|OFENSIV/ },
]
export const formaDe = (id) => FORMAS.find((f) => f.id === id) || FORMAS[0]

const texto = (v) => (Array.isArray(v) ? v.join('\n') : String(v ?? ''))
export function campos(hoja) {
  const h = hoja && typeof hoja === 'object' ? hoja : {}
  const o = {}
  for (const [k, nom] of Object.entries(CAMPOS)) o[k] = texto(h[nom])
  return o
}

// La forma de maniobra que dice el texto (o la misión de la Orden, si el texto no lo dice).
export function leerForma(c, mision = '') {
  for (const t of [c.forma, c.principal, mision]) {
    const n = norm(t)
    for (const f of FORMAS) if (f.re.test(n)) return f.id
    if (/\bDEFIEND|\bDEFENS/.test(n)) return 'defensa_area'
    if (/\bATAC|\bCONQUIST/.test(n)) return 'ataque'
  }
  return null
}

export const avenidasNombradas = (t) => [...new Set([...norm(t).matchAll(/\bAA\s*-?\s*(\d{1,2})\b/g)].map((m) => Number(m[1])))]
export const ainsNombradas = (t) => [...new Set([...norm(t).matchAll(/\bA\.?\s*I\.?\s*N\.?\s*-?\s*(\d{1,2})\b/g)].map((m) => Number(m[1])))]

// Un par de coordenadas escrito en el texto: «-18.700, -68.760» (lat, lng). Devuelve [lng, lat].
const NUM = /(-?\d{1,3}[.,]\d{2,})\s*[,;/]?\s*(-?\d{1,3}[.,]\d{2,})/
export function coordsDe(t) {
  const m = NUM.exec(String(t || ''))
  if (!m) return null
  const a = Number(m[1].replace(',', '.')), b = Number(m[2].replace(',', '.'))
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180) return null
  // Se escribe lat, lng (como en el texto de la IA); si la primera no puede ser latitud, al revés.
  return Math.abs(a) <= Math.abs(b) ? [b, a] : [a, b]
}

// Lo que va entre los paréntesis que siguen a una posición del texto (con paréntesis adentro).
function parentesis(t, desde) {
  const i = t.indexOf('(', desde)
  if (i < 0 || i - desde > 6) return null
  let n = 0
  for (let j = i; j < t.length; j++) {
    if (t[j] === '(') n++
    else if (t[j] === ')' && --n === 0) return t.slice(i + 1, j)
  }
  return null
}

// Los tramos de una descripción de línea: «Ecia. Esmeralda – Co. Sacabaya – Límite Sur en -18.700, -68.760».
export function tramos(desc) {
  let d = String(desc || '')
  const dos = d.lastIndexOf(':')
  if (dos >= 0) d = d.slice(dos + 1)
  const barra = d.split('/')
  d = barra.length > 1 ? barra.find((x) => /[–—-]/.test(x)) || barra[barra.length - 1] : d
  const t = d
    .replace(/^\s*(EJE|L[IÍ]NEA)\s+/i, '')
    .split(/\s*[–—]\s*|\s+-\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3)
  // Un solo tramo sin coordenadas no es una línea («Frontera», «LCAF»).
  return t.length >= 2 || (t.length === 1 && coordsDe(t[0])) ? t : []
}

// Líneas con nombre: LF «PUMA», LPR, LDE-1, LDE-2, LR-1, LP/LD, LCAF… con su descripción.
const LINEA = /\b(LF|LPR|LDE|LCAF|LP\s*\/\s*LD|LD|LR|BAZR|LAZS|LCF|LIF|LFS)\b\s*-?\s*(\d{1,2})?\s*(?:[«"“]([^»"”]{1,30})[»"”])?/g
export function lineasNombradas(t) {
  const s = String(t || '')
  const out = []
  for (const m of s.matchAll(LINEA)) {
    const sigla = m[1].replace(/\s+/g, '').toUpperCase()
    const nom = `${sigla}${m[2] ? `-${m[2]}` : ''}${m[3] ? ` «${m[3].trim()}»` : ''}`
    const desc = parentesis(s, m.index + m[0].length)
    if (out.some((o) => o.nom === nom && o.desc)) continue
    const previo = out.findIndex((o) => o.nom === nom)
    const item = { sigla, nom, alias: m[3] ? m[3].trim().toUpperCase() : null, desc: desc || '', tramos: desc ? tramos(desc) : [], refiere: null, frontera: /FRONTERA|LCAF|LIMITE\s+INTERNACIONAL/.test(norm(desc)) }
    // «LPR (Línea Principal de Resistencia en LF «PUMA»)»: es la misma línea que otra.
    const ref = desc && /\b(LF|LDE|LR)\s*-?\s*(\d{1,2})?\s*[«"“]?([^»"”)]{0,30})/.exec(desc)
    if (ref && ref.index > 0 && !/[–—]/.test(desc)) item.refiere = `${ref[1]}${ref[2] ? `-${ref[2]}` : ''}${ref[3] && ref[3].trim() ? ` «${ref[3].trim()}»` : ''}`
    if (previo >= 0) out[previo] = item
    else out.push(item)
  }
  return out
}

// Puntos de contacto con coordenadas: «PC-1 (-18.5168, -69.0101)».
export function puntosDeContacto(t) {
  const out = []
  for (const m of String(t || '').matchAll(/\bP\.?\s*C\.?\s*-?\s*(\d{1,2})\s*\(([^)]{5,40})\)/g)) {
    const c = coordsDe(m[2])
    if (c && !out.some((o) => o.n === Number(m[1]))) out.push({ n: Number(m[1]), nom: `PC-${m[1]}`, centro: c })
  }
  return out
}

// Zonas de obstáculos: «ZO-1 en el desfiladero y vados firmes del río Lauca (paso Ungallire–Guata, P39/P40)».
export function zonasDeObstaculos(t) {
  const s = String(t || '')
  const out = []
  for (const m of s.matchAll(/\bZ\.?\s*O\.?\s*-?\s*(\d{1,2})\b/g)) {
    const n = Number(m[1])
    if (out.some((o) => o.n === n)) continue
    const fin = s.slice(m.index).search(/[;]|\.\s+[A-ZÁÉÍÓÚ][a-záéíóú]+\s|\n/)
    const trozo = s.slice(m.index, fin > 0 ? m.index + Math.max(fin, 40) : m.index + 260).slice(0, 300)
    out.push({ n, nom: `ZO-${n}`, texto: trozo })
  }
  return out
}

// Cantidades del plan de barreras que vienen escritas: minas, rollos de concertina, explosivos.
export function cantidades(t) {
  const n = norm(t).replace(/(\d)\.(\d{3})/g, '$1$2')
  const num = (re) => { const m = re.exec(n); return m ? Number(m[1]) : null }
  return {
    minasAC: num(/(\d{2,6})\s*MINAS?\s*(?:ANTI\s*-?\s*TANQUES?|ANTICARRO|AC\b|AT\b)/),
    minasAP: num(/(\d{2,6})\s*MINAS?\s*(?:ANTI\s*-?\s*PERSONAL(?:ES)?|AP\b)/),
    concertina: num(/(\d{1,5})\s*ROLLOS?\s*(?:DE\s*)?CONCERTINA/),
    explosivoT: num(/(\d{1,4}(?:[.,]\d+)?)\s*T(?:ONELADAS?)?\.?\s*DE\s*EXPLOSIV/),
  }
}

// Ejes escritos: «sobre el eje Julo – Bella Vista», «eje Macaya – Turco».
export function ejes(t) {
  const out = []
  for (const m of String(t || '').matchAll(/\beje\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.]*(?:\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.]*){0,3})\s*[–—-]\s*([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.]*(?:\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ.]*){0,3})/g)) {
    const a = m[1].trim(), b = m[2].trim()
    if (!out.some((o) => o.a === a && o.b === b)) out.push({ a, b, texto: m[0] })
  }
  return out
}

// Las unidades del calco que nombra un texto (por su designación: «DIV MEC-2» ≠ «DIV-12»).
const sigla = (s) => norm(s).replace(/[«"“][^»"”]*[»"”]/g, ' ').replace(/[^A-Z0-9]+/g, ' ').trim()
export function unidadesNombradas(t, unidades = [], rotulo = (u) => u?.designacion || '') {
  const n = ` ${norm(t).replace(/[^A-Z0-9]+/g, ' ')} `
  const out = []
  for (const u of unidades) {
    const s = sigla(rotulo(u) || u?.designacion || '')
    if (s.length < 3) continue
    const i = n.indexOf(` ${s} `)
    if (i >= 0) out.push({ u, pos: i })
  }
  return out.sort((a, b) => a.pos - b.pos).map((x) => x.u)
}

// El lado del A.O. que nombra un texto («sector norte», «flanco sur»).
export function ladoNombrado(t) {
  const m = /\b(?:SECTOR|FLANCO|ZONA|PARTE|AL)\s+(NORTE|SUR|ESTE|OESTE|NORESTE|NOROESTE|SUDESTE|SUDOESTE|SURESTE|SUROESTE)\b/.exec(norm(t))
  if (!m) return null
  return { NORTE: 0, NORESTE: 45, ESTE: 90, SUDESTE: 135, SURESTE: 135, SUR: 180, SUDOESTE: 225, SUROESTE: 225, OESTE: 270, NOROESTE: 315 }[m[1]]
}

// Todo junto.
export function leerConcepto(hoja, extra = {}) {
  const c = campos(hoja)
  const todo = Object.values(c).join('\n')
  return {
    c,
    vacio: !todo.trim(),
    forma: leerForma(c, extra.mision || ''),
    principal: { aas: avenidasNombradas(c.principal), lado: ladoNombrado(c.principal) },
    secundarios: c.secundarios
      .split(/\n|(?:^|\s)\d\)\s+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 8)
      .map((x) => ({ texto: x, aas: avenidasNombradas(x), lado: ladoNombrado(x), ains: ainsNombradas(x) })),
    lineas: lineasNombradas(`${c.medidas}\n${c.principal}\n${c.forma}\n${c.secundarios}`),
    pcs: puntosDeContacto(`${c.medidas}\n${c.secundarios}`),
    zos: zonasDeObstaculos(`${c.barreras}\n${c.principal}\n${c.medidas}\n${c.forma}`),
    cantidades: cantidades(`${c.barreras}\n${c.principal}`),
    reserva: { texto: c.reserva, ejes: ejes(c.reserva) },
    fuegos: { texto: c.fuegos, ains: ainsNombradas(c.fuegos), aas: avenidasNombradas(c.fuegos), contrabateria: /CONTRABATER/.test(norm(c.fuegos)), proteccionFinal: /PROTECCION\s+FINAL|BARRERA/.test(norm(c.fuegos)) },
    blindado: /BLINDAD|ACORAZAD|TANQUE|LEOPARD|\bTQ\b|MECANIZAD|M113|VCI/.test(norm(todo)),
    demoliciones: /VOLADUR|DEMOLIC|PUENTE|EXPLOSIV|CRATER/.test(norm(c.barreras)),
  }
}
