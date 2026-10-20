// 🧭 De dónde viene el enemigo y ✋ mover la plantilla (calcos/plantilla-ajuste/v1/ajuste.mjs). El caso de Sergio: el A.O. se empezó a trazar por el lado NORTE (el
// primer lado es el frente), la L.P.R. y el enemigo están al OESTE y las avenidas cruzan el A.O. de
// oeste a este (alguna trazada al revés, de este a oeste).
//   node plantilla-ajuste.mjs
import assert from 'node:assert/strict'
import { frenteHacia, orientarAvenidas, entradaPlantilla, marcarDireccion, moverPlantilla, girarPlantilla, arrastrarPlantilla, moverFicha } from '../plantilla-ajuste/v1/ajuste.mjs'

let n = 0
const caso = (nombre, fn) => { fn(); n++; console.log('  ✔ ' + nombre) }

// A.O. de ~30 × 24 km en el altiplano, trazado desde la esquina NO hacia el ESTE (frente = lado norte).
const NO = [-68.30, -19.30], NE = [-68.02, -19.30], SE = [-68.02, -19.52], SO = [-68.30, -19.52]
const areaOps = { coords: [NO, NE, SE, SO], frente: [NO, NE] }
const oeste = Math.max(NO[0], SO[0])
// Tres avenidas de oeste a este que atraviesan todo el A.O.; la del medio trazada al revés.
const av = (lat, alReves = false) => {
  const c = []
  for (let lng = -68.55; lng <= -67.80; lng += 0.05) c.push([+lng.toFixed(3), lat])
  return { coords: alReves ? c.reverse() : c, escalon: 'batallon', bando: 'enemigo' }
}
const avenidas = [av(-19.36), av(-19.41, true), av(-19.46)]

caso('frenteHacia: con el enemigo al OESTE el frente es el lado oeste del A.O.', () => {
  const f = frenteHacia(areaOps.coords, 'O')
  assert.equal(f.length, 2)
  assert.deepEqual(new Set(f.map(String)), new Set([String(SO), String(NO)]))
  assert.deepEqual(new Set(frenteHacia(areaOps.coords, 'N').map(String)), new Set([String(NO), String(NE)]))
  assert.deepEqual(new Set(frenteHacia([...areaOps.coords].reverse(), 'E').map(String)), new Set([String(NE), String(SE)]), 'sirve en los dos sentidos de trazado')
  assert.equal(frenteHacia(areaOps.coords, 'auto'), null)
})

caso('frenteHacia: con el enemigo al NOROESTE toma los dos lados que miran hacia allá', () => {
  const f = frenteHacia(areaOps.coords, 'NO')
  assert.equal(f.length, 3)
  assert.equal(String(f[1]), String(NO))
})

caso('orientarAvenidas: cada avenida arranca en su punta del lado del enemigo', () => {
  const o = orientarAvenidas(avenidas, 'O')
  for (const a of o) assert.ok(a.coords[0][0] < a.coords[a.coords.length - 1][0])
  assert.equal(orientarAvenidas(avenidas, 'auto'), avenidas)
})

caso('entradaPlantilla: «Automático» deja el frente guardado y las avenidas como estaban', () => {
  const e = entradaPlantilla(areaOps, {}, avenidas)
  assert.equal(e.aoFrente, areaOps.frente)
  assert.equal(e.avenidas, avenidas)
})

// Una plantilla acostada contra el lado oeste, como la arma s9 (la s9 real se prueba en la Mesa:
// e2e/plantilla-ajuste.cjs): L.P.R. sobre el lado oeste, fichas y bandas afuera, arco de la artillería.
const lprO = frenteHacia(areaOps.coords, 'O')
const pO = marcarDireccion({
  ok: true,
  avisos: ['⚠️ ESTA ÁREA DE OPERACIONES NO TIENE FRENTE GUARDADO (…)', 'otro aviso'],
  lineas: [{ id: 'lpr', tipo: 'lpr', coords: lprO, fuente: 'Es EL FRENTE que trazaste…' }, { id: 'zona', tipo: 'zona', coords: [[-68.5, -19.3], [-68.4, -19.3], [-68.4, -19.5]] }],
  bandas: [{ id: 'e1', coords: [[-68.31, -19.32], [-68.38, -19.32], [-68.38, -19.48], [-68.31, -19.48], [-68.31, -19.32]] }],
  marcas: [
    { id: 'carampague', rol: 'e1', centro: [-68.34, -19.36], rot: 90, kmReal: 4 },
    { id: 'vencedores', rol: 'e2', centro: [-68.40, -19.41], rot: 90, kmReal: 9 },
    { id: 'salvo', rol: 'artilleria', centro: [-68.42, -19.46], rot: 90, kmReal: 12 },
  ],
  conos: [{ id: 'arco_salvo', de: 'salvo', centro: [-68.42, -19.46], coords: [[-68.42, -19.46], [-68.2, -19.4], [-68.2, -19.5], [-68.42, -19.46]] }],
}, { dirEnemigo: 'O' })
const lpr = (p) => p.lineas.find((l) => l.tipo === 'lpr')

