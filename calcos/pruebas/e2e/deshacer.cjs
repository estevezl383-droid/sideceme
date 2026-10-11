// ↶ Deshacer con las fichas de unidades (index-deshacer-20261011.js), en la Mesa real (Chromium),
// como está publicada (SIDECEME de mentira: servidor-falso.js). Lo pidió Sergio: «sin querer le di
// en limpiar unidades y ya no pude deshacer esa acción, mis unidades se perdieron».
//   · al abrir, el ↶ Deshacer está gris (no hay nada que deshacer);
//   · 🪖 Unidades → «🗑 Borrar todas las fichas» PREGUNTA; si se cancela, no se borra nada;
//   · si se acepta, se borran, el ↶ Deshacer se enciende y al tocarlo vuelven TODAS, iguales;
//     lo que se guarda en SIDECEME vuelve a tener las fichas;
//   · insertar una organización tipo (el puente del tablero del profesor) y deshacer la saca;
//   · al abrir OTRO ejercicio la pila se vacía (no se puede «deshacer» hacia el ejercicio anterior);
//   · sin errores de consola.
//   node calcos/pruebas/e2e/deshacer.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso.js')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-deshacer')
fs.mkdirSync(SALIDAS, { recursive: true })

;(async () => {
  const uno = ejercicioFicticio({ conPlantilla: false })
  uno.nombre = 'FABBLE 1.1'
  const dos = ejercicioFicticio({ conPlantilla: false })
  dos.nombre = 'OTRO EJERCICIO'
  dos.unidades = dos.unidades.slice(0, 1)
  const calcos = [
    { id: 'id-0', nombre: 'FABBLE 1.1', payload: uno, actualizado_en: new Date().toISOString() },
    { id: 'id-1', nombre: 'OTRO EJERCICIO', payload: dos, actualizado_en: new Date().toISOString() },
  ]
  const log = []
  const { page, errores, cerrar } = await abrir({
    ancho: 1600,
    alto: 1000,
    preparar: async (p) => {
      await servidorFalso(p, calcos, log)
    },
  })
  let respuesta = true
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push(d.message())
    if (d.type() === 'confirm' && !respuesta) d.dismiss()
    else d.accept()
  })
  const fichas = () => page.evaluate(() => (window.SIDMesaEjercicio && window.SIDMesaEjercicio.foto().unidades || []).map((u) => u.designacion))
  const deshacer = page.locator('.botones-mapa > button.btn-deshacer').first()
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await abrirDelServidor(page, 'FABBLE 1.1')
    await page.waitForTimeout(1500)
    const antes = await fichas()
    assert.equal(antes.length, 4, 'el ejercicio abre con sus 4 fichas')
    assert.equal(await deshacer.isDisabled(), true, 'al abrir no hay nada que deshacer')

    // 🪖 Unidades → «🗑 Borrar todas las fichas»
    await page.locator('.botones-mapa > button', { hasText: /^\W*Unidades\s*$/i }).first().dispatchEvent('click')
    await page.waitForTimeout(800)
    const borrar = page.getByRole('button', { name: /Borrar todas las fichas/ })
    assert.equal(await borrar.count(), 1, 'el botón dice lo que hace')
    await foto('1-unidades')

    // cancelar: no se borra nada
    respuesta = false
    await borrar.click()
    await page.waitForTimeout(400)
    assert.match(dialogos.at(-1), /¿Borrar las 4 ficha\(s\) de la carta\?/, 'pregunta antes de borrar')
    assert.deepEqual(await fichas(), antes, 'cancelado: las fichas siguen')
    assert.equal(await deshacer.isDisabled(), true, 'cancelado: nada que deshacer')

    // aceptar: se borran y el deshacer las devuelve
    respuesta = true
    await borrar.click()
    await page.waitForTimeout(600)
    assert.deepEqual(await fichas(), [], 'aceptado: se borraron')
    assert.equal(await deshacer.isDisabled(), false, 'el ↶ Deshacer se enciende')
    assert.match(await deshacer.innerText(), /\(1\)/, 'un paso guardado')
    await foto('2-borradas')
    await deshacer.click()
    await page.waitForTimeout(600)
    assert.deepEqual(await fichas(), antes, '↶ Deshacer: volvieron las 4 fichas, iguales')
    assert.equal(await deshacer.isDisabled(), true, 'la pila quedó vacía')
    await foto('3-deshecho')
    // y lo que se guarda en SIDECEME vuelve a tenerlas
    const t0 = Date.now()
    while (Date.now() - t0 < 15000) {
      const g = log.filter((l) => l.accion === 'guardar').at(-1)
      if (g && (g.payload.unidades || []).length === 4) break
      await page.waitForTimeout(300)
    }
    assert.equal((log.filter((l) => l.accion === 'guardar').at(-1).payload.unidades || []).length, 4, 'se guardó con las 4 fichas de vuelta')

    // insertar una organización por el puente del tablero del profesor y deshacer
    await page.evaluate(() => window.SIDModalidad.poner('profesor'))
    await page.waitForTimeout(800)
    const metidas = await page.evaluate(() => {
      const IA = window.SIDIAProfesor
      const f = IA.fichasDeOrganizacion(IA.organizacionDe('fftt'), { bando: 'propias', numero: '1', centro: { lat: -17.02, lng: -65.05 } })
      window.SIDModalidad.puente.agregarUnidades(f)
      return f.length
    })
    await page.waitForTimeout(600)
    assert.equal((await fichas()).length, 4 + metidas, 'se insertó la FF.TT.')
    await deshacer.click()
    await page.waitForTimeout(600)
    assert.deepEqual(await fichas(), antes, '↶ Deshacer saca lo insertado')
    await page.evaluate(() => window.SIDModalidad.poner('mesa'))

    // la pila se vacía al abrir otro ejercicio
    respuesta = true
    await borrar.click().catch(async () => {
      await page.locator('.botones-mapa > button', { hasText: /^\W*Unidades\s*$/i }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /Borrar todas las fichas/ }).click()
    })
    await page.waitForTimeout(400)
    assert.equal(await deshacer.isDisabled(), false, 'hay algo para deshacer')
    await abrirDelServidor(page, 'OTRO EJERCICIO')
    await page.waitForTimeout(1500)
    assert.equal((await fichas()).length, 1, 'abrió el otro ejercicio')
    assert.equal(await deshacer.isDisabled(), true, 'al cambiar de ejercicio la pila se vacía')
    await foto('4-otro-ejercicio')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('✔ ↶ Deshacer con las fichas: borrar todas pregunta, deshacer las devuelve, insertar se deshace, la pila se vacía al cambiar de ejercicio')
  } finally {
    await cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
