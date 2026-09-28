// Dibujo de la hoja de CONCEPTOS ENTRELAZADOS con la forma del ejemplo del PMTD 2017
// (págs. 21 y 22): las mismas láminas se ven en la aplicación y van al Word.
//
//   Lámina 1 · MANIOBRA — relación vertical y horizontal: las dos cajas de arriba con
//              su T y P a la derecha, la fila de maniobra con OD ☆ / OC, el esfuerzo
//              principal (︽) y, debajo de cada unidad, su T y P por fase.
//   Lámina 2 · APOYO DE COMBATE — las unidades de maniobra arriba (a quién se apoya),
//              las de apoyo abajo con flechas de relación directa o indirecta y, por
//              fase, TAREA / PROPÓSITO / PAF / EFECTO o PE / PT; y las REFERENCIAS.
//   Lámina 3 · APOYO DE SERVICIO DE COMBATE — igual, con el SPAC.
//   Continuaciones — si un texto no entra, sigue en otra hoja: no se corta nada.
//
// Sin DOM: son cadenas SVG (se prueban en Node). El Word las pasa a imagen.
import { normalizarConceptos, ENFOQUES, CAMPOS, tipoUnidad, ESC, limpio, nombreUnidad, romano, rotuloCorto } from './modelo.js'

const etiquetaUnidad = (u) => limpio(u?.rotulo) || rotuloCorto(u?.nombre) || nombreUnidad(u)

export const ANCHO = 1100
export const ALTO = 850
const FUENTE = "Arial, Helvetica, 'Liberation Sans', sans-serif"
const X0 = 30
const X1 = 1070

// ─── Medida del texto (anchos de Arial, en milésimas de em) ────────────────────────
function tabla(grupos) {
  const t = {}
  for (const [w, cs] of grupos) for (const c of cs) t[c] = w
  return t
}
const REG = tabla([
  [191, "'"], [222, 'ijl'], [260, '|'], [278, ' !,./:;I[\\]ft·'], [333, '-()r`¡'], [334, '{}'], [355, '"'], [365, 'º'], [389, '*'], [400, '°'],
  [469, '^'], [500, 'Jckvxyzs¿'], [556, '0123456789#$?_abdeghnopqu«»–'], [584, '+<=>~'], [611, 'FTZL'], [667, '&ABEKPSVXY'],
  [722, 'CDHNRUw'], [778, 'GOQ'], [833, 'Mm'], [889, '%'], [944, 'W'], [1000, '—…☆★'], [1015, '@'],
])
const NEG = tabla([
  [238, "'"], [278, ' ,./Iijl[\\]·'], [280, '|'], [333, '!:;-()ft`¡'], [389, '*r{}'], [474, '"'], [500, 'z'],
  [556, '0123456789#$_acekvxys«»–J¿'], [584, '+<=>~^'], [611, '?bdghnopquFTZL'], [667, 'EPSVXY'], [722, '&ABCDHKNRU'],
  [778, 'GOQw'], [833, 'M'], [889, 'm%'], [944, 'W'], [975, '@'], [1000, '—…☆★'],
])
function ancho1(c, negrita) {
  const t = negrita ? NEG : REG
  if (t[c] != null) return t[c]
  const b = c.normalize('NFD')[0]
  if (t[b] != null) return t[b]
  return /[A-ZÑ]/.test(b) ? (negrita ? 722 : 667) : negrita ? 611 : 556
}
export function anchoTexto(texto, fs, negrita = false) {
  let s = 0
  for (const c of String(texto)) s += ancho1(c, negrita)
  return (s * fs * 1.02) / 1000
}

// Párrafo: { et: 'T F1:', tx: 'texto', ep: bool, tit: bool (todo en negrita), vacio: bool }
// → renglones [{ segs: [{t, b}], ep }]
function envolver(p, ancho, fs) {
  const renglones = []
  let segs = []
  let w = 0
  const esp = anchoTexto(' ', fs)
  const cerrar = () => {
    renglones.push({ segs, ep: !!p.ep && renglones.length === 0 })
    segs = []
    w = 0
  }
  const poner = (t, b) => {
    const ult = segs[segs.length - 1]
    if (ult && ult.b === b) ult.t += t
    else segs.push({ t, b })
  }
  if (p.et) {
    poner(p.et, true)
    w = anchoTexto(p.et, fs, true)
  }
  const negrita = !!p.tit
  for (let pal of String(p.tx || '').split(/\s+/).filter(Boolean)) {
    let wp = anchoTexto(pal, fs, negrita)
    while (wp > ancho) {
      // Palabra más ancha que la columna: se parte, no se pierde.
      let n = pal.length - 1
      while (n > 1 && anchoTexto(pal.slice(0, n), fs, negrita) > ancho - (segs.length ? w + esp : 0)) n--
      if (segs.length && n <= 1) {
        cerrar()
        continue
      }
      poner((segs.length ? ' ' : '') + pal.slice(0, n), negrita)
      cerrar()
      pal = pal.slice(n)
      wp = anchoTexto(pal, fs, negrita)
    }
    const extra = (segs.length ? esp : 0) + wp
    if (segs.length && w + extra > ancho) cerrar()
    poner((segs.length ? ' ' : '') + pal, negrita)
    w += (w ? esp : 0) + wp
  }
  if (segs.length || !renglones.length) cerrar()
  return renglones
}
function renglonesDe(parrafos, ancho, fs) {
  const out = []
  for (const p of parrafos) {
    const rs = envolver(p, ancho, fs)
    if (p.antes) rs[0].antes = p.antes
    out.push(...rs)
  }
  return out
}
const altoRenglones = (rs, lh) => rs.reduce((a, r) => a + lh + (r.antes || 0), 0)

