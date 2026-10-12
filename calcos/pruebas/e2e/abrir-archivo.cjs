// 📂 La Mesa real en Chromium (12-10-2026): el JSON que bajó la Mesa se abre con 📁 Ejercicios →
// «📂 Abrir archivo JSON». La selección guardada (Seleccion_CE-I.json) queda como ejercicio NUEVO
// «CE-I» con su área, lo de adentro, las fichas y el CMOC, la carta va a su área y el ejercicio que
// estaba abierto no se toca. Si «CE-I» ya existe propone «CE-I (2)»; un JSON roto o ajeno avisa en
// la ventana; el EJERCICIO_….json abre el ejercicio entero. Capturas en pruebas/salidas-abrir/.
//   node calcos/pruebas/e2e/abrir-archivo.cjs
//   ARCHIVO_SELECCION=/ruta/Seleccion_X.json node calcos/pruebas/e2e/abrir-archivo.cjs  (con un JSON real)
const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, estadoReact, leerGuardado } = require('./navegador')
const { ejercicioFicticio, unidad } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-abrir')
const leerOps = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.limites) && 'areaOps' in v ? v : undefined)
const leerCmoc = page => estadoReact(page, v => v && !Array.isArray(v) && Array.isArray(v.ae) && Array.isArray(v.restringido) ? v : undefined)
const leerFichas = page => estadoReact(page, v => Array.isArray(v) && v.length && v.every(u => u && typeof u === 'object' && 'lat' in u && 'lng' in u && 'bando' in u) ? v : undefined)
const ejercicioAbierto = page => page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().innerText()

// La selección «CE-I» de un FABBLE ficticio, como la baja «⬇️ JSON» de «Selecciones guardadas».
async function seleccionFicticia() {
  const { paqueteAreas } = await import('../../areas-operaciones/modelo.mjs')
  const origen = ejercicioFicticio({ conPlantilla: false })
  const ops = { ...origen.ops, areaOps: { ...origen.ops.areaOps, id: 'ao-ce1', nombre: 'CE-I', unidad: 'CE-I', escalon: 'cuerpo' },
    limites: [{ coords: [[-65.066, -16.975], [-65.066, -17.055]], escalon: 'cuerpo', tipo: 'magnitud' }],
    coordinacion: [{ centro: [-65.066, -16.98] }] }
  const cmoc = { ae: [{ coords: [[-65.02, -17.005], [-65.008, -17.005], [-65.008, -17.015], [-65.02, -17.015]], centro: [-65.014, -17.01] }] }
  const unidades = [...origen.unidades, { ...unidad('fict-rojo', 'R.I. «ROJO» (FICT.)', 'infanteria', 'regimiento', -16.99, -65.015), bando: 'enemigo' }]
  const p = paqueteAreas(ops, ['ao-ce1'], 'FABBLE de prueba', { unidades, enemigo: true, cmoc, capasCmoc: ['ae'] })
  p.seleccion = { nombre: 'CE-I', guardada: '2026-10-11T23:48:04.825Z' }
  return p
}

