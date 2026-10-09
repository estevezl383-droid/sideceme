// Arma el compilado nuevo de la Mesa: index-unidades-20261009.js + reemplazos-2026-09-29-membrete.js.
// Cada «viejo» tiene que aparecer exactamente «veces» veces; el nombre del archivo nuevo
// es index-membrete-20261009.js. Imprime el nombre para ponerlo en calcos/index.html.
//
//   node construir-membrete.js
const fs = require('fs')
const path = require('path')

const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-unidades-20261009.js')
const lista = require('./reemplazos-2026-09-29-membrete')

let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-membrete-20261009.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
