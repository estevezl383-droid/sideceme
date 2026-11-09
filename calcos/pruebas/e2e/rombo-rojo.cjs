// 🟥 La Mesa real en Chromium (09-11-2026): un KMZ con ROMBO ROJO entra como ficha ENEMIGA aunque el
// nombre no diga «enemigo» («1ª Brig. Acor. «Coraceros» – Chungará.kmz» entraba AZUL). Se superponen
// los 4 KMZ de las brigadas, se pasan al ejercicio y tienen que quedar las 4 rojas. Captura en
// pruebas/salidas-rombo/.
//   CARPETA_KMZ="$HOME/Desktop/FF.TT.T.O." node calcos/pruebas/e2e/rombo-rojo.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-rombo')
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('rombo-rojo: sin CARPETA_KMZ, no corre (usa los KMZ reales).'); process.exit(0) }
const archivos = fs.readdirSync(dir).filter((n) => /Brig.*\.kmz$/i.test(n)).sort()
const leerUnidades = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.length && v.every((x) => x && typeof x === 'object' && 'designacion' in x && 'lat' in x) ? v : undefined))

;(async () => {
  assert.equal(archivos.length, 4, archivos.join(', '))
  fs.mkdirSync(SALIDAS, { recursive: true })
  const { page, errores, cerrar } = await abrir({ escalaPantalla: Number(process.env.DPR || 1) })
  page.on('dialog', (d) => d.accept())
  try {
    await sembrarYAbrir(page, { ...ejercicioFicticio({ conPlantilla: false }), nombre: 'ROMBO ROJO' })
    const n0 = (await leerUnidades(page)).length
    await page.locator('.sidsup-btn').click()
    const input = page.locator('input[type=file][accept*=".kmz"][accept*=".geojson"]')
    for (const n of archivos) {
      await input.setInputFiles({ name: n, mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(path.join(dir, n)) })
      await page.waitForTimeout(600)
    }
    await page.waitForFunction((k) => document.querySelectorAll('.sidsup-pasar button[data-a="pasar"]').length >= k, archivos.length, { timeout: 20000 })
    // Dibujadas en ROJO encima de la carta.
    const colores = await page.$$eval('.sidsup-u', (els) => els.map((e) => e.outerHTML.match(/#e0443a|#4f9cf0/gi) || []).flat())
    assert.ok(colores.length && colores.every((c) => /e0443a/i.test(c)), 'superpuestas en rojo: ' + colores.join(','))
    await page.screenshot({ path: path.join(SALIDAS, '1-superpuestas.png') })
    const botones = page.locator('.sidsup-pasar button[data-a="pasar"]')
    while (await botones.count()) { await botones.first().click(); await page.waitForTimeout(900) }
    const nuevas = (await leerUnidades(page)).filter((x) => x.origenSuperponer)
    console.log('  · ' + nuevas.map((x) => `${x.designacion} → ${x.bando}`).join(' · '))
    assert.equal(nuevas.length, 4)
    assert.ok(nuevas.every((x) => x.bando === 'enemigo'), 'las 4 brigadas, ENEMIGAS')
    assert.equal((await leerUnidades(page)).length, n0 + 4)
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SALIDAS, '2-en-el-ejercicio.png') })
    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log('rombo-rojo: OK')
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
