// ⬚ Seleccionar — la parte sin pantalla (calcos/seleccion/v1/modelo.mjs):
//   · qué figuras del calco se pueden seleccionar (y cuáles no: Área de Operaciones, capas apagadas,
//     lo que la carta no muestra en el puesto elegido);
//   · el recuadro toma lo que queda ENTERO adentro (las fichas, por su centro);
//   · el clic: ficha antes que figura, punto antes que línea, línea o borde antes que el relleno,
//     y de dos áreas la más chica;
//   · borrar varias cosas juntas deja el calco como el clic derecho de la Mesa, uno por uno (las
//     marcas de magnitud de los límites y de las áreas logísticas se van y se renumeran).
//   node calcos/pruebas/seleccion.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { CATEGORIAS, figuras, puntosDe, enElRecuadro, tocado, quitarDeOps, resumen, claveFigura, dentroPoligono, distTrazo } from '../seleccion/v1/modelo.mjs'

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

const cuadrado = (x, y, l) => [[x, y], [x + l, y], [x + l, y + l], [x, y + l]]
const ops = () => ({
  areaOps: { coords: cuadrado(0, 0, 10) },
  limites: [{ coords: [[0, 0], [5, 5]], escalon: 'brigada' }, { coords: [[1, 1], [2, 2]], escalon: 'division' }, { coords: [[3, 3], [4, 4]], escalon: 'cuerpo' }],
  magnitudes: [{ centro: [2.5, 2.5], origen: 'limite-0' }, { centro: [1.5, 1.5], origen: 'limite-1' }, { centro: [3.5, 3.5], origen: 'limite-2' }, { centro: [9, 9], origen: 'zona-asdi-1' }, { centro: [7, 7] }],
  zonasLog: [{ zona: 'asdi', clave: 'asdi-1', coords: cuadrado(6, 6, 3) }],
  sectoresLog: [{ coords: cuadrado(6.5, 6.5, 1) }],
  ejesLog: [{ tipo: 'epa', coords: [[0, 9], [9, 9]] }],
  tareas: [{ centro: [4, 1], tarea: 'atacar' }],
  posDef: [{ centro: [8, 1] }],
  objetivos: [],
  maniobra: [{ forma: 'envolvimiento', coords: [[1, 8], [2, 8]] }],
  ains: [{ centro: [5, 5] }],
})

console.log('⬚ Seleccionar — modelo')

caso('el Área de Operaciones y las A.I.N. no se seleccionan; lo demás sí', () => {
  const f = figuras(ops())
  assert.ok(!f.some((x) => x.cat === 'areaOps' || x.cat === 'ains'))
  assert.deepEqual([...new Set(f.map((x) => x.cat))].sort(), ['ejesLog', 'limites', 'magnitudes', 'maniobra', 'posDef', 'sectoresLog', 'tareas', 'zonasLog'])
  assert.ok(CATEGORIAS.every((c) => c.cat !== 'areaOps'))
})

caso('tipo de cada figura: punto, línea o área', () => {
  const f = figuras(ops())
  const de = (cat) => f.find((x) => x.cat === cat).tipo
  assert.equal(de('tareas'), 'punto')
  assert.equal(de('limites'), 'linea')
  assert.equal(de('zonasLog'), 'area')
  assert.equal(de('sectoresLog'), 'area')
  assert.equal(figuras({ limites: [{ coords: [[0, 0], [1, 0], [1, 1], [0, 0]] }] })[0].tipo, 'area', 'un límite que cierra es un área')
  assert.deepEqual(puntosDe({ centro: [1, 2] }), [[1, 2]])
  assert.deepEqual(puntosDe({ coords: [[[0, 0], [1, 1]]] }), [[0, 0], [1, 1]], 'coords anidadas')
})

caso('con una capa apagada en «👁 Qué se ve en el calco» no se selecciona lo de esa capa', () => {
  const f = figuras(ops(), { verCapa: { zonasLog: false, areaOps: false, 'maniobra:envolvimiento': false } })
  assert.deepEqual([...new Set(f.map((x) => x.cat))].sort(), ['posDef', 'tareas'])
})

