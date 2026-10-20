// 🧭 De dónde viene el enemigo y ✋ mover la plantilla doctrinal sobre la carta (20-10-2026).
//
// Lo pidió Sergio con las capturas de la H.T. P.D. «Ataque de penetración en dos escalones»: «la
// acosté y me la acostó al otro lado… la línea principal de resistencia está al otro lado y el ataque
// debería venir de izquierda a derecha… dame una opción que me permita acomodar la dirección y aparte
// mover la plantilla, o sea mover todo y luego uno por uno».
//
// Qué pasaba: la plantilla (s9 en el compilado) toma como FRENTE el PRIMER LADO que se trazó del Área
// de Operaciones. Si el A.O. se empezó a trazar por el lado norte, la plantilla se acuesta contra el
// norte aunque la L.P.R. y el enemigo estén al oeste; y las avenidas trazadas al revés (de nuestro lado
// hacia el enemigo) entraban «de costado».
//
// Qué hace este módulo:
//   · 🧭 «¿De dónde viene el enemigo?» (hoja P.D., se guarda en picb._pd.dirEnemigo): con una dirección
//     elegida, el frente es el lado del A.O. que MIRA hacia allá (frenteHacia) y cada avenida se toma
//     desde su punta de ese lado (orientarAvenidas). «Automático» deja todo como estaba (1er lado).
//   · ✋ Ajustar la plantilla ya acostada: mover TODO (flechas o arrastrando cualquier ficha), girarla
//     alrededor de nuestra L.P.R., o mover UNA ficha por vez (con su arco de apoyo). La L.P.R. no se
//     mueve: es NUESTRO extremo avanzado, no del enemigo.
//
// Las cuentas son planas (equirectangular local): sobran para los 20-30 km de una plantilla.

const KM_LAT = 110.574
const KM_LNG = (lat) => 111.32 * Math.cos((lat * Math.PI) / 180) || 1e-9

// De dónde VIENE el enemigo: vector (este, norte) que apunta hacia su lado.
export const DIRECCIONES = [
  { id: 'NO', nom: 'NOROESTE', flecha: '↘', v: [-1, 1] },
  { id: 'N', nom: 'NORTE', flecha: '↓', v: [0, 1] },
  { id: 'NE', nom: 'NORESTE', flecha: '↙', v: [1, 1] },
  { id: 'O', nom: 'OESTE', flecha: '→', v: [-1, 0] },
  { id: 'auto', nom: 'AUTOMÁTICO', flecha: '◎', v: null },
  { id: 'E', nom: 'ESTE', flecha: '←', v: [1, 0] },
  { id: 'SO', nom: 'SUDOESTE', flecha: '↗', v: [-1, -1] },
  { id: 'S', nom: 'SUR', flecha: '↑', v: [0, -1] },
  { id: 'SE', nom: 'SUDESTE', flecha: '↖', v: [1, -1] },
]
const dirDe = (id) => DIRECCIONES.find((d) => d.id === id && d.v) || null
const unitario = ([x, y]) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n] }
const valido = (c) => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1])

function proyeccion(lat0, lng0) {
  const kx = KM_LNG(lat0)
  return {
    a: ([lng, lat]) => [(lng - lng0) * kx, (lat - lat0) * KM_LAT],
    de: ([x, y]) => [lng0 + x / kx, lat0 + y / KM_LAT],
  }
}

