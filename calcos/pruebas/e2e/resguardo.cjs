// 🛟 RESGUARDO (calcos/guardado/v1/resguardo.js) en la Mesa real (Chromium), como está publicada,
// con un SIDECEME de mentira que rechaza la sesión vencida como el de verdad (403 «Sesion no valida»):
// lo que pasó el 16-10-2026 con CE-VI.1, y que no vuelva a pasar.
//   · abierto el ejercicio: «💾 Copias» al lado del selector de modalidad y la primera copia en esta
//     computadora;
//   · la sesión vence con la Mesa abierta y se cambia el ejercicio: el guardado en la nube falla
//     (403), la franja roja dice que NO se puede guardar y que no se cierre la pestaña, y el cambio
//     igual queda en las copias de esta computadora;
//   · se entra a SIDECEME en OTRA pestaña: la Mesa toma la sesión nueva sola, sin recargar, vuelve
//     a guardar en la nube (con el cambio) y la franja lo dice;
//   · 📁 la carpeta (la carpeta privada del navegador hace de «Documentos/SIDECEME»): queda
//     <nombre>.json y respaldos/<nombre> AAAA-MM-DD.json, con el ejercicio entero;
//   · ⬇️ Bajar el ejercicio ahora: EJERCICIO_<nombre>_<fecha>_<hora>.json con lo que está en pantalla;
//   · se recarga y SIDECEME tiene la versión vieja: la franja avisa que en esta computadora hay una
//     más nueva y la deja bajar;
//   · en el teléfono el botón entra en la pantalla y no pisa el selector;
//   · sin errores de consola.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso.js')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-resguardo')
fs.mkdirSync(SALIDAS, { recursive: true })
const NOMBRE = 'CE-PRUEBA 1'
const futuro = () => new Date(Date.now() + 6 * 3600e3).toISOString()
const pasado = () => new Date(Date.now() - 60e3).toISOString()

async function hasta(page, f, ms = 15000, que = '') {
  const t0 = Date.now()
  for (;;) {
    const v = await f()
    if (v) return v
    if (Date.now() - t0 > ms) throw new Error('no llegó: ' + que)
    await page.waitForTimeout(200)
  }
}
const leerDescarga = async (d) => fs.readFileSync(await d.path(), 'utf8')

