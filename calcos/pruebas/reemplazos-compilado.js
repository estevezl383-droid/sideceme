// El compilado que carga calcos/index.html es una cadena de compilados, cada
// uno el anterior MÁS su lista de reemplazos, y nada más:
//   index-4OsERrlJ.js + reemplazos-2026-09-27.js = index-sxnJI1Ur.js
//   index-sxnJI1Ur.js + reemplazos-2026-09-28.js = index-zhbwncsH.js
//   index-zhbwncsH.js + integrar-conceptos.cjs = index-conceptos-20260928.js
//   index-conceptos-20260928.js + reemplazos-2026-09-28-fuegos.js = index-nQKdqwIj.js
//   index-nQKdqwIj.js + reemplazos-2026-09-28-conceptos-ia.js = index-6Gm5UQ97.js
//   index-6Gm5UQ97.js + reemplazos-2026-09-29-conceptos-v3.js = index-nDtcWpLo.js
//   index-nDtcWpLo.js + reemplazos-2026-09-29-conceptos-v4.js = index-ucOhdPbL.js
//   index-ucOhdPbL.js + reemplazos-2026-09-29-riesgo.js = index-5bpBlYsz.js
//   … (pasos de construir-*.py) …
//   index-oca-militar-20261001.js + reemplazos-2026-10-01-reconocimiento.js = index-reconocimiento-20261001.js
//   index-reconocimiento-20261001.js + reemplazos-2026-10-02-logistica.js = index-logistica-20261002.js
//   index-logistica-20261002.js + reemplazos-2026-10-03-estado-mayor.js = index-personal-20261003.js
//   index-personal-20261003.js + reemplazos-2026-10-03-lector.js = index-lector-20261003.js
//   index-lector-20261003.js + reemplazos-2026-10-03-g5.js = index-g5-20261003.js
//   index-g5-20261003.js + reemplazos-2026-10-03-coordenadas.js = index-coordenadas-20261003.js (el vigente)
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
    lista: require('./reemplazos-2026-10-03-coordenadas'),
    nombre: 'reemplazos-2026-10-03-coordenadas',
    // calcos/assets/index-g5-20261003.js (merge 2c206f4, antes de estos cambios).
    anterior: '36338e67018d462156e06de6c1dc8911e82093bd0b66affd0a50020991950efc',
  },
  {
    lista: require('./reemplazos-2026-10-03-g5'),
    nombre: 'reemplazos-2026-10-03-g5',
    // calcos/assets/index-lector-20261003.js (merge 79e5252, antes de estos cambios).
    anterior: '3fef83ee731be3471b9acae79feac08c7fad4690be7eaf4302609ec970dbf245',
  },
  {
    lista: require('./reemplazos-2026-10-03-lector'),
    nombre: 'reemplazos-2026-10-03-lector',
    // calcos/assets/index-personal-20261003.js (merge f3fd423, antes de estos cambios).
    anterior: '7e516566aad27315745a4a86f8025097c2ddc796e5be12e83a0a4b0d3189c540',
  },
  {
    lista: require('./reemplazos-2026-10-03-estado-mayor'),
    nombre: 'reemplazos-2026-10-03-estado-mayor',
    // calcos/assets/index-logistica-20261002.js (commit d4bd001, antes de estos cambios).
    anterior: '3c04918bdfc4e071f53d6f0fb51fb49198b7f9e898b135b17bb2808efc37c820',
  },
  {
    lista: require('./reemplazos-2026-10-02-logistica'),
    nombre: 'reemplazos-2026-10-02-logistica',
    // calcos/assets/index-reconocimiento-20261001.js (commit b595504, antes de estos cambios).
    anterior: '14d4554f94f4414304039bf89dc5e6c9f22179b81a98ddf672f022155841443a',
  },
  {
    lista: require('./reemplazos-2026-10-01-reconocimiento'),
    nombre: 'reemplazos-2026-10-01-reconocimiento',
    // calcos/assets/index-oca-militar-20261001.js (commit 48da26a, antes de estos cambios).
    // Entre éste y el de riesgo hay pasos armados con construir-*.py (formato militar,
    // fichas, ejes…) que todavía no están en esta cadena.
    anterior: '604c8a4760bdb8b8e4c41f9db19c4a522b14c1c1faa5fed1ea6b20c3a1738a85',
  },
  {
    lista: require('./reemplazos-2026-09-29-riesgo'),
    nombre: 'reemplazos-2026-09-29-riesgo',
    // calcos/assets/index-ucOhdPbL.js (commit 1fcdfb0, antes de estos cambios).
    anterior: 'b9c3a174f6cb93b9a42100fefb671a179308851f270db1481669e299c607b346',
  },
  {
    lista: require('./reemplazos-2026-09-29-conceptos-v4'),
    nombre: 'reemplazos-2026-09-29-conceptos-v4',
    // calcos/assets/index-nDtcWpLo.js (commit 9ce1acb, antes de estos cambios).
    anterior: '9c3b5c5a92e8e4ab52d9c8d6f713166442f63370e27d9d85b3b60dd95672cbb3',
  },
  {
    lista: require('./reemplazos-2026-09-29-conceptos-v3'),
    nombre: 'reemplazos-2026-09-29-conceptos-v3',
    // calcos/assets/index-6Gm5UQ97.js (commit 21ff394, antes de estos cambios).
    anterior: 'e869b9510f7be1a8107baa8ce02e903f797e193789b2542e85bafe5e64b10f87',
  },
  {
    lista: require('./reemplazos-2026-09-28-conceptos-ia'),
    nombre: 'reemplazos-2026-09-28-conceptos-ia',
    // calcos/assets/index-nQKdqwIj.js (commit 849d876, antes de estos cambios).
    anterior: '9fe40a76ac088eab81fdcaed6c65f75e401116d9b084c580c5e6906dc36e917b',
  },
  {
    lista: require('./reemplazos-2026-09-28-fuegos'),
    nombre: 'reemplazos-2026-09-28-fuegos',
    // calcos/assets/index-conceptos-20260928.js (commit d8c94f4, antes de estos cambios).
    anterior: '9a3b1d285b4a1e1e9196250f99c43f29c78c4a49a03fd4ca70073de3265ed7f7',
  },
  {
    // Conceptos entrelazados (codex/conceptos-graficos-20260928): su lista vive en integrar-conceptos.cjs.
    lista: require('./integrar-conceptos.cjs').cambios.map(([viejo, nuevo], i) => ({ nombre: `conceptos ${i + 1}`, viejo, nuevo, veces: 1 })),
    nombre: 'integrar-conceptos',
    // calcos/assets/index-zhbwncsH.js (commit d9230e6).
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
