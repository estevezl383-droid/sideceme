// ⊞ Disgregar una gran unidad en sus dependientes (index-disgregar-20261020.js), en la Mesa real (Chromium).
// El caso de Sergio: el CE-I es una sola ficha y el GALM-1 (en refuerzo) ya está en la carta.
//   · 🪖 Unidades → «⊞ Disgregar» en el CE-I propone «DIV MEC-2, DIV-1, DIV-6, GALM-1 (en refuerzo)»;
//   · el CE-I queda como Puesto Comando, aparecen las tres divisiones y el GALM-1 no se duplica;
//   · «↶ Deshacer» lo vuelve atrás; «⊟ Reagrupar» también;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/disgregar.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-disgregar')
fs.mkdirSync(SALIDAS, { recursive: true })

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push({ tipo: d.type(), msg: d.message(), valor: d.defaultValue() })
    d.type() === 'prompt' ? d.accept(d.defaultValue()) : d.accept()
  })
  const datos = ejercicioPersonal({ nombre: 'PRUEBA DISGREGAR (FICT.)' })
  datos.unidades = [
    { id: 'ce', bando: 'propias', tipo: 'unidad', designacion: 'CE-I', arma: 'infanteria', escalon: 'cuerpo', lat: -17.0, lng: -68.3 },
    { id: 'galm', bando: 'propias', tipo: 'unidad', designacion: 'GALM-1', arma: 'artilleria', escalon: 'batallon', lat: -17.1, lng: -68.35 },
  ]
  datos.ordenSup = { ...datos.ordenSup, unidad: 'CE-I', organizacionTarea: 'CE-I: DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo' }
  datos.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  const fichas = () => page.evaluate(() => JSON.parse(JSON.stringify((window.SIDMesaEjercicio && window.SIDMesaEjercicio.foto().unidades) || [])))
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  try {
    await sembrarYAbrir(page, datos)
    await page.waitForTimeout(1200)
    assert.equal((await fichas()).length, 2, 'abre con el CE-I y el GALM-1')
    await page.locator('.botones-mapa > button', { hasText: /^\W*Unidades\s*$/i }).first().dispatchEvent('click')
    const botones = page.locator('button.sid-disgregar')
  const boton = botones.first()
    await boton.waitFor({ timeout: 10000 })
    assert.equal(await botones.count(), 1, 'sólo el CE-I se disgrega (el GALM-1 no)')
    assert.match(await boton.innerText(), /Disgregar/)
    await foto('1-unidades')
    await boton.click()
    await page.waitForTimeout(800)
    const p = dialogos.find((d) => d.tipo === 'prompt')
    assert.ok(p, 'pregunta la lista antes de ponerla')
    assert.equal(p.valor, 'DIV MEC-2, DIV-1, DIV-6, GALM-1 (en refuerzo)', 'la lista sale de la Orden')
    const us = await fichas()
    const pc = us.find((u) => u.id === 'ce')
    assert.equal(pc.tipo, 'pc', 'el CE-I queda como Puesto Comando')
    assert.equal(pc.designacion, 'CE-I')
    const nuevas = us.filter((u) => u.dependeDe === 'ce' && u.id !== 'galm')
    assert.deepEqual(nuevas.map((u) => u.designacion), ['DIV MEC-2', 'DIV-1', 'DIV-6'], 'aparecen las tres divisiones')
    assert.equal(us.filter((u) => /GALM/.test(u.designacion)).length, 1, 'el GALM-1 no se duplica')
    assert.equal(us.find((u) => u.id === 'galm').dependeDe, 'ce')
    await page.getByText(/CE-I es ahora su Puesto Comando/).first().waitFor({ timeout: 5000 })
    assert.match(await boton.innerText(), /Reagrupar/)
    assert.equal(await botones.count(), 4, 'las divisiones también se pueden disgregar después (en sus brigadas)')
    await foto('2-disgregado')
    // ↶ Deshacer
    const deshacer = page.locator('.botones-mapa > button.btn-deshacer').first()
    await deshacer.click()
    await page.waitForTimeout(600)
    assert.deepEqual((await fichas()).map((u) => [u.id, u.tipo]), [['ce', 'unidad'], ['galm', 'unidad']], '↶ Deshacer: como antes')
    // otra vez, y ⊟ Reagrupar
    await boton.click()
    await page.waitForTimeout(600)
    assert.equal((await fichas()).length, 5)
    await boton.click()
    await page.waitForTimeout(600)
    const v = await fichas()
    assert.deepEqual(v.map((u) => [u.id, u.tipo, u.dependeDe]), [['ce', 'unidad', undefined], ['galm', 'unidad', undefined]], '⊟ Reagrupar: como antes')
    assert.ok(dialogos.some((d) => d.tipo === 'confirm' && /Reagrupar CE-I/.test(d.msg)), 'pregunta antes de reagrupar')
    await foto('3-reagrupado')
    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: el CE-I se disgrega en DIV MEC-2, DIV-1 y DIV-6 (el GALM-1 no se duplica) y queda como Puesto Comando.')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
