// Prueba: las fichas enemigas que acuesta la Mesa del EM no quedan en el agua.
//
// Extrae del compilado, tal cual, el contorno del lago (AGUA_LAGOS), las
// funciones que sacan una ficha del agua y gCe (arma cada ficha de cada fase
// de los CAE), y las corre en Node.
//
//   cd calcos/pruebas && npm install
//   node fichas-fuera-del-agua.js                     → el compilado que carga calcos/index.html
//   node fichas-fuera-del-agua.js --base <anterior.js> → además compara gCe en tierra con el anterior
const path = require('path')
const assert = require('assert')
const { vigente, cargar } = require('./extraer')

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : null
const archivo = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--base') || vigente()

const GCE = ['gCe', 'pCe', 'dCe', 'cCe', 'hCe', 'uCe', 'Ci']
const c = cargar(archivo, ['AGUA_LAGOS', 'dentroDelAgua', 'fueraDelAgua', 'sinAguaFicha', ...GCE])

// Distancia aproximada en km (suficiente a estas escalas).
const km = ([x1, y1], [x2, y2]) => Math.hypot((x2 - x1) * 111.32 * Math.cos(y1 * Math.PI / 180), (y2 - y1) * 110.57)

// Puntos del Lago Menor donde el calco ponía fichas, y puntos en tierra.
const EN_EL_AGUA = [[-68.7794, -16.3995], [-68.7524, -16.383], [-68.791, -16.4131], [-68.7339, -16.3667]]
const EN_TIERRA = [[-68.55, -16.41], [-68.13, -16.5], [-68.6747, -16.5094]]

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

console.log(`\nCompilado: ${path.relative(process.cwd(), archivo)}\n`)

caso('Reconoce los puntos del Lago Menor como agua y los de tierra como tierra', () => {
  for (const p of EN_EL_AGUA) assert.ok(c.dentroDelAgua(...p), `${p} debería ser agua`)
  for (const p of EN_TIERRA) assert.ok(!c.dentroDelAgua(...p), `${p} debería ser tierra`)
})

caso('Saca del agua cada punto, a la costa más cercana y un poco tierra adentro', () => {
  for (const p of EN_EL_AGUA) {
    const q = c.fueraDelAgua(p)
    assert.ok(!c.dentroDelAgua(...q), `${p} → ${q} sigue en el agua`)
    const d = km(p, q)
    assert.ok(d > 0.5 && d < 10, `${p} → ${q}: se movió ${d.toFixed(1)} km`)
    console.log(`      ${p} → ${q} (${d.toFixed(1)} km)`)
  }
})

caso('En tierra no mueve nada', () => {
  for (const p of EN_TIERRA) assert.strictEqual(c.fueraDelAgua(p), p)
})

caso('Sólo mueve fichas enemigas: las propias las pone el usuario', () => {
  const [x, y] = EN_EL_AGUA[0]
  const enemiga = { id: 'a', bando: 'enemigo', lng: x, lat: y, designacion: 'BAT. LAR-160' }
  const movida = c.sinAguaFicha(enemiga)
  assert.notStrictEqual(movida, enemiga)
  assert.ok(!c.dentroDelAgua(movida.lng, movida.lat))
  assert.strictEqual(movida.designacion, 'BAT. LAR-160')
  assert.strictEqual(enemiga.lng, x, 'no debe tocar el objeto original')
  const propia = { id: 'b', bando: 'propias', lng: x, lat: y }
  assert.strictEqual(c.sinAguaFicha(propia), propia)
  const enTierra = { id: 'c', bando: 'enemigo', lng: -68.55, lat: -16.41 }
  assert.strictEqual(c.sinAguaFicha(enTierra), enTierra)
})

const marca = centro => ({ centro, rot: 90, rol: 'artilleria', nom: 'BAT. LAR-160', escalon: 'compania', arma: 'lanzacohetes' })

caso('Al armar las fases (gCe), una ficha de la plantilla que cae en el lago sale en tierra', () => {
  const u = c.gCe(marca(EN_EL_AGUA[0]), 0, 0, 0, 'probable')
  assert.ok(!c.dentroDelAgua(u.lng, u.lat), `quedó en ${u.lng}, ${u.lat}`)
  assert.strictEqual(u.designacion, 'BAT. LAR-160')
})

caso('Al armar las fases (gCe), una ficha en tierra queda exactamente donde estaba', () => {
  const [x, y] = EN_TIERRA[2]
  const u = c.gCe(marca([x, y]), 0, 0, 0, 'probable')
  assert.deepStrictEqual([u.lng, u.lat], [x, y])
})

if (base) {
  caso('En tierra, gCe da lo mismo que el compilado anterior', () => {
    const b = cargar(base, GCE)
    const plano = o => JSON.parse(JSON.stringify(o)) // cada compilado corre en su propio contexto
    for (const p of EN_TIERRA) {
      for (const fase of [0, 1, 2, 3]) {
        assert.deepStrictEqual(plano(c.gCe(marca(p), 0, 0, fase, 'probable')), plano(b.gCe(marca(p), 0, 0, fase, 'probable')))
      }
    }
  })
}

console.log(fallas ? `\n${fallas} caso(s) fallan.\n` : '\nTodos los casos pasan.\n')
process.exit(fallas ? 1 : 0)
