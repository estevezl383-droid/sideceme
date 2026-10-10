// 🔄 AVISO DE VERSIÓN NUEVA (calcos/version/aviso-version.js) en la Mesa real (Chromium),
// escritorio y teléfono. El 10-10-2026 la Mesa de Sergio siguió armando el pedido VIEJO una hora
// después de publicado el arreglo: la pestaña estaba abierta desde antes.
//   · con el mismo index.html publicado, NO avisa (ni al volver a la pestaña);
//   · si el index.html publicado trae otro compilado (otro ?v=), muestra la franja;
//   · «Más tarde» la cierra; «Recargar ahora» recarga la página;
//   · sin errores de consola.
// Sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')

const out = path.resolve(__dirname, '../salidas-version')
fs.mkdirSync(out, { recursive: true })
const HTML = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8')
const FRANJA = '.sid-aviso-version'

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil })
    const { page } = a
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await page.waitForFunction(() => !!window.SIDAvisoVersion, null, { timeout: 15000 })
      const cargada = await page.evaluate(() => window.SIDAvisoVersion.cargada)
      assert.ok(/index-[\w-]+\.js\?v=/.test(cargada), `la foto de esta pestaña trae el compilado:\n${cargada}`)

      // El mismo index.html: no avisa.
      assert.equal(await page.evaluate(() => window.SIDAvisoVersion.revisar(true)), false)
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
      await page.waitForTimeout(400)
      assert.equal(await page.locator(FRANJA).count(), 0, 'sin versión nueva no hay franja')

      // Se publica otro compilado.
      const nuevo = HTML.replace(/(assets\/index-[\w-]+\.js)\?v=[^"]+/, '$1?v=otra-version')
      assert.notEqual(nuevo, HTML)
      await page.route(/\/calcos\/index\.html\?_=\d+$/, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: nuevo }))
      assert.equal(await page.evaluate(() => window.SIDAvisoVersion.revisar(true)), true)
      const franja = page.locator(FRANJA)
      await franja.waitFor({ timeout: 5000 })
      assert.match(await franja.innerText(), /Hay una versión nueva de la Mesa[\s\S]*Recargar ahora[\s\S]*Más tarde/)
      const caja = await franja.boundingBox()
      const vp = page.viewportSize()
      assert.ok(caja.x >= 0 && caja.x + caja.width <= vp.width, `la franja entra en la pantalla (${caja.x}+${caja.width} de ${vp.width})`)
      await page.screenshot({ path: path.join(out, `${tag}-aviso.png`) })

      // «Más tarde»: se va y no vuelve enseguida.
      await franja.getByRole('button', { name: 'Más tarde' }).click()
      assert.equal(await page.locator(FRANJA).count(), 0)
      await page.evaluate(() => window.SIDAvisoVersion.revisar(true))
      assert.equal(await page.locator(FRANJA).count(), 0, '«Más tarde» la pospone')

      // Una página de error del servidor (sin scripts) no cuenta como versión nueva.
      await page.unroute(/\/calcos\/index\.html\?_=\d+$/)
      await page.route(/\/calcos\/index\.html\?_=\d+$/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Mantenimiento</body></html>' }))
      assert.equal(await page.evaluate(() => window.SIDAvisoVersion.revisar(true)), false)
      await page.unroute(/\/calcos\/index\.html\?_=\d+$/)

      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: sin falso aviso; con otro compilado publicado, la franja «Hay una versión nueva» (Recargar / Más tarde); una página de error no cuenta.`)
    } catch (e) {
      console.error('ERRORES APP', a.errores)
      await page.screenshot({ path: path.join(out, `fallo-${tag}.png`), fullPage: true }).catch(() => {})
      throw e
    } finally {
      await a.cerrar()
    }
  }

  // «Recargar ahora» recarga (escritorio).
  const a = await abrir({})
  try {
    const { page } = a
    await page.waitForFunction(() => !!window.SIDAvisoVersion, null, { timeout: 15000 })
    const nuevo = HTML.replace(/(assets\/index-[\w-]+\.js)\?v=[^"]+/, '$1?v=otra-version')
    await page.route(/\/calcos\/index\.html\?_=\d+$/, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: nuevo }))
    await page.evaluate(() => {
      window.__antes = 1
      return window.SIDAvisoVersion.revisar(true)
    })
    await page.locator(FRANJA).waitFor({ timeout: 5000 })
    await Promise.all([page.waitForEvent('load', { timeout: 30000 }), page.locator(FRANJA).getByRole('button', { name: 'Recargar ahora' }).click()])
    assert.equal(await page.evaluate(() => window.__antes), undefined, 'la página se recargó')
    console.log('OK «Recargar ahora» recarga la Mesa.')
  } finally {
    await a.cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
