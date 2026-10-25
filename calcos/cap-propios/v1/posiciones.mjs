// 📍 Dónde va cada unidad en cada fase de un CAP propio, calculado con lo que YA está en la carta. Sin dependencias del
// compilado: lo usan el panel (al armar las fases y al poner la respuesta de la IA) y las pruebas.
//
// Sergio, 24-10-2026, tocando FASE I… V de cada CAP: «no se ve ninguna diferencia ni el cambio de posición de las
// fichas de azul… se supone que en la fase I todos están donde está el CE y de ahí se disgregan». Y después, con las
// agrupaciones OD, OC 1, OC 2 quietas en sus puestos: «en la fase I deberían todas las unidades estar con el cuerpo de
// ejército… en la fase dos deberían desplazarse hacia los lugares donde hay trabajos de organización del terreno (el
// plan de barreras), porque quienes hacen esos trabajos son ellos dentro de su sector asignado… después en la fase 3
// la organización donde están ya sus posiciones… debes mover TODAS las fichas».
//
// Se mueven TODAS las fichas propias de unidad (las del CAP, las agrupaciones de la organización para el combate y las
// demás), salvo la del propio CE (la referencia). Cada fase con su dispositivo:
//   · FASE I (concentración): todas alrededor del Puesto Comando del CE (o de su ficha);
//   · FASE II (desplazamiento): cada una a los trabajos del plan de barreras de SU sector (los obstáculos de la carta
//     más cerca de su puesto que la LÍM. entre sectores no separa); la que no tiene trabajos, a mitad de camino;
//   · FASE III (ocupación / organización): cada una en su puesto. El puesto es donde la puso el oficial (la ficha ya
//     desplegada, o lo que quedó en la FASE III del CAP); si la ficha todavía está junto al CE, la Mesa la lleva a su
//     lugar con lo que dejó la F3·P4: las marcas «ESFUERZO PRINCIPAL · …», «ESFUERZO SECUNDARIO · …» y «RES · …» o
//     donde su avenida corta la LPR. Lo que depende de la forma (la fuerza de retardo sobre la LDE-1, la masa de
//     contraataque oculta en la zona de reserva) lo pone siempre la Mesa;
//   · FASE IV y V según la forma: en la defensa de área, la reserva contraataca por el EJE CA (o hacia donde el
//     esfuerzo principal corta la LPR); en la defensa móvil, la fuerza de retardo va de la LDE-1 a la LPR y la masa
//     contraataca en la zona de destrucción (entre la LDE-1 y la LPR, sobre la avenida principal).
// Las agrupaciones (OD, OC 1, OC 2, RES…) hacen lo de la unidad del CAP de la que salen sus piezas; si no, lo de su
// operación: la OD, el esfuerzo principal; las OC, los otros esfuerzos; la RES, la reserva.
// Lo que no se puede calcular (sin LPR, sin avenidas) queda en su puesto: la Mesa no inventa lugares sin base.
//
// Sergio, 25-10-2026: «las tareas tácticas deben aparecer con la unidad… esas deben estar con su unidad en este punto»
// y «cada fase tiene una tarea táctica diferente; las que se ven sólo en la FASE III». La unidad que cumple una tarea
// táctica de la carta (la de su agrupación de la F3·P3, o la de sus piezas) está en la organización (FASE III) JUNTO A
// SU TAREA (tareas-fase.mjs); salvo la que la forma pone en otro lado (el retardo sobre la LDE-1, la masa oculta). Y en
// cada fase, la unidad lleva la tarea de su rol en esa fase (r.tareasFase de proponer.mjs: en la defensa de área, la
// FASE IV «destruir» el esfuerzo principal, «fijar» el secundario; la FASE V «destruir» la reserva, «mantener» los
// demás…), distinta de la que tenía en la fase anterior, con su símbolo pegado a la ficha (`tareaSimbolo`, como en las
// fases del enemigo): la cumple su agrupación si la tiene (la OD, la OC…), si no la unidad del CAP.
import * as G from '../../concepto-operacion/v1/geo.mjs'
import { tareasDeLaCarta, duenoDeTarea, ordenTareas, juntoA, CERCA } from './tareas-fase.mjs?v=iti20261025'

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
const esEnemiga = (u) => /^enemig/i.test(String(u?.bando || ''))
const pos = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
const r6 = (p) => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6]
const medio = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const ESC = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
const rango = (e) => ESC.indexOf(String(e || ''))

