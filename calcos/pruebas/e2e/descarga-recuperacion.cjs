const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

;(async () => {
  const raiz = path.resolve(__dirname, '../../descarga-recuperacion')
  const clave = crypto.randomBytes(32)
  const id = crypto.randomBytes(16).toString('hex')
  const iv = crypto.randomBytes(12)
  const original = Buffer.from(JSON.stringify({ nombre: 'Prueba de descarga', g3: {}, fasesCOA: { propio: [{ nombre: 'Fase de prueba' }] } }))
  const cifrador = crypto.createCipheriv('aes-256-gcm', clave, iv)
  cifrador.setAAD(Buffer.from(id))
  const paquete = Buffer.concat([iv, cifrador.update(original), cifrador.final(), cifrador.getAuthTag()])
  let respuestaBin = paquete
  let estadoBin = 200
  const peticiones = []
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    peticiones.push(req.url)
    if (req.url === `/archivos/${id}.bin`) {
      res.writeHead(estadoBin, { 'Content-Type': 'application/octet-stream' })
      return res.end(respuestaBin)
    }
    const nombre = req.url === '/' ? 'index.html' : req.url.slice(1)
    if (!['index.html', 'descarga.js', 'descarga.css'].includes(nombre)) { res.writeHead(404); return res.end() }
    res.setHeader('Content-Type', nombre.endsWith('.js') ? 'text/javascript' : nombre.endsWith('.css') ? 'text/css' : 'text/html')
    res.end(await fs.readFile(path.join(raiz, nombre)))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/`
  const temporal = await fs.mkdtemp(path.join(os.tmpdir(), 'sid-descarga-'))
  const navegador = await chromium.launch({ headless: true })
  try {
    const pagina = await navegador.newPage({ acceptDownloads: true })
    pagina.setDefaultTimeout(8000)
    const errores = []
    pagina.on('pageerror', e => errores.push(e.message))
    const secreto = clave.toString('base64url')
    async function abrir(fragmento) {
      await pagina.goto('about:blank')
      await pagina.goto(base + fragmento)
    }
    for (const ancho of [1280, 390]) {
      await pagina.setViewportSize({ width: ancho, height: 844 })
      await abrir(`#v1.${id}.${secreto}`)
      await pagina.getByRole('link', { name: 'Descargar ejercicio recuperado' }).waitFor()
      const [descarga] = await Promise.all([pagina.waitForEvent('download'), pagina.getByRole('link', { name: 'Descargar ejercicio recuperado' }).click()])
      assert.equal(descarga.suggestedFilename(), 'EJERCICIO_RECUPERADO_G3.json')
      const destino = path.join(temporal, `descarga-${ancho}.json`)
      await descarga.saveAs(destino)
      assert.deepEqual(await fs.readFile(destino), original)
    }
    console.log('OK: descarga exacta desde el botón en computadora y móvil.')
    for (const fragmento of ['', '#v1.invalido', `#v1.${id}.${crypto.randomBytes(32).toString('base64url')}`]) {
      await abrir(fragmento)
      await pagina.locator('#estado').filter({ hasText: /^(Abre el enlace|No se pudo)/ }).waitFor()
      assert.equal(await pagina.locator('#descargar').isVisible(), false)
    }
    console.log('OK: enlaces incompletos y claves incorrectas no permiten descargar datos.')
    const manipulado = Buffer.from(paquete)
    manipulado[20] ^= 1
    for (const [contenido, status] of [[manipulado, 200], [Buffer.alloc(10), 200], [Buffer.alloc(0), 404]]) {
      respuestaBin = contenido; estadoBin = status
      await abrir(`#v1.${id}.${secreto}`)
      await pagina.locator('#estado').filter({ hasText: /^No se pudo/ }).waitFor()
      assert.equal(await pagina.locator('#descargar').isVisible(), false)
    }
    assert.ok(peticiones.every(url => !url.includes(secreto) && !url.includes('#')))
    assert.deepEqual(errores, [])
    console.log('OK: archivos alterados, incompletos y ausentes se rechazan; la clave no se envía al servidor; cero errores JavaScript.')
  } finally {
    await navegador.close()
    await new Promise(resolve => server.close(resolve))
    await fs.rm(temporal, { recursive: true, force: true })
  }
})().catch(e => { console.error(e); process.exitCode = 1 })
