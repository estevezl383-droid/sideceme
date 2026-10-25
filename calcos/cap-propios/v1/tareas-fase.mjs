// 🎯 Las tareas tácticas de las fases de un CAP propio, CON SU UNIDAD. Sin dependencias del compilado: lo usan
// posiciones.mjs (la unidad va junto a su tarea en la organización), carta-ia.mjs (la tarea de la IA, en su fase y con
// su unidad), proponer.mjs / panel.js (al armar las fases), la capa de la F3·P3 (organizacion/v1/carta.js: el rótulo
// OD / OC / RES con su unidad) y las pruebas (en Node).
//
// Sergio, 25-10-2026, con la FASE I del CAP 1 a la vista: «la OC y la OD deben permanecer con su nombre con la unidad…
// están solas ya esperando en un lugar; eso se mueve con la unidad», «las tareas tácticas deben aparecer con la unidad,
// no deben aparecer solas sin la unidad… con su unidad en este punto, sólo en ese punto, en esta fase», «OC, OD siempre
// va con la unidad, siempre» y «cada fase tiene una tarea táctica diferente, y las tareas que se ven sólo aparecerían
// en la FASE III, porque no hacen esa tarea todo el rato, todas las fases». Por eso:
//   · cada tarea tiene SU unidad (`duenoDeTarea`): la agrupación de la F3·P3 (por su agId, o la única de su operación),
//     la que nombró la IA, o la unidad de la que salen sus piezas;
//   · las tareas de la carta (las de la F3·P3, con su OD / OC, y las que puso el oficial) son de la FASE III, la de la
//     ocupación y organización: se ven SÓLO ahí y sólo si su unidad está con ellas (a menos de CERCA km). En las otras
//     fases quedan guardadas en `ops.tareasOcultas`: para el rótulo OD / OC (que va siempre con su unidad) y para volver
//     a armar;
//   · cada fase tiene SUS tareas: las de la IA (`capIA`) van sólo en su fase y en su CAP; la que propone la Mesa para el
//     rol de cada unidad en esa fase va pegada a su ficha (`tareaSimbolo`, posiciones.mjs).
import * as G from '../../concepto-operacion/v1/geo.mjs'

// A menos de esto (km) la unidad está CON su tarea.
export const CERCA = 3
// Junto a su tarea: la unidad, a esto (km) de la tarea, del lado propio.
export const JUNTO = 0.7
// La fase de la ocupación y organización (FASE III), la misma de posiciones.mjs: la de las tareas de la carta.
export const FASE_ORG = 2

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toUpperCase().replace(/[^A-Z0-9ª]+/g, ' ').trim()
const esEnemiga = (u) => /^(enemig|rojo)/i.test(String(u?.bando || ''))
const pos = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
// La tarea de UNA fase (la puso la IA para esa fase): { cap, fase, unidad }.
export const deFase = (t) => t?.capIA || null

// Las fichas propias de unidad que pueden tener tareas (con posición; sin las fichas rojas de una fase enemiga).
const propias = (unidades) => (unidades || []).filter((u) => u && !esEnemiga(u) && (u.tipo || 'unidad') === 'unidad' && u.deFaseEnemiga == null && pos(u))

// La ficha que nombra un texto: igual, sin puntos ni guiones, o contenida («DIV MEC-2» ↔ «DIV.MEC.-2 (FICT.)»).
export function fichaPorNombre(nombre, unidades) {
  const n = norm(nombre).replace(/ /g, '')
  if (!n) return null
  const conN = (unidades || []).map((u) => ({ u, k: norm(u?.designacion).replace(/ /g, '') })).filter((x) => x.k)
  return (conN.find((x) => x.k === n) || conN.find((x) => x.k.startsWith(n) || n.startsWith(x.k)) || conN.find((x) => x.k.includes(n) || n.includes(x.k)))?.u || null
}

// Cómo se reconoce una tarea entre fases (la misma tarea está copiada en cada fase).
export const claveTarea = (t) =>
  t?.oi?.id
    ? `oi:${t.oi.id}`
    : t?.capIA
      ? `ia:${t.capIA.cap}:${t.capIA.fase}:${t.tarea}:${t.centro}`
      : `${t?.tarea}@${t?.centro}`

// Las tareas tácticas de la carta (las del calco: las de la F3·P3 y las que puso el oficial), las que se ven y las que
// esta fase guarda aparte, sin las de una fase (las de la IA) y sin repetir.
export function tareasDeLaCarta(ops) {
  const vistas = new Set()
  const out = []
  for (const t of [...(ops?.tareas || []), ...(ops?.tareasOcultas || [])]) {
    if (!t || deFase(t) || !G.valido(t.centro)) continue
    const k = claveTarea(t)
    if (vistas.has(k)) continue
    vistas.add(k)
    out.push(t)
  }
  return out
}

