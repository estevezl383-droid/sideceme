// Cuánto tardan los trabajos de ingeniería con la ingeniería que tenemos.
//
// Corre la Mesa del EM de verdad en Chromium (sin red: ver navegador.js) con el
// ejercicio de unidades ficticias, un plan de barreras como el de «ARMAS» (dos
// zanjas antitanque y ocho bloqueos) y, según el caso, la Organización de la
// tarea de la OGO 01/35 cargada en «Documentos del ejercicio».
//
//   cd calcos/pruebas && node e2e/ingenieria-tiempo.js
const assert = require('assert')
const { abrir, sembrarYAbrir } = require('./navegador')
const { ejercicioFicticio } = require('../ejercicio-ficticio')
const { OGO_MD } = require('../ogo-organizacion')

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

function ejercicio({ conOrden = true, conIngCalco = true } = {}) {
  const d = ejercicioFicticio({ conPlantilla: false })
  d.nombre = `PRUEBA INGENIERÍA ${conOrden ? 'CON' : 'SIN'} ORDEN ${conIngCalco ? 'CON' : 'SIN'} FICHA`
  if (!conIngCalco) d.unidades = d.unidades.filter((u) => u.arma !== 'ingenieria')
  d.documentos = conOrden ? [{ nombre: '1.- OGO 01-35 (PICB).docx.md', categoria: 'orden', tipo: 'texto', texto: OGO_MD }] : []
  // Dos zanjas antitanque (≈3,2 km y ≈1,2 km) y ocho bloqueos, todo proyectado.
  d.ops.obstaculos = [
    { tipo: 'zanja_at', estado: 'proyectado', coords: [[-65.09, -17.0], [-65.075, -17.001], [-65.06, -17.0]] },
    { tipo: 'zanja_at', estado: 'proyectado', coords: [[-65.05, -17.03], [-65.0383, -17.03]] },
    ...Array.from({ length: 8 }, (_, i) => ({ tipo: 'bloqueo', estado: 'proyectado', centro: [-65.08 + i * 0.005, -17.02] })),
  ]
  return d
}

const texto = (loc) => loc.innerText().then((t) => t.replace(/\s+/g, ' ').trim())
const tituloBarra = (page) => texto(page.locator('span', { hasText: 'PLAN DE BARRERAS' }).first())
const bloqueBarra = (page, rotulo) => texto(page.locator('div', { has: page.locator(`div:text-is("${rotulo}")`) }).last())
// «62 h de trabajo» → 62
const horas = (t) => Number((t.match(/([\d.,]+) h de trabajo/) || [])[1].replace(/\./g, '').replace(',', '.'))

async function abrirDefensa(page) {
  await page.getByRole('button', { name: /DEFENSA/i }).first().click()
  await page.waitForTimeout(800)
}

