// La ORDEN DE RECONOCIMIENTO (F2·P9) sin navegador: modelo, hoja de antes, siembra con
// el calco, pedido y respuesta de la IA, fusión con otros pedidos y el Word con el
// formato militar de la Mesa (comparado con el ejemplo de la Escuela, DIV.MEC.-2).
//
//   CODEX_PRIMARY_RUNTIME_NODE_MODULES=<node_modules con docx y jszip> node reconocimiento.cjs [carpeta de salida]
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { P6, MATRIZ_ANTES, CFG, respuestaIA } = require('./reconocimiento-ejemplo.js')

;(async () => {
  const m = await import('../reconocimiento/v1/modelo.js')
  const doc = await import('../reconocimiento/v1/documento.js')
  const ia = await import('../reconocimiento/v1/ia.js')
  const nm = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES

  // ── La matriz de antes: cada renglón es un equipo y no se pierde nada ──
  const antes = m.normalizarOrden(MATRIZ_ANTES)
  assert.equal(antes.esquema, 'reconocimiento-v1')
  assert.equal(antes.legado, true)
  assert.deepEqual(antes.equipos.map((e) => e.id), ['e-antes-1', 'e-antes-2', 'e-antes-3'])
  const e1 = antes.equipos[0]
  assert.deepEqual([e1.elementos, e1.area, e1.alcance, e1.noAntes, e1.noDespues, e1.informa], [['RCB-2 Tarapacá'], 'Línea de Seguridad y sectores de aproximación norte en el Área de Operaciones.', '30 km — Escuadrón de reconocimiento (del Regimiento)', 'D-13 (06:00)', 'D (01:00)', 'PC de la DIV.MEC.-1 — G-2'])
  assert.ok(e1.ia, 'lo que había escrito la IA queda para revisar')
  assert.ok(!JSON.stringify(antes).includes('[IA'), 'sin «[IA — verificar]»')
  assert.equal(m.normalizarOrden(MATRIZ_ANTES).equipos[1].id, antes.equipos[1].id, 'ids estables entre dibujos')
  assert.ok(m.tieneOrden(MATRIZ_ANTES) && m.tieneOrden(P6) && !m.tieneOrden({}) && !m.tieneOrden(m.ordenVacia()))

  // ── 🌱 Siembra con el calco: no pisa, agrega lo que falta ──
  const semilla = (id) => (id === 'ivr' ? [{ 'Órgano de reconocimiento': 'RCB-2 Tarapacá', 'Alcance del medio': '30 km' }, { 'Órgano de reconocimiento': 'ERM-8', 'Alcance del medio': '20 km — exploración' }] : [])
  const arm = m.armarDesdeEjercicio(MATRIZ_ANTES, { ordenSup: { carta: 'Especial X, Esc. 1:250.000' }, g3: { prep2: { a: 'x' } } }, { semilla })
  assert.equal(arm.valor.equipos.length, 4, 'agrega sólo el órgano que no estaba')
  assert.deepEqual(arm.valor.equipos[3].elementos, ['ERM-8'])
  assert.equal(arm.valor.equipos[0].alcance, '30 km — Escuadrón de reconocimiento (del Regimiento)', 'no pisa el alcance escrito')
  assert.equal(arm.valor.carta, 'Especial X, Esc. 1:250.000')
  assert.equal(arm.valor.enemiga, 'Ver Orden Preparatoria No. 02 y Anexo de Inteligencia.')
  const arm2 = m.armarDesdeEjercicio({ ...P6 }, { ordenSup: { carta: 'otra' } }, { semilla })
  assert.equal(arm2.valor.carta, P6.carta, 'no pisa la carta')

  // ── Firma y distribución ──
  assert.equal(m.firmaDe({}, { unidad: 'DIV.MEC.-1' }), 'EL COMANDANTE DE LA DIV.MEC.-1')
  assert.equal(m.firmaDe({}, { unidad: 'RCB-2 TARAPACÁ' }), 'EL COMANDANTE DEL RCB-2 TARAPACÁ')
  assert.equal(m.firmaDe(P6, {}), 'EL COMANDANTE DE LA DIMEC-2')
  assert.equal(m.distribucionDe(P6, { unidad: 'DIV.MEC.-2' }), 'Original: DIV.MEC.-2\nCopia 1: SEC-III\nCopia 2-4: EQ. Z-T-V')

  // ── El pedido a la IA ──
  const conIdeas = { ...m.normalizarOrden(MATRIZ_ANTES), ideas: 'Tres equipos y que informen cada 2 horas.' }
  const ped = ia.pedidoOrden(conIdeas, { expediente: '## EXPEDIENTE DE PRUEBA', ctx: { ordenSup: { unidad: 'DIV.MEC.-1', mision: 'La DIV.MEC.-1 defiende.' } }, hoja: { num: 'F2·P9' }, encabezado: 'Sos OFICIAL DE ESTADO MAYOR…', semilla })
  for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'ORDEN DE RECONOCIMIENTO', 'ORGANIZACIÓN DE LA TAREA', '## EXPEDIENTE DE PRUEBA', 'DIV.MEC.-1', 'ERM-8 — alcance 20 km — exploración', 'EL EJEMPLO DE LA ESCUELA', 'RC-02-107', '"e-antes-1"', 'Tres equipos y que informen cada 2 horas.', 'COMPLETAR LO QUE FALTA', '"comunicaciones"', 'VERIFICACIÓN FINAL'])
    assert.ok(ped.prompt.includes(t), `el pedido no trae «${t}»`)
  assert.ok(ia.pedidoOrden({}, { modo: 'completar_mejorar' }).prompt.includes('COMPLETAR **Y** MEJORAR'))

  // ── La respuesta: sólo completar no pisa; mejorar reescribe ──
  const base = m.normalizarOrden(MATRIZ_ANTES)
  base.propia = 'Lo escribió el oficial.'
  base.carta = 'Especial PUEBLO-X (FICT.), Esc. 1:250.000'
  base.equipos.push({ ...m.equipoVacio('e-calco'), elementos: ['ERM-8 «ECO» (FICT.)'] })
  const r = ia.aplicarRespuestaOrden('Acá va:\n```json\n' + JSON.stringify(respuestaIA()) + '\n```', base, { modo: 'completar' })
  assert.ok(r.ok, r.error)
  assert.equal(r.valor.propia, 'Lo escribió el oficial.')
  assert.equal(r.valor.carta, 'Especial PUEBLO-X (FICT.), Esc. 1:250.000')
  assert.deepEqual(r.valor.equipos.map((e) => e.nombre), ['ZULU', 'TANGO', '', 'VICTOR'])
  assert.deepEqual(r.valor.equipos[3].elementos, ['ERM-8 «ECO» (FICT.)'])
  assert.equal(r.valor.equipos[3].noAntes, 'D-6 (0600)')
  assert.deepEqual(r.valor.medios, ['Movimiento motorizado.', 'Movimiento a pie sobre las áreas críticas.'])
  assert.ok(r.valor.iaCampos.includes('mision') && !r.valor.iaCampos.includes('propia'))
  const otra = ia.aplicarRespuestaOrden(JSON.stringify(respuestaIA()), r.valor, { modo: 'completar' })
  assert.equal(otra.ok, false, 'nada más que completar')
  const mej = ia.aplicarRespuestaOrden(JSON.stringify(respuestaIA()), r.valor, { modo: 'completar_mejorar' })
  assert.ok(mej.ok)
  assert.equal(mej.valor.propia, respuestaIA().situacion.propia, 'mejorar reescribe')
  assert.deepEqual(mej.valor.equipos.map((e) => e.nombre), ['ZULU', 'TANGO', 'VICTOR'])
  assert.equal(ia.aplicarRespuestaOrden('no es json', base).ok, false)

  // ── Lo que traen otros pedidos a la IA para «ivr» se agrega (no reemplaza la orden) ──
  assert.equal(ia.fusionable('ivr', P6, [{ 'Órgano de reconocimiento': 'Dron (FICT.)' }]), true)
  assert.equal(ia.fusionable('otra', P6, []), false)
  const fu = ia.fusionarOrden(P6, [{ 'Órgano de reconocimiento': 'Dron (FICT.) [IA — verificar]', Tarea: 'Vigilar el vado [IA — verificar]' }], { pisar: false })
  assert.equal(fu.valor.equipos.length, 4)
  assert.equal(fu.valor.mision, P6.mision)
  assert.deepEqual(fu.valor.equipos[3].elementos, ['Dron (FICT.)'])

  // La función sP real de la Mesa (la que junta lo que traen los pedidos a la IA).
  let conAcorn = true
  try {
    require.resolve('acorn')
  } catch {
    conAcorn = false
  }
  if (conAcorn) {
    const { vigente } = require('./extraer')
    const { cargarConDependencias } = require('./extraer-con-dependencias')
    const riesgoIA = await import('../riesgo/v1/ia.js')
    const f = cargarConDependencias(vigente(), ['sP'], (c) => c.sP({ a: [], b: {} }, { a: [{ x: 'y' }], b: { c: 'd' } }), { SIDRiesgoFusionable: riesgoIA.fusionable, SIDRiesgoFusionar: riesgoIA.fusionarRiesgo, SIDRecoFusionable: ia.fusionable, SIDRecoFusionar: ia.fusionarOrden })
    const { hojas } = f.sP({ ivr: P6, tareas: [{ Tarea: 'x' }] }, { ivr: [{ 'Órgano de reconocimiento': 'Dron (FICT.)' }], tareas: [{ Tarea: 'y' }] })
    assert.equal(hojas.ivr.esquema, 'reconocimiento-v1', 'sigue siendo la orden')
    assert.equal(hojas.ivr.equipos.length, 4)
    assert.equal(hojas.ivr.mision, P6.mision)
    assert.equal(hojas.tareas.length, 2, 'las otras hojas, como siempre')
  }

  // ── El documento: la estructura del ejemplo de la Escuela ──
  const s = doc.especificacionOrden(P6, { ctx: { unidad: 'DIV.MEC.-2' } })
  assert.equal(s.estructuraPropia, true)
  assert.deepEqual(s.preliminares.map((o) => o.rotulo), ['OBJETO', 'CARTA', 'ANEXOS'])
  assert.deepEqual(s.organizacion.equipos, [
    { nombre: 'EQ. ZULU', elementos: ['SECC. AV 2', 'SECC. IM-2'] },
    { nombre: 'EQ. TANGO', elementos: ['OA. REAM-3', 'OA. RAAM-7', 'EQ. COMP. ING.-3'] },
    { nombre: 'EQ. VICTOR', elementos: ['ERM/8', 'ERM/9'] },
  ])
  const titulos = (ns) => ns.map((n) => [n.titulo, ...(n.hijos?.length && !n.hijos[0].item && !/^Equipo /.test(n.hijos[0].titulo) ? [titulos(n.hijos)] : [])])
  assert.deepEqual(titulos(s.secciones), [
    ['SITUACIÓN.', [['Enemiga.'], ['Propia.']]],
    ['MISIÓN.'],
    ['EJECUCIÓN.', [['Plan de Reconocimiento.', [['Objetivo general del reconocimiento.'], ['Método del reconocimiento.']]], ['Tareas para los equipos de reconocimiento.', [['Forma de llegar a la zona de reconocimiento.'], ['Tareas.'], ['Plazos en tiempo.']]], ['Instrucciones de coordinación.']]],
    ['APOYO DE SERVICIO.', [['Abastecimientos.'], ['Transporte.']]],
    ['COMANDO Y COMUNICACIONES.', [['Comando.'], ['Comunicaciones.']]],
  ])
  const vacia = doc.especificacionOrden({}, {})
  assert.ok(JSON.stringify(vacia.secciones).includes('[Pendiente de elaboración]'), 'lo vacío queda a la vista como pendiente')
  const html = doc.ordenHTML(P6)
  for (const t of ['ORGANIZACIÓN DE LA TAREA:', 'EQ. ZULU', 'I.-', 'III.-', 'c.-', 'Obtener información referente a:', 'EL COMANDANTE DE LA DIMEC-2']) assert.ok(html.includes(t), `HTML sin «${t}»`)

  // ── El Word, con el formato militar de la Mesa ──
  if (!nm) {
    console.log('OK (sin Word: falta CODEX_PRIMARY_RUNTIME_NODE_MODULES con docx y jszip).')
    return
  }
  const d = require(nm + '/docx')
  const Zip = require(nm + '/jszip')
  const w = await import('../formato-militar/v1/word.js')
  w.configurarWord(d)
  const buf = await d.Packer.toBuffer(w.crearWord(s, { ...CFG }))
  const zip = await Zip.loadAsync(buf)
  const xml = await zip.file('word/document.xml').async('string')
  const styles = await zip.file('word/styles.xml').async('string')
  const ps = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []
  const txt = (p) => (p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map((x) => x.replace(/<[^>]+>/g, '')).join('')
  const parrafos = ps.map(txt)
  const orden = ['CE-I', 'ORDEN DE RECONOCIMIENTO No. 01', 'OBJETO', 'CARTA', 'ANEXOS', 'ORGANIZACIÓN DE LA TAREA:', 'EQ. ZULU', 'SITUACIÓN.', 'Enemiga.', 'Propia.', 'MISIÓN.', 'EJECUCIÓN.', 'Plan de Reconocimiento.', 'Objetivo general del reconocimiento.', 'Método del reconocimiento.', 'Tareas para los equipos de reconocimiento.', 'Forma de llegar a la zona de reconocimiento.', 'Movimiento Motorizado.', 'Tareas.', 'Equipo ZULU.', 'Obtener información referente a:', 'Equipo TANGO.', 'Equipo VICTOR.', 'Plazos en tiempo.', 'Instrucciones de coordinación.', 'APOYO DE SERVICIO.', 'Abastecimientos.', 'Transporte.', 'COMANDO Y COMUNICACIONES.', 'Comando.', 'Comunicaciones.', 'EL COMANDANTE DE LA DIMEC-2', 'Autenticación:', 'Distribución:']
  let desde = 0
  for (const t of orden) {
    const i = parrafos.findIndex((x, j) => j >= desde && x.includes(t))
    assert.ok(i >= 0, `el Word no trae «${t}» en su lugar`)
    desde = i
  }
  const p = (t) => ps[parrafos.findIndex((x) => x === t || x.includes(t))]
  // Párrafos numerados con la numeración de la Mesa (I.- A.- 1.- a.-), incisos sin negrilla.
  assert.ok(p('SITUACIÓN.').includes('w:val="MilitarTitulo1"') && p('SITUACIÓN.').includes('<w:numPr>'))
  assert.ok(p('Equipo ZULU.').includes('w:val="MilitarTitulo4"') && p('Equipo ZULU.').includes('<w:ilvl w:val="3"/>'))
  assert.ok(p('Movimiento Motorizado.').includes('w:val="MilitarInciso4"') && p('Movimiento Motorizado.').includes('<w:ilvl w:val="3"/>'))
  assert.ok(p('En caso de ataque dar parte inmediatamente al PC.').includes('w:val="MilitarInciso3"') && p('En caso de ataque dar parte inmediatamente al PC.').includes('<w:ilvl w:val="2"/>'))
  assert.ok(!/<w:b\/>/.test(styles.match(/<w:style[^>]*w:styleId="MilitarInciso3"[\s\S]*?<\/w:style>/)[0]), 'inciso sin negrilla')
  // Las informaciones a obtener, con guion y sangría francesa debajo del equipo.
  const g = p('Unidades de Apoyo de fuegos.')
  assert.ok(txt(g).startsWith('-\t') && g.includes('w:left="2835"') && g.includes('w:hanging="283"'))
  // El cuadro de organización: bordes, títulos en negrilla Arial 10 y un elemento por renglón.
  const tablas = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g)
  const cuadro = tablas.find((t) => t.includes('EQ. ZULU'))
  assert.ok(cuadro.includes('w:val="single"'), 'cuadro con bordes')
  assert.equal((cuadro.match(/<w:gridCol /g) || []).length, 3)
  assert.ok(/<w:b\/>[\s\S]*?<w:sz w:val="20"\/>[\s\S]*?EQ\. ZULU/.test(cuadro))
  assert.ok(cuadro.includes('-\tEQ. COMP. ING.-3'))
  assert.ok(!xml.includes('[IA'), 'sin marcas de la IA')
  assert.ok(!xml.includes('EL G-3 DE LA UNIDAD'))
  // Membrete y pie: SECRETO arriba y abajo, «PAGE - NUMPAGES».
  const pie = await zip.file('word/footer1.xml').async('string')
  assert.ok(pie.includes('SECRETO') && pie.includes('PAGE') && pie.includes('NUMPAGES'))
  assert.ok((await zip.file('word/header1.xml').async('string')).includes('SECRETO'))
  // Más de cuatro equipos: el cuadro se parte en filas de cuatro columnas.
  const seis = { ...P6, equipos: Array.from({ length: 6 }, (_, i) => ({ id: 'x' + i, nombre: m.FONETICO[i], elementos: ['E' + i] })) }
  const xml6 = await (await Zip.loadAsync(await d.Packer.toBuffer(w.crearWord(doc.especificacionOrden(seis), { ...CFG })))).file('word/document.xml').async('string')
  const cuadros6 = (xml6.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []).filter((t) => t.includes('EQ. ') && t.includes('w:val="single"'))
  assert.deepEqual(cuadros6.map((t) => (t.match(/<w:gridCol /g) || []).length), [4, 2])
  if (process.argv[2]) {
    fs.mkdirSync(process.argv[2], { recursive: true })
    fs.writeFileSync(path.join(process.argv[2], 'orden-reconocimiento-p6.docx'), buf)
    fs.writeFileSync(path.join(process.argv[2], 'orden-reconocimiento-matriz-antes.docx'), await d.Packer.toBuffer(w.crearWord(doc.especificacionOrden(MATRIZ_ANTES, { ctx: { unidad: 'DIV.MEC.-1' } }), { ...CFG, unidad: 'DIV.MEC.-1' })))
  }
  console.log('OK: matriz de antes leída sin perder nada, siembra sin pisar, firma y distribución, pedido con ideas y ejemplo, respuesta (completar / mejorar), fusión con otros pedidos, estructura del ejemplo de la Escuela y Word con el formato militar.')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