// La fase de la ocupación y organización (FASE III): ahí está cada unidad en su puesto.
export const FASE_ORG = 2
// A más de esto del PC, la ficha ya está desplegada (en la FASE I se concentran a 3-5 km).
const DESPLEGADA_KM = 6

// Lo que hay en la carta para ubicar las fases.
export function referencias({ unidades = [], ops = {}, marcas = [], A = null } = {}) {
  const limites = (ops?.limites || []).filter((l) => (l?.coords || []).filter(G.valido).length >= 2)
  const porNombre = (re) => limites.find((l) => re.test(norm(l.nombre)))?.coords || null
  const lpr = limites.find((l) => l?.co?.rol === 'lpr')?.coords || porNombre(/\bLPR\b|\bLF\b/)
  const lde = porNombre(/\bLDE\s*-?\s*1\b/) || porNombre(/\bLDE\b|\bLCAF\b/)
  const ejeCA = limites.find((l) => l?.co?.rol === 'eje-ca')?.coords || porNombre(/\bEJE\s*CA\b/)
  // Las LÍM. entre sectores («LÍM. DIV MEC-2 / DIV-1»): un trabajo del otro lado es del sector vecino.
  const sectores = limites.filter((l) => l?.co?.rol === 'limite-sector' || /\bLIM(ITE)?\b[^/]*\//.test(norm(l.nombre))).map((l) => l.coords.filter(G.valido))
  const ms = (marcas || []).filter((m) => G.valido(m?.centro))
  const marca = (f) => ms.find(f) || null
  const rojas = (unidades || []).filter((u) => esEnemiga(u) && pos(u)).map(pos)
  const enemigo = G.centroide(rojas)
  // El PC: la ficha del Puesto Comando de la unidad propia, o la ficha de la unidad propia, o el centro de las propias.
  const nomPropia = norm(A?.propia || '')
  const propias = (unidades || []).filter((u) => u && !esEnemiga(u) && u.deFaseEnemiga == null && pos(u))
  const pc =
    propias.find((u) => u.tipo === 'pc' && nomPropia && norm(u.designacion).includes(nomPropia)) ||
    propias.find((u) => (u.tipo || 'unidad') === 'unidad' && nomPropia && norm(u.designacion) === nomPropia) ||
    propias.find((u) => u.tipo === 'pc')
  const centroPropias = G.centroide((A?.maniobra || []).map(pos).filter(Boolean)) || G.centroide(propias.map(pos))
  return {
    lpr, lde, ejeCA, enemigo, sectores,
    pc: pc ? pos(pc) : centroPropias,
    pcId: pc?.id ?? null,
    principal: marca((m) => m.tipo === 'esfuerzo' && m.clase === 'principal'),
    secundarios: ms.filter((m) => m.tipo === 'esfuerzo' && m.clase !== 'principal'),
    reserva: marca((m) => m.tipo === 'reserva'),
  }
}

// Los trabajos del plan de barreras (los obstáculos del calco): dónde está cada uno.
export const trabajos = (ops) =>
  (ops?.obstaculos || []).map((o) => (G.valido(o?.centro) ? [+o.centro[0], +o.centro[1]] : G.centroide((o?.coords || []).filter(G.valido)))).filter(Boolean).map(r6)

// Las fichas propias que se mueven en las fases: las de unidad (con las agrupaciones), menos la del propio CE y las de
// su escalón o más arriba.
export function movibles(unidades = [], A = null, R = null) {
  const nomPropia = norm(A?.propia || '')
  const rProp = rango(A?.escPropio)
  return (unidades || []).filter(
    (u) =>
      u && !esEnemiga(u) && u.deFaseEnemiga == null && (u.tipo || 'unidad') === 'unidad' && pos(u) &&
      u.id !== R?.pcId && !(nomPropia && norm(u.designacion) === nomPropia) && !(rProp >= 0 && rango(u.escalon) >= rProp),
  )
}

// El rol de una agrupación (OD, OC 1…) en este CAP: el de la unidad de la que salen sus piezas; si no, el de su operación.
function rolDeAgrupacion(u, roles) {
  const cuenta = new Map()
  for (const p of u?.piezasAg || []) {
    const r = roles.find((x) => x.ids.includes(p?.de) || (norm(p?.madre) && x.unidades.some((y) => norm(y.nom) === norm(p.madre))))
    if (r) cuenta.set(r, (cuenta.get(r) || 0) + 1)
  }
  if (cuenta.size) return [...cuenta].sort((a, b) => b[1] - a[1])[0][0]
  const op = String(u?.operacionAg || '')
  const deManiobra = roles.filter((r) => !/APOYO|INGENIEROS/.test(norm(r.rol)))
  if (op === 'od') return roles.find((r) => r.principal) || deManiobra[0] || null
  if (/^oc\d/.test(op)) {
    const otros = deManiobra.filter((r) => !r.principal && !/RESERVA|MASA/.test(norm(r.rol)))
    return otros.length ? otros[(Number(op.slice(2)) - 1) % otros.length] : null
  }
  if (op === 'reserva') return roles.find((r) => /RESERVA/.test(norm(r.rol))) || roles.find((r) => /MASA/.test(norm(r.rol))) || { rol: 'Reserva', tarea: '', ids: [], unidades: [] }
  return null
}

// El punto de la LPR sobre una avenida (su cruce, o el punto de la LPR más cercano a la avenida), corrido `atras` km
// hacia el lado propio (el contrario al enemigo).
function sobreLPR(R, av, atras = 3) {
  if (!R.lpr) return null
  let p = av ? G.crucePolilineas(av.coords, R.lpr) : null
  if (!p && av) p = G.masCercano(R.lpr, G.puntoEn(av.coords, 0.5))?.p || null
  if (!p) p = G.puntoEn(R.lpr, 0.5)
  if (!p) return null
  if (R.enemigo && atras) p = G.desplazar(p, atras, (G.rumbo(R.enemigo, p) + 360) % 360)
  return p
}
const sobreLDE = (R, av) => (R.lde && av ? G.crucePolilineas(av.coords, R.lde) || G.masCercano(R.lde, G.puntoEn(av.coords, 0.5))?.p || null : null)
// Una marca de la F3·P4 que nombra a la unidad («ESFUERZO PRINCIPAL · DIV MEC-2»).
const marcaDe = (ms, u) => {
  const n = norm(u?.designacion)
  return (n && ms.find((m) => norm(m.texto).includes(n))) || null
}
// Los roles cuyo lugar depende de la forma (lo pone siempre la Mesa, no el puesto de la ficha).
const segunForma = (rol) => /RETARDO|COBERTURA|MASA/.test(rol)

// Las posiciones de un CAP: [fase0, fase1, …] cada una { id: [lng, lat] }, `.puestos` { id: [lng, lat] } (el puesto
// de cada ficha, que se guarda en la ficha para la próxima vez) y `.simbolos` [{ id: { tarea, texto } }, …] (la tarea
// táctica de cada unidad en cada fase, que va pegada a su ficha). cap: el de proponer.armarCAP. previas: las fases que
// ya tiene este CAP (su FASE III dice dónde está el puesto de cada unidad).
export function posicionesCAP(cap, { unidades = [], ops = {}, marcas = [], A = null, previas = null } = {}) {
  const R = referencias({ unidades, ops, marcas, A })
  const nF = (cap?.fases || []).length || 5
  const us = movibles(unidades, A, R)
  const vacio = () => Object.assign(Array.from({ length: nF }, () => ({})), { puestos: {} })
  if (!us.length || !R.pc) return vacio()
  const roles = (cap?.roles || []).map((r) => ({ ...r, ids: (r.unidades || []).map((u) => u.id) }))
  // Primero las del CAP (en el orden de sus roles), después las demás.
  const enRoles = new Set(roles.flatMap((r) => r.ids))
  const lista = [...us.filter((u) => enRoles.has(u.id)).sort((a, b) => roles.findIndex((r) => r.ids.includes(a.id)) - roles.findIndex((r) => r.ids.includes(b.id))), ...us.filter((u) => !enRoles.has(u.id))]
  const rolDe = new Map(lista.map((u) => [u.id, roles.find((r) => r.ids.includes(u.id)) || (u.esAgrupacion ? rolDeAgrupacion(u, roles) : null)]))
  const ROL = (id) => norm(rolDe.get(id)?.rol)
  const av = (nombre) => (A?.avenidas || []).find((a) => a.nombre === nombre) || null
  const avPpal = A?.avenidas?.[0] || null
  // La avenida de cada rol, por su tarea («… sobre la AA-2»).
  const avDeRol = (r) => av((String(r?.tarea || '').match(/\bAA-\d+\b/) || [])[0]) || null
  const obras = trabajos(ops)

  // El puesto de cada ficha: lo que quedó en la FASE III de este CAP, o el que se guardó en la ficha, o donde está.
  const org = new Map(((previas || [])[FASE_ORG]?.unidades || []).filter((v) => v && pos(v)).map((v) => [v.id, pos(v)]))
  const puestoGuardado = (u) => (G.valido(u?.puesto) ? [+u.puesto[0], +u.puesto[1]] : null)
  const puestos = {}
  const puesto = {}
  for (const u of lista) {
    const deForma = segunForma(ROL(u.id))
    puesto[u.id] = (!deForma && org.get(u.id)) || puestoGuardado(u) || pos(u)
    puestos[u.id] = r6(deForma ? puestoGuardado(u) || pos(u) : puesto[u.id])
  }
  const desplegada = (p) => !!p && G.km(p, R.pc) > DESPLEGADA_KM

  // FASE I: alrededor del PC, en un anillo de 3 a 5 km (cada una en su lugar del anillo).
  const f1 = {}
  lista.forEach((u, k) => {
    f1[u.id] = G.desplazar(R.pc, 3 + (k % 2) * 2, (k * 360) / lista.length + 20)
  })

  // El lugar de cada una en la organización (FASE III).
  const lugar = {}
  const sec = [...R.secundarios]
  const atras = () => (R.lpr ? medio(sobreLPR(R, avPpal, 0) || R.pc, R.pc, 0.6) : null)
  for (const u of lista) {
    const r = rolDe.get(u.id)
    const rol = ROL(u.id)
    if (!segunForma(rol) && desplegada(puesto[u.id])) {
      lugar[u.id] = puesto[u.id]
      continue
    }
    let p = null
    if (!r) p = null
    else if (/MASA/.test(rol)) p = marcaDe([R.reserva].filter(Boolean), u)?.centro || R.reserva?.centro || atras()
    else if (/ESFUERZO PRINCIPAL/.test(rol) && !/RUPTURA/.test(rol)) p = marcaDe([R.principal].filter(Boolean), u)?.centro || R.principal?.centro || sobreLPR(R, avDeRol(r) || avPpal)
    else if (/SECUNDARIO|FIJADORA|FIJACION/.test(rol)) {
      const m = marcaDe(sec, u) || sec.shift() || null
      p = m?.centro || sobreLPR(R, avDeRol(r) || A?.avenidas?.[1] || avPpal)
    } else if (/RESERVA/.test(rol)) p = marcaDe([R.reserva].filter(Boolean), u)?.centro || R.reserva?.centro || atras()
    else if (/RETARDO|COBERTURA/.test(rol)) p = sobreLDE(R, avPpal) || (R.lpr && R.enemigo ? G.desplazar(sobreLPR(R, avPpal, 0), 8, G.rumbo(sobreLPR(R, avPpal, 0), R.enemigo)) : null)
    else if (/APOYO DE FUEGOS/.test(rol)) {
      const ppal = R.principal?.centro || sobreLPR(R, avPpal)
      p = ppal ? medio(ppal, R.pc, 0.35) : null
    } else if (/INGENIEROS/.test(rol)) p = G.centroide(obras) || sobreLPR(R, avPpal, 1)
    else p = sobreLPR(R, avDeRol(r) || avPpal) // ofensiva / retrógrada: sobre su línea
    lugar[u.id] = p || puesto[u.id]
  }
  // La unidad con una tarea táctica en la carta, junto a su tarea (la OD primero; con varias, la primera).
  const conTarea = new Set()
  for (const t of ordenTareas(tareasDeLaCarta(ops))) {
    const u = duenoDeTarea(t, lista)
    if (!u || conTarea.has(u.id) || segunForma(ROL(u.id))) continue
    conTarea.add(u.id)
    if (!lugar[u.id] || G.km(lugar[u.id], [+t.centro[0], +t.centro[1]]) > CERCA) lugar[u.id] = juntoA(t, R.enemigo)
  }

  // FASE II: los trabajos del plan de barreras, cada uno a la unidad que defiende ese sector (la más cercana a su
  // puesto que la LÍM. entre sectores no separa del trabajo). La reserva, la masa y el apoyo no hacen obras.
  const hacen = lista.filter((u) => {
    const rol = ROL(u.id)
    return rol && !/RESERVA|MASA|APOYO DE FUEGOS|INGENIEROS/.test(rol) && lugar[u.id]
  })
  const obrasDe = new Map()
  for (const o of obras) {
    const cerca = hacen.slice().sort((a, b) => G.km(lugar[a.id], o) - G.km(lugar[b.id], o))
    const u = cerca.find((x) => !R.sectores.some((l) => G.crucePolilineas([lugar[x.id], o], l))) || cerca[0]
    if (u) obrasDe.set(u.id, [...(obrasDe.get(u.id) || []), o])
  }

  const ppalLPR = sobreLPR(R, avPpal, 0)
  const forma = cap?.forma
  const fases = []
  for (let i = 0; i < nF; i++) {
    const f = {}
    for (const u of lista) {
      const id = u.id
      const rol = ROL(id)
      let p = lugar[id]
      if (i === 0) p = f1[id]
      else if (i === 1) p = obrasDe.has(id) ? G.centroide(obrasDe.get(id)) : medio(f1[id], lugar[id])
      else if (!rolDe.get(id)) p = lugar[id]
      else if (forma === 'movil') {
        if (/RETARDO/.test(rol)) p = i === 2 ? lugar[id] : i === 3 ? sobreLPR(R, avPpal, 5) || lugar[id] : (lugar[id] && ppalLPR ? medio(lugar[id], ppalLPR, 0.55) : lugar[id])
        else if (/MASA/.test(rol) && i === 4) p = lugar[id] && R.lde ? medio(sobreLDE(R, avPpal) || lugar[id], ppalLPR || lugar[id], 0.55) : (R.ejeCA ? R.ejeCA[R.ejeCA.length - 1] : ppalLPR || lugar[id])
        else if (/MASA/.test(rol) && i === 3 && ppalLPR) p = medio(lugar[id], ppalLPR, 0.4)
      } else if (/RESERVA/.test(rol) && i === nF - 1) p = (R.ejeCA ? R.ejeCA[R.ejeCA.length - 1] : null) || (ppalLPR ? G.desplazar(ppalLPR, 2, R.enemigo ? G.rumbo(R.enemigo, ppalLPR) : 0) : lugar[id])
      else if (['ruptura', 'envolvimiento', 'desbordamiento'].includes(forma) && i >= 3 && R.enemigo && lugar[id]) p = medio(lugar[id], R.enemigo, i === 3 ? 0.4 : 0.75)
      if (p) f[id] = p
    }
    // Que no queden dos fichas una encima de la otra (la unidad del CAP y su agrupación, dos con el mismo lugar).
    const puestas = []
    for (const u of lista) {
      const p0 = f[u.id]
      if (!p0) continue
      let p = p0
      for (let k = 0; k < 6 && puestas.some((q) => G.km(q, p) < 0.5); k++) p = G.desplazar(p0, 1.5, 45 + 60 * k)
      puestas.push(p)
      f[u.id] = r6(p)
    }
    fases.push(f)
  }
  // La tarea de cada fase, CON la unidad que la cumple (su símbolo va pegado a la ficha, como en las fases del enemigo):
  // la cumplen las agrupaciones de ese rol (la OD, la OC…) o, si no hay, la unidad. Cada fase con una tarea DISTINTA de
  // la de la fase anterior (en la FASE III, la suya de la carta): «cada fase tiene una tarea táctica diferente».
  const deLaCarta = new Map()
  for (const t of tareasDeLaCarta(ops)) {
    const u = duenoDeTarea(t, lista)
    if (u && !deLaCarta.has(u.id)) deLaCarta.set(u.id, t.tarea)
  }
  const simbolos = Array.from({ length: nF }, () => ({}))
  for (const r of new Set([...rolDe.values()].filter((x) => x?.tareasFase))) {
    const ags = lista.filter((u) => u.esAgrupacion && rolDe.get(u.id) === r)
    const quienes = ags.length ? ags : lista.filter((u) => !u.esAgrupacion && rolDe.get(u.id) === r)
    for (const u of quienes) {
      let antes = null
      for (let i = 0; i < nF; i++) {
        const opciones = [].concat(r.tareasFase[i] || [])
        let t = i === FASE_ORG ? deLaCarta.get(u.id) || null : null
        // (la de la carta se ve en la carta: no se repite pegada a la ficha)
        const pegada = !t && opciones.length ? opciones.find((x) => x !== antes) || opciones[0] : null
        simbolos[i][u.id] = { tarea: pegada, texto: r.fases?.[i] || '' }
        antes = t || pegada
      }
    }
  }
  return Object.assign(fases, { puestos, simbolos })
}
