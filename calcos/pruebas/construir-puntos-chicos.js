// Arma el compilado nuevo de la Mesa: index-tareas-chicas-20261023.js + reemplazos-2026-10-23-puntos-chicos.js.
//   node construir-puntos-chicos.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-tareas-chicas-20261023.js')
const lista = require('./reemplazos-2026-10-23-puntos-chicos')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-puntos-chicos-20261023.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
