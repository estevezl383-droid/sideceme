// 📝 El texto de la F3·P6 sale de lo que quedó EN LA CARTA: las fases 🔵 de cada CAP (dónde está cada unidad, qué
// tareas tácticas, qué obstáculos y qué fuegos hay en cada fase) escritas como un bloque «Según la carta» en las
// casillas que corresponden. Sin dependencias del compilado: lo usan el panel, proponer.mjs (la acción «texto») y las
// pruebas.
//
// Sergio, 24-10-2026: «puedo yo aquí mover fichas, tareas, fuegos, barreras… y concreto los dos cursos de acción en
// la mesa, y el texto sale de eso». Lo que escribió el oficial (o la IA) no se toca: el bloque va al final de la
// casilla y, si ya estaba, se reemplaza (como «Según el calco» de la F3·P4).
import { piezas } from './carta-ia.mjs'

const valido = (c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(+c[0]) && Number.isFinite(+c[1])
const esEnemiga = (u) => /^enemig/i.test(String(u?.bando || ''))
const esUnidad = (u) => (u?.tipo || 'unidad') === 'unidad'
const RAD = Math.PI / 180
const kmLng = (lat) => 111.32 * Math.cos(lat * RAD) || 1e-9
const km = (a, b) => Math.hypot((a[0] - b[0]) * kmLng((a[1] + b[1]) / 2), (a[1] - b[1]) * 110.574)
const rumbo = (a, b) => ((Math.atan2((b[0] - a[0]) * kmLng((a[1] + b[1]) / 2), (b[1] - a[1]) * 110.574) / RAD) % 360 + 360) % 360
const PUNTOS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
const punto = (az) => PUNTOS[Math.round(az / 45) % 8]
const TAG = /\s*\[(IA|Mesa)\s*[—–-]\s*verificar\]\s*/gi
const limpio = (s) => String(s ?? '').replace(TAG, ' ').replace(/\s+/g, ' ').trim()
const lista = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

export const MARCA_CARTA = '— Según la carta (fases 🔵):'

// «en Guata», «a 6 km al NE de Macaya» o las coordenadas: el lugar más cercano del nomenclátor de la carta.
export function nombrador(nomenclator = []) {
  return (p) => {
    if (!valido(p)) return 'sin posición'
    const c = nomenclator.map((l) => ({ l, d: km(p, l.p) })).sort((a, b) => a.d - b.d)[0]
    if (c && c.d <= 2.5) return `en ${c.l.nom}`
    if (c && c.d <= 25) return `a ${Math.round(c.d)} km al ${punto(rumbo(c.l.p, p))} de ${c.l.nom}`
    return `en ${(+p[1]).toFixed(4)}, ${(+p[0]).toFixed(4)}`
  }
}
const pos = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
const centroDe = (o) => (valido(o?.centro) ? o.centro : Array.isArray(o?.coords) && o.coords.length ? [o.coords.reduce((s, p) => s + +p[0], 0) / o.coords.length, o.coords.reduce((s, p) => s + +p[1], 0) / o.coords.length] : null)
const claveObs = (o) => `${o?.tipo}|${(centroDe(o) || []).map((x) => (+x).toFixed(4)).join(',')}`
const cuandoDe = (f) => {
  const m = String(f?.origen || '').match(/·\s*CAP\s*\d\s*·\s*(.+)$/)
  return m ? m[1].trim() : ''
}

// Las fases de un CAP en palabras. catalogos: { tareas: [{id, nombre}], obstaculos: {id: {nom}}, tiposFuego: [{id, nom}] }.
// base: las unidades antes de la fase 1 (para decir «de dónde a dónde»).
export function describirFases(fases = [], { nomenclator = [], catalogos = {}, base = [] } = {}) {
  const lugar = nombrador(nomenclator)
  const nomTarea = (id) => (catalogos.tareas || []).find((t) => t.id === id)?.nombre || String(id || '').replace(/_/g, ' ')
  const nomObs = (id) => catalogos.obstaculos?.[id]?.nom || String(id || '').replace(/_/g, ' ')
  const nomFuego = (id) => (catalogos.tiposFuego || []).find((t) => t.id === id)?.nom || String(id || '')
  const propias = (us) => (us || []).filter((u) => u && esUnidad(u) && !esEnemiga(u) && u.deFaseEnemiga == null && String(u.designacion || '').trim())
  // «de Turco a Guata»; si no hay un lugar cerca, «de un punto a 17 km al NO de Bella Vista a …».
  const corto = (l) => (l.startsWith('en ') ? l.slice(3) : `un punto ${l}`)
  let antes = new Map(propias(base).map((u) => [u.id, u]))
  let obsAntes = new Set()
  let fuegosAntes = new Set()
  return fases.map((f, i) => {
    const us = propias(f?.unidades)
    const mov = []
    const actores = []
    for (const u of us) {
      const p = pos(u)
      const a = antes.get(u.id)
      const pa = pos(a)
      const movio = p && pa && km(p, pa) > 1
      const tarea = limpio(u.tarea)
      const tareaNueva = tarea && tarea !== limpio(a?.tarea)
      if (!movio && !tareaNueva && i > 0) continue
      if (!movio && !tareaNueva && !tarea) continue
      actores.push(u.designacion)
      mov.push(`${u.designacion}${tarea ? ` (${tarea})` : ''} ${movio ? `de ${corto(lugar(pa))} a ${corto(lugar(p))}` : lugar(p)}`)
    }
    antes = new Map(us.map((u) => [u.id, u]))
    const tareas = (f?.ops?.tareas || []).filter((t) => valido(t?.centro)).map((t) => `${nomTarea(t.tarea)}${t.capIA?.unidad ? ` (${t.capIA.unidad})` : ''} ${lugar(t.centro)}${Number.isFinite(+t.rot) ? `, hacia el ${punto(+t.rot)}` : ''}`)
    const obs = (f?.ops?.obstaculos || []).filter((o) => centroDe(o))
    const nuevos = obs.filter((o) => !obsAntes.has(claveObs(o))).map((o) => `${nomObs(o.tipo)} ${lugar(centroDe(o))}`)
    obsAntes = new Set(obs.map(claveObs))
    // Los fuegos que aparecen en esta fase (los que siguen de la anterior no se repiten).
    const bl = (f?.plan?.blancos || []).filter((b) => Number.isFinite(+b?.lng))
    const claveB = (b) => b.id || `${b.num}|${b.lng}|${b.lat}`
    const nuevosB = bl.filter((b) => !fuegosAntes.has(claveB(b)))
    fuegosAntes = new Set(bl.map(claveB))
    const fuegos = nuevosB.map((b) => `${b.num || 'AB'} ${nomFuego(b.tipo).toLowerCase()} ${lugar([+b.lng, +b.lat])}${limpio(b.descripcion) ? ` — ${limpio(b.descripcion)}` : ''}`)
    return { n: i + 1, nombre: limpio(f?.nombre) || `Fase ${i + 1}`, cuando: cuandoDe(f), tarea: limpio(f?.tarea), actores, movimientos: mov, tareas, obstaculos: nuevos, fuegos, final: us.map((u) => ({ nom: u.designacion, donde: lugar(pos(u)) })) }
  })
}

// Los bloques de cada casilla de la F3·P6.
export function textoDeLaCarta(fases = [], opciones = {}) {
  const D = describirFases(fases, opciones)
  if (!D.length) return { campos: {}, fases: D }
  const linea = (d) =>
    [
      `FASE ${d.n} — ${d.nombre}${d.cuando ? ` (${d.cuando})` : ''}${d.tarea ? `: ${d.tarea}` : ''}.`,
      d.movimientos.length ? ` Unidades: ${d.movimientos.join('; ')}.` : '',
      d.tareas.length ? ` Tareas tácticas: ${d.tareas.join('; ')}.` : '',
      d.obstaculos.length ? ` Obstáculos: ${d.obstaculos.join('; ')}.` : '',
      d.fuegos.length ? ` Fuegos: ${d.fuegos.join('; ')}.` : '',
    ].join('')
  const conTarea = [...new Set(D.flatMap((d) => d.actores))]
  const decisiva = D[Math.min(3, D.length - 1)]
  const bloque = (t) => (t ? `${MARCA_CARTA}\n${t}` : '')
  return {
    fases: D,
    campos: {
      QUIÉN: bloque(conTarea.length ? `${lista(conTarea)}.` : ''),
      CUÁNDO: bloque(D.filter((d) => d.cuando).map((d) => `Fase ${d.n} (${d.nombre}): ${d.cuando}.`).join('\n')),
      DÓNDE: bloque(decisiva.final.length ? `En la fase ${decisiva.n} (${decisiva.nombre}): ${decisiva.final.map((x) => `${x.nom} ${x.donde}`).join('; ')}.` : ''),
      'CÓMO (forma de maniobra)': bloque(D.map((d) => `Fase ${d.n} — ${d.nombre}: ${[...d.movimientos, ...d.tareas].join('; ') || 'sin cambios en la carta'}.`).join('\n')),
      'Bosquejo: qué muestra el calco': bloque(D.map(linea).join('\n')),
    },
  }
}

// Pone (o reemplaza) el bloque «Según la carta» al final de una casilla, sin tocar lo demás.
export function conBloqueCarta(actual, bloque) {
  const a = String(actual ?? '')
  const i = a.indexOf(MARCA_CARTA)
  const base = (i >= 0 ? a.slice(0, i) : a).replace(/\s+$/, '')
  return bloque ? `${base}${base ? '\n\n' : ''}${bloque}` : base
}
export function hojaConCarta(valor = {}, campos = {}) {
  const v = { ...(valor || {}) }
  let n = 0
  for (const [k, b] of Object.entries(campos || {})) {
    if (!b) continue
    v[k] = conBloqueCarta(v[k], b)
    n++
  }
  return { valor: v, n }
}

// Para el pedido de la IA de la F3·P4 y la F3·P6: lo que hay en la carta del CAP activo.
export function bloqueCartaIA(fases = [], opciones = {}, activo = 1) {
  const D = describirFases(fases, opciones)
  if (!D.length) return ''
  return `# LO QUE YA ESTÁ EN LA CARTA — CAP ${activo}, fase por fase

El oficial ya armó (o corrigió) el CAP ${activo} en la carta. El texto de esta hoja tiene que describir ESTO, no otra maniobra: si algo de la propuesta de la Mesa no coincide con la carta, manda la carta.

${D.map((d) => `- FASE ${d.n} — ${d.nombre}${d.cuando ? ` (${d.cuando})` : ''}: ${[...d.movimientos, ...d.tareas.map((t) => `tarea táctica ${t}`), ...d.obstaculos.map((o) => `obstáculo ${o}`), ...d.fuegos.map((x) => `fuego ${x}`)].join('; ') || 'sin cambios'}.`).join('\n')}`
}

// El nomenclátor para nombrar los lugares (el mismo que se le da a la IA).
export const nomenclatorDe = (ctx = {}) => piezas(ctx).nomenclator
