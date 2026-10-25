// ⚔️ El EVENTO CRÍTICO de la Matriz de sincronización (F4·P6-7): una fase 🔵 del CAP (G-3) frente a una fase 🔴 del
// CAE (G-2), guardadas juntas en el ejercicio y listas para el Juego de Guerra. Sin dependencias: se prueba en Node.
//
// PMTD 2017 (Matriz de Sincronización): «permite sincronizar el curso de acción para que coincida en tiempo, espacio y
// propósito en relación con el curso de acción más probable del enemigo».
//
// Dónde queda lo elegido: en la misma hoja, `g3.sincro._evento = { cap, azul, rojo, coa }` (la rejilla lee sólo las
// casillas «FILA|COLUMNA», así que la clave con «_» no se ve ni va al Word, como `_cols`). El Juego de Guerra la lee del
// ejercicio.json (index.html, `_wgFasesCOA`) y la ofrece primera: «⚔️ EVENTO CRÍTICO».

export const MARCA = '[Mesa — verificar]'
export const RADIO_KM = 15
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
export const romano = (n) => ROMANOS[n - 1] || String(n)

export const esRoja = (u) => !!u && (u.bando === 'enemigo' || u.bando === 'enemigas' || u.bando === 'rojo')
const esInst = (u) => !!u && u.tipo === 'instalacion'
const conLugar = (u) => !!u && Number.isFinite(Number(u.lat)) && Number.isFinite(Number(u.lng))
const deManiobra = (u) => conLugar(u) && !esInst(u) && !u.esAgrupacion
export const nomUnidad = (u) => String(u?.designacion || u?.nombre || u?.etiqueta || u?.escalon || 'unidad').trim()

// Distancia en km entre dos fichas (haversine, la misma fórmula que el resto de la Mesa).
export function km(a, b) {
  const r = (x) => (x * Math.PI) / 180
  const dLat = r(Number(b.lat) - Number(a.lat))
  const dLng = r(Number(b.lng) - Number(a.lng))
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(Number(a.lat))) * Math.cos(r(Number(b.lat))) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const fmtKm = (x) => `${(Math.round(x * 10) / 10).toLocaleString('es')} km`

// El CAP activo está en fasesCOA.propio; el otro, guardado en g3._caps.guardados[n].fases (cap-propios/v1/proponer.mjs).
export function capActivo(g3) {
  return g3?._caps?.activo === 2 ? 2 : 1
}
export function fasesDeCAP({ fasesCOA = {}, g3 = {} } = {}, cap) {
  const act = capActivo(g3)
  if (cap === act) return Array.isArray(fasesCOA?.propio) ? fasesCOA.propio : []
  const g = g3?._caps?.guardados?.[cap]?.fases
  return Array.isArray(g) ? g : []
}
// Las fases 🔵 de los dos CAP: [{ cap, idx, nombre, fase, activo }].
export function fasesAzules(ctx = {}) {
  const act = capActivo(ctx.g3)
  const out = []
  for (const cap of [act, act === 1 ? 2 : 1])
    fasesDeCAP(ctx, cap).forEach((f, idx) => {
      if (f) out.push({ cap, idx, activo: cap === act, fase: f, nombre: `CAP ${cap} · FASE ${romano(idx + 1)}${f.nombre ? ` — ${f.nombre}` : ''}` })
    })
  return out
}
// Las fases 🔴 del CAE: [{ idx, coa, n, nombre, fase }]. `coa`: 'probable' | 'peligroso' (las arma el 🎬 del G-2).
export const NOM_COA = { probable: 'CAE más probable', peligroso: 'CAE más peligroso' }
export function fasesRojas(fasesCOA = {}) {
  const cuenta = {}
  return (Array.isArray(fasesCOA?.enemigo) ? fasesCOA.enemigo : [])
    .map((f, idx) => {
      if (!f) return null
      const coa = f.coa === 'peligroso' ? 'peligroso' : 'probable'
      const n = Number(f.n) || (cuenta[coa] = (cuenta[coa] || 0) + 1)
      return { idx, coa, n, fase: f, nombre: `${NOM_COA[coa]} · FASE ${romano(n)}${f.nombre ? ` — ${f.nombre}` : ''}` }
    })
    .filter(Boolean)
}

// Las dos fases juntas: las fichas 🔵 de la fase del CAP (sin las rojas que tenga a la vista) y las 🔴 de la fase del CAE.
// Las instalaciones de los dos lados quedan (el Juego las completa con las del estado vivo). El calco (ops) es el de la
// fase propia: sus tareas, límites y obstáculos son la maniobra que se juega.
export function enfrentar(faseAzul, faseRoja) {
  const azules = (faseAzul?.unidades || []).filter((u) => u && !esRoja(u) && u.deFaseEnemiga == null)
  const rojas = (faseRoja ? faseRoja.unidades || [] : faseAzul?.unidades || []).filter(esRoja).map((u) => {
    if (u.deFaseEnemiga == null) return u
    const c = { ...u }
    delete c.deFaseEnemiga
    return c
  })
  return { unidades: [...azules, ...rojas], ops: faseAzul?.ops || null, desplazamientos: faseAzul?.desplazamientos || [] }
}

