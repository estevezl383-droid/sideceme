// F3·P3 — FORMACIÓN INICIAL DE LAS FUERZAS del G-3 en la Mesa real (Chromium), con un
// ejercicio FICTICIO como el calco de la Escuela (organizacion-ejemplo.js), en escritorio y
// en teléfono, EN ORDEN:
//   ① lo que se considera: la misión, la intención, las avenidas, el CAE y los objetivos;
//   ② las tareas tácticas tocando la carta, con su operación (OD, OC 1, OC 2, OC 3) y su «T:»;
//   ③ la proporción de cada una frente al enemigo de su sector;
//   ④ las unidades genéricas: el reparto propuesto, a mano, lo que sobra a la reserva;
//   ⑤ en la carta: el rótulo y los triángulos junto a cada tarea (y en el 3D);
//   ⑥ la forma gráfica;
//   ⑦ a la Organización de la Tarea (el panel 🧩 se abre con las agrupaciones hechas) y al
//      cuadro de la hoja; 🌱; se guarda con el ejercicio.
// Sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, leerGuardado, entrar3D } = require('./navegador.js')
const { ejercicioOrganizacion } = require('../organizacion-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-organizacion')
fs.mkdirSync(out, { recursive: true })

async function irALaHoja(page) {
  if (!(await page.getByRole('button', { name: '← Volver a mis documentos' }).count())) {
    await page.getByRole('button', { name: /G-3 Operaciones/ }).first().dispatchEvent('click')
    await page.getByRole('button', { name: '📄 Documentos', exact: true }).dispatchEvent('click')
  } else await page.getByRole('button', { name: '← Volver a mis documentos' }).dispatchEvent('click')
  await page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first().dispatchEvent('click')
  await page.getByRole('button', { name: /F3·P3.*Formación inicial de las fuerzas/ }).dispatchEvent('click')
  await page.locator('.oi-editor').waitFor({ timeout: 15000 })
}
const estadoOps = (page) =>
  page.evaluate(() => {
    const root = document.getElementById('root')
    const k = Object.keys(root).find((x) => x.startsWith('__reactContainer'))
    const pila = [root[k]?.stateNode?.current || root[k]]
    const vistos = new Set()
    let ops = null
    let org = null
    while (pila.length && (!ops || !org)) {
      const n = pila.pop()
      if (!n || vistos.has(n)) continue
      vistos.add(n)
      let h = n.memoizedState
      for (let i = 0; h && typeof h === 'object' && i < 500; i++, h = h.next) {
        const v = h.memoizedState
        if (!ops && v && !Array.isArray(v) && Array.isArray(v.obstaculos) && Array.isArray(v.tareas)) ops = v
        if (!org && Array.isArray(v) && v.length && v.every((a) => a && typeof a === 'object' && 'operacion' in a && 'piezas' in a)) org = v
      }
      if (n.child) pila.push(n.child)
      if (n.sibling) pila.push(n.sibling)
    }
    return { tareas: ops ? ops.tareas : null, org }
  })
// Toca la carta en [lng, lat]: busca un lugar de la carta que se vea (en el teléfono los
// paneles tapan casi todo), corre la carta para que ese punto caiga ahí y toca.
async function tocarCarta(page, lng, lat) {
  const [x, y] = await page.evaluate(
    ([lng, lat]) => {
      const m = window.__mapa2d
      const cont = m.getContainer()
      const r = cont.getBoundingClientRect()
      let libre = null
      // Un punto donde se ve la carta misma (una tesela), lejos de los bordes de lo que la tapa.
      const ve = (px, py) => {
        const el = document.elementFromPoint(px, py)
        return !!el && cont.contains(el) && (el === cont || el.classList.contains('leaflet-tile') || !!el.closest('.leaflet-tile-pane'))
      }
      for (let fy = 0.5; fy > 0.02 && !libre; fy -= 0.02)
        for (let fx = 0.5; fx > 0.04 && !libre; fx -= 0.04)
          for (const gx of [fx, 1 - fx]) {
            const px = r.left + r.width * gx
            const py = r.top + r.height * fy
            if (px < 0 || py < 0 || px > innerWidth || py > innerHeight) continue
            if (ve(px, py) && ve(px - 6, py) && ve(px + 6, py) && ve(px, py - 6) && ve(px, py + 6)) {
              libre = [px, py]
              break
            }
          }
      if (!libre) libre = [r.left + r.width / 2, r.top + r.height / 2]
      const p = m.latLngToContainerPoint([lat, lng])
      m.panBy([p.x - (libre[0] - r.left), p.y - (libre[1] - r.top)], { animate: false })
      return libre
    },
    [lng, lat],
  )
  await page.waitForTimeout(300)
  await page.mouse.click(x, y)
  await page.waitForTimeout(500)
}
const editor = (page) => page.locator('.oi-editor')
const paso = (page, n) => page.locator(`#oi-paso-${n}`)

