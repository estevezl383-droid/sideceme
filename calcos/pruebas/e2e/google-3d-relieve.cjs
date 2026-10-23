// 🏙️ Google 3D: ⛰️ Relieve ×, ⚡ Detalle y el calco que no se rehace si no cambió (google-mapas/v1), en Chromium y sin red.
// Sergio (23-10-2026): «para navegar está muy lenta, muy lenta… lo mejor es trabajar en 3D… ¿en Google Earth se le
// puede dar la misma opción [que el «Relieve ×5.0» del ⛰️ 3D] para aumentar el relieve?».
// En vez del 3D de Google (pide la clave real) se sirve un tileset con un volcán de 1.200 m sobre la puna (4.000 m):
//   · el relieve se activa cuando se conoce la cota del centro, arranca en ×2 y llega a ×5; la cumbre sube lo que
//     tiene que subir (relativo a la cota del centro) y el centro no se mueve;
//   · lo elegido (relieve, detalle) queda para la próxima vez; ⚡ Detalle cambia el error en pantalla de los tiles;
//   · el calco (una línea y un área sobre el volcán) se sigue viendo con el relieve estirado (capturas);
//   · las líneas de muchos puntos llegan simplificadas; si la carta vuelve a dibujar lo mismo, el 3D no lo rehace;
//   · sin errores de consola.
//   CESIUM_DIR=…/package/Build/Cesium node calcos/pruebas/e2e/google-3d-relieve.cjs   (de `npm pack cesium@1.145.0`)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-google-3d-relieve')
fs.mkdirSync(SALIDAS, { recursive: true })
const CESIUM = process.env.CESIUM_DIR
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64')

// ── El terreno de prueba: una malla de 81×81 puntos con un volcán, en un glTF (y arriba) dentro de un tileset ──
const O = -68.45, E = -68.15, S = -17.25, N = -16.95
const CUMBRE = [-68.3, -17.1]
const BASE = 4000, ALTO = 1200
const altura = (lng, lat) => {
  const dx = (lng - CUMBRE[0]) * 106, dy = (lat - CUMBRE[1]) * 110.6 // km
  return BASE + ALTO * Math.exp(-(dx * dx + dy * dy) / (2 * 3.2 * 3.2))
}
function ecef(lng, lat, h) {
  const a = 6378137, e2 = 6.69437999014e-3
  const f = (lat * Math.PI) / 180, l = (lng * Math.PI) / 180
  const n = a / Math.sqrt(1 - e2 * Math.sin(f) ** 2)
  return [(n + h) * Math.cos(f) * Math.cos(l), (n + h) * Math.cos(f) * Math.sin(l), (n * (1 - e2) + h) * Math.sin(f)]
}
function tileset() {
  const K = 81
  const centro = ecef((O + E) / 2, (S + N) / 2, BASE)
  const pos = new Float32Array(K * K * 3), col = new Float32Array(K * K * 4)
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) {
    const lng = O + ((E - O) * i) / (K - 1), lat = S + ((N - S) * j) / (K - 1), h = altura(lng, lat)
    const p = ecef(lng, lat, h).map((v, k) => v - centro[k])
    const y = [p[0], p[2], -p[1]] // glTF va con Y arriba: Cesium lo gira a Z arriba
    const k = (j * K + i) * 3
    for (let c = 0; c < 3; c++) { pos[k + c] = y[c]; min[c] = Math.min(min[c], y[c]); max[c] = Math.max(max[c], y[c]) }
    const t = (h - BASE) / ALTO
    col.set([0.35 + 0.55 * t, 0.3 + 0.35 * t, 0.22 + 0.2 * t, 1], (j * K + i) * 4)
  }
  const idx = []
  for (let j = 0; j < K - 1; j++) for (let i = 0; i < K - 1; i++) {
    const a = j * K + i, b = a + 1, c = a + K, d = c + 1
    idx.push(a, b, d, a, d, c)
  }
  const ind = new Uint16Array(idx)
  const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(col.buffer), Buffer.from(ind.buffer)])
  const gltf = {
    asset: { version: '2.0' },
    extensionsUsed: ['KHR_materials_unlit'],
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, COLOR_0: 1 }, indices: 2, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] }, extensions: { KHR_materials_unlit: {} } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.byteLength, target: 34962 },
      { buffer: 0, byteOffset: pos.byteLength, byteLength: col.byteLength, target: 34962 },
      { buffer: 0, byteOffset: pos.byteLength + col.byteLength, byteLength: ind.byteLength, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: K * K, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: K * K, type: 'VEC4' },
      { bufferView: 2, componentType: 5123, count: ind.length, type: 'SCALAR' },
    ],
  }
  const relleno = (b, c) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4, c)])
  const json = relleno(Buffer.from(JSON.stringify(gltf)), 0x20)
  const binP = relleno(bin, 0)
  const trozo = (b, tipo) => { const h = Buffer.alloc(8); h.writeUInt32LE(b.length, 0); h.writeUInt32LE(tipo, 4); return Buffer.concat([h, b]) }
  const cuerpo = Buffer.concat([trozo(json, 0x4e4f534a), trozo(binP, 0x004e4942)])
  const cab = Buffer.alloc(12)
  cab.writeUInt32LE(0x46546c67, 0); cab.writeUInt32LE(2, 4); cab.writeUInt32LE(12 + cuerpo.length, 8)
  const glb = Buffer.concat([cab, cuerpo])
  const r = (g) => (g * Math.PI) / 180
  const raiz = {
    asset: { version: '1.1' }, geometricError: 5000,
    root: {
      boundingVolume: { region: [r(O), r(S), r(E), r(N), BASE - 50, BASE + ALTO + 50] }, geometricError: 0, refine: 'REPLACE',
      transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, centro[0], centro[1], centro[2], 1],
      content: { uri: 'malla.glb' },
    },
  }
  return { raiz, glb }
}

