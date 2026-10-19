// F1·P4 Línea Inicial de Tiempo: lee los momentos de TODOS los documentos del ejercicio
// (index-linea-tiempo-20261019.js), en la Mesa real (Chromium). Lo pidió Sergio: la Orden decía
// «CG. … D-44 (0900)» y la misión «a partir del D (0400) y hasta el D+15 (1800)», pero la hoja
// quedaba con «Falta la recepción de la orden».
//   · la Orden (un .md con restos de formato) no tiene el membrete: la recepción sale del anexo;
//   · con el inicio y el fin ya puestos, la hoja vuelve a ofrecer lo que falta y NO pisa lo escrito;
//   · la lámina sale (TD calculado), sin errores de consola.
//   node calcos/pruebas/e2e/linea-tiempo.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-linea-tiempo')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')

const ORDEN_MD = [
  '# ORDEN DE OPERACIONES No. 01 (FICT.)',
  '**OBJETO**: Operaciones defensivas (FICT.) en la Primera Campaña (D a D\\+15).',
  'ORGANIZACIÓN DE LA TAREA: CE-I, CE-II (FICT.)',
  '## II.- MISIÓN.',
  'Las FF.TT. (FICT.) defienden, a partir del D (0400) y hasta el D\\+15 (1800), el sector comprendido entre la LDE-1 y la LDE-2.',
].join('\n\n')
const ANEXO = ['CTO', 'FF.TT. (FICT.)', 'CG. Pueblo-X. D-44 (0900)', 'EMO/SEC-I', 'ANEXO «H» (Plan de Personal) A LA ORDEN DE OPERACIONES No. 01 (FICT.)', 'Texto del anexo. '.repeat(10)].join('\n')

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA LINEA TIEMPO (FICT.)' })
  datos.documentos = [
    { nombre: 'ORDEN DE OPERACIONES No 01.md', categoria: 'orden', tipo: 'texto', texto: ORDEN_MD },
    { nombre: 'Anexo H - Plan de Personal.md', categoria: 'orden', tipo: 'texto', texto: ANEXO },
  ]
  // Como en la captura: el inicio y el fin ya entraron, la recepción no.
  datos.g3 = { ...(datos.g3 || {}), lineaTiempo: { modo: 'diaD', inicioOperacion: 'D (0400)', finOperaciones: 'D+15 (1800)', _origen: ['Inicio de la operación: D (0400) — misión'] } }
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    // Como el oficial: 🎯 Tablero del G-3 → 📄 Documentos → F1·P4.
    let hoja = page.getByRole('button', { name: /F1·P4\s*Línea Inicial de Tiempo/ })
    if (!(await hoja.count())) {
      await clic(page.getByRole('button', { name: /G-3/ }).first())
      await page.waitForTimeout(800)
      await clic(page.getByRole('button', { name: /^\W*Documentos$/ }).first())
      await page.waitForTimeout(800)
    }
    await clic(hoja.first())
    const oferta = page.getByRole('button', { name: /Completar lo que falta/ })
    await oferta.waitFor({ timeout: 15000 })
    const lectura = await oferta.locator('xpath=..').evaluate((n) => n.innerText)
    assert.ok(/D-44 \(0900\)/.test(lectura), 'la recepción sale del membrete del anexo:\n' + lectura)
    assert.match(lectura, /Anexo H/, 'dice de qué documento salió')
    await page.screenshot({ path: path.join(SALIDAS, '1-oferta.png') })
    await clic(oferta)
    await page.getByText(/Falta la recepción de la orden/).waitFor({ state: 'detached', timeout: 10000 })
    const valores = await page.locator('input[placeholder="D-15 (2300)"]').evaluateAll((xs) => xs.map((x) => x.value))
    assert.ok(valores.includes('D-44 (0900)'), `la recepción quedó cargada: ${valores}`)
    assert.ok(valores.includes('D (0400)') && valores.includes('D+15 (1800)'), 'el inicio y el fin siguen como estaban')
    assert.equal(await page.getByRole('button', { name: /Completar lo que falta|Usar estos datos/ }).count(), 0, 'ya no hay nada que ofrecer')
    await page.screenshot({ path: path.join(SALIDAS, '2-lamina.png') })
    await page.waitForTimeout(3000)
    const g = await leerGuardado(page, datos.nombre)
    const lt = g?.g3?.lineaTiempo || {}
    assert.equal(lt.recepcion, 'D-44 (0900)', 'quedó guardado en el ejercicio')
    assert.equal(lt.inicioOperacion, 'D (0400)')
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: la F1·P4 completa la recepción con el membrete del anexo, sin pisar el inicio y el fin, y se guarda.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
