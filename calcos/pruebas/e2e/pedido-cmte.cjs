// F1·P3 — APRECIACIÓN ACTIVA DEL COMANDANTE en la Mesa real (Chromium), escritorio y teléfono,
// con un ejercicio FICTICIO de expediente largo (documentos aportados de cientos de miles de
// caracteres, como el de Sergio del 10-10-2026):
//   · el pedido (Completar y mejorar, con la indicación de Sergio) EMPIEZA con la tarea, el
//     JSON exacto y la indicación; entra en «Normal» (120 mil) y en «Corto» (60 mil); trae las
//     hojas del Comandante y del JEM; el panel avisa que el expediente fue recortado;
//   · las dos respuestas que le dio la IA a Sergio («se cortó… ¿cuál es el producto?» y la
//     prosa con «Want me to…?») dan el error que corresponde; la respuesta buena llena las 4;
//   · el Word con el formato militar sale sin «[IA — verificar]».
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioRiesgo } = require('../riesgo-ejercicio.js')

const out = path.resolve(__dirname, '../salidas-pedido')
fs.mkdirSync(out, { recursive: true })
const CLAVES = ['Situación como la veo hoy', 'Lo que más me preocupa', 'Lo que no estoy dispuesto a arriesgar', 'Hacia dónde creo que va esto']
const INDICACION = 'todoen base a la fase I de los otros miembros del estado mayor'
const CORTADA = fs.readFileSync(path.join(__dirname, '..', 'respuesta-cortada-comandante.md'), 'utf8')
const PROSA = fs.readFileSync(path.join(__dirname, '..', 'respuesta-prosa-comandante.md'), 'utf8')
const BUENA = '```json\n' + JSON.stringify(Object.fromEntries(CLAVES.map((k, i) => [k, `Texto ${i + 1} del Comandante (FICT.).`])), null, 2) + '\n```'

