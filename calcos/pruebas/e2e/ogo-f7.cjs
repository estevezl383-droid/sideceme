// 📜 La F7·P1 «Orden General de Operaciones» con la forma de la Escuela (index-ogo-20261029.js), en la Mesa real
// (Chromium), escritorio y teléfono. El caso de Sergio (27-10-2026): la OGO que bajó la Mesa estaba incompleta y mal
// numerada («I. Encabezamiento», «III. I.- SITUACIÓN», «B. 1 Curso de acción…»).
//   · la hoja guardada con las claves de ANTES abre con lo escrito en las casillas de ahora;
//   · ya no está el aviso «La OPORD completa… se baja desde Mesa EM»;
//   · 🌱 trae del Estado Mayor lo que falta (la intención inextensa del Comandante, la maniobra del CAP por fase, las
//     tareas de cada unidad, las instrucciones de coordinación) sin pisar lo escrito;
//   · 🤖 el pedido lleva el formato de la Escuela y lo que la Mesa ya tiene;
//   · el Word «F7P1_Orden_General_de_Operaciones» con la forma de la Escuela, leído;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/ogo-f7.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto, HOJA } = require('../concepto-ejemplo.js')
const X = require('../cap-carta-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-ogo-f7')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const textoXml = (xml) => xml.replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
const leerOpord = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.opord && typeof v.opord === 'object' && v.concepto ? JSON.parse(JSON.stringify(v.opord)) : undefined))

// Lo que había guardado la F7·P1 de antes (claves viejas).
const ANTES = {
  OBJETO: 'El CE-I en la ejecución de Operaciones Defensivas (FICT.).',
  CARTA: 'TRITÓN (FICT.), Esc. 1:250.000.',
  'A. Fuerzas enemigas': 'SATURNO (FICT.) emplea dos divisiones de ejército en primer escalón.',
  'A.1 Curso de acción más PROBABLE': 'SATURNO ataca en dos escalones por la AA-1 (FICT.).',
  'A.2 Curso de acción más PELIGROSO': 'La VI DE envuelve por el río SAJAMA (FICT.).',
  Misión: 'El CE-I defiende el AO LAUCA a partir del D (0400) hasta el D+15 (1800), con el propósito de impedir que SATURNO penetre por el valle del río LAUCA (FICT.).',
}

