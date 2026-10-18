// 🎓 MODALIDAD (calcos/modalidad/) en la Mesa real (Chromium), escritorio y teléfono:
//   · el selector 🎖️ Mesa · 🎓 Aprendizaje · 🧑‍🏫 Profesor está arriba; con «Mesa» no hay tablero;
//   · Aprendizaje: tablero con las 7 fases; con Pandora la columna CMTE./G-x se esconde;
//     «Abrir» de F1·P6 abre el panel del Cmte. en la Guía Inicial; el de G-1 F2·P3 abre
//     📋 Mis hojas en las Tareas de Personal; el de G-3 F1·P1 abre 📄 Documentos en la Orden de
//     Alerta; marcar un paso lo guarda y queda después de recargar;
//   · Profesor: los pasos para armar el ejercicio y el escalón (CE → Divisiones);
//   · el título y la barra de avance del tablero no quedan tapados (en el teléfono, por el cartel
//     «🎖️ MESA · INSTRUCTOR» de la carta), en Aprendizaje y en Profesor;
//   · sin errores de consola. Sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioOrganizacion } = require('../organizacion-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-modalidad')
fs.mkdirSync(out, { recursive: true })
const SEL = '#sid-mod-sel', PANEL = '#sid-mod-panel'
const titulo = async (page, re) => (await page.locator('div, h3', { hasText: re }).count()) > 0
// el título y la barra de avance del tablero no quedan tapados por nada de la Mesa (en el teléfono el
// cartel «🎖️ MESA · INSTRUCTOR» de la carta le quedaba encima): lo que está en ese punto es del tablero
const aLaVista = (page) => page.evaluate(() => {
  const p = document.querySelector('#sid-mod-panel')
  return ['h2', '.total'].map((s) => {
    const el = p.querySelector(s), r = el.getBoundingClientRect(), x = r.left + Math.min(40, r.width / 2), y = r.top + r.height / 2
    const enc = document.elementFromPoint(x, y)
    return enc && p.contains(enc) ? '' : s + ' tapado por «' + ((enc && enc.textContent) || '').replace(/\s+/g, ' ').trim().slice(0, 50) + '»'
  }).filter(Boolean)
})

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
      assert.deepEqual(await aLaVista(page), [], 'el tablero de Aprendizaje se lee entero')
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
      // desde el 11-10-2026: 11 coherencia, 12 unidades que faltan, 13 repartir
      assert.equal(await page.locator(`${PANEL} .pasos.prof > .paso`).count(), 13)
      // después de recargar la Mesa abre su bienvenida (un diálogo) y despliega «🎖️ MESA · PREPARACIÓN»
      // (abajo, por encima del tablero a propósito): se cierran como lo haría el usuario
      const entendido = page.getByRole('button', { name: 'entendido' })
      if (await entendido.count()) { await entendido.first().dispatchEvent('click'); await page.waitForTimeout(200) }
      const ocultar = page.locator('button', { hasText: /^▼ ocultar$/ })
      if (await ocultar.count()) { await ocultar.first().dispatchEvent('click'); await page.waitForTimeout(300) }
      assert.deepEqual(await aLaVista(page), [], 'el tablero del Profesor se lee entero')
      assert.deepEqual(await page.locator(`${PANEL} .pasos.prof > .paso .num`).allInnerTexts(), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'], 'los números en orden (la OGO es el 10)')
      const pedidoOgo = async (id, re = /CONTEXTO DEL EJERCICIO/) => {
        const b = page.locator(`${PANEL} [data-ogo-doc="${id}"] [data-a="ogo-pedido"]`)
        if (!/▴/.test(await b.innerText())) await b.dispatchEvent('click')
        await page.waitForFunction((r) => new RegExp(r).test(document.querySelector('#sid-mod-panel textarea[data-ogo-pedido]')?.value || ''), re.source, { timeout: 8000 })
        return page.locator(`${PANEL} textarea[data-ogo-pedido]`).inputValue()
      }
      await page.locator(`${PANEL} select[data-escalon]`).selectOption('fftt')
      assert.ok(/Comandantes de Cuerpo de Ejército/.test(await page.locator(`${PANEL} .alumnos`).innerText()))
      await page.locator(`${PANEL} select[data-escalon]`).selectOption('ce')
      assert.ok(/Comandantes de División/.test(await page.locator(`${PANEL} .alumnos`).innerText()))
      assert.equal(await page.locator(`${PANEL} .sec-ir`).count(), 8)
      // el foco, el pedido a la IA (la OGO, documento por documento) y las organizaciones tipo
      await page.locator(`${PANEL} select[data-foco]`).selectOption('g2')
      assert.ok(/PICB entera/.test(await page.locator(`${PANEL} .foco-nota`).innerText()))
      assert.equal(await page.locator(`${PANEL} .ia-btn`).count(), 10, 'cada paso del profesor tiene su pedido a la IA (la OGO tiene uno por documento)')
      assert.equal(await page.locator(`${PANEL} [data-ogo-doc]`).count(), 13, 'la OGO y sus anexos, cada uno con su modelo')
      const pedido = await pedidoOgo('ogo')
      assert.ok(/LA TAREA: ORDEN DE OPERACIONES No\. 01/.test(pedido) && /Anexo “A” Calco de Operaciones/.test(pedido) && /Anexo “I” Plan de AC\/GM/.test(pedido) && /G-2 · Inteligencia/.test(pedido), 'la Orden con sus anexos y el foco')
      assert.ok(/El modelo de la Escuela \(modelo de orden de operaciones\.md\)/.test(pedido), 'con el modelo de la Escuela')
      assert.ok(/CONTEXTO DEL EJERCICIO/.test(pedido), 'lleva el contexto del ejercicio')
      assert.ok(/CAMPO QUE SE ENTRENA \(G-2/.test(await pedidoOgo('icia', /LA TAREA: ANEXO “B”/)), 'el Anexo de Inteligencia es el del campo que se entrena')
      assert.equal(await page.locator(`${PANEL} select[data-org] option`).count(), 6, 'FF.TT., C.E., D.I., D. Mec., Brigada y COE')
      await page.screenshot({ path: path.join(out, `profesor-ia-${tag}.png`) })
      await page.locator(`${PANEL} [data-a="ogo-cerrar"]`).dispatchEvent('click')

      if (!movil) { // con un ejercicio abierto: el pedido lleva el ejercicio y las organizaciones entran al calco
        await page.locator(`${SEL} button[data-m=mesa]`).dispatchEvent('click')
        const datos = ejercicioOrganizacion()
        await sembrarYAbrir(page, datos)
        await page.locator(`${SEL} button[data-m=profesor]`).dispatchEvent('click')
        await page.waitForTimeout(400)
        const antes = await page.evaluate(() => (window.SIDModalidad.puente.unidades || []).length)
        assert.equal(antes, datos.unidades.length, 'el puente trae las fichas del ejercicio')
        const conEj = await pedidoOgo('ogo', new RegExp('Nombre: ' + datos.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        assert.ok(conEj.includes('Nombre: ' + datos.nombre), 'el pedido lleva el ejercicio abierto (leído del IndexedDB)')
        assert.ok(/ROJO · BIM-431/.test(conEj) && /Orden del escalón superior|Misión escrita: \S/.test(conEj), 'con sus fichas y lo escrito')
        await page.locator(`${PANEL} [data-a="ogo-cerrar"]`).dispatchEvent('click')
        await page.locator(`${PANEL} select[data-org]`).selectOption('di')
        await page.locator(`${PANEL} input[name=sid-org-bando][value=enemigas]`).dispatchEvent('click')
        await page.locator(`${PANEL} input[data-org-num]`).fill('7')
        await page.locator(`${PANEL} [data-a="org-insertar"]`).dispatchEvent('click')
        await page.waitForTimeout(600)
        const despues = await page.evaluate(() => (window.SIDModalidad.puente.unidades || []).map((u) => u.designacion + '|' + u.bando))
        assert.equal(despues.length, antes + 10, 'la División ROJO entró al calco: ' + despues.length)
        assert.ok(despues.includes('Cmdo. D.I. 7|enemigas') && despues.includes('Br. I. 71|enemigas'))
        assert.ok(/10 fichas insertadas/.test(await page.locator(`${PANEL} .org .ia-aviso`).innerText()))
        await page.locator(`${PANEL} [data-a="org-pegar"]`).dispatchEvent('click')
        await page.locator(`${PANEL} textarea[data-org-json]`).fill('```json\n[{"designacion":"D. Mec. 3","bando":"propio","arma":"mecanizada","escalon":"division","lat":-16.9,"lng":-68.3}]\n```')
        await page.locator(`${PANEL} [data-a="org-pegar-ok"]`).dispatchEvent('click')
        await page.waitForTimeout(600)
        assert.equal(await page.evaluate(() => (window.SIDModalidad.puente.unidades || []).length), antes + 11, 'la ficha de la IA entró')
        await page.screenshot({ path: path.join(out, `profesor-unidades-${tag}.png`) })

        // 📚 la biblioteca: un .zip con dos COE reales → dos Divisiones; una a la carta; entra al pedido
        const JSZip = require('../../../jszip.min.js')
        const z = new JSZip()
        z.file('COE/APENDICE_19_COE_DIV_MEC-1.docx', fs.readFileSync(path.join(__dirname, '../fixtures/coe-div-mec-1.docx')))
        z.file('COE/APENDICE_7_COE_DIV-1.docx', fs.readFileSync(path.join(__dirname, '../fixtures/coe-div-1.docx')))
        z.file('__MACOSX/._basura.docx', 'x')
        const zipPath = path.join(out, 'coe-prueba.zip')
        fs.writeFileSync(zipPath, await z.generateAsync({ type: 'nodebuffer' }))
        await page.locator(`${PANEL} .bib-btn`).dispatchEvent('click')
        await page.locator(`${PANEL} input[data-bib-archivo]`).setInputFiles([{ name: 'COE_DIAMANTE.zip', mimeType: 'application/zip', buffer: fs.readFileSync(zipPath) }, { name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('ARMAMENTO DE RAGNAR: Leopard 2A4') }])
        await page.waitForFunction(() => (window.SIDModalidad.biblioteca || []).length === 3, null, { timeout: 15000 })
        fs.unlinkSync(zipPath)
        assert.match(await page.locator(`${PANEL} .bib`).innerText(), /DIV MEC-1 · 13 unidades · 3\.?805 H/)
        assert.equal(await page.locator(`${PANEL} .bib-lista li`).count(), 3)
        const antesCOE = await page.evaluate(() => window.SIDModalidad.puente.unidades.length)
        await page.locator(`${PANEL} .bib-lista li`, { hasText: 'DIV MEC-1' }).locator('[data-a="bib-insertar"]').dispatchEvent('click')
        await page.waitForTimeout(500)
        const conCOE = await page.evaluate(() => window.SIDModalidad.puente.unidades.map((u) => u.designacion))
        assert.equal(conCOE.length, antesCOE + 12, 'la DIV MEC-1 entró con sus 12 fichas')
        assert.ok(conCOE.includes('Cmdo. DIV MEC-1') && conCOE.includes('RIAT-30 (DIV MEC-1)'))
        await page.screenshot({ path: path.join(out, `profesor-biblioteca-${tag}.png`) })
        await page.locator(`${PANEL} [data-ogo-doc="ogo"] [data-a="ogo-pedido"]`).dispatchEvent('click')
        await page.waitForFunction(() => /Biblioteca del profesor/.test(document.querySelector('#sid-mod-panel textarea[data-ogo-pedido]')?.value || ''), null, { timeout: 8000 })
        const conBib = await page.locator(`${PANEL} textarea[data-ogo-pedido]`).inputValue()
        assert.ok(/COE de la DIV MEC-1 — efectivo total 3805/.test(conBib) && /COE de la DIV-1/.test(conBib) && /Leopard 2A4/.test(conBib), 'la biblioteca entra en el pedido')
        await page.locator(`${PANEL} [data-a="ogo-cerrar"]`).dispatchEvent('click')
        // queda después de recargar (IndexedDB)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => (window.SIDModalidad?.biblioteca || []).length === 3, null, { timeout: 15000 })
      }
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
