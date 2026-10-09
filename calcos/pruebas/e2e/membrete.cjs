// El MEMBRETE TÁCTICO de los documentos militares en la Mesa real (Chromium), con un
// ejercicio FICTICIO (riesgo-ejercicio.js + la Orden Preparatoria N° 1 y la alerta del
// G-3 y una ficha del RCB-1), en escritorio y en teléfono:
//   · el Word (formato militar) de la Orden Preparatoria N° 1 del Tablero del G-3 lleva
//     el membrete en Arial 10 negrilla: DIV.MEC.-1 (la unidad que expidió la Orden) /
//     RCB-1 | CG. PAMPA LOMA D-7 (0800) / EMO/SEC-III / No. 003/SMM, con «CG.» debajo
//     de la R de SECRETO (la celda de la unidad mide 4616 twips);
//   · el CG es el pueblo más cercano a la ficha del RCB-1; las iniciales, las del usuario
//     de SIDECEME (SERGIO HERNAN MORALES MILLAS → SMM);
//   · una hoja de trabajo (F2·P3 Tareas) sale SIN membrete;
//   · la vista previa de la Orden lleva el membrete nuevo.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioRiesgo } = require('../riesgo-ejercicio.js')

const out = path.resolve(__dirname, '../salidas-membrete')
fs.mkdirSync(out, { recursive: true })

// Lee un .docx (ZIP) → { nombre: texto }.
function leerZip(buf) {
  const b = Buffer.from(buf)
  let fin = b.length - 22
  while (fin >= 0 && b.readUInt32LE(fin) !== 0x06054b50) fin--
  const n = b.readUInt16LE(fin + 10)
  let p = b.readUInt32LE(fin + 16)
  const o = {}
  for (let i = 0; i < n; i++) {
    const metodo = b.readUInt16LE(p + 10)
    const tam = b.readUInt32LE(p + 20)
    const lenN = b.readUInt16LE(p + 28)
    const lenE = b.readUInt16LE(p + 30)
    const lenC = b.readUInt16LE(p + 32)
    const local = b.readUInt32LE(p + 42)
    const nombre = b.toString('utf8', p + 46, p + 46 + lenN)
    const ini = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28)
    const datos = b.subarray(ini, ini + tam)
    o[nombre] = (metodo === 0 ? datos : zlib.inflateRawSync(datos)).toString('utf8')
    p += 46 + lenN + lenE + lenC
  }
  return o
}
const parrafos = (xml) => xml.split('</w:p>').map((p) => ({ xml: p, texto: p.replace(/<w:tab\/>/g, '\t').replace(/<[^>]+>/g, '') }))

function ejercicio() {
  const d = ejercicioRiesgo()
  d.nombre = 'PRUEBA MEMBRETE (FICT.)'
  d.ordenSup = { ...d.ordenSup, clave: '', clasificacion: 'SECRETO' }
  d.unidades = [...d.unidades, { id: 'r-rcb1', bando: 'propias', tipo: 'unidad', designacion: 'RCB-1', arma: 'blindada', escalon: 'regimiento', lat: -16.81, lng: -68.52 }]
  d.g3 = {
    ...d.g3,
    alerta: { 'I.- OBJETO': 'Alertar al Estado Mayor (FICT.).' },
    prep1: { OBJETO: 'Orden preparatoria (FICT.).', 'II.- MISIÓN (la recibida, aún sin reexpresar)': 'Defender el AO. PUEBLO-X (FICT.).' },
  }
  return d
}
const CAPAS = {
  poblaciones_puntos: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { nombre: 'Viacha' }, geometry: { type: 'Point', coordinates: [-68.3, -16.65] } },
      { type: 'Feature', properties: { nombre: 'Pampa Loma' }, geometry: { type: 'Point', coordinates: [-68.53, -16.8] } },
    ],
  },
}

async function irA(page, fase, hoja) {
  if (!(await page.getByRole('button', { name: '← Volver a mis documentos' }).count())) {
    await page.getByRole('button', { name: /G-3 Operaciones/ }).first().dispatchEvent('click')
    await page.getByRole('button', { name: '📄 Documentos', exact: true }).dispatchEvent('click')
  } else await page.getByRole('button', { name: '← Volver a mis documentos' }).dispatchEvent('click')
  // Se abre la fase sólo si está cerrada (▸): la primera ya viene abierta.
  const f = page.getByRole('button', { name: fase }).first()
  if ((await f.innerText()).includes('▸')) await f.dispatchEvent('click')
  await page.getByRole('button', { name: hoja }).dispatchEvent('click')
  await page.getByRole('button', { name: '← Volver a mis documentos' }).waitFor()
}
async function bajarMilitar(page, archivo) {
  const d = page.waitForEvent('download')
  await page.getByRole('button', { name: '📄 Word (formato militar)' }).dispatchEvent('click')
  const doc = await d
  const destino = path.join(out, archivo)
  await doc.saveAs(destino)
  return leerZip(fs.readFileSync(destino))['word/document.xml']
}

