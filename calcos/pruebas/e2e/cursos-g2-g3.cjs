const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact, leerGuardado, entrar3D, salir3D } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const out = path.resolve(__dirname, '../salidas-cursos-g2-g3')
fs.mkdirSync(out, { recursive: true })
const activa = p => estadoReact(p, v => v && ['enemigo', 'propio'].includes(v.bando) && Number.isInteger(v.idx) ? v : undefined)
const fases = p => estadoReact(p, v => v && Array.isArray(v.enemigo) && Array.isArray(v.propio) ? v : undefined)
const g3 = p => estadoReact(p, v => v?._caps ? v : undefined)
async function esperar(p, leer, cumple) {
  for (let i = 0; i < 80; i++) {
    const v = await leer(p)
    if (cumple(v)) return v
    await p.waitForTimeout(100)
  }
  assert.fail('No apareció el estado esperado')
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1100 })
  page.on('dialog', d => d.accept())
  try {
    const e = ejercicioFicticio({ conPlantilla: false })
    e.nombre = 'CURSOS G-2 Y G-3 (FICT.)'
    const azul = { ...e.unidades[0], id: 'azul-prueba', designacion: 'AZUL FICTICIO', lng: -65.05, lat: -17.01 }
    const rojo = { ...azul, id: 'rojo-prueba', designacion: 'ROJO FICTICIO', bando: 'enemigo' }
    const ops = n => ({ ...e.ops, limites: [{ coords: [[-65.08, -17.01 - n * .001], [-65.02, -17.01 - n * .001]], tipo: 'simple' }],
      obstaculos: [{ tipo: 'concertina', estado: 'proyectado', coords: [[-65.065, -17.025 - n * .001], [-65.04, -17.025 - n * .001]] }] })
    const plan = (id, lng) => ({ blancos: [{ id, designacion: id, lng, lat: -17.02, tipo: 'concentracion', forma: 'punto' }], medios: {} })
    const propios = [
      { nombre: 'CAP 1 apertura', unidades: [azul], ops: ops(1), plan: plan('FUEGO-CAP1', -65.045), contra: 0 },
      { nombre: 'CAP 1 sin fuegos', unidades: [{ ...azul, lng: -65.035 }], ops: ops(2) }
    ]
    const guardadas = [
      { nombre: 'CAP 2 apertura', unidades: [{ ...azul, lng: -65.025 }], ops: ops(3), plan: plan('FUEGO-CAP2', -65.025) },
      { nombre: 'CAP 2 avance', unidades: [{ ...azul, lng: -65.015 }], ops: ops(4), plan: plan('FUEGO-CAP2-II', -65.015) }
    ]
    e.unidades = [azul, rojo]
    e.fasesCOA = { enemigo: ['probable', 'peligroso'].flatMap((coa, c) => Array.from({ length: 4 }, (_, i) => ({
      coa, nombre: `${coa} ${i + 1}`, unidades: [{ ...rojo, lng: -65.06 + (c * 4 + i) * .004 }], ops: ops(i), desplazamientos: []
    }))), propio: propios }
    e.g3 = { _caps: { activo: 1, guardados: { 2: { fases: guardadas } } } }
    await sembrarYAbrir(page, e)
    const lista = page.locator('.bloque-ver')
    await lista.getByRole('button', { name: '🔎 Producto del G-2 (paso 4)', exact: true }).click()
    const probable = lista.getByRole('region', { name: 'CAE más probable', exact: true })
    const peligroso = lista.getByRole('region', { name: 'CAE más peligroso', exact: true })
    assert.equal(await probable.getByRole('button', { name: /^Fase / }).count(), 4)
    assert.equal(await peligroso.getByRole('button', { name: /^Fase / }).count(), 4)
    await probable.getByRole('button', { name: 'Fase 2 · probable 2', exact: true }).click()
    await esperar(page, activa, v => v?.bando === 'enemigo' && v.idx === 1)
    await peligroso.getByRole('button', { name: 'Fase 3 · peligroso 3', exact: true }).click()
    await esperar(page, activa, v => v?.bando === 'enemigo' && v.idx === 6)
    const antes = await fases(page)
    await peligroso.getByRole('button', { name: 'Ocultar CAE más peligroso', exact: true }).click()
    const ocultas = await estadoReact(page, v => v && typeof v.cae === 'boolean' ? v : undefined)
    assert.equal(ocultas.cae, false)
    assert.deepEqual(await fases(page), antes)
    await peligroso.getByRole('button', { name: 'Mostrar CAE más peligroso', exact: true }).click()
    assert.equal((await activa(page)).idx, 6)
    await lista.getByRole('button', { name: 'Ocultar el grupo 🔎 Producto del G-2 (paso 4)', exact: true }).click()
    assert.equal((await estadoReact(page, v => v && typeof v.cae === 'boolean' ? v : undefined)).cae, false)

    const panel = lista.getByRole('region', { name: 'G-3 · fase 4 · Cursos de acción propios', exact: true })
    const botonGrupo = panel.getByRole('button', { name: '🔵 G-3 · fase 4 · Cursos de acción propios', exact: true })
    assert.equal(await botonGrupo.getAttribute('aria-expanded'), 'false')
    await botonGrupo.click()
    const cap1 = panel.getByRole('region', { name: 'CAP 1', exact: true })
    const cap2 = panel.getByRole('region', { name: 'CAP 2', exact: true })
    await cap1.getByRole('button', { name: 'Fase 1 · CAP 1 apertura', exact: true }).click()
    await esperar(page, activa, v => v?.bando === 'propio' && v.idx === 0)
    await page.waitForFunction(() => window.MesaFuegos?.plan?.blancos?.[0]?.id === 'FUEGO-CAP1')
    await page.waitForSelector('.pf-marca')
    const datosPlan = await page.evaluate(() => window.MesaFuegos.plan)
    await panel.getByRole('button', { name: 'Ocultar Plan de fuegos', exact: true }).click()
    await page.waitForFunction(() => document.querySelectorAll('.pf-marca').length === 0)
    assert.deepEqual(await page.evaluate(() => window.MesaFuegos.plan), datosPlan)
    await panel.getByRole('button', { name: 'Mostrar Plan de fuegos', exact: true }).click()
    await page.waitForSelector('.pf-marca')

    const opsAntes = await estadoReact(page, v => v && Array.isArray(v.obstaculos) && Array.isArray(v.limites) ? v : undefined)
    const barrerasEnMapa = () => page.evaluate(lat => Object.values(window.__mapa2d._layers).filter(l => {
      try { return l.toGeoJSON && JSON.stringify(l.toGeoJSON().geometry.coordinates).includes(String(lat)) } catch { return false }
    }).length, opsAntes.obstaculos[0].coords[0][1])
    assert.ok(await barrerasEnMapa() > 0, 'el obstáculo está dibujado')
    await panel.getByRole('button', { name: 'Ocultar Plan de barreras', exact: true }).click()
    assert.equal(await barrerasEnMapa(), 0, 'el ojo retira el obstáculo de la carta')
    assert.deepEqual(await estadoReact(page, v => v && Array.isArray(v.obstaculos) && Array.isArray(v.limites) ? v : undefined), opsAntes)
    await panel.getByRole('button', { name: 'Mostrar Plan de barreras', exact: true }).click()
    assert.ok(await barrerasEnMapa() > 0, 'el ojo vuelve a dibujar el obstáculo')
    await cap1.getByRole('button', { name: 'Fase 2 · CAP 1 sin fuegos', exact: true }).click()
    await esperar(page, activa, v => v?.bando === 'propio' && v.idx === 1)
    await page.waitForFunction(() => !window.MesaFuegos.plan?.blancos?.length)
    await cap1.getByRole('button', { name: 'Ocultar CAP 1', exact: true }).click()
    await cap1.getByRole('button', { name: 'Mostrar CAP 1', exact: true }).click()
    assert.equal((await activa(page)).idx, 1, 'mostrar el CAP conserva la fase seleccionada')

    await cap2.getByRole('button', { name: 'Fase 2 · CAP 2 avance', exact: true }).click()
    await esperar(page, g3, v => v?._caps.activo === 2)
    await esperar(page, activa, v => v?.bando === 'propio' && v.idx === 1)
    await page.waitForFunction(() => window.MesaFuegos.plan?.blancos?.[0]?.id === 'FUEGO-CAP2-II')
    assert.equal((await g3(page))._caps.guardados[1].fases.length, 2)
    await cap1.getByRole('button', { name: 'Fase 1 · CAP 1 apertura', exact: true }).click()
    await esperar(page, g3, v => v?._caps.activo === 1)
    await esperar(page, activa, v => v?.bando === 'propio' && v.idx === 0)
    await page.waitForFunction(() => window.MesaFuegos.plan?.blancos?.[0]?.id === 'FUEGO-CAP1')

    await entrar3D(page)
    await panel.getByRole('button', { name: 'Ocultar el grupo 🔵 G-3 · fase 4 · Cursos de acción propios', exact: true }).click()
    await page.waitForFunction(() => document.querySelectorAll('.pf-marca').length === 0)
    await esperar(page, p => estadoReact(p, v => v && typeof v.cap === 'boolean' && typeof v.planFuegos === 'boolean' ? v : undefined), v => v?.cap === false && v.planBarreras === false && v.planFuegos === false)
    await panel.getByRole('button', { name: 'Mostrar el grupo 🔵 G-3 · fase 4 · Cursos de acción propios', exact: true }).click()
    await page.waitForSelector('.pf-marca')
    await salir3D(page)

    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
    const guardado = await esperar(page, p => leerGuardado(p, e.nombre), v => v?.g3?._caps?.guardados?.[2]?.fases?.length === 2)
    assert.equal(guardado.fasesCOA.enemigo.length, 8)
    assert.equal(guardado.fasesCOA.propio[0].plan.blancos[0].id, 'FUEGO-CAP1')
    assert.equal(guardado.g3._caps.guardados[2].fases[1].plan.blancos[0].id, 'FUEGO-CAP2-II')
    await page.screenshot({ path: path.join(out, 'cursos-g2-g3.png'), fullPage: false })
    assert.deepEqual(errores, [])
    console.log('OK: dos CAE por fases, dos CAP, fuegos propios por fase, barreras y ojos por grupo; guardado intacto y 2D/3D.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
