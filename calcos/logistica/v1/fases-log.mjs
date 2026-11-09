// 🚚 Lo del G-4 y del G-1 a lo largo de las FASES del 🎬 C.A. por fases (Sergio, 08-11-2026):
//   «el ASDI que se elige se elige para todas las fases del ejercicio, igual las instalaciones están ahí en todas
//   las fases… los ejes de abastecimiento y de evacuación los armaré en una determinada fase: si lo armo en la fase 3
//   se queda en la fase 4 y 5… si llego a la fase 5 debo poder modificarlo… si no lo modifiqué se queda lo de la
//   fase 3… lo mismo aplica al G-1 con su línea de extraviados y lo que le competa».
//
// Cada fase guarda una copia entera del calco (`ops`) y de las fichas (`unidades`): al tocar otra fase, la Mesa
// ponía la copia de esa fase y el ARCE / ASDI, sus sectores y sus instalaciones desaparecían; los ejes nunca
// pasaban a la fase siguiente. Acá, dos clases de cosas:
//
//   · DE TODO EL EJERCICIO (en todas las fases de los dos bandos y de los dos CAP): las áreas logísticas
//     (`zonasLog`: ASDI, ARCE, las propuestas A, B…, el esquema de zonas), sus sectores (`sectoresLog`), las
//     flechas del esquema (`flechasZona`), los marcos de las áreas (las `magnitudes` con origen «zona-…»), los
//     datos de planeamiento del G-4 (`planLog`) y las fichas logísticas DEL ÁREA: las del Batallón Logístico
//     desplegado (`origen: 'plantilla-asdi'`) y toda instalación propia que está DENTRO de un área logística.
//     Lo que está a la vista manda: lo que se cambia en una fase cambia en todas.
//
//   · DESDE LA FASE EN QUE SE ARMAN, HACIA ADELANTE: los ejes del G-4 (`ejesLog`: EPA y EPE), las líneas del EM
//     (`lineasEM`: la Línea de Extraviados y la ruta de PP.GG. del G-1, el eje humanitario del G-5) y las
//     instalaciones propias que están FUERA de las áreas (el PCE sobre la Línea de Extraviados, un puesto
//     adelantado…). Lo que se arma o se cambia en la FASE III pasa a la IV, la V… mientras esas fases sigan con
//     lo de antes; la que ya tenía su propio cambio (o lo había borrado) se queda con lo suyo, y las que siguen a
//     ésa heredan de ella. Las fases de antes no se tocan.
//
// Cada eje / línea lleva `lid` (la huella de cómo era al nacer: la misma en todas sus copias) para saber cuál es
// cuál de una fase a otra; las fichas se reconocen por su `id` y las áreas por su `clave`. Cada fase que ya pasó
// por acá lleva `logV: 1`: las de antes de este cambio (sin la marca) se ponen al día UNA vez al tocar una fase
// (lo de todo el ejercicio que tenían se junta con lo que está a la vista y lo de la fase anterior que les faltaba
// se hereda).
//
// Sin dependencias del compilado: lo usan `fo` (guardar la fase activa) y `Uo` (tocar una fase) de la Mesa.

export const GLOBALES = ['zonasLog', 'sectoresLog', 'flechasZona']
export const HEREDADOS = ['ejesLog', 'lineasEM']
export const VERSION = 1

const lista = (x) => (Array.isArray(x) ? x : [])
const esEnemiga = (u) => u?.bando === 'enemigo' || u?.bando === 'enemigas'
export const esMarcoDeZona = (m) => typeof m?.origen === 'string' && m.origen.startsWith('zona-')
// Ficha logística propia: una instalación o una pieza del Batallón Logístico desplegado en el área.
export const esLogistica = (u) => !!u && typeof u === 'object' && !esEnemiga(u) && u.deFaseEnemiga == null && (u.tipo === 'instalacion' || u.origen === 'plantilla-asdi')

