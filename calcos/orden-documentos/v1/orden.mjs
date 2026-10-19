// 📄 La Orden del escalón superior sale de los DOCUMENTOS DEL EJERCICIO (19-10-2026).
//
// Lo pidió Sergio con la captura de la F1·P7 Orden Preparatoria N° 1 («Todavía no hay nada en el
// calco para sembrar esta hoja») teniendo la Orden de Operaciones y sus anexos cargados:
//   «los documentos que yo cargo por ahí, esos deben ser la fuente de información… para cualquiera
//   que suba esos son los documentos para sacar información».
//
// Las hojas (Orden de Alerta, Órdenes Preparatorias, Guía Inicial, el membrete, los pedidos a la
// IA…) se llenan con la «Orden del escalón superior» de la Mesa EM (`ordenSup`). Si esos casilleros
// están vacíos, se llenan solos con lo que dice la Orden cargada en 📁 Ejercicio → Documentos:
//   · membrete: quién la expide (escalón superior), el CG. y la fecha/hora (D-44 (0900));
//   · número, carta, situación (enemigo, propias, refuerzos), intención, concepto, coordinación,
//     comando y comunicaciones;
//   · de «Tareas de las unidades de maniobra», el párrafo de NUESTRA unidad: su misión, sus tareas
//     y su organización.
// Nunca pisa lo escrito: sólo llena casilleros vacíos, y cada casillero una sola vez (queda anotado
// en `_desdeDocs`; si el oficial lo borra, no vuelve).
//
// Lee la Orden como la extrae la Mesa de un Word (líneas con tabulaciones, sin numeración) y como
// viene en un .md (con «I.- SITUACIÓN.», «A.- Fuerzas enemigas. Ver…», «1.- CE-I (…).»).

const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const clave = (s) => sinTildes(s).toLowerCase().replace(/\s+/g, ' ').trim()
const compacta = (s) => sinTildes(s).toUpperCase().replace(/[^A-Z0-9]/g, '')

