// La hoja F2·P1 «Conceptos entrelazados» (v3) en la Mesa real (Chromium), con un
// ejercicio de unidades FICTICIAS (conceptos-ejercicio.js), en escritorio y en teléfono:
//   · la guía y el panel de IA están;
//   · 🧩 con la opción «FT / agrupaciones» la aplicación ARMA la hoja: la cadena de mando
//     CTO → FF.TT.T.O. → CE → División y debajo las FT, con la orden superior, la
//     organización de la tarea, las fichas y las fases;
//   · el pedido a la IA lleva el expediente, el formato, el nivel, la idea del
//     oficial, la información adicional y un .docx adjunto;
//   · la respuesta de la IA se aplica (unidades, fases, relaciones);
//   · se ven las láminas, baja el Word, se guarda con el ejercicio y se reabre;
//   · el texto narrativo de antes sigue guardado;
// y, en escritorio, el caso del docente (conceptos-divmec.js): 🪖 «Unidades puras» con
// la DIVMEC-1 (XX) debajo del CE (XXX), sus 12 unidades debajo de ella, y una respuesta
// de IA equivocada que la Mesa acomoda.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioConceptos, respuestaIA } = require('../conceptos-ejercicio.js')
const { ejercicioDivmec, respuestaIAEquivocada } = require('../conceptos-divmec.js')

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

      // 🧩 Opción «FT / agrupaciones»: con la hoja vacía, la aplicación la arma.
      await page.getByRole('button', { name: /FT \/ agrupaciones tácticas/ }).click()
      await page.getByText(/unidad\(es\) puestas/).waitFor()
      let g = await hojaGuardada(page, datos.nombre, () => true, 10)
      const nombres = await page.evaluate(() => [...document.querySelectorAll('summary')].map((s) => s.textContent))
      for (const n of ['Comando del Teatro de Operaciones (XXXXX)', '(XXXX)', 'I CUERPO DE EJÉRCITO (FICT.) (XXX)', 'DIV.MEC.-1 (FICT.) (XX) · PROPIA', 'OD FT «GOLF»', 'RIM-1 «ALFA» (FICT.)', 'RA-1 «DELTA» (FICT.)', 'B.LOG.-1 «FOX» (FICT.)']) {
        assert.ok(nombres.some((s) => s.includes(n)), `armada: falta ${n} en ${JSON.stringify(nombres)}`)
      }
      assert.ok(await page.getByText(/Cadena de mando: .*\(XXXXX\) → .*\(XXXX\) → .*\(XXX\) → DIV\.MEC\.-1 \(FICT\.\) \(XX\)/).count(), 'la cadena de mando a la vista')
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
      for (const t of ['EXPEDIENTE DEL EJERCICIO', 'F2·P1 — CONCEPTOS ENTRELAZADOS', 'FT / agrupaciones tácticas', 'LA JERARQUÍA', 'LO QUE YA IDENTIFICÓ LA MESA', 'INFORMACIÓN ADICIONAL DE PRUEBA.', 'ORIENTACIÓN DEL COMANDANTE (FICT.)', 'ANTECEDENTE SIN ALTERAR (FICT.)', '"unidades"', 'Orden de operaciones (FICT.)']) assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
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
      g = await hojaGuardada(page, datos.nombre, (e) => e?.esquema === 'conceptos-v3' && (e.unidades || []).some((u) => /COM\.-1/.test(u.nombre)))
      const e = g.g3.entrelazados
      assert.equal(e.esquema, 'conceptos-v3')
      assert.equal(e.enfoque, 'ft')
      assert.equal(e['MISIONES DE LAS UNIDADES ADYACENTES'], 'ANTECEDENTE SIN ALTERAR (FICT.)')
      assert.equal(e.orientaciones.idea, 'IDEA DEL OFICIAL: la OD la lleva la FT GOLF en la fase III.')
      assert.equal(e.orientaciones.adjuntos[0].nombre, 'orientaciones.docx')
      assert.ok(e.orientaciones.adjuntos[0].texto.includes('ORIENTACIÓN DEL COMANDANTE (FICT.)'))
      const od = e.unidades.find((u) => u.rol === 'OD')
      assert.equal(od.nombre, 'FT «GOLF»')
      assert.ok(od.fases.some((f) => f.fase === 'F3' && f.esfuerzo && /Contraataca/.test(f.tarea)))
      assert.ok(e.unidades.some((u) => u.grupo === 'spac' && /FOX/.test(u.nombre) && u.tarea === 'Abastece y evacúa.'))
      assert.equal(e.unidades.filter((u) => u.propia).length, 1)
      assert.equal(e.unidades.find((u) => u.propia).grupo, 'superior')
      assert.deepEqual(e.unidades.filter((u) => u.grupo === 'superior').map((u) => u.magnitud), ['XXXXX', 'XXXX', 'XXX', 'XX'])
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

  // El caso del docente: 🪖 «Unidades puras», la División arriba y sus unidades debajo.
  const a = await abrir({ ancho: 1440, alto: 1000, consulta: '?puesto=g3' })
  const { page } = a
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioDivmec()
  try {
    await sembrarYAbrir(page, datos)
    await irALaHoja(page)
    await page.getByRole('button', { name: /Unidades puras/ }).click()
    await page.getByText(/unidad\(es\) puestas/).waitFor()
    assert.ok(await page.getByText(/Cadena de mando: Comando del Teatro de Operaciones \(XXXXX\) → Comando de las Fuerzas Terrestres del Teatro de Operaciones \(XXXX\) → I CUERPO DE EJÉRCITO \(XXX\) → DIVMEC-1 \(XX\)/).count(), 'cadena de mando del caso del docente')
    const nombres = await page.evaluate(() => [...document.querySelectorAll('summary')].map((s) => s.textContent))
    for (const n of ['DIVMEC-1 (XX) · PROPIA', 'RCB-1 «ALFA» (III)', 'RIAT-30 «ECO» (III)', 'RAA-6 «GOLF» (III)', 'COMP. ICIA.-I «KILO» (I)', 'Comp. Av. Ejto. «LIMA» (I)', 'BAT. LOG.-I «INDIA» (II)']) assert.ok(nombres.some((x) => x.includes(n)), `puras: falta ${n}`)
    assert.ok(!nombres.some((x) => /DIVMEC-2|Comp\. Inf\. Mec/.test(x)), 'ni la adyacente ni la subunidad suelta')
    // La IA que se equivoca como en el Word: la Mesa la acomoda y avisa.
    await page.getByRole('textbox', { name: 'Respuesta de la IA' }).fill(JSON.stringify(respuestaIAEquivocada()))
    await page.getByRole('button', { name: '✓ Aplicar a la hoja' }).click()
    await page.getByText(/La Mesa acomodó/).waitFor()
    await page.getByRole('button', { name: '👁️ Ver la hoja' }).click()
    const velo = page.getByRole('dialog', { name: 'Hoja de conceptos entrelazados' })
    await velo.waitFor()
    const t = (await velo.locator('svg').first().textContent()) || ''
    for (const x of ['XXXXX', 'CTO', 'XXXX', 'FF.TT.T.O.', 'XXX', 'CE', 'XX', 'DIVMEC-1', '(UNIDAD PROPIA)', 'RCB-1 «ALFA»', 'OD']) assert.ok(t.includes(x), `lámina sin «${x}»`)
    await page.screenshot({ path: path.join(out, 'divmec-puras.png'), fullPage: false })
    const descarga = page.waitForEvent('download')
    await velo.getByRole('button', { name: '📄 Word' }).click()
    await (await descarga).saveAs(path.join(out, 'divmec-puras.docx'))
    await velo.getByRole('button', { name: '✕ Cerrar' }).click()
    await guardar(page, datos.nombre)
    const g = await hojaGuardada(page, datos.nombre, (e) => e?.esquema === 'conceptos-v3' && (e.unidades || []).some((u) => u.rol === 'OD'))
    const e = g.g3.entrelazados
    assert.equal(e.enfoque, 'puras')
    assert.deepEqual(e.unidades.filter((u) => u.grupo === 'superior').map((u) => [u.magnitud, u.nombre]), [['XXXXX', 'Comando del Teatro de Operaciones'], ['XXXX', 'Comando de las Fuerzas Terrestres del Teatro de Operaciones'], ['XXX', 'I CUERPO DE EJÉRCITO'], ['XX', 'DIVMEC-1']])
    assert.ok(e.unidades.find((u) => u.nombre === 'DIVMEC-1').propia)
    assert.ok(!e.unidades.some((u) => u.grupo !== 'superior' && /DIV/.test(u.nombre)), 'ninguna división en las filas')
    assert.deepEqual(a.errores, [])
    console.log('OK caso del docente: unidades puras con la cadena CTO → FF.TT.T.O. → CE → DIVMEC-1, respuesta de IA equivocada acomodada, lámina, Word y guardado.')
  } catch (e) {
    console.error('ERRORES APP', a.errores)
    fs.writeFileSync(path.join(out, 'fallo-divmec.txt'), await page.locator('body').innerText().catch(() => ''))
    await page.screenshot({ path: path.join(out, 'fallo-divmec.png'), fullPage: true }).catch(() => {})
    throw e
  } finally {
    await a.cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
