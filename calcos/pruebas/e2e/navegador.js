// Utilidades para probar la Mesa del EM en Chromium (Playwright), sin red:
//   · sirve el repositorio desde un servidor local,
//   · reemplaza los tiles de la carta y del relieve por imágenes lisas generadas
//     acá (así el 3D arranca igual que con internet),
//   · siembra un ejercicio en el IndexedDB y lo abre desde 📁 Ejercicio,
//   · lee el estado de React (ops, orgTarea…) para comprobar lo que pasó.
//
// Playwright no es dependencia del proyecto: se usa el que haya instalado
// (PLAYWRIGHT_MODULE=/ruta/a/playwright si no está en node_modules).
const http = require('http')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const RAIZ = path.resolve(__dirname, '..', '..', '..')

function cargarPlaywright() {
  const candidatos = [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright'].filter(Boolean)
  for (const c of candidatos) {
    try {
      return require(c)
    } catch {}
  }
  throw new Error('Falta Playwright: npm install --no-save playwright (o PLAYWRIGHT_MODULE=/ruta/a/playwright)')
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.kml': 'application/vnd.google-earth.kml+xml' }

function servir() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      if (p.endsWith('/')) p += 'index.html'
      const f = path.join(RAIZ, p)
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404)
        return res.end()
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
      fs.createReadStream(f).pipe(res)
    })
    srv.listen(0, '127.0.0.1', () => ok({ srv, url: `http://127.0.0.1:${srv.address().port}/calcos/` }))
  })
}

// PNG de 256×256 de un solo color (sin archivos binarios en el repo).
function pngLiso([r, g, b]) {
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(256 * 3, Buffer.from([r, g, b]))])
  const crudo = Buffer.concat(Array.from({ length: 256 }, () => fila))
  const crc = (buf) => {
    let c = ~0
    for (const x of buf) {
      c ^= x
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
    return ~c >>> 0
  }
  const trozo = (tipo, datos) => {
    const t = Buffer.from(tipo)
    const largo = Buffer.alloc(4)
    largo.writeUInt32BE(datos.length)
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(Buffer.concat([t, datos])))
    return Buffer.concat([largo, t, datos, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(256, 0)
  ihdr.writeUInt32BE(256, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ihdr), trozo('IDAT', zlib.deflateSync(crudo)), trozo('IEND', Buffer.alloc(0))])
}
const TILE_CARTA = pngLiso([92, 104, 72])
const TILE_DEM = pngLiso([128, 14, 0]) // terrarium: 128·256 + 14 − 32768 = 3598 m (plano)

async function abrir({ ancho = 1440, alto = 900, movil = false, consulta = '' } = {}) {
  const { chromium } = cargarPlaywright()
  const { srv, url } = await servir()
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, isMobile: movil, hasTouch: movil })
  const page = await ctx.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errores.push('console: ' + m.text().slice(0, 300))
  })
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => {
    const u = r.request().url()
    if (/terrarium|elevation-tiles/.test(u)) return r.fulfill({ status: 200, contentType: 'image/png', body: TILE_DEM })
    if (/\/\d+\/\d+\/\d+(\.png|\.jpe?g)?(\?|$)|tile|lyrs=/i.test(u)) return r.fulfill({ status: 200, contentType: 'image/png', body: TILE_CARTA })
    return r.abort()
  })
  await page.goto(url + consulta, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const ok = page.getByRole('button', { name: /entendido/i })
  if (await ok.count()) await ok.first().click().catch(() => {})
  const cerrar = async () => {
    await browser.close()
    srv.close()
  }
  return { browser, page, errores, cerrar, url }
}

