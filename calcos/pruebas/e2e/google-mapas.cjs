// 🛰️ Imágenes de Google en la Mesa (index-google-mapas-20261023.js + google-mapas/v1), en Chromium y sin red:
// Google se simula (createSession, tiles 2D, viewport y el 3D realista), así no se gasta la clave.
//   · el selector de la barra de la carta trae 🛰️ Google Satélite, con nombres y ⛰️ Google Relieve;
//   · al elegirlos la carta 2D pide los tiles de Google con la sesión de cada tipo, y abajo a la izquierda
//     quedan «Google» y la atribución de las imágenes del lugar (viewport);
//   · el ⛰️ 3D toma la misma imagen de Google sobre el relieve, también con la atribución;
//   · si Google deja de dar tiles (cupo agotado), la carta vuelve sola a Esri, avisa y saca Google del selector;
//   · la barra de la carta sigue en una fila (el selector tiene ancho fijo);
//   · 🏙️ 3D realista (en el mismo selector) abre google-mapas/v1/3d.html en el lugar que se miraba y pide el 3D realista con la clave;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/google-mapas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, entrar3D, salir3D } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-google-mapas')
fs.mkdirSync(SALIDAS, { recursive: true })
// CesiumJS local (CESIUM_DIR=…/package/Build/Cesium, de `npm pack cesium@1.145.0`): sin él no se prueba el visor.
const CESIUM = process.env.CESIUM_DIR
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64')

// «Google» y la atribución tienen que verse: en sus dos puntas no hay otro elemento encima.
const nadaLaTapa = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s)
    el.style.pointerEvents = 'auto'
    const b = el.getBoundingClientRect()
    const ok = [b.left + 4, b.right - 4].every((x) => el.contains(document.elementFromPoint(x, b.top + b.height / 2)))
    el.style.pointerEvents = 'none'
    return ok && b.width > 60
  }, sel)

