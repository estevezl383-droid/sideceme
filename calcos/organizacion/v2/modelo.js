// F3·P3 — FORMACIÓN INICIAL DE LAS FUERZAS (G-3), en «Desarrollar los cursos de acción».
//
// La hoja se trabaja EN ORDEN, como dice la doctrina (PMTD; «3.- Formación inicial de las
// fuerzas»), y sobre el terreno, como el calco de la Escuela (figura 3 del pedido):
//
//   ① Lo que se considera: la misión reexpresada y la intención del Comandante superior,
//      las avenidas de aproximación y los cursos de acción del enemigo (del más probable
//      al más peligroso) con sus objetivos.
//   ② Las TAREAS TÁCTICAS en la carta (ops.tareas del calco) y a cada una su operación:
//      OD (operación decisiva, el esfuerzo principal, en el punto decisivo) y OC 1, OC 2…
//      (operaciones de configuración, los esfuerzos secundarios); con su «T: …».
//   ③ Para CADA tarea, empezando por la OD, la PROPORCIÓN requerida frente al enemigo
//      ubicado en ese sector → cuántas unidades genéricas hacen falta.
//   ④ Las UNIDADES GENÉRICAS (los triángulos y cuadrados de la Figura 6 del EAA-15-29),
//      dos niveles abajo, de lo que hay: lo que sobra va a una agrupación aparte (la
//      reserva); lo que falta es un requerimiento de recursos adicionales.
//   ⑤ La forma gráfica de la organización (cajas por operación y «bajo control»).
//   ⑥ La Organización de la Tarea (el panel 🧩 de siempre): las agrupaciones salen de
//      acá con su operación, su tarea y sus piezas; ahí se les pone el nombre y el
//      propósito y se llevan al calco.
//
// Dónde se guarda cada cosa:
//   · cada tarea táctica del calco lleva `oi` (operación, «T:», enemigos de su sector,
//     proporción, piezas, relación de comando, dónde va su rótulo en la carta y con qué
//     agrupación se vinculó): es parte del calco y viaja con la tarea;
//   · la reserva (lo que sobra), dónde se dibuja y si la capa se ve: g3.organizacionInicial;
//   · el cuadro de la hoja (lo que va al Word y a la IA): g3.organizacion, renglones.
//
// Sin DOM ni React: se prueba en Node. Los dibujos y los catálogos de la Mesa (las piezas
// de cada unidad, el grupo de cada símbolo, el nombre de cada tarea) llegan en `simb`.

export const ESQUEMA = 'organizacion-inicial-v1'
export const CLAVE_FLUJO = 'organizacionInicial'

// Las mismas operaciones (y los mismos id) que el panel 🧩 Organización de la Tarea.
export const OPERACIONES = [
  { id: 'od', corto: 'OD', nom: 'Operación Decisiva (esfuerzo principal)', titulo: 'OPERACIÓN DECISIVA', color: '#ff5c5c' },
  { id: 'oc1', corto: 'OC 1', nom: 'Operación de Configuración 1 (esfuerzo secundario)', titulo: 'OPERACIÓN DE CONFIGURACIÓN 1', color: '#5c9dff' },
  { id: 'oc2', corto: 'OC 2', nom: 'Operación de Configuración 2 (esfuerzo secundario)', titulo: 'OPERACIÓN DE CONFIGURACIÓN 2', color: '#5c9dff' },
  { id: 'oc3', corto: 'OC 3', nom: 'Operación de Configuración 3 (esfuerzo secundario)', titulo: 'OPERACIÓN DE CONFIGURACIÓN 3', color: '#5c9dff' },
  { id: 'sost', corto: 'SOST', nom: 'Operación de Sostenimiento', titulo: 'OPERACIÓN DE SOSTENIMIENTO', color: '#7dffb0' },
]
export const RESERVA = { id: 'reserva', corto: 'RES', nom: 'Reserva (lo que sobra)', titulo: 'RESERVA', color: '#c69cff' }
export const operacionDe = (id) => OPERACIONES.find((o) => o.id === id) || (id === 'reserva' ? RESERVA : null)
const ordenOp = (id) => {
  const i = OPERACIONES.findIndex((o) => o.id === id)
  return i < 0 ? 99 : i
}

// Proporciones mínimas de planeamiento (amigo : enemigo). Son un PUNTO DE PARTIDA para
// desarrollar los CAP, no se aplican al combate en sí. Persecución, explotación y movimiento
// para hacer contacto no requieren una proporción particular: se puede usar 1:1.
export const PROPORCIONES = [
  { id: '3:1', amigo: 3, enemigo: 1, nom: 'Atacar una posición preparada o fortificada' },
  { id: '2.5:1', amigo: 2.5, enemigo: 1, nom: 'Atacar una posición apresurada' },
  { id: '1:1', amigo: 1, enemigo: 1, nom: 'Contraatacar sobre un flanco · persecución, explotación o movimiento para hacer contacto (sin proporción particular)' },
  { id: '1:2.5', amigo: 1, enemigo: 2.5, nom: 'Defender una posición apresurada' },
  { id: '1:3', amigo: 1, enemigo: 3, nom: 'Defender una posición preparada o fortificada' },
  { id: '1:6', amigo: 1, enemigo: 6, nom: 'Retardar' },
]
export const proporcionDe = (id) => {
  const p = PROPORCIONES.find((x) => x.id === id)
  if (p) return p
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)\s*$/.exec(String(id || ''))
  if (!m) return null
  const a = Number(m[1].replace(',', '.'))
  const e = Number(m[2].replace(',', '.'))
  return a > 0 && e > 0 ? { id: `${m[1]}:${m[2]}`, amigo: a, enemigo: e, nom: 'Proporción escrita por el oficial' } : null
}

