// 💾 El autoguardado y su sello (calcos/guardado/v1) en la Mesa real (Chromium), como está
// publicada: el ejercicio se guarda en SIDECEME (calco-ops, acá uno de mentira: servidor-falso.js).
//   · al abrir el ejercicio el sello termina en «✓ guardado HH:MM:SS»;
//   · mover una ficha → «● sin guardar» → se guarda solo en ~2,5 s, con la ficha en su lugar nuevo;
//   · tocar el sello guarda en ese momento, aunque no haya cambios; Ctrl+S también;
//   · si el servidor falla, el sello dice «⚠️ no se guardó · reintentar» con el motivo, y al
//     volver el servidor, tocarlo guarda;
//   · cerrar o recargar con algo sin guardar: el navegador pregunta y lo pendiente se manda;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/autoguardado.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso.js')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-guardado')
fs.mkdirSync(SALIDAS, { recursive: true })

;(async () => {
  const datos = ejercicioFicticio({ conPlantilla: false })
  datos.nombre = 'FABBLE 1.0'
  const calcos = [{ id: 'id-0', nombre: 'FABBLE 1.0', payload: datos, actualizado_en: new Date().toISOString() }]
  const log = []
  let srv
  const { page, errores, cerrar } = await abrir({
    ancho: 2000,
    alto: 1290,
    preparar: async (p) => {
      srv = await servidorFalso(p, calcos, log)
    },
  })
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push(d.type())
    d.accept()
  })
  const sello = page.locator('.sello-guardado').first()
  const guardados = () => log.filter((l) => l.accion === 'guardar').length
  const estado = () => sello.getAttribute('data-estado')
  const esperarEstado = async (e, ms = 8000) => {
    const t0 = Date.now()
    while ((await estado()) !== e) {
      if (Date.now() - t0 > ms) throw new Error(`el sello no llegó a «${e}»: está en «${await estado()}» (${await sello.innerText()})`)
      await page.waitForTimeout(100)
    }
  }
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png'), clip: { x: 360, y: 40, width: 900, height: 200 } })
  try {
    await abrirDelServidor(page, 'FABBLE 1.0')
    await esperarEstado('al-dia')
    assert.match(await sello.innerText(), /^✓ guardado \d\d:\d\d:\d\d/, 'la hora con segundos')
    assert.equal(guardados(), 1, 'al abrir se guarda una vez')
    assert.equal(await sello.evaluate((b) => b.tagName), 'BUTTON', 'el sello es un botón')
    assert.equal(await sello.evaluate((b) => b.parentElement.parentElement.classList.contains('botones-mapa')), true, 'sigue en la barra')
    assert.equal(await sello.evaluate((b) => b.getAttribute('data-sid-g')), null, 'la piel Pandora no lo reparte entre los botones')
    await foto('1-al-dia')

    // Mover una ficha: «sin guardar» y se guarda solo, con la ficha en su lugar nuevo.
    const ficha = page.locator('.leaflet-marker-icon').first()
    const b = await ficha.boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width / 2 + 80, b.y + b.height / 2 + 50, { steps: 8 })
    await page.mouse.up()
    await esperarEstado('pendiente', 2000)
    assert.match(await sello.innerText(), /sin guardar/)
    await foto('2-sin-guardar')
    await esperarEstado('al-dia', 6000)
    assert.equal(guardados(), 2, 'se guardó solo')
    const antes = datos.unidades.map((u) => `${u.lat},${u.lng}`).sort().join('|')
    const ahora = calcos[0].payload.unidades.map((u) => `${u.lat},${u.lng}`).sort().join('|')
    assert.notEqual(ahora, antes, 'en el servidor la ficha está en su lugar nuevo')

    // Tocar el sello guarda YA, aunque no haya cambios; Ctrl+S también.
    await page.waitForTimeout(1100)
    const h0 = await sello.innerText()
    await sello.click()
    await esperarEstado('al-dia')
    await page.waitForTimeout(200)
    assert.equal(guardados(), 3, 'el clic guardó')
    assert.notEqual(await sello.innerText(), h0, 'la hora cambió')
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(600)
    assert.equal(guardados(), 4, 'Ctrl+S guardó')

    // El servidor falla: el sello lo dice; cuando vuelve, tocarlo guarda.
    srv.fallar(true)
    await sello.click()
    await esperarEstado('error')
    assert.match(await sello.innerText(), /no se guardó/)
    assert.match(await sello.getAttribute('title'), /El servidor no responde/)
    await foto('3-error')
    srv.fallar(false)
    await sello.click()
    await esperarEstado('al-dia')
    assert.equal(calcos[0].payload.nombre, 'FABBLE 1.0')

    // Recargar con un cambio sin guardar: el navegador pregunta y lo pendiente se manda.
    const ficha2 = page.locator('.leaflet-marker-icon').nth(1)
    const b2 = await ficha2.boundingBox()
    await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2)
    await page.mouse.down()
    await page.mouse.move(b2.x + b2.width / 2 - 70, b2.y + b2.height / 2 + 40, { steps: 8 })
    await page.mouse.up()
    await esperarEstado('pendiente', 2000)
    const n = guardados()
    await page.reload({ waitUntil: 'domcontentloaded' })
    assert.ok(dialogos.includes('beforeunload'), 'preguntó antes de salir')
    assert.ok(guardados() > n, 'mandó lo pendiente al salir')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('autoguardado e2e OK')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'ERROR.png') }).catch(() => {})
    console.error('errores de consola:', errores)
    throw e
  } finally {
    await cerrar()
  }
})()
