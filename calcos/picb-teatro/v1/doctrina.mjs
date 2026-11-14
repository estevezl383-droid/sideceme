// 🌎 PICB del Teatro — pasos 3 y 4 a fondo (14-11-2026): el MODELO DE LA AMENAZA como plantilla
// doctrinal con reservas, los CAE POR FASES con el empleo de la reserva, la matriz de eventos, los
// RPI, los puntos de decisión propios y el PROMPT PARA LA IA con el pegado de su respuesta.
//
// Lo pidió Sergio el 14-11-2026 con el Word «PICB del Teatro, Paso 4» en la mano: «quiero que la
// aplicación tenga la capacidad de generar estos resultados, obviamente con ayuda de la IA y
// tratando de seguir los pasos del PMTD o del PICB». La app no gasta plata: acá hay un motor
// determinista que arma la propuesta con lo que ya calculó el panel (DEOP sobre la red vial, D+n,
// A.I.N., poder relativo) y, aparte, un prompt que el oficial pega en la IA que tenga a mano; la
// respuesta (JSON) se pega de vuelta y se revisa. «La máquina propone, el G-2 dispone.»
//
// Doctrina del enemigo de DIAMANTE (SATURNO = RDO-20001 «Operaciones», ed. 2012): esfuerzo
// principal / secundarios / reserva (Arts. 1004–1016), rompimiento y envolvimiento (751–773), reserva
// operacional sin empleo taxativo: magnitud, ubicación y direcciones probables (804–808), las tres
// decisiones del comandante operacional (622). Normas de distancia: RC-02-107 Fuerzas Contrarias,
// cap. V. Fases apreciadas: Tema Base DIAMANTE, I.C. Sin DOM: se prueba en Node.
import { distKm, largoKm, redondeo, fmtKm, fmtDia, sinTildes, NOM_ESCALON } from './modelo.mjs'
import { NOM_ARMA, RITMO_KM_DIA, fmtRelacion } from './analisis.mjs'

const e = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const limpio = (t) => String(t || '').replace(/\s*\((Chile|Bolivia|Per[uú]|Argentina|frontera)\)\s*/gi, '').trim()
const lista = (l, y = 'y') => { const a = l.filter(Boolean); return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ` ${y} ` + a[a.length - 1] }
const dia = (n) => fmtDia(Math.max(0, n))
const acorazada = (u) => ['blindada', 'mecanizada', 'cabmec'].includes(u.arma)

// ── la doctrina del enemigo, como datos ─────────────────────────────────────────────────
export const NORMAS = [
  ['Frente de una Brigada Acorazada o Mecanizada contra defensa preparada', '8 a 12 km', 'ref., de RC-02-107 (División ≈ 10 km con dos regimientos)'],
  ['Frente de una DE en el esfuerzo principal / en dirección secundaria', '20 a 30 km / 30 a 50 km', 'ref.'],
  ['Profundidad de una DE en marcha y ataque (destacamento avanzado a cola logística)', '60 a 100 km', 'RC-02-107: 20–40 + 10–18 + columnas de 30–60 km'],
  ['Destacamento avanzado (Regimiento o Batallón reforzado) delante del grueso', '20 a 40 km · 1 a 4 h', 'RC-02-107'],
  ['Segundo escalón de la DE detrás del primero', '10 a 18 km, por saltos', 'RC-02-107'],
  ['Reserva operativa de la Fuerza Terrestre detrás del primer escalón', '1 a 2 jornadas (60 a 150 km); empeño 24 a 48 h después de la decisión', 'ref.; RDO Art. 807 no fija distancia'],
  ['Zonas de apresto y áreas de reunión', '15 a 20 km de nuestras posiciones, del lado del enemigo', 'RC-02-107'],
  ['Ritmo sobre carretera sin oposición / contra resistencia dilatoria / contra defensa organizada', '60 a 100 · 20 a 40 · 5 a 15 km/día', 'ref. (el panel usa el ritmo en contacto por arma)'],
  ['Alcance del asalto aéreo (Batallón de Helicópteros)', '80 a 120 km desde la línea de contacto, un batallón por oleada; menos carga por la altura', 'ref.; Anexo D'],
  ['Autonomía antes del punto culminante', '3 a 4 días de combate desde la última base; pausa operativa en el primer nudo conquistado', 'ref.; Anexo B'],
  ['Aclimatación de la tropa que sube del nivel del mar', '7 a 10 días para rendimiento aceptable', 'Anexo D'],
  ['Puesto de comando de la DE', '20 a 40 km del frente', 'ref. (RC-02-107 da hasta 13 km a nivel táctico)'],
]
export const ARTICULACION = [
  ['Esfuerzo principal, secundarios y reserva (RDO Arts. 1004–1016)', 'El esfuerzo principal recibe la mejor dirección, la faja más estrecha, prioridad de fuegos, ingenieros, guerra electrónica e inteligencia, y la reserva se ubica a su retaguardia. 3:1 permite romper; 1:1 sólo amarra (Art. 1011). Si el secundario progresa más, el Comandante cambia el esfuerzo (Art. 1009).'],
  ['Dos maniobras tipo (RDO Arts. 751–773)', 'Rompimiento: fuerzas de amarre en todo el frente, de rompimiento (acorazadas), de explotación y reserva. Envolvimiento: fuerzas de envolvimiento móviles y con autonomía logística, de amarre que atraen nuestras reservas, y reserva. Prefiere envolver por el terreno abierto antes que chocar de frente.'],
  ['Reserva operacional (RDO Arts. 804–808)', 'La componente terrestre la conserva; debe poder actuar en cualquier parte del escenario; no tiene previsión taxativa de empleo: sólo magnitud, ubicación y direcciones probables (Art. 807). Las tres decisiones del comandante operacional: cómo iniciar, cuándo empeñar la reserva o el segundo escalón, cuándo terminar (Art. 622).'],
  ['Escalonamiento (RC-02-107, cap. V)', 'Uno o dos escalones con reserva de armas combinadas: dos escalones contra defensa preparada en el eje principal; el segundo se mueve por saltos 10 a 18 km detrás y se empeña por brechas o flancos. Un escalón con reserva pequeña en ejes secundarios o contra defensas débiles.'],
  ['Repertorio táctico (Apéndice 2 TTP)', 'Ataque metódico contra los pasos, con procedimiento abreviado contra las fracciones de seguridad; ataque en escenario estepárico con acorazados en amplio frente y profundidad; asalto aéreo e incursiones sobre nudos viales, puentes, aeródromos y PC; combate de encuentro contra nuestras reservas; evita los centros poblados; al conquistar, defensa en posición o perimétrica con reservas mecanizadas.'],
]
// Fases apreciadas del Tema Base (I.C); el fin de la F-III se estira si la DEOP principal tarda más.
export const FASES_TIPO = [
  ['F-I', 'Superioridad aérea, demostraciones y apresto', 0, 5],
  ['F-II', 'Conquista de los pasos y objetivos intermedios', 5, 10],
  ['F-III', 'Destrucción de las fuerzas y conquista de los recursos', 10, 20],
  ['F-IV', 'Mantenimiento del territorio conquistado', 20, 30],
]

// ── geometría chica ─────────────────────────────────────────────────────────────────────
// El punto a `km` del inicio de una polilínea (lng, lat).
export function puntoEnLinea(coords, km) {
  if (!coords?.length) return null
  if (km <= 0) return coords[0]
  let acum = 0
  for (let i = 1; i < coords.length; i++) {
    const d = distKm(coords[i - 1], coords[i])
    if (acum + d >= km) { const f = d ? (km - acum) / d : 0; return [coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * f, coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * f] }
    acum += d
  }
  return coords[coords.length - 1]
}
// El último punto del itinerario ya alcanzado a los `km`.
const alcanzado = (a, km) => { let p = a.puntos[0]; for (const q of a.puntos) if (q.km <= km + 0.5) p = q; return p }
// Objetivos intermedios: los puntos entre el paso y el destino, sin el gemelo del paso (Pisiga a 3 km de Colchane).
const oemDe = (a) => a.puntos.filter((p, i) => i > 0 && p.rol !== 'destino' && (p.km == null || p.km > 15))
const oenDe = (a) => a.puntos[a.puntos.length - 1]
const nombres = (us) => lista(us.map((u) => u.designacion))

