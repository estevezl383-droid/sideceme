// 🪖 MI UNIDAD Y SU CONTEXTO — 19-11-2026.
//
// Sergio, con la F2·P3 abierta y los apéndices de organización del tema base «DIAMANTE»: «que se disgreguen las
// unidades… darles de una vez las opciones de los documentos para que seleccionen y coloquen en su calco, armar
// una por una es bien complicado… si son cuerpo de ejército las opciones de cuerpo de ejército, si son división la
// opción de división». Y después: «hay más divisiones y en realidad hay 4 cuerpos de ejército: dales la chance de
// armar bien sus unidades, crear, adaptarse… de ahora en adelante deben ponerse los datos de configuración del
// ejercicio: quién soy, quién es mi unidad superior, quiénes son mis unidades adyacentes, quiénes dependen de mí…
// como el ejercicio ya está corriendo, que al abrir les aparezca eso para que se regularice».
//
// Qué hay:
//   · AvisoMiUnidad (en la Mesa): al abrir un ejercicio que ya tiene fichas y todavía no tiene su unidad
//     configurada, aparece la ventana «🪖 Mi unidad y su contexto». «Completar después» la cierra hasta que se
//     vuelva a abrir el ejercicio (o se recargue la página).
//   · MiUnidadCaja (en la F2·P3 del G-3): el mismo formulario, resaltado; ya configurado, un resumen con
//     «⚡ Colocar las que faltan» y «✏️ Cambiar». Abajo, plegadas, las formas de antes (⊞ Disgregar, a mano).
//   · El formulario: nivel (CE / DIV / BRIG / otro), quién soy (botones con las unidades del tema base o escrita a
//     mano), mi unidad superior, mis adyacentes, quiénes dependen de mí (la lista de los apéndices, editable:
//     nombre, escalón, arma, ➕, ✕, 📋 pegar) y mi puesto (G-1…G-5, JEM, Cmte).
//   · «⚡ Guardar y colocar»: pone mi unidad (si no estaba en la carta) y sus dependientes alrededor, bajo su
//     dependencia (`dependeDe`), con ↶ Deshacer. Las que ya estaban en la carta no se duplican: quedan vinculadas.
// El compilado guarda la configuración en ops.configUnidad, en la Orden superior (unidad, escalonSuperior,
// unidadesAdyacentes), en la identidad de siempre (ops.unidadConsiderada) y en el puesto de la Mesa.
//
// Los organigramas de los apéndices 1, 2, 3, 5, 7, 9, 11 y 13 son DIBUJOS de Word (la Mesa no los puede leer):
// las listas de abajo salen de esos dibujos y de los COE (apéndices 4, 6, 8, 10, 12 y 14), que sí son texto.
//
// 21-11-2026 · Sergio: «que se pueda directamente seleccionar el icono o el símbolo de la unidad y solo se le
// coloque el número… que se vaya sumando a la lista. Igual los cuerpos de ejército CE I, CE II, CE III, CE IV y más
// opciones para darle buen contexto al ejercicio».
//   · ⑤ tiene la PALETA DE SÍMBOLOS (paleta-unidades.mjs): tocás el símbolo, se suma el renglón con su sigla y
//     escribís solo el número; Enter suma otra igual. Cada renglón muestra su símbolo, como en la carta.
//   · El orden de batalla del Anexo B (Sistema de Fuerzas) a la DEMIL N° 01/26: FF.TT.T.O. (con CE-I…CE-IV), el
//     CE-III con sus DIV-8, DIV-9 y DIV-6, y las DIV-3, 6, 7, 8, 9, 11 y 12 con sus regimientos. El CE-IV no
//     figura en ningún documento: queda para armarlo con la paleta.
//   · Nivel FF.TT.T.O., atajos para «mi unidad superior» y «🌳 la organización del tema base» para elegir tocando.

import { ubicarAlrededor, mismaUnidadOSuperior, sigla } from '../../disgregar/v1/disgregar.mjs?v=disgregar20261020'
import { clave, ARMAS, ESCALONES_FILA, leerLista, leerRenglon } from './organigrama.mjs?v=20261110'
import { simboloSVG, ESCALONES_PALETA, deEscalon, escalonDebajo, filaDePaleta, incompleta, otraIgual } from './paleta-unidades.mjs?v=20261121'

export const VERSION_MI_UNIDAD = '20261121'

// ─── El tema base «DIAMANTE» ─────────────────────────────────────────────────────────────────────────────────────

const F = (designacion, escalon, arma, extra = {}) => ({ designacion, escalon, arma, ...extra })
const num = (n) => (n ? { numeroUnidad: String(n) } : {})
const nn = (n) => (n ? ' ' + n : '')

// Las tropas de Cuerpo (Apéndices 1 y 2: el mismo organigrama, con 100 en el CE-II y 90 en el CE-I).
// El batallón del círculo es el de Inteligencia: en los organigramas de las divisiones ese mismo dibujo es la
// SEC. IM de su COE.
export const tropasCE = (n = '') => [
  F(`RGTO. SAT. MONT.${nn(n)}`, 'regimiento', 'ninguna', { textoSimbolo: 'SAT.MONT.', ...num(n) }),
  F(`RGTO. ART. AA${nn(n)}`, 'regimiento', 'antiaerea', { ...num(n), reducida: true }),
  F(`RGTO. ART.${nn(n)}`, 'regimiento', 'artilleria', { ...num(n), reducida: true }),
  F(`BAT. AT${nn(n)}`, 'batallon', 'antitanque', num(n)),
  F(`BAT. ING.${nn(n)}`, 'batallon', 'ingenieria', { ...num(n), reducida: true }),
  F(`BAT. COM.${nn(n)}`, 'batallon', 'comunicaciones', num(n)),
  F(`BAT. I.M.${nn(n)}`, 'batallon', 'inteligencia', num(n)),
  F(`BAT. P.M.${nn(n)}`, 'batallon', 'policiamilitar', num(n)),
  F(`BAT. C Y S${nn(n)}`, 'batallon', 'ninguna', { textoSimbolo: 'C Y S', ...num(n) }),
  F(`BAT. LOG.${nn(n)}`, 'batallon', 'logistica', { ...num(n), reducida: true }),
  F(`CÍA. AV. EJ.${nn(n)}`, 'compania', 'aviacion', num(n)),
]

const divMec = (d) => F(`DIV. MEC.-${d}`, 'division', 'mecanizada', num(d))
const divInf = (d) => F(`DIV-${d}`, 'division', 'infanteria', num(d))
const reg = (s, arma, n, extra = {}) => F(`${s}-${n}`, 'regimiento', arma, { ...num(n), ...extra })
const cys = (n) => F(`COMP. C Y S-${n}`, 'compania', 'ninguna', { textoSimbolo: 'C Y S', ...num(n) })
const apoyoDiv = ({ at, ing, ingMec, agua, com, log, pm, im, av }) => [
  F(`COMP. AT-${at}`, 'compania', 'antitanque', num(at)),
  ingMec != null ? F(`COMP. ING. MEC.-${ingMec}`, 'compania', 'ingenieria', num(ingMec)) : F(`COMP. ING. COMB.-${ing}`, 'compania', 'ingenieria', num(ing)),
  F(`SECC. ING. AGUA-${agua}`, 'seccion', 'ingenieria', num(agua)),
  F(`SEC. COM.-${com}`, 'seccion', 'comunicaciones', num(com)),
  F(`BAT. LOG.-${log}`, 'batallon', 'logistica', num(log)),
  F(`COMP. P.M.-${pm}`, 'compania', 'policiamilitar', num(pm)),
  F(`SEC. I.M.-${im}`, 'seccion', 'inteligencia', num(im)),
  ...(av != null ? [F(`SEC. AV. EJ.-${av}`, 'seccion', 'aviacion', num(av))] : []),
]

// Anexo B (Sistema de Fuerzas) a la DEMIL N° 01/26 (carpeta «DEMIL. DIAMANTE»): FUERZAS TERRESTRES → CTO (CE-I,
// CE-II, CE-III), CZSE (DIV-3 (-), DIV-11*, DIV-12*) y CZI - CREM (DIV-7). Es un dibujo: el orden de las columnas
// coincide con los apéndices (CE-I = DIV MEC-2, DIV-4, DIV-5; CE-II = DIV MEC-1, DIV-2, DIV-10).
const DEMIL = 'Anexo B (Sistema de Fuerzas) a la DEMIL N° 01/26'
const ce = (r) => F(`CE-${r}`, 'cuerpo', 'ninguna', { textoSimbolo: 'CE' })
const ri = (n) => reg('RI', 'infanteria', n)
const rc = (n) => reg('RC', 'caballeria', n)

