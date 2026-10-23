// Arma el compilado nuevo de la Mesa: index-puntos-chicos-20261023.js + reemplazos-2026-10-23-suelo.js.
//   node construir-suelo.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-puntos-chicos-20261023.js')
const lista = require('./reemplazos-2026-10-23-suelo')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-suelo-20261023.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
