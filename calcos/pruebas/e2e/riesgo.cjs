// La MATRIZ DE ADMINISTRACIÓN DEL RIESGO (F2·P7 y su actualización F6·P3) en la Mesa
// real (Chromium), con un ejercicio FICTICIO (riesgo-ejercicio.js), en escritorio y en
// teléfono:
//   · la guía nueva y el editor de la matriz (no el de renglones);
//   · la hoja guardada con el formato de ANTES se lee: cada renglón es un obstáculo, con
//     lo que decía a la vista;
//   · 🌱 se arma con lo del ejercicio (misión, grupo fecha/hora y fecha de preparación
//     de la Línea de Tiempo, quién la prepara, las tareas de la F2·P3);
//   · el pedido a la IA lleva el expediente, el método del RO-06-01-04 y la matriz;
//   · la respuesta de la IA se aplica (sin pisar) y queda marcada para revisar;
//   · la vista previa y el Word salen con el membrete táctico, SECRETO y la matriz;
//   · se guarda con el ejercicio y se reabre; la F6·P3 parte de la F2·P7.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioRiesgo, respuestaIA } = require('../riesgo-ejercicio.js')

const out = path.resolve(__dirname, '../salidas-riesgo')
fs.mkdirSync(out, { recursive: true })

async function irALaHoja(page, fase = /Analizar la misión/, hoja = /F2·P7.*Matriz de administración del riesgo/) {
  if (!(await page.getByRole('button', { name: '← Volver a mis documentos' }).count())) {
    await page.getByRole('button', { name: /G-3 Operaciones/ }).first().dispatchEvent('click')
    await page.getByRole('button', { name: '📄 Documentos', exact: true }).dispatchEvent('click')
  } else await page.getByRole('button', { name: '← Volver a mis documentos' }).dispatchEvent('click')
  await page.getByRole('button', { name: fase }).first().dispatchEvent('click')
  await page.getByRole('button', { name: hoja }).dispatchEvent('click')
  await page.locator('[data-hoja="matriz-riesgo"]').waitFor({ timeout: 15000 })
}
const editor = (page) => page.locator('[data-hoja="matriz-riesgo"]')
const guardado = async (page, nombre, cond, ms = 8000) => {
  let g = null
  for (let t = 0; t < ms; t += 250) {
    g = await leerGuardado(page, nombre)
    if (cond(g)) return g
    await page.waitForTimeout(250)
  }
  return g
}
async function guardar(page, nombre) {
  await page.getByRole('button', { name: new RegExp(`^📁 ${nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first().dispatchEvent('click')
  await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
}
async function capturaEditor(page, archivo) {
  // El editor vive en un panel con su propia barra: se lo muestra entero un momento.
  await page.evaluate(() => {
    const e = document.querySelector('[data-hoja="matriz-riesgo"]')
    let p = e?.parentElement
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
    const datos = ejercicioRiesgo()
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      await irALaHoja(page)

      // Guía nueva, el editor de la matriz y la hoja de ANTES leída como matriz.
      assert.ok(await page.getByText(/Es la HOJA DE TRABAJO del RO-06-01-04 «Administración del Riesgo» \(Anexo «B»\): una MATRIZ, no una lista/).count(), 'guía nueva')
      assert.equal(await page.getByText('🤖 Trabajar esta hoja con IA').count(), await editor(page).getByText('🤖 Trabajar esta hoja con IA').count(), 'sin el panel de renglones fuera del editor')
      assert.equal(await page.getByRole('button', { name: '⬇️ Word' }).count(), 0, 'sin los botones genéricos de renglones')
      assert.ok(await editor(page).getByText(/estaba en el formato anterior/).count(), 'aviso de la hoja anterior')
      assert.ok(await editor(page).getByText(/Antes decía: Probabilidad «Alta» · Severidad «Alta» · Nivel inicial «Alto» · Riesgo residual «Medio»/).count(), 'lo que decía la hoja anterior')
      assert.equal(await editor(page).locator('textarea').filter({ hasText: /\[IA/ }).count(), 0, 'sin «[IA — verificar]» en el texto')

      // 🌱 Armar con lo del ejercicio.
      await editor(page).getByRole('button', { name: '🌱 Armar con lo del ejercicio' }).click()
      await editor(page).getByText(/Se trajo del ejercicio/).waitFor()
      const valores = await editor(page).locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
      for (const t of ['La DIV.MEC.-1 (FICT.) defiende y fija a las fuerzas enemigas a partir del D (0500) hasta el D+1 (1800) en el AO. PUEBLO-X (FICT.).', 'D (0500)', 'D+1 (1800)', 'D-6 (0600)', 'My. PRUEBA (FICT.), G-3 DE LA DIV.MEC.-1 (FICT.)', 'Defender el AO. PUEBLO-X (FICT.)', 'Ocupar y organizar la posición defensiva', 'Fijar a la brigada enemiga (FICT.)', 'Evacuar a la población civil del AO'])
        assert.ok(valores.includes(t), `armada: falta «${t}»`)

      // El membrete táctico (calcos/membrete/v1): somos la DIV.MEC.-1 (la unidad considerada
      // de la Orden), su escalón superior y su CG; la hora es la de la Línea de Tiempo (fin del
      // análisis de la misión) y el número el 002 del G-3 (su 001 es la Línea de Tiempo).
      const memb = await editor(page).locator('div', { hasText: /^SECRETO/ }).first().innerText()
      for (const t of ['SECRETO', 'I CUERPO DE EJÉRCITO (FICT.)', 'DIV.MEC.-1 (FICT.)', 'CG. PUEBLO-X D-6 (0600)', 'EMO/SEC-III', 'No. 002/XYZ']) assert.ok(memb.includes(t), `membrete sin «${t}»: ${memb}`)
      await capturaEditor(page, path.join(out, `${tag}-armada.png`))

      // 🤖 El pedido a la IA.
      await editor(page).getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).click()
      await editor(page).getByRole('button', { name: '📋 Copiar el pedido' }).click()
      await editor(page).getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
      await editor(page).getByRole('button', { name: /Ver el pedido/ }).click()
      const pedido = await editor(page).locator('textarea[readonly]').inputValue()
      for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'MATRIZ DE ADMINISTRACIÓN DEL RIESGO', 'RO-06-01-04', 'EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR', 'ORDEN DEL ESCALÓN SUPERIOR', 'Orden de operaciones (FICT.)', 'MATT-TCE', 'Figura 6', 'COC', 'CMOC', 'CONDICIONES METEOROLÓGICAS', 'DIV.MEC.-1 (FICT.)', 'D-6 (0600)', 'Evacuar a la población civil del AO', '"t-antes-p1"', '"antes"', '"probabilidadResidual"', 'VERIFICACIÓN FINAL'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)

      // La respuesta de la IA se aplica sin pisar lo escrito.
      await editor(page).locator('textarea[placeholder^="Pegá acá la respuesta"]').fill('```json\n' + JSON.stringify(respuestaIA()) + '\n```')
      await editor(page).getByRole('button', { name: '✓ Aplicar' }).click()
      await editor(page).getByText(/casilla\(s\) completadas/).waitFor()
      assert.ok(await editor(page).getByText(/Lo propuso la IA/).count(), 'marca de la IA')
      const valores2 = await editor(page).locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
      for (const t of ['Reconocimientos en el terreno (FICT.)', 'Accidentes por neblina de 04:30 a 07:30 h durante los reconocimientos en el AO. PUEBLO-X (FICT.)', 'Anexo de Operaciones (FICT.): plan de fortificación por fases.', 'Civiles en los ejes de movimiento del RCB-2 (FICT.)'])
        assert.ok(valores2.includes(t), `respuesta: falta «${t}»`)
      assert.ok(valores2.includes('D-6 (0600)'), 'no pisó la fecha de preparación armada')
      assert.equal(valores2.filter((x) => x === 'Ocupar y organizar la posición defensiva').length, 1, 'la tarea repetida se juntó')
      assert.ok(await editor(page).getByText(/Se juntó una tarea que quedó repetida/).count(), 'aviso de la tarea juntada')
      // Un obstáculo marcado como revisado.
      await editor(page).getByRole('button', { name: '✓ Revisado' }).first().click()

      // Rótulos del formato de la Escuela (1–11).
      await editor(page).getByRole('button', { name: /1 – 11 · formato de la Escuela/ }).click()

      // 👁️ Vista previa: la matriz con el membrete.
      await editor(page).getByRole('button', { name: '👁️ Vista previa' }).click()
      const velo = page.locator('#sid-visor-riesgo')
      await velo.waitFor()
      const marco = velo.frameLocator('iframe')
      const hoja = await marco.locator('body').innerText()
      for (const t of ['SECRETO', 'I CUERPO DE EJÉRCITO (FICT.)', 'CG. PUEBLO-X D-6 (0600)', 'EMO/SEC-III', 'No. 002/XYZ', 'MATRIZ DE ADMINISTRACIÓN DEL RIESGO', '1. MISIÓN O TAREA', '5. TAREA', '10. Implementar controles (como)', '11. DETERMINAR EL NIVEL DE RIESGO GLOBAL', 'RECONOCIMIENTOS EN EL TERRENO (FICT.)', 'EL COMANDANTE DE LA DIV.MEC.-1 (FICT.)'])
        assert.ok(hoja.includes(t), `la vista previa no trae «${t}»`)
      assert.ok(!/\[IA\s*[—–-]\s*verificar\]/.test(hoja), 'la vista previa no trae marcas de la IA')
      assert.equal(await marco.locator('span[style*="border-radius:50%"]').count(), 1, 'un solo nivel encerrado en un círculo')
      await page.screenshot({ path: path.join(out, `${tag}-vista-previa.png`), fullPage: false })
      const descarga = page.waitForEvent('download')
      await velo.getByRole('button', { name: '📄 Word (formato militar)' }).click()
      const doc = await descarga
      assert.equal(doc.suggestedFilename(), 'F2P7_Matriz_de_administracion_del_riesgo.docx')
      await doc.saveAs(path.join(out, `${tag}-F2P7.docx`))
      await velo.getByRole('button', { name: '✕ Cerrar' }).click()

      // Se guarda con el ejercicio (como matriz) y se reabre igual.
      await guardar(page, datos.nombre)
      const g = await guardado(page, datos.nombre, (x) => x?.g3?.riesgo?.esquema === 'riesgo-v1' && x.g3.riesgo.tareas.some((t) => /Reconocimientos/.test(t.tarea)))
      const r = g.g3.riesgo
      assert.equal(r.esquema, 'riesgo-v1')
      assert.equal(r.rotulos, 'eceme')
      const antes = r.tareas.find((t) => t.id === 't-antes')
      assert.equal(antes.tarea, 'Ocupar y organizar la posición defensiva')
      const p1 = antes.peligros[0]
      assert.deepEqual([p1.prob, p1.sev, p1.probRes, p1.sevRes], ['B', 'II', 'D', 'II'])
      assert.ok(p1.controles[0].includes('Ejecuta: Comandantes del RIM-1 (FICT.)'))
      assert.ok(!JSON.stringify(r).includes('[IA'), 'sin marcas de la IA guardadas')
      assert.equal(r.preparacion, 'D-6 (0600)')
      await page.reload()
      await page.waitForTimeout(2500)
      await sembrarYAbrir(page, g)
      await irALaHoja(page)
      const valores3 = await editor(page).locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
      assert.ok(valores3.includes('Reconocimientos en el terreno (FICT.)'), 'reabierta')

      // La carpeta del G-3 lleva la matriz (como tabla) y cuenta la hoja como hecha.
      await page.getByRole('button', { name: '← Volver a mis documentos' }).dispatchEvent('click')
      await page.getByRole('button', { name: '👁️ Ver la carpeta' }).dispatchEvent('click')
      const carpeta = await page.frameLocator('iframe[title="vista previa"]').locator('body').innerText()
      for (const t of ['F2·P7 — Matriz de administración del riesgo', '5. TAREA', 'RECONOCIMIENTOS EN EL TERRENO (FICT.)', 'MODERADO (M)', 'F6·P3 — Matriz de administración del riesgo (actualización)'])
        assert.ok(carpeta.includes(t), `la carpeta no trae «${t}»`)
      await page.getByRole('button', { name: '← Volver' }).dispatchEvent('click')

      // F6·P3: la actualización parte de la F2·P7.
      await irALaHoja(page, /Aprobar el curso de acción propio/, /F6·P3.*Matriz de administración del riesgo \(actualización\)/)
      assert.ok(await page.getByText(/Es la MISMA matriz de la fase II \(F2·P7\)/).count(), 'guía de la actualización')
      await editor(page).getByRole('button', { name: /Partir de la matriz de la fase II/ }).click()
      await editor(page).getByText(/Se trajeron \d+ tarea\(s\) de la F2·P7/).waitFor()
      const d2 = page.waitForEvent('download')
      await editor(page).getByRole('button', { name: '📄 Word (formato militar)' }).click()
      const doc2 = await d2
      assert.equal(doc2.suggestedFilename(), 'F6P3_Matriz_de_administracion_del_riesgo_actualizacion.docx')
      await doc2.saveAs(path.join(out, `${tag}-F6P3.docx`))
      await capturaEditor(page, path.join(out, `${tag}-F6P3.png`))
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: guía, hoja anterior leída, armado, pedido a la IA con expediente y método, respuesta aplicada sin pisar, vista previa y Word con membrete, guardar y reabrir, F6·P3.`)
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
