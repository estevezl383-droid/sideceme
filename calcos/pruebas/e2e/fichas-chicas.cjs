// Fichas al 40 % y con fondo blanco (index-fichas-chicas-20261022.js), en la Mesa real (Chromium).
// El caso de Sergio: la carta congestionada de fichas. Con el compilado anterior y con el nuevo:
//   · una División propia, un PC, una unidad enemiga y una instalación (COAL) en la carta;
//   · una ficha sin designación ocupa el 40 % de antes (ancho y alto, ±3 %); las que tienen nombre, a lo sumo el
//     50 % (la designación va con letra más grande y, si es larga, el dibujo se ensancha);
//   · el centro del marco de la División es blanco (antes se veía la carta a través);
//   · sin errores de consola.
//   node calcos/pruebas/e2e/fichas-chicas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-fichas-chicas')
fs.mkdirSync(SALIDAS, { recursive: true })
const ANTERIOR = 'index-concepto-20261022.js'
// El compilado que carga la Mesa hoy (el de las fichas chicas o uno posterior) se cambia por el ANTERIOR.
const VIGENTE = new RegExp('/assets/' + path.basename(require('../extraer').vigente()).replace(/\./g, '\\.'))

async function medir(anterior) {
  const preparar = anterior
    ? (page) => page.route(VIGENTE, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, '..', '..', 'assets', ANTERIOR)) }))
    : undefined
  const { page, errores, cerrar } = await abrir({ ancho: 1400, alto: 900, preparar })
  try {
    const datos = ejercicioPersonal({ nombre: 'PRUEBA FICHAS CHICAS (FICT.)' })
    datos.unidades = [
      { id: 'div', bando: 'propias', tipo: 'unidad', designacion: 'DIV MEC-2', arma: 'infanteria', escalon: 'division', lat: -17.0, lng: -68.3 },
      { id: 'pc', bando: 'propias', tipo: 'pc', designacion: 'CE-I', arma: 'ninguna', escalon: 'cuerpo', lat: -17.05, lng: -68.2 },
      { id: 'en', bando: 'enemigo', tipo: 'unidad', designacion: 'DIV-1', arma: 'infanteria', escalon: 'division', lat: -16.95, lng: -68.1 },
      { id: 'sin', bando: 'propias', tipo: 'unidad', designacion: '', arma: 'blindados', escalon: 'batallon', lat: -17.08, lng: -68.05 },
      { id: 'coal', bando: 'propias', tipo: 'instalacion', instalacion: 'coal', lat: -17.1, lng: -68.35 },
    ]
    await sembrarYAbrir(page, datos)
    await page.evaluate(() => window.__mapa2d.setView([-17.03, -68.22], 11, { animate: false }))
    await page.waitForTimeout(1500)
    const cajas = await page.evaluate(() => {
      const r = {}
      for (const el of document.querySelectorAll('.leaflet-marker-pane [data-sid-unidad]')) {
        const b = el.getBoundingClientRect()
        r[el.getAttribute('data-sid-unidad')] = { x: b.left, y: b.top, w: b.width, h: b.height }
      }
      return r
    })
    // El centro del marco de la División: está en el ancla del ícono (el marco centrado en el punto).
    const div = await page.evaluate(() => {
      const el = document.querySelector('.leaflet-marker-pane [data-sid-unidad="div"]')
      const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform)
      const b = el.getBoundingClientRect()
      return { ml: parseFloat(el.style.marginLeft), mt: parseFloat(el.style.marginTop), x: b.left, y: b.top }
    })
    const png = await page.screenshot()
    await page.screenshot({ path: path.join(SALIDAS, (anterior ? 'antes' : 'despues') + '.png'), clip: { x: 500, y: 330, width: 560, height: 300 } })
    // Pixel en el centro del marco (ancla = -margin).
    const px = await page.evaluate(async ({ b64, x, y }) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0)
      // un poco a la izquierda del centro para no caer en la cruz de infantería
      return Array.from(g.getImageData(Math.round(x) - 6, Math.round(y), 1, 1).data)
    }, { b64: png.toString('base64'), x: div.x - div.ml, y: div.y - div.mt })
    return { cajas, px, errores: [...errores] }
  } finally {
    await cerrar()
  }
}

;(async () => {
  const antes = await medir(true)
  const despues = await medir(false)
  for (const id of ['sin', 'div', 'pc', 'en', 'coal']) {
    const a = antes.cajas[id], d = despues.cajas[id]
    assert.ok(a && d, `la ficha ${id} está en la carta`)
    for (const k of ['w', 'h']) {
      const r = d[k] / a[k]
      const ok = id === 'sin' ? Math.abs(r - 0.4) < 0.03 : r <= 0.5
      assert.ok(ok, `${id}.${k}: ${d[k].toFixed(1)} px contra ${a[k].toFixed(1)} px antes (${(r * 100).toFixed(0)} %)`)
    }
  }
  console.log('  ✔ la ficha sin nombre al 40 %; unidad, PC, enemigo e instalación a lo sumo al 50 %')
  assert.ok(despues.px.slice(0, 3).every((c) => c > 225), `el centro del marco es blanco (rgb ${despues.px.slice(0, 3)})`)
  assert.ok(antes.px.slice(0, 3).some((c) => c < 200), `antes se veía la carta a través (rgb ${antes.px.slice(0, 3)})`)
  console.log('  ✔ el marco tiene fondo blanco')
  assert.deepEqual(despues.errores, [], 'sin errores de consola')
  console.log('  ✔ sin errores de consola\n\nTodos los casos pasan.')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
