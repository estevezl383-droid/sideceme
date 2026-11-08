// ⊞ Disgregar una gran unidad en sus dependientes (20-10-2026).
//
// Lo pidió Sergio en la F2·SAL «Movimientos iniciales», con el CE-I como una sola ficha en la carta:
// «quiero que ese Cuerpo de Ejército se convierta en Puesto Comando y que aparezcan las tres fichas:
// DIV MEC-2, DIV-1, DIV-6» (el GALM-1 en refuerzo ya estaba puesto).
//
// Qué hace, sobre la ficha de una gran unidad propia (Brigada, División, Cuerpo, Ejército):
//   1. lee sus dependientes INMEDIATAS de la Orden: la organización de la tarea de MESA EM
//      («CE-I: DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo»), o, si está vacía, la línea / el bloque de
//      esa unidad en los documentos del ejercicio; el oficial la revisa (y la corrige) antes de ponerla;
//   2. pone una ficha por dependiente alrededor de la madre, con su escalón y su arma, marcada
//      `dependeDe` (la madre) y su `relacion` («en refuerzo»…); las que YA están en la carta (GALM-1) no
//      se duplican: sólo se marcan como dependientes;
//   3. la madre pasa a ser su PUESTO COMANDO (`tipo: 'pc'`, misma designación): deja de contar como
//      unidad de maniobra, así la Formación inicial (F3·P3) no la cuenta dos veces junto a sus divisiones.
// «⊟ Reagrupar» lo deshace: quita las fichas que se pusieron (si siguen ahí) y la madre vuelve a unidad.

export const ESCALONES = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
const rango = (e) => ESCALONES.indexOf(e)
// Las que se disgregan: de Brigada para arriba (las chicas ya se disgregan en piezas en la F3·P3).
const DISGREGABLES = new Set(['brigada', 'division', 'cuerpo', 'ejercito'])
const MANIOBRA = new Set(['infanteria', 'mecanizada', 'motorizada', 'andina', 'selva', 'caballeria', 'cabmec', 'blindada', 'aerotransportada'])

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const plano = (s) => sinAcentos(s).toUpperCase().replace(/[^A-Z0-9]/g, '')
const esPropia = (u) => (u?.bando || 'propias') !== 'enemigo'

export function puedeDisgregarse(u) {
  if (!u || !esPropia(u)) return false
  if (u.disgregada) return true // la madre ya hecha PC: se puede reagrupar
  return (u.tipo || 'unidad') === 'unidad' && DISGREGABLES.has(u.escalon)
}

