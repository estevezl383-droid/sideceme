// 💡 Los cursos de acción PROPIOS que propone la Mesa para el ejercicio que está abierto, y los dos CAP en el mismo
// ejercicio. Sin dependencias: lo usan el panel (panel.js, en la Mesa), el compilado y las pruebas (en Node).
//
// Sergio, 24-10-2026, con el CE-I en el AO LAUCA: el PMTD pide «al menos dos» cursos de acción propios que se
// distingan EN LA CARTA, y la Mesa guardaba uno solo. Pidió «que la aplicación sugiera y que lo lleve a la IA, o sea
// si es o no es lo que estoy haciendo precisamente para este ejercicio… en este caso defensa móvil, pero lo que
// quiero más que todo es construir la aplicación». Esto:
//   · lee el ejercicio (`analizar`): el tipo de operación del A.O., la unidad propia y sus unidades de maniobra (cuál
//     es móvil, cuál queda más atrás para reserva), las avenidas del CMOC, el enemigo de las fichas rojas, las líneas
//     que nombran la Orden y el concepto (LF «…», LDE-n);
//   · propone DOS CAP que se distinguen por la forma de maniobra (`proponer`): quién hace qué, el enunciado de la
//     F3·P6 y cinco fases con la tarea de cada unidad. NO inventa lugares: las fichas se mueven a mano, fase por fase;
//   · arma el bloque que recibe la IA (`bloqueIA`): que diga si cada CAP SIRVE o NO para ESTE ejercicio (las cinco
//     pruebas) y que desarrolle el CAP activo;
//   · guarda el CAP que no se está trabajando (`cambiarCAP`): sus fases 🔵, su F3·P4 y su F3·P6 van a g3._caps y
//     vuelven al elegirlo. Todo lo demás de la Mesa (documentos, Word, Juego de Guerra) sigue viendo «el» CAP activo.

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => sinTildes(s).toLowerCase()
const ESC = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
const rango = (e) => ESC.indexOf(String(e || ''))
const esEnemiga = (u) => /^enemig/i.test(String(u?.bando || ''))
const esUnidad = (u) => (u?.tipo || 'unidad') === 'unidad'
const MOVIL = new Set(['mecanizada', 'blindada', 'caballeria'])
const APOYO = new Set(['artilleria', 'lanzacohetes', 'antiaerea', 'ingenieria', 'comunicaciones', 'logistica', 'sanidad', 'aviacion', 'inteligencia', 'policia_militar', 'guerra_electronica', 'morteros', 'antitanque', 'transporte', 'mantenimiento'])
export const MARCA = '[Mesa — verificar]'
const nom = (u) => String(u?.designacion || '').trim() || 'Unidad'
const lista = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

