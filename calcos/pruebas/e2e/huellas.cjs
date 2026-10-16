// 🛤️ Huellas y sendas de OSM en la Mesa real (Chromium), sin red: OSM (Overpass) se contesta acá.
// Lo pidió Sergio: con «⚙️ 🛤️ Huellas y sendas (OSM al día — Vía 3/4) (🇧🇴)…» la Mesa se colgaba,
// sobre todo con áreas grandes. Hasta index-tijera-20261016.js:
//   · OSM sin contestar → ⚡ GENERAR CALCOS esperaba para siempre (a los 240 s seguía igual);
//   · área de 1°×1° con 30.000 caminos → la pestaña congelada 13 s seguidos (recorte con turf en el hilo).
// Ahora:
//   · el área grande: la página nunca se traba más de un instante y salen los mismos caminos;
//   · OSM sin contestar: corta a tiempo, avisa, el calco sale igual y al volver a generar reintenta;
//   · con muchos caminos: van los más importantes y lo avisa;
//   · sin Web Worker (navegador viejo, file://): lo hace en la página, cediendo el hilo.
//
//   cd calcos/pruebas && node e2e/huellas.cjs
//   COMPILADO=/ruta/a/otro-index.js node e2e/huellas.cjs   (lo sirve en lugar del vigente)
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { servir, cargarPlaywright } = require('./navegador')
const { vigente } = require('../extraer')

// Un área como la de la captura, pero grande: ~1°×1°, contorno irregular, en el altiplano.
const CX = -67.5, CY = -18.5, R = 0.5
const anillo = []
for (let i = 0; i < 60; i++) {
  const a = (i / 60) * 2 * Math.PI, r = R * (0.8 + 0.2 * Math.sin(5 * a))
  anillo.push([CX + r * Math.cos(a), CY + r * Math.sin(a)])
}
anillo.push(anillo[0])
const AOI = { type: 'Polygon', coordinates: [anillo] }
const BASE = { tipoArchivo: 'base-pmtd', version: 1, ejercicio: 'Huellas OSM', autor: 'e2e', fecha: new Date().toISOString(), mision: '', pais: 'bolivia', aoi: AOI, aoPuntos: [], unidades: [], ops: null, cmoc: null, fasesCOA: null, faseActiva: null }

// Lo que contestaría Overpass: N caminos en el rectángulo del área.
function overpass(n) {
  let s = 1
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647
  // Por clase, menos que el tope que le pide la Mesa a Overpass (que corta ahí).
  const tipos = ['track', 'track', 'track', 'path', 'track', 'path', 'track', 'footway', 'track', 'bridleway']
  const elements = []
  for (let i = 0; i < n; i++) {
    let lon = CX - R * 1.1 + azar() * 2.2 * R, lat = CY - R * 1.1 + azar() * 2.2 * R
    const geometry = []
    for (let k = 0; k < 25; k++) {
      geometry.push({ lat, lon })
      lon += (azar() - 0.5) * 0.004
      lat += (azar() - 0.5) * 0.004
    }
    elements.push({ type: 'way', id: i + 1, tags: { highway: tipos[i % 10], tracktype: i % 3 ? 'grade3' : 'grade2' }, geometry })
  }
  return JSON.stringify({ elements })
}
const GRANDE = overpass(30000)