// ── PASO 3: articulación de la fuerza enemiga (quién es esfuerzo principal, secundario, engaño, reserva) ──
export function articular({ analisis = [], prc = [], cae = null, unidades = { enemigas: [], propias: [] }, fuera = [], objetivo = '' }) {
  const poder = (a) => prc.find((r) => r.n === a.n)?.poderE || 0
  const conGente = analisis.filter((a) => a.enemigas.length)
  // Esfuerzo principal: si el G-2 escribió el objetivo estratégico vale lo que decidió caeOperacionales
  // (poder relativo + objetivo); si no, la DEOP con más poder enemigo absoluto (sin fichas azules las
  // relaciones empatan en «sin oposición» y caeOperacionales toma la primera).
  const masPoder = [...conGente].sort((x, y) => poder(y) - poder(x))[0]?.n
  const epN = (String(objetivo || '').trim() && cae?.probable?.n != null ? cae.probable.n : masPoder) ?? cae?.probable?.n ?? analisis[0]?.n
  const ep = analisis.find((a) => a.n === epN) || null
  const resto = analisis.filter((a) => a !== ep)
  // engaño / fijación: la secundaria cuyas fichas dicen «engaño / demostración / ataque limitado»; si
  // ninguna lo dice, una secundaria sin acorazados y con poco poder frente al principal
  const porRol = resto.find((a) => a.enemigas.length && a.enemigas.every((u) => u.rol === 'engaño'))
  const engano = porRol || (ep ? resto.filter((a) => a.enemigas.length && !a.enemigas.some(acorazada) && poder(a) <= 0.75 * poder(ep)).sort((x, y) => poder(x) - poder(y))[0] || null : null)
  const es = resto.filter((a) => a !== engano)
  const en = unidades.enemigas
  const lejos = new Set((fuera || []).map((f) => f.nombre))
  const reserva = en.filter((u) => u.rol === 'reserva' && !lejos.has(u.designacion))
  const reservaLejana = en.filter((u) => u.rol === 'reserva' && lejos.has(u.designacion))
  const apoyos = en.filter((u) => u.rol === 'apoyo')
  const comandos = en.filter((u) => u.rol === 'comando')
  const asignadas = new Set(analisis.flatMap((a) => a.enemigas))
  const sinDeop = en.filter((u) => !asignadas.has(u) && !['reserva', 'apoyo', 'comando'].includes(u.rol))
  return { ep, es, engano, reserva, reservaLejana, apoyos, comandos, sinDeop, poder }
}

// ── PASO 3: el modelo de la amenaza (plantilla doctrinal en palabras, BAV, decisiones del enemigo) ──
export function modeloAmenaza(ctx) {
  const { analisis = [], unidades = { enemigas: [], propias: [] }, nudos = [], teatro = {}, fuera = [], cruce = 5 } = ctx
  const art = articular(ctx)
  const { ep, es, engano, reserva, apoyos, comandos } = art
  if (!ep) return null
  const oem1 = oemDe(ep)[0] || null, oen = oenDe(ep)
  const armaEp = ep.enemigas.some(acorazada) ? 'acorazada' : 'motorizada'
  const descripcion =
    `Con la superioridad aérea asegurada en los primeros días, ${comandos.length ? `la fuerza terrestre enemiga (${nombres(comandos)}) ` : 'la fuerza terrestre enemiga '}` +
    `ocupa los pasos secundarios con fuerzas especiales y ataca metódicamente ${limpio(ep.puntos[0].nombre)}${ep.puntos[1] && distKm([ep.puntos[0].lng, ep.puntos[0].lat], [ep.puntos[1].lng, ep.puntos[1].lat]) <= 15 ? ` – ${limpio(ep.puntos[1].nombre)}` : ''} ` +
    `con ${nombres(ep.enemigas) || 'su primer escalón'} como esfuerzo principal por la ${ep.nombre.replace(/\s*·.*$/, '')}, aceptando uno a tres días por paso. ` +
    (oem1 ? `Pasado el paso lanza un destacamento avanzado 20 a 40 km adelante, asalta por helicóptero ${limpio(oem1.nombre)} (a ${fmtKm(oem1.km)} del paso) y hace pasar por la brecha a su fuerza ${armaEp}, que explota a ${ep.ritmo} km/día hacia ${limpio(oen.nombre)}, adonde llegaría hacia ${dia(cruce + ep.dias)} si no se la detiene. ` : '') +
    (es.length ? `${lista(es.map((a) => `${nombres(a.enemigas) || 'una fuerza'} por la DEOP ${a.n}`))} amarra${es.length > 1 ? 'n' : ''} y atrae${es.length > 1 ? 'n' : ''} nuestras reservas. ` : '') +
    (engano ? `Por la DEOP ${engano.n}, ${nombres(engano.enemigas)} demuestra${engano.enemigas.length > 1 ? 'n' : ''} y ataca${engano.enemigas.length > 1 ? 'n' : ''} limitadamente para fijar fuerzas propias. ` : '') +
    (reserva.length ? `La reserva operativa (${nombres(reserva)}) sigue una o dos jornadas atrás, sin empleo taxativo, y se empeña por la brecha o por el flanco abierto cuando el primer escalón ha fijado nuestras reservas. ` : 'No se le conoce reserva operativa: lo más probable es que la forme con su segundo escalón. ') +
    'Busca el combate de encuentro contra nuestras reservas con ventaja de ISTAR y ritmo, y a los tres o cuatro días de combate necesita una pausa logística. Conquistado el objetivo pasa a defensa en posición o perimétrica.'
  const bav = [
    comandos.length ? `Puestos de comando: ${nombres(comandos)}${comandos.some((u) => u.lugar) ? ` (${lista(comandos.filter((u) => u.lugar).map((u) => u.lugar))})` : ''} y los PC adelantados de las DE en los pasos.` : 'Puestos de comando de la fuerza terrestre y de sus Divisiones.',
    reserva.length ? `${nombres(reserva)} mientras marcha${reserva.length > 1 ? 'n' : ''}: es la reserva (o el esfuerzo principal encubierto); en columna es el blanco más rentable del teatro.` : 'Las acorazadas en columna de marcha hacia los pasos.',
    `Artillería de largo alcance${apoyos.some((u) => u.arma === 'artilleria') ? ` (${nombres(apoyos.filter((u) => u.arma === 'artilleria'))})` : ''}: su despliegue detrás de un paso delata la DEOP principal.`,
    `Helicópteros en tierra y medios SANT / guerra electrónica${apoyos.some((u) => u.arma === 'aviacion') ? ` (${nombres(apoyos.filter((u) => u.arma === 'aviacion'))})` : ''}.`,
    `Ejes y depósitos logísticos${(teatro.ejes || []).length ? `: ${lista((teatro.ejes || []).slice(0, 4).map((j) => j.nombre.replace(/^EJE\s*/i, '')))}` : ''}; puentes y combustible.`,
    `Zonas de apresto a 15–20 km de los pasos${(teatro.origenes || []).length ? ` (orígenes: ${lista((teatro.origenes || []).map((o) => o.nombre))})` : ''}, antes de ${dia(cruce)}.`,
  ]
  const nudoTxt = nudos.slice(0, 3).map((n) => n.nombre).join(', ')
  const decisiones = [
    engano ? { id: 'PD-E1', decision: `Convertir la acción de engaño de la DEOP ${engano.n} en esfuerzo principal, o mantenerla como engaño.`, ventana: `${dia(cruce - 3)} a ${dia(cruce + 1)}`, donde: `${reserva.length ? `¿Hacia qué paso marcha${reserva.length > 1 ? 'n' : ''} ${nombres(reserva)}?` : 'Zonas de apresto'}: ${limpio(engano.puntos[0].nombre)} o ${limpio(ep.puntos[0].nombre)}.` } : null,
    { id: 'PD-E2', decision: `Empeñar la reserva${reserva.length ? ` (${nombres(reserva)})` : ''}: explotar por la brecha de la DEOP ${ep.n}${es.length ? `, relevar por la DEOP ${es[0].n}` : ''} o desbordar por el campo abierto entre las direcciones.`, ventana: oem1 ? `${dia(cruce + oem1.dia)} a ${dia(cruce + oem1.dia + 3)}` : `${dia(cruce + 3)} a ${dia(cruce + 7)}`, donde: `${oem1 ? limpio(oem1.nombre) : 'primer objetivo intermedio'}${nudoTxt ? `; nudos ${nudoTxt}` : ''}.` },
    { id: 'PD-E3', decision: 'Cambiar el esfuerzo principal del ataque que falla al que progresa (RDO Art. 1009).', ventana: `toda la F-III (${dia(cruce + 5)} en adelante)`, donde: `Nudos de bifurcación: ${lista([...oemDe(ep).map((p) => limpio(p.nombre)), ...es.flatMap((a) => oemDe(a).slice(0, 1).map((p) => limpio(p.nombre)))].slice(0, 4)) || nudoTxt || '—'}.` },
    { id: 'PD-E4', decision: `Proseguir más allá de ${limpio(oen.nombre)} o consolidar lo conquistado.`, ventana: `${dia(cruce + ep.dias)} a ${dia(cruce + ep.dias + 5)}`, donde: `${limpio(oen.nombre)}: relevos, defensa perimétrica, reserva mecanizada.` },
    fuera.length || art.reservaLejana.length ? { id: 'PD-E5', decision: `Empleo de los refuerzos lejanos${art.reservaLejana.length ? ` y de la reserva estratégica (${nombres(art.reservaLejana)})` : ''}: ${lista([...new Set([...art.reservaLejana.map((u) => u.designacion), ...fuera.map((f) => f.nombre)])].slice(0, 5))}.`, ventana: 'a orden', donde: 'Aeródromos y puertos del enemigo; ejes de aproximación hacia los pasos.' } : null,
  ].filter(Boolean)
  return { art, descripcion, bav, decisiones, normas: NORMAS, articulacion: ARTICULACION }
}

