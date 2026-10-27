// 📋 La Guía Inicial del Comandante (F1·P6) con la forma del PMTD 2017 — guia-inicial/v1/guia.mjs y el compilado
// vigente (index-guia-inicial-20261027.js), con sus funciones REALES (la Línea de Tiempo MS, 🌱 l3e, el Word f3e):
//   · la hoja del Comandante y la del G-3 son la MISMA (siete apartados, compartida), con la ayuda del PMTD;
//   · 🌱 llena los siete apartados con lo del ejercicio y no pisa lo escrito; la clase de planeamiento sale del
//     tiempo (deliberado / en tiempo restringido); los renglones de la tabla vieja pasan a TAREAS ADICIONALES;
//   · el Word: el tiempo en el orden del modelo, las tareas letradas, sólo al Estado Mayor y sin autenticación;
//   · el formato militar (word.js) imprime la distribución sin el bloque de autenticación cuando se pide.
//   node guia-inicial.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const DIR = path.dirname(fileURLToPath(import.meta.url))
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { ejercicioDivmec } = require('./conceptos-divmec.js')
const G = await import('../guia-inicial/v1/guia.mjs')
const VIG = vigente()
const SRC = fs.readFileSync(VIG, 'utf8')

const LT_CE = { recepcion: 'D-44 (0900)', inicioOperacion: 'D (0400)', finOperaciones: 'D+15 (1800)', inicioMovimientos: 'D-10 (0600)' }
const LT_CORTA = { recepcion: 'D-1 (1200)', inicioOperacion: 'D (0600)', finOperaciones: 'D+1 (1800)' }
const C = cargarConDependencias(VIG, ['MS', 'Lm', 'js', 'l3e', 'f3e', 'PLe', 'ev', 'Qoe'], (c) => {
  c.MS(LT_CE)
  c.js({ arma: 'x' })
  c.Lm({ arma: 'x' })
  c.l3e('guiaInicial', { g3: { lineaTiempo: LT_CE } })
  c.f3e('guiaInicial', {}, {}, { lineaTiempo: LT_CE })
})

// El ejercicio: la DIVMEC-1 (FICT.) con su organización de la tarea (una unidad BAJO CONTROL), una adyacente, la
// Línea de Tiempo como la del Word de Sergio y un renglón de la F1·P6 de antes (la tabla).
function ejercicio(lineaTiempo = LT_CE) {
  const e = ejercicioDivmec()
  e.ordenSup.unidad = 'DIVMEC-1'
  e.ordenSup.clasificacion = 'SECRETO'
  e.ordenSup.coordinacion = 'Las unidades ocuparán la NZR. PUEBLO-Z (FICT.) no más tarde del D-5 (1800). Los reconocimientos en el terreno se harán con elementos menores a una sección.'
  e.g3 = { lineaTiempo, alerta: { 'VI.- LUGAR, FECHA Y HORA DE REUNIÓN': 'Sala de Operaciones del PC. VIACHA (FICT.), D-44 (1000).' } }
  e.cmte = { guiaInicial: [{ 'Área / Sección': 'G-4', 'Guía impartida': 'Prever el combustible para el movimiento (FICT.)', 'Para cuándo': 'D-40' }] }
  return e
}
const semilla = (e) => C.l3e('guiaInicial', { ...e, unidad: e.ordenSup.unidad })

let fallos = 0
const casos = []
const caso = (n, f) => casos.push([n, f])

caso('la F1·P6 del Comandante: los siete apartados del PMTD, compartida con el G-3 (ya no la tabla Área / Guía / Para cuándo)', () => {
  const h = C.PLe[0].hojas.find((x) => x.id === 'guiaInicial')
  assert.equal(h.num, 'F1·P6')
  assert.equal(h.tipo, 'campos')
  assert.equal(h.compartida, 'g3')
  assert.deepEqual(h.campos, ['I.- MÉTODO', 'II.- ASIGNACIÓN INICIAL DEL TIEMPO', 'III.- OFICIALES DE ENLACE', 'IV.- RECONOCIMIENTO INICIAL', 'V.- MOVIMIENTOS', 'VI.- TAREAS ADICIONALES', 'VII.- OTROS'])
  assert.ok(!h.cols, 'sin las columnas de la tabla vieja')
  assert.match(h.entrega, /SÓLO AL ESTADO MAYOR/)
  const g3 = C.ev[0].hojas.find((x) => x.id === 'guiaInicial')
  assert.equal(g3.num, 'F1·P6', 'el G-3 con la misma numeración que el Comandante')
  assert.deepEqual(g3.campos, h.campos)
  assert.equal(g3.autollena, 'guiaInicial')
  assert.match(g3.ayudaCampos['I.- MÉTODO'], /clase y la forma de planeamiento/)
  assert.ok(!/cursos de acción/i.test(g3.ayudaCampos['I.- MÉTODO']), 'el MÉTODO no es cuántos cursos de acción')
})

