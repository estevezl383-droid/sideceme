// ⚔️ El evento crítico de la F4·P6-7 Matriz de sincronización (index-evento-critico-20261025.js), en la Mesa real
// (Chromium). Sergio, 25-10-2026: que en la Matriz de sincronización salga «el evento más crítico», donde se carguen la
// fase del enemigo ROJO del G-2 y la del G-3 «para que se enfrenten», guardadas y listas para el Juego de Guerra.
// Con el CE-I (FICT.) y sus 3 fases 🔵, el CAE más probable (4 fases 🔴) y el más peligroso (2):
//   · el panel está arriba de la F4·P6-7 (y no en otras hojas), con cada fase 🔵 frente a la 🔴 del mismo orden y la ⭐
//     en la más crítica (la FASE III, en contacto);
//   · cambiar la 🔴 de una fase, 💾 guardarla (g3.sincro._evento), 📝 anotarla en la matriz (sólo lo vacío);
//   · ⬇️ el .json para el Juego: el ejercicio entero con `eventoCritico` (azules de la 🔵 y rojas de la 🔴);
//   · el más peligroso; sin errores de consola.
//   node calcos/pruebas/e2e/evento-critico.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-evento-critico')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerSincro = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.sincro && typeof v.sincro === 'object' ? JSON.parse(JSON.stringify(v.sincro)) : undefined))
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