// Criterio de la Mesa para PROPONER la proporción de cada tarea (el oficial la cambia).
const OFENSIVAS = ['conquistar', 'destruir', 'derrotar', 'limpiar', 'reducir']
const MOVIMIENTO = ['seguir_asumir', 'seguir_apoyar', 'sobrepasar', 'franquear', 'exfiltrar', 'romper_contacto', 'contrareconocer']
const DESDE_POSICIONES = ['mantener', 'bloquear', 'canalizar', 'contener', 'ocupar', 'asegurar', 'controlar']
export function proporcionSugerida(tarea, tipoOperacion = '') {
  const tipo = String(tipoOperacion || '').toLowerCase()
  const def = tipo.startsWith('defens')
  const retro = tipo.startsWith('retro')
  if (MOVIMIENTO.includes(tarea)) return { id: '1:1', por: 'Es una tarea de movimiento: no requiere una proporción particular (se usa 1:1).' }
  if (retro) return { id: '1:6', por: 'En una operación retrógrada la proporción de referencia es la del retardo (1:6).' }
  if (OFENSIVAS.includes(tarea)) {
    if (tarea === 'destruir' || tarea === 'derrotar') return def ? { id: '1:3', por: 'En la defensa se destruye desde posiciones preparadas (1:3).' } : { id: '3:1', por: 'Se ataca una posición preparada (3:1).' }
    return def ? { id: '1:1', por: 'En la defensa, conquistar o limpiar es un contraataque sobre un flanco (1:1).' } : { id: '3:1', por: 'Se ataca una posición preparada (3:1).' }
  }
  if (DESDE_POSICIONES.includes(tarea)) return def || !tipo ? { id: '1:3', por: 'Se cumple desde posiciones: defender una posición preparada (1:3).' } : { id: '1:1', por: 'En el ataque, mantener u ocupar lo conquistado no requiere una proporción particular (1:1).' }
  // Fuego y efectos sobre el enemigo (atacar con fuego, apoyar por fuego, fijar, desorganizar…).
  return def || !tipo ? { id: '1:3', por: 'Bate al enemigo desde posiciones, sin asaltarlo (1:3).' } : { id: '1:1', por: 'Fija o bate al enemigo sin asaltarlo (1:1).' }
}

// ─── Escalones ───────────────────────────────────────────────────────────────────────
export const ESCALONES = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
const ALIAS = { grupo: 'batallon', escuadron: 'compania', bateria: 'compania', peloton: 'seccion', fraccion: 'seccion', bat: 'batallon', cia: 'compania' }
export const escalonNormal = (e) => {
  const k = String(e || '').toLowerCase()
  return ESCALONES.includes(k) ? k : ALIAS[k] || ''
}
export const nivelDe = (e) => ESCALONES.indexOf(escalonNormal(e))
// Dos niveles abajo (lo mismo que hace la Mesa al disgregar una unidad en piezas).
export const dosAbajo = (e) => {
  const i = nivelDe(e)
  return i < 0 ? 'seccion' : ESCALONES[Math.max(0, i - 2)]
}
export const unoArriba = (e) => {
  const i = nivelDe(e)
  return i < 0 ? 'batallon' : ESCALONES[Math.min(ESCALONES.length - 1, i + 1)]
}
// Cuántas unidades del escalón `generico` hay en una del escalón `escalon` (de a 3 por nivel).
export function equivalentes(escalon, generico) {
  const a = nivelDe(escalon)
  const b = nivelDe(generico)
  if (a < 0 || b < 0) return 1
  return Math.pow(3, a - b)
}
const NOMBRES = {
  equipo: ['equipo', 'equipos', 'Eq.'],
  escuadra: ['escuadra', 'escuadras', 'Esc.'],
  seccion: ['sección', 'secciones', 'Secc.'],
  compania: ['compañía', 'compañías', 'Cía.'],
  batallon: ['batallón', 'batallones', 'Btn.'],
  regimiento: ['regimiento', 'regimientos', 'Rgto.'],
  brigada: ['brigada', 'brigadas', 'Brig.'],
  division: ['división', 'divisiones', 'Div.'],
  cuerpo: ['cuerpo de ejército', 'cuerpos de ejército', 'CE.'],
  ejercito: ['ejército', 'ejércitos', 'Ej.'],
}
export const MARCAS = { equipo: 'Ø', escuadra: '●', seccion: '●●●', compania: 'I', batallon: 'II', regimiento: 'III', brigada: 'X', division: 'XX', cuerpo: 'XXX', ejercito: 'XXXX' }
export const marcaDe = (e) => MARCAS[escalonNormal(e)] || ''
const redondo = (n) => (Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : n.toFixed(1).replace('.', ','))
const MASCULINOS = ['equipo', 'batallon', 'regimiento', 'cuerpo', 'ejercito']
// «2 compañías genéricas», «1 compañía genérica», «3 batallones genéricos».
export function genericas(n, escalon) {
  const m = MASCULINOS.includes(escalonNormal(escalon))
  const uno = Math.abs(n - 1) < 1e-9
  return `${cantidad(n, escalon)} ${m ? (uno ? 'genérico' : 'genéricos') : uno ? 'genérica' : 'genéricas'}`
}
export function cantidad(n, escalon, { corto = false } = {}) {
  const k = NOMBRES[escalonNormal(escalon)] || ['unidad', 'unidades', 'U.']
  if (corto) return `${redondo(n)} ${k[2]}`
  return `${redondo(n)} ${Math.abs(n - 1) < 1e-9 ? k[0] : k[1]}`
}

