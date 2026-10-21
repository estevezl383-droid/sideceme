// 🧮 Cálculos y ▣ ASDI / ARCE del G-4 en grande abajo, el reabastecimiento y el Word del cálculo
// (21-10-2026), en la Mesa real (Chromium), con el ejercicio FICTICIO de logística:
//   · en escritorio, 🧮 Cálculos se abre abajo en grande: las cuatro clases lado a lado, el
//     reabastecimiento y el encabezado; el panel se queda con los datos y el botón;
//   · «Días de la operación» se escribe de corrido (30), sin que se pierda el cursor; la Cl V toma
//     29 días sucesivos y el reabastecimiento cada 3 días da 10 renglones;
//   · ▾ Achicar / ↗ Al panel / ⤢ Abrir en grande; el ▣ ASDI también se abre abajo con su paso a paso;
//   · el Word: OBJETO, CARTAS y ANEXOS llenos, «vehículos» (no «veh») y la sección REABASTECIMIENTO.
// Sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioLogistica } = require('../logistica-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-reabastecimiento')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.first().dispatchEvent('click')
async function textoDocx(ruta) {
  const z = await JSZip.loadAsync(fs.readFileSync(ruta))
  return (await z.file('word/document.xml').async('string')).replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
}

;(async () => {
  const a = await abrir({ ancho: 1800, alto: 1000, movil: false })
  const { page } = a
  page.on('dialog', (d) => d.accept())
  try {
    await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
    const ej = ejercicioLogistica({ conPropuestas: true })
    ej.ordenSup = { ...(ej.ordenSup || {}), unidad: 'CE-I', numero: '2', carta: 'Bolivia 1:250.000 (FICT.)', mision: 'El CE-I defiende en el sector asignado (FICT.)' }
    await sembrarYAbrir(page, ej)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await clic(page.locator('.botones-mapa > button', { hasText: 'G-4' }))
    await page.waitForTimeout(800)
    await clic(page.locator('button', { hasText: /^\W*Cálculos$/ }))
    await page.waitForTimeout(500)

    const tab = page.locator('[data-g4-tablero^="🧮"]')
    assert.equal(await tab.count(), 1, 'el tablero grande de los cálculos')
    for (const id of ['cl1', 'agua', 'cl3', 'cl5', 'reab', 'encabezado']) assert.equal(await tab.locator(`[data-calc="${id}"]`).count(), 1, 'abajo: ' + id)
    const caja = await tab.boundingBox()
    assert.ok(caja.width > 1000 && caja.y > 300, 'abajo y ancho: ' + JSON.stringify(caja))
    // 21-10-2026: la mitad de alto (30vh) y sin tapar el panel de la izquierda
    const vista = await page.evaluate(() => ({ alto: innerHeight, izq: document.querySelector('aside.panel').getBoundingClientRect().right }))
    assert.ok(caja.height <= vista.alto * 0.3 + 1, 'la mitad de alto: ' + JSON.stringify({ caja, vista }))
    assert.ok(caja.x >= vista.izq, 'no tapa el panel de la izquierda: ' + JSON.stringify({ caja, vista }))

    // días: se escribe 30 de corrido
    const dias = page.locator('label', { hasText: 'Días de la operación' }).locator('input')
    await dias.click()
    await dias.press('Control+A')
    await page.keyboard.type('30')
    assert.equal(await dias.inputValue(), '30', 'el cursor no se pierde al escribir')
    await page.waitForTimeout(400)
    assert.equal(await page.locator('label', { hasText: 'Días sucesivos' }).locator('input').inputValue(), '29', 'la Cl V toma los días')
    const filas = await tab.locator('[data-calc="reab"] tbody tr').count()
    assert.equal(filas, 10, 'cada 3 días: 10 reabastecimientos')
    await page.screenshot({ path: path.join(out, 'calculos-abajo.png') })

    // Word
    const dl = page.waitForEvent('download', { timeout: 20000 })
    await clic(page.locator('button', { hasText: 'Descargar el cálculo' }))
    const dlg = page.locator('dialog.sid-militar')
    const d = await Promise.race([dl, dlg.waitFor({ timeout: 8000 }).then(async () => { await dlg.locator('[data-action="exportar"]').click(); return dl })])
    const f = path.join(out, 'calculo.docx')
    await (await d).saveAs(f)
    const x = await textoDocx(f)
    assert.match(x, /OBJETO\t:\tSección IV Logística en Apoyo a las Operaciones Defensivas del CE-I\./)
    assert.match(x, /CARTAS\t:\tBolivia 1:250\.000 \(FICT\.\)/)
    assert.match(x, /ANEXOS\t:\tS\/A/)
    assert.match(x, /vehículos × 3 L por vehículo y por día × 30 días/)
    assert.ok(!/ veh × /.test(x), 'sin «veh»')
    assert.match(x, /REABASTECIMIENTO/)
    assert.match(x, /D\+27 a D\+29/)

    // achicar, al panel y de vuelta
    await clic(tab.locator('button', { hasText: 'Achicar' }))
    assert.equal(await tab.locator('[data-calc="cl1"]').count(), 0, 'achicado')
    await clic(tab.locator('button', { hasText: 'Al panel' }))
    assert.equal(await page.locator('[data-g4-tablero]').count(), 0, 'en el panel')
    assert.ok(await page.locator('button', { hasText: 'Cl III' }).count(), 'con sus pestañas')
    await clic(page.locator('button', { hasText: 'Abrir en grande abajo' }))
    assert.equal(await page.locator('[data-g4-tablero^="🧮"]').count(), 1, 'otra vez abajo')

    // ▣ ASDI / ARCE
    await clic(page.locator('button', { hasText: /^\W*ASDI$/ }))
    await page.waitForTimeout(400)
    const asdi = page.locator('[data-g4-tablero^="▣"]')
    assert.equal(await asdi.count(), 1, 'el ASDI también abajo')
    assert.equal(await asdi.locator('[data-g4="paso-a-paso"]').count(), 1, 'con el paso a paso')
    assert.ok(await asdi.locator('button', { hasText: 'ARCE' }).count(), 'y el trazado del ARCE')
    await page.screenshot({ path: path.join(out, 'asdi-abajo.png') })
    assert.deepEqual(a.errores, [], 'sin errores de consola')
    console.log('✔ reabastecimiento: tableros abajo, días, reabastecimiento y Word')
  } finally {
    await a.cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
