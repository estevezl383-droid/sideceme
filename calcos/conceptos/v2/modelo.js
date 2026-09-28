// Hoja de trabajo de CONCEPTOS ENTRELAZADOS (F2·P1) — PMTD 2017 (RO-01-02-06),
// hoja de trabajo de la pág. 20 y su ejemplo de las págs. 21 y 22.
//
// Este archivo es el MODELO, sin DOM (se prueba en Node): el esquema de la hoja,
// la lectura de lo guardado por versiones anteriores y el ARMADO AUTOMÁTICO con lo
// que ya tiene el ejercicio (orden del escalón superior, organización de la tarea,
// fichas del calco, fases del curso de acción y hojas del G-3). El dibujo está en
// laminas.js y el trabajo con IA en ia.js.
//
// La hoja tiene cinco lugares, los mismos del formato del PMTD:
//   superior2 · superior1   → las dos cajas de arriba (relación VERTICAL)
//   maniobra                → la fila de maniobra (relación HORIZONTAL)
//   apoyo · spac            → apoyo de combate y apoyo de servicio de combate
// Qué unidad va en cada lugar depende del NIVEL que elige el oficial (enfoque).

export const ESQUEMA = 'conceptos-v2'
export const GRUPOS = ['superior2', 'superior1', 'maniobra', 'apoyo', 'spac']

export const ENFOQUES = {
  subordinadas: {
    nom: 'Mi unidad y mis unidades subordinadas',
    corto: 'Como el ejemplo del PMTD',
    ayuda:
      'Arriba el comando superior; debajo, tu unidad; en la fila, TUS unidades de maniobra con su OD / OC y su tarea y propósito por fase. Después tu apoyo de combate y tu SPAC. Es el ejemplo del PMTD (CE → Div-1 → regimientos).',
    grupos: {
      superior2: 'Comando superior',
      superior1: 'Mi unidad (unidad propia)',
      maniobra: 'Mis unidades de maniobra',
      apoyo: 'Mis unidades de apoyo de combate',
      spac: 'Mis unidades de apoyo de servicio de combate',
    },
  },
  adyacentes: {
    nom: 'Mi unidad entre las adyacentes',
    corto: 'Análisis de la orden superior',
    ayuda:
      'Arriba el comando DOS escalones más arriba y el superior inmediato; en la fila, TU unidad (al centro) con las unidades de maniobra adyacentes, como las ordena el escalón superior. Apoyo de combate y SPAC del escalón superior.',
    grupos: {
      superior2: 'Dos escalones más arriba',
      superior1: 'Comando inmediato superior',
      maniobra: 'Mi unidad y las unidades de maniobra adyacentes',
      apoyo: 'Apoyo de combate del escalón superior',
      spac: 'Apoyo de servicio de combate del escalón superior',
    },
  },
}

// Magnitud: la marca que va sobre el cuadro (PMTD: «magnitud, identificación y denominación»).
export const MAGNITUDES = [
  ['', '—'],
  ['XXXXX', 'XXXXX · Teatro / Grupo de Ejércitos'],
  ['XXXX', 'XXXX · Ejército / FF.TT.'],
  ['XXX', 'XXX · Cuerpo de Ejército'],
  ['XX', 'XX · División'],
  ['X', 'X · Brigada'],
  ['III', 'III · Regimiento / Grupo'],
  ['II', 'II · Batallón / Grupo'],
  ['I', 'I · Compañía / Escuadrón / Batería'],
  ['•••', '••• · Sección'],
  ['••', '•• · Grupo'],
]
const ORDEN_MAG = ['••', '•••', 'I', 'II', 'III', 'X', 'XX', 'XXX', 'XXXX', 'XXXXX']
const MAG_ESCALON = { equipo: '••', escuadra: '••', seccion: '•••', compania: 'I', batallon: 'II', regimiento: 'III', brigada: 'X', division: 'XX', cuerpo: 'XXX', ejercito: 'XXXX', teatro: 'XXXXX' }
const ESCALONES = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito', 'teatro']
export const magnitudDeEscalon = (e) => MAG_ESCALON[e] || ''
export function magnitudArriba(m, pasos = 1) {
  const i = ORDEN_MAG.indexOf(m)
  return i < 0 ? '' : ORDEN_MAG[Math.min(ORDEN_MAG.length - 1, i + pasos)]
}

// Armas: el símbolo que va DENTRO del cuadro y el lugar de la hoja que le toca por defecto.
export const ARMAS = {
  infanteria: { nom: 'Infantería', grupo: 'maniobra' },
  mecanizada: { nom: 'Infantería mecanizada', grupo: 'maniobra' },
  motorizada: { nom: 'Infantería motorizada', grupo: 'maniobra' },
  andina: { nom: 'Infantería andina / de montaña', grupo: 'maniobra' },
  selva: { nom: 'Infantería de selva', grupo: 'maniobra' },
  aerotransportada: { nom: 'Aerotransportada / paracaidista', grupo: 'maniobra' },
  caballeria: { nom: 'Caballería', grupo: 'maniobra' },
  cabmec: { nom: 'Caballería mecanizada / blindada', grupo: 'maniobra' },
  blindada: { nom: 'Blindada (tanques)', grupo: 'maniobra' },
  reconocimiento: { nom: 'Reconocimiento', grupo: 'maniobra' },
  artilleria: { nom: 'Artillería de campaña', grupo: 'apoyo' },
  lanzacohetes: { nom: 'Lanzacohetes', grupo: 'apoyo' },
  morteros: { nom: 'Morteros', grupo: 'apoyo' },
  antiaerea: { nom: 'Artillería antiaérea (DAA)', grupo: 'apoyo' },
  ingenieria: { nom: 'Ingeniería', grupo: 'apoyo' },
  comunicaciones: { nom: 'Comunicaciones', grupo: 'apoyo' },
  antitanque: { nom: 'Antitanque', grupo: 'apoyo' },
  ametralladoras: { nom: 'Ametralladoras', grupo: 'apoyo' },
  aviacion: { nom: 'Aviación del Ejército', grupo: 'apoyo' },
  logistica: { nom: 'Logística', grupo: 'spac' },
  intendencia: { nom: 'Intendencia', grupo: 'spac' },
  materialbelico: { nom: 'Material bélico', grupo: 'spac' },
  sanidad: { nom: 'Sanidad', grupo: 'spac' },
  transporte: { nom: 'Transporte', grupo: 'spac' },
  mantenimiento: { nom: 'Mantenimiento', grupo: 'spac' },
  veterinaria: { nom: 'Veterinaria', grupo: 'spac' },
  policiamilitar: { nom: 'Policía militar', grupo: 'spac' },
}
export const ROLES = [
  ['', '—'],
  ['OD', 'OD · Operación decisiva'],
  ['OC1', 'OC1 · Operación de configuración 1'],
  ['OC2', 'OC2 · Operación de configuración 2'],
  ['OC3', 'OC3 · Operación de configuración 3'],
  ['OC4', 'OC4 · Operación de configuración 4'],
  ['RES', 'RES · Reserva'],
  ['SOST', 'SOST · Operación de sostenimiento'],
]
const ROL_DE_OPERACION = { od: 'OD', oc1: 'OC1', oc2: 'OC2', oc3: 'OC3', oc4: 'OC4', reserva: 'RES', sost: 'SOST' }