// La sigla de la designación, sin el nombre entre comillas: «DIV.MEC.-2 «X»» → «DIVMEC2».
export function sigla(designacion) {
  const s = sinAcentos(designacion).toUpperCase().replace(/[“”«»„‟"]/g, '"')
  return plano(s.split('"')[0].replace(/\(.*?\)/g, ''))
}
// ¿Es la misma unidad? Por la sigla («DIV MEC-2» = «DIV.MEC.-2» = «div mec 2»), sin que «DIV-1»
// sea «DIV-12» ni «DIV MEC-1».
export function mismaUnidad(a, b) {
  const x = sigla(a)
  const y = sigla(b)
  return !!x && x === y
}

// «DIV MEC -1 – CE-I» → «DIV MEC -1»: la designación sin el escalón superior pegado al final (así
// vienen las fichas de Google Earth). Con `superior`, sólo si lo de atrás ES esa unidad; sin él, si lo
// de atrás es una gran unidad (CE, DIV, BRIG, EJ…). Si no, queda igual. (08-11-2026)
const GRAN_UNIDAD = /^(C\.?\s?E|C\.?\s?T\.?\s?O|DIV|D\.?\s?E|BRIG|EJ|CUERPO|DIVISION|BRIGADA|FF\.?\s?TT)\b/
export function sinSuperior(designacion, superior = '') {
  const partes = String(designacion || '').split(/\s+[–—-]\s+/)
  if (partes.length < 2) return designacion
  const ult = partes[partes.length - 1]
  const esSuperior = superior ? mismaUnidad(ult, superior) : GRAN_UNIDAD.test(sinAcentos(ult).toUpperCase().trim())
  return esSuperior ? partes.slice(0, -1).join(' – ') : designacion
}
// La misma unidad aunque una de las dos lleve pegado su superior: «DIV MEC -1 – CE-I» = «DIV MEC-1».
export function mismaUnidadOSuperior(a, b, superior = '') {
  return mismaUnidad(a, b) || mismaUnidad(sinSuperior(a, superior), b) || mismaUnidad(a, sinSuperior(b, superior))
}

// Escalón y arma por la sigla. Lo que no se reconoce queda para que el oficial lo revise.
export function clasificar(designacion) {
  const s = sinAcentos(designacion).toUpperCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim()
  const t = s.replace(/[^A-Z0-9 -]/g, '')
  let escalon = ''
  let arma = ''
  const armaGU = () =>
    /MEC/.test(t) ? 'mecanizada' : /BLIND|ACOR|\bTQ\b/.test(t) ? 'blindada' : /MOT/.test(t) ? 'motorizada' : /AND|MONT/.test(t) ? 'andina' : /SELVA|\bSEL\b/.test(t) ? 'selva' : /AEROT|PARAC|\bAT\b/.test(t) ? 'aerotransportada' : /CAB/.test(t) ? 'caballeria' : 'infanteria'
  if (/^EJ(ERCITO)?\b/.test(t)) (escalon = 'ejercito'), (arma = 'infanteria')
  else if (/^C ?E\b|^CE[ -]|^CUERPO/.test(t)) (escalon = 'cuerpo'), (arma = armaGU())
  else if (/^DIV|^D ?I ?V/.test(t)) (escalon = 'division'), (arma = armaGU())
  else if (/^BR(IG)?\b|^BRIG|^BR[ -]/.test(t)) (escalon = 'brigada'), (arma = armaGU())
  else if (/^G ?A ?A\b|^GAA/.test(t)) (escalon = 'batallon'), (arma = 'antiaerea')
  else if (/^GA|^G ?ART/.test(t)) (escalon = 'batallon'), (arma = 'artilleria') // GA, GALM, GAM, GAL…
  else if (/^B(AT)? ?ING|^BING/.test(t)) (escalon = 'batallon'), (arma = 'ingenieria')
  else if (/^B(AT)? ?COM|^BCOM/.test(t)) (escalon = 'batallon'), (arma = 'comunicaciones')
  else if (/^B(AT)? ?LOG|^BLOG/.test(t)) (escalon = 'batallon'), (arma = 'logistica')
  else if (/^B(AT)? ?(INT|ICIA)/.test(t)) (escalon = 'batallon'), (arma = 'inteligencia')
  else if (/^B(AT)? ?AV|^BAV|^ESC ?AV/.test(t)) (escalon = 'batallon'), (arma = 'aviacion')
  else if (/^B(AT)? ?PM|^BPM/.test(t)) (escalon = 'batallon'), (arma = 'policiamilitar')
  else if (/^R ?A ?A\b|^RAA/.test(t)) (escalon = 'regimiento'), (arma = 'antiaerea')
  else if (/^R ?ING|^RING/.test(t)) (escalon = 'regimiento'), (arma = 'ingenieria')
  else if (/^R ?COM|^RCOM|^R ?TELECOM/.test(t)) (escalon = 'regimiento'), (arma = 'comunicaciones')
  else if (/^R ?LOG|^RLOG/.test(t)) (escalon = 'regimiento'), (arma = 'logistica')
  else if (/^RA/.test(t)) (escalon = 'regimiento'), (arma = 'artilleria')
  else if (/^RC/.test(t)) (escalon = 'regimiento'), (arma = /TQ|^RCB/.test(t) ? 'blindada' : /^RCM/.test(t) ? 'cabmec' : 'caballeria')
  else if (/^RI/.test(t)) (escalon = 'regimiento'), (arma = /^RIM(?!T|OT)/.test(t) ? 'mecanizada' : /^RIMT|^RIMOT/.test(t) ? 'motorizada' : /^RIA(?!T)|^RIAN/.test(t) ? 'andina' : /^RIS/.test(t) ? 'selva' : /^RIAT/.test(t) ? 'aerotransportada' : 'infanteria')
  else if (/^R[A-Z]?\b|^R[ -]?\d/.test(t)) (escalon = 'regimiento'), (arma = 'infanteria')
  // Los elementos de un COE (08-11-2026): BAT. AA, COMP., CÍA., ERM, SECC./SEC.
  else if (/^B(AT)? ?A ?A\b|^BAA/.test(t)) (escalon = 'batallon'), (arma = 'antiaerea')
  else if (/^(COMP|CIA|CA)\b|^COMP |^CIA |^CIA-/.test(t) || /^COMP/.test(t)) (escalon = 'compania'), (arma = armaElemento(t))
  else if (/^ER[MC]?\b|^ESC(UADRON)?\b|^ER[MC]?-?\d/.test(t)) (escalon = 'compania'), (arma = 'caballeria')
  else if (/^SECC?\b|^SEC(C)? /.test(t)) (escalon = 'seccion'), (arma = armaElemento(t))
  return { escalon, arma }
}

// El arma de una compañía o sección por lo que dice después: «COMP. ING. COMB-3», «SECC. AA-3»…
function armaElemento(t) {
  return /\bA ?A\b/.test(t) ? 'antiaerea' : /\bING/.test(t) ? 'ingenieria' : /\bCOM\b|\bCOM-|\bCOM \d/.test(t) ? 'comunicaciones'
    : /\bPM\b|\bPM-/.test(t) ? 'policiamilitar' : /\bI ?CIA|\bINT/.test(t) ? 'inteligencia' : /\bLOG|\bCYS\b|\bIM\b|\bIM-/.test(t) ? 'logistica'
    : /\bAT\b|\bAT-/.test(t) ? 'antitanque' : /\bMORT/.test(t) ? 'artilleria' : 'infanteria'
}

const RELACIONES = [
  [/EN REFUERZO|REFORZAD|\bREF\b/, 'en refuerzo'],
  [/BAJO CONTROL OPERACIONAL|\bCONTROL OP|\bCO\b/, 'bajo control operacional'],
  [/APOYO DIRECTO|\bAD\b/, 'en apoyo directo'],
  [/APOYO GENERAL|\bAG\b/, 'en apoyo general'],
  [/EN APOYO/, 'en apoyo'],
]
// «RI-A/3» (identificador provisional de un regimiento de la DIV-3) también es una sigla.
const ES_SIGLA = /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ. ]{0,14}?(?:[ .-]*\d{1,3}|[ .-]+[IVXL]{1,5}|[ .-]+[A-Z]\/\d{1,3})\b/i

// Lee la lista de dependientes: «CE-I: DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo», o una por renglón
// («- DIV-1», «• GALM-1 (en refuerzo)»). `madre` es la designación de la unidad que se disgrega: no se
// cuenta a sí misma.
// `conocidas` (opcional): las fichas de la carta; una que coincida entra con su designación, escalón y
// arma tal cual («AGRP. LOG. – CE-I», que no tiene número), así ⊞ Disgregar la vincula y no la duplica.
export function leerDependientes(texto, madre = '', conocidas = []) {
  const lista = []
  const crudo = String(texto || '')
    .replace(/[“”«»„‟]/g, '"')
    .replace(/"[^"]{0,40}"/g, (m) => m.replace(/[,;]/g, ' '))
  for (let trozo of crudo.split(/\r?\n|[;,]|\s+y\s+|\s+e\s+/)) {
    trozo = trozo.replace(/^[\s\-–—•*·>]+|^\s*(\d+|[a-z])[.)-]+\s+/gi, '').trim()
    // «los CE-I», «la DIV-3», «del RI-33»: sin el artículo.
    trozo = trozo.replace(/^(los|las|la|el|del|de la|de los|de)\s+(?=\S)/i, '').replace(/\s*\*+\s*$/, '').trim()
    // «CE-I: DIV MEC-2» → lo que va después de los dos puntos, si lo de antes es la madre (o un título).
    const dos = trozo.indexOf(':')
    if (dos >= 0) {
      const antes = trozo.slice(0, dos)
      if (!madre || mismaUnidad(antes, madre) || /ORGANIZ|MEDIOS|DEPENDIENTES/i.test(sinAcentos(antes))) trozo = trozo.slice(dos + 1).trim()
    }
    if (!trozo) continue
    const conocida = (conocidas || []).find((u) => u && u.designacion && mismaUnidadOSuperior(u.designacion, trozo.replace(/\(.*?\)/g, '').trim(), madre))
    if (conocida && !(madre && mismaUnidad(conocida.designacion, madre))) {
      if (!lista.some((u) => mismaUnidad(u.designacion, conocida.designacion))) {
        const rel = (RELACIONES.find(([re]) => re.test(sinAcentos(trozo).toUpperCase())) || [null, ''])[1]
        lista.push({ designacion: conocida.designacion, escalon: conocida.escalon || clasificar(conocida.designacion).escalon || 'batallon', arma: conocida.arma || clasificar(conocida.designacion).arma || 'infanteria', relacion: rel })
      }
      continue
    }
    const mayus = sinAcentos(trozo).toUpperCase()
    const relacion = (RELACIONES.find(([re]) => re.test(mayus)) || [null, ''])[1]
    const nombre = (/"[^"]+"/.exec(trozo) || [''])[0]
    let base = trozo
      .replace(/\(.*?\)/g, ' ')
      .replace(/"[^"]*"/g, ' ')
      .replace(/\b(en refuerzo|reforzad[oa]s?|bajo control operacional|en apoyo( directo| general)?|org[aá]nic[oa]s?)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const m = ES_SIGLA.exec(base)
    if (!m || m.index > 0) continue
    base = base.slice(0, m[0].length).replace(/[\s.-]+$/, '').trim()
    const designacion = nombre ? `${base} «${nombre.replace(/"/g, '').trim()}»` : base
    if (madre && mismaUnidad(designacion, madre)) continue
    const { escalon, arma } = clasificar(base)
    if (!escalon) continue
    if (lista.some((u) => mismaUnidad(u.designacion, designacion))) continue
    lista.push({ designacion, escalon, arma, relacion })
  }
  return lista
}

// Sólo las INMEDIATAS: con las de un nivel abajo de la madre en la lista, las de maniobra de dos o más
// niveles abajo son de una división, no del CE (los apoyos y lo que va en refuerzo se quedan siempre).
export function inmediatas(lista, escalonMadre) {
  const rm = rango(escalonMadre)
  const validas = (lista || []).filter((u) => rm < 0 || rango(u.escalon) < rm)
  if (rm < 0) return validas
  const hayUnNivel = validas.some((u) => rango(u.escalon) === rm - 1)
  if (!hayUnNivel) return validas
  return validas.filter((u) => rango(u.escalon) === rm - 1 || u.relacion || !MANIOBRA.has(u.arma))
}

// De dónde sale la lista: la organización de la tarea de MESA EM, si es de esta unidad; si no, la línea
// («CE-I: …») o el bloque («CE-I» y debajo «- DIV-1»…) de la unidad en los documentos del ejercicio.
export function fuenteDependientes({ madre, ordenSup, documentos, unidades } = {}) {
  const sm = sigla(madre?.designacion || '')
  const org = String(ordenSup?.organizacionTarea || '').trim()
  if (org) {
    const cab = /^([^:\n]{1,40}):/.exec(org)
    if (!cab || !sm || sigla(cab[1]) === sm) {
      const lista = leerDependientes(org, madre?.designacion)
      if (lista.length) return { lista, de: 'la organización de la tarea de la Orden (MESA EM)' }
    }
  }
  if (sm) {
    for (const d of documentos || []) {
      const lineas = String(d?.texto || '').split(/\r?\n/)
      for (let i = 0; i < lineas.length; i++) {
        const l = lineas[i].replace(/^[\s\-–—•*·]+|^\s*\d+[.)-]+\s*/g, '').trim()
        const dos = l.indexOf(':')
        const cabeza = dos >= 0 ? l.slice(0, dos) : l
        if (cabeza.length > 30 || sigla(cabeza) !== sm) continue
        const resto = dos >= 0 ? l.slice(dos + 1).trim() : ''
        let lista = resto ? leerDependientes(resto, madre.designacion) : []
        if (!lista.length) {
          // El bloque: los renglones de abajo, hasta el primero en blanco o que no sea una unidad.
          const bloque = []
          for (let j = i + 1; j < lineas.length && j < i + 25; j++) {
            if (!lineas[j].trim()) break
            if (!leerDependientes(lineas[j]).length) break
            bloque.push(lineas[j])
          }
          lista = leerDependientes(bloque.join('\n'), madre.designacion)
        }
        if (lista.length) return { lista, de: `«${String(d.nombre || 'un documento del ejercicio').slice(0, 60)}»` }
      }
    }
  }
  // Los documentos que dicen la organización de otra forma (los apéndices de un tema base):
  // «(COE de la DIV-3) … Dependencia orgánica: CE-I.», «Dependencias del CTO: …», «Las FF.TT.TO.
  // comprenden los CE-I, CE-II…», y el cuadro del COE (CMDO., COMP. CYS, RI-33… hasta TOTAL).
  const orgDocs = organizacionDeDocumentos(documentos)
  // «DIV MEC -1 – CE-I» (de Google Earth) se busca también como «DIV MEC-1».
  const siglas = new Set([sm, sigla(sinSuperior(madre?.designacion || ''))].filter(Boolean))
  const deDocs = orgDocs.find((o) => siglas.has(sigla(o.de))) || { hijos: [], docs: [] }
  // Las fichas de la carta que dicen de quién dependen («DIV MEC -1 – CE-I», de Google Earth) o que ya
  // quedaron como sus dependientes.
  const deCarta = (unidades || []).filter((u) => u && u.id !== madre?.id && esPropia(u) && u.tipo !== 'pc' &&
    (u.dependeDe === madre?.id || (madre?.designacion && sinSuperior(u.designacion, madre.designacion) !== u.designacion)))
  const lista = leerDependientes(deDocs.hijos.join('\n'), madre?.designacion, unidades)
  for (const u of deCarta) {
    if (lista.some((x) => mismaUnidadOSuperior(u.designacion, x.designacion, madre.designacion))) continue
    lista.push({ designacion: u.designacion, escalon: u.escalon || clasificar(u.designacion).escalon || 'batallon', arma: u.arma || clasificar(u.designacion).arma || 'infanteria', relacion: u.relacion || '' })
  }
  if (lista.length) {
    const fuentes = [deDocs.hijos.length ? (deDocs.docs.length === 1 ? `«${deDocs.docs[0]}»` : `${deDocs.docs.length} documentos del ejercicio (${deDocs.docs.slice(0, 3).join(', ')}${deDocs.docs.length > 3 ? '…' : ''})`) : '', deCarta.length ? 'las fichas de la carta que dicen depender de ella' : ''].filter(Boolean)
    return { lista, de: fuentes.join(' y ') }
  }
  return { lista: [], de: '' }
}

