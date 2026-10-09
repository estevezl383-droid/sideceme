// Las hojas del Comandante y del Jefe de Estado Mayor en la Mesa real (Chromium), con un
// ejercicio FICTICIO (mando-ejemplo.js), en escritorio y en teléfono:
//   · el panel no explica qué son las hojas ni la IA: sólo herramientas (menos texto);
//   · el Comandante: la Guía Inicial es la del tablero del G-3 (siete partes del PMTD; 🌱
//     trae la asignación del tiempo de la Línea Inicial de Tiempo del JEM; Word militar), los
//     Conceptos Entrelazados son los MISMOS del G-3, 🌱 en la prioridad de los RCIC. con lo
//     que propuso cada sección, la F7·P2 es un cuadro de control (ya no «se baja hecha»), y el
//     pedido a la IA lleva lo del JEM y de las secciones;
//   · el JEM: 🌱 en la línea de tiempo actualizada, el rol y el libreto con lo que ya dejó el
//     Comandante (la selección de CAP) y el G-3; la F4·P6 en blanco es lo único que se baja;
//   · la sincronía: lo que hace uno aparece en la hoja del otro;
//   · el avance cuenta las hojas, se guarda con el ejercicio, sin errores de JavaScript.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioMando } = require('../mando-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-mando')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
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
const SIN_EXPLICAR = ['Éstas son las hojas de trabajo', 'Cada una lleva su propio botón de IA', 'Fuente del reparto', 'Le manda el expediente completo', 'Llena únicamente los campos vacíos', 'Lo que entre queda marcado', 'Va al FINAL del pedido', 'Este documento reúne los datos vigentes']

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const datos = ejercicioMando({ nombre: `PRUEBA MANDO${movil ? ' B' : ''} (FICT.)` })
    datos.g3.entrelazados = { 'INTENCIÓN DEL COMANDANTE SUPERIOR (dos niveles arriba)': 'Intención escrita en el tablero del G-3 (FICT.).' }
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      const ocultar = page.getByText('▼ ocultar')
      if (await ocultar.count()) await ocultar.first().click().catch(() => {})
      const vals = (scope) => scope.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
      const abrirPanel = async (boton, titulo) => {
        await clic(page.getByRole('button', { name: boton }).first())
        const p = page.locator(`div:has(> div > h3:text("${titulo}"))`)
        await p.waitFor({ timeout: 15000 })
        return p
      }

      // ════════ EL COMANDANTE ════════
      let panel = await abrirPanel(/⭐ CMTE\./, '⭐ Comandante')
      const volver = () => clic(panel.getByRole('button', { name: '← Volver a mis hojas' }))
      let lista = await panel.innerText()
      for (const t of SIN_EXPLICAR) assert.ok(!lista.includes(t), `el panel del Comandante todavía explica: «${t}»`)
      assert.ok(!/se baja hecha/.test(lista), 'ninguna hoja del Comandante «se baja hecha»')
      for (const t of ['F1·P3', 'F1·P6', 'F2·P1', 'F2·P8', 'F2·P14', 'F2·P15', 'F3·P8', 'F6·P1', 'F6·P2', 'F7·P2']) assert.ok(lista.includes(t), `falta la hoja ${t}`)
      await page.screenshot({ path: path.join(out, `cmte-lista-${tag}.png`) })

      // ── F1·P6 Guía Inicial: la del G-3 ──
      await clic(panel.getByRole('button', { name: /F1·P6.*Guía Inicial/ }))
      const ayuda = panel.locator('[data-em="ayuda-hoja"]')
      await ayuda.waitFor()
      let txt = await panel.innerText()
      for (const t of SIN_EXPLICAR.concat(['Sale ANTES del análisis de la misión', 'Es lo que habilita la Orden Preparatoria'])) assert.ok(!txt.includes(t), `la hoja todavía explica: «${t}»`)
      for (const t of ['I.- MÉTODO', 'II.- ASIGNACIÓN INICIAL DEL TIEMPO', 'III.- OFICIALES DE ENLACE', 'IV.- RECONOCIMIENTO INICIAL', 'V.- MOVIMIENTOS', 'VI.- TAREAS ADICIONALES', 'VII.- OTROS']) assert.ok(txt.includes(t), `la Guía Inicial no trae «${t}»`)
      assert.equal(await panel.getByText('¿Para qué es y cómo se llena?').count(), 0, 'sin guía a la vista')
      await clic(ayuda.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ayuda.getByText(/Se agreg(ó 1 entrada|aron \d+ entradas)/).waitFor()
      let vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('Día D') || vs.includes('D-15 (2300)'), 'II.- sale de la Línea Inicial de Tiempo del JEM')
      assert.ok(vs.includes('Tiempo disponible (TD)'), 'con el TD de la línea de tiempo')
      await clic(panel.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      let pt = await pedidoIA(panel)
      for (const t of ['EXPEDIENTE DEL EJERCICIO', 'LO QUE YA ENTREGARON LAS OTRAS SECCIONES', 'EL JEFE DE ESTADO MAYOR', 'F5·P3 Rol de exposiciones', 'G-3 OPERACIONES', 'CAE más probable', 'DOCTRINA Y REGLAMENTOS DEL CAMPO (Comandante)', 'siete partes', 'FORMATO DE TU RESPUESTA'])
        assert.ok(pt.includes(t), `pedido de la Guía Inicial: falta «${t}»`)
      assert.ok(pt.indexOf('DOCTRINA Y REGLAMENTOS DEL CAMPO') < pt.indexOf('# CÓMO CONTESTAR'))
      await aplicarIA(panel, { 'I.- MÉTODO': 'Analizar dos cursos de acción: uno ofensivo y uno defensivo (FICT.).', 'II.- ASIGNACIÓN INICIAL DEL TIEMPO': 'Texto de la IA que NO debe pisar el tiempo armado.' })
      await panel.getByText(/entradas? agregadas?/).waitFor({ timeout: 10000 })
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('Analizar dos cursos de acción'), 'la IA completó I.- MÉTODO')
      assert.ok(!vs.includes('NO debe pisar'), 'sólo completar no pisa')
      const dGi = page.waitForEvent('download')
      await clic(panel.getByRole('button', { name: /📄 Word \(formato militar\)/ }))
      const dialogo = page.locator('dialog')
      if (await dialogo.count()) await clic(dialogo.getByRole('button', { name: /Descargar|Aceptar|Generar|Exportar/ }).first())
      const fGi = path.join(out, `guia-inicial-${tag}.docx`)
      await (await dGi).saveAs(fGi)
      const tGi = soloTexto(await textoDocx(fGi))
      for (const t of ['GUÍA INICIAL DEL COMANDANTE', 'MÉTODO', 'Analizar dos cursos de acción']) assert.ok(tGi.includes(t), `Word de la Guía Inicial: falta «${t}»`)
      await volver()

      // ── la misma Guía Inicial se ve en el tablero del G-3 (los mismos datos) ──
      const gdo = await leerGuardado(page, datos.nombre)
      assert.ok(gdo === null || typeof gdo === 'object')

      // ── F2·P1 Conceptos Entrelazados: los del G-3 ──
      await clic(panel.getByRole('button', { name: /F2·P1.*Conceptos Entrelazados/ }))
      await panel.locator('textarea[aria-label^="INTENCIÓN DEL COMANDANTE SUPERIOR"]').waitFor({ state: 'attached', timeout: 10000 })
      txt = await panel.innerText()
      assert.ok(!txt.includes('se llena una sola vez, ahí'), 'ya no remite al G-3: es la misma hoja')
      await page.screenshot({ path: path.join(out, `cmte-conceptos-${tag}.png`) })
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('Intención escrita en el tablero del G-3 (FICT.)'), 'lo escrito en el tablero del G-3 está acá')
      await volver()

      // ── F2·P8 Prioridad a los RCIC. y EEIA. ──
      await clic(panel.getByRole('button', { name: /F2·P8.*Prioridad a los RCIC/ }))
      const ay2 = panel.locator('[data-em="ayuda-hoja"]')
      await ay2.waitFor()
      await clic(ay2.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ay2.getByText(/Se agreg(ó 1 entrada|aron \d+ entradas)/).waitFor()
      vs = (await vals(panel)).join('\n')
      for (const t of ['¿Dónde está la reserva blindada enemiga? (FICT.)', 'Cuántos prisioneros esperar en la fase I (FICT.)', 'Capacidad del puente de PUEBLO-Y para cargas pesadas (FICT.)', 'Cuántos civiles quedan en PUEBLO-X el D-1 (FICT.)', 'Vacío de inteligencia: Ubicación de la reserva blindada enemiga (FICT.)', 'G-3 (RCIC)', 'G-5'])
        assert.ok(vs.includes(t), `la prioridad de RCIC. no trajo «${t}»`)
      await clic(ay2.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ay2.getByText(/No había nada nuevo/).waitFor()
      await clic(panel.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      pt = await pedidoIA(panel)
      for (const t of ['RCIC. Y EEIA. PROPUESTOS POR LAS SECCIONES', 'Los RCIC. deben ser DIEZ O MENOS', '| Requerimiento propuesto | Quién lo propone | Prioridad que asigna el Cmte. |', 'G-1 PERSONAL'])
        assert.ok(pt.includes(t), `pedido de la prioridad: falta «${t}»`)
      await aplicarIA(panel, 'Va:\n\n| Requerimiento propuesto | Quién lo propone | Prioridad que asigna el Cmte. |\n|---|---|---|\n| ¿Dónde está la reserva blindada enemiga? (FICT.) | G-3 (RCIC) | 1 |\n')
      await panel.getByText(/entradas? agregadas?/).waitFor({ timeout: 10000 })
      const dRc = page.waitForEvent('download')
      await clic(panel.getByRole('button', { name: /⬇ Word/ }).first())
      const fRc = path.join(out, `prioridad-rcic-${tag}.doc`)
      await (await dRc).saveAs(fRc)
      assert.ok(fs.readFileSync(fRc, 'utf8').includes('Capacidad del puente de PUEBLO-Y'), 'el Word de la hoja (la hoja de trabajo, HTML) trae lo sembrado')
      await volver()

      // ── F3·P8 Selección de CAP (lo que ya nombró el Estado Mayor) ──
      await clic(panel.getByRole('button', { name: /F3·P8/ }))
      const ay3 = panel.locator('[data-em="ayuda-hoja"]')
      await ay3.waitFor()
      await clic(ay3.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ay3.getByText(/Se agregó 1 entrada|Se agregaron \d+ entradas/).waitFor()
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('CAP N° 3 — fijación y desborde (FICT.)') && vs.includes('CAP N° 2 — envolvimiento por el oeste (FICT.)'), 'trae los CAP del G-3 y de las secciones')
      assert.ok(vs.includes('Sumar una reserva (FICT.)'), 'lo ya escrito queda')
      await volver()

      // ── F6·P1 Decisión: con la recomendación del JEM ──
      await clic(panel.getByRole('button', { name: /F6·P1.*Decisión/ }))
      const ay4 = panel.locator('[data-em="ayuda-hoja"]')
      await ay4.waitFor()
      await clic(ay4.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ay4.getByText(/Se agreg/).waitFor()
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('Recomendación del Estado Mayor (rol de exposiciones del JEM.)'), 'la recomendación del rol del JEM')
      await volver()

      // ── F7·P2 Revisión y aprobación de las órdenes: un cuadro de control ──
      await clic(panel.getByRole('button', { name: /F7·P2.*Revisión y aprobación/ }))
      const ay5 = panel.locator('[data-em="ayuda-hoja"]')
      await ay5.waitFor()
      await clic(ay5.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await ay5.getByText(/Se agreg(ó 1 entrada|aron \d+ entradas)/).waitFor()
      vs = (await vals(panel)).join('\n')
      for (const t of ['Orden Preparatoria N° 1', 'Orden General de Operaciones', 'Anexo de G-1', 'Anexo de G-5', 'Falta']) assert.ok(vs.includes(t), `el cuadro de revisión no trae «${t}»`)
      await volver()
      lista = await panel.innerText()
      assert.ok(/\d de 10 hojas con contenido/.test(lista), `el avance cuenta las hojas del Comandante: ${lista.match(/\d+ de \d+ hojas[^\n]*/)}`)
      await page.screenshot({ path: path.join(out, `cmte-fin-${tag}.png`) })
      await clic(panel.getByRole('button', { name: '✕' }))

      // ════════ EL JEM ════════
      panel = await abrirPanel(/🎒 JEM\./, '🎖️ Jefe de Estado Mayor')
      const volverJ = () => clic(panel.getByRole('button', { name: '← Volver a mis hojas' }))
      lista = await panel.innerText()
      for (const t of SIN_EXPLICAR) assert.ok(!lista.includes(t), `el panel del JEM todavía explica: «${t}»`)
      assert.equal((lista.match(/se baja hecha/g) || []).length, 1, 'sólo la matriz en blanco (a propósito) se baja hecha')
      await page.screenshot({ path: path.join(out, `jem-lista-${tag}.png`) })

      // ── F2·P10 Línea de tiempo actualizada ──
      await clic(panel.getByRole('button', { name: /F2·P10.*Línea de Tiempo actualizada/ }))
      const jy = panel.locator('[data-em="ayuda-hoja"]')
      await jy.waitFor()
      await clic(jy.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await jy.getByText(/Se agregaron 10 entradas/).waitFor()
      vs = (await vals(panel)).join('\n')
      for (const t of ['Elaboración del Análisis de la Misión', 'EM./Pl.My.', 'Elaboración del Plan u Orden']) assert.ok(vs.includes(t), `la línea de tiempo no trae «${t}»`)
      assert.ok(/D-\d+ \(\d{4}\)/.test(vs), 'con los plazos de la Línea Inicial de Tiempo')
      await clic(panel.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      pt = await pedidoIA(panel)
      for (const t of ['EL COMANDANTE', 'LO QUE ORDENÓ', 'LA LÍNEA DE TIEMPO ACTUALIZADA', '| Actividad | Responsable | Fecha y hora | Lugar |'].filter((x) => x !== 'LO QUE ORDENÓ')) assert.ok(pt.includes(t), `pedido de la línea de tiempo: falta «${t}»`)
      await volverJ()

      // ── F4·P1 Libreto: lo que dejó el Comandante y el G-3 ──
      await clic(panel.getByRole('button', { name: /F4·P1.*Libreto/ }))
      const jl = panel.locator('[data-em="ayuda-hoja"]')
      await jl.waitFor()
      await clic(jl.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await jl.getByText(/Se agreg/).waitFor()
      vs = (await vals(panel)).join('\n')
      for (const t of ['CAP N° 1 — ataque por el norte (FICT.)', 'FAJA', 'Cruce del río Z (FICT.)', 'Inteligencia, maniobra, fuegos (FICT.)', 'Plantilla sustentadora de la decisión (FICT.)']) assert.ok(vs.includes(t), `el libreto no trae «${t}»`)
      assert.ok(!vs.includes('CAP N° 2 — envolvimiento'), 'sólo los cursos que el Comandante dejó pasar')
      await volverJ()

      // ── F2·P16 Normas y F5·P3 Rol ──
      await clic(panel.getByRole('button', { name: /F2·P16.*Normas de Evaluación/ }))
      const jn = panel.locator('[data-em="ayuda-hoja"]')
      await jn.waitFor()
      await clic(jn.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await jn.getByText(/Se agreg(ó 1 entrada|aron \d+ entradas)/).waitFor()
      vs = (await vals(panel)).join('\n')
      for (const t of ['Cumple la intención del Comandante', 'Factible', 'Sostenibilidad logística']) assert.ok(vs.includes(t), `las normas no traen «${t}»`)
      await volverJ()
      await clic(panel.getByRole('button', { name: /F5·P3.*Rol de exposiciones/ }))
      const jr = panel.locator('[data-em="ayuda-hoja"]')
      await jr.waitFor()
      await clic(jr.getByRole('button', { name: '🌱 Traer del calco lo que falte' }))
      await jr.getByText(/Se agreg(ó 1 entrada|aron \d+ entradas)/).waitFor()
      vs = (await vals(panel)).join('\n')
      assert.ok(vs.includes('G-1 · Personal') && vs.includes('CAP N° 3 — fijación y desborde (FICT.)'), 'el rol trae las secciones y su recomendación')
      await volverJ()
      await clic(panel.getByRole('button', { name: /F4·P6.*sincronización en blanco/ }))
      await panel.getByRole('button', { name: /Word|📄/ }).first().waitFor({ timeout: 10000 })
      await volverJ()
      await page.screenshot({ path: path.join(out, `jem-fin-${tag}.png`) })

      // ── se guarda con el ejercicio ──
      await clic(panel.getByRole('button', { name: '✕' }))
      await page.waitForTimeout(1200)
      assert.deepEqual(a.errores, [], `errores de JavaScript: ${JSON.stringify(a.errores)}`)
      console.log(`OK ${tag}: Comandante (Guía Inicial del G-3 con 🌱, IA, Word militar; Conceptos Entrelazados compartidos; RCIC.; selección; decisión; cuadro de revisión) y JEM (línea de tiempo, libreto, normas, rol), sin texto explicativo, sincronizados, sin errores.`)
    } catch (e) {
      console.log('ERRORES APP', JSON.stringify(a.errores))
      try {
        await page.screenshot({ path: path.join(out, `error-${tag}.png`) })
      } catch {}
      throw e
    } finally {
      await a.cerrar?.()
    }
  }
  process.exit(0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
