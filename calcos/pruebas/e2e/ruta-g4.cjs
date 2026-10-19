// 🚚 LA RUTA DEL G-4 (🎓 Aprendizaje · «Como G-4») en la Mesa real (Chromium), escritorio y teléfono,
// con el ejercicio FICTICIO de logística (División en la defensa, dos áreas propuestas, EPA y EPE):
//   · «¿Qué practicás?» → 🚚 Como G-4: 22 pasos, 5 ya hechos en el ejercicio, la luz en el paso 1;
//   · el «Ir» del paso 1 ilumina el botón del ejercicio (los documentos del escalón superior);
//   · marcado a mano 1-3, el que sigue es 🧮 Cálculos: «Ir» abre el panel del G-4 en esa pestaña y
//     se ilumina «Descargar el cálculo»; al apretarlo el paso queda hecho y la luz pasa a 📋 Mis hojas
//     y, adentro, a la hoja F2·P5 Limitaciones;
//   · después de recargar, la ruta y lo marcado siguen;
//   · 🤖 EM simulado de la fase 2: el pedido lleva sus marcas; lo pegado entra a los documentos del
//     ejercicio (lo de una fase a la que el alumno no llegó queda afuera) y el insumo pasa a 🤖;
//   · sin errores de consola. Sin servicios externos.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioLogistica } = require('../logistica-ejemplo.js')

