// ◎ Acostar las A.I.N. de la H.T. 20 aunque su nombre no cite el CMOC (calcos/ains-acostar/v1/ains.mjs).
// El caso de Sergio: la IA le hizo la H.T. 20 con «AIN-2», «AIN-3»… y el lugar sólo en el indicador;
// apretó «◎ Acostar las A.I.N.» y la Mesa no puso ninguna sobre la carta.
//   node ains-acostar.mjs
import assert from 'node:assert/strict'
import { acostarRestantes, avisoAins, lugaresNombrados, agruparLugares, puntoEnLinea } from '../ains-acostar/v1/ains.mjs'

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }

// Las filas tal como las pegó Sergio (nom, indicador y los dos CAE).
const hoja = [
  { nom: 'AIN-2', noAntes: 'D-30 (0000)', noDespues: 'D-3 (0600)', indicador: 'Movimiento de columnas blindadas y convoyes logísticos de la 1ª Br. Ac. sobre la ruta Putre – Guallatire; intensificación de exploración con UAV/F-16 en AIN-2.', probable: 'Apresto e inicio de despliegue de la 1ª Brigada Acorazada «CORACEROS» para la penetración por el valle del río Lauca hacia Turco y Huachacalla.', peligroso: 'Preposicionamiento de la 1ª Br. Ac. reforzada para iniciar ataque con viraje de flanqueo al norte por el río Sajama hacia Tambo Quemado/Patacamaya.' },
  { nom: 'AIN-3', indicador: 'Despliegue del Pelotón de Reconocimiento Blindado (M113) en vados de Ungallire – Guata y trabajos de preparación de franqueo por la Cía. Ing. Mec. N° 9 (puentes AVLB Biber).', probable: 'Aproximación e irrupción de la vanguardia del BIB N° 27 «BULNES» sobre el paso del río Lauca para abrir la brecha a la masa blindada.', peligroso: 'Reconocimiento intensivo de vados alternativos sobre el río Sajama para facilitar el viraje táctico hacia el norte.' },
  { nom: 'AIN-5', indicador: 'Infiltración de patrullas de FF.EE./Comandos (Cía. Cdos. N° 6) y movimiento de elementos mecanizados de flanqueo al sur del Volcán Puquintica (eje Julo – Bella Vista).', probable: 'Ataque secundario de fijación/amarrado para aislar el flanco izquierdo del CE-I.', peligroso: 'Envolvimiento profundo del flanco sur del CE-I para cortar el ESA en Bella Vista y amenazar la retaguardia en Turco.' },
  { nom: 'AIN-1', indicador: 'Fuegos de saturación sobre posiciones de la DIV MEC-1 en Tambo Quemado y avance coordinado de las Brigadas Motorizadas N° 4 y N° 24.', probable: 'Operación de fijación/amarrado en Tambo Quemado – Chungará.', peligroso: 'Esfuerzo principal enemigo lanzado sobre el eje Tambo Quemado – Curahuara de Carangas – Patacamaya.' },
]
const avenidas = [
  { coords: [[-69.2, -18.6], [-68.6, -18.7], [-68.2, -18.75]] },
  { coords: [[-69.2, -18.9], [-68.6, -18.95], [-68.2, -19.0]] },
]
const cmoc = { avenidas, clave: [{ etiqueta: 'C1', centro: [-68.5, -18.8] }] }
const areaOps = { coords: [[-69, -18.5], [-68, -18.5], [-68, -19.2], [-69, -19.2], [-69, -18.5]] }

caso('sin ningún lugar de la carta: las cuatro quedan sobre la carta, repartidas sobre las avenidas', () => {
  const { puestas, sinUbicar } = acostarRestantes(hoja, { cmoc, areaOps, ains: [], lugares: [] })
  assert.equal(sinUbicar.length, 0)
  assert.equal(puestas.length, 4)
  assert.deepEqual(puestas.map((p) => p.nom), ['AIN-2', 'AIN-3', 'AIN-5', 'AIN-1'])
  assert.deepEqual(puestas.map((p) => p.n), [2, 3, 5, 1])
  for (const p of puestas) {
    assert.equal(p.forma, 'punto'); assert.equal(p.deLaHoja, true); assert.equal(p.ubicadaPor, 'repartida')
    assert.ok(p.centro[0] > -69.3 && p.centro[0] < -68.1 && p.centro[1] < -18.5 && p.centro[1] > -19.1, JSON.stringify(p.centro))
  }
  assert.equal(new Set(puestas.map((p) => p.centro.join())).size, 4, 'cada una en su lugar')
  assert.equal(puestas[0].indicador, hoja[0].indicador)
  assert.match(avisoAins(puestas, 0), /4 A\.I\.N\. sobre la carta.*4 repartida/)
})

