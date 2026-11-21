// 19-11-2026 · en la Mesa real (Chromium): «🪖 Mi unidad y su contexto» y «💾 Guardar · actualizar».
//   · al abrir un ejercicio con fichas y sin configurar aparece la ventana, con el CE-II del tema base ya elegido
//     (lo dice la Orden), su superior y sus 14 dependientes; ⚡ las pone alrededor del CE-II (que queda PC) y se
//     guardan identidad, Orden superior (unidad, escalonSuperior, unidadesAdyacentes), ops.configUnidad y puesto;
//   · la F2·P3 se llama «… · Mi unidad y sus dependientes» y muestra el resumen (14 en la carta); «✏️ Cambiar» →
//     División → DIV-5 → ⚡ pone la DIV-5 (que no estaba) y sus 15 dependientes;
//   · 💾 Guardar como (selector de mentira) y después «💾 Guardar» actualiza el MISMO archivo;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/mi-unidad.cjs   (DPR=2 para pantalla retina)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir, sembrarYAbrir, estadoReact } = require('./navegador.js')
const { ejercicioPersonal } = require('../personal-ejemplo.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-mi-unidad')
fs.mkdirSync(SALIDAS, { recursive: true })
const clic = (loc) => loc.dispatchEvent('click')
const leerUnidades = (page) => estadoReact(page, (v) => (Array.isArray(v) && v.some((u) => u && u.id === 'p-ce2' && 'lat' in u) ? JSON.parse(JSON.stringify(v)) : undefined))
const leerConfig = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && Array.isArray(v.obstaculos) && Array.isArray(v.limites) ? JSON.parse(JSON.stringify(v.configUnidad || null)) : undefined))
const leerOrden = (page) => estadoReact(page, (v) => (v && !Array.isArray(v) && typeof v === 'object' && 'escalonSuperior' in v && 'clasificacion' in v && 'organizacionTarea' in v ? JSON.parse(JSON.stringify(v)) : undefined))
async function esperar(leer, cumple, ms = 15000) {
  const t0 = Date.now()
  for (;;) {
    const v = await leer()
    if (v && cumple(v)) return v
    if (Date.now() - t0 > ms) return v
    await new Promise((r) => setTimeout(r, 250))
  }
}

