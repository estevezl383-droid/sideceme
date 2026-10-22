// 🗺️ F3·P4 — el CONCEPTO DE LA OPERACIÓN SOBRE LA CARTA (22-10-2026).
//
// Lo pidió Sergio con la F3·P4 que le hizo la IA (Defensa de área del CE-I en el AO LAUCA): «me lo
// armó un documento pero en el calco no se ve absolutamente nada… armalo como una plantilla doctrinal
// con fichas que incluya el plan de barreras y el plan de fuegos… que pueda mover la concentración de
// fuego, mover las barreras, aumentarlas… en congruencia con todo lo que ya consideraron los otros G».
//
// Qué arma (sin DOM: se prueba en Node). Todo sale de lo que YA está en el ejercicio, en este orden:
//   · el TEXTO de la hoja (lector.mjs): forma de maniobra, esfuerzo principal y sus avenidas, líneas con
//     nombre y sus lugares, puntos de contacto con coordenadas, ZO-n y su lugar, reserva y sus ejes,
//     las A.I.N. que nombran los fuegos;
//   · el G-2: el Área de Operaciones, de dónde viene el enemigo (la hoja P.D. o las fichas enemigas),
//     las AVENIDAS DE APROXIMACIÓN del CMOC, las ÁREAS DE EMPEÑAMIENTO, las A.I.N. de la H.T. 20, la
//     artillería enemiga (fichas y plantilla situacional) para la contrabatería;
//   · el G-3: la F3·P3 (dónde quedó la OD y la reserva), los medios de apoyo de fuego del 🔥 plan de
//     fuegos con su alcance (para asignar quién bate cada concentración);
//   · lo que no está escrito en ningún lado lo pone la DOCTRINA de la defensa (zona de seguridad, zona de
//     resistencia, zona de reserva; obstáculos delante de la LPR, sobre las avenidas, batidos por el
//     fuego; FPF delante de la LPR; reserva a retaguardia del esfuerzo principal con su eje de
//     contraataque). Las MEDIDAS (kilómetros, metros) son CRITERIO DE LA MESA, editables, no doctrina.
//
// Lo que se pone en el calco va a las MISMAS piezas que ya usa la Mesa, para que sea UN solo plan:
//   ops.limites (líneas y zonas con nombre), ops.coordinacion (puntos de contacto), ops.obstaculos (el
//   plan de barreras: lo calcula 🛡️ Defensa) y planFuegos.blancos (el plan de fuegos: 🔥 Fuegos, la
//   lista de blancos y la Matriz F4·P7). Lo que no tiene pieza en la Mesa (el efecto de cada zona de
//   obstáculos, los rótulos de las zonas, la reserva) va a g3.conceptoCarta.marcas. Cada cosa lleva
//   `co: { id, rol, grupo }`: así se mueve en grupo (la ZO con sus obstáculos y sus fuegos) y se rehace.

import * as G from './geo.mjs'
import { leerConcepto, norm, formaDe, FORMAS } from './lector.mjs'
import { agruparLugares, lugaresNombrados } from '../../ains-acostar/v1/ains.mjs'

export { FORMAS }
export const DIRECCIONES = [
  { id: 'auto', nom: 'Automático', v: null },
  { id: 'N', nom: 'Norte', v: 0 },
  { id: 'NE', nom: 'Noreste', v: 45 },
  { id: 'E', nom: 'Este', v: 90 },
  { id: 'SE', nom: 'Sudeste', v: 135 },
  { id: 'S', nom: 'Sur', v: 180 },
  { id: 'SO', nom: 'Sudoeste', v: 225 },
  { id: 'O', nom: 'Oeste', v: 270 },
  { id: 'NO', nom: 'Noroeste', v: 315 },
]

export const SECCIONES = [
  { id: 'medidas', nom: 'Medidas de control', ico: '📏' },
  { id: 'maniobra', nom: 'Maniobra: esfuerzos y reserva', ico: '⚔️' },
  { id: 'barreras', nom: 'Plan de barreras', ico: '🚧' },
  { id: 'fuegos', nom: 'Plan de fuegos', ico: '🎯' },
]

// Lo que se puede agregar a mano desde la paleta (la doctrina de cada ficha, en una línea).
export const PALETA = [
  { id: 'ab_circ', seccion: 'fuegos', nom: 'Concentración circular', ico: '✛', ayuda: 'Área batida alrededor del punto. Se agranda con ⤡.' },
  { id: 'ab_rect', seccion: 'fuegos', nom: 'Concentración rectangular (zona de aniquilamiento)', ico: '▭', ayuda: 'Para batir una zona de aniquilamiento entera. Se gira con ⟳.' },
  { id: 'fpf', seccion: 'fuegos', nom: 'Fuego de protección final (FPF)', ico: '┅', ayuda: 'Cortina delante de la LPR: la última barrera de fuego antes del asalto.' },
  { id: 'cb', seccion: 'fuegos', nom: 'Contrabatería', ico: '◎', ayuda: 'Sobre la artillería enemiga ubicada por el G-2.' },
  { id: 'zo', seccion: 'barreras', nom: 'Zona de obstáculos (con minado, concertina y zanja)', ico: '▨', ayuda: 'Un grupo completo, atravesado a la avenida más cercana. Se mueve entero.' },
  { id: 'minado_ac', seccion: 'barreras', nom: 'Campo minado anticarro', ico: '⊕', ayuda: 'Siempre batido por el fuego y registrado.' },
  { id: 'concertina_triple', seccion: 'barreras', nom: 'Concertina triple', ico: '〰', ayuda: 'Se tiende rápido; protege la posición y el minado.' },
  { id: 'zanja_at', seccion: 'barreras', nom: 'Zanja antitanque', ico: '⊥', ayuda: 'Los dientes miran al enemigo.' },
  { id: 'demolicion', seccion: 'barreras', nom: 'Demolición / cráter', ico: '✕', ayuda: 'Sobre el punto exacto del camino o puente que se corta.' },
  { id: 'ef_bloquear', seccion: 'barreras', nom: 'Efecto: BLOQUEAR', ico: 'B', ayuda: 'Que el enemigo no pase por la avenida.' },
  { id: 'ef_fijar', seccion: 'barreras', nom: 'Efecto: FIJAR', ico: 'F', ayuda: 'Detenerlo en la zona de aniquilamiento para batirlo.' },
  { id: 'ef_canalizar', seccion: 'barreras', nom: 'Efecto: CANALIZAR', ico: 'C', ayuda: 'Llevarlo hacia donde lo esperan los fuegos.' },
  { id: 'ef_desviar', seccion: 'barreras', nom: 'Efecto: DESVIAR', ico: 'D', ayuda: 'Sacarlo de una avenida hacia otra menos favorable.' },
  { id: 'eje_ca', seccion: 'maniobra', nom: 'Eje de contraataque', ico: '➜', ayuda: 'Desde la reserva hacia la penetración. Sin obstáculos propios en el camino.' },
  { id: 'pb', seccion: 'maniobra', nom: 'Posición de bloqueo de la reserva', ico: '⊣', ayuda: 'En profundidad, sobre la avenida, por si el enemigo irrumpe.' },
  { id: 'linea', seccion: 'medidas', nom: 'Línea con nombre (LF, LR, LDE…)', ico: '━', ayuda: 'Se traza recta y después se le agregan puntos con ⚪.' },
]

const n1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',')
const fmtKm = (k) => (k < 1 ? `${Math.round(k * 1000)} m` : `${n1(k)} km`)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const esEnemigo = (u) => u && (u.bando === 'enemigo' || u.bando === 'enemigas')
const esPropia = (u) => u && !esEnemigo(u) && u.tipo !== 'instalacion'
const ARMAS_FUEGO = /artiller|lanzacohet|mortero/i
const ES_ART_ENEMIGA = /\b(ART|ARTILLER|LAR|LANZACOHET|M109|OBUS|OBÚS|GAAP|GA\b|BTR[IÍ]A|BATER[IÍ]A|MLRS|RAM)\b/i

// ─── 1) El marco: hacia dónde está el enemigo y la forma del Área de Operaciones ───────────────────

// De dónde viene el enemigo (rumbo, en grados, desde el centro del A.O. hacia el enemigo).
export function direccionEnemigo({ areaOps, picb, unidades = [], cmoc, plantilla, dir } = {}) {
  const anillo = G.anilloDe(areaOps?.coords)
  const c = G.centroide(anillo)
  const elegida = DIRECCIONES.find((d) => d.id === dir && d.v != null)
  if (elegida) return { az: elegida.v, fuente: `elegida en esta hoja: el enemigo viene del ${elegida.nom.toUpperCase()}` }
  const pd = DIRECCIONES.find((d) => d.id === picb?._pd?.dirEnemigo && d.v != null)
  if (pd) return { az: pd.v, fuente: `la que eligió el G-2 en la hoja P.D.: el enemigo viene del ${pd.nom.toUpperCase()}` }
  if (!c) return null
  const lprE = (plantilla?.lineas || []).find((l) => l?.tipo === 'lpr')
  const enemigos = (unidades || []).filter(esEnemigo).map((u) => [u.lng, u.lat]).filter(G.valido)
  const P = G.proyeccion(c[0], c[1])
  const poli = anillo.map(P.a)
  const fuera = enemigos.filter((e) => !G.dentro(P.a(e), poli))
  if (fuera.length) {
    const ce = G.centroide(fuera)
    return { az: G.rumbo(c, ce), fuente: `las ${fuera.length} ficha(s) enemigas del calco están hacia allá` }
  }
  const marcas = (plantilla?.marcas || []).map((m) => m?.centro).filter(G.valido)
  if (marcas.length) return { az: G.rumbo(c, G.centroide(marcas)), fuente: 'la plantilla situacional del enemigo (G-2) está hacia allá' }
  const frente = (areaOps?.frente || lprE?.coords || []).filter(G.valido)
  if (frente.length >= 2) {
    const m = G.puntoEn(frente, 0.5)
    return { az: G.rumbo(c, m), fuente: 'el FRENTE del Área de Operaciones (el primer lado que se trazó)' }
  }
  const inicios = (cmoc?.avenidas || []).map((a) => (a?.coords || [])[0]).filter(G.valido)
  if (inicios.length) return { az: G.rumbo(c, G.centroide(inicios)), fuente: 'el origen de las avenidas de aproximación del CMOC' }
  return null
}