// ─── Piezas del dibujo ─────────────────────────────────────────────────────────────
const txt = (x, y, t, fs = 12, { b = false, anc = 'start', halo = false, it = false } = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs}"${b ? ' font-weight="bold"' : ''}${it ? ' font-style="italic"' : ''}${anc !== 'start' ? ` text-anchor="${anc}"` : ''}${halo ? ' stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round"' : ''}>${ESC(t)}</text>`
function renglon(x, y, r, fs) {
  const cuerpo = r.segs.map((s) => (s.b ? `<tspan font-weight="bold">${ESC(s.t)}</tspan>` : ESC(s.t))).join('')
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs}" xml:space="preserve">${cuerpo}</text>`
}
const linea = (x1, y1, x2, y2, sw = 1.6) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#000" stroke-width="${sw}"/>`
function flecha(puntos, tipo, id) {
  const d = puntos.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return `<path d="${d}" fill="none" stroke="#000" stroke-width="2"${tipo === 'indirecta' ? ' stroke-dasharray="11 7"' : ''} marker-end="url(#${id})"/>`
}
// Esfuerzo principal: el doble chevrón de las referencias del PMTD.
const chevron = (x, y, s = 1) =>
  `<path d="M${x},${y + 13 * s} l${10 * s},${-10 * s} l${10 * s},${10 * s} M${x},${y + 19 * s} l${10 * s},${-10 * s} l${10 * s},${10 * s}" fill="none" stroke="#000" stroke-width="1.6" stroke-linejoin="miter"/>`
function estrella(cx, cy, r = 9) {
  const p = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.42 : r
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return `<polygon points="${p.join(' ')}" fill="#fff" stroke="#000" stroke-width="1.3"/>`
}

// Símbolo del arma dentro del cuadro (blanco y negro, como en la hoja del PMTD).
function simbolo(u, x, y, w, h) {
  const cx = x + w / 2
  const cy = y + h / 2
  const cruz = linea(x, y, x + w, y + h, 1.4) + linea(x + w, y, x, y + h, 1.4)
  const diag = linea(x, y + h, x + w, y, 1.4)
  const oval = `<ellipse cx="${cx}" cy="${cy}" rx="${(w * 0.27).toFixed(1)}" ry="${(h * 0.22).toFixed(1)}" fill="#fff" stroke="#000" stroke-width="1.8"/>`
  const rotulo = (t, fs = 17) => txt(cx, cy + fs * 0.36, t, fs, { b: true, anc: 'middle' })
  switch (u.arma) {
    case 'infanteria':
    case 'selva':
      return cruz
    case 'mecanizada':
      return cruz + oval
    case 'motorizada':
      return cruz + linea(cx, y, cx, y + h, 1.4)
    case 'andina':
      return cruz + `<polygon points="${cx - 13},${y + h} ${cx},${y + h - 15} ${cx + 13},${y + h}" fill="#000"/>`
    case 'aerotransportada':
      return cruz + `<path d="M${cx - 12},${y + h - 3} a12,9 0 0 1 24,0" fill="#fff" stroke="#000" stroke-width="1.6"/>`
    case 'caballeria':
    case 'reconocimiento':
      return diag
    case 'cabmec':
      return diag + oval
    case 'blindada':
      return oval
    case 'artilleria':
      return `<circle cx="${cx}" cy="${cy}" r="${Math.min(8, h * 0.13).toFixed(1)}" fill="#000"/>`
    case 'lanzacohetes':
      return `<circle cx="${cx}" cy="${cy + 6}" r="6" fill="#000"/>` + `<path d="M${cx - 8},${cy - 6} l8,-9 l8,9" fill="none" stroke="#000" stroke-width="1.8"/>`
    case 'morteros':
      return `<circle cx="${cx}" cy="${cy + 10}" r="5" fill="#fff" stroke="#000" stroke-width="1.6"/>` + linea(cx, cy + 5, cx, cy - 14, 1.6) + `<path d="M${cx - 5},${cy - 8} l5,-7 l5,7" fill="none" stroke="#000" stroke-width="1.6"/>`
    case 'antiaerea':
      return `<path d="M${x + w * 0.16},${y + h} A${(w * 0.34).toFixed(1)},${(h * 0.62).toFixed(1)} 0 0 1 ${x + w * 0.84},${y + h}" fill="none" stroke="#000" stroke-width="1.8"/>`
    case 'ingenieria':
      return `<path d="M${cx - 28},${cy + 11} V${cy - 9} H${cx + 28} V${cy + 11} M${cx},${cy - 9} V${cy + 11}" fill="none" stroke="#000" stroke-width="4.5"/>`
    case 'comunicaciones':
      return `<polyline points="${x},${y} ${cx - 7},${cy + 7} ${cx + 7},${cy - 7} ${x + w},${y + h}" fill="none" stroke="#000" stroke-width="1.5"/>`
    case 'antitanque':
      return `<polyline points="${x},${y + h} ${cx},${y} ${x + w},${y + h}" fill="none" stroke="#000" stroke-width="1.5"/>`
    case 'aviacion':
      return `<path d="M${cx - 20},${cy - 10} L${cx + 20},${cy + 10} L${cx + 20},${cy - 10} L${cx - 20},${cy + 10} Z" fill="none" stroke="#000" stroke-width="1.6"/>`
    case 'sanidad':
      return linea(cx, cy - 14, cx, cy + 14, 5) + linea(cx - 14, cy, cx + 14, cy, 5)
    case 'transporte':
      return `<circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="#000" stroke-width="1.6"/>` + linea(cx - 12, cy, cx + 12, cy, 1.2) + linea(cx, cy - 12, cx, cy + 12, 1.2)
    case 'ametralladoras':
      return rotulo('AM')
    case 'logistica':
      return rotulo('LOG')
    case 'intendencia':
      return rotulo('INT')
    case 'materialbelico':
      return rotulo('MB')
    case 'mantenimiento':
      return rotulo('MANT', 15)
    case 'veterinaria':
      return rotulo('VET')
    case 'policiamilitar':
      return rotulo('PM')
    default:
      return u.texto ? rotulo(u.texto, u.texto.length > 4 ? 18 : 26) : ''
  }
}

