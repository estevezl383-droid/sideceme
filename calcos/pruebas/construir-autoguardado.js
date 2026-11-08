const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto')
const cambios = require('./reemplazos-2026-11-08-autoguardado')
const assets = path.resolve(__dirname, '../assets'), anterior = 'index-pd-corta-20261108.js', nuevo = 'index-autoguardado-20261108.js'
const original = fs.readFileSync(path.join(assets, anterior), 'utf8')
const SHA_ANTERIOR = crypto.createHash('sha256').update(fs.readFileSync(path.join(assets, anterior))).digest('hex')
if (SHA_ANTERIOR !== '5266fe3fd5a4a9d11ef826f4a97f21bde1740c40b53597aaedffb978c31bdf1b') throw Error('Cambió el compilado anterior.')
let salida = original
for (const c of cambios) {
  const n = salida.split(c.viejo).length - 1
  if (n !== c.veces) throw Error(`${c.nombre}: se esperaban ${c.veces}, hay ${n}`)
  salida = salida.split(c.viejo).join(c.nuevo)
}
let reversa = salida
for (const c of [...cambios].reverse()) reversa = reversa.split(c.nuevo).join(c.viejo)
if (reversa !== original) throw Error('El cambio no es reversible byte por byte.')
const indice = path.resolve(__dirname, '../index.html')
let html = fs.readFileSync(indice, 'utf8')
if (!html.includes(anterior) && !html.includes(nuevo)) throw Error('Cambió el compilado activo.')
html = html.replace(/assets\/index-(kmz|fichas-to|cortada|pd-corta|autoguardado)-20261108\.js\?v=[^"]*/, `assets/${nuevo}?v=20261108-autoguardado`)
fs.writeFileSync(path.join(assets, nuevo), salida)
fs.writeFileSync(indice, html)
console.log(`${nuevo}: ${cambios.length} cambios reversibles · anterior ${SHA_ANTERIOR} · sha256 ${crypto.createHash('sha256').update(salida).digest('hex')}`)