// Qué se escribe en cada unidad, según su lugar y su arma (PMTD 2017, «enunciado del
// curso de acción»: maniobra T/P; apoyo de fuegos tarea, propósito, método —prioridad
// de apoyo de fuegos— y efecto; ingeniería prioridad de esfuerzo y de trabajo; defensa
// antiaérea y SPAC tarea, propósito y prioridad de apoyo).
export const CAMPOS = {
  superior: [['tarea', 'T'], ['proposito', 'P']],
  maniobra: [['tarea', 'T'], ['proposito', 'P']],
  fuegos: [['tarea', 'TAREA'], ['proposito', 'PROPÓSITO'], ['paf', 'PAF'], ['efecto', 'EFECTO']],
  ingenieria: [['pe', 'PE'], ['pt', 'PT'], ['tarea', 'TAREA'], ['proposito', 'PROPÓSITO']],
  apoyo: [['tarea', 'TAREA'], ['proposito', 'PROPÓSITO'], ['prioridad', 'PRIORIDAD DE APOYO']],
  spac: [['tarea', 'TAREA'], ['proposito', 'PROPÓSITO'], ['prioridad', 'PRIORIDAD DE APOYO']],
}
export const AYUDA_CAMPO = {
  tarea: 'Tarea: verbo en presente + tarea táctica + a quién o qué + dónde. «Defiende y bloquea al RIMEC-6 entre Co. X y Co. Y».',
  proposito: 'Propósito: empieza con infinitivo. «Evitar que…», «Impedir…», «Proteger…».',
  paf: 'Prioridad de apoyo de fuegos: a qué unidad (OD, OC1…).',
  efecto: 'Efecto que se espera: «Ocasionar el 30 % de daños a…», «impedir su progresión…».',
  pe: 'Prioridad de esfuerzo: movilidad, contramovilidad o supervivencia, y cómo.',
  pt: 'Prioridad de trabajo: a qué unidades, en orden.',
  prioridad: 'Prioridad de apoyo: a qué unidad y en qué orden.',
}
const TEXTOS = ['tarea', 'proposito', 'paf', 'efecto', 'pe', 'pt', 'prioridad']
const FUEGOS = ['artilleria', 'lanzacohetes', 'morteros']

export function tipoUnidad(u) {
  if (!u) return 'maniobra'
  if (u.grupo === 'superior2' || u.grupo === 'superior1') return 'superior'
  if (u.grupo === 'maniobra') return 'maniobra'
  if (u.grupo === 'spac') return 'spac'
  if (FUEGOS.includes(u.arma)) return 'fuegos'
  if (u.arma === 'ingenieria') return 'ingenieria'
  return 'apoyo'
}

