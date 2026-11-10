// La Mesa real: el vidrio no se compone sobre cada cuadro de un gesto del mapa.
// Los tiles y rótulos tampoco deben provocar mediciones de los paneles.
// SIDECEME_CHROMIUM=/usr/bin/chromium node calcos/pruebas/e2e/fluidez.cjs
const assert = require('node:assert/strict')
const { abrir } = require('./navegador')

;(async () => {
  const { page, errores, cerrar } = await abrir({ escalaPantalla: 2, consulta: '?puesto=g4' })
  try {
    await page.waitForFunction(() => window.__mapa2d && document.body.classList.contains('sid-pandora'))
    const filtros = () => page.evaluate(() => ({
      moviendo: document.body.classList.contains('sid-mapa-moviendo'),
      panel: getComputedStyle(document.querySelector('.panel')).backdropFilter,
      barra: getComputedStyle(document.querySelector('.botones-mapa'), '::before').backdropFilter,
      botones: [...document.querySelectorAll('.botones-mapa .m3d-barra, .botones-mapa .btn-cmoc-abrir, #sid-pd-tab .fich, .sid-pd-cap .tg')].map(b => getComputedStyle(b).backdropFilter),
    }))
    const quieto = await filtros()
    assert.equal(quieto.moviendo, false)
    assert.match(quieto.panel, /blur/)
    assert.match(quieto.barra, /blur/)
    assert.ok(quieto.botones.length > 5)
    assert.ok(quieto.botones.every(f => f === 'none'), 'No hay un filtro adicional por botón')

    // Un arrastre real y el zoom de Leaflet: el filtro desaparece durante el
    // gesto y vuelve al terminar, sin cambiar de vista ni perder los controles.
    for (const gesto of ['desplazar', 'zoom']) {
      await page.evaluate(gesto => {
        const m = window.__mapa2d
        window.__vidrioDuranteGesto = null
        // El oyente de la piel ya está conectado; también sirve si el navegador
        // resuelve el zoom sin animación y emite su fin en la misma tarea.
        m.once(gesto === 'zoom' ? 'zoomstart' : 'movestart', () => {
          window.__vidrioDuranteGesto = {
            activo: document.body.classList.contains('sid-mapa-moviendo'),
            panel: getComputedStyle(document.querySelector('.panel')).backdropFilter,
            barra: getComputedStyle(document.querySelector('.botones-mapa'), '::before').backdropFilter,
            filtrosRestantes: [...document.querySelectorAll('body *')].filter(el => getComputedStyle(el).backdropFilter !== 'none').length,
          }
        })
        if (gesto === 'zoom') m.setZoom(m.getZoom() + 1, { animate: true })
        else m.panBy([180, 60], { animate: true, duration: .8 })
      }, gesto)
      await page.waitForFunction(() => window.__vidrioDuranteGesto)
      assert.deepEqual(await page.evaluate(() => window.__vidrioDuranteGesto), { activo: true, panel: 'none', barra: 'none', filtrosRestantes: 0 }, gesto)
      await page.waitForFunction(() => !document.body.classList.contains('sid-mapa-moviendo'))
      const despues = await filtros()
      assert.equal(despues.panel, quieto.panel, 'Se restaura el vidrio del panel')
      assert.equal(despues.barra, quieto.barra, 'Se restaura el vidrio de la barra')
    }

    // Los eventos de movimiento y zoom se solapan en un mismo gesto.
    await page.evaluate(() => { __mapa2d.fire('movestart'); __mapa2d.fire('zoomstart'); __mapa2d.fire('zoomend') })
    assert.equal((await filtros()).panel, 'none', 'El fin del zoom no restaura el filtro mientras sigue el desplazamiento')
    await page.evaluate(() => __mapa2d.fire('moveend'))
    assert.equal((await filtros()).panel, quieto.panel)

    // Un rótulo se actualiza como lo hace Leaflet. No debe volver a medir los
    // paneles por un cambio que sólo afecta al contenido de la carta.
    const mediciones = await page.evaluate(async () => {
      await new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)))
      const original = window.getComputedStyle, mapa = document.querySelector('.contenedor-mapa')
      let cuenta = 0
      window.getComputedStyle = function (el, pseudo) {
        if (el.parentElement === mapa) cuenta++
        return original.call(this, el, pseudo)
      }
      try {
        const rotulo = document.createElement('span')
        __mapa2d.getPane('markerPane').appendChild(rotulo)
        rotulo.textContent = 'Rótulo de prueba'
        await new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)))
        rotulo.remove()
        return cuenta
      } finally { window.getComputedStyle = original }
    })
    assert.equal(mediciones, 0, 'Los rótulos no disparan mediciones de los paneles')

    await page.locator('#sid-pd-sw').click()
    assert.equal(await page.evaluate(() => document.body.classList.contains('sid-pandora')), false)
    await page.locator('#sid-pd-sw').click()
    assert.match((await filtros()).panel, /blur/)
    assert.deepEqual(errores, [])
    console.log('OK: desplazamiento y zoom sin desenfoque, restauración al terminar, filtros sin duplicar, rótulos sin medir paneles y selector de vista operativo.')
  } finally { await cerrar() }
})().catch(e => { console.error(e); process.exitCode = 1 })