;(async () => {
  fs.mkdirSync(SALIDAS, { recursive: true })
  const real = process.env.ARCHIVO_SELECCION
  const paquete = real ? JSON.parse(fs.readFileSync(real, 'utf8')) : await seleccionFicticia()
  const archivo = real ? path.basename(real) : 'Seleccion_CE-I.json'
  const nombre = paquete.seleccion?.nombre || paquete.areas[0].nombre
  const bytes = Buffer.from(JSON.stringify(paquete, null, 2))
  const abierto = ejercicioFicticio({ conPlantilla: false }); abierto.nombre = 'FABBLE abierto'
  const { page, errores, cerrar } = await abrir()
  // Cada window.prompt: se anota el nombre propuesto y se contesta con `respuesta` (null = Cancelar).
  const dialogos = []
  let respuesta
  page.on('dialog', d => { dialogos.push({ tipo: d.type(), mensaje: d.message(), propuesto: d.defaultValue() }); return respuesta === null ? d.dismiss() : d.accept(respuesta ?? d.defaultValue()) })
  const ventana = async () => {
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.getByRole('heading', { name: '📁 Ejercicios' }).waitFor()
  }
  const elegir = async (nombreArchivo, contenido, pestaña = 'Actual') => {
    if (pestaña !== 'Actual') await page.getByRole('button', { name: pestaña }).dispatchEvent('click')
    const boton = page.getByRole('button', { name: '📂 Abrir archivo JSON (selección, áreas o ejercicio)' })
    const [selector] = await Promise.all([page.waitForEvent('filechooser'), boton.click()])
    await selector.setFiles({ name: nombreArchivo, mimeType: 'application/json', buffer: contenido })
  }
  try {
    await sembrarYAbrir(page, abierto)

    // 1 · El botón está en 📁 Ejercicios y abre la selección como ejercicio nuevo, con su nombre.
    await ventana()
    await page.screenshot({ path: path.join(SALIDAS, '1-ventana.png') })
    await elegir(archivo, bytes)
    await page.waitForFunction(n => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some(b => b.textContent.includes(n)), nombre)
    await page.waitForTimeout(1200)
    assert.equal(dialogos.length, 1); assert.equal(dialogos[0].tipo, 'prompt')
    assert.equal(dialogos[0].propuesto, nombre, 'propone el nombre de la selección')
    assert.match(dialogos[0].mensaje, /como ejercicio NUEVO/)
    assert.match(await ejercicioAbierto(page), new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    const ops = await leerOps(page)
    assert.equal(ops.areaOps.nombre, nombre, 'el área de la selección es la activa')
    assert.deepEqual(ops.areaOps.coords, paquete.areas[0].coords, 'idéntica a lo recortado')
    assert.equal(ops.limites.length, (paquete.contenido?.ops?.limites || []).length, 'los límites de adentro')
    assert.equal(ops.coordinacion.length, (paquete.contenido?.ops?.coordinacion || []).length, 'los puntos de coordinación')
    const fichas = await leerFichas(page)
    assert.equal((fichas || []).length, (paquete.contenido?.unidades || []).length, 'las fichas de adentro')
    const cm = await leerCmoc(page)
    assert.equal(cm.ae.length, (paquete.contenido?.cmoc?.ae || []).length, 'el área de empeño del CMOC')
    // 2 · La carta está en el área (no donde estaba el ejercicio anterior).
    const vista = await page.evaluate(c => {
      const m = window.__mapa2d, b = m.getBounds()
      const lat = c.reduce((s, p) => s + p[1], 0) / c.length, lng = c.reduce((s, p) => s + p[0], 0) / c.length
      return { contiene: b.contains([lat, lng]), todo: c.every(p => b.pad(0.05).contains([p[1], p[0]])), zoom: m.getZoom() }
    }, paquete.areas[0].coords)
    assert.ok(vista.contiene && vista.todo, `la carta encuadra el área: ${JSON.stringify(vista)}`)
    await page.screenshot({ path: path.join(SALIDAS, '2-abierta.png') })
    // 3 · Quedó guardado con ese nombre, y el que estaba abierto sigue igual.
    const guardado = await leerGuardado(page, nombre)
    assert.equal(guardado.ops.areaOps.nombre, nombre)
    const despues = await leerGuardado(page, 'FABBLE abierto')
    assert.deepEqual(despues.ops.areaOps, abierto.ops.areaOps, 'el ejercicio que estaba abierto no se toca: su área')
    assert.deepEqual((despues.ops.areasOps || []).map(a => a.nombre).filter(n => n === nombre), [], 'ni se le suma la selección')
    assert.deepEqual(despues.unidades.map(u => u.id), abierto.unidades.map(u => u.id), 'ni sus fichas')

    // 4 · Otra vez: «CE-I» ya existe, propone «CE-I (2)»; Cancelar no hace nada.
    await ventana()
    respuesta = null
    await elegir(archivo, bytes, 'Abrir guardados')
    for (let i = 0; i < 40 && dialogos.length < 2; i++) await page.waitForTimeout(250)
    await page.waitForTimeout(500)
    assert.equal(dialogos.length, 2); assert.equal(dialogos[1].propuesto, `${nombre} (2)`)
    assert.match(await ejercicioAbierto(page), new RegExp(nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    respuesta = undefined

    // 5 · Un JSON roto y uno ajeno avisan en la ventana, sin preguntar nada.
    await elegir('roto.json', Buffer.from('{ esto no es JSON'), 'Actual')
    await page.getByText(/«roto\.json» no es un JSON válido\./).waitFor()
    await elegir('otra-cosa.json', Buffer.from(JSON.stringify({ hola: 1 })))
    await page.getByText(/«otra-cosa\.json» no es de la Mesa/).waitFor()
    assert.equal(dialogos.length, 2)
    await page.screenshot({ path: path.join(SALIDAS, '3-aviso.png') })

    // 6 · El EJERCICIO_….json (el ejercicio entero) se abre con su nombre.
    const entero = ejercicioFicticio({ conPlantilla: false }); entero.nombre = 'DIAMANTE entero'; entero.finalizado = true
    await elegir('EJERCICIO_DIAMANTE entero_2026-10-11_1948.json', Buffer.from(JSON.stringify(entero)))
    await page.waitForFunction(() => [...document.querySelectorAll('button[title="Crear, abrir y guardar ejercicios"]')].some(b => b.textContent.includes('DIAMANTE entero')))
    await page.waitForTimeout(800)
    assert.equal(dialogos[2].propuesto, 'DIAMANTE entero')
    const ops2 = await leerOps(page)
    assert.deepEqual(ops2.areaOps.coords, entero.ops.areaOps.coords)
    assert.equal((await leerGuardado(page, 'DIAMANTE entero')).finalizado, undefined, 'se abre para trabajar, sin candado')
    assert.deepEqual(errores, [])
    console.log(`E2E abrir archivo: «${archivo}» se abre desde 📁 Ejercicios como ejercicio nuevo «${nombre}» con su área, lo de adentro y el CMOC; la carta va a su área, el ejercicio abierto no se toca, propone «${nombre} (2)» si ya existe, avisa con un JSON roto o ajeno y abre el EJERCICIO_….json entero. Sin errores JS.`)
  } catch (e) {
    await page.screenshot({ path: path.join(SALIDAS, 'error.png') }).catch(() => {})
    console.error('DIAGNOSTICO', dialogos, errores)
    throw e
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