export const CATALOGO = [
  { nombre: 'FF.TT.T.O.', nivel: 'ejercito', arma: 'ninguna', textoSimbolo: 'FF.TT.', superior: 'CTO', fuente: `${DEMIL} (el CE-IV no figura: está para armarlo)`,
    dependientes: [ce('I'), ce('II'), ce('III'), ce('IV')] },
  { nombre: 'CE-I', nivel: 'cuerpo', superior: 'FF.TT.T.O.', fuente: 'Apéndice 2 (Organigrama del CE-I) al Anexo C',
    dependientes: [divMec(2), divInf(4), divInf(5), ...tropasCE(90)] },
  { nombre: 'CE-II', nivel: 'cuerpo', superior: 'FF.TT.T.O.', fuente: 'Apéndice 1 (Organigrama del CE-II) al Anexo C',
    dependientes: [divMec(1), divInf(2), divInf(10), ...tropasCE(100)] },
  { nombre: 'CE-III', nivel: 'cuerpo', superior: 'FF.TT.T.O.', fuente: `${DEMIL} (sus tropas de Cuerpo no figuran)`,
    dependientes: [divInf(8), divInf(9), divInf(6)] },
  { nombre: 'CE-IV', nivel: 'cuerpo', superior: 'FF.TT.T.O.', fuente: '', dependientes: [] },
  { nombre: 'DIV. MEC.-1', nivel: 'division', arma: 'mecanizada', superior: 'CE-II', fuente: 'Apéndices 3 y 4 (Organigrama y COE de la DIMEC-1)',
    dependientes: [cys(1), reg('RIM', 'mecanizada', 8, { reducida: true }), reg('REIM', 'mecanizada', 23), reg('RECB', 'cabmec', 1), reg('RECB', 'cabmec', 2),
      reg('RCM', 'cabmec', 4), reg('RCM', 'cabmec', 5), reg('REAM', 'artilleria', 2), reg('RAAM', 'antiaerea', 1),
      ...apoyoDiv({ at: 1, ingMec: 1, agua: 1, com: 1, log: 'VIII', pm: 1, im: 1, av: 1 })] },
  { nombre: 'DIV-2', nivel: 'division', arma: 'infanteria', superior: 'CE-II', fuente: 'Apéndices 5 y 6 (Organigrama y COE de la DIV-2)',
    dependientes: [cys(2), reg('RI', 'infanteria', 21), reg('RI', 'infanteria', 22), reg('RI', 'infanteria', 31), reg('RI', 'infanteria', 33),
      F('COMP. SAT. MONT.-25', 'compania', 'ninguna', { textoSimbolo: 'SAT.MONT.', ...num(25) }), reg('RCB', 'cabmec', 12), reg('RCB', 'cabmec', 13), reg('RAC', 'artilleria', 1),
      ...apoyoDiv({ at: 3, ing: 3, agua: 3, com: 3, log: 'V', pm: 3, im: 3 })] },
  { nombre: 'DIV-10', nivel: 'division', arma: 'infanteria', superior: 'CE-II', fuente: 'Apéndices 7 y 8 (Organigrama y COE de la DIV-10)',
    dependientes: [cys(10), reg('RI', 'infanteria', 3), reg('RI', 'infanteria', 4), reg('RI', 'infanteria', 27), reg('RI', 'infanteria', 2),
      F('REG. SAT. SELV.-10', 'regimiento', 'ninguna', { textoSimbolo: 'SAT.SELV.', ...num(10) }), reg('RCB', 'cabmec', 3), reg('RAC', 'artilleria', 3),
      ...apoyoDiv({ at: 10, ing: 10, agua: 10, com: 10, log: 'X', pm: 10, im: 10 })] },
  { nombre: 'DIV. MEC.-2', nivel: 'division', arma: 'mecanizada', superior: 'CE-I', fuente: 'Apéndices 9 y 10 (Organigrama y COE de la DIMEC-2)',
    dependientes: [cys(2), reg('RIM', 'mecanizada', 9), reg('REM', 'mecanizada', 24), reg('RECB', 'cabmec', 6), reg('RECB', 'cabmec', 7),
      reg('RCM', 'cabmec', 8), reg('RCM', 'cabmec', 9), reg('REAM', 'artilleria', 3), reg('RAAM', 'antiaerea', 7),
      ...apoyoDiv({ at: 2, ingMec: 3, agua: 2, com: 2, log: 'II', pm: 2, im: 2, av: 2 })] },
  { nombre: 'DIV-4', nivel: 'division', arma: 'infanteria', superior: 'CE-I', fuente: 'Apéndices 11 y 12 (Organigrama y COE de la DIV-4)',
    dependientes: [cys(4), reg('RI', 'infanteria', 5), reg('RI', 'infanteria', 6), reg('RI', 'infanteria', 11), reg('RI', 'infanteria', 15),
      F('COMP. SAT. MONT.-10', 'compania', 'ninguna', { textoSimbolo: 'SAT.MONT.', ...num(10) }), reg('RCB', 'cabmec', 14), reg('RCB', 'cabmec', 15), reg('RAC', 'artilleria', 4),
      ...apoyoDiv({ at: 4, ing: 4, agua: 4, com: 4, log: 'IV', pm: 4, im: 4 })] },
  { nombre: 'DIV-5', nivel: 'division', arma: 'infanteria', superior: 'CE-I', fuente: 'Apéndices 13 y 14 (Organigrama y COE de la DIV-5)',
    dependientes: [cys(5), reg('RI', 'infanteria', 13), reg('RI', 'infanteria', 15), reg('RI', 'infanteria', 37), reg('RI', 'infanteria', 38),
      F('REG. SAT. SELV.-16', 'regimiento', 'ninguna', { textoSimbolo: 'SAT.SELV.', ...num(16) }), reg('RCB', 'cabmec', 6), reg('RAC', 'artilleria', 5),
      ...apoyoDiv({ at: 5, ing: 5, agua: 5, com: 5, log: 'IX', pm: 5, im: 5 })] },
  // Las del CE-III y las de las zonas, como las trae la DEMIL (sin COE: solo sus regimientos).
  { nombre: 'DIV-8', nivel: 'division', arma: 'infanteria', superior: 'CE-III', fuente: DEMIL,
    dependientes: [ri(7), ri(10), F('RSS-12', 'regimiento', 'ninguna', { textoSimbolo: 'SAT.SELV.', ...num(12) }), rc(10), reg('RAA', 'antiaerea', 8), F('BPM-III', 'batallon', 'policiamilitar')] },
  { nombre: 'DIV-9', nivel: 'division', arma: 'infanteria', superior: 'CE-III', fuente: DEMIL,
    dependientes: [ri(26), ri(31), ri(32), F('REPPN-1', 'regimiento', 'ninguna', { textoSimbolo: 'REPPN', ...num(1) })] },
  { nombre: 'DIV-6', nivel: 'division', arma: 'infanteria', superior: 'CE-III', fuente: DEMIL,
    dependientes: [ri(17), ri(29), rc(2), reg('RA', 'artilleria', 3)] },
  { nombre: 'DIV-3', nivel: 'division', arma: 'infanteria', reducida: true, superior: 'CZSE', fuente: `${DEMIL} (DIV-3 (-))`,
    dependientes: [ri(5), ri(20), rc(3), F('BAT. ING.-I', 'batallon', 'ingenieria')] },
  { nombre: 'DIV-11', nivel: 'division', arma: 'infanteria', superior: 'CZSE', fuente: `${DEMIL} (marcada con *: sin unidades)`, dependientes: [] },
  { nombre: 'DIV-12', nivel: 'division', arma: 'infanteria', superior: 'CZSE', fuente: `${DEMIL} (marcada con *: sin unidades)`, dependientes: [] },
  { nombre: 'DIV-7', nivel: 'division', arma: 'infanteria', superior: 'CZI - CREM', fuente: DEMIL,
    dependientes: [ri(18), ri(19), reg('RAA', 'antiaerea', 7), F('BPM-III', 'batallon', 'policiamilitar')] },
]

// De quién puede depender cada nivel (atajos de ③).
export function superioresDe(nivel = '') {
  const ces = CATALOGO.filter((c) => c.nivel === 'cuerpo').map((c) => c.nombre)
  const divs = CATALOGO.filter((c) => c.nivel === 'division').map((c) => c.nombre)
  if (nivel === 'ejercito') return ['CTO']
  if (nivel === 'cuerpo') return ['FF.TT.T.O.']
  if (nivel === 'division') return [...ces, 'CZSE', 'CZI - CREM']
  if (nivel === 'brigada') return [...ces, ...divs]
  if (nivel === 'regimiento') return divs
  return []
}

// La organización del tema base, para verla entera y elegir tocando: [{ cabeza, hijas: [catálogo…] }].
export function arbolTemaBase() {
  const divs = CATALOGO.filter((c) => c.nivel === 'division')
  const grupos = CATALOGO.filter((c) => c.nivel === 'cuerpo').map((c) => ({ cabeza: c.nombre, cat: c, hijas: divs.filter((d) => limpio(d.superior) === c.nombre) }))
  for (const d of divs) {
    if (grupos.some((g) => g.hijas.includes(d))) continue
    let g = grupos.find((x) => !x.cat && x.cabeza === limpio(d.superior))
    if (!g) grupos.push((g = { cabeza: limpio(d.superior) || '—', cat: null, hijas: [] }))
    g.hijas.push(d)
  }
  return grupos
}

