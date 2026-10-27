// 📋 La F1·P6 «Guía Inicial del Comandante» en la Mesa real (Chromium), escritorio y teléfono (index-guia-inicial-20261027.js):
//   · en ⭐ CMTE. → Mis hojas la F1·P6 tiene los siete apartados del PMTD 2017 (ya no la tabla Área / Guía / Para cuándo);
//   · 📘 la guía y 🌱 llenan los siete con la Línea de Tiempo, la Orden y la organización de la tarea, y el renglón de
//     la tabla vieja pasa a TAREAS ADICIONALES; lo escrito queda en la hoja del G-3 (es la MISMA);
//   · el pedido a la IA lleva la guía del PMTD;
//   · el Word militar: los siete apartados llenos, el tiempo en el orden del modelo, la distribución sólo al Estado
//     Mayor y sin «Autenticación» ni «UU. DEP.».
// Ejercicio FICTICIO, sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioDivmec } = require('../conceptos-divmec.js')

const out = path.resolve(__dirname, '../salidas-guia-inicial')
fs.mkdirSync(out, { recursive: true })
const CAMPOS = ['I.- MÉTODO', 'II.- ASIGNACIÓN INICIAL DEL TIEMPO', 'III.- OFICIALES DE ENLACE', 'IV.- RECONOCIMIENTO INICIAL', 'V.- MOVIMIENTOS', 'VI.- TAREAS ADICIONALES', 'VII.- OTROS']

function ejercicio() {
  const e = ejercicioDivmec()
  e.nombre = 'PRUEBA GUÍA INICIAL (FICT.)'
  e.ordenSup.unidad = 'DIVMEC-1'
  e.ordenSup.clasificacion = 'SECRETO'
  e.ops.unidadConsiderada = { nombre: 'DIVMEC-1', escalon: 'division', confirmada: true }
  e.ordenSup.coordinacion = 'Las unidades ocuparán la NZR. PUEBLO-Z (FICT.) no más tarde del D-5 (1800).'
  e.g3 = { lineaTiempo: { recepcion: 'D-44 (0900)', inicioOperacion: 'D (0400)', finOperaciones: 'D+15 (1800)', inicioMovimientos: 'D-10 (0600)' } }
  // La F1·P6 de antes (la tabla): su renglón no se pierde.
  e.hojasG = { cmte: { guiaInicial: [{ 'Área / Sección': 'G-4', 'Guía impartida': 'Prever el combustible para el movimiento (FICT.)', 'Para cuándo': 'D-40' }] } }
  return e
}