// Qué tan crítico es el encuentro: cuántas unidades 🔴 de maniobra quedan a menos de RADIO_KM de una 🔵, el poder que
// suman y el par más cercano. Es una medida para ORDENAR los encuentros; el juicio es del Estado Mayor.
const PODER = { seccion: 1, compania: 3, batallon: 9, regimiento: 18, brigada: 27, division: 81, cuerpo: 243, ejercito: 729 }
const poder = (u) => Number(u?.poder_max) || PODER[u?.escalon] || 9
export function medir(faseAzul, faseRoja, radio = RADIO_KM) {
  const { unidades } = enfrentar(faseAzul, faseRoja)
  const az = unidades.filter((u) => !esRoja(u) && deManiobra(u))
  const ro = unidades.filter((u) => esRoja(u) && deManiobra(u))
  let cerca = null
  let enContacto = 0
  let poderRojo = 0
  const azulesEnContacto = new Set()
  for (const r of ro) {
    let mejor = null
    for (const a of az) {
      const d = km(a, r)
      if (!mejor || d < mejor.d) mejor = { d, azul: a, roja: r }
      if (d <= radio) azulesEnContacto.add(a)
    }
    if (!mejor) continue
    if (!cerca || mejor.d < cerca.d) cerca = mejor
    if (mejor.d <= radio) {
      enContacto++
      poderRojo += poder(r)
    }
  }
  const poderAzul = [...azulesEnContacto].reduce((s, a) => s + poder(a), 0)
  return {
    azules: az.length,
    rojas: ro.length,
    enContacto,
    azulesEnContacto: azulesEnContacto.size,
    poderRojo,
    poderAzul,
    relacion: poderAzul ? Math.round((poderRojo / poderAzul) * 10) / 10 : null,
    km: cerca ? Math.round(cerca.d * 10) / 10 : null,
    par: cerca ? [nomUnidad(cerca.azul), nomUnidad(cerca.roja)] : null,
    // Más unidades enemigas en contacto, más poder enemigo y más cerca = más crítico.
    puntaje: cerca ? enContacto * 1e6 + poderRojo * 100 + Math.max(0, 99 - Math.min(99, cerca.d)) : 0,
  }
}
export function textoMedida(m) {
  if (!m || !m.rojas || !m.azules) return m && !m.rojas ? 'sin fichas rojas en esa fase' : 'sin fichas propias en esa fase'
  const t = m.enContacto ? `${m.enContacto} unidad(es) enemiga(s) a menos de ${RADIO_KM} km` : `ninguna unidad enemiga a menos de ${RADIO_KM} km`
  return `${t}; las más cercanas: ${m.par[0]} y ${m.par[1]} a ${fmtKm(m.km)}${m.relacion != null ? `; relación enemigo/propio en contacto ${String(m.relacion).replace('.', ',')} : 1` : ''}`
}

// La fase 🔴 que le toca a cada fase 🔵: la que eligió el oficial (la del 🎬 C.A. por fases, `contra`, si es del mismo
// CAE); si no, las dos listas ALINEADAS POR EL FINAL (25-10-2026, Sergio: «fase IV de azul contra fase III de rojo»):
// el último choque es la última fase de los dos. Con 5 fases 🔵 de la defensa y 4 🔴 del ataque: I y II contra la
// FASE I (ramificación), III contra la II (apresto lejano), IV —conducción de la defensa— contra la III —ataque
// propiamente tal— y V —contraataque— contra la IV —ruptura y explotación—. `nAzul`: las fases del CAP.
export function rojaDeAzul(az, rojas, coa = 'probable', nAzul = 0) {
  const delCAE = rojas.filter((r) => r.coa === coa)
  if (!delCAE.length) return null
  const contra = az?.fase?.contra
  if (Number.isInteger(contra)) {
    const r = delCAE.find((x) => x.idx === contra)
    if (r) return r
  }
  const corrimiento = Math.max(0, (Number(nAzul) || 0) - delCAE.length)
  return delCAE[Math.max(0, Math.min(az.idx - corrimiento, delCAE.length - 1))]
}
// Los encuentros de un CAP con su CAE, medidos, y el más crítico (⭐).
export function encuentros(ctx = {}, { cap, coa = 'probable', elegidas = {} } = {}) {
  const rojas = fasesRojas(ctx.fasesCOA)
  const azules = fasesAzules(ctx).filter((a) => cap == null || a.cap === cap)
  const filas = azules.map((az) => {
    const pedida = elegidas[az.idx]
    const roja = (pedida != null && rojas.find((r) => r.idx === pedida && r.coa === coa)) || rojaDeAzul(az, rojas, coa, azules.filter((a) => a.cap === az.cap).length)
    return { azul: az, roja, medida: roja ? medir(az.fase, roja.fase) : null }
  })
  let critico = null
  for (const f of filas) if (f.medida && (!critico || f.medida.puntaje > critico.medida.puntaje)) critico = f
  return { filas, critico, rojas, coas: [...new Set(rojas.map((r) => r.coa))] }
}

