// 🎖️ PALETA DE SÍMBOLOS — 21-11-2026.
//
// Sergio, mirando «⑤ Quiénes dependen de mí»: «que se pueda directamente seleccionar el icono o el símbolo de la
// unidad y solo se le coloque el número o nombre… construir una por una es muy largo y tedioso… que se seleccione
// una y ya se vaya quedando en la lista, y otra sí, para que se vaya sumando a la lista».
//
// Qué hay:
//   · simboloSVG(fila): el mismo símbolo de la carta (marco azul, signo del arma adentro, magnitud arriba), en SVG,
//     para los botones de la paleta y para cada renglón de la lista. Es el dibujo de simboloUnidad.js (canvas).
//   · PALETA: por escalón (CE · DIV · Brig. · Rgto. · Bat. · Cía. · Sec.), los tipos de unidad con su sigla
//     (RI-, RIM-, BAT. ING.-…). Tocar uno suma un renglón con la sigla ya puesta: se escribe solo el número.
//   · prefijoDe / incompleta: «Enter» suma otra igual (RI-21 → RI-…); un renglón que quedó solo con la sigla no se
//     guarda hasta que tenga su número.
// Todo es puro (se prueba en Node).

export const VERSION_PALETA = '20261121'

const AZUL = '#1f6dff'
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const n1 = (n) => Math.round(n * 10) / 10

// La magnitud de escalón (arriba del marco), como en la carta.
const MAGNITUD = {
  escuadra: ['punto', 1], seccion: ['punto', 3], compania: ['barra', 1], batallon: ['barra', 2], regimiento: ['barra', 3],
  brigada: ['aspa', 1], division: ['aspa', 2], cuerpo: ['aspa', 3], ejercito: ['aspa', 4],
}
function magnitud(escalon, cx, y) {
  const [tipo, n] = MAGNITUD[escalon] || []
  if (!tipo) return ''
  if (tipo === 'punto') {
    const sep = 7, x0 = cx - ((n - 1) * sep) / 2
    return Array.from({ length: n }, (_, i) => `<circle cx="${n1(x0 + i * sep)}" cy="${y + 6}" r="2.7" fill="${AZUL}"/>`).join('')
  }
  let d = ''
  if (tipo === 'barra') {
    const sep = 7, x0 = cx - ((n - 1) * sep) / 2
    for (let i = 0; i < n; i++) d += `M${n1(x0 + i * sep)} ${y}V${y + 12}`
  } else {
    const w = 9, sep = 11, x0 = cx - ((n - 1) * sep) / 2
    for (let i = 0; i < n; i++) {
      const x = x0 + i * sep
      d += `M${n1(x - w / 2)} ${y}L${n1(x + w / 2)} ${y + 12}M${n1(x + w / 2)} ${y}L${n1(x - w / 2)} ${y + 12}`
    }
  }
  return `<path d="${d}" stroke="${AZUL}" stroke-width="3" stroke-linecap="round" fill="none"/>`
}

// Un rótulo de texto que entra en el ancho (como dibujarCodigo de la carta: una línea; si no entra, dos).
function rotulo(t, cx, cy, ancho) {
  const s = String(t || '').trim()
  if (!s) return ''
  const atrib = `text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="${AZUL}"`
  const cabe = (x, px) => x.length * px * 0.62 <= ancho
  for (let px = 17; px >= 9; px--) if (cabe(s, px)) return `<text x="${cx}" y="${n1(cy + 1)}" font-size="${px}" ${atrib}>${esc(s)}</text>`
  const medio = s.length / 2
  let corte = -1
  for (let i = 0; i < s.length; i++) if ((s[i] === ' ' || s[i] === '.') && i < s.length - 1 && (corte < 0 || Math.abs(i - medio) < Math.abs(corte - medio))) corte = i
  if (corte < 0) corte = Math.ceil(medio) - 1
  const a = s.slice(0, corte + 1).trim(), b = s.slice(corte + 1).trim()
  let px = 13
  while (px > 7 && !(cabe(a, px) && cabe(b, px))) px--
  return `<text x="${cx}" y="${n1(cy - px * 0.55)}" font-size="${px}" ${atrib}>${esc(a)}</text><text x="${cx}" y="${n1(cy + px * 0.6)}" font-size="${px}" ${atrib}>${esc(b)}</text>`
}

