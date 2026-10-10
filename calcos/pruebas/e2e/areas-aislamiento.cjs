const assert = require('assert/strict')
const { abrir, sembrarYAbrir, estadoReact, leerGuardado } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
;(async () => {
  const { page, errores, cerrar } = await abrir()
  try {
    const a = ejercicioFicticio({ conPlantilla: false })
    a.nombre = 'Origen de prueba'
    a.planFuegos = { blancos: [{ id: 'ab-prueba', designacion: 'AB-PRUEBA', lng: -65.05, lat: -17 }] }
    await sembrarYAbrir(page, a)
    assert.equal(await page.evaluate(() => window.MesaFuegos.plan.blancos.length), 1)
    await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    const panel = page.getByRole('region', { name: 'Áreas del ejercicio' })
    await panel.getByLabel('Nombre del área').fill('Área original conservada')
    await panel.locator('input[type=checkbox][aria-label^="Compartir "]').check()
    const descarga = page.waitForEvent('download')
    await panel.getByRole('button', { name: 'Descargar copia JSON de las áreas' }).click()
    const d = await descarga
    const ruta = await d.path()
    const bytes = require('fs').readFileSync(ruta)
    // Importar en el mismo ejercicio añade una copia, no reemplaza el área.
    await panel.locator('input[type=file]').setInputFiles({ name: 'areas.json', mimeType: 'application/json', buffer: bytes })
    await page.waitForTimeout(500)
    assert.equal(await panel.locator('input[type=checkbox][aria-label^="Compartir "]').count(), 2)
    const ops = await estadoReact(page, v => v && Array.isArray(v.areasOps) ? v : undefined)
    assert.equal(ops.areasOps.length, 2)
    assert.equal(await page.evaluate(() => window.MesaFuegos.plan.blancos.length), 1)
    assert.ok(await page.locator('.leaflet-tooltip').count() >= 1)
    // Crear mediante el flujo real: el plan anterior no llega al nuevo archivo.
    page.on('dialog', dialog => dialog.type() === 'prompt' ? dialog.accept('Nuevo limpio') : dialog.accept())
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('button', { name: /Nuevo ejercicio \(en blanco\)/ }).click()
    await page.waitForTimeout(3500)
    assert.equal(await page.evaluate(() => window.MesaFuegos.plan.blancos.length), 0)
    const nuevo = await leerGuardado(page, 'Nuevo limpio')
    assert.equal(nuevo.planFuegos, null)
    assert.equal((await leerGuardado(page, a.nombre)).planFuegos.blancos.length, 1)
    await sembrarYAbrir(page, a)
    assert.equal(await page.evaluate(() => window.MesaFuegos.plan.blancos.length), 1)
    assert.deepEqual(errores, [])
    console.log('E2E: compartir/importar añade áreas, conserva fuegos propios; nuevo ejercicio vacío; origen recuperable. Sin errores JS.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
