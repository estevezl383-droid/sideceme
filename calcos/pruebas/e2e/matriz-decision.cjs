// 🎖️ La F5·P1 Matriz de decisión con los DOS CAP, que sustenta la decisión del Comandante (index-matriz-decision-
// 20261108.js), en la Mesa real (Chromium). Sergio, 08-11-2026: «en el paso 5 comparación de los cursos de acción se
// supone que debería generar algo que favorezca a lo que ya se decidió; eran dos cursos de acción, no debe haber cabida
// para otro… y que evalúe todas esas ventajas… todo eso debe llenar». Como lo tenía él: el Comandante decidió el CAP 2
// en la F4·P6-7, el CAP 1 a la vista, y la F5·P1 con cuatro factores escritos en tres columnas (CAP-1 recomendado):
//   · la hoja tiene dos columnas (CAP-1, CAP-2: 8 × 2 casillas) y dice el CAP decidido, sin «A la vista está…»;
//   · el pedido de la IA trae los dos CAP, los ocho factores, «NO existe un CAP-3» y que sostenga el CAP 2;
//   · «Completar y mejorar» llena las 16 casillas y «RECOMENDADO AL COMANDANTE» queda en el CAP-2;
//   · la vista previa sin CAP-3; sin errores de consola.
//   node calcos/pruebas/e2e/matriz-decision.cjs        (DPR=2 para la pantalla Retina de Sergio)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioRiesgo } = require('../riesgo-ejercicio.js')

const DPR = Number(process.env.DPR || 1)
const SALIDAS = path.join(__dirname, '..', 'salidas-matriz-decision')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.decision && typeof v.decision === 'object' && v._caps ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}
const FACTORES = ['VENTAJAS', 'DESVENTAJAS', 'RIESGO', 'SIMPLICIDAD', 'FLEXIBILIDAD (ramas y secuelas)', 'SOSTENIBILIDAD LOGÍSTICA', 'EMPLEO DE LA RESERVA', 'CUMPLE LA INTENCIÓN DEL CMTE.']