;(async () => {
  for (const movil of [false]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=g3' })
    const { page } = a
    const dialogos = []
    page.on('dialog', (d) => (dialogos.push(d.message()), d.accept()))
    const datos = ejercicioOrganizacion()
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await sembrarYAbrir(page, datos)
      await irALaHoja(page)
      let texto = await editor(page).innerText()

      // ① Lo que se considera.
      for (const t of ['Formación inicial de las fuerzas — paso a paso, sobre el terreno', 'Misión reexpresada:', 'Intención del Comandante superior:', 'Avenidas de aproximación:', '2 enemiga(s)', 'CAE más probable:', 'CAE N° 1 — Ataque frontal por la avenida norte (FICT.)', 'más peligroso:', 'Objetivos del enemigo (H.T. 16):', '🎯 Oa', '🎯 Ob', 'Dispositivo enemigo en el calco:'])
        assert.ok(texto.includes(t), `① no muestra «${t}»`)
      await paso(page, 1).screenshot({ path: path.join(out, `${tag}-paso1.png`) })
      const guia = await page.locator('body').innerText()
      assert.ok(guia.includes('② Las TAREAS TÁCTICAS van en la carta, sobre el terreno'), 'la guía 📘 con la doctrina')
      assert.ok(!guia.includes('Identificá primero las unidades genéricas (dos batallones mecanizados'), 'la guía vieja')

      // ② Las tareas: OD, OC 1, OC 2, OC 3 tocando la carta (como el calco de la Escuela).
      if (movil) {
        await page.getByRole('button', { name: /¿Para qué es y cómo se llena\?/ }).dispatchEvent('click')
        // En el teléfono el tablero «Mi dispositivo» tapa la carta: se esconde, como haría el oficial.
        const ocultar = page.getByText('▼ ocultar')
        if (await ocultar.count()) await ocultar.first().dispatchEvent('click')
      }
      await page.evaluate(() => window.__mapa2d.setView([-16.85, -68.31], 11, { animate: false }))
      await page.waitForTimeout(600)
      const poner = async (tarea, op, [lng, lat]) => {
        const nueva = page.locator('.oi-nueva')
        await nueva.getByRole('combobox', { name: 'Tarea táctica' }).selectOption(tarea)
        await nueva.getByRole('button', { name: op, exact: true }).dispatchEvent('click')
        await nueva.getByRole('button', { name: '📍 Colocarla en la carta' }).dispatchEvent('click')
        await page.locator('.oi-cartel').waitFor({ timeout: 5000 })
        await tocarCarta(page, lng, lat)
        await page.locator('.oi-cartel').waitFor({ state: 'detached', timeout: 5000 })
      }
      await poner('bloquear', 'OD', [-68.3, -16.83])
      await poner('mantener', 'OC 1', [-68.22, -16.88])
      await poner('ocupar', 'OC 2', [-68.42, -16.86])
      await poner('atacar_fuego', 'OC 3', [-68.35, -16.81])
      let st = await estadoOps(page)
      const conOp = st.tareas.filter((t) => t.oi && t.oi.operacion)
      assert.deepEqual(conOp.map((t) => [t.tarea, t.oi.operacion]), [
        ['bloquear', 'od'],
        ['mantener', 'oc1'],
        ['ocupar', 'oc2'],
        ['atacar_fuego', 'oc3'],
      ])
      assert.ok(Math.abs(conOp[0].centro[0] + 68.3) < 0.01 && Math.abs(conOp[0].centro[1] + 16.83) < 0.01, `la OD quedó donde se tocó: ${conOp[0].centro}`)
      assert.deepEqual(conOp[0].oi.enemigos.sort(), ['e-bim1', 'e-bim2'], 'propone el enemigo de su sector')
      assert.ok(st.tareas[0].oi && st.tareas[0].oi.id && !st.tareas[0].oi.operacion, 'la tarea del análisis de la misión, con id y sin operación')
      // El «T:» de la OD.
      await paso(page, 2).getByRole('textbox', { name: 'Texto de la tarea OD' }).fill('Bloquear a las unidades mecanizadas y blindadas de la FT-43')
      // Cambiar la OC 2 a OD le saca la OD a la otra… y se vuelve atrás.
      texto = await editor(page).innerText()
      assert.ok(/✅ 2/.test(texto), 'paso ② listo con la OD')

      await paso(page, 2).screenshot({ path: path.join(out, `${tag}-paso2.png`) })
      // ③ La proporción: la OD 1:3 frente a 2 batallones mecanizados (6 Cía.) → 2 Cía.
      const p3 = await paso(page, 3).innerText()
      assert.ok(p3.includes('Hacen falta 2 compañías genéricas de maniobra (6 × 1/3).'), p3.slice(0, 1500))
      assert.ok(p3.includes('La Mesa propone 1:3'), 'la propuesta con su porqué')
      // La OC 3 (atacar con fuego) la cambia el oficial a 1:1.
      await paso(page, 3).getByRole('combobox', { name: 'Proporción OC 3' }).selectOption('1:1')
      // La OC 1 no tiene enemigo cerca: se escribe a mano (1 compañía).
      const oc1 = page.locator('.oi-proporcion[data-op="oc1"]')
      await oc1.getByRole('spinbutton', { name: 'Cantidad de unidades enemigas' }).fill('1')
      await page.waitForTimeout(300)

      await page.locator('.oi-proporcion[data-op="od"]').screenshot({ path: path.join(out, `${tag}-paso3-od.png`) })
      // ④ Las unidades genéricas: propuesta, lo que sobra a la reserva.
      await paso(page, 4).getByRole('button', { name: '⚡ Proponer el reparto (la OD primero)' }).dispatchEvent('click')
      await page.waitForTimeout(400)
      st = await estadoOps(page)
      const od = st.tareas.find((t) => t.oi?.operacion === 'od')
      assert.equal(od.oi.piezas.length, 2, 'la OD con dos compañías genéricas')
      const p4 = await paso(page, 4).innerText()
      assert.ok(p4.includes('Disponibles: 18 compañías genéricas de maniobra'), p4.slice(0, 600))
      assert.ok(/2 de 2 compañías \(1:3\) ✓/.test(p4), 'la OD cubierta: ' + p4.slice(0, 2500))
      // A mano: una pieza de la reserva a la OC 1 (tocar la OC 1 y después la pieza libre).
      await paso(page, 4).getByRole('button', { name: '🧹 Vaciar el reparto' }).count()
      await paso(page, 4).screenshot({ path: path.join(out, `${tag}-paso4.png`) })

      // ⑤ En la carta: los rótulos con OD / OC y los triángulos.
      const rotulos = await page.locator('.oi-bloque').allInnerTexts()
      assert.ok(rotulos.some((t) => /^OD\s*T: Bloquear a las unidades mecanizadas y blindadas de la FT-43/.test(t.trim())), JSON.stringify(rotulos))
      assert.ok(rotulos.some((t) => /^OC 3\s*T: /.test(t.trim())))
      assert.ok(rotulos.some((t) => /^RES\s*Reserva \(lo que sobra\)/.test(t.trim())), 'la reserva también')
      assert.equal(await page.locator('.oi-bloque').first().locator('svg').count() > 0, true, 'con los símbolos')
      await page.evaluate(() => window.__mapa2d.setView([-16.85, -68.31], 11, { animate: false }))
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(out, `${tag}-carta.png`) })

      // ⑥ La forma gráfica.
      await paso(page, 6).locator('button').first().dispatchEvent('click')
      const p6 = await paso(page, 6).innerText()
      for (const t of ['OPERACIÓN DECISIVA', 'OPERACIÓN DE CONFIGURACIÓN 1', 'OPERACIÓN DE CONFIGURACIÓN 3', 'BAJO CONTROL', 'RESERVA', 'RA-1 «LANZA» (FICT.)', 'II'])
        assert.ok(p6.includes(t), `la forma gráfica no trae «${t}»`)
      await paso(page, 6).screenshot({ path: path.join(out, `${tag}-forma-grafica.png`) })

      // ⑦ A la Organización de la Tarea: el panel 🧩 se abre con las agrupaciones.
      await paso(page, 7).getByRole('button', { name: '🧩 Pasar a la Organización de la Tarea' }).dispatchEvent('click')
      await page.getByText('🧩 ORGANIZACIÓN DE LA TAREA').waitFor({ timeout: 5000 })
      st = await estadoOps(page)
      assert.deepEqual(st.org.map((a) => [a.operacion, a.tarea || '']), [
        ['od', 'bloquear'],
        ['oc1', 'mantener'],
        ['oc2', 'ocupar'],
        ['oc3', 'atacar_fuego'],
        ['reserva', ''],
      ])
      assert.equal(st.org[0].piezas.length, 2)
      assert.ok(st.tareas.filter((t) => t.oi?.operacion).every((t) => t.oi.agId), 'cada tarea vinculada a su agrupación')
      await page.screenshot({ path: path.join(out, `${tag}-organizacion-tarea.png`) })
      // Ahí se le pone el nombre a la OD y se llevan al calco: la ficha va junto a su tarea.
      await page.getByPlaceholder('Nombre (ej. FT «VARGAS»)').first().fill('VARGAS')
      await page.getByRole('button', { name: /✅ Consolidar/ }).dispatchEvent('click')
      await page.waitForTimeout(600)
      const fichas = await page.evaluate(() => {
        const root = document.getElementById('root')
        const k = Object.keys(root).find((x) => x.startsWith('__reactContainer'))
        const pila = [root[k]?.stateNode?.current || root[k]]
        const vistos = new Set()
        while (pila.length) {
          const n = pila.pop()
          if (!n || vistos.has(n)) continue
          vistos.add(n)
          for (let h = n.memoizedState, i = 0; h && typeof h === 'object' && i < 500; i++, h = h.next) {
            const v = h.memoizedState
            if (Array.isArray(v) && v.some((u) => u && u.esAgrupacion && u.agId)) return v.filter((u) => u.esAgrupacion)
          }
          if (n.child) pila.push(n.child)
          if (n.sibling) pila.push(n.sibling)
        }
        return []
      })
      const fOD = fichas.find((f) => f.operacionAg === 'od')
      assert.ok(fOD && fOD.designacion === 'VARGAS', JSON.stringify(fichas.map((f) => [f.designacion, f.operacionAg])))
      assert.ok(Math.abs(fOD.lng - od.centro[0]) < 0.001 && Math.abs(fOD.lat - (od.centro[1] - 0.006)) < 0.001, `la ficha de la OD junto a su tarea: ${fOD.lng},${fOD.lat} / ${od.centro}`)
      assert.equal(fichas.length, 5)
      const p7 = await paso(page, 7).innerText()
      assert.ok(p7.includes('OD — Bloquear: VARGAS'), p7)
      assert.ok((await paso(page, 6).innerText()).includes('VARGAS'), 'el nombre en la forma gráfica')

      // Y al cuadro de la hoja.
      await paso(page, 7).getByRole('button', { name: '📋 Pasar al cuadro de la hoja' }).dispatchEvent('click')
      await page.waitForTimeout(400)
      const cuerpo = await page.locator('body').innerText()
      assert.ok(cuerpo.includes('📋 El cuadro de la hoja'), 'el cuadro debajo')
      const valores = await page.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
      assert.ok(valores.includes('OD — Operación Decisiva (esfuerzo principal)'), 'el renglón de la OD')
      assert.ok(valores.some((v) => /^1:3 \(defender una posición preparada o fortificada\) → se requieren 2 compañías; dispuestas 2 ✓\.$/.test(v)), 'la proporción de la OD: ' + JSON.stringify(valores.filter((v) => /requeridas|sin enemigo/.test(v))))

      // La vista previa y el Word de la hoja traen el cuadro nuevo.
      await page.getByRole('button', { name: '👁️ Vista previa' }).dispatchEvent('click')
      const previa = await page.frameLocator('iframe[title="vista previa"]').locator('body').innerText()
      for (const t of ['FORMACIÓN INICIAL DE LAS FUERZAS', 'OPERACIÓN', 'ENEMIGO EN SU SECTOR', 'OD — OPERACIÓN DECISIVA (ESFUERZO PRINCIPAL)', 'BLOQUEAR — T: BLOQUEAR A LAS UNIDADES MECANIZADAS Y BLINDADAS DE LA FT-43'])
        assert.ok(previa.toUpperCase().includes(t), `la vista previa no trae «${t}»`)
      await page.getByRole('button', { name: '← Volver' }).dispatchEvent('click')
      await page.locator('.oi-editor').waitFor({ timeout: 5000 })
      const descarga = page.waitForEvent('download', { timeout: 20000 })
      await page.getByRole('button', { name: /Word \(hoja de trabajo\)/ }).dispatchEvent('click')
      const dl = await descarga
      const archivo = path.join(out, `${tag}-${dl.suggestedFilename()}`)
      await dl.saveAs(archivo)
      const xml = require('node:child_process').execFileSync('unzip', ['-p', archivo, 'word/document.xml'], { encoding: 'utf8' })
      assert.ok(/Operación Decisiva/.test(xml) && /Enemigo en su sector/i.test(xml), 'el Word de la hoja con el cuadro nuevo')

      // ⑤ en 3D: los rótulos se copian a la vista 3D.
      if (!movil) {
        await entrar3D(page)
        await page.waitForTimeout(1500)
        const en3d = await page.evaluate(() => [...document.querySelectorAll('.maplibregl-marker')].filter((e) => /T: Bloquear/.test(e.textContent || '')).length)
        assert.ok(en3d >= 1, 'el rótulo de la OD en el 3D')
        await page.screenshot({ path: path.join(out, `${tag}-3d.png`) })
      }

      // Se guarda con el ejercicio: las tareas con su operación y sus piezas, la reserva y el cuadro.
      await page.getByRole('button', { name: new RegExp(`^📁 ${datos.nombre.replace(/[()]/g, '\\$&')}`, 'i') }).first().dispatchEvent('click')
      await page.getByRole('button', { name: /Guardar todo/ }).dispatchEvent('click')
      let g = null
      for (let t = 0; t < 8000 && !(g && g.g3 && Array.isArray(g.g3.organizacion)); t += 250) {
        g = await leerGuardado(page, datos.nombre)
        await page.waitForTimeout(250)
      }
      assert.ok(g.ops.tareas.some((t) => t.oi?.operacion === 'od' && t.oi.piezas.length === 2))
      assert.ok(g.g3.organizacionInicial.reserva.piezas.length > 0)
      assert.equal(g.g3.organizacion[0].Operación, 'OD — Operación Decisiva (esfuerzo principal)')
      assert.ok(g.orgTarea.some((x) => x.nombre === 'VARGAS' && x.operacion === 'od'))
      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: ① lo que se considera, ② cuatro tareas tocando la carta con OD/OC, ③ proporciones, ④ reparto y reserva, ⑤ rótulos y triángulos en la carta${movil ? '' : ' (y en el 3D)'}, ⑥ forma gráfica, ⑦ Organización de la Tarea y cuadro, guardado.`)
    } catch (e) {
      console.error('ERRORES APP', a.errores)
      console.error('DIÁLOGOS', dialogos)
      await page.screenshot({ path: path.join(out, `${tag}-ERROR.png`) }).catch(() => {})
      await a.cerrar()
      throw e
    }
    await a.cerrar()
  }
  await telefono()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})

// En el teléfono la carta queda tapada por las barras de la Mesa (no se puede tocar): se
// prueba que la hoja entra sin desborde y el otro camino, el de la captura de Sergio — la
// Organización de la Tarea armada ANTES, fuera de orden, y el cuadro viejo con nombres.
async function telefono() {
  const a = await abrir({ ancho: 390, alto: 844, movil: true, consulta: '?puesto=g3' })
  const { page } = a
  const dialogos = []
  page.on('dialog', (d) => (dialogos.push(d.message()), d.accept()))
  const datos = ejercicioOrganizacion()
  const pz = (de, n, simbolo) => Array.from({ length: n }, (_, i) => ({ id: `${de}-${i + 1}`, de, simbolo, escalon: 'compania', madre: de, nom: `${simbolo} ${i + 1}` }))
  datos.orgTarea = [
    { id: 'ag-oc1', nombre: 'FT TORREZ', escalon: 'batallon', operacion: 'oc1', tarea: 'apoyar_fuego', proposito: 'CON EL PROPOSITO DE DETENER EL AVANCE DE ROJO', ft: true, piezas: pz('p-and', 3, 'inf_montania') },
    { id: 'ag-od', nombre: 'FT VARGS', escalon: 'batallon', operacion: 'od', tarea: 'atacar_fuego', proposito: 'DE BLOQUEAR LA PROGRESION DEL ENEMIGO', ft: true, piezas: pz('p-cab', 4, 'cab_blindada') },
    { id: 'ag-oc2', nombre: 'FT LANZA', escalon: 'batallon', operacion: 'oc2', tarea: 'seguir_asumir', proposito: 'CONTINUAR CON EL DESGASTE', ft: true, piezas: [] },
  ]
  datos.g3.organizacion = [
    { 'Agrupación / unidad genérica': 'FT VARGS', 'Tarea que cumple': '', 'Proporción requerida frente al enemigo en su sector': '', 'Relación de comando': 'Agrupación táctica' },
    { 'Agrupación / unidad genérica': 'FT TORREZ', 'Tarea que cumple': '', 'Proporción requerida frente al enemigo en su sector': '', 'Relación de comando': 'Agrupación táctica' },
  ]
  try {
    await sembrarYAbrir(page, datos)
    await irALaHoja(page)
    const d = await page.evaluate(() => {
      const el = document.querySelector('.oi-editor')
      return { sw: el.scrollWidth, cw: el.clientWidth, doc: document.documentElement.scrollWidth, vw: window.innerWidth }
    })
    assert.ok(d.sw <= d.cw + 1, 'la hoja desborda en el teléfono: ' + JSON.stringify(d))
    await page.screenshot({ path: path.join(out, 'movil-hoja.png') })
    // ⬅️ Partir de lo que ya armé: las tres agrupaciones pasan a la carta como tareas.
    await paso(page, 2).getByRole('button', { name: '⬅️ Partir de lo que ya armé' }).dispatchEvent('click')
    await page.waitForTimeout(400)
    let st = await estadoOps(page)
    const conOp = st.tareas.filter((t) => t.oi && t.oi.operacion)
    assert.deepEqual(conOp.map((t) => [t.tarea, t.oi.operacion, t.oi.agId, t.oi.piezas.length]), [
      ['apoyar_fuego', 'oc1', 'ag-oc1', 3],
      ['atacar_fuego', 'od', 'ag-od', 4],
      ['seguir_asumir', 'oc2', 'ag-oc2', 0],
    ])
    // ③ El enemigo de la OD por cercanía.
    await page.locator('.oi-proporcion[data-op="od"]').getByRole('button', { name: '✨ Proponer por cercanía' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    // ⑦ A la Organización de la Tarea: las MISMAS agrupaciones (con su nombre y su propósito), sin duplicar.
    await paso(page, 7).getByRole('button', { name: '🧩 Pasar a la Organización de la Tarea' }).dispatchEvent('click')
    await page.getByText('🧩 ORGANIZACIÓN DE LA TAREA').waitFor({ timeout: 5000 })
    st = await estadoOps(page)
    assert.deepEqual(st.org.map((x) => [x.id, x.nombre, x.operacion, x.piezas.length]), [
      ['ag-oc1', 'FT TORREZ', 'oc1', 3],
      ['ag-od', 'FT VARGS', 'od', 4],
      ['ag-oc2', 'FT LANZA', 'oc2', 0],
    ])
    assert.equal(st.org[0].proposito, 'CON EL PROPOSITO DE DETENER EL AVANCE DE ROJO')
    await page.screenshot({ path: path.join(out, 'movil-organizacion-tarea.png') })
    await page.getByRole('button', { name: '✕ Cerrar' }).dispatchEvent('click')
    // 📋 Al cuadro: pregunta antes de reemplazar el cuadro viejo.
    await paso(page, 7).getByRole('button', { name: '📋 Pasar al cuadro de la hoja' }).dispatchEvent('click')
    await page.waitForTimeout(400)
    assert.ok(dialogos.some((m) => /El cuadro de la hoja ya tiene 2 renglón\(es\)/.test(m)), JSON.stringify(dialogos))
    const valores = await page.locator('textarea, input').evaluateAll((xs) => xs.map((x) => x.value))
    assert.ok(valores.includes('OD — Operación Decisiva (esfuerzo principal)'))
    assert.ok(!valores.includes('FT VARGS'), 'el cuadro viejo se reemplazó')
    assert.deepEqual(a.errores, [])
    console.log('OK teléfono: la hoja entra sin desborde; ⬅️ partir de la Organización de la Tarea armada antes (fuera de orden); las mismas agrupaciones, sin duplicar; el cuadro viejo se reemplaza preguntando.')
  } catch (e) {
    console.error('ERRORES APP', a.errores)
    console.error('DIÁLOGOS', dialogos)
    await page.screenshot({ path: path.join(out, 'movil-ERROR.png') }).catch(() => {})
    await a.cerrar()
    throw e
  }
  await a.cerrar()
}