// Google simulado con el volcán como 3D realista, CesiumJS local y Esri liso (sin red). Lo usa también google-3d-claro.cjs.
function prepararVolcan() {
  const T = tileset()
  return async (page) => {
    await page.route(/^https:\/\/tile\.googleapis\.com\//, (r) => {
      const u = new URL(r.request().url())
      if (u.pathname === '/v1/createSession') {
        const p = JSON.parse(r.request().postData() || '{}')
        return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session: 'S-' + p.mapType, expiry: String(Math.floor(Date.now() / 1000) + 14 * 86400), tileWidth: 256, tileHeight: 256, imageFormat: 'png' }) })
      }
      if (u.pathname.startsWith('/v1/2dtiles/')) return r.fulfill({ status: 200, contentType: 'image/png', body: PNG })
      if (u.pathname.endsWith('/malla.glb')) return r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: T.glb })
      if (u.pathname.startsWith('/v1/3dtiles/')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(T.raiz) })
      if (u.pathname === '/tile/v1/viewport') return r.fulfill({ status: 200, contentType: 'application/json', body: '{"copyright":"PRUEBA","maxZoomRects":[]}' })
      return r.fulfill({ status: 404 })
    })
    await page.route(/cdn\.jsdelivr\.net\/npm\/cesium@1\.145\.0\/Build\/Cesium\//, (r) => {
      const rel = decodeURIComponent(new URL(r.request().url()).pathname.split('/Build/Cesium/')[1])
      const f = path.join(CESIUM, rel)
      if (!fs.existsSync(f)) return r.fulfill({ status: 404 })
      const tipo = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream'
      return r.fulfill({ status: 200, contentType: tipo, body: fs.readFileSync(f) })
    })
    // Satélite de Esri: liso (no hay red).
    await page.route(/server\.arcgisonline\.com/, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }))
  }
}

