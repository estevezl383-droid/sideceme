// La edición de figuras de la Mesa (líneas y áreas, como en Google Earth), probada sobre las
// funciones TEXTUALES del compilado vigente:
//   · SIDEditaVertices: mover, agregar y borrar un vértice de cualquier figura (límites, áreas
//     y sectores logísticos, ejes, líneas del EM, obstáculos, Área de Operaciones, Área de
//     Influencia). Si no se puede (una línea con 2 puntos, un área con 3, una flecha) devuelve
//     las MISMAS ops y no cambia nada.
//   · el Área de Operaciones: el frente es siempre el principio de la lista de vértices; al
//     agregar o borrar uno del frente el frente crece o achica, y el ancho, el fondo y el azimut se
//     recalculan solos.
//   · «Magnitud que se va a colocar»: con un Área de Operaciones sólo el escalón que le toca.
//   · los paneles ya no traen las tres explicaciones que tapaban las herramientas.
//
//   node edicion-figuras.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { vigente, cargar } = require('./extraer')
const { ejercicioFicticio } = require('./ejercicio-ficticio')

let fallos = 0
const caso = (nombre, f) => {
  try {
    f()
    console.log(`✓ ${nombre}`)
  } catch (e) {
    fallos++
    console.error(`✗ ${nombre}\n  ${e.message}`)
  }
}

const NOMBRES = [
  'SIDEditaVertices', 'SIDAjustaAO', 'SIDMinimo', 'SIDMagSinLimite', 'SIDMagSinZona', 'SIDEscalonesAO', 'SIDOpEsc', 'SIDCLAVES',
  'Nm', 'zK', 'fF', 'pF', 'w5', 'QI', 'JI', 'LK', 'jK', 'dF', 'ah', 'hF', '_5', 'Uye', 'bb', 'oF', 'lF', 'uF', 'cF',
]
// SIDdT y SIDkm: el cuadro de frentes y profundidades del PMTD 2017 (reemplazos-2026-10-09-frentes).
const C = cargar(vigente(), NOMBRES.concat(['sF', 'PK', 'SIDdT', 'SIDkm']), { Rt: {} })
// Lo que sale del compilado se crea en otro «reino» de Node: se compara como JSON.
const J = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)))
const { SIDEditaVertices: ed, SIDMagSinLimite: sinLimite, SIDMagSinZona: sinZona, SIDEscalonesAO: escalones, SIDOpEsc: opEsc } = C

const o0 = () => ({
  limites: [{ tipo: 'simple', coords: [[0, 0], [1, 0], [2, 0]] }, { tipo: 'magnitud', coords: [[5, 5], [6, 6]], escalon: 'division' }],
  zonasLog: [{ zona: 'asdi', coords: [[0, 0], [1, 0], [1, 1], [0, 1]] }],
  sectoresLog: [], ejesLog: [{ tipo: 'epa', coords: [[0, 0], [1, 1]] }], lineasEM: [{ tipo: 'extraviados', coords: [[0, 0], [1, 1], [2, 2]] }],
  flechasZona: [{ tipo: 'zc', coords: [[0, 0], [1, 1]] }],
  obstaculos: [{ tipo: 'alambre_simple', coords: [[0, 0], [1, 1]] }, { tipo: 'minado_ap', coords: [[0, 0], [1, 0], [1, 1]] }],
  magnitudes: [{ origen: 'limite-0' }, { origen: 'limite-1' }, { centro: [0, 0] }],
  areaOps: null, influenciaTrazada: null,
})

caso('mover: cambia sólo ese vértice de esa figura', () => {
  const o = o0()
  const n = ed(o, 'limite', 0, { t: 'mover', i: 1, p: [1, 9] })
  assert.deepEqual(n.limites[0].coords, [[0, 0], [1, 9], [2, 0]])
  assert.equal(n.limites[1], o.limites[1], 'la otra figura es la misma')
  assert.deepEqual(o.limites[0].coords, [[0, 0], [1, 0], [2, 0]], 'no muta las ops de antes')
})

