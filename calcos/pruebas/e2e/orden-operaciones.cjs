// 📜 F7·P1 — ORDEN GENERAL DE OPERACIONES del G-3 en la Mesa real (Chromium), escritorio y teléfono, con un ejercicio
// FICTICIO (ogo-ejemplo.js: el CE-I en el AO LAUCA con su CAP en la carta, el CAE del G-2, la intención y los RCIC del
// Comandante, los anexos del G-1, G-4 y G-5) que ya tiene la hoja VIEJA (32 casillas planas, con las cuentas del 🌱 viejo):
//   · «⚔️ G-3 Operaciones → 📄 Documentos → 7 · Elaborar planes y órdenes → F7·P1» abre el DOCUMENTO con la forma del
//     TEXTO PMTD 2017 (Capítulo VII): OBJETO, CARTAS, ANEXOS; ORGANIZACIÓN DE LA TAREA; I.- a V.-, con la instrucción
//     literal; lo escrito en la hoja vieja está en su apartado y las cuentas del 🌱 viejo no;
//   · 🌱 trae la Orden con todo el Estado Mayor (la maniobra FASE POR FASE con la tarea y el propósito de cada unidad, las
//     tareas de cada unidad, los RCIC, IV y V…) sin pisar lo escrito;
//   · 🤖 por partes: el pedido de «III concepto» lleva la doctrina del Capítulo VII, el ejemplo «KILÓMETRO 7» y no le
//     prohíbe escribir la Orden; la respuesta entra con «Completar y mejorar»;
//   · 👁️ la vista previa y 📄 el Word militar: membrete, «ORDEN GENERAL DE OPERACIONES No. 01», el cuadro de la
//     Organización de la Tarea, I.- a V.- en orden, la maniobra por fases, la firma del Comandante, la autenticación del
//     G-3 y la distribución, sin marcas de la IA ni cuentas;
//   · «📄 OPORD» del 🎬 C.A. por fases baja ESTA Orden (antes, un esqueleto con «[Completar…]»);
//   · el avance del G-3 la cuenta, se guarda con la forma nueva y no hay errores de JavaScript.
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
//   node calcos/pruebas/e2e/orden-operaciones.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../../jszip.min.js')
const { abrir, sembrarYAbrir, leerGuardado } = require('./navegador.js')
const { ejercicioOGO, VIEJA } = require('../ogo-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-orden-operaciones')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const PARRAFOS = ['SITUACIÓN.', 'MISIÓN.', 'EJECUCIÓN.', 'APOYO DE SERVICIO.', 'COMANDO Y COMUNICACIONES.']
const ROMANOS = ['I', 'II', 'III', 'IV', 'V']

