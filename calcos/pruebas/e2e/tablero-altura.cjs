// 🧮 El borde de arriba del tablero abajo se arrastra para agrandarlo (y el alto queda guardado).
//   node calcos/pruebas/e2e/tablero-altura.cjs
const assert = require('node:assert/strict')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioLogistica } = require('../logistica-ejemplo.js')

const clic = (loc) => loc.first().dispatchEvent('click')

;(async () => {
  const a = await abrir({ ancho: 1800, alto: 1000, movil: false })
  const { page } = a
  page.on('dialog', (d) => d.accept())
  try {
    await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
    await sembrarYAbrir(page, ejercicioLogistica({ conPropuestas: true }))
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await clic(page.locator('.botones-mapa > button', { hasText: 'G-4' }))
    await page.waitForTimeout(800)
    await clic(page.locator('button', { hasText: /^\W*Cálculos$/ }))
    await page.waitForTimeout(500)

    const tab = page.locator('[data-g4-tablero^="🧮"]')
    const agarre = tab.locator('div').first()
    const antes = await tab.boundingBox()
    const ag = await agarre.boundingBox()
    await page.mouse.move(ag.x + ag.width / 2, ag.y + ag.height / 2)
    await page.mouse.down()
    await page.mouse.move(ag.x + ag.width / 2, ag.y - 250, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(200)
    const despues = await tab.boundingBox()
    assert.ok(despues.height > antes.height + 200, 'crece al arrastrar: ' + JSON.stringify({ antes, despues }))
    const guardado = await page.evaluate(() => localStorage.getItem('sid-g4-tablero-alto'))
    assert.ok(Number(guardado) > 30, 'queda guardado: ' + guardado)

    await page.reload()
    await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
    console.log('  ✔ el borde agranda el tablero y el alto se guarda (' + guardado + '%)')
  } finally {
    await a.cerrar()
  }
  process.exit(0)
})().catch((e) => { console.error(e); process.exit(1) })