caso('agregar: el punto va DESPUÉS del vértice i; en un área, el último tramo cierra al primero', () => {
  const o = o0()
  assert.deepEqual(ed(o, 'limite', 0, { t: 'agregar', i: 0, p: [0.5, 0] }).limites[0].coords, [[0, 0], [0.5, 0], [1, 0], [2, 0]])
  assert.deepEqual(ed(o, 'limite', 0, { t: 'agregar', i: 2, p: [3, 0] }).limites[0].coords.at(-1), [3, 0])
  assert.deepEqual(ed(o, 'zonaLog', 0, { t: 'agregar', i: 3, p: [0, 0.5] }).zonasLog[0].coords.at(-1), [0, 0.5], 'tramo de cierre')
})

caso('borrar: una línea necesita 2 puntos y un área 3 (si no, devuelve las mismas ops)', () => {
  const o = o0()
  assert.equal(ed(o, 'limite', 0, { t: 'borrar', i: 1 }).limites[0].coords.length, 2)
  assert.equal(ed(o, 'limite', 1, { t: 'borrar', i: 0 }), o, 'línea de 2 puntos')
  assert.equal(ed(o, 'lineaEM', 0, { t: 'borrar', i: 0 }).lineasEM[0].coords.length, 2)
  assert.equal(ed(o, 'ejeLog', 0, { t: 'borrar', i: 0 }), o, 'eje de 2 puntos')
  assert.equal(ed(o, 'zonaLog', 0, { t: 'borrar', i: 0 }).zonasLog[0].coords.length, 3)
  const t3 = ed(o, 'zonaLog', 0, { t: 'borrar', i: 0 })
  assert.equal(ed(t3, 'zonaLog', 0, { t: 'borrar', i: 0 }), t3, 'área de 3 puntos')
})

caso('obstáculos: la forma (línea o área) decide el mínimo', () => {
  assert.equal(C.Nm.alambre_simple.forma, 'linea')
  assert.equal(C.Nm.minado_ap.forma, 'area')
  const o = o0()
  assert.equal(ed(o, 'obstaculo', 0, { t: 'borrar', i: 0 }), o, 'alambrada de 2 puntos')
  assert.equal(ed(o, 'obstaculo', 1, { t: 'borrar', i: 0 }), o, 'campo minado de 3 puntos')
  assert.equal(ed(o, 'obstaculo', 1, { t: 'agregar', i: 2, p: [0, 1] }).obstaculos[1].coords.length, 4)
})

caso('flecha de zona: se mueve pero no se le agregan ni quitan puntos', () => {
  const o = o0()
  assert.deepEqual(ed(o, 'flechaZona', 0, { t: 'mover', i: 1, p: [3, 3] }).flechasZona[0].coords[1], [3, 3])
  assert.equal(ed(o, 'flechaZona', 0, { t: 'agregar', i: 0, p: [0.5, 0.5] }), o)
  assert.equal(ed(o, 'flechaZona', 0, { t: 'borrar', i: 0 }), o)
})

caso('índices y figuras que no existen no rompen nada', () => {
  const o = o0()
  for (const a of [{ t: 'mover', i: 9, p: [0, 0] }, { t: 'mover', i: -1, p: [0, 0] }, { t: 'borrar', i: 9 }, { t: 'agregar', i: 9, p: [0, 0] }, { t: 'otra' }]) assert.equal(ed(o, 'limite', 0, a), o)
  assert.equal(ed(o, 'limite', 7, { t: 'borrar', i: 0 }), o)
  assert.equal(ed(o, 'areaOps', 0, { t: 'borrar', i: 0 }), o, 'sin Área de Operaciones')
  assert.equal(ed(o, 'noExiste', 0, { t: 'borrar', i: 0 }), o)
})

// El Área de Operaciones del ejercicio ficticio: 4 vértices, frente = los 2 primeros.
const ao = () => JSON.parse(JSON.stringify(ejercicioFicticio({ conPlantilla: false }).ops.areaOps))