async function main() {
  const google = { sesiones: [], tiles: [], viewport: 0, falla: false, raiz3d: [] }
  const preparar = async (page) => {
    await page.route(/^https:\/\/tile\.googleapis\.com\//, (r) => {
      const u = new URL(r.request().url())
      if (u.pathname === '/v1/createSession') {
        const p = JSON.parse(r.request().postData() || '{}')
        google.sesiones.push(p)
        const s = 'S-' + p.mapType + (p.layerTypes ? '-nombres' : '')
        return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session: s, expiry: String(Math.floor(Date.now() / 1000) + 14 * 86400), tileWidth: 256, tileHeight: 256, imageFormat: 'png' }) })
      }
      if (u.pathname.startsWith('/v1/2dtiles/')) {
        google.tiles.push(u.searchParams.get('session'))
        return google.falla ? r.fulfill({ status: 403, body: 'cupo' }) : r.fulfill({ status: 200, contentType: 'image/png', body: PNG })
      }
      if (u.pathname === '/tile/v1/viewport') {
        google.viewport++
        return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ copyright: 'Imágenes ©2026 PRUEBA Maxar Technologies', maxZoomRects: [] }) })
      }
      return r.fulfill({ status: 404 })
    })
    // La pestaña de 🏙️ Google 3D: CesiumJS local y el 3D de Google simulado (403, como con el cupo agotado).
    const ctx = page.context()
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
    await ctx.route(/cdn\.jsdelivr\.net\/npm\/cesium@1\.145\.0\/Build\/Cesium\//, (r) => {
      const rel = decodeURIComponent(new URL(r.request().url()).pathname.split('/Build/Cesium/')[1])
      const f = CESIUM && path.join(CESIUM, rel)
      if (!f || !fs.existsSync(f)) return r.fulfill({ status: 404 })
      const tipo = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream'
      return r.fulfill({ status: 200, contentType: tipo, body: fs.readFileSync(f) })
    })
    await ctx.route(/tile\.googleapis\.com\/v1\/3dtiles\//, (r) => {
      google.raiz3d.push(r.request().url())
      return r.fulfill({ status: 403, contentType: 'application/json', body: '{"error":{"code":403,"message":"cupo"}}' })
    })
  }
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900, preparar })
  try {
    assert.deepEqual(google.sesiones.map((s) => s.mapType + (s.layerTypes ? '+' + s.layerTypes : '')).sort(), ['satellite', 'satellite+layerRoadmap', 'terrain+layerRoadmap'], 'pide una sesión por tipo')
    assert.ok(google.sesiones.every((s) => s.language === 'es-419' && s.region === 'BO'), 'en español, región Bolivia')

    await sembrarYAbrir(page, ejercicioPersonal({ nombre: 'PRUEBA GOOGLE MAPAS (FICT.)' }))
    await page.evaluate(() => window.__mapa2d.setView([-18.25, -69.1], 13, { animate: false }))
    const selector = page.locator('select.sid-base')
    assert.equal(await selector.count(), 1, 'el selector de mapa base está en la barra')
    const ids = await selector.locator('option').evaluateAll((os) => os.map((o) => o.value))
    assert.deepEqual(ids, ['gsat', 'ghib', 'gter', 'g3d', 'sat', 'osm'])
    assert.equal(await page.evaluate(() => Math.round(document.querySelector('.m3d-barra').getBoundingClientRect().height)), 35, 'la barra de la carta sigue en una fila')

    // 🛰️ Google Satélite en la carta 2D.
    await selector.selectOption('gsat')
    await page.waitForTimeout(1500)
    const url2d = await page.evaluate(() => {
      let u = ''
      window.__mapa2d.eachLayer((c) => c._url && (u = c._url))
      return u
    })
    assert.match(url2d, /^https:\/\/tile\.googleapis\.com\/v1\/2dtiles\/\{z\}\/\{x\}\/\{y\}\?session=S-satellite&key=AIza/)
    assert.ok(google.tiles.includes('S-satellite'), 'la carta pidió tiles de Google')
    const atrib = page.locator('.mapa-principal .sid-google-atrib')
    await atrib.waitFor({ state: 'visible' })
    assert.match(await atrib.innerText(), /Google[\s\S]*PRUEBA Maxar/)
    assert.ok(await nadaLaTapa(page, '.mapa-principal .sid-google-atrib'), 'ningún panel tapa «Google» en la carta 2D')
    await page.screenshot({ path: path.join(SALIDAS, '2d-google-satelite.png') })

    // ⛰️ 3D: la imagen de Google sobre el relieve.
    await entrar3D(page)
    const url3d = await page.evaluate(() => window.__map3d.getSource('base').tiles[0])
    assert.match(url3d, /session=S-satellite/)
    await page.locator('.m3d-caja .sid-google-atrib').waitFor({ state: 'visible' })
    assert.ok(await nadaLaTapa(page, '.m3d-caja .sid-google-atrib'), 'ningún panel tapa «Google» en el ⛰️ 3D')
    await page.screenshot({ path: path.join(SALIDAS, '3d-google-satelite.png') })
    await page.locator('select.sid-base').selectOption('gter')
    await page.waitForTimeout(800)
    assert.match(await page.evaluate(() => window.__map3d.getSource('base').tiles[0]), /session=S-terrain-nombres/)
    await salir3D(page)

    // ⛰️ Google Relieve y 🛰️ con nombres en 2D.
    await page.locator('select.sid-base').selectOption('ghib')
    await page.waitForTimeout(1200)
    assert.ok(google.tiles.includes('S-satellite-nombres'))

    // Volver a Esri saca «Google» de la carta.
    await page.locator('select.sid-base').selectOption('sat')
    await page.waitForTimeout(800)
    assert.equal(await page.locator('.mapa-principal .sid-google-atrib').isVisible(), false, 'con Esri no dice Google')

    // Google deja de dar tiles: la carta vuelve sola a Esri y avisa.
    google.falla = true
    await page.locator('select.sid-base').selectOption('gsat')
    await page.evaluate(() => window.__mapa2d.setView([-18.3, -69.0], 14, { animate: false }))
    await page.getByText(/Google no está entregando imágenes/).waitFor({ timeout: 15000 })
    const urlRespaldo = await page.evaluate(() => {
      let u = ''
      window.__mapa2d.eachLayer((c) => c._url && (u = c._url))
      return u
    })
    assert.match(urlRespaldo, /arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery/)
    assert.deepEqual(await page.locator('select.sid-base option').evaluateAll((os) => os.map((o) => o.value)), ['g3d', 'sat', 'osm'], 'sin los mapas de Google en el selector')
    google.falla = false

    // 🏙️ Google 3D: otra pestaña, en el lugar que se miraba.
    const [pestana] = await Promise.all([page.context().waitForEvent('page'), page.locator('select.sid-base').selectOption('g3d')])
    await pestana.waitForLoadState('domcontentloaded')
    const hash = new URL(pestana.url()).hash.slice(1).split(',').map(Number)
    assert.ok(Math.abs(hash[0] - -18.3) < 0.01 && Math.abs(hash[1] - -69.0) < 0.01, 'abre donde se miraba: ' + pestana.url())
    if (CESIUM) {
      await pestana.getByText(/Google no entregó el 3D/).waitFor({ timeout: 30000 })
      assert.ok(google.raiz3d.some((u) => /3dtiles\/root\.json\?key=AIza/.test(u)), 'pidió el 3D realista con la clave')
      await pestana.screenshot({ path: path.join(SALIDAS, 'google-3d.png') })
    } else console.log('  (sin CESIUM_DIR: no se probó el visor 3D)')
    await pestana.close()
    assert.equal(await page.locator('select.sid-base').inputValue(), 'sat', 'abrir el 3D no cambia el mapa base')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('✔ Google en la Mesa: selector, carta 2D, ⛰️ 3D, atribución, respaldo a Esri y 🏙️ Google 3D')
  } finally {
    await cerrar()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