// Primer estado de React que cumpla `prueba` (recorre el árbol de fibras).
// Se parte del árbol CONFIRMADO (`stateNode.current`): `__reactContainer…` guarda la
// fibra raíz de cuando se creó la raíz, y React alterna entre dos fibras raíz en cada
// confirmación; la mitad de las veces esa es la otra copia, con el estado de un render
// anterior (p. ej. `orgTarea` todavía vacía después de abrir un ejercicio).
async function estadoReact(page, prueba) {
  return page.evaluate((src) => {
    const f = new Function('v', `return (${src})(v)`)
    const root = document.getElementById('root')
    const k = Object.keys(root).find((x) => x.startsWith('__reactContainer'))
    const pila = [root[k]?.stateNode?.current || root[k]]
    const vistos = new Set()
    while (pila.length) {
      const n = pila.pop()
      if (!n || vistos.has(n)) continue
      vistos.add(n)
      let h = n.memoizedState
      for (let i = 0; h && typeof h === 'object' && i < 500; i++, h = h.next) {
        try {
          const r = f(h.memoizedState)
          if (r !== undefined) return r
        } catch {}
      }
      if (n.child) pila.push(n.child)
      if (n.sibling) pila.push(n.sibling)
    }
    return null
  }, prueba.toString())
}

// Lo que hay trazado en la carta (ops del calco).
const estadoOps = (page) =>
  estadoReact(page, (v) =>
    v && !Array.isArray(v) && Array.isArray(v.obstaculos) && Array.isArray(v.limites)
      ? { obstaculos: v.obstaculos.length, posDef: (v.posDef || []).length, areaOps: !!v.areaOps }
      : undefined,
  )

async function esperarCambio(page, leer, antes, ms = 30000) {
  const t0 = Date.now()
  for (;;) {
    const e = await leer(page)
    if (JSON.stringify(e) !== JSON.stringify(antes) || Date.now() - t0 > ms) return e
    await page.waitForTimeout(250)
  }
}

// Deja un ejercicio en el IndexedDB (modo «navegador») y lo abre como el usuario.
async function sembrarYAbrir(page, datos) {
  await page.evaluate(async (d) => {
    await new Promise((ok, mal) => {
      const r = indexedDB.open('calcos', 1)
      r.onupgradeneeded = () => {
        const db = r.result
        if (!db.objectStoreNames.contains('ejercicios')) db.createObjectStore('ejercicios', { keyPath: 'nombre' })
        if (!db.objectStoreNames.contains('archivos')) db.createObjectStore('archivos', { keyPath: 'clave' }).createIndex('porEjercicio', 'nombre', { unique: false })
      }
      r.onsuccess = () => {
        const tx = r.result.transaction('ejercicios', 'readwrite')
        tx.objectStore('ejercicios').put({ nombre: d.nombre, guardadoEn: d.guardadoEn || new Date().toISOString(), datos: d })
        tx.oncomplete = () => {
          r.result.close()
          ok()
        }
        tx.onerror = () => mal(tx.error)
      }
      r.onerror = () => mal(r.error)
    })
  }, datos)
  // dispatchEvent: en el teléfono el tablero de la Mesa tapa parte de la barra.
  await page.getByRole('button', { name: /^📁 Ejercicio/i }).first().dispatchEvent('click')
  await page.getByRole('button', { name: 'Abrir guardados' }).dispatchEvent('click')
  await page.waitForTimeout(600)
  const fila = page.locator('div', { hasText: datos.nombre }).filter({ has: page.getByRole('button', { name: 'Abrir' }) }).last()
  await fila.getByRole('button', { name: 'Abrir' }).dispatchEvent('click')
  await page.waitForTimeout(2500)
}

// Lee el ejercicio tal como quedó guardado en el IndexedDB.
async function leerGuardado(page, nombre) {
  return page.evaluate(
    (n) =>
      new Promise((ok) => {
        const r = indexedDB.open('calcos', 1)
        r.onsuccess = () => {
          const g = r.result.transaction('ejercicios').objectStore('ejercicios').get(n)
          g.onsuccess = () => ok(g.result ? g.result.datos : null)
          g.onerror = () => ok(null)
        }
        r.onerror = () => ok(null)
      }),
    nombre,
  )
}

async function entrar3D(page) {
  await page.locator('.m3d-seg button', { hasText: '3D' }).dispatchEvent('click')
  await page.waitForFunction(() => !!window.__espejo3d, null, { timeout: 60000 })
  await page.waitForTimeout(1500)
}

async function salir3D(page) {
  await page.locator('.m3d-seg button', { hasText: '2D' }).click()
  await page.waitForFunction(() => !window.__map3d, null, { timeout: 30000 })
  await page.waitForTimeout(2000)
}