// ─── Bandos y unidades ───────────────────────────────────────────────────────────────
export const esUnidad = (u) => !!u && (u.tipo || 'unidad') === 'unidad'
export const esEnemiga = (u) => esUnidad(u) && ['enemigo', 'enemigas', 'rojo'].includes(String(u.bando || '').toLowerCase())
export const esPropia = (u) => esUnidad(u) && !esEnemiga(u) && !u.esAgrupacion
export const unidadesEnemigas = (unidades) => (unidades || []).filter((u) => esEnemiga(u) && Number.isFinite(u.lat) && Number.isFinite(u.lng))

// Distancia en metros entre [lng, lat] y [lng, lat].
export function distancia(a, b) {
  if (!a || !b) return Infinity
  const R = 6371000
  const r = Math.PI / 180
  const dLat = (b[1] - a[1]) * r
  const dLng = (b[0] - a[0]) * r
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}
export const fmtDist = (m) => (!Number.isFinite(m) ? '—' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`)

// El «sector» de una tarea, para PROPONER qué enemigo enfrenta: según el tamaño de la tarea.
const RADIO = { seccion: 1500, compania: 3000, batallon: 6000, regimiento: 10000, brigada: 12000, division: 20000, cuerpo: 30000 }
export const radioSector = (escalon) => RADIO[escalonNormal(escalon)] || 8000
export function enemigosCerca(centro, unidades) {
  return unidadesEnemigas(unidades)
    .map((u) => ({ u, d: distancia(centro, [u.lng, u.lat]) }))
    .sort((a, b) => a.d - b.d)
}
// Sólo los que están dentro del sector: si no hay ninguno, no se inventa (el oficial tilda).
export function sugerirEnemigos(tarea, unidades) {
  if (!tarea?.centro) return []
  const radio = radioSector(tarea.escalon)
  return enemigosCerca(tarea.centro, unidades)
    .filter((x) => x.d <= radio)
    .map((x) => x.u.id)
}
export function objetivoCercano(centro, objetivos) {
  let mejor = null
  for (const o of objetivos || []) {
    if (!o?.centro) continue
    const d = distancia(centro, o.centro)
    if (!mejor || d < mejor.d) mejor = { o, d }
  }
  return mejor
}

// ─── Lo que tengo: las piezas (unidades genéricas) de cada unidad propia ────────────
// `simb.piezasDe(u)` → [{ id, de, simbolo, escalon, madre, nom }] (tN de la Mesa).
// `simb.grupoDe(simbolo)` → 'maniobra' | 'apoyo' | 'servicios' | 'aviacion'.
export function piezasPropias(unidades, simb) {
  const out = []
  for (const u of (unidades || []).filter(esPropia)) for (const p of simb.piezasDe(u) || []) out.push({ ...p, grupo: simb.grupoDe(p.simbolo) || 'apoyo' })
  return out
}
export const esManiobra = (p) => p?.grupo === 'maniobra'
// El escalón genérico de la fuerza: el de la mayoría de sus piezas de maniobra.
export function nivelGenerico(piezas) {
  const cuenta = {}
  for (const p of piezas || []) if (esManiobra(p)) cuenta[escalonNormal(p.escalon) || 'compania'] = (cuenta[escalonNormal(p.escalon) || 'compania'] || 0) + 1
  const k = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a] || nivelDe(b) - nivelDe(a))[0]
  if (k) return k
  const otro = (piezas || []).map((p) => escalonNormal(p.escalon)).find(Boolean)
  return otro || 'compania'
}
// Cuánto pesa una pieza en la proporción (sólo las de maniobra, en unidades genéricas).
export const pesoPieza = (p, G) => (esManiobra(p) ? equivalentes(p.escalon, G) : 0)

// ─── El flujo guardado (g3.organizacionInicial) ─────────────────────────────────────
export function flujoNormal(f) {
  const v = f && typeof f === 'object' && !Array.isArray(f) ? f : {}
  const r = v.reserva && typeof v.reserva === 'object' ? v.reserva : {}
  return {
    esquema: ESQUEMA,
    verEnCarta: v.verEnCarta !== false,
    reserva: { piezas: Array.isArray(r.piezas) ? r.piezas.filter((p) => p && p.id != null) : [], pos: Array.isArray(r.pos) && r.pos.length === 2 ? r.pos : null, agId: r.agId || null },
  }
}
export const oiDe = (t) => (t && t.oi && typeof t.oi === 'object' ? t.oi : {})
export const nuevoId = (pre = 'oi') => `${pre}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// Las tareas del calco que entran en la organización (con operación), en el orden de la
// doctrina: la OD primero y después las OC.
export function tareasConOperacion(ops) {
  return (ops?.tareas || [])
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t?.centro && operacionDe(oiDe(t).operacion) && oiDe(t).operacion !== 'reserva')
    .sort((a, b) => ordenOp(oiDe(a.t).operacion) - ordenOp(oiDe(b.t).operacion) || a.i - b.i)
}
// La próxima operación libre para una tarea nueva: la OD si no hay, después OC 1, OC 2…
export function proximaOperacion(ops) {
  const usadas = new Set((ops?.tareas || []).map((t) => oiDe(t).operacion).filter(Boolean))
  for (const o of OPERACIONES) if (o.id !== 'sost' && !usadas.has(o.id)) return o.id
  return 'oc3'
}

