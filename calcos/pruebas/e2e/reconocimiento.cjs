// La ORDEN DE RECONOCIMIENTO (F2·P9) en la Mesa real (Chromium), con un ejercicio
// FICTICIO (reconocimiento-ejemplo.js), en escritorio y en teléfono:
//   · la guía nueva y el editor de la orden (no el de renglones);
//   · la hoja guardada como la matriz de ANTES se lee: cada renglón es un equipo, sin
//     perder la tarea, el área, el alcance, los plazos ni dónde informa;
//   · 🌱 trae del calco el órgano de reconocimiento que falta, la carta y la situación
//     enemiga (referencia a la Orden Preparatoria);
//   · las ideas del oficial y el pedido a la IA (expediente, ejemplo de la Escuela, ideas);
//   · la respuesta de la IA se aplica sin pisar lo escrito y queda marcada para revisar;
//   · la vista previa es el Word real; el Word sale con el membrete, OBJETO/CARTA/ANEXOS,
//     el cuadro de organización de la tarea, los párrafos I a V y la firma del Comandante;
//   · se guarda con el ejercicio y la carpeta del G-3 lleva la orden.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioReconocimiento, respuestaIA } = require('../reconocimiento-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-reconocimiento')
fs.mkdirSync(out, { recursive: true })
const editor = (page) => page.locator('[data-hoja="orden-reconocimiento"]')

