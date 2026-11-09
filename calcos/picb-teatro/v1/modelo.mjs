// 🌎 PICB DEL TEATRO (FF.TT.T.O.) — el modelo, sin DOM (se prueba en Node).
//
// Lo pidió Sergio el 09-11-2026: «a nivel pequeño las distancias permiten sacar un análisis, pero
// un teatro de operaciones es demasiado grande… quisiera que salga como el calco del enemigo, o un
// calco de poblaciones o comunicaciones sólo con lo más alto, lo más sobresaliente». La PICB de
// CE y DIV no se toca: esto sólo se enciende cuando la unidad considerada son las FF.TT.T.O. o el
// ejercicio trae el teatro (TO / subteatros).
//
// Los 4 pasos del PMTD 2017 (Segundo paso del Análisis de la Misión), a escala operacional
// (cartas 1:1.000.000 y 1:250.000, como el Anexo «B» de DIAMANTE):
//   1. Definir el ambiente del campo de batalla → TO, subteatros, AO de los CE, Área de Interés.
//   2. Describir sus efectos → calcos de Comunicaciones, Poblaciones, Grandes obstáculos y el de
//      Efectos del teatro (corredores/DEOP, nudos, pasos fronterizos, terreno decisivo).
//   3. Evaluar la amenaza → orden de batalla de las GG.UU. y poder relativo por DEOP.
//   4. Cursos de acción del enemigo → el CALCO DEL ENEMIGO con tiempos D+n por DEOP medidos sobre
//      las rutas reales, las A.I.N. en pasos y nudos y el CAE más probable / más peligroso.
// Las cifras de poder y de ritmo de avance son REFERENCIAS (se dicen en voz alta y se editan).

// ── geometría (grados, km) ──────────────────────────────────────────────────────────────
export const R_TIERRA = 6371.0088
const rad = (g) => (g * Math.PI) / 180
export function distKm(a, b) {
  const dLa = rad(b[1] - a[1]), dLo = rad(b[0] - a[0])
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLo / 2) ** 2
  return 2 * R_TIERRA * Math.asin(Math.min(1, Math.sqrt(h)))
}
export function largoKm(c) { let s = 0; for (let i = 1; i < c.length; i++) s += distKm(c[i - 1], c[i]); return s }
export function areaKm2(anillo) {
  // Área esférica aproximada (fórmula del exceso para polígonos chicos frente a la Tierra).
  let s = 0
  const n = anillo.length
  for (let i = 0; i < n; i++) {
    const [x1, y1] = anillo[i], [x2, y2] = anillo[(i + 1) % n]
    s += rad(x2 - x1) * (2 + Math.sin(rad(y1)) + Math.sin(rad(y2)))
  }
  return Math.abs((s * R_TIERRA * R_TIERRA) / 2)
}
export function enPoligono(p, anillo) {
  let s = false
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i], [xj, yj] = anillo[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) s = !s
  }
  return s
}
export function cajaDe(listas) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity
  const ver = (p) => { if (p[0] < a) a = p[0]; if (p[1] < b) b = p[1]; if (p[0] > c) c = p[0]; if (p[1] > d) d = p[1] }
  const recorrer = (x) => { if (typeof x[0] === 'number') ver(x); else for (const y of x) recorrer(y) }
  recorrer(listas)
  return [a, b, c, d]
}
export const cajasSeTocan = (p, q) => p[0] <= q[2] && p[2] >= q[0] && p[1] <= q[3] && p[3] >= q[1]
// Casco convexo (cadena monótona) en coordenadas planas locales.
export function casco(puntos) {
  const pts = puntos.map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length < 3) return pts
  const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const abajo = [], arriba = []
  for (const p of pts) { while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], p) <= 0) abajo.pop(); abajo.push(p) }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], p) <= 0) arriba.pop(); arriba.push(p) }
  return abajo.slice(0, -1).concat(arriba.slice(0, -1))
}
// Casco ensanchado `km` hacia afuera: un círculo de 16 puntos en cada vértice y casco otra vez.
export function cascoEnsanchado(puntos, km) {
  const mas = []
  for (const [lo, la] of puntos) {
    const dy = km / 110.574, dx = km / (111.32 * Math.cos(rad(la)) || 1e-9)
    for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8; mas.push([lo + dx * Math.cos(a), la + dy * Math.sin(a)]) }
  }
  return casco(mas).map((p) => [Math.round(p[0] * 1e4) / 1e4, Math.round(p[1] * 1e4) / 1e4])
}
// Distancia de un punto a una polilínea: { d (km), punto, i (tramo), t }
export function masCercanoEnLinea(p, linea) {
  let mejor = { d: Infinity, punto: linea[0], i: 0, t: 0 }
  const kx = 111.32 * Math.cos(rad(p[1])), ky = 110.574
  for (let i = 1; i < linea.length; i++) {
    const a = linea[i - 1], b = linea[i]
    const ax = (a[0] - p[0]) * kx, ay = (a[1] - p[1]) * ky, bx = (b[0] - p[0]) * kx, by = (b[1] - p[1]) * ky
    const vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy
    let t = L > 0 ? -(ax * vx + ay * vy) / L : 0
    t = Math.max(0, Math.min(1, t))
    const qx = ax + t * vx, qy = ay + t * vy, d = Math.hypot(qx, qy)
    if (d < mejor.d) mejor = { d, punto: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])], i, t }
  }
  return mejor
}

