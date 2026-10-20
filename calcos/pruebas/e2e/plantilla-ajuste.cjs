// 🧭 De dónde viene el enemigo y ✋ mover la plantilla doctrinal (index-plantilla-ajuste-20261020.js), en
// la Mesa real (Chromium). El caso de Sergio: el A.O. se trazó empezando por el lado NORTE (el primer
// lado es el frente), pero la L.P.R. y el enemigo están al OESTE y las avenidas cruzan de oeste a este.
//   · «Acostar» en automático la pone contra el norte (lo que pasaba);
//   · «→ OESTE» la vuelve a acostar contra el lado oeste: L.P.R. al oeste, todas las fichas afuera, al
//     oeste, y el primer escalón mirando al este (de izquierda a derecha);
//   · ↑ mueve TODO 1 km al norte sin tocar la L.P.R.; ⟳ 5° la gira;
//   · «☝️ Una ficha por vez» + arrastrar en la carta mueve sólo esa ficha; «✋ Toda la plantilla» +
//     arrastrar mueve todo; sin errores de consola.
//   node calcos/pruebas/e2e/plantilla-ajuste.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-plantilla-ajuste')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const OESTE = -68.6

// La plantilla acostada (el estado de React que tiene marcas, bandas y líneas).
const leerPlantilla = (page) =>
  estadoReact(page, (v) => (v && v.ok === true && Array.isArray(v.marcas) && Array.isArray(v.bandas) && Array.isArray(v.lineas) ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperarPlantilla(page, cumple, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    const p = await leerPlantilla(page)
    if (p && cumple(p)) return p
    if (Date.now() - t0 > ms) return p
    await page.waitForTimeout(250)
  }
}
const lpr = (p) => p.lineas.find((l) => l.tipo === 'lpr')
// Centro de una ficha de la plantilla que se vea en la carta (no tapada por los paneles) y se pueda arrastrar.
const fichaVisible = (page) =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll('.leaflet-marker-icon')) {
      if (!el.querySelector('.pl-km')) continue
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2
      const arriba = document.elementFromPoint(x, y)
      if (arriba && arriba.closest('.leaflet-marker-icon') === el) {
        if (!el.classList.contains('leaflet-marker-draggable')) throw new Error('la ficha de la plantilla no se puede arrastrar')
        return [x, y]
      }
    }
    throw new Error('no hay ninguna ficha de la plantilla a la vista')
  })

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA PLANTILLA AJUSTE (FICT.)' })
  // A.O. de ejercicioPersonal: [-68.6, -68.0] × [-17.4, -16.8], frente = lado NORTE (el primero trazado).
  const av = (lat, alReves = false) => {
    const c = []
    for (let lng = -69.0; lng <= -67.6; lng += 0.05) c.push([+lng.toFixed(3), lat])
    return { coords: alReves ? c.reverse() : c, escalon: 'batallon', bando: 'enemigo' }
  }
  datos.cmoc = { restringido: [], severo: [], clave: [], defensivo: [], ae: [], corredores: [], avenidas: [av(-16.95), av(-17.1, true), av(-17.25)], desplazamientos: [] }
  datos.picb = { _pd: { manual: 'rojo', nivel: 'brigada' } }
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-2 INTELIGENCIA/i }).first())
    await page.getByText('🔎 PICB — las 4 fases del G-2').waitFor({ timeout: 15000 })
    await clic(page.getByText('Evaluar la amenaza').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('P.D.', { exact: true }).first())
    const panel = page.locator('[data-pl="ajuste"]')
    await panel.waitFor({ timeout: 10000 })
    await panel.scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(SALIDAS, '1-panel.png') })

    // ── Automático: el primer lado trazado (norte) ──
    await clic(page.getByRole('button', { name: /Acostar «/ }).first())
    const pN = await esperarPlantilla(page, () => true)
    assert.ok(pN, 'se acostó la plantilla')
    assert.ok(pN.marcas.every((m) => m.centro[1] > -16.8), 'en automático va contra el norte (el primer lado trazado)')

    // ── 🧭 El enemigo viene del OESTE ──
    await clic(panel.getByRole('button', { name: /→ OESTE/ }))
    const pO = await esperarPlantilla(page, (p) => p.dirEnemigo === 'O')
    assert.equal(pO.dirEnemigo, 'O', 'se volvió a acostar con el enemigo al oeste')
    assert.ok(lpr(pO).coords.every((c) => Math.abs(c[0] - OESTE) < 1e-9), 'la L.P.R. es el lado oeste del A.O.')
    assert.ok(pO.marcas.length >= 4)
    assert.ok(pO.marcas.every((m) => m.centro[0] < OESTE), 'todas las fichas al oeste del A.O.')
    assert.equal(pO.resumen.dentroDelAO, 0)
    const e1 = pO.marcas.filter((m) => m.rol === 'e1')
    assert.ok(e1.length && e1.every((m) => m.rot > 45 && m.rot < 135), 'el primer escalón ataca hacia el ESTE (de izquierda a derecha)')
    const guardado = await estadoReact(page, (v) => (v && v._pd && typeof v._pd === 'object' ? v._pd.dirEnemigo : undefined))
    assert.equal(guardado, 'O', 'la dirección queda en la hoja P.D. (picb._pd)')
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SALIDAS, '2-oeste.png') })

    // ── ↑ Mover TODO 1 km al norte ──
    await panel.locator('select').selectOption('1')
    await clic(panel.getByRole('button', { name: '↑', exact: true }))
    const pM = await esperarPlantilla(page, (p) => p.SIDajustada?.movidaKm === 1)
    const dLat = pM.marcas[0].centro[1] - pO.marcas[0].centro[1]
    assert.ok(Math.abs(dLat * 110.574 - 1) < 1e-6, 'todo se corrió 1 km al norte')
    assert.deepEqual(lpr(pM).coords, lpr(pO).coords, 'la L.P.R. (nuestra) no se mueve')

    // ── ⟳ 5° ──
    await clic(panel.getByRole('button', { name: '⟳ 5°' }))
    const pG = await esperarPlantilla(page, (p) => p.SIDajustada?.giro === 5)
    assert.equal(pG.marcas[0].rot, (pM.marcas[0].rot + 5) % 360)
    assert.match(await panel.innerText(), /Ajustada a mano: movida 1 km, girada 5°/)

    // ── ☝️ Una ficha por vez: arrastrarla en la carta ──
    await clic(panel.getByRole('button', { name: /Una ficha por vez/ }))
    await page.waitForTimeout(600)
    const [x, y] = await fichaVisible(page)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 40, y + 10, { steps: 8 })
    await page.mouse.move(x + 80, y + 20, { steps: 8 })
    await page.mouse.up()
    const pF = await esperarPlantilla(page, (p) => p.SIDajustada?.fichas === 1)
    assert.equal(pF.SIDajustada.fichas, 1, 'se movió una ficha')
    const movidas = pF.marcas.map((m, i) => i).filter((i) => String(pF.marcas[i].centro) !== String(pG.marcas[i].centro))
    assert.equal(movidas.length, 1, 'se movió UNA sola ficha')
    assert.ok(pF.marcas[movidas[0]].centro[0] > pG.marcas[movidas[0]].centro[0], 'la ficha se fue al este')
    await page.screenshot({ path: path.join(SALIDAS, '3-ficha.png') })

    // ── ✋ Toda la plantilla: arrastrar cualquier ficha mueve todo ──
    await clic(panel.getByRole('button', { name: /Toda la plantilla/ }))
    await page.waitForTimeout(600)
    const [x2, y2] = await fichaVisible(page)
    await page.mouse.move(x2, y2)
    await page.mouse.down()
    await page.mouse.move(x2, y2 - 30, { steps: 8 })
    await page.mouse.move(x2, y2 - 60, { steps: 8 })
    await page.mouse.up()
    const pT = await esperarPlantilla(page, (p) => p.SIDajustada?.movidaKm > 1)
    const d0 = pT.marcas[0].centro[1] - pF.marcas[0].centro[1]
    assert.ok(d0 > 0.01, 'todo se fue al norte')
    pT.marcas.forEach((m, i) => assert.ok(Math.abs(m.centro[1] - pF.marcas[i].centro[1] - d0) < 1e-9, 'todas juntas'))
    assert.deepEqual(lpr(pT).coords, lpr(pO).coords)
    await page.screenshot({ path: path.join(SALIDAS, '4-todo.png') })

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: con «🧭 OESTE» la plantilla se acuesta contra el lado oeste y ataca de izquierda a derecha; se mueve, se gira y se arrastra toda o ficha por ficha.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
