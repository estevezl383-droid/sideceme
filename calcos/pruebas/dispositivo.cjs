// 🧭 El dispositivo de la carta para la IA (calcos/dispositivo/v1/dispositivo.js).
// El caso de Sergio: CE-I disgregado; en el calco la DIV-6 adelante al norte, la DIV-1 adelante al sur y la
// DIV MEC-2 atrás (reserva); el enemigo viene del oeste. La IA había hecho a la DIV MEC-2 esfuerzo
// principal en el sector norte y a la DIV-6 reserva.
//   node dispositivo.cjs
const assert = require('node:assert/strict')
const D = require('../dispositivo/v1/dispositivo.js')
let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }

const u = (id, designacion, arma, escalon, lat, lng, extra = {}) => ({ id, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat, lng, ...extra })
const base = () => ({
  unidades: [
    u('ce', 'CE-I', 'infanteria', 'cuerpo', -18.05, -68.6, { tipo: 'pc', disgregada: { puestas: [] } }),
    u('d6', 'DIV-6', 'infanteria', 'division', -17.85, -69.25, { dependeDe: 'ce' }),
    u('d1', 'DIV-1', 'infanteria', 'division', -18.3, -69.2, { dependeDe: 'ce' }),
    u('dm2', 'DIV MEC-2', 'mecanizada', 'division', -17.9, -68.95, { dependeDe: 'ce' }),
    u('galm', 'GALM-1', 'artilleria', 'batallon', -18.1, -68.9, { dependeDe: 'ce', relacion: 'en refuerzo' }),
    { id: 'r1', bando: 'enemigo', tipo: 'unidad', designacion: '1ª BR. AC.', arma: 'blindada', escalon: 'brigada', lat: -18.1, lng: -69.7 },
  ],
  ops: { unidadConsiderada: { nombre: 'CE-I' } },
})

caso('dos adelante (DIV-6 al norte, DIV-1 al sur) y la DIV MEC-2 atrás, con el enemigo al oeste', () => {
  const d = D.dispositivo(base())
  assert.equal(d.enemigoDel, 'OESTE')
  assert.match(d.de, /fichas enemigas/)
  assert.deepEqual(d.filas.map((x) => [x.unidad, x.posicion, x.sector]), [['DIV-6', 'adelante', 'NORTE'], ['DIV-1', 'adelante', 'SUR'], ['DIV MEC-2', 'atras', '']])
  assert.deepEqual(d.apoyo, ['GALM-1'])
})

caso('el texto para la IA dice la regla: la de atrás es la reserva, nunca el esfuerzo principal de adelante', () => {
  const t = D.texto(base())
  assert.match(t, /DIV-6: ADELANTE \(primer escalón\), sector NORTE/)
  assert.match(t, /DIV-1: ADELANTE \(primer escalón\), sector SUR/)
  assert.match(t, /DIV MEC-2: ATRÁS, a unos \d+ km/)
  assert.match(t, /\(DIV MEC-2\) es el segundo escalón \/ la RESERVA/)
  assert.match(t, /Apoyo de combate.*GALM-1/)
})

caso('la dirección elegida en la hoja P.D. manda (enemigo del norte: el sector es este / oeste)', () => {
  const ej = base()
  ej.unidades = ej.unidades.filter((x) => x.id !== 'r1')
  ej.picb = { pd: { dirEnemigo: 'N' } }
  ej.unidades.find((x) => x.id === 'd6').lat = -17.8
  ej.unidades.find((x) => x.id === 'd6').lng = -69.3
  ej.unidades.find((x) => x.id === 'd1').lat = -17.8
  ej.unidades.find((x) => x.id === 'd1').lng = -68.9
  ej.unidades.find((x) => x.id === 'dm2').lat = -18.2
  ej.unidades.find((x) => x.id === 'dm2').lng = -69.1
  const d = D.dispositivo(ej)
  assert.equal(d.enemigoDel, 'NORTE')
  assert.match(d.de, /hoja P\.D\./)
  assert.deepEqual(d.filas.map((x) => [x.unidad, x.posicion, x.sector]), [['DIV-6', 'adelante', 'OESTE'], ['DIV-1', 'adelante', 'ESTE'], ['DIV MEC-2', 'atras', '']])
})

caso('sin disgregar: las propias de maniobra del escalón más alto debajo de la unidad considerada; sin enemigo ni frente, nada', () => {
  const ej = base()
  ej.unidades = ej.unidades.map((x) => { const { dependeDe, disgregada, ...r } = x; return x.id === 'ce' ? { ...r, tipo: 'unidad' } : r })
  assert.deepEqual(D.dispositivo(ej).filas.map((x) => x.unidad), ['DIV-6', 'DIV-1', 'DIV MEC-2'])
  ej.unidades = ej.unidades.filter((x) => x.id !== 'r1')
  assert.equal(D.texto(ej), '')
})

caso('todas en línea: ninguna atrás', () => {
  const ej = base()
  ej.unidades.find((x) => x.id === 'dm2').lng = -69.22
  const d = D.dispositivo(ej)
  assert.ok(d.filas.every((x) => x.posicion === 'adelante'))
  assert.deepEqual(d.filas.map((x) => x.sector), ['NORTE', 'CENTRO', 'SUR'])
})

caso('el pedido de la IA del profesor (la OGO) lleva el dispositivo', () => {
  const IA = require('../modalidad/ia-profesor.js')
  const t = IA.contexto({ ejercicio: base() })
  assert.match(t, /EL DISPOSITIVO EN LA CARTA/)
  assert.match(t, /DIV MEC-2: ATRÁS/)
  assert.ok(t.indexOf('EL DISPOSITIVO') > t.indexOf('### Fichas en la carta'))
})

console.log(`dispositivo: ${n} casos ✔`)
