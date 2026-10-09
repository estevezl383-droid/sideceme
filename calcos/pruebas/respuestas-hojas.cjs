// Las respuestas de la IA en las HOJAS DE TRABAJO de siempre (renglones, dos listas,
// casillas), de TODAS las secciones. Lo pidió Sergio el 03-10-2026 con una captura de la
// F2·P3 del G-5 («Completar y mejorar»): «No se reconoció la respuesta», y dijo que era un
// error recurrente.
//   · EL PEDIDO (cU, SIDEMPedido y Boe REALES del compilado vigente): «FORMATO DE TU
//     RESPUESTA» es lo último que lee la IA, con la cabecera exacta de la tabla; si el
//     oficial escribe una indicación, después de ella va el recordatorio de que el formato
//     no cambia; lo mismo en una hoja del G-2 (sección no registrada en el motor);
//   · LA RESPUESTA (dU REAL del compilado vigente, con el motor): la tabla copiada de la
//     pantalla de la IA (tabuladores), con y sin cabecera; los renglones rotulados; los
//     títulos numerados con viñetas rotuladas; las listas por tipo con « — »; los rótulos en
//     el mismo renglón; el «(Implícita)» entre paréntesis; el título en negrita con su
//     párrafo (como la captura); el JSON cortado; { "tareas": […] } con las claves sin
//     tildes o con sinónimos; las dos listas con «Hecho:» o { "hechos": […] }; las casillas
//     con tabuladores, en tabla, o con la clave sin tildes; los párrafos sueltos; y que una
//     negativa siga dando el error.
//
//   node respuestas-hojas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { vigente, cargar } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')

const RAIZ = path.join(__dirname, '..')
const VIG = vigente()
const V = (fs.readFileSync(VIG, 'utf8').match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js"/) || [])[1]
let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])

