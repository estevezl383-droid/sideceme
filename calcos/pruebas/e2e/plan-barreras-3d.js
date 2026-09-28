// El plan de barreras se traza igual en 2D y en 3D, con ratón y con el dedo.
//
// Corre la Mesa del EM de verdad en Chromium (sin red: ver navegador.js) con el
// ejercicio de unidades ficticias, que trae un arco de apoyo de la plantilla
// enemiga tapando el área: justo donde va el plan de barreras.
//
//   cd calcos/pruebas && node e2e/plan-barreras-3d.js
//
// Tarda unos minutos: sin placa de video, cada render del 3D tarda segundos.
const assert = require('assert')
const { abrir, estadoOps, esperarCambio, sembrarYAbrir, entrar3D, salir3D, aPantalla, toques, toqueLargo } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

// Puntos dentro del arco de la plantilla (y del Área de Operaciones).
const P = {
  linea: [[-65.085, -17.0], [-65.075, -17.008], [-65.065, -17.0]],
  punto: [-65.07, -17.03],
  area: [[-65.075, -17.02], [-65.055, -17.02], [-65.065, -17.034]],
  posdef: [-65.04, -17.01],
}

// Cada punto tiene que caer sobre la carta (no sobre un panel ni una ficha).
async function sobreLaCarta(page, puntos) {
  const tapados = await page.evaluate((L) => L.filter(([x, y]) => {
    const el = document.elementFromPoint(x, y)
    return !el || !(el.closest('.maplibregl-canvas-container') || el.closest('.leaflet-container')) || el.closest('.leaflet-marker-icon, .m3d-mk, aside, .panel')
  }), puntos)
  assert.deepStrictEqual(tapados, [], 'puntos de la prueba tapados por la interfaz: ' + JSON.stringify(tapados))
}

let fallas = 0
async function caso(nombre, fn) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

async function preparar({ movil = false, vista = '3d', conPlantilla = true, comoSafari = false } = {}) {
  const m = await abrir(movil ? { ancho: 1280, alto: 900, movil: true } : {})
  const { page } = m
  if (comoSafari)
    // Safari del iPad no manda «dblclick» después de un doble toque (Chrome sí).
    // Se lo corta antes de que llegue a la carta, para probar ese caso acá.
    await page.evaluate(() =>
      window.addEventListener('dblclick', (e) => e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents && e.stopImmediatePropagation(), true),
    )
  await sembrarYAbrir(page, ejercicioFicticio({ conPlantilla }))
  const ocultar = page.getByText('▼ ocultar')
  if (await ocultar.count()) await ocultar.first().click().catch(() => {})
  // El encuadre se hace desde el 3D, que expone su mapa y el de Leaflet.
  await entrar3D(page)
  await page.evaluate(() => {
    window.__lm2d = window.__espejo3d.lm
    window.__map3d.jumpTo({ center: [-65.05, -17.015], zoom: 13.2, pitch: 40, bearing: 0 })
  })
  await page.waitForTimeout(3000)
  if (vista === '2d') await salir3D(page)
  const boton = page.getByRole('button', { name: /DEFENSA/i }).first()
  movil ? await boton.tap() : await boton.click()
  await page.waitForTimeout(800)
  return m
}

async function herramienta(page, nombre, movil) {
  const b = page.getByRole('button', { name: nombre })
  movil ? await b.tap() : await b.click()
  await page.waitForTimeout(500)
}

const popups = (page) => page.evaluate(() => document.querySelectorAll('.maplibregl-popup, .leaflet-popup').length)

async function conRaton(vista) {
  const { page, errores, cerrar } = await preparar({ vista })
  try {
    let e = await estadoOps(page)
    const pts = await aPantalla(page, [...P.linea, P.punto, ...P.area, P.posdef])
    await sobreLaCarta(page, pts)
    const [l0, l1, l2, pto, a0, a1, a2, pd] = pts
    await caso(`${vista.toUpperCase()} · ratón · alambrada encima del arco enemigo (clic, clic, doble clic)`, async () => {
      await herramienta(page, /AL · Alambrada simple/)
      await page.mouse.click(...l0)
      await page.waitForTimeout(500)
      await page.mouse.click(...l1)
      await page.waitForTimeout(500)
      await page.mouse.dblclick(...l2)
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.obstaculos, e.obstaculos + 1, `obstáculos: ${e.obstaculos} → ${d.obstaculos}`)
      assert.strictEqual(await popups(page), 0, 'se abrió el cartel del arco en vez de poner el vértice')
      e = d
    })
    await caso(`${vista.toUpperCase()} · ratón · demolición (un clic)`, async () => {
      await herramienta(page, /DEM · Demolición/)
      await page.mouse.click(...pto)
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.obstaculos, e.obstaculos + 1, `obstáculos: ${e.obstaculos} → ${d.obstaculos}`)
      e = d
    })
    await caso(`${vista.toUpperCase()} · ratón · campo minado (área)`, async () => {
      await herramienta(page, /CM AP · Campo minado antipersonal/)
      await page.mouse.click(...a0)
      await page.waitForTimeout(500)
      await page.mouse.click(...a1)
      await page.waitForTimeout(500)
      await page.mouse.dblclick(...a2)
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.obstaculos, e.obstaculos + 1, `obstáculos: ${e.obstaculos} → ${d.obstaculos}`)
      e = d
    })
    await caso(`${vista.toUpperCase()} · ratón · posición defensiva`, async () => {
      await herramienta(page, /Colocar posición defensiva/)
      await page.mouse.click(...pd)
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.posDef, e.posDef + 1, `posiciones: ${e.posDef} → ${d.posDef}`)
    })
    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

