// El compilado que carga calcos/index.html es una cadena de compilados, cada
// uno el anterior MÁS su lista de reemplazos, y nada más:
//   index-4OsERrlJ.js + reemplazos-2026-09-27.js = index-sxnJI1Ur.js
//   index-sxnJI1Ur.js + reemplazos-2026-09-28.js = index-zhbwncsH.js
//   index-zhbwncsH.js + reemplazos-2026-09-28-fuegos.js = index-BXOEzGCi.js (el vigente)
// Del vigente hacia atrás, para cada paso:
//   · cada reemplazo aparece las veces esperadas,
//   · deshaciéndolos se vuelve BYTE POR BYTE al compilado anterior (SHA-256).
//
//   node reemplazos-compilado.js [compilado.js]
const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const { vigente } = require('./extraer')

// Del más nuevo al más viejo. `anterior`: SHA-256 del compilado antes de la lista.
const PASOS = [
  {
    lista: require('./reemplazos-2026-09-28-fuegos'),
    nombre: 'reemplazos-2026-09-28-fuegos',
    // calcos/assets/index-zhbwncsH.js (commit d9230e6, antes de estos cambios).
    anterior: 'ce16f09dcb0768f0436d2ddf723f327d5446bd69020309dc2569bc6d99f71872',
  },
  {
    lista: require('./reemplazos-2026-09-28'),
    nombre: 'reemplazos-2026-09-28',
    // calcos/assets/index-sxnJI1Ur.js (commit 68c1c78, antes de estos cambios).
    anterior: 'b319c923552bc3f2e32d1407b30cb5fda4a034b76f31e7cca519155322368990',
  },
  {
    lista: require('./reemplazos-2026-09-27'),
    nombre: 'reemplazos-2026-09-27',
    // calcos/assets/index-4OsERrlJ.js (commit 296803f, antes de estos cambios).
    anterior: 'e0eb0446b949f70fcd76d273d048a772d125149f7475d5f58b8354228ff01041',
  },
]

const archivo = process.argv[2] || vigente()
let src = fs.readFileSync(archivo, 'utf8')
console.log(`\nCompilado: ${archivo.replace(/.*calcos\//, 'calcos/')} · ${PASOS.map((p) => `${p.nombre} (${p.lista.length})`).join(' · ')}\n`)

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

for (const paso of PASOS) {
  caso(`${paso.nombre}: cada reemplazo está en el compilado las veces previstas`, () => {
    const mal = paso.lista.filter((p) => src.split(p.nuevo).length - 1 !== p.veces).map((p) => p.nombre)
    assert.deepStrictEqual(mal, [])
  })

  caso(`${paso.nombre}: deshaciéndolos se vuelve byte por byte al compilado anterior`, () => {
    for (const p of [...paso.lista].reverse()) src = src.split(p.nuevo).join(p.viejo)
    assert.strictEqual(crypto.createHash('sha256').update(src).digest('hex'), paso.anterior)
  })
}

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