function ejercicio() {
  const ej = ejercicioRiesgo()
  ej.nombre = 'PRUEBA MATRIZ DE DECISION (FICT.)'
  const propias = ej.unidades.filter((u) => u.bando === 'propias')
  ej.fasesCOA.propio = [
    { nombre: 'Concentración', tarea: 'Concentrar el CE-I (FICT.)', unidades: propias, ops: {} },
    { nombre: 'Defensa de la posición', tarea: 'Defender la LPR (FICT.)', unidades: propias, ops: {} },
  ]
  const fasesCAP2 = [
    { nombre: 'Retardo', tarea: 'Retardar desde la LDE-1 (FICT.)', unidades: propias, ops: {} },
    { nombre: 'Contraataque de la masa', tarea: 'Destruir al enemigo entre la LDE-1 y la LPR (FICT.)', unidades: propias, ops: {} },
  ]
  // Lo que tenía Sergio: cuatro factores, tres columnas, y el CAP-1 «ganando».
  const viejo = {
    'VENTAJAS|CAP-1': 'Aprovecha el terreno (FICT.)', 'VENTAJAS|CAP-2': 'Otorga mayor libertad (FICT.)', 'VENTAJAS|CAP-3': 'Busca preservar (FICT.)',
    'RIESGO|CAP-1': 'MODERADO (FICT.)', 'RIESGO|CAP-2': 'SUMAMENTE ALTO (FICT.)', 'RIESGO|CAP-3': 'SUMAMENTE ALTO (FICT.)',
    _marca: { 'CAP-1': 'RECOMENDADO AL COMANDANTE' },
  }
  ej.g3 = {
    ...(ej.g3 || {}),
    coa: { 'Denominación del CAP': 'CAP 1 — Defensa de área (FICT.)', 'CÓMO (forma de maniobra)': 'Defensa de área en la LPR (FICT.)' },
    decision: viejo,
    _caps: { activo: 1, decision: { cap: 2, t: 'T' }, formas: { 1: 'area', 2: 'movil' }, guardados: { 2: { fases: fasesCAP2, coa: { 'Denominación del CAP': 'CAP 2 — Defensa móvil (FICT.)', 'CÓMO (forma de maniobra)': 'Retardo y contraataque de la masa (FICT.)' } } } },
  }
  return ej
}
// La respuesta de la IA: los 16 casilleros; marca a propósito el CAP-1 (la Mesa la deja en el decidido).
const RESPUESTA = JSON.stringify(Object.fromEntries([
  ...FACTORES.flatMap((f) => [[`${f}|CAP-1`, `${f} del CAP 1 (IA, FICT.)`], [`${f}|CAP-2`, `${f} del CAP 2 (IA, FICT.)`]]),
  ['_marca|CAP-1', 'RECOMENDADO AL COMANDANTE'],
]), null, 1)

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1500, alto: 950, escalaPantalla: DPR })
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push(d.message())
    d.accept()
  })
  const foto = (n, loc) => (loc || page).screenshot({ path: path.join(SALIDAS, `${n}${DPR > 1 ? '-dpr' + DPR : ''}.png`) })
  try {
    await sembrarYAbrir(page, ejercicio())
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Comparar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F5·P1.*Matriz de decisión/ }).first())
    await page.getByRole('button', { name: /Volver a mis documentos/ }).first().waitFor({ timeout: 10000 })
    const doc = page.locator('div').filter({ has: page.getByRole('button', { name: /Volver a mis documentos/ }) }).filter({ has: page.locator('table') }).last()

    // ── La hoja: dos columnas y el CAP decidido ──
    assert.equal((await page.locator('[data-dec-aviso]').innerText()).trim(), '🎖️ El Comandante decidió el CAP 2 · Defensa móvil (FICT.): esta comparación lo sustenta.')
    const tabla = page.locator('table').filter({ has: page.locator('textarea') }).filter({ hasText: 'EMPLEO DE LA RESERVA' }).first()
    assert.deepEqual((await tabla.locator('th').allInnerTexts()).map((t) => t.trim()), ['Factor', 'CAP-1', 'CAP-2'])
    assert.equal(await tabla.locator('textarea').count(), 16, '8 factores × 2 CAP')
    assert.equal(await doc.getByText('CAP-3', { exact: true }).count(), 0, 'sin CAP-3')
    await tabla.scrollIntoViewIfNeeded()
    await foto('1-dos-columnas')

    // ── 🤖 El pedido ──
    await clic(doc.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
    await clic(doc.getByRole('button', { name: 'Completar y mejorar' }))
    await clic(doc.getByRole('button', { name: '📋 Copiar el pedido' }))
    await doc.getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
    await clic(doc.getByRole('button', { name: /Ver el pedido/ }))
    const pedido = await doc.locator('textarea[readonly]').inputValue()
    fs.writeFileSync(path.join(SALIDAS, 'pedido.md'), pedido)
    for (const t of ['NO existe un CAP-3', 'Los factores son 8:', '«CUMPLE LA INTENCIÓN DEL CMTE.»', 'el Comandante decidió el CAP 2 «Defensa móvil (FICT.)»', 'SOSTENER el CAP-2', 'el CAP-2 sale MEJOR que el CAP-1', '«_marca|CAP-2» = «RECOMENDADO AL COMANDANTE»', '## CAP-1 · Defensa de área (FICT.)', '## CAP-2 · Defensa móvil (FICT.) (DECIDIDO POR EL COMANDANTE)', 'Retardo y contraataque de la masa (FICT.)', 'FASE II — Contraataque de la masa', '"SOSTENIBILIDAD LOGÍSTICA|CAP-2"', '¿CAP-2 es RECOMENDADO AL COMANDANTE?'])
      assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
    assert.ok(!pedido.includes('"VENTAJAS|CAP-3"') && !pedido.includes('MÁS PROBABLE o MÁS PELIGROSO'), 'nada de CAP-3 ni de la marca del G-2')
    assert.ok(pedido.indexOf('# LA DECISIÓN YA ESTÁ TOMADA') < pedido.lastIndexOf('# CÓMO CONTESTAR'))

    // ── ✓ Aplicar «Completar y mejorar» ──
    await doc.locator('textarea[placeholder^="Pegá acá la respuesta"]').fill(RESPUESTA)
    await clic(doc.getByRole('button', { name: '✓ Aplicar' }))
    const g3 = await esperar(page, leerG3, (v) => v.decision['SOSTENIBILIDAD LOGÍSTICA|CAP-2'])
    for (const f of FACTORES) for (const c of [1, 2]) assert.ok(String(g3.decision[`${f}|CAP-${c}`]).startsWith(`${f} del CAP ${c} (IA, FICT.)`), `${f}|CAP-${c}: ${g3.decision[`${f}|CAP-${c}`]}`)
    assert.deepEqual(g3.decision._marca, { 'CAP-2': 'RECOMENDADO AL COMANDANTE' }, 'recomendado: el decidido')
    const valores = await tabla.locator('textarea').evaluateAll((xs) => xs.map((x) => x.value))
    assert.equal(valores.filter((v) => /\(IA, FICT\.\)/.test(v)).length, 16, 'las 16 en pantalla')
    await tabla.scrollIntoViewIfNeeded()
    await foto('2-llena')

    // ── La vista previa: dos columnas y la X en el CAP-2 ──
    await clic(doc.getByRole('button', { name: /Vista previa/ }).first())
    await page.waitForTimeout(800)
    const html = await page.evaluate(() => [...document.querySelectorAll('iframe')].map((f) => f.contentDocument?.body?.innerHTML || '').join('') + document.body.innerHTML)
    const i = html.indexOf('SOSTENIBILIDAD LOGÍSTICA')
    assert.ok(i > 0, 'la vista previa trae la matriz')
    assert.ok(!/CAP-3/.test(html.slice(Math.max(0, i - 3000), i + 6000)), 'la vista previa sin CAP-3')
    await foto('3-vista-previa')

    assert.deepEqual(dialogos, [])
    assert.deepEqual(errores, [])
    console.log(`OK — F5·P1 con los dos CAP, sustenta el decidido (DPR ${DPR})`)
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
