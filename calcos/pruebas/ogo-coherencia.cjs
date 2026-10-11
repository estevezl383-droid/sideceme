// 🔎📍🗺️ Lo que pidió Sergio (11-10-2026) después de la OGO del profesor, en Node (sin navegador):
//   · ogo-mesa.js: quien expide es el «¿Quién soy?» (FF.TT.T.O.), su escalón superior el CTO, los alumnos
//     las fichas de abajo, el CG la POBLACIÓN MÁS CERCANA a su PC; «I CUERPO DE EJÉRCITO (I CE)» = «CE-I»;
//     las unidades de la organización de la tarea (con «(supuesto)», OPCON, la sigla GALM-1), las que
//     faltan en la carta y dónde ponerlas (dentro del Área de Operaciones, la más grande);
//   · ogo.js: el membrete del Word (CTO / FF.TT.T.O. / «CG. Tunapa. D-60 (0800)» / «No. 002/XYZ.»),
//     «APÉNDICES: S/A.», la fecha que fija la IA («FECHA Y HORA:») y el Anexo A como imagen;
//   · ogo-coherencia.js: el pedido con todos los documentos, leer la respuesta en partes (con marcas
//     adornadas, «SIGUE», un documento que no es de la OGO), aplicar, volver atrás, el pedido para
//     seguir; las unidades por ubicar, ✓ Aceptar (ficha + sin «(supuesto)») y ✕ No colocar;
//   · ogo-calco.js: UTM ida y vuelta, el dibujo (área, límite con su magnitud, fichas propias sin el
//     enemigo, PC, las dos cruces con sus dígitos y la coordenada entera) y el tamaño para el Word.
//   node calcos/pruebas/ogo-coherencia.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const O = require('../modalidad/ogo.js')
const M = require('../modalidad/ogo-mesa.js')
const C = require('../modalidad/ogo-coherencia.js')
const K = require('../modalidad/ogo-calco.js')
const CAT = require('../modalidad/catalogo.js')
const IA = require('../modalidad/ia-profesor.js')

const RESP = fs.readFileSync(path.join(__dirname, 'fixtures', 'ogo-respuesta-ia.md'), 'utf8')
const ORG = 'ORGANIZACIÓN DE LA TAREA:\nI CUERPO DE EJÉRCITO (I CE): Orgánico; Grupo de Artillería de Lanzadores Múltiples 1 (GALM-1) (OPCON a partir D-2 1200)\nII CUERPO DE EJÉRCITO (II CE): Orgánico\nIII CUERPO DE EJÉRCITO (III CE): Orgánico (Reserva de FF.TT.T.O.)\nAGRUPACIÓN DE ARTILLERÍA DE FF.TT.: Orgánico; menos GALM-1\nAGRUPACIÓN DE INGENIEROS DE FF.TT.: Orgánico\nBATALLÓN DE AVIACIÓN DE EJÉRCITO 1: Orgánico\nBATALLÓN LOGÍSTICO DE FF.TT.: Orgánico (supuesto)\n'
const ORDEN = RESP.replace(/ORGANIZACIÓN DE LA TAREA:[\s\S]*?\n\nI\.- SITUACIÓN/, ORG + '\nI.- SITUACIÓN')
const CONS = fs.readFileSync(path.join(__dirname, 'fixtures', 'ogo-consolidado-ia.md'), 'utf8').replace('{{ORDEN}}', ORDEN)
function docxModule() {
  for (const c of [process.env.DOCX_MODULE, 'docx', '/opt/node-tools/node_modules/docx', '/opt/node22/lib/node_modules/docx'].filter(Boolean)) { try { return require(c) } catch {} }
  return null
}
const u = (designacion, arma, escalon, lat, lng, extra) => Object.assign({ id: designacion, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat, lng }, extra || {})
const pob = (name, lng, lat, fclass, population) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { name, fclass, population } })
const AO = [[-69.25, -18.35], [-68.32, -18.40], [-68.30, -19.05], [-69.10, -19.10], [-69.28, -18.80]]
const CE1 = [[-69.25, -18.35], [-68.32, -18.40], [-68.31, -18.665], [-69.26, -18.665]]
const ej = {
  nombre: 'FABBLE 1.1',
  ops: { unidadConsiderada: { nombre: 'FF.TT.T.O.', confirmada: true }, areasOps: [{ id: 'ao', nombre: 'AO FF.TT.T.O.', coords: AO }, { id: 'ce1', nombre: 'CE-I', coords: CE1 }], areaOps: { id: 'ce1', nombre: 'CE-I', coords: CE1 },
    limites: [{ coords: [[-69.26, -18.665], [-68.31, -18.665]], escalon: 'cuerpo', tipo: 'magnitud' }], objetivos: [{ etiqueta: '1', centro: [-68.95, -18.55] }] },
  ordenSup: { unidad: 'FF.TT.T.O.' },
  unidades: [u('FF.TT.T.O.', 'infanteria', 'ejercito', -18.865, -68.52), u('CE-I', 'infanteria', 'cuerpo', -18.57, -68.57), u('CE-II', 'mecanizada', 'cuerpo', -18.74, -68.64), u('CE-III', 'blindada', 'cuerpo', -18.80, -68.45),
    u('VI EJ.', 'mecanizada', 'ejercito', -18.5, -69.1, { bando: 'enemigo' })],
  resultados: { poblaciones_puntos: { fc: { type: 'FeatureCollection', features: [pob('Tunapa', -68.53, -18.87, 'hamlet', 131), pob('Sabaya', -68.62, -18.63, 'town', 900), pob('Pagador', -68.46, -18.69, 'village', 300), pob('Afuera', -70.5, -17.0, 'town', 99999)] } } },
}

