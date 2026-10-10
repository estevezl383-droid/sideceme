// 🤖 La IA del profesor (calcos/modalidad/ia-profesor.js): los pedidos de cada paso, la OGO con
// todos sus anexos según el foco, y las fichas de las organizaciones tipo y del JSON de la IA
// (armas y escalones del catálogo del compilado publicado).
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const CAT = require('../modalidad/catalogo.js')
const IA = require('../modalidad/ia-profesor.js')

const RAIZ = path.resolve(__dirname, '..')
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
const js = fs.readFileSync(path.join(RAIZ, 'assets', (html.match(/assets\/(index-[\w-]+\.js)/) || [])[1]), 'utf8')

// Los ids de arma y de escalón son los del compilado.
for (const a of IA.ARMAS) assert.ok(js.includes(`{id:"${a}",nombre:`), `arma ${a} en el compilado`)
for (const e of IA.ESCALONES) assert.ok(js.includes(`{id:"${e}",nombre:`), `escalón ${e} en el compilado`)
for (const o of CAT.ORGANIZACIONES) for (const p of o.piezas) {
  assert.ok(IA.ARMAS.includes(p.arma), `${o.id}: arma ${p.arma}`)
  assert.ok(IA.ESCALONES.includes(p.esc), `${o.id}: escalón ${p.esc}`)
}

// Fichas de una organización: la forma de academico.js, el número en vez de %N, ROJO espejado.
const centro = { lat: -17.4, lng: -66.2 }
const ce = IA.fichasDeOrganizacion(IA.organizacionDe('ce'), { bando: 'azul', numero: '2', centro, ahora: 1 })
assert.equal(ce.length, 10)
assert.equal(ce[0].designacion, 'Cmdo. C.E. 2')
assert.equal(ce[1].designacion, 'D.I. 21')
assert.deepEqual(Object.keys(ce[0]).sort(), ['arma', 'bando', 'designacion', 'escalon', 'id', 'lat', 'lng', 'piezas', 'tipo'].sort())
assert.equal(ce[0].bando, 'propias'); assert.equal(ce[0].tipo, 'unidad'); assert.equal(ce[0].escalon, 'cuerpo')
assert.ok(ce[0].lat < centro.lat, 'AZUL: el comando queda al sur del centro')
assert.ok(Math.abs(ce[1].lng - centro.lng) > 0.2 && Math.abs(ce[1].lng - centro.lng) < 0.4, 'a 30 km al oeste')
const rojo = IA.fichasDeOrganizacion(IA.organizacionDe('di'), { bando: 'ROJO', numero: '7', centro, ahora: 2 })
assert.equal(rojo[0].bando, 'enemigas')
assert.ok(rojo[0].lat > centro.lat, 'ROJO: el comando queda al norte (espejado)')
assert.equal(new Set(ce.concat(rojo).map((u) => u.id)).size, 20, 'ids únicos')
assert.equal(IA.fichasDeOrganizacion(IA.organizacionDe('coe'), { numero: '1', centro })[0].designacion, 'Cmdo. COE 1')

// Fichas del bloque json de la IA: bandos sueltos, arma/escalón que no existen, sin lat/lng.
const r = IA.fichasDeJSON('Acá va:\n```json\n[{"designacion":"D. Mec. 3","bando":"enemigo","arma":"mecanizada","escalon":"division","lat":-17.3,"lng":-66.1},{"nombre":"B. Rayos","bando":"propio","arma":"laser","escalon":"flota"}]\n```\nFin.', { centro })
assert.equal(r.fichas.length, 2); assert.equal(r.sinLugar, 1)
assert.equal(r.fichas[0].bando, 'enemigas'); assert.equal(r.fichas[0].arma, 'mecanizada')
assert.equal(r.fichas[1].designacion, 'B. Rayos'); assert.equal(r.fichas[1].arma, 'infanteria'); assert.equal(r.fichas[1].escalon, 'batallon')
assert.ok(isFinite(r.fichas[1].lat))
assert.throws(() => IA.fichasDeJSON('nada'), /JSON/)

