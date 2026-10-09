// Las hojas del G-1 en la Mesa real (Chromium), con un ejercicio FICTICIO
// (personal-ejemplo.js), en escritorio y en teléfono:
//   · «📋 Mis hojas»: la F1·P3, la F2·P13 y la F7·P1 ya no «se bajan hechas»;
//   · F2·P3 (hoja de trabajo de siempre): 📘 la guía del G-1, 🌱 trae de la Orden y del
//     calco sin duplicar, el pedido a la IA lleva la guía, lo calculado y la doctrina;
//   · F1·P3 Apreciación de Personal: 🌱 (bajas por fase, PP.GG., Línea de Extraviados,
//     Orden, hojas), ideas, pedido a la IA (expediente con los documentos aportados,
//     formato del modelo, doctrina), respuesta sin pisar, vista previa del Word militar y
//     Word; F2·P13 parte de la F1·P3;
//   · F7·P1 Anexo de Personal: 🌱, IA, Word militar de anexo con el cuadro de bajas;
//   · el avance cuenta las hojas, se guarda con el ejercicio, sin errores de JavaScript.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioPersonal, respuestaAprec, respuestaAnexo, respuestaTareas } = require('../personal-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-personal')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
async function esperar(page, f, ms = 10000) {
  let r = null
  for (let t = 0; t < ms; t += 250) {
    r = await f()
    if (r) return r
    await page.waitForTimeout(250)
  }
  return r
}
async function textoDocx(ruta) {
  const z = await JSZip.loadAsync(fs.readFileSync(ruta))
  const xs = await Promise.all(Object.keys(z.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)).map((n) => z.file(n).async('string')))
  return xs.join('\n')
}
const soloTexto = (xml) => xml.replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
async function pedidoIA(scope) {
  await clic(scope.getByRole('button', { name: '📋 Copiar el pedido' }))
  await scope.getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
  await clic(scope.getByRole('button', { name: /Ver el pedido/ }))
  return scope.locator('textarea[readonly]').inputValue()
}
async function aplicarIA(scope, json) {
  await scope.locator('textarea[placeholder^="Pegá acá la respuesta"]').fill(typeof json === 'string' ? json : '```json\n' + JSON.stringify(json) + '\n```')
  await clic(scope.getByRole('button', { name: '✓ Aplicar' }))
}
// La respuesta que la IA da a veces: el DOCUMENTO escrito (Markdown), no el JSON.
const PROSA = fs.readFileSync(path.join(__dirname, '..', 'respuesta-prosa-personal.md'), 'utf8')

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioPersonal({ nombre: `PRUEBA PERSONAL${movil ? ' B' : ''} (FICT.)` })
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      const ocultar = page.getByText('▼ ocultar')
      if (await ocultar.count()) await ocultar.first().click().catch(() => {})
      await clic(page.getByRole('button', { name: /G-1 Personal/ }).first())
      const panel = page.locator('div:has(> div > h3:text("👥 Apoyo de Personal — G-1"))')
      await panel.waitFor({ timeout: 15000 })
      await clic(panel.getByRole('button', { name: '📋 Mis hojas' }))
      const volver = () => clic(panel.getByRole('button', { name: '← Volver a mis hojas' }))
      const lista = await panel.innerText()
      assert.ok(!/se baja hecha/.test(lista), 'ninguna hoja del G-1 «se baja hecha»')
      for (const t of ['F1·P3', 'F2·P3', 'F2·P5', 'F2·P6', 'F2·P8', 'F2·P13', 'F3·P1', 'F5·P1', 'F6·P3', 'F7·P1']) assert.ok(lista.includes(t), `falta la hoja ${t}`)

      // ── F2·P3 Tareas (hoja de trabajo de siempre): guía, 🌱 e IA ──
      await clic(panel.getByRole('button', { name: /F2·P3.*Tareas específicas/ }))
      const ayuda = panel.locator('[data-em="ayuda-hoja"]')
      await ayuda.waitFor()
      await clic(ayuda.getByRole('button', { name: /¿Para qué es y cómo se llena\?/ })) // la guía viene plegada
      const ta = await ayuda.innerText()
      for (const t of ['¿Para qué es y cómo se llena?', 'campo de personal', 'ESPECÍFICA', 'Ejemplo:']) assert.ok(ta.includes(t), `guía de la F2·P3: falta «${t}»`)
      await clic(ayuda.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ayuda.getByText(/Se agregaron \d+ entradas/).waitFor()
      const vals = (scope) => scope.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
      let vs = (await vals(panel)).join('\n')
      for (const t of ['Mantener el efectivo de combate de los regimientos de primer escalón (FICT.)', 'Evacuar los PP.GG. hasta el DPG del CE (FICT.)', 'reemplazos al escalón superior', 'Controlar la Línea de Extraviados']) assert.ok(vs.includes(t), `tareas sembradas: falta «${t}»`)
      await clic(ayuda.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ayuda.getByText(/No había nada nuevo/).waitFor()
      await clic(panel.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pt = await pedidoIA(panel)
      for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'EXPEDIENTE DEL EJERCICIO', 'DOCUMENTOS APORTADOS POR EL OFICIAL', 'Anexo de Personal del CE (FICT.)', 'PARA QUÉ SIRVE ESTA HOJA', 'campo de PERSONAL (G-1)', 'LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA G-1 PERSONAL', 'APRECIACIÓN DE BAJAS POR FASE', 'DOCTRINA Y REGLAMENTOS DEL CAMPO', 'ECEM 15-08', 'FORMATO DE TU RESPUESTA', 'TABLA de Markdown', '# CÓMO CONTESTAR'])
        assert.ok(pt.includes(t), `pedido de la F2·P3: falta «${t}»`)
      assert.ok(pt.indexOf('DOCTRINA Y REGLAMENTOS DEL CAMPO') < pt.indexOf('# CÓMO CONTESTAR'), 'la doctrina va antes de cómo contestar')
      await aplicarIA(panel, respuestaTareas())
      await panel.getByText(/agregadas/).waitFor()
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('Registrar las sepulturas de la fase de ruptura (FICT.)'), 'la IA agregó su renglón')
      // la IA contesta con una TABLA de Markdown en vez del JSON: entra igual
      await aplicarIA(panel, 'Acá van las tareas:\n\n| **Tarea** | Tipo | De dónde sale | Quién la ejecuta |\n|---|---|---|---|\n| Habilitar el Puesto de Reunión de Reemplazos (FICT.) | Implícita | Calco | G-1 |\n')
      await esperar(page, async () => (await vals(panel)).join('\n').includes('Habilitar el Puesto de Reunión de Reemplazos (FICT.)'))
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('Habilitar el Puesto de Reunión de Reemplazos (FICT.)'), 'la tabla de Markdown entró como renglón')
      await volver()

      // ── F1·P3 Apreciación de Situación de Personal ──
      await clic(panel.getByRole('button', { name: /F1·P3.*Apreciación Activa de PERSONAL/ }))
      const ap = panel.locator('[data-em-doc="aprecActiva"]')
      await ap.waitFor({ timeout: 15000 })
      assert.equal(await page.getByText('Este documento reúne los datos vigentes del ejercicio.').count(), 0, 'ya no es una hoja que «se baja hecha»')
      const cab = await ap.innerText()
      for (const t of ['APRECIACIÓN DE SITUACIÓN DE PERSONAL', 'I.- MISIÓN.', 'II.- SITUACIÓN Y CONSIDERACIONES DE PERSONAL.', 'III.- ANÁLISIS.', 'IV.- COMPARACIÓN.', 'V.- CONCLUSIONES Y RECOMENDACIONES.', 'Mantenimiento del efectivo de la Unidad.', 'Prisioneros de guerra.', '✓ 3 fase(s) del COA', '✓ ruta de PP.GG.'])
        assert.ok(cab.includes(t), `editor de la apreciación: falta «${t}»`)
      await clic(ap.getByRole('button', { name: /Lo que ya entregaron las otras secciones/ }))
      assert.ok((await ap.locator('[data-em="entregas"]').innerText()).includes('Misión recibida'), 'lo que entregó la Orden')
      await clic(ap.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await ap.getByText(/Se trajo:/).waitFor()
      vs = (await vals(ap)).join('\n')
      for (const t of ['Mantener el efectivo de combate de los regimientos de primer escalón (FICT.)', 'Registrar las sepulturas de la fase de ruptura (FICT.)', 'No emplear mano de obra civil al norte del río Z (FICT.)', 'Los reemplazos del CE llegan antes del D+1 (FICT.)', 'Efectivo de planeamiento: 6446', 'Cadena de evacuación en el calco', 'Línea de Extraviados', 'BRIG. BL. ROJA (FICT.)', 'CAP N° 1 — ataque por el norte (FICT.)', 'Un solo EPE para heridos y PP.GG. (FICT.).', 'Bajas previstas:', 'Especial PUEBLO-X (FICT.)', 'Fase I — RUPTURA (FICT.)', 'superan el 20 %'])
        assert.ok(vs.includes(t), `apreciación armada: falta «${t}»`)
      await ap.locator('textarea[placeholder^="Ej.: «Lo crítico son los reemplazos"]').fill('Lo crítico son los reemplazos de la fase II. Prefiero el CAP N° 1 (FICT.).')
      await clic(ap.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pa = await pedidoIA(ap)
      for (const t of ['APRECIACIÓN DE SITUACIÓN DE PERSONAL', 'SECCIÓN I — PERSONAL (G-1)', 'EXPEDIENTE DEL EJERCICIO', 'DOCUMENTOS APORTADOS POR EL OFICIAL', 'Los reemplazos llegarán al PRR', 'APRECIACIÓN DE BAJAS POR FASE', 'CADENA DE PP.GG.', 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', 'LO QUE YA DICEN TUS OTRAS HOJAS', 'F2·P3 Tareas de personal', 'DOCTRINA Y REGLAMENTOS', 'ECEM 15-08', 'EL FORMATO DEL DOCUMENTO', 'modelo de apreciación de personal', '"campos"."mision"', '"caps"[]."fases"[]', 'Lo crítico son los reemplazos de la fase II', 'VERIFICACIÓN FINAL'])
        assert.ok(pa.includes(t), `pedido de la apreciación: falta «${t}»`)
      await aplicarIA(ap, respuestaAprec())
      await ap.getByText(/apartado\(s\) completados por la IA/).waitFor()
      vs = (await vals(ap)).join('\n')
      assert.ok(vs.includes('es el mejor apoyado: un solo EPE para heridos y PP.GG.'), 'la IA completó V.- B.-')
      assert.ok(vs.includes('Se prevén 120 PP.GG. (FICT.); custodia de la Cía. PM.'), 'la IA completó el análisis del CAP por su nombre, en la fase I')
      assert.ok(!vs.includes('NO debe pisar'), 'sólo completar no pisa')
      assert.ok(await ap.getByText('🤖 revisar').count(), 'marca de la IA')
      await clic(ap.getByRole('button', { name: '👁️ Vista previa' }))
      const velo = page.locator('#sid-visor-em')
      await velo.waitFor()
      await velo.locator('section.docx').first().waitFor({ timeout: 30000 })
      const hoja = await velo.innerText()
      for (const t of ['SECRETO', 'APRECIACIÓN DE SITUACIÓN DE PERSONAL', 'OBJETO', 'MISIÓN.', 'Específicas.', 'SITUACIÓN Y CONSIDERACIONES DE PERSONAL.', 'Situación de Personal.', 'ANÁLISIS.', 'CAP N° 1 — ataque por el norte (FICT.)', 'Fase I — RUPTURA (FICT.)', 'COMPARACIÓN.', 'CONCLUSIONES Y RECOMENDACIONES.', 'EL G-1 DE LA DIV.MEC.-1 (FICT.)'])
        assert.ok(hoja.includes(t), `la vista previa no trae «${t}»: ${hoja.slice(hoja.indexOf("ANÁLISIS"), hoja.indexOf("ANÁLISIS") + 700)}`)
      assert.ok(!/🤖|\[IA/.test(hoja), 'sin marcas de la IA en el Word')
      await page.screenshot({ path: path.join(out, `${tag}-aprec-vista-previa.png`) })
      await clic(velo.getByRole('button', { name: '✕ Cerrar' }))
      const dAp = page.waitForEvent('download')
      await clic(ap.getByRole('button', { name: '📄 Word (formato militar)' }))
      const docAp = await dAp
      assert.equal(docAp.suggestedFilename(), 'F1P3_Apreciacion_de_Personal.docx')
      const fAp = path.join(out, `${tag}-F1P3.docx`)
      await docAp.saveAs(fAp)
      const xAp = soloTexto(await textoDocx(fAp))
      for (const t of ['APRECIACIÓN DE SITUACIÓN DE PERSONAL', 'SECRETO', 'Prisioneros de guerra.', 'Mantenimiento del efectivo de la Unidad.', 'Bajas previstas:', 'EL G-1 DE LA DIV.MEC.-1 (FICT.)']) assert.ok(xAp.includes(t), `el Word de la apreciación no trae «${t}»`)
      await ap.screenshot({ path: path.join(out, `${tag}-aprec.png`) }).catch(() => {})

      // ── F2·P13: parte de la F1·P3 ──
      await volver()
      await clic(panel.getByRole('button', { name: /F2·P13.*actualizada/ }))
      const ap2 = panel.locator('[data-em-doc="aprecOrientacion"]')
      await ap2.waitFor()
      await clic(ap2.getByRole('button', { name: '📋 Partir de la F1·P3 (sin pisar)' }))
      vs = (await vals(ap2)).join('\n')
      assert.ok(vs.includes('es el mejor apoyado: un solo EPE para heridos y PP.GG.'), 'la F2·P13 parte de la F1·P3')
      // «Completar y mejorar»: la IA escribe el DOCUMENTO (no el JSON) y la Mesa lo lee por sus títulos
      await clic(ap2.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      await clic(ap2.getByRole('button', { name: 'Completar y mejorar' }))
      const p13 = await pedidoIA(ap2)
      assert.ok(p13.includes('# FORMATO DE TU RESPUESTA'), 'el pedido dice cómo contestar')
      await aplicarIA(ap2, PROSA)
      await ap2.getByText(/se leyó el documento por sus títulos/).waitFor({ timeout: 10000 })
      vs = (await vals(ap2)).join('\n')
      for (const t of ['El G-1 de la DIV.MEC.-1 mantiene el efectivo de combate desde el D-2', 'La operación PUEDE ser apoyada desde el punto de vista del personal.', '3. INSTRUIR a los comandantes de unidad', 'Bajas previstas 957 (14,9 %).', '120 PP.GG. previstos.', 'dos rutas de evacuación.'])
        assert.ok(vs.includes(t), `la respuesta escrita no entró: falta «${t}»`)
      assert.equal(await ap2.locator('[data-cap]').count(), 2, 'los dos CAP, sin duplicar')
      const campos13 = (await ap2.locator('textarea:not([readonly]), input').evaluateAll((xs) => xs.map((x) => x.value))).join('\n')
      assert.ok(!campos13.includes('**'), 'sin las negritas de Markdown en los apartados')

      // ── F7·P1 Anexo de Personal ──
      await volver()
      await clic(panel.getByRole('button', { name: /F7·P1.*Anexo de PERSONAL/ }))
      const ax = panel.locator('[data-em-doc="anexo"]')
      await ax.waitFor()
      await clic(ax.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await ax.getByText(/Se trajo:/).waitFor()
      const va = (await vals(ax)).join('\n')
      for (const t of ['Referirse a la Orden de Operaciones.', 'Requerimiento al G-4', 'Protocolos de Ginebra', 'Línea de Extraviados', 'PC. de la DIV.MEC.-1 (FICT.): CG. PUEBLO-X.', 'Puesto de Pagaduría']) assert.ok(va.includes(t), `anexo armado: falta «${t}»`)
      await clic(ax.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pax = await pedidoIA(ax)
      for (const t of ['ANEXO DE PERSONAL', 'modelo de plan de personal', 'APOYO DE PERSONAL.', 'F1·P3 Apreciación de Personal', '"campos"."partes"']) assert.ok(pax.includes(t), `pedido del anexo: falta «${t}»`)
      await aplicarIA(ax, respuestaAnexo())
      await ax.getByText(/apartado\(s\) completados por la IA/).waitFor()
      const dAx = page.waitForEvent('download')
      await clic(ax.getByRole('button', { name: '📄 Word (formato militar)' }))
      const dlg = page.locator('dialog.sid-militar')
      await dlg.waitFor()
      await dlg.locator('[name=identificador]').fill('A')
      await dlg.locator('[name=asunto]').fill('Personal')
      await dlg.locator('[name=padreTitulo]').fill('ORDEN GENERAL DE OPERACIONES No. 3')
      await dlg.locator('[data-action="exportar"]').click()
      const fAx = path.join(out, `${tag}-F7P1.docx`)
      await (await dAx).saveAs(fAx)
      const xAxXml = await textoDocx(fAx)
      const xAx = soloTexto(xAxXml)
      for (const t of ['ANEXO', 'SITUACIÓN.', 'MISIÓN.', 'EJECUCIÓN.', 'APOYO DE PERSONAL.', 'Mantenimiento de efectivos.', 'Bajas de combate', 'Fase I — RUPTURA (FICT.)', 'TOTAL', 'Protocolos de Ginebra', 'Parte diario de efectivos a las 1800 (FICT.).', 'COMANDO Y COMUNICACIONES.', 'EL COMANDANTE DE'])
        assert.ok(xAx.includes(t), `el Word del anexo no trae «${t}»`)
      assert.ok(/<w:tbl>/.test(xAxXml), 'el cuadro de bajas va como tabla')

      // ── El avance y el guardado ──
      await volver()
      const avance = await panel.getByText(/hojas con contenido/).first().innerText()
      const hechas = Number((avance.match(/(\d+) de \d+ hojas/) || [])[1])
      const total = Number((avance.match(/\d+ de (\d+) hojas/) || [])[1])
      assert.equal(total, 10, `avance: ${avance} (las 10 hojas del G-1)`)
      assert.equal(hechas, 6, `avance: ${avance} (F2·P3, F2·P6, F5·P1, F1·P3, F2·P13 y F7·P1)`)
      await clic(page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first())
      await clic(page.getByRole('button', { name: /Guardar todo/ }))
      const g = await esperar(page, async () => {
        const x = await leerGuardado(page, datos.nombre)
        return x?.hojasG?.g1?.anexo?.esquema === 'anexo-personal-v1' ? x : null
      })
      assert.ok(g, 'guardado con el ejercicio')
      assert.equal(g.hojasG.g1.aprecActiva.esquema, 'aprec-personal-v1')
      assert.ok(g.hojasG.g1.aprecActiva.caps[0].fases.length === 3, 'las tres fases del CAP')
      assert.ok(g.hojasG.g1.tareas.length >= 6, 'las tareas sembradas y de la IA')
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: F2·P3 (guía, 🌱 sin duplicar, IA con lo calculado y la doctrina), Apreciación de Personal (🌱, ideas, IA con el expediente y el formato del modelo, sin pisar, vista previa y Word militar), F2·P13 (con la respuesta de la IA escrita como documento, no JSON), Anexo de Personal (🌱, IA, Word de anexo con el cuadro de bajas), tabla de Markdown en la F2·P3, avance y guardado.`)
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
