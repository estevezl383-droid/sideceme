// La F6·P2 GUÍA DE PLANIFICACIÓN FINAL del Comandante con la forma del modelo del TEXTO PMTD 2017
// (calcos/estado-mayor/vN/campos/cmte.js, la carpeta que importa el compilado vigente):
//   · la FORMA: los seis párrafos del modelo, en orden, con su instrucción literal, sin preliminares y sin
//     «No. 01» en el título (el número va en el membrete);
//   · el compilado: las hojas del Comandante pasan por fasesConDocumentos (la F6·P2 es un documento, las demás
//     quedan como estaban) y el avance la cuenta por lo que tiene escrito;
//   · 🌱: la decisión (F6·P1 o el recomendado de la F5·P1), la intención (F2·P14), los RCIC. priorizados (F2·P8 o
//     los del G-3), las prioridades de la Matriz de sincronización y el tipo de orden y de ensayo (F6·SAL), sin pisar;
//     el cuadro viejo «Área / Sección» no se toma como documento;
//   · la IA: el pedido (forma, doctrina, lo que ya está, «NO por sección») y la respuesta (JSON, sólo completar no
//     pisa, ESCRITA como documento con «I.- DECISIÓN.»…);
//   · las demás hojas del Comandante: el mismo pedido de antes (sin bloques nuevos).
//
//   node guia-final.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const { cargar, vigente } = require('./extraer.js')
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.join(AQUI, '..')
const VIGENTE = vigente()
const SRC = fs.readFileSync(VIGENTE, 'utf8')
const V = (SRC.match(/"\.\.\/estado-mayor\/(v\d+)\/registro\.js"/) || [])[1]
const url = (p) => pathToFileURL(path.join(RAIZ, p)).href

let fallos = 0
const casos = []
const caso = (nombre, f) => casos.push([nombre, f])

const M = await import(url(`estado-mayor/${V}/motor.js`))
const R = await import(url(`estado-mayor/${V}/registro.js`))
const RT = await import(url(`estado-mayor/${V}/runtime.js`))
const C = await import(url(`estado-mayor/${V}/campos/cmte.js`))
const { GUIA_FINAL } = C
console.log(`compilado: ${path.basename(VIGENTE)} · motor: calcos/estado-mayor/${V}`)

// El modelo del TEXTO PMTD 2017 (Parte Tercera, Capítulo II, «Guía de Planificación Final»).
const MODELO = [
  ['DECISIÓN.', 'El Comandante debe materializar su decisión respecto a'],
  ['INTENCIÓN DEL COMANDANTE.', 'mantener como definitiva su intención inicial'],
  ['REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE.', 'Requerimientos de Información de las Fuerzas Amigas (RIFA.)'],
  ['PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA.', 'prioridades de apoyo de las Unidades de apoyo de combate o de apoyo de servicio de combate hacia las Unidades de maniobra en algunas fases'],
  ['DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES.', 'como tipo de orden, cantidad de anexos, plazos en tiempo para su elaboración'],
  ['DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.', 'respecto al tipo de ensayo y la técnica usada'],
]