// Los pedidos: cabecera con escalón y foco, la tarea del paso, el contexto, el recordatorio.
const ej = { nombre: 'COSA', mision: 'Atacar para conquistar…', ordenSup: { unidad: 'C.E. 2', mision: 'La misión del CE' }, documentos: [{ nombre: 'Situación general', texto: 'x'.repeat(9000) }], unidades: ce }
const ctx = { escalon: CAT.ESCALONES[0], foco: IA.focoDe('g4'), ejercicio: ej, unidades: ce.concat(rojo), centro }
const ogo = IA.armarPedido(CAT.PROFESOR.find((p) => p.ogo), ctx)
assert.ok(ogo.startsWith('# PEDIDO DE TRABAJO PARA LA IA'))
assert.match(ogo, /Comandante de las FF\.TT\./); assert.match(ogo, /Comandantes de Cuerpo de Ejército/)
assert.match(ogo, /ORDEN GENERAL DE OPERACIONES \(OGO\)/)
for (const a of CAT.ANEXOS_OGO) assert.ok(ogo.includes(`Anexo ${a.letra} — ${a.nom}`), `anexo ${a.letra}`)
assert.match(ogo, /Anexo D — [^\n]*ES EL CAMPO QUE SE ENTRENA/)
assert.doesNotMatch(ogo, /Anexo A — [^\n]*ES EL CAMPO QUE SE ENTRENA/)
assert.match(ogo, /G-4 · Logística/); assert.match(ogo, /PARA EL PROFESOR/)
assert.match(ogo, /# CONTEXTO DEL EJERCICIO/); assert.match(ogo, /Nombre: COSA/); assert.match(ogo, /"mision": "La misión del CE"/)
assert.match(ogo, /ROJO · Cmdo\. D\.I\. 7 · infanteria · division/)
assert.match(ogo, /recortado: 3000 caracteres más/)
assert.ok(ogo.length < 30000, 'con este ejercicio chico el pedido es corto: ' + ogo.length)
// con el PMTD completo ningún anexo se marca como campo entrenado
assert.doesNotMatch(IA.armarPedido(CAT.PROFESOR.find((p) => p.ogo), { ...ctx, foco: IA.focoDe('pmtd') }), /ES EL CAMPO QUE SE ENTRENA/)
// cada paso tiene su pedido; el de unidades trae el formato de las fichas; el del CMOC pide avenidas
for (const p of CAT.PROFESOR) {
  const t = IA.armarPedido(p, ctx)
  assert.ok(t.includes('## LA TAREA'), `paso ${p.n}`)
  assert.ok(t.includes(`Paso del armado:** ${p.n} ·`))
  assert.ok(t.trim().endsWith(`el ejercicio entrena ${ctx.foco.nom}.`))
}
assert.match(IA.armarPedido(CAT.PROFESOR[5], ctx), /FORMATO DE LAS FICHAS[\s\S]*"escalon":"division"/)
assert.match(IA.armarPedido(CAT.PROFESOR[3], ctx), /AVENIDAS DE APROXIMACIÓN/)
// sin ejercicio (la Mesa no mandó el puente) el pedido sale igual, con defaults
const sin = IA.armarPedido(CAT.PROFESOR[0], {})
assert.match(sin, /Comandante de Cuerpo de Ejército/); assert.match(sin, /todavía no hay fichas/); assert.match(sin, /PMTD completo/)
// el contexto se recorta al límite
const grande = IA.contexto({ ejercicio: { nombre: 'G', documentos: Array.from({ length: 40 }, (_, i) => ({ nombre: 'Doc ' + i, texto: 'y'.repeat(5000) })) }, limite: 20000 })
assert.ok(grande.length < 20300, 'recortado: ' + grande.length)

// El terreno dibujado (CMOC) va en texto, en lat, lng, antes de la Orden: el corredor sobre caminos,
// las avenidas, el terreno clave, las áreas (aunque tengan cientos de vértices), los obstáculos.
const anillo = Array.from({ length: 400 }, (_, i) => [-68.9 + 0.05 * Math.cos(i / 400 * 2 * Math.PI), -18.1 + 0.05 * Math.sin(i / 400 * 2 * Math.PI)])
anillo.push(anillo[0])
const cmoc = {
  severo: Array.from({ length: 30 }, (_, k) => ({ type: 'Feature', properties: { _clase: 'severo', _origen: k ? 'pendiente' : 'manual', nombre: k ? '' : 'Nevado Sajama' }, geometry: { type: 'Polygon', coordinates: [anillo.map(([x, y]) => [x + k * 0.01, y])] } })),
  restringido: [], defensivo: [], ae: [], desplazamientos: [{ puntos: [[-68.6, -18.7], [-68.4, -18.8]], ruta: [[-68.6, -18.7], [-68.5, -18.75], [-68.4, -18.8]], metricas: { km: 25.3, horas: 1.2 }, bando: 'amigo', pegado: true }],
  corredores: [{ coords: [[-69.0, -18.28], [-68.9, -18.3], [-68.6, -18.35]], escalon: 'division', bando: 'enemigo', _origen: 'vias', km: 45, viaBase: 'ruta primaria' }],
  avenidas: [{ coords: [[-69.04, -18.79], [-68.39, -18.82]], ancho: 'ancho', bando: 'enemigo', poligono: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-69.04, -18.7], [-68.39, -18.7], [-68.39, -18.9], [-69.04, -18.9], [-69.04, -18.7]]] } } }],
  clave: [{ centro: [-69.01, -18.28], etiqueta: 'C1' }, { centro: [-68.39, -18.82], etiqueta: 'C2', motivo: 'Nudo vial de Sabaya' }]
}
const ter = IA.resumenTerreno(cmoc, { obstaculos: [{ tipo: 'minado_ac', coords: [[-68.83, -18.73], [-68.8, -18.74]] }], areaOps: { coords: [[-68.9, -18.5], [-68.3, -18.5], [-68.3, -19], [-68.9, -19]] } }, 'centro')
assert.match(ter, /Terreno SEVERAMENTE RESTRINGIDO: 30 área\(s\), [\d.,]+ km² en total \(1 dibujada\(s\) a mano\); las dibujadas a mano y las más grandes \(12\):/)
assert.match(ter, /TSR-1 · centro -18\.1, -68\.9 · 91,9 km² · entre lat -18\.15 y -18\.05, lng -68\.95 y -68\.85 · dibujada a mano · nombre: Nevado Sajama\n/, 'la dibujada a mano va primero, con su nombre')
assert.equal((ter.match(/ {2}- TSR-/g) || []).length, 12)
assert.doesNotMatch(ter, /type: Feature/)
assert.match(ter, /CM-1 · escalón División \(≈ 15 km de ancho\) · ENEMIGA · sobre caminos \(ruta primaria\) · va de -18\.28, -69 a -18\.35, -68\.6 \([\d,]+ km\), pasa por -18\.3, -68\.9/)
assert.match(ter, /AVENIDAS DE APROXIMACIÓN \(1\), dirección: centro:\n {2}- AA-1 · ENEMIGA · ancho dibujado ≈ (2[0-9]|1[89]),\d km · eje de -18\.79, -69\.04 a -18\.82, -68\.39/)
assert.match(ter, /TERRENO CLAVE \(2\):\n {2}- C1 · -18\.28, -69\.01\n {2}- C2 · -18\.82, -68\.39 · motivo: Nudo vial de Sabaya/)
assert.match(ter, /D-1 · PROPIA · por los caminos · va de -18\.7, -68\.6 a -18\.8, -68\.4[^\n]*km: 25,3, horas: 1,2/)
assert.match(ter, /minado_ac · de -18\.73, -68\.83 a -18\.74, -68\.8/)
assert.match(ter, /Área de Operaciones trazada: entre lat -19 y -18\.5, lng -68\.9 y -68\.3/)
assert.ok(ter.length < 8000, 'cientos de vértices no inflan el pedido: ' + ter.length)
assert.match(IA.resumenAOI({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-69.2, -19], [-68.2, -19], [-68.2, -18], [-69.2, -18], [-69.2, -19]]] } }), /Área de Interés: entre lat -19 y -18, lng -69\.2 y -68\.2 \(≈ 10[0-9],\d km de este a oeste × 11[01],\d km de norte a sur/)
const cm4 = IA.armarPedido(CAT.PROFESOR[3], { ...ctx, ejercicio: { ...ej, cmoc, aoi: { bbox: [-69.2, -19, -68.2, -18] }, ops: { unidadConsiderada: { nombre: 'I C.E. (FICT.)' } } }, fuente: 'la Mesa abierta, tal como está ahora' })
assert.match(cm4, /PARTÍ DE LO QUE EL PROFESOR YA DIBUJÓ/)
assert.match(cm4, /Unidad de los alumnos: I C\.E\. \(FICT\.\)/)
assert.match(cm4, /Leído de: la Mesa abierta/)
assert.ok(cm4.indexOf('### Terreno dibujado en la Mesa') < cm4.indexOf('### Orden del escalón superior'), 'el terreno antes de la Orden')
assert.match(cm4, /Empezá con UNA línea que diga a quién va: «DESTINO: SOLUCIÓN DEL PROFESOR/)
assert.match(IA.armarPedido(CAT.PROFESOR[6], ctx), /Empezá con la línea «DESTINO: SOLUCIÓN DEL PROFESOR/)
// sin nada dibujado lo dice
assert.match(IA.armarPedido(CAT.PROFESOR[3], ctx), /todavía no hay nada dibujado en el CMOC/)