export const NIVELES = [
  ['ejercito', 'FF.TT.T.O.'],
  ['cuerpo', 'Cuerpo de Ejército'],
  ['division', 'División'],
  ['brigada', 'Brigada'],
]
const OTROS_NIVELES = [['ejercito', 'FF.TT. / Ejército'], ['cuerpo', 'Cuerpo de Ejército'], ['division', 'División'], ['brigada', 'Brigada'], ['regimiento', 'Regimiento'], ['batallon', 'Batallón']]
const NOMBRE_NIVEL = Object.fromEntries(OTROS_NIVELES)

export const PUESTOS = [
  ['g1', 'G-1 · Personal'], ['g2', 'G-2 · Inteligencia'], ['g3', 'G-3 · Operaciones'], ['g4', 'G-4 · Logística'], ['g5', 'G-5 · AC/GM'],
  ['jem', 'JEM'], ['cmte', 'Comandante'],
]
const NOMBRE_PUESTO = Object.fromEntries(PUESTOS)

// ─── Lo puro (se prueba en Node) ─────────────────────────────────────────────────────────────────────────────────

const limpio = (s) => String(s ?? '').split(/\s+/).filter(Boolean).join(' ')
const alias = (s) => s.replace(/^DIMEC/, 'DIVMEC').replace(/^DIVISIONMECANIZADA/, 'DIVMEC').replace(/^DIVISION/, 'DIV').replace(/^CUERPODEEJERCITO/, 'CE')
// ¿La misma unidad? «CE - II» = «CE-II», «DIMEC-1» = «DIV. MEC.-1», «DIV MEC -1 – CE-I» = «DIV MEC-1».
export function igual(a, b, superior = '') {
  if (!limpio(a) || !limpio(b)) return false
  if (mismaUnidadOSuperior(a, b, superior)) return true
  const x = alias(sigla(a))
  return !!x && x === alias(sigla(b))
}

export const delCatalogo = (nombre) => (limpio(nombre) ? CATALOGO.find((c) => igual(c.nombre, nombre)) || null : null)

const ENEMIGO = ['enemigo', 'enemigas', 'rojo']
const esPropia = (u) => !!u && !ENEMIGO.includes(String(u.bando || '').toLowerCase()) && !u.esAgrupacion
const esFicha = (u) => ['unidad', 'pc'].includes(u?.tipo || 'unidad')
const mismoId = (a, b) => a != null && b != null && String(a) === String(b)
const sinMadre = (u) => u.dependeDe == null || u.dependeDe === ''

// Mi ficha en la carta: la propia que tiene mi nombre (con o sin el superior pegado).
export function buscarMia(unidades = [], nombre = '') {
  if (!limpio(nombre)) return null
  const c = (unidades || []).filter((u) => esPropia(u) && esFicha(u) && igual(u.designacion, nombre))
  return c.find((u) => u.disgregada || u.tipo === 'pc') || c[0] || null
}

// Mis dependientes que ya están en la carta: bajo mi ficha, o sueltas con el mismo nombre.
export function enLaCarta(unidades = [], madre = null, fila = {}) {
  if (!limpio(fila.designacion)) return null
  return (
    (unidades || []).find(
      (u) => esPropia(u) && esFicha(u) && (!madre || !mismoId(u.id, madre.id)) && (madre ? mismoId(u.dependeDe, madre.id) || sinMadre(u) : sinMadre(u)) && igual(u.designacion, fila.designacion, madre?.designacion || ''),
    ) || null
  )
}

const nuevaId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const conId = (f) => ({ ...f, id: f.id || nuevaId(), va: f.va !== false })

export function nivelDeNombre(nombre = '', antes = '') {
  const k = alias(sigla(nombre))
  if (/^(CE|CUERPO)/.test(k)) return 'cuerpo'
  if (/^(DIV|DI\d)/.test(k)) return 'division'
  if (/^BRIG/.test(k)) return 'brigada'
  if (/^(FFTT|EJ)/.test(k)) return 'ejercito'
  return antes || ''
}

// Lo que se ve al abrir el formulario: lo guardado; si no, lo que ya dice el ejercicio (la Orden, la identidad,
// la carta) completado con el tema base.
export function configInicial({ ops = {}, orden = {}, unidades = [], puesto = null } = {}) {
  const g = ops?.configUnidad
  if (g && limpio(g.unidad)) {
    return {
      nivel: g.nivel || nivelDeNombre(g.unidad),
      unidad: limpio(g.unidad),
      superior: limpio(g.superior),
      adyacentes: Array.isArray(g.adyacentes) ? g.adyacentes.map(limpio).filter(Boolean) : [],
      dependientes: Array.isArray(g.dependientes) ? g.dependientes.map(conId) : [],
      puesto: g.puesto || puesto || '',
    }
  }
  const nombre = limpio(orden?.unidad) || limpio(ops?.unidadConsiderada?.nombre)
  const cat = delCatalogo(nombre)
  const mia = buscarMia(unidades, nombre)
  const deps = mia ? (unidades || []).filter((u) => esPropia(u) && mismoId(u.dependeDe, mia.id)) : []
  const desdeCarta = deps.map((u) => conId({ designacion: limpio(u.designacion), escalon: u.escalon, arma: u.arma, ...(u.textoSimbolo ? { textoSimbolo: u.textoSimbolo } : {}), ...(u.numeroUnidad ? { numeroUnidad: u.numeroUnidad } : {}), ...(u.reducida ? { reducida: true } : {}) }))
  // Las del apéndice que todavía no están en la carta, después de las que ya están.
  const delApendice = (cat?.dependientes || []).filter((f) => !desdeCarta.some((d) => igual(d.designacion, f.designacion))).map(conId)
  return {
    nivel: cat?.nivel || (mia && ['cuerpo', 'division', 'brigada', 'ejercito', 'regimiento', 'batallon'].includes(mia.escalon) ? mia.escalon : '') || nivelDeNombre(nombre),
    unidad: cat && !limpio(orden?.unidad) ? cat.nombre : nombre,
    superior: limpio(orden?.escalonSuperior) || cat?.superior || '',
    adyacentes: limpio(orden?.unidadesAdyacentes) ? String(orden.unidadesAdyacentes).split(/[,;]/).map(limpio).filter(Boolean) : [],
    dependientes: [...desdeCarta, ...delApendice],
    puesto: puesto || '',
  }
}

export const configurada = (ops) => !!(ops?.configUnidad?.confirmada && limpio(ops.configUnidad.unidad))

export function faltantes(cfg = {}) {
  const f = []
  if (!cfg.nivel) f.push('el nivel (CE, DIV…)')
  if (!limpio(cfg.unidad)) f.push('quién sos (tu unidad)')
  if (!limpio(cfg.superior)) f.push('tu unidad superior')
  return f
}

// Lo que se guarda (sin las marcas del formulario).
export function paraGuardar(cfg = {}) {
  return {
    nivel: cfg.nivel || nivelDeNombre(cfg.unidad),
    unidad: limpio(cfg.unidad).toUpperCase(),
    superior: limpio(cfg.superior),
    adyacentes: (cfg.adyacentes || []).map(limpio).filter(Boolean),
    dependientes: (cfg.dependientes || []).filter((f) => limpio(f.designacion) && !incompleta(f)).map(({ id, va, designacion, escalon, arma, textoSimbolo, numeroUnidad, reducida }) => ({
      id, va: va !== false, designacion: limpio(designacion), escalon: escalon || 'batallon', arma: arma || 'infanteria',
      ...(textoSimbolo ? { textoSimbolo } : {}), ...(numeroUnidad ? { numeroUnidad: String(numeroUnidad) } : {}), ...(reducida ? { reducida: true } : {}),
    })),
    puesto: cfg.puesto || '',
    fuente: delCatalogo(cfg.unidad)?.fuente || '',
  }
}

const numeroDe = (s) => {
  const m = String(s || '').match(/\d+/g)
  return m ? m[m.length - 1] : ''
}
const nombre = (u) => limpio(u?.designacion) || 'la unidad'

// La ficha de mi unidad, cuando no está en la carta.
export function fichaMia(cfg = {}, centro = { lat: 0, lng: 0 }, id = Date.now()) {
  const cat = delCatalogo(cfg.unidad)
  const nivel = cfg.nivel || cat?.nivel || nivelDeNombre(cfg.unidad) || 'division'
  const sinArma = nivel === 'cuerpo' || nivel === 'ejercito'
  const arma = cat?.arma || (sinArma ? 'ninguna' : leerRenglon(cfg.unidad)?.arma || 'infanteria')
  const texto = cat?.textoSimbolo || (nivel === 'cuerpo' ? 'CE' : nivel === 'ejercito' ? 'FF.TT.' : '')
  return {
    id, bando: 'propias', tipo: 'unidad', escalon: nivel === 'ejercito' ? 'ejercito' : nivel, arma, instalacion: '',
    designacion: limpio(cfg.unidad).toUpperCase(),
    ...(arma === 'ninguna' && texto ? { textoSimbolo: texto } : {}),
    ...(cat?.reducida ? { reducida: true } : {}),
    ...(numeroDe(cfg.unidad) ? { numeroUnidad: numeroDe(cfg.unidad) } : {}),
    futura: false, agrupacion: false,
    lat: Math.round(Number(centro.lat) * 1e6) / 1e6, lng: Math.round(Number(centro.lng) * 1e6) / 1e6,
  }
}