caso('Área de Operaciones: mover un vértice recalcula la profundidad y deja el frente', () => {
  const o = { ...o0(), areaOps: ao() }
  const n = ed(o, 'areaOps', 0, { t: 'mover', i: 3, p: [-65.1, -17.07] }).areaOps
  assert.equal(n.frente.length, 2)
  assert.deepEqual(n.frente, n.coords.slice(0, 2))
  assert.ok(n.profM > o.areaOps.profM + 1000, `profundidad ${n.profM} (antes ${o.areaOps.profM})`)
  assert.ok(Math.abs(n.frenteM - C.fF(o.areaOps.frente)) < 1, 'el frente no cambió: ' + n.frenteM)
  assert.equal(n.tipo, 'defensiva')
})

caso('Área de Operaciones: agregar entre dos vértices del FRENTE lo hace crecer; en el contorno, no', () => {
  const o = { ...o0(), areaOps: ao() }
  const a = ed(o, 'areaOps', 0, { t: 'agregar', i: 0, p: [-65.05, -16.975] }).areaOps
  assert.equal(a.coords.length, 5)
  assert.equal(a.frente.length, 3, 'entre A0 y A1: es del frente')
  const b = ed(o, 'areaOps', 0, { t: 'agregar', i: 1, p: [-64.99, -17.015] }).areaOps
  assert.equal(b.frente.length, 2, 'entre A1 y A2: es del contorno')
  const c = ed(o, 'areaOps', 0, { t: 'agregar', i: 3, p: [-65.05, -17.06] }).areaOps
  assert.equal(c.coords.length, 5)
  assert.equal(c.frente.length, 2, 'el tramo de cierre es del contorno')
})

caso('Área de Operaciones: borrar un vértice del contorno deja el frente; no baja de 3 vértices', () => {
  const o = { ...o0(), areaOps: ao() }
  const a = ed(o, 'areaOps', 0, { t: 'borrar', i: 3 }).areaOps
  assert.equal(a.coords.length, 3)
  assert.equal(a.frente.length, 2)
  assert.equal(ed({ ...o, areaOps: a }, 'areaOps', 0, { t: 'borrar', i: 2 }).areaOps, a, 'un triángulo no pierde otro vértice')
})

caso('Área de Operaciones: borrar un vértice del frente achica el frente (siempre quedan 2)', () => {
  const o = { ...o0(), areaOps: ao() }
  const a = ed(o, 'areaOps', 0, { t: 'agregar', i: 0, p: [-65.05, -16.975] }).areaOps // frente de 3
  const b = ed({ ...o, areaOps: a }, 'areaOps', 0, { t: 'borrar', i: 1 }).areaOps
  assert.equal(b.frente.length, 2)
  assert.deepEqual(b.frente, b.coords.slice(0, 2))
  const c = ed(o, 'areaOps', 0, { t: 'borrar', i: 0 }).areaOps // frente de 2 → queda con 2 (el primero del contorno)
  assert.equal(c.coords.length, 3)
  assert.equal(c.frente.length, 2)
})

caso('Área de Operaciones sin frente guardado (de versiones viejas): se mide sola', () => {
  const v = { coords: ao().coords, frente: null, tipo: 'defensiva', modalidad: 'tenaz', ambiente: 'llano', frenteM: 0, profM: 0, azimut: null }
  const n = ed({ ...o0(), areaOps: v }, 'areaOps', 0, { t: 'mover', i: 2, p: [-64.95, -17.05] }).areaOps
  assert.ok(n.frenteM > 0 && n.profM > 0, JSON.stringify([n.frenteM, n.profM]))
})

caso('Área de Influencia trazada: se edita como las demás áreas (mínimo 3)', () => {
  const o = { ...o0(), influenciaTrazada: { coords: [[0, 0], [1, 0], [1, 1], [0, 1]] } }
  const a = ed(o, 'influenciaTrazada', 0, { t: 'borrar', i: 2 }).influenciaTrazada
  assert.equal(a.coords.length, 3)
  assert.equal(ed({ ...o, influenciaTrazada: a }, 'influenciaTrazada', 0, { t: 'borrar', i: 0 }).influenciaTrazada, a)
  assert.equal(ed(o, 'influenciaTrazada', 0, { t: 'agregar', i: 3, p: [0, 0.5] }).influenciaTrazada.coords.length, 5)
  assert.equal(ed(o, 'influenciaTrazada', 0, { t: 'mover', i: 0, p: [-1, -1] }).influenciaTrazada.coords[0][0], -1)
})