// Con el dedo, como en un iPad: sin la plantilla enemiga (eso ya lo prueba el
// ratón) y sin el «dblclick» que Safari no manda, así se prueba sólo el dedo.
async function conDedo() {
  const { page, errores, cerrar } = await preparar({ movil: true, vista: '3d', conPlantilla: false, comoSafari: true })
  try {
    let e = await estadoOps(page)
    const pts = await aPantalla(page, [...P.linea, P.punto, ...P.area])
    await sobreLaCarta(page, pts)
    const [l0, l1, l2, pto, a0, a1, a2] = pts
    await caso('3D · dedo · alambrada: toque, toque, doble toque', async () => {
      await herramienta(page, /AL · Alambrada simple/, true)
      await toques(page, ...l0)
      await page.waitForTimeout(600)
      await toques(page, ...l1)
      await page.waitForTimeout(600)
      await toques(page, ...l2, { veces: 2 })
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.obstaculos, e.obstaculos + 1, `obstáculos: ${e.obstaculos} → ${d.obstaculos}`)
      e = d
    })
    await caso('3D · dedo · demolición: un toque', async () => {
      await herramienta(page, /DEM · Demolición/, true)
      await toques(page, ...pto)
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.obstaculos, e.obstaculos + 1, `obstáculos: ${e.obstaculos} → ${d.obstaculos}`)
      e = d
    })
    await caso('3D · dedo · campo minado: toques y doble toque para cerrar', async () => {
      await herramienta(page, /CM AP · Campo minado antipersonal/, true)
      await toques(page, ...a0)
      await page.waitForTimeout(600)
      await toques(page, ...a1)
      await page.waitForTimeout(600)
      await toques(page, ...a2, { veces: 2 })
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.obstaculos, e.obstaculos + 1, `obstáculos: ${e.obstaculos} → ${d.obstaculos}`)
      e = d
    })
    await caso('3D · dedo · el toque largo termina la línea (como el clic derecho)', async () => {
      await herramienta(page, /AL 2 · Alambrada doble/, true)
      await toques(page, ...l0)
      await page.waitForTimeout(600)
      await toques(page, ...l1)
      await page.waitForTimeout(600)
      await toqueLargo(page, ...l2)
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.obstaculos, e.obstaculos + 1, `obstáculos: ${e.obstaculos} → ${d.obstaculos}`)
      e = d
    })
    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

// En 3D la carta plana queda escondida con OTRA escala: medir ahí los 12 px de
// «tocaste el primer vértice» cerraba el área tocando lejos de él.
async function cierreArea3D() {
  const { page, errores, cerrar } = await abrir()
  try {
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await entrar3D(page)
    await page.evaluate(() => window.__map3d.jumpTo({ center: [-65.05, -17.015], zoom: 13, pitch: 60, bearing: 0 }))
    await page.waitForTimeout(3000)
    await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().click()
    await page.waitForTimeout(800)
    const c = await page.evaluate(() => {
      const r = window.__map3d.getCanvas().getBoundingClientRect()
      return { x: r.left + r.width * 0.45, y: r.top + r.height * 0.72 }
    })
    let e = await estadoOps(page)
    // Frente: de izquierda a derecha, y doble clic. Después el contorno hacia
    // retaguardia (arriba en la pantalla): un vértice lejos y otro a 22 px del
    // primero del frente. Recién tocando el primero se cierra.
    await page.mouse.click(c.x - 60, c.y)
    await page.waitForTimeout(500)
    await page.mouse.dblclick(c.x + 60, c.y)
    await page.waitForTimeout(4000)
    await page.mouse.click(c.x + 60, c.y - 150)
    await page.waitForTimeout(3000)
    await caso('3D · Área de Operaciones: un vértice a 22 px del primero NO cierra el área', async () => {
      await page.mouse.click(c.x - 60, c.y - 22)
      await page.waitForTimeout(5000)
      const d = await estadoOps(page)
      assert.strictEqual(d.areaOps, false, 'el área se cerró sola con un vértice que no era el primero')
    })
    await caso('3D · Área de Operaciones: se cierra tocando el primer vértice', async () => {
      await page.mouse.click(c.x - 60, c.y)
      const d = await esperarCambio(page, estadoOps, e)
      assert.strictEqual(d.areaOps, true, 'el área no se cerró')
    })
    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

;(async () => {
  const solo = process.argv[2]
  if (!solo || solo === 'raton') {
    await conRaton('3d')
    await conRaton('2d')
  }
  if (!solo || solo === 'dedo') await conDedo()
  if (!solo || solo === 'area') await cierreArea3D()
  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