function ejercicio() {
  const ej = ejercicioConcepto({ nombre: 'PRUEBA EVENTO CRITICO CE-I (FICT.)', conTexto: false })
  const propias = ej.unidades.filter((u) => u.bando === 'propias')
  const enemigas = ej.unidades.filter((u) => u.bando === 'enemigas')
  const mover = (us, dx) => us.map((u) => ({ ...u, lng: u.lng + dx }))
  // Las fases 🔵 (sin rojas, como las guarda la Mesa): I con el CE, II a medio camino, III adelante.
  ej.fasesCOA.propio = [
    { nombre: 'Concentración', tarea: 'Concentrar el CE-I', unidades: mover(propias, 0.25), ops: {} },
    { nombre: 'Desplazamiento', unidades: mover(propias, 0), ops: {} },
    { nombre: 'Ocupación de la posición', tarea: 'Ocupar las posiciones', proposito: 'para detener al enemigo antes de la LPR', unidades: mover(propias, -0.2), ops: {} },
  ]
  // Las 🔴: el enemigo avanza del oeste (con los azules donde estaban al armarlas).
  const fasesR = (coa, avances) => avances.map((dx, i) => ({ coa, n: i + 1, nombre: ['Ramificación', 'Apresto lejano', 'Ataque propiamente tal', 'Explotación'][i], tarea: i === 2 ? 'ATACAR y ROMPER la primera posición defensiva' : '', unidades: [...propias, ...mover(enemigas, dx)] }))
  ej.fasesCOA.enemigo = [...fasesR('probable', [-0.3, 0, 0.35, 0.5]), ...fasesR('peligroso', [-0.2, 0.4])]
  ej.g3 = { ...(ej.g3 || {}), sincro: { 'MANIOBRA|FASE I': 'Lo escribió el oficial' } }
  return ej
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1500, alto: 950 })
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push(d.message())
    d.accept()
  })
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await sembrarYAbrir(page, ejercicio())
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Analizar los cursos de acción/ }).first())
    // En otra hoja de la fase no está.
    await clic(page.getByRole('button', { name: /F4·P4.*Eventos críticos/ }).first())
    await page.waitForTimeout(400)
    assert.equal(await page.locator('[data-evento-critico]').count(), 0, 'sólo en la Matriz de sincronización')
    await clic(page.getByRole('button', { name: /Volver a mis documentos/ }).first())
    const fase4 = page.getByRole('button', { name: /Analizar los cursos de acción/ })
    if (!(await page.getByRole('button', { name: /F4·P6-7.*Matriz de sincronización/ }).count())) await clic(fase4.first())
    await clic(page.getByRole('button', { name: /F4·P6-7.*Matriz de sincronización/ }).first())
    const panel = page.locator('[data-evento-critico]')
    await panel.waitFor({ timeout: 10000 })
    const txt = await panel.innerText()
    assert.match(txt, /Evento crítico para el Juego de Guerra/)
    assert.match(txt, /CAE más probable/)
    assert.match(txt, /CAE más peligroso/)
    const filas = panel.locator('[data-ev-fila]')
    assert.equal(await filas.count(), 3, 'las 3 fases 🔵')
    // Cada fase 🔵 con la 🔴 del mismo orden; la ⭐ en la FASE III (en contacto).
    assert.deepEqual(await filas.locator('select').evaluateAll((s) => s.map((x) => x.value)), ['0', '1', '2'])
    assert.match(await filas.nth(2).innerText(), /^⭐ 🔵 CAP 1 · FASE III — Ocupación de la posición/)
    assert.match(await filas.nth(2).innerText(), /unidad\(es\) enemiga\(s\) a menos de 15 km/)
    assert.doesNotMatch(await filas.nth(0).innerText(), /⭐/)
    await panel.scrollIntoViewIfNeeded()
    await foto('1-panel')

    // 💾 Guardar el más crítico (el elegido de entrada).
    await clic(panel.locator('[data-ev="guardar"]'))
    let s = await esperar(page, leerSincro, (v) => !!v._evento)
    assert.deepEqual({ ...s._evento, t: 0 }, { cap: 1, azul: 2, rojo: 2, coa: 'probable', t: 0 })
    assert.equal(s['MANIOBRA|FASE I'], 'Lo escribió el oficial')
    await panel.getByText('💾 Guardado ✓').waitFor({ timeout: 5000 })

    // Otra 🔴 para la FASE II: la FASE IV del CAE (explotación) y guardarla.
    await filas.nth(1).locator('select').selectOption('3')
    await clic(panel.locator('[data-ev="guardar"]'))
    s = await esperar(page, leerSincro, (v) => v._evento && v._evento.azul === 1)
    assert.deepEqual([s._evento.azul, s._evento.rojo], [1, 3])
    // Vuelvo al más crítico y lo anoto en la matriz: la columna FASE III, sólo lo vacío.
    await clic(filas.nth(2))
    await clic(panel.locator('[data-ev="anotar"]'))
    s = await esperar(page, leerSincro, (v) => !!v['MANIOBRA|FASE III'])
    assert.match(s['MANIOBRA|FASE III'], /^EVENTO CRÍTICO: CAP 1 · FASE III — Ocupación de la posición contra CAE más probable · FASE III — Ataque propiamente tal\. Tarea: Ocupar las posiciones/)
    assert.match(s['INTELIGENCIA|FASE III'], /ATACAR y ROMPER la primera posición defensiva con 1ª BR\. AC\. «CORACEROS», GAAP N° 4/)
    assert.equal(s['MANIOBRA|FASE I'], 'Lo escribió el oficial')
    assert.deepEqual([s._evento.azul, s._evento.rojo], [2, 2])
    await panel.getByText('📝 Anotado en la columna «FASE III»: 2 casilla(s)', { exact: false }).waitFor({ timeout: 5000 })
    await foto('2-anotado')

    // ⬇️ El archivo para el Juego de Guerra.
    const [descarga] = await Promise.all([page.waitForEvent('download'), clic(panel.locator('[data-ev="bajar"]'))])
    assert.match(descarga.suggestedFilename(), /^JUEGO_GUERRA_PRUEBA_EVENTO_CRITICO_CE-I_FICT_evento_critico_\d{8}_\d{4}\.json$/)
    const d = JSON.parse(fs.readFileSync(await descarga.path(), 'utf8'))
    assert.equal(d.nombre, 'PRUEBA EVENTO CRITICO CE-I (FICT.)')
    assert.ok(d.cmoc && d.ops && d.fasesCOA.propio.length === 3, 'el ejercicio entero')
    assert.equal(d.eventoCritico.nombre, 'EVENTO CRÍTICO — CAP 1 · FASE III — Ocupación de la posición contra CAE más probable · FASE III — Ataque propiamente tal')
    const ev = d.eventoCritico.unidades
    assert.equal(ev.filter((u) => u.bando === 'propias').length, 6)
    assert.equal(ev.filter((u) => u.bando === 'enemigas').length, 2)
    assert.equal(ev.find((u) => u.id === 'div1').lng, -68.9, 'los azules donde están en la FASE III 🔵')
    assert.equal(ev.find((u) => u.id === 'e-br1').lng, -69, 'los rojos donde están en la FASE III 🔴')
    assert.equal(d.g3.sincro._evento.rojo, 2)
    fs.writeFileSync(path.join(SALIDAS, 'juego-guerra.json'), JSON.stringify(d))
    await panel.getByText(/Bajado/).waitFor({ timeout: 5000 })

    // Contra el más peligroso (2 fases): alineadas por el final, la FASE III 🔵 con su última (la II).
    await clic(panel.getByRole('button', { name: 'CAE más peligroso' }))
    await page.waitForTimeout(300)
    assert.deepEqual(await filas.locator('select').evaluateAll((x) => x.map((e) => e.value)), ['4', '4', '5'])
    await foto('3-peligroso')

    assert.deepEqual(dialogos, [])
    assert.deepEqual(errores, [])
    console.log('OK — evento crítico en la Mesa')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