const ABREV_SERVICIO = {
  intendencia: 'Int', transporte: 'Tte', mantenimiento: 'Mant', veterinaria: 'Vet', policiamilitar: 'PM', antitanque: 'AT',
  morteros: 'Mort', ametralladoras: 'Amtr', lanzacohetes: 'LC', logistica: 'Log', materialbelico: 'MB',
}

// El signo del arma dentro del marco (x, y, w, h), copiado de dibujarArma (simboloUnidad.js).
function signo(arma, textoSimbolo, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, m = Math.min(w, h)
  const L = (d) => `<path d="${d}" stroke="${AZUL}" stroke-width="3" stroke-linejoin="round" fill="none"/>`
  const aspa = `M${x} ${y}L${x + w} ${y + h}M${x + w} ${y}L${x} ${y + h}`
  const diagonal = `M${x} ${y + h}L${x + w} ${y}`
  const oruga = `<ellipse cx="${cx}" cy="${cy}" rx="${n1(w * 0.3)}" ry="${n1(h * 0.26)}" stroke="${AZUL}" stroke-width="3" fill="none"/>`
  const circulo = (r, ox = cx, oy = cy, lleno = false) => `<circle cx="${n1(ox)}" cy="${n1(oy)}" r="${n1(r)}" ${lleno ? `fill="${AZUL}"` : `stroke="${AZUL}" stroke-width="3" fill="none"`}/>`
  switch (arma) {
    case 'infanteria': return L(aspa)
    case 'mecanizada': return L(aspa) + oruga
    case 'motorizada': {
      const r = m * 0.17
      return L(aspa) + circulo(r) + L(`M${n1(cx - r * 1.6)} ${n1(cy - r)}L${n1(cx + r * 1.6)} ${n1(cy - r)}`)
    }
    case 'andina': {
      const t = m * 0.3
      return L(aspa) + L(`M${cx} ${n1(cy - t)}L${n1(cx + t)} ${n1(cy + t * 0.8)}L${n1(cx - t)} ${n1(cy + t * 0.8)}Z`)
    }
    case 'selva': return L(aspa) + circulo(m * 0.24)
    case 'caballeria': return L(diagonal)
    case 'cabmec': return L(diagonal) + oruga
    case 'blindada': return oruga
    case 'artilleria': return circulo(m * 0.18, cx, cy, true)
    case 'antiaerea':
      return circulo(m * 0.16, cx, cy + h * 0.12, true) + L(`M${n1(cx - w * 0.22)} ${n1(cy - h * 0.04)}L${cx} ${n1(cy - h * 0.3)}L${n1(cx + w * 0.22)} ${n1(cy - h * 0.04)}`)
    case 'ingenieria': {
      const aw = w * 0.52, ah = h * 0.42
      return L(`M${n1(cx - aw / 2)} ${n1(cy + ah / 2)}V${n1(cy - ah / 2)}H${n1(cx + aw / 2)}V${n1(cy + ah / 2)}M${cx} ${n1(cy - ah / 2)}V${n1(cy + ah / 2)}`)
    }
    case 'comunicaciones':
      return L(`M${n1(cx - w * 0.18)} ${n1(y + h * 0.2)}L${n1(cx + w * 0.05)} ${cy}L${n1(cx - w * 0.05)} ${cy}L${n1(cx + w * 0.18)} ${n1(y + h * 0.8)}`)
    case 'aerotransportada': {
      const r = w * 0.18
      return L(`M${n1(cx - 2 * r)} ${cy}A${n1(r)} ${n1(r)} 0 0 1 ${cx} ${cy}A${n1(r)} ${n1(r)} 0 0 1 ${n1(cx + 2 * r)} ${cy}`)
    }
    case 'aviacion': {
      const r = m * 0.32
      return L(`M${n1(cx - r)} ${n1(cy - r * 0.5)}L${n1(cx + r)} ${n1(cy + r * 0.5)}M${n1(cx - r)} ${n1(cy + r * 0.5)}L${n1(cx + r)} ${n1(cy - r * 0.5)}`) + circulo(2.4, cx, cy, true)
    }
    case 'sanidad': {
      const r = m * 0.26
      return L(`M${cx} ${n1(cy - r)}V${n1(cy + r)}M${n1(cx - r)} ${cy}H${n1(cx + r)}`)
    }
    case 'ninguna': return rotulo(textoSimbolo, cx, cy, w - 8)
    default: return ABREV_SERVICIO[arma] ? rotulo(ABREV_SERVICIO[arma], cx, cy, w - 8) : ''
  }
}