// ─── El enemigo de cada sector, la proporción y lo que se requiere ──────────────────
export function enemigoDelSector(tarea, unidades, G, simb) {
  const oi = oiDe(tarea)
  const ids = new Set(Array.isArray(oi.enemigos) ? oi.enemigos : [])
  const elegidas = unidadesEnemigas(unidades).filter((u) => ids.has(u.id))
  const maniobra = []
  const apoyo = []
  let gen = 0
  for (const u of elegidas) {
    const grupo = simb.grupoDe((simb.piezasDe(u)[0] || {}).simbolo) || (simb.grupoUnidad ? simb.grupoUnidad(u) : 'maniobra')
    if (grupo === 'maniobra') {
      maniobra.push(u)
      gen += equivalentes(u.escalon, G)
    } else apoyo.push(u)
  }
  const man = oi.enemigoManual
  if (man && Number(man.n) > 0) gen += Number(man.n) * equivalentes(man.escalon || G, G)
  return { gen, maniobra, apoyo, manual: man && Number(man.n) > 0 ? { n: Number(man.n), escalon: man.escalon || G } : null }
}
export function requeridas(enemigoGen, prop) {
  if (!prop || !(enemigoGen > 0)) return 0
  return Math.ceil((enemigoGen * prop.amigo) / prop.enemigo - 1e-9)
}

// ─── El balance: cada tarea, lo libre, la reserva, lo que sobra y lo que falta ──────
export function balance({ ops, g3, unidades }, simb) {
  const flujo = flujoNormal(g3?.[CLAVE_FLUJO])
  const piezas = piezasPropias(unidades, simb)
  const porId = new Map(piezas.map((p) => [p.id, p]))
  const G = nivelGenerico(piezas)
  const tipoOp = ops?.areaOps?.tipo || ''
  const usadas = new Set()
  const perdidas = []
  const vigentes = (lista) => {
    const out = []
    for (const p of lista || []) {
      if (!p || p.id == null || usadas.has(p.id)) continue
      const v = porId.get(p.id)
      if (!v) {
        perdidas.push(p)
        continue
      }
      usadas.add(p.id)
      out.push(v)
    }
    return out
  }
  const tareas = tareasConOperacion(ops).map(({ t, i }) => {
    const oi = oiDe(t)
    const op = operacionDe(oi.operacion)
    const sug = proporcionSugerida(t.tarea, tipoOp)
    const prop = proporcionDe(oi.proporcion) || proporcionDe(sug.id)
    const enemigo = enemigoDelSector(t, unidades, G, simb)
    const req = requeridas(enemigo.gen, prop)
    const asignadas = vigentes(oi.piezas)
    const disp = asignadas.reduce((s, p) => s + pesoPieza(p, G), 0)
    const nivel = !(enemigo.gen > 0) ? 'sin-enemigo' : disp + 1e-9 >= req ? (disp > req + 1e-9 ? 'sobra' : 'ok') : 'falta'
    return { t, i, oi, op, prop, propSugerida: sug, enemigo, requeridas: req, piezas: asignadas, dispuestas: disp, falta: Math.max(0, req - disp), sobra: Math.max(0, disp - req), nivel }
  })
  const reserva = vigentes(flujo.reserva.piezas)
  const libres = piezas.filter((p) => !usadas.has(p.id))
  const totalManiobra = piezas.reduce((s, p) => s + pesoPieza(p, G), 0)
  const totalRequerido = tareas.reduce((s, x) => s + x.requeridas, 0)
  const libresManiobra = libres.filter(esManiobra)
  return {
    G,
    agrupacionEscalon: unoArriba(G),
    tipoOp,
    flujo,
    piezas,
    tareas,
    reserva,
    libres,
    libresManiobra,
    perdidas,
    totalManiobra,
    totalRequerido,
    // Doctrina: si lo dispuesto es menos que lo disponible, lo demás va a una agrupación
    // aparte; si es más, la deficiencia es un posible requerimiento de recursos adicionales.
    deficiencia: Math.max(0, totalRequerido - totalManiobra),
    sobrante: Math.max(0, totalManiobra - totalRequerido),
  }
}

