// EL PEDIDO A LA IA (10-10-2026, calcos/estado-mayor/v6/pedido.js y
// reemplazos-2026-10-10-pedido.js). Lo pidió Sergio con capturas de la F1·P3 Apreciación
// Activa del Comandante: «Pedido copiado (456.419 caracteres)» y la IA contestó «La información
// se cortó… ¿Cuál es el producto que requiere?» (respuesta-cortada-comandante.md) o un
// documento en prosa que cerraba con «Want me to…?» (respuesta-prosa-comandante.md). Y los Word
// de la F1·P3 y la F1·P5 salieron con «[IA — verificar]» y «D-15 (2300) — D-15 (2300)».
//
//   · el pedido de la F1·P3 con un expediente REAL de 478 mil caracteres (_6e, cU, Boe del
//     compilado vigente): empieza con la tarea, el JSON exacto y la indicación; entra en el
//     tamaño elegido; conserva TODOS los apartados del expediente; aunque la IA lo corte a la
//     mitad, la tarea y el formato ya llegaron;
//   · lo mismo en un documento del motor (la Apreciación del G-1) y en la PRC (que ya traía su
//     tarea arriba: no se le pone otra);
//   · las dos respuestas de Sergio dan el error que corresponde, y la respuesta buena entra;
//   · el expediente trae las hojas del Comandante y del JEM;
//   · el Word militar sin la marca de la IA; la Guía Inicial sin la hora repetida;
//   · el panel de la IA trae el selector de tamaño.
//
//   node pedido-ia.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { vigente, cargar } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')

const RAIZ = path.join(__dirname, '..')
const VIG = vigente()
const SRC = fs.readFileSync(VIG, 'utf8')
const V = (SRC.match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js"/) || [])[1]
let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])
const url = (p) => 'file://' + path.join(RAIZ, p)