// El símbolo de una fila ({ escalon, arma, textoSimbolo }) en SVG. `ancho` en px (el alto sale solo).
export function simboloSVG(fila = {}, { ancho = 56 } = {}) {
  const W = 72, H = 60, x = 4, y = 18, w = 64, h = 40
  const alto = Math.round((ancho * H) / W)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${ancho}" height="${alto}" aria-hidden="true" focusable="false" style="display:block">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>` +
    signo(fila.arma || 'ninguna', fila.textoSimbolo, x, y, w, h) +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${AZUL}" stroke-width="3.6"/>` +
    magnitud(fila.escalon, x + w / 2, 2) +
    `</svg>`
  )
}

// ─── La paleta ───────────────────────────────────────────────────────────────────────────────────────────────────

export const ESCALONES_PALETA = [
  ['cuerpo', 'CE'], ['division', 'DIV'], ['brigada', 'Brig.'], ['regimiento', 'Rgto.'], ['batallon', 'Bat.'], ['compania', 'Cía.'], ['seccion', 'Sec.'],
]

const P = (escalon, rotulo, prefijo, arma, titulo, extra = {}) => ({ id: `${escalon}:${prefijo}`, escalon, rotulo, prefijo, arma, titulo, ...extra })

export const PALETA = [
  P('cuerpo', 'CE', 'CE-', 'ninguna', 'Cuerpo de Ejército', { textoSimbolo: 'CE' }),

  P('division', 'Infantería', 'DIV-', 'infanteria', 'División de Infantería'),
  P('division', 'Mecanizada', 'DIV. MEC.-', 'mecanizada', 'División Mecanizada'),
  P('division', 'Motorizada', 'DIV. MOT.-', 'motorizada', 'División Motorizada'),
  P('division', 'Montaña', 'DIV. MONT.-', 'andina', 'División de Montaña (andina)'),
  P('division', 'Selva', 'DIV. SELVA-', 'selva', 'División de Selva'),
  P('division', 'Blindada', 'DIV. BLIND.-', 'blindada', 'División Blindada'),
  P('division', 'Caballería', 'DIV. CAB.-', 'caballeria', 'División de Caballería'),

  P('brigada', 'Infantería', 'BRIG. INF.-', 'infanteria', 'Brigada de Infantería'),
  P('brigada', 'Mecanizada', 'BRIG. MEC.-', 'mecanizada', 'Brigada Mecanizada'),
  P('brigada', 'Motorizada', 'BRIG. MOT.-', 'motorizada', 'Brigada Motorizada'),
  P('brigada', 'Montaña', 'BRIG. MONT.-', 'andina', 'Brigada de Montaña (andina)'),
  P('brigada', 'Selva', 'BRIG. SELVA-', 'selva', 'Brigada de Selva'),
  P('brigada', 'Blindada', 'BRIG. BLIND.-', 'blindada', 'Brigada Blindada'),
  P('brigada', 'Caballería', 'BRIG. CAB.-', 'caballeria', 'Brigada de Caballería'),
  P('brigada', 'Aerotransp.', 'BRIG. AEROT.-', 'aerotransportada', 'Brigada Aerotransportada'),

  P('regimiento', 'RI', 'RI-', 'infanteria', 'Regimiento de Infantería'),
  P('regimiento', 'RIM', 'RIM-', 'mecanizada', 'Regimiento de Infantería Mecanizado'),
  P('regimiento', 'RI Mot.', 'RI MOT.-', 'motorizada', 'Regimiento de Infantería Motorizado'),
  P('regimiento', 'RI Mont.', 'RI MONT.-', 'andina', 'Regimiento de Infantería de Montaña (andino)'),
  P('regimiento', 'RI Selva', 'RI SELVA-', 'selva', 'Regimiento de Infantería de Selva'),
  P('regimiento', 'RSS', 'RSS-', 'ninguna', 'Regimiento SAT. SELV. (RSS, como en la DEMIL)', { textoSimbolo: 'SAT.SELV.' }),
  P('regimiento', 'RC', 'RC-', 'caballeria', 'Regimiento de Caballería'),
  P('regimiento', 'RCM', 'RCM-', 'cabmec', 'Regimiento de Caballería Mecanizado'),
  P('regimiento', 'RCB', 'RCB-', 'cabmec', 'Regimiento de Caballería Blindado'),
  P('regimiento', 'RA', 'RA-', 'artilleria', 'Regimiento de Artillería'),
  P('regimiento', 'RAA', 'RAA-', 'antiaerea', 'Regimiento de Artillería Antiaérea'),

  P('batallon', 'BI', 'BI-', 'infanteria', 'Batallón de Infantería'),
  P('batallon', 'BI Mec.', 'BI MEC.-', 'mecanizada', 'Batallón de Infantería Mecanizado'),
  P('batallon', 'BI Mot.', 'BI MOT.-', 'motorizada', 'Batallón de Infantería Motorizado'),
  P('batallon', 'GA', 'GA-', 'artilleria', 'Grupo de Artillería'),
  P('batallon', 'Ing.', 'BAT. ING.-', 'ingenieria', 'Batallón de Ingeniería'),
  P('batallon', 'Com.', 'BAT. COM.-', 'comunicaciones', 'Batallón de Comunicaciones'),
  P('batallon', 'Log.', 'BAT. LOG.-', 'logistica', 'Batallón Logístico'),
  P('batallon', 'P.M.', 'BAT. P.M.-', 'policiamilitar', 'Batallón de Policía Militar'),
  P('batallon', 'I.M.', 'BAT. I.M.-', 'ninguna', 'Batallón de Inteligencia Militar', { textoSimbolo: 'IM' }),
  P('batallon', 'AT', 'BAT. AT-', 'antitanque', 'Batallón Antitanque'),
  P('batallon', 'Sanidad', 'BAT. SAN.-', 'sanidad', 'Batallón de Sanidad'),
  P('batallon', 'C y S', 'BAT. C Y S-', 'ninguna', 'Batallón de Comando y Servicios (C Y S)', { textoSimbolo: 'C Y S' }),

  P('compania', 'Inf.', 'COMP. INF.-', 'infanteria', 'Compañía de Infantería'),
  P('compania', 'Inf. Mec.', 'COMP. INF. MEC.-', 'mecanizada', 'Compañía de Infantería Mecanizada'),
  P('compania', 'AT', 'COMP. AT-', 'antitanque', 'Compañía Antitanque'),
  P('compania', 'Ing.', 'COMP. ING.-', 'ingenieria', 'Compañía de Ingeniería'),
  P('compania', 'Com.', 'COMP. COM.-', 'comunicaciones', 'Compañía de Comunicaciones'),
  P('compania', 'Log.', 'COMP. LOG.-', 'logistica', 'Compañía Logística'),
  P('compania', 'P.M.', 'COMP. P.M.-', 'policiamilitar', 'Compañía de Policía Militar'),
  P('compania', 'Sanidad', 'COMP. SAN.-', 'sanidad', 'Compañía de Sanidad'),
  P('compania', 'Batería', 'BTRÍA.-', 'artilleria', 'Batería de Artillería'),
  P('compania', 'Escuadrón', 'ESC.-', 'caballeria', 'Escuadrón de Caballería'),
  P('compania', 'Av. Ej.', 'CÍA. AV. EJ.-', 'aviacion', 'Compañía de Aviación del Ejército'),
  P('compania', 'C y S', 'COMP. C Y S-', 'ninguna', 'Compañía de Comando y Servicios (C Y S)', { textoSimbolo: 'C Y S' }),
  P('compania', 'Sat. Mont.', 'COMP. SAT. MONT.-', 'ninguna', 'Compañía SAT. MONT. (como en los COE)', { textoSimbolo: 'SAT.MONT.' }),

  P('seccion', 'Inf.', 'SEC. INF.-', 'infanteria', 'Sección de Infantería'),
  P('seccion', 'Com.', 'SEC. COM.-', 'comunicaciones', 'Sección de Comunicaciones'),
  P('seccion', 'I.M.', 'SEC. I.M.-', 'ninguna', 'Sección de Inteligencia Militar', { textoSimbolo: 'IM' }),
  P('seccion', 'Ing.', 'SECC. ING.-', 'ingenieria', 'Sección de Ingeniería'),
  P('seccion', 'Av. Ej.', 'SEC. AV. EJ.-', 'aviacion', 'Sección de Aviación del Ejército'),
  P('seccion', 'Expl.', 'SEC. EXPL.-', 'caballeria', 'Sección de Exploración'),
]

