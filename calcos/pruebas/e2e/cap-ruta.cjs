// 🔵 El recorrido de cada CAP (index-ruta-cap-20261111.js) en la Mesa real (Chromium). Sergio, 11-11-2026: «cada
// curso de acción debe seguir los pasos (F3·P3 → F3·P6)… primero se termine un curso de acción CAP 1 y luego vuelva la
// opción para generar otro curso de acción desde el principio… en cada curso de acción es necesario colocar su plan de
// fuegos y su barrera de obstáculos… los planes de fuegos automáticamente deben salir de las unidades de artillería».
// Con el CE-I (FICT.) de concepto-ejemplo (RAM-4 y GALM-1), las cuatro hojas del CAP 1 escritas y un obstáculo:
//   · 📄 Documentos → 3: el recorrido con 7 pasos; el CAP 2 con 🔒;
//   · 🔥 Armar el plan de fuegos: cada concentración con RAM-4 o GALM-1;
//   · 🎬 Armar las fases; ✓ Terminar el CAP 1; ➕ Generar el CAP 2 → abre la F3·P3 (compacto: CAP 2, 0 de 7), las
//     hojas en blanco, la carta sin obstáculos ni fuegos;
//   · volver al CAP 1: sus hojas, su obstáculo y su plan; sin errores de consola.
//   node calcos/pruebas/e2e/cap-ruta.cjs        (DPR=2 para la pantalla Retina de Sergio)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto, HOJA } = require('../concepto-ejemplo.js')

const DPR = Number(process.env.DPR || 1)
const SALIDAS = path.join(__dirname, '..', 'salidas-cap-ruta')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.potencia && typeof v.potencia === 'object' ? JSON.parse(JSON.stringify(v)) : undefined))
const leerPlan = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.blancos) && v.medios ? JSON.parse(JSON.stringify(v)) : undefined))
const leerOps = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.obstaculos) && Array.isArray(v.pasaje) ? JSON.parse(JSON.stringify({ obstaculos: v.obstaculos, tareas: v.tareas })) : undefined))
const leerFases = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.propio) && Array.isArray(v.enemigo) ? { propio: v.propio.length } : undefined))
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