async function main() {
  if (!CESIUM) {
    console.log('  (sin CESIUM_DIR: no se prueba el visor 3D; ver el encabezado)')
    return
  }
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900, preparar: prepararVolcan() })
  try {
    await sembrarYAbrir(page, ejercicioPersonal({ nombre: 'PRUEBA GOOGLE 3D RELIEVE (FICT.)' }))
    await page.evaluate(([lng, lat]) => window.__mapa2d.setView([lat, lng], 12, { animate: false }), CUMBRE)
    // El calco sobre el volcán: una línea que lo cruza por la cumbre (con 400 puntos, como un camino de OSM) y un área en su falda.
    await page.evaluate(([lng, lat]) => {
      const pts = Array.from({ length: 400 }, (_, i) => [lat - 0.06 + (0.12 * i) / 399, lng - 0.08 + (0.16 * i) / 399 + 0.00001 * Math.sin(i)])
      window.__lineaPrueba = L.polyline(pts, { color: '#ff0000', weight: 5 }).addTo(window.__mapa2d)
      L.polygon([[lat + 0.01, lng + 0.01], [lat + 0.04, lng + 0.01], [lat + 0.04, lng + 0.05], [lat + 0.01, lng + 0.05]], { color: '#0050ff', weight: 3, fillOpacity: 0.4 }).addTo(window.__mapa2d)
    }, CUMBRE)
    const calco = await page.evaluate(() => SIDGoogle.calcoDeLaCarta())
    const larga = calco.lineas.find((l) => l.color === '#ff0000')
    assert.ok(larga && larga.coords.length >= 2 && larga.coords.length < 40, 'la línea de 400 puntos llega simplificada: ' + (larga && larga.coords.length))

    await page.evaluate(() => { try { localStorage.removeItem('sid-g3d-relieve'); localStorage.removeItem('sid-g3d-detalle') } catch {} })
    await page.locator('select.sid-base').selectOption('g3d')
    const marco = () => page.frames().find((f) => /3d\.html\?embebido=1/.test(f.url()))
    for (let i = 0; i < 100 && !marco(); i++) await page.waitForTimeout(100)
    const m = marco()
    await m.waitForFunction(() => window.__google3dTiles && window.__calcoDibujado > 0 && window.__google3dRelieve, null, { timeout: 90000 })
    const rel = await m.evaluate(() => ({ ...window.__google3dRelieve, ve: window.__google3d.scene.verticalExaggeration, vr: window.__google3d.scene.verticalExaggerationRelativeHeight, rr: window.__google3d.scene.requestRenderMode, sse: window.__google3dTiles.maximumScreenSpaceError, det: window.__google3dDetalle.id }))
    assert.equal(rel.x, 2, 'arranca en ×2')
    assert.equal(rel.ve, 2)
    assert.ok(Math.abs(rel.cota - altura(...CUMBRE)) < 60, 'la cota es la de la cumbre del centro: ' + rel.cota)
    assert.equal(rel.vr, rel.cota, 'se estira relativo a la cota del centro')
    assert.equal(rel.rr, true, 'dibuja sólo cuando algo cambia')
    assert.equal(rel.det, 'normal')
    assert.equal(rel.sse, 32, '⚡ Detalle normal: error en pantalla 32 (Cesium usa 16)')
    assert.equal(await m.locator('#relieve-x').isDisabled(), false)

    const altoEn = (lng, lat) => m.evaluate(async ([x, y]) => {
      const C = window.Cesium
      const [c] = await window.__google3d.scene.sampleHeightMostDetailed([C.Cartographic.fromDegrees(x, y)])
      return c.height
    }, [lng, lat])
    // Mirarlo de costado, con la línea cruzando la cumbre.
    const deCostado = () => m.evaluate(([x, y, h]) => {
      const C = window.Cesium, v = window.__google3d
      v.camera.lookAt(C.Cartesian3.fromDegrees(x, y, h), new C.HeadingPitchRange(C.Math.toRadians(20), C.Math.toRadians(-12), 26000))
      v.camera.lookAtTransform(C.Matrix4.IDENTITY)
      v.scene.requestRender()
    }, [...CUMBRE, rel.cota])
    await deCostado()
    await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(SALIDAS, 'relieve-x2.png') })

    // ×5 con el deslizador.
    await m.locator('#relieve-x').fill('5')
    await m.locator('#relieve-x').dispatchEvent('change')
    assert.equal(await m.evaluate(() => window.__google3d.scene.verticalExaggeration), 5)
    assert.equal((await m.locator('#relieve-val').innerText()).trim(), '5.0')
    await deCostado()
    await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(SALIDAS, 'relieve-x5.png') })
    // Un punto en la falda, 6 km al sur de la cumbre: con ×5 queda 5 veces más arriba (o abajo) de la cota del centro.
    const falda = [CUMBRE[0], CUMBRE[1] - 0.055]
    const hFalda = await altoEn(...falda)
    const esperado = rel.cota + 5 * (altura(...falda) - rel.cota)
    assert.ok(Math.abs(hFalda - esperado) < 120, `con ×5 la falda va a ${Math.round(esperado)} m y está en ${Math.round(hFalda)} m`)

    // Desde arriba, con ×5: la línea roja cruza el volcán entera (de la llanura a la cumbre y a la otra llanura) y el
    // área azul está en su falda. Se cuentan los píxeles rojos y azules en la captura.
    const desdeArriba = () => m.evaluate(([x, y, h]) => {
      const C = window.Cesium, v = window.__google3d
      v.camera.setView({ destination: C.Cartesian3.fromDegrees(x, y, h + 30000), orientation: { heading: 0, pitch: C.Math.toRadians(-90), roll: 0 } })
      v.scene.requestRender()
    }, [...CUMBRE, rel.cota])
    await desdeArriba()
    await page.waitForTimeout(2500)
    const arriba = await page.screenshot({ path: path.join(SALIDAS, 'relieve-x5-desde-arriba.png') })
    const colores = await page.evaluate(async (b64) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0)
      // Sólo la carta (sin los paneles de la Mesa ni la barra del 3D).
      const d = g.getImageData(330, 300, 840, 420).data
      let rojo = 0, azul = 0
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 180 && d[i + 1] < 70 && d[i + 2] < 70) rojo++
        if (d[i + 2] > 150 && d[i] < 90 && d[i + 1] < 140) azul++
      }
      return { rojo, azul }
    }, arriba.toString('base64'))
    assert.ok(colores.rojo > 900, 'la línea roja se ve entera con ×5: ' + colores.rojo + ' px')
    assert.ok(colores.azul > 1500, 'el área azul se ve con ×5: ' + colores.azul + ' px')
    console.log('  desde arriba con ×5:', colores)

    // ×1 lo deja como es.
    await m.locator('#relieve-x').fill('1')
    await m.locator('#relieve-x').dispatchEvent('change')
    assert.equal(await m.evaluate(() => window.__google3d.scene.verticalExaggeration), 1)
    await deCostado()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(SALIDAS, 'relieve-x1.png') })
    await m.locator('#relieve-x').fill('5')
    await m.locator('#relieve-x').dispatchEvent('change')

    // ⚡ Detalle fluido.
    await m.locator('#detalle').selectOption('fluido')
    assert.equal(await m.evaluate(() => window.__google3dTiles.maximumScreenSpaceError), 48)
    assert.equal(await m.evaluate(() => window.__google3d.resolutionScale), 0.6)

    // La carta vuelve a dibujar lo mismo: el 3D no lo rehace. Si cambia (se apaga la línea), sí.
    const enviados = await page.evaluate(() => SIDGoogle.enviados3D())
    await page.evaluate(() => { const c = L.circleMarker([0, 0], { radius: 1 }); c.addTo(window.__mapa2d); c.remove() })
    await page.waitForTimeout(1500)
    assert.equal(await page.evaluate(() => SIDGoogle.enviados3D()), enviados, 'lo mismo no se vuelve a mandar')
    const antes = await m.evaluate(() => window.__calcoDibujado)
    await page.evaluate(() => window.__lineaPrueba.remove())
    await m.waitForFunction((n) => window.__calcoDibujado < n, antes, { timeout: 10000 })

    // ✕ Volver y abrir otra vez: se acuerda de ×5 y de «Fluido».
    await page.frameLocator('.sid-g3d iframe').getByRole('button', { name: /Volver a la carta/ }).click()
    await page.waitForTimeout(500)
    await page.locator('select.sid-base').selectOption('g3d')
    for (let i = 0; i < 100 && (!marco() || marco() === m); i++) await page.waitForTimeout(100)
    await marco().waitForFunction(() => window.__google3dRelieve, null, { timeout: 90000 })
    assert.equal(await marco().evaluate(() => window.__google3dRelieve.x), 5, 'se acuerda del relieve')
    assert.equal(await marco().evaluate(() => window.__google3dDetalle.id), 'fluido', 'se acuerda del detalle')
    await page.screenshot({ path: path.join(SALIDAS, 'barra.png'), clip: { x: 300, y: 700, width: 800, height: 200 } })

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('✔ Google 3D: ⛰️ Relieve × (×2 al abrir, hasta ×5, relativo a la cota del centro), ⚡ Detalle, el calco simplificado y sin rehacer lo mismo')
  } finally {
    await cerrar()
  }
}

module.exports = { prepararVolcan, altura, CUMBRE }

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