// El lado del Área de Operaciones que mira hacia el enemigo: la cadena más larga de lados cuya
// normal hacia afuera queda a menos de 60° de la dirección elegida (o el mejor lado, si ninguno).
export function frenteHacia(coords, dirId) {
  const d = dirDe(dirId)
  let pts = (coords || []).filter(valido).map((c) => [c[0], c[1]])
  if (pts.length > 1 && String(pts[0]) === String(pts[pts.length - 1])) pts = pts.slice(0, -1)
  if (!d || pts.length < 3) return null
  const lat0 = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const lng0 = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const P = proyeccion(lat0, lng0)
  const xy = pts.map(P.a)
  const n = xy.length
  let area = 0
  for (let i = 0; i < n; i++) { const [x1, y1] = xy[i], [x2, y2] = xy[(i + 1) % n]; area += x1 * y2 - x2 * y1 }
  const ccw = area > 0
  const v = unitario(d.v)
  const lados = xy.map((p, i) => {
    const q = xy[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1], L = Math.hypot(ex, ey) || 1e-9
    const nx = ccw ? ey / L : -ey / L, ny = ccw ? -ex / L : ex / L
    return { i, largo: L, cara: nx * v[0] + ny * v[1] }
  })
  const mira = lados.map((l) => l.cara >= 0.5)
  let mejor = null
  if (mira.some(Boolean) && !mira.every(Boolean)) {
    // Arranca después de un lado que NO mira, para no partir una cadena en dos.
    const ini = mira.findIndex((m) => !m)
    let cad = null
    for (let k = 1; k <= n; k++) {
      const i = (ini + k) % n
      if (mira[i]) {
        cad = cad || { desde: i, n: 0, largo: 0 }
        cad.n++; cad.largo += lados[i].largo * lados[i].cara
      } else if (cad) { if (!mejor || cad.largo > mejor.largo) mejor = cad; cad = null }
    }
    if (cad && (!mejor || cad.largo > mejor.largo)) mejor = cad
  }
  if (!mejor) {
    const l = lados.reduce((a, b) => (b.cara > a.cara ? b : a))
    mejor = { desde: l.i, n: 1 }
  }
  const out = []
  for (let k = 0; k <= mejor.n; k++) out.push(pts[(mejor.desde + k) % n])
  return out
}

// Cada avenida arranca en la punta que está del lado del enemigo (s9 toma coords[0] como su origen).
export function orientarAvenidas(avenidas, dirId) {
  const d = dirDe(dirId)
  if (!d) return avenidas
  const v = unitario(d.v)
  return (avenidas || []).map((a) => {
    const c = (a?.coords || []).filter(valido)
    if (c.length < 2) return a
    const P = proyeccion(c[0][1], c[0][0])
    const [x0, y0] = P.a(c[0]), [x1, y1] = P.a(c[c.length - 1])
    return x1 * v[0] + y1 * v[1] > x0 * v[0] + y0 * v[1] ? { ...a, coords: [...a.coords].reverse() } : a
  })
}

// Lo que el compilado le pasa a s9 en lugar de las avenidas y el frente guardado del A.O.
export function entradaPlantilla(areaOps, pd, avenidas) {
  const dir = pd?.dirEnemigo
  const frente = dirDe(dir) ? frenteHacia(areaOps?.coords, dir) : null
  if (!frente) return { avenidas, aoFrente: areaOps?.frente || null }
  return { avenidas: orientarAvenidas(avenidas, dir), aoFrente: frente }
}

// Deja dicho en la plantilla de dónde se tomó el frente (la L.P.R. y los avisos).
export function marcarDireccion(p, pd) {
  const d = dirDe(pd?.dirEnemigo)
  if (!p || !p.ok || !d) return p
  const lineas = (p.lineas || []).map((l) => l.tipo !== 'lpr' ? l : {
    ...l,
    fuente: `Es el lado del Área de Operaciones que MIRA AL ${d.nom}: lo elegiste en «🧭 ¿De dónde viene el enemigo?» de la hoja P.D. Todo lo del enemigo se mide DESDE acá hacia su retaguardia, y nada puede quedar de este lado.`,
  })
  const aviso = `🧭 El enemigo viene del ${d.nom} (elegido en la hoja P.D.): la L.P.R. es el lado del A.O. que mira al ${d.nom.toLowerCase()} y las avenidas se toman desde su punta de ese lado.`
  return { ...p, lineas, dirEnemigo: d.id, avisos: [aviso, ...(p.avisos || []).filter((a) => !/NO TIENE FRENTE GUARDADO/.test(a))] }
}

