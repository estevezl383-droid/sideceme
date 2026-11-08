// 📌 La Mesa real en Chromium (08-11-2026): las fichas de 🧩 Superponer pasan al ejercicio.
// Sergio superpuso sus fichas (KMZ) y la hoja F2·P3 decía «Todavía no hay nada en el calco»: las
// superpuestas sólo se dibujan. Con «📌 Pasar fichas al ejercicio» se vuelven fichas de la Mesa, en el
// mismo lugar; las que ya están no se repiten (tampoco «DIV MEC -1 – CE-I» si ya está «DIV MEC-1»), en la
// capa dejan de dibujarse, y una segunda pasada no agrega nada.
//   node calcos/pruebas/e2e/pasar-fichas.cjs
//   KMZ="/ruta/060700NOV26.kmz" node calcos/pruebas/e2e/pasar-fichas.cjs   (además, con un KMZ real)
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-pasar')
const AZUL = '#4f9cf0', ROJO = '#e0443a'
const u = (rotulo, lat, lng, escalon, color = AZUL, simbolo = 'inf') => ({ tipo: 'unidad', ll: [lat, lng], simbolo, escalon, rotulo, info: rotulo, color })
const superposicion = {
  tipoArchivo: 'sideceme-superposicion', nombre: 'FICHAS DE PRUEBA',
  grupos: [
    { id: 'azul', nombre: 'Dispositivo azul (5)', visible: true, elementos: [
      u('CE-I', -17.00, -65.00, 'XXX'),
      u('DIV MEC -1 – CE-I', -17.05, -65.02, 'XX', AZUL, 'mec'),
      u('DIV-3 – CE-I', -17.06, -65.10, 'XX'),
      u('DIV MEC-2', -17.08, -65.12, 'XX', AZUL, 'mec'), // ya está en el ejercicio como «DIV MEC -2 – CE-I»
      u('B.I. «ALFA» (FICT.)', -17.20, -65.30, 'II'), // ya está en el ejercicio (en otro lugar): no se repite
    ] },
    { id: 'despliegue', nombre: 'Despliegue (2)', visible: true, elementos: [
      u('DIV-3 – CE-I', -17.06, -65.10, 'XX'), // la misma ficha en otra carpeta
      { tipo: 'unidad', ll: [-17.1, -65.0], simbolo: 'pto', rotulo: 'Cerro Pelado', info: 'punto' },
    ] },
    { id: 'rojo', nombre: 'Enemigo (1)', visible: true, elementos: [u('1ª DIV. BLIND.', -16.90, -64.90, 'XX', ROJO, 'mec')] },
  ],
}
const leerUnidades = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.length && v.every((x) => x && typeof x === 'object' && 'designacion' in x && 'lat' in x) ? v : undefined))

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const ej = ejercicioFicticio({ conPlantilla: false })
  ej.nombre = 'PASAR FICHAS'
  ej.unidades.push({ id: 'ya-divmec2', bando: 'propias', tipo: 'unidad', designacion: 'DIV MEC -2 – CE-I', arma: 'mecanizada', escalon: 'division', lat: -17.3, lng: -65.4 })
  const { page, errores, cerrar } = await abrir({ escalaPantalla: Number(process.env.DPR || 1) })
  const dialogos = []
  page.on('dialog', (d) => { dialogos.push(d.message()); d.accept() })
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await sembrarYAbrir(page, ej)
    const antes = await leerUnidades(page)
    assert.ok(antes && antes.length >= 5, 'fichas del ejercicio: ' + (antes && antes.length))
    const nAntes = antes.length
    await page.locator('.sidsup-btn').click()
    await page.locator('input[type=file][accept*=".kmz"][accept*=".geojson"]').setInputFiles({ name: 'fichas.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(superposicion)) })
    const pasar = page.locator('.sidsup-pasar button[data-a="pasar"]')
    await pasar.waitFor()
    assert.match(await pasar.innerText(), /Pasar 7 fichas/, 'cuenta las 7 fichas (sin el punto)')
    assert.equal(await page.locator('.sidsup-u').count(), 8, '7 fichas + 1 punto dibujados encima')
    await foto('1-superpuestas')
    await pasar.click()
    await page.waitForFunction(() => /pasadas al ejercicio/.test(document.body.innerText), null, { timeout: 10000 })
    await page.waitForTimeout(800)
    const conf = dialogos[dialogos.length - 1]
    assert.match(conf, /Se agregan 4 ficha\(s\): 3 propia\(s\) y 1 enemiga/, conf)
    assert.match(conf, /3 ya están en el ejercicio/, conf)
    const despues = await leerUnidades(page)
    const nuevas = despues.filter((x) => x.origenSuperponer)
    assert.equal(despues.length, nAntes + 4)
    assert.deepEqual(nuevas.map((x) => x.designacion).sort(), ['1ª DIV. BLIND.', 'CE-I', 'DIV MEC -1 – CE-I', 'DIV-3 – CE-I'])
    const ce = nuevas.find((x) => x.designacion === 'CE-I')
    assert.deepEqual([ce.escalon, ce.bando, ce.tipo, ce.lat, ce.lng], ['cuerpo', 'propias', 'unidad', -17, -65])
    const div = nuevas.find((x) => x.designacion === 'DIV MEC -1 – CE-I')
    assert.deepEqual([div.escalon, div.arma], ['division', 'mecanizada'])
    assert.equal(nuevas.find((x) => x.designacion === '1ª DIV. BLIND.').bando, 'enemigo')
    assert.equal(despues.filter((x) => /ALFA/.test(x.designacion)).length, 1, 'ALFA no se repite')
    // En la capa ya no se dibujan (sólo queda el punto); el tablero lo dice.
    assert.equal(await page.locator('.sidsup-u').count(), 1)
    assert.match(await page.locator('.sidsup-pasar').innerText(), /7 ya pasadas/)
    assert.equal(await pasar.count(), 0)
    await foto('2-pasadas')
    // Volver a dibujarlas y pasar otra vez: no agrega nada.
    await page.locator('.sidsup-pasar button[data-a="reponer"]').click()
    assert.equal(await page.locator('.sidsup-u').count(), 8)
    await pasar.click()
    await page.waitForTimeout(800)
    assert.match(dialogos[dialogos.length - 1], /No hay fichas nuevas/)
    assert.equal((await leerUnidades(page)).length, nAntes + 4, 'la segunda pasada no duplica')
    // Quedó guardado en el navegador: al recargar el tablero recuerda las ya pasadas.
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const g = await page.evaluate(() => JSON.parse(localStorage.getItem('sid_superponer_v1')).capas[0].grupos.flatMap((x) => x.elementos).filter((e) => e.pasada).length)
    assert.equal(g, 7)

    if (process.env.KMZ) {
      await sembrarYAbrir(page, { ...ejercicioFicticio({ conPlantilla: false }), nombre: 'PASAR KMZ REAL' })
      const n0 = (await leerUnidades(page)).length
      await page.locator('.sidsup-btn').click()
      await page.locator('.sidsup-capa [data-a="quitar"]').first().click()
      await page.locator('input[type=file][accept*=".kmz"][accept*=".geojson"]').setInputFiles({ name: path.basename(process.env.KMZ), mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(process.env.KMZ) })
      await pasar.waitFor({ timeout: 30000 })
      const txt = await pasar.innerText()
      await pasar.click()
      await page.waitForFunction(() => /pasadas al ejercicio/.test(document.body.innerText), null, { timeout: 15000 })
      await page.waitForTimeout(800)
      const us = await leerUnidades(page)
      const reales = us.filter((x) => x.origenSuperponer)
      console.log(`  · KMZ real: ${txt} → ${reales.length} nuevas (${reales.filter((x) => x.bando === 'enemigo').length} enemigas) · ${dialogos[dialogos.length - 1].split('\n').filter((l) => /ya están/.test(l)).join(' ')}`)
      assert.equal(us.length, n0 + reales.length)
      assert.ok(reales.length > 5)
      for (const r of reales) assert.ok(r.escalon && r.arma && Number.isFinite(r.lat) && Number.isFinite(r.lng), JSON.stringify(r))
      await foto('3-kmz-real')
    }
    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log('pasar-fichas: OK')
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