// Caja de una unidad: marco, símbolo y magnitud. `chica`: la magnitud va en el
// cuadrito de arriba (fila de maniobra y apoyo, como en el ejemplo); si no, suelta.
function caja(u, x, y, w, h, { chica = true } = {}) {
  const cx = x + w / 2
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#000" stroke-width="${u.propia ? 3.4 : 1.8}"/>`
  s += simbolo(u, x, y, w, h)
  const mag = u.magnitud || ''
  if (mag && chica) {
    const mw = Math.max(34, anchoTexto(mag, 13, true) + 14)
    s += `<rect x="${(cx - mw / 2).toFixed(1)}" y="${y - 22}" width="${mw.toFixed(1)}" height="22" fill="#fff" stroke="#000" stroke-width="1.6"/>`
    s += txt(cx, y - 6, mag, 13, { b: true, anc: 'middle' })
  } else if (mag) s += txt(cx, y - 7, mag, 16, { b: true, anc: 'middle' })
  if (u.numero) s += txt(x + w + 6, y + h - 2, u.numero, 16, { b: true })
  return s
}
function rotuloRol(u, x, y) {
  if (!u.rol) return ''
  let s = txt(x, y, u.rol === 'RES' ? 'RESERVA' : u.rol, 13, { b: true })
  if (u.rol === 'OD') s += estrella(x + anchoTexto('OD', 13, true) + 13, y - 5)
  return s
}

// ─── Textos de cada unidad (párrafos) ─────────────────────────────────────────────
const PUNTOS = '……………………………………'
function parrafosUnidad(u, v) {
  const tipo = tipoUnidad(u)
  const ps = []
  const nFase = (id) => {
    const i = v.fases.findIndex((f) => f.id === id)
    return i >= 0 ? i + 1 : id
  }
  const conTexto = (o, ks) => ks.some(([k]) => limpio(o[k]))
  if (tipo === 'superior') {
    ps.push({ et: 'T :', tx: limpio(u.tarea) || PUNTOS, vacio: !limpio(u.tarea) })
    ps.push({ et: 'P :', tx: limpio(u.proposito) || PUNTOS, vacio: !limpio(u.proposito) })
    return ps
  }
  if (tipo === 'maniobra') {
    const fases = u.fases.filter((f) => conTexto(f, CAMPOS.maniobra))
    if (limpio(u.tarea) || limpio(u.proposito) || !fases.length) {
      ps.push({ et: 'T:', tx: limpio(u.tarea) || PUNTOS, ep: u.esfuerzo })
      ps.push({ et: 'P:', tx: limpio(u.proposito) || PUNTOS })
    }
    const orden = v.fases.map((f) => f.id)
    fases.sort((a, b) => orden.indexOf(a.fase) - orden.indexOf(b.fase))
    for (const f of fases) {
      ps.push({ et: `T F${nFase(f.fase)}:`, tx: limpio(f.tarea) || PUNTOS, ep: f.esfuerzo, antes: ps.length ? 5 : 0 })
      if (limpio(f.proposito)) ps.push({ et: 'P:', tx: limpio(f.proposito) })
    }
    return ps
  }
  const campos = CAMPOS[tipo]
  const bloque = (o) => campos.filter(([k]) => limpio(o[k])).map(([k, r]) => ({ et: `${r}:`, tx: limpio(o[k]) }))
  const general = bloque(u)
  ps.push(...general)
  const orden = v.fases.map((f) => f.id)
  const fases = u.fases.filter((f) => conTexto(f, campos)).sort((a, b) => orden.indexOf(a.fase) - orden.indexOf(b.fase))
  for (const f of fases) {
    ps.push({ et: '', tx: `FASE ${romano(nFase(f.fase))}`, tit: true, ep: f.esfuerzo, antes: ps.length ? 6 : 0 })
    ps.push(...bloque(f))
  }
  if (!ps.length) for (const [, r] of campos.slice(0, tipo === 'ingenieria' ? 2 : 2)) ps.push({ et: `${r}:`, tx: PUNTOS })
  return ps
}

