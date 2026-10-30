// 🧩 INTEGRAR (calcos/integrar/v1/integrar.js) en la Mesa real (Chromium), sin red:
//   · el JEM abre su ejercicio y los archivos del G-1 y del G-4 (bajados con «💾 Guardar como» en
//     sus computadoras); vienen marcadas sólo las hojas de cada dueño: la copia vieja de la hoja
//     del G-4 que tenía el G-1 NO se marca;
//   · una hoja se trae de un solo archivo: marcarla en otro la desmarca en el primero;
//   · «✅ Integrar» las pone en el ejercicio del JEM, cada una en su lugar, sin tocar el libreto del
//     JEM, y el autoguardado las guarda; «↩️ Deshacer» vuelve a como estaba;
//   · «📤 Guardar el integrado para los G» baja el ejercicio;
//   · el G-1, en su computadora y con una versión MÁS NUEVA de su hoja, abre el integrado: trae las
//     del G-4 y del JEM y conserva la suya;
//   · en el teléfono el botón entra en la pantalla;
//   · sin errores de consola.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-integrar-jem')
fs.mkdirSync(SALIDAS, { recursive: true })
const NOMBRE = 'CE-INTEGRAR'

async function hasta(page, f, ms = 15000, que = '') {
  const t0 = Date.now()
  for (;;) {
    const v = await f()
    if (v) return v
    if (Date.now() - t0 > ms) throw new Error('no llegó: ' + que)
    await page.waitForTimeout(200)
  }
}
const foto = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.SIDMesaEjercicio.foto())))
const caja = (page, ai, clave) => page.locator(`#sid-integ-panel input[data-i="marcar"][data-a="${ai}"][data-c="${clave}"]`)
const archivo = (nombre, datos) => ({ name: nombre, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(datos)) })

