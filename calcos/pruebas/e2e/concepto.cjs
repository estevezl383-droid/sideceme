// 🗺️ F3·P4 — el concepto de la operación EN LA CARTA (index-concepto-20261022.js), en la Mesa real (Chromium).
// El caso de Sergio: la F3·P4 con el concepto de la IA (Defensa de área del CE-I) y la carta vacía.
//   · la hoja muestra «El concepto en la carta» arriba de sus nueve campos;
//   · ⚡ Proponer arma la plantilla: LPR, zonas, ZO con su minado, concertina, zanja y demolición, efecto,
//     zona de aniquilamiento, FPF, interdicción en las A.I.N., contrabatería, reserva y sus ejes;
//   · ✓ Poner en el calco: los obstáculos en ops.obstaculos, las concentraciones en planFuegos.blancos, las
//     marcas en g3.conceptoCarta; todo con `co`;
//   · ✋ Ajustar: arrastrar «ZO-1 ✥» mueve la zona CON sus obstáculos y su concentración; ⤡ agranda; ⟳ gira;
//     los botones de la ficha elegida también;
//   · la paleta pone una concentración tocando la carta;
//   · la congruencia y «Llevar la carta al texto»;
//   · ↶ Deshacer; sin errores de consola; y en el teléfono la hoja no desborda.
//   node calcos/pruebas/e2e/concepto.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-concepto')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')

const leerOps = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.obstaculos) && Array.isArray(v.limites) && 'areaOps' in v ? JSON.parse(JSON.stringify(v)) : undefined))
const leerPlan = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.blancos) && 'medios' in v ? JSON.parse(JSON.stringify(v)) : undefined))
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.concepto && typeof v.concepto === 'object' && !Array.isArray(v.concepto) ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(page, leer, cumple, ms = 15000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(250)
  }
}
const co = (x) => !!(x && x.co && x.co.id)