async function conLaOrden() {
  const { page, errores, cerrar } = await abrir()
  try {
    await sembrarYAbrir(page, ejercicio())

    await caso('Barra · el título dice horas, jornadas y con cuántas secciones (las 6 de la orden)', async () => {
      const t = await tituloBarra(page)
      assert.match(t, /PLAN DE BARRERAS · [\d.,]+ h DE TRABAJO = [\d.,]+ JORNADAS DE 10 h · CON 6 SECC\. DE INGENIERÍA/, t)
    })

    await caso('Barra · «Ingeniería que tenemos» sale de la OGO: batallón, compañías y quién no hace obstáculos', async () => {
      const t = await bloqueBarra(page, 'Ingeniería que tenemos')
      for (const x of ['6 secc.', 'BATING. MEC.- II “ROMAN”', 'Comp. Ing. Comb. “A” · Comp. Ing. Comb. “B” → 6 secc.', '⚙️ Comp. Ing. Eq. Pes. (máquinas)', 'No hacen obstáculos: Comp. Ing. Puentes · Comp. Mtto. Ing.', '📄 1.- OGO 01-35 (PICB)'])
        assert.ok(t.includes(x), `falta «${x}» en: ${t}`)
      assert.ok(!t.includes('ACONCAGUA'), 'se coló la ingeniería enemiga')
    })

    await caso('Barra · «Tiempo de trabajo» en jornadas de 10 h y en días de 24 h', async () => {
      const t = await bloqueBarra(page, 'Tiempo de trabajo · apreciación')
      assert.match(t, /[\d.,]+ h = [\d.,]+ jornadas de 10 h \(\d+ día\(s\) de trabajo\) o [\d.,]+ días trabajando las 24 h con relevos/, t)
      assert.match(t, /÷ 6 secc\. de 30/, t)
    })

    await caso('Barra · cada trabajo con sus horas (los bloqueos, en minutos) y con cuántas secciones', async () => {
      const t = await bloqueBarra(page, 'Los trabajos (10) · horas con 6 secc. · tocá para ir')
      assert.match(t, /ZANJA AT [\d.,]+ h/, t)
      assert.match(t, /BLOQUEO 1 min/, t)
      assert.ok(!/ 0 h/.test(t), `hay trabajos en «0 h»: ${t}`)
    })

    await caso('Barra · equipo mecánico: dice que la orden da la compañía de equipo pesado', async () => {
      const t = await bloqueBarra(page, 'Equipo mecánico')
      assert.ok(t.includes('La orden te da la Comp. Ing. Eq. Pes.'), t)
    })

    await abrirDefensa(page)
    let h6 = 0
    await caso('🛡️ Defensa · «Con qué lo hacemos»: la OGO, compañía por compañía, 6 secciones y 180 hombres', async () => {
      const t = await texto(page.locator('[data-ing="con-que"]').first())
      for (const x of ['📄 Según 1.- OGO 01-35 (PICB) · Organización de la tarea', 'BATING. MEC.- II “ROMAN”', 'Comp. Ing. Comb. “A” 3 secc.', 'Comp. Ing. Comb. “B” 3 secc.', 'Comp. Ing. Eq. Pes. máquinas', 'Comp. Ing. Puentes no hace obstáculos', 'Comp. Mtto. Ing. no hace obstáculos', '= 6 secciones al trabajo · 180 hombres (30 por sección)'])
        assert.ok(t.includes(x), `falta «${x}» en: ${t}`)
      assert.ok(t.includes('En el calco también hay B. ING. «DELTA» (FICT.) (batallón): para el cálculo manda la orden.'), t)
    })

    await caso('🛡️ Defensa · «Cuánto tarda»: horas, jornadas, días de 24 h y con las máquinas', async () => {
      const t = await texto(page.locator('[data-ing="cuanto"]').first())
      assert.match(t, /[\d.,]+ h de trabajo = [\d.,]+ jornadas de 10 h → \d+ día\(s\) de trabajo o [\d.,]+ días si se trabaja las 24 h, con relevos/, t)
      assert.match(t, /hombres-hora ÷ 180 hombres \(6 secc\. × 30\)/, t)
      assert.match(t, /⚙️ Con las máquinas de la Comp\. Ing\. Eq\. Pes\.: [\d.,]+ h/, t)
      h6 = horas(t)
      assert.ok(h6 > 0, t)
      const barra = await tituloBarra(page)
      assert.ok(barra.includes(`· ${t.match(/([\d.,]+) h de trabajo/)[1]} h DE TRABAJO`), `la barra y el panel no dicen lo mismo: ${barra}`)
    })

    await caso('🛡️ Defensa · a mano con 1 sección: seis veces más horas, y lo dice', async () => {
      await page.getByLabel('Secciones al trabajo').fill('1')
      await page.waitForTimeout(500)
      const q = await texto(page.locator('[data-ing="con-que"]').first())
      assert.ok(q.includes('✎ Puesto a mano (la orden da 6)'), q)
      assert.ok(q.includes('= 1 secciones al trabajo · 30 hombres'), q)
      const h1 = horas(await texto(page.locator('[data-ing="cuanto"]').first()))
      assert.ok(Math.abs(h1 / h6 - 6) < 0.2, `con 1 sección: ${h1} h; con 6: ${h6} h`)
      assert.match(await tituloBarra(page), /CON 1 SECC\. DE INGENIERÍA/)
      assert.ok((await bloqueBarra(page, 'Ingeniería que tenemos')).includes('✎ Puesto a mano en 🛡️ Defensa'))
    })

    await caso('🛡️ Defensa · «↺ usar las de la orden» vuelve a las 6 secciones', async () => {
      await page.getByRole('button', { name: '↺ usar las de la orden' }).click()
      await page.waitForTimeout(500)
      assert.strictEqual(await page.getByLabel('Secciones al trabajo').inputValue(), '6')
      assert.strictEqual(horas(await texto(page.locator('[data-ing="cuanto"]').first())), h6)
      assert.match(await tituloBarra(page), /CON 6 SECC\. DE INGENIERÍA/)
      const tabla = await texto(page.locator('table').filter({ hasText: 'BLQ' }).first())
      assert.match(tabla, /BLQ 1 obra 1 min/, tabla)
    })

    await caso('Tablero del G-3 · ⏱️ Barreras calcula con la misma fuerza y el mismo tiempo', async () => {
      await page.getByRole('button', { name: '✕' }).first().click() // cierra 🛡️ Defensa
      await page.waitForTimeout(400)
      await page.getByText('abrir mi tablero ⚔️').first().click()
      await page.waitForTimeout(800)
      await page.getByRole('button', { name: '⏱️ Barreras' }).click()
      await page.waitForTimeout(800)
      const q = await texto(page.locator('[data-ing="con-que"]').last())
      assert.ok(q.includes('BATING. MEC.- II “ROMAN”') && q.includes('= 6 secciones al trabajo'), q)
      assert.ok(q.includes('Se corrige en «Secciones al trabajo» del panel 🛡️ Defensa.'), q)
      const cuerpo = await texto(page.locator('body'))
      assert.ok(!cuerpo.includes('No hay ninguna unidad de INGENIERÍA en el calco'), 'sobra el aviso de «sin ingeniería»')
      assert.match(cuerpo, /= [\d.,]+ jornadas de 10 h \(\d+ día\(s\) de trabajo\) · o [\d.,]+ días trabajando las 24 h con relevos/)
    })

    await caso('Sin errores de JavaScript', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

async function sinLaOrden() {
  const { page, errores, cerrar } = await abrir()
  try {
    await sembrarYAbrir(page, ejercicio({ conOrden: false }))
    await caso('Sin documentos · usa la ficha de ingeniería del calco (batallón = 9 secciones, por el escalón)', async () => {
      assert.match(await tituloBarra(page), /CON 9 SECC\. DE INGENIERÍA/)
      const b = await bloqueBarra(page, 'Ingeniería que tenemos')
      assert.ok(b.includes('🪖 Del calco: B. ING. «DELTA» (FICT.) (batallón)') && b.includes('Los documentos del ejercicio no dicen qué ingeniería tenemos.'), b)
      await abrirDefensa(page)
      const q = await texto(page.locator('[data-ing="con-que"]').first())
      assert.ok(q.includes('🪖 Del calco (los documentos del ejercicio no la mencionan):') && q.includes('9 secc.') && q.includes('= 9 secciones al trabajo · 270 hombres'), q)
    })
    await caso('Sin errores de JavaScript', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

async function sinNada() {
  const { page, errores, cerrar } = await abrir()
  try {
    await sembrarYAbrir(page, ejercicio({ conOrden: false, conIngCalco: false }))
    await caso('Sin documentos ni ficha · 1 sección supuesta, y avisa dónde cargar la orden', async () => {
      assert.match(await tituloBarra(page), /CON 1 SECC\. DE INGENIERÍA/)
      const b = await bloqueBarra(page, 'Ingeniería que tenemos')
      assert.ok(b.includes('Ni los documentos del ejercicio ni el calco dicen qué ingeniería tenemos'), b)
      await abrirDefensa(page)
      const q = await texto(page.locator('[data-ing="con-que"]').first())
      assert.ok(q.includes('se calcula con 1 sección supuesta') && q.includes('Cargá la Orden en «Documentos del ejercicio»'), q)
    })
    await caso('Sin errores de JavaScript', async () => assert.deepStrictEqual(errores, []))
  } finally {
    await cerrar()
  }
}

;(async () => {
  console.log('\nTiempo de los trabajos de ingeniería con la fuerza que tenemos (Chromium)\n')
  await conLaOrden()
  await sinLaOrden()
  await sinNada()
  console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
  process.exit(fallas ? 1 : 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
