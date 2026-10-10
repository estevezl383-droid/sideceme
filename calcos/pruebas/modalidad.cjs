// 🎓 MODALIDAD: el catálogo de calcos/modalidad/catalogo.js contra el compilado publicado.
//   · las 7 fases con sus pasos numerados en orden y sin huecos (Visión Horizontal 2020);
//   · cada «Abrir» de una hoja apunta a una hoja que EXISTE en el compilado (num + nombre),
//     en el catálogo de ESA sección (Cmte./JEM/G-3 tienen el suyo; G-1, G-4, G-5 y EME el genérico);
//   · cada herramienta y cada sección tienen un botón real en el compilado;
//   · los pasos del profesor están en orden y el escalón tiene sus cuatro niveles;
//   · modalidad.js y catalogo.js se analizan sin error y el index los carga.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const RAIZ = path.resolve(__dirname, '..')
const CAT = require('../modalidad/catalogo.js')
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
const compilado = (html.match(/assets\/(index-[\w-]+\.js)/) || [])[1]
assert.ok(compilado, 'el index carga un compilado')
const js = fs.readFileSync(path.join(RAIZ, 'assets', compilado), 'utf8')
assert.match(html, /modalidad\/catalogo\.js/)
assert.match(html, /modalidad\/modalidad\.js/)
assert.match(html, /modalidad\/modalidad\.css/)
assert.ok(html.indexOf('pandora/capas-g.js') < html.indexOf('modalidad/modalidad.js'), 'va después de Pandora')
new vm.Script(fs.readFileSync(path.join(RAIZ, 'modalidad/modalidad.js'), 'utf8'))
new vm.Script(fs.readFileSync(path.join(RAIZ, 'modalidad/catalogo.js'), 'utf8'))

// Hojas del compilado, por catálogo: Cmte. (PLe), JEM (OLe), G-3 (ev) y el genérico (SIDuN0: G-1/G-4/G-5/EME).
function hojasDe(inicio, fin) {
  const i = js.indexOf(inicio)
  assert.ok(i > 0, `catálogo ${inicio} en el compilado`)
  const seg = js.slice(i, fin ? js.indexOf(fin, i + 1) : i + 60000)
  return [...seg.matchAll(/num:"(F\d·P[\d-]+)",nom:[`"]([^`"]+)[`"]/g)].map((m) => ({ num: m[1], nom: m[2] }))
}
const CATS = {
  cmte: hojasDe('PLe=[{id:1,nom:"Recibir la misión"', 'OLe=['),
  jem: hojasDe('OLe=[{id:1,nom:"Recibir la misión"', 'hse={'),
  g3: hojasDe('ev=[{id:1,nom:"Recibir la misión"', 'koe=['),
  generico: hojasDe('function SIDuN0(t){const e=t.de;return[{id:1', 'function uN('),
}
for (const k of Object.keys(CATS)) assert.ok(CATS[k].length >= 8, `${k}: ${CATS[k].length} hojas`)
const catalogoDe = (s) => CATS[s] || CATS.generico

let pasos = 0, abrires = 0
assert.equal(CAT.FASES.length, 7)
CAT.FASES.forEach((F, i) => {
  assert.equal(F.id, i + 1)
  assert.ok(F.que && F.corto && F.nom)
  F.pasos.forEach((p, j) => {
    assert.equal(p.n, j + 1, `F${F.id}: paso ${p.n} en orden`)
    assert.ok(p.nom && p.doc, `F${F.id}·P${p.n} con nombre y documento`)
    assert.ok(p.resp.length, `F${F.id}·P${p.n} con responsable`)
    p.resp.forEach((s) => assert.ok(CAT.SECCIONES[s], `${s} es una sección`))
    pasos++
    ;(p.abrir || []).forEach((a) => {
      abrires++
      if (a.h) return assert.ok(CAT.HERRAMIENTAS[a.h], `herramienta ${a.h}`)
      assert.ok(CAT.SECCIONES[a.s], `sección ${a.s}`)
      if (!a.num) return
      assert.equal(a.num.charAt(1), String(F.id), `F${F.id}·P${p.n}: la hoja ${a.num} es de la fase`)
      const hay = catalogoDe(a.s).filter((h) => h.num === a.num && a.nom.test(h.nom))
      assert.equal(hay.length, 1, `F${F.id}·P${p.n} → ${a.s} ${a.num} ${a.nom}: ${hay.length} hoja(s) en el compilado (${catalogoDe(a.s).filter((h) => h.num === a.num).map((h) => h.nom).join(' | ') || 'ninguna con ese número'})`)
    })
  })
})
// La Visión Horizontal 2020: 7 · 17 · 8 · 8 · 3 · 4 · 3 pasos.
assert.deepEqual(CAT.FASES.map((F) => F.pasos.length), [7, 17, 8, 8, 3, 4, 3])

