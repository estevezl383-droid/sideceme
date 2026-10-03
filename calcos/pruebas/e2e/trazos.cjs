// Los trazos de la Mesa TERMINAN: Área de Operaciones, Línea de Extraviados (G-1), eje
// humanitario (G-5), avenidas del CMOC (G-2), obstáculos (G-3) — en 2D y en 3D, con el
// ratón y con el dedo.
//
// Antes sólo terminaban con el evento «dblclick» del navegador. Safari del iPad no lo manda
// después de un doble toque y en la carta 2D el trazo NO terminaba nunca; un doble clic más
// lento que el del sistema eran dos vértices más. Ahora también terminan con un clic (o un
// toque) otra vez sobre el último punto, con Enter y con la barra «✓ TERMINAR» de abajo.
//
// Corre la Mesa de verdad en Chromium (sin red: ver navegador.js) con el ejercicio de
// unidades ficticias.
//
//   cd calcos/pruebas && node e2e/trazos.cjs            (todo)
//   node e2e/trazos.cjs 2d | 3d | dedo | dedo2d | dedo3d (una parte)
//   COMPILADO=/ruta/a/otro-index.js node e2e/trazos.cjs  (prueba otro compilado)
//
// Tarda unos minutos: sin placa de video, cada render del 3D tarda segundos.
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { abrir, estadoReact, sembrarYAbrir, entrar3D, salir3D, aPantalla, toques } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const { vigente } = require('../extraer')

// Puntos sobre terreno libre, lejos de las fichas ficticias y de los paneles. Al oeste el
// frente (de norte a sur) y un vértice de contorno hacia el este.
const P = {
  frente: [[-65.093, -17.006], [-65.093, -17.016], [-65.093, -17.026]],
  contorno: [-65.08, -17.016],
  linea: [[-65.095, -17.025], [-65.085, -17.03], [-65.075, -17.025]],
}

// Lo trazado (ops y CMOC) y la barra de abajo.
const estado = (page) =>
  estadoReact(page, (v) =>
    v && !Array.isArray(v) && Array.isArray(v.limites) && Array.isArray(v.obstaculos)
      ? {
          lineasEM: (v.lineasEM || []).map((l) => `${l.tipo}:${l.coords.length}`),
          obstaculos: v.obstaculos.map((o) => `${o.tipo}:${(o.coords || []).length}`),
          frente: v.areaOps ? v.areaOps.frente.length : 0,
          area: v.areaOps ? v.areaOps.coords.length : 0,
        }
      : undefined,
  )
const cmoc = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.avenidas) && Array.isArray(v.restringido) ? v.avenidas.map((a) => a.coords.length) : undefined))
const barra = (page) => page.evaluate(() => [...document.querySelectorAll('.barra-trazo button')].map((b) => b.textContent))
const rotulo = (page) => page.evaluate(() => [...document.querySelectorAll('.rotulo-ao .ao-paso')].map((e) => e.textContent).join(' | '))
const clic = (loc) => loc.dispatchEvent('click')

async function esperar(page, leer, cumple, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (cumple(v) || Date.now() - t0 > ms) return v
    await page.waitForTimeout(250)
  }
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

async function preparar({ vista = '2d', movil = false, comoSafari = false } = {}) {
  const m = await abrir(movil ? { ancho: 1280, alto: 900, movil: true } : {})
  const { page } = m
  if (process.env.COMPILADO) {
    const cuerpo = fs.readFileSync(process.env.COMPILADO)
    await page.route(`**/assets/${path.basename(vigente())}`, (r) => r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: cuerpo }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const ok = page.getByRole('button', { name: /entendido/i })
    if (await ok.count()) await ok.first().click().catch(() => {})
  }
  if (comoSafari)
    // Safari del iPad no manda «dblclick» después de un doble toque (Chrome sí). Se lo corta
    // antes de que llegue a la carta, para probar ese caso acá.
    await page.evaluate(() =>
      window.addEventListener('dblclick', (e) => e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents && e.stopImmediatePropagation(), true),
    )
  const datos = ejercicioFicticio({ conPlantilla: false })
  // Con área de interés: así aparece «🪖 CMOC» para dibujar avenidas.
  datos.aoi = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-65.12, -16.96], [-64.98, -16.96], [-64.98, -17.07], [-65.12, -17.07], [-65.12, -16.96]]] } }
  await sembrarYAbrir(page, datos)
  const ocultar = page.getByText('▼ ocultar')
  if (await ocultar.count()) await ocultar.first().click().catch(() => {})
  // El encuadre se hace desde el 3D, que expone su mapa y el de Leaflet.
  await entrar3D(page)
  await page.evaluate((v) => {
    window.__lm2d = window.__espejo3d.lm
    window.__map3d.jumpTo({ center: [-65.07, -17.015], zoom: 13.2, pitch: v === '3d' ? 30 : 0, bearing: 0 })
  }, vista)
  await page.waitForTimeout(3000)
  if (vista === '2d') await salir3D(page)
  return m
}

