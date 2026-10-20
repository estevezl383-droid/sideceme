// Arma el compilado nuevo de la Mesa: index-ht19-fases-20261020.js + reemplazos-2026-10-20-ains-acostar.js.
//   node construir-ains-acostar.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-ht19-fases-20261020.js')
const lista = require('./reemplazos-2026-10-20-ains-acostar')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-ains-acostar-20261020.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
