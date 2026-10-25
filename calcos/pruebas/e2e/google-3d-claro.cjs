// 🏙️ Google 3D con el plan de barreras abierto (google-mapas/v1), en Chromium y sin red: el volcán sintético de
// google-3d-relieve.cjs servido como el 3D de Google. Sergio (23-10-2026), mirando el plan de barreras en el Google 3D:
// «el medidor ese de relieve no hay o no funciona… las líneas tienen partes blancas… se ve horrible… y la velocidad
// sigue mal».
//   · con un tablero abajo que tapa la parte de abajo de la carta (como el del plan de barreras), la barra del 3D
//     (⛰️ Relieve ×, ⚡ Detalle, ✕ Volver) queda a la vista, por encima del tablero; si el tablero se cierra, baja;
//   · el «Relieve ×» de la barra de arriba de la Mesa (⛰️ 3D) también mueve el relieve del Google 3D;
//   · las líneas con halo blanco (una blanca más ancha debajo, como las de la maniobra) llegan sin el halo: en la
//     captura, donde va la línea punteada negra no hay blanco;
//   · lo puntual (fichas, ⊗, AIN, rótulos) no va «pegado al suelo» (Cesium no lo recalcula con cada tile): su altura
//     se mide cuando la vista termina de cargar y sigue al ⛰️ Relieve ×; áreas y líneas pintan sólo los tiles 3D;
//   · los círculos «C1, C2…» de la carta van con su borde y su número (no como puntos blancos) y al cambiar algo en la
//     carta sólo se rehace lo que cambió (Sergio, 25-10-2026: «esos puntos blancos… las unidades se cuelgan»);
//   · sin errores de consola.
//   CESIUM_DIR=…/package/Build/Cesium node calcos/pruebas/e2e/google-3d-claro.cjs   (de `npm pack cesium@1.145.0`)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, entrar3D } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')
const { prepararVolcan, altura, CUMBRE } = require('./google-3d-relieve.cjs')

const SALIDAS = path.join(__dirname, '..', 'salidas-google-3d-claro')
fs.mkdirSync(SALIDAS, { recursive: true })