export const deEscalon = (escalon) => PALETA.filter((p) => p.escalon === escalon)

// La pestaña que se abre sola: el escalón de abajo de mi nivel.
export const escalonDebajo = (nivel) =>
  ({ ejercito: 'cuerpo', cuerpo: 'division', division: 'regimiento', brigada: 'batallon', regimiento: 'batallon', batallon: 'compania', compania: 'seccion' })[nivel] || 'regimiento'

// El renglón que suma un botón de la paleta: la sigla puesta, falta el número.
export function filaDePaleta(item = {}) {
  return {
    designacion: item.prefijo || '',
    prefijo: item.prefijo || '',
    escalon: item.escalon || 'batallon',
    arma: item.arma || 'infanteria',
    ...(item.textoSimbolo ? { textoSimbolo: item.textoSimbolo } : {}),
  }
}

// «RI-21» → «RI-» · «DIV. MEC.-1» → «DIV. MEC.-» · «CE-II» → «CE-» · «RGTO. ART. 100» → «RGTO. ART. ».
export function prefijoDe(designacion = '') {
  const s = String(designacion || '').trim()
  const m = s.match(/^(.*?[-\s.–]\s*)(?:\d+[A-Z]?|[IVXLC]+)\s*(?:\(-\))?$/)
  return m ? m[1] : ''
}

const limpio = (s) => String(s ?? '').split(/\s+/).filter(Boolean).join(' ')

// Quedó solo con la sigla de la paleta (le falta el número o el nombre).
export const incompleta = (f) => !!limpio(f?.prefijo) && limpio(f.designacion).toUpperCase() === limpio(f.prefijo).toUpperCase()

// La fila que sigue al tocar «Enter»: la misma clase de unidad, sin el número.
export function otraIgual(f = {}) {
  const pre = limpio(f.prefijo) && !incompleta(f) && limpio(f.designacion).toUpperCase().startsWith(limpio(f.prefijo).toUpperCase()) ? f.prefijo : prefijoDe(f.designacion) || (limpio(f.designacion) ? limpio(f.designacion) + '-' : '')
  return {
    designacion: pre,
    prefijo: pre,
    escalon: f.escalon || 'batallon',
    arma: f.arma || 'infanteria',
    ...(f.textoSimbolo ? { textoSimbolo: f.textoSimbolo } : {}),
  }
}
