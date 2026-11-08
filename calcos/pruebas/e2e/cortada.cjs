// ✂️💾 La Mesa real en Chromium (08-11-2026): las 4 AO y las fichas de SATURNO de Sergio (KMZ) → la tijera corta
// el AO TIGRE con su brigada roja → «💾 Guardar área cortada como ejercicio…» lo graba como ejercicio APARTE
// (con el área y la ficha enemiga) sin cambiar el abierto; y lo mismo desde «💾 Guardar como». Capturas en
// pruebas/salidas-kmz/.
//   CARPETA_KMZ="/ruta/NUEVO EJERCICIO TCNL GALVEZ" node calcos/pruebas/e2e/cortada.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, estadoReact, leerGuardado } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-kmz')
const dir = process.env.CARPETA_KMZ
if (!dir) { console.log('cortada: sin CARPETA_KMZ, no corre (usa los KMZ reales).'); process.exit(0) }
const limpio = path.join(dir, 'LIMPIO PARA PASAR')
const leerOps = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.limites) && 'areaOps' in v ? v : undefined)
const abiertoAhora = page => page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().innerText()

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const { page, errores, cerrar } = await abrir()
  const dialogos = []
  let respuesta
  page.on('dialog', d => { dialogos.push({ mensaje: d.message(), propuesto: d.defaultValue() }); return d.accept(respuesta ?? d.defaultValue()) })
  try {
    const previo = ejercicioFicticio({ conPlantilla: false }); previo.nombre = 'FABBLE abierto'
    await sembrarYAbrir(page, previo)
    // 1 · Las AO y las fichas de SATURNO, como ejercicio «DIAMANTE KMZ».
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    respuesta = 'DIAMANTE KMZ'
    const [sel] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)' }).click()])
    await sel.setFiles(fs.readdirSync(limpio).filter(n => /\.kmz$/i.test(n)).map(n => ({ name: n, mimeType: 'application/vnd.google-earth.kmz', buffer: fs.readFileSync(path.join(limpio, n)) })))
    await page.waitForFunction(() => /abierto:/.test(document.body.innerText), null, { timeout: 30000 })
    respuesta = undefined
    await page.waitForTimeout(1500)
    const ops = await leerOps(page)
    const tigre = [...ops.areasOps, ops.areaOps].find(a => /TIGRE/.test(a.nombre))
    const lng = tigre.coords.map(c => c[0]), lat = tigre.coords.map(c => c[1])
    const caja = [Math.min(...lng) - 0.08, Math.min(...lat) - 0.08, Math.max(...lng) + 0.08, Math.max(...lat) + 0.08]
    await page.evaluate(c => window.__mapa2d.fitBounds([[c[1], c[0]], [c[3], c[2]]], { paddingTopLeft: [320, 260], paddingBottomRight: [260, 80], animate: false }), caja)
    await page.waitForTimeout(800)
    const pantalla = l => page.evaluate(L => { const m = window.__mapa2d, r = m.getContainer().getBoundingClientRect(); return L.map(([x, y]) => { const p = m.latLngToContainerPoint([y, x]); return [r.left + p.x, r.top + p.y] }) }, l)
    // 2 · La tijera: un lazo alrededor del AO TIGRE (con su brigada roja).
    await page.getByRole('button', { name: '✂️ Cortar área' }).click()
    await page.getByRole('region', { name: 'Tijera' }).filter({ hasText: 'Encierre a mano alzada' }).waitFor()
    const lazo = await pantalla([[caja[0], caja[3]], [caja[2], caja[3]], [caja[2], caja[1]], [caja[0], caja[1]], [caja[0], caja[3]]])
    await page.mouse.move(...lazo[0]); await page.mouse.down()
    for (let i = 1; i < lazo.length; i++) await page.mouse.move(...lazo[i], { steps: 14 })
    await page.mouse.up()
    const vista = page.getByRole('region', { name: 'Tijera · vista previa' })
    await vista.waitFor()
    assert.match(await vista.innerText(), /ficha\(s\) enemiga\(s\)/, 'la brigada roja adentro')
    await vista.getByLabel('Nombre de la selección').fill('CE-I TIGRE')
    await vista.getByRole('button', { name: '✓ Cortar y guardar selección' }).click()
    const tij = page.getByRole('region', { name: 'Tijera' })
    await tij.getByRole('status').filter({ hasText: '«CE-I TIGRE» guardada' }).waitFor()
    await page.screenshot({ path: path.join(SALIDAS, '7-tijera-guardada.png') })
    // 3 · 💾 Guardar área cortada como ejercicio… (en la tijera).
    const n0 = dialogos.length
    await tij.getByRole('button', { name: '💾 Guardar área cortada como ejercicio…' }).click()
    await tij.getByText(/guardado como ejercicio aparte/).waitFor({ timeout: 20000 })
    assert.equal(dialogos.length, n0 + 1); assert.match(dialogos[n0].mensaje, /como ejercicio APARTE .*ficha/)
    const nombre1 = dialogos[n0].propuesto
    assert.equal(nombre1, 'CE-I TIGRE · DIAMANTE KMZ')
    await page.screenshot({ path: path.join(SALIDAS, '8-cortada-como-ejercicio.png') })
    const g = await leerGuardado(page, nombre1)
    assert.equal(g.ops.areaOps.nombre, 'CE-I TIGRE', 'el área cortada, activa')
    const rojas = (g.unidades || []).filter(u => u.bando === 'enemigo')
    assert.ok(rojas.length >= 1, 'con su ficha enemiga')
    assert.ok(rojas.every(u => u.lng >= caja[0] && u.lng <= caja[2] && u.lat >= caja[1] && u.lat <= caja[3]), 'sólo las de adentro')
    assert.equal(g.origenCorte.ejercicio, 'DIAMANTE KMZ')
    assert.match(await abiertoAhora(page), /DIAMANTE KMZ/, 'el abierto no cambió')
    // 4 · Lo mismo desde «💾 Guardar como».
    await page.getByRole('button', { name: 'Cerrar' }).last().click().catch(() => {})
    await page.locator('#sid-resg-btn').click()
    const panel = page.locator('#sid-resg-panel')
    await panel.getByText('✂️ Guardar área cortada como…').waitFor()
    await page.screenshot({ path: path.join(SALIDAS, '9-guardar-como.png') })
    await panel.getByRole('button', { name: '💾 «CE-I TIGRE» como ejercicio…' }).click()
    await panel.getByText(/guardado como ejercicio aparte/).waitFor({ timeout: 20000 })
    const nombre2 = dialogos[dialogos.length - 1].propuesto
    assert.equal(nombre2, 'CE-I TIGRE · DIAMANTE KMZ (2)', 'no pisa el anterior')
    const g2 = await leerGuardado(page, nombre2)
    assert.equal(g2.unidades.length, g.unidades.length)
    await page.screenshot({ path: path.join(SALIDAS, '10-guardar-como-ok.png') })
    assert.match(await abiertoAhora(page), /DIAMANTE KMZ/, 'el abierto no cambió')
    // 5 · El ejercicio nuevo se abre con su área y su ficha roja.
    await page.locator('#sid-resg-panel [data-r="cerrar"]').click()
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    await page.getByRole('button', { name: 'Abrir guardados' }).dispatchEvent('click')
    await page.locator('div').filter({ hasText: new RegExp('^📄 ' + nombre1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'Abrir$') }).getByRole('button', { name: 'Abrir' }).click()
    await page.waitForFunction(n => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some(b => b.textContent.includes(n) && !b.textContent.includes('(2)')), nombre1)
    await page.waitForTimeout(1500)
    const ops3 = await leerOps(page)
    assert.equal(ops3.areaOps.nombre, 'CE-I TIGRE')
    const marcas = await page.evaluate(() => document.querySelectorAll('img.leaflet-marker-icon').length)
    assert.ok(marcas >= 1, 'la ficha roja en la carta')
    await page.screenshot({ path: path.join(SALIDAS, '11-abierto-el-nuevo.png') })
    assert.deepEqual(errores.filter(e => !/favicon|ERR_|Failed to load resource/.test(e)), [], 'sin errores JS')
    console.log(`  · «${nombre1}»: área ${g.ops.areaOps.nombre}, ${g.unidades.length} ficha(s) (${rojas.length} roja(s)); «${nombre2}» desde Guardar como`)
    console.log('E2E área cortada como ejercicio: desde la tijera y desde «💾 Guardar como», con su área y su enemigo, sin cambiar el abierto. Sin errores JS.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exit(1) })
