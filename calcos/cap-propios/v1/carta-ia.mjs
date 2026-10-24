// 🤖 La IA desarrolla los dos CAP propios y la Mesa los COLOCA EN LA CARTA, fase por fase. Sin dependencias del
// compilado: lo usan el panel (panel.js) y las pruebas (en Node).
//
// Sergio, 24-10-2026: «tú me los propones los dos con sus fases (con ayuda de la IA: la aplicación me genera el
// prompt con toda la situación y la IA me lo genera, yo lo pego y se coloca en la mesa); puedo yo aquí mover fichas,
// tareas, fuegos, barreras… y concreto los dos cursos de acción en la mesa, y el texto sale de eso».
//   · `pedidoCarta`: el pedido con el expediente, la propuesta de la Mesa y LAS PIEZAS DE LA CARTA (las unidades con
//     su designación exacta y dónde están, los lugares de la carta con sus coordenadas, las A.I.N., el catálogo de
//     tareas tácticas y de obstáculos). La IA contesta un JSON: para cada CAP, sus fases; en cada fase, a qué LUGAR va
//     cada unidad, qué tarea táctica se pone y dónde, y qué obstáculos.
//   · `leerRespuesta`: ese JSON → las fases 🔵 de cada CAP (con el dispositivo de cada fase: cada unidad donde dijo la
//     IA, o donde estaba si el lugar no se encuentra en la carta; las tareas tácticas y los obstáculos en su ops), su
//     F3·P6 y el juicio. Lo que no pudo ubicar lo dice: la Mesa no inventa lugares.
import { ubicador } from '../../concepto-operacion/v1/modelo.mjs'
import { agruparLugares } from '../../ains-acostar/v1/ains.mjs'
import { analizar, bloqueIA } from './proponer.mjs?v=todas20261024'
import { leerJSON } from './json-tolerante.mjs'

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toUpperCase().replace(/[^A-Z0-9ª]+/g, ' ').trim()
const valido = (c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(+c[0]) && Number.isFinite(+c[1])
const esEnemiga = (u) => /^enemig/i.test(String(u?.bando || ''))
const esUnidad = (u) => (u?.tipo || 'unidad') === 'unidad'
const RAD = Math.PI / 180
const kmLng = (lat) => 111.32 * Math.cos(lat * RAD) || 1e-9
const km = (a, b) => Math.hypot((a[0] - b[0]) * kmLng((a[1] + b[1]) / 2), (a[1] - b[1]) * 110.574)
const rumbo = (a, b) => ((Math.atan2((b[0] - a[0]) * kmLng((a[1] + b[1]) / 2), (b[1] - a[1]) * 110.574) / RAD) % 360 + 360) % 360
const desplazar = (p, dKm, az) => [p[0] + (Math.sin(az * RAD) * dKm) / kmLng(p[1]), p[1] + (Math.cos(az * RAD) * dKm) / 110.574]
const r5 = (p) => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5]
const f4 = (x) => (Math.round(x * 1e4) / 1e4).toFixed(4)
const TAG = /\s*\[IA\s*[—–-]\s*verificar\]\s*/gi
const limpio = (s) => String(s ?? '').replace(TAG, ' ').replace(/\s+/g, ' ').trim()
const IA = '[IA — verificar]'

