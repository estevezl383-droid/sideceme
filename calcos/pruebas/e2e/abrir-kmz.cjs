// 🌍 La Mesa real en Chromium (08-11-2026): 📁 Ejercicios → «📂 Abrir archivo JSON o KMZ» con el KMZ de
// Google Earth. Queda un ejercicio NUEVO con sus Áreas de Operaciones (la última AO activa) y sus fichas
// rojas y azules, guardado, y la carta en su área. Varios KMZ elegidos juntos (el teatro y las cuatro AO)
// van a UN ejercicio. Un KMZ sin AO ni fichas avisa. Capturas en pruebas/salidas-kmz/.
//   node calcos/pruebas/e2e/abrir-kmz.cjs
//   CARPETA_KMZ="/ruta/NUEVO EJERCICIO TCNL GALVEZ" node calcos/pruebas/e2e/abrir-kmz.cjs  (con los KMZ reales)
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { deflateRawSync } = require('zlib')
const { abrir, sembrarYAbrir, estadoReact, leerGuardado } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-kmz')
const BOTON = '📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)'
const leerOps = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.limites) && 'areaOps' in v ? v : undefined)
const leerFichas = page => estadoReact(page, v => Array.isArray(v) && v.length && v.every(u => u && typeof u === 'object' && 'lat' in u && 'lng' in u && 'bando' in u) ? v : undefined)