// ─── Geometría chica (km, [lng, lat]) ────────────────────────────────────────────────────────────────────────
const pos = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
function km(a, b) {
  const la = ((a[1] + b[1]) / 2) * (Math.PI / 180)
  return Math.hypot((a[0] - b[0]) * 111.32 * Math.cos(la), (a[1] - b[1]) * 110.57)
}
function aSegmento(p, a, b) {
  const la = p[1] * (Math.PI / 180)
  const X = (q) => [(q[0] - p[0]) * Math.cos(la), q[1] - p[1]]
  const [ax, ay] = X(a)
  const [bx, by] = X(b)
  const dx = bx - ax
  const dy = by - ay
  const t = dx || dy ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) : 0
  return km(p, [p[0] + (ax + t * dx) / Math.cos(la), p[1] + ay + t * dy])
}
const valido = (c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(+c[0]) && Number.isFinite(+c[1])
function aLinea(p, coords) {
  const cs = (coords || []).filter(valido)
  if (!p || !cs.length) return Infinity
  if (cs.length === 1) return km(p, cs[0])
  let d = Infinity
  for (let i = 1; i < cs.length; i++) d = Math.min(d, aSegmento(p, cs[i - 1], cs[i]))
  return d
}
const centro = (ps) => (ps.length ? [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length] : null)

// ─── Las formas de maniobra que la Mesa sabe proponer ───────────────────────────────────────────────────────
// Por tipo de operación (los mismos de «Área de Operaciones» de la Mesa: ofensiva, defensiva, retrógrada).
export const FORMAS = {
  defensiva: [
    { id: 'area', nom: 'Defensa de área', larga: 'Defensa de área (tenaz)', modalidad: 'tenaz' },
    { id: 'movil', nom: 'Defensa móvil', larga: 'Defensa móvil', modalidad: 'movil' },
    { id: 'area_alterna', nom: 'Defensa de área, esfuerzo en la otra avenida', larga: 'Defensa de área con el esfuerzo principal en la otra avenida', modalidad: 'tenaz' },
  ],
  ofensiva: [
    { id: 'ruptura', nom: 'Ruptura y penetración', larga: 'Ruptura y penetración', modalidad: 'ruptura' },
    { id: 'envolvimiento', nom: 'Envolvimiento', larga: 'Envolvimiento', modalidad: 'envolvimiento' },
    { id: 'desbordamiento', nom: 'Desbordamiento', larga: 'Desbordamiento', modalidad: 'desbordamiento' },
  ],
  retrograda: [
    { id: 'retardatriz', nom: 'Acción retardatriz', larga: 'Acción retardatriz en posiciones sucesivas', modalidad: 'retardatriz' },
    { id: 'repliegue', nom: 'Repliegue', larga: 'Repliegue con fuerza de cobertura', modalidad: 'repliegue' },
  ],
}
export const formaDe = (id) => Object.values(FORMAS).flat().find((f) => f.id === id) || null

// ─── Leer el ejercicio ──────────────────────────────────────────────────────────────────────────────────────
function textos(x, out = [], p = 0) {
  if (p > 4 || x == null) return out
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((y) => textos(y, out, p + 1))
  else if (typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!String(k).startsWith('_')) textos(v, out, p + 1)
  return out
}

export function analizar({ unidades = [], ops = {}, cmoc = {}, ordenSup = {}, unidad = '', g3 = {} } = {}) {
  const us = (Array.isArray(unidades) ? unidades : []).filter((u) => u && esUnidad(u) && u.deFaseEnemiga == null)
  const propiasTodas = us.filter((u) => !esEnemiga(u))
  const rojas = us.filter(esEnemiga)
  const nombrePropio = String(unidad || ordenSup?.unidad || ops?.unidadConsiderada?.nombre || '').trim()
  const fichaPropia = propiasTodas.find((u) => norm(nom(u)) === norm(nombrePropio)) || null
  const escPropio = ops?.unidadConsiderada?.escalon || fichaPropia?.escalon || ''
  const rProp = rango(escPropio) >= 0 ? rango(escPropio) : Math.max(-1, ...propiasTodas.map((u) => rango(u.escalon))) + 1
  const subordinadas = propiasTodas.filter((u) => u !== fichaPropia && rango(u.escalon) < rProp)
  const deManiobra = subordinadas.filter((u) => !APOYO.has(u.arma))
  const rMan = Math.max(-1, ...deManiobra.map((u) => rango(u.escalon)))
  const maniobra = deManiobra.filter((u) => rango(u.escalon) === rMan)
  // El apoyo de combate del escalón (hasta tres escalones abajo de la maniobra: el GALM-1, un batallón, es del CE).
  const apoyo = subordinadas.filter((u) => APOYO.has(u.arma) && rango(u.escalon) >= rMan - 3)

  // Dónde está el enemigo (para saber qué está adelante y qué atrás): sus fichas o el frente del A.O.
  const ao = ops?.areaOps || {}
  const pRojo = centro(rojas.map(pos).filter(Boolean))
  const frente = (ao.frente || []).filter(valido)
  const refFrente = (p) => (frente.length ? aLinea(p, frente) : pRojo ? km(p, pRojo) : 0)
  const mayorRoja = rojas.slice().sort((a, b) => rango(b.escalon) - rango(a.escalon))[0] || null

  // Avenidas del CMOC (las del enemigo): la principal es la de mayor escalón; a igual escalón, la primera.
  const avenidas = (cmoc?.avenidas || [])
    .filter((a) => a && a.bando !== 'amigo' && (a.coords || []).filter(valido).length >= 2)
    .map((a, i) => ({ nombre: String(a.nombre || `AA-${i + 1}`), escalon: a.escalon || '', coords: a.coords.filter(valido), i }))
    .sort((a, b) => rango(b.escalon) - rango(a.escalon) || a.i - b.i)

  // La reserva: la unidad de maniobra más lejos del frente (con tres o más; con dos, ninguna queda atrás).
  const conPos = maniobra.filter((u) => pos(u))
  const porFondo = conPos.slice().sort((a, b) => refFrente(pos(b)) - refFrente(pos(a)))
  const reserva = maniobra.length >= 3 && porFondo.length ? porFondo[0] : null
  const adelante = maniobra.filter((u) => u !== reserva)
  // A qué avenida mira cada unidad de adelante (la más cercana).
  const cercaDe = (av) => adelante.filter((u) => pos(u)).sort((a, b) => aLinea(pos(a), av.coords) - aLinea(pos(b), av.coords))[0] || null

  // Las líneas y la hora que nombran la Orden y los documentos del G-3 («LF «PUMA»», «LDE-1», «D (0400)»).
  const T = [...textos(ordenSup), ...textos(g3?.concepto), ...textos(g3?.coa)].join('\n')
  const lf = (T.match(/\bLF\s*[«"“]\s*([^»"”]{2,30}?)\s*[»"”]/) || [])[1]
  const lpr = lf ? `la LPR en la LF «${lf}»` : 'la LPR'
  const ldes = [...new Set(T.match(/\bLDE-\d+\b/g) || [])].sort()
  // La hora D sin artículo («D (0400)» o «D»): se escribe «del D (0400)», «hasta el D (0400)».
  const horaD = (String(ordenSup?.vigencia || '') + ' ' + String(ordenSup?.mision || '')).match(/\bD\s*\(\s*\d{4}\s*\)/)?.[0]?.replace(/\s+/g, ' ') || 'D'
  const para = (String(ordenSup?.mision || '').match(/\bpara\s+([^.]+)/i) || [])[1] || ''
  const aoNom = (T.match(/\bAO\s+[«"]?([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\- ]{2,30}[A-ZÁÉÍÓÚÑ])/) || [])[1] || ''

  const tipo = ['ofensiva', 'defensiva', 'retrograda'].includes(ao.tipo) ? ao.tipo : /\b(ataca|atacar|ofensiv|conquist|penetr)/i.test(String(ordenSup?.mision || '')) ? 'ofensiva' : 'defensiva'
  const formaHoja = norm(g3?.concepto?.['Forma de maniobra elegida y por qué'] || '')
  return {
    tipo,
    modalidad: ao.modalidad || '',
    // Lo que dice la F3·P4 sobre la forma de maniobra («Defensa de área estructurada…»; ojo: «contramovilidad» no es
    // «defensa móvil»).
    formaHoja: /defensa (de area|tenaz)/.test(formaHoja) ? 'area' : /defensa movil/.test(formaHoja) ? 'movil' : /envolvimiento/.test(formaHoja) ? 'envolvimiento' : /desbordamiento/.test(formaHoja) ? 'desbordamiento' : /ruptura|penetracion/.test(formaHoja) ? 'ruptura' : '',
    propia: nombrePropio || (fichaPropia ? nom(fichaPropia) : 'la unidad propia'),
    escPropio,
    maniobra,
    moviles: maniobra.filter((u) => MOVIL.has(u.arma)),
    apoyo,
    reserva,
    adelante,
    avenidas,
    cercaDe,
    enemigo: mayorRoja ? nom(mayorRoja) : rojas.length ? 'el enemigo de las fichas rojas' : 'el enemigo',
    lpr,
    ldes,
    horaD,
    para,
    aoNom,
    nObstaculos: (ops?.obstaculos || []).length,
  }
}

// Las dos formas que se proponen: la primera respeta lo que ya dice el ejercicio (la F3·P4 o la modalidad del
// A.O.); la segunda es la que más se diferencia de ésa.
export function formasPorDefecto(A) {
  const ids = FORMAS[A.tipo].map((f) => f.id)
  const primera = ids.includes(A.formaHoja) ? A.formaHoja : A.modalidad === 'movil' ? 'movil' : ids.includes(A.modalidad) ? A.modalidad : ids[0]
  const otra = { area: 'movil', movil: 'area', area_alterna: 'movil', ruptura: 'envolvimiento', envolvimiento: 'ruptura', desbordamiento: 'ruptura', retardatriz: 'repliegue', repliegue: 'retardatriz' }[primera]
  return [primera, otra]
}

// ─── Cada forma: quién hace qué y las cinco fases ───────────────────────────────────────────────────────────
// Un rol: { unidades, rol, tarea, proposito, fases: [qué hace en cada una de las cinco fases] }.
function roles(forma, A) {
  const av1 = A.avenidas[0] || null
  const av2 = A.avenidas[1] || null
  const avNom = (av) => (av ? av.nombre : 'la avenida principal')
  const ld1 = A.ldes[0] ? `la ${A.ldes[0]}` : 'la línea de seguridad'
  const conAv = forma === 'area_alterna' && av2 ? av2 : av1
  const ppal = (conAv && A.cercaDe(conAv)) || A.adelante[0] || null
  const resto = (x) => A.adelante.filter((u) => u !== x)
  const R = []
  const art = A.apoyo.filter((u) => ['artilleria', 'lanzacohetes', 'morteros'].includes(u.arma))
  const ing = A.apoyo.filter((u) => u.arma === 'ingenieria')
  const apoyoFuegos = (a) => art.length && R.push({ unidades: art, rol: 'Apoyo de fuegos', tarea: `Prioridad de fuegos a ${a}`.replace(/ a el /g, ' al '), proposito: 'para batir al enemigo en las zonas donde se lo quiere detener', fases: ['Concentrarse con el grueso', 'Ocupar posiciones de tiro', 'Registrar los fuegos sobre los obstáculos', `Fuegos en apoyo de ${a}`.replace(/ de el /g, ' del '), 'Fuegos en apoyo del contraataque'].map((x) => x.replace(/ de el /g, ' del ')) })
  const ingenieros = (que) => ing.length && R.push({ unidades: ing, rol: 'Ingenieros', tarea: que, proposito: 'para canalizar y retardar al enemigo donde lo baten los fuegos', fases: ['Concentrarse con el grueso', 'Reconocer los sitios de obstáculos', 'Construir el plan de barreras', 'Mantener la movilidad de la reserva', 'Abrir pasos para el contraataque'] })

  if (forma === 'area' || forma === 'area_alterna') {
    if (ppal) R.push({ unidades: [ppal], rol: 'Esfuerzo principal', tarea: `Defender ${A.lpr} sobre la ${avNom(conAv)}`, proposito: `para detener al enemigo en la ${avNom(conAv)} antes de la LPR`, principal: true, fases: ['Concentrarse en su zona de reunión', 'Desplazarse a su sector', 'Ocupar y organizar su sector (posiciones y obstáculos)', `Detener al enemigo en la ${avNom(conAv)}`, 'Consolidar su sector'] })
    for (const u of resto(ppal)) {
      const av = A.avenidas.find((a) => a !== conAv && A.cercaDe(a) === u) || A.avenidas.find((a) => a !== conAv) || null
      R.push({ unidades: [u], rol: 'Esfuerzo secundario', tarea: `Defender ${A.lpr}${av ? ` sobre la ${av.nombre}` : ' en su sector'}`, proposito: `para impedir que el enemigo desborde al esfuerzo principal`, fases: ['Concentrarse en su zona de reunión', 'Desplazarse a su sector', 'Ocupar y organizar su sector', `Defender su sector${av ? ` (${av.nombre})` : ''}`, 'Consolidar su sector'] })
    }
    if (A.reserva) R.push({ unidades: [A.reserva], rol: 'Reserva', tarea: 'Reserva: contraatacar o bloquear sobre el eje que amenace la LPR', proposito: 'para restablecer la LPR si el enemigo la penetra', fases: ['Concentrarse en su zona de reunión', 'Desplazarse a su zona de reunión de reserva', 'Reconocer los ejes de contraataque', 'Lista para empeñarse', 'Contraatacar y restablecer la LPR'] })
    apoyoFuegos(`el esfuerzo principal (${ppal ? nom(ppal) : avNom(conAv)})`)
    ingenieros(`Plan de barreras con prioridad en la ${avNom(conAv)}`)
    return { R, av: conAv, distingue: `el esfuerzo principal sobre la ${avNom(conAv)} con ${ppal ? nom(ppal) : 'la unidad más cercana'}, las unidades sobre ${A.lpr}${A.reserva ? ` y ${nom(A.reserva)} de reserva atrás` : ''}: se RETIENE el terreno` }
  }
  if (forma === 'movil') {
    // La fuerza de retardo: la unidad móvil más cerca de la avenida principal (si no hay móviles, la más cercana).
    const movilesAdelante = A.adelante.filter((u) => MOVIL.has(u.arma))
    const retardo = (av1 && movilesAdelante.slice().sort((a, b) => aLinea(pos(a), av1.coords) - aLinea(pos(b), av1.coords))[0]) || movilesAdelante[0] || ppal
    const fijadora = A.adelante.filter((u) => u !== retardo)
    const masa = [A.reserva, ...(A.reserva ? [] : [])].filter(Boolean)
    if (retardo) R.push({ unidades: [retardo], rol: 'Fuerza de retardo (seguridad)', tarea: `Retardar desde ${ld1} hasta ${A.lpr} sobre la ${avNom(av1)}`, proposito: 'para desgastar al enemigo y canalizarlo hacia la zona de destrucción', principal: !masa.length, fases: ['Concentrarse en su zona de reunión', `Desplazarse a ${ld1}`, 'Ocupar posiciones de retardo sucesivas', `Retardar sobre la ${avNom(av1)} y pasar por las líneas de la fuerza fijadora`, 'Reunirse y sumarse al contraataque'] })
    for (const u of fijadora) R.push({ unidades: [u], rol: 'Fuerza fijadora', tarea: `Defender ${A.lpr} en su sector`, proposito: 'para fijar al enemigo en la zona de destrucción', fases: ['Concentrarse en su zona de reunión', 'Desplazarse a su sector', 'Ocupar y organizar la posición', 'Fijar al enemigo en la zona de destrucción', 'Consolidar y apoyar el contraataque'] })
    if (masa.length) R.push({ unidades: masa, rol: 'Masa de contraataque (esfuerzo principal)', tarea: 'Contraatacar sobre el flanco del enemigo canalizado', proposito: 'para DESTRUIR al enemigo en la zona de destrucción', principal: true, fases: ['Concentrarse en su zona de reunión', 'Desplazarse oculta a su zona de reunión de contraataque', 'Reconocer los ejes de contraataque (sin obstáculos propios)', 'Lista para contraatacar (punto de decisión)', 'Contraatacar y destruir al enemigo'] })
    apoyoFuegos('la fuerza de retardo y después a la masa de contraataque')
    ingenieros('Obstáculos que canalicen al enemigo hacia la zona de destrucción, sin cortar los ejes del contraataque')
    return { R, av: av1, distingue: `${retardo ? nom(retardo) : 'una fuerza móvil'} retarda desde ${ld1}, ${fijadora.length ? lista(fijadora.map(nom)) : 'la fuerza fijadora'} fija en ${A.lpr}${masa.length ? ` y ${lista(masa.map(nom))} contraataca` : ''}: se CEDE terreno para destruir al enemigo` }
  }
  if (forma === 'ruptura' || forma === 'envolvimiento' || forma === 'desbordamiento') {
    const fuerte = A.moviles.find((u) => A.adelante.includes(u)) || ppal
    const otro = A.adelante.find((u) => u !== fuerte) || null
    const avPpal = forma === 'ruptura' ? av1 : av2 || av1
    const avFij = forma === 'ruptura' ? av2 : av1
    if (fuerte) R.push({ unidades: [fuerte], rol: forma === 'ruptura' ? 'Esfuerzo principal (ruptura)' : forma === 'envolvimiento' ? 'Fuerza envolvente (esfuerzo principal)' : 'Fuerza desbordante (esfuerzo principal)', tarea: forma === 'ruptura' ? `Romper la defensa enemiga sobre la ${avNom(avPpal)}` : `${forma === 'envolvimiento' ? 'Envolver' : 'Desbordar'} al enemigo por la ${avNom(avPpal)}`, proposito: forma === 'ruptura' ? 'para abrir la brecha por donde pasa la explotación' : 'para caer sobre su flanco o su retaguardia', principal: true, fases: ['Concentrarse en la zona de reunión', 'Desplazarse a la base de partida', forma === 'ruptura' ? 'Romper la posición enemiga' : 'Avanzar por el eje de desborde', 'Penetrar / explotar en profundidad', 'Consolidar sobre el objetivo'] })
    if (otro) R.push({ unidades: [otro], rol: forma === 'ruptura' ? 'Esfuerzo secundario' : 'Fuerza de fijación', tarea: forma === 'ruptura' ? `Atacar sobre la ${avNom(avFij)}` : `Fijar al enemigo de frente sobre la ${avNom(avFij)}`, proposito: 'para impedir que el enemigo refuerce donde va el esfuerzo principal', fases: ['Concentrarse en la zona de reunión', 'Desplazarse a la base de partida', 'Atacar / fijar', 'Mantener la presión', 'Consolidar'] })
    if (A.reserva) R.push({ unidades: [A.reserva], rol: 'Reserva', tarea: 'Reserva: explotar el éxito', proposito: 'para explotar la brecha o rechazar un contraataque', fases: ['Concentrarse en la zona de reunión', 'Seguir al esfuerzo principal', 'Lista para empeñarse', 'Explotar el éxito', 'Consolidar'] })
    apoyoFuegos('el esfuerzo principal')
    return { R, av: avPpal, distingue: `el esfuerzo principal (${fuerte ? nom(fuerte) : 'la unidad más fuerte'}) por la ${avNom(avPpal)}${forma === 'ruptura' ? ' de frente' : ' hacia el flanco'}` }
  }
  // Retrógradas.
  const cob = A.moviles.find((u) => A.adelante.includes(u)) || ppal
  if (cob) R.push({ unidades: [cob], rol: forma === 'retardatriz' ? 'Fuerza de retardo (esfuerzo principal)' : 'Fuerza de cobertura', tarea: forma === 'retardatriz' ? `Retardar en posiciones sucesivas sobre la ${avNom(av1)}` : 'Cubrir el repliegue del grueso', proposito: 'para ganar tiempo sin empeñarse decisivamente', principal: true, fases: ['Concentrarse', 'Desplazarse a la primera posición', 'Retardar en la primera posición', 'Retardar en las posiciones siguientes', 'Pasar por las líneas y reunirse'] })
  for (const u of A.adelante.filter((x) => x !== cob)) R.push({ unidades: [u], rol: 'Grueso', tarea: 'Replegarse por ejes sucesivos', proposito: 'para conservar la potencia de combate', fases: ['Concentrarse', 'Desplazarse', 'Replegarse', 'Ocupar la nueva posición', 'Consolidar'] })
  if (A.reserva) R.push({ unidades: [A.reserva], rol: 'Reserva', tarea: 'Reserva: contraatacar si el enemigo amenaza cortar el repliegue', proposito: 'para que el repliegue no se convierta en derrota', fases: ['Concentrarse', 'Desplazarse', 'Lista para empeñarse', 'Contraatacar si hace falta', 'Consolidar'] })
  return { R, av: av1, distingue: `${cob ? nom(cob) : 'la fuerza de retardo'} gana tiempo sobre la ${avNom(av1)} mientras el grueso se repliega` }
}

const FASES = {
  defensiva: (A, forma) => [
    { nombre: 'Concentración', cuando: `antes del ${A.horaD}`, tarea: `Concentrar ${A.propia} en su zona de reunión`, proposito: 'para iniciar el desplazamiento en orden' },
    { nombre: 'Desplazamiento', cuando: `antes del ${A.horaD}`, tarea: 'Desplazarse a los sectores y puestos comando', proposito: 'para ocupar la posición sin ser detectados' },
    forma === 'movil'
      ? { nombre: 'Organización de la defensa móvil', cuando: `hasta el ${A.horaD}`, tarea: `La fuerza fijadora organiza ${A.lpr}; la masa se oculta en su zona de reunión; obstáculos que canalizan hacia la zona de destrucción${A.nObstaculos ? ` (${A.nObstaculos} en la carta)` : ''}`, proposito: 'para que el enemigo entre donde lo vamos a destruir' }
      : { nombre: 'Ocupación y organización de la posición', cuando: `hasta el ${A.horaD}`, tarea: `Ocupar las posiciones y ejecutar el plan de barreras${A.nObstaculos ? ` (${A.nObstaculos} obstáculos en la carta)` : ''}: comparar los días de trabajo con el tiempo hasta el D (F1·P4)`, proposito: 'para que la posición esté lista cuando llegue el enemigo' },
    forma === 'movil'
      ? { nombre: 'Retardo y canalización', cuando: `a partir del ${A.horaD}`, tarea: `Retardar desde ${A.ldes[0] ? `la ${A.ldes[0]}` : 'la línea de seguridad'} hasta ${A.lpr} y fijar al enemigo en la zona de destrucción`, proposito: 'para desgastarlo y llevarlo al lugar del contraataque' }
      : { nombre: 'Conducción de la defensa', cuando: `a partir del ${A.horaD}`, tarea: `De la zona de seguridad a la zona de resistencia (${A.lpr})`, proposito: 'para detener al enemigo antes de la LPR' },
    forma === 'movil'
      ? { nombre: 'Contraataque y consolidación', cuando: 'a orden (punto de decisión)', tarea: 'La masa contraataca; consolidar y reorganizar', proposito: 'para destruir al enemigo y pasar a la operación siguiente' }
      : { nombre: 'Contraataque y consolidación', cuando: 'a orden', tarea: 'La reserva contraataca donde haga falta; consolidar y reorganizar', proposito: 'para restablecer la LPR y pasar a la operación siguiente' },
  ],
  ofensiva: (A) => [
    { nombre: 'Concentración', cuando: `antes del ${A.horaD}`, tarea: `Concentrar ${A.propia} en la zona de reunión`, proposito: 'para iniciar el ataque en orden' },
    { nombre: 'Desplazamiento a la base de partida', cuando: `antes del ${A.horaD}`, tarea: 'Desplazarse a la base de partida', proposito: 'para cruzar la Línea de Partida a la hora' },
    { nombre: 'Ataque', cuando: `el ${A.horaD}`, tarea: 'Cruzar la Línea de Partida y atacar', proposito: 'para romper o fijar la defensa enemiga' },
    { nombre: 'Explotación', cuando: 'a orden', tarea: 'Explotar en profundidad', proposito: 'para desorganizar al enemigo' },
    { nombre: 'Consolidación', cuando: 'a orden', tarea: 'Consolidar sobre el objetivo y reorganizar', proposito: 'para rechazar el contraataque' },
  ],
  retrograda: (A) => [
    { nombre: 'Concentración', cuando: `antes del ${A.horaD}`, tarea: `Concentrar ${A.propia}`, proposito: 'para iniciar la operación en orden' },
    { nombre: 'Desplazamiento', cuando: `antes del ${A.horaD}`, tarea: 'Desplazarse a la primera posición', proposito: 'para ocupar la posición sin ser detectados' },
    { nombre: 'Primera posición', cuando: `el ${A.horaD}`, tarea: 'Retardar en la primera posición', proposito: 'para ganar tiempo' },
    { nombre: 'Posiciones sucesivas', cuando: 'a orden', tarea: 'Retardar en las posiciones siguientes', proposito: 'para ganar tiempo sin empeñarse' },
    { nombre: 'Paso de líneas y reunión', cuando: 'a orden', tarea: 'Pasar por las líneas y reunirse', proposito: 'para conservar la potencia de combate' },
  ],
}

const RAZON = {
  area: (A, av) => `Retiene el terreno: aprovecha que ${av ? `la ${av.nombre}` : 'la avenida principal'} canaliza al enemigo y concentra los obstáculos y los fuegos donde lo vamos a detener. Riesgo: si ${A.enemigo} penetra, sólo queda la reserva.`,
  area_alterna: (A, av) => `Es la misma defensa de área con el peso puesto en ${av ? `la ${av.nombre}` : 'la otra avenida'}: sirve si el G-2 considera que el enemigo puede elegir ese eje. Riesgo: la avenida principal queda con menos fuerzas.`,
  movil: (A) => `Busca DESTRUIR a ${A.enemigo} en vez de retener cada metro: cede la zona de seguridad, lo canaliza y lo golpea con la masa móvil en el flanco. Exige movilidad, buen reconocimiento y un punto de decisión claro. Riesgo: si el contraataque llega tarde, el enemigo se afirma.`,
  ruptura: () => 'Concentra la potencia en un punto para abrir la brecha; es la forma más costosa pero la más directa.',
  envolvimiento: () => 'Evita el frente fuerte del enemigo y cae sobre su flanco o retaguardia; exige movilidad y que la fijación funcione.',
  desbordamiento: () => 'Supera el dispositivo por un flanco sin empeñarse de frente; exige movilidad y terreno transitable.',
  retardatriz: () => 'Cambia espacio por tiempo sin empeñarse decisivamente.',
  repliegue: () => 'Saca al grueso del contacto conservando la potencia de combate.',
}
const QUE = { defensiva: 'Defiende', ofensiva: 'Ataca', retrograda: 'Ejecuta una operación retrógrada' }

// Un CAP: { n, forma, nomForma, nombre, roles, fases, campos (los de la F3·P6), distingue }.
export function armarCAP(n, formaId, A) {
  const F = formaDe(formaId) || FORMAS[A.tipo][0]
  const { R, av, distingue } = roles(F.id, A)
  const fases = FASES[A.tipo](A, F.id).map((f, i) => ({
    ...f,
    porUnidad: Object.fromEntries(R.flatMap((r) => r.unidades.map((u) => [u.id, { tarea: r.fases[i] || r.tarea, proposito: i === 3 || i === 4 ? r.proposito : '' }]))),
  }))
  const nombre = `CAP ${n} — ${F.larga}${av && F.id !== 'movil' && A.avenidas.length > 1 ? ` (esfuerzo en la ${av.nombre})` : ''}`
  const como = R.map((r) => `${r.rol}: ${lista(r.unidades.map(nom))} — ${r.tarea}, ${r.proposito}.`).join(' ')
  const dondeAO = A.aoNom ? `en el AO ${A.aoNom}` : 'en el Área de Operaciones asignada'
  const campos = {
    'Denominación del CAP': nombre,
    QUIÉN: `${A.propia}${A.maniobra.length ? ` (${lista(A.maniobra.map(nom))})` : ''}`,
    QUÉ: `${QUE[A.tipo]} — ${F.larga.toLowerCase()}`,
    CUÁNDO: `A partir del ${A.horaD}`,
    DÓNDE: `${dondeAO}${A.tipo === 'defensiva' ? `, sobre ${A.lpr}` : ''}`,
    'POR QUÉ (propósito)': A.para ? `Para ${A.para.trim()}` : 'Para cumplir la misión impuesta por el escalón superior',
    'CÓMO (forma de maniobra)': `${F.larga}. ${como}`,
    'Enunciado completo del curso de acción': `${A.propia} ${QUE[A.tipo].toLowerCase()} ${dondeAO} a partir del ${A.horaD} mediante una ${F.larga.toLowerCase()}: ${R.map((r) => `${lista(r.unidades.map(nom))} (${r.rol.toLowerCase()})`).join(', ')}${A.para ? `, para ${A.para.trim()}` : ''}.`,
    'Razón fundamental (por qué este CAP)': RAZON[F.id](A, av),
    'Bosquejo: qué muestra el calco': `En la carta se tiene que ver: ${distingue}. Cinco fases 🔵 (${FASES[A.tipo](A, F.id).map((f) => f.nombre).join(' · ')}).`,
  }
  return { n, forma: F.id, nomForma: F.larga, nombre, roles: R.map((r) => ({ ...r, unidades: r.unidades.map((u) => ({ id: u.id, nom: nom(u) })) })), fases, campos, distingue }
}

// Los dos CAP para este ejercicio. `formas`: las elegidas (g3._caps.formas); si falta, las de `formasPorDefecto`.
export function proponer(ctx = {}, formas = {}) {
  const A = analizar(ctx)
  const def = formasPorDefecto(A)
  const ok = (id) => FORMAS[A.tipo].some((f) => f.id === id)
  const f1 = ok(formas[1]) ? formas[1] : def[0]
  let f2 = ok(formas[2]) ? formas[2] : def[1]
  if (f2 === f1) f2 = FORMAS[A.tipo].find((f) => f.id !== f1).id
  const caps = [armarCAP(1, f1, A), armarCAP(2, f2, A)]
  const avisos = []
  if (!A.maniobra.length) avisos.push('No hay fichas propias de maniobra en la carta: la Mesa no puede decir quién hace qué.')
  if (!A.avenidas.length) avisos.push('No hay avenidas de aproximación en el CMOC: el esfuerzo principal no tiene dónde ir.')
  if (A.maniobra.length && A.maniobra.length < 3) avisos.push(`Con ${A.maniobra.length} unidad(es) de maniobra no queda reserva: revisá la organización de la tarea (F3·P3).`)
  if (caps.some((c) => c.forma === 'movil') && !A.moviles.length) avisos.push('La defensa móvil necesita unidades mecanizadas o blindadas y no hay ninguna entre las de maniobra.')
  return { A, caps, avisos, tipo: A.tipo }
}

// ─── El bloque para la IA ───────────────────────────────────────────────────────────────────────────────────
// Va antes de «CÓMO CONTESTAR» en los pedidos de la F3·P4 y la F3·P6.
export function bloqueIA(P, { activo = 1, hoja = 'coa' } = {}) {
  if (!P?.caps?.length) return ''
  const A = P.A
  const capTxt = (c) =>
    [
      `## ${c.nombre}${c.n === activo && hoja !== 'carta' ? ' ← EL ACTIVO: es el que va en las casillas de esta hoja' : ''}`,
      ...c.roles.map((r) => `- ${r.rol}: ${r.unidades.map((u) => u.nom).join(', ')} — ${r.tarea}, ${r.proposito}.`),
      `- En la carta se distingue por: ${c.distingue}.`,
      `- Fases: ${c.fases.map((f, i) => `${i + 1}. ${f.nombre} (${f.cuando})`).join(' · ')}.`,
    ].join('\n')
  const dondeJuicio = hoja === 'concepto' ? '«Forma de maniobra elegida y por qué»' : hoja === 'carta' ? '«juicio»' : '«Razón fundamental (por qué este CAP)»'
  return `# LO QUE PROPONE LA MESA PARA ESTE EJERCICIO — DOS CURSOS DE ACCIÓN PROPIOS

La Mesa armó esta propuesta con las fichas, las avenidas del CMOC y la Orden de ESTE ejercicio. Es un BORRADOR para que lo juzgues: no es doctrina general ni está verificado.
Lo que leyó: operación ${A.tipo}; unidad propia ${A.propia}; unidades de maniobra ${A.maniobra.map(nom).join(', ') || '(ninguna en la carta)'}${A.moviles.length ? ` (móviles: ${A.moviles.map(nom).join(', ')})` : ''}; ${A.reserva ? `la que está más atrás: ${nom(A.reserva)}` : 'ninguna queda atrás para reserva'}; avenidas ${A.avenidas.map((a) => `${a.nombre}${a.escalon ? ` (${a.escalon})` : ''}`).join(', ') || '(ninguna)'}; enemigo ${A.enemigo}.${P.avisos.length ? `\nOJO: ${P.avisos.join(' ')}` : ''}

${P.caps.map(capTxt).join('\n\n')}

# TU TAREA CON ESTA PROPUESTA

1. Para CADA uno de los dos CAP decí si SIRVE o NO SIRVE para ESTE ejercicio, con las cinco pruebas del PMTD (adecuado, factible, aceptable, distinguible, completo): una frase por prueba, con el dato del expediente que la justifica (el terreno, las fuerzas, el tiempo hasta el D, el CAE del G-2).
2. Si uno NO sirve, proponé el que lo reemplaza y decí por qué; si los dos se parecen, decí qué hay que cambiar para que se distingan EN LA CARTA.
3. ${hoja === 'carta' ? 'Desarrollá LOS DOS CAP en la carta, fase por fase, con las unidades REALES de las fichas' : `Las casillas de esta hoja son del CAP ACTIVO (CAP ${activo}): desarrollalo ahí con las unidades REALES de las fichas`}. Tu juicio de los dos CAP va ${hoja === 'carta' ? 'en' : 'al principio de'} ${dondeJuicio}.
4. No inventes unidades ni lugares que no estén en el expediente.`
}

// ─── Los dos CAP en el mismo ejercicio ──────────────────────────────────────────────────────────────────────
// g3._caps = { activo: 1|2, formas: { 1: 'area', 2: 'movil' }, guardados: { 2: { fases, coa, concepto } } }
// El activo está donde la Mesa lo busca siempre (fasesCOA.propio, g3.coa, g3.concepto); el otro, guardado.
export const HOJAS_POR_CAP = ['coa', 'concepto']
export const capsDe = (g3) => {
  const c = g3?._caps || {}
  return { activo: c.activo === 2 ? 2 : 1, formas: c.formas || {}, guardados: c.guardados || {} }
}
export function cambiarCAP({ fasesCOA = {}, g3 = {} } = {}, n) {
  const C = capsDe(g3)
  if (n !== 1 && n !== 2) return { fasesCOA, g3, cambio: false }
  if (n === C.activo) return { fasesCOA, g3, cambio: false }
  const guardar = { fases: Array.isArray(fasesCOA.propio) ? fasesCOA.propio : [] }
  for (const h of HOJAS_POR_CAP) if (g3[h] !== undefined) guardar[h] = g3[h]
  const traer = C.guardados[n] || {}
  const g = { ...g3 }
  for (const h of HOJAS_POR_CAP) {
    if (traer[h] !== undefined) g[h] = traer[h]
    else delete g[h]
  }
  const guardados = { ...C.guardados, [C.activo]: guardar }
  delete guardados[n]
  g._caps = { ...(g3._caps || {}), activo: n, formas: C.formas, guardados }
  return { fasesCOA: { ...fasesCOA, propio: Array.isArray(traer.fases) ? traer.fases : [] }, g3: g, cambio: true }
}
// Las formas que se ven en el panel quedan guardadas (si no se habían elegido) para que el 🎬 C.A. por fases las nombre.
export function conFormas(g3 = {}, formas = {}) {
  const C = capsDe(g3)
  const f = { ...formas, ...C.formas }
  if (JSON.stringify(f) === JSON.stringify(C.formas)) return g3
  return { ...g3, _caps: { ...(g3._caps || {}), activo: C.activo, formas: f, guardados: C.guardados } }
}
export function conForma(g3 = {}, n, forma) {
  const C = capsDe(g3)
  return { ...g3, _caps: { ...(g3._caps || {}), activo: C.activo, formas: { ...C.formas, [n]: forma }, guardados: C.guardados } }
}
// Cuántas fases tiene cada CAP (el activo, en fasesCOA.propio; el otro, guardado).
export function fasesPorCAP(g3 = {}, fasesCOA = {}) {
  const C = capsDe(g3)
  const otro = C.activo === 1 ? 2 : 1
  return { [C.activo]: (fasesCOA.propio || []).length, [otro]: (C.guardados[otro]?.fases || []).length }
}

// ─── Llevarlo a la hoja y a la carta ────────────────────────────────────────────────────────────────────────
// Las casillas vacías de la F3·P6 con el CAP propuesto (marcadas «[Mesa — verificar]»); lo escrito no se toca.
export function llevarAHoja(valor = {}, cap) {
  const v = { ...(valor || {}) }
  let n = 0
  for (const [k, t] of Object.entries(cap?.campos || {})) {
    if (String(v[k] ?? '').trim()) continue
    v[k] = `${t} ${MARCA}`
    n++
  }
  return { valor: v, n }
}
// Las cinco fases 🔵 del CAP con el dispositivo de ahora (cada ficha queda donde está: se mueve a mano en cada
// fase); cada unidad con rol lleva su tarea y su propósito de esa fase, y la del esfuerzo principal, la ★.
export function armarFases(cap, { unidades = [], ops = {} } = {}) {
  const principal = new Set((cap?.roles || []).filter((r) => r.principal).flatMap((r) => r.unidades.map((u) => u.id)))
  return (cap?.fases || []).map((f) => ({
    nombre: f.nombre,
    tarea: f.tarea,
    proposito: f.proposito,
    origen: `Mesa · CAP ${cap.n} · ${f.cuando}`,
    unidades: (unidades || []).map((u) => {
      const p = f.porUnidad?.[u.id]
      return p ? { ...u, tarea: p.tarea, proposito: p.proposito || u.proposito || '', principal: principal.has(u.id) || undefined } : u
    }),
    ops: ops || {},
    desplazamientos: [],
  }))
}

// La F3·P6 de un CAP con lo que escribió la IA: lo del oficial no se toca; lo vacío o lo que había propuesto la
// Mesa («[Mesa — verificar]»), sí.
export function conF3P6(valor = {}, f3p6 = {}) {
  const v = { ...(valor || {}) }
  let n = 0
  for (const [k, t] of Object.entries(f3p6 || {})) {
    const ya = String(v[k] ?? '').trim()
    if (ya && !ya.includes(MARCA)) continue
    v[k] = t
    n++
  }
  return { valor: v, n }
}
// Pone en la carta la fase 0 del CAP activo (como cuando se toca la FASE 1 en el 🎬 C.A. por fases).
function mostrarFase0(fases, M) {
  if (!fases?.length) return
  M.setActiva?.({ bando: 'propio', idx: 0 })
  M.setUnidades?.(fases[0].unidades)
  M.setOps?.((o) => ({ ...(fases[0].ops || {}), ains: o?.ains || [] }))
  if (fases[0].plan) M.setPlan?.(fases[0].plan)
}

// ─── Lo que hace la Mesa con cada botón ─────────────────────────────────────────────────────────────────────
// M: lo que le pasa el compilado (el estado y sus setters): { fasesCOA, g3, setFases, setG3, flush (guarda en la
// fase activa lo que se movió), unidades, ops, activa, setActiva, setUnidades, bloqueado, avisoBloqueo, aviso,
// confirmar }.
export function accion(que, d = {}, M = {}) {
  try {
    if (que === 'forma') {
      M.setG3?.(conForma(M.g3, d.n, d.forma))
      return true
    }
    if (M.bloqueado) {
      M.avisoBloqueo?.()
      return false
    }
    if (que === 'cambiar') {
      const fc = M.flush ? M.flush(M.fasesCOA || {}) : M.fasesCOA || {}
      const r = cambiarCAP({ fasesCOA: fc, g3: M.g3 || {} }, d.n)
      if (!r.cambio) return false
      M.setFases?.(r.fasesCOA)
      M.setG3?.(d.formas ? conFormas(r.g3, d.formas) : r.g3)
      if (M.activa?.bando === 'propio') M.setActiva?.(null)
      const nf = (r.fasesCOA.propio || []).length
      M.aviso?.(`🔵 Ahora trabajás el CAP ${d.n}${nf ? ` (${nf} fase(s) 🔵)` : ' (todavía sin fases 🔵)'}: sus fases, su F3·P4 y su F3·P6. El otro CAP quedó guardado tal cual.`)
      return true
    }
    if (que === 'fases') {
      const fases = armarFases(d.cap, { unidades: (M.unidades || []).filter((u) => u && u.deFaseEnemiga == null), ops: M.ops || {} })
      if (!fases.length) return false
      const ya = (M.fasesCOA?.propio || []).length
      const confirmar = M.confirmar || ((t) => (typeof window !== 'undefined' ? window.confirm(t) : true))
      if (ya && !confirmar(`El CAP ${d.cap.n} ya tiene ${ya} fase(s) 🔵.\n\nArmarlas de nuevo las REEMPLAZA por las ${fases.length} de la propuesta (con el dispositivo de ahora). Lo que hayas movido o escrito en esas fases se pierde.\n\n¿Seguimos?`)) return false
      M.setFases?.((fc) => ({ ...(M.flush ? M.flush(fc) : fc), propio: fases }))
      if (d.formas && M.g3) {
        const g = conFormas(M.g3, d.formas)
        if (g !== M.g3) M.setG3?.(g)
      }
      mostrarFase0(fases, M)
      M.aviso?.(`🎬 ${fases.length} fases 🔵 del CAP ${d.cap.n}, con la tarea de cada unidad. Ahora, fase por fase, mové las fichas a donde van: la Mesa no inventa los lugares.`)
      return true
    }
    if (que === 'texto') {
      // 📝 La F3·P6 de los dos CAP desde sus fases 🔵. d.campos(fases) → los bloques «Según la carta» de cada casilla;
      // d.conBloques(valor, campos) → la hoja con esos bloques (los arma texto-carta.mjs en el panel).
      const fc = M.flush ? M.flush(M.fasesCOA || {}) : M.fasesCOA || {}
      const C = capsDe(M.g3)
      const act = C.activo
      const otro = act === 1 ? 2 : 1
      const g = { ...(M.g3 || {}) }
      const guardados = { ...C.guardados }
      const hechos = []
      const conAlgo = (c) => c && Object.values(c).some(Boolean)
      const cA = (fc.propio || []).length ? d.campos?.(fc.propio) : null
      if (conAlgo(cA)) {
        g.coa = d.conBloques(g.coa, cA)
        hechos.push(act)
      }
      const fO = guardados[otro]?.fases || []
      const cO = fO.length ? d.campos?.(fO) : null
      if (conAlgo(cO)) {
        guardados[otro] = { ...guardados[otro], coa: d.conBloques(guardados[otro]?.coa, cO) }
        hechos.push(otro)
      }
      if (!hechos.length) {
        M.aviso?.('📝 Todavía no hay nada en la carta para escribir: armá las fases 🔵 (🎬) o pedíselas a la IA.')
        return false
      }
      g._caps = { ...(M.g3?._caps || {}), activo: act, formas: C.formas, guardados }
      M.setG3?.(g)
      M.aviso?.(`📝 La F3·P6 ${hechos.length === 2 ? 'de los dos CAP' : `del CAP ${hechos[0]}`} tiene ahora el bloque «Según la carta» (lo que escribiste no se tocó).`)
      return hechos
    }
    if (que === 'colocar') {
      // Lo que leyó carta-ia.mjs de la respuesta de la IA: los dos CAP con sus fases y su F3·P6.
      const R = d.resultado || {}
      const C = capsDe(M.g3)
      const act = C.activo
      const otro = act === 1 ? 2 : 1
      const ya = [act, otro].filter((n) => R.caps?.[n]?.fases?.length).map((n) => [n, n === act ? (M.fasesCOA?.propio || []).length : (C.guardados[otro]?.fases || []).length]).filter(([, k]) => k)
      const confirmar = M.confirmar || ((t) => (typeof window !== 'undefined' ? window.confirm(t) : true))
      if (ya.length && !confirmar(`${ya.map(([n, k]) => `El CAP ${n} ya tiene ${k} fase(s) 🔵`).join(' y ')}.\n\nLo de la IA las REEMPLAZA (la F3·P6 sólo llena lo vacío). Lo que hayas movido en esas fases se pierde.\n\n¿Seguimos?`)) return false
      const ids = new Set(Object.values(FORMAS).flat().map((f) => f.id))
      const formas = { ...C.formas }
      for (const n of [1, 2]) if (ids.has(R.caps?.[n]?.forma)) formas[n] = R.caps[n].forma
      const g = { ...(M.g3 || {}) }
      const guardados = { ...C.guardados }
      if (R.caps?.[act]) g.coa = conF3P6(g.coa, R.caps[act].f3p6).valor
      if (R.caps?.[otro]) {
        const gu = guardados[otro] || {}
        guardados[otro] = { ...gu, fases: R.caps[otro].fases, coa: conF3P6(gu.coa, R.caps[otro].f3p6).valor }
      }
      g._caps = { ...(M.g3?._caps || {}), activo: act, formas, guardados }
      if (R.caps?.[act]) M.setFases?.((fc) => ({ ...(M.flush ? M.flush(fc) : fc), propio: R.caps[act].fases }))
      M.setG3?.(g)
      mostrarFase0(R.caps?.[act]?.fases, M)
      M.aviso?.(`🤖 En la carta: ${[act, otro].filter((n) => R.caps?.[n]).map((n) => `CAP ${n} (${R.caps[n].fases.length} fases${n === act ? ', a la vista' : ', guardado'})`).join(' y ')}. Revisalo fase por fase y corregí lo que haga falta.`)
      return true
    }
  } catch (e) {
    M.error?.(`No se pudo: ${e?.message || e}`)
  }
  return false
}

// El pedido de la IA de la F3·P4 y la F3·P6, con la propuesta (antes de «# CÓMO CONTESTAR»). Las demás, igual.
export function pedido(r, hoja, ctx = {}) {
  if (r && typeof r.then === 'function') return r.then((x) => pedido(x, hoja, ctx))
  if (!HOJAS_POR_CAP.includes(hoja?.id) || !r?.ok || typeof r.prompt !== 'string') return r
  try {
    const C = capsDe(ctx.g3)
    const b = bloqueIA(proponer(ctx, C.formas), { activo: C.activo, hoja: hoja.id })
    if (!b) return r
    const marca = '\n\n---\n\n# CÓMO CONTESTAR'
    const i = r.prompt.lastIndexOf(marca)
    return { ...r, prompt: i >= 0 ? `${r.prompt.slice(0, i)}\n\n---\n\n${b}${r.prompt.slice(i)}` : `${r.prompt}\n\n---\n\n${b}` }
  } catch {
    return r
  }
}