// ── PASO 4: los dos CAE por fases ───────────────────────────────────────────────────────
// Más peligroso: la DEOP que antes llega a una capital (población de rango 1) o al CG propio con las
// acorazadas concentradas; si ninguna pasa por una capital, vale lo que ya decidió caeOperacionales.
export function deopMasPeligrosa({ analisis = [], cae = null, capas = null, probableN = null }) {
  const capitales = (capas?.poblaciones || []).filter((p) => p[1] === 1)
  const cand = analisis.map((a) => {
    const c = capitales.map((p) => ({ nombre: p[0], d: Math.min(...a.coords.map((q) => distKm(q, [p[2], p[3]]))) })).filter((x) => x.d <= 25).sort((x, y) => x.d - y.d)[0]
    return c ? { a, capital: c.nombre, dias: a.dias } : null
  }).filter(Boolean).sort((x, y) => x.dias - y.dias)
  const otra = cand.find((c) => c.a.n !== probableN) || cand[0]
  if (otra) return { n: otra.a.n, porque: `llega a ${otra.capital} (capital) hacia ${dia(otra.a.dias)} contado desde el cruce` }
  if (cae?.peligroso?.n != null) return { n: cae.peligroso.n, porque: 'pasa más cerca del Puesto de Comando propio' }
  return { n: analisis[0]?.n, porque: '' }
}

