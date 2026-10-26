// 📄 La F6·P4 «Orden Preparatoria N° 3» con el CAP aprobado (calcos/orden-preparatoria/v1/prep.mjs) y los avisos de
// unidades de esa hoja (calcos/cae-enemigo/v1/revisar.mjs). El caso de Sergio (26-10-2026, CE-I en el AO LAUCA): después
// de «Completar y mejorar», «III.- EJECUCIÓN · A. Concepto de la operación (el CAP aprobado)» quedó VACÍA y el aviso
// nombró como inventadas la «DIV MEC-1» (adyacente de la Orden) y la «VI División de Ejército» (la «VI DE» de la Orden).
//   node orden-preparatoria.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as P from '../orden-preparatoria/v1/prep.mjs'
import * as R from '../cae-enemigo/v1/revisar.mjs'
import * as C from '../cap-propios/v1/carta-ia.mjs'
import * as T from '../cap-propios/v1/texto-carta.mjs'

const require = createRequire(import.meta.url)
const { ejercicioConcepto, HOJA } = require('./concepto-ejemplo.js')
const X = require('./cap-carta-ejemplo.js')

let n = 0
const caso = async (nombre, fn) => { await fn(); n++; console.log('  ✔ ' + nombre) }

// La hoja como la define el compilado (F6·P4).
const PREP3 = {
  id: 'prep3', tipo: 'campos', autollena: 'prep3',
  campos: ['OBJETO', 'CARTA', 'ANEXOS', 'ORGANIZACIÓN (MEDIOS)', 'I.- SITUACIÓN', 'II.- MISIÓN (aprobada)', 'III.- EJECUCIÓN · Intención del Comandante', 'III.- EJECUCIÓN · A. Concepto de la operación (el CAP aprobado)', 'III.- EJECUCIÓN · B. Tareas para las UU. de maniobra', 'III.- EJECUCIÓN · C. Tareas para las otras UU. y de apoyo de combate', 'III.- EJECUCIÓN · D. Instrucciones de coordinación', 'IV.- APOYO DE SERVICIO DE COMBATE', 'V.- COMANDO Y COMUNICACIONES'],
}
const PREP1 = {
  id: 'prep1', tipo: 'campos',
  campos: ['OBJETO', 'CARTA', 'ANEXOS', 'ORGANIZACIÓN (MEDIOS)', 'I.- SITUACIÓN · A. Fuerzas enemigas', 'I.- SITUACIÓN · B. Fuerzas propias (dos escalones arriba)', 'I.- SITUACIÓN · C. Refuerzos y reducciones', 'II.- MISIÓN (la recibida, aún sin reexpresar)', 'III.- EJECUCIÓN · Intención', 'III.- EJECUCIÓN · A. Concepto de la operación', 'III.- EJECUCIÓN · B. Tareas para las UU. de maniobra', 'III.- EJECUCIÓN · C. Tareas para las otras UU. y de apoyo de combate', 'III.- EJECUCIÓN · D. Instrucciones de coordinación', 'IV.- APOYO DE SERVICIO DE COMBATE (opcional)', 'V.- COMANDO Y COMUNICACIONES (opcional)'],
}
const CONC = 'III.- EJECUCIÓN · A. Concepto de la operación (el CAP aprobado)'