// Reparte columnas de texto: elige la letra más grande con la que TODO entra; si
// ni con la más chica entra, lo que sobra pasa a una hoja de continuación.
const LETRAS = [12, 11.5, 11, 10.5, 10, 9.5]
function repartir(columnas, alto) {
  for (const fs of LETRAS) {
    const lh = fs * 1.24
    const rs = columnas.map((c) => renglonesDe(c.parrafos, c.ancho, fs))
    if (rs.every((r) => altoRenglones(r, lh) <= alto)) return { fs, lh, renglones: rs, sobra: columnas.map(() => []) }
  }
  const fs = LETRAS[LETRAS.length - 1]
  const lh = fs * 1.24
  const renglones = []
  const sobra = []
  for (const c of columnas) {
    const rs = renglonesDe(c.parrafos, c.ancho, fs)
    let h = 0
    let n = 0
    while (n < rs.length && h + lh + (rs[n].antes || 0) <= alto - lh) h += lh + (rs[n++].antes || 0)
    if (n < rs.length) {
      renglones.push([...rs.slice(0, n), { segs: [{ t: '(sigue en la hoja de continuación)', b: false }], it: true }])
      sobra.push(rs.slice(n))
    } else {
      renglones.push(rs)
      sobra.push([])
    }
  }
  return { fs, lh, renglones, sobra }
}
function dibujarRenglones(rs, x, y, fs, lh) {
  let s = ''
  let yy = y
  for (const r of rs) {
    yy += r.antes || 0
    if (r.ep) s += chevron(x - 23, yy - 14, 0.95)
    s += r.it ? txt(x, yy, r.segs[0].t, fs - 1, { it: true }) : renglon(x, yy, r, fs)
    yy += lh
  }
  return s
}

// ─── Hoja (marco común) ────────────────────────────────────────────────────────────
function hoja(cuerpo, n, total, sub, op, idm) {
  const cla = limpio(op.clasificacion)
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}" font-family="${FUENTE}">`
  s += `<defs><marker id="${idm}" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#000"/></marker></defs>`
  s += `<rect width="${ANCHO}" height="${ALTO}" fill="#fff"/><g fill="#000">`
  if (cla) s += txt(ANCHO / 2, 16, cla, 11, { b: true, anc: 'middle' }) + txt(ANCHO / 2, ALTO - 5, cla, 11, { b: true, anc: 'middle' })
  s += txt(X0, 34, `CONCEPTOS ENTRELAZADOS — ${sub}`, 13, { b: true })
  const der = [limpio(op.unidad), limpio(op.ejercicio)].filter(Boolean).join(' · ')
  if (der) s += txt(X1, 34, der, 11, { anc: 'end' })
  s += txt(X0, ALTO - 18, 'F2·P1 · Hoja de trabajo de los conceptos entrelazados (PMTD 2017, págs. 20-22) · NO se difunde', 9.5)
  s += txt(X1, ALTO - 18, `Hoja ${n} de ${total}`, 10, { anc: 'end' })
  return `${s}${cuerpo}</g></svg>`
}

function referencias(x, y, w, { apoyo = false, fases = [] } = {}) {
  const items = [
    ['OPERACIÓN DECISIVA (OD)', (xx, yy) => estrella(xx + 10, yy - 4, 8)],
    ['OPERACIÓN DE CONFIGURACIÓN (OC)', () => ''],
    ['ESFUERZO PRINCIPAL', (xx, yy) => chevron(xx, yy - 15, 0.9)],
    ['RELACIÓN DIRECTA', (xx, yy, id) => flecha([[xx - 12, yy - 4], [xx + 34, yy - 4]], 'directa', id)],
    ['RELACIÓN INDIRECTA', (xx, yy, id) => flecha([[xx - 12, yy - 4], [xx + 34, yy - 4]], 'indirecta', id)],
  ]
  const extra = apoyo ? ['PE = prioridad de esfuerzo', 'PT = prioridad de trabajo', 'PAF = prioridad de apoyo de fuegos'] : []
  const lf = fases.map((f, i) => `FASE ${romano(i + 1)}${f.nombre ? ` — ${f.nombre}` : ''}`)
  const fsF = 10
  const lineasF = lf.flatMap((t) => envolver({ tx: t }, w - 20, fsF))
  const h = 30 + items.length * 20 + extra.length * 14 + (lineasF.length ? 20 + lineasF.length * 12.5 : 0) + 6
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h.toFixed(1)}" fill="#fff" stroke="#000" stroke-width="1.4"/>`
  s += txt(x + w / 2, y + 19, 'REFERENCIAS', 12.5, { b: true, anc: 'middle' })
  let yy = y + 40
  for (const [t, dib] of items) {
    s += txt(x + 10, yy, t, 10.5)
    s += dib(x + w - 58, yy, 'REFID')
    yy += 20
  }
  for (const t of extra) {
    s += txt(x + 10, yy - 2, t, 9.5)
    yy += 14
  }
  if (lineasF.length) {
    s += txt(x + 10, yy + 4, 'FASES DE LA OPERACIÓN', 10.5, { b: true })
    yy += 18
    for (const r of lineasF) {
      s += renglon(x + 10, yy, r, fsF)
      yy += 12.5
    }
  }
  return { svg: s, alto: h }
}

