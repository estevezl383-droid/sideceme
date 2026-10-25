// 📍 En las fases de los CAP se mueven TODAS las fichas propias (index-todas-fichas-20261024.js), en la Mesa real
// (Chromium). El caso de Sergio, con la FASE I del CAP 1 a la vista: «la OC 1, la OC 2, la OD, todas están en sus
// puestos… en la fase I deberían todas las unidades estar con el cuerpo de ejército… en la fase dos desplazarse hacia los
// lugares donde hay trabajos (el plan de barreras)… en la fase 3 donde están ya sus posiciones». Con sus agrupaciones
// desplegadas, el plan de barreras, la LÍM. entre sectores y las fases del CAP 1 armadas antes (sólo se movían las
// divisiones):
//   · el panel avisa qué fichas no se mueven (OD, OC 1, OC 2, RES);
//   · «🎬 Armar las fases» del CAP 1: FASE I todas junto al CE; FASE II la OD y la OC 1 en los trabajos de su sector;
//     FASE III cada una en su puesto; armarlas otra vez con la FASE I a la vista da lo mismo;
//   · CAP 2 (defensa móvil): la OD (piezas de la DIV MEC-2) con el retardo sobre la LDE-1; sin errores de consola.
//   node calcos/pruebas/e2e/todas-fichas.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-todas-fichas')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const posU = (page, id) => estadoReact(page, new Function('v', `return Array.isArray(v) && v.some((u) => u && u.id === 'divmec2' && u.bando) ? (() => { const u = v.find((x) => x.id === '${id}'); return u ? [u.lng, u.lat] : null })() : undefined`))
const km = (a, b) => Math.hypot((a[0] - b[0]) * 105.6, (a[1] - b[1]) * 110.6)
const CE = [-68.4, -18.55]
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