// La organización escrita en los documentos del ejercicio, como la escriben los apéndices de un tema
// base (08-11-2026, «DIAMANTE»): [{ de: 'CE-I', hijos: ['DIV. MEC.-1', 'DIV-3', …], docs: [nombres] }].
//   · el título dice de quién es el documento: «(COE de la DIV-3)», «(Organigrama del CE-I)»;
//   · «Dependencia orgánica: CE-I.» → ese documento es de un dependiente del CE-I;
//   · «Dependencias del CTO: A, B, C» / «Las FF.TT.TO. comprenden los CE-I, CE-II…» → sus dependientes;
//   · el cuadro del COE: los renglones entre «CLASE» (o «GRUPO») y «TOTAL» son sus unidades (sin CMDO.).
// Un organigrama pegado como IMAGEN no se puede leer: no tiene texto.
export function organizacionDeDocumentos(documentos) {
  const mapa = new Map()
  const agregar = (de, hijo, doc) => {
    de = String(de || '').replace(/[.\s]+$/, '').trim()
    hijo = String(hijo || '').trim()
    if (!de || !hijo || !sigla(de) || mismaUnidad(de, hijo)) return
    const k = sigla(de)
    if (!mapa.has(k)) mapa.set(k, { de, hijos: [], docs: [] })
    const o = mapa.get(k)
    if (!o.hijos.some((h) => mismaUnidad(h, hijo))) o.hijos.push(hijo)
    if (doc && !o.docs.includes(doc)) o.docs.push(doc)
  }
  for (const d of documentos || []) {
    const texto = String(d?.texto || '')
    if (!texto) continue
    const nombreDoc = String(d?.nombre || 'documento').replace(/\.[a-z]{2,4}$/i, '').slice(0, 50)
    const lineas = texto.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim())
    const titulo = lineas.slice(0, 8).join(' ')
    const mt = /\((?:C\.?\s?O\.?\s?E\.?|COE|cuadro de organizaci[oó]n[^)]*?|organigrama|organizaci[oó]n|org\.)\s+(?:de\s+(?:la|el|las|los)\s+|del\s+|de\s+)?([^)]{2,40})\)/i.exec(titulo)
    const sujeto = mt ? mt[1].trim() : ''
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i]
      let m
      if ((m = /dependencia\s+org[aá]nica\s*:\s*([^.;\n]{2,30})/i.exec(l)) && sujeto) agregar(m[1], sujeto, nombreDoc)
      if ((m = /^dependencias?\s+(?:del?|de la|de los|de las)\s+([^:]{2,30}):\s*(.+)$/i.exec(l))) {
        for (const h of String(m[2]).split(/,|;|\s+y\s+|\s+e\s+/)) agregar(m[1], h.replace(/\(.*?\)/g, '').replace(/^(los|las|la|el)\s+/i, ''), nombreDoc)
      }
      if ((m = /^(?:[Ll]as|[Ll]os|[Ll]a|[Ee]l)?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9.\- ]{1,24}?)\s+comprenden?\s+(.+)$/.exec(l))) {
        // Hasta el fin de la oración («… y las UU.FF.EE. Cada cuerpo de ejército comprende…»).
        for (const h of String(m[2]).split(/\.\s+(?=[A-ZÁÉÍÓÚÑ][a-záéíóúñ])/)[0].split(/,|;|\s+y\s+|\s+e\s+/)) agregar(m[1], h.replace(/\(.*?\)/g, '').replace(/^(los|las|la|el)\s+/i, '').replace(/[.]+$/, ''), nombreDoc)
      }
      // El cuadro del COE: «GRUPO» / «CLASE» y debajo una unidad por renglón, hasta «TOTAL».
      if (sujeto && /^CLASE$/i.test(l) && /^GRUPO$/i.test(lineas[i - 1] || '')) {
        for (let j = i + 1; j < lineas.length && j < i + 60; j++) {
          const c = lineas[j]
          if (/^TOTAL$/i.test(c) || !c) break
          if (/^(CMDO|COMANDO)\.?$/i.test(c)) continue
          agregar(sujeto, c, nombreDoc)
        }
      }
    }
  }
  return [...mapa.values()]
}

