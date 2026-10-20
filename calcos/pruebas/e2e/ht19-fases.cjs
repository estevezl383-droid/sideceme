// 🗡️ H.T. 19 fase por fase con TODOS los elementos (index-ht19-fases-20261020.js), en la Mesa real
// (Chromium). El caso de Sergio: la Brigada enemiga tiene 13 elementos en el calco y la hoja sólo
// mostraba OC-1…OC-3, OD, ART., MORT. y AAC., con las fases en columnas:
//   · 🌱 Traer del calco pone a cada ficha en su sistema operativo (SEG., OC-1, OC-2, OD, ART., ART.-2,
//     MORT., AAC., ING., ADA., SERVICIOS y C4), con el nombre de su unidad;
//   · el editor va FASE POR FASE; el pedido a la IA trae las reglas cortas de tarea y propósito y
//     todas las casillas (más de 160);
//   · una respuesta de la IA con las claves nuevas se aplica; la vista previa imprime FASE I, sus
//     cuadros por sistema operativo, y recién después la FASE II;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/ht19-fases.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-ht19-fases')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')

const BRIGADA = [
  ['PEL. REC. BLIN.', 'caballeria', 'seccion'],
  ['BAT. INF. BLIN. «CARAMPAGUÉ»', 'infanteria', 'batallon'],
  ['CÍA. MORT. 120', 'infanteria', 'compania'],
  ['G.A.AP. «SALVO»', 'artilleria', 'batallon'],
  ['CÍA. A/B (SPIKE)', 'infanteria', 'compania'],
  ['PC BAT.', 'infanteria', 'batallon', 'pc'],
  ['BAT. AA.', 'artilleria', 'compania'],
  ['G. BLIN. 9 «VENCEDORES» (OD)', 'blindada', 'batallon'],
  ['CÍA. ING. MEC. «ACONCAGUA»', 'ingenieria', 'compania'],
  ['BAT. LAR-160', 'artilleria', 'compania'],
  ['PC 1RA. BRIG.', 'blindada', 'brigada', 'pc'],
  ['CÍA. TELECOM.', 'comunicaciones', 'compania'],
  ['CÍA. LOG.', 'logistica', 'compania'],
]

