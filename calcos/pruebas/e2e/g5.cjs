// Las hojas del G-5 en la Mesa real (Chromium), con un ejercicio FICTICIO (g5-ejemplo.js),
// en escritorio y en teléfono:
//   · las CAPAS de centros poblados e infraestructura se ponen en el estado de la Mesa (sin
//     red no se descargan): el panel del G-5 y el motor cuentan lo mismo (recursos,
//     habitantes, evacuados);
//   · «📋 Mis hojas»: la F1·P3, la F2·P13 y la F7·P1 ya no «se bajan hechas»;
//   · F2·P11 Temas y mensajes (hoja de trabajo de siempre): 📘 la guía del G-5, 🌱 trae del
//     calco sin duplicar, el pedido a la IA lleva lo calculado, la doctrina y los documentos
//     aportados; una TABLA de Markdown entra como renglón;
//   · F1·P3 Apreciación de AC/GM: lo que toma del calco, 🌱, ideas, pedido a la IA, respuesta
//     sin pisar (con un CAP nuevo), vista previa del Word militar y Word con sus cuadros;
//   · F2·P13: parte de la F1·P3 y lee la respuesta de la IA ESCRITA como documento;
//   · F7·P1 Anexo de AC/GM: 🌱, IA, Word de anexo con el formato militar (membrete, letra,
//     Orden) y sus cuadros;
//   · el avance cuenta las hojas, se guarda con el ejercicio, sin errores de JavaScript.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { capasAC, ejercicioAC, respuestaAprec, respuestaAnexo } = require('../g5-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-g5')
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
const soloTexto = (xml) =>
  xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
