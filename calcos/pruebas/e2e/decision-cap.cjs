// 🎖️ La decisión del Comandante en la F4·P6-7 Matriz de sincronización (index-decision-cap-20261108.js), en la Mesa
// real (Chromium). Sergio, 08-11-2026: «después de sometido a juego de guerra el comandante se decidió por el CAP 1 o
// CAP 2, para que en base a eso ya se desarrolle el resto del planeamiento y recién se rellene» la matriz; «resaltar
// esta hoja»; «reducir el texto… que no haya tanto texto pequeño». Con un CE-I (FICT.) con CAP 1 (3 fases, a la vista)
// y CAP 2 (2 fases, guardado):
//   · la F4·P6-7 resaltada en la lista (🎖️ DECISIÓN → 🎖️ CAP 2); la guía plegada, sin la nota larga, el G-2 plegado;
//   · sin decisión no hay 🌱, ni IA, ni rejilla (lo escrito se conserva); las hojas que siguen avisan que falta;
//   · ② CAP 2: la Mesa pasa al CAP 2 (sus fases, su F3·P6), la matriz del CAP 1 queda guardada y la del 2 arranca con
//     sus 2 columnas; 📝 anota el evento de una fase del CAP 2; la F4·P7 dice «🎖️ CAP 2 … decidido»;
//   · el F3·P6 marca 🎖️ el CAP 2; si se pasa al CAP 1, la matriz se cierra y «Volver al CAP 2» la abre;
//   · ↺ y CAP 1: vuelve la matriz del CAP 1; sin errores de consola.
//   node calcos/pruebas/e2e/decision-cap.cjs        (DPR=2 para la pantalla Retina de Sergio)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')