// Alrededor de la madre, en círculo (arrancando al norte), a una distancia según su escalón.
const RADIO = { brigada: 0.012, division: 0.03, cuerpo: 0.055, ejercito: 0.09 }
export function ubicarAlrededor(madre, n) {
  const r = RADIO[madre?.escalon] || 0.03
  const lat0 = Number(madre?.lat) || 0
  const lng0 = Number(madre?.lng) || 0
  const k = Math.cos((lat0 * Math.PI) / 180) || 1
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / Math.max(n, 1)
    return { lat: Math.round((lat0 + r * Math.cos(a)) * 1e6) / 1e6, lng: Math.round((lng0 + (r * Math.sin(a)) / k) * 1e6) / 1e6 }
  })
}

// Disgrega `id` en `lista` (lo leído). Devuelve las fichas nuevas de la carta y qué pasó.
export function disgregar(unidades, id, lista, { base = Date.now() } = {}) {
  const us = unidades || []
  const madre = us.find((u) => u.id === id)
  if (!madre) return null
  const yaEstaban = []
  const poner = []
  for (const d of lista || []) {
    // La que ya está en la carta, aunque venga de Google Earth con el superior pegado («DIV MEC -1 – CE-I»).
    const ya = us.find((u) => u.id !== id && esPropia(u) && mismaUnidadOSuperior(u.designacion, d.designacion, madre.designacion))
    if (ya) yaEstaban.push({ ficha: ya, d })
    else poner.push(d)
  }
  const lugares = ubicarAlrededor(madre, poner.length)
  const nuevas = poner.map((d, i) => ({
    id: base + i + Math.random(),
    bando: 'propias',
    tipo: 'unidad',
    escalon: d.escalon,
    arma: d.arma,
    instalacion: '',
    designacion: d.designacion,
    futura: false,
    agrupacion: false,
    dependeDe: id,
    ...(d.relacion ? { relacion: d.relacion } : {}),
    ...lugares[i],
  }))
  const vinculadas = new Map(yaEstaban.map((y) => [y.ficha.id, y.d]))
  const resultado = us.map((u) => {
    if (u.id === id) return { ...u, tipo: 'pc', disgregada: { puestas: nuevas.map((x) => x.id), vinculadas: [...vinculadas.keys()], tipoAntes: u.tipo || 'unidad' } }
    if (vinculadas.has(u.id)) {
      const d = vinculadas.get(u.id)
      return { ...u, dependeDe: id, ...(d.relacion && !u.relacion ? { relacion: d.relacion } : {}) }
    }
    return u
  })
  return { unidades: [...resultado, ...nuevas], nuevas, yaEstaban: yaEstaban.map((y) => y.ficha), madre }
}