;(async () => {
  console.log(`compilado: ${path.basename(VIG)} · motor: calcos/estado-mayor/${V}`)
  const R = await import(url(`estado-mayor/${V}/registro.js`))
  const P = await import(url(`estado-mayor/${V}/pedido.js`))
  const M = await import(url(`estado-mayor/${V}/motor.js`))
  const G = await import(url(`estado-mayor/${V}/campos/g1.js`))
  const RT = await import(url(`estado-mayor/${V}/runtime.js`))
  RT.sincronizarEM({})
  const ganchos = { SIDEMEs: R.esDocumento, SIDEMTexto: R.textoDocumento, SIDEMTiene: R.tieneDocumento, SIDLogTexto: () => '', SIDLogTiene: () => false, SIDEMRescatar: R.rescatarHoja, SIDLogEs: () => false, SIDEMCelda: R.celdaFila, SIDEMFilasDe: R.filasDeRespuesta, SIDEMListas: R.listasDe, SIDEMClave: R.claveCasilla, SIDEMIndicacion: R.cierreIndicacion, SIDEMPedido: R.pedidoHoja, SIDEMTabla: R.tablaDeRespuesta, SIDConceptosTexto: () => '', SIDRiesgoTexto: () => '', SIDRecoTexto: () => '', SIDEMFases: (g, f) => f, SIDMembrete: {}, SIDMilHoja: () => null }
  const { PLe, OLe } = cargarConDependencias(VIG, ['PLe', 'OLe'])
  const HOJA = PLe[0].hojas.find((h) => h.id === 'aprecCmte')
  const GUIA = PLe[0].hojas.find((h) => h.id === 'guiaInicial')
  const CLAVES = HOJA.campos
  const INDICACION = 'todoen base a la fase I de los otros miembros del estado mayor'

  // Un ejercicio con documentos aportados largos (como el de Sergio) y hojas de las secciones.
  const parrafo = (d, i) => `${d} — párrafo ${i}. El RIAT-30 «MURILLO» ocupa posiciones en la Fase III sobre el eje Pucarani–Quenacagua, con el apoyo del GA-2 y de la Cía. Ing.; la Fuerza de Golpe (RCB-1 «CALAMA») espera en Arhuanamina. ${'Detalle de la maniobra. '.repeat(10)}`
  const doc = (d, k) => Array.from({ length: k }, (_, i) => parrafo(d, i + 1)).join('\n\n')
  const ejercicio = {
    ejercicio: 'DIV.MEC.-1 — Defensa Móvil (FICT.)',
    mision: 'La DIV.MEC.-1 defiende y destruye a la División Acorazada enemiga.',
    ordenSup: { unidad: 'DIV.MEC.-1', mision: 'Defender entre D (0500) y D+2 (1800) y destruir a la Div. Acorazada (FICT.).', intencion: 'Destruir su poder de choque en el AE VULCAN (FICT.).' },
    escenario: 'Situación general del ejercicio (FICT.).',
    documentos: [
      { nombre: 'ORDEN DE OPERACIONES N° 3 (FICT.)', categoria: 'otro', texto: doc('ORDEN', 900) },
      { nombre: 'ANEXO B — INTELIGENCIA (FICT.)', categoria: 'otro', texto: doc('ANEXO B', 500) },
    ],
    g3: {},
    picb: {},
    hojasG: {
      g1: { tareas: [{ Tarea: 'Mantener el efectivo de la Fuerza de Golpe (FICT.)', Tipo: 'Implícita' }] },
      cmte: { aprecCmte: { 'Situación como la veo hoy': 'Defensa Móvil sobre un frente de 9 km (FICT. — del Comandante).' } },
      jem: { libreto: { 'Cursos que se juegan': 'CAP 1 y CAP 2 (FICT. — del JEM).' } },
    },
    fasesCOA: { propio: [{ nombre: 'Preparación' }, { nombre: 'Defensa y desorganización' }, { nombre: 'Canalización' }, { nombre: 'Destrucción' }] },
  }
  const mesa = cargarConDependencias(
    VIG,
    ['_6e', 'cU', 'Boe', 'dU'],
    (c) => {
      c._6e(ejercicio)
      c.cU(HOJA, {}, { expediente: 'EXP', seccion: 'COMANDO' })
      c.Boe('P', 'I')
      c.dU('{"Situación como la veo hoy":"x"}', HOJA, {}, {})
    },
    ganchos,
  )
  const EXP = mesa._6e(ejercicio).md
  const pedidoCmte = (tamano, indicacion = INDICACION) => {
    P.elegirTamano(tamano)
    const r = R.pedidoHoja('cmte', HOJA, mesa.cU(HOJA, { [CLAVES[0]]: 'Algo escrito.' }, { expediente: EXP, modo: 'completar_mejorar', seccion: 'COMANDO' }))
    assert.ok(r.ok, r.error)
    return mesa.Boe(r.prompt, indicacion)
  }

  // ── EL PEDIDO ─────────────────────────────────────────────────────────────────────
  caso('el expediente del ejercicio es tan largo como el de Sergio (y trae las hojas del Comandante y del JEM)', () => {
    assert.ok(EXP.length > 400000, `expediente de ${EXP.length} caracteres`)
    assert.ok(EXP.includes('## 11 bis · HOJAS DE TRABAJO DEL COMANDANTE, DEL JEM, DEL G-1'))
    assert.ok(EXP.includes('### Comandante'), 'las hojas del Comandante')
    assert.ok(EXP.includes('Defensa Móvil sobre un frente de 9 km (FICT. — del Comandante).'))
    assert.ok(EXP.includes('### Jefe de Estado Mayor') && EXP.includes('CAP 1 y CAP 2 (FICT. — del JEM).'), 'las hojas del JEM')
    assert.ok(OLe.some((f) => f.hojas.some((h) => h.id === 'libreto')))
    assert.ok(EXP.includes('### G-1 Personal'), 'las de siempre siguen')
  })
  caso('F1·P3 «Normal»: entra en 120 mil, EMPIEZA con la tarea, el JSON exacto y la indicación, y termina con el recordatorio', () => {
    const p = pedidoCmte('normal')
    assert.ok(p.length <= 120000, `pedido de ${p.length} caracteres`)
    assert.ok(p.startsWith(P.TITULO_PEDIDO))
    const cab = p.slice(0, p.indexOf('\n---\n'))
    assert.ok(cab.includes('«F1·P3 — Apreciación Activa del Comandante»'))
    assert.ok(cab.includes('completar y mejorar esta hoja'))
    for (const k of CLAVES) assert.ok(cab.includes(`"${k}": "…"`), `la clave «${k}» va arriba`)
    assert.ok(cab.includes(`«${INDICACION}»`), 'la indicación va arriba')
    assert.match(cab, /Si el texto te llega CORTADO[\s\S]*contestá IGUAL/)
    assert.match(cab, /NO escribas:[\s\S]*¿Cuál es el producto que requiere\?/)
    assert.ok(cab.length < 4000, 'el encabezado es corto')
    assert.ok(p.trimEnd().endsWith('ese estilo va DENTRO de los textos.'), 'termina con el recordatorio de siempre')
    assert.ok(p.lastIndexOf(INDICACION) > p.length - 2000, 'la indicación también va al final')
    assert.match(R.avisoDelPedido(), /RECORTADO \(de [\d.]+ a [\d.]+ caracteres\)/)
  })
  caso('el expediente recortado conserva TODOS sus apartados, la Orden, las hojas del EM y el comienzo de cada documento', () => {
    const p = pedidoCmte('normal')
    for (const t of EXP.match(/^## .+$/gm)) assert.ok(p.includes(t), `falta el apartado «${t}»`)
    for (const t of ['Defender entre D (0500) y D+2 (1800)', 'Defensa Móvil sobre un frente de 9 km (FICT. — del Comandante).', 'Mantener el efectivo de la Fuerza de Golpe', '### ORDEN DE OPERACIONES N° 3 (FICT.)', 'ORDEN — párrafo 1.', '### ANEXO B — INTELIGENCIA (FICT.)', 'ANEXO B — párrafo 1.', 'Este expediente va RECORTADO', 'Apartado recortado'])
      assert.ok(p.includes(t), `falta «${t}»`)
    assert.ok(!p.includes('ORDEN — párrafo 899.'), 'lo último de un documento largo es lo que cede')
  })
  caso('aunque la IA corte el pedido a la mitad (como Gemini), ya leyó la tarea, el JSON y la indicación', () => {
    const p = pedidoCmte('normal')
    const mitad = p.slice(0, Math.floor(p.length / 2))
    assert.ok(mitad.includes('TU ÚNICA TAREA'))
    assert.ok(mitad.includes('```json') && CLAVES.every((k) => mitad.includes(`"${k}"`)))
    assert.ok(mitad.includes(INDICACION))
    // el de antes: la tarea recién aparecía después de todo el expediente
    const antes = R.pedidoHoja('cmte', HOJA, mesa.cU(HOJA, {}, { expediente: EXP, modo: 'completar_mejorar', seccion: 'COMANDO' })).prompt
    assert.ok(antes.indexOf('# CÓMO CONTESTAR') > 400000, 'antes el formato quedaba a más de 400 mil caracteres')
  })
  caso('«Corto» entra en 60 mil; «Completo» manda el expediente entero (igual con la tarea arriba)', () => {
    const c = pedidoCmte('corto')
    assert.ok(c.length <= 60000, `corto: ${c.length}`)
    assert.ok(c.startsWith(P.TITULO_PEDIDO) && c.includes('### Comandante') && c.includes('## 1 · ORDEN DEL ESCALÓN SUPERIOR'))
    const t = pedidoCmte('completo')
    assert.ok(t.includes(EXP.trim().slice(-2000)), 'el expediente entero')
    assert.ok(t.startsWith(P.TITULO_PEDIDO))
    assert.ok(!t.includes('Este expediente va RECORTADO'))
    assert.equal(R.avisoDelPedido().includes('RECORTADO'), false)
    P.elegirTamano('normal')
  })
  caso('sin indicación del oficial, el encabezado no inventa una; un pedido corto sin expediente queda como estaba', () => {
    const p = pedidoCmte('normal', '')
    assert.ok(!p.includes('INDICACIÓN DEL OFICIAL'))
    assert.ok(!p.includes('EL FORMATO DE TU RESPUESTA NO CAMBIA'))
    assert.equal(mesa.Boe('PEDIDO CORTO\n\n# CÓMO CONTESTAR\n\nJSON', '  '), 'PEDIDO CORTO\n\n# CÓMO CONTESTAR\n\nJSON')
  })
  caso('un documento del motor (la Apreciación del G-1): la tarea y el esqueleto JSON arriba, el expediente recortado', () => {
    const r = M.pedido(G.APREC, M.normalizar(G.APREC, {}), { encabezado: 'CONTEXTO — ESTO ES UN EJERCICIO ACADÉMICO.', expediente: EXP, seccion: 'SECCIÓN I — PERSONAL (G-1)', producto: '' })
    P.elegirTamano('normal')
    const p = mesa.Boe(r.prompt, 'Priorizá la fase II')
    assert.ok(p.length <= 120000, `${p.length}`)
    const cab = p.slice(0, p.indexOf('\n---\n'))
    assert.ok(cab.includes(`«${G.APREC.titulo}»`), cab.slice(0, 400))
    assert.ok(cab.includes('"campos"') && cab.includes('"tareasEsp"'), 'el esqueleto del documento va arriba')
    assert.ok(cab.includes('«Priorizá la fase II»'))
  })
  caso('la PRC ya trae su tarea arriba: no se le pone otra, pero el expediente igual se recorta', () => {
    const r = { ok: true, prompt: `Sos OFICIAL DE ESTADO MAYOR… ESTO ES UN PEDIDO, NO UN DOCUMENTO PARA ANALIZAR NI RESUMIR.\n\n# TU ÚNICA TAREA\n\nLlenar la PRC.\n\n---\n\n# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO\n\n===== INICIO DEL EXPEDIENTE =====\n\n${EXP}\n\n===== FIN DEL EXPEDIENTE — ahora, la hoja =====\n\n---\n\n# CÓMO CONTESTAR\n\n\`\`\`json\n{ "MANIOBRA": {} }\n\`\`\`` }
    const p = mesa.Boe(r.prompt, '')
    assert.ok(p.startsWith('Sos OFICIAL DE ESTADO MAYOR'))
    assert.ok(!p.includes(P.TITULO_PEDIDO))
    assert.ok(p.length <= 120000 && p.includes('===== FIN DEL EXPEDIENTE'))
  })
  caso('el reparto: un bloque chico queda igual; uno grande cede parejo y nunca pasa su tope', () => {
    assert.equal(P.compactarBloque('hola', 100), 'hola')
    const b = ['### A\n' + 'a '.repeat(5000), '### B\nchico', '### C\n' + 'c '.repeat(5000)].join('\n')
    const x = P.compactarBloque(b, 3000)
    assert.ok(x.length <= 3000, `${x.length}`)
    assert.ok(x.includes('### B\nchico') && x.includes('### A') && x.includes('### C'))
    const e = P.compactarExpediente(EXP, 50000)
    assert.ok(e.recortado && e.texto.length <= 52000, `${e.texto.length}`)
  })

  // ── LA RESPUESTA ──────────────────────────────────────────────────────────────────
  const leer = (t) => mesa.dU(t, HOJA, {}, {})
  caso('la respuesta de Sergio «se cortó… ¿cuál es el producto?»: dice que el pedido no llegó entero y qué hacer', () => {
    const t = fs.readFileSync(path.join(__dirname, 'respuesta-cortada-comandante.md'), 'utf8')
    const r = leer(t)
    assert.equal(r.ok, false)
    const m = R.errorRespuesta(r.error, t)
    assert.match(m, /La IA NO hizo la hoja: avisa que el texto le llegó cortado/)
    assert.match(m, /«Normal»[\s\S]*«Corto»[\s\S]*chat NUEVO/)
    assert.ok(!/sólo el FINAL de la respuesta/.test(m), 'no es «el final de la respuesta»')
  })
  caso('la respuesta en prosa («Want me to…?»): no se mete en las casillas y dice qué pasó', () => {
    const t = fs.readFileSync(path.join(__dirname, 'respuesta-prosa-comandante.md'), 'utf8')
    const r = leer(t)
    assert.equal(r.ok, false, 'no se inventan casillas con un documento que no es la hoja')
    assert.match(R.errorRespuesta(r.error, t), /La IA no escribió esta hoja[\s\S]*«Normal»/)
  })
  caso('la respuesta buena entra: el bloque JSON, y también los títulos de las casillas (I.- Situación como la veo hoy.)', () => {
    const j = leer('```json\n' + JSON.stringify(Object.fromEntries(CLAVES.map((k, i) => [k, `Texto ${i + 1} (FICT.).`]))) + '\n```')
    assert.ok(j.ok, j.error)
    assert.equal(j.n, 4)
    const t = leer(CLAVES.map((k, i) => `${['I', 'II', 'III', 'IV'][i]}.- ${k}.\nTexto ${i + 1}.`).join('\n\n'))
    assert.ok(t.ok, t.error)
    assert.equal(JSON.stringify(Object.keys(t.datos)), JSON.stringify(CLAVES))
  })

  // ── EL COMPILADO ──────────────────────────────────────────────────────────────────
  caso('el Word del documento (Mx) sale sin «[IA — verificar]», el militar y el de la hoja con membrete (la F1·P3)', async () => {
    let militar = null
    let hoja = null
    const { Mx } = cargar(VIG, ['Mx'], { SIDEsMilitar: (r) => !!r, SIDMilWord: async (t) => (militar = t), SIDHojaWord: async (t) => (hoja = t), SIDEMSinMarca: R.sinMarcaWord })
    const spec = { secciones: [{ titulo: 'I.- Situación como la veo hoy.', texto: 'Ejecutaremos una Defensa Móvil. [IA — verificar]' }, { texto: '[IA — verificar]\nTexto.\nFuentes: Orden N° 3' }] }
    await Mx(spec, 'F1P3', { registro: { id: 'aprecCmte' } })
    assert.equal(militar.secciones[0].texto, 'Ejecutaremos una Defensa Móvil.')
    assert.equal(militar.secciones[1].texto, 'Texto.\nFuentes: Orden N° 3')
    assert.equal(spec.secciones[0].texto, 'Ejecutaremos una Defensa Móvil. [IA — verificar]', 'lo guardado no cambia')
    await Mx(spec, 'F1P3', {})
    assert.equal(hoja.secciones[0].texto, 'Ejecutaremos una Defensa Móvil.', 'la F1·P3 del Comandante sale por SIDHojaWord')
  })
  caso('la Guía Inicial sin calendario: «D-15 (2300)» una sola vez, y «hasta el D-10 (1700)» sin repetir', () => {
    const t = { ok: true, recepcionTxt: 'D-15 (2300)', recepcionD: 'D-15 (2300)', inicioOperacionTxt: 'D (0500)', inicioOperacionD: 'D (0500)', teMs: 1, finOperacionesTxt: 'D+2 (1800)', finOperacionesD: 'D+2 (1800)', ttdTxt: '16 días y 19 horas', tdTxt: '14 días y 6 horas', teTxt: '2 días y 13 horas', tPlanTxt: '4 días y 18 horas', limitePlaneamientoTxt: 'D-10 (1700)', limitePlaneamientoD: 'D-10 (1700)', tSubTxt: '9 días y 12 horas' }
    const { h3e } = cargar(VIG, ['h3e'], { MS: () => t })
    const xs = h3e({}).map((x) => x.texto)
    assert.ok(xs.includes('Recepción de la Orden Superior : D-15 (2300)'), xs.join('\n'))
    assert.ok(xs.some((x) => x.endsWith('hasta el D-10 (1700)')))
    assert.ok(!xs.some((x) => /\(2300\) — D-15|\(D-10 \(1700\)\)/.test(x)))
    const cal = cargar(VIG, ['h3e'], { MS: () => ({ ...t, recepcionTxt: 'mié 21/10 23:00' }) }).h3e({}).map((x) => x.texto)
    assert.ok(cal.includes('Recepción de la Orden Superior : D-15 (2300) — mié 21/10 23:00'), 'con calendario, las dos')
    assert.ok(GUIA, 'la Guía Inicial del Comandante está entre sus hojas')
  })
  caso('el panel de la IA: selector de tamaño, aviso del recorte, la indicación «al principio y al final»', () => {
    for (const t of ['[SIDT,SIDTset]=je.useState(SIDEMTamano)', 'SIDEMTamanos().map(pe=>', 'onClick:()=>SIDTset(SIDEMElegirTamano(pe.id))', 'caja de abajo.${SIDEMAviso()}`', 'Va AL PRINCIPIO y AL FINAL del pedido', '«# PEDIDO DE TRABAJO PARA LA IA…»', 'Cumplí el pedido del archivo'])
      assert.ok(SRC.includes(t), `falta «${t}»`)
    assert.deepEqual(R.tamanosPedido().map((x) => x.id), ['corto', 'normal', 'completo'])
    assert.equal(R.elegirTamanoPedido('corto'), 'corto')
    assert.equal(R.tamanoDelPedido(), 'corto')
    assert.equal(R.elegirTamanoPedido('cualquiera'), 'corto')
    R.elegirTamanoPedido('normal')
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