// «⚡ Proponer el reparto»: completa cada tarea (OD primero) con piezas de maniobra libres
// hasta lo requerido, tratando de no partir las unidades; lo que sobra va a la reserva.
// No saca nada de lo que ya está repartido. Devuelve { tareas: { [oi.id]: piezas }, reserva }.
export function proponerReparto(bal, { aReserva = true } = {}) {
  const libres = bal.libresManiobra.slice()
  const out = {}
  for (const x of bal.tareas) {
    const lista = x.piezas.slice()
    let falta = x.requeridas - x.dispuestas
    while (falta > 1e-9 && libres.length) {
      const madres = new Set(lista.map((p) => p.de))
      const cuenta = {}
      for (const p of libres) cuenta[p.de] = (cuenta[p.de] || 0) + 1
      let k = libres.findIndex((p) => madres.has(p.de))
      if (k < 0) {
        const mayor = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a])[0]
        k = libres.findIndex((p) => String(p.de) === mayor)
      }
      const [p] = libres.splice(Math.max(0, k), 1)
      lista.push(p)
      falta -= pesoPieza(p, bal.G)
    }
    out[x.oi.id] = lista
  }
  return { tareas: out, reserva: aReserva ? [...bal.reserva, ...libres] : bal.reserva.slice() }
}

// Mover una pieza: a una tarea (por oi.id), a la reserva ('reserva') o dejarla libre (null).
// Primero se saca de todos lados: una pieza está en un solo lugar.
export function moverPieza({ ops, flujo }, pieza, destino) {
  const f = flujoNormal(flujo)
  const sin = (l) => (l || []).filter((p) => p && p.id !== pieza.id)
  const tareas = (ops?.tareas || []).map((t) => {
    const oi = oiDe(t)
    if (!oi.id) return t
    let piezas = sin(oi.piezas)
    if (destino === oi.id) piezas = [...piezas, pieza]
    return piezas.length === (oi.piezas || []).length && destino !== oi.id ? t : { ...t, oi: { ...oi, piezas } }
  })
  let res = sin(f.reserva.piezas)
  if (destino === 'reserva') res = [...res, pieza]
  return { ops: { ...ops, tareas }, flujo: { ...f, reserva: { ...f.reserva, piezas: res } } }
}

// ─── Textos ──────────────────────────────────────────────────────────────────────────
const unirNombres = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)
export function textoSugerido(tarea, { unidades, objetivos }, simb) {
  const nom = simb.nombreTarea(tarea?.tarea) || 'Tarea'
  const ids = new Set(oiDe(tarea).enemigos || [])
  const en = unidadesEnemigas(unidades).filter((u) => ids.has(u.id)).map((u) => simb.rotulo(u))
  const ob = tarea?.centro ? objetivoCercano(tarea.centro, objetivos) : null
  const donde = ob && ob.d <= radioSector(tarea.escalon) * 1.5 && ob.o.etiqueta ? ` en el objetivo «${ob.o.etiqueta}»` : ''
  return `${nom}${en.length ? ` a ${unirNombres(en)}` : ''}${donde}`
}
export function resumenPiezas(piezas, G, simb) {
  const cuenta = new Map()
  for (const p of piezas || []) {
    const k = simb.cortoDe(p.simbolo) || 'U'
    const e = escalonNormal(p.escalon) || G
    const clave = `${k}|${e}`
    cuenta.set(clave, (cuenta.get(clave) || 0) + 1)
  }
  return [...cuenta.entries()].map(([k, n]) => {
    const [c, e] = k.split('|')
    return `${cantidad(n, e, { corto: true })} ${c}`
  })
}
const descEnemigo = (x, G, simb) => {
  const partes = x.enemigo.maniobra.map((u) => simb.rotulo(u))
  if (x.enemigo.manual) partes.push(cantidad(x.enemigo.manual.n, x.enemigo.manual.escalon))
  if (!partes.length) return 'Sin enemigo ubicado en su sector.'
  return `${unirNombres(partes)} (≈ ${genericas(x.enemigo.gen, G)})${x.enemigo.apoyo.length ? `; con el apoyo de ${unirNombres(x.enemigo.apoyo.map((u) => simb.rotulo(u)))}` : ''}.`
}

