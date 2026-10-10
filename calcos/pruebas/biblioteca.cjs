// 📚 La biblioteca del profesor (calcos/modalidad/biblioteca.js) con dos COE REALES del Tema
// Base «DIAMANTE» que mandó Sergio (fixtures/coe-div-mec-1.docx y coe-div-1.docx): la tabla
// CLASE | CMDO. | … | TOTAL se lee con los efectivos, el armamento y los vehículos de cada
// unidad; las siglas dan el arma y el escalón de la Mesa; las fichas; los documentos y lo que
// va en el pedido a la IA.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const JSZip = require('../../jszip.min.js')
const B = require('../modalidad/biblioteca.js')
const IA = require('../modalidad/ia-profesor.js')
const CAT = require('../modalidad/catalogo.js')

const fx = (n) => fs.readFileSync(path.join(__dirname, 'fixtures', n))
;(async () => {
  const dm = await B.leerDocx(fx('coe-div-mec-1.docx'), JSZip)
  assert.ok(dm.tablas.length >= 1 && /APÉNDICE “19” \(COE de la DIV MEC-1\)/.test(dm.texto))
  const mec = B.leerCOE(dm)
  assert.equal(mec.division, 'DIV MEC-1'); assert.equal(mec.arma, 'mecanizada'); assert.equal(mec.efectivo, 3805)
  const u = Object.fromEntries(mec.unidades.map((x) => [x.designacion, x]))
  assert.deepEqual(mec.unidades.map((x) => x.designacion), ['CMDO.', 'COMP. CYS', 'RCB-1', 'RIM-8', 'RIM-23', 'RIAT-30', 'RAM-2', 'BAT. AA-1', 'BATING. MEC-1', 'BAT. COM. MEC-1', 'BAT. LOG-I', 'COMP. ICIA-1', 'COMP. PM-1'])
  assert.equal(u['CMDO.'].efectivo, 45); assert.equal(u['RCB-1'].efectivo, 520); assert.equal(u['RIAT-30'].efectivo, 220); assert.equal(u['COMP. PM-1'].efectivo, 40)
  assert.equal(mec.unidades.reduce((s, x) => s + x.efectivo, 0), 3805, 'las unidades suman el total del COE')
  assert.equal(u['RCB-1'].vehiculos['VC-TQ CASCAVEL EE-9'], 27); assert.equal(u['RAM-2'].armamento['OBÚS 155 M114'], 6); assert.equal(u['BATING. MEC-1'].equipo['DETECTOR MINAS'], 18)
  assert.equal(mec.totales.armamento['FUSIL GALIL'], 2830)
  const arma = (d) => `${u[d].arma}/${u[d].escalon}`
  assert.equal(arma('RCB-1'), 'blindada/regimiento'); assert.equal(arma('RIM-8'), 'mecanizada/regimiento'); assert.equal(arma('RIAT-30'), 'antitanque/regimiento')
  assert.equal(arma('RAM-2'), 'artilleria/regimiento'); assert.equal(arma('BAT. AA-1'), 'antiaerea/batallon'); assert.equal(arma('BATING. MEC-1'), 'ingenieria/batallon')
  assert.equal(arma('BAT. COM. MEC-1'), 'comunicaciones/batallon'); assert.equal(arma('BAT. LOG-I'), 'logistica/batallon'); assert.equal(arma('COMP. ICIA-1'), 'inteligencia/compania')
  assert.equal(arma('COMP. PM-1'), 'policiamilitar/compania'); assert.equal(u['COMP. CYS'].arma, 'ninguna')

  const inf = B.leerCOE(await B.leerDocx(fx('coe-div-1.docx'), JSZip))
  assert.equal(inf.division, 'DIV-1'); assert.equal(inf.arma, 'infanteria'); assert.equal(inf.efectivo, 3570); assert.equal(inf.unidades.length, 14)
  const ui = Object.fromEntries(inf.unidades.map((x) => [x.designacion, x]))
  assert.equal(`${ui['RI-17'].arma}/${ui['RI-17'].escalon}`, 'infanteria/regimiento'); assert.equal(`${ui['ERM-1'].arma}/${ui['ERM-1'].escalon}`, 'cabmec/compania')
  assert.equal(`${ui['SECC. AA-1'].arma}/${ui['SECC. AA-1'].escalon}`, 'antiaerea/seccion'); assert.equal(`${ui['COMP. ING. COMB-1'].arma}/${ui['COMP. ING. COMB-1'].escalon}`, 'ingenieria/compania')
  assert.equal(ui['SEC. IM-1'].arma, 'inteligencia'); assert.equal(ui['COMP. AT-1'].arma, 'antitanque')

  // Las fichas: el Cmdo. con la División entera, sin la Comp. C y S, ROJO espejado, armas y escalones del compilado.
  const centro = { lat: -17, lng: -68.3 }
  const f = B.fichasDeCOE(mec, { centro, bando: 'propias', ahora: 1 })
  assert.equal(f.length, 12); assert.equal(f[0].designacion, 'Cmdo. DIV MEC-1'); assert.equal(f[0].escalon, 'division'); assert.equal(f[0].efectivo, 3805)
  assert.ok(!f.some((x) => /CYS/.test(x.designacion)))
  assert.ok(f.find((x) => x.designacion === 'RIM-8 (DIV MEC-1)').lat > f[0].lat, 'AZUL: la maniobra adelante (al norte) del Cmdo.')
  for (const x of f) { assert.ok(IA.ARMAS.includes(x.arma), x.arma); assert.ok(IA.ESCALONES.includes(x.escalon), x.escalon); assert.equal(x.tipo, 'unidad') }
  const r = B.fichasDeCOE(mec, { centro, bando: 'ROJO', ahora: 2 })
  assert.ok(r.every((x) => x.bando === 'enemigas')); assert.ok(r.find((x) => /RIM-8/.test(x.designacion)).lat < r[0].lat, 'ROJO espejado')
  assert.equal(new Set(f.concat(r).map((x) => x.id)).size, 24)

  // Documentos: tipo y bando por el nombre o el texto; recorte; lo que va al pedido.
  const dCoe = B.documento('APENDICE_19_COE_DIV_MEC-1', { texto: dm.texto, coe: mec })
  assert.equal(dCoe.tipo, 'coe'); assert.equal(dCoe.bando, 'propias')
  assert.equal(B.documento('5.- APÉNDICE 2 - ARMAMENTO DE RAGNAR', { texto: 'FUSILES' }).tipo, 'armamento')
  const dOrg = B.documento('4.- APÉNDICE 1 - ORGANIZACIÓN DE RAGNAR', { texto: 'DIVISIÓN ACORAZADA ' + 'x'.repeat(50000) })
  assert.equal(dOrg.tipo, 'organizacion'); assert.equal(dOrg.bando, 'enemigas')
  assert.equal(B.documento('RDO 20001 RED', { texto: 'REGLAMENTO OPERACIONES' }).tipo, 'doctrina')
  const largo = B.documento('Reglamento', { texto: 'y'.repeat(900000) }); assert.equal(largo.texto.length, 400000); assert.equal(largo.recortado, 900000)
  const res = B.resumen([dOrg, dCoe, Object.assign(B.documento('sin IA', { texto: 'NO VA' }), { enIA: false })], 20000)
  assert.ok(res.indexOf('COE de la DIV MEC-1') < res.indexOf('ORGANIZACIÓN DE RAGNAR'), 'los COE primero')
  assert.match(res, /RCB-1 \(blindada, regimiento\): 520 H; armamento: PISTOLA 9 mm 57/); assert.match(res, /\(Organización \(propia o enemiga\), ROJO\)/)
  assert.doesNotMatch(res, /NO VA/); assert.ok(res.length < 21000, 'recortado: ' + res.length)

  // El pedido de la OGO lleva la biblioteca y la regla de usarla.
  const p = IA.armarPedido(CAT.PROFESOR.find((x) => x.ogo), { escalon: CAT.ESCALONES[1], foco: IA.focoDe('g2'), ejercicio: { nombre: 'DIAMANTE' }, biblioteca: [dCoe, dOrg] })
  assert.match(p, /BIBLIOTECA DEL PROFESOR/); assert.match(p, /### Biblioteca del profesor[\s\S]*COE de la DIV MEC-1 — efectivo total 3805/)
  assert.match(IA.armarPedido(CAT.PROFESOR[5], { biblioteca: [dCoe] }), /usá ESAS unidades/)

  // Lo que ve el navegador: el worker de pdf.js que se usa para leer los PDF existe.
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'pdf.worker.min-CrMmvqMo.mjs')))
  console.log(`biblioteca.cjs OK — DIV MEC-1 ${mec.efectivo} H en ${mec.unidades.length} unidades, DIV-1 ${inf.efectivo} H en ${inf.unidades.length}; ${f.length} fichas; resumen ${res.length} caracteres`)
})().catch((e) => { console.error(e); process.exit(1) })
