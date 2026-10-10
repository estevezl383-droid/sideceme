// Los trazos de la Mesa TERMINAN: Área de Operaciones, Línea de Extraviados (G-1), eje
// humanitario (G-5), avenidas del CMOC (G-2), obstáculos (G-3) — en 2D y en 3D, con el
// ratón y con el dedo.
//
// Antes sólo terminaban con el evento «dblclick» del navegador. Safari del iPad no lo manda
// después de un doble toque y en la carta 2D el trazo NO terminaba nunca; un doble clic más
// lento que el del sistema eran dos vértices más. Ahora también terminan con un clic (o un
// toque) otra vez sobre el último punto, con Enter y con la barra «✓ TERMINAR» de abajo.
//
// Corre la Mesa de verdad en Chromium (sin red: ver navegador.js) con el ejercicio de
// unidades ficticias.
//
//   cd calcos/pruebas && node e2e/trazos.cjs            (todo)
//   node e2e/trazos.cjs 2d | 3d | dedo | dedo2d | dedo3d (una parte)
//   COMPILADO=/ruta/a/otro-index.js node e2e/trazos.cjs  (prueba otro compilado)
//
// Tarda unos minutos: sin placa de video, cada render del 3D tarda segundos.
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { abrir, estadoReact, sembrarYAbrir, entrar3D, salir3D, aPantalla, toques } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const { vigente } = require('../extraer')

// Puntos sobre terreno libre, lejos de las fichas ficticias y de los paneles. Al oeste el
// frente (de norte a sur) y un vértice de contorno hacia el este.
const P = {
  frente: [[-65.093, -17.006], [-65.093, -17.016], [-65.093, -17.026]],
  contorno: [-65.08, -17.016],
  linea: [[-65.095, -17.025], [-65.085, -17.03], [-65.075, -17.025]],
  // El segundo Área de Operaciones, ADENTRO del primero y lejos de su borde. El vértice de
  // contorno va al sur de «ALFA»: desde que las fichas se ven +50 % (09-10-2026) la tapaba.
  frente2: [[-65.087, -17.009], [-65.087, -17.019]],
  contorno2: [-65.075, -17.019],
}
// Desde la edición de figuras (03-10-2026), con una herramienta encendida y sin trazo en curso,
// tocar una figura ya dibujada la ELIGE (para editarla) en vez de empezar otro trazo encima
// (Alt + clic la atraviesa). Por eso cada trazo de la prueba va en su propio lugar, al este del
// Área de Operaciones, sobre la carta libre y lejos de las fichas y de los trazos anteriores
// (antes todos iban sobre los mismos tres puntos). Se eligen en la pantalla: así sirve igual
// en 2D y en el 3D inclinado.
async function lugaresParaTrazos(page, n, usados = []) {
  const cand = []
  for (let lat = -16.982; lat >= -17.055; lat -= 0.003)
    for (let lng = -65.124; lng <= -65.0; lng += 0.006) {
      // Ni encima ni al lado del borde de las Áreas de Operaciones de los dos primeros casos.
      const ao = [-65.093 - 0.004, -17.026 - 0.004, -65.075 + 0.004, -17.006 + 0.004]
      if (lng + 0.012 > ao[0] && lng < ao[2] && lat > ao[1] && lat - 0.003 < ao[3]) continue
      cand.push([[lng, lat], [lng + 0.006, lat - 0.003], [lng + 0.012, lat]])
    }
  const plano = await aPantalla(page, cand.flat())
  const pant = cand.map((_, i) => plano.slice(3 * i, 3 * i + 3))
  const libres = await page.evaluate((L) => {
    const libre = (x, y) => {
      // Ni pegado arriba (en el 3D inclinado es el horizonte) ni abajo (la barra del trazo).
      if (x < 8 || y < innerHeight * 0.15 || x > innerWidth - 8 || y > innerHeight * 0.8) return false
      const el = document.elementFromPoint(x, y)
      // La carta misma (una tesela o el lienzo), no un botón ni un rótulo puesto encima.
      return !!el && !!(el.closest('.maplibregl-canvas-container') || (el.closest('.leaflet-pane') && !el.closest('.leaflet-marker-pane, .leaflet-tooltip-pane, .leaflet-popup-pane'))) && !el.closest('.leaflet-marker-icon, .m3d-mk, aside, .panel, .barra-trazo, .leaflet-control, button')
    }
    // Lejos (45 px) de fichas, rótulos y botones: el punto y su alrededor.
    const D = [[0, 0], [45, 0], [-45, 0], [0, 45], [0, -45], [32, 32], [-32, 32], [32, -32], [-32, -32]]
    return L.map((pts) => pts.every(([x, y]) => D.every(([dx, dy]) => libre(x + dx, y + dy))))
  }, pant)
  const caja = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))]
  const elegidos = []
  for (let i = 0; i < pant.length && elegidos.length < n; i++) {
    if (!libres[i]) continue
    const b = caja(pant[i])
    if ([...usados, ...elegidos].some((e) => { const o = caja(e); return !(b[0] > o[2] + 40 || o[0] > b[2] + 40 || b[1] > o[3] + 40 || o[1] > b[3] + 40) })) continue
    elegidos.push(pant[i])
    if (process.env.DEPURAR) console.log('lugar', usados.length + elegidos.length, JSON.stringify(cand[i][0]), JSON.stringify(pant[i]))
  }
  assert.strictEqual(elegidos.length, n, `no hay lugar libre para ${n} trazo(s) más en la carta`)
  return elegidos
}

