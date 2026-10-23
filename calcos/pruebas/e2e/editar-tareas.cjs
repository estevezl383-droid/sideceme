// Editar las tareas tácticas ya puestas (index-editar-tareas-20261023.js), en la Mesa real (Chromium).
// El pedido de Sergio (23-10-2026), con una «Atacar con Fuego» en la carta: «me das la opción de agrandar o achicar las
// tareas tácticas, asimismo de cambiar de dirección y otra opción de poner otras tareas tácticas».
//   · carta 2D: un clic sobre la tarea abre su recuadro; ➕ Agrandar la pone al 125 % (el símbolo crece igual) y
//     ➖ Achicar la devuelve; ↻ 45° y «Hacia el S» la giran (el símbolo gira); la barra de la dirección también;
//     «Cambiar por otra tarea táctica» la cambia por Fijar; la magnitud por División; ⧉ Poner otra igual deja una
//     segunda al lado, con su recuadro abierto; ↺ Restablecer vuelve a 0° y 100 %;
//   · el recuadro sigue abierto después de cada cambio y se cierra tocando afuera;
//   · ↶ Deshacer vuelve atrás cada cambio;
//   · ⛰️ 3D: el clic sobre la tarea también abre el recuadro y ➕ Agrandar funciona;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/editar-tareas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, entrar3D, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-editar-tareas')
fs.mkdirSync(SALIDAS, { recursive: true })

const tareas = (page) =>
  estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.tareas) && Array.isArray(v.limites) ? v.tareas.map((t) => ({ ...t })) : undefined))
