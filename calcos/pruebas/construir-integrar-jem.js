const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto')
const cambios = require('./reemplazos-2026-10-30-integrar-jem')
const assets = path.resolve(__dirname, '../assets'), anterior = 'index-guardar-ia-20261029.js', nuevo = 'index-integrar-jem-20261030.js'
const original = fs.readFileSync(path.join(assets, anterior), 'utf8')
if (crypto.createHash('sha256').update(original).digest('hex') !== 'e770c168bed0c622cdeb2d99354969bf155c411d08b17e53c3542e82b0670dbb') throw Error('Cambió el compilado anterior.')
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
html = html.replace(/\.\/assets\/index-guardar-ia-20261029\.js\?v=[^"]*/, './assets/' + nuevo + '?v=20261030-integrar-jem')
fs.writeFileSync(path.join(assets, nuevo), salida)
fs.writeFileSync(indice, html)
console.log(`${nuevo}: ${cambios.length} cambios reversibles`)
