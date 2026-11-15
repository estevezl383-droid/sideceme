// 🔵 FASES AZUL del Teatro (14-11-2026): el curso de acción propio (CAP) fase por fase, frente al CAE elegido, y el
// ENFRENTAMIENTO con las FASES ROJO para llevarlo al Juego de Guerra. Sin DOM: lo usan panel.mjs, la impresión por
// fases y las pruebas.
//
// Pedido: «elaborar un curso de acción propio donde se puedan descargar y enfrentar las fuerzas para llevarlos al
// juego de guerra… debe quedar fases de ROJO y luego fases de AZUL para que se enfrenten».
//
// Propuesta (la máquina propone, el G-3 dispone: cada ficha se arrastra y cada texto se corrige en el panel):
//   F-I   Cobertura y ocupación de la defensa: cada GU propia que enfrenta una DEOP cubre su paso y organiza la
//         posición defensiva en el primer objetivo intermedio enemigo de esa DEOP; la reserva queda en su zona.
//   F-II  Defensa en posición: detener al enemigo delante de la posición; la reserva pasa a la zona de espera
//         detrás de la defensa de la DEOP del esfuerzo principal enemigo.
//   F-III Defensa decisiva y contraataque: se fija al esfuerzo principal y la reserva contraataca en su DEOP.
//   F-IV  Contraofensiva: restablecer la frontera en los pasos.
// Mismas fases y mismos días que el CAE: primero las fases ROJO, después las fases AZUL.
//
// 15-11-2026 — OPCIONES del G-3 (pedido: «quiero enfrentar como en la imagen 1 [los CE en sus AO, sobre la frontera,
// cara a cara con el rojo] y con más reservas para que se vean combates»):
//   despliegue  'frontera' (por defecto): cada CE se adelanta a su AO y defiende sobre la frontera, a KM_FRONTERA del
//               paso de su DEOP · 'profundidad': la propuesta anterior (primer objetivo intermedio enemigo).
//   reservas    'temprano' (por defecto): contraatacan ya en la F-II, una sobre cada DEOP más amenazada (empezando por
//               la del esfuerzo principal enemigo) · 'f3': zona de espera en la F-II y contraataque en la F-III.
//   enReserva   GG.UU. que el G-3 saca del frente y pasa a reserva (más reservas, más contraataques).
//   desplegados true (por defecto): en el .json del juego cada GU arranca ya en su posición de la F-I.
import { puntoEnLinea } from './doctrina.mjs'
import { fmtDia } from './modelo.mjs'

