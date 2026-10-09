// Pruebas del Comandante y del JEM en el motor de documentos de Estado Mayor
// (calcos/estado-mayor/vN, la carpeta que importa el compilado vigente: hoy v6):
//   · las hojas REALES del compilado (PLe y OLe): la Guía Inicial y los Conceptos Entrelazados
//     del Comandante son los del tablero del G-3 (compartida «g3»), la F7·P2 es un cuadro de
//     control y ninguna hoja «se baja hecha» salvo la matriz en blanco del JEM (F4·P6);
//   · 🌱 con las funciones REALES del compilado (l3e, HD, WD, Pie, voe): lo que ya hicieron el
//     G-2, el G-3 y las secciones llega al Comandante y al JEM; lo que hace uno llega al otro
//     (la selección de CAP del Comandante → el libreto del JEM; el rol de exposiciones del JEM
//     → la decisión del Comandante); 🌱 no pisa ni duplica;
//   · la IA: el pedido lleva lo que la Mesa no manda al expediente (las hojas del Comandante y
//     del JEM), lo calculado, la doctrina y «FORMATO DE TU RESPUESTA»; las demás secciones
//     reciben lo que ordenó el Comandante y dispuso el JEM;
//   · menos texto: el compilado apaga lo que explicaba qué son las hojas y qué hace la IA.
//
//   node estado-mayor-mando.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const { ejercicioMando, LINEA } = require('./mando-ejemplo.js')

const RAIZ = path.join(__dirname, '..')
const url = (p) => 'file://' + path.join(RAIZ, p)
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
const VIGENTE = path.join(RAIZ, html.match(/\.\/(assets\/index-[\w-]+\.js)/)[1])
const SRC = fs.readFileSync(VIGENTE, 'utf8')
const V = (SRC.match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js"/) || [])[1]
let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])

