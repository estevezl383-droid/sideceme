// 🔴 El CAE del G-2 desde el lado del enemigo y sin unidades inventadas (index-cae-enemigo-20261024.js), en la
// Mesa real (Chromium). El caso de Sergio: el CAE con la misión y el estado final PROPIOS y la «VI División de
// Ejército» inventada, que pasó a la F3·P4 y al P.D. 6 de la F4·P4.
//   · G-3, F3·P4: «🔎 Lo que entregó el G-2» avisa que el CAE está mal y la hoja, que nombra la «VI División»;
//     el pedido a la IA lleva «EL ENEMIGO ES EL DEL EJERCICIO» y que no copie el CAE;
//   · G-3, F4·P4: el aviso del P.D. 6;
//   · G-2, CAE: el aviso fijo; el pedido lleva «QUIÉN ES QUIÉN»; ✓ Aplicar una Intención escrita desde el
//     CE-I avisa; ✓ Aplicar el CAE bien escrito («Completar y mejorar») saca el aviso, y en la F3·P4 el
//     recuadro del G-2 ya no avisa (la hoja sí, hasta que se corrija);
//   · sin errores de consola.
//   node calcos/pruebas/e2e/cae-enemigo.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto, HOJA } = require('../concepto-ejemplo.js')
const { FILAS_PD } = require('../puntos-decision-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-cae-enemigo')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerPicb = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.cae && typeof v.cae === 'object' && 'Misión' in v.cae ? JSON.parse(JSON.stringify(v)) : undefined))

const CAE_MAL = {
  Misión: 'El CE-I (DIV MEC-2, DIV-1, DIV-6, GALM-1, RAM-4) defiende el AO LAUCA a partir del D (0400) sobre la LF «PUMA» para impedir la penetración enemiga hacia Turco y Huachacalla. [IA — verificar]',
  'Estado final deseado': HOJA['Estado final deseado'],
}
const CAE_BIEN = {
  Misión: 'La 1ª Br. Ac. «CORACEROS» ataca a partir del D (0400) por el valle del río Lauca (AA-1) para penetrar la defensa del CE-I en el paso Ungallire–Guata y llegar a Turco y Huachacalla.',
  'Intención del Comandante': 'Romper la LPR del CE-I en Ungallire con la masa blindada antes de que la DIV-6 pueda contraatacar.',
  'Estado final deseado': 'La 1ª Brigada Acorazada «CORACEROS» en posesión de Turco, con la defensa del CE-I desarticulada y su reserva (DIV-6) fijada al este de Macaya.',
}

