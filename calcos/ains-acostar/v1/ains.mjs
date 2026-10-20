// ◎ Acostar las A.I.N. de la H.T. 20 aunque su nombre no cite el CMOC (20-10-2026).
//
// Lo pidió Sergio con la H.T. 20 que le hizo la IA (AIN-2, AIN-3, AIN-5, AIN-1…): «le di a la
// aplicación para acostar los AINes y no me los muestra, ¿qué pasa?, ¿dónde están los AINes?».
//
// Qué pasaba: «◎ Acostar las A.I.N.» ($je en el compilado) sólo deduce el lugar desde el NOMBRE de la
// A.I.N. («AIN-2 (Vado Lauca)», «AIN-3 C 12», «… 6 km de la LPR») y lo busca en el terreno clave y en
// los ejes del CMOC. Una hoja con «AIN-2» a secas, y el lugar en el INDICADOR («ruta Putre –
// Guallatire», «vados de Ungallire – Guata», «Tambo Quemado»), no deja ubicar ninguna: la Mesa pasa
// a «ubicar a mano, una por una» y en la carta no aparece nada.
//
// Qué hace este módulo con las que $je deja sin ubicar, en este orden:
//   1. «AA-2» / «avenida 2» en el texto → sobre esa avenida de aproximación;
//   2. los lugares que nombra la hoja (indicador, después CAE más probable y más peligroso) buscados en
//      los calcos del terreno (poblaciones, ríos, vías, cimas: el nomenclátor zIe del compilado) y en
//      el terreno clave del CMOC → en ese lugar; si nombra dos («Putre – Guallatire»), entre los dos;
//   3. si no nombra nada que esté en la carta → repartidas sobre las avenidas de aproximación del
//      CMOC (por donde viene el enemigo, que es donde se ve el suceso); sin avenidas, sobre el terreno
//      clave; sin nada de eso, dentro del Área de Operaciones.
// Todas quedan sobre la carta con su porqué; las de 3 llevan ✎ para que el G-2 las arrastre.

const norm = (t) =>
  String(t || '')
    .replace(/\s*\[IA\s*[—–-]\s*verificar\]\s*/gi, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()

const GENERICAS = /^(RIO|RIACHO|ARROYO|QUEBRADA|CERRO|NEVADO|VOLCAN|LAGO|LAGUNA|SALAR|PAMPA|ESTANCIA|COMUNIDAD|CANTON|PUEBLO|VILLA|CIUDAD|RUTA|CARRETERA|CAMINO|PASO|PUENTE|VADO|PORTEZUELO|ABRA|CORDILLERA|SERRANIA|LOMA|PUNTA|PICO|EL|LA|LOS|LAS|DE|DEL)\s+/
// Palabras que en una hoja militar no son un lugar aunque algún calco las use de nombre.
const NO_LUGAR = new Set(['NORTE', 'SUR', 'ESTE', 'OESTE', 'CENTRO', 'FRENTE', 'FLANCO', 'BRIGADA', 'BATALLON', 'COMPANIA', 'DIVISION', 'RESERVA', 'FASE', 'ATAQUE', 'DEFENSA', 'FUEGO', 'FUEGOS', 'BLINDADA', 'ACORAZADA', 'MOTORIZADA', 'APOYO', 'LINEA', 'TANQUES', 'COHETES', 'ZONA', 'AREA', 'VALLE', 'CAMPO', 'GRANDE', 'NUEVO', 'NUEVA', 'SANTA', 'SAN', 'PUERTO'])

const RAD = Math.PI / 180
const km = (a, b) => {
  const kx = 111.32 * Math.cos(((a[1] + b[1]) / 2) * RAD)
  return Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * 110.57)
}
const valido = (p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[0]) && Number.isFinite(+p[1])
const redondo = (p) => [+Number(p[0]).toFixed(6), +Number(p[1]).toFixed(6)]

// Punto a una fracción del largo de una polilínea [[lng,lat],…].
export function puntoEnLinea(coords, frac = 0.5) {
  const c = (coords || []).filter(valido)
  if (!c.length) return null
  if (c.length === 1) return c[0].slice(0, 2)
  const tramos = []
  let total = 0
  for (let i = 1; i < c.length; i++) { const d = km(c[i - 1], c[i]); tramos.push(d); total += d }
  let falta = total * Math.min(1, Math.max(0, frac))
  for (let i = 0; i < tramos.length; i++) {
    if (falta <= tramos[i] || i === tramos.length - 1) {
      const t = tramos[i] ? Math.min(1, falta / tramos[i]) : 0
      return [c[i][0] + (c[i + 1][0] - c[i][0]) * t, c[i][1] + (c[i + 1][1] - c[i][1]) * t]
    }
    falta -= tramos[i]
  }
  return c[c.length - 1].slice(0, 2)
}