function fasesDe(ep, cruce) {
  const fin3 = Math.max(20, Math.ceil(cruce + ep.dias) + 1)
  return FASES_TIPO.map(([id, nombre, de, a], i) => ({ id, nombre, de: i === 3 ? fin3 : de, a: i === 2 ? fin3 : i === 3 ? fin3 + 10 : a }))
}
function armarCae({ id, tipo, epN, analisis, prc = [], unidades, art, cruce, nudos, capas, objetivo, concentrar }) {
  const ep = analisis.find((a) => a.n === epN)
  if (!ep) return null
  const rel = prc.find((r) => r.n === epN)?.relacion
  const otras = analisis.filter((a) => a.n !== epN && a.enemigas.length)
  const engano = art.engano && art.engano.n !== epN ? art.engano : null
  const secundarias = otras.filter((a) => a !== engano)
  const reserva = art.reserva
  const aviacion = art.apoyos.filter((u) => u.arma === 'aviacion' || u.arma === 'aerotransportada')
  const fases = fasesDe(ep, cruce)
  const oem = oemDe(ep), oem1 = oem[0] || null, oen = oenDe(ep)
  const ritmoRes = reserva.length ? Math.max(...reserva.map((u) => RITMO_KM_DIA[u.arma] || 20)) : 30
  const dEmpeno = cruce + (oem1 ? oem1.dia : 2) + 1
  const aero = (p) => (capas?.aerodromos || []).map((x) => ({ n: x[1] || x[0], d: distKm([x[3], x[4]], [p.lng, p.lat]) })).filter((x) => x.d <= 30).sort((x, y) => x.d - y.d)[0]
  const nudoAbierto = (nudos || []).map((n) => ({ n, d: Math.min(...ep.coords.map((q) => distKm(q, [n.lng, n.lat]))) })).filter((x) => x.d > 15 && x.d < 90).sort((x, y) => x.d - y.d)[0]?.n || null
  const acciones = fases.map((f) => {
    const acc = []
    const pos = (a, kmLim) => { const km = Math.min(a.kmRuta, Math.max(0, kmLim)); const p = puntoEnLinea(a.coords, km); const alc = alcanzado(a, km); return { lng: p[0], lat: p[1], km, lugar: limpio(alc.nombre), llego: km >= a.kmRuta - 0.5 } }
    const porDeop = (a, papel) => {
      const u = nombres(a.enemigas) || 'fuerza sin identificar'
      const paso = limpio(a.puntos[0].nombre)
      if (f.id === 'F-I') acc.push({ quien: u, deop: a.n, papel, que: papel === 'engaño' ? `demostraciones y ataques limitados frente a ${paso}; emisiones de una División completa` : `ramificación y apresto frente a ${paso}; reconocimiento, SANT y fuerzas especiales en los pasos secundarios`, dia: cruce, ...pos(a, 0) })
      else if (f.id === 'F-II') { const p = pos(a, a.ritmo * (f.a - cruce)); acc.push({ quien: u, deop: a.n, papel, que: papel === 'engaño' ? `ataque limitado sobre ${paso} ${dia(cruce)} para fijar; mantiene la presión sin empeñarse` : `ruptura de ${paso} ${dia(cruce)}–${dia(cruce + 1)} (3:1); destacamento avanzado 20–40 km adelante; alcanza ${p.lugar} ${dia(cruce + alcanzado(a, p.km).dia)}${p.km > 80 ? '; pausa logística de 24 h' : ''}`, dia: f.a, ...p }) }
      else if (f.id === 'F-III') { const p = pos(a, a.ritmo * (f.a - cruce)); acc.push({ quien: u, deop: a.n, papel, que: papel === 'engaño' ? `mantiene la fijación; si el frente propio se debilita, avanza hacia ${limpio((oemDe(a)[0] || oenDe(a)).nombre)}` : `explotación hacia ${limpio(oenDe(a).nombre)} (${dia(cruce + a.dias)}); ${a === ep ? 'converge sobre el objetivo con el esfuerzo principal' : 'amarra y atrae las reservas propias'}`, dia: Math.min(f.a, cruce + a.dias), ...p }) }
      else acc.push({ quien: u, deop: a.n, papel, que: a === ep ? `defensa perimétrica de ${limpio(oenDe(a).nombre)} con reserva mecanizada; resistencia dilatoria donde haya contraofensiva` : `defensa en posición de ${limpio((oemDe(a).slice(-1)[0] || oenDe(a)).nombre)}`, dia: f.de, ...pos(a, a.kmRuta) })
    }
    porDeop(ep, 'esfuerzo principal')
    for (const a of secundarias) porDeop(a, 'esfuerzo secundario')
    if (engano) porDeop(engano, 'engaño')
    if (reserva.length) {
      const u = nombres(reserva), origen = reserva.find((x) => x.lugar)?.lugar || 'su zona de reunión'
      const r0 = reserva[0]
      if (f.id === 'F-I') acc.push({ quien: u, deop: null, papel: 'reserva', que: concentrar ? `se reúne detrás del esfuerzo principal, frente a ${limpio(ep.puntos[0].nombre)} (INDICADOR CLAVE)` : `concentrada en ${origen}, a distancia parecida de dos pasos: posición deliberadamente ambigua`, dia: cruce, lng: r0.lng, lat: r0.lat, lugar: origen })
      else if (f.id === 'F-II') { const p = concentrar ? pos(ep, ep.ritmo * (f.a - cruce) - 15) : { lng: ep.puntos[0].lng, lat: ep.puntos[0].lat, lugar: limpio(ep.puntos[0].nombre) }; acc.push({ quien: u, deop: ep.n, papel: 'reserva', que: concentrar ? `pasa por la brecha detrás del primer escalón y releva al ritmo de ${ritmoRes} km/día` : `${dia(cruce + 2)} marcha hacia ${limpio(ep.puntos[0].nombre)} y queda en zona de espera detrás del paso (1 a 2 jornadas del primer escalón)`, dia: f.a, ...p }) }
      else if (f.id === 'F-III') { const km = (oem1 ? oem1.km : 0) + ritmoRes * Math.max(0, f.a - dEmpeno); const p = pos(ep, km); acc.push({ quien: u, deop: ep.n, papel: 'reserva', que: `EMPEÑO ${dia(dEmpeno)} (PD-E2): por la brecha de ${oem1 ? limpio(oem1.nombre) : 'la DEOP'}${nudoAbierto ? ` o por el campo abierto hacia ${nudoAbierto.nombre}` : ''}; combate de encuentro con la reserva propia ${dia(dEmpeno + 1)}–${dia(dEmpeno + 4)}; decide sobre ${limpio(oen.nombre)} ${dia(cruce + ep.dias)}–${dia(cruce + ep.dias + 3)}`, dia: f.a, ...p }) }
      else acc.push({ quien: u, deop: ep.n, papel: 'reserva', que: `reserva mecanizada en ${limpio(oen.nombre)} para contraatacar`, dia: f.de, ...pos(ep, ep.kmRuta) })
    }
    if (aviacion.length) {
      const u = nombres(aviacion)
      if (f.id === 'F-I') acc.push({ quien: u, deop: null, papel: 'apoyo', que: 'superioridad aérea; SANT sobre nuestra línea de defensa; incursiones de fuerzas especiales', dia: cruce, lng: aviacion[0].lng, lat: aviacion[0].lat, lugar: aviacion[0].lugar || '' })
      else if (f.id === 'F-II' && oem1) acc.push({ quien: u, deop: ep.n, papel: 'apoyo', que: `asalto aéreo de un Batallón sobre ${limpio(oem1.nombre)} ${dia(cruce + 1)}–${dia(cruce + 2)} para tomar el nudo antes que lo reforcemos; interdicción de los ejes hacia él`, dia: cruce + 2, lng: oem1.lng, lat: oem1.lat, lugar: limpio(oem1.nombre) })
      else if (f.id === 'F-III') { const ad = aero(oen); acc.push({ quien: u, deop: ep.n, papel: 'apoyo', que: `incursiones sobre ${ad ? `el aeródromo ${ad.n}` : limpio(oen.nombre)} y los puentes del eje propio de refuerzo; artillería de la fuerza terrestre salta a ${oem1 ? limpio(oem1.nombre) : 'la brecha'}`, dia: f.de + 1, lng: oen.lng, lat: oen.lat, lugar: limpio(oen.nombre) }) }
    }
    return { ...f, ventana: `${dia(f.de)} a ${dia(f.a)}`, acciones: acc }
  })
  const enunciado =
    `La fuerza terrestre enemiga ataca a partir del día D con ${nombres(ep.enemigas) || 'su primer escalón'} como ESFUERZO PRINCIPAL por la ${ep.nombre.replace(/\s*·\s*/, ' (')}${/\(/.test(ep.nombre.replace(/\s*·\s*/, ' (')) ? ')' : ''}` +
    (secundarias.length ? `, ${lista(secundarias.map((a) => `${nombres(a.enemigas) || 'una fuerza'} como esfuerzo secundario por la DEOP ${a.n}`))}` : '') +
    (engano ? ` y ${nombres(engano.enemigas)} fijando por la DEOP ${engano.n} con demostraciones y ataques limitados` : '') +
    (reserva.length ? `; mantiene como reserva operativa a ${nombres(reserva)}${concentrar ? ', reunida detrás del esfuerzo principal,' : ''} y la empeña hacia ${dia(dEmpeno)} ${oem1 ? `por la brecha de ${limpio(oem1.nombre)}` : 'por la brecha'}${nudoAbierto && !concentrar ? ` o por el campo abierto hacia ${nudoAbierto.nombre}` : ''}` : '') +
    `, para alcanzar ${limpio(oen.nombre)} entre ${dia(cruce + ep.dias)} y ${dia(cruce + ep.dias + 3)}${objetivo ? ` y conquistar ${objetivo}` : ''}, ` +
    (tipo === 'peligroso' ? 'forzar la decisión sobre nuestros centros de mando y cortar el teatro, ' : '') + 'y defender lo conquistado.'
  const reservaTxt = reserva.length ? {
    magnitud: `${nombres(reserva)} (${lista([...new Set(reserva.map((u) => `${(NOM_ESCALON[u.escalon] || u.escalon).replace(/\s*\(.*\)/, '')} ${NOM_ARMA[u.arma] || u.arma}`))])})`,
    ubicacion: concentrar ? `detrás del esfuerzo principal, frente a ${limpio(ep.puntos[0].nombre)}` : `${lista([...new Set(reserva.map((u) => u.lugar).filter(Boolean))]) || 'zona de reunión'} hasta ${dia(cruce + 2)}; zona de espera detrás de ${limpio(ep.puntos[0].nombre)} desde ${dia(cruce + 4)}`,
    direcciones: [
      `a) por la brecha de la DEOP ${ep.n} hacia ${limpio((oem[1] || oen).nombre)} si nuestro frente se desmorona`,
      nudoAbierto ? `b) por el campo abierto hacia ${nudoAbierto.nombre} para desbordar y llegar a ${limpio(oen.nombre)} antes que nuestra reserva` : null,
      secundarias.length ? `c) hacia la DEOP ${secundarias[0].n} si allí progresa más (RDO Art. 1009)` : null,
      engano ? `d) hacia la DEOP ${engano.n} si el engaño encuentra el frente propio vacío` : null,
    ].filter(Boolean),
    condicion: `nuestra reserva empeñada o detectada en marcha; ${oem1 ? `${limpio(oem1.nombre)} en su poder` : 'brecha abierta'}; terreno abierto transitable en la época.`,
  } : null
  const porque = tipo === 'probable'
    ? [`Es la DEOP con más poder enemigo relativo (${Number.isFinite(rel) ? fmtRelacion(rel) : 'sin cálculo'}) y su itinerario lleva al objetivo estratégico.`, 'Cumple su doctrina: amarra con lo barato, rompe con acorazados, explota con la reserva por el terreno abierto y busca el combate de encuentro.', `Llega a ${limpio(oen.nombre)} hacia ${dia(cruce + ep.dias)}: antes que una reserva propia que salga tarde.`]
    : [`Concentra las acorazadas en la DEOP ${ep.n}, la que antes alcanza un centro de decisión propio (${limpio(oen.nombre)}).`, 'Corta el teatro en dos y separa a las FF.TT.T.O. de su base logística: obliga a mover la reserva propia bajo superioridad aérea enemiga.', `El indicador llega temprano: la reserva enemiga reunida frente a ${limpio(ep.puntos[0].nombre)} entre ${dia(cruce - 3)} y ${dia(cruce - 1)}.`]
  return { id, tipo, n: epN, deop: ep.nombre, enunciado, fases: acciones, reserva: reservaTxt, porque, dEmpeno, oen: limpio(oen.nombre) }
}
export function caePorFases(ctx) {
  const { analisis = [], prc = [], cae = null, unidades = { enemigas: [], propias: [] }, ains = [], nudos = [], capas = null, cruce = 5, objetivo = '' } = ctx
  if (!analisis.length) return null
  const art = articular(ctx)
  if (!art.ep) return null
  const probableN = art.ep.n
  const pel = deopMasPeligrosa({ analisis, cae, capas, probableN })
  const peligrosoN = pel.n === probableN && analisis.length > 1 ? (cae?.peligroso?.n != null && cae.peligroso.n !== probableN ? cae.peligroso.n : analisis.find((a) => a.n !== probableN).n) : pel.n
  const base = { analisis, prc, unidades, art, cruce, nudos, capas, objetivo }
  const c1 = armarCae({ ...base, id: 'CAE-1', tipo: 'probable', epN: probableN, concentrar: false })
  const c2 = armarCae({ ...base, id: 'CAE-2', tipo: 'peligroso', epN: peligrosoN, concentrar: true })
  if (c2) c2.criterio = pel.porque
  // matriz de eventos: las A.I.N. del panel más la de la reserva, con qué CAE confirma cada una
  const matriz = ains.map((a) => {
    const en1 = a.deop.includes(probableN), en2 = a.deop.includes(peligrosoN)
    return { ain: a.id, lugar: a.nombre, tipo: a.tipo, ventana: `${dia(a.net + cruce)} a ${dia(a.nlt + cruce)}`, indicador: a.indicador, confirma: en1 && en2 ? 'los dos CAE (el poder que pasa dice cuál)' : en1 ? 'CAE-1' : en2 ? 'CAE-2' : 'secundaria', lng: a.lng, lat: a.lat }
  })
  if (art.reserva.length) {
    const r = art.reserva[0], ep1 = analisis.find((a) => a.n === probableN), ep2 = analisis.find((a) => a.n === peligrosoN)
    matriz.unshift({ ain: 'AIN-R', lugar: r.lugar || nombres(art.reserva), tipo: 'reserva', ventana: `${dia(cruce - 3)} a ${dia(cruce + 2)}`, indicador: `${nombres(art.reserva)} sale${art.reserva.length > 1 ? 'n' : ''} hacia ${limpio(ep2.puntos[0].nombre)} (CAE-2) o hacia ${limpio(ep1.puntos[0].nombre)} (CAE-1)`, confirma: 'CAE-1 o CAE-2: el indicador más temprano del teatro', lng: r.lng, lat: r.lat })
  }
  const rpi = [
    art.reserva.length ? { id: 'RPI-1', pregunta: `¿Dónde está${art.reserva.length > 1 ? 'n' : ''} y hacia qué paso marcha${art.reserva.length > 1 ? 'n' : ''} ${nombres(art.reserva)}?`, deSerAsi: 'el CAE queda confirmado antes del cruce de los pasos.', atencion: `${lista([...new Set(art.reserva.map((u) => u.lugar).filter(Boolean))]) || 'zonas de reunión'} y los ejes hacia ${limpio(c1.fases[0].acciones[0].lugar)} y ${limpio(c2.fases[0].acciones[0].lugar)}, ${dia(cruce - 3)} a ${dia(cruce + 2)}.` } : { id: 'RPI-1', pregunta: '¿Con qué fuerza acorazada cuenta el enemigo y dónde la reúne?', deSerAsi: 'esa es su reserva o su esfuerzo principal.', atencion: 'zonas de reunión a 15–20 km de los pasos.' },
    { id: 'RPI-2', pregunta: `¿Qué magnitud se apresta frente a cada paso (${lista(analisis.map((a) => limpio(a.puntos[0].nombre)))})?`, deSerAsi: `una División con artillería 155 frente a ${limpio(art.ep.puntos[0].nombre)} confirma el CAE-1.`, atencion: `zonas de apresto, medios de franqueo, artillería de largo alcance, ${dia(cruce - 2)} a ${dia(cruce + 1)}.` },
    { id: 'RPI-3', pregunta: `¿Con qué rompe el paso de la DEOP ${peligrosoN} (${limpio(analisis.find((a) => a.n === peligrosoN).puntos[0].nombre)}): acorazados o infantería motorizada?`, deSerAsi: 'acorazados = CAE-2; infantería sola = engaño del CAE-1.', atencion: `${dia(cruce)} a ${dia(cruce + 3)}.` },
    { id: 'RPI-4', pregunta: '¿Cuándo y por dónde se empeña la reserva operativa enemiga?', deSerAsi: 'es el punto de decisión de nuestra reserva (PD-3).', atencion: `${c1.reserva ? c1.reserva.direcciones.join('; ') : 'brechas y campo abierto'}, ${dia(c1.dEmpeno - 1)} a ${dia(c1.dEmpeno + 3)}.` },
    { id: 'RPI-5', pregunta: `¿Hacia dónde continúa el enemigo después de ${c1.oen}: consolida o prosigue?`, deSerAsi: 'cambia la segunda campaña.', atencion: `${dia(cruce + art.ep.dias)} a ${dia(cruce + art.ep.dias + 5)}.` },
  ]
  const ep2 = analisis.find((a) => a.n === peligrosoN)
  const propias = [
    { id: 'PD-1', decision: `Orientar la reserva de las FF.TT.T.O. hacia la DEOP ${peligrosoN} (CAE-2) o mantenerla frente a la DEOP ${probableN} (CAE-1).`, aMasTardar: `${dia(cruce + 1)} (la marcha toma una o dos noches)`, ain: 'AIN-R y los pasos', ais: `pampa delante de ${limpio((oemDe(ep2)[0] || oenDe(ep2)).nombre)} o campo abierto de la DEOP ${probableN}` },
    { id: 'PD-2', decision: `Autorizar al CE del frente a ceder ${c1.fases[1].acciones[0].lugar} y defender atrás, o reforzarlo.`, aMasTardar: dia(cruce + 2), ain: matriz.filter((m) => m.confirma === 'CAE-1').slice(0, 2).map((m) => m.ain).join(', ') || '—', ais: `${c1.fases[1].acciones[0].lugar} y su nudo` },
    { id: 'PD-3', decision: 'Contraatacar con la reserva a la fuerza acorazada enemiga cuando entra al campo abierto, o cerrar el objetivo.', aMasTardar: dia(c1.dEmpeno), ain: 'AIN de los objetivos intermedios', ais: `campo abierto entre la DEOP ${probableN} y sus vecinas` },
    { id: 'PD-4', decision: 'Empeñar la fuerza aeromóvil propia contra el asalto aéreo enemigo.', aMasTardar: 'en las 6 h siguientes al desembarco', ain: 'nudos y aeródromos', ais: 'zona de desembarco enemiga' },
    { id: 'PD-5', decision: `Desplazar una División del CE menos atacado hacia la DEOP que se confirme.`, aMasTardar: dia(cruce + 7), ain: 'todas', ais: '—' },
  ]
  return { probable: c1, peligroso: c2, matriz, rpi, propias, cruce, probableN, peligrosoN }
}