// La unidad que cumple la tarea (la ficha), o null.
export function duenoDeTarea(t, unidades) {
  if (!t) return null
  const us = propias(unidades)
  const oi = t.oi || {}
  // La agrupación de la Organización de la Tarea que se llevó al calco con esta tarea.
  if (oi.agId) {
    const u = us.find((x) => x.esAgrupacion && x.agId === oi.agId)
    if (u) return u
  }
  // La que nombró la IA.
  if (t.capIA?.unidad) {
    const u = fichaPorNombre(t.capIA.unidad, us)
    if (u) return u
  }
  // La única agrupación con su operación («OD», «OC 1»…).
  if (oi.operacion && oi.operacion !== 'fuera') {
    const ags = us.filter((x) => x.esAgrupacion && x.operacionAg === oi.operacion)
    if (ags.length === 1) return ags[0]
  }
  // La unidad de la que salen más piezas (con unidades enteras, la unidad misma).
  const cuenta = new Map()
  for (const p of oi.piezas || []) {
    const sin = us.filter((x) => !x.esAgrupacion)
    const u = sin.find((x) => x.id === p?.de) || (p?.madre ? fichaPorNombre(p.madre, sin) : null)
    if (u) cuenta.set(u, (cuenta.get(u) || 0) + 1)
  }
  if (cuenta.size) return [...cuenta].sort((a, b) => b[1] - a[1])[0][0]
  return null
}

// El orden en que las unidades eligen su tarea (si una tiene varias): la OD, las OC, las demás.
const ORDEN_OP = ['od', 'oc1', 'oc2', 'oc3', 'oc4', 'oc5', 'sost']
export const ordenTareas = (ts) =>
  (ts || []).map((t, i) => ({ t, i, k: ORDEN_OP.indexOf(t?.oi?.operacion) })).sort((a, b) => (a.k < 0 ? 99 : a.k) - (b.k < 0 ? 99 : b.k) || a.i - b.i).map((x) => x.t)

// Dónde va la unidad para estar junto a su tarea: a JUNTO km, del lado propio (el contrario al enemigo); sin enemigo,
// un poco al sur (como la ficha de una agrupación que se lleva al calco desde el panel 🧩).
export function juntoA(t, enemigo = null) {
  const c = [+t.centro[0], +t.centro[1]]
  if (G.valido(enemigo) && G.km(enemigo, c) > 0.05) return G.desplazar(c, JUNTO, G.rumbo(enemigo, c)).map(G.r6)
  return [G.r6(c[0]), G.r6(c[1] - 0.006)]
}

// ¿La unidad está con su tarea? (a menos de CERCA km)
export const conSuTarea = (u, t) => !!u && !!pos(u) && G.valido(t?.centro) && G.km(pos(u), [+t.centro[0], +t.centro[1]]) <= CERCA

// Las fases de un CAP con cada tarea táctica donde corresponde. n: el número del CAP (las de otro CAP no van).
// En cada fase: `ops.tareas` = las que se ven (las de la IA de esa fase; en la FASE III, las de la carta cuya unidad
// está con ellas), `ops.tareasOcultas` = las de la carta que en esa fase no se ven. Los obstáculos que puso la IA para
// el otro CAP tampoco van.
export function tareasPorFase(fases = [], { n = null } = {}) {
  const deOtroCAP = (x) => {
    const c = deFase(x)
    return n != null && c?.cap != null && Number(c.cap) !== Number(n)
  }
  return (fases || []).map((f, i) => {
    if (!f) return f
    const ops = f.ops || {}
    const us = f.unidades || []
    const ver = []
    const ocultas = []
    const vistas = new Set()
    for (const t of [...(ops.tareas || []), ...(ops.tareasOcultas || [])]) {
      if (!t) continue
      const k = claveTarea(t)
      if (vistas.has(k)) continue
      vistas.add(k)
      const c = deFase(t)
      if (c) {
        // La de la IA: sólo en su fase y en su CAP.
        if (deOtroCAP(t) || (c.fase != null && Number(c.fase) !== i + 1)) continue
        ver.push(t)
        continue
      }
      if (!G.valido(t.centro)) {
        ver.push(t)
        continue
      }
      // La de la carta: sólo en la FASE III y con su unidad («no hacen esa tarea todo el rato, todas las fases»).
      const u = duenoDeTarea(t, us)
      ;(i === FASE_ORG && (!u || conSuTarea(u, t)) ? ver : ocultas).push(t)
    }
    const nuevo = { ...ops, tareas: ver, tareasOcultas: ocultas }
    if (Array.isArray(ops.obstaculos) && ops.obstaculos.some(deOtroCAP)) nuevo.obstaculos = ops.obstaculos.filter((o) => !deOtroCAP(o))
    return { ...f, ops: nuevo }
  })
}

// La unidad de la reserva de la F3·P3 (lo que sobra): su agrupación (por su agId, o la única con operación «reserva»),
// o la unidad de la que salen más de sus piezas.
export function duenoDeReserva(reserva, unidades) {
  const us = propias(unidades)
  if (reserva?.agId) {
    const u = us.find((x) => x.esAgrupacion && x.agId === reserva.agId)
    if (u) return u
  }
  const ags = us.filter((x) => x.esAgrupacion && x.operacionAg === 'reserva')
  if (ags.length === 1) return ags[0]
  return duenoDeTarea({ oi: { piezas: reserva?.piezas || [] } }, unidades)
}