async function main() {
  if (!process.env.CESIUM_DIR) {
    console.log('  (sin CESIUM_DIR: no se prueba el visor 3D; ver el encabezado)')
    return
  }
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900, preparar: prepararVolcan() })
  try {
    const [lng, lat] = CUMBRE
    const datos = ejercicioPersonal({ nombre: 'PRUEBA GOOGLE 3D CLARO (FICT.)' })
    datos.ops = {
      ...(datos.ops || {}),
      coordinacion: [{ centro: [lng - 0.03, lat + 0.01], nombre: 'PC 1' }],
      ains: [{ nom: 'AIN-2', centro: [lng + 0.02, lat - 0.02] }],
    }
    await sembrarYAbrir(page, datos)
    await page.evaluate(() => { try { localStorage.removeItem('sid-g3d-relieve'); localStorage.removeItem('sid-g3d-detalle') } catch {} })
    await page.evaluate(([x, y]) => window.__mapa2d.setView([y, x], 12, { animate: false }), CUMBRE)
    // Una línea de la maniobra como las dibuja la carta: halo blanco ancho debajo y la línea punteada negra encima.
    await page.evaluate(([x, y]) => {
      const pts = [[y - 0.05, x - 0.07], [y, x], [y + 0.05, x + 0.07]]
      L.polyline(pts, { color: '#fff', weight: 9, opacity: 0.55, interactive: false }).addTo(window.__mapa2d)
      L.polyline(pts, { color: '#000', weight: 5, dashArray: '11 7', lineCap: 'round' }).addTo(window.__mapa2d)
      L.marker([y + 0.02, x - 0.02], { icon: L.divIcon({ className: '', html: '<div style="color:#000;font:700 13px Arial">OBJ PRUEBA</div>', iconSize: [90, 16] }) }).addTo(window.__mapa2d)
    }, CUMBRE)
    const calco = await page.evaluate(() => SIDGoogle.calcoDeLaCarta())
    const blancas = calco.lineas.filter((l) => /^#fff(fff)?$/i.test(l.color))
    assert.equal(blancas.length, 0, 'el halo blanco no va al 3D: ' + JSON.stringify(blancas.map((l) => l.coords.length)))
    assert.ok(calco.lineas.some((l) => l.color === '#000' && l.guiones), 'la línea punteada negra sí va')
    console.log('  ✔ las líneas llegan sin el halo blanco')

    // ⛰️ 3D de la Mesa y, desde ahí, 🏙️ Google 3D. Un tablero abajo, como el del plan de barreras (alto 300 px).
    await entrar3D(page)
    await page.evaluate(() => {
      const t = document.createElement('div')
      t.id = 'tablero-prueba'
      t.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:300px;z-index:5000;background:#123;color:#fff;font:14px Arial;padding:10px'
      t.textContent = 'PLAN DE BARRERAS (tablero de prueba)'
      document.body.appendChild(t)
    })
    await page.locator('select.sid-base').selectOption('g3d')
    const marco = () => page.frames().find((f) => /3d\.html\?embebido=1/.test(f.url()))
    for (let i = 0; i < 100 && !marco(); i++) await page.waitForTimeout(100)
    const m = marco()
    await m.waitForFunction(() => window.__google3dTiles && window.__calcoDibujado > 0 && window.__google3dRelieve && window.__google3dBarra, null, { timeout: 90000 })
    await page.waitForTimeout(1500)

    // La barra a la vista: arriba del tablero y sin nada encima en sus puntas ni en el ⛰️ Relieve ×.
    const aLaVista = () => page.evaluate(() => {
      const ifr = document.querySelector('.sid-g3d iframe')
      const r = ifr.getBoundingClientRect()
      const d = ifr.contentDocument
      const b = d.querySelector('.barra').getBoundingClientRect()
      const s = d.querySelector('#relieve-x').getBoundingClientRect()
      const puntos = [[b.left + 6, b.top + b.height / 2], [b.right - 6, b.top + b.height / 2], [s.left + s.width / 2, s.top + s.height / 2]]
      return { libre: puntos.every(([x, y]) => document.elementFromPoint(r.left + x, r.top + y) === ifr), abajo: r.top + b.bottom }
    })
    let v = await aLaVista()
    const tablero = await page.evaluate(() => document.getElementById('tablero-prueba').getBoundingClientRect().top)
    assert.ok(v.libre, 'la barra del 3D no la tapa nada')
    assert.ok(v.abajo <= tablero, `la barra queda arriba del tablero (${Math.round(v.abajo)} ≤ ${Math.round(tablero)})`)
    await page.screenshot({ path: path.join(SALIDAS, 'con-tablero.png') })
    console.log('  ✔ con el tablero abierto la barra queda a la vista, arriba de él')
    // Se cierra el tablero: la barra baja (sigue a la vista).
    await page.evaluate(() => document.getElementById('tablero-prueba').remove())
    await page.waitForTimeout(2600)
    const v2 = await aLaVista()
    await page.screenshot({ path: path.join(SALIDAS, 'sin-tablero.png') })
    assert.ok(v2.libre && v2.abajo > tablero + 100, `sin el tablero la barra baja: ${Math.round(v2.abajo)}`)
    console.log('  ✔ sin el tablero la barra baja')

    // El «Relieve ×» de la Mesa (arriba) mueve el del Google 3D.
    const mesa = page.locator('label.m3d-des input[type=range]').first()
    assert.match(await page.locator('label.m3d-des').first().getAttribute('title'), /^Exageración vertical/)
    await mesa.fill('3.8')
    await m.waitForFunction(() => window.__google3dRelieve.x === 3.8, null, { timeout: 5000 })
    assert.equal(await m.evaluate(() => window.__google3d.scene.verticalExaggeration), 3.8)
    assert.equal((await m.locator('#relieve-val').innerText()).trim(), '3.8')
    console.log('  ✔ el «Relieve ×» de la Mesa mueve el del Google 3D (×3.8)')

    // Lo puntual: sin CLAMP_TO_GROUND, a la altura medida (estirada con ×3.8, relativo a la cota del centro).
    await m.waitForFunction(() => window.__google3dAlturas > 0, null, { timeout: 30000 })
    await page.waitForTimeout(1500)
    const puntual = await m.evaluate(() => {
      const C = window.Cesium, v = window.__google3d
      const ents = v.dataSources.get(0).entities.values
      const t = C.JulianDate.now()
      const g = (e) => e.billboard || e.label || e.point
      return {
        clamp: ents.filter((e) => g(e) && g(e).heightReference && g(e).heightReference.getValue(t) !== C.HeightReference.NONE).length,
        clases: [...new Set(ents.filter((e) => e.polyline || e.polygon).map((e) => (e.polyline || e.polygon).classificationType.getValue(t)))],
        tiles: C.ClassificationType.CESIUM_3D_TILE,
        cota: window.__google3dRelieve.cota,
        x: v.scene.verticalExaggeration,
        alturas: ents.filter((e) => e.sidLL).map((e) => ({ ll: e.sidLL, h: C.Cartographic.fromCartesian(e.position.getValue(t)).height })),
      }
    })
    assert.equal(puntual.clamp, 0, 'nada puntual pegado al suelo')
    assert.deepEqual(puntual.clases, [puntual.tiles], 'áreas y líneas pintan sólo los tiles 3D')
    // Los del volcán (el ⊗, el AIN y el rótulo puestos acá; las fichas del ejercicio quedan fuera del tileset de prueba).
    const enElVolcan = puntual.alturas.filter((a) => Math.abs(a.ll[0] - lng) < 0.05 && Math.abs(a.ll[1] - lat) < 0.05)
    assert.ok(enElVolcan.length >= 3, 'el ⊗, el AIN y el rótulo: ' + enElVolcan.length)
    for (const a of enElVolcan) {
      const esperado = puntual.cota + puntual.x * (altura(...a.ll) - puntual.cota) + 2
      assert.ok(Math.abs(a.h - esperado) < 150, `${a.ll}: a ${Math.round(a.h)} m, se esperaba ${Math.round(esperado)} m`)
    }
    console.log('  ✔ fichas y rótulos a la altura del terreno (medida una vez, estirada con el relieve), sin pegarse al suelo')

    // En el 3D ninguna línea es blanca (el halo no llegó) y la punteada negra está, con sus guiones.
    const lineas3d = await m.evaluate(() => {
      const C = window.Cesium, t = C.JulianDate.now()
      return window.__google3d.dataSources.get(0).entities.values.filter((e) => e.polyline).map((e) => {
        const mat = e.polyline.material
        const c = mat.color ? mat.color.getValue(t) : mat.getValue(t)
        return { blanca: c.red > 0.95 && c.green > 0.95 && c.blue > 0.95, negra: c.red < 0.05 && c.green < 0.05 && c.blue < 0.05, guiones: mat instanceof C.PolylineDashMaterialProperty }
      })
    })
    assert.equal(lineas3d.filter((l) => l.blanca).length, 0, 'ninguna línea blanca en el 3D')
    assert.ok(lineas3d.some((l) => l.negra && l.guiones), 'la punteada negra está, con guiones')
    await m.evaluate(([x, y, h]) => {
      const C = window.Cesium, v = window.__google3d
      v.camera.setView({ destination: C.Cartesian3.fromDegrees(x, y, h + 14000), orientation: { heading: 0, pitch: C.Math.toRadians(-90), roll: 0 } })
      v.scene.requestRender()
    }, [lng, lat, puntual.cota])
    await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(SALIDAS, 'linea-sin-halo.png') })
    console.log('  ✔ en el 3D la punteada negra va sin el halo blanco')

    // Un círculo «C1» de la carta (blanco con el borde de color y su número, como los de la Mesa): en el 3D va con su
    // borde y su número, no como un punto blanco (Sergio, 25-10-2026: «esos puntos blancos»). Y al cambiar algo en la
    // carta (como al tocar otra fase de un CAP) sólo se rehace lo que cambió: lo demás queda como estaba («las unidades
    // se cuelgan y desaparecen… no es fluido»); después se sigue dibujando hasta que todo esté listo.
    const idsAntes = await m.evaluate(() => window.__google3d.dataSources.get(0).entities.values.map((e) => e.id))
    const listosAntes = await m.evaluate(() => window.__google3dListo || 0)
    const enviadosAntes = await page.evaluate(() => SIDGoogle.enviados3D())
    await page.evaluate(([x, y]) => {
      window.__c1 = L.circleMarker([y - 0.02, x + 0.02], { radius: 11, color: '#7c3aed', weight: 2.5, fillColor: '#fff', fillOpacity: 1 })
        .bindTooltip('C1', { permanent: true, direction: 'center', className: 'sin-fondo' })
        .addTo(window.__mapa2d)
    }, CUMBRE)
    const calcoC1 = await page.evaluate(() => SIDGoogle.calcoDeLaCarta())
    const c1 = calcoC1.puntos.find((p) => p.texto === 'C1')
    assert.ok(c1 && c1.borde === '#7c3aed' && c1.color === '#fff', 'el C1 con su número y su borde: ' + JSON.stringify(c1))
    assert.ok(!calcoC1.rotulos.some((r) => r.texto === 'C1'), 'el número va adentro del círculo, no como rótulo aparte')
    await page.waitForFunction((n) => SIDGoogle.enviados3D() > n, enviadosAntes, { timeout: 10000 })
    await m.waitForFunction((n) => (window.__google3dListo || 0) > n, listosAntes, { timeout: 30000 })
    const conC1 = await m.evaluate((antes) => {
      const ents = window.__google3d.dataSources.get(0).entities.values
      const nuevas = ents.filter((e) => !antes.includes(e.id))
      return { quedan: ents.filter((e) => antes.includes(e.id)).length, nuevas: nuevas.map((e) => ({ billboard: !!e.billboard, point: !!e.point, img: e.billboard ? String(e.billboard.image.getValue()).slice(0, 22) : '' })) }
    }, idsAntes)
    assert.equal(conC1.quedan, idsAntes.length, 'lo que ya estaba dibujado no se rehízo')
    assert.deepEqual(conC1.nuevas, [{ billboard: true, point: false, img: 'data:image/png;base64,' }], 'el C1 es un círculo dibujado (con borde y número), no un punto')
    await page.evaluate(() => window.__c1.remove())
    await m.waitForFunction((n) => window.__google3d.dataSources.get(0).entities.values.length === n, idsAntes.length, { timeout: 10000 })
    console.log('  ✔ los «C1» con su borde y su número; al cambiar la carta sólo se rehace lo que cambió')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('✔ Google 3D claro: barra a la vista con el tablero, el Relieve × de la Mesa, sin halos blancos y lo puntual sin pegarse al suelo')
  } finally {
    await cerrar()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