const EJ = ejercicioConcepto()
const CTXC = { unidades: EJ.unidades, ops: EJ.ops, cmoc: EJ.cmoc, ordenSup: EJ.ordenSup, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO, efectos: X.EFECTOS, plan: { blancos: [] } }
const LEIDO = C.leerRespuesta(X.RESPUESTA_TEXTO, CTXC)
const CARTA = { nomenclator: T.nomenclatorDe(CTXC), catalogos: { tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO } }
const COA1 = { 'Denominación del CAP': 'CAP 1 — Defensa de área', 'Enunciado completo del curso de acción': 'El CE-I defiende en el AO LAUCA a partir del D (0400) con la DIV MEC-2 como esfuerzo principal sobre la AA-1.' }
const COA2 = { 'Denominación del CAP': 'CAP 2 — Defensa móvil', 'Enunciado completo del curso de acción': 'El CE-I defiende móvilmente: la DIV MEC-2 retarda y la DIV-6 contraataca.' }
const ORDEN = {
  ...EJ.ordenSup,
  enemigo: 'SATURNO emplea su Fuerza Terrestre con la VI DE (CG IQUIQUE, ≈12.800 comb.) en el norte y la I DE (CG ANTOFAGASTA) en el sur. La VI DE ataca con la 1ª Br. Ac. «CORACEROS» por el valle del río LAUCA.',
  propias: 'Las FF.TT.T.O. defienden entre LDE-1 y LDE-2. CE-I en AO LAUCA, CE-III en UYUNI y DIV MEC-1 en TAMBO QUEMADO.',
  coordinacion: 'Día D: 04 de diciembre de 2026; Hora H: 0400.',
  comando: 'PC principal del CE-I en Estancia TICANANI.',
}
// El G-3 de Sergio: el CAP 1 activo (sus fases en la carta) y el CAP 2 guardado; la F5·P1 recomienda uno.
const g3con = (recomendado) => ({
  concepto: HOJA,
  coa: COA1,
  _caps: { activo: 1, guardados: { 2: { fases: LEIDO.caps[2].fases, coa: COA2, concepto: { 'Forma de maniobra elegida y por qué': 'Defensa móvil' } } } },
  ...(recomendado ? { decision: { 'VENTAJAS|CAP-1': 'Retiene el terreno', _marca: { [`CAP-${recomendado}`]: 'RECOMENDADO AL COMANDANTE' } } } : {}),
  eventos: [{ 'N° P.D.': '1', 'Evento crítico': 'La 1ª Br. Ac. cruza la LDE-1 por la AA-1', 'No antes de': 'D', 'No después de': 'D+1', 'Criterio que activa la decisión': 'el grueso blindado en la AIN-2', 'Decisión que se toma': 'empeñar la DIV-6' }],
  controlOrden: { 'Tipo de ensayo (completo · reducido · sobre maqueta · sobre carta · de mando)': 'Sobre carta, D-5 (0900) en Challapata.' },
})
const ctx = (recomendado = 0) => ({ unidades: EJ.unidades, ordenSup: ORDEN, unidad: 'CE-I', g3: g3con(recomendado), fasesCOA: { propio: LEIDO.caps[1].fases } })

await caso('el CAP aprobado: el que recomienda la F5·P1 (aunque esté guardado) o, si no, el activo', () => {
  assert.equal(P.capAprobado(g3con(0), { propio: LEIDO.caps[1].fases }).n, 1)
  const dos = P.capAprobado(g3con(2), { propio: LEIDO.caps[1].fases })
  assert.equal(dos.n, 2)
  assert.equal(dos.recomendado, true)
  assert.equal(dos.coa, COA2)
  assert.equal(dos.fases, LEIDO.caps[2].fases)
})