// Coloca n columnas centradas dentro de [a, b], con un ancho máximo por columna.
function columnas(n, a = X0, b = X1, max = 330) {
  const cw = Math.min((b - a) / Math.max(n, 1), max)
  const x = a + (b - a - cw * n) / 2
  return Array.from({ length: n }, (_, i) => ({ x: x + i * cw, w: cw, cx: x + i * cw + cw / 2 }))
}
const trozos = (a, n) => {
  const out = []
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n))
  return out.length ? out : [[]]
}
// Nombre debajo de la caja, hasta dos renglones.
function nombreDebajo(u, cx, y, ancho, fs = 12) {
  const rs = envolver({ tx: etiquetaUnidad(u), tit: true }, ancho, fs).slice(0, 2)
  return rs.map((r, i) => txt(cx, y + i * (fs + 1.5), r.segs.map((s) => s.t).join(''), fs, { b: true, anc: 'middle', halo: true })).join('')
}

// ─── Lámina de MANIOBRA ────────────────────────────────────────────────────────────
function laminaManiobra(v, fila, ctx) {
  const { idm, dibujadas, continuar } = ctx
  const s2 = v.unidades.find((u) => u.grupo === 'superior2')
  const s1 = v.unidades.find((u) => u.grupo === 'superior1')
  let s = ''
  const pos = new Map()
  // Cajas de arriba
  const SX = 460
  const SW = 180
  const SH = 76
  const arriba = [
    [s2, 64, 'superior2'],
    [s1, 186, 'superior1'],
  ]
  for (const [u, y, g] of arriba) {
    const uu = u || { grupo: g, nombre: '', magnitud: '', fases: [] }
    s += caja(uu, SX, y, SW, SH, { chica: false })
    if (!u) s += txt(SX + SW / 2, y + SH / 2 + 4, ENFOQUES[v.enfoque].grupos[g], 10, { it: true, anc: 'middle' })
    // Denominación a la izquierda de la caja (identificación), T y P a la derecha.
    if (u && limpio(u.nombre) && limpio(u.nombre) !== limpio(u.texto)) {
      const rs = envolver({ tx: limpio(u.nombre), tit: true }, 146, 11.5).slice(0, 4)
      rs.forEach((r, i) => (s += txt(SX - 12, y + 18 + i * 13.5, r.segs.map((z) => z.t).join(''), 11.5, { b: true, anc: 'end' })))
    }
    const alto = g === 'superior2' ? 108 : 118
    const r = repartir([{ parrafos: parrafosUnidad(uu.grupo ? { ...uu, grupo: g } : uu, v), ancho: X1 - 672 }], alto)
    s += dibujarRenglones(r.renglones[0], 672, y + 14, r.fs, r.lh)
    if (r.sobra[0].length && u) continuar.push({ u, renglones: r.sobra[0] })
    if (u) pos.set(u.id, { x: SX, y, w: SW, h: SH, cx: SX + SW / 2, tipo: 'sup' })
  }
  // Fila de maniobra
  const cols = columnas(fila.length)
  const BY = 340
  const BH = 62
  cols.forEach((c, i) => {
    const u = fila[i]
    const bw = Math.min(160, c.w - 64)
    const bx = c.cx - bw / 2
    s += caja(u, bx, BY, bw, BH)
    s += rotuloRol(u, bx + bw + 6, BY + 14)
    s += nombreDebajo(u, c.cx, BY + BH + 17, c.w - 12)
    if (u.propia) s += txt(bx + bw + 5, BY + BH - 14, 'UNIDAD', 9.5, { b: true }) + txt(bx + bw + 5, BY + BH - 3, 'PROPIA', 9.5, { b: true })
    pos.set(u.id, { x: bx, y: BY, w: bw, h: BH, cx: c.cx, i, tipo: 'fila' })
  })
  // Relaciones
  let carril = 0
  let alSup = 0
  v.relaciones.forEach((r, k) => {
    const a = pos.get(r.desde)
    const b = pos.get(r.hasta)
    if (!a || !b) return
    dibujadas.add(k)
    if (a.tipo === 'sup' && b.tipo === 'sup') {
      const [ab, ar] = a.y > b.y ? [a, b] : [b, a]
      const pts = [[SX + 30, ab.y - 1], [SX + 30, ar.y + ar.h + 1]]
      s += flecha(a.y > b.y ? pts : pts.reverse(), r.tipo, idm)
      return
    }
    if (a.tipo === 'fila' && b.tipo === 'fila') {
      if (Math.abs(a.i - b.i) === 1) {
        const doble = v.relaciones.some((x) => x.desde === r.hasta && x.hasta === r.desde)
        const y = BY + BH / 2 + (doble ? (a.i < b.i ? -8 : 8) : 0)
        const [x1, x2] = a.i < b.i ? [a.x + a.w + 2, b.x - 2] : [a.x - 2, b.x + b.w + 2]
        s += flecha([[x1, y], [x2, y]], r.tipo, idm)
      } else {
        const y = BY + BH + 44 + (carril++ % 4) * 7
        const xa = a.i < b.i ? a.x + a.w - 12 : a.x + 12
        const xb = a.i < b.i ? b.x + 12 : b.x + b.w - 12
        s += flecha([[xa, BY + BH + 1], [xa, y], [xb, y], [xb, BY + BH + 2]], r.tipo, idm)
      }
      return
    }
    // Fila ↔ cajas de arriba
    const [f, sp, sube] = a.tipo === 'fila' ? [a, b, true] : [b, a, false]
    const yTop = f.y - 23
    const entrada = sp.x + 22 + ((alSup * 37) % (sp.w - 44))
    const yCarril = 306 - (alSup % 3) * 8
    alSup++
    let pts
    if (sp.y > 150 && f.cx > sp.x + 8 && f.cx < sp.x + sp.w - 8) pts = [[f.cx, yTop], [f.cx, sp.y + sp.h + 1]]
    else if (sp.y > 150) pts = [[f.cx, yTop], [f.cx, yCarril], [entrada, yCarril], [entrada, sp.y + sp.h + 1]]
    else pts = [[f.cx, yTop], [f.cx, yCarril], [sp.x - 30, yCarril], [sp.x - 30, sp.y + sp.h / 2], [sp.x - 1, sp.y + sp.h / 2]]
    s += flecha(sube ? pts : pts.reverse(), r.tipo, idm)
  })
  // Referencias y fases arriba a la izquierda (el espacio libre del ejemplo)
  s += referencias(X0, 52, 262, { fases: v.fases }).svg.replaceAll('REFID', idm)
  // Texto debajo de cada unidad
  const TY = BY + BH + 72
  const cs = cols.map((c, i) => ({ parrafos: parrafosUnidad(fila[i], v), ancho: c.w - 34 }))
  const r = repartir(cs, ALTO - 30 - TY)
  cols.forEach((c, i) => {
    s += dibujarRenglones(r.renglones[i], c.x + 26, TY, r.fs, r.lh)
    if (r.sobra[i].length) continuar.push({ u: fila[i], renglones: r.sobra[i] })
  })
  if (!fila.length) s += txt(ANCHO / 2, 470, `${ENFOQUES[v.enfoque].grupos.maniobra}: todavía no hay unidades.`, 13, { it: true, anc: 'middle' })
  return s
}

