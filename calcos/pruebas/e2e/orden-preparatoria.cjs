// 📄 La F6·P4 «Orden Preparatoria N° 3» con el CAP aprobado (index-op3-20261026.js), en la Mesa real (Chromium). El
// caso de Sergio (26-10-2026): después de «Completar y mejorar», el «Concepto de la operación (el CAP aprobado)» quedó
// VACÍO y el aviso nombró como inventadas la «DIV MEC-1» y la «VI División de Ejército» de la Orden superior.
//   · la casilla vieja que dejó el 🌱 de antes («I.- SITUACIÓN · A. Fuerzas enemigas») no da aviso;
//   · 🤖 el pedido lleva «CASI LA ORDEN DE OPERACIONES», el Concepto obligatorio y el CAP del G-3;
//   · ✓ Aplicar una respuesta SIN el Concepto (con la DIV MEC-1 y la VI División): el Concepto se llena con el CAP del
//     G-3, el mensaje lo dice y no hay «⚠️ OJO»; la casilla vieja pasa a «I.- SITUACIÓN»;
//   · ✓ Aplicar con la clave escrita con otras palabras («… (CAP aprobado)») entra en su casilla;
//   · 🌱 trae las tareas por unidad sin pisar lo de la IA;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/orden-preparatoria.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto, HOJA } = require('../concepto-ejemplo.js')
const X = require('../cap-carta-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-orden-preparatoria')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const CONC = 'III.- EJECUCIÓN · A. Concepto de la operación (el CAP aprobado)'
const leerPrep3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.prep3 && typeof v.prep3 === 'object' && v.concepto ? JSON.parse(JSON.stringify(v.prep3)) : undefined))