;(async () => {
  for (const movil of [false, true]) {
    const a = await abrir({ ancho: movil ? 390 : 1440, alto: movil ? 844 : 1000, movil, consulta: '?puesto=g3' })
    const { page } = a
    page.on('dialog', (d) => d.accept())
    const tag = movil ? 'movil' : 'escritorio'
    try {
      // El usuario que entró por SIDECEME.
      await page.evaluate(() => sessionStorage.setItem('sideceme_session', JSON.stringify({ user: { nombre_completo: 'SERGIO HERNAN MORALES MILLAS' }, tipo: 'cursante' })))
      await sembrarYAbrir(page, ejercicio())
      // Sin red no hay capa de poblaciones: se le da al membrete la de la prueba.
      assert.ok(await page.evaluate(() => !!globalThis.SIDMembrete), 'el módulo del membrete está cargado')
      await page.evaluate((c) => globalThis.SIDMembrete.sincronizar({ capas: c }), CAPAS)

      // Orden Preparatoria N° 1 (G-3): documento militar.
      await irA(page, /Recibir la misión.*documentos/, /F1·P7.*Orden Preparatoria N° 1/)
      const xml = await bajarMilitar(page, `${tag}-F1P7.docx`)
      const ps = parrafos(xml)
      const i = ps.findIndex((p) => p.texto === 'DIV.MEC.-1 (FICT.)')
      assert.ok(i >= 0, `falta el escalón superior: ${ps.slice(0, 6).map((p) => p.texto).join(' | ')}`)
      // El formato militar (calcos/formato-militar/v1) pone la unidad y el CG en dos celdas de
      // una tabla sin bordes; la izquierda llega justo hasta la R de SECRETO.
      assert.deepEqual(
        ps.slice(i, i + 5).map((p) => p.texto),
        ['DIV.MEC.-1 (FICT.)', 'RCB-1', 'CG. PAMPA LOMA D-7 (0800)', 'EMO/SEC-III', 'No. 003/SMM'],
      )
      for (const p of ps.slice(i, i + 5)) {
        assert.match(p.xml, /<w:b\/>/, 'negrilla')
        assert.match(p.xml, /<w:sz w:val="20"\/>/, 'Arial 10')
        assert.match(p.xml, /w:ascii="Arial"/, 'Arial')
      }
      const r = await page.evaluate(() => globalThis.SIDMembrete.tabulacion({ clasificacion: 'SECRETO', anchoTexto: 12240 - 5 * 567 }))
      assert.equal(r, 4616)
      assert.match(xml, new RegExp(`<w:gridCol w:w="${r}"/>`), 'la celda de la unidad llega hasta la R de SECRETO')
      assert.ok(xml.includes('ORDEN PREPARATORIA'), 'el título')

      // Una hoja de trabajo: sin membrete.
      await irA(page, /Analizar la misión.*documentos/, /F2·P3.*Tareas específicas/)
      if (await page.getByRole('button', { name: '📄 Word (formato militar)' }).count()) {
        const x2 = await bajarMilitar(page, `${tag}-F2P3.docx`)
        assert.ok(!/EMO\/SEC|No\. \d{3}/.test(x2), 'la hoja de trabajo no lleva membrete')
        assert.ok(!x2.includes('CG. PAMPA LOMA'), 'la hoja de trabajo no lleva membrete')
      }

      assert.deepEqual(a.errores, [])
      console.log(`OK ${movil ? 'teléfono' : 'escritorio'}: Orden Preparatoria N° 1 con el membrete táctico (Arial 10 negrilla, CG. PAMPA LOMA D-7 (0800), EMO/SEC-III, No. 003/SMM, «CG.» en la R) y la hoja de trabajo sin membrete.`)
    } catch (e) {
      console.error('ERRORES APP', a.errores)
      fs.writeFileSync(path.join(out, `fallo-${tag}.txt`), await page.locator('body').innerText().catch(() => ''))
      await page.screenshot({ path: path.join(out, `fallo-${tag}.png`), fullPage: true }).catch(() => {})
      throw e
    } finally {
      await a.cerrar()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