// Lo contrario: quita las fichas que puso (si siguen en la carta), desvincula las que ya estaban y la
// madre vuelve a ser unidad.
export function reagrupar(unidades, id) {
  const us = unidades || []
  const madre = us.find((u) => u.id === id)
  if (!madre?.disgregada) return null
  const puestas = new Set(madre.disgregada.puestas || [])
  const quitadas = us.filter((u) => puestas.has(u.id))
  const resultado = us
    .filter((u) => !puestas.has(u.id))
    .map((u) => {
      if (u.id === id) {
        const { disgregada, ...resto } = u
        return { ...resto, tipo: disgregada.tipoAntes || 'unidad' }
      }
      if (u.dependeDe === id) {
        const { dependeDe, ...resto } = u
        return resto
      }
      return u
    })
  return { unidades: resultado, quitadas, madre }
}

const nombre = (u) => String(u?.designacion || '').trim() || 'la unidad'
const conRelacion = (d) => (d.relacion ? `${d.designacion} (${d.relacion})` : d.designacion)

// Lo que hace el botón de 🪖 Unidades: pregunta, disgrega o reagrupa. Devuelve { unidades, aviso } para
// que el compilado las ponga (con deshacer) o null si no hay que cambiar nada.
export function accionDisgregar({ unidades, id, ordenSup, documentos, preguntar, confirmar } = {}) {
  const ask = preguntar || ((m, v) => (typeof window !== 'undefined' ? window.prompt(m, v) : null))
  const ok = confirmar || ((m) => (typeof window !== 'undefined' ? window.confirm(m) : false))
  const madre = (unidades || []).find((u) => u.id === id)
  if (!madre) return null
  if (madre.disgregada) {
    const r = reagrupar(unidades, id)
    if (!r) return null
    if (!ok(`¿Reagrupar ${nombre(madre)}?\n\nSe quitan de la carta las ${r.quitadas.length} ficha(s) que puso «Disgregar»${r.quitadas.length ? ` (${r.quitadas.map(nombre).join(', ')})` : ''} y ${nombre(madre)} vuelve a ser una sola unidad.`)) return null
    return { unidades: r.unidades, aviso: `⊟ ${nombre(madre)} volvió a ser una sola unidad (${r.quitadas.length} ficha(s) quitadas). «↶ Deshacer» de la barra la vuelve a disgregar.` }
  }
  if (!puedeDisgregarse(madre)) return null
  const { lista, de } = fuenteDependientes({ madre, ordenSup, documentos, unidades })
  const propuesta = inmediatas(lista, madre.escalon).map(conRelacion).join(', ')
  const msg =
    `⊞ Disgregar ${nombre(madre)}: queda en la carta como su PUESTO COMANDO y aparecen sus unidades dependientes (un nivel abajo), alrededor del PC, para que las arrastres a su lugar.\n\n` +
    (propuesta
      ? `Las leí de ${de}. Revisalas (separadas por coma; «(en refuerzo)» después de la que corresponda):`
      : `No encontré la organización de ${nombre(madre)} en la Orden, ni en los documentos del ejercicio, ni en las fichas de la carta.\n` +
        `(Si el organigrama está pegado como IMAGEN en el Word, la Mesa no lo puede leer: necesita texto, por ejemplo «${nombre(madre)}: DIV MEC-1, DIV-3, DIV-9» o los COE con «Dependencia orgánica: ${nombre(madre)}».)\n\n` +
        'Escribí sus dependientes, separadas por coma (ej.: DIV MEC-2, DIV-1, DIV-6, GALM-1 (en refuerzo)):')
  const texto = ask(msg, propuesta)
  if (texto == null) return null
  const elegidas = leerDependientes(texto, madre.designacion, (unidades || []).filter((u) => u.id !== id && esPropia(u)))
  if (!elegidas.length) return { unidades: null, aviso: `⊞ No reconocí ninguna unidad en «${String(texto).slice(0, 80)}». Escribilas con su sigla: DIV MEC-2, DIV-1, GALM-1…` }
  const r = disgregar(unidades, id, elegidas)
  if (!r) return null
  const partes = [`⊞ ${nombre(madre)} es ahora su Puesto Comando.`]
  if (r.nuevas.length) partes.push(`${r.nuevas.length} ficha(s) nueva(s) a su alrededor: ${r.nuevas.map(nombre).join(', ')} — arrastralas a su lugar.`)
  if (r.yaEstaban.length) partes.push(`Ya estaban en la carta (no se duplicaron, quedan como sus dependientes): ${r.yaEstaban.map(nombre).join(', ')}.`)
  partes.push('«⊟ Reagrupar» en 🪖 Unidades lo deshace.')
  return { unidades: r.unidades, aviso: partes.join(' ') }
}

// La F2·SAL «Movimientos iniciales»: un renglón por cada dependiente de una unidad disgregada (las de
// reconocimiento e ingeniería ya las pone la Mesa; no se repiten).
export function filasMovimientos(unidades, yaPuestas = [], rotulo = nombre) {
  const us = unidades || []
  const hay = new Set((yaPuestas || []).map((f) => plano(f?.Unidad)))
  const filas = []
  for (const u of us) {
    if (u.dependeDe == null || !esPropia(u)) continue
    const madre = us.find((m) => m.id === u.dependeDe)
    const r = rotulo(u)
    if (hay.has(plano(r))) continue
    hay.add(plano(r))
    filas.push({
      Unidad: u.relacion ? `${r} (${u.relacion})` : r,
      Desde: '',
      Hasta: '',
      Itinerario: '',
      'No antes de': '',
      'No después de': '',
      Observaciones: `Dependiente de ${madre ? rotulo(madre) : 'la unidad'}: ocupación de su zona de reunión y desplazamiento a su posición de partida.`,
    })
  }
  return filas
}
