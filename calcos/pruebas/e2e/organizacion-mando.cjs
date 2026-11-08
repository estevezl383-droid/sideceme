// F3·P3 con el ejercicio del CE-I de Sergio (08-11-2026), reproducido sin la carta pesada:
// el CE-I disgregado (queda como PC) con DIV-9, DIV-3 y DIV. MEC.-1 (dependeDe), y en el calco
// también CTO., DIV. VANTS., FF.TT.T.O., FF.EE., CE-II, CE-III, CE-IV y DIV. MEC.-5, que NO
// dependen del CE-I. Las tres tareas como las tenía guardadas: T1 Bloquear = DIV-9 (OC 1),
// T2 Canalizar = CE-II (1 Brig.) + DIV. MEC.-5 (OD), T3 Bloquear = DIV-3 (OC 2), la reserva con 8
// brigadas del CE-II. Comprueba:
//   · «Quién la cumple» ofrece SÓLO DIV-9, DIV-3 y DIV. MEC.-1, y dice cuáles quedan afuera;
//   · las piezas del CE-II y la DIV. MEC.-5 salen de la OD y de la reserva, con el aviso;
//   · al tocar DIV. MEC.-1 en la OD, la forma gráfica muestra las tres divisiones por su nombre;
//   · en la carta, junto a cada tarea, la sigla con su unidad (sin tocarla);
//   · las tareas tácticas en verde fluorescente;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/organizacion-mando.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioOrganizacion } = require('../organizacion-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-organizacion-mando')
fs.mkdirSync(out, { recursive: true })

const CE1 = 1794152836679.3503
const D9 = 1794155927822.7246
const D3 = 1794155927823.095
const DM1 = 1794155927824.0781
const CE2 = 1794152836680.2815
const DM5 = 1794152836683.1384
const pr = (id, designacion, arma, escalon, lng, lat, extra = {}) => ({ id, tipo: 'unidad', bando: 'propias', designacion, arma, escalon, lng, lat, futura: false, agrupacion: false, instalacion: '', ...extra })
const en = (id, designacion, arma, escalon, lng, lat) => ({ id, tipo: 'unidad', bando: 'enemigo', designacion, arma, escalon, lng, lat, futura: true, agrupacion: false, instalacion: '' })
const piezas = (de, madre, n, simbolo, escalon, desde = 1) => Array.from({ length: n }, (_, i) => ({ de, id: `${de}-${desde + i}`, nom: `${simbolo === 'infanteria' ? 'INF' : 'INF MEC'} ${desde + i}`, grupo: 'maniobra', madre, escalon, simbolo }))

