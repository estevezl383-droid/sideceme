// 🖨️🌎 FASES ROJO del Teatro (14-11-2026): «Imprimir por fases y capas» saca una hoja por fase del CAE del PICB del
// Teatro, cada una sólo con las fichas rojas de ESA fase, y al terminar la Mesa queda como estaba.
//   CARPETA_KMZ=".../KMZ DIAMANTE" PLAYWRIGHT_MODULE=… SIDECEME_CHROMIUM=… node calcos/pruebas/e2e/impresion-teatro.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-impresion-teatro')
const BOTON = '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)'
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('impresion-teatro e2e: sin CARPETA_KMZ, no corre (usa los KMZ DIAMANTE).'); process.exit(0) }
const leer = (n) => ({ name: n, mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(path.join(dir, n)) })
const todos = fs.readdirSync(dir).filter((n) => /\.kmz$/i.test(n)).sort()
const deop = todos.filter((n) => /DEOP|Direcciones Estrat/i.test(n) && !/CAE-\d/i.test(n))
const ejercicio = todos.filter((n) => !deop.includes(n) && !/CAE-\d|Superponer/i.test(n))

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const { page, errores, cerrar } = await abrir({ escalaPantalla: Number(process.env.DPR || 1), ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'DIAMANTE IMPRESION TEATRO' : undefined))
  try {
    // 1 · DIVISIÓN: el diálogo no muestra nada del Teatro.
    await sembrarYAbrir(page, { ...ejercicioFicticio({ conPlantilla: false }), nombre: 'DIVISION NORMAL' })
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.SIDImpresionFases.abrir())
    assert.equal(await page.locator('.sidif').count(), 1, 'se abre el diálogo')
    assert.equal(await page.locator('.sidif input[data-capa="teatro"]').count(), 0, 'en DIV no aparece la capa del Teatro')
    assert.doesNotMatch(await page.locator('.sidif').innerText(), /FASES ROJO/)
    await page.locator('.sidif [data-cerrar]').click()
    console.log('  ✓ DIVISIÓN: el diálogo sigue igual')

    // 2 · Teatro: KMZ DIAMANTE como ejercicio + DEOP en el panel 🌎, paso 4 (CAE por fases).
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: BOTON }).click()])
    await selector.setFiles(ejercicio.map(leer))
    await page.waitForFunction(() => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some((b) => /DIAMANTE IMPRESION TEATRO/.test(b.textContent)), null, { timeout: 40000 })
    await page.locator('.sidpt-btn').waitFor({ state: 'visible', timeout: 15000 })
    await page.locator('.sidpt-btn').click()
    await page.waitForFunction(() => window.SIDPicbTeatro && window.SIDPicbTeatro.estado().base, null, { timeout: 30000 })
    await page.locator('input.sidpt-file').setInputFiles(deop.map(leer))
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().analisis.length >= 4, null, { timeout: 30000 })
    await page.locator('.sidpt-pasos button[data-n="4"]').click()
    await page.waitForFunction(() => window.SIDPicbTeatro.vista()?.caes?.probable?.fases?.length >= 3, null, { timeout: 20000 })
    await page.waitForTimeout(1000)
    const fases = (await page.evaluate(() => window.SIDPicbTeatro.vista().caes.probable.fases.map((f) => ({ id: f.id, n: f.acciones.filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lng)).length })))).filter((f) => f.n)
    const antes = await page.locator('.leaflet-map-pane .sidpt-fch').count()
    console.log('  · CAE-1: ' + fases.map((f) => `${f.id} ${f.n} fichas`).join(', ') + ` · en la carta ${antes}`)
    assert.equal(antes, fases.reduce((s, f) => s + f.n, 0), 'en la carta están las fichas de todas las fases')

    // 3 · Sólo el CAE-1 del Teatro, una hoja por fase, sin carta de fondo.
    await page.evaluate(() => window.SIDImpresionFases.abrir())
    const dlg = page.locator('.sidif')
    assert.match(await dlg.innerText(), /FASES ROJO · CAE-1/)
    assert.match(await dlg.innerText(), /FASES ROJO · CAE-2/)
    assert.equal(await dlg.locator('input[data-capa="teatro"]').count(), 1)
    for (const i of await dlg.locator('input[data-curso]').all()) {
      const quiero = (await i.getAttribute('data-curso')) === 'teatro-probable'
      if ((await i.isChecked()) !== quiero) await i.click()
    }
    await dlg.locator('[data-carta]').uncheck()
    assert.match(await dlg.locator('[data-cuenta]').innerText(), new RegExp(`^${fases.length} hojas`))
    const [ventana] = await Promise.all([page.waitForEvent('popup', { timeout: 120000 }), dlg.locator('[data-ir]').click()])
    await ventana.waitForSelector('.hoja')
    await ventana.waitForTimeout(800)
    const hojas = await ventana.evaluate(() => [...document.querySelectorAll('.hoja')].map((h) => ({
      t: h.querySelector('header b').textContent,
      f: [...h.querySelectorAll('.sidpt-fch')].filter((e) => !e.closest('[style*="display: none"]')).map((e) => e.textContent.trim().split(' ')[0]) })))
    assert.equal(hojas.length, fases.length, 'una hoja por fase')
    hojas.forEach((h, i) => {
      assert.match(h.t, new RegExp(`CAE-1 .*${fases[i].id}`))
      assert.equal(h.f.length, fases[i].n, `${fases[i].id}: ${h.f.length} fichas en la hoja, ${fases[i].n} en el CAE`)
      assert.ok(h.f.every((x) => x === fases[i].id), `${fases[i].id}: sólo fichas de su fase (${[...new Set(h.f)].join(', ')})`)
    })
    console.log('  ✓ ' + hojas.map((h) => `${h.t.split(' · ').pop()}: ${h.f.length} fichas`).join(' · '))
    const desbordan = await ventana.evaluate(() => [...document.querySelectorAll('.hoja .sidpt-fch')].filter((e) => e.scrollWidth > e.clientWidth + 2).length)
    assert.equal(desbordan, 0, 'el texto de cada ficha queda dentro de su rótulo rojo')
    await ventana.setViewportSize({ width: 1100, height: 900 })
    await ventana.locator('.hoja').nth(0).screenshot({ path: path.join(SALIDAS, '1-hoja-primera-fase.png') })
    await ventana.locator('.hoja').nth(hojas.length - 1).screenshot({ path: path.join(SALIDAS, '2-hoja-ultima-fase.png') })

    // 4 · La Mesa vuelve como estaba.
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().faseVista === null)
    assert.equal(await page.evaluate(() => window.SIDPicbTeatro.estado().caeVisto), 'probable')
    assert.equal(await page.locator('.leaflet-map-pane .sidpt-fch').count(), antes, 'la carta vuelve a tener todas las fases')
    assert.ok(await page.evaluate(() => Object.entries(window.__mapa2d._panes).filter(([n]) => n.startsWith('sidpt')).every(([, p]) => p.style.display !== 'none')), 'paneles del Teatro a la vista')
    console.log('  ✓ la Mesa vuelve como estaba')
    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort|ERR_FAILED|net::/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log('impresion-teatro e2e: OK')
  } catch (e) {
    try { await page.screenshot({ path: path.join(SALIDAS, 'error.png') }) } catch (x) {}
    throw e
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
