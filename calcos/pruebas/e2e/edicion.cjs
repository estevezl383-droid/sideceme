// Edición de figuras como en Google Earth: líneas y áreas de la Mesa, en 2D y en 3D.
//
// Lo pidió Sergio: «llevo el puntero encima de la figura, se vuelve una manito, le doy clic y
// puedo editar ESA figura; con clic derecho me sale borrar un punto o toda la figura».
// Antes, con una herramienta de línea encendida la figura no respondía al clic; el Área de
// Operaciones no se podía mover ni borrar; y el clic derecho en el frente borraba todo el frente.
//
// Corre la Mesa de verdad en Chromium (sin red: ver navegador.js) con el ejercicio de
// unidades ficticias (que trae un Área de Operaciones de un Cuerpo de Ejército).
//
//   cd calcos/pruebas && node e2e/edicion.cjs            (todo)
//   node e2e/edicion.cjs 2d | 3d                          (una vista)
//   COMPILADO=/ruta/a/otro-index.js node e2e/edicion.cjs  (prueba otro compilado)
//   SOLO=Alt node e2e/edicion.cjs 3d                      (sólo los casos que dicen «Alt»)
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { abrir, estadoReact, sembrarYAbrir, entrar3D, salir3D, aPantalla } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const { vigente } = require('../extraer')

const SALIDAS = path.join(__dirname, '..', 'salidas-edicion')

// Puntos de la pantalla (el mapa ocupa x 340–1440, y 0–900) sobre la franja libre del oeste, lejos
// de las fichas y de los paneles. Con zoom 12.4 el Área de Operaciones del ejercicio entra casi entera.
const PX = {
  linea: [[410, 500], [480, 560], [550, 500]],
  frente: [[790, 400], [790, 480], [790, 560]],
  influencia: [[410, 270], [530, 270], [470, 350]],
  frenteCuerpo: [[500, 150], [500, 760]],
  contorno: [570, 455],
  zona: [[400, 600], [540, 600], [540, 720], [400, 720]],
  mina: [[400, 600], [540, 600], [470, 720]],
}

// Lo trazado.
const ops = (page) =>
  estadoReact(page, (v) =>
    v && !Array.isArray(v) && Array.isArray(v.limites) && Array.isArray(v.obstaculos)
      ? {
          limites: v.limites.map((l) => ({ tipo: l.tipo, coords: l.coords })),
          magnitudes: (v.magnitudes || []).map((m) => m.origen || 'libre'),
          areaOps: v.areaOps ? { coords: v.areaOps.coords, frente: v.areaOps.frente, frenteM: v.areaOps.frenteM, profM: v.areaOps.profM } : null,
          influencia: v.influenciaTrazada ? { coords: v.influenciaTrazada.coords } : null,
          zonas: (v.zonasLog || []).map((z) => z.coords.length),
          obstaculos: v.obstaculos.map((o) => `${o.tipo}:${(o.coords || []).length}`),
        }
      : undefined,
  )
const verCapa = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && typeof v === 'object' && ('areaInteres' in v || 'unidadesAzul' in v || Object.keys(v).length === 0 ? { ...v } : undefined)))
const barra = (page) => page.evaluate(() => [...document.querySelectorAll('.barra-trazo button')].map((b) => b.textContent))
const menu = (page) => page.evaluate(() => [...document.querySelectorAll('.menu-figura button')].map((b) => b.textContent + (b.disabled ? ' [no]' : '')))
const manijas = (page) =>
  page.evaluate(() => {
    const c = (el) => {
      const r = el.getBoundingClientRect()
      return [r.left + r.width / 2, r.top + r.height / 2]
    }
    return {
      vert: [...document.querySelectorAll('div[style*="cursor:grab"]')].filter((e) => e.style.width === '13px').map(c),
      mitad: [...document.querySelectorAll('div[style*="cursor:copy"]')].map(c),
    }
  })
