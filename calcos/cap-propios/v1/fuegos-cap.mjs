// 🔥 El plan de fuegos de UN curso de acción propio, armado con la ARTILLERÍA que tiene el ejercicio (11-11-2026).
// Sergio: «los planes de fuegos automáticamente deben salir de las unidades de artillería que tenemos, o sea a esa
// unidad se le debe asignar, por lo tanto es esa unidad la que proporcionará los fuegos».
//
// - Los medios son los del 🔥 Fuegos de la Mesa (fuegos/plan-fuegos.js, `mediosDeApoyo`): sólo artillería y
//   lanzacohetes con posición en la carta (los morteros orgánicos de la maniobra no entran).
// - Los blancos salen de ESTE CAP: el fuego de protección final delante de cada unidad de primera línea (en la
//   defensa), las fichas enemigas más cercanas (contrapreparación en la defensa, preparación en el ataque) y cada
//   obstáculo de su barrera (hay que batirlo para que el enemigo no lo despeje).
// - Cada concentración queda ASIGNADA a una unidad de artillería (`medio`): la que la alcanza y tiene menos blancos;
//   el esfuerzo principal elige primero. Si ninguna la alcanza, va la más cercana y el 🔥 Fuegos la pinta de fucsia.
// - Lo que puso el oficial a mano no se toca: sólo se rehacen las concentraciones que armó esta función (`auto: 'cap'`).
// Sin dependencias: `modelo` es window.MesaFuegos.modelo (en Node, require('fuegos/plan-fuegos.js')).

export const ARMAS_ARTILLERIA = ['artilleria', 'lanzacohetes']
const MAX_ENEMIGOS = 8
const MAX_OBSTACULOS = 10
const valido = (p) => Array.isArray(p) && p.length === 2 && p.every((x) => Number.isFinite(+x))
const esEnemiga = (u) => !!u && (u.bando === 'enemigo' || u.bando === 'enemigas')

function rumbo([lng1, lat1], [lng2, lat2]) {
  const r = Math.PI / 180
  const y = Math.sin((lng2 - lng1) * r) * Math.cos(lat2 * r)
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lng2 - lng1) * r)
  return ((Math.atan2(y, x) / r) + 360) % 360
}
const centroObst = (o) => {
  if (valido(o?.centro)) return [+o.centro[0], +o.centro[1]]
  const cs = (o?.coords || []).filter(valido)
  if (!cs.length) return null
  return [cs.reduce((s, c) => s + +c[0], 0) / cs.length, cs.reduce((s, c) => s + +c[1], 0) / cs.length]
}

// Las unidades de artillería que pueden disparar (con posición y alcance).
export function artilleriaDe(medios = []) {
  return (medios || []).filter((m) => m && ARMAS_ARTILLERIA.includes(m.arma) && valido(m.pos) && m.alcance?.m > 0)
}

