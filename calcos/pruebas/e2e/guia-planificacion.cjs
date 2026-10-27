// F2·P15 — GUÍA DE PLANIFICACIÓN DEL COMANDANTE en la Mesa real (Chromium), con el formato del PMTD 2017
// (calcos/guia-planificacion/v1/guia.mjs). Sergio, 27-10-2026: el Word salía con un «A.- Área / Sección: … ·
// Guía impartida: … · Observación: …» por renglón; el formato son los párrafos I.- a XIII.- con su título.
//   · la hoja guardada con el cuadro viejo (renglones del CE-I) se abre con cada renglón en su párrafo;
//   · el Word de lo guardado así ya sale con los párrafos romanos, sin «Área / Sección:» ni «Guía impartida:»;
//   · el pedido a la IA lleva las 13 claves y qué va en cada una; la respuesta llena los 13 párrafos;
//   · el Word final: los 13 títulos en orden, la firma del Comandante, sin errores de consola.
// (La F6·P2 Guía de Planificación Final tiene su propia prueba: e2e/guia-final.cjs.)
// Sin servicios externos: la IA es una respuesta escrita en la prueba.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioRiesgo } = require('../riesgo-ejercicio.js')

const out = path.resolve(__dirname, '../salidas-guia-planificacion')
fs.mkdirSync(out, { recursive: true })

const TITULOS = ['LA OPERACIÓN DECISIVA', 'CURSOS DE ACCIÓN PROPIOS Y DEL ENEMIGO PARA SER CONSIDERADOS', 'REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE (RCIC)', 'LA GUÍA DE RECONOCIMIENTO', 'RIESGO', 'ENGAÑO MILITAR', 'APOYO DE FUEGOS', 'APOYO DE INGENIERÍA (MOVILIDAD/CONTRA MOVILIDAD)', 'MEDIDAS DE SEGURIDAD', 'PLAN DE TIEMPO', 'TIPO DE ORDEN QUE SE DEBE DISTRIBUIR', 'TIPO DE ENSAYO QUE SE DEBERÁ LLEVAR A CABO', 'PRIORIDADES DE APOYO DE SERVICIO DE COMBATE']
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII']
const CLAVES = TITULOS.map((t, i) => `${ROMANOS[i]}.- ${t}`)
const BUENA = '```json\n' + JSON.stringify(Object.fromEntries(CLAVES.map((k, i) => [k, `Guía ${i + 1} del Comandante (FICT.).`])), null, 2) + '\n```'

// Los renglones del Word de Sergio (CE-I), recortados.
const fila = (a, g, o) => ({ 'Área / Sección': a, 'Guía impartida': g, 'Observación': o })
const VIEJA = [
  fila('Apreciación y Método', 'Se compararán dos Cursos de Acción Propios frente al CAE-1 y al CAE-2 (FICT.).', 'Regla 1/3 - 2/3.'),
  fila('Inteligencia (G-2)', 'Orientar la búsqueda sobre la AIN-2 y la AIN-3 (FICT.).', ''),
  fila('Operaciones (G-3)', 'Retener la LPR sobre la LF «PUMA» con dos divisiones en primer escalón (FICT.).', ''),
  fila('Logística (G-4)', 'Centralizar el apoyo en el PD-1 de Turco (FICT.).', ''),
  fila('Ingeniería (EME)', 'Prioridad 1: la Zona de Obstáculos ZO-1 (FICT.).', ''),
  fila('Apoyo de Fuegos / Artillería (EME)', 'Contrabatería masiva en la Fase II (FICT.).', ''),
  fila('Comunicaciones (EME)', 'Poner en vigor las IOC «ILLIMANI» (FICT.).', ''),
]

function ejercicio() {
  const e = ejercicioRiesgo()
  e.nombre = 'PRUEBA GUÍA DE PLANIFICACIÓN (FICT.)'
  e.hojasG = { cmte: { guiaPlanificacion: VIEJA } }
  return e
}

async function bajarWord(page, nombre) {
  const boton = page.locator('button[title="Descargar en el formato propio del documento"]')
  assert.ok(await boton.count(), 'no está el botón del Word')
  const d = page.waitForEvent('download', { timeout: 30000 })
  await boton.first().dispatchEvent('click')
  const w = await d
  const archivo = path.join(out, nombre)
  await w.saveAs(archivo)
  const xml = execFileSync('unzip', ['-p', archivo, 'word/document.xml'], { encoding: 'utf8' })
  const texto = xml.replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
  return { archivo, xml, texto }
}

async function abrirHoja(page, re) {
  const volver = page.getByRole('button', { name: '← Volver a mis hojas' })
  if (await volver.count()) await volver.dispatchEvent('click')
  await page.getByRole('button', { name: re }).first().dispatchEvent('click')
  await volver.waitFor({ timeout: 15000 })
}