// Los cuadros de la Mesa (el membrete y la autenticación del formato militar también son tablas).
const cuadros = (xml) => xml.split('<w:tbl>').slice(1).map((t) => soloTexto(t.split('</w:tbl>')[0]).replace(/\n+/g, ' | '))
function conCuadros(xml) {
  const cs = cuadros(xml)
  assert.ok(cs.some((t) => t.startsWith('Categoría | Identificados | Explotables | Protegidos | Negados | Sin clasificar') && /TOTAL \| 18 \| 13 \| 3 \| 2 \| 0/.test(t)), `el cuadro de recursos: ${cs.join(' // ').slice(0, 400)}`)
  assert.ok(cs.some((t) => t.startsWith('Concepto | Cantidad | Población en el área | 12.600 hab.') && t.includes('30 % → 3780 personas')), 'el cuadro de evacuación')
}
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
// Las capas que la Mesa descarga (centros poblados e infraestructura) van a su estado
// [datosCapas, setDatosCapas]: el gancho que sigue al de las capas encendidas.
async function ponerCapas(page, capas) {
  return page.evaluate((c) => {
    const root = document.getElementById('root')
    const k = Object.keys(root).find((x) => x.startsWith('__reactContainer'))
    const pila = [root[k]?.stateNode?.current || root[k]]
    const vistos = new Set()
    while (pila.length) {
      const n = pila.pop()
      if (!n || vistos.has(n)) continue
      vistos.add(n)
      let h = n.memoizedState
      for (let i = 0; h && typeof h === 'object' && i < 800; i++, h = h.next) {
        const v = h.memoizedState
        if (v && typeof v === 'object' && !Array.isArray(v) && 'hidro_lineas' in v && h.next?.queue?.dispatch) {
          h.next.queue.dispatch(c)
          return true
        }
      }
      if (n.child) pila.push(n.child)
      if (n.sibling) pila.push(n.sibling)
    }
    return false
  }, capas)
}
const PROSA = fs.readFileSync(path.join(__dirname, '..', 'respuesta-prosa-g5.md'), 'utf8')

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioAC({ nombre: `PRUEBA AC-GM${movil ? ' B' : ''} (FICT.)` })
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      const ocultar = page.getByText('▼ ocultar')
      if (await ocultar.count()) await ocultar.first().click().catch(() => {})
      assert.ok(await ponerCapas(page, capasAC()), 'las capas entraron al estado de la Mesa')
      await clic(page.getByRole('button', { name: /G-5 AC\/GM/ }).first())
      const panel = page.locator('div:has(> div > h3:text("🏛️ Asuntos Civiles — G-5"))')
      await panel.waitFor({ timeout: 15000 })
      // el panel cuenta las capas que pusimos (la misma cuenta que va a usar el motor)
      const pie = await panel.innerText()
      for (const t of ['18 recursos', '12.600 hab.', '3780 evac.']) assert.ok(pie.includes(t), `panel del G-5: falta «${t}»`)
      await clic(panel.getByRole('button', { name: '📋 Mis hojas' }))
      const volver = () => clic(panel.getByRole('button', { name: '← Volver a mis hojas' }))
      const lista = await panel.innerText()
      assert.ok(!/se baja hecha/.test(lista), 'ninguna hoja del G-5 «se baja hecha»')
      for (const t of ['F1·P3', 'F2·P3', 'F2·P5', 'F2·P6', 'F2·P8', 'F2·P11', 'F2·P13', 'F3·P1', 'F5·P1', 'F6·P3', 'F7·P1']) assert.ok(lista.includes(t), `falta la hoja ${t}`)
      const vals = (scope) => scope.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))

      // ── F2·P11 Temas y mensajes (hoja de trabajo de siempre): guía, 🌱 e IA ──
      await clic(panel.getByRole('button', { name: /F2·P11.*Temas y mensajes/ }))
      const ayuda = panel.locator('[data-em="ayuda-hoja"]')
      await ayuda.waitFor()
      const ta = await ayuda.innerText()
      for (const t of ['¿Para qué es y cómo se llena?', 'SE DIFUNDE', 'intención del Comandante', 'Ejemplo:']) assert.ok(ta.includes(t), `guía de la F2·P11: falta «${t}»`)
      await clic(ayuda.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ayuda.getByText(/Se agregaron \d+ entradas/).waitFor()
      let vs = (await vals(panel)).join('\n')
      for (const t of ['No circular por la ruta 1 durante el ataque (FICT.)', 'Evacuación ordenada: reunirse en el P Reu Evac', 'Distribución de agua, medicina, alimentos y ropa', 'medio(s) de comunicación del área']) assert.ok(vs.includes(t), `temas sembrados: falta «${t}»`)
      await clic(ayuda.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ayuda.getByText(/No había nada nuevo/).waitFor()
      assert.ok((await ayuda.innerText()).includes('eje humanitario'), 'el aviso es el del G-5')
      await clic(panel.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pt = await pedidoIA(panel)
      for (const t of ['EXPEDIENTE DEL EJERCICIO', 'DOCUMENTOS APORTADOS POR EL OFICIAL', 'Anexo de AC-GM del CE (FICT.)', 'PARA QUÉ SIRVE ESTA HOJA', 'campo de ASUNTOS CIVILES Y GOBIERNO MILITAR (G-5)', 'LO QUE LA MESA YA CALCULÓ Y TIENE EN EL CALCO PARA G-5 ASUNTOS CIVILES / GM', 'POBLACIÓN (capas de centros poblados y Censo 2024)', '12.600 habitantes', 'RECURSOS DEL ÁREA', 'EVACUACIÓN (panel', '3780 personas', 'DOCTRINA Y REGLAMENTOS DEL CAMPO', 'DICA', 'FORMATO DE TU RESPUESTA', '# CÓMO CONTESTAR'])
        assert.ok(pt.includes(t), `pedido de la F2·P11: falta «${t}»`)
      assert.ok(pt.indexOf('DOCTRINA Y REGLAMENTOS DEL CAMPO') < pt.indexOf('# CÓMO CONTESTAR'), 'la doctrina va antes de cómo contestar')
      await aplicarIA(panel, 'Acá van:\n\n| **Tema o mensaje** | A quién va dirigido | Por qué medio | Cuándo |\n|---|---|---|---|\n| El LDS funciona en el Coliseo PUEBLO-Z (FICT.) | Evacuados | Radio PUEBLO-X | D-1 |\n')
      await esperar(page, async () => (await vals(panel)).join('\n').includes('El LDS funciona en el Coliseo PUEBLO-Z (FICT.)'))
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('El LDS funciona en el Coliseo PUEBLO-Z (FICT.)'), 'la tabla de Markdown entró como renglón')
      await volver()

      // ── F1·P3 Apreciación de Situación de AC/GM ──
      await clic(panel.getByRole('button', { name: /F1·P3.*Apreciación Activa de AC\/GM/ }))
      const ap = panel.locator('[data-em-doc="aprecActiva"]')
      await ap.waitFor({ timeout: 15000 })
      assert.equal(await page.getByText('Este documento reúne los datos vigentes del ejercicio.').count(), 0, 'ya no es una hoja que «se baja hecha»')
      const cab = await ap.innerText()
      for (const t of ['APRECIACIÓN DE SITUACIÓN DE AC/GM', 'I.- MISIÓN.', 'II.- SITUACIÓN Y CONSIDERACIONES DE AC/GM.', 'III.- ANÁLISIS.', 'IV.- COMPARACIÓN.', 'V.- CONCLUSIONES Y RECOMENDACIONES.', 'Situación de Inteligencia (Ver ASI.)', 'Población.', 'Número estimado de refugiados', 'Estimar el número de refugiados', 'Funciones especiales.', 'Ventajas y desventajas de cada CAP.', '✓ 18 recurso(s) del área (3 clasificados por el G-5)', '✓ 12.600 hab.', '✓ 3780 a evacuar', 'sobre el EPA', '+ Agregar curso de acción propio'])
        assert.ok(cab.includes(t), `editor de la apreciación: falta «${t}»`)
      assert.ok(await ap.getByRole('button', { name: '➡️ Trazar el eje humanitario' }).count(), 'el botón para acostar el eje humanitario')
      await clic(ap.getByRole('button', { name: /Lo que ya entregaron las otras secciones/ }))
      const ent = await ap.locator('[data-em="entregas"]').innerText()
      for (const t of ['Misión recibida', 'El G-1', 'Se emplea mano de obra civil sólo al sur del río Z (FICT.).', 'El G-4', 'Eje Principal de Abastecimiento']) assert.ok(ent.includes(t), `lo entregado: falta «${t}»`)
      await clic(ap.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await ap.getByText(/Se trajo:/).waitFor()
      vs = (await vals(ap)).join('\n')
      for (const t of ['Mantener el orden público en PUEBLO-X durante la ruptura (FICT.)', 'No emplear mano de obra civil al norte del río Z (FICT.)', 'La población no interfiere con el ataque nocturno (FICT.)', 'El G-5 de la DIV.MEC.-1 (FICT.) mantiene el orden público', '12.600 habitantes en 4 centro(s) poblado(s)', '3780 personas', 'Faltan 23 albergue(s)', 'EXPLOTABLE 13, PROTEGIDO 3, NEGADO 2', 'Hospital PUEBLO-X (FICT.)', 'BRIG. BL. ROJA (FICT.)', 'Fase I — RUPTURA (FICT.)', 'El LDS funciona en el Coliseo PUEBLO-Z (FICT.)', 'CAP N° 1 — ataque por el norte (FICT.)', 'Un solo eje humanitario (FICT.).', 'Sí, evacuando el D-1 (FICT.).', 'Especial PUEBLO-X (FICT.)'])
        assert.ok(vs.includes(t), `apreciación armada: falta «${t}»`)
      await ap.locator('textarea[placeholder^="Ej.: «Lo crítico es la evacuación"]').fill('Lo crítico es la evacuación de PUEBLO-X en la fase I. Prefiero el CAP N° 1 (FICT.).')
      await clic(ap.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pa = await pedidoIA(ap)
      for (const t of ['APRECIACIÓN DE SITUACIÓN DE AC/GM', 'SECCIÓN V — ASUNTOS CIVILES Y GOBIERNO MILITAR (G-5)', 'EXPEDIENTE DEL EJERCICIO', 'DOCUMENTOS APORTADOS POR EL OFICIAL', 'La Cruz Roja (FICT.) opera en PUEBLO-Y', 'LO QUE SE DESCARGA AL G-4', 'EJES HUMANITARIOS', 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', 'LO QUE YA DICEN TUS OTRAS HOJAS', 'F2·P11 Temas y mensajes', 'DOCTRINA Y REGLAMENTOS', 'La Haya 1954', 'EL FORMATO DEL DOCUMENTO', 'modelo de apreciación de AC/GM', '"campos"."desplazadosEstimados"', '"caps"[]."ventajas"', 'Lo crítico es la evacuación de PUEBLO-X en la fase I', 'VERIFICACIÓN FINAL'])
        assert.ok(pa.includes(t), `pedido de la apreciación: falta «${t}»`)
      await aplicarIA(ap, respuestaAprec())
      await ap.getByText(/apartado\(s\) completados por la IA/).waitFor()
      vs = (await vals(ap)).join('\n')
      assert.ok(vs.includes('es el mejor apoyado: un solo eje humanitario'), 'la IA completó V.- B.-')
      assert.ok(vs.includes('CAP N° 3 — fijación y desborde (FICT.)'), 'la IA agregó un CAP')
      assert.ok(!vs.includes('NO debe pisar'), 'sólo completar no pisa')
      assert.equal(await ap.locator('[data-cap]').count(), 3, 'tres CAP en la comparación')
      assert.ok(await ap.getByText('🤖 revisar').count(), 'marca de la IA')
      await clic(ap.getByRole('button', { name: '👁️ Vista previa' }))
      const velo = page.locator('#sid-visor-em')
      await velo.waitFor()
      await velo.locator('section.docx').first().waitFor({ timeout: 30000 })
      const hoja = await velo.innerText()
      for (const t of ['SECRETO', 'APRECIACIÓN DE SITUACIÓN DE AC/GM', 'OBJETO', 'MISIÓN.', 'Específicas.', 'SITUACIÓN Y CONSIDERACIONES DE AC/GM.', 'Situación de Inteligencia (Ver ASI.)', 'Población.', 'ANÁLISIS.', 'Funciones especiales.', 'COMPARACIÓN.', 'CAP N° 1 — ataque por el norte (FICT.)', 'CONCLUSIONES Y RECOMENDACIONES.', 'EL G-5 DE LA DIV.MEC.-1 (FICT.)'])
        assert.ok(hoja.includes(t), `la vista previa no trae «${t}»`)
      assert.ok(!/🤖|\[IA|🏥|🚸/.test(hoja), 'sin marcas de la IA ni emojis en el Word')
      await page.screenshot({ path: path.join(out, `${tag}-aprec-vista-previa.png`) })
      await clic(velo.getByRole('button', { name: '✕ Cerrar' }))
      const dAp = page.waitForEvent('download')
      await clic(ap.getByRole('button', { name: '📄 Word (formato militar)' }))
      const docAp = await dAp
      assert.equal(docAp.suggestedFilename(), 'F1P3_Apreciacion_de_ACGM.docx')
      const fAp = path.join(out, `${tag}-F1P3.docx`)
      await docAp.saveAs(fAp)
      const xApXml = await textoDocx(fAp)
      const xAp = soloTexto(xApXml)
      for (const t of ['APRECIACIÓN DE SITUACIÓN DE AC/GM', 'SECRETO', 'Disponibilidad local de personal y material', 'Previsión de evacuación', 'Explotables', 'Población en el área', 'Hospital PUEBLO-X (FICT.)', 'EL G-5 DE LA DIV.MEC.-1 (FICT.)']) assert.ok(xAp.includes(t), `el Word de la apreciación no trae «${t}»`)
      conCuadros(xApXml)
      await ap.screenshot({ path: path.join(out, `${tag}-aprec.png`) }).catch(() => {})

      // ── F2·P13: parte de la F1·P3 y lee la respuesta escrita como documento ──
      await volver()
      await clic(panel.getByRole('button', { name: /F2·P13.*actualizada/ }))
      const ap2 = panel.locator('[data-em-doc="aprecOrientacion"]')
      await ap2.waitFor()
      await clic(ap2.getByRole('button', { name: '📋 Partir de la F1·P3 (sin pisar)' }))
      vs = (await vals(ap2)).join('\n')
      assert.ok(vs.includes('es el mejor apoyado: un solo eje humanitario'), 'la F2·P13 parte de la F1·P3')
      await clic(ap2.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      await clic(ap2.getByRole('button', { name: 'Completar y mejorar' }))
      const p13 = await pedidoIA(ap2)
      assert.ok(p13.includes('# FORMATO DE TU RESPUESTA'), 'el pedido dice cómo contestar')
      await aplicarIA(ap2, PROSA)
      await ap2.getByText(/se leyó el documento por sus títulos/).waitFor({ timeout: 10000 })
      vs = (await vals(ap2)).join('\n')
      for (const t of ['El G-5 de la DIV.MEC.-1 mantiene el orden público y conduce la evacuación', 'Heladas nocturnas que afectan a los evacuados.', 'La misión PUEDE ser apoyada desde el punto de vista de AC/GM.', 'El CA de AC/GM N° 1 (evacuación anticipada)', '2. HABILITAR el Coliseo PUEBLO-Z como Local de Destino Seguro.', 'dos Locales de Destino Seguro.'])
        assert.ok(vs.includes(t), `la respuesta escrita no entró: falta «${t}»`)
      assert.equal(await ap2.locator('[data-cap]').count(), 3, 'los CAP sin duplicar')
      const campos13 = (await ap2.locator('textarea:not([readonly]), input').evaluateAll((xs) => xs.map((x) => x.value))).join('\n')
      assert.ok(!campos13.includes('**'), 'sin las negritas de Markdown en los apartados')

      // ── F7·P1 Anexo de AC/GM ──
      await volver()
      await clic(panel.getByRole('button', { name: /F7·P1.*Anexo de AC\/GM/ }))
      const ax = panel.locator('[data-em-doc="anexo"]')
      await ax.waitFor()
      const cx = await ax.innerText()
      for (const t of ['Organización de la Tarea.', 'I.- SITUACIÓN.', 'Fuerzas propias.', 'Actitud de la población.', 'III.- EJECUCIÓN.', 'Concepto de Apoyo.', 'Tareas para los Equipos Funcionales.', 'V.- COMANDO Y COMUNICACIONES.', 'Es un ANEXO']) assert.ok(cx.includes(t), `editor del anexo: falta «${t}»`)
      await clic(ax.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await ax.getByText(/Se trajo:/).waitFor()
      const va = (await vals(ax)).join('\n')
      for (const t of ['Establecer el apoyo de asuntos civiles y gobierno militar', 'Instalaciones y equipos de AC/GM desplegados', '12.600 habitantes', 'Se identificaron 18 recursos clave', 'Se priorizan los medios CIVILES', 'Eje humanitario 1:', 'No se baten los monumentos culturales', 'Puesto de Pagaduría', 'PC. de la DIV.MEC.-1 (FICT.): CG. PUEBLO-X.', 'El G-5 de la DIV.MEC.-1 mantiene el orden público y conduce la evacuación'])
        assert.ok(va.includes(t), `anexo armado: falta «${t}»`)
      await clic(ax.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pax = await pedidoIA(ax)
      for (const t of ['ANEXO DE ASUNTOS CIVILES Y GOBIERNO MILITAR', 'La Escuela no tiene modelo de anexo del G-5', 'Organización de la Tarea.', '"campos"."fuerzasPropias" (su texto propio', 'F1·P3 Apreciación de AC/GM', '"campos"."toqueQueda"']) assert.ok(pax.includes(t), `pedido del anexo: falta «${t}»`)
      await aplicarIA(ax, respuestaAnexo())
      await ax.getByText(/apartado\(s\) completados por la IA/).waitFor()
      const dAx = page.waitForEvent('download')
      await clic(ax.getByRole('button', { name: '📄 Word (formato militar)' }))
      const dlg = page.locator('dialog.sid-militar')
      await dlg.waitFor()
      assert.match(await dlg.innerText(), /Modelo: Anexo de Asuntos Civiles y Gobierno Militar \(G-5\)/, 'el cuadro de revisión del formato militar')
      await dlg.locator('[name=identificador]').fill('I')
      await dlg.locator('[name=asunto]').fill('Asuntos Civiles y Gobierno Militar')
      await dlg.locator('[name=padreTitulo]').fill('ORDEN GENERAL DE OPERACIONES No. 3')
      await dlg.locator('[data-action="exportar"]').click()
      const fAx = path.join(out, `${tag}-F7P1.docx`)
      const docAx = await dAx
      assert.equal(docAx.suggestedFilename(), 'F7P1_Anexo_de_ACGM.docx')
      await docAx.saveAs(fAx)
      const xAxXml = await textoDocx(fAx)
      const xAx = soloTexto(xAxXml)
      for (const t of ['SECRETO', 'ANEXO', '“I”', 'Organización de la Tarea.', 'SITUACIÓN.', 'Fuerzas propias.', '12.600 habitantes', 'Actitud de la población.', 'Recursos del área.', 'EJECUCIÓN.', 'Concepto de Apoyo.', 'Previsión de evacuación y dimensionamiento del apoyo.', 'Toque de queda en PUEBLO-X de 2000 a 0600 desde el D-1 (FICT.).', 'APOYO DE SERVICIO.', 'COMANDO Y COMUNICACIONES.', 'EL COMANDANTE DE'])
        assert.ok(xAx.includes(t), `el Word del anexo no trae «${t}»`)
      conCuadros(xAxXml)
      assert.ok(!/🤖|🏥|🚸/.test(xAx), 'sin emojis en el Word')
      // las coordenadas acarrean los segundos (el PC de AC/GM está en -68,35: «68°21'00"O»)
      assert.ok(xAx.includes('17°00\'00"S 68°21\'00"O'), 'la coordenada del PC de AC/GM')
      assert.ok(!/\d°\d{2}'60"|°60'/.test(xAx), 'ninguna coordenada con 60')

      // ── El avance y el guardado ──
      await volver()
      const avance = await panel.getByText(/hojas con contenido/).first().innerText()
      const hechas = Number((avance.match(/(\d+) de \d+ hojas/) || [])[1])
      const total = Number((avance.match(/\d+ de (\d+) hojas/) || [])[1])
      assert.equal(total, 11, `avance: ${avance} (las 11 hojas del G-5)`)
      assert.equal(hechas, 7, `avance: ${avance} (F2·P3, F2·P6, F2·P11, F5·P1, F1·P3, F2·P13 y F7·P1)`)
      await panel.screenshot({ path: path.join(out, `${tag}-mis-hojas.png`) }).catch(() => {})
      await clic(page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first())
      await clic(page.getByRole('button', { name: /Guardar todo/ }))
      const g = await esperar(page, async () => {
        const x = await leerGuardado(page, datos.nombre)
        return x?.hojasG?.g5?.anexo?.esquema === 'anexo-acgm-v1' ? x : null
      })
      assert.ok(g, 'guardado con el ejercicio')
      assert.equal(g.hojasG.g5.aprecActiva.esquema, 'aprec-acgm-v1')
      assert.equal(g.hojasG.g5.aprecActiva.caps.length, 3, 'los tres CAP')
      assert.equal(g.hojasG.g5.aprecOrientacion.campos.ccmm, 'Heladas nocturnas que afectan a los evacuados.')
      assert.ok(g.hojasG.g5.temas.length >= 4, 'los temas sembrados y de la IA')
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: capas → panel → motor (18 recursos, 12.600 hab., 3780 evacuados), F2·P11 (guía, 🌱 sin duplicar, IA con lo calculado y la doctrina, tabla de Markdown), Apreciación de AC/GM (lo del calco, 🌱, ideas, IA con el expediente y el formato del modelo, sin pisar, CAP nuevo, vista previa y Word militar con sus cuadros), F2·P13 (respuesta escrita como documento), Anexo de AC/GM (🌱, IA, Word de anexo con formato militar y cuadros), avance y guardado.`)
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