;(async () => {
  const original = ejercicioFicticio({ conPlantilla: false })
  original.nombre = NOMBRE
  const calcos = [{ id: 'id-0', nombre: NOMBRE, payload: JSON.parse(JSON.stringify(original)), actualizado_en: new Date(Date.now() - 3600e3).toISOString() }]
  const log = []
  const tokens = new Set(['tok'])
  const { page, errores, cerrar, url } = await abrir({
    ancho: 1600,
    alto: 1000,
    preparar: async (p) => {
      await servidorFalso(p, calcos, log, { tokens })
      await p.addInitScript((f) => { try { localStorage.setItem('sideceme_token_expira_p', f) } catch (e) {} }, futuro())
    },
  })
  page.on('dialog', (d) => d.accept())
  const sello = page.locator('.sello-guardado').first()
  const estado = () => sello.getAttribute('data-estado')
  const franja = page.locator('#sid-resg-aviso')
  const copias = () => page.evaluate((n) => window.SIDResguardo.copiasDe(n), NOMBRE)
  const guardadosCon = (tok) => log.filter((l) => l.accion === 'guardar' && l.token === tok)
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await abrirDelServidor(page, NOMBRE)
    await hasta(page, async () => (await estado()) === 'al-dia', 15000, 'el sello en «guardado»')
    const btn = page.locator('#sid-resg-btn')
    assert.equal(await btn.isVisible(), true, '💾 Copias a la vista')
    assert.match(await btn.innerText(), /guardar como/i)
    const rb = await btn.boundingBox(), rs = await page.locator('#sid-mod-sel').boundingBox()
    assert.ok(rb.x + rb.width <= rs.x + 1 && Math.abs(rb.y + rb.height / 2 - (rs.y + rs.height / 2)) < 4, 'a la izquierda del selector, a su altura')
    await page.evaluate(() => window.SIDResguardo.resguardar(true))
    assert.equal((await copias()).length, 1, 'la primera copia en esta computadora')
    assert.equal(await franja.isVisible(), false, 'con la sesión vigente no hay franja')

    // ── la sesión vence con la Mesa abierta y se cambia el ejercicio ──
    tokens.delete('tok')
    await page.evaluate((p) => localStorage.setItem('sideceme_token_expira_p', p), pasado())
    await page.evaluate(() => window.SIDModalidad.puente.agregarDocumentos([{ nombre: 'CAMBIO DE PRUEBA.md', mime: 'text/plain', tipo: 'texto', texto: 'Lo que se hizo con la sesión vencida', base64: null, paginas: 0, categoria: 'otro' }]))
    await hasta(page, async () => (await estado()) === 'error', 20000, 'el guardado falla')
    assert.ok(log.some((l) => l.accion === 'guardar' && l.token === 'tok' && JSON.stringify(l.payload).includes('CAMBIO DE PRUEBA')), 'la Mesa intentó guardar con la sesión vieja')
    await hasta(page, () => franja.isVisible(), 6000, 'la franja')
    assert.match(await franja.innerText(), /venció[\s\S]*NO puede guardar en la nube[\s\S]*No cierres ni recargues/)
    assert.equal(await franja.getAttribute('class'), 'mal')
    assert.match(await btn.innerText(), /⚠️/, 'el botón también avisa')
    await page.evaluate(() => window.SIDResguardo.resguardar(false))
    const cs = await copias()
    assert.equal(cs.length, 2, 'el cambio quedó en una copia de esta computadora')
    assert.match(await page.evaluate((c) => window.SIDResguardo.copiaTexto(c), cs[0].clave), /CAMBIO DE PRUEBA/)
    await foto('1-sesion-vencida')

    // ── se entra a SIDECEME en OTRA pestaña: la Mesa sigue sola, sin recargar ──
    tokens.add('tok2')
    const otra = await page.context().newPage()
    await otra.goto(url.replace(/calcos\/$/, 'escudo-eceme.png'))
    await otra.evaluate((f) => { localStorage.setItem('sideceme_token_expira_p', f); localStorage.setItem('sideceme_token_p', 'tok2') }, futuro())
    await hasta(page, () => page.evaluate(() => window.SIDECEME_CALCOS.token === 'tok2'), 8000, 'la Mesa toma la sesión nueva')
    await hasta(page, async () => guardadosCon('tok2').length > 0, 15000, 'vuelve a guardar con la sesión nueva')
    await hasta(page, async () => (await estado()) === 'al-dia', 15000, 'el sello vuelve a «guardado»')
    assert.match(JSON.stringify(calcos[0].payload), /CAMBIO DE PRUEBA/, 'el cambio llegó a la nube')
    assert.match(await franja.innerText(), /Sesión de SIDECEME renovada/)
    await foto('2-sesion-renovada')
    await otra.close()

    // ── 📁 la carpeta ──
    await page.evaluate(async () => window.SIDResguardo.usarCarpeta(await navigator.storage.getDirectory()))
    const enCarpeta = await page.evaluate(async (n) => {
      const d = await navigator.storage.getDirectory()
      const leer = async (dir, a) => (await (await dir.getFileHandle(a)).getFile()).text()
      const r = await d.getDirectoryHandle('respaldos')
      const dias = []
      for await (const k of r.keys()) dias.push(k)
      return { json: await leer(d, n + '.json'), dias }
    }, NOMBRE)
    const ej = JSON.parse(enCarpeta.json)
    assert.equal(ej.nombre, NOMBRE)
    assert.ok(ej.documentos.some((d) => d.nombre === 'CAMBIO DE PRUEBA.md'), 'el ejercicio entero, con el cambio')
    assert.equal(enCarpeta.dias.length, 1)
    assert.match(enCarpeta.dias[0], new RegExp('^' + NOMBRE + ' \\d{4}-\\d{2}-\\d{2}\\.json$'), 'un respaldo por día')
    await btn.dispatchEvent('click')
    const panel = page.locator('#sid-resg-panel')
    await hasta(page, () => panel.isVisible(), 3000, 'el panel')
    const tp = await panel.innerText()
    assert.match(tp, /SIDECEME \(la nube\)[\s\S]*✓ último guardado en la nube/)
    assert.match(tp, /Tu carpeta[\s\S]*CE-PRUEBA 1\.json/)
    assert.match(tp, /Esta computadora[\s\S]*copia\(s\)/)
    await foto('3-panel')

    // ── ⬇️ bajar ahora ──
    const [baj] = await Promise.all([page.waitForEvent('download'), page.locator('#sid-resg-panel [data-r=bajar]').dispatchEvent('click')])
    assert.match(baj.suggestedFilename(), /^EJERCICIO_CE-PRUEBA_1_\d{4}-\d{2}-\d{2}_\d{4}\.json$/)
    const bajado = JSON.parse(await leerDescarga(baj))
    assert.equal(bajado.nombre, NOMBRE)
    assert.ok(bajado.documentos.some((d) => d.nombre === 'CAMBIO DE PRUEBA.md'))

    // ── se recarga y la nube tiene la versión vieja: la de esta computadora es más nueva ──
    calcos[0].payload = JSON.parse(JSON.stringify(original))
    calcos[0].actualizado_en = new Date(Date.now() - 3600e3).toISOString()
    tokens.add('tok')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const ok = page.getByRole('button', { name: /entendido/i })
    if (await ok.count()) await ok.first().click().catch(() => {})
    await abrirDelServidor(page, NOMBRE)
    await hasta(page, async () => /más nueva/.test((await franja.isVisible()) ? await franja.innerText() : ''), 15000, 'el aviso de la versión más nueva')
    const [baj2] = await Promise.all([page.waitForEvent('download'), page.locator('#sid-resg-aviso [data-r=copia]').dispatchEvent('click')])
    assert.ok(JSON.parse(await leerDescarga(baj2)).documentos.some((d) => d.nombre === 'CAMBIO DE PRUEBA.md'), 'la versión más nueva tiene el cambio')
    await foto('4-version-mas-nueva')
    assert.ok((await copias()).length >= 2, 'abrir la versión vieja no pisó las copias')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('resguardo e2e escritorio OK')
  } finally {
    await cerrar()
  }

  // en el teléfono el botón entra en la pantalla y no pisa el selector
  const m = await abrir({ ancho: 390, alto: 844, movil: true })
  try {
    await m.page.waitForSelector('#sid-resg-btn', { timeout: 15000 })
    await m.page.waitForTimeout(900)
    const b = await m.page.locator('#sid-resg-btn').boundingBox(), s = await m.page.locator('#sid-mod-sel').boundingBox()
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= 390 && b.y + b.height <= 844, 'dentro de la pantalla')
    assert.ok(b.x + b.width <= s.x + 1 || b.y + b.height <= s.y || b.y >= s.y + s.height, 'no pisa el selector')
    await m.page.screenshot({ path: path.join(SALIDAS, '5-telefono.png') })
    assert.deepEqual(m.errores, [], 'sin errores de consola en el teléfono')
    console.log('resguardo e2e telefono OK')
  } finally {
    await m.cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
