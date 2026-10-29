const assert = require('node:assert/strict')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioRiesgo } = require('../riesgo-ejercicio')
;(async () => {
  const a = await abrir({ preparar: async p => {
    // Una capa que nunca contesta. El plazo de la caja se acorta sólo en esta prueba.
    await p.route('**/*.geojson*', () => {})
  } })
  const { page } = a
  page.on('dialog', d => d.accept())
  try {
    const e = ejercicioRiesgo()
    e.aoi = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-68.5, -16.8], [-68.1, -16.8], [-68.1, -17.0], [-68.5, -17.0], [-68.5, -16.8]]] } }
    await sembrarYAbrir(page, e)
    await page.getByRole('button', { name: '⭐ CMTE.' }).first().dispatchEvent('click')
    await page.getByRole('button', { name: /F1·P3\s*Apreciación Activa del Comandante/ }).dispatchEvent('click')
    await page.getByRole('button', { name: '← Volver a mis hojas' }).waitFor()
    if (!(await page.getByRole('button', { name: '📋 Copiar el pedido' }).count())) await page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).dispatchEvent('click')
    await page.evaluate(() => {
      const timeout = window.setTimeout
      window.setTimeout = (f, ms, ...args) => timeout(f, ms === 30000 ? 80 : ms, ...args)
    })
    await page.getByRole('button', { name: '📋 Copiar el pedido' }).dispatchEvent('click')
    await page.getByText('La preparación tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.', { exact: true }).waitFor({ timeout: 8000 })
    assert.equal(await page.getByRole('button', { name: '📋 Copiar el pedido' }).isEnabled(), true)
    assert.equal(await page.getByRole('button', { name: '📋 Copiar texto preparado' }).count(), 0)
    console.log('OK: con el terreno detenido, la caja informa el plazo vencido y vuelve a habilitar la preparación.')
  } finally { await a.cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
