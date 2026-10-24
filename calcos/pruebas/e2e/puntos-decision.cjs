// ⭐ Los puntos de decisión de la F4·P4 en la carta (index-puntos-decision-20261024.js), en la Mesa real (Chromium).
// El caso de Sergio: la F4·P4 escrita por la IA (seis P.D. sobre la AIN-1, 2, 3 y 5) y la carta sin nada de eso.
//   · cada P.D. es una ⭐ con su número al lado de su A.I.N. (los de la AIN-3, uno al lado del otro);
//   · tocarla abre lo escrito (ventana, evento, criterio, decisión), sin la marca «[IA — verificar]» en el texto;
//   · arrastrarla la deja ahí (g3.pdCarta.pos) y «↺ Volver junto a su A.I.N.» la devuelve;
//   · «Ver A.I.N.» las esconde con las A.I.N.;
//   · 🌱 en la F4·P4 siembra la A.I.N. que no tiene P.D.; sin ninguna, el aviso dice de dónde se siembra;
//   · en el ⛰️ 3D se ven; sin errores de consola.
//   node calcos/pruebas/e2e/puntos-decision.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, entrar3D, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')
const { FILAS_PD } = require('../puntos-decision-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-puntos-decision')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.eventos) ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

function ejercicio({ conAIN4 = true } = {}) {
  const ej = ejercicioConcepto({ nombre: 'PRUEBA P.D. CE-I (FICT.)', conTexto: false })
  ej.ops.ains = [{ n: 1, nom: 'AIN-1', centro: [-69.05, -18.35], forma: 'punto' }, ...ej.ops.ains]
  if (conAIN4) ej.ops.ains.push({ n: 4, nom: 'AIN-4', centro: [-68.95, -18.65], forma: 'punto', noAntes: 'D+1 (0600)', indicador: 'Columnas mecanizadas al sur de Macaya.' })
  ej.g3 = { eventos: FILAS_PD }
  return ej
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1500, alto: 950 })
  const dialogos = []
  page.on('dialog', (d) => { dialogos.push(d.message()); d.accept() })
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await sembrarYAbrir(page, ejercicio())
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    const estrellas = page.locator('.leaflet-marker-pane .pd-estrella')
    await estrellas.first().waitFor({ timeout: 15000 })
    assert.equal(await estrellas.count(), 6, 'los seis P.D. en la carta')
    assert.deepEqual(await estrellas.evaluateAll((els) => els.map((e) => e.dataset.pd)), ['1', '2', '3', '4', '5', '6'])
    // Los de la AIN-3 (1, 2 y 5), uno al lado del otro, a la derecha de la A.I.N.
    const caja = async (k) => (await page.locator(`.leaflet-marker-pane .pd-estrella[data-pd="${k}"]`).boundingBox())
    const [b1, b2, b5] = [await caja(1), await caja(2), await caja(5)]
    assert.ok(Math.abs(b1.y - b2.y) < 1 && Math.abs(b2.y - b5.y) < 1, 'en la misma fila')
    assert.ok(b2.x > b1.x + 15 && b5.x > b2.x + 15, 'uno al lado del otro')
    await page.evaluate(() => window.__mapa2d.fitBounds([[-18.9, -69.4], [-18.2, -68.6]]))
    await page.waitForTimeout(500)
    await foto('1-carta')

    // Tocar el P.D. 1: lo escrito, sin «[IA — verificar]» en el texto
    await page.locator('.leaflet-marker-pane .pd-estrella[data-pd="1"]').click()
    const pop = page.locator('.pd-pop .pd-tt')
    await pop.waitFor({ timeout: 5000 })
    const txt = await pop.innerText()
    assert.match(txt, /P\.D\. 1 · AIN-3/)
    assert.match(txt, /No antes de D-3 \(0600\) · no después de D \(0400\)/)
    assert.match(txt, /Contrabatería masivo/)
    assert.equal((txt.match(/verificar/g) || []).length, 1, 'la marca de la IA va una sola vez, al pie')
    await page.waitForTimeout(400)
    await foto('2-recuadro')
    await page.evaluate(() => window.__mapa2d.closePopup())
    await page.evaluate(() => window.__mapa2d.fitBounds([[-18.9, -69.4], [-18.2, -68.6]]))
    await page.waitForTimeout(500)

    // Arrastrar el P.D. 6 (AIN-2) → g3.pdCarta.pos[6]
    const b6 = await caja(6)
    await page.mouse.move(b6.x + b6.width / 2, b6.y + b6.height / 2)
    await page.mouse.down()
    for (let k = 1; k <= 8; k++) await page.mouse.move(b6.x + b6.width / 2 + 12 * k, b6.y + b6.height / 2 + 8 * k)
    await page.mouse.up()
    const g3m = await esperar(page, leerG3, (g) => !!g.pdCarta?.pos?.[6])
    assert.ok(g3m.pdCarta?.pos?.[6], 'la posición del P.D. 6 quedó guardada')
    await page.waitForTimeout(300)
    const b6b = await caja(6)
    assert.ok(Math.abs(b6b.x - (b6.x + 96)) < 6 && Math.abs(b6b.y - (b6.y + 64)) < 6, `la estrella quedó donde se la soltó (${b6.x},${b6.y} → ${b6b.x},${b6b.y})`)
    assert.equal(g3m.eventos.length, 6, 'la hoja no se tocó')
    await foto('3-arrastrado')
    // ↺ Volver junto a su A.I.N.
    await page.locator('.leaflet-marker-pane .pd-estrella[data-pd="6"]').click()
    await clic(page.locator('.pd-pop [data-pd-volver]'))
    const g3v = await esperar(page, leerG3, (g) => !g.pdCarta?.pos?.[6])
    assert.ok(!g3v.pdCarta?.pos?.[6], '«↺ Volver junto a su A.I.N.»')

    // «Ver A.I.N.» las esconde
    await clic(page.getByRole('button', { name: /Ver A\.I\.N\./ }).first())
    await page.waitForTimeout(400)
    assert.equal(await estrellas.count(), 0, 'escondidas con las A.I.N.')
    await clic(page.getByRole('button', { name: /Ver A\.I\.N\./ }).first())
    await estrellas.first().waitFor({ timeout: 5000 })
    assert.equal(await estrellas.count(), 6)

    // 🌱 en la F4·P4: siembra la AIN-4 (la única sin P.D.) como P.D. 7, y aparece en la carta
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Analizar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F4·P4.*Eventos críticos/ }).first())
    await clic(page.getByRole('button', { name: /Traer del calco lo que falte/ }).first())
    const g3s = await esperar(page, leerG3, (g) => g.eventos.length === 7)
    assert.equal(g3s.eventos.length, 7, 'se agregó un renglón')
    assert.equal(g3s.eventos[6]['N° P.D.'], '7')
    assert.equal(g3s.eventos[6]['A.I.N. asociada'], 'AIN-4')
    assert.equal(g3s.eventos[6]['Criterio que activa la decisión'], 'Columnas mecanizadas al sur de Macaya.')
    assert.ok(!dialogos.length, 'sin aviso: había qué sembrar')
    await estrellas.nth(6).waitFor({ timeout: 5000 })
    assert.equal(await estrellas.count(), 7, 'el P.D. 7 en la carta')
    await foto('4-sembrado')
    // Otra vez: ya no queda ninguna A.I.N. sin P.D. → el aviso de esta hoja
    await clic(page.getByRole('button', { name: /Traer del calco lo que falte/ }).first())
    await page.waitForTimeout(500)
    assert.equal(dialogos.length, 1)
    assert.match(dialogos[0], /fases del C\.A\. PROPIO.*A\.I\.N\. de la carta/s)
    assert.ok(!/Disgregar/.test(dialogos[0]), 'no el aviso general de las unidades')

    // ⛰️ 3D: las estrellas se ven
    await clic(page.getByRole('button', { name: /Volver a mis documentos|← Volver/ }).first()).catch(() => {})
    await entrar3D(page)
    await page.locator('.m3d-mk .pd-estrella').first().waitFor({ timeout: 20000 })
    assert.equal(await page.locator('.m3d-mk .pd-estrella').count(), 7, 'en el 3D también')
    await foto('5-3d')

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e puntos de decisión: estrellas junto a su A.I.N., recuadro, arrastre, ↺ volver, Ver A.I.N., 🌱 y 3D')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
