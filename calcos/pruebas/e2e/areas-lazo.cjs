// ✂️ La Mesa real en Chromium: el Profesor reparte el Área de Operaciones con el lazo
// (sin redibujar), entrega el área con lo que tiene dentro en un JSON y el escalón
// subordinado lo abre en su ejercicio. Capturas en pruebas/salidas-lazo/.
//   node calcos/pruebas/e2e/areas-lazo.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador')
const { ejercicioFicticio, unidad } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-lazo')
const leerOps = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.limites) && 'areaOps' in v ? v : undefined)
const leerUnidades = page => estadoReact(page, v => Array.isArray(v) && v.length && v.every(u => u && 'lat' in u && 'lng' in u && 'bando' in u) ? v : undefined)

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const origen = ejercicioFicticio({ conPlantilla: false })
  origen.nombre = 'FABBLE de prueba'
  // El área de la FF.TT.T.O. (10 × 8 km) partida por un límite de Cuerpo que sobresale
  // arriba y se queda corto abajo, con su punto de coordinación sobre el borde.
  origen.ops.areaOps = { ...origen.ops.areaOps, operacion: 'DEFENSA', unidad: 'FF.TT.T.O.' }
  origen.ops.limites = [
    { coords: [[-65.05, -16.975], [-65.05, -17.02], [-65.051, -17.0485]], escalon: 'cuerpo', tipo: 'magnitud' },
    { coords: [[-65.1, -16.98], [-65.0, -16.98]], escalon: 'ejercito', tipo: 'magnitud' },
  ]
  origen.ops.coordinacion = [{ centro: [-65.05, -16.98] }, { centro: [-65.0, -17.02] }]
  origen.ops.magnitudes = [{ centro: [-65.05, -17.0], escalon: 'cuerpo', rot: 90, origen: 'limite-0' }]
  origen.unidades.push({ ...unidad('fict-rojo', 'R.I. «ROJO» (FICT.)', 'infanteria', 'regimiento', -17.03, -65.02), bando: 'enemigo' })
  const { page, errores, cerrar } = await abrir()
  try {
    await sembrarYAbrir(page, origen)
    await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    const panel = page.getByRole('region', { name: 'Áreas del ejercicio' })
    await panel.waitFor()
    // La carta con el área a la izquierda del panel.
    // (Debajo de la barra de botones, que tapa el borde de arriba de la carta.)
    await page.evaluate(() => window.__mapa2d.fitBounds([[-16.97, -65.11], [-17.06, -64.99]], { paddingTopLeft: [340, 300], paddingBottomRight: [380, 80], animate: false }))
    await page.waitForTimeout(600)
    const pantalla = lista => page.evaluate(L => {
      const m = window.__mapa2d, r = m.getContainer().getBoundingClientRect()
      return L.map(([lng, lat]) => { const p = m.latLngToContainerPoint([lat, lng]); return [r.left + p.x, r.top + p.y] })
    }, lista)

    // 1 · Lazo a mano alzada, tosco, alrededor de la mitad este.
    await panel.getByRole('button', { name: '✂️ Seleccionar con lazo' }).click()
    assert.equal(await page.locator('.sid-lazo').count(), 1, 'la capa del lazo tapa la carta')
    const lazo = await pantalla([[-65.047, -17.056], [-65.046, -16.972], [-64.995, -16.972], [-64.993, -17.058], [-65.047, -17.056]])
    for (const [x, y] of lazo) assert.equal(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.className, [x, y]), 'sid-lazo', `el lazo se dibuja sobre la carta en ${x},${y}`)
    await page.mouse.move(...lazo[0]); await page.mouse.down()
    for (let i = 1; i < lazo.length; i++) await page.mouse.move(...lazo[i], { steps: 12 })
    await page.screenshot({ path: path.join(SALIDAS, '0-dibujando-el-lazo.png') })
    await page.mouse.up()
    await panel.getByRole('status').filter({ hasText: 'creada' }).waitFor()
    assert.equal(await page.locator('.sid-lazo').count(), 0, 'el lazo se apaga solo')
    let ops = await leerOps(page)
    assert.equal(ops.areasOps.length, 2)
    const este = ops.areaOps
    assert.equal(este.operacion, 'DEFENSA')
    const lngs = este.coords.map(p => p[0])
    assert.ok(Math.min(...lngs) >= -65.0511 && Math.min(...lngs) <= -65.0499, 'el borde oeste es el límite trazado')
    assert.ok(este.coords.some(p => p[0] === -65.05 && p[1] === -17.02), 'conserva los vértices del límite')
    await page.screenshot({ path: path.join(SALIDAS, '1-lazo-este.png') })
    const aviso = await panel.getByRole('status').innerText()
    assert.match(aviso, /Borde exacto de sus límites/)

    // 2 · Un toque dentro de la otra mitad la elige sola.
    await panel.getByLabel('Nombre del área').fill('CE-ESTE')
    await panel.getByRole('button', { name: '✂️ Seleccionar con lazo' }).click()
    const [toque] = await pantalla([[-65.08, -17.01]])
    await page.mouse.click(...toque)
    await page.waitForFunction(() => document.querySelectorAll('input[type=checkbox][aria-label^="Compartir "]').length === 3)
    ops = await leerOps(page)
    const oeste = ops.areaOps
    const comunes = oeste.coords.filter(p => este.coords.some(q => q[0] === p[0] && q[1] === p[1]))
    assert.ok(comunes.length >= 3, 'las dos áreas comparten los vértices del límite: encajan')
    await panel.getByLabel('Nombre del área').fill('CE-OESTE')

    // 3 · Entregar sólo CE-ESTE con lo que tiene dentro.
    for (const n of ['CE-OESTE']) await panel.getByLabel(`Compartir ${n}`, { exact: true }).uncheck()
    await panel.getByLabel('Compartir CE-ESTE', { exact: true }).check()
    const lleva = await panel.getByRole('group', { name: 'Qué se entrega con las áreas' }).innerText()
    assert.match(lleva, /1 límite\(s\).*2 punto\(s\) de coordinación.*1 ficha\(s\) propia\(s\) · 1 ficha\(s\) enemiga\(s\)/s, lleva)
    await page.screenshot({ path: path.join(SALIDAS, '2-que-se-entrega.png') })
    const descarga = page.waitForEvent('download')
    await panel.getByRole('button', { name: 'Descargar copia JSON de las áreas' }).click()
    const d = await descarga
    assert.equal(d.suggestedFilename(), 'AO_CE-ESTE.json')
    const bytes = fs.readFileSync(await d.path())
    const p = JSON.parse(bytes)
    assert.deepEqual(p.areas.map(a => a.nombre), ['CE-ESTE'])
    assert.equal(p.contenido.ops.limites.length, 1, 'su límite; no el de la FF.TT.T.O.')
    assert.deepEqual(p.contenido.unidades.map(u => u.id).sort(), ['fict-bravo', 'fict-rojo'])
    assert.equal(p.contenido.ops.magnitudes[0].origen, 'limite-0')
    assert.equal(p.planFuegos, undefined)

    // 4 · El escalón subordinado lo abre en su ejercicio (vacío).
    const destino = { version: 1, nombre: 'CE-ESTE de prueba', unidades: [], ops: { limites: [], coordinacion: [], pasaje: [], tareas: [], magnitudes: [], areaOps: null } }
    await sembrarYAbrir(page, destino)
    let panel2 = page.getByRole('region', { name: 'Áreas del ejercicio' })
    if (!await panel2.count()) await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    await panel2.locator('input[type=file]').setInputFiles({ name: 'AO_CE-ESTE.json', mimeType: 'application/json', buffer: bytes })
    await panel2.getByRole('status').filter({ hasText: 'incorporada' }).waitFor()
    ops = await leerOps(page)
    assert.equal(ops.areaOps.nombre, 'CE-ESTE')
    assert.equal(ops.limites.length, 1); assert.equal(ops.coordinacion.length, 2); assert.equal(ops.magnitudes.length, 1)
    const fichas = await leerUnidades(page)
    assert.deepEqual(fichas.map(u => u.designacion).sort(), ['R.C. «BRAVO» (FICT.)', 'R.I. «ROJO» (FICT.)'])
    await page.evaluate(() => window.__mapa2d.fitBounds([[-16.97, -65.06], [-17.06, -64.99]], { paddingBottomRight: [380, 40], animate: false }))
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SALIDAS, '3-recibido.png') })
    assert.deepEqual(errores, [])
    console.log('E2E lazo: lazo a mano alzada y toque cortan por el límite (las áreas encajan), entrega JSON con su contenido y el subordinado la abre con sus fichas. Sin errores JS.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error('DIAGNOSTICO', await page.getByRole('region', { name: 'Áreas del ejercicio' }).innerText().catch(() => ''), errores)
    throw e
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
