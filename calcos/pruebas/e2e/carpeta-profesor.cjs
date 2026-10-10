// 📕 La CARPETA DEL PROFESOR y el pedido del CMOC (calcos/modalidad) en la Mesa real (Chromium),
// como está publicada: el ejercicio se guarda en SIDECEME (acá uno de mentira: servidor-falso.js).
// Lo pidió Sergio (10-10-2026) con la captura del paso 4: el pedido salía con 3081 caracteres (sin
// el CMOC que había dibujado) y no había dónde pegar lo que contestó la IA.
//   · el pedido del paso 4 lleva lo dibujado en el CMOC (corredores sobre caminos, avenidas,
//     terreno clave, áreas restringidas), leído de la Mesa abierta y no del IndexedDB;
//   · se lee de la Mesa tal como está (window.SIDMesaEjercicio, del autoguardado), no de la copia
//     de respaldo del navegador (con SIDECEME el ejercicio no está en el IndexedDB con su nombre);
//   · se pega la respuesta real de la IA (pruebas/respuesta-cmoc-profesor.md) y se guarda: queda
//     como 🔒 solución del profesor y lo «PARA EL PROFESOR» se suma a la carpeta;
//   · queda después de recargar; entra en el pedido de la OGO (paso 5) y no en el del paso 4;
//   · ⬇️ Bajar la carpeta (.md) y 📤 Cargarla de nuevo después de sacarla;
//   · la carpeta NO viaja en el ejercicio que se guarda en SIDECEME (lo reciben los alumnos);
//   · sin errores de consola.
//   node calcos/pruebas/e2e/carpeta-profesor.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso.js')
const { ejercicioOrganizacion } = require('../organizacion-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-carpeta')
fs.mkdirSync(out, { recursive: true })
const PANEL = '#sid-mod-panel'
const RESPUESTA = fs.readFileSync(path.join(__dirname, '../respuesta-cmoc-profesor.md'), 'utf8')

