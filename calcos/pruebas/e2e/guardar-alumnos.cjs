const assert = require('node:assert/strict')
const fs = require('node:fs')
const { abrir } = require('./navegador')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const futuro = () => new Date(Date.now() + 3600e3).toISOString()
async function hasta(f, texto) {
  const inicio = Date.now()
  for (;;) { if (await f()) return; if (Date.now() - inicio > 15000) throw Error(texto); await new Promise(r => setTimeout(r, 100)) }
}
;(async () => {
  const datos = ejercicioFicticio({ conPlantilla: false })
  datos.nombre = 'ALUMNO FICTICIO'
  datos.hojasG = { g1: { tareas: [{ Tarea: 'Trabajo del alumno' }] } }
  datos.g3 = { ...datos.g3, _caps: { activo: 1, guardados: { 2: { fases: [{ n: 1, nombre: 'Fase CAP 2', ops: {}, unidades: [] }] } } } }
  datos.fasesCOA = { enemigo: [], propio: [{ n: 1, nombre: 'Fase CAP 1', ops: {}, unidades: [] }] }
  datos.faseActiva = null
  const calcos = [{ id: 'id-0', nombre: datos.nombre, payload: datos, actualizado_en: new Date().toISOString() }], log = []
  const tokens = new Set(['alumno-1', 'alumno-2'])
  const { page, errores, cerrar, url } = await abrir({ preparar: async p => {
    await servidorFalso(p, calcos, log, { tokens })
    await p.addInitScript(f => {
      localStorage.removeItem('sideceme_token_p')
      localStorage.setItem('sideceme_token_expira_p', '2020-01-01T00:00:00Z')
      sessionStorage.setItem('sideceme_token', 'alumno-1')
      sessionStorage.setItem('sideceme_token_expira', f)
      Object.assign(window.SIDECEME_CALCOS, { token: 'alumno-1', esProfesor: false })
      Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, writable: true, configurable: true })
    }, futuro())
  } })
  page.on('dialog', d => d.accept())
  try {
    await abrirDelServidor(page, datos.nombre)
    await page.locator('#sid-resg-btn').click()
    assert.match(await page.locator('#sid-resg-btn').innerText(), /Guardar como/i)
    const boton = page.locator('#sid-resg-panel [data-r=bajar]')
    const [descarga] = await Promise.all([page.waitForEvent('download'), boton.click()])
    const exportado = JSON.parse(fs.readFileSync(await descarga.path(), 'utf8'))
    assert.deepEqual(exportado.hojasG.g1, datos.hojasG.g1)
    assert.equal(exportado.fasesCOA.propio.length, 1)
    assert.equal(exportado.g3._caps.guardados['2'].fases.length, 1)
    assert.match(await page.locator('#sid-resg-panel').innerText(), /Descarga solicitada/)
    console.log('OK: alumno sin rol de profesor descarga el ejercicio completo, con hojas y ambos CAP.')

    await page.evaluate(() => {
      window.__guardadoArchivo = ''
      window.showSaveFilePicker = async () => ({ name: 'ejercicio-alumno.json', createWritable: async () => ({ write: async t => { window.__guardadoArchivo = t }, close: async () => {} }) })
    })
    await boton.click()
    await hasta(() => page.locator('#sid-resg-panel').innerText().then(t => /Archivo guardado: ejercicio-alumno.json/.test(t)), 'guardar como con selector')
    assert.equal(await page.evaluate(() => JSON.parse(window.__guardadoArchivo).nombre), datos.nombre)
    await page.evaluate(() => { window.showSaveFilePicker = async () => { throw new DOMException('cancelado', 'AbortError') } })
    await boton.click()
    await hasta(() => page.locator('#sid-resg-panel').innerText().then(t => /Guardado cancelado/.test(t)), 'cancelación clara')
    await page.evaluate(() => { window.showSaveFilePicker = async () => { throw new DOMException('selector bloqueado', 'NotAllowedError') } })
    const [alternativa] = await Promise.all([page.waitForEvent('download'), boton.click()])
    assert.equal(JSON.parse(fs.readFileSync(await alternativa.path(), 'utf8')).nombre, datos.nombre)
    await page.evaluate(() => { window.showSaveFilePicker = async () => ({ createWritable: async () => { throw Error('disco lleno de prueba') } }) })
    await boton.click()
    await hasta(() => page.locator('#sid-resg-panel').innerText().then(t => /No se pudo guardar el archivo.*disco lleno de prueba/.test(t)), 'error de escritura claro')
    console.log('OK: selector de archivo, cancelación y fallo de escritura informados sin confirmar un guardado fallido.')

    const reintento = await page.evaluate(async () => {
      const antes = window.SIDMesaEjercicio
      const copia = { nombre: 'SÓLO HOJAS', hojasG: { g1: { tareas: ['trabajo sin terreno'] } } }
      window.SIDMesaEjercicio = { nombre: () => copia.nombre, foto: () => copia }
      const put = IDBObjectStore.prototype.put
      let fallar = true
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === 'copias' && fallar) { fallar = false; throw new DOMException('cuota de prueba', 'QuotaExceededError') }
        return put.apply(this, args)
      }
      try {
        await window.SIDResguardo.resguardar(false)
        const aviso = window.SIDResguardo.estado.localErr
        await window.SIDResguardo.resguardar(false)
        const copias = await window.SIDResguardo.copiasDe(copia.nombre)
        return { aviso, cantidad: copias.length, texto: copias.length ? await window.SIDResguardo.copiaTexto(copias[0].clave) : '', errorFinal: window.SIDResguardo.estado.localErr, avisoFinal: window.SIDResguardo.estado.aviso }
      } finally { IDBObjectStore.prototype.put = put; window.SIDMesaEjercicio = antes }
    })
    assert.match(reintento.aviso, /cuota de prueba/)
    assert.equal(reintento.cantidad, 1)
    assert.equal(reintento.errorFinal, '')
    assert.match(reintento.avisoFinal, /Copia de seguridad guardada/)
    assert.equal(JSON.parse(reintento.texto).hojasG.g1.tareas[0], 'trabajo sin terreno')
    console.log('OK: un fallo de almacenamiento se reintenta con el mismo contenido; se protegen también las hojas sin terreno.')

    await page.evaluate(() => {
      sessionStorage.setItem('sideceme_token_expira', '2020-01-01T00:00:00Z')
      window.SIDResguardo.revisarSesion()
    })
    assert.match(await page.locator('#sid-resg-aviso').innerText(), /sesión.*venció/)
    const [otra] = await Promise.all([page.waitForEvent('popup'), page.locator('#sid-resg-aviso [data-r=entrar]').click()])
    await otra.goto(new URL('../escudo-eceme.png', url).href)
    await otra.evaluate(f => {
      sessionStorage.setItem('sideceme_token', 'alumno-2')
      sessionStorage.setItem('sideceme_token_expira', f)
    }, futuro())
    await page.evaluate(() => window.SIDResguardo.revisarSesion())
    assert.equal(await page.evaluate(() => window.SIDECEME_CALCOS.token), 'alumno-2')
    assert.equal(await page.evaluate(() => window.SIDECEME_CALCOS.esProfesor), false)
    await page.locator('.sello-guardado').first().click()
    await hasta(() => log.some(l => l.accion === 'guardar' && l.token === 'alumno-2'), 'guardar con la sesión renovada del alumno')
    await otra.close()
    console.log('OK: la sesión del alumno renovada en la ventana de ingreso vuelve a Calcos y permite guardar sin recargar.')
    assert.deepEqual(errores, [])
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