;(async () => {
  const { page, errores, cerrar, url } = await abrir({ ancho: 1500, alto: 1000, consulta: '?puesto=jem' })
  page.on('dialog', (d) => d.accept())
  const shot = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    // El primer campo de la hoja «potencia» (G-1 y G-4) y del «libreto» del JEM, como los nombra la Mesa.
    const base = ejercicioFicticio({ conPlantilla: false })
    base.nombre = NOMBRE
    await sembrarYAbrir(page, base)
    const C = await page.evaluate(() => {
      const c = window.SIDCatalogoHojas()
      const campo = (s, id) => c[s].flatMap((f) => f.hojas).find((h) => h.id === id).campos[0]
      return { g1: campo('g1', 'potencia'), g4: campo('g4', 'potencia'), jem: campo('jem', 'libreto') }
    })
    assert.equal(await page.evaluate(() => typeof window.SIDMesaCargar), 'function', 'la Mesa deja a la vista cómo poner un ejercicio')

    // ── el ejercicio del JEM ──
    const ejJem = { ...(await foto(page)), nombre: NOMBRE }
    ejJem.hojasG = { g1: {}, g4: { potencia: { [C.g4]: 'G-4 VIEJO (del JEM)' } }, g5: {}, cmte: {}, jem: { libreto: { [C.jem]: 'Libreto del JEM' } }, eme: {} }
    await page.evaluate((d) => window.SIDMesaCargar(d, d.nombre), ejJem)
    await hasta(page, async () => (await foto(page)).hojasG.jem.libreto?.[C.jem] === 'Libreto del JEM', 8000, 'el ejercicio del JEM')

    // ── lo que hicieron el G-1 y el G-4 en sus computadoras ──
    const deG1 = JSON.parse(JSON.stringify(ejJem))
    deG1.puestoActivo = null
    deG1.hojasG.g1.potencia = { [C.g1]: 'Potencia de combate según el G-1' }
    deG1.hojasG.g4.potencia = { [C.g4]: 'copia VIEJA del G-4 que tenía el G-1' }
    deG1.hojasG.jem = {}
    const deG4 = JSON.parse(JSON.stringify(ejJem))
    deG4.puestoActivo = 'g4'
    deG4.hojasG.g4.potencia = { [C.g4]: 'G-4 NUEVO' }
    deG4.documentos = [...(deG4.documentos || []), { nombre: 'CUADRO LOG.txt', mime: 'text/plain', tipo: 'texto', texto: 'abastecimientos', base64: null, paginas: 0, categoria: 'otro' }]

    const btn = page.locator('#sid-integ-btn')
    assert.equal(await btn.isVisible(), true, '🧩 Integrar a la vista')
    const rb = await btn.boundingBox(), rg = await page.locator('#sid-resg-btn').boundingBox()
    assert.ok(rb.x + rb.width <= rg.x + 1, 'a la izquierda de «Guardar como»')
    await btn.click()
    const pan = page.locator('#sid-integ-panel')
    await pan.waitFor({ state: 'visible' })
    assert.equal(await pan.locator('select[data-i="mio"]').inputValue(), 'jem', 'el JEM por el enlace ?puesto=jem')
    await page.setInputFiles('input[aria-label="Archivos JSON de los G"]', [archivo('EJERCICIO_CE-INTEGRAR_G-1_2026-10-30_1000.json', deG1), archivo('EJERCICIO_CE-INTEGRAR_2026-10-30_1005.json', deG4)])
    await hasta(page, async () => (await pan.locator('section.archivo').count()) === 2, 8000, 'los dos archivos')
    assert.equal(await pan.locator('select[data-i="de"][data-a="0"]').inputValue(), 'g1', 'el G-1 por el nombre del archivo')
    assert.equal(await pan.locator('select[data-i="de"][data-a="1"]').inputValue(), 'g4', 'el G-4 por el puesto del ejercicio')
    assert.equal(await caja(page, 0, 'hojasG/g1/potencia').isChecked(), true, 'la del G-1, marcada')
    assert.equal(await caja(page, 0, 'hojasG/g4/potencia').isChecked(), false, 'la copia vieja del G-4 que tenía el G-1, NO')
    assert.equal(await caja(page, 1, 'hojasG/g4/potencia').isChecked(), true, 'la del G-4, del G-4')
    assert.equal(await caja(page, 1, 'documentos/CUADRO LOG.txt').isChecked(), true, 'el documento nuevo')
    assert.equal(await pan.locator('section.archivo').nth(0).locator('details[data-g="ajenas"]').getAttribute('open'), null, 'las de otras secciones, plegadas')
    await shot('1-jem-dos-archivos')

    // una hoja, de un solo archivo
    await pan.locator('section.archivo').nth(0).locator('details[data-g="ajenas"] > summary').click()
    await caja(page, 0, 'hojasG/g4/potencia').check()
    assert.equal(await caja(page, 1, 'hojasG/g4/potencia').isChecked(), false, 'se desmarca en el otro archivo')
    assert.match(await pan.locator('[role="status"]').innerText(), /un solo archivo/)
    await caja(page, 1, 'hojasG/g4/potencia').check()
    assert.equal(await caja(page, 0, 'hojasG/g4/potencia').isChecked(), false)

    // ── integrar ──
    const integrar = pan.locator('button[data-i="integrar"]')
    assert.match(await integrar.innerText(), /integrar 3 hojas/i)
    await integrar.click()
    await hasta(page, async () => (await foto(page)).hojasG.g1.potencia?.[C.g1] === 'Potencia de combate según el G-1', 8000, 'la hoja del G-1 en el ejercicio del JEM')
    let f = await foto(page)
    assert.equal(f.hojasG.g4.potencia[C.g4], 'G-4 NUEVO')
    assert.equal(f.hojasG.jem.libreto[C.jem], 'Libreto del JEM', 'el libreto del JEM no se toca')
    assert.ok(f.documentos.some((d) => d.nombre === 'CUADRO LOG.txt'))
    assert.equal(f.unidades.length, base.unidades.length, 'la carta no se toca')
    assert.match(await pan.locator('[role="status"]').innerText(), /Integradas 3 hoja/)
    await hasta(page, async () => (await leerGuardado(page, NOMBRE))?.hojasG?.g4?.potencia?.[C.g4] === 'G-4 NUEVO', 20000, 'el autoguardado con lo integrado')
    await shot('2-jem-integrado')

    // ↩️ deshacer y volver a integrar
    await pan.locator('button[data-i="deshacer"]').click()
    await hasta(page, async () => (await foto(page)).hojasG.g4.potencia?.[C.g4] === 'G-4 VIEJO (del JEM)', 8000, 'deshacer')
    assert.ok(!(await foto(page)).hojasG.g1.potencia, 'sin la del G-1')
    await hasta(page, async () => /integrar 3 hojas/i.test(await integrar.innerText()), 5000, 'vuelven a quedar marcadas')
    await integrar.click()
    await hasta(page, async () => (await foto(page)).hojasG.g4.potencia?.[C.g4] === 'G-4 NUEVO', 8000, 'integrar otra vez')

    // 📤 el integrado para los G
    const [baj] = await Promise.all([page.waitForEvent('download'), pan.locator('button[data-i="bajar"]').click()])
    assert.match(baj.suggestedFilename(), /^INTEGRADO-JEM_CE-INTEGRAR_\d{4}-\d{2}-\d{2}_\d{4}\.json$/)
    const integrado = JSON.parse(fs.readFileSync(await baj.path(), 'utf8'))
    assert.equal(integrado.hojasG.g1.potencia[C.g1], 'Potencia de combate según el G-1')
    assert.equal(integrado.hojasG.g4.potencia[C.g4], 'G-4 NUEVO')

    // ── el G-1, en su computadora, siguió trabajando su hoja y recibe el integrado ──
    await page.goto(url + '?puesto=g1', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const ejG1 = JSON.parse(JSON.stringify(deG1))
    ejG1.hojasG.g1.potencia = { [C.g1]: 'Potencia del G-1 (MÁS NUEVA)' }
    await sembrarYAbrir(page, ejG1)
    await hasta(page, async () => (await foto(page))?.hojasG?.g1?.potencia?.[C.g1] === 'Potencia del G-1 (MÁS NUEVA)', 8000, 'el ejercicio del G-1')
    await page.locator('#sid-integ-btn').click()
    assert.equal(await pan.locator('select[data-i="mio"]').inputValue(), 'g1', 'el G-1 por el enlace ?puesto=g1')
    await page.setInputFiles('input[aria-label="Archivos JSON de los G"]', [archivo(baj.suggestedFilename(), integrado)])
    await hasta(page, async () => (await pan.locator('section.archivo').count()) === 1, 8000, 'el integrado')
    assert.equal(await pan.locator('select[data-i="de"][data-a="0"]').inputValue(), 'jem', 'el integrado es del JEM')
    assert.equal(await caja(page, 0, 'hojasG/g4/potencia').isChecked(), true, 'trae la del G-4')
    assert.equal(await caja(page, 0, 'hojasG/jem/libreto').isChecked(), true, 'trae la del JEM')
    assert.equal(await caja(page, 0, 'hojasG/g1/potencia').isChecked(), false, 'NO pisa la suya')
    await shot('3-g1-recibe-integrado')
    await pan.locator('button[data-i="integrar"]').click()
    await hasta(page, async () => (await foto(page)).hojasG.g4.potencia?.[C.g4] === 'G-4 NUEVO', 8000, 'el G-1 con lo integrado')
    f = await foto(page)
    assert.equal(f.hojasG.g1.potencia[C.g1], 'Potencia del G-1 (MÁS NUEVA)', 'el G-1 conserva su hoja')
    assert.equal(f.hojasG.jem.libreto[C.jem], 'Libreto del JEM')
    assert.ok(f.documentos.some((d) => d.nombre === 'CUADRO LOG.txt'))
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('✓ escritorio: el JEM integra, deshace, reparte y el G-1 recibe sin perder lo suyo')
  } finally {
    await cerrar()
  }

  // ── en el teléfono ──
  const m = await abrir({ ancho: 390, alto: 844, movil: true, consulta: '?puesto=jem' })
  try {
    const d = ejercicioFicticio({ conPlantilla: false })
    d.nombre = NOMBRE
    await sembrarYAbrir(m.page, d)
    await m.page.waitForTimeout(1500)
    const b = await m.page.locator('#sid-integ-btn').boundingBox(), g = await m.page.locator('#sid-resg-btn').boundingBox()
    assert.ok(b && b.x >= 0 && b.y >= 0 && b.x + b.width <= 390 && b.y + b.height <= 844, 'el botón entra en la pantalla')
    assert.ok(b.x + b.width <= g.x + 1 || b.y + b.height <= g.y + 1 || b.y >= g.y + g.height - 1, 'no tapa «Guardar como»')
    await m.page.locator('#sid-integ-btn').dispatchEvent('click')
    const p = await m.page.locator('#sid-integ-panel').boundingBox()
    assert.ok(p.x >= 0 && p.x + p.width <= 390, 'el panel entra a lo ancho')
    await m.page.screenshot({ path: path.join(SALIDAS, '4-telefono.png') })
    assert.deepEqual(m.errores, [], 'sin errores de consola en el teléfono')
    console.log('✓ teléfono: el botón y el panel entran en la pantalla')
  } finally {
    await m.cerrar()
  }
  console.log('\nTodos los casos pasan.')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
