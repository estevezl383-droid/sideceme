// 🎯 Las tareas de cada fase de los CAP CON SU UNIDAD, el rótulo OD / OC con la unidad y ➜ el itinerario con flechas
// (index-itinerario-20261025.js), en la Mesa real (Chromium). El caso de Sergio, 25-10-2026, con la FASE I del CAP 1 a
// la vista: «la OC y la OD deben permanecer con su nombre con la unidad… están solas ya esperando en un lugar», «las
// tareas tácticas deben aparecer con la unidad», «cada fase tiene una tarea táctica diferente, y las que se ven sólo
// aparecerían en la FASE III», «que su desplazamiento quede marcado con una línea flecha… violeta y fucsia» y «el CAP 2
// no está funcionando nada» (sus 5 fases eran copias: todas las fichas en el mismo lugar). Con sus agrupaciones (OD,
// OC 1, OC 2, RES) y las tareas de la F3·P3 en la carta:
//   · CAP 1: FASE I las tareas de la F3·P3 no se ven y los rótulos OD / OC están junto a su agrupación (con el CE);
//     FASE III las tres tareas, cada una con su agrupación; FASE IV y V otra tarea en cada fase, pegada a la ficha
//     (destruir, contener, fijar; destruir, mantener); el itinerario en VIOLETA, que en la FASE V tiene todos los tramos;
//   · CAP 2: tocar una de sus fases copiadas ofrece armarlas; armadas, el itinerario en FUCSIA;
//   · el CAP guardado se arma desde su tarjeta; sin errores de consola;
//   · ➜ el botón de la tarjeta apaga y prende las flechas (Sergio, 25-10-2026: «necesito un botón que desactive las
//     flechas de los itinerarios»), también en las otras fases, y queda para la próxima vez.
//   node calcos/pruebas/e2e/itinerario.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-itinerario')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const km = (a, b) => Math.hypot((a[0] - b[0]) * 105.6, (a[1] - b[1]) * 110.6)
const CE = [-68.4, -18.55]
const posU = (page, id) => estadoReact(page, new Function('v', `return Array.isArray(v) && v.some((u) => u && u.id === 'divmec2' && u.bando) ? (() => { const u = v.find((x) => x.id === '${id}'); return u ? [u.lng, u.lat] : null })() : undefined`))
const leerOps = (page) =>
  estadoReact(page, (v) =>
    v && !Array.isArray(v) && Array.isArray(v.obstaculos) && Array.isArray(v.limites)
      ? JSON.parse(JSON.stringify({ tareas: (v.tareas || []).map((t) => `${t.tarea}${t.oi ? `·${t.oi.operacion}` : t.capMesa ? `·${t.capMesa.unidad}` : ''}`).sort(), ocultas: (v.tareasOcultas || []).map((t) => t.oi?.operacion || t.tarea).sort() }))
      : undefined,
  )
// Las tareas pegadas a las fichas propias (la de su rol en la fase a la vista): «tarea·unidad».
const pegadas = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.some((u) => u && u.id === 'divmec2' && u.bando) ? v.filter((u) => u && u.tareaSimbolo && u.bando !== 'enemigo' && u.bando !== 'enemigas').map((u) => `${u.tareaSimbolo}·${u.designacion}`).sort() : undefined))
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v._caps && typeof v._caps === 'object' ? JSON.parse(JSON.stringify({ activo: v._caps.activo, guardados: Object.keys(v._caps.guardados || {}) })) : undefined))
// Los tramos del itinerario en la carta: por color.
const flechas = (page) =>
  page.evaluate(() => {
    const out = { '#8f00ff': 0, '#ff00ff': 0, puntas: 0 }
    window.__mapa2d.eachLayer((l) => {
      if (typeof l.getLatLngs === 'function' && l.options && out[l.options.color] != null) out[l.options.color]++
      if (l.options && l.options.icon && l.options.icon.options && l.options.icon.options.className === 'cap-iti-punta') out.puntas++
    })
    return out
  })
