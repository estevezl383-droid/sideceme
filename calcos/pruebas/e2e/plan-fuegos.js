// Plan de fuegos en la pestaña «🔥 Fuegos» del Tablero del G-3.
//
// Corre la Mesa del EM de verdad en Chromium (sin red: ver navegador.js) con un
// ejercicio de unidades ficticias: una FT que lleva una batería de artillería
// (consolidada en el calco) y dos fichas enemigas, una cerca y otra lejos.
//
//   cd calcos/pruebas && node e2e/plan-fuegos.js
//
// Lo que se comprueba es lo que pidió Sergio el 28-09:
//   · las armas de artillería y de apoyo de la FT aparecen y se les puede ver
//     el alcance en la carta;
//   · con la pestaña de fuegos abierta, tocar la carta NO activa el Área de
//     Operaciones (ni sus puntos blancos para arrastrar), y se pueden marcar
//     concentraciones encima de ella, en 2D y en 3D;
//   · las concentraciones fuera de alcance quedan en fucsia y vuelven a negro
//     al acercar la pieza;
//   · cada concentración lleva coordenadas, tipo de fuego, etc., se guarda con
//     el ejercicio y se vuelve a abrir;
//   · la lista de blancos sale en Word y llena la Matriz de ejecución.
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { abrir, sembrarYAbrir, leerGuardado, entrar3D, aPantalla } = require('./navegador')
const { ejercicioFuegos } = require('../ejercicio-fuegos')

// node e2e/plan-fuegos.js <carpeta> → deja capturas de pantalla en esa carpeta.
const CAPTURAS = process.argv[2] ? path.resolve(process.argv[2]) : null
async function captura(page, nombre) {
  if (!CAPTURAS) return
  fs.mkdirSync(CAPTURAS, { recursive: true })
  await page.screenshot({ path: path.join(CAPTURAS, `fuegos-${nombre}.png`) })
}

