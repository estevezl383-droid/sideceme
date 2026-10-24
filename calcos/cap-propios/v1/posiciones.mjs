// 📍 Dónde va cada unidad en cada fase de un CAP propio, calculado con lo que YA está en la carta. Sin dependencias del
// compilado: lo usan el panel (al armar las fases y al poner la respuesta de la IA) y las pruebas.
//
// Sergio, 24-10-2026, tocando FASE I… V de cada CAP: «no se ve ninguna diferencia ni el cambio de posición de las
// fichas de azul… se supone que en la fase I todos están donde está el CE y de ahí se disgregan». «🎬 Armar las fases»
// copiaba el dispositivo de ese momento en las cinco fases. Ahora cada fase tiene su dispositivo:
//   · FASE I (concentración): las unidades de maniobra y de apoyo alrededor del Puesto Comando del CE (o de su ficha);
//   · FASE II (desplazamiento): a mitad de camino hacia su sector;
//   · FASE III (ocupación / organización): cada una en su lugar, con lo que dejó la F3·P4 en la carta: las marcas
//     «ESFUERZO PRINCIPAL · …», «ESFUERZO SECUNDARIO · …» y «RES · …»; si no están, donde su avenida corta la LPR
//     (unos km detrás); la reserva, en la zona de reserva; el apoyo de fuegos, detrás del esfuerzo principal;
//   · FASE IV y V según la forma: en la defensa de área, la reserva contraataca por el EJE CA (o hacia donde el
//     esfuerzo principal corta la LPR); en la defensa móvil, la fuerza de retardo va de la LDE-1 a la LPR y la masa
//     contraataca en la zona de destrucción (entre la LDE-1 y la LPR, sobre la avenida principal).
// Lo que no se puede calcular (sin LPR, sin avenidas) queda donde está: la Mesa no inventa lugares sin base.
import * as G from '../../concepto-operacion/v1/geo.mjs'

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
const esEnemiga = (u) => /^enemig/i.test(String(u?.bando || ''))
const pos = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
const r6 = (p) => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6]
const medio = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

// Lo que hay en la carta para ubicar las fases.
export function referencias({ unidades = [], ops = {}, marcas = [], A = null } = {}) {
  const limites = (ops?.limites || []).filter((l) => (l?.coords || []).filter(G.valido).length >= 2)
  const porNombre = (re) => limites.find((l) => re.test(norm(l.nombre)))?.coords || null
  const lpr = limites.find((l) => l?.co?.rol === 'lpr')?.coords || porNombre(/\bLPR\b|\bLF\b/)
  const lde = porNombre(/\bLDE\s*-?\s*1\b/) || porNombre(/\bLDE\b|\bLCAF\b/)
  const ejeCA = limites.find((l) => l?.co?.rol === 'eje-ca')?.coords || porNombre(/\bEJE\s*CA\b/)
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
    lpr, lde, ejeCA, enemigo,
    pc: pc ? pos(pc) : centroPropias,
    principal: marca((m) => m.tipo === 'esfuerzo' && m.clase === 'principal'),
    secundarios: ms.filter((m) => m.tipo === 'esfuerzo' && m.clase !== 'principal'),
    reserva: marca((m) => m.tipo === 'reserva'),
  }
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
// Una marca de la F3·P4 que nombra a la unidad («ESFUERZO PRINCIPAL · DIV MEC-2»), o la primera del tipo.
const marcaDe = (ms, u) => {
  const n = norm(u?.nom || u?.designacion)
  return (n && ms.find((m) => norm(m.texto).includes(n))) || null
}