// Cada punto tiene que caer sobre la carta (no sobre un panel ni una ficha).
async function sobreLaCarta(page, puntos) {
  const tapados = await page.evaluate(
    (L) =>
      L.filter(([x, y]) => {
        const el = document.elementFromPoint(x, y)
        return !el || !(el.closest('.maplibregl-canvas-container') || el.closest('.leaflet-container')) || el.closest('.leaflet-marker-icon, .m3d-mk, aside, .panel, .barra-trazo')
      }),
    puntos,
  )
  assert.deepStrictEqual(tapados, [], 'puntos de la prueba tapados por la interfaz: ' + JSON.stringify(tapados))
}

async function herramientaAO(page) {
  await clic(page.getByRole('button', { name: /ÁREA DE OPS/i }).first())
  await page.waitForTimeout(1200)
}

async function herramientaG1(page) {
  await clic(page.getByRole('button', { name: /G-1 Personal/i }).first())
  await page.waitForTimeout(1200)
  await clic(page.getByRole('button', { name: /Orden$/ }).first())
  await page.waitForTimeout(600)
  await clic(page.getByRole('button', { name: /Trazar la Línea de Extraviados/ }))
  await page.waitForTimeout(800)
}

async function herramientaG5(page) {
  await clic(page.getByRole('button', { name: /G-5 AC\/GM/i }).first())
  await page.waitForTimeout(1200)
  await clic(page.getByRole('button', { name: /Evacuación/ }).first())
  await page.waitForTimeout(600)
  await clic(page.getByRole('button', { name: /Trazar el eje humanitario/ }))
  await page.waitForTimeout(800)
}

async function herramientaAlambrada(page, movil) {
  const def = page.getByRole('button', { name: /DEFENSA/i }).first()
  movil ? await def.tap() : await clic(def)
  await page.waitForTimeout(800)
  const al = page.getByRole('button', { name: /AL · Alambrada simple/ })
  movil ? await al.tap() : await clic(al)
  await page.waitForTimeout(500)
}

async function cerrarPaneles(page) {
  for (let i = 0; i < 4; i++) {
    const x = page.getByRole('button', { name: '✕', exact: true })
    if (!(await x.count())) break
    await clic(x.last())
    await page.waitForTimeout(400)
  }
}

