// 📜 La OGO completa con sus anexos (calcos/modalidad/ogo.js) en la Mesa real (Chromium), como está
// publicada (SIDECEME de mentira: servidor-falso.js). Lo pidió Sergio (11-10-2026): al terminar
// «Armar el ejercicio» tiene que salir la OGO completa con sus anexos, sin observaciones.
//   · el paso 10 «OGO completa con sus anexos» con los 13 documentos y el botón 📜 de arriba;
//   · los datos de la Orden salen de «Mesa · Preparación» (escalón superior, N°, alumnos…);
//   · 🤖 Pedido de la Orden: el modelo de la Escuela, las fichas y la Orden escrita de la Mesa;
//   · se pega lo que contestó la IA (fixtures/ogo-respuesta-ia.md) → «✓ completo»;
//   · el Anexo de Inteligencia incompleto → «⚠️ observaciones» con lo que falta y el pedido de
//     corrección, que lleva la Orden ya escrita;
//   · ⬇️ Word: el formato militar de la Mesa (el MISMO word.js), con el membrete y el título;
//     ⬇️ Todo en Word (.zip): un Word por documento escrito y el .md;
//   · ✅ Revisar todo: lo que falta escribir, los datos del membrete y lo que falta dibujar;
//   · 📎 Adjuntar al ejercicio: los documentos van al ejercicio (lo guarda SIDECEME) sin «PARA EL PROFESOR»;
//   · después de recargar, la OGO sigue (IndexedDB «sid-profesor-ogo»); sin errores de consola.
//   node calcos/pruebas/e2e/ogo.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso.js')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const JSZip = require('../../../jszip.min.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-ogo')
fs.mkdirSync(SALIDAS, { recursive: true })
const PANEL = '#sid-mod-panel'
const RESP = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'ogo-respuesta-ia.md'), 'utf8')
const ICIA = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'ogo-anexo-icia-incompleto.md'), 'utf8')

