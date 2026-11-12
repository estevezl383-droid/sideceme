// 🟥 Brigada Motorizada y División Motorizada en el Manual Rojo (index-motorizadas-20261111.js), en la Mesa
// real (Chromium). Sergio, 11-nov-2026: «tengo puras brigadas acorazadas; elaborame las plantillas doctrinales
// para brigadas motorizadas».
//   · el selector «Nivel de planeamiento» trae «Brigada Motorizada» y «División Motorizada»;
//   · con cada una, el panel muestra SU organización, el aviso ✎ (la app la ARMA) y no el 📄 del Apéndice 1;
//   · la plantilla acostada sale con sus unidades (batallones/brigadas sobre Piraña, G.A.C., Cía. Mort. 120…)
//     y sin LEOPARD, M109 ni «ACONCAGUA»;
//   · la Brigada Acorazada y la División Acorazada siguen saliendo como antes; sin errores de consola.
//   node calcos/pruebas/e2e/motorizadas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-motorizadas')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')

const leerPlantilla = (page) =>
  estadoReact(page, (v) => (v && v.ok === true && Array.isArray(v.marcas) && Array.isArray(v.bandas) && Array.isArray(v.lineas) ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperarPlantilla(page, cumple, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    const p = await leerPlantilla(page)
    if (p && cumple(p)) return p
    if (Date.now() - t0 > ms) return p
    await page.waitForTimeout(250)
  }
}
const noms = (p) => p.marcas.map((m) => String(m.nom || m.sigla || m.texto || ''))

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const datos = ejercicioPersonal({ nombre: 'PRUEBA MOTORIZADAS (FICT.)' })
  const av = (lat, alReves = false) => {
    const c = []
    for (let lng = -69.0; lng <= -67.6; lng += 0.05) c.push([+lng.toFixed(3), lat])
    return { coords: alReves ? c.reverse() : c, escalon: 'batallon', bando: 'enemigo' }
  }
  datos.cmoc = { restringido: [], severo: [], clave: [], defensivo: [], ae: [], corredores: [], avenidas: [av(-16.95), av(-17.1, true), av(-17.25)], desplazamientos: [] }
  datos.picb = { _pd: { manual: 'rojo', nivel: 'brigada_mot' } }
  try {
    await sembrarYAbrir(page, datos)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-2 INTELIGENCIA/i }).first())
    await page.getByText('🔎 PICB — las 4 fases del G-2').waitFor({ timeout: 15000 })
    await clic(page.getByText('Evaluar la amenaza').first())
    await page.waitForTimeout(400)
    await clic(page.getByText('P.D.', { exact: true }).first())

    // ── El selector ──
    const sel = page.locator('label', { hasText: 'Nivel de planeamiento' }).locator('select')
    await sel.waitFor({ timeout: 10000 })
    const opciones = await sel.locator('option').allTextContents()
    console.log('opciones:', opciones)
    const ids = await sel.locator('option').evaluateAll((os) => os.map((o) => o.value))
    assert.deepEqual(ids, ['regimiento', 'brigada', 'brigada_mot', 'division', 'division_mot', 'cuerpo'])
    assert.ok(opciones.some((o) => /^Brigada Motorizada ✎ — BRIGADA MOTORIZADA de RAGNAR/.test(o)))
    assert.ok(opciones.some((o) => /^División Motorizada ✎ — DIVISIÓN MOTORIZADA de RAGNAR/.test(o)))
    assert.equal(await sel.inputValue(), 'brigada_mot')

    // ── BRIGADA MOTORIZADA ──
    await page.getByText('BRIGADA MOTORIZADA de RAGNAR', { exact: true }).first().waitFor({ timeout: 10000 })
    const txt = await page.locator('body').innerText()
    assert.ok(txt.includes('✎ Ataca con sus Batallones de Infantería sobre MOWAG Piraña'), 'resumen con ✎')
    assert.ok(txt.includes('no trae una Brigada Motorizada: la app la ARMA'), 'aviso de organización armada')
    assert.ok(/BAT\. INF\. MOT\. 1/.test(txt) && /BAT\. INF\. MOT\. 3/.test(txt), 'sus batallones sobre Piraña')
    assert.ok(!txt.includes('a nivel Brigada Motorizada la plantilla se arma con la organización REAL'))
    await page.locator('label', { hasText: 'Nivel de planeamiento' }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(SALIDAS, '1-brigada-mot-panel.png') })

    await clic(page.getByRole('button', { name: /Acostar «/ }).first())
    const pB = await esperarPlantilla(page, (p) => noms(p).some((n) => /PC BRIG\. MOT\./.test(n)))
    console.log('brigada_mot:', noms(pB).join(' | '))
    const nb = noms(pB).join(' | ')
    for (const s of ['BAT. INF. MOT.', 'G.A.C.', 'CÍA. MORT. 120 (PIRAÑA)', 'CÍA. A/B (TOW / SPIKE)', 'CÍA. ING. IND.', 'PEL. EXPL. MOT.', 'PC BRIG. MOT.', 'CÍA. LOG.'])
      assert.ok(nb.includes(s), `brigada motorizada: falta ${s}`)
    for (const s of ['LEOPARD', 'SALVO', 'ACONCAGUA', 'VENCEDORES', 'PC DIV.'])
      assert.ok(!nb.includes(s), `brigada motorizada: no debería tener ${s}`)
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SALIDAS, '2-brigada-mot-carta.png') })
    const tarjeta = page.getByText(/ATAQUE DE PENETRACIÓN EN DOS ESCALONES/).first()
    await tarjeta.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(SALIDAS, '2b-brigada-mot-esquema.png') })

    // ── DIVISIÓN MOTORIZADA ──
    await sel.selectOption('division_mot')
    await page.getByText('DIVISIÓN MOTORIZADA de RAGNAR', { exact: true }).first().waitFor({ timeout: 10000 })
    const txtD = await page.locator('body').innerText()
    assert.ok(txtD.includes('pertenecen a la División Motorizada'), 'aviso con la cita del Apéndice 2')
    assert.ok(/BRIG\. MOT\. 1/.test(txtD), 'sus brigadas motorizadas')
    await page.screenshot({ path: path.join(SALIDAS, '3-division-mot-panel.png') })
    await clic(page.getByRole('button', { name: /Acostar «/ }).first())
    const pD = await esperarPlantilla(page, (p) => noms(p).some((n) => /PC DIV\. MOT\./.test(n)))
    console.log('division_mot:', noms(pD).join(' | '))
    const nd = noms(pD).join(' | ')
    for (const s of ['BRIG. MOT. 1', 'G.A. DIV. 155', 'BAT. SLM RAYO', 'BAT. ING.', 'G. AA.', 'ESC. EXPL. MOT.', 'PC DIV. MOT.', 'REG. LOG. DIV.', 'PLTN. AV.'])
      assert.ok(nd.includes(s), `división motorizada: falta ${s}`)
    for (const s of ['LEOPARD', 'SALVO', 'ACONCAGUA', '1RA. BRIG', 'REG. MOT. REF. 8'])
      assert.ok(!nd.includes(s), `división motorizada: no debería tener ${s}`)
    // La artillería va atrás de lo que apoya (la REGLA DE ORO de la hoja P.D.).
    const lejos = (m) => Number(m.km ?? m.kmDesde ?? NaN)
    const art = pD.marcas.filter((m) => /G\.A\. DIV|RAYO/.test(m.nom || ''))
    console.log('artillería div:', JSON.stringify(art.map((m) => ({ nom: m.nom, km: m.km, kmDesde: m.kmDesde }))))
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SALIDAS, '4-division-mot-carta.png') })

    // ── Las acorazadas, como antes ──
    await sel.selectOption('brigada')
    await page.getByText('1RA. BRIGADA ACORAZADA', { exact: true }).first().waitFor({ timeout: 10000 })
    const txtA = await page.locator('body').innerText()
    assert.ok(txtA.includes('la plantilla se arma con la organización REAL del Apéndice 1'), 'la acorazada sigue con 📄')
    await clic(page.getByRole('button', { name: /Acostar «/ }).first())
    const pA = await esperarPlantilla(page, (p) => noms(p).some((n) => /SALVO/.test(n)))
    assert.ok(noms(pA).join('|').includes('VENCEDORES'), 'la Brigada Acorazada sigue con el Grupo Blindado 9')
    await sel.selectOption('division')
    await page.getByText('DIVISIÓN ACORAZADA de RAGNAR', { exact: true }).first().waitFor({ timeout: 10000 })

    // ── Al Manual de Fuerzas Contrarias: la opción motorizada vuelve a División ──
    await sel.selectOption('division_mot')
    await page.waitForTimeout(300)
    const guardado = await estadoReact(page, (v) => (v && v._pd && typeof v._pd === 'object' ? v._pd.nivel : undefined))
    assert.equal(guardado, 'division_mot', 'la elección queda en la hoja P.D. (picb._pd)')

    const graves = errores.filter((e) => !/favicon|tile|ERR_|net::/i.test(e))
    assert.deepEqual(graves, [], 'sin errores de consola')
    console.log('✅ motorizadas: OK')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