async function irALaHoja(page) {
  if (!(await page.getByRole('button', { name: '← Volver a mis documentos' }).count())) {
    await page.getByRole('button', { name: /G-3 Operaciones/ }).first().dispatchEvent('click')
    await page.getByRole('button', { name: '📄 Documentos', exact: true }).dispatchEvent('click')
  } else await page.getByRole('button', { name: '← Volver a mis documentos' }).dispatchEvent('click')
  await page.getByRole('button', { name: /Analizar la misión/ }).first().dispatchEvent('click')
  await page.getByRole('button', { name: /F2·P9.*Orden de Reconocimiento/ }).dispatchEvent('click')
  await editor(page).waitFor({ timeout: 15000 })
}
const valores = (page) => editor(page).locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
const guardado = async (page, nombre, cond, ms = 8000) => {
  let g = null
  for (let t = 0; t < ms; t += 250) {
    g = await leerGuardado(page, nombre)
    if (cond(g)) return g
    await page.waitForTimeout(250)
  }
  return g
}
async function capturaEditor(page, archivo) {
  await page.evaluate(() => {
    let p = document.querySelector('[data-hoja="orden-reconocimiento"]')?.parentElement
    while (p && p !== document.body) {
      if (getComputedStyle(p).overflowY !== 'visible') {
        p.dataset.antesMax = p.style.maxHeight
        p.dataset.antesOv = p.style.overflowY
        p.style.maxHeight = 'none'
        p.style.overflowY = 'visible'
      }
      p = p.parentElement
    }
  })
  await editor(page).screenshot({ path: archivo }).catch(() => {})
  await page.evaluate(() => {
    for (const p of document.querySelectorAll('[data-antes-max], [data-antes-ov]')) {
      p.style.maxHeight = p.dataset.antesMax
      p.style.overflowY = p.dataset.antesOv
      delete p.dataset.antesMax
      delete p.dataset.antesOv
    }
  })
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=g3' })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioReconocimiento()
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      await irALaHoja(page)

      // Guía nueva, el editor de la orden y la matriz de ANTES leída como equipos.
      assert.ok(await page.getByText(/Es LA ORDEN que pone los ojos donde hacen falta ANTES de decidir/).count(), 'guía nueva')
      assert.equal(await page.getByText('🤖 Trabajar esta hoja con IA').count(), await editor(page).getByText('🤖 Trabajar esta hoja con IA').count(), 'sin el panel de renglones fuera del editor')
      assert.equal(await page.getByRole('button', { name: '⬇️ Word' }).count(), 0, 'sin los botones genéricos de renglones')
      assert.equal(await page.getByRole('button', { name: /Traer del calco lo que falte/ }).count(), 1, 'una sola siembra (la del editor)')
      assert.ok(await editor(page).getByText(/estaba en el formato anterior/).count(), 'aviso de la hoja anterior')
      let vs = await valores(page)
      for (const t of ['RCB-2 Tarapacá', 'FT VARGS (RCB-1 Calama)', 'Comp. Av. Ejto. Cnl. Lopez', '30 km — Escuadrón de reconocimiento (del Regimiento)', 'D-13 (06:00)', 'D+2 (18:00)', 'PC de la DIV.MEC.-1 — G-3', 'Ejes de aproximación AA-1 a AA-5 y zonas de apresto lejano.'])
        assert.ok(vs.includes(t), `hoja anterior: falta «${t}»`)
      assert.ok(!vs.some((x) => /\[IA/.test(x)), 'sin «[IA — verificar]» en el texto')

      // 🌱 Traer del calco lo que falte.
      await editor(page).getByRole('button', { name: '🌱 Traer del calco lo que falte' }).click()
      await editor(page).getByText(/Se trajo:/).waitFor()
      vs = await valores(page)
      for (const t of ['ERM-8 «ECO» (FICT.)', 'Especial PUEBLO-X (FICT.), Esc. 1:250.000', 'Ver Orden Preparatoria No. 01 y Anexo de Inteligencia.']) assert.ok(vs.includes(t), `armada: falta «${t}»`)

      // Lo que escribe el oficial: sus ideas y un apartado a mano.
      await editor(page).locator('textarea[placeholder^="Ej.: «Tres equipos"]').fill('Tres equipos: ZULU al norte con el RCB-2, TANGO sobre el río y VICTOR con el ERM-8 en el centro. Que informen por radio cada 2 horas.')
      const propia = editor(page).locator('textarea[placeholder^="La … se encuentra en su actual ZR"]')
      await propia.fill('La DIV.MEC.-1 (FICT.) se encuentra en su ZR «PUEBLO-X» con sus efectivos al completo.')

      // 🤖 El pedido a la IA.
      await editor(page).getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).click()
      await editor(page).getByRole('button', { name: '📋 Copiar el pedido' }).click()
      await editor(page).getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
      await editor(page).getByRole('button', { name: /Ver el pedido/ }).click()
      const pedido = await editor(page).locator('textarea[readonly]').inputValue()
      for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'ORDEN DE RECONOCIMIENTO', 'ORGANIZACIÓN DE LA TAREA', 'EXPEDIENTE DEL EJERCICIO', 'ORDEN DEL ESCALÓN SUPERIOR', 'EL EJEMPLO DE LA ESCUELA', 'RC-02-107', 'ERM-8 «ECO» (FICT.)', '"e-antes-1"', 'CÓMO QUIERE EL OFICIAL QUE SE HAGA EL RECONOCIMIENTO', 'TANGO sobre el río', 'VERIFICACIÓN FINAL'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)

      // La respuesta de la IA se aplica sin pisar lo escrito.
      await editor(page).locator('textarea[placeholder^="Pegá acá la respuesta"]').fill('```json\n' + JSON.stringify(respuestaIA()) + '\n```')
      await editor(page).getByRole('button', { name: '✓ Aplicar' }).click()
      await editor(page).getByText(/apartado\(s\) completados/).waitFor()
      assert.ok(await editor(page).getByText('🤖 revisar').count(), 'marca de la IA')
      vs = await valores(page)
      for (const t of ['ZULU', 'TANGO', 'VICTOR', 'Actividades de reconocimiento de ROJO (FICT.) sobre la LS.', 'Duración del reconocimiento 36 hrs.', 'En caso de ataque dar parte inmediatamente al PC.', 'Movimiento motorizado.', 'PC: PUEBLO-X (FICT.).', 'Reconocimiento del AO. PUEBLO-X (FICT.) entre la LF. «TRUENO» y la LS.'])
        assert.ok(vs.includes(t), `respuesta: falta «${t}»`)
      for (const t of ['Especial PUEBLO-X (FICT.), Esc. 1:250.000', 'Ver Orden Preparatoria No. 01 y Anexo de Inteligencia.', 'La DIV.MEC.-1 (FICT.) se encuentra en su ZR «PUEBLO-X» con sus efectivos al completo.'])
        assert.ok(vs.includes(t), `la IA pisó «${t}»`)
      assert.ok(!vs.some((x) => /NO debe pisar/.test(x)), 'sólo completar no pisa')
      await editor(page).getByRole('button', { name: '✓ revisado' }).first().click()
      await capturaEditor(page, path.join(out, `${tag}-editor.png`))

      // 👁️ Vista previa: el Word real dibujado en la pantalla.
      await editor(page).getByRole('button', { name: '👁️ Vista previa' }).click()
      const velo = page.locator('#sid-visor-reco')
      await velo.waitFor()
      await velo.locator('section.docx').first().waitFor({ timeout: 30000 })
      const hoja = await velo.innerText()
      // Membrete táctico (calcos/membrete/v1): somos la DIV.MEC.-1 (la unidad considerada de la Orden).
      for (const t of ['SECRETO', 'I CUERPO DE EJÉRCITO (FICT.)', 'DIV.MEC.-1 (FICT.)', 'EMO/SEC-III', 'ORDEN DE RECONOCIMIENTO No. 01', 'OBJETO', 'CARTA', 'ANEXOS', 'ORGANIZACIÓN DE LA TAREA:', 'EQ. ZULU', 'EQ. TANGO', 'EQ. VICTOR', 'SITUACIÓN.', 'Enemiga.', 'MISIÓN.', 'EJECUCIÓN.', 'Plan de Reconocimiento.', 'Tareas para los equipos de reconocimiento.', 'Equipo ZULU.', 'Obtener información referente a:', 'Plazos en tiempo.', 'Instrucciones de coordinación.', 'APOYO DE SERVICIO.', 'COMANDO Y COMUNICACIONES.', 'EL COMANDANTE DE LA DIV.MEC.-1 (FICT.)', 'Autenticación:', 'Distribución:'])
        assert.ok(hoja.includes(t), `la vista previa no trae «${t}»`)
      assert.ok(!/\[IA\s*[—–-]\s*verificar\]|🤖/.test(hoja), 'la vista previa no trae marcas de la IA')
      assert.ok(!hoja.includes('EL G-3 DE LA UNIDAD'), 'firma el Comandante, no el G-3')
      await page.screenshot({ path: path.join(out, `${tag}-vista-previa.png`), fullPage: false })
      await velo.getByRole('button', { name: '✕ Cerrar' }).click()

      // 📄 Word (formato militar): descarga directa con el contenido de la hoja.
      const descarga = page.waitForEvent('download')
      await editor(page).getByRole('button', { name: '📄 Word (formato militar)' }).click()
      const doc = await descarga
      assert.equal(doc.suggestedFilename(), 'F2P9_Orden_de_Reconocimiento.docx')
      await doc.saveAs(path.join(out, `${tag}-F2P9.docx`))
      await editor(page).getByText(/Word descargado/).waitFor()

      // Se guarda con el ejercicio (como orden) y la carpeta del G-3 la lleva.
      await page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
      const g = await guardado(page, datos.nombre, (x) => x?.g3?.ivr?.esquema === 'reconocimiento-v1' && x.g3.ivr.equipos.some((e) => e.nombre === 'ZULU'))
      const r = g.g3.ivr
      assert.equal(r.esquema, 'reconocimiento-v1')
      assert.deepEqual(r.equipos.map((e) => e.nombre), ['ZULU', 'TANGO', '', 'VICTOR'], 'equipos de antes por su id y el del calco por su elemento')
      assert.ok(!JSON.stringify(r).includes('[IA'), 'sin marcas de la IA guardadas')
      await page.getByRole('button', { name: '← Volver a mis documentos' }).dispatchEvent('click')
      await page.getByRole('button', { name: '👁️ Ver la carpeta' }).dispatchEvent('click')
      const carpeta = await page.frameLocator('iframe[title="vista previa"]').locator('body').innerText()
      for (const t of ['Orden de Reconocimiento', 'ORGANIZACIÓN DE LA TAREA:', 'EQ. ZULU', 'Obtener información referente a:', 'COMANDO Y COMUNICACIONES.'])
        assert.ok(carpeta.includes(t), `la carpeta no trae «${t}»`)
      await page.getByRole('button', { name: '← Volver' }).dispatchEvent('click')
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: guía, matriz anterior leída, siembra del calco, ideas y pedido a la IA, respuesta sin pisar, vista previa del Word real, Word militar, guardar y carpeta.`)
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