const textoXml = (xml) => xml.replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=cmte' })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, ejercicio())
      await page.getByRole('button', { name: '⭐ CMTE.' }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /F1·P6\s*Guía Inicial del Comandante/ }).dispatchEvent('click')
      await page.getByRole('button', { name: '← Volver a mis hojas' }).waitFor({ timeout: 15000 })
      for (const c of CAMPOS) assert.ok(await page.getByText(c).count(), `falta el apartado «${c}»`)
      assert.equal(await page.getByText('Área / Sección', { exact: true }).count(), 0, 'ya no es la tabla Área / Guía / Para cuándo')
      await page.getByText('📤 SE DIFUNDE SÓLO AL ESTADO MAYOR').waitFor({ timeout: 5000 })

      // 📘 la guía
      await page.getByRole('button', { name: /📘 ¿Para qué es y cómo se llena\?/ }).dispatchEvent('click')
      await page.getByText(/la CLASE de planeamiento \(deliberado o en tiempo restringido\)/).waitFor({ timeout: 5000 })

      // 🌱
      await page.getByRole('button', { name: '🌱 Traer del calco y de la Línea de Tiempo lo que falte' }).dispatchEvent('click')
      await page.getByText(/7 apartados llenados \(sólo los que estaban vacíos\)/).waitFor({ timeout: 10000 })
      await page.waitForTimeout(400)
      const v = (await page.locator('textarea:not([readonly])').evaluateAll((xs) => xs.map((x) => x.value))).join('\n')
      for (const t of ['planeamiento DELIBERADO', 'forma PARALELA', 'La línea de tiempo inicial para la operación es la siguiente:', '- Tiempo para preparar (2/3): 29 días, 4 horas y 40 min, del D-30 (2320) al D (0400).', 'Ante el I CUERPO DE EJÉRCITO', 'Comp. Av. Ejto. «LIMA» (BAJO CONTROL)', 'sólo está autorizado el reconocimiento en la carta', 'NZR. PUEBLO-Z (FICT.)', 'El G-3 enviará la Orden Preparatoria N° 1', 'G-4: Prever el combustible para el movimiento (FICT.) (para el D-40).', 'clasificación SECRETO'])
        assert.ok(v.includes(t), `la hoja no trae «${t}»`)
      await page.screenshot({ path: path.join(out, `${tag}-1-f1p6.png`), fullPage: false })

      // Es la MISMA hoja que la del G-3 (compartida).
      const g3 = await estadoReact(page, (s) => (s && !Array.isArray(s) && s.lineaTiempo && s.guiaInicial ? s.guiaInicial['I.- MÉTODO'] || null : undefined))
      assert.match(String(g3), /planeamiento DELIBERADO/, 'lo de la F1·P6 queda en la hoja del G-3')

      // 🤖 el pedido lleva la guía del PMTD.
      await page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first().dispatchEvent('click')
      await page.getByRole('button', { name: 'Completar y mejorar' }).dispatchEvent('click')
      await page.getByRole('button', { name: '📋 Copiar el pedido' }).dispatchEvent('click')
      await page.waitForTimeout(800)
      await page.getByRole('button', { name: /Ver el pedido/ }).dispatchEvent('click')
      const pedido = await page.locator('textarea[readonly]').inputValue()
      fs.writeFileSync(path.join(out, `${tag}-pedido.md`), pedido)
      for (const t of ['PARA QUÉ SIRVE ESTA HOJA: Es lo primero que dispone el Comandante', 'I.- MÉTODO: la CLASE de planeamiento', '"VII.- OTROS"'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)

      // 📄 El Word militar.
      const boton = page.locator('button[title="Descargar en el formato propio del documento"]')
      assert.ok(await boton.count(), 'no está el botón del Word militar')
      const d = page.waitForEvent('download', { timeout: 30000 })
      await boton.first().dispatchEvent('click')
      const w = await d
      assert.match(w.suggestedFilename(), /^F1P6_/, w.suggestedFilename())
      const archivo = path.join(out, `${tag}-F1P6.docx`)
      await w.saveAs(archivo)
      const txt = textoXml(execFileSync('unzip', ['-p', archivo, 'word/document.xml'], { encoding: 'utf8' }))
      fs.writeFileSync(path.join(out, `${tag}-F1P6.txt`), txt)
      for (const t of ['GUÍA INICIAL DEL COMANDANTE', 'MÉTODO.', 'planeamiento DELIBERADO', 'ASIGNACIÓN INICIAL DEL TIEMPO.', 'La línea de tiempo inicial para la operación es la siguiente:', 'Tiempo total disponible de la DIVMEC-1: 59 días y 9 horas', 'Tiempo para preparar (2/3)', 'Tiempo disponible para las Unidades subordinadas', 'OFICIALES DE ENLACE.', 'RECONOCIMIENTO INICIAL.', 'MOVIMIENTOS.', 'TAREAS ADICIONALES.', 'El G-3 enviará la Orden Preparatoria N° 1', 'OTROS.', 'EL COMANDANTE DE LA DIVMEC-1', 'Distribución:', 'JEM.', 'G-1, G-2, G-3, G-4 y G-5', 'ARCHIVO'])
        assert.ok(txt.includes(t), `el Word no trae «${t}»`)
      for (const t of ['Autenticación', 'UU. DEP.', 'IA — verificar', 'GUÍA INICIAL DEL COMANDANTE No.']) assert.ok(!txt.includes(t), `el Word no debe traer «${t}»`)
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: F1·P6 con los 7 apartados, 📘, 🌱 los 7 (y el renglón viejo), compartida con el G-3, pedido con la guía, Word «${w.suggestedFilename()}» sin autenticación y sólo al Estado Mayor.`)
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
