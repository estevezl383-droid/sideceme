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

console.log(`ia-profesor.cjs OK — ${CAT.PROFESOR.length} pedidos, ${CAT.ORGANIZACIONES.length} organizaciones (${CAT.ORGANIZACIONES.reduce((n, o) => n + o.piezas.length, 0)} fichas), OGO con ${CAT.ANEXOS_OGO.length} anexos; el pedido de la OGO de prueba mide ${ogo.length} caracteres`)
