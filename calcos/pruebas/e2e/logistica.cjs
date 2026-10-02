// El módulo de LOGÍSTICA del G-4 en la Mesa real (Chromium), con un ejercicio FICTICIO
// (logistica-ejemplo.js), en escritorio y en teléfono:
//   · pestaña «▣ ASDI» → PASO A PASO: 1 entender (ASDI, ARCE, esquema en profundidad);
//     2 proponer las áreas A y B (en escritorio se TRAZAN en la carta con el botón del
//     asistente y quedan con su letra; en el teléfono vienen trazadas); 3 verificar los
//     datos generales (tamaño, distancia de seguridad desde la LPR, DMA) y acostar las
//     medidas en la carta; 4 evaluar con la matriz de la Escuela (lo medido, lo del
//     oficial, la IA sin pisar lo impositivo), conclusión y Word; 5 elegir el área;
//   · «📋 Mis hojas» → F1·P3 Apreciación de Logística: 🌱 trae del calco, de la evaluación
//     y de las otras hojas del G-4; ideas; pedido a la IA; respuesta sin pisar; vista
//     previa del Word militar; Word. F2·P13 parte de la F1·P3. F7·P2 Matriz de
//     sincronización: fases del COA, concepto por fase, calco, nivel de amenaza, IA, Word;
//   · el avance cuenta bien las hojas; se guarda con el ejercicio; sin errores de JS.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir, leerGuardado, estadoReact, aPantalla } = require('./navegador.js')
const { ejercicioLogistica, respuestaEval, respuestaASL, respuestaMatriz, AREA_A, AREA_B } = require('../logistica-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-logistica')
fs.mkdirSync(out, { recursive: true })
const paso = (page) => page.locator('[data-g4="paso-a-paso"]')
const opsDe = (page) => estadoReact(page, (v) => (v && Array.isArray(v.zonasLog) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify(v)) : undefined))
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
async function abrirPaso(page, n) {
  const b = paso(page).locator(`[data-paso="${n}"] > button`).first()
  if ((await b.getAttribute('aria-expanded')) !== 'true') await clic(b)
}
async function pedidoIA(scope, page) {
  await clic(scope.getByRole('button', { name: '📋 Copiar el pedido' }))
  await scope.getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
  await clic(scope.getByRole('button', { name: /Ver el pedido/ }))
  return scope.locator('textarea[readonly]').inputValue()
}
async function aplicarIA(scope, json) {
  await scope.locator('textarea[placeholder^="Pegá acá la respuesta"]').fill('```json\n' + JSON.stringify(json) + '\n```')
  await clic(scope.getByRole('button', { name: '✓ Aplicar' }))
}
async function trazar(page, coords) {
  await page.evaluate(() => (window.__lm2d = window.__mapa2d))
  const pts = await aPantalla(page, coords)
  for (const [x, y] of pts) {
    await page.mouse.click(x, y)
    await page.waitForTimeout(250)
  }
  await clic(paso(page).getByRole('button', { name: '✓ Cerrar el área' }))
  await page.waitForTimeout(800)
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioLogistica({ conPropuestas: movil })
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      const ocultar = page.getByText('▼ ocultar')
      if (await ocultar.count()) await ocultar.first().click().catch(() => {})
      await clic(page.getByRole('button', { name: /G-4 Logística/ }).first())
      await paso(page).waitFor({ timeout: 15000 })

      // ── 1 · Entender ──
      await abrirPaso(page, 1)
      for (const t of ['ASDI — Área de Servicios de la División', 'ARCE — Área de Retaguardia del Cuerpo de Ejército', 'Entonces, ¿cuál es la diferencia?', 'mínimo 12 km', 'mínimo 25 km', 'Zona de Etapas'])
        assert.ok(await paso(page).getByText(t, { exact: false }).count(), `paso 1: falta «${t}»`)

      // ── 2 · Proponer las áreas A y B ──
      await abrirPaso(page, 2)
      if (!movil) {
        await page.evaluate(([A, B]) => {
          const pts = [...A, ...B]
          const lat = pts.map((p) => p[1])
          const lng = pts.map((p) => p[0])
          window.__mapa2d.fitBounds([[Math.min(...lat) - 0.02, Math.min(...lng) - 0.02], [Math.max(...lat) + 0.02, Math.max(...lng) + 0.02]], { paddingTopLeft: [60, 160], paddingBottomRight: [420, 120], animate: false })
        }, [AREA_A, AREA_B])
        await page.waitForTimeout(600)
        for (const [letra, area] of [['A', AREA_A], ['B', AREA_B]]) {
          await clic(paso(page).getByRole('button', { name: `▣ Trazar el Área ${letra}` }))
          await page.waitForTimeout(400)
          await trazar(page, area)
          const o = await esperar(page, async () => {
            const x = await opsDe(page)
            return x?.zonasLog?.some((z) => z.propuesta === letra) ? x : null
          })
          assert.ok(o, `el Área ${letra} quedó trazada con su letra`)
          const z = o.zonasLog.find((z) => z.propuesta === letra)
          assert.equal(z.zona, 'asdi')
          assert.ok(z.coords.length >= 4)
        }
      }
      assert.ok(await paso(page).getByText(/2 propuesta\(s\)/).count(), 'dos propuestas')

      // ── 3 · Verificar ──
      await abrirPaso(page, 3)
      const ver = paso(page).locator('[data-g4="verificacion"]')
      await ver.waitFor()
      const tv = await ver.innerText()
      for (const t of ['Área A', 'Área B', 'Tamaño', 'Distancia de seguridad', 'Distancia máxima de apoyo', 'de la LPR', 'km²']) assert.ok(tv.includes(t), `verificación: falta «${t}»`)
      assert.ok(/1[56],\d km de la LPR/.test(tv), 'el Área A queda a unos 16 km de la LPR')
      assert.ok(!/✗/.test(tv.split('Distancia máxima')[0].split('Distancia de seguridad')[1] || ''), 'las dos cumplen la distancia de seguridad')
      await clic(paso(page).getByRole('button', { name: '🗺️ Acostar las medidas en la carta' }))
      await page.waitForTimeout(800)
      assert.ok(await page.getByText(/distancia de seguridad mínima/).count(), 'la línea de seguridad dibujada en la carta')
      assert.ok(await page.getByText(/DMA Área A/).count(), 'el anillo de la DMA en la carta')
      await page.screenshot({ path: path.join(out, `${tag}-medidas.png`) })

      // ── 4 · Evaluar ──
      await abrirPaso(page, 4)
      const celda = (id) => paso(page).locator(`[data-celda="${id}"]`)
      assert.match(await celda('m_dma|A').innerText(), /✔/, 'DMA del Área A medida: reúne')
      assert.match(await celda('s_distSeg|B').innerText(), /✔/, 'seguridad del Área B medida: reúne')
      assert.match(await celda('m_cerrado|A').innerText(), /✔/, 'apoyo cerrado: la A (comparando)')
      await clic(celda('t_red|A'))
      await clic(celda('t_red|B'))
      await clic(celda('t_red|B'))
      await page.waitForTimeout(300)
      assert.match(await celda('t_red|A').innerText(), /✔.*👤/s, 'el oficial marcó la A')
      assert.doesNotMatch(await celda('t_red|B').innerText(), /✔/, 'el oficial marcó que la B no reúne')
      await paso(page).locator('textarea[placeholder^="Ej.: «Prefiero la A"]').fill('Prefiero la A porque queda sobre el EPA y detrás del RI-1 (FICT.).')
      await clic(paso(page).getByRole('button', { name: '🤖 Evaluar las áreas con IA' }))
      const pe = await pedidoIA(paso(page), page)
      for (const t of ['Sos OFICIAL DE ESTADO MAYOR', 'EVALUACIÓN DE LAS ÁREAS PROPUESTAS', 'EXPEDIENTE DEL EJERCICIO', 'LO QUE LA MESA MIDIÓ EN EL CALCO', 'Distancia de seguridad', 'MEDIDO EN EL CALCO', 'DECIDIDO POR EL OFICIAL', 'MANIOBRA', 'SITUACIÓN LOGÍSTICA', 'Prefiero la A porque queda sobre el EPA', 'VERIFICACIÓN FINAL', '"evaluacion"'])
        assert.ok(pe.includes(t), `el pedido de la evaluación no trae «${t}»`)
      await aplicarIA(paso(page), respuestaEval())
      await paso(page).getByText(/casilla\(s\) evaluada\(s\) por la IA/).waitFor()
      assert.match(await celda('t_cubiertas|A').innerText(), /✔.*🤖/s, 'la IA evaluó cubiertas')
      assert.match(await celda('s_distSeg|A').innerText(), /✔/, 'la IA no cambió lo impositivo medido')
      assert.match(await celda('t_red|B').innerText(), /👤/, 'la IA no cambió lo del oficial')
      const concl = await paso(page).locator('textarea[aria-label="Conclusión de la evaluación"]').inputValue()
      assert.ok(/LAS ÁREAS A Y B TIENEN CONDICIONES/.test(concl), 'conclusión con la forma de la Escuela')
      const dEval = page.waitForEvent('download')
      await clic(paso(page).getByRole('button', { name: '📄 Evaluación (Word)' }))
      const fEval = path.join(out, `${tag}-evaluacion.docx`)
      await (await dEval).saveAs(fEval)
      const xEval = await textoDocx(fEval)
      for (const t of ['EVALUACIÓN DE LAS ÁREAS PROPUESTAS', 'MANIOBRA', 'Seguridad del flujo', 'ÁREA A', 'ÁREA B', 'w:fill="FF0000"', 'SECRETO', 'VERIFICACIÓN DE LOS DATOS GENERALES', 'LAS ÁREAS A Y B TIENEN CONDICIONES', 'EL G-4 DE LA DIV.MEC.-1 (FICT.)'])
        assert.ok(xEval.includes(t), `el Word de la evaluación no trae «${t}»`)
      await paso(page).screenshot({ path: path.join(out, `${tag}-paso4.png`) }).catch(() => {})

      // ── 5 · Elegir ──
      await abrirPaso(page, 5)
      await clic(paso(page).getByRole('button', { name: '✔ Elegir el Área A' }))
      const o5 = await esperar(page, async () => {
        const x = await opsDe(page)
        return x?.zonasLog?.find((z) => z.propuesta === 'A')?.elegida ? x : null
      })
      assert.ok(o5, 'el Área A quedó elegida en el calco')
      assert.ok(!o5.zonasLog.find((z) => z.propuesta === 'B').elegida, 'la B sigue propuesta')
      assert.ok(await paso(page).getByText(/Área A elegida/).count(), 'aviso de elegida')

      // ── 📋 Mis hojas → F1·P3 Apreciación de Logística ──
      await clic(page.getByRole('button', { name: '📋 Mis hojas' }))
      await clic(page.getByRole('button', { name: /F1·P3.*Apreciación Activa de LOGÍSTICA/ }))
      const asl = page.locator('[data-hoja="apreciacion-logistica"]')
      await asl.waitFor({ timeout: 15000 })
      assert.equal(await page.getByText('Este documento reúne los datos vigentes del ejercicio.').count(), 0, 'ya no es una hoja que «se baja hecha»')
      await clic(asl.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await asl.getByText(/Se trajo:/).waitFor()
      const vals = () => asl.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
      let vs = (await vals()).join('\n')
      for (const t of ['Apoyar logísticamente la defensa del AO. PUEBLO-X (FICT.)', 'Desplegar el Batallón Logístico en el ASDI (FICT.)', 'Los elementos de apoyo de servicio de combate de la DIV.MEC.-1 (FICT.)', 'El CE mantiene el ARCE en su ubicación actual (FICT.)', 'LAS ÁREAS A Y B TIENEN CONDICIONES', 'Se elige el Área A', 'EPA:', 'CAP N° 1 — defensa en posición (FICT.)', 'Apoyo centralizado desde una sola área (FICT.).', 'Abastecimiento Clase IV', 'Especial PUEBLO-X (FICT.), Esc. 1:250.000'])
        assert.ok(vs.includes(t), `apreciación armada: falta «${t}»`)
      await asl.locator('textarea[placeholder^="Ej.: «El problema es la Clase III"]').fill('El problema es la Clase III: el EPA es largo. Prefiero el CAP N° 1.')
      await clic(asl.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pa = await pedidoIA(asl, page)
      for (const t of ['APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA', 'EXPEDIENTE DEL EJERCICIO', 'LO QUE LA MESA MIDIÓ EN EL CALCO', 'LA EVALUACIÓN DE LAS ÁREAS QUE YA HIZO EL G-4', 'ÁREA ELEGIDA: Área A', 'DOCTRINA DE LA ESCUELA', 'El problema es la Clase III', '"eleccionArea"', 'VERIFICACIÓN FINAL'])
        assert.ok(pa.includes(t), `el pedido de la apreciación no trae «${t}»`)
      await aplicarIA(asl, respuestaASL())
      await asl.getByText(/apartado\(s\) completados por la IA/).waitFor()
      vs = (await vals()).join('\n')
      assert.ok(vs.includes('El CAP N° 1 — defensa en posición (FICT.) es el mejor apoyado'), 'la IA completó V.- B.-')
      assert.ok(vs.includes('Disponibilidad de 40 camiones (FICT.)'), 'la IA completó el análisis del CAP por su nombre')
      assert.ok(!vs.includes('NO debe pisar'), 'sólo completar no pisa')
      assert.ok(await asl.getByText('🤖 revisar').count(), 'marca de la IA')
      await clic(asl.getByRole('button', { name: '👁️ Vista previa' }))
      const velo = page.locator('#sid-visor-log')
      await velo.waitFor()
      await velo.locator('section.docx').first().waitFor({ timeout: 30000 })
      const hoja = await velo.innerText()
      for (const t of ['SECRETO', 'APRECIACIÓN DE SITUACIÓN DE LOGÍSTICA', 'OBJETO', 'MISIÓN.', 'SITUACIÓN Y CONSIDERACIONES LOGÍSTICAS.', 'ANÁLISIS.', 'Elección del área de apoyo logístico.', 'COMPARACIÓN.', 'CONCLUSIONES Y RECOMENDACIONES.', 'EL G-4 DE LA DIV.MEC.-1 (FICT.)'])
        assert.ok(hoja.includes(t), `la vista previa no trae «${t}»`)
      assert.ok(!/🤖|\[IA/.test(hoja), 'sin marcas de la IA en el Word')
      await page.screenshot({ path: path.join(out, `${tag}-asl-vista-previa.png`) })
      await clic(velo.getByRole('button', { name: '✕ Cerrar' }))
      const dAsl = page.waitForEvent('download')
      await clic(asl.getByRole('button', { name: '📄 Word (formato militar)' }))
      const docAsl = await dAsl
      assert.equal(docAsl.suggestedFilename(), 'F1P3_Apreciacion_de_Logistica.docx')
      await docAsl.saveAs(path.join(out, `${tag}-F1P3.docx`))

      // F2·P13: parte de la F1·P3.
      await clic(page.getByRole('button', { name: '← Volver a mis hojas' }))
      await clic(page.getByRole('button', { name: /F2·P13.*actualizada/ }))
      await asl.waitFor()
      await clic(asl.getByRole('button', { name: '📋 Partir de la F1·P3 (sin pisar)' }))
      vs = (await vals()).join('\n')
      assert.ok(vs.includes('El CAP N° 1 — defensa en posición (FICT.) es el mejor apoyado'), 'la F2·P13 parte de la F1·P3')

      // F7·P2: Matriz de sincronización logística.
      await clic(page.getByRole('button', { name: '← Volver a mis hojas' }))
      await clic(page.getByRole('button', { name: /F7·P2.*Matriz de sincronización logística/ }))
      const mz = page.locator('[data-hoja="matriz-sincronizacion-logistica"]')
      await mz.waitFor()
      await clic(mz.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await mz.getByText(/Se trajo:/).waitFor()
      const vm = async () => (await mz.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))).join('\n')
      let m = await vm()
      for (const t of ['FASE I — OCUPACIÓN (FICT.)', 'Abastecimiento Clase IV, Abastecimiento Clase V', 'RI-1 «ALFA», RCB-2 «BRAVO» (FICT.)', 'EPA:', 'EPE:', 'ARCE 1'])
        assert.ok(m.includes(t), `matriz armada: falta «${t}»`)
      await clic(mz.getByRole('button', { name: /^FASE II$/ }))
      await clic(mz.getByRole('button', { name: 'Nivel II', exact: true }))
      m = await vm()
      assert.ok(m.includes('Nivel II: Diversión y sabotaje'), 'nivel de amenaza de la fase II')
      await clic(mz.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      const pm = await pedidoIA(mz, page)
      for (const t of ['MATRIZ DE SINCRONIZACIÓN LOGÍSTICA', 'LO QUE YA RESOLVIÓ EL G-4 EN SUS OTRAS HOJAS', 'NIVEL DE AMENAZA', '"celdas"', 'VERIFICACIÓN FINAL']) assert.ok(pm.includes(t), `el pedido de la matriz no trae «${t}»`)
      await aplicarIA(mz, respuestaMatriz())
      await mz.getByText(/casilla\(s\) completadas por la IA/).waitFor()
      await clic(mz.getByRole('button', { name: /^FASE I$/ }))
      m = await vm()
      assert.ok(m.includes('Prioridad de movimiento: Cl V hacia el RCB-2 (FICT.).'), 'la IA completó el transporte')
      assert.ok(m.includes('D-5 (0600)'), 'la IA completó el desde de la fase I')
      assert.ok(!m.includes('NO debe pisar'), 'la IA no pisó el enfoque del concepto')
      const dM = page.waitForEvent('download')
      await clic(mz.getByRole('button', { name: '📄 Matriz (Word)' }))
      const fM = path.join(out, `${tag}-matriz.docx`)
      await (await dM).saveAs(fM)
      const xM = await textoDocx(fM)
      for (const t of ['MATRIZ DE SINCRONIZACIÓN LOGÍSTICA', 'FASE I — OCUPACIÓN (FICT.)', 'DESDE D-5 (0600)', 'ABASTECIMIENTO', 'NIVEL DE AMENAZA EN EL ÁREA DE RETAGUARDIA', 'Eje Principal de Abastecimiento', 'w:orient="landscape"', 'EL G-4 DE LA DIV.MEC.-1 (FICT.)'])
        assert.ok(xM.includes(t), `el Word de la matriz no trae «${t}»`)
      await mz.screenshot({ path: path.join(out, `${tag}-matriz.png`) }).catch(() => {})

      // El avance cuenta las tres hojas de logística y nada más.
      await clic(page.getByRole('button', { name: '← Volver a mis hojas' }))
      const avance = await page.getByText(/hojas con contenido/).first().innerText()
      const hechas = Number((avance.match(/(\d+) de \d+ hojas/) || [])[1])
      assert.equal(hechas, 6, `avance: ${avance} (F2·P3, F2·P6, F5·P1, F1·P3, F2·P13 y F7·P2)`)
      // Se guarda con el ejercicio.
      await clic(page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first())
      await clic(page.getByRole('button', { name: /Guardar todo/ }))
      const g = await esperar(page, async () => {
        const x = await leerGuardado(page, datos.nombre)
        return x?.hojasG?.g4?.matrizSinc?.esquema === 'matriz-sinc-log-v1' && x.hojasG.g4.evalAreas?.elegida ? x : null
      })
      assert.ok(g, 'guardado con el ejercicio')
      assert.equal(g.hojasG.g4.aprecActiva.esquema, 'aprec-log-v1')
      assert.equal(g.ops.zonasLog.find((z) => z.propuesta === 'A').elegida, true)
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: paso a paso (entender, proponer${movil ? '' : ' trazando en la carta'}, verificar y acostar las medidas, evaluar con IA sin pisar, Word, elegir), Apreciación (calco, evaluación, hojas, ideas, IA, vista previa y Word militar), F2·P13, Matriz (fases, concepto, calco, amenaza, IA, Word), avance y guardado.`)
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