;(async () => {
  const datos = ejercicioFicticio({ conPlantilla: false })
  datos.nombre = 'FABBLE 1.1'
  datos.ordenSup = { numero: '01', escalonSuperior: 'FF.TT. «FICT»', unidad: 'C.E. 1', puestoMando: 'PATACAMAYA', vigencia: 'D-5 (0800)', clave: 'SMM', mision: 'El C.E. 1 defiende entre la LF. AZUL y la LF. VERDE…' }
  datos.unidades.push({ id: 'fict-rojo', bando: 'enemigo', tipo: 'unidad', designacion: 'VI EJ. (FICT.)', arma: 'mecanizada', escalon: 'ejercito', lat: -16.98, lng: -65.05, piezas: 3 })
  const calcos = [{ id: 'id-0', nombre: 'FABBLE 1.1', payload: datos, actualizado_en: new Date().toISOString() }]
  const log = []
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000, preparar: async (p) => { await servidorFalso(p, calcos, log) } })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const doc = (id) => `${PANEL} [data-ogo-doc="${id}"]`
  const profesor = async () => {
    await page.locator('#sid-mod-sel button[data-m=profesor]').dispatchEvent('click')
    await page.waitForTimeout(500)
    if (await page.locator(`${PANEL}.plegado`).count()) await page.locator(`${PANEL} .asa`).dispatchEvent('click')
    await page.locator(`${PANEL} select[data-escalon]`).selectOption('fftt')
    await page.locator(`${PANEL} select[data-foco]`).selectOption('g4')
  }
  const abrirDoc = async (id) => {
    if (!(await page.locator(`${doc(id)}.abierto`).count())) await page.locator(`${doc(id)} [data-a="ogo-pedido"]`).dispatchEvent('click')
    await page.waitForFunction(() => /RECORDATORIO/.test(document.querySelector('#sid-mod-panel textarea[data-ogo-pedido]')?.value || ''), null, { timeout: 8000 })
    return page.locator(`${PANEL} textarea[data-ogo-pedido]`).inputValue()
  }
  const pegar = async (id, txt) => {
    await page.locator(`${PANEL} textarea[data-ogo-resp="${id}"]`).fill(txt)
    await page.locator(`${doc(id)} [data-a="ogo-guardar"]`).dispatchEvent('click')
    await page.waitForFunction((i) => !!(window.SIDModalidad.ogo.docs || {})[i], id, { timeout: 5000 })
    await page.waitForTimeout(300)
  }
  const bajar = async (sel) => {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.locator(sel).dispatchEvent('click')])
    return { nombre: d.suggestedFilename(), buf: fs.readFileSync(await d.path()) }
  }
  const textoWord = async (buf) => { const z = await JSZip.loadAsync(buf); const xs = await Promise.all(Object.keys(z.files).filter((k) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(k)).map((k) => z.file(k).async('string'))); return xs.join(' ').replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '') }
  try {
    await abrirDelServidor(page, 'FABBLE 1.1')
    await page.waitForTimeout(1200)
    await profesor()

    // el paso 10 y el botón de arriba
    const paso = page.locator(`${PANEL} .paso`, { has: page.locator('#sid-ogo') })
    assert.equal(await paso.locator('.num').innerText(), '10')
    assert.match(await paso.locator('.nom').innerText(), /OGO completa con sus anexos/)
    assert.equal(await page.locator(`${PANEL} [data-ogo-doc]`).count(), 13)
    assert.match(await page.locator(`${PANEL} .ogo-btn`).innerText(), /📜 OGO completa con sus anexos · 0\/10/)
    await page.locator(`${PANEL} .ogo-btn`).dispatchEvent('click')
    await page.waitForTimeout(300)
    await foto('1-paso-ogo')

    // los datos de la Orden: lo vacío sale de «Mesa · Preparación» al armar el pedido
    const pOgo = await abrirDoc('ogo')
    assert.match(pOgo, /Documento 1 de 10:\*\* ORDEN DE OPERACIONES No\. 01/)
    assert.match(pOgo, /Expide:\*\* FF\.TT\. «FICT» · PC PATACAMAYA · D-5 \(0800\) · \*\*la reciben:\*\* C\.E\. 1/)
    assert.match(pOgo, /El modelo de la Escuela \(modelo de orden de operaciones\.md\)/)
    assert.match(pOgo, /Nombre: FABBLE 1\.1/); assert.match(pOgo, /ROJO · VI EJ\. \(FICT\.\)/); assert.match(pOgo, /El C\.E\. 1 defiende entre la LF\. AZUL/)
    await page.locator(`${PANEL} [data-a="ogo-copiar"]`).dispatchEvent('click').catch(() => {})
    await pegar('ogo', RESP)
    assert.match(await page.locator(`${doc('ogo')} .ogo-est`).innerText(), /✓ completo · 2 supuestos/)
    assert.match(await page.locator(`${doc('ogo')} .ogo-rev`).innerText(), /Tiene todos los apartados del modelo de la Escuela/)
    await foto('2-orden-completa')

    // el Anexo de Inteligencia incompleto: observaciones y pedido de corrección
    const pIcia = await abrirDoc('icia')
    assert.match(pIcia, /LA TAREA: ANEXO “B” \(Plan de Inteligencia \/ Inteligencia\) A LA ORDEN DE OPERACIONES No\. 01/)
    assert.match(pIcia, /#### ORDEN DE OPERACIONES No\. 01 \(el cuerpo de la Orden, ya escrito: MANDA\)[\s\S]*Las FF\.TT\. «FICT» defienden/)
    await pegar('icia', ICIA)
    assert.match(await page.locator(`${doc('icia')} .ogo-est`).innerText(), /⚠️ \d+ observaciones/)
    const obs = await page.locator(`${doc('icia')} .ogo-rev`).innerText()
    assert.match(obs, /Faltan apartados del modelo: C\.- Contrainteligencia/); assert.match(obs, /Apartados vacíos: Condiciones meteorológicas/); assert.match(obs, /CORTADA/)
    await foto('3-anexo-con-observaciones')
    await page.locator(`${doc('icia')} [data-a="ogo-corregir"]`).dispatchEvent('click')
    await page.waitForFunction(() => /PEDIDO DE CORRECCIÓN/.test(document.querySelector('#sid-mod-panel textarea[data-ogo-pedido]')?.value || ''), null, { timeout: 8000 })
    const pc = await page.locator(`${PANEL} textarea[data-ogo-pedido]`).inputValue()
    assert.match(pc, /FALTAN estos apartados del modelo: C\.- Contrainteligencia/); assert.match(pc, /### La Orden ya escrita/)

    // ⬇️ Word de la Orden: el formato militar de la Mesa
    const w = await bajar(`${doc('ogo')} [data-a="ogo-word"]`)
    assert.equal(w.nombre, 'ORDEN DE OPERACIONES No 01.docx')
    fs.writeFileSync(path.join(SALIDAS, 'e2e-' + w.nombre), w.buf)
    const tw = await textoWord(w.buf)
    for (const s of ['SECRETO', 'FF.TT. «FICT»', 'CG. PATACAMAYA D-5 (0800)', 'EMO/SEC-III', 'No. 001/SMM', 'ORDEN DE OPERACIONES No. 01', 'ORGANIZACIÓN DE LA TAREA:', 'Curso de acción más probable.', 'EL COMANDANTE DE LAS FF.TT. «FICT»', 'Autenticación:'])
      assert.ok(tw.includes(s), `el Word tiene «${s}»`)
    assert.ok(!tw.includes('PARA EL PROFESOR'))
    // ⬇️ Todo en Word (.zip)
    const zz = await bajar(`${PANEL} [data-a="ogo-zip"]`)
    assert.match(zz.nombre, /^ORDEN DE OPERACIONES No 01 - FABBLE 1\.1\.zip$/)
    const z = await JSZip.loadAsync(zz.buf)
    assert.deepEqual(Object.keys(z.files).sort(), ['00 ORDEN DE OPERACIONES No 01.docx', '01 Anexo B - Plan de Inteligencia.docx', 'OGO completa (texto, con lo PARA EL PROFESOR).md'])
    assert.match(await textoWord(await z.file('01 Anexo B - Plan de Inteligencia.docx').async('nodebuffer')), /ANEXO “B”[\s\S]*\(Plan de Inteligencia \/ Inteligencia\) A LA ORDEN DE OPERACIONES No\. 01/)
    assert.match(await page.locator(`${PANEL} .ogo .ia-aviso`).last().innerText(), /Bajados 2 Word con el formato militar \(faltan 8 documento\(s\) por escribir\)/)

    // ✅ Revisar todo
    await page.locator(`${PANEL} [data-a="ogo-revisar"]`).dispatchEvent('click')
    await page.waitForSelector(`${PANEL} .ogo-todo`, { timeout: 5000 })
    const rt = await page.locator(`${PANEL} .ogo-todo`).innerText()
    assert.match(rt, /1 de 10 documentos sin observaciones/)
    assert.match(rt, /falta: el escalón superior de tu unidad/); assert.match(rt, /no hay LÍMITES/); assert.match(rt, /Falta escribir: Anexo “A” — Calco de Operaciones/)
    await page.locator(`${PANEL} .ogo-todo`).scrollIntoViewIfNeeded()
    await foto('4-revisar-todo')

    // los datos del membrete se escriben en el tablero
    await page.locator(`${PANEL} [data-a="ogo-datos"]`).dispatchEvent('click')
    await page.locator(`${PANEL} input[data-ogo-cfg="superior"]`).fill('COMANDO EN JEFE (FICT.)')
    await page.locator(`${PANEL} input[data-ogo-cfg="superior"]`).dispatchEvent('change')
    await page.waitForFunction(() => window.SIDModalidad.ogo.config.superior === 'COMANDO EN JEFE (FICT.)', null, { timeout: 5000 })
    await foto('5-datos-de-la-orden')

    // 📎 al ejercicio: los ven los alumnos, sin «PARA EL PROFESOR»
    await page.locator(`${PANEL} [data-a="ogo-adjuntar"]`).dispatchEvent('click')
    await page.waitForFunction(() => (window.SIDMesaEjercicio.foto().documentos || []).length >= 2, null, { timeout: 8000 })
    const docs = await page.evaluate(() => window.SIDMesaEjercicio.foto().documentos.map((d) => [d.nombre, d.categoria, d.tipo]))
    assert.deepEqual(docs, [['ORDEN DE OPERACIONES No 01.md', 'orden', 'texto'], ['Anexo B - Plan de Inteligencia.md', 'anexoicia', 'texto']])
    await page.locator(`${PANEL} [data-a="ogo-adjuntar"]`).dispatchEvent('click') // otra vez: no se duplican
    await page.waitForTimeout(500)
    assert.equal(await page.evaluate(() => window.SIDMesaEjercicio.foto().documentos.length), 2, 'volver a adjuntar reemplaza')
    await page.locator('.sello-guardado').first().dispatchEvent('click')
    const t0 = Date.now()
    while (Date.now() - t0 < 15000 && !log.some((l) => l.accion === 'guardar' && (l.payload.documentos || []).length === 2)) await page.waitForTimeout(300)
    const g = log.filter((l) => l.accion === 'guardar' && (l.payload.documentos || []).length === 2).at(-1)
    assert.ok(g, 'el ejercicio se guardó en SIDECEME con los documentos de la OGO')
    const pl = JSON.stringify(g.payload)
    assert.match(pl, /Las FF\.TT\. «FICT» defienden a partir del D \(0500\)/)
    assert.doesNotMatch(pl, /Supuestos: el orden de batalla|PARA EL PROFESOR|sid-ogo-profesor/, 'la solución del profesor y la OGO guardada no viajan')

    // después de recargar, la OGO sigue
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
    await page.waitForTimeout(1500)
    const ok = page.getByRole('button', { name: /entendido/i })
    if (await ok.count()) await ok.first().click().catch(() => {})
    await abrirDelServidor(page, 'FABBLE 1.1')
    await profesor()
    await page.waitForFunction(() => Object.keys((window.SIDModalidad.ogo || {}).docs || {}).length === 2, null, { timeout: 8000 })
    assert.match(await page.locator(`${doc('ogo')} .ogo-est`).innerText(), /✓ completo/)
    assert.equal(await page.evaluate(() => window.SIDModalidad.ogo.config.superior), 'COMANDO EN JEFE (FICT.)')
    assert.match(await page.locator(`${PANEL} .ogo-btn`).innerText(), /· 2\/10/)

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('✔ OGO e2e: pedido con el modelo y la Mesa, respuesta completa ✓, anexo incompleto con observaciones y corrección, Word militar y .zip, revisión de la OGO, adjunta al ejercicio sin lo del profesor, sigue después de recargar')
  } catch (e) {
    await foto('ERROR').catch(() => {})
    console.error('errores de consola:', errores)
    throw e
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