async function textoDocx(ruta) {
  const z = await JSZip.loadAsync(fs.readFileSync(ruta))
  const xs = await Promise.all(Object.keys(z.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)).map((n) => z.file(n).async('string')))
  return xs
    .join('\n')
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}
// El Word: directo (el formato militar ya tiene todo) o con el cuadro «Revisar formato del documento».
async function bajarWord(page, boton) {
  const d = page.waitForEvent('download', { timeout: 30000 })
  await clic(boton)
  const dlg = page.locator('dialog.sid-militar')
  let w = await Promise.race([d, dlg.waitFor({ timeout: 30000 }).then(() => null)])
  if (!w) {
    await dlg.locator('[data-action="exportar"]').click()
    w = await d
  }
  return w
}
function comprobarWord(x, cual) {
  for (const t of ['SECRETO', 'EMO/SEC-III', 'ORDEN GENERAL DE OPERACIONES No. 01', 'OBJETO', 'CARTAS', 'ANEXOS', '“B” Inteligencia.', 'ORGANIZACIÓN DE LA TAREA', 'DIV MEC-2 (OD)', 'BAJO CONTROL:', 'EL COMANDANTE DEL CE-I', 'Autenticación', 'G-3', 'Original \t:\tFF.TT.T.O. (FICT.)', 'Copia 7 \t:\tARCHIVO'])
    assert.ok(x.includes(t), `${cual}: el Word no trae «${t}»`)
  let antes = x.indexOf('ORDEN GENERAL DE OPERACIONES No. 01')
  for (const t of PARRAFOS) {
    const i = x.indexOf(`\n${t}\n`, antes)
    assert.ok(i > antes, `${cual}: «${t}» en su lugar`)
    antes = i
  }
  for (const t of ['Curso de acción del enemigo más probable.', 'Intención del Comandante.', 'Concepto de la operación.', 'Maniobra.', 'FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).', 'La DIV MEC-2 (OD y esfuerzo principal) se concentra en TURCO con el propósito de completar su aclimatación (IA, FICT.).', 'Tareas de las unidades de maniobra.', 'TAREA: Detiene al enemigo en la AA-1 en Guata.', 'PROPÓSITO: Que no pase la LF «PUMA».', 'Requerimientos prioritarios de inteligencia (RPI).', '¿Dónde emplaza el enemigo sus lanzadores LAR-160 (FICT.)?', 'Informar cuando la Clase III de la DIV MEC-2 baje de dos días de consumo (FICT.).', 'Sucesión de mando.', 'IOC «ILLIMANI»'])
    assert.ok(x.includes(t), `${cual}: el Word no trae «${t}»`)
  assert.ok(!/Hipótesis\./.test(x), `${cual}: una ORDEN no lleva hipótesis`)
  // la misión, la intención y el concepto con la forma del PMTD
  assert.ok(x.includes('Mi intención es detener al primer escalón enemigo'), `${cual}: la intención en prosa`)
  assert.ok(x.includes('Vamos a cumplir la misión mediante una defensa de área.'), `${cual}: el concepto del PMTD`)
  assert.ok(x.includes('Una División Mecanizada (OD y esfuerzo principal) detiene al enemigo en la AA-1 en Guata'), `${cual}: una oración por unidad en el concepto`)
  assert.ok(!/Medios disponibles:|límite\(s\)|trabajo\(s\)|Atacar con Fuego|\[Completar/.test(x), `${cual}: sin las cuentas del 🌱 viejo ni el esqueleto de antes`)
  assert.ok(!/🤖|🌱|IA\s*[—–-]\s*verificar/.test(x), `${cual}: sin emojis ni marcas de la IA`)
  // lo que va después de una lista queda después («Ver Anexo…» de la Logística)
  const log = x.indexOf('\nLogística.\n')
  assert.ok(log > 0 && x.indexOf('Abastecimiento: PD-1 en Turco (FICT.).', log) < x.indexOf('Ver Anexo “F” Apoyo de Servicio de Combate.', log), `${cual}: el orden de lo escrito`)
}

const MEJORA = '```json\n' + JSON.stringify({ campos: { maniobra: 'FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).\nLa DIV MEC-2 (OD y esfuerzo principal) se concentra en TURCO con el propósito de completar su aclimatación (IA, FICT.).', apoyoAereo: 'Prioridad de Apoyo Aéreo Cercano a la DIV MEC-2 en la FASE IV (IA, FICT.).' } }) + '\n```'

;(async () => {
  const { leerRespuesta } = await import('../../cap-propios/v1/carta-ia.mjs')
  for (const movil of [false, true]) {
    const tag = movil ? 'movil' : 'escritorio'
    const { page, errores, cerrar } = await abrir({ ancho: movil ? 390 : 1600, alto: movil ? 844 : 1000, movil })
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const e = ejercicioOGO({ leerRespuesta, nombre: `PRUEBA OGO${movil ? ' B' : ''} (FICT.)` })
    e.datos.g3 = { ...e.datos.g3, opord: VIEJA }
    try {
      await sembrarYAbrir(page, e.datos)
      const ocultar = page.getByText('▼ ocultar')
      if (await ocultar.count()) await ocultar.first().click().catch(() => {})
      await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
      await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
      await clic(page.getByRole('button', { name: /Elaborar planes y órdenes/ }).first())
      const hoja = page.getByRole('button', { name: /F7·P1\s*Orden General de Operaciones/ }).first()
      await hoja.waitFor({ timeout: 15000 })
      await clic(hoja)

      // ── El documento con la forma del Capítulo VII; lo de la hoja vieja en su apartado ──
      const doc = page.locator('[data-em-doc="opord"]')
      await doc.waitFor({ timeout: 15000 })
      const c = await doc.innerText()
      for (const t of ['OBJETO', 'CARTAS', 'ANEXOS', 'ORGANIZACIÓN DE LA TAREA.', ...PARRAFOS.map((p, i) => `${ROMANOS[i]}.- ${p}`), 'Intención del Comandante.', 'Tareas de las unidades de maniobra.', 'Instrucciones de coordinación.'])
        assert.ok(c.includes(t), `el editor no trae «${t}»`)
      // (lastIndexOf: la nota de arriba también nombra los párrafos)
      for (let i = 1; i < PARRAFOS.length; i++) assert.ok(c.lastIndexOf(`${ROMANOS[i - 1]}.- ${PARRAFOS[i - 1]}`) < c.lastIndexOf(`${ROMANOS[i]}.- ${PARRAFOS[i]}`), 'en el orden del modelo')
      assert.ok(c.includes('Exprese la información en términos de dos escalones enemigos por debajo del suyo'), 'la instrucción del PMTD')
      assert.ok(/5 de 52 apartados/i.test(c), 'lo escrito en la hoja vieja (objeto, misión, reconocimiento, sucesión e IOC)')
      const vals = async () => Object.fromEntries(await doc.locator('[data-campo]').evaluateAll((xs) => xs.map((x) => [x.getAttribute('data-campo'), x.querySelector('textarea')?.value || ''])))
      let v = await vals()
      assert.equal(v.mision, VIEJA['Misión'])
      assert.equal(v.sucesion, VIEJA['A. Comando'])
      assert.equal(v.maniobra, '', 'la maniobra del 🌱 viejo («DIV MEC-2 (OD): Atacar con Fuego.») no pasa')
      assert.ok(await doc.getByText('🤖 revisar').count(), 'lo de la IA de la hoja vieja queda para revisar')

      // ── 🌱 ──
      await clic(doc.getByRole('button', { name: '🌱 Traer del calco y de mis hojas lo que falte' }))
      await doc.getByText(/Se trajo:/).waitFor({ timeout: 5000 })
      v = await vals()
      assert.equal(v.mision, VIEJA['Misión'], '🌱 no pisa lo escrito')
      for (const [k, t] of [
        ['orgTarea', 'DIV MEC-2 (OD):'],
        ['caeProbable', 'CAE-1 (el MÁS PROBABLE para el G-2, H.T. 18).'],
        ['propias', '1.- FF.TT.T.O. (FICT.).'],
        ['intencion', 'Mi intención es detener al primer escalón enemigo'],
        ['concepto', 'Vamos a cumplir la misión mediante una defensa de área.'],
        ['concepto', 'Una División de Infantería (RESERVA) constituye la reserva, encontrándose en condiciones de contraatacar en Guata con orden'],
        ['maniobra', 'FASE IV: CONDUCCIÓN DE LA DEFENSA (desde el D hasta el D+8).\nLa DIV MEC-2 (OD y esfuerzo principal) detiene al enemigo en la AA-1 en Guata, con el propósito de que no pase la LF «PUMA».'],
        ['maniobra', 'La DIV-6 (RESERVA) contraataca en Guata, con el propósito de restablecer la LPR.'],
        ['tareasManiobra', 'FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).\n1.- DIV MEC-2 (OD).\nTAREA: Se concentra en Turco.'],
        ['tareasManiobra', '3.- DIV-6 (RESERVA).\nTAREA: Contraataca en Guata.\nPROPÓSITO: Restablecer la LPR.'],
        ['rpi', '1) ¿Por qué avenida (FICT.) empeña el enemigo su esfuerzo principal?\n2) ¿Dónde emplaza el enemigo sus lanzadores LAR-160 (FICT.)?'],
        ['rifa', '2) Informar cuando las bajas de la DIV MEC-2 superen el 10 % de sus efectivos (FICT.).'],
        ['conceptoApoyo', '- FASE III: enfoque de apoyo en Clase IV y Clase V'],
        ['puestosComando', '- PC Principal CE-I en Estancia Ticanani.'],
      ])
        assert.ok(v[k].includes(t), `🌱 ${k}: falta «${t}»\n${v[k]}`)
      const llenos = Object.values(v).filter((x) => x.trim()).length
      assert.ok(llenos >= 40, `🌱 llena la Orden: ${llenos} de 52`)

      // ── 🤖 La IA, por partes ──
      await clic(doc.getByRole('button', { name: 'III concepto', exact: true }))
      assert.equal(await doc.getByRole('button', { name: 'III concepto', exact: true }).getAttribute('aria-pressed'), 'true')
      await clic(doc.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }))
      await clic(doc.getByRole('button', { name: 'Completar y mejorar', exact: true }))
      await clic(doc.getByRole('button', { name: '📋 Copiar el pedido' }))
      await doc.getByRole('button', { name: /Ver el pedido/ }).waitFor({ timeout: 30000 })
      await clic(doc.getByRole('button', { name: /Ver el pedido/ }))
      const pedido = await doc.locator('textarea[readonly]').inputValue()
      fs.writeFileSync(path.join(out, `${tag}-pedido.md`), pedido)
      for (const t of ['ORDEN GENERAL DE OPERACIONES', 'ESTA VEZ TRABAJÁS SÓLO ESTA PARTE DEL DOCUMENTO (III concepto', 'TEXTO PMTD 2017, Parte Primera, Capítulo VII', 'KILÓMETRO 7', 'Se asume como riesgo', 'Mi intención es facilitar la destrucción de la FT-43', 'La Orden va COMPLETA, apartado por apartado, DENTRO de las claves del JSON.', 'Las fases del CAP aprobado en la carta', 'El CAE del G-2 (PICB)', '"maniobra": "…"'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
      assert.ok(!pedido.includes('la Orden de Operaciones, una matriz de sincronización'), 'a la Orden no se le prohíbe escribir la Orden')
      const json = pedido.slice(pedido.lastIndexOf('# CÓMO CONTESTAR'))
      assert.ok(!json.includes('"mision": "…"'), 'el JSON pide sólo la parte')
      const caja = doc.locator('textarea[placeholder^="Pegá acá la respuesta"]')
      await caja.fill(MEJORA)
      await clic(doc.getByRole('button', { name: '✓ Aplicar' }))
      await doc.getByText(/apartado\(s\) escritos por la IA/).waitFor({ timeout: 5000 })
      v = await vals()
      assert.ok(v.maniobra.includes('con el propósito de completar su aclimatación (IA, FICT.)'), 'mejorar reescribe la maniobra')
      assert.equal(v.apoyoAereo, 'Prioridad de Apoyo Aéreo Cercano a la DIV MEC-2 en la FASE IV (IA, FICT.).')
      assert.equal(v.mision, VIEJA['Misión'], 'lo que no es de la parte no se toca')
      await page.screenshot({ path: path.join(out, `${tag}-documento.png`) })

      // ── La vista previa y el Word militar ──
      await clic(doc.getByRole('button', { name: '👁️ Vista previa' }))
      const velo = page.locator('#sid-visor-em')
      await velo.waitFor()
      await velo.locator('section.docx').first().waitFor({ timeout: 30000 })
      const previa = await velo.innerText()
      for (const t of ['SECRETO', 'ORDEN GENERAL DE OPERACIONES', 'ORGANIZACIÓN DE LA TAREA', ...PARRAFOS, 'EL COMANDANTE DEL CE-I']) assert.ok(previa.includes(t), `la vista previa no trae «${t}»`)
      await page.screenshot({ path: path.join(out, `${tag}-vista-previa.png`) })
      await clic(velo.getByRole('button', { name: '✕ Cerrar' }))
      const w = await bajarWord(page, doc.getByRole('button', { name: '📄 Word (formato militar)' }))
      assert.equal(w.suggestedFilename(), 'F7P1_Orden_General_de_Operaciones.docx')
      const archivo = path.join(out, `${tag}-F7P1.docx`)
      await w.saveAs(archivo)
      const x = await textoDocx(archivo)
      fs.writeFileSync(path.join(out, `${tag}-F7P1.txt`), x)
      comprobarWord(x, 'F7·P1')
      assert.ok(x.includes('con el propósito de completar su aclimatación (IA, FICT.)'), 'el Word con lo de la IA')

      // ── El avance y el guardado ──
      await clic(page.getByRole('button', { name: '← Volver a mis documentos' }).first())
      const fase7 = page.getByRole('button', { name: /Elaborar planes y órdenes/ }).first()
      await fase7.waitFor({ timeout: 10000 })
      let g = null
      for (let t = 0; t < 40 && !g; t++) {
        const y = await leerGuardado(page, e.datos.nombre)
        if (y?.g3?.opord?.esquema === 'ogo-v1') g = y
        else await page.waitForTimeout(250)
      }
      if (!g) {
        await clic(page.getByRole('button', { name: new RegExp(`^📁 ${e.datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first()).catch(() => {})
        await clic(page.getByRole('button', { name: /Guardar todo/ })).catch(() => {})
        for (let t = 0; t < 40 && !g; t++) {
          const y = await leerGuardado(page, e.datos.nombre)
          if (y?.g3?.opord?.esquema === 'ogo-v1') g = y
          else await page.waitForTimeout(250)
        }
      }
      assert.ok(g, 'la F7·P1 se guarda con la forma nueva (ogo-v1)')
      assert.equal(g.g3.opord.campos.mision, VIEJA['Misión'])
      assert.ok(g.g3.opord.campos.maniobra.includes('(IA, FICT.)'))
      assert.equal(g.g3.opord['A.1 Maniobra'], undefined, 'sin las casillas viejas')

      // ── «📄 OPORD» del 🎬 C.A. por fases: ESTA Orden ──
      if (!movil) {
        await clic(page.getByRole('button', { name: /C\.A\. POR FASES/i }).first())
        const op = page.getByRole('button', { name: '📄 OPORD' }).first()
        await op.waitFor({ timeout: 10000 })
        const w2 = await bajarWord(page, op)
        const a2 = path.join(out, `${tag}-OPORD.docx`)
        await w2.saveAs(a2)
        const x2 = await textoDocx(a2)
        fs.writeFileSync(path.join(out, `${tag}-OPORD.txt`), x2)
        comprobarWord(x2, '📄 OPORD')
      }

      const malos = errores.filter((m) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(m))
      assert.deepEqual(malos, [], 'sin errores de consola')
      console.log(`✔ e2e F7·P1 Orden General de Operaciones (${tag}): la forma del PMTD, la hoja vieja migrada, 🌱 con todo el EM, la IA por partes, la vista previa, el Word militar${movil ? '' : ' y «📄 OPORD»'}`)
    } catch (err) {
      await page.screenshot({ path: path.join(out, `${tag}-error.png`) }).catch(() => {})
      console.error(err)
      process.exitCode = 1
    } finally {
      await cerrar()
    }
  }
})()