// ─── El cuadro de la hoja (lo que va al Word y a la IA) ─────────────────────────────
export const COLUMNAS = ['Operación', 'Agrupación / unidad genérica', 'Tarea que cumple', 'Enemigo en su sector', 'Proporción requerida frente al enemigo en su sector', 'Relación de comando']
export const RELACIONES = ['Orgánica', 'Agregada (refuerzo)', 'Control operacional', 'Apoyo directo', 'Apoyo general']
export function filasCuadro({ ops, g3, unidades }, simb) {
  const b = balance({ ops, g3, unidades }, simb)
  // Sin tareas con operación ni reserva no hay organización que escribir (la Mesa avisa).
  if (!b.tareas.length && !b.reserva.length) return []
  const G = b.G
  const filas = []
  for (const x of b.tareas) {
    const man = x.piezas.filter(esManiobra)
    const apo = x.piezas.filter((p) => !esManiobra(p))
    const texto = String(x.oi.texto || '').trim() || textoSugerido(x.t, { unidades, objetivos: ops?.objetivos }, simb)
    filas.push({
      Operación: `${x.op.corto} — ${x.op.nom}`,
      'Agrupación / unidad genérica': man.length || apo.length
        ? [man.length ? `${genericas(x.dispuestas, G)} de maniobra (${resumenPiezas(man, G, simb).join(', ')})` : 'Sin unidades de maniobra', apo.length ? `con ${resumenPiezas(apo, G, simb).join(', ')}` : ''].filter(Boolean).join(' ')
        : 'Sin unidades dispuestas todavía.',
      'Tarea que cumple': `${simb.nombreTarea(x.t.tarea)} — T: ${texto}`,
      'Enemigo en su sector': descEnemigo(x, G, simb),
      'Proporción requerida frente al enemigo en su sector':
        x.nivel === 'sin-enemigo'
          ? `${x.prop.id} — sin enemigo en el sector: la proporción no se aplica.`
          : `${x.prop.id} (${x.prop.nom.split(' · ')[0].toLowerCase()}) → ${x.requeridas === 1 ? 'se requiere' : 'se requieren'} ${cantidad(x.requeridas, G)}; dispuestas ${redondo(x.dispuestas)}${x.falta ? ` — FALTAN ${redondo(x.falta)}` : x.sobra ? ` — sobran ${redondo(x.sobra)}` : ' ✓'}.`,
      'Relación de comando': x.oi.relacion || 'Orgánica',
    })
  }
  if (b.reserva.length) {
    const peso = b.reserva.reduce((s, p) => s + pesoPieza(p, G), 0)
    filas.push({
      Operación: `${RESERVA.corto} — Agrupación aparte (reserva)`,
      'Agrupación / unidad genérica': `${peso ? `${genericas(peso, G)} de maniobra` : 'Piezas'} (${resumenPiezas(b.reserva, G, simb).join(', ')})`,
      'Tarea que cumple': 'Lo que sobra después de cubrir las tareas: se usa al desarrollar el esquema de maniobra.',
      'Enemigo en su sector': '—',
      'Proporción requerida frente al enemigo en su sector': '—',
      'Relación de comando': 'Orgánica',
    })
  }
  const bajo = bajoControl(b, unidades, simb)
  if (bajo.length)
    filas.push({
      Operación: 'Bajo control del comando',
      'Agrupación / unidad genérica': bajo.map((c) => (c.entera ? c.nombre : `${c.nombre} (resto: ${resumenPiezas(c.piezas, G, simb).join(', ')})`)).join(' · '),
      'Tarea que cumple': 'Multiplicadores de combate y apoyos que no se reparten todavía.',
      'Enemigo en su sector': '—',
      'Proporción requerida frente al enemigo en su sector': '—',
      'Relación de comando': 'Orgánica',
    })
  if (b.deficiencia > 0)
    filas.push({
      Operación: 'DEFICIENCIA',
      'Agrupación / unidad genérica': `Faltan ${genericas(b.deficiencia, G)} de maniobra (requeridas ${redondo(b.totalRequerido)}, disponibles ${redondo(b.totalManiobra)}).`,
      'Tarea que cumple': 'Posible requerimiento de recursos adicionales al escalón superior.',
      'Enemigo en su sector': '—',
      'Proporción requerida frente al enemigo en su sector': '—',
      'Relación de comando': '—',
    })
  return filas
}

// Las unidades (o lo que queda de ellas) que no se repartieron: quedan bajo control.
export function bajoControl(bal, unidades, simb) {
  const libres = new Set(bal.libres.map((p) => p.id))
  const out = []
  for (const u of (unidades || []).filter(esPropia)) {
    const todas = simb.piezasDe(u) || []
    if (!todas.length) continue
    const resto = todas.filter((p) => libres.has(p.id)).map((p) => ({ ...p, grupo: simb.grupoDe(p.simbolo) || 'apoyo' }))
    if (!resto.length) continue
    // Las piezas de maniobra libres no están «bajo control»: falta repartirlas (o mandarlas a la reserva).
    const sinManiobra = resto.filter((p) => !esManiobra(p))
    const entera = resto.length === todas.length && !resto.some(esManiobra)
    if (!sinManiobra.length) continue
    out.push({ unidad: u, nombre: simb.rotulo(u), escalon: escalonNormal(u.escalon) || u.escalon || '', simbolo: todas[0].simbolo, entera, piezas: sinManiobra })
  }
  return out
}