async function conRaton(vista) {
  const { page, errores, cerrar } = await preparar({ vista })
  const V = vista.toUpperCase()
  try {
    const fr = await aPantalla(page, P.frente)
    const [co] = await aPantalla(page, [P.contorno])
    const li = await aPantalla(page, P.linea)
    await sobreLaCarta(page, [...fr, co, ...li])

    await caso(`${V} · ratón · Área de Operaciones: doble clic = «el frente es éste», y el doble clic cierra el contorno`, async () => {
      await herramientaAO(page)
      const antes = await estado(page)
      await page.mouse.click(...fr[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...fr[1])
      await page.waitForTimeout(500)
      assert.deepStrictEqual(await barra(page), ['✓ EL FRENTE ES ÉSTE', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'la barra del frente')
      await page.mouse.dblclick(...fr[2])
      await page.waitForTimeout(1500)
      await page.mouse.move(...co)
      await page.waitForTimeout(800)
      assert.match(await rotulo(page), /2 · CONTORNO/, 'el doble clic no pasó a la profundidad')
      assert.deepStrictEqual(await barra(page), ['✓ CERRAR EL ÁREA', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'la barra del contorno')
      await page.mouse.dblclick(...co)
      const d = await esperar(page, estado, (e) => e.frente === 3)
      assert.strictEqual(d.frente, 3, `el área no se guardó con el frente de 3 vértices: ${JSON.stringify(antes)} → ${JSON.stringify(d)}`)
      assert.ok(d.area >= 4, `área de ${d.area} vértices`)
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · Línea de Extraviados (G-1): doble clic LENTO (dos clics en el último punto) termina`, async () => {
      await herramientaG1(page)
      const antes = await estado(page)
      await page.mouse.click(...li[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...li[1])
      await page.waitForTimeout(500)
      await page.mouse.click(...li[2])
      await page.waitForTimeout(900) // más lento que cualquier doble clic del sistema
      await page.mouse.click(...li[2])
      const d = await esperar(page, estado, (e) => e.lineasEM.length > antes.lineasEM.length)
      assert.deepStrictEqual(d.lineasEM, [...antes.lineasEM, 'extraviados:3'])
      await page.waitForTimeout(800)
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
    })

    await caso(`${V} · ratón · Línea de Extraviados (G-1): doble clic justo sobre el último vértice termina UNA vez y no empieza otra`, async () => {
      const antes = await estado(page)
      await page.mouse.click(...li[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...li[1])
      await page.waitForTimeout(500)
      await page.mouse.dblclick(...li[1])
      const d = await esperar(page, estado, (e) => e.lineasEM.length > antes.lineasEM.length)
      assert.deepStrictEqual(d.lineasEM, [...antes.lineasEM, 'extraviados:2'])
      await page.waitForTimeout(1000)
      assert.deepStrictEqual(await barra(page), [], 'el segundo clic del doble clic empezó otro trazo')
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · eje humanitario (G-5): Enter termina`, async () => {
      await herramientaG5(page)
      const antes = await estado(page)
      for (const p of li) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.keyboard.press('Enter')
      const d = await esperar(page, estado, (e) => e.lineasEM.length > antes.lineasEM.length)
      assert.deepStrictEqual(d.lineasEM, [...antes.lineasEM, 'humanitario:3'])
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · obstáculo: «↶ BORRAR ÚLTIMO» y «✓ TERMINAR TRAZO» de la barra; Esc cancela`, async () => {
      await herramientaAlambrada(page)
      const antes = await estado(page)
      for (const p of li) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.locator('.barra-trazo button', { hasText: 'BORRAR ÚLTIMO' }).click()
      await page.waitForTimeout(400)
      await page.locator('.barra-trazo button', { hasText: 'TERMINAR TRAZO' }).click()
      const d = await esperar(page, estado, (e) => e.obstaculos.length > antes.obstaculos.length)
      assert.deepStrictEqual(d.obstaculos, [...antes.obstaculos, 'alambre_simple:2'])
      await page.mouse.click(...li[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...li[1])
      await page.waitForTimeout(500)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(600)
      assert.deepStrictEqual(await barra(page), [], 'Esc no canceló')
      assert.deepStrictEqual((await estado(page)).obstaculos, d.obstaculos, 'Esc agregó algo')
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · avenida del CMOC (G-2): dos clics en el último punto terminan`, async () => {
      await clic(page.getByRole('button', { name: '🪖 CMOC', exact: true }))
      await page.waitForTimeout(1000)
      await clic(page.getByRole('button', { name: /^➤\s*Avenida$/ }))
      await page.waitForTimeout(800)
      const antes = (await cmoc(page)) || []
      for (const p of li) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.waitForTimeout(500)
      await page.mouse.click(...li[2])
      const d = await esperar(page, cmoc, (a) => (a || []).length > antes.length)
      assert.deepStrictEqual(d, [...antes, 3])
      await page.waitForTimeout(800)
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
    })

    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

// Con el dedo, como en un iPad (sin el «dblclick» que Safari no manda).
async function conDedo(vista) {
  const { page, errores, cerrar } = await preparar({ vista, movil: true, comoSafari: true })
  const V = vista.toUpperCase()
  try {
    const fr = await aPantalla(page, P.frente)
    const li = await aPantalla(page, P.linea)
    await sobreLaCarta(page, [...fr, ...li])
    await caso(`${V} · dedo (Safari) · alambrada: toque, toque, doble toque`, async () => {
      await herramientaAlambrada(page, true)
      const antes = await estado(page)
      await toques(page, ...li[0])
      await page.waitForTimeout(600)
      await toques(page, ...li[1])
      await page.waitForTimeout(600)
      await toques(page, ...li[2], { veces: 2, separacionMs: 300 })
      const d = await esperar(page, estado, (e) => e.obstaculos.length > antes.obstaculos.length)
      assert.deepStrictEqual(d.obstaculos, [...antes.obstaculos, 'alambre_simple:3'])
      await page.waitForTimeout(800)
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
    })
    await caso(`${V} · dedo (Safari) · Área de Operaciones: doble toque = «el frente es éste»`, async () => {
      await herramientaAO(page)
      await toques(page, ...fr[0])
      await page.waitForTimeout(600)
      await toques(page, ...fr[1], { veces: 2, separacionMs: 300 })
      await page.waitForTimeout(1500)
      assert.deepStrictEqual(await barra(page), ['✓ CERRAR EL ÁREA', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'no pasó al contorno')
    })
    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

;(async () => {
  const solo = process.argv[2]
  if (!solo || solo === '2d') await conRaton('2d')
  if (!solo || solo === '3d') await conRaton('3d')
  if (!solo || solo === 'dedo' || solo === 'dedo2d') await conDedo('2d')
  if (!solo || solo === 'dedo' || solo === 'dedo3d') await conDedo('3d')
  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