// ── el prompt para la IA (la app no la llama: el oficial lo pega donde quiera) ───────────
export function promptIA({ ejercicio = '', resumen = null, analisis = [], prc = [], unidades = { enemigas: [], propias: [] }, ains = [], nudos = [], modelo = null, caes = null, cruce = 5, objetivo = '', notas = {} }) {
  const L = []
  const fila = (...c) => L.push('| ' + c.map((x) => String(x ?? '').replace(/\|/g, '/')).join(' | ') + ' |')
  L.push(`# PICB del Teatro · ${ejercicio || 'ejercicio'} — Pasos 3 y 4 a nivel Fuerza Terrestre (FF.TT.T.O.)`)
  L.push('')
  L.push('Sos el G-2 de las Fuerzas Terrestres de un Teatro de Operaciones. Aplicá los pasos 3 (Evaluar la amenaza) y 4 (Determinar los cursos de acción del enemigo) del PICB a escala operacional, como manda el PMTD 2017 (Análisis de la Misión) y el RO-02-01-03, con los datos de abajo. Respondé en español, en el lenguaje doctrinario boliviano, y **sólo con el JSON del final** (sin texto antes ni después).')
  L.push('')
  L.push('## 1. Teatro')
  if (resumen) L.push(`- TO de ${fmtKm(resumen.km2).replace(' km', ' km²')} (${Math.round(resumen.anchoKm)} × ${Math.round(resumen.altoKm)} km)${resumen.subteatros?.length ? `; subteatros: ${resumen.subteatros.map((s) => s.nombre).join(', ')}` : ''}${resumen.aos?.length ? `; AO de los CE: ${resumen.aos.map((s) => s.nombre).join(', ')}` : ''}.`)
  if (objetivo) L.push(`- Objetivo estratégico del enemigo (Apreciación de Inteligencia Estratégica): ${objetivo}.`)
  L.push(`- Los D+n de los itinerarios cuentan desde el cruce de los pasos; el cruce se aprecia el D+${cruce} (fase I = superioridad aérea y apresto).`)
  if (nudos.length) L.push(`- Terreno decisivo (nudos de comunicaciones): ${nudos.map((n) => n.nombre).join(', ')}.`)
  L.push('')
  L.push('## 2. Direcciones estratégicas operativas (medidas sobre la red vial)')
  fila('DEOP', 'Itinerario (D+n desde el cruce)', 'km', 'Mejor vía', 'Admite', 'Ritmo', 'Enemigo asignado', 'Propio enfrente', 'Relación')
  fila('---', '---', '---', '---', '---', '---', '---', '---', '---')
  for (const a of analisis) { const r = prc.find((x) => x.n === a.n); fila(a.nombre, a.puntos.map((p) => `${limpio(p.nombre)} ${dia(p.dia)}`).join(' → '), Math.round(a.kmRuta), a.via, a.magnitud, `${a.ritmo} km/día`, a.enemigas.map((u) => u.designacion).join(', ') || '—', a.propias.map((u) => u.designacion).join(', ') || '—', r ? fmtRelacion(r.relacion) : '—') }
  L.push('')
  L.push('## 3. Grandes Unidades')
  fila('Bando', 'Unidad', 'Escalón', 'Arma', 'Rol conocido', 'DEOP', 'Lugar', 'Poder (ref.)')
  fila('---', '---', '---', '---', '---', '---', '---', '---')
  for (const u of unidades.enemigas) fila('ENEMIGO', u.designacion, (NOM_ESCALON[u.escalon] || u.escalon).replace(/\s*\(.*\)/, ''), NOM_ARMA[u.arma] || u.arma, u.rol || '—', u.deop || '—', u.lugar || '—', u.poder)
  for (const u of unidades.propias) fila('PROPIO', u.designacion, (NOM_ESCALON[u.escalon] || u.escalon).replace(/\s*\(.*\)/, ''), NOM_ARMA[u.arma] || u.arma, u.rol || '—', u.deop || '—', u.lugar || '—', u.poder)
  L.push('')
  L.push('## 4. Áreas de Interés Nombradas que ya trazó el panel')
  for (const a of ains) L.push(`- ${a.id} ${a.nombre} (DEOP ${a.deop.join('/')}, ${a.tipo}, entre ${dia(a.net + cruce)} y ${dia(a.nlt + cruce)}): ${a.indicador}.`)
  L.push('')
  L.push('## 5. Doctrina del enemigo (resumen que debés respetar)')
  for (const [t, d] of ARTICULACION) L.push(`- **${t}.** ${d}`)
  L.push('- Normas de distancia y tiempo a escala teatro: ' + NORMAS.map(([n, v]) => `${n}: ${v}`).join('; ') + '.')
  L.push(`- Fases apreciadas: ${FASES_TIPO.map(([id, n, de, a]) => `${id} ${n} (D+${de} a D+${a})`).join('; ')}.`)
  if (notas.paso3) L.push(`- Notas del G-2 (paso 3): ${notas.paso3}`)
  L.push('')
  L.push('## 6. Lo que el motor ya propone (mejoralo, no lo repitas)')
  if (modelo) { L.push(`- Modelo: ${modelo.descripcion}`); for (const d of modelo.decisiones) L.push(`- ${d.id}: ${d.decision} (${d.ventana}; ${d.donde})`) }
  if (caes) { L.push(`- ${caes.probable.id} (más probable, DEOP ${caes.probable.n}): ${caes.probable.enunciado}`); L.push(`- ${caes.peligroso.id} (más peligroso, DEOP ${caes.peligroso.n}${caes.peligroso.criterio ? `, ${caes.peligroso.criterio}` : ''}): ${caes.peligroso.enunciado}`) }
  if (notas.caeProbable || notas.caePeligroso) L.push(`- Lo que ya escribió el G-2: ${[notas.caeProbable, notas.caePeligroso].filter(Boolean).join(' · ')}`)
  L.push('')
  L.push('## 7. Lo que tenés que producir')
  L.push('1. **Modelo de la amenaza**: cómo articula el enemigo su fuerza terrestre (esfuerzo principal, secundarios, engaño, reserva operativa con magnitud, ubicación, direcciones probables y condición de empeño, apoyos), descripción en palabras de cómo ataca, blancos de alto valor y los puntos de decisión del Comandante enemigo con su ventana en D+n y dónde se verían.')
  L.push('2. **Dos CAE**: el más probable y el más peligroso. Cada uno con enunciado (quién, qué, cuándo, dónde, cómo, para qué), las cuatro fases con acciones por Gran Unidad (unidad, acción, lugar, D+n), el empleo de la reserva y por qué es probable o peligroso. Usá sólo las DEOP y las unidades de las tablas; los D+n deben ser coherentes con los itinerarios.')
  L.push('3. **Matriz de eventos**: para cada A.I.N. (podés agregar hasta 4 más) el indicador, la ventana y qué CAE confirma.')
  L.push('4. **RPI** (3 a 5) y **puntos de decisión propios** (3 a 5) con «a más tardar», A.I.N. que lo alimenta y A.I.S. donde se aplica el poder de combate.')
  L.push('')
  L.push('## 8. Formato de la respuesta: EXACTAMENTE este JSON (sin comentarios, sin texto fuera del JSON)')
  L.push('```json')
  L.push(JSON.stringify({
    modelo: { descripcion: 'texto', articulacion: { ep: { deop: 2, unidades: ['…'], porque: '…' }, secundarias: [{ deop: 3, unidades: ['…'], papel: '…' }], engano: { deop: 1, unidades: ['…'] }, reserva: { unidades: ['…'], ubicacion: '…', direcciones: ['…'], condicion: '…' }, apoyos: '…' }, bav: ['…'], decisiones: [{ id: 'PD-E1', decision: '…', ventana: 'D+2 a D+6', donde: '…' }] },
    cae: [{ id: 'CAE-1', tipo: 'probable', deop: 2, enunciado: '…', fases: [{ id: 'F-I', ventana: 'D a D+5', acciones: [{ quien: 'unidad', que: 'acción', lugar: 'lugar', dia: 'D+5' }] }], reserva: { magnitud: '…', ubicacion: '…', empeno: 'D+11 por …', direcciones: ['…'], condicion: '…' }, porque: ['…'] }, { id: 'CAE-2', tipo: 'peligroso', deop: 1, enunciado: '…', fases: [], reserva: {}, porque: ['…'] }],
    matriz: [{ ain: 'AIN-1', lugar: '…', indicador: '…', ventana: 'D+5 a D+8', confirma: 'CAE-1' }],
    rpi: [{ id: 'RPI-1', pregunta: '…', deSerAsi: '…', atencion: '…' }],
    decisionesPropias: [{ id: 'PD-1', decision: '…', aMasTardar: 'D+6', ain: 'AIN-1', ais: '…' }],
  }, null, 1))
  L.push('```')
  return L.join('\n')
}

