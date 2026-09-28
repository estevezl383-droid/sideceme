// Prueba de carga (calcos/pruebas/carga.html), en Chromium y SIN tocar el
// servidor: `calcos-datos` y `calco-ops` se contestan acá.
//   · la Mesa del EM de verdad (el compilado), en modo servidor, abre una BASE
//     repartida y aprieta ⚡ GENERAR CALCOS: se anotan sus pedidos a
//     calcos-datos, uno por uno (al abrir, el mismo pedido sale DOS veces);
//   · la página de carga, con un alumno y la misma área, tiene que hacer
//     EXACTAMENTE los mismos pedidos, en el mismo orden;
//   · con varios alumnos: cuenta pedidos, errores y arma el resumen;
//   · un área que cruza la frontera suma los pedidos del otro país;
//   · sin ser C&T / Planificación, no deja empezar.
//
//   cd calcos/pruebas && node e2e/carga.js
const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { servir, cargarPlaywright } = require('./navegador')

const COCHABAMBA = { type: 'Polygon', coordinates: [[[-66.5, -17.7], [-65.9, -17.7], [-65.9, -17.15], [-66.5, -17.15], [-66.5, -17.7]]] }
// Orilla del Titicaca: toca Bolivia y Perú.
const TITICACA = { type: 'Polygon', coordinates: [[[-69.4, -16.4], [-68.7, -16.4], [-68.7, -15.8], [-69.4, -15.8], [-69.4, -16.4]]] }

const BASE = {
  tipoArchivo: 'base-pmtd', version: 1, ejercicio: 'Prueba de carga', autor: 'e2e', fecha: new Date().toISOString(),
  mision: '', pais: 'bolivia', aoi: COCHABAMBA, aoPuntos: [], unidades: [], ops: null, cmoc: null, fasesCOA: null, faseActiva: null,
}

const fc = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: 'x' }, geometry: { type: 'Point', coordinates: [-66.2, -17.4] } }] }