const lugares = [
  { nom: 'Putre', clase: 'poblado', c: [-69.56, -18.19] },
  { nom: 'Guallatire', clase: 'poblado', c: [-69.15, -18.49] },
  { nom: 'Tambo Quemado', clase: 'poblado', c: [-69.03, -18.29] },
  { nom: 'Turco', clase: 'poblado', c: [-68.18, -18.86] },
  { nom: 'Río Lauca', clase: 'río', c: [-69.0, -18.6] }, { nom: 'Río Lauca', clase: 'río', c: [-68.7, -18.8] },
  { nom: 'Julo', clase: 'poblado', c: [-68.9, -19.1] }, { nom: 'Bella Vista', clase: 'poblado', c: [-68.95, -19.15] },
  { nom: 'Santa', clase: 'poblado', c: [0, 0] },
]

caso('con los calcos del terreno: cada una va al lugar que nombra el indicador', () => {
  const { puestas } = acostarRestantes(hoja, { cmoc, areaOps, ains: [], lugares })
  const por = Object.fromEntries(puestas.map((p) => [p.nom, p]))
  // «ruta Putre – Guallatire» → entre los dos.
  assert.equal(por['AIN-2'].ubicadaPor, 'lugar')
  assert.match(por['AIN-2'].porQue, /entre Putre y Guallatire/)
  assert.ok(Math.abs(por['AIN-2'].centro[0] - (-69.355)) < 0.01)
  // El indicador de AIN-3 no nombra nada de la carta: sigue con el CAE más probable (río Lauca).
  assert.match(por['AIN-3'].porQue, /Río Lauca.*CAE más probable/)
  assert.match(por['AIN-5'].porQue, /entre Julo y Bella Vista/)
  assert.match(por['AIN-1'].porQue, /en Tambo Quemado/)
  assert.match(avisoAins(puestas, 0), /4 en el lugar que nombra la hoja/)
})

caso('lugaresNombrados: palabra entera, sin acentos, sin contar «Lauca» dos veces', () => {
  const g = agruparLugares([{ nom: 'Río Lauca', c: [0, 0] }, { nom: 'Lauca', c: [1, 1] }, { nom: 'Turco', c: [2, 2] }])
  assert.deepEqual(lugaresNombrados('por el valle del rio LAUCA hacia Turco', g).map((x) => x.nom), ['Río Lauca', 'Turco'])
  assert.deepEqual(lugaresNombrados('Turcomano', g), [])
})

caso('«AA-2» en el texto la pone sobre esa avenida; no repite el lugar de una A.I.N. que ya está', () => {
  const { puestas } = acostarRestantes([{ nom: 'AIN-7', indicador: 'Columnas sobre la AA-2' }], { cmoc, areaOps, ains: [{ nom: 'AIN-6', centro: puntoEnLinea(avenidas[1].coords, 0.5) }] })
  assert.equal(puestas[0].ubicadaPor, 'avenida')
  assert.match(puestas[0].porQue, /AA-2/)
  assert.ok(Math.abs(puestas[0].centro[1] - -18.95) < 0.05)
  assert.notDeepEqual(puestas[0].centro, puntoEnLinea(avenidas[1].coords, 0.5))
})

caso('sin avenidas ni terreno clave: al centro del Área de Operaciones; sin nada, queda para ubicar a mano', () => {
  const a = acostarRestantes([{ nom: 'AIN-1' }], { cmoc: {}, areaOps })
  assert.equal(a.puestas.length, 1); assert.ok(Math.abs(a.puestas[0].centro[0] - -68.6) < 0.05)
  const b = acostarRestantes([{ nom: 'AIN-1' }], { cmoc: {}, areaOps: null })
  assert.equal(b.puestas.length, 0); assert.equal(b.sinUbicar.length, 1)
})

console.log(`\n${n} casos: las A.I.N. de la H.T. 20 quedan sobre la carta.`)