// Un ejercicio FICTICIO, con el CE-I de Sergio como forma (todo «FICT.»).
function ejercicio() {
  return {
    hojas: {
      decisionCmte: { 'Curso de acción aprobado': 'CAP-2', 'Razón de la decisión': 'Mantiene la reserva fuera del alcance del GAAP N° 4 (FICT.)', 'Modificaciones que ordena': 'La DIV-6 (FICT.) se ubica en Turco' },
      intencion: { 'Propósito ampliado': 'Impedir el cruce del río Lauca (FICT.)', 'Tareas clave': 'Retener el paso Ungallire (FICT.); batir la artillería enemiga', 'Estado Final Deseado': 'El enemigo detenido al oeste de la LF PUMA (FICT.)' },
      prioridadRcic: [
        { 'Requerimiento propuesto': '¿Por qué avenida empeña el 2° escalón? (FICT.)', 'Quién lo propone': 'G-2', 'Prioridad que asigna el Cmte.': '2' },
        { 'Requerimiento propuesto': '¿Dónde despliega el GAAP N° 4? (FICT.)', 'Quién lo propone': 'G-3', 'Prioridad que asigna el Cmte.': '1' },
      ],
      // lo que dejó la hoja vieja (el cuadro por sección): NO es la Guía del modelo
      guiaFinal: [{ 'Área / Sección': 'Sección G-1 (Personal)', 'Guía final impartida': 'Recibir 450 reemplazos (FICT.)', Plazo: 'D-10 (1800)' }],
    },
    g3: {
      decision: { _marca: { 'CAP-2': 'RECOMENDADO AL COMANDANTE' } },
      coa: { 'Denominación del CAP': 'CAP 1 — Defensa adelantada (FICT.)' },
      _caps: { activo: 1, guardados: { 2: { coa: { 'Denominación del CAP': 'CAP 2 — Defensa de área en el Lauca (FICT.)' }, concepto: {}, fases: [] } } },
      sincro: { _cols: ['FASE I', 'FASE II', 'FASE III'], 'MANIOBRA|FASE I': 'no va a la guía', 'APOYO DE FUEGOS|FASE II': 'Contrabatería sobre el GAAP N° 4 (FICT.)', 'APOYO DE FUEGOS|FASE III': 'Prioridad a la DIV MEC-2 (FICT.)', 'ADA.|FASE I': 'Prioridad al PC de Ticanani (FICT.)', 'APOYO DE SERVICIO DE COMBATE|FASE III': 'Prioridad de Clase V a la DIV MEC-2 (FICT.)' },
      controlOrden: { 'Tipo de orden (Orden de Operaciones · Plan de Operaciones · Orden Parcial)': 'Orden de Operaciones N° 01 con todos sus anexos (FICT.)', 'Tipo de ensayo (completo · reducido · sobre maqueta · sobre carta · de mando)': 'Ensayo de comandantes sobre maqueta (FICT.)', 'Quiénes participan del ensayo y cuándo': 'Comandantes de división, D-5 (0900) en Challapata (FICT.)' },
      rcic: [{ 'N°': '1', 'Tipo (RCIC / EEIA)': 'RCIC', Requerimiento: '¿Cruza el enemigo por Guata? (FICT.)', '¿Qué decisión sostiene?': 'Empeñar la reserva', 'Plazo (no después de)': 'D+2' }],
    },
  }
}
const ctxDe = (e = ejercicio(), extra = {}) => {
  RT.sincronizarEM({ g3: e.g3, fasesCOA: { propio: [] }, hojasG: { cmte: e.hojas } })
  return RT.contexto({ campo: 'cmte', hojas: e.hojas, ctxDoc: { unidad: 'CE-I (FICT.)', ...extra } })
}
const HOJA = { id: 'guiaFinal', num: 'F6·P2', nom: 'Guía de Planificación Final', tipo: 'docEM', campoEM: 'cmte', docEM: 'guiaFinal' }

// ── LA FORMA ────────────────────────────────────────────────────────────────────────
caso('la forma: los seis párrafos del modelo del PMTD 2017, en orden y con su instrucción literal', () => {
  assert.deepEqual(GUIA_FINAL.arbol.map((n) => n.t), MODELO.map(([t]) => t))
  GUIA_FINAL.arbol.forEach((n, i) => {
    assert.ok(!n.hijos, `${n.t} no tiene subapartados`)
    assert.ok(n.ayuda.includes(MODELO[i][1]), `${n.t}: la instrucción del modelo`)
  })
  assert.equal(GUIA_FINAL.titulo, 'GUÍA DE PLANIFICACIÓN FINAL')
  assert.deepEqual(GUIA_FINAL.preliminares, [])
  const s = M.especificacion(GUIA_FINAL, {})
  assert.equal(s.numero, '', 'el título va sin «No. 01» (el número va en el membrete)')
  assert.deepEqual(s.secciones.map((x) => x.titulo), MODELO.map(([t]) => t))
  assert.ok(!/No\. 01/.test(M.html(GUIA_FINAL, {})))
  assert.ok(M.formatoParaIA(GUIA_FINAL).startsWith('I.- DECISIÓN.  →  "campos"."decision"'))
  assert.ok(M.formatoParaIA(GUIA_FINAL).includes('VI.- DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.  →  "campos"."ensayos"'))
  // los demás documentos del motor siguen con su número
  assert.equal(M.especificacion({ ...GUIA_FINAL, sinNumeroTitulo: false }, {}).numero, '01')
})

