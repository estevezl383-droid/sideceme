// 🌎 PICB del Teatro en la Mesa real (Chromium, 09-11-2026).
//   1. En un ejercicio de DIVISIÓN no aparece nada (la pestaña 🌎 queda oculta, no se dibuja nada).
//   2. Con los KMZ del teatro abiertos con «📂 Abrir archivo JSON o KMZ» (TO, AO, fichas) aparece la
//      pestaña 🌎 PICB TEATRO; se cargan las DEOP en el panel y salen los 4 calcos, el calco del
//      enemigo (itinerarios con D+n, ejes, A.I.N.) y el texto; queda guardado en resultados.picbTeatro.
//   CARPETA_KMZ="$HOME/Desktop/FF.TT.T.O." PLAYWRIGHT_MODULE=… node calcos/pruebas/e2e/picb-teatro.cjs
// Capturas en pruebas/salidas-picb-teatro/ (DPR=2 para verlas como en la pantalla Retina).
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-picb-teatro')
const BOTON = '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)'
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('picb-teatro e2e: sin CARPETA_KMZ, no corre (usa los KMZ reales del teatro).'); process.exit(0) }
const leer = (n) => ({ name: n, mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(path.join(dir, n)) })
const todos = fs.readdirSync(dir).filter((n) => /\.kmz$/i.test(n)).sort()
const deop = todos.filter((n) => /DEOP|Direcciones Estrat/i.test(n))
const ejercicio = todos.filter((n) => !deop.includes(n))

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  // TILES_REALES=1: la carta de fondo de verdad (OpenStreetMap / Esri), para ver cómo queda.
  const preparar = process.env.TILES_REALES ? (page) => page.route(/tile\.openstreetmap\.org|arcgisonline\.com/, (r) => r.continue()) : undefined
  const { page, errores, cerrar } = await abrir({ escalaPantalla: Number(process.env.DPR || 1), ancho: 1600, alto: 1000, preparar })
  page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'DIAMANTE TEATRO PRUEBA' : undefined))
  try {
    // 1 · DIVISIÓN: nada.
    await sembrarYAbrir(page, { ...ejercicioFicticio({ conPlantilla: false }), nombre: 'DIVISION NORMAL' })
    await page.waitForTimeout(2600)
    assert.equal(await page.locator('.sidpt-btn:visible').count(), 0, 'en un ejercicio de DIV no aparece la pestaña')
    assert.equal(await page.locator('.sidpt').count(), 0)
    console.log('  ✓ ejercicio de DIVISIÓN: sin pestaña 🌎, sin capas')

    // 2 · Abrir los KMZ del teatro como ejercicio nuevo.
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: BOTON }).click()])
    await selector.setFiles(ejercicio.map(leer))
    await page.waitForFunction(() => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some((b) => /DIAMANTE TEATRO PRUEBA/.test(b.textContent)), null, { timeout: 40000 })
    await page.waitForTimeout(3000)
    await page.locator('.sidpt-btn').waitFor({ state: 'visible', timeout: 15000 })
    console.log('  ✓ ejercicio de teatro: aparece la pestaña 🌎 PICB TEATRO')
    // No tapa ni queda tapada por las otras pestañas del borde derecho (🧩 Superponer, 🗂️ Despliegue del TO).
    await page.waitForTimeout(2500)
    const choques = await page.evaluate(() => {
      const yo = document.querySelector('.sidpt-btn').getBoundingClientRect()
      return [...document.body.children].filter((e) => e.className !== 'sidpt-btn' && getComputedStyle(e).position === 'fixed' && /^vertical/.test(getComputedStyle(e).writingMode) && getComputedStyle(e).display !== 'none')
        .map((e) => ({ t: e.textContent.trim().slice(0, 30), r: e.getBoundingClientRect() }))
        .filter((x) => x.r.height > 0 && !(x.r.bottom <= yo.top || x.r.top >= yo.bottom)).map((x) => x.t)
    })
    assert.deepEqual(choques, [], 'la pestaña 🌎 no se superpone con: ' + choques.join(', '))
    const centro = await page.evaluate(() => { const r = document.querySelector('.sidpt-btn').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && (e.closest('.sidpt-btn') ? 'sidpt' : e.className) })
    assert.equal(centro, 'sidpt', 'al centro de la pestaña 🌎 está la pestaña, no otra cosa: ' + centro)
    console.log('  ✓ la pestaña no se superpone con Superponer ni con Despliegue del TO')

    // 3 · Abrir el panel y esperar la carta del teatro.
    await page.locator('.sidpt-btn').click()
    await page.locator('.sidpt').waitFor({ state: 'visible' })
    await page.waitForFunction(() => window.SIDPicbTeatro && window.SIDPicbTeatro.estado().base, null, { timeout: 30000 })
    await page.waitForTimeout(1500)
    const est1 = await page.evaluate(() => { const s = window.SIDPicbTeatro.estado(); return { sub: s.resumen.subteatros.length, km2: s.resumen.km2, ai: s.ai.km2, en: s.unidades.enemigas.length, pr: s.unidades.propias.length } })
    console.log('  · ' + JSON.stringify(est1))
    assert.ok(est1.sub >= 3 && est1.km2 > 150000 && est1.ai > est1.km2)
    assert.ok(est1.en >= 4 && est1.pr >= 4)
    await page.screenshot({ path: path.join(SALIDAS, '1-paso1-ambiente.png') })

    // 4 · Cargar las DEOP en el panel.
    await page.locator('input.sidpt-file').setInputFiles(deop.map(leer))
    await page.waitForFunction(() => window.SIDPicbTeatro.estado().analisis.length >= 4, null, { timeout: 30000 })
    await page.waitForTimeout(800)
    // 5 · Paso 2: los cuatro calcos.
    await page.locator('.sidpt-pasos button[data-n="2"]').click()
    await page.waitForTimeout(800)
    assert.equal(await page.locator('.sidpt-capa input[data-a="ver"]').count(), 4)
    await page.screenshot({ path: path.join(SALIDAS, '2-paso2-efectos.png') })
    // 6 · Paso 4: el calco del enemigo.
    await page.locator('.sidpt-pasos button[data-n="4"]').click()
    await page.waitForTimeout(1000)
    assert.equal(await page.locator('.sidpt-deop').count(), 4, '4 DEOP en el panel')
    const nDn = await page.locator('.sidpt-dn').count(), nAin = await page.locator('.sidpt-ainl').count()
    assert.ok(nDn >= 20 && nAin >= 8, `D+n en la carta: ${nDn}, A.I.N.: ${nAin}`)
    const txt = await page.locator('.sidpt-bd').innerText()
    assert.match(txt, /CAE más probable/)
    assert.match(txt, /AIN-1/)
    await page.screenshot({ path: path.join(SALIDAS, '3-paso4-calco-enemigo.png') })
    // ⬇ KMZ para Google Earth y 📄 Word: se bajan y traen lo que tienen que traer.
    const [dk] = await Promise.all([page.waitForEvent('download'), page.locator('.sidpt [data-a="kmzout"]').click()])
    const rutaK = path.join(SALIDAS, dk.suggestedFilename()); await dk.saveAs(rutaK)
    const K = await import('../../areas-operaciones/abrir-kmz.mjs')
    const z = await K.archivosDelZip(new Uint8Array(fs.readFileSync(rutaK)))
    const pms = K.placemarks(K.leerXml(z.kmls[0].texto), { conLineas: true })
    assert.ok(/\.kmz$/.test(dk.suggestedFilename()) && pms.length > 40, `KMZ con ${pms.length} placemarks`)
    assert.ok(pms.some((x) => /AIN-1\b/.test(x.nombre)) && pms.some((x) => /itinerario por la red vial/.test(x.nombre)))
    const [dw] = await Promise.all([page.waitForEvent('download'), page.locator('.sidpt [data-a="word"]').click()])
    const rutaW = path.join(SALIDAS, dw.suggestedFilename()); await dw.saveAs(rutaW)
    const word = fs.readFileSync(rutaW, 'utf8')
    assert.match(word, /CARACTERÍSTICAS DEL ÁREA DE OPERACIONES/); assert.match(word, /CAE más probable/); assert.match(word, /DEOP 4/)
    console.log(`  ✓ se bajan ${dk.suggestedFilename()} (${pms.length} elementos) y ${dw.suggestedFilename()}`)
    // la carta sola, con el panel plegado
    await page.locator('.sidpt [data-a="min"]').click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SALIDAS, '4-carta-teatro.png') })
    await page.locator('.sidpt [data-a="min"]').click()

    // 7 · Guardado con el ejercicio.
    await page.waitForTimeout(4000)
    const g = await page.evaluate(() => window.SIDMesaEjercicio.foto().resultados?.picbTeatro || null)
    assert.ok(g && g.teatro && g.teatro.deop.length === 4, 'resultados.picbTeatro con las 4 DEOP')
    const guardado = await leerGuardado(page, 'DIAMANTE TEATRO PRUEBA')
    console.log('  · guardado en el navegador: ' + (guardado?.resultados?.picbTeatro ? `${guardado.resultados.picbTeatro.teatro.deop.length} DEOP` : 'todavía no (autoguardado pendiente)'))
    console.log(`  ✓ calco del enemigo: ${nDn} rótulos D+n, ${nAin} A.I.N., 4 DEOP, texto del CAE`)

    // 8 · De vuelta a un ejercicio de DIVISIÓN: la pestaña se va y las capas también.
    await sembrarYAbrir(page, { ...ejercicioFicticio({ conPlantilla: false }), nombre: 'DIVISION OTRA VEZ' })
    await page.waitForTimeout(3000)
    assert.equal(await page.locator('.sidpt-btn:visible').count(), 0, 'al volver a DIV la pestaña se oculta')
    assert.equal(await page.locator('.sidpt-dn').count(), 0, 'y no queda nada dibujado')
    console.log('  ✓ al volver a DIVISIÓN no queda nada del teatro')

    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort|ERR_FAILED|net::/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log('picb-teatro e2e: OK')
  } catch (e) {
    try { await page.screenshot({ path: path.join(SALIDAS, 'error.png') }) } catch (x) {}
    throw e
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