function ejercicioCE1() {
  const e = ejercicioOrganizacion()
  e.nombre = 'CE-I AO (copia de prueba)'
  e.ordenSup = { ...e.ordenSup, unidad: 'CE - I' }
  e.unidades = [
    pr(1794152836675.7993, 'CTO.', 'infanteria', 'ejercito', -67.131, -17.9617),
    pr(1794152836676.6367, 'DIV. VANTS.', 'aviacion', 'division', -67.081, -17.9817),
    pr(1794152836677.2585, 'FF.TT.T.O.', 'infanteria', 'ejercito', -66.7899, -18.8922),
    pr(1794152836678.281, 'FF.EE.', 'infanteria', 'regimiento', -66.7499, -18.9122),
    pr(CE1, 'CE-I', 'infanteria', 'cuerpo', -68.90007, -18.188988, { tipo: 'pc', disgregada: { puestas: [D9, D3, DM1], tipoAntes: 'unidad', vinculadas: [] } }),
    pr(CE2, 'CE-II', 'infanteria', 'cuerpo', -67.683, -18.35),
    pr(1794152836681.9363, 'CE-III', 'infanteria', 'cuerpo', -67.047, -19.2267),
    pr(1794152836682.841, 'CE-IV', 'infanteria', 'cuerpo', -66.825, -20.4607),
    pr(DM5, 'DIV. MEC.-5', 'mecanizada', 'division', -66.7769, -19.0133),
    pr(D9, 'DIV-9', 'infanteria', 'division', -68.90007, -18.133988, { dependeDe: CE1 }),
    pr(D3, 'DIV-3', 'infanteria', 'division', -68.849933, -18.216488, { dependeDe: CE1 }),
    pr(DM1, 'DIV. MEC.-1', 'mecanizada', 'division', -68.950207, -18.216488, { dependeDe: CE1 }),
    en('cae-probable-1-0', 'BAT. INF. BLIN. «CARAMPAGUÉ»', 'mecanizada', 'batallon', -69.099355, -18.337385),
    en('cae-probable-1-1', 'G. BLIN. 9 «VENCEDORES» (OD)', 'blindada', 'batallon', -69.118836, -18.294214),
    en('cae-probable-1-3', 'G.A.AP. «SALVO»', 'artilleria', 'batallon', -69.134929, -18.28896),
    en('cae-probable-1-7', 'CÍA. A/B (SPIKE)', 'antitanque', 'compania', -69.143761, -18.274436),
    en('cae-probable-1-8', 'BAT. AA.', 'antiaerea', 'compania', -69.155125, -18.286598),
    en('cae-probable-1-10', 'PEL. REC. BLIN.', 'cabmec', 'seccion', -69.100531, -18.289606),
  ]
  e.ops = {
    ...e.ops,
    objetivos: [
      { id: 'obj-probable-i0', coa: 'probable', nom: 'Objetivo intermedio', clase: 'intermedio', centro: [-68.912276, -18.202195], etiqueta: 'Oa' },
      { id: 'obj-probable-i1', coa: 'probable', nom: 'Terreno clave C11', clase: 'intermedio', centro: [-68.90556, -18.27016], etiqueta: 'Ob' },
    ],
    tareas: [
      { oi: { id: 'oi-t1', agId: 'ag-1', texto: '', piezas: piezas(D9, 'DIV-9', 9, 'infanteria', 'regimiento'), enemigos: ['cae-probable-1-7', 'cae-probable-1-10', 'cae-probable-1-3', 'cae-probable-1-1', 'cae-probable-1-8'], operacion: 'oc1', proporcion: '' }, rot: 120, tarea: 'bloquear', centro: [-69.097481, -18.200398], escala: 1, escalon: 'brigada' },
      { oi: { id: 'oi-t2', agId: 'ag-2', texto: '', piezas: [...piezas(CE2, 'CE-II', 1, 'infanteria', 'brigada'), ...piezas(DM5, 'DIV. MEC.-5', 9, 'inf_mecanizada', 'regimiento')], enemigos: ['cae-probable-1-10'], operacion: 'od', proporcion: '' }, rot: 210, tarea: 'canalizar', centro: [-68.970881, -18.259431], escala: 1, escalon: 'brigada' },
      { oi: { id: 'oi-t3', agId: 'ag-3', texto: '', piezas: piezas(D3, 'DIV-3', 9, 'infanteria', 'regimiento'), enemigos: [], operacion: 'oc2', proporcion: '' }, rot: 150, tarea: 'bloquear', centro: [-68.941269, -18.347105], escala: 1, escalon: 'brigada' },
    ],
  }
  e.g3 = { ...(e.g3 || {}), organizacionInicial: { puras: true, esquema: 'organizacion-inicial-v1', verEnCarta: true, reserva: { pos: null, agId: 'ag-r', piezas: piezas(CE2, 'CE-II', 8, 'infanteria', 'brigada', 2) } } }
  e.orgTarea = []
  e.centro = [-18.26, -68.97]
  return e
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1440, alto: 900 })
  const foto = (n) => page.screenshot({ path: path.join(out, `${n}.png`) })
  try {
    await sembrarYAbrir(page, ejercicioCE1())
    await page.getByRole('button', { name: /G-3 Operaciones/ }).first().dispatchEvent('click')
    await page.getByRole('button', { name: '📄 Documentos', exact: true }).dispatchEvent('click')
    await page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first().dispatchEvent('click')
    await page.getByRole('button', { name: /F3·P3.*Formación inicial de las fuerzas/ }).dispatchEvent('click')
    await page.locator('.oi-editor').waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)

    // Quién la cumple: sólo las del CE-I.
    const ofrecidas = [...new Set(await page.locator('.oi-pura b').allInnerTexts())]
    assert.deepEqual(ofrecidas.sort(), ['DIV-3', 'DIV-9', 'DIV. MEC.-1'].sort(), `ofrece: ${ofrecidas.join(', ')}`)
    const fuera = await page.locator('.oi-fuera-mando').first().innerText()
    assert.match(fuera, /Sólo las que dependen del CE-I/)
    for (const n of ['CTO.', 'CE-II', 'CE-III', 'CE-IV', 'DIV. MEC.-5', 'FF.EE.']) assert.ok(fuera.includes(n), `afuera: ${n}`)
    const perdidas = await page.locator('.oi-perdidas-mando').first().innerText()
    assert.match(perdidas, /CE-II/)
    assert.match(perdidas, /DIV\. MEC\.-5/)
    await page.locator('.oi-pura').first().scrollIntoViewIfNeeded()
    await page.locator('.oi-pura').first().locator('xpath=ancestor::div[contains(@class,"oi-tarjeta") or @style][2]').screenshot({ path: path.join(out, '1-quien-la-cumple.png') }).catch(() => foto('1-quien-la-cumple'))
    await page.locator('.oi-fuera-mando').first().scrollIntoViewIfNeeded()
    await foto('1b-afuera')

    // La OD (T2 Canalizar) la cumple ahora la DIV. MEC.-1: tocarla en su tarjeta.
    const tarjetaOD = page.locator('.oi-pura', { hasText: 'DIV. MEC.-1' })
    const n = await tarjetaOD.count()
    assert.equal(n, 4, 'DIV. MEC.-1 aparece en las tres tareas y en la reserva')
    // La tarjeta de la OD es la segunda (T2).
    await tarjetaOD.nth(1).dispatchEvent('click')
    await page.waitForTimeout(600)
    assert.match(await page.locator('.oi-editor').innerText(), /🪖 OD: DIV\. MEC\.-1/)

    // ⑥ La forma gráfica: las tres divisiones por su nombre, sin las piezas genéricas.
    await page.getByRole('button', { name: /La organización en forma gráfica/ }).dispatchEvent('click')
    await page.waitForTimeout(400)
    const grafica = await page.evaluate(() => [...document.querySelectorAll('.oi-editor div')].find((d) => /grid-template-columns:\s*repeat\(auto-fit/.test(d.getAttribute('style') || ''))?.innerText || '')
    assert.match(grafica, /OPERACIÓN DECISIVA[\s\S]*DIV\. MEC\.-1[\s\S]*OPERACIÓN DE CONFIGURACIÓN 1/)
    assert.match(grafica, /OPERACIÓN DE CONFIGURACIÓN 1[\s\S]*DIV-9/)
    assert.match(grafica, /OPERACIÓN DE CONFIGURACIÓN 2[\s\S]*DIV-3/)
    assert.ok(!/BAJO CONTROL[\s\S]*RESERVA/.test(grafica), 'la reserva del CE-II ya no está')
    await page.evaluate(() => [...document.querySelectorAll('.oi-editor div')].find((d) => /grid-template-columns:\s*repeat\(auto-fit/.test(d.getAttribute('style') || ''))?.setAttribute('data-prueba', 'grafica'))
    await page.locator('[data-prueba="grafica"]').screenshot({ path: path.join(out, '2-forma-grafica.png') })

    // La carta: la sigla con su unidad y las tareas en verde fluorescente.
    const siglas = await page.locator('.oi-sigla-unidad').allInnerTexts()
    assert.equal(siglas.length, 3, `siglas con unidad: ${siglas.join(' | ')}`)
    for (const [s, u] of [['OD', 'DIV. MEC.-1'], ['OC 1', 'DIV-9'], ['OC 2', 'DIV-3']]) assert.ok(siglas.some((x) => x.includes(s) && x.includes(u)), `${s} con ${u}`)
    const verdes = await page.evaluate(() => [...document.querySelectorAll('.sid-suelo')].filter((el) => el.innerHTML.includes('#39ff14')).length)
    assert.ok(verdes >= 3, `tareas verdes: ${verdes}`)
    await page.evaluate(() => window.__mapa2d && window.__mapa2d.setView([-18.27, -69.0], 11))
    await page.waitForTimeout(1500)
    await foto('3-carta')
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK CE-I: «Quién la cumple» sólo DIV-9, DIV-3 y DIV. MEC.-1 (afuera CTO., CE-II…, DIV. MEC.-5); la OD con DIV. MEC.-1; la forma gráfica por nombre; la sigla con su unidad en la carta; tareas en verde.')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error('errores de consola:', errores)
    throw e
  } finally {
    await cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