// El marco local: u = hacia el enemigo, t = a lo largo del frente. perfil(tt) = [fondo, frente] del A.O.
export function marco(ctx = {}) {
  const anillo = G.anilloDe(ctx.areaOps?.coords)
  if (anillo.length < 3) return { ok: false, error: 'Falta el ÁREA DE OPERACIONES: sin ella no hay frente ni fondo. Trazala con ▧ Área de Ops.' }
  const d = direccionEnemigo(ctx)
  if (!d) return { ok: false, error: 'No sé de dónde viene el enemigo: elegilo en «🧭 El enemigo viene del…».' }
  const c = G.centroide(anillo)
  const P = G.proyeccion(c[0], c[1])
  const xy = anillo.map(P.a)
  const u = G.vectorDe(d.az)
  const t = [u[1], -u[0]] // a la derecha mirando al enemigo
  const pu = ([x, y]) => x * u[0] + y * u[1]
  const pt = ([x, y]) => x * t[0] + y * t[1]
  const ts = xy.map(pt), us = xy.map(pu)
  const tmin = Math.min(...ts), tmax = Math.max(...ts)
  const desde = (tt, uu) => P.de([tt * t[0] + uu * u[0], tt * t[1] + uu * u[1]])
  const perfil = (tt) => {
    const vals = []
    for (let i = 0; i < xy.length; i++) {
      const a = xy[i], b = xy[(i + 1) % xy.length]
      const ta = pt(a), tb = pt(b)
      if ((ta - tt) * (tb - tt) > 0 || ta === tb) continue
      const k = (tt - ta) / (tb - ta)
      vals.push(pu(a) + k * (pu(b) - pu(a)))
    }
    return vals.length >= 2 ? [Math.min(...vals), Math.max(...vals)] : null
  }
  const en = (p) => { const q = P.a(p); return { t: pt(q), u: pu(q) } }
  return {
    ok: true,
    P, anillo, xy, u, t, az: d.az, fuente: d.fuente, centro: c,
    tmin, tmax, umin: Math.min(...us), umax: Math.max(...us),
    ancho: tmax - tmin, fondo: Math.max(...us) - Math.min(...us),
    perfil, desde, en,
    dentro: (p) => G.dentro(P.a(p), xy),
  }
}

// El frente (la cara del A.O. que mira al enemigo), muestreado a lo ancho.
export function frenteDe(M, n = 11) {
  const out = []
  for (let i = 0; i < n; i++) {
    const tt = M.tmin + (M.tmax - M.tmin) * (0.02 + (0.96 * i) / (n - 1))
    const pf = M.perfil(tt)
    if (pf) out.push(M.desde(tt, pf[1]))
  }
  return out
}
// Una línea paralela al frente, a `prof` km del frente hacia nuestra retaguardia (o a la fracción `frac` del fondo).
export function paralela(M, { prof = null, frac = null, n = 9, margen = 0.04 } = {}) {
  const out = []
  for (let i = 0; i < n; i++) {
    const tt = M.tmin + (M.tmax - M.tmin) * (margen + ((1 - 2 * margen) * i) / (n - 1))
    const pf = M.perfil(tt)
    if (!pf) continue
    const largoU = pf[1] - pf[0]
    const d = prof != null ? Math.min(prof, largoU * 0.9) : largoU * frac
    out.push(M.desde(tt, pf[1] - d))
  }
  return out
}

// ─── 2) Ubicar lo que nombra el texto ───────────────────────────────────────────────────────────

const ABREV = [
  [/\bEcia\.?\s*/gi, 'Estancia '],
  [/\bEst\.\s*/gi, 'Estancia '],
  [/\bCo\.\s*/g, 'Cerro '],
  [/\bVn\.\s*/gi, 'Volcán '],
  [/\bLoc\.\s*/gi, ''],
  [/\bla localidad de\s+/gi, ''],
]
const expandir = (s) => ABREV.reduce((a, [re, r]) => a.replace(re, r), String(s || ''))

export function ubicador({ lugares = [], cmoc = {}, ains = [], avenidas = [], M = null, pcs = [] } = {}) {
  const grupos = agruparLugares(lugares, (cmoc?.clave || []).filter((k) => G.valido(k?.centro)))
  const ref = M?.centro || null
  const radio = M ? Math.max(M.ancho, M.fondo) / 2 + 60 : Infinity
  const cerca = (p) => !ref || G.km(p, ref) <= radio
  return function ubicar(token, cercaDe = null) {
    const s = String(token || '')
    const n = norm(s)
    const c = coords(s)
    if (c && cerca(c)) return { p: c, por: 'coordenadas escritas' }
    let m = /\bA\.?\s*I\.?\s*N\.?\s*-?\s*(\d{1,2})\b/.exec(n)
    if (m) {
      const a = (ains || []).find((x) => Number(/(\d+)\s*$/.exec(String(x?.nom || ''))?.[1] ?? x?.n) === Number(m[1]))
      if (a && G.valido(a.centro)) return { p: a.centro.slice(0, 2), por: `la ${a.nom || `AIN-${m[1]}`} de la H.T. 20` }
    }
    m = /\bP\.?\s*C\.?\s*-?\s*(\d{1,2})\b/.exec(n)
    if (m) {
      const pc = pcs.find((x) => x.n === Number(m[1]))
      if (pc) return { p: pc.centro, por: pc.nom }
    }
    const h = lugaresNombrados(expandir(s), grupos)
    if (h.length) {
      const g = h[0]
      const r = cercaDe || ref
      let mejor = null
      for (const p of g.puntos) {
        if (!cerca(p)) continue
        const d = r ? G.km(p, r) : 0
        if (!mejor || d < mejor.d) mejor = { p, d }
      }
      if (mejor) return { p: mejor.p.slice(0, 2), por: `${g.nom}${g.clase && g.clase !== 'lugar' ? ` (${g.clase})` : ''}` }
    }
    return null
  }
}
function coords(s) {
  const m = /(-?\d{1,3}[.,]\d{2,})\s*[,;/]?\s*(-?\d{1,3}[.,]\d{2,})/.exec(String(s || ''))
  if (!m) return null
  const a = Number(m[1].replace(',', '.')), b = Number(m[2].replace(',', '.'))
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.abs(a) <= Math.abs(b) ? [b, a] : [a, b]
}
// Todos los lugares que nombra un texto, en orden, ubicados.
function lugaresDelTexto(texto, ubicar, cercaDe) {
  const out = []
  const trozos = expandir(texto).split(/\s*[–—,;()/]\s*|\s+-\s+|\s+y\s+|\s+hacia\s+|\s+en\s+/i)
  for (const tr of trozos) {
    if (tr.trim().length < 3) continue
    const r = ubicar(tr, cercaDe)
    if (r && !out.some((o) => G.km(o.p, r.p) < 0.2)) out.push({ ...r, texto: tr.trim() })
  }
  return out
}

// ─── 3) Las avenidas de aproximación (G-2) ──────────────────────────────────────────────────────

export function avenidasDe(cmoc, M) {
  return (cmoc?.avenidas || [])
    .map((a, i) => {
      let c = (a?.coords || []).filter(G.valido).map((p) => [+p[0], +p[1]])
      if (c.length < 2) return null
      // Arranca del lado del enemigo.
      if (M && M.en(c[c.length - 1]).u > M.en(c[0]).u) c = c.slice().reverse()
      const nom = a?.properties?.nombre || a?.nombre || `AA-${i + 1}`
      const num = Number(/(\d+)\s*$/.exec(String(nom))?.[1]) || i + 1
      return { i, num, nom: /^AA/i.test(nom) ? nom : `AA-${num}`, coords: c, escalon: a?.escalon || a?.properties?.escalon || '', agrupa: a?.agrupa || [] }
    })
    .filter(Boolean)
}
const PESO_ESCALON = { cuerpo: 6, division: 5, brigada: 4, regimiento: 3, batallon: 2, compania: 1 }

// ─── 4) Las fichas de la plantilla ──────────────────────────────────────────────────────────────

const EFECTOS = { bloquear: 'BLOQUEAR', fijar: 'FIJAR', canalizar: 'CANALIZAR', desviar: 'DESVIAR' }
function efectoDelTexto(t, def) {
  const n = norm(t)
  if (/\bFIJA/.test(n)) return 'fijar'
  if (/\bBLOQUE/.test(n)) return 'bloquear'
  if (/\bCANALIZ/.test(n)) return 'canalizar'
  if (/\bDESVI/.test(n)) return 'desviar'
  return def
}

// El medio que mejor bate un punto según el tipo de fuego (ver plan-fuegos.js · evaluar).
export function elegirMedio(punto, tipo, fuegos, medios) {
  if (!fuegos?.evaluar || !medios?.length) return { medio: null, nota: 'Sin medios de apoyo de fuego en el calco: asignalo en 🔥 Fuegos.' }
  const ev = fuegos.evaluar(punto, medios, null)
  if (!ev.alcanzan.length) return { medio: null, nota: ev.consejo || 'Ningún medio lo alcanza.' }
  const porAlcance = ev.alcanzan.slice().sort((a, b) => a.medio.alcance.m - b.medio.alcance.m)
  const f = tipo === 'interdiccion' || tipo === 'contrabateria' ? porAlcance[porAlcance.length - 1] : tipo === 'proteccion' ? porAlcance[0] : porAlcance[Math.floor((porAlcance.length - 1) / 2)]
  return { medio: f.medio.id, nota: `lo bate ${f.medio.nombreCompleto} (a ${G.km(f.medio.pos, punto) < 1 ? 'menos de 1 km' : fmtKm(G.km(f.medio.pos, punto))})` }
}

