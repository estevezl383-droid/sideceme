// 🚚 LA RUTA DEL G-4 (calcos/modalidad/ruta-g4.js) contra el compilado publicado y el ejercicio de
// prueba de logística (FICTICIO):
//   · los 22 pasos van en el orden de las 7 fases y cada uno recibe insumos que llegan ANTES o en su
//     misma fase (nunca algo que todavía no se entregó);
//   · cada hoja del G-4 que abre un paso existe en el compilado (número y nombre) y lo que se mira para
//     darlo por hecho es la clave de ESA hoja; las pestañas, los pasos del ▣ ASDI y los botones que se
//     iluminan existen;
//   · cada «Ver en la Mesa» de un insumo apunta a una hoja real de esa sección o a una herramienta;
//   · el estado del ejercicio de prueba (lo hecho, el paso que sigue, lo marcado a mano);
//   · el pedido al EM simulado: sólo lo que falta y hasta esa fase, con sus marcas, sin hacer el trabajo
//     del G-4; su respuesta pasada a documentos del ejercicio, que después cuentan como entregados.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const RAIZ = path.resolve(__dirname, '..')
const R = require('../modalidad/ruta-g4.js')
const CAT = require('../modalidad/catalogo.js')
const { ejercicioLogistica } = require('./logistica-ejemplo.js')
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
const compilado = (html.match(/assets\/(index-[\w-]+\.js)/) || [])[1]
const js = fs.readFileSync(path.join(RAIZ, 'assets', compilado), 'utf8')
assert.match(html, /modalidad\/ruta-g4\.js/)
assert.ok(html.indexOf('modalidad/ruta-g4.js') < html.indexOf('modalidad/modalidad.js'), 'la ruta se carga antes que el tablero')
new vm.Script(fs.readFileSync(path.join(RAIZ, 'modalidad/ruta-g4.js'), 'utf8'))

// ─── el orden ──────────────────────────────────────────────────────────────────────────
assert.equal(R.FASES.length, 7)
assert.equal(R.PASOS.length, 22)
const ids = new Set()
let faseAnt = 1
R.PASOS.forEach((p) => {
  assert.ok(!ids.has(p.id), `paso ${p.id} repetido`)
  ids.add(p.id)
  assert.ok(p.fase >= faseAnt && p.fase <= 7, `${p.id}: las fases van en orden`)
  faseAnt = p.fase
  assert.match(p.pmtd, new RegExp('^F' + p.fase + '·P'), `${p.id}: su paso del PMTD es de la fase ${p.fase}`)
  assert.ok(p.nom && p.porque && p.hace && p.entrega, `${p.id}: nombre, por qué, qué hace y qué entrega`)
  assert.ok(p.recibe.length, `${p.id}: recibe algo`)
  p.recibe.forEach((id) => {
    const I = R.insumo(id)
    assert.ok(I, `${p.id}: insumo ${id}`)
    assert.ok(I.fase <= p.fase, `${p.id} (fase ${p.fase}) no puede necesitar ${id}, que llega en la fase ${I.fase}`)
  })
  assert.ok(p.abrir && (p.abrir.h || p.abrir.tab), `${p.id}: dónde se hace`)
})
for (let f = 1; f <= 7; f++) assert.ok(R.PASOS.some((p) => p.fase === f), `la fase ${f} tiene pasos del G-4`)
R.INSUMOS.forEach((I) => {
  assert.ok(R.DE[I.de], `${I.id}: de quién`)
  assert.ok(I.nom && I.para && typeof I.hay === 'function', `${I.id}: nombre, para qué y cómo se sabe`)
  assert.ok(I.simulable === false ? I.quien : I.pide, `${I.id}: qué pide al EM simulado (o quién lo pone)`)
  assert.ok(R.PASOS.some((p) => p.recibe.includes(I.id)), `${I.id}: algún paso lo usa`)
})