;(async () => {
  const datos = ejercicioOrganizacion()
  datos.nombre = 'CMOC ALTIPLANO (FICT.)'
  datos.cmoc.corredores = [{ coords: [[-68.31, -16.7], [-68.305, -16.75], [-68.3, -16.8], [-68.29, -16.9]], escalon: 'division', bando: 'enemigo', _origen: 'vias', km: 22, viaBase: 'ruta primaria' }]
  datos.cmoc.clave = [{ centro: [-68.3, -16.86], etiqueta: 'C1' }]
  datos.cmoc.severo = [{ type: 'Feature', properties: { _clase: 'severo', _origen: 'manual' }, geometry: { type: 'Polygon', coordinates: [[[-68.45, -16.7], [-68.4, -16.7], [-68.4, -16.75], [-68.45, -16.75], [-68.45, -16.7]]] } }]
  const calcos = [{ id: 'id-0', nombre: datos.nombre, payload: datos, actualizado_en: new Date().toISOString() }]
  const log = []
  const a = await abrir({ ancho: 1600, alto: 1000, preparar: async (p) => { await servidorFalso(p, calcos, log) } })
  const { page, errores } = a
  page.on('dialog', (d) => d.accept())
  const pedido = async (n) => {
    const b = page.locator(`${PANEL} [data-ia-paso="${n}"]`)
    if ((await b.getAttribute('aria-expanded')) !== 'true') await b.dispatchEvent('click')
    await page.waitForFunction(() => /CONTEXTO DEL EJERCICIO/.test(document.querySelector('#sid-mod-panel textarea[data-ia]')?.value || ''), null, { timeout: 8000 })
    return page.locator(`${PANEL} textarea[data-ia]`).inputValue()
  }
  const profesor = async () => {
    await page.locator('#sid-mod-sel button[data-m=profesor]').dispatchEvent('click')
    await page.waitForTimeout(400)
    if (await page.locator(`${PANEL}.plegado`).count()) await page.locator(`${PANEL} .asa`).dispatchEvent('click')
  }
  try {
    await abrirDelServidor(page, datos.nombre)
    await profesor()

    // 1) el pedido del paso 4 lleva el CMOC dibujado, leído de la Mesa abierta
    let t = await pedido(4)
    const ctx = t.split('# CONTEXTO DEL EJERCICIO')[1]
    assert.match(ctx, /Leído de: la Mesa abierta/, 'leído de la Mesa, no del IndexedDB')
    assert.match(ctx, /### Terreno dibujado en la Mesa/)
    assert.match(ctx, /CM-1 · escalón División \(≈ 15 km de ancho\) · ENEMIGA · sobre caminos \(ruta primaria\) · va de -16\.7, -68\.31 a -16\.9, -68\.29/, 'el corredor sobre caminos, en lat, lng')
    assert.match(ctx, /AA-1 · ENEMIGA · eje de -16\.72, -68\.3 a -16\.9, -68\.3/, 'las avenidas')
    assert.match(ctx, /TERRENO CLAVE \(1\):\n {2}- C1 · -16\.86, -68\.3/, 'el terreno clave')
    assert.match(ctx, /Terreno SEVERAMENTE RESTRINGIDO: 1 área\(s\), [\d,]+ km² en total \(1 dibujada\(s\) a mano\)/, 'el terreno severamente restringido')
    assert.match(ctx, /Unidad de los alumnos: DIV\.MEC\.-1 \(FICT\.\)/)
    assert.match(ctx, /La DIV\.MEC\.-1 \(FICT\.\) defiende y fija/, 'la Orden escrita')
    assert.match(t, /PARTÍ DE LO QUE EL PROFESOR YA DIBUJÓ/, 'el pedido manda partir de lo dibujado')
    assert.ok(t.length > 5000, 'ya no sale casi vacío: ' + t.length)
    assert.doesNotMatch(ctx, /CARPETA DEL PROFESOR/, 'todavía no hay nada guardado')
    await page.screenshot({ path: path.join(out, '1-pedido-cmoc.png') })

    // 2) la Mesa tal como está: el puente del autoguardado da el ejercicio abierto
    assert.equal(await page.evaluate(() => window.SIDMesaEjercicio.nombre()), datos.nombre)
    assert.equal(await page.evaluate(() => window.SIDMesaEjercicio.foto().cmoc.corredores.length), 1)

    // 3) pegar la respuesta de la IA y guardarla
    await page.locator(`${PANEL} textarea[data-ia-resp="4"]`).fill(RESPUESTA)
    await page.locator(`${PANEL} [data-a="ia-guardar"]`).dispatchEvent('click')
    await page.waitForFunction(() => /Guardada en la 📕 carpeta/.test(document.querySelector('#sid-mod-panel .ia-resp')?.innerText || ''), null, { timeout: 5000 })
    const aviso = await page.locator(`${PANEL} .ia-resp`).innerText()
    assert.match(aviso, /🔒 solución del profesor/, 'la respuesta dice que es solución del profesor')
    assert.match(aviso, /lo «PARA EL PROFESOR» se sumó a la carpeta/)
    assert.equal(await page.locator(`${PANEL} select[data-ia-destino]`).inputValue(), 'solucion')
    assert.match(await page.locator(`${PANEL} [data-ia-paso="4"]`).innerText(), /📕✓/, 'el botón dice que está guardada')
    await page.screenshot({ path: path.join(out, '2-respuesta-guardada.png') })

    // 4) queda después de recargar (IndexedDB «sid-profesor»)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
    await page.waitForTimeout(1500)
    const entendido = page.getByRole('button', { name: /entendido/i })
    if (await entendido.count()) await entendido.first().click().catch(() => {})
    await abrirDelServidor(page, datos.nombre)
    await profesor()
    await page.waitForFunction(() => window.SIDModalidad.carpeta && window.SIDModalidad.carpeta.pasos && window.SIDModalidad.carpeta.pasos[4], null, { timeout: 8000 })
    await page.locator(`${PANEL} [data-a="car"]`).dispatchEvent('click')
    const car = await page.locator(`${PANEL} .car`).innerText()
    assert.match(car, /📕 Carpeta del profesor — CMOC ALTIPLANO \(FICT\.\)/)
    assert.match(car, /Paso 4 · CMOC: avenidas de aproximación y terreno clave/)
    assert.match(car, /🔒 Solución del profesor/)
    assert.match(car, /Para el profesor \(se va sumando\)[\s\S]*Punto crítico a evaluar/, 'lo PARA EL PROFESOR se sumó')
    await page.locator(`${PANEL} .car-notas`).scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(out, '3-carpeta.png') })

    // 5) entra en el pedido de la OGO (paso 5), con su regla para el Anexo A; no en el del paso 4
    t = await pedido(5)
    assert.match(t, /### CARPETA DEL PROFESOR/)
    assert.match(t, /#### Paso 4 · CMOC: avenidas de aproximación y terreno clave \(🔒 SOLUCIÓN DEL PROFESOR · guardado /)
    assert.match(t, /AA-E 2 "SUR"/, 'con lo que contestó la IA')
    assert.match(t, /el párrafo 1\.a y el Anexo A \(Inteligencia\) toman de ahí/)
    assert.match(await page.locator(`${PANEL} .ia.ogo .ia-ayuda`).innerText(), /Lleva lo guardado en la 📕 carpeta \(paso 4\)/)
    t = await pedido(4)
    assert.doesNotMatch(t, /### CARPETA DEL PROFESOR/, 'el paso 4 no se lleva su propia respuesta')
    assert.equal(await page.locator(`${PANEL} textarea[data-ia-resp="4"]`).inputValue(), RESPUESTA.trim(), 'la respuesta guardada vuelve al cuadro')

    // 6) bajar la carpeta, sacar la respuesta y volver a cargarla desde el .md
    await page.locator(`${PANEL} [data-a="car"]`).dispatchEvent('click')
    if (!(await page.locator(`${PANEL} .car`).count())) await page.locator(`${PANEL} [data-a="car"]`).dispatchEvent('click')
    const [bajada] = await Promise.all([page.waitForEvent('download'), page.locator(`${PANEL} [data-a="car-bajar"]`).dispatchEvent('click')])
    const md = fs.readFileSync(await bajada.path(), 'utf8')
    assert.equal(bajada.suggestedFilename(), 'carpeta-profesor-cmoc-altiplano-fict.md')
    assert.match(md, /^# 📕 Carpeta del profesor — CMOC ALTIPLANO \(FICT\.\)/)
    assert.match(md, /## 1\. Para el profesor \(se va sumando paso a paso\)\n\n### Paso 4 · CMOC[^\n]*\n\n\* \*\*Destino de este documento/)
    assert.match(md, /## 2\. 🔒 Solución del profesor \(NO entregar a los alumnos\)\n\n### Paso 4[^\n]*\n\n# CALCO MODIFICADO/)
    assert.match(md, /<!-- sid-carpeta-profesor:v1 /)
    fs.writeFileSync(path.join(out, 'carpeta-bajada.md'), md)
    await page.locator(`${PANEL} [data-ia-paso="4"]`).scrollIntoViewIfNeeded()
    await page.locator(`${PANEL} [data-a="ia-quitar"]`).dispatchEvent('click')
    await page.waitForFunction(() => !window.SIDModalidad.carpeta.pasos[4], null, { timeout: 5000 })
    await page.locator(`${PANEL} input[data-car-archivo]`).setInputFiles({ name: 'carpeta.md', mimeType: 'text/markdown', buffer: Buffer.from(md) })
    await page.waitForFunction(() => /✓ Cargada: 1 paso/.test(document.querySelector('#sid-mod-panel .car')?.innerText || ''), null, { timeout: 5000 })
    assert.match(await page.locator(`${PANEL} .car`).innerText(), /Paso 4 · CMOC/)
    assert.equal(await page.evaluate(() => window.SIDModalidad.carpeta.pasos[4].texto), RESPUESTA.trim())

    // 7) la carpeta NO viaja en el ejercicio que se guarda en SIDECEME (el que reciben los alumnos)
    await page.locator('.sello-guardado').first().dispatchEvent('click')
    await page.waitForTimeout(1500)
    const guardados = log.filter((l) => l.accion === 'guardar')
    assert.ok(guardados.length, 'el ejercicio se guardó en el servidor')
    for (const g of guardados) assert.doesNotMatch(JSON.stringify(g.payload), /Punto crítico a evaluar|PARA EL PROFESOR|AA-E 2/, 'la solución del profesor no va en el ejercicio')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('carpeta-profesor e2e OK — pedido del paso 4 con el CMOC dibujado (' + (await pedido(4)).length + ' caracteres), respuesta guardada, en la OGO, bajada y cargada, fuera del ejercicio')
  } catch (e) {
    await page.screenshot({ path: path.join(out, 'ERROR.png') }).catch(() => {})
    console.error('errores de consola:', errores)
    throw e
  } finally {
    await a.cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
