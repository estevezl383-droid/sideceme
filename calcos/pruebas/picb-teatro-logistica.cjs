// 🚚 LOGÍSTICA Y REEMPLAZOS del Teatro (15-11-2026): paso 6 del PICB del Teatro. Sobre las FASES AZUL: BL, Sección
// Base, Sección Especial, una Sección Avanzada por CE y Batallón de Reemplazos en la carta (se arrastran), tablas de
// niveles, apoyo por fase, bajas y reemplazos; el .json del Juego de Guerra CON logística, el KMZ del calco y las hojas
// «🌎 APOYO LOGÍSTICO» de «Imprimir por fases y capas».
//   CARPETA_KMZ=".../KMZ DIAMANTE" PLAYWRIGHT_MODULE=… SIDECEME_CHROMIUM=… [DPR=2] node calcos/pruebas/e2e/picb-teatro-logistica.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-picb-teatro-logistica')
const BOTON = '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)'
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('picb-teatro-logistica e2e: sin CARPETA_KMZ, no corre (usa los KMZ DIAMANTE).'); process.exit(0) }
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

    // 1 · Paso 5 (las FASES AZUL) y paso 6 (la logística).
    await page.locator('.sidpt-pasos button[data-n="5"]').click()
    await page.waitForFunction(() => window.SIDPicbTeatro.capAzul()?.fases?.length === 4, null, { timeout: 20000 })
    await page.locator('.sidpt-pasos button[data-n="6"]').click()
    await page.waitForFunction(() => window.SIDPicbTeatro.logistica()?.fases?.length === 4, null, { timeout: 30000 })
    await page.waitForTimeout(900)
    const plan = await page.evaluate(() => { const p = window.SIDPicbTeatro.logistica(); return { inst: p.instalaciones.map((x) => [x.tipo, x.nombre, x.de, x.km, !!x.ferro]), se: p.se.map((s) => s.lugar), bl: p.bl.lugar, sb: p.sb.lugar, br: [p.br.cias, p.br.reserva], dma: [p.dmaGu, p.dmaSec], avisos: p.avisos } })
    for (const x of plan.inst) console.log(`  · ${x[0]} ${x[1]}${x[2] ? ` ← ${x[2]} ${x[3]} km` : ''}${x[4] ? ' 🚆' : ''}`)
    assert.match(plan.sb, /Oruro/, 'Sección Base en Oruro')
    assert.equal(plan.inst.filter((x) => x[0] === 'SA').length, 5, 'una SA por CE')
    assert.ok(plan.se.length >= 1, 'TO extenso: Sección Especial')
    assert.deepEqual(plan.dma, [80, 120])
    const marcas = await page.evaluate(() => [...document.querySelectorAll('.leaflet-map-pane .sidpt-fch')].filter((e) => !e.closest('[style*="display: none"]')).map((e) => e.textContent.trim()))
    const log = marcas.filter((t) => /^(🏭|📦|🚚|👥)/.test(t))
    assert.ok(log.length >= 9, 'en la carta las instalaciones: ' + log.length)
    assert.ok(marcas.some((t) => /^◆/.test(t)), 'y la logística probable del enemigo')
    const txt = await page.locator('.sidpt-bd').innerText()
    for (const r of [/Organización logística del teatro/i, /Concepto de apoyo logístico/i, /quién apoya a quién/i, /Personal y reemplazos/i, /Niveles de abastecimiento/i, /Batallón de Reemplazos/i]) assert.match(txt, r)
    await page.screenshot({ path: path.join(SALIDAS, '1-paso6-F-I.png') })
    console.log(`  ✓ paso 6: BL ${plan.bl} · SB ${plan.sb} · SE ${plan.se.join(', ')} · BR ${plan.br[0]} Cías (${plan.br[1]}) · ${log.length} instalaciones en la carta`)

    // 2 · El G-4 corrige: mueve una SA (en la F-II), cambia la capacidad de la SB y los efectivos de un CE.
    await page.locator('input[data-a="logfase"][value="1"]').check(); await page.waitForTimeout(800)
    // (se agarra la primera Sección Avanzada que esté a la vista: el panel o una ficha pueden tapar otras)
    const ag = await page.evaluate(() => { const fs = [...document.querySelectorAll('.leaflet-map-pane .sidpt-fch')].filter((f) => /CLSA/.test(f.textContent))
      for (const f of fs) { const r = f.getBoundingClientRect(), x = r.left + 10, y = r.top + r.height / 2, e = document.elementFromPoint(x, y); if (e && e.closest('.sidpt-fch') === f) return { x, y, t: f.textContent.trim() } }
      return { x: null, n: fs.length } })
    assert.ok(ag.x != null, 'una SA a la vista para arrastrar: ' + JSON.stringify(ag))
    await page.mouse.move(ag.x, ag.y); await page.mouse.down()
    await page.mouse.move(ag.x + 60, ag.y + 45, { steps: 10 }); await page.mouse.up()
    await page.waitForTimeout(900)
    const pos = await page.evaluate(() => window.SIDPicbTeatro.estado().g.logistica?.pos || {})
    assert.ok(Object.keys(pos).some((k) => /^F-II\|SA /.test(k)), 'la SA movida queda guardada en su fase: ' + JSON.stringify(pos) + ' · ' + ag.t)
    assert.match(await page.locator('.sidpt-bd').innerText(), /\(movida\)|se desplaza/)
    await page.locator('input[data-a="logcap"][data-k="SB"]').fill('5000'); await page.locator('input[data-a="logcap"][data-k="SB"]').dispatchEvent('change'); await page.waitForTimeout(600)
    assert.equal(await page.evaluate(() => window.SIDPicbTeatro.logistica().sb.cap), 5000)
    await page.screenshot({ path: path.join(SALIDAS, '2-paso6-F-II-SA-movida.png') })
    console.log('  ✓ correcciones del G-4: SA movida en la F-II, SB 5.000 t/día')

    // 3 · El enfrentamiento CON logística y el KMZ del calco.
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('.sidpt [data-a="enfjson"]').first().click()])
    const ruta = path.join(SALIDAS, 'ENFRENTAMIENTO-con-logistica.json'); await dl.saveAs(ruta)
    const j = JSON.parse(fs.readFileSync(ruta, 'utf8'))
    assert.equal(j.logistica?.formato, 'sideceme/logistica-teatro')
    assert.ok(j.logistica.instalaciones.length >= 9 && Object.keys(j.logistica.gu).length >= 5)
    const [dk] = await Promise.all([page.waitForEvent('download'), page.locator('.sidpt [data-a="logkmz"]').click()])
    await dk.saveAs(path.join(SALIDAS, dk.suggestedFilename()))
    console.log(`  ✓ ${path.basename(ruta)} (${j.logistica.instalaciones.length} instalaciones) · ${dk.suggestedFilename()}`)

    // 4 · 🖨️ Hojas «🌎 APOYO LOGÍSTICO» F-I y F-II.
    await page.evaluate(() => window.SIDImpresionFases.abrir())
    const dlg = page.locator('.sidif')
    assert.match(await dlg.innerText(), /APOYO LOGÍSTICO/)
    for (const i of await dlg.locator('input[data-curso]').all()) {
      const c = await i.getAttribute('data-curso'), n = await i.getAttribute('data-i')
      const quiero = c === 'teatro-logistica' && (n === '0' || n === '1')
      if ((await i.isChecked()) !== quiero) await i.click()
    }
    await dlg.locator('[data-carta]').uncheck()
    const [ventana] = await Promise.all([page.waitForEvent('popup', { timeout: 120000 }), dlg.locator('[data-ir]').click()])
    await ventana.waitForSelector('.hoja')
    await ventana.waitForTimeout(800)
    const hojas = await ventana.evaluate(() => [...document.querySelectorAll('.hoja')].map((h) => {
      const vis = [...h.querySelectorAll('.sidpt-fch')].filter((e) => !e.closest('[style*="display: none"]')).map((e) => e.textContent.trim())
      return { t: h.querySelector('header b').textContent, log: vis.filter((x) => /^(🏭|📦|🚚|👥)/.test(x)).length, azul: vis.filter((x) => /^F-/.test(x)).map((x) => x.split(' ')[0]) }
    }))
    assert.equal(hojas.length, 2, 'dos hojas')
    assert.match(hojas[0].t, /Apoyo logístico · F-I/)
    assert.ok(hojas.every((h) => h.log >= 9), 'cada hoja con las instalaciones: ' + hojas.map((h) => h.log).join('/'))
    assert.ok(hojas[1].azul.length && hojas[1].azul.every((x) => x === 'F-II'), 'la hoja F-II lleva las GG.UU. azules de la F-II')
    await ventana.setViewportSize({ width: 1100, height: 900 })
    await ventana.locator('.hoja').nth(1).scrollIntoViewIfNeeded()
    await ventana.screenshot({ path: path.join(SALIDAS, '3-hoja-apoyo-logistico-F-II.png'), animations: 'disabled', timeout: 90000 })
    console.log('  ✓ hojas: ' + hojas.map((h) => `${h.t.split(' (')[0]} (${h.log} instalaciones, ${h.azul.length} GG.UU.)`).join(' · '))
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().capaFase === null)
    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort|ERR_FAILED|net::/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log('picb-teatro-logistica e2e: OK')
  } catch (e) {
    try { await page.screenshot({ path: path.join(SALIDAS, 'error.png') }) } catch (x) {}
    throw e
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
