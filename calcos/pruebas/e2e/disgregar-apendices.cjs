// ⊞ Disgregar con los apéndices de un tema base (08-11-2026), en la Mesa real (Chromium).
// Sergio («DIAMANTE»): los organigramas de los CE están pegados como IMAGEN en el Word (la Mesa no los
// puede leer) y el Disgregar del CE-I decía «No encontré su organización». Pero los COE de cada división
// SÍ son texto («(COE de la DIV-3) … Dependencia orgánica: CE-I.» y el cuadro de sus unidades), y las
// fichas pasadas desde Google Earth dicen de quién dependen («DIV-3 – CE-I»). Ahora:
//   · CE-I: propone sus cuatro dependientes y NO duplica ninguna (ya estaban en la carta);
//   · CE-II: propone DIV. MEC.-2, DIV-2, DIV-5 (de los COE) y las pone alrededor;
//   · la DIV MEC -1 – CE-I se disgrega con su COE (RCB-1, RIM-8…).
//   node calcos/pruebas/e2e/disgregar-apendices.cjs
//   APENDICES="/ruta/APENDICES_01_AL_18_INDIVIDUALES" node …   (además, con los .docx reales)
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { abrir, sembrarYAbrir } = require('./navegador.js')
const { ejercicioFicticio } = require('../ejercicio-ficticio')

const SALIDAS = path.join(__dirname, '..', 'salidas-disgregar-apendices')
fs.mkdirSync(SALIDAS, { recursive: true })