// Lo elegido, resuelto contra el ejercicio: { azul, roja, nombre, medida } o null si ya no existe alguna de las dos.
export function resolver(ctx = {}, ev) {
  if (!ev || !Number.isInteger(ev.azul) || !Number.isInteger(ev.rojo)) return null
  const cap = ev.cap === 2 ? 2 : 1
  const az = fasesAzules(ctx).find((a) => a.cap === cap && a.idx === ev.azul)
  const ro = fasesRojas(ctx.fasesCOA).find((r) => r.idx === ev.rojo)
  if (!az || !ro) return null
  return { azul: az, roja: ro, nombre: `${az.nombre} contra ${ro.nombre}`, medida: medir(az.fase, ro.fase) }
}
// Lo que queda guardado en la hoja.
export function conEvento(valor = {}, sel) {
  return { ...(valor || {}), _evento: { cap: sel.cap, azul: sel.azul, rojo: sel.rojo, coa: sel.coa || 'probable', t: new Date().toISOString() } }
}

// 📝 La matriz: en la columna de la fase 🔵 (si es del CAP activo: las columnas son sus fases), MANIOBRA e INTELIGENCIA
// con el evento crítico. Sólo las casillas vacías; sin emojis (van al Word).
export function anotar(valor = {}, hoja = {}, r) {
  if (!r || !r.azul.activo) return { valor, n: 0 }
  const cols = valor?._cols?.length ? valor._cols : hoja?.colsDefecto || []
  const col = cols[r.azul.idx]
  if (!col) return { valor, n: 0 }
  const fa = r.azul.fase || {}
  const fr = r.roja.fase || {}
  const rojas = (fr.unidades || []).filter((u) => esRoja(u) && deManiobra(u)).map(nomUnidad)
  const casillas = {
    [`MANIOBRA|${col}`]: `EVENTO CRÍTICO: ${r.azul.nombre} contra ${r.roja.nombre}.${fa.tarea ? ` Tarea: ${fa.tarea}` : ''}${fa.proposito ? `, ${fa.proposito}` : ''}. ${textoMedida(r.medida)}. Se juega en el Juego de Guerra. ${MARCA}`,
    [`INTELIGENCIA|${col}`]: `Enemigo en esta fase (${r.roja.nombre}): ${fr.tarea ? `${fr.tarea} ` : ''}${rojas.length ? `con ${rojas.slice(0, 8).join(', ')}${rojas.length > 8 ? '…' : ''}` : ''}. ${MARCA}`,
  }
  const v = { ...(valor || {}) }
  let n = 0
  for (const [k, t] of Object.entries(casillas)) {
    if (String(v[k] ?? '').trim()) continue
    v[k] = t
    n++
  }
  return { valor: v, n, col }
}

// ⬇️ El ejercicio para el Juego de Guerra: el ejercicio entero (sigue sirviendo para la Mesa) con el evento guardado en
// la hoja y `eventoCritico` ya armado (las fichas de las dos fases y el calco de la fase propia), que el Juego ofrece
// primero.
export function paraElJuego(ejercicio = {}, valorHoja = {}, sel) {
  const ctx = { fasesCOA: ejercicio.fasesCOA || {}, g3: ejercicio.g3 || {} }
  const r = resolver(ctx, sel)
  if (!r) return null
  const e = enfrentar(r.azul.fase, r.roja.fase)
  return {
    ...ejercicio,
    g3: { ...(ejercicio.g3 || {}), sincro: conEvento(valorHoja, sel) },
    eventoCritico: {
      nombre: `EVENTO CRÍTICO — ${r.nombre}`,
      cap: r.azul.cap,
      azul: r.azul.idx,
      rojo: r.roja.idx,
      coa: r.roja.coa,
      medida: r.medida,
      unidades: e.unidades,
      ops: e.ops,
      desplazamientos: e.desplazamientos,
    },
  }
}
export function nombreArchivo(nombre, ms = Date.now()) {
  const d = new Date(ms)
  const p = (x) => String(x).padStart(2, '0')
  const limpio = String(nombre || 'ejercicio').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/\s+/g, '_') || 'ejercicio'
  return `JUEGO_GUERRA_${limpio}_evento_critico_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.json`
}