// ── pegar la respuesta de la IA ─────────────────────────────────────────────────────────
// Acepta el JSON solo o envuelto en ```json … ```; devuelve { ok, datos | error }. No ejecuta nada.
export function leerRespuestaIA(texto) {
  const t = String(texto || '').trim()
  if (!t) return { ok: false, error: 'No hay nada pegado.' }
  const i = t.indexOf('{'), j = t.lastIndexOf('}')
  if (i < 0 || j <= i) return { ok: false, error: 'No encuentro un JSON (tiene que empezar con { y terminar con }).' }
  let d
  try { d = JSON.parse(t.slice(i, j + 1)) } catch (err) { return { ok: false, error: 'El JSON no se puede leer: ' + (err.message || err) } }
  if (!d || typeof d !== 'object') return { ok: false, error: 'La respuesta no es un objeto JSON.' }
  const cae = Array.isArray(d.cae) ? d.cae.filter((c) => c && typeof c.enunciado === 'string') : []
  if (!cae.length) return { ok: false, error: 'La respuesta no trae «cae» con al menos un curso de acción con su enunciado.' }
  const s = (x) => (x == null ? '' : String(x)).slice(0, 4000)
  const arr = (x) => (Array.isArray(x) ? x : []).slice(0, 40)
  const datos = {
    modelo: d.modelo && typeof d.modelo === 'object' ? {
      descripcion: s(d.modelo.descripcion), articulacion: d.modelo.articulacion && typeof d.modelo.articulacion === 'object' ? d.modelo.articulacion : null,
      bav: arr(d.modelo.bav).map(s), decisiones: arr(d.modelo.decisiones).filter((x) => x && typeof x === 'object').map((x) => ({ id: s(x.id), decision: s(x.decision), ventana: s(x.ventana), donde: s(x.donde) })),
    } : null,
    cae: cae.slice(0, 3).map((c, k) => ({
      id: s(c.id) || `CAE-${k + 1}`, tipo: /pelig/i.test(s(c.tipo)) ? 'peligroso' : k === 1 && !c.tipo ? 'peligroso' : 'probable', deop: Number(c.deop) || null, enunciado: s(c.enunciado),
      fases: arr(c.fases).filter((f) => f && typeof f === 'object').map((f) => ({ id: s(f.id), nombre: s(f.nombre), ventana: s(f.ventana), acciones: arr(f.acciones).map((x) => typeof x === 'string' ? { que: s(x) } : x && typeof x === 'object' ? { quien: s(x.quien), que: s(x.que), lugar: s(x.lugar), dia: s(x.dia) } : null).filter(Boolean) })),
      reserva: c.reserva && typeof c.reserva === 'object' ? { magnitud: s(c.reserva.magnitud), ubicacion: s(c.reserva.ubicacion), empeno: s(c.reserva.empeno), direcciones: arr(c.reserva.direcciones).map(s), condicion: s(c.reserva.condicion) } : null,
      porque: arr(c.porque).map(s),
    })),
    matriz: arr(d.matriz).filter((x) => x && typeof x === 'object').map((x) => ({ ain: s(x.ain), lugar: s(x.lugar), indicador: s(x.indicador), ventana: s(x.ventana), confirma: s(x.confirma) })),
    rpi: arr(d.rpi).filter((x) => x && typeof x === 'object').map((x) => ({ id: s(x.id), pregunta: s(x.pregunta), deSerAsi: s(x.deSerAsi), atencion: s(x.atencion) })),
    propias: arr(d.decisionesPropias || d.pd || d.puntosDecision).filter((x) => x && typeof x === 'object').map((x) => ({ id: s(x.id), decision: s(x.decision), aMasTardar: s(x.aMasTardar), ain: s(x.ain), ais: s(x.ais) })),
  }
  const resumen = `${datos.cae.length} CAE, ${datos.matriz.length} filas de matriz, ${datos.rpi.length} RPI, ${datos.propias.length} PD propios${datos.modelo ? ', modelo de la amenaza' : ''}`
  return { ok: true, datos, resumen }
}
// La vista que se muestra: lo de la IA (si se pegó) encima de lo del motor, con su fuente.
export function vista(motorModelo, motorCaes, ia) {
  if (!ia) return { modelo: motorModelo, caes: motorCaes, fuente: 'motor' }
  const pick = (tipo, k) => ia.cae.find((c) => c.tipo === tipo) || ia.cae[k] || null
  const mezclar = (m, c) => m ? { ...m, ...(c ? { enunciado: c.enunciado || m.enunciado, fasesIA: c.fases?.length ? c.fases : null, reservaIA: c.reserva, porque: c.porque?.length ? c.porque : m.porque, fuente: 'IA' } : {}) } : (c ? { id: c.id, tipo: c.tipo, n: c.deop, enunciado: c.enunciado, fases: [], fasesIA: c.fases, reservaIA: c.reserva, porque: c.porque, fuente: 'IA' } : null)
  const caes = motorCaes ? { ...motorCaes } : { matriz: [], rpi: [], propias: [] }
  caes.probable = mezclar(motorCaes?.probable, pick('probable', 0))
  caes.peligroso = mezclar(motorCaes?.peligroso, pick('peligroso', 1))
  if (ia.matriz.length) caes.matriz = ia.matriz.map((x) => ({ ...x, fuente: 'IA' }))
  if (ia.rpi.length) caes.rpi = ia.rpi
  if (ia.propias.length) caes.propias = ia.propias
  const modelo = motorModelo ? { ...motorModelo } : { bav: [], decisiones: [], normas: NORMAS, articulacion: ARTICULACION }
  if (ia.modelo) { if (ia.modelo.descripcion) modelo.descripcion = ia.modelo.descripcion; if (ia.modelo.bav.length) modelo.bav = ia.modelo.bav; if (ia.modelo.decisiones.length) modelo.decisiones = ia.modelo.decisiones; modelo.articulacionIA = ia.modelo.articulacion; modelo.fuente = 'IA' }
  return { modelo, caes, fuente: 'IA' }
}

