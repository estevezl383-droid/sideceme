// Arma el compilado nuevo de la Mesa: index-areas-logisticas-20261029.js + reemplazos-2026-10-29-ogo.js.
//   node construir-ogo.js
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const cambios = require('./reemplazos-2026-10-29-ogo')
const assets = path.resolve(__dirname, '../assets')
const anterior = 'index-areas-logisticas-20261029.js'
const nuevo = 'index-ogo-20261029.js'
const SHA_ANTERIOR = '01d5ef175f0304651a3d7cf6a9df66c751a64cf1abf0ea436de51c40344fb05a'
const original = fs.readFileSync(path.join(assets, anterior), 'utf8')
if (crypto.createHash('sha256').update(original).digest('hex') !== SHA_ANTERIOR) throw Error('Cambió el compilado anterior.')
let salida = original
for (const c of cambios) {
  const n = salida.split(c.viejo).length - 1
  if (n !== c.veces) throw Error(`«${c.nombre}»: se esperaban ${c.veces} coincidencia(s) y hay ${n}.`)
  salida = salida.split(c.viejo).join(c.nuevo)
}
let reversa = salida
for (const c of [...cambios].reverse()) reversa = reversa.split(c.nuevo).join(c.viejo)
if (reversa !== original) throw Error('El cambio no es reversible byte por byte.')
const indice = path.resolve(__dirname, '../index.html')
let html = fs.readFileSync(indice, 'utf8')
if (!html.includes(anterior) && !html.includes(nuevo)) throw Error('Cambió el compilado activo.')
html = html.replace(/index-areas-logisticas-20261029\.js(\?v=[^"]*)?/, `${nuevo}?v=20261029-ogo`).replace(/index-ogo-20261029\.js\?v=[^"]*/, `${nuevo}?v=20261029-ogo`)
fs.writeFileSync(path.join(assets, nuevo), salida)
fs.writeFileSync(indice, html)
console.log(`${nuevo}: ${cambios.length} cambios reversibles`)
