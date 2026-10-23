// Puntos de coordinación al 40 % y rótulos AIN al 30 % (index-puntos-chicos-20261023.js), en la Mesa real (Chromium).
// El caso de Sergio: «reduce de tamaño los puntos de control un 60 % y los aines (AIN) un 50 %». Con el compilado
// anterior y con el nuevo, dos puntos de coordinación (⊗) y dos A.I.N. (una con su fecha) en la carta:
//   · en la carta 2D el ⊗ ocupa el 40 % de antes y el AIN la mitad (±1,5 px por el redondeo);
//   · en el ⛰️ 3D, igual;
//   · el nombre del AIN sigue entrando en su recuadro (la letra creció en el dibujo para que se siga leyendo);
//   · sin errores de consola.
//   node calcos/pruebas/e2e/puntos-chicos.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, entrar3D } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-puntos-chicos')
fs.mkdirSync(SALIDAS, { recursive: true })
const ANTERIOR = 'index-tareas-chicas-20261023.js'
const VIGENTE = new RegExp('/assets/' + path.basename(require('../extraer').vigente()).replace(/\./g, '\\.'))
const COORDINACION = [
  { centro: [-68.3, -17.0], nombre: 'PC 1' },
  { centro: [-68.2, -17.05], nombre: 'PC 2' },
]
const AINS = [
  { nom: 'AIN-2', centro: [-68.1, -16.98] },
  { nom: 'AIN-12', centro: [-68.25, -16.95], noAntes: 'D+1', noDespues: 'D+3' },
]

// El ancho de cada ⊗ (viewBox 0 0 44 44) y de cada AIN (viewBox 0 0 62 …), y si el nombre del AIN entra en su recuadro.
const medir = (page, sel) =>
  page.evaluate((s) => {
    const svgs = Array.from(document.querySelectorAll(s + ' svg'))
    const ancho = (el) => Math.round(el.getBoundingClientRect().width * 10) / 10
    const ains = svgs.filter((el) => /^0 0 62 /.test(el.getAttribute('viewBox') || ''))
    return {
      puntos: svgs.filter((el) => el.getAttribute('viewBox') === '0 0 44 44').map(ancho).sort((a, b) => a - b),
      ains: ains.map(ancho).sort((a, b) => a - b),
      entra: ains.every((el) => el.querySelector('text').getBBox().width <= 58),
    }
  }, sel)

async function correr(anterior) {
  const preparar = anterior
    ? (page) => page.route(VIGENTE, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, '..', '..', 'assets', ANTERIOR)) }))
    : undefined
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900, preparar })
  try {
    const datos = ejercicioPersonal({ nombre: 'PRUEBA PUNTOS CHICOS (FICT.)' })
    datos.unidades = []
    datos.ops = { ...(datos.ops || {}), coordinacion: COORDINACION, ains: AINS }
    await sembrarYAbrir(page, datos)
    await page.evaluate(() => window.__mapa2d.setView([-17.0, -68.2], 11, { animate: false }))
    await page.waitForTimeout(1500)
    const en2d = await medir(page, '.leaflet-marker-pane')
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
    const donde = k === 'en2d' ? 'carta 2D' : '⛰️ 3D'
    for (const [que, n, factor] of [['puntos', COORDINACION.length, 0.4], ['ains', AINS.length, 0.5]]) {
      assert.equal(antes[k][que].length, n, `${donde}: ${n} ${que} antes (${antes[k][que]})`)
      assert.equal(despues[k][que].length, n, `${donde}: ${n} ${que} después (${despues[k][que]})`)
      antes[k][que].forEach((a, i) => {
        const d = despues[k][que][i]
        assert.ok(Math.abs(d - a * factor) <= 1.5, `${donde}, ${que}: ${d} px contra ${a} px antes (${Math.round((d / a) * 100)} %)`)
      })
      console.log(`  ✔ ${donde}, ${que === 'puntos' ? 'puntos de coordinación' : 'AIN'}: ${antes[k][que].join(', ')} px → ${despues[k][que].join(', ')} px (${factor * 100} %)`)
    }
    assert.ok(despues[k].entra, `${donde}: el nombre de cada AIN entra en su recuadro`)
  }
  assert.deepEqual(despues.errores, [], 'sin errores de consola')
  console.log('  ✔ el nombre de cada AIN entra en su recuadro\n  ✔ sin errores de consola\n\nTodos los casos pasan.')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
