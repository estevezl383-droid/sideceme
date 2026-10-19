// F1·P4 Línea Inicial de Tiempo: qué momentos lee de los documentos del ejercicio (tLe/nLe del
// compilado vigente), sin navegador. Textos FICTICIOS con la forma de la Orden de la Escuela.
//   node linea-tiempo.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const src = fs.readFileSync(path.join(__dirname, '..', 'assets', 'index-linea-tiempo-20261019.js'), 'utf8')
const i = src.indexOf('const fU="D')
const j = src.indexOf('const C0="#5ce1ff"')
assert.ok(i > 0 && j > i, 'no encontré el lector de la Orden en el compilado')
const { tLe, nLe } = new Function(`${src.slice(i, j)};return {tLe,nLe}`)()

const MEMBRETE = ['CTO', 'FF.TT. (FICT.)', 'CG. Pueblo-X. D-44 (0900)', 'EMO/SEC-III', 'No. 001/XYZ.'].join('\n')
const CUERPO = ['ORDEN DE OPERACIONES No. 01 (FICT.)', '\t\tOBJETO\t:\tOperaciones defensivas (FICT.) en la Primera Campaña (D a D+15).', 'II.- MISIÓN.', 'Las FF.TT. (FICT.) defienden, a partir del D (0400) y hasta el D+15 (1800), el sector entre la LDE-1 y la LDE-2.'].join('\n')
const ANEXO = `${MEMBRETE}\nANEXO «H» (Plan de Personal) A LA ORDEN DE OPERACIONES No. 01 (FICT.)\n${'Texto del anexo. '.repeat(10)}`

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${e.message}`)
  }
}
const tres = (c) => [c.recepcion, c.inicioOperacion, c.finOperaciones]

caso('la Orden del Word: membrete y misión', () => assert.deepEqual(tres(tLe(`${MEMBRETE}\n${CUERPO}`).campos), ['D-44 (0900)', 'D (0400)', 'D+15 (1800)']))
caso('un .md con restos de formato (D\\-44, **negrita**)', () => {
  const md = `${MEMBRETE.replace('CG. Pueblo-X.', '**CG. Pueblo-X.**').replace('D-44', 'D\\-44')}\n\n${CUERPO.replace(/D\+15/g, 'D\\+15')}`
  assert.deepEqual(tres(tLe(md).campos), ['D-44 (0900)', 'D (0400)', 'D+15 (1800)'])
})
caso('el membrete después de los primeros 1200 caracteres', () => assert.equal(tLe(`${'Texto previo. '.repeat(120)}\n${MEMBRETE}\n${CUERPO}`).campos.recepcion, 'D-44 (0900)'))
caso('sin membrete, la fecha de la MISIÓN no se toma como recepción', () => {
  const r = tLe(CUERPO)
  assert.equal(r.campos.recepcion, undefined)
  assert.ok(r.falta.includes('recepción de la orden'))
})
caso('lo que falta en la Orden sale de otro documento (y dice de cuál)', () => {
  const r = nLe([{ nombre: 'ORDEN.md', categoria: 'orden', texto: CUERPO }, { nombre: 'Anexo H.md', categoria: 'orden', texto: ANEXO }])
  assert.deepEqual(tres(r.campos), ['D-44 (0900)', 'D (0400)', 'D+15 (1800)'])
  assert.deepEqual(r.falta, [])
  assert.match(r.evidencias.find((e) => e.campo === 'recepcion').linea, /Anexo H\.md/)
})
caso('con la Orden completa no se mira ningún otro documento', () => {
  const r = nLe([{ nombre: 'ORDEN.md', categoria: 'orden', texto: `${MEMBRETE}\n${CUERPO}` }, { nombre: 'Anexo H.md', categoria: 'orden', texto: ANEXO.replace('D-44', 'D-40') }])
  assert.equal(r.campos.recepcion, 'D-44 (0900)')
  assert.ok(!r.evidencias.some((e) => /Anexo/.test(e.linea)))
})
caso('una línea larga del cuerpo con CG. no es el membrete', () => assert.equal(tLe(`${'Texto. '.repeat(500)}\nEl CG. de la División se desplaza el D+3 (1700) hacia el nuevo puesto, con todo su personal y los medios de comunicaciones.`).campos.recepcion, undefined))
caso('sin fechas en ningún documento', () => assert.equal(nLe([{ nombre: 'x', categoria: 'orden', texto: 'Texto sin fechas. '.repeat(5) }]).falta.length, 3))

if (fallas) {
  console.log(`\n${fallas} caso(s) fallaron.`)
  process.exit(1)
}
console.log('\nOK: la Línea de Tiempo lee los momentos de todos los documentos del ejercicio.')