// ─── Láminas de APOYO DE COMBATE y SPAC ────────────────────────────────────────────
function laminaApoyo(v, lista, ctx) {
  const { idm, dibujadas, continuar } = ctx
  let s = ''
  const pos = new Map()
  const ids = new Set(lista.map((u) => u.id))
  // Arriba, a quién se apoya: la maniobra (y la unidad propia o las cajas de arriba si hay una relación con ellas).
  const destinos = v.unidades.filter((u) => u.grupo === 'maniobra').slice(0, 7)
  for (const u of v.unidades.filter((u) => u.grupo.startsWith('superior') || u.grupo === 'maniobra')) {
    if (!destinos.includes(u) && v.relaciones.some((r) => (ids.has(r.desde) && r.hasta === u.id) || (ids.has(r.hasta) && r.desde === u.id))) destinos.unshift(u)
  }
  const cd = columnas(destinos.length, X0, X1, 260)
  destinos.forEach((u, i) => {
    const rs = envolver({ tx: etiquetaUnidad(u) + (u.rol ? ` (${u.rol})` : ''), tit: true }, cd[i].w - 10, 13).slice(0, 2)
    rs.forEach((r2, j) => (s += txt(cd[i].cx, 84 + j * 15, r2.segs.map((z) => z.t).join(''), 13, { b: true, anc: 'middle' })))
    pos.set(u.id, { cx: cd[i].cx, yb: 84 + (rs.length - 1) * 15 + 7, tipo: 'destino' })
  })
  // Unidades de apoyo
  const conRef = lista.length <= 3
  const cols = conRef ? columnas(lista.length, 270, X1, 400) : columnas(lista.length)
  const BY = 270
  const BH = 62
  cols.forEach((c, i) => {
    const u = lista[i]
    const bw = Math.min(160, c.w - 64)
    const bx = c.cx - bw / 2
    s += caja(u, bx, BY, bw, BH)
    s += rotuloRol(u, bx + bw + 6, BY + 14)
    s += nombreDebajo(u, c.cx, BY + BH + 17, c.w - 12)
    pos.set(u.id, { x: bx, y: BY, w: bw, h: BH, cx: c.cx, i, tipo: 'apoyo' })
  })
  // Flechas: de cada unidad de apoyo a las que apoya (como en la pág. 22)
  const porCaja = new Map()
  v.relaciones.forEach((r, k) => {
    const a = pos.get(r.desde)
    const b = pos.get(r.hasta)
    if (!a || !b) return
    if (a.tipo === 'destino' && b.tipo === 'destino') return
    dibujadas.add(k)
    if (a.tipo === 'apoyo' && b.tipo === 'apoyo') {
      if (Math.abs(a.i - b.i) === 1) {
        const [x1, x2] = a.i < b.i ? [a.x + a.w + 2, b.x - 2] : [a.x - 2, b.x + b.w + 2]
        s += flecha([[x1, BY + BH / 2], [x2, BY + BH / 2]], r.tipo, idm)
      } else {
        const y = BY + BH + 42
        const xa = a.x + a.w / 2 + (a.i < b.i ? 30 : -30)
        const xb = b.x + b.w / 2 + (a.i < b.i ? -30 : 30)
        s += flecha([[xa, BY + BH + 1], [xa, y], [xb, y], [xb, BY + BH + 2]], r.tipo, idm)
      }
      return
    }
    const [ap, de, sale] = a.tipo === 'apoyo' ? [a, b, true] : [b, a, false]
    if (!porCaja.has(ap)) porCaja.set(ap, [])
    porCaja.get(ap).push({ de, tipo: r.tipo, sale })
  })
  for (const [ap, rs] of porCaja) {
    rs.sort((p, q) => p.de.cx - q.de.cx)
    const izq = rs.filter((x) => x.de.cx < ap.cx)
    const der = rs.filter((x) => x.de.cx >= ap.cx)
    const tramo = (n, a, b) => Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 1)) / (n + 1))
    const xs = [...tramo(izq.length, ap.x + 4, ap.cx - 20), ...tramo(der.length, ap.cx + 20, ap.x + ap.w - 4)]
    ;[...izq, ...der].forEach((x, i) => {
      const pts = [[xs[i], ap.y - (Math.abs(xs[i] - ap.cx) < 24 ? 23 : 1)], [x.de.cx, x.de.yb]]
      s += flecha(x.sale ? pts : pts.reverse(), x.tipo, idm)
    })
  }
  // Texto
  const TY = BY + BH + 64
  const pieRef = !conRef
  const cs = cols.map((c, i) => ({ parrafos: parrafosUnidad(lista[i], v), ancho: c.w - 34 }))
  const r = repartir(cs, ALTO - (pieRef ? 52 : 30) - TY)
  cols.forEach((c, i) => {
    s += dibujarRenglones(r.renglones[i], c.x + 26, TY, r.fs, r.lh)
    if (r.sobra[i].length) continuar.push({ u: lista[i], renglones: r.sobra[i] })
  })
  if (conRef) {
    const ref = referencias(X0, 0, 228, { apoyo: true, fases: v.fases })
    s += referencias(X0, Math.max(TY - 14, ALTO - 36 - ref.alto), 228, { apoyo: true, fases: v.fases }).svg.replaceAll('REFID', idm)
  } else {
    s += txt(X0, ALTO - 36, 'REFERENCIAS: ☆ operación decisiva (OD) · OC operación de configuración · ︽ esfuerzo principal · ─── relación directa · - - - relación indirecta · PE prioridad de esfuerzo · PT prioridad de trabajo · PAF prioridad de apoyo de fuegos', 9.5)
  }
  if (!lista.length) s += txt(ANCHO / 2, 370, 'Todavía no hay unidades cargadas en este apartado.', 13, { it: true, anc: 'middle' })
  return s
}

