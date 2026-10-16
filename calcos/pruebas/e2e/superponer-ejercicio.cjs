// 🧩 La Mesa real en Chromium (16-10-2026): lo cargado en Superponer se ve sólo en SU ejercicio.
// Lo pidió Sergio con las capturas del corte de CE-VI: cortó la parte de arriba de FABBLE 1.1, abrió
// el JSON como ejercicio nuevo y abajo seguía el polígono «AO CE-I», que no era del corte sino un
// archivo cargado antes en 🧩 Superponer (el navegador se lo acuerda y lo mostraba en cualquier
// ejercicio). «Lo que quiero es cortar y que quede la parte que quiero»: eligió que se apague solo.
//   · Lo cargado con un ejercicio abierto se ve en ese ejercicio; al abrir otro se apaga solo (avisa)
//     y sigue en el tablero para prenderlo a mano; al volver a su ejercicio se prende otra vez.
//   · Lo que estaba cargado de antes (sin ejercicio, el caso de Sergio) se apaga al abrir uno.
//   · Prender o apagar a mano vale para el ejercicio abierto, también después de recargar la página.
// Capturas en pruebas/salidas-superponer/.
//   node calcos/pruebas/e2e/superponer-ejercicio.cjs
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-superponer')
const BOTON_EJ = 'button[title="Crear, abrir y guardar ejercicios"]'
const CLAVE = 'sid_superponer_v1'

// El Cuerpo de abajo (el «AO CE-I» de la captura) y el área que se corta (CE-VI, arriba).
const ABAJO = [[-65.1, -17.05], [-65.0, -17.05], [-65.0, -17.1], [-65.1, -17.1]]
const archivoAreas = (nombre, origen) => ({ tipoArchivo: 'sideceme-areas-operaciones', version: 1, ejercicioOrigen: origen,
  areas: [{ id: `ao-${nombre}`, nombre, unidad: nombre, coords: ABAJO }] })
// Lo que quedó guardado en el navegador por una versión anterior: sin ejercicio.
const viejo = { conf: { escala: 1.5, rotulos: 'auto', compacto: true }, capas: [{ id: 'c-viejo', nombre: 'Áreas de operaciones · FABBLE 1.1', visible: true, opac: 1,
  grupos: [{ id: 'ao', nombre: 'Áreas de operaciones (1)', visible: true, elementos: [{ tipo: 'area', coords: ABAJO.map(p => [p[1], p[0]]), rotulo: 'AO CE-I', sub: 'CE-I', color: '#4f9cf0' }] }] }] }