// ─── La forma gráfica (las cajas por operación, como el ejemplo de la Escuela) ──────
export function formaGrafica(bal, { unidades, orgTarea }, simb) {
  const nombreAg = (agId) => String(((orgTarea || []).find((a) => a.id === agId) || {}).nombre || '').trim()
  const cajas = bal.tareas.map((x) => ({
    clave: x.oi.id,
    titulo: x.op.titulo,
    corto: x.op.corto,
    color: x.op.color,
    escalon: bal.agrupacionEscalon,
    nombre: nombreAg(x.oi.agId),
    tarea: simb.nombreTarea(x.t.tarea),
    piezas: [...x.piezas.filter(esManiobra), ...x.piezas.filter((p) => !esManiobra(p))],
  }))
  const bajo = []
  if (bal.reserva.length) bajo.push({ clave: 'reserva', titulo: RESERVA.titulo, corto: RESERVA.corto, color: RESERVA.color, escalon: bal.agrupacionEscalon, nombre: nombreAg(bal.flujo.reserva.agId) || 'RESERVA', piezas: bal.reserva })
  for (const c of bajoControl(bal, unidades, simb)) bajo.push({ clave: `bc-${c.unidad.id}`, titulo: '', corto: '', color: '#9fb0c8', escalon: c.entera ? c.escalon : '', nombre: c.nombre, simbolo: c.entera ? c.simbolo : null, piezas: c.entera ? [] : c.piezas })
  return { cajas, bajo }
}

// ─── De la F3·P3 a la Organización de la Tarea (el panel 🧩) ────────────────────────
// Cada tarea con operación es una agrupación (la que ya estaba vinculada, o una de la
// misma operación que nadie usa, o una nueva); la reserva, otra. Se respeta el nombre, el
// propósito y si es FT; la operación, la tarea y las piezas salen de acá. Las piezas que
// van a una agrupación se sacan de las demás (un elemento pertenece a una sola).
export function sincronizarOrganizacion({ ops, flujo, orgTarea }, bal) {
  const f = flujoNormal(flujo)
  let org = (orgTarea || []).map((a) => ({ ...a }))
  const vinculos = {}
  const tomadas = new Set()
  const nuevas = []
  const actualizadas = []
  const enlazar = (agIdPrevio, operacion, datos) => {
    let ag = agIdPrevio ? org.find((a) => a.id === agIdPrevio) : null
    if (!ag) ag = org.find((a) => a.operacion === operacion && !tomadas.has(a.id) && !Object.values(vinculos).includes(a.id) && !esVinculada(a.id))
    if (ag) {
      Object.assign(ag, datos)
      actualizadas.push(ag.id)
    } else {
      ag = { id: nuevoId('ag-oi'), nombre: '', escalon: bal.agrupacionEscalon, proposito: '', ft: false, ...datos }
      org.push(ag)
      nuevas.push(ag.id)
    }
    tomadas.add(ag.id)
    return ag.id
  }
  // Las agrupaciones que otra tarea de la hoja ya tiene vinculadas no se reusan.
  const vinculadasEnOps = new Set((ops?.tareas || []).map((t) => oiDe(t).agId).filter(Boolean))
  const esVinculada = (id) => vinculadasEnOps.has(id) || id === f.reserva.agId
  for (const x of bal.tareas) vinculos[x.oi.id] = enlazar(x.oi.agId, x.op.id, { operacion: x.op.id, tarea: x.t.tarea, piezas: x.piezas.map(sinGrupo) })
  let reservaAgId = f.reserva.agId
  if (bal.reserva.length) reservaAgId = enlazar(f.reserva.agId, 'reserva', { operacion: 'reserva', piezas: bal.reserva.map(sinGrupo) })
  // Un elemento pertenece a una sola organización.
  const propias = new Map()
  for (const a of org) if (tomadas.has(a.id)) for (const p of a.piezas || []) propias.set(p.id, a.id)
  org = org.map((a) => (tomadas.has(a.id) ? a : { ...a, piezas: (a.piezas || []).filter((p) => !p || !propias.has(p.id)) }))
  return { orgTarea: org, vinculos, reservaAgId, nuevas, actualizadas }
}
const sinGrupo = (p) => {
  const { grupo, ...resto } = p || {}
  return resto
}

// Las fichas de agrupación ya llevadas al calco se actualizan con lo nuevo (así no quedan
// con las piezas de antes).
export function actualizarFichas(unidades, orgTarea) {
  const porId = new Map((orgTarea || []).map((a) => [a.id, a]))
  let cambio = false
  const out = (unidades || []).map((u) => {
    const a = u && u.esAgrupacion && porId.get(u.agId)
    if (!a || !a.consolidada) return u
    cambio = true
    return { ...u, piezasAg: a.piezas, tareaAg: a.tarea, operacionAg: a.operacion }
  })
  return cambio ? out : unidades
}

