// ✂️ La Mesa real en Chromium (16-10-2026): la tijera de la barra principal, con un FABBLE ficticio
// armado como el FABBLE 1.1 de Sergio: frontera dentada al oeste, una franja entre la frontera y el
// primer límite, dos Cuerpos partidos por un límite de Cuerpo, una franja de la FF.TT. al este y dos
// brigadas rojas FUERA del área (una dentro del lazo y otra no). Se corta el Cuerpo de arriba con un
// lazo tosco que se pasa al Cuerpo de abajo y al frente enemigo:
//   · el botón «✂️ Cortar área» está en la barra (no sólo en el panel ▧);
//   · la vista previa pinta lo que se corta y un toque saca o vuelve a sumar una zona;
//   · «✓ Cortar y guardar» deja el área (por los límites) y su selección con el lazo;
//   · el JSON lleva las líneas cortadas donde pasó el lazo (sin entrar al Cuerpo de abajo), la
//     brigada roja que encerró el lazo, el clandestino de arriba y los calcos del terreno prendidos,
//     cortados; y «📂 Abrir archivo JSON» los abre con el lazo como Área de Interés.
// Capturas en pruebas/salidas-tijera/.
//   node calcos/pruebas/e2e/areas-tijera.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador')
const { ejercicioFicticio, unidad } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-tijera')
const leerOps = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.limites) && 'areaOps' in v ? v : undefined)
const minLat = c => Math.min(...c.map(p => p[1])), maxLat = c => Math.max(...c.map(p => p[1]))
const casi = (a, b, tol, msj) => assert.ok(Math.abs(a - b) <= tol, `${msj}: ${a} ≠ ${b}`)

