// ✏️ La Mesa real en Chromium (08-11-2026): trazos a mano en los calcos del terreno.
// En «👁 1·b · Qué se ve → 🗺️ Calcos del terreno», cada fila trae su herramienta:
//   · Comunicaciones: un camino clandestino (línea) → comunicaciones_caminos, fclass track;
//     un camino Vía 3 → comunicaciones_vias, fclass unclassified;
//   · Hidrográfico: una laguna (polígono) → hidro_poligonos, y un río (línea) → hidro_lineas;
//   · Poblaciones: un pueblo (polígono + punto) → poblaciones_areas + poblaciones_puntos.
// Nada se mezcla entre calcos; los contadores suben; entra a la consulta del análisis; sobrevive a
// «⚡ Generar calcos» (preservarImportados); se guarda con el ejercicio; se edita y se borra.
//   node calcos/pruebas/e2e/trazos-manuales.cjs      (capturas en pruebas/salidas-trazos/)
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-trazos')

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const ej = ejercicioFicticio({ conPlantilla: false })
  ej.nombre = 'TRAZOS A MANO'
  const { page, errores, cerrar } = await abrir({ escalaPantalla: Number(process.env.DPR || 1) })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await sembrarYAbrir(page, ej)
    // Calcos «generados» (como los deja ⚡ Generar calcos) alrededor del centro de la carta.
    await page.evaluate(() => {
      const m = window.__mapa2d
      const c = m.getCenter()
      const d = 0.01
      const F = (capa, geometry, fclass) => ({ type: 'Feature', _capaId: capa, geometry, properties: { Nombre: 'OSM', Tipo: fclass, fclass, Capa: capa } })
      const R = (feats) => ({ fc: { type: 'FeatureCollection', features: feats }, total: feats.length, porCapa: feats.reduce((a, f) => ((a[f._capaId] = (a[f._capaId] || 0) + 1), a), {}) })
      window.__SIDECEME_IMPORT_STATE.setResultados({
        comunicaciones: R([F('comunicaciones_vias', { type: 'LineString', coordinates: [[c.lng - 3 * d, c.lat - 3 * d], [c.lng + 3 * d, c.lat - 3 * d]] }, 'primary')]),
        hidrografico: R([F('hidro_lineas', { type: 'LineString', coordinates: [[c.lng - 3 * d, c.lat + 3 * d], [c.lng + 3 * d, c.lat + 2 * d]] }, 'river')]),
        poblaciones: R([F('poblaciones_puntos', { type: 'Point', coordinates: [c.lng + 2 * d, c.lat - 2 * d] }, 'village')]),
      })
    })
    await page.waitForTimeout(800)
    // Abrir «🗺️ Calcos del terreno» si está plegado.
    const fila = (re) => page.locator('.bloque-ver .ver-fila').filter({ has: page.locator('.ver-nom', { hasText: re }) })
    if (!(await fila(/comunicaciones/i).count())) {
      await page.locator('.bloque-ver').getByText('Calcos del terreno', { exact: false }).first().click()
      await page.waitForTimeout(500)
    }
    await fila(/comunicaciones/i).first().waitFor({ timeout: 10000 })
    for (const re of [/comunicaciones/i, /hidrogr/i, /poblaciones/i]) assert.equal(await fila(re).locator('.sid-tm').count(), 1, 'panel en ' + re)
    assert.equal(await fila(/elevaciones/i).locator('.sid-tm').count(), 0, 'Elevaciones no lleva herramienta')
    const total = (destino) => page.evaluate((k) => window.__SIDECEME_IMPORT_STATE.getResultados()?.[k]?.total ?? 0, destino)
    const nVer = (re) => fila(re).locator('.ver-n').first().innerText()
    const antes = { com: await total('comunicaciones'), hid: await total('hidrografico'), pob: await total('poblaciones') }
    await foto('1-filas')

    const caja = await page.locator('.mapa-principal').first().boundingBox()
    // Zona libre de la carta (sin paneles encima): x 0,26–0,70 · y 0,42–0,86 de la pantalla.
    const P = (fx, fy) => [caja.x + caja.width * (0.26 + 0.44 * fx), caja.y + caja.height * (0.42 + 0.44 * fy)]
    const clic = async ([x, y]) => { await page.mouse.click(x, y); await page.waitForTimeout(320) }

    // 1 · Camino clandestino (3 puntos + doble clic).
    await fila(/comunicaciones/i).locator('button', { hasText: 'Dibujar camino' }).click()
    await page.locator('.sid-tm-barra').waitFor()
    await clic(P(0.35, 0.40)); await clic(P(0.50, 0.48))
    const [x3, y3] = P(0.62, 0.42)
    await page.mouse.dblclick(x3, y3) // doble clic en un lugar nuevo: pone el último punto y termina
    await page.locator('.sid-tm-modal').waitFor()
    await foto('2-clasificar-camino')
    await page.locator('.sid-tm-modal input[value="clnd"]').check()
    await page.locator('.sid-tm-modal [data-nom]').fill('Camino clandestino Pampa')
    await page.locator('.sid-tm-modal [data-si]').click()
    await page.waitForTimeout(600)
    let r = await page.evaluate(() => window.__SIDECEME_IMPORT_STATE.getResultados())
    const camino = r.comunicaciones.fc.features.find((f) => f.properties._sideceme_manual)
    assert.ok(camino, 'el camino quedó en Comunicaciones')
    assert.equal(camino.geometry.type, 'LineString')
    assert.equal(camino.geometry.coordinates.length, 3, 'tres vértices (el doble clic no duplica)')
    assert.equal(camino._capaId, 'comunicaciones_caminos')
    assert.equal(camino.properties.fclass, 'track')
    assert.equal(camino.properties.Clandestino, 'Sí')
    assert.equal(r.comunicaciones.total, antes.com + 1)
    assert.equal(r.comunicaciones.porCapa.comunicaciones_caminos, 1)
    assert.equal(await nVer(/comunicaciones/i), String(antes.com + 1), 'el contador de la fila sube')
    for (const k of ['hidrografico', 'poblaciones']) assert.ok(!r[k].fc.features.some((f) => f.properties._sideceme_manual), 'nada en ' + k)

    // 2 · Camino normal Vía 3 con Enter.
    await fila(/comunicaciones/i).locator('button', { hasText: 'Dibujar camino' }).click()
    await clic(P(0.30, 0.65)); await clic(P(0.45, 0.70))
    await page.keyboard.press('Enter')
    await page.locator('.sid-tm-modal').waitFor()
    assert.ok(await page.locator('.sid-tm-modal input[value="via3"]').isChecked(), 'Vía 3 por defecto')
    await page.locator('.sid-tm-modal [data-si]').click()
    await page.waitForTimeout(500)

    // 3 · Laguna: 4 puntos, cerrar con clic en el primer vértice; elegir bofedal.
    await fila(/hidrogr/i).locator('button', { hasText: 'Laguna' }).click()
    for (const p of [P(0.66, 0.25), P(0.78, 0.25), P(0.80, 0.36), P(0.67, 0.37)]) await clic(p)
    await foto('3-dibujando-laguna')
    await clic(P(0.66, 0.25))
    await page.locator('.sid-tm-modal').waitFor()
    await page.locator('.sid-tm-modal input[value="bof"]').check()
    await page.locator('.sid-tm-modal [data-nom]').fill('Bofedal Kollpa')
    await page.locator('.sid-tm-modal [data-si]').click()
    await page.waitForTimeout(500)

    // 4 · Río (línea) con ✔ Terminar.
    await fila(/hidrogr/i).locator('button', { hasText: 'Río' }).click()
    await clic(P(0.20, 0.20)); await clic(P(0.28, 0.30))
    { const [x, y] = P(0.25, 0.42); await page.mouse.dblclick(x, y) } // doble clic termina el río
    await page.locator('.sid-tm-modal').waitFor()
    await page.locator('.sid-tm-modal [data-nom]').fill('Río Nuevo')
    await page.locator('.sid-tm-modal [data-si]').click()
    await page.waitForTimeout(500)

    // 5 · Pueblo: polígono + punto de aldea.
    await fila(/poblaciones/i).locator('button', { hasText: 'Pueblo (área)' }).click()
    for (const p of [P(0.40, 0.15), P(0.50, 0.15), P(0.50, 0.25)]) await clic(p) // el tercero cae sobre un ícono de la carta: igual cuenta
    { const [x, y] = P(0.40, 0.25); await page.mouse.dblclick(x, y) } // doble clic cierra el polígono
    await page.locator('.sid-tm-modal').waitFor()
    assert.equal(await page.locator('.sid-tm-modal [data-punto]').inputValue(), 'village')
    await page.locator('.sid-tm-modal [data-nom]').fill('Caserío Villa Nueva')
    await foto('4-clasificar-pueblo')
    await page.locator('.sid-tm-modal [data-si]').click()
    await page.waitForTimeout(800)

    r = await page.evaluate(() => window.__SIDECEME_IMPORT_STATE.getResultados())
    const man = (k) => r[k].fc.features.filter((f) => f.properties._sideceme_manual)
    assert.deepEqual(man('comunicaciones').map((f) => f._capaId).sort(), ['comunicaciones_caminos', 'comunicaciones_vias'])
    assert.deepEqual(man('hidrografico').map((f) => [f._capaId, f.properties.fclass]).sort(), [['hidro_lineas', 'river'], ['hidro_poligonos', 'wetland']])
    assert.deepEqual(man('poblaciones').map((f) => [f._capaId, f.properties.fclass]).sort(), [['poblaciones_areas', 'residential'], ['poblaciones_puntos', 'village']])
    for (const [k, n] of [['comunicaciones', 2], ['hidrografico', 2], ['poblaciones', 2]]) {
      for (const f of man(k)) assert.equal(f.properties._sideceme_destino, k, 'sin mezclar: ' + k)
      assert.equal(r[k].total, { comunicaciones: antes.com, hidrografico: antes.hid, poblaciones: antes.pob }[k] + n)
    }
    const lag = man('hidrografico').find((f) => f.geometry.type === 'Polygon').geometry.coordinates[0]
    assert.equal(lag.length, 5, 'laguna: 4 vértices + cierre')
    assert.equal(man('hidrografico').find((f) => f.geometry.type === 'LineString').geometry.coordinates.length, 3, 'río: 3 puntos, el doble clic no duplica')
    assert.equal(man('poblaciones').find((f) => f.geometry.type === 'Polygon').geometry.coordinates[0].length, 5, 'pueblo: 4 vértices + cierre')
    assert.deepEqual(lag[0], lag[4])
    // La lista de la fila.
    await fila(/comunicaciones/i).locator('[data-a="plegar"]').click()
    assert.equal(await fila(/comunicaciones/i).locator('.sid-tm-item').count(), 2)
    await fila(/poblaciones/i).locator('[data-a="plegar"]').click()
    assert.equal(await fila(/poblaciones/i).locator('.sid-tm-item').count(), 1, 'el pueblo (área + punto) es un solo trazo')
    await foto('5-todo-dibujado')

    // 6 · Análisis: la consulta del análisis y los datos de la IA reciben los trazos en su subcapa.
    const an = await page.evaluate(() => {
      const G = window.SIDECEME_IMPORTAR_GE, res = window.__SIDECEME_IMPORT_STATE.getResultados()
      const c = G.sumarAConsulta({ comunicaciones_caminos: { type: 'FeatureCollection', features: [] } }, res, ['comunicaciones_vias', 'comunicaciones_caminos', 'hidro_lineas', 'hidro_poligonos', 'poblaciones_areas', 'poblaciones_puntos'])
      const n = (k) => (c[k]?.features || []).filter((f) => f.properties._sideceme_manual).map((f) => f.properties.fclass)
      return { vias: n('comunicaciones_vias'), caminos: n('comunicaciones_caminos'), rios: n('hidro_lineas'), lagos: n('hidro_poligonos'), areas: n('poblaciones_areas'), puntos: n('poblaciones_puntos') }
    })
    assert.deepEqual(an, { vias: ['unclassified'], caminos: ['track'], rios: ['river'], lagos: ['wetland'], areas: ['residential'], puntos: ['village'] })

    // 7 · «⚡ Generar calcos» de nuevo: la app llama a preservarImportados(nuevo, anterior).
    const regen = await page.evaluate(() => {
      const ant = window.__SIDECEME_IMPORT_STATE.getResultados()
      const nuevo = { comunicaciones: { fc: { type: 'FeatureCollection', features: [ant.comunicaciones.fc.features[0]] }, total: 1, porCapa: { comunicaciones_vias: 1 } } }
      const out = window.SIDECEME_IMPORTAR_GE.preservarImportados(nuevo, ant)
      return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.fc.features.filter((f) => f.properties._sideceme_manual).length]))
    })
    assert.deepEqual(regen, { comunicaciones: 2, hidrografico: 2, poblaciones: 2 })

    // 8 · Se guarda con el ejercicio (autoguardado).
    await page.waitForTimeout(5000)
    const g = await leerGuardado(page, ej.nombre)
    const gm = (k) => (g?.resultados?.[k]?.fc?.features || []).filter((f) => f.properties?._sideceme_manual).length
    assert.deepEqual([gm('comunicaciones'), gm('hidrografico'), gm('poblaciones')], [2, 2, 2], 'guardado en el ejercicio')

    // 9 · Editar: cambiar el clandestino a Vía 2 → pasa a comunicaciones_vias.
    const itemClnd = fila(/comunicaciones/i).locator('.sid-tm-item', { hasText: 'Pampa' })
    await itemClnd.locator('[data-a="datos"]').click()
    await page.locator('.sid-tm-modal input[value="via2"]').check()
    await page.locator('.sid-tm-modal [data-si]').click()
    await page.waitForTimeout(500)
    r = await page.evaluate(() => window.__SIDECEME_IMPORT_STATE.getResultados())
    const pampa = r.comunicaciones.fc.features.filter((f) => f.properties.Nombre === 'Camino clandestino Pampa')
    assert.equal(pampa.length, 1)
    assert.equal(pampa[0]._capaId, 'comunicaciones_vias')
    assert.equal(pampa[0].properties.fclass, 'secondary')
    assert.equal(pampa[0].geometry.coordinates.length, 3, 'conserva la forma')
    // Editar forma: arrastrar un vértice.
    await fila(/comunicaciones/i).locator('.sid-tm-item', { hasText: 'Pampa' }).locator('[data-a="forma"]').click()
    await page.locator('.sid-tm-vertice').first().waitFor()
    const v = await page.locator('.sid-tm-vertice').nth(1).boundingBox()
    await page.mouse.move(v.x + 7, v.y + 7); await page.mouse.down(); await page.mouse.move(v.x + 60, v.y + 70, { steps: 8 }); await page.mouse.up()
    await foto('6-editando-forma')
    await page.locator('.sid-tm-barra [data-a="ok"]').click()
    await page.waitForTimeout(500)
    const pampa2 = await page.evaluate(() => window.__SIDECEME_IMPORT_STATE.getResultados().comunicaciones.fc.features.find((f) => f.properties.Nombre === 'Camino clandestino Pampa'))
    assert.notDeepEqual(pampa2.geometry.coordinates[1], pampa[0].geometry.coordinates[1], 'el vértice se movió')
    assert.equal(pampa2.properties._sideceme_trazo, pampa[0].properties._sideceme_trazo, 'mismo trazo')
    // Borrar el pueblo: se van el área y el punto.
    await fila(/poblaciones/i).locator('.sid-tm-item [data-a="borrar"]').click()
    await page.waitForTimeout(500)
    r = await page.evaluate(() => window.__SIDECEME_IMPORT_STATE.getResultados())
    assert.equal(r.poblaciones.fc.features.filter((f) => f.properties._sideceme_manual).length, 0)
    assert.equal(r.poblaciones.total, antes.pob)
    assert.equal(r.poblaciones.porCapa.poblaciones_puntos, 1)
    // Cancelar con Esc no agrega nada.
    await fila(/hidrogr/i).locator('button', { hasText: 'Río' }).click()
    await clic(P(0.2, 0.6)); await clic(P(0.3, 0.6))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    assert.equal(await page.locator('.sid-tm-barra').count(), 0)
    assert.equal(await total('hidrografico'), antes.hid + 2)
    await foto('7-final')

    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log('trazos-manuales: OK')
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