caso('sólo lo que la carta muestra (el mismo objeto), con el índice del calco entero', () => {
  const o = ops()
  const vistas = { ...o, limites: [], zonasLog: o.zonasLog }
  const f = figuras(o, { opsVisibles: vistas })
  assert.ok(!f.some((x) => x.cat === 'limites'))
  assert.ok(f.some((x) => x.cat === 'zonasLog' && x.idx === 0 && x.item === o.zonasLog[0]))
  const copia = { ...o, zonasLog: [{ ...o.zonasLog[0] }] }
  assert.ok(!figuras(o, { opsVisibles: copia }).some((x) => x.cat === 'zonasLog'), 'otro objeto no cuenta')
  // El puesto filtra las líneas del EM: el índice es el del calco entero.
  const conLineas = { ...o, lineasEM: [{ tipo: 'g3', coords: [[0, 0], [1, 1]] }, { tipo: 'g4', coords: [[2, 2], [3, 3]] }] }
  const delPuesto = { ...conLineas, lineasEM: [conLineas.lineasEM[1]] }
  const l = figuras(conLineas, { opsVisibles: delPuesto }).filter((x) => x.cat === 'lineasEM')
  assert.deepEqual(l.map((x) => [x.idx, x.item.tipo]), [[1, 'g4']])
})

// En píxeles: una ficha, un punto, una línea y dos áreas (una adentro de la otra).
const px = {
  fichas: [{ id: 'u1', caja: { x: 100, y: 100, w: 40, h: 40 } }, { id: 'u2', caja: { x: 300, y: 300, w: 40, h: 40 } }],
  figurasPx: [
    { clave: 'tareas#0', tipo: 'punto', px: [[200, 50]] },
    { clave: 'limites#0', tipo: 'linea', px: [[0, 400], [400, 400]] },
    { clave: 'zonasLog#0', tipo: 'area', px: [[50, 50], [450, 50], [450, 350], [50, 350]] },
    { clave: 'sectoresLog#0', tipo: 'area', px: [[90, 90], [160, 90], [160, 160], [90, 160]] },
  ],
}

caso('el recuadro toma lo que queda entero adentro (las fichas por su centro)', () => {
  assert.deepEqual(enElRecuadro({ x1: 80, y1: 80, x2: 170, y2: 170 }, px), { fichas: ['u1'], figuras: ['sectoresLog#0'] })
  assert.deepEqual(enElRecuadro({ x1: 170, y1: 170, x2: 80, y2: 80 }, px), { fichas: ['u1'], figuras: ['sectoresLog#0'] }, 'en cualquier sentido')
  assert.deepEqual(enElRecuadro({ x1: 125, y1: 0, x2: 500, y2: 500 }, px).fichas, ['u2'], 'u1 tiene el centro en 120: afuera')
  const todo = enElRecuadro({ x1: -10, y1: -10, x2: 500, y2: 500 }, px)
  assert.deepEqual(todo.figuras.sort(), ['limites#0', 'sectoresLog#0', 'tareas#0', 'zonasLog#0'])
})

caso('el clic: ficha > punto > línea o borde > relleno del área más chica', () => {
  assert.deepEqual(tocado([120, 120], px), { ficha: 'u1' }, 'la ficha aunque esté sobre el sector')
  assert.deepEqual(tocado([205, 55], px), { figura: 'tareas#0' })
  assert.deepEqual(tocado([200, 404], px), { figura: 'limites#0' })
  assert.deepEqual(tocado([449, 200], px), { figura: 'zonasLog#0' }, 'el borde del área')
  assert.deepEqual(tocado([155, 150], px), { figura: 'sectoresLog#0' }, 'adentro de las dos: la más chica')
  assert.deepEqual(tocado([250, 200], px), { figura: 'zonasLog#0' }, 'adentro de la grande sola')
  assert.equal(tocado([600, 600], px), null, 'en el vacío, nada')
})