;(async () => {
  // ── ogo-mesa.js: las designaciones ──
  for (const [a, b, si] of [['I CUERPO DE EJÉRCITO (I CE)', 'CE-I', true], ['I CE', 'C.E. 1', true], ['II CE', 'CE-I', false], ['BATALLÓN LOGÍSTICO DE FF.TT.', 'Bat. Log. FF.TT.', true],
    ['AGRUPACIÓN DE ARTILLERÍA DE FF.TT.', 'Br. Art. FF.TT.', true], ['GALM-1', 'Grupo de Artillería de Lanzadores Múltiples 1 (GALM-1)', true], ['GALM-1', 'Br. Art. FF.TT.', false],
    ['FF.TT.T.O.', 'Cmdo. FF.TT. «FICT»', true], ['D.I. 11', 'D.I. 12', false], ['BAT. AV. EJTO. 1', 'BATALLÓN DE AVIACIÓN DE EJÉRCITO 1', true]]) assert.equal(M.mismaUnidad(a, b), si, a + ' / ' + b)
  assert.deepEqual(['FF.TT.T.O.', 'CE-I', 'DIV.MEC.-1', 'BR. MEC. 2', 'RI-13'].map(M.nivelDe), ['fftt', 'ce', 'div', 'brig', 'unidad'])
  assert.equal(M.superiorDe('FF.TT.T.O.'), 'CTO'); assert.equal(M.superiorDe('CE-I'), '')
  // la población más cercana (capa «Centros poblados» de los calcos)
  const pobs = M.poblaciones(ej)
  assert.deepEqual(pobs.map((p) => [p.nombre, p.tipo]), [['Tunapa', 'Caserío'], ['Sabaya', 'Pueblo'], ['Pagador', 'Poblado'], ['Afuera', 'Pueblo']])
  assert.equal(M.masCercana(pobs, -18.865, -68.52).nombre, 'Tunapa'); assert.equal(M.masCercana(pobs, 10, 10), null, 'a más de 60 km no hay')
  assert.ok(!M.poblacionesParaPedido(ej).some((p) => p.nombre === 'Afuera'), 'para el pedido, las del Área de Operaciones')
  assert.deepEqual(M.anillo(ej), AO, 'el Área de Operaciones es la más grande, aunque esté seleccionado el pedazo del CE-I')
  // quién expide
  const id = M.identidad(ej, 'fftt')
  assert.deepEqual([id.unidad, id.superior, id.alumnos, id.lugar.nombre], ['FF.TT.T.O.', 'CTO', 'CE-I, CE-II y CE-III', 'Tunapa'])
  assert.match(id.fuentes.lugar, /población más cercana \(1,2 km\) a la ficha «FF\.TT\.T\.O\.»/)
  assert.equal(M.identidad({ ...ej, ordenSup: { escalonSuperior: 'CTO', unidad: 'FF.TT.T.O.' } }, 'ce').unidad, 'FF.TT.T.O.', 'con «CTO» como escalón superior en Mesa · Preparación, quien expide sigue siendo FF.TT.T.O.')
  const alumnos = M.identidad({ ordenSup: { escalonSuperior: 'FF.TT. «FICT»', unidad: 'C.E. 1' }, unidades: [] })
  assert.deepEqual([alumnos.unidad, alumnos.alumnos, alumnos.superior], ['FF.TT. «FICT»', 'C.E. 1', 'CTO'], 'sin escalón: «Mesa · Preparación» dice quién expide y la identidad son los alumnos')
  // las unidades de la organización de la tarea
  const org = O.estructura(ORDEN).organizacion
  const us = M.unidadesDeOrganizacion(org)
  assert.deepEqual(us.map((x) => x.designacion), ['I CE', 'GALM-1', 'II CE', 'III CE', 'AGR. ART. FF.TT.', 'AGR. ING. FF.TT.', 'BAT. AV. EJTO. 1', 'BAT. LOG. FF.TT.'])
  const galm = us.find((x) => x.designacion === 'GALM-1'), blog = us.find((x) => x.designacion === 'BAT. LOG. FF.TT.')
  assert.deepEqual([galm.arma, galm.escalon, galm.de, galm.relacion], ['lanzacohetes', 'batallon', 'I CE', 'OPCON a partir D-2 1200'])
  assert.deepEqual([blog.arma, blog.escalon, blog.supuesto], ['logistica', 'batallon', true])
  assert.deepEqual(M.faltantes(us, ej.unidades).map((x) => x.designacion), ['GALM-1', 'AGR. ART. FF.TT.', 'AGR. ING. FF.TT.', 'BAT. AV. EJTO. 1', 'BAT. LOG. FF.TT.'], 'los Cuerpos ya están')
  const sug = M.sugerir(blog, ej, id, 0)
  assert.ok(M.dentro([sug.lng, sug.lat], AO), 'la sugerida cae dentro del Área de Operaciones')
  assert.ok(M.km([sug.lng, sug.lat], [-68.52, -18.865]) < 15, 'lo logístico, cerca y detrás del PC')
  const sa = M.sugerir(us.find((x) => x.designacion === 'AGR. ART. FF.TT.'), ej, id, 0)
  assert.ok(M.km([sa.lng, sa.lat], [-69.1, -18.5]) < M.km([-68.52, -18.865], [-69.1, -18.5]), 'la artillería, entre el PC y el enemigo')
  assert.deepEqual(M.quitarSupuesto('BATALLÓN LOGÍSTICO DE FF.TT.: Orgánico (supuesto).\nBase Logística Principal (supuesto)', blog), { texto: 'BATALLÓN LOGÍSTICO DE FF.TT.: Orgánico.\nBase Logística Principal (supuesto)', cambios: 1 })

  // ── ogo.js: los datos de la Orden y el membrete ──
  let est = O.poner(O.vacio('FABBLE 1.1'), 'ogo', 'FECHA Y HORA: D-60 (0800)\n' + ORDEN, '2026-10-11T10:00:00Z')
  assert.deepEqual(est.auto, { fechaHora: 'D-60 (0800)', de: 'ogo' }, 'la fecha que fija la IA queda para toda la OGO')
  assert.doesNotMatch(O.producto(est.docs.ogo.texto), /FECHA Y HORA/, 'esa línea no va al cuerpo')
  est = O.poner(est, 'log', 'FECHA Y HORA: D-5 (0800)\nOBJETO: Plan de logística.', '2026-10-11T10:01:00Z')
  assert.equal(est.auto.fechaHora, 'D-60 (0800)', 'la de la Orden manda')
  let c = O.completarConfig(est, ej, { escalon: 'fftt' })
  assert.deepEqual([c.config.unidad, c.config.superior, c.config.alumnos, c.config.lugar, c.config.fechaHora], ['FF.TT.T.O.', 'CTO', 'CE-I, CE-II y CE-III', 'Tunapa', 'D-60 (0800)'])
  assert.equal(O.completarConfig(O.conConfig(est, { lugar: 'ORURO', superior: 'COMANDO CONJUNTO' }), ej, { escalon: 'fftt' }).config.lugar, 'ORURO', 'lo que escribe el profesor manda')
  const w = O.cfgWord('calco', c).cfg
  assert.deepEqual([w.superior, w.unidad, w.lugar, w.fechaHora, w.seccion, w.expedicion, w.iniciales, w.jem, w.inicialesAut, w.firma], ['CTO', 'FF.TT.T.O.', 'Tunapa.', 'D-60 (0800)', 'EMO/SEC-III', 2, 'XYZ.', 'XYZ', 'XYZ', 'EL COMANDANTE DE LAS FF.TT.T.O.'])
  assert.match(w.distribucion, /^Original: CTO\n/)
  const conCalco = O.poner(c, 'calco', 'OBJETO: Calco de Operaciones.\nCARTA: Esc. 1:100.000.\nAPÉNDICES: Sin novedad.\nREFERENCIAS DEL CALCO\n- LÍMITES: x')
  const sp = O.aSpec('calco', conCalco.docs.calco.texto, conCalco)
  assert.equal(sp.preliminares.find((p) => p.rotulo === 'APÉNDICES').texto, 'S/A.', '«Sin novedad.» → S/A.')
  const conImg = O.aSpec('calco', conCalco.docs.calco.texto, conCalco, { imagen: { data: new Uint8Array([1]), ancho: 600, alto: 500 } })
  assert.deepEqual(conImg.secciones, [{ imagen: { data: new Uint8Array([1]), ancho: 600, alto: 500 } }], 'el Anexo A es la imagen, sin «REFERENCIAS DEL CALCO»')
  assert.equal(O.aSpec('calco', '', c).preliminares[0].texto, 'Calco de Operaciones anexo a la ORDEN DE OPERACIONES No. 01 de las FF.TT.T.O.', 'sin escribir, el OBJETO lo pone la Mesa')
  assert.equal(O.aSpec('fuegos', 'OBJETO: x\nAPÉNDICES: Ninguno.', O.conConfig(c, { seleccion: { ...c.config.seleccion, fuegosArt: true } })).preliminares.find((p) => p.rotulo === 'APÉNDICES').texto, 'Apéndice “1” Plan de Fuegos de Artillería.', 'con apéndice elegido, el apéndice')
  const rt = O.revisarTodo(c, { ejercicio: ej })
  assert.ok(!rt.generales.some((g) => /Falta escribir: Anexo “A”/.test(g)), 'el calco sale de la Mesa: no «falta escribir»')
  // el pedido de un documento lleva lo que la Mesa sabe del membrete y las poblaciones
  const ctx = { escalon: CAT.ESCALONES[0], foco: IA.focoDe('g4'), ogo: c, ejercicio: ej, unidades: ej.unidades }
  const pl = O.pedido('log', ctx)
  assert.match(pl, /\*\*Expide:\*\* FF\.TT\.T\.O\. · PC Tunapa · D-60 \(0800\) · \*\*la reciben:\*\* CE-I, CE-II y CE-III/)
  assert.match(pl, /Escalón superior de las FF\.TT\.T\.O\.:\*\* CTO/); assert.match(pl, /Fecha y hora de la OGO:\*\* D-60 \(0800\)\. Es la MISMA/)
  assert.match(pl, /### Poblaciones[\s\S]*- FF\.TT\.T\.O\. → Tunapa \(Caserío\), a 1,2 km[\s\S]*- Sabaya · Pueblo · -18\.63, -68\.62 · 900 hab\./)
  assert.match(pl, /marcala «\(supuesto\)»: la Mesa se la ofrece al profesor para colocarla/)
  assert.match(O.pedido('calco', ctx), /Sin apéndices: «APÉNDICES: S\/A\.»/); assert.match(O.pedido('calco', ctx), /el Anexo es un GRÁFICO que la Mesa dibuja/)
  assert.match(O.pedido('ogo', { ...ctx, ogo: O.completarConfig(O.vacio('X'), ej, { escalon: 'fftt' }) }), /todavía no está fijada[\s\S]*«FECHA Y HORA: D-60 \(0800\)»/)

  // ── ogo-coherencia.js: el pedido ──
  const pc = C.pedido({ ...ctx, escalonId: 'fftt' })
  assert.ok(pc.startsWith('# PEDIDO DE TRABAJO PARA LA IA — REVISIÓN DE COHERENCIA'))
  assert.match(pc, /\(2 de 10 escritos\)/)
  assert.match(pc, /=== DOCUMENTO: ogo · ORDEN DE OPERACIONES No\. 01 ===\nOBJETO:/); assert.match(pc, /=== DOCUMENTO: log · ANEXO “G” \(Plan de Logística/)
  assert.match(pc, /Sin escribir todavía[^\n]*Anexo “B” — Plan de Inteligencia/)
  assert.match(pc, /- Escalón superior: CTO \(Comando del Teatro de Operaciones/); assert.match(pc, /- CG de quien expide: Tunapa/); assert.match(pc, /- Fecha y hora de la OGO: D-60 \(0800\)/)
  assert.equal((pc.match(/^\d+\. /gm) || []).length >= C.CHEQUEO.length, true, 'la lista de chequeo')
  assert.match(pc, /`=== REVISIÓN ===`[\s\S]*`=== DATOS ===`[\s\S]*"unidades"[\s\S]*SIGUE: <id del documento que sigue>/)
  assert.match(pc, /NO están en la carta[\s\S]*- BAT\. LOG\. FF\.TT\. \(BATALLÓN LOGÍSTICO DE FF\.TT\.\) · logistica · batallon · estaba «\(supuesto\)»/)
  assert.match(pc, /### Fichas en la carta[\s\S]*AZUL · FF\.TT\.T\.O\. · infanteria · ejercito · -18\.865, -68\.52 · cerca de Tunapa \(1,2 km\)/)
  assert.match(pc, /### Área de Operaciones\nEntre lat -19\.1 y -18\.35/)
  // leer: marcas adornadas, partes, «SIGUE», un documento que no es de la OGO
  const l = C.leer(CONS, c)
  assert.deepEqual(Object.keys(l.docs), ['ogo', 'calco', 'icia']); assert.deepEqual(l.desconocidos, ['Anexo “Z” (Plan de Prensa)'])
  assert.equal(l.sigue, false, 'la parte siguiente vino debajo'); assert.equal(C.leer(CONS.split('=== DOCUMENTO: Anexo “B”')[0], c).sigue, true)
  assert.match(l.revision, /^1\. La Orden decía D-5/); assert.equal(l.datos.membrete.fechaHora, 'D-60 (0800)'); assert.equal(l.datos.unidades.length, 4); assert.equal(l.datos.medidas[0].nombre, 'LF ALFA')
  assert.equal(C.leer('hola, no tengo marcas', c).vacio, true)
  assert.deepEqual(['ogo', 'calco', 'icia', 'fuegosArt', ''].map((x) => x), ['ogo', 'calco', 'icia', 'fuegosArt', ''])
  assert.deepEqual(['ogo · ORDEN', 'ANEXO “G” (Plan de Logística)', 'Apéndice “1” al Anexo “C”', 'ORDEN DE OPERACIONES No. 01', 'lo que sea'].map((t) => C.idDe(t, O.conConfig(c, { seleccion: { ...c.config.seleccion, fuegosArt: true } }))), ['ogo', 'log', 'fuegosArt', 'ogo', ''])
  // aplicar, el pedido para seguir, volver atrás
  const ap = C.aplicar(c, l, '2026-10-11T12:00:00Z')
  assert.deepEqual(ap.aplicados, ['ogo', 'calco', 'icia'])
  assert.equal(ap.est.docs.ogo.previo, c.docs.ogo.texto); assert.ok(ap.est.docs.calco.consolidado && ap.est.docs.calco.previo === '', 'el calco no estaba escrito')
  assert.equal(ap.est.auto.fechaHora, 'D-60 (0800)')
  let e = C.estado(ap.est)
  assert.deepEqual(e.hechos, ['ogo', 'calco', 'icia']); assert.ok(e.faltan.includes('log') && !e.faltan.includes('ogo'))
  assert.match(C.pedidoSeguir(ap.est), /^SEGUÍ con la consolidación[\s\S]*=== DOCUMENTO: fuegos · ANEXO “C”[\s\S]*=== DOCUMENTO: log · ANEXO “G”/)
  const ap2 = C.aplicar(ap.est, C.leer('=== DOCUMENTO: log · ANEXO “G” ===\nOBJETO: Plan de logística consolidado.', ap.est), '2026-10-11T12:05:00Z')
  assert.equal(ap2.est.docs.log.previo, 'FECHA Y HORA: D-5 (0800)\nOBJETO: Plan de logística.'); assert.equal(ap2.est.docs.ogo.previo, c.docs.ogo.texto, 'una segunda parte no pisa el anterior de los otros')
  assert.equal(ap2.est.coherencia.datos.unidades.length, 4, 'los DATOS se conservan')
  const ap3 = C.aplicar(ap2.est, C.leer('=== DOCUMENTO: ogo ===\nOBJETO: otra vez', ap2.est))
  assert.equal(ap3.est.docs.ogo.previo, c.docs.ogo.texto, 'consolidar dos veces guarda el original, no el consolidado')
  const vu = C.deshacer(ap3.est)
  assert.equal(vu.vueltos, 4); assert.equal(vu.est.docs.ogo.texto, c.docs.ogo.texto); assert.equal(vu.est.docs.calco, undefined, 'el que no estaba, se va'); assert.equal(vu.est.coherencia, undefined)
  // las unidades por ubicar
  let it = C.porUbicar(ap.est, ej, { escalon: 'fftt' })
  const de = Object.fromEntries(it.map((x) => [x.u.designacion, x]))
  assert.deepEqual(Object.keys(de), ['BAT. LOG. FF.TT.', 'GALM-1', 'PC ALTERNO FF.TT.T.O.', 'I CE', 'II CE', 'III CE', 'AGR. ART. FF.TT.', 'AGR. ING. FF.TT.', 'BAT. AV. EJTO. 1'], 'las de la IA (el enemigo no) y las de la organización de la tarea')
  assert.deepEqual(['BAT. LOG. FF.TT.', 'I CE', 'AGR. ART. FF.TT.'].map((k) => de[k].estado), ['pendiente', 'en la carta', 'pendiente'])
  assert.deepEqual([de['BAT. LOG. FF.TT.'].lat, de['BAT. LOG. FF.TT.'].de, de['BAT. LOG. FF.TT.'].poblacion.nombre, de['BAT. LOG. FF.TT.'].dentro, de['BAT. LOG. FF.TT.'].u.supuesto], [-18.885, 'la IA', 'Tunapa', true, true])
  assert.equal(de['GALM-1'].u.relacion, 'OPCON a partir D-2 1200', 'lo de la organización de la tarea se suma a lo de la IA')
  assert.equal(de['PC ALTERNO FF.TT.T.O.'].u.tipo, 'pc'); assert.equal(de['AGR. ART. FF.TT.'].de, 'el terreno'); assert.ok(de['AGR. ART. FF.TT.'].porque.length, 'con el porqué')
  const ac = C.aceptar(ap.est, de['BAT. LOG. FF.TT.'], '2026-10-11T13:00:00Z')
  assert.deepEqual([ac.ficha.designacion, ac.ficha.bando, ac.ficha.tipo, ac.ficha.arma, ac.ficha.escalon, ac.ficha.lat, ac.ficha.lng, ac.ficha.origen], ['BAT. LOG. FF.TT.', 'propias', 'unidad', 'logistica', 'batallon', -18.885, -68.49, 'ogo-profesor'])
  assert.equal(ac.cambios, 2); assert.match(ac.est.docs.ogo.texto, /BATALLÓN LOGÍSTICO DE FF\.TT\.: Orgánico\n/); assert.match(ac.est.docs.calco.texto, /BAT\. LOG\. FF\.TT\. en -18\.885, -68\.49\.$/m)
  assert.equal(ac.est.colocadas[de['BAT. LOG. FF.TT.'].clave].poblacion, 'Tunapa')
  const pc2 = C.aceptar(ap.est, de['PC ALTERNO FF.TT.T.O.']).ficha
  assert.deepEqual([pc2.tipo, pc2.arma], ['pc', 'ninguna'])
  it = C.porUbicar(ac.est, { ...ej, unidades: ej.unidades.concat([ac.ficha]) }, { escalon: 'fftt' })
  assert.equal(it.find((x) => x.u.designacion === 'BAT. LOG. FF.TT.').estado, 'colocada')
  const ds = C.descartar(ac.est, de['BAT. AV. EJTO. 1'])
  assert.equal(C.porUbicar(ds, ej, { escalon: 'fftt' }).find((x) => x.u.designacion === 'BAT. AV. EJTO. 1').estado, 'descartada')
  assert.equal(C.porUbicar(C.descartar(ds, de['BAT. AV. EJTO. 1'], false), ej, { escalon: 'fftt' }).find((x) => x.u.designacion === 'BAT. AV. EJTO. 1').estado, 'pendiente')
  assert.throws(() => C.aceptar(ap.est, { u: blog, clave: 'x', lat: null, lng: null }), /no tiene ubicación/)
  // la OGO con la coherencia va y vuelve en el .md
  const md = O.leerMarkdown(O.markdown(ac.est))
  assert.deepEqual([md.auto.fechaHora, Object.keys(md.colocadas).length, md.coherencia.docs.length, !!md.docs.ogo.consolidado], ['D-60 (0800)', 1, 3, true])

  // ── ogo-terreno.js: la ubicación sale del terreno (Sergio: «no una regla de distancias») ──
  const T = require('../modalidad/ogo-terreno.js')
  const linea = (cs) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: cs }, properties: {} })
  const poli = (cs) => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [cs.concat([cs[0]])] }, properties: {} })
  const cuadro = (lng, lat, r) => [[lng - r, lat - r], [lng + r, lat - r], [lng + r, lat + r], [lng - r, lat + r]]
  const RUTA = [[-68.33, -18.95], [-68.62, -18.80], [-68.90, -18.60], [-69.20, -18.45]]
  const LAGO = cuadro(-68.45, -18.95, 0.03), SEVERO = cuadro(-68.66, -18.72, 0.06)
  const ejT = { ...ej, unidades: ej.unidades.slice(),
    cmoc: { severo: [poli(SEVERO)], restringido: [{ coords: cuadro(-68.85, -18.92, 0.05) }], avenidas: [{ bando: 'enemigo', nombre: 'NORTE', coords: [[-69.1, -18.5], [-68.75, -18.62]] }] },
    resultados: { ...ej.resultados, comunicaciones_vias: { fc: { type: 'FeatureCollection', features: [linea(RUTA)] } }, hidro_poligonos: { fc: { type: 'FeatureCollection', features: [poli(LAGO)] } },
      comunicaciones_aero: { fc: { type: 'FeatureCollection', features: [poli(cuadro(-68.38, -19.0, 0.01))] } } } }
  const idT = M.identidad(ejT, 'fftt'), en = [-69.1, -18.5], pcT = [-68.52, -18.865]
  const idx = T.indice(ejT)
  assert.ok(idx.cands.length > 500, 'una rejilla de ' + idx.cands.length + ' puntos dentro del área')
  assert.deepEqual([idx.fuentes.carreteras > 100, idx.fuentes.agua, idx.fuentes.severo, idx.fuentes.restringido, idx.fuentes.avenidasEnemigas, idx.fuentes.aerodromos], [true, 1, 1, 1, 1, 1])
  const dRuta = (p) => Math.min(...RUTA.slice(1).map((b, i) => { const a = RUTA[i], P = (q) => [(q[0] + 68.6) * 105.4, (q[1] + 18.7) * 110.57], A = P(a), B = P(b), Q = P([p.lng, p.lat]), dx = B[0] - A[0], dy = B[1] - A[1], t = Math.max(0, Math.min(1, ((Q[0] - A[0]) * dx + (Q[1] - A[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(Q[0] - A[0] - t * dx, Q[1] - A[1] - t * dy) }))
  const km = (p, q) => M.km([p.lng, p.lat], q)
  const enCuadro = (p, c) => p.lng > c[0][0] && p.lng < c[1][0] && p.lat > c[0][1] && p.lat < c[2][1]
  const log = T.ubicar({ designacion: 'BAT. LOG. FF.TT.', arma: 'logistica', escalon: 'batallon' }, ejT, idT)
  assert.ok(dRuta(log) < 3, 'lo logístico, junto a la carretera (' + dRuta(log).toFixed(1) + ' km)')
  assert.ok(km(log, en) >= 35, 'fuera del alcance de la artillería enemiga (' + km(log, en).toFixed(1) + ' km)')
  assert.ok(km(log, en) > M.km(pcT, en) - 3, 'detrás del PC (respecto del enemigo)')
  assert.ok(!enCuadro(log, LAGO) && !enCuadro(log, SEVERO), 'ni en el lago ni en el terreno severamente restringido')
  assert.match(log.porque.join(' · '), /detrás del PC[\s\S]*del enemigo \(fuera del alcance de su artillería\)[\s\S]*de una carretera/)
  const art = T.ubicar({ designacion: 'AGR. ART. FF.TT.', arma: 'artilleria', escalon: 'brigada' }, ejT, idT)
  assert.ok(km(art, en) >= 11 && km(art, en) <= 31, 'la artillería, al alcance del frente y fuera del fuego directo (' + km(art, en).toFixed(1) + ' km)')
  assert.ok(km(art, en) < km(log, en), 'más adelante que lo logístico')
  const av = T.ubicar({ designacion: 'BAT. AV. EJTO. 1', arma: 'aviacion', escalon: 'batallon' }, ejT, idT)
  assert.ok(km(av, [-68.38, -19.0]) < 15 && km(av, en) >= 40, 'la aviación, junto al aeródromo y atrás')
  const man = T.ubicar({ designacion: 'CE-IV', arma: 'infanteria', escalon: 'cuerpo' }, ejT, idT)
  assert.match(man.porque.join(' '), /sobre una avenida de aproximación del enemigo/, 'la maniobra, sobre la avenida que tiene que cerrar')
  assert.ok(!enCuadro(man, SEVERO))
  const otra = T.ubicar({ designacion: 'BAT. LOG. 2', arma: 'logistica', escalon: 'batallon' }, ejT, idT, { ocupados: [[log.lng, log.lat]] })
  assert.ok(km(otra, [log.lng, log.lat]) >= 2.5, 'dos del mismo tipo, separadas')
  // la de la IA: lo que el terreno objeta
  assert.deepEqual(T.revisar({ arma: 'logistica', escalon: 'batallon' }, -18.95, -68.45, ejT, idT).graves, ['en un lago o humedal'])
  assert.match(T.revisar({ arma: 'logistica', escalon: 'batallon' }, -18.52, -69.05, ejT, idT).graves.join(), /al alcance de su fuego/)
  assert.deepEqual(T.revisar({ arma: 'logistica', escalon: 'batallon' }, log.lat, log.lng, ejT, idT).graves, [])
  // en el panel: la de la IA en el lago se cambia por la del terreno, y se dice por qué
  const enLago = C.aplicar(c, C.leer('=== DATOS ===\n```json\n{"unidades":[{"designacion":"BAT. LOG. FF.TT.","arma":"logistica","escalon":"batallon","lat":-18.95,"lng":-68.45}]}\n```', c)).est
  const xl = C.porUbicar(enLago, ejT, { escalon: 'fftt' }).find((x) => x.u.designacion === 'BAT. LOG. FF.TT.')
  assert.equal(xl.de, 'el terreno'); assert.match(xl.reemplaza, /la de la IA \(-18\.95, -68\.45\) caía en un lago o humedal/)
  const pend = C.porUbicar(enLago, ejT, { escalon: 'fftt' }).filter((x) => x.estado === 'pendiente')
  for (let i = 0; i < pend.length; i++) for (let j = i + 1; j < pend.length; j++) assert.ok(M.km([pend[i].lng, pend[i].lat], [pend[j].lng, pend[j].lat]) > 1.5, 'las sugeridas no se enciman: ' + pend[i].u.designacion + ' / ' + pend[j].u.designacion)

  // ── las medidas de la IA, a las capas de la Mesa ──
  const meds = C.medidasPorDibujar(ap.est, { ...ej, ops: { ...ej.ops, limites: [...ej.ops.limites] } })
  assert.deepEqual(meds.map((x) => [x.op.el.nombre || x.op.el.etiqueta, x.op.capa, x.op.el.tipo || x.op.el.clase, x.estado]),
    [['LF ALFA', 'limites', 'simple', 'pendiente'], ['AE-1', 'limites', 'punteada', 'pendiente'], ['OBJ 1', 'objetivos', 'intermedio', 'pendiente'], ['PC 2', 'coordinacion', undefined, 'pendiente']])
  assert.deepEqual(meds[0].op.el.coords, [[-68.8, -18.6], [-68.8, -18.75]], '[lat, lng] de la IA → [lng, lat] de la Mesa')
  for (const [m, capa, forma] of [[{ nombre: 'AE-1', tipo: 'area', coords: [[-18.66, -68.74], [-18.66, -68.69], [-18.71, -68.69]] }, 'limites', 'punteada'], [{ nombre: 'OBJ 1', tipo: 'objetivo', lat: -18.55, lng: -68.95 }, 'objetivos', 'intermedio'],
    [{ nombre: 'PC 2', tipo: 'punto', lat: -18.7, lng: -68.62 }, 'coordinacion', undefined], [{ nombre: 'LÍMITE CE-I / CE-II', tipo: 'limite', escalon: 'cuerpo', coords: [[-18.665, -69.2], [-18.665, -68.4]] }, 'limites', 'magnitud'],
    [{ nombre: 'LF BRAVO', tipo: 'linea', coords: [[-68.7, -18.5], [-68.7, -18.8]] }, 'limites', 'simple']]) {
    const o = C.medidaAOps(m, ej)
    assert.equal(o.capa, capa, m.nombre); assert.equal(o.el.tipo || o.el.clase, forma || undefined, m.nombre)
  }
  assert.deepEqual(C.medidaAOps({ nombre: 'LF BRAVO', tipo: 'linea', coords: [[-68.7, -18.5], [-68.7, -18.8]] }, ej).el.coords[0], [-68.7, -18.5], 'si vinieron al revés, el orden que cae dentro del área')
  assert.deepEqual(C.medidaAOps({ nombre: 'AE-1', tipo: 'area', coords: [[-18.66, -68.74], [-18.66, -68.69], [-18.71, -68.69]] }, ej).el.coords.length, 4, 'el área se cierra')
  assert.equal(C.medidaAOps({ nombre: '', tipo: 'linea', coords: [[1, 2], [3, 4]] }, ej), null, 'sin nombre no')
  const am = C.aceptarMedidas(ap.est, meds.slice(0, 1))
  assert.deepEqual(Object.keys(am.capas), ['limites']); assert.equal(am.capas.limites[0].nombre, 'LF ALFA')
  const ejLF = { ...ej, ops: { ...ej.ops, limites: ej.ops.limites.concat(am.capas.limites) } }
  assert.deepEqual(C.medidasPorDibujar(am.est, ejLF).map((x) => x.estado), ['dibujada', 'pendiente', 'pendiente', 'pendiente'])
  assert.equal(C.medidasPorDibujar(am.est, ej)[0].estado, 'pendiente', 'si se quitó de la carta (↶ Deshacer), se vuelve a ofrecer')
  assert.deepEqual(Object.keys(C.aceptarMedidas(ap.est, meds).capas), ['limites', 'objetivos', 'coordinacion'])
  // lo que escribió la IA va al HTML de la carta: sin < > & " ' `
  const mala = C.medidaAOps({ nombre: 'LF <img src=x onerror=alert(1)>', tipo: 'objetivo', descripcion: '"><script>x</script>', lat: -18.6, lng: -68.8 }, ej)
  assert.doesNotMatch(mala.el.etiqueta + mala.el.nom, /[<>&"'`]/); assert.equal(M.ficha({ designacion: 'BAT <b>X</b>', lat: -18.6, lng: -68.8 }).designacion, 'BAT bX/b')
  assert.equal(C.medidasPorDibujar(ap.est, { ...ej, ops: { ...ej.ops, limites: [{ coords: [[0, 0], [1, 1]], nombre: 'LF Alfa' }] } })[0].estado, 'en la carta', 'una con el mismo nombre ya está')
  assert.equal(C.medidasPorDibujar(C.descartarMedida(ap.est, meds[0]), ej)[0].estado, 'descartada')

  // ── ogo-calco.js ──
  const t = K.utm(-18.865, -68.52)
  assert.deepEqual([t.zona, t.banda, Math.round(t.e), Math.round(t.n)], [19, 'K', 550561, 7914041])
  const g = K.geo(t.e, t.n, 19, true)
  assert.ok(Math.abs(g.lat + 18.865) < 1e-7 && Math.abs(g.lng + 68.52) < 1e-7, 'UTM ida y vuelta')
  const d = K.dibujo(ej)
  assert.deepEqual(d.cuenta, { areas: 2, limites: 1, lineas: 0, zonas: 0, puntos: 1, fichas: 4, pc: 0 }, 'el área (y el pedazo del CE-I), el límite, el objetivo, las 4 propias (el enemigo no)')
  assert.match(d.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1100" height="\d+"/)
  assert.match(d.svg, /stroke-width="3\.4"/, 'el Área de Operaciones, gruesa'); assert.match(d.svg, /stroke-dasharray="10 6"/, 'el pedazo del CE-I, punteado')
  assert.match(d.svg, />XXX</, 'la magnitud del límite'); assert.match(d.svg, />XXXX</); assert.match(d.svg, />FF\.TT\.T\.O\.</); assert.doesNotMatch(d.svg, /VI EJ/)
  assert.equal(d.cruces.length, 2); assert.deepEqual(d.cruces.map((x) => x.lugar), ['NO', 'SE'])
  assert.ok(d.cruces[0].e < d.cruces[1].e && d.cruces[0].n > d.cruces[1].n, 'noroeste y sudeste')
  assert.ok(d.cruces.every((x) => x.e % 10000 === 0 && x.n % 10000 === 0), 'sobre la cuadrícula (10 km para un Teatro)')
  assert.match(d.svg, new RegExp('>' + d.cruces[0].etiquetaE + '</text>[\\s\\S]*>' + d.cruces[0].etiquetaN + '</text>'))
  assert.match(d.pie, /Cruces de amarre \(cuadrícula UTM zona 19K, WGS-84\): Noroeste: \d{3} 000 E – 7 \d{3} 000 N {2}\(lat −18\.\d{4}, lng −69\.\d{4}\) Sudeste:/)
  assert.deepEqual(K.dibujo({ ops: {}, unidades: [] }).avisos, ['En la carta no hay Área de Operaciones ni fichas propias: no hay nada que dibujar en el calco.'])
  assert.match(K.dibujo({ ops: {}, unidades: ej.unidades }).avisos[0], /No hay ÁREA DE OPERACIONES/)
  assert.deepEqual(K.paraWord({ ancho: 1100, alto: 2200 }), { ancho: 320, alto: 640 }, 'un calco alto se achica para entrar en la hoja')
  assert.deepEqual(K.paraWord({ ancho: 1100, alto: 900 }), { ancho: 1100, alto: 900 })
  const dm = K.dibujo({ ...ej, ops: { ...ej.ops, limites: ej.ops.limites.concat(Object.values(am.capas.limites), [C.medidaAOps({ nombre: 'AE-1', tipo: 'area', coords: [[-18.66, -68.74], [-18.66, -68.69], [-18.71, -68.69]] }, ej).el]), objetivos: [C.medidaAOps({ nombre: 'OBJ 1', tipo: 'objetivo', lat: -18.55, lng: -68.95 }, ej).el] } })
  assert.match(dm.svg, />LF ALFA</, 'el calco rotula las líneas de la IA'); assert.match(dm.svg, />AE-1</); assert.match(dm.svg, /stroke-dasharray="8 5"/, 'el área, punteada'); assert.match(dm.svg, />OBJ 1</); assert.doesNotMatch(dm.svg, /OBJ OBJ/)

  // el Word del Anexo A, con la librería docx (si está)
  const docx = docxModule()
  if (docx) {
    const W = await import('../formato-militar/v1/word.js')
    W.configurarWord(docx)
    const JSZip = require('../../jszip.min.js')
    const png = fs.readFileSync(path.join(__dirname, '..', '..', 'escudo-eceme.png'))
    const x = O.cfgWord('calco', conCalco)
    const buf = await docx.Packer.toBuffer(W.crearWord(O.aSpec('calco', conCalco.docs.calco.texto, conCalco, { imagen: { data: png, ancho: 600, alto: 600 } }), x.cfg, x.padre))
    const z = await JSZip.loadAsync(buf)
    const txt = (await z.file('word/document.xml').async('string')).replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
    assert.match(txt, /^CTO\nFF\.TT\.T\.O\.\nCG\. Tunapa\. D-60 \(0800\)\nEMO\/SEC-III\nNo\. 002\/XYZ\.\nANEXO “A”\t\(Calco de Operaciones\) A LA ORDEN DE OPERACIONES No\. 01\n/)
    assert.match(txt, /APÉNDICES\t:\tS\/A\./); assert.doesNotMatch(txt, /REFERENCIAS|pendiente/i)
    assert.equal(Object.keys(z.files).filter((k) => /^word\/media\/.+/.test(k)).length, 1, 'con la imagen del calco')
  }
  console.log('ogo-coherencia.cjs OK — identidad (FF.TT.T.O. · CTO · Tunapa · CE-I, CE-II y CE-III), membrete «No. 002/XYZ.» y S/A., coherencia (pedido con ' + pc.length.toLocaleString('es') + ' caracteres, 3 documentos aplicados y vueltos atrás), ' + it.length + ' unidades por ubicar con ✓ Aceptar, calco con ' + d.cuenta.fichas + ' fichas y 2 cruces' + (docx ? '; Word del Anexo A con la imagen' : ''))
})().catch((e) => { console.error(e); process.exit(1) })