export function proponer(ctx = {}) {
  const avisos = []
  const M = marco({ ...ctx, dir: ctx.conceptoCarta?.dir })
  if (!M.ok) return { ok: false, error: M.error, items: [], avisos }
  const C = leerConcepto(ctx.hoja, { mision: ctx.mision || '' })
  const formaId = ctx.conceptoCarta?.forma || C.forma || 'defensa_area'
  const forma = formaDe(formaId)
  const rotulo = ctx.rotulo || ((u) => u?.designacion || '')
  const propias = (ctx.unidades || []).filter(esPropia)
  const ains = ctx.ains || ctx.ops?.ains || []
  const avs = avenidasDe(ctx.cmoc, M)
  const ubicar = ubicador({ lugares: ctx.lugares || [], cmoc: ctx.cmoc, ains, avenidas: avs, M, pcs: C.pcs })
  const items = []
  let nId = 0
  const id = () => `co-${++nId}`
  const poner = (it) => { const x = { marcado: true, ...it, id: it.id || id() }; x.obj = { ...x.obj, co: { id: x.id, rol: x.rol, grupo: x.grupo || null, ...(x.obj?.co || {}) } }; items.push(x); return x }
  const ancho = M.ancho, fondo = M.fondo
  if (C.vacio) avisos.push('La hoja todavía no tiene texto: la plantilla sale sólo de la doctrina, del calco y de lo que trabajaron los otros G. Escribí (o pedile a la IA) el concepto y volvé a proponer: lo que nombre el texto manda.')
  avisos.push(`🧭 El enemigo viene del rumbo ${Math.round(M.az)}° (${M.fuente}).`)

  // ── Medidas de control: las líneas que nombra el texto ──
  const lineasTexto = new Map()
  for (const l of C.lineas) {
    if (l.frontera) { lineasTexto.set(l.nom, { l, coords: frenteDe(M), por: 'es el frente del Área de Operaciones (la frontera / LCAF)' }); continue }
    if (!l.tramos.length) continue
    const pts = []
    let prev = null
    const por = []
    for (const tr of l.tramos) {
      const r = ubicar(tr, prev)
      if (r) { pts.push(r.p); por.push(`${tr.replace(/\s+en\s+-?\d.*$/, '')} → ${r.por}`); prev = r.p }
    }
    if (pts.length >= 2) lineasTexto.set(l.nom, { l, coords: pts, por: por.join(' · ') })
    else avisos.push(`📏 ${l.nom}: el texto nombra «${l.tramos.join(' – ')}» y no encontré ${pts.length ? 'más que un lugar' : 'esos lugares'} en los calcos del terreno. Se traza con la doctrina; corregila arrastrando sus puntos.`)
  }
  for (const l of C.lineas) if (l.refiere && !lineasTexto.has(l.nom) && lineasTexto.has(l.refiere)) lineasTexto.set(l.nom, { ...lineasTexto.get(l.refiere), alias: l.refiere })

  // La LPR / BAZR (o el LP/LD en el ataque).
  const ofensiva = forma.tipo === 'ofensiva'
  const lprTexto = lineasTexto.get('LPR') || [...lineasTexto.values()].find((x) => /^LF/.test(x.l.nom) && /RESISTENCIA|LPR/.test(norm(x.l.desc)))
  let sZona = clamp(fondo * 0.3, 2, 25)
  let lpr
  if (!ofensiva && lprTexto) {
    lpr = lprTexto.coords
    const ds = lpr.map((p) => { const e = M.en(p); const pf = M.perfil(e.t); return pf ? pf[1] - e.u : null }).filter((x) => x != null && x > 0).sort((a, b) => a - b)
    if (ds.length) sZona = ds[Math.floor(ds.length / 2)]
  } else lpr = paralela(M, { prof: ofensiva ? clamp(fondo * 0.04, 0.5, 3) : sZona })
  const nomLpr = ofensiva ? 'LP/LD' : !lprTexto ? 'LPR (BAZR)' : lprTexto.alias ? `LPR (${lprTexto.alias})` : lprTexto.l.nom === 'LPR' ? 'LPR' : `LPR (${lprTexto.l.nom})`
  poner({
    seccion: 'medidas', rol: 'lpr', grupo: 'LPR', titulo: nomLpr, capa: 'limites',
    obj: { coords: lpr, nombre: nomLpr },
    fuente: lprTexto && !ofensiva ? 'texto' : 'doctrina',
    porQue: ofensiva
      ? 'La línea de partida: desde acá el esfuerzo principal cruza con hora fija. Va pegada a nuestro frente.'
      : lprTexto
        ? `La nombra el concepto (${lprTexto.por}). Todo el plan se mide desde acá: los obstáculos y la zona de aniquilamiento van DELANTE, la reserva DETRÁS.`
        : `Borde anterior de la zona de resistencia: a ${fmtKm(sZona)} del frente (≈ 30 % del fondo del A.O., criterio de la Mesa). Delante queda la zona de seguridad. Arrastrá sus puntos para apoyarla en el terreno.`,
  })
  // Las demás líneas del texto (LDE-1, LDE-2, LR…).
  for (const [nom, x] of lineasTexto) {
    if (x === lprTexto || x.alias || (/^LF/.test(nom) && x === lprTexto)) continue
    if (lprTexto && x.coords === lprTexto.coords) continue
    poner({ seccion: 'medidas', rol: 'linea', grupo: nom, titulo: nom, capa: 'limites', obj: { coords: x.coords, nombre: nom, tipo: /^LDE|^LCAF/.test(nom) ? 'punteada' : undefined }, fuente: 'texto', porQue: `La nombra el concepto: ${x.por}.` })
  }

  // Zonas de la defensa y su límite posterior.
  const zr = Math.max(2, (fondo - sZona) * 0.45)
  if (!ofensiva) {
    const post = paralela(M, { prof: sZona + zr })
    poner({ seccion: 'medidas', rol: 'zrp', grupo: 'ZRP', titulo: 'Límite posterior de la zona de resistencia', capa: 'limites', obj: { coords: post, nombre: 'LÍM. POST. ZRP', tipo: 'punteada' }, fuente: 'doctrina', porQue: `Separa la zona de resistencia (${fmtKm(zr)} de fondo, criterio de la Mesa) de la zona de reserva, donde espera la reserva para contraatacar.` })
    // Los rótulos de las zonas, corridos del centro (ahí va el rótulo del Área de Operaciones).
    const mid = M.tmin + (M.tmax - M.tmin) * 0.3
    const pf = M.perfil(mid) || [M.umin, M.umax]
    const rot = (texto, uu, rol) => poner({ seccion: 'medidas', rol, grupo: 'ZONAS', titulo: texto, capa: 'marcas', obj: { tipo: 'rotulo', texto, centro: M.desde(mid, uu) }, fuente: 'doctrina', porQue: 'Rótulo de la zona (sólo en la carta de la Mesa).' })
    rot('ZONA DE SEGURIDAD', pf[1] - sZona / 2, 'zs')
    rot('ZONA DE RESISTENCIA PRINCIPAL', pf[1] - sZona - zr / 2, 'zrp-rot')
    rot('ZONA DE RESERVA', pf[1] - sZona - zr - Math.max(1, (pf[1] - pf[0] - sZona - zr) / 2), 'zres')
  }

  // Puntos de contacto del texto.
  for (const pc of C.pcs) poner({ seccion: 'medidas', rol: 'pc', grupo: pc.nom, titulo: pc.nom, capa: 'coordinacion', obj: { centro: pc.centro, nombre: pc.nom }, fuente: 'texto', porQue: 'Punto de contacto con coordenadas escritas en el concepto.' })

  // ── Las avenidas: cuál es del esfuerzo principal ──
  if (!avs.length) avisos.push('⚠️ El CMOC no tiene AVENIDAS DE APROXIMACIÓN: el plan de barreras y de fuegos se apoya en ellas. Generá el CMOC (G-2) y volvé a proponer.')
  const cruces = avs.map((a) => {
    const x = G.crucePolilineas(a.coords, lpr)
    const mc = G.masCercano(a.coords, x || G.puntoEn(lpr, 0.5))
    const p = x || mc?.p
    const e = M.en(p)
    // El rumbo de la avenida (del enemigo hacia nosotros) en el cruce.
    const az = mc?.az ?? (M.az + 180) % 360
    return { a, p, t: e.t, frac: mc?.frac ?? 0.5, az, cruza: !!x }
  })
  const odT = (() => {
    const od = (ctx.ops?.tareas || []).find((t) => t?.oi?.operacion === 'OD' && G.valido(t.centro))
    return od ? M.en(od.centro).t : null
  })()
  let principales = C.principal.aas.filter((n) => cruces.some((c) => c.a.num === n))
  let porQueEP = principales.length ? `el concepto pone el esfuerzo principal sobre la ${principales.map((n) => `AA-${n}`).join(' y la ')}` : ''
  if (!principales.length && cruces.length) {
    if (odT != null) {
      const c = cruces.slice().sort((a, b) => Math.abs(a.t - odT) - Math.abs(b.t - odT))[0]
      principales = [c.a.num]
      porQueEP = `es la avenida más cercana a la OD de la F3·P3`
    } else if (C.principal.lado != null) {
      const v = G.vectorDe(C.principal.lado)
      const c = cruces.slice().sort((a, b) => { const pa = M.P.a(b.p), pb = M.P.a(a.p); return pa[0] * v[0] + pa[1] * v[1] - (pb[0] * v[0] + pb[1] * v[1]) })[0]
      principales = [c.a.num]
      porQueEP = `el concepto pone el esfuerzo principal en el sector ${['norte', 'noreste', 'este', 'sudeste', 'sur', 'sudoeste', 'oeste', 'noroeste'][Math.round(C.principal.lado / 45) % 8]}`
    } else {
      const c = cruces.slice().sort((a, b) => (PESO_ESCALON[b.a.escalon] || 0) - (PESO_ESCALON[a.a.escalon] || 0) || G.largo(b.a.coords) - G.largo(a.a.coords))[0]
      principales = [c.a.num]
      porQueEP = 'es la avenida de mayor escalón (la más peligrosa); el texto no dice cuál'
    }
  }
  const secundarias = [...new Set(C.secundarios.flatMap((s) => s.aas))].filter((n) => !principales.includes(n) && cruces.some((c) => c.a.num === n))
  const rolDe = (num) => (principales.includes(num) ? 'principal' : secundarias.includes(num) ? 'secundario' : 'otra')
  const orden = cruces.slice().sort((a, b) => ({ principal: 0, secundario: 1, otra: 2 })[rolDe(a.a.num)] - ({ principal: 0, secundario: 1, otra: 2 })[rolDe(b.a.num)])

  // Las unidades que nombra el texto para cada esfuerzo.
  const uni = (t) => (t ? (ctx.unidadesNombradas ? ctx.unidadesNombradas(t) : []) : [])
  const uEP = uni(C.c.principal)[0] || null
  const uES = C.secundarios.map((s) => uni(s.texto)[0] || null)
  const uRES = uni(C.c.reserva)[0] || null

  // ── Sectores: el límite entre el esfuerzo principal y los secundarios ──
  if (!ofensiva) {
    const tEP = cruces.filter((c) => principales.includes(c.a.num)).map((c) => c.t)
    const tES = cruces.filter((c) => secundarias.includes(c.a.num)).map((c) => c.t)
    if (tEP.length && tES.length) {
      const epMax = Math.max(...tEP), epMin = Math.min(...tEP), esMax = Math.max(...tES), esMin = Math.min(...tES)
      const tl = esMin > epMax ? (epMax + esMin) / 2 : esMax < epMin ? (esMax + epMin) / 2 : null
      if (tl != null) {
        const pf = M.perfil(tl)
        if (pf) {
          const coords = [M.desde(tl, pf[1]), M.desde(tl, pf[1] - sZona - zr)]
          const nom = `LÍM. ${uEP ? rotulo(uEP) : 'EP'} / ${uES[0] ? rotulo(uES[0]) : 'ES'}`
          poner({ seccion: 'maniobra', rol: 'limite-sector', grupo: 'SECTORES', titulo: nom, capa: 'limites', obj: { coords, nombre: nom }, fuente: 'doctrina', porQue: 'Separa el sector del esfuerzo principal del secundario, entre sus avenidas: cada uno defiende la suya.' })
          if (!C.pcs.length) {
            const pc = G.crucePolilineas(coords, lpr) || coords[0]
            poner({ seccion: 'maniobra', rol: 'pc', grupo: 'SECTORES', titulo: 'PC-1', capa: 'coordinacion', obj: { centro: pc, nombre: 'PC-1' }, fuente: 'doctrina', porQue: 'Punto de contacto donde el límite entre los sectores corta la LPR.' })
          }
        }
      }
    }
    // Rótulos de los esfuerzos, detrás de la LPR sobre su avenida.
    for (const c of orden) {
      const r = rolDe(c.a.num)
      if (r === 'otra') continue
      const pf = M.perfil(c.t)
      if (!pf) continue
      const u = r === 'principal' ? uEP : uES[secundarias.indexOf(c.a.num)] || uES[0]
      const texto = `${r === 'principal' ? 'ESFUERZO PRINCIPAL' : 'ESFUERZO SECUNDARIO'}${u ? ` · ${rotulo(u)}` : ''}`
      if (items.some((i) => i.capa === 'marcas' && i.obj.texto === texto)) continue
      poner({ seccion: 'maniobra', rol: r === 'principal' ? 'ep' : 'es', grupo: `ESF-${c.a.num}`, titulo: `${texto} (${c.a.nom})`, capa: 'marcas', obj: { tipo: 'esfuerzo', texto, clase: r, centro: M.desde(c.t, pf[1] - sZona - Math.min(zr * 0.35, 6)) }, fuente: u ? 'texto' : 'doctrina', porQue: r === 'principal' ? `Esfuerzo principal: ${porQueEP}.` : 'Esfuerzo secundario: lo nombra el concepto.' })
    }
  }

  // ── Plan de barreras: una zona de obstáculos por avenida (la principal, más densa) ──
  const anchoZO = clamp(ancho * 0.1, 2, 10)
  const usadas = new Set()
  const zosTexto = C.zos.map((z) => {
    const ls = lugaresDelTexto(z.texto, ubicar, null)
    let p = null, por = ''
    if (ls.length >= 2 && G.km(ls[0].p, ls[1].p) < 40) { p = [(ls[0].p[0] + ls[1].p[0]) / 2, (ls[0].p[1] + ls[1].p[1]) / 2]; por = `entre ${ls[0].texto} y ${ls[1].texto}` }
    else if (ls.length) { p = ls[0].p; por = `en ${ls[0].texto}` }
    return { ...z, p, por, efecto: efectoDelTexto(z.texto, null) }
  })
  let nZO = Math.max(0, ...C.zos.map((z) => z.n))
  let nZA = 0
  const plan = []
  const ZOs = []
  for (const c of orden.slice(0, 4)) {
    const r = rolDe(c.a.num)
    const k = r === 'principal' ? 1 : r === 'secundario' ? 0.75 : 0.6
    const Lz = anchoZO * k
    const Az = Lz * 0.5
    // ¿La nombra el texto? La ZO del texto que queda más cerca de esta avenida (a menos de 15 km).
    let zt = null
    for (const z of zosTexto) {
      if (usadas.has(z.n) || !z.p) continue
      const mc = G.masCercano(c.a.coords, z.p)
      if (mc && mc.d <= 15 && (!zt || mc.d < zt.d)) zt = { ...z, d: mc.d, sobre: mc }
    }
    if (!zt && r === 'principal') {
      const sinLugar = zosTexto.find((z) => !usadas.has(z.n) && !z.p)
      if (sinLugar) zt = { ...sinLugar, d: null }
    }
    if (zt) usadas.add(zt.n)
    const nom = zt ? zt.nom : `ZO-${++nZO}`
    // El centro: donde dice el texto (sobre la avenida), o delante de la LPR.
    const delante = clamp(sZona * 0.35, 1.5, 8) * (r === 'principal' ? 1 : 0.85)
    let C0, az
    if (zt?.sobre) { C0 = zt.sobre.d < 3 ? zt.p : zt.sobre.p; az = zt.sobre.az }
    else {
      const L = G.largo(c.a.coords) || 1
      const f = clamp(c.frac - delante / L, 0, 1)
      C0 = G.puntoEn(c.a.coords, f)
      az = G.masCercano(c.a.coords, C0)?.az ?? c.az
    }
    const azEn = (az + 180) % 360 // hacia el enemigo
    const grupo = nom
    const efecto = zt?.efecto || (r === 'principal' ? 'bloquear' : r === 'secundario' ? 'fijar' : 'desviar')
    const porZO = zt ? `La nombra el concepto${zt.por ? ` (${zt.por})` : ''}` : `Sobre la ${c.a.nom}, ${fmtKm(delante)} delante de la LPR (criterio de la Mesa)`
    ZOs.push({ nom, centro: C0, az, Lz, Az, rol: r, aa: c.a, efecto, cruce: c })
    poner({ seccion: 'barreras', rol: 'zo', grupo, titulo: `${nom} — zona de obstáculos (${c.a.nom})`, capa: 'limites', obj: { coords: cerrar(G.rectangulo(C0, Lz, Az, az + 90)), nombre: nom, tipo: 'punteada' }, fuente: zt ? 'texto' : 'doctrina', porQue: `${porZO}. Atraviesa la avenida (${fmtKm(Lz)} × ${fmtKm(Az)}): es donde el obstáculo y el fuego detienen al enemigo antes de la LPR.` })
    poner({ seccion: 'barreras', rol: 'efecto', grupo, titulo: `${nom} — efecto: ${EFECTOS[efecto]}`, capa: 'marcas', obj: { tipo: 'efecto', tarea: efecto, texto: `${nom} · ${EFECTOS[efecto]}`, centro: G.desplazar(C0, Az * 0.9, (az + 90) % 360), rot: azEn }, fuente: zt?.efecto ? 'texto' : 'doctrina', porQue: { bloquear: 'BLOQUEAR: que no pase por esta avenida (la del esfuerzo principal).', fijar: 'FIJAR: detenerlo en la zona de aniquilamiento para batirlo con fuego.', canalizar: 'CANALIZAR: llevarlo adonde lo esperan los fuegos.', desviar: 'DESVIAR: sacarlo de esta avenida hacia otra menos favorable.' }[efecto] })
    // Las medidas de cada obstáculo: lo que dice el texto (minas, rollos) o una fracción de la zona.
    const delTexto = !!zt
    const minas = delTexto ? C.cantidades.minasAC : null
    const rollos = delTexto ? C.cantidades.concertina : null
    const Fm = minas ? clamp(minas / 1000, 0.5, Lz * 0.9) : clamp(Lz * 0.45, 0.5, 3)
    const Fc = rollos ? clamp((rollos * 15) / 3 / 1000, 0.3, Lz * 0.9) : Fm * 0.8
    const minado = r === 'principal' ? 'minado_ac' : 'minado_mixto'
    const cMin = G.desplazar(C0, 0.3, azEn)
    poner({ seccion: 'barreras', rol: 'obstaculo', grupo, titulo: `${nom} — ${r === 'principal' ? 'Campo minado anticarro' : 'Campo minado mixto'}`, capa: 'obstaculos', obj: { tipo: minado, estado: 'proyectado', coords: G.rectangulo(cMin, Fm, 0.3, az + 90) }, fuente: minas ? 'texto' : 'doctrina', porQue: `${minas ? `El concepto asigna ${minas.toLocaleString('es')} minas AC: ≈ ${fmtKm(Fm)} de frente a 1 mina por metro (criterio de la Mesa; corregilo con la densidad que fije ingeniería). ` : `${fmtKm(Fm)} × 300 m (criterio de la Mesa). `}Delante de la zona, contra blindados: batido por el fuego y registrado.` })
    if (r !== 'otra') poner({ seccion: 'barreras', rol: 'obstaculo', grupo, titulo: `${nom} — ${r === 'principal' ? 'Concertina triple' : 'Alambrada doble'}`, capa: 'obstaculos', obj: { tipo: r === 'principal' ? 'concertina_triple' : 'alambre_doble', estado: 'proyectado', coords: G.segmento(G.desplazar(C0, 0.15, az), Fc, az + 90) }, fuente: rollos ? 'texto' : 'doctrina', porQue: `${rollos ? `${rollos} rollos de concertina en el concepto: ≈ ${fmtKm(Fc)} de concertina triple (15 m por rollo, 3 rollos por tramo). ` : ''}Detrás del minado: protege a las minas de los zapadores enemigos.` })
    if (C.blindado && r !== 'otra') poner({ seccion: 'barreras', rol: 'obstaculo', grupo, titulo: `${nom} — Zanja antitanque`, capa: 'obstaculos', obj: { tipo: 'zanja_at', estado: 'proyectado', coords: G.segmento(G.desplazar(C0, 0.5, az), Fm, az + 90) }, fuente: 'doctrina', porQue: 'El enemigo es blindado/mecanizado: la zanja cierra la avenida detrás del minado (los dientes hacia el enemigo).' })
    if ((C.demoliciones || r === 'principal') && r !== 'otra') poner({ seccion: 'barreras', rol: 'obstaculo', grupo, titulo: `${nom} — Demolición`, capa: 'obstaculos', obj: { tipo: 'demolicion', estado: 'proyectado', centro: G.desplazar(C0, 0.9, azEn) }, fuente: C.demoliciones ? 'texto' : 'doctrina', porQue: `${C.demoliciones ? 'El concepto prevé voladuras. ' : ''}Sobre el camino, en la boca de la zona: corta el paso por la avenida.` })

    // La zona de aniquilamiento: el área de empeñamiento del G-2 sobre esta avenida, o una nueva.
    const aeG2 = (ctx.cmoc?.ae || [])
      .map((a, i) => ({ a, i, anillo: G.anilloDe(a?.coords || a?.puntos || a?.geometry?.coordinates) }))
      .filter((x) => x.anillo.length >= 3)
      .map((x) => ({ ...x, c: G.centroide(x.anillo) }))
      .filter((x) => G.km(x.c, C0) <= Math.max(6, Lz * 1.5))
      .sort((a, b) => G.km(a.c, C0) - G.km(b.c, C0))[0]
    const nomZA = `ZA-${++nZA}`
    let cZA = G.desplazar(C0, 0.6, azEn)
    if (aeG2) {
      cZA = aeG2.c
      poner({ seccion: 'barreras', rol: 'za', grupo, titulo: `${nomZA} — zona de aniquilamiento (es el ${aeG2.a?.nombre || aeG2.a?.etiqueta || `AE ${aeG2.i + 1}`} del G-2)`, capa: 'marcas', obj: { tipo: 'rotulo', texto: `${nomZA}`, centro: cZA }, fuente: 'G-2', porQue: 'El G-2 ya la identificó como área de empeñamiento: se usa ésa, no se inventa otra.' })
    } else if (r !== 'otra') {
      poner({ seccion: 'barreras', rol: 'za', grupo, titulo: `${nomZA} — zona de aniquilamiento (${c.a.nom})`, capa: 'limites', obj: { coords: cerrar(G.rectangulo(cZA, Math.min(Lz, Fm * 1.6), Math.min(Az, 2.5), az + 90)), nombre: nomZA, tipo: 'punteada' }, fuente: 'doctrina', porQue: `Donde el obstáculo detiene al enemigo y lo baten todos los fuegos. ${C.fuegos.texto && /ANIQUILAM/.test(norm(C.fuegos.texto)) ? 'El concepto la nombra en los fuegos.' : ''}` })
    }
    // Sus fuegos: la zona de aniquilamiento y la FPF delante de la LPR.
    plan.push({
      grupo, punto: G.desplazar(C0, 0.3, azEn), tipo: 'apoyo', efecto: r === 'principal' ? 'destruir' : 'neutralizar', ejecucion: r === 'principal' ? 'prioritario' : 'a_pedido', forma: 'rectangular',
      largoM: Math.round(clamp(Fm, 0.4, 2) * 1000), anchoM: 600, orientacion: (az + 90) % 360,
      descripcion: `${nomZA} sobre la ${c.a.nom}: el enemigo detenido por la ${nom}`, proposito: r === 'principal' ? 'Destruir al primer escalón en la zona de aniquilamiento antes de la LPR.' : 'Neutralizar lo que el obstáculo detenga.',
      titulo: `${nomZA} — concentración sobre la zona de aniquilamiento`, porQue: 'Un obstáculo que no se bate no detiene: el enemigo lo levanta tranquilo. Esta concentración cubre la zona y el obstáculo.',
    })
    if (r !== 'otra') {
      const pFPF = G.desplazar(c.p, clamp(sZona * 0.04, 0.4, 1), azEn)
      plan.push({
        grupo: `FPF-${c.a.num}`, punto: pFPF, tipo: 'proteccion', efecto: 'destruir', ejecucion: 'prioritario', forma: 'lineal', largoM: r === 'principal' ? 600 : 400, orientacion: (c.az + 90) % 360,
        descripcion: `FPF delante de la LPR sobre la ${c.a.nom}`, proposito: 'Cortar el asalto delante de la LPR.',
        titulo: `FPF — protección final delante de la LPR (${c.a.nom})`, porQue: 'La última cortina de fuego antes del asalto: delante de la LPR, sobre la avenida. Queda apuntada (prioritario) mientras no tira otra.',
      })
    }
    // Interdicción profunda sobre la avenida, del lado del enemigo: en la A.I.N. que esté sobre ella.
    const ain = ains.filter((a) => G.valido(a?.centro)).map((a) => ({ a, d: G.masCercano(c.a.coords, a.centro)?.d ?? 99 })).filter((x) => x.d <= 8).sort((a, b) => M.en(b.a.centro).u - M.en(a.a.centro).u)[0]
    const pDeep = ain ? ain.a.centro.slice(0, 2) : G.puntoEn(c.a.coords, Math.max(0, c.frac - (sZona + 6) / (G.largo(c.a.coords) || 1)))
    plan.push({
      grupo: `INT-${c.a.num}`, punto: pDeep, tipo: 'interdiccion', efecto: 'neutralizar', ejecucion: 'a_pedido', forma: 'circular', radioM: 400,
      descripcion: ain ? `${ain.a.nom || 'A.I.N.'} sobre la ${c.a.nom}` : `${c.a.nom} en profundidad`, proposito: 'Desgastar y demorar al enemigo antes de que llegue a la zona de seguridad.',
      fase: ain ? `Al confirmarse el indicador de la ${ain.a.nom || 'A.I.N.'}` : '',
      titulo: `Interdicción sobre la ${c.a.nom}${ain ? ` (${ain.a.nom || 'A.I.N.'})` : ''}`, porQue: ain ? 'La A.I.N. del G-2 sobre esta avenida: cuando se confirma el indicador, se tira acá.' : 'En profundidad sobre la avenida, del lado del enemigo.',
    })
  }
  for (const z of zosTexto) if (!usadas.has(z.n)) avisos.push(`🚧 ${z.nom}: ${z.p ? `queda en ${z.por}, lejos de toda avenida de aproximación` : 'no encontré el lugar que nombra el texto en los calcos del terreno'}. Agregala con la paleta (▨ Zona de obstáculos) donde va.`)

  // A.I.N. que nombran los fuegos y no quedaron cubiertas.
  for (const n of C.fuegos.ains) {
    const a = ains.find((x) => Number(/(\d+)\s*$/.exec(String(x?.nom || ''))?.[1] ?? x?.n) === n)
    if (!a || !G.valido(a.centro)) { avisos.push(`🎯 Los fuegos nombran la AIN-${n} y no está acostada en la carta (H.T. 20 → ◎ Acostar las A.I.N.).`); continue }
    if (plan.some((p) => G.km(p.punto, a.centro) < 0.5)) continue
    plan.push({ grupo: `AIN-${n}`, punto: a.centro.slice(0, 2), tipo: 'interdiccion', efecto: 'neutralizar', ejecucion: 'a_pedido', forma: 'circular', radioM: 400, descripcion: `${a.nom || `AIN-${n}`}`, proposito: 'Lo que pide el concepto de fuegos.', fase: `Al confirmarse el indicador de la ${a.nom || `AIN-${n}`}`, titulo: `Interdicción sobre la ${a.nom || `AIN-${n}`}`, porQue: 'La nombra el concepto de fuegos.', fuente: 'texto' })
  }

  // Contrabatería: la artillería enemiga ubicada (fichas y plantilla situacional).
  const artEn = [
    ...(ctx.unidades || []).filter((u) => esEnemigo(u) && (ARMAS_FUEGO.test(u.arma || '') || ES_ART_ENEMIGA.test(u.designacion || ''))).map((u) => ({ p: [u.lng, u.lat], nom: rotulo(u) })),
    ...(ctx.plantilla?.marcas || []).filter((m) => /artiller|lanzacoh/i.test(`${m?.rol || ''} ${m?.arma || ''}`) && G.valido(m.centro)).map((m) => ({ p: m.centro.slice(0, 2), nom: m.nom || m.etiqueta || 'Artillería (plantilla)' })),
  ].filter((x) => G.valido(x.p))
  const vistos = []
  for (const a of artEn) {
    if (vistos.some((v) => G.km(v, a.p) < 1.5) || vistos.length >= 4) continue
    vistos.push(a.p)
    plan.push({ grupo: 'CB', punto: a.p, tipo: 'contrabateria', efecto: 'neutralizar', ejecucion: 'a_pedido', forma: 'circular', radioM: 400, descripcion: a.nom, proposito: 'Neutralizar la artillería enemiga antes de que bata nuestras posiciones, PC y la reserva.', titulo: `Contrabatería — ${a.nom}`, porQue: 'Artillería enemiga ubicada por el G-2.', fuente: 'G-2' })
  }
  if (C.fuegos.contrabateria && !artEn.length) avisos.push('🎯 El concepto pide CONTRABATERÍA y en el calco no hay artillería enemiga ubicada (ni fichas ni plantilla situacional): pedísela al G-2 o marcá la concentración con la paleta (◎).')

  // ── Reserva ──
  const pfEP = (() => { const c = cruces.find((x) => principales.includes(x.a.num)); return c || cruces[0] || null })()
  const resF3 = ctx.g3?.organizacionInicial?.reserva?.pos
  let posRes = null, porRes = ''
  if (G.valido(resF3)) { posRes = resF3.slice(0, 2); porRes = 'donde la dejó la F3·P3' }
  if (!posRes && C.reserva.texto) {
    const tr = /UBICACI[OÓ]N\s*:?([^.]*(?:\.[^.]*)?)/i.exec(C.reserva.texto)?.[1] || C.reserva.texto
    const ls = lugaresDelTexto(tr, ubicar, null)
    if (ls.length) { posRes = ls[0].p; porRes = `la ubica el concepto (${ls[0].texto})` }
  }
  if (!posRes) {
    const tt = pfEP ? pfEP.t : (M.tmin + M.tmax) / 2
    const pf = M.perfil(tt) || [M.umin, M.umax]
    posRes = M.desde(tt, pf[1] - sZona - zr - Math.max(1.5, (pf[1] - pf[0] - sZona - zr) * 0.35))
    porRes = 'a retaguardia del esfuerzo principal, en la zona de reserva (criterio de la Mesa)'
  }
  if (!ofensiva) {
    poner({ seccion: 'maniobra', rol: 'reserva', grupo: 'RES', titulo: `Reserva${uRES ? ` — ${rotulo(uRES)}` : ''}`, capa: 'marcas', obj: { tipo: 'reserva', texto: `RES${uRES ? ` · ${rotulo(uRES)}` : ''}`, centro: posRes }, fuente: porRes.startsWith('la ubica') ? 'texto' : porRes.includes('F3·P3') ? 'F3·P3' : 'doctrina', porQue: `Reserva ${porRes}. Fuera del alcance de la artillería enemiga si se puede, y con un eje libre de obstáculos propios hacia la penetración.` })
    let nCA = 0, nBL = 0
    for (const e of C.reserva.ejes) {
      const pa = ubicar(e.a, posRes), pb = ubicar(e.b, posRes)
      const pts = [pa, pb].filter(Boolean).map((x) => x.p)
      if (!pts.length) { avisos.push(`⚔️ El eje «${e.texto}» de la reserva: no encontré ${e.a} ni ${e.b} en los calcos del terreno.`); continue }
      pts.sort((a, b) => M.en(a).u - M.en(b).u)
      const coords = [posRes, ...pts.filter((p) => G.km(p, posRes) > 1)]
      if (coords.length < 2) continue
      const antes = norm(C.reserva.texto.slice(Math.max(0, C.reserva.texto.indexOf(e.texto) - 90), C.reserva.texto.indexOf(e.texto)))
      const bloq = /BLOQUE/.test(antes) && !/CONTRAATAQ/.test(antes)
      const nom = bloq ? `EJE BLQ-${++nBL}` : `EJE CA-${++nCA}`
      poner({ seccion: 'maniobra', rol: bloq ? 'eje-bloqueo' : 'eje-ca', grupo: nom, titulo: `${nom} (${e.a} – ${e.b})`, capa: 'limites', obj: { coords, nombre: nom, tipo: 'flecha' }, fuente: 'texto', porQue: `Lo nombra el concepto: «${e.texto}».` })
      if (bloq) poner({ seccion: 'maniobra', rol: 'pb', grupo: nom, titulo: `PB-${nBL} — posición de bloqueo de la reserva`, capa: 'marcas', obj: { tipo: 'efecto', tarea: 'bloquear', texto: `PB-${nBL} (RES)`, centro: coords[coords.length - 1], rot: M.az }, fuente: 'texto', porQue: 'Donde la reserva bloquea si el enemigo irrumpe.' })
    }
    if (!nCA && pfEP) {
      const obj = G.desplazar(pfEP.p, clamp(zr * 0.25, 1, 5), pfEP.az)
      poner({ seccion: 'maniobra', rol: 'eje-ca', grupo: 'EJE CA-1', titulo: 'EJE CA-1 — contraataque de la reserva', capa: 'limites', obj: { coords: [posRes, obj], nombre: 'EJE CA-1', tipo: 'flecha' }, fuente: 'doctrina', porQue: `Desde la reserva hacia donde la ${pfEP.a.nom} cruza la LPR: es por donde el enemigo intentaría irrumpir.` })
      plan.push({ grupo: 'EJE CA-1', punto: obj, tipo: 'apoyo', efecto: 'neutralizar', ejecucion: 'a_pedido', forma: 'circular', radioM: 300, descripcion: 'Objetivo del contraataque', proposito: 'Apoyar el contraataque de la reserva.', titulo: 'Apoyo al contraataque (EJE CA-1)', porQue: 'Fuego que acompaña a la reserva cuando contraataca.' })
    }
    if (!nBL && pfEP && forma.id !== 'defensa_movil') {
      const p = G.desplazar(pfEP.p, Math.min(zr * 0.7, G.km(pfEP.p, posRes) * 0.6), pfEP.az)
      poner({ seccion: 'maniobra', rol: 'pb', grupo: 'PB-1', titulo: 'PB-1 — posición de bloqueo de la reserva', capa: 'marcas', obj: { tipo: 'efecto', tarea: 'bloquear', texto: 'PB-1 (RES)', centro: p, rot: M.az }, fuente: 'doctrina', porQue: `En profundidad sobre la ${pfEP.a.nom}: si el enemigo irrumpe, la reserva lo bloquea acá.` })
    }
  }

  // ── El plan de fuegos: numerar y asignar quién bate cada concentración ──
  const fuegos = ctx.fuegos || null
  const medios = ctx.medios || []
  for (const f of plan) {
    const { medio, nota } = elegirMedio(f.punto, f.tipo, fuegos, medios)
    const { punto, titulo, porQue, grupo, fuente, ...datos } = f
    poner({
      seccion: 'fuegos', rol: f.tipo === 'proteccion' ? 'fpf' : f.tipo === 'contrabateria' ? 'cb' : 'ab', grupo, titulo, capa: 'blancos',
      obj: { lng: G.r6(punto[0]), lat: G.r6(punto[1]), forma: 'circular', radioM: 300, largoM: 400, anchoM: 200, orientacion: 0, ...datos, medio, obs: nota },
      fuente: fuente || 'doctrina', porQue: `${porQue} ${medio ? `✓ ${nota}.` : `⚠️ ${nota}`}`,
    })
  }
  if (!medios.length) avisos.push('🎯 No hay medios de apoyo de fuego con posición en el calco: las concentraciones quedan sin asignar (en fucsia en 🔥 Fuegos). Poné la artillería (fichas o la Organización de la Tarea) y volvé a proponer.')

  // Sugerencias para las fichas de las unidades (no se mueven solas).
  const sugerencias = []
  const sugerir = (u, p, que) => u && G.valido([u.lng, u.lat]) && G.km([u.lng, u.lat], p) > Math.max(3, ancho * 0.08) && sugerencias.push({ id: u.id, nom: rotulo(u), destino: p, texto: `${rotulo(u)} está a ${fmtKm(G.km([u.lng, u.lat], p))} de ${que}` })
  if (!ofensiva) {
    const ep = items.find((i) => i.rol === 'ep')
    if (ep) sugerir(uEP, ep.obj.centro, 'su sector (esfuerzo principal)')
    const es = items.find((i) => i.rol === 'es')
    if (es) sugerir(uES[0], es.obj.centro, 'su sector (esfuerzo secundario)')
    sugerir(uRES, posRes, 'la posición de la reserva')
  }
  return { ok: true, forma: forma.id, formaNom: forma.nom, leido: C, marco: { az: M.az, fuente: M.fuente, sZona, zr, ancho, fondo }, items, avisos, sugerencias, principales, secundarias, avenidas: avs.map((a) => ({ num: a.num, nom: a.nom, rol: rolDe(a.num) })) }
}
const cerrar = (anillo) => [...anillo, anillo[0]]

