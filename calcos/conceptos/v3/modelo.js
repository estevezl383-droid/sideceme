// Hoja de trabajo de CONCEPTOS ENTRELAZADOS (F2·P1) — PMTD 2017 (RO-01-02-06),
// hoja de trabajo de la pág. 20 y su ejemplo de las págs. 21 y 22. Versión 3.
//
// Este archivo es el MODELO, sin DOM (se prueba en Node): el esquema de la hoja,
// la lectura de lo guardado por versiones anteriores y el ARMADO AUTOMÁTICO con lo
// que ya tiene el ejercicio. El dibujo está en laminas.js y el trabajo con IA en ia.js.
//
// La hoja tiene cuatro lugares:
//   superior  → la CADENA DE MANDO, de arriba hacia abajo (relación VERTICAL):
//               CTO (XXXXX) → FF.TT.T.O. (XXXX) → CE (XXX) → DIVISIÓN (XX)…
//               Con las opciones «puras» y «ft», la última caja es la UNIDAD PROPIA.
//   maniobra  → la fila de maniobra, DEBAJO de la unidad propia (relación HORIZONTAL)
//   apoyo · spac → apoyo de combate y apoyo de servicio de combate
// Qué va en las filas lo decide la OPCIÓN que elige el oficial (enfoque):
//   puras      → las unidades orgánicas que dependen DIRECTAMENTE de su unidad, como
//                están en la organización de la tarea de la orden;
//   ft         → las FT / agrupaciones tácticas que armó en 🧩 Organización de la tarea;
//   adyacentes → su unidad entre las del mismo escalón (análisis de la orden superior).

export const ESQUEMA = 'conceptos-v3'
export const GRUPOS = ['superior', 'maniobra', 'apoyo', 'spac']

// ─── Escalones y magnitudes ──────────────────────────────────────────────────────
// Como lo indicó el docente: el CTO es XXXXX; debajo del CTO, el Comando de las
// Fuerzas Terrestres del TO (FF.TT.T.O.), XXXX; debajo, los Cuerpos de Ejército,
// XXX; debajo, la División, XX; debajo, los regimientos (III), batallones (II) y
// compañías (I). Una FT o agrupación táctica también va DEBAJO de la División.
export const ESCALON = {
  teatro: { nivel: 10, mag: 'XXXXX', nom: 'Comando del Teatro de Operaciones', abrev: 'CTO' },
  fftt: { nivel: 9, mag: 'XXXX', nom: 'Comando de las Fuerzas Terrestres del Teatro de Operaciones', abrev: 'FF.TT.T.O.' },
  ejercito: { nivel: 9, mag: 'XXXX', nom: 'Ejército', abrev: 'EJTO.' },
  cuerpo: { nivel: 8, mag: 'XXX', nom: 'Cuerpo de Ejército', abrev: 'CE' },
  division: { nivel: 7, mag: 'XX', nom: 'División', abrev: 'DIV' },
  brigada: { nivel: 6, mag: 'X', nom: 'Brigada', abrev: 'BRIG' },
  regimiento: { nivel: 5, mag: 'III', nom: 'Regimiento', abrev: 'REG' },
  batallon: { nivel: 4, mag: 'II', nom: 'Batallón', abrev: 'BAT' },
  compania: { nivel: 3, mag: 'I', nom: 'Compañía / Escuadrón / Batería', abrev: 'CIA' },
  seccion: { nivel: 2, mag: '•••', nom: 'Sección', abrev: 'SECC' },
  escuadra: { nivel: 1, mag: '••', nom: 'Grupo / Escuadra', abrev: '' },
  equipo: { nivel: 0, mag: '•', nom: 'Equipo', abrev: '' },
}
// La cadena de mando del Ejército, de arriba hacia abajo (la División manda
// directamente a sus regimientos, batallones y compañías).
const ESCALERA = ['teatro', 'fftt', 'cuerpo', 'division', 'regimiento', 'batallon', 'compania']
const ESCALON_DE_MAG = { XXXXX: 'teatro', XXXX: 'fftt', XXX: 'cuerpo', XX: 'division', X: 'brigada', III: 'regimiento', II: 'batallon', I: 'compania', '•••': 'seccion', '••': 'escuadra' }
export const nivelEscalon = (e) => ESCALON[e]?.nivel ?? -1
export const magnitudDeEscalon = (e) => ESCALON[e]?.mag || ''
export const escalonDeMagnitud = (m) => ESCALON_DE_MAG[m] || ''

export const MAGNITUDES = [
  ['', '—'],
  ['XXXXX', 'XXXXX · CTO (Comando del Teatro de Operaciones)'],
  ['XXXX', 'XXXX · FF.TT.T.O. (Fuerzas Terrestres del TO)'],
  ['XXX', 'XXX · Cuerpo de Ejército'],
  ['XX', 'XX · División'],
  ['X', 'X · Brigada'],
  ['III', 'III · Regimiento'],
  ['II', 'II · Batallón'],
  ['I', 'I · Compañía / Escuadrón / Batería'],
  ['•••', '••• · Sección'],
  ['••', '•• · Grupo / Escuadra'],
]

const CADENA_TXT = 'CTO (XXXXX) → FF.TT.T.O. (XXXX) → CE (XXX) → División (XX)'
export const ENFOQUES = {
  puras: {
    nom: 'Unidades puras (orgánicas)',
    corto: 'Como la organización de la tarea de la orden',
    ayuda: `Arriba, la cadena de mando: ${CADENA_TXT}. Debajo de tu unidad, las que dependen DIRECTAMENTE de ella, tal como están en la organización de la tarea de la orden (regimientos, batallones, compañías y las que están BAJO CONTROL). Sus escuadrones, compañías, baterías y secciones no se dibujan: son parte de cada unidad.`,
    grupos: { superior: 'Cadena de mando (hasta tu unidad)', maniobra: 'Unidades de maniobra de tu unidad', apoyo: 'Unidades de apoyo de combate de tu unidad', spac: 'Unidades de apoyo de servicio de combate de tu unidad' },
  },
  ft: {
    nom: 'FT / agrupaciones tácticas',
    corto: 'Las que armaste en 🧩 Organización de la tarea',
    ayuda: `Arriba, la misma cadena de mando: ${CADENA_TXT}. Debajo de tu unidad, las fuerzas de tarea o agrupaciones tácticas que armaste en 🧩 Organización de la tarea, con su OD / OC / RES / SOST, su tarea y su propósito; y lo que quedó con su unidad orgánica («(-)» si dio parte de sus elementos).`,
    grupos: { superior: 'Cadena de mando (hasta tu unidad)', maniobra: 'FT / agrupaciones de maniobra', apoyo: 'Apoyo de combate', spac: 'Apoyo de servicio de combate' },
  },
  adyacentes: {
    nom: 'Mi unidad entre las adyacentes',
    corto: 'Análisis de la orden superior',
    ayuda: 'Arriba, la cadena de mando hasta tu comando inmediato superior (CTO → FF.TT.T.O. → CE). En la fila, TU unidad al centro con las del mismo escalón que manda ese comando (las otras divisiones), como las ordena la orden superior. Apoyo de combate y SPAC del escalón superior.',
    grupos: { superior: 'Cadena de mando (hasta tu comando superior)', maniobra: 'Mi unidad y las adyacentes', apoyo: 'Apoyo de combate del escalón superior', spac: 'Apoyo de servicio de combate del escalón superior' },
  },
}
// La hoja v2 decía «subordinadas» a lo que hoy es la opción de las FT (tomaba la
// organización de la tarea y lo que quedaba en el calco).
const ENFOQUE_V2 = { subordinadas: 'ft' }
export const enfoqueValido = (e) => (ENFOQUES[e] ? e : ENFOQUE_V2[e] || 'puras')