// Las posiciones de un CAP: [fase0, fase1, …] cada una { id: [lng, lat] }. cap: el de proponer.armarCAP.
export function posicionesCAP(cap, { unidades = [], ops = {}, marcas = [], A = null } = {}) {
  const R = referencias({ unidades, ops, marcas, A })
  const porId = new Map((unidades || []).map((u) => [u.id, u]))
  const roles = (cap?.roles || []).map((r) => ({ ...r, ids: r.unidades.map((u) => u.id).filter((id) => porId.has(id)) }))
  const ids = [...new Set(roles.flatMap((r) => r.ids))]
  const nF = (cap?.fases || []).length || 5
  if (!ids.length || !R.pc) return Array.from({ length: nF }, () => ({}))
  const av = (nombre) => (A?.avenidas || []).find((a) => a.nombre === nombre) || null
  const avPpal = A?.avenidas?.[0] || null
  // La avenida de cada rol, por su tarea («… sobre la AA-2»).
  const avDeRol = (r) => av((String(r.tarea).match(/\bAA-\d+\b/) || [])[0]) || null
  const rolDe = (id) => roles.find((r) => r.ids.includes(id))
  const actual = (id) => pos(porId.get(id))
  // FASE I: alrededor del PC, en un anillo de 3 a 6 km (cada una en su lugar del anillo).
  const f1 = {}
  ids.forEach((id, k) => {
    const az = (k * 360) / ids.length + 20
    f1[id] = G.desplazar(R.pc, 3 + (k % 2) * 2, az)
  })
  // El lugar de cada una en la organización (FASE III).
  const lugar = {}
  const sec = [...R.secundarios]
  for (const r of roles) {
    for (const id of r.ids) {
      const u = { id, nom: porId.get(id)?.designacion }
      let p = null
      const rol = norm(r.rol)
      // Detrás de la LPR, hacia el PC (la zona de reserva si la F3·P4 no la marcó).
      const atras = () => (R.lpr ? medio(sobreLPR(R, avPpal, 0) || R.pc, R.pc, 0.6) : null)
      if (/MASA/.test(rol)) p = marcaDe([R.reserva].filter(Boolean), u)?.centro || R.reserva?.centro || atras()
      else if (/ESFUERZO PRINCIPAL/.test(rol) && !/RUPTURA/.test(rol)) p = marcaDe([R.principal].filter(Boolean), u)?.centro || R.principal?.centro || sobreLPR(R, avDeRol(r) || avPpal)
      else if (/SECUNDARIO|FIJADORA|FIJACION/.test(rol)) {
        const m = marcaDe(sec, u) || sec.shift() || null
        p = m?.centro || sobreLPR(R, avDeRol(r) || A?.avenidas?.[1] || avPpal)
      } else if (/RESERVA/.test(rol)) p = marcaDe([R.reserva].filter(Boolean), u)?.centro || R.reserva?.centro || atras()
      else if (/RETARDO|COBERTURA/.test(rol)) p = sobreLDE(R, avPpal) || (R.lpr && R.enemigo ? G.desplazar(sobreLPR(R, avPpal, 0), 8, G.rumbo(sobreLPR(R, avPpal, 0), R.enemigo)) : null)
      else if (/APOYO DE FUEGOS/.test(rol)) {
        const ppal = R.principal?.centro || sobreLPR(R, avPpal)
        p = ppal ? medio(ppal, R.pc, 0.35) : null
      } else if (/INGENIEROS/.test(rol)) p = sobreLPR(R, avPpal, 1)
      else p = sobreLPR(R, avDeRol(r) || avPpal) // ofensiva / retrógrada: sobre su línea
      lugar[id] = p || actual(id)
    }
  }
  const ppalLPR = sobreLPR(R, avPpal, 0)
  const forma = cap?.forma
  const fases = []
  for (let i = 0; i < nF; i++) {
    const f = {}
    for (const id of ids) {
      const r = rolDe(id)
      const rol = norm(r?.rol)
      let p = lugar[id]
      if (i === 0) p = f1[id]
      else if (i === 1) p = lugar[id] ? medio(f1[id], lugar[id]) : f1[id]
      else if (forma === 'movil') {
        if (/RETARDO/.test(rol)) p = i === 2 ? lugar[id] : i === 3 ? sobreLPR(R, avPpal, 5) || lugar[id] : (lugar[id] && ppalLPR ? medio(lugar[id], ppalLPR, 0.55) : lugar[id])
        else if (/MASA/.test(rol) && i === 4) p = lugar[id] && R.lde ? medio(sobreLDE(R, avPpal) || lugar[id], ppalLPR || lugar[id], 0.55) : (R.ejeCA ? R.ejeCA[R.ejeCA.length - 1] : ppalLPR || lugar[id])
        else if (/MASA/.test(rol) && i === 3 && ppalLPR) p = medio(lugar[id], ppalLPR, 0.4)
      } else if (/RESERVA/.test(rol) && i === nF - 1) p = (R.ejeCA ? R.ejeCA[R.ejeCA.length - 1] : null) || (ppalLPR ? G.desplazar(ppalLPR, 2, R.enemigo ? G.rumbo(R.enemigo, ppalLPR) : 0) : lugar[id])
      else if (['ruptura', 'envolvimiento', 'desbordamiento'].includes(forma) && i >= 3 && R.enemigo && lugar[id]) p = medio(lugar[id], R.enemigo, i === 3 ? 0.4 : 0.75)
      if (p) f[id] = r6(p)
    }
    fases.push(f)
  }
  return fases
}