let fallas = 0
async function caso(nombre, fn) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n    ${e.stack || e.message}`)
  }
}

// Un navegador con el servidor de SIDECEME simulado. `opciones.recortar(cuerpo)`
// decide qué contesta cada pedido de datos.
async function navegador({ administra = true, recortar } = {}) {
  const { chromium } = cargarPlaywright()
  const { srv, url } = await servir()
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const pedidos = []
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (r) => {
    const u = r.request().url()
    if (u.includes('/functions/v1/calcos-datos')) {
      const cuerpo = JSON.parse(r.request().postData() || '{}')
      if (cuerpo.accion === 'permiso') {
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, permitido: true, administra, nombre: 'Prueba C&T' }) })
      }
      if (cuerpo.accion === 'capas') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, inventario: {} }) })
      if (cuerpo.accion === 'recortar') {
        pedidos.push(`${cuerpo.pais}:${cuerpo.capas.join('+')}`)
        const res = recortar ? recortar(cuerpo) : null
        if (res) return r.fulfill(res)
        const capas = Object.fromEntries(cuerpo.capas.map((c) => [c, fc]))
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, capas }) })
      }
    }
    if (u.includes('/functions/v1/calco-ops')) {
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, calcos: [], calco: { id: 'c-e2e', nombre: 'Prueba', payload: {} } }) })
    }
    return r.abort()
  })
  const errores = []
  const pagina = async (ruta, init) => {
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
    if (init) await page.addInitScript(init.fn, init.arg)
    await page.goto(url.replace(/calcos\/$/, '') + ruta, { waitUntil: 'domcontentloaded' })
    return page
  }
  const cerrar = async () => {
    await browser.close()
    srv.close()
  }
  return { pagina, pedidos, errores, cerrar }
}

// En la página de carga: la sesión de C&T ya está en el navegador.
const conSesion = { fn: () => localStorage.setItem('sideceme_token_p', 'token-e2e'), arg: null }

async function esperarFin(page) {
  await page.waitForFunction(() => document.getElementById('veredicto').textContent.trim().length > 0, null, { timeout: 60000 })
}

;(async () => {
  let secuenciaMesa = null

  await caso('la Mesa real: abrir la BASE + ⚡ GENERAR CALCOS pide una capa por pedido', async () => {
    const nav = await navegador()
    try {
      // Modo servidor (como publicado) y la BASE repartida por el G-3.
      const init = {
        fn: (base) => {
          window.SIDECEME_CALCOS = { url: 'https://ofsyiylhdrdiqtnbaovo.supabase.co', anonKey: 'x', token: 'token-e2e', esProfesor: true }
          localStorage.setItem('pmtd_base_repartida', JSON.stringify(base))
        },
        arg: BASE,
      }
      const page = await nav.pagina('calcos/?puesto=g2', init)
      // Al abrir la BASE, la Mesa pide sola las capas prendidas del tablero,
      // y lo pide dos veces: el efecto corre al cambiar el área y otra vez al
      // cambiar su contador.
      const t0 = Date.now()
      while (nav.pedidos.length < 2 && Date.now() - t0 < 20000) await page.waitForTimeout(200)
      await page.waitForTimeout(1500)
      assert.deepStrictEqual(nav.pedidos, ['bolivia:hidro_lineas+poblaciones_puntos', 'bolivia:hidro_lineas+poblaciones_puntos'], 'pedidos al abrir la BASE')

      const boton = page.locator('button.btn-generar')
      if (!(await boton.count())) throw new Error('No aparece ⚡ GENERAR CALCOS')
      await boton.first().evaluate((b) => b.click())
      let quieto = 0, antes = -1
      while (quieto < 6) {
        await page.waitForTimeout(500)
        quieto = nav.pedidos.length === antes ? quieto + 1 : 0
        antes = nav.pedidos.length
      }
      secuenciaMesa = [...nav.pedidos]
      assert.ok(secuenciaMesa.length > 10, `la Mesa hizo ${secuenciaMesa.length} pedidos`)
      assert.ok(secuenciaMesa.slice(2).every((p) => !p.includes('+')), 'GENERAR pide de a una capa')
      assert.ok(!secuenciaMesa.some((p) => p.includes('comunicaciones_huellas')), 'las huellas salen de OSM, no de calcos-datos')
      assert.deepStrictEqual(nav.errores, [])
    } finally {
      await nav.cerrar()
    }
  })

  await caso('la página de carga, con un alumno, hace los mismos pedidos que la Mesa', async () => {
    assert.ok(secuenciaMesa, 'falta la secuencia de la Mesa (falló el caso anterior)')
    const nav = await navegador()
    try {
      const page = await nav.pagina('calcos/pruebas/carga.html', conSesion)
      await page.waitForFunction(() => /puede correr/.test(document.getElementById('sesion').textContent))
      await page.click('#btnEjemplo')
      await page.selectOption('#alumnos', '1')
      assert.match(await page.textContent('#plan'), new RegExp(`${secuenciaMesa.length} pedidos en fila`))
      await page.click('#btnEmpezar')
      await esperarFin(page)
      assert.deepStrictEqual(nav.pedidos, secuenciaMesa)
      assert.match(await page.textContent('#veredicto'), /🟢/)
      assert.deepStrictEqual(nav.errores, [])
    } finally {
      await nav.cerrar()
    }
  })

  await caso('cinco alumnos: cuenta pedidos y errores, y el resumen los dice', async () => {
    // El servidor corta las calles de Bolivia por tiempo, como pasaría con carga.
    const nav = await navegador({
      recortar: (c) => (c.pais === 'bolivia' && c.capas[0] === 'comunicaciones_calles'
        ? { status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'canceling statement due to statement timeout' }) }
        : null),
    })
    try {
      const page = await nav.pagina('calcos/pruebas/carga.html', conSesion)
      await page.waitForFunction(() => /puede correr/.test(document.getElementById('sesion').textContent))
      await page.click('#btnEjemplo')
      await page.selectOption('#alumnos', '5')
      const porAlumno = Number((await page.textContent('#plan')).match(/hace (\d+) pedidos/)[1])
      await page.click('#btnEmpezar')
      await esperarFin(page)
      assert.strictEqual(nav.pedidos.length, 5 * porAlumno)
      assert.match(await page.textContent('#veredicto'), /🔴 5 de 5 alumnos/)
      assert.match(await page.textContent('#errores'), /5 × 500 · canceling statement due to statement timeout/)
      const resumen = await page.evaluate(async () => {
        let copiado = null
        navigator.clipboard.writeText = async (t) => { copiado = t }
        document.getElementById('btnCopiar').click()
        await new Promise((r) => setTimeout(r, 100))
        return copiado
      })
      assert.match(resumen, /5 alumnos/)
      assert.match(resumen, new RegExp(`Pedidos: ${5 * porAlumno}/${5 * porAlumno} · bien ${5 * porAlumno - 5} · error 5`))
      assert.match(resumen, /Error: 5 × 500 · canceling statement due to statement timeout \(comunicaciones_calles\)/)
      assert.deepStrictEqual(nav.errores, [])
    } finally {
      await nav.cerrar()
    }
  })

  await caso('un área en la frontera suma los pedidos del otro país (sin las capas militares que no tiene)', async () => {
    const nav = await navegador()
    const archivo = path.join(os.tmpdir(), `titicaca-${process.pid}.geojson`)
    fs.writeFileSync(archivo, JSON.stringify({ type: 'Feature', properties: {}, geometry: TITICACA }))
    try {
      const page = await nav.pagina('calcos/pruebas/carga.html', conSesion)
      await page.waitForFunction(() => /puede correr/.test(document.getElementById('sesion').textContent))
      await page.setInputFiles('#archivo', archivo)
      await page.waitForFunction(() => /Perú/.test(document.getElementById('area').textContent))
      await page.selectOption('#pais', 'bolivia')
      await page.selectOption('#alumnos', '1')
      await page.click('#btnEmpezar')
      await esperarFin(page)
      const peru = nav.pedidos.filter((p) => p.startsWith('peru:'))
      assert.strictEqual(peru.length, 19 - 7, 'Perú: las 19 capas menos las 7 militares')
      assert.ok(!peru.some((p) => p.includes('mil_')))
      assert.strictEqual(nav.pedidos.length, 2 + 17 + 12)
    } finally {
      fs.rmSync(archivo, { force: true })
      await nav.cerrar()
    }
  })

  await caso('sin ser C&T o Planificación no deja empezar', async () => {
    const nav = await navegador({ administra: false })
    try {
      const page = await nav.pagina('calcos/pruebas/carga.html', conSesion)
      await page.waitForFunction(() => /⛔/.test(document.getElementById('sesion').textContent))
      await page.click('#btnEjemplo')
      assert.strictEqual(await page.isDisabled('#btnEmpezar'), true)
      assert.strictEqual(nav.pedidos.length, 0)
    } finally {
      await nav.cerrar()
    }
  })

  if (fallas) {
    console.log(`\n${fallas} caso(s) fallaron`)
    process.exit(1)
  }
  console.log('\nTodo bien.')
})()
