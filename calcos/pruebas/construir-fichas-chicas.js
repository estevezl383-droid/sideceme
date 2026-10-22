// Arma el compilado nuevo de la Mesa: index-concepto-20261022.js + reemplazos-2026-10-22-fichas-chicas.js.
//   node construir-fichas-chicas.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-concepto-20261022.js')
const lista = require('./reemplazos-2026-10-22-fichas-chicas')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-fichas-chicas-20261022.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