// ctx: { plan, medios, unidades, ops, cap ({ n, roles }), tipo ('defensiva' | 'ofensiva' | 'retrograda'), modelo }
// → { plan, msg, asignados: { medioId: n }, fuera } o { error }
export function planFuegosCAP({ plan = null, medios = [], unidades = [], ops = {}, cap = null, tipo = 'defensiva', modelo } = {}) {
  if (!modelo?.nuevoBlanco || !modelo?.distanciaM) return { error: 'El 🔥 Fuegos de la Mesa todavía no está listo: abrí una vez la pestaña 🔥 Fuegos y volvé a tocar.' }
  const art = artilleriaDe(medios)
  if (!art.length) {
    const sinPos = (medios || []).filter((m) => m && ARMAS_ARTILLERIA.includes(m.arma) && !valido(m.pos)).length
    return { error: sinPos ? 'Las unidades de artillería no tienen posición de fuego en la carta: ubicalas (🔥 Fuegos → 📍) y volvé a tocar.' : 'No hay unidades de ARTILLERÍA en la carta (RAM, GA, GALM…). Colocá su ficha (🪖 Unidades) o integrala en la Organización de la Tarea, y volvé a tocar.' }
  }
  const n = cap?.n || 1
  const defensa = tipo !== 'ofensiva'
  const porId = new Map((unidades || []).filter((u) => u && u.id != null).map((u) => [u.id, u]))
  const pos = (u) => (u && Number.isFinite(+u.lng) && Number.isFinite(+u.lat) ? [+u.lng, +u.lat] : null)
  const enemigos = (unidades || []).filter((u) => esEnemiga(u) && (u.tipo || 'unidad') === 'unidad' && pos(u))
  const d = (a, b) => modelo.distanciaM(a, b)

  // Las unidades de primera línea del CAP (no la reserva, ni la masa, ni el apoyo): para el fuego de protección final.
  const linea = []
  for (const r of cap?.roles || []) {
    if (/reserva|masa|apoyo|retardo/i.test(r.rol || '')) continue
    for (const x of r.unidades || []) {
      const u = porId.get(x.id)
      if (pos(u)) linea.push({ u, nom: x.nom || u.designacion || 'unidad', principal: !!r.principal })
    }
  }
  const propias = linea.length ? linea.map((l) => pos(l.u)) : (unidades || []).filter((u) => !esEnemiga(u) && (u.tipo || 'unidad') === 'unidad' && pos(u)).map(pos)
  const centro = propias.length ? [propias.reduce((s, p) => s + p[0], 0) / propias.length, propias.reduce((s, p) => s + p[1], 0) / propias.length] : null

  const blancos = []
  // 1) Fuego de protección final, 1,2 km delante de cada unidad de primera línea, hacia el enemigo más cercano.
  if (defensa && enemigos.length && modelo.desplazar) {
    for (const l of linea.sort((a, b) => b.principal - a.principal)) {
      const p = pos(l.u)
      const eno = enemigos.map((e) => [e, d(p, pos(e))]).sort((a, b) => a[1] - b[1])[0]
      if (!eno) continue
      const az = rumbo(p, pos(eno[0]))
      const fpf = modelo.desplazar(p, Math.min(1200, eno[1] / 2), az)
      blancos.push({ p: fpf, principal: l.principal, datos: { tipo: 'proteccion', efecto: 'neutralizar', ejecucion: 'prioritario', forma: 'lineal', largoM: 400, orientacion: Math.round((az + 90) % 180), proposito: `Fuego de protección final delante de ${l.nom}${l.principal ? ' (esfuerzo principal)' : ''}`, descripcion: `FPF de ${l.nom}` } })
    }
  }
  // 2) Las fichas enemigas más cercanas a las propias.
  const cercanos = centro ? [...enemigos].sort((a, b) => d(centro, pos(a)) - d(centro, pos(b))) : enemigos
  for (const e of cercanos.slice(0, MAX_ENEMIGOS)) {
    const nom = e.designacion || 'unidad enemiga'
    blancos.push({ p: pos(e), datos: defensa
      ? { tipo: 'contrapreparacion', efecto: 'neutralizar', ejecucion: 'a_pedido', forma: 'circular', radioM: 300, proposito: `Desorganizar a ${nom} antes de que ataque`, descripcion: `Sobre ${nom}` }
      : { tipo: 'preparacion', efecto: 'neutralizar', ejecucion: 'programado', forma: 'circular', radioM: 300, proposito: `Neutralizar a ${nom} antes del asalto`, descripcion: `Sobre ${nom}` } })
  }
  // 3) Cada obstáculo de la barrera del CAP.
  for (const o of (ops?.obstaculos || []).slice(0, MAX_OBSTACULOS)) {
    const c = centroObst(o)
    if (!c) continue
    const nom = o.nombre || o.tipo || 'obstáculo'
    blancos.push({ p: c, datos: { tipo: 'apoyo', efecto: 'neutralizar', ejecucion: 'a_pedido', forma: 'circular', radioM: 200, proposito: `Batir el obstáculo (${nom}) para que el enemigo no lo despeje`, descripcion: `Sobre el obstáculo ${nom}` } })
  }
  if (!blancos.length) return { error: 'Todavía no hay sobre qué tirar: faltan las fichas enemigas (las del G-2) y la barrera de obstáculos de este CAP.' }

  // Cada concentración, a una unidad de artillería: la que la alcanza y tiene menos blancos (el esfuerzo principal
  // elige primero); si ninguna alcanza, la más cercana.
  const carga = new Map(art.map((m) => [m.id, 0]))
  let fuera = 0
  const elegir = (p) => {
    const filas = art.map((m) => {
      const dist = d(m.pos, p)
      return { m, dist, alcanza: dist <= m.alcance.m && dist >= (m.alcanceMin || 0) }
    })
    const ok = filas.filter((f) => f.alcanza).sort((a, b) => carga.get(a.m.id) - carga.get(b.m.id) || a.dist - b.dist)
    if (ok.length) return ok[0].m
    fuera++
    return filas.sort((a, b) => a.dist - b.dist)[0].m
  }
  const orden = [...blancos.filter((b) => b.principal), ...blancos.filter((b) => !b.principal)]
  let P = { ...(plan && typeof plan === 'object' ? plan : {}) }
  P = { ...P, blancos: (Array.isArray(P.blancos) ? P.blancos : []).filter((b) => b && b.auto !== 'cap') }
  const ahora = Date.now()
  for (const [i, b] of orden.entries()) {
    const m = elegir(b.p)
    carga.set(m.id, carga.get(m.id) + 1)
    const r = modelo.nuevoBlanco(P, b.p, { ...b.datos, medio: m.id, auto: 'cap', cap: n, descripcion: `${b.datos.descripcion} — lo dispara ${m.nombreCompleto || m.nombre}` }, ahora + i)
    P = r.plan
  }
  const asignados = Object.fromEntries([...carga].filter(([, k]) => k))
  const reparto = art.filter((m) => carga.get(m.id)).map((m) => `${m.corto || m.nombre} ${carga.get(m.id)}`).join(' · ')
  const manuales = P.blancos.filter((b) => b.auto !== 'cap').length
  return {
    plan: P,
    asignados,
    fuera,
    msg: `🔥 Plan de fuegos del CAP ${n}: ${orden.length} concentración(es), cada una con la unidad de artillería que la dispara (${reparto}).${fuera ? ` ⚠️ ${fuera} quedan fuera del alcance de todas: van en FUCSIA en 🔥 Fuegos — acercá la artillería.` : ''}${manuales ? ` Las ${manuales} que pusiste a mano no se tocaron.` : ''} Revisalo en la pestaña 🔥 Fuegos.`,
  }
}
