// Arma el compilado nuevo de la Mesa: index-disgregar-20261020.js + reemplazos-2026-10-21-ain-chico.js.
//   node construir-ain-chico.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-disgregar-20261020.js')
const lista = require('./reemplazos-2026-10-21-ain-chico')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-ain-chico-20261021.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