// ─── 5) Ponerla en el calco ─────────────────────────────────────────────────────────────────────

export const CAPAS_OPS = ['limites', 'coordinacion', 'obstaculos']
export const esDelConcepto = (x) => !!(x && x.co && x.co.id)

// Saca lo que puso la plantilla antes y pone lo marcado. Devuelve { ops, plan, marcas }.
export function aplicar({ ops = {}, plan = {}, marcas = [] } = {}, items = [], { reemplazar = true, fuegos = null } = {}) {
  const sel = items.filter((i) => i.marcado !== false)
  const nuevoOps = { ...ops }
  for (const k of CAPAS_OPS) {
    const base = (ops[k] || []).filter((x) => !(reemplazar && esDelConcepto(x)))
    nuevoOps[k] = [...base, ...sel.filter((i) => i.capa === k).map((i) => i.obj)]
  }
  const blancos = ((plan && plan.blancos) || []).filter((b) => !(reemplazar && esDelConcepto(b)))
  let num = 9
  for (const b of blancos) { const m = /^\s*AB\s*-?\s*(\d+)\s*$/i.exec(String(b.num || '')); if (m) num = Math.max(num, Number(m[1])) }
  const ahora = new Date().toISOString()
  const nuevos = sel.filter((i) => i.capa === 'blancos').map((i) => ({
    id: `pf-${i.id}-${Date.now().toString(36)}`, num: `AB-${String(++num).padStart(3, '0')}`, cota: null, tipo: 'apoyo', efecto: 'neutralizar', ejecucion: 'a_pedido', medio: null,
    descripcion: '', fase: '', hora: '', municion: '', espoleta: '', volumen: '', observador: '', proposito: '', obs: '', creado: ahora, ...i.obj,
  }))
  const nuevoPlan = { version: 1, medios: {}, verEnCarta: true, ...(plan || {}), blancos: [...blancos, ...nuevos] }
  const nuevasMarcas = [...(marcas || []).filter((m) => !(reemplazar && esDelConcepto(m))), ...sel.filter((i) => i.capa === 'marcas').map((i) => ({ ...i.obj, id: i.id }))]
  return { ops: nuevoOps, plan: nuevoPlan, marcas: nuevasMarcas, puestos: sel.length, blancos: nuevos.map((b) => b.num) }
}