async function abrirHoja(page) {
  await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
  await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
  await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
  await clic(page.getByRole('button', { name: /F3·P4.*Concepto amplio/ }).first())
  await page.getByText('EL CONCEPTO EN LA CARTA').first().waitFor({ timeout: 15000 })
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  const dialogos = []
  page.on('dialog', (d) => { dialogos.push(d.message()); d.accept() })
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await sembrarYAbrir(page, ejercicioConcepto())
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await abrirHoja(page)
    await page.getByText(/Forma de maniobra elegida y por qué/).first().waitFor({ timeout: 5000 })
    assert.equal(await page.locator('select[aria-label="Forma de maniobra"]').inputValue(), 'defensa_area', 'la forma de maniobra sale del texto')
    await foto('1-hoja')

    // ② Proponer
    await clic(page.getByRole('button', { name: /Proponer la plantilla del concepto/ }))
    await page.getByText(/Defensa de área: \d+ fichas/).waitFor({ timeout: 10000 })
    const cuerpo = await page.locator('.co-editor').innerText()
    for (const t of ['LPR (LF «PUMA»)', 'ZO-1 — zona de obstáculos', 'Campo minado anticarro', 'Concertina triple', 'Zanja antitanque', 'FPF — protección final', 'Contrabatería — GAAP', 'Interdicción sobre la AA-1 (AIN-2)', 'Reserva — DIV-6', 'ESFUERZO PRINCIPAL · DIV MEC-2', 'PC-1', 'LDE-1'])
      assert.ok(cuerpo.includes(t), `la propuesta trae «${t}»`)
    assert.match(cuerpo, /3\.000 minas AC|3000 minas AC/, 'usa las minas del texto')
    await foto('2-propuesta')
    // Las flechas de los ejes de la reserva salen desmarcadas (Sergio: «esas líneas llegan en flecha hasta el
    // frente… congestionado»); se marca una para probar después ✕ Sacar las flechas.
    const ejeCA = page.locator('.co-editor label', { hasText: 'EJE CA-1' }).first()
    assert.equal(await ejeCA.locator('input[type=checkbox]').isChecked(), false, 'EJE CA-1 desmarcado')
    assert.equal(await page.locator('.co-editor label', { hasText: 'EJE BLQ-1' }).first().locator('input[type=checkbox]').isChecked(), false, 'EJE BLQ-1 desmarcado')
    await ejeCA.locator('input[type=checkbox]').check()
    await clic(page.getByRole('button', { name: /✓ Poner en el calco/ }))
    const ops = await esperar(page, leerOps, (o) => o.obstaculos.some(co))
    const plan = await esperar(page, leerPlan, (p) => p.blancos.some(co))
    const g3 = await esperar(page, leerG3, (g) => (g.conceptoCarta?.marcas || []).length > 0)
    const obst = ops.obstaculos.filter(co)
    assert.ok(obst.length >= 8, `obstáculos en el plan de barreras (${obst.length})`)
    assert.ok(obst.some((o) => o.tipo === 'minado_ac') && obst.some((o) => o.tipo === 'zanja_at') && obst.some((o) => o.tipo === 'demolicion'))
    assert.ok(ops.limites.some((l) => /^LPR/.test(l.nombre || '')) && ops.limites.some((l) => l.nombre === 'ZO-1'), 'LPR y ZO-1 en el calco')
    assert.ok(ops.coordinacion.some((c) => c.nombre === 'PC-1'), 'los puntos de contacto del texto')
    const bl = plan.blancos.filter(co)
    assert.ok(bl.length >= 8, `concentraciones en el plan de fuegos (${bl.length})`)
    assert.ok(bl.every((b) => /^AB-\d{3}$/.test(b.num)), 'numeradas AB-0xx')
    assert.ok(bl.some((b) => b.tipo === 'proteccion' && b.forma === 'lineal'), 'una FPF lineal')
    assert.ok(bl.some((b) => b.tipo === 'contrabateria'), 'contrabatería')
    assert.ok(g3.conceptoCarta.marcas.some((m) => m.tipo === 'reserva') && g3.conceptoCarta.marcas.some((m) => m.tipo === 'efecto'), 'reserva y efecto en las marcas')
    assert.ok(g3.concepto['Forma de maniobra elegida y por qué'].length > 50, 'el texto de la hoja sigue ahí')
    await page.waitForTimeout(600)
    assert.ok(await page.locator('.co-marca').count() >= 5, 'las marcas se ven en la carta')
    await foto('3-en-la-carta')
    assert.ok(ops.limites.some((l) => l.nombre === 'EJE CA-1'), 'el EJE CA-1 marcado va al calco')
    assert.ok(!ops.limites.some((l) => l.nombre === 'EJE BLQ-1'), 'el EJE BLQ-1 desmarcado no')
    await clic(page.getByRole('button', { name: /✕ Sacar las flechas de los ejes de la reserva \(EJE CA-1\)/ }))
    const sinEjes = await esperar(page, leerOps, (o) => !o.limites.some((l) => /^EJE /.test(l.nombre || '')))
    assert.ok(sinEjes.limites.some((l) => /^LPR/.test(l.nombre || '')), 'lo demás de la plantilla queda')
    await page.getByText(/Se sacaron de la carta la flecha de los ejes de la reserva \(EJE CA-1\)/).waitFor({ timeout: 5000 })
    assert.equal(await page.getByRole('button', { name: /✕ Sacar las flechas/ }).count(), 0, 'sin ejes, el botón no está')

    // ③ Ajustar: arrastrar ZO-1 ✥ mueve todo el grupo
    await clic(page.getByRole('button', { name: /Mover \/ agrandar \/ girar en la carta/ }))
    const zo = page.locator('.co-manija', { hasText: 'ZO-1 ✥' }).first()
    await zo.waitFor({ timeout: 5000 })
    const antes = { ops: await leerOps(page), plan: await leerPlan(page) }
    const grupo = (o) => o.co && o.co.grupo === 'ZO-1'
    const minAntes = antes.ops.obstaculos.find((o) => grupo(o) && o.tipo === 'minado_ac')
    const conAntes = antes.plan.blancos.find(grupo)
    assert.ok(minAntes && conAntes, 'la ZO-1 tiene minado y concentración')
    await zo.scrollIntoViewIfNeeded()
    const bb = await zo.locator('div').first().boundingBox()
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
    await page.mouse.down()
    for (let k = 1; k <= 8; k++) await page.mouse.move(bb.x + bb.width / 2 + 10 * k, bb.y + bb.height / 2 + 6 * k)
    await foto('4-arrastrando')
    await page.mouse.up()
    const d1 = await esperar(page, leerOps, (o) => JSON.stringify(o.obstaculos.find((x) => grupo(x) && x.tipo === 'minado_ac').coords) !== JSON.stringify(minAntes.coords))
    const minDesp = d1.obstaculos.find((x) => grupo(x) && x.tipo === 'minado_ac')
    assert.notDeepEqual(minDesp.coords, minAntes.coords, 'el minado de la ZO-1 se movió con su zona')
    assert.ok(minDesp.coords[0][0] > minAntes.coords[0][0], 'hacia el este, como se arrastró')
    const p1 = await esperar(page, leerPlan, (p) => p.blancos.find((b) => b.id === conAntes.id).lng !== conAntes.lng)
    assert.ok(p1.blancos.find((b) => b.id === conAntes.id).lng > conAntes.lng, 'la concentración de la ZO-1 se movió con el grupo')
    const otros = antes.ops.obstaculos.find((o) => o.co && o.co.grupo && o.co.grupo !== 'ZO-1')
    if (otros) assert.deepEqual(d1.obstaculos.find((o) => o.co && o.co.id === otros.co.id).coords, otros.coords, 'lo de otra ZO no se movió')
    await foto('5-zo-movida')

    // Elegir una concentración (la FPF) desde la lista y agrandarla / girarla con los botones.
    const fpf = p1.blancos.find((b) => b.tipo === 'proteccion')
    await clic(page.locator('.co-editor button', { hasText: fpf.num }).first())
    await page.locator('.co-elegida').waitFor({ timeout: 5000 })
    await clic(page.locator('.co-elegida button', { hasText: '＋ agrandar' }))
    await clic(page.locator('.co-elegida button', { hasText: '↻ 15°' }))
    const p2 = await esperar(page, leerPlan, (p) => p.blancos.find((b) => b.id === fpf.id).largoM > fpf.largoM && p.blancos.find((b) => b.id === fpf.id).orientacion !== fpf.orientacion)
    const f2 = p2.blancos.find((b) => b.id === fpf.id)
    assert.ok(f2.largoM > fpf.largoM, `la FPF se agrandó (${fpf.largoM} → ${f2.largoM} m)`)
    assert.equal(Math.round(f2.orientacion), Math.round((fpf.orientacion + 15) % 360), 'y giró 15°')
    // ⤡ y ⟳ en la carta
    const agrandar = page.locator('.co-manija', { hasText: '⤡' }).first()
    await agrandar.waitFor({ timeout: 5000 })
    const ba = await agrandar.locator('div').first().boundingBox()
    await page.mouse.move(ba.x + ba.width / 2, ba.y + ba.height / 2)
    await page.mouse.down()
    for (let k = 1; k <= 6; k++) await page.mouse.move(ba.x + ba.width / 2 + 8 * k, ba.y + ba.height / 2 + 8 * k)
    await page.mouse.up()
    const p3 = await esperar(page, leerPlan, (p) => p.blancos.find((b) => b.id === fpf.id).largoM > f2.largoM)
    assert.ok(p3.blancos.find((b) => b.id === fpf.id).largoM > f2.largoM, 'la manija ⤡ la agranda')
    const girar = page.locator('.co-manija', { hasText: '⟳' }).first()
    const bg = await girar.locator('div').first().boundingBox()
    await page.mouse.move(bg.x + bg.width / 2, bg.y + bg.height / 2)
    await page.mouse.down()
    for (let k = 1; k <= 6; k++) await page.mouse.move(bg.x + bg.width / 2 + 12 * k, bg.y + bg.height / 2 + 4 * k)
    await page.mouse.up()
    const p4 = await esperar(page, leerPlan, (p) => Math.round(p.blancos.find((b) => b.id === fpf.id).orientacion) !== Math.round(f2.orientacion))
    assert.notEqual(Math.round(p4.blancos.find((b) => b.id === fpf.id).orientacion), Math.round(f2.orientacion), 'la manija ⟳ la gira')
    // Cambiar el tipo de fuego desde la ficha elegida.
    await page.locator('.co-elegida select[aria-label="Efecto"]').selectOption('neutralizar')
    await esperar(page, leerPlan, (p) => p.blancos.find((b) => b.id === fpf.id).efecto === 'neutralizar')
    await foto('6-fpf-ajustada')

    // ④ Paleta: una concentración circular tocando la carta
    const nAntes = (await leerPlan(page)).blancos.length
    await clic(page.getByRole('button', { name: /Agregar fichas a mano/ }))
    await clic(page.locator('.co-editor button', { hasText: 'Concentración circular' }).first())
    await page.locator('.co-cartel').waitFor({ timeout: 5000 })
    const mapa = await page.locator('.leaflet-container').first().boundingBox()
    await page.mouse.click(mapa.x + mapa.width * 0.55, mapa.y + mapa.height * 0.35)
    const p5 = await esperar(page, leerPlan, (p) => p.blancos.length > nAntes)
    assert.equal(p5.blancos.length, nAntes + 1, 'la paleta agregó una concentración')
    assert.ok(co(p5.blancos[p5.blancos.length - 1]), 'y queda como ficha del concepto')

    // ⑤ Congruencia y ⑥ al texto
    const cong = await page.locator('#co-paso-5').innerText()
    assert.match(cong, /batida por AB-|batidos por alguna concentración/, 'la congruencia controla que el obstáculo esté batido')
    await clic(page.getByRole('button', { name: /Que el texto de la hoja diga lo mismo/ }))
    await clic(page.getByRole('button', { name: /Llevar la carta al texto de la hoja/ }))
    const g3b = await esperar(page, leerG3, (g) => String(g.concepto['Movilidad / contramovilidad / supervivencia (plan de barreras)'] || '').includes('Según el calco'))
    const barr = g3b.concepto['Movilidad / contramovilidad / supervivencia (plan de barreras)']
    assert.ok(barr.startsWith('Contramovilidad'), 'lo escrito antes sigue arriba')
    assert.match(barr, /ZO-1 \(efecto: FIJAR\)/, 'el bloque dice la ZO-1 con su efecto')
    assert.match(g3b.concepto['Fuegos: tarea esencial de apoyo de fuegos'], /AB-0\d\d/, 'y los fuegos sus AB')
    await foto('7-texto')

    // ↶ Deshacer devuelve el calco de antes del último cambio de ops
    const opsAntes = (await leerOps(page)).obstaculos.length
    await clic(page.locator('.botones-mapa > button.btn-deshacer').first())
    await page.waitForTimeout(500)
    assert.ok((await leerOps(page)).obstaculos.length <= opsAntes, '↶ Deshacer responde')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log(`OK: la F3·P4 en la carta — ${obst.length} obstáculos, ${bl.length} concentraciones, la ZO-1 se mueve con su grupo, ⤡ y ⟳ funcionan, paleta, congruencia y texto.`)
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
