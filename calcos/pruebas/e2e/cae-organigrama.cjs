// 10-11-2026 · en la Mesa real (Chromium): mover objetivos, CAE-1/CAE-2 de la H.T. 17 y las unidades del CE-II a mano.
//   · H.T. 17: «1️⃣ Es el CAE-1» en ENVOLVIMIENTO y «2️⃣ Es el CAE-2» en ATAQUE FRONTAL → las dos formas en el calco
//     con su CAE, y las dos columnas de la evaluación llenas con su forma;
//   · H.T. 16: arrastrar el rótulo O1 lo mueve y las flechas de las dos formas se rehacen (siguen con su CAE);
//   · F2·P3: recuadro «🪖 Las unidades de CE-II» → «Agregar a mano» abre 🪖 Unidades con «Depende de: CE-II»;
//     📍 DIV-1 + clic en la carta la pone bajo el CE-II; ⚡ pone las 13 restantes; el CE-II queda PC;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/cae-organigrama.cjs   (DPR=2 para pantalla retina)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const aPantalla = (page, L) => page.evaluate((L) => { const m = window.__mapa2d, r = m.getContainer().getBoundingClientRect(); return L.map(([lng, lat]) => { const p = m.latLngToContainerPoint([lat, lng]); return [r.left + p.x, r.top + p.y] }) }, L)
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-cae-organigrama')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerOps = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.objetivos) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify({ objetivos: v.objetivos, maniobra: v.maniobra || [] })) : undefined))
const leerUnidades = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.some((u) => u && u.id === 'p-ce2' && 'lat' in u) ? JSON.parse(JSON.stringify(v)) : undefined))
const leerHT17 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v._ht17auto ? JSON.parse(JSON.stringify(v.ht17 || {})) : undefined))
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
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000, escalaPantalla: Number(process.env.DPR || 1) })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, `${n}.png`) })
  const datos = ejercicioPersonal({ nombre: 'PRUEBA CAE Y ORGANIGRAMA (FICT.)' })
  const av = (lat) => {
    const c = []
    for (let lng = -69.0; lng <= -67.6; lng += 0.05) c.push([+lng.toFixed(3), lat])
    return { coords: c, escalon: 'batallon', bando: 'enemigo' }
  }
  const clave = Array.from({ length: 15 }, (_, i) => ({ etiqueta: `C${i + 1}`, centro: [+(-68.56 + i * 0.038).toFixed(4), +(-16.85 - i * 0.035).toFixed(4)], razon: 'altura' }))
  datos.cmoc = { restringido: [], severo: [], clave, defensivo: [], ae: [], corredores: [], avenidas: [av(-16.95), av(-17.1), av(-17.25)], desplazamientos: [] }
  datos.picb = { _pd: { manual: 'rojo', nivel: 'brigada', dirEnemigo: 'O' } }
  datos.unidades.push({ id: 'p-ce2', tipo: 'unidad', bando: 'propias', designacion: 'CE-II', arma: 'infanteria', escalon: 'cuerpo', lat: -17.05, lng: -68.3, futura: false, agrupacion: false, instalacion: '' })
  datos.ordenSup = { ...datos.ordenSup, unidad: 'CE - II' }
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
    await clic(page.getByText('← Volver a la PICB').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('Desarrollar los cursos de acción del enemigo').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('H.T. 16', { exact: true }).first())
    await clic(page.getByRole('button', { name: /Acostar los OBJETIVOS sobre el calco/ }).first())
    await esperar(page, leerOps, (o) => o.objetivos.length > 0)

    // ── H.T. 17: CAE-1 = ENVOLVIMIENTO, CAE-2 = ATAQUE FRONTAL ──
    await clic(page.getByText('← Volver a la PICB').first())
    await page.waitForTimeout(300)
    await clic(page.getByText('H.T. 17', { exact: true }).first())
    const fila = (nom) => page.locator('div', { has: page.getByText(nom, { exact: true }) }).filter({ has: page.locator('button[data-cae]') }).last()
    await fila('ENVOLVIMIENTO').waitFor({ timeout: 10000 })
    await clic(fila('ENVOLVIMIENTO').locator('button[data-cae="CAE-1"]'))
    await esperar(page, leerOps, (o) => o.maniobra.some((f) => f.cae === 'CAE-1'))
    await page.waitForTimeout(400)
    await clic(fila('ATAQUE FRONTAL').locator('button[data-cae="CAE-2"]'))
    const conCae = await esperar(page, leerOps, (o) => o.maniobra.some((f) => f.cae === 'CAE-2') && o.maniobra.some((f) => f.cae === 'CAE-1'))
    const formas = [...new Set(conCae.maniobra.map((f) => `${f.forma}:${f.cae}`))].sort()
    assert.deepEqual(formas, ['envolvimiento:CAE-1', 'frontal:CAE-2'], `formas en el calco: ${formas}`)
    const ht17 = await esperar(page, leerHT17, (h) => Object.values(h).some((t) => /ATAQUE FRONTAL/.test(t)))
    const conv = 'CONVENIENCIA (si lo ejecuta, ¿cumple sus objetivos?)'
    assert.match(ht17[conv] || '', /^«ENVOLVIMIENTO» — .*O1/, 'CAE-1 conveniencia')
    assert.match(ht17[`${conv}|CAE-2`] || '', /^«ATAQUE FRONTAL» — /, 'CAE-2 conveniencia')
    assert.match(ht17['CONSISTENCIA CON LA DOCTRINA (¿está de acuerdo con su doctrina?)|CAE-2'] || '', /MENOS preferida/)
    await page.getByText('✓ CAE-1 — quitar').first().waitFor({ timeout: 5000 })
    await page.getByText('✓ CAE-2 — quitar').first().waitFor({ timeout: 5000 })
    await page.locator('button[data-cae]', { hasText: '✓ CAE-1' }).first().scrollIntoViewIfNeeded()
    await foto('1-ht17-cae1-cae2')
    const area = page.locator('textarea').filter({ hasText: /«ENVOLVIMIENTO»/ })
    assert.ok((await area.count()) >= 1 || (await page.evaluate(() => [...document.querySelectorAll('textarea')].some((t) => t.value.startsWith('«ENVOLVIMIENTO»')))), 'la columna CAE-1 se ve llena')

    // ── Arrastrar O1 ──
    const antes = await leerOps(page)
    const o1 = antes.objetivos.find((o) => o.clase === 'final')
    await page.evaluate(([lng, lat]) => window.__mapa2d.setView([lat, lng], 11, { animate: false }), o1.centro)
    await page.waitForTimeout(1200)
    const [[x, y]] = await aPantalla(page, [o1.centro])
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 60, y + 30, { steps: 6 })
    await page.mouse.move(x - 150, y + 80, { steps: 10 })
    await page.mouse.up()
    const desp = await esperar(page, leerOps, (o) => JSON.stringify(o.objetivos.find((x) => x.clase === 'final').centro) !== JSON.stringify(o1.centro), 8000)
    const n1 = desp.objetivos.find((o) => o.clase === 'final')
    assert.notDeepEqual(n1.centro, o1.centro, 'O1 se movió')
    assert.equal(n1.movido, true)
    assert.ok(n1.centro[0] < o1.centro[0] && n1.centro[1] < o1.centro[1], 'hacia el oeste y el sur, como se arrastró')
    const envAntes = JSON.stringify(antes.maniobra.filter((f) => f.cae === 'CAE-1').map((f) => f.coords))
    const envDesp = JSON.stringify(desp.maniobra.filter((f) => f.cae === 'CAE-1').map((f) => f.coords))
    assert.notEqual(envDesp, envAntes, 'las flechas del CAE-1 (envolvimiento, van a O1) se rehicieron')
    assert.deepEqual([...new Set(desp.maniobra.map((f) => `${f.forma}:${f.cae}`))].sort(), formas, 'siguen las dos formas con su CAE')
    await page.getByText(/O1 movido/).first().waitFor({ timeout: 5000 })
    await foto('2-o1-arrastrado')

    // ── G-3 · F2·P3 ──
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Analizar la misión|Análisis de la misión/ }).first())
    await clic(page.getByRole('button', { name: /F2·P3.*Tareas específicas/ }).first())
    const caja = page.locator('[data-sid="dependientes"]')
    await caja.waitFor({ timeout: 10000 })
    assert.match(await caja.innerText(), /Las unidades de CE-II[\s\S]*UNA sola ficha/)
    await caja.screenshot({ path: path.join(SALIDAS, '3-f2p3-recuadro.png') })
    await clic(caja.getByRole('button', { name: /Agregar a mano las unidades de CE-II/ }))
    const org = page.locator('[data-sid="organizacion"]')
    await org.waitFor({ timeout: 10000 })
    assert.match(await org.innerText(), /depende de: CE-II[\s\S]*Organigrama tipo del Cuerpo de Ejército/)
    // 📍 DIV-1 y un clic en la carta.
    const filaDiv1 = org.locator('div', { has: page.locator('input[value="DIV-1"]') }).last()
    await clic(filaDiv1.getByRole('button', { name: '📍' }))
    await page.getByText('📍 Colocando… (clic en el mapa)').waitFor({ timeout: 5000 })
    await page.evaluate(() => window.__mapa2d.setView([-17.0, -68.35], 11, { animate: false }))
    await page.waitForTimeout(800)
    const [[cx, cy]] = await aPantalla(page, [[-68.4, -17.08]])
    await page.mouse.click(cx, cy)
    const us1 = await esperar(page, leerUnidades, (u) => u.some((x) => x.designacion === 'DIV-1'))
    const div1 = us1.find((u) => u.designacion === 'DIV-1')
    assert.equal(div1.dependeDe, 'p-ce2', 'DIV-1 depende del CE-II')
    assert.equal(div1.escalon, 'division')
    await page.locator('button', { hasText: /Colocando…/ }).first().dispatchEvent('click').catch(() => {})
    await page.waitForTimeout(300)
    // ⚡ las demás.
    const rayo = org.getByRole('button', { name: /⚡ Poner las 13 tildadas alrededor de CE-II/ })
    await rayo.waitFor({ timeout: 5000 })
    await org.screenshot({ path: path.join(SALIDAS, '4-unidades-organizacion.png') })
    await clic(rayo)
    const us2 = await esperar(page, leerUnidades, (u) => u.filter((x) => x.dependeDe === 'p-ce2').length === 14)
    assert.equal(us2.filter((x) => x.dependeDe === 'p-ce2').length, 14, 'las 14 del organigrama bajo el CE-II')
    assert.equal(us2.find((u) => u.id === 'p-ce2').tipo, 'pc', 'el CE-II queda como su PC')
    assert.equal(us2.filter((u) => u.designacion === 'DIV-1').length, 1, 'DIV-1 no se duplicó')
    await page.getByText(/13 unidad\(es\) puestas alrededor de CE-II/).first().waitFor({ timeout: 5000 })
    await page.evaluate(() => window.__mapa2d.setView([-17.05, -68.3], 10, { animate: false }))
    await page.waitForTimeout(1500)
    await foto('5-organigrama-en-la-carta')
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: H.T. 17 con CAE-1/CAE-2 y su evaluación llena; O1 arrastrado rehace las flechas; F2·P3 → Agregar a mano → 14 unidades bajo el CE-II.')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error('errores de consola:', errores)
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