// Lo que hay del concepto en el calco, por sección.
export function enElCalco({ ops = {}, plan = {}, marcas = [] } = {}) {
  const out = []
  for (const k of CAPAS_OPS) (ops[k] || []).forEach((x, idx) => esDelConcepto(x) && out.push({ capa: k, idx, obj: x }))
  for (const b of (plan && plan.blancos) || []) if (esDelConcepto(b)) out.push({ capa: 'blancos', id: b.id, obj: b })
  for (const m of marcas || []) out.push({ capa: 'marcas', id: m.id, obj: m })
  return out
}

// ─── 6) Mover, agrandar, girar (un elemento o su grupo) ─────────────────────────────────────────

// El centro de cualquier pieza (para las manijas y para girar/escalar a su alrededor).
export function centroDe(capa, obj) {
  if (!obj) return null
  if (capa === 'blancos') return [obj.lng, obj.lat]
  if (G.valido(obj.centro)) return obj.centro.slice(0, 2)
  const c = (obj.coords || []).filter(G.valido)
  if (!c.length) return null
  const cerrado = c.length > 3 && c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1]
  return G.centroide(cerrado ? c.slice(0, -1) : c)
}
// Un radio en km que abarca la pieza (para poner la manija de agrandar).
export function radioDe(capa, obj) {
  const c = centroDe(capa, obj)
  if (!c) return 0.5
  if (capa === 'blancos') {
    if (obj.forma === 'circular') return Math.max(0.15, (Number(obj.radioM) || 100) / 1000)
    if (obj.forma === 'rectangular' || obj.forma === 'lineal') return Math.max(0.15, (Number(obj.largoM) || 400) / 2000)
    return 0.3
  }
  const pts = (obj.coords || []).filter(G.valido)
  if (!pts.length) return 0.4 * (obj.escala || 1)
  return Math.max(0.15, ...pts.map((p) => G.km(c, p)))
}

