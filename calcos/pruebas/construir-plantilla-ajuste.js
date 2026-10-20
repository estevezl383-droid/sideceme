// Arma el compilado nuevo de la Mesa: index-rotulo-avenidas-20261019.js + reemplazos-2026-10-20-plantilla-ajuste.js.
//   node construir-plantilla-ajuste.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-rotulo-avenidas-20261019.js')
const lista = require('./reemplazos-2026-10-20-plantilla-ajuste')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-plantilla-ajuste-20261020.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