function zip(nombre, texto) {
  const datos = Buffer.from(texto, 'utf8'), comp = deflateRawSync(datos), n = Buffer.from(nombre)
  const loc = Buffer.alloc(30); loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(8, 8); loc.writeUInt32LE(comp.length, 18); loc.writeUInt32LE(datos.length, 22); loc.writeUInt16LE(n.length, 26)
  const cen = Buffer.alloc(46); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(8, 10); cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(datos.length, 24); cen.writeUInt16LE(n.length, 28)
  const local = Buffer.concat([loc, n, comp]), central = Buffer.concat([cen, n])
  const fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(1, 8); fin.writeUInt16LE(1, 10); fin.writeUInt32LE(central.length, 12); fin.writeUInt32LE(local.length, 16)
  return Buffer.concat([local, central, fin])
}
const poli = (nom, c) => `<Placemark><name>${nom}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${c.map(p => p.join(',')).join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`
const punto = (nom, desc, c) => `<Placemark><name>${nom}</name><description><![CDATA[${desc}]]></description><Point><coordinates>${c.join(',')}</coordinates></Point></Placemark>`
const caja = (o, s, d) => [[o, s], [o + d, s], [o + d, s - d], [o, s - d], [o, s]]
// Los de prueba, con la forma de los de Sergio (sin la carpeta real).
function ficticios() {
  const kml = c => `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${c}</Document></kml>`
  return {
    grande: { name: '060700NOV26.kmz', buffer: zip('doc.kml', kml(`<Folder><name>01 TEATRO DE OPERACIONES</name>${poli('SUB TEATRO CENTRAL', caja(-68.6, -18.2, 1.2))}</Folder>
      <Folder><name>05 CARACTERISTICAS GEOGRAFICAS</name><Folder><name>AO CE-II PUMA</name><Folder><name>Área de interés</name>${poli('Área de Operaciones', caja(-68.4, -18.4, 0.6))}</Folder></Folder></Folder>
      <Folder><name>02 DIAMANTE | Unidades enemigas (SATURNO)</name>${punto('2ª Brig. Acor. «Cazadores» – Colchane', 'Escalón: Brigada Acorazada (X)', [-68.62, -19.27])}</Folder>
      <Folder><name>AZUL | Dispositivo</name>${punto('CE – II – Corque', 'Escalón: Cuerpo de Ejército (XXX)', [-67.68, -18.35])}</Folder>`)) },
    aos: [
      { name: '01 TEATRO DE OPERACIONES.kmz', buffer: zip('doc.kml', kml(`<Folder><name>01 TEATRO DE OPERACIONES</name>${poli('SUBTEATR NORTE', caja(-69.4, -17.0, 1.2))}</Folder>`)) },
      { name: 'AO TIGRE CE-I (TAMBO QUEMADO).kmz', buffer: zip('doc.kml', kml(poli('AO TIGRE CE-I (TAMBO QUEMADO)', caja(-69.2, -17.3, 0.5)))) },
    ],
    pasos: { name: 'PASOS 301144OCT26 .kmz', buffer: zip('doc.kml', kml(punto('TAMBO QUEMADO', '', [-69.0, -18.3]))) },
  }
}
function reales(dir) {
  const leer = n => ({ name: n, buffer: fs.readFileSync(path.join(dir, n)) })
  const aos = fs.readdirSync(dir).filter(n => /^(01 TEATRO|AO ).*\.kmz$/i.test(n)).sort()
  return { grande: leer('060700NOV26.kmz'), aos: aos.map(leer), pasos: leer('PASOS 301144OCT26 .kmz') }
}

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const dir = process.env.CARPETA_KMZ
  const k = dir ? reales(dir) : ficticios()
  const abierto = ejercicioFicticio({ conPlantilla: false }); abierto.nombre = 'FABBLE abierto'
  const { page, errores, cerrar } = await abrir()
  const dialogos = []
  page.on('dialog', d => { dialogos.push({ mensaje: d.message(), propuesto: d.defaultValue() }); return d.accept(d.defaultValue()) })
  const ventana = async () => {
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
  }
  const elegir = async archivos => {
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: BOTON }).click()])
    assert.equal(selector.isMultiple(), true, 'se pueden elegir varios')
    await selector.setFiles(archivos.map(a => ({ name: a.name, mimeType: 'application/vnd.google-earth.kmz', buffer: a.buffer })))
  }
  const esperarEjercicio = async n => {
    await page.waitForFunction(n => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some(b => b.textContent.includes(n)), n, { timeout: 30000 })
    await page.waitForTimeout(1500)
  }
  try {
    await sembrarYAbrir(page, abierto)

    // 1 · El KMZ grande: ejercicio nuevo con las AO y las fichas rojas y azules.
    await ventana()
    await page.screenshot({ path: path.join(SALIDAS, '1-ventana.png') })
    await elegir([k.grande])
    await esperarEjercicio('060700NOV26')
    assert.equal(dialogos.length, 1); assert.equal(dialogos[0].propuesto, '060700NOV26')
    assert.match(dialogos[0].mensaje, /como ejercicio NUEVO \(.*áreas? .*ficha/)
    const ops = await leerOps(page)
    const nombres = [...new Set([...(ops.areasOps || []).map(a => a.nombre), ops.areaOps?.nombre])]
    assert.ok(/AO|PUMA|OSO/.test(ops.areaOps.nombre), `queda activa una AO: ${ops.areaOps.nombre}`)
    assert.ok(nombres.some(n => /TEATR/i.test(n)), 'el teatro también entra')
    const fichas = await leerFichas(page)
    const rojas = fichas.filter(u => u.bando === 'enemigo'), azules = fichas.filter(u => u.bando === 'propias')
    assert.ok(rojas.length >= 1 && azules.length >= 1, `rojas ${rojas.length}, azules ${azules.length}`)
    assert.ok(rojas.some(u => u.escalon === 'brigada' && u.arma === 'blindada'))
    const vista = await page.evaluate(c => {
      const b = window.__mapa2d.getBounds(), lat = c.reduce((s, p) => s + p[1], 0) / c.length, lng = c.reduce((s, p) => s + p[0], 0) / c.length
      return b.contains([lat, lng])
    }, ops.areaOps.coords)
    assert.ok(vista, 'la carta va al área')
    // Las fichas se dibujan en la carta 2D.
    const marcas = await page.evaluate(() => document.querySelectorAll('.leaflet-marker-icon').length)
    assert.ok(marcas >= fichas.length, `marcas en la carta: ${marcas} de ${fichas.length} fichas`)
    await page.screenshot({ path: path.join(SALIDAS, '2-kmz-grande.png') })
    const g = await leerGuardado(page, '060700NOV26')
    assert.equal(g.unidades.length, fichas.length, 'guardado con sus fichas'); assert.equal(g.ops.areaOps.nombre, ops.areaOps.nombre)
    const antes = await leerGuardado(page, 'FABBLE abierto')
    assert.deepEqual(antes.unidades.map(u => u.id), abierto.unidades.map(u => u.id), 'el que estaba abierto no se toca')
    console.log(`  · ${k.grande.name}: ${nombres.length} áreas (${nombres.join(' · ')}), ${rojas.length} rojas, ${azules.length} azules, ${marcas} marcas`)

    // 2 · Varios a la vez (el teatro y las AO): UN ejercicio con todas.
    await ventana()
    await elegir(k.aos)
    const propuesto = k.aos[0].name.replace(/\.kmz$/i, '')
    await esperarEjercicio(propuesto)
    assert.equal(dialogos.length, 2); assert.match(dialogos[1].mensaje, new RegExp(`«${k.aos.length} archivos»`))
    const ops2 = await leerOps(page)
    const n2 = [...new Set([...(ops2.areasOps || []).map(a => a.nombre), ops2.areaOps?.nombre])]
    assert.ok(n2.length >= k.aos.length, `las ${k.aos.length} áreas: ${n2.join(' · ')}`)
    await page.screenshot({ path: path.join(SALIDAS, '3-varios.png') })
    console.log(`  · ${k.aos.length} archivos juntos: ${n2.join(' · ')}`)

    // 3 · Un KMZ sin AO ni fichas avisa en la ventana, sin preguntar nada.
    await ventana()
    await elegir([k.pasos])
    await page.getByText(/no trae áreas de operaciones ni fichas/).waitFor()
    assert.equal(dialogos.length, 2)
    await page.screenshot({ path: path.join(SALIDAS, '4-aviso.png') })

    assert.deepEqual(errores.filter(e => !/favicon|ERR_|Failed to load resource/.test(e)), [], 'sin errores JS')
    console.log('E2E abrir KMZ: el KMZ de Google Earth se abre desde 📁 Ejercicios como ejercicio nuevo con sus AO y sus fichas rojas y azules, guardado; varios KMZ juntos van a un ejercicio; uno sin nada avisa. Sin errores JS.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exit(1) })