// ── textos ──────────────────────────────────────────────────────────────────────────────
export const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const MAY = (s) => sinTildes(s).toUpperCase()
export const redondeo = (n, d = 0) => { const f = 10 ** d; return Math.round(n * f) / f }
export const fmtKm = (n) => `${Math.round(n).toLocaleString('es-BO')} km`
export const fmtKm2 = (n) => `${Math.round(n).toLocaleString('es-BO')} km²`
export const fmtDia = (d) => (d <= 0.05 ? 'D' : `D+${redondeo(d, 1).toLocaleString('es-BO')}`)

// ── ¿es un ejercicio de nivel teatro? ───────────────────────────────────────────────────
export const RE_FFTTTO = /FF\s*\.?\s*TT\s*\.?\s*T?\s*\.?\s*O\b|FFTTTO|FFTTO|FUERZAS?\s+TERRESTRES?\s+DEL\s+TEATRO/i
export const RE_TEATRO = /\bSUB\s*-?\s*TEATR|\bTEATRO\b|\bT\.\s?O\.(?=\s|$)/i
export const LIMITE_TACTICO_KM2 = 120000

export function unidadConsiderada(foto) {
  const f = foto || {}
  return String(f.ops?.unidadConsiderada?.nombre || f.unidadAnalisis?.nombre || f.ordenSup?.unidad || '').trim()
}
export function nivelDelEjercicio(foto) {
  const f = foto || {}
  const unidad = unidadConsiderada(f)
  const mag = String(f.ops?.unidadConsiderada?.escalon || f.unidadAnalisis?.magnitud || '')
  if (RE_FFTTTO.test(MAY(unidad))) return { teatro: true, motivo: `la unidad considerada es ${unidad}`, unidad }
  if (/ejercito/i.test(mag) && unidad) return { teatro: true, motivo: `la unidad considerada (${unidad}) es de magnitud Ejército`, unidad }
  const areas = areasDelEjercicio(f)
  const delTeatro = areas.filter((a) => a.tipo === 'teatro' || a.tipo === 'subteatro')
  if (delTeatro.length) return { teatro: true, motivo: `el ejercicio trae ${delTeatro.length === 1 ? 'el área' : 'las áreas'} ${delTeatro.map((a) => a.nombre).join(', ')}`, unidad }
  const total = areas.reduce((s, a) => s + a.km2, 0)
  if (total > LIMITE_TACTICO_KM2) return { teatro: true, motivo: `las áreas suman ${fmtKm2(total)} (más que un CE)`, unidad }
  return { teatro: false, motivo: '', unidad }
}

