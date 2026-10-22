// 🗺️ F3·P4 — el concepto de la operación en la carta (calcos/concepto/v1), en Node.
// Con el texto REAL de la F3·P4 de Sergio (fixtures/concepto-ce-i.json) y un ejercicio ficticio con su forma.
//   node concepto.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as Mo from '../concepto-operacion/v1/modelo.mjs'
import * as L from '../concepto-operacion/v1/lector.mjs'
import * as G from '../concepto-operacion/v1/geo.mjs'

const require = createRequire(import.meta.url)
const F = require('../fuegos/plan-fuegos.js')
const { ejercicioConcepto, LUGARES } = require('./concepto-ejemplo.js')

let fallas = 0
function caso(nombre, fn) {
  try { fn(); console.log(`  ✔ ${nombre}`) } catch (e) { fallas++; console.log(`  ✘ ${nombre}\n    ${e.message}`) }
}
const ej = ejercicioConcepto({ conClaves: false })
const propias = ej.unidades.filter((u) => u.bando === 'propias')
const medios = [
  { id: 'ficha:galm1', pos: [-68.55, -18.52], alcance: { m: 30000 }, nombreCompleto: 'GALM-1' },
  { id: 'ficha:ram4', pos: [-68.72, -18.5], alcance: { m: 18000 }, nombreCompleto: 'RAM-4' },
]
const ctx = (extra = {}) => ({ hoja: ej.g3.concepto, areaOps: ej.ops.areaOps, ops: ej.ops, ains: ej.ops.ains, unidades: ej.unidades, cmoc: ej.cmoc, picb: {}, lugares: LUGARES, g3: ej.g3, fuegos: F, medios, unidadesNombradas: (t) => L.unidadesNombradas(t, propias), ...extra })
const r = Mo.proponer(ctx())
const it = (pred) => r.items.filter(pred)
const uno = (pred) => r.items.find(pred)

console.log('\nLector del texto')
caso('la forma de maniobra, las avenidas del esfuerzo principal, las cantidades', () => {
  const c = L.leerConcepto(ej.g3.concepto)
  assert.equal(c.forma, 'defensa_area')
  assert.deepEqual(c.principal.aas, [1, 3])
  assert.deepEqual(c.secundarios[0].aas, [2])
  assert.deepEqual(c.cantidades, { minasAC: 3000, minasAP: null, concertina: 400, explosivoT: 2 })
  assert.ok(c.blindado && c.demoliciones)
})
caso('las líneas: LF «PUMA» con sus lugares y coordenadas; LPR = LF «PUMA»; LDE-1 es la frontera', () => {
  const ls = L.lineasNombradas(ej.g3.concepto[L.CAMPOS.medidas])
  const lf = ls.find((l) => l.nom === 'LF «PUMA»')
  assert.deepEqual(lf.tramos, ['Ecia. Esmeralda', 'Co. Sacabaya', 'Límite Sur en -18.700, -68.760'])
  assert.equal(ls.find((l) => l.nom === 'LPR').refiere, 'LF «PUMA»')
  assert.ok(ls.find((l) => l.nom === 'LDE-1').frontera)
  assert.deepEqual(ls.find((l) => l.nom === 'LDE-2').tramos, ['Turco', 'Huachacalla'])
})
caso('los puntos de contacto con coordenadas (lat, lng → [lng, lat])', () => {
  const pcs = L.puntosDeContacto(ej.g3.concepto[L.CAMPOS.medidas])
  assert.deepEqual(pcs.map((p) => p.nom), ['PC-1', 'PC-2', 'PC-5', 'PC-3', 'PC-4'])
  assert.deepEqual(pcs[0].centro, [-69.0101, -18.5168])
})
caso('la ZO-1 y su lugar; los ejes de la reserva', () => {
  const c = L.leerConcepto(ej.g3.concepto)
  assert.equal(c.zos[0].nom, 'ZO-1')
  assert.match(c.zos[0].texto, /Ungallire–Guata/)
  assert.deepEqual(c.reserva.ejes.map((e) => `${e.a} – ${e.b}`), ['Julo – Bella Vista', 'Macaya – Turco'])
})
caso('«DIV MEC-2» no es «DIV-2» ni «DIV MEC-1»', () => {
  const us = [{ designacion: 'DIV MEC-1' }, { designacion: 'DIV-2' }, { designacion: 'DIV MEC-2' }]
  assert.deepEqual(L.unidadesNombradas('Asignado a la DIV MEC-2 en el norte', us).map((u) => u.designacion), ['DIV MEC-2'])
})

