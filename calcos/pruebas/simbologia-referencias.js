// Catálogo de simbología (calcos/academico/catalogo-simbologia.js): cada ficha
// tiene referencia comprobable o dice que no la tiene, ninguna figura verificada
// sin documento y página, y las citas son las que de verdad trae el código.
//
// Los catálogos de dibujo (piezas, magnitudes, armas, obstáculos, tareas) se
// sacan TAL CUAL del compilado que carga calcos/index.html.
//
//   cd calcos/pruebas && npm install && node simbologia-referencias.js
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { vigente } = require('./extraer')
const { cargarConDependencias } = require('./extraer-con-dependencias')
const K = require('../academico/catalogo-simbologia.js')

const archivo = process.argv[2] || vigente()
const src = fs.readFileSync(archivo, 'utf8')
const S = cargarConDependencias(archivo, ['pLe', 'fl', 'T1', 'Nm', 'zg', 'vU'], (c) => c.zg.map((t) => t.svg))
const cat = K.construirCatalogo({ pLe: S.pLe, fl: S.fl, T1: S.T1, Nm: S.Nm, zg: S.zg })
console.log(`\nCompilado: ${archivo.replace(/.*calcos\//, 'calcos/')} · ${cat.fichas.length} fichas en ${cat.laminas.length} láminas\n`)

let fallas = 0
function caso(nombre, fn) {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}

caso('Cada ficha tiene denominación, imagen, referencia con su origen y estado de verificación', () => {
  assert.deepStrictEqual(K.revisarReferencias(cat.fichas), [])
})

caso('Ninguna ficha figura verificada: no se tuvo el reglamento a la vista', () => {
  const v = cat.fichas.filter((f) => f.verificacion.estado === 'verificado')
  assert.deepStrictEqual(v.map((f) => f.id), [])
})

caso('Sin reglamento a la vista no hay explicación doctrinaria redactada', () => {
  assert.deepStrictEqual(cat.fichas.filter((f) => f.explicacion).map((f) => f.id), [])
})

caso('Están todos los símbolos que dibuja la Mesa, sin inventar ninguno', () => {
  const n = (l) => cat.laminas.find((x) => x.id === l).fichas.length
  assert.strictEqual(n('abreviados'), S.pLe.length)
  assert.strictEqual(n('magnitud'), S.fl.length)
  assert.strictEqual(n('armas'), S.T1.filter((a) => a.id !== 'ninguna').length)
  assert.strictEqual(n('obstaculos'), Object.keys(S.Nm).length)
  assert.strictEqual(n('tareas'), S.zg.length)
  // La denominación es el nombre con que la Mesa ya muestra el símbolo.
  for (const p of S.pLe) assert.ok(cat.fichas.some((f) => f.id === `abreviados:${p.id}` && f.denominacion === p.nom), p.id)
})

caso('La cita de los símbolos abreviados es, letra por letra, la que muestra la Mesa (EAA-15-29, Figura 6)', () => {
  const r = K.REF.eaa1529fig6
  assert.strictEqual(`${r.documento}, ${r.apartado}`, S.vU)
  for (const f of cat.fichas.filter((x) => x.lamina === 'abreviados')) assert.strictEqual(f.referencia.apartado, 'Figura 6 — Símbolos de Unidad Abreviados')
})

caso('Las otras citas están en el código tal como se declaran', () => {
  assert.ok(src.includes('Plan de barreras (RC-02-114)'), 'RC-02-114 en la Mesa')
  assert.ok(src.includes('Tareas tácticas (RC-02-108)'), 'RC-02-108 en la Mesa')
  const sideceme = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8')
  assert.ok(sideceme.includes('Reglamento EAA-15-07 / RC-02-15'), 'EAA-15-07 / RC-02-15 en SIDECEME')
})

caso('Lo que la Mesa no respalda con reglamento queda como «no verificable»', () => {
  for (const f of cat.laminas.find((l) => l.id === 'agrupacion').fichas) {
    assert.strictEqual(f.verificacion.estado, 'no-verificable', f.id)
    assert.strictEqual(f.referencia.documento, null, f.id)
  }
})

caso('La «cruz negra»: lo que dijo el docente (plan de blancos), marcado como no verificado en el reglamento', () => {
  const f = cat.fichas.find((x) => x.id === 'pendientes:cruz-negra')
  assert.ok(f, 'no está la ficha')
  assert.strictEqual(f.verificacion.estado, 'no-verificable')
  assert.strictEqual(f.explicacion, null, 'no es explicación del reglamento')
  assert.strictEqual(f.referencia.documento, null)
  assert.match(f.segunDocente, /plan de blancos/)
  assert.match(f.referencia.origen, /Indicación del docente/)
  assert.match(f.verificacion.falta, /reglamento de simbología/)
})

caso('Las láminas no llevan carta ni coordenadas: ninguna ficha trae posición', () => {
  const conPosicion = cat.fichas.filter((f) => /"(lat|lng|coords|centro)"/.test(JSON.stringify(f.imagen)))
  assert.deepStrictEqual(conPosicion.map((f) => f.id), [])
})

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