export const NOMBRES_AZUL = ['Cobertura y ocupación de la defensa', 'Defensa en posición', 'Defensa decisiva y contraataque de la reserva', 'Contraofensiva']
export const NOMBRES_FRONTERA = ['Cobertura: los CE ocupan sus AO sobre la frontera', 'Defensa adelantada en la frontera', 'Defensa decisiva y contraataque de las reservas', 'Contraofensiva']
export const KM_FRONTERA = 12
const RADIO_CONTACTO_KM = 40
const limpio = (t) => String(t || '').replace(/\s*\((Chile|Bolivia|Per[uú]|Argentina|frontera|origen)\)/gi, '').trim()
const lista = (l, y = 'y') => { const a = [...new Set(l.filter(Boolean))]; return a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} ${y} ${a[a.length - 1]}` }
const r5 = (x) => (Number.isFinite(x) ? Math.round(x * 1e5) / 1e5 : null)
const dia = (n) => fmtDia(Math.max(0, n))

export function distKm(a, b) {
  const rad = Math.PI / 180, dLat = (b[1] - a[1]) * rad, dLng = (b[0] - a[0]) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}
// El km del itinerario más cercano a un punto (para saber si el rojo quiere pasar por la posición azul).
function kmEnRuta(a, lng, lat) {
  const c = a.coords || []
  let acum = 0, mejor = { km: 0, d: Infinity }
  for (let i = 0; i < c.length; i++) {
    if (i) acum += distKm(c[i - 1], c[i])
    const d = distKm(c[i], [lng, lat])
    if (d < mejor.d) mejor = { km: acum, d }
  }
  return mejor
}
const lugarEn = (a, km) => { let p = a.puntos?.[0]; for (const q of a.puntos || []) if ((q.km ?? 0) <= km + 0.5) p = q; return limpio(p?.nombre || '') }
const enRuta = (a, km, lado = 0) => {
  const p = puntoEnLinea(a.coords, Math.min(a.kmRuta, Math.max(0, km))) || [a.puntos?.[0]?.lng, a.puntos?.[0]?.lat]
  return { lng: p[0] + lado * 0.08, lat: p[1] + lado * 0.05 }
}

// La posición defensiva de cada DEOP: el primer objetivo intermedio enemigo (sin el gemelo del paso) si está en la
// primera parte del itinerario; si no, a un cuarto del camino (entre 20 y 80 km del paso).
export function posicionDefensiva(a) {
  const o = (a.puntos || []).filter((p, i) => i > 0 && p.rol !== 'destino' && (p.km ?? 0) > 15)[0]
  if (o && o.km <= a.kmRuta * 0.6) return { km: o.km, lugar: limpio(o.nombre) }
  const km = Math.min(a.kmRuta, Math.max(20, Math.min(80, a.kmRuta * 0.25)))
  return { km, lugar: lugarEn(a, km) }
}

// ediciones = resultados.picbTeatro.capAzul: { frente, pos: { 'F-II|CE-I': [lng, lat] }, textos: { 'F-II|CE-I': '…' } }
export function capAzul({ analisis = [], caes = null, unidades = { propias: [] }, frente = 'probable', ediciones = {} } = {}) {
  const fr = frente === 'peligroso' ? 'peligroso' : 'probable'
  const cae = caes?.[fr] || caes?.probable
  if (!cae?.fases?.length) return null
  const desp = ediciones.despliegue === 'profundidad' ? 'profundidad' : 'frontera'
  const resModo = ediciones.reservas === 'f3' ? 'f3' : 'temprano'
  const enRes = new Set(ediciones.enReserva || [])
  const alFrente = (a) => (a.propias || []).filter((u) => !enRes.has(u.designacion))
  const frentes = analisis.filter((a) => alFrente(a).length && a.coords?.length)
  const asignadas = new Set(frentes.flatMap((a) => alFrente(a).map((u) => u.designacion)))
  const reserva = (unidades.propias || []).filter((u) => !asignadas.has(u.designacion) && u.escalon !== 'ejercito' && Number.isFinite(u.lng) && Number.isFinite(u.lat) &&
    (enRes.has(u.designacion) || u.rol === 'reserva' || ['cuerpo', 'division', 'brigada'].includes(u.escalon)))
  // Dónde defiende cada CE en su DEOP: sobre la frontera (en su AO) o en profundidad.
  const linea = (a) => { if (desp !== 'frontera') return posicionDefensiva(a); const km = Math.min(a.kmRuta || 0, KM_FRONTERA); return { km, lugar: lugarEn(a, km) } }
  if (!frentes.length && !reserva.length) return null
  const ep = analisis.find((a) => a.n === cae.n && a.coords?.length) || frentes[0] || null
  const pdEp = ep ? linea(ep) : null
  // Las reservas se reparten una por DEOP, de la más amenazada a la menos (primero la del esfuerzo principal enemigo).
  const amenaza = [...new Set([ep, ...analisis.filter((a) => a.coords?.length && a.enemigas?.length).sort((x, y) => (y.enemigas.length - x.enemigas.length) || (x.n - y.n))])].filter(Boolean)
  const deopRes = (j) => (amenaza.length ? amenaza[j % amenaza.length] : null)
  const rojoDe = (a) => lista((a.enemigas || []).map((u) => u.designacion)) || 'el enemigo'
  // Cada GU propia va UNA vez por fase (en el Juego de Guerra no puede estar en dos lugares): si enfrenta dos DEOP, se
  // para en la del esfuerzo principal enemigo o en la de más GG.UU. enemigas, y vigila la otra.
  const porUnidad = new Map()
  for (const a of frentes) for (const u of alFrente(a)) { if (!porUnidad.has(u.designacion)) porUnidad.set(u.designacion, { u, deops: [] }); porUnidad.get(u.designacion).deops.push(a) }
  const peso = (a) => (a === ep ? 1000 : 0) + (a.enemigas?.length || 0) * 10 - a.n * 0.01
  const puestos = [...porUnidad.values()].map(({ u, deops }) => { const a = [...deops].sort((x, y) => peso(y) - peso(x))[0]; return { u, a, otras: deops.filter((x) => x !== a) } })
  for (const p of puestos) { const mismos = puestos.filter((q) => q.a === p.a); p.lado = mismos.indexOf(p) - (mismos.length - 1) / 2 }
  const pos = ediciones.pos || {}, textos = ediciones.textos || {}
  const fases = cae.fases.map((f, i) => {
    const acc = []
    const poner = (u, deop, papel, que, lugar, p) => {
      const k = `${f.id}|${u.designacion}`, m = pos[k]
      acc.push({ quien: u.designacion, designacion: u.designacion, escalon: u.escalon || null, arma: u.arma || null, deop, papel, que: textos[k] || que, propuesta: que, lugar,
        dia: i === 3 ? f.de : f.a, lng: r5(m ? m[0] : p.lng), lat: r5(m ? m[1] : p.lat), movida: !!m, editada: !!textos[k] })
    }
    for (const { u, a, otras, lado } of puestos) {
      const pd = linea(a), paso = limpio(a.puntos?.[0]?.nombre) || 'el paso', rojo = rojoDe(a), p = enRuta(a, pd.km, lado)
      const tambien = otras.length ? `; vigila también la DEOP ${lista(otras.map((x) => String(x.n)))}` : ''
      if (desp === 'frontera') {
        if (i === 0) poner(u, a.n, 'cobertura', `se adelanta a su área de operaciones y ocupa la defensa adelantada en ${pd.lugar}, sobre la frontera frente a ${paso}${tambien}`, pd.lugar, p)
        else if (i === 1) poner(u, a.n, 'defensa', `defensa adelantada en ${pd.lugar}: detener a ${rojo} en la frontera${tambien}`, pd.lugar, p)
        else if (i === 2) poner(u, a.n, 'defensa', a === ep ? `defensa decisiva en ${pd.lugar}: fija al esfuerzo principal enemigo (${rojo}) en la frontera para el contraataque de las reservas${tambien}` : `mantiene la frontera en ${pd.lugar} frente a ${rojo}${tambien}`, pd.lugar, p)
        else poner(u, a.n, 'contraofensiva', `contraofensiva hasta ${paso}: restablecer la frontera`, paso, enRuta(a, 0, lado))
      } else if (i === 0) poner(u, a.n, 'cobertura', `cubre ${paso} (seguridad y vigilancia) y ocupa y organiza la posición defensiva en ${pd.lugar}${tambien}`, pd.lugar, p)
      else if (i === 1) poner(u, a.n, 'defensa', `defensa en posición en ${pd.lugar}: detener a ${rojo} delante de la posición${tambien}`, pd.lugar, p)
      else if (i === 2) poner(u, a.n, 'defensa', a === ep ? `defensa decisiva en ${pd.lugar}: fija al esfuerzo principal enemigo (${rojo}) para el contraataque de la reserva${tambien}` : `mantiene la posición en ${pd.lugar} frente a ${rojo} (economía de fuerzas)${tambien}`, pd.lugar, p)
      else poner(u, a.n, 'contraofensiva', `contraofensiva hasta ${paso}: restablecer la frontera`, paso, enRuta(a, 10, lado))
    }
    const enDeop = new Map()
    reserva.forEach((u, j) => {
      const a = deopRes(j), zona = u.lugar || 'su zona de reunión'
      if (!a) return poner(u, null, 'reserva', `reserva de las FF.TT.T.O. en ${zona}`, u.lugar || '', { lng: u.lng, lat: u.lat })
      const k = enDeop.get(a) || 0; enDeop.set(a, k + 1)
      const lado = 0.7 + k * 0.6, pdA = linea(a), rojoA = rojoDe(a), pasoA = limpio(a.puntos?.[0]?.nombre) || 'el paso'
      if (i === 0) poner(u, null, 'reserva', `reserva de las FF.TT.T.O. en ${zona}: lista para empeñarse sobre la DEOP ${a.n}${a === ep ? ', la del esfuerzo principal enemigo' : ''}`, u.lugar || '', { lng: u.lng, lat: u.lat })
      else if (i === 1 && resModo === 'temprano') { const km = Math.max(3, pdA.km - 6); poner(u, a.n, 'contraataque', `CONTRAATAQUE sobre ${rojoA} (DEOP ${a.n}) apenas ataque a ${pdA.lugar}: no lo deja pasar`, lugarEn(a, km), enRuta(a, km, lado)) }
      else if (i === 1) { const km = Math.min(a.kmRuta, pdA.km + 40); poner(u, a.n, 'reserva', `se adelanta a la zona de espera detrás de ${pdA.lugar} (${lugarEn(a, km)}); punto de decisión: empeñarla cuando ${rojoA} llegue a ${pdA.lugar}`, lugarEn(a, km), enRuta(a, km, lado)) }
      else if (i === 2) { const km = Math.max(3, pdA.km - 10); poner(u, a.n, 'contraataque', `CONTRAATAQUE sobre ${rojoA} delante de ${pdA.lugar} (DEOP ${a.n})`, lugarEn(a, km), enRuta(a, km, lado)) }
      else poner(u, a.n, 'contraofensiva', `explota el contraataque: contraofensiva hasta ${pasoA}`, pasoA, enRuta(a, desp === 'frontera' ? 0 : 15, lado))
    })
    return { id: f.id, nombre: (desp === 'frontera' ? NOMBRES_FRONTERA : NOMBRES_AZUL)[i] || f.nombre, nombreRojo: f.nombre, de: f.de, a: f.a, ventana: f.ventana || `${dia(f.de)} a ${dia(f.a)}`, acciones: acc }
  })
  const varias = reserva.length > 1
  const enunciado = (desp === 'frontera'
    ? `Las FF.TT.T.O. se adelantan a sus áreas de operaciones y defienden sobre la frontera en ${lista(puestos.map((p) => linea(p.a).lugar))} con ${lista(puestos.map((p) => p.u.designacion))}`
    : `Las FF.TT.T.O. cubren los pasos y defienden en ${lista(puestos.map((p) => posicionDefensiva(p.a).lugar))} con ${lista(puestos.map((p) => p.u.designacion))}`) +
    ` frente a las DEOP ${lista(frentes.map((a) => String(a.n)))}` +
    (reserva.length && amenaza.length ? `; ${lista(reserva.map((u) => u.designacion))} ${varias ? 'quedan' : 'queda'} en reserva y ` +
      (resModo === 'temprano' ? `${varias ? 'contraatacan' : 'contraataca'} desde la F-II` : `${varias ? 'se empeñan' : 'se empeña'} en la F-III en un contraataque`) +
      ` sobre ${varias ? 'las DEOP' : 'la DEOP'} ${lista([...new Set(reserva.map((u, j) => String(deopRes(j).n)))])}` : '') +
    '; en la F-IV pasan a la contraofensiva para restablecer la frontera.'
  return { id: 'CAP', frente: fr, caeId: cae.id, ep: ep?.n ?? null, enunciado, fases, reserva: reserva.map((u) => u.designacion),
    despliegue: desp, reservas: resModo, enReserva: [...enRes], desplegados: ediciones.desplegados !== false }
}

// Quién busca a quién en cada fase, por DEOP: hay choque cuando quedan a menos de 40 km o cuando el objetivo rojo de
// la fase está sobre el itinerario más allá de la posición azul (el rojo tiene que pasar por ella).
export function enfrentamientos(cae, cap, analisis = []) {
  if (!cae?.fases?.length || !cap?.fases?.length) return []
  const out = []
  cap.fases.forEach((fa, i) => {
    const fr = cae.fases[i]
    if (!fr) return
    const ns = [...new Set([...fr.acciones, ...fa.acciones].map((x) => x.deop).filter((n) => n != null))].sort((x, y) => x - y)
    for (const n of ns) {
      const a = analisis.find((x) => x.n === n)
      const r = fr.acciones.filter((x) => x.deop === n && x.papel !== 'apoyo' && Number.isFinite(x.lng) && Number.isFinite(x.lat))
      const z = fa.acciones.filter((x) => x.deop === n && Number.isFinite(x.lng) && Number.isFinite(x.lat))
      if (!r.length || !z.length) continue
      let km = Infinity
      for (const x of r) for (const y of z) km = Math.min(km, distKm([x.lng, x.lat], [y.lng, y.lat]))
      const rKm = Math.max(...r.map((x) => (Number.isFinite(x.km) ? x.km : a ? kmEnRuta(a, x.lng, x.lat).km : 0)))
      const bKm = a ? Math.min(...z.map((y) => kmEnRuta(a, y.lng, y.lat).km)) : null
      out.push({ fase: fa.id, deop: n, rojo: [...new Set(r.map((x) => x.quien))], azul: [...new Set(z.map((y) => y.quien))], km: Math.round(km), lugar: z[0].lugar || '',
        contacto: km <= RADIO_CONTACTO_KM || (bKm != null && rKm >= bKm - 10) })
    }
  })
  return out
}

// El paquete que se descarga para el Juego de Guerra: fases ROJO y AZUL con la posición de cada GU al final de cada fase.
export function paquete({ ejercicio = '', cae, cap, unidades = { enemigas: [], propias: [] }, analisis = [] } = {}) {
  if (!cae?.fases?.length || !cap?.fases?.length) return null
  // «Arrancar desplegados»: la posición inicial de cada GU es la de su F-I (el juego empieza con los CE ya en sus AO).
  const ini = new Map()
  const ficha = (u, bando) => { const p = ini.get(bando + '|' + u.designacion)
    return { designacion: u.designacion, bando, escalon: u.escalon || null, arma: u.arma || null, poder: u.poder ?? null, rol: u.rol || null, deop: u.deop ?? null,
      lugar: (p && p.lugar) || u.lugar || '', lng: r5(p ? p.lng : u.lng), lat: r5(p ? p.lat : u.lat) } }
  const rojos = (unidades.enemigas || []).filter((u) => Number.isFinite(u.lng) && Number.isFinite(u.lat))
  const azules = (unidades.propias || []).filter((u) => Number.isFinite(u.lng) && Number.isFinite(u.lat))
  // El CAE junta en un renglón las GG.UU. de una DEOP («1ª Brig. Acor. … y Brig. Mot. 4 …»): una entrada por GU.
  const deQuien = (q) => { const xs = rojos.filter((u) => u.designacion && String(q || '').includes(u.designacion)); return xs.length ? xs.map((u) => u.designacion) : [String(q || '')] }
  const enf = enfrentamientos(cae, cap, analisis)
  if (cap.desplegados) {
    for (const x of (cae.fases[0]?.acciones || []).filter((x) => Number.isFinite(x.lng) && Number.isFinite(x.lat))) {
      const us = deQuien(x.quien)
      us.forEach((d, j) => { if (!ini.has('rojo|' + d)) ini.set('rojo|' + d, { lng: x.lng + (j - (us.length - 1) / 2) * 0.06, lat: x.lat, lugar: x.lugar }) })
    }
    for (const x of cap.fases[0]?.acciones || []) if (Number.isFinite(x.lng) && Number.isFinite(x.lat)) ini.set('azul|' + x.designacion, { lng: x.lng, lat: x.lat, lugar: x.lugar })
  }
  return {
    formato: 'sideceme/enfrentamiento-teatro', version: 1, ejercicio, generado: new Date().toISOString(), nivel: 'FF.TT.T.O.',
    comoLeerlo: 'Primero las fases ROJO y después las fases AZUL, con los mismos días. En cada fase, «rojo» y «azul» dicen dónde debe estar cada GU al final de la fase (lng, lat; «dia» = D+n) y qué hace. «unidades» trae la posición inicial, escalón, arma y poder de cada GU. «enfrentamientos» dice qué GG.UU. rojas buscan a qué GG.UU. azules en cada DEOP (contacto = choque previsto). El Juego de Guerra pone las GG.UU. en su posición inicial y en cada fase les da como orden la posición de esa fase: donde se encuentran, combaten.',
    rojo: { curso: cae.id, tipo: cae.tipo || null, esfuerzoPrincipalDeop: cae.n ?? null, enunciado: cae.enunciado || '' },
    azul: { curso: 'CAP del Teatro', frente: cap.caeId, enunciado: cap.enunciado, reserva: cap.reserva, despliegue: cap.despliegue || 'profundidad', reservas: cap.reservas || 'f3',
      enReserva: cap.enReserva || [], arranque: cap.desplegados ? 'desplegados: la posición inicial de cada GU es la de su F-I' : 'en sus zonas iniciales' },
    unidades: { rojo: rojos.map((u) => ficha(u, 'rojo')), azul: azules.map((u) => ficha(u, 'azul')) },
    fases: cap.fases.map((fa, i) => {
      const fr = cae.fases[i] || { acciones: [] }
      return {
        id: fa.id, de: fa.de, a: fa.a, ventana: fa.ventana, nombreRojo: fr.nombre || fa.nombreRojo, nombreAzul: fa.nombre,
        rojo: (fr.acciones || []).filter((x) => Number.isFinite(x.lng) && Number.isFinite(x.lat)).flatMap((x) => {
          const us = deQuien(x.quien)
          return us.map((d, j) => ({ unidad: d, papel: x.papel || '', deop: x.deop ?? null, que: x.que || '', lugar: x.lugar || '', dia: x.dia ?? null, lng: r5(x.lng + (j - (us.length - 1) / 2) * 0.06), lat: r5(x.lat) }))
        }),
        azul: fa.acciones.map((x) => ({ unidad: x.designacion, papel: x.papel, deop: x.deop, que: x.que, lugar: x.lugar, dia: x.dia, lng: x.lng, lat: x.lat })),
        enfrentamientos: enf.filter((e) => e.fase === fa.id).map(({ fase, ...e }) => e),
      }
    }),
    deop: analisis.map((a) => ({ n: a.n, nombre: a.nombre, kmRuta: Math.round(a.kmRuta || 0), ritmoKmDia: a.ritmo ?? null,
      itinerario: (a.puntos || []).map((p) => ({ nombre: limpio(p.nombre), km: Math.round(p.km || 0), dia: p.dia ?? null, lng: r5(p.lng), lat: r5(p.lat) })) })),
  }
}

// KMZ para Google Earth: carpetas «🔴 FASES ROJO», «🔵 FASES AZUL» y «⚔ Enfrentamientos», fase por fase.
const xe = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
export function kmlEnfrentamiento(p) {
  if (!p) return ''
  const cuando = (d) => (d == null || d === '' ? '' : ` (${typeof d === 'number' ? dia(d) : d})`)
  const pm = (x, est) => `<Placemark><name>${xe(x.unidad)}</name><description>${xe(`${x.papel} · ${x.que}${x.lugar ? ` — ${x.lugar}` : ''}${cuando(x.dia)}`)}</description><styleUrl>#${est}</styleUrl><Point><coordinates>${x.lng},${x.lat},0</coordinates></Point></Placemark>`
  const carpeta = (nombre, hijos, abierta = false) => `<Folder><name>${xe(nombre)}</name>${abierta ? '<open>1</open>' : ''}${hijos.join('')}</Folder>`
  const rojo = carpeta(`🔴 FASES ROJO — ${p.rojo.curso}`, p.fases.map((f) => carpeta(`${f.id} ${f.nombreRojo || ''} (${f.ventana})`, f.rojo.map((x) => pm(x, 'rojo')))), true)
  const azul = carpeta('🔵 FASES AZUL — CAP del Teatro', p.fases.map((f) => carpeta(`${f.id} ${f.nombreAzul} (${f.ventana})`, f.azul.map((x) => pm(x, 'azul')))), true)
  const choques = carpeta('⚔ Enfrentamientos', p.fases.map((f) => carpeta(f.id, f.enfrentamientos.filter((e) => e.contacto).map((e) => {
    const z = f.azul.find((x) => e.azul.includes(x.unidad))
    return z ? `<Placemark><name>${xe(`${f.id} · ${e.rojo.join(', ')} contra ${e.azul.join(', ')}`)}</name><description>${xe(`${e.lugar} · ${e.km} km`)}</description><styleUrl>#choque</styleUrl><Point><coordinates>${z.lng},${z.lat},0</coordinates></Point></Placemark>` : ''
  }))))
  const estilo = (id, color, icono) => `<Style id="${id}"><IconStyle><color>${color}</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/${icono}.png</href></Icon></IconStyle><LabelStyle><color>${color}</color><scale>0.8</scale></LabelStyle></Style>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xe(`${p.ejercicio || 'Teatro'} — FASES ROJO y AZUL`)}</name>
${estilo('rojo', 'ff2828c6', 'placemark_square')}${estilo('azul', 'ffa1470d', 'placemark_square')}${estilo('choque', 'ff00d4ff', 'star')}
${rojo}${azul}${choques}</Document></kml>`
}