// ── las áreas del ejercicio ─────────────────────────────────────────────────────────────
function tipoArea(nombre) {
  const t = MAY(nombre)
  if (/SUB\s*-?\s*TEATR/.test(t)) return 'subteatro'
  if (/TEATRO|\bT\.\s?O\./.test(t)) return 'teatro'
  if (/(^|[^A-Z])A\.?\s?O\.?(?![A-Z])|AREA DE OPERACION|ZONA DE ACCION/.test(t)) return 'ao'
  if (/AREA DE INTERES/.test(t)) return 'interes'
  return 'otra'
}
const anilloDe = (a) => {
  const c = a?.coords || a?.coordinates || a?.puntos || a?.geometry?.coordinates?.[0] || a?.geojson?.coordinates?.[0] || null
  if (!Array.isArray(c) || c.length < 3) return null
  const r = c.map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [Number(p.lng), Number(p.lat)])).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
  return r.length >= 3 ? r : null
}
export function areasDelEjercicio(foto) {
  const ops = (foto && foto.ops) || {}
  const lista = [], vistos = new Set()
  for (const a of [ops.areaOps, ...(Array.isArray(ops.areasOps) ? ops.areasOps : [])]) {
    if (!a) continue
    const anillo = anilloDe(a)
    if (!anillo) continue
    const nombre = String(a.nombre || a.unidad || 'Área').trim()
    const clave = `${a.id || ''}|${nombre}|${anillo.length}`
    if (vistos.has(clave) || (a.id && vistos.has(a.id))) continue
    vistos.add(clave); if (a.id) vistos.add(a.id)
    lista.push({ id: a.id || clave, nombre, anillo, km2: areaKm2(anillo), tipo: tipoArea(nombre), unidad: a.unidad || '' })
  }
  return lista
}
export function resumenTeatro(areas) {
  const teatro = areas.filter((a) => a.tipo === 'teatro'), sub = areas.filter((a) => a.tipo === 'subteatro'), aos = areas.filter((a) => a.tipo === 'ao')
  const base = sub.length ? sub : teatro.length ? teatro : areas
  const km2 = (teatro.length ? teatro : sub).reduce((s, a) => s + a.km2, 0) || base.reduce((s, a) => s + a.km2, 0)
  const caja = base.length ? cajaDe(base.map((a) => a.anillo)) : null
  const ancho = caja ? distKm([caja[0], (caja[1] + caja[3]) / 2], [caja[2], (caja[1] + caja[3]) / 2]) : 0
  const alto = caja ? distKm([(caja[0] + caja[2]) / 2, caja[1]], [(caja[0] + caja[2]) / 2, caja[3]]) : 0
  return { teatro, subteatros: sub, aos, km2, caja, anchoKm: ancho, altoKm: alto, superaTactico: km2 > LIMITE_TACTICO_KM2 }
}

// ── las unidades (GG.UU.) ───────────────────────────────────────────────────────────────
export const PODER_ESCALON = { equipo: 0.5, escuadra: 1, seccion: 2, compania: 4, batallon: 12, regimiento: 20, brigada: 40, division: 80, cuerpo: 150, ejercito: 300 }
// Calidad del arma frente a una brigada motorizada (= 1). REFERENCIA a validar con las tablas de la Escuela.
export const FACTOR_ARMA = { blindada: 1.3, mecanizada: 1.2, cabmec: 1.15, motorizada: 1, caballeria: 1, infanteria: 0.9, andina: 0.9, aerotransportada: 0.8, aviacion: 0.6, artilleria: 0.7, ingenieria: 0.4, logistica: 0.15, comunicaciones: 0.15, sanidad: 0.05, antiaerea: 0.3 }
export const NOM_ESCALON = { brigada: 'Brigada (X)', division: 'División (XX)', cuerpo: 'Cuerpo de Ejército (XXX)', ejercito: 'FF.TT.T.O. / Ejército (XXXX)', regimiento: 'Regimiento (III)', batallon: 'Batallón (II)' }
const esEnemiga = (u) => /enemig|rojo/i.test(String(u?.bando || ''))
const esGU = (u) => ['brigada', 'division', 'cuerpo', 'ejercito', 'regimiento'].includes(u?.escalon) && u?.tipo !== 'instalacion'
export function poderDe(u) { return redondeo((PODER_ESCALON[u.escalon] || 12) * (FACTOR_ARMA[u.arma] ?? 1), 1) }
// «DEOP 2» sí; «DEOP 1–4» / «DEOP 1 a 4» (un rango) no; «(DEOP 1)» tampoco: nombra a una subordinada.
function deopDeTexto(t) {
  const s = MAY(t).replace(/\([^)]*\)/g, ' ')
  const m = s.match(/\bDEOP\.?\s*(\d)\b(?!\s*(?:[–—-]|A\b|Y\b|,)\s*\d)/)
  return m ? Number(m[1]) : null
}
// La DEOP de una ficha: la propia («… Chungará. DEOP 1. Paso de origen …») o la que enfrenta
// («DEOP que enfrenta: DEOP 1»). No cuenta «empleo en DEOP 1 a 4» ni las DEOP de sus subordinadas.
function deopDeFicha(t) {
  const s = MAY(t)
  const enfrenta = s.match(/DEOP QUE ENFRENTA\s*:\s*DEOP\.?\s*(\d)\b/)
  if (enfrenta) return Number(enfrenta[1])
  if (/DEOP QUE ENFRENTA\s*:/.test(s)) return null
  const propia = s.replace(/\([^)]*\)/g, ' ').match(/(?:^|[.;\n]\s*)DEOP\.?\s*(\d)\s*[.;\n]/)
  if (propia) return Number(propia[1])
  return /GRANDES UNIDADES SUBORDINADAS|EMPLEO EN DEOP/.test(s) ? null : deopDeTexto(s)
}
function rolDeTexto(t) {
  const s = MAY(t)
  if (/RESERVA/.test(s)) return 'reserva'
  if (/GRANDES UNIDADES SUBORDINADAS/.test(s)) return 'comando'
  if (/PRIMER ESCALON/.test(s)) return 'primer escalón'
  if (/\bAPOYO\b|AVIACION|BAVE/.test(s)) return 'apoyo'
  if (/SEGUNDO ESCALON/.test(s)) return 'segundo escalón'
  return ''
}
export function unidadesDelEjercicio(foto) {
  const enemigas = [], propias = []
  for (const u of (foto && foto.unidades) || []) {
    if (!u || !Number.isFinite(Number(u.lat)) || !Number.isFinite(Number(u.lng)) || !esGU(u)) continue
    const texto = `${u.descripcionKmz || ''} ${u.nombreKmz || ''} ${u.nota || ''}`
    const x = {
      id: u.id || null, designacion: String(u.designacion || u.nombreKmz || '?'), escalon: u.escalon, arma: u.arma || 'infanteria',
      lat: Number(u.lat), lng: Number(u.lng), deop: deopDeFicha(texto), rol: rolDeTexto(texto),
      enfrenta: (texto.match(/Enfrenta a(?:\s*\(SATURNO\))?\s*:\s*([^\n.]+(?:\.[^\n.]+)?)/i) || [])[1]?.trim().slice(0, 120) || '',
      lugar: (String(u.nombreKmz || '').split(/\s+[–—-]\s+/).slice(1).join(' – ') || '').trim(),
    }
    x.poder = poderDe(x)
    ;(esEnemiga(u) ? enemigas : propias).push(x)
  }
  return { enemigas, propias }
}