function fabble() {
  const e = ejercicioFicticio({ conPlantilla: false })
  e.nombre = 'FABBLE tijera'
  const contorno = [[-65.1, -16.975], [-64.99, -16.975], [-64.99, -17.055], [-65.1, -17.055], [-65.106, -17.035], [-65.097, -17.015], [-65.105, -16.995]]
  e.ops.areaOps = { ...e.ops.areaOps, id: 'ao-fabble', nombre: 'FABBLE', unidad: 'FF.TT.T.O.', operacion: 'DEFENSA', coords: contorno, frente: [contorno[3], contorno[4], contorno[5], contorno[6], contorno[0]] }
  e.ops.limites = [
    // El límite entre los dos Cuerpos (con magnitud), de la frontera hasta la línea del este.
    { coords: [[-65.109, -17.012], [-65.07, -17.01], [-65.04, -17.016], [-65.005, -17.012]], escalon: 'cuerpo', tipo: 'magnitud' },
    // La línea del oeste (deja la franja de la frontera) y la del este (la franja de la FF.TT.), de borde a borde.
    { coords: [[-65.088, -16.97], [-65.086, -17.0], [-65.083, -17.03], [-65.085, -17.058]], escalon: 'cuerpo', tipo: 'simple' },
    { coords: [[-65.005, -16.97], [-65.006, -17.0], [-65.004, -17.03], [-65.005, -17.058]], escalon: 'cuerpo', tipo: 'simple' },
  ]
  e.ops.magnitudes = [{ centro: [-65.055, -17.013], escalon: 'cuerpo', rot: 0, origen: 'limite-0' }]
  e.ops.coordinacion = [{ centro: [-65.0846, -17.0103] }, { centro: [-65.005, -17.012] }, { centro: [-65.085, -17.055] }]
  e.unidades = [
    unidad('ce-arriba', 'CE «ARRIBA» (FICT.)', 'infanteria', 'cuerpo', -16.99, -65.05),
    unidad('ce-abajo', 'CE «ABAJO» (FICT.)', 'infanteria', 'cuerpo', -17.035, -65.05),
    unidad('fftt', 'AGR. ART. FF.TT. (FICT.)', 'artilleria', 'brigada', -17.0, -64.996),
    { ...unidad('br-iii', 'BR. III (FICT.)', 'blindada', 'brigada', -16.99, -65.125), bando: 'enemigo' },
    { ...unidad('br-vi', 'BR. VI (FICT.)', 'mecanizada', 'brigada', -17.045, -65.125), bando: 'enemigo' },
  ]
  e.cmoc = { restringido: [], severo: [], defensivo: [], corredores: [], avenidas: [], clave: [], desplazamientos: [], ae: [],
    corredoresClandestinos: [
      { bando: 'enemigo', coords: [[-65.06, -16.985], [-65.03, -16.99]], clandestino: true, escalon: 'seccion' },
      { bando: 'enemigo', coords: [[-65.06, -17.04], [-65.03, -17.045]], clandestino: true, escalon: 'seccion' },
    ] }
  const fc = features => ({ type: 'FeatureCollection', features })
  e.resultados = {
    comunicaciones: { fc: fc([{ type: 'Feature', _capaId: 'comunicaciones_vias', geometry: { type: 'LineString', coordinates: [[-65.06, -16.98], [-65.06, -17.05]] }, properties: { Nombre: 'Camino (FICT.)' } }]), total: 1, porCapa: { comunicaciones_vias: 1 } },
    poblaciones: { fc: fc([
      { type: 'Feature', _capaId: 'poblaciones_puntos', geometry: { type: 'Point', coordinates: [-65.045, -16.995] }, properties: { Nombre: 'Arriba (FICT.)' } },
      { type: 'Feature', _capaId: 'poblaciones_puntos', geometry: { type: 'Point', coordinates: [-65.045, -17.04] }, properties: { Nombre: 'Abajo (FICT.)' } },
    ]), total: 2, porCapa: { poblaciones_puntos: 2 } },
    vegetacion: { fc: fc([{ type: 'Feature', _capaId: 'vegetacion', geometry: { type: 'Polygon', coordinates: [[[-65.03, -17.0], [-65.02, -17.0], [-65.02, -17.025], [-65.03, -17.025], [-65.03, -17.0]]] }, properties: { Nombre: 'Monte (FICT.)' } }]), total: 1, porCapa: { vegetacion: 1 } },
  }
  return e
}

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const { page, errores, cerrar } = await abrir()
  page.on('dialog', d => d.accept(d.defaultValue()))
  try {
    await sembrarYAbrir(page, fabble())
    // Los calcos del terreno prendidos (👁 Ver todos, en «Qué se ve en el calco»).
    await page.getByRole('button', { name: '👁 Ver todos' }).first().click()
    await page.evaluate(() => window.__mapa2d.fitBounds([[-16.965, -65.135], [-17.065, -64.985]], { paddingTopLeft: [300, 260], paddingBottomRight: [420, 60], animate: false }))
    await page.waitForTimeout(700)
    const pantalla = lista => page.evaluate(L => {
      const m = window.__mapa2d, r = m.getContainer().getBoundingClientRect()
      return L.map(([lng, lat]) => { const p = m.latLngToContainerPoint([lat, lng]); return [r.left + p.x, r.top + p.y] })
    }, lista)

    // 1 · El botón está en la barra principal (el panel ▧ no está abierto).
    assert.equal(await page.getByRole('region', { name: 'Áreas del ejercicio' }).count(), 0, 'el panel ▧ está cerrado')
    const boton = page.getByRole('button', { name: '✂️ Cortar área' })
    assert.equal(await boton.count(), 1, 'el botón de la tijera en la barra')
    await boton.click()
    await page.getByRole('region', { name: 'Tijera' }).filter({ hasText: 'Encierre a mano alzada' }).waitFor()

    // 2 · Un lazo tosco: el Cuerpo de arriba, pasándose 3 km al de abajo y hasta la Br. III (afuera, al oeste).
    const lazo = await pantalla([[-65.135, -16.966], [-64.998, -16.966], [-64.998, -17.025], [-65.135, -17.025], [-65.135, -16.966]])
    await page.mouse.move(...lazo[0]); await page.mouse.down()
    for (let i = 1; i < lazo.length; i++) await page.mouse.move(...lazo[i], { steps: 14 })
    await page.mouse.up()
    const vista = page.getByRole('region', { name: 'Tijera · vista previa' })
    await vista.waitFor()
    let texto = await vista.innerText()
    assert.match(texto, /Área nueva dentro de «FABBLE»\. Por los límites de las unidades \(2 zonas unidas\)\./, texto)
    assert.match(texto, /1 ficha\(s\) enemiga\(s\)/, 'la brigada roja que encerró el lazo')
    assert.match(texto, /1 corredor\(es\) clandestino\(s\)/, 'sólo el clandestino de arriba')
    assert.match(texto, /calco de comunicaciones/, 'los calcos del terreno prendidos')
    assert.equal(await page.locator('.sid-tijera-vista polygon').count() >= 5, true, 'las zonas, el área y el trazo en la carta')
    await page.screenshot({ path: path.join(SALIDAS, '1-vista-previa.png') })

    // 3 · Un toque en la franja de la frontera la saca; otro la vuelve a sumar.
    const [franja] = await pantalla([[-65.095, -16.99]])
    await page.mouse.click(...franja)
    await vista.filter({ hasText: 'Por los límites de las unidades.' }).waitFor()
    await page.screenshot({ path: path.join(SALIDAS, '2-sin-la-franja.png') })
    await page.mouse.click(...franja)
    await vista.filter({ hasText: '(2 zonas unidas)' }).waitFor()

    // 4 · ✓ Cortar y guardar, con su nombre.
    assert.equal(await vista.getByLabel('Nombre de la selección').inputValue(), 'CE-I', 'el nombre sale de los límites de Cuerpo que la rodean')
    await vista.getByLabel('Nombre de la selección').fill('CE-I')
    await vista.getByRole('button', { name: '✓ Cortar y guardar selección' }).click()
    const lista = page.getByRole('region', { name: 'Tijera' })
    await lista.getByRole('status').filter({ hasText: '«CE-I» guardada' }).waitFor()
    const ops = await leerOps(page)
    const sel = ops.selecciones.find(s => s.nombre === 'CE-I')
    assert.ok(sel && sel.tijera && sel.tijera.lazo.length >= 3, 'la selección guarda el trazo del lazo')
    assert.deepEqual(sel.tijera.vista.calcos.sort(), ['comunicaciones', 'poblaciones', 'vegetacion'], 'y los calcos que se veían')
    const area = ops.areasOps.find(a => a.id === sel.areaId)
    assert.equal(area.nombre, 'CE-I')
    casi(minLat(area.coords), -17.016, 1e-6, 'el área llega hasta el límite entre los Cuerpos (no hasta el lazo)')
    casi(Math.max(...area.coords.map(p => p[0])), -65.0055, 1e-3, 'y hasta la línea del este (la franja de la FF.TT. queda afuera)')
    await page.screenshot({ path: path.join(SALIDAS, '3-guardada.png') })

    // 5 · ⬇️ El JSON: cortado por donde pasó la tijera.
    const descarga = page.waitForEvent('download')
    await lista.getByRole('button', { name: '⬇️ Bajar el JSON de la selección' }).click()
    const d = await descarga
    assert.equal(d.suggestedFilename(), 'Seleccion_CE-I.json')
    const bytes = fs.readFileSync(await d.path())
    const p = JSON.parse(bytes)
    const L = p.contenido.ops.limites
    assert.equal(L.length, 3, 'las tres líneas, cada una en su pedazo')
    const oeste = L.find(l => l.tipo === 'simple' && l.coords[0][0] < -65.08), este = L.find(l => l.tipo === 'simple' && l.coords[0][0] > -65.01)
    casi(minLat(oeste.coords), -17.01081, 5e-5, 'la línea del oeste se corta en el límite de los Cuerpos (no sigue hasta el fondo)')
    casi(minLat(este.coords), -17.012, 5e-5, 'la del este, también')
    casi(maxLat(oeste.coords), -16.97, 1e-6, 'arriba, donde pasó el lazo (afuera del área va lo que el lazo encierra)')
    assert.deepEqual(p.contenido.unidades.map(u => u.id).sort(), ['br-iii', 'ce-arriba'], 'el Cuerpo de arriba y la brigada roja del lazo (ni el de abajo, ni la FF.TT., ni la Br. VI)')
    assert.equal(p.contenido.cmoc.corredoresClandestinos.length, 1)
    assert.equal(p.contenido.ops.magnitudes.length, 1, 'la marca del límite sigue a su pedazo')
    assert.deepEqual(p.contenido.ops.coordinacion.map(c => c.centro[1]).sort((a, b) => a - b), [-17.012, -17.0103], 'los puntos del borde, no el del fondo')
    const camino = p.contenido.resultados.comunicaciones.fc.features[0].geometry.coordinates
    casi(minLat(camino), -17.012, 5e-5, 'el camino se corta en el límite de los Cuerpos')
    assert.equal(p.contenido.resultados.poblaciones.fc.features.length, 1, 'sólo la población de arriba')
    const monte = p.contenido.resultados.vegetacion.fc.features[0].geometry.coordinates[0]
    casi(minLat(monte), -17.01486, 5e-5, 'el monte que cruza el límite, cortado')
    assert.ok(p.aoi && p.aoi.geometry.type === 'Polygon', 'el lazo como Área de Interés')

    // 6 · 📂 Abrir archivo JSON: ejercicio nuevo con lo cortado y los calcos prendidos.
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: '📂 Abrir archivo JSON (selección, áreas o ejercicio)' }).click()])
    await selector.setFiles({ name: 'Seleccion_CE-I.json', mimeType: 'application/json', buffer: bytes })
    await page.waitForTimeout(2500)
    const abierto = await leerOps(page)
    assert.equal(abierto.areaOps.nombre, 'CE-I')
    assert.equal(abierto.limites.length, 3)
    const aoi = await estadoReact(page, v => v && v.type === 'Feature' && v.properties && v.properties.origen === 'tijera' ? v : undefined)
    assert.ok(aoi, 'el Área de Interés es el lazo')
    const res = await estadoReact(page, v => v && !Array.isArray(v) && v.comunicaciones && v.comunicaciones.fc ? Object.keys(v).sort() : undefined)
    assert.deepEqual(res, ['comunicaciones', 'poblaciones', 'vegetacion'], 'los calcos del terreno cortados')
    const ver = await estadoReact(page, v => Array.isArray(v) && v.length && v.every(x => ['comunicaciones', 'poblaciones', 'vegetacion'].includes(x)) ? v.slice().sort() : undefined)
    assert.deepEqual(ver, ['comunicaciones', 'poblaciones', 'vegetacion'], 'y prendidos')
    await page.screenshot({ path: path.join(SALIDAS, '4-abierto.png') })
    assert.deepEqual(errores, [])
    console.log('E2E tijera: «✂️ Cortar área» en la barra, vista previa con toques, el área por los límites, las líneas y los calcos cortados donde pasó el lazo, la brigada roja de afuera y el JSON que abre con el lazo como Área de Interés. Sin errores JS.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error('DIAGNOSTICO', await page.getByRole('region', { name: /Tijera/ }).innerText().catch(() => ''), errores)
    throw e
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