let fallas = 0
async function caso(nombre, fn) {
  try {
    await fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

// Puntos del ejercicio [lng, lat].
// Con el encuadre de la prueba ninguno cae debajo de una ficha ni de un panel.
const P = {
  enAO: [-65.09, -16.99], // dentro del Área de Operaciones (y del arco enemigo), lejos de las fichas
  cerca: [-65.06, -16.995], // a unos 4 km de la batería de la FT: la alcanza
  lejos: [-65.2, -16.8], // a unos 30 km de toda la artillería propia: fuera de alcance
  nuevaPos: [-65.12, -16.92], // posición de fuego adelantada desde la que sí llega (a unos 16 km)
  muyCerca: [-65.05, -17.0], // a 1,2 km de «cerca»: dentro del alcance mínimo del obús (2,1 km)
  atras: [-65.045, -17.025], // «cerca» a 3,7 km (bien) y «lejos» a unos 30 km (no llega)
}

// El plan que la Mesa le pasó al módulo (después de cada cambio de React).
const planFuegos = (page) => page.evaluate(() => window.MesaFuegos && window.MesaFuegos.plan)
const tooltipsAO = (page) => page.evaluate(() => [...document.querySelectorAll('.tt-medida')].filter((t) => /arrastrá los puntos/.test(t.textContent)).length)
const fucsias = (page) => page.locator('.pf-marca.pf-fuera').count()

async function esperar(page, leer, cumple, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (cumple(v) || Date.now() - t0 > ms) return v
    await page.waitForTimeout(250)
  }
}

async function encuadrar(page) {
  const ocultar = page.getByText('▼ ocultar')
  if (await ocultar.count()) await ocultar.first().click().catch(() => {})
  await page.evaluate(() => {
    window.__lm2d = window.__mapa2d
    window.__mapa2d.setView([-16.93, -65.06], 11.5, { animate: false })
  })
  await page.waitForTimeout(900)
}

async function abrirTablero(page, pestana) {
  if (!(await page.getByText('⚔️ Tablero del G-3').count())) {
    await page.getByRole('button', { name: /G-3 Operaciones/i }).first().dispatchEvent('click')
    await page.getByText('⚔️ Tablero del G-3').waitFor()
  }
  await page.getByRole('button', { name: pestana, exact: true }).click()
  await page.waitForTimeout(700)
}

async function clicCarta(page, punto) {
  const [xy] = await aPantalla(page, [punto])
  await page.mouse.click(...xy)
  await page.waitForTimeout(700)
}

async function escritorio() {
  const { page, errores, cerrar } = await abrir()
  try {
    await sembrarYAbrir(page, ejercicioFuegos())
    await encuadrar(page)

    await caso('Sin la pestaña de fuegos, tocar el Área de Operaciones la selecciona (control de la prueba)', async () => {
      await abrirTablero(page, '🎯 Unidades')
      await clicCarta(page, P.enAO)
      assert.ok((await tooltipsAO(page)) > 0, 'no se seleccionó el Área de Operaciones: la prueba no mide nada')
      assert.ok((await page.locator('.leaflet-marker-draggable').count()) > 0, 'sin los puntos para arrastrar')
    })

    await caso('La pestaña «🔥 Fuegos» monta el plan de fuegos y deselecciona el Área de Operaciones', async () => {
      await abrirTablero(page, '🔥 Fuegos')
      await page.locator('.pf').waitFor()
      assert.strictEqual(await tooltipsAO(page), 0, 'el Área de Operaciones sigue seleccionada con sus puntos blancos')
      const t = await page.locator('.pf').innerText()
      assert.match(t, /Modo fuegos/)
      assert.doesNotMatch(t, /0 piezas de apoyo/)
    })

    await caso('Las armas de artillería y de apoyo de la FT aparecen, con su sistema y su alcance', async () => {
      const grupo = page.locator('.pf-grupo', { hasText: 'FT «ÁGUILA» (FICT.)' })
      const t = await grupo.innerText()
      assert.match(t, /ART 1/)
      assert.match(t, /19\.8 km/) // Obús 105 mm M-101 de su G.A. (catálogo de la Mesa)
      assert.match(t, /mín\. 2\.1 km/)
      assert.match(t, /Armas de apoyo orgánicas/)
      assert.match(t, /3 km/) // mortero 81 mm del batallón
    })

    await caso('Con la pestaña abierta, tocar el Área de Operaciones no la activa', async () => {
      await clicCarta(page, P.enAO)
      assert.strictEqual(await tooltipsAO(page), 0, 'se activó el Área de Operaciones')
      const p = await planFuegos(page)
      assert.ok(!p || !p.blancos.length, 'marcó una concentración sin pedirlo')
    })

    await caso('Marcar el alcance de la batería de la FT lo dibuja en la carta', async () => {
      const antes = await page.evaluate(() => document.querySelectorAll('.pf-rot-anillo').length)
      await page.locator('.pf-medio', { hasText: 'ART 1' }).locator('input[data-acc="ver"]').check()
      await page.waitForFunction((n) => document.querySelectorAll('.pf-rot-anillo').length > n, antes)
      assert.match(await page.locator('.pf-rot-anillo').first().innerText(), /ART 1 · FT «ÁGUILA» \(FICT\.\) · 19\.8 km \(mín\. 2\.1 km\)/)
      const p = await planFuegos(page)
      assert.ok(p.medios['pieza:fict-charlie-1'] && p.medios['pieza:fict-charlie-1'].ver)
    })

    await caso('Concentraciones marcadas encima del Área de Operaciones: la cercana en negro, la lejana en fucsia', async () => {
      await page.locator('[data-acc="marcar"]').click()
      assert.ok(await page.locator('.pf-cartel').count(), 'sin el cartel de «Tocá la carta…»')
      await clicCarta(page, P.cerca)
      await page.waitForTimeout(400)
      await clicCarta(page, P.lejos)
      const p = await esperar(page, planFuegos, (v) => v && v.blancos.length === 2)
      assert.deepStrictEqual(p.blancos.map((b) => b.num), ['AB-010', 'AB-011'])
      assert.strictEqual(await tooltipsAO(page), 0, 'se activó el Área de Operaciones')
      await page.locator('[data-acc="terminar"]').first().click()
      assert.strictEqual(await page.locator('.pf-marca').count(), 2)
      assert.strictEqual(await fucsias(page), 1, 'tendría que haber UNA concentración fucsia (la lejana)')
      const lejana = page.locator('.pf-blanco', { hasText: 'AB-011' })
      assert.match(await lejana.innerText(), /FUERA DE ALCANCE — Ningún medio lo alcanza desde donde está: .* tiene que acercarse/)
      assert.match(await page.locator('.pf-blanco', { hasText: 'AB-010' }).innerText(), /Lo alcanzan/)
      await captura(page, '1-concentraciones')
    })

    await caso('La concentración lleva coordenadas, cota, tipo de fuego y los demás datos, y se guardan', async () => {
      await page.locator('.pf-blanco', { hasText: 'AB-010' }).click()
      const ed = page.locator('.pf-editor')
      await ed.waitFor()
      const t = await ed.innerText()
      // (los rótulos salen en mayúsculas por CSS)
      assert.match(t, /MGRS\s+20K KG \d{5} \d{5}/i)
      assert.match(t, /UTM WGS-84\s+Zona 20K · E [\d ]+ · N [\d ]+/i)
      assert.match(t, /Geográficas\s+16°59'\d\d,\d" S · 65°03'\d\d,\d" O/i)
      await esperar(page, planFuegos, (v) => v && v.blancos[0].cota != null)
      assert.notStrictEqual(await ed.locator('input[data-k="cota"]').inputValue(), '', 'sin cota')
      await ed.locator('input[data-k="descripcion"]').fill('Sección de morteros enemiga (FICT.)')
      await ed.locator('input[data-k="descripcion"]').press('Tab')
      await ed.locator('select[data-k="tipo"]').selectOption('contrabateria')
      await ed.locator('select[data-k="efecto"]').selectOption('destruir')
      await ed.locator('select[data-k="forma"]').selectOption('rectangular')
      await page.locator('.pf-editor input[data-k="largoM"]').fill('600')
      await page.locator('.pf-editor input[data-k="largoM"]').press('Tab')
      await page.locator('.pf-editor select[data-k="medio"]').selectOption('pieza:fict-charlie-1')
      await page.locator('.pf-editor select[data-k="ejecucion"]').selectOption('programado')
      await page.locator('.pf-editor input[data-k="hora"]').fill('H-10 a H-5')
      await page.locator('.pf-editor input[data-k="observador"]').fill('OA de la FT')
      await page.locator('.pf-editor input[data-k="observador"]').press('Tab')
      const p = await esperar(page, planFuegos, (v) => v && v.blancos[0].observador === 'OA de la FT')
      const b = p.blancos[0]
      assert.deepStrictEqual(
        [b.descripcion, b.tipo, b.efecto, b.forma, b.largoM, b.medio, b.ejecucion, b.hora, b.observador],
        ['Sección de morteros enemiga (FICT.)', 'contrabateria', 'destruir', 'rectangular', 600, 'pieza:fict-charlie-1', 'programado', 'H-10 a H-5', 'OA de la FT'],
      )
      assert.match(await page.locator('.pf-editor .pf-estado').innerText(), /ART 1 \(FT «ÁGUILA» \(FICT\.\)\) lo alcanza/)
      await captura(page, '2-editor')
      await page.locator('[data-acc="cerrar-ed"]').click()
    })

    await caso('Al acercar la posición de fuego de la batería, la concentración fucsia vuelve a negro', async () => {
      await page.locator('.pf-medio', { hasText: 'ART 1' }).locator('[data-acc="ubicar"]').click()
      await clicCarta(page, P.nuevaPos)
      await esperar(page, fucsias, (n) => n === 0, 8000)
      assert.strictEqual(await fucsias(page), 0, 'la concentración lejana sigue fucsia')
      assert.match(await page.locator('.pf-medio', { hasText: 'ART 1' }).innerText(), /posición de fuego puesta por el G-3/)
    })

    // La batería de la FT es la primera posición de fuego (su organización va primero).
    async function arrastrarBateria(destinoLL) {
      const box = await page.locator('.pf-pos').first().boundingBox()
      const [destino] = await aPantalla(page, [destinoLL])
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move((box.x + destino[0]) / 2, (box.y + destino[1]) / 2, { steps: 5 })
      await page.mouse.move(destino[0], destino[1], { steps: 5 })
      await page.mouse.up()
      const p = await esperar(page, planFuegos, (v) => {
        const pos = v && v.medios['pieza:fict-charlie-1'].pos
        return pos && Math.abs(pos[0] - destinoLL[0]) < 0.01 && Math.abs(pos[1] - destinoLL[1]) < 0.01
      })
      const pos = p.medios['pieza:fict-charlie-1'].pos
      assert.ok(Math.abs(pos[0] - destinoLL[0]) < 0.01 && Math.abs(pos[1] - destinoLL[1]) < 0.01, 'posición arrastrada: ' + JSON.stringify(pos))
    }

    await caso('Arrastrar la posición de fuego demasiado cerca: la concentración queda dentro del alcance mínimo (fucsia)', async () => {
      await arrastrarBateria(P.muyCerca)
      await esperar(page, fucsias, (n) => n === 2, 8000)
      assert.strictEqual(await fucsias(page), 2)
      assert.match(await page.locator('.pf-blanco', { hasText: 'AB-010' }).innerText(), /dentro de su alcance mínimo \(2\.1 km\): tiene que alejarse/)
    })

    await caso('Arrastrarla más atrás: la cercana vuelve a negro y la lejana queda fucsia', async () => {
      await arrastrarBateria(P.atras)
      await esperar(page, fucsias, (n) => n === 1, 8000)
      assert.strictEqual(await fucsias(page), 1)
      assert.match(await page.locator('.pf-blanco', { hasText: 'AB-011' }).getAttribute('class'), /pf-fuera/)
    })

    await caso('Blancos enemigos del calco: el que ninguna pieza alcanza queda en fucsia, con cuánto hay que acercarse', async () => {
      const lejos = page.locator('.pf-eno', { hasText: 'CÍA. LOG. (FICT.)' })
      assert.match(await lejos.getAttribute('class'), /pf-fuera/)
      assert.match(await lejos.innerText(), /✗ fuera de alcance[\s\S]*tiene que acercarse/)
      assert.match(await page.locator('.pf-eno', { hasText: 'CÍA. MORT. (FICT.)' }).innerText(), /✓ batible[\s\S]*ART 1/)
      assert.ok((await page.locator('.pf-eno-fuera').count()) >= 1, 'no se marcó en la carta el enemigo fuera de alcance')
    })

    await caso('La lista de blancos sale en Word con coordenadas y la marca de fuera de alcance', async () => {
      const [descarga] = await Promise.all([page.waitForEvent('download'), page.locator('[data-acc="word"]').click()])
      const f = await descarga.path()
      const html = fs.readFileSync(f, 'utf8')
      assert.match(descarga.suggestedFilename(), /^Lista_de_blancos_EJEMPLO_FUEGOS\.doc$/)
      assert.match(html, /LISTA DE BLANCOS Y CALCO DE CONCENTRACIONES/)
      assert.match(html, /AB-010[\s\S]*20K KG[\s\S]*Contrabatería[\s\S]*Destruir/)
      assert.match(html, /<tr class="fuera"><td>2<\/td><td>AB-011/)
      assert.match(html, /Posiciones de fuego/)
    })

    await caso('La «Matriz de ejecución de apoyo de fuegos» se llena con las concentraciones', async () => {
      await abrirTablero(page, '📄 Documentos')
      await page.getByRole('button', { name: /Analizar los cursos de acción \(Juego de Guerra\)/ }).first().click()
      await page.getByText('Matriz de ejecución de apoyo de fuegos', { exact: false }).first().click()
      await page.getByRole('button', { name: /Traer del calco lo que falte/ }).click()
      await page.waitForTimeout(800)
      const valores = await page.evaluate(() => [...document.querySelectorAll('input, textarea')].map((x) => x.value).join('\n'))
      assert.match(valores, /AB-010 — Sección de morteros enemiga \(FICT\.\) · 20K KG/)
      assert.match(valores, /AB-011 — .*⚠|SIN MEDIO QUE LO ALCANCE|FUERA DE ALCANCE/)
      await page.getByRole('button', { name: /Volver a mis documentos/ }).click()
    })

    await caso('Al dejar la pestaña de fuegos la carta vuelve a lo normal (el Área de Operaciones se selecciona)', async () => {
      await abrirTablero(page, '🎯 Unidades')
      await page.waitForTimeout(500)
      assert.strictEqual(await page.locator('.pf-pos.leaflet-marker-draggable').count(), 0, 'quedaron las posiciones de fuego arrastrables')
      assert.strictEqual(await page.locator('.pf-pos').count(), 1, 'sólo queda la posición de la pieza con el alcance marcado')
      assert.strictEqual(await page.locator('.pf-marca').count(), 2, 'las concentraciones tienen que quedar en la carta')
      await clicCarta(page, P.enAO)
      assert.ok((await tooltipsAO(page)) > 0, 'el Área de Operaciones ya no se selecciona')
    })

    let guardado
    await caso('El plan se guarda con el ejercicio', async () => {
      guardado = await esperar(page, (p) => leerGuardado(p, 'EJEMPLO FUEGOS'), (d) => d && d.planFuegos && d.planFuegos.blancos.length === 2, 30000)
      assert.ok(guardado && guardado.planFuegos, 'no se guardó planFuegos')
      assert.deepStrictEqual(guardado.planFuegos.blancos.map((b) => b.num), ['AB-010', 'AB-011'])
      assert.strictEqual(guardado.planFuegos.blancos[0].tipo, 'contrabateria')
    })

    await caso('En 3D: las concentraciones se ven y se marcan encima del Área de Operaciones sin activarla', async () => {
      await abrirTablero(page, '🔥 Fuegos')
      await entrar3D(page)
      await page.evaluate(() => {
        window.__lm2d = window.__espejo3d.lm
        window.__map3d.jumpTo({ center: [-65.06, -16.95], zoom: 10.3, pitch: 30, bearing: 0 })
      })
      await page.waitForTimeout(3000)
      assert.strictEqual(await page.locator('.m3d-mk .pf-marca').count(), 2, 'las cruces no pasaron al 3D')
      await page.locator('[data-acc="marcar"]').click()
      await clicCarta(page, P.enAO)
      const p = await esperar(page, planFuegos, (v) => v && v.blancos.length === 3)
      assert.strictEqual(p.blancos.length, 3)
      assert.strictEqual(p.blancos[2].num, 'AB-012')
      assert.strictEqual(await tooltipsAO(page), 0, 'se activó el Área de Operaciones en 3D')
      await page.keyboard.press('Escape')
      await captura(page, '3-en-3d')
    })

    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
    return guardado
  } finally {
    await cerrar()
  }
}

async function reabrir(guardado) {
  const { page, errores, cerrar } = await abrir()
  try {
    await caso('Al volver a abrir el ejercicio aparecen sus concentraciones y los alcances marcados', async () => {
      await sembrarYAbrir(page, { ...guardado, nombre: 'EJEMPLO FUEGOS' })
      await encuadrar(page)
      await page.waitForFunction(() => document.querySelectorAll('.pf-marca').length === 2)
      assert.strictEqual(await page.locator('.pf-rot-anillo').count(), 1, 'el alcance marcado no se volvió a dibujar')
      await abrirTablero(page, '🔥 Fuegos')
      assert.match(await page.locator('.pf').innerText(), /AB-010[\s\S]*Contrabatería · Destruir[\s\S]*AB-011/)
    })
    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

async function telefono() {
  const { page, errores, cerrar } = await abrir({ ancho: 390, alto: 844, movil: true })
  try {
    await caso('Teléfono: la pestaña de fuegos entra sin desborde horizontal', async () => {
      await sembrarYAbrir(page, ejercicioFuegos())
      await page.getByRole('button', { name: /G-3 Operaciones/i }).first().dispatchEvent('click')
      await page.getByRole('button', { name: '🔥 Fuegos', exact: true }).dispatchEvent('click')
      await page.locator('.pf').waitFor()
      const d = await page.evaluate(() => {
        const el = document.querySelector('.pf')
        return { sw: el.scrollWidth, cw: el.clientWidth, doc: document.documentElement.scrollWidth, vw: window.innerWidth }
      })
      assert.ok(d.sw <= d.cw + 1, 'el panel desborda: ' + JSON.stringify(d))
      await captura(page, '4-telefono')
    })
    assert.deepStrictEqual(errores, [], 'errores de JavaScript: ' + errores.join(' | '))
  } finally {
    await cerrar()
  }
}

;(async () => {
  console.log('\nPlan de fuegos · pestaña «🔥 Fuegos» del Tablero del G-3\n')
  const guardado = await escritorio()
  if (guardado) await reabrir(guardado)
  await telefono()
  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