// ── KML: los CAE por fases (fichas en su posición al fin de cada fase) ──────────────────
const x = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
export function kmlCaes(caes) {
  if (!caes) return []
  const K = []
  const pt = (p) => `<Point><coordinates>${redondeo(p.lng, 5)},${redondeo(p.lat, 5)},0</coordinates></Point>`
  for (const c of [caes.probable, caes.peligroso].filter(Boolean)) {
    K.push(`<Folder><name>${c.id === 'CAE-1' ? '10' : '11'} ${x(c.id)} (${c.tipo === 'probable' ? 'más probable' : 'más peligroso'}) · DEOP ${c.n}</name><description>${x(c.enunciado)}</description>`)
    for (const f of c.fases || []) {
      K.push(`<Folder><name>${x(f.id)} ${x(f.nombre)} (${x(f.ventana)})</name>`)
      for (const a of f.acciones) if (Number.isFinite(a.lng) && Number.isFinite(a.lat)) K.push(`<Placemark><name>${x(a.quien)} · ${x(f.id)} · ${x(dia(a.dia))}</name><description>${x(a.papel)}${a.deop ? ` · DEOP ${a.deop}` : ''} · ${x(a.que)}</description><styleUrl>#${a.papel === 'reserva' ? 'reserva' : a.papel === 'apoyo' ? 'apoyo' : 'rojo'}</styleUrl>${pt(a)}</Placemark>`)
      K.push('</Folder>')
    }
    // la huella de cada actor a través de las fases
    const porQuien = new Map()
    for (const f of c.fases || []) for (const a of f.acciones) if (Number.isFinite(a.lng)) { if (!porQuien.has(a.quien)) porQuien.set(a.quien, []); porQuien.get(a.quien).push([a.lng, a.lat]) }
    for (const [q, pts] of porQuien) if (pts.length >= 2) K.push(`<Placemark><name>${x(q)} — recorrido por fases</name><styleUrl>#huella</styleUrl><LineString><tessellate>1</tessellate><coordinates>${pts.map((p) => `${redondeo(p[0], 5)},${redondeo(p[1], 5)},0`).join(' ')}</coordinates></LineString></Placemark>`)
    K.push('</Folder>')
  }
  if (caes.matriz?.length) {
    K.push(`<Folder><name>12 Matriz de eventos (qué CAE confirma cada A.I.N.)</name>`)
    for (const m of caes.matriz) if (Number.isFinite(m.lng)) K.push(`<Placemark><name>${x(m.ain)} ${x(m.lugar)} → ${x(m.confirma)}</name><description>${x(m.ventana)} · ${x(m.indicador)}</description><styleUrl>#ain</styleUrl>${pt(m)}</Placemark>`)
    K.push('</Folder>')
  }
  return K
}
export const ESTILOS_KML_CAE = [
  `<Style id="reserva"><IconStyle><color>ffe26ab3</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/purple-diamond.png</href></Icon></IconStyle></Style>`,
  `<Style id="apoyo"><IconStyle><color>ff2fa0ff</color><scale>0.9</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/airports.png</href></Icon></IconStyle></Style>`,
  `<Style id="huella"><LineStyle><color>b31a1aff</color><width>2</width></LineStyle></Style>`,
]

