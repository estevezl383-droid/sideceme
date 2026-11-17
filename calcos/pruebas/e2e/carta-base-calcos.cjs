// 🗺️ CARTA BASE Y CALCOS (17-11-2026): desde el panel 🌎 PICB del Teatro, «🖨️ Carta base y calcos» arma la hoja 1 con
// la carta (tiles) y las demás transparentes —un calco del Teatro por hoja y el calco de cada fase—, todas con el mismo
// encuadre y las mismas cruces de registro, y al terminar la Mesa queda como estaba.
//   CARPETA_KMZ=".../KMZ DIAMANTE" PLAYWRIGHT_MODULE=… SIDECEME_CHROMIUM=… node calcos/pruebas/e2e/carta-base-calcos.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-carta-base-calcos')
const BOTON = '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)'
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('carta-base-calcos e2e: sin CARPETA_KMZ, no corre (usa los KMZ DIAMANTE).'); process.exit(0) }
const leer = (n) => ({ name: n, mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(path.join(dir, n)) })
const todos = fs.readdirSync(dir).filter((n) => /\.kmz$/i.test(n)).sort()
const deop = todos.filter((n) => /DEOP|Direcciones Estrat/i.test(n) && !/CAE-\d/i.test(n))
const ejercicio = todos.filter((n) => !deop.includes(n) && !/CAE-\d|Superponer/i.test(n))

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const { page, errores, cerrar } = await abrir({ escalaPantalla: Number(process.env.DPR || 1), ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'DIAMANTE CARTA BASE' : undefined))
  try {
    // 1 · DIVISIÓN: el diálogo de siempre, con la casilla de la carta base SIN marcar (nada cambia para CE y DIV).
    await sembrarYAbrir(page, { ...ejercicioFicticio({ conPlantilla: false }), nombre: 'DIVISION NORMAL' })
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.SIDImpresionFases.abrir())
    const dlg0 = page.locator('.sidif')
    assert.equal(await dlg0.count(), 1, 'se abre el diálogo')
    assert.equal(await dlg0.locator('[data-base]').isChecked(), false, 'en el diálogo general la carta base va sin marcar')
    const n0 = await dlg0.locator('[data-cuenta]').innerText()
    await dlg0.locator('[data-base]').check()
    const n1 = await dlg0.locator('[data-cuenta]').innerText()
    assert.equal(parseInt(n1, 10), parseInt(n0, 10) + 1, 'la carta base suma una hoja')
    await dlg0.locator('[data-cerrar]').click()
    console.log('  ✓ DIVISIÓN: el diálogo sigue igual y la carta base suma una hoja')

    // 2 · Teatro: KMZ DIAMANTE como ejercicio + DEOP en el panel 🌎, paso 4.
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: BOTON }).click()])
    await selector.setFiles(ejercicio.map(leer))
    await page.waitForFunction(() => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some((b) => /DIAMANTE CARTA BASE/.test(b.textContent)), null, { timeout: 40000 })
    await page.locator('.sidpt-btn').waitFor({ state: 'visible', timeout: 15000 })
    await page.locator('.sidpt-btn').click()
    await page.waitForFunction(() => window.SIDPicbTeatro && window.SIDPicbTeatro.estado().base, null, { timeout: 30000 })
    await page.locator('input.sidpt-file').setInputFiles(deop.map(leer))
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().analisis.length >= 4, null, { timeout: 30000 })
    await page.locator('.sidpt-pasos button[data-n="4"]').click()
    await page.waitForFunction(() => window.SIDPicbTeatro.vista()?.caes?.probable?.fases?.length >= 3, null, { timeout: 20000 })
    await page.waitForTimeout(1000)
    const verAntes = await page.evaluate(() => JSON.stringify(window.SIDPicbTeatro.estado().ver))
    const fichasAntes = await page.locator('.leaflet-map-pane .sidpt-fch').count()

    // 3 · El botón del panel abre el diálogo con la carta base y los calcos del Teatro marcados.
    await page.locator('.sidpt [data-a="imprimir"]').click()
    const dlg = page.locator('.sidif')
    await dlg.waitFor()
    assert.match(await dlg.locator('h3').innerText(), /Carta base y calcos del Teatro/)
    assert.equal(await dlg.locator('[data-base]').isChecked(), true, 'la carta base viene marcada')
    assert.equal(await dlg.locator('input[data-curso="teatro-capas"]:checked').count(), 5, 'los cinco calcos del Teatro vienen marcados')
    assert.match(await dlg.locator('[data-cuenta]').innerText(), /^6 hojas/)

    // 4 · Una fase del CAE-1, además de los calcos sueltos.
    await dlg.locator('input[data-curso="teatro-probable"]').first().check()
    assert.match(await dlg.locator('[data-cuenta]').innerText(), /^7 hojas/)
    const [ventana] = await Promise.all([page.waitForEvent('popup', { timeout: 180000 }), dlg.locator('[data-ir]').click()])
    await ventana.waitForSelector('.hoja')
    await ventana.waitForTimeout(800)
    const hojas = await ventana.evaluate(() => [...document.querySelectorAll('.hoja')].map((h) => ({
      t: h.querySelector('header b').textContent, base: h.classList.contains('base'),
      tiles: h.querySelectorAll('img.leaflet-tile').length, reg: h.querySelectorAll('svg.reg').length })))
    assert.equal(hojas.length, 7, 'siete hojas')
    assert.ok(hojas[0].base && /CARTA BASE/.test(hojas[0].t), 'la hoja 1 es la carta base')
    assert.ok(hojas[0].tiles > 0, 'la carta base lleva la carta de fondo')
    assert.ok(hojas.slice(1).every((h) => h.tiles === 0), 'los calcos salen transparentes')
    assert.ok(hojas.every((h) => h.reg === 1), 'todas las hojas llevan las cruces de registro')
    assert.equal(await ventana.locator('.barra-imp button', { hasText: 'Descargar' }).count(), 1, 'está el botón de descargar')
    assert.equal(await ventana.evaluate(() => typeof window.sidGuardar), 'function', 'la descarga está armada')
    console.log('  ✓ ' + hojas.map((h) => h.t.split(' · ').slice(-1)[0].slice(0, 22)).join(' · '))
    await ventana.setViewportSize({ width: 1100, height: 900 })
    await ventana.locator('.hoja').nth(0).screenshot({ path: path.join(SALIDAS, '1-carta-base.png') })
    await ventana.locator('.hoja').nth(1).screenshot({ path: path.join(SALIDAS, '2-primer-calco.png') })

    // 5 · La Mesa vuelve como estaba (los ojos del panel del Teatro también).
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().capaFase === null)
    assert.equal(await page.evaluate(() => JSON.stringify(window.SIDPicbTeatro.estado().ver)), verAntes, 'los ojos del Teatro vuelven como estaban')
    assert.equal(await page.locator('.leaflet-map-pane .sidpt-fch').count(), fichasAntes, 'la carta vuelve a tener todas las fases')
    console.log('  ✓ la Mesa vuelve como estaba')
    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort|ERR_FAILED|net::|clearRect/i.test(e))
    assert.deepEqual(malos, [], 'sin errores nuevos en la consola')
    console.log('carta-base-calcos e2e: OK')
  } catch (e) {
    try { await page.screenshot({ path: path.join(SALIDAS, 'error.png') }) } catch (x) {}
    throw e
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