;(async () => {
  const { leerRespuesta } = await import('../../cap-propios/v1/carta-ia.mjs')
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1500, alto: movil ? 844 : 1000, movil })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const tag = movil ? 'movil' : 'escritorio'
    try {
      const ej = ejercicioConcepto({ nombre: 'PRUEBA OGO F7·P1 CE-I (FICT.)' })
      const L = leerRespuesta(X.RESPUESTA_TEXTO, { unidades: ej.unidades, ops: ej.ops, cmoc: ej.cmoc, ordenSup: ej.ordenSup, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO, efectos: X.EFECTOS, plan: { blancos: [] } })
      ej.fasesCOA = { propio: L.caps[1].fases, enemigo: [] }
      ej.ordenSup = { ...ej.ordenSup, unidad: 'CE-I', escalonSuperior: 'FF.TT.T.O.', comunicaciones: 'IEC «ANGEL» (FICT.) en vigor a partir del D-5 (1800).' }
      ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
      ej.g3 = {
        concepto: HOJA,
        coa: { 'Denominación del CAP': 'CAP 1 — Defensa de área', 'Enunciado completo del curso de acción': 'El CE-I defiende en el AO LAUCA con la DIV MEC-2 como esfuerzo principal sobre la AA-1.' },
        rcic: [{ 'Tipo (RCIC / EEIA)': 'RCIC', Requerimiento: '¿Empleará el enemigo el paso Ungallire antes del D+1 (FICT.)?' }],
        controlOrden: { 'Tipo de ensayo (completo · reducido · sobre maqueta · sobre carta · de mando)': 'Ensayo de comandantes sobre maqueta el D-5 (0900) (FICT.)' },
        opord: { ...ANTES },
      }
      ej.hojasG = { ...(ej.hojasG || {}), cmte: { intencion: { 'Propósito ampliado': 'Detener al primer escalón de la VI DE al oeste de la LDE-2 (FICT.)', 'Tareas clave': '- Fijar al primer escalón enemigo al oeste de la LF «PUMA»\n- Consolidar el plan de barreras', 'Estado Final Deseado': 'el CE-I con su poder de combate preservado sobre la LDE-2' } } }
      await sembrarYAbrir(page, ej)
      const ocultar = page.getByText('▼ ocultar')
      if (await ocultar.count()) await ocultar.first().click().catch(() => {})

      await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
      await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
      await clic(page.getByRole('button', { name: /Elaborar planes y órdenes/ }).first())
      await clic(page.getByRole('button', { name: /F7·P1.*Orden General de Operaciones/ }).first())
      await page.getByText('III.- A.- 1.- Maniobra').first().waitFor({ timeout: 10000 })
      for (const t of ['ORGANIZACIÓN DE LA TAREA', 'I.- A.- 1.- Curso de acción más probable', 'III.- Intención del Comandante', 'III.- D.- Instrucciones de coordinación', 'V.- A.- Comando'])
        assert.ok(await page.getByText(t).count(), `falta la casilla «${t}»`)
      assert.equal(await page.getByText('A.1 Curso de acción más PROBABLE').count(), 0, 'sin las claves de antes')
      assert.equal(await page.getByText(/La OPORD completa con su matriz de sincronización/).count(), 0, 'sin el aviso que mandaba a otro documento')
      let txt = (await page.locator('textarea:not([readonly])').evaluateAll((xs) => xs.map((x) => x.value))).join('\n')
      for (const t of [ANTES.Misión, ANTES.CARTA, ANTES['A.1 Curso de acción más PROBABLE']]) assert.ok(txt.includes(t), `lo escrito antes no aparece: «${t}»`)
      await page.screenshot({ path: path.join(out, `${tag}-1-f7p1.png`) })

      // 🌱
      await clic(page.getByRole('button', { name: '🌱 Traer del calco lo que falte' }).first())
      await page.waitForTimeout(600)
      const v = await leerOpord(page)
      assert.equal(v['II.- MISIÓN'], ANTES.Misión, '🌱 no pisa lo escrito')
      assert.equal(v.CARTAS, ANTES.CARTA)
      assert.equal(v.Misión, undefined, 'la clave vieja ya no se guarda')
      assert.match(v['III.- Intención del Comandante'], /^Mi intención es detener al primer escalón de la VI DE al oeste de la LDE-2 \(FICT\.\), para esto es clave:\n- Fijar al primer escalón/)
      assert.match(v['III.- A.- 1.- Maniobra'], /^FASE I/)
      assert.ok(v['III.- B.- Tareas de las unidades de maniobra'].split('\n').some((x) => /:$/.test(x)), 'una unidad por renglón terminado en «:»')
      assert.match(v['III.- D.- Instrucciones de coordinación'], /^La presente orden entra en vigor a partir de su emisión\./)
      assert.match(v['III.- D.- Instrucciones de coordinación'], /¿Empleará el enemigo el paso Ungallire/)
      assert.match(v['V.- A.- Comando'], /^Sucesión de mando:/)
      assert.match(v['V.- B.- Comunicaciones'], /IEC «ANGEL»/)
      await page.screenshot({ path: path.join(out, `${tag}-2-sembrar.png`) })

      // 🤖 el pedido
      await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
      await clic(page.getByRole('button', { name: 'Completar y mejorar', exact: true }).first())
      // Lo que se copia es el pedido entero.
      await page.evaluate(() => {
        try {
          navigator.clipboard.writeText = async (t) => {
            window.__pedido = t
          }
        } catch {}
      })
      await clic(page.getByRole('button', { name: '📋 Copiar el pedido' }).first())
      await page.waitForFunction(() => typeof window.__pedido === 'string' && window.__pedido.length > 1000, null, { timeout: 15000 })
      const pedido = await page.evaluate(() => window.__pedido)
      fs.writeFileSync(path.join(out, `${tag}-pedido.md`), pedido)
      for (const t of ['ES LA ORDEN GENERAL DE OPERACIONES DE LA UNIDAD, CON EL FORMATO DE LA ESCUELA', 'en forma INEXTENSA', 'LO QUE LA MESA YA TIENE PARA CADA APARTADO', '"III.- A.- 1.- Maniobra"', 'CINCO PÁRRAFOS'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)

      // 📄 el Word
      const boton = page.locator('button[title="Descargar en el formato propio del documento"]')
      assert.ok(await boton.count(), 'no está el botón del Word militar')
      const d = page.waitForEvent('download', { timeout: 30000 })
      await boton.first().dispatchEvent('click')
      const w = await d
      assert.match(w.suggestedFilename(), /^F7P1_Orden_General_de_Operaciones/, w.suggestedFilename())
      const archivo = path.join(out, `${tag}-F7P1.docx`)
      await w.saveAs(archivo)
      txt = textoXml(execFileSync('unzip', ['-p', archivo, 'word/document.xml'], { encoding: 'utf8' }))
      fs.writeFileSync(path.join(out, `${tag}-F7P1.txt`), txt)
      for (const t of ['ORDEN GENERAL DE OPERACIONES No.', 'OBJETO', 'CARTAS', 'ANEXOS', 'SITUACIÓN.', 'Fuerzas enemigas.', 'Curso de acción más probable.', 'MISIÓN.', 'EJECUCIÓN.', 'Intención del Comandante.', 'Mi intención es detener', 'Concepto de la operación.', 'Maniobra.', 'Tareas de las unidades de maniobra.', 'Instrucciones de coordinación.', 'APOYO DE SERVICIO.', 'COMANDO Y COMUNICACIONES.', 'Sucesión de mando.', 'EL COMANDANTE DEL CE-I', 'Autenticación:', 'G-3', 'Distribución:', 'ARCHIVO'])
        assert.ok(txt.includes(t), `el Word no trae «${t}»`)
      for (const t of ['Encabezamiento', 'I.- SITUACIÓN', 'A.1 ', '[Pendiente]', 'IA — verificar', 'ORDEN GENERAL DE OPERACIONES Y ANEXOS']) assert.ok(!txt.includes(t), `el Word no debe traer «${t}»`)
      const malos = a.errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
      assert.deepEqual(malos, [], 'sin errores de consola')
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: F7·P1 con las casillas de la Escuela (lo de antes en su lugar), 🌱 sin pisar, pedido con el formato y lo de la Mesa, Word «${w.suggestedFilename()}».`)
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