caso('geometría', () => {
  assert.ok(dentroPoligono([1, 1], [[0, 0], [2, 0], [2, 2], [0, 2]]))
  assert.ok(!dentroPoligono([3, 1], [[0, 0], [2, 0], [2, 2], [0, 2]]))
  assert.equal(distTrazo([1, 1], [[0, 0], [2, 0]]), 1)
  assert.equal(distTrazo([1, 3], [[0, 0], [2, 0], [2, 2], [0, 2]], true), 1, 'el tramo que cierra cuenta')
})

caso('borrar límites: se van sus marcas y las de los siguientes se renumeran (como el clic derecho)', () => {
  const o = ops()
  const n = quitarDeOps(o, [{ cat: 'limites', idx: 0 }, { cat: 'limites', idx: 1 }])
  assert.deepEqual(n.limites, [o.limites[2]])
  assert.deepEqual(n.magnitudes.map((m) => m.origen), ['limite-0', 'zona-asdi-1', undefined])
  assert.deepEqual(n.magnitudes[0].centro, [3.5, 3.5], 'la del tercer límite pasa a ser limite-0')
  // Igual que borrar de a uno con la lógica de la Mesa (el más alto primero no cambia el resultado).
  const deAUno = quitarDeOps(quitarDeOps(o, [{ cat: 'limites', idx: 1 }]), [{ cat: 'limites', idx: 0 }])
  assert.deepEqual(deAUno, n)
  assert.equal(o.limites.length, 3, 'no toca el calco que llega')
})

caso('igual que el borrado del compilado (SIDMagSinLimite y SIDMagSinZona de GN, textuales)', () => {
  const { vigente, cargar } = createRequire(import.meta.url)('./extraer.js')
  const { SIDMagSinLimite, SIDMagSinZona } = cargar(vigente(), ['SIDMagSinLimite', 'SIDMagSinZona'])
  const o = ops()
  // GN: un límite por vez, filtrando por índice y quitando su marca.
  let g = o
  for (const i of [1, 0]) g = { ...g, limites: g.limites.filter((_, j) => j !== i), magnitudes: SIDMagSinLimite(g.magnitudes, i) }
  g = { ...g, magnitudes: SIDMagSinZona(g.magnitudes, g.zonasLog[0]), zonasLog: [] }
  const n = quitarDeOps(o, [{ cat: 'limites', idx: 0 }, { cat: 'limites', idx: 1 }, { cat: 'zonasLog', idx: 0 }])
  assert.deepEqual(JSON.parse(JSON.stringify(n.magnitudes)), JSON.parse(JSON.stringify(g.magnitudes)))
  assert.deepEqual(n.limites, g.limites)
})

caso('borrar un área logística se lleva las marcas de su borde; una marca suelta se borra sola', () => {
  const o = ops()
  const n = quitarDeOps(o, [{ cat: 'zonasLog', idx: 0 }, { cat: 'magnitudes', idx: 4 }, { cat: 'sectoresLog', idx: 0 }])
  assert.deepEqual(n.zonasLog, [])
  assert.deepEqual(n.sectoresLog, [])
  assert.deepEqual(n.magnitudes.map((m) => m.origen), ['limite-0', 'limite-1', 'limite-2'])
  assert.equal(n.areaOps, o.areaOps, 'lo demás, el mismo objeto')
  assert.equal(n.limites, o.limites)
})

caso('nada que borrar = el mismo calco; categorías desconocidas se ignoran', () => {
  const o = ops()
  assert.equal(quitarDeOps(o, []), o)
  assert.equal(quitarDeOps(o, [{ cat: 'areaOps', idx: 0 }, { cat: 'ains', idx: 0 }]), o)
})

caso('resumen y claves', () => {
  assert.equal(resumen(1, []), '1 ficha')
  assert.equal(resumen(30, [{}, {}]), '30 fichas y 2 figuras')
  assert.equal(resumen(0, [{}]), '1 figura')
  assert.equal(resumen(0, []), 'nada')
  assert.equal(claveFigura({ cat: 'limites', idx: 3 }), 'limites#3')
})

if (fallas) {
  console.log(`\n${fallas} caso(s) fallan.`)
  process.exitCode = 1
} else console.log('\nTodos los casos pasan.')
