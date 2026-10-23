// Magnitudes al 60 % y acostadas, tareas acostadas, fichas que se arrastran en el ⛰️ 3D y concentraciones al 60 % con su
// recuadro sólo al tocarlas (index-suelo-20261023.js, fuegos/plan-fuegos.js, superponer/superponer.js), en la Mesa real.
// Los pedidos de Sergio (23-10-2026): «la magnitud de los límites… reducido en un 40 %… no deben flotar ni cambiar de
// dirección, deben estar alineadas con la línea»; «las tareas tácticas no deben flotar… deben ir sujetas al suelo»;
// «debo poder mover las unidades de azul o sus tareas»; «reduce a un 60 % las concentraciones… solo al hacerle clic debe
// aparecer ese recuadro, más ancho y con letras más pequeñas».
//   · carta 2D: la marca de magnitud al 60 % de la del compilado anterior; la cruz de la concentración de 16 px;
//   · ⛰️ 3D girado y con inclinación: la magnitud y la tarea van con rotationAlignment / pitchAlignment «map» (antes
//     «auto»: paradas frente a la cámara) y la magnitud gira con la carta (rotateZ = su giro − el rumbo);
//   · ⛰️ 3D: con el cursor moviéndose (la «Cota» cambia y la carta se vuelve a dibujar) la ficha azul y la tarea se
//     arrastran y quedan donde se las soltó;
//   · la concentración: nada al pasar el cursor; al tocarla, el recuadro (≥ 300 px de ancho, letra de 11 px); tocar
//     afuera lo cierra. En 2D y en 3D;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/suelo.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, entrar3D, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-suelo')
fs.mkdirSync(SALIDAS, { recursive: true })
const ANTERIOR = 'index-puntos-chicos-20261023.js'
const VIGENTE = new RegExp('/assets/' + path.basename(require('../extraer').vigente()).replace(/\./g, '\\.'))

const datos = () => {
  const d = ejercicioPersonal({ nombre: 'PRUEBA SUELO (FICT.)' })
  d.unidades = [{ id: 'azul-1', bando: 'propias', tipo: 'unidad', designacion: 'OC 2', arma: 'infanteria', escalon: 'brigada', lat: -17.0, lng: -68.24 }]
  d.ops = {
    tareas: [{ tarea: 'bloquear', escalon: 'division', centro: [-68.15, -17.03], rot: 30 }],
    limites: [{ coords: [[-68.3, -16.95], [-68.1, -17.05]], escalon: 'division', tipo: 'magnitud' }],
    magnitudes: [],
  }
  d.planFuegos = { blancos: [{ id: 'pf-1', num: 'AB-011', lng: -68.2, lat: -17.06, tipo: 'concentracion', efecto: 'neutralizar', forma: 'puntual' }], verEnCarta: true }
  return d
}
const unidad = (page) => estadoReact(page, (v) => (Array.isArray(v) && v[0] && v[0].id === 'azul-1' ? [v[0].lng, v[0].lat] : undefined))
const tarea = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.tareas) && Array.isArray(v.limites) && v.tareas[0] ? v.tareas[0].centro : undefined))
const centro = (page, sel) =>
  page.evaluate((s) => {
    const e = document.querySelector(s)
    if (!e) return null
    const b = e.getBoundingClientRect()
    return [b.left + b.width / 2, b.top + b.height / 2, b.width]
  }, sel)

// Arrastrar como una persona: con el cursor yendo y viniendo antes (la «Cota» de la barra cambia a cada paso).
async function arrastrar(page, sel, dx, dy) {
  const c = await centro(page, sel)
  assert.ok(c, `está ${sel}`)
  for (let k = 0; k < 6; k++) await page.mouse.move(c[0] + 60 + k * 9, c[1] + 50 - k * 7, { steps: 3 })
  await page.mouse.move(c[0], c[1], { steps: 4 })
  await page.mouse.down()
  for (let k = 1; k <= 20; k++) {
    await page.mouse.move(c[0] + (dx * k) / 20, c[1] + (dy * k) / 20)
    await page.waitForTimeout(25)
  }
  await page.mouse.up()
  await page.waitForTimeout(1200)
}

async function recuadro(page, donde, pop) {
  const c = await centro(page, `${donde} .pf-marca`)
  await page.mouse.move(c[0], c[1], { steps: 3 })
  await page.waitForTimeout(700)
  const alPasar = await page.evaluate(() => document.querySelectorAll('.pf-tt').length)
  await page.mouse.click(c[0], c[1])
  await page.waitForTimeout(800)
  const alTocar = await page.evaluate((p) => {
    const t = document.querySelector(`${p} .pf-tt`)
    return t ? { ancho: t.getBoundingClientRect().width, letra: getComputedStyle(t).fontSize, texto: t.innerText } : null
  }, pop)
  return { cruz: c[2], alPasar, alTocar }
}