async function verPedido(page) {
  await page.evaluate(() => { try { navigator.clipboard.writeText = async () => {} } catch {} })
  await clic(page.getByRole('button', { name: '📋 Copiar el pedido' }).first())
  await page.waitForTimeout(600)
  await clic(page.getByRole('button', { name: '👁 Ver el pedido' }).first())
  return page.locator('textarea[readonly]').last().inputValue()
}
async function abrirF6P4(page) {
  await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
  await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
  await clic(page.getByRole('button', { name: /Aprobar el curso de acción/ }).first())
  await clic(page.getByRole('button', { name: /F6·P4.*Orden Preparatoria N° 3/ }).first())
  await page.getByText(CONC).first().waitFor({ timeout: 10000 })
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const { leerRespuesta } = await import('../../cap-propios/v1/carta-ia.mjs')
  const ej = ejercicioConcepto({ nombre: 'PRUEBA O.P. N° 3 CE-I (FICT.)' })
  const L = leerRespuesta(X.RESPUESTA_TEXTO, { unidades: ej.unidades, ops: ej.ops, cmoc: ej.cmoc, ordenSup: ej.ordenSup, lugares: [], tareas: X.TAREAS, obstaculos: X.OBSTACULOS, tiposFuego: X.TIPOS_FUEGO, efectos: X.EFECTOS, plan: { blancos: [] } })
  ej.fasesCOA = { propio: L.caps[1].fases, enemigo: [] }
  ej.ordenSup = {
    ...ej.ordenSup,
    enemigo: 'SATURNO emplea su Fuerza Terrestre con la VI DE (CG IQUIQUE) en el norte. La VI DE ataca con la 1ª Br. Ac. «CORACEROS» por el valle del río LAUCA.',
    propias: 'CE-I en AO LAUCA y DIV MEC-1 en TAMBO QUEMADO.',
  }
  ej.g3 = {
    concepto: HOJA,
    coa: { 'Denominación del CAP': 'CAP 1 — Defensa de área', 'Enunciado completo del curso de acción': 'El CE-I defiende en el AO LAUCA con la DIV MEC-2 como esfuerzo principal sobre la AA-1.' },
    // Lo que dejaba el 🌱 de antes: una casilla que la F6·P4 no tiene.
    prep3: { 'I.- SITUACIÓN · A. Fuerzas enemigas': 'La 1ª Br. Ac. «CORACEROS» ataca por la AA-1.' },
  }
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  try {
    await sembrarYAbrir(page, ej)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})

    await abrirF6P4(page)
    assert.equal(await page.getByText(/Revisar esta hoja/).count(), 0, 'la casilla vieja no da aviso')
    await foto('1-f6p4')

    // 🤖 el pedido
    await clic(page.getByRole('button', { name: '🤖 Trabajar esta hoja con IA' }).first())
    await clic(page.getByRole('button', { name: 'Completar y mejorar', exact: true }).first())
    const p = await verPedido(page)
    assert.match(p, /LA ORDEN PREPARATORIA N° 3 ES CASI LA ORDEN DE OPERACIONES/)
    assert.match(p, /«III\.- EJECUCIÓN · A\. Concepto de la operación \(el CAP aprobado\)» es OBLIGATORIO/)
    assert.match(p, /## F3·P6 — Curso de acción propio \(CAP 1\)/)
    assert.match(p, /## Las fases 🔵 del CAP 1 en la carta\n- FASE I/)
    assert.ok(p.lastIndexOf('CASI LA ORDEN DE OPERACIONES') < p.lastIndexOf('# CÓMO CONTESTAR'), 'antes de CÓMO CONTESTAR')

    // ✓ Aplicar una respuesta SIN el Concepto, con la DIV MEC-1 y la VI División (como la de Sergio)
    const caja = page.locator('textarea[placeholder="Pegá acá la respuesta completa de la IA…"]').first()
    const resp = {
      OBJETO: 'Difundir las directrices actualizadas de planeamiento del CE-I.',
      'III.- EJECUCIÓN · Intención del Comandante': 'Propósito: detener al primer escalón enemigo, la 1ª Brigada Acorazada «CORACEROS», para impedir la convergencia de las brigadas de la VI División de Ejército sobre HUACHACALLA. Tareas clave: mantener enlaces con DIV MEC-1 (PC-1, PC-2) y CE-II.',
    }
    await caja.fill('```json\n' + JSON.stringify(resp) + '\n```')
    await clic(page.getByRole('button', { name: '✓ Aplicar' }).first())
    await page.getByText(/campo\(s\) escritos.*La IA dejó vacío/s).first().waitFor({ timeout: 5000 })
    assert.equal(await page.getByText(/⚠️ OJO/).count(), 0, 'sin avisos falsos (DIV MEC-1, VI División)')
    let v = await leerPrep3(page)
    assert.match(v[CONC], /^CAP 1 «Defensa de área», aprobado por el Comandante/)
    assert.match(v[CONC], /FASE V/)
    assert.equal(v['I.- SITUACIÓN'], 'A. Fuerzas enemigas: La 1ª Br. Ac. «CORACEROS» ataca por la AA-1.')
    assert.equal(v['I.- SITUACIÓN · A. Fuerzas enemigas'], undefined, 'la casilla vieja ya no está')
    assert.match(v['III.- EJECUCIÓN · Intención del Comandante'], /^Propósito: detener/)
    await foto('2-aplicar')

    // ✓ Aplicar con la clave escrita con otras palabras
    await caja.fill('```json\n' + JSON.stringify({ 'III.- EJECUCIÓN · A. Concepto de la operación (CAP aprobado)': 'La maniobra de la IA, fase por fase.' }) + '\n```')
    await clic(page.getByRole('button', { name: '✓ Aplicar' }).first())
    await page.waitForTimeout(400)
    v = await leerPrep3(page)
    assert.match(v[CONC], /^La maniobra de la IA, fase por fase\./)

    // 🌱 trae lo que falta (las tareas por unidad, la coordinación) sin pisar el Concepto de la IA
    await clic(page.getByRole('button', { name: '🌱 Traer del calco lo que falte' }).first())
    await page.waitForTimeout(400)
    v = await leerPrep3(page)
    assert.match(v[CONC], /^La maniobra de la IA/, '🌱 no pisa')
    assert.match(v['III.- EJECUCIÓN · B. Tareas para las UU. de maniobra'], /^1\. DIV MEC-2.*FASE I/)
    for (const k of Object.keys(v)) assert.ok(!/· A\. Fuerzas enemigas$/.test(k), `«${k}» no es de la F6·P4`)

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e O.P. N° 3: el pedido con el CAP, ✓ Aplicar llena el Concepto vacío y sin avisos falsos, la clave parecida entra')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
