// F3·P3 — FORMACIÓN INICIAL DE LAS FUERZAS del G-3 en la Mesa real (Chromium), con un
// ejercicio FICTICIO como el calco de la Escuela (organizacion-ejemplo.js), en escritorio,
// teléfono e iPad, EN ORDEN (como lo pidió Sergio el 06-10-2026):
//   ① lo que se considera: la misión, la intención, las avenidas, el CAE, los objetivos y
//      las unidades con que se cuenta (y traer de la Orden las que faltan: la infantería);
//   ② VARIAS tareas tácticas tocando la carta, todavía sin OD/OC, cada una ORIENTADA (⇄ al
//      otro lado, ↻ 15°), con su «T:»; la del análisis de la misión, «🚫 No entra»;
//   ③ las fuerzas de cada tarea: la proporción y cuántas de cada TIPO (+ / −), el reparto
//      propuesto, lo que sobra a la reserva;
//   ④ recién ahí la OD y las OC (la propuesta de la Mesa y el oficial que la corrige);
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
async function tocarCarta(page, lng, lat, { toque = false } = {}) {
  const [x, y] = await page.evaluate(
    ([lng, lat]) => {
      const m = window.__mapa2d
      const cont = m.getContainer()
      const r = cont.getBoundingClientRect()
      let libre = null
      // Un punto donde se ve la carta misma (una tesela), lejos de los bordes de lo que la tapa.
      const ve = (px, py) => {
        const el = document.elementFromPoint(px, py)
        return !!el && cont.contains(el) && (el === cont || (!!el.closest('.leaflet-pane') && !el.closest('.leaflet-marker-pane, .leaflet-tooltip-pane, .leaflet-popup-pane, .leaflet-shadow-pane')))
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
  if (toque) await page.touchscreen.tap(x, y)
  else await page.mouse.click(x, y)
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

      // ② Las tareas: VARIAS, tocando la carta, todavía sin OD/OC, cada una orientada.
      if (movil) {
        await page.getByRole('button', { name: /¿Para qué es y cómo se llena\?/ }).dispatchEvent('click')
        // En el teléfono el tablero «Mi dispositivo» tapa la carta: se esconde, como haría el oficial.
        const ocultar = page.getByText('▼ ocultar')
        if (await ocultar.count()) await ocultar.first().dispatchEvent('click')
      }
      // La tarea que ya estaba (la del análisis de la misión) entra como T1: «🚫 No entra».
      assert.ok(texto.includes('Las unidades con que cuento (en el calco):'), '① las unidades con que cuento')
      await page.locator('.oi-tarea[data-n="1"]').getByRole('button', { name: '🚫 No entra' }).dispatchEvent('click')
      await page.waitForTimeout(300)
      assert.ok((await paso(page, 2).innerText()).includes('↩ Controlar'), 'queda a mano para que vuelva a entrar')
      await page.evaluate(() => window.__mapa2d.setView([-16.85, -68.31], 11, { animate: false }))
      await page.waitForTimeout(600)
      const nueva = page.locator('.oi-nueva')
      const poner = async (tarea, [lng, lat], rot = 0) => {
        await nueva.getByRole('combobox', { name: 'Tarea táctica' }).selectOption(tarea)
        await nueva.getByRole('spinbutton', { name: 'Grados la nueva tarea' }).fill(String(rot))
        await nueva.getByRole('button', { name: '📍 Colocarla en la carta' }).dispatchEvent('click')
        await page.locator('.oi-cartel').waitFor({ timeout: 5000 })
        await tocarCarta(page, lng, lat)
        await page.locator('.oi-cartel').waitFor({ state: 'detached', timeout: 5000 })
      }
      await poner('bloquear', [-68.3, -16.83])
      assert.ok((await nueva.innerText()).toUpperCase().includes('➕ OTRA TAREA TÁCTICA (LA T2)'), 'queda lista para la próxima')
      await poner('mantener', [-68.22, -16.88])
      // «⇄ Al otro lado» antes de colocarla: que apunte al revés.
      await nueva.getByRole('combobox', { name: 'Tarea táctica' }).selectOption('ocupar')
      await nueva.getByRole('button', { name: 'Al otro lado la nueva tarea' }).dispatchEvent('click')
      assert.equal(await nueva.getByRole('spinbutton', { name: 'Grados la nueva tarea' }).inputValue(), '180')
      await nueva.getByRole('button', { name: '📍 Colocarla en la carta' }).dispatchEvent('click')
      await page.locator('.oi-cartel').waitFor({ timeout: 5000 })
      await tocarCarta(page, -68.42, -16.86)
      await page.locator('.oi-cartel').waitFor({ state: 'detached', timeout: 5000 })
      await poner('atacar_fuego', [-68.35, -16.81])
      let st = await estadoOps(page)
      const entran = () => st.tareas.filter((t) => t.oi && t.oi.operacion !== 'fuera')
      assert.deepEqual(entran().map((t) => [t.tarea, t.oi.operacion, t.rot]), [
        ['bloquear', '', 0],
        ['mantener', '', 0],
        ['ocupar', '', 180],
        ['atacar_fuego', '', 0],
      ], 'cuatro tareas, sin designar todavía, la tercera apuntando al otro lado')
      const bloq = entran()[0]
      assert.ok(Math.abs(bloq.centro[0] + 68.3) < 0.01 && Math.abs(bloq.centro[1] + 16.83) < 0.01, `la T1 quedó donde se tocó: ${bloq.centro}`)
      assert.deepEqual(bloq.oi.enemigos.sort(), ['e-bim1', 'e-bim2'], 'propone el enemigo de su sector')
      assert.ok(await page.evaluate(() => document.querySelector('.leaflet-marker-pane').innerHTML.includes('rotate(180 50 50)')), 'en la carta, el símbolo girado')
      // Cambiar la orientación de una ya puesta: la T2, dos veces «↻ 15°»; y la T3 vuelve con «⇄».
      await page.locator('.oi-tarea[data-n="2"]').getByRole('button', { name: 'Girar a la derecha T2' }).dispatchEvent('click')
      await page.waitForTimeout(150)
      await page.locator('.oi-tarea[data-n="2"]').getByRole('button', { name: 'Girar a la derecha T2' }).dispatchEvent('click')
      await page.locator('.oi-tarea[data-n="3"]').getByRole('button', { name: 'Al otro lado T3' }).dispatchEvent('click')
      await page.waitForTimeout(300)
      st = await estadoOps(page)
      assert.deepEqual(entran().map((t) => t.rot), [0, 30, 0, 0])
      await page.locator('.oi-tarea[data-n="3"]').getByRole('button', { name: 'Al otro lado T3' }).dispatchEvent('click')
      // El «T:» de la T1.
      await page.locator('.oi-tarea[data-n="1"]').getByRole('textbox', { name: 'Texto de la tarea T1' }).fill('Bloquear a las unidades mecanizadas y blindadas de la FT-43')
      texto = await editor(page).innerText()
      assert.ok(/✅ 2/.test(texto), 'paso ② listo: hay tareas')
      assert.ok(/○ 4/.test(texto), 'falta designar (paso ④)')
      await paso(page, 2).screenshot({ path: path.join(out, `${tag}-paso2.png`) })

      // ③ Las fuerzas: la proporción y CUÁNTAS de cada tipo, tarea por tarea.
      const t1 = page.locator('.oi-fuerzas[data-n="1"]')
      let f1 = await t1.innerText()
      assert.ok(f1.includes('0 de 2 compañías de maniobra (1:3) — faltan 2'), f1)
      assert.ok(f1.includes('la Mesa propone 1:3'), 'la propuesta con su porqué')
      await t1.getByRole('button', { name: 'Agregar Caballería Blindada' }).dispatchEvent('click')
      await page.waitForTimeout(200)
      await t1.getByRole('button', { name: 'Agregar Caballería Blindada' }).dispatchEvent('click')
      await page.waitForTimeout(200)
      await t1.getByRole('button', { name: 'Agregar Ingenieros' }).dispatchEvent('click')
      await page.waitForTimeout(300)
      f1 = await t1.innerText()
      assert.ok(f1.includes('2 de 2 compañías de maniobra (1:3) ✓'), f1)
      assert.ok(/Salen de: RC-4 «VARGAS» \(FICT\.\) \(2 Cía\.\) · BING-2 «AGUIRRE» \(FICT\.\) \(1 Cía\.\)/.test(f1), f1)
      await t1.getByRole('button', { name: 'Quitar Ingenieros' }).dispatchEvent('click')
      await page.waitForTimeout(300)
      st = await estadoOps(page)
      assert.deepEqual(entran()[0].oi.piezas.map((p) => p.simbolo), ['cab_blindada', 'cab_blindada'])
      // La T4 (atacar con fuego) la cambia el oficial a 1:1; la T2 no tiene enemigo cerca: a mano.
      await page.locator('.oi-fuerzas[data-n="4"]').getByRole('combobox', { name: 'Proporción T4' }).selectOption('1:1')
      await page.locator('.oi-fuerzas[data-n="2"]').getByRole('spinbutton', { name: 'Cantidad de unidades enemigas' }).fill('1')
      await page.waitForTimeout(300)
      await t1.screenshot({ path: path.join(out, `${tag}-paso3-t1.png`) })
      await paso(page, 3).getByRole('button', { name: '⚡ Proponer el reparto de la maniobra' }).dispatchEvent('click')
      await page.waitForTimeout(400)
      st = await estadoOps(page)
      assert.deepEqual(entran().map((t) => t.oi.piezas.length), [2, 1, 1, 6], 'a cada una lo que le faltaba (la T4, 1:1 frente a dos batallones: 6); la T1 ya estaba')
      const p3 = await paso(page, 3).innerText()
      assert.ok(p3.includes('Disponibles: 18 compañías genéricas de maniobra'), p3.slice(0, 900))
      assert.ok(p3.includes('Reserva') || p3.includes('reserva'), 'la reserva')
      assert.ok((await page.locator('.oi-fuerzas[data-op="reserva"] .oi-tipo').count()) > 0, 'la reserva también con sus tipos')
      await paso(page, 3).screenshot({ path: path.join(out, `${tag}-paso3.png`) })

      // ④ Recién ahora: cuál es la OD y cuáles las OC.
      await paso(page, 4).getByRole('button', { name: /✨ Proponer/ }).dispatchEvent('click')
      await page.waitForTimeout(300)
      st = await estadoOps(page)
      assert.deepEqual(entran().map((t) => t.oi.operacion), ['oc1', 'oc2', 'oc3', 'od'], 'la propuesta: la OD donde más fuerzas hay (la T4, con 6)')
      // El oficial la corrige: la OD es el bloqueo (se intercambian).
      const designar = async (n, op) => {
        await page.locator(`.oi-designar[data-n="${n}"]`).getByRole('button', { name: new RegExp(`^${op}( \\(T\\d\\))?$`) }).dispatchEvent('click')
        await page.waitForTimeout(250)
      }
      await designar(1, 'OD')
      assert.ok((await editor(page).innerText()).includes('🔁 OD pasó a T1; T4 quedó como OC 1.'))
      await designar(4, 'OC 3')
      await designar(2, 'OC 1')
      st = await estadoOps(page)
      assert.deepEqual(entran().map((t) => [t.tarea, t.oi.operacion]), [
        ['bloquear', 'od'],
        ['mantener', 'oc1'],
        ['ocupar', 'oc2'],
        ['atacar_fuego', 'oc3'],
      ])
      texto = await editor(page).innerText()
      assert.ok(/✅ 4/.test(texto) && texto.includes('✅ Todas designadas, con una sola OD.'), 'paso ④ listo')
      await paso(page, 4).screenshot({ path: path.join(out, `${tag}-paso4.png`) })
      const od = entran()[0]
      assert.equal(od.oi.piezas.length, 2, 'la OD con dos compañías genéricas')

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
      assert.ok(st.tareas.filter((t) => t.oi?.operacion && t.oi.operacion !== 'fuera').every((t) => t.oi.agId), 'cada tarea vinculada a su agrupación')
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
      for (const t of ['FORMACIÓN INICIAL DE LAS FUERZAS', 'OPERACIÓN', 'ENEMIGO EN SU SECTOR', 'OD — OPERACIÓN DECISIVA (ESFUERZO PRINCIPAL)', 'BLOQUEAR — T: BLOQUEAR A LAS UNIDADES MECANIZADAS Y BLINDADAS DE LA FT-43', 'ORGANIZACIÓN DE LA TAREA (FORMA GRÁFICA)'])
        assert.ok(previa.toUpperCase().includes(t), `la vista previa no trae «${t}»`)
      const img = await page.frameLocator('iframe[title="vista previa"]').locator('img[alt="ORGANIZACIÓN DE LA TAREA (FORMA GRÁFICA)"]').evaluate((i) => ({ w: i.naturalWidth, src: i.src.slice(0, 25) }))
      assert.ok(img.w > 600 && img.src === 'data:image/svg+xml;base64', 'la forma gráfica se ve en la vista previa: ' + JSON.stringify(img))
      await page.getByRole('button', { name: '← Volver' }).dispatchEvent('click')
      await page.locator('.oi-editor').waitFor({ timeout: 5000 })
      const descarga = page.waitForEvent('download', { timeout: 20000 })
      await page.getByRole('button', { name: /Word \(hoja de trabajo\)/ }).dispatchEvent('click')
      const dl = await descarga
      const archivo = path.join(out, `${tag}-${dl.suggestedFilename()}`)
      await dl.saveAs(archivo)
      const xml = require('node:child_process').execFileSync('unzip', ['-p', archivo, 'word/document.xml'], { encoding: 'utf8' })
      assert.ok(/Operación Decisiva/.test(xml) && /ENEMIGO EN SU SECTOR/.test(xml), 'el Word de la hoja con el cuadro nuevo')
      assert.ok(xml.includes('<w:tbl>') || xml.includes('<w:tbl '), 'el cuadro es una TABLA, no renglones de texto')
      assert.ok(/w:orient="landscape"/.test(xml), 'apaisado')
      assert.ok(xml.includes('ORGANIZACIÓN DE LA TAREA (FORMA GRÁFICA)'), 'con el título de la forma gráfica')
      const medios = require('node:child_process').execFileSync('unzip', ['-l', archivo], { encoding: 'utf8' })
      assert.ok(/word\/media\/[^\s]+\.png/.test(medios), 'la forma gráfica va como imagen en el Word: ' + medios)

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
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: ① lo que se considera, ② cuatro tareas tocando la carta, orientadas, sin OD/OC, ③ las fuerzas por tipo (+/−), proporciones, reparto y reserva, ④ la OD y las OC al final (propuesta y corregida), ⑤ rótulos y triángulos en la carta${movil ? '' : ' (y en el 3D)'}, ⑥ forma gráfica, ⑦ Organización de la Tarea y cuadro, guardado.`)
    } catch (e) {
      console.error('ERRORES APP', a.errores)
      console.error('DIÁLOGOS', dialogos)
      await page.screenshot({ path: path.join(out, `${tag}-ERROR.png`) }).catch(() => {})
      await a.cerrar()
      throw e
    }
    await a.cerrar()
  }
  await traerDeLaOrden()
  await telefono()
  await tableta({ ancho: 820, alto: 1180, nombre: 'ipad-vertical' })
  await tableta({ ancho: 1180, alto: 820, nombre: 'ipad-horizontal' })
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
    // La tarea del análisis de la misión no entra.
    await page.locator('.oi-tarea[data-n="1"]').getByRole('button', { name: '🚫 No entra' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    // ⬅️ Partir de lo que ya armé: las tres agrupaciones pasan a la carta como tareas.
    await paso(page, 2).getByRole('button', { name: '⬅️ Partir de lo que ya armé' }).dispatchEvent('click')
    await page.waitForTimeout(400)
    let st = await estadoOps(page)
    const conOp = st.tareas.filter((t) => t.oi && t.oi.operacion && t.oi.operacion !== 'fuera')
    assert.deepEqual(conOp.map((t) => [t.tarea, t.oi.operacion, t.oi.agId, t.oi.piezas.length]), [
      ['apoyar_fuego', 'oc1', 'ag-oc1', 3],
      ['atacar_fuego', 'od', 'ag-od', 4],
      ['seguir_asumir', 'oc2', 'ag-oc2', 0],
    ])
    // En el teléfono la carta no se puede tocar: otra tarea, directamente en el objetivo Oa,
    // apuntando al otro lado.
    await page.locator('.oi-nueva').getByRole('combobox', { name: 'Tarea táctica' }).selectOption('atacar_fuego')
    await page.locator('.oi-nueva').getByRole('button', { name: 'Al otro lado la nueva tarea' }).dispatchEvent('click')
    await page.locator('.oi-nueva').getByRole('button', { name: '🎯 en Oa' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    st = await estadoOps(page)
    const nueva = st.tareas[st.tareas.length - 1]
    assert.ok(nueva.tarea === 'atacar_fuego' && nueva.centro[0] === -68.3 && nueva.centro[1] === -16.86 && nueva.rot === 180 && nueva.oi.operacion === '', 'la T4 en el objetivo Oa, al revés y sin designar: ' + JSON.stringify(nueva))
    assert.deepEqual(nueva.oi.enemigos, [], 'nadie dentro de su sector (6 km de Oa): no se inventa enemigo')
    // «→ Ob» la lleva al otro objetivo.
    await page.locator('.oi-tarea[data-n="4"]').getByRole('button', { name: '→ Ob' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    st = await estadoOps(page)
    assert.deepEqual(st.tareas[st.tareas.length - 1].centro, [-68.27, -16.93])
    // ③ El enemigo de la OD por cercanía; ④ la nueva es la OC 3.
    await page.locator('.oi-fuerzas[data-op="od"]').getByRole('button', { name: '✨ Proponer por cercanía' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    await page.locator('.oi-designar[data-n="4"]').getByRole('button', { name: 'OC 3', exact: true }).dispatchEvent('click')
    await page.waitForTimeout(300)
    // ⑦ A la Organización de la Tarea: las MISMAS agrupaciones (con su nombre y su propósito), sin duplicar.
    await paso(page, 7).getByRole('button', { name: '🧩 Pasar a la Organización de la Tarea' }).dispatchEvent('click')
    await page.getByText('🧩 ORGANIZACIÓN DE LA TAREA').waitFor({ timeout: 5000 })
    st = await estadoOps(page)
    assert.deepEqual(st.org.map((x) => [x.id, x.nombre, x.operacion, x.piezas.length]), [
      ['ag-oc1', 'FT TORREZ', 'oc1', 3],
      ['ag-od', 'FT VARGS', 'od', 4],
      ['ag-oc2', 'FT LANZA', 'oc2', 0],
      [st.org[3].id, '', 'oc3', 0],
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
    console.log('OK teléfono: la hoja entra sin desborde; ⬅️ partir de la Organización de la Tarea armada antes (fuera de orden); una tarea más en el objetivo, al revés, designada OC 3; las mismas agrupaciones, sin duplicar; el cuadro viejo se reemplaza preguntando.')
  } catch (e) {
    console.error('ERRORES APP', a.errores)
    console.error('DIÁLOGOS', dialogos)
    await page.screenshot({ path: path.join(out, 'movil-ERROR.png') }).catch(() => {})
    await a.cerrar()
    throw e
  }
  await a.cerrar()
}

// En un iPad (con el dedo), parado y acostado: la OD se coloca tocando la carta (parado, el
// panel se esconde mientras se elige el lugar), la OC 1 directamente en el objetivo Ob, el
// reparto y el paso a la Organización de la Tarea; la hoja entra sin desborde.
async function tableta({ ancho, alto, nombre }) {
  const a = await abrir({ ancho, alto, movil: true, consulta: '?puesto=g3' })
  const { page } = a
  const dialogos = []
  page.on('dialog', (d) => (dialogos.push(d.message()), d.accept()))
  const datos = ejercicioOrganizacion()
  try {
    await sembrarYAbrir(page, datos)
    await irALaHoja(page)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().dispatchEvent('click')
    const d = await page.evaluate(() => {
      const el = document.querySelector('.oi-editor')
      return { sw: el.scrollWidth, cw: el.clientWidth }
    })
    assert.ok(d.sw <= d.cw + 1, `la hoja desborda en el ${nombre}: ` + JSON.stringify(d))
    await page.evaluate(() => window.__mapa2d.setView([-16.85, -68.31], 11, { animate: false }))
    await page.waitForTimeout(500)
    await page.locator('.oi-tarea[data-n="1"]').getByRole('button', { name: '🚫 No entra' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    const nueva = page.locator('.oi-nueva')
    await nueva.getByRole('combobox', { name: 'Tarea táctica' }).selectOption('bloquear')
    await nueva.getByRole('button', { name: '📍 Colocarla en la carta' }).dispatchEvent('click')
    await page.locator('.oi-cartel').waitFor({ timeout: 5000 })
    if (ancho < 900) assert.equal(await page.locator('.oi-editor').evaluate((el) => getComputedStyle(el).visibility), 'hidden', 'parado, el panel se esconde para elegir el lugar')
    await tocarCarta(page, -68.3, -16.83, { toque: true })
    await page.locator('.oi-cartel').waitFor({ state: 'detached', timeout: 5000 })
    assert.equal(await page.locator('.oi-editor').evaluate((el) => getComputedStyle(el).visibility), 'visible', 'el panel vuelve')
    let st = await estadoOps(page)
    const t1 = st.tareas.find((t) => t.tarea === 'bloquear')
    assert.ok(t1 && Math.abs(t1.centro[0] + 68.3) < 0.01 && Math.abs(t1.centro[1] + 16.83) < 0.01, `la T1 donde se tocó: ${t1 && t1.centro}`)
    await nueva.getByRole('combobox', { name: 'Tarea táctica' }).selectOption('mantener')
    await nueva.getByRole('button', { name: '🎯 en Ob' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    // Con el dedo: la orientación de la T2 y una compañía de caballería a la T1.
    await page.locator('.oi-tarea[data-n="2"]').getByRole('button', { name: 'Girar 90 grados T2' }).tap()
    await page.locator('.oi-fuerzas[data-n="1"]').getByRole('button', { name: 'Agregar Caballería Blindada' }).tap()
    await page.waitForTimeout(300)
    await paso(page, 3).getByRole('button', { name: '⚡ Proponer el reparto de la maniobra' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    await page.locator('.oi-designar[data-n="1"]').getByRole('button', { name: 'OD', exact: true }).tap()
    await page.waitForTimeout(200)
    await page.locator('.oi-designar[data-n="2"]').getByRole('button', { name: 'OC 1', exact: true }).tap()
    await page.waitForTimeout(300)
    st = await estadoOps(page)
    assert.equal(st.tareas.find((t) => t.tarea === 'mantener').rot, 90)
    await paso(page, 7).getByRole('button', { name: '🧩 Pasar a la Organización de la Tarea' }).dispatchEvent('click')
    await page.getByText('🧩 ORGANIZACIÓN DE LA TAREA').waitFor({ timeout: 5000 })
    st = await estadoOps(page)
    assert.deepEqual(st.org.filter((x) => x.operacion !== 'reserva').map((x) => [x.operacion, x.tarea]), [
      ['od', 'bloquear'],
      ['oc1', 'mantener'],
    ])
    assert.equal(st.org[0].piezas.length, 2)
    await page.screenshot({ path: path.join(out, `${nombre}-organizacion-tarea.png`) })
    await page.getByRole('button', { name: '✕ Cerrar' }).dispatchEvent('click')
    await page.screenshot({ path: path.join(out, `${nombre}-hoja.png`) })
    assert.deepEqual(a.errores, [])
    console.log(`OK ${nombre}: la hoja sin desborde; una tarea tocando la carta con el dedo${ancho < 900 ? ' (el panel se esconde y vuelve)' : ''} y otra en el objetivo Ob; orientación, fuerzas (+), reparto, OD y OC 1 con el dedo; Organización de la Tarea.`)
  } catch (e) {
    console.error('ERRORES APP', a.errores)
    console.error('DIÁLOGOS', dialogos)
    await page.screenshot({ path: path.join(out, `${nombre}-ERROR.png`) }).catch(() => {})
    await a.cerrar()
    throw e
  }
  await a.cerrar()
}

// La Orden trae la infantería (RIM-8 «AYACUCHO», RIM-23 «MAX TOLEDO»…) que no estaba en el
// calco: «📄 Traer las unidades de la Orden» lee el cuadro de la organización de un documento
// del ejercicio, se revisa y quedan en la carta como fichas; ya se pueden repartir.
async function traerDeLaOrden() {
  const a = await abrir({ ancho: 1440, alto: 1000, movil: false, consulta: '?puesto=g3' })
  const { page } = a
  const dialogos = []
  page.on('dialog', (d) => (dialogos.push(d.message()), d.accept()))
  const datos = ejercicioOrganizacion()
  datos.documentos = [{ nombre: 'Orden de Operaciones N° 1 (FICT.).pdf', tipo: 'pdf', mime: 'application/pdf', categoria: 'orden', texto: fs.readFileSync(path.join(__dirname, '..', 'organizacion-orden.txt'), 'utf8'), base64: null, paginas: 3 }]
  const unidadesDe = () =>
    page.evaluate(() => {
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
          if (Array.isArray(v) && v.length && v.every((u) => u && typeof u === 'object' && 'bando' in u && 'lat' in u)) return v
        }
        if (n.child) pila.push(n.child)
        if (n.sibling) pila.push(n.sibling)
      }
      return []
    })
  try {
    await sembrarYAbrir(page, datos)
    await irALaHoja(page)
    const antes = (await unidadesDe()).length
    await paso(page, 1).getByRole('button', { name: /Traerla de la Orden/ }).dispatchEvent('click')
    await page.locator('.oi-traer').waitFor({ timeout: 5000 })
    await page.locator('.oi-traer').getByRole('button', { name: /Orden de Operaciones N° 1/ }).dispatchEvent('click')
    await page.waitForTimeout(300)
    const filas = page.locator('.oi-traer .oi-traida')
    assert.equal(await filas.count(), 12)
    const t = await page.locator('.oi-traer').innerText()
    assert.ok(t.includes('⚠️ RIAT: ¿infantería aerotransportada') && t.includes('⚠️ No encontré sus subunidades'), 'lo dudoso (RIAT-30, la aviación) se marca')
    assert.equal(await page.locator('.oi-traer').getByRole('combobox', { name: 'Arma de RIM-8 «AYACUCHO»' }).inputValue(), 'mecanizada')
    assert.equal(await page.locator('.oi-traer').getByRole('combobox', { name: 'Arma de COMP. ICIA.- I «USTARIZ»' }).inputValue(), 'inteligencia')
    // La aviación queda afuera (está BAJO CONTROL de la Orden: el oficial la destilda).
    await page.locator('.oi-traer').getByRole('checkbox', { name: 'Traer Comp. Av. Ejto. «Cnl. Lopez»' }).dispatchEvent('click')
    await page.locator('.oi-traer').screenshot({ path: path.join(out, 'orden-traer.png') })
    await page.locator('.oi-traer').getByRole('button', { name: '🪖 Ponerlas en la carta (11)' }).dispatchEvent('click')
    await page.waitForTimeout(600)
    const us = await unidadesDe()
    assert.equal(us.length, antes + 11)
    const rim8 = us.find((u) => u.designacion === 'RIM-8 «AYACUCHO»')
    assert.deepEqual([rim8.bando, rim8.tipo, rim8.arma, rim8.escalon, rim8.piezas, rim8.escalonPiezas], ['propias', 'unidad', 'mecanizada', 'regimiento', 4, 'compania'])
    assert.ok(Number.isFinite(rim8.lat) && Number.isFinite(rim8.lng))
    const p3 = await paso(page, 3).innerText()
    assert.ok(/INF MEC 8\/8/.test(p3), 'las 8 compañías de infantería mecanizada (RIM-8 y RIM-23): ' + p3.slice(0, 800))
    assert.ok(/ICIA 3\/3/.test(p3) && /ADA 3\/3/.test(p3), 'la inteligencia y la antiaérea con su pieza')
    // Una tarea, y la infantería mecanizada a ella.
    await page.locator('.oi-nueva').getByRole('button', { name: '🎯 en Oa' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    const tN = await page.locator('.oi-fuerzas').first().getAttribute('data-n')
    const tarj = page.locator(`.oi-fuerzas[data-n="${tN}"]`)
    await tarj.getByRole('button', { name: 'Agregar Infantería mecanizada' }).dispatchEvent('click')
    await page.waitForTimeout(300)
    assert.ok(/Salen de: RIM-8 «AYACUCHO» \(1 Cía\.\)|Salen de: RIM-23 «MAX TOLEDO» \(1 Cía\.\)/.test(await tarj.innerText()), await tarj.innerText())
    // Las fichas nuevas se ven en la carta, sin errores.
    await page.screenshot({ path: path.join(out, 'orden-carta.png') })
    // Si se vuelve a leer, las que ya están en el calco vienen destildadas.
    await paso(page, 3).getByRole('button', { name: /Traerla de la Orden/ }).dispatchEvent('click')
    await page.locator('.oi-traer').getByRole('button', { name: /Orden de Operaciones N° 1/ }).dispatchEvent('click')
    await page.waitForTimeout(300)
    assert.ok((await page.locator('.oi-traer').innerText()).includes('ya en el calco'))
    assert.ok(await page.locator('.oi-traer').getByRole('button', { name: '🪖 Ponerlas en la carta (1)' }).count(), 'sólo la que no se trajo')
    assert.deepEqual(a.errores, [])
    console.log('OK la Orden: el cuadro de la organización de un documento → 12 unidades (la infantería RIM-8 y RIM-23 entre ellas), revisadas y en la carta; ya se reparten (INF MEC); al volver a leer, las ya traídas no se repiten.')
  } catch (e) {
    console.error('ERRORES APP', a.errores)
    console.error('DIÁLOGOS', dialogos)
    await page.screenshot({ path: path.join(out, 'orden-ERROR.png') }).catch(() => {})
    await a.cerrar()
    throw e
  }
  await a.cerrar()
}
