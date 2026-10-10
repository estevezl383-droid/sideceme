// 📚 Lo documental de una instalación, en la Mesa real (Chromium), con el ejercicio ficticio y
// dos instalaciones.
//
// Antes esto era la «Ficha documental de instalación» (fichas-instalacion/v1). Desde el
// 03-10-2026 tocar una instalación abre el TABLERO G-4 (fichas-instalacion/v2), que la
// reemplazó: lo documental quedó en sus pestañas 📚 Documentos y 🤖 IA. La prueba vieja seguía
// buscando el panel v1 y vencía el tiempo (10-10-2026); ahora prueba lo mismo en el tablero:
//   · 2D: tocar la instalación → globo → «📊 ABRIR TABLERO G-4»; 3D: tocarla lo abre directo;
//   · 📚 adjuntar un documento y consultar su texto extraído; fragmentos y observaciones de
//     esa instalación (no se mezclan con la otra); la respuesta de la ficha de texto vieja
//     sigue a la vista;
//   · 🤖 el pedido lleva la instalación, los fragmentos, las observaciones y las ideas, y se
//     copia al portapapeles; la respuesta de OTRA instalación se rechaza; la buena se proyecta;
//     se marca como revisada; en texto libre, el HTML se muestra como texto (no se ejecuta);
//   · minimizar y ampliar; guardar el ejercicio, recargar y recuperarlo igual;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/ficha-documental.js
const assert = require('node:assert/strict')
const { abrir, estadoReact, sembrarYAbrir, entrar3D, salir3D, leerGuardado, aPantalla } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const instalaciones = [
  {
    id: 'ficha-a', designacion: 'INSTALACIÓN A', tipo: 'instalacion', instalacion: 'pd_cl1', bando: 'propias', arma: 'logistica', escalon: 'seccion', lat: -17.005, lng: -65.052,
    // un ejercicio guardado con la ficha de texto de antes (v1)
    fichaDocumental: { resultadoIA: { version: 1, instalacionId: 'ficha-a', resumen: 'Síntesis anterior de A (ficha de texto)' } },
  },
  { id: 'ficha-b', designacion: 'INSTALACIÓN B', tipo: 'instalacion', instalacion: 'pcm', bando: 'propias', arma: 'logistica', escalon: 'seccion', lat: -17.007, lng: -65.04 },
]
const tablero = (page) => page.locator('[data-tablero-g4]')
const pestana = (page, id) => tablero(page).locator(`[data-pestana="${id}"]`).dispatchEvent('click')
const campo = (page, rotulo, tag = 'textarea') => tablero(page).locator('label', { hasText: rotulo }).locator(tag)
const datosReact = (p) => estadoReact(p, (v) => (Array.isArray(v) && v.some((u) => u?.id === 'ficha-a') ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(f, ms = 10000) {
  let r = null
  for (let t = 0; t < ms; t += 250) {
    r = await f()
    if (r) return r
    await new Promise((ok) => setTimeout(ok, 250))
  }
  return r
}

;(async () => {
  const m = await abrir()
  const { page } = m
  page.on('dialog', (d) => d.accept())
  try {
    const d = ejercicioFicticio({ conPlantilla: false })
    d.unidades.push(...instalaciones)
    d.ops.unidadConsiderada = { nombre: 'DIV. FICT.', escalon: 'division', confirmada: true }
    await sembrarYAbrir(page, d)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})

    // 2D: tocar la instalación abre el globo; el botón del globo, el tablero.
    const a = instalaciones[0]
    await page.evaluate(([lat, lng]) => window.__mapa2d.setView([lat, lng], 15, { animate: false }), [a.lat, a.lng])
    await page.waitForTimeout(1200)
    await page.evaluate(() => (window.__lm2d = window.__mapa2d))
    const [[x, y]] = await aPantalla(page, [[a.lng, a.lat]])
    await page.mouse.click(x, y)
    const globo = await esperar(() => page.evaluate(() => document.querySelector('.leaflet-popup')?.innerText || ''), 8000)
    assert.ok(/ABRIR TABLERO G-4/i.test(globo), 'el globo de la instalación: ' + globo)
    // (el globo puede cerrarse si la Mesa se redibuja justo entonces: se vuelve a tocar)
    for (let i = 0; i < 3 && !(await tablero(page).count()); i++) {
      const b = page.locator('.leaflet-popup').getByRole('button', { name: '📊 ABRIR TABLERO G-4' })
      if (!(await b.count())) {
        await page.mouse.click(x, y)
        await page.waitForTimeout(800)
      }
      if (await b.count()) await b.first().dispatchEvent('click')
      await page.waitForTimeout(600)
    }
    await tablero(page).waitFor({ timeout: 8000 })
    assert.equal(await tablero(page).getAttribute('data-tablero-g4'), 'ficha-a')

    // 📚 Documentos: adjuntar, consultar el texto, fragmentos y observaciones de A.
    await pestana(page, 'documentos')
    await tablero(page).locator('input[type=file]').setInputFiles({ name: 'referencia-prueba.txt', mimeType: 'text/plain', buffer: Buffer.from('Documento educativo: definición de una función institucional.') })
    await tablero(page).getByRole('status').filter({ hasText: 'Documento añadido' }).waitFor({ timeout: 10000 })
    // Un documento nuevo abre «📁 Ejercicios» para volver a confirmar la unidad considerada
    // (inicio-ejercicio): se cierra, como haría el oficial, y se sigue en el tablero.
    await page.locator('.sid-inicio-ejercicio').waitFor({ timeout: 5000 })
    await page.locator('button[title="Crear, abrir y guardar ejercicios"]').first().dispatchEvent('click')
    await page.locator('.sid-inicio-ejercicio').waitFor({ state: 'detached', timeout: 5000 })
    await campo(page, 'CONSULTAR TEXTO EXTRAÍDO', 'select').selectOption('0')
    assert.ok((await tablero(page).getByLabel('Texto extraído del documento').inputValue()).includes('función institucional'))
    await campo(page, 'FRAGMENTOS SELECCIONADOS').fill('referencia-prueba.txt, apartado 1: definición de una función institucional.')
    await campo(page, 'OBSERVACIONES DEL OFICIAL').fill('Nota exclusiva de A')
    assert.ok((await tablero(page).locator('details', { hasText: 'RESPUESTA DOCUMENTAL ANTERIOR' }).innerText()).includes('RESPUESTA DOCUMENTAL ANTERIOR'), 'la ficha de texto de antes sigue a la vista')
    await tablero(page).locator('details summary', { hasText: 'RESPUESTA DOCUMENTAL ANTERIOR' }).dispatchEvent('click')
    assert.ok((await tablero(page).locator('details', { hasText: 'RESPUESTA DOCUMENTAL ANTERIOR' }).innerText()).includes('Síntesis anterior de A'))
    const fd = await esperar(async () => {
      const us = await datosReact(page)
      const f = us?.find((u) => u.id === 'ficha-a')?.fichaDocumental
      return f?.observaciones === 'Nota exclusiva de A' && f.fragmentos ? f : null
    })
    assert.ok(fd, 'los fragmentos y las observaciones quedaron en la instalación A')

    // 🤖 IA: el pedido lleva todo; se copia; la respuesta de otra instalación no entra.
    await pestana(page, 'ia')
    await campo(page, 'TUS IDEAS PARA ESTA INSTALACIÓN').fill('Explicá la diferencia entre función y servicio.')
    await tablero(page).getByRole('button', { name: '⚙ GENERAR PEDIDO' }).dispatchEvent('click')
    const pedido = await tablero(page).getByLabel('Pedido a la IA').inputValue()
    for (const t of ['"instalacionId": "ficha-a"', 'referencia-prueba.txt, apartado 1', 'Nota exclusiva de A', 'función y servicio']) assert.ok(pedido.includes(t), `el pedido no trae «${t}»`)
    await tablero(page).getByRole('button', { name: '📋 COPIAR PEDIDO' }).dispatchEvent('click')
    assert.equal(await esperar(() => page.evaluate(() => navigator.clipboard.readText()), 3000), pedido)
    const respuesta = { version: 1, instalacionId: 'ficha-a', resumen: 'Síntesis educativa de A', recomendaciones: ['Recomendación de prueba A'], verificacion: [], riesgos: [], prioridades: [], niveles: {}, ajustes: {}, preguntas: ['¿Qué es una función?'] }
    const pegar = campo(page, 'PEGAR LA RESPUESTA DE LA IA')
    await pegar.fill(JSON.stringify({ ...respuesta, instalacionId: 'ficha-b' }))
    await tablero(page).getByRole('button', { name: '📊 PROYECTAR LA RESPUESTA' }).dispatchEvent('click')
    assert.ok((await tablero(page).getByRole('alert').innerText()).includes('otra instalación'))
    await pegar.fill(JSON.stringify(respuesta))
    await tablero(page).getByRole('button', { name: '📊 PROYECTAR LA RESPUESTA' }).dispatchEvent('click')
    const res = tablero(page).locator('[data-ia="con-respuesta"]')
    await res.waitFor({ timeout: 5000 })
    for (const t of ['PENDIENTE DE REVISIÓN', 'Síntesis educativa de A', 'Recomendación de prueba A']) assert.ok((await res.innerText()).toUpperCase().includes(t.toUpperCase()), `la respuesta proyectada no trae «${t}»`)
    await res.getByRole('button', { name: '✓ MARCAR COMO REVISADO' }).dispatchEvent('click')
    await res.locator('.sid-fi-revisado').waitFor({ timeout: 3000 })

    // La instalación B: lo de A no aparece; en texto libre el HTML es texto.
    await tablero(page).getByLabel('Instalación del tablero').selectOption('ficha-b')
    await esperar(async () => (await tablero(page).getAttribute('data-tablero-g4')) === 'ficha-b')
    await pestana(page, 'documentos')
    assert.equal(await campo(page, 'OBSERVACIONES DEL OFICIAL').inputValue(), '')
    assert.equal(await campo(page, 'FRAGMENTOS SELECCIONADOS').inputValue(), '')
    await pestana(page, 'ia')
    await campo(page, 'FORMATO DE LA RESPUESTA', 'select').selectOption('texto')
    await campo(page, 'PEGAR LA RESPUESTA DE LA IA').fill('Texto de B <img src=x onerror=alert(1)>')
    await tablero(page).getByRole('button', { name: '📊 PROYECTAR LA RESPUESTA' }).dispatchEvent('click')
    await tablero(page).locator('.sid-fi-texto').waitFor({ timeout: 5000 })
    assert.ok((await tablero(page).locator('.sid-fi-texto').innerText()).includes('<img'), 'el HTML se ve como texto')
    assert.equal(await tablero(page).locator('.sid-tg-ia-res img').count(), 0, 'y no se ejecuta')

    // Minimizar, ampliar y cerrar.
    await tablero(page).getByLabel('Minimizar el tablero').dispatchEvent('click')
    assert.equal(await tablero(page).locator('[data-pestana]').count(), 0)
    await tablero(page).getByLabel('Ampliar el tablero').dispatchEvent('click')
    assert.ok(await tablero(page).locator('[data-pestana]').count())
    await tablero(page).getByLabel('Cerrar el tablero').dispatchEvent('click')

    // 3D: tocar la instalación abre el tablero directo, con lo de A.
    await entrar3D(page)
    await page.evaluate((c) => {
      const lm = window.__espejo3d.lm
      const mk = Object.values(lm._layers).find((x) => x._icon && x.getLatLng && Math.abs(x.getLatLng().lng - c.lng) < 1e-8 && Math.abs(x.getLatLng().lat - c.lat) < 1e-8)
      if (!mk) throw Error('Marcador no encontrado en el 3D')
      mk.fire('click', { latlng: mk.getLatLng(), originalEvent: new MouseEvent('click') })
    }, a)
    await tablero(page).waitFor({ timeout: 8000 })
    assert.equal(await tablero(page).getAttribute('data-tablero-g4'), 'ficha-a')
    await pestana(page, 'documentos')
    assert.equal(await campo(page, 'OBSERVACIONES DEL OFICIAL').inputValue(), 'Nota exclusiva de A')
    await pestana(page, 'ia')
    assert.ok((await tablero(page).locator('[data-ia="con-respuesta"]').innerText()).includes('Síntesis educativa de A'))
    assert.equal(await tablero(page).locator('.sid-fi-revisado').count(), 1)
    await tablero(page).getByLabel('Cerrar el tablero').dispatchEvent('click')
    await salir3D(page)

    // Guardar el ejercicio, recargar y recuperarlo igual.
    const antes = await datosReact(page)
    assert.ok(antes.find((u) => u.id === 'ficha-b').tableroG4.resultadoIA.textoLibre.includes('Texto de B'))
    if (!(await page.getByRole('button', { name: /Guardar todo/ }).count())) await page.getByRole('button', { name: /^📁 / }).first().dispatchEvent('click')
    await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
    const guardado = await esperar(async () => {
      const g = await leerGuardado(page, d.nombre)
      return g?.unidades?.find((u) => u.id === 'ficha-a')?.tableroG4?.revisadoEn ? g : null
    })
    assert.ok(guardado, 'guardado con el ejercicio')
    const ga = guardado.unidades.find((u) => u.id === 'ficha-a')
    assert.equal(ga.tableroG4.resultadoIA.resumen, respuesta.resumen)
    assert.equal(ga.fichaDocumental.observaciones, 'Nota exclusiva de A')
    assert.equal(guardado.documentos[0].nombre, 'referencia-prueba.txt')
    await page.reload()
    await page.waitForTimeout(2000)
    await sembrarYAbrir(page, guardado)
    const recuperado = await datosReact(page)
    for (const id of ['ficha-a', 'ficha-b']) {
      const r = recuperado.find((u) => u.id === id)
      const v = antes.find((u) => u.id === id)
      assert.deepEqual(r.fichaDocumental, v.fichaDocumental, `${id}: lo documental se recuperó igual`)
      assert.deepEqual(r.tableroG4, v.tableroG4, `${id}: el tablero se recuperó igual`)
    }
    assert.deepEqual(m.errores, [])
    console.log('✔ 2D/3D: tablero de la instalación, documentos y texto extraído, fragmentos y observaciones por instalación, pedido a la IA y portapapeles, respuesta de otra instalación rechazada, JSON proyectado y revisado, texto seguro, guardado y recuperación')
  } catch (e) {
    await page.screenshot({ path: '/tmp/ficha-documental-error.png' }).catch(() => {})
    console.error('errores de consola:', m.errores)
    throw e
  } finally {
    await m.cerrar()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