// El texto como lo saca la Mesa de un .docx (un párrafo o celda por renglón).
const textoDocx = (f) => {
  const x = execFileSync('unzip', ['-p', f, 'word/document.xml']).toString()
  const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  return ent(x.replace(/<w:tab\b[^>]*\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')).replace(/\n{3,}/g, '\n\n').trim()
}
const coe = (n, div, ce, unidades) => ({ nombre: `APENDICE_${n}_COE.docx`, tipo: 'word', texto: `FCAMT. ECEME\nAPÉNDICE “${n}” (COE de la ${div}) AL ANEXO “C” (Personal), AL TEMA BASE “DIAMANTE”\nDependencia orgánica: ${ce}.  Dotación del modelo del ejercicio.\nI  PERSONAL Y ARMAMENTO\nGRUPO\nCLASE\nCMDO.\nCOMP. CYS\n${unidades.join('\n')}\nTOTAL\nPERSONAL` })
const DOCS = process.env.APENDICES
  ? fs.readdirSync(process.env.APENDICES).filter((n) => n.endsWith('.docx')).map((n) => ({ nombre: n, tipo: 'word', texto: textoDocx(path.join(process.env.APENDICES, n)) }))
  : [
      { nombre: 'APENDICE_03_ORG_CE_I.docx', tipo: 'word', texto: 'APÉNDICE “3” (Organigrama del CE-I) AL ANEXO “C”\nI.-     ORGANIGRAMA DEL CE-I.\n\nLa agrupación logística depende del cuerpo de ejército.' },
      coe(7, 'DIV. MEC.-1', 'CE-I', ['RCB-1', 'RIM-8', 'RIM-23', 'RIAT-30', 'RAM-2', 'BAT. AA-1']),
      coe(8, 'DIV-3', 'CE-I', ['RI-A/3 *', 'RI-B/3 *', 'RI-C/3 *', 'ERM-3', 'RAC-3']),
      coe(9, 'DIV-9', 'CE-I', ['RI-33', 'RI-34', 'RI-35']),
      coe(10, 'DIV. MEC.-2', 'CE-II', ['RCB-4', 'RIM-20']),
      coe(11, 'DIV-2', 'CE-II', ['RI-A/2 *']),
      coe(12, 'DIV-5', 'CE-II', ['RI-13']),
    ]

;(async () => {
  const { page, errores, cerrar } = await abrir({ ancho: 1600, alto: 1000 })
  const dialogos = []
  page.on('dialog', (d) => {
    dialogos.push({ tipo: d.type(), msg: d.message(), valor: d.defaultValue() })
    d.type() === 'prompt' ? d.accept(d.defaultValue()) : d.accept()
  })
  const U = (id, designacion, escalon, arma, lat, lng) => ({ id, bando: 'propias', tipo: 'unidad', designacion, escalon, arma, lat, lng, origenSuperponer: '060700NOV26' })
  const datos = ejercicioFicticio({ conPlantilla: false })
  datos.nombre = 'DISGREGAR CON APÉNDICES'
  datos.unidades = [
    U(1, 'CE-I', 'cuerpo', 'infanteria', -17.0, -65.0),
    U(2, 'DIV MEC -1 – CE-I', 'division', 'mecanizada', -17.05, -65.02),
    U(3, 'DIV-3 – CE-I', 'division', 'infanteria', -17.06, -65.1),
    U(4, 'DIV-9 – CE-I', 'division', 'infanteria', -17.02, -65.12),
    U(5, 'AGRP. LOG. – CE-I', 'division', 'logistica', -17.1, -65.05),
    U(6, 'CE-II', 'cuerpo', 'infanteria', -16.8, -65.3),
  ]
  datos.documentos = DOCS
  datos.ordenSup = { ...(datos.ordenSup || {}), organizacionTarea: '' }
  const fichas = () => page.evaluate(() => JSON.parse(JSON.stringify((window.SIDMesaEjercicio && window.SIDMesaEjercicio.foto().unidades) || [])))
  const foto = (n) => page.screenshot({ path: path.join(SALIDAS, n + '.png') })
  const disgregar = async (designacion) => {
    const i = await page.evaluate((d) => [...document.querySelectorAll('button.sid-disgregar')].findIndex((b) => {
      let el = b
      for (let k = 0; k < 4 && el; k++, el = el.parentElement) {
        const t = (el.textContent || '').replace(/⊞\s*Disgregar|⊟\s*Reagrupar|✕/g, '').trim()
        if (t === d) return true
      }
      return false
    }), designacion)
    assert.ok(i >= 0, 'botón Disgregar de ' + designacion)
    const n = dialogos.length
    await page.locator('button.sid-disgregar').nth(i).dispatchEvent('click') // el tablero de la Mesa tapa parte de la lista
    await page.waitForTimeout(800)
    return dialogos.slice(n).find((x) => x.tipo === 'prompt')
  }
  try {
    await sembrarYAbrir(page, datos)
    await page.waitForTimeout(1200)
    assert.equal((await fichas()).length, 6)
    await page.locator('.botones-mapa > button', { hasText: /Unidades/i }).first().dispatchEvent('click')
    await page.locator('button.sid-disgregar').first().waitFor({ timeout: 10000 })
    await foto('1-unidades')

    // CE-I: lo leído de los COE + lo que dicen las fichas; nada nuevo, nada duplicado.
    const p1 = await disgregar('CE-I')
    assert.ok(p1, 'pregunta la lista')
    assert.equal(p1.valor, 'DIV MEC -1 – CE-I, DIV-3 – CE-I, DIV-9 – CE-I, AGRP. LOG. – CE-I')
    assert.match(p1.msg, /Las leí de .*COE/)
    let us = await fichas()
    assert.equal(us.length, 6, 'no aparece ninguna ficha nueva (ya estaban todas)')
    assert.equal(us.find((u) => u.id === 1).tipo, 'pc')
    assert.deepEqual(us.filter((u) => u.dependeDe === 1).map((u) => u.id).sort(), [2, 3, 4, 5])
    await page.getByText(/no se duplicaron/).first().waitFor({ timeout: 5000 })
    await foto('2-ce-i')

    // CE-II: sólo los COE (sus divisiones no están en la carta) → tres fichas nuevas.
    const p2 = await disgregar('CE-II')
    assert.equal(p2.valor, 'DIV. MEC.-2, DIV-2, DIV-5')
    us = await fichas()
    assert.deepEqual(us.filter((u) => u.dependeDe === 6).map((u) => u.designacion), ['DIV. MEC.-2', 'DIV-2', 'DIV-5'])

    // DIV MEC -1 – CE-I (de Google Earth) se disgrega con el COE de la DIV. MEC.-1.
    const p3 = await disgregar('DIV MEC -1 – CE-I')
    assert.match(p3.valor, /^RCB-1, RIM-8, RIM-23, RIAT-30, RAM-2, BAT\. AA-1/)
    us = await fichas()
    assert.ok(us.filter((u) => u.dependeDe === 2).length >= 6)
    await foto('3-div-mec-1')

    const malos = errores.filter((e) => !/favicon|Failed to fetch|NetworkError|tiles?|overpass|abort/i.test(e))
    assert.deepEqual(malos, [], 'sin errores en la consola')
    console.log(`disgregar-apendices: OK${process.env.APENDICES ? ' (con los ' + DOCS.length + ' .docx reales)' : ''}`)
  } finally {
    await cerrar()
  }
})().catch((e) => { console.error(e); process.exit(1) })