const out = path.resolve(__dirname, '../salidas-ruta-g4')
fs.mkdirSync(out, { recursive: true })
const PANEL = '#sid-mod-panel'
const actual = (page) => page.evaluate(() => { const e = window.SIDModalidad.rutaEstado(); return e && e.actual ? e.actual.p.id : null })
const luces = (page) => page.evaluate(() => window.SIDModalidad.luces.map((b) => b.textContent.replace(/\s+/g, ' ').trim()))
const desplegar = (page) => page.evaluate(() => { const p = document.querySelector('#sid-mod-panel'); if (p.classList.contains('plegado')) p.querySelector('.asa').click() })
async function hasta(page, f, ms = 6000) {
  const t0 = Date.now()
  for (;;) {
    const v = await f()
    if (v || Date.now() - t0 > ms) return v
    await page.waitForTimeout(200)
  }
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1600, alto: movil ? 844 : 1000, movil })
    const { page, errores } = a
    page.on('dialog', (d) => d.accept())
    const tag = movil ? 'movil' : 'escritorio'
    try {
      await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
      const ej = ejercicioLogistica({ conPropuestas: true })
      await sembrarYAbrir(page, ej)
      await page.locator('#sid-mod-sel button[data-m=aprendizaje]').dispatchEvent('click')
      await page.waitForTimeout(400)
      assert.equal(await page.locator(`${PANEL} .rg-sel button`).count(), 2, '«¿Qué practicás?» con PMTD completo y Como G-4')
      assert.equal(await page.locator(`${PANEL} .rg-sel [data-ruta=pmtd]`).getAttribute('aria-pressed'), 'true', 'empieza en el PMTD completo')
      await page.locator(`${PANEL} [data-a=ruta-elegir][data-ruta=g4]`).dispatchEvent('click')
      await page.waitForTimeout(1200)
      assert.equal(await page.evaluate(() => window.SIDModalidad.ruta), 'g4')
      assert.match(await page.locator(`${PANEL} .total`).innerText(), /5 \/ 22 pasos/)
      assert.match(await page.locator(`${PANEL} .rg-ahora`).innerText(), /FASE 1 · PASO 1[\s\S]*Leer la Orden/)
      assert.equal(await page.locator(`${PANEL} .fase`).count(), 7)
      assert.equal(await page.locator(`${PANEL} .rg-paso.ahora`).count(), 1, 'un solo paso iluminado')
      assert.match(await page.locator(`${PANEL} .rg-recibe`).first().innerText(), /La Orden del escalón superior[\s\S]*✓[\s\S]*El Anexo de Logística \(ASC\) del escalón superior[\s\S]*○ falta/)
      await page.screenshot({ path: path.join(out, `ruta-${tag}.png`) })

      // paso 1: el botón del ejercicio (los documentos del escalón superior) se ilumina
      await page.locator(`${PANEL} .rg-ahora [data-a=ruta-ir]`).dispatchEvent('click')
      const l1 = await hasta(page, async () => (await luces(page)).find((t) => /PRUEBA LOGÍSTICA B/.test(t)))
      assert.ok(l1, 'se ilumina el botón del ejercicio: ' + JSON.stringify(await luces(page)))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)

      // marcar a mano 1, 2 y 3
      for (const id of ['leer-orden', 'aprec-activa', 'asdi-entender']) {
        await desplegar(page)
        await page.waitForTimeout(250)
        if (!(await page.locator(`${PANEL} [data-a=ruta-listo][data-paso="${id}"]`).count())) await page.locator(`${PANEL} [data-a=ruta-ver][data-paso="${id}"]`).dispatchEvent('click')
        await page.locator(`${PANEL} [data-a=ruta-listo][data-paso="${id}"]`).dispatchEvent('click')
        await page.waitForTimeout(300)
      }
      assert.equal(await actual(page), 'calculos', 'la luz pasa a los cálculos')
      assert.match(await page.locator(`${PANEL} .total`).innerText(), /8 \/ 22 pasos/)

      // 🧮 Cálculos: se abre el panel del G-4 en esa pestaña y se ilumina «Descargar el cálculo»
      await page.locator(`${PANEL} .rg-ahora [data-a=ruta-ir]`).dispatchEvent('click')
      const l2 = await hasta(page, async () => (await luces(page)).find((t) => /Descargar el cálculo/.test(t)))
      assert.ok(l2, 'se ilumina «Descargar el cálculo»: ' + JSON.stringify(await luces(page)))
      assert.ok(await page.locator('button.sid-luz', { hasText: 'Descargar el cálculo' }).count(), 'con la clase de la luz')
      await page.screenshot({ path: path.join(out, `calculos-${tag}.png`) })
      await page.locator('button', { hasText: 'Descargar el cálculo' }).first().dispatchEvent('click')
      assert.equal(await hasta(page, async () => (await actual(page)) === 'limitaciones' && 'ok'), 'ok', 'bajar el cálculo lo da por hecho')
      const l3 = await hasta(page, async () => (await luces(page)).find((t) => /Mis hojas/.test(t)))
      assert.ok(l3, 'la luz pasa a la pestaña 📋 Mis hojas: ' + JSON.stringify(await luces(page)))
      await page.locator('button', { hasText: /^\W*Mis hojas$/ }).first().dispatchEvent('click')
      const l4 = await hasta(page, async () => (await luces(page)).find((t) => /^F2·P5\s*Limitaciones/.test(t)))
      assert.ok(l4, 'y adentro, a la hoja F2·P5: ' + JSON.stringify(await luces(page)))
      await page.screenshot({ path: path.join(out, `hoja-f2p5-${tag}.png`) })

      // recargar: la ruta y lo marcado siguen
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('#sid-mod-sel', { timeout: 15000 })
      await page.waitForTimeout(1500)
      if ((await actual(page)) == null) await sembrarYAbrir(page, ej) // el ejercicio se vuelve a abrir
      assert.equal(await page.evaluate(() => window.SIDModalidad.ruta), 'g4', 'la ruta se recuerda')
      assert.equal(await hasta(page, async () => (await actual(page)) === 'limitaciones' && 'ok'), 'ok', 'lo marcado queda')

      // 🤖 EM simulado de la fase 2
      await desplegar(page)
      await page.waitForTimeout(500)
      const emBtn = page.locator(`${PANEL} [data-a=em-abrir][data-rf="2"]`)
      assert.ok(await emBtn.count(), 'el botón del EM simulado en la fase 2')
      await emBtn.dispatchEvent('click')
      await page.waitForTimeout(600)
      const ped = await page.locator(`${PANEL} textarea[data-em]`).inputValue()
      assert.match(ped, /ESTADO MAYOR SIMULADO/)
      assert.ok(ped.includes('=== ENTREGA: anexoLogSup ===') && ped.includes('=== ENTREGA: normasEval ==='), 'con las marcas de lo que falta hasta la fase 2')
      assert.ok(!ped.includes('=== ENTREGA: caps ==='), 'nada de la fase 3')
      assert.match(ped, /DIV\.MEC\.-1 \(FICT\.\)/, 'con el ejercicio')
      const resp = '=== ENTREGA: anexoLogSup ===\nANEXO B (LOGÍSTICA) A LA ORDEN N° 3 DEL I CE (FICT.)\nEl ARCE del CE en PUEBLO-Z (FICT.).\n\n=== ENTREGA: picb ===\nCMOC: corredor C-1 (FICT.).\n\n=== ENTREGA: caps ===\nCAP 1 y CAP 2 (FICT.): es de la fase 3, no entra.\n'
      await page.locator(`${PANEL} textarea[data-em-resp]`).fill(resp)
      await page.locator(`${PANEL} [data-a=em-recibir]`).dispatchEvent('click')
      await page.waitForTimeout(1500)
      const docs = await page.evaluate(() => (window.SIDMesaEjercicio.foto().documentos || []).filter((d) => d.emSimulado).map((d) => d.emSimulado.insumo))
      assert.deepEqual(docs.sort(), ['anexoLogSup', 'picb'], 'entran las dos de las fases 1 y 2; la del CAP queda afuera')
      assert.match(await page.locator(`${PANEL} .cuerpo`).innerText(), /2 entrega\(s\) del EM simulado[\s\S]*una entrega es de una fase a la que todavía no llegaste/i)
      // 📣 las novedades: qué sección terminó qué, y en qué paso se usa
      const nov = await page.locator(`${PANEL} .rg-nov`).innerText()
      assert.match(nov, /El G-2 terminó: La PICB del G-2[\s\S]*lo usás en el paso/, 'la novedad dice que el G-2 terminó y dónde se usa: ' + nov)
      assert.match(nov, /El escalón superior te entregó: El Anexo de Logística/)
      assert.match(nov, /💡 Ahora seguís con el paso 6 · Limitaciones de logística/)
      // 📣 el parte del EM: el G-2 ya terminó la PICB (🤖) y todavía debe los CAE
      const parte = await page.locator(`${PANEL} .rg-parte`).innerText()
      assert.match(parte, /Parte del Estado Mayor[\s\S]*estás en la fase 2/i)
      assert.match(parte, /G-2\s*✅ Terminó: la PICB \(terreno juzgado\) 🤖\s*⏳ Te debe: los CAE \(paso 8\)/, 'el G-2: ' + parte)
      assert.match(parte, /G-1\s*🔒 Más adelante: las bajas por fase \(fase 4\)/)
      await page.locator(`${PANEL} [data-a=nov-cerrar]`).dispatchEvent('click')
      await page.waitForTimeout(300)
      assert.equal(await page.locator(`${PANEL} .rg-nov`).count(), 0, '✓ Entendido cierra las novedades')
      const est = await page.evaluate(() => window.SIDModalidad.rutaEstado().porFase[1].insumos.find((i) => i.ins.id === 'picb').e.de)
      assert.equal(est, 'em', 'la PICB figura como entregada por el EM simulado')
      await page.waitForTimeout(800)
      assert.ok(await page.locator(`${PANEL} .rg-ins.em`).count(), 'y el tablero lo muestra')
      await page.locator(`${PANEL} [data-a=em-ver][data-ins=picb]`).first().dispatchEvent('click')
      await page.waitForTimeout(300)
      assert.match(await page.locator(`${PANEL} .rg-texto`).innerText(), /ENTREGA DEL G-2[\s\S]*corredor C-1/, '👁 Leer muestra lo entregado')
      await page.screenshot({ path: path.join(out, `em-simulado-${tag}.png`) })

      // fase 3: en la F3·P1 los CAP todavía no hacen falta (no te adelantes); el EM simulado los entrega
      // y el G-3 DESPLIEGA las unidades del CAP 1 en la carta: la que ya estaba se mueve, la nueva aparece
      for (const id of ['limitaciones', 'rcic', 'aprec-orientacion']) {
        await desplegar(page)
        await page.waitForTimeout(250)
        if (!(await page.locator(`${PANEL} [data-a=ruta-listo][data-paso="${id}"]`).count())) await page.locator(`${PANEL} [data-a=ruta-ver][data-paso="${id}"]`).dispatchEvent('click')
        await page.locator(`${PANEL} [data-a=ruta-listo][data-paso="${id}"]`).dispatchEvent('click')
        await page.waitForTimeout(300)
      }
      assert.equal(await hasta(page, async () => (await actual(page)) === 'potencia' && 'ok'), 'ok', 'la luz en la F3·P1 potencia relativa')
      await desplegar(page)
      await page.waitForTimeout(500)
      const ahora = await page.locator(`${PANEL} .rg-ahora`).innerText()
      assert.match(ahora, /FASE 3 · PASO 10 · F3·P1/)
      assert.match(ahora, /Entrás con:[\s\S]*G-2 · los CAE/, 'con qué entra: ' + ahora)
      assert.match(ahora, /Todavía no te hace falta:[\s\S]*G-3 · los CAP 1 y 2 \(paso 11\)[\s\S]*no te adelantes/, 'no te adelantes: ' + ahora)
      const antes = await page.evaluate(() => window.SIDMesaEjercicio.foto().unidades)
      await page.locator(`${PANEL} .rg-parte [data-a=em-ir]`).dispatchEvent('click')
      await page.waitForTimeout(700)
      const ped3 = await page.locator(`${PANEL} textarea[data-em]`).inputValue()
      assert.ok(ped3.includes('=== ENTREGA: caps ===') && ped3.includes('=== ENTREGA: orgTarea ===') && ped3.includes('=== ENTREGA: cae ==='), 'la fase 3 pide los CAP, la organización de la tarea y los CAE que faltan')
      assert.match(ped3, /## Las unidades en la carta \(lo hace el G-3\)[\s\S]*Al final de la entrega `orgTarea`/)
      assert.match(await page.locator(`${PANEL} #sid-rg-em`).innerText(), /① Copiá el pedido[\s\S]*② Pegalo[\s\S]*③ Pegá la respuesta abajo[\s\S]*las unidades que despliega el G-3 aparecen en la carta/)
      const resp3 = '=== ENTREGA: cae ===\nCAE más probable (FICT.).\n\n=== ENTREGA: caps ===\nCAP 1: defensa en posición (FICT.). CAP 2: defensa móvil (FICT.).\n\n=== ENTREGA: orgTarea ===\nAgrupación ALFA (FICT.).\n```json\n{"fichas":[{"designacion":"RI-1 «ALFA» (FICT.)","bando":"propias","arma":"infanteria","escalon":"regimiento","lat":-16.8,"lng":-68.45,"cap":1},{"designacion":"BAT. ING. 9 (FICT.)","bando":"propias","arma":"ingenieria","escalon":"batallon","lat":-16.9,"lng":-68.35,"cap":1},{"designacion":"RCB-2 «BRAVO» (FICT.)","lat":-16.6,"lng":-68.1,"cap":2}]}\n```\n'
      await page.locator(`${PANEL} textarea[data-em-resp]`).fill(resp3)
      await page.locator(`${PANEL} [data-a=em-recibir]`).dispatchEvent('click')
      const nov3 = await hasta(page, async () => { const t = await page.locator(`${PANEL} .rg-nov`).innerText().catch(() => ''); return /🪖/.test(t) && t })
      assert.ok(nov3, 'la novedad del despliegue')
      assert.match(nov3, /El G-3 terminó: Los cursos de acción propios \(CAP 1 y CAP 2\) → lo usás en el paso 11/)
      assert.match(nov3, /🪖 El G-3 desplegó el CAP 1 en la carta: movió RI-1 «ALFA» \(FICT\.\); puso BAT\. ING\. 9 \(FICT\.\)/)
      const despues = await hasta(page, async () => { const u = await page.evaluate(() => window.SIDMesaEjercicio.foto().unidades); return u.length === antes.length + 1 && u })
      assert.ok(despues, 'una ficha nueva (la del CAP 2 no entra)')
      const alfa = despues.find((u) => u.id === 'l-alfa')
      assert.deepEqual([alfa.lat, alfa.lng], [-16.8, -68.45], 'la que ya estaba se MOVIÓ, no se duplicó')
      assert.equal(despues.filter((u) => /ALFA/.test(u.designacion)).length, 1)
      assert.ok(despues.some((u) => u.designacion === 'BAT. ING. 9 (FICT.)' && u.arma === 'ingenieria'))
      assert.ok(despues.find((u) => u.id === 'l-bravo').lat === -16.86, 'lo del CAP 2 no mueve nada')
      const doc3 = await page.evaluate(() => (window.SIDMesaEjercicio.foto().documentos || []).find((d) => d.emSimulado && d.emSimulado.insumo === 'orgTarea').texto)
      assert.ok(!/```/.test(doc3) && /UNIDADES DESPLEGADAS EN LA CARTA POR EL G-3[\s\S]*BAT\. ING\. 9/.test(doc3), 'el documento lleva las unidades en texto, sin el JSON')
      await page.screenshot({ path: path.join(out, `em-despliegue-${tag}.png`) })
      // ↶ Deshacer de la barra: un solo toque vuelve todo (la ficha nueva se va, ALFA vuelve a su lugar)
      await page.locator('.botones-mapa > button.btn-deshacer').first().dispatchEvent('click')
      const vuelta = await hasta(page, async () => { const u = await page.evaluate(() => window.SIDMesaEjercicio.foto().unidades); return u.length === antes.length && u })
      assert.ok(vuelta, '↶ Deshacer saca la ficha nueva')
      assert.deepEqual([vuelta.find((u) => u.id === 'l-alfa').lat, vuelta.find((u) => u.id === 'l-alfa').lng], [-16.85, -68.4], 'y ALFA vuelve a su lugar')
      await page.keyboard.press('Escape')
      await desplegar(page)
      await page.waitForTimeout(400)

      // una fase a la que el alumno no llegó: 🔒, sin pedido al EM simulado
      await page.locator(`${PANEL} .fcab[data-a=ruta-fase][data-rf="6"]`).dispatchEvent('click')
      await page.waitForTimeout(300)
      assert.match(await page.locator(`${PANEL} .fase[data-rf="6"] .rg-bloq`).innerText(), /cuando llegues a esta fase/)
      assert.equal(await page.locator(`${PANEL} [data-a=em-abrir][data-rf="6"]`).count(), 0, 'sin pedido para la fase 6')

      assert.deepEqual(errores, [], 'sin errores de consola')
      console.log(`ruta-g4 e2e ${tag} OK`)
    } finally {
      await a.cerrar()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