async function verPedido(page, { mejorar = false } = {}) {
  if (mejorar) await clic(page.getByRole('button', { name: 'Completar y mejorar', exact: true }).first())
  await page.evaluate(() => { try { navigator.clipboard.writeText = async () => {} } catch {} })
  await clic(page.getByRole('button', { name: '📋 Copiar el pedido' }).first())
  await page.waitForTimeout(600)
  if (!(await page.getByRole('button', { name: '👁 Ver el pedido' }).count())) {
    const t = await page.evaluate(() => document.body.innerText)
    const i = t.indexOf('Copiar el pedido')
    throw new Error('No se armó el pedido: ' + t.slice(Math.max(0, i - 300), i + 600))
  }
  await clic(page.getByRole('button', { name: '👁 Ver el pedido' }).first())
  return page.locator('textarea[readonly]').last().inputValue()
}
async function hojaG3(page, paso, hoja) {
  await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
  await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
  await clic(page.getByRole('button', { name: paso }).first())
  await clic(page.getByRole('button', { name: hoja }).first())
  await page.getByText('🔎 Lo que entregó el G-2').first().waitFor({ timeout: 10000 })
}
async function cerrarPaneles(page) {
  for (let k = 0; k < 4; k++) {
    const v = page.getByRole('button', { name: /← Volver/ })
    if (!(await v.count())) break
    await clic(v.first()).catch(() => {})
    await page.waitForTimeout(200)
  }
  const x = page.getByRole('button', { name: '✕', exact: true })
  for (let k = (await x.count()) - 1; k >= 0; k--) await clic(x.nth(k)).catch(() => {})
  await page.waitForTimeout(300)
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const ej = ejercicioConcepto({ nombre: 'PRUEBA CAE ENEMIGO CE-I (FICT.)' })
  ej.g3 = { ...ej.g3, eventos: FILAS_PD }
  ej.picb = { cae: CAE_MAL }
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  try {
    await sembrarYAbrir(page, ej)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})

    // ── G-3, F3·P4: el recuadro del G-2 y la hoja avisan; el pedido lleva la regla ──
    await hojaG3(page, /Desarrollar los cursos de acción/, /F3·P4.*Concepto amplio/)
    await page.getByText(/«Misión» es la misión PROPIA/).first().waitFor({ timeout: 5000 })
    await page.getByText(/no lo copies a esta hoja/).first().waitFor({ timeout: 5000 })
    await page.getByText(/«VI División de Ejército» \(en «Estado final deseado»\) no está en las fichas/).first().waitFor({ timeout: 5000 })
    await foto('1-f3p4-avisos')
    await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
    const pg3 = await verPedido(page, { mejorar: true }) // la F3·P4 ya está llena
    assert.match(pg3, /# EL ENEMIGO ES EL DEL EJERCICIO/)
    assert.match(pg3, /El enemigo es 1ª BR\. AC\. «CORACEROS» \(una brigada\)/)
    assert.match(pg3, /⚠️ El CAE del G-2 tiene errores:\n  • «Misión» es la misión PROPIA[\s\S]*NO copies esas frases/)
    assert.ok(pg3.lastIndexOf('# EL ENEMIGO ES EL DEL EJERCICIO') < pg3.lastIndexOf('# CÓMO CONTESTAR'), 'antes de CÓMO CONTESTAR')
    await cerrarPaneles(page)

    // ── G-3, F4·P4: el P.D. 6 ──
    await hojaG3(page, /Analizar los cursos de acción/, /F4·P4.*Eventos críticos/)
    await page.getByText(/«VI División de Ejército» \(en «P\.D\. 6»\) no está en las fichas/).first().waitFor({ timeout: 5000 })
    await foto('2-f4p4-aviso')
    await cerrarPaneles(page)

    // ── G-2, CAE: el aviso fijo y el pedido ──
    await clic(page.getByRole('button', { name: /G-2 INTELIGENCIA/i }).first())
    await page.getByText('🔎 PICB — las 4 fases del G-2').waitFor({ timeout: 15000 })
    await clic(page.getByText('Desarrollar los cursos de acción del enemigo').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('CAE', { exact: true }).first())
    await page.getByText(/Revisar el CAE: está escrito desde NUESTRO lado/).first().waitFor({ timeout: 5000 })
    await page.getByText(/«VI División de Ejército» \(en «Estado final deseado»\)/).first().waitFor({ timeout: 5000 })
    await foto('3-cae-aviso')
    await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
    const pcae = await verPedido(page)
    assert.match(pcae, /# QUIÉN ES QUIÉN EN ESTA HOJA/)
    assert.match(pcae, /es el ENEMIGO: 1ª BR\. AC\. «CORACEROS» \(es una BRIGADA\)/)
    assert.match(pcae, /NOSOTROS somos CE-I/)
    assert.ok(pcae.lastIndexOf('# QUIÉN ES QUIÉN') < pcae.lastIndexOf('# CÓMO CONTESTAR'))

    // ✓ Aplicar una Intención escrita desde el CE-I (Sólo completar: va a la casilla vacía) → avisa
    const caja = page.locator('textarea[placeholder="Pegá acá la respuesta completa de la IA…"]').first()
    await caja.fill('```json\n' + JSON.stringify({ 'Intención del Comandante': 'El CE-I mantiene la LF «PUMA» y desgasta al primer escalón enemigo.' }) + '\n```')
    await clic(page.getByRole('button', { name: '✓ Aplicar' }).first())
    await page.getByText(/campo\(s\) completados.*⚠️ OJO, el CAE tiene errores: .*«Intención del Comandante» es la misión PROPIA/s).first().waitFor({ timeout: 5000 })
    await foto('4-aplicar-aviso')

    // ✓ Aplicar el CAE bien escrito, «Completar y mejorar» → sin aviso
    await clic(page.getByRole('button', { name: 'Completar y mejorar', exact: true }).first())
    await caja.fill('```json\n' + JSON.stringify(CAE_BIEN) + '\n```')
    await clic(page.getByRole('button', { name: '✓ Aplicar' }).first())
    await page.getByText(/campo\(s\) escritos/).first().waitFor({ timeout: 5000 })
    assert.equal(await page.getByText(/⚠️ OJO/).count(), 0, 'el mensaje ya no avisa')
    assert.equal(await page.getByText(/es la misión PROPIA/).count(), 0, 'el aviso fijo se fue')
    const picb = await leerPicb(page)
    assert.match(picb.cae.Misión, /^La 1ª Br\. Ac\. «CORACEROS» ataca/)
    await foto('5-cae-corregido')
    await cerrarPaneles(page)

    // ── G-3, F3·P4 otra vez: el recuadro del G-2 ya no avisa; la hoja sí (todavía dice «VI División») ──
    await hojaG3(page, /Desarrollar los cursos de acción/, /F3·P4.*Concepto amplio/)
    await page.getByText(/«VI División de Ejército» \(en «Estado final deseado»\) no está en las fichas/).first().waitFor({ timeout: 5000 })
    assert.equal(await page.getByText(/no lo copies a esta hoja/).count(), 0, 'el CAE ya está bien')
    await page.getByText(/Misión estimada del enemigo:/).first().waitFor({ timeout: 5000 })
    await foto('6-f3p4-despues')

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e CAE del enemigo: avisos en el G-2 y el G-3, los pedidos con la regla, ✓ Aplicar avisa y se va al corregir')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
