// Cinco navegadores aislados preparan textos a la vez. No prueba la capacidad
// del servidor de producción ni llama a una IA externa.
const assert = require('node:assert/strict')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioRiesgo } = require('../riesgo-ejercicio')
async function preparar(page) {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort())
  await page.route('**/*.geojson', r => r.fulfill({ json: { type: 'FeatureCollection', features: [] } }))
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { window.__pedidoCopiado = t } } })
  })
}
;(async () => {
  const base = await abrir({ ancho: 1440, alto: 1000, preparar })
  const perfiles = [{ page: base.page, ctx: base.page.context() }]
  try {
    for (let n = 1; n < 5; n++) {
      const ctx = await base.browser.newContext({ viewport: { width: 1440, height: 1000 } })
      const page = await ctx.newPage()
      await preparar(page)
      perfiles.push({ ctx, page })
    }
    await Promise.all(perfiles.slice(1).map(async ({ page }) => {
      await page.goto(base.url, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)
      const entendido = page.getByRole('button', { name: /entendido/i })
      if (await entendido.count()) await entendido.first().click()
    }))
    await Promise.all(perfiles.map(async ({ page }, i) => {
      const d = ejercicioRiesgo()
      d.nombre = `ALUMNO SIMULTÁNEO ${i}`
      d.aoi = null
      d.mision = `MARCADOR-ALUMNO-${i}: ejercicio ficticio para probar aislamiento.`
      d.documentos = [{ nombre: 'Documento ficticio', categoria: 'otro', texto: `${d.mision}\n${'Contexto ficticio para redactar la hoja. '.repeat(5000)}` }]
      await sembrarYAbrir(page, d)
      await page.getByRole('button', { name: '⭐ CMTE.' }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /F1·P3\s*Apreciación Activa del Comandante/ }).dispatchEvent('click')
      await page.getByRole('button', { name: '← Volver a mis hojas' }).waitFor()
      if (!(await page.getByRole('button', { name: '📋 Copiar el pedido' }).count())) await page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).dispatchEvent('click')
      await page.getByRole('button', { name: 'Corto', exact: true }).dispatchEvent('click')
    }))
    const inicio = Date.now()
    await Promise.all(perfiles.map(({ page }) => page.getByRole('button', { name: '📋 Copiar el pedido' }).dispatchEvent('click')))
    const resultados = await Promise.all(perfiles.map(async ({ page }, i) => {
      await page.getByText(/Pedido copiado \(/).waitFor({ timeout: 30000 })
      const t = await page.evaluate(() => window.__pedidoCopiado)
      assert.ok(t.length <= 60000)
      assert.ok(t.includes(`MARCADOR-ALUMNO-${i}`))
      for (let j = 0; j < 5; j++) if (j !== i) assert.equal(t.includes(`MARCADOR-ALUMNO-${j}`), false)
      assert.equal(await page.getByRole('button', { name: '📋 Copiar el pedido' }).isEnabled(), true)
      return t.length
    }))
    console.log(JSON.stringify({ prueba: 'cinco alumnos aislados preparan y copian a la vez', caracteres: resultados, ms: Date.now() - inicio, serviciosIA: 0 }))
  } finally { await base.cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
