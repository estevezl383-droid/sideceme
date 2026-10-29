// Cinco áreas reales dibujadas con el ratón. Los datos del terreno son ficticios;
// el dibujo, la unión geográfica, el recorte y el guardado son los de la Mesa.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact, leerGuardado } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const out = path.resolve(__dirname, '../salidas-areas-interes')
fs.mkdirSync(out, { recursive: true })
const centros = Array.from({ length: 5 }, (_, i) => [-65 + i * .03, -17])
const features = [...centros, [-64.985, -17], [-65.1, -17]].map((coordinates, i) => ({
  type: 'Feature', id: i, properties: { name: `Población ficticia ${i + 1}`, osm_id: i + 1 }, geometry: { type: 'Point', coordinates }
}))
const leerAoi = page => estadoReact(page, a => a?.type === 'Feature' && Array.isArray(a.properties?.areasInteres) ? a : undefined)
const pausa = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1440, alto: 1000, preparar: async p => {
    await p.route('**/*.geojson', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({
      type: 'FeatureCollection', features: r.request().url().includes('poblaciones_puntos') ? features : []
    }) }))
    await p.route(/\/api\/interpreter/, r => r.fulfill({ contentType: 'application/json', body: '{"elements":[]}' }))
  } })
  page.on('dialog', d => d.accept())
  try {
    const original = ejercicioFicticio({ conPlantilla: false })
    original.nombre = 'CINCO ÁREAS DE INTERÉS (FICT.)'
    original.aoi = null
    original.aoPuntos = []
    await sembrarYAbrir(page, original)
    assert.equal(await estadoReact(page, v => {
      const m = v?.map || v?.current || v
      if (typeof m?.setView === 'function' && typeof m?.latLngToContainerPoint === 'function') {
        window.__lm2d = m
        return true
      }
    }), true, 'mapa Leaflet activo')
    const panel = page.getByRole('region', { name: 'Áreas de Interés', exact: true })
    await panel.getByRole('button', { name: '2 · Áreas de Interés', exact: true }).click()
    for (let i = 0; i < centros.length; i++) {
      await panel.getByRole('button', { name: /Dibujar.*área de interés/ }).click()
      const [lng, lat] = centros[i]
      await page.evaluate(([lng, lat]) => window.__lm2d.setView([lat, lng], 13, { animate: false }), [lng, lat])
      await page.waitForTimeout(250)
      for (const [dx, dy] of [[-.006, -.006], [.006, -.006], [.006, .006], [-.006, .006]]) {
        const punto = await page.evaluate(([lng, lat]) => {
          const m = window.__lm2d, p = m.latLngToContainerPoint([lat, lng]), r = m.getContainer().getBoundingClientRect()
          return [r.left + p.x, r.top + p.y]
        }, [lng + dx, lat + dy])
        await page.mouse.click(...punto)
      }
      await page.getByRole('button', { name: '✓ Añadir Área de Interés', exact: true }).click()
      await panel.getByRole('status').filter({ hasText: new RegExp(`^${i + 1} área`) }).waitFor()
      const campo = panel.getByLabel(`Nombre del Área de Interés ${i + 1}`, { exact: true })
      await campo.fill(`Sector ${i + 1}`)
      await campo.press('Enter')
    }
    let aoi = await leerAoi(page)
    assert.equal(aoi.properties.areasInteres.length, 5)
    assert.equal(aoi.geometry.type, 'MultiPolygon')
    assert.equal(aoi.geometry.coordinates.length, 5)
    // Leaflet mantiene brevemente los tooltips anteriores durante su fade-out.
    await page.waitForFunction(() => document.querySelectorAll('.rotulo-area-interes').length === 5)
    assert.equal(await page.locator('.rotulo-area-interes').count(), 5)
    assert.deepEqual(aoi.properties.areasInteres.map(a => a.nombre), ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5'])

    const generar = async cantidad => {
      await page.getByRole('button', { name: '⚡ GENERAR CALCOS', exact: true }).click()
      await page.getByRole('button', { name: '⚡ GENERAR CALCOS', exact: true }).waitFor({ timeout: 90000 })
      const puntos = await page.evaluate(() => window.__resultados?.poblaciones?.fc.features.map(f => f.geometry.coordinates))
      assert.equal(puntos?.length, cantidad, 'el calco incluye todos los sectores y excluye los huecos y el exterior')
      assert.equal(puntos.some(p => Math.abs(p[0] + 64.985) < .00001), false, 'no entra la población del espacio entre áreas')
    }
    await generar(5)

    // Importar una sexta área superpuesta suma un contorno y no duplica datos.
    const anillo = aoi.properties.areasInteres[0].geometry.coordinates[0]
    const kml = `<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Refuerzo</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${anillo.map(p => `${p[0]},${p[1]},0`).join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`
    await page.locator('input[type=file][accept=".kml,.kmz"]').setInputFiles({ name: 'refuerzo.kml', mimeType: 'application/vnd.google-earth.kml+xml', buffer: Buffer.from(kml) })
    await panel.getByRole('status').filter({ hasText: /^6 áreas/ }).waitFor()
    await generar(5)
    aoi = await leerAoi(page)
    await panel.getByRole('button', { name: `Quitar ${aoi.properties.areasInteres[5].nombre}`, exact: true }).click()
    await panel.getByRole('status').filter({ hasText: /^5 áreas/ }).waitFor()

    // El guardado real (no sólo el estado React) conserva nombres y polígonos.
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
    let guardado
    for (let i = 0; i < 60; i++) {
      guardado = await leerGuardado(page, original.nombre)
      if (guardado?.aoi?.properties?.areasInteres?.length === 5) break
      await pausa(100)
    }
    assert.equal(guardado.aoi.properties.areasInteres.length, 5)
    assert.equal(JSON.parse(JSON.stringify(guardado)).aoi.properties.areasInteres.length, 5)
    const vacio = { ...original, nombre: 'VACÍO (FICT.)' }
    await sembrarYAbrir(page, vacio)
    await panel.getByRole('status').filter({ hasText: /^0 áreas/ }).waitFor()
    await sembrarYAbrir(page, guardado)
    await panel.getByRole('status').filter({ hasText: /^5 áreas/ }).waitFor()
    assert.deepEqual((await leerAoi(page)).properties.areasInteres, guardado.aoi.properties.areasInteres)
    await generar(5)
    await page.screenshot({ path: path.join(out, 'cinco-areas.png'), fullPage: false })

    await panel.getByRole('button', { name: 'Quitar Sector 3', exact: true }).click()
    await panel.getByRole('status').filter({ hasText: /^4 áreas/ }).waitFor()
    await generar(4)
    assert.equal((await leerAoi(page)).properties.areasInteres.some(a => a.nombre === 'Sector 3'), false)
    assert.deepEqual(errores, [])
    console.log('OK: cinco áreas dibujadas, nombres, calcos conjuntos sin huecos ni duplicados, sexta KML superpuesta, borrado individual, guardado y reapertura.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