;(async () => {
  const { page, errores, cerrar } = await abrir({
    ancho: 1500,
    alto: 950,
    escalaPantalla: Number(process.env.DPR || 1),
    ventanaMiUnidad: true,
    preparar: async (p) => {
      // Un archivo de mentira para «Guardar como» / «💾 Guardar» (en Chrome real es el selector de archivos).
      await p.addInitScript(() => {
        window.__escrituras = []
        const h = {
          name: 'ejercicio-prueba.json',
          kind: 'file',
          queryPermission: async () => 'granted',
          requestPermission: async () => 'granted',
          createWritable: async () => {
            let t = ''
            return { write: async (x) => { t += x }, close: async () => { window.__escrituras.push(t) } }
          },
        }
        window.showSaveFilePicker = async () => h
      })
    },
  })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, `${n}.png`) })
  const datos = ejercicioPersonal({ nombre: 'PRUEBA MI UNIDAD (FICT.)' })
  datos.unidades.push({ id: 'p-ce2', tipo: 'unidad', bando: 'propias', designacion: 'CE-II', arma: 'infanteria', escalon: 'cuerpo', lat: -17.05, lng: -68.3, futura: false, agrupacion: false, instalacion: '' })
  datos.ordenSup = { ...datos.ordenSup, unidad: 'CE - II', escalonSuperior: '' }
  if (datos.ops) delete datos.ops.configUnidad
  try {
    await sembrarYAbrir(page, datos)

    // ── 1. La ventana al abrir ──
    const ventana = page.locator('[data-sid="mi-unidad-aviso"]')
    await ventana.waitFor({ timeout: 15000 })
    await foto('1-ventana-al-abrir')
    assert.equal(await ventana.locator('[data-sid="mu-unidad"]').inputValue(), 'CE - II')
    assert.equal(await ventana.locator('[data-sid="mu-superior"]').inputValue(), 'FF.TT.T.O.')
    assert.equal(await ventana.locator('[data-sid="mu-falta"]').count(), 14, '14 dependientes por colocar')
    assert.match(await ventana.innerText(), /CE-II ya está en la carta/)
    await clic(ventana.locator('[data-puesto="g3"]'))
    await clic(ventana.getByRole('button', { name: '+ CE-I', exact: true }))
    await clic(ventana.locator('[data-sid="mu-colocar"]'))
    await ventana.waitFor({ state: 'detached', timeout: 10000 })
    const us = await esperar(() => leerUnidades(page), (l) => l.filter((u) => String(u.dependeDe) === 'p-ce2').length === 14)
    assert.equal(us.filter((u) => String(u.dependeDe) === 'p-ce2').length, 14, 'las 14 bajo el CE-II')
    assert.equal(us.find((u) => u.id === 'p-ce2').tipo, 'pc', 'el CE-II queda PC')
    const cfg = await esperar(() => leerConfig(page), (c) => c && c.confirmada)
    assert.ok(cfg && cfg.confirmada && cfg.unidad === 'CE - II' && cfg.superior === 'FF.TT.T.O.' && cfg.puesto === 'g3' && cfg.adyacentes.join() === 'CE-I', 'configUnidad ' + JSON.stringify(cfg))
    const orden = await esperar(() => leerOrden(page), (o) => o.escalonSuperior === 'FF.TT.T.O.')
    assert.equal(orden.escalonSuperior, 'FF.TT.T.O.')
    assert.equal(orden.unidadesAdyacentes, 'CE-I')
    assert.equal(orden.unidad, 'CE - II')
    await page.waitForTimeout(600)
    await foto('2-colocadas-alrededor-del-CE')

    // ── 2. La F2·P3 ──
    await clic(page.getByRole('button', { name: /G-3 Operaciones/ }).first())
    await clic(page.getByRole('button', { name: '📄 Documentos', exact: true }))
    await clic(page.getByRole('button', { name: /Analizar la misión|Análisis de la misión/ }).first())
    await clic(page.getByRole('button', { name: /F2·P3.*Mi unidad y sus dependientes/ }).first())
    const caja = page.locator('[data-sid="mi-unidad"]')
    await caja.waitFor({ timeout: 10000 })
    await caja.scrollIntoViewIfNeeded()
    await foto('3-F2P3-resumen')
    const txt = await caja.innerText()
    assert.match(txt, /MI UNIDAD Y SU CONTEXTO/)
    assert.match(txt, /CE - II/)
    assert.match(txt, /14 · 14 en la carta/)
    assert.equal(await caja.locator('details [data-sid="dependientes"]').count(), 1, 'el recuadro de antes, plegado')

    // ── 3. Cambiar a DIV-5 (no está en la carta) ──
    await clic(caja.locator('[data-sid="mu-cambiar"]'))
    await clic(caja.locator('[data-nivel="division"]'))
    await clic(caja.locator('[data-unidad="DIV-5"]'))
    assert.equal(await caja.locator('[data-sid="mu-superior"]').inputValue(), 'CE-I', 'superior de la DIV-5')
    assert.equal(await caja.locator('[data-sid="mu-falta"]').count(), 15)
    await foto('4-F2P3-DIV5')
    await clic(caja.locator('[data-sid="mu-colocar"]'))
    const us2 = await esperar(() => leerUnidades(page), (l) => l.some((u) => u.designacion === 'DIV-5'))
    const div5 = us2.find((u) => u.designacion === 'DIV-5')
    assert.ok(div5 && div5.tipo === 'pc' && div5.escalon === 'division', 'DIV-5 en la carta como PC')
    assert.equal(us2.filter((u) => String(u.dependeDe) === String(div5.id)).length, 15, 'sus 15')
    await page.waitForTimeout(700)
    await foto('5-DIV5-colocada')

    // ── 3b. 🎖️ Paleta de símbolos (21-11): un toque suma el renglón con su sigla, se escribe solo el número ──
    await clic(caja.locator('[data-sid="mu-cambiar"]'))
    const pal = caja.locator('[data-sid="mu-paleta"]')
    await pal.waitFor({ timeout: 5000 })
    assert.equal(await pal.locator('[data-pal-esc="regimiento"]').evaluate((b) => getComputedStyle(b).backgroundColor), 'rgb(255, 212, 71)', 'una DIV abre la paleta en Rgto.')
    const filas0 = await caja.locator('[data-mu-fila]').count()
    const valorActivo = () => page.evaluate(() => (document.activeElement && document.activeElement.value) || '')
    await clic(pal.locator('[data-paleta="RI-"]'))
    await esperar(valorActivo, (v) => v === 'RI-', 3000)
    assert.equal(await valorActivo(), 'RI-', 'el foco queda en la sigla')
    await page.keyboard.type('41')
    await page.keyboard.press('Enter') // otra igual
    await esperar(valorActivo, (v) => v === 'RI-', 3000)
    await page.keyboard.type('42')
    await clic(pal.locator('[data-pal-esc="batallon"]'))
    await clic(pal.locator('[data-paleta="BAT. ING.-"]'))
    await esperar(valorActivo, (v) => v === 'BAT. ING.-', 3000)
    await page.keyboard.type('5')
    await clic(pal.locator('[data-pal-esc="regimiento"]'))
    await clic(pal.locator('[data-paleta="RCB-"]')) // queda sin número
    await esperar(valorActivo, (v) => v === 'RCB-', 3000)
    const nombres = await caja.locator('[data-mu-fila]').evaluateAll((l) => l.map((i) => i.value))
    assert.equal(nombres.length, filas0 + 4)
    assert.deepEqual(nombres.slice(-4), ['RI-41', 'RI-42', 'BAT. ING.-5', 'RCB-'])
    assert.equal(await caja.locator('[data-sid="mu-simbolo"] svg').count(), filas0 + 4, 'cada renglón con su símbolo')
    await pal.scrollIntoViewIfNeeded()
    await foto('4b-paleta')
    await clic(caja.locator('[data-sid="mu-guardar"]'))
    assert.match(await caja.locator('[role="alert"]').innerText(), /Falta el número de: RCB-/)
    await esperar(valorActivo, (v) => v === 'RCB-', 3000)
    await page.keyboard.type('6')
    assert.equal(await caja.locator('[data-mu-fila]').last().inputValue(), 'RCB-6')
    await clic(caja.locator('[data-sid="mu-colocar"]'))
    const us3 = await esperar(() => leerUnidades(page), (l) => l.some((u) => u.designacion === 'RCB-6'))
    const nuevas = ['RI-41', 'RI-42', 'BAT. ING.-5', 'RCB-6'].map((d) => us3.find((u) => u.designacion === d))
    assert.ok(nuevas.every((u) => u && String(u.dependeDe) === String(div5.id)), 'las 4 de la paleta bajo la DIV-5')
    assert.equal(nuevas.map((u) => `${u.escalon}/${u.arma}`).join(), 'regimiento/infanteria,regimiento/infanteria,batallon/ingenieria,regimiento/cabmec')
    await page.waitForTimeout(700)
    await foto('4c-paleta-colocadas')

    // ── 3c. FF.TT.T.O. con CE-I…CE-IV y el CE-III de la DEMIL (árbol del tema base) ──
    await clic(caja.locator('[data-sid="mu-cambiar"]'))
    await clic(caja.locator('[data-nivel="ejercito"]'))
    await clic(caja.locator('[data-unidad="FF.TT.T.O."]'))
    assert.equal(await caja.locator('[data-sid="mu-superior"]').inputValue(), 'CTO')
    assert.deepEqual(await caja.locator('[data-mu-fila]').evaluateAll((l) => l.map((i) => i.value)), ['CE-I', 'CE-II', 'CE-III', 'CE-IV'])
    await clic(caja.locator('[data-sid="mu-arbol-ver"]'))
    await caja.locator('[data-arbol="CE-III"]').waitFor({ timeout: 5000 })
    await caja.locator('[data-sid="mu-arbol"]').scrollIntoViewIfNeeded()
    await foto('4d-FFTTTO-y-arbol')
    await clic(caja.locator('[data-arbol="CE-III"]'))
    assert.deepEqual(await caja.locator('[data-mu-fila]').evaluateAll((l) => l.map((i) => i.value)), ['DIV-8', 'DIV-9', 'DIV-6'])
    assert.equal(await caja.locator('[data-sid="mu-superior"]').inputValue(), 'FF.TT.T.O.')
    await pal.scrollIntoViewIfNeeded()
    await foto('4e-CE-III')
    await clic(caja.getByRole('button', { name: 'Cancelar', exact: true }))

    // ── 4. Guardar como → Guardar · actualizar ──
    await clic(page.locator('#sid-resg-btn'))
    await clic(page.locator('#sid-resg-panel [data-r="bajar"]'))
    await esperar(() => page.locator('#sid-resg-panel').innerText(), (t) => /Archivo guardado: ejercicio-prueba\.json/.test(t))
    assert.ok((await page.evaluate(() => window.__escrituras.length)) >= 1, 'escribió el archivo')
    assert.match(await page.locator('#sid-resg-btn').innerText(), /Guardar ✓ \d\d:\d\d/i)
    await clic(page.locator('#sid-resg-btn')) // cierra el panel
    await page.waitForTimeout(800)
    const antes = await page.evaluate(() => window.__escrituras.length)
    await clic(page.locator('#sid-resg-btn')) // abre y GUARDA
    await esperar(() => page.locator('#sid-resg-panel').innerText(), (t) => /actualizado/.test(t))
    const n = await page.evaluate(() => window.__escrituras.length)
    assert.ok(n > antes, `actualizó el mismo archivo: ${antes} → ${n}`)
    const ultimo = JSON.parse(await page.evaluate(() => window.__escrituras[window.__escrituras.length - 1]))
    assert.equal(ultimo.ops.configUnidad.unidad, 'DIV-5', 'el archivo tiene lo último')
    assert.match(await page.locator('#sid-resg-panel').innerText(), /Guardar · actualizar «ejercicio-prueba\.json»/)
    await foto('6-guardar-actualizar')

    assert.deepEqual(errores, [], 'sin errores de consola')
    console.log('OK: ventana al abrir → CE-II y sus 14; F2·P3 resumen; DIV-5 y sus 15; paleta RI-41/RI-42/BAT. ING.-5/RCB-6 colocadas; FF.TT.T.O. y CE-III; Guardar como → Guardar actualiza el mismo archivo.')
  } catch (e) {
    await foto('error').catch(() => {})
    console.error('errores de consola:', errores)
    console.error(e)
    process.exitCode = 1
  } finally {
    await cerrar()
  }
})()