// ─── Continuación: lo que no entró, sin achicar más la letra ───────────────────────
// Los renglones que sobraron vuelven a ser párrafos (un rótulo en negrita abre
// párrafo) para envolverlos de nuevo al ancho de la columna de continuación.
function reparrafar(renglones) {
  const ps = []
  for (const r of renglones) {
    const [primero, ...resto] = r.segs
    const texto = (xs) => xs.map((x) => x.t).join('').trim()
    if (primero && primero.b && (r.antes || !ps.length || /:$/.test(primero.t.trim()) || r.segs.length === 1)) {
      const tit = r.segs.length === 1 && !/:$/.test(primero.t.trim())
      ps.push(tit ? { et: '', tx: primero.t.trim(), tit: true, ep: r.ep, antes: r.antes || 0 } : { et: primero.t.trim(), tx: texto(resto), ep: r.ep, antes: r.antes || 0 })
    } else if (ps.length) ps[ps.length - 1].tx = `${ps[ps.length - 1].tx} ${texto(r.segs)}`.trim()
    else ps.push({ et: '', tx: texto(r.segs) })
  }
  if (ps[0]) ps[0].antes = 0
  return ps
}
function laminasContinuacion(pendientes, fs = 10.5) {
  const out = []
  const lh = fs * 1.24
  let cola = pendientes.map((p) => ({ u: p.u, parrafos: reparrafar(p.renglones) }))
  while (cola.length) {
    const lote = cola.slice(0, 4)
    const cols = columnas(lote.length, X0, X1, 330)
    let s = ''
    const siguen = []
    lote.forEach((p, i) => {
      const c = cols[i]
      const cab = envolver({ tx: `${p.u.rol ? `${p.u.rol} · ` : ''}${etiquetaUnidad(p.u)} (continuación)`, tit: true }, c.w - 20, 11.5).slice(0, 3)
      cab.forEach((r, j) => (s += txt(c.x + 8, 72 + j * 14, r.segs.map((z) => z.t).join(''), 11.5, { b: true })))
      const TY = 72 + cab.length * 14 + 12
      const alto = ALTO - 40 - TY
      const rs = renglonesDe(p.parrafos, c.w - 34, fs)
      let n = 0
      let h = 0
      while (n < rs.length && h + lh + (rs[n].antes || 0) <= alto) h += lh + (rs[n++].antes || 0)
      s += dibujarRenglones(rs.slice(0, n), c.x + 26, TY, fs, lh)
      if (n < rs.length) siguen.push({ u: p.u, parrafos: reparrafar(rs.slice(n)) })
    })
    out.push(s)
    cola = [...siguen, ...cola.slice(4)]
  }
  return out
}

