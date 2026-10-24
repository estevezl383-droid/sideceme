// Arma el compilado nuevo de la Mesa: index-suelo-20261023.js + reemplazos-2026-10-23-editar-tareas.js.
//   node construir-editar-tareas.js
const fs = require('fs')
const path = require('path')
const ANTERIOR = path.join(__dirname, '..', 'assets', 'index-suelo-20261023.js')
const lista = require('./reemplazos-2026-10-23-editar-tareas')
let src = fs.readFileSync(ANTERIOR, 'utf8')
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
const nombre = 'index-editar-tareas-20261023.js'
fs.writeFileSync(path.join(__dirname, '..', 'assets', nombre), src)
console.log(nombre)
