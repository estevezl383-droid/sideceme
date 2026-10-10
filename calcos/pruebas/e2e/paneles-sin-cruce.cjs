// 🧑‍🏫 Los paneles NO se cruzan (pedido de Sergio, 10-10-2026, con capturas de la Mesa en modo
// Profesor): el tablero «Armar el ejercicio» tapaba la punta derecha de la barra de arriba y el
// tablero «Mesa · Preparación» le quedaba encima abajo; y con la piel Pandora la barra quedaba
// debajo de los tableros de la derecha. En la Mesa real (Chromium), en la pantalla de Sergio
// (2000 × 1290) y en dos de portátil (1440 × 900 y 1280 × 800):
//   · el tablero va entre la barra y el tablero de abajo (desplegado), sin tocar ninguno; si
//     ahí no entra (1280 × 800), el de abajo se angosta y le deja libre la columna;
//   · cada botón del tablero y de la barra se puede tocar (no hay nada encima);
//   · al abrir un tablero de la derecha (Unidades), el de los pasos se pliega solo y la barra
//     termina antes de ese tablero; desplegado igual, va a su izquierda; al cerrar Unidades,
//     vuelve a su lugar;
//   · sin errores de consola. Capturas en pruebas/salidas-paneles/.
//   node calcos/pruebas/e2e/paneles-sin-cruce.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso.js')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-paneles')
fs.mkdirSync(SALIDAS, { recursive: true })
const PANEL = '#sid-mod-panel'

// Rectángulos de lo que no se puede cruzar con el tablero de los pasos.
const rects = (page) =>
  page.evaluate(() => {
    const r = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return null
      const b = el.getBoundingClientRect()
      return b.width && b.height ? { l: b.left, t: b.top, r: b.right, b: b.bottom } : null
    }
    const m = document.querySelector('.contenedor-mapa')
    const derecha = [...m.children].filter((e) => +getComputedStyle(e).zIndex >= 1200 && getComputedStyle(e).position === 'absolute').map(r).filter((x) => x && x.l > innerWidth / 2 && x.t < 140)
    return {
      panel: r(document.querySelector('#sid-mod-panel')),
      plegado: document.querySelector('#sid-mod-panel').classList.contains('plegado'),
      barra: r(document.querySelector('.botones-mapa')),
      izquierda: r(document.querySelector('.panel')),
      abajo: r(m.querySelector(':scope > div[style*="1150"]')),
      leyenda: r(m.querySelector(':scope > .leyenda')),
      fichas: r(document.querySelector('#sid-pd-tab')),
      derecha,
    }
  })
const cruzan = (a, b) => !!a && !!b && a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1

// Cada botón visible de `sel` se puede tocar: lo que hay en su centro es él mismo.
const tapados = (page, sel) =>
  page.evaluate(async (sel) => {
    const out = []
    for (const b of document.querySelectorAll(sel)) {
      if (!b.offsetParent && getComputedStyle(b).position !== 'fixed') continue
      b.scrollIntoView({ block: 'nearest' })
      await new Promise((ok) => requestAnimationFrame(ok))
      const r = b.getBoundingClientRect()
      if (!r.width || !r.height || r.bottom > innerHeight || r.right > innerWidth) continue
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      const e = document.elementFromPoint(x, y)
      if (!e || !(e === b || b.contains(e))) out.push(`${(b.textContent || '').trim().slice(0, 30)} ← ${e ? e.tagName + '.' + String(e.className).slice(0, 30) + ' ' + (e.textContent || '').trim().slice(0, 30) : 'nada'}`)
    }
    return out
  }, sel)