// Lo trazado (ops y CMOC) y la barra de abajo.
const estado = (page) =>
  estadoReact(page, (v) =>
    v && !Array.isArray(v) && Array.isArray(v.limites) && Array.isArray(v.obstaculos)
      ? {
          lineasEM: (v.lineasEM || []).map((l) => `${l.tipo}:${l.coords.length}`),
          obstaculos: v.obstaculos.map((o) => `${o.tipo}:${(o.coords || []).length}`),
          frente: v.areaOps ? v.areaOps.frente.length : 0,
          area: v.areaOps ? v.areaOps.coords.length : 0,
        }
      : undefined,
  )
const cmoc = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.avenidas) && Array.isArray(v.restringido) ? v.avenidas.map((a) => a.coords.length) : undefined))
const restringidos = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.avenidas) && Array.isArray(v.restringido) ? v.restringido.length : undefined))
const zoom = (page) => page.evaluate(() => (window.__map3d ? window.__map3d.getZoom() : window.__lm2d.getZoom()))
const aviso = (page) => page.evaluate(() => [...document.querySelectorAll('.barra-trazo')].map((b) => b.textContent).join(' | '))
const barra = (page) => page.evaluate(() => [...document.querySelectorAll('.barra-trazo button')].map((b) => b.textContent))
const rotulo = (page) => page.evaluate(() => [...document.querySelectorAll('.rotulo-ao .ao-paso')].map((e) => e.textContent).join(' | '))
const clic = (loc) => loc.dispatchEvent('click')

// Un solo clic del ratón con el `detail` que pone el sistema (1 = clic suelto, 2 = segundo clic
// de un doble clic). `page.mouse.click({ clickCount: 2 })` repite la secuencia entera.
async function clicSistema(page, x, y, clickCount) {
  const cdp = await page.context().newCDPSession(page)
  for (const type of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount })
  await cdp.detach()
}

async function esperar(page, leer, cumple, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (cumple(v) || Date.now() - t0 > ms) return v
    await page.waitForTimeout(250)
  }
}

let fallas = 0
async function caso(nombre, fn) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