function ejercicio() {
  const ej = ejercicioConcepto({ nombre: 'PRUEBA RUTA CAP CE-I (FICT.)' })
  ej.g3 = {
    potencia: { 'Propias|1': 'PRC del CE-I (FICT.)' },
    organizacion: { 'Agrupación|1': 'OD: DIV MEC-2 (FICT.)' },
    concepto: HOJA,
    comandos: { 'Agrupación táctica|1': 'OD — Cte DIV MEC-2 (FICT.)' },
    coa: { 'Denominación del CAP': 'CAP 1 — Defensa de área (FICT.)' },
  }
  ej.ops.obstaculos = [{ id: 'ob1', tipo: 'campo_minas', nombre: 'CM-1 (FICT.)', centro: [-68.9, -18.45], coords: [[-68.92, -18.45], [-68.88, -18.45]] }]
  return ej
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1500, alto: 950, escalaPantalla: DPR })
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push(d.message())
    d.accept()
  })
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, `${n}${DPR > 1 ? '-dpr' + DPR : ''}.png`) })
  const F3 = /Desarrollar los cursos de acción propios/
  try {
    await sembrarYAbrir(page, ejercicio())
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: F3 }).first())

    // ── El recorrido en la lista ──
    const ruta = page.locator('[data-ruta="completa"]')
    await ruta.waitFor({ timeout: 10000 })
    assert.equal(await ruta.locator('[data-ruta-paso]').count(), 7)
    assert.match(await ruta.locator('[data-ruta-cap="2"]').innerText(), /🔒/)
    assert.match(await ruta.innerText(), /CAP 1 · .* — 5 de 7 pasos/)
    assert.match(await ruta.locator('[data-ruta-paso="fuegos"]').innerText(), /👉/)
    await ruta.scrollIntoViewIfNeeded()
    await foto('1-recorrido')

    // ── 🔥 El plan de fuegos con la artillería ──
    await clic(ruta.locator('[data-ruta-fuegos]'))
    const plan = await esperar(page, leerPlan, (p) => p.blancos.length > 0)
    assert.ok(plan.blancos.length >= 3, `concentraciones: ${plan?.blancos?.length}`)
    const medios = new Set(plan.blancos.map((b) => b.medio))
    assert.ok([...medios].every((m) => /ram4|galm1/.test(String(m))), `medios: ${[...medios]}`)
    assert.ok(plan.blancos.every((b) => /lo dispara (RAM-4|GALM-1)/.test(b.descripcion)), plan.blancos.map((b) => b.descripcion).join(' | '))
    await page.waitForTimeout(400)
    assert.match(await ruta.locator('[data-ruta-paso="fuegos"]').innerText(), /✅/)

    // ── 🎬 Las fases ──
    await clic(ruta.locator('[data-ruta-fases]'))
    await esperar(page, leerFases, (f) => f.propio >= 2)
    await page.waitForTimeout(400)
    await clic(page.getByRole('button', { name: F3 }).first()).catch(() => {})
    if (!(await page.locator('[data-ruta="completa"]').count())) await clic(page.getByRole('button', { name: F3 }).first())
    await ruta.waitFor({ timeout: 10000 })
    assert.match(await ruta.innerText(), /7 de 7 pasos/)
    await ruta.scrollIntoViewIfNeeded()
    await foto('2-cap1-completo')

    // ── ✓ Terminar el CAP 1 → ➕ Generar el CAP 2 ──
    await clic(ruta.locator('[data-ruta-terminar]'))
    await ruta.locator('[data-ruta-nuevo]').waitFor({ timeout: 5000 })
    assert.match(await ruta.locator('[data-ruta-cap="2"]').innerText(), /➕ generarlo/)
    await foto('3-cap1-terminado')
    await clic(ruta.locator('[data-ruta-nuevo]'))
    const compacta = page.locator('[data-ruta="compacta"]')
    await compacta.waitFor({ timeout: 10000 })
    assert.match(await compacta.innerText(), /Estás armando el CAP 2 · 0 de 7 pasos/)
    assert.ok(await page.getByText(/F3·P3/).count())
    const g3b = await esperar(page, leerG3, (g) => g._caps?.activo === 2)
    assert.equal(g3b._caps.activo, 2)
    for (const h of ['organizacion', 'concepto', 'comandos', 'coa']) assert.equal(g3b[h], undefined, h)
    assert.ok(g3b._caps.cerrados?.[1])
    assert.equal(g3b._caps.guardados[1].v, 2)
    assert.equal((await leerOps(page)).obstaculos.length, 0)
    assert.equal((await leerPlan(page))?.blancos?.length || 0, 0)
    assert.equal((await leerFases(page)).propio, 0)
    await foto('4-cap2-f3p3')

    // ── Volver al CAP 1: todo lo suyo ──
    await clic(page.getByRole('button', { name: /Volver a mis documentos/ }).first())
    if (!(await page.locator('[data-ruta="completa"]').count())) await clic(page.getByRole('button', { name: F3 }).first())
    await ruta.waitFor({ timeout: 10000 })
    assert.match(await ruta.innerText(), /CAP 2 · .* — 0 de 7 pasos/)
    await ruta.scrollIntoViewIfNeeded()
    await foto('5-cap2-recorrido')
    await clic(ruta.locator('[data-ruta-cap="1"]'))
    const g3c = await esperar(page, leerG3, (g) => g._caps?.activo === 1)
    assert.deepEqual(g3c.organizacion, { 'Agrupación|1': 'OD: DIV MEC-2 (FICT.)' })
    assert.equal((await esperar(page, leerOps, (o) => o.obstaculos.length === 1)).obstaculos.length, 1)
    assert.ok((await leerPlan(page)).blancos.length >= 3)
    assert.ok((await leerFases(page)).propio >= 2)
    await page.waitForTimeout(400)
    assert.match(await ruta.innerText(), /CAP 1 · .* — 7 de 7 pasos/)
    assert.match(await ruta.innerText(), /✓ El CAP 1 está terminado/)
    assert.match(await ruta.locator('[data-ruta-cap="2"]').innerText(), /guardado/)
    await foto('6-de-vuelta-cap1')
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log(`cap-ruta e2e OK (DPR ${DPR}) · diálogos: ${dialogos.length}`)
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  }
  if (errores.length) console.log('Errores de consola:', errores)
  await cerrar()
})()