// ─── Utilidades ──────────────────────────────────────────────────────────────
export const ESC = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
export const limpio = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const may1 = (s) => {
  const t = limpio(s)
  return t ? t[0].toUpperCase() + t.slice(1) : ''
}
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const clave = (s) => sinTildes(s).toUpperCase().replace(/[«»"'().,\-–—\s]+/g, ' ').trim()
export const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
export const romano = (n) => ROMANOS[n - 1] || String(n)
let serie = 0
export function nuevoId(prefijo = 'u') {
  const r = globalThis.crypto?.randomUUID?.()
  return r ? `${prefijo}-${r.slice(0, 8)}` : `${prefijo}-${Date.now().toString(36)}-${(serie++).toString(36)}`
}

const ABREVIATURAS = new Set(['co', 'coord', 'aprox', 'pag', 'num', 'nro', 'cnel', 'tcnl', 'gral', 'cmte', 'cdte', 'sgto', 'capt', 'dpto', 'prov', 'fig', 'art', 'inc', 'reg', 'ref', 'cia', 'esc', 'btr', 'bat', 'div', 'brig', 'ej', 'sr', 'rgto', 'bda', 'gte', 'cte', 'tte', 'subtte', 'may', 'ing'])
// Oraciones: no se corta en abreviaturas («Co. TUNARI», «DIV.MEC.-1», «Coord. 8100»).
export function oraciones(texto) {
  const t = limpio(texto)
  if (!t) return []
  const out = []
  let desde = 0
  const re = /([.;!?])\s+(?=\S)/g
  let m
  while ((m = re.exec(t))) {
    const antes = t.slice(desde, m.index)
    const ultima = (antes.split(/\s+/).pop() || '').replace(/^[(«"]+/, '')
    const sig = t.slice(m.index + m[0].length)
    if (m[1] === '.') {
      const u = sinTildes(ultima).toLowerCase().replace(/\./g, '')
      if (ABREVIATURAS.has(u) || /^\d+(?:ra|er|ro|do|to|vo|mo|no|a|o)$/.test(u) || (/^[a-z]{1,2}$/.test(u) && ultima !== ultima.toLowerCase())) continue
    }
    const empiezaOracion = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(sig) || /^[«"(¿¡]/.test(sig)
    if (!empiezaOracion && !(/[a-záéíóúñ]{3,}$/.test(ultima) && /^[A-ZÁÉÍÓÚÑ]/.test(sig))) continue
    out.push(t.slice(desde, m.index + 1).trim())
    desde = m.index + m[0].length
  }
  out.push(t.slice(desde).trim())
  return out.filter(Boolean)
}
const primeras = (t, n) => oraciones(t).slice(0, n).join(' ')

// Separa «tarea … con el propósito de …» en tarea y propósito.
export function separarTP(texto) {
  const t = limpio(texto)
  if (!t) return { tarea: '', proposito: '' }
  const m = t.match(/^(.*?)[,;:]?\s+(?:con\s+(?:el|la)\s+(?:prop[oó]sito|finalidad|objeto|intenci[oó]n)\s+de|a\s+fin\s+de|con\s+el\s+fin\s+de|para\s+(?=[a-záéíóúñ]+(?:ar|er|ir)(?:se|la|lo|las|los)?\b))\s*(.+)$/i)
  if (m && m[1].length > 8) return { tarea: may1(m[1].replace(/[.,;:]+$/, '')), proposito: may1(m[2]) }
  return { tarea: may1(t), proposito: '' }
}
// «La DIV.MEC.-1 defiende…» → «Defiende…».
function sinSujeto(texto, nombre) {
  let t = limpio(texto)
  if (!t) return ''
  const n = limpio(nombre)
  if (n && sinTildes(t).toUpperCase().replace(/^(LA|EL|LOS|LAS)\s+/, '').startsWith(sinTildes(n).toUpperCase())) {
    t = t.replace(/^(la|el|los|las)\s+/i, '').slice(n.length).replace(/^[\s,:]+/, '')
  }
  // «El I CE defiende…», «La FT LANZA ocupa…»: artículo + designación en mayúsculas + verbo.
  t = t.replace(/^(?:[Ee]l|[Ll]a|[Ll]os|[Ll]as)\s+(?:[A-ZÁÉÍÓÚÑ0-9(«][A-ZÁÉÍÓÚÑ0-9.\-–«»"()]*\s+){1,5}(?=[a-záéíóúñ])/, '')
  t = t.replace(/^tiene\s+(?:la\s+)?misi[oó]n\s+(?:impuesta\s+)?de\s+/i, '')
  return may1(t)
}

// ─── Lectura de lo guardado (incluye la hoja de antes y el formato narrativo) ─────
const SIMBOLO_V1 = { infanteria: 'infanteria', caballeria: 'caballeria', artilleria: 'artilleria', ingenieria: 'ingenieria', SPAC: 'logistica' }
const LIMITES = { nombre: 90, rotulo: 30, texto: 12, numero: 8, magnitud: 6 }

function normFase(f, i) {
  return { id: limpio(f?.id) || `F${i + 1}`, nombre: limpio(f?.nombre).slice(0, 120) }
}
function normTextoLargo(s) {
  return String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, 1200)
}
function normUnidad(u, i) {
  const r = {
    id: limpio(u.id) || `u-${i + 1}`,
    grupo: GRUPOS.includes(u.grupo) ? u.grupo : 'maniobra',
    nombre: limpio(u.nombre).slice(0, LIMITES.nombre),
    rotulo: limpio(u.rotulo).slice(0, LIMITES.rotulo),
    magnitud: limpio(u.magnitud).toUpperCase().replace(/\s+/g, '').slice(0, LIMITES.magnitud),
    arma: ARMAS[u.arma] ? u.arma : SIMBOLO_V1[u.simbolo] || '',
    texto: limpio(u.texto ?? (u.simbolo === 'CE' ? 'CE' : '')).slice(0, LIMITES.texto),
    numero: limpio(u.numero).slice(0, LIMITES.numero),
    rol: limpio(u.rol).toUpperCase().replace(/\s+/g, '').slice(0, 6),
    propia: !!u.propia,
    esfuerzo: !!u.esfuerzo,
    fases: [],
  }
  for (const k of TEXTOS) r[k] = normTextoLargo(u[k])
  if (u.origen) r.origen = limpio(u.origen)
  const fs = Array.isArray(u.fases) ? u.fases.filter(esObj) : []
  r.fases = fs.map((f, j) => {
    const x = { fase: limpio(f.fase) || limpio(f.id) || '', esfuerzo: !!f.esfuerzo }
    if (!x.fase && f.nombre != null) x._nombreV1 = limpio(f.nombre) || `FASE ${j + 1}`
    for (const k of TEXTOS) x[k] = normTextoLargo(f[k])
    return x
  })
  return r
}

export function normalizarConceptos(valor) {
  const v = esObj(valor) ? valor : {}
  let fases = (Array.isArray(v.fases) ? v.fases : []).filter(esObj).map(normFase)
  const vistos = new Set()
  fases = fases.filter((f) => (vistos.has(f.id) ? false : vistos.add(f.id)))
  const unidades = []
  const ids = new Set()
  for (const [i, u0] of (Array.isArray(v.unidades) ? v.unidades : []).filter(esObj).entries()) {
    const u = normUnidad(u0, i)
    while (ids.has(u.id)) u.id = `${u.id}-b`
    ids.add(u.id)
    // Hoja anterior (conceptos-v1): las fases eran propias de cada unidad, con nombre.
    for (const f of u.fases) {
      if (!f._nombreV1) continue
      let g = fases.find((x) => clave(x.nombre) === clave(f._nombreV1))
      if (!g) {
        g = { id: `F${fases.length + 1}`, nombre: f._nombreV1 }
        while (fases.some((x) => x.id === g.id)) g.id += 'b'
        fases.push(g)
      }
      f.fase = g.id
      delete f._nombreV1
    }
    for (const f of u.fases) if (f.fase && !fases.some((x) => x.id === f.fase)) fases.push({ id: f.fase, nombre: '' })
    unidades.push(u)
  }
  // Una sola caja en cada uno de los dos lugares de arriba.
  for (const g of ['superior2', 'superior1']) {
    const de = unidades.filter((u) => u.grupo === g)
    for (const u of de.slice(1)) u.grupo = 'maniobra'
  }
  const relaciones = (Array.isArray(v.relaciones) ? v.relaciones : [])
    .filter(esObj)
    .map((r) => ({ desde: limpio(r.desde), hasta: limpio(r.hasta), tipo: r.tipo === 'indirecta' ? 'indirecta' : 'directa' }))
    .filter((r, i, a) => ids.has(r.desde) && ids.has(r.hasta) && r.desde !== r.hasta && a.findIndex((x) => x.desde === r.desde && x.hasta === r.hasta) === i)
  const o = esObj(v.orientaciones) ? v.orientaciones : {}
  const orientaciones = {
    idea: String(o.idea ?? '').slice(0, 8000),
    info: String(o.info ?? '').slice(0, 60000),
    adjuntos: (Array.isArray(o.adjuntos) ? o.adjuntos : [])
      .filter(esObj)
      .map((a) => ({ nombre: limpio(a.nombre).slice(0, 120) || 'archivo', texto: String(a.texto ?? '').slice(0, 80000) }))
      .slice(0, 6),
  }
  return { ...v, esquema: ESQUEMA, enfoque: ENFOQUES[v.enfoque] ? v.enfoque : 'subordinadas', fases, unidades, relaciones, orientaciones }
}

// Los textos del formato narrativo de antes («INTENCIÓN DEL COMANDANTE SUPERIOR…»)
// quedan guardados tal cual: se muestran aparte y se le pasan a la IA.
const PROPIAS = new Set(['esquema', 'enfoque', 'fases', 'unidades', 'relaciones', 'orientaciones', 'armado', 'ia'])
export function antecedentesConceptos(valor) {
  return Object.entries(valor || {}).filter(([k, v]) => !PROPIAS.has(k) && !k.startsWith('_') && typeof v === 'string' && v.trim())
}
const conTexto = (u) => TEXTOS.some((k) => limpio(u[k])) || (u.fases || []).some((f) => TEXTOS.some((k) => limpio(f[k])))
export function tieneConceptos(v) {
  return normalizarConceptos(v).unidades.some((u) => limpio(u.nombre) || conTexto(u))
}

export function nuevaUnidad(id, grupo = 'maniobra') {
  return normUnidad({ id: id || nuevoId(), grupo }, 0)
}
export function eliminarUnidad(valor, id) {
  const v = normalizarConceptos(valor)
  return { ...v, unidades: v.unidades.filter((u) => u.id !== id), relaciones: v.relaciones.filter((r) => r.desde !== id && r.hasta !== id) }
}
export function nombreUnidad(u) {
  return limpio(u?.rotulo) || limpio(u?.nombre) || limpio(u?.texto) || 'Unidad sin nombre'
}

// Lo que falta, para avisarle al oficial (no bloquea el dibujo ni el Word).
export function revisarConceptos(valor) {
  const v = normalizarConceptos(valor)
  const avisos = []
  const faltan = { tarea: 0, proposito: 0, nombre: 0 }
  for (const u of v.unidades) {
    if (!limpio(u.nombre) && !limpio(u.texto)) faltan.nombre++
    const t = tipoUnidad(u)
    if (t === 'superior' || !u.fases.some((f) => TEXTOS.some((k) => limpio(f[k])))) {
      if (t !== 'ingenieria' && !limpio(u.tarea)) faltan.tarea++
      if (t !== 'ingenieria' && !limpio(u.proposito)) faltan.proposito++
    }
  }
  const man = v.unidades.filter((u) => u.grupo === 'maniobra')
  if (!v.unidades.some((u) => u.grupo === 'superior2')) avisos.push(`Falta la caja de arriba: ${ENFOQUES[v.enfoque].grupos.superior2}.`)
  if (!v.unidades.some((u) => u.grupo === 'superior1')) avisos.push(`Falta la segunda caja: ${ENFOQUES[v.enfoque].grupos.superior1}.`)
  if (!man.length) avisos.push('Todavía no hay unidades de maniobra.')
  if (man.length && !man.some((u) => u.rol === 'OD')) avisos.push('Ninguna unidad de maniobra lleva la OD (operación decisiva).')
  if (man.filter((u) => u.rol === 'OD').length > 1) avisos.push('Hay más de una OD: la operación decisiva es una sola.')
  for (const f of v.fases) {
    const ep = man.filter((u) => u.fases.some((x) => x.fase === f.id && x.esfuerzo))
    if (ep.length > 1) avisos.push(`En la fase ${f.id} hay ${ep.length} esfuerzos principales: tiene que ser uno.`)
  }
  if (faltan.nombre) avisos.push(`${faltan.nombre} unidad(es) sin nombre.`)
  if (faltan.tarea) avisos.push(`${faltan.tarea} unidad(es) sin tarea.`)
  if (faltan.proposito) avisos.push(`${faltan.proposito} unidad(es) sin propósito.`)
  return avisos
}
// Compatibilidad con la hoja anterior: sólo avisos, nunca impide dibujar.
export const validarConceptos = revisarConceptos

// ─── Armado automático con lo que ya tiene el ejercicio ─────────────────────────
// Tareas tácticas de la Mesa (catálogo `zg`) en tercera persona, como las escribe
// el PMTD («defiende y bloquea…»).
const TAREAS = {
  atacar_fuego: 'Ataca con fuego', apoyar_fuego: 'Apoya por fuego', franquear: 'Franquea', sobrepasar: 'Sobrepasa', limpiar: 'Limpia',
  contrareconocer: 'Contrarreconoce', romper_contacto: 'Rompe el contacto', exfiltrar: 'Exfiltra', seguir_asumir: 'Sigue y asume',
  seguir_apoyar: 'Sigue y apoya', reducir: 'Reduce', controlar: 'Controla', ocupar: 'Ocupa', mantener: 'Mantiene', asegurar: 'Asegura',
  conquistar: 'Conquista', bloquear: 'Bloquea', canalizar: 'Canaliza', contener: 'Contiene', derrotar: 'Derrota', destruir: 'Destruye',
  desorganizar: 'Desorganiza', fijar: 'Fija', interdictar: 'Interdicta', aislar: 'Aísla', neutralizar: 'Neutraliza', suprimir: 'Suprime', desviar: 'Desvía',
}
const TAREAS_ENEMIGO = ['bloquear', 'canalizar', 'contener', 'derrotar', 'destruir', 'desorganizar', 'fijar', 'interdictar', 'aislar', 'neutralizar', 'suprimir', 'desviar']
export function tareaEnTercera(id, { defensiva = false } = {}) {
  const t = TAREAS[id]
  if (!t) return ''
  return defensiva && TAREAS_ENEMIGO.includes(id) ? `Defiende y ${t[0].toLowerCase()}${t.slice(1)}` : t
}

// Símbolo de las piezas de la Organización de la tarea → arma de la hoja.
const ARMA_DE_SIMBOLO = {
  blindaje: 'blindada', mediano: 'blindada', cab_blindada: 'cabmec', infanteria: 'infanteria', inf_ligera: 'infanteria', inf_mecanizada: 'mecanizada',
  inf_montania: 'andina', inf_asalto_aereo: 'aerotransportada', inf_aerotransportada: 'aerotransportada', antitanque: 'antitanque',
  ingenieros: 'ingenieria', ada: 'antiaerea', cab_antiaerea: 'antiaerea', artilleria: 'artilleria', morteros: 'morteros', logistica: 'logistica',
  sanidad: 'sanidad', policia: 'policiamilitar', comunicaciones: 'comunicaciones', heli_ataque: 'aviacion', heli_transporte: 'aviacion',
}
function armaDePiezas(piezas) {
  const cuenta = {}
  for (const p of piezas || []) {
    const a = ARMA_DE_SIMBOLO[p?.simbolo]
    if (a) cuenta[a] = (cuenta[a] || 0) + 1
  }
  const lista = Object.entries(cuenta).sort((a, b) => b[1] - a[1])
  return (lista.find(([a]) => ARMAS[a].grupo === 'maniobra') || lista[0] || [''])[0]
}
export function escalonDeNombre(nombre) {
  const n = ` ${sinTildes(nombre).toUpperCase().replace(/[«»"]/g, ' ')} `
  if (!n.trim()) return ''
  if (/\b(TEATRO|T\.\s?O\.|FF\.?\s?TT\.?|FUERZAS TERRESTRES|COMANDO CONJUNTO)/.test(n)) return 'ejercito'
  if (/\b(CUERPO|C\.\s?E\.|CE)\b/.test(n)) return 'cuerpo'
  if (/\b(DIV|DIVISION|DIMEC|DIMOT|DIMEC-\d)/.test(n)) return 'division'
  if (/\b(BRIG|BRIGADA)/.test(n)) return 'brigada'
  if (/\b(REGIMIENTO|REG\.|RIMEC|RIM|RCB|RCM|RCMEC|RI|RC|RA|RAT|RAAA)\b/.test(n)) return 'regimiento'
  if (/\b(BATALLON|BAT\.|B\.\s?I\.|B\.\s?ING|BING|BLOG|B\.\s?LOG|GA|G\.\s?A\.|GAC|BIM)\b/.test(n)) return 'batallon'
  if (/\b(COMPANIA|CIA|ESCUADRON|ESC\.|BATERIA|BTR|EQUIPO DE COMBATE)\b/.test(n)) return 'compania'
  return ''
}
export function armaDeNombre(nombre) {
  const n = ` ${sinTildes(nombre).toUpperCase()} `
  if (/\b(CUERPO|C\.\s?E\.|CE|TEATRO|FF\.?\s?TT)\b/.test(n)) return ''
  const mec = /MEC/.test(n)
  if (/\b(CAB|RC|RCB|RCM|CABALLERIA)/.test(n)) return mec || /BLIND/.test(n) ? 'cabmec' : 'caballeria'
  if (/BLIND|ACORAZ|TANQ/.test(n)) return 'blindada'
  if (/\b(ART|RA|GA|GAC|ARTILLERIA)\b/.test(n)) return 'artilleria'
  if (/\b(ING|BING|INGENIER)/.test(n)) return 'ingenieria'
  if (/\b(LOG|BLOG|LOGISTIC)/.test(n)) return 'logistica'
  if (/\b(SAN|SANIDAD)\b/.test(n)) return 'sanidad'
  if (/\b(COM|COMUNICACIONES|TRANSMISIONES)\b/.test(n)) return 'comunicaciones'
  if (/ANTITANQUE|\bRAT\b|\bAT\b/.test(n)) return 'antitanque'
  if (/ANTIAERE|\bAAA?\b|\bDAA\b/.test(n)) return 'antiaerea'
  if (/MOTORIZ|\bMOT\b/.test(n)) return 'motorizada'
  if (mec) return 'mecanizada'
  if (/\b(INF|RI|BI|INFANTERIA)/.test(n)) return 'infanteria'
  return ''
}
function numeroDeNombre(nombre) {
  const n = limpio(nombre).toUpperCase()
  const m = n.match(/(?:^|[\s.\-–])(\d{1,3})\s*(?:$|[\s.»])/) || n.match(/^([IVX]{1,4})\s/) || n.match(/[\s.\-–]([IVX]{1,4})$/)
  return m ? m[1] : ''
}
function textoCaja(nombre, escalon) {
  const n = sinTildes(nombre).toUpperCase()
  if (escalon === 'cuerpo') return 'CE'
  if (/TEATRO|\bT\.\s?O\./.test(n)) return 'TO'
  if (/FF\.?\s?TT|FUERZAS TERRESTRES/.test(n)) return 'FF.TT.'
  if (escalon === 'ejercito') return 'EJTO.'
  return ''
}
export function rotuloCorto(nombre) {
  // Sólo para denominaciones largas: «Regimiento de Caballería Mecanizada 2 «TARAPACÁ»»
  // no entra junto al gráfico; «RCM-2 «TARAPACÁ»» sí.
  const n = limpio(nombre)
  if (n.length <= 28) return ''
  const m = n.match(/«([^»]+)»/)
  if (!m) return ''
  const pref = (n.match(/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ./]*(?:[-–]\s?\d+)?(?=[\s«])/) || [''])[0]
  return limpio(`${pref} «${m[1]}»`)
}
function nombreOrg(o) {
  const rol = ROL_DE_OPERACION[o?.operacion]
  const n = limpio(o?.nombre) || (rol ? `Agrupación ${rol}` : 'Agrupación')
  return o?.ft ? (/^\s*(FT|F\/T|FUERZA DE TAREA)\b/i.test(n) ? n : `FT «${n}»`) : n
}
const ESC_NIVEL = (e) => ESCALONES.indexOf(e)

function unidadesDelEjercicio(ctx, escPropia, nomPropia) {
  const fichas = (ctx.unidades || []).filter((u) => u && (u.tipo || 'unidad') === 'unidad' && String(u.bando || '').toLowerCase() !== 'enemigo')
  const orgs = (ctx.orgTarea || []).filter(esObj)
  const nivelPropio = ESC_NIVEL(escPropia)
  const esPropia = (n) => nomPropia && clave(n) === clave(nomPropia)
  const out = []
  for (const o of orgs) {
    const nombre = nombreOrg(o)
    const arma = (o.clase === 'pura' && ARMAS[o.arma] ? o.arma : '') || armaDePiezas(o.piezas) || 'infanteria'
    const rol = ROL_DE_OPERACION[o.operacion] || ''
    const ficha = fichas.find((f) => f.agId === o.id)
    // Una FT o agrupación con OD / OC / reserva es maniobra; la de sostenimiento, SPAC;
    // una unidad pura, lo que diga su arma.
    let grupo = ARMAS[arma]?.grupo || 'maniobra'
    if (rol === 'SOST') grupo = 'spac'
    else if (o.clase !== 'pura' && (rol || o.ft)) grupo = 'maniobra'
    out.push({
      origen: `org:${o.id}`,
      grupo,
      nombre,
      rotulo: rotuloCorto(nombre),
      magnitud: magnitudDeEscalon(o.escalon),
      arma,
      rol: rol === 'SOST' ? '' : rol,
      tareaId: o.tarea || '',
      proposito: may1(o.proposito),
      lng: Number(ficha?.lng),
    })
  }
  const integradas = {}
  for (const o of orgs) for (const p of o.piezas || []) if (p?.de) integradas[p.de] = (integradas[p.de] || 0) + 1
  for (const f of fichas) {
    if (f.esAgrupacion || f.agId || f.agrupacion) continue
    const nombre = limpio(f.designacion) || `${ARMAS[f.arma]?.nom || 'Unidad'} ${f.escalon || ''}`.trim()
    if (esPropia(nombre)) continue
    if (nivelPropio >= 0 && ESC_NIVEL(f.escalon) >= nivelPropio) continue
    const total = Number(f.piezas) || 0
    const dadas = integradas[f.id] || 0
    if (total && dadas >= total) continue
    const arma = ARMAS[f.arma] ? f.arma : armaDeNombre(nombre)
    out.push({
      origen: `ficha:${f.id}`,
      grupo: ARMAS[arma]?.grupo || 'maniobra',
      nombre: dadas ? `${nombre} (-)` : nombre,
      rotulo: rotuloCorto(nombre),
      magnitud: magnitudDeEscalon(f.escalon),
      arma,
      rol: '',
      tareaId: '',
      proposito: '',
      lng: Number(f.lng),
    })
  }
  return out
}

function ordenarManiobra(lista) {
  if (lista.length > 1 && lista.every((u) => Number.isFinite(u.lng))) return [...lista].sort((a, b) => a.lng - b.lng)
  const peso = (u) => ({ OC1: 1, OC2: 2, OC3: 3, OC4: 4, RES: 6 })[u.rol] ?? 5
  const sinOD = lista.filter((u) => u.rol !== 'OD').sort((a, b) => peso(a) - peso(b))
  const od = lista.filter((u) => u.rol === 'OD')
  const medio = Math.floor(sinOD.length / 2)
  return [...sinOD.slice(0, medio), ...od, ...sinOD.slice(medio)]
}

function tpDeMision(ctx, nomPropia) {
  const os = ctx.ordenSup || {}
  const m = ctx.g3?.mision || {}
  const enunciado = limpio(m['ENUNCIADO COMPLETO DE LA MISIÓN'])
  let { tarea, proposito } = separarTP(primeras(enunciado || os.mision, 1))
  if (!tarea) {
    const que = limpio(m['QUÉ (tipo de operación + tarea esencial, como tarea táctica)']).replace(/\s*\(tarea táctica trazada en el calco\)/i, '')
    tarea = may1(que)
  }
  if (!proposito) proposito = may1(limpio(m['PROPÓSITO (el porqué de la operación)']))
  return { tarea: sinSujeto(tarea, nomPropia), proposito, fuente: enunciado ? 'Reexpresión de la misión (F2·P12)' : limpio(os.mision) ? 'Misión recibida (orden del escalón superior)' : '' }
}
function tpDeSuperior(ctx, nomSup) {
  const os = ctx.ordenSup || {}
  let { tarea, proposito } = separarTP(primeras(os.propias, 1))
  if (!proposito) {
    const i = limpio(os.intencion)
    const m = i.match(/prop[oó]sito[^:]*[:\s]+(?:es\s+)?(.+?)(?:\.\s|$)/i)
    proposito = may1(m ? m[1] : primeras(i, 1))
  }
  return { tarea: sinSujeto(tarea, nomSup), proposito: proposito.replace(/\.$/, '') }
}

function construir(ctx, enfoque) {
  const os = ctx.ordenSup || {}
  const nomPropia = limpio(os.unidad || ctx.unidad)
  const fichasPropias = (ctx.unidades || []).filter((u) => u && String(u.bando || '').toLowerCase() !== 'enemigo')
  let escPropia = escalonDeNombre(nomPropia)
  if (!escPropia) {
    const max = Math.max(-1, ...fichasPropias.map((u) => ESC_NIVEL(u.escalon)))
    escPropia = max >= 0 ? ESCALONES[Math.min(max + 1, ESCALONES.length - 1)] : ''
  }
  const nomSup = limpio(os.escalonSuperior)
  const escSup = escalonDeNombre(nomSup) || (escPropia ? ESCALONES[Math.min(ESC_NIVEL(escPropia) + 1, ESCALONES.length - 1)] : '')
  const defensiva = String(ctx.ops?.areaOps?.tipo || '').toLowerCase().startsWith('defens')
  const fuentes = []
  const mis = tpDeMision(ctx, nomPropia)
  const sup = tpDeSuperior(ctx, nomSup)
  if (nomSup || sup.tarea) fuentes.push('Orden del escalón superior')
  if (mis.fuente) fuentes.push(mis.fuente)
  const propia = {
    origen: 'orden:propia', propia: true, nombre: nomPropia, magnitud: magnitudDeEscalon(escPropia), arma: armaDeNombre(nomPropia),
    texto: textoCaja(nomPropia, escPropia), numero: numeroDeNombre(nomPropia), tarea: mis.tarea, proposito: mis.proposito,
  }
  const superior = {
    origen: 'orden:superior', nombre: nomSup, magnitud: magnitudDeEscalon(escSup), arma: armaDeNombre(nomSup),
    texto: textoCaja(nomSup, escSup), numero: nomSup && escSup === 'cuerpo' ? '' : numeroDeNombre(nomSup), tarea: sup.tarea, proposito: sup.proposito,
  }
  const fases = (ctx.fasesCOA?.propio || []).map((f, i) => ({ id: `F${i + 1}`, nombre: limpio(f?.nombre) || primeras(f?.descripcion, 1).slice(0, 80) }))
  if (fases.length) fuentes.push(`Fases del curso de acción propio (${fases.length})`)

  const unidades = []
  const add = (grupo, u) => {
    const r = normUnidad({ ...u, id: nuevoId('u'), grupo }, 0)
    r.origen = u.origen
    unidades.push(r)
    return r
  }
  if (enfoque === 'adyacentes') {
    add('superior2', { origen: 'orden:dos-arriba', nombre: '', magnitud: magnitudArriba(superior.magnitud) })
    add('superior1', superior)
    add('maniobra', { ...propia })
  } else {
    add('superior2', superior)
    add('superior1', propia)
    const propias = unidadesDelEjercicio(ctx, escPropia, nomPropia)
    const nOrg = propias.filter((u) => u.origen.startsWith('org:')).length
    const nFicha = propias.length - nOrg
    if (nOrg) fuentes.push(`Organización de la tarea (${nOrg})`)
    if (nFicha) fuentes.push(`Fichas del calco (${nFicha})`)
    const conT = (u) => ({ ...u, tarea: tareaEnTercera(u.tareaId, { defensiva }) })
    for (const u of ordenarManiobra(propias.filter((u) => u.grupo === 'maniobra'))) add('maniobra', conT(u))
    for (const u of propias.filter((u) => u.grupo === 'apoyo')) add('apoyo', conT(u))
    for (const u of propias.filter((u) => u.grupo === 'spac')) add('spac', conT(u))
  }
  // Relaciones por defecto (se corrigen a mano o con la IA).
  const relaciones = []
  const rel = (a, b, tipo = 'directa') => a && b && a !== b && relaciones.push({ desde: a.id, hasta: b.id, tipo })
  const s2 = unidades.find((u) => u.grupo === 'superior2')
  const s1 = unidades.find((u) => u.grupo === 'superior1')
  const man = unidades.filter((u) => u.grupo === 'maniobra')
  const od = man.find((u) => u.rol === 'OD')
  if (s2 && (s2.nombre || s2.texto)) rel(s1, s2)
  if (enfoque === 'adyacentes') {
    for (const u of man) rel(u, s1)
  } else {
    for (const u of man) {
      if (u === od) rel(u, s1)
      else if (/^OC/.test(u.rol)) rel(u, od || s1)
      else if (u.rol === 'RES') rel(u, od || s1, 'indirecta')
    }
    if (!od && man.length && !man.some((u) => u.rol)) for (const u of man) rel(u, s1)
    for (const u of unidades.filter((x) => x.grupo === 'apoyo')) {
      if (od) rel(u, od)
      if (['fuegos', 'ingenieria'].includes(tipoUnidad(u))) for (const m of man.filter((m) => m !== od && /^OC/.test(m.rol))) rel(u, m, 'indirecta')
    }
    for (const u of unidades.filter((x) => x.grupo === 'spac')) if (od) rel(u, od)
  }
  return { fases, unidades, relaciones, fuentes }
}

// Arma la hoja con lo del ejercicio. `pisar: false` (por defecto) sólo AGREGA lo que
// falta: no toca una coma de lo que el oficial (o la IA) ya escribió.
export function armarDesdeEjercicio(ctx = {}, { enfoque, previo = null, pisar = false } = {}) {
  const ant = normalizarConceptos(previo)
  const enf = ENFOQUES[enfoque] ? enfoque : ant.enfoque
  const nuevo = construir(ctx || {}, enf)
  const fecha = new Date().toISOString()
  if (pisar || !ant.unidades.length) {
    const valor = { ...ant, enfoque: enf, fases: nuevo.fases, unidades: nuevo.unidades, relaciones: nuevo.relaciones, armado: { fecha, fuentes: nuevo.fuentes } }
    return { valor, resumen: { agregadas: nuevo.unidades.length, completadas: 0, fuentes: nuevo.fuentes } }
  }
  const unidades = ant.unidades.map((u) => ({ ...u, fases: u.fases.map((f) => ({ ...f })) }))
  const fases = ant.fases.map((f) => ({ ...f }))
  const idFase = {}
  for (const f of nuevo.fases) {
    const igual = fases.find((x) => x.id === f.id)
    if (igual) {
      if (!igual.nombre && f.nombre) igual.nombre = f.nombre
      idFase[f.id] = igual.id
    } else {
      fases.push({ ...f })
      idFase[f.id] = f.id
    }
  }
  const mapa = {}
  let agregadas = 0
  let completadas = 0
  for (const n of nuevo.unidades) {
    const e =
      unidades.find((u) => u.origen && u.origen === n.origen) ||
      unidades.find((u) => u.grupo === n.grupo && (n.grupo.startsWith('superior') || (limpio(n.nombre) && clave(u.nombre) === clave(n.nombre))))
    if (!e) {
      if (n.grupo.startsWith('superior') && unidades.some((u) => u.grupo === n.grupo)) continue
      unidades.push(n)
      mapa[n.id] = n.id
      agregadas++
      continue
    }
    mapa[n.id] = e.id
    let cambio = false
    for (const k of ['nombre', 'rotulo', 'magnitud', 'arma', 'texto', 'numero', 'rol', ...TEXTOS]) {
      if (!limpio(e[k]) && limpio(n[k])) {
        e[k] = n[k]
        cambio = true
      }
    }
    if (!e.origen && n.origen) e.origen = n.origen
    if (cambio) completadas++
  }
  const relaciones = [...ant.relaciones]
  for (const r of nuevo.relaciones) {
    const desde = mapa[r.desde]
    const hasta = mapa[r.hasta]
    if (desde && hasta && desde !== hasta && !relaciones.some((x) => (x.desde === desde && x.hasta === hasta) || (x.desde === hasta && x.hasta === desde))) relaciones.push({ desde, hasta, tipo: r.tipo })
  }
  const valor = { ...ant, enfoque: enf, fases, unidades, relaciones, armado: { fecha, fuentes: nuevo.fuentes } }
  return { valor, resumen: { agregadas, completadas, fuentes: nuevo.fuentes } }
}

// ─── Texto (para el expediente, la carpeta y el pedido a la IA) ───────────────────
function lineaUnidad(u, v) {
  const partes = []
  const cab = [u.rol, nombreUnidad(u) !== limpio(u.nombre) && limpio(u.nombre) ? `${nombreUnidad(u)} (${u.nombre})` : nombreUnidad(u)].filter(Boolean).join(' ')
  const datos = [u.magnitud, ARMAS[u.arma]?.nom, u.propia ? 'UNIDAD PROPIA' : '', u.esfuerzo ? 'esfuerzo principal' : ''].filter(Boolean).join(', ')
  partes.push(`${cab}${datos ? ` (${datos})` : ''}`)
  const campos = CAMPOS[tipoUnidad(u)]
  const txt = (o) => campos.map(([k, r]) => limpio(o[k]) && `${r}: ${limpio(o[k])}`).filter(Boolean).join(' · ')
  if (txt(u)) partes.push(txt(u))
  for (const f of u.fases) {
    const t = txt(f)
    if (t) partes.push(`${f.fase}${f.esfuerzo ? ' [ESFUERZO PRINCIPAL]' : ''} → ${t}`)
  }
  return partes.join(' — ')
}
export function textoConceptos(valor) {
  const v = normalizarConceptos(valor)
  if (!v.unidades.length) {
    const ant = antecedentesConceptos(v)
    return ant.length ? ant.map(([k, t]) => `  - ${k}: ${limpio(t)}`).join('\n') : ''
  }
  const g = ENFOQUES[v.enfoque].grupos
  const l = [`  - Nivel de la hoja: ${ENFOQUES[v.enfoque].nom}.`]
  if (v.fases.length) l.push(`  - Fases: ${v.fases.map((f) => `${f.id} ${f.nombre || ''}`.trim()).join(' · ')}`)
  for (const grupo of GRUPOS) for (const u of v.unidades.filter((x) => x.grupo === grupo)) l.push(`  - [${g[grupo]}] ${lineaUnidad(u, v)}`)
  const nom = (id) => nombreUnidad(v.unidades.find((u) => u.id === id))
  if (v.relaciones.length) l.push(`  - Relaciones: ${v.relaciones.map((r) => `${nom(r.desde)} → ${nom(r.hasta)} (${r.tipo})`).join(' · ')}`)
  return l.join('\n')
}
export function resumenConceptos(valor) {
  const v = normalizarConceptos(valor)
  const cuenta = (g) => v.unidades.filter((u) => u.grupo === g).length
  return { maniobra: cuenta('maniobra'), apoyo: cuenta('apoyo'), spac: cuenta('spac'), superiores: cuenta('superior1') + cuenta('superior2'), fases: v.fases.length, relaciones: v.relaciones.length, total: v.unidades.length }
}
