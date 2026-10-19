// 📄 El Anexo de Apoyo de Servicio de Combate del G-4 (🎬 Concepto → «📄 Anexo de Apoyo de Servicio de
// Combate (.docx)») en la Mesa real (Chromium), con el ejercicio FICTICIO de logística (18-10-2026):
//   · con el número de la Orden en el título, baja DIRECTO, sin el diálogo «Revisar formato del
//     documento»: ANEXO “F” (APOYO DE SERVICIO DE COMBATE) A LA ORDEN GENERAL DE OPERACIONES No. 3 y la
//     distribución con la unidad superior (nunca «[Unidad superior pendiente]»);
//   · sin el número, el diálogo aparece ya lleno —letra, asunto, distribución y CADA contenido con su
//     apartado del modelo (ninguno en «Seleccione apartado»)—: con escribir «24» en el padre, el DOCX
//     sale con la ORDEN GENERAL DE OPERACIONES No. 24 y la ORGANIZACIÓN DE LA TAREA sin numerar.
// Sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioLogistica } = require('../logistica-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-word-anexo-g4')
fs.mkdirSync(out, { recursive: true })
async function textoDocx(ruta) {
  const z = await JSZip.loadAsync(fs.readFileSync(ruta))
  return (await z.file('word/document.xml').async('string')).replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
}
async function anexo(numero) {
  const a = await abrir({ ancho: 1600, alto: 1100, movil: false })
  const { page } = a
  page.on('dialog', (d) => d.accept())
  try {
    await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
    const ej = ejercicioLogistica({ conPropuestas: true })
    ej.ordenSup = { ...(ej.ordenSup || {}), escalonSuperior: 'CE-I (FICT.)', numero }
    await sembrarYAbrir(page, ej)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await page.locator('.botones-mapa > button', { hasText: 'G-4' }).first().dispatchEvent('click')
    await page.waitForTimeout(800)
    await page.locator('button', { hasText: /^\W*Concepto$/ }).first().dispatchEvent('click')
    await page.waitForTimeout(500)
    const dl = page.waitForEvent('download', { timeout: 20000 })
    await page.locator('button', { hasText: 'Anexo de Apoyo de Servicio de Combate (.docx)' }).first().dispatchEvent('click')
    return { a, page, dl }
  } catch (e) {
    await a.cerrar()
    throw e
  }
}

;(async () => {
  // 1) con el número de la Orden: directo
  {
    const { a, page, dl } = await anexo('3')
    try {
      const d = await dl
      assert.equal(await page.locator('dialog.sid-militar').count(), 0, 'sin el diálogo')
      const f = path.join(out, 'anexo-directo.docx')
      await d.saveAs(f)
      const x = await textoDocx(f)
      assert.match(x, /ANEXO “F”\t\(APOYO DE SERVICIO DE COMBATE\) A LA ORDEN GENERAL DE OPERACIONES No\. 3/)
      assert.match(x, /Original\t:\tCE-I \(FICT\.\)/)
      assert.ok(!x.includes('[Unidad superior pendiente]'))
      assert.deepEqual(a.errores, [], 'sin errores de consola')
    } finally {
      await a.cerrar()
    }
  }
  // 2) sin el número: el diálogo, ya lleno
  {
    const { a, page, dl } = await anexo('')
    try {
      const dlg = page.locator('dialog.sid-militar')
      await dlg.waitFor({ timeout: 10000 })
      const v = await dlg.evaluate((d) => ({
        campos: Object.fromEntries([...d.querySelectorAll('[name]')].map((x) => [x.name, x.value])),
        items: [...d.querySelectorAll('select[data-item]')].map((s) => [s.parentElement.firstChild.textContent, s.value]),
      }))
      assert.equal(v.campos.identificador, 'F', 'la letra del anexo en la OGO de la Mesa')
      assert.equal(v.campos.asunto, 'APOYO DE SERVICIO DE COMBATE')
      assert.match(v.campos.distribucion, /^Original: CE-I \(FICT\.\)/)
      assert.ok(v.items.length >= 10, 'los contenidos del anexo: ' + v.items.length)
      assert.deepEqual(v.items.filter((x) => !x[1]), [], 'ninguno en «Seleccione apartado»')
      assert.equal(v.items.find((x) => /^Organización de la Tarea/.test(x[0]))[1], '§org')
      assert.equal(v.items.find((x) => /Fase 1/.test(x[0]))[1], 'EJECUCIÓN. / Concepto de Apoyo.')
      await dlg.locator('details').nth(1).evaluate((x) => (x.open = true))
      await dlg.screenshot({ path: path.join(out, 'dialogo.png') })
      await dlg.locator('[name=padreTitulo]').fill('24')
      await dlg.locator('[data-action="exportar"]').click()
      const f = path.join(out, 'anexo-dialogo.docx')
      await (await dl).saveAs(f)
      const x = await textoDocx(f)
      assert.match(x, /A LA ORDEN GENERAL DE OPERACIONES No\. 24/, '«24» es la OGO No. 24')
      assert.match(x, /ORGANIZACIÓN DE LA TAREA\.\nÁreas establecidas:\n[^\n]*\nSITUACIÓN\./, 'la Organización de la Tarea, antes de SITUACIÓN')
      assert.match(x, /Funciones Logísticas\.\nMantenimiento\./, '«Mantenimiento.» dentro de Funciones Logísticas, con su título')
      assert.deepEqual(a.errores, [], 'sin errores de consola')
    } finally {
      await a.cerrar()
    }
  }
  console.log('word-anexo-g4 e2e OK — directo con el número de la Orden; sin él, el diálogo lleno y el DOCX con la OGO No. 24')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
