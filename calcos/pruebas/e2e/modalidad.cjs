// 🎓 MODALIDAD (calcos/modalidad/) en la Mesa real (Chromium), escritorio y teléfono:
//   · el selector 🎖️ Mesa · 🎓 Aprendizaje · 🧑‍🏫 Profesor está arriba; con «Mesa» no hay tablero;
//   · Aprendizaje: tablero con las 7 fases; con Pandora la columna CMTE./G-x se esconde;
//     «Abrir» de F1·P6 abre el panel del Cmte. en la Guía Inicial; el de G-1 F2·P3 abre
//     📋 Mis hojas en las Tareas de Personal; el de G-3 F1·P1 abre 📄 Documentos en la Orden de
//     Alerta; marcar un paso lo guarda y queda después de recargar;
//   · Profesor: los pasos para armar el ejercicio y el escalón (CE → Divisiones);
//   · sin errores de consola. Sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')

const out = path.resolve(__dirname, '../salidas-modalidad')
fs.mkdirSync(out, { recursive: true })
const SEL = '#sid-mod-sel', PANEL = '#sid-mod-panel'
const titulo = async (page, re) => (await page.locator('div, h3', { hasText: re }).count()) > 0

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1600, alto: movil ? 844 : 1000, movil })
    const { page, errores } = a
    page.on('dialog', (d) => d.accept())
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await page.waitForSelector(SEL, { timeout: 15000 })
      assert.equal(await page.locator(`${SEL} button`).count(), 3)
      assert.equal(await page.evaluate(() => window.SIDModalidad.modo), 'mesa')
      assert.equal(await page.locator(PANEL).isVisible(), false, 'con «Mesa» no hay tablero')

      // Aprendizaje
      await page.locator(`${SEL} button[data-m=aprendizaje]`).dispatchEvent('click')
      await page.waitForTimeout(300)
      assert.equal(await page.evaluate(() => document.body.getAttribute('data-sid-modo')), 'aprendizaje')
      assert.ok(await page.locator(PANEL).isVisible())
      assert.equal(await page.locator(`${PANEL} .fase`).count(), 7)
      assert.ok(/0 \/ 50 pasos/.test(await page.locator(`${PANEL} .total`).innerText()))
      if (!movil && (await page.evaluate(() => document.body.classList.contains('sid-pandora')))) {
        const g1 = page.locator('.botones-mapa > button', { hasText: /G-1/ }).first()
        assert.equal(await g1.isVisible(), false, 'con Pandora la columna de la derecha se esconde')
      }
      await page.screenshot({ path: path.join(out, `aprendizaje-${tag}.png`) })

      // F1·P6 → Cmte. Guía Inicial
      await page.locator(`${PANEL} .ir[data-f="1"][data-n="6"]`).first().dispatchEvent('click')
      await page.waitForTimeout(1500)
      assert.ok(await titulo(page, /F1·P6\s*Guía Inicial del Comandante/), 'se abrió la Guía Inicial del Cmte.')
      await page.screenshot({ path: path.join(out, `cmte-f1p6-${tag}.png`) })

      // F2·P3 → G-1 📋 Mis hojas, Tareas de Personal
      assert.ok(await page.locator(`${PANEL}.plegado`).count(), 'el tablero se plegó al abrir la hoja')
      await page.locator(`${PANEL} .asa`).dispatchEvent('click')
      await page.locator(`${PANEL} .fcab[data-fase="2"]`).dispatchEvent('click')
      await page.locator(`${PANEL} .ir[data-f="2"][data-n="3"]`).first().dispatchEvent('click')
      await page.waitForTimeout(2500)
      assert.ok(await titulo(page, /F2·P3\s*Tareas específicas, implícitas y esenciales de PERSONAL/), 'se abrió la hoja de Tareas del G-1')
      await page.screenshot({ path: path.join(out, `g1-f2p3-${tag}.png`) })

      // F1·P1 → G-3 📄 Documentos, Orden de Alerta
      assert.ok(await page.locator(`${PANEL}.plegado`).count(), 'el tablero se plegó al abrir la hoja')
      await page.locator(`${PANEL} .asa`).dispatchEvent('click')
      await page.locator(`${PANEL} .fcab[data-fase="1"]`).dispatchEvent('click')
      await page.locator(`${PANEL} .ir[data-f="1"][data-n="1"]`).first().dispatchEvent('click')
      await page.waitForTimeout(2500)
      assert.ok(await titulo(page, /F1·P1\s*Orden de Alerta/), 'se abrió la Orden de Alerta del G-3')
      await page.screenshot({ path: path.join(out, `g3-f1p1-${tag}.png`) })

      // marcar un paso y recargar
      assert.ok(await page.locator(`${PANEL}.plegado`).count(), 'el tablero se plegó al abrir la hoja')
      await page.locator(`${PANEL} .asa`).dispatchEvent('click')
      await page.locator(`${PANEL} input[data-f="1"][data-n="1"]`).dispatchEvent('click')
      await page.waitForTimeout(200)
      assert.ok(/1 \/ 50 pasos/.test(await page.locator(`${PANEL} .total`).innerText()))
      assert.ok(/Siguiente: F1·P2/.test(await page.locator(`${PANEL} .sig`).innerText()))
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector(PANEL, { timeout: 15000 })
      await page.waitForTimeout(800)
      assert.equal(await page.evaluate(() => window.SIDModalidad.modo), 'aprendizaje', 'la modalidad se recuerda')
      assert.ok(await page.locator(`${PANEL} input[data-f="1"][data-n="1"]`).isChecked(), 'lo marcado queda')

      // Profesor
      await page.locator(`${SEL} button[data-m=profesor]`).dispatchEvent('click')
      await page.waitForTimeout(300)
      assert.equal(await page.locator(`${PANEL} .pasos.prof > .paso`).count(), 9)
      await page.locator(`${PANEL} select[data-escalon]`).selectOption('fftt')
      assert.ok(/Comandantes de Cuerpo de Ejército/.test(await page.locator(`${PANEL} .alumnos`).innerText()))
      await page.locator(`${PANEL} select[data-escalon]`).selectOption('ce')
      assert.ok(/Comandantes de División/.test(await page.locator(`${PANEL} .alumnos`).innerText()))
      assert.equal(await page.locator(`${PANEL} .sec-ir`).count(), 8)
      await page.screenshot({ path: path.join(out, `profesor-${tag}.png`) })

      // vuelta a la Mesa
      await page.locator(`${SEL} button[data-m=mesa]`).dispatchEvent('click')
      await page.waitForTimeout(200)
      assert.equal(await page.locator(PANEL).isVisible(), false)
      assert.deepEqual(errores, [], 'sin errores de consola')
      console.log(`modalidad e2e ${tag} OK`)
    } catch (e) {
      await page.screenshot({ path: path.join(out, `ERROR-${tag}.png`) }).catch(() => {})
      console.error('errores de consola:', errores)
      throw e
    } finally {
      await a.cerrar()
    }
  }
})()
