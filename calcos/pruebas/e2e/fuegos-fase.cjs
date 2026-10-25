// 🔥 Los fuegos por fase y 📝 el texto de la F3·P6 desde la carta (index-fuegos-fase-20261024.js), en la Mesa real
// (Chromium), con el ejercicio de prueba del CE-I (con una concentración AB-012 en su plan de fuegos) y la respuesta de
// IA de ejemplo (cap-carta-ejemplo.js: fuegos en la fase 4 de cada CAP):
//   · al aplicar, la FASE 1 del CAP 1 tiene sólo AB-012; la FASE 4, AB-012, AB-013 y AB-014; al volver a la 1, otra vez
//     una sola: cada fase con su plan de fuegos;
//   · una fase nueva (＋ Fase) no trae plan: se queda con el que estaba, y al dejarla lo guarda;
//   · 📝 «Llevar la carta a la F3·P6 de los dos CAP»: el bloque «Según la carta» en la hoja del CAP 1 (con los fuegos
//     AB-013 y AB-014) y en la del CAP 2 (guardada);
//   · el pedido de la IA de la F3·P6 lleva «LO QUE YA ESTÁ EN LA CARTA»; sin errores de consola.
//   node calcos/pruebas/e2e/fuegos-fase.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')
const { RESPUESTA_TEXTO } = require('../cap-carta-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-fuegos-fase')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerPlan = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.blancos) && 'verEnCarta' in v ? v.blancos.map((b) => b.num) : undefined))
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v._caps && typeof v._caps === 'object' ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}
const igual = (a) => (v) => JSON.stringify(v) === JSON.stringify(a)

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const ej = ejercicioConcepto({ nombre: 'PRUEBA FUEGOS POR FASE CE-I (FICT.)' })
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  ej.planFuegos = { version: 1, medios: {}, verEnCarta: true, blancos: [{ id: 'pf-1', num: 'AB-012', lng: -69.0, lat: -18.5, cota: null, forma: 'circular', radioM: 200, largoM: 400, anchoM: 200, orientacion: 0, tipo: 'apoyo', efecto: 'neutralizar', ejecucion: 'a_pedido', medio: null, descripcion: '' }] }
  try {
    await sembrarYAbrir(page, ej)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    assert.deepEqual(await esperar(page, leerPlan, igual(['AB-012'])), ['AB-012'])

    // ── La IA pone los dos CAP (con fuegos) ──
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first())
    const panel = page.locator('[data-cap-panel="coa"]')
    await panel.waitFor({ timeout: 10000 })
    await clic(panel.getByRole('button', { name: /La IA desarrolla los dos CAP EN LA CARTA/ }))
    await page.evaluate(() => { try { navigator.clipboard.writeText = async () => {} } catch {} })
    await clic(panel.getByRole('button', { name: '📋 Copiar el pedido' }))
    await page.waitForTimeout(800)
    await clic(panel.getByRole('button', { name: '👁 Ver el pedido' }))
    const pedido = await panel.locator('textarea[readonly]').last().inputValue()
    assert.match(pedido, /## Tipos de fuego \(id\)\npreparacion \(Fuego de preparación\)/, 'el catálogo del plan de fuegos de la Mesa')
    assert.match(pedido, /## Efectos del fuego \(id\)\ndestruir \(Destruir\)/)
    await panel.locator('textarea[placeholder="Pegá acá la respuesta completa de la IA…"]').fill(RESPUESTA_TEXTO)
    await clic(panel.getByRole('button', { name: '✓ Aplicar' }))
    await panel.getByText(/🗺️ CAP 1: 5 fases · CAP 2: 5 fases en la carta/).waitFor({ timeout: 8000 })
    await panel.getByText(/el lugar del fuego «apoyo» \(«Pampa Inexistente»\) no está en la carta/).waitFor({ timeout: 5000 })
    assert.deepEqual(await esperar(page, leerPlan, igual(['AB-012'])), ['AB-012'], 'la FASE 1 del CAP 1')

    // ── En el 🎬 C.A. por fases: cada fase con su plan ──
    await clic(page.getByRole('button', { name: /← Volver a mis documentos/ }).first()).catch(() => {})
    await clic(page.getByRole('button', { name: /C\.A\. POR FASES/i }).first())
    await clic(page.getByRole('button', { name: 'FASE 4', exact: true }).last())
    assert.deepEqual(await esperar(page, leerPlan, igual(['AB-012', 'AB-013', 'AB-014'])), ['AB-012', 'AB-013', 'AB-014'], 'la FASE 4')
    await page.evaluate(() => void window.__mapa2d.fitBounds([[-18.9, -69.4], [-18.2, -68.2]]))
    await page.waitForTimeout(600)
    await foto('1-fase4-fuegos')
    await clic(page.getByRole('button', { name: 'FASE 1', exact: true }).last())
    assert.deepEqual(await esperar(page, leerPlan, igual(['AB-012'])), ['AB-012'], 'de vuelta en la FASE 1')
    await clic(page.getByRole('button', { name: 'FASE 4', exact: true }).last())
    assert.deepEqual(await esperar(page, leerPlan, igual(['AB-012', 'AB-013', 'AB-014'])), ['AB-012', 'AB-013', 'AB-014'], 'la FASE 4 otra vez')
    // Una fase nueva no trae plan: queda el que estaba, y al dejarla lo guarda.
    await clic(page.getByRole('button', { name: '＋ Fase', exact: true }).last())
    await page.getByRole('button', { name: 'FASE 6', exact: true }).last().waitFor({ timeout: 5000 })
    assert.deepEqual(await leerPlan(page), ['AB-012', 'AB-013', 'AB-014'], 'la FASE 6 nueva sigue con el plan que estaba')
    await clic(page.getByRole('button', { name: 'FASE 1', exact: true }).last())
    assert.deepEqual(await esperar(page, leerPlan, igual(['AB-012'])), ['AB-012'])
    await clic(page.getByRole('button', { name: 'FASE 6', exact: true }).last())
    assert.deepEqual(await esperar(page, leerPlan, igual(['AB-012', 'AB-013', 'AB-014'])), ['AB-012', 'AB-013', 'AB-014'], 'la FASE 6 guardó su plan')

    // ── 📝 Llevar la carta a la F3·P6 de los dos CAP ──
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first())
    await panel.waitFor({ timeout: 10000 })
    await clic(panel.locator('[data-cap-texto]'))
    const g3 = await esperar(page, leerG3, (g) => /Según la carta/.test(g.coa?.['Bosquejo: qué muestra el calco'] || '') && /Según la carta/.test(g._caps?.guardados?.[2]?.coa?.['Bosquejo: qué muestra el calco'] || ''))
    const bos = g3.coa['Bosquejo: qué muestra el calco']
    assert.match(bos, /— Según la carta \(fases 🔵\):\nFASE 1 — Concentración \(D-10 a D-8\)/)
    assert.match(bos, /FASE 4 — Conducción de la defensa \(D a D\+8\): .*Fuegos: AB-013 fuego de protección final \(barrera\) en Ungallire — lo bate RAM-4/)
    assert.match(g3.coa.DÓNDE, /DIV MEC-2 en Guata/)
    assert.match(g3.coa.QUÉ, /^Defiende\. \[IA — verificar\]$/, 'lo que escribió la IA no se tocó')
    assert.match(g3._caps.guardados[2].coa['Bosquejo: qué muestra el calco'], /FASE 4 — Retardo y canalización .*Fuegos: AB-013 interdicción en Guata/)
    // Otra vez: el bloque se reemplaza, no se duplica.
    await clic(panel.locator('[data-cap-texto]'))
    await page.waitForTimeout(500)
    const g3b = await leerG3(page)
    assert.equal(g3b.coa['Bosquejo: qué muestra el calco'].split('Según la carta').length - 1, 1)
    await foto('2-texto')

    // ── El pedido de la IA de la F3·P6 lleva lo que está en la carta ──
    const cajas = page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' })
    await clic(cajas.last())
    await clic(page.getByRole('button', { name: 'Completar y mejorar', exact: true }).last())
    await clic(page.getByRole('button', { name: '📋 Copiar el pedido' }).last())
    await page.waitForTimeout(800)
    await clic(page.getByRole('button', { name: '👁 Ver el pedido' }).last())
    const ped = await page.locator('textarea[readonly]').last().inputValue()
    assert.match(ped, /# LO QUE YA ESTÁ EN LA CARTA — CAP 1, fase por fase/)
    assert.match(ped, /fuego AB-013 fuego de protección final \(barrera\) en Ungallire/)

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e fuegos por fase y texto desde la carta: cada fase con su plan de fuegos, la F3·P6 de los dos CAP desde la carta, el pedido con lo de la carta')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
