// La hoja F2·P1 «Conceptos entrelazados» en la Mesa real (Chromium), con un ejercicio
// de unidades FICTICIAS (conceptos-ejercicio.js), en escritorio y en teléfono:
//   · la guía nueva y el panel de IA están (la versión anterior lo había sacado);
//   · 🌱 la aplicación ARMA la hoja con la orden superior, la organización de la
//     tarea, las fichas y las fases (no queda vacía);
//   · el pedido a la IA lleva el expediente, el formato, el nivel, la idea del
//     oficial, la información adicional y un .docx adjunto;
//   · la respuesta de la IA se aplica (unidades, fases, relaciones);
//   · se ven las láminas, baja el Word, se guarda con el ejercicio y se reabre;
//   · el texto narrativo de antes sigue guardado.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioConceptos, respuestaIA } = require('../conceptos-ejercicio.js')

const out = path.resolve(__dirname, '../salidas-conceptos')
fs.mkdirSync(out, { recursive: true })

// .docx mínimo (ZIP con word/document.xml comprimido), para probar el adjunto.
function docxMinimo(texto) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${texto
    .split('\n')
    .map((p) => `<w:p><w:r><w:t>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t></w:r></w:p>`)
    .join('')}</w:body></w:document>`
  const nombre = Buffer.from('word/document.xml')
  const crudo = Buffer.from(xml, 'utf8')
  const datos = zlib.deflateRawSync(crudo)
  const crc = (() => {
    let c = ~0
    for (const b of crudo) {
      c ^= b
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
    return ~c >>> 0
  })()
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt16LE(8, 8)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(datos.length, 18)
  local.writeUInt32LE(crudo.length, 22)
  local.writeUInt16LE(nombre.length, 26)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(20, 4)
  central.writeUInt16LE(20, 6)
  central.writeUInt16LE(8, 10)
  central.writeUInt32LE(crc, 16)
  central.writeUInt32LE(datos.length, 20)
  central.writeUInt32LE(crudo.length, 24)
  central.writeUInt16LE(nombre.length, 28)
  central.writeUInt32LE(0, 42)
  const cd = Buffer.concat([central, nombre])
  const inicioCd = local.length + nombre.length + datos.length
  const fin = Buffer.alloc(22)
  fin.writeUInt32LE(0x06054b50, 0)
  fin.writeUInt16LE(1, 8)
  fin.writeUInt16LE(1, 10)
  fin.writeUInt32LE(cd.length, 12)
  fin.writeUInt32LE(inicioCd, 16)
  return Buffer.concat([local, nombre, datos, cd, fin])
}

async function irALaHoja(page) {
  if (await page.getByText('🤖 Trabajar esta hoja con IA').count()) return
  await page.getByRole('button', { name: /G-3 Operaciones/ }).first().dispatchEvent('click')
  await page.getByRole('button', { name: '📄 Documentos', exact: true }).dispatchEvent('click')
  await page.getByRole('button', { name: /Analizar la misión/ }).first().dispatchEvent('click')
  await page.getByRole('button', { name: /F2·P1.*Conceptos entrelazados/ }).dispatchEvent('click')
  await page.getByText('🤖 Trabajar esta hoja con IA').waitFor({ timeout: 15000 })
}
const hojaGuardada = async (page, nombre, cond, ms = 8000) => {
  let g = null
  for (let t = 0; t < ms; t += 250) {
    g = await leerGuardado(page, nombre)
    if (cond(g?.g3?.entrelazados)) return g
    await page.waitForTimeout(250)
  }
  return g
}
async function guardar(page, nombre) {
  await page.getByRole('button', { name: new RegExp(`^📁 ${nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first().dispatchEvent('click')
  await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=g3' })
    const { page } = a
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioConceptos()
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      await irALaHoja(page)

      // Guía nueva y hoja vacía: se ve el formato en blanco del PMTD.
      assert.ok(await page.getByText(/Te ubica VERTICAL y HORIZONTALMENTE/).count(), 'guía nueva')
      assert.ok(await page.getByText(/todavía vacía/).count(), 'hoja vacía')

      // 🌱 La aplicación arma la hoja.
      await page.getByRole('button', { name: '🌱 Armar la hoja con lo del ejercicio' }).click()
      await page.getByText(/unidad\(es\) puestas/).waitFor()
      let g = await hojaGuardada(page, datos.nombre, () => true, 10)
      const nombres = await page.evaluate(() => [...document.querySelectorAll('summary')].map((s) => s.textContent))
      for (const n of ['I CUERPO DE EJÉRCITO (FICT.)', 'DIV.MEC.-1 (FICT.)', 'OD FT «GOLF»', 'RIM-1 «ALFA» (FICT.)', 'RA-1 «DELTA» (FICT.)', 'B.LOG.-1 «FOX» (FICT.)']) {
        assert.ok(nombres.some((s) => s.includes(n)), `armada: falta ${n} en ${JSON.stringify(nombres)}`)
      }
      assert.ok(await page.getByText(/3 de maniobra/).count() || (await page.getByText(/4 de maniobra/).count()), 'cuenta de maniobra')
      await page.screenshot({ path: path.join(out, `${tag}-armada.png`), fullPage: false })

      // Pedido a la IA con idea, información y un .docx adjunto.
      await page.getByRole('textbox', { name: 'Tu idea para esta hoja' }).fill('IDEA DEL OFICIAL: la OD la lleva la FT GOLF en la fase III.')
      await page.getByRole('textbox', { name: 'Orientaciones o información para esta hoja' }).fill('INFORMACIÓN ADICIONAL DE PRUEBA.')
      await page.locator('input[type=file][accept^=".docx"]').setInputFiles({ name: 'orientaciones.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: docxMinimo('ORIENTACIÓN DEL COMANDANTE (FICT.)\nSegundo párrafo.') })
      await page.getByText(/orientaciones\.docx/).waitFor()
      await page.getByRole('button', { name: '📋 Copiar el pedido' }).click()
      await page.getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 20000 })
      await page.getByRole('button', { name: /Ver el pedido/ }).click()
      const pedido = await page.getByRole('textbox', { name: 'Pedido a la IA' }).inputValue()
      for (const t of ['EXPEDIENTE DEL EJERCICIO', 'F2·P1 — CONCEPTOS ENTRELAZADOS', 'Mi unidad y mis unidades subordinadas', 'INFORMACIÓN ADICIONAL DE PRUEBA.', 'ORIENTACIÓN DEL COMANDANTE (FICT.)', 'ANTECEDENTE SIN ALTERAR (FICT.)', '"unidades"', 'Orden de operaciones (FICT.)']) assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
      assert.ok(pedido.trimEnd().endsWith('IDEA DEL OFICIAL: la OD la lleva la FT GOLF en la fase III.'), 'la idea va al final')

      // La respuesta de la IA se aplica.
      await page.getByRole('textbox', { name: 'Respuesta de la IA' }).fill('```json\n' + JSON.stringify(respuestaIA()) + '\n```')
      await page.getByRole('button', { name: '✓ Aplicar a la hoja' }).click()
      await page.getByText(/texto\(s\) completados/).waitFor()

      // Las láminas
      await page.getByRole('button', { name: '👁️ Ver la hoja' }).click()
      const velo = page.getByRole('dialog', { name: 'Hoja de conceptos entrelazados' })
      await velo.waitFor()
      assert.ok((await velo.locator('svg').count()) >= 3, 'maniobra, apoyo de combate y SPAC')
      const textoLaminas = await velo.locator('svg').allTextContents()
      for (const t of ['MANIOBRA', 'APOYO DE COMBATE', 'APOYO DE SERVICIO DE COMBATE', 'T F3:', 'PAF:', 'PE:', 'RESERVADO', 'CIA. COM.-1 (FICT.)']) assert.ok(textoLaminas.join(' ').includes(t), `las láminas no traen «${t}»`)
      await page.screenshot({ path: path.join(out, `${tag}-laminas.png`), fullPage: false })
      const descarga = page.waitForEvent('download')
      await velo.getByRole('button', { name: '📄 Word' }).click()
      const doc = await descarga
      assert.equal(doc.suggestedFilename(), 'F2P1_Conceptos_entrelazados.docx')
      await doc.saveAs(path.join(out, `${tag}.docx`))
      await velo.getByRole('button', { name: '✕ Cerrar' }).click()

      // Se guarda con el ejercicio y se reabre igual.
      await guardar(page, datos.nombre)
      g = await hojaGuardada(page, datos.nombre, (e) => e?.esquema === 'conceptos-v2' && (e.unidades || []).some((u) => /COM\.-1/.test(u.nombre)))
      const e = g.g3.entrelazados
      assert.equal(e.esquema, 'conceptos-v2')
      assert.equal(e['MISIONES DE LAS UNIDADES ADYACENTES'], 'ANTECEDENTE SIN ALTERAR (FICT.)')
      assert.equal(e.orientaciones.idea, 'IDEA DEL OFICIAL: la OD la lleva la FT GOLF en la fase III.')
      assert.equal(e.orientaciones.adjuntos[0].nombre, 'orientaciones.docx')
      assert.ok(e.orientaciones.adjuntos[0].texto.includes('ORIENTACIÓN DEL COMANDANTE (FICT.)'))
      const od = e.unidades.find((u) => u.rol === 'OD')
      assert.equal(od.nombre, 'FT «GOLF»')
      assert.ok(od.fases.some((f) => f.fase === 'F3' && f.esfuerzo && /Contraataca/.test(f.tarea)))
      assert.ok(e.unidades.some((u) => u.grupo === 'spac' && /FOX/.test(u.nombre) && u.tarea === 'Abastece y evacúa.'))
      assert.equal(e.unidades.filter((u) => u.grupo === 'superior1').length, 1)
      assert.ok(e.relaciones.length >= 5)
      await page.reload()
      await page.waitForTimeout(2500)
      await sembrarYAbrir(page, g)
      await irALaHoja(page)
      assert.ok((await page.evaluate(() => [...document.querySelectorAll('summary')].map((s) => s.textContent))).some((s) => s.includes('OD FT «GOLF»')), 'reabierta')
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: guía, armado automático, pedido con expediente/idea/información/.docx, respuesta aplicada, láminas, Word, guardar y reabrir.`)
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