;(async () => {
  assert.ok(V, 'el compilado vigente importa el motor de documentos')
  console.log(`compilado: ${path.basename(VIGENTE)} · motor: calcos/estado-mayor/${V}`)
  const R = await import(url(`estado-mayor/${V}/registro.js`))
  const RT = await import(url(`estado-mayor/${V}/runtime.js`))
  const MA = await import(url(`estado-mayor/${V}/campos/mando.js`))
  const CM = (await import(url(`estado-mayor/${V}/campos/cmte.js`))).default
  const JM = (await import(url(`estado-mayor/${V}/campos/jem.js`))).default
  const G1 = (await import(url(`estado-mayor/${V}/campos/g1.js`))).default

  // Las funciones y los datos REALES del compilado
  const datos = ejercicioMando({ nombre: 'PRUEBA MANDO (FICT.)' })
  const mesa = cargarConDependencias(VIGENTE, ['PLe', 'OLe', 'ev', 'l3e', 'HD', 'WD', 'Pie', 'voe', 'Ni'], (c) => {
    c.l3e('guiaInicial', { unidades: datos.unidades, ops: datos.ops, fasesCOA: datos.fasesCOA, picb: datos.picb, ordenSup: datos.ordenSup, g3: { lineaTiempo: LINEA } })
    c.HD(LINEA)
    c.voe({})
    c.Ni('pc_acgm')
  })
  const vivo = { ops: datos.ops, unidades: datos.unidades, fasesCOA: datos.fasesCOA, bajasPorFase: [], conceptoApoyo: [], misionLog: '', estadosRecursos: {}, evacuacion: {}, orgTarea: [], ordenSup: datos.ordenSup, hojasG: datos.hojasG, g3: datos.g3, picb: datos.picb }
  RT.configurarEM({ catalogo: mesa.Ni, resumenG2: mesa.voe })
  // (lo que agrega la lista del Comandante y el JEM: configurarEM suma)
  RT.configurarEM({ semillaG3: mesa.l3e, plazosPrograma: mesa.HD, responsablesPrograma: mesa.WD, eventosPrograma: mesa.Pie })
  RT.sincronizarEM(vivo)
  const ctx = (campo, hojas = datos.hojasG[campo]) => RT.contexto({ campo, hojas, ctxDoc: { unidad: 'DIV.MEC.-1 (FICT.)', ejercicio: datos.nombre, ordenSup: datos.ordenSup } })
  const hojasDe = (panel) => panel.flatMap((f) => f.hojas)
  const hoja = (panel, id) => hojasDe(panel).find((h) => h.id === id)
  const sembrar = (campo, id, valor, c = ctx(campo)) => R.sembrarHoja(campo, hoja(campo === 'cmte' ? mesa.PLe : mesa.OLe, id), valor, c)
  const texto = (v) => JSON.stringify(v)

  caso('las hojas REALES del Comandante: la Guía Inicial y los Conceptos Entrelazados son los del G-3; la F7·P2 es un cuadro; ninguna se baja hecha', () => {
    const g = hoja(mesa.PLe, 'guiaInicial')
    assert.equal(g.compartida, 'g3')
    assert.equal(g.tipo, 'campos')
    assert.equal(JSON.stringify(g.campos), JSON.stringify(hoja(mesa.ev, 'guiaInicial').campos), 'las siete partes del PMTD, las mismas del tablero del G-3')
    assert.equal(g.campos.length, 7)
    const c = hoja(mesa.PLe, 'entrelazados')
    assert.equal(c.compartida, 'g3')
    assert.equal(c.tipo, 'conceptos')
    assert.equal(c.num, 'F2·P1')
    assert.ok(!hoja(mesa.PLe, 'conceptos'), 'ya no es la hoja «conceptos» que se bajaba hecha')
    const a = hoja(mesa.PLe, 'aprobacionOgo')
    assert.equal(a.tipo, 'filas')
    assert.equal(JSON.stringify(a.cols), JSON.stringify(['Orden o anexo', 'Responsable', 'Estado', 'Revisión del Cmte.']))
    assert.equal(hojasDe(mesa.PLe).filter((h) => h.tipo === 'remite').length, 0)
  })
  caso('las hojas REALES del JEM: sólo la matriz en blanco (F4·P6, a propósito) se baja hecha; la línea de tiempo y el programa son los del G-3', () => {
    assert.equal(hojasDe(mesa.OLe).filter((h) => h.tipo === 'remite').map((h) => h.id).join(), 'sincroBlanco')
    for (const id of ['lineaTiempo', 'progPlaneamiento']) assert.equal(hoja(mesa.OLe, id).compartida, 'g3')
  })
  caso('el registro: Comandante y JEM están y cada hoja de trabajo tiene 🌱 o es compartida con el G-3', () => {
    assert.ok(R.CAMPOS.cmte && R.CAMPOS.jem)
    assert.equal(R.CAMPOS.cmte.id, 'cmte')
    for (const [campo, panel] of [['cmte', mesa.PLe], ['jem', mesa.OLe]])
      for (const h of hojasDe(panel)) {
        if (h.compartida || h.tipo === 'remite') continue
        assert.ok(R.tieneSemilla(campo, h), `${campo}: la hoja ${h.num} ${h.id} no tiene 🌱`)
        assert.ok(R.guiaIA(campo, h), `${campo}: la hoja ${h.id} no tiene guía para la IA`)
        assert.equal(R.guiaHoja(campo, h), null, 'la guía no se muestra: menos texto')
      }
  })

  // ── 🌱 del Comandante ──
  caso('🌱 Guía Inicial: la asignación inicial del tiempo sale de la Línea Inicial de Tiempo del JEM (la función REAL del G-3)', () => {
    const r = sembrar('cmte', 'guiaInicial', {})
    const t = r.valor['II.- ASIGNACIÓN INICIAL DEL TIEMPO']
    assert.ok(t && t.includes('D-15 (2300)') && t.includes('Tiempo disponible (TD)'), String(t))
    assert.ok(r.n >= 1)
    // sin pisar
    const r2 = sembrar('cmte', 'guiaInicial', { 'II.- ASIGNACIÓN INICIAL DEL TIEMPO': 'Lo escribió el Comandante.' })
    assert.equal(r2.valor['II.- ASIGNACIÓN INICIAL DEL TIEMPO'], 'Lo escribió el Comandante.')
  })
  caso('🌱 Apreciación activa: la Orden superior, la CAE del G-2, los vacíos, las prohibiciones del G-3 y el concepto', () => {
    const r = sembrar('cmte', 'aprecCmte', {})
    const v = r.valor
    assert.ok(v['Situación como la veo hoy'].includes('Misión recibida: La DIV.MEC.-1') && v['Situación como la veo hoy'].includes('Intención del Comandante superior'))
    assert.ok(v['Lo que más me preocupa'].includes('Vacíos de inteligencia') && v['Lo que más me preocupa'].includes('Ubicación de la reserva blindada'))
    assert.ok(v['Lo que no estoy dispuesto a arriesgar'].includes('No batir la represa'))
    assert.ok(v['Hacia dónde creo que va esto'].includes('Penetración por el norte'))
  })
  caso('🌱 Prioridad a los RCIC.: los de G-1, G-3, G-4, G-5 y los vacíos del G-2, con quién los propone; sin duplicar', () => {
    const r = sembrar('cmte', 'prioridadRcic', [])
    const filas = r.valor
    const qs = filas.map((f) => f['Quién lo propone'])
    for (const q of ['G-1', 'G-4', 'G-5', 'G-2']) assert.ok(qs.includes(q), `falta ${q}`)
    assert.ok(qs.some((q) => q.startsWith('G-3 (RCIC)')) && qs.some((q) => q.startsWith('G-3 (EEIA)')))
    assert.ok(filas.some((f) => /reserva blindada/.test(f['Requerimiento propuesto'])))
    const r2 = R.sembrarHoja('cmte', hoja(mesa.PLe, 'prioridadRcic'), filas, ctx('cmte'))
    assert.equal(r2.n, 0, 'no duplica')
    const propia = [{ 'Requerimiento propuesto': 'Cuántos prisioneros esperar en la fase I (FICT.)', 'Quién lo propone': 'G-2', 'Prioridad que asigna el Cmte.': '1' }]
    const r3 = R.sembrarHoja('cmte', hoja(mesa.PLe, 'prioridadRcic'), propia, ctx('cmte'))
    assert.equal(r3.valor.find((f) => /prisioneros/.test(f['Requerimiento propuesto']))['Prioridad que asigna el Cmte.'], '1', 'lo suyo queda')
  })
  caso('🌱 Intención: propósito de la misión reexpresada, tarea esencial del G-3 y estado final del concepto; no pisa lo escrito', () => {
    const r = sembrar('cmte', 'intencion', datos.hojasG.cmte.intencion)
    assert.equal(r.valor['Propósito ampliado'], 'Propósito escrito por el Comandante (FICT.).')
    assert.ok(r.valor['Tareas clave'].includes('Conquistar el nudo vial de PUEBLO-Y'))
    assert.ok(r.valor['Estado Final Deseado'].includes('PUEBLO-Y (FICT.) conquistado'))
  })
  caso('🌱 Guía de Planificación y Guía Final: un renglón por sección; el G-2 con lo que debe cubrir; el plazo del Programa General', () => {
    const r = sembrar('cmte', 'guiaPlanificacion', [])
    assert.equal(r.valor.length, 6)
    assert.ok(r.valor[1]['Guía impartida'].includes('contrainteligencia') && r.valor[1]['Guía impartida'].includes('RPI.'))
    assert.ok(r.valor[0].Observación.includes('actualizada'), 'el G-1 ya actualizó su apreciación')
    assert.ok(r.valor[4].Observación.includes('actualizada'), 'el G-5 también')
    assert.ok(r.valor[3].Observación.includes('Sin apreciación'), 'el G-4 no la trabajó')
    const f = sembrar('cmte', 'guiaFinal', [])
    assert.equal(f.valor.length, 6)
    assert.ok(/D[+-]?\d*/.test(f.valor[0].Plazo) && f.valor[0].Plazo.length > 4, f.valor[0].Plazo)
  })
  caso('🌱 Selección de CAP, Decisión y Revisión de las órdenes: con lo que ya hizo el Estado Mayor y el JEM', () => {
    const s = sembrar('cmte', 'seleccionCoa', [])
    const nombres = s.valor.map((f) => f['Curso de acción'])
    assert.ok(nombres.includes('CAP N° 3 — fijación y desborde (FICT.)'), 'el CAP del G-3')
    assert.ok(nombres.some((n) => n.startsWith('CAP N° 1')) && nombres.some((n) => n.startsWith('CAP N° 2')), 'los de las ventajas y desventajas del G-5')
    const d = sembrar('cmte', 'decisionCmte', {})
    assert.ok(d.valor['Curso de acción aprobado'] === 'CAP N° 1 — ataque por el norte (FICT.)', 'el único que pasa al Juego de Guerra')
    assert.ok(d.valor['Razón de la decisión'].includes('CAP N° 1 — ataque por el norte'), 'la recomendación del rol de exposiciones del JEM')
    assert.ok(d.valor['Modificaciones que ordena'].includes('Sumar una reserva'))
    const a = sembrar('cmte', 'aprobacionOgo', [])
    const por = Object.fromEntries(a.valor.map((f) => [f['Orden o anexo'], f.Estado]))
    assert.equal(por['Orden Preparatoria N° 1'], 'Falta')
    assert.equal(por['Anexo de G-1'], 'Falta')
    assert.equal(a.valor.length, 8)
  })

  // ── 🌱 del JEM ──
  caso('🌱 Línea de tiempo actualizada: los diez eventos del Programa General con su responsable y sus plazos', () => {
    const r = sembrar('jem', 'lineaTiempoAct', [])
    assert.equal(r.valor.length, 10)
    assert.equal(r.valor[0].Actividad, 'Elaboración del Análisis de la Misión')
    assert.equal(r.valor[0].Responsable, 'EM./Pl.My.')
    assert.ok(/D-\d+ \(\d{4}\)/.test(r.valor[0]['Fecha y hora']), r.valor[0]['Fecha y hora'])
  })
  caso('🌱 Orientación del EM: un renglón por expositor con el estado de su apreciación', () => {
    const r = sembrar('jem', 'orientacionEM', [])
    assert.equal(r.valor.length, 7)
    const g1 = r.valor.find((f) => f.Expositor.startsWith('G-1'))
    assert.ok(g1['Producto que presenta'].includes('actualizada'))
    assert.ok(r.valor.find((f) => f.Expositor.startsWith('G-4'))['Producto que presenta'].includes('sin trabajar'))
  })
  caso('🌱 Normas de evaluación: cumplir la intención, las pruebas de validez y las de la matriz de decisión', () => {
    const r = sembrar('jem', 'normasEval', [])
    const n = r.valor.map((f) => f['Norma de evaluación'])
    for (const t of ['Cumple la intención del Comandante', 'Adecuado', 'Factible', 'Aceptable', 'Distinguible', 'Completo', 'Simplicidad', 'Sostenibilidad logística']) assert.ok(n.includes(t), t)
  })
  caso('🌱 Libreto: los cursos que el Comandante dejó pasar, la técnica y los eventos críticos del G-3', () => {
    const r = sembrar('jem', 'libreto', {})
    assert.ok(r.valor['Cursos que se juegan'].includes('CAP N° 1 — ataque por el norte'))
    assert.ok(r.valor['Técnica elegida (faja / profundidad / caja)'].includes('FAJA'))
    assert.ok(r.valor['Eventos críticos que se van a jugar'].includes('Cruce del río Z'))
    assert.ok(r.valor['Reglas del juego y turnos'].includes('Inteligencia, maniobra, fuegos'))
    assert.ok(r.valor['Quién registra'].includes('Plantilla sustentadora'))
  })
  caso('🌱 Rol de exposiciones: el JEM, el Comandante-recomendación de cada sección; lo que ya está no se pisa', () => {
    const r = sembrar('jem', 'rolExposiciones', datos.hojasG.jem.rolExposiciones)
    assert.equal(r.valor.length, 7, 'el JEM + cinco secciones + el renglón que ya estaba del G-3 (sin duplicar)')
    assert.equal(r.valor.filter((f) => f.Expositor === 'G-3 · Operaciones').length, 1)
    assert.ok(r.valor.find((f) => f.Expositor.startsWith('G-1'))['Recomendación que sostiene'].includes('CAP N° 3'))
  })
  caso('🌱 sin Línea de Tiempo ni ejercicio: no revienta y no inventa', () => {
    RT.sincronizarEM({})
    try {
      for (const [campo, panel] of [['cmte', mesa.PLe], ['jem', mesa.OLe]])
        for (const h of hojasDe(panel)) {
          if (h.compartida || h.tipo === 'remite' || !R.tieneSemilla(campo, h)) continue
          const v = R.sembrarHoja(campo, h, h.tipo === 'campos' ? {} : [], RT.contexto({ campo, hojas: {}, ctxDoc: {} }))
          assert.ok(v.n >= 0)
        }
    } finally {
      RT.sincronizarEM(vivo)
    }
  })

  // ── La IA ──
  const base = (extra = '') => ({ ok: true, prompt: `Sos OFICIAL DE ESTADO MAYOR…\n\n# HOJA\n\n# CÓMO CONTESTAR\n\nUn bloque json.${extra}`, forma: undefined })
  caso('el pedido del Comandante lleva lo del JEM y de las secciones (que la Mesa no manda al expediente), lo calculado, la doctrina y el formato', () => {
    const r = R.pedidoHoja('cmte', hoja(mesa.PLe, 'guiaPlanificacion'), base())
    const p = r.prompt
    for (const t of ['LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA COMANDANTE', 'PROGRAMA GENERAL DE PLANEAMIENTO', 'CAE más probable', 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', 'EL JEFE DE ESTADO MAYOR', 'F5·P3 Rol de exposiciones', 'G-3 OPERACIONES', 'G-2 INTELIGENCIA (PICB)', 'Ubicación de la reserva blindada', 'G-1 PERSONAL', 'DOCTRINA Y REGLAMENTOS DEL CAMPO (Comandante)', 'FORMATO DE TU RESPUESTA', '| Área / Sección | Guía impartida | Observación |'])
      assert.ok(p.includes(t), `falta «${t}»`)
    assert.ok(p.indexOf('DOCTRINA Y REGLAMENTOS DEL CAMPO') < p.indexOf('# CÓMO CONTESTAR'))
    assert.ok(p.indexOf('# CÓMO CONTESTAR') < p.indexOf('FORMATO DE TU RESPUESTA'))
    assert.ok(!p.includes('LO QUE ORDENÓ EL COMANDANTE'), 'al Comandante no se le repite lo suyo como orden')
  })
  caso('el pedido del JEM lleva lo del Comandante (intención, selección de CAP)', () => {
    const r = R.pedidoHoja('jem', hoja(mesa.OLe, 'libreto'), base())
    for (const t of ['EL COMANDANTE', 'F2·P14 Intención Inicial del Comandante', 'Propósito escrito por el Comandante', 'F3·P8 Cursos de acción que pasan al Juego de Guerra', 'Sumar una reserva', 'EL LIBRETO DEL JEM.'])
      assert.ok(r.prompt.includes(t), `falta «${t}»`)
  })
  caso('las demás secciones (G-1 registrada, G-4 sin registro y G-3) reciben lo que ordenó el Comandante y dispuso el JEM', () => {
    const g1 = R.pedidoHoja('g1', { id: 'tareas', tipo: 'filas', cols: ['Tarea', 'Tipo', 'De dónde sale', 'Quién la ejecuta'] }, base())
    assert.ok(g1.prompt.includes('LO QUE ORDENÓ EL COMANDANTE Y DISPUSO EL JEM') && g1.prompt.includes('Propósito escrito por el Comandante'))
    assert.ok(g1.prompt.indexOf('LO QUE ORDENÓ EL COMANDANTE') < g1.prompt.indexOf('# CÓMO CONTESTAR'))
    const g4 = R.pedidoHoja('g4', { id: 'rcic', tipo: 'filas', cols: ['Requerimiento'] }, base())
    assert.ok(g4.prompt.includes('Propósito escrito por el Comandante'))
    const g3 = R.pedidoG3({ id: 'tareas', tipo: 'filas', cols: ['Tarea'] }, [], base())
    assert.ok(g3.prompt.includes('LO QUE ORDENÓ EL COMANDANTE') && g3.prompt.includes('FORMATO DE TU RESPUESTA'))
    // y sin nada del mando no agrega el bloque
    RT.sincronizarEM({ ...vivo, hojasG: { ...datos.hojasG, cmte: {}, jem: {} }, g3: {} })
    try {
      assert.ok(!R.pedidoHoja('g1', { id: 'tareas', tipo: 'filas', cols: ['Tarea'] }, base()).prompt.includes('LO QUE ORDENÓ EL COMANDANTE'))
    } finally {
      RT.sincronizarEM(vivo)
    }
  })
  caso('el volcado de una hoja: filas, dos listas, campos y documento; corta lo largo; ignora marcas y metadatos', () => {
    assert.ok(MA.volcar([{ A: 'uno', B: '' }, { A: 'dos' }]).includes('- A: uno') )
    assert.ok(MA.volcar({ a: ['x'], b: ['y'] }).includes('- (b) y'))
    assert.ok(MA.volcar({ esquema: 'e', numero: '3', campos: { k: 'valor' }, caps: [{ nombre: 'CAP 1', ventajas: 'v' }] }).includes('CAP 1 · ventajas: v'))
    assert.ok(MA.volcar({ k: 'x'.repeat(2000) }, 100).length <= 101)
    assert.equal(MA.conContenido({ esquema: 'e', numero: '1', ideas: 'sólo ideas', campos: { a: '' } }), false)
    assert.equal(MA.conContenido({ campos: { a: 'algo' } }), true)
  })

  // ── El compilado ──
  caso('el compilado importa la carpeta del motor, comparte con el G-3 y apaga lo que explicaba', () => {
    for (const a of ['editor', 'runtime', 'registro']) assert.ok(SRC.includes(`"../estado-mayor/${V}/${a}.js"`), a)
    assert.ok(SRC.includes('{...ev.flatMap(SIDf=>SIDf.hojas).find(SIDh=>SIDh.id==="guiaInicial"),num:"F1·P6",compartida:"g3"}'))
    assert.ok(SRC.includes('configurarEM({semillaG3:l3e,plazosPrograma:HD,responsablesPrograma:WD,eventosPrograma:Pie});function wDe('))
    for (const t of ['!1&&f.jsxs("div",{style:Wr.ayuda,children:["Éstas son las hojas', 'nota:{display:"none",fontSize:10.5', '!1&&Ke.nota&&', '!1&&nt.nota&&', '!1&&f.jsxs("div",{style:Wr.fuente', '!1&&e&&f.jsx("div",{style:Ir.nota', '!1&&K?.ayuda&&']) assert.ok(SRC.includes(t), t)
  })
  caso('no queda ninguna explicación de qué son las hojas en lo que muestran los editores del motor', () => {
    const ed = fs.readFileSync(path.join(RAIZ, `estado-mayor/${V}/editor.js`), 'utf8')
    for (const t of ['Sale con el membrete', 'La Mesa agrega en el Word el cuadro', 'No se imprime: va al pedido', 'Le manda el expediente COMPLETO']) assert.ok(!ed.includes(t), t)
    assert.ok(ed.includes("h(Guia, { E, guia, abierta: false })"), 'la guía viene plegada')
  })

  for (const [nombre, f] of casos) {
    try {
      await f()
      console.log(`✓ ${nombre}`)
    } catch (e) {
      fallos++
      console.log(`✗ ${nombre}\n  ${String(e?.stack || e).split('\n').slice(0, 4).join('\n  ')}`)
    }
  }
  console.log(fallos ? `${fallos} FALLO(S)` : `OK — ${casos.length} casos`)
  process.exit(fallos ? 1 : 0)
})()
