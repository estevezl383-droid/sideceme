// El compilado que carga calcos/index.html es el anterior (index-4OsERrlJ.js)
// MÁS los reemplazos de reemplazos-2026-09-27.js, y nada más:
//   · cada reemplazo aparece las veces esperadas,
//   · deshaciéndolos se vuelve BYTE POR BYTE al compilado anterior (SHA-256).
//
//   node reemplazos-compilado.js [compilado.js]
const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const { vigente } = require('./extraer')
const lista = require('./reemplazos-2026-09-27')

// SHA-256 de calcos/assets/index-4OsERrlJ.js (commit 296803f, antes de estos cambios).
const ANTERIOR = 'e0eb0446b949f70fcd76d273d048a772d125149f7475d5f58b8354228ff01041'

const archivo = process.argv[2] || vigente()
let src = fs.readFileSync(archivo, 'utf8')
console.log(`\nCompilado: ${archivo.replace(/.*calcos\//, 'calcos/')} · ${lista.length} reemplazos\n`)

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

caso('Cada reemplazo está en el compilado las veces previstas', () => {
  const mal = lista.filter((p) => src.split(p.nuevo).length - 1 !== p.veces).map((p) => p.nombre)
  assert.deepStrictEqual(mal, [])
})

caso('Deshaciendo los reemplazos se vuelve byte por byte al compilado anterior', () => {
  for (const p of [...lista].reverse()) src = src.split(p.nuevo).join(p.viejo)
  assert.strictEqual(crypto.createHash('sha256').update(src).digest('hex'), ANTERIOR)
})

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
