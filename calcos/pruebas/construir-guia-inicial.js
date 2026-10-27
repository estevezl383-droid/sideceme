// Arma el compilado nuevo de la Mesa: index-guia-plan-20261027.js + reemplazos-2026-10-27-guia-inicial.js.
//   node construir-guia-inicial.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-guia-plan-20261027.js')
const lista = require('./reemplazos-2026-10-27-guia-inicial')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-guia-inicial-20261027.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