console.log('\nLa plantilla')
caso('propone sin error y el enemigo viene del oeste (las fichas enemigas)', () => {
  assert.ok(r.ok, r.error)
  assert.ok(Math.abs(r.marco.az - 280) < 15, `rumbo ${r.marco.az}`)
})
caso('la LPR es la LF «PUMA» del texto, por Estancia Esmeralda y Cerro Sacabaya', () => {
  const lpr = uno((i) => i.rol === 'lpr')
  assert.equal(lpr.obj.nombre, 'LPR (LF «PUMA»)')
  assert.equal(lpr.fuente, 'texto')
  assert.deepEqual(lpr.obj.coords[0], [-68.86, -18.36])
  assert.deepEqual(lpr.obj.coords[2], [-68.76, -18.7])
})
caso('el esfuerzo principal es la AA-1 y la AA-3 (el texto) y nombra a la DIV MEC-2; el secundario, DIV-1', () => {
  assert.deepEqual(r.principales, [1, 3])
  assert.deepEqual(r.secundarias, [2])
  assert.ok(uno((i) => i.rol === 'ep').obj.texto.includes('DIV MEC-2'))
  assert.ok(uno((i) => i.rol === 'es').obj.texto.includes('DIV-1'))
})
caso('la ZO-1 queda entre Ungallire y Guata, sobre la AA-1, con efecto FIJAR (el texto)', () => {
  const zo = uno((i) => i.rol === 'zo' && i.grupo === 'ZO-1')
  assert.equal(zo.fuente, 'texto')
  const c = Mo.centroDe('limites', zo.obj)
  assert.ok(G.km(c, [-68.995, -18.48]) < 2, `centro ${c}`)
  assert.equal(uno((i) => i.rol === 'efecto' && i.grupo === 'ZO-1').obj.tarea, 'fijar')
})
caso('la ZO-1 lleva minado AC de ≈3 km (3.000 minas), concertina de ≈2 km (400 rollos), zanja y demolición', () => {
  const g = it((i) => i.grupo === 'ZO-1' && i.capa === 'obstaculos')
  const min = g.find((i) => i.obj.tipo === 'minado_ac')
  const [a, b, c] = min.obj.coords
  assert.ok(Math.abs(Math.max(G.km(a, b), G.km(b, c)) - 3) < 0.05)
  assert.ok(Math.abs(G.largo(g.find((i) => i.obj.tipo === 'concertina_triple').obj.coords) - 2) < 0.05)
  assert.ok(g.some((i) => i.obj.tipo === 'zanja_at') && g.some((i) => i.obj.tipo === 'demolicion'))
})
caso('una zona de obstáculos por avenida, la principal más densa; todas DELANTE de la LPR', () => {
  const zos = it((i) => i.rol === 'zo')
  assert.equal(zos.length, 3)
  const M = Mo.marco({ ...ctx() })
  const lpr = uno((i) => i.rol === 'lpr').obj.coords
  for (const z of zos) {
    const c = Mo.centroDe('limites', z.obj)
    const mc = G.masCercano(lpr, c)
    assert.ok(M.en(c).u > M.en(mc.p).u, `${z.grupo} delante de la LPR`)
  }
  assert.ok(it((i) => i.grupo === 'ZO-3' && i.obj.tipo === 'minado_mixto').length === 1, 'la secundaria con minado mixto')
})
caso('el plan de fuegos: zona de aniquilamiento, FPF lineal, interdicción en las A.I.N., contrabatería sobre el GAAP', () => {
  const bl = it((i) => i.capa === 'blancos')
  assert.ok(bl.some((b) => b.obj.tipo === 'proteccion' && b.obj.forma === 'lineal' && b.obj.ejecucion === 'prioritario'))
  assert.ok(bl.some((b) => b.obj.tipo === 'contrabateria' && /GAAP/.test(b.obj.descripcion)))
  for (const n of ['AIN-2', 'AIN-3', 'AIN-5']) assert.ok(bl.some((b) => b.obj.tipo === 'interdiccion' && b.obj.descripcion.includes(n)), n)
  assert.ok(bl.some((b) => b.grupo === 'ZO-1' && b.obj.forma === 'rectangular' && b.obj.efecto === 'destruir'))
})
caso('cada concentración con el medio que la alcanza (o el consejo de cuánto acercarlo)', () => {
  const fpf = uno((i) => i.rol === 'fpf' && /AA-1/.test(i.titulo))
  assert.ok(fpf.obj.medio, 'la FPF de la AA-1 la bate alguien')
  const lejos = uno((i) => i.obj.tipo === 'contrabateria')
  assert.equal(lejos.obj.medio, null)
  assert.match(lejos.porQue, /acercarse/)
})
caso('la reserva en TURCO (el texto) con la DIV-6, el EJE CA-1 (Julo – Bella Vista) y el EJE BLQ-1 (Macaya – Turco)', () => {
  const res = uno((i) => i.rol === 'reserva')
  assert.ok(res.obj.texto.includes('DIV-6'))
  assert.deepEqual(res.obj.centro, [-68.3, -18.5])
  assert.ok(uno((i) => i.obj.nombre === 'EJE CA-1' && i.obj.tipo === 'flecha'))
  assert.ok(uno((i) => i.obj.nombre === 'EJE BLQ-1'))
  assert.ok(uno((i) => i.rol === 'pb'))
})
caso('sin texto: sale todo de la doctrina, del calco y del G-2 (y lo avisa)', () => {
  const s = Mo.proponer(ctx({ hoja: {} }))
  assert.ok(s.ok)
  assert.match(s.avisos[0], /todavía no tiene texto/)
  assert.ok(s.items.some((i) => i.rol === 'lpr' && i.fuente === 'doctrina'))
  assert.ok(s.items.filter((i) => i.rol === 'zo').length >= 2)
  assert.ok(s.items.some((i) => i.rol === 'reserva'))
})
caso('sin Área de Operaciones no inventa nada', () => {
  const s = Mo.proponer(ctx({ areaOps: null }))
  assert.equal(s.ok, false)
  assert.match(s.error, /ÁREA DE OPERACIONES/)
})
caso('la dirección elegida a mano manda sobre las fichas enemigas', () => {
  const s = Mo.proponer(ctx({ conceptoCarta: { dir: 'N' } }))
  assert.equal(s.marco.az, 0)
})

