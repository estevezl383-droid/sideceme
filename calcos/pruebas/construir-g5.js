// Arma el compilado nuevo de la Mesa: index-lector-20261003.js +
// reemplazos-2026-10-03-g5.js → index-g5-20261003.js, comprueba que
// deshaciendo los reemplazos se vuelve byte por byte al anterior y apunta
// calcos/index.html al compilado nuevo.
//
//   node construir-g5.js
const fs = require('fs')
const path = require('path')

const ASSETS = path.join(__dirname, '..', 'assets')
const ANTERIOR = 'index-lector-20261003.js'
const NUEVO = 'index-g5-20261003.js'
const lista = require('./reemplazos-2026-10-03-g5')

const base = fs.readFileSync(path.join(ASSETS, ANTERIOR), 'utf8')
let src = base
for (const r of lista) {
  const n = src.split(r.viejo).length - 1
  if (n !== r.veces) throw new Error(`«${r.nombre}»: se esperaban ${r.veces} coincidencia(s) y hay ${n}.`)
  src = src.split(r.viejo).join(r.nuevo)
}
let atras = src
for (const r of [...lista].reverse()) atras = atras.split(r.nuevo).join(r.viejo)
if (atras !== base) throw new Error('Deshaciendo los reemplazos no se vuelve al compilado anterior.')
fs.writeFileSync(path.join(ASSETS, NUEVO), src)
const indice = path.join(__dirname, '..', 'index.html')
const html = fs.readFileSync(indice, 'utf8')
if (html.includes(ANTERIOR)) fs.writeFileSync(indice, html.replace(ANTERIOR, NUEVO))
else if (!html.includes(NUEVO)) throw new Error('calcos/index.html no carga el compilado anterior.')
console.log(NUEVO)
