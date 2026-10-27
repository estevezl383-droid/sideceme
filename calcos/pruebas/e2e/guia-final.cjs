// F6·P2 — GUÍA DE PLANIFICACIÓN FINAL del Comandante en la Mesa real (Chromium), escritorio y teléfono, con un
// ejercicio FICTICIO que ya tiene la hoja vieja (el cuadro «Área / Sección · Guía final impartida · Plazo» que
// bajaba Sergio como A.- G-1 … I.- Defensa Antiaérea):
//   · «⭐ CMTE. → 📋 Mis hojas → F6·P2» abre el DOCUMENTO con los seis párrafos del modelo del TEXTO PMTD 2017
//     (I.- DECISIÓN … VI.- ENSAYOS) y su instrucción, sin «No. 01» en el título;
//   · 🌱 trae la decisión (F6·P1), la intención (F2·P14), los RCIC. (F2·P8), las prioridades de la Matriz de
//     sincronización y el tipo de orden y de ensayo (F6·SAL) del G-3;
//   · el pedido a la IA dice «NO por sección» y lleva la forma y la doctrina; la respuesta entra sin pisar;
//   · la vista previa y el Word con el formato militar: membrete, «GUÍA DE PLANIFICACIÓN FINAL» sin número, los
//     seis párrafos en orden, firma del Comandante, sin «Área / Sección» ni marcas de la IA;
//   · las demás hojas del Comandante siguen como estaban; el avance y el guardado; sin errores de JavaScript.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioRiesgo } = require('../riesgo-ejercicio.js')

const out = path.resolve(__dirname, '../salidas-guia-final')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const TITULOS = ['DECISIÓN.', 'INTENCIÓN DEL COMANDANTE.', 'REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE.', 'PRIORIDADES PARA LOS SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA.', 'DISPOSICIONES SOBRE LA ELABORACIÓN DE LOS PLANES U ÓRDENES.', 'DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.']
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI']

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

