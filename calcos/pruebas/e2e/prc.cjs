// F3·P1 — H.T. POTENCIA RELATIVA DE COMBATE del G-3 en la Mesa real (Chromium), con un
// ejercicio FICTICIO (prc-ejemplo.js), en escritorio y en teléfono:
//   · la hoja es la del .docx de la Escuela (5 columnas × 5 filas) y la guía, la de los
//     Pasos 1, 2 y 3; lo guardado con la forma VIEJA aparece en su fila y columna nuevas;
//   · 🌱 trae del calco las unidades de cada bando, la relación de fuerzas y los fuegos;
//   · el pedido a la IA (Completar y mejorar, con la indicación de las fases de Sergio) lleva
//     el expediente, la doctrina, el ejemplo y termina con el formato y la indicación;
//   · pegar SÓLO la pregunta final de la IA (la captura) dice qué pasó; la respuesta entera
//     se aplica en las 20 celdas;
//   · la vista previa trae el cuadro y «📄 Word (hoja de trabajo)» baja el .docx de la
//     Escuela con lo escrito; se guarda con el ejercicio con la forma nueva.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioPRC, PEGADO_CAPTURA, INDICACION, RESPUESTA_JSON } = require('../prc-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-prc')
fs.mkdirSync(out, { recursive: true })