// Botones reales: cada herramienta y cada sección.
const textos = [...js.matchAll(/"([^"\\]{2,60})"/g)].map((m) => m[1])
for (const [k, T] of Object.entries(CAT.HERRAMIENTAS)) {
  const re = new RegExp(T.boton.source.replace(/^\^\\W\*/, '').replace(/\$$/, ''), 'i')
  assert.ok(textos.some((t) => re.test(t)) || js.search(re) > 0, `herramienta ${k} (${T.boton}) tiene botón en el compilado`)
}
for (const [k, S] of Object.entries(CAT.SECCIONES)) {
  assert.ok(textos.some((t) => S.boton.test(t)), `sección ${k} tiene botón`)
  if (S.pestana) assert.ok(textos.some((t) => S.pestana.test(t)), `sección ${k} tiene pestaña ${S.pestana}`)
}

CAT.PROFESOR.forEach((p, i) => {
  assert.equal(p.n, i + 1)
  assert.ok(p.ia && p.ia.tit && (p.ia.pide || p.ogo), `paso ${p.n} del profesor con su pedido a la IA`)
  ;(p.abrir || []).forEach((a) => { if (a.h) assert.ok(CAT.HERRAMIENTAS[a.h], `herramienta ${a.h}`); else assert.ok(CAT.SECCIONES[a.s]) })
})
assert.equal(CAT.PROFESOR.length, 10)
assert.ok(CAT.PROFESOR.some((p) => p.escalon))
assert.ok(/CMOC/.test(CAT.PROFESOR[3].nom) && /calcos/i.test(CAT.PROFESOR[2].nom), 'el CMOC va después de los calcos')
assert.deepEqual(CAT.PROFESOR[3].abrir.map((a) => a.h), ['cmoc', 'analisisIA'])
assert.equal(CAT.PROFESOR.filter((p) => p.ogo).length, 1, 'un solo paso saca la OGO con anexos')
assert.ok(CAT.PROFESOR.find((p) => p.organizaciones), 'el paso de unidades inserta organizaciones')
assert.ok(/btn-cmoc-abrir/.test(js) && /"🪖 CMOC"/.test(js), 'el editor CMOC tiene su botón en el compilado')
assert.deepEqual(CAT.FOCOS.map((f) => f.id), ['pmtd', 'g1', 'g2', 'g3', 'g4', 'g5'])
CAT.FOCOS.forEach((f) => { assert.ok(f.nom && f.pide && f.deja, `foco ${f.id}`); f.secs.forEach((s) => assert.ok(CAT.SECCIONES[s])) })
assert.equal(CAT.ANEXOS_OGO.length, 8)
CAT.ANEXOS_OGO.forEach((a) => assert.ok(CAT.SECCIONES[a.sec]))
assert.match(html, /modalidad\/ia-profesor\.js/)
new vm.Script(fs.readFileSync(path.join(RAIZ, 'modalidad/ia-profesor.js'), 'utf8'))
assert.equal(CAT.ESCALONES.length, 4)
assert.deepEqual(CAT.ESCALONES.map((e) => e.id), ['fftt', 'ce', 'div', 'brig'])

console.log(`modalidad.cjs OK — 7 fases, ${pasos} pasos, ${abrires} «Abrir», ${CAT.PROFESOR.length} pasos del profesor; hojas del compilado: Cmte ${CATS.cmte.length}, JEM ${CATS.jem.length}, G-3 ${CATS.g3.length}, genérico ${CATS.generico.length}`)