// ── el KMZ del teatro: DEOP, ejes de aproximación, orígenes ─────────────────────────────
// Recibe la lista de `placemarks(arbol, { conLineas: true })` de abrir-kmz.mjs (uno o varios KML).
export function teatroDeKml(lista) {
  const deop = new Map(), ejes = [], origenes = []
  const de = (n) => { if (!deop.has(n)) deop.set(n, { n, nombre: `DEOP ${n}`, corredor: null, linea: null, puntos: [], descripcion: '' }); return deop.get(n) }
  for (const pm of lista || []) {
    const ruta = MAY((pm.camino || []).join(' / ')), nom = MAY(pm.nombre)
    // De la carpeta más interna hacia afuera: el documento «DEOP 1–4» no manda sobre «DEOP. 2 — puntos».
    const n = deopDeTexto(nom) ?? (pm.camino || []).slice().reverse().map(deopDeTexto).find((x) => x != null) ?? null
    if (n != null) {
      const d = de(n)
      if (pm.tipo === 'poligono' && pm.coords?.length >= 3) d.corredor = pm.coords.map((p) => [p[0], p[1]])
      else if (pm.tipo === 'linea' && pm.lineaCoords?.length >= 2) {
        d.linea = pm.lineaCoords.map((p) => [p[0], p[1]])
        if (pm.desc) d.descripcion = pm.desc.slice(0, 400)
        const titulo = (pm.camino || []).find((c) => /DEOP/i.test(c) && /→|->/.test(c))
        if (titulo) d.nombre = titulo.replace(/^\s*DEOP\.?\s*\d\s*[·:.-]?\s*/i, `DEOP ${n} · `).trim()
      } else if (pm.tipo === 'punto' && pm.coords?.length) {
        const m = String(pm.nombre).match(/^\s*(\d+)\s*[.)-]\s*(.+)$/)
        const rol = /INICIO/i.test(pm.desc) ? 'inicio' : /DESTINO/i.test(pm.desc) ? 'destino' : 'intermedio'
        d.puntos.push({ n: m ? Number(m[1]) : d.puntos.length + 1, nombre: (m ? m[2] : pm.nombre).trim(), lng: pm.coords[0][0], lat: pm.coords[0][1], rol })
      }
      continue
    }
    if (pm.tipo === 'linea' && pm.lineaCoords?.length >= 2 && (/^\s*EJE\b/.test(nom) || /APROXIMACI/.test(ruta)))
      ejes.push({ nombre: pm.nombre.trim(), linea: pm.lineaCoords.map((p) => [p[0], p[1]]), de: String(pm.desc || '').split('.')[0].trim().slice(0, 120) })
    else if (pm.tipo === 'punto' && pm.coords?.length && /\(ORIGEN\)/.test(nom))
      origenes.push({ nombre: pm.nombre.replace(/\s*\(origen\)\s*/i, '').trim(), lng: pm.coords[0][0], lat: pm.coords[0][1] })
  }
  const lista2 = [...deop.values()].sort((a, b) => a.n - b.n)
  for (const d of lista2) {
    d.puntos.sort((a, b) => a.n - b.n)
    if (!d.puntos.length && d.linea) d.puntos = d.linea.map((p, i) => ({ n: i + 1, nombre: `Punto ${i + 1}`, lng: p[0], lat: p[1], rol: i === 0 ? 'inicio' : i === d.linea.length - 1 ? 'destino' : 'intermedio' }))
    if (!d.linea && d.puntos.length >= 2) d.linea = d.puntos.map((p) => [p.lng, p.lat])
    if (d.puntos.length) { d.puntos[0].rol = 'inicio'; d.puntos[d.puntos.length - 1].rol = 'destino' }
  }
  return { deop: lista2.filter((d) => d.linea && d.linea.length >= 2), ejes, origenes }
}
// Une lo leído de varios KMZ: el mismo DEOP n se completa, no se repite.
export function unirTeatro(a, b) {
  const deop = new Map((a?.deop || []).map((d) => [d.n, { ...d }]))
  for (const d of b?.deop || []) {
    const x = deop.get(d.n)
    if (!x) { deop.set(d.n, { ...d }); continue }
    deop.set(d.n, { ...x, corredor: d.corredor || x.corredor, linea: d.puntos?.length > (x.puntos?.length || 0) ? d.linea : x.linea || d.linea, puntos: d.puntos?.length > (x.puntos?.length || 0) ? d.puntos : x.puntos, nombre: /→/.test(d.nombre) ? d.nombre : x.nombre, descripcion: d.descripcion || x.descripcion })
  }
  const clave = (e) => `${e.nombre}|${e.linea?.[0]}|${e.lng},${e.lat}`
  const unico = (l) => { const v = new Set(); return l.filter((e) => { const k = clave(e); if (v.has(k)) return false; v.add(k); return true }) }
  return { deop: [...deop.values()].sort((x, y) => x.n - y.n), ejes: unico([...(a?.ejes || []), ...(b?.ejes || [])]), origenes: unico([...(a?.origenes || []), ...(b?.origenes || [])]) }
}