// [lng, lat] → punto de la pantalla, en la vista que se esté mirando.
async function aPantalla(page, lista) {
  return page.evaluate((L) => {
    const m3 = window.__map3d
    if (m3) {
      const r = m3.getCanvas().getBoundingClientRect()
      return L.map(([lng, lat]) => {
        const p = m3.project([lng, lat])
        return [r.left + p.x, r.top + p.y]
      })
    }
    const lm = window.__lm2d
    const r = lm.getContainer().getBoundingClientRect()
    return L.map(([lng, lat]) => {
      const p = lm.latLngToContainerPoint([lat, lng])
      return [r.left + p.x, r.top + p.y]
    })
  }, lista)
}

// Antes de apoyar el dedo en el 3D, la vista tiene que estar LISTA: sin cuadro
// pendiente y con la GPU al día.
//
// Con relieve, el `touchstart` de MapLibre ubica el punto tocado leyendo la
// profundidad de la GPU (`unproject` → `pointCoordinate` → `readPixels`), y esa
// lectura espera a que la GPU termine lo que tenga en cola. Sin placa de video
// (SwiftShader), después de cada redibujado eso bloquea ~1 s DENTRO del
// `touchstart`. El toque largo de la Mesa (600 ms) ya arrancó para entonces, y
// Chrome recién entrega el `touchend` al terminar: el temporizador vence primero
// y un toque corto se toma por largo (termina la línea antes de tiempo, o el
// punto no se pone). Con GPU esa lectura tarda milisegundos.
//
// «Lista» = MapLibre quieto y sin cuadro pedido, el espejo 3D sin reconstrucción
// pendiente ni trazos «calientes» (el que se está dibujando se reconstruye 2,5 s
// después: otro redibujado), y dos lecturas de profundidad seguidas en el punto
// del gesto que vuelven en menos de 50 ms.
async function listoParaElDedo(page, x, y, ms = 60000) {
  const t0 = Date.now()
  let seguidas = 0
  let ult = null
  for (;;) {
    ult = await page.evaluate(
      ([x, y]) => {
        const m = window.__map3d
        if (!m) return { sin3D: true }
        const esp = window.__espejo3d
        const pendiente = m.isMoving() || !m.loaded() || !!m._frameRequest || !!(esp && (esp.raf || (esp.caliente && esp.caliente.size)))
        const r = m.getCanvas().getBoundingClientRect()
        const t = performance.now()
        try {
          m.unproject([x - r.left, y - r.top])
        } catch {}
        return { pendiente, lectura: Math.round(performance.now() - t) }
      },
      [x, y],
    )
    if (ult.sin3D) return
    seguidas = !ult.pendiente && ult.lectura < 50 ? seguidas + 1 : 0
    if (seguidas >= 2) return
    if (Date.now() - t0 > ms) throw new Error(`La vista 3D no quedó lista para el dedo en ${ms / 1000} s: ${JSON.stringify(ult)}`)
    await page.waitForTimeout(100)
  }
}

// Toques con la marca de tiempo que corresponde a un dedo real (en una máquina
// sin GPU cada render tarda segundos y el segundo toque llegaría tarde).
async function toques(page, x, y, { veces = 1, separacionMs = 90, duracionMs = 30 } = {}) {
  await listoParaElDedo(page, x, y)
  const cdp = await page.context().newCDPSession(page)
  const t0 = Date.now() / 1000
  for (let i = 0; i < veces; i++) {
    const t = t0 + (i * separacionMs) / 1000
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }], timestamp: t })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t + duracionMs / 1000 })
  }
  await cdp.detach()
}

// Dedo apoyado y quieto al menos `ms` milisegundos (toque largo). Como una
// persona, no lo levanta hasta que la Mesa registró la presión (`presionHecha`
// del espejo 3D), por lenta que venga la máquina.
async function toqueLargo(page, x, y, ms = 900) {
  await listoParaElDedo(page, x, y)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await page.waitForTimeout(ms)
  await page.waitForFunction(() => !window.__espejo3d || window.__espejo3d.presionHecha === true, null, { timeout: 30000, polling: 100 }).catch(() => {})
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

module.exports = { abrir, estadoReact, estadoOps, esperarCambio, sembrarYAbrir, leerGuardado, entrar3D, salir3D, aPantalla, listoParaElDedo, toques, toqueLargo, RAIZ, servir, cargarPlaywright }
