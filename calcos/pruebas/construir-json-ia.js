// Arma el compilado nuevo de la Mesa: index-fuegos-fase-20261024.js + reemplazos-2026-10-24-json-ia.js.
//   node construir-json-ia.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-fuegos-fase-20261024.js')
const lista = require('./reemplazos-2026-10-24-json-ia')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-json-ia-20261024.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
