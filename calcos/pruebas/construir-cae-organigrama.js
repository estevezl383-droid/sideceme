// Arma el compilado nuevo de la Mesa: index-fases-log-20261108.js + reemplazos-2026-11-10-cae-organigrama.js
// = index-cae-organigrama-20261110.js, y lo pone en calcos/index.html.
//   node construir-cae-organigrama.js
const fs = require('fs'), path = require('path'), crypto = require('crypto')
const cambios = require('./reemplazos-2026-11-10-cae-organigrama')
const assets = path.resolve(__dirname, '../assets'), anterior = 'index-fases-log-20261108.js', nuevo = 'index-cae-organigrama-20261110.js'
const original = fs.readFileSync(path.join(assets, anterior), 'utf8')
const SHA_ANTERIOR = crypto.createHash('sha256').update(fs.readFileSync(path.join(assets, anterior))).digest('hex')
if (SHA_ANTERIOR !== '3db73494fa7b11e3050b0c81597a826bdca015ec25cf905d1b35d357bcd81228') throw Error('Cambió el compilado anterior.')
let salida = original
for (const c of cambios) {
  const n = salida.split(c.viejo).length - 1
  if (n !== c.veces) throw Error(`${c.nombre}: se esperaban ${c.veces}, hay ${n}`)
  if (salida.includes(c.nuevo)) throw Error(`${c.nombre}: lo nuevo ya estaba (no sería reversible)`)
  salida = salida.split(c.viejo).join(c.nuevo)
}
let reversa = salida
for (const c of [...cambios].reverse()) reversa = reversa.split(c.nuevo).join(c.viejo)
if (reversa !== original) throw Error('El cambio no es reversible byte por byte.')
const indice = path.resolve(__dirname, '../index.html')
let html = fs.readFileSync(indice, 'utf8')
if (!html.includes(anterior) && !html.includes(nuevo)) throw Error('Cambió el compilado activo.')
html = html.replace(/assets\/index-(fases-log-20261108|cae-organigrama-20261110)\.js\?v=[^"]*/, `assets/${nuevo}?v=20261110-cae-organigrama`)
fs.writeFileSync(path.join(assets, nuevo), salida)
fs.writeFileSync(indice, html)
console.log(`${nuevo}: ${cambios.length} cambios reversibles · anterior ${SHA_ANTERIOR} · sha256 ${crypto.createHash('sha256').update(salida).digest('hex')}`)