// ─── El formato en blanco (hoja de trabajo de la pág. 20), cuando no hay nada ─────
function laminaFormato() {
  let s = txt(ANCHO / 2, 70, 'HOJA DE TRABAJO PARA LOS «CONCEPTOS ENTRELAZADOS»', 19, { b: true, anc: 'middle' })
  const pasos = [
    '1.- Inicialmente escriba la Tarea y Propósito del Comando dos escalones más arriba.',
    '2.- Siga con la Tarea y Propósito del Comando inmediato superior.',
    '3.- Posteriormente establezca la Tarea y Propósito para la Unidad propia.',
    '4.- Luego prosiga con las Unidades de maniobra.',
    '5.- Continúe con las UU. de apoyo de combate.',
    '6.- Finalice con las UU. SPAC.',
  ]
  let yp = 100
  for (const p of pasos) for (const r of envolver({ tx: p }, 400, 11.5)) {
    s += txt(60, yp, r.segs.map((z) => z.t).join(''), 11.5, { it: true })
    yp += 15
  }
  s += txt(760, 104, 'Nota: debe completar los gráficos con la magnitud,', 12, { it: true })
  s += txt(760, 121, 'identificación y denominación de las Unidades.', 12, { it: true })
  for (const [y] of [[96], [196]]) {
    s += `<rect x="500" y="${y}" width="110" height="56" fill="#fff" stroke="#000" stroke-width="1.8"/>`
    s += txt(625, y + 14, 'T:', 13, { b: true }) + txt(625, y + 52, 'P:', 13, { b: true })
  }
  const filas = [['MANIOBRA', 300], ['APOYO DE COMBATE', 480], ['SPAC.', 660]]
  for (const [nom, y] of filas) {
    s += `<text transform="translate(52 ${y + 70}) rotate(-90)" font-size="14" font-weight="bold">${ESC(nom)}</text>`
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 200
      s += `<rect x="${x}" y="${y}" width="120" height="56" fill="#fff" stroke="#000" stroke-width="1.8"/>`
      s += txt(x + 4, y + 78, 'T:', 13, { b: true }) + txt(x + 4, y + 118, 'P:', 13, { b: true })
    }
  }
  return s
}

// ─── Todas las láminas ─────────────────────────────────────────────────────────────
// op: { clasificacion, unidad, ejercicio }
export function laminasConceptos(valor, op = {}) {
  const v = normalizarConceptos(valor)
  const cuerpos = []
  const dibujadas = new Set()
  const continuar = []
  const man = v.unidades.filter((u) => u.grupo === 'maniobra')
  const apoyo = v.unidades.filter((u) => u.grupo === 'apoyo')
  const spac = v.unidades.filter((u) => u.grupo === 'spac')
  const idm = (n) => `pta${n}`
  if (!v.unidades.length) {
    cuerpos.push({ sub: 'HOJA DE TRABAJO (en blanco)', s: laminaFormato() })
  } else {
    // La unidad propia al centro de la fila, como en la hoja de trabajo del PMTD.
    let fila = man
    const propia = man.find((u) => u.propia)
    if (propia && man.length > 1) {
      const otras = man.filter((u) => u !== propia)
      const m = Math.floor(otras.length / 2)
      fila = [...otras.slice(0, m), propia, ...otras.slice(m)]
    }
    for (const t of trozos(fila, 5)) cuerpos.push({ sub: `MANIOBRA · RELACIÓN VERTICAL Y HORIZONTAL${cuerpos.length ? ' (continuación)' : ''}`, s: laminaManiobra(v, t, { idm: idm(cuerpos.length + 1), dibujadas, continuar }) })
    const nAp = cuerpos.length
    for (const t of trozos(apoyo, 4)) cuerpos.push({ sub: `APOYO DE COMBATE${cuerpos.length > nAp ? ' (continuación)' : ''}`, s: laminaApoyo(v, t, { idm: idm(cuerpos.length + 1), dibujadas, continuar }) })
    if (spac.length) {
      const nSp = cuerpos.length
      for (const t of trozos(spac, 4)) cuerpos.push({ sub: `APOYO DE SERVICIO DE COMBATE${cuerpos.length > nSp ? ' (continuación)' : ''}`, s: laminaApoyo(v, t, { idm: idm(cuerpos.length + 1), dibujadas, continuar }) })
    }
    for (const s of laminasContinuacion(continuar)) cuerpos.push({ sub: 'CONTINUACIÓN DE TAREAS Y PROPÓSITOS', s })
    // Relaciones que no se pudieron dibujar (entre hojas distintas): ninguna se omite.
    const nom = (id) => {
      const u = v.unidades.find((x) => x.id === id)
      return u ? `${u.rol ? `${u.rol} ` : ''}${etiquetaUnidad(u)}` : '?'
    }
    const resto = v.relaciones.filter((_, k) => !dibujadas.has(k))
    for (const t of trozos(resto, 36)) {
      if (!t.length) break
      let s = txt(X0, 70, 'Relaciones entre unidades que están en hojas distintas:', 13, { b: true })
      t.forEach((r, i) => (s += txt(X0 + 10 + (i >= 18 ? 520 : 0), 98 + (i % 18) * 20, `${nom(r.desde)} → ${nom(r.hasta)} (relación ${r.tipo})`, 12)))
      cuerpos.push({ sub: 'RELACIONES (continuación)', s })
    }
  }
  return cuerpos.map((c, i) => hoja(c.s, i + 1, cuerpos.length, c.sub, op, idm(i + 1)))
}

export function conceptosHTML(valor, op = {}) {
  return laminasConceptos(valor, op)
    .map((svg) => `<div style="page-break-after:always;overflow:auto;margin:0 0 12px">${svg.replace('<svg ', '<svg style="max-width:100%;height:auto" ')}</div>`)
    .join('')
}
