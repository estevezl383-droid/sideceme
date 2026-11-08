// 🔎🧩 La Mesa real en Chromium (08-11-2026): las fichas rojas de un KMZ no quedan como puntitos al ver todo el TO
// (piso 0,9 del achique por zoom) y 🧩 Superponer acepta KMZ/KML (un grupo por carpeta; los calcos del terreno
// apagados). Capturas en pruebas/salidas-kmz/.
//   CARPETA_KMZ="/ruta/NUEVO EJERCICIO TCNL GALVEZ" node calcos/pruebas/e2e/superponer-kmz.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-kmz')
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('superponer-kmz: sin CARPETA_KMZ, no corre (usa los KMZ reales).'); process.exit(0) }
const limpio = path.join(dir, 'LIMPIO PARA PASAR')
const leer = p => ({ name: path.basename(p), mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(p) })

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const abierto = ejercicioFicticio({ conPlantilla: false }); abierto.nombre = 'FABBLE abierto'
  const { page, errores, cerrar } = await abrir()
  page.on('dialog', d => d.accept(d.defaultValue()))
  try {
    await sembrarYAbrir(page, abierto)
    // 1 · Las cuatro AO + las fichas enemigas, juntas, como ejercicio nuevo.
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    const [sel] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)' }).click()])
    await sel.setFiles(fs.readdirSync(limpio).filter(n => /\.kmz$/i.test(n)).map(n => leer(path.join(limpio, n))))
    await page.waitForFunction(() => /abierto:/.test(document.body.innerText), null, { timeout: 30000 })
    await page.waitForTimeout(1500)
    // 2 · A la escala de todo el TO (como la captura de Sergio): ¿de qué tamaño quedan las fichas?
    if (process.env.MEDIR) {
      for (const z of [6, 7, 8, 9, 10, 11, 12, 13, 14]) {
        await page.evaluate(z => window.__mapa2d.setView([-19.6, -68.6], z, { animate: false }), z)
        await page.waitForTimeout(900)
        const t = await page.evaluate(() => [...document.querySelectorAll('img.leaflet-marker-icon')].filter(i => i.src.startsWith('data:')).map(i => i.width + 'x' + i.height))
        console.log('MEDIR zoom', z, [...new Set(t)].join(' '))
      }
      process.exit(0)
    }
    for (const z of [8, 7]) {
      await page.evaluate(z => window.__mapa2d.setView([-19.6, -68.6], z, { animate: false }), z)
      await page.waitForTimeout(1200)
      const tam = await page.evaluate(() => [...document.querySelectorAll('img.leaflet-marker-icon')].filter(i => i.src.startsWith('data:')).map(i => [i.width, i.height]))
      assert.ok(tam.length >= 9, `fichas en la carta: ${tam.length}`)
      const ancho = Math.min(...tam.map(t => t[1]))
      console.log(`  · zoom ${z}: ${tam.length} fichas, la más chica ${ancho}px de alto (antes: ≈ ${Math.round(ancho * 0.28 / 0.9)}px)`)
      assert.ok(ancho >= 28, `la ficha más chica tiene ${ancho}px de alto`)
      await page.screenshot({ path: path.join(SALIDAS, `5-fichas-zoom${z}.png`) })
    }
    // 3 · 🧩 Superponer un KMZ.
    const entrada = page.locator('input[type=file][accept*=".kmz"][accept*=".geojson"]')
    assert.equal(await entrada.count(), 1, 'el tablero 🧩 acepta KMZ')
    assert.match(await page.locator('.sidsup-cargar[data-a="cargar"]').textContent(), /KMZ \/ KML/)
    await entrada.setInputFiles(leer(path.join(dir, '060700NOV26.kmz')))
    await page.waitForFunction(() => /superpuesto:/.test(document.body.innerText), null, { timeout: 30000 })
    const aviso = await page.locator('.sidsup-aviso').last().textContent()
    const grupos = await page.evaluate(() => window.SIDSuperponer.capas().map(c => ({ nombre: c.nombre, grupos: c.grupos.map(g => ({ n: g.nombre, v: g.visible, e: g.elementos.length })) })))
    const g = grupos[grupos.length - 1].grupos
    assert.ok(g.some(x => /SATURNO/.test(x.n) && x.v), 'las fichas enemigas prendidas')
    assert.ok(g.some(x => /CURVAS DE NIVEL/.test(x.n) && !x.v), 'los calcos del terreno apagados')
    const marcas = await page.evaluate(() => document.querySelectorAll('.sidsup-u').length)
    assert.ok(marcas >= 10, `marcas superpuestas: ${marcas}`)
    await page.evaluate(() => window.__mapa2d.setView([-19.6, -68.6], 7, { animate: false }))
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(SALIDAS, '6-superpuesto.png') })
    console.log(`  · ${aviso}`)
    console.log(`  · ${g.length} grupos, ${g.filter(x => x.v).length} prendidos, ${marcas} marcas`)
    assert.deepEqual(errores.filter(e => !/favicon|ERR_|Failed to load resource/.test(e)), [], 'sin errores JS')
    console.log('E2E fichas al ver el TO + 🧩 Superponer KMZ: OK. Sin errores JS.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exit(1) })