// ⚡ Pone mi unidad (si falta) y las tildadas alrededor, bajo su dependencia. Mi unidad queda como su PC.
export function colocarMisUnidades(unidades = [], cfg = {}, { centro = null, base = Date.now() } = {}) {
  const us = unidades || []
  if (!limpio(cfg.unidad)) return { unidades: null, aviso: '⚠️ Primero elegí o escribí tu unidad.' }
  let madre = buscarMia(us, cfg.unidad)
  const nuevaMadre = !madre
  if (nuevaMadre) {
    if (!centro || !Number.isFinite(Number(centro.lat)) || !Number.isFinite(Number(centro.lng))) {
      return { unidades: null, aviso: '⚠️ No sé dónde poner tu unidad: abrí la carta (2D) sobre tu zona y volvé a tocar ⚡.' }
    }
    madre = fichaMia(cfg, centro, base)
  }
  const vistas = new Set()
  const filas = (cfg.dependientes || []).filter((f) => {
    if (!f || f.va === false || !limpio(f.designacion) || igual(f.designacion, madre.designacion)) return false
    const k = alias(sigla(f.designacion)) || clave(f.designacion)
    if (vistas.has(k)) return false
    vistas.add(k)
    return true
  })
  const vincular = []
  const poner = []
  for (const f of filas) {
    const ya = enLaCarta(us, madre, f)
    if (ya) {
      if (!mismoId(ya.dependeDe, madre.id)) vincular.push(ya)
    } else poner.push(f)
  }
  const previas = us.filter((u) => mismoId(u.dependeDe, madre.id)).length
  if (!nuevaMadre && !poner.length && !vincular.length) {
    return { unidades: null, nada: true, madre, aviso: `✓ Todas tus unidades ya están en la carta bajo ${nombre(madre)}.` }
  }
  const lugares = ubicarAlrededor(madre, previas + vincular.length + poner.length).slice(previas + vincular.length)
  const nuevas = poner.map((f, i) => ({
    id: base + 1 + i + Math.random(),
    bando: 'propias',
    tipo: 'unidad',
    escalon: f.escalon || 'batallon',
    arma: f.arma || 'infanteria',
    instalacion: '',
    designacion: limpio(f.designacion),
    ...(f.numeroUnidad || numeroDe(f.designacion) ? { numeroUnidad: String(f.numeroUnidad || numeroDe(f.designacion)) } : {}),
    ...(f.textoSimbolo && (f.arma || 'ninguna') === 'ninguna' ? { textoSimbolo: f.textoSimbolo } : {}),
    ...(f.reducida ? { reducida: true } : {}),
    futura: false,
    agrupacion: false,
    dependeDe: madre.id,
    ...lugares[i],
  }))
  const conHijos = previas + vincular.length + nuevas.length > 0
  const d = madre.disgregada || {}
  const madreLista = conHijos
    ? {
        ...madre,
        tipo: 'pc',
        disgregada: {
          puestas: [...(d.puestas || []), ...nuevas.map((x) => x.id)],
          vinculadas: [...(d.vinculadas || []), ...vincular.map((x) => x.id)],
          tipoAntes: d.tipoAntes || (madre.tipo === 'pc' ? 'pc' : madre.tipo || 'unidad'),
        },
      }
    : madre
  const ids = new Set(vincular.map((x) => String(x.id)))
  const resultado = us.map((u) => (mismoId(u.id, madre.id) ? madreLista : ids.has(String(u.id)) ? { ...u, dependeDe: madre.id } : u))
  if (nuevaMadre) resultado.push(madreLista)
  const partes = []
  partes.push(nuevaMadre ? `🪖 ${nombre(madreLista)} quedó en la carta${conHijos ? ' como su Puesto Comando' : ''}.` : `🪖 ${nombre(madreLista)} es su Puesto Comando.`)
  if (nuevas.length) partes.push(`${nuevas.length} unidad(es) a su alrededor: ${nuevas.map(nombre).join(', ')}.`)
  if (vincular.length) partes.push(`Ya estaban en la carta y ahora dependen de ${nombre(madreLista)}: ${vincular.map(nombre).join(', ')}.`)
  partes.push('Arrastralas a su lugar. «↶ Deshacer» de la barra vuelve atrás.')
  const puntos = [madreLista, ...nuevas].map((u) => [Number(u.lat), Number(u.lng)]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
  return { unidades: [...resultado, ...nuevas], nuevas, vinculadas: vincular, madre: madreLista, nuevaMadre, puntos, aviso: partes.join(' ') }
}

// Dónde va mi unidad si no está en la carta: donde mira la carta (si está cerca), el Área de Operaciones, las
// fichas propias o, por último, el centro de la carta.
function centroDe(lista) {
  const p = (lista || []).map((x) => (Array.isArray(x) ? { lat: Number(x[0]), lng: Number(x[1]) } : { lat: Number(x?.lat), lng: Number(x?.lng) })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng) && Math.abs(x.lat) <= 90 && Math.abs(x.lng) <= 180)
  if (!p.length) return null
  return { lat: p.reduce((s, x) => s + x.lat, 0) / p.length, lng: p.reduce((s, x) => s + x.lng, 0) / p.length }
}
export function dondeColocar(unidades = []) {
  const w = typeof window !== 'undefined' ? window : {}
  const m = w.__mapa2d
  try {
    if (m && m.getCenter && m.getZoom && m.getZoom() >= 8) {
      const c = m.getCenter()
      return { lat: c.lat, lng: c.lng }
    }
  } catch {}
  try {
    const f = w.SIDMesaEjercicio?.foto?.()
    const ao = centroDe(f?.aoPuntos)
    if (ao) return ao
  } catch {}
  const propias = centroDe((unidades || []).filter((u) => esPropia(u) && esFicha(u)))
  if (propias) return propias
  try {
    const c = (m && m.getCenter && m.getCenter()) || (w.__map3d && w.__map3d.getCenter && w.__map3d.getCenter())
    if (c) return { lat: c.lat, lng: c.lng }
  } catch {}
  return null
}
function mirarA(puntos = []) {
  try {
    const m = typeof window !== 'undefined' && window.__mapa2d
    if (!m || !puntos.length) return
    if (puntos.length === 1) m.setView(puntos[0], Math.max(m.getZoom ? m.getZoom() : 10, 10))
    else m.fitBounds(puntos, { padding: [70, 70], maxZoom: 12 })
  } catch {}
}

// ─── Lo que se ve (React del compilado: react = je) ──────────────────────────────────────────────────────────────

const CSS = `
.sid-mu-pulso{animation:sidMuPulso 1.6s ease-in-out infinite}
@keyframes sidMuPulso{0%,100%{box-shadow:0 0 0 0 rgba(255,212,71,.55)}50%{box-shadow:0 0 0 7px rgba(255,212,71,0)}}
.sid-mu-fondo{position:fixed;inset:0;z-index:2450;background:rgba(4,8,14,.62);display:flex;align-items:flex-start;justify-content:center;padding:4vh 8px;overflow:auto}
.sid-mu-tarjeta{width:min(780px,100%);box-sizing:border-box}
.sid-mu-fila{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:4px 0;border-bottom:1px solid #243246}
.sid-mu-fila input[type=text]{flex:1 1 170px;min-width:120px}
@media (max-width:560px){.sid-mu-fila select{flex:1 1 40%}}
.sid-mu-simb{transition:transform .08s ease,box-shadow .08s ease}
.sid-mu-simb:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 0 0 2px #ffd447}
.sid-mu-simb:active:not(:disabled){transform:scale(.95)}
.sid-mu-nueva{animation:sidMuNueva 1.4s ease-out}
@keyframes sidMuNueva{0%{background:rgba(255,212,71,.3)}100%{background:transparent}}
`
function ponerCss() {
  try {
    if (typeof document === 'undefined' || document.getElementById('sid-mi-unidad-css')) return
    const s = document.createElement('style')
    s.id = 'sid-mi-unidad-css'
    s.textContent = CSS
    document.head.appendChild(s)
  } catch {}
}

