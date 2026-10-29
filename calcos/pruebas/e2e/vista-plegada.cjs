const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact, entrar3D, salir3D } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const out = path.resolve(__dirname, '../salidas-vista-plegada')
fs.mkdirSync(out, { recursive: true })
const areas = Array.from({ length: 5 }, (_, i) => {
  const x = -65 + i * .03
  return { id: `ai-${i}`, nombre: `Sector ${i + 1}`, geometry: { type: 'Polygon', coordinates: [
    [[x - .006, -17.006], [x + .006, -17.006], [x + .006, -16.994], [x - .006, -16.994], [x - .006, -17.006]]
  ] } }
})
const visibilidad = p => estadoReact(p, v => v && !Array.isArray(v) && typeof v.areaOps === 'boolean' ? v : undefined)
const aoi = p => estadoReact(p, v => v?.properties?.areasInteres ? v : undefined)
const contar = async (page, n) => page.waitForFunction(n => document.querySelectorAll('.rotulo-area-interes').length === n, n)
;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1440, alto: 1000, preparar: async p => {
    await p.addInitScript(() => {
      localStorage.setItem('mesa_ver_grupos', JSON.stringify({ terreno: true, '📐 Calco del Estado Mayor': true }))
      localStorage.setItem('sid_mod_plegado', '0')
    })
    await p.route('**/*.geojson', r => r.fulfill({ json: { type: 'FeatureCollection', features: [] } }))
  } })
  try {
    const e = ejercicioFicticio({ conPlantilla: false })
    e.nombre = 'VISIBILIDAD (FICT.)'
    e.aoi = { type: 'Feature', properties: { nombre: '5 áreas', areasInteres: areas }, geometry: { type: 'MultiPolygon', coordinates: areas.map(a => a.geometry.coordinates) } }
    e.resultados = { poblaciones: { total: 1, porCapa: {}, fc: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { Nombre: 'Ficticia' }, geometry: { type: 'Point', coordinates: [-65, -17] } }] } } }
    await sembrarYAbrir(page, e)
    await page.locator('#sid-mod-sel button[data-m=profesor]').dispatchEvent('click')
    assert.equal(await page.locator('#sid-mod-panel').evaluate(e => e.classList.contains('plegado')), true)
    await page.locator('#sid-mod-sel button[data-m=mesa]').dispatchEvent('click')
    const grupos = page.locator('.bloque-ver .ver-cab')
    assert.equal(await grupos.count(), 7)
    for (const b of await grupos.all()) assert.equal(await b.getAttribute('aria-expanded'), 'false')
    const panelAI = page.getByRole('region', { name: 'Áreas de Interés', exact: true })
    assert.equal(await panelAI.getByRole('button', { name: '2 · Áreas de Interés', exact: true }).getAttribute('aria-expanded'), 'false')
    assert.equal(await panelAI.getByLabel('Nombre del Área de Interés 1', { exact: true }).count(), 0)
    assert.equal(await page.getByRole('button', { name: /Cartografía.*5 áreas/ }).count(), 0)
    assert.equal(await page.getByText('🎖️ MESA · PREPARACIÓN DEL EJERCICIO', { exact: true }).count(), 0)
    assert.equal(await page.getByRole('button', { name: '▼ ocultar', exact: true }).count(), 0)

    const em = '📐 Calco del Estado Mayor'
    await page.getByRole('button', { name: `Ocultar el grupo ${em}`, exact: true }).click()
    let v = await visibilidad(page)
    for (const id of ['areaOps', 'areaInteres', 'areaInfluencia', 'zonasLog', 'posDef', 'unidadesAzul', 'unidadesRojo']) assert.equal(v[id], false)
    await contar(page, 0)
    await page.getByRole('button', { name: `Mostrar el grupo ${em}`, exact: true }).click()
    await contar(page, 5)
    v = await visibilidad(page)
    for (const id of ['areaOps', 'areaInteres', 'unidadesAzul', 'unidadesRojo']) assert.equal(v[id], true)
    for (const nombre of ['🪖 CMOC — el terreno ya juzgado', '🔎 Producto del G-2 (paso 4)']) {
      await page.getByRole('button', { name: `Ocultar el grupo ${nombre}`, exact: true }).click()
      await page.getByRole('button', { name: `Mostrar el grupo ${nombre}`, exact: true }).click()
    }
    assert.equal((await visibilidad(page)).ains, true)

    const terreno = '🗺️ Calcos del terreno · base del CMOC'
    await page.getByRole('button', { name: `Ocultar el grupo ${terreno}`, exact: true }).click()
    assert.equal(await estadoReact(page, v => v && v.hidro_lineas === false && v.poblaciones_puntos === false ? true : undefined), true)
    await page.getByRole('button', { name: `Mostrar el grupo ${terreno}`, exact: true }).click()
    assert.equal(await estadoReact(page, v => v && v.hidro_lineas === true && v.poblaciones_puntos === true ? true : undefined), true)

    await panelAI.getByRole('button', { name: '2 · Áreas de Interés', exact: true }).click()
    const antes = await aoi(page)
    await panelAI.getByRole('button', { name: 'Ocultar Sector 2', exact: true }).click()
    await contar(page, 4)
    assert.deepEqual(await aoi(page), antes)
    await panelAI.getByRole('button', { name: 'Ocultar el grupo 2 · Áreas de Interés', exact: true }).click()
    await contar(page, 0)
    await panelAI.getByRole('button', { name: 'Mostrar Sector 3', exact: true }).click()
    await contar(page, 1)
    assert.equal(await page.locator('.rotulo-area-interes').innerText(), 'Sector 3')
    await panelAI.getByRole('button', { name: 'Ocultar el grupo 2 · Áreas de Interés', exact: true }).click()
    await panelAI.getByRole('button', { name: 'Mostrar el grupo 2 · Áreas de Interés', exact: true }).click()
    await contar(page, 5)

    await entrar3D(page)
    await panelAI.getByRole('button', { name: 'Ocultar Sector 1', exact: true }).click()
    await page.waitForFunction(() => ['a', 'b'].flatMap(k => {
      const d = window.__map3d.getSource(`m3d-${k}`)._data
      return (d.geojson || d).features
    }).filter(f => f.properties.c === '#ff2222' && f.geometry.type === 'Polygon').length === 4)
    await salir3D(page)
    await contar(page, 4)
    assert.deepEqual(await aoi(page), antes)
    await panelAI.getByRole('button', { name: '2 · Áreas de Interés', exact: true }).click()
    await page.screenshot({ path: path.join(out, 'grupos-plegados.png'), fullPage: false })
    assert.deepEqual(errores, [])
    console.log('OK: grupos y preparación plegados, cartografía retirada, ojos por grupo y por área en 2D/3D sin modificar el análisis.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
