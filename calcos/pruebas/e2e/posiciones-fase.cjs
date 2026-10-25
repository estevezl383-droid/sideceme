// 📍 Cada fase de un CAP con su dispositivo (index-posiciones-fase-20261024.js), en la Mesa real (Chromium). El caso de
// Sergio: tocaba FASE I… V y las fichas no se movían (las fases se habían armado copiando el dispositivo). Con una carta
// como la suya (la LPR en la LF «PUMA», la LDE-1, el EJE CA-1 y las marcas de la F3·P4) y las divisiones todavía junto
// al CE (sin desplegar: la Mesa las lleva a las marcas; las agrupaciones y las fichas desplegadas, en todas-fichas.cjs):
//   · un ejercicio con las fases ya armadas «quietas» muestra el aviso;
//   · «🎬 Armar las fases» del CAP 1: FASE I junto al CE, FASE III cada una en su marca, FASE V la reserva al final del
//     EJE CA-1; y el CAP 2 (defensa móvil): el retardo sobre la LDE-1 en la FASE III; sin errores de consola.
//   node calcos/pruebas/e2e/posiciones-fase.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioConcepto } = require('../concepto-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-posiciones-fase')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const posU = (page, id) => estadoReact(page, new Function('v', `return Array.isArray(v) && v.some((u) => u && u.id === 'divmec2' && u.bando) ? (() => { const u = v.find((x) => x.id === '${id}'); return [u.lng, u.lat] })() : undefined`))
const km = (a, b) => Math.hypot((a[0] - b[0]) * 105.6, (a[1] - b[1]) * 110.6)
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
  const ej = ejercicioConcepto({ nombre: 'PRUEBA POSICIONES POR FASE CE-I (FICT.)' })
  ej.ops.unidadConsiderada = { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true }
  ej.ops.limites = [
    { nombre: 'LPR (LF «PUMA»)', coords: [[-68.86, -18.3], [-68.84, -18.9]], co: { id: 'x1', rol: 'lpr' } },
    { nombre: 'LDE-1', coords: [[-69.08, -18.3], [-69.08, -18.9]], tipo: 'punteada', co: { id: 'x2', rol: 'linea' } },
    { nombre: 'EJE CA-1', coords: [[-68.55, -18.62], [-68.86, -18.48]], tipo: 'flecha', co: { id: 'x3', rol: 'eje-ca' } },
  ]
  ej.g3 = { ...ej.g3, conceptoCarta: { marcas: [
    { tipo: 'esfuerzo', clase: 'principal', texto: 'ESFUERZO PRINCIPAL · DIV MEC-2', centro: [-68.8, -18.47], co: { id: 'm1' } },
    { tipo: 'esfuerzo', clase: 'secundario', texto: 'ESFUERZO SECUNDARIO · DIV-1', centro: [-68.8, -18.78], co: { id: 'm2' } },
    { tipo: 'reserva', texto: 'RES · DIV-6', centro: [-68.55, -18.62], co: { id: 'm3' } },
  ] } }
  // Las divisiones todavía junto al CE (no las desplegaron).
  const junto = { divmec2: [-68.42, -18.53], div1: [-68.43, -18.57], div6: [-68.37, -18.56] }
  ej.unidades = ej.unidades.map((u) => (junto[u.id] ? { ...u, lng: junto[u.id][0], lat: junto[u.id][1] } : u))
  // Las fases que se armaron antes: las cinco con el mismo dispositivo.
  ej.fasesCOA = { enemigo: [], propio: ['Concentración', 'Desplazamiento', 'Ocupación', 'Conducción', 'Contraataque'].map((nombre) => ({ nombre, unidades: ej.unidades, ops: {}, desplazamientos: [] })) }
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
    await panel.locator('[data-quietas="1"]').waitFor({ timeout: 5000 })
    assert.match(await panel.locator('[data-quietas="1"]').innerText(), /las fichas están en el MISMO lugar/)

    // ── Armar las fases del CAP 1 ──
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 1/ }))
    await esperar(page, async () => (await panel.locator('[data-quietas]').count()) === 0 || null, (x) => x)
    assert.equal(await panel.locator('[data-quietas]').count(), 0, 'el aviso se fue')
    const fase = async (n, i) => {
      await clic(panel.locator(`[data-fases-cap="${n}"] button[data-fase="${i}"]`))
      await page.waitForTimeout(400)
    }
    await fase(1, 1)
    const f1 = await esperar(page, (p) => posU(p, 'divmec2'), (q) => km(q, [-68.4, -18.55]) <= 6.1)
    assert.ok(km(f1, [-68.4, -18.55]) <= 6.1, 'FASE I: junto al CE')
    assert.ok(km(await posU(page, 'div6'), [-68.4, -18.55]) <= 6.1)
    await page.evaluate(() => void window.__mapa2d.fitBounds([[-18.95, -69.4], [-18.25, -68.25]]))
    await page.waitForTimeout(600)
    await foto('1-cap1-faseI')
    await fase(1, 3)
    assert.deepEqual(await esperar(page, (p) => posU(p, 'divmec2'), (q) => q[0] === -68.8), [-68.8, -18.47], 'FASE III: en su marca')
    assert.deepEqual(await posU(page, 'div1'), [-68.8, -18.78])
    assert.deepEqual(await posU(page, 'div6'), [-68.55, -18.62])
    await page.waitForTimeout(400)
    await foto('2-cap1-faseIII')
    await fase(1, 5)
    assert.deepEqual(await esperar(page, (p) => posU(p, 'div6'), (q) => q[0] === -68.86), [-68.86, -18.48], 'FASE V: la reserva al final del EJE CA-1')
    await page.waitForTimeout(400)
    await foto('3-cap1-faseV')

    // ── CAP 2: se arman sus fases y el retardo va a la LDE-1 en la FASE III ──
    await clic(panel.locator('button[data-cap="2"]'))
    await panel.getByText('● CAP 2 · Defensa móvil').waitFor({ timeout: 5000 })
    await clic(panel.getByRole('button', { name: /Armar las 5 fases 🔵 del CAP 2/ }))
    await panel.locator('[data-fases-cap="2"] button[data-fase="3"]').waitFor({ timeout: 5000 })
    await fase(2, 3)
    const r3 = await esperar(page, (p) => posU(p, 'divmec2'), (q) => Math.abs(q[0] - -69.08) < 0.01)
    assert.ok(Math.abs(r3[0] - -69.08) < 0.01, `CAP 2 · FASE III: el retardo sobre la LDE-1 (${r3})`)
    await page.waitForTimeout(400)
    await foto('4-cap2-faseIII')

    const malos = errores.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU stall|tiles/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log('✔ e2e posiciones por fase: el aviso de las fases quietas, FASE I junto al CE, FASE III en sus marcas, FASE V el contraataque, el retardo del CAP 2')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