// «I.- », «A.- », «1.- », «a.- », «1) », «## » y viñetas al principio de un renglón.
const NUMERACION = /^(?:#{1,6}\s*)?(?:(?:[IVX]{1,5}|[A-Z]|\d{1,2}|[a-z])\s*(?:\.-|\.|-|\))\s+|[-•–]\s+)?/

function renglones(texto) {
  return String(texto || '')
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\\([-+_*.()#\\])/g, '$1')
    .replace(/\*{1,3}/g, '')
    .split('\n')
    .map((l) => l.replace(/\t+/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)
}

// Los títulos de la Orden (formato de cinco párrafos). `fin`: dónde termina ese apartado.
const TITULOS = {
  organizacion: ['organizacion de la tarea', 'organizacion para el combate'],
  situacion: ['situacion'],
  enemigo: ['fuerzas enemigas'],
  probable: ['curso de accion mas probable'],
  peligroso: ['curso de accion mas peligroso'],
  propias: ['fuerzas propias', 'fuerzas amigas'],
  refuerzos: ['refuerzos y reducciones', 'agregaciones y segregaciones', 'agregaciones y separaciones'],
  mision: ['mision'],
  ejecucion: ['ejecucion'],
  intencion: ['intencion del comandante'],
  concepto: ['concepto de la operacion'],
  maniobra: ['maniobra'],
  fuegos: ['apoyo de fuegos'],
  tareasManiobra: ['tareas de las unidades de maniobra', 'tareas a las unidades de maniobra', 'tareas a las unidades subordinadas', 'tareas de las unidades subordinadas'],
  tareasApoyo: ['tareas de las unidades de apoyo de combate', 'tareas a las unidades de apoyo de combate', 'tareas de las unidades de apoyo'],
  coordinacion: ['instrucciones de coordinacion'],
  servicio: ['apoyo de servicio', 'apoyo logistico', 'apoyo de servicio de combate', 'servicios'],
  mando: ['comando y comunicaciones', 'mando y comunicaciones'],
  comando: ['comando', 'mando'],
  comunicaciones: ['comunicaciones'],
  firma: ['el comandante de', 'autenticacion', 'distribucion', 'acuse recibo'],
}

// ¿El renglón ES ese título (con o sin numeración, y con texto a continuación, como en el .md)?
// Devuelve lo que sigue al título en el mismo renglón ('' si no hay nada), o null.
// Los párrafos principales (MISIÓN, EJECUCIÓN…) van solos en su renglón: «Misión: rechazar…»
// dentro de las fuerzas propias NO es el párrafo II.
const SOLOS = new Set(['situacion', 'mision', 'ejecucion', 'servicio', 'mando', 'comando'])

function esTitulo(linea, tipo) {
  const sinNum = linea.replace(NUMERACION, '')
  const k = clave(sinNum)
  for (const t of TITULOS[tipo]) {
    if (k === t || k === t + '.' || k === t + ':') return ''
    if (SOLOS.has(tipo)) continue
    if (k.startsWith(t + '.') || k.startsWith(t + ':')) {
      // «A.- Fuerzas enemigas. Ver Anexo…» → «Ver Anexo…»
      return sinNum.slice(t.length + 1).trim()
    }
  }
  return null
}

function buscar(L, tipo, desde = 0, hasta = L.length) {
  for (let i = desde; i < hasta; i++) {
    const resto = esTitulo(L[i], tipo)
    if (resto !== null) return { i, resto }
  }
  return null
}

// El texto de un apartado: desde su título hasta el primero de los títulos `fin` que aparezca.
function apartado(L, tipo, fin, desde = 0) {
  const t = buscar(L, tipo, desde)
  if (!t) return null
  let j = L.length
  for (const f of fin) {
    const x = buscar(L, f, t.i + 1)
    if (x && x.i < j) j = x.i
  }
  const cuerpo = [t.resto, ...L.slice(t.i + 1, j)].filter(Boolean)
  return { i: t.i, fin: j, resto: t.resto, texto: cuerpo.join('\n').trim() }
}

const FECHA_D = /D\s*(?:[+\-−–]\s*\d{1,3})?\s*\(\s*[0-2]?\d[:.]?[0-5]\d\s*\)/i
const CG = /\b(C\.?\s?G\.?|P\.?\s?C\.?|CMDO\.?|COMANDO)\b/i

// El membrete: «CTO / FF.TT.T.O. / CG. Challapata. D-44 (0900) / EMO/SEC-III / No. 001/XYZ.»
function membrete(L) {
  const tope = Math.min(L.length, 25)
  for (let i = 0; i < tope; i++) {
    const l = L[i]
    if (l.length > 90 || !CG.test(l)) continue
    const f = l.match(FECHA_D)
    if (!f) continue
    const lugar = l.slice(0, f.index).replace(/[\s.,;:]+$/, '').trim()
    const prev = i > 0 && L[i - 1].length <= 40 && !FECHA_D.test(L[i - 1]) ? L[i - 1].replace(/\.$/, '') + (L[i - 1].endsWith('.') && /\.[A-Z]\.$/.test(L[i - 1]) ? '.' : '') : ''
    return { puestoMando: lugar, vigencia: f[0].replace(/\s+/g, ' ').replace(/\(\s*/, '(').replace(/\s*\)/, ')'), escalonSuperior: prev }
  }
  return null
}

// Cuál documento es la Orden: el de categoría «orden» que se titula ORDEN DE OPERACIONES (no un
// anexo) y tiene MISIÓN; entre copias (el .md y el Word), el que más apartados tiene.
function laOrden(documentos) {
  const cands = (documentos || []).filter((d) => String(d?.texto || '').trim().length > 200)
  let mejor = null
  let puntos = -1
  for (const d of cands) {
    const L = renglones(d.texto)
    const cabeza = clave(L.slice(0, 12).join(' '))
    if (/^anexo|\banexo\s*["“«]?[a-z]["”»]?\s*\(/.test(clave(L.find((l) => /anexo|orden de operaciones|plan de operaciones/i.test(l)) || ''))) continue
    if (!/orden de operaciones|plan de operaciones|orden de operacion|plan de campana|orden fragmentaria/.test(cabeza)) continue
    let p = 0
    for (const t of ['mision', 'ejecucion', 'enemigo', 'propias', 'intencion', 'concepto', 'tareasManiobra', 'coordinacion', 'comando']) if (buscar(L, t)) p++
    if (d.categoria === 'orden') p += 0.5
    if (p > puntos) {
      puntos = p
      mejor = { doc: d, L }
    }
  }
  return puntos >= 3 ? mejor : null
}

// «CE-I (DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo).» empieza con la unidad «CE-I»
// (y no «CE-II»): la designación seguida de espacio, paréntesis, punto, dos puntos o fin.
function empiezaConUnidad(linea, unidad) {
  const u = String(unidad || '').trim()
  if (!u) return false
  const l = linea.replace(NUMERACION, '')
  const esc = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\s.-]+/g, '[\\s.\\-]*')
  return new RegExp(`^(?:el\\s+|la\\s+)?${esc}(?=$|[\\s(.,:;])`, 'i').test(l)
}

// Los renglones que encabezan el párrafo de cada unidad en «Tareas de las unidades de maniobra»:
// en el .md, «2.- CE-II (…).» (las tareas van con letra: «a.- Defiende…»); en el Word, un nombre
// solo, «CE-II (DIV MEC-7, DIV-9, DIV-11).», «COMANLOG.», o un nombre y su tarea en el mismo
// renglón, «Bat. Com. I. Instala y opera…».
const CONECTORES = new Set(['y', 'e', 'de', 'del', 'en', 'la', 'las', 'los', 'el'])
function esNombre(seg) {
  const fuera = seg.replace(/\([^)]*\)/g, ' ').replace(/[«"“][^»"”]*[»"”]/g, ' ')
  const palabras = fuera.split(/[\s,;]+/).filter(Boolean)
  return palabras.length > 0 && palabras.every((w) => /^[A-ZÁÉÍÓÚÑ0-9]/.test(w) || CONECTORES.has(w.toLowerCase()))
}
function encabezaUnidad(linea) {
  if (/^\d{1,2}\s*(?:\.-|\.)\s+/.test(linea)) return true
  if (/^[a-z]\s*(?:\.-|\.|\))\s+/.test(linea)) return false
  const l = linea.replace(NUMERACION, '')
  if (!/^[A-ZÁÉÍÓÚÑ]/.test(l)) return false
  if (l.length <= 160 && /\.$/.test(l) && esNombre(l.replace(/\.$/, ''))) return true
  const m = l.match(/^(.{2,40}?)\.\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s/)
  return !!m && esNombre(m[1])
}

function parrafoDeUnidad(L, seccion, unidad) {
  if (!seccion) return null
  for (let i = seccion.i + 1; i < seccion.fin; i++) {
    if (!empiezaConUnidad(L[i], unidad)) continue
    const cab = L[i].replace(NUMERACION, '')
    // En el .md el párrafo puede venir en el mismo renglón: «CE-II (…). Esfuerzo principal. Defiende…»
    const m = cab.match(/^(.*?\)\.?|[^.]+\.)\s+(.+)$/)
    const titulo = m ? m[1] : cab
    const resto = m ? [m[2]] : []
    let j = i + 1
    while (j < seccion.fin && !encabezaUnidad(L[j])) j++
    const cuerpo = [...resto, ...L.slice(i + 1, j).map((l) => l.replace(/^[a-z]\s*(?:\.-|\.|\))\s+/, ''))].filter(Boolean)
    return { titulo: titulo.replace(/\.$/, ''), cuerpo }
  }
  return null
}

// «Defiende el AO LAUCA…» → «El CE-I defiende el AO LAUCA…»
function conSujeto(unidad, frase) {
  const f = String(frase || '').trim()
  if (!f) return ''
  if (empiezaConUnidad(f, unidad) || /^(el|la|los|las)\s/i.test(f)) return f
  const art = /^(div|brig|cia|c[ií]a|bat|compa|agrupaci|fuerza|reserva|secci|escuadr|bater)/i.test(unidad) ? 'La' : 'El'
  return `${art} ${unidad} ${f.charAt(0).toLowerCase()}${f.slice(1)}`
}

/**
 * Lee la Orden de los documentos del ejercicio.
 * @param {Array<{nombre:string,texto:string,categoria?:string}>} documentos
 * @param {{unidad?: string}} opciones  la unidad considerada («CE-I»): su párrafo de tareas es la misión
 * @returns {{doc: string, campos: Record<string,string>} | null}
 */
export function leerOrden(documentos, { unidad = '' } = {}) {
  const o = laOrden(documentos)
  if (!o) return null
  const { L } = o
  const c = {}
  const pon = (k, v) => {
    const t = String(v || '').trim()
    if (t) c[k] = t
  }

  // Membrete: de la Orden y, si no lo tiene (un .md), de cualquier otro documento cargado.
  let mem = membrete(L)
  if (!mem) for (const d of documentos || []) if ((mem = membrete(renglones(d?.texto)))) break
  if (mem) {
    pon('escalonSuperior', mem.escalonSuperior)
    pon('puestoMando', mem.puestoMando)
    pon('vigencia', mem.vigencia)
  }
  const tit = L.find((l) => /orden de operaciones|plan de operaciones/i.test(l)) || ''
  const num = tit.match(/N(?:o|ro|°|º)\.?\s*(\d{1,4})/i)
  if (num) pon('numero', num[1])
  const carta = L.find((l) => /^carta[s]?\s*:/i.test(l))
  if (carta) pon('carta', carta.replace(/^cartas?\s*:\s*/i, '').replace(/\.$/, ''))
  const cls = L.slice(0, 6).find((l) => /^(secreto|reservado|confidencial)$/i.test(l))
  if (cls) pon('clasificacion', cls.toUpperCase())

  // I.- SITUACIÓN
  const finSit = ['propias', 'refuerzos', 'mision', 'ejecucion']
  const ene = apartado(L, 'enemigo', finSit)
  if (ene) {
    const partes = [ene.texto]
    for (const [k, rot] of [['probable', 'Curso de acción más probable'], ['peligroso', 'Curso de acción más peligroso']]) {
      // Los CAE van dentro de «Fuerzas enemigas»; se los rotula para que se lean.
      const x = apartado(L, k, ['probable', 'peligroso', ...finSit], ene.i)
      if (x && x.i < ene.fin) partes.push(`${rot}: ${x.texto}`)
    }
    // El texto corrido de «Fuerzas enemigas» termina donde empieza el primer CAE.
    const primerCae = [buscar(L, 'probable', ene.i), buscar(L, 'peligroso', ene.i)].filter((x) => x && x.i < ene.fin).map((x) => x.i)
    if (primerCae.length) partes[0] = [ene.resto, ...L.slice(ene.i + 1, Math.min(...primerCae))].filter(Boolean).join('\n')
    pon('enemigo', partes.join('\n'))
  }
  const misionSup = apartado(L, 'mision', ['ejecucion', 'intencion', 'concepto'])
  const prop = apartado(L, 'propias', ['refuerzos', 'mision', 'ejecucion'])
  if (prop || misionSup) {
    const sup = mem?.escalonSuperior || 'el escalón superior'
    pon('propias', [misionSup?.texto ? `${sup} (escalón superior). Misión: ${misionSup.texto}` : '', prop?.texto || ''].filter(Boolean).join('\n'))
  }
  pon('refuerzos', apartado(L, 'refuerzos', ['mision', 'ejecucion'])?.texto)

  // III.- EJECUCIÓN
  pon('intencion', apartado(L, 'intencion', ['concepto', 'maniobra', 'tareasManiobra', 'coordinacion'])?.texto)
  const conc = apartado(L, 'concepto', ['maniobra', 'fuegos', 'tareasManiobra', 'coordinacion'])
  const man = apartado(L, 'maniobra', ['fuegos', 'tareasManiobra', 'coordinacion'], conc ? conc.i : 0)
  pon('concepto', [conc?.texto, man?.texto ? `Maniobra: ${man.texto}` : ''].filter(Boolean).join('\n'))
  pon('coordinacion', apartado(L, 'coordinacion', ['servicio', 'mando', 'firma'])?.texto)
  const mando = buscar(L, 'mando')
  pon('comando', apartado(L, 'comando', ['comunicaciones', 'firma'], mando ? mando.i + 1 : 0)?.texto)
  pon('comunicaciones', apartado(L, 'comunicaciones', ['firma'], mando ? mando.i + 1 : 0)?.texto)

  // Nuestra unidad en «Tareas de las unidades de maniobra» (o de apoyo de combate).
  if (unidad) {
    const sec = apartado(L, 'tareasManiobra', ['tareasApoyo', 'coordinacion', 'servicio', 'mando'])
    const secAp = apartado(L, 'tareasApoyo', ['coordinacion', 'servicio', 'mando'])
    const p = parrafoDeUnidad(L, sec, unidad) || parrafoDeUnidad(L, secAp, unidad)
    if (p && p.cuerpo.length) {
      // «Esfuerzo principal. Defiende el AO…»: la misión es la frase con el «a partir del…», si la hay.
      const idx = Math.max(0, p.cuerpo.findIndex((x) => /a partir del|desde el|hasta el/i.test(x)))
      let mis = p.cuerpo[idx]
      if (idx === 0 && /^[^.]{3,40}\.\s+\S/.test(mis) && !/a partir del|desde el/i.test(mis.split('.')[0])) {
        const [cabeza, ...cola] = mis.split(/(?<=\.)\s+/)
        mis = cola.join(' ') || cabeza
      }
      pon('mision', conSujeto(unidad, mis))
      const cuando = mis.match(/(?:a partir del|desde el)\s+D[^,;]*?(?:hasta el|al)\s+D[+\-−–]?\s*\d*\s*\(\s*\d{3,4}\s*\)/i)
      if (cuando) pon('cuando', cuando[0])
      pon('tareas', p.cuerpo.filter((_, k) => k !== idx).join('\n'))
      const org = p.titulo.match(/\((.+)\)/)
      if (org && /[A-ZÁÉÍÓÚÑ]{2,}/.test(org[1]) && /[-,;]|\d/.test(org[1])) pon('organizacionTarea', `${unidad}: ${org[1]}`)
    }
  }
  return { doc: o.doc.nombre || '', campos: c }
}

/**
 * Completa la Orden del escalón superior con los documentos, SIN pisar lo escrito.
 * Devuelve la Orden nueva, o null si no hay nada para completar (así no se entra en un bucle).
 */
export function completarOrdenSup(ordenSup = {}, documentos = [], { unidad = '' } = {}) {
  const os = ordenSup || {}
  const u = String(unidad || os.unidad || '').trim()
  const r = leerOrden(documentos, { unidad: u })
  if (!r) return null
  const ya = os._desdeDocs || {}
  const nuevo = {}
  for (const [k, v] of Object.entries(r.campos)) {
    if (ya[k]) continue // ya se llenó una vez: si el oficial lo borró, se respeta
    if (String(os[k] ?? '').trim()) continue
    nuevo[k] = v
  }
  if (!Object.keys(nuevo).length) return null
  const marca = { ...ya }
  for (const k of Object.keys(nuevo)) marca[k] = r.doc || true
  return { ...os, ...nuevo, _desdeDocs: marca }
}

export const _interno = { renglones, esTitulo, membrete, laOrden, parrafoDeUnidad, empiezaConUnidad, compacta }
