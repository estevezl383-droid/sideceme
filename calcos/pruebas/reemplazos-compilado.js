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
//   index-g5-20261003.js + reemplazos-2026-10-03-coordenadas.js = index-coordenadas-20261003.js
//   index-coordenadas-20261003.js + reemplazos-2026-10-03-respuestas.js = index-respuestas-20261003.js
//   index-respuestas-20261003.js + reemplazos-2026-10-03-trazos.js = index-trazos-20261003.js
//   index-trazos-20261003.js + reemplazos-2026-10-03-edicion.js = index-edicion-20261003.js
//   index-edicion-20261003.js + reemplazos-2026-10-03-tablero-g4.js = index-tablero-g4-20261003.js
//   index-tablero-g4-20261003.js + reemplazos-2026-10-06-prc.js = index-prc-20261006.js
//   index-prc-20261006.js + reemplazos-2026-10-06-organizacion.js = index-organizacion-20261006.js
//   index-organizacion-20261006.js + reemplazos-2026-10-08-areas.js = index-areas-20261008.js
//   index-areas-20261008.js + reemplazos-2026-10-09-frentes.js = index-areas-20261009.js
//   … + reemplazos-2026-10-09-unidades.json = index-unidades-20261009.js
//   index-unidades-20261009.js + reemplazos-2026-09-29-membrete.js = index-membrete-20261009.js
//   index-membrete-20261009.js + reemplazos-2026-10-09-divmec.js = index-divmec-20261009.js
//   index-divmec-20261009.js + reemplazos-2026-10-09-fichas.js = index-fichas-20261009.js
//   index-fichas-20261009.js + reemplazos-2026-10-10-pedido.js = index-pedido-20261010.js (el vigente)
// Del vigente hacia atrás, para cada paso:
//   · cada reemplazo aparece las veces esperadas,
//   · deshaciéndolos se vuelve BYTE POR BYTE al compilado anterior (SHA-256).
//
//   node reemplazos-compilado.js [compilado.js]
const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { vigente } = require('./extraer')

// Del más nuevo al más viejo. `anterior`: SHA-256 del compilado antes de la lista.
const PASOS = [
  {
    lista: require('./reemplazos-2026-10-10-pedido'),
    nombre: 'reemplazos-2026-10-10-pedido',
    // calcos/assets/index-fichas-20261009.js (antes del pedido con la tarea al principio).
    anterior: 'b70ae3085835ba65068d7cdc3edfdd69f37abfc5a6f3bc3ed1f94b1ddd278783',
  },
  {
    lista: require('./reemplazos-2026-10-09-fichas'),
    nombre: 'reemplazos-2026-10-09-fichas',
    // calcos/assets/index-divmec-20261009.js (antes de agrandar las fichas).
    anterior: '00222b66f173ecc68d4998de3abda1a0b2be79652f9ca6a09dd1138870178293',
  },
  {
    lista: require('./reemplazos-2026-10-09-divmec'),
    nombre: 'reemplazos-2026-10-09-divmec',
    // calcos/assets/index-membrete-20261009.js (antes de «somos la DIV.MEC.-1»).
    anterior: 'cd1c2f619e9045be69980acabb66637295125eb87daf47e1dae070a854e63c47',
  },
  {
    lista: require('./reemplazos-2026-09-29-membrete'),
    nombre: 'reemplazos-2026-09-29-membrete',
    // calcos/assets/index-unidades-20261009.js (antes del membrete táctico).
    anterior: 'd098a722d0bae97ad06495194e7687e5fd71906c51502782c1e90ab3ba2588d7',
  },
  {lista: require('./reemplazos-2026-10-09-unidades.json'), nombre: 'reemplazos-2026-10-09-unidades', anterior: '333e0751443ed1638b69ffa8a2037d4d72beb114e1c24404a734c0c5825237b2'},
  {
    lista: require('./reemplazos-2026-10-09-frentes'),
    nombre: 'reemplazos-2026-10-09-frentes',
    // calcos/assets/index-areas-20261008.js (rehecho el 09-10-2026 sobre el index-organizacion
    // con la tercera vuelta de la F3·P3).
    anterior: 'fb8b33ed4f243799391b80da6641e9ad3a1e15cf209be266c6ee948d731a0638',
  },
  {
    lista: require('./reemplazos-2026-10-08-areas'),
    nombre: 'reemplazos-2026-10-08-areas',
    // calcos/assets/index-organizacion-20261006.js con la tercera vuelta de la F3·P3 (09-10-2026).
    anterior: '23d336b7801547dd3de4dce8bae6f64176adcbc96c600aff9a39abd0bd5b9372',
  },
  {
    lista: require('./reemplazos-2026-10-06-organizacion'),
    nombre: 'reemplazos-2026-10-06-organizacion',
    // calcos/assets/index-prc-20261006.js (merge fa2e89f, antes de estos cambios).
    anterior: 'ea31d06008e535ef6e31c997a092d3cca18f2f4d79b3adfe7e34113896432ee7',
  },
  {
    lista: require('./reemplazos-2026-10-06-prc'),
    nombre: 'reemplazos-2026-10-06-prc',
    // calcos/assets/index-tablero-g4-20261003.js (merge 6a47f53, antes de estos cambios).
    anterior: '90b846f9ce2ff4f2fb52cc638a12b1a0a4ede7d5b4e98f072106ed00f023351d',
  },
  {
    lista: require('./reemplazos-2026-10-03-tablero-g4'),
    nombre: 'reemplazos-2026-10-03-tablero-g4',
    // calcos/assets/index-edicion-20261003.js (merge 6abfbce, antes de estos cambios).
    anterior: 'e019c5b4fc943a5874aad19018f9acd8718d6dc26cc0069a808f41ccf2f98693',
  },
  {
    lista: require('./reemplazos-2026-10-03-edicion'),
    nombre: 'reemplazos-2026-10-03-edicion',
    // calcos/assets/index-trazos-20261003.js (merge ecfcb3a, antes de estos cambios).
    anterior: '21272a34de3eb8eeee2607f4d0be8612f6df2b0b7177d737e8c93978330ccc75',
  },
  {
    lista: require('./reemplazos-2026-10-03-trazos'),
    nombre: 'reemplazos-2026-10-03-trazos',
    // calcos/assets/index-respuestas-20261003.js (merge 2e56d33, antes de estos cambios).
    anterior: '82d368c7e428fe8e4a6f31e262f77dab26eb9c73585fbbbfe089fcfb30de393d',
  },
  {
    lista: require('./reemplazos-2026-10-03-respuestas'),
    nombre: 'reemplazos-2026-10-03-respuestas',
    // calcos/assets/index-coordenadas-20261003.js (merge 7802670, antes de estos cambios).
    anterior: 'ed72c0b9adf5347e9d2ddebe15e78928f8ba8a4cca0c100ac42b3345707fda68',
  },
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
    // Entre index-oca-militar-20261001.js y éste hay pasos de construir-*.py (formato militar,
    // fichas, ejes, ASDI, importador GE…) que no están en esta cadena: se retoma desde el
    // compilado guardado y se sigue comprobando hacia atrás desde ahí.
    desde: 'index-5bpBlYsz.js',
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
  if (paso.desde) src = fs.readFileSync(path.join(__dirname, '..', 'assets', paso.desde), 'utf8')
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