// «⬅️ Partir de lo que ya armé»: las agrupaciones de la Organización de la Tarea que tienen
// operación y no están en ninguna tarea de la carta pasan a ser tareas tácticas (en su
// ficha del calco si ya se llevó, o junto al objetivo enemigo más cercano / el centro de la
// vista) para arrastrarlas a su lugar. La de reserva pasa a la reserva.
export function desdeOrganizacion({ ops, flujo, orgTarea, unidades }, { centro, G } = {}) {
  const f = flujoNormal(flujo)
  const vinculadas = new Set((ops?.tareas || []).map((t) => oiDe(t).agId).filter(Boolean))
  const nuevas = []
  let reserva = f.reserva
  let n = 0
  for (const a of orgTarea || []) {
    if (!a || vinculadas.has(a.id)) continue
    if (a.operacion === 'reserva') {
      if (!reserva.agId) reserva = { ...reserva, agId: a.id, piezas: [...reserva.piezas, ...(a.piezas || []).filter((p) => !reserva.piezas.some((q) => q.id === p.id))] }
      continue
    }
    if (!OPERACIONES.some((o) => o.id === a.operacion)) continue
    const ficha = (unidades || []).find((u) => u && u.esAgrupacion && u.agId === a.id && Number.isFinite(u.lat))
    const base = ficha ? [ficha.lng, ficha.lat] : centro || [0, 0]
    const desp = ficha ? 0 : n * 0.03
    n++
    nuevas.push({
      centro: [Math.round((base[0] + desp) * 1e6) / 1e6, Math.round((base[1] - (ficha ? 0.01 : 0)) * 1e6) / 1e6],
      tarea: a.tarea || 'fijar',
      escalon: escalonNormal(a.escalon) || unoArriba(G || 'compania'),
      rot: 0,
      escala: 1,
      oi: { id: nuevoId(), operacion: a.operacion, agId: a.id, piezas: (a.piezas || []).slice(), texto: '', enemigos: [] },
    })
  }
  return { tareas: nuevas, reserva }
}

// Revisión de lo que falta, en el orden de los pasos.
export function revisar(bal, { picb, ops, cmoc, g3, ordenSup }) {
  const avisos = []
  const g2 = resumenG2(picb)
  if (!g2.probable) avisos.push({ paso: 1, txt: 'El G-2 todavía no marcó el CAE MÁS PROBABLE (H.T. 18).' })
  if (!(ops?.objetivos || []).length) avisos.push({ paso: 1, txt: 'No hay objetivos del enemigo en el calco (H.T. 16).' })
  if (!avenidas(cmoc).total) avisos.push({ paso: 1, txt: 'No hay avenidas de aproximación en el calco.' })
  if (!misionReexpresada(g3, ordenSup)) avisos.push({ paso: 1, txt: 'Falta la misión reexpresada (F2·P12).' })
  if (!bal.tareas.length) avisos.push({ paso: 2, txt: 'Ninguna tarea táctica de la carta tiene operación (OD / OC).' })
  else if (!bal.tareas.some((x) => x.op.id === 'od')) avisos.push({ paso: 2, txt: 'Falta la OPERACIÓN DECISIVA: es la primera que se dispone, en el punto decisivo.' })
  for (const x of bal.tareas) if (x.nivel === 'sin-enemigo') avisos.push({ paso: 3, txt: `${x.op.corto}: sin enemigo en su sector (la proporción no se puede calcular).` })
  for (const x of bal.tareas) if (x.nivel === 'falta') avisos.push({ paso: 4, txt: `${x.op.corto}: faltan ${genericas(x.falta, bal.G)} para llegar a ${x.prop.id}.` })
  if (bal.libresManiobra.length) avisos.push({ paso: 4, txt: `Quedan ${bal.libresManiobra.length} pieza(s) de maniobra sin repartir: van a la reserva (agrupación aparte).` })
  if (bal.deficiencia > 0) avisos.push({ paso: 4, txt: `Lo requerido supera lo disponible en ${redondo(bal.deficiencia)}: es un posible requerimiento de recursos adicionales.` })
  return avisos
}

// ─── Lo que se considera (paso ①) ────────────────────────────────────────────────────
export function resumenG2(picb) {
  const marca = (picb && picb.ht18 && picb.ht18._marca) || {}
  const probable = Object.keys(marca).find((k) => marca[k] === 'MÁS PROBABLE') || null
  const peligroso = Object.keys(marca).find((k) => marca[k] === 'MÁS PELIGROSO') || null
  const cae = (picb && picb.cae) || {}
  return { probable, peligroso, mismo: !!probable && probable === peligroso, mision: cae['Misión'] || '', maniobra: cae.Maniobra || '', estadoFinal: cae['Estado final deseado'] || '' }
}
export function avenidas(cmoc) {
  const lista = (cmoc && cmoc.avenidas) || []
  const enemigas = lista.filter((a) => /enem|rojo/i.test(String(a?.bando || ''))).length
  return { total: lista.length, enemigas, propias: lista.length - enemigas }
}
export function misionReexpresada(g3, ordenSup) {
  const m = (g3 && g3.mision) || {}
  return String(m['ENUNCIADO COMPLETO DE LA MISIÓN'] || '').trim() || String((ordenSup && ordenSup.mision) || '').trim()
}