// ── Área de Interés del teatro ──────────────────────────────────────────────────────────
// TO + las bases y orígenes del enemigo (sus GG.UU., los orígenes de los ejes) + 40 km.
// Lo que queda lejísimos (Santiago, Rancagua: a 1.300 km) NO agranda el área: se lista aparte.
export function areaDeInteres({ areas = [], unidades = { enemigas: [], propias: [] }, teatro = {}, margenKm = 40, maxKm = 700 } = {}) {
  const base = areas.filter((a) => a.tipo === 'teatro' || a.tipo === 'subteatro')
  const zona = base.length ? base : areas
  const pts = zona.flatMap((a) => a.anillo)
  if (!pts.length) return { anillo: null, fuera: [] }
  const centro = [(Math.min(...pts.map((p) => p[0])) + Math.max(...pts.map((p) => p[0]))) / 2, (Math.min(...pts.map((p) => p[1])) + Math.max(...pts.map((p) => p[1]))) / 2]
  const fuera = [], mas = []
  const sumar = (p, nombre) => { if (distKm(p, centro) <= maxKm) mas.push(p); else fuera.push({ nombre, lng: p[0], lat: p[1], km: Math.round(distKm(p, centro)) }) }
  for (const u of [...unidades.enemigas, ...unidades.propias]) sumar([u.lng, u.lat], u.designacion)
  for (const o of teatro.origenes || []) sumar([o.lng, o.lat], o.nombre)
  for (const e of teatro.ejes || []) sumar(e.linea[0], e.nombre)
  for (const d of teatro.deop || []) for (const p of d.puntos) sumar([p.lng, p.lat], p.nombre)
  const anillo = cascoEnsanchado([...pts, ...mas], margenKm)
  anillo.push(anillo[0])
  return { anillo, km2: areaKm2(anillo), fuera }
}

