// 🔥 Los fuegos por fase y 📝 el texto de la F3·P6 desde la carta (calcos/cap-propios/v1/carta-ia.mjs, texto-carta.mjs,
// la acción «texto» de proponer.mjs y pedidoCAP de panel.js), con el ejercicio de prueba del CE-I y la respuesta de IA
// de ejemplo (cap-carta-ejemplo.js, que trae fuegos en la fase 4 de cada CAP).
//   node cap-texto.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as C from '../cap-propios/v1/carta-ia.mjs'
import * as T from '../cap-propios/v1/texto-carta.mjs'
import * as P from '../cap-propios/v1/proponer.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto } = require('./concepto-ejemplo.js')
const X = require('./cap-carta-ejemplo.js')

let n = 0
const caso = async (nombre, fn) => { await fn(); n++; console.log('  ✔ ' + nombre) }

const EJ = ejercicioConcepto()
const PLAN = { version: 1, medios: {}, verEnCarta: true, blancos: [{ id: 'pf-1', num: 'AB-012', lng: -69.0, lat: -18.5, tipo: 'apoyo', efecto: 'neutralizar' }] }
const CTX = { unidades: EJ.unidades, ops: EJ.ops, cmoc: EJ.cmoc, ordenSup: EJ.ordenSup, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO, efectos: X.EFECTOS, plan: PLAN }
const CAT = { tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO }
const R = C.leerRespuesta(X.RESPUESTA_TEXTO, CTX)
const NOM = T.nomenclatorDe(CTX)

await caso('🔥 cada fase trae su plan de fuegos: el de la Mesa más las concentraciones de esa fase', () => {
  const f = R.caps[1].fases
  assert.deepEqual(f.map((x) => x.plan.blancos.map((b) => b.num)), [['AB-012'], ['AB-012'], ['AB-012'], ['AB-012', 'AB-013', 'AB-014'], ['AB-012']])
  const [, b13, b14] = f[3].plan.blancos
  assert.deepEqual([b13.lng, b13.lat], [-69.02, -18.47], 'en Ungallire')
  assert.equal(b13.tipo, 'proteccion')
  assert.equal(b13.efecto, 'destruir')
  assert.equal(b13.descripcion, 'lo bate RAM-4 — para batir la ZO-1')
  assert.equal(b13.fase, 'CAP 1 · fase 4')
  assert.equal(b14.tipo, 'contrabateria', '«Contrabatería» por su nombre')
  assert.equal(b14.efecto, 'neutralizar', 'sin efecto: neutralizar')
  assert.equal(f[3].plan.verEnCarta, true)
  assert.deepEqual(R.caps[2].fases[3].plan.blancos.map((b) => [b.num, b.tipo]), [['AB-012', 'apoyo'], ['AB-013', 'interdiccion']], 'cada CAP numera los suyos; el de «Pampa Inexistente» no se pone')
})

await caso('🔥 lo que puso antes la IA no se repite al volver a pedirlo', () => {
  const otraVez = C.leerRespuesta(X.RESPUESTA_TEXTO, { ...CTX, plan: R.caps[1].fases[3].plan })
  assert.deepEqual(otraVez.caps[1].fases[3].plan.blancos.map((b) => b.num), ['AB-012', 'AB-013', 'AB-014'])
})