let fallas = 0
async function caso(nombre, fn) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n    ${e.stack || e.message}`)
  }
}

// La Mesa publicada (modo servidor) con la BASE del área grande. `osm(pedido)` contesta a Overpass
// (null: no contesta nunca). `limites`: window.SIDECEME_HUELLAS_LIMITES. `sinWorker`: sin Web Worker.
async function mesa({ osm, limites = null, sinWorker = false }) {
  const { chromium } = cargarPlaywright()
  const { srv, url } = await servir()
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  if (process.env.COMPILADO) {
    const cuerpo = fs.readFileSync(process.env.COMPILADO)
    // Por el camino (la página lo pide con ?v=…).
    await ctx.route((u) => u.pathname.endsWith(`/assets/${path.basename(vigente())}`), (r) => r.fulfill({ contentType: 'text/javascript; charset=utf-8', body: cuerpo }))
  }
  const pedidosOSM = []
  const vacia = { type: 'FeatureCollection', features: [] }
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (r) => {
    const u = r.request().url()
    if (u.includes('/api/interpreter')) {
      pedidosOSM.push({ url: u, consulta: r.request().postData() })
      const res = osm(pedidosOSM.length)
      return res === null ? undefined : r.fulfill(res)
    }
    if (u.includes('/functions/v1/calcos-datos')) {
      const c = JSON.parse(r.request().postData() || '{}')
      if (c.accion === 'permiso') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, permitido: true, administra: true, nombre: 'e2e' }) })
      if (c.accion === 'recortar') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, capas: Object.fromEntries(c.capas.map((k) => [k, vacia])) }) })
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    }
    if (u.includes('/functions/v1/calco-ops')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, calcos: [], calco: { id: 'c-e2e', nombre: 'e2e', payload: {} } }) })
    return r.abort()
  })
  const pedidosWorker = []
  ctx.on('request', (q) => q.url().includes('/huellas/v1/trabajador.mjs') && pedidosWorker.push(q.url()))
  const page = await ctx.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
  await page.addInitScript(
    ({ base, limites, sinWorker }) => {
      window.SIDECEME_CALCOS = { url: 'https://ofsyiylhdrdiqtnbaovo.supabase.co', anonKey: 'x', token: 'token-e2e', esProfesor: true }
      localStorage.setItem('pmtd_base_repartida', JSON.stringify(base))
      if (limites) window.SIDECEME_HUELLAS_LIMITES = limites
      if (sinWorker) window.Worker = undefined
      // El bloqueo más largo del hilo de la página: un reloj que debería latir cada 50 ms.
      window.__bloqueo = 0
      let ult = performance.now()
      setInterval(() => {
        const t = performance.now()
        window.__bloqueo = Math.max(window.__bloqueo, t - ult)
        ult = t
      }, 50)
    },
    { base: BASE, limites, sinWorker },
  )
  await page.goto(url + '?puesto=g2', { waitUntil: 'domcontentloaded' })
  await page.locator('button.btn-generar').first().waitFor({ state: 'attached', timeout: 30000 })
  await page.waitForTimeout(4000)

  // ⚡ GENERAR CALCOS y esperar a que termine; anota los textos del botón que pasaron.
  const generar = async (maxMs = 120000) => {
    const boton = page.locator('button.btn-generar').first()
    await page.evaluate(() => {
      window.__bloqueo = 0
      window.__textos = []
      const b = document.querySelector('button.btn-generar')
      new MutationObserver(() => window.__textos.push(b.textContent)).observe(b, { childList: true, characterData: true, subtree: true })
    })
    const t0 = Date.now()
    await boton.evaluate((b) => b.click())
    await page.waitForFunction(() => /GENERAR CALCOS/.test(document.querySelector('button.btn-generar').textContent), null, { timeout: maxMs, polling: 250 })
    return page.evaluate(
      ([t0]) => {
        const huellas = (window.__resultados?.comunicaciones?.fc?.features || []).filter((f) => f._capaId === 'comunicaciones_huellas')
        return {
          ms: Date.now() - t0,
          bloqueo: Math.round(window.__bloqueo),
          textos: window.__textos,
          error: document.querySelector('.mensaje-error')?.textContent || '',
          huellas: huellas.length,
          porCapa: window.__resultados?.comunicaciones?.porCapa?.comunicaciones_huellas,
          coords: huellas.flatMap((f) => (f.geometry.type === 'LineString' ? f.geometry.coordinates : f.geometry.coordinates.flat())),
        }
      },
      [t0],
    )
  }
  const cerrar = async () => {
    await browser.close()
    srv.close()
  }
  return { page, generar, pedidosOSM, pedidosWorker, errores, cerrar }
}

const dentroDeLaCaja = (coords) => {
  const xs = anillo.map((p) => p[0]), ys = anillo.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  return coords.every(([x, y]) => x >= x0 - 1e-9 && x <= x1 + 1e-9 && y >= y0 - 1e-9 && y <= y1 + 1e-9)
}

;(async () => {
  // Lo que tiene que salir: el núcleo, en Node, con los mismos datos (el recorte del núcleo da lo
  // mismo que el de la Mesa con turf: pruebas/huellas-osm.mjs).
  const { procesar } = await import('../../huellas/v1/nucleo.mjs?v=huellas20261016')
  const esperado = (await procesar(JSON.parse(GRANDE), { type: 'Feature', geometry: AOI })).features.length
  assert.ok(esperado > 10000, `${esperado} caminos adentro`)

  await caso(`área de 1°×1° con 30.000 caminos de OSM: la página no se traba y salen los ${esperado.toLocaleString('es-BO')} caminos del área`, async () => {
    const m = await mesa({ osm: () => ({ contentType: 'application/json', body: GRANDE }) })
    try {
      const r = await m.generar()
      assert.strictEqual(r.huellas, esperado)
      assert.strictEqual(r.porCapa, esperado)
      assert.ok(dentroDeLaCaja(r.coords), 'todo recortado al área')
      assert.ok(r.bloqueo < 1500, `la página estuvo trabada ${r.bloqueo} ms seguidos (hasta index-tijera-20261016.js: ~13.000)`)
      assert.strictEqual(m.pedidosOSM.length, 1)
      assert.match(m.pedidosOSM[0].consulta, /\[timeout:50\]/)
      assert.match(m.pedidosOSM[0].consulta, /\(track\)\$"\]\([-\d.,]+\);out geom 20000;/)
      assert.strictEqual(m.pedidosWorker.length, 1, 'lo hizo el Web Worker')
      assert.ok(r.textos.some((t) => /caminos traídos de OSM|Recortando|Consultando OpenStreetMap/.test(t)), `el botón muestra el progreso: ${[...new Set(r.textos)].join(' | ')}`)
      assert.doesNotMatch(r.error, /Huellas y sendas/)
      // Otra vez, misma área: no vuelve a pedirle a OSM.
      const r2 = await m.generar()
      assert.strictEqual(r2.huellas, esperado)
      assert.strictEqual(m.pedidosOSM.length, 1)
      assert.deepStrictEqual(m.errores, [])
    } finally {
      await m.cerrar()
    }
  })

  await caso('OSM no contesta: corta a tiempo, lo avisa, el calco sale igual y al volver a generar reintenta', async () => {
    let contesta = false
    const m = await mesa({ osm: () => (contesta ? { contentType: 'application/json', body: GRANDE } : null), limites: { esperaServidorMs: 3000, esperaTotalMs: 5000 } })
    try {
      const r = await m.generar(60000)
      assert.ok(r.ms < 30000, `terminó en ${r.ms} ms (hasta index-tijera-20261016.js no terminaba nunca)`)
      assert.strictEqual(r.huellas, 0)
      assert.ok(r.porCapa === 0, 'el resto del calco sale')
      assert.deepStrictEqual(m.pedidosOSM.map((p) => new URL(p.url).host), ['overpass-api.de', 'overpass.kumi.systems'], 'probó los dos servidores')
      assert.match(r.error, /Huellas y sendas: no se pudieron traer de OpenStreetMap \(OSM no contestó en \d+ s\)/)
      assert.ok(r.textos.some((t) => /Consultando OpenStreetMap( \(otro servidor\))?… \d+ s/.test(t)), `el botón cuenta los segundos: ${[...new Set(r.textos)].join(' | ')}`)
      contesta = true
      const r2 = await m.generar()
      assert.strictEqual(r2.huellas, esperado, 'lo que falló no quedó guardado: reintentó')
      assert.doesNotMatch(r2.error, /Huellas y sendas/)
      assert.deepStrictEqual(m.errores, [])
    } finally {
      await m.cerrar()
    }
  })

  await caso('demasiados caminos para dibujar: van los más importantes y lo avisa', async () => {
    const m = await mesa({ osm: () => ({ contentType: 'application/json', body: GRANDE }), limites: { rasgosMax: 500 } })
    try {
      const r = await m.generar()
      assert.strictEqual(r.huellas, 500)
      assert.match(r.error, new RegExp(`Huellas y sendas: van los 500 caminos más importantes de ${esperado.toLocaleString('es-BO')}`))
    } finally {
      await m.cerrar()
    }
  })

  await caso('sin Web Worker (navegador viejo o la app de escritorio con file://): lo hace en la página, cediendo el hilo', async () => {
    const m = await mesa({ osm: () => ({ contentType: 'application/json', body: GRANDE }), sinWorker: true })
    try {
      const r = await m.generar()
      assert.strictEqual(r.huellas, esperado)
      assert.strictEqual(m.pedidosWorker.length, 0)
      // Leer los 42 MB de JSON es lo único que no se puede partir.
      assert.ok(r.bloqueo < 4000, `la página estuvo trabada ${r.bloqueo} ms seguidos`)
      assert.deepStrictEqual(m.errores, [])
    } finally {
      await m.cerrar()
    }
  })

  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})()