async function seleccionCeVI() {
  const { paqueteAreas } = await import('../../areas-operaciones/modelo.mjs')
  const origen = ejercicioFicticio({ conPlantilla: false })
  const ops = { ...origen.ops, areaOps: { ...origen.ops.areaOps, id: 'ao-ce6', nombre: 'CE-VI', unidad: 'CE-VI', escalon: 'cuerpo' } }
  const p = paqueteAreas(ops, ['ao-ce6'], 'FABBLE abierto', { unidades: origen.unidades, enemigo: true })
  p.seleccion = { nombre: 'CE-VI', guardada: '2026-10-16T12:26:51.870Z', tijera: true }
  return p
}

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const abierto = ejercicioFicticio({ conPlantilla: false }); abierto.nombre = 'FABBLE abierto'
  const seleccion = Buffer.from(JSON.stringify(await seleccionCeVI()))
  // El tablero viejo se siembra una sola vez (al recargar queda lo que guardó la página).
  const { page, errores, cerrar } = await abrir({ preparar: p => p.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v) }, [CLAVE, JSON.stringify(viejo)]) })
  page.on('dialog', d => d.accept(d.defaultValue()))
  const capas = () => page.evaluate(() => window.SIDSuperponer.capas().map(c => ({ id: c.id, nombre: c.nombre, visible: c.visible, ejercicios: c.ejercicios || null })))
  // Los polígonos de Superponer que están en la carta 2D (se pintan en canvas: se cuentan las capas).
  const trazos = () => page.evaluate(() => { let n = 0; window.__mapa2d.eachLayer(l => { if (l.options?.pane === 'sidSupArea' && l.getLatLngs) n++ }); return n })
  const capa = async nombre => (await capas()).find(c => c.nombre === nombre)
  const esperar = async (fn, que) => {
    for (let i = 0; i < 40; i++) { if (await fn()) return; await page.waitForTimeout(250) }
    throw new Error(`no pasó: ${que} · ${JSON.stringify(await capas())}`)
  }
  const enEjercicio = n => page.waitForFunction(([s, n]) => [...document.querySelectorAll(s)].some(b => b.textContent.includes(n)), [BOTON_EJ, n])
  const abrirGuardado = async nombre => {
    await page.locator(BOTON_EJ).first().dispatchEvent('click')
    await page.getByRole('button', { name: 'Abrir guardados' }).dispatchEvent('click')
    await page.waitForTimeout(600)
    const fila = page.locator('div', { hasText: nombre }).filter({ has: page.getByRole('button', { name: 'Abrir' }) }).last()
    await fila.getByRole('button', { name: 'Abrir' }).dispatchEvent('click')
    await enEjercicio(nombre)
  }
  const tablero = async si => {
    const abiertoYa = await page.locator('section.sidsup').isVisible()
    if (abiertoYa !== si) await page.locator('button.sidsup-btn').dispatchEvent('click')
  }
  const prender = (id, si) => page.evaluate(([id, si]) => {
    const t = document.querySelector(`.sidsup-capa[data-c="${id}"] input[data-a="ver"]`)
    t.checked = si; t.dispatchEvent(new Event('change', { bubbles: true }))
  }, [id, si])
  try {
    // 1 · El caso de Sergio: lo que estaba cargado de antes (sin ejercicio) se apaga al abrir uno.
    assert.equal((await capa(viejo.capas[0].nombre)).visible, true, 'al entrar se ve, como antes')
    await sembrarYAbrir(page, abierto)
    await enEjercicio('FABBLE abierto')
    await esperar(async () => !(await capa(viejo.capas[0].nombre)).visible, 'la capa vieja se apaga al abrir un ejercicio')
    assert.equal(await trazos(), 0, 'no queda nada dibujado encima de la carta')
    await page.locator('.sidsup-aviso', { hasText: 'otro ejercicio' }).first().waitFor()
    await tablero(true)
    assert.equal(await page.locator(`.sidsup-capa[data-c="c-viejo"] input[data-a="ver"]`).isChecked(), false, 'sigue en el tablero, apagada')
    await page.screenshot({ path: path.join(SALIDAS, '1-vieja-apagada.png') })

    // 2 · Se carga un archivo con «FABBLE abierto»: se ve ahí.
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.locator('[data-a="cargar"]').click()])
    await selector.setFiles({ name: 'AO_FABBLE.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(archivoAreas('CE-I', 'FABBLE abierto'))) })
    await esperar(async () => !!(await capa('Áreas de operaciones · FABBLE abierto')), 'se carga el archivo')
    const nueva = await capa('Áreas de operaciones · FABBLE abierto')
    assert.equal(nueva.visible, true)
    assert.deepEqual(nueva.ejercicios, ['FABBLE abierto'], 'queda anotada con el ejercicio donde se cargó')
    assert.ok(await trazos() > 0, 'se dibuja encima de la carta')
    await tablero(false)

    // 3 · Se corta y se abre el JSON como ejercicio nuevo: queda sólo lo cortado.
    await page.locator(BOTON_EJ).first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
    const [sel2] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: '📂 Abrir archivo JSON (selección, áreas o ejercicio)' }).click()])
    await sel2.setFiles({ name: 'Seleccion_CE-VI.json', mimeType: 'application/json', buffer: seleccion })
    await enEjercicio('CE-VI')
    await esperar(async () => !(await capa(nueva.nombre)).visible, 'la capa de FABBLE se apaga en CE-VI')
    assert.equal((await capa(viejo.capas[0].nombre)).visible, false)
    assert.equal(await trazos(), 0, 'en CE-VI no queda nada de Superponer encima')
    await page.screenshot({ path: path.join(SALIDAS, '2-ce-vi-solo-lo-cortado.png') })

    // 4 · Al volver a FABBLE se prende sola la suya; la vieja sigue apagada.
    await abrirGuardado('FABBLE abierto')
    await esperar(async () => (await capa(nueva.nombre)).visible, 'la capa se prende otra vez en su ejercicio')
    assert.equal((await capa(viejo.capas[0].nombre)).visible, false)
    assert.ok(await trazos() > 0)

    // 5 · A mano: la vieja se prende en FABBLE y la nueva se apaga; vale después de recargar.
    await tablero(true)
    await prender('c-viejo', true)
    await prender(nueva.id, false)
    assert.deepEqual((await capa(viejo.capas[0].nombre)).ejercicios, ['FABBLE abierto'])
    assert.deepEqual((await capa(nueva.nombre)).ejercicios, [])
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    await abrirGuardado('FABBLE abierto')
    await page.waitForTimeout(2000)
    assert.equal((await capa(viejo.capas[0].nombre)).visible, true, 'la que se prendió a mano sigue prendida en FABBLE')
    assert.equal((await capa(nueva.nombre)).visible, false, 'la que se apagó a mano sigue apagada')
    await abrirGuardado('CE-VI')
    await esperar(async () => !(await capa(viejo.capas[0].nombre)).visible, 'en CE-VI se apaga')
    assert.equal(await trazos(), 0)
    assert.deepEqual(errores, [])
    console.log('E2E superponer por ejercicio: lo cargado en 🧩 Superponer se ve sólo en su ejercicio; al abrir el JSON del corte (CE-VI) se apaga solo con aviso y queda sólo lo cortado; lo cargado de antes (sin ejercicio) también se apaga; al volver se prende; lo prendido o apagado a mano se respeta después de recargar. Sin errores JS.')
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error('DIAGNOSTICO', errores)
    throw e
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
