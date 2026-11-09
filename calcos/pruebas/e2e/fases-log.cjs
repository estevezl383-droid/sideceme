// 🚚 El ARCE en TODAS las fases y los ejes que se heredan (index-fases-log-20261108.js + logistica/v1/fases-log.mjs),
// en la Mesa real (Chromium), con el ejercicio FICTICIO de logística armado como el de Sergio: cinco fases 🔵 «de antes»;
// el ARCE y las áreas A y B propuestas, con una instalación del Batallón Logístico y su sector, SÓLO en la FASE 1; la
// Línea de Extraviados sólo en la FASE 2; a la vista la FASE 2 (sin el ARCE: lo que mostró la segunda captura).
//   · tocar la FASE 4: el ARCE, las áreas, el sector y la instalación están; en la FASE 2 y la FASE 5 también;
//   · la Línea de Extraviados de la FASE 2 está en la 3, 4 y 5 y no en la 1;
//   · G-4 → ↔ Ejes → «➡️ Trazar el EPA» en la FASE 3: el EPA está en la 3, 4 y 5 y no en la 1 ni en la 2;
//   · un EPE trazado en la FASE 5 queda sólo en la 5; la 4 sigue con lo de la 3;
//   · el ejercicio guardado: las cinco fases con el ARCE; sin errores de consola. También con DPR=2.
//   node calcos/pruebas/e2e/fases-log.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact, aPantalla } = require('./navegador.js')
const { ejercicioLogistica, AREA_A } = require('../logistica-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-fases-log')
fs.mkdirSync(out, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const opsDe = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.zonasLog) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify(v)) : undefined))
const fichasDe = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.length && v.every((u) => u && typeof u === 'object' && 'bando' in u && 'lat' in u) ? JSON.parse(JSON.stringify(v)) : undefined))
const fasesDe = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.propio) && Array.isArray(v.enemigo) ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(f, cumple, ms = 8000) {
  const t0 = Date.now()
  for (;;) {
    const v = await f()
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await new Promise((r) => setTimeout(r, 200))
  }
}
const resumen = (o) => ({ zonas: (o.zonasLog || []).map((z) => z.clave).sort().join(','), ejes: (o.ejesLog || []).map((e) => e.tipo).sort().join('+'), lineas: (o.lineasEM || []).map((l) => l.tipo).join('+'), sectores: (o.sectoresLog || []).length })

const DPR = Number(process.env.DPR || 1)

