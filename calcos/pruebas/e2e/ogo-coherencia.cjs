// 🔎 La revisión de coherencia, 📍 las unidades que faltan y 📤 el reparto (pasos 11, 12 y 13 del profesor)
// en la Mesa real (Chromium), como está publicada (SIDECEME de mentira: servidor-falso.js). Lo pidió
// Sergio (11-10-2026) con el Word del Anexo A que le salió con «[Escalón superior pendiente]» y en texto:
//   · el membrete: CTO / FF.TT.T.O. / «CG. Tunapa. D-60 (0800)» / EMO/SEC-III / «No. 002/XYZ.»; APÉNDICES S/A.;
//   · el Anexo A es el GRÁFICO de la Mesa (una imagen en el Word, sin «REFERENCIAS DEL CALCO»);
//   · paso 11: el pedido de coherencia lleva TODOS los documentos, el CTO, Tunapa y las unidades que
//     faltan; se pega la respuesta consolidada (fixtures/ogo-consolidado-ia.md) y reemplaza los documentos;
//   · paso 12: las unidades que faltan con ✓ Aceptar: la ficha entra en la carta y el «(supuesto)» se va;
//   · paso 13: ⬇️ JSON del ejercicio (sólo la parte elegida con la tijera) y 📤 envío por ciclo/paralelo
//     (calco-ops: areas_destinos / ejercicio_enviar) con los documentos y el calco como imagen;
//   · sin errores de consola.
//   node calcos/pruebas/e2e/ogo-coherencia.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { abrir } = require('./navegador.js')
const { servidorFalso, abrirDelServidor } = require('./servidor-falso.js')
const JSZip = require('../../../jszip.min.js')

const SALIDAS = path.join(__dirname, '..', 'salidas-coherencia')
fs.mkdirSync(SALIDAS, { recursive: true })
const PANEL = '#sid-mod-panel'
const ORG = 'ORGANIZACIÓN DE LA TAREA:\nI CUERPO DE EJÉRCITO (I CE): Orgánico; Grupo de Artillería de Lanzadores Múltiples 1 (GALM-1) (OPCON a partir D-2 1200)\nII CUERPO DE EJÉRCITO (II CE): Orgánico\nIII CUERPO DE EJÉRCITO (III CE): Orgánico (Reserva de FF.TT.T.O.)\nAGRUPACIÓN DE ARTILLERÍA DE FF.TT.: Orgánico; menos GALM-1\nAGRUPACIÓN DE INGENIEROS DE FF.TT.: Orgánico\nBATALLÓN DE AVIACIÓN DE EJÉRCITO 1: Orgánico\nBATALLÓN LOGÍSTICO DE FF.TT.: Orgánico (supuesto)\n'
const ORDEN = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'ogo-respuesta-ia.md'), 'utf8').replace(/ORGANIZACIÓN DE LA TAREA:[\s\S]*?\n\nI\.- SITUACIÓN/, ORG + '\nI.- SITUACIÓN')
const CONS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'ogo-consolidado-ia.md'), 'utf8').replace('{{ORDEN}}', ORDEN)

function unidad(id, designacion, arma, escalon, lat, lng, extra) { return Object.assign({ id, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat, lng, piezas: 3 }, extra || {}) }
function ejercicio() {
  const ao = [[-69.25, -18.35], [-68.32, -18.40], [-68.30, -19.05], [-69.10, -19.10], [-69.28, -18.80]]
  const ce1 = [[-69.25, -18.35], [-68.32, -18.40], [-68.31, -18.665], [-69.26, -18.665]]
  const pob = (name, lng, lat, fclass, population) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { name, fclass, population } })
  return {
    version: 1, nombre: 'FABBLE 1.1', pais: 'bolivia',
    unidades: [
      unidad('fftto', 'FF.TT.T.O.', 'infanteria', 'ejercito', -18.865, -68.52),
      unidad('ce1', 'CE-I', 'infanteria', 'cuerpo', -18.57, -68.57), unidad('ce2', 'CE-II', 'mecanizada', 'cuerpo', -18.74, -68.64), unidad('ce3', 'CE-III', 'blindada', 'cuerpo', -18.80, -68.45),
      unidad('rojo', 'VI EJ. (FICT.)', 'mecanizada', 'ejercito', -18.5, -69.1, { bando: 'enemigo' }),
    ],
    ops: {
      unidadConsiderada: { nombre: 'FF.TT.T.O.', escalon: 'ejercito', confirmada: true },
      limites: [{ coords: [[-69.26, -18.665], [-68.31, -18.665]], escalon: 'cuerpo', tipo: 'magnitud' }], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [],
      magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], ains: [], objetivos: [], maniobra: [],
      areasOps: [{ id: 'ao-fftt', nombre: 'AO FF.TT.T.O.', coords: ao }, { id: 'ao-ce1', nombre: 'CE-I', coords: ce1 }],
      areaOps: { id: 'ao-ce1', nombre: 'CE-I', coords: ce1, tipo: 'defensiva', ambiente: 'altiplano' }, // la que se cortó con la tijera
    },
    ordenSup: { unidad: 'FF.TT.T.O.', numero: '01' },
    resultados: { poblaciones_puntos: { fc: { type: 'FeatureCollection', features: [pob('Tunapa', -68.53, -18.87, 'hamlet', 131), pob('Sabaya', -68.62, -18.63, 'town', 900), pob('Pagador', -68.46, -18.69, 'village', 300), pob('Negrillos', -68.42, -18.89, 'village', 250)] } } },
  }
}

