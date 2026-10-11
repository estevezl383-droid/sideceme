// 📜 La OGO completa con sus anexos (calcos/modalidad/ogo.js y ogo-modelos.js). Lo pidió Sergio
// (11-10-2026) con el .zip «MODELOS DE CONTENIDO DE DOCUMENTOS»: al terminar «Armar el ejercicio»
// tiene que salir la OGO completa con sus anexos, sin observaciones.
//   · los modelos: cada documento con su modelo de la Escuela (los de formato-militar/v1/catalogo.js),
//     su sección, su autenticador y sus apartados obligatorios;
//   · las letras (A Calco, B Inteligencia, C Apoyo de Fuegos como en los modelos; las demás seguidas)
//     y los títulos («ANEXO “B” (…) A LA ORDEN…», «AL PLAN…», el apéndice al anexo);
//   · los datos de «Mesa · Preparación» llenan lo vacío (sin pisar lo que escribió el profesor);
//   · el pedido de cada documento: el modelo, las reglas, cómo contestar, lo ya escrito, la
//     organización de la tarea, el contexto, el campo que se entrena (y ninguno con el PMTD);
//   · la revisión: con una OGO completa (fixtures/ogo-respuesta-ia.md) no hay faltas; con un anexo
//     incompleto (fixtures/ogo-anexo-icia-incompleto.md) encuentra el apartado que falta, el vacío,
//     las marcas sin llenar y la respuesta cortada; la Orden sin propósito, sin la unidad de los
//     alumnos o con «Hipótesis»; los datos del membrete y lo que falta dibujar;
//   · el Word: el MISMO formato militar de la Mesa (word.js) con la librería docx, con membrete,
//     título, OBJETO/CARTA/ANEXOS, el cuadro de la organización de la tarea, los párrafos y la firma;
//   · el .md va y vuelve igual; los documentos para el ejercicio no llevan «PARA EL PROFESOR».
//   node calcos/pruebas/ogo.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const O = require('../modalidad/ogo.js')
const CAT = require('../modalidad/catalogo.js')
const IA = require('../modalidad/ia-profesor.js')
const CARP = require('../modalidad/carpeta.js')

const RESP = fs.readFileSync(path.join(__dirname, 'fixtures', 'ogo-respuesta-ia.md'), 'utf8')
const ICIA = fs.readFileSync(path.join(__dirname, 'fixtures', 'ogo-anexo-icia-incompleto.md'), 'utf8')
const SALIDAS = path.join(__dirname, 'salidas-ogo')
fs.mkdirSync(SALIDAS, { recursive: true })

