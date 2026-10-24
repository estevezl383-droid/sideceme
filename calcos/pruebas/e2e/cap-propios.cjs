// 💡 Los dos cursos de acción propios que propone la Mesa (index-cap-propios-20261024.js), en la Mesa real
// (Chromium), con un ejercicio con la forma del de Sergio (CE-I en el AO LAUCA, F3·P4 de defensa de área):
//   · F3·P6: el panel propone CAP 1 · Defensa de área y CAP 2 · Defensa móvil, con quién hace qué;
//   · el pedido de la IA lleva la propuesta y que diga si cada CAP sirve para este ejercicio;
//   · 🌱 lleva el CAP 1 a la hoja; 🎬 arma sus 5 fases 🔵 con la tarea de cada unidad;
//   · CAP 2: las fases y la F3·P6 del CAP 1 quedan guardadas; se arman las del CAP 2 (defensa móvil);
//   · de vuelta al CAP 1 (desde el 🎬 C.A. por fases) vuelve todo; sin errores de consola.
//   node calcos/pruebas/e2e/cap-propios.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-cap-propios')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerFases = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.propio) && Array.isArray(v.enemigo) ? JSON.parse(JSON.stringify({ propio: v.propio.map((f) => ({ nombre: f.nombre, origen: f.origen, unidades: (f.unidades || []).filter((u) => u.tarea).map((u) => ({ id: u.id, tarea: u.tarea, principal: !!u.principal })) })), enemigo: v.enemigo.length })) : undefined))
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.concepto && typeof v.concepto === 'object' && 'Forma de maniobra elegida y por qué' in v.concepto ? JSON.parse(JSON.stringify(v)) : v && v._caps && typeof v._caps === 'object' ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const ej = ejercicioConcepto({ nombre: 'PRUEBA CAP PROPIOS CE-I (FICT.)' })
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  try {
    await sembrarYAbrir(page, ej)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})

    // ── F3·P6: el panel ──
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first())
    const panel = page.locator('[data-cap-panel="coa"]')
    await panel.waitFor({ timeout: 10000 })
    await panel.getByText('● CAP 1 · Defensa de área (tenaz)').waitFor({ timeout: 5000 })
    await panel.getByText('CAP 2 · Defensa móvil').first().waitFor({ timeout: 5000 })
    await panel.getByText(/★ Masa de contraataque \(esfuerzo principal\): DIV-6/).waitFor({ timeout: 5000 })
    await panel.getByText(/★ Esfuerzo principal: DIV MEC-2 — Defender la LPR en la LF «PUMA» sobre la AA-1/).waitFor({ timeout: 5000 })
    await foto('1-panel')

    // ── El pedido de la IA ──
    await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
    await page.evaluate(() => { try { navigator.clipboard.writeText = async () => {} } catch {} })
    await clic(page.getByRole('button', { name: '📋 Copiar el pedido' }).first())
    await page.waitForTimeout(600)
    await clic(page.getByRole('button', { name: '👁 Ver el pedido' }).first())
    const pedido = await page.locator('textarea[readonly]').last().inputValue()
    assert.match(pedido, /# LO QUE PROPONE LA MESA PARA ESTE EJERCICIO — DOS CURSOS DE ACCIÓN PROPIOS/)
    assert.match(pedido, /## CAP 1 — Defensa de área \(tenaz\) \(esfuerzo en la AA-1\) ← EL ACTIVO/)
    assert.match(pedido, /## CAP 2 — Defensa móvil/)
    assert.match(pedido, /SIRVE o NO SIRVE para ESTE ejercicio/)
    assert.ok(pedido.lastIndexOf('# LO QUE PROPONE LA MESA') < pedido.lastIndexOf('# CÓMO CONTESTAR'))
    assert.match(pedido, /# EL ENEMIGO ES EL DEL EJERCICIO/, 'la regla del CAE sigue')

    // ── 🌱 Llevar el CAP 1 a la hoja ──
    await clic(panel.getByRole('button', { name: /Llevar el CAP 1 a esta hoja/ }))
    let g3 = await esperar(page, leerG3, (g) => !!g.coa)
    assert.match(g3.coa['Denominación del CAP'], /^CAP 1 — Defensa de área \(tenaz\) \(esfuerzo en la AA-1\) \[Mesa — verificar\]$/)
    await panel.getByText(/10 casilla\(s\) con el CAP 1/).waitFor({ timeout: 5000 })

    // ── 🎬 Las 5 fases 🔵 del CAP 1 ──
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 1/ }))
    let fc = await esperar(page, leerFases, (f) => f.propio.length === 5)
    assert.deepEqual(fc.propio.map((f) => f.nombre), ['Concentración', 'Desplazamiento', 'Ocupación y organización de la posición', 'Conducción de la defensa', 'Contraataque y consolidación'])
    assert.deepEqual(fc.propio[3].unidades.find((u) => u.id === 'divmec2'), { id: 'divmec2', tarea: 'Detener al enemigo en la AA-1', principal: true })
    await panel.getByText('5 fase(s) 🔵 · el que estás trabajando').waitFor({ timeout: 5000 })
    await foto('2-cap1-fases')

    // ── CAP 2: lo del CAP 1 queda guardado ──
    await clic(panel.locator('button[data-cap="2"]'))
    g3 = await esperar(page, leerG3, (g) => g._caps?.activo === 2)
    assert.equal(g3._caps.activo, 2)
    assert.ok(!g3.coa, 'la F3·P6 del CAP 2 empieza vacía')
    assert.match(g3._caps.guardados[1].coa['Denominación del CAP'], /^CAP 1/)
    assert.equal(g3._caps.guardados[1].fases.length, 5)
    fc = await esperar(page, leerFases, (f) => f.propio.length === 0)
    assert.equal(fc.propio.length, 0)
    await panel.getByText('● CAP 2 · Defensa móvil').waitFor({ timeout: 5000 })
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 2/ }))
    fc = await esperar(page, leerFases, (f) => f.propio.length === 5)
    assert.deepEqual(fc.propio.map((f) => f.nombre), ['Concentración', 'Desplazamiento', 'Organización de la defensa móvil', 'Retardo y canalización', 'Contraataque y consolidación'])
    assert.equal(fc.propio[4].unidades.find((u) => u.id === 'div6').tarea, 'Contraatacar y destruir al enemigo')
    await foto('3-cap2-fases')
    // El pedido ahora dice que el activo es el CAP 2.
    await clic(page.getByRole('button', { name: '📋 Copiar el pedido' }).first())
    await page.waitForTimeout(600)
    const ped2 = await page.locator('textarea[readonly]').last().inputValue()
    assert.match(ped2, /## CAP 2 — Defensa móvil ← EL ACTIVO/)

    // ── La F3·P4 del CAP 2 (vacía) se abre con su panel ──
    await clic(page.getByRole('button', { name: /← Volver a mis documentos/ }).first())
    await clic(page.getByRole('button', { name: /F3·P4.*Concepto amplio/ }).first())
    const pc = page.locator('[data-cap-panel="concepto"]')
    await pc.waitFor({ timeout: 10000 })
    await pc.getByText('● CAP 2 · Defensa móvil').waitFor({ timeout: 5000 })
    await page.getByText('EL CONCEPTO EN LA CARTA').first().waitFor({ timeout: 10000 })
    await foto('3b-f3p4-cap2')

    // ── De vuelta al CAP 1 desde el 🎬 C.A. por fases ──
    await clic(page.getByRole('button', { name: /← Volver a mis documentos/ }).first()).catch(() => {})
    await clic(page.getByRole('button', { name: /C\.A\. POR FASES/i }).first())
    const botones = page.locator('[data-cap-botones] button[data-cap="1"]').first()
    await botones.waitFor({ timeout: 10000 })
    assert.match(await page.locator('[data-cap-botones] button[data-cap="2"]').first().innerText(), /● CAP 2 · Defensa móvil \(5\)/)
    assert.match(await botones.innerText(), /^CAP 1 · Defensa de área \(5\)$/)
    await foto('4-ca-por-fases')
    await clic(botones)
    fc = await esperar(page, leerFases, (f) => f.propio.length === 5 && f.propio[2].nombre === 'Ocupación y organización de la posición')
    assert.equal(fc.propio[2].nombre, 'Ocupación y organización de la posición', 'volvieron las fases del CAP 1')
    g3 = await esperar(page, leerG3, (g) => g._caps?.activo === 1)
    assert.match(g3.coa['Denominación del CAP'], /^CAP 1/, 'volvió la F3·P6 del CAP 1')
    assert.equal(g3._caps.guardados[2].fases.length, 5, 'el CAP 2 quedó guardado')
    assert.ok(g3.concepto && g3.concepto['Forma de maniobra elegida y por qué'], 'la F3·P4 del CAP 1 volvió')
    assert.equal(fc.enemigo, 0)

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e CAP propios: la propuesta, el pedido de la IA, 🌱 a la hoja, 🎬 las fases, CAP 1 ↔ CAP 2 sin perder nada')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