const leerHT19 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.ht19 && typeof v.ht19 === 'object' ? JSON.parse(JSON.stringify(v.ht19)) : undefined))

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA H.T. 19 FASES (FICT.)' })
  datos.unidades = [
    ...datos.unidades.filter((u) => u.bando !== 'enemigas'),
    ...BRIGADA.map(([designacion, arma, escalon, tipo = 'unidad'], i) => ({ id: `e-${i}`, bando: 'enemigo', tipo, designacion, arma, escalon, lat: -16.7 - i * 0.01, lng: -68.3, piezas: 3 })),
  ]
  datos.picb = {}
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-2 INTELIGENCIA/i }).first())
    await page.getByText('🔎 PICB — las 4 fases del G-2').waitFor({ timeout: 15000 })
    await clic(page.getByText('Desarrollar los cursos de acción del enemigo').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('H.T. 19', { exact: true }).first())
    await clic(page.getByRole('button', { name: '🌱 Traer del calco lo que falte' }).first())
    await page.waitForTimeout(500)

    // ── Los elementos, cada uno en su sistema operativo ──
    const h = await leerHT19(page)
    assert.deepEqual(h._items, { MANIOBRA: ['SEG.', 'OC-1', 'OC-2', 'OD'], 'APOYO DE FUEGOS': ['ART.', 'ART.-2', 'MORT.', 'AAC.'] })
    assert.equal(h._nom['C4|—'], 'PC BAT. · PC 1RA. BRIG. · CÍA. TELECOM.')
    assert.equal(h._nom['APOYO DE SERVICIOS|—'], 'CÍA. LOG.')

    // ── El editor va fase por fase ──
    await page.getByText('Maniobra — quién es quién').first().waitFor({ timeout: 5000 })
    await page.getByText('ART.-2 · BAT. LAR-160').first().waitFor({ timeout: 5000 })
    assert.ok((await page.getByText('OC-2 · CÍA. A/B (SPIKE)').count()) >= 4, 'el OC-2 aparece en cada una de las 4 fases')
    await page.screenshot({ path: path.join(SALIDAS, '1-editor.png') })

    // ── El pedido a la IA ──
    await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
    await page.evaluate(() => { try { navigator.clipboard.writeText = async () => {} } catch {} })
    await clic(page.getByRole('button', { name: '📋 Copiar el pedido' }).first())
    await page.waitForTimeout(600)
    await clic(page.getByRole('button', { name: '👁 Ver el pedido' }).first())
    const pedido = await page.locator('textarea[readonly]').last().inputValue()
    assert.match(pedido, /ESTA HOJA SE ESCRIBE CORTO/)
    assert.match(pedido, /"MANIOBRA\|SEG\.\|FASE I\|Tarea"/)
    assert.match(pedido, /"APOYO DE FUEGOS\|ART\.-2\|FASE IV\|Efecto"/)
    assert.match(pedido, /"APOYO DE FUEGOS\|AAC\.\|FASE IV\|Efecto"/, 'la hoja va entera, hasta la última casilla de fuegos')
    assert.ok(!/Se te piden las primeras/.test(pedido), 'no se corta en 160 casillas')

    // ── Una respuesta de la IA con las claves nuevas se aplica ──
    const resp = {
      'MANIOBRA|SEG.|FASE I|Tarea': 'Reconocer los vados del río Lauca en Ungallire.',
      'MANIOBRA|SEG.|FASE I|Propósito': 'Para ubicar el paso del OC-1.',
      'APOYO DE FUEGOS|ART.-2|FASE III|Tarea': 'Batir las reservas del CE-I en Macaya.',
      'MANIOBRA|OD|FASE IV|Tarea': 'Explotar la brecha hacia Huachacalla.',
    }
    await page.locator('textarea[placeholder="Pegá acá la respuesta completa de la IA…"]').first().fill(JSON.stringify(resp))
    await clic(page.getByRole('button', { name: '✓ Aplicar' }).first())
    await page.waitForTimeout(500)
    await page.getByText(/campo\(s\) completados/).first().waitFor({ timeout: 5000 })
    const h2 = await leerHT19(page)
    assert.match(h2['MANIOBRA|SEG.|FASE I|Tarea'], /^Reconocer los vados/)
    assert.match(h2['APOYO DE FUEGOS|ART.-2|FASE III|Tarea'], /^Batir las reservas/)
    assert.deepEqual(h2._items, h._items, 'los elementos se conservan al aplicar')

    // ── La vista previa: FASE I con sus cuadros, después FASE II ──
    await clic(page.getByRole('button', { name: '👁️ Vista previa' }).first())
    await page.waitForTimeout(800)
    const html = await page.evaluate(() => {
      const f = [...document.querySelectorAll('iframe')].map((x) => x.contentDocument?.body?.innerText || '').join('\n')
      return f || document.body.innerText
    })
    const iF1 = html.indexOf('FASE I\n')
    const iMan = html.indexOf('MANIOBRA', iF1)
    const iF2 = html.indexOf('FASE II\n')
    assert.ok(iF1 >= 0 && iMan > iF1 && iF2 > iMan, 'FASE I → MANIOBRA → … → FASE II')
    assert.ok(html.indexOf('SEG. · PEL. REC. BLIN.') > iF1, 'el reconocimiento tiene su renglón')
    assert.ok(html.slice(iF1, iF2).includes('Reconocer los vados del río Lauca'), 'la tarea de la FASE I va en la FASE I')
    await page.screenshot({ path: path.join(SALIDAS, '2-vista-previa.png') })
    await clic(page.getByText('← Volver').first())
    await page.waitForTimeout(400)

    // ── El Word con el formato de la Escuela (.docx) se arma sin errores ──
    const bajada = page.waitForEvent('download', { timeout: 20000 })
    await clic(page.getByRole('button', { name: /Word \(hoja de trabajo\)/ }).first())
    const doc = await bajada
    const ruta = path.join(SALIDAS, '3-ht19.docx')
    await doc.saveAs(ruta)
    assert.ok(fs.statSync(ruta).size > 5000, 'el .docx tiene contenido')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: la H.T. 19 trae los 13 elementos, va fase por fase y la IA recibe las reglas cortas de tarea y propósito.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