// ── Mover y girar ────────────────────────────────────────────────────────────────────────────────

const esLpr = (l) => l?.tipo === 'lpr'
function pivote(p) {
  const lpr = (p.lineas || []).find(esLpr)
  const pts = lpr?.coords?.filter(valido)?.length ? lpr.coords.filter(valido)
    : [...(p.marcas || []).map((m) => m.centro), ...(p.bandas || []).flatMap((b) => b.coords || [])].filter(valido)
  if (!pts.length) return null
  if (lpr && pts.length >= 2) return medio(pts)
  return [pts.reduce((s, c) => s + c[0], 0) / pts.length, pts.reduce((s, c) => s + c[1], 0) / pts.length]
}
// El punto medio de la L.P.R. medido sobre la línea.
function medio(pts) {
  const P = proyeccion(pts[0][1], pts[0][0]), xy = pts.map(P.a)
  let total = 0
  for (let i = 1; i < xy.length; i++) total += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1])
  let falta = total / 2
  for (let i = 1; i < xy.length; i++) {
    const L = Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1])
    if (L >= falta && L > 0) { const t = falta / L; return P.de([xy[i - 1][0] + t * (xy[i][0] - xy[i - 1][0]), xy[i - 1][1] + t * (xy[i][1] - xy[i - 1][1])]) }
    falta -= L
  }
  return pts[pts.length - 1]
}

// Aplica f(punto) a todo lo del enemigo (no a la L.P.R.); `girar` suma grados al rumbo de las fichas.
function transformar(p, f, { girar = 0, soloFicha = null } = {}) {
  const P = (c) => (valido(c) ? f(c) : c)
  const anillo = (cs) => (Array.isArray(cs) ? cs.map(P) : cs)
  const rumbo = (r) => (Number.isFinite(r) ? (((r + girar) % 360) + 360) % 360 : r)
  if (soloFicha) {
    const marcas = (p.marcas || []).map((m) => (m === soloFicha ? { ...m, centro: P(m.centro), SIDaMano: true } : m))
    const conos = (p.conos || []).map((c) => (c.de && c.de === soloFicha.id ? { ...c, centro: P(c.centro), coords: anillo(c.coords) } : c))
    return { ...p, marcas, conos }
  }
  return {
    ...p,
    marcas: (p.marcas || []).map((m) => ({ ...m, centro: P(m.centro), rot: rumbo(m.rot) })),
    conos: (p.conos || []).map((c) => ({ ...c, centro: P(c.centro), coords: anillo(c.coords) })),
    bandas: (p.bandas || []).map((b) => ({ ...b, coords: anillo(b.coords) })),
    lineas: (p.lineas || []).map((l) => (esLpr(l) ? l : { ...l, coords: anillo(l.coords) })),
  }
}
const sello = (p, cambio) => {
  const a = p.SIDajustada || { movidaKm: 0, giro: 0, fichas: 0 }
  return { ...p, SIDajustada: { movidaKm: +(a.movidaKm + (cambio.km || 0)).toFixed(1), giro: (((a.giro + (cambio.giro || 0)) % 360) + 360) % 360, fichas: a.fichas + (cambio.ficha ? 1 : 0) } }
}

// Corre toda la plantilla dx km al este y dy km al norte.
export function moverPlantilla(p, dxKm, dyKm) {
  if (!p?.ok || (!dxKm && !dyKm)) return p
  const piv = pivote(p) || [0, 0]
  return correr(p, dxKm / KM_LNG(piv[1]), dyKm / KM_LAT, Math.hypot(dxKm, dyKm))
}
const correr = (p, dLng, dLat, km) => sello(transformar(p, (c) => [c[0] + dLng, c[1] + dLat]), { km })

// Corre toda la plantilla lo que se arrastró una ficha (de `desde` a `hasta`, en [lng, lat]).
export function arrastrarPlantilla(p, desde, hasta) {
  if (!p?.ok || !valido(desde) || !valido(hasta)) return p
  const dLng = hasta[0] - desde[0], dLat = hasta[1] - desde[1]
  if (!dLng && !dLat) return p
  return correr(p, dLng, dLat, Math.hypot(dLng * KM_LNG(desde[1]), dLat * KM_LAT))
}