async function preparar({ vista = '2d', movil = false, comoSafari = false } = {}) {
  // Una pantalla grande: cada trazo va en su propio lugar libre (ver lugaresParaTrazos).
  const m = await abrir(movil ? { ancho: 1280, alto: 900, movil: true } : { ancho: 1920, alto: 1200 })
  const { page } = m
  if (process.env.COMPILADO) {
    const cuerpo = fs.readFileSync(process.env.COMPILADO)
    await page.route(`**/assets/${path.basename(vigente())}`, (r) => r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: cuerpo }))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    const ok = page.getByRole('button', { name: /entendido/i })
    if (await ok.count()) await ok.first().click().catch(() => {})
  }
  if (comoSafari)
    // Safari del iPad no manda «dblclick» después de un doble toque (Chrome sí). Se lo corta
    // antes de que llegue a la carta, para probar ese caso acá.
    await page.evaluate(() =>
      window.addEventListener('dblclick', (e) => e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents && e.stopImmediatePropagation(), true),
    )
  // Ningún trazo de esta prueba tiene que abrir un window.alert.
  m.dialogos = []
  page.on('dialog', (d) => {
    m.dialogos.push(d.message())
    d.dismiss().catch(() => {})
  })
  const datos = ejercicioFicticio({ conPlantilla: false })
  // Con área de interés: así aparece «🪖 CMOC» para dibujar avenidas.
  datos.aoi = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-65.12, -16.96], [-64.98, -16.96], [-64.98, -17.07], [-65.12, -17.07], [-65.12, -16.96]]] } }
  await sembrarYAbrir(page, datos)
  const ocultar = page.getByText('▼ ocultar')
  if (await ocultar.count()) await ocultar.first().click().catch(() => {})
  // El encuadre se hace desde el 3D, que expone su mapa y el de Leaflet.
  await entrar3D(page)
  // En la pantalla más angosta del iPad el panel de la izquierda tapa el oeste de la carta (en el
  // 3D inclinado, la punta oeste de la línea): se corre el centro 0,01° al oeste (~67 px).
  await page.evaluate(([v, lng]) => {
    window.__lm2d = window.__espejo3d.lm
    window.__map3d.jumpTo({ center: [lng, -17.015], zoom: 13.2, pitch: v === '3d' ? 30 : 0, bearing: 0 })
  }, [vista, movil ? -65.08 : -65.07])
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
      }).map(([x, y]) => {
        const el = document.elementFromPoint(x, y)
        return [x, y, el ? (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || el.tagName : null]
      }),
    puntos,
  )
  assert.deepStrictEqual(tapados, [], 'puntos de la prueba tapados por la interfaz: ' + JSON.stringify(tapados))
}

async function herramientaAO(page) {
  await clic(page.getByRole('button', { name: /ÁREA DE OPS/i }).first())
  await page.waitForTimeout(1200)
}

async function herramientaG1(page) {
  await clic(page.getByRole('button', { name: /G-1 Personal/i }).first())
  await page.waitForTimeout(1200)
  await clic(page.getByRole('button', { name: /Orden$/ }).first())
  await page.waitForTimeout(600)
  await clic(page.getByRole('button', { name: /Trazar la Línea de Extraviados/ }))
  await page.waitForTimeout(800)
}

async function herramientaG5(page) {
  await clic(page.getByRole('button', { name: /G-5 AC\/GM/i }).first())
  await page.waitForTimeout(1200)
  await clic(page.getByRole('button', { name: /Evacuación/ }).first())
  await page.waitForTimeout(600)
  await clic(page.getByRole('button', { name: /Trazar el eje humanitario/ }))
  await page.waitForTimeout(800)
}

async function herramientaAlambrada(page, movil) {
  const al = page.getByRole('button', { name: /AL · Alambrada simple/ })
  if (!(await al.count())) {
    const def = page.getByRole('button', { name: /DEFENSA/i }).first()
    movil ? await def.tap() : await clic(def)
    await page.waitForTimeout(800)
  }
  movil ? await al.tap() : await clic(al)
  await page.waitForTimeout(500)
}

async function herramientaCampoMinado(page) {
  if (!(await page.getByRole('button', { name: /CM AP · Campo minado antipersonal/ }).count())) {
    await clic(page.getByRole('button', { name: /DEFENSA/i }).first())
    await page.waitForTimeout(800)
  }
  await clic(page.getByRole('button', { name: /CM AP · Campo minado antipersonal/ }))
  await page.waitForTimeout(500)
}

async function cerrarPaneles(page) {
  for (let i = 0; i < 4; i++) {
    const x = page.getByRole('button', { name: '✕', exact: true })
    if (!(await x.count())) break
    await clic(x.last())
    await page.waitForTimeout(400)
  }
}