const st = {
  caja: { background: '#14202b', border: '2px solid #ffd447', borderRadius: 10, padding: '10px 12px', margin: '8px 0', fontSize: 13, color: '#e6edf6', lineHeight: 1.42 },
  tarjeta: { background: '#111a26', border: '2px solid #ffd447', borderRadius: 12, padding: '14px 16px', fontSize: 13.5, color: '#e6edf6', lineHeight: 1.45, boxShadow: '0 12px 40px rgba(0,0,0,.55)' },
  titulo: { fontWeight: 900, color: '#ffd447', fontSize: 15, letterSpacing: 0.3 },
  sub: { color: '#b9c7d8', fontSize: 12.5, marginTop: 3 },
  paso: { marginTop: 11, fontWeight: 800, color: '#9fd0ff', fontSize: 13 },
  oblig: { color: '#ff9d9d', fontWeight: 700, fontSize: 11.5 },
  opcional: { color: '#9fb0c8', fontWeight: 400, fontSize: 11.5 },
  botonera: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  chip: { background: '#1b2a3d', color: '#dbe9ff', border: '1px solid #3a5a80', borderRadius: 16, padding: '5px 11px', cursor: 'pointer', fontWeight: 700, fontSize: 12.5 },
  chipSi: { background: '#ffd447', color: '#1b1400', border: '1px solid #ffd447' },
  chipChico: { background: '#16283a', color: '#cfe6ff', border: '1px dashed #3a5a80', borderRadius: 14, padding: '3px 9px', cursor: 'pointer', fontSize: 12 },
  inp: { background: '#0c131d', color: '#eef3fa', border: '1px solid #3a4a63', borderRadius: 6, padding: '6px 8px', fontSize: 13 },
  inpAncho: { width: '100%', boxSizing: 'border-box', background: '#0c131d', color: '#eef3fa', border: '1px solid #3a4a63', borderRadius: 6, padding: '7px 9px', fontSize: 13.5, marginTop: 4 },
  sel: { background: '#0c131d', color: '#d8e6f7', border: '1px solid #3a4a63', borderRadius: 5, padding: '4px 3px', fontSize: 12 },
  nota: { fontSize: 12, color: '#9fb0c8', marginTop: 4 },
  ok: { color: '#8fe3a0', fontSize: 12, whiteSpace: 'nowrap', fontWeight: 700 },
  quitar: { background: 'transparent', color: '#ff9b9b', border: '1px solid #6a3a3a', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 12 },
  btnLinea: { background: '#22344d', color: '#dbe9ff', border: '1px solid #3a5a80', borderRadius: 6, padding: '6px 9px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  guardar: { flex: '1 1 200px', background: '#2f6df0', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 10px', cursor: 'pointer', fontWeight: 800, fontSize: 13.5 },
  colocar: { flex: '1 1 260px', background: '#0e8a52', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 10px', cursor: 'pointer', fontWeight: 900, fontSize: 14 },
  despues: { background: 'transparent', color: '#b9c7d8', border: '1px solid #3a4a63', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 12.5 },
  error: { color: '#ffb3b3', background: '#3a1717', border: '1px solid #7a3434', borderRadius: 6, padding: '6px 9px', marginTop: 8, fontSize: 12.5 },
  bien: { color: '#c9f5d4', background: '#123322', border: '1px solid #2f7a4d', borderRadius: 6, padding: '6px 9px', marginTop: 8, fontSize: 12.5 },
  area: { width: '100%', boxSizing: 'border-box', minHeight: 90, background: '#0c131d', color: '#eef3fa', border: '1px solid #3a4a63', borderRadius: 6, padding: 6, fontSize: 12.5, marginTop: 4 },
  resumen: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 10px', marginTop: 6, fontSize: 13 },
  et: { color: '#9fb0c8' },
  paleta: { marginTop: 8, padding: '8px 9px 9px', border: '1px dashed #4f7fb8', borderRadius: 9, background: '#0e1a2a' },
  paletaTit: { fontWeight: 800, color: '#ffd447', fontSize: 12.5 },
  tabSi: { background: '#ffd447', color: '#1b1400', border: '1px solid #ffd447', fontWeight: 800 },
  grilla: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  simbBtn: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 74, padding: '5px 2px 4px', background: '#f3f7fd', border: '1px solid #9db8dc', borderRadius: 8, cursor: 'pointer', color: '#0f2a4d', fontSize: 11, fontWeight: 800, lineHeight: 1.1 },
  simbFila: { display: 'inline-flex', background: '#f3f7fd', borderRadius: 5, padding: '1px 3px', flex: '0 0 auto' },
  inpFalta: { border: '2px solid #ff9d47', background: '#1d1408' },
  falta: { color: '#ffb36b', fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap' },
  arbol: { marginTop: 7, padding: '6px 8px', border: '1px solid #2c4262', borderRadius: 8, background: '#0f1824' },
  arbolFila: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 5 },
  arbolBtn: { background: 'transparent', border: 'none', color: '#9fd0ff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', textAlign: 'left', padding: 0, width: '100%', lineHeight: 1.4 },
}

const ESCALONES_MU = [...ESCALONES_FILA, ['cuerpo', 'CE']]

const sinTexto = (arma, antes) => (arma !== 'ninguna' ? '' : antes || '')

function Formulario({ react: R, puente, modo, onListo, onCerrar }) {
  const h = R.createElement
  const [cfg, setCfg] = R.useState(() => configInicial(puente))
  const [editada, setEditada] = R.useState(false)
  const [pegar, setPegar] = R.useState(null)
  const [otraAdy, setOtraAdy] = R.useState('')
  const [error, setError] = R.useState('')
  const [escPal, setEscPal] = R.useState(null)
  const [foco, setFoco] = R.useState(null)
  const [verArbol, setVerArbol] = R.useState(false)
  const unidades = puente.unidades || []
  const bloqueado = !!puente.finalizado
  const cat = delCatalogo(cfg.unidad)
  const madre = buscarMia(unidades, cfg.unidad)
  const filas = cfg.dependientes || []
  const estado = filas.map((f) => (limpio(f.designacion) && !incompleta(f) ? enLaCarta(unidades, madre, f) : null))
  const porColocar = filas.filter((f, i) => f.va !== false && limpio(f.designacion) && !incompleta(f) && !estado[i])
  // El renglón recién sumado: foco en su nombre con el cursor al final, para escribir solo el número.
  R.useEffect(() => {
    if (!foco || typeof document === 'undefined') return
    try {
      const el = document.querySelector(`[data-mu-fila="${String(foco.id).replace(/["\\]/g, '')}"]`)
      if (!el) return
      el.focus({ preventScroll: true })
      const n = String(el.value || '').length
      el.setSelectionRange(n, n)
      el.scrollIntoView({ block: 'nearest' })
    } catch {}
  }, [foco])
  // Suma un renglón (al final, o debajo de otro) y lo deja listo para escribir.
  const sumarFila = (fila, despuesDe = null) => {
    if (bloqueado) return
    const nueva = conId(fila)
    setEditada(true)
    setError('')
    setCfg((c) => {
      const l = [...(c.dependientes || [])]
      const i = despuesDe != null ? l.findIndex((x) => x.id === despuesDe) : -1
      if (i >= 0) l.splice(i + 1, 0, nueva)
      else l.push(nueva)
      return { ...c, dependientes: l }
    })
    setFoco({ id: nueva.id, n: Date.now() })
  }
  const sumarDelTemaBase = (c) =>
    sumarFila({
      designacion: c.nombre,
      escalon: c.nivel,
      arma: c.arma || (c.nivel === 'cuerpo' ? 'ninguna' : 'infanteria'),
      ...(c.nivel === 'cuerpo' ? { textoSimbolo: 'CE' } : c.textoSimbolo ? { textoSimbolo: c.textoSimbolo } : {}),
      ...(numeroDe(c.nombre) ? { numeroUnidad: numeroDe(c.nombre) } : {}),
      ...(c.reducida ? { reducida: true } : {}),
    })
  const tab = escPal && escPal.nivel === cfg.nivel ? escPal.v : escalonDebajo(cfg.nivel)
  const temaBase = (cfg.nivel === 'ejercito' ? CATALOGO.filter((c) => c.nivel === 'cuerpo') : cfg.nivel === 'cuerpo' ? CATALOGO.filter((c) => c.nivel === 'division') : []).filter((c) => !igual(c.nombre, cfg.unidad))
  const superiores = superioresDe(cfg.nivel)
  const cambiar = (campos) => {
    setCfg((c) => ({ ...c, ...campos }))
    setError('')
  }
  const cambiarFila = (id, campos) => {
    setEditada(true)
    cambiar({ dependientes: filas.map((f) => (f.id === id ? { ...f, ...campos } : f)) })
  }
  const elegirUnidad = (c) => {
    if (bloqueado) return
    const lista = (c.dependientes || []).map(conId)
    const cambiaLista = !editada || !filas.length || (typeof confirm === 'function' && confirm(`¿Cambiar la lista de «quiénes dependen de mí» por la de ${c.nombre} (${lista.length} unidades)?`))
    setCfg((x) => ({
      ...x,
      nivel: c.nivel,
      unidad: c.nombre,
      superior: !limpio(x.superior) || CATALOGO.some((k) => igual(k.nombre, x.superior) || limpio(k.superior) === limpio(x.superior)) ? c.superior : x.superior,
      // las adyacentes son de MI nivel: al pasar de CE a División no quedan las del CE
      adyacentes: (x.adyacentes || []).filter((a) => !igual(a, c.nombre) && (!delCatalogo(a) || delCatalogo(a).nivel === c.nivel)),
      dependientes: cambiaLista ? lista : x.dependientes,
    }))
    if (cambiaLista) setEditada(false)
    setError('')
  }
  const escribirUnidad = (v) => {
    const c = delCatalogo(v)
    cambiar({ unidad: v, nivel: c ? c.nivel : nivelDeNombre(v, cfg.nivel), ...(c && !limpio(cfg.superior) ? { superior: c.superior } : {}) })
  }
  const agregarAdy = (v) => {
    const t = limpio(v)
    if (!t || (cfg.adyacentes || []).some((a) => igual(a, t))) return
    cambiar({ adyacentes: [...(cfg.adyacentes || []), t] })
  }
  const libres = CATALOGO.filter((c) => c.nivel === cfg.nivel && !igual(c.nombre, cfg.unidad) && !(cfg.adyacentes || []).some((a) => igual(a, c.nombre)))
  const hermanas = libres.filter((c) => limpio(cfg.superior) && igual(c.superior, cfg.superior))
  const sugerencias = hermanas.length ? hermanas : libres
  const validar = () => {
    const f = faltantes(cfg)
    // Las que quedaron solo con la sigla de la paleta («RI-»): falta su número.
    const sinNumero = filas.filter((x) => x.va !== false && incompleta(x))
    if (f.length || sinNumero.length) {
      setError(
        [
          f.length ? `Falta completar: ${f.join(', ')}.` : '',
          sinNumero.length ? `Falta el número de: ${sinNumero.map((x) => limpio(x.designacion)).join(', ')} (escribilo o sacala con ✕).` : '',
        ].filter(Boolean).join(' '),
      )
      if (sinNumero.length) setFoco({ id: sinNumero[0].id, n: Date.now() })
      return null
    }
    return paraGuardar(cfg)
  }
  const guardar = (yColocar) => {
    if (bloqueado) return
    const listo = validar()
    if (!listo) return
    try {
      puente.guardar?.(listo)
    } catch (e) {
      setError('No se pudo guardar: ' + ((e && e.message) || e))
      return
    }
    if (yColocar) {
      const centro = buscarMia(unidades, listo.unidad) ? null : dondeColocar(unidades)
      let r = null
      try {
        r = puente.colocar?.((us) => colocarMisUnidades(us, listo, { centro }))
      } catch (e) {
        setError('No se pudieron colocar: ' + ((e && e.message) || e))
        return
      }
      if (r && r.puntos) mirarA(r.puntos)
      if (r && !r.unidades && r.aviso && !r.nada) {
        setError(r.aviso)
        return
      }
    } else puente.aviso?.(`✓ Configuración guardada: ${listo.unidad} · depende de ${listo.superior}${listo.puesto ? ' · ' + (NOMBRE_PUESTO[listo.puesto] || listo.puesto) : ''}.`)
    onListo?.(listo)
  }

  const boton = (txt, activo, onClick, extra = {}) => h('button', { type: 'button', style: { ...st.chip, ...(activo ? st.chipSi : {}) }, onClick, disabled: bloqueado, ...extra }, txt)
  const chipArbol = (c) =>
    c ? h('button', { key: 'arb' + c.nombre, type: 'button', style: { ...st.chipChico, ...(igual(c.nombre, cfg.unidad) ? st.tabSi : {}) }, disabled: bloqueado, 'data-arbol': c.nombre, title: c.fuente || c.nombre, onClick: () => elegirUnidad(c) }, c.nombre + (c.reducida ? ' (-)' : '')) : null
  const quick = CATALOGO.filter((c) => c.nivel === cfg.nivel)
  const nivelOtro = cfg.nivel && !NIVELES.some(([v]) => v === cfg.nivel)

  const filaDep = (f, i) => {
    const ya = estado[i]
    const falta = incompleta(f)
    return h(
      'div',
      { className: 'sid-mu-fila' + (foco && foco.id === f.id ? ' sid-mu-nueva' : ''), key: f.id, 'data-sid': ya ? 'mu-puesta' : 'mu-falta' },
      h('input', { type: 'checkbox', checked: f.va !== false, disabled: bloqueado || !!ya, title: ya ? 'Ya está en la carta' : 'Entra en «⚡ Colocar»', onChange: (e) => cambiarFila(f.id, { va: e.target.checked }) }),
      h('span', { style: st.simbFila, title: 'Así sale en la carta', 'data-sid': 'mu-simbolo', dangerouslySetInnerHTML: { __html: simboloSVG(f, { ancho: 38 }) } }),
      h('input', {
        type: 'text', style: falta ? { ...st.inp, ...st.inpFalta } : st.inp, value: f.designacion || '', placeholder: 'Nombre (ej. RI-21)', disabled: bloqueado, 'data-mu-fila': f.id,
        title: falta ? 'Escribí el número (o el nombre). Enter: suma otra igual' : 'Enter: suma otra igual debajo',
        onChange: (e) => cambiarFila(f.id, { designacion: e.target.value }),
        onKeyDown: (e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (!falta && limpio(f.designacion)) sumarFila(otraIgual(f), f.id)
        },
      }),
      falta ? h('span', { style: st.falta }, '← el número') : null,
      h('select', { style: st.sel, value: f.escalon || 'batallon', title: 'Escalón', disabled: bloqueado, onChange: (e) => cambiarFila(f.id, { escalon: e.target.value }) }, ...ESCALONES_MU.map(([v, t]) => h('option', { key: v, value: v }, t))),
      h('select', { style: { ...st.sel, maxWidth: 170 }, value: f.arma || 'ninguna', title: 'Arma', disabled: bloqueado, onChange: (e) => cambiarFila(f.id, { arma: e.target.value, textoSimbolo: sinTexto(e.target.value, f.textoSimbolo) }) }, ...ARMAS.map(([v, t]) => h('option', { key: v, value: v }, t))),
      ya ? h('span', { style: st.ok, title: 'Ya está en la carta' }, '✓ en la carta') : null,
      h('button', { type: 'button', style: st.quitar, title: 'Sacarla de la lista', disabled: bloqueado, onClick: () => { setEditada(true); cambiar({ dependientes: filas.filter((x) => x.id !== f.id) }) } }, '✕'),
    )
  }

  const nColocar = porColocar.length + (madre ? 0 : 1)
  return h(
    'div',
    { 'data-sid': 'mi-unidad-form' },
    // ① nivel
    h('div', { style: st.paso }, '① ¿Qué nivel sos? ', h('span', { style: st.oblig }, 'obligatorio')),
    h(
      'div',
      { style: st.botonera },
      ...NIVELES.map(([v, t]) => boton(t, cfg.nivel === v, () => cambiar({ nivel: v }), { key: v, 'data-nivel': v })),
      h('select', { key: 'otro', style: { ...st.sel, padding: '5px 4px' }, value: nivelOtro ? cfg.nivel : '', disabled: bloqueado, onChange: (e) => e.target.value && cambiar({ nivel: e.target.value }) },
        h('option', { value: '' }, 'Otro nivel…'), ...OTROS_NIVELES.filter(([v]) => !NIVELES.some(([n]) => n === v)).map(([v, t]) => h('option', { key: v, value: v }, t))),
    ),
    // ② quién soy
    h('div', { style: st.paso }, '② ¿Quién soy? (mi unidad) ', h('span', { style: st.oblig }, 'obligatorio')),
    quick.length > 0 &&
      h('div', { style: st.botonera }, ...quick.map((c) => boton(c.nombre, igual(c.nombre, cfg.unidad), () => elegirUnidad(c), { key: c.nombre, 'data-unidad': c.nombre, title: c.fuente ? `Tema base «DIAMANTE» · ${c.fuente}` : 'Sin organigrama en los apéndices: armá sus unidades abajo' }))),
    h('input', { type: 'text', style: st.inpAncho, value: cfg.unidad || '', placeholder: quick.length ? 'o escribila: CE-III, DIV-7, BRIG. MEC.-3…' : 'Escribí tu unidad: CE-III, DIV-7, BRIG. MEC.-3…', disabled: bloqueado, 'data-sid': 'mu-unidad', onChange: (e) => escribirUnidad(e.target.value) }),
    cat && cat.fuente ? h('div', { style: st.nota }, `📚 Tema base «DIAMANTE» · ${cat.fuente}.`) : null,
    cat && !cat.dependientes.length ? h('div', { style: st.nota }, `Los documentos no traen las unidades del ${cat.nombre}: armalas en ⑤ tocando los símbolos de la paleta (o 📋 pegar lista).`) : null,
    // (un botón y no un <details>: el único <details> de la caja sigue siendo «Otras formas»)
    h(
      'div',
      { style: st.arbol, 'data-sid': 'mu-arbol' },
      h('button', { type: 'button', style: st.arbolBtn, 'aria-expanded': verArbol ? 'true' : 'false', 'data-sid': 'mu-arbol-ver', onClick: () => setVerArbol((v) => !v) },
        `${verArbol ? '▾' : '▸'} 🌳 Toda la organización del tema base «DIAMANTE» (FF.TT.T.O. · CE-I a CE-IV · divisiones): tocá tu unidad`),
      ...(verArbol
        ? [
            h('div', { key: 'fftt', style: st.arbolFila }, chipArbol(delCatalogo('FF.TT.T.O.')), h('span', { style: { ...st.nota, marginTop: 0 } }, `depende del CTO · ${DEMIL}`)),
            ...arbolTemaBase().map((g) =>
              h(
                'div',
                { key: 'g' + g.cabeza, style: { ...st.arbolFila, paddingLeft: g.cat ? 16 : 0 } },
                g.cat ? chipArbol(g.cat) : h('b', { style: { color: '#cfe0f5', fontSize: 12.5 } }, g.cabeza),
                h('span', { style: { color: '#6f86a3' } }, '→'),
                ...(g.hijas.length ? g.hijas.map(chipArbol) : [h('span', { key: 'vacio', style: { ...st.nota, marginTop: 0 } }, 'sin organigrama en los documentos: armalo con la paleta de ⑤')]),
              ),
            ),
          ]
        : []),
    ),
    // ③ superior
    h('div', { style: st.paso }, '③ Mi unidad superior (de quién dependo) ', h('span', { style: st.oblig }, 'obligatorio')),
    h('input', { type: 'text', style: st.inpAncho, value: cfg.superior || '', placeholder: 'Ej.: FF.TT.T.O. · CE-II', disabled: bloqueado, 'data-sid': 'mu-superior', onChange: (e) => cambiar({ superior: e.target.value }) }),
    superiores.length > 0 &&
      h('div', { style: st.botonera }, ...superiores.map((s) => h('button', { key: 'sup' + s, type: 'button', style: { ...st.chipChico, ...(igual(s, cfg.superior) ? st.tabSi : {}) }, disabled: bloqueado, 'data-superior': s, onClick: () => cambiar({ superior: s }) }, s))),
    // ④ adyacentes
    h('div', { style: st.paso }, '④ Mis unidades adyacentes ', h('span', { style: st.opcional }, '(las de mi mismo nivel a los costados; tocá para agregar)')),
    h(
      'div',
      { style: st.botonera },
      ...(cfg.adyacentes || []).map((a) => h('span', { key: 'a' + a, style: { ...st.chip, ...st.chipSi, cursor: 'default' } }, a, ' ', h('button', { type: 'button', style: { ...st.quitar, padding: '0 5px', marginLeft: 3, color: '#5a1a1a', borderColor: '#8a6a00' }, disabled: bloqueado, title: 'Quitar', onClick: () => cambiar({ adyacentes: cfg.adyacentes.filter((x) => x !== a) }) }, '✕'))),
      ...sugerencias.map((c) => h('button', { key: 's' + c.nombre, type: 'button', style: st.chipChico, disabled: bloqueado, onClick: () => agregarAdy(c.nombre) }, '+ ' + c.nombre)),
    ),
    h(
      'div',
      { style: { display: 'flex', gap: 6, marginTop: 5 } },
      h('input', { type: 'text', style: { ...st.inp, flex: 1, minWidth: 0 }, value: otraAdy, placeholder: 'Otra adyacente (ej. BRIG. MEC.-3) y Enter', disabled: bloqueado, onChange: (e) => setOtraAdy(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { agregarAdy(otraAdy); setOtraAdy('') } } }),
      h('button', { type: 'button', style: st.btnLinea, disabled: bloqueado || !limpio(otraAdy), onClick: () => { agregarAdy(otraAdy); setOtraAdy('') } }, '+ Agregar'),
    ),
    // ⑤ dependientes
    h('div', { style: st.paso }, `⑤ Quiénes dependen de mí (${filas.length}) `, h('span', { style: st.opcional }, '— sumalas tocando los símbolos de la paleta; cambiá nombre, escalón y arma; destildá las que no van; ✕ la saca')),
    madre
      ? h('div', { style: st.nota }, `✓ ${nombre(madre)} ya está en la carta. ${estado.filter(Boolean).length} de ${filas.length} dependientes ya están puestas.`)
      : limpio(cfg.unidad)
        ? h('div', { style: st.nota }, `${limpio(cfg.unidad).toUpperCase()} todavía no está en la carta: «⚡ Colocar» la pone donde estás mirando (o en tu Área de Operaciones) y sus unidades alrededor.`)
        : null,
    ...filas.map(filaDep),
    // 🎖️ La paleta: un toque = un renglón con su sigla; se escribe solo el número.
    h(
      'div',
      { style: st.paleta, 'data-sid': 'mu-paleta' },
      h('div', { style: st.paletaTit }, '🎖️ PALETA: tocá el símbolo y se suma a la lista; escribís solo el número ', h('span', { style: st.opcional }, '(Enter = otra igual)')),
      h('div', { style: { ...st.botonera, marginTop: 6 } }, ...ESCALONES_PALETA.map(([v, t]) => h('button', { key: v, type: 'button', style: { ...st.chipChico, ...(tab === v ? st.tabSi : {}) }, 'data-pal-esc': v, onClick: () => setEscPal({ v, nivel: cfg.nivel }) }, t))),
      h(
        'div',
        { style: st.grilla },
        ...deEscalon(tab).map((it) =>
          h(
            'button',
            { key: it.id, type: 'button', className: 'sid-mu-simb', style: { ...st.simbBtn, opacity: bloqueado ? 0.5 : 1 }, disabled: bloqueado, title: `${it.titulo}: tocá y se suma «${it.prefijo}…»`, 'data-paleta': it.prefijo, onClick: () => sumarFila(filaDePaleta(it)) },
            h('span', { dangerouslySetInnerHTML: { __html: simboloSVG(it, { ancho: 50 }) } }),
            h('span', null, it.rotulo),
          ),
        ),
      ),
      temaBase.length > 0 &&
        h(
          'div',
          { style: { marginTop: 8 } },
          h('div', { style: { ...st.nota, marginTop: 0 } }, `📚 ${cfg.nivel === 'ejercito' ? 'Los cuerpos' : 'Las divisiones'} del tema base «DIAMANTE»: tocá para sumarla con su nombre`),
          h(
            'div',
            { style: st.botonera },
            ...temaBase.map((c) => {
              const ya = filas.some((f) => igual(f.designacion, c.nombre))
              return h('button', { key: 'tb' + c.nombre, type: 'button', style: { ...st.chipChico, ...(ya ? { opacity: 0.5, cursor: 'default' } : {}) }, disabled: bloqueado || ya, title: ya ? 'Ya está en la lista' : c.fuente ? `${c.nombre} · ${c.fuente}` : c.nombre, 'data-tema-base': c.nombre, onClick: () => sumarDelTemaBase(c) }, (ya ? '✓ ' : '+ ') + c.nombre + (c.reducida ? ' (-)' : ''))
            }),
          ),
        ),
    ),
    h(
      'div',
      { style: { ...st.botonera, marginTop: 7 } },
      h('button', { type: 'button', style: st.btnLinea, disabled: bloqueado, onClick: () => sumarFila({ designacion: '', escalon: escalonDebajo(cfg.nivel), arma: 'infanteria' }) }, '➕ Agregar unidad'),
      h('button', { type: 'button', style: st.btnLinea, disabled: bloqueado, onClick: () => setPegar(pegar == null ? '' : null) }, '📋 Pegar lista'),
      cat && cat.dependientes.length > 0 && h('button', { type: 'button', style: st.btnLinea, disabled: bloqueado, title: 'Vuelve a la lista del apéndice (las que ya están en la carta siguen ahí)', onClick: () => { setEditada(false); cambiar({ dependientes: cat.dependientes.map(conId) }) } }, `↺ Las del apéndice (${cat.dependientes.length})`),
      cfg.nivel === 'cuerpo' && !(cat?.dependientes || []).some((d) => d.escalon !== 'division') && h('button', { type: 'button', style: st.btnLinea, disabled: bloqueado, title: 'Las tropas de Cuerpo de los apéndices 1 y 2, sin número: agregale tus divisiones y los números', onClick: () => { setEditada(true); cambiar({ dependientes: [...filas, ...tropasCE('').filter((t) => !filas.some((f) => igual(f.designacion, t.designacion))).map(conId)] }) } }, '↺ Tropas tipo de un CE (11)'),
    ),
    pegar != null &&
      h(
        'div',
        null,
        h('textarea', { style: st.area, value: pegar, placeholder: 'Una por renglón, como la escribís:\nDIV MEC 3\nDIV-7\nRGTO. ART. 110\nBAT. ING. 110\nCÍA. AV. EJ. 110', onChange: (e) => setPegar(e.target.value) }),
        h(
          'div',
          { style: st.botonera },
          h('button', { type: 'button', style: { ...st.btnLinea, flex: 1 }, disabled: !limpio(pegar), onClick: () => { const l = leerLista(pegar).filter((x) => !filas.some((f) => igual(f.designacion, x.designacion))).map(conId); setEditada(true); cambiar({ dependientes: [...filas, ...l] }); setPegar(null) } }, `✓ Agregar ${leerLista(pegar).length} a la lista`),
          h('button', { type: 'button', style: st.quitar, onClick: () => setPegar(null) }, 'Cancelar'),
        ),
      ),
    // ⑥ puesto
    h('div', { style: st.paso }, '⑥ Mi puesto en el Estado Mayor ', h('span', { style: st.opcional }, '(lo usan los documentos: quién los elabora)')),
    h('div', { style: st.botonera }, ...PUESTOS.map(([v, t]) => boton(t, cfg.puesto === v, () => cambiar({ puesto: cfg.puesto === v ? '' : v }), { key: v, 'data-puesto': v }))),
    error ? h('div', { style: st.error, role: 'alert' }, '⚠️ ' + error) : null,
    bloqueado ? h('div', { style: st.error }, '🔒 Ejercicio finalizado: duplicalo para editar.') : null,
    h(
      'div',
      { style: { ...st.botonera, marginTop: 12 } },
      h('button', { type: 'button', style: { ...st.colocar, opacity: bloqueado ? 0.5 : 1 }, disabled: bloqueado, 'data-sid': 'mu-colocar', onClick: () => guardar(true) },
        nColocar > 0 ? `⚡ Guardar y colocar ${madre ? '' : (limpio(cfg.unidad) || 'mi unidad').toUpperCase() + ' y '}${porColocar.length} unidad(es) en la carta` : '✓ Guardar (todas ya están en la carta)'),
      h('button', { type: 'button', style: { ...st.guardar, opacity: bloqueado ? 0.5 : 1 }, disabled: bloqueado, 'data-sid': 'mu-guardar', onClick: () => guardar(false) }, '💾 Guardar mi configuración'),
      modo === 'modal' && h('button', { type: 'button', style: st.despues, 'data-sid': 'mu-despues', onClick: () => onCerrar?.() }, 'Completar después'),
      modo === 'hoja' && onCerrar && h('button', { type: 'button', style: st.despues, onClick: () => onCerrar?.() }, 'Cancelar'),
    ),
    h('div', { style: st.nota }, 'Quedan alrededor de tu unidad, que pasa a ser su Puesto Comando: arrastralas a su lugar. Esta configuración la cambiás cuando quieras en la F2·P3 del G-3.'),
  )
}

function Resumen({ react: R, puente, onCambiar }) {
  const h = R.createElement
  const g = puente.ops?.configUnidad || {}
  const unidades = puente.unidades || []
  const madre = buscarMia(unidades, g.unidad)
  const filas = (g.dependientes || []).filter((f) => f.va !== false && limpio(f.designacion))
  const faltan = filas.filter((f) => !enLaCarta(unidades, madre, f))
  const [aviso, setAviso] = R.useState('')
  const colocar = () => {
    if (puente.finalizado) return
    const centro = madre ? null : dondeColocar(unidades)
    const r = puente.colocar?.((us) => colocarMisUnidades(us, g, { centro }))
    if (r && r.puntos) mirarA(r.puntos)
    setAviso(r && !r.unidades && r.aviso ? r.aviso : '')
  }
  const n = faltan.length + (madre ? 0 : 1)
  return h(
    'div',
    { 'data-sid': 'mi-unidad-resumen' },
    h(
      'div',
      { style: st.resumen },
      h('span', { style: st.et }, 'Soy'), h('b', null, `${g.unidad} · ${NOMBRE_NIVEL[g.nivel] || g.nivel || ''}`),
      h('span', { style: st.et }, 'Dependo de'), h('span', null, g.superior || '—'),
      h('span', { style: st.et }, 'Adyacentes'), h('span', null, (g.adyacentes || []).join(', ') || '—'),
      h('span', { style: st.et }, 'Mi puesto'), h('span', null, NOMBRE_PUESTO[puente.puesto || g.puesto] || '— (elegilo en ✏️ Cambiar)'),
      h('span', { style: st.et }, 'Dependen de mí'), h('span', null, `${filas.length} · ${filas.length - faltan.length} en la carta${faltan.length ? ` · faltan: ${faltan.map((f) => f.designacion).join(', ')}` : ''}`),
    ),
    !madre ? h('div', { style: st.nota }, `${g.unidad} todavía no está en la carta.`) : null,
    aviso ? h('div', { style: st.error }, aviso) : null,
    h(
      'div',
      { style: { ...st.botonera, marginTop: 9 } },
      n > 0 && h('button', { type: 'button', style: st.colocar, disabled: !!puente.finalizado, 'data-sid': 'mu-colocar-faltan', onClick: colocar }, `⚡ Colocar ${madre ? '' : g.unidad + ' y '}las ${faltan.length} que faltan`),
      h('button', { type: 'button', style: st.guardar, 'data-sid': 'mu-cambiar', onClick: onCambiar }, '✏️ Cambiar mi configuración'),
    ),
  )
}

function CajaInterna({ react: R, puente, otras }) {
  const h = R.createElement
  ponerCss()
  const lista = configurada(puente.ops)
  const [editando, setEditando] = R.useState(!lista)
  const ver = editando || !lista
  return h(
    'div',
    { style: st.caja, className: lista ? '' : 'sid-mu-pulso', 'data-sid': 'mi-unidad' },
    h('div', { style: st.titulo }, lista ? '🪖 MI UNIDAD Y SU CONTEXTO' : '🪖 ANTES DE SEGUIR: CONFIGURÁ TU UNIDAD Y COLOCÁ TUS UNIDADES'),
    !lista ? h('div', { style: st.sub }, 'Desde esta hoja en adelante trabajás con TUS unidades: decí quién sos, de quién dependés, tus adyacentes y quiénes dependen de vos; después «⚡ Guardar y colocar» las pone en la carta.') : null,
    ver
      ? h(Formulario, { react: R, puente, modo: 'hoja', onListo: () => setEditando(false), onCerrar: lista ? () => setEditando(false) : null })
      : h(Resumen, { react: R, puente, onCambiar: () => setEditando(true) }),
    otras ? h('details', { style: { marginTop: 10 } }, h('summary', { style: { cursor: 'pointer', color: '#9fd0ff', fontSize: 12.5 } }, 'Otras formas: ⊞ Disgregar desde la Orden · 🪖 a mano en Unidades'), otras) : null,
  )
}

function AvisoInterno({ react: R, puente }) {
  const h = R.createElement
  const [cerrado, setCerrado] = R.useState('')
  const ej = String(puente?.ejercicio || '')
  const hay = (puente?.unidades || []).some((u) => esPropia(u) && esFicha(u))
  if (!ej || cerrado === ej || puente.finalizado || configurada(puente.ops) || !hay) return null
  ponerCss()
  return h(
    'div',
    { className: 'sid-mu-fondo', 'data-sid': 'mi-unidad-aviso', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Mi unidad y su contexto' },
    h(
      'div',
      { className: 'sid-mu-tarjeta', style: st.tarjeta },
      h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 8 } },
        h('div', { style: { flex: 1 } },
          h('div', { style: st.titulo }, '🪖 MI UNIDAD Y SU CONTEXTO'),
          h('div', { style: st.sub }, `«${ej}» todavía no tiene la configuración de tu unidad. Completala una vez: la usan las hojas, los documentos (membrete, unidad superior) y la carta.`)),
        h('button', { type: 'button', style: st.quitar, title: 'Completar después', onClick: () => setCerrado(ej) }, '✕')),
      h(Formulario, { react: R, puente, modo: 'modal', onListo: () => setCerrado(ej), onCerrar: () => setCerrado(ej) }),
    ),
  )
}