// Gira toda la plantilla `grados` (+ = horario) alrededor del medio de nuestra L.P.R.
export function girarPlantilla(p, grados) {
  if (!p?.ok || !grados) return p
  const piv = pivote(p)
  if (!piv) return p
  const P = proyeccion(piv[1], piv[0]), t = (grados * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t)
  const f = (c) => { const [x, y] = P.a(c); return P.de([x * cs + y * sn, -x * sn + y * cs]) }
  return sello(transformar(p, f, { girar: grados }), { giro: grados })
}

// Mueve UNA ficha (y su arco de apoyo, si es artillería) lo que se la arrastró.
export function moverFicha(p, marca, desde, hasta) {
  if (!p?.ok || !valido(desde) || !valido(hasta)) return p
  const m = (p.marcas || []).find((x) => x === marca) || (marca?.id && (p.marcas || []).find((x) => x.id === marca.id))
  if (!m) return p
  const dLng = hasta[0] - desde[0], dLat = hasta[1] - desde[1]
  return sello(transformar(p, (c) => [c[0] + dLng, c[1] + dLat], { soloFicha: m }), { ficha: true })
}

// ── El panel de la hoja P.D. ─────────────────────────────────────────────────────────────────────
// pd/onPd: picb._pd; plantilla: la acostada; onReacostar(dir): vuelve a acostarla con esa dirección;
// ajuste: { modo, onModo, onAjustar } — modo de arrastre en la carta (null | 'todo' | 'ficha') y el
// setter de la plantilla (acepta función).
const S = {
  caja: { display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(92,225,255,0.06)', border: '1px solid rgba(92,225,255,0.35)', borderRadius: 8, padding: 8 },
  rot: { font: '700 10.5px/1 Arial', letterSpacing: '.1em', color: '#8fb0c4', textTransform: 'uppercase' },
  nota: { fontSize: 10.5, color: '#9fb8c8', lineHeight: 1.45 },
  rosa: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, maxWidth: 300 },
  fila: { display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  btn: { background: 'rgba(0,0,0,0.35)', color: '#cdd8e8', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', fontSize: 11.5 },
  on: { background: 'rgba(92,225,255,0.18)', border: '1px solid #5ce1ff', color: '#dff8ff', fontWeight: 700 },
}

export function PanelAjuste({ react: R, pd = {}, onPd, plantilla, onReacostar, ajuste = null }) {
  const h = R.createElement
  const [paso, setPaso] = R.useState(1)
  const dir = dirDe(pd.dirEnemigo) ? pd.dirEnemigo : 'auto'
  const acostada = !!plantilla?.ok
  const elegir = (id) => {
    if (id === dir) return
    onPd?.({ ...pd, dirEnemigo: id })
    if (acostada) onReacostar?.(id)
  }
  const ajustar = (fn) => ajuste?.onAjustar?.((p) => (p?.ok ? fn(p) : p))
  const modo = ajuste?.modo || null
  const b = (txt, onClick, title, on = false, key) => h('button', { type: 'button', key: key || txt, title, style: { ...S.btn, ...(on ? S.on : null) }, onClick }, txt)
  const d = DIRECCIONES.find((x) => x.id === dir)
  const aj = plantilla?.SIDajustada

  const hijos = [
    h('div', { key: 'r1', style: S.rot }, '🧭 ¿De dónde viene el enemigo?'),
    h('div', { key: 'n1', style: S.nota }, 'El ataque entra CONTRA nuestra L.P.R. Elegí de qué lado viene el enemigo: el frente pasa a ser el lado del Área de Operaciones que mira hacia allá (la L.P.R. azul), y cada avenida se toma desde su punta de ese lado. Ej.: si la L.P.R. está al oeste y atacan de izquierda a derecha, elegí OESTE. «Automático» usa el primer lado que trazaste del A.O.'),
    h('div', { key: 'rosa', style: S.rosa, 'data-pl': 'rosa' },
      DIRECCIONES.map((x) => b(x.v ? `${x.flecha} ${x.nom}` : '◎ Automático', () => elegir(x.id), x.v ? `El enemigo viene del ${x.nom} y ataca ${x.flecha}` : 'El frente es el primer lado que trazaste del A.O.', x.id === dir, x.id))),
    h('div', { key: 'n2', style: S.nota }, dir === 'auto' ? 'Ahora: automático (primer lado trazado del A.O.).' : `Ahora: el enemigo viene del ${d.nom} y ataca ${d.flecha}.` + (acostada ? '' : ' Se aplica al acostarla.')),
  ]
  if (acostada) {
    const fl = (txt, dx, dy, t) => b(txt, () => ajustar((p) => moverPlantilla(p, dx * paso, dy * paso)), t)
    const gi = (txt, g) => b(txt, () => ajustar((p) => girarPlantilla(p, g)), `Girar toda la plantilla ${Math.abs(g)}° ${g > 0 ? 'en sentido horario' : 'en sentido antihorario'} alrededor de nuestra L.P.R.`)
    hijos.push(
      h('div', { key: 'r2', style: { ...S.rot, marginTop: 4 } }, '✋ Acomodar la plantilla en la carta'),
      h('div', { key: 'mt', style: S.fila },
        h('span', { style: S.nota }, 'Mover TODO:'), fl('←', -1, 0, 'Al oeste'), fl('↑', 0, 1, 'Al norte'), fl('↓', 0, -1, 'Al sur'), fl('→', 1, 0, 'Al este'),
        h('select', { value: paso, onChange: (e) => setPaso(+e.target.value), style: { ...S.btn, padding: '4px' }, title: 'Cuánto se mueve con cada flecha' },
          [0.25, 0.5, 1, 2, 5].map((k) => h('option', { key: k, value: k }, `${k} km`)))),
      h('div', { key: 'gi', style: S.fila },
        h('span', { style: S.nota }, 'Girar TODO:'), gi('⟲ 15°', -15), gi('⟲ 5°', -5), gi('⟳ 5°', 5), gi('⟳ 15°', 15), gi('↻ 180°', 180)),
      h('div', { key: 'ar', style: S.fila },
        h('span', { style: S.nota }, 'Arrastrar en la carta:'),
        b('✋ Toda la plantilla', () => ajuste?.onModo?.(modo === 'todo' ? null : 'todo'), 'Arrastrá CUALQUIER ficha de la plantilla y se mueve todo junto', modo === 'todo'),
        b('☝️ Una ficha por vez', () => ajuste?.onModo?.(modo === 'ficha' ? null : 'ficha'), 'Arrastrá una ficha y sólo se mueve ésa (con su arco, si es artillería)', modo === 'ficha'),
        modo && b('✓ Listo', () => ajuste?.onModo?.(null), 'Dejar de arrastrar')),
      h('div', { key: 'n3', style: S.nota },
        modo === 'todo' ? '✋ Arrastrá cualquier ficha roja de la plantilla: se mueve todo junto.'
          : modo === 'ficha' ? '☝️ Arrastrá la ficha que quieras: se mueve sólo ésa.'
            : 'La L.P.R. azul no se mueve: es NUESTRO extremo avanzado. Las distancias (km) de las fichas son las del cuadro: si las movés, lo que vale es dónde quedaron.'),
      aj && h('div', { key: 'aj', style: S.nota, 'data-pl': 'ajustada' },
        `✎ Ajustada a mano: movida ${aj.movidaKm} km, girada ${aj.giro}°, ${aj.fichas} ficha(s) movidas una por una. Para volver a la doctrinal, apretá «Acostar» de nuevo.`),
    )
  }
  return h('div', { style: S.caja, 'data-pl': 'ajuste' }, hijos)
}