// Aplica { piv, dx, dy (km), escala, giro (°) } a una pieza.
export function transformar(capa, obj, tr) {
  const T = (p) => (G.valido(p) ? G.transformarPunto(p, tr) : p)
  const escala = tr.escala || 1
  const giro = tr.giro || 0
  if (capa === 'blancos') {
    const [lng, lat] = T([obj.lng, obj.lat])
    const k = (v) => (Number.isFinite(Number(v)) ? Math.max(10, Math.round(Number(v) * escala)) : v)
    return { ...obj, lng, lat, cota: tr.dx || tr.dy || giro ? null : obj.cota, radioM: k(obj.radioM), largoM: k(obj.largoM), anchoM: k(obj.anchoM), orientacion: ((((Number(obj.orientacion) || 0) + giro) % 360) + 360) % 360 }
  }
  const out = { ...obj }
  if (G.valido(obj.centro)) out.centro = T(obj.centro)
  if (Array.isArray(obj.coords)) out.coords = obj.coords.map(T)
  if (capa === 'marcas') {
    if (Number.isFinite(obj.rot)) out.rot = (((obj.rot + giro) % 360) + 360) % 360
    if (escala !== 1) out.escala = Math.max(0.4, Math.min(4, (obj.escala || 1) * escala))
  }
  return out
}