;(async () => {
  for (const [ancho, alto] of [
    [2000, 1290],
    [1440, 900],
    [1280, 800],
  ]) {
    const tag = `${ancho}x${alto}`
    const datos = ejercicioFicticio({ conPlantilla: false })
    datos.nombre = 'FABBLE 1.0'
    const calcos = [{ id: 'id-0', nombre: 'FABBLE 1.0', payload: datos, actualizado_en: new Date().toISOString() }]
    const { page, errores, cerrar } = await abrir({
      ancho,
      alto,
      preparar: async (p) => {
        await servidorFalso(p, calcos)
        await p.addInitScript(() => {
          localStorage.setItem('sid_modalidad', 'profesor')
          localStorage.setItem('sid_mod_plegado', '0')
        })
      },
    })
    page.on('dialog', (d) => d.accept())
    try {
      await abrirDelServidor(page, 'FABBLE 1.0')
      assert.ok(await page.evaluate(() => document.body.classList.contains('sid-pandora')), 'con la piel Pandora')
      // El tablero de abajo desplegado (como en la captura de Sergio).
      const plegada = page.locator('.contenedor-mapa > button[style*="1150"]')
      if (await plegada.count()) await plegada.first().dispatchEvent('click')
      await page.waitForTimeout(900)
      let R = await rects(page)
      assert.ok(R.abajo, 'el tablero de abajo está desplegado')
      assert.ok(!R.plegado && R.panel, 'el tablero de los pasos está desplegado')
      await page.screenshot({ path: path.join(SALIDAS, `1-profesor-${tag}.png`) })
      for (const k of ['barra', 'abajo', 'leyenda', 'fichas']) assert.ok(!cruzan(R.panel, R[k]), `${tag}: el tablero de los pasos no se cruza con «${k}» ${JSON.stringify([R.panel, R[k]])}`)
      assert.ok(!cruzan(R.abajo, R.izquierda), `${tag}: el tablero de abajo no tapa el panel de la izquierda ${JSON.stringify([R.abajo, R.izquierda])}`)
      assert.ok(R.panel.b - R.panel.t >= 240, `${tag}: le queda alto para leerse (${Math.round(R.panel.b - R.panel.t)} px)`)
      assert.deepEqual(await tapados(page, `${PANEL} button, ${PANEL} select, ${PANEL} input`), [], `${tag}: todo lo del tablero de los pasos se puede tocar`)
      assert.deepEqual(await tapados(page, '.botones-mapa > button:not([data-sid-g=mando]), .botones-mapa .sello-guardado'), [], `${tag}: todo lo de la barra se puede tocar`)

      // Un tablero de la derecha (Unidades): los pasos se pliegan y la barra termina antes.
      const unidades = page.locator('.botones-mapa > button', { hasText: /^\W*Unidades\s*$/i }).first()
      await unidades.dispatchEvent('click')
      await page.waitForTimeout(900)
      R = await rects(page)
      assert.equal(R.derecha.length, 1, 'se abrió Unidades a la derecha')
      assert.ok(R.plegado, `${tag}: el tablero de los pasos se plegó solo`)
      assert.ok(!cruzan(R.barra, R.derecha[0]), `${tag}: la barra no queda debajo de Unidades ${JSON.stringify([R.barra, R.derecha[0]])}`)
      for (const k of ['barra', 'abajo', 'leyenda', 'fichas']) assert.ok(!cruzan(R.panel, R[k]), `${tag}: la pestaña plegada no se cruza con «${k}»`)
      assert.ok(!cruzan(R.panel, R.derecha[0]), `${tag}: la pestaña plegada va al costado de Unidades ${JSON.stringify([R.panel, R.derecha[0]])}`)
      assert.deepEqual(await tapados(page, `${PANEL} .asa`), [], `${tag}: la pestaña se puede tocar`)
      await page.screenshot({ path: path.join(SALIDAS, `2-unidades-${tag}.png`) })
      // Desplegado igual: a la izquierda de Unidades, sin cruzar nada.
      await page.locator(`${PANEL} .asa`).dispatchEvent('click')
      await page.waitForTimeout(900)
      R = await rects(page)
      assert.ok(!R.plegado, 'se desplegó')
      for (const k of ['barra', 'abajo', 'leyenda', 'fichas']) assert.ok(!cruzan(R.panel, R[k]), `${tag}: con Unidades abierto, no se cruza con «${k}»`)
      assert.ok(!cruzan(R.panel, R.derecha[0]), `${tag}: va al costado de Unidades ${JSON.stringify([R.panel, R.derecha[0]])}`)
      await page.screenshot({ path: path.join(SALIDAS, `3-al-costado-${tag}.png`) })
      // Se cierra Unidades: los pasos vuelven a su lugar.
      await unidades.dispatchEvent('click')
      await page.waitForTimeout(900)
      R = await rects(page)
      assert.equal(R.derecha.length, 0)
      assert.ok(!R.plegado, 'sigue desplegado')
      assert.ok(Math.abs(ancho - R.panel.r - 44) <= 1, `${tag}: volvió a su lugar (a 44 px del borde)`)

      // Un «ir» del tablero que abre un tablero de la derecha: se pliega mientras está abierto.
      await page.locator(`${PANEL} .ir`, { hasText: /^Unidades/ }).first().dispatchEvent('click')
      await page.waitForTimeout(1500)
      R = await rects(page)
      assert.ok(R.plegado && R.derecha.length === 1, 'abrió Unidades y se plegó')
      await unidades.dispatchEvent('click')
      await page.waitForTimeout(900)
      R = await rects(page)
      assert.ok(!R.plegado, `${tag}: al cerrar Unidades, los pasos vuelven solos`)

      assert.deepEqual(errores, [], 'sin errores de consola')
      console.log(`paneles sin cruce ${tag} OK`)
    } catch (e) {
      await page.screenshot({ path: path.join(SALIDAS, `ERROR-${tag}.png`) }).catch(() => {})
      console.error('errores de consola:', errores)
      throw e
    } finally {
      await cerrar()
    }
  }
})()
