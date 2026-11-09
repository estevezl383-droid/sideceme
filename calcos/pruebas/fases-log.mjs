// 🚚 Lo del G-4 y del G-1 a lo largo de las fases (logistica/v1/fases-log.mjs), con la Mesa simulada: `fo` guarda la
// fase activa y `Uo` toca otra, como en el compilado (index-fases-log-20261108.js).
//   node calcos/pruebas/fases-log.mjs
import assert from 'node:assert/strict'
import { alGuardar, alCargar, globalesDe, dentro, fichaGlobal, areasDe } from '../logistica/v1/fases-log.mjs'

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.stack || e.message).split('\n').slice(0, 6).join('\n      ')}`)
  }
}

// ─── La Mesa simulada (lo mismo que hacen fo y Uo en el compilado) ───
const Qr = (o) => {
  const q = { ...(o || {}) }
  delete q.ains
  return q
}
function fo(M, Ee = M.fases) {
  const yt = M.yt
  const despues = yt ? { ...Ee, [yt.bando]: Ee[yt.bando].map((f, i) => (i === yt.idx ? { ...f, unidades: M.dn.filter((u) => u.deFaseEnemiga == null), ops: Qr(M.Lt) } : f)) } : Ee
  return alGuardar(Ee, despues, { activa: yt, unidades: M.dn, ops: M.Lt })
}
function tocar(M, bando, idx) {
  const fc = alCargar(fo(M), M.fases, { activa: M.yt, unidades: M.dn, ops: M.Lt })
  const xt = fc[bando][idx]
  return { fases: fc, yt: { bando, idx }, dn: [...xt.unidades], Lt: { ...Qr(xt.ops), ains: M.Lt.ains || [] } }
}
const cambiarOps = (M, f) => ({ ...M, Lt: f(M.Lt) })
const cambiarFichas = (M, f) => ({ ...M, dn: f(M.dn) })
// Cambio de CAP: guarda, intercambia y queda sin fase activa (como cambiarCAP + setActiva(null)).
function cambiarCAP(M, guardado) {
  const fc = fo(M)
  return { M: { ...M, fases: { ...fc, propio: guardado }, yt: null }, otro: fc.propio }
}

// ─── El ejercicio de prueba ───
const ARCE = { coords: [[-69, -18], [-68.9, -18], [-68.9, -18.1], [-69, -18.1]], zona: 'arce', division: 1, clave: 'arce-k1' }
const MARCO = { centro: [-68.95, -18], escalon: 'cuerpo', rot: 0, origen: 'zona-arce-k1' }
const SECTOR = { coords: [[-69, -18], [-68.95, -18], [-68.95, -18.05]], nombre: 'Sanidad', sector: 'san', areaLog: 'arce-k1' }
const BATLOG = { id: 'bl-1', tipo: 'instalacion', instalacion: 'p_sanidad', bando: 'propias', origen: 'plantilla-asdi', areaLog: 'arce-k1', lng: -68.97, lat: -18.03 }
const DIV = (n, lng) => ({ id: `div-${n}`, tipo: 'unidad', bando: 'propias', designacion: `DIV-${n}`, lng, lat: -17.5 })
const ROJO = { id: 'r-1', tipo: 'unidad', bando: 'enemigo', designacion: 'BRIG-1', lng: -68.5, lat: -17 }
const EPA = { coords: [[-68.95, -18.05], [-68.8, -17.6], [-68.7, -17.4]], tipo: 'epa' }
const EPE = { coords: [[-68.7, -17.4], [-68.85, -17.7], [-68.95, -18.06]], tipo: 'epe' }
const EXTRAV = { coords: [[-69.2, -17.8], [-68.4, -17.8]], tipo: 'extraviados' }
const PCE = { id: 'pce-1', tipo: 'instalacion', instalacion: 'pce', bando: 'propias', lng: -68.8, lat: -17.8 }
const LIM = (n) => ({ coords: [[-69, -17 - n / 10], [-68, -17 - n / 10]], escalon: 'division', tipo: 'magnitud' })

// Cinco fases propias «de antes» (sin logV), cada una con su dispositivo y su límite; el ARCE (con el Batallón
// Logístico y su sector) sólo en la FASE 1, como en la captura de Sergio; dos fases del enemigo.
function ejercicio() {
  const fase = (i, extra = {}) => ({
    nombre: `FASE ${i + 1}`,
    unidades: [DIV(1, [-68.6, -68.59, -68.58, -68.57, -68.56][i]), DIV(2, -68.4), ...(extra.unidades || [])],
    ops: { limites: [LIM(i)], zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [], magnitudes: [{ centro: [-68.5, -17], escalon: 'division', origen: `lim-${i}` }], ...(extra.ops || {}) },
    desplazamientos: [],
  })
  const propio = [0, 1, 2, 3, 4].map((i) => fase(i, i === 0 ? { unidades: [BATLOG], ops: { zonasLog: [ARCE], sectoresLog: [SECTOR], magnitudes: [MARCO, { centro: [-68.5, -17], escalon: 'division', origen: 'lim-0' }] } } : {}))
  const enemigo = [0, 1].map((i) => ({ nombre: `E${i + 1}`, unidades: [ROJO], ops: { limites: [], zonasLog: [] } }))
  // A la vista: la FASE 2 (sin el ARCE), como en la segunda captura.
  const M = { fases: { propio, enemigo }, yt: { bando: 'propio', idx: 1 }, dn: [...propio[1].unidades], Lt: { ...propio[1].ops, ains: [{ id: 'ain-1' }] } }
  return M
}
const zonas = (f) => (f.ops.zonasLog || []).map((z) => z.clave)
const ejes = (f) => (f.ops.ejesLog || []).map((e) => `${e.tipo}:${e.coords.length}:${e.coords[1].join(',')}`)
const tiene = (f, id) => f.unidades.some((u) => u.id === id)
const ficha = (f, id) => f.unidades.find((u) => u.id === id)
const todas = (M) => [...M.fases.propio, ...M.fases.enemigo]

console.log('\nfases-log.mjs — el G-4 y el G-1 a lo largo de las fases\n')

caso('geometría: dentro del ARCE / fuera', () => {
  assert.equal(dentro([-68.95, -18.05], ARCE.coords), true)
  assert.equal(dentro([-68.8, -17.8], ARCE.coords), false)
  assert.equal(fichaGlobal(BATLOG, areasDe({ zonasLog: [ARCE] })), true)
  assert.equal(fichaGlobal(PCE, areasDe({ zonasLog: [ARCE] })), false)
  assert.equal(fichaGlobal(DIV(1, -68.95), areasDe({ zonasLog: [ARCE] })), false, 'una unidad de maniobra no es logística')
})

caso('el ARCE de la FASE 1 (de antes) aparece en TODAS las fases al tocar una, con su sector, su marco y el Batallón Logístico', () => {
  let M = ejercicio()
  M = tocar(M, 'propio', 3)
  for (const f of todas(M)) {
    assert.deepEqual(zonas(f), ['arce-k1'], f.nombre)
    assert.equal(f.ops.sectoresLog.length, 1, f.nombre)
    assert.ok(f.ops.magnitudes.some((m) => m.origen === 'zona-arce-k1'), `${f.nombre}: el marco del área`)
    assert.ok(tiene(f, 'bl-1'), `${f.nombre}: el Batallón Logístico`)
    assert.equal(f.logV, 1)
  }
  assert.deepEqual(zonas({ ops: M.Lt }), ['arce-k1'], 'a la vista')
  assert.ok(tiene({ unidades: M.dn }, 'bl-1'))
  // Lo de cada fase sigue siendo de cada fase.
  assert.deepEqual(M.fases.propio.map((f) => f.ops.limites[0].coords[0][1]), [-17, -17.1, -17.2, -17.3, -17.4])
  assert.deepEqual(M.fases.propio.map((f) => f.ops.magnitudes.filter((m) => !m.origen.startsWith('zona-')).map((m) => m.origen)), [['lim-0'], ['lim-1'], ['lim-2'], ['lim-3'], ['lim-4']])
  assert.deepEqual(M.fases.propio.map((f) => ficha(f, 'div-1').lng), [-68.6, -68.59, -68.58, -68.57, -68.56])
  assert.deepEqual(M.Lt.ains, [{ id: 'ain-1' }], 'las A.I.N. no se tocan')
  assert.ok(!tiene(M.fases.enemigo[0], 'div-1') && tiene(M.fases.enemigo[0], 'r-1'), 'las fases del enemigo conservan sus fichas')
})

caso('lo que se cambia del ARCE en una fase cambia en todas; si se borra, no vuelve', () => {
  let M = tocar(ejercicio(), 'propio', 3)
  const otra = [[-69, -18], [-68.8, -18], [-68.8, -18.2], [-69, -18.2]]
  M = cambiarOps(M, (o) => ({ ...o, zonasLog: o.zonasLog.map((z) => ({ ...z, coords: otra, elegida: true })) }))
  M = cambiarFichas(M, (us) => us.map((u) => (u.id === 'bl-1' ? { ...u, lng: -68.9, lat: -18.15 } : u)))
  M = tocar(M, 'propio', 0)
  for (const f of todas(M)) {
    assert.deepEqual(f.ops.zonasLog[0].coords, otra, f.nombre)
    assert.equal(f.ops.zonasLog[0].elegida, true)
    assert.equal(ficha(f, 'bl-1').lng, -68.9, f.nombre)
  }
  // Borrar el ARCE y su Batallón Logístico en la FASE 1: no queda en ninguna.
  M = cambiarOps(M, (o) => ({ ...o, zonasLog: [], sectoresLog: [], magnitudes: o.magnitudes.filter((m) => !m.origen.startsWith('zona-')) }))
  M = cambiarFichas(M, (us) => us.filter((u) => u.origen !== 'plantilla-asdi'))
  M = tocar(M, 'propio', 4)
  M = tocar(M, 'propio', 2)
  for (const f of todas(M)) {
    assert.deepEqual(zonas(f), [], f.nombre)
    assert.equal(f.ops.sectoresLog.length, 0)
    assert.ok(!tiene(f, 'bl-1'), f.nombre)
  }
})

caso('borrar el ARCE en la fase a la vista (de antes) no lo resucita desde las otras fases de antes', () => {
  const M0 = ejercicio()
  // Todas de antes y TODAS con el ARCE (armadas cuando ya estaba); a la vista la FASE 2, donde se lo saca.
  M0.fases.propio = M0.fases.propio.map((f) => ({ ...f, unidades: [...f.unidades.filter((u) => u.id !== 'bl-1'), BATLOG], ops: { ...f.ops, zonasLog: [ARCE], sectoresLog: [SECTOR] } }))
  let M = { ...M0, dn: [...M0.fases.propio[1].unidades], Lt: { ...M0.fases.propio[1].ops, ains: [] } }
  M = cambiarOps(M, (o) => ({ ...o, zonasLog: [], sectoresLog: [] }))
  M = cambiarFichas(M, (us) => us.filter((u) => u.id !== 'bl-1'))
  M = tocar(M, 'propio', 0)
  for (const f of todas(M)) {
    assert.deepEqual(zonas(f), [], f.nombre)
    assert.ok(!tiene(f, 'bl-1'), f.nombre)
  }
})

caso('el EPA y el EPE trazados en la FASE III pasan a la IV y la V (no a la I ni a la II)', () => {
  let M = tocar(ejercicio(), 'propio', 2)
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: [...o.ejesLog, EPA, EPE] }))
  M = tocar(M, 'propio', 3)
  assert.deepEqual(M.fases.propio.map((f) => f.ops.ejesLog.length), [0, 0, 2, 2, 2])
  assert.equal(M.Lt.ejesLog.length, 2, 'a la vista en la FASE IV')
  assert.ok(M.Lt.ejesLog.every((e) => e.lid), 'cada eje con su huella')
  M = tocar(M, 'propio', 4)
  assert.equal(M.Lt.ejesLog.length, 2, 'a la vista en la FASE V')
  M = tocar(M, 'propio', 0)
  assert.equal(M.Lt.ejesLog.length, 0, 'la FASE I sin ejes')
})

caso('cambiado en la FASE V queda sólo en la V; si después se cambia en la III, la IV lo sigue y la V se queda con lo suyo', () => {
  let M = tocar(ejercicio(), 'propio', 2)
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: [EPA, EPE] }))
  M = tocar(M, 'propio', 4)
  // FASE V: el EPA con otro trazado.
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: o.ejesLog.map((e) => (e.tipo === 'epa' ? { ...e, coords: [[-68.95, -18.05], [-68.6, -17.6], [-68.5, -17.2]] } : e)) }))
  M = tocar(M, 'propio', 3)
  const epa = (f) => f.ops.ejesLog.find((e) => e.tipo === 'epa').coords[1].join(',')
  assert.deepEqual(M.fases.propio.slice(2).map(epa), ['-68.8,-17.6', '-68.8,-17.6', '-68.6,-17.6'], 'la IV sigue con lo de la III; la V con lo suyo')
  // En la III se corrige el EPA otra vez: la IV lo sigue, la V no.
  M = tocar(M, 'propio', 2)
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: o.ejesLog.map((e) => (e.tipo === 'epa' ? { ...e, coords: [[-68.95, -18.05], [-68.75, -17.55], [-68.7, -17.4]] } : e)) }))
  M = tocar(M, 'propio', 0)
  assert.deepEqual(M.fases.propio.slice(2).map(epa), ['-68.75,-17.55', '-68.75,-17.55', '-68.6,-17.6'])
  // El EPE nunca se tocó después de la III: igual en las tres.
  assert.deepEqual(M.fases.propio.slice(2).map((f) => f.ops.ejesLog.find((e) => e.tipo === 'epe').coords), [EPE.coords, EPE.coords, EPE.coords])
  // Un EPE nuevo en la IV pasa a la V aunque la V tenga su propio EPA.
  M = tocar(M, 'propio', 3)
  const EPE2 = { coords: [[-68.6, -17.3], [-68.9, -18]], tipo: 'epe' }
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: [...o.ejesLog, EPE2] }))
  M = tocar(M, 'propio', 4)
  assert.deepEqual(M.fases.propio.map((f) => f.ops.ejesLog.length), [0, 0, 2, 3, 3])
})

caso('borrar un eje en la FASE IV lo saca también de la V (que lo heredaba) y no de la III', () => {
  let M = tocar(ejercicio(), 'propio', 2)
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: [EPA, EPE] }))
  M = tocar(M, 'propio', 3)
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: o.ejesLog.filter((e) => e.tipo !== 'epe') }))
  M = tocar(M, 'propio', 1)
  assert.deepEqual(M.fases.propio.map((f) => f.ops.ejesLog.map((e) => e.tipo).join('+')), ['', '', 'epa+epe', 'epa', 'epa'])
})

caso('G-1: la Línea de Extraviados y el PCE (fuera del ARCE) desde la FASE II hacia adelante; movidos en la IV, quedan en la IV y la V', () => {
  let M = tocar(ejercicio(), 'propio', 1)
  M = cambiarOps(M, (o) => ({ ...o, lineasEM: [EXTRAV] }))
  M = cambiarFichas(M, (us) => [...us, PCE])
  M = tocar(M, 'propio', 3)
  assert.deepEqual(M.fases.propio.map((f) => f.ops.lineasEM.length), [0, 1, 1, 1, 1])
  assert.deepEqual(M.fases.propio.map((f) => tiene(f, 'pce-1')), [false, true, true, true, true])
  // En la FASE IV la línea y el PCE se adelantan.
  M = cambiarOps(M, (o) => ({ ...o, lineasEM: o.lineasEM.map((l) => ({ ...l, coords: [[-69.2, -17.5], [-68.4, -17.5]] })) }))
  M = cambiarFichas(M, (us) => us.map((u) => (u.id === 'pce-1' ? { ...u, lat: -17.5 } : u)))
  M = tocar(M, 'propio', 0)
  assert.deepEqual(M.fases.propio.map((f) => f.ops.lineasEM.map((l) => l.coords[0][1])), [[], [-17.8], [-17.8], [-17.5], [-17.5]])
  assert.deepEqual(M.fases.propio.map((f) => ficha(f, 'pce-1')?.lat ?? null), [null, -17.8, -17.8, -17.5, -17.5])
})

caso('una instalación puesta DENTRO del ARCE en la FASE IV está en todas las fases (también las del enemigo)', () => {
  let M = tocar(ejercicio(), 'propio', 3)
  const DEP = { id: 'dep-1', tipo: 'instalacion', instalacion: 'p_dist', bando: 'propias', lng: -68.93, lat: -18.06 }
  M = cambiarFichas(M, (us) => [...us, DEP])
  M = tocar(M, 'propio', 0)
  for (const f of todas(M)) assert.ok(tiene(f, 'dep-1'), f.nombre)
  // Se la saca del área (a la FASE I): desde ahí es de las que se heredan; no se duplica.
  M = cambiarFichas(M, (us) => us.map((u) => (u.id === 'dep-1' ? { ...u, lat: -17.9 } : u)))
  M = tocar(M, 'propio', 2)
  assert.deepEqual(M.fases.propio.map((f) => f.unidades.filter((u) => u.id === 'dep-1').length), [1, 1, 1, 1, 1])
  assert.equal(ficha(M.fases.propio[0], 'dep-1').lat, -17.9)
})

caso('fases de antes: heredan de la anterior los ejes que les faltaban (una vez) y quedan marcadas', () => {
  const M0 = ejercicio()
  M0.fases.propio[2] = { ...M0.fases.propio[2], ops: { ...M0.fases.propio[2].ops, ejesLog: [EPA], lineasEM: [EXTRAV] } }
  let M = tocar(M0, 'propio', 4)
  assert.deepEqual(M.fases.propio.map((f) => f.ops.ejesLog.length), [0, 0, 1, 1, 1])
  assert.deepEqual(M.fases.propio.map((f) => f.ops.lineasEM.length), [0, 0, 1, 1, 1])
  // Ya marcadas: borrar el EPA en la V no lo hace volver desde la IV.
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: [] }))
  M = tocar(M, 'propio', 3)
  M = tocar(M, 'propio', 4)
  assert.deepEqual(M.Lt.ejesLog, [])
  assert.deepEqual(M.fases.propio.map((f) => f.ops.ejesLog.length), [0, 0, 1, 1, 0])
})

caso('CAP 2: al pasar al otro CAP el ARCE va con él; sus ejes son los suyos', () => {
  let M = tocar(ejercicio(), 'propio', 2)
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: [EPA] }))
  // El CAP 2 guardado: tres fases marcadas de una vez anterior, sin ARCE y con su propio EPE.
  const cap2 = [0, 1, 2].map((i) => ({ nombre: `CAP2 F${i + 1}`, logV: 1, unidades: [DIV(1, -68.3)], ops: { limites: [], zonasLog: [], ejesLog: [{ ...EPE, lid: 'l-epe-cap2' }], lineasEM: [], magnitudes: [] } }))
  const r = cambiarCAP(M, cap2)
  M = tocar(r.M, 'propio', 1)
  for (const f of M.fases.propio) {
    assert.deepEqual(zonas(f), ['arce-k1'], f.nombre)
    assert.ok(tiene(f, 'bl-1'))
    assert.deepEqual(f.ops.ejesLog.map((e) => e.tipo), ['epe'], `${f.nombre}: sus ejes`)
  }
  // El CAP 1 guardado quedó con su EPA en la III, IV y V.
  assert.deepEqual(r.otro.map((f) => f.ops.ejesLog.length), [0, 0, 1, 1, 1])
})

caso('siempre da lo mismo (fo se llama dos veces en Uo): mismo resultado con las mismas entradas', () => {
  let M = tocar(ejercicio(), 'propio', 2)
  M = cambiarOps(M, (o) => ({ ...o, ejesLog: [EPA, { ...EPA }] }))
  const a = alCargar(fo(M), M.fases, { activa: M.yt, unidades: M.dn, ops: M.Lt })
  const b = alCargar(fo(M), M.fases, { activa: M.yt, unidades: M.dn, ops: M.Lt })
  assert.deepEqual(a, b)
  assert.deepEqual(a.propio[3].ops.ejesLog.map((e) => e.lid).length, 2, 'dos trazos iguales: dos huellas distintas')
  assert.notEqual(a.propio[3].ops.ejesLog[0].lid, a.propio[3].ops.ejesLog[1].lid)
})

caso('sin fases o con datos raros no rompe', () => {
  assert.deepEqual(alGuardar({ enemigo: [], propio: [] }, { enemigo: [], propio: [] }, { activa: null, unidades: [], ops: {} }), { enemigo: [], propio: [] })
  assert.deepEqual(alCargar({ enemigo: [], propio: [] }, { enemigo: [], propio: [] }, {}), { enemigo: [], propio: [] })
  assert.equal(alGuardar(null, null, {}), null)
  const raro = { propio: [null, { ops: null, unidades: null }], enemigo: [] }
  assert.ok(alCargar(alGuardar(raro, raro, { activa: { bando: 'propio', idx: 1 }, unidades: [], ops: {} }), raro, {}))
  assert.deepEqual(globalesDe(undefined, undefined).fichas, [])
})

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