// ─── El marco del A.O. y el ubicador de lugares (el mismo de la F3·P4) ─────────────────────────────────────
function marcoSimple(areaOps) {
  let c = areaOps?.coords
  if (Array.isArray(c?.[0]?.[0])) c = c[0]
  const pts = (c || []).filter(valido).map((p) => [+p[0], +p[1]])
  if (pts.length < 3) return null
  const lngs = pts.map((p) => p[0])
  const lats = pts.map((p) => p[1])
  const centro = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]
  return { centro, ancho: km([Math.min(...lngs), centro[1]], [Math.max(...lngs), centro[1]]), fondo: km([centro[0], Math.min(...lats)], [centro[0], Math.max(...lats)]), lngs, lats }
}
export function piezas({ unidades = [], ops = {}, cmoc = {}, lugares = [] } = {}) {
  const M = marcoSimple(ops?.areaOps)
  const ubicar = ubicador({ lugares, cmoc, ains: ops?.ains || [], M })
  // El nomenclátor que se le da a la IA: los lugares dentro del A.O. (con 30 km de margen), un punto por nombre.
  const grupos = agruparLugares(lugares, (cmoc?.clave || []).filter((k) => valido(k?.centro)))
  const margen = 30
  const adentro = (p) => !M || (p[0] >= Math.min(...M.lngs) - margen / kmLng(p[1]) && p[0] <= Math.max(...M.lngs) + margen / kmLng(p[1]) && p[1] >= Math.min(...M.lats) - margen / 110.574 && p[1] <= Math.max(...M.lats) + margen / 110.574)
  const PESO = { ciudad: 0, city: 0, pueblo: 1, town: 1, 'terreno clave': 2, aldea: 3, village: 3 }
  const nomenclator = grupos
    .map((g) => {
      const p = (g.puntos || []).find(adentro)
      return p ? { nom: g.nom, clase: g.clase, p } : null
    })
    .filter(Boolean)
    .sort((a, b) => (PESO[a.clase] ?? 4) - (PESO[b.clase] ?? 4) || a.nom.localeCompare(b.nom))
    .slice(0, 160)
  const us = (unidades || []).filter((u) => u && esUnidad(u) && u.deFaseEnemiga == null)
  return { M, ubicar, nomenclator, propias: us.filter((u) => !esEnemiga(u)), rojas: us.filter(esEnemiga) }
}

// ─── El pedido ─────────────────────────────────────────────────────────────────────────────────────────────
const EJEMPLO = {
  juicio: { 'CAP 1': 'SIRVE — adecuado: … factible: … aceptable: … distinguible: … completo: …', 'CAP 2': 'SIRVE / NO SIRVE — …' },
  caps: [
    {
      cap: 1,
      forma: 'area',
      nombre: 'CAP 1 — …',
      f3p6: { 'Denominación del CAP': '…', QUIÉN: '…', QUÉ: '…', CUÁNDO: '…', DÓNDE: '…', 'POR QUÉ (propósito)': '…', 'CÓMO (forma de maniobra)': '…', 'Enunciado completo del curso de acción': '…', 'Razón fundamental (por qué este CAP)': '…' },
      fases: [
        {
          fase: 1,
          nombre: 'Concentración',
          cuando: 'D-10 a D-8',
          tarea: '…',
          proposito: '…',
          unidades: [{ unidad: 'DESIGNACIÓN EXACTA de la ficha', lugar: 'NOMBRE EXACTO de la lista de lugares (o «lat, lng»)', tarea: '…', proposito: '…' }],
          tareas: [{ tarea: 'id del catálogo (bloquear, fijar…)', unidad: 'DESIGNACIÓN EXACTA', lugar: 'NOMBRE EXACTO', hacia: 'NOMBRE EXACTO (hacia dónde apunta)' }],
          obstaculos: [{ tipo: 'id del catálogo (minado_ac…)', lugar: 'NOMBRE EXACTO', hasta: 'NOMBRE EXACTO (sólo si es una línea)' }],
          fuegos: [{ tipo: 'id de «Tipos de fuego»', efecto: 'id de «Efectos»', lugar: 'NOMBRE EXACTO', unidad: 'DESIGNACIÓN EXACTA del medio que lo bate', proposito: '…' }],
        },
      ],
    },
  ],
}