// ── EL COMPILADO ────────────────────────────────────────────────────────────────────
caso('el compilado: las hojas del Comandante pasan por el motor; la F6·P2 es un documento, las demás igual', () => {
  assert.ok(SRC.includes('hse={cmte:SIDEMFases({id:"cmte"},PLe),jem:OLe}'))
  assert.ok(!SRC.includes('"../estado-mayor/v6/'), 'el compilado importa la carpeta nueva del motor')
  const mesa = cargar(VIGENTE, ['Mie', 'Pie', 'PLe', 'OLe', 'hse', 'RLe', 'jLe', 'LLe'], { SIDEMFases: R.fasesConDocumentos, SIDEMEs: R.esDocumento, SIDEMTiene: R.tieneDocumento })
  const hojas = mesa.RLe('cmte')
  const gf = hojas.find((h) => h.id === 'guiaFinal')
  assert.equal(gf.num, 'F6·P2')
  assert.equal(gf.tipo, 'docEM')
  assert.ok(R.esDocumento(gf))
  assert.notEqual(gf.tipo, 'filas', 'ya no es el cuadro «Área / Sección · Guía final impartida · Plazo»')
  assert.ok(gf.nota.includes('modelo del TEXTO PMTD 2017'))
  for (const h of hojas.filter((x) => x.id !== 'guiaFinal')) assert.ok(h.tipo !== 'docEM', `${h.num} sigue como estaba`)
  assert.equal(mesa.RLe('jem').filter((h) => h.tipo === 'docEM').length, 0, 'las del JEM no cambian')
  // el avance: el cuadro viejo no cuenta; la guía con algo escrito sí
  const e = ejercicio().hojas
  const sin = mesa.LLe('cmte', { guiaFinal: e.guiaFinal })
  const con = mesa.LLe('cmte', { guiaFinal: M.armar(GUIA_FINAL, {}, { campos: { decision: 'Decido el CAP 2 (FICT.)' } }).valor })
  const vacia = mesa.LLe('cmte', { guiaFinal: M.normalizar(GUIA_FINAL, {}) })
  assert.equal(sin.hechas, 0)
  assert.equal(con.hechas, 1)
  assert.equal(vacia.hechas, 0, 'la guía vacía no cuenta como hecha')
})

// ── 🌱 ──────────────────────────────────────────────────────────────────────────────
caso('🌱: la decisión, la intención, los RCIC., las prioridades, la orden y los ensayos, cada cosa en su párrafo', () => {
  const ctx = ctxDe()
  const P = C.propuestas(ctx).campos
  assert.match(P.decision, /^Señores miembros del Estado Mayor, mi decisión es que el Curso de Acción Propio N° 2 «Defensa de área en el Lauca \(FICT\.\)» es el más adecuado para cumplir con la misión asignada/)
  assert.ok(P.decision.includes('Lo decido porque mantiene la reserva fuera del alcance del GAAP N° 4 (FICT.).'))
  assert.ok(P.decision.includes('Ordeno las siguientes modificaciones al curso de acción: la DIV-6 (FICT.) se ubica en Turco.'))
  assert.equal(P.intencion, 'Propósito: Impedir el cruce del río Lauca (FICT.).\nTareas clave: Retener el paso Ungallire (FICT.); batir la artillería enemiga.\nEstado final deseado: El enemigo detenido al oeste de la LF PUMA (FICT.).')
  assert.equal(P.rcic, '- ¿Dónde despliega el GAAP N° 4? (FICT.) (prioridad 1; lo propuso G-3)\n- ¿Por qué avenida empeña el 2° escalón? (FICT.) (prioridad 2; lo propuso G-2)', 'ordenados por la prioridad del Cmte.')
  assert.ok(!P.prioridades.includes('no va a la guía'), 'la maniobra no es un sistema de apoyo')
  assert.ok(P.prioridades.includes('- Apoyo de fuegos: FASE II: Contrabatería sobre el GAAP N° 4 (FICT.); FASE III: Prioridad a la DIV MEC-2 (FICT.).'))
  assert.ok(P.prioridades.includes('- Defensa antiaérea: FASE I: Prioridad al PC de Ticanani (FICT.).'))
  assert.ok(P.prioridades.includes('- Apoyo de servicio de combate: FASE III: Prioridad de Clase V a la DIV MEC-2 (FICT.).'))
  assert.equal(P.ordenes, 'La orden a elaborar será: Orden de Operaciones N° 01 con todos sus anexos (FICT.).')
  assert.equal(P.ensayos, 'Tipo de ensayo: Ensayo de comandantes sobre maqueta (FICT.).\nParticipantes y momento: Comandantes de división, D-5 (0900) en Challapata (FICT.).')
  // el valor viejo (el cuadro por sección) no es el documento: 🌱 arma la guía entera
  const e = ejercicio()
  const x = M.armar(GUIA_FINAL, e.hojas.guiaFinal, C.propuestas(ctx))
  assert.equal(x.cambios.length, 6)
  assert.ok(!M.textoDe(GUIA_FINAL, x.valor).includes('Área / Sección'))
  // sin pisar
  const propio = M.armar(GUIA_FINAL, {}, { campos: { decision: 'Decido el CAP 1 (lo escribió el Cmte.)' } }).valor
  const y = M.armar(GUIA_FINAL, propio, C.propuestas(ctx))
  assert.equal(y.valor.campos.decision, 'Decido el CAP 1 (lo escribió el Cmte.)')
  assert.equal(y.cambios.length, 5)
})

