const assert = require('node:assert/strict')
const { abrir, sembrarYAbrir, entrar3D, salir3D } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const sectores = Array.from({ length: 5 }, (_, i) => {
  const x = -65 + i * .03
  return { id: `sector-${i}`, nombre: `Sector ${i + 1}`, geometry: { type: 'Polygon', coordinates: [
    [[x - .006, -17.006], [x + .006, -17.006], [x + .006, -16.994], [x - .006, -16.994], [x - .006, -17.006]]
  ] } }
})
;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1440, alto: 1000 })
  try {
    const panel = page.getByRole('region', { name: 'Áreas de Interés', exact: true })
    const antigua = ejercicioFicticio({ conPlantilla: false })
    antigua.nombre = 'Área anterior (FICT.)'
    antigua.aoi = { type: 'Feature', properties: { nombre: 'Área histórica' }, geometry: sectores[0].geometry }
    await sembrarYAbrir(page, antigua)
    await panel.getByRole('status').filter({ hasText: /^1 área/ }).waitFor()
    assert.equal(await panel.getByLabel('Nombre del Área de Interés 1', { exact: true }).inputValue(), 'Área histórica')

    const aoi = { type: 'Feature', properties: { nombre: '5 Áreas de Interés', areasInteres: sectores },
      geometry: { type: 'MultiPolygon', coordinates: sectores.map(s => s.geometry.coordinates) } }
    const bloqueada = { ...antigua, nombre: 'BASE del G-3 (FICT.)', aoi, baseInfo: { autor: 'G-3', ejercicio: 'BASE ficticia' }, puestoActivo: 'g2' }
    await sembrarYAbrir(page, bloqueada)
    await panel.getByRole('status').filter({ hasText: /^5 áreas/ }).waitFor()
    assert.equal(await panel.getByRole('button', { name: /Dibujar otra área/ }).isDisabled(), true)
    assert.equal(await panel.getByLabel('Nombre del Área de Interés 1', { exact: true }).isDisabled(), true)
    assert.equal(await panel.getByRole('button', { name: 'Quitar Sector 1', exact: true }).isDisabled(), true)

    await sembrarYAbrir(page, { ...antigua, nombre: 'Cinco áreas en 3D (FICT.)', aoi })
    await entrar3D(page)
    // La vista vigente refleja las capas Leaflet en los dos grupos del espejo,
    // en lugar de utilizar la fuente aoi del antiguo renderizador 3D.
    await page.waitForFunction(() => ['a', 'b'].flatMap(k => {
      const d = window.__map3d?.getSource(`m3d-${k}`)?._data
      return (d?.geojson || d)?.features || []
    })
      .filter(f => f.properties.c === '#ff2222' && f.geometry.type === 'Polygon').length === 5)
    const datos = await page.evaluate(() => ['a', 'b'].flatMap(k => {
      const d = window.__map3d.getSource(`m3d-${k}`)._data
      return (d.geojson || d).features
    })
      .filter(f => f.properties.c === '#ff2222' && f.geometry.type === 'Polygon').map(f => f.geometry))
    const ordenar = gs => gs.sort((a, b) => a.coordinates[0][0][0] - b.coordinates[0][0][0])
    const redondear = gs => JSON.parse(JSON.stringify(gs, (k, v) => typeof v === 'number' ? +v.toFixed(7) : v))
    assert.deepEqual(redondear(ordenar(datos)), redondear(ordenar(sectores.map(s => s.geometry))))
    await salir3D(page)
    await page.waitForFunction(() => document.querySelectorAll('.rotulo-area-interes').length === 5)
    assert.deepEqual(errores, [])
    console.log('OK: área antigua compatible, BASE de otro puesto bloqueada y cinco contornos en 3D y 2D.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
