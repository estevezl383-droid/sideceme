// El TABLERO G-4 de la instalación y la PROPUESTA DEL ASDI CON LA PICB en la Mesa real
// (Chromium), con el ejercicio FICTICIO de tablero-g4-ejemplo.js, en escritorio y teléfono:
//   · tocar el Puesto Cl V Avanzado en la carta: el globo dice a quién apoya (la FT
//     TORREZ), cuántos hombres y vehículos, cuánto mueve y con cuántos camiones; se abre
//     el tablero con sus gráficos (números, croquis, barras por unidad y clase, flota,
//     ciclo de la jornada, munición, dona);
//   · el Puesto Cl V del ASDI apoya a las cinco unidades; las del oficial mandan (efectivos
//     de la FT), se elige a quién apoya, se cambian los factores, la frecuencia;
//   · la IA: el pedido lleva lo calculado y las ideas; la respuesta se proyecta en
//     gráficos y sus ajustes se aplican con un botón;
//   · acostar en la carta y bajar la imagen PNG;
//   · G-4 → ▣ ASDI → paso 2: la Mesa propone A, B y C con el CMOC, «en grande» en <body>,
//     y las lleva al calco como propuestas;
//   · se guarda con el ejercicio; sin errores de JS.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, leerGuardado, estadoReact, aPantalla, entrar3D, salir3D } = require('./navegador.js')
const { ejercicioTablero } = require('../tablero-g4-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-tablero-g4')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const tablero = (page) => page.locator('[data-tablero-g4]')
const unidadesDe = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.some((u) => u && u.id === 'ag-torrez') ? JSON.parse(JSON.stringify(v)) : undefined))
const opsDe = (page) => estadoReact(page, (v) => (v && Array.isArray(v.zonasLog) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(page, f, ms = 10000) {
  let r = null
  for (let t = 0; t < ms; t += 250) {
    r = await f()
    if (r) return r
    await page.waitForTimeout(250)
  }
  return r
}
const abrirTablero = (page, id) => page.evaluate((i) => window.dispatchEvent(new CustomEvent('sideceme:ficha-instalacion', { detail: { id: i } })), id)
const kpi = async (page, rot) => {
  const t = await tablero(page).locator('[data-grafico="kpis"]').innerText()
  const m = t.split('\n').map((x) => x.trim())
  const i = m.findIndex((x) => x.toUpperCase().includes(rot.toUpperCase()))
  return i >= 0 ? m[i + 1] : null
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1600, alto: movil ? 844 : 1000, movil })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioTablero()
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      const ocultar = page.getByText('▼ ocultar')
      if (await ocultar.count()) await ocultar.first().click().catch(() => {})

      // ── El globo de la instalación en la carta ──
      if (!movil) {
        await page.evaluate(() => (window.__lm2d = window.__mapa2d))
        const inst = datos.unidades.find((u) => u.id === 'i-cl5avz')
        await page.evaluate(([lat, lng]) => window.__mapa2d.setView([lat, lng], 15, { animate: false }), [inst.lat, inst.lng])
        await page.waitForTimeout(1200)
        const [[x, y]] = await aPantalla(page, [[inst.lng, inst.lat]])
        await page.mouse.click(x, y)
        // El texto del globo se lee apenas aparece (el globo se llena al abrirse).
        const tg = await esperar(page, () => page.evaluate(() => document.querySelector('.leaflet-popup')?.innerText || ''), 8000)
        await page.screenshot({ path: path.join(out, `${tag}-globo.png`) })
        for (const t of ['PUESTO DE DISTRIBUCIÓN CLASE V AVANZADO', 'Apoya a 1 unidad(es)', 'FT «TORREZ»', '846', 'hombres', '58', 'vehículos', 'camión', 'cada 24 h', '📊 ABRIR TABLERO G-4', 'ELIMINAR INSTALACIÓN']) assert.ok(tg.toLowerCase().includes(t.toLowerCase()), `el globo no dice «${t}»: ${tg}`)
        assert.equal(await tablero(page).count(), 0, 'tocar la instalación sólo abre el globo')
        await page.locator('.leaflet-popup').getByRole('button', { name: '📊 ABRIR TABLERO G-4' }).click()
        await tablero(page).waitFor({ timeout: 8000 })
        await page.keyboard.press('Escape')
      } else {
        await abrirTablero(page, 'i-cl5avz')
        await tablero(page).waitFor({ timeout: 8000 })
      }
      // El tablero del Cl V Avanzado: apoya a la FT TORREZ.
      assert.ok((await tablero(page).innerText()).includes('APOYA A:'))
      assert.equal(await kpi(page, 'Unidades apoyadas'), '1')
      assert.equal(await kpi(page, 'Efectivos'), '846')
      assert.ok((await tablero(page).locator('.sid-tg-apoya').innerText()).includes('FT «TORREZ»'))
      for (const g of ['kpis', 'croquis', 'consumo-unidad', 'flota', 'ciclo', 'municion', 'dona']) assert.equal(await tablero(page).locator(`[data-grafico="${g}"]`).count(), 1, `falta el gráfico «${g}»`)
      await page.screenshot({ path: path.join(out, `${tag}-tablero-cl5-avanzado.png`) })

      // ── El Puesto Cl V del ASDI: las cinco unidades ──
      await abrirTablero(page, 'i-cl5')
      await page.waitForTimeout(500)
      assert.equal(await tablero(page).getAttribute('data-tablero-g4'), 'i-cl5')
      assert.equal(await kpi(page, 'Unidades apoyadas'), '5')
      const antes = Number((await kpi(page, 'Efectivos')).replace(/\D/g, ''))
      assert.ok(antes > 2500)
      const camionesAntes = Number(await kpi(page, 'Flota · camiones'))
      assert.ok(camionesAntes >= 5, `camiones: ${camionesAntes}`)
      const mun = await tablero(page).locator('[data-grafico="municion"]').innerText()
      for (const t of ['Obús 105 mm', 'Cañón de tanque', 'Ametralladoras', 'disparos']) assert.ok(mun.toLowerCase().includes(t.toLowerCase()), `munición: falta «${t}»`)
      await page.screenshot({ path: path.join(out, `${tag}-tablero-cl5.png`) })

      // Unidades: los efectivos reales de la FT mandan.
      await clic(tablero(page).locator('[data-pestana="unidades"]'))
      const ft = tablero(page).locator('[data-unidad="ag-torrez"]')
      await ft.waitFor()
      await ft.locator('input[aria-label="hombres"]').fill('1250')
      const u1 = await esperar(page, async () => {
        const us = await unidadesDe(page)
        return us?.find((u) => u.id === 'ag-torrez')?.logDatos?.hombres === 1250 ? us : null
      })
      assert.ok(u1, 'los efectivos de la FT quedaron en la unidad (logDatos)')
      await page.screenshot({ path: path.join(out, `${tag}-unidades.png`) })
      // Elijo yo: sin el RA-1.
      await clic(tablero(page).getByRole('button', { name: '👤 Elijo yo' }))
      await page.waitForTimeout(300)
      await clic(tablero(page).getByRole('button', { name: /RA-1 «DELTA»/ }))
      const u2 = await esperar(page, async () => {
        const us = await unidadesDe(page)
        const i = us?.find((u) => u.id === 'i-cl5')
        return Array.isArray(i?.apoyaA) && i.apoyaA.length === 4 && !i.apoyaA.includes('l-delta') ? i : null
      })
      assert.ok(u2, 'el oficial eligió a quién apoya (sin el RA-1)')
      await clic(tablero(page).locator('[data-pestana="tablero"]'))
      await page.waitForTimeout(400)
      assert.equal(await kpi(page, 'Unidades apoyadas'), '4')
      assert.ok(Number((await kpi(page, 'Efectivos')).replace(/\D/g, '')) !== antes)

      // Factores: el camión de 10 t baja la flota.
      await clic(tablero(page).locator('[data-pestana="factores"]'))
      await tablero(page).locator('input[aria-label="medios.carga"]').fill('10')
      const o1 = await esperar(page, async () => {
        const o = await opsDe(page)
        return o?.planLog?.factores?.medios?.carga === 10 ? o : null
      })
      assert.ok(o1, 'los factores quedaron en el calco (ops.planLog)')
      await page.screenshot({ path: path.join(out, `${tag}-factores.png`) })
      await clic(tablero(page).locator('[data-pestana="tablero"]'))
      await page.waitForTimeout(400)
      assert.ok(Number(await kpi(page, 'Flota · camiones')) < camionesAntes, 'con camiones de 10 t hacen falta menos')

      // IA: el pedido con las ideas; la respuesta en gráficos; los ajustes con un botón.
      await clic(tablero(page).locator('[data-pestana="ia"]'))
      await tablero(page).locator('textarea').first().fill('La FT TORREZ es el esfuerzo principal: prioridad 1 en Cl V (FICT.).')
      await page.waitForTimeout(800)
      await clic(tablero(page).getByRole('button', { name: '⚙ GENERAR PEDIDO' }))
      const pedido = await tablero(page).locator('textarea[aria-label="Pedido a la IA"]').inputValue()
      for (const t of ['FT «TORREZ»', '1250 hombres (dato del oficial)', 'La FT TORREZ es el esfuerzo principal', 'Flota necesaria', 'medios.carga = 10 t (cambiado por el oficial)', '"instalacionId": "i-cl5"']) assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
      const resp = { version: 1, instalacionId: 'i-cl5', resumen: 'El Puesto Cl V apoya a cuatro unidades (FICT.).', prioridades: [{ unidad: 'FT «TORREZ»', prioridad: 1, motivo: 'Esfuerzo principal (FICT.).' }, { unidad: 'RCB-2 «BRAVO» (FICT.)', prioridad: 2, motivo: 'Reserva (FICT.).' }], niveles: { NO: 1, NS: 2, NMA: 3 }, recomendaciones: ['Elevar la Cl V antes del D (FICT.).'], riesgos: ['EPA expuesto (FICT.).'], ajustes: { frecuenciaH: 12, modalidad: 'propia' } }
      await tablero(page).locator('textarea[placeholder^="Pegá acá la respuesta"]').fill('```json\n' + JSON.stringify(resp) + '\n```')
      await clic(tablero(page).getByRole('button', { name: '📊 PROYECTAR LA RESPUESTA' }))
      await tablero(page).locator('[data-ia="con-respuesta"]').waitFor({ timeout: 5000 })
      const ria = await tablero(page).locator('[data-ia="con-respuesta"]').innerText()
      for (const t of ['PENDIENTE DE REVISIÓN', 'Prioridad de apoyo', '1° FT «TORREZ»', 'Niveles de abastecimiento', 'Nivel máximo (NMA)', 'Elevar la Cl V', 'Entrega cada 12 h']) assert.ok(ria.toLowerCase().includes(t.toLowerCase()), `la respuesta proyectada no trae «${t}»`)
      await page.screenshot({ path: path.join(out, `${tag}-ia.png`) })
      await clic(tablero(page).getByRole('button', { name: '✓ Aplicar los ajustes al tablero' }))
      const u3 = await esperar(page, async () => {
        const us = await unidadesDe(page)
        const i = us?.find((u) => u.id === 'i-cl5')
        return i?.tableroG4?.frecuenciaH === 12 && i.tableroG4.modalidad === 'propia' ? i : null
      })
      assert.ok(u3, 'los ajustes de la IA quedaron en la instalación')
      await clic(tablero(page).locator('[data-pestana="tablero"]'))
      await page.waitForTimeout(400)
      assert.match(await kpi(page, 'Viajes por día'), /\d/)
      assert.ok((await tablero(page).innerText()).includes('Por cuenta propia: estos vehículos son de las UNIDADES'))

      // Acostar en la carta (escritorio) y bajar la imagen.
      if (!movil) {
        await clic(tablero(page).locator('[data-accion="acostar"]'))
        await page.waitForTimeout(800)
        assert.ok(await page.locator('.leaflet-marker-pane').getByText(/FT «TORREZ»: .*t\/día/).count(), 'el flujo a la FT TORREZ acostado en la carta')
        await clic(tablero(page).locator('[data-accion="acostar"]'))
      }
      const dl = page.waitForEvent('download', { timeout: 20000 })
      await clic(tablero(page).locator('[data-accion="imagen"]'))
      const d = await dl
      assert.match(d.suggestedFilename(), /^G4_Tablero_.*\.(png|svg)$/)
      const fimg = path.join(out, `${tag}-${d.suggestedFilename()}`)
      await d.saveAs(fimg)
      assert.ok(fs.statSync(fimg).size > 20000, 'la imagen tiene contenido')
      await clic(tablero(page).getByRole('button', { name: 'Cerrar el tablero' }))

      // ── G-4 → ▣ ASDI → paso 2: la Mesa propone con la PICB ──
      await clic(page.getByRole('button', { name: /G-4 Logística/ }).first())
      const paso = page.locator('[data-g4="paso-a-paso"]')
      await paso.waitFor({ timeout: 15000 })
      const b2 = paso.locator('[data-paso="2"] > button').first()
      if ((await b2.getAttribute('aria-expanded')) !== 'true') await clic(b2)
      const caja = paso.locator('[data-g4="propuesta-picb"]')
      await caja.waitFor()
      assert.ok((await caja.innerText()).includes('1 terreno severo'))
      await clic(caja.locator('[data-accion="calcular-picb"]'))
      await caja.locator('[data-grafico="mapa-picb"]').waitFor({ timeout: 8000 })
      for (const g of ['mapa-picb', 'embudo-picb', 'puntaje-picb', 'factores-picb']) assert.equal(await caja.locator(`[data-grafico="${g}"]`).count(), 1, `propuesta: falta «${g}»`)
      const tc = await caja.innerText()
      for (const t of ['ÁREA A', 'ÁREA B', 'ÁREA C', 'Terreno severo del CMOC', 'Sobre una avenida de aproximación enemiga', 'MANIOBRA', 'SEGURIDAD']) assert.ok(tc.toLowerCase().includes(t.toLowerCase()), `propuesta: falta «${t}»`)
      await caja.screenshot({ path: path.join(out, `${tag}-propuesta-panel.png`) })
      await clic(caja.locator('[data-accion="grande-picb"]'))
      const grande = page.locator('[data-g4="propuesta-grande"]')
      await grande.waitFor({ timeout: 5000 })
      const bb = await grande.boundingBox()
      const vp = page.viewportSize()
      assert.ok(bb.width >= vp.width - 2 && bb.height >= vp.height - 2, `«en grande» ocupa la pantalla (${bb.width}×${bb.height})`)
      assert.equal(await page.evaluate(() => document.querySelector('[data-g4="propuesta-grande"]').parentElement === document.body), true, 'va en <body>')
      await page.screenshot({ path: path.join(out, `${tag}-propuesta-grande.png`) })
      await clic(grande.getByRole('button', { name: '✔ Llevar al calco' }))
      const o2 = await esperar(page, async () => {
        const o = await opsDe(page)
        return (o?.zonasLog || []).filter((z) => z.origen === 'picb').length === 3 ? o : null
      })
      assert.ok(o2, 'las tres áreas de la propuesta quedaron en el calco')
      assert.deepEqual(o2.zonasLog.filter((z) => z.origen === 'picb').map((z) => z.propuesta), ['B', 'C', 'D'], 'con las letras libres (la A ya estaba)')
      assert.ok(o2.zonasLog.filter((z) => z.origen === 'picb').every((z) => z.zona === 'asdi' && z.coords.length === 4 && z.clave))
      await clic(grande.getByRole('button', { name: '✕ Cerrar' }))

      // En el 3D el globo no se ve: tocar la instalación abre el tablero directo.
      if (!movil) {
        await entrar3D(page)
        await page.evaluate(() => {
          const lm = window.__espejo3d.lm
          const m = Object.values(lm._layers).find((x) => x._icon && x.getLatLng && Math.abs(x.getLatLng().lat + 17.012) < 1e-6 && Math.abs(x.getLatLng().lng + 68.34) < 1e-6)
          m.fire('click', { latlng: m.getLatLng(), originalEvent: new MouseEvent('click') })
        })
        await tablero(page).waitFor({ timeout: 8000 })
        assert.equal(await tablero(page).getAttribute('data-tablero-g4'), 'i-cl5')
        await page.screenshot({ path: path.join(out, `${tag}-3d-tablero.png`) })
        await clic(tablero(page).getByRole('button', { name: 'Cerrar el tablero' }))
        await salir3D(page)
      }

      // Se guarda con el ejercicio.
      await clic(page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first())
      await clic(page.getByRole('button', { name: /Guardar todo/ }))
      const g = await esperar(page, async () => {
        const x = await leerGuardado(page, datos.nombre)
        return x?.ops?.planLog?.factores?.medios?.carga === 10 ? x : null
      })
      assert.ok(g, 'guardado con el ejercicio')
      assert.equal(g.unidades.find((u) => u.id === 'ag-torrez').logDatos.hombres, 1250)
      assert.equal(g.unidades.find((u) => u.id === 'i-cl5').tableroG4.frecuenciaH, 12)
      assert.equal(g.ops.zonasLog.filter((z) => z.origen === 'picb').length, 3)
      assert.deepEqual(a.errores, [])
      console.log(`OK ${tag}: globo de la instalación, tablero con gráficos (FT TORREZ), datos del oficial, a quién apoya, factores, IA proyectada en gráficos y ajustes, ${movil ? '' : 'acostar en la carta, '}imagen PNG, propuesta del ASDI con la PICB (en grande y al calco) y guardado.`)
    } catch (e) {
      console.error('ERRORES APP', a.errores)
      fs.writeFileSync(path.join(out, `fallo-${tag}.txt`), await page.locator('body').innerText().catch(() => ''))
      await page.screenshot({ path: path.join(out, `fallo-${tag}.png`), fullPage: true }).catch(() => {})
      throw e
    } finally {
      await a.cerrar()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
