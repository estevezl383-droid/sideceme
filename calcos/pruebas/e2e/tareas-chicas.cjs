// Tareas tácticas al 40 % (index-tareas-chicas-20261023.js), en la Mesa real (Chromium).
// El caso de Sergio: «las tareas tácticas por favor hacelas un 60 % más pequeñas». Con el compilado anterior y con el
// nuevo, tres tareas de 🎯 Tareas en la carta (bloquear de División, fijar de Batallón, canalizar de Brigada con
// escala 1,5):
//   · en la carta 2D cada una ocupa el 40 % de antes (±2 px por el redondeo);
//   · en el ⛰️ 3D, igual;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/tareas-chicas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, entrar3D } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-tareas-chicas')
fs.mkdirSync(SALIDAS, { recursive: true })
const ANTERIOR = 'index-google-mapas-20261023.js'
const VIGENTE = new RegExp('/assets/' + path.basename(require('../extraer').vigente()).replace(/\./g, '\\.'))
const TAREAS = [
  { tarea: 'bloquear', escalon: 'division', centro: [-68.3, -17.0], rot: 0 },
  { tarea: 'fijar', escalon: 'batallon', centro: [-68.2, -17.05], rot: 30 },
  { tarea: 'canalizar', escalon: 'brigada', centro: [-68.1, -16.98], rot: 0, escala: 1.5 },
]

// El tamaño de cada símbolo de tarea (el <svg> de `cb`, que va en un divIcon cuadrado).
const medir = (page, sel) =>
  page.evaluate((s) => Array.from(document.querySelectorAll(s)).filter((el) => /viewBox="0 0 100 100"/.test(el.innerHTML)).map((el) => Math.round(el.querySelector('svg').getBoundingClientRect().width)).sort((a, b) => a - b), sel)

async function correr(anterior) {
  const preparar = anterior
    ? (page) => page.route(VIGENTE, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, '..', '..', 'assets', ANTERIOR)) }))
    : undefined
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900, preparar })
  try {
    const datos = ejercicioPersonal({ nombre: 'PRUEBA TAREAS CHICAS (FICT.)' })
    datos.unidades = []
    datos.ops = { ...(datos.ops || {}), tareas: TAREAS }
    await sembrarYAbrir(page, datos)
    await page.evaluate(() => window.__mapa2d.setView([-17.02, -68.2], 11, { animate: false }))
    await page.waitForTimeout(1500)
    const en2d = await medir(page, '.leaflet-marker-pane > div')
    await page.screenshot({ path: path.join(SALIDAS, (anterior ? 'antes' : 'despues') + '-2d.png') })
    await entrar3D(page)
    await page.waitForTimeout(1500)
    const en3d = await medir(page, '.maplibregl-marker')
    await page.screenshot({ path: path.join(SALIDAS, (anterior ? 'antes' : 'despues') + '-3d.png') })
    return { en2d, en3d, errores: [...errores] }
  } finally {
    await cerrar()
  }
}

;(async () => {
  const antes = await correr(true)
  const despues = await correr(false)
  for (const k of ['en2d', 'en3d']) {
    assert.equal(antes[k].length, TAREAS.length, `${k}: las ${TAREAS.length} tareas antes (${antes[k]})`)
    assert.equal(despues[k].length, TAREAS.length, `${k}: las ${TAREAS.length} tareas después (${despues[k]})`)
    antes[k].forEach((a, i) => {
      const d = despues[k][i]
      assert.ok(Math.abs(d - a * 0.4) <= 2, `${k}: ${d} px contra ${a} px antes (${Math.round((d / a) * 100)} %)`)
    })
    console.log(`  ✔ ${k === 'en2d' ? 'carta 2D' : '⛰️ 3D'}: ${antes[k].join(', ')} px → ${despues[k].join(', ')} px (40 %)`)
  }
  assert.deepEqual(despues.errores, [], 'sin errores de consola')
  console.log('  ✔ sin errores de consola\n\nTodos los casos pasan.')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
