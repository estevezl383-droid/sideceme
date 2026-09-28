// 🎓 Estudio doctrinario en la Mesa del EM, de punta a punta en Chromium, con
// el ejercicio de unidades FICTICIAS:
//   · la organización de la tarea que ya existía se sigue cargando (mismos id),
//   · fuerza de tarea y unidad pura conviven; el docente cambia la pertenencia,
//   · nunca queda un elemento repetido y un repetido viejo se corrige,
//   · actividades académicas vinculadas a mano, guardadas con el ejercicio,
//   · el panel «🧩 Organización de la tarea» de siempre ve la unidad pura,
//   · sólo lectura para los puestos (cursantes), láminas y fichas de simbología,
//   · escritorio y teléfono (sin desbordes horizontales), sin errores de JS.
//
//   cd calcos/pruebas && node e2e/academico.js [carpeta-para-capturas]
const assert = require('assert')
const path = require('path')
const { abrir, estadoReact, sembrarYAbrir, leerGuardado } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const CAPTURAS = process.argv[2] ? path.resolve(process.argv[2]) : null
const captura = async (page, nombre) => CAPTURAS && page.screenshot({ path: path.join(CAPTURAS, `${nombre}.png`) })

const leerOrg = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.length && v.every((o) => o && typeof o.id === 'string' && o.id.startsWith('ag-') && Array.isArray(o.piezas)) ? v : undefined))
const leerAcad = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v.version === 1 && Array.isArray(v.actividades) ? v : undefined))
const leerUnidades = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.length && v.every((u) => u && 'bando' in u && 'lat' in u) ? v : undefined))

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