export function pedidoCarta({ ctx = {}, P = null, activo = 1, expediente = '', lugares = [], tareas = [], obstaculos = {}, tiposFuego = [], efectos = [] } = {}) {
  const pz = piezas({ ...ctx, lugares })
  const A = P?.A || analizar(ctx)
  const dondeEsta = (u) => {
    const p = [+u.lng, +u.lat]
    if (!valido(p)) return 'sin posición'
    const cerca = pz.nomenclator.map((l) => ({ l, d: km(p, l.p) })).sort((a, b) => a.d - b.d)[0]
    return `${f4(p[1])}, ${f4(p[0])}${cerca ? ` (a ${Math.round(cerca.d)} km de ${cerca.l.nom})` : ''}`
  }
  const filasU = (xs) => xs.map((u) => `- ${u.designacion || '(sin designación)'} — ${u.escalon || ''} ${u.arma || ''} — hoy en ${dondeEsta(u)}`).join('\n') || '- (ninguna)'
  const tCat = (tareas || []).map((t) => `${t.id} (${t.nombre})`).join(' · ')
  const oCat = Object.entries(obstaculos || {}).map(([id, o]) => `${id} (${o?.nom || id}${o?.forma === 'linea' ? ', línea' : o?.forma === 'area' ? ', área' : ''})`).join(' · ')
  const fCat = (tiposFuego || []).map((t) => `${t.id} (${t.nom})`).join(' · ')
  const eCat = (efectos || []).map((t) => `${t.id} (${t.nom})`).join(' · ')
  const ains = (ctx.ops?.ains || []).filter((a) => valido(a?.centro)).map((a) => `- ${a.nom || `AIN-${a.n}`}: ${f4(a.centro[1])}, ${f4(a.centro[0])}`).join('\n')
  return {
    ok: true,
    prompt: `Sos el Oficial de Operaciones (G-3) de un Estado Mayor en un ejercicio académico de planeamiento (PMTD). Trabajás en la sección EM. Sec. G-3 (Operaciones).

# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO

${expediente || '(el expediente no estaba disponible: trabajá con lo que dice este pedido)'}

---

# LA HOJA

F3·P6 — Los dos cursos de acción propios EN LA CARTA (fase por fase)

---

# TAREA — DESARROLLAR LOS DOS CURSOS DE ACCIÓN PROPIOS Y COLOCARLOS EN LA CARTA, FASE POR FASE.

La Mesa va a poner en la carta lo que contestes: para cada CAP crea sus fases 🔵 y, en cada fase, mueve cada unidad al LUGAR que digas, pone las tareas tácticas y los obstáculos. Después el oficial los corrige a mano. Por eso:
- Cada unidad se nombra con su DESIGNACIÓN EXACTA (la de la lista «Unidades propias»). No inventes unidades.
- Cada lugar se nombra con su NOMBRE EXACTO de la lista «Lugares de la carta», o con una A.I.N. («AIN-3»), o con coordenadas «lat, lng» (con 4 decimales). Un lugar que no está en la lista NO se puede colocar.
- Las tareas tácticas, los obstáculos y los fuegos, con el id EXACTO de su catálogo. Los FUEGOS son de cada fase (las concentraciones que se tiran en esa fase); cada uno con el medio que lo bate (una unidad de artillería, morteros o lanzacohetes de las fichas).
- Los dos CAP tienen que DISTINGUIRSE EN LA CARTA (otra forma de maniobra, otro esfuerzo principal, otra ubicación de la reserva), no sólo en el nombre.
- Cinco fases por CAP, en orden: concentración, desplazamiento, ocupación y organización (con el plan de barreras), conducción, y contraataque / consolidación (adaptalas a la forma de maniobra). En cada fase poné SÓLO las unidades que se mueven o cambian de tarea; las otras quedan donde estaban en la fase anterior.
- «f3p6» es el enunciado de la hoja F3·P6 de ese CAP. Tu juicio de los dos CAP (SIRVE / NO SIRVE con las cinco pruebas) va en «juicio».

---

${bloqueIA(P, { activo, hoja: 'carta' }) || ''}

---

# LAS PIEZAS DE LA CARTA — lo único que podés usar

## Unidades propias (designación EXACTA)
${filasU(pz.propias)}

## Unidades enemigas (fichas rojas: no las muevas)
${filasU(pz.rojas)}

## Lugares de la carta (NOMBRE EXACTO → lat, lng)
${pz.nomenclator.map((l) => `- ${l.nom} → ${f4(l.p[1])}, ${f4(l.p[0])}${l.clase && l.clase !== 'lugar' ? ` (${l.clase})` : ''}`).join('\n') || '- (la carta no tiene lugares cargados: usá coordenadas «lat, lng» o A.I.N.)'}
${ains ? `\n## A.I.N. de la carta\n${ains}\n` : ''}
## Avenidas de aproximación
${A.avenidas.map((a) => `- ${a.nombre}${a.escalon ? ` (${a.escalon})` : ''}: de ${f4(a.coords[0][1])}, ${f4(a.coords[0][0])} a ${f4(a.coords[a.coords.length - 1][1])}, ${f4(a.coords[a.coords.length - 1][0])}`).join('\n') || '- (ninguna)'}

## Tareas tácticas (id)
${tCat || '(ninguna)'}

## Obstáculos (id)
${oCat || '(ninguno)'}

## Tipos de fuego (id)
${fCat || '(ninguno)'}

## Efectos del fuego (id)
${eCat || '(ninguno)'}

---

# CÓMO CONTESTAR

Respondé ÚNICAMENTE con este JSON (los dos CAP, cinco fases cada uno) y nada más:

\`\`\`json
${JSON.stringify(EJEMPLO, null, 1)}
\`\`\`

Tiene que poder leerse con JSON.parse: sin comentarios y sin texto alrededor. «forma» es uno de: area, movil, area_alterna, ruptura, envolvimiento, desbordamiento, retardatriz, repliegue.`,
  }
}

