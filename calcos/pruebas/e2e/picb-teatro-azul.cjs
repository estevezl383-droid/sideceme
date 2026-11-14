// 🔵⚔ FASES AZUL del Teatro (14-11-2026): paso 5 del PICB del Teatro. El CAP propio por fases frente al CAE, las fichas
// azules en la carta (se arrastran y se corrige su texto), los enfrentamientos, la descarga para el Juego de Guerra
// (.json y .kmz) y las hojas «FASES AZUL» y «ENFRENTAMIENTO» de «Imprimir por fases y capas».
//   CARPETA_KMZ=".../KMZ DIAMANTE" PLAYWRIGHT_MODULE=… SIDECEME_CHROMIUM=… node calcos/pruebas/e2e/picb-teatro-azul.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-picb-teatro-azul')
const BOTON = '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)'
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('picb-teatro-azul e2e: sin CARPETA_KMZ, no corre (usa los KMZ DIAMANTE).'); process.exit(0) }
const leer = (n) => ({ name: n, mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(path.join(dir, n)) })
const todos = fs.readdirSync(dir).filter((n) => /\.kmz$/i.test(n)).sort()
const deop = todos.filter((n) => /DEOP|Direcciones Estrat/i.test(n) && !/CAE-\d/i.test(n))
const ejercicio = todos.filter((n) => !deop.includes(n) && !/CAE-\d|Superponer/i.test(n))
// Los KMZ DIAMANTE sólo traen GG.UU. de SATURNO (rojas): las propias van en un KML de prueba (ícono azul).
const AZULES = [['CE-I – Curahuara de Carangas', -68.4, -17.85], ['CE-II – Sabaya', -68.37, -19.0], ['CE-III – Uyuni', -66.83, -20.46], ['CE-IV – Tupiza', -65.72, -21.44], ['CE-V (reserva) – Challapata', -66.78, -18.9]]
const KML_AZUL = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>PRUEBA – GG.UU. propias</name>
<Style id="azul"><IconStyle><color>fff09c4f</color><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_square.png</href></Icon></IconStyle></Style>
${AZULES.map(([n, x, y]) => `<Placemark><name>${n}</name><styleUrl>#azul</styleUrl><Point><coordinates>${x},${y},0</coordinates></Point></Placemark>`).join('\n')}</Document></kml>`
const kmlAzul = { name: 'PRUEBA – GG.UU. propias (azul).kml', mimeType: 'application/vnd.google-earth.kml+xml', buffer: Buffer.from(KML_AZUL) }
const fichas = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(`.leaflet-map-pane ${s}`)].filter((e) => !e.closest('[style*="display: none"]')).map((e) => e.textContent.trim().split(' ')[0]), sel)

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const { page, errores, cerrar } = await abrir({ escalaPantalla: Number(process.env.DPR || 1), ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'DIAMANTE AZUL PRUEBA' : undefined))
  try {
    await sembrarYAbrir(page, { ...ejercicioFicticio({ conPlantilla: false }), nombre: 'DIVISION NORMAL' })
    await page.waitForTimeout(1500)
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: BOTON }).click()])
    await selector.setFiles([...ejercicio.map(leer), kmlAzul])
    await page.waitForFunction(() => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some((b) => /DIAMANTE AZUL PRUEBA/.test(b.textContent)), null, { timeout: 40000 })
    await page.locator('.sidpt-btn').waitFor({ state: 'visible', timeout: 15000 })
    await page.locator('.sidpt-btn').click()
    await page.waitForFunction(() => window.SIDPicbTeatro && window.SIDPicbTeatro.estado().base, null, { timeout: 30000 })
    await page.locator('input.sidpt-file').setInputFiles(deop.map(leer))
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().analisis.length >= 4, null, { timeout: 30000 })
    await page.locator('.sidpt-pasos button[data-n="4"]').click()
    await page.waitForFunction(() => window.SIDPicbTeatro.vista()?.caes?.probable?.fases?.length >= 3, null, { timeout: 20000 })
    await page.waitForTimeout(800)
    assert.equal((await fichas(page, '.sidpt-fch.azul')).length, 0, 'en el paso 4 sólo el rojo')

    // 1 · Paso 5: el CAP azul por fases, frente al CAE-1.
    await page.locator('.sidpt-pasos button[data-n="5"]').click()
    await page.waitForTimeout(800)
    const cap = await page.evaluate(() => { const c = window.SIDPicbTeatro.capAzul(); return c && { fases: c.fases.map((f) => ({ id: f.id, n: f.acciones.length })), enunciado: c.enunciado, frente: c.frente } })
    if (!cap) console.log('  · propias:', JSON.stringify(await page.evaluate(() => { const s = window.SIDPicbTeatro.estado(); return { propias: s.unidades.propias.map((u) => [u.designacion, u.escalon, u.rol]), deop: s.analisis.map((a) => [a.n, a.propias.map((u) => u.designacion)]) } })))
    assert.ok(cap && cap.fases.length === 4, 'CAP azul con 4 fases')
    assert.ok(cap.fases.every((f) => f.n >= 2), 'GG.UU. azules en cada fase: ' + cap.fases.map((f) => f.n).join('/'))
    console.log('  · CAP azul: ' + cap.fases.map((f) => `${f.id} ${f.n} GU`).join(', ') + '\n  · ' + cap.enunciado)
    const azules = await fichas(page, '.sidpt-fch.azul'), rojas = await fichas(page, '.sidpt-fch:not(.azul)')
    assert.equal(azules.length, cap.fases.reduce((s, f) => s + f.n, 0), 'en la carta, todas las fichas azules')
    assert.ok(rojas.length > 0, 'y las rojas del CAE que enfrenta')
    const txt = await page.locator('.sidpt-bd').innerText()
    assert.match(txt, /Enfrentamientos por fase/i)
    assert.match(txt, /⚔/)
    await page.screenshot({ path: path.join(SALIDAS, '1-paso5-todas.png') })
    // 2 · Una sola fase (F-II): sólo sus fichas, rojas y azules.
    await page.locator('input[data-a="azulfase"][value="1"]').check()
    await page.waitForTimeout(700)
    const f2 = await fichas(page, '.sidpt-fch')
    assert.ok(f2.length && f2.every((x) => x === 'F-II'), 'con F-II a la vista, sólo fichas de F-II: ' + [...new Set(f2)].join(','))
    await page.screenshot({ path: path.join(SALIDAS, '2-paso5-F-II.png') })
    // 3 · Arrastrar una ficha azul: queda guardada su posición en esa fase.
    const el = page.locator('.leaflet-map-pane .sidpt-fch.azul').first()
    const caja = await el.boundingBox()
    await page.mouse.move(caja.x + 8, caja.y + caja.height / 2)
    await page.mouse.down()
    await page.mouse.move(caja.x + 80, caja.y + 70, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(900)
    const pos = await page.evaluate(() => window.SIDPicbTeatro.estado().g.capAzul?.pos || {})
    assert.equal(Object.keys(pos).length, 1, 'se guardó la posición movida: ' + JSON.stringify(pos))
    assert.match(Object.keys(pos)[0], /^F-II\|/)
    assert.match(await page.locator('.sidpt-bd').innerText(), /\(movida\)/)
    console.log('  ✓ ficha azul arrastrada: ' + JSON.stringify(pos))
    // 4 · Corregir el texto de una acción azul.
    await page.locator('input[data-a="azulque"]').first().fill('defensa en posición de prueba')
    await page.waitForTimeout(1000)
    const textos = await page.evaluate(() => window.SIDPicbTeatro.estado().g.capAzul?.textos || {})
    assert.ok(Object.values(textos).includes('defensa en posición de prueba'), 'se guardó el texto corregido')
    // 5 · ⚔ Descargar enfrentamiento (.json) y el KMZ rojo y azul.
    const [dj] = await Promise.all([page.waitForEvent('download'), page.locator('.sidpt [data-a="enfjson"]').click()])
    const rutaJ = path.join(SALIDAS, dj.suggestedFilename()); await dj.saveAs(rutaJ)
    const pq = JSON.parse(fs.readFileSync(rutaJ, 'utf8'))
    assert.equal(pq.formato, 'sideceme/enfrentamiento-teatro')
    assert.equal(pq.fases.length, 4)
    assert.ok(pq.unidades.rojo.length >= 4 && pq.unidades.azul.length >= 3, `unidades rojo ${pq.unidades.rojo.length}, azul ${pq.unidades.azul.length}`)
    assert.ok(pq.fases.every((f) => f.rojo.length && f.azul.length), 'cada fase con rojo y azul')
    assert.ok(pq.fases.some((f) => f.enfrentamientos.some((e) => e.contacto)), 'hay choques previstos')
    assert.ok(pq.fases.every((f) => new Set(f.azul.map((x) => x.unidad)).size === f.azul.length), 'cada GU azul una sola vez por fase (no puede estar en dos lugares)')
    const nombresRojo = new Set(pq.unidades.rojo.map((u) => u.designacion))
    const sueltas = pq.fases.flatMap((f) => f.rojo.filter((x) => !nombresRojo.has(x.unidad)).map((x) => x.unidad))
    assert.deepEqual([...new Set(sueltas)], [], 'cada movimiento rojo es una GU del ejercicio')
    assert.ok(pq.fases.some((f) => f.azul.some((x) => /de prueba/.test(x.que))), 'el texto corregido viaja en el .json')
    console.log(`  ✓ ${dj.suggestedFilename()}: ${pq.unidades.rojo.length} GU rojas, ${pq.unidades.azul.length} azules · ` + pq.fases.map((f) => `${f.id} ${f.rojo.length} rojo/${f.azul.length} azul/${f.enfrentamientos.filter((e) => e.contacto).length} choques`).join(' · '))
    const [dk] = await Promise.all([page.waitForEvent('download'), page.locator('.sidpt [data-a="enfkmz"]').click()])
    const rutaK = path.join(SALIDAS, dk.suggestedFilename()); await dk.saveAs(rutaK)
    const K = await import('../../areas-operaciones/abrir-kmz.mjs')
    const z = await K.archivosDelZip(new Uint8Array(fs.readFileSync(rutaK)))
    for (const t of ['FASES ROJO', 'FASES AZUL', 'Enfrentamientos']) assert.ok(z.kmls[0].texto.includes(t), 'el KMZ trae ' + t)
    console.log(`  ✓ ${dk.suggestedFilename()}`)
    // 6 · 🖨️ Hojas FASES AZUL (F-I) y ENFRENTAMIENTO (F-II).
    await page.locator('input[data-a="azulfase"][value=""]').check()
    await page.evaluate(() => window.SIDImpresionFases.abrir())
    const dlg = page.locator('.sidif')
    assert.match(await dlg.innerText(), /FASES AZUL · CAP del Teatro/)
    assert.match(await dlg.innerText(), /ENFRENTAMIENTO/)
    for (const i of await dlg.locator('input[data-curso]').all()) {
      const c = await i.getAttribute('data-curso'), n = await i.getAttribute('data-i')
      const quiero = (c === 'teatro-azul' && n === '0') || (c === 'teatro-ambos' && n === '1')
      if ((await i.isChecked()) !== quiero) await i.click()
    }
    await dlg.locator('[data-carta]').uncheck()
    const [ventana] = await Promise.all([page.waitForEvent('popup', { timeout: 120000 }), dlg.locator('[data-ir]').click()])
    await ventana.waitForSelector('.hoja')
    await ventana.waitForTimeout(800)
    const hojas = await ventana.evaluate(() => [...document.querySelectorAll('.hoja')].map((h) => {
      const vis = [...h.querySelectorAll('.sidpt-fch')].filter((e) => !e.closest('[style*="display: none"]'))
      const f = (az) => vis.filter((e) => e.classList.contains('azul') === az).map((e) => e.textContent.trim().split(' ')[0])
      return { t: h.querySelector('header b').textContent, azul: f(true), rojo: f(false) }
    }))
    assert.equal(hojas.length, 2, 'dos hojas')
    assert.match(hojas[0].t, /CAP azul · F-I/)
    assert.ok(hojas[0].azul.length && hojas[0].azul.every((x) => x === 'F-I') && !hojas[0].rojo.length, 'hoja FASES AZUL F-I: sólo azules de F-I')
    assert.match(hojas[1].t, /contra CAP · F-II/)
    assert.ok(hojas[1].azul.length && hojas[1].rojo.length && [...hojas[1].azul, ...hojas[1].rojo].every((x) => x === 'F-II'), 'hoja ENFRENTAMIENTO F-II: rojas y azules de F-II')
    await ventana.setViewportSize({ width: 1100, height: 900 })
    await ventana.locator('.hoja').nth(1).screenshot({ path: path.join(SALIDAS, '3-hoja-enfrentamiento-F-II.png') })
    console.log('  ✓ hojas: ' + hojas.map((h) => `${h.t.split(' (')[0]} (${h.rojo.length} rojas, ${h.azul.length} azules)`).join(' · '))
    // 7 · Todo vuelve como estaba; en el paso 4, sin azules.
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().capaFase === null)
    await page.locator('.sidpt-pasos button[data-n="4"]').click()
    await page.waitForTimeout(700)
    assert.equal((await fichas(page, '.sidpt-fch.azul')).length, 0, 'de vuelta en el paso 4: sólo rojo')
    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort|ERR_FAILED|net::/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log('picb-teatro-azul e2e: OK')
  } catch (e) {
    try { await page.screenshot({ path: path.join(SALIDAS, 'error.png') }) } catch (x) {}
    throw e
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