async function irALaHoja(page) {
  if (!(await page.getByRole('button', { name: '← Volver a mis documentos' }).count())) {
    await page.getByRole('button', { name: /G-3 Operaciones/ }).first().dispatchEvent('click')
    await page.getByRole('button', { name: '📄 Documentos', exact: true }).dispatchEvent('click')
  } else await page.getByRole('button', { name: '← Volver a mis documentos' }).dispatchEvent('click')
  await page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first().dispatchEvent('click')
  await page.getByRole('button', { name: /F3·P1.*Potencia relativa de combate/ }).dispatchEvent('click')
  await page.getByRole('button', { name: '← Volver a mis documentos' }).waitFor({ timeout: 15000 })
}
const valores = (page) => page.locator('textarea:not([readonly])').evaluateAll((xs) => xs.map((x) => x.value))
const guardado = async (page, nombre, cond, ms = 8000) => {
  let g = null
  for (let t = 0; t < ms; t += 250) {
    g = await leerGuardado(page, nombre)
    if (cond(g)) return g
    await page.waitForTimeout(250)
  }
  return g
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=g3' })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioPRC()
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      await irALaHoja(page)
      const cuerpo = await page.locator('body').innerText()

      // La hoja de la Escuela, la guía de los tres pasos y lo viejo en su lugar nuevo.
      for (const t of ['Potencia relativa de combate', 'Paso 1 — FUERZAS ENEMIGAS y FUERZAS PROPIAS', 'Paso 2 — DEDUCCIONES', 'Paso 3 — TTP', 'MANIOBRA', 'POTENCIA DE FUEGO', 'PROTECCIÓN', 'LIDERAZGO', 'INFORMACIÓN E INTELIGENCIA'])
        assert.ok(cuerpo.includes(t), `la hoja no muestra «${t}»`)
      assert.ok(/Tácticas, técnicas y procedimientos \(TTP\.\)/i.test(cuerpo), 'la columna de las TTP')
      assert.ok(!/Sistema operativo|APOYO DE SERVICIO DE COMBATE|DEFENSA ANTIAÉREA\n/.test(cuerpo), 'ya no es la hoja de los sistemas operativos')
      let v = await valores(page)
      for (const t of ['Apoyo de fuegos: 1 unidad(es) propias de apoyo de fuegos contra 1 enemigas.', 'Defensa antiaérea: Sección AA orgánica (FICT.).', 'Factores intangibles: Conscriptos con poco adiestramiento (FICT.).'])
        assert.ok(v.includes(t), `lo guardado con la forma vieja: falta «${t}» en ${JSON.stringify(v)}`)
      await page.screenshot({ path: path.join(out, `${tag}-hoja.png`) })

      // 🌱 del calco.
      await page.getByRole('button', { name: '🌱 Traer del calco lo que falte' }).dispatchEvent('click')
      await page.waitForTimeout(400)
      v = await valores(page)
      assert.ok(v.some((x) => /^Unidades enemigas en el calco: 5 \(BIM-41 \(FICT\.\)/.test(x)), '🌱 las enemigas')
      assert.ok(v.some((x) => /^Unidades propias en el calco: 4 /.test(x)), '🌱 las propias')
      assert.ok(v.some((x) => /^Relación de fuerzas con las fichas del calco: /.test(x)), '🌱 la relación')
      assert.ok(v.includes('Apoyo de fuegos: 1 unidad(es) propias de apoyo de fuegos contra 1 enemigas.'), '🌱 no pisa')

      // 🤖 El pedido: Completar y mejorar, con la indicación de las fases.
      if (!(await page.getByRole('button', { name: '📋 Copiar el pedido' }).count())) await page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).dispatchEvent('click')
      await page.getByRole('button', { name: 'Completar y mejorar' }).dispatchEvent('click')
      await page.locator('textarea[placeholder^="Ej.: «Trabajá sólo"]').fill(INDICACION)
      await page.getByRole('button', { name: '📋 Copiar el pedido' }).dispatchEvent('click')
      await page.getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
      await page.getByRole('button', { name: /Ver el pedido/ }).dispatchEvent('click')
      const pedido = await page.locator('textarea[readonly]').inputValue()
      for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR', 'Orden de operaciones (FICT.)', 'Unidades enemigas en el calco: 5', '1) Paso 1. La PRC. emplea la dinámica de la potencia de combate', '3) Paso 3.', '| Maniobra | +Velocidad en la carretera.', 'No termines con preguntas', '"INFORMACIÓN E INTELIGENCIA": {', '| Potencia de combate | Fuerzas enemigas | Fuerzas propias | Deducciones | Tácticas, técnicas y procedimientos (TTP.) |'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
      assert.ok(pedido.indexOf(INDICACION) > pedido.indexOf('# CÓMO CONTESTAR — FORMATO DE TU RESPUESTA'), 'la indicación después del formato')
      assert.ok(pedido.trimEnd().endsWith('Si te pide un texto «para exponer», ese estilo va DENTRO de los textos.'), 'cierra con el recordatorio del formato')
      fs.writeFileSync(path.join(out, `${tag}-pedido.md`), pedido)

      // Lo de la captura: sólo la pregunta final.
      const caja = page.locator('textarea[placeholder^="Pegá acá la respuesta"]')
      await caja.fill(PEGADO_CAPTURA)
      await page.getByRole('button', { name: '✓ Aplicar' }).dispatchEvent('click')
      await page.getByText(/Lo que pegaste es sólo el FINAL de la respuesta de la IA/).waitFor({ timeout: 5000 })
      await page.screenshot({ path: path.join(out, `${tag}-error.png`) })

      // La respuesta entera.
      await caja.fill(RESPUESTA_JSON)
      await page.getByRole('button', { name: '✓ Aplicar' }).dispatchEvent('click')
      await page.getByText(/20 campo\(s\) escritos/).waitFor({ timeout: 5000 })
      v = await valores(page)
      for (const t of [/^\+Movilidad táctica sobre la RN-7 \(FICT\.\)\.\n\+Puede desmontarse\./, /^Fase de canalización: obstáculos escalonados en el corredor norte\./, /^\+Morteros de 120 mm \(FICT\.\)\.\n-Sin artillería de campaña\./, /^Destruir su reconocimiento en la zona de seguridad\./])
        assert.ok(v.some((x) => t.test(x)), `respuesta: falta ${t}`)

      // Vista previa: el cuadro con las columnas de la Escuela.
      await page.getByRole('button', { name: '👁️ Vista previa' }).dispatchEvent('click')
      const marco = page.frameLocator('iframe[title="vista previa"]')
      const hoja = await marco.locator('body').innerText()
      for (const t of ['POTENCIA RELATIVA DE COMBATE', 'FUERZAS ENEMIGAS', 'DEDUCCIONES', 'TÁCTICAS, TÉCNICAS Y PROCEDIMIENTOS (TTP.)', 'INFORMACIÓN E INTELIGENCIA', 'FASE DE DESORGANIZACIÓN: FUEGOS DE CONTRAPREPARACIÓN'])
        assert.ok(hoja.toUpperCase().includes(t), `la vista previa no trae «${t}»`)
      await page.getByRole('button', { name: '← Volver' }).dispatchEvent('click')

      // 📄 Word (hoja de trabajo): el .docx de la Escuela.
      const descarga = page.waitForEvent('download')
      await page.getByRole('button', { name: '📄 Word (hoja de trabajo)' }).dispatchEvent('click')
      const d = await descarga
      assert.equal(d.suggestedFilename(), 'F3P1_HT_Potencia_relativa_de_combate.docx')
      const archivo = path.join(out, `${tag}-F3P1.docx`)
      await d.saveAs(archivo)
      const doc = execFileSync('unzip', ['-p', archivo, 'word/document.xml'], { encoding: 'utf8' })
      for (const t of ['H.T. POTENCIA RELATIVA DE COMBATE', 'w:orient="landscape"', 'FUERZAS ENEMIGAS', 'TÁCTICAS, TÉCNICAS Y PROCEDIMIENTOS (TTP.)', '+Puede desmontarse.', '+Tiempo para fortificar.', 'Ensayar la conducción por fases.'])
        assert.ok(doc.includes(t), `el Word no trae «${t}»`)
      assert.ok(!doc.includes('IA — verificar'))

      // Se guarda con la forma nueva.
      await page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
      const g = await guardado(page, datos.nombre, (x) => x?.g3?.potencia?.['LIDERAZGO|Deducciones'])
      const p = g.g3.potencia
      assert.ok(Object.keys(p).every((k) => !/\|(PROPIAS|ENEMIGO|Relación y deducción)$/.test(k) && !['APOYO DE FUEGOS', 'DEFENSA ANTIAÉREA'].includes(k.split('|')[0])), Object.keys(p).join(', '))
      assert.match(p['PROTECCIÓN|Fuerzas propias'], /^\+Tiempo para fortificar\./, '«Completar y mejorar» reescribe también lo migrado')
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: hoja de la Escuela y guía, lo viejo migrado, 🌱, pedido con doctrina y formato al final, aviso de lo pegado a medias, respuesta en 20 celdas, vista previa, Word del .docx, guardado.`)
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