function ejercicio() {
  const e = ejercicioRiesgo()
  e.nombre = 'PRUEBA CMTE (FICT.)'
  const parrafo = (d, i) => `${d} — párrafo ${i}. El RIAT-30 (FICT.) ocupa posiciones en la Fase III; la Fuerza de Golpe espera en la retaguardia. ${'Detalle de la maniobra. '.repeat(10)}`
  const doc = (d, k) => Array.from({ length: k }, (_, i) => parrafo(d, i + 1)).join('\n\n')
  e.documentos = [
    { nombre: 'ORDEN DE OPERACIONES N° 3 (FICT.).pdf', categoria: 'orden', texto: doc('ORDEN', 900) },
    { nombre: 'ANEXO B — INTELIGENCIA (FICT.).pdf', categoria: 'otro', texto: doc('ANEXO B', 500) },
  ]
  e.hojasG = {
    g1: { tareas: [{ Tarea: 'Mantener el efectivo de la Fuerza de Golpe (FICT.)', Tipo: 'Implícita' }] },
    jem: { libreto: { 'Cursos que se juegan': 'CAP 1 y CAP 2 (FICT. — del JEM).' } },
    cmte: { aprecCmte: { [CLAVES[0]]: 'Defensa Móvil sobre un frente de 9 km (FICT.).' } },
  }
  return e
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=cmte' })
    const { page } = a
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
    page.on('dialog', (d) => d.accept())
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, ejercicio())
      await page.getByRole('button', { name: '⭐ CMTE.' }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /F1·P3\s*Apreciación Activa del Comandante/ }).dispatchEvent('click')
      await page.getByRole('button', { name: '← Volver a mis hojas' }).waitFor({ timeout: 15000 })
      if (!(await page.getByRole('button', { name: '📋 Copiar el pedido' }).count())) await page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).dispatchEvent('click')
      await page.getByRole('button', { name: 'Completar y mejorar' }).dispatchEvent('click')

      // El selector de tamaño: Normal por defecto.
      for (const t of ['Corto', 'Normal', 'Completo']) assert.ok(await page.getByRole('button', { name: t, exact: true }).count(), `falta el botón «${t}»`)
      await page.getByText(/Tamaño del pedido: entra entero en ChatGPT, Gemini y Claude/).waitFor({ timeout: 5000 })

      // El pedido: la tarea, el JSON y la indicación AL PRINCIPIO.
      await page.locator('textarea[placeholder^="Ej.: «Trabajá sólo"]').fill(INDICACION)
      await page.getByText(/Va AL PRINCIPIO y AL FINAL del pedido/).waitFor({ timeout: 5000 })
      await page.getByRole('button', { name: '📋 Copiar el pedido' }).dispatchEvent('click')
      await page.getByText(/El expediente va RECORTADO \(de [\d.]+ a [\d.]+ caracteres\)/).waitFor({ timeout: 30000 })
      await page.getByRole('button', { name: /Ver el pedido/ }).dispatchEvent('click')
      const pedido = await page.locator('textarea[readonly]').inputValue()
      fs.writeFileSync(path.join(out, `${tag}-pedido.md`), pedido)
      assert.ok(pedido.startsWith('# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO'), pedido.slice(0, 200))
      assert.ok(pedido.length <= 120000, `pedido de ${pedido.length}`)
      const cab = pedido.slice(0, pedido.indexOf('\n---\n'))
      assert.ok(cab.includes('«F1·P3 — Apreciación Activa del Comandante»'))
      for (const k of CLAVES) assert.ok(cab.includes(`"${k}": "…"`), `arriba falta la clave «${k}»`)
      assert.ok(cab.includes(`«${INDICACION}»`))
      for (const t of ['### Comandante', 'Defensa Móvil sobre un frente de 9 km (FICT.).', '### Jefe de Estado Mayor', 'CAP 1 y CAP 2 (FICT. — del JEM).', '### G-1 Personal', '### ORDEN DE OPERACIONES N° 3 (FICT.).pdf', 'ORDEN — párrafo 1.', 'Este expediente va RECORTADO', '# CÓMO CONTESTAR'])
        assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
      assert.ok(pedido.trimEnd().endsWith('ese estilo va DENTRO de los textos.'))
      await page.screenshot({ path: path.join(out, `${tag}-pedido.png`) })

      // «Corto»: entra en 60 mil.
      await page.getByRole('button', { name: 'Corto', exact: true }).dispatchEvent('click')
      await page.getByText(/Tamaño del pedido: para ChatGPT o Gemini gratis/).waitFor({ timeout: 5000 })
      await page.getByRole('button', { name: '📋 Copiar el pedido' }).dispatchEvent('click')
      await page.waitForTimeout(800)
      const corto = await page.locator('textarea[readonly]').inputValue()
      assert.ok(corto.length <= 60000 && corto.startsWith('# PEDIDO DE TRABAJO PARA LA IA'), `corto: ${corto.length}`)
      await page.getByRole('button', { name: 'Normal', exact: true }).dispatchEvent('click')

      // Las respuestas que le dio la IA a Sergio.
      const caja = page.locator('textarea[placeholder^="Pegá acá la respuesta"]')
      await caja.fill(CORTADA)
      await page.getByRole('button', { name: '✓ Aplicar' }).dispatchEvent('click')
      await page.getByText(/La IA NO hizo la hoja: avisa que el texto le llegó cortado/).waitFor({ timeout: 5000 })
      await page.screenshot({ path: path.join(out, `${tag}-error-cortada.png`) })
      await caja.fill(PROSA)
      await page.getByRole('button', { name: '✓ Aplicar' }).dispatchEvent('click')
      await page.getByText(/La IA no escribió esta hoja: escribió otra cosa/).waitFor({ timeout: 5000 })

      // La buena: las cuatro casillas.
      await caja.fill(BUENA)
      await page.getByRole('button', { name: '✓ Aplicar' }).dispatchEvent('click')
      await page.getByText(/4 entradas escritas/).waitFor({ timeout: 5000 })
      const v = (await page.locator('textarea:not([readonly])').evaluateAll((xs) => xs.map((x) => x.value))).join('\n')
      for (let i = 1; i <= 4; i++) assert.ok(v.includes(`Texto ${i} del Comandante (FICT.).`), `falta el texto ${i}`)

      // El Word militar: sin «[IA — verificar]».
      const boton = page.locator('button[title="Descargar en el formato propio del documento"]')
      if (await boton.count()) {
        const d = page.waitForEvent('download', { timeout: 30000 })
        await boton.first().dispatchEvent('click')
        const w = await d
        const archivo = path.join(out, `${tag}-F1P3.docx`)
        await w.saveAs(archivo)
        const xml = execFileSync('unzip', ['-p', archivo, 'word/document.xml'], { encoding: 'utf8' })
        assert.ok(xml.includes('Texto 1 del Comandante (FICT.).'), 'el Word trae lo escrito')
        assert.ok(!/IA\s*[—–-]\s*verificar/.test(xml), 'el Word militar sale sin la marca de la IA')
      } else throw new Error('no está el botón del Word militar')
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: pedido con la tarea arriba (${pedido.length} car.; corto ${corto.length}), hojas del Cmte. y del JEM, errores de las dos respuestas de Sergio, respuesta buena en las 4 casillas, Word sin la marca de la IA.`)
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
