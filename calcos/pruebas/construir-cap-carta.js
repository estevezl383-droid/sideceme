// Arma el compilado nuevo de la Mesa: index-cap-propios-20261024.js + reemplazos-2026-10-24-cap-carta.js.
//   node construir-cap-carta.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-cap-propios-20261024.js')
const lista = require('./reemplazos-2026-10-24-cap-carta')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-cap-carta-20261024.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