const centroide = (anillo) => {
  const c = (anillo || []).filter(valido)
  if (!c.length) return null
  return [c.reduce((s, p) => s + +p[0], 0) / c.length, c.reduce((s, p) => s + +p[1], 0) / c.length]
}

const nombreAvenida = (a, i) => a?.properties?.nombre || a?.nombre || `AA-${i + 1}`

// El nomenclátor (lista de {nom, clase, c}) agrupado por nombre: cada lugar con todos sus puntos.
export function agruparLugares(lugares = [], claves = []) {
  const m = new Map()
  const poner = (nom, clase, c) => {
    const n = norm(nom)
    if (!valido(c) || n.length < 4) return
    const corto = n.replace(GENERICAS, '')
    if (NO_LUGAR.has(n) || NO_LUGAR.has(corto)) return
    if (!m.has(n)) m.set(n, { nom: String(nom), clase, n, corto: corto.length >= 5 && corto !== n ? corto : null, puntos: [] })
    m.get(n).puntos.push([+c[0], +c[1]])
  }
  for (const l of lugares || []) poner(l?.nom, l?.clase || 'lugar', l?.c)
  for (const k of claves || []) {
    if (!valido(k?.centro)) continue
    poner(k.etiqueta, 'terreno clave', k.centro)
    const r = String(k.razon || '').split(/[:;(,.]/)[0]
    if (r && r.length <= 40) poner(r, 'terreno clave', k.centro)
  }
  return [...m.values()]
}

const contiene = (texto, frase) => frase && new RegExp(`(^| )${frase}( |$)`).test(texto)

// Los lugares que nombra un texto, en el orden en que aparecen.
export function lugaresNombrados(texto, grupos) {
  const t = norm(texto)
  if (!t) return []
  const hallados = []
  for (const g of grupos) {
    let pos = -1
    if (contiene(t, g.n)) pos = t.search(new RegExp(`(^| )${g.n}( |$)`))
    else if (g.corto && contiene(t, g.corto)) pos = t.search(new RegExp(`(^| )${g.corto}( |$)`))
    if (pos >= 0) hallados.push({ ...g, pos })
  }
  // Un lugar cuyo nombre está dentro de otro hallado («LAUCA» dentro de «RIO LAUCA») no cuenta dos veces.
  return hallados
    .filter((h) => !hallados.some((o) => o !== h && o.n.length > h.n.length && o.n.includes(h.n)))
    .sort((a, b) => a.pos - b.pos)
}

// El punto de un lugar más cercano a una referencia (un río tiene cientos de vértices).
const masCerca = (g, ref) => {
  if (!ref) return g.puntos[Math.floor(g.puntos.length / 2)]
  let mejor = null
  for (const p of g.puntos) { const d = km(p, ref); if (!mejor || d < mejor.d) mejor = { p, d } }
  return mejor.p
}

function porLugares(fila, grupos, ref) {
  for (const campo of ['indicador', 'probable', 'peligroso']) {
    const h = lugaresNombrados(fila[campo], grupos)
    if (!h.length) continue
    const a = h[0]
    const b = h.find((o) => o.n !== a.n)
    if (b) {
      const pb = masCerca(b, ref)
      const pa = masCerca(a, pb)
      const pb2 = masCerca(b, pa)
      if (km(pa, pb2) <= 60)
        return { p: [(pa[0] + pb2[0]) / 2, (pa[1] + pb2[1]) / 2], porQue: `entre ${a.nom} y ${b.nom} (lo nombra ${campo === 'indicador' ? 'el indicador' : `el CAE más ${campo}`}) ✎` }
    }
    return { p: masCerca(a, ref).slice(0, 2), porQue: `en ${a.nom}${a.clase && a.clase !== 'lugar' ? ` (${a.clase})` : ''} — lo nombra ${campo === 'indicador' ? 'el indicador' : `el CAE más ${campo}`} ✎` }
  }
  return null
}

const FRACS = [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6]

// No pone dos A.I.N. en el mismo lugar: corre la nueva 0,9 km por cada choque.
function apartar(p, ocupados) {
  let q = p
  for (let a = 1; a <= 8 && ocupados.some((o) => km(o, q) < 0.3); a++) {
    const ang = ((a * 72) % 360) * RAD, d = 0.9 * a
    q = [p[0] + (d * Math.sin(ang)) / (111.32 * Math.cos(p[1] * RAD)), p[1] + (d * Math.cos(ang)) / 110.57]
  }
  return redondo(q)
}

const proximoN = (ains) => {
  let e = 0
  for (const a of ains || []) {
    const m = /(\d+)\s*$/.exec(String(a?.nom || ''))
    const n = m ? Number(m[1]) : Number(a?.n) || 0
    if (n > e) e = n
  }
  return e + 1
}

export function acostarRestantes(lista = [], { cmoc = {}, areaOps = null, ains = [], lugares = [] } = {}) {
  const avenidas = (cmoc?.avenidas || []).map((a, i) => ({ a, i, nom: nombreAvenida(a, i) })).filter((x) => (x.a?.coords || []).filter(valido).length >= 2)
  const claves = (cmoc?.clave || []).filter((k) => valido(k?.centro))
  const grupos = agruparLugares(lugares, claves)
  const ao = Array.isArray(areaOps?.coords) ? (Array.isArray(areaOps.coords[0]?.[0]) ? areaOps.coords[0] : areaOps.coords) : null
  const ref = centroide(ao) || (avenidas[0] ? puntoEnLinea(avenidas[0].a.coords, 0.5) : null) || claves[0]?.centro || null
  const ocupados = (ains || []).map((a) => a?.centro).filter(valido)
  const usosAv = new Map()
  let rr = 0
  let n = proximoN(ains)
  const puestas = [], sinUbicar = []

  const enAvenida = (x) => {
    const k = usosAv.get(x.i) || 0
    usosAv.set(x.i, k + 1)
    return puntoEnLinea(x.a.coords, FRACS[k % FRACS.length])
  }

  for (const g of lista) {
    const texto = `${g.nom || ''} ${g.indicador || ''} ${g.probable || ''} ${g.peligroso || ''}`
    let v = null, porQue = '', ubicadaPor = ''
    const aa = /\b(?:AA|AVENIDA(?: DE APROXIMACION)?(?: N)?)\s*-?\s*(\d+)\b/.exec(norm(texto))
    if (aa) {
      const x = avenidas.find((y) => norm(y.nom) === `AA ${aa[1]}`) || avenidas.find((y) => y.i === Number(aa[1]) - 1)
      if (x) { v = enAvenida(x); porQue = `sobre la avenida ${x.nom}, que nombra la hoja ✎`; ubicadaPor = 'avenida' }
    }
    if (!v) {
      const l = porLugares(g, grupos, ref)
      if (l) { v = l.p; porQue = l.porQue; ubicadaPor = 'lugar' }
    }
    if (!v && avenidas.length) {
      const x = avenidas[rr++ % avenidas.length]
      v = enAvenida(x)
      porQue = `la hoja no nombra ningún lugar que esté en la carta: repartida sobre la avenida ${x.nom}, por donde se espera el suceso. Arrastrala adonde va ✎`
      ubicadaPor = 'repartida'
    }
    if (!v && claves.length) {
      const k = claves[rr++ % claves.length]
      v = k.centro.slice(0, 2)
      porQue = `la hoja no nombra ningún lugar que esté en la carta y no hay avenidas en el CMOC: sobre el terreno clave ${k.etiqueta}. Arrastrala adonde va ✎`
      ubicadaPor = 'repartida'
    }
    if (!v && ref) {
      v = ref.slice()
      porQue = 'la hoja no nombra ningún lugar que esté en la carta y el CMOC no tiene avenidas ni terreno clave: en el centro del Área de Operaciones. Arrastrala adonde va ✎'
      ubicadaPor = 'repartida'
    }
    if (!v) { sinUbicar.push(g); continue }
    v = apartar(v, ocupados)
    ocupados.push(v)
    const m = /(\d+)/.exec(String(g.nom || ''))
    const num = m ? Number(m[1]) : n
    puestas.push({
      n: num,
      nom: String(g.nom || `AIN-${num}`).trim(),
      centro: v,
      forma: 'punto',
      indicador: g.indicador || '',
      noAntes: g.noAntes || '',
      noDespues: g.noDespues || '',
      probable: g.probable || '',
      peligroso: g.peligroso || '',
      medio: '',
      deLaHoja: true,
      porQue,
      ubicadaPor,
    })
    if (!m) n += 1
  }
  return { puestas, sinUbicar }
}

// El aviso de la barra al acostar: cuántas, y cuántas hay que revisar.
export function avisoAins(puestas = [], enClave = 0) {
  const lugar = puestas.filter((p) => p.ubicadaPor === 'lugar' || p.ubicadaPor === 'avenida').length
  const rep = puestas.filter((p) => p.ubicadaPor === 'repartida').length
  return `◎ ${puestas.length} A.I.N. sobre la carta · ${enClave} apoyada(s) en terreno clave` +
    (lugar ? ` · ${lugar} en el lugar que nombra la hoja` : '') +
    (rep ? ` · ${rep} repartida(s) sobre las avenidas porque la hoja no nombra un lugar de la carta (revisalas)` : '')
}