caso('🌱: sin la F6·P1, el CAP recomendado en la F5·P1; sin la F2·P8 del Cmte., los RCIC. del G-3; sin nada, nada', () => {
  const e = ejercicio()
  delete e.hojas.decisionCmte
  delete e.hojas.prioridadRcic
  const P = C.propuestas(ctxDe(e)).campos
  assert.ok(P.decision.includes('el Curso de Acción Propio N° 2 «Defensa de área en el Lauca (FICT.)», el que me recomendó el Estado Mayor en la Matriz de decisión, es el más adecuado'))
  assert.equal(P.rcic, '- ¿Cruza el enemigo por Guata? (FICT.) (sostiene: Empeñar la reserva; no después de D+2)')
  // sin recomendación ni decisión: no se inventa una decisión
  e.g3.decision = {}
  assert.equal(C.propuestas(ctxDe(e)).campos.decision, undefined)
  assert.deepEqual(C.propuestas(ctxDe({ hojas: {}, g3: {} })).campos, {})
  assert.equal(C.numeroDeCap('Curso de Acción Propio N° 3'), 3)
  assert.equal(C.numeroDeCap('cap 1'), 1)
  assert.equal(C.numeroDeCap('el de la reserva'), null)
})

// ── LA IA ───────────────────────────────────────────────────────────────────────────
caso('la IA: el pedido con la forma del modelo, la doctrina, lo que ya está y «NO por sección»', () => {
  const ctx = ctxDe()
  const cfg = R.configDe('cmte')
  assert.equal(cfg, C.default)
  const r = M.pedido(GUIA_FINAL, {}, {
    expediente: '### ORDEN DE OPERACIONES (FICT.)\nLa CE-I defiende en el Lauca.',
    seccion: cfg.seccionIA,
    producto: C.default.documentos.guiaFinal.producto(ctx, HOJA),
    bloques: [{ titulo: 'LO QUE LA MESA YA CALCULÓ', texto: cfg.datosCalco(ctx) }, { titulo: 'LO QUE YA ENTREGARON', texto: cfg.entregasTexto(ctx) }],
    doctrina: cfg.doctrina(),
    verificacion: C.default.documentos.guiaFinal.verificacion,
  })
  const p = r.prompt
  for (const t of ['GUÍA DE PLANIFICACIÓN FINAL', 'NO la armes como una lista de tareas por sección', 'I.- DECISIÓN.', 'VI.- DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.', 'TEXTO PMTD 2017', 'mi decisión es que el Curso de Acción Propio No. 2', 'D-3 (0800)', 'La CE-I defiende en el Lauca.', 'Curso de Acción Propio N° 2', 'F6·SAL Tipo de ensayo', '"decision": "…"', '"ensayos": "…"'])
    assert.ok(p.includes(t), `el pedido no trae «${t}»`)
})