await caso('🌱 el «Concepto de la operación (el CAP aprobado)» ya no queda vacío: maniobra, fases, fuegos, barreras y estado final', () => {
  const v = P.semillaPrep(PREP3, {}, ctx(1), CARTA)
  const c = v[CONC]
  assert.ok(c, 'la casilla tiene texto')
  assert.match(c, /^CAP 1 «Defensa de área», aprobado por el Comandante \(el recomendado/)
  assert.match(c, /Esfuerzo principal:/)
  assert.match(c, /Fases:\n {3}FASE I/)
  assert.match(c, /FASE V/)
  assert.match(c, /Estado final:/)
  assert.doesNotMatch(c, /\[(Mesa|IA) — verificar\]/)
  assert.match(v['III.- EJECUCIÓN · B. Tareas para las UU. de maniobra'], /^1\. /)
  assert.match(v['III.- EJECUCIÓN · D. Instrucciones de coordinación'], /Día D: 04 de diciembre/)
  assert.match(v['III.- EJECUCIÓN · D. Instrucciones de coordinación'], /P\.D\. 1: La 1ª Br\. Ac\. cruza la LDE-1/)
  assert.match(v['III.- EJECUCIÓN · D. Instrucciones de coordinación'], /Ensayo: Sobre carta/)
  assert.match(v['V.- COMANDO Y COMUNICACIONES'], /TICANANI/)
  for (const k of Object.keys(v)) assert.ok(PREP3.campos.includes(k), `«${k}» es una casilla de la F6·P4`)
})

await caso('🌱 con el CAP 2 recomendado, el concepto es el del CAP 2 (el guardado), con sus fases', () => {
  const c = P.semillaPrep(PREP3, {}, ctx(2), CARTA)[CONC]
  assert.match(c, /^CAP 2 «Defensa móvil»/)
  assert.match(c, /retarda y la DIV-6 contraataca/)
  assert.match(c, /FASE I/)
})

await caso('🌱 la situación en «I.- SITUACIÓN» (la F6·P4 no tiene «A. Fuerzas enemigas» aparte), sin pisar lo escrito', () => {
  const base = { 'I.- SITUACIÓN · A. Fuerzas enemigas': 'La 1ª Br. Ac. «CORACEROS».', 'I.- SITUACIÓN · B. Fuerzas propias (dos escalones arriba)': 'FF.TT.T.O.', 'II.- MISIÓN (ya REEXPRESADA y aprobada)': 'El CE-I defiende…', 'III.- EJECUCIÓN · Intención': 'Detener…', 'III.- EJECUCIÓN · Intención del Comandante': 'Detener…' }
  const v = P.semillaPrep(PREP3, base, ctx(), CARTA)
  assert.equal(v['I.- SITUACIÓN'], 'A. Fuerzas enemigas: La 1ª Br. Ac. «CORACEROS».\nB. Fuerzas propias: FF.TT.T.O.')
  assert.equal(v['II.- MISIÓN (aprobada)'], 'El CE-I defiende…')
  assert.equal(v['III.- EJECUCIÓN · Intención del Comandante'], 'Detener…')
  for (const k of Object.keys(v)) assert.ok(PREP3.campos.includes(k), `«${k}» es una casilla de la F6·P4`)
  // Lo que ya estaba guardado con el rótulo viejo pasa a su casilla y se borra; lo escrito en la casilla no se toca.
  const o = P.ordenarHoja(PREP3, { 'I.- SITUACIÓN': 'Lo mío', 'I.- SITUACIÓN · A. Fuerzas enemigas': 'II División de Ejército enemiga' })
  assert.deepEqual(o.valor, { 'I.- SITUACIÓN': 'Lo mío' })
  // La O.P. N° 1 tiene las tres casillas: queda igual, y no lleva el CAP (todavía no hay).
  const v1 = P.semillaPrep(PREP1, { 'I.- SITUACIÓN · A. Fuerzas enemigas': 'X' }, ctx(), CARTA)
  assert.equal(v1['I.- SITUACIÓN · A. Fuerzas enemigas'], 'X')
  assert.equal(v1['III.- EJECUCIÓN · A. Concepto de la operación'], undefined)
})

await caso('✓ Aplicar: lo que la IA dejó vacío se llena con lo de la Mesa y el mensaje lo dice', () => {
  const ia = { 'III.- EJECUCIÓN · Intención del Comandante': 'Propósito: detener…', [CONC]: '' }
  const r = P.trasIA(PREP3, ia, () => P.semillaPrep(PREP3, {}, ctx(), CARTA))
  assert.equal(r.valor['III.- EJECUCIÓN · Intención del Comandante'], 'Propósito: detener…', 'lo de la IA no se toca')
  assert.match(r.valor[CONC], /^CAP 1/)
  assert.ok(r.cuales.includes(CONC))
  assert.match(P.avisoTrasIA(r), /La IA dejó vacío.*«EJECUCIÓN · A\. Concepto de la operación \(el CAP aprobado\)»/)
  assert.equal(P.avisoTrasIA({ n: 0 }), '')
  // Otra hoja: igual que antes.
  assert.deepEqual(P.trasIA({ id: 'coa', campos: ['QUIÉN'] }, { QUIÉN: '' }, () => ({ QUIÉN: 'x' })).n, 0)
})

await caso('✓ Aplicar: la clave escrita con otras palabras va a su casilla (y sólo si hay UNA)', () => {
  const claves = PREP3.campos.map((k) => ({ k, rot: k }))
  assert.equal(P.claveParecida('III.- EJECUCIÓN · A. Concepto de la operación (CAP aprobado)', claves), CONC)
  assert.equal(P.claveParecida('A. Concepto de la operación', claves), CONC)
  assert.equal(P.claveParecida('Concepto de la operación', claves), CONC)
  assert.equal(P.claveParecida('I.- SITUACIÓN', claves), 'I.- SITUACIÓN')
  assert.equal(P.claveParecida('Cualquier cosa', claves), undefined)
  assert.equal(P.claveParecida('III.- EJECUCIÓN', claves), undefined, 'ambigua: no se adivina')
})

await caso('🤖 el pedido: «casi la Orden de Operaciones», el Concepto obligatorio y lo que trabajó el G-3, antes de «CÓMO CONTESTAR»', async () => {
  const r = { ok: true, prompt: 'EXPEDIENTE…\n\n---\n\n# CÓMO CONTESTAR\n\n```json' }
  const p = (await P.pedidoPrep(Promise.resolve(r), PREP3, ctx(1), () => CARTA)).prompt
  assert.ok(p.indexOf('CASI LA ORDEN DE OPERACIONES') < p.indexOf('# CÓMO CONTESTAR'))
  assert.match(p, /«III\.- EJECUCIÓN · A\. Concepto de la operación \(el CAP aprobado\)» es OBLIGATORIO/)
  assert.match(p, /NO lo metas dentro de la Intención/)
  assert.match(p, /## F3·P6 — Curso de acción propio \(CAP 1\)/)
  assert.match(p, /## F3·P4 — Concepto amplio de la operación/)
  assert.match(p, /## Las fases 🔵 del CAP 1 en la carta\n- FASE I/)
  assert.match(p, /RECOMENDADO AL COMANDANTE: CAP-1/)
  assert.match(p, /## F4·P4 — Eventos críticos/)
  // Otras hojas, igual.
  assert.equal(P.pedidoPrep(r, { id: 'coa' }, ctx()), r)
  assert.equal(P.pedidoPrep({ ok: false }, PREP3, ctx()).ok, false)
})

// ─── Los avisos de la F6·P4 de Sergio ─────────────────────────────────────────────────────────────────────────
// Las fichas rojas de su ejercicio son batallones (la brigada no tiene ficha propia o no tiene escalón).
const UNIDADES = [
  ...EJ.unidades.filter((u) => u.bando !== 'enemigas'),
  { id: 'e-bat', bando: 'enemigas', tipo: 'unidad', designacion: 'BAT. INF. BLIN. «CARAMPAGUÉ»', escalon: 'batallon' },
  { id: 'e-br', bando: 'enemigas', tipo: 'unidad', designacion: '1ª BR. AC. «CORACEROS»' },
]
const CTXA = { unidades: UNIDADES, ordenSup: ORDEN, unidad: 'CE-I' }
const HOJA_IA = {
  'I.- SITUACIÓN': 'A. Fuerzas enemigas: SATURNO emplea su Fuerza Terrestre con la VI DE (CG IQUIQUE) en el norte; la VI DE ataca con la 1ª Br. Ac. «CORACEROS» por el valle del río LAUCA.',
  'III.- EJECUCIÓN · Intención del Comandante': 'Punto decisivo: el desfiladero del río LAUCA, donde se encajona la 1ª Brigada Acorazada «CORACEROS» para impedir la convergencia de las dos brigadas acorazadas de la VI División de Ejército sobre HUACHACALLA. Tareas clave: fijar al primer escalón enemigo al oeste de la LF «PUMA»; mantener enlaces con DIV MEC-1 (PC-1, PC-2, PC-5) y CE-II.',
}

await caso('avisos: la «DIV MEC-1» (adyacente de la Orden) y la «VI DE / VI División» (enemigo de la Orden) no son inventadas', () => {
  assert.deepEqual(R.unidadesInventadas(HOJA_IA, CTXA), [])
  assert.equal(R.avisoHoja(PREP3, HOJA_IA, CTXA), '')
  const g = R.formaciones('la VI DE (CG IQUIQUE) y la I DE, en el sur; la Fase I de la operación')
  assert.deepEqual(g.map((x) => x.clave), ['div6', 'div1'], '«Fase I de la…» no es una división')
  assert.deepEqual(R.formaciones('DIV MEC-1 y DIV-1').map((x) => [x.clave, x.cal]), [['div1', 'MEC'], ['div1', '']])
})

await caso('avisos: sigue avisando la división que no está en ningún lado, y el enemigo es la brigada (no un batallón)', () => {
  const v = { 'III.- EJECUCIÓN · Intención del Comandante': 'Detener a la II División de Ejército enemiga al oeste de la LF «PUMA».' }
  const t = R.avisoHoja(PREP3, v, CTXA)
  assert.match(t, /«II División de Ejército» \(en «III\.- EJECUCIÓN · Intención del Comandante»\) no está en las fichas ni en la Orden superior: el enemigo es 1ª BR\. AC\. «CORACEROS» \(una brigada\)/)
  // Una casilla que la hoja NO tiene (la dejó el 🌱 de antes) no se avisa: no se ve ni sale en el Word.
  assert.equal(R.avisoHoja(PREP3, { 'I.- SITUACIÓN · A. Fuerzas enemigas': 'la II División de Ejército enemiga' }, CTXA), '')
  // Sin la Orden, la DIV MEC-1 junto a «enemigo» sí se avisa (no está en ningún lado).
  assert.equal(R.unidadesInventadas({ x: 'el enemigo envuelve a la DIV MEC-1' }, { unidades: UNIDADES, unidad: 'CE-I' }).length, 1)
})

console.log(`orden-preparatoria: ${n} casos ✔`)