// ─── contra el compilado ───────────────────────────────────────────────────────────────
function hojasDe(inicio, fin) {
  const i = js.indexOf(inicio)
  assert.ok(i > 0, `catálogo ${inicio} en el compilado`)
  const seg = js.slice(i, fin ? js.indexOf(fin, i + 1) : i + 60000)
  return [...seg.matchAll(/\{id:"(\w+)",num:"(F\d·P[\d-]+)",nom:[`"]([^`"]+)[`"]/g)].map((m) => ({ id: m[1], num: m[2], nom: m[3].replace('${e}', 'LOGÍSTICA') }))
}
const CATS = {
  cmte: hojasDe('PLe=[{id:1,nom:"Recibir la misión"', 'OLe=['),
  jem: hojasDe('OLe=[{id:1,nom:"Recibir la misión"', 'hse={'),
  g3: hojasDe('ev=[{id:1,nom:"Recibir la misión"', 'koe=['),
  g4: hojasDe('function SIDuN0(t){const e=t.de;return[{id:1', 'function uN('),
}
let hojas = 0
R.PASOS.filter((p) => p.abrir.tab === 'hojas').forEach((p) => {
  const h = CATS.g4.filter((x) => x.num === p.abrir.num && p.abrir.nom.test(x.nom))
  assert.equal(h.length, 1, `${p.id} → G-4 ${p.abrir.num}: ${h.length} hoja(s) (${CATS.g4.filter((x) => x.num === p.abrir.num).map((x) => x.nom).join(' | ') || 'ninguna con ese número'})`)
  // lo que se mira para darlo por hecho es la clave de esa hoja en hojasG.g4
  const clave = { aprecActiva: 'aprecActiva', tareas: 'tareas', limitaciones: 'limitaciones', hechos: 'hechos', rcic: 'rcic', aprecOrientacion: 'aprecOrientacion', potencia: 'potencia', decision: 'decision', riesgo: 'riesgo', anexo: 'anexo', matrizSinc: 'matrizSinc' }
  const ej = { hojasG: { g4: { [h[0].id]: { campos: { x: 'texto escrito por el oficial' } } } } }
  assert.ok(clave[h[0].id], `${p.id}: la hoja ${h[0].id} es del G-4`)
  assert.ok(p.hecho(ej).ok, `${p.id}: con la hoja ${h[0].id} escrita queda hecho`)
  assert.ok(!p.hecho({ hojasG: { g4: { [h[0].id]: { esquema: 'x', numero: '3', firma: 'G-4' } } } }).ok, `${p.id}: lo que pone la Mesa sola (esquema, número, firma) no cuenta`)
  hojas++
})
assert.equal(hojas, 11, 'las 11 hojas del G-4 están en la ruta')
for (const rot of ['▣ ASDI', '↔ Ejes', '🎬 Concepto', '🧮 Cálculos', '📋 Mis hojas']) assert.ok(js.includes(`"${rot}"`), `pestaña ${rot} del panel del G-4`)
assert.ok(js.includes('🚚 Apoyo Logístico — G-4'), 'el título del panel del G-4')
// los textos con que el tablero (modalidad.js · TAB_VISTA) sabe qué pestaña del G-4 está abierta
for (const t of ['Trazar el EPE — Eje Principal de Evacuación', 'Prioridad de apoyo (en orden)', 'todavía no creó fases del curso de acción', 'PEDIDO A FORMULAR', 'Días de la operación', ' hojas con contenido', 'Volver a mis hojas']) assert.ok(js.includes(t), `el panel del G-4 dice «${t}»`)
// el ▣ ASDI paso a paso no está en el compilado: lo arma calcos/logistica/v1/editor.js
const asdi = fs.readFileSync(path.join(RAIZ, 'logistica/v1/editor.js'), 'utf8')
assert.match(asdi, /'data-g4': 'paso-a-paso'/, 'el ▣ ASDI paso a paso (así se sabe que está abierto: TAB_VISTA.asdi)')
assert.match(asdi, /'data-paso': String\(n\)/, 'cada paso del ASDI con su data-paso')
assert.equal([...asdi.matchAll(/\{ n: (\d), titulo: /g)].map((m) => +m[1]).join(','), '1,2,3,4', 'los cuatro pasos del ASDI (desde el 18-10-2026, sin «Entender»)')
for (const p of R.PASOS) {
  if (p.abrir.boton) assert.ok(js.search(new RegExp(p.abrir.boton.source.replace(/^\^\\W\*/, ''), 'i')) > 0, `${p.id}: el botón ${p.abrir.boton} existe`)
  if (p.automatico) assert.ok(js.search(new RegExp(p.automatico.source, 'i')) > 0, `${p.id}: el botón que lo marca existe`)
  if (p.abrir.h) assert.ok(CAT.HERRAMIENTAS[p.abrir.h], `${p.id}: herramienta ${p.abrir.h}`)
  if (p.abrir.paso) assert.ok(p.abrir.paso >= 1 && p.abrir.paso <= 5, `${p.id}: paso ${p.abrir.paso} del ASDI`)
}
assert.deepEqual(R.PASOS.filter((p) => p.abrir.tab === 'asdi' && p.abrir.paso).map((p) => p.abrir.paso), [1, 2, 3, 4], 'los cuatro pasos del ASDI, en orden')
let veres = 0
R.INSUMOS.forEach((I) => {
  if (!I.ver) return
  veres++
  if (I.ver.h) return assert.ok(CAT.HERRAMIENTAS[I.ver.h], `${I.id}: herramienta ${I.ver.h}`)
  assert.ok(CAT.SECCIONES[I.ver.s], `${I.id}: sección ${I.ver.s}`)
  if (!I.ver.num) return
  const h = (CATS[I.ver.s] || []).filter((x) => x.num === I.ver.num && I.ver.nom.test(x.nom))
  assert.equal(h.length, 1, `${I.id} → ${I.ver.s} ${I.ver.num} ${I.ver.nom}: ${h.length} hoja(s)`)
})
// las hojas de las otras secciones que se miran para saber si ya entregaron, existen con esa clave
const claves = { cmte: ['guiaInicial', 'intencion', 'guiaPlanificacion', 'decisionCmte', 'guiaFinal'], jem: ['normasEval'], g3: ['tareas', 'mision', 'coa', 'concepto', 'orgTarea', 'organizacion', 'sincro', 'eventos', 'opord', 'guiaInicial'] }
for (const [s, ks] of Object.entries(claves)) ks.forEach((k) => assert.ok(CATS[s].some((h) => h.id === k), `${s}: la hoja «${k}» existe en el compilado`))
for (const k of ['cae', 'ht19', 'ht12', 'ht7']) assert.ok(js.includes(`{id:"${k}",`), `G-2: la hoja «${k}» existe`)

// ─── el estado del ejercicio de prueba ─────────────────────────────────────────────────
const ej = ejercicioLogistica({ conPropuestas: true })
let E = R.estado(ej, {})
assert.equal(E.total, 22)
assert.deepEqual(E.pasos.filter((x) => x.ok).map((x) => x.p.id), ['tareas', 'hechos', 'asdi-proponer', 'ejes-tentativos', 'ventajas'])
assert.equal(E.actual.p.id, 'leer-orden', 'la luz empieza en el primer paso sin hacer')
assert.equal(E.fase, 1)
assert.match(E.pasos.find((x) => x.p.id === 'asdi-proponer').det, /2 áreas propuestas/)
assert.match(E.pasos.find((x) => x.p.id === 'concepto').det, /2 de 3 fases/, 'el concepto dice cuántas fases faltan')
assert.equal(R.estado(ejercicioLogistica(), {}).pasos.find((x) => x.p.id === 'asdi-proponer').ok, false, 'sin áreas propuestas no está hecho')
E = R.estado(ej, { 'leer-orden': 1, 'aprec-activa': 1, 'asdi-entender': 1 })
assert.equal(E.actual.p.id, 'calculos', 'lo marcado a mano cuenta y la luz pasa al siguiente')
assert.equal(E.fase, 2)
const fase1 = E.porFase[0].insumos
assert.equal(fase1.find((i) => i.ins.id === 'orden').e.ok, true, 'la Orden está en «Mesa · Preparación»')
assert.equal(fase1.find((i) => i.ins.id === 'unidad').e.ok, true, 'la unidad y sus fichas')
assert.equal(fase1.find((i) => i.ins.id === 'anexoLogSup').e.ok, false, 'el Anexo de Logística del superior falta')
assert.equal(E.porFase[2].insumos.find((i) => i.ins.id === 'fases').e.ok, true, 'las fases del G-3')

// ─── 🤖 el Estado Mayor simulado ───────────────────────────────────────────────────────
const f2 = R.faltantes(2, ej).map((i) => i.id)
assert.deepEqual(f2, ['anexoLogSup', 'guiaInicial', 'picb', 'cae', 'recursosG5', 'tareasG3', 'misionReexp', 'intencion', 'normasEval'], 'lo que falta hasta la fase 2, en orden (los CAE salen de la PICB: fase 2)')
assert.equal(R.insumo('cae').fase, 2, 'los CAE del G-2 llegan en la fase 2 (último paso de la PICB), no en la 3')
R.INSUMOS.forEach((I) => assert.ok(I.corto, `${I.id}: su nombre corto para el 📣 Parte del EM`))
assert.ok(!R.faltantes(7, ej).some((i) => i.id === 'unidad' || i.id === 'orden' || i.id === 'fases'), 'ni lo que ya está ni lo que pone el profesor')
const ped = R.pedidoEM(2, ej, { contexto: '### Ejercicio\n- (contexto de prueba)' })
assert.match(ped, /^# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO/)
assert.match(ped, /ESTADO MAYOR SIMULADO\*\* de \*\*DIV\.MEC\.-1 \(FICT\.\)/)
assert.match(ped, /NO hagas el trabajo del G-4/)
assert.match(ped, /FASE 2 · Analizar la misión/)
for (const id of f2) assert.ok(ped.includes('=== ENTREGA: ' + id + ' ==='), `marca de ${id}`)
assert.ok(!/=== ENTREGA: (caps|decision|opord) ===/.test(ped), 'nada de fases a las que el alumno no llegó')
assert.ok(!/Las unidades en la carta/.test(ped), 'en la fase 2 el G-3 todavía no despliega nada')
assert.match(ped, /\(contexto de prueba\)/)
assert.equal(R.pedidoEM(1, { ...ej, documentos: [...ej.documentos, ...R.documentos([{ insumo: 'anexoLogSup', texto: 'a' }, { insumo: 'guiaInicial', texto: 'b' }], ej)] }, {}), '', 'sin nada que falte no hay pedido')

const resp = 'Acá va lo pedido:\n\n**=== ENTREGA: anexoLogSup ===**\nANEXO B (LOGÍSTICA) (FICT.)\nEl ARCE del CE en PUEBLO-Z.\n\n### === ENTREGA: picb ===\nCMOC: corredor C-1 (FICT.).\n\n=== ENTREGA: unidad ===\nno vale\n\n=== ENTREGA: inventado ===\nx\n\n=== ENTREGA: picb ===\nCMOC corregido: corredor C-2 (FICT.).\n'
const L = R.leerEntregas(resp)
assert.deepEqual(L.entregas.map((e) => e.insumo), ['anexoLogSup', 'picb'])
assert.match(L.entregas[1].texto, /C-2/, 'si repite una marca, vale la última')
assert.ok(!/ENTREGA/.test(L.entregas[0].texto), 'el cuerpo no arrastra la marca siguiente')
assert.deepEqual(L.desconocidos, ['unidad', 'inventado'])
const docs = R.documentos(L.entregas, ej)
assert.equal(docs[0].nombre, 'EM SIMULADO · F1 · Sup. · El Anexo de Logística (ASC) del escalón superior.md')
assert.equal(docs[0].categoria, 'orden', 'lo del escalón superior va como Orden')
assert.equal(docs[1].categoria, 'bases', 'lo de las secciones va con las Bases (la IA de las hojas no lo recorta primero)')
assert.deepEqual(docs[1].emSimulado, { insumo: 'picb', fase: 2, de: 'g2' })
assert.match(docs[1].texto, /^EM SIMULADO — ENTREGA DEL G-2 \(INTELIGENCIA\) AL G-4 · FASE 2/)
assert.match(docs[1].texto, /NO es la Orden del escalón superior/)
assert.match(docs[0].texto, /Hace las veces del documento del escalón superior/)
const ej2 = { ...ej, documentos: [...ej.documentos, ...docs] }
const E2 = R.estado(ej2, {})
const anexo = E2.porFase[0].insumos.find((i) => i.ins.id === 'anexoLogSup').e
assert.deepEqual([anexo.ok, anexo.de], [true, 'em'], 'lo entregado por el EM simulado cuenta')
assert.ok(!R.faltantes(2, ej2).some((i) => i.id === 'picb'))
// un anexo de logística real (del profesor) cuenta como de la Mesa
const ej3 = { ...ej, documentos: [{ nombre: 'ANEXO D (LOGÍSTICA) A LA OGO N° 3.docx', categoria: 'orden', texto: '...' }] }
assert.equal(R.estado(ej3, {}).porFase[0].insumos.find((i) => i.ins.id === 'anexoLogSup').e.de, 'mesa')
// ─── 🪖 el G-3 despliega las unidades del CAP 1 en la carta ─────────────────────────────
const ped3 = R.pedidoEM(3, ej, {})
assert.match(ped3, /## Las unidades en la carta \(lo hace el G-3\)[\s\S]*Al final de la entrega `orgTarea`/, 'el pedido de la fase 3 pide el bloque json al final de la organización de la tarea')
assert.match(ped3, /"designacion":"1ra\. DIV\.","bando":"propias"/)
assert.match(ped3, /=== ENTREGA: orgTarea ===\n[^\n]*\n\(y al final, el bloque ```json con las unidades desplegadas\)/)
assert.match(ped3, /y al final de `orgTarea` el bloque ```json/, 'y el recordatorio')
const resp3 = '=== ENTREGA: caps ===\nCAP 1 (FICT.)\n```json\n[{"designacion":"no va"}]\n```\n\n=== ENTREGA: orgTarea ===\nAgrupación ALFA (FICT.).\n```json\n{"fichas":[{"designacion":"RI-1 «ALFA» (FICT.)","arma":"infanteria","escalon":"regimiento","lat":-16.8,"lng":-68.45,"cap":1},{"designacion":"BAT. ING. 9 (FICT.)","arma":"ingenieria","escalon":"batallon","lat":"-16.9","lon":-68.35},{"designacion":"RCB-2 «BRAVO» (FICT.)","lat":-16.6,"lng":-68.1,"cap":2},{"designacion":"SIN LUGAR","lat":null,"lng":1}]}\n```\n\n=== ENTREGA: tareasG3 ===\nTareas (FICT.)\n```json\n{"fichas":[{"designacion":"X","lat":1,"lng":1}]}\n```\n'
const L3 = R.leerEntregas(resp3)
const og = L3.entregas.find((e) => e.insumo === 'orgTarea')
assert.deepEqual(og.unidades.map((u) => u.designacion), ['RI-1 «ALFA» (FICT.)', 'BAT. ING. 9 (FICT.)'], 'sólo las del CAP 1 con lugar válido (lat como texto vale, lon también)')
assert.equal(og.unidades[1].lng, -68.35)
assert.ok(!/```/.test(og.texto), 'el texto queda sin el bloque json')
assert.deepEqual(L3.entregas.find((e) => e.insumo === 'caps').unidades, [], 'un json sin lugar no despliega nada')
assert.ok(/```json/.test(L3.entregas.find((e) => e.insumo === 'tareasG3').texto), 'en las entregas que no despliegan, el texto queda como vino')
const d3 = R.documentos([og], ej)[0]
assert.match(d3.texto, /UNIDADES DESPLEGADAS EN LA CARTA POR EL G-3 \(CAP 1[^\n]*\n- RI-1 «ALFA» \(FICT\.\) \(infanteria, regimiento\): -16\.8, -68\.45\n- BAT\. ING\. 9/)
const dsp = R.desplegar([{ designacion: 'RI-1 «alfa» (fict)', lat: -16.8, lng: -68.45 }, { designacion: 'BAT. ING. 9 (FICT.)', lat: -16.9, lng: -68.35 }, { designacion: 'BAT. ING. 9 (FICT.)', lat: 0, lng: 0 }, { designacion: 'BRIG. BL. ROJA (FICT.)', bando: 'propias', lat: -16, lng: -68 }], ej.unidades)
assert.deepEqual(dsp.mover.map((x) => [x.id, x.lat, x.lng]), [['l-alfa', -16.8, -68.45]], 'la que ya está (misma designación, sin importar mayúsculas ni puntos) se MUEVE')
assert.deepEqual(dsp.nuevas.map((x) => x.designacion), ['BAT. ING. 9 (FICT.)', 'BRIG. BL. ROJA (FICT.)'], 'las demás son nuevas, sin repetir; una enemiga nunca se mueve')

// ─── 📣 el parte del Estado Mayor y ¿dónde entrás? ──────────────────────────────────────
const marcasF3 = { 'leer-orden': 1, 'aprec-activa': 1, 'asdi-entender': 1, calculos: 1, limitaciones: 1, rcic: 1, 'aprec-orientacion': 1 }
const E3 = R.estado(ej, marcasF3)
assert.equal(E3.actual.p.id, 'potencia', 'F3·P1')
const P3 = R.parteEM(ej, marcasF3)
assert.deepEqual(P3.map((s) => s.de), ['sup', 'cmte', 'jem', 'g1', 'g2', 'g3', 'g5'], 'todas las secciones, en orden')
const g2 = P3.find((s) => s.de === 'g2'), g3 = P3.find((s) => s.de === 'g3'), g1 = P3.find((s) => s.de === 'g1')
assert.deepEqual(g2.deben.map((x) => [x.ins.id, x.uso && x.uso.n]), [['picb', 10], ['cae', 10]], 'el G-2 te debe la PICB y los CAE, que usás ahora (paso 10)')
assert.deepEqual(g3.listos.map((x) => x.ins.id), ['fases'])
assert.ok(g3.deben.some((x) => x.ins.id === 'caps' && x.uso.n === 11), 'los CAP del G-3: paso 11')
assert.deepEqual(g3.luego.map((x) => x.ins.id), ['sincroG3', 'barreras', 'opord'])
assert.deepEqual(g1.luego.map((x) => x.ins.fase), [4], 'el G-1 te da las bajas en la fase 4')
// lo que el profesor ya escribió para la fase 3 (la hoja F3·P6 del G-3) no se anuncia en la fase 2: se revela al llegar
const ejCap = { ...ej, g3: { ...(ej.g3 || {}), coa: { campos: { enunciado: 'CAP 1: la DIV.MEC.-1 (FICT.) defiende…' } } } }
const P2 = R.parteEM(ejCap, { 'leer-orden': 1, 'aprec-activa': 1, 'asdi-entender': 1 }).find((s) => s.de === 'g3')
assert.ok(!P2.listos.some((x) => x.ins.id === 'caps'), 'en la fase 2 los CAP preparados no figuran como terminados')
assert.ok(P2.luego.some((x) => x.ins.id === 'caps' && x.e.ok), 'van a «más adelante», ya preparados')
assert.ok(R.parteEM(ejCap, marcasF3).find((s) => s.de === 'g3').listos.some((x) => x.ins.id === 'caps'), 'en la fase 3 se revelan: ✅ terminó')
const en = R.entrada(E3, ej)
assert.deepEqual(en.necesita.map((i) => i.ins.id), ['cae', 'picb'])
assert.deepEqual(en.despues.map((x) => [x.ins.id, x.uso.n]), [['caps', 11], ['orgTarea', 11]], 'en la F3·P1 los CAP todavía no hacen falta (las fases ya están: no se nombran)')
assert.equal(R.entrada(R.estado(ej, Object.fromEntries(R.PASOS.map((p) => [p.id, 1]))), ej), null, 'con la ruta terminada no hay paso de entrada')

// sin ejercicio: nada hecho, todo falta
assert.equal(R.estado(null, {}).hechos, 0)
assert.equal(R.tieneTexto({ esquema: 'aprec-log-v1', numero: '2', campos: { mision: '  ' } }), false)
assert.equal(R.tieneTexto({ campos: { mision: 'La DIV.MEC.-1 defiende' } }), true)

console.log(`ruta-g4.cjs OK — ${R.PASOS.length} pasos en ${R.FASES.length} fases, ${R.INSUMOS.length} insumos de las otras secciones (${veres} con «Ver en la Mesa»), ${hojas} hojas del G-4; EM simulado: pedido de ${ped.length.toLocaleString('es')} caracteres`)