// ── la base de datos del teatro (archivo fijo datos/teatro-base.json) ───────────────────
// Las coordenadas vienen en delta de 1e-4° ([x0, y0, dx1, dy1, …], ver scripts/generalizar.mjs).
export function decodificar(a) {
  const c = new Array(a.length / 2)
  let x = 0, y = 0
  for (let i = 0, k = 0; i < a.length; i += 2, k++) { x += a[i]; y += a[i + 1]; c[k] = [x / 1e4, y / 1e4] }
  return c
}
export function abrirBase(json) {
  if (!json || json.tipo !== 'sideceme-teatro-base') throw new Error('No es el archivo de datos del teatro.')
  if (json.cod !== 'delta-1e4') return json
  const pol = (p) => p.map(decodificar)
  return {
    ...json, cod: 'abierto',
    vias: json.vias.map((v) => [v[0], v[1], v[2], decodificar(v[3])]),
    ffcc: json.ffcc.map((f) => [f[0], f[1], decodificar(f[2])]),
    rios: json.rios.map((r) => [r[0], decodificar(r[1])]),
    fronteras: json.fronteras.map(decodificar),
    paises: json.paises.map((p) => [p[0], p[1], p[2].map(pol)]),
    salares: json.salares.map((s) => [s[0], s[1].map(pol)]),
    lagos: json.lagos.map((s) => [s[0], s[1].map(pol)]),
    relieve: json.relieve.map(([c, polis]) => [c, polis.map(pol)]),
  }
}

// ── capas recortadas al Área de Interés ─────────────────────────────────────────────────
export const CLASE_VIA ={ 1: 'Troncal (Vía 1)', 2: 'Primaria', 3: 'Secundaria', 4: 'Terciaria' }
export const RANGO_POBLACION = { 1: 'Capital', 2: 'Ciudad', 3: 'Pueblo', 4: 'Localidad' }
export function recortarBase(base, anillo) {
  if (!base) return null
  if (!anillo) return base
  const caja = cajaDe(anillo)
  const toca = (coords) => cajasSeTocan(cajaDe(coords), caja)
  const adentro = (lng, lat) => lng >= caja[0] && lng <= caja[2] && lat >= caja[1] && lat <= caja[3] && enPoligono([lng, lat], anillo)
  return {
    ...base,
    vias: (base.vias || []).filter((v) => toca(v[3])),
    ffcc: (base.ffcc || []).filter((v) => toca(v[2])),
    rios: (base.rios || []).filter((v) => toca(v[1])),
    fronteras: (base.fronteras || []).filter((c) => toca(c)),
    salares: (base.salares || []).map((s) => [s[0], s[1].filter((p) => toca(p[0]))]).filter((s) => s[1].length),
    lagos: (base.lagos || []).map((s) => [s[0], s[1].filter((p) => toca(p[0]))]).filter((s) => s[1].length),
    relieve: (base.relieve || []).map(([c, polis]) => [c, polis.filter((p) => toca(p[0]))]),
    paises: (base.paises || []).map((p) => [p[0], p[1], p[2].filter((q) => toca(q[0]))]).filter((p) => p[2].length),
    regiones: (base.regiones || []).filter((r) => adentro(r[1], r[2])),
    poblaciones: (base.poblaciones || []).filter((p) => adentro(p[2], p[3])),
    aerodromos: (base.aerodromos || []).filter((p) => adentro(p[3], p[4])),
    pasos: (base.pasos || []).filter((p) => adentro(p[2], p[3])),
    volcanes: (base.volcanes || []).filter((p) => adentro(p[2], p[3])),
  }
}
export function poblacionMasCercana(base, p, maxKm = 12, rangoMax = 4) {
  let mejor = null
  for (const q of base?.poblaciones || []) {
    if (q[1] > rangoMax) continue
    const d = distKm(p, [q[2], q[3]])
    if (d <= maxKm && (!mejor || d < mejor.d)) mejor = { nombre: q[0], rango: q[1], d, lng: q[2], lat: q[3] }
  }
  return mejor
}