;(async () => {
  const a = await abrir({ ancho: 1440, alto: 1000, consulta: '?puesto=cmte' })
  const { page } = a
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
  page.on('dialog', (d) => d.accept())
  try {
    await sembrarYAbrir(page, ejercicio())
    await page.getByRole('button', { name: '⭐ CMTE.' }).first().dispatchEvent('click')
    await abrirHoja(page, /F2·P15\s*Guía de Planificación del Comandante/)

    // La hoja: los trece párrafos y cada renglón viejo en el suyo.
    const cuerpo = await page.locator('body').innerText()
    for (const k of CLAVES) assert.ok(cuerpo.includes(k), `la hoja no muestra «${k}»`)
    const valor = (k) => page.locator('label', { hasText: k }).first().locator('textarea').inputValue()
    assert.match(await valor('II.- CURSOS DE ACCIÓN'), /dos Cursos de Acción Propios/)
    assert.match(await valor('III.- REQUERIMIENTOS'), /AIN-2/)
    assert.match(await valor('I.- LA OPERACIÓN DECISIVA'), /LF «PUMA»/)
    assert.match(await valor('VII.- APOYO DE FUEGOS'), /Contrabatería/)
    assert.match(await valor('VIII.- APOYO DE INGENIERÍA'), /ZO-1/)
    assert.match(await valor('IX.- MEDIDAS DE SEGURIDAD'), /ILLIMANI/)
    assert.match(await valor('XIII.- PRIORIDADES'), /PD-1/)
    await page.screenshot({ path: path.join(out, 'hoja-vieja.png'), fullPage: true })

    // El Word de lo guardado con el cuadro viejo: ya con los párrafos.
    const viejo = await bajarWord(page, 'F2P15-de-la-hoja-vieja.docx')
    assert.ok(!/Área \/ Sección:|Guía impartida:/.test(viejo.texto), 'el Word sigue con el cuadro viejo')
    for (const t of ['LA OPERACIÓN DECISIVA', 'CURSOS DE ACCIÓN PROPIOS Y DEL ENEMIGO PARA SER CONSIDERADOS', 'APOYO DE FUEGOS'])
      assert.ok(viejo.texto.includes(t), `el Word no trae «${t}»`)

    // La IA: las 13 claves y qué va en cada una.
    if (!(await page.getByRole('button', { name: '📋 Copiar el pedido' }).count())) await page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).dispatchEvent('click')
    await page.getByRole('button', { name: 'Completar y mejorar' }).dispatchEvent('click')
    await page.getByRole('button', { name: '📋 Copiar el pedido' }).dispatchEvent('click')
    await page.getByRole('button', { name: /Ver el pedido/ }).dispatchEvent('click')
    const pedido = await page.locator('textarea[readonly]').inputValue()
    fs.writeFileSync(path.join(out, 'pedido.md'), pedido)
    for (const k of CLAVES) assert.ok(pedido.includes(`"${k}"`), `el pedido no trae la clave «${k}»`)
    assert.ok(pedido.includes('QUÉ VA EN CADA CLAVE'), 'el pedido no dice qué va en cada párrafo')
    assert.ok(pedido.includes('PMTD 2017, Parte Tercera, Cap. II'))
    const caja = page.locator('textarea[placeholder^="Pegá acá la respuesta"]')
    await caja.fill(BUENA)
    await page.getByRole('button', { name: '✓ Aplicar' }).dispatchEvent('click')
    await page.getByText(/13 entradas escritas/).waitFor({ timeout: 5000 })

    // El Word: los 13 títulos, en orden, y la firma.
    const w = await bajarWord(page, 'F2P15.docx')
    let desde = 0
    for (const t of TITULOS) {
      const i = w.texto.indexOf(t, desde)
      assert.ok(i >= 0, `el Word no trae «${t}» (o no en orden)`)
      desde = i + t.length
    }
    for (let i = 1; i <= 13; i++) assert.ok(w.texto.includes(`Guía ${i} del Comandante (FICT.).`), `falta la guía ${i}`)
    assert.ok(w.texto.includes('GUÍA DE PLANIFICACIÓN DEL COMANDANTE'))
    assert.match(w.texto, /EL COMANDANTE/)
    assert.ok(!/Área \/ Sección:|Guía impartida:|IA\s*[—–-]\s*verificar/.test(w.texto))
    try { execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', out, w.archivo], { stdio: 'ignore', timeout: 120000 }) } catch {}


    assert.deepEqual(a.errores, [])
    console.log('OK: la F2·P15 vieja abre en sus párrafos y su Word ya sale con el formato; el pedido con las 13 claves y su guía; el Word con I.- a XIII.- en orden y la firma; sin errores de consola.')
  } catch (e) {
    console.error('ERRORES APP', a.errores)
    fs.writeFileSync(path.join(out, 'fallo.txt'), await page.locator('body').innerText().catch(() => ''))
    await page.screenshot({ path: path.join(out, 'fallo.png'), fullPage: true }).catch(() => {})
    throw e
  } finally {
    await a.cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