await caso('🔥 el pedido lleva los tipos de fuego y los efectos de la Mesa', () => {
  const p = C.pedidoCarta({ ctx: CTX, P: P.proponer(CTX), tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO, efectos: X.EFECTOS }).prompt
  assert.match(p, /## Tipos de fuego \(id\)\nproteccion|## Tipos de fuego \(id\)\npreparacion \(Fuego de preparación\)/)
  assert.match(p, /## Efectos del fuego \(id\)\ndestruir \(Destruir\)/)
  assert.match(p, /Los FUEGOS son de cada fase/)
  assert.match(p, /"fuegos": \[/)
})

await caso('📝 las fases en palabras: de dónde a dónde, tareas, obstáculos y fuegos nuevos de cada fase', () => {
  const D = T.describirFases(R.caps[1].fases, { nomenclator: NOM, catalogos: CAT })
  assert.deepEqual(D[0].movimientos, ['DIV MEC-2 (Concentrarse) en Turco', 'DIV-1 (Concentrarse) en Huachacalla', 'DIV-6 (Concentrarse) en Turco'])
  assert.deepEqual(D[1].movimientos, ['DIV MEC-2 (Desplazarse a su sector) de Turco a Macaya', 'DIV-1 (Desplazarse a su sector) de Huachacalla a Bella Vista'])
  assert.deepEqual(D[3].tareas, ['Bloquear (DIV MEC-2) en Guata, hacia el NO', 'Fijar (DIV-1) a 7 km al O de Julo, hacia el E'])
  assert.deepEqual(D[2].obstaculos, ['Campo minado anticarro en Guata', 'Zanja antitanque a 3 km al NO de Guata'])
  assert.deepEqual(D[3].obstaculos, [], 'los obstáculos de la fase 3 no se repiten')
  assert.deepEqual(D[0].fuegos, ['AB-012 fuego de apoyo / acompañamiento a 3 km al O de Guata'])
  assert.deepEqual(D[1].fuegos, [], 'el de la Mesa no se repite')
  assert.deepEqual(D[3].fuegos, ['AB-013 fuego de protección final (barrera) en Ungallire — lo bate RAM-4 — para batir la ZO-1', 'AB-014 contrabatería en Guallatire — lo bate GALM-1'])
  assert.equal(D[0].cuando, 'D-10 a D-8')
  const D2 = T.describirFases(R.caps[2].fases, { nomenclator: NOM, catalogos: CAT })
  assert.equal(D2[1].movimientos[1], 'DIV-1 (Desplazarse a su sector) de un punto a 17 km al NO de Bella Vista a Estancia Esmeralda')
})

await caso('📝 los bloques de la F3·P6: QUIÉN, CUÁNDO, DÓNDE, CÓMO y el bosquejo', () => {
  const t = T.textoDeLaCarta(R.caps[1].fases, { nomenclator: NOM, catalogos: CAT }).campos
  for (const v of Object.values(t)) assert.ok(v.startsWith(T.MARCA_CARTA + '\n'))
  assert.equal(t.QUIÉN, `${T.MARCA_CARTA}\nDIV MEC-2, DIV-1 y DIV-6.`)
  assert.match(t.CUÁNDO, /Fase 4 \(Conducción de la defensa\): D a D\+8\./)
  // Cada unidad con su tarea táctica (25-10-2026): en la fase 4 la DIV-1 está con su «Fijar» de la AIN-5 (7 km al O de
  // Julo) y en la 5 la DIV-6 con su «Destruir» de Guata (la IA la había dejado en Macaya, lejos de su tarea).
  assert.match(t.DÓNDE, /^.*\nEn la fase 4 \(Conducción de la defensa\): .*DIV MEC-2 en Guata; DIV-1 a 7 km al O de Julo; DIV-6 en Estancia Ticanani/)
  assert.match(t['CÓMO (forma de maniobra)'], /Fase 4 — Conducción de la defensa: .*DIV-1 \(Defender la LPR\) de Julo a un punto a 7 km al O de Julo; .*Fijar \(DIV-1\) a 7 km al O de Julo, hacia el E\./)
  assert.match(t['CÓMO (forma de maniobra)'], /Fase 5 — Contraataque y consolidación: DIV-6 \(Contraatacar\) de Estancia Ticanani a Guata; Destruir \(DIV-6\) en Guata, hacia el NO\./)
  assert.match(t['Bosquejo: qué muestra el calco'], /FASE 4 — Conducción de la defensa \(D a D\+8\): .*Fuegos: AB-013/)
  assert.deepEqual(T.textoDeLaCarta([], {}).campos, {})
})

await caso('📝 el bloque «Según la carta» va al final, se reemplaza y no toca lo del oficial', () => {
  const b1 = `${T.MARCA_CARTA}\nuno`
  const b2 = `${T.MARCA_CARTA}\ndos`
  assert.equal(T.conBloqueCarta('Lo del oficial.', b1), `Lo del oficial.\n\n${b1}`)
  assert.equal(T.conBloqueCarta(`Lo del oficial.\n\n${b1}`, b2), `Lo del oficial.\n\n${b2}`)
  assert.equal(T.conBloqueCarta('', b1), b1)
  assert.equal(T.conBloqueCarta(`Lo del oficial.\n\n${b1}`, ''), 'Lo del oficial.')
  assert.deepEqual(T.hojaConCarta({ QUIÉN: 'x', QUÉ: 'Defiende' }, { QUIÉN: b1, DÓNDE: '' }), { valor: { QUIÉN: `x\n\n${b1}`, QUÉ: 'Defiende' }, n: 1 })
})

await caso('📝 la acción «texto»: la F3·P6 de los dos CAP (el activo y el guardado), o el aviso si no hay fases', () => {
  const ll = []
  const esc = { campos: (fases) => T.textoDeLaCarta(fases, { nomenclator: NOM, catalogos: CAT }).campos, conBloques: (v, c) => T.hojaConCarta(v, c).valor }
  const M = {
    fasesCOA: { propio: R.caps[1].fases, enemigo: [] },
    g3: { coa: { QUÉ: 'Defiende (lo escribió el oficial).' }, _caps: { activo: 1, guardados: { 2: { fases: R.caps[2].fases, coa: {} } } } },
    flush: (fc) => fc,
    setG3: (v) => ll.push(['g3', v]),
    aviso: (t) => ll.push(['aviso', t]),
  }
  assert.deepEqual(P.accion('texto', esc, M), [1, 2])
  const g = ll[0][1]
  assert.equal(g.coa.QUÉ, 'Defiende (lo escribió el oficial).')
  assert.match(g.coa['Bosquejo: qué muestra el calco'], /AB-013/)
  assert.match(g._caps.guardados[2].coa['Bosquejo: qué muestra el calco'], /Retardo y canalización/)
  assert.equal(g._caps.guardados[2].fases.length, 5, 'las fases guardadas no se tocan')
  assert.match(ll[1][1], /La F3·P6 de los dos CAP tiene ahora el bloque «Según la carta»/)
  ll.length = 0
  assert.equal(P.accion('texto', esc, { ...M, fasesCOA: { propio: [] }, g3: {} }), false)
  assert.match(ll[0][1], /Todavía no hay nada en la carta/)
})

await caso('🔥 colocar: la fase 1 del CAP activo pone su plan de fuegos en la carta', () => {
  const planes = []
  P.accion('colocar', { resultado: R }, { fasesCOA: { propio: [] }, g3: {}, setFases: () => {}, setG3: () => {}, setActiva: () => {}, setUnidades: () => {}, setOps: () => {}, setPlan: (p) => planes.push(p) })
  assert.equal(planes.length, 1)
  assert.deepEqual(planes[0].blancos.map((b) => b.num), ['AB-012'])
})

await caso('🤖 el pedido de la F3·P6 lleva «LO QUE YA ESTÁ EN LA CARTA» del CAP activo', async () => {
  const { pedidoCAP, configurarCAP } = await import('../cap-propios/v1/panel.js')
  // Lo que en la Mesa le pasan el compilado (configurarCAP) y el plan de fuegos (window.MesaFuegos).
  configurarCAP({ tareas: X.TAREAS, obstaculos: X.OBSTACULOS })
  globalThis.window = { MesaFuegos: { modelo: { TIPOS_FUEGO: X.TIPOS_FUEGO, EFECTOS: X.EFECTOS } } }
  const PEDIDO = { ok: true, prompt: 'Encabezado\n\n---\n\n# CÓMO CONTESTAR\n\n```json\n{}\n```' }
  const ctx = { ...CTX, g3: {}, fasesCOA: { propio: R.caps[1].fases } }
  const r = pedidoCAP(PEDIDO, { id: 'coa' }, ctx)
  const i = r.prompt.indexOf('# LO QUE YA ESTÁ EN LA CARTA — CAP 1, fase por fase')
  assert.ok(i > 0 && i < r.prompt.lastIndexOf('# CÓMO CONTESTAR'))
  assert.ok(r.prompt.indexOf('# LO QUE PROPONE LA MESA') < i, 'después de la propuesta')
  assert.match(r.prompt, /si algo de la propuesta de la Mesa no coincide con la carta, manda la carta/)
  assert.match(r.prompt, /- FASE 4 — Conducción de la defensa \(D a D\+8\): DIV MEC-2 \(Detener al enemigo en la AA-1\) de Estancia Esmeralda a Guata; DIV-1 \(Defender la LPR\) de Julo a un punto a 7 km al O de Julo; tarea táctica Bloquear \(DIV MEC-2\) en Guata/)
  assert.ok(!/LO QUE YA ESTÁ EN LA CARTA/.test(pedidoCAP(PEDIDO, { id: 'coa' }, { ...ctx, fasesCOA: { propio: [] } }).prompt), 'sin fases, sin el bloque')
  assert.equal(pedidoCAP(PEDIDO, { id: 'eventos' }, ctx), PEDIDO)
})

console.log(`cap-texto: ${n} casos ✔`)