async function conRaton(vista) {
  const m = await preparar({ vista })
  const { page, errores, cerrar } = m
  const V = vista.toUpperCase()
  try {
    const fr = await aPantalla(page, P.frente)
    const [co] = await aPantalla(page, [P.contorno])
    const fr2 = await aPantalla(page, P.frente2)
    const [co2] = await aPantalla(page, [P.contorno2])
    const li = await aPantalla(page, P.linea)
    await sobreLaCarta(page, [...fr, co, ...fr2, co2, ...li])
    // El lugar de cada trazo se elige cuando le toca (con lo que ya se dibujó a la vista); el de
    // un trazo que no guarda nada (Esc, «Terreno clave») vuelve a quedar libre.
    const usados = [li]
    const lugar = async (guarda = true) => {
      const [p] = await lugaresParaTrazos(page, 1, usados)
      if (guarda) usados.push(p)
      return p
    }

    await caso(`${V} · ratón · Área de Operaciones: doble clic = «el frente es éste», y el doble clic cierra el contorno`, async () => {
      await herramientaAO(page)
      const antes = await estado(page)
      await page.mouse.click(...fr[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...fr[1])
      await page.waitForTimeout(500)
      assert.deepStrictEqual(await barra(page), ['✓ EL FRENTE ES ÉSTE', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'la barra del frente')
      await page.mouse.dblclick(...fr[2])
      await page.waitForTimeout(1500)
      await page.mouse.move(...co)
      await page.waitForTimeout(800)
      assert.match(await rotulo(page), /2 · CONTORNO/, 'el doble clic no pasó a la profundidad')
      assert.deepStrictEqual(await barra(page), ['✓ CERRAR EL ÁREA', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'la barra del contorno')
      const z0 = await zoom(page)
      await page.mouse.dblclick(...co)
      const d = await esperar(page, estado, (e) => e.frente === 3)
      assert.strictEqual(d.frente, 3, `el área no se guardó con el frente de 3 vértices: ${JSON.stringify(antes)} → ${JSON.stringify(d)}`)
      assert.ok(d.area >= 4, `área de ${d.area} vértices`)
      await page.waitForTimeout(1500)
      assert.strictEqual(await zoom(page), z0, 'el doble clic que cerró el área además acercó la carta')
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · Área de Operaciones: un vértice de contorno puesto antes y un clic otra vez sobre él cierra con ESE vértice (como «✓ CERRAR EL ÁREA»)`, async () => {
      await herramientaAO(page)
      await page.mouse.click(...fr2[0])
      await page.waitForTimeout(500)
      await page.mouse.dblclick(...fr2[1])
      await page.waitForTimeout(1500)
      await page.mouse.click(...co2)
      await page.waitForTimeout(1000) // otro gesto, no un doble clic
      await page.mouse.click(...co2)
      const d = await esperar(page, estado, (e) => e.frente === 2)
      assert.deepStrictEqual([d.frente, d.area], [2, 3], `se esperaba el polígono frente (2) + vértice (1): ${JSON.stringify(d)}`)
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · Línea de Extraviados (G-1): doble clic LENTO (dos clics en el último punto) termina`, async () => {
      await herramientaG1(page)
      const antes = await estado(page)
      await page.mouse.click(...li[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...li[1])
      await page.waitForTimeout(500)
      await page.mouse.click(...li[2])
      await page.waitForTimeout(900) // más lento que cualquier doble clic del sistema
      await page.mouse.click(...li[2])
      const d = await esperar(page, estado, (e) => e.lineasEM.length > antes.lineasEM.length)
      assert.deepStrictEqual(d.lineasEM, [...antes.lineasEM, 'extraviados:3'])
      await page.waitForTimeout(800)
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
    })

    await caso(`${V} · ratón · Línea de Extraviados (G-1): doble clic justo sobre el último vértice termina UNA vez y no empieza otra`, async () => {
      const antes = await estado(page)
      const T2 = await lugar()
      await page.mouse.click(...T2[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...T2[1])
      await page.waitForTimeout(500)
      await page.mouse.dblclick(...T2[1])
      const d = await esperar(page, estado, (e) => e.lineasEM.length > antes.lineasEM.length)
      assert.deepStrictEqual(d.lineasEM, [...antes.lineasEM, 'extraviados:2'])
      await page.waitForTimeout(1000)
      assert.deepStrictEqual(await barra(page), [], 'el segundo clic del doble clic empezó otro trazo')
    })

    await caso(`${V} · ratón · Línea de Extraviados (G-1): doble clic del sistema lento (480 ms) sobre el último vértice no deja un trazo fantasma`, async () => {
      const antes = await estado(page)
      const T3 = await lugar()
      await page.mouse.click(...T3[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...T3[1])
      await page.waitForTimeout(500)
      await clicSistema(page, ...T3[1], 1)
      await page.waitForTimeout(480)
      await clicSistema(page, ...T3[1], 2) // el segundo clic del doble clic (y su dblclick)
      const d = await esperar(page, estado, (e) => e.lineasEM.length > antes.lineasEM.length)
      assert.deepStrictEqual(d.lineasEM, [...antes.lineasEM, 'extraviados:2'])
      await page.waitForTimeout(1200)
      assert.deepStrictEqual(await barra(page), [], 'quedó empezado un trazo fantasma')
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · eje humanitario (G-5): Enter termina`, async () => {
      await herramientaG5(page)
      const antes = await estado(page)
      const T4 = await lugar()
      for (const p of T4) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.keyboard.press('Enter')
      const d = await esperar(page, estado, (e) => e.lineasEM.length > antes.lineasEM.length)
      assert.deepStrictEqual(d.lineasEM, [...antes.lineasEM, 'humanitario:3'])
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · obstáculo: «↶ BORRAR ÚLTIMO» y «✓ TERMINAR TRAZO» de la barra; Esc cancela`, async () => {
      await herramientaAlambrada(page)
      const antes = await estado(page)
      const T5 = await lugar()
      const T6 = await lugar()
      const T7 = await lugar(false)
      for (const p of T5) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.locator('.barra-trazo button', { hasText: 'BORRAR ÚLTIMO' }).click()
      await page.waitForTimeout(400)
      await page.keyboard.press('Enter') // con el foco donde estaba: termina, no vuelve a borrar
      let d = await esperar(page, estado, (e) => e.obstaculos.length > antes.obstaculos.length)
      assert.deepStrictEqual(d.obstaculos, [...antes.obstaculos, 'alambre_simple:2'], 'Enter después de «↶ BORRAR ÚLTIMO»')
      await page.mouse.click(...T6[0]) // enseguida: después de Enter no hay guarda
      await page.waitForTimeout(500)
      await page.mouse.click(...T6[1])
      await page.waitForTimeout(500)
      await page.locator('.barra-trazo button', { hasText: 'TERMINAR TRAZO' }).click()
      d = await esperar(page, estado, (e) => e.obstaculos.length > antes.obstaculos.length + 1)
      assert.deepStrictEqual(d.obstaculos, [...antes.obstaculos, 'alambre_simple:2', 'alambre_simple:2'], '«✓ TERMINAR TRAZO»')
      await page.mouse.click(...T7[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...T7[1])
      await page.waitForTimeout(500)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(600)
      assert.deepStrictEqual(await barra(page), [], 'Esc no canceló')
      assert.deepStrictEqual((await estado(page)).obstaculos, d.obstaculos, 'Esc agregó algo')
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · campo minado (área): un doble clic con 2 vértices avisa y NO borra el trazo; con el tercero, Enter lo cierra`, async () => {
      await herramientaCampoMinado(page)
      const antes = await estado(page)
      const T8 = await lugar()
      await page.mouse.click(...T8[0])
      await page.waitForTimeout(500)
      await page.mouse.dblclick(...T8[1])
      await page.waitForTimeout(1500)
      assert.match(await aviso(page), /TRES VÉRTICES/, 'falta el aviso')
      assert.deepStrictEqual((await estado(page)).obstaculos, antes.obstaculos, 'guardó un área de 2 vértices')
      await page.mouse.click(...T8[2])
      await page.waitForTimeout(500)
      await page.keyboard.press('Enter')
      const d = await esperar(page, estado, (e) => e.obstaculos.length > antes.obstaculos.length)
      assert.strictEqual(d.obstaculos.length, antes.obstaculos.length + 1, 'no se cerró')
      assert.match(d.obstaculos.at(-1), /:3$/, `el área tiene que tener los 3 vértices: ${d.obstaculos.at(-1)}`)
      await cerrarPaneles(page)
    })

    await caso(`${V} · ratón · avenida del CMOC (G-2): dos clics en el último punto terminan`, async () => {
      await clic(page.getByRole('button', { name: '🪖 CMOC', exact: true }))
      await page.waitForTimeout(1000)
      await clic(page.getByRole('button', { name: /^➤\s*Avenida$/ }))
      await page.waitForTimeout(800)
      const antes = (await cmoc(page)) || []
      const T9 = await lugar()
      for (const p of T9) {
        await page.mouse.click(...p)
        await page.waitForTimeout(500)
      }
      await page.waitForTimeout(500)
      await page.mouse.click(...T9[2])
      const d = await esperar(page, cmoc, (a) => (a || []).length > antes.length)
      assert.deepStrictEqual(d, [...antes, 3])
      await page.waitForTimeout(800)
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
      await page.keyboard.press('Enter') // sin trazo del CMOC empezado: no hace nada (ni avisa)
      await page.waitForTimeout(600)
    })

    await caso(`${V} · ratón · CMOC: cambiar a «Terreno clave» con una avenida empezada y apretar Enter no rompe la Mesa`, async () => {
      const antes = (await cmoc(page)) || []
      const T7 = await lugar(false)
      await page.mouse.click(...T7[0])
      await page.waitForTimeout(500)
      await page.mouse.click(...T7[1])
      await page.waitForTimeout(500)
      await clic(page.getByRole('button', { name: /^Ⓒ\s*Terreno clave$/ }).first())
      await page.waitForTimeout(800)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1500)
      assert.ok(await page.evaluate(() => document.getElementById('root').children.length > 0 && !!document.querySelector('.leaflet-container')), 'la Mesa quedó en blanco')
      assert.deepStrictEqual((await cmoc(page)) || [], antes, 'guardó algo')
      assert.deepStrictEqual(await barra(page), [], 'quedó el trazo de la avenida a medias')
    })

    await caso(`${V} · ratón · CMOC restringido: un vértice a 8 px del anterior se agrega (no se traga el clic) y dos clics en el último cierran`, async () => {
      await clic(page.getByRole('button', { name: /^▨\s*Restringido$/ }))
      await page.waitForTimeout(800)
      const antes = await restringidos(page)
      const T7 = await lugar()
      await page.mouse.click(...T7[0])
      await page.waitForTimeout(500)
      await page.mouse.click(T7[0][0] + 8, T7[0][1])
      await page.waitForTimeout(500)
      await page.mouse.click(...T7[2])
      await page.waitForTimeout(700)
      await page.mouse.click(...T7[2])
      const d = await esperar(page, restringidos, (n) => n > antes)
      assert.strictEqual(d, antes + 1, 'el área restringida no se cerró (¿se tragó el vértice cercano?)')
    })

    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
    assert.deepStrictEqual(m.dialogos, [], 'avisos window.alert inesperados')
  } finally {
    await cerrar()
  }
}

// Con el dedo, como en un iPad (sin el «dblclick» que Safari no manda).
async function conDedo(vista) {
  const { page, errores, cerrar } = await preparar({ vista, movil: true, comoSafari: true })
  const V = vista.toUpperCase()
  try {
    const fr = await aPantalla(page, P.frente)
    const li = await aPantalla(page, P.linea)
    await sobreLaCarta(page, [...fr, ...li])
    await caso(`${V} · dedo (Safari) · alambrada: toque, toque, doble toque`, async () => {
      await herramientaAlambrada(page, true)
      const antes = await estado(page)
      await toques(page, ...li[0])
      await page.waitForTimeout(600)
      await toques(page, ...li[1])
      await page.waitForTimeout(600)
      await toques(page, ...li[2], { veces: 2, separacionMs: 300 })
      const d = await esperar(page, estado, (e) => e.obstaculos.length > antes.obstaculos.length)
      assert.deepStrictEqual(d.obstaculos, [...antes.obstaculos, 'alambre_simple:3'])
      await page.waitForTimeout(800)
      assert.deepStrictEqual(await barra(page), [], 'quedó un trazo empezado')
    })
    await caso(`${V} · dedo (Safari) · Área de Operaciones: doble toque = «el frente es éste»`, async () => {
      await herramientaAO(page)
      await toques(page, ...fr[0])
      await page.waitForTimeout(600)
      await toques(page, ...fr[1], { veces: 2, separacionMs: 300 })
      await page.waitForTimeout(1500)
      assert.deepStrictEqual(await barra(page), ['✓ CERRAR EL ÁREA', '↶ BORRAR ÚLTIMO', '✕ CANCELAR'], 'no pasó al contorno')
    })
    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

;(async () => {
  const solo = process.argv[2]
  if (!solo || solo === '2d') await conRaton('2d')
  if (!solo || solo === '3d') await conRaton('3d')
  if (!solo || solo === 'dedo' || solo === 'dedo2d') await conDedo('2d')
  if (!solo || solo === 'dedo' || solo === 'dedo3d') await conDedo('3d')
  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