;(async () => {
  const calcos = [{ id: 'id-0', nombre: 'FABBLE 1.1', payload: ejercicio(), actualizado_en: new Date().toISOString() }]
  const log = [], envios = []
  const { page, errores, cerrar } = await abrir({
    ancho: 1600, alto: 1000,
    preparar: async (p) => {
      await servidorFalso(p, calcos, log)
      // lo nuevo de calco-ops (11-10-2026): los destinos por ciclo/paralelo y el envío del ejercicio
      await p.route(/functions\/v1\/calco-ops/, (r) => {
        if (r.request().method() === 'OPTIONS') return r.fallback()
        const b = JSON.parse(r.request().postData() || '{}')
        const json = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) })
        if (b.accion === 'areas_destinos') return json({ ok: true, destinos: [{ clave: 'ciclo:1ER CICLO', nombre: 'Todo el 1ER CICLO (125 cursantes)', tipo: 'ciclo', ciclo: '1ER CICLO' }, { clave: 'paralelo:1ER CICLO|A', nombre: '1ER CICLO · Paralelo A (42 cursantes)', tipo: 'paralelo', ciclo: '1ER CICLO', paralelo: 'A' }, { clave: 'grupo:g1', nombre: 'Curso · EM 1', grupo_id: 'g1', ejercicio_id: 'e1' }] })
        if (b.accion === 'ejercicio_enviar') { envios.push(b); return json({ ok: true, envio_id: 'e-1' }) }
        return r.fallback()
      })
    },
  })
  page.on('dialog', (d) => d.accept())
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const doc = (id) => `${PANEL} [data-ogo-doc="${id}"]`
  const bajar = async (sel) => {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.locator(sel).first().dispatchEvent('click')])
    return { nombre: d.suggestedFilename(), buf: fs.readFileSync(await d.path()) }
  }
  const zipDe = (buf) => JSZip.loadAsync(buf)
  const textoWord = async (buf) => { const z = await zipDe(buf); return (await z.file('word/document.xml').async('string')).replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"') }
  const ogoDe = () => page.evaluate(() => JSON.parse(JSON.stringify(window.SIDModalidad.ogo)))
  const fichas = () => page.evaluate(() => (window.SIDMesaEjercicio.foto().unidades || []).map((u) => ({ d: u.designacion, t: u.tipo, lat: u.lat, lng: u.lng, origen: u.origen })))
  try {
    await abrirDelServidor(page, 'FABBLE 1.1')
    await page.waitForTimeout(1200)
    await page.locator('#sid-mod-sel button[data-m=profesor]').dispatchEvent('click')
    await page.waitForTimeout(500)
    if (await page.locator(`${PANEL}.plegado`).count()) await page.locator(`${PANEL} .asa`).dispatchEvent('click')
    await page.locator(`${PANEL} select[data-escalon]`).selectOption('fftt')
    await page.locator(`${PANEL} select[data-foco]`).selectOption('g4')

    // los pasos: 10 OGO · 11 coherencia · 12 unidades · 13 repartir
    const num = async (sel) => page.locator(`${PANEL} .paso`, { has: page.locator(sel) }).locator('.num').innerText()
    assert.equal(await num('#sid-ogo'), '10'); assert.equal(await num('#sid-coh'), '11'); assert.equal(await num('#sid-ubi'), '12'); assert.equal(await num('#sid-rep'), '13')

    // la Orden escrita (con la organización de la tarea del ejercicio y el batallón logístico «(supuesto)»)
    await page.locator(`${doc('ogo')} [data-a="ogo-pedido"]`).dispatchEvent('click')
    await page.waitForFunction(() => /RECORDATORIO/.test(document.querySelector('#sid-mod-panel textarea[data-ogo-pedido]')?.value || ''), null, { timeout: 8000 })
    const pOgo = await page.locator(`${PANEL} textarea[data-ogo-pedido]`).inputValue()
    assert.match(pOgo, /\*\*Expide:\*\* FF\.TT\.T\.O\. · PC Tunapa/, 'quien expide es el «¿Quién soy?» y su CG la población más cercana')
    assert.match(pOgo, /\*\*la reciben:\*\* CE-I, CE-II y CE-III/)
    assert.match(pOgo, /Escalón superior de las FF\.TT\.T\.O\.:\*\* CTO/)
    assert.match(pOgo, /Fecha y hora de la OGO:\*\* todavía no está fijada[\s\S]*«FECHA Y HORA: D-60 \(0800\)»/)
    assert.match(pOgo, /### Poblaciones[\s\S]*FF\.TT\.T\.O\. → Tunapa \(Caserío\), a 1,2 km/)
    await page.locator(`${PANEL} textarea[data-ogo-resp="ogo"]`).fill('FECHA Y HORA: D-60 (0800)\n' + ORDEN)
    await page.locator(`${doc('ogo')} [data-a="ogo-guardar"]`).dispatchEvent('click')
    await page.waitForFunction(() => !!(window.SIDModalidad.ogo.docs || {}).ogo, null, { timeout: 5000 })
    assert.equal((await ogoDe()).auto.fechaHora, 'D-60 (0800)', 'la fecha que fijó la IA queda para toda la OGO')
    await page.locator(`${doc('ogo')} [data-a="ogo-cerrar"]`).dispatchEvent('click')

    // el Anexo A: el gráfico de la Mesa (sin escribir) con el membrete de la Escuela
    assert.match(await page.locator(doc('calco')).innerText(), /🗺️ gráfico de la Mesa/)
    await page.locator(`${PANEL} [data-a="ogo-datos"]`).dispatchEvent('click')
    await page.waitForTimeout(500)
    assert.match(await page.locator(`${PANEL} input[data-ogo-cfg="superior"]`).getAttribute('placeholder'), /^CTO {2}\(de Regla de la Escuela/)
    assert.match(await page.locator(`${PANEL} input[data-ogo-cfg="lugar"]`).getAttribute('placeholder'), /^Tunapa {2}\(de La población más cercana/)
    await page.locator(`${PANEL} [data-a="ogo-datos"]`).dispatchEvent('click')
    let w = await bajar(`${doc('calco')} [data-a="ogo-word"]`)
    assert.match(w.nombre, /Anexo A - Calco de Operaciones\.docx$/)
    let z = await zipDe(w.buf), t = await textoWord(w.buf)
    fs.writeFileSync(path.join(SALIDAS, 'anexo-a-antes.docx'), w.buf)
    assert.match(t, /^CTO\nFF\.TT\.T\.O\.\nCG\. Tunapa\. D-60 \(0800\)\nEMO\/SEC-III\nNo\. 002\/XYZ\.\n/, 'el membrete de la imagen 5 (unidad y CG en la tabla del membrete)')
    assert.match(t, /OBJETO\t:\tCalco de Operaciones anexo a la ORDEN DE OPERACIONES No\. 01 de las FF\.TT\.T\.O\.\n/, 'sin escribir: el OBJETO lo pone la Mesa (sin doble punto)')
    assert.match(t, /APÉNDICES\t:\tS\/A\./); assert.match(t, /EL COMANDANTE DE LAS FF\.TT\.T\.O\./); assert.match(t, /Original\t:\tCTO/)
    assert.doesNotMatch(t, /REFERENCIAS DEL CALCO|pendiente/i, 'sin texto de referencias ni marcas «pendiente»')
    const imgs = Object.keys(z.files).filter((k) => /^word\/media\/.+\.png$/.test(k))
    assert.equal(imgs.length, 1, 'el calco es una imagen'); const png1 = await z.file(imgs[0]).async('nodebuffer'); assert.ok(png1.length > 20000, 'con su dibujo')
    fs.writeFileSync(path.join(SALIDAS, 'calco-antes.png'), png1)
    const dib = await page.evaluate(() => window.SIDOgoCalco.dibujo(window.SIDMesaEjercicio.foto()))
    assert.deepEqual([dib.cuenta.fichas, dib.cruces.length], [4, 2], 'las 4 fichas propias (el enemigo no) y las dos cruces')

    // ── paso 11: la revisión de coherencia ──
    await page.locator(`${PANEL} [data-a="coh-pedido"]`).dispatchEvent('click')
    await page.waitForFunction(() => /RECORDATORIO/.test(document.querySelector('#sid-mod-panel textarea[data-coh-pedido]')?.value || ''), null, { timeout: 8000 })
    const pc = await page.locator(`${PANEL} textarea[data-coh-pedido]`).inputValue()
    assert.match(pc, /REVISIÓN DE COHERENCIA Y DOCUMENTOS CONSOLIDADOS/)
    assert.match(pc, /=== DOCUMENTO: ogo · ORDEN DE OPERACIONES No\. 01 ===\nOBJETO:/, 'la Orden escrita va entera, con su marca')
    assert.match(pc, /Escalón superior: CTO \(Comando del Teatro de Operaciones/); assert.match(pc, /CG de quien expide: Tunapa/); assert.match(pc, /Fecha y hora de la OGO: D-60 \(0800\)/)
    assert.match(pc, /Unidades que nombran los documentos y NO están en la carta[\s\S]*BAT\. LOG\. FF\.TT\. \(BATALLÓN LOGÍSTICO DE FF\.TT\.\) · logistica · batallon · estaba «\(supuesto\)»/)
    assert.match(pc, /GALM-1 \(Grupo de Artillería de Lanzadores Múltiples 1\) · lanzacohetes · batallon · de I CE · OPCON a partir D-2 1200/)
    assert.doesNotMatch(pc, /- I CE ·|- CE-I ·.*NO están/, 'los Cuerpos ya están en la carta')
    await foto('1-pedido-coherencia')
    await page.locator(`${PANEL} textarea[data-coh-resp]`).fill(CONS)
    await page.locator(`${PANEL} [data-a="coh-aplicar"]`).dispatchEvent('click')
    await page.waitForFunction(() => !!(window.SIDModalidad.ogo.coherencia || {}).aplicado, null, { timeout: 5000 })
    let est = await ogoDe()
    assert.deepEqual(est.coherencia.docs, ['ogo', 'calco', 'icia'])
    assert.ok(est.docs.icia.consolidado && est.docs.ogo.previo, 'cada documento consolidado guarda el anterior')
    const av = await page.locator(`${PANEL} #sid-coh .ia-aviso`).innerText()
    assert.match(av, /3 documento\(s\) consolidados/); assert.match(av, /No reconocí: Anexo “Z”/); assert.match(av, /unidad\(es\) para colocar/)
    assert.match(await page.locator(`${PANEL} #sid-coh`).innerText(), /Consolidados 3 de 10[\s\S]*Fecha de la OGO: D-60 \(0800\)/)
    await page.locator(`${PANEL} [data-a="coh-seguir"]`).dispatchEvent('click')
    await page.waitForFunction(() => /SEGUÍ con la consolidación/.test(document.querySelector('#sid-mod-panel textarea[data-coh-pedido]')?.value || ''), null, { timeout: 5000 })
    assert.match(await page.locator(`${PANEL} textarea[data-coh-pedido]`).inputValue(), /=== DOCUMENTO: fuegos · ANEXO “C”/)
    await foto('2-coherencia-aplicada')

    // ── paso 12: las unidades que faltan, con ✓ Aceptar ──
    const ubi = `${PANEL} #sid-ubi`
    const nombres = await page.locator(`${ubi} .ubi-it .ubi-nom b`).allInnerTexts()
    assert.deepEqual(nombres.slice(0, 3), ['BAT. LOG. FF.TT.', 'GALM-1', 'PC ALTERNO FF.TT.T.O.'], 'primero las de la IA (con su ubicación)')
    assert.ok(nombres.includes('AGR. ART. FF.TT.') && nombres.includes('AGR. ING. FF.TT.') && nombres.includes('BAT. AV. EJTO. 1'), 'y las de la organización de la tarea')
    assert.ok(!nombres.some((n) => /^(VI EJ.*|CE-?I+|I+ CE|FF\.TT\.T\.O\.)$/.test(n)), 'ni el enemigo, ni los Cuerpos, ni quien expide: ' + nombres.join(' · '))
    const log1 = page.locator(`${ubi} .ubi-it`, { hasText: 'BAT. LOG. FF.TT.' })
    const t1 = await log1.innerText()
    assert.match(t1, /estaba «\(supuesto\)»[\s\S]*cerca de TUNAPA \(Caserío, [\d,]+ km\) · -18\.8850, -68\.4900 · ubicación de la IA/)
    assert.doesNotMatch(t1, /fuera del Área/, 'dentro del Área de Operaciones de las FF.TT.T.O. (no del pedazo del CE-I)')
    const agr = page.locator(`${ubi} .ubi-it`, { hasText: 'AGR. ART. FF.TT.' })
    assert.match(await agr.innerText(), /sugerida por la Mesa/)
    await foto('3-unidades')
    const antes = (await fichas()).length
    await log1.locator('[data-a="ubi-aceptar"]').dispatchEvent('click')
    await page.waitForFunction((n) => window.SIDMesaEjercicio.foto().unidades.length === n + 1, antes, { timeout: 5000 })
    const nueva = (await fichas()).find((f) => f.d === 'BAT. LOG. FF.TT.')
    assert.deepEqual([nueva.lat, nueva.lng, nueva.t, nueva.origen], [-18.885, -68.49, 'unidad', 'ogo-profesor'])
    await page.waitForTimeout(500)
    est = await ogoDe()
    assert.match(est.docs.ogo.texto, /BATALLÓN LOGÍSTICO DE FF\.TT\.: Orgánico\n/, 'la Orden ya no dice «(supuesto)» para el batallón logístico')
    assert.match(est.docs.ogo.texto, /Orgánico \(Reserva de FF\.TT\.T\.O\.\)/, 'lo demás no se toca')
    assert.doesNotMatch(est.docs.calco.texto, /BAT\. LOG\. FF\.TT\. en -18\.885, -68\.49 \(supuesto\)/)
    assert.match(await page.locator(`${ubi} .ia-aviso`).innerText(), /BAT\. LOG\. FF\.TT\. colocada cerca de TUNAPA[\s\S]*«\(supuesto\)» de 2 línea/)
    assert.equal(await page.locator(`${ubi} .ubi-it`, { hasText: 'BAT. LOG. FF.TT.' }).count(), 0, 'ya no se ofrece')
    // ✕ No colocar y ↺ volver a ofrecerla
    await page.locator(`${ubi} .ubi-it`, { hasText: 'BAT. AV. EJTO. 1' }).locator('[data-a="ubi-descartar"]').dispatchEvent('click')
    await page.waitForFunction(() => /Sin colocar: BAT\. AV\. EJTO\. 1/.test(document.querySelector('#sid-ubi')?.innerText || ''), null, { timeout: 4000 })
    await page.locator(`${ubi} [data-a="ubi-volver"]`).dispatchEvent('click')
    await page.waitForFunction(() => [...document.querySelectorAll('#sid-ubi .ubi-it b')].some((b) => b.textContent === 'BAT. AV. EJTO. 1'), null, { timeout: 4000 })
    // ✓ Aceptar todas
    const pend = await page.locator(`${ubi} .ubi-it`).count()
    await page.locator(`${ubi} [data-a="ubi-todas"]`).dispatchEvent('click')
    await page.waitForFunction((n) => window.SIDMesaEjercicio.foto().unidades.length === n, antes + 1 + pend, { timeout: 5000 })
    await page.waitForTimeout(500)
    assert.equal(await page.locator(`${ubi} .ubi-it`).count(), 0)
    assert.match(await page.locator(ubi).innerText(), /Todas las unidades que nombran los documentos están en la carta/)
    const fs2 = await fichas()
    assert.ok(fs2.some((f) => f.d === 'PC ALTERNO FF.TT.T.O.' && f.t === 'pc'), 'el PC alterno entra como PC')
    await foto('4-unidades-colocadas')

    // el calco ahora las dibuja (la Mesa las tiene)
    w = await bajar(`${doc('calco')} [data-a="ogo-word"]`)
    z = await zipDe(w.buf); t = await textoWord(w.buf)
    fs.writeFileSync(path.join(SALIDAS, 'anexo-a.docx'), w.buf)
    assert.match(t, /OBJETO\t:\tCalco de Operaciones anexo a la OGO N° 01\/26 "FABBLE 1\.1" de las FF\.TT\.T\.O\./, 'el OBJETO del consolidado')
    assert.match(t, /APÉNDICES\t:\tS\/A\./, '«Sin novedad.» → S/A.')
    const png2 = await z.file(Object.keys(z.files).find((k) => /^word\/media\/.+\.png$/.test(k))).async('nodebuffer')
    fs.writeFileSync(path.join(SALIDAS, 'calco.png'), png2)
    const dib2 = await page.evaluate(() => window.SIDOgoCalco.dibujo(window.SIDMesaEjercicio.foto()))
    assert.ok(dib2.cuenta.fichas >= 9 && dib2.cuenta.pc === 1, 'el calco dibuja las colocadas (' + JSON.stringify(dib2.cuenta) + ')')

    // ── paso 13: repartir ──
    const repSel = `${PANEL} #sid-rep`
    const areas = await page.locator(`${repSel} input[data-rep-area]`).evaluateAll((xs) => xs.map((x) => [x.getAttribute('data-rep-area'), x.checked]))
    assert.deepEqual(areas, [['ao-fftt', false], ['ao-ce1', true]], 'va la parte cortada con la tijera (la seleccionada en la Mesa)')
    const j = await bajar(`${repSel} [data-a="rep-json"]`)
    const pq = JSON.parse(j.buf.toString('utf8'))
    assert.equal(pq.tipoArchivo, 'sideceme-areas-operaciones'); assert.deepEqual(pq.areas.map((a) => a.id), ['ao-ce1'])
    assert.ok(pq.documentos.some((d) => /Calco de Operaciones\.png$/.test(d.nombre) && d.tipo === 'imagen' && d.base64.length > 10000), 'el calco va como imagen')
    assert.ok(pq.documentos.some((d) => /ORDEN DE OPERACIONES No 01\.md$/.test(d.nombre) && !/PARA EL PROFESOR/.test(d.texto)), 'la Orden, sin lo del profesor')
    assert.ok(pq.contenido && pq.contenido.unidades.some((u) => u.designacion === 'CE-I') && !pq.contenido.unidades.some((u) => u.designacion === 'CE-II'), 'sólo lo que está dentro de la parte elegida')
    fs.writeFileSync(path.join(SALIDAS, j.nombre), j.buf)
    // a quién: por ciclo o paralelo
    await page.locator(`${repSel} [data-a="rep-destinos"]`).dispatchEvent('click')
    await page.waitForSelector(`${repSel} select[data-rep-destino] optgroup[label="🎓 Por ciclo"]`, { state: 'attached', timeout: 5000 })
    assert.deepEqual(await page.locator(`${repSel} select[data-rep-destino] optgroup`).evaluateAll((g) => g.map((x) => x.label)), ['🎓 Por ciclo', '🏫 Por paralelo', '🪖 Estados Mayores (grupos)'])
    await page.locator(`${repSel} select[data-rep-destino]`).selectOption('paralelo:1ER CICLO|A')
    await page.locator(`${repSel} textarea[data-rep-ind]`).fill('Planifiquen la defensa del CE-I.')
    await page.locator(`${repSel} input[data-rep-nombre]`).fill('OGO 01 · CE-I')
    await page.locator(`${repSel} [data-a="rep-enviar"]`).dispatchEvent('click')
    await page.waitForFunction(() => /Enviado a 1ER CICLO · Paralelo A/.test(document.querySelector('#sid-rep')?.innerText || ''), null, { timeout: 10000 })
    assert.equal(envios.length, 1)
    const e = envios[0]
    assert.deepEqual([e.calco_id, e.nombre, e.areas, e.destino.ciclo, e.destino.paralelo], ['id-0', 'OGO 01 · CE-I', ['ao-ce1'], '1ER CICLO', 'A'])
    assert.equal(e.opciones.indicaciones, 'Planifiquen la defensa del CE-I.'); assert.equal(e.opciones.documentos, true); assert.equal(e.opciones.contenido, true)
    assert.ok(e.foto.documentos.length >= 3 && e.opciones.documentosNombres.length === e.foto.documentos.length, 'los documentos elegidos, por nombre')
    assert.ok(e.foto.unidades.some((u) => u.designacion === 'BAT. LOG. FF.TT.'), 'la Mesa como está ahora (con lo colocado)')
    await foto('5-repartir')
    const erroresMesa = errores.filter((m) => !/favicon|ERR_|net::|Failed to load resource/.test(m))
    assert.deepEqual(erroresMesa, [], 'sin errores de consola')
    console.log('✔ OGO coherencia e2e: membrete (CTO, Tunapa, D-60, 002/XYZ., S/A.), calco gráfico en el Word, pedido y aplicación de la coherencia, unidades con ✓ Aceptar (sin «supuesto»), JSON de la parte elegida y envío por paralelo')
  } catch (err) {
    await foto('error').catch(() => {})
    throw err
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
