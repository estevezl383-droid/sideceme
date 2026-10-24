// Arma el compilado nuevo de la Mesa: index-posiciones-fase-20261024.js + reemplazos-2026-10-24-todas-fichas.js.
//   node construir-todas-fichas.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-posiciones-fase-20261024.js')
const lista = require('./reemplazos-2026-10-24-todas-fichas')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-todas-fichas-20261024.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
