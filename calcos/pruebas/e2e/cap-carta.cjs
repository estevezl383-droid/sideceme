// 🤖 La IA desarrolla los dos CAP propios y la Mesa los coloca en la carta (index-cap-carta-20261024.js), en la Mesa
// real (Chromium), con el ejercicio de prueba del CE-I y una respuesta de IA de ejemplo (cap-carta-ejemplo.js):
//   · el pedido de «🤖 La IA desarrolla los dos CAP EN LA CARTA» lleva el expediente, la propuesta y las piezas;
//   · ✓ Aplicar arma las 5 fases 🔵 del CAP 1 (a la vista) y guarda las del CAP 2; dice lo que no pudo ubicar;
//   · en la FASE 4 del CAP 1 la DIV MEC-2 está en Guata y están sus dos tareas tácticas; los obstáculos, en el calco;
//   · la F3·P6 del CAP 1 quedó llena; el CAP 2 vuelve con sus fases de defensa móvil; sin errores de consola.
//   node calcos/pruebas/e2e/cap-carta.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')
const { RESPUESTA_TEXTO } = require('../cap-carta-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-cap-carta')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerFases = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.propio) && Array.isArray(v.enemigo) ? JSON.parse(JSON.stringify({ propio: v.propio.map((f) => ({ nombre: f.nombre, tareas: (f.ops?.tareas || []).length, obstaculos: (f.ops?.obstaculos || []).length, div: (f.unidades || []).find((u) => u.id === 'divmec2') })) })) : undefined))
const leerOps = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.obstaculos) && Array.isArray(v.limites) ? { tareas: (v.tareas || []).map((t) => t.tarea), obstaculos: (v.obstaculos || []).length } : undefined))
const leerUnidad = (page, id) => estadoReact(page, new Function('v', `return Array.isArray(v) && v.some((u) => u && u.id === 'divmec2' && u.bando) ? JSON.parse(JSON.stringify(v.find((u) => u.id === '${id}'))) : undefined`))
const leerG3 = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && v._caps && typeof v._caps === 'object' ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(page, leer, cumple, ms = 10000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer(page)
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const ej = ejercicioConcepto({ nombre: 'PRUEBA CAP EN LA CARTA CE-I (FICT.)' })
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  try {
    await sembrarYAbrir(page, ej)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Desarrollar los cursos de acción/ }).first())
    await clic(page.getByRole('button', { name: /F3·P6.*Curso de acción propio/ }).first())
    const panel = page.locator('[data-cap-panel="coa"]')
    await panel.waitFor({ timeout: 10000 })

    // ── El pedido ──
    await clic(panel.getByRole('button', { name: /La IA desarrolla los dos CAP EN LA CARTA/ }))
    await page.evaluate(() => { try { navigator.clipboard.writeText = async () => {} } catch {} })
    await clic(panel.getByRole('button', { name: '📋 Copiar el pedido' }))
    await page.waitForTimeout(800)
    await clic(panel.getByRole('button', { name: '👁 Ver el pedido' }))
    const pedido = await panel.locator('textarea[readonly]').last().inputValue()
    assert.match(pedido, /^# PEDIDO DE TRABAJO PARA LA IA — LEÉ ESTO PRIMERO/, 'la Mesa pone la tarea adelante')
    assert.match(pedido, /# EXPEDIENTE DEL EJERCICIO — MESA DEL ESTADO MAYOR/)
    assert.match(pedido, /# TAREA — DESARROLLAR LOS DOS CURSOS DE ACCIÓN PROPIOS Y COLOCARLOS EN LA CARTA/)
    assert.match(pedido, /- Ungallire → -18\.4700, -69\.0200/)
    assert.match(pedido, /- DIV MEC-2 — division mecanizada — hoy en/)
    assert.match(pedido, /bloquear \(Bloquear\)/, 'el catálogo de tareas tácticas de la Mesa')
    assert.match(pedido, /minado_ac \(Campo minado anticarro/, 'el catálogo de obstáculos de la Mesa')
    await foto('1-pedido')

    // ── Pegar la respuesta y aplicar ──
    // Como la que pegó Sergio: con los errores de siempre de las IA (comillas rectas dentro de un texto, una coma de más
    // y un comentario). La Mesa la tiene que leer igual.
    const ROTA = RESPUESTA_TEXTO.replace('"forma": "movil",', '"forma": "movil", // la "móvil"').replace('"Defiende."', '"Defiende "de área"."').replace(/\]\n(\s*)\}/, '],\n$1}')
    assert.notEqual(ROTA, RESPUESTA_TEXTO)
    await panel.locator('textarea[placeholder="Pegá acá la respuesta completa de la IA…"]').fill(ROTA)
    await clic(panel.getByRole('button', { name: '✓ Aplicar' }))
    await panel.getByText(/🗺️ CAP 1: 5 fases · CAP 2: 5 fases en la carta/).waitFor({ timeout: 8000 })
    await panel.getByText(/No se pudo: CAP 1 · fase 2: la unidad «DIV-7» no está en las fichas; CAP 2 · fase 3: «Cerro Comanchi»/).waitFor({ timeout: 5000 })
    let fc = await esperar(page, leerFases, (f) => f.propio.length === 5)
    assert.deepEqual(fc.propio.map((f) => f.nombre), ['Concentración', 'Desplazamiento', 'Ocupación y organización', 'Conducción de la defensa', 'Contraataque y consolidación'])
    assert.deepEqual([fc.propio[3].div.lng, fc.propio[3].div.lat], [-68.97, -18.49])
    assert.deepEqual(fc.propio.map((f) => f.tareas), [0, 0, 0, 2, 1])
    assert.deepEqual(fc.propio.map((f) => f.obstaculos), [0, 0, 2, 2, 2])
    // La fase 1 está a la vista: la DIV MEC-2 en Turco.
    const u1 = await esperar(page, (p) => leerUnidad(p, 'divmec2'), (u) => u.lng === -68.3)
    assert.deepEqual([u1.lng, u1.lat], [-68.3, -18.5])
    const g3 = await esperar(page, leerG3, (g) => g._caps?.guardados?.[2]?.fases?.length === 5)
    assert.equal(g3._caps.guardados[2].fases.length, 5, 'el CAP 2 quedó guardado')
    assert.equal(g3.coa.QUÉ, 'Defiende "de área". [IA — verificar]', 'la F3·P6 del CAP 1 (con las comillas de adentro)')
    assert.match(g3.coa['Razón fundamental (por qué este CAP)'], /^CAP 1: SIRVE/)
    await foto('2-aplicado')

    // ── La FASE 4 del CAP 1 en el 🎬 C.A. por fases: la DIV MEC-2 en Guata y las dos tareas ──
    await clic(page.getByRole('button', { name: /← Volver a mis documentos/ }).first()).catch(() => {})
    await clic(page.getByRole('button', { name: /C\.A\. POR FASES/i }).first())
    await clic(page.getByRole('button', { name: 'FASE 4', exact: true }).last())
    const ops4 = await esperar(page, leerOps, (o) => o.tareas.length === 2)
    assert.deepEqual(ops4.tareas, ['bloquear', 'fijar'])
    assert.equal(ops4.obstaculos, 2)
    const u4 = await esperar(page, (p) => leerUnidad(p, 'divmec2'), (u) => u.lng === -68.97)
    assert.deepEqual([u4.lng, u4.lat], [-68.97, -18.49])
    await page.evaluate(() => window.__mapa2d.fitBounds([[-18.9, -69.4], [-18.2, -68.2]]))
    await page.waitForTimeout(600)
    await foto('3-cap1-fase4')

    // ── El CAP 2 con sus fases de defensa móvil ──
    await clic(page.locator('[data-cap-botones] button[data-cap="2"]').first())
    fc = await esperar(page, leerFases, (f) => f.propio.length === 5 && f.propio[2].nombre === 'Organización de la defensa móvil')
    assert.equal(fc.propio[3].nombre, 'Retardo y canalización')
    assert.deepEqual(fc.propio.map((f) => f.tareas), [0, 0, 0, 1, 1])

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e CAP en la carta: el pedido con las piezas, la respuesta de la IA en las fases de los dos CAP, tareas y obstáculos en el calco')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