// ¿El rótulo está junto a la ficha? (a la derecha de su centro, a la misma altura)
const rotuloJunto = (page, rotulo, id) =>
  page.evaluate(([r, u]) => {
    const a = document.querySelector(`[data-oi-rotulo="${r}"]`)
    const b = document.querySelector(`[data-sid-unidad="${u}"]`)
    if (!a || !b) return { falta: !a ? r : u }
    const ra = a.getBoundingClientRect()
    const rb = b.getBoundingClientRect()
    return { dx: Math.round(ra.left - (rb.left + rb.width / 2)), dy: Math.round(ra.top + ra.height / 2 - (rb.top + rb.height / 2)) }
  }, [rotulo, id])
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}
const ag = (id, nom, op, lng, lat, arma, piezas = []) => ({ id, designacion: nom, bando: 'propias', tipo: 'unidad', escalon: 'brigada', arma, lng, lat, agId: 'g-' + id, esAgrupacion: true, agrupacion: true, operacionAg: op, piezasAg: piezas, tareaAg: '', propositoAg: '' })

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push(d.message())
    d.accept()
  })
  const foto = (nm) => page.screenshot({ path: path.join(SALIDAS, nm + '.png') })
  const ej = ejercicioConcepto({ nombre: 'PRUEBA ITINERARIO CE-I (FICT.)' })
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  ej.ops.limites = [
    { nombre: 'LPR (LF «PUMA»)', coords: [[-68.86, -18.3], [-68.84, -18.9]], co: { id: 'x1', rol: 'lpr' } },
    { nombre: 'LDE-1', coords: [[-69.08, -18.3], [-69.08, -18.9]], tipo: 'punteada', co: { id: 'x2', rol: 'linea' } },
    { nombre: 'EJE CA-1', coords: [[-68.55, -18.62], [-68.86, -18.48]], tipo: 'flecha', co: { id: 'x3', rol: 'eje-ca' } },
    { nombre: 'LÍM. DIV MEC-2 / DIV-1', coords: [[-68.4, -18.59], [-69.1, -18.59]], co: { id: 'x4', rol: 'limite-sector' } },
  ]
  ej.ops.obstaculos = [
    { tipo: 'minado_ac', coords: [[-68.9, -18.44], [-68.9, -18.46]] },
    { tipo: 'zanja_at', centro: [-68.88, -18.4], coords: [[-68.885, -18.4], [-68.875, -18.4]] },
    { tipo: 'minado_ac', centro: [-68.9, -18.75], coords: [[-68.9, -18.745], [-68.9, -18.755]] },
  ]
  // Las tareas de la Formación inicial (F3·P3) en la carta, con su OD / OC y su agrupación.
  ej.ops.tareas = [
    { centro: [-68.8, -18.44], tarea: 'bloquear', escalon: 'brigada', rot: 270, escala: 1, oi: { id: 'oi-od', operacion: 'od', agId: 'g-ag-od', piezas: [], texto: '', enemigos: [] } },
    { centro: [-68.8, -18.71], tarea: 'fijar', escalon: 'brigada', rot: 270, escala: 1, oi: { id: 'oi-oc1', operacion: 'oc1', agId: 'g-ag-oc1', piezas: [], texto: '', enemigos: [] } },
    { centro: [-68.84, -18.57], tarea: 'contener', escalon: 'brigada', rot: 270, escala: 1, oi: { id: 'oi-oc2', operacion: 'oc2', agId: 'g-ag-oc2', piezas: [], texto: '', enemigos: [] } },
  ]
  ej.g3 = {
    ...ej.g3,
    conceptoCarta: { marcas: [
      { tipo: 'esfuerzo', clase: 'principal', texto: 'ESFUERZO PRINCIPAL · DIV MEC-2', centro: [-68.8, -18.47], co: { id: 'm1' } },
      { tipo: 'esfuerzo', clase: 'secundario', texto: 'ESFUERZO SECUNDARIO · DIV-1', centro: [-68.8, -18.78], co: { id: 'm2' } },
      { tipo: 'reserva', texto: 'RES · DIV-6', centro: [-68.55, -18.62], co: { id: 'm3' } },
    ] },
    organizacionInicial: { verEnCarta: true, reserva: { piezas: [], agId: 'g-ag-res' } },
  }
  ej.unidades = [
    ...ej.unidades,
    ag('ag-od', 'OD', 'od', -68.75, -18.45, 'mecanizada', [{ id: 'divmec2-1', de: 'divmec2', madre: 'DIV MEC-2' }]),
    ag('ag-oc1', 'OC 1', 'oc1', -68.75, -18.72, 'infanteria', [{ id: 'div1-1', de: 'div1', madre: 'DIV-1' }]),
    ag('ag-oc2', 'OC 2', 'oc2', -68.8, -18.57, 'infanteria'),
    ag('ag-res', 'RES', 'reserva', -68.5, -18.62, 'artilleria', [{ id: 'div6-1', de: 'div6', madre: 'DIV-6' }]),
  ]
  // El CAP 2 guardado con sus 5 fases COPIADAS (todas las fichas en el mismo lugar), como el de Sergio.
  const copia = ['Concentración', 'Desplazamiento', 'Organización de la defensa móvil', 'Retardo y canalización', 'Contraataque y consolidación'].map((nombre) => ({ nombre, unidades: ej.unidades.map((u) => ({ ...u })), ops: ej.ops, desplazamientos: [], origen: 'Mesa · CAP 2' }))
  ej.g3._caps = { activo: 1, formas: { 1: 'area', 2: 'movil' }, guardados: { 2: { fases: copia } } }
  try {
    await sembrarYAbrir(page, ej)
    // La reserva de la F3·P3 con piezas de verdad (las que da la Mesa al disgregar la DIV-6): así tiene su rótulo RES.
    await page.waitForTimeout(500)
    const piezasRes = await page.evaluate(async () => {
      const rt = await import('./organizacion/v1/runtime.js')
      const c = await import('./organizacion/v1/carta.js')
      const p = c.datosPuente()
      const pz = rt.simb.piezasDe((p.unidades || []).find((u) => u.id === 'div6')).slice(0, 2)
      p.setG3((g) => ({ ...g, organizacionInicial: { ...(g.organizacionInicial || {}), verEnCarta: true, reserva: { ...((g.organizacionInicial || {}).reserva || {}), piezas: pz, agId: 'g-ag-res' } } }))
      return pz.length
    })
    assert.ok(piezasRes > 0, 'la reserva con piezas')
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first())
    const panel = page.locator('[data-cap-panel="coa"]')
    await panel.waitFor({ timeout: 10000 })
    await panel.locator('[data-quietas="2"]').waitFor({ timeout: 5000 })
    assert.match(await panel.locator('[data-quietas="2"]').innerText(), /MISMO lugar.*Tocá «🎬 Armar las fases de este CAP» \(acá abajo\)/)
    assert.equal(await panel.locator('[data-armar-cap="2"]').count(), 1, 'el CAP guardado se arma desde su tarjeta, el botón apaga y prende las flechas')
    assert.equal(await panel.locator('[data-armar-cap="1"]').count(), 0, 'el activo, con el botón de abajo')
    assert.match(await panel.locator('[data-itinerario-cap="1"]').innerText(), /flechas VIOLETAS/)
    assert.match(await panel.locator('[data-itinerario-cap="2"]').innerText(), /flechas FUCSIAS/)
    const vista = async (nombre) => {
      await page.evaluate(() => {
        window.__mapa2d.fitBounds([[-18.95, -69.4], [-18.25, -68.25]])
      })
      await page.waitForTimeout(700)
      await foto(nombre)
    }
    const fase = async (n, i) => {
      await clic(panel.locator(`[data-fases-cap="${n}"] button[data-fase="${i}"]`))
      await page.waitForTimeout(500)
    }

    // ── CAP 1: armar sus fases ──
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 1/ }))
    await page.waitForTimeout(800)
    // FASE I (a la vista al armar): todas con el CE; las tareas de la F3·P3 guardadas aparte; los rótulos con su agrupación.
    await esperar(page, (p) => posU(p, 'ag-od'), (q) => km(q, CE) <= 6.1)
    let ops = await esperar(page, leerOps, (o) => o.ocultas.length === 3)
    assert.deepEqual(ops, { tareas: [], ocultas: ['oc1', 'oc2', 'od'] }, 'FASE I: ninguna tarea a la vista')
    assert.deepEqual(await pegadas(page), [], 'FASE I: ninguna tarea pegada a las fichas')
    await vista('1-cap1-faseI')
    for (const [r, id] of [['OD', 'ag-od'], ['OC 1', 'ag-oc1'], ['OC 2', 'ag-oc2'], ['RES', 'ag-res']]) {
      const j = await rotuloJunto(page, r, id)
      assert.ok(!j.falta && j.dx >= 0 && j.dx <= 60 && Math.abs(j.dy) <= 20, `FASE I: el rótulo ${r} junto a su agrupación (${JSON.stringify(j)})`)
    }
    let fl = await flechas(page)
    assert.equal(fl['#8f00ff'], 0, 'FASE I: todavía sin itinerario')

    // La hoja F3·P3 abierta con la FASE I a la vista: cuenta sus 3 tareas (las guardadas para la FASE III) y lo dice.
    await clic(page.getByRole('button', { name: /Volver a mis documentos/ }).first())
    const f3p3 = page.getByRole('button', { name: /F3·P3.*Formación inicial de las fuerzas/ }).first()
    if (!(await f3p3.count())) await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P3.*Formación inicial de las fuerzas/ }).first())
    const avisoOcultas = page.locator('[data-oi-ocultas="3"]')
    await avisoOcultas.waitFor({ timeout: 10000 })
    assert.match(await avisoOcultas.innerText(), /3 de estas tareas no se ven: son de la FASE III/)
    await page.getByText('3 tarea(s) táctica(s) en la carta.', { exact: false }).first().waitFor({ timeout: 5000 })
    assert.equal(await page.getByRole('button', { name: /Partir de lo que ya armé/ }).count(), 0, 'no ofrece rearmar las tareas guardadas')
    await foto('1b-f3p3-con-la-faseI')
    await clic(page.getByRole('button', { name: /Volver a mis documentos/ }).first())
    const f3p6 = page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first()
    if (!(await f3p6.count())) await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first())
    await panel.waitFor({ timeout: 10000 })
    assert.deepEqual(await leerOps(page), { tareas: [], ocultas: ['oc1', 'oc2', 'od'] }, 'la hoja no cambió la FASE I')

    // FASE III: las tres tareas de la F3·P3, cada una con su agrupación; el itinerario I → II → III en violeta.
    await fase(1, 3)
    ops = await esperar(page, leerOps, (o) => o.tareas.length === 3)
    assert.deepEqual(ops, { tareas: ['bloquear·od', 'contener·oc2', 'fijar·oc1'], ocultas: [] }, 'FASE III: las de la F3·P3')
    assert.deepEqual(await pegadas(page), [], 'FASE III: las de la carta no se repiten pegadas')
    for (const [id, c] of [['ag-od', [-68.8, -18.44]], ['ag-oc1', [-68.8, -18.71]], ['ag-oc2', [-68.84, -18.57]]]) {
      const q = await posU(page, id)
      assert.ok(km(q, c) <= 3, `FASE III: ${id} con su tarea (${km(q, c).toFixed(1)} km)`)
    }
    await vista('2-cap1-faseIII')
    const j3 = await rotuloJunto(page, 'OD', 'ag-od')
    assert.ok(j3.dx >= 0 && j3.dx <= 60 && Math.abs(j3.dy) <= 20, `FASE III: el rótulo OD con la OD (${JSON.stringify(j3)})`)
    const fl3 = await flechas(page)
    assert.ok(fl3['#8f00ff'] >= 6, `FASE III: los tramos en violeta (${JSON.stringify(fl3)})`)
    assert.equal(fl3['#ff00ff'], 0)
    assert.ok(fl3.puntas >= 6, 'cada tramo con su punta de flecha')

    // FASE IV y V: OTRA tarea en cada fase, pegada a la ficha que la cumple; las de la F3·P3, guardadas aparte.
    await fase(1, 4)
    ops = await esperar(page, leerOps, (o) => o.ocultas.length === 3)
    assert.deepEqual(ops, { tareas: [], ocultas: ['oc1', 'oc2', 'od'] }, 'FASE IV: las de la F3·P3 no se ven')
    assert.deepEqual(await esperar(page, pegadas, (x) => x.length === 3), ['contener·OC 1', 'destruir·OD', 'fijar·OC 2'], 'FASE IV: cada una con una tarea distinta de la de la FASE III')
    await vista('3-cap1-faseIV')
    await fase(1, 5)
    assert.deepEqual(await esperar(page, pegadas, (x) => x.includes('destruir·RES')), ['destruir·RES', 'mantener·OC 1', 'mantener·OC 2', 'mantener·OD'], 'FASE V: la reserva destruye, los demás mantienen')
    const res5 = await posU(page, 'ag-res')
    const j5 = await rotuloJunto(page, 'RES', 'ag-res')
    assert.ok(j5.dx >= 0 && j5.dx <= 60 && Math.abs(j5.dy) <= 20, `FASE V: la RES con la reserva que contraataca (${JSON.stringify(j5)}, ${res5})`)
    const fl5 = await flechas(page)
    assert.ok(fl5['#8f00ff'] > fl3['#8f00ff'], `FASE V: todo el itinerario (${fl5['#8f00ff']} tramos > ${fl3['#8f00ff']})`)
    await vista('4-cap1-faseV')

    // ➜ El botón que apaga las flechas («necesito un botón que desactive las flechas de los itinerarios»): en la tarjeta
    // del CAP a la vista; queda apagado al cambiar de fase y para la próxima vez; vuelve a prenderlas.
    const btnFlechas = panel.locator('[data-iti-flechas]')
    assert.equal(await btnFlechas.count(), 1, 'el botón de las flechas, en la tarjeta del CAP a la vista')
    assert.match(await btnFlechas.innerText(), /Ocultar las flechas del itinerario/)
    await clic(btnFlechas)
    await page.waitForTimeout(300)
    assert.deepEqual(await flechas(page), { '#8f00ff': 0, '#ff00ff': 0, puntas: 0 }, 'apagadas: sin flechas')
    assert.match(await btnFlechas.innerText(), /Mostrar las flechas del itinerario/)
    assert.equal(await page.evaluate(() => localStorage.getItem('sid-iti-flechas')), '0', 'queda para la próxima vez')
    await fase(1, 4)
    assert.equal((await flechas(page))['#8f00ff'], 0, 'apagadas también en otra fase')
    await vista('4b-cap1-faseIV-sin-flechas')
    await fase(1, 5)
    await clic(btnFlechas)
    await page.waitForTimeout(300)
    assert.equal((await flechas(page))['#8f00ff'], fl5['#8f00ff'], 'prendidas de nuevo: todo el itinerario')
    assert.match(await btnFlechas.innerText(), /Ocultar las flechas del itinerario/)

    // ── CAP 2: sus fases eran copias; tocar una ofrece armarlas ──
    dialogos.length = 0
    await fase(2, 2)
    await page.waitForTimeout(800)
    assert.ok(dialogos.some((t) => /Las 5 fases del CAP 2 tienen TODAS las fichas en el MISMO lugar[\s\S]*¿Las armo ahora\?/.test(t)), dialogos.join(' | '))
    const g3 = await esperar(page, leerG3, (g) => g.activo === 2)
    assert.deepEqual(g3, { activo: 2, guardados: ['1'] }, 'ahora se trabaja el CAP 2')
    const od2 = await esperar(page, (p) => posU(p, 'ag-od'), (q) => km(q, [-68.75, -18.45]) > 1)
    assert.ok(km(od2, [-68.75, -18.45]) > 1, `CAP 2 · FASE II: las fichas ya se mueven (la OD en ${od2})`)
    await panel.locator('[data-quietas="2"]').waitFor({ state: 'detached', timeout: 5000 })
    let fl2 = await esperar(page, flechas, (f) => f['#ff00ff'] > 0)
    assert.ok(fl2['#ff00ff'] > 0 && fl2['#8f00ff'] === 0, `CAP 2: el itinerario en fucsia (${JSON.stringify(fl2)})`)
    await vista('5-cap2-faseII')
    await fase(2, 4)
    assert.deepEqual(await esperar(page, pegadas, (x) => x.includes('canalizar·OD')), ['canalizar·OD', 'contener·OC 1', 'fijar·OC 2'], 'CAP 2 · FASE IV: el retardo canaliza, la fijadora fija o contiene')
    await fase(2, 5)
    fl2 = await esperar(page, flechas, (f) => f['#ff00ff'] > 6)
    assert.ok(fl2['#ff00ff'] > 6, `CAP 2 · FASE V: todo su itinerario en fucsia (${JSON.stringify(fl2)})`)
    await vista('6-cap2-faseV')

    // ── El CAP 1 (ahora guardado) se arma desde su tarjeta y la Mesa vuelve a él ──
    dialogos.length = 0
    await clic(panel.locator('[data-armar-cap="1"]'))
    await page.waitForTimeout(900)
    assert.ok(dialogos.some((t) => /El CAP 1 ya tiene 5 fase\(s\) 🔵 \(guardado\)/.test(t)), dialogos.join(' | '))
    assert.equal((await esperar(page, leerG3, (g) => g.activo === 1)).activo, 1)
    await esperar(page, (p) => posU(p, 'ag-od'), (q) => km(q, CE) <= 6.1)
    assert.ok(km(await posU(page, 'ag-od'), CE) <= 6.1, 'CAP 1 · FASE I a la vista: con el CE')
    fl = await flechas(page)
    assert.equal(fl['#8f00ff'] + fl['#ff00ff'], 0, 'FASE I: sin itinerario')

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e itinerario: las tareas de la F3·P3 sólo en la FASE III y con su agrupación, otra tarea pegada a cada ficha en la IV y la V, los rótulos OD / OC / RES con su unidad, el itinerario violeta (CAP 1) y fucsia (CAP 2) acumulado, el CAP 2 copiado se arma al tocarlo, el CAP guardado se arma desde su tarjeta, el botón apaga y prende las flechas')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