// JSON con las claves ordenadas (dos copias del mismo objeto dan el mismo texto).
export function estable(v) {
  if (Array.isArray(v)) return `[${v.map(estable).join(',')}]`
  if (v && typeof v === 'object') return `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${estable(v[k])}`).join(',')}}`
  return JSON.stringify(v) ?? 'null'
}
const igual = (a, b) => estable(a) === estable(b)
function huella(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

// ─── Geometría mínima: ¿el punto [lng, lat] está dentro del anillo? ──────────────────────────────────────────────
export function dentro(p, anillo) {
  const [x, y] = p || []
  if (!Number.isFinite(x) || !Number.isFinite(y) || lista(anillo).length < 3) return false
  let si = false
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i] || []
    const [xj, yj] = anillo[j] || []
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi) si = !si
  }
  return si
}
// Las áreas logísticas que «contienen» instalaciones (no las grandes zonas del esquema: ZC, ZO…).
export const areasDe = (ops) => lista(ops?.zonasLog).filter((z) => z && !z.esquemaDe && lista(z.coords).length >= 3)
const enArea = (u, areas) => areas.some((z) => dentro([Number(u.lng), Number(u.lat)], z.coords))
// ¿Es una ficha de TODO el ejercicio? (del Batallón Logístico desplegado o una instalación dentro de un área)
export const fichaGlobal = (u, areas) => esLogistica(u) && (u.origen === 'plantilla-asdi' || enArea(u, areas))
// ¿Es una ficha que se HEREDA de fase en fase? (instalación propia fuera de las áreas)
export const fichaHeredada = (u, areas) => esLogistica(u) && !fichaGlobal(u, areas)

const claveZona = (z) => z?.clave || `c${huella(estable(z?.coords))}`
const claveSector = (s) => (s?.areaLog != null && (s?.nombre != null || s?.sector != null) ? `${s.areaLog}|${s.sector ?? ''}|${s.nombre ?? ''}` : `c${huella(estable(s))}`)

// ─── Las huellas de los ejes y las líneas ────────────────────────────────────────────────────────────────────────
// `lid` = huella de cómo era el trazo cuando nació (sin su lid): las copias que nunca se tocaron la tienen igual en
// todas las fases. Dos trazos idénticos en la misma fase: «-2», «-3»…
function conLids(xs) {
  const arr = lista(xs)
  if (!arr.some((x) => x && typeof x === 'object' && !x.lid)) return xs
  const usados = new Set(arr.map((x) => x?.lid).filter(Boolean))
  return arr.map((x) => {
    if (!x || typeof x !== 'object' || x.lid) return x
    const base = `l${huella(estable(x))}`
    let lid = base
    for (let k = 2; usados.has(lid); k++) lid = `${base}-${k}`
    usados.add(lid)
    return { ...x, lid }
  })
}
function opsConLids(ops) {
  if (!ops || typeof ops !== 'object') return ops
  let o = ops
  for (const k of HEREDADOS) {
    const v = conLids(ops[k])
    if (v !== ops[k]) o = { ...o, [k]: v }
  }
  return o
}
const faseConLids = (f) => {
  if (!f || typeof f !== 'object') return f
  const ops = opsConLids(f.ops)
  return ops === f.ops ? f : { ...f, ops }
}
const fasesConLids = (fc) => {
  if (!fc || typeof fc !== 'object') return fc
  const r = { ...fc }
  for (const b of ['propio', 'enemigo']) if (Array.isArray(fc[b])) r[b] = fc[b].map(faseConLids)
  return r
}

// ─── Lo de todo el ejercicio ─────────────────────────────────────────────────────────────────────────────────────
// De un estado (ops + fichas): { ops: { zonasLog, sectoresLog, flechasZona, marcos, planLog }, fichas }.
export function globalesDe(ops = {}, unidades = []) {
  const areas = areasDe(ops)
  return {
    ops: {
      zonasLog: lista(ops?.zonasLog),
      sectoresLog: lista(ops?.sectoresLog),
      flechasZona: lista(ops?.flechasZona),
      marcos: lista(ops?.magnitudes).filter(esMarcoDeZona),
      planLog: ops?.planLog,
    },
    fichas: lista(unidades).filter((u) => fichaGlobal(u, areas)),
  }
}
// Junta a G lo de una fase de antes de este cambio (sin `logV`) que G no tiene y que no se borró ahora.
// borrados: { zonas: Set, sectores: Set, fichas: Set, flechas: Set }
function juntar(G, fuente, borrados) {
  const S = globalesDe(fuente?.ops || {}, fuente?.unidades || [])
  const zonasG = new Set(G.ops.zonasLog.map(claveZona))
  const nuevas = S.ops.zonasLog.filter((z) => !zonasG.has(claveZona(z)) && !borrados.zonas.has(claveZona(z)))
  if (nuevas.length) G.ops.zonasLog = [...G.ops.zonasLog, ...nuevas]
  const claves = new Set(G.ops.zonasLog.map((z) => z?.clave).filter(Boolean))
  const abrevs = new Set(G.ops.zonasLog.map((z) => String(z?.zona || '').toUpperCase()))
  const deZonaG = (areaLog) => claves.has(areaLog) || abrevs.has(String(areaLog || '').toUpperCase())
  // Los sectores y los marcos de las áreas que quedaron (no los de un área que ya no está).
  const secG = new Set(G.ops.sectoresLog.map(claveSector))
  const sec = S.ops.sectoresLog.filter((s) => deZonaG(s?.areaLog) && !secG.has(claveSector(s)) && !borrados.sectores.has(claveSector(s)))
  if (sec.length) G.ops.sectoresLog = [...G.ops.sectoresLog, ...sec]
  const conMarco = new Set(G.ops.marcos.map((m) => m.origen))
  const marcos = S.ops.marcos.filter((m) => claves.has(m.origen.slice(5)) && !conMarco.has(m.origen))
  if (marcos.length) G.ops.marcos = [...G.ops.marcos, ...marcos]
  const flG = new Set(G.ops.flechasZona.map(estable))
  const esquemas = new Set(G.ops.zonasLog.map((z) => z?.esquemaDe).filter(Boolean))
  const fl = S.ops.flechasZona.filter((f) => (!f?.esquemaDe || esquemas.has(f.esquemaDe)) && !flG.has(estable(f)) && !borrados.flechas.has(estable(f)))
  if (fl.length) G.ops.flechasZona = [...G.ops.flechasZona, ...fl]
  if (G.ops.planLog === undefined && S.ops.planLog !== undefined) G.ops.planLog = S.ops.planLog
  const areasG = areasDe({ zonasLog: G.ops.zonasLog })
  const idsG = new Set(G.fichas.map((u) => u.id))
  const fichas = S.fichas.filter((u) => !idsG.has(u.id) && !borrados.fichas.has(u.id) && (u.origen === 'plantilla-asdi' ? deZonaG(u.areaLog) : enArea(u, areasG)))
  if (fichas.length) G.fichas = [...G.fichas, ...fichas]
  return G
}
// Pone en una fase lo de todo el ejercicio (G): sus áreas, sectores, flechas, marcos, planLog y fichas del área.
export function conGlobales(fase, G) {
  if (!fase || typeof fase !== 'object') return fase
  const ops = { ...(fase.ops || {}) }
  for (const k of GLOBALES) ops[k] = G.ops[k]
  ops.magnitudes = [...lista(ops.magnitudes).filter((m) => !esMarcoDeZona(m)), ...G.ops.marcos]
  if (G.ops.planLog !== undefined) ops.planLog = G.ops.planLog
  const areasG = areasDe(G.ops)
  const idsG = new Set(G.fichas.map((u) => u.id))
  // Sale de la fase: la copia vieja de cada ficha de G, el Batallón Logístico de antes y toda instalación propia que
  // en esa fase estaba dentro de un área (si no está en G es porque se sacó o se movió afuera).
  const quedan = lista(fase.unidades).filter((u) => !idsG.has(u?.id) && !(esLogistica(u) && (u.origen === 'plantilla-asdi' || enArea(u, areasG))))
  return { ...fase, ops, unidades: [...quedan, ...G.fichas] }
}

// ─── Lo que se hereda hacia adelante ─────────────────────────────────────────────────────────────────────────────
const porLid = (xs) => new Map(lista(xs).filter((x) => x?.lid).map((x) => [x.lid, x]))
const fichasHeredadas = (f, areas) => new Map(lista(f?.unidades).filter((u) => fichaHeredada(u, areas) && u.id != null).map((u) => [u.id, u]))

// Lo que cambió en la fase activa (antes → ahora) pasa a las fases que siguen mientras éstas sigan como estaba.
function propagar(lst, idx, antes, ahora, areas) {
  const out = lst.slice()
  const cambiar = (j, f) => {
    out[j] = f
  }
  for (const k of HEREDADOS) {
    const o = porLid(antes?.ops?.[k])
    const n = porLid(ahora?.ops?.[k])
    for (const lid of new Set([...o.keys(), ...n.keys()])) {
      const viejo = o.get(lid)
      const nuevo = n.get(lid)
      if (viejo && nuevo && igual(viejo, nuevo)) continue
      for (let j = idx + 1; j < out.length; j++) {
        const f = out[j]
        const arr = lista(f?.ops?.[k])
        const i = arr.findIndex((x) => x?.lid === lid)
        let arr2
        if (!viejo) {
          if (i >= 0) break
          arr2 = [...arr, nuevo]
        } else if (i >= 0 && igual(arr[i], viejo)) {
          arr2 = nuevo ? arr.map((x, m) => (m === i ? nuevo : x)) : arr.filter((_, m) => m !== i)
        } else break
        cambiar(j, { ...f, ops: { ...(f.ops || {}), [k]: arr2 } })
      }
    }
  }
  // Las instalaciones de afuera. La que se sacó del área en esta fase es un cambio que pasa hacia adelante (su copia
  // vieja era la del área); la que se metió en un área es de todo el ejercicio (va a todas con conGlobales).
  const todasAntes = new Map(lista(antes?.unidades).filter((u) => esLogistica(u) && u.id != null).map((u) => [u.id, u]))
  const o = fichasHeredadas(antes, areas)
  const n = fichasHeredadas(ahora, areas)
  const globalesAhora = new Set(lista(ahora?.unidades).filter((u) => fichaGlobal(u, areas)).map((u) => u.id))
  for (const id of new Set([...o.keys(), ...n.keys()])) {
    const viejo = todasAntes.get(id)
    const nuevo = n.get(id)
    if (viejo && nuevo && igual(viejo, nuevo)) continue
    if (!nuevo && globalesAhora.has(id)) continue
    for (let j = idx + 1; j < out.length; j++) {
      const f = out[j]
      const us = lista(f?.unidades)
      const i = us.findIndex((u) => u?.id === id)
      let us2
      if (!viejo) {
        if (i >= 0) break
        us2 = [...us, nuevo]
      } else if (i >= 0 && igual(us[i], viejo)) {
        us2 = nuevo ? us.map((u, m) => (m === i ? nuevo : u)) : us.filter((_, m) => m !== i)
      } else break
      cambiar(j, { ...f, unidades: us2 })
    }
  }
  return out
}

// Una fase de antes de este cambio hereda de la anterior lo que le falta (ejes, líneas, instalaciones de afuera).
function heredarFaltante(previa, fase, areas) {
  let f = fase
  for (const k of HEREDADOS) {
    const ya = new Set(lista(f.ops?.[k]).map((x) => x?.lid).filter(Boolean))
    const falta = lista(previa?.ops?.[k]).filter((x) => x?.lid && !ya.has(x.lid))
    if (falta.length) f = { ...f, ops: { ...(f.ops || {}), [k]: [...lista(f.ops?.[k]), ...falta] } }
  }
  const ids = new Set(lista(f.unidades).map((u) => u?.id))
  const falta = lista(previa?.unidades).filter((u) => fichaHeredada(u, areas) && u.id != null && !ids.has(u.id))
  if (falta.length) f = { ...f, unidades: [...lista(f.unidades), ...falta] }
  return f
}

// ─── Lo que llama la Mesa ────────────────────────────────────────────────────────────────────────────────────────
// `fo` (guardar la fase activa): antes = las fases antes de guardar; despues = con la fase activa ya guardada (lo que
// está a la vista); activa = { bando, idx } o null; unidades / ops = lo que está a la vista.
// Lo de todo el ejercicio va a las fases que ya pasaron por acá; lo que se hereda, a las que siguen.
export function alGuardar(antes, despues, { activa = null, unidades = [], ops = {} } = {}) {
  try {
    if (!despues || typeof despues !== 'object') return despues
    let fc = fasesConLids(despues)
    const G = globalesDe(opsConLids(ops), unidades)
    const areas = areasDe(G.ops)
    if (activa && Array.isArray(fc[activa.bando]) && fc[activa.bando][activa.idx]) {
      const viejo = faseConLids(antes?.[activa.bando]?.[activa.idx])
      const ahora = fc[activa.bando][activa.idx]
      fc = { ...fc, [activa.bando]: propagar(fc[activa.bando], activa.idx, viejo, ahora, areas) }
    }
    for (const b of ['propio', 'enemigo']) {
      if (!Array.isArray(fc[b])) continue
      fc = { ...fc, [b]: fc[b].map((f, i) => (f && (f.logV || (activa?.bando === b && activa.idx === i)) ? conGlobales(f, G) : f)) }
    }
    return fc
  } catch (e) {
    try { console.warn('fases-log (alGuardar):', e) } catch {}
    return despues
  }
}

// `Uo` (tocar una fase): guardadas = lo que devolvió `fo` (alGuardar); antes = las fases antes de guardar.
// Pone al día las fases de antes de este cambio (lo de todo el ejercicio se junta con lo que está a la vista y
// hereda lo que les faltaba de la fase anterior) y deja TODAS con lo de todo el ejercicio y marcadas.
export function alCargar(guardadas, antes, { activa = null, unidades = [], ops = {} } = {}) {
  try {
    if (!guardadas || typeof guardadas !== 'object') return guardadas
    let fc = fasesConLids(guardadas)
    const G = globalesDe(opsConLids(ops), unidades)
    // Lo que se sacó en la fase que se deja (estaba al llegar y ya no está) no vuelve desde otra fase.
    const borrados = { zonas: new Set(), sectores: new Set(), fichas: new Set(), flechas: new Set() }
    if (activa) {
      const V = globalesDe(antes?.[activa.bando]?.[activa.idx]?.ops || {}, antes?.[activa.bando]?.[activa.idx]?.unidades || [])
      const tiene = (xs, f) => new Set(xs.map(f))
      const zA = tiene(G.ops.zonasLog, claveZona), sA = tiene(G.ops.sectoresLog, claveSector), fA = tiene(G.ops.flechasZona, estable)
      const idsAhora = new Set(lista(unidades).map((u) => u?.id))
      for (const z of V.ops.zonasLog) if (!zA.has(claveZona(z))) borrados.zonas.add(claveZona(z))
      for (const s of V.ops.sectoresLog) if (!sA.has(claveSector(s))) borrados.sectores.add(claveSector(s))
      for (const f of V.ops.flechasZona) if (!fA.has(estable(f))) borrados.flechas.add(estable(f))
      for (const u of V.fichas) if (!idsAhora.has(u.id)) borrados.fichas.add(u.id)
    }
    for (const b of ['propio', 'enemigo'])
      for (const [i, f] of lista(fc[b]).entries()) if (f && !f.logV && !(activa?.bando === b && activa.idx === i)) juntar(G, f, borrados)
    const areas = areasDe(G.ops)
    for (const b of ['propio', 'enemigo']) {
      if (!Array.isArray(fc[b])) continue
      const out = fc[b].slice()
      for (let i = 1; i < out.length; i++) {
        const f = out[i]
        if (!f || f.logV || (activa?.bando === b && activa.idx === i)) continue
        out[i] = heredarFaltante(out[i - 1], f, areas)
      }
      fc = { ...fc, [b]: out.map((f) => (f && typeof f === 'object' ? { ...conGlobales(f, G), logV: VERSION } : f)) }
    }
    return fc
  } catch (e) {
    try { console.warn('fases-log (alCargar):', e) } catch {}
    return guardadas
  }
}

if (typeof window !== 'undefined') window.SIDFasesLog = { alGuardar, alCargar, globalesDe, VERSION }