async function correr(anterior) {
  const preparar = anterior
    ? (page) => page.route(VIGENTE, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, '..', '..', 'assets', ANTERIOR)) }))
    : undefined
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900, preparar })
  const r = { errores }
  try {
    await sembrarYAbrir(page, datos())
    await page.evaluate(() => window.__mapa2d.setView([-17.02, -68.2], 12, { animate: false }))
    await page.waitForTimeout(1500)
    r.mag2d = await page.evaluate(() => Math.round(document.querySelector('.leaflet-marker-pane .lim-mag svg').getBoundingClientRect().width * 10) / 10)
    if (anterior) return r
    r.rec2d = await recuadro(page, '.leaflet-marker-pane', '.leaflet-popup')
    await page.mouse.click(700, 760)
    await page.waitForTimeout(600)
    r.cerrado2d = await page.evaluate(() => document.querySelectorAll('.pf-tt').length)
    await page.screenshot({ path: path.join(SALIDAS, '2d.png') })

    await entrar3D(page)
    await page.evaluate(() => window.__map3d.jumpTo({ center: [-68.19, -17.02], zoom: 12.3, bearing: 70, pitch: 55 }))
    await page.waitForTimeout(2500)
    r.acostadas = await page.evaluate(() => {
      const out = []
      for (const [, y] of window.__espejo3d.marcas) {
        const c = y.el.classList
        if (c.contains('lim-mag') || c.contains('sid-suelo'))
          out.push({ que: c.contains('lim-mag') ? 'magnitud' : 'tarea', giro: y.mk.getRotationAlignment(), incl: y.mk.getPitchAlignment(), tr: y.wrap.style.transform })
      }
      return out
    })
    await page.screenshot({ path: path.join(SALIDAS, '3d-girado.png') })
    r.rec3d = await recuadro(page, '.maplibregl-marker', '.maplibregl-popup')
    await page.mouse.click(700, 760)
    await page.waitForTimeout(800)
    r.cerrado3d = await page.evaluate(() => document.querySelectorAll('.pf-tt').length)

    await page.evaluate(() => window.__map3d.jumpTo({ center: [-68.2, -17.02], zoom: 12, bearing: 0, pitch: 50 }))
    await page.waitForTimeout(2500)
    r.unidadAntes = await unidad(page)
    await arrastrar(page, '.maplibregl-marker [data-sid-unidad="azul-1"]', 120, 70)
    r.unidadDespues = await unidad(page)
    r.tareaAntes = await tarea(page)
    await arrastrar(page, '.maplibregl-marker .sid-suelo', -110, 60)
    r.tareaDespues = await tarea(page)
    await page.screenshot({ path: path.join(SALIDAS, '3d-movidas.png') })
    return r
  } finally {
    await cerrar()
  }
}

;(async () => {
  const antes = await correr(true)
  const r = await correr(false)
  assert.ok(Math.abs(r.mag2d - antes.mag2d * 0.6) <= 1, `carta 2D: la magnitud ${r.mag2d} px contra ${antes.mag2d} px antes`)
  console.log(`  ✔ carta 2D: la marca de magnitud ${antes.mag2d} px → ${r.mag2d} px (60 %)`)

  for (const [k, cerr] of [['rec2d', 'cerrado2d'], ['rec3d', 'cerrado3d']]) {
    const x = r[k]
    const donde = k === 'rec2d' ? 'carta 2D' : '⛰️ 3D'
    assert.ok(Math.abs(x.cruz - 16) <= 1, `${donde}: la cruz de la concentración mide ${x.cruz} px`)
    assert.equal(x.alPasar, 0, `${donde}: al pasar el cursor no sale ningún recuadro`)
    assert.ok(x.alTocar, `${donde}: al tocarla sale el recuadro`)
    assert.ok(x.alTocar.ancho >= 300, `${donde}: el recuadro tiene ${x.alTocar.ancho} px de ancho`)
    assert.equal(x.alTocar.letra, '11px', `${donde}: la letra del recuadro`)
    assert.match(x.alTocar.texto, /AB-011/)
    assert.equal(r[cerr], 0, `${donde}: tocar afuera lo cierra`)
    console.log(`  ✔ ${donde}: la concentración de ${x.cruz} px; el recuadro sólo al tocarla (${Math.round(x.alTocar.ancho)} px, letra ${x.alTocar.letra}) y se cierra al tocar afuera`)
  }

  assert.deepEqual(r.acostadas.map((a) => a.que).sort(), ['magnitud', 'tarea'], `⛰️ 3D: la magnitud y la tarea (${JSON.stringify(r.acostadas)})`)
  for (const a of r.acostadas) {
    assert.equal(a.giro, 'map', `⛰️ 3D: la ${a.que} gira con la carta`)
    assert.equal(a.incl, 'map', `⛰️ 3D: la ${a.que} va acostada sobre el terreno`)
    assert.match(a.tr, /rotateX\(55deg\) rotateZ\(-70deg\)/, `⛰️ 3D: la ${a.que} con la inclinación y el rumbo de la carta (${a.tr})`)
  }
  console.log('  ✔ ⛰️ 3D girado 70° e inclinado 55°: la magnitud y la tarea acostadas sobre el terreno y girando con la carta')

  const movio = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.005
  assert.ok(movio(r.unidadAntes, r.unidadDespues), `⛰️ 3D: la ficha azul se movió (${r.unidadAntes} → ${r.unidadDespues})`)
  assert.ok(r.unidadDespues[0] > r.unidadAntes[0] && r.unidadDespues[1] < r.unidadAntes[1], '⛰️ 3D: la ficha quedó hacia donde se la llevó (este y sur)')
  console.log(`  ✔ ⛰️ 3D: la ficha azul se arrastra con el cursor moviéndose (${r.unidadAntes} → ${r.unidadDespues})`)
  assert.ok(movio(r.tareaAntes, r.tareaDespues), `⛰️ 3D: la tarea se movió (${r.tareaAntes} → ${r.tareaDespues})`)
  assert.ok(r.tareaDespues[0] < r.tareaAntes[0], '⛰️ 3D: la tarea quedó hacia donde se la llevó (oeste)')
  console.log(`  ✔ ⛰️ 3D: la tarea táctica se arrastra (${r.tareaAntes} → ${r.tareaDespues})`)

  assert.deepEqual([...antes.errores, ...r.errores], [], 'sin errores de consola')
  console.log('  ✔ sin errores de consola')
  console.log(`\nCapturas en ${path.relative(process.cwd(), SALIDAS)}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