console.log('\nPonerla en el calco, moverla, revisarla y llevarla al texto')
const otroObst = { tipo: 'alambre_simple', estado: 'proyectado', coords: [[-68.5, -18.4], [-68.49, -18.41]] }
const est0 = { ops: { ...ej.ops, obstaculos: [otroObst] }, plan: { version: 1, medios: {}, blancos: [{ id: 'pf-x', num: 'AB-030', lng: -68.6, lat: -18.6, forma: 'circular', radioM: 100 }] }, marcas: [] }
const est = Mo.aplicar(est0, r.items)
caso('aplicar: va a ops.obstaculos / limites / coordinacion, planFuegos.blancos y las marcas, con `co`; lo de antes queda', () => {
  assert.ok(est.ops.obstaculos.includes(otroObst))
  assert.ok(est.ops.obstaculos.filter(Mo.esDelConcepto).length >= 10)
  assert.ok(est.plan.blancos.some((b) => b.id === 'pf-x'))
  assert.equal(est.plan.blancos.filter(Mo.esDelConcepto)[0].num, 'AB-031', 'sigue la numeración del plan de fuegos')
  assert.ok(est.marcas.some((m) => m.tipo === 'reserva'))
})
caso('aplicar otra vez REEMPLAZA lo de la plantilla (no duplica) y respeta lo dibujado aparte', () => {
  const dos = Mo.aplicar(est, r.items)
  assert.equal(dos.ops.obstaculos.length, est.ops.obstaculos.length)
  assert.equal(dos.plan.blancos.length, est.plan.blancos.length)
  assert.ok(dos.ops.obstaculos.includes(otroObst))
})
caso('mover la ZO-1 mueve su grupo (obstáculos, efecto, concentración) y nada más', () => {
  const idx = est.ops.limites.findIndex((l) => l.nombre === 'ZO-1')
  const piv = Mo.centroDe('limites', est.ops.limites[idx])
  const m = Mo.moverPieza(est, { capa: 'limites', idx }, { piv, dx: 2, dy: 0 }, { grupo: true })
  const g = (x) => x.co?.grupo === 'ZO-1'
  const antes = est.ops.obstaculos.filter(g).map((o) => Mo.centroDe('obstaculos', o))
  const desp = m.ops.obstaculos.filter(g).map((o) => Mo.centroDe('obstaculos', o))
  desp.forEach((c, i) => assert.ok(Math.abs(G.km(c, antes[i]) - 2) < 0.02, 'cada obstáculo 2 km'))
  assert.ok(Math.abs(G.km(Mo.centroDe('blancos', m.plan.blancos.find(g)), Mo.centroDe('blancos', est.plan.blancos.find(g))) - 2) < 0.02)
  assert.ok(m.marcas.filter(g).every((x, i) => x !== est.marcas.filter(g)[i]))
  assert.equal(m.ops.obstaculos.find((o) => o.co?.grupo === 'ZO-2'), est.ops.obstaculos.find((o) => o.co?.grupo === 'ZO-2'))
  assert.equal(m.ops.obstaculos[0], otroObst)
})
caso('agrandar y girar una concentración rectangular cambia largo, ancho y orientación', () => {
  const b = est.plan.blancos.find((x) => x.forma === 'rectangular')
  const m = Mo.moverPieza(est, { capa: 'blancos', id: b.id }, { piv: [b.lng, b.lat], escala: 1.5, giro: 30 })
  const n = m.plan.blancos.find((x) => x.id === b.id)
  assert.equal(n.largoM, Math.round(b.largoM * 1.5))
  assert.equal(n.orientacion, (b.orientacion + 30) % 360)
  assert.equal(n.lng, b.lng)
})
caso('girar un obstáculo de línea alrededor de su centro mantiene su largo', () => {
  const i = est.ops.obstaculos.findIndex((o) => o.tipo === 'zanja_at')
  const o = est.ops.obstaculos[i]
  const m = Mo.moverPieza(est, { capa: 'obstaculos', idx: i }, { piv: Mo.centroDe('obstaculos', o), giro: 90 })
  assert.ok(Math.abs(G.largo(m.ops.obstaculos[i].coords) - G.largo(o.coords)) < 0.01)
})
caso('borrar la ZO-1 con su grupo', () => {
  const idx = est.ops.limites.findIndex((l) => l.nombre === 'ZO-1')
  const b = Mo.borrarPieza(est, { capa: 'limites', idx }, { grupo: true })
  assert.ok(!b.ops.obstaculos.some((o) => o.co?.grupo === 'ZO-1') && !b.plan.blancos.some((o) => o.co?.grupo === 'ZO-1') && !b.marcas.some((o) => o.co?.grupo === 'ZO-1'))
  assert.ok(b.ops.obstaculos.some((o) => o.co?.grupo === 'ZO-2'))
})
caso('la paleta: una ZO completa orientada a la avenida más cercana, y una FPF', () => {
  const zo = Mo.piezasDePaleta('zo', [-68.95, -18.6], ctx())
  assert.ok(zo.some((i) => i.capa === 'limites' && /^ZO-\d/.test(i.obj.nombre)))
  assert.ok(zo.filter((i) => i.capa === 'obstaculos').length === 3)
  assert.ok(new Set(zo.map((i) => i.obj.co.grupo)).size === 1, 'todo en un grupo')
  const f = Mo.piezasDePaleta('fpf', [-68.9, -18.5], ctx())
  assert.equal(f[0].obj.tipo, 'proteccion')
})
caso('la congruencia: la ZO batida, el peso en el esfuerzo principal, el eje CA-1 cruza un obstáculo, y la alambrada dibujada aparte (detrás de la LPR y sin fuego)', () => {
  const rev = Mo.revisar({ ...ctx(), ops: est.ops, plan: est.plan, marcas: est.marcas }, { fuegos: F, medios })
  const t = rev.map((x) => `${x.nivel} ${x.texto}`).join('\n')
  assert.match(t, /ok ZO-1: batida por AB-0/)
  assert.match(t, /aviso 1 obstáculo\(s\) DETRÁS de la LPR/, 'sólo la alambrada dibujada aparte')
  assert.match(t, /aviso 1 obstáculo\(s\) sin una concentración/, 'ídem')
  const limpio = Mo.aplicar({ ops: ej.ops, plan: {}, marcas: [] }, r.items)
  const t2 = Mo.revisar({ ...ctx(), ops: limpio.ops, plan: limpio.plan, marcas: limpio.marcas }, { fuegos: F, medios }).map((x) => `${x.nivel} ${x.texto}`).join('\n')
  assert.match(t2, /ok Los obstáculos están delante de la LPR/)
  assert.match(t2, /ok Los \d+ obstáculos están batidos/)
  assert.match(t, /ok El peso de obstáculos y fuegos está sobre el esfuerzo principal \(AA-1/)
  assert.match(t, /aviso EJE CA-1 cruza un obstáculo propio/)
  assert.match(t, /ok Reserva detrás de la LPR/)
})
caso('la congruencia avisa el obstáculo sin fuego', () => {
  const sinFuego = { ...est, plan: { ...est.plan, blancos: [] } }
  const rev = Mo.revisar({ ...ctx(), ops: sinFuego.ops, plan: sinFuego.plan, marcas: est.marcas }, { fuegos: F, medios })
  assert.ok(rev.some((x) => x.nivel === 'aviso' && /ninguna concentración la bate/.test(x.texto)))
})
caso('del calco al texto: el bloque «Según el calco» va al final y se reemplaza, sin tocar lo escrito', () => {
  const t = Mo.textoDelCalco(est)
  assert.match(t.barreras, /ZO-1 \(efecto: FIJAR\)/)
  assert.match(t.fuegos, /AB-031/)
  const v1 = Mo.conBloque('Lo que escribió el G-3.', t.barreras)
  const v2 = Mo.conBloque(v1, 'nuevo bloque')
  assert.ok(v1.startsWith('Lo que escribió el G-3.\n\n— Según el calco'))
  assert.equal(v2, 'Lo que escribió el G-3.\n\nnuevo bloque')
})

console.log(fallas ? `\n${fallas} caso(s) fallaron.` : '\nTodos los casos pasan.')
process.exitCode = fallas ? 1 : 0