const DPR = Number(process.env.DPR || 1)
const SALIDAS = path.join(__dirname, '..', 'salidas-decision-cap')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
// (la prueba corre DENTRO de la página: sin funciones de afuera)
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.sincro && typeof v.sincro === 'object' ? JSON.parse(JSON.stringify(v)) : undefined))
const leerFases = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.propio) && Array.isArray(v.enemigo) ? JSON.parse(JSON.stringify({ propio: v.propio.map((f) => ({ nombre: f.nombre })), enemigo: [] })) : undefined))
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
  const ej = ejercicioConcepto({ nombre: 'PRUEBA DECISION CAP CE-I (FICT.)', conTexto: false })
  const propias = ej.unidades.filter((u) => u.bando === 'propias')
  const enemigas = ej.unidades.filter((u) => u.bando === 'enemigas')
  const mover = (us, dx) => us.map((u) => ({ ...u, lng: u.lng + dx }))
  ej.fasesCOA.propio = [
    { nombre: 'Concentración', tarea: 'Concentrar el CE-I', unidades: mover(propias, 0.25), ops: {} },
    { nombre: 'Desplazamiento', unidades: mover(propias, 0), ops: {} },
    { nombre: 'Ocupación de la posición', tarea: 'Ocupar las posiciones', unidades: mover(propias, -0.2), ops: {} },
  ]
  const fasesR = (coa, avances) => avances.map((dx, i) => ({ coa, n: i + 1, nombre: ['Ramificación', 'Apresto lejano', 'Ataque propiamente tal', 'Explotación'][i], tarea: i === 2 ? 'ATACAR y ROMPER la primera posición defensiva' : '', unidades: [...propias, ...mover(enemigas, dx)] }))
  ej.fasesCOA.enemigo = [...fasesR('probable', [-0.3, 0, 0.35, 0.5]), ...fasesR('peligroso', [-0.2, 0.4])]
  const fasesCAP2 = [
    { nombre: 'Retardo', tarea: 'Retardar desde la LDE-1 (FICT.)', unidades: mover(propias, -0.1), ops: {} },
    { nombre: 'Contraataque de la masa', tarea: 'Destruir al enemigo entre la LDE-1 y la LPR (FICT.)', unidades: mover(propias, -0.25), ops: {} },
  ]
  ej.g3 = {
    sincro: { 'MANIOBRA|FASE I': 'Lo escribió el oficial (CAP 1)' },
    coa: { 'Denominación del CAP': 'CAP 1 — Defensa de área (FICT.)' },
    _caps: { activo: 1, formas: { 1: 'area', 2: 'movil' }, guardados: { 2: { fases: fasesCAP2, coa: { 'Denominación del CAP': 'CAP 2 — Defensa móvil (FICT.)' } } } },
  }
  ej.picb = { cae: { Misión: 'La 1ª BR. AC. «CORACEROS» (FICT.) ataca para romper la LPR del CE-I (FICT.).', 'Estado final deseado': 'La LPR del CE-I destruida (FICT.).' } }
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
  const panelG3 = () => page.locator('div').filter({ has: page.getByRole('button', { name: /Volver a mis documentos/ }) }).last()
  const volver = () => clic(page.getByRole('button', { name: /Volver a mis documentos/ }).first())
  const abrirHoja = async (fase, hoja) => {
    if (!(await page.getByRole('button', { name: hoja }).count())) await clic(page.getByRole('button', { name: fase }).first())
    await clic(page.getByRole('button', { name: hoja }).first())
    await page.getByRole('button', { name: /Volver a mis documentos/ }).first().waitFor({ timeout: 10000 })
    await page.waitForTimeout(300)
  }
  const F4 = /Analizar los cursos de acción/
  const SINCRO = /F4·P6-7.*Matriz de sincronización/
  try {
    await sembrarYAbrir(page, ejercicio())
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: F4 }).first())

    // ── La lista: la F4·P6-7 resaltada ──
    const fila = page.getByRole('button', { name: SINCRO }).first()
    assert.match(await fila.innerText(), /🎖️ DECISIÓN/)
    assert.match(await fila.getAttribute('style'), /255, 212, 121|#ffd479/i)
    await fila.scrollIntoViewIfNeeded()
    await foto('1-lista')

    // ── Una hoja que sigue (F4·P7 Plantilla sustentadora): falta la decisión ──
    await abrirHoja(F4, /F4·P7.*Plantilla sustentadora/)
    assert.equal((await page.locator('[data-dec-aviso]').innerText()).trim(), '⚠️ Falta la decisión del Comandante: CAP 1 o CAP 2 (F4·P6-7).')
    await volver()
    // y una de antes (F4·P4), nada.
    await abrirHoja(F4, /F4·P4.*Eventos críticos/)
    assert.equal(await page.locator('[data-dec-aviso]').count(), 0)
    await volver()

    // ── La F4·P6-7 sin decisión ──
    await abrirHoja(F4, SINCRO)
    const panel = page.locator('[data-evento-critico]')
    await panel.waitFor({ timeout: 10000 })
    assert.equal(await page.getByText('Es el registro del juego de guerra').count(), 0, 'la guía empieza plegada')
    assert.ok(await page.getByRole('button', { name: /¿Para qué es y cómo se llena\?/ }).count(), 'pero está')
    assert.equal(await page.getByText(/Lo que va en cada casilla/).count(), 0, 'sin la nota larga')
    assert.ok(await page.getByText('Juego de guerra → decisión del Comandante → Matriz de Ejecución').count(), 'la entrega corta')
    assert.ok(await page.locator('details summary', { hasText: '🔎 Lo que entregó el G-2' }).count(), 'el G-2 plegado')
    assert.equal(await page.getByText(/Misión estimada del enemigo/).first().isVisible(), false)
    assert.equal(await page.getByRole('button', { name: '🌱 Traer del calco lo que falte' }).count(), 0, 'sin 🌱')
    assert.equal(await page.getByText('🤖 Trabajar esta hoja con IA').count(), 0, 'sin IA')
    assert.equal(await page.getByText('Columnas', { exact: true }).count(), 0, 'sin rejilla')
    assert.match(await panel.locator('[data-matriz="cerrada"]').innerText(), /La matriz se llena después de la decisión\. Ya tiene 1 casilla\(s\): se guardan\./)
    assert.match(await panel.locator('[data-dec="1"]').innerText(), /CAP 1\s+Defensa de área \(FICT\.\) · 3 fases/)
    assert.match(await panel.locator('[data-dec="2"]').innerText(), /CAP 2\s+Defensa móvil \(FICT\.\) · 2 fases/)
    assert.equal(await panel.locator('[data-ev-fila]').count(), 3, '① abierto con las 3 fases del CAP 1')
    await panel.scrollIntoViewIfNeeded()
    await foto('2-sin-decision')

    // ── ② El Comandante decide el CAP 2 ──
    await clic(panel.locator('[data-dec="2"]'))
    await panel.locator('[data-dec-estado]').waitFor({ timeout: 5000 })
    assert.equal((await panel.locator('[data-dec-estado]').innerText()).trim(), '✅ CAP 2 · Defensa móvil (FICT.)')
    let g3 = await esperar(page, leerG3, (v) => v._caps?.decision?.cap === 2 && v._caps.activo === 2)
    assert.equal(g3._caps.activo, 2, 'la Mesa pasó al CAP 2')
    assert.equal(g3.coa['Denominación del CAP'], 'CAP 2 — Defensa móvil (FICT.)', 'su F3·P6')
    assert.equal(g3._caps.guardados[1].coa['Denominación del CAP'], 'CAP 1 — Defensa de área (FICT.)')
    assert.equal(g3.sincro._matrices[1]['MANIOBRA|FASE I'], 'Lo escribió el oficial (CAP 1)', 'la matriz del CAP 1, guardada')
    assert.deepEqual(g3.sincro._cols, ['FASE 1', 'FASE 2'], 'la del CAP 2 con sus 2 fases')
    assert.equal(g3.sincro['MANIOBRA|FASE I'], undefined)
    const fc = await esperar(page, leerFases, (v) => v.propio.length === 2)
    assert.deepEqual(fc.propio.map((f) => f.nombre), ['Retardo', 'Contraataque de la masa'], 'sus fases 🔵')
    assert.match(await panel.locator('[data-ev-msg]').innerText(), /CAP 2 decidido\. La Mesa pasó al CAP 2\. La matriz que tenía \(CAP 1\) quedó guardada\./)
    await page.getByRole('button', { name: '🌱 Traer del calco lo que falte' }).waitFor({ timeout: 5000 })
    assert.ok(await page.getByText('🤖 Trabajar esta hoja con IA').count(), 'la IA')
    assert.ok(await page.getByText('Columnas', { exact: true }).count(), 'la rejilla')
    assert.match(await panel.locator('[data-matriz="abierta"]').innerText(), /MATRIZ DEL CAP 2/)
    assert.equal(await panel.locator('[data-ev-fila]').count(), 0, '① plegado')
    await panel.scrollIntoViewIfNeeded()
    await foto('3-decidido')

    // 📝 el evento de la FASE I del CAP 2 (① se abre; ya muestra el CAP 2).
    await clic(panel.locator('[data-ev-plegar]'))
    assert.equal(await panel.locator('[data-ev-fila]').count(), 2, 'las 2 fases del CAP 2')
    await clic(panel.locator('[data-ev-fila]').first())
    await clic(panel.locator('[data-ev="anotar"]'))
    g3 = await esperar(page, leerG3, (v) => !!v.sincro['MANIOBRA|FASE 1'])
    assert.match(g3.sincro['MANIOBRA|FASE 1'], /^EVENTO CRÍTICO: CAP 2 · FASE I — Retardo contra CAE más probable/)
    await volver()

    // ── La lista y la hoja que sigue: el CAP 2 ──
    assert.match(await page.getByRole('button', { name: SINCRO }).first().innerText(), /🎖️ CAP 2/)
    await abrirHoja(F4, /F4·P7.*Plantilla sustentadora/)
    assert.equal((await page.locator('[data-dec-aviso]').innerText()).trim(), '🎖️ CAP 2 · Defensa móvil (FICT.) — decidido por el Comandante.')
    await foto('4-hoja-que-sigue')
    await volver()

    // ── El F3·P6 marca el decidido; si se pasa al CAP 1, la F4·P6-7 se cierra ──
    await abrirHoja(/Desarrollar los cursos de acción/, /F3·P6.*Curso de acción propio/)
    const cp = page.locator('[data-cap-panel="coa"]')
    await cp.waitFor({ timeout: 10000 })
    assert.match(await cp.locator('[data-cap="2"]').first().innerText(), /🎖️/)
    assert.match(await cp.locator('[data-cap="2"]').first().innerText(), /decidido por el Comandante/)
    assert.doesNotMatch(await cp.locator('[data-cap="1"]').first().innerText(), /🎖️/)
    await clic(cp.locator('[data-cap="1"]').first())
    g3 = await esperar(page, leerG3, (v) => v._caps?.activo === 1)
    assert.equal(g3._caps.activo, 1)
    assert.equal(g3._caps.decision.cap, 2, 'la decisión sigue')
    await volver()
    await abrirHoja(F4, SINCRO)
    await panel.locator('[data-dec-volver]').waitFor({ timeout: 5000 })
    assert.match(await panel.locator('[data-matriz="cerrada"]').innerText(), /con el CAP 2 a la vista/)
    assert.equal(await page.getByText('Columnas', { exact: true }).count(), 0, 'cerrada con el CAP 1 a la vista')
    await panel.scrollIntoViewIfNeeded()
    await foto('5-otro-cap')
    await clic(panel.locator('[data-dec-volver]'))
    g3 = await esperar(page, leerG3, (v) => v._caps?.activo === 2)
    assert.equal(g3._caps.activo, 2)
    await page.getByText('Columnas', { exact: true }).waitFor({ timeout: 5000 })

    // ── ↺ y el Comandante decide el CAP 1: vuelve su matriz ──
    await clic(panel.locator('[data-dec-cambiar]'))
    await panel.locator('[data-dec="1"]').waitFor({ timeout: 5000 })
    assert.equal(await page.getByText('Columnas', { exact: true }).count(), 0)
    await clic(panel.locator('[data-dec="1"]'))
    g3 = await esperar(page, leerG3, (v) => v._caps?.decision?.cap === 1 && v._caps.activo === 1)
    assert.equal(g3.sincro['MANIOBRA|FASE I'], 'Lo escribió el oficial (CAP 1)', 'volvió la del CAP 1')
    assert.match(g3.sincro._matrices[2]['MANIOBRA|FASE 1'], /^EVENTO CRÍTICO: CAP 2/, 'la del CAP 2, guardada')
    assert.match(await panel.locator('[data-ev-msg]').innerText(), /Volvió la matriz del CAP 1\./)
    await page.getByText('Columnas', { exact: true }).waitFor({ timeout: 5000 })
    await panel.scrollIntoViewIfNeeded()
    await foto('6-cap1')

    assert.deepEqual(dialogos, [])
    assert.deepEqual(errores, [])
    console.log(`OK — decisión del Comandante en la Mesa (DPR ${DPR})`)
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