function ejercicio(nombre) {
  const e = ejercicioRiesgo()
  e.nombre = nombre
  e.hojasG = {
    ...(e.hojasG || {}),
    cmte: {
      decisionCmte: { 'Curso de acción aprobado': 'CAP-2', 'Razón de la decisión': 'Mantiene la reserva fuera del alcance de la artillería enemiga (FICT.)', 'Modificaciones que ordena': 'El RCB-2 «BRAVO» (FICT.) queda en reserva al sur de PUEBLO-X' },
      intencion: { 'Propósito ampliado': 'Impedir que la BRIG. BL. ROJA (FICT.) cruce el río Z', 'Tareas clave': 'Retener el paso del río Z; batir la artillería enemiga', 'Estado Final Deseado': 'El enemigo detenido al norte del río Z (FICT.)' },
      prioridadRcic: [{ 'Requerimiento propuesto': '¿Dónde despliega la artillería de la BRIG. BL. ROJA? (FICT.)', 'Quién lo propone': 'G-2', 'Prioridad que asigna el Cmte.': '1' }],
      guiaFinal: [
        { 'Área / Sección': 'Sección G-1 (Personal)', 'Guía final impartida': 'Recibir 450 reemplazos (FICT.)', Plazo: 'D-10 (1800)' },
        { 'Área / Sección': 'Sección G-2 (Inteligencia)', 'Guía final impartida': 'Orientar la búsqueda (FICT.)', Plazo: 'D-3 (0600)' },
      ],
    },
  }
  e.g3 = {
    ...(e.g3 || {}),
    decision: { _marca: { 'CAP-2': 'RECOMENDADO AL COMANDANTE' } },
    _caps: { activo: 1, guardados: { 2: { coa: { 'Denominación del CAP': 'CAP 2 — Defensa de área en el río Z (FICT.)' }, concepto: {}, fases: [] } } },
    sincro: { _cols: ['FASE I', 'FASE II'], 'APOYO DE FUEGOS|FASE II': 'Prioridad de fuegos al RIM-1 «ALFA» (FICT.)', 'ADA.|FASE I': 'Prioridad al PC en PUEBLO-X (FICT.)' },
    controlOrden: { 'Tipo de orden (Orden de Operaciones · Plan de Operaciones · Orden Parcial)': 'Orden de Operaciones con todos sus anexos (FICT.)', 'Tipo de ensayo (completo · reducido · sobre maqueta · sobre carta · de mando)': 'Ensayo de comandantes sobre maqueta (FICT.)', 'Quiénes participan del ensayo y cuándo': 'Comandantes de regimiento, D-2 (0900) en PUEBLO-X (FICT.)' },
  }
  return e
}
const RESPUESTA = '```json\n' + JSON.stringify({ campos: { decision: 'NO debe pisar lo que trajo 🌱 (IA).', rcic: '- RPI: ¿cruza el enemigo por el vado norte antes del D+1? (IA, FICT.)', ordenes: 'NO debe pisar (IA).' } }) + '\n```'
const MEJORA = '```json\n' + JSON.stringify({ campos: { rcic: '- RPI: ¿cruza el enemigo por el vado norte antes del D+1? (IA, FICT.)\n- RIFA: ¿llegó la reserva a su posición? (IA, FICT.)' } }) + '\n```'

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=cmte' })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const tag = movil ? 'movil' : 'escritorio'
    const datos = ejercicio(`PRUEBA GUIA FINAL${movil ? ' B' : ''} (FICT.)`)
    try {
      await sembrarYAbrir(page, datos)
      await clic(page.getByRole('button', { name: '⭐ CMTE.' }).first())
      const lista = page.getByRole('button', { name: /F6·P2\s*Guía de Planificación Final/ })
      await lista.waitFor({ timeout: 15000 })
      const avance0 = await page.getByText(/hojas con contenido/).first().innerText()
      await clic(lista)

      // ── El documento con la forma del modelo ──
      const doc = page.locator('[data-em-doc="guiaFinal"]')
      await doc.waitFor({ timeout: 15000 })
      const c = await doc.innerText()
      TITULOS.forEach((t, i) => assert.ok(c.includes(`${ROMANOS[i]}.- ${t}`), `el editor no trae «${ROMANOS[i]}.- ${t}»`))
      for (let i = 1; i < TITULOS.length; i++) assert.ok(c.lastIndexOf(`${ROMANOS[i - 1]}.- ${TITULOS[i - 1]}`) < c.lastIndexOf(`${ROMANOS[i]}.- ${TITULOS[i]}`), 'en el orden del modelo')
      assert.ok(c.includes('modelo de Guía de Planificación Final del TEXTO PMTD 2017'))
      assert.ok(c.includes('El Comandante debe materializar su decisión'), 'la instrucción del modelo')
      assert.ok(!c.includes('No. 01'), 'el título sin número')
      assert.ok(!/Área \/ Sección|Guía final impartida/.test(c), 'ya no es el cuadro por sección')
      assert.equal(await doc.locator('textarea').count(), 7, 'seis párrafos y las ideas')
      await clic(doc.getByRole('button', { name: /¿Para qué es y cómo se llena\?/ }))
      assert.ok((await doc.locator('[data-em="guia"]').innerText()).includes('NO es una lista de tareas por sección'))
      await clic(doc.getByRole('button', { name: /Lo que ya entregaron las otras secciones/ }))
      const ent = await doc.locator('[data-em="entregas"]').innerText()
      for (const t of ['El Comandante (sus hojas)', 'F6·P1 Curso de acción aprobado', 'El G-3', 'F5·P1 Recomendado al Comandante', 'CAP 2 «Defensa de área en el río Z (FICT.)»', 'F6·SAL Tipo de ensayo']) assert.ok(ent.includes(t), `lo entregado: falta «${t}»`)

      // ── 🌱 ──
      await clic(doc.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await doc.getByText(/Se trajo:/).waitFor({ timeout: 5000 })
      const vals = async () => (await doc.locator('[data-campo] textarea').evaluateAll((xs) => xs.map((x) => x.value))).join('\n')
      let v = await vals()
      for (const t of [
        'Señores miembros del Estado Mayor, mi decisión es que el Curso de Acción Propio N° 2 «Defensa de área en el río Z (FICT.)» es el más adecuado para cumplir con la misión asignada',
        'Ordeno las siguientes modificaciones al curso de acción: el RCB-2 «BRAVO» (FICT.) queda en reserva al sur de PUEBLO-X.',
        'Propósito: Impedir que la BRIG. BL. ROJA (FICT.) cruce el río Z.',
        'Estado final deseado: El enemigo detenido al norte del río Z (FICT.).',
        '- ¿Dónde despliega la artillería de la BRIG. BL. ROJA? (FICT.) (prioridad 1; lo propuso G-2)',
        '- Apoyo de fuegos: FASE II: Prioridad de fuegos al RIM-1 «ALFA» (FICT.).',
        '- Defensa antiaérea: FASE I: Prioridad al PC en PUEBLO-X (FICT.).',
        'La orden a elaborar será: Orden de Operaciones con todos sus anexos (FICT.).',
        'Tipo de ensayo: Ensayo de comandantes sobre maqueta (FICT.).',
      ])
        assert.ok(v.includes(t), `🌱: falta «${t}»`)
      assert.ok(!v.includes('Recibir 450 reemplazos'), 'el cuadro viejo no entra al documento')

      // ── 🤖 La IA ──
      await doc.locator('textarea[placeholder^="Ej.: «Decido el CAP 2"]').fill('Quiero el ensayo en el PC (FICT.).')
      await clic(doc.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      await clic(doc.getByRole('button', { name: '📋 Copiar el pedido' }))
      await doc.getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
      await clic(doc.getByRole('button', { name: /Ver el pedido/ }))
      const pedido = await doc.locator('textarea[readonly]').inputValue()
      fs.writeFileSync(path.join(out, `${tag}-pedido.md`), pedido)
      for (const t of ['GUÍA DE PLANIFICACIÓN FINAL', 'NO la armes como una lista de tareas por sección', 'I.- DECISIÓN.  →  "campos"."decision"', 'VI.- DISPOSICIONES SOBRE LA PREPARACIÓN Y EJECUCIÓN DE ENSAYOS.', 'TEXTO PMTD 2017', 'D-3 (0800)', 'Quiero el ensayo en el PC (FICT.).', '"ensayos": "…"', 'Orden de operaciones (FICT.).pdf'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
      // «Sólo completar»: los seis párrafos ya los trajo 🌱 → no pisa nada
      const caja = doc.locator('textarea[placeholder^="Pegá acá la respuesta"]')
      await caja.fill(RESPUESTA)
      await clic(doc.getByRole('button', { name: '✓ Aplicar' }))
      await doc.getByText(/No había nada vacío que la respuesta completara/).waitFor({ timeout: 5000 })
      v = await vals()
      assert.ok(!v.includes('NO debe pisar') && !v.includes('RPI: ¿cruza el enemigo'), 'sólo completar no pisa')
      // «Completar y mejorar»: los RCIC. nuevos (RPI y RIFA) reemplazan
      await clic(doc.getByRole('button', { name: 'Completar y mejorar' }))
      await caja.fill(MEJORA)
      await clic(doc.getByRole('button', { name: '✓ Aplicar' }))
      await doc.getByText(/1 apartado\(s\) escritos por la IA/).waitFor({ timeout: 5000 })
      v = await vals()
      assert.ok(v.includes('- RPI: ¿cruza el enemigo por el vado norte antes del D+1? (IA, FICT.)\n- RIFA: ¿llegó la reserva a su posición? (IA, FICT.)'), 'mejorar reescribe los RCIC.')
      assert.ok(await doc.getByText('🤖 revisar').count(), 'la marca de la IA')
      await page.screenshot({ path: path.join(out, `${tag}-documento.png`) })

      // ── La vista previa y el Word militar ──
      await clic(doc.getByRole('button', { name: '👁️ Vista previa' }))
      const velo = page.locator('#sid-visor-em')
      await velo.waitFor()
      await velo.locator('section.docx').first().waitFor({ timeout: 30000 })
      const previa = await velo.innerText()
      for (const t of ['SECRETO', 'GUÍA DE PLANIFICACIÓN FINAL', ...TITULOS, 'EMO/JEM']) assert.ok(previa.includes(t), `la vista previa no trae «${t}»`)
      assert.ok(!/GUÍA DE PLANIFICACIÓN FINAL No\./.test(previa), 'la vista previa: el título sin número')
      await page.screenshot({ path: path.join(out, `${tag}-vista-previa.png`) })
      await clic(velo.getByRole('button', { name: '✕ Cerrar' }))
      const d = page.waitForEvent('download', { timeout: 30000 })
      await clic(doc.getByRole('button', { name: '📄 Word (formato militar)' }))
      const dlg = page.locator('dialog.sid-militar')
      const w = await Promise.race([d, dlg.waitFor({ timeout: 30000 }).then(() => null)])
      let descarga = w
      if (!descarga) {
        await dlg.locator('[data-action="exportar"]').click()
        descarga = await d
      }
      assert.equal(descarga.suggestedFilename(), 'F6P2_Guia_de_Planificacion_Final.docx')
      const archivo = path.join(out, `${tag}-F6P2.docx`)
      await descarga.saveAs(archivo)
      const x = soloTexto(await textoDocx(archivo))
      fs.writeFileSync(path.join(out, `${tag}-F6P2.txt`), x)
      for (const t of ['SECRETO', 'EMO/JEM', 'GUÍA DE PLANIFICACIÓN FINAL', ...TITULOS, 'mi decisión es que el Curso de Acción Propio N° 2', 'Ensayo de comandantes sobre maqueta (FICT.).', 'EL COMANDANTE']) assert.ok(x.includes(t), `el Word no trae «${t}»`)
      let antes = x.indexOf('GUÍA DE PLANIFICACIÓN FINAL')
      for (const t of TITULOS) {
        const i = x.indexOf(t, antes)
        assert.ok(i > antes, `el Word: «${t}» en su lugar`)
        antes = i
      }
      assert.ok(!/GUÍA DE PLANIFICACIÓN FINAL No\./.test(x), 'el título sin número')
      assert.ok(!/Área \/ Sección|Guía final impartida|Recibir 450 reemplazos/.test(x), 'el Word ya no es la lista por sección')
      assert.ok(!/🤖|🌱|IA\s*[—–-]\s*verificar/.test(x), 'sin emojis ni marcas de la IA')

      // ── Las demás hojas, el avance y el guardado ──
      await clic(page.getByRole('button', { name: '← Volver a mis hojas' }).first())
      await clic(page.getByRole('button', { name: /F6·P1\s*Decisión del Comandante/ }))
      await page.getByRole('button', { name: '← Volver a mis hojas' }).waitFor()
      assert.equal(await page.locator('[data-em-doc]').count(), 0, 'la F6·P1 sigue siendo la hoja de siempre')
      assert.equal(await page.locator('[data-em="ayuda-hoja"]').count(), 0, 'sin guía ni 🌱 nuevos en las otras hojas')
      await clic(page.getByRole('button', { name: '← Volver a mis hojas' }).first())
      const avance = await page.getByText(/hojas con contenido/).first().innerText()
      const n0 = Number((avance0.match(/(\d+) de/) || [])[1])
      const n1 = Number((avance.match(/(\d+) de/) || [])[1])
      assert.equal(n1, n0 + 1, `el avance cuenta la guía: ${avance0} → ${avance}`)
      await clic(page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first())
      await clic(page.getByRole('button', { name: /Guardar todo/ }))
      let g = null
      for (let t = 0; t < 40 && !g; t++) {
        const y = await leerGuardado(page, datos.nombre)
        if (y?.hojasG?.cmte?.guiaFinal?.esquema === 'guia-final-v1') g = y
        else await page.waitForTimeout(250)
      }
      assert.ok(g, 'guardado con el ejercicio')
      assert.ok(g.hojasG.cmte.guiaFinal.campos.ensayos.includes('Ensayo de comandantes sobre maqueta (FICT.).'))
      assert.deepEqual(a.errores, [])
      console.log(`OK ${tag}: la F6·P2 con los seis párrafos del PMTD 2017 (no por sección), 🌱 con la decisión, la intención, los RCIC., la sincronización y la F6·SAL, pedido a la IA y respuesta sin pisar, vista previa y Word militar (${descarga.suggestedFilename()}), las otras hojas igual, avance ${avance0} → ${avance} y guardado.`)
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