;(async () => {
  console.log(`compilado: ${path.basename(VIG)} · motor: calcos/estado-mayor/${V}`)
  const R = await import('file://' + path.join(RAIZ, `estado-mayor/${V}/registro.js`))
  const L = await import('file://' + path.join(RAIZ, `estado-mayor/${V}/lector.js`))
  const RT = await import('file://' + path.join(RAIZ, `estado-mayor/${V}/runtime.js`))
  RT.sincronizarEM({})
  const ganchos = { SIDEMEs: R.esDocumento, SIDEMTexto: R.textoDocumento, SIDEMTiene: R.tieneDocumento, SIDLogTexto: () => '', SIDLogTiene: () => false, SIDEMRescatar: R.rescatarHoja, SIDLogEs: () => false, SIDEMCelda: R.celdaFila, SIDEMFilasDe: R.filasDeRespuesta, SIDEMListas: R.listasDe, SIDEMClave: R.claveCasilla, SIDEMIndicacion: R.cierreIndicacion, SIDEMPedido: R.pedidoHoja, SIDEMTabla: R.tablaDeRespuesta || ((g) => g) }
  const { SIDuN0, Nx } = cargar(VIG, ['SIDuN0', 'Nx'])
  const hojaDe = (g, id) => JSON.parse(JSON.stringify(SIDuN0(Nx[g]).flatMap((f) => f.hojas).find((h) => h.id === id)))
  const TAREAS = hojaDe('g5', 'tareas')
  const HECHOS = hojaDe('g5', 'hechos')
  const POTENCIA = hojaDe('g5', 'potencia')
  const mesa = cargarConDependencias(VIG, ['dU', 'cU', 'Boe'], (c) => {
    c.dU('[{"Tarea":"x"}]', TAREAS)
    c.dU('{"a":["x"],"b":[]}', HECHOS)
    c.dU(JSON.stringify({ [POTENCIA.campos[0]]: 'x' }), POTENCIA)
    c.cU(TAREAS, [], { expediente: 'EXP', modo: 'completar_mejorar', seccion: 'G-5' })
    c.cU(POTENCIA, {}, { expediente: 'EXP', seccion: 'G-5' })
    c.Boe('P', 'I')
  }, ganchos)
  const leer = (texto, hoja = TAREAS) => {
    const r = mesa.dU(texto, hoja)
    assert.ok(r.ok, r.error)
    return JSON.parse(JSON.stringify(r.datos))
  }

  // ── EL PEDIDO ─────────────────────────────────────────────────────────────────────
  caso('el pedido de una hoja de renglones TERMINA con el formato y la cabecera exacta de la tabla', () => {
    const r = R.pedidoHoja('g5', TAREAS, mesa.cU(TAREAS, [{ Tarea: 'A', Tipo: 'Esencial' }], { expediente: 'EXP', modo: 'completar_mejorar', seccion: 'G-5' }))
    assert.ok(r.ok)
    const p = r.prompt
    const i = p.lastIndexOf('# CÓMO CONTESTAR')
    const f = p.lastIndexOf('# FORMATO DE TU RESPUESTA')
    assert.ok(i > 0 && f > i, 'el formato va después de «CÓMO CONTESTAR»')
    const fin = p.slice(f)
    for (const t of ['SÓLO el bloque de código ```json', '«para exponer»', 'DENTRO de los textos del JSON', '| Tarea | Tipo | De dónde sale | Quién la ejecuta |', '|---|---|---|---|', 'nada de párrafos sueltos']) assert.ok(fin.includes(t), `final del pedido: falta «${t}»`)
    assert.ok(!/\n# /.test(fin.slice(2)), 'no hay nada después del formato')
    assert.ok(p.indexOf('LO QUE LA MESA YA CALCULÓ') < i, 'lo de la Mesa va antes de «CÓMO CONTESTAR»')
  })
  caso('con la indicación del oficial (Boe REAL): después va el recordatorio de que el formato NO cambia', () => {
    const base = R.pedidoHoja('g5', TAREAS, mesa.cU(TAREAS, [], { expediente: 'EXP', seccion: 'G-5' })).prompt
    const p = mesa.Boe(base, 'Escribilo para exponer en 3 minutos')
    const a = p.indexOf('# FORMATO DE TU RESPUESTA')
    const b = p.indexOf('# INDICACIÓN DEL OFICIAL')
    const c = p.indexOf('# EL FORMATO DE TU RESPUESTA NO CAMBIA')
    assert.ok(a > 0 && b > a && c > b, 'formato → indicación → recordatorio')
    assert.ok(p.slice(b).includes('Escribilo para exponer en 3 minutos'))
    assert.match(p.slice(c), /cambia QUÉ escribís y CÓMO lo redactás[\s\S]*NO cambia el FORMATO[\s\S]*```json/)
    assert.equal(mesa.Boe(base, '   '), base, 'sin indicación, el pedido queda igual')
  })
  caso('una hoja del G-2 (sección sin motor) también termina con el formato; una de casillas, con «Casilla: texto»', () => {
    const hg2 = hojaDe('g5', 'rcic')
    const r = R.pedidoHoja('g2', hg2, { ok: true, prompt: 'PEDIDO\n\n# CÓMO CONTESTAR\n\nJSON', forma: 'filas' })
    assert.ok(r.prompt.startsWith('PEDIDO\n\n# CÓMO CONTESTAR'))
    assert.ok(r.prompt.endsWith('pueden no entrar.'))
    assert.ok(r.prompt.includes('| Requerimiento | Por qué es crítico | Quién lo busca | Para cuándo |'))
    const rc = R.pedidoHoja('g5', POTENCIA, mesa.cU(POTENCIA, {}, { expediente: 'EXP', seccion: 'G-5' }))
    assert.match(rc.prompt.slice(rc.prompt.lastIndexOf('# FORMATO DE TU RESPUESTA')), /«Nombre EXACTO de la casilla: texto»/)
  })

  // ── LA RESPUESTA: HOJAS DE RENGLONES ──────────────────────────────────────────────
  const COLA = 'Permite la obtención de información local oportuna, neutraliza posibles infiltraciones en el área de servicios y consolida el control gubernamental de la retaguardia. SIN DATO – verificar nombres de autoridades originarias designadas.'
  caso('la tabla COPIADA DE LA PANTALLA de la IA (tabuladores), con cabecera', () => {
    const t = `Acá van las tareas:\n\nTarea\tTipo\tDe dónde sale\tQuién la ejecuta\nEvacuar 3780 personas por medios civiles\tEspecífica\tOrden N° 3\tSección de AC\nEstablecer el enlace con las autoridades originarias\tImplícita\tSecuencia de planeamiento (paso 4)\tEquipo de Gobierno. ${COLA}\n`
    const d = leer(t)
    assert.equal(d.length, 2)
    assert.deepEqual(d[0], { Tarea: 'Evacuar 3780 personas por medios civiles', Tipo: 'Específica', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'Sección de AC' })
    assert.ok(d[1]['Quién la ejecuta'].endsWith('autoridades originarias designadas.'))
  })
  caso('la tabla de la pantalla con otros nombres de columna (N°, Fuente, Responsable) y sin cabecera', () => {
    const d = leer('N°\tTarea\tTipo\tFuente\tResponsable\n1\tClasificar los recursos\tImplícita\tCalco\tG-5\n2\tSeñalar los bienes protegidos\tImplícita\tDICA\tG-5 con el G-3')
    assert.deepEqual(d[1], { Tarea: 'Señalar los bienes protegidos', Tipo: 'Implícita', 'De dónde sale': 'DICA', 'Quién la ejecuta': 'G-5 con el G-3' })
    const s = leer('Clasificar los recursos\tImplícita\tCalco\tG-5\nEvacuar\tEspecífica\tOrden\tSección de AC')
    assert.equal(s[1]['Quién la ejecuta'], 'Sección de AC')
  })
  caso('la tabla de Markdown con nombres aproximados de columna', () => {
    const d = leer('| # | Tarea | Tipo | Origen | Responsable |\n|---|---|---|---|---|\n| 1 | Evacuar | Específica | Orden | Sección de AC |')
    assert.deepEqual(d, [{ Tarea: 'Evacuar', Tipo: 'Específica', 'De dónde sale': 'Orden', 'Quién la ejecuta': 'Sección de AC' }])
  })
  caso('renglones ROTULADOS en negrita, uno debajo del otro (y el párrafo que sigue va con el último rótulo)', () => {
    const t = `**Tarea 1:** Establecer el enlace con las autoridades originarias\n**Tipo:** Implícita\n**De dónde sale:** Secuencia de planeamiento de AC/GM (paso 4)\n**Quién la ejecuta:** Equipo de Gobierno.\n${COLA}\n\n**Tarea 2:** Evacuar 3780 personas\n**Tipo:** Específica\n**De dónde sale:** Orden N° 3\n**Quién la ejecuta:** Sección de AC`
    const d = leer(t)
    assert.equal(d.length, 2)
    assert.equal(d[0].Tarea, 'Establecer el enlace con las autoridades originarias')
    assert.equal(d[0].Tipo, 'Implícita')
    assert.ok(d[0]['Quién la ejecuta'].startsWith('Equipo de Gobierno.\nPermite la obtención'))
    assert.equal(d[1]['De dónde sale'], 'Orden N° 3')
  })
  caso('un título numerado y debajo viñetas rotuladas con sinónimos', () => {
    const d = leer('### 1. Establecer el enlace con las autoridades\n- Tipo: Implícita\n- Origen: Orden N° 3\n- Responsable: G-5\n\n### 2. Clasificar los recursos\n- Tipo: Implícita\n- Fuente: Calco\n- Responsable: Sección de AC')
    assert.deepEqual(d, [
      { Tarea: 'Establecer el enlace con las autoridades', Tipo: 'Implícita', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'G-5' },
      { Tarea: 'Clasificar los recursos', Tipo: 'Implícita', 'De dónde sale': 'Calco', 'Quién la ejecuta': 'Sección de AC' },
    ])
  })
  caso('listas agrupadas por TIPO («Tareas específicas») con « — » entre columnas', () => {
    const d = leer('**Tareas específicas**\n1. Evacuar la población de PUEBLO-X — Orden N° 3 — Sección de AC\n\n**Tareas implícitas**\n1. Clasificar los recursos — Calco — G-5\n2. Establecer el enlace con las autoridades (Paso 4 — Equipo de Gobierno)\n\n**Tareas esenciales**\n- Mantener el orden público en PUEBLO-X')
    assert.deepEqual(d[0], { Tarea: 'Evacuar la población de PUEBLO-X', Tipo: 'Específica', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'Sección de AC' })
    assert.deepEqual(d[1], { Tarea: 'Clasificar los recursos', Tipo: 'Implícita', 'De dónde sale': 'Calco', 'Quién la ejecuta': 'G-5' })
    assert.deepEqual(d[2], { Tarea: 'Establecer el enlace con las autoridades', Tipo: 'Implícita', 'De dónde sale': 'Paso 4', 'Quién la ejecuta': 'Equipo de Gobierno' })
    assert.deepEqual(d[3], { Tarea: 'Mantener el orden público en PUEBLO-X', Tipo: 'Esencial' })
  })
  caso('rótulos en el mismo renglón de la lista', () => {
    const d = leer('1. Evacuar 3780 personas. Tipo: Específica. Fuente: Orden N° 3. Responsable: Sección de AC.\n2. Clasificar los recursos. Tipo: Implícita. Fuente: Calco. Responsable: G-5.')
    assert.deepEqual(d[0], { Tarea: 'Evacuar 3780 personas.', Tipo: 'Específica.', 'De dónde sale': 'Orden N° 3.', 'Quién la ejecuta': 'Sección de AC.' })
    assert.equal(d[1]['Quién la ejecuta'], 'G-5.')
  })
  caso('como la captura: título numerado en negrita con «(Implícita)» y su párrafo debajo', () => {
    const t = `Claro, mi Coronel. Las tareas reescritas:\n\n**1. Establecer el enlace con las autoridades originarias (Implícita).**\n${COLA}\n\n**2. Evacuar 3780 personas por medios civiles (Específica).**\nLa columna no usa el EPA: evita interferir con el apoyo logístico.`
    const d = leer(t)
    assert.equal(d.length, 2)
    assert.equal(d[0].Tipo, 'Implícita')
    assert.ok(d[0].Tarea.startsWith('Establecer el enlace con las autoridades originarias. Permite la obtención'), d[0].Tarea)
    assert.ok(d[0].Tarea.endsWith('autoridades originarias designadas.'))
    assert.equal(d[1].Tipo, 'Específica')
  })
  caso('el JSON cortado por el largo: entran los renglones completos', () => {
    const d = leer('```json\n[\n  { "Tarea": "Evacuar", "Tipo": "Específica", "De dónde sale": "Orden", "Quién la ejecuta": "AC" },\n  { "Tarea": "Clasificar", "Tipo": "Implícita", "De dónde sale": "Calco", "Quién la ejecuta": "G-5" },\n  { "Tarea": "Señal')
    assert.deepEqual(d.map((x) => x.Tarea), ['Evacuar', 'Clasificar'])
  })
  caso('el JSON con otra forma: { "tareas": [ … ] }, claves sin tildes, en minúsculas o con sinónimos', () => {
    const d = leer('```json\n{ "tareas": [ { "tarea": "Evacuar", "tipo": "Específica", "fuente": "Orden N° 3", "responsable": "Sección de AC" }, { "Tarea": "Clasificar", "Tipo": "Implícita", "De donde sale": "Calco", "Quien la ejecuta": "G-5" } ] }\n```')
    assert.deepEqual(d, [
      { Tarea: 'Evacuar', Tipo: 'Específica', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'Sección de AC' },
      { Tarea: 'Clasificar', Tipo: 'Implícita', 'De dónde sale': 'Calco', 'Quién la ejecuta': 'G-5' },
    ])
    assert.deepEqual(leer('{ "Tarea": "Una sola", "Tipo": "Esencial" }'), [{ Tarea: 'Una sola', Tipo: 'Esencial' }], 'un solo renglón suelto')
  })
  caso('párrafos sueltos: cada párrafo con contenido es un renglón (sin el saludo)', () => {
    const d = leer('Acá van las tareas:\n\nEstablecer el enlace con las autoridades originarias de PUEBLO-X para obtener información local.\n\nEvacuar a la población de PUEBLO-X por el eje humanitario hasta el Local de Destino Seguro.\n\nEspero que sirva.')
    assert.equal(d.length, 2)
    assert.match(d[1].Tarea, /^Evacuar a la población/)
  })
  caso('una negativa o un texto sin contenido sigue dando el error (no se inventan renglones)', () => {
    for (const t of ['Lo siento, no puedo ayudar con eso.', 'nada', 'Claro, ¿qué necesitás?']) {
      const r = mesa.dU(t, TAREAS)
      assert.equal(r.ok, false, t)
      assert.match(r.error, /No se reconoció la respuesta/)
    }
  })
  caso('lo que ya entraba sigue entrando igual (JSON exacto y tabla de Markdown)', () => {
    assert.deepEqual(leer('```json\n[{"Tarea":"A","Tipo":"Implícita","De dónde sale":"B","Quién la ejecuta":"C"}]\n```'), [{ Tarea: 'A', Tipo: 'Implícita', 'De dónde sale': 'B', 'Quién la ejecuta': 'C' }])
    assert.deepEqual(leer('| Tarea | Tipo |\n|---|---|\n| A | Implícita |'), [{ Tarea: 'A', Tipo: 'Implícita' }])
  })

  // ── DOS LISTAS Y CASILLAS ─────────────────────────────────────────────────────────
  caso('dos listas: «- Hecho: …» / «- Suposición: …», y { "hechos": […], "suposiciones": […] }', () => {
    assert.deepEqual(leer('- Hecho: Hay 12.600 habitantes.\n- Suposición: Se evacua el 30 %.\n- HECHO: Hay un LDS.', HECHOS), { a: ['Hay 12.600 habitantes.', 'Hay un LDS.'], b: ['Se evacua el 30 %.'] })
    assert.deepEqual(leer('```json\n{ "hechos": ["Hay 12.600 habitantes."], "suposiciones": ["Se evacua el 30 %."] }\n```', HECHOS), { a: ['Hay 12.600 habitantes.'], b: ['Se evacua el 30 %.'] })
    assert.deepEqual(leer('**🔵 HECHOS (verificados)**\n- A.\n\n**🟡 SUPOSICIONES (a confirmar)**\n- B.', HECHOS), { a: ['A.'], b: ['B.'] }, 'lo de antes')
  })
  caso('casillas: «Casilla<TAB>texto», la tabla «Casilla | Texto» y la clave JSON sin tildes ni mayúsculas', () => {
    const [c0, c1] = POTENCIA.campos
    assert.deepEqual(leer(`${c0}\tRecursos locales explotables.\n${c1}\t3780 evacuados.`, POTENCIA), { [c0]: 'Recursos locales explotables.', [c1]: '3780 evacuados.' })
    assert.deepEqual(leer(`| Casilla | Texto |\n|---|---|\n| ${c0} | Recursos. |\n| ${c1} | Evacuados. |`, POTENCIA), { [c0]: 'Recursos.', [c1]: 'Evacuados.' })
    assert.deepEqual(leer(JSON.stringify({ [c0.toLowerCase()]: 'Recursos.', 'Conclusion para el planeamiento': 'Se apoya.' }), POTENCIA), { [c0]: 'Recursos.', 'Conclusión para el planeamiento': 'Se apoya.' })
  })

  for (const [nombre, f] of casos) {
    try {
      await f()
      console.log(`✓ ${nombre}`)
    } catch (e) {
      fallos++
      console.error(`✗ ${nombre}\n  ${e.message}`)
    }
  }
  console.log(fallos ? `${fallos} FALLO(S)` : `OK — ${casos.length} casos`)
  process.exit(fallos ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
