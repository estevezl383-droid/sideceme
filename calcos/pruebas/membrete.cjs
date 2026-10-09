// Membrete táctico de los documentos militares (calcos/membrete/v1/), sin navegador:
//   · las iniciales del redactor (primer nombre + los dos apellidos) y la sección (EMO/SEC-…);
//   · la unidad considerada (RCB-1 por defecto) y su escalón superior (la unidad que
//     expidió la Orden), el CG = el pueblo más cercano a su ficha, en mayúsculas;
//   · la hora táctica de cada documento con la Línea de Tiempo REAL de la Mesa (MS);
//   · el número correlativo por sección (001, 002…);
//   · la R de SECRETO: dónde va la tabulación;
//   · lo que arma el compilado (rP y _ie reales): las cuatro líneas en los documentos
//     militares y las hojas de trabajo SIN membrete (el Word entero: e2e/membrete.cjs).
//
//   node membrete.cjs
const path = require('node:path')
const assert = require('node:assert/strict')
const { pathToFileURL } = require('node:url')
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const raiz = path.resolve(__dirname, '..')

let fallas = 0
async function caso(nombre, fn) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.stack || e.message).split('\n').slice(0, 6).join('\n      ')}`)
  }
}

// Un ejercicio como el del docente: la Orden la expidió la DIV.MEC.-1 (CG. VIACHA), y la
// unidad considerada es el RCB-1, cuya ficha está junto a PAMPA LOMA (lugares de prueba).
const ORDEN = { escalonSuperior: 'CE-I', unidad: 'DIV.MEC.-1', puestoMando: 'CG. VIACHA', vigencia: 'D-15 (2300)', clasificacion: 'SECRETO' }
const pueblo = (nombre, lng, lat) => ({ type: 'Feature', properties: { nombre }, geometry: { type: 'Point', coordinates: [lng, lat] } })
const CAPAS = { poblaciones_puntos: { type: 'FeatureCollection', features: [pueblo('Viacha', -68.3, -16.65), pueblo('Pampa Loma', -68.52, -16.81), pueblo('Otro Pueblo', -68.7, -16.9)] } }
const UNIDADES = [
  { id: 'div', bando: 'propias', tipo: 'unidad', designacion: 'DIV.MEC.-1', lat: -16.66, lng: -68.31 },
  { id: 'rcb', bando: 'propias', tipo: 'unidad', designacion: 'R.C.B.-1', lat: -16.8, lng: -68.5 },
  { id: 'rcb12', bando: 'propias', tipo: 'unidad', designacion: 'RCB-12', lat: -16.9, lng: -68.69 },
  { id: 'eno', bando: 'enemigo', tipo: 'unidad', designacion: 'RCB-1', lat: -16.9, lng: -68.7 },
]
const LINEA = { recepcion: 'D-15 (2000)', inicioOperacion: 'D (0500)', finOperaciones: 'D+2 (1800)' }

;(async () => {
  const M = await import(pathToFileURL(path.join(raiz, 'membrete', 'v1', 'membrete.js')).href)
  const mesa = cargarConDependencias(vigente(), ['MS'], (c) => c.MS(LINEA))
  const lt = mesa.MS(LINEA)
  const base = (extra = {}) => ({ ordenSup: ORDEN, unidades: UNIDADES, capas: CAPAS, g3: { lineaTiempo: LINEA }, usuario: 'SERGIO HERNAN MORALES MILLAS', ...extra })
  const preparar = (extra) => {
    M.reiniciar()
    M.configurar({ lineaDeTiempo: mesa.MS })
    M.sincronizar(base(extra))
  }
  console.log('\nMembrete táctico de los documentos militares (calcos/membrete/v1)\n')

  await caso('Iniciales: primer nombre + apellido paterno + materno, sin grado ni arma', () => {
    assert.equal(M.iniciales('SERGIO HERNAN MORALES MILLAS'), 'SMM')
    assert.equal(M.iniciales('TCNL. DEM. SERGIO HERNAN MORALES MILLAS'), 'SMM')
    assert.equal(M.iniciales('TCNL DEM Sergio Hernán Morales Millas'), 'SMM')
    assert.equal(M.iniciales('MORALES MILLAS, SERGIO HERNAN'), 'SMM')
    assert.equal(M.iniciales('Juan Pérez Rojas'), 'JPR')
    assert.equal(M.iniciales('MY. ART. JUAN CARLOS DE LA CRUZ ROJAS'), 'JCR')
    assert.equal(M.iniciales(''), '')
  })

  await caso('Sección: siempre EMO, la de la pestaña donde se elabora', () => {
    assert.equal(M.seccionEMO('E. M. G-1'), 'EMO/SEC-I')
    assert.equal(M.seccionEMO('E. M. G-2'), 'EMO/SEC-II')
    assert.equal(M.seccionEMO('EMO/SEC-III'), 'EMO/SEC-III')
    assert.equal(M.seccionEMO('EM. Sec. IV'), 'EMO/SEC-IV')
    assert.equal(M.seccionEMO('E. M. G-5'), 'EMO/SEC-V')
    assert.equal(M.seccionEMO('JEFATURA DE EM.'), 'EMO/JEM')
    assert.equal(M.seccionEMO('COMANDO'), 'EMO/JEM')
  })

  await caso('Documentos militares vs. hojas de trabajo', () => {
    for (const id of ['alerta', 'lineaTiempo', 'guiaInicial', 'prep1', 'ivr', 'riesgo', 'orientacionEM', 'intencion', 'guiaPlanificacion', 'prep2', 'rcic', 'pbi', 'controlOrden', 'bav', 'guiaFinal', 'prep3', 'opord', 'anexo']) assert.ok(M.esDocumentoMilitar(id), id)
    for (const id of ['ht1', 'ht7', 'tareas', 'limitaciones', 'hechos', 'potencia', 'decision', 'entrelazados', 'sincro']) assert.ok(!M.esDocumentoMilitar(id), id)
  })

  await caso('El caso del docente: DIV.MEC.-1 / RCB-1 CG. PAMPA LOMA hora / EMO/SEC-III / No. 001/SMM', () => {
    preparar()
    const c = M.campos({ unidad: 'DIV.MEC.-1', seccion: 'EMO/SEC-III', hoja: 'alerta' }, ORDEN)
    assert.equal(c.superior, 'DIV.MEC.-1')
    assert.equal(c.unidad, 'RCB-1')
    assert.equal(c.cg, 'CG. PAMPA LOMA')
    assert.equal(c.hora, lt.enDiaD(lt.recepcion))
    assert.equal(c.hora, 'D-15 (2000)')
    assert.equal(c.seccion, 'EMO/SEC-III')
    assert.equal(c.numero, '001/SMM')
    assert.deepEqual(M.lineasTexto(c), ['DIV.MEC.-1', 'RCB-1\tCG. PAMPA LOMA D-15 (2000)', 'EMO/SEC-III', 'No. 001/SMM'])
  })

  await caso('La ficha enemiga y el RCB-12 no son el RCB-1', () => {
    preparar({ unidades: UNIDADES.filter((u) => u.id !== 'rcb') })
    const c = M.campos({ seccion: 'EMO/SEC-III', hoja: 'alerta' })
    assert.equal(c.cg, M.CG_SIN_LUGAR)
    assert.match(c.fuentes.cg, /falta/)
  })

  await caso('Si la unidad considerada es la que expidió la Orden: su escalón superior y su CG de la Orden', () => {
    preparar({ ordenSup: { ...ORDEN, unidadPropia: 'DIV.MEC.-1' } })
    const c = M.campos({ seccion: 'E. M. G-2', hoja: 'pbi' })
    assert.equal(c.superior, 'CE-I')
    assert.equal(c.unidad, 'DIV.MEC.-1')
    assert.equal(c.cg, 'CG. VIACHA')
    assert.equal(c.seccion, 'EMO/SEC-II')
  })

  await caso('«CG de la unidad considerada» escrito en la Orden manda sobre la ficha; la clave escrita también', () => {
    preparar({ ordenSup: { ...ORDEN, puestoPropio: 'cg. estancia sunchal', clave: 'abc' } })
    const c = M.campos({ seccion: 'EMO/SEC-III', hoja: 'alerta' })
    assert.equal(c.cg, 'CG. ESTANCIA SUNCHAL')
    assert.equal(c.numero, '001/ABC')
  })

  await caso('Hora táctica: fase I en la recepción, las demás al terminar su fase en la Línea de Tiempo', () => {
    preparar()
    let t = lt.recepcion.getTime()
    const fin = lt.fases.map((f) => (t += f.ms || 0))
    assert.equal(M.campos({ hoja: 'prep1' }).hora, lt.enDiaD(lt.recepcion))
    assert.equal(M.campos({ hoja: 'prep2' }).hora, lt.enDiaD(new Date(fin[0]))) // fin del análisis de la misión
    assert.equal(M.campos({ hoja: 'prep3' }).hora, lt.enDiaD(new Date(fin[4]))) // fin de aprobar el CA
    assert.equal(M.campos({ hoja: 'opord' }).hora, lt.enDiaD(new Date(fin[5]))) // fin de elaborar la orden
    assert.match(M.campos({ hoja: 'prep2' }).hora, /^D-\d+ \(\d{4}\)$/)
    // Sin fase (una apreciación): ahora, si cae en el planeamiento; si no, su fin.
    const ahora = new Date(lt.recepcion.getTime() + 3600e3)
    assert.equal(M.campos({}, null, M.estadoActual(), ahora).hora, lt.enDiaD(ahora))
    assert.equal(M.campos({}, null, M.estadoActual(), new Date(2099, 0, 1)).hora, lt.enDiaD(lt.limitePlaneamiento))
    // Sin Línea de Tiempo, la hora queda vacía (nunca la de la Orden de otra unidad).
    preparar({ g3: {} })
    assert.equal(M.campos({ hoja: 'prep1' }).hora, '')
  })

  await caso('Número correlativo por sección: 001, 002… en el orden del PMTD', () => {
    preparar({
      g3: { lineaTiempo: LINEA, alerta: { 'I.- OBJETO': 'Alertar' }, prep1: { OBJETO: 'x' }, riesgo: { esquema: 'riesgo-v1', tareas: [{ tarea: 'Defender', peligros: [] }] }, tareas: [{ Tarea: 'hoja de trabajo' }] },
      hojasG: { g1: { rcic: [{ RCIC: 'Bajas' }] } },
    })
    const n = (hoja, seccion = 'EMO/SEC-III') => M.campos({ hoja, seccion }).numero
    assert.equal(n('alerta'), '001/SMM')
    assert.equal(n('prep1'), '003/SMM') // la Línea de Tiempo del G-3 también es un documento
    assert.equal(n('riesgo'), '004/SMM')
    assert.equal(n('prep2'), '005/SMM')
    assert.equal(n(undefined), '005/SMM') // una apreciación: después de todo lo expedido
    assert.equal(n('rcic', 'E. M. G-1'), '001/SMM')
    assert.equal(n('anexo', 'E. M. G-1'), '002/SMM')
    assert.equal(n('pbi', 'E. M. G-2'), '001/SMM')
    // Sin iniciales: sólo el número.
    preparar({ usuario: '' })
    assert.equal(M.campos({ hoja: 'alerta' }).numero, '001')
  })

  await caso('La R de SECRETO: la tabulación de la segunda línea', () => {
    // SECRETO en Arial 12 negrilla, centrado en 9407 twips: empieza en 4123 y la R en 4617.
    assert.equal(M.tabulacion({ clasificacion: 'SECRETO', anchoTexto: M.ANCHO_VERTICAL }), 4617)
    assert.equal(M.tabulacion({ clasificacion: 'SECRETO', anchoTexto: M.ANCHO_APAISADA }), 6700)
    assert.ok(Math.abs(M.porcentajeTab({ clasificacion: 'SECRETO' }) - 49.1) < 0.1)
  })

  await caso('Vista previa en HTML: Arial 10 negrilla, «CG.» a la altura de la R, «No.»', () => {
    preparar()
    const h = M.html(M.campos({ unidad: 'DIV.MEC.-1', seccion: 'EMO/SEC-III', hoja: 'alerta' }, ORDEN))
    assert.match(h, /font-size:10pt;font-weight:bold/)
    assert.match(h, /<span class="izq" style="display:inline-block;width:49\.1%">RCB-1<\/span><span class="der">CG\. PAMPA LOMA D-15 \(2000\)<\/span>/)
    assert.match(h, /No\. 001\/SMM/)
  })

  // ─── Lo que arma el compilado (rP y _ie reales) ─────────────────────────────────
  // El Word entero (W5e + la biblioteca docx) se prueba en el navegador: e2e/membrete.cjs.
  const w = cargarConDependencias(vigente(), ['_ie', 'rP', 'E2'], (c) => c.rP({ id: 'prep1', nom: 'x', responsable: 'G-3' }, { ordenSup: ORDEN }), { SIDMembrete: M.default })
  await caso('El compilado: un documento militar lleva las cuatro líneas (rP y _ie de la Mesa)', () => {
    preparar()
    const d = w.rP({ id: 'prep1', nom: 'Orden Preparatoria N° 1', responsable: 'G-3' }, { unidad: 'DIV.MEC.-1', seccion: 'E. M. G-3', ordenSup: ORDEN })
    // 002: la Línea de Tiempo del G-3 (ya cargada) es su documento 001.
    assert.deepEqual([...d.membrete], ['DIV.MEC.-1', 'RCB-1\tCG. PAMPA LOMA D-15 (2000)', 'EMO/SEC-III', 'No. 002/SMM'])
    assert.equal(d.clasificacion, 'SECRETO')
  })
  await caso('El compilado: una hoja de trabajo no lleva membrete', () => {
    preparar()
    assert.deepEqual([...w.rP({ id: 'ht7', nom: 'Análisis del terreno (OCOTA)' }, { seccion: 'E. M. G-2', ordenSup: ORDEN }).membrete], [])
    assert.deepEqual([...w.rP({ id: 'tareas', nom: 'Tareas' }, { seccion: 'E. M. G-1', ordenSup: ORDEN }).membrete], [])
  })

  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})()