const cercano = (lista, [x, y]) => lista.reduce((m, p) => (!m || Math.hypot(p[0] - x, p[1] - y) < Math.hypot(m[0] - x, m[1] - y) ? p : m), null)
const clic = (loc) => loc.dispatchEvent('click')
const cursor = (page) => page.evaluate(() => (window.__map3d ? window.__map3d.getCanvas().style.cursor : (document.querySelector('.leaflet-container canvas.leaflet-interactive') ? getComputedStyle(document.querySelector('.leaflet-container canvas.leaflet-interactive')).cursor : 'sin-hover')))
const bordeAI = (page) => page.evaluate(() => Object.values(window.__lm2d._layers).filter((l) => l.options && l.options.color === '#ff2222').length)
const opcionesEscalon = (page) =>
  page.evaluate(() => {
    const s = [...document.querySelectorAll('select')].find((x) => /Cuerpo de Ejército|División|Brigada/.test(x.textContent) && /Equipo|Cuerpo/.test(x.textContent) && !/Altiplano|Defensa/.test(x.textContent))
    return s ? [...s.options].map((o) => o.textContent) : null
  })

async function esperar(page, leer, cumple, ms = 15000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (cumple(v) || Date.now() - t0 > ms) return v
    await page.waitForTimeout(250)
  }
}

// En 3D la Mesa redibuja el espejo unos segundos después de cada cambio (sin placa de video
// tarda más): el clic que llega antes toca una carta vieja. Se espera a que quede quieto.
async function asentar(page, ms = 500) {
  await page
    .waitForFunction(
      () => {
        const m = window.__map3d
        const e = window.__espejo3d
        return !m || !e || (!e.raf && !(e.caliente && e.caliente.size) && !m.isMoving() && m.loaded())
      },
      null,
      { timeout: 40000, polling: 100 },
    )
    .catch(() => {})
  await page.waitForTimeout(ms + (await page.evaluate(() => !!window.__map3d)) * 1500)
}

let fallas = 0
async function caso(nombre, fn, page) {
  if (process.env.SOLO && !nombre.includes(process.env.SOLO)) return
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
    if (page) {
      fs.mkdirSync(SALIDAS, { recursive: true })
      await page.screenshot({ path: path.join(SALIDAS, nombre.replace(/[^a-z0-9]+/gi, '-').slice(0, 80) + '.png') }).catch(() => {})
    }
  }
}

async function preparar(vista) {
  const m = await abrir({})
  const { page } = m
  if (process.env.COMPILADO) {
    const cuerpo = fs.readFileSync(process.env.COMPILADO)
    await page.route(`**/assets/${path.basename(vigente())}`, (r) => r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: cuerpo }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const ok = page.getByRole('button', { name: /entendido/i })
    if (await ok.count()) await ok.first().click().catch(() => {})
  }
  m.dialogos = []
  page.on('dialog', (d) => {
    m.dialogos.push(d.message())
    d.dismiss().catch(() => {})
  })
  const datos = ejercicioFicticio({ conPlantilla: false })
  datos.aoi = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-65.12, -16.96], [-64.98, -16.96], [-64.98, -17.07], [-65.12, -17.07], [-65.12, -16.96]]] } }
  await sembrarYAbrir(page, datos)
  const ocultar = page.getByText('▼ ocultar')
  if (await ocultar.count()) await ocultar.first().click().catch(() => {})
  await entrar3D(page)
  await page.evaluate((v) => {
    window.__lm2d = window.__espejo3d.lm
    window.__map3d.jumpTo({ center: [-65.065, -17.015], zoom: 12.0, pitch: v === '3d' ? 30 : 0, bearing: 0 })
  }, vista)
  await page.waitForTimeout(3000)
  if (vista === '2d') await salir3D(page)
  return m
}

// Cada punto tiene que caer sobre la carta (no sobre un panel ni una ficha).
async function sobreLaCarta(page, puntos) {
  const tapados = await page.evaluate(
    (L) =>
      L.filter(([x, y]) => {
        const el = document.elementFromPoint(x, y)
        return !el || !(el.closest('.maplibregl-canvas-container') || el.closest('.leaflet-container')) || el.closest('.leaflet-marker-icon, .m3d-mk, aside, .panel, .barra-trazo')
      }),
    puntos,
  )
  assert.deepStrictEqual(tapados, [], 'puntos de la prueba tapados por la interfaz: ' + JSON.stringify(tapados))
}

// Abrir el panel enciende la herramienta del Área de Operaciones (no hay que apretar «Trazar el Área»).
async function abrirPanelAO(page) {
  if (await page.getByRole('button', { name: /Trazar el Área/ }).count()) return
  await clic(page.getByRole('button', { name: /ÁREA DE OPS/i }).first())
  await page.waitForTimeout(1200)
}
async function cerrarPaneles(page) {
  for (let i = 0; i < 4; i++) {
    const x = page.getByRole('button', { name: '✕', exact: true })
    if (!(await x.count())) break
    await clic(x.last())
    await page.waitForTimeout(400)
  }
}

