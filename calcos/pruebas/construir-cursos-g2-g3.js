const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto')
const cambios = require('./reemplazos-2026-10-29-cursos')
const assets = path.resolve(__dirname, '../assets')
const anterior = 'index-vista-plegada-20261028.js', nuevo = 'index-cursos-g2-g3-20261029.js'
const original = fs.readFileSync(path.join(assets, anterior), 'utf8')
if (crypto.createHash('sha256').update(original).digest('hex') !== 'ddedff9386bf9772f8448924e2d6c8639349ba2b2b8deab486a530c687f0ed14') throw new Error('Cambió el compilado anterior.')
let salida = original
for (const c of cambios) {
  const n = salida.split(c.viejo).length - 1
  if (n !== c.veces) throw new Error(`${c.nombre}: se esperaban ${c.veces}, hay ${n}`)
  salida = salida.split(c.viejo).join(c.nuevo)
}
let reversa = salida
for (const c of [...cambios].reverse()) reversa = reversa.split(c.nuevo).join(c.viejo)
if (reversa !== original) throw new Error('El cambio no es reversible byte por byte.')
const indice = path.resolve(__dirname, '../index.html')
let html = fs.readFileSync(indice, 'utf8')
if (!html.includes(anterior) && !html.includes(nuevo)) throw new Error('Cambió el compilado activo.')
html = html.replace(anterior, nuevo).replace(/(index-cursos-g2-g3-20261029\.js)\?v=[^"]*/, '$1?v=20261029')
html = html.replace(/(\.\/fuegos\/plan-fuegos\.js)\?v=[^"]*/, '$1?v=20261029-cursos')
fs.writeFileSync(path.join(assets, nuevo), salida)
fs.writeFileSync(indice, html)
console.log(`${nuevo}: ${cambios.length} cambios reversibles`)
