// 💾 La Mesa real en Chromium (11-10-2026; con la ✂️ tijera de la barra desde el 16-10-2026): el
// Profesor corta la zona del CE-III, la guarda con «✓ Cortar y guardar» (idéntica al recorte, con todo lo que está activo:
// fichas propias y enemigas, las medidas de adentro y el CMOC a la vista), baja su JSON y otro
// ejercicio lo abre con su área de empeño. Además: las líneas de fase y las AE de la IA no reparten
// el área, y las áreas de empeño se borran desde «Qué se ve en el calco» aunque el panel ▧ esté
// abierto (con la herramienta de dibujo puesta, la carta no las deja tocar). Capturas en
// pruebas/salidas-seleccion/.
//   node calcos/pruebas/e2e/areas-seleccion.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador')
const { ejercicioFicticio, unidad } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-seleccion')
const leerOps = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.limites) && 'areaOps' in v ? v : undefined)
const leerCmoc = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.ae) && Array.isArray(v.restringido) ? v : undefined)

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const origen = ejercicioFicticio({ conPlantilla: false })
  origen.nombre = 'FABBLE con selecciones'
  // El área de la FF.TT.T.O. (10 × 8 km) en tres Cuerpos (dos límites de Cuerpo), cruzada por una
  // línea de fase y con un área de empeñamiento de la IA en la zona este.
  origen.ops.areaOps = { ...origen.ops.areaOps, id: 'ao-fabble', nombre: 'FABBLE', operacion: 'DEFENSA', unidad: 'FF.TT.T.O.' }
  origen.ops.limites = [
    { coords: [[-65.066, -16.975], [-65.066, -17.055]], escalon: 'cuerpo', tipo: 'magnitud' },
    { coords: [[-65.033, -16.975], [-65.033, -17.055]], escalon: 'cuerpo', tipo: 'magnitud' },
    { coords: [[-65.1, -17.0], [-65.0, -17.0]], tipo: 'simple', nombre: 'LF ALFA', origen: 'ogo-ia' },
    { coords: [[-65.025, -17.02], [-65.01, -17.02], [-65.01, -17.035], [-65.025, -17.035], [-65.025, -17.02]], tipo: 'punteada', nombre: 'AE-1', origen: 'ogo-ia' },
  ]
  origen.ops.coordinacion = [{ centro: [-65.033, -16.98] }]
  // CMOC: un área de empeño en la zona este y otra en la oeste.
  origen.cmoc = { restringido: [], severo: [], defensivo: [], corredores: [], avenidas: [], clave: [], desplazamientos: [],
    ae: [{ coords: [[-65.02, -17.005], [-65.008, -17.005], [-65.008, -17.015], [-65.02, -17.015]], centro: [-65.014, -17.01] },
      { coords: [[-65.095, -17.03], [-65.08, -17.03], [-65.08, -17.04], [-65.095, -17.04]], centro: [-65.0875, -17.035] }] }
  origen.unidades = [
    unidad('fict-este', 'R.I. «ESTE» (FICT.)', 'infanteria', 'regimiento', -17.03, -65.02),
    unidad('fict-oeste', 'R.I. «OESTE» (FICT.)', 'infanteria', 'regimiento', -17.03, -65.09),
    { ...unidad('fict-rojo', 'R.I. «ROJO» (FICT.)', 'infanteria', 'regimiento', -16.99, -65.015), bando: 'enemigo' },
  ]
  const { page, errores, cerrar } = await abrir()
  try {
    await sembrarYAbrir(page, origen)
    await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    const panel = page.getByRole('region', { name: 'Áreas del ejercicio' })
    await panel.waitFor()
    await page.evaluate(() => window.__mapa2d.fitBounds([[-16.97, -65.11], [-17.06, -64.99]], { paddingTopLeft: [340, 300], paddingBottomRight: [380, 80], animate: false }))
    await page.waitForTimeout(600)
    const pantalla = lista => page.evaluate(L => {
      const m = window.__mapa2d, r = m.getContainer().getBoundingClientRect()
      return L.map(([lng, lat]) => { const p = m.latLngToContainerPoint([lat, lng]); return [r.left + p.x, r.top + p.y] })
    }, lista)

    // 1 · Las AE numeradas en la carta y el borrado desde «Qué se ve en el calco», con el panel ▧ abierto.
    const rotulos = await page.locator('.tt-ae').allInnerTexts()
    assert.deepEqual([...new Set(rotulos)].sort(), ['AE 1', 'AE 2'], 'cada AE con su número en la carta')
    const chipsAE = page.getByRole('button', { name: /^🗑 AE \d$/ })
    assert.equal(await chipsAE.count(), 2, 'la lista de las AE para borrar')
    await page.getByRole('button', { name: '🗑 AE 2' }).click()
    let cm = await leerCmoc(page)
    assert.equal(cm.ae.length, 1, 'se borró el AE 2 (con el panel ▧ abierto)')
    assert.equal(cm.ae[0].centro[0], -65.014, 'queda el AE del este')

    // 2 · La tijera (botón de la barra) en la zona este: por los límites, sin cortar por la LF ni por el AE-1 de la IA.
    await page.getByRole('button', { name: '✂️ Cortar área' }).click()
    const lazo = await pantalla([[-65.036, -17.057], [-65.035, -16.972], [-64.996, -16.972], [-64.994, -17.058], [-65.036, -17.057]])
    await page.mouse.move(...lazo[0]); await page.mouse.down()
    for (let i = 1; i < lazo.length; i++) await page.mouse.move(...lazo[i], { steps: 12 })
    await page.mouse.up()
    const vista = page.getByRole('region', { name: 'Tijera · vista previa' })
    await vista.waitFor()
    const texto = await vista.innerText()
    assert.match(texto, /Por los límites de las unidades\./, texto)
    assert.doesNotMatch(texto, /zonas unidas/, 'una sola zona: la línea de fase y el AE de la IA no la parten')
    assert.match(texto, /1 área\(s\) de empeño \(CMOC\)/, texto)
    assert.match(texto, /1 ficha\(s\) propia\(s\) · 1 ficha\(s\) enemiga\(s\)/, texto)
    await page.screenshot({ path: path.join(SALIDAS, '1-recorte.png') })

    // 3 · ✓ Cortar y guardar, con su nombre: el área y la selección guardada, idénticas.
    await vista.getByLabel('Nombre de la selección').fill('CE-III')
    await vista.getByRole('button', { name: '✓ Cortar y guardar selección' }).click()
    await page.getByRole('region', { name: 'Tijera' }).getByRole('status').filter({ hasText: 'guardada' }).waitFor()
    let ops = await leerOps(page)
    const recortada = ops.areaOps
    const lngs = recortada.coords.map(p => p[0])
    assert.ok(Math.min(...lngs) >= -65.0331 && Math.min(...lngs) <= -65.0329, 'el borde oeste es el límite del Cuerpo')
    assert.ok(Math.abs(Math.max(...recortada.coords.map(p => p[1])) - -16.98) < 1e-6 && Math.abs(Math.min(...recortada.coords.map(p => p[1])) - -17.05) < 1e-6, 'de borde a borde del área (no se queda en la LF)')
    assert.equal(ops.selecciones.length, 1)
    const sel = ops.selecciones[0]
    assert.equal(sel.nombre, 'CE-III'); assert.equal(sel.areaId, recortada.id)
    assert.deepEqual(sel.coords, recortada.coords, 'idéntica a lo que se recortó')
    assert.deepEqual(sel.opciones, { contenido: true, enemigo: true, cmoc: true })
    assert.deepEqual(sel.capasCmoc, ['ae'], 'las capas del CMOC que estaban a la vista')
    assert.ok(sel.tijera && sel.tijera.lazo.length >= 3, 'con el trazo de la tijera')
    assert.equal(ops.areaOps.nombre, 'CE-III', 'el área toma el nombre de la selección')
    await page.getByRole('region', { name: 'Tijera' }).getByRole('button', { name: 'Cerrar' }).click()
    const lista = panel.getByRole('group', { name: 'Selecciones guardadas' })
    assert.match(await lista.innerText(), /CE-III[\s\S]*✂️ Cortada con la tijera[\s\S]*1 ficha\(s\) propia\(s\) · 1 ficha\(s\) enemiga\(s\) · 1 área\(s\) de empeño \(CMOC\)/)
    await page.screenshot({ path: path.join(SALIDAS, '2-guardada.png') })

    // 4 · ⬇️ su JSON: el área idéntica y todo lo activo.
    const descarga = page.waitForEvent('download')
    await lista.getByRole('button', { name: '⬇️ JSON' }).click()
    const d = await descarga
    assert.equal(d.suggestedFilename(), 'Seleccion_CE-III.json')
    const bytes = fs.readFileSync(await d.path())
    const p = JSON.parse(bytes)
    assert.equal(p.tipoArchivo, 'sideceme-areas-operaciones')
    assert.deepEqual(p.areas.map(a => a.nombre), ['CE-III'])
    assert.deepEqual(p.areas[0].coords, sel.coords)
    assert.deepEqual(p.contenido.unidades.map(u => u.id).sort(), ['fict-este', 'fict-rojo'])
    assert.equal(p.contenido.cmoc.ae.length, 1)
    assert.ok(p.contenido.ops.limites.some(l => l.nombre === 'AE-1') && p.contenido.ops.limites.some(l => l.nombre === 'LF ALFA'), 'las medidas de adentro van')
    assert.equal(p.seleccion.nombre, 'CE-III')

    // 5 · Lo abre otro ejercicio: el área, sus fichas y el área de empeño del CMOC.
    const destino = { version: 1, nombre: 'CE-III de prueba', unidades: [], ops: { limites: [], coordinacion: [], pasaje: [], tareas: [], magnitudes: [], areaOps: null } }
    await sembrarYAbrir(page, destino)
    const panel2 = page.getByRole('region', { name: 'Áreas del ejercicio' })
    if (!await panel2.count()) await page.getByRole('button', { name: /ÁREA DE OPS/i }).first().dispatchEvent('click')
    await panel2.locator('input[type=file]').setInputFiles({ name: 'Seleccion_CE-III.json', mimeType: 'application/json', buffer: bytes })
    await panel2.getByRole('status').filter({ hasText: 'incorporada' }).waitFor()
    ops = await leerOps(page)
    assert.equal(ops.areaOps.nombre, 'CE-III')
    cm = await leerCmoc(page)
    assert.equal(cm.ae.length, 1, 'llega el área de empeño')
    await page.screenshot({ path: path.join(SALIDAS, '3-recibida.png') })
    assert.deepEqual(errores, [])
    console.log('E2E selección: la tijera corta por los límites (no por la LF ni el AE de la IA), «✓ Cortar y guardar» la guarda idéntica con todo lo activo, su JSON lleva el CMOC a la vista y otro ejercicio la abre; las AE se borran con el panel ▧ abierto. Sin errores JS.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error('DIAGNOSTICO', await page.getByRole('region', { name: 'Áreas del ejercicio' }).innerText().catch(() => ''), errores)
    throw e
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