async function esperar(page, leer, cumple, ms = 15000) {
  const t0 = Date.now()
  let v
  for (;;) {
    v = await leer(page)
    if (cumple(v) || Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

async function abrirEstudio(page, pestana) {
  await page.getByRole('button', { name: '🎓 Estudio' }).first().dispatchEvent('click')
  await page.locator('.ac-fondo').waitFor()
  if (pestana === 'simb') await page.getByRole('tab', { name: /Simbología doctrinaria/ }).click()
  await page.waitForTimeout(400)
}

const sinDesborde = (page) =>
  page.evaluate(() => {
    const f = document.querySelector('.ac-fondo')
    const c = document.querySelector('.ac-cuerpo')
    return { fondo: f.scrollWidth <= f.clientWidth + 1, cuerpo: c.scrollWidth <= c.clientWidth + 1 }
  })

async function docente() {
  const { page, errores, cerrar } = await abrir()
  page.on('dialog', (d) => d.accept())
  try {
    await sembrarYAbrir(page, ejercicioFicticio())
    await abrirEstudio(page)
    await captura(page, 'escritorio-organizacion-inicial')

    await caso('Se carga la organización que ya existía, con sus identificadores', async () => {
      const ids = await page.locator('.ac-id').allInnerTexts()
      assert.deepStrictEqual(ids, ['id ag-1700000000000-0', 'id ag-1700000000000-1'])
      assert.deepStrictEqual(await page.locator('.ac-org .ac-chip-clase').allInnerTexts(), ['FT', 'AGR'])
      const org = await leerOrg(page)
      assert.deepStrictEqual(org.map((o) => [o.id, o.piezas.length]), [['ag-1700000000000-0', 3], ['ag-1700000000000-1', 1]])
      assert.ok(await page.locator('.ac-valid.bien').count(), 'no dice «sin duplicados»')
    })

    let idPura = null
    await caso('Fuerza de tarea y unidad pura de artillería conviven', async () => {
      await page.getByRole('button', { name: '＋ Unidad pura' }).click()
      let org = await esperar(page, leerOrg, (o) => o && o.length === 3)
      idPura = org[2].id
      assert.match(idPura, /^ag-\d+-2$/)
      const nombre = page.locator(`input[data-org="${idPura}"]`)
      await nombre.fill('ARTILLERÍA «CHARLIE» (FICT.)')
      await nombre.press('Enter')
      await page.locator(`select[data-acc="org-arma"][data-org="${idPura}"]`).selectOption('artilleria')
      for (const n of [1, 2, 3]) {
        await page.locator(`select[data-pieza="fict-charlie-${n}"]`).selectOption(idPura)
        await page.waitForTimeout(300)
      }
      org = await esperar(page, leerOrg, (o) => o && o[2] && o[2].piezas.length === 3)
      const p = org[2]
      assert.deepStrictEqual([p.clase, p.ft, p.arma, p.nombre, p.piezas.map((x) => x.id)], ['pura', false, 'artilleria', 'ARTILLERÍA «CHARLIE» (FICT.)', ['fict-charlie-1', 'fict-charlie-2', 'fict-charlie-3']])
      assert.strictEqual(org[0].ft, true)
      const resumen = await page.locator('.ac-resumen').innerText()
      assert.match(resumen, /1\s+fuerza\(s\) de tarea/)
      assert.match(resumen, /1\s+unidad\(es\) pura\(s\)/)
      assert.ok(await page.locator('.ac-valid.bien').count(), 'aparecieron problemas')
    })

    await caso('Tipo y pertenencia separados: el tipo no cambia al mover el elemento', async () => {
      const fila = page.locator('.ac-tr', { has: page.locator('select[data-pieza="fict-charlie-1"]') })
      assert.match(await fila.locator('.ac-td-tipo').innerText(), /Artillería · Sección/)
      assert.strictEqual(await page.locator('select[data-pieza="fict-charlie-1"]').inputValue(), idPura)
    })

    await caso('El docente mueve un elemento y nunca queda en dos organizaciones', async () => {
      await page.locator('select[data-pieza="fict-alfa-3"]').selectOption('ag-1700000000000-0') // de CÓNDOR a ÁGUILA
      await page.locator('select[data-pieza="fict-bravo-1"]').selectOption('') // vuelve a su unidad
      const org = await esperar(page, leerOrg, (o) => o && !o[1].piezas.length && !o[0].piezas.some((p) => p.id === 'fict-bravo-1'))
      const donde = (id) => org.filter((o) => o.piezas.some((p) => p.id === id)).map((o) => o.id)
      assert.deepStrictEqual(donde('fict-alfa-3'), ['ag-1700000000000-0'])
      assert.deepStrictEqual(donde('fict-bravo-1'), [])
      assert.match(await page.locator('.ac-valid').innerText(), /todavía no tiene elementos/)
    })

    await caso('Actividad académica: valida, se agrega, se edita', async () => {
      await page.getByRole('button', { name: 'Agregar actividad' }).click()
      const err = await page.locator('.ac-errores li').allInnerTexts()
      assert.deepStrictEqual(err, ['Elegí a qué unidad u organización se vincula.', 'Poné un título.'])
      await page.locator('select[data-campo="vinculo"]').selectOption('unidad:fict-delta')
      await page.locator('select[data-campo="tipo"]').selectOption('analisis')
      await page.locator('input[data-campo="titulo"]').fill('¿Por qué sigue con su unidad?')
      await page.locator('textarea[data-campo="texto"]').fill('Explicá con tus palabras.')
      await page.getByRole('button', { name: 'Agregar actividad' }).click()
      let acad = await esperar(page, leerAcad, (a) => a && a.actividades.length === 1)
      assert.deepStrictEqual(acad.actividades[0].vinculo, { tipo: 'unidad', id: 'fict-delta' })
      assert.match(await page.locator('.ac-act-grupo').innerText(), /B\. ING\. «DELTA» \(FICT\.\)[\s\S]*¿Por qué sigue con su unidad\?/)
      await page.getByRole('button', { name: '✎ Editar' }).click()
      await page.locator('input[data-campo="titulo"]').fill('Una unidad que no se integró')
      await page.getByRole('button', { name: 'Guardar cambios' }).click()
      acad = await esperar(page, leerAcad, (a) => a && a.actividades[0].titulo === 'Una unidad que no se integró')
      assert.strictEqual(acad.actividades[0].tipo, 'analisis')
      await captura(page, 'escritorio-organizacion-editada')
    })

    await caso('Todo queda guardado con el ejercicio (id viejos, clases y actividades)', async () => {
      // El autoguardado espera 2,5 s sin cambios: se espera la versión con la edición.
      const g = await esperar(
        page,
        (p) => leerGuardado(p, 'EJEMPLO FICTICIO'),
        (d) => d && d.academico && d.academico.actividades.length === 1 && d.academico.actividades[0].titulo === 'Una unidad que no se integró' && d.orgTarea.length === 3,
        30000,
      )
      assert.deepStrictEqual(g.orgTarea.map((o) => o.id), ['ag-1700000000000-0', 'ag-1700000000000-1', idPura])
      assert.deepStrictEqual(g.orgTarea.map((o) => [o.operacion, o.ft]), [['od', true], ['oc1', false], ['', false]])
      assert.strictEqual(g.orgTarea[2].clase, 'pura')
      assert.strictEqual(g.academico.actividades[0].titulo, 'Una unidad que no se integró')
    })

    await caso('«🧩 Organización de la tarea» (el panel de siempre) ve la unidad pura y no obliga a repartir', async () => {
      await page.locator('.ac-cerrar').click()
      await page.getByRole('button', { name: /G-3 Operaciones/i }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /ARMAR AGRUPACIONES TÁCTICAS/i }).first().click()
      const panel = page.locator('div', { hasText: '🧩 ORGANIZACIÓN DE LA TAREA' }).last()
      await panel.waitFor()
      assert.ok(await page.getByText('PURA', { exact: true }).count(), 'no aparece la marca PURA')
      assert.ok(await page.getByText('FT', { exact: true }).count(), 'no aparece la marca FT')
      assert.ok(await page.getByText(/siguen con su unidad orgánica \(no es obligatorio repartirlas\)/).count())
      await captura(page, 'escritorio-organizacion-de-la-tarea')
      await page.getByRole('button', { name: '✕ Cerrar' }).first().click()
    })

    await caso('Simbología: láminas sin carta y fichas con su referencia', async () => {
      await abrirEstudio(page, 'simb')
      assert.match(await page.locator('.ac-sello').innerText(), /MATERIAL DIDÁCTICO · sin carta ni coordenadas/i)
      await page.getByRole('button', { name: /Símbolos de unidad abreviados/ }).click()
      await page.locator('.ac-tile', { hasText: 'Sanidad' }).click()
      const f = await page.locator('.ac-ficha').innerText()
      assert.match(f, /EAA-15-29/)
      assert.match(f, /Figura 6 — Símbolos de Unidad Abreviados/)
      assert.match(f, /SIN VERIFICAR/i)
      assert.match(f, /Pendiente de verificación/)
      assert.strictEqual(await page.locator('.ac-hoja .leaflet-container, .ac-hoja .maplibregl-map').count(), 0)
      await captura(page, 'escritorio-simbologia-ficha')
      await page.getByRole('button', { name: /Consultas pendientes/ }).click()
      await page.locator('.ac-tile', { hasText: 'Cruz negra' }).click()
      const c = await page.locator('.ac-ficha').innerText()
      assert.match(c, /NO VERIFICABLE/i)
      assert.match(c, /sin documento citado/)
      assert.match(c, /plan de blancos/)
      await page.locator('input[data-acc="buscar"]').fill('zanja')
      assert.deepStrictEqual(await page.locator('.ac-tile .ac-tile-nom').allInnerTexts(), ['Zanja antitanque (ZAT)'])
    })

    await caso('Sin errores de JavaScript', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

async function recarga() {
  // Mismo navegador «limpio»: se siembra lo que quedó guardado y se vuelve a abrir.
  const { page, errores, cerrar } = await abrir()
  try {
    const d = ejercicioFicticio()
    d.orgTarea.push({ id: 'ag-1800000000000-2', nombre: 'PURA «X» (FICT.)', escalon: 'batallon', operacion: '', tarea: '', proposito: '', ft: false, clase: 'pura', arma: 'ingenieria', piezas: [] })
    d.academico = { version: 1, actividades: [{ id: 'act-1-a', vinculo: { tipo: 'organizacion', id: 'ag-1800000000000-2' }, tipo: 'lectura', titulo: 'Leer', texto: '', referencia: 'Documento, página', creada: '2026-09-27T00:00:00.000Z' }] }
    await sembrarYAbrir(page, d)
    await abrirEstudio(page)
    await caso('Al abrir el ejercicio de nuevo están la unidad pura y la actividad', async () => {
      assert.deepStrictEqual(await page.locator('.ac-org .ac-chip-clase').allInnerTexts(), ['FT', 'AGR', 'PURA'])
      assert.match(await page.locator('.ac-act').innerText(), /Leer[\s\S]*Documento, página/)
    })
    await caso('Sin errores de JavaScript (recarga)', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

async function repetidoViejo() {
  const { page, errores, cerrar } = await abrir()
  try {
    const d = ejercicioFicticio()
    d.nombre = 'EJEMPLO FICTICIO REPETIDO'
    d.orgTarea[1].piezas.push(d.orgTarea[0].piezas[0]) // INF 1 en ÁGUILA y en CÓNDOR
    await sembrarYAbrir(page, d)
    await abrirEstudio(page)
    await caso('Un elemento repetido de antes se avisa y se corrige con un botón', async () => {
      assert.ok(await page.locator('.ac-valid.mal').count(), 'no avisó')
      assert.match(await page.locator('.ac-valid').innerText(), /INF 1 de B\.I\. «ALFA» \(FICT\.\) figura a la vez en/)
      assert.ok(await page.locator('.ac-tr.ac-rep').count(), 'no marcó la fila')
      await page.getByRole('button', { name: 'Dejarla sólo en «FT «ÁGUILA» (FICT.)»' }).click()
      const org = await esperar(page, leerOrg, (o) => o && o[1].piezas.length === 1)
      assert.deepStrictEqual(org.map((o) => o.piezas.map((p) => p.id)), [['fict-alfa-1', 'fict-alfa-2', 'fict-bravo-1'], ['fict-alfa-3']])
      assert.ok(await page.locator('.ac-valid.bien').count())
    })
    await caso('Sin errores de JavaScript (repetido)', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

async function soloLectura() {
  const { page, errores, cerrar } = await abrir({ consulta: '?puesto=g3' })
  try {
    const d = ejercicioFicticio()
    d.academico = { version: 1, actividades: [{ id: 'act-1-b', vinculo: { tipo: 'unidad', id: 'fict-charlie' }, tipo: 'pregunta', titulo: 'Pregunta de prueba', texto: '', referencia: '', creada: '2026-09-27T00:00:00.000Z' }] }
    await sembrarYAbrir(page, d)
    await abrirEstudio(page)
    await caso('Un puesto (cursante) ve todo pero no edita', async () => {
      assert.match(await page.locator('.ac-fila-modo').innerText(), /Sólo lectura/)
      assert.strictEqual(await page.locator('select[data-acc="pertenencia"]').count(), 0)
      assert.strictEqual(await page.getByRole('button', { name: '＋ Fuerza de tarea' }).count(), 0)
      assert.strictEqual(await page.locator('form.ac-form').count(), 0)
      assert.match(await page.locator('.ac-act').innerText(), /Pregunta de prueba/)
      assert.strictEqual(await page.getByRole('button', { name: '✎ Editar' }).count(), 0)
    })
    await caso('Sin errores de JavaScript (sólo lectura)', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

async function ejemplo() {
  const { page, errores, cerrar } = await abrir()
  page.on('dialog', (d) => d.accept())
  try {
    await abrirEstudio(page)
    await caso('Calco vacío: estado vacío y ejemplo con unidades ficticias', async () => {
      assert.match(await page.locator('.ac-vacio').innerText(), /No hay unidades propias en el calco/)
      await page.getByRole('button', { name: /Cargar un ejemplo con unidades ficticias/ }).click()
      const org = await esperar(page, leerOrg, (o) => o && o.length === 2)
      const unidades = await leerUnidades(page)
      const acad = await leerAcad(page)
      assert.deepStrictEqual(unidades.map((u) => u.designacion), ['B.I. «ALFA» (FICT.)', 'R.C. «BRAVO» (FICT.)', 'G.A. «CHARLIE» (FICT.)', 'B. ING. «DELTA» (FICT.)'])
      assert.ok(unidades.every((u) => u.ficticia))
      assert.deepStrictEqual(org.map((o) => o.clase), ['ft', 'pura'])
      assert.strictEqual(acad.actividades.length, 3)
      assert.ok(await page.locator('.ac-valid.bien').count())
      await captura(page, 'escritorio-ejemplo-ficticio')
    })
    await caso('Sin errores de JavaScript (ejemplo)', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

async function telefono() {
  const { page, errores, cerrar } = await abrir({ ancho: 390, alto: 844, movil: true })
  try {
    await sembrarYAbrir(page, ejercicioFicticio())
    await abrirEstudio(page)
    await caso('Teléfono · Organización académica sin desborde horizontal y con TIPO/PERTENENCIA rotulados', async () => {
      assert.deepStrictEqual(await sinDesborde(page), { fondo: true, cuerpo: true })
      assert.ok(await page.locator('.ac-lbl', { hasText: 'Pertenencia' }).first().isVisible())
      await captura(page, 'telefono-organizacion')
    })
    await caso('Teléfono · Simbología: la ficha aparece debajo de la lámina, sin desborde', async () => {
      await page.getByRole('tab', { name: /Simbología doctrinaria/ }).click()
      await page.locator('.ac-tile').first().click()
      await page.waitForTimeout(600)
      assert.deepStrictEqual(await sinDesborde(page), { fondo: true, cuerpo: true })
      assert.ok(await page.locator('.ac-ficha h3').isVisible())
      await captura(page, 'telefono-simbologia')
    })
    await caso('Sin errores de JavaScript (teléfono)', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

;(async () => {
  if (CAPTURAS) require('fs').mkdirSync(CAPTURAS, { recursive: true })
  await docente()
  await recarga()
  await repetidoViejo()
  await soloLectura()
  await ejemplo()
  await telefono()
  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