caso('marcarDireccion: la L.P.R. y los avisos dicen de dónde se tomó el frente', () => {
  assert.match(lpr(pO).fuente, /MIRA AL OESTE/)
  assert.match(pO.avisos[0], /El enemigo viene del OESTE/)
  assert.ok(!pO.avisos.some((a) => /NO TIENE FRENTE GUARDADO/.test(a)))
  assert.equal(pO.dirEnemigo, 'O')
  const auto = { ok: true, lineas: [], avisos: [] }
  assert.equal(marcarDireccion(auto, {}), auto, 'en automático no toca nada')
})

caso('moverPlantilla: corre todo menos la L.P.R. (nuestra)', () => {
  const m = moverPlantilla(pO, 0, 2)
  const d = m.marcas[0].centro[1] - pO.marcas[0].centro[1]
  assert.ok(Math.abs(d * 110.574 - 2) < 1e-6)
  assert.deepEqual(lpr(m).coords, lpr(pO).coords)
  assert.ok(Math.abs((m.bandas[0].coords[0][1] - pO.bandas[0].coords[0][1]) * 110.574 - 2) < 1e-6)
  assert.deepEqual(m.SIDajustada, { movidaKm: 2, giro: 0, fichas: 0 })
  assert.notEqual(m, pO)
  assert.equal(pO.SIDajustada, undefined, 'no toca la original')
})

caso('arrastrarPlantilla: lo que se arrastró una ficha lo corre todo', () => {
  const a = pO.marcas[2].centro, b = [a[0] - 0.01, a[1] + 0.02]
  const m = arrastrarPlantilla(pO, a, b)
  for (let i = 0; i < pO.marcas.length; i++) {
    assert.ok(Math.abs(m.marcas[i].centro[0] - pO.marcas[i].centro[0] + 0.01) < 1e-9)
    assert.ok(Math.abs(m.marcas[i].centro[1] - pO.marcas[i].centro[1] - 0.02) < 1e-9)
  }
})

caso('girarPlantilla: gira alrededor del medio de la L.P.R. y suma el giro al rumbo de las fichas', () => {
  const g = girarPlantilla(pO, 90)
  const piv = [oeste, (NO[1] + SO[1]) / 2] // el medio de la L.P.R.
  const r = (c) => Math.hypot((c[0] - piv[0]) * 111.32 * Math.cos(piv[1] * Math.PI / 180), (c[1] - piv[1]) * 110.574)
  for (let i = 0; i < pO.marcas.length; i++) {
    assert.ok(Math.abs(r(g.marcas[i].centro) - r(pO.marcas[i].centro)) < 1e-6, 'misma distancia al pivote')
    assert.equal(g.marcas[i].rot, (pO.marcas[i].rot + 90) % 360)
  }
  // Al oeste + 90° horario = al norte.
  assert.ok(g.marcas.every((m) => m.centro[1] > piv[1]))
  const ida = girarPlantilla(girarPlantilla(pO, 15), -15)
  assert.ok(Math.abs(ida.marcas[1].centro[0] - pO.marcas[1].centro[0]) < 1e-9)
  assert.equal(ida.SIDajustada.giro, 0)
})

caso('moverFicha: mueve sólo esa ficha (y su arco si es artillería)', () => {
  const art = pO.marcas.find((m) => m.rol === 'artilleria' && pO.conos.some((c) => c.de === m.id)) || pO.marcas[0]
  const a = art.centro, b = [a[0] + 0.02, a[1]]
  const m = moverFicha(pO, art, a, b)
  const i = pO.marcas.indexOf(art)
  assert.ok(Math.abs(m.marcas[i].centro[0] - a[0] - 0.02) < 1e-9)
  assert.equal(m.marcas[i].SIDaMano, true)
  m.marcas.forEach((x, k) => k !== i && assert.equal(x, pO.marcas[k]))
  const cono = pO.conos.findIndex((c) => c.de === art.id)
  if (cono >= 0) assert.ok(Math.abs(m.conos[cono].centro[0] - pO.conos[cono].centro[0] - 0.02) < 1e-9)
  assert.equal(m.SIDajustada.fichas, 1)
})

console.log(`\n${n} casos pasan.`)
