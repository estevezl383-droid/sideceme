// Arma el compilado nuevo de la Mesa: index-seleccionar-20261018.js + reemplazos-2026-10-19-linea-tiempo.js.
//   node construir-linea-tiempo.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-seleccionar-20261018.js')
const lista = require('./reemplazos-2026-10-19-linea-tiempo')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-linea-tiempo-20261019.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