// Cambia una pieza (o todo su grupo) en el estado { ops, plan, marcas }.
//   ref: { capa, idx } para las ops; { capa: 'blancos'|'marcas', id }. `grupo`: true (el de la pieza) o el
//   nombre del grupo (para cambiar por separado las ops, el plan y las marcas, que guarda cada uno su estado).
export function moverPieza(estado, ref, tr, { grupo = false } = {}) {
  const { ops = {}, plan = {}, marcas = [] } = estado
  const obj = objetoDe(estado, ref)
  const g = typeof grupo === 'string' ? grupo : grupo && obj?.co?.grupo ? obj.co.grupo : null
  if (!obj && !g) return estado
  const toca = (x, esEste) => esEste || (g && x?.co?.grupo === g)
  const nuevoOps = { ...ops }
  for (const k of CAPAS_OPS) {
    if (!Array.isArray(ops[k])) continue
    let cambio = false
    const arr = ops[k].map((x, i) => {
      if (!toca(x, ref.capa === k && ref.idx === i)) return x
      cambio = true
      return transformar(k, x, tr)
    })
    if (cambio) nuevoOps[k] = arr
  }
  const bl = (plan.blancos || []).map((b) => (toca(b, ref.capa === 'blancos' && ref.id === b.id) ? transformar('blancos', b, tr) : b))
  const mc = (marcas || []).map((m) => (toca(m, ref.capa === 'marcas' && ref.id === m.id) ? transformar('marcas', m, tr) : m))
  return { ops: nuevoOps, plan: { ...plan, blancos: bl }, marcas: mc }
}
export function objetoDe({ ops = {}, plan = {}, marcas = [] } = {}, ref = {}) {
  if (ref.capa === 'blancos') return (plan.blancos || []).find((b) => b.id === ref.id) || null
  if (ref.capa === 'marcas') return (marcas || []).find((m) => m.id === ref.id) || null
  return (ops[ref.capa] || [])[ref.idx] || null
}
export function borrarPieza(estado, ref, { grupo = false } = {}) {
  const { ops = {}, plan = {}, marcas = [] } = estado
  const obj = objetoDe(estado, ref)
  const g = typeof grupo === 'string' ? grupo : grupo && obj?.co?.grupo ? obj.co.grupo : null
  if (!obj && !g) return estado
  const queda = (x, esEste) => !(esEste || (g && x?.co?.grupo === g))
  const nuevoOps = { ...ops }
  for (const k of CAPAS_OPS) if (Array.isArray(ops[k])) nuevoOps[k] = ops[k].filter((x, i) => queda(x, ref.capa === k && ref.idx === i))
  return {
    ops: nuevoOps,
    plan: { ...plan, blancos: (plan.blancos || []).filter((b) => queda(b, ref.capa === 'blancos' && ref.id === b.id)) },
    marcas: (marcas || []).filter((m) => queda(m, ref.capa === 'marcas' && ref.id === m.id)),
  }
}

// ─── 7) Agregar a mano desde la paleta ──────────────────────────────────────────────────────────

// Las fichas que pone una herramienta de la paleta en el punto p (orientadas a la avenida más cercana).
export function piezasDePaleta(tipo, p, ctx = {}) {
  const M = marco({ ...ctx, dir: ctx.conceptoCarta?.dir })
  const avs = M.ok ? avenidasDe(ctx.cmoc, M) : []
  let az = M.ok ? (M.az + 180) % 360 : 90
  let aa = null
  for (const a of avs) { const mc = G.masCercano(a.coords, p); if (mc && mc.d < 10 && (!aa || mc.d < aa.d)) aa = { ...mc, a } }
  if (aa) az = aa.az
  const azEn = (az + 180) % 360
  const anchoZO = M.ok ? clamp(M.ancho * 0.1, 2, 10) : 3
  const sello = `m${Date.now().toString(36)}`
  let n = 0
  const it = (o) => ({ marcado: true, fuente: 'a mano', porQue: 'Agregada a mano.', ...o, id: `co-${sello}-${++n}`, obj: { ...o.obj, co: { id: `co-${sello}-${n}`, rol: o.rol, grupo: o.grupo || `${sello}` } } })
  const existentes = (ctx.ops?.limites || []).map((l) => l?.nombre || '')
  const prox = (pref) => { let k = 1; while (existentes.some((x) => new RegExp(`^${pref}-${k}\\b`).test(x))) k++; return `${pref}-${k}` }
  const grupo = sello
  if (tipo === 'zo') {
    const Lz = anchoZO, Az = Lz * 0.5, nom = prox('ZO')
    return [
      it({ seccion: 'barreras', rol: 'zo', grupo, titulo: nom, capa: 'limites', obj: { coords: cerrar(G.rectangulo(p, Lz, Az, az + 90)), nombre: nom, tipo: 'punteada' } }),
      it({ seccion: 'barreras', rol: 'efecto', grupo, titulo: `${nom} · FIJAR`, capa: 'marcas', obj: { tipo: 'efecto', tarea: 'fijar', texto: `${nom} · FIJAR`, centro: G.desplazar(p, Az * 0.9, (az + 90) % 360), rot: azEn } }),
      it({ seccion: 'barreras', rol: 'obstaculo', grupo, titulo: 'Campo minado AC', capa: 'obstaculos', obj: { tipo: 'minado_ac', estado: 'proyectado', coords: G.rectangulo(G.desplazar(p, Az * 0.15, azEn), Lz * 0.7, Az * 0.25, az + 90) } }),
      it({ seccion: 'barreras', rol: 'obstaculo', grupo, titulo: 'Concertina triple', capa: 'obstaculos', obj: { tipo: 'concertina_triple', estado: 'proyectado', coords: G.segmento(G.desplazar(p, Az * 0.2, az), Lz * 0.6, az + 90) } }),
      it({ seccion: 'barreras', rol: 'obstaculo', grupo, titulo: 'Zanja antitanque', capa: 'obstaculos', obj: { tipo: 'zanja_at', estado: 'proyectado', coords: G.segmento(G.desplazar(p, Az * 0.38, az), Lz * 0.8, az + 90) } }),
      it({ seccion: 'fuegos', rol: 'ab', grupo, titulo: `Concentración sobre la ${nom}`, capa: 'blancos', obj: { lng: p[0], lat: p[1], forma: 'rectangular', largoM: Math.round(Lz * 800), anchoM: Math.round(Math.min(800, Az * 800)), orientacion: (az + 90) % 360, tipo: 'apoyo', efecto: 'destruir', ejecucion: 'a_pedido', descripcion: `Zona de obstáculos ${nom}` } }),
    ]
  }
  const L = anchoZO * 0.6
  const una = {
    ab_circ: { seccion: 'fuegos', rol: 'ab', capa: 'blancos', titulo: 'Concentración', obj: { lng: p[0], lat: p[1], forma: 'circular', radioM: 300, tipo: 'apoyo', efecto: 'neutralizar' } },
    ab_rect: { seccion: 'fuegos', rol: 'ab', capa: 'blancos', titulo: 'Concentración rectangular', obj: { lng: p[0], lat: p[1], forma: 'rectangular', largoM: 1200, anchoM: 500, orientacion: (az + 90) % 360, tipo: 'apoyo', efecto: 'destruir', ejecucion: 'prioritario' } },
    fpf: { seccion: 'fuegos', rol: 'fpf', capa: 'blancos', titulo: 'FPF', obj: { lng: p[0], lat: p[1], forma: 'lineal', largoM: 600, orientacion: (az + 90) % 360, tipo: 'proteccion', efecto: 'destruir', ejecucion: 'prioritario', descripcion: 'Fuego de protección final' } },
    cb: { seccion: 'fuegos', rol: 'cb', capa: 'blancos', titulo: 'Contrabatería', obj: { lng: p[0], lat: p[1], forma: 'circular', radioM: 400, tipo: 'contrabateria', efecto: 'neutralizar' } },
    minado_ac: { seccion: 'barreras', rol: 'obstaculo', capa: 'obstaculos', titulo: 'Campo minado AC', obj: { tipo: 'minado_ac', estado: 'proyectado', coords: G.rectangulo(p, L, L * 0.25, az + 90) } },
    concertina_triple: { seccion: 'barreras', rol: 'obstaculo', capa: 'obstaculos', titulo: 'Concertina triple', obj: { tipo: 'concertina_triple', estado: 'proyectado', coords: G.segmento(p, L, az + 90) } },
    zanja_at: { seccion: 'barreras', rol: 'obstaculo', capa: 'obstaculos', titulo: 'Zanja antitanque', obj: { tipo: 'zanja_at', estado: 'proyectado', coords: G.segmento(p, L * 1.2, az + 90) } },
    demolicion: { seccion: 'barreras', rol: 'obstaculo', capa: 'obstaculos', titulo: 'Demolición', obj: { tipo: 'demolicion', estado: 'proyectado', centro: p } },
    eje_ca: { seccion: 'maniobra', rol: 'eje-ca', capa: 'limites', titulo: prox('EJE CA'), obj: { coords: [G.desplazar(p, L, az), G.desplazar(p, L, azEn)], nombre: prox('EJE CA'), tipo: 'flecha' } },
    pb: { seccion: 'maniobra', rol: 'pb', capa: 'marcas', titulo: 'Posición de bloqueo', obj: { tipo: 'efecto', tarea: 'bloquear', texto: 'PB (RES)', centro: p, rot: azEn } },
    linea: { seccion: 'medidas', rol: 'linea', capa: 'limites', titulo: prox('LF'), obj: { coords: [G.desplazar(p, L, (az + 90) % 360), G.desplazar(p, L, (az + 270) % 360)], nombre: prox('LF') } },
  }
  const ef = /^ef_(\w+)$/.exec(tipo)
  if (ef) return [it({ seccion: 'barreras', rol: 'efecto', capa: 'marcas', titulo: `Efecto ${EFECTOS[ef[1]]}`, obj: { tipo: 'efecto', tarea: ef[1], texto: EFECTOS[ef[1]], centro: p, rot: azEn } })]
  return una[tipo] ? [it({ ...una[tipo], grupo: `${sello}` })] : []
}

// ─── 8) Congruencia: lo que la plantilla tiene que cumplir ──────────────────────────────────────