// Si algo de esto falla, que no se caiga la Mesa: se ve lo de antes (o nada).
let Guarda = null
function guarda(R) {
  if (Guarda || !R || typeof R.Component !== 'function') return Guarda
  Guarda = class extends R.Component {
    constructor(p) {
      super(p)
      this.state = { error: null }
    }
    static getDerivedStateFromError(error) {
      return { error }
    }
    componentDidCatch(e) {
      try {
        console.warn('🪖 Mi unidad:', e)
      } catch {}
    }
    render() {
      return this.state.error ? this.props.fallback ?? null : this.props.children
    }
  }
  return Guarda
}

// En la F2·P3 del G-3 (en lugar del recuadro de antes, que queda plegado abajo).
export function MiUnidadCaja({ react: R, puente, otras = null }) {
  if (!R || !R.createElement || !puente) return otras
  const G = guarda(R)
  const hijo = R.createElement(CajaInterna, { react: R, puente, otras })
  return G ? R.createElement(G, { fallback: otras }, hijo) : hijo
}

// En la Mesa: la ventana que aparece al abrir un ejercicio sin configurar.
export function AvisoMiUnidad({ react: R, puente }) {
  if (!R || !R.createElement || !puente) return null
  const G = guarda(R)
  const hijo = R.createElement(AvisoInterno, { react: R, puente, key: String(puente.ejercicio || '') })
  return G ? R.createElement(G, { fallback: null }, hijo) : hijo
}
