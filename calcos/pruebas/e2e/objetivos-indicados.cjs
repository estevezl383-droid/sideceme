// 🎯 Los objetivos van donde el G-2 los indica (index-objetivos-indicados-20261020.js), en la Mesa real
// (Chromium). El caso de Sergio: acuesta los objetivos, no le convencen, escribe en «Tu indicación para
// esta hoja» de la H.T. 16 «EL TERRENO C 13 ES EL OBJETIVO UNO, OSEA EL TERRENO CLAVE 13» y vuelve a
// apretar «🎯 Acostar los OBJETIVOS sobre el calco»:
//   · el OBJETIVO FINAL (O1) queda sobre el terreno clave C13 y el aviso lo dice;
//   · la indicación queda guardada en picb._indic.ht16 (vuelve al cerrar y reabrir la caja);
//   · sin errores de consola.
//   node calcos/pruebas/e2e/objetivos-indicados.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-objetivos-indicados')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const INDICACION = 'EL TERRENO C 13 ES EL OBJETIVO UNO , OSEA EL TERRENO CLAVE 13'

const leerObjetivos = (page) =>
  estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.objetivos) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify(v.objetivos)) : undefined))
async function esperar(page, leer, cumple, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(250)
  }
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA OBJETIVOS INDICADOS (FICT.)' })
  // A.O. de ejercicioPersonal: [-68.6, -68.0] × [-17.4, -16.8]. 15 terrenos clave en diagonal; C13 cerca del borde este.
  const av = (lat) => {
    const c = []
    for (let lng = -69.0; lng <= -67.6; lng += 0.05) c.push([+lng.toFixed(3), lat])
    return { coords: c, escalon: 'batallon', bando: 'enemigo' }
  }
  const clave = Array.from({ length: 15 }, (_, i) => ({ etiqueta: `C${i + 1}`, centro: [+(-68.56 + i * 0.038).toFixed(4), +(-16.85 - i * 0.035).toFixed(4)], razon: 'altura' }))
  datos.cmoc = { restringido: [], severo: [], clave, defensivo: [], ae: [], corredores: [], avenidas: [av(-16.95), av(-17.1), av(-17.25)], desplazamientos: [] }
  datos.picb = { _pd: { manual: 'rojo', nivel: 'brigada', dirEnemigo: 'O' } }
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-2 INTELIGENCIA/i }).first())
    await page.getByText('🔎 PICB — las 4 fases del G-2').waitFor({ timeout: 15000 })
    await clic(page.getByText('Evaluar la amenaza').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('P.D.', { exact: true }).first())
    await clic(page.getByRole('button', { name: /Acostar «/ }).first())
    await page.waitForTimeout(800)

    // ── H.T. 16: acostar como antes ──
    await clic(page.getByText('← Volver a la PICB').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('Desarrollar los cursos de acción del enemigo').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('H.T. 16', { exact: true }).first())
    const acostar = page.getByRole('button', { name: /Acostar los OBJETIVOS sobre el calco/ }).first()
    await acostar.waitFor({ timeout: 10000 })
    await clic(acostar)
    const antes = await esperar(page, leerObjetivos, (o) => o.length > 0)
    assert.ok(antes?.length, 'se acostaron los objetivos')
    const c13 = clave[12].centro
    assert.notDeepEqual(antes.find((o) => o.clase === 'final').centro, c13, 'sin indicación, el final no cae en C13')

    // ── La indicación de Sergio y Acostar otra vez ──
    await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
    const caja = page.locator('textarea[placeholder^="Ej.: «Trabajá sólo"]').first()
    await caja.fill(INDICACION)
    await page.waitForTimeout(300)
    await clic(acostar)
    const desp = await esperar(page, leerObjetivos, (o) => o.some((x) => x.indicado))
    const fin = desp.find((o) => o.clase === 'final')
    assert.deepEqual(fin.centro, c13, 'el OBJETIVO FINAL (O1) queda sobre C13')
    assert.equal(fin.etiqueta, 'O1')
    assert.equal(fin.apoyadoEn, 'C13')
    assert.equal(desp.length, antes.length, 'no agrega ni quita objetivos')
    await page.getByText(/Por lo que indicaste: el OBJETIVO FINAL \(O1\) en C13/).first().waitFor({ timeout: 5000 })
    await page.screenshot({ path: path.join(SALIDAS, '1-o1-en-c13.png') })

    // ── Queda guardada con la hoja ──
    const guardada = await estadoReact(page, (v) => (v && v._indic && typeof v._indic === 'object' ? v._indic.ht16 : undefined))
    assert.equal(guardada, INDICACION, 'la indicación se guarda en picb._indic.ht16')
    await clic(page.getByText('← Volver a la PICB').first())
    await page.waitForTimeout(300)
    await clic(page.getByText('H.T. 16', { exact: true }).first())
    await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
    assert.equal(await page.locator('textarea[placeholder^="Ej.: «Trabajá sólo"]').first().inputValue(), INDICACION, 'al volver a la hoja la indicación sigue ahí')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: con «C 13 es el objetivo uno» el O1 se acuesta sobre C13; la indicación queda guardada con la hoja.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