export function revisar(ctx = {}, { fuegos = null, medios = [] } = {}) {
  const out = []
  const ok = (texto, ir) => out.push({ nivel: 'ok', texto, ir })
  const mal = (texto, ir) => out.push({ nivel: 'aviso', texto, ir })
  const ops = ctx.ops || {}
  const plan = ctx.plan || {}
  const marcas = ctx.marcas || []
  const M = marco({ ...ctx, dir: ctx.conceptoCarta?.dir })
  const C = leerConcepto(ctx.hoja, { mision: ctx.mision || '' })
  // Lo que se considera (los otros G).
  ;(ops.areaOps ? ok : mal)(ops.areaOps ? 'Área de Operaciones trazada.' : 'Falta el Área de Operaciones (▧ Área de Ops).')
  const avs = M.ok ? avenidasDe(ctx.cmoc, M) : []
  ;(avs.length ? ok : mal)(avs.length ? `G-2: ${avs.length} avenida(s) de aproximación en el CMOC.` : 'G-2: el CMOC no tiene avenidas de aproximación.')
  const ains = (ops.ains || []).filter((a) => G.valido(a?.centro))
  ;(ains.length ? ok : mal)(ains.length ? `G-2: ${ains.length} A.I.N. acostada(s) en la carta.` : 'G-2: no hay A.I.N. acostadas (H.T. 20 → ◎ Acostar).')
  const od = (ops.tareas || []).some((t) => t?.oi?.operacion === 'OD')
  ;(od ? ok : mal)(od ? 'F3·P3: la OD está designada en la carta.' : 'F3·P3: todavía no hay OD designada (Formación inicial de las fuerzas).')
  ;(C.vacio ? mal : ok)(C.vacio ? 'El texto de esta hoja está vacío: lo que se dibuja sale sólo de la doctrina.' : 'El texto de la hoja está escrito.')

  const zos = (ops.limites || []).filter((l) => /^ZO\b/i.test(String(l?.nombre || '')))
  const obst = ops.obstaculos || []
  const blancos = plan.blancos || []
  const geoBlanco = (b) => (fuegos?.geometria ? fuegos.geometria(b) : null)
  const cubre = (b, p) => {
    const g = geoBlanco(b)
    const c = [b.lng, b.lat]
    if (g?.tipo === 'circulo') return G.km(c, p) <= g.radio / 1000 + 0.6
    if (g?.puntos?.length >= 3) return G.dentro(G.proyeccion(p[0], p[1]).a(p), g.puntos.map(G.proyeccion(p[0], p[1]).a)) || G.km(c, p) <= 1
    return G.km(c, p) <= 1
  }
  // Cada zona de obstáculos y cada obstáculo, batidos por el fuego.
  for (const z of zos) {
    const c = centroDe('limites', z)
    const b = blancos.find((x) => cubre(x, c) || G.km([x.lng, x.lat], c) <= radioDe('limites', z))
    ;(b ? ok : mal)(b ? `${z.nombre}: batida por ${b.num}.` : `${z.nombre}: ninguna concentración la bate. Un obstáculo sin fuego no detiene: agregá una (▭).`, c)
  }
  const tamB = (b) => Math.max((Number(b.radioM) || 0) / 1000, b.forma === 'puntual' || b.forma === 'circular' ? 0 : (Number(b.largoM) || 0) / 2000)
  const distObst = (o, p) => (o.coords?.length ? G.masCercano(o.coords.length >= 3 && /minado/.test(o.tipo) ? [...o.coords, o.coords[0]] : o.coords, p)?.d ?? 99 : G.valido(o.centro) ? G.km(o.centro, p) : 99)
  const sinFuego = obst.filter((o) => !blancos.some((b) => distObst(o, [b.lng, b.lat]) - tamB(b) <= 1))
  if (obst.length) (sinFuego.length ? mal : ok)(sinFuego.length ? `${sinFuego.length} obstáculo(s) sin una concentración que los bata (a menos de 1 km): el enemigo los levanta tranquilo.` : `Los ${obst.length} obstáculos están batidos por alguna concentración.`, sinFuego[0] ? centroDe('obstaculos', sinFuego[0]) : null)
  // Los obstáculos van DELANTE de la LPR.
  const lpr = (ops.limites || []).find((l) => /^LPR|BAZR/i.test(String(l?.nombre || '')))
  if (M.ok && lpr) {
    const atras = obst.filter((o) => {
      const c = centroDe('obstaculos', o)
      if (!c) return false
      const e = M.en(c)
      const mc = G.masCercano(lpr.coords, c)
      return mc && M.en(mc.p).u - e.u > 0.3
    })
    ;(atras.length ? mal : ok)(atras.length ? `${atras.length} obstáculo(s) DETRÁS de la LPR: el plan de barreras va delante (salvo las posiciones de bloqueo de la reserva).` : 'Los obstáculos están delante de la LPR.', atras[0] ? centroDe('obstaculos', atras[0]) : null)
  } else if (!lpr) mal('No hay LPR con nombre en la carta (proponé la plantilla o trazala).')
  // Los ejes de contraataque, sin obstáculos propios en el camino.
  for (const e of (ops.limites || []).filter((l) => /^EJE\s+CA/i.test(String(l?.nombre || '')))) {
    const choca = obst.find((o) => (o.coords || []).length >= 2 && G.crucePolilineas(e.coords, o.forma === 'area' || /minado/.test(o.tipo) ? [...o.coords, o.coords[0]] : o.coords))
    ;(choca ? mal : ok)(choca ? `${e.nombre} cruza un obstáculo propio (${String(choca.tipo).replace(/_/g, ' ')}): dejá un paso o corré el eje.` : `${e.nombre}: libre de obstáculos propios.`, choca ? centroDe('obstaculos', choca) : null)
  }
  // Las concentraciones al alcance de algún medio.
  if (fuegos?.evaluar && blancos.length) {
    const fuera = blancos.filter((b) => fuegos.evaluar([b.lng, b.lat], medios, b.medio).fuera)
    ;(fuera.length ? mal : ok)(fuera.length ? `${fuera.length} concentración(es) fuera del alcance (${fuera.slice(0, 5).map((b) => b.num).join(', ')}): mové la pieza en 🔥 Fuegos o la concentración.` : `Las ${blancos.length} concentraciones están al alcance de su medio.`, fuera[0] ? [fuera[0].lng, fuera[0].lat] : null)
  }
  // El peso del esfuerzo principal: más obstáculos y más fuegos sobre su avenida.
  if (M.ok && avs.length) {
    const cuenta = avs.map((a) => ({ a, o: obst.filter((o) => { const c = centroDe('obstaculos', o); return c && G.masCercano(a.coords, c)?.d <= 5 }).length, f: blancos.filter((b) => G.masCercano(a.coords, [b.lng, b.lat])?.d <= 5).length }))
    const ppal = C.principal.aas.length ? cuenta.find((x) => C.principal.aas.includes(x.a.num)) : null
    if (ppal) {
      const mas = cuenta.filter((x) => x !== ppal && x.o + x.f > ppal.o + ppal.f)
      ;(mas.length ? mal : ok)(mas.length ? `El esfuerzo principal (${ppal.a.nom}) tiene menos obstáculos y fuegos que la ${mas[0].a.nom}: el peso tiene que estar donde está el esfuerzo principal.` : `El peso de obstáculos y fuegos está sobre el esfuerzo principal (${ppal.a.nom}: ${ppal.o} obstáculo(s), ${ppal.f} concentración(es)).`)
    }
  }
  // Las A.I.N. que nombran los fuegos, con fuego.
  for (const n of C.fuegos.ains) {
    const a = ains.find((x) => Number(/(\d+)\s*$/.exec(String(x?.nom || ''))?.[1] ?? x?.n) === n)
    if (!a) continue
    const b = blancos.find((x) => G.km([x.lng, x.lat], a.centro) <= 2)
    ;(b ? ok : mal)(b ? `${a.nom || `AIN-${n}`}: la bate ${b.num}, como pide el concepto.` : `${a.nom || `AIN-${n}`}: el concepto de fuegos la nombra y no tiene concentración.`, a.centro)
  }
  // La reserva.
  const res = marcas.find((m) => m.tipo === 'reserva')
  if (res && M.ok && lpr) {
    const mc = G.masCercano(lpr.coords, res.centro)
    ;(mc && M.en(mc.p).u > M.en(res.centro).u ? ok : mal)(mc && M.en(mc.p).u > M.en(res.centro).u ? `Reserva detrás de la LPR (a ${fmtKm(mc.d)}).` : 'La reserva quedó DELANTE de la LPR.', res.centro)
  }
  return out
}

// ─── 9) Del calco al texto de la hoja ───────────────────────────────────────────────────────────

const MARCA_TEXTO = '— Según el calco (plantilla F3·P4):'
export function textoDelCalco({ ops = {}, plan = {}, marcas = [] } = {}, { coordenadas = null, nomMedio = null, nomTipoFuego = null, nomObstaculo = null } = {}) {
  const coord = (p) => (coordenadas ? coordenadas(p) : `${G.r6(p[1])}, ${G.r6(p[0])}`)
  const grupos = new Map()
  for (const o of ops.obstaculos || []) {
    const g = o.co?.grupo || 'Otros obstáculos'
    if (!grupos.has(g)) grupos.set(g, [])
    grupos.get(g).push(o)
  }
  const efectos = new Map(marcas.filter((m) => m.tipo === 'efecto' && m.co?.grupo).map((m) => [m.co.grupo, m.tarea]))
  const barreras = [...grupos.entries()].map(([g, os]) => {
    const det = os.map((o) => {
      const dim = o.coords?.length >= 3 && /minado/.test(o.tipo) ? (() => { const c = o.coords, a = G.km(c[0], c[1]), b = G.km(c[1], c[2]); return ` ${fmtKm(Math.max(a, b))} × ${fmtKm(Math.min(a, b))}` })() : o.coords?.length >= 2 ? ` ${fmtKm(G.largo(o.coords))}` : ''
      return `${nomObstaculo ? nomObstaculo(o.tipo) : String(o.tipo).replace(/_/g, ' ')}${dim}`
    })
    const c = G.centroide(os.map((o) => centroDe('obstaculos', o)).filter(Boolean))
    return `${g}${efectos.get(g) ? ` (efecto: ${EFECTOS[efectos.get(g)] || efectos.get(g)})` : ''} en ${coord(c)}: ${det.join('; ')}.`
  })
  const fuegos = (plan.blancos || []).map((b) => `${b.num} (${nomTipoFuego ? nomTipoFuego(b.tipo) : b.tipo}) en ${coord([b.lng, b.lat])}${b.descripcion ? ` — ${b.descripcion}` : ''}${b.medio && nomMedio ? ` · lo bate ${nomMedio(b.medio)}` : ''}${b.ejecucion === 'prioritario' ? ' · PRIORITARIO' : ''}.`)
  const medidas = [
    ...(ops.limites || []).filter((l) => l?.nombre).map((l) => `${l.nombre}: ${l.coords?.length ? `de ${coord(l.coords[0])} a ${coord(l.coords[l.coords.length - 1])}` : ''}.`),
    ...(ops.coordinacion || []).filter((p) => p?.nombre).map((p) => `${p.nombre} en ${coord(p.centro)}.`),
  ]
  const res = marcas.find((m) => m.tipo === 'reserva')
  return {
    barreras: barreras.length ? `${MARCA_TEXTO}\n${barreras.join('\n')}` : '',
    fuegos: fuegos.length ? `${MARCA_TEXTO}\n${fuegos.join('\n')}` : '',
    medidas: medidas.length ? `${MARCA_TEXTO}\n${medidas.join('\n')}` : '',
    reserva: res ? `${MARCA_TEXTO}\n${res.texto} en ${coord(res.centro)}.` : '',
  }
}
// Pone (o reemplaza) el bloque «Según el calco» al final de un campo, sin tocar lo que escribió el oficial.
export function conBloque(actual, bloque) {
  const a = String(actual || '')
  const i = a.indexOf(MARCA_TEXTO)
  const base = (i >= 0 ? a.slice(0, i) : a).replace(/\s+$/, '')
  return bloque ? `${base}${base ? '\n\n' : ''}${bloque}` : base
}