// ─── Leer la respuesta ─────────────────────────────────────────────────────────────────────────────────────
// La lista de los CAP, venga como venga: { caps: [...] }, una lista, { "CAP 1": {...}, "CAP 2": {...} }, { cap1, cap2 },
// o los dos CAP en dos bloques ```json separados (cada uno con sus «fases»).
const tieneFases = (x) => x && typeof x === 'object' && Array.isArray(x.fases)
function capsDe(v, todos = []) {
  if (Array.isArray(v?.caps)) return v.caps
  if (Array.isArray(v) && v.some(tieneFases)) return v
  if (v && typeof v === 'object') {
    const ks = Object.keys(v).filter((k) => /^cap[\s_-]*\d$/i.test(k.trim()) && tieneFases(v[k]))
    if (ks.length) return ks.sort().map((k) => ({ cap: Number(k.match(/\d/)[0]), ...v[k] }))
    if (tieneFases(v)) {
      const otros = todos.map((r) => r.valor).filter(tieneFases)
      return otros.length ? otros : [v]
    }
  }
  return null
}
const conCaps = (v) => !!capsDe(v)

// La ficha que nombra la IA: igual, sin puntos ni guiones, o contenida («DIV MEC-2» ↔ «DIV.MEC.-2 (FICT.)»).
function fichaDe(nombre, propias) {
  const n = norm(nombre).replace(/ /g, '')
  if (!n) return null
  const conN = propias.map((u) => ({ u, k: norm(u.designacion).replace(/ /g, '') })).filter((x) => x.k)
  return (conN.find((x) => x.k === n) || conN.find((x) => x.k.startsWith(n) || n.startsWith(x.k)) || conN.find((x) => x.k.includes(n) || n.includes(x.k)))?.u || null
}
const ESC_TAREA = { cuerpo: 'division', ejercito: 'division' }

// Un obstáculo en la carta: punto, línea (de «lugar» a «hasta», o 2 km cruzando el rumbo del enemigo) o área.
function obstaculoEn(tipo, p, q, cat, azEnemigo) {
  const forma = cat?.[tipo]?.forma || 'punto'
  if (forma === 'linea') {
    if (q && km(p, q) > 0.2) return { coords: [r5(p), r5(q)], tipo, estado: 'proyectado' }
    const az = (azEnemigo ?? 0) + 90
    return { coords: [r5(desplazar(p, 1, az + 180)), r5(desplazar(p, 1, az))], tipo, estado: 'proyectado' }
  }
  if (forma === 'area') {
    const c = [45, 135, 225, 315].map((a) => r5(desplazar(p, 0.9, a)))
    return { coords: [...c, c[0]], tipo, estado: 'proyectado' }
  }
  return { centro: r5(p), tipo, estado: 'proyectado' }
}

