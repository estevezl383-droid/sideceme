// ⬚ Seleccionar en la carta y el tablero del G-4 sin textos (index-seleccionar-20261018.js), en la
// Mesa real (Chromium), como lo haría un alumno. Lo pidió Sergio con la captura de los 30 puestos del
// Batallón Logístico amontonados: «no encuentro cómo borrar esos símbolos… dibujar un área,
// seleccionar, y hacer clic otra vez para deseleccionar uno por uno, así como en PowerPoint».
//   · 🚚 G-4 → ▣ ASDI: el paso a paso sin la explicación de qué es el ASDI/ARCE (empieza en
//     «Proponer») y el despliegue sin los párrafos; los botones siguen;
//   · 🏗️ Desplegar la plantilla pone los 30 puestos (y los sectores de las compañías);
//   · «⬚ Seleccionar» en la barra: un recuadro alrededor del ASDI toma los puestos y los sectores
//     (no el ASDI, que no queda entero adentro); un clic en un puesto lo suelta y otro lo vuelve a
//     tomar; Alt + recuadro quita; Supr borra todo lo seleccionado DE UNA VEZ; «↶ Deshacer»
//     devuelve todo de un toque; Esc suelta y otro Esc sale de la herramienta;
//   · con la herramienta puesta, el clic en la carta no abre la ficha ni coloca nada;
//   · lo borrado queda guardado así en el ejercicio; sin errores de consola.
//   node calcos/pruebas/e2e/seleccion.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact, leerGuardado } = require('./navegador.js')
const { ejercicioLogistica } = require('../logistica-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-seleccionar')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const ops = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.zonasLog) && Array.isArray(v.limites) ? { zonas: v.zonasLog.length, sectores: (v.sectoresLog || []).length, magnitudes: (v.magnitudes || []).length } : undefined))
const fichas = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.length && v.every((u) => u && u.lat != null && u.lng != null && 'id' in u) ? v.map((u) => ({ id: String(u.id), origen: u.origen || '', tipo: u.tipo || '', lat: u.lat, lng: u.lng })) : undefined))
const estado = (page) => page.evaluate(() => window.SIDSeleccion && window.SIDSeleccion.estado())
async function esperar(page, f, ms = 10000) {
  let r = null
  for (let t = 0; t < ms; t += 250) {
    r = await f()
    if (r) return r
    await page.waitForTimeout(250)
  }
  return r
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const datos = ejercicioLogistica({ conPropuestas: true })
  datos.nombre = 'SELECCION G-4'
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})

    // ── 🚚 G-4: sin textos de explicación ──
    await clic(page.getByRole('button', { name: /G-4 Logística/ }).first())
    const paso = page.locator('[data-g4="paso-a-paso"]')
    await paso.waitFor({ timeout: 15000 })
    const tablero = paso.locator('xpath=..')
    const texto = await tablero.innerText()
    for (const t of ['¿Qué es un área de apoyo logístico?', 'Entonces, ¿cuál es la diferencia?', 'leé esto primero', 'Construí el área de apoyo logístico paso a paso', 'El ASDI no se dibuja libre', 'Se grafica como en el reglamento', 'Cada área queda rotulada con su número', 'Sanidad y las clases de consumo', 'El ASDI es la banda del MEDIO', 'El área se lee por los límites'])
      assert.ok(!texto.includes(t), `el tablero del G-4 ya no dice «${t}»`)
    for (const t of ['Proponer las áreas posibles', 'Trazar el ASDI', 'Trazar el ARCE', 'ÁREAS TRAZADAS', 'Área sobre la que desplegar', '¿Hacia dónde está el frente?', 'Recolocar las marcas sobre el borde', 'Desplegar el esquema en profundidad', 'COMPAÑÍAS A DESPLEGAR', 'Desplegar la plantilla'])
      assert.ok(texto.includes(t), `la herramienta «${t}» sigue en el tablero`)
    assert.equal(await paso.locator('[data-paso]').count(), 4, 'el paso a paso tiene 4 pasos (sin «Entender»)')
    assert.match(await paso.locator('[data-paso="1"] > button').innerText(), /Proponer/, 'el primero es Proponer')
    await foto('1-g4-sin-textos')

    // ── 🏗️ Desplegar la plantilla en el Área B ──
    const antes = await fichas(page)
    await clic(page.getByRole('button', { name: /Desplegar la plantilla/ }).first())
    const desplegadas = await esperar(page, async () => {
      const f = await fichas(page)
      return f && f.filter((u) => u.origen === 'plantilla-asdi').length >= 20 ? f : null
    })
    assert.ok(desplegadas, 'la plantilla se desplegó')
    const puestos = desplegadas.filter((u) => u.origen === 'plantilla-asdi')
    const o0 = await ops(page)
    assert.ok(o0.sectores > 0, 'con sus sectores')
    // El despliegue sin los párrafos: quedan los campos y los botones.
    await tablero.getByText('COMPAÑÍAS A DESPLEGAR').scrollIntoViewIfNeeded()
    await foto('2-g4-despliegue')
    // Se encuadran los puestos (debajo de la barra y a la izquierda del tablero del G-4).
    await page.evaluate((P) => {
      const lat = P.map((u) => u.lat)
      const lng = P.map((u) => u.lng)
      window.__mapa2d.fitBounds([[Math.min(...lat), Math.min(...lng)], [Math.max(...lat), Math.max(...lng)]], { paddingTopLeft: [420, 380], paddingBottomRight: [420, 160], animate: false })
    }, puestos)
    await page.waitForTimeout(900)
    await foto('3-plantilla')

    // ── ⬚ Seleccionar ──
    const boton = page.locator('.botones-mapa > button[data-sid-herramienta="seleccionar"]')
    assert.equal(await boton.count(), 1, 'el botón está en la barra')
    await boton.click()
    await page.locator('.sid-sel-velo').waitFor({ timeout: 5000 })
    const barra = page.locator('.sid-sel-barra')
    await barra.waitFor()
    assert.match(await barra.innerText(), /nada seleccionado/)

    // Recuadro alrededor de los puestos (el área logística no queda entera adentro: se toma lo de adentro).
    const caja = await page.evaluate((ids) => {
      const rs = ids.map((id) => document.querySelector(`.leaflet-marker-pane [data-sid-unidad="${CSS.escape(id)}"]`)).filter(Boolean).map((el) => el.getBoundingClientRect())
      return { n: rs.length, x1: Math.min(...rs.map((r) => r.left)) - 25, y1: Math.min(...rs.map((r) => r.top)) - 25, x2: Math.max(...rs.map((r) => r.right)) + 25, y2: Math.max(...rs.map((r) => r.bottom)) + 25 }
    }, puestos.map((u) => u.id))
    assert.equal(caja.n, puestos.length, 'cada puesto de la carta dice qué unidad es (data-sid-unidad)')
    await page.mouse.move(caja.x1, caja.y1)
    await page.mouse.down()
    await page.mouse.move((caja.x1 + caja.x2) / 2, (caja.y1 + caja.y2) / 2, { steps: 5 })
    await page.mouse.move(caja.x2, caja.y2, { steps: 5 })
    await foto('4-recuadro')
    await page.mouse.up()
    await page.waitForTimeout(300)
    let e = await estado(page)
    const enVista = await page.evaluate(() => document.querySelectorAll('.leaflet-marker-pane [data-sid-unidad]').length)
    assert.ok(e.fichas.length >= puestos.length, `el recuadro tomó los ${puestos.length} puestos (tomó ${e.fichas.length} de ${enVista} fichas en la carta)`)
    assert.ok(e.figuras.some((c) => c.startsWith('sectoresLog#')), 'y los sectores de las compañías')
    assert.ok(!e.figuras.some((c) => c.startsWith('zonasLog#')) || e.figuras.includes('zonasLog#2'), 'el ASDI entra sólo si quedó entero adentro')
    assert.equal(await page.locator('.leaflet-marker-icon.sid-sel-ficha').count(), e.fichas.length, 'cada ficha seleccionada se ve marcada')
    await foto('5-seleccionados')

    // Un clic en un puesto lo suelta; otro clic lo vuelve a tomar.
    const uno = await page.evaluate((id) => {
      const el = document.querySelector(`.leaflet-marker-pane [data-sid-unidad="${CSS.escape(id)}"]`)
      const r = el.getBoundingClientRect()
      return { id, x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }, e.fichas[0])
    const total = e.fichas.length
    await page.mouse.click(uno.x, uno.y)
    await page.waitForTimeout(200)
    e = await estado(page)
    assert.equal(e.fichas.length, total - 1, 'un clic lo suelta')
    assert.ok(!e.fichas.includes(uno.id))
    await page.mouse.click(uno.x, uno.y)
    await page.waitForTimeout(200)
    assert.equal((await estado(page)).fichas.length, total, 'otro clic lo vuelve a tomar')
    await page.mouse.click(uno.x, uno.y)
    await page.waitForTimeout(200)
    assert.match(await barra.innerText(), new RegExp(`${total - 1} fichas`), 'la barra cuenta lo seleccionado')
    assert.equal(await page.locator('.ficha-instalacion, [data-ficha-instalacion]').count(), 0, 'el clic no abrió la ficha de la instalación')

    // ── 🗑 Supr: borra lo seleccionado de una vez ──
    const fAntes = await fichas(page)
    const oAntes = await ops(page)
    const figurasSel = (await estado(page)).figuras.length
    await page.keyboard.press('Delete')
    await page.waitForTimeout(600)
    const fDespues = (await fichas(page)) || []
    assert.equal(fDespues.length, fAntes.length - (total - 1), 'se borraron las fichas seleccionadas')
    assert.ok(fDespues.some((u) => u.id === uno.id), 'quedó el puesto que se soltó')
    const oDespues = await ops(page)
    assert.equal(oDespues.sectores, oAntes.sectores - figurasSel, 'y los sectores seleccionados')
    assert.match(await barra.innerText(), /nada seleccionado/)
    const deshacer = page.locator('.botones-mapa > button.btn-deshacer').first()
    assert.match(await deshacer.innerText(), /\(1\)/, 'UN paso para deshacer')
    await foto('6-borrados')

    // ── ↶ Deshacer: vuelve todo de un toque ──
    await deshacer.click()
    await page.waitForTimeout(600)
    assert.equal(((await fichas(page)) || []).length, fAntes.length, 'volvieron las fichas')
    assert.deepEqual(await ops(page), oAntes, 'y los sectores')
    assert.match(await page.locator('body').innerText(), /volvió lo que se borró con ⬚ Seleccionar/)

    // ── Alt + recuadro quita; Esc suelta; otro Esc sale ──
    await page.mouse.move(caja.x1, caja.y1)
    await page.mouse.down()
    await page.mouse.move(caja.x2, caja.y2, { steps: 6 })
    await page.mouse.up()
    await page.waitForTimeout(200)
    assert.ok((await estado(page)).fichas.length >= puestos.length)
    await page.keyboard.down('Alt')
    await page.mouse.move(caja.x1, caja.y1)
    await page.mouse.down()
    await page.mouse.move(caja.x2, caja.y2, { steps: 6 })
    await page.mouse.up()
    await page.keyboard.up('Alt')
    await page.waitForTimeout(200)
    assert.equal((await estado(page)).fichas.length, 0, 'Alt + recuadro las quita')
    await page.mouse.click(uno.x, uno.y)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    assert.equal((await estado(page)).fichas.length, 0, 'Esc suelta la selección')
    assert.equal(await page.locator('.sid-sel-velo').count(), 1, 'y la herramienta sigue')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    assert.equal(await page.locator('.sid-sel-velo').count(), 0, 'otro Esc sale')
    assert.equal(await page.locator('.sid-sel-barra').count(), 0)

    // ── Lo borrado queda guardado ──
    await boton.click()
    await page.locator('.sid-sel-velo').waitFor()
    await page.mouse.move(caja.x1, caja.y1)
    await page.mouse.down()
    await page.mouse.move(caja.x2, caja.y2, { steps: 6 })
    await page.mouse.up()
    await clic(barra.getByRole('button', { name: '🗑 Borrar' }))
    await page.waitForTimeout(400)
    await clic(barra.getByRole('button', { name: '✕ Salir' }))
    const guardado = await esperar(page, async () => {
      const g = await leerGuardado(page, datos.nombre)
      return g && Array.isArray(g.unidades) && !g.unidades.some((u) => u.origen === 'plantilla-asdi') ? g : null
    }, 20000)
    assert.ok(guardado, 'el ejercicio se guardó sin los puestos borrados')
    assert.equal(await page.locator('.sid-sel-velo').count(), 0)
    await foto('7-guardado')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log(`✔ e2e/seleccion: G-4 sin textos, ${puestos.length} puestos desplegados, seleccionados con el recuadro, soltar/tomar con clic, Supr, ↶ Deshacer de un toque, Alt, Esc y guardado`)
  } catch (err) {
    await foto('error').catch(() => {})
    console.error('✘ e2e/seleccion:', err.message)
    if (errores.length) console.error(errores.join('\n'))
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
