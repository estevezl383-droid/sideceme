// F3·P1 — H.T. POTENCIA RELATIVA DE COMBATE del G-3 (06-10-2026). Lo pidió Sergio con una
// captura: «Completar y mejorar» con las fases de la defensa en la indicación; la IA escribió
// una Orden General de Operaciones, cerró con «¿Desea que profundicemos…?», y al pegar ese
// final la Mesa dijo «No se reconoció la respuesta». Mandó el .docx de la Escuela, un ejemplo
// llenado y el texto doctrinario (Pasos 1, 2 y 3). Se prueba con las funciones REALES del
// compilado vigente y el motor (calcos/estado-mayor/v5):
//   · LA HOJA: la del .docx (5 columnas × 5 filas), la guía con los tres pasos, y lo escrito
//     con la forma vieja (8 sistemas operativos) que pasa a la nueva sin perder nada;
//   · 🌱 (l3e): unidades de cada bando, relación de fuerzas, fuegos y alcances,
//     reconocimiento, en las filas y columnas nuevas;
//   · EL PEDIDO (cU + SIDEMPedidoG3 + Boe): el expediente, lo que contó la Mesa, el G-2, los
//     aportes de las secciones, la doctrina, cómo se llena cada columna, las fases, el
//     ejemplo de la Escuela, «no escribas otro documento ni cierres con preguntas», y al
//     final el formato (JSON por fila o la tabla con la cabecera exacta) y la indicación;
//   · LA RESPUESTA (dU + sP): JSON por fila, en lista, plano, la tabla de Markdown, la tabla
//     copiada de la pantalla, los títulos por fila; sólo completar no pisa;
//   · EL ERROR: lo pegado de la captura (sólo la pregunta final) dice qué pasó;
//   · EL WORD (Aoe → docxPRC): apaisado, carta, el título, la cabecera del .docx, las cinco
//     filas, sin la marca de la IA, el pie «N - M».
//
//   node prc.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')

const RAIZ = path.join(__dirname, '..')
const VIG = vigente()
const V = (fs.readFileSync(VIG, 'utf8').match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js"/) || [])[1]
const ANTERIOR = path.join(RAIZ, 'assets', 'index-tablero-g4-20261003.js')
const NUEVO = path.join(RAIZ, 'assets', 'index-prc-20261006.js')
const SALIDA = path.join(__dirname, 'salidas-prc')
let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])
const plano = (x) => JSON.parse(JSON.stringify(x))

const { UNIDADES, VIEJA, PEGADO_CAPTURA, RESPUESTA_FUERA_DE_TEMA, INDICACION, RESPUESTA_JSON, CABECERA } = require('./prc-ejemplo.js')