caso('📘 la guía (la del Tablero del G-3 y la del pedido a la IA): la del PMTD, sin «dos cursos de acción, uno ofensivo y uno defensivo»', () => {
  assert.equal(C.Qoe.guiaInicial, G.GUIA)
  assert.match(G.GUIA.como[0], /CLASE de planeamiento \(deliberado o en tiempo restringido\) y la FORMA \(paralela/)
  assert.match(G.GUIA.para, /SÓLO a su Estado Mayor/)
  assert.ok(G.GUIA.como.length >= 7)
  for (const t of ['t==="cmte"&&I.id==="guiaInicial"&&f.jsx(SIDGuiaAyuda', 'if(t==="cmte"&&I.id==="guiaInicial")return SIDEMPedido(t,I,cU(I,U(I),{expediente:q?.md||"",modo:H,seccion:x.seccion,ayuda:SIDGuiaGuia}))'])
    assert.ok(SRC.includes(t), `el compilado no trae «${t.slice(0, 60)}…»`)
})

caso('🌱 llena los siete apartados con lo del ejercicio (Línea de Tiempo, Orden, organización de la tarea)', () => {
  const s = semilla(ejercicio())
  for (const k of G.CAMPOS) assert.ok(String(s[k] || '').trim(), `vacío: ${k}`)
  const m = s['I.- MÉTODO']
  assert.match(m, /Disponemos de 43 días y 19 horas/)
  assert.match(m, /14 días, 14 horas y 20 min, hasta el D-30 \(2320\)/)
  assert.match(m, /planeamiento DELIBERADO/)
  assert.match(m, /forma PARALELA/)
  const t = s['II.- ASIGNACIÓN INICIAL DEL TIEMPO'].split('\n')
  assert.equal(t[0], 'La línea de tiempo inicial para la operación es la siguiente:')
  const orden = ['Tiempo total disponible de la DIVMEC-1: 59 días y 9 horas', 'Recepción de la Orden Superior: D-44 (0900)', 'Inicio de la Operación: D (0400)', 'Fin de las Operaciones: D+15 (1800)', 'Inicio de los movimientos: D-10 (0600)', 'Tiempo disponible (TD): 43 días y 19 horas', 'Tiempo para la ejecución (TE): 15 días y 14 horas', 'Tiempo para planear (1/3): 14 días, 14 horas y 20 min, hasta el D-30 (2320)', 'Tiempo para preparar (2/3): 29 días, 4 horas y 40 min, del D-30 (2320) al D (0400)', 'Tiempo disponible para las Unidades subordinadas: 29 días, 4 horas y 40 min']
  let i = 0
  for (const o of orden) {
    const j = t.findIndex((x) => x.startsWith(`- ${o}`))
    assert.ok(j > i, `fuera de orden o falta: «${o}»\n${t.join('\n')}`)
    i = j
  }
  const en = s['III.- OFICIALES DE ENLACE']
  assert.match(en, /Ante el I CUERPO DE EJÉRCITO/)
  assert.match(en, /unidad adyacente DIVMEC-2/)
  assert.match(en, /De la Comp\. Av\. Ejto\. «LIMA» \(BAJO CONTROL\)/)
  const re = s['IV.- RECONOCIMIENTO INICIAL']
  assert.match(re, /sólo está autorizado el reconocimiento en la carta/)
  assert.match(re, /A partir de la emisión de la Orden Preparatoria N° 1/)
  assert.match(re, /La Orden del escalón superior dispone: «Los reconocimientos en el terreno se harán con elementos menores a una sección\.»/)
  const mo = s['V.- MOVIMIENTOS']
  assert.match(mo, /Se prevé el movimiento de la Comp\. Av\. Ejto\. «LIMA» a partir del D-10 \(0600\)/)
  assert.match(mo, /NZR\. PUEBLO-Z \(FICT\.\)/)
  const ta = s['VI.- TAREAS ADICIONALES'].split('\n')
  assert.match(ta[0], /^El JEM\. elaborará el Programa General de Planeamiento.*no más tarde del D-38 \(0508\)\.$/)
  assert.match(ta[1], /^El G-3 enviará la Orden Preparatoria N° 1 a las unidades subordinadas \(RCB-1 «ALFA»/)
  assert.ok(ta.some((x) => x.startsWith('El G-2 iniciará de inmediato la Preparación de Inteligencia del Campo de Batalla')))
  assert.ok(ta.includes('G-4: Prever el combustible para el movimiento (FICT.) (para el D-40).'), 'el renglón de la tabla vieja pasa a TAREAS ADICIONALES')
  const ot = s['VII.- OTROS']
  assert.match(ot, /Sala de Operaciones del PC\. VIACHA \(FICT\.\)/)
  assert.match(ot, /clasificación SECRETO/)
  for (const v of Object.values(s)) assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(v), 'sin emojis en lo que va al Word')
})

caso('🌱 con poco tiempo: planeamiento EN TIEMPO RESTRINGIDO (menos de 48 h para el Estado Mayor)', () => {
  const s = semilla(ejercicio(LT_CORTA))
  assert.match(s['I.- MÉTODO'], /EN TIEMPO RESTRINGIDO y de forma PARALELA, sin que ello implique omitir alguna fase/)
  assert.ok(!/DELIBERADO/.test(s['I.- MÉTODO']))
})

caso('🌱 sin Línea de Tiempo: no inventa el MÉTODO ni el tiempo, y lo dice', () => {
  const s = semilla(ejercicio({}))
  assert.equal(s['I.- MÉTODO'], undefined)
  assert.equal(s['II.- ASIGNACIÓN INICIAL DEL TIEMPO'], undefined)
  const r = G.sembrarGuia({}, s, { lt: C.MS({}) })
  assert.match(r.falta[0], /Línea Inicial de Tiempo/)
})

caso('🌱 no pisa lo que ya escribió el Comandante (ni lo de la IA)', () => {
  const s = semilla(ejercicio())
  const r = G.sembrarGuia({ 'I.- MÉTODO': 'Lo mío (FICT.).', 'VII.- OTROS': '   ' }, s, { lt: C.MS(LT_CE) })
  assert.equal(r.valor['I.- MÉTODO'], 'Lo mío (FICT.).')
  assert.equal(r.n, 6)
  assert.ok(r.valor['VII.- OTROS'].includes('SECRETO'))
  assert.deepEqual(r.falta, [])
})

caso('📄 el Word (f3e): la forma del modelo, el tiempo en su orden, sólo al Estado Mayor y sin autenticación', () => {
  const v = semilla(ejercicio())
  v['VI.- TAREAS ADICIONALES'] += '\nA.- El G-5 (FICT.) relevará la población. [IA — verificar]'
  const w = C.f3e('guiaInicial', v, { unidad: 'CE-I', ordenSup: {} }, { lineaTiempo: LT_CE })
  assert.equal(w.titulo, 'GUÍA INICIAL DEL COMANDANTE')
  assert.deepEqual(w.secciones.map((x) => x.titulo), ['MÉTODO.', 'ASIGNACIÓN INICIAL DEL TIEMPO.', 'OFICIALES DE ENLACE.', 'RECONOCIMIENTO INICIAL.', 'MOVIMIENTOS.', 'TAREAS ADICIONALES.', 'OTROS.'])
  const t = w.secciones[1]
  assert.equal(t.texto, 'La línea de tiempo inicial para la operación es la siguiente:')
  assert.ok(t.vinetas[0].startsWith('Tiempo total disponible del CE-I: 59 días y 9 horas'), t.vinetas[0])
  assert.ok(t.vinetas.some((x) => x.startsWith('Tiempo para preparar (2/3)')))
  assert.ok(w.secciones[2].hijos.every((x) => x.item && x.titulo), 'los oficiales de enlace letrados A.-, B.-…')
  const ta = w.secciones[5].hijos.map((x) => x.titulo)
  assert.ok(ta.includes('El G-5 (FICT.) relevará la población.'), 'sin la letra que escribió la IA ni la marca')
  assert.equal(w.firma, 'EL COMANDANTE DEL CE-I')
  assert.equal(w.distribucion, 'Original : JEM.\nCopia 1-5 : G-1, G-2, G-3, G-4 y G-5\nCopia 6 : ARCHIVO')
  assert.ok(!/FF\.TT\.T\.O\.|UU\. DEP\./.test(w.distribucion))
  assert.equal(w.sinAutenticacion, true)
  assert.equal(w.estructuraPropia, true)
  assert.equal(w.sinNumero, true, 'el título sin «No. 01»')
  assert.equal(C.f3e('guiaInicial', v, { unidad: 'DIV.MEC.-1', firmaCmte: 'EL CMTE. (FICT.)' }, {}).firma, 'EL CMTE. (FICT.)')
  assert.equal(C.f3e('guiaInicial', v, { unidad: 'DIV.MEC.-1' }, {}).firma, 'EL COMANDANTE DE LA DIV.MEC.-1')
})

caso('📄 sin Línea de Tiempo, el Word usa lo escrito en la hoja (la introducción y los renglones con guion)', () => {
  const w = G.wordGuia({ 'II.- ASIGNACIÓN INICIAL DEL TIEMPO': 'La línea de tiempo inicial para la operación es la siguiente:\n- Recepción de la Orden Superior: D-3 (0800).\n- Inicio de la Operación: D (0500).' }, {}, { lt: { ok: false } })
  assert.equal(w.secciones[1].texto, 'La línea de tiempo inicial para la operación es la siguiente:')
  assert.deepEqual(w.secciones[1].vinetas, ['Recepción de la Orden Superior: D-3 (0800)', 'Inicio de la Operación: D (0500)'])
})

caso('el formato militar: «sinAutenticacion» deja sólo la distribución (word.js y su versión nueva)', () => {
  const word = fs.readFileSync(path.join(DIR, '..', 'formato-militar', 'v1', 'word.js'), 'utf8')
  assert.ok(word.includes('if(spec.sinAutenticacion)body.push(...dis);else body.push(tablaBloques(aut,dis,10.5*cm))'))
  const rt = fs.readFileSync(path.join(DIR, '..', 'formato-militar', 'v1', 'runtime.js'), 'utf8')
  assert.ok(rt.includes("from './word.js?v=guia20261027'"))
  assert.ok(SRC.includes('formato-militar/v1/runtime.js?v=guiainicial20261027'))
  // En el automático, la distribución de la hoja con estructura propia manda sobre la guardada antes.
  assert.ok(rt.includes("if(spec.estructuraPropia){if(spec.numero)cfg.numero=spec.numero;if(spec.distribucion)cfg.distribucion=spec.distribucion}if(spec.sinNumero)cfg.numero='';"))
})

caso('ningún gancho cae DENTRO de lo que insertaron las listas anteriores (salvo la versión del formato militar)', () => {
  const viejo = fs.readFileSync(path.join(DIR, '..', 'assets', 'index-guia-plan-20261027.js'), 'utf8')
  let n = 0
  const rotos = []
  for (const f of fs.readdirSync(DIR)) {
    let l = null
    if (/^reemplazos-.*\.js$/.test(f) && !['reemplazos-compilado.js', 'reemplazos-2026-10-27-guia-inicial.js'].includes(f)) l = require(path.join(DIR, f))
    else if (/^reemplazos-.*\.json$/.test(f)) l = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).reemplazos
    for (const r of l || []) {
      if (!r.nuevo || !viejo.includes(r.nuevo)) continue
      n++
      if (!SRC.includes(r.nuevo) && !/formato-militar\/v1\/runtime\.js\?v=|\.\.\/estado-mayor\/v\d\//.test(r.nuevo)) rotos.push(`${f}: ${r.nombre || r.nuevo.slice(0, 80)}`)
    }
  }
  assert.ok(n > 100, `se revisaron ${n}`)
  assert.deepEqual(rotos, [])
})

for (const [n, f] of casos) {
  try {
    f()
    console.log(`✓ ${n}`)
  } catch (e) {
    fallos++
    console.log(`✗ ${n}\n  ${String(e.message).split('\n').join('\n  ')}`)
  }
}
console.log(fallos ? `${fallos} FALLO(S)` : `OK — ${casos.length} casos`)
process.exit(fallos ? 1 : 0)