// Armas: el símbolo que va DENTRO del cuadro y el lugar de la hoja que le toca.
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
  antitanque: { nom: 'Antitanque', grupo: 'apoyo' },
  artilleria: { nom: 'Artillería de campaña', grupo: 'apoyo' },
  lanzacohetes: { nom: 'Lanzacohetes', grupo: 'apoyo' },
  morteros: { nom: 'Morteros', grupo: 'apoyo' },
  antiaerea: { nom: 'Artillería antiaérea (DAA)', grupo: 'apoyo' },
  ingenieria: { nom: 'Ingeniería', grupo: 'apoyo' },
  comunicaciones: { nom: 'Comunicaciones', grupo: 'apoyo' },
  inteligencia: { nom: 'Inteligencia', grupo: 'apoyo' },
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
  if (u.grupo === 'superior') return 'superior'
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
const clave = (s) => sinTildes(s).toUpperCase().replace(/[«»“”"'().,\-–—\s]+/g, ' ').trim()
export const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
export const romano = (n) => ROMANOS[n - 1] || String(n)
let serie = 0
export function nuevoId(prefijo = 'u') {
  const r = globalThis.crypto?.randomUUID?.()
  return r ? `${prefijo}-${r.slice(0, 8)}` : `${prefijo}-${Date.now().toString(36)}-${(serie++).toString(36)}`
}

const ABREVIATURAS = new Set(['co', 'coord', 'aprox', 'pag', 'num', 'nro', 'cnel', 'cnl', 'tcnl', 'gral', 'cmte', 'cdte', 'sgto', 'capt', 'dpto', 'prov', 'fig', 'art', 'inc', 'reg', 'ref', 'cia', 'esc', 'btr', 'bat', 'div', 'brig', 'ej', 'ejto', 'sr', 'rgto', 'bda', 'gte', 'cte', 'tte', 'subtte', 'may', 'ing', 'mec', 'log', 'com', 'comp', 'edron', 'secc', 'av', 'icia', 'cmdo', 'tq', 'inf', 'ap', 'ae', 'san', 'mtto', 'transp', 'abtto', 'elect', 'hum'])
// Oraciones: no se corta en abreviaturas («Co. TUNARI», «DIV.MEC.-1», «FF.TT.T.O.»).
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
      if (ABREVIATURAS.has(u) || /^\d+(?:ra|er|ro|do|to|vo|mo|no|a|o)$/.test(u) || (/^[a-z]{1,2}$/.test(u) && ultima !== ultima.toLowerCase()) || /\.[A-Za-z]{1,3}$/.test(ultima)) continue
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
// El propósito empieza con infinitivo: se le saca el conector («CON EL PROPÓSITO DE
// DETENER…» → «DETENER…», «de bloquear…» → «Bloquear…»).
export function limpiarProposito(texto) {
  const t = limpio(texto).replace(/^(?:con\s+(?:el|la)\s+(?:prop[oó]sito|finalidad|objeto)\s+de|a\s+fin\s+de|con\s+el\s+fin\s+de|para|de)\s+/i, '')
  return may1(t)
}
// La designación con la que empieza una frase: «La DIVMEC-1 defiende…» → «DIVMEC-1».
export function designacionAlInicio(frase) {
  const t = limpio(frase)
  const m = t.match(/^(?:(?:[Ee]l|[Ll]a|[Ll]os|[Ll]as)\s+)?((?:[A-ZÁÉÍÓÚÑ0-9«"“(]\S*\s+){0,5}?[A-ZÁÉÍÓÚÑ0-9«"“(]\S*)\s+(?=[a-záéíóúñ])/)
  if (!m) return ''
  const d = m[1].trim()
  return /[A-ZÁÉÍÓÚÑ]{2}|\d/.test(d) ? d : ''
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

// ─── Leer una designación (RCB-1 «CALAMA», BAT. LOG. - I, DIVMEC-1, I CE…) ─────────
// Sin el nombre entre comillas, en mayúsculas y sin tildes: « RCB-1 ».
const COMILLAS = /[«“"„][^»”"]*[»”"]/g
function designacion(nombre) {
  return ` ${sinTildes(nombre).toUpperCase().replace(COMILLAS, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()} `
}
const sinPuntos = (d) => d.replace(/\./g, ' ').replace(/\s+/g, ' ')
export const esNombreFT = (n) => /^\s*(?:F\.?\s?T\.?(?:\s|-|«|"|$)|FUERZA\s+DE\s+TAREA|AGRUP|AGR\.?\s)/i.test(sinTildes(n))

export function escalonDeNombre(nombre) {
  const c = sinPuntos(designacion(nombre))
  if (!c.trim()) return ''
  // FF.TT.T.O. antes que el Teatro: su nombre largo también dice «Teatro de Operaciones».
  if (/\bFF ?TT\b|\bFFTT\b|FUERZAS? TERRESTRES?|EJERCITO DE CAMPANA/.test(c)) return 'fftt'
  if (/\bC ?T ?O\b|TEATRO|\bT ?O\b/.test(c)) return 'teatro'
  if (/\bCUERPOS? DE EJERCITO\b|\bC ?E\b|\bCPO\b/.test(c)) return 'cuerpo'
  if (/\bDIVISION\b|\bDIV\b|\bDIV(?:MEC|MOT|INF|CAB|BL|AND|SEL)[A-Z]*\b|\bDI(?:MEC|MOT)\b|\bGRAN UNIDAD\b/.test(c)) return 'division'
  if (/\bBRIGADA\b|\bBRIG\b|\bBDA\b/.test(c)) return 'brigada'
  if (/\bREGIMIENTO\b|\bRGTO\b|\bREG\b|\bR[ICA][A-Z]{0,4} ?- ?\d|\bR[ICA][A-Z]{0,4}\d|\b(?:RCB|RCM|RCMEC|RIMEC|RIMOT|RIAT|RAM|RAA|RAAA)\b|\bR [ICA]\b/.test(c)) return 'regimiento'
  if (/\bBATERIAS?\b|\bBTR\b|\bBAT (?:ART|AA|AAA|CMDO|C Y S|OBUS|MORT|LC)\b/.test(c)) return 'compania'
  if (/\bBATALLON\b|\bBAT\b|\bBTN\b|\bBATING\b|\bB ?ING\b|\bB ?LOG\b|\bBLOG\b|\bB ?COM\b|\bBIM\b|\bB I\b|\bBI\b|\bGAC?\b|\bG A\b/.test(c)) return 'batallon'
  if (/\bCOMPANIAS?\b|\bCOMP\b|\bCIA\b|\bESCUADRON\b|\bEDRON\b|\bESC\b|\bERM\b|\bEQUIPO DE COMBATE\b/.test(c)) return 'compania'
  if (/\bSECCION\b|\bSECC\b/.test(c)) return 'seccion'
  return ''
}

export function armaDeNombre(nombre) {
  const n = sinPuntos(designacion(nombre))
  if (!n.trim()) return ''
  if (/\bFF ?TT\b|FUERZAS? TERRESTRES?|TEATRO|\bC ?T ?O\b|\bCUERPOS? DE EJERCITO\b|\bC ?E\b/.test(n)) return ''
  if (/ANTIAERE|\bRAAA?\b|\bD ?A ?A\b|\bAAA?\b|\bADA\b/.test(n)) return 'antiaerea'
  if (/ANTITANQ|\bRIAT\b|\bRI ?AT\b|\bAT\b|\bRAT\b/.test(n)) return 'antitanque'
  if (/AVIACION|\bAV\b|\bHELIC/.test(n)) return 'aviacion'
  if (/INTELIGENCIA|\bICIA\b|\bINTEL\b/.test(n)) return 'inteligencia'
  if (/LOGISTIC|\bB ?LOG\b|\bLOG\b/.test(n)) return 'logistica'
  if (/COMUNICACION|TRANSMISION|TELECOM|\bB ?COM\b|\bCOM\b/.test(n)) return 'comunicaciones'
  if (/INGENIER|\bBATING\b|\bB ?ING\b|\bING\b/.test(n)) return 'ingenieria'
  if (/SANIDAD|\bSAN\b/.test(n)) return 'sanidad'
  if (/MANTENIMIENTO|\bMTTO\b/.test(n)) return 'mantenimiento'
  if (/TRANSPORTE|\bTRANSP\b/.test(n)) return 'transporte'
  if (/INTENDENCIA|ABASTECIMIENTO|\bABTTO\b/.test(n)) return 'intendencia'
  if (/MATERIAL BELICO/.test(n)) return 'materialbelico'
  if (/POLICIA MILITAR|\bPM\b/.test(n)) return 'policiamilitar'
  if (/MORTERO/.test(n)) return 'morteros'
  if (/LANZACOHETE/.test(n)) return 'lanzacohetes'
  if (/RECONOCIMIENTO|\bERM\b|\bRECON\b/.test(n)) return 'reconocimiento'
  const mec = /\bMEC\b|MECANIZ|\bRIM\b|\bRIMEC\b|\bRCM\b|\bRCMEC\b|\bDIVMEC\b|\bDIMEC\b|\bBIM\b/.test(n)
  if (/\bRCB\b|CABALLERIA BLIND|\bCAB BL/.test(n)) return 'cabmec'
  if (/CABALLERIA|\bCAB\b|\bRC[A-Z]*\b|\bR C\b|\bEDRON\b|\bESCUADRON\b/.test(n)) return mec || /BLIND/.test(n) ? 'cabmec' : 'caballeria'
  if (/BLIND|ACORAZ|TANQUE|\bTQ\b/.test(n)) return 'blindada'
  if (/ARTILLERIA|\bART\b|\bRAM?\b|\bR A\b|\bGAC?\b|\bG A\b|\bOBUS/.test(n)) return 'artilleria'
  if (/MOTORIZ|\bMOT\b|\bRIMOT\b|\bDIMOT\b/.test(n)) return 'motorizada'
  if (/ANDIN|MONTANA/.test(n)) return 'andina'
  if (/SELVA/.test(n)) return 'selva'
  if (/PARACAID|AEROTRANSP/.test(n)) return 'aerotransportada'
  if (mec) return 'mecanizada'
  if (/INFANTERIA|\bINF\b|\bRI\b|\bR I\b|\bB I\b|\bBI\b/.test(n)) return 'infanteria'
  return ''
}
export function numeroDeNombre(nombre) {
  const d = designacion(nombre).trim()
  const m = d.match(/[-–]\s*(\d{1,3}|[IVX]{1,5})\b/) || d.match(/(?:^|\s)(\d{1,3})(?:\s|$)/) || d.match(/^([IVX]{1,5})\s/) || d.match(/\s([IVX]{1,5})$/)
  return m ? m[1] : ''
}
// ¿Es la misma unidad? «RCB-1», «RCB-1 «CALAMA»», «R.C.B.-1»; «BATING-II» y
// «BATING. MEC.- II»; o el mismo nombre entre comillas.
function partes(nombre) {
  let d = sinTildes(nombre).toUpperCase()
  const nom = ((d.match(/[«“"„]([^»”"]+)[»”"]/) || [])[1] || '').replace(/[^A-Z0-9]/g, '')
  d = d.replace(COMILLAS, ' ').replace(/\((?:\s*-\s*|FICT\.?)\)/g, ' ')
  const m = d.match(/[-–]\s*(\d{1,3}|[IVX]{1,5})\b/) || d.match(/\s(\d{1,3})\b/) || d.match(/^\s*([IVX]{1,5}|\d{1,3})\s/)
  const num = m ? m[1] : ''
  const letras = (m ? (m.index === 0 ? d.slice(m[0].length) : d.slice(0, m.index)) : d).replace(/[^A-Z]/g, '')
  return { letras, num, nom }
}
export function mismaUnidad(a, b) {
  if (!limpio(a) || !limpio(b)) return false
  if (clave(a) === clave(b)) return true
  const x = partes(a)
  const y = partes(b)
  if (x.nom && y.nom) return x.nom === y.nom && (!x.num || !y.num || x.num === y.num)
  if (!x.num || x.num !== y.num || !x.letras || !y.letras) return false
  if (x.letras === y.letras) return true
  const [c, l] = x.letras.length < y.letras.length ? [x.letras, y.letras] : [y.letras, x.letras]
  return c.length >= 4 && l.startsWith(c)
}
export function rotuloCorto(nombre) {
  // Sólo para denominaciones largas: «Regimiento de Caballería Mecanizada 2 «TARAPACÁ»»
  // no entra junto al gráfico; «RCM-2 «TARAPACÁ»» sí.
  const n = limpio(nombre)
  if (n.length <= 28) return ''
  const m = n.match(/[«“]([^»”]+)[»”]/)
  if (!m) return ''
  const pref = (n.match(/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ./]*(?:\s?[-–]\s?(?:\d+|[IVX]+))?(?=[\s«“])/) || [''])[0]
  return limpio(`${pref} «${m[1]}»`)
}
// «RCB-1 “CALAMA”» → «RCB-1 «CALAMA»»; «BAT. LOG. - I» → «BAT. LOG.-I».
function prolijo(nombre) {
  return limpio(nombre)
    .replace(/[“"„]([^”"]+)[”"]/g, '«$1»')
    .replace(/(\S)«/g, '$1 «')
    .replace(/\s*[-–]\s*(?=\d|[IVX]+\b)/g, '-')
    .replace(/\s+([»)])/g, '$1')
}
// El escalón de una unidad de la hoja: por su nombre si lo dice sin dudas (una FT no
// lo dice), si no por el texto del cuadro («CE», «CTO») o por su magnitud.
export function escalonDeUnidad(u) {
  if (!u) return ''
  const porNombre = esNombreFT(u.nombre) ? '' : escalonDeNombre(u.nombre)
  if (porNombre) return porNombre
  const t = limpio(u.texto)
  if (/^(CTO|C\.?T\.?O\.?|T\.?\s?O\.?|FF\.?\s?TT\.?(\s?T\.?\s?O\.?)?|C\.?\s?E\.?|DIV\.?)$/i.test(t)) return escalonDeNombre(t)
  return escalonDeMagnitud(u.magnitud)
}
const nivelUnidad = (u) => nivelEscalon(escalonDeUnidad(u) === 'ejercito' ? 'fftt' : escalonDeUnidad(u))
// El escalón que se ve sin dudas en el nombre (o en el texto del cuadro): manda sobre
// la magnitud cargada. Así un «Cuerpo de Ejército» nunca sale con XX.
function escalonSeguro(u) {
  if (esNombreFT(u.nombre)) return ''
  const e = escalonDeNombre(u.nombre)
  if (e) return e
  const t = limpio(u.texto)
  return /^(CTO|C\.?T\.?O\.?|T\.?\s?O\.?|FF\.?\s?TT\.?(\s?T\.?\s?O\.?)?|C\.?\s?E\.?)$/i.test(t) ? escalonDeNombre(t) : ''
}
const TEXTO_MANDO = { teatro: 'CTO', fftt: 'FF.TT.T.O.', ejercito: 'EJTO.', cuerpo: 'CE' }
function corregirEscalon(u) {
  const e = escalonSeguro(u)
  if (!e) return
  u.magnitud = ESCALON[e].mag
  if (u.grupo === 'superior' && TEXTO_MANDO[e]) {
    u.texto = TEXTO_MANDO[e]
    u.arma = ''
  }
}
// Un regimiento de infantería antitanque (RIAT) es maniobra; una compañía AT, apoyo.
function grupoPorArma(arma, nombre = '', escalon = '') {
  if (arma === 'antitanque' && (/\bRI ?AT\b|\bRIAT\b|INFANTER/.test(sinPuntos(designacion(nombre))) || nivelEscalon(escalon) >= nivelEscalon('regimiento'))) return 'maniobra'
  return ARMAS[arma]?.grupo || 'maniobra'
}

// ─── Lectura de lo guardado (hoja v1, v2 y el formato narrativo) ─────────────────
const SIMBOLO_V1 = { infanteria: 'infanteria', caballeria: 'caballeria', artilleria: 'artilleria', ingenieria: 'ingenieria', SPAC: 'logistica' }
const GRUPO_ANTERIOR = { superior2: 'superior', superior1: 'superior', cadena: 'superior', mando: 'superior' }
const LIMITES = { nombre: 90, rotulo: 30, texto: 12, numero: 8, magnitud: 6, mando: 30 }

function normFase(f, i) {
  return { id: limpio(f?.id) || `F${i + 1}`, nombre: limpio(f?.nombre).slice(0, 120) }
}
function normTextoLargo(s) {
  return String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, 1200)
}
function normUnidad(u, i) {
  const r = {
    id: limpio(u.id) || `u-${i + 1}`,
    grupo: GRUPOS.includes(u.grupo) ? u.grupo : GRUPO_ANTERIOR[u.grupo] || 'maniobra',
    nombre: limpio(u.nombre).slice(0, LIMITES.nombre),
    rotulo: limpio(u.rotulo).slice(0, LIMITES.rotulo),
    magnitud: limpio(u.magnitud).toUpperCase().replace(/\s+/g, '').slice(0, LIMITES.magnitud),
    arma: ARMAS[u.arma] ? u.arma : SIMBOLO_V1[u.simbolo] || '',
    texto: limpio(u.texto ?? (u.simbolo === 'CE' ? 'CE' : '')).slice(0, LIMITES.texto),
    numero: limpio(u.numero).slice(0, LIMITES.numero),
    rol: limpio(u.rol).toUpperCase().replace(/\s+/g, '').slice(0, 6),
    mando: limpio(u.mando).toUpperCase().slice(0, LIMITES.mando),
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
// La cadena de mando va de arriba hacia abajo (CTO primero, la unidad propia última).
export function ordenarCadena(lista) {
  return lista
    .map((u, i) => ({ u, i, n: nivelUnidad(u) }))
    .sort((a, b) => (a.n >= 0 && b.n >= 0 && a.n !== b.n ? b.n - a.n : a.u.propia !== b.u.propia ? (a.u.propia ? 1 : -1) : a.i - b.i))
    .map((x) => x.u)
}

export function normalizarConceptos(valor) {
  const v = esObj(valor) ? valor : {}
  let fases = (Array.isArray(v.fases) ? v.fases : []).filter(esObj).map(normFase)
  const vistos = new Set()
  fases = fases.filter((f) => (vistos.has(f.id) ? false : vistos.add(f.id)))
  let unidades = []
  const ids = new Set()
  // En la hoja v2 la caja de arriba era «superior2» y la de abajo «superior1».
  const crudas = (Array.isArray(v.unidades) ? v.unidades : []).filter(esObj)
  const ordenV2 = (u) => (u.grupo === 'superior2' ? 0 : u.grupo === 'superior1' ? 1 : 2)
  for (const [i, u0] of [...crudas].sort((a, b) => ordenV2(a) - ordenV2(b)).entries()) {
    const u = normUnidad(u0, i)
    while (ids.has(u.id)) u.id = `${u.id}-b`
    ids.add(u.id)
    // Hoja v1: las fases eran propias de cada unidad, con nombre.
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
    corregirEscalon(u)
    unidades.push(u)
  }
  // Una sola unidad propia.
  let hayPropia = false
  for (const u of unidades) {
    if (u.propia && hayPropia) u.propia = false
    if (u.propia) hayPropia = true
  }
  // La cadena primero (de arriba hacia abajo); las demás, en el orden en que estaban.
  unidades = [...ordenarCadena(unidades.filter((u) => u.grupo === 'superior')), ...unidades.filter((u) => u.grupo !== 'superior')]
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
  return { ...v, esquema: ESQUEMA, enfoque: enfoqueValido(v.enfoque), fases, unidades, relaciones, orientaciones }
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
  return limpio(u?.rotulo) || limpio(u?.nombre) || limpio(u?.texto) || (u?.propia ? 'Unidad propia (sin denominación)' : 'Unidad sin nombre')
}
// La cadena de mando y la unidad debajo de la cual van las filas.
export function cadenaDe(valor) {
  const v = normalizarConceptos(valor)
  return v.unidades.filter((u) => u.grupo === 'superior')
}
export function unidadPropiaDe(valor) {
  return normalizarConceptos(valor).unidades.find((u) => u.propia) || null
}

// Lo que falta o está mal, para avisarle al oficial (no bloquea el dibujo ni el Word).
export function revisarConceptos(valor) {
  const v = normalizarConceptos(valor)
  const avisos = []
  const faltan = { tarea: 0, proposito: 0, nombre: 0 }
  for (const u of v.unidades) {
    if (!limpio(u.nombre) && !limpio(u.texto) && !u.propia) faltan.nombre++
    const t = tipoUnidad(u)
    if (t === 'superior' || !u.fases.some((f) => TEXTOS.some((k) => limpio(f[k])))) {
      if (t !== 'ingenieria' && !limpio(u.tarea)) faltan.tarea++
      if (t !== 'ingenieria' && !limpio(u.proposito)) faltan.proposito++
    }
  }
  const cadena = v.unidades.filter((u) => u.grupo === 'superior')
  const propia = v.unidades.find((u) => u.propia)
  const man = v.unidades.filter((u) => u.grupo === 'maniobra')
  if (!propia) avisos.push('Falta la UNIDAD PROPIA (tu unidad): marcala o rearmá la hoja.')
  else if (!limpio(propia.nombre)) avisos.push('Tu unidad no tiene denominación: escribila (por ejemplo «DIVMEC-1») en «✏️ Corregir a mano» o en la Orden del escalón superior → «Unidad».')
  if (!cadena.length) avisos.push('Falta la cadena de mando (CTO → FF.TT.T.O. → CE → …).')
  const niveles = cadena.map(nivelUnidad).filter((n) => n >= 0)
  if (new Set(niveles).size < niveles.length) avisos.push('En la cadena de mando hay dos cajas del mismo escalón: tiene que haber una por escalón.')
  if (v.enfoque !== 'adyacentes' && propia && propia.grupo !== 'superior') avisos.push('Tu unidad está en la fila: con esta opción va ARRIBA, como última caja de la cadena de mando, y la fila son sus subordinadas.')
  if (v.enfoque === 'adyacentes' && propia && propia.grupo !== 'maniobra') avisos.push('Con «Mi unidad entre las adyacentes» tu unidad va en la fila, con las del mismo escalón.')
  const nPropia = propia ? nivelUnidad(propia) : -1
  if (nPropia >= 0) {
    for (const u of v.unidades.filter((x) => x.grupo !== 'superior' && !x.propia)) {
      const n = nivelUnidad(u)
      if (n < 0) continue
      if (v.enfoque !== 'adyacentes' && n >= nPropia) avisos.push(`«${nombreUnidad(u)}» (${u.magnitud}) está en las filas, pero no es subordinada de tu unidad: es del mismo escalón o más alta. Una división del mismo CE es ADYACENTE; un escalón superior va en la cadena de mando.`)
      if (v.enfoque === 'adyacentes' && u.grupo === 'maniobra' && n > nPropia) avisos.push(`«${nombreUnidad(u)}» (${u.magnitud}) es más alta que tu unidad: va en la cadena de mando, no en la fila.`)
      if (v.enfoque === 'adyacentes' && u.grupo === 'maniobra' && n < nPropia) avisos.push(`«${nombreUnidad(u)}» (${u.magnitud}) depende de tu unidad: con «Mi unidad entre las adyacentes» la fila es de las del MISMO escalón. Para tus unidades elegí «Unidades puras» o «FT / agrupaciones tácticas».`)
    }
    for (const u of cadena) if (!u.propia && nivelUnidad(u) >= 0 && nivelUnidad(u) <= nPropia) avisos.push(`«${nombreUnidad(u)}» está en la cadena de mando pero no está por encima de tu unidad.`)
  }
  if (!man.length) avisos.push('Todavía no hay unidades de maniobra.')
  if (man.length && v.enfoque !== 'adyacentes' && !man.some((u) => u.rol === 'OD')) avisos.push('Ninguna unidad de maniobra lleva la OD (operación decisiva).')
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
const claseOrg = (o) => (o?.ft ? 'ft' : o?.clase === 'pura' ? 'pura' : 'agrupacion')
function nombreOrg(o) {
  const rol = ROL_DE_OPERACION[o?.operacion]
  const n = limpio(o?.nombre) || (rol ? `Agrupación ${rol}` : 'Agrupación')
  return o?.ft ? (esNombreFT(n) ? n : `FT «${n}»`) : n
}
const fichasPropias = (ctx) => (ctx.unidades || []).filter((u) => u && (u.tipo || 'unidad') === 'unidad' && String(u.bando || '').toLowerCase() !== 'enemigo')
const nombreFicha = (f) => limpio(f.designacion) || `${ARMAS[f.arma]?.nom || 'Unidad'} ${ESCALON[f.escalon]?.nom || ''}`.trim()

// La UNIDAD PROPIA: la de la Orden del escalón superior («Unidad»); si no está, la
// que nombra la misión («La DIVMEC-1 defiende…») o el OBJETO de una orden aportada
// («OBJETO: La DIVMEC-1 en la ejecución de…»).
export function unidadPropiaDelEjercicio(ctx = {}) {
  const os = ctx.ordenSup || {}
  const directa = limpio(os.unidad) || limpio(ctx.unidad)
  if (directa) return { nombre: directa, fuente: 'Orden del escalón superior («Unidad»)' }
  const mision = limpio(ctx.g3?.mision?.['ENUNCIADO COMPLETO DE LA MISIÓN']) || limpio(os.mision)
  const deMision = designacionAlInicio(mision)
  if (deMision && escalonDeNombre(deMision)) return { nombre: deMision, fuente: 'la misión' }
  for (const d of ctx.documentos || []) {
    const t = String(d?.texto || '')
    const m = t.match(/OBJETO\s*:?\s*(?:(?:La|El|Los|Las)\s+)?([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9.\-–° ]{1,30}?)\s+(?:en|para|ejecuta|defiende|ataca|realiza)\b/)
    if (m && escalonDeNombre(m[1])) return { nombre: limpio(m[1]), fuente: `el OBJETO de «${limpio(d.nombre) || 'la orden aportada'}»` }
  }
  return { nombre: '', fuente: '' }
}

// ─── La organización de la tarea de la orden ─────────────────────────────────────
// Es el cuadro de la orden: cada columna es UNA unidad que depende directamente de la
// unidad propia («RCB-1 “CALAMA”», «BAT. LOG. - I “HEROICAS RABONAS”»); lo de abajo
// (escuadrones, compañías, baterías, secciones: «Edrón. Tq. “A”», «Bat. C y S.») son
// sus subunidades y NO se dibujan. «BAJO CONTROL» trae las que se le dan a la unidad
// sin ser orgánicas («Comp. Av. Ejto. “Cnl. Lopez”»).
// Leído como texto, el cuadro queda renglón por renglón (celda por celda): la
// designación con número o con un nombre propio entre comillas marca a la unidad.
export function unidadesDeOrganizacion(texto, { propia = '', escPropia = 'division' } = {}) {
  const nP = nivelEscalon(escPropia) >= 0 ? nivelEscalon(escPropia) : nivelEscalon('division')
  const lineas = String(texto || '')
    .split(/\r?\n|\t| {3,}/)
    .map((l) => limpio(l).replace(/^(?:\d{1,2}|[a-z])[.)]-?\s+/, ''))
    .filter(Boolean)
  const hayBajoControl = lineas.some((l) => /^BAJO\s+CONTROL\b/i.test(sinTildes(l)))
  const unidades = []
  const mismoNivel = []
  for (const l of lineas) {
    const s = sinTildes(l).toUpperCase()
    if (/^(BAJO\s+CONTROL|ORGANIZACION DE LA TAREA)\b/.test(s)) continue
    const ult = unidades[unidades.length - 1]
    // Un nombre entre comillas solo en su renglón: es el de la unidad de arriba.
    if (/^[«“"][^»”"]{3,}[»”"]\.?$/.test(l)) {
      if (ult && !/[«“"]/.test(ult.nombre)) ult.nombre = prolijo(`${ult.nombre} ${l}`)
      continue
    }
    const conNumero = /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ.\s]{0,34}?[-–]\s*(?:\d{1,3}|[IVX]{1,5})\b/.test(l)
    const nombrePropio = (l.match(/[«“"]([^»”"]+)[»”"]/) || [])[1] || ''
    const conNombre = nombrePropio.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '').length >= 3
    if (!conNumero && !conNombre) continue // subunidad: «Edrón. Tq. “A”», «Comp. C y S.»
    const nombre = prolijo(l)
    const escalon = escalonDeNombre(nombre)
    if (escalon && nivelEscalon(escalon === 'ejercito' ? 'fftt' : escalon) >= nP) {
      if (nivelEscalon(escalon) === nP && !(propia && mismaUnidad(nombre, propia))) mismoNivel.push(nombre)
      continue
    }
    if (!escalon && !esNombreFT(nombre)) continue
    if (unidades.some((u) => mismaUnidad(u.nombre, nombre))) continue
    unidades.push({ nombre, escalon, arma: armaDeNombre(nombre), mando: hayBajoControl && !conNumero ? 'BAJO CONTROL' : '' })
  }
  // Varias unidades del mismo escalón que la propia (varias divisiones): es la
  // organización del escalón superior; sus regimientos no se pueden repartir por
  // columna con seguridad → no se adivina (lo hace la IA con el expediente).
  if (mismoNivel.length) return { unidades: [], adyacentes: [...new Set(mismoNivel)], ambigua: true }
  return { unidades, adyacentes: [], ambigua: false }
}
// Organización de la tarea: la de la Orden del escalón superior o, si no está, la
// sección «ORGANIZACIÓN DE LA TAREA» de un documento aportado que nombre a la unidad.
function organizacionDeLaOrden(ctx, escPropia, nomPropia) {
  const os = ctx.ordenSup || {}
  const cands = []
  if (limpio(os.organizacionTarea)) cands.push({ texto: os.organizacionTarea, fuente: 'Organización de la tarea (Orden del escalón superior)' })
  for (const d of ctx.documentos || []) {
    const t = String(d?.texto || '')
    const i = t.search(/ORGANIZACI[OÓ]N\s+DE\s+LA\s+TAREA/i)
    if (i < 0) continue
    const resto = t.slice(i).split(/\r?\n/)
    let fin = resto.findIndex((l, k) => k > 0 && /^\s*(?:\d{1,2}\s*[.)-]+\s*|[IVX]{1,4}\s*[.)-]+\s*)?(SITUACI[OÓ]N|MISI[OÓ]N|EJECUCI[OÓ]N)\b/i.test(l))
    if (fin < 0) fin = Math.min(resto.length, 160)
    const trozo = resto.slice(0, fin).join('\n')
    const nombra = !nomPropia || sinTildes(t.slice(0, i + 400)).toUpperCase().includes(sinTildes(nomPropia).toUpperCase())
    cands.push({ texto: trozo, fuente: `Organización de la tarea de «${limpio(d.nombre) || 'la orden aportada'}»`, peso: nombra ? 0 : 1 })
  }
  cands.sort((a, b) => (a.peso || 0) - (b.peso || 0))
  let ambigua = null
  for (const c of cands) {
    const r = unidadesDeOrganizacion(c.texto, { propia: nomPropia, escPropia })
    if (r.unidades.length) return { ...r, fuente: c.fuente }
    if (r.ambigua && !ambigua) ambigua = { ...r, fuente: c.fuente }
  }
  return ambigua || { unidades: [], adyacentes: [], ambigua: false, fuente: '' }
}

// La fila de maniobra: de oeste a este si todas están en el calco; si no, la OD al
// centro entre las OC (como la hoja de trabajo del PMTD) y lo que no tiene rol al final.
function ordenarManiobra(lista) {
  if (lista.length > 1 && lista.every((u) => Number.isFinite(u.lng))) return [...lista].sort((a, b) => a.lng - b.lng)
  const conRol = lista.filter((u) => u.rol)
  if (!conRol.length) return lista
  const peso = (u) => ({ OC1: 1, OC2: 2, OC3: 3, OC4: 4, RES: 6 })[u.rol] ?? 5
  const oc = conRol.filter((u) => u.rol !== 'OD').sort((a, b) => peso(a) - peso(b))
  const od = conRol.filter((u) => u.rol === 'OD')
  const medio = Math.floor(oc.length / 2)
  return [...oc.slice(0, medio), ...od, ...oc.slice(medio), ...lista.filter((u) => !u.rol)]
}

// Opción «puras»: las unidades que dependen directamente de la unidad propia, como
// están en la organización de la tarea de la orden (si no está, las fichas del calco).
function subordinadasPuras(ctx, escPropia, nomPropia) {
  const nP = nivelEscalon(escPropia)
  const fuentes = []
  const avisos = []
  const lista = []
  const org = organizacionDeLaOrden(ctx, escPropia, nomPropia)
  for (const u of org.unidades) {
    lista.push({ origen: `orden:${clave(u.nombre)}`, grupo: grupoPorArma(u.arma, u.nombre, u.escalon), nombre: u.nombre, rotulo: rotuloCorto(u.nombre), magnitud: magnitudDeEscalon(u.escalon), arma: u.arma, mando: u.mando, rol: '', tareaId: '', proposito: '' })
  }
  if (org.unidades.length) fuentes.push(`${org.fuente} (${org.unidades.length})`)
  if (org.ambigua) avisos.push(`La organización de la tarea trae varias unidades del escalón de la tuya (${org.adyacentes.join(', ')}): es la del escalón superior. Las unidades de CADA una no se reparten solas; la IA toma sólo las de la tuya.`)
  const conOrden = lista.length > 0
  let nF = 0
  for (const f of fichasPropias(ctx)) {
    if (f.esAgrupacion || f.agId || f.agrupacion) continue
    const nombre = nombreFicha(f)
    if (nomPropia && mismaUnidad(nombre, nomPropia)) continue
    const esc = ESCALON[f.escalon] ? f.escalon : escalonDeNombre(nombre)
    if (esc && nP >= 0 && nivelEscalon(esc) >= nP) continue
    const arma = ARMAS[f.arma] ? f.arma : armaDeNombre(nombre)
    const ya = lista.find((x) => mismaUnidad(x.nombre, nombre))
    if (ya) {
      if (!ya.arma && arma) ya.arma = arma
      if (!ya.magnitud && esc) ya.magnitud = magnitudDeEscalon(esc)
      ya.lng = Number(f.lng)
      continue
    }
    // Con la organización de la orden, ésa manda: una ficha que no está ahí puede ser
    // una subunidad (una compañía de un regimiento) y no depende directamente.
    if (conOrden) continue
    lista.push({ origen: `ficha:${f.id}`, grupo: grupoPorArma(arma, nombre, esc), nombre, rotulo: rotuloCorto(nombre), magnitud: magnitudDeEscalon(esc), arma, rol: '', tareaId: '', proposito: '', lng: Number(f.lng) })
    nF++
  }
  if (nF) fuentes.push(`Fichas del calco (${nF})`)
  // Lo que el oficial ya le puso a una unidad pura en 🧩 Organización de la tarea.
  for (const o of (ctx.orgTarea || []).filter(esObj)) {
    if (claseOrg(o) !== 'pura') continue
    const u = lista.find((x) => mismaUnidad(x.nombre, o.nombre))
    if (!u) continue
    const rol = ROL_DE_OPERACION[o.operacion] || ''
    if (rol === 'SOST') u.grupo = 'spac'
    else if (rol) u.rol = rol
    u.tareaId = o.tarea || ''
    u.proposito = limpiarProposito(o.proposito)
  }
  if (!lista.length) avisos.push('No se encontraron las unidades de tu unidad: cargá la organización de la tarea en la Orden del escalón superior (o como documento aportado), o poné las fichas en el calco. La IA también las saca del expediente.')
  return { lista, fuentes, avisos }
}

// Opción «ft»: las FT / agrupaciones de 🧩 Organización de la tarea y lo que quedó con
// su unidad orgánica («(-)» si dio parte de sus elementos; si los dio todos, no va).
// Las unidades orgánicas son las de la organización de la tarea de la orden (si está)
// o las fichas del calco.
function subordinadasFT(ctx, escPropia, nomPropia) {
  const nP = nivelEscalon(escPropia)
  const fichas = fichasPropias(ctx)
  const orgs = (ctx.orgTarea || []).filter(esObj)
  const fuentes = []
  const avisos = []
  const lista = []
  for (const o of orgs) {
    const nombre = nombreOrg(o)
    const arma = (claseOrg(o) === 'pura' && ARMAS[o.arma] ? o.arma : '') || armaDePiezas(o.piezas) || armaDeNombre(nombre) || 'infanteria'
    const rol = ROL_DE_OPERACION[o.operacion] || ''
    const ficha = fichas.find((f) => f.agId === o.id)
    // Una FT o agrupación con OD / OC / reserva es maniobra; la de sostenimiento, SPAC;
    // una unidad pura, lo que diga su arma.
    let grupo = grupoPorArma(arma, nombre, o.escalon)
    if (rol === 'SOST') grupo = 'spac'
    else if (claseOrg(o) !== 'pura' && (rol || o.ft)) grupo = 'maniobra'
    lista.push({ origen: `org:${o.id}`, grupo, nombre, rotulo: rotuloCorto(nombre), magnitud: magnitudDeEscalon(o.escalon), arma, rol: rol === 'SOST' ? '' : rol, tareaId: o.tarea || '', proposito: limpiarProposito(o.proposito), lng: Number(ficha?.lng) })
  }
  if (lista.length) fuentes.push(`Organización de la tarea (${lista.length} FT / agrupaciones)`)
  else avisos.push('No armaste FT ni agrupaciones en 🧩 Organización de la tarea: la fila sale con las unidades orgánicas. Armalas allá y volvé a «♻️ Rearmar todo».')
  const integradas = {}
  for (const o of orgs) for (const p of o.piezas || []) if (p?.de) integradas[p.de] = (integradas[p.de] || 0) + 1
  const sueltas = fichas.filter((f) => !(f.esAgrupacion || f.agId || f.agrupacion))
  const org = organizacionDeLaOrden(ctx, escPropia, nomPropia)
  const organicas = []
  if (org.unidades.length) {
    for (const u of org.unidades) {
      const f = sueltas.find((x) => mismaUnidad(nombreFicha(x), u.nombre))
      organicas.push({ nombre: u.nombre, escalon: u.escalon, arma: f && ARMAS[f.arma] ? f.arma : u.arma, mando: u.mando, ficha: f })
    }
  } else {
    for (const f of sueltas) {
      const nombre = nombreFicha(f)
      if (nomPropia && mismaUnidad(nombre, nomPropia)) continue
      const esc = ESCALON[f.escalon] ? f.escalon : escalonDeNombre(nombre)
      if (esc && nP >= 0 && nivelEscalon(esc) >= nP) continue
      organicas.push({ nombre, escalon: esc, arma: ARMAS[f.arma] ? f.arma : armaDeNombre(nombre), mando: '', ficha: f })
    }
  }
  let n = 0
  for (const c of organicas) {
    const total = Number(c.ficha?.piezas) || 0
    const dadas = c.ficha ? integradas[c.ficha.id] || 0 : 0
    if (total && dadas >= total) continue
    if (lista.some((x) => mismaUnidad(x.nombre, c.nombre))) continue
    lista.push({ origen: c.ficha ? `ficha:${c.ficha.id}` : `orden:${clave(c.nombre)}`, grupo: grupoPorArma(c.arma, c.nombre, c.escalon), nombre: dadas ? `${c.nombre} (-)` : c.nombre, rotulo: rotuloCorto(c.nombre), magnitud: magnitudDeEscalon(c.escalon), arma: c.arma, mando: c.mando, rol: '', tareaId: '', proposito: '', lng: Number(c.ficha?.lng) })
    n++
  }
  if (n) fuentes.push(`${org.unidades.length ? org.fuente.replace(/^Organización de la tarea/, 'Unidades de la organización de la tarea') : 'Fichas del calco'} que siguen con su unidad (${n})`)
  return { lista, fuentes, avisos }
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
// «Fuerzas amigas» de la orden superior: cada frase dice qué hace un comando («Las
// FF.TT.T.O. defienden…», «El I CE defiende…», «La DIV-2 defiende al este…»).
function frasesDeComandos(ctx) {
  const os = ctx.ordenSup || {}
  const out = []
  for (const f of oraciones(os.propias)) {
    const sujeto = designacionAlInicio(f)
    const e = escalonDeNombre(sujeto)
    if (!e) continue
    const { tarea, proposito } = separarTP(f)
    out.push({ sujeto, escalon: e === 'ejercito' ? 'fftt' : e, tarea: sinSujeto(tarea, sujeto), proposito: proposito.replace(/\.$/, '') })
  }
  return out
}
// La cadena de mando por encima de la unidad propia: hasta tres escalones (para una
// División: CTO, FF.TT.T.O. y CE). El inmediato superior sale de la Orden («Escalón
// superior»); si su escalón no se lee en el nombre, es el de arriba de la unidad.
function cadenaDeMando(ctx, escPropia, { max = 3 } = {}) {
  const os = ctx.ordenSup || {}
  const nP = nivelEscalon(escPropia)
  let niveles = ESCALERA.filter((e) => nivelEscalon(e) > nP).slice(-max)
  const nomSup = limpio(os.escalonSuperior)
  let escSup = escalonDeNombre(nomSup)
  if (escSup === 'ejercito') escSup = 'fftt'
  if (nomSup && (!escSup || nivelEscalon(escSup) <= nP)) escSup = niveles[niveles.length - 1] || ''
  if (escSup) {
    if (!niveles.includes(escSup)) niveles = [...niveles.filter((e) => nivelEscalon(e) > nivelEscalon(escSup)), escSup].slice(-max)
    // Entre el inmediato superior y la unidad propia no hay nadie.
    niveles = niveles.filter((e) => nivelEscalon(e) >= nivelEscalon(escSup))
  }
  const frases = frasesDeComandos(ctx)
  return niveles.map((e) => {
    const inmediato = e === (escSup || niveles[niveles.length - 1])
    const nombre = inmediato && nomSup ? nomSup : ESCALON[e].nom
    const f = frases.find((x) => x.escalon === e)
    let { tarea, proposito } = f || { tarea: '', proposito: '' }
    if (inmediato && !tarea && !proposito) {
      // Sin una frase que lo nombre: la primera de «fuerzas amigas» y la intención.
      const primera = oraciones(os.propias)[0] || ''
      if (primera && !escalonDeNombre(designacionAlInicio(primera))) ({ tarea, proposito } = separarTP(primera))
      tarea = sinSujeto(tarea, nomSup)
    }
    if (inmediato && !proposito) {
      const i = limpio(os.intencion)
      const m = i.match(/prop[oó]sito[^:]*[:\s]+(?:es\s+)?(.+?)(?:\.\s|$)/i)
      proposito = may1(m ? m[1] : primeras(i, 1))
    }
    const arma = TEXTO_MANDO[e] ? '' : armaDeNombre(nombre)
    return {
      origen: `cadena:${e}`,
      escalon: e,
      nombre,
      magnitud: ESCALON[e].mag,
      arma,
      texto: TEXTO_MANDO[e] || (arma ? '' : ESCALON[e].abrev),
      numero: inmediato && nomSup ? numeroDeNombre(nomSup) : '',
      tarea,
      proposito: limpio(proposito).replace(/\.$/, ''),
      deOrden: !!(f || (inmediato && (nomSup || tarea || proposito))),
    }
  })
}
// Opción «adyacentes»: las del mismo escalón que nombra la orden superior.
function adyacentesDe(ctx, escPropia, nomPropia) {
  const out = []
  for (const f of frasesDeComandos(ctx)) {
    if (f.escalon !== escPropia || (nomPropia && mismaUnidad(f.sujeto, nomPropia)) || out.some((x) => mismaUnidad(x.nombre, f.sujeto))) continue
    const arma = armaDeNombre(f.sujeto)
    out.push({ origen: `adyacente:${clave(f.sujeto)}`, nombre: prolijo(f.sujeto), magnitud: magnitudDeEscalon(escPropia), arma, texto: arma ? '' : ESCALON[escPropia]?.abrev || '', numero: numeroDeNombre(f.sujeto), tarea: f.tarea, proposito: f.proposito })
  }
  return out
}

function construir(ctx, enfoque) {
  const os = ctx.ordenSup || {}
  const fuentes = []
  const avisos = []
  const prop = unidadPropiaDelEjercicio(ctx)
  const nomPropia = prop.nombre
  // Sin denominación, la unidad propia es la División (el ejercicio de la ECEME).
  const escPropia = (() => {
    const e = escalonDeNombre(nomPropia)
    return e === 'ejercito' ? 'fftt' : e || 'division'
  })()
  if (prop.fuente) fuentes.push(`Unidad propia: ${prop.fuente}`)
  else avisos.push('No encontré la denominación de tu unidad: escribila en la Orden del escalón superior → «Unidad» (o en la hoja). Mientras tanto va como División.')
  const defensiva = String(ctx.ops?.areaOps?.tipo || '').toLowerCase().startsWith('defens')
  const mis = tpDeMision(ctx, nomPropia)
  if (mis.fuente) fuentes.push(mis.fuente)
  const armaP = armaDeNombre(nomPropia)
  const propia = {
    origen: 'orden:propia', propia: true, nombre: nomPropia, magnitud: magnitudDeEscalon(escPropia), arma: armaP,
    texto: armaP ? '' : TEXTO_MANDO[escPropia] || ESCALON[escPropia]?.abrev || '', numero: numeroDeNombre(nomPropia), tarea: mis.tarea, proposito: mis.proposito,
  }
  const cadena = cadenaDeMando(ctx, escPropia)
  if (cadena.some((c) => c.deOrden) || limpio(os.escalonSuperior)) fuentes.push('Orden del escalón superior')
  const fases = (ctx.fasesCOA?.propio || []).map((f, i) => ({ id: `F${i + 1}`, nombre: limpio(f?.nombre) || primeras(f?.descripcion, 1).slice(0, 80) }))
  if (fases.length) fuentes.push(`Fases del curso de acción propio (${fases.length})`)

  const unidades = []
  const add = (grupo, u) => {
    const r = normUnidad({ ...u, id: nuevoId('u'), grupo }, 0)
    r.origen = u.origen
    unidades.push(r)
    return r
  }
  for (const c of cadena) add('superior', c)
  if (enfoque === 'adyacentes') {
    const ady = adyacentesDe(ctx, escPropia, nomPropia)
    const m = Math.floor(ady.length / 2)
    for (const u of [...ady.slice(0, m), propia, ...ady.slice(m)]) add('maniobra', u)
    if (ady.length) fuentes.push(`Unidades adyacentes de la orden superior (${ady.length})`)
  } else {
    add('superior', propia)
    const subs = enfoque === 'ft' ? subordinadasFT(ctx, escPropia, nomPropia) : subordinadasPuras(ctx, escPropia, nomPropia)
    fuentes.push(...subs.fuentes)
    avisos.push(...subs.avisos)
    const conT = (u) => ({ ...u, tarea: tareaEnTercera(u.tareaId, { defensiva }) })
    for (const u of ordenarManiobra(subs.lista.filter((u) => u.grupo === 'maniobra'))) add('maniobra', conT(u))
    for (const u of subs.lista.filter((u) => u.grupo === 'apoyo')) add('apoyo', conT(u))
    for (const u of subs.lista.filter((u) => u.grupo === 'spac')) add('spac', conT(u))
  }
  // Relaciones por defecto (se corrigen a mano o con la IA).
  const relaciones = []
  const rel = (a, b, tipo = 'directa') => a && b && a !== b && !relaciones.some((r) => r.desde === a.id && r.hasta === b.id) && relaciones.push({ desde: a.id, hasta: b.id, tipo })
  const cad = unidades.filter((u) => u.grupo === 'superior')
  // Cada escalón con su inmediato superior.
  for (let i = cad.length - 1; i > 0; i--) rel(cad[i], cad[i - 1])
  const base = cad[cad.length - 1]
  const man = unidades.filter((u) => u.grupo === 'maniobra')
  if (enfoque === 'adyacentes') {
    for (const u of man) rel(u, base)
  } else {
    const od = man.find((u) => u.rol === 'OD')
    for (const u of man) {
      if (u === od) rel(u, base)
      else if (/^OC/.test(u.rol)) rel(u, od || base)
      else if (u.rol === 'RES') rel(u, od || base, 'indirecta')
      else rel(u, base)
    }
    for (const u of unidades.filter((x) => x.grupo === 'apoyo')) {
      rel(u, od || base)
      if (od && ['fuegos', 'ingenieria'].includes(tipoUnidad(u))) for (const m of man.filter((m) => m !== od && /^OC/.test(m.rol))) rel(u, m, 'indirecta')
    }
    for (const u of unidades.filter((x) => x.grupo === 'spac')) rel(u, od || base)
  }
  return { fases, unidades, relaciones, fuentes, avisos }
}

// Lo que la Mesa lee del ejercicio, para decírselo a la IA en el pedido (que lo
// verifique contra el expediente): unidad propia, cadena de mando, las unidades que
// dependen de ella según la opción, las FT del oficial con su composición y las
// adyacentes que nombra la orden.
export function lecturaDelEjercicio(ctx = {}, enfoque = 'puras') {
  const prop = unidadPropiaDelEjercicio(ctx)
  const e0 = escalonDeNombre(prop.nombre)
  const escPropia = e0 === 'ejercito' ? 'fftt' : e0 || 'division'
  const cadena = cadenaDeMando(ctx, escPropia)
  const subs = enfoque === 'ft' ? subordinadasFT(ctx, escPropia, prop.nombre) : enfoque === 'puras' ? subordinadasPuras(ctx, escPropia, prop.nombre) : { lista: [], fuentes: [], avisos: [] }
  const fichas = fichasPropias(ctx)
  const fts = (ctx.orgTarea || []).filter(esObj).map((o) => {
    const cuenta = {}
    for (const p of o.piezas || []) {
      const f = fichas.find((x) => x.id === p?.de)
      const madre = (f && nombreFicha(f)) || limpio(p?.madre) || limpio(p?.nom) || 'sin unidad'
      cuenta[madre] = (cuenta[madre] || 0) + 1
    }
    return {
      nombre: nombreOrg(o),
      clase: claseOrg(o),
      magnitud: magnitudDeEscalon(o.escalon),
      rol: ROL_DE_OPERACION[o.operacion] || '',
      tarea: tareaEnTercera(o.tarea),
      proposito: limpiarProposito(o.proposito),
      composicion: Object.entries(cuenta).map(([k, n]) => `${k}${n > 1 ? ` (${n})` : ''}`),
    }
  })
  return { propia: { nombre: prop.nombre, escalon: escPropia, fuente: prop.fuente }, cadena, subordinadas: subs.lista, fuentes: subs.fuentes, avisos: subs.avisos, fts, adyacentes: adyacentesDe(ctx, escPropia, prop.nombre) }
}

// Arma la hoja con lo del ejercicio. `pisar: false` (por defecto) sólo AGREGA lo que
// falta: no toca una coma de lo que el oficial (o la IA) ya escribió.
export function armarDesdeEjercicio(ctx = {}, { enfoque, previo = null, pisar = false } = {}) {
  const ant = normalizarConceptos(previo)
  const enf = ENFOQUES[enfoque] ? enfoque : ant.enfoque
  const nuevo = construir(ctx || {}, enf)
  const fecha = new Date().toISOString()
  if (pisar || !ant.unidades.length) {
    const valor = normalizarConceptos({ ...ant, enfoque: enf, fases: nuevo.fases, unidades: nuevo.unidades, relaciones: nuevo.relaciones, armado: { fecha, fuentes: nuevo.fuentes } })
    return { valor, resumen: { agregadas: nuevo.unidades.length, completadas: 0, fuentes: nuevo.fuentes, avisos: nuevo.avisos } }
  }
  const unidades = ant.unidades.map((u) => ({ ...u, fases: u.fases.map((f) => ({ ...f })) }))
  const fases = ant.fases.map((f) => ({ ...f }))
  for (const f of nuevo.fases) {
    const igual = fases.find((x) => x.id === f.id)
    if (igual) {
      if (!igual.nombre && f.nombre) igual.nombre = f.nombre
    } else fases.push({ ...f })
  }
  const mapa = {}
  let agregadas = 0
  let completadas = 0
  for (const n of nuevo.unidades) {
    const e =
      unidades.find((u) => u.origen && u.origen === n.origen) ||
      (n.propia && unidades.find((u) => u.propia)) ||
      (n.grupo === 'superior' && unidades.find((u) => u.grupo === 'superior' && !u.propia && nivelUnidad(u) >= 0 && nivelUnidad(u) === nivelUnidad(n))) ||
      (limpio(n.nombre) && unidades.find((u) => u.grupo !== 'superior' && mismaUnidad(u.nombre, n.nombre)))
    if (!e) {
      unidades.push(n)
      mapa[n.id] = n.id
      agregadas++
      continue
    }
    mapa[n.id] = e.id
    let cambio = false
    for (const k of ['nombre', 'rotulo', 'magnitud', 'arma', 'texto', 'numero', 'rol', 'mando', ...TEXTOS]) {
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
  const valor = normalizarConceptos({ ...ant, enfoque: enf, fases, unidades, relaciones, armado: { fecha, fuentes: nuevo.fuentes } })
  return { valor, resumen: { agregadas, completadas, fuentes: nuevo.fuentes, avisos: nuevo.avisos } }
}

// ─── Cada unidad en su escalón ─────────────────────────────────────────────────────
// Corrige lo que la IA (o una hoja de antes) dejó fuera de la jerarquía:
//   · la unidad propia es UNA: la marcada, o la que tiene su nombre; va al final de la
//     cadena de mando (con «adyacentes», en la fila);
//   · un escalón superior que quedó en las filas sube a la cadena, o se junta con la
//     caja de su escalón si ya está (nunca dos cajas del mismo escalón);
//   · con «puras» y «ft», una unidad del mismo escalón que la propia es la propia (si
//     tiene su nombre) o una ADYACENTE —otra división—, que en esta opción no va;
//   · una subordinada que quedó en la cadena baja a su fila.
// Las relaciones de lo que se juntó pasan a la unidad que quedó. Devuelve lo que cambió.
const CAMPOS_BASE = ['nombre', 'rotulo', 'magnitud', 'arma', 'texto', 'numero', 'mando']
export function acomodarJerarquia(valor, { propia: nomPropia = '' } = {}) {
  const v = normalizarConceptos(valor)
  let unidades = v.unidades.map((u) => ({ ...u, fases: u.fases.map((f) => ({ ...f })) }))
  const cambios = []
  const reemplazo = new Map()
  const juntar = (dest, src) => {
    for (const k of [...CAMPOS_BASE, ...TEXTOS]) if (!limpio(dest[k]) && limpio(src[k])) dest[k] = src[k]
    for (const f of src.fases) if (!dest.fases.some((x) => x.fase === f.fase)) dest.fases.push(f)
    if (src.rol && !dest.rol && dest.grupo === 'maniobra') dest.rol = src.rol
    reemplazo.set(src.id, dest.id)
    unidades = unidades.filter((u) => u !== src)
  }
  const nom = (u) => nombreUnidad(u)
  const ady = v.enfoque === 'adyacentes'
  // 1 · La unidad propia.
  let propia = unidades.find((u) => u.propia) || null
  const conNombre = limpio(nomPropia) ? unidades.find((u) => mismaUnidad(u.nombre, nomPropia)) : null
  if (conNombre && propia && conNombre !== propia) {
    if (!limpio(propia.nombre) || mismaUnidad(propia.nombre, nomPropia)) {
      juntar(propia, conNombre)
      propia.nombre = limpio(propia.nombre) || limpio(conNombre.nombre)
      cambios.push(`«${nom(conNombre)}» es tu unidad: se juntó con la unidad propia.`)
    } else {
      propia.propia = false
      conNombre.propia = true
      cambios.push(`La unidad propia es «${nom(conNombre)}», no «${nom(propia)}».`)
      propia = conNombre
    }
  } else if (!propia && conNombre) {
    conNombre.propia = true
    propia = conNombre
  } else if (!propia && !ady) {
    // Sin marca ni nombre: la única de las filas que está por encima de todas las demás
    // (la División que la IA puso con sus regimientos).
    const filas = unidades.filter((u) => u.grupo !== 'superior' && nivelUnidad(u) >= 0)
    const max = Math.max(-1, ...filas.map(nivelUnidad))
    const tope = filas.filter((u) => nivelUnidad(u) === max)
    if (tope.length === 1 && filas.some((u) => nivelUnidad(u) < max)) {
      tope[0].propia = true
      propia = tope[0]
      cambios.push(`«${nom(propia)}» está por encima de las demás unidades de las filas: es tu unidad.`)
    }
  }
  const e0 = escalonDeNombre(nomPropia)
  const nP = propia && nivelUnidad(propia) >= 0 ? nivelUnidad(propia) : nivelEscalon(e0 === 'ejercito' ? 'fftt' : e0 || 'division')
  // 2 · La unidad propia en su lugar.
  if (propia) {
    const lugar = ady ? 'maniobra' : 'superior'
    if (propia.grupo !== lugar) {
      cambios.push(ady ? `Tu unidad («${nom(propia)}») va en la fila, con las adyacentes.` : `Tu unidad («${nom(propia)}») va arriba, como última caja de la cadena de mando: sus unidades van DEBAJO de ella.`)
      propia.grupo = lugar
      propia.rol = ady ? propia.rol : ''
    }
  }
  // 3 · Las demás.
  for (const u of [...unidades]) {
    if (u === propia || !unidades.includes(u)) continue
    const n = nivelUnidad(u)
    if (n < 0) continue
    if (u.grupo === 'superior') {
      if (n > nP) continue
      if (n === nP && !ady) {
        if (propia && mismaUnidad(u.nombre, propia.nombre)) juntar(propia, u)
        else {
          reemplazo.set(u.id, '')
          unidades = unidades.filter((x) => x !== u)
          cambios.push(`«${nom(u)}» es del mismo escalón que tu unidad (adyacente): no va en la cadena de mando.`)
        }
        continue
      }
      u.grupo = n === nP ? 'maniobra' : grupoPorArma(u.arma, u.nombre, escalonDeUnidad(u))
      cambios.push(`«${nom(u)}» no está por encima de tu unidad: pasó a su fila.`)
      continue
    }
    if (n > nP) {
      const misma = unidades.find((x) => x !== u && x.grupo === 'superior' && nivelUnidad(x) === n)
      if (misma) {
        juntar(misma, u)
        cambios.push(`«${nom(u)}» es un escalón superior: se juntó con la caja «${nom(misma)}» de la cadena de mando.`)
      } else {
        u.grupo = 'superior'
        u.rol = ''
        cambios.push(`«${nom(u)}» es un escalón superior: subió a la cadena de mando.`)
      }
      continue
    }
    if (n === nP && !ady) {
      if (propia && mismaUnidad(u.nombre, propia.nombre)) {
        juntar(propia, u)
        cambios.push(`«${nom(u)}» es tu unidad: se juntó con la unidad propia.`)
      } else {
        reemplazo.set(u.id, '')
        unidades = unidades.filter((x) => x !== u)
        cambios.push(`«${nom(u)}» es ADYACENTE (mismo escalón que tu unidad, depende del mismo comando): no va entre tus unidades. Se ve con «Mi unidad entre las adyacentes».`)
      }
    }
  }
  // Una caja por escalón en la cadena.
  const cad = unidades.filter((u) => u.grupo === 'superior')
  for (const u of cad) {
    if (!unidades.includes(u) || u.propia) continue
    const otra = unidades.find((x) => x !== u && x.grupo === 'superior' && nivelUnidad(x) >= 0 && nivelUnidad(x) === nivelUnidad(u) && !x.propia)
    if (otra && unidades.indexOf(otra) > unidades.indexOf(u)) {
      juntar(u, otra)
      cambios.push(`Había dos cajas de ${ESCALON[escalonDeUnidad(u)]?.nom || 'un mismo escalón'} en la cadena de mando: quedó una.`)
    }
  }
  // Relaciones: las de lo que se juntó pasan a la que quedó; las de lo que se sacó, se van.
  const destino = (id) => {
    let x = id
    for (let i = 0; i < 10 && reemplazo.has(x); i++) x = reemplazo.get(x)
    return x
  }
  const relaciones = []
  for (const r of v.relaciones) {
    const desde = destino(r.desde)
    const hasta = destino(r.hasta)
    if (!desde || !hasta || desde === hasta) continue
    if (!unidades.some((u) => u.id === desde) || !unidades.some((u) => u.id === hasta)) continue
    if (relaciones.some((x) => x.desde === desde && x.hasta === hasta)) continue
    relaciones.push({ ...r, desde, hasta })
  }
  return { valor: normalizarConceptos({ ...v, unidades, relaciones }), cambios }
}

// ─── Texto (para el expediente, la carpeta y el pedido a la IA) ───────────────────
function lineaUnidad(u) {
  const partes = []
  const cab = [u.rol, nombreUnidad(u) !== limpio(u.nombre) && limpio(u.nombre) ? `${nombreUnidad(u)} (${u.nombre})` : nombreUnidad(u)].filter(Boolean).join(' ')
  const datos = [u.magnitud, ARMAS[u.arma]?.nom, u.texto && u.grupo === 'superior' ? `«${u.texto}»` : '', u.mando, u.propia ? 'UNIDAD PROPIA' : '', u.esfuerzo ? 'esfuerzo principal' : ''].filter(Boolean).join(', ')
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
  const l = [`  - Opción de la hoja: ${ENFOQUES[v.enfoque].nom}.`]
  const cad = v.unidades.filter((u) => u.grupo === 'superior')
  if (cad.length) l.push(`  - Cadena de mando: ${cad.map((u) => `${nombreUnidad(u)}${u.magnitud ? ` (${u.magnitud})` : ''}`).join(' → ')}`)
  if (v.fases.length) l.push(`  - Fases: ${v.fases.map((f) => `${f.id} ${f.nombre || ''}`.trim()).join(' · ')}`)
  for (const grupo of GRUPOS) for (const u of v.unidades.filter((x) => x.grupo === grupo)) l.push(`  - [${g[grupo]}] ${lineaUnidad(u)}`)
  const nom = (id) => nombreUnidad(v.unidades.find((u) => u.id === id))
  if (v.relaciones.length) l.push(`  - Relaciones: ${v.relaciones.map((r) => `${nom(r.desde)} → ${nom(r.hasta)} (${r.tipo})`).join(' · ')}`)
  return l.join('\n')
}
export function resumenConceptos(valor) {
  const v = normalizarConceptos(valor)
  const cuenta = (g) => v.unidades.filter((u) => u.grupo === g).length
  return { maniobra: cuenta('maniobra'), apoyo: cuenta('apoyo'), spac: cuenta('spac'), superiores: cuenta('superior'), fases: v.fases.length, relaciones: v.relaciones.length, total: v.unidades.length }
}
