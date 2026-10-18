// Arma el compilado nuevo de la Mesa: index-huellas-20261016.js + reemplazos-2026-10-18-seleccionar.js.
//   node construir-seleccionar.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-huellas-20261016.js')
const lista = require('./reemplazos-2026-10-18-seleccionar')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-seleccionar-20261018.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