// La carpeta del profesor entra en los pedidos de los OTROS pasos (no en el suyo).
const CARP = require('../modalidad/carpeta.js')
const RESP = fs.readFileSync(path.join(__dirname, 'respuesta-cmoc-profesor.md'), 'utf8')
const carpeta = CARP.poner(CARP.vacia('COSA'), CAT.PROFESOR[3], RESP, { ahora: '2026-10-10T21:40:00Z' })
const ogoCar = IA.armarPedido(CAT.PROFESOR.find((p) => p.ogo), { ...ctx, carpeta })
assert.match(ogoCar, /### CARPETA DEL PROFESOR: lo que ya resolvió con la IA[\s\S]*#### Paso 4 · CMOC: avenidas de aproximación y terreno clave \(🔒 SOLUCIÓN DEL PROFESOR · guardado \d\d\/10\/2026/)
assert.match(ogoCar, /AA-E 2 "SUR"/); assert.match(ogoCar, /Punto crítico a evaluar/)
assert.match(ogoCar, /el párrafo 1\.a y el Anexo A \(Inteligencia\) toman de ahí/)
assert.doesNotMatch(IA.armarPedido(CAT.PROFESOR[3], { ...ctx, carpeta }), /### CARPETA DEL PROFESOR/, 'el paso 4 no lleva su propia respuesta')
assert.match(IA.armarPedido(CAT.PROFESOR[6], { ...ctx, carpeta }), /CARPETA DEL PROFESOR, paso 4[\s\S]*AA-E 1 "NORTE"/, 'los CAE salen de las avenidas guardadas')

console.log(`ia-profesor.cjs OK — ${CAT.PROFESOR.length} pedidos, ${CAT.ORGANIZACIONES.length} organizaciones (${CAT.ORGANIZACIONES.reduce((n, o) => n + o.piezas.length, 0)} fichas), OGO con ${CAT.ANEXOS_OGO.length} anexos; el pedido de la OGO de prueba mide ${ogo.length} caracteres`)