// ── el texto para la Apreciación (Word): plantilla doctrinal + CAE por fases + matriz + RPI + PD ──
export function textoCaes({ modelo = null, caes = null, cruce = 5 } = {}) {
  const L = []
  const p = (t, n = 0) => L.push(`<p style="margin:3px 0 3px ${n * 24}px">${t}</p>`)
  if (modelo) {
    p(`<b>III.- A.- MODELO DE LA AMENAZA (plantilla doctrinal a nivel Fuerza Terrestre)${modelo.fuente === 'IA' ? ' <i>(con aporte de la IA, revisado por el G-2)</i>' : ''}.</b>`)
    p(e(modelo.descripcion), 1)
    if (modelo.art) {
      const a = modelo.art
      p(`<b>Articulación:</b> esfuerzo principal por la DEOP ${a.ep.n} (${e(nombres(a.ep.enemigas) || '—')})${a.es.length ? `; secundarios: ${e(lista(a.es.map((z) => `DEOP ${z.n} (${nombres(z.enemigas) || '—'})`)))}` : ''}${a.engano ? `; engaño por la DEOP ${a.engano.n} (${e(nombres(a.engano.enemigas))})` : ''}${a.reserva.length ? `; reserva operativa: ${e(nombres(a.reserva))}` : ''}${a.apoyos.length ? `; apoyos: ${e(nombres(a.apoyos))}` : ''}.`, 1)
    }
    p('<b>Normas de distancia y tiempo (referencia):</b> ' + modelo.normas.map(([n, v]) => `${e(n)}: ${e(v)}`).join('; ') + '.', 1)
    p('<b>Blancos de alto valor:</b> ' + modelo.bav.map(e).join(' '), 1)
    p('<b>Decisiones del Comandante enemigo:</b> ' + modelo.decisiones.map((d) => `${e(d.id)} ${e(d.decision)} (${e(d.ventana)}; ${e(d.donde)})`).join(' '), 1)
  }
  if (caes) {
    p(`<b>IV.- A.- CURSOS DE ACCIÓN DEL ENEMIGO POR FASES</b> (los D+n del itinerario cuentan desde el cruce de los pasos, apreciado el D+${cruce}).`)
    for (const c of [caes.probable, caes.peligroso].filter(Boolean)) {
      p(`<b>${e(c.id)} — ${c.tipo === 'probable' ? 'más probable' : 'más peligroso'} (DEOP ${c.n}${c.criterio ? `; ${e(c.criterio)}` : ''})${c.fuente === 'IA' ? ' <i>(IA, revisado)</i>' : ''}.</b> ${e(c.enunciado)}`, 1)
      const fases = c.fasesIA || c.fases || []
      for (const f of fases) p(`<b>${e(f.id)}${f.nombre ? ` ${e(f.nombre)}` : ''} (${e(f.ventana)}):</b> ${f.acciones.map((a) => `${a.quien ? `${e(a.quien)}: ` : ''}${e(a.que)}${a.lugar ? ` — ${e(a.lugar)}` : ''}${a.dia != null && a.dia !== '' ? ` (${typeof a.dia === 'number' ? e(dia(a.dia)) : e(a.dia)})` : ''}`).join('; ')}.`, 2)
      const r = c.reservaIA || c.reserva
      if (r) p(`<b>Reserva enemiga:</b> ${e(r.magnitud || '')}${r.ubicacion ? `; ubicación: ${e(r.ubicacion)}` : ''}${r.empeno ? `; empeño: ${e(r.empeno)}` : ''}${r.direcciones?.length ? `; direcciones: ${e(r.direcciones.join('; '))}` : ''}${r.condicion ? `; condición: ${e(r.condicion)}` : ''}.`, 2)
      if (c.porque?.length) p(`<b>Por qué:</b> ${c.porque.map(e).join(' ')}`, 2)
    }
    if (caes.matriz?.length) p('<b>Matriz de eventos:</b> ' + caes.matriz.map((m) => `${e(m.ain)} ${e(m.lugar)} (${e(m.ventana)}): ${e(m.indicador)} → ${e(m.confirma)}`).join('; ') + '.', 1)
    if (caes.rpi?.length) p('<b>Requerimientos prioritarios de inteligencia:</b> ' + caes.rpi.map((r) => `${e(r.id)} ${e(r.pregunta)} De ser así: ${e(r.deSerAsi)} Especial atención: ${e(r.atencion)}`).join(' '), 1)
    if (caes.propias?.length) p('<b>Puntos de decisión propios:</b> ' + caes.propias.map((d) => `${e(d.id)} ${e(d.decision)} A más tardar ${e(d.aMasTardar)}; AIN ${e(d.ain)}; AIS ${e(d.ais)}`).join(' '), 1)
  }
  return L.join('\n')
}
