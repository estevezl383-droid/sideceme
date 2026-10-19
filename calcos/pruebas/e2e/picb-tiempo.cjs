// ⏱️ El tiempo de la PICB sale de la Línea Inicial de Tiempo del G-3 (index-picb-tiempo-20261019.js),
// en la Mesa real (Chromium). Lo pidió Sergio con la captura de la H.T. 3 vacía: «el G-3 ya realizó la
// línea de tiempo… de ahí ya debería generarse automáticamente… así debe ser todo sincronizado».
//   · con la F1·P4 hecha (D-15 (2300) → D (0500): TD 14 d 6 h, T. Plan 114 h, PICB 40 % = 2736 min),
//     el tablero del G-2 muestra 2736 min y dice de dónde salió;
//   · la H.T. 3 reparte esos minutos (TOTAL PICB 45 h 36 min);
//   · si el G-2 escribe otro número, manda el suyo; sin errores de consola.
//   node calcos/pruebas/e2e/picb-tiempo.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-picb-tiempo')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA PICB TIEMPO (FICT.)' })
  datos.g3 = { lineaTiempo: { modo: 'diaD', recepcion: 'D-15 (2300)', inicioOperacion: 'D (0500)', finOperaciones: 'D+3 (1700)' } }
  datos.picb = {}
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-2 INTELIGENCIA/i }).first())
    await page.getByText('🔎 PICB — las 4 fases del G-2').waitFor({ timeout: 15000 })
    const panel = page.locator('h3', { hasText: '🔎 PICB — las 4 fases del G-2' }).locator('xpath=ancestor::div[.//input[@placeholder="min"]][1]')
    const reloj = panel.locator('input[placeholder="min"]').first()
    assert.equal(await reloj.inputValue(), '2736', 'Tiempo para la PICB = 40 % del T. Plan de la Línea de Tiempo')
    const txt = await panel.evaluate((n) => n.innerText)
    assert.match(txt, /Sale de la F1·P4 Línea Inicial de Tiempo del G-3: Análisis de la misión \(PICB\), 40 %/)
    await page.screenshot({ path: path.join(SALIDAS, '1-tablero-g2.png') })

    await clic(panel.getByRole('button', { name: /H\.T\. 3/ }).first())
    // La H.T. 3 reemplaza al tablero en el mismo panel.
    const nota = page.locator('[data-picb="desde-linea-tiempo"]')
    await nota.waitFor({ timeout: 10000 })
    const hoja = nota.locator('xpath=ancestor::div[.//input[@type="number"]][1]')
    const ht3 = await hoja.evaluate((n) => n.innerText)
    assert.match(ht3, /TOTAL PICB\s*45 h 36 min/, 'la H.T. 3 reparte los minutos de la Línea de Tiempo')
    assert.match(ht3, /Definir el ambiente\s*10%\s*4 h 34 min/)
    await page.screenshot({ path: path.join(SALIDAS, '2-ht3.png') })

    // El G-2 escribe su propio tiempo: manda el suyo.
    await hoja.locator('input[type="number"]').last().fill('600')
    await page.waitForTimeout(500)
    const propio = await page.locator('[data-picb="desde-linea-tiempo"]').locator('xpath=ancestor::div[.//input[@type="number"]][1]').evaluate((n) => n.innerText)
    assert.match(propio, /TOTAL PICB\s*10 h 00 min/)
    assert.match(propio, /La Línea de Tiempo daba/)
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: el tiempo de la PICB sale de la Línea Inicial de Tiempo del G-3 (2736 min = 40 % del T. Plan), la H.T. 3 lo reparte y el G-2 puede poner el suyo.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