;(async () => {
  console.log(`compilado: ${path.basename(VIG)} · motor: calcos/estado-mayor/${V}`)
  const R = await import('file://' + path.join(RAIZ, `estado-mayor/${V}/registro.js`))
  const P = await import('file://' + path.join(RAIZ, `estado-mayor/${V}/prc.js`))
  const RT = await import('file://' + path.join(RAIZ, `estado-mayor/${V}/runtime.js`))
  RT.sincronizarEM({ hojasG: { g4: { potencia: { 'Lo que este campo APORTA a la potencia propia': 'Munición para 5 DOS en la ZRA (FICT.). [IA — verificar]' } } } })
  const ganchos = {
    SIDEMEs: R.esDocumento, SIDEMTexto: R.textoDocumento, SIDEMTiene: R.tieneDocumento, SIDLogTexto: () => '', SIDLogTiene: () => false, SIDEMRescatar: R.rescatarHoja, SIDLogEs: () => false,
    SIDEMCelda: R.celdaFila, SIDEMFilasDe: R.filasDeRespuesta, SIDEMListas: R.listasDe, SIDEMClave: R.claveCasilla, SIDEMIndicacion: R.cierreIndicacion, SIDEMPedido: R.pedidoHoja, SIDEMTabla: R.tablaDeRespuesta,
    SIDRiesgoFusionable: () => false, SIDRecoFusionable: () => false,
  }
  const mesa = cargarConDependencias(VIG, ['VM', 'ese', 'l3e', 'cU', 'dU', 'Boe', 'sP', 'KS'], (c) => {
    c.VM('potencia')
    c.ese('potencia')
    c.l3e('potencia', { unidades: UNIDADES })
    c.cU(c.VM('potencia'), {}, { expediente: 'EXP', seccion: 'G-3' })
    c.dU('{"MANIOBRA":"x"}', c.VM('potencia'))
    c.Boe('P', 'I')
    c.sP({ a: {} }, { a: { b: 'c' } })
  }, ganchos)
  const HOJA = plano(mesa.VM('potencia'))
  const claves = mesa.KS(HOJA).claves.map((c) => c.k)
  const leer = (texto, previo = {}) => mesa.dU(texto, HOJA, {}, previo)

  // ── LA HOJA ────────────────────────────────────────────────────────────────────────
  caso('la hoja del G-3 es la del .docx de la Escuela: 5 columnas × 5 filas, tipo «tabla»', () => {
    assert.equal(HOJA.tipo, 'tabla')
    assert.deepEqual(HOJA.cols, ['Potencia de combate', 'Fuerzas enemigas', 'Fuerzas propias', 'Deducciones', 'Tácticas, técnicas y procedimientos (TTP.)'])
    assert.deepEqual(HOJA.filas, ['MANIOBRA', 'POTENCIA DE FUEGO', 'PROTECCIÓN', 'LIDERAZGO', 'INFORMACIÓN E INTELIGENCIA'])
    assert.deepEqual(HOJA.cols, P.COLS)
    assert.deepEqual(HOJA.filas, P.FILAS)
    assert.ok(P.esPRC(HOJA))
    assert.equal(claves.length, 20)
    assert.ok(claves.includes('MANIOBRA') && claves.includes('LIDERAZGO|Tácticas, técnicas y procedimientos (TTP.)'))
    assert.match(HOJA.nota, /puntos fuertes \(\+\) y débiles \(-\)/)
  })
  caso('la guía 📘 es la de los Pasos 1, 2 y 3 (la misma de prc.js)', () => {
    const g = plano(mesa.ese('potencia'))
    assert.deepEqual(g, plano(P.GUIA))
    assert.ok(g.como.some((x) => /^Paso 1/.test(x)) && g.como.some((x) => /^Paso 2/.test(x)) && g.como.some((x) => /^Paso 3/.test(x)))
    assert.doesNotMatch(JSON.stringify(g), /sistema operativo/i)
  })
  caso('lo escrito con la forma vieja pasa a la de la Escuela sin perder nada (y el mismo objeto si no hay nada que migrar)', () => {
    const g3 = { potencia: VIEJA, mision: { x: 'y' } }
    const m = R.migrarG3(g3)
    assert.equal(R.migrarG3(g3), m, 'el mismo migrado para el mismo objeto')
    assert.equal(m.mision, g3.mision)
    const v = m.potencia
    assert.equal(v['MANIOBRA|Fuerzas propias'], '4 unidad(es) propias contra 5 enemigas.')
    assert.equal(v.MANIOBRA, '5')
    assert.match(v['MANIOBRA|Deducciones'], /Relación 1 : 1.9/)
    assert.match(v['POTENCIA DE FUEGO|Fuerzas propias'], /^Apoyo de fuegos: 1 unidad/)
    assert.match(v['PROTECCIÓN|Fuerzas propias'], /^Defensa antiaérea: Sección AA/)
    assert.match(v['PROTECCIÓN|Deducciones'], /^Movilidad \/ contramovilidad \/ supervivencia: Al enemigo/)
    assert.match(v.LIDERAZGO, /^Factores intangibles: Conscriptos/)
    assert.ok(Object.keys(v).every((k) => claves.includes(k)), Object.keys(v).join(', '))
    const nueva = { potencia: { MANIOBRA: '+X' } }
    assert.equal(R.migrarG3(nueva), nueva)
    assert.equal(R.migrarG3(undefined), undefined)
  })

  // ── 🌱 ─────────────────────────────────────────────────────────────────────────────
  caso('🌱 trae del calco lo que la Mesa sabe contar, en las filas y columnas nuevas', () => {
    const s = plano(mesa.l3e('potencia', { unidades: UNIDADES }))
    assert.ok(Object.keys(s).every((k) => claves.includes(k)), Object.keys(s).join(', '))
    assert.match(s.MANIOBRA, /^Unidades enemigas en el calco: 5 \(BIM-41 \(FICT\.\)/)
    assert.match(s['MANIOBRA|Fuerzas propias'], /^Unidades propias en el calco: 4 /)
    assert.match(s['MANIOBRA|Deducciones'], /^Relación de fuerzas con las fichas del calco: 1 : /)
    assert.match(s['POTENCIA DE FUEGO'], /Cía\. Mort\. 120 \(FICT\.\).*mayor alcance/)
    assert.match(s['POTENCIA DE FUEGO|Fuerzas propias'], /GA-3/)
    assert.match(s['POTENCIA DE FUEGO|Deducciones'], /alcance/)
    assert.match(s['INFORMACIÓN E INTELIGENCIA|Fuerzas propias'], /RC-1/)
    assert.match(s['INFORMACIÓN E INTELIGENCIA'], /Esc\. Rec\. Mec\./)
    assert.equal(s.LIDERAZGO, undefined, 'lo intangible no sale del calco')
    assert.deepEqual(plano(mesa.l3e('potencia', { unidades: [] })), {})
  })

  // ── EL PEDIDO ──────────────────────────────────────────────────────────────────────
  const pedir = (valor, modo, indicacion = '') => {
    const r = R.pedidoG3(HOJA, valor, mesa.cU(HOJA, valor, { expediente: 'EXPEDIENTE (FICT.): Orden de Operaciones N° 4 de la DE-9. Documento aportado: «Estudio del enemigo mecanizado».', ayuda: mesa.ese('potencia'), modo, seccion: 'EM. Sec. G-3 (Operaciones)' }), {
      expediente: 'EXPEDIENTE (FICT.): Orden de Operaciones N° 4 de la DE-9. Documento aportado: «Estudio del enemigo mecanizado».',
      modo,
      semilla: () => mesa.l3e('potencia', { unidades: UNIDADES }),
      g2: { hay: true, probable: 'AA-2 (FICT.)', peligroso: 'AA-1 (FICT.)', mision: 'Atacar para conquistar el puente (FICT.)' },
    })
    return { ...r, final: mesa.Boe(r.prompt, indicacion) }
  }
  caso('el pedido de la PRC lleva el expediente, lo del calco, el G-2, los aportes y la doctrina de la Escuela', () => {
    const r = pedir({}, 'completar_mejorar')
    assert.ok(r.ok, r.error)
    const p = r.prompt
    // lo PRIMERO es la tarea y el formato (Gemini analizaba el expediente y no hacía la hoja)
    assert.match(p, /^Sos OFICIAL DE ESTADO MAYOR del Ejército de Bolivia \(ECEME\), en la sección G-3\. ESTO ES UN PEDIDO, NO UN DOCUMENTO PARA ANALIZAR NI RESUMIR\./)
    const tarea = p.indexOf('# TU ÚNICA TAREA')
    assert.ok(tarea > 0 && tarea < p.indexOf('===== INICIO DEL EXPEDIENTE ====='), 'la tarea antes del expediente')
    assert.ok(p.slice(tarea, tarea + 1500).includes('NO escribas: análisis METT-TC u OCOKA, «conclusiones y decisiones», la Orden de Operaciones'))
    assert.ok(p.includes('CONTEXTO — ESTO ES UN EJERCICIO ACADÉMICO'), 'el encabezado de la Mesa sigue')
    const ini = p.indexOf('===== INICIO DEL EXPEDIENTE =====')
    const fin = p.indexOf('===== FIN DEL EXPEDIENTE')
    assert.ok(ini > 0 && fin > ini && p.slice(ini, fin).includes('Documento aportado: «Estudio del enemigo mecanizado»'), 'el expediente entre marcas')
    assert.ok(fin < p.indexOf('# LA DOCTRINA'))
    assert.ok(p.includes('Documento aportado: «Estudio del enemigo mecanizado»'))
    assert.ok(p.includes('# LO QUE LA MESA YA CONTÓ CON LAS FICHAS DEL CALCO'))
    assert.ok(p.includes('- MANIOBRA › Fuerzas enemigas: Unidades enemigas en el calco: 5'))
    assert.ok(p.includes('Curso de acción enemigo MÁS PROBABLE: AA-2 (FICT.)'))
    assert.ok(p.includes('## G-4 Logística') && p.includes('Munición para 5 DOS en la ZRA (FICT.).') && !/ZRA \(FICT\.\)\. \[IA/.test(p), 'los aportes, sin la marca de la IA')
    for (const t of ['1) Paso 1. La PRC. emplea la dinámica de la potencia de combate', '2) Paso 2. Es el proceso de comparación', '3) Paso 3. Los resultados de esta comparación se registran como deducciones', 'razonamiento inductivo'])
      assert.ok(p.includes(t), `falta «${t}»`)
    for (const t of ['«+» adelante si es un PUNTO FUERTE, «-» si es un PUNTO DÉBIL', 'DEDUCCIONES — Paso 2', 'TÁCTICAS, TÉCNICAS Y PROCEDIMIENTOS (TTP.) — Paso 3', 'SI LA OPERACIÓN TIENE FASES', '«Fase de canalización: …»', 'INFORMACIÓN E INTELIGENCIA: reconocimiento y vigilancia'])
      assert.ok(p.includes(t), `falta «${t}»`)
    assert.ok(p.includes('| Maniobra | +Velocidad en la carretera.<br>+Movilidad táctica.'), 'el ejemplo de la Escuela')
    assert.ok(p.includes('NO lo copies'))
    assert.ok(p.includes('No escribas otro documento: ni la Orden de Operaciones, ni la matriz de sincronización'))
    assert.ok(p.includes('No termines con preguntas ni ofrezcas seguir («¿Desea que profundicemos…?»)'))
    assert.ok(!p.includes('BUSCÁ EN LA WEB'), 'la web no sirve para un enemigo supuesto')
    assert.ok(!/MANIOBRA\|ENEMIGO|Sistema operativo/.test(p))
    assert.equal(r.campos.length, 20)
  })
  caso('el pedido TERMINA con el formato: el JSON por fila y, si no, la tabla con la cabecera exacta; después, la indicación y el recordatorio', () => {
    const r = pedir({}, 'completar_mejorar', INDICACION)
    const i = r.prompt.lastIndexOf('# CÓMO CONTESTAR — FORMATO DE TU RESPUESTA')
    assert.ok(i > r.prompt.lastIndexOf('# LA DOCTRINA') && i > r.prompt.lastIndexOf('# QUÉ NO HACER'))
    const fin = r.prompt.slice(i)
    for (const t of ['```json', '"MANIOBRA": {', '"enemigas":', '"ttp":', '"INFORMACIÓN E INTELIGENCIA": {', CABECERA, '|---|---|---|---|---|', '| LIDERAZGO | +…<br>-…', 'Nada antes ni después', 'ANTES DE ENVIAR, revisá: ¿tu respuesta empieza con ```json?'])
      assert.ok(fin.includes(t), `final del pedido: falta «${t}»`)
    const f = r.final
    assert.ok(f.indexOf(INDICACION) > f.indexOf(CABECERA), 'la indicación va después del formato')
    assert.match(f.slice(f.indexOf(INDICACION)), /# EL FORMATO DE TU RESPUESTA NO CAMBIA/)
    // y el ejemplo del JSON del pedido se lee entero
    const ej = /```json\n([\s\S]*?)\n```/.exec(fin)[1]
    assert.equal(Object.keys(R.tablaDeRespuesta(JSON.parse(ej), HOJA)).length, 20)
  })
  caso('sólo completar: pide SÓLO las celdas vacías y muestra lo escrito; con todo escrito avisa', () => {
    const v = { MANIOBRA: '+Movilidad. [IA — verificar]', 'MANIOBRA|Fuerzas propias': '+Terreno.' }
    const r = pedir(v, 'completar')
    assert.ok(r.ok)
    assert.equal(r.campos.length, 18)
    assert.ok(r.prompt.includes('- MANIOBRA › Deducciones') && !r.prompt.includes('- MANIOBRA › Fuerzas enemigas\n'))
    assert.ok(r.prompt.includes('- Fuerzas enemigas: +Movilidad.') && !r.prompt.includes('+Movilidad. [IA'))
    const lleno = Object.fromEntries(claves.map((k) => [k, 'x']))
    const r2 = pedir(lleno, 'completar')
    assert.equal(r2.ok, false)
    assert.match(r2.error, /No hay casillas vacías/)
  })
  caso('las demás hojas del G-3 también terminan con «FORMATO DE TU RESPUESTA» (antes quedaban afuera)', () => {
    const mision = plano(mesa.VM('mision'))
    const r = R.pedidoG3(mision, {}, mesa.cU(mision, {}, { expediente: 'EXP', modo: 'completar', seccion: 'G-3' }), {})
    assert.ok(r.ok)
    assert.ok(r.prompt.trimEnd().split('\n# ').pop().startsWith('FORMATO DE TU RESPUESTA'))
    assert.ok(r.prompt.includes('BUSCÁ EN LA WEB'), 'el pedido de siempre no cambia')
  })

  // ── LA RESPUESTA ───────────────────────────────────────────────────────────────────
  caso('el JSON por fila (el del pedido) entra entero: 20 celdas en su lugar', () => {
    const r = leer(RESPUESTA_JSON)
    assert.ok(r.ok, r.error)
    assert.equal(r.n, 20)
    assert.match(r.datos.MANIOBRA, /^\+Movilidad táctica sobre la RN-7 \(FICT\.\)\.\n\+Puede desmontarse\./)
    assert.equal(r.datos['POTENCIA DE FUEGO'], '+Morteros de 120 mm (FICT.).\n-Sin artillería de campaña.', 'las listas se juntan renglón por renglón')
    assert.match(r.datos['MANIOBRA|Tácticas, técnicas y procedimientos (TTP.)'], /^Fase de canalización:/)
  })
  caso('también en lista de renglones, con las claves de la hoja, o plano con «FILA|Columna» / «Fila — Columna»', () => {
    const lista = JSON.stringify([{ 'Potencia de combate': 'Maniobra', 'Fuerzas enemigas': '+A', 'Fuerzas propias': '-B', Deducciones: 'C', TTP: 'D' }, { 'Potencia de combate': 'Liderazgo', Enemigo: '-E' }])
    let r = leer(lista)
    assert.ok(r.ok, r.error)
    assert.deepEqual(plano(r.datos), { MANIOBRA: '+A', 'MANIOBRA|Fuerzas propias': '-B', 'MANIOBRA|Deducciones': 'C', 'MANIOBRA|Tácticas, técnicas y procedimientos (TTP.)': 'D', LIDERAZGO: '-E' })
    r = leer(JSON.stringify({ 'PROTECCIÓN|Deducciones': 'F', 'Información e inteligencia — TTP': 'G', 'POTENCIA DE FUEGO': '+H' }))
    assert.deepEqual(plano(r.datos), { 'PROTECCIÓN|Deducciones': 'F', 'INFORMACIÓN E INTELIGENCIA|Tácticas, técnicas y procedimientos (TTP.)': 'G', 'POTENCIA DE FUEGO': '+H' })
  })
  caso('la TABLA de Markdown (con <br>), la copiada de la pantalla y la escrita por títulos', () => {
    const md = `Aquí está la hoja:\n\n${CABECERA}\n|---|---|---|---|---|\n| **Maniobra** | +Velocidad<br>-Carreteras | +Terreno cerrado | Obligarlo a desmontar | Emboscada AT |\n| Potencia de fuego | +Morteros 120 | -Sin AT de tiro rápido | Art. contra vehíc. | Usar humo |\n| Inteligencia | +UAV | -Pocos medios | Contrarreconocimiento | GE contra sus redes |\n\n¿Desea que siga con los CAP?`
    let r = leer(md)
    assert.ok(r.ok, r.error)
    assert.equal(r.n, 12)
    assert.equal(r.datos.MANIOBRA, '+Velocidad\n-Carreteras')
    assert.equal(r.datos['INFORMACIÓN E INTELIGENCIA|Tácticas, técnicas y procedimientos (TTP.)'], 'GE contra sus redes')
    const tab = 'Potencia de combate\tFuerzas enemigas\tFuerzas propias\tDeducciones\tTTP\nManiobra\t+Velocidad\t+Terreno\tCanalizar\tEmboscada AT\nProtección\t+Blindados\t-Vulnerables a la artillería\tSobrevivir la preparación\tEscondites'
    r = leer(tab)
    assert.ok(r.ok, r.error)
    assert.equal(r.datos['PROTECCIÓN|Fuerzas propias'], '-Vulnerables a la artillería')
    const titulos = '### 1. MANIOBRA\n**Fuerzas enemigas:**\n+Velocidad en la carretera.\n-Utilizan principalmente las carreteras.\n**Fuerzas propias:** +Movilidad en todo terreno.\n**Deducciones:**\n- Obligar al enemigo a desmontarse.\n**TTP:**\n- Emboscada antitanque.\n\n### LIDERAZGO\nFuerzas enemigas: -C2 centralizado.\nLiderazgo enemigo rígido en los niveles inferiores\n'
    r = leer(titulos)
    assert.ok(r.ok, r.error)
    assert.equal(r.datos.MANIOBRA, '+Velocidad en la carretera.\n-Utilizan principalmente las carreteras.')
    assert.equal(r.datos['MANIOBRA|Deducciones'], 'Obligar al enemigo a desmontarse.', 'en DEDUCCIONES la viñeta no es un «-»')
    assert.equal(r.datos.LIDERAZGO, '-C2 centralizado.\nLiderazgo enemigo rígido en los niveles inferiores', 'un renglón que nombra la fila no cambia de fila')
  })
  caso('sólo completar no pisa lo escrito; completar y mejorar reescribe (sP real)', () => {
    const previo = { MANIOBRA: '+Lo puso el oficial.' }
    const r = leer(RESPUESTA_JSON, previo)
    let m = plano(mesa.sP({ potencia: previo }, { potencia: r.datos }, { pisar: false }).hojas.potencia)
    assert.equal(m.MANIOBRA, '+Lo puso el oficial.')
    assert.match(m['MANIOBRA|Deducciones'], /\[IA — verificar\]$/)
    m = plano(mesa.sP({ potencia: previo }, { potencia: r.datos }, { pisar: true }).hojas.potencia)
    assert.match(m.MANIOBRA, /^\+Movilidad táctica/)
  })

  caso('las OTRAS hojas «tabla» (la H.T. 1 del G-2, dos columnas) se leen como antes', () => {
    const HT1 = { id: 'ht1', tipo: 'tabla', cols: ['Característica', 'Descripción'], filas: ['GEOGRAFÍA', 'TERRENO', 'CONDICIONES METEOROLÓGICAS', 'REGLAS DE ENFRENTAMIENTO O RESTRICCIONES LEGALES'] }
    const ok = (texto, esperado) => {
      const r = mesa.dU(texto, HT1)
      assert.ok(r.ok, r.error)
      assert.deepEqual(plano(r.datos), esperado)
    }
    ok(JSON.stringify({ GEOGRAFÍA: 'Altiplano (FICT.).', 'TERRENO|Descripción': 'Ondulado.' }), { GEOGRAFÍA: 'Altiplano (FICT.).', TERRENO: 'Ondulado.' })
    ok('GEOGRAFÍA: Altiplano (FICT.).\nCONDICIONES METEOROLÓGICAS: Heladas nocturnas.', { GEOGRAFÍA: 'Altiplano (FICT.).', 'CONDICIONES METEOROLÓGICAS': 'Heladas nocturnas.' })
    ok('| Característica | Descripción |\n|---|---|\n| Terreno | Ondulado. |\n| Reglas de enfrentamiento o restricciones legales | DICA. |', { TERRENO: 'Ondulado.', 'REGLAS DE ENFRENTAMIENTO O RESTRICCIONES LEGALES': 'DICA.' })
    ok('GEOGRAFÍA\tAltiplano (FICT.).\nTERRENO\tOndulado.', { GEOGRAFÍA: 'Altiplano (FICT.).', TERRENO: 'Ondulado.' })
  })

  // ── EL ERROR ───────────────────────────────────────────────────────────────────────
  caso('lo pegado en la captura (sólo la pregunta final) da el error, y el error dice qué pasó', () => {
    const r = leer(PEGADO_CAPTURA)
    assert.equal(r.ok, false)
    assert.match(r.error, /No se reconoció la respuesta/)
    const e = R.errorRespuesta(r.error, PEGADO_CAPTURA)
    assert.match(e, /^Lo que pegaste es sólo el FINAL de la respuesta de la IA/)
    assert.match(e, /botón «Copiar»/)
    assert.match(e, /Orden, una matriz de sincronización/)
    assert.equal(R.errorRespuesta('Otro error.', RESPUESTA_JSON), 'Otro error.', 'una respuesta larga deja el error como estaba')
    assert.match(R.errorRespuesta('X.', 'Listo'), /muy corto/)
    assert.doesNotMatch(R.errorRespuesta('X.', 'No puedo completar esta hoja sin más datos.'), /FINAL de la respuesta/, 'una negativa no es la pregunta final')
    assert.match(R.errorRespuesta('X.', 'Si necesitás, puedo preparar también la matriz de sincronización.'), /FINAL de la respuesta/)
    // la respuesta LARGA de Gemini que no tenía ninguna fila (segundo intento de Sergio)
    const r2 = leer(RESPUESTA_FUERA_DE_TEMA)
    assert.equal(r2.ok, false)
    const e2 = R.errorRespuesta(r2.error, RESPUESTA_FUERA_DE_TEMA)
    assert.match(e2, /^La IA no escribió esta hoja: escribió otra cosa \(un análisis, conclusiones, una Orden…\) y cerró ofreciendo seguir\./)
    assert.match(e2, /chat NUEVO/)
    assert.match(e2, /«Cumplí el pedido del archivo: contestá SÓLO con el bloque JSON del final»/)
    assert.ok(fs.readFileSync(VIG, 'utf8').includes('S({tipo:"err",txt:SIDEMError(pe?.error||"No se pudo usar esa respuesta.",v)})'), 'el panel de la IA usa el aviso')
  })

  // ── EL WORD ────────────────────────────────────────────────────────────────────────
  caso('«📄 Word (hoja de trabajo)» de la PRC sale con el .docx de la Escuela (Aoe → SIDEMWordPRC)', () => {
    let recibido = null
    const aoe = cargarConDependencias(VIG, ['Aoe'], () => {}, { SIDEMWordPRC: (v) => ((recibido = v), true), VM: (t) => ({ id: t }), HS: [] })
    return aoe.Aoe('potencia', { MANIOBRA: '+X' }, {}, {}).then((ok) => {
      assert.equal(ok, true)
      assert.deepEqual(recibido, { MANIOBRA: '+X' })
    })
  })
  caso('el .docx: carta apaisada, el título, la cabecera del modelo, las cinco filas, sin la marca de la IA, pie «N - M»', () => {
    const r = leer(RESPUESTA_JSON)
    const v = plano(mesa.sP({ potencia: { 'LIDERAZGO|Deducciones': 'Ensayar & <corregir>' } }, { potencia: r.datos }, { pisar: false }).hojas.potencia)
    fs.mkdirSync(SALIDA, { recursive: true })
    const archivo = path.join(SALIDA, P.ARCHIVO)
    fs.writeFileSync(archivo, P.docxPRC(v))
    const leerZip = (parte) => execFileSync('unzip', ['-p', archivo, parte], { encoding: 'utf8' })
    const lista = execFileSync('unzip', ['-Z1', archivo], { encoding: 'utf8' }).trim().split('\n')
    assert.deepEqual(lista.sort(), ['[Content_Types].xml', '_rels/.rels', 'docProps/core.xml', 'word/_rels/document.xml.rels', 'word/document.xml', 'word/footer1.xml', 'word/settings.xml', 'word/styles.xml'].sort())
    execFileSync('unzip', ['-tq', archivo])
    const doc = leerZip('word/document.xml')
    assert.ok(doc.includes('<w:pgSz w:w="15840" w:h="12240" w:orient="landscape" w:code="1"/>'))
    assert.ok(doc.includes('<w:pgMar w:top="1701" w:right="1134" w:bottom="1134" w:left="1134"'))
    assert.ok(doc.includes('H.T. POTENCIA RELATIVA DE COMBATE') && doc.includes('<w:sz w:val="32"/>'))
    const textos = [...doc.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])
    assert.deepEqual(textos.slice(1, 6), ['POTENCIA DE COMBATE', 'FUERZAS ENEMIGAS', 'FUERZAS PROPIAS', 'DEDUCCIONES', 'TÁCTICAS, TÉCNICAS Y PROCEDIMIENTOS (TTP.)'])
    for (const f of P.FILAS) assert.ok(textos.includes(f), f)
    assert.ok(textos.includes('+Puede desmontarse.') && textos.includes('Ensayar &amp; &lt;corregir&gt;'))
    assert.ok(!doc.includes('IA — verificar'), 'sin la marca de la IA')
    assert.ok(doc.includes('<w:ind w:left="258" w:hanging="258"/>'), 'los «+»/«-» con sangría francesa, como el ejemplo')
    assert.equal([...doc.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((m) => +m[1]).join(','), '2268,2866,2804,2636,3034')
    const pie = leerZip('word/footer1.xml')
    assert.ok(pie.includes(' PAGE ') && pie.includes(' NUMPAGES ') && pie.includes('> - <'))
    assert.equal(P.tieneAlgo({}), false)
    assert.equal(P.tieneAlgo(VIEJA), true, 'la hoja vieja también sale (migrada)')
  })

  // ── EL COMPILADO ───────────────────────────────────────────────────────────────────
  caso('los reemplazos del compilado: cada uno una vez, reversibles, y el vigente los trae', () => {
    const lista = require('./reemplazos-2026-10-06-prc.js')
    const ant = fs.readFileSync(ANTERIOR, 'utf8')
    const nue = fs.readFileSync(NUEVO, 'utf8')
    let x = ant
    for (const r of lista) {
      assert.equal(x.split(r.viejo).length - 1, r.veces, r.nombre)
      x = x.split(r.viejo).join(r.nuevo)
    }
    assert.equal(x, nue)
    for (const r of [...lista].reverse()) x = x.split(r.nuevo).join(r.viejo)
    assert.equal(x, ant)
    const vig = fs.readFileSync(VIG, 'utf8')
    // (10-10-2026) el vigente puede tener el motor en una carpeta posterior (v6: el pedido)
    for (const r of lista) if (!/\.\.\/estado-mayor\/v\d\//.test(r.nuevo)) assert.ok(vig.includes(r.nuevo), r.nombre)
    assert.equal((nue.match(/"\.\.\/estado-mayor\/v5\//g) || []).length, 3, 'los 3 imports del motor van a la v5')
    assert.equal((vig.match(/"\.\.\/estado-mayor\/v\d+\//g) || []).length, 3, 'el vigente importa el motor 3 veces')
  })
  caso('ningún gancho cae DENTRO de lo que insertaron las listas anteriores (salvo la versión de la carpeta del motor)', () => {
    const viejo = fs.readFileSync(ANTERIOR, 'utf8')
    const nuevo = fs.readFileSync(NUEVO, 'utf8')
    let n = 0
    const rotos = []
    for (const f of fs.readdirSync(__dirname)) {
      let l = null
      if (/^reemplazos-.*\.js$/.test(f) && !['reemplazos-compilado.js', 'reemplazos-2026-10-06-prc.js'].includes(f)) l = require(path.join(__dirname, f))
      else if (/^reemplazos-.*\.json$/.test(f)) l = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')).reemplazos
      for (const r of l || []) {
        if (!r.nuevo || !viejo.includes(r.nuevo)) continue
        n++
        if (!nuevo.includes(r.nuevo) && !/\.\.\/estado-mayor\/v\d\//.test(r.nuevo)) rotos.push(`${f}: ${r.nombre || r.nuevo.slice(0, 80)}`)
      }
    }
    assert.ok(n > 100, `se revisaron ${n}`)
    assert.deepEqual(rotos, [])
  })
  caso('el G-1 y el G-5 de la v5 son los de la v4 (sólo cambió el motor)', () => {
    for (const g of ['g1', 'g5']) assert.equal(fs.readFileSync(path.join(RAIZ, `estado-mayor/v5/campos/${g}.js`), 'utf8'), fs.readFileSync(path.join(RAIZ, `estado-mayor/v4/campos/${g}.js`), 'utf8'))
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