const ag = (id, nom, op, lng, lat, arma, piezas = []) => ({ id, designacion: nom, bando: 'propias', tipo: 'unidad', escalon: 'brigada', arma, lng, lat, agId: 'g-' + id, esAgrupacion: true, agrupacion: true, operacionAg: op, piezasAg: piezas, tareaAg: '', propositoAg: '' })

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const ej = ejercicioConcepto({ nombre: 'PRUEBA TODAS LAS FICHAS CE-I (FICT.)' })
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  ej.ops.limites = [
    { nombre: 'LPR (LF «PUMA»)', coords: [[-68.86, -18.3], [-68.84, -18.9]], co: { id: 'x1', rol: 'lpr' } },
    { nombre: 'LDE-1', coords: [[-69.08, -18.3], [-69.08, -18.9]], tipo: 'punteada', co: { id: 'x2', rol: 'linea' } },
    { nombre: 'EJE CA-1', coords: [[-68.55, -18.62], [-68.86, -18.48]], tipo: 'flecha', co: { id: 'x3', rol: 'eje-ca' } },
    { nombre: 'LÍM. DIV MEC-2 / DIV-1', coords: [[-68.4, -18.59], [-69.1, -18.59]], co: { id: 'x4', rol: 'limite-sector' } },
  ]
  ej.ops.obstaculos = [
    { tipo: 'minado_ac', coords: [[-68.9, -18.44], [-68.9, -18.46]] },
    { tipo: 'zanja_at', centro: [-68.88, -18.4], coords: [[-68.885, -18.4], [-68.875, -18.4]] },
    { tipo: 'concertina', centro: [-68.82, -18.6], coords: [[-68.825, -18.6], [-68.815, -18.6]] },
    { tipo: 'minado_ac', centro: [-68.9, -18.75], coords: [[-68.9, -18.745], [-68.9, -18.755]] },
    { tipo: 'demolicion', centro: [-68.88, -18.8], coords: [[-68.885, -18.8], [-68.875, -18.8]] },
  ]
  ej.g3 = { ...ej.g3, conceptoCarta: { marcas: [
    { tipo: 'esfuerzo', clase: 'principal', texto: 'ESFUERZO PRINCIPAL · DIV MEC-2', centro: [-68.8, -18.47], co: { id: 'm1' } },
    { tipo: 'esfuerzo', clase: 'secundario', texto: 'ESFUERZO SECUNDARIO · DIV-1', centro: [-68.8, -18.78], co: { id: 'm2' } },
    { tipo: 'reserva', texto: 'RES · DIV-6', centro: [-68.55, -18.62], co: { id: 'm3' } },
  ] } }
  // Las agrupaciones de su organización para el combate, desplegadas en sus puestos.
  ej.unidades = [
    ...ej.unidades,
    ag('ag-od', 'OD', 'od', -68.75, -18.45, 'mecanizada', [{ id: 'divmec2-1', de: 'divmec2', madre: 'DIV MEC-2' }]),
    ag('ag-oc1', 'OC 1', 'oc1', -68.75, -18.72, 'infanteria', [{ id: 'div1-1', de: 'div1', madre: 'DIV-1' }]),
    ag('ag-oc2', 'OC 2', 'oc2', -68.8, -18.57, 'infanteria'),
    ag('ag-res', 'RES', 'reserva', -68.5, -18.62, 'artilleria'),
  ]
  // Las fases del CAP 1 que se armaron antes: las divisiones cambian de lugar, las agrupaciones no.
  const mover = (i) => ej.unidades.map((u) => (u.bando === 'propias' && !u.esAgrupacion && u.id !== 'pc-ce' ? { ...u, lng: u.lng + 0.01 * i } : u))
  ej.fasesCOA = { enemigo: [], propio: ['Concentración', 'Desplazamiento', 'Ocupación', 'Conducción', 'Contraataque'].map((nombre, i) => ({ nombre, unidades: mover(i), ops: ej.ops, desplazamientos: [] })) }
  try {
    await sembrarYAbrir(page, ej)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first())
    const panel = page.locator('[data-cap-panel="coa"]')
    await panel.waitFor({ timeout: 10000 })
    await panel.locator('[data-quietas="1"]').waitFor({ timeout: 5000 })
    const aviso = await panel.locator('[data-quietas="1"]').innerText()
    assert.match(aviso, /no se mueven: OD, OC 1, OC 2, RES\./, aviso)
    assert.doesNotMatch(aviso, /DIV MEC-2|CE-I/, 'las que se mueven y la del CE no se nombran')
    await foto('0-aviso')

    // ── Armar las fases del CAP 1 ──
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 1/ }))
    await esperar(page, async () => (await panel.locator('[data-quietas]').count()) === 0 || null, (x) => x)
    assert.equal(await panel.locator('[data-quietas]').count(), 0, 'el aviso se fue')
    const fase = async (n, i) => {
      await clic(panel.locator(`[data-fases-cap="${n}"] button[data-fase="${i}"]`))
      await page.waitForTimeout(400)
    }
    const vista = async (nombre) => {
      await page.evaluate(() => void window.__mapa2d.fitBounds([[-18.95, -69.4], [-18.25, -68.25]]))
      await page.waitForTimeout(600)
      await foto(nombre)
    }
    await fase(1, 1)
    await esperar(page, (p) => posU(p, 'ag-od'), (q) => km(q, CE) <= 6.1)
    for (const id of ['ag-od', 'ag-oc1', 'ag-oc2', 'ag-res', 'divmec2', 'div1', 'div6']) {
      const q = await posU(page, id)
      assert.ok(km(q, CE) <= 6.1, `FASE I: ${id} junto al CE (${q})`)
    }
    await vista('1-cap1-faseI')
    await fase(1, 2)
    const od2 = await esperar(page, (p) => posU(p, 'ag-od'), (q) => km(q, [-68.89, -18.425]) < 1)
    assert.ok(km(od2, [-68.89, -18.425]) < 1, `FASE II: la OD en los trabajos del norte (${od2})`)
    const oc12 = await posU(page, 'ag-oc1')
    assert.ok(km(oc12, [-68.867, -18.717]) < 1, `FASE II: la OC 1 en los del sur (${oc12})`)
    await vista('2-cap1-faseII')
    await fase(1, 3)
    assert.deepEqual(await esperar(page, (p) => posU(p, 'ag-od'), (q) => q[0] === -68.75), [-68.75, -18.45], 'FASE III: la OD en su puesto')
    assert.deepEqual(await posU(page, 'ag-oc1'), [-68.75, -18.72])
    assert.deepEqual(await posU(page, 'ag-oc2'), [-68.8, -18.57])
    await vista('3-cap1-faseIII')
    await fase(1, 5)
    const res5 = await esperar(page, (p) => posU(p, 'ag-res'), (q) => q[0] < -68.8)
    assert.ok(km(res5, [-68.86, -18.48]) < 2, `FASE V: la RES contraataca por el EJE CA-1 (${res5})`)
    await vista('4-cap1-faseV')

    // Otra vez, con la FASE I a la vista: los puestos no se pierden.
    await fase(1, 1)
    await esperar(page, (p) => posU(p, 'ag-od'), (q) => km(q, CE) <= 6.1)
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 1/ }))
    await page.waitForTimeout(600)
    await fase(1, 3)
    assert.deepEqual(await esperar(page, (p) => posU(p, 'ag-od'), (q) => q[0] === -68.75), [-68.75, -18.45], 'armadas de nuevo: la OD sigue en su puesto')
    assert.deepEqual(await posU(page, 'ag-oc2'), [-68.8, -18.57])

    // ── CAP 2: la OD (piezas de la DIV MEC-2) con el retardo sobre la LDE-1 ──
    await clic(panel.locator('button[data-cap="2"]'))
    await panel.getByText('● CAP 2 · Defensa móvil').waitFor({ timeout: 5000 })
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 2/ }))
    await panel.locator('[data-fases-cap="2"] button[data-fase="3"]').waitFor({ timeout: 5000 })
    await fase(2, 3)
    const od3 = await esperar(page, (p) => posU(p, 'ag-od'), (q) => Math.abs(q[0] - -69.08) < 0.03)
    assert.ok(Math.abs(od3[0] - -69.08) < 0.03, `CAP 2 · FASE III: la OD con el retardo sobre la LDE-1 (${od3})`)
    assert.deepEqual(await posU(page, 'ag-oc1'), [-68.75, -18.72], 'la OC 1 en su puesto')
    await vista('5-cap2-faseIII')

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e todas las fichas: el aviso de las que no se mueven, FASE I todas con el CE, FASE II a los trabajos de su sector, FASE III a su puesto (también armadas de nuevo), la OD con el retardo del CAP 2')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