caso('borrar un límite con magnitud: se va su marca y las demás se renumeran', () => {
  const m = sinLimite([{ origen: 'limite-0' }, { origen: 'limite-1' }, { origen: 'limite-2' }, { centro: [0, 0] }], 1)
  assert.deepEqual(J(m.map((x) => x.origen)), ['limite-0', 'limite-1', null])
  assert.deepEqual(J(sinLimite(undefined, 0)), [])
})

caso('borrar un área logística: se van las marcas que armó con ella', () => {
  const m = [{ origen: 'zona-asdi-1' }, { origen: 'zona-asdi-2' }, { origen: 'limite-0' }, { centro: [0, 0] }]
  assert.deepEqual(J(sinZona(m, { clave: 'asdi-1' })).map((x) => x.origen || null), ['zona-asdi-2', 'limite-0', null])
  assert.equal(sinZona(m, undefined), m)
  assert.equal(sinZona(m, {}), m)
})

caso('«Magnitud que se va a colocar»: con un Área de Operaciones sólo el escalón que le toca', () => {
  const lista = [{ id: 'equipo' }, { id: 'compania' }, { id: 'regimiento' }, { id: 'brigada' }, { id: 'division' }, { id: 'cuerpo' }, { id: 'ejercito' }]
  const cuerpo = ao() // 10,6 km de frente en defensiva, llanura → Cuerpo de Ejército
  assert.deepEqual(J(escalones(cuerpo)), ['cuerpo'])
  assert.deepEqual(J(opEsc(lista, cuerpo)).map((x) => x.id), ['cuerpo'])
  assert.deepEqual(J(escalones({ ...cuerpo, frenteM: 7000 })), ['division'])
  assert.deepEqual(J(escalones({ ...cuerpo, frenteM: 2000 })), ['regimiento'])
  assert.deepEqual(J(escalones({ ...cuerpo, tipo: 'ofensiva', frenteM: 2000 })), ['brigada'])
  assert.deepEqual(J(escalones({ ...cuerpo, frenteM: 40000 })), ['cuerpo'], 'más grande que un Cuerpo: no ofrece un Ejército')
  assert.deepEqual(J(escalones({ ...cuerpo, frenteM: 100 })), ['compania'], 'más chico que una Compañía: no ofrece un Equipo')
  assert.equal(escalones(null), null)
  assert.equal(escalones({ coords: [[0, 0], [1, 1]] }), null)
  assert.equal(opEsc(lista, null), lista, 'sin Área de Operaciones: libre')
})

caso('el compilado ya no trae las explicaciones del panel del Área de Operaciones', () => {
  const src = fs.readFileSync(vigente(), 'utf8')
  for (const viejo of ['Textual del reglamento:', 'Cómo se traza, en dos tiempos:', 'Es el sector que viene en la Orden del escalón superior', 'Falta el enemigo. Poné las fichas ROJAS']) {
    assert.ok(!src.includes(viejo), `todavía trae «${viejo}»`)
  }
})

caso('el clic derecho ya no abre un window.confirm ni borra todo el frente', () => {
  const src = fs.readFileSync(vigente(), 'utf8')
  assert.ok(!src.includes('window.confirm(`¿Borrar ${i}?`)'), 'yo() todavía pregunta con confirm')
  assert.ok(!src.includes('Ie&&lt.current.length?ge(lt.current.slice(0,-1)):(Te(null),ge([]),Ae([])));return}Dt&&Se.length'), 'el contextmenu del frente sigue borrando todo')
})

if (fallos) {
  console.error(`\n${fallos} caso(s) fallan.`)
  process.exit(1)
}
console.log('\nTodos los casos pasan.')