// El símbolo de cada tarea en la carta: tamaño y giro (el rotate() del <g> de `cb`).
const simbolos = (page, sel) =>
  page.evaluate(
    (s) =>
      Array.from(document.querySelectorAll(s))
        .filter((el) => /viewBox="0 0 100 100"/.test(el.innerHTML))
        .map((el) => {
          const b = el.querySelector('svg').getBoundingClientRect()
          const g = el.querySelector('svg g').getAttribute('transform') || ''
          return { x: b.left + b.width / 2, y: b.top + b.height / 2, ancho: Math.round(b.width), rot: Number((g.match(/rotate\((-?[\d.]+)/) || [0, 0])[1]) }
        }),
    sel,
  )
const recuadros = (page) => page.locator('.sid-tarea-ed').count()
const boton = (page, texto) => page.locator('.sid-tarea-ed button', { hasText: texto }).first()

async function correr() {
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900 })
  const r = { errores, pasos: [] }
  const anotar = async (que) => {
    await page.waitForTimeout(500)
    r.pasos.push({ que, tareas: await tareas(page), simb: await simbolos(page, '.leaflet-marker-pane > div'), abiertos: await recuadros(page) })
  }
  try {
    const datos = ejercicioPersonal({ nombre: 'PRUEBA EDITAR TAREAS (FICT.)' })
    datos.unidades = []
    datos.ops = { ...(datos.ops || {}), tareas: [{ tarea: 'atacar_fuego', escalon: 'batallon', centro: [-68.2, -17.02], rot: 270 }] }
    await sembrarYAbrir(page, datos)
    // La tarea abajo de la carta: arriba va la barra de botones de la Mesa.
    await page.evaluate(() => window.__mapa2d.setView([-16.955, -68.2], 12, { animate: false }))
    await page.waitForTimeout(1500)
    await anotar('inicio')
    const s0 = r.pasos[0].simb[0]
    await page.mouse.click(s0.x, s0.y)
    await anotar('clic')
    await page.screenshot({ path: path.join(SALIDAS, '1-recuadro-2d.png') })
    await boton(page, 'Agrandar').click()
    await anotar('agrandar')
    await boton(page, 'Achicar').click()
    await anotar('achicar')
    await boton(page, '↻ 45°').click()
    await anotar('girar45')
    await page.locator('.sid-tarea-ed select[data-rumbo]').selectOption('180')
    await anotar('haciaSur')
    await page.locator('.sid-tarea-ed input[data-rot]').evaluate((el) => {
      el.value = '100'
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await anotar('barraDir')
    await page.locator('.sid-tarea-ed select[data-tarea]').selectOption('fijar')
    await anotar('fijar')
    await page.locator('.sid-tarea-ed select[data-mag]').selectOption('division')
    await anotar('division')
    await page.screenshot({ path: path.join(SALIDAS, '2-editada-2d.png') })
    await boton(page, 'Restablecer').click()
    await anotar('restablecer')
    await boton(page, 'Poner otra igual').click()
    await anotar('duplicar')
    await page.screenshot({ path: path.join(SALIDAS, '3-otra-igual-2d.png') })
    await page.mouse.click(700, 820)
    await anotar('afuera')
    const deshacer = page.locator('.botones-mapa > button.btn-deshacer').first()
    await deshacer.click()
    await anotar('deshacer1')
    await deshacer.click()
    await anotar('deshacer2')

    await entrar3D(page)
    await page.evaluate(() => window.__map3d.jumpTo({ center: [-68.2, -16.98], zoom: 12, bearing: 0, pitch: 30 }))
    await page.waitForTimeout(2500)
    const en3d = await simbolos(page, '.maplibregl-marker .sid-suelo')
    r.en3d = en3d
    await page.mouse.click(en3d[0].x, en3d[0].y)
    await page.waitForTimeout(800)
    r.abierto3d = await page.locator('.maplibregl-popup .sid-tarea-ed').count()
    const antes3d = (await tareas(page))[0].escala || 1
    await page.locator('.maplibregl-popup .sid-tarea-ed button', { hasText: 'Agrandar' }).first().click()
    await page.waitForTimeout(1200)
    r.escala3d = [antes3d, (await tareas(page))[0].escala]
    r.sigue3d = await page.locator('.maplibregl-popup .sid-tarea-ed').count()
    await page.screenshot({ path: path.join(SALIDAS, '4-recuadro-3d.png') })
    return r
  } finally {
    await cerrar()
  }
}

;(async () => {
  const r = await correr()
  const p = Object.fromEntries(r.pasos.map((x) => [x.que, x]))
  const t = (k, i = 0) => p[k].tareas[i]
  const s = (k, i = 0) => p[k].simb[i]

  assert.equal(p.inicio.abiertos, 0, 'al abrir no hay recuadro')
  assert.equal(p.clic.abiertos, 1, 'un clic sobre la tarea abre su recuadro')
  console.log('  ✔ carta 2D: un clic sobre la tarea abre su recuadro')

  assert.equal(t('agrandar').escala, 1.25, '➕ Agrandar: 125 %')
  assert.ok(Math.abs(s('agrandar').ancho - s('inicio').ancho * 1.25) <= 2, `➕ Agrandar: el símbolo ${s('inicio').ancho} → ${s('agrandar').ancho} px`)
  assert.equal(t('achicar').escala, 1, '➖ Achicar: vuelve a 100 %')
  assert.equal(s('achicar').ancho, s('inicio').ancho, '➖ Achicar: el símbolo vuelve a su tamaño')
  console.log(`  ✔ ➕ Agrandar / ➖ Achicar: ${s('inicio').ancho} → ${s('agrandar').ancho} → ${s('achicar').ancho} px`)

  assert.equal(t('girar45').rot, 315, '↻ 45°: de 270° a 315°')
  assert.equal(s('girar45').rot, 315, '↻ 45°: el símbolo gira')
  assert.equal(t('haciaSur').rot, 180, '«Hacia el S»: 180°')
  assert.equal(t('barraDir').rot, 100, 'la barra de la dirección: 100°')
  assert.equal(s('barraDir').rot, 100, 'la barra de la dirección: el símbolo gira')
  console.log('  ✔ dirección: ↻ 45° (270° → 315°), «Hacia el S» (180°) y la barra (100°), el símbolo gira')

  assert.equal(t('fijar').tarea, 'fijar', 'cambiada por Fijar')
  assert.equal(t('fijar').rot, 100, 'al cambiarla conserva la dirección')
  assert.equal(t('division').escalon, 'division', 'magnitud División')
  assert.ok(s('division').ancho > s('fijar').ancho, `División es más grande (${s('fijar').ancho} → ${s('division').ancho} px)`)
  console.log('  ✔ cambiada por otra tarea táctica (Fijar) y por otra magnitud (División)')

  assert.deepEqual([t('restablecer').rot, t('restablecer').escala], [0, 1], '↺ Restablecer: 0° y 100 %')
  assert.equal(p.duplicar.tareas.length, 2, '⧉ Poner otra igual: dos tareas')
  assert.deepEqual({ ...t('duplicar', 1), centro: null }, { ...t('duplicar', 0), centro: null }, '⧉ la otra es igual')
  assert.ok(t('duplicar', 1).centro[0] > t('duplicar', 0).centro[0], '⧉ la otra queda al lado (al este)')
  assert.equal(p.duplicar.abiertos, 1, '⧉ queda abierto el recuadro (de la nueva)')
  console.log('  ✔ ↺ Restablecer y ⧉ Poner otra igual (al lado, con su recuadro abierto)')

  for (const k of ['clic', 'agrandar', 'achicar', 'girar45', 'haciaSur', 'barraDir', 'fijar', 'division', 'restablecer'])
    assert.equal(p[k].abiertos, 1, `el recuadro sigue abierto después de «${k}»`)
  assert.equal(p.afuera.abiertos, 0, 'tocar afuera lo cierra')
  console.log('  ✔ el recuadro sigue abierto mientras se edita y se cierra tocando afuera')

  assert.equal(p.deshacer1.tareas.length, 1, '↶ Deshacer: saca la otra igual')
  assert.deepEqual([t('deshacer2').rot, t('deshacer2').escala], [100, 1], '↶ Deshacer: vuelve antes de ↺ Restablecer')
  assert.equal(t('deshacer2').escalon, 'division')
  console.log('  ✔ ↶ Deshacer vuelve atrás cada cambio')

  assert.equal(r.en3d.length, 1, '⛰️ 3D: la tarea está')
  assert.equal(r.abierto3d, 1, '⛰️ 3D: un clic sobre la tarea abre su recuadro')
  assert.deepEqual(r.escala3d, [1, 1.25], '⛰️ 3D: ➕ Agrandar')
  assert.equal(r.sigue3d, 1, '⛰️ 3D: el recuadro sigue abierto')
  console.log('  ✔ ⛰️ 3D: el clic abre el recuadro y ➕ Agrandar funciona')

  assert.deepEqual(r.errores, [], 'sin errores de consola')
  console.log('  ✔ sin errores de consola\n\nTodos los casos pasan.')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