async function vista(v) {
  const m = await preparar(v)
  const { page, errores, cerrar } = m
  const V = v.toUpperCase()
  try {
    const li = PX.linea
    const fr = PX.frente
    const aoCoords = (await ops(page)).areaOps.coords

    await caso(`${V} · línea sin magnitud con la herramienta encendida: se toca, se agrega, se mueve y se borra un punto`, async () => {
      await abrirPanelAO(page)
      await clic(page.getByRole('button', { name: /Línea \(sin magnitud\)/ }))
      await page.waitForTimeout(500)
      for (const p of li.slice(0, 2)) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.mouse.dblclick(...li[2])
      let d = await esperar(page, ops, (e) => e.limites.length === 1)
      assert.deepStrictEqual(d.limites.map((l) => l.coords.length), [3], 'no se guardó la línea de 3 puntos')
      await asentar(page)
      // La herramienta sigue encendida: un clic sobre la línea (no sobre un vértice) la selecciona.
      const sobre = [li[0][0] + (li[1][0] - li[0][0]) * 0.3, li[0][1] + (li[1][1] - li[0][1]) * 0.3]
      await page.mouse.click(...sobre)
      await asentar(page)
      let mj = await manijas(page)
      assert.deepStrictEqual([mj.vert.length, mj.mitad.length], [3, 2], 'manijas de la línea seleccionada (vértices, puntos medios): ' + JSON.stringify(mj))
      d = await ops(page)
      assert.strictEqual(d.limites.length, 1, 'el clic sobre la línea empezó otra línea en vez de seleccionarla')
      // clic derecho sobre el vértice del medio → «Borrar este punto»
      await page.mouse.click(...cercano(mj.vert, li[1]), { button: 'right' })
      await page.waitForTimeout(500)
      const m1 = await menu(page)
      assert.deepStrictEqual(m1, ['📍 Borrar este punto', '🗑 Borrar toda la figura', '✕ Cancelar'], 'menú del vértice: ' + JSON.stringify(m1))
      await page.locator('.menu-figura button', { hasText: 'Borrar este punto' }).click()
      d = await esperar(page, ops, (e) => e.limites[0] && e.limites[0].coords.length === 2)
      assert.strictEqual(d.limites[0].coords.length, 2, 'no se borró el punto')
      await asentar(page)
      mj = await manijas(page)
      assert.deepStrictEqual([mj.vert.length, mj.mitad.length], [2, 1], 'siguió seleccionada: ' + JSON.stringify(mj))
      // un ⚪ del medio agrega un punto
      await page.mouse.click(...mj.mitad[0])
      d = await esperar(page, ops, (e) => e.limites[0] && e.limites[0].coords.length === 3)
      assert.strictEqual(d.limites[0].coords.length, 3, 'el ⚪ no agregó un punto')
      await asentar(page)
      // arrastrar un vértice lo mueve
      mj = await manijas(page)
      const v0 = cercano(mj.vert, li[0])
      const antes = (await ops(page)).limites[0].coords[0]
      await page.mouse.move(...v0)
      await page.mouse.down()
      await page.mouse.move(v0[0] + 15, v0[1] + 25, { steps: 6 })
      await page.mouse.move(v0[0] + 30, v0[1] + 50, { steps: 6 })
      await page.mouse.up()
      d = await esperar(page, ops, (e) => JSON.stringify(e.limites[0].coords[0]) !== JSON.stringify(antes))
      assert.notDeepStrictEqual(d.limites[0].coords[0], antes, 'arrastrar el vértice no lo movió')
      assert.strictEqual(d.limites[0].coords.length, 3)
      await asentar(page)
      // arrastrar un ⚪ del medio agrega un punto ahí donde se lo suelta
      mj = await manijas(page)
      const mid = mj.mitad[0]
      await page.mouse.move(...mid)
      await page.mouse.down()
      await page.mouse.move(mid[0] + 10, mid[1] + 20, { steps: 6 })
      await page.mouse.move(mid[0] + 20, mid[1] + 45, { steps: 6 })
      await page.mouse.up()
      d = await esperar(page, ops, (e) => e.limites[0] && e.limites[0].coords.length === 4)
      assert.strictEqual(d.limites[0].coords.length, 4, 'arrastrar el ⚪ no agregó el punto')
      await asentar(page)
      // clic derecho sobre el cuerpo de la línea → «Borrar toda la figura»
      mj = await manijas(page)
      const [a, b] = [mj.vert[0], mj.vert[1]]
      await page.mouse.click(a[0] + (b[0] - a[0]) * 0.3, a[1] + (b[1] - a[1]) * 0.3, { button: 'right' })
      await page.waitForTimeout(500)
      assert.deepStrictEqual((await menu(page)).slice(0, 2), ['📍 Borrar el punto más cercano', '🗑 Borrar toda la figura'])
      await page.locator('.menu-figura button', { hasText: 'Borrar toda la figura' }).click()
      d = await esperar(page, ops, (e) => e.limites.length === 0)
      assert.strictEqual(d.limites.length, 0, 'no se borró la figura')
      assert.deepStrictEqual(await manijas(page), { vert: [], mitad: [] }, 'quedaron manijas de la figura borrada')
      await page.keyboard.press('Escape')
      await cerrarPaneles(page)
    }, page)

    await caso(`${V} · Área de Operaciones del ejercicio: se toca el borde, se borra un vértice, se agrega uno, se mueve y se borra entera`, async () => {
      await cerrarPaneles(page)
      const [A0, A1, A2, A3] = await aPantalla(page, aoCoords)
      const oeste = [(A0[0] + A3[0]) / 2, (A0[1] + A3[1]) / 2]
      const este = [(A1[0] + A2[0]) / 2, (A1[1] + A2[1]) / 2]
      await sobreLaCarta(page, [oeste, este, A3, A2])
      await page.mouse.move(...oeste)
      await asentar(page, 800)
      assert.strictEqual(await cursor(page), 'grab', 'el cursor sobre el borde del Área de Operaciones no es una manito')
      await page.mouse.click(...oeste)
      await asentar(page)
      let mj = await manijas(page)
      assert.deepStrictEqual([mj.vert.length, mj.mitad.length], [4, 4], 'manijas del Área de Operaciones: ' + JSON.stringify(mj))
      // un clic DENTRO del área (lejos del borde) no la selecciona: sirve para trazar adentro
      await page.mouse.click(oeste[0] + 120, oeste[1])
      await asentar(page)
      assert.deepStrictEqual(await manijas(page), { vert: [], mitad: [] }, 'el clic adentro del área no la soltó')
      await page.mouse.click(...oeste)
      await asentar(page)
      // borrar el vértice 3: el área queda de 3 vértices y el frente no cambia
      mj = await manijas(page)
      await page.mouse.click(...cercano(mj.vert, A3), { button: 'right' })
      await page.waitForTimeout(500)
      assert.deepStrictEqual(await menu(page), ['📍 Borrar este punto', '🗑 Borrar toda la figura', '✕ Cancelar'])
      await page.locator('.menu-figura button', { hasText: 'Borrar este punto' }).click()
      let d = await esperar(page, ops, (e) => e.areaOps && e.areaOps.coords.length === 3)
      assert.strictEqual(d.areaOps.coords.length, 3, 'no se borró el vértice del Área de Operaciones')
      assert.strictEqual(d.areaOps.frente.length, 2, 'el frente cambió')
      await asentar(page)
      // con 3 vértices ya no se puede borrar otro
      mj = await manijas(page)
      assert.deepStrictEqual([mj.vert.length, mj.mitad.length], [3, 3], 'siguió seleccionada: ' + JSON.stringify(mj))
      await page.mouse.click(...cercano(mj.vert, A2), { button: 'right' })
      await page.waitForTimeout(500)
      assert.deepStrictEqual((await menu(page)).slice(0, 2), ['📍 Borrar este punto [no]', '🗑 Borrar toda la figura'], 'un triángulo no puede perder otro vértice')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      assert.deepStrictEqual(await menu(page), [], 'Esc no cerró el menú')
      // un ⚪ del lado este agrega un vértice
      mj = await manijas(page)
      await page.mouse.click(...cercano(mj.mitad, este))
      d = await esperar(page, ops, (e) => e.areaOps && e.areaOps.coords.length === 4)
      assert.strictEqual(d.areaOps.coords.length, 4, 'el ⚪ no agregó el vértice')
      await asentar(page)
      // arrastrar el vértice más hondo (el 2) cambia la profundidad
      const prof0 = d.areaOps.profM
      mj = await manijas(page)
      const v2 = cercano(mj.vert, A2)
      await page.mouse.move(...v2)
      await page.mouse.down()
      await page.mouse.move(v2[0] - 20, v2[1] + 40, { steps: 6 })
      await page.mouse.move(v2[0] - 40, v2[1] + 90, { steps: 6 })
      await page.mouse.up()
      d = await esperar(page, ops, (e) => e.areaOps && e.areaOps.profM !== prof0)
      assert.notStrictEqual(d.areaOps.profM, prof0, 'arrastrar el vértice no recalculó la profundidad')
      assert.strictEqual(d.areaOps.coords.length, 4)
      await asentar(page)
      // clic derecho sobre el borde (el tramo del vértice 1 al nuevo) → borrar toda la figura
      await page.mouse.click(A1[0] + (este[0] - A1[0]) * 0.3, A1[1] + (este[1] - A1[1]) * 0.3, { button: 'right' })
      await page.waitForTimeout(500)
      await page.locator('.menu-figura button', { hasText: 'Borrar toda la figura' }).click()
      d = await esperar(page, ops, (e) => e.areaOps === null)
      assert.strictEqual(d.areaOps, null, 'no se borró el Área de Operaciones')
      assert.deepStrictEqual(m.dialogos, [], 'se abrió un diálogo del navegador: ' + JSON.stringify(m.dialogos))
    }, page)

    await caso(`${V} · Área de Operaciones: clic derecho en el frente borra SÓLO el último punto, y sin contorno vuelve al frente`, async () => {
      await cerrarPaneles(page)
      await abrirPanelAO(page)
      for (const p of fr) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      assert.deepStrictEqual(await barra(page), ['✓ EL FRENTE ES ÉSTE', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'])
      await page.mouse.click(fr[2][0] + 150, fr[2][1], { button: 'right' }) // en cualquier lado
      await page.waitForTimeout(600)
      assert.deepStrictEqual(await barra(page), ['✓ EL FRENTE ES ÉSTE', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'el clic derecho borró todo el frente')
      await page.mouse.dblclick(...fr[2]) // fija el frente: 2 puntos que quedaron + éste
      await page.waitForTimeout(1500)
      assert.deepStrictEqual(await barra(page), ['✓ CERRAR EL ÁREA', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'no pasó al contorno')
      await page.mouse.click(fr[2][0] + 120, fr[2][1])
      await page.waitForTimeout(600)
      await page.mouse.click(fr[2][0] + 150, fr[2][1], { button: 'right' }) // borra el vértice de contorno
      await page.waitForTimeout(600)
      assert.deepStrictEqual(await barra(page), ['✓ CERRAR EL ÁREA', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'después de borrar el vértice debía seguir en el contorno')
      await page.mouse.click(fr[2][0] + 150, fr[2][1], { button: 'right' }) // sin contorno: vuelve al frente
      await page.waitForTimeout(600)
      assert.deepStrictEqual(await barra(page), ['✓ EL FRENTE ES ÉSTE', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'sin vértices de contorno debía volver al frente')
      for (let i = 0; i < 3; i++) {
        // el frente tenía 3 puntos: uno por vez
        await page.mouse.click(fr[2][0] + 150, fr[2][1], { button: 'right' })
        await page.waitForTimeout(400)
      }
      assert.deepStrictEqual(await barra(page), [], 'sin puntos no debía quedar un trazo')
      await page.keyboard.press('Escape')
      await cerrarPaneles(page)
    }, page)

    await caso(`${V} · «Magnitud que se va a colocar» y el panel del Área de Operaciones`, async () => {
      // se traza un Área de Operaciones nueva con un frente de Cuerpo de Ejército
      const [a, b] = PX.frenteCuerpo
      const c = PX.contorno
      await cerrarPaneles(page)
      await abrirPanelAO(page)
      await page.mouse.click(...a)
      await page.waitForTimeout(500)
      await page.mouse.dblclick(...b)
      await page.waitForTimeout(1500)
      await page.mouse.dblclick(...c)
      const d = await esperar(page, ops, (e) => e.areaOps && e.areaOps.frenteM > 9000)
      assert.ok(d.areaOps && d.areaOps.frenteM > 9000, 'no se guardó el Área de Operaciones nueva: ' + JSON.stringify(d.areaOps))
      await abrirPanelAO(page)
      const cuerpo = await opcionesEscalon(page)
      const txt = await page.evaluate(() => document.body.innerText)
      for (const viejo of ['Textual del reglamento', 'Cómo se traza, en dos tiempos', 'Es el sector que viene en la Orden']) assert.ok(!txt.includes(viejo), `el panel todavía explica: «${viejo}»`)
      assert.deepStrictEqual(cuerpo, ['Cuerpo de Ejército'], 'un frente de Cuerpo de Ejército sólo puede llevar la magnitud de un Cuerpo de Ejército')
      await cerrarPaneles(page)
    }, page)

    await caso(`${V} · Área de Influencia: la dibuja el oficial, se edita y se borra`, async () => {
      const inf = PX.influencia
      await sobreLaCarta(page, inf)
      await clic(page.getByRole('button', { name: /Á\. INFLUENCIA/i }).first())
      await page.waitForTimeout(1000)
      assert.deepStrictEqual((await ops(page)).influencia, null)
      await clic(page.getByRole('button', { name: /Dibujar el Área de Influencia/ }))
      await page.waitForTimeout(600)
      await page.mouse.click(...inf[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...inf[1])
      await page.waitForTimeout(500)
      assert.deepStrictEqual(await barra(page), ['✓ CERRAR ÁREA', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'])
      await page.mouse.dblclick(...inf[2])
      let d = await esperar(page, ops, (e) => e.influencia)
      assert.ok(d.influencia, 'no se guardó el Área de Influencia')
      assert.strictEqual(d.influencia.coords.length, 3)
      await asentar(page)
      // se toca el borde y se borra todo
      const medio = [inf[0][0] + (inf[1][0] - inf[0][0]) * 0.3, inf[0][1] + (inf[1][1] - inf[0][1]) * 0.3]
      await page.mouse.click(...medio)
      await asentar(page)
      const mj = await manijas(page)
      assert.deepStrictEqual([mj.vert.length, mj.mitad.length], [3, 3], 'manijas del Área de Influencia: ' + JSON.stringify(mj))
      await page.mouse.click(...medio, { button: 'right' })
      await page.waitForTimeout(500)
      await page.locator('.menu-figura button', { hasText: 'Borrar toda la figura' }).click()
      d = await esperar(page, ops, (e) => e.influencia === null)
      assert.strictEqual(d.influencia, null)
      await cerrarPaneles(page)
    }, page)

    await caso(`${V} · el borde del Área de Interés se apaga y se prende`, async () => {
      assert.ok((await bordeAI(page)) >= 1, 'no hay borde del Área de Interés para apagar')
      await clic(page.getByRole('button', { name: /Borde Á\. Interés/ }))
      await asentar(page)
      assert.strictEqual(await bordeAI(page), 0, 'el borde siguió a la vista')
      await clic(page.getByRole('button', { name: /Borde Á\. Interés/ }))
      await asentar(page)
      assert.ok((await bordeAI(page)) >= 1, 'el borde no volvió')
    }, page)

    await caso(`${V} · con una herramienta encendida, Alt (Opción) + clic atraviesa la figura (para empezar una línea encima de otra)`, async () => {
      await cerrarPaneles(page)
      await abrirPanelAO(page)
      await clic(page.getByRole('button', { name: /Línea \(sin magnitud\)/ }))
      await page.waitForTimeout(500)
      for (const p of li.slice(0, 2)) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.mouse.dblclick(...li[2])
      let d = await esperar(page, ops, (e) => e.limites.length === 1)
      assert.strictEqual(d.limites.length, 1)
      await asentar(page)
      // Alt + clic SOBRE la línea ya dibujada: empieza un trazo nuevo, no la selecciona
      const sobre = [li[0][0] + (li[1][0] - li[0][0]) * 0.3, li[0][1] + (li[1][1] - li[0][1]) * 0.3]
      await page.keyboard.down('Alt')
      await page.mouse.click(...sobre)
      await page.keyboard.up('Alt')
      await page.waitForTimeout(800)
      assert.deepStrictEqual(await manijas(page), { vert: [], mitad: [] }, 'Alt + clic seleccionó la línea')
      assert.deepStrictEqual(await barra(page), ['✓ TERMINAR TRAZO', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'Alt + clic no empezó un trazo')
      await page.keyboard.press('Escape')
      await asentar(page)
      // y sin Alt, el mismo clic la selecciona
      await page.mouse.click(...sobre)
      await asentar(page)
      assert.strictEqual((await manijas(page)).vert.length, 3, 'el clic sin Alt no la seleccionó')
      await page.mouse.click(...sobre, { button: 'right' })
      await page.waitForTimeout(500)
      await page.locator('.menu-figura button', { hasText: 'Borrar toda la figura' }).click()
      d = await esperar(page, ops, (e) => e.limites.length === 0)
      assert.strictEqual(d.limites.length, 0)
      await cerrarPaneles(page)
    }, page)

    await caso(`${V} · área logística (ASDI): se toca el borde, se borra un vértice y se borra entera`, async () => {
      await cerrarPaneles(page)
      const z = PX.zona
      await sobreLaCarta(page, z)
      await clic(page.getByRole('button', { name: /MEDIDAS/i }).first())
      await page.waitForTimeout(1000)
      await clic(page.getByRole('button', { name: /Zona logística/ }))
      await page.waitForTimeout(500)
      for (const p of z.slice(0, 3)) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.mouse.dblclick(...z[3])
      let d = await esperar(page, ops, (e) => e.zonas.length === 1)
      assert.deepStrictEqual(d.zonas, [4], 'no se guardó el área logística')
      await asentar(page)
      await cerrarPaneles(page)
      const arriba = [(z[0][0] + z[1][0]) / 2, z[0][1]]
      await page.mouse.click(...arriba)
      await asentar(page)
      let mj = await manijas(page)
      assert.deepStrictEqual([mj.vert.length, mj.mitad.length], [4, 4], 'manijas del área logística: ' + JSON.stringify(mj))
      await page.mouse.click(...cercano(mj.vert, z[2]), { button: 'right' })
      await page.waitForTimeout(500)
      await page.locator('.menu-figura button', { hasText: 'Borrar este punto' }).click()
      d = await esperar(page, ops, (e) => e.zonas[0] === 3)
      assert.deepStrictEqual(d.zonas, [3])
      await asentar(page)
      await page.mouse.click(...arriba, { button: 'right' })
      await page.waitForTimeout(500)
      await page.locator('.menu-figura button', { hasText: 'Borrar toda la figura' }).click()
      d = await esperar(page, ops, (e) => e.zonas.length === 0)
      assert.deepStrictEqual(d.zonas, [])
      assert.deepStrictEqual(m.dialogos, [], 'se abrió un diálogo: ' + JSON.stringify(m.dialogos))
    }, page)

    await caso(`${V} · campo minado (obstáculo de área): se toca el borde y se borra entero`, async () => {
      await cerrarPaneles(page)
      const z = PX.mina
      await clic(page.getByRole('button', { name: /DEFENSA/i }).first())
      await page.waitForTimeout(800)
      await clic(page.getByRole('button', { name: /CM AP · Campo minado antipersonal/ }))
      await page.waitForTimeout(500)
      for (const p of z) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.keyboard.press('Enter')
      let d = await esperar(page, ops, (e) => e.obstaculos.length === 1)
      assert.deepStrictEqual(d.obstaculos, ['minado_ap:3'])
      await asentar(page)
      const borde = [(z[0][0] + z[1][0]) / 2, z[0][1]]
      await page.mouse.click(...borde)
      await asentar(page)
      const mj = await manijas(page)
      assert.deepStrictEqual([mj.vert.length, mj.mitad.length], [3, 3], 'manijas del campo minado: ' + JSON.stringify(mj))
      await page.mouse.click(...cercano(mj.vert, z[0]), { button: 'right' })
      await page.waitForTimeout(500)
      assert.deepStrictEqual((await menu(page)).slice(0, 2), ['📍 Borrar este punto [no]', '🗑 Borrar toda la figura'], 'un campo minado de 3 vértices no puede perder uno')
      await page.locator('.menu-figura button', { hasText: 'Borrar toda la figura' }).click()
      d = await esperar(page, ops, (e) => e.obstaculos.length === 0)
      assert.deepStrictEqual(d.obstaculos, [])
      await page.keyboard.press('Escape')
      await cerrarPaneles(page)
    }, page)

    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

;(async () => {
  const solo = process.argv[2]
  if (!solo || solo === '2d') await vista('2d')
  if (!solo || solo === '3d') await vista('3d')
  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