function docxModule() {
  for (const c of [process.env.DOCX_MODULE, process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES && process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/docx', 'docx', '/opt/node-tools/node_modules/docx', '/opt/node22/lib/node_modules/docx'].filter(Boolean)) {
    try { return require(c) } catch {}
  }
  return null
}

;(async () => {
  // ── Los modelos ──
  const { catalogo } = await import('../formato-militar/v1/catalogo.js')
  // los nombres de los archivos del .zip «MODELOS DE CONTENIDO DE DOCUMENTOS» (11-10-2026) y los del
  // paquete que ya usa el formato militar (formato-militar/v1/catalogo.js)
  const PAQUETE = ['modelo de orden de operaciones.md', 'modelo calco .md', 'anexo plan de inteligencia.md', 'modelo plan de apoyo de fuegos.md', 'modelo apedice de apoyo de fuegos .md', 'modelo plan deingenieria.md', 'modelo plan de apoyo de defensa ntiaerea.md', 'modelo plan de comunicaciones.md', 'modelo plan de logistica.md', 'modelo de plan de. personal.md', 'modelo plan de ac gm.md', 'modelo de plan de apoyo de servicio de combate.md', 'modelo plan de engaño.md']
  const delFormato = Object.values(catalogo).map((c) => c.fuente.replace(/\.docx$/, '.md').normalize('NFC'))
  const fuentes = new Set(delFormato.concat(PAQUETE))
  for (const f of delFormato) if (/^modelo (plan|de orden|calco|apedice)/.test(f) && !/movimiento|reconocimiento|tipo mision/.test(f)) assert.ok(PAQUETE.includes(f), `«${f}» del formato militar está entre los modelos de la OGO`)
  assert.equal(O.DOCS.length, 13)
  for (const d of O.DOCS) {
    assert.ok(d.modelo.length > 300, `${d.id}: modelo con su texto guía`)
    assert.ok(/I\.- SITUACIÓN|REFERENCIAS DEL CALCO/.test(d.modelo), `${d.id}: párrafos del modelo`)
    assert.ok(d.obligatorios.length >= 1 && d.preliminares[0] === 'OBJETO' && d.seccion && d.autentica, d.id)
    assert.ok(CAT.SECCIONES[d.sec], `${d.id}: sección ${d.sec}`)
    const base = d.fuente.split(' y ')[0].split(' · ')[0]
    assert.ok(fuentes.has(base), `${d.id}: «${base}» es un modelo del paquete de la Escuela`)
    for (const o of d.obligatorios.concat(d.enTexto || [], d.soloPlan || [])) new RegExp(o[1]) // compilan
  }
  assert.ok(O.DOCS.find((d) => d.id === 'ogo').modelo.includes('12.- Restricciones y definiciones'), 'las 12 instrucciones de coordinación del modelo')

  // ── Letras y títulos ──
  let est = O.vacio('FABBLE 1.1')
  assert.deepEqual(O.letras(est), { calco: 'A', icia: 'B', fuegos: 'C', ing: 'D', ada: 'E', com: 'F', log: 'G', per: 'H', acgm: 'I' })
  assert.equal(O.elegidos(est).length, 10, 'la Orden y 9 anexos por defecto (sin los opcionales)')
  est = O.conConfig(est, { seleccion: { ...est.config.seleccion, fuegosArt: true, engano: true, ada: false } })
  const L = O.letras(est)
  assert.equal(L.ada, undefined); assert.equal(L.com, 'E', 'sin ADA las letras siguen sin huecos'); assert.equal(L.engano, 'I'); assert.equal(L.fuegosArt, '1')
  assert.equal(O.titulo('icia', est), 'ANEXO “B” (Plan de Inteligencia / Inteligencia) A LA ORDEN DE OPERACIONES No. 01')
  assert.equal(O.titulo('fuegosArt', est), 'APÉNDICE “1” (Plan de Fuegos de Artillería) AL ANEXO “C” (Plan de Apoyo de Fuegos / Apoyo de Fuegos) A LA ORDEN DE OPERACIONES No. 01')
  assert.equal(O.titulo('icia', O.conConfig(est, { tipo: 'plan', numero: '03' })), 'ANEXO “B” (Plan de Inteligencia / Inteligencia) AL PLAN DE OPERACIONES No. 03')
  const Lm = O.letras(O.conConfig(est, { letras: { log: 'D' } }))
  assert.equal(Lm.log, 'D', 'la letra que pone el profesor manda'); assert.notEqual(Lm.ing, 'D', 'y no se repite')
  assert.equal(new Set(Object.values(O.letras(O.conConfig(est, { letras: { log: 'D', ing: 'D' } })))).size, 10, 'dos con la misma letra: una se corre (9 anexos y el apéndice)')
  assert.match(O.listaAnexos(est), /^Anexo “A” Calco de Operaciones\.\nAnexo “B” Plan de Inteligencia\./)
  assert.equal(O.listaAnexos(est, 'fuegos'), 'Apéndice “1” Plan de Fuegos de Artillería.')

  // ── Lo de «Mesa · Preparación» llena lo vacío, sin pisar ──
  const ej = {
    nombre: 'FABBLE 1.1',
    ordenSup: { numero: '01', escalonSuperior: 'FF.TT. «FICT»', unidad: 'C.E. 1', puestoMando: 'PATACAMAYA', vigencia: 'D-5 (0800)', carta: 'Bolivia 1:250.000', clave: 'SMM', mision: 'El C.E. 1 defiende…' },
    unidades: [{ id: 1, bando: 'propias', designacion: 'C.E. 1', arma: 'infanteria', escalon: 'cuerpo', lat: -17, lng: -68 }],
    ops: { limites: [], areaOps: null },
    orgTarea: [{ nombre: 'C.E. 1', operacion: 'od', piezas: [{ nom: 'D.I. 11' }, { nom: 'D.I. 12' }] }],
  }
  est = O.completarConfig(O.conConfig(O.vacio('FABBLE 1.1'), { lugar: 'SICA SICA' }), ej)
  assert.equal(est.config.unidad, 'FF.TT. «FICT»'); assert.equal(est.config.alumnos, 'C.E. 1'); assert.equal(est.config.numero, '01'); assert.equal(est.config.iniciales, 'SMM')
  assert.equal(est.config.lugar, 'SICA SICA', 'lo escrito por el profesor no se pisa')

  // ── El pedido de un documento ──
  const ctx = { escalon: CAT.ESCALONES[0], foco: IA.focoDe('g4'), ogo: est, ejercicio: ej, unidades: ej.unidades }
  const pOgo = O.pedido('ogo', ctx)
  assert.ok(pOgo.startsWith('# PEDIDO DE TRABAJO PARA LA IA'))
  assert.match(pOgo, /Documento 1 de 10:\*\* ORDEN DE OPERACIONES No\. 01/)
  assert.match(pOgo, /Expide:\*\* FF\.TT\. «FICT» · PC SICA SICA · D-5 \(0800\) · \*\*la reciben:\*\* C\.E\. 1/)
  assert.match(pOgo, /Es una ORDEN de operaciones: NO lleva «Hipótesis»/)
  assert.match(pOgo, /### El modelo de la Escuela \(modelo de orden de operaciones\.md\)\n```\n[\s\S]*1\.- Curso de acción más probable[\s\S]*12\.- Restricciones/)
  assert.match(pOgo, /ANEXOS: en su línea y debajo, uno por línea, EXACTAMENTE estos:\n    Anexo “A” Calco de Operaciones\./)
  assert.match(pOgo, /ORGANIZACIÓN DE LA TAREA: en su línea y debajo UNA LÍNEA POR AGRUPACIÓN/)
  assert.match(pOgo, /### La organización de la tarea armada en la Mesa[\s\S]*- C\.E\. 1 \[OD\]: D\.I\. 11; D\.I\. 12/)
  assert.match(pOgo, /NINGÚN apartado vacío/); assert.match(pOgo, /ADECUADAS a este ejercicio/); assert.match(pOgo, /## PARA EL PROFESOR/)
  assert.match(pOgo, /# CONTEXTO DEL EJERCICIO[\s\S]*Nombre: FABBLE 1\.1/)
  assert.match(pOgo, /Todavía nada: este es el primer documento/)
  assert.doesNotMatch(pOgo, /ESTE DOCUMENTO ES DEL CAMPO QUE SE ENTRENA/, 'la Orden no es del G-4')
  assert.match(O.pedido('log', ctx), /ESTE DOCUMENTO ES DEL CAMPO QUE SE ENTRENA \(G-4 · Logística\)[\s\S]*NO le resuelvas lo que tiene que producir él: la apreciación logística/)
  assert.doesNotMatch(O.pedido('log', { ...ctx, foco: IA.focoDe('pmtd') }), /CAMPO QUE SE ENTRENA \(/, 'con el PMTD completo ningún documento se marca')
  assert.match(O.pedido('icia', { ...ctx, foco: IA.focoDe('g2') }), /CAMPO QUE SE ENTRENA \(G-2[\s\S]*la PICB entera/)
  assert.match(O.pedido('icia', ctx), /Si la CARPETA DEL PROFESOR trae el CMOC \(paso 4\)/)
  assert.match(O.pedido('calco', ctx), /«REFERENCIAS DEL CALCO» en su línea/)
  assert.match(O.pedido('per', O.conConfig(est, { tipo: 'plan' }) && { ...ctx, ogo: O.conConfig(est, { tipo: 'plan' }) }), /Es un PLAN de operaciones: lleva «Hipótesis»/)
  // los anexos llevan lo ya escrito de la Orden (y el comienzo de los otros anexos)
  let conOgo = O.poner(est, 'ogo', RESP, '2026-10-11T12:00:00Z')
  conOgo = O.poner(conOgo, 'ing', 'OBJETO: Apoyo de ingeniería.\nI.- SITUACIÓN.\nEl texto del anexo de ingeniería.', '2026-10-11T12:05:00Z')
  const pIcia = O.pedido('icia', { ...ctx, ogo: conOgo })
  assert.match(pIcia, /#### ORDEN DE OPERACIONES No\. 01 \(el cuerpo de la Orden, ya escrito: MANDA\)[\s\S]*Las FF\.TT\. «FICT» defienden a partir del D \(0500\)/)
  assert.match(pIcia, /#### Anexo “D” — Plan de Ingeniería \(ya escrito; el comienzo\)/)
  assert.doesNotMatch(pIcia, /Supuestos: el orden de batalla del VI Ejército/, 'lo «PARA EL PROFESOR» de la Orden no entra')
  assert.match(pIcia, /ORDEN DE OPERACIONES No\. 01 \(✓ escrito\)/)
  // la carpeta y la biblioteca entran como en los otros pasos
  const carpeta = CARP.poner(CARP.vacia('FABBLE 1.1'), CAT.PROFESOR[3], fs.readFileSync(path.join(__dirname, 'respuesta-cmoc-profesor.md'), 'utf8'), { ahora: '2026-10-10T21:40:00Z' })
  assert.match(O.pedido('icia', { ...ctx, carpeta }), /### CARPETA DEL PROFESOR[\s\S]*#### Paso 4 · CMOC/)

  // ── La revisión ──
  const rOgo = O.revisar('ogo', RESP, { ogo: conOgo })
  assert.deepEqual([rOgo.faltan, rOgo.faltanTexto, rOgo.vacios, rOgo.marcadores], [[], [], [], []], JSON.stringify(rOgo))
  assert.equal(rOgo.ok, true); assert.equal(rOgo.supuestos, 2); assert.ok(rOgo.apartados > 50)
  const rIcia = O.revisar('icia', ICIA, { ogo: conOgo })
  assert.deepEqual(rIcia.faltan, ['C.- Contrainteligencia'])
  assert.deepEqual(rIcia.vacios, ['Condiciones meteorológicas.'])
  assert.equal(rIcia.marcadores.length, 2); assert.match(rIcia.marcadores[0], /\[completar unidad de guerra electrónica\]/)
  assert.ok(rIcia.avisos.some((a) => /CORTADA/.test(a))); assert.equal(rIcia.ok, false)
  // la Orden: sin propósito ni cuándo, sin la unidad de los alumnos, con hipótesis siendo orden, sin un anexo en ANEXOS, sin el cuadro
  const mala = RESP.replace(/Anexo “I” Plan de AC\/GM\.\n/, '').replace(/con el propósito de impedir que el VI Ejército corte la ruta 1 y conservar el control del altiplano/, 'y conserva el altiplano').replace(/a partir del D \(0500\) entre/, 'entre')
    .replace(/1\.- C\.E\. 1\. Defiende/, '1.- Primer Cuerpo. Defiende').replace(/C\.- Refuerzos y reducciones\./, 'C.- Refuerzos y reducciones.\nD.- Hipótesis. Que el enemigo no use armas QBN.')
    .replace(/C\.E\. 1: D\.I\. 11; D\.I\. 12; Br\. Bl\. C\.E\. 1\n/, '').replace(/ORGANIZACIÓN DE LA TAREA:\n[\s\S]*?\n\n/, 'ORGANIZACIÓN DE LA TAREA:\nLas tropas de siempre.\n\n')
  const rMala = O.revisar('ogo', mala, { ogo: conOgo })
  const av = rMala.avisos.join('\n')
  assert.match(av, /falta el Anexo “I” Plan de AC\/GM/); assert.match(av, /no dice el PARA QUÉ/); assert.match(av, /no dice el CUÁNDO/)
  assert.match(av, /no aparece la unidad de los alumnos \(C\.E\. 1\)/); assert.match(av, /Es una ORDEN: el apartado «Hipótesis»/)
  assert.match(av, /no vino en líneas «AGRUPACIÓN: unidad; unidad»/)
  assert.equal(rMala.ok, false)
  assert.equal(O.revisar('ogo', mala.replace(/D\.- Hipótesis\. Que el enemigo no use armas QBN\.\n/, ''), { ogo: O.conConfig(conOgo, { tipo: 'plan' }) }).faltan.includes('D.- Hipótesis'), true, 'el plan exige las hipótesis')
  // la OGO entera: datos del membrete, documentos por escribir y lo que falta dibujar
  const todo = O.revisarTodo(conOgo, { ejercicio: ej })
  assert.equal(todo.total, 10); assert.equal(todo.listos, 1, 'la Orden lista'); assert.equal(todo.ok, false)
  const g = todo.generales.join('\n')
  assert.doesNotMatch(g, /falta: el escalón superior/, 'el de las FF.TT. es el CTO'); assert.equal(conOgo.config.superior, 'CTO')
  assert.match(O.revisarTodo(O.conConfig(O.vacio('X'), {}), {}).generales.join('\n'), /falta: el N° de la Orden, la unidad que expide[\s\S]*la carta\./)
  assert.match(g, /no hay ÁREA DE OPERACIONES/); assert.match(g, /no hay LÍMITES/); assert.match(g, /no hay fichas ENEMIGAS/)
  assert.match(g, /Falta escribir: Anexo “B” — Plan de Inteligencia\./)
  assert.doesNotMatch(g, /Falta escribir: ORDEN/)
  const pc = O.pedidoCorregir('icia', rIcia, { ...ctx, ogo: O.poner(conOgo, 'icia', ICIA) })
  assert.match(pc, /# PEDIDO DE CORRECCIÓN PARA LA IA/); assert.match(pc, /FALTAN estos apartados del modelo: C\.- Contrainteligencia/)
  assert.match(pc, /VACÍOS \(solo el título\): Condiciones meteorológicas/); assert.match(pc, /MARCAS SIN LLENAR/); assert.match(pc, /Devolvé el documento COMPLETO y corregido/)
  assert.match(pc, /### La Orden ya escrita \(manda: no la contradigas\)/)

  // ── Leer lo que contestó la IA ──
  const e = O.estructura(RESP)
  assert.deepEqual(e.preliminares.map((p) => p.rotulo), ['OBJETO', 'CARTA', 'ANEXOS'])
  assert.deepEqual(e.organizacion.map((x) => x.nombre), ['C.E. 1', 'C.E. 2', 'C.E. 3 (RESERVA)', 'TROPAS FF.TT.'])
  assert.deepEqual(e.organizacion[2].elementos, ['D. Mec. 31', 'Br. Bl. 32'], 'una agrupación con guion también es agrupación')
  assert.deepEqual(e.secciones.map((n) => n.titulo), ['SITUACIÓN.', 'MISIÓN.', 'EJECUCIÓN.', 'APOYO DE SERVICIO.', 'COMANDO Y COMUNICACIONES.'])
  const ejec = e.secciones[2]
  assert.equal(ejec.hijos[0].titulo, 'Intención del Comandante.'); assert.equal(ejec.hijos[0].sinRotulo, true)
  assert.deepEqual(ejec.hijos.slice(1).map((n) => n.titulo), ['Concepto de la operación.', 'Tareas de las unidades de maniobra.', 'Tareas de las unidades de apoyo de combate.', 'Instrucciones de coordinación.'])
  assert.deepEqual(ejec.hijos[2].hijos.map((n) => n.titulo), ['C.E. 1.', 'C.E. 2.', 'C.E. 3 (reserva).'], '«C.E. 1.» no se corta en «C.E.»')
  assert.equal(ejec.hijos[1].hijos[6].titulo, 'Operaciones QBN.', '«QBN.» sí cierra el título')
  assert.equal(e.secciones[4].hijos[0].hijos[1].item, true, 'una oración numerada sin nada debajo es un inciso')
  const eI = O.estructura(ICIA)
  assert.equal(eI.sigue, true)
  assert.deepEqual(eI.secciones[2].hijos[1].hijos[0].tabla.cabecera, ['Unidad', 'Tarea', 'Hasta'], 'el cuadro Markdown')
  for (const [l, esperado] of [['1.- AT. «LANZA». El 240900 efectúa…', 'AT. «LANZA».'], ['2.- 2da. Sección de Ingeniería de Combate.', '2da. Sección de Ingeniería de Combate.'], ['V.- COMANDO Y COMUNICACIONES.', 'COMANDO Y COMUNICACIONES.']]) assert.equal(O.leerTitulo(l).titulo, esperado)
  assert.equal(O.leerTitulo('V.- Operaciones varias').nivel, 2, '«V.-» en minúsculas es la letra V')
  assert.equal(O.leerTitulo('A partir del D-25 es asignada'), null)

  // ── El Word: el formato militar de la Mesa ──
  const spec = O.aSpec('ogo', RESP, conOgo)
  assert.deepEqual(spec.preliminares.map((p) => p.rotulo), ['OBJETO', 'CARTA', 'ANEXOS'])
  assert.equal(spec.preliminares[2].texto, O.listaAnexos(conOgo), 'la lista de ANEXOS es la de los elegidos, con sus letras')
  assert.equal(spec.organizacion.equipos.length, 4); assert.equal(spec.estructuraPropia, true)
  const sI = O.aSpec('icia', ICIA, conOgo)
  assert.equal(sI.secciones[0].titulo, 'Organización de la Tarea.'); assert.equal(sI.secciones[0].sinRotulo, true)
  const { cfg, padre } = O.cfgWord('icia', O.conConfig(conOgo, { jem: 'jgs' }))
  assert.equal(cfg.nivel, 'anexo'); assert.equal(cfg.identificador, 'B'); assert.equal(cfg.asunto, 'Plan de Inteligencia / Inteligencia'); assert.equal(cfg.seccion, 'EMO/SEC-II')
  assert.equal(cfg.autenticador, 'G-2'); assert.equal(cfg.jem, 'JGS'); assert.equal(cfg.firma, 'EL COMANDANTE DE LAS FF.TT. «FICT»'); assert.equal(padre.tituloCompleto, 'ORDEN DE OPERACIONES No. 01')
  assert.equal(O.cfgWord('ogo', conOgo).cfg.nivel, 'principal'); assert.equal(O.cfgWord('ogo', conOgo).padre, null)
  assert.equal(O.cfgWord('calco', conOgo).cfg.expedicion, 2, 'el correlativo sigue dentro de la SEC-III')
  assert.equal(O.nombreArchivo('icia', conOgo, 2), '02 Anexo B - Plan de Inteligencia')
  const docx = docxModule()
  if (docx) {
    const word = await import('../formato-militar/v1/word.js')
    word.configurarWord(docx)
    const J = require('../../jszip.min.js')
    // el cuerpo, el encabezado y el pie (ahí va la clasificación)
    const texto = async (buf) => { const z = await J.loadAsync(buf); const xs = await Promise.all(Object.keys(z.files).filter((k) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(k)).sort().map((k) => z.file(k).async('string'))); return xs.join(' ').replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '') }
    const est2 = O.conConfig(O.poner(conOgo, 'icia', ICIA), { superior: 'COMANDO EN JEFE', jem: 'JGS' })
    const bOgo = await docx.Packer.toBuffer(word.crearWord(O.aSpec('ogo', RESP, est2), O.cfgWord('ogo', est2).cfg, null))
    fs.writeFileSync(path.join(SALIDAS, O.nombreArchivo('ogo', est2, 0) + '.docx'), bOgo)
    const t = await texto(bOgo)
    for (const s of ['SECRETO', 'COMANDO EN JEFE', 'FF.TT. «FICT»', 'EMO/SEC-III', 'No. 001/SMM', 'ORDEN DE OPERACIONES No. 01', 'OBJETO', '“I” Plan de AC/GM.', 'ORGANIZACIÓN DE LA TAREA:', 'TROPAS FF.TT.', 'SITUACIÓN.', 'Curso de acción más peligroso.', 'Intención del Comandante.', 'Restricciones y definiciones', 'EL COMANDANTE DE LAS FF.TT. «FICT»', 'Autenticación:', 'Distribución:'])
      assert.ok(t.includes(s), `el Word de la Orden tiene «${s}»`)
    assert.ok(!t.includes('PARA EL PROFESOR') && !t.includes('Supuestos: el orden de batalla'), 'lo PARA EL PROFESOR no va al Word')
    const xI = O.cfgWord('icia', est2)
    const bI = await docx.Packer.toBuffer(word.crearWord(O.aSpec('icia', ICIA, est2), xI.cfg, xI.padre))
    fs.writeFileSync(path.join(SALIDAS, O.nombreArchivo('icia', est2, 2) + '.docx'), bI)
    const ti = await texto(bI)
    for (const s of ['ANEXO “B”', '(Plan de Inteligencia / Inteligencia) A LA ORDEN DE OPERACIONES No. 01', 'EMO/SEC-II', 'APÉNDICES', 'Organización de la Tarea.', 'Tareas para las unidades subordinadas.', 'Vigilar las AIN 1 y 2', 'G-2']) assert.ok(ti.includes(s), `el Word del anexo tiene «${s}»`)
    const xP = O.cfgWord('icia', O.conConfig(est2, { tipo: 'plan' }))
    const tp = await texto(await docx.Packer.toBuffer(word.crearWord(O.aSpec('icia', ICIA, O.conConfig(est2, { tipo: 'plan' })), xP.cfg, xP.padre)))
    assert.ok(tp.includes('(Plan de Inteligencia / Inteligencia) AL PLAN DE OPERACIONES No. 01'), 'AL PLAN (no «A LA PLAN»)')
  } else console.log('  (sin la librería docx: no se arma el Word; DOCX_MODULE=/ruta/a/docx)')

  // ── El .md y el ejercicio ──
  const est3 = O.poner(conOgo, 'icia', ICIA)
  const md = O.markdown(est3, { escalon: 'Comandante de las FF.TT.', foco: 'G-4 · Logística' })
  assert.match(md, /^# 📜 ORDEN DE OPERACIONES No\. 01 — FABBLE 1\.1/)
  assert.match(md, /## ANEXO “B” \(Plan de Inteligencia \/ Inteligencia\) A LA ORDEN DE OPERACIONES No\. 01/)
  assert.match(md, /## ANEXO “C” [^\n]*\n\n_\(Todavía no está escrito\.\)_/)
  assert.match(md, /# 🧑‍🏫 PARA EL PROFESOR \(no se entrega a los alumnos\)[\s\S]*Supuestos: el orden de batalla/)
  const vuelta = O.leerMarkdown(md)
  assert.deepEqual(vuelta.docs, est3.docs); assert.deepEqual(vuelta.config, est3.config); assert.equal(vuelta.ejercicio, 'FABBLE 1.1')
  assert.throws(() => O.leerMarkdown('# otra cosa'), /no es una OGO/)
  const docsEj = O.paraEjercicio(est3)
  assert.deepEqual(docsEj.map((d) => [d.nombre, d.categoria]), [['ORDEN DE OPERACIONES No 01.md', 'orden'], ['Anexo B - Plan de Inteligencia.md', 'anexoicia'], ['Anexo D - Plan de Ingenieria.md', 'orden']])
  assert.ok(docsEj.every((d) => d.tipo === 'texto' && d.mime === 'text/plain' && !/PARA EL PROFESOR/.test(d.texto)))
  assert.ok(docsEj[0].texto.startsWith('ORDEN DE OPERACIONES No. 01\n\nOBJETO:'))

  console.log(`ogo.cjs OK — ${O.DOCS.length} documentos con su modelo; pedido de la Orden ${pOgo.length.toLocaleString('es')} caracteres; la Orden de prueba sin faltas (${rOgo.apartados} apartados); el anexo incompleto: ${rIcia.faltan.length} falta, ${rIcia.vacios.length} vacío, ${rIcia.marcadores.length} marcas, cortado${docx ? '; Word militar armado y leído' : ''}`)
})().catch((e) => { console.error(e); process.exit(1) })