caso('la IA: la respuesta en JSON, sólo completar no pisa, y ESCRITA como documento', () => {
  const resp = '```json\n' + JSON.stringify({ campos: { decision: 'Decido el CAP 2 (IA, FICT.).', intencion: 'Propósito: … (IA)', rcic: '- RPI: ¿cruza por Guata? (IA)\n- RIFA: ¿llegó la DIV-6? (IA)', prioridades: '- Fuegos a la DIV MEC-2 en la fase III (IA).', ordenes: 'Orden de Operaciones lista el D-3 (0800) (IA).', ensayos: 'Ensayo sobre maqueta el D-5 (IA).' } }) + '\n```'
  const a = M.aplicarRespuesta(GUIA_FINAL, resp, {})
  assert.ok(a.ok, a.error)
  assert.equal(a.n, 6)
  assert.equal(a.valor.campos.rcic, '- RPI: ¿cruza por Guata? (IA)\n- RIFA: ¿llegó la DIV-6? (IA)')
  const propio = M.armar(GUIA_FINAL, {}, { campos: { decision: 'Lo mío (FICT.)' } }).valor
  const b = M.aplicarRespuesta(GUIA_FINAL, resp, propio, { modo: 'completar' })
  assert.equal(b.valor.campos.decision, 'Lo mío (FICT.)')
  assert.equal(b.n, 5)
  const c = M.aplicarRespuesta(GUIA_FINAL, resp, propio, { modo: 'completar_mejorar' })
  assert.equal(c.valor.campos.decision, 'Decido el CAP 2 (IA, FICT.).')
  // escrita como documento (con los títulos y la numeración del modelo)
  const prosa = ['GUÍA DE PLANIFICACIÓN FINAL', '', 'I.- DECISIÓN.', 'Señores miembros del Estado Mayor, decido el CAP 2 (FICT.).', '', 'II.- INTENCIÓN DEL COMANDANTE.', 'Propósito: impedir el cruce (FICT.).', '', 'III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE.', '- ¿Cruza por Guata? (FICT.)', '', 'IV.- PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA.', '- Fuegos a la DIV MEC-2 (FICT.).', '', 'V.- DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES.', 'Orden de Operaciones, lista el D-3 (0800) (FICT.).', '', 'VI.- DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.', 'Ensayo sobre maqueta (FICT.).', '', 'EL COMANDANTE DEL CE-I'].join('\n')
  const d = M.aplicarRespuesta(GUIA_FINAL, prosa, {})
  assert.ok(d.ok, d.error)
  assert.equal(d.como, 'documento')
  assert.equal(d.valor.campos.decision, 'Señores miembros del Estado Mayor, decido el CAP 2 (FICT.).')
  assert.equal(d.valor.campos.ordenes, 'Orden de Operaciones, lista el D-3 (0800) (FICT.).')
  assert.ok(d.valor.campos.ensayos.startsWith('Ensayo sobre maqueta (FICT.).'))
})

// ── LAS DEMÁS HOJAS DEL COMANDANTE ──────────────────────────────────────────────────
caso('las demás hojas del Comandante: el mismo pedido de antes (sólo «FORMATO DE TU RESPUESTA» al final)', () => {
  ctxDe()
  const r = { ok: true, prompt: 'ENCABEZADO\n\n# CÓMO CONTESTAR\n\nJSON' }
  const p = R.pedidoHoja('cmte', { id: 'aprecCmte', tipo: 'campos', campos: ['Situación como la veo hoy'] }, r).prompt
  assert.ok(p.startsWith('ENCABEZADO\n\n# CÓMO CONTESTAR'), 'sin bloques del Comandante antes de «CÓMO CONTESTAR»')
  assert.ok(p.includes('# FORMATO DE TU RESPUESTA'))
  assert.equal(R.guiaHoja('cmte', { id: 'aprecCmte' }), null)
  assert.equal(R.tieneSemilla('cmte', { id: 'aprecCmte' }), false)
  assert.equal(R.guiaIA('cmte', { id: 'intencion' }), null)
  assert.ok(R.guiaHoja('cmte', HOJA).para.includes('NO es una lista de tareas por sección'))
})

for (const [nombre, f] of casos) {
  try {
    await f()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallos++
    console.log(`  ✘ ${nombre}\n    ${e.stack || e.message}`)
  }
}
console.log(fallos ? `\n${fallos} caso(s) fallaron.` : '\nTodos los casos pasan.')
process.exit(fallos ? 1 : 0)