// texto: la respuesta de la IA. ctx: { unidades, ops, cmoc, lugares, tareas (catálogo), obstaculos (catálogo) }.
// Devuelve { ok, caps: { 1: { forma, nombre, fases, f3p6 }, 2: … }, juicio, faltan: [...], resumen } o { ok:false, error }.
export function leerRespuesta(texto, ctx = {}) {
  const L = leerJSON(texto, conCaps)
  if (!L.ok) return { ok: false, error: `No se pudo leer la respuesta de la IA. ${L.error} Pegá la respuesta COMPLETA (desde «\`\`\`json» hasta el final) o pedile a la IA que reenvíe SÓLO el bloque JSON.` }
  const g = L.valor
  const lista = capsDe(g, L.todos)
  if (!lista || !lista.length) return { ok: false, error: 'La respuesta no trae «caps» (la lista de los dos cursos de acción con sus fases). Pedile a la IA que conteste con el JSON de «CÓMO CONTESTAR».' }
  const pz = piezas(ctx)
  const tareasOk = new Map((ctx.tareas || []).flatMap((t) => [[norm(t.id), t.id], [norm(t.nombre), t.id]]))
  const obsCat = ctx.obstaculos || {}
  const obsOk = new Map(Object.entries(obsCat).flatMap(([id, o]) => [[norm(id), id], [norm(o?.nom), id]]))
  const pRojo = (() => {
    const ps = pz.rojas.map((u) => [+u.lng, +u.lat]).filter(valido)
    return ps.length ? [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length] : null
  })()
  const faltan = []
  const base = (ctx.unidades || []).filter((u) => u && u.deFaseEnemiga == null)
  // El plan de fuegos de cada fase: el de la Mesa (sin lo que puso antes la IA) más las concentraciones de esa fase.
  const planBase = { version: 1, medios: {}, verEnCarta: true, ...(ctx.plan || {}) }
  const blancosBase = (planBase.blancos || []).filter((b) => !b?.capIA)
  const maxAB = Math.max(9, ...blancosBase.map((b) => Number(/AB\s*-?\s*(\d+)/i.exec(String(b?.num || ''))?.[1]) || 0))
  const tiposOk = new Map((ctx.tiposFuego || []).flatMap((t) => [[norm(t.id), t.id], [norm(t.nom), t.id]]))
  const efectosOk = new Map((ctx.efectos || []).flatMap((t) => [[norm(t.id), t.id], [norm(t.nom), t.id]]))
  const opsBase = { ...(ctx.ops || {}) }
  delete opsBase.ains
  const sinIA = (xs) => (xs || []).filter((x) => !x?.capIA)
  const caps = {}
  lista.forEach((c, k) => {
    const n = Number(String(c?.cap ?? c?.n ?? k + 1).match(/\d/)?.[0] || k + 1)
    if ((n !== 1 && n !== 2) || caps[n]) return
    let unidades = base.map((u) => ({ ...u }))
    let obsAcum = []
    let nAB = maxAB
    // Dónde pone la Mesa cada unidad en cada fase (posiciones.mjs), para cuando el lugar de la IA no está en la carta.
    let mesa = null
    try {
      mesa = typeof ctx.mesaPos?.[n] === 'function' ? ctx.mesaPos[n](String(c?.forma || '')) : ctx.mesaPos?.[n] || null
    } catch {
      mesa = null
    }
    const ubicar = (lugar, cercaDe) => {
      const s = String(lugar ?? '').trim()
      if (!s) return null
      const r = pz.ubicar(s, cercaDe)
      return r ? r.p : null
    }
    // El puesto de cada ficha (posiciones.mjs) queda guardado en ella, como cuando se arman las fases en la Mesa.
    if (mesa?.puestos) unidades = unidades.map((v) => (mesa.puestos[v.id] ? { ...v, puesto: mesa.puestos[v.id] } : v))
    // Las fichas que la IA todavía no nombró van, en cada fase, donde las pone la Mesa (en la FASE I, juntas con el CE;
    // en la II, a sus trabajos de barreras; en la III, en su puesto…). Las que nombró quedan donde las puso la IA.
    const nombradas = new Set()
    const fases = (Array.isArray(c?.fases) ? c.fases : []).map((f, i) => {
      const etiqueta = `CAP ${n} · fase ${i + 1}`
      if (mesa?.[i]) unidades = unidades.map((v) => (!nombradas.has(v.id) && mesa[i][v.id] ? { ...v, lng: mesa[i][v.id][0], lat: mesa[i][v.id][1] } : v))
      // Las unidades que se mueven o cambian de tarea.
      for (const x of Array.isArray(f?.unidades) ? f.unidades : []) {
        const u = fichaDe(x?.unidad, pz.propias)
        if (!u) {
          if (x?.unidad) faltan.push(`${etiqueta}: la unidad «${limpio(x.unidad)}» no está en las fichas`)
          continue
        }
        let p = ubicar(x?.lugar, [+u.lng, +u.lat])
        // (sólo la que la IA puso en un lugar de la carta deja de seguir a la Mesa)
        if (p) nombradas.add(u.id)
        if (x?.lugar && !p) {
          const m = mesa?.[i]?.[u.id]
          if (m) p = m
          faltan.push(`${etiqueta}: «${limpio(x.lugar)}» (${u.designacion}) no está en la carta; ${m ? 'quedó donde la pone la Mesa en esa fase' : 'quedó donde estaba'}`)
        }
        unidades = unidades.map((v) => (v.id !== u.id ? v : { ...v, ...(p ? { lng: p[0], lat: p[1] } : {}), tarea: limpio(x?.tarea) || v.tarea || '', proposito: limpio(x?.proposito) || v.proposito || '' }))
      }
      // Las tareas tácticas de la fase (sólo de esa fase) y los obstáculos (se acumulan: lo construido queda).
      const tts = []
      for (const t of Array.isArray(f?.tareas) ? f.tareas : []) {
        const id = tareasOk.get(norm(t?.tarea))
        const p = ubicar(t?.lugar, pRojo)
        if (!id) { if (t?.tarea) faltan.push(`${etiqueta}: la tarea táctica «${limpio(t.tarea)}» no está en el catálogo`); continue }
        if (!p) { faltan.push(`${etiqueta}: el lugar de la tarea «${limpio(t?.tarea)}» («${limpio(t?.lugar)}») no está en la carta`); continue }
        const q = ubicar(t?.hacia, p)
        const u = fichaDe(t?.unidad, pz.propias)
        tts.push({ centro: r5(p), tarea: id, escalon: ESC_TAREA[u?.escalon] || u?.escalon || 'brigada', rot: Math.round(q ? rumbo(p, q) : pRojo ? rumbo(p, pRojo) : 0), escala: 1, capIA: { cap: n, fase: i + 1, unidad: u?.designacion || '' } })
      }
      for (const o of Array.isArray(f?.obstaculos) ? f.obstaculos : []) {
        const id = obsOk.get(norm(o?.tipo))
        const p = ubicar(o?.lugar, pRojo)
        if (!id) { if (o?.tipo) faltan.push(`${etiqueta}: el obstáculo «${limpio(o.tipo)}» no está en el catálogo`); continue }
        if (!p) { faltan.push(`${etiqueta}: el lugar del obstáculo «${limpio(o?.tipo)}» («${limpio(o?.lugar)}») no está en la carta`); continue }
        obsAcum = [...obsAcum, { ...obstaculoEn(id, p, ubicar(o?.hasta, p), obsCat, pRojo ? rumbo(pRojo, p) : null), capIA: { cap: n, fase: i + 1 } }]
      }
      const fus = []
      for (const x of Array.isArray(f?.fuegos) ? f.fuegos : []) {
        const p = ubicar(x?.lugar, pRojo)
        if (!p) { faltan.push(`${etiqueta}: el lugar del fuego «${limpio(x?.tipo) || 'concentración'}» («${limpio(x?.lugar)}») no está en la carta`); continue }
        const medio = fichaDe(x?.unidad, pz.propias)
        const r6 = (v) => Math.round(v * 1e6) / 1e6
        nAB++
        fus.push({
          id: `cap${n}-f${i + 1}-${fus.length + 1}`,
          num: `AB-${String(nAB).padStart(3, '0')}`,
          lng: r6(p[0]), lat: r6(p[1]), cota: null,
          forma: 'circular', radioM: 200, largoM: 400, anchoM: 200, orientacion: 0,
          tipo: tiposOk.get(norm(x?.tipo)) || 'apoyo',
          efecto: efectosOk.get(norm(x?.efecto)) || 'neutralizar',
          ejecucion: 'a_pedido', medio: null,
          descripcion: [medio ? `lo bate ${medio.designacion}` : limpio(x?.unidad) ? `lo bate ${limpio(x.unidad)}` : '', limpio(x?.proposito)].filter(Boolean).join(' — '),
          fase: `CAP ${n} · fase ${i + 1}`, hora: '', municion: '', espoleta: '', volumen: '', observador: '',
          proposito: limpio(x?.proposito), obs: 'IA — verificar',
          capIA: { cap: n, fase: i + 1 },
        })
      }
      const ops = { ...opsBase, tareas: [...sinIA(opsBase.tareas), ...tts], obstaculos: [...sinIA(opsBase.obstaculos), ...obsAcum] }
      return {
        nombre: limpio(f?.nombre) || `Fase ${i + 1}`,
        tarea: limpio(f?.tarea),
        proposito: limpio(f?.proposito),
        origen: `IA · CAP ${n}${limpio(f?.cuando) ? ` · ${limpio(f.cuando)}` : ''}`,
        unidades: unidades.map((u) => ({ ...u })),
        ops,
        plan: { ...planBase, blancos: [...blancosBase, ...fus] },
        desplazamientos: [],
      }
    })
    const f3p6 = {}
    for (const [kk, v] of Object.entries(c?.f3p6 && typeof c.f3p6 === 'object' ? c.f3p6 : {})) if (limpio(v)) f3p6[kk] = `${limpio(v)} ${IA}`
    if (fases.length) caps[n] = { forma: String(c?.forma || ''), nombre: limpio(c?.nombre), fases, f3p6 }
  })
  if (!caps[1] && !caps[2]) return { ok: false, error: 'La respuesta trae los CAP pero sin «fases»: no hay nada para poner en la carta.' }
  const juicio = g.juicio && typeof g.juicio === 'object' ? Object.entries(g.juicio).map(([k, v]) => `${k}: ${limpio(v)}`).join('\n') : limpio(g.juicio)
  if (juicio) for (const n of [1, 2]) if (caps[n]) {
    const k = 'Razón fundamental (por qué este CAP)'
    caps[n].f3p6[k] = `${juicio}${caps[n].f3p6[k] ? `\n\n${caps[n].f3p6[k]}` : ` ${IA}`}`
  }
  const movidas = Object.values(caps).reduce((s, c) => s + c.fases.reduce((a, f) => a + f.unidades.filter((u) => u.tarea).length, 0), 0)
  const resumen = [1, 2].filter((n) => caps[n]).map((n) => `CAP ${n}: ${caps[n].fases.length} fases`).join(' · ')
  if (L.cortado) faltan.unshift('la respuesta de la IA venía CORTADA: se colocó hasta donde llegó (pedile que siga o que la reenvíe más corta)')
  return { ok: true, caps, juicio, faltan, resumen, movidas, reparado: L.reparado, cortado: L.cortado }
}