;(async () => {
  const a = await abrir({ ancho: 1600, alto: 1000, escalaPantalla: DPR })
  const { page, errores } = a
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(out, `${n}${DPR !== 1 ? `-dpr${DPR}` : ''}.png`) })
  try {
    // ── El ejercicio, como el de Sergio ──
    const base = ejercicioLogistica({ conPropuestas: true })
    base.nombre = 'PRUEBA ARCE EN TODAS LAS FASES (FICT.)'
    const instal = { id: 'bl-san', bando: 'propias', tipo: 'instalacion', instalacion: 'p_clas_evac', escalon: 'seccion', arma: 'logistica', designacion: '', origen: 'plantilla-asdi', sectorLog: 'san', areaLog: 'asdi-a', lng: AREA_A[0][0] + 0.01, lat: AREA_A[0][1] - 0.01 }
    const sector = { coords: [AREA_A[0], [AREA_A[0][0] + 0.02, AREA_A[0][1]], [AREA_A[0][0] + 0.02, AREA_A[0][1] - 0.02]], nombre: 'Sanidad', comp: '', color: '#d33', sector: 'san', areaLog: 'asdi-a' }
    const extrav = { tipo: 'extraviados', coords: [[-68.55, -16.98], [-68.05, -16.98]] }
    const opsSin = { ...base.ops, zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [], ains: undefined }
    delete opsSin.ains
    const fase = (i) => ({
      nombre: `FASE ${i + 1} (FICT.)`,
      unidades: i === 0 ? [...base.unidades, instal] : base.unidades.map((u) => (u.bando === 'propias' ? { ...u, lat: u.lat - i * 0.01 } : u)),
      ops: i === 0 ? { ...opsSin, zonasLog: base.ops.zonasLog, sectoresLog: [sector] } : i === 1 ? { ...opsSin, lineasEM: [extrav] } : { ...opsSin },
      desplazamientos: [],
    })
    const propio = [0, 1, 2, 3, 4].map(fase)
    const ej = { ...base, fasesCOA: { propio, enemigo: [] }, faseActiva: { bando: 'propio', idx: 1 }, unidades: propio[1].unidades, ops: { ...propio[1].ops, ains: [] } }
    await sembrarYAbrir(page, ej)
    const ocultar = page.getByText('▼ ocultar')
    if (await ocultar.count()) await ocultar.first().click().catch(() => {})
    let o = await esperar(() => opsDe(page), (v) => (v.lineasEM || []).length === 1)
    assert.deepEqual(resumen(o), { zonas: '', ejes: '', lineas: 'extraviados', sectores: 0 }, 'a la vista la FASE 2 de antes (sin el ARCE)')

    // ── 🎬 C.A. por fases: la FASE 4 ──
    await clic(page.getByRole('button', { name: /C\.A\. POR FASES/i }).first())
    const tocar = async (n) => {
      // El tablero del G-4 cierra el del 🎬 C.A. por fases: se lo vuelve a abrir.
      if (!(await page.getByRole('button', { name: `FASE ${n}`, exact: true }).count())) {
        await clic(page.getByRole('button', { name: /C\.A\. POR FASES/i }).first())
        await page.waitForTimeout(500)
      }
      await clic(page.getByRole('button', { name: `FASE ${n}`, exact: true }).last())
      await page.waitForTimeout(700)
    }
    await tocar(4)
    o = await esperar(() => opsDe(page), (v) => (v.zonasLog || []).length === 3)
    assert.deepEqual(resumen(o), { zonas: 'arce-fict,asdi-a,asdi-b', ejes: '', lineas: 'extraviados', sectores: 1 }, 'la FASE 4: el ARCE, las áreas A y B, el sector y la Línea de Extraviados heredada')
    let us = await fichasDe(page)
    assert.ok(us.some((u) => u.id === 'bl-san'), 'la instalación del Batallón Logístico en la FASE 4')
    await page.evaluate(() => void window.__mapa2d.fitBounds([[-17.45, -68.65], [-16.75, -67.95]], { animate: false }))
    await page.waitForTimeout(800)
    await foto('1-fase4-arce')
    for (const [n, lin] of [[2, 'extraviados'], [5, 'extraviados'], [1, '']]) {
      await tocar(n)
      o = await esperar(() => opsDe(page), (v) => (v.zonasLog || []).length === 3 && (v.lineasEM || []).map((l) => l.tipo).join('+') === lin)
      assert.deepEqual(resumen(o), { zonas: 'arce-fict,asdi-a,asdi-b', ejes: '', lineas: lin, sectores: 1 }, `la FASE ${n}`)
      us = await fichasDe(page)
      assert.ok(us.some((u) => u.id === 'bl-san'), `la instalación en la FASE ${n}`)
    }

    // ── El EPA en la FASE 3, con el botón del G-4 ──
    await tocar(3)
    await clic(page.getByRole('button', { name: /G-4 Logística/ }).first())
    await clic(page.getByRole('button', { name: '↔ Ejes', exact: true }).first())
    await clic(page.getByRole('button', { name: /Trazar el EPA/ }).first())
    await page.evaluate(() => (window.__lm2d = window.__mapa2d))
    for (const [x, y] of await aPantalla(page, [[-68.3, -17.3], [-68.32, -17.1], [-68.33, -16.9]])) {
      await page.mouse.click(x, y)
      await page.waitForTimeout(300)
    }
    await clic(page.getByRole('button', { name: '✓ TERMINAR TRAZO' }).first())
    o = await esperar(() => opsDe(page), (v) => (v.ejesLog || []).length === 1)
    assert.deepEqual(resumen(o).ejes, 'epa', 'el EPA trazado en la FASE 3')
    await foto('2-fase3-epa')
    for (const [n, ejes] of [[4, 'epa'], [5, 'epa'], [1, ''], [2, '']]) {
      await tocar(n)
      o = await esperar(() => opsDe(page), (v) => resumen(v).ejes === ejes && (v.zonasLog || []).length === 3)
      assert.equal(resumen(o).ejes, ejes, `los ejes en la FASE ${n}`)
    }

    // ── Un EPE en la FASE 5: queda en la 5; la 4 sigue con lo de la 3 ──
    await tocar(5)
    await clic(page.getByRole('button', { name: /G-4 Logística/ }).first())
    await clic(page.getByRole('button', { name: '↔ Ejes', exact: true }).first())
    await clic(page.getByRole('button', { name: /Trazar el EPE/ }).first())
    for (const [x, y] of await aPantalla(page, [[-68.36, -16.9], [-68.36, -17.28]])) {
      await page.mouse.click(x, y)
      await page.waitForTimeout(300)
    }
    await clic(page.getByRole('button', { name: '✓ TERMINAR TRAZO' }).first())
    o = await esperar(() => opsDe(page), (v) => (v.ejesLog || []).length === 2)
    assert.equal(resumen(o).ejes, 'epa+epe', 'la FASE 5 con su EPE')
    await foto('3-fase5-epa-epe')
    await tocar(4)
    o = await esperar(() => opsDe(page), (v) => resumen(v).ejes === 'epa')
    assert.equal(resumen(o).ejes, 'epa', 'la FASE 4 sigue con lo de la 3')
    await tocar(5)
    o = await esperar(() => opsDe(page), (v) => resumen(v).ejes === 'epa+epe')
    assert.equal(resumen(o).ejes, 'epa+epe', 'la FASE 5 conserva lo suyo')
    await foto('4-fase5-vuelta')

    // ── Las fases guardadas ──
    const fc = await fasesDe(page)
    assert.deepEqual(fc.propio.map((f) => resumen(f.ops).zonas), Array(5).fill('arce-fict,asdi-a,asdi-b'), 'el ARCE guardado en las cinco fases')
    assert.deepEqual(fc.propio.map((f) => f.unidades.some((u) => u.id === 'bl-san')), [true, true, true, true, true])
    assert.deepEqual(fc.propio.slice(0, 4).map((f) => resumen(f.ops).ejes), ['', '', 'epa', 'epa'])
    assert.deepEqual(fc.propio.map((f) => resumen(f.ops).lineas), ['', 'extraviados', 'extraviados', 'extraviados', 'extraviados'])
    assert.ok(fc.propio.every((f) => f.logV === 1), 'las cinco fases puestas al día')

    const malos = errores.filter((e) => !/favicon|tile|ERR_|Failed to load resource|net::/i.test(e))
    assert.deepEqual(malos, [], 'sin errores de consola')
    console.log(`✔ e2e/fases-log.cjs (DPR ${DPR}): el ARCE en las 5 fases, la Línea de Extraviados desde la 2, el EPA desde la 3, el EPE sólo en la 5. Capturas en ${out}`)
  } catch (e) {
    await foto('error').catch(() => {})
    console.error(e)
    process.exitCode = 1
  } finally {
    await a.cerrar()
  }
})()
